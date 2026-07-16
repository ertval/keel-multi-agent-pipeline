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
def test_case_uses_bimco_2013(case_dir: Path, pipeline_results) -> None:
    rec = pipeline_results[case_dir.name]
    assert rec.rule_authority == "BIMCO_2013"
    for item in rec.disputed_items:
        assert item.verdict.rule_authority == "BIMCO_2013"


def test_cases_were_discovered() -> None:
    # Guard against the harness silently finding zero cases.
    assert len(CASE_DIRS) >= 4, f"expected >=4 test cases, found {len(CASE_DIRS)}"
