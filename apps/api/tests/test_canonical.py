"""Canonical assertion test — the north star for the 12-hour build.

This test drives the full pipeline against the canonical voyage_001
fixture (see PRD §4) and asserts the exact reconciled outcome:

    owner_total_usd        == 187_000
    charterer_total_usd    == 62_000
    reconciled_total_usd   == 112_000

with three per-day verdicts:

    June 14 → owner    (Force 5, below the threshold in the charterparty's clause 3.2)
    June 15 → owner    (Force 4, below the threshold in the charterparty's clause 3.2)
    June 16 → charterer (Force 7 + heavy rain, threshold met and operations prevented)

The threshold is this charterparty's own term and the share of hours that must
meet it is this product's own policy, so every weather verdict's authority is
`custom`. The reconciliation's authority is the ruleset the charterparty itself
incorporates, which for voyage_001 is the 2013 Laytime Definitions, named in its
clause 3.1.

This is the end-to-end north-star assertion for voyage_001. It is expected
to pass once the pipeline, weather rules, and reconciliation are wired.
"""

from __future__ import annotations

from datetime import date
from pathlib import Path

import pytest

from keel_api.pipeline import run_voyage_pipeline


REPO_ROOT = Path(__file__).resolve().parents[3]
FIXTURE_DIR = REPO_ROOT / "fixtures" / "voyage_001"


@pytest.mark.canonical
def test_voyage_001_reconciles_to_112k() -> None:
    reconciliation, _, _, _ = run_voyage_pipeline(FIXTURE_DIR)

    assert reconciliation.owner_total_usd == 187_000
    assert reconciliation.charterer_total_usd == 62_000
    assert reconciliation.reconciled_total_usd == 112_000


@pytest.mark.canonical
def test_voyage_001_disputed_days_have_expected_verdicts() -> None:
    reconciliation, _, _, _ = run_voyage_pipeline(FIXTURE_DIR)

    by_date = {item.disputed_date: item for item in reconciliation.disputed_items}
    assert set(by_date) == {date(2026, 6, 14), date(2026, 6, 15), date(2026, 6, 16)}

    assert by_date[date(2026, 6, 14)].verdict.winner == "owner"
    assert by_date[date(2026, 6, 15)].verdict.winner == "owner"
    assert by_date[date(2026, 6, 16)].verdict.winner == "charterer"


@pytest.mark.canonical
def test_voyage_001_authority_claims_nothing_the_charterparty_does_not_say() -> None:
    """The reconciliation's authority is what the charterparty incorporates; each
    weather verdict's is this product's own policy against the clause. No verdict
    may claim a source document is the authority for the threshold or the share
    test, because no source supplies either."""
    reconciliation, terms, _, _ = run_voyage_pipeline(FIXTURE_DIR)

    assert reconciliation.rule_authority == "BIMCO_2013"
    incorporated = [
        c.text for c in terms.clauses
        if "in accordance with the BIMCO Laytime Definitions" in c.text
    ]
    assert incorporated, "reconciliation names a ruleset no clause incorporates"

    for item in reconciliation.disputed_items:
        assert item.verdict.rule_authority == "custom"
