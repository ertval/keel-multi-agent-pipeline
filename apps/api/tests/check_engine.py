from pathlib import Path
from keel_api.engine.state_machine import LaytimeEngine
from keel_api.schemas import CharterpartyTerms, ClauseCitation, SOFEvent, SourceCitation
from datetime import datetime, timezone

def _dt(s: str) -> datetime:
    return datetime.fromisoformat(s.replace(" ", "T")).replace(tzinfo=timezone.utc)

def _src(page: int, text: str) -> SourceCitation:
    return SourceCitation(page=page, bbox=(0.0, 0.0, 0.0, 0.0), row_text=text)

# Let's write down the CP terms exactly from charterparty.pdf
terms = CharterpartyTerms(
    vessel="MV Hellenic Pioneer",
    charterer="Mediterranean Grains Ltd.",
    owner="Aegean Shipping Co.",
    load_port="Piraeus",
    load_port_lat=37.942,
    load_port_lon=23.647,
    laytime_allowance_hours=84.0,
    demurrage_rate_per_day_usd=50_000.0,
    despatch_rate_per_day_usd=25_000.0,
    nor_turn_time_hours=6.0,
    laytime_exception="SHEX",
    weather_clause="WWD",
    rule_authority="BIMCO_2013",
    clauses=[ClauseCitation(page=3, bbox=(50.0, 600.0, 500.0, 680.0), text="Clause 3.1 WWD")],
)

# Owner events from sof_owner.pdf
owner_events = [
    SOFEvent(timestamp=_dt("2026-06-10 06:00"), event_type="NOR_TENDERED", description="NOR tendered", source=_src(1, "06:00 NOR Tendered")),
    SOFEvent(timestamp=_dt("2026-06-10 12:00"), event_type="NOR_ACCEPTED", description="NOR accepted", source=_src(1, "12:00 NOR Accepted")),
    SOFEvent(timestamp=_dt("2026-06-10 13:30"), event_type="LOADING_START", description="Loading commenced", source=_src(1, "13:30 Loading Commenced")),
    SOFEvent(timestamp=_dt("2026-06-17 17:46"), event_type="COMPLETED", description="Loading completed", source=_src(1, "17:46 Loading Completed")),
]

# Charterer events from sof_charterer.pdf
charterer_events = [
    SOFEvent(timestamp=_dt("2026-06-10 06:00"), event_type="NOR_TENDERED", description="NOR tendered", source=_src(1, "06:00 NOR Tendered")),
    SOFEvent(timestamp=_dt("2026-06-10 12:00"), event_type="NOR_ACCEPTED", description="NOR accepted", source=_src(1, "12:00 NOR Accepted")),
    SOFEvent(timestamp=_dt("2026-06-10 13:30"), event_type="LOADING_START", description="Loading commenced", source=_src(1, "13:30 Loading Commenced")),
    SOFEvent(timestamp=_dt("2026-06-14 10:00"), event_type="WEATHER_DELAY_START", description="Weather delay commences", source=_src(1, "10:00 Weather Delay")),
    SOFEvent(timestamp=_dt("2026-06-14 22:00"), event_type="WEATHER_DELAY_END", description="Weather delay ends", source=_src(1, "22:00 Weather Delay Ended")),
    SOFEvent(timestamp=_dt("2026-06-15 06:00"), event_type="WEATHER_DELAY_START", description="Weather delay commences", source=_src(1, "06:00 Weather Delay")),
    SOFEvent(timestamp=_dt("2026-06-15 18:00"), event_type="WEATHER_DELAY_END", description="Weather delay ends", source=_src(1, "18:00 Weather Delay Ended")),
    SOFEvent(timestamp=_dt("2026-06-16 00:00"), event_type="WEATHER_DELAY_START", description="Weather delay commences", source=_src(1, "00:00 Heavy Weather Commenced")),
    SOFEvent(timestamp=_dt("2026-06-17 12:00"), event_type="WEATHER_DELAY_END", description="Weather delay ends", source=_src(1, "12:00 Heavy Weather Ceased")),
    SOFEvent(timestamp=_dt("2026-06-17 17:46"), event_type="COMPLETED", description="Loading completed", source=_src(1, "17:46 Loading Completed")),
]

engine = LaytimeEngine()
res_owner = engine.calculate(terms, owner_events, "owner")
res_charterer = engine.calculate(terms, charterer_events, "charterer")

print("OWNER TOTAL:", res_owner.demurrage_due_usd)
print("OWNER LAYTIME USED:", res_owner.laytime_used_hours)
print("CHARTERER TOTAL:", res_charterer.demurrage_due_usd)
print("CHARTERER LAYTIME USED:", res_charterer.laytime_used_hours)
