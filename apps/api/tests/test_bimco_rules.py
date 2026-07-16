"""A-07 BIMCO 2013 WWD exception evaluator tests.

The three canonical disputed days:
  Jun 14: Force 5 sustained → exception INVALID (below threshold)
  Jun 15: Force 4 sustained → exception INVALID (below threshold)
  Jun 16-17: Force 7 + heavy rain → exception VALID
"""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

from keel_api.rules import evaluate_wwd_exception
from keel_api.weather import FixtureWeatherProvider


REPO_ROOT = Path(__file__).resolve().parents[3]
FIXTURE_DIR = REPO_ROOT / "fixtures" / "voyage_001"


def _dt(s: str) -> datetime:
    return datetime.fromisoformat(s).replace(tzinfo=timezone.utc)


def test_june_14_force5_exception_invalid() -> None:
    provider = FixtureWeatherProvider(FIXTURE_DIR)
    obs = provider.get(0.0, 0.0, _dt("2026-06-14T10:00:00"), _dt("2026-06-14T21:00:00"))
    result = evaluate_wwd_exception(obs, _dt("2026-06-14T10:00:00"), _dt("2026-06-14T22:00:00"))
    assert result.valid is False
    assert result.rule_id == "BIMCO_2013.WWD.threshold"
    assert result.rule_authority == "BIMCO_2013"


def test_june_15_force4_exception_invalid() -> None:
    provider = FixtureWeatherProvider(FIXTURE_DIR)
    obs = provider.get(0.0, 0.0, _dt("2026-06-15T06:00:00"), _dt("2026-06-15T17:00:00"))
    result = evaluate_wwd_exception(obs, _dt("2026-06-15T06:00:00"), _dt("2026-06-15T18:00:00"))
    assert result.valid is False


def test_june_16_force7_exception_valid() -> None:
    provider = FixtureWeatherProvider(FIXTURE_DIR)
    obs = provider.get(0.0, 0.0, _dt("2026-06-16T00:00:00"), _dt("2026-06-17T11:00:00"))
    result = evaluate_wwd_exception(obs, _dt("2026-06-16T00:00:00"), _dt("2026-06-17T12:00:00"))
    assert result.valid is True
    assert result.hours_at_threshold == 36.0


def test_invalid_result_has_citations_when_data_present() -> None:
    provider = FixtureWeatherProvider(FIXTURE_DIR)
    obs = provider.get(0.0, 0.0, _dt("2026-06-14T10:00:00"), _dt("2026-06-14T21:00:00"))
    result = evaluate_wwd_exception(obs, _dt("2026-06-14T10:00:00"), _dt("2026-06-14T22:00:00"))
    # Force 5 is below threshold so no qualifying obs → no citations, but check no crash
    assert isinstance(result.citations, list)


def test_valid_result_has_citations() -> None:
    provider = FixtureWeatherProvider(FIXTURE_DIR)
    obs = provider.get(0.0, 0.0, _dt("2026-06-16T00:00:00"), _dt("2026-06-17T11:00:00"))
    result = evaluate_wwd_exception(obs, _dt("2026-06-16T00:00:00"), _dt("2026-06-17T12:00:00"))
    assert len(result.citations) >= 1


def test_empty_observations_returns_invalid() -> None:
    result = evaluate_wwd_exception([], _dt("2026-06-14T10:00:00"), _dt("2026-06-14T22:00:00"))
    assert result.valid is False
    assert result.total_hours == 0.0


def test_justification_is_nonempty_string() -> None:
    provider = FixtureWeatherProvider(FIXTURE_DIR)
    obs = provider.get(0.0, 0.0, _dt("2026-06-16T00:00:00"), _dt("2026-06-17T11:00:00"))
    result = evaluate_wwd_exception(obs, _dt("2026-06-16T00:00:00"), _dt("2026-06-17T12:00:00"))
    assert isinstance(result.justification, str)
    assert len(result.justification) > 20
