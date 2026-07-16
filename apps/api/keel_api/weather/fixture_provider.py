"""Fixture-backed WeatherProvider for testing and demo.

Loads weather_port_xyz.json from a fixture directory and filters
observations to the requested time window. Satisfies the WeatherProvider
protocol defined in schemas.py.
"""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

from keel_api.schemas import WeatherObservation, WeatherProvider


class FixtureWeatherProvider:
    """Implements WeatherProvider using a pre-built fixture JSON file.

    The fixture file must live at `fixture_dir / "weather_port_xyz.json"`
    and contain an `observations` array matching the WeatherObservation schema.
    """

    def __init__(self, fixture_dir: Path) -> None:
        path = fixture_dir / "weather_port_xyz.json"
        raw = json.loads(path.read_text())
        self._observations: list[WeatherObservation] = [
            WeatherObservation.model_validate(o) for o in raw["observations"]
        ]

    def get(
        self,
        port_lat: float,
        port_lon: float,
        start: datetime,
        end: datetime,
    ) -> list[WeatherObservation]:
        # Normalise to UTC-aware for comparison
        def _utc(dt: datetime) -> datetime:
            if dt.tzinfo is None:
                from datetime import timezone
                return dt.replace(tzinfo=timezone.utc)
            return dt

        start_utc = _utc(start)
        end_utc = _utc(end)

        return [
            obs for obs in self._observations
            if start_utc <= _utc(obs.timestamp) <= end_utc
        ]
