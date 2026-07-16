from __future__ import annotations

from datetime import datetime
from keel_api.schemas import SOFEvent

def identify_disputed_periods(
    owner_events: list[SOFEvent],
    charterer_events: list[SOFEvent],
) -> list[tuple[datetime, datetime]]:
    """Identify intervals where charterer claims a weather delay.
    
    Returns a list of (start_datetime, end_datetime) tuples.
    """
    sorted_events = sorted(charterer_events, key=lambda e: e.timestamp)
    disputed = []
    
    start_ts = None
    for event in sorted_events:
        if event.event_type == "WEATHER_DELAY_START":
            start_ts = event.timestamp
        elif event.event_type == "WEATHER_DELAY_END" and start_ts is not None:
            disputed.append((start_ts, event.timestamp))
            start_ts = None
            
    return disputed
