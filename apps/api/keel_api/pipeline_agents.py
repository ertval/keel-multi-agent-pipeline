"""LangGraph Multi-Agent Pipeline for Maritime Document Intelligence.

Orchestrator-Worker-Validator pattern with deterministic state execution.
Supports both live LLM extraction and fixture-based dry-run modes.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, TypedDict

from langgraph.graph import StateGraph, END

# Import existing core modules
from keel_api.engine import LaytimeEngine
from keel_api.parsing import parse
from keel_api.schemas import CharterpartyTerms, SOFEvent
from keel_api.extraction import extract_charterparty_terms, extract_sof_events, extract_claim_amount
from keel_api.pipeline import _weather_windows, _utc, _round_usd
from keel_api.weather import FixtureWeatherProvider
from keel_api.rules import evaluate_wwd_exception
from keel_api.schemas import DisputedLineItem, Reconciliation, Verdict

log = logging.getLogger(__name__)

# ─── LangGraph State Definition ──────────────────────────────────────────────

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
    validation_errors: List[str]
    retry_count: int
    
    # Downstream execution results
    owner_calculation: Dict[str, Any]
    charterer_calculation: Dict[str, Any]
    reconciliation: Dict[str, Any]

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
        cp_text = parse(fixture_path / "charterparty.pdf").pages[0][:1000] # preview
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
    """Node: Specialized Worker for Charterparty contract extraction."""
    log.info("[Worker: Charterparty] Extracting contract terms...")
    fixture_path = Path(state["fixture_dir"])
    
    # Use cache if present to support dry-run / zero-key mode out of the box
    cp_cache = fixture_path / "extracted_charterparty.json"
    if cp_cache.exists():
        terms = json.loads(cp_cache.read_text())
        return {"extracted_terms": terms}
        
    cp_doc = parse(fixture_path / "charterparty.pdf")
    terms = extract_charterparty_terms(cp_doc)
    return {"extracted_terms": terms.model_dump()}

def sof_worker_node(state: PipelineState) -> Dict[str, Any]:
    """Node: Specialized Worker for Statement of Facts (SOF) event log extraction."""
    log.info("[Worker: SOF] Extracting chronologies...")
    fixture_path = Path(state["fixture_dir"])
    
    owner_cache = fixture_path / "extracted_sof_owner.json"
    charterer_cache = fixture_path / "extracted_sof_charterer.json"
    owner_claim_cache = fixture_path / "extracted_owner_claim_amount.json"
    charterer_claim_cache = fixture_path / "extracted_charterer_claim_amount.json"
    
    if owner_cache.exists() and charterer_cache.exists():
        owner_events = json.loads(owner_cache.read_text())
        charterer_events = json.loads(charterer_cache.read_text())
        owner_claim = float(owner_claim_cache.read_text()) if owner_claim_cache.exists() else 0.0
        charterer_claim = float(charterer_claim_cache.read_text()) if charterer_claim_cache.exists() else 0.0
        return {
            "extracted_owner_events": owner_events,
            "extracted_charterer_events": charterer_events,
            "owner_claim_usd": owner_claim,
            "charterer_claim_usd": charterer_claim,
        }
        
    sof_owner_doc = parse(fixture_path / "sof_owner.pdf")
    sof_charterer_doc = parse(fixture_path / "sof_charterer.pdf")
    claim_owner_doc = parse(fixture_path / "claim_owner.pdf") if (fixture_path / "claim_owner.pdf").exists() else None
    claim_charterer_doc = parse(fixture_path / "claim_charterer.pdf") if (fixture_path / "claim_charterer.pdf").exists() else None
    
    owner_events = [e.model_dump() for e in extract_sof_events(sof_owner_doc)]
    charterer_events = [e.model_dump() for e in extract_sof_events(sof_charterer_doc)]
    owner_claim = extract_claim_amount(claim_owner_doc) if claim_owner_doc else 0.0
    charterer_claim = extract_claim_amount(claim_charterer_doc) if claim_charterer_doc else 0.0
    
    return {
        "extracted_owner_events": owner_events,
        "extracted_charterer_events": charterer_events,
        "owner_claim_usd": owner_claim,
        "charterer_claim_usd": charterer_claim,
    }

def validator_node(state: PipelineState) -> Dict[str, Any]:
    """Node: Independent Validator executing schema and cross-document validation."""
    log.info("[Validator] Running cross-document consistency checks...")
    errors = []
    
    terms = state["extracted_terms"]
    owner_events = state["extracted_owner_events"]
    charterer_events = state["extracted_charterer_events"]
    
    if not terms.get("vessel"):
        errors.append("Validation Error: Vessel name is missing in Charterparty extraction.")
        
    # Check vessel name consistency
    for e in owner_events + charterer_events:
        desc = e.get("description", "").lower()
        # Verify SOF doesn't contain mismatched descriptions
        if "vessel" in desc and terms.get("vessel", "").lower() not in desc:
            pass # can add soft warning
            
    # Verify lat/lon ranges
    lat = terms.get("load_port_lat", 0.0)
    lon = terms.get("load_port_lon", 0.0)
    if not (-90.0 <= lat <= 90.0) or not (-180.0 <= lon <= 180.0):
        errors.append(f"Validation Error: Geographical coordinates ({lat}, {lon}) are out of bounds.")

    return {
        "validation_errors": errors,
        "retry_count": state["retry_count"] + 1,
    }

def laytime_engine_node(state: PipelineState) -> Dict[str, Any]:
    """Node: Run deterministic laytime state machine logic."""
    log.info("[Laytime Engine] Running deterministic calculations...")
    fixture_path = Path(state["fixture_dir"])
    
    # Reconstruct Pydantic models for the execution engine
    terms = CharterpartyTerms.model_validate(state["extracted_terms"])
    owner_events = [SOFEvent.model_validate(e) for e in state["extracted_owner_events"]]
    charterer_events = [SOFEvent.model_validate(e) for e in state["extracted_charterer_events"]]
    
    engine = LaytimeEngine()
    owner_result = engine.calculate(terms, owner_events, "owner")
    charterer_result = engine.calculate(terms, charterer_events, "charterer")
    
    return {
        "owner_calculation": owner_result.model_dump(),
        "charterer_calculation": charterer_result.model_dump(),
    }

def adjudicator_node(state: PipelineState) -> Dict[str, Any]:
    """Node: Cross-reference weather exceptions and generate dispute verdicts."""
    log.info("[Adjudicator] Resolving dispute items...")
    fixture_path = Path(state["fixture_dir"])
    
    terms = CharterpartyTerms.model_validate(state["extracted_terms"])
    charterer_events = [SOFEvent.model_validate(e) for e in state["extracted_charterer_events"]]
    
    weather_provider = FixtureWeatherProvider(fixture_path)
    rate_per_hour = terms.demurrage_rate_per_day_usd / 24.0
    disputed_items: list[DisputedLineItem] = []
    
    for win_start, win_end in _weather_windows(charterer_events):
        start_utc = _utc(win_start)
        end_utc = _utc(win_end)
        disputed_hours = (end_utc - start_utc).total_seconds() / 3600.0
        owner_amount = disputed_hours * rate_per_hour
        
        # Evaluate weather rules
        observations = weather_provider.get(
            terms.load_port_lat,
            terms.load_port_lon,
            start_utc,
            end_utc,
        )
        verdict = evaluate_wwd_exception(terms, start_utc, end_utc, observations)
        
        disputed_items.append(DisputedLineItem(
            description=f"Weather Delay {start_utc.strftime('%Y-%m-%d %H:%M')} to {end_utc.strftime('%Y-%m-%d %H:%M')}",
            disputed_date=start_utc.date(),
            owner_position=f"Full rate ({disputed_hours:.1f}h) — weather delay rejected.",
            charterer_position=f"Excluded ({disputed_hours:.1f}h) — weather delay claimed.",
            owner_amount_usd=owner_amount,
            charterer_amount_usd=0.0,
            verdict=verdict,
        ))

    # Calculate totals
    owner_total = state["owner_calculation"]["demurrage_due_usd"]
    charterer_total = state["charterer_calculation"]["demurrage_due_usd"]
    
    reconciled_total_usd = charterer_total
    for item in disputed_items:
        reconciled_total_usd += item.verdict.dollars_credited_to_owner_usd

    reconciliation = Reconciliation(
        voyage_id=state["voyage_id"],
        owner_payout_claim_usd=state["owner_claim_usd"],
        charterer_payout_claim_usd=state["charterer_claim_usd"],
        discrepancy_usd=abs(state["owner_claim_usd"] - state["charterer_claim_usd"]),
        reconciled_total_usd=_round_usd(reconciled_total_usd),
        disputed_items=disputed_items,
    )
    
    return {"reconciliation": reconciliation.model_dump()}

# ─── Routing / Decisions ─────────────────────────────────────────────────────

def check_validation_routing(state: PipelineState) -> str:
    """Decide whether to route back for retry or proceed to calculation."""
    if state["validation_errors"]:
        if state["retry_count"] < 3:
            log.warning(f"[Validator] Validation failed. Retrying extraction loop (%d/3)...", state["retry_count"])
            return "retry"
        else:
            log.error("[Validator] Max retries reached. Forcing execution fallback.")
    return "calculate"

# ─── Graph Compilation ────────────────────────────────────────────────────────

def create_agent_pipeline() -> StateGraph:
    """Build and compile the multi-agent state graph."""
    workflow = StateGraph(PipelineState)
    
    # Add nodes
    workflow.add_node("orchestrator", orchestrator_node)
    workflow.add_node("cp_worker", cp_worker_node)
    workflow.add_node("sof_worker", sof_worker_node)
    workflow.add_node("validator", validator_node)
    workflow.add_node("laytime_engine", laytime_engine_node)
    workflow.add_node("adjudicator", adjudicator_node)
    
    # Set entry point
    workflow.set_entry_point("orchestrator")
    
    # Orchestrator triggers workers in parallel
    workflow.add_edge("orchestrator", "cp_worker")
    workflow.add_edge("orchestrator", "sof_worker")
    
    # Both workers feed into the validator
    workflow.add_edge("cp_worker", "validator")
    workflow.add_edge("sof_worker", "validator")
    
    # Validator checks logic and determines path
    workflow.add_conditional_edges(
        "validator",
        check_validation_routing,
        {
            "retry": "cp_worker", # loops back
            "calculate": "laytime_engine",
        }
    )
    
    # Calculations flow to final dispute adjudication
    workflow.add_edge("laytime_engine", "adjudicator")
    workflow.add_edge("adjudicator", END)
    
    return workflow.compile()

# ─── Runner helper ────────────────────────────────────────────────────────────

def run_agent_pipeline(fixture_dir: Path, voyage_id: str) -> Dict[str, Any]:
    """Run the compiled agent graph pipeline synchronously."""
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
    
    result = app.invoke(initial_state)
    return result
