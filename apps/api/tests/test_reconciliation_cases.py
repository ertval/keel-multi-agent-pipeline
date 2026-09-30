"""Data-driven reconciliation checking loop.

Mirrors test_canonical.py, but instead of one hand-wired voyage it walks every
case folder under `test-cases/` and asserts the full pipeline reproduces that
case's hand-authored answer (in `<case>/expected.json`).

Each case ships seeded `extracted_*.json` files, so `run_voyage_pipeline` takes
the cache-first path (`_load_or_extract`) and runs entirely offline — no LLM, no
API key, deterministic. The source PDFs in each folder are the provenance /
live-LLM input; see test-cases/README.md.

To add a case: drop a new folder under test-cases/ (regenerate via
test-cases/_generate_fixtures.py) — it is picked up automatically.
"""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

import pytest

from keel_api.pipeline import run_voyage_pipeline
from keel_api.pipeline_agents import _RULESET_INCORPORATION, _cited_rule_authority
from keel_api.schemas import CharterpartyTerms, ClauseCitation

REPO_ROOT = Path(__file__).resolve().parents[3]
TEST_CASES_DIR = REPO_ROOT / "test-cases"


def _discover_cases() -> list[Path]:
    if not TEST_CASES_DIR.exists():
        return []
    return sorted(
        p for p in TEST_CASES_DIR.iterdir()
        if p.is_dir() and (p / "expected.json").exists()
    )


CASE_DIRS = _discover_cases()


@pytest.fixture(scope="module")
def pipeline_results() -> dict[str, object]:
    """Run each case's pipeline once and cache the reconciliation."""
    return {d.name: run_voyage_pipeline(d)[0] for d in CASE_DIRS}


def _expected(case_dir: Path) -> dict:
    return json.loads((case_dir / "expected.json").read_text())


@pytest.mark.canonical
@pytest.mark.parametrize("case_dir", CASE_DIRS, ids=[d.name for d in CASE_DIRS])
def test_case_totals(case_dir: Path, pipeline_results) -> None:
    exp = _expected(case_dir)
    rec = pipeline_results[case_dir.name]

    assert rec.owner_total_usd == exp["owner_total_usd"], "owner total"
    assert rec.charterer_total_usd == exp["charterer_total_usd"], "charterer total"
    assert rec.reconciled_total_usd == exp["reconciled_total_usd"], "reconciled total"


@pytest.mark.canonical
@pytest.mark.parametrize("case_dir", CASE_DIRS, ids=[d.name for d in CASE_DIRS])
def test_case_verdicts(case_dir: Path, pipeline_results) -> None:
    exp = _expected(case_dir)
    rec = pipeline_results[case_dir.name]

    by_date = {item.disputed_date: item for item in rec.disputed_items}
    expected_by_date = {
        date.fromisoformat(v["date"]): v["winner"] for v in exp["verdicts"]
    }

    assert set(by_date) == set(expected_by_date), "disputed dates"
    for d, winner in expected_by_date.items():
        assert by_date[d].verdict.winner == winner, f"verdict {d}"


@pytest.mark.canonical
@pytest.mark.parametrize("case_dir", CASE_DIRS, ids=[d.name for d in CASE_DIRS])
def test_case_weather_verdicts_are_this_products_own_policy(case_dir: Path, pipeline_results) -> None:
    """The share test and the threshold are the product's and the contract's, so
    no weather verdict may name a source document as their authority."""
    rec = pipeline_results[case_dir.name]
    for item in rec.disputed_items:
        assert item.verdict.rule_authority == "custom"
        assert item.verdict.measurement_basis != item.verdict.rule_id


@pytest.mark.parametrize("case_dir", CASE_DIRS, ids=[d.name for d in CASE_DIRS])
def test_case_authority_is_only_what_the_charterparty_incorporates(
    case_dir: Path, pipeline_results
) -> None:
    """None of these charterparties incorporates a ruleset by its own words, so
    none of them may report one as the authority for the reconciliation. (The
    clauses do cross-refer to each other — "in accordance with the threshold in
    Clause 3.2" — which incorporates nothing.)"""
    terms = CharterpartyTerms.model_validate_json(
        (case_dir / "extracted_charterparty.json").read_text()
    )
    rec = pipeline_results[case_dir.name]
    assert not any(
        _RULESET_INCORPORATION.search(c.text) for c in terms.clauses
    )
    assert rec.rule_authority == "custom"


@pytest.mark.parametrize("case_dir", CASE_DIRS, ids=[d.name for d in CASE_DIRS])
def test_case_threshold_is_the_charterparties_own_term(case_dir: Path, pipeline_results) -> None:
    """The figure applied must be the one the extracted charterparty states, and
    the disputed day must say so rather than leave it looking like a product
    constant or a ruleset's number."""
    terms = CharterpartyTerms.model_validate_json(
        (case_dir / "extracted_charterparty.json").read_text()
    )
    assert terms.weather_beaufort_threshold == 6
    assert terms.weather_precipitation_threshold_mm == 2.0

    rec = pipeline_results[case_dir.name]
    for item in rec.disputed_items:
        assert "charterparty's own term" in item.owner_position
        assert "Beaufort Force 6" in item.owner_position
        assert "charterparty's weather-working threshold" in item.verdict.justification


def test_cases_were_discovered() -> None:
    # Guard against the harness silently finding zero cases.
    assert len(CASE_DIRS) >= 4, f"expected >=4 test cases, found {len(CASE_DIRS)}"


# ─── The authority is derived, not read off the extractor ─────────────────────


def _terms_with_clauses(clauses: list[ClauseCitation], authority: str = "BIMCO_2013") -> CharterpartyTerms:
    base = CharterpartyTerms.model_validate_json(
        (CASE_DIRS[0] / "extracted_charterparty.json").read_text()
    )
    return base.model_copy(update={"clauses": clauses, "rule_authority": authority})


def test_extracted_ruleset_is_reported_only_when_a_clause_incorporates_it() -> None:
    """The extractor's guess is not the product's authority. A document whose
    clauses incorporate no ruleset reports `custom` however the extractor filled
    the field in, and one that expressly incorporates a named ruleset reports that
    ruleset."""
    assert _cited_rule_authority(_terms_with_clauses([])) == "custom"
    assert _cited_rule_authority(
        _terms_with_clauses(
            [ClauseCitation(page=1, bbox=(0, 0, 0, 0), text="Laytime at the berth is a matter for the parties.")]
        )
    ) == "custom"
    assert _cited_rule_authority(
        _terms_with_clauses(
            [
                ClauseCitation(
                    page=1, bbox=(0, 0, 0, 0),
                    text="This clause is to be interpreted in accordance with the "
                         "BIMCO Laytime Definitions for Charter Parties, 2013.",
                )
            ]
        )
    ) == "BIMCO_2013"


def test_internal_cross_references_do_not_count_as_incorporating_a_ruleset() -> None:
    """Clauses referring to each other incorporate nothing, so the authority stays
    `custom`."""
    assert _cited_rule_authority(
        _terms_with_clauses(
            [
                ClauseCitation(
                    page=2, bbox=(0, 0, 0, 0),
                    text="Once on demurrage the Vessel shall remain on demurrage save "
                         "only where the weather exception is validly invoked in "
                         "accordance with the threshold in Clause 3.2.",
                )
            ]
        )
    ) == "custom"
