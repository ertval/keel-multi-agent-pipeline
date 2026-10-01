"""Wire-shape and party-position tests for the browser-facing payload.

Two things are asserted here that nothing else covers.

First, the party positions. A position column is one side's case, not a summary
of the outcome: the Owner is paid for hours the exception does not take off, so
its column pleads for the money whatever the assessment concludes, and the
Charterer's column pleads for the exception. Neither may state the other's
conclusion, and neither may contradict itself.

Second, what the browser is handed: the rule id beside the measurement basis
rather than inside it, the charterparty clause a suspended-hour row cites, and the
provenance of the threshold figure wherever it appears.
"""

from __future__ import annotations

import re
from datetime import date
from pathlib import Path

import pytest

from keel_api.adapters import reconciliation_to_frontend
from keel_api.pipeline import run_voyage_pipeline


REPO_ROOT = Path(__file__).resolve().parents[3]
FIXTURE_DIR = REPO_ROOT / "fixtures" / "voyage_001"

# A concession is a side stating the other side's conclusion, or its own
# conclusion in the opposite direction from the money it is claiming.
_OWNER_CONCESSIONS = (
    "exception applies",
    "therefore excepted",
    "interrupted time is excepted",
    "counted as an actual period",
    "counts as laytime",
)
_CHARTERER_CONCESSIONS = (
    "exception does not apply",
    "does not take these hours off",
    "counts as laytime",
    "claims the whole",
)


@pytest.fixture(scope="module")
def run() -> tuple:
    return run_voyage_pipeline(FIXTURE_DIR, voyage_id="voyage_001")


@pytest.fixture(scope="module")
def frontend(run) -> dict:
    reconciliation, terms, owner, charterer = run
    return reconciliation_to_frontend(
        reconciliation, terms, owner, charterer,
        owner_document="sof_owner.pdf",
        charterer_document="sof_charterer.pdf",
    )


# ─── Party positions (C3) ─────────────────────────────────────────────────────


def test_owner_position_is_the_owners_case_on_every_day(run) -> None:
    """The Owner claims the money on all three days, including the one it lost."""
    reconciliation, _, _, _ = run
    assert len(reconciliation.disputed_items) == 3
    for item in reconciliation.disputed_items:
        assert item.owner_position.startswith("The Owner claims the whole")
        assert "as demurrage" in item.owner_position
        assert "The Owner's case is that" in item.owner_position


def test_losing_owner_still_pleads_its_case(run) -> None:
    """The regression: on 16 June the Owner loses the day, and its column used to
    read as the Charterer's case — conceding the exception while the assessment
    credited the day to the other side."""
    reconciliation, _, _, _ = run
    by_date = {item.disputed_date: item for item in reconciliation.disputed_items}
    losing_owner = by_date[date(2026, 6, 16)]
    assert losing_owner.verdict.winner == "charterer"
    assert losing_owner.verdict.dollars_credited_to_owner_usd == 0.0
    assert "The Owner claims the whole 36 hours as demurrage" in losing_owner.owner_position
    assert "does not of itself suspend the accrual of demurrage" in losing_owner.owner_position


def test_no_position_states_the_other_sides_conclusion(run) -> None:
    reconciliation, _, _, _ = run
    for item in reconciliation.disputed_items:
        owner = item.owner_position.lower()
        charterer = item.charterer_position.lower()
        for concession in _OWNER_CONCESSIONS:
            assert concession not in owner, (item.disputed_date, concession)
        for concession in _CHARTERER_CONCESSIONS:
            assert concession not in charterer, (item.disputed_date, concession)


def test_no_position_contradicts_itself(run) -> None:
    """Each side pleads one outcome, and only its own."""
    reconciliation, _, _, _ = run
    for item in reconciliation.disputed_items:
        owner = item.owner_position.lower()
        charterer = item.charterer_position.lower()
        assert ("excepted from laytime" in owner) is False, item.disputed_date
        assert "excepted from laytime" in charterer, item.disputed_date
        assert "The Charterer claims the" in item.charterer_position
        assert "The Owner claims the" not in item.charterer_position
        assert "The Owner's case is that" not in item.charterer_position


def test_positions_are_independent_of_the_winner(run) -> None:
    """A position is a party's case, so the Owner's text must not be generated
    from the assessment: the Owner claims the same thing on the day it wins and
    the day it loses, and only its reason changes with the weather."""
    reconciliation, _, _, _ = run
    by_date = {item.disputed_date: item for item in reconciliation.disputed_items}
    won = by_date[date(2026, 6, 14)]
    lost = by_date[date(2026, 6, 16)]
    assert won.verdict.winner == "owner" and lost.verdict.winner == "charterer"
    assert won.owner_position.split("The Owner's case is that ")[0] == (
        lost.owner_position.split("The Owner's case is that ")[0]
    ).replace("36 hours", "12 hours")
    assert won.owner_position != lost.owner_position


def test_positions_cite_the_claimed_hours_and_the_peak_observation(run) -> None:
    reconciliation, _, _, _ = run
    by_date = {item.disputed_date: item for item in reconciliation.disputed_items}
    assert "peak Beaufort Force 7 with 5.6 mm/h precipitation over 36 hours" in (
        by_date[date(2026, 6, 16)].owner_position
    )
    assert "peak Beaufort Force 5" in by_date[date(2026, 6, 14)].owner_position
    assert "36 hours" in by_date[date(2026, 6, 16)].charterer_position
    assert "12 hours" in by_date[date(2026, 6, 14)].charterer_position


def test_no_position_credits_a_source_document_with_the_threshold(run) -> None:
    reconciliation, _, _, _ = run
    for item in reconciliation.disputed_items:
        for text in (item.owner_position, item.charterer_position):
            for sentence in re.split(r"(?<=[.;])\s+", text):
                assert "bimco" not in sentence.lower(), sentence
                assert "laytime definitions" not in sentence.lower(), sentence


# ─── Threshold provenance on the wire (C2) ─────────────────────────────────────


def test_threshold_figure_is_attributed_to_the_charterparty_clause(frontend) -> None:
    for verdict in frontend["day_verdicts"]:
        assert "Beaufort Force 6" in verdict["owner_position"]
        assert "this charterparty's own term" in verdict["owner_position"]
        assert "charterparty's weather-working threshold" in verdict["justification"]


def test_no_wire_string_presents_a_source_as_the_threshold_authority(frontend) -> None:
    figure = re.compile(r"Force\s*\d+|\d+(?:\.\d+)?\s*mm", re.IGNORECASE)
    for verdict in frontend["day_verdicts"]:
        for text in (
            verdict["owner_position"],
            verdict["charterer_position"],
            verdict["justification"],
        ):
            for sentence in re.split(r"(?<=[.;])\s+", text):
                lowered = sentence.lower()
                if "bimco" in lowered or "laytime definitions" in lowered:
                    assert not figure.search(sentence), sentence


def test_unread_threshold_is_reported_as_an_unverified_default(tmp_path) -> None:
    """A clause that states a threshold is not on its own enough to attribute a
    figure to it. With nothing read out of the text, the number applied is Keel's
    and the letter has to say so — a matched clause must not lend it a
    provenance it never had."""
    import json
    import shutil

    for name in FIXTURE_DIR.iterdir():
        shutil.copy(name, tmp_path / name.name)
    terms_path = tmp_path / "extracted_charterparty.json"
    terms = json.loads(terms_path.read_text())
    terms.pop("weather_beaufort_threshold")
    terms.pop("weather_precipitation_threshold_mm")
    terms_path.write_text(json.dumps(terms, indent=2))

    reconciliation, _, _, _ = run_voyage_pipeline(tmp_path, voyage_id="unread_threshold")
    assert reconciliation.reconciled_total_usd == 112_000.0
    for item in reconciliation.disputed_items:
        assert "Keel's configured default" in item.owner_position
        assert "has not been verified against the charterparty text" in item.owner_position
        assert "charterparty's own term" not in item.owner_position
        assert "not been verified against the charterparty text" in item.verdict.justification
        assert "charterparty's weather-working threshold" not in item.verdict.justification


# ─── Rule id and measurement basis on the wire (C4) ───────────────────────────


def test_day_verdict_carries_rule_id_and_measurement_basis_separately(frontend) -> None:
    for verdict in frontend["day_verdicts"]:
        assert verdict["bimco_clause"]["clause_id"] == "CP_WEATHER.MAJORITY_OF_HOURS"
        assert verdict["measurement_basis"] == (
            "Laytime Definitions for Charter Parties 2013, definition 16"
        )


def test_rule_id_names_no_source_and_no_definition(frontend) -> None:
    for verdict in frontend["day_verdicts"]:
        rule_id = verdict["bimco_clause"]["clause_id"].lower()
        assert "bimco" not in rule_id
        assert "laytime" not in rule_id
        assert not re.search(r"\d", rule_id)


# ─── The audit trace cites a clause (H6) ──────────────────────────────────────


def test_weather_rows_of_the_audit_trace_carry_a_clause_citation(frontend) -> None:
    """The Owner's Statement of Facts logs no weather delay, so the rows that
    suspend time are the Charterer's — and those are the rows that used to cite
    no clause at all."""
    weather_rows = [
        row
        for row in frontend["charterer_calculation"]["audit_trace"]
        if "Weather delay" in row["description"]
    ]
    assert len(weather_rows) == 6
    for row in weather_rows:
        clause = row["clause_citation"]
        assert clause is not None, row
        assert clause["document"] == "charterparty.pdf"
        assert clause["excerpt"].strip()
        assert clause["page_number"] >= 1


def test_sof_citation_is_untouched_by_the_clause_citation(frontend) -> None:
    """The two citations are different documents and both still have to be
    reported, so adding the clause cannot displace the SOF row it sits beside."""
    rows = frontend["charterer_calculation"]["audit_trace"]
    weather_rows = [r for r in rows if "Weather delay" in r["description"]]
    for row in weather_rows:
        assert row["citation"]["document"] == "sof_charterer.pdf"
        assert row["citation"]["excerpt"].strip()
        assert row["clause_citation"]["excerpt"] != row["citation"]["excerpt"]


def test_rows_without_a_clause_report_none_rather_than_a_stand_in(frontend) -> None:
    for party in ("owner_calculation", "charterer_calculation"):
        for row in frontend[party]["audit_trace"]:
            if "Weather delay" in row["description"]:
                continue
            assert row["clause_citation"] is None, row


def test_a_charterparty_stating_no_weather_clause_leaves_the_trace_uncited() -> None:
    """No clause means no citation: the trace must not borrow an unrelated clause
    to look complete."""
    from keel_api.engine.state_machine import weather_exception_clauses
    from keel_api.schemas import CharterpartyTerms

    terms = CharterpartyTerms.model_validate_json(
        (FIXTURE_DIR / "extracted_charterparty.json").read_text()
    )
    without = terms.model_copy(
        update={"clauses": [c for c in terms.clauses if "weather" not in c.text.lower()]}
    )
    assert weather_exception_clauses(without) == []


def test_every_trace_row_still_reports_a_citation_key(frontend) -> None:
    for party in ("owner_calculation", "charterer_calculation"):
        for row in frontend[party]["audit_trace"]:
            assert "citation" in row
            assert "clause_citation" in row
