"""Frozen Pydantic data contracts between Keel's layers.

Originated from PRD §9 and since grown: the weather clause values, the
charterparty weather thresholds, the verdict measurement basis and the audit
entry clause citation were all added during the build. The shapes are locked at
J-01 and must not change without explicit cross-stream coordination — the
frontend's TypeScript types and the canonical assertion test both depend on them.
"""

from __future__ import annotations

from datetime import date, datetime
from typing import Literal, Protocol

from pydantic import BaseModel


# A ruleset a charterparty expressly incorporates by name, read off the face of
# the document. "custom" means the charterparty incorporates none, so nothing
# here is the authority for the rules this product applies: a weather verdict's
# authority is always "custom" (see rules.evaluators), because the threshold and
# the majority-of-hours test are the charterparty's own term and this product's
# own policy respectively.
RuleAuthority = Literal["BIMCO_2013", "VOYLAYRULES_93", "custom"]

# Mirrors the Literal members of CharterpartyTerms.weather_clause. The LLM
# output schema imports this so the two enumerations cannot drift.
#
# "WEATHER PERMITTING" is the 2013 definitions' own term (definition 18), which
# the source gives the same meaning as definition 16. Without it here a
# charterparty drafted on that expressly preserved term could not be represented
# at all, and the extractor would have to silently pick one of the others — most
# likely "none", losing the weather exception entirely.
WEATHER_CLAUSE_VALUES = ("WWD", "WWDSHEX", "WWDSHINC", "WEATHER PERMITTING", "none")


# ---------------------------------------------------------------------------
# 9.1 Extraction output (LLM → engine)
# ---------------------------------------------------------------------------


class ClauseCitation(BaseModel):
    page: int
    bbox: tuple[float, float, float, float]
    text: str


class SourceCitation(BaseModel):
    page: int
    bbox: tuple[float, float, float, float]
    row_text: str


class CharterpartyTerms(BaseModel):
    vessel: str
    charterer: str
    owner: str
    load_port: str
    load_port_lat: float
    load_port_lon: float
    laytime_allowance_hours: float
    demurrage_rate_per_day_usd: float
    despatch_rate_per_day_usd: float
    nor_turn_time_hours: float
    laytime_exception: Literal["SHEX", "FHEX", "SHINC"]
    weather_clause: Literal["WWD", "WWDSHEX", "WWDSHINC", "WEATHER PERMITTING", "none"]
    rule_authority: RuleAuthority
    # The weather-working threshold is a term of this charterparty, not of any
    # ruleset, so it is read off the charterparty text like any other term.
    # None means the document states no figure: the evaluator then falls back to
    # its own configured default and says in the resulting justification that the
    # figure is Keel's default and has not been verified against this document.
    weather_beaufort_threshold: int | None = None
    weather_precipitation_threshold_mm: float | None = None
    clauses: list[ClauseCitation]


class SOFEvent(BaseModel):
    timestamp: datetime
    event_type: Literal[
        "NOR_TENDERED",
        "NOR_ACCEPTED",
        "LOADING_START",
        "LOADING_END",
        "WEATHER_DELAY_START",
        "WEATHER_DELAY_END",
        "SHIFTING",
        "COMPLETED",
    ]
    description: str
    source: SourceCitation


# ---------------------------------------------------------------------------
# 9.2 Weather records (provider → adjudicator)
# ---------------------------------------------------------------------------


class WeatherCitation(BaseModel):
    source: str
    observation_id: str


class WeatherObservation(BaseModel):
    timestamp: datetime
    wind_force_beaufort: int
    wind_speed_knots: float
    precipitation_mm_per_hour: float
    operations_prevented: bool
    citation: WeatherCitation


class WeatherProvider(Protocol):
    def get(
        self,
        port_lat: float,
        port_lon: float,
        start: datetime,
        end: datetime,
    ) -> list[WeatherObservation]: ...


# ---------------------------------------------------------------------------
# 9.3 Audit trace (engine → UI)
# ---------------------------------------------------------------------------


class AuditEntry(BaseModel):
    seq: int
    timestamp: datetime
    state: Literal["BEFORE_NOR", "ON_LAYTIME", "WEATHER_PAUSE", "ON_DEMURRAGE"]
    rule_applied: str
    clause_citation: ClauseCitation | None
    sof_citation: SourceCitation | None
    laytime_consumed_hours: float
    running_total_usd: float


class CalculationResult(BaseModel):
    voyage_id: str
    party: Literal["owner", "charterer"]
    laytime_used_hours: float
    demurrage_due_usd: float
    trace: list[AuditEntry]


# ---------------------------------------------------------------------------
# 9.4 Reconciliation (with per-day adjudication)
# ---------------------------------------------------------------------------


class Verdict(BaseModel):
    winner: Literal["owner", "charterer", "split"]
    justification: str
    # Names the test this product applied to the window, and nothing else: it is
    # not a citation into any source document and carries no definition number.
    rule_id: str
    # The source that fixes how an excepted period is *measured*, named on its
    # own so it is never read as the authority for the test or the threshold.
    measurement_basis: str
    # Always "custom" on a weather verdict: the share test is this product's own
    # policy and the threshold is the charterparty's own term.
    rule_authority: RuleAuthority
    hours_credited_to_owner: float
    dollars_credited_to_owner_usd: float


class WeatherSummary(BaseModel):
    peak_wind_force_beaufort: int
    peak_precipitation_mm_per_hour: float
    adverse_hours: float
    total_observed_hours: float


class DisputedLineItem(BaseModel):
    description: str
    disputed_date: date
    owner_position: str
    charterer_position: str
    owner_amount_usd: float
    charterer_amount_usd: float
    verdict: Verdict
    clause_citations: list[ClauseCitation]
    sof_citations: list[SourceCitation]
    weather_citations: list[WeatherCitation]
    weather_summary: WeatherSummary | None = None


class Reconciliation(BaseModel):
    voyage_id: str
    owner_total_usd: float
    charterer_total_usd: float
    disputed_items: list[DisputedLineItem]
    reconciled_total_usd: float
    # The ruleset this charterparty expressly incorporates by name, and which
    # therefore governs how its clauses are read — not the authority for the
    # rules this product applied. Derived from a clause that incorporates a
    # ruleset, and "custom" when the charterparty incorporates none, so the
    # LLM's own guess is never presented as the product's authority. Per-day
    # `Verdict.rule_authority` is the separate, narrower claim.
    rule_authority: RuleAuthority
