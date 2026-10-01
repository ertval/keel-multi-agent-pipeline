"""What the browser is handed has to be the document's own words.

Four contracts that a totals-only assertion cannot see, each one a field the
UI renders as if it were sourced from a document:

- the clause text on a day verdict is a clause of this charterparty, not a
  sentence this build composed;
- a citation that could not be located on its page reports no rectangle, and
  no rectangle that reaches the browser is the all-zero sentinel;
- a citation names the file it was read from, and names nothing when the
  caller did not thread a name through;
- the seeded demo row is re-seeded when it stops carrying the fields this
  build emits, not only when its three totals drift.

`test_api_hardening.py` already covers the 409/400 routes and the letter's
`vessel_name` escaping; `test_weather.py` already covers the half-open
observation window. Neither is repeated here.
"""

from __future__ import annotations

import copy
from pathlib import Path

import markupsafe
import pytest
from fastapi.testclient import TestClient

from keel_api import main
from keel_api.adapters import _bbox_or_none, reconciliation_to_frontend
from keel_api.pipeline import run_voyage_pipeline
from keel_api.store import save_voyage


REPO_ROOT = Path(__file__).resolve().parents[3]
FIXTURE_DIR = REPO_ROOT / "fixtures" / "voyage_001"

client = TestClient(app=main.app)


@pytest.fixture(scope="module")
def pipeline() -> tuple:
    return run_voyage_pipeline(FIXTURE_DIR, voyage_id="voyage_001")


@pytest.fixture(scope="module")
def threaded(pipeline) -> dict:
    reconciliation, terms, owner, charterer = pipeline
    return reconciliation_to_frontend(
        reconciliation,
        terms,
        owner,
        charterer,
        owner_document="sof_owner.pdf",
        charterer_document="sof_charterer.pdf",
    )


def _escape(text: str) -> str:
    """The escaped form Jinja's autoescaping produces for `text`.

    Compared against the body so the assertion distinguishes "escaped" from
    "deleted": a filter that stripped the payload outright would satisfy
    `payload not in body` while silently losing the vessel's name.
    """
    return markupsafe.escape(text)


def _citations(payload: dict) -> list[dict]:
    """Every citation the browser is handed, in the two audit traces."""
    return [
        row[key]
        for party in ("owner_calculation", "charterer_calculation")
        for row in payload[party]["audit_trace"]
        for key in ("citation", "clause_citation")
        if row.get(key)
    ]


# ─── 1: the day verdict's clause text is this charterparty's own ─────────────


def test_day_verdict_clause_text_is_a_clause_of_this_charterparty(pipeline) -> None:
    """The UI presents `bimco_clause.clause_text` as a quotation.

    A generated sentence in that field would be a quotation of nothing. The
    clause carried on a day verdict is the first of `clause_citations`, so the
    only way it can be the charterparty's own words is if the string appears
    verbatim among `terms.clauses`.
    """
    reconciliation, terms, _, _ = pipeline
    clause_texts = {clause.text for clause in terms.clauses}
    assert clause_texts, "the fixture charterparty states no clauses at all"

    for item in reconciliation.disputed_items:
        assert item.clause_citations, item.disputed_date
        assert item.clause_citations[0].text in clause_texts, item.disputed_date

    for verdict in reconciliation_to_frontend(reconciliation, terms, None, None)["day_verdicts"]:
        assert verdict["bimco_clause"]["clause_text"] in clause_texts, verdict["date"]


def test_day_verdict_clause_text_is_not_the_rule_id_or_a_generated_sentence(
    threaded,
) -> None:
    """A clause text that merely restates the verdict is not a citation.

    The generator's own weather prose is what a fabricated clause would be
    mistaken for, so it is named here as something the field must never hold.
    """
    for verdict in threaded["day_verdicts"]:
        text = verdict["bimco_clause"]["clause_text"]
        assert text
        lowered = text.lower()
        assert "the owner claims the whole" not in lowered
        assert "the charterer claims the" not in lowered
        assert "peak beaufort force" not in lowered
        assert "this charterparty's own term" not in lowered
        assert text != verdict["bimco_clause"]["clause_id"]
        assert text != verdict["measurement_basis"]


def test_a_day_with_no_clause_citation_reports_none_not_a_sentence() -> None:
    """No clause means no quotation: the field is empty rather than invented."""
    from keel_api.schemas import (
        CharterpartyTerms,
        DisputedLineItem,
        Reconciliation,
        Verdict,
    )

    terms = CharterpartyTerms.model_validate_json(
        (FIXTURE_DIR / "extracted_charterparty.json").read_text()
    )
    reconciliation = Reconciliation(
        voyage_id="voyage_001",
        owner_total_usd=0.0,
        charterer_total_usd=0.0,
        reconciled_total_usd=0.0,
        rule_authority="custom",
        disputed_items=[
            DisputedLineItem(
                description="Weather exception, 14 June 2026",
                disputed_date="2026-06-14",
                owner_position="The Owner claims the whole 12 hours as demurrage.",
                charterer_position="The Charterer claims the 12 hours.",
                owner_amount_usd=0.0,
                charterer_amount_usd=0.0,
                verdict=Verdict(
                    winner="owner",
                    justification="0 of 12 hours met the threshold",
                    rule_id="CP_WEATHER.MAJORITY_OF_HOURS",
                    measurement_basis="Laytime Definitions for Charter Parties 2013, "
                    "definition 16",
                    rule_authority="custom",
                    hours_credited_to_owner=0.0,
                    dollars_credited_to_owner_usd=0.0,
                ),
                clause_citations=[],
                sof_citations=[],
                weather_citations=[],
            )
        ],
    )
    payload = reconciliation_to_frontend(reconciliation, terms, None, None)
    clause = payload["day_verdicts"][0]["bimco_clause"]

    assert clause["clause_text"] is None
    assert clause["source_document"] is None
    assert clause["page_number"] is None


# ─── 2: the all-zero rectangle never reaches the browser ────────────────────


@pytest.mark.parametrize(
    "bbox",
    [
        None,
        (0.0, 0.0, 0.0, 0.0),
        [0.0, 0.0, 0.0, 0.0],
        (0, 0, 0, 0),
    ],
)
def test_bbox_or_none_drops_the_sentinel_and_absence(bbox) -> None:
    """`[0,0,0,0]` is the parser's "not located on this page" marker.

    Passed through, the UI's highlight overlay draws a box in the page corner
    and reports a location the document does not have, so the sentinel has to
    become `None` — the same answer as no rectangle at all.
    """
    assert _bbox_or_none(bbox) is None


def test_bbox_or_none_passes_a_real_rectangle_through() -> None:
    """The sentinel is dropped, geometry is not: a real box is the box."""
    real = (72.0, 100.0, 540.0, 112.0)

    result = _bbox_or_none(real)

    assert result == [72.0, 100.0, 540.0, 112.0]
    assert isinstance(result, list), "the wire shape is a list, not a tuple"
    assert result != [0.0, 0.0, 0.0, 0.0]


def test_bbox_or_none_keeps_a_box_that_merely_touches_the_origin() -> None:
    """`any(bbox)` is a zero test, not a falsiness test.

    A real rectangle in the page's top-left corner has two zero coordinates and
    must survive; only the all-zero rectangle is the sentinel.
    """
    assert _bbox_or_none((0.0, 100.0, 0.0, 112.0)) == [0.0, 100.0, 0.0, 112.0]
    assert _bbox_or_none((72.0, 0.0, 540.0, 0.0)) == [72.0, 0.0, 540.0, 0.0]


def test_no_served_citation_carries_the_all_zero_rectangle(threaded) -> None:
    """End to end: the sentinel is gone from every citation the API serves.

    `fixtures/` stores its bboxes as the sentinel, so this is the shape a real
    reconciliation produces today — not a synthetic one. A rectangle of all
    zeros on the wire means `_bbox_or_none` stopped dropping it.
    """
    citations = _citations(threaded)
    assert citations, "no citations at all, so nothing was checked"

    for citation in citations:
        assert citation["bbox"] is None or any(citation["bbox"]), citation


def test_a_citation_with_no_rectangle_reports_none_rather_than_zeros(
    pipeline,
) -> None:
    """The same contract when a locator is stripped, not when it is a sentinel."""
    reconciliation, terms, owner, charterer = pipeline
    stripped = copy.deepcopy(owner)
    for entry in stripped.trace:
        if entry.sof_citation is not None:
            entry.sof_citation.bbox = (0.0, 0.0, 0.0, 0.0)

    payload = reconciliation_to_frontend(
        reconciliation, terms, stripped, charterer, owner_document="sof_owner.pdf"
    )
    rows = [r for r in payload["owner_calculation"]["audit_trace"] if r["citation"]]

    assert rows
    for row in rows:
        assert row["citation"]["bbox"] is None, row


# ─── 3: a citation names the file it was read from ──────────────────────────


def test_threaded_document_names_reach_the_audit_trace(threaded) -> None:
    """`owner_document` / `charterer_document` are the citation's real source."""
    expected = {
        "owner_calculation": "sof_owner.pdf",
        "charterer_calculation": "sof_charterer.pdf",
    }

    for party, document in expected.items():
        rows = [r for r in threaded[party]["audit_trace"] if r["citation"]]
        assert rows, party
        for row in rows:
            assert row["citation"]["document"] == document, row


def test_an_unthreaded_citation_names_nothing_rather_than_a_guess(pipeline) -> None:
    """No name threaded in means no name on the wire.

    The failure this guards is a document name inferred from the party, which
    sends the UI's click-to-highlight lookup to a file the citation was never
    read from.
    """
    reconciliation, terms, owner, charterer = pipeline
    payload = reconciliation_to_frontend(reconciliation, terms, owner, charterer)

    for party in ("owner_calculation", "charterer_calculation"):
        for row in payload[party]["audit_trace"]:
            if row["citation"] is not None:
                assert row["citation"]["document"] is None, row
            # The clause citation is not threaded: a clause is only ever read
            # out of the charterparty, so that name is a fact and not a guess.
            if row["clause_citation"] is not None:
                assert row["clause_citation"]["document"] == "charterparty.pdf", row


def test_only_one_side_threaded_names_only_that_side(pipeline) -> None:
    """Threading is per party: a missing name is not backfilled from the other."""
    reconciliation, terms, owner, charterer = pipeline
    payload = reconciliation_to_frontend(
        reconciliation, terms, owner, charterer, owner_document="sof_owner.pdf"
    )

    owner_rows = [r for r in payload["owner_calculation"]["audit_trace"] if r["citation"]]
    charterer_rows = [r for r in payload["charterer_calculation"]["audit_trace"] if r["citation"]]
    assert owner_rows and charterer_rows
    assert all(r["citation"]["document"] == "sof_owner.pdf" for r in owner_rows)
    assert all(r["citation"]["document"] is None for r in charterer_rows)


# ─── 4: the demo row is stale the moment the contract moves ─────────────────


def _demo_frontend() -> dict:
    """The `frontend` payload this build writes for the seeded demo voyage."""
    reconciliation, terms, owner, charterer = run_voyage_pipeline(
        FIXTURE_DIR, voyage_id="voyage_001"
    )
    return reconciliation_to_frontend(
        reconciliation,
        terms,
        owner,
        charterer,
        owner_document=main._OWNER_SOF_DOCUMENT,
        charterer_document=main._CHARTERER_SOF_DOCUMENT,
    )


def test_a_freshly_built_demo_row_is_current() -> None:
    """The control: the guard must accept what this build produces.

    Without this, a guard that returned False for everything would pass every
    mutation below.
    """
    frontend = _demo_frontend()

    assert main._demo_contract_current(frontend)
    assert main._demo_matches_expected({"frontend": frontend})
    assert main._demo_citations_named(frontend)


def test_a_retired_rule_id_makes_the_demo_row_stale() -> None:
    """Renaming the weather rule leaves all three totals untouched."""
    frontend = _demo_frontend()
    frontend["day_verdicts"][0]["bimco_clause"]["clause_id"] = "CP_WEATHER.SOMETHING_ELSE"

    assert not main._demo_contract_current(frontend)
    assert not main._demo_matches_expected({"frontend": frontend})


def test_a_missing_measurement_basis_makes_the_demo_row_stale() -> None:
    """Adding `measurement_basis` leaves all three totals untouched."""
    frontend = _demo_frontend()
    del frontend["day_verdicts"][0]["measurement_basis"]

    assert not main._demo_contract_current(frontend)
    assert not main._demo_matches_expected({"frontend": frontend})


def test_a_trace_row_without_a_clause_citation_makes_the_demo_row_stale() -> None:
    """Adding the clause citation to the trace leaves all three totals untouched.

    Every row in the guard's own terms must carry the key, including one that
    cites no clause — a row reporting `None` for the citation is a row on the
    current contract, and a row without the key is a row from an older build.
    """
    frontend = _demo_frontend()
    del frontend["charterer_calculation"]["audit_trace"][0]["clause_citation"]

    assert not main._demo_contract_current(frontend)
    assert not main._demo_matches_expected({"frontend": frontend})


def test_a_row_with_no_day_verdicts_is_stale() -> None:
    """A row with nothing to check has not been checked, so it is not current."""
    frontend = _demo_frontend()
    frontend["day_verdicts"] = []

    assert not main._demo_contract_current(frontend)


def test_a_totals_only_check_passes_all_three_stale_rows() -> None:
    """Why the contract check exists, stated as an assertion.

    The three mutations above are the whole regression: a comparison of the
    three totals sees nothing wrong with any of them, so a totals-only guard
    would keep publishing all three rows forever.
    """
    mutations = []
    for name, mutate in (
        (
            "retired rule id",
            lambda f: f["day_verdicts"][0]["bimco_clause"].__setitem__(
                "clause_id", "CP_WEATHER.SOMETHING_ELSE"
            ),
        ),
        (
            "missing measurement_basis",
            lambda f: f["day_verdicts"][0].pop("measurement_basis"),
        ),
        (
            "trace row without clause_citation",
            lambda f: f["charterer_calculation"]["audit_trace"][0].pop("clause_citation"),
        ),
    ):
        frontend = _demo_frontend()
        mutate(frontend)
        totals = (
            (frontend["owner_calculation"] or {}).get("total_usd"),
            (frontend["charterer_calculation"] or {}).get("total_usd"),
            frontend.get("reconciled_total_usd"),
        )
        mutations.append((name, totals, not main._demo_contract_current(frontend)))

    expected = main._expected_totals()
    for name, totals, is_stale in mutations:
        assert totals == (
            expected["owner"],
            expected["charterer"],
            expected["reconciled"],
        ), name
        assert is_stale, name


# ─── 6: the letter escapes everything it is handed ───────────────────────────

_XSS_PAYLOADS = [
    "<script>alert(1)</script>",
    '<img src=x onerror="alert(1)">',
    "<svg/onload=alert(1)>",
    "A & B <b>\"quoted\"</b> 'apostrophe'",
]


@pytest.mark.parametrize("payload", _XSS_PAYLOADS)
def test_letter_escapes_a_payload_in_the_vessel_name(payload: str) -> None:
    voyage_id = f"voyage_contract_xss_{abs(hash(payload)) % 10_000}"
    _seed_letter_voyage(voyage_id, payload)

    body = client.get(f"/voyages/{voyage_id}/letter").text

    assert payload not in body
    assert _escape(payload) in body, "the payload was dropped rather than escaped"
    assert "<script" not in body
    assert "<img" not in body
    assert "<svg" not in body


@pytest.mark.parametrize("payload", _XSS_PAYLOADS)
def test_letter_escapes_a_payload_in_a_party_position(payload: str) -> None:
    """`vessel_name` is not the only channel into the template.

    `owner_position` and `charterer_position` are LLM-extracted prose from an
    uploaded PDF and reach the same template, and the frontend injects the
    result with dangerouslySetInnerHTML, so they are escaped on the same terms.
    """
    voyage_id = f"voyage_contract_pos_{abs(hash(payload)) % 10_000}"
    _seed_letter_voyage(voyage_id, "MV Hellenic Pioneer", payload)

    body = client.get(f"/voyages/{voyage_id}/letter").text

    assert payload not in body
    assert _escape(payload) in body, "the payload was dropped rather than escaped"
    assert "<script" not in body
    assert "<img" not in body
    assert "<svg" not in body


def test_letter_escapes_an_ampersand_without_corrupting_the_text() -> None:
    """Escaping is not stripping: the text still reads, with `&amp;`."""
    voyage_id = "voyage_contract_amp"
    _seed_letter_voyage(voyage_id, "MV Athenia & Hera")

    body = client.get(f"/voyages/{voyage_id}/letter").text

    assert "MV Athenia &amp; Hera" in body
    assert "MV Athenia & Hera" not in body


def test_letter_keeps_its_own_markup() -> None:
    """A template that escaped itself would render as visible source.

    This is the other half of the contract: the escaping has to be applied to
    the interpolated values and not to the template's own tags.
    """
    voyage_id = "voyage_contract_markup"
    _seed_letter_voyage(voyage_id, "MV Hellenic Pioneer")

    body = client.get(f"/voyages/{voyage_id}/letter").text

    assert body.startswith("<!DOCTYPE html>")
    assert "<table>" in body
    assert "</html>" in body
    assert "&lt;table&gt;" not in body
    assert "&lt;!DOCTYPE" not in body


def _seed_letter_voyage(voyage_id: str, vessel_name: str, position: str = "") -> None:
    save_voyage(
        voyage_id,
        {
            "status": "In Review",
            "frontend": {
                "voyage_id": voyage_id,
                "charterparty": {
                    "vessel_name": vessel_name,
                    "laytime_allowed_hours": 72.0,
                    "demurrage_rate_per_day_usd": 50000.0,
                },
                "owner_calculation": {"total_usd": 187000.0},
                "charterer_calculation": {"total_usd": 62000.0},
                "day_verdicts": [
                    {
                        "date": "2026-06-14",
                        "owner_position": position
                        or "Exception does not apply to the claimed hours",
                        "charterer_position": position
                        or "The exception is claimed on the logged delay",
                        "verdict": "owner",
                        "winner_label": "Owner position better supported",
                        "dollars_credited_usd": 25000.0,
                        "justification": "0 of 12 hours met the threshold",
                    }
                ],
                "reconciled_total_usd": 112000.0,
                "math_breakdown": "$62,000 + $50,000 = $112,000",
            },
        },
    )
