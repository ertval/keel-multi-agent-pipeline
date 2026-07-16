"""J-01 acceptance tests.

Asserts the canonical voyage_001 fixture set is structurally sound:

  - all six expected files exist
  - the weather JSON has hourly coverage of the disputed window
  - expected_reconciliation.json validates against the Reconciliation schema
  - the oracle's per-day verdict totals add up to reconciled_total_usd
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from keel_api.schemas import Reconciliation


REPO_ROOT = Path(__file__).resolve().parents[3]
FIXTURE_DIR = REPO_ROOT / "fixtures" / "voyage_001"


EXPECTED_FILES = [
    "charterparty.pdf",
    "sof_owner.pdf",
    "sof_charterer.pdf",
    "claim_owner.pdf",
    "claim_charterer.pdf",
    "weather_port_xyz.json",
    "expected_reconciliation.json",
]


@pytest.mark.parametrize("name", EXPECTED_FILES)
def test_fixture_file_exists(name: str) -> None:
    path = FIXTURE_DIR / name
    assert path.is_file(), f"missing fixture: {path}"
    assert path.stat().st_size > 0, f"empty fixture: {path}"


def test_weather_records_cover_disputed_window() -> None:
    weather = json.loads((FIXTURE_DIR / "weather_port_xyz.json").read_text())
    assert len(weather["observations"]) == 96  # 4 days × 24 hours

    force_7_rows = [
        o for o in weather["observations"] if o["wind_force_beaufort"] >= 7
    ]
    # 16 Jun 00:00 → 17 Jun 12:00 inclusive = 36 hours of Force 7
    assert len(force_7_rows) == 36


def test_expected_reconciliation_validates_against_schema() -> None:
    raw = json.loads((FIXTURE_DIR / "expected_reconciliation.json").read_text())
    reconciliation = Reconciliation.model_validate(raw)

    assert reconciliation.owner_total_usd == 187_000
    assert reconciliation.charterer_total_usd == 62_000
    assert reconciliation.reconciled_total_usd == 112_000
    assert reconciliation.rule_authority == "BIMCO_2013"
    assert len(reconciliation.disputed_items) == 3


def test_oracle_math_is_self_consistent() -> None:
    raw = json.loads((FIXTURE_DIR / "expected_reconciliation.json").read_text())
    reconciliation = Reconciliation.model_validate(raw)

    credited = sum(
        item.verdict.dollars_credited_to_owner_usd
        for item in reconciliation.disputed_items
    )
    assert reconciliation.charterer_total_usd + credited == reconciliation.reconciled_total_usd

    winners = [item.verdict.winner for item in reconciliation.disputed_items]
    assert winners.count("owner") == 2
    assert winners.count("charterer") == 1
