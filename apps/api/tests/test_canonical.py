"""Canonical assertion test — the north star for the 12-hour build.

This test drives the full pipeline against the canonical voyage_001
fixture (see PRD §4) and asserts the exact reconciled outcome:

    owner_total_usd        == 187_000
    charterer_total_usd    == 62_000
    reconciled_total_usd   == 112_000

with three per-day verdicts:

    June 14 → owner    (Force 5, below BIMCO 2013 WWD threshold)
    June 15 → owner    (Force 4, below BIMCO 2013 WWD threshold)
    June 16 → charterer (Force 7 + heavy rain, meets WWD threshold)

The test is intentionally FAILING at this point — it will go green at
J-03 once tickets A-03 through A-08 are complete. Until then it surfaces
a clear NotImplementedError pointing at the next work to do.

DO NOT XFAIL OR SKIP THIS TEST. Its failure is the hour-by-hour
progress signal for the whole build. When it passes, J-03 is green.
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
def test_voyage_001_uses_bimco_2013_authority() -> None:
    reconciliation, _, _, _ = run_voyage_pipeline(FIXTURE_DIR)
    assert reconciliation.rule_authority == "BIMCO_2013"
    for item in reconciliation.disputed_items:
        assert item.verdict.rule_authority == "BIMCO_2013"
