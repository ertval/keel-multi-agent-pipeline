"""Laytime / demurrage calculation engine.

Pure deterministic arithmetic — no LLM calls. The engine processes a
party's SOF events against charterparty terms and produces a
CalculationResult with a full audit trace.

State transitions:
  BEFORE_NOR   → ON_LAYTIME   (NOR_ACCEPTED + nor_turn_time_hours)
  ON_LAYTIME   → ON_DEMURRAGE (laytime_allowance_hours exhausted)
  ON_LAYTIME   → WEATHER_PAUSE (WEATHER_DELAY_START)
  ON_DEMURRAGE → WEATHER_PAUSE (WEATHER_DELAY_START)
  WEATHER_PAUSE → ON_LAYTIME / ON_DEMURRAGE (WEATHER_DELAY_END)

SHEX: Sundays excluded from laytime counting only.
Once on demurrage: SHEX no longer applies — every hour counts.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Literal

from keel_api.schemas import (
    AuditEntry,
    CalculationResult,
    CharterpartyTerms,
    ClauseCitation,
    SOFEvent,
    SourceCitation,
)

_State = Literal["BEFORE_NOR", "ON_LAYTIME", "WEATHER_PAUSE", "ON_DEMURRAGE"]


def _eligible_laytime_hours(start: datetime, end: datetime, exception: str) -> float:
    """Laytime-eligible hours in [start, end), excluding Sundays for SHEX/FHEX."""
    if exception == "SHINC":
        return (end - start).total_seconds() / 3600.0
    total = 0.0
    cursor = start
    one_hour = timedelta(hours=1)
    while cursor < end:
        tick = min(cursor + one_hour, end)
        if cursor.weekday() != 6:  # 6 = Sunday
            total += (tick - cursor).total_seconds() / 3600.0
        cursor = tick
    return total


def _find_laytime_expiry(start: datetime, remaining_hours: float, exception: str) -> datetime:
    """Return the datetime when `remaining_hours` of SHEX-eligible time has elapsed."""
    if exception == "SHINC" or remaining_hours <= 0:
        return start + timedelta(hours=remaining_hours)
    cursor = start
    one_hour = timedelta(hours=1)
    accumulated = 0.0
    while accumulated < remaining_hours:
        tick = cursor + one_hour
        if cursor.weekday() != 6:
            chunk = min(1.0, remaining_hours - accumulated)
            accumulated += chunk
            cursor += timedelta(hours=chunk)
        else:
            cursor = tick
    return cursor


class LaytimeEngine:
    def calculate(
        self,
        terms: CharterpartyTerms,
        events: list[SOFEvent],
        party: Literal["owner", "charterer"],
    ) -> CalculationResult:
        rate_per_hour = terms.demurrage_rate_per_day_usd / 24.0
        sorted_events = sorted(events, key=lambda e: e.timestamp)

        state: _State = "BEFORE_NOR"
        laytime_consumed: float = 0.0
        demurrage_usd: float = 0.0
        trace: list[AuditEntry] = []
        seq = 0
        laytime_start: datetime | None = None
        pre_pause_state: Literal["ON_LAYTIME", "ON_DEMURRAGE"] = "ON_LAYTIME"
        prev_ts: datetime | None = None

        def emit(ts: datetime, rule: str, sof: SourceCitation | None) -> None:
            nonlocal seq
            seq += 1
            trace.append(AuditEntry(
                seq=seq,
                timestamp=ts,
                state=state,
                rule_applied=rule,
                clause_citation=None,
                sof_citation=sof,
                laytime_consumed_hours=round(laytime_consumed, 6),
                running_total_usd=round(demurrage_usd, 2),
            ))

        def advance(from_ts: datetime, to_ts: datetime) -> None:
            nonlocal state, laytime_consumed, demurrage_usd, pre_pause_state

            current_from = from_ts
            if current_from >= to_ts:
                return

            if state == "BEFORE_NOR":
                if laytime_start is not None and current_from <= laytime_start < to_ts:
                    state = "ON_LAYTIME"
                    emit(laytime_start, "Laytime commenced (turn time elapsed)", None)
                    current_from = laytime_start
                else:
                    return

            if state == "WEATHER_PAUSE":
                return

            if state == "ON_DEMURRAGE":
                demurrage_usd += (to_ts - current_from).total_seconds() / 3600.0 * rate_per_hour
                return

            # ON_LAYTIME — may transition to ON_DEMURRAGE mid-interval
            remaining = terms.laytime_allowance_hours - laytime_consumed
            eligible = _eligible_laytime_hours(current_from, to_ts, terms.laytime_exception)

            if eligible <= remaining:
                laytime_consumed += eligible
                if laytime_consumed >= terms.laytime_allowance_hours:
                    state = "ON_DEMURRAGE"
            else:
                # Laytime runs out somewhere in this interval
                laytime_consumed = terms.laytime_allowance_hours
                expiry = _find_laytime_expiry(current_from, remaining, terms.laytime_exception)
                state = "ON_DEMURRAGE"
                # Count all elapsed real hours from expiry onward as demurrage (no SHEX)
                demurrage_usd += (to_ts - expiry).total_seconds() / 3600.0 * rate_per_hour

        for event in sorted_events:
            ts = event.timestamp
            src = event.source

            if prev_ts is not None:
                advance(prev_ts, ts)

            if event.event_type == "NOR_TENDERED":
                emit(ts, "NOR tendered", src)

            elif event.event_type == "NOR_ACCEPTED":
                # Laytime starts nor_turn_time_hours after acceptance (BIMCO standard).
                laytime_start = ts + timedelta(hours=terms.nor_turn_time_hours)
                emit(ts, f"NOR accepted; laytime starts at {laytime_start.isoformat()}", src)

            elif event.event_type == "LOADING_START":
                if laytime_start is not None and ts >= laytime_start and state == "BEFORE_NOR":
                    state = "ON_LAYTIME"
                    emit(ts, "Laytime commenced", src)
                else:
                    emit(ts, "Loading started", src)

            elif event.event_type == "WEATHER_DELAY_START":
                if state in ("ON_LAYTIME", "ON_DEMURRAGE"):
                    pre_pause_state = state  # type: ignore[assignment]
                    state = "WEATHER_PAUSE"
                emit(ts, "Weather delay commenced", src)

            elif event.event_type == "WEATHER_DELAY_END":
                if state == "WEATHER_PAUSE":
                    state = "ON_DEMURRAGE" if laytime_consumed >= terms.laytime_allowance_hours else pre_pause_state
                emit(ts, "Weather delay ended", src)

            elif event.event_type in ("LOADING_END", "COMPLETED", "SHIFTING"):
                emit(ts, event.event_type, src)

            prev_ts = ts

            # Trigger laytime start if turn time has elapsed at this event's timestamp
            if laytime_start is not None and state == "BEFORE_NOR" and ts >= laytime_start:
                state = "ON_LAYTIME"
                emit(ts, "Laytime commenced (turn time elapsed)", None)

        return CalculationResult(
            voyage_id=terms.vessel,
            party=party,
            laytime_used_hours=round(laytime_consumed, 4),
            demurrage_due_usd=round(demurrage_usd, 2),
            trace=trace,
        )
