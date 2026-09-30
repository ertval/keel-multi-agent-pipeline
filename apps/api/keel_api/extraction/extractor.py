"""LLM extraction layer — OpenAI-compatible API with strict json_schema output.

Extracts structured data from parsed PDF text. All arithmetic is
intentionally excluded here; the engine does math, the LLM does reading.

Reads three env vars:
  OPENAI_API_KEY   — required (nvapi-... for NVIDIA, sk-... for OpenAI)
  OPENAI_BASE_URL  — optional, defaults to OpenAI; set to NVIDIA endpoint
  OPENAI_MODEL     — optional, defaults to gpt-4o
"""

from __future__ import annotations

import json
import logging
import os
import re
import time
from typing import Any

from openai import OpenAI

log = logging.getLogger(__name__)

_MAX_RETRIES = 3
_RETRY_DELAY = 2.0  # seconds between retries

from keel_api.parsing.models import NO_BBOX, BBox, ParsedDocument, TextLine
from keel_api.schemas import WEATHER_CLAUSE_VALUES, CharterpartyTerms, SOFEvent

_client: OpenAI | None = None

_DEFAULT_MODEL = "gpt-4o"

_MAX_PROMPT_CHARS = 12_000
_MAX_LINES_PER_PAGE = 60
_MAX_LINE_CHARS = 200
_TRUNCATION_RESERVE = 160

_ANCHOR_PATTERN = re.compile(r"^p(\d+)L(\d+)$")

_ANCHOR_RULES = """Lines in the user message are prefixed p<page>L<line> followed by the \
line's true position on the page as [x0,y0,x1,y1] in PDF points with the origin \
at the top-left corner, then the line's text. Cite a clause or event by copying \
those prefixes into the "anchor" field: a single prefix (e.g. "p2L7") for a \
one-line span, or first-last for a span covering several lines (e.g. \
"p2L7-p2L9"). Never output coordinates and never invent a prefix: an anchor that \
is not in the document yields no position. Use an empty anchor "" when no line \
carries it."""


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        kwargs: dict[str, Any] = {
            "api_key": os.environ["OPENAI_API_KEY"],
            "timeout": 30.0,  # fail fast instead of hanging
        }
        base_url = os.environ.get("OPENAI_BASE_URL")
        if base_url:
            kwargs["base_url"] = base_url
        _client = OpenAI(**kwargs)
    return _client


def _model() -> str:
    return os.environ.get("OPENAI_MODEL", _DEFAULT_MODEL)


def _page_text(doc: ParsedDocument, max_chars: int = 12_000) -> str:
    text = "\n\n---PAGE BREAK---\n\n".join(doc.pages)
    return text[:max_chars]


def _format_line(line: TextLine) -> str:
    coords = ",".join(
        f"{value:.1f}"
        for value in (line.bbox.x0, line.bbox.y0, line.bbox.x1, line.bbox.y1)
    )
    text = line.text[:_MAX_LINE_CHARS]
    if len(line.text) > _MAX_LINE_CHARS:
        text += "…"
    return f"{line.anchor} [{coords}] {text}"


def _geometry_prompt(doc: ParsedDocument, max_chars: int = _MAX_PROMPT_CHARS) -> str:
    """Render the pages as coordinate-annotated lines, bounded in size.

    Falls back to plain page text when the parsers produced no geometry, so a
    document without coordinates is still read and yields no positions rather
    than invented ones.
    """
    if not doc.lines:
        return _page_text(doc, max_chars)

    pages: dict[int, list[TextLine]] = {}
    for line in doc.lines:
        pages.setdefault(line.page, []).append(line)

    budget = max_chars - _TRUNCATION_RESERVE
    out: list[str] = []
    used = 0
    omitted = 0

    for page_num, lines in pages.items():
        header = f"=== PAGE {page_num} ==="
        if used + len(header) + 1 > budget:
            omitted += len(lines)
            continue
        out.append(header)
        used += len(header) + 1
        for line in lines[:_MAX_LINES_PER_PAGE]:
            entry = _format_line(line)
            if used + len(entry) + 1 > budget:
                omitted += 1
                continue
            out.append(entry)
            used += len(entry) + 1
        omitted += max(0, len(lines) - _MAX_LINES_PER_PAGE)

    if omitted:
        out.append(f"[{omitted} further lines omitted: page-geometry budget exhausted]")
    return "\n".join(out)


def _line_index(lines: list[TextLine]) -> dict[tuple[int, int], BBox]:
    return {(line.page, line.index): line.bbox for line in lines}


def _resolve_anchor(anchor: Any, index: dict[tuple[int, int], BBox]) -> tuple[int, tuple[float, float, float, float]] | None:
    """Turn a model-supplied anchor into the page and rectangle it names.

    Returns None for anything that is not a span of prefixes actually present in
    the document, so an unresolvable anchor degrades to the sentinel instead of
    to a guess.
    """
    if not isinstance(anchor, str) or not anchor.strip():
        return None

    rects: list[BBox] = []
    for part in re.split(r"[,\s]+", anchor.strip()):
        if not part:
            continue
        first, _, last = part.partition("-")
        start = _ANCHOR_PATTERN.match(first)
        end = _ANCHOR_PATTERN.match(last or first)
        if not start or not end:
            return None
        page, first_index = int(start.group(1)), int(start.group(2))
        end_page, last_index = int(end.group(1)), int(end.group(2))
        if end_page != page or last_index < first_index:
            return None
        for index_in_span in range(first_index, last_index + 1):
            bbox = index.get((page, index_in_span))
            if bbox is None:
                return None
            rects.append(bbox)

    if not rects:
        return None
    return (
        rects[0].page,
        (
            round(min(b.x0 for b in rects), 2),
            round(min(b.y0 for b in rects), 2),
            round(max(b.x1 for b in rects), 2),
            round(max(b.y1 for b in rects), 2),
        ),
    )


def _with_resolved_bbox(
    item: dict[str, Any], index: dict[tuple[int, int], BBox]
) -> dict[str, Any]:
    resolved = _resolve_anchor(item.get("anchor"), index)
    entry = {key: value for key, value in item.items() if key != "anchor"}
    if resolved is None:
        entry["bbox"] = list(NO_BBOX)
    else:
        page, bbox = resolved
        entry["page"] = page
        entry["bbox"] = list(bbox)
    return entry


def _user_content(text: str, validation_errors: list[str] | None = None) -> str:
    """Build the user message; append correction feedback when errors are present."""
    if not validation_errors:
        return text
    lines = "\n".join(f"- {e}" for e in validation_errors)
    return (
        f"{text}\n\n"
        "Previous extraction failed these checks. Correct the JSON so these are "
        "resolved. Do not invent amounts, dates, or vessel names that are not "
        f"in the document.\n{lines}"
    )


def _llm_call(**kwargs: Any) -> Any:
    """Call the LLM with automatic retry on timeout or transient error."""
    last_exc: Exception | None = None
    for attempt in range(1, _MAX_RETRIES + 1):
        try:
            return _get_client().chat.completions.create(**kwargs)
        except Exception as exc:
            last_exc = exc
            log.warning("LLM attempt %d/%d failed: %s", attempt, _MAX_RETRIES, exc)
            if attempt < _MAX_RETRIES:
                time.sleep(_RETRY_DELAY)
    raise RuntimeError(f"LLM call failed after {_MAX_RETRIES} attempts") from last_exc


# ---------------------------------------------------------------------------
# Charterparty extraction
# ---------------------------------------------------------------------------

_CHARTERPARTY_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "vessel": {"type": "string"},
        "charterer": {"type": "string"},
        "owner": {"type": "string"},
        "load_port": {"type": "string"},
        "load_port_lat": {"type": "number"},
        "load_port_lon": {"type": "number"},
        "laytime_allowance_hours": {"type": "number"},
        "demurrage_rate_per_day_usd": {"type": "number"},
        "despatch_rate_per_day_usd": {"type": "number"},
        "nor_turn_time_hours": {"type": "number"},
        "laytime_exception": {"type": "string", "enum": ["SHEX", "FHEX", "SHINC"]},
        "weather_clause": {"type": "string", "enum": list(WEATHER_CLAUSE_VALUES)},
        "weather_beaufort_threshold": {
            "type": ["integer", "null"],
            "description": "The Beaufort force figure the charterparty itself states as its weather-working threshold. null when the document states no figure — never a figure taken from any ruleset or from this product's default.",
        },
        "weather_precipitation_threshold_mm": {
            "type": ["number", "null"],
            "description": "The precipitation figure in mm/h the charterparty itself states as its weather-working threshold. null when the document states no figure.",
        },
        "rule_authority": {
            "type": "string",
            "enum": ["BIMCO_2013", "VOYLAYRULES_93", "custom"],
            "description": "The ruleset this document expressly incorporates by its own words, naming it in a clause. Use 'custom' unless a cited clause incorporates the ruleset by reference: an ordinary weather-exception clause, or a document that merely resembles a standard form, incorporates nothing.",
        },
        "clauses": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "page": {"type": "integer"},
                    "anchor": {
                        "type": "string",
                        "description": "Line prefixes covering the clause, e.g. p2L7 or p2L7-p2L9",
                    },
                    "text": {"type": "string"},
                },
                "required": ["page", "anchor", "text"],
                "additionalProperties": False,
            },
        },
    },
    "required": [
        "vessel", "charterer", "owner", "load_port",
        "load_port_lat", "load_port_lon",
        "laytime_allowance_hours", "demurrage_rate_per_day_usd",
        "despatch_rate_per_day_usd", "nor_turn_time_hours",
        "laytime_exception", "weather_clause",
        "weather_beaufort_threshold", "weather_precipitation_threshold_mm",
        "rule_authority", "clauses",
    ],
    "additionalProperties": False,
}

_CHARTERPARTY_SYSTEM = f"""\
You are a maritime contract parser. Extract the charterparty terms from the \
document text below. Return ONLY valid JSON matching the schema. \
A term the document does not state is null, never a plausible default: the \
weather-working threshold figures and the ruleset are stated by this \
charterparty or not at all, and no ruleset or industry practice supplies them. \
{_ANCHOR_RULES} \
Do not invent numbers — extract only what is explicitly stated."""


def extract_charterparty_terms(
    doc: ParsedDocument,
    validation_errors: list[str] | None = None,
) -> CharterpartyTerms:
    text = _geometry_prompt(doc)
    response = _llm_call(
        model=_model(),
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "CharterpartyTerms",
                "strict": True,
                "schema": _CHARTERPARTY_SCHEMA,
            },
        },
        messages=[
            {"role": "system", "content": _CHARTERPARTY_SYSTEM},
            {"role": "user", "content": _user_content(text, validation_errors)},
        ],
        temperature=0,
    )
    raw = json.loads(response.choices[0].message.content)
    index = _line_index(doc.lines)
    raw["clauses"] = [
        _with_resolved_bbox(clause, index) for clause in raw.get("clauses") or []
    ]
    return CharterpartyTerms.model_validate(raw)


# ---------------------------------------------------------------------------
# SOF extraction
# ---------------------------------------------------------------------------

_SOF_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "events": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "timestamp": {"type": "string", "description": "ISO 8601 datetime"},
                    "event_type": {
                        "type": "string",
                        "enum": [
                            "NOR_TENDERED", "NOR_ACCEPTED", "LOADING_START",
                            "LOADING_END", "WEATHER_DELAY_START", "WEATHER_DELAY_END",
                            "SHIFTING", "COMPLETED",
                        ],
                    },
                    "description": {"type": "string"},
                    "source": {
                        "type": "object",
                        "properties": {
                            "page": {"type": "integer"},
                            "anchor": {
                                "type": "string",
                                "description": "Line prefixes covering the row, e.g. p1L3 or p1L3-p1L4",
                            },
                            "row_text": {"type": "string"},
                        },
                        "required": ["page", "anchor", "row_text"],
                        "additionalProperties": False,
                    },
                },
                "required": ["timestamp", "event_type", "description", "source"],
                "additionalProperties": False,
            },
        }
    },
    "required": ["events"],
    "additionalProperties": False,
}

_SOF_SYSTEM = f"""\
You are a maritime Statement of Facts (SOF) parser. Extract every timestamped \
event from the document. Map each row to the closest event_type from the \
allowed enum. \
{_ANCHOR_RULES} \
Timestamps must be ISO 8601 format (e.g. 2026-06-14T10:00:00). \
Return ONLY valid JSON matching the schema."""


def extract_sof_events(
    doc: ParsedDocument,
    validation_errors: list[str] | None = None,
) -> list[SOFEvent]:
    text = _geometry_prompt(doc)
    response = _llm_call(
        model=_model(),
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "SOFEvents",
                "strict": True,
                "schema": _SOF_SCHEMA,
            },
        },
        messages=[
            {"role": "system", "content": _SOF_SYSTEM},
            {"role": "user", "content": _user_content(text, validation_errors)},
        ],
        temperature=0,
    )
    raw = json.loads(response.choices[0].message.content)
    index = _line_index(doc.lines)
    events = []
    for event in raw.get("events") or []:
        if isinstance(event.get("source"), dict):
            event["source"] = _with_resolved_bbox(event["source"], index)
        events.append(event)
    return [SOFEvent.model_validate(e) for e in events]


# ─── Claim amount extraction ──────────────────────────────────────────────────

_CLAIM_AMOUNT_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "total_usd": {
            "type": "number",
            "description": "The total claimed amount in USD, read from the labeled total row (numeric value only, e.g. 125000.50)",
        },
    },
    "required": ["total_usd"],
    "additionalProperties": False,
}

_CLAIM_AMOUNT_SYSTEM = """You are given structured rows pre-extracted from a claim document.
Each row is a list of cells. One row is labeled as the total.

Your job is INTERPRETATION ONLY:
- Identify which row represents the final "Total" claim amount.
- Return the dollar amount from that row.
- Do NOT compute, sum, or derive anything. The number is already in the data.
- Return only what is literally written in the matching cell."""


def _extract_total_rows(doc: ParsedDocument) -> list[list[str]]:
    """Return table rows that contain a 'total'-like label (pre-filtered by pdfplumber)."""
    rows_by_key: dict[tuple[int, int], list[tuple[int, str]]] = {}
    for cell in doc.table_cells:
        rows_by_key.setdefault((cell.page, cell.row), []).append((cell.col, cell.text))

    total_rows: list[list[str]] = []
    for cells in rows_by_key.values():
        row = [text for _, text in sorted(cells)]
        if any("total" in c.lower() for c in row):
            total_rows.append(row)
    return total_rows


def _grep_total_lines(doc: ParsedDocument) -> list[str]:
    """Fallback: grep raw text lines containing 'total' (for prose-only docs)."""
    lines: list[str] = []
    for page in doc.pages:
        for line in page.split("\n"):
            if "total" in line.lower():
                lines.append(line.strip())
    return lines


def extract_claim_amount(
    doc: ParsedDocument,
    validation_errors: list[str] | None = None,
) -> float:
    """Extract the stated total claim amount.

    Strategy: use pdfplumber's structured table extraction to pull only rows
    that contain a 'total' label, then pass that minimal structured data to
    the LLM. The LLM never sees the prose calculation breakdown — it only
    interprets which cell holds the final amount.
    """
    total_rows = _extract_total_rows(doc)

    if total_rows:
        # Pass structured rows as JSON — no prose, no hours/rates context
        structured = json.dumps({"total_rows": total_rows}, indent=2)
        user_content = (
            f"The following rows were extracted from a claim document table.\n"
            f"Identify which row is the final total and return its dollar amount.\n\n"
            f"{structured}"
        )
    else:
        # Fallback: grep lines mentioning 'total'
        lines = _grep_total_lines(doc)
        if not lines:
            lines = [doc.pages[0][:2000]] if doc.pages else [""]
        user_content = (
            "The following lines mention 'total'. Return the final claim amount in USD.\n\n"
            + "\n".join(lines)
        )

    response = _llm_call(
        model=_model(),
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "ClaimAmount",
                "strict": True,
                "schema": _CLAIM_AMOUNT_SCHEMA,
            },
        },
        messages=[
            {"role": "system", "content": _CLAIM_AMOUNT_SYSTEM},
            {"role": "user", "content": _user_content(user_content, validation_errors)},
        ],
        temperature=0,
    )
    raw = json.loads(response.choices[0].message.content)
    amount = float(raw["total_usd"])
    log.info(f"Extracted claim amount: ${amount:,.2f} (from {len(total_rows)} table rows)")
    return amount
