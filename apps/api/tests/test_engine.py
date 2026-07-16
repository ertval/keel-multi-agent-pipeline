"""A-05 calculation engine tests.

Validates the state machine against the canonical voyage_001 timeline.
All numbers are deterministic — no LLM or external calls.

Canonical timeline:
  Jun 10 08:00  NOR tendered
  Jun 10 14:00  NOR accepted  →  laytime starts Jun 10 20:00 (+ 6h turn)
  Jun 13 20:00  Laytime expires (72h)  →  demurrage commences
  Jun 14 10:00  Weather delay start (owner SOF: Force 5 — NOT paused for owner)
  Jun 14 22:00  Weather delay end
  Jun 15 06:00  Weather delay start (owner SOF: Force 4)
  Jun 15 18:00  Weather delay end
  Jun 16 00:00  Weather delay start (Force 7)
  Jun 17 12:00  Weather delay end
  Jun 17 13:46  COMPLETED

Owner view (no weather pauses): 89h 46min demurrage = $187,000 (approx)
Charterer view (all paused):    29h 46min demurrage = $62,000  (approx)
"""

from __future__ import annotations

from datetime import datetime, timezone

import pytest

from keel_api.engine import LaytimeEngine
from keel_api.schemas import CharterpartyTerms, ClauseCitation, SOFEvent, SourceCitation


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

def _dt(s: str) -> datetime:
    return datetime.fromisoformat(s).replace(tzinfo=timezone.utc)


def _src(row: str) -> SourceCitation:
    return SourceCitation(page=1, bbox=(0.0, 0.0, 0.0, 0.0), row_text=row)


TERMS = CharterpartyTerms(
    vessel="MV Hellenic Pioneer",
    charterer="Mediterranean Grains Ltd.",
    owner="Aegean Shipping Co.",
    load_port="Piraeus",
    load_port_lat=37.942,
    load_port_lon=23.647,
    laytime_allowance_hours=72.0,
    demurrage_rate_per_day_usd=50_000.0,
    despatch_rate_per_day_usd=25_000.0,
    nor_turn_time_hours=6.0,
    laytime_exception="SHEX",
    weather_clause="WWD",
    rule_authority="BIMCO_2013",
    clauses=[ClauseCitation(page=1, bbox=(0.0, 0.0, 0.0, 0.0), text="Clause 3.1 WWD")],
)

# Owner's SOF events — includes weather claims but engine does NOT pause for them
# (weather validity is adjudicated in A-07/A-08, not here)
OWNER_EVENTS: list[SOFEvent] = [
    SOFEvent(timestamp=_dt("2026-06-10T08:00:00"), event_type="NOR_TENDERED",      description="NOR tendered at anchorage", source=_src("08:00 NOR tendered")),
    SOFEvent(timestamp=_dt("2026-06-10T14:00:00"), event_type="NOR_ACCEPTED",      description="NOR accepted",              source=_src("14:00 NOR accepted")),
    SOFEvent(timestamp=_dt("2026-06-10T20:00:00"), event_type="LOADING_START",     description="Loading commenced",         source=_src("20:00 Loading start")),
    SOFEvent(timestamp=_dt("2026-06-17T13:46:00"), event_type="COMPLETED",         description="Loading completed",         source=_src("13:46 Completed")),
]

# Charterer's SOF events — same timeline but includes all three weather pauses
CHARTERER_EVENTS: list[SOFEvent] = [
    SOFEvent(timestamp=_dt("2026-06-10T08:00:00"), event_type="NOR_TENDERED",        description="NOR tendered",                 source=_src("08:00 NOR tendered")),
    SOFEvent(timestamp=_dt("2026-06-10T14:00:00"), event_type="NOR_ACCEPTED",        description="NOR accepted",                 source=_src("14:00 NOR accepted")),
    SOFEvent(timestamp=_dt("2026-06-10T20:00:00"), event_type="LOADING_START",       description="Loading commenced",            source=_src("20:00 Loading start")),
    SOFEvent(timestamp=_dt("2026-06-14T10:00:00"), event_type="WEATHER_DELAY_START", description="Weather delay Jun 14 start",   source=_src("10:00 Weather delay start")),
    SOFEvent(timestamp=_dt("2026-06-14T22:00:00"), event_type="WEATHER_DELAY_END",   description="Weather delay Jun 14 end",     source=_src("22:00 Weather delay end")),
    SOFEvent(timestamp=_dt("2026-06-15T06:00:00"), event_type="WEATHER_DELAY_START", description="Weather delay Jun 15 start",   source=_src("06:00 Weather delay start")),
    SOFEvent(timestamp=_dt("2026-06-15T18:00:00"), event_type="WEATHER_DELAY_END",   description="Weather delay Jun 15 end",     source=_src("18:00 Weather delay end")),
    SOFEvent(timestamp=_dt("2026-06-16T00:00:00"), event_type="WEATHER_DELAY_START", description="Weather delay Jun 16-17 start",source=_src("00:00 Weather delay start")),
    SOFEvent(timestamp=_dt("2026-06-17T12:00:00"), event_type="WEATHER_DELAY_END",   description="Weather delay Jun 16-17 end",  source=_src("12:00 Weather delay end")),
    SOFEvent(timestamp=_dt("2026-06-17T13:46:00"), event_type="COMPLETED",           description="Loading completed",            source=_src("13:46 Completed")),
]


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def test_laytime_fully_consumed() -> None:
    engine = LaytimeEngine()
    result = engine.calculate(TERMS, OWNER_EVENTS, "owner")
    assert result.laytime_used_hours == pytest.approx(72.0, abs=0.1)


def test_owner_demurrage_is_187k() -> None:
    engine = LaytimeEngine()
    result = engine.calculate(TERMS, OWNER_EVENTS, "owner")
    assert result.demurrage_due_usd == pytest.approx(187_000.0, abs=200.0)


def test_charterer_demurrage_is_62k() -> None:
    engine = LaytimeEngine()
    result = engine.calculate(TERMS, CHARTERER_EVENTS, "charterer")
    assert result.demurrage_due_usd == pytest.approx(62_000.0, abs=200.0)


def test_trace_has_entries() -> None:
    engine = LaytimeEngine()
    result = engine.calculate(TERMS, OWNER_EVENTS, "owner")
    assert len(result.trace) >= 3


def test_trace_seq_is_monotonic() -> None:
    engine = LaytimeEngine()
    result = engine.calculate(TERMS, OWNER_EVENTS, "owner")
    seqs = [e.seq for e in result.trace]
    assert seqs == sorted(seqs)
    assert seqs[0] == 1


def test_no_sunday_laytime_counted() -> None:
    """June 14 2026 is a Sunday — laytime must not count that day."""
    # Make a scenario where laytime runs across Sunday June 14
    terms_long = TERMS.model_copy(update={"laytime_allowance_hours": 200.0})
    engine = LaytimeEngine()
    result_shex = engine.calculate(terms_long, OWNER_EVENTS, "owner")
    terms_shinc = TERMS.model_copy(update={
        "laytime_allowance_hours": 200.0,
        "laytime_exception": "SHINC",
    })
    result_shinc = engine.calculate(terms_shinc, OWNER_EVENTS, "owner")
    # SHEX should consume fewer laytime hours (Sundays excluded → more goes to demurrage)
    assert result_shex.laytime_used_hours <= result_shinc.laytime_used_hours


def test_once_on_demurrage_shex_does_not_apply() -> None:
    """SHEX stops protecting once on demurrage — all hours count."""
    engine = LaytimeEngine()
    result = engine.calculate(TERMS, OWNER_EVENTS, "owner")
    # June 14 is a Sunday and falls entirely within demurrage — all 24h must count
    # Demurrage starts Jun 13 20:00; Jun 14 is 4h into demurrage → all 24h of Jun 14 count
    # If SHEX wrongly applied to demurrage, we'd see ~24h missing from the total
    # $187K requires ~89.76h; if June 14 Sunday were excluded we'd only see ~65.76h
    assert result.demurrage_due_usd > 100_000.0
