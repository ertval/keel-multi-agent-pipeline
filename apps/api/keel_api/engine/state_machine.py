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

SHEX: Sundays excluded from laytime counting only, and only while on laytime.
FHEX is not implemented — the code excludes Sundays and nothing else, so a
charterparty drafted FHEX needs its holidays extracted before this engine can
honour it.

Once on demurrage, the day-counting exceptions stop applying: the ON_DEMURRAGE
branch accrues every real hour, Sundays and holidays included. Definition 30 of
the Laytime Definitions for Charter Parties 2013 provides that demurrage is not
subject to exceptions which apply to laytime unless specifically stated in the
charter party, so that is the default the engine implements for the SHEX/SHINC
axis.

The weather exception is different, and here the engine does not implement
definition 30's default: a WEATHER_DELAY_START suspends accrual whether the
vessel is on laytime or on demurrage, unconditionally, and no clause is
consulted to decide. That is deliberate and correct for a charterparty drafted
the way this engine's callers' documents are — one that states the weather
exception to cover the claimed period expressly (the canonical fixture's clause
4 does, saving the demurrage rule for "where the weather exception ... is
validly invoked"). For a charterparty that did *not* so state it, definition 30
would bar the suspension on demurrage and this engine would still apply it,
over-crediting the charterer. There is no contract field that distinguishes the
two cases, so closing the gap would need one, and none has been added here.

Weather clause
--------------
`weather_clause` fixes how much of a weather interruption is struck off,
measured against the Laytime Definitions for Charter Parties 2013
(BIMCO Special Circular 8). It does not decide whether the interruption
is a valid claim; that is adjudicated from weather records.

  Definition 15  pro-rata    the interruption counts by reference to the
                              ratio the interruption bears to the time
                              that would have been worked but for it,
                              the reference period being 24 hours: a two
                              hour stoppage in an eight hour working day
                              is pro-rated to six hours, and to four
                              hours in a twelve hour working day.
                              No deduction is made for rain occurring
                              outside normal working hours.
  Definition 16  actual      the actual period of the interruption is
                              excluded, at any time on a working day,
                              during or outside normal working hours and
                              including periods on turn.
  Definition 17  24 wkg h    a period of 24 hours made up of one or more
                              Working Days — an artificial day of
                              twenty-four working hours, with laytime
                              suspended for the stoppage.
  Definition 18  (WORKING DAY) WEATHER PERMITTING has the same meaning as
                  definition 16.

The weather clause label is a charterparty drafting convention, not a
BIMCO term: it carries no definition number of its own, and which of
definitions 15 to 18 a given charterparty adopted is fixed by its own
wording, not by the label. A bare "WWD" is the sharpest case — definition 15
*is* "WEATHER WORKING DAY", so the label sits closer to 15 than to 16's
"WWD OF 24 CONSECUTIVE HOURS" and is genuinely ambiguous between them. The basis
each label selects here:

  "WWD"                → ACTUAL_PERIOD   the actual-period measurement
                                           (definition 16's mechanic)
  "WEATHER PERMITTING" → ACTUAL_PERIOD   definition 18 gives that term the
                                           same meaning as definition 16
  "WWDSHEX"            → ARTIFICIAL_DAY  the artificial 24-working-hour day
                                           (definition 17)
  "WWDSHINC"           → ARTIFICIAL_DAY  as above
  "none"               → no weather exception; the interruption is worked
                                           normally

Definition 15's pro-rata basis cannot be inferred from a label at all: the ratio
runs against a stated working day, and CharterpartyTerms carries no working-day
term, so no label selects it. Adding one is a contract change, not an engine
change.

Limitation — ACTUAL_PERIOD and ARTIFICIAL_DAY are not distinguished. The
artificial working day of definition 17 is not modelled, so `_struck_off_hours`
returns the same hours for both bases and a WWDSHEX or WWDSHINC charterparty is
computed on the actual-period measure. Definition 17's counting unit is 24
*working* hours, so a stoppage of 10 clock hours spanning about 2 working hours
should suspend about 2, not 10: on such a charterparty this engine over-credits
the charterer. The two bases are therefore not interchangeable in law and are
not interchangeable here either — they are merely not yet told apart. No test
asserts that the artificial day changes the exclusion, because it does not.

SHEX / SHINC are a separate axis and do not select a weather basis.
`laytime_exception` carries them: SHEX and SHINC are charterparty
day-counting conventions for EXCEPTED/EXCLUDED days, belonging to the
territory of definition 19, and are not terms of the Laytime Definitions.
They compose with whichever weather basis `weather_clause` selects: a
composite "WWDSHEX" label says the weather basis and the day-counting
convention together, the latter being read from `laytime_exception`.

Definition 15 is implemented as `_pro_rata_struck_off_hours` but no
`weather_clause` value selects it: the pro-rata share is stated against a
working day of a stated length, and CharterpartyTerms carries no working
day term. Adding one is a contract change, not an engine change.
"""

from __future__ import annotations

import re
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
_WeatherBasis = Literal["NONE", "ACTUAL_PERIOD", "ARTIFICIAL_DAY"]

_WEATHER_CLAUSE_BASIS: dict[str, _WeatherBasis] = {
    "WWD": "ACTUAL_PERIOD",
    "WEATHER PERMITTING": "ACTUAL_PERIOD",
    "WWDSHEX": "ARTIFICIAL_DAY",
    "WWDSHINC": "ARTIFICIAL_DAY",
    "none": "NONE",
}

# A charterparty clause states the weather exception when it makes time lost to
# weather not count as laytime, and states its threshold when it says what the
# threshold for invoking that exception is. Clauses that only cross-reference the
# exception (the on-demurrage clause) state neither, so they are not cited.
_WEATHER_EXCEPTION_CLAUSE = re.compile(
    r"time lost (?:on account of|due to) (?:bad )?weather"
    r"|weather[^.]{0,80}shall not count as laytime"
    r"|threshold for invocation of the weather exception",
    re.IGNORECASE,
)

_THRESHOLD_CLAUSE = re.compile(
    r"threshold for invocation of the weather exception",
    re.IGNORECASE,
)


def weather_exception_clauses(terms: CharterpartyTerms) -> list[ClauseCitation]:
    """The charterparty clauses that state the weather exception and its threshold.

    Returns an empty list when the extracted charterparty carries no clause
    matching the concept; a disputed day is then left without a clause
    citation rather than given an arbitrary one.
    """
    return [c for c in terms.clauses if _WEATHER_EXCEPTION_CLAUSE.search(c.text)]


def threshold_clause(terms: CharterpartyTerms) -> ClauseCitation | None:
    """The clause the weather-working threshold figures are read from, if any."""
    for clause in terms.clauses:
        if _THRESHOLD_CLAUSE.search(clause.text):
            return clause
    return None


def weather_basis(weather_clause: str) -> _WeatherBasis:
    """Return the measurement basis a weather clause label selects.

    The label is the charterparty's own drafting convention, not a citation, so
    this returns the basis this product computes on — it does not report which
    definition the charterparty adopted. ACTUAL_PERIOD and ARTIFICIAL_DAY are not
    distinguished by the arithmetic: see the module docstring's limitation note.
    """
    return _WEATHER_CLAUSE_BASIS[weather_clause]


def _struck_off_hours(hours: float, basis: _WeatherBasis) -> float:
    """Hours a weather interruption of `hours` takes off laytime.

    ACTUAL_PERIOD and ARTIFICIAL_DAY both return `hours`: the artificial working
    day of definition 17 is not modelled, so the two bases are not told apart
    here. See the module docstring's limitation note.
    """
    if basis == "NONE":
        return 0.0
    return hours


def _pro_rata_struck_off_hours(interruption_hours: float, working_day_hours: float) -> float:
    """Definition 15's arithmetic, and nothing else.

    Returns `interruption_hours` scaled against a period of 24 hours by the
    working day it fell in, so a two hour stoppage in an eight hour working day
    returns six and in a twelve hour working day four. The source states no cap
    on the ratio, so the result is not capped at one working day.

    This function is not called by `calculate`, no `weather_clause` value selects
    it, and nothing adds its result to the end of laytime: the extension of
    laytime the definition describes, and the working day the ratio needs, are
    both outside what this engine models.
    """
    return interruption_hours * 24.0 / working_day_hours



def _eligible_laytime_hours(start: datetime, end: datetime, exception: str) -> float:
    """Laytime-eligible hours in [start, end), excluding Sundays for SHEX.

    FHEX is not implemented: for any exception other than SHINC this excludes
    Sundays only, and no holidays."""
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
        basis = weather_basis(terms.weather_clause)
        # The weather-exception clause the trail cites on the rows that suspend
        # time. None when the extracted charterparty states no such clause, and
        # the rows then carry no citation rather than an invented one.
        weather_clauses = weather_exception_clauses(terms)
        weather_clause_citation = weather_clauses[0] if weather_clauses else None
        sorted_events = sorted(events, key=lambda e: e.timestamp)

        state: _State = "BEFORE_NOR"
        laytime_consumed: float = 0.0
        demurrage_usd: float = 0.0
        trace: list[AuditEntry] = []
        seq = 0
        laytime_start: datetime | None = None
        pre_pause_state: Literal["ON_LAYTIME", "ON_DEMURRAGE"] = "ON_LAYTIME"
        weather_window_start: datetime | None = None
        prev_ts: datetime | None = None

        def emit(
            ts: datetime,
            rule: str,
            sof: SourceCitation | None,
            clause: ClauseCitation | None = None,
        ) -> None:
            nonlocal seq
            seq += 1
            trace.append(AuditEntry(
                seq=seq,
                timestamp=ts,
                state=state,
                rule_applied=rule,
                clause_citation=clause,
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
                # Laytime starts nor_turn_time_hours after acceptance. The figure
                # is the charterparty's own: the 2013 definitions' definition 25
                # defers to the charter party for it, and no source sets a default.
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
                    weather_window_start = ts
                    state = "WEATHER_PAUSE"
                emit(ts, "Weather delay commenced", src, weather_clause_citation)

            elif event.event_type == "WEATHER_DELAY_END":
                resumed_from: datetime | None = None
                if state == "WEATHER_PAUSE":
                    state = "ON_DEMURRAGE" if laytime_consumed >= terms.laytime_allowance_hours else pre_pause_state
                    if weather_window_start is not None:
                        window = (ts - weather_window_start).total_seconds() / 3600.0
                        weather_window_start = None
                        worked = window - _struck_off_hours(window, basis)
                        if worked > 0.0:
                            resumed_from = ts - timedelta(hours=worked)
                emit(ts, f"Weather delay ended; {basis} basis", src, weather_clause_citation)
                if resumed_from is not None:
                    advance(resumed_from, ts)

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
