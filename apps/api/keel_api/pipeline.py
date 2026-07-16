"""High-level voyage-processing pipeline.

parse → extract → calculate (×2 parties) → reconcile

Entrypoint for the canonical assertion test and the FastAPI /reconcile
endpoint. Requires OPENAI_API_KEY (or NVIDIA NIM equivalent) to be set.
"""

from __future__ import annotations

import json
from collections.abc import Callable
from datetime import date, datetime, timezone
from pathlib import Path

from keel_api.engine import LaytimeEngine
from keel_api.extraction import extract_charterparty_terms, extract_sof_events, extract_claim_amount
from keel_api.parsing import parse
from keel_api.schemas import CharterpartyTerms, CalculationResult
from keel_api.rules import evaluate_wwd_exception
from keel_api.schemas import (
    DisputedLineItem,
    Reconciliation,
    SOFEvent,
    Verdict,
    WeatherCitation,
    WeatherSummary,
)
from keel_api.weather import FixtureWeatherProvider


def _utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def _weather_windows(events: list[SOFEvent]) -> list[tuple[datetime, datetime]]:
    """Extract WEATHER_DELAY_START/END pairs from a SOF event list."""
    windows: list[tuple[datetime, datetime]] = []
    start: datetime | None = None
    for event in sorted(events, key=lambda e: e.timestamp):
        if event.event_type == "WEATHER_DELAY_START":
            start = event.timestamp
        elif event.event_type == "WEATHER_DELAY_END" and start is not None:
            windows.append((start, event.timestamp))
            start = None
    return windows


def _round_usd(amount: float) -> float:
    """Round to nearest $1,000 — demurrage claims are presented rounded."""
    return round(amount / 1000) * 1000


def _load_or_extract(
    fixture_dir: Path,
    progress: "Callable[[str], None]",
) -> tuple[CharterpartyTerms, list[SOFEvent], list[SOFEvent], float, float]:
    """Return extracted data from cached JSON files, or call the LLM if missing.

    Returns: (terms, owner_events, charterer_events, owner_claim_usd, charterer_claim_usd)
    """
    cp_cache = fixture_dir / "extracted_charterparty.json"
    owner_cache = fixture_dir / "extracted_sof_owner.json"
    charterer_cache = fixture_dir / "extracted_sof_charterer.json"
    owner_claim_cache = fixture_dir / "extracted_owner_claim_amount.json"
    charterer_claim_cache = fixture_dir / "extracted_charterer_claim_amount.json"

    if (cp_cache.exists() and owner_cache.exists() and charterer_cache.exists()
        and owner_claim_cache.exists() and charterer_claim_cache.exists()):
        terms = CharterpartyTerms.model_validate_json(cp_cache.read_text())
        owner_events = [SOFEvent.model_validate(e) for e in json.loads(owner_cache.read_text())]
        charterer_events = [SOFEvent.model_validate(e) for e in json.loads(charterer_cache.read_text())]
        owner_claim_usd = float(owner_claim_cache.read_text())
        charterer_claim_usd = float(charterer_claim_cache.read_text())
        return terms, owner_events, charterer_events, owner_claim_usd, charterer_claim_usd

    # Cache miss — call LLM and write cache files for next time
    progress("Parsing documents…")
    cp_doc = parse(fixture_dir / "charterparty.pdf")
    sof_owner_doc = parse(fixture_dir / "sof_owner.pdf")
    sof_charterer_doc = parse(fixture_dir / "sof_charterer.pdf")
    claim_owner_doc = parse(fixture_dir / "claim_owner.pdf") if (fixture_dir / "claim_owner.pdf").exists() else None
    claim_charterer_doc = parse(fixture_dir / "claim_charterer.pdf") if (fixture_dir / "claim_charterer.pdf").exists() else None

    progress("Extracting charterparty terms (LLM)…")
    terms = extract_charterparty_terms(cp_doc)
    progress("Extracting owner SOF events (LLM)…")
    owner_events = extract_sof_events(sof_owner_doc)
    progress("Extracting charterer SOF events (LLM)…")
    charterer_events = extract_sof_events(sof_charterer_doc)

    progress("Extracting owner claim amount (LLM)…")
    owner_claim_usd = extract_claim_amount(claim_owner_doc) if claim_owner_doc else 0.0
    progress("Extracting charterer claim amount (LLM)…")
    charterer_claim_usd = extract_claim_amount(claim_charterer_doc) if claim_charterer_doc else 0.0

    cp_cache.write_text(terms.model_dump_json(indent=2))
    owner_cache.write_text(json.dumps([e.model_dump(mode="json") for e in owner_events], indent=2))
    charterer_cache.write_text(json.dumps([e.model_dump(mode="json") for e in charterer_events], indent=2))
    owner_claim_cache.write_text(str(owner_claim_usd))
    charterer_claim_cache.write_text(str(charterer_claim_usd))

    return terms, owner_events, charterer_events, owner_claim_usd, charterer_claim_usd


def run_voyage_pipeline(
    fixture_dir: Path,
    on_progress: "Callable[[str], None] | None" = None,
    voyage_id: str | None = None,
) -> tuple[Reconciliation, CharterpartyTerms, "CalculationResult", "CalculationResult"]:
    """Run the multi-agent LangGraph pipeline against a voyage fixture directory."""
    from keel_api.pipeline_agents import run_agent_pipeline
    
    if on_progress:
        on_progress("Initializing multi-agent LangGraph pipeline...")
        
    vid = voyage_id or fixture_dir.name or "unknown"
    result = run_agent_pipeline(fixture_dir, vid)
    
    reconciliation = Reconciliation.model_validate(result["reconciliation"])
    terms = CharterpartyTerms.model_validate(result["extracted_terms"])
    owner_result = CalculationResult.model_validate(result["owner_calculation"])
    charterer_result = CalculationResult.model_validate(result["charterer_calculation"])
    
    return reconciliation, terms, owner_result, charterer_result
