"""A-06 weather provider tests."""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

from keel_api.weather import FixtureWeatherProvider


REPO_ROOT = Path(__file__).resolve().parents[3]
FIXTURE_DIR = REPO_ROOT / "fixtures" / "voyage_001"


def _dt(s: str) -> datetime:
    return datetime.fromisoformat(s).replace(tzinfo=timezone.utc)


def test_loads_all_96_observations() -> None:
    provider = FixtureWeatherProvider(FIXTURE_DIR)
    all_obs = provider.get(0.0, 0.0, _dt("2026-06-14T00:00:00"), _dt("2026-06-17T23:00:00"))
    assert len(all_obs) == 96


def test_window_filter_returns_correct_subset() -> None:
    provider = FixtureWeatherProvider(FIXTURE_DIR)
    # June 16 00:00 → June 17 12:00 = 37 hours inclusive
    obs = provider.get(0.0, 0.0, _dt("2026-06-16T00:00:00"), _dt("2026-06-17T12:00:00"))
    assert len(obs) == 37


def test_force_7_hours_in_window() -> None:
    provider = FixtureWeatherProvider(FIXTURE_DIR)
    obs = provider.get(0.0, 0.0, _dt("2026-06-16T00:00:00"), _dt("2026-06-17T12:00:00"))
    force7 = [o for o in obs if o.wind_force_beaufort >= 7]
    # 36 hours of Force 7: Jun 16 00:00 → Jun 17 11:00; Jun 17 12:00 transitions back
    assert len(force7) == 36


def test_june_14_is_force_5() -> None:
    provider = FixtureWeatherProvider(FIXTURE_DIR)
    obs = provider.get(0.0, 0.0, _dt("2026-06-14T10:00:00"), _dt("2026-06-14T21:00:00"))
    assert all(o.wind_force_beaufort == 5 for o in obs)


def test_june_15_is_force_4() -> None:
    provider = FixtureWeatherProvider(FIXTURE_DIR)
    obs = provider.get(0.0, 0.0, _dt("2026-06-15T06:00:00"), _dt("2026-06-15T17:00:00"))
    assert all(o.wind_force_beaufort == 4 for o in obs)


def test_observations_are_weather_observation_instances() -> None:
    from keel_api.schemas import WeatherObservation
    provider = FixtureWeatherProvider(FIXTURE_DIR)
    obs = provider.get(0.0, 0.0, _dt("2026-06-14T00:00:00"), _dt("2026-06-14T02:00:00"))
    assert all(isinstance(o, WeatherObservation) for o in obs)
