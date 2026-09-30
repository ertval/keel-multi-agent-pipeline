"""Page-geometry tests for the PDF → LLM → bbox path.

The repository ships no source PDFs, so every PDF here is synthesised in a tmp
directory with pymupdf and deleted with it. Coordinates are asserted by
containment and ordering, never by equality with the values handed to the
writer.
"""

from __future__ import annotations

import json
from pathlib import Path
from unittest.mock import MagicMock, patch

import fitz
import pytest

from keel_api.extraction.extractor import (
    _MAX_LINES_PER_PAGE,
    _MAX_PROMPT_CHARS,
    _geometry_prompt,
    _line_index,
    _page_text,
    _resolve_anchor,
    extract_charterparty_terms,
    extract_sof_events,
)
from keel_api.parsing.models import NO_BBOX, BBox, ParsedDocument, TextLine
from keel_api.parsing.pdfplumber_parser import parse_with_pdfplumber
from keel_api.parsing.pymupdf_parser import parse_with_pymupdf
from keel_api.schemas import CharterpartyTerms, ClauseCitation, SOFEvent

REPO_ROOT = Path(__file__).resolve().parents[3]
FIXTURE_DIR = REPO_ROOT / "fixtures" / "voyage_001"
TEST_CASES_DIR = REPO_ROOT / "test-cases"

PAGE_WIDTH = 612.0
PAGE_HEIGHT = 792.0

# Tolerance in points for glyph-box versus baseline-origin differences.
TOL = 3.0

CP_LINES = [
    (100.0, "Laytime allowed shall be 72 running hours, Sundays and Holidays excepted."),
    (130.0, "The demurrage rate is USD 50,000 per running day and pro rata."),
    (160.0, "Time lost on account of weather shall not count as laytime."),
    (190.0, "NOR deemed accepted six hours after tender at the port limits."),
]
SOF_LINES = [
    (100.0, "NOR Tendered 2026-06-10 08:00 Piraeus port limits"),
    (130.0, "NOR Accepted 2026-06-10 14:00 by port authority"),
    (160.0, "Loading Commenced 2026-06-10 20:00 Berth 7"),
]


def _write_pdf(path: Path, lines: list[tuple[float, str]], pages: int = 1) -> None:
    doc = fitz.open()
    for _ in range(pages):
        page = doc.new_page(width=PAGE_WIDTH, height=PAGE_HEIGHT)
        for top, text in lines:
            page.insert_text((72.0, top), text, fontsize=11)
    doc.save(str(path))
    doc.close()


@pytest.fixture(scope="module")
def geometry_pdf(tmp_path_factory: pytest.TempPathFactory) -> Path:
    path = tmp_path_factory.mktemp("geometry") / "charterparty.pdf"
    _write_pdf(path, CP_LINES)
    return path


@pytest.fixture()
def charterparty_pdf(tmp_path: Path) -> Path:
    path = tmp_path / "charterparty.pdf"
    _write_pdf(path, CP_LINES)
    return path


@pytest.fixture()
def sof_pdf(tmp_path: Path) -> Path:
    path = tmp_path / "sof_owner.pdf"
    _write_pdf(path, SOF_LINES)
    return path


def _line_for(doc: ParsedDocument, needle: str) -> TextLine:
    matches = [line for line in doc.lines if needle in line.text]
    assert matches, f"no parsed line contains {needle!r}: {[l.text for l in doc.lines]}"
    return matches[0]


def _assert_contains_anchor_point(line: TextLine, top: float, x0: float) -> None:
    assert line.bbox.x0 <= x0 + TOL, "line starts right of the written text"
    assert line.bbox.x1 >= x0, "line ends left of where the text was written"
    assert line.bbox.y0 <= top <= line.bbox.y1, "line does not span the written text"
    assert line.bbox.as_tuple() != NO_BBOX, "sentinel leaked into real geometry"
    assert 0.0 <= line.bbox.x0 and line.bbox.y1 <= PAGE_WIDTH, "outside page width"
    assert 0.0 <= line.bbox.y0 and line.bbox.y1 <= PAGE_HEIGHT, "outside page height"


def _make_openai_response(payload: dict) -> MagicMock:
    msg = MagicMock()
    msg.content = json.dumps(payload)
    choice = MagicMock()
    choice.message = msg
    resp = MagicMock()
    resp.choices = [choice]
    return resp


# ---------------------------------------------------------------------------
# Parser-side geometry
# ---------------------------------------------------------------------------


def test_pymupdf_parser_reports_real_line_geometry(charterparty_pdf: Path) -> None:
    doc = parse_with_pymupdf(charterparty_pdf)

    assert len(doc.pages) == 1
    assert "demurrage rate is USD 50,000" in doc.pages[0]
    assert len(doc.lines) == len(CP_LINES)

    for top, text in CP_LINES:
        line = _line_for(doc, text[:30])
        _assert_contains_anchor_point(line, top, 72.0)

    tops = [line.bbox.y0 for line in doc.lines]
    assert tops == sorted(tops), "lines are not in page order"
    assert [line.index for line in doc.lines] == list(range(len(doc.lines)))
    assert [line.page for line in doc.lines] == [1] * len(doc.lines)
    assert [line.anchor for line in doc.lines] == [
        f"p1L{i}" for i in range(len(doc.lines))
    ]


def test_pdfplumber_parser_reports_real_line_geometry(charterparty_pdf: Path) -> None:
    doc = parse_with_pdfplumber(charterparty_pdf)

    assert len(doc.lines) == len(CP_LINES)

    for top, text in CP_LINES:
        line = _line_for(doc, text[:30])
        _assert_contains_anchor_point(line, top, 72.0)

    tops = [line.bbox.y0 for line in doc.lines]
    assert tops == sorted(tops), "lines are not in page order"
    assert len({line.anchor for line in doc.lines}) == len(doc.lines)


def test_parsers_agree_on_page_count_for_multipage_pdf(tmp_path: Path) -> None:
    path = tmp_path / "charterparty.pdf"
    _write_pdf(path, CP_LINES[:2], pages=3)

    for parsed in (parse_with_pymupdf(path), parse_with_pdfplumber(path)):
        assert len(parsed.pages) == 3
        assert {line.page for line in parsed.lines} == {1, 2, 3}
        for page in (1, 2, 3):
            page_lines = [line for line in parsed.lines if line.page == page]
            assert len(page_lines) == 2
            assert [line.index for line in page_lines] == [0, 1]


# ---------------------------------------------------------------------------
# Prompt bounds
# ---------------------------------------------------------------------------


def _huge_document() -> ParsedDocument:
    lines = []
    index = 0
    for page in range(1, 201):
        for row in range(300):
            lines.append(
                TextLine(
                    page=page,
                    index=index if page == 1 else row,
                    text="Laytime shall be allowed for loading at the port limits " * 6,
                    bbox=BBox(page=page, x0=72.0, y0=100.0 + row, x1=500.0, y1=112.0 + row),
                )
            )
    return ParsedDocument(path="huge.pdf", pages=["x"], lines=lines)


def test_geometry_prompt_is_bounded_for_a_large_pdf() -> None:
    prompt = _geometry_prompt(_huge_document())

    assert len(prompt) <= _MAX_PROMPT_CHARS
    assert "further lines omitted" in prompt


def test_geometry_prompt_caps_lines_per_page_and_line_length() -> None:
    doc = ParsedDocument(
        path="one-page.pdf",
        pages=["x"],
        lines=[
            TextLine(
                page=1,
                index=i,
                text=("T" * 5000) if i == 0 else f"short line {i}",
                bbox=BBox(page=1, x0=1.0, y0=float(i), x1=2.0, y1=float(i) + 1),
            )
            for i in range(_MAX_LINES_PER_PAGE + 25)
        ],
    )
    prompt = _geometry_prompt(doc)
    entries = [line for line in prompt.splitlines() if line.startswith("p1L")]

    assert len(entries) == _MAX_LINES_PER_PAGE
    assert len(prompt) <= _MAX_PROMPT_CHARS
    assert "further lines omitted" in prompt
    assert max(len(entry) for entry in entries) < 300
    assert "T" * 5000 not in prompt


def test_geometry_prompt_falls_back_to_plain_text_without_geometry() -> None:
    doc = ParsedDocument(path="doc.pdf", pages=["NOR tendered 08:00", "NOR accepted 14:00"])

    assert _geometry_prompt(doc) == _page_text(doc)
    assert "p1L0" not in _geometry_prompt(doc)


# ---------------------------------------------------------------------------
# Anchor resolution
# ---------------------------------------------------------------------------


def test_resolve_anchor_returns_the_parsed_rectangle(geometry_pdf: Path) -> None:
    doc = parse_with_pymupdf(geometry_pdf)
    index = _line_index(doc.lines)
    line = _line_for(doc, "Laytime allowed")

    page, bbox = _resolve_anchor(line.anchor, index)

    assert page == 1
    assert bbox == pytest.approx(line.bbox.as_tuple(), abs=0.01)


def test_resolve_anchor_unions_a_multi_line_span(geometry_pdf: Path) -> None:
    doc = parse_with_pdfplumber(geometry_pdf)
    index = _line_index(doc.lines)
    first = _line_for(doc, "Laytime allowed")
    last = _line_for(doc, "NOR deemed accepted")

    page, bbox = _resolve_anchor(f"{first.anchor}-{last.anchor}", index)

    assert page == 1
    assert bbox[0] == pytest.approx(min(first.bbox.x0, last.bbox.x0), abs=0.01)
    assert bbox[1] == pytest.approx(min(first.bbox.y0, last.bbox.y0), abs=0.01)
    assert bbox[2] == pytest.approx(max(first.bbox.x1, last.bbox.x1), abs=0.01)
    assert bbox[3] == pytest.approx(max(first.bbox.y1, last.bbox.y1), abs=0.01)
    assert bbox[1] <= first.bbox.y0 + 0.01, "span should not start below the first cited line"
    assert bbox[3] >= last.bbox.y1 - 0.01, "span should not end above the last cited line"
    assert bbox[3] - bbox[1] > last.bbox.y0 - first.bbox.y0, "span covers both lines"


@pytest.mark.parametrize(
    "anchor",
    ["", "   ", "p9L99", "p1L99", "p1L0-L99", "p2L1-p1L1", "left, 40, 700", "p1L", None, 7],
)
def test_resolve_anchor_refuses_anything_not_in_the_document(
    anchor: object, geometry_pdf: Path
) -> None:
    doc = parse_with_pymupdf(geometry_pdf)

    assert _resolve_anchor(anchor, _line_index(doc.lines)) is None


def test_sentinel_survives_round_trip_when_geometry_is_absent() -> None:
    doc = ParsedDocument(path="geometry-less.pdf", pages=["Laytime 72 hours"])
    payload = {
        "vessel": "MV Hellenic Pioneer",
        "charterer": "Mediterranean Grains Ltd.",
        "owner": "Aegean Shipping Co.",
        "load_port": "Piraeus",
        "load_port_lat": 37.942,
        "load_port_lon": 23.647,
        "laytime_allowance_hours": 72.0,
        "demurrage_rate_per_day_usd": 50000.0,
        "despatch_rate_per_day_usd": 25000.0,
        "nor_turn_time_hours": 6.0,
        "laytime_exception": "SHEX",
        "weather_clause": "WWD",
        "rule_authority": "BIMCO_2013",
        "clauses": [
            {"page": 2, "anchor": "", "text": "Laytime 72 running hours"},
            {"page": 3, "anchor": "p3L1", "text": "A prefix from another document"},
        ],
    }

    with patch("keel_api.extraction.extractor._get_client") as mock_client:
        mock_client.return_value.chat.completions.create.return_value = (
            _make_openai_response(payload)
        )
        terms = extract_charterparty_terms(doc)

    assert [c.bbox for c in terms.clauses] == [NO_BBOX, NO_BBOX]
    assert [c.page for c in terms.clauses] == [2, 3]
    assert [c.bbox for c in terms.clauses] == [
        ClauseCitation(page=2, bbox=NO_BBOX, text="Laytime 72 running hours").bbox,
        ClauseCitation(page=3, bbox=NO_BBOX, text="A prefix from another document").bbox,
    ]


# ---------------------------------------------------------------------------
# Parser → prompt → extraction round trip
# ---------------------------------------------------------------------------


def test_real_bbox_flows_from_parser_into_charterparty_terms(
    charterparty_pdf: Path,
) -> None:
    doc = parse_with_pymupdf(charterparty_pdf)
    line = _line_for(doc, "Laytime allowed")
    payload = {
        "vessel": "MV Hellenic Pioneer",
        "charterer": "Mediterranean Grains Ltd.",
        "owner": "Aegean Shipping Co.",
        "load_port": "Piraeus",
        "load_port_lat": 37.942,
        "load_port_lon": 23.647,
        "laytime_allowance_hours": 72.0,
        "demurrage_rate_per_day_usd": 50000.0,
        "despatch_rate_per_day_usd": 25000.0,
        "nor_turn_time_hours": 6.0,
        "laytime_exception": "SHEX",
        "weather_clause": "WWD",
        "rule_authority": "BIMCO_2013",
        "clauses": [{"page": 1, "anchor": line.anchor, "text": line.text}],
    }

    with patch("keel_api.extraction.extractor._get_client") as mock_client:
        mock_client.return_value.chat.completions.create.return_value = (
            _make_openai_response(payload)
        )
        terms = extract_charterparty_terms(doc)

    clause = terms.clauses[0]
    assert clause.bbox != NO_BBOX
    assert clause.bbox == pytest.approx(line.bbox.as_tuple(), abs=0.01)
    assert clause.page == 1
    assert 0.0 < clause.bbox[0] < clause.bbox[2] <= PAGE_WIDTH
    assert 0.0 < clause.bbox[1] < clause.bbox[3] <= PAGE_HEIGHT
    assert list(clause.bbox) != [0.0, 0.0, 0.0, 0.0], "frontend would drop this highlight"


def test_real_bbox_flows_from_parser_into_sof_events(sof_pdf: Path) -> None:
    doc = parse_with_pdfplumber(sof_pdf)
    line = _line_for(doc, "NOR Tendered")
    payload = {
        "events": [
            {
                "timestamp": "2026-06-10T08:00:00",
                "event_type": "NOR_TENDERED",
                "description": "Notice of Readiness on arrival",
                "source": {"page": 1, "anchor": line.anchor, "row_text": line.text},
            }
        ]
    }

    with patch("keel_api.extraction.extractor._get_client") as mock_client:
        mock_client.return_value.chat.completions.create.return_value = (
            _make_openai_response(payload)
        )
        events = extract_sof_events(doc)

    assert len(events) == 1
    assert events[0].source.bbox == pytest.approx(line.bbox.as_tuple(), abs=0.01)
    assert events[0].source.bbox != NO_BBOX
    assert events[0].source.page == 1


def test_prompt_offers_the_anchor_the_model_is_told_to_cite(
    charterparty_pdf: Path,
) -> None:
    doc = parse_with_pymupdf(charterparty_pdf)
    prompt = _geometry_prompt(doc)
    line = _line_for(doc, "Laytime allowed")

    assert prompt.splitlines()[0].startswith("=== PAGE 1 ===")
    assert f"{line.anchor} [" in prompt
    assert "[72.0," in prompt, "the written x0 is missing from the prompt"
    assert line.text[:40] in prompt


def test_model_cannot_emit_a_rectangle(charterparty_pdf: Path) -> None:
    from keel_api.extraction.extractor import _CHARTERPARTY_SCHEMA, _SOF_SCHEMA

    clause = _CHARTERPARTY_SCHEMA["properties"]["clauses"]["items"]
    source = _SOF_SCHEMA["properties"]["events"]["items"]["properties"]["source"]

    assert "bbox" not in clause["properties"]
    assert "anchor" in clause["required"]
    assert "bbox" not in source["properties"]
    assert "anchor" in source["required"]


# ---------------------------------------------------------------------------
# Committed golden artefacts still validate
# ---------------------------------------------------------------------------


def test_committed_charterparty_fixtures_still_validate() -> None:
    paths = [FIXTURE_DIR / "extracted_charterparty.json"] + sorted(
        TEST_CASES_DIR.glob("case_*/extracted_charterparty.json")
    )
    assert len(paths) == 5

    for path in paths:
        terms = CharterpartyTerms.model_validate(json.loads(path.read_text()))
        assert terms.clauses, path
        for clause in terms.clauses:
            assert len(clause.bbox) == 4, path
            assert clause.bbox == NO_BBOX, f"{path} is no longer the sentinel fixture"


def test_committed_sof_fixtures_still_validate() -> None:
    paths = [FIXTURE_DIR / "extracted_sof_owner.json", FIXTURE_DIR / "extracted_sof_charterer.json"]
    paths += sorted(TEST_CASES_DIR.glob("case_*/extracted_sof_*.json"))
    assert len(paths) == 10

    for path in paths:
        events = [SOFEvent.model_validate(e) for e in json.loads(path.read_text())]
        assert events, path
        for event in events:
            assert event.source.bbox == NO_BBOX, f"{path} is no longer the sentinel fixture"
