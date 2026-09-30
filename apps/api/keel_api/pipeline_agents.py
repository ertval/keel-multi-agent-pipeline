"""LangGraph Multi-Agent Pipeline for Maritime Document Intelligence.

Orchestrator-Worker-Validator pattern with deterministic state execution.
Supports both live LLM extraction and fixture-based dry-run modes.
"""

from __future__ import annotations

import json
import logging
import re
from collections.abc import Callable
from datetime import date, datetime
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, TypedDict

from langgraph.graph import END, StateGraph
from langgraph.graph.state import CompiledStateGraph

# Import existing core modules
from keel_api.engine import LaytimeEngine
from keel_api.engine.state_machine import threshold_clause, weather_exception_clauses
from keel_api.extraction import (
    extract_charterparty_terms,
    extract_claim_amount,
    extract_sof_events,
)
from keel_api.parsing import parse
from keel_api.pipeline import _round_usd, _utc, _weather_windows
from keel_api.rules import evaluate_wwd_exception
from keel_api.rules.evaluators import BEAUFORT_THRESHOLD, PRECIPITATION_THRESHOLD_MM
from keel_api.schemas import (
    CharterpartyTerms,
    DisputedLineItem,
    Reconciliation,
    SOFEvent,
    SourceCitation,
    Verdict,
    WeatherSummary,
)
from keel_api.weather import FixtureWeatherProvider

log = logging.getLogger(__name__)


# ─── LangGraph State Definition ──────────────────────────────────────────────

class ValidationIssue(TypedDict):
    """One validator finding, tagged with the document and field that can fix it."""
    message: str
    document: str
    field: str


class PipelineState(TypedDict):
    fixture_dir: str
    voyage_id: str

    # Raw parsed texts
    cp_text: str
    sof_owner_text: str
    sof_charterer_text: str

    # Extracted structures
    extracted_terms: Dict[str, Any]
    extracted_owner_events: List[Dict[str, Any]]
    extracted_charterer_events: List[Dict[str, Any]]
    owner_claim_usd: float
    charterer_claim_usd: float

    # Audit & feedback loop state
    validation_errors: List[ValidationIssue]
    retry_count: int

    # Downstream execution results
    owner_calculation: Dict[str, Any]
    charterer_calculation: Dict[str, Any]
    reconciliation: Dict[str, Any]


# ─── Extraction cache ─────────────────────────────────────────────────────────

# The whole extraction set is used from cache or none of it is: a partial set
# would mix cached and freshly-extracted facts inside a single reconciliation.
_EXTRACT_CACHE_FILES = (
    "extracted_charterparty.json",
    "extracted_sof_owner.json",
    "extracted_sof_charterer.json",
    "extracted_owner_claim_amount.json",
    "extracted_charterer_claim_amount.json",
)


def _all_extracts_cached(fixture_path: Path) -> bool:
    """True only when every extracted artefact is present on disk."""
    return all((fixture_path / name).exists() for name in _EXTRACT_CACHE_FILES)


def _errors_for(issues: List[Any], document: str) -> List[str]:
    """Return the messages of the issues `document`'s extractor can act on.

    Issues are plain strings when they carry no routing information, and are
    forwarded to every extractor so readers written against the earlier
    string-only state keep working.
    """
    messages: List[str] = []
    for issue in issues:
        if isinstance(issue, str):
            messages.append(issue)
        elif issue.get("document") == document:
            messages.append(issue["message"])
    return messages


# ─── Graph Nodes ─────────────────────────────────────────────────────────────

def orchestrator_node(state: PipelineState) -> Dict[str, Any]:
    """Node: Orchestrate parsing tasks and prepare state."""
    log.info("[Orchestrator] Starting document intelligence pipeline...")
    fixture_path = Path(state["fixture_dir"])

    # Parse inputs (lazy text extraction)
    cp_text = ""
    sof_owner_text = ""
    sof_charterer_text = ""

    if (fixture_path / "charterparty.pdf").exists():
        cp_text = parse(fixture_path / "charterparty.pdf").pages[0][:1000]  # preview
    if (fixture_path / "sof_owner.pdf").exists():
        sof_owner_text = parse(fixture_path / "sof_owner.pdf").pages[0][:1000]
    if (fixture_path / "sof_charterer.pdf").exists():
        sof_charterer_text = parse(fixture_path / "sof_charterer.pdf").pages[0][:1000]

    return {
        "cp_text": cp_text,
        "sof_owner_text": sof_owner_text,
        "sof_charterer_text": sof_charterer_text,
        "validation_errors": [],
        "retry_count": 0,
    }


def cp_worker_node(state: PipelineState) -> Dict[str, Any]:
    """Node: Specialized Worker for Charterparty contract extraction.

    A retry re-parses the charterparty only when the document is present; if it
    is absent the node writes nothing, leaving the previously extracted terms
    and the validation errors in state so the graph still calculates.
    """
    log.info("[Worker: Charterparty] Extracting contract terms...")
    fixture_path = Path(state["fixture_dir"])
    issues = state.get("validation_errors") or []

    if not issues and _all_extracts_cached(fixture_path):
        cp_cache = fixture_path / "extracted_charterparty.json"
        return {"extracted_terms": json.loads(cp_cache.read_text())}

    cp_pdf = fixture_path / "charterparty.pdf"
    if not cp_pdf.exists():
        log.error("[Worker: Charterparty] %s is absent; keeping extracted terms.", cp_pdf)
        return {}

    errors = _errors_for(issues, "charterparty")
    cp_doc = parse(cp_pdf)
    if errors:
        terms = extract_charterparty_terms(cp_doc, validation_errors=errors)
    else:
        terms = extract_charterparty_terms(cp_doc)
    return {"extracted_terms": terms.model_dump(mode="json")}


def sof_worker_node(state: PipelineState) -> Dict[str, Any]:
    """Node: Specialized Worker for Statement of Facts (SOF) event log extraction.

    A retry re-extracts the chronologies the validator complained about but
    never the claim amounts: no validation error concerns a claim amount, and
    re-reading one would move the dollars.
    """
    log.info("[Worker: SOF] Extracting chronologies...")
    fixture_path = Path(state["fixture_dir"])
    issues = state.get("validation_errors") or []

    if not issues and _all_extracts_cached(fixture_path):
        return {
            "extracted_owner_events": json.loads(
                (fixture_path / "extracted_sof_owner.json").read_text()
            ),
            "extracted_charterer_events": json.loads(
                (fixture_path / "extracted_sof_charterer.json").read_text()
            ),
            "owner_claim_usd": float(
                (fixture_path / "extracted_owner_claim_amount.json").read_text()
            ),
            "charterer_claim_usd": float(
                (fixture_path / "extracted_charterer_claim_amount.json").read_text()
            ),
        }

    sof_owner_pdf = fixture_path / "sof_owner.pdf"
    sof_charterer_pdf = fixture_path / "sof_charterer.pdf"
    if not sof_owner_pdf.exists() or not sof_charterer_pdf.exists():
        log.error("[Worker: SOF] Statement of Facts absent; keeping extracted chronologies.")
        return {}

    owner_errors = _errors_for(issues, "sof_owner")
    charterer_errors = _errors_for(issues, "sof_charterer")
    owner_events = [
        e.model_dump(mode="json")
        for e in extract_sof_events(
            parse(sof_owner_pdf), validation_errors=owner_errors or None
        )
    ]
    charterer_events = [
        e.model_dump(mode="json")
        for e in extract_sof_events(
            parse(sof_charterer_pdf), validation_errors=charterer_errors or None
        )
    ]

    result: Dict[str, Any] = {
        "extracted_owner_events": owner_events,
        "extracted_charterer_events": charterer_events,
    }

    if not issues:
        claim_owner_doc = (
            parse(fixture_path / "claim_owner.pdf")
            if (fixture_path / "claim_owner.pdf").exists()
            else None
        )
        claim_charterer_doc = (
            parse(fixture_path / "claim_charterer.pdf")
            if (fixture_path / "claim_charterer.pdf").exists()
            else None
        )
        result["owner_claim_usd"] = (
            extract_claim_amount(claim_owner_doc) if claim_owner_doc else 0.0
        )
        result["charterer_claim_usd"] = (
            extract_claim_amount(claim_charterer_doc) if claim_charterer_doc else 0.0
        )

    return result


def validator_node(state: PipelineState) -> Dict[str, Any]:
    """Node: Independent Validator executing schema and cross-document validation.

    Every finding is tagged with the document and field whose extractor can act
    on it, so the workers forward feedback only to the right prompt. A missing
    coordinate is reported as missing and is not conflated with a valid 0.0.
    """
    log.info("[Validator] Running cross-document consistency checks...")
    issues: List[ValidationIssue] = []

    terms = state["extracted_terms"]

    if not terms.get("vessel"):
        issues.append(ValidationIssue(
            message="Validation Error: Vessel name is missing in Charterparty extraction.",
            document="charterparty",
            field="vessel",
        ))

    # Verify lat/lon ranges
    lat = terms.get("load_port_lat")
    lon = terms.get("load_port_lon")
    if lat is None or lon is None:
        issues.append(ValidationIssue(
            message="Validation Error: Load port coordinates (lat, lon) are missing.",
            document="charterparty",
            field="load_port_lat",
        ))
    elif not (-90.0 <= lat <= 90.0) or not (-180.0 <= lon <= 180.0):
        issues.append(ValidationIssue(
            message=f"Validation Error: Geographical coordinates ({lat}, {lon}) are out of bounds.",
            document="charterparty",
            field="load_port_lat",
        ))

    result: Dict[str, Any] = {"validation_errors": issues}
    if issues:
        result["retry_count"] = state["retry_count"] + 1
    return result


def retry_fanout_node(state: PipelineState) -> Dict[str, Any]:
    """Tiny join-break node: fan retry back out to both workers."""
    return {}


def laytime_engine_node(state: PipelineState) -> Dict[str, Any]:
    """Node: Run deterministic laytime state machine logic."""
    log.info("[Laytime Engine] Running deterministic calculations...")

    # Reconstruct Pydantic models for the execution engine
    terms = CharterpartyTerms.model_validate(state["extracted_terms"])
    owner_events = [SOFEvent.model_validate(e) for e in state["extracted_owner_events"]]
    charterer_events = [SOFEvent.model_validate(e) for e in state["extracted_charterer_events"]]

    engine = LaytimeEngine()
    owner_result = engine.calculate(terms, owner_events, "owner")
    charterer_result = engine.calculate(terms, charterer_events, "charterer")

    return {
        "owner_calculation": owner_result.model_dump(mode="json"),
        "charterer_calculation": charterer_result.model_dump(mode="json"),
    }


# A day verdict turns on two things the charterparty has to say: that time
# lost to weather is excepted from laytime, and the threshold for invoking that
# exception. Clauses that only cross-reference the exception (the on-demurrage
# clause) state neither, so they are not cited. The match itself lives with the
# engine, which cites the same clause on the audit-trace rows that suspend time.
_weather_clause_citations = weather_exception_clauses


# A ruleset a charterparty incorporates by express words in its own text. Only
# an express incorporation is evidence of one; anything else leaves the
# reconciliation's authority at "custom" rather than repeating the extractor's
# guess at what the document "must have meant".
_RULESET_INCORPORATION = re.compile(
    r"(?:in accordance with|subject to|by virtue of|incorporated (?:by reference )?)"
    r"[^.]{0,120}?"
    r"(?:laytime definitions for charter parties|bimco|"
    r"voyage charter rules|gencon|congencon)",
    re.IGNORECASE,
)


def _cited_rule_authority(terms: CharterpartyTerms) -> str:
    """The ruleset this charterparty expressly incorporates, or "custom".

    What the weather exception is measured against and the share of hours that
    must meet the charterparty's own threshold are not settled by any ruleset,
    so this never names one as the authority for the rules applied: it reports
    only which ruleset the document itself says governs its reading.
    """
    if any(_RULESET_INCORPORATION.search(c.text) for c in terms.clauses):
        return terms.rule_authority
    return "custom"


def _threshold_extracted(terms: CharterpartyTerms) -> bool:
    """True when the threshold figures were read off the charterparty text."""
    return (
        terms.weather_beaufort_threshold is not None
        or terms.weather_precipitation_threshold_mm is not None
    )


def _threshold_source(terms: CharterpartyTerms) -> str | None:
    """Where the weather-working threshold figures were read, in the letter's terms.

    None when no extracted clause states a threshold, which is the signal the
    evaluator uses to report its figures as Keel's unverified default instead of
    as this charterparty's own term.
    """
    clause = threshold_clause(terms)
    if clause is None:
        return None
    match = re.match(r"^\s*(clause\s+\d+(?:\.\d+)*)", clause.text, re.IGNORECASE)
    label = f"Clause {match.group(1).split()[-1]}" if match else "the weather-exception clause"
    return f"{label} (page {clause.page})"


def _window_sof_citations(
    events: List[SOFEvent], start: datetime, end: datetime
) -> List[SourceCitation]:
    """The SOF rows that bound a weather window, in the order the events appear."""
    bounds = (("WEATHER_DELAY_START", start), ("WEATHER_DELAY_END", end))
    return [e.source for e in events if (e.event_type, e.timestamp) in bounds]


def _threshold_figures_sentence(
    threshold_figures: str, threshold_source: str | None
) -> str:
    """The threshold a party would put its case on, and where the figure came from.

    With a source the figures are the charterparty's own term; without one they
    are Keel's configured default and are named as unverified against this
    document, so no reader takes them for the counterparty's contract.
    """
    if threshold_source:
        return (
            f"The threshold applied is {threshold_figures}, stated in {threshold_source} "
            f"— this charterparty's own term."
        )
    return (
        f"The threshold applied is {threshold_figures} — Keel's configured default, "
        f"which has not been verified against the charterparty text."
    )


def _owner_position(
    *,
    disputed_hours: float,
    peak_reading: str,
    threshold_figures: str,
    threshold_source: str | None,
    threshold_met: bool,
) -> str:
    """The Owner's case on a disputed day, whatever the assessment concludes.

    The Owner is paid for the claimed hours, so its case is always that they are
    not excepted, and the reason it advances depends on the weather rather than
    on the outcome. It never states the Charterer's conclusion, and the assessment
    column is where the two cases are weighed.
    """
    if threshold_met:
        reason = (
            "a majority of the observed hours reaching the threshold is not a finding "
            "that every claimed hour was a period during which weather interrupted "
            "work, and a laytime exception does not of itself suspend the accrual of "
            "demurrage"
        )
    else:
        reason = (
            "the records do not reach the threshold over the claimed period, so the "
            "exception does not take these hours off the vessel's demurrage"
        )
    return (
        f"The Owner claims the whole {disputed_hours:.0f} hours as demurrage. The "
        f"Owner's case is that {reason}. "
        f"{_threshold_figures_sentence(threshold_figures, threshold_source)} "
        f"The port records for the claimed period show {peak_reading} over "
        f"{disputed_hours:.0f} hours."
    )


def _charterer_position(
    *,
    disputed_hours: float,
    peak_reading: str,
    threshold_figures: str,
    threshold_source: str | None,
    threshold_met: bool,
) -> str:
    """The Charterer's case on a disputed day, whatever the assessment concludes.

    The mirror of `_owner_position`: the Charterer claims the exception, so its
    case is always that the logged delay is time lost on account of weather. It
    never states the Owner's conclusion and never concedes it.
    """
    threshold_sentence = (
        f" {_threshold_figures_sentence(threshold_figures, threshold_source)}"
        if threshold_met and threshold_source
        else ""
    )
    return (
        f"The Charterer claims the {disputed_hours:.0f} hours it logged as a weather "
        f"delay as time lost on account of weather under the charterparty's weather "
        f"clause. The window is the delay the Charterer's own Statement of Facts "
        f"records, and the port records for those hours corroborate it: {peak_reading} "
        f"over the claimed period. The Charterer says those hours are therefore "
        f"excepted from laytime.{threshold_sentence}"
    )


def adjudicator_node(state: PipelineState) -> Dict[str, Any]:
    """Node: Cross-reference weather exceptions and generate dispute verdicts."""
    log.info("[Adjudicator] Resolving dispute items...")
    fixture_path = Path(state["fixture_dir"])

    terms = CharterpartyTerms.model_validate(state["extracted_terms"])
    charterer_events = [SOFEvent.model_validate(e) for e in state["extracted_charterer_events"]]

    weather_provider = FixtureWeatherProvider(fixture_path)
    rate_per_hour = terms.demurrage_rate_per_day_usd / 24.0
    clause_citations = _weather_clause_citations(terms)
    # The threshold is the charterparty's own term. Threaded through only when the
    # extracted terms carry the figures; the evaluator falls back to Keel's
    # configured defaults and says in the justification that they are unverified
    # defaults when the charterparty states none. A clause that states a threshold
    # is not on its own enough to attribute a figure to it: with no figure read
    # out of the text, the number applied is Keel's and is reported as such.
    threshold_source = _threshold_source(terms) if _threshold_extracted(terms) else None
    beaufort = (
        terms.weather_beaufort_threshold
        if terms.weather_beaufort_threshold is not None
        else BEAUFORT_THRESHOLD
    )
    precipitation = (
        terms.weather_precipitation_threshold_mm
        if terms.weather_precipitation_threshold_mm is not None
        else PRECIPITATION_THRESHOLD_MM
    )
    disputed_items: list[DisputedLineItem] = []

    for win_start, win_end in _weather_windows(charterer_events):
        start_utc = _utc(win_start)
        end_utc = _utc(win_end)
        disputed_hours = (end_utc - start_utc).total_seconds() / 3600.0
        owner_amount = disputed_hours * rate_per_hour

        observations = weather_provider.get(
            terms.load_port_lat,
            terms.load_port_lon,
            start_utc,
            end_utc,
        )
        wwd = evaluate_wwd_exception(
            observations,
            start_utc,
            end_utc,
            beaufort_threshold=terms.weather_beaufort_threshold,
            precipitation_threshold_mm=terms.weather_precipitation_threshold_mm,
            threshold_source=threshold_source,
        )

        winner = "charterer" if wwd.valid else "owner"
        credited = 0.0 if wwd.valid else owner_amount

        if observations:
            max_force: int | None = max(o.wind_force_beaufort for o in observations)
            peak_precip: float | None = max(o.precipitation_mm_per_hour for o in observations)
            peak_reading = (
                f"peak Beaufort Force {max_force} with {peak_precip:.1f} mm/h precipitation"
            )
        else:
            max_force, peak_precip = None, None
            peak_reading = "no weather observations available for the claimed window"

        owner_position = _owner_position(
            disputed_hours=disputed_hours,
            peak_reading=peak_reading,
            threshold_figures=f"Beaufort Force {beaufort} (or {precipitation:g} mm/h precipitation)",
            threshold_source=threshold_source,
            threshold_met=wwd.valid or wwd.hours_at_threshold * 2 > wwd.total_hours,
        )
        charterer_position = _charterer_position(
            disputed_hours=disputed_hours,
            peak_reading=peak_reading,
            threshold_figures=f"Beaufort Force {beaufort} (or {precipitation:g} mm/h precipitation)",
            threshold_source=threshold_source,
            threshold_met=wwd.valid or wwd.hours_at_threshold * 2 > wwd.total_hours,
        )

        verdict = Verdict(
            winner=winner,
            justification=wwd.justification,
            rule_id=wwd.rule_id,
            measurement_basis=wwd.measurement_basis,
            rule_authority=wwd.rule_authority,
            hours_credited_to_owner=0.0 if wwd.valid else disputed_hours,
            dollars_credited_to_owner_usd=round(credited, 2),
        )

        weather_summary = (
            WeatherSummary(
                peak_wind_force_beaufort=max_force,
                peak_precipitation_mm_per_hour=round(peak_precip, 2),
                adverse_hours=wwd.hours_at_threshold,
                total_observed_hours=wwd.total_hours,
            )
            if max_force is not None and peak_precip is not None
            else None
        )

        # Portable day-without-leading-zero (%-d breaks on Windows)
        day_label = f"{start_utc.day} {start_utc.strftime('%B %Y')}"

        disputed_items.append(DisputedLineItem(
            description=f"Weather exception, {day_label}",
            disputed_date=date(start_utc.year, start_utc.month, start_utc.day),
            owner_position=owner_position,
            charterer_position=charterer_position,
            owner_amount_usd=round(owner_amount, 2),
            charterer_amount_usd=round(owner_amount, 2) if wwd.valid else 0.0,
            verdict=verdict,
            clause_citations=clause_citations,
            sof_citations=_window_sof_citations(charterer_events, win_start, win_end),
            weather_citations=wwd.citations[:2],
            weather_summary=weather_summary,
        ))

    owner_claim = state["owner_claim_usd"]
    charterer_claim = state["charterer_claim_usd"]
    owner_total = (
        _round_usd(owner_claim)
        if owner_claim > 0
        else _round_usd(state["owner_calculation"]["demurrage_due_usd"])
    )
    charterer_total = (
        _round_usd(charterer_claim)
        if charterer_claim > 0
        else _round_usd(state["charterer_calculation"]["demurrage_due_usd"])
    )
    credited_total = sum(item.verdict.dollars_credited_to_owner_usd for item in disputed_items)
    reconciled_total = _round_usd(charterer_total + credited_total)

    reconciliation = Reconciliation(
        voyage_id=state["voyage_id"],
        owner_total_usd=owner_total,
        charterer_total_usd=charterer_total,
        disputed_items=disputed_items,
        reconciled_total_usd=reconciled_total,
        rule_authority=_cited_rule_authority(terms),
    )

    return {"reconciliation": reconciliation.model_dump(mode="json")}


# ─── Routing / Decisions ─────────────────────────────────────────────────────

def check_validation_routing(state: PipelineState) -> str:
    """Decide whether to route back for retry or proceed to calculation.

    Only truthiness is inspected, so plain-string issues written by older
    callers route the same way as structured issues.
    """
    errors = state["validation_errors"]
    if errors and state["retry_count"] < 3:
        log.warning(
            "[Validator] Validation failed. Retrying extraction loop (%d/3)...",
            state["retry_count"],
        )
        return "retry"
    if errors:
        log.error("[Validator] Max retries reached. Forcing execution fallback.")
        return "calculate"
    return "calculate"


# ─── Graph Compilation ────────────────────────────────────────────────────────

# One status line per node, surfaced by the /voyages/{id}/status endpoint.
_NODE_PROGRESS: Dict[str, str] = {
    "orchestrator": "Parsing documents…",
    "cp_worker": "Extracting charterparty terms (LLM)…",
    "sof_worker": "Extracting SOF chronologies and claim amounts (LLM)…",
    "validator": "Validating cross-document consistency…",
    "retry_fanout": "Retrying extraction after validation errors…",
    "laytime_engine": "Calculating laytime for both parties…",
    "adjudicator": "Adjudicating disputed weather exceptions…",
}


@lru_cache(maxsize=1)
def create_agent_pipeline() -> CompiledStateGraph:
    """Build and compile the multi-agent state graph (compiled once, reused).

    The compiled graph captures the node functions as they are at compile time,
    so replacing a module-level node has no effect until `reset_agent_pipeline`
    clears this cache. A checkpointer-less compiled graph keeps no per-run
    state, which is what makes sharing the single instance across requests safe.
    """
    workflow = StateGraph(PipelineState)

    # Add nodes
    workflow.add_node("orchestrator", orchestrator_node)
    workflow.add_node("cp_worker", cp_worker_node)
    workflow.add_node("sof_worker", sof_worker_node)
    workflow.add_node("validator", validator_node)
    workflow.add_node("retry_fanout", retry_fanout_node)
    workflow.add_node("laytime_engine", laytime_engine_node)
    workflow.add_node("adjudicator", adjudicator_node)

    # Set entry point
    workflow.set_entry_point("orchestrator")

    # Orchestrator triggers workers in parallel
    workflow.add_edge("orchestrator", "cp_worker")
    workflow.add_edge("orchestrator", "sof_worker")

    # Join: wait for both workers before validating
    workflow.add_edge(["cp_worker", "sof_worker"], "validator")

    # Validator checks logic and determines path
    workflow.add_conditional_edges(
        "validator",
        check_validation_routing,
        {
            "retry": "retry_fanout",
            "calculate": "laytime_engine",
        },
    )

    # Retry re-enters BOTH workers
    workflow.add_edge("retry_fanout", "cp_worker")
    workflow.add_edge("retry_fanout", "sof_worker")

    # Calculations flow to final dispute adjudication
    workflow.add_edge("laytime_engine", "adjudicator")
    workflow.add_edge("adjudicator", END)

    return workflow.compile()


# ─── Runner helper ────────────────────────────────────────────────────────────

def reset_agent_pipeline() -> None:
    """Discard the compiled graph so the next call rebuilds it.

    Required after replacing a node function at module level, because the
    compiled graph holds the function objects captured when it was built.
    """
    create_agent_pipeline.cache_clear()


def run_agent_pipeline(
    fixture_dir: Path,
    voyage_id: str,
    on_progress: "Callable[[str], None] | None" = None,
) -> Dict[str, Any]:
    """Run the compiled agent graph pipeline synchronously.

    `on_progress`, when given, is called once per executed node in execution
    order. The returned state is JSON-serialisable.
    """
    app = create_agent_pipeline()
    initial_state: PipelineState = {
        "fixture_dir": str(fixture_dir),
        "voyage_id": voyage_id,
        "cp_text": "",
        "sof_owner_text": "",
        "sof_charterer_text": "",
        "extracted_terms": {},
        "extracted_owner_events": [],
        "extracted_charterer_events": [],
        "owner_claim_usd": 0.0,
        "charterer_claim_usd": 0.0,
        "validation_errors": [],
        "retry_count": 0,
        "owner_calculation": {},
        "charterer_calculation": {},
        "reconciliation": {},
    }

    if on_progress is None:
        return app.invoke(initial_state)

    final_state: Dict[str, Any] = initial_state
    for mode, chunk in app.stream(initial_state, stream_mode=["updates", "values"]):
        if mode == "updates":
            for node in chunk:
                on_progress(_NODE_PROGRESS.get(node, f"{node} completed"))
        else:
            final_state = chunk
    return final_state
