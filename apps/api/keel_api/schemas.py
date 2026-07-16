"""Frozen Pydantic data contracts between Keel's layers.

Sourced verbatim from PRD §9. The shapes are locked at J-01 and must
not change without explicit cross-stream coordination — the frontend's
TypeScript types and the canonical assertion test both depend on them.
"""

from __future__ import annotations

from datetime import date, datetime
from typing import Literal, Protocol

from pydantic import BaseModel


RuleAuthority = Literal["BIMCO_2013", "VOYLAYRULES_93", "custom"]


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
    weather_clause: Literal["WWD", "WWDSHEX", "none"]
    rule_authority: RuleAuthority
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
    rule_id: str
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
    rule_authority: RuleAuthority
