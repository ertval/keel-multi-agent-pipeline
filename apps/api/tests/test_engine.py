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

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import get_args

import pytest

from keel_api.engine import LaytimeEngine
from keel_api.engine import state_machine
from keel_api.engine.state_machine import (
    _pro_rata_struck_off_hours,
    _struck_off_hours,
    _WEATHER_CLAUSE_BASIS,
    weather_basis,
)
from keel_api.extraction.extractor import _CHARTERPARTY_SCHEMA
from keel_api.schemas import (
    WEATHER_CLAUSE_VALUES,
    CharterpartyTerms,
    ClauseCitation,
    SOFEvent,
    SourceCitation,
)


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


# ---------------------------------------------------------------------------
# A-05b Weather clause wiring (CharterpartyTerms.weather_clause → engine)
# ---------------------------------------------------------------------------

# Terms and a timeline built so the weather arithmetic is readable:
#   24h laytime from Jun 10 00:00 expires Jun 11 00:00 (no Sunday in span)
#   rate 24,000/day = 1,000/hour, so hours and dollars are interchangeable
#   a single 30h weather window opens while already on demurrage
#   demurrage would run 60h / $60,000 if the window took nothing off
MODE_TERMS = CharterpartyTerms(
    vessel="MV Hellenic Pioneer",
    charterer="Mediterranean Grains Ltd.",
    owner="Aegean Shipping Co.",
    load_port="Piraeus",
    load_port_lat=37.942,
    load_port_lon=23.647,
    laytime_allowance_hours=24.0,
    demurrage_rate_per_day_usd=24_000.0,
    despatch_rate_per_day_usd=12_000.0,
    nor_turn_time_hours=0.0,
    laytime_exception="SHEX",
    weather_clause="WWD",
    rule_authority="BIMCO_2013",
    clauses=[ClauseCitation(page=1, bbox=(0.0, 0.0, 0.0, 0.0), text="Clause 3.1 WWD")],
)

MODE_EVENTS: list[SOFEvent] = [
    SOFEvent(timestamp=_dt("2026-06-10T00:00:00"), event_type="NOR_ACCEPTED",        description="NOR accepted",           source=_src("00:00 NOR accepted")),
    SOFEvent(timestamp=_dt("2026-06-12T00:00:00"), event_type="WEATHER_DELAY_START", description="Weather delay start",    source=_src("00:00 Weather delay start")),
    SOFEvent(timestamp=_dt("2026-06-13T06:00:00"), event_type="WEATHER_DELAY_END",   description="Weather delay end",      source=_src("06:00 Weather delay end")),
    SOFEvent(timestamp=_dt("2026-06-13T12:00:00"), event_type="COMPLETED",           description="Loading completed",      source=_src("12:00 Completed")),
]


def _with_clause(weather_clause: str) -> CharterpartyTerms:
    return MODE_TERMS.model_copy(update={"weather_clause": weather_clause})


def test_weather_clause_literal_and_json_schema_enum_stay_in_sync() -> None:
    """The pydantic Literal, the LLM output schema, and the engine's own mapping
    table must accept the same set, or a charterparty in the gap is
    unrepresentable, or the engine raises on an extracted value."""
    literal = get_args(CharterpartyTerms.model_fields["weather_clause"].annotation)
    json_schema_enum = _CHARTERPARTY_SCHEMA["properties"]["weather_clause"]["enum"]

    assert set(literal) == set(WEATHER_CLAUSE_VALUES)
    assert set(json_schema_enum) == set(WEATHER_CLAUSE_VALUES)
    assert set(_WEATHER_CLAUSE_BASIS) == set(WEATHER_CLAUSE_VALUES)
    assert "WWDSHINC" in literal
    assert "WEATHER PERMITTING" in literal


def test_weather_permitting_validates_on_charterparty_terms() -> None:
    """Definition 18 is a term the 2013 definitions preserve expressly, and it is
    given the same meaning as definition 16, so a charterparty drafted on it has
    to be representable rather than forced onto another label."""
    terms = CharterpartyTerms.model_validate(
        {**MODE_TERMS.model_dump(), "weather_clause": "WEATHER PERMITTING"}
    )
    assert terms.weather_clause == "WEATHER PERMITTING"
    assert weather_basis("WEATHER PERMITTING") == "ACTUAL_PERIOD"


def test_wwdshinc_validates_on_charterparty_terms() -> None:
    terms = CharterpartyTerms.model_validate(
        {**MODE_TERMS.model_dump(), "weather_clause": "WWDSHINC"}
    )
    assert terms.weather_clause == "WWDSHINC"


def test_every_weather_clause_selects_a_basis() -> None:
    """No value may fall through to a KeyError: an unmapped label would take the
    whole run down, and the label the extractor picks by default is unknown."""
    for clause in WEATHER_CLAUSE_VALUES:
        assert weather_basis(clause) in {"NONE", "ACTUAL_PERIOD", "ARTIFICIAL_DAY"}


def test_weather_permitting_excludes_the_whole_interruption() -> None:
    result = LaytimeEngine().calculate(_with_clause("WEATHER PERMITTING"), MODE_EVENTS, "charterer")
    assert result.demurrage_due_usd == pytest.approx(30_000.0)


def test_bare_wwd_label_excludes_the_whole_interruption() -> None:
    """The bare label is ambiguous between definitions 15 and 16 and this engine
    applies the actual-period measure, so all 30h of the window comes off."""
    result = LaytimeEngine().calculate(_with_clause("WWD"), MODE_EVENTS, "charterer")
    assert result.demurrage_due_usd == pytest.approx(30_000.0)


def test_artificial_day_is_not_distinguished_from_the_actual_period_measure() -> None:
    """Named limitation, not a silent gap.

    Definition 17's counting unit is 24 *working* hours, and the artificial
    working day is not modelled, so a WWDSHEX or WWDSHINC charterparty is
    computed on the same actual-period measure. That over-credits the charterer
    on a stoppage spanning few working hours, and no test may claim otherwise.
    """
    for hours in (6.0, 30.0, 72.0):
        assert _struck_off_hours(hours, "ARTIFICIAL_DAY") == _struck_off_hours(
            hours, "ACTUAL_PERIOD"
        )
        assert _struck_off_hours(hours, "ARTIFICIAL_DAY") == pytest.approx(hours)
    for label in ("WWDSHEX", "WWDSHINC"):
        result = LaytimeEngine().calculate(_with_clause(label), MODE_EVENTS, "charterer")
        assert result.demurrage_due_usd == pytest.approx(30_000.0)
        assert weather_basis(label) == "ARTIFICIAL_DAY"


def test_limitation_is_recorded_in_the_module_docstring() -> None:
    """The limitation has to stay named in the module docstring, or the next
    reader will take the two bases for interchangeable in law as well as here."""
    doc = state_machine.__doc__ or ""
    assert "ACTUAL_PERIOD and ARTIFICIAL_DAY are not distinguished" in doc
    assert "known" in doc.lower() or "limitation" in doc.lower()


def test_bare_wwd_label_is_not_credited_with_a_definition_number() -> None:
    """Definition 15 *is* "WEATHER WORKING DAY", so the bare label sits closer to
    15 than to 16's "WWD OF 24 CONSECUTIVE HOURS". The engine may say which
    measure it applies; it may not say the label means a numbered definition."""
    doc = state_machine.__doc__ or ""
    assert "genuinely ambiguous between them" in doc
    table = doc[doc.index("The basis\neach label selects here:"):]
    table = table[: table.index("Definition 15's pro-rata basis")]
    row = next(
        line for line in table.splitlines() if line.strip().startswith('"WWD"')
    )
    assert "definition" not in row.lower(), row
    # The 2013 term is the exception: the source numbers that exact phrase, so
    # citing definition 18 for it is a citation and not a guess.
    permitting = next(
        line for line in table.splitlines() if line.strip().startswith('"WEATHER PERMITTING"')
    )
    assert "definition 18" in permitting


def test_pro_rata_basis_cannot_be_inferred_and_is_not_implemented() -> None:
    """Definition 15's ratio runs against a stated working day, and
    CharterpartyTerms carries none, so no label may select it."""
    assert set(_WEATHER_CLAUSE_BASIS.values()) == {"ACTUAL_PERIOD", "ARTIFICIAL_DAY", "NONE"}
    assert not any(basis == "PRO_RATA" for basis in _WEATHER_CLAUSE_BASIS.values())
    assert "not called by `calculate`" in (_pro_rata_struck_off_hours.__doc__ or "")


def test_definition_15_pro_rata_matches_the_explanatory_note() -> None:
    """The note takes the ratio against a period of 24 hours: a two hour stoppage
    in an eight hour working day is pro-rated to six hours, and to four hours in
    a twelve hour working day."""
    assert _pro_rata_struck_off_hours(2.0, 8.0) == pytest.approx(6.0)
    assert _pro_rata_struck_off_hours(2.0, 12.0) == pytest.approx(4.0)


def test_definition_15_pro_rata_is_not_capped_at_one_working_day() -> None:
    """The source states no such cap: the ratio runs against 24 hours, so a
    twelve hour stoppage in an eight hour working day pro-rates to 36 hours."""
    assert _pro_rata_struck_off_hours(12.0, 8.0) == pytest.approx(36.0)


def test_no_weather_clause_strikes_off_nothing() -> None:
    """`none` means the interruption is worked normally — the full 60h."""
    result = LaytimeEngine().calculate(_with_clause("none"), MODE_EVENTS, "charterer")
    assert result.demurrage_due_usd == pytest.approx(60_000.0)


def test_interruption_shorter_than_an_artificial_day_is_fully_struck_off() -> None:
    """No ceiling applies to the actual-period measure, so a 6h stoppage is
    struck off whole."""
    events = [
        SOFEvent(timestamp=_dt("2026-06-10T00:00:00"), event_type="NOR_ACCEPTED",        description="NOR accepted",        source=_src("00:00 NOR accepted")),
        SOFEvent(timestamp=_dt("2026-06-12T00:00:00"), event_type="WEATHER_DELAY_START", description="Weather delay start", source=_src("00:00 Weather delay start")),
        SOFEvent(timestamp=_dt("2026-06-12T06:00:00"), event_type="WEATHER_DELAY_END",   description="Weather delay end",   source=_src("06:00 Weather delay end")),
        SOFEvent(timestamp=_dt("2026-06-12T12:00:00"), event_type="COMPLETED",           description="Loading completed",   source=_src("12:00 Completed")),
    ]
    result = LaytimeEngine().calculate(_with_clause("WWDSHEX"), events, "charterer")
    assert result.demurrage_due_usd == pytest.approx(30_000.0)


def test_wwdshinc_uses_the_same_artificial_day_as_wwdshex() -> None:
    """SHINC is a day-counting convention carried by `laytime_exception`, not a
    change to the weather basis, so the two labels exclude the same hours."""
    shex = LaytimeEngine().calculate(_with_clause("WWDSHEX"), MODE_EVENTS, "charterer")
    shinc = LaytimeEngine().calculate(_with_clause("WWDSHINC"), MODE_EVENTS, "charterer")
    assert shinc.demurrage_due_usd == pytest.approx(30_000.0)
    assert shinc.demurrage_due_usd == pytest.approx(shex.demurrage_due_usd)


# ---------------------------------------------------------------------------
# Canonical fixture regression
# ---------------------------------------------------------------------------

FIXTURE_DIR = Path(__file__).resolve().parents[3] / "fixtures" / "voyage_001"


def test_canonical_fixture_weather_clause_selects_the_actual_period_basis() -> None:
    """The real invariant behind the bare `WWD` label: whatever the label means
    in the 2013 definitions, the engine applies the actual-period measure, and it
    does so because of the mapping table rather than a definition number."""
    terms = CharterpartyTerms.model_validate_json(
        (FIXTURE_DIR / "extracted_charterparty.json").read_text()
    )
    assert terms.weather_clause == "WWD"
    assert weather_basis(terms.weather_clause) == "ACTUAL_PERIOD"
    assert _WEATHER_CLAUSE_BASIS["WWD"] == weather_basis(terms.weather_clause)


def test_canonical_owner_demurrage_is_unchanged() -> None:
    terms = CharterpartyTerms.model_validate_json(
        (FIXTURE_DIR / "extracted_charterparty.json").read_text()
    )
    events = [SOFEvent.model_validate(e) for e in json.loads((FIXTURE_DIR / "extracted_sof_owner.json").read_text())]
    result = LaytimeEngine().calculate(terms, events, "owner")
    assert result.laytime_used_hours == pytest.approx(72.0)
    assert result.demurrage_due_usd == pytest.approx(187_013.89)


def test_canonical_charterer_demurrage_is_unchanged() -> None:
    terms = CharterpartyTerms.model_validate_json(
        (FIXTURE_DIR / "extracted_charterparty.json").read_text()
    )
    events = [SOFEvent.model_validate(e) for e in json.loads((FIXTURE_DIR / "extracted_sof_charterer.json").read_text())]
    result = LaytimeEngine().calculate(terms, events, "charterer")
    assert result.laytime_used_hours == pytest.approx(72.0)
    assert result.demurrage_due_usd == pytest.approx(62_013.89)
