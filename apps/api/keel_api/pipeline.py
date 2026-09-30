"""High-level voyage-processing pipeline.

parse → extract → calculate (×2 parties) → reconcile

Entrypoint for the canonical assertion test and the FastAPI /reconcile
endpoint. Requires OPENAI_API_KEY (or NVIDIA NIM equivalent) to be set.
"""

from collections.abc import Callable
from datetime import datetime, timezone
from pathlib import Path

from keel_api.schemas import CharterpartyTerms, CalculationResult, Reconciliation, SOFEvent


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


def run_voyage_pipeline(
    fixture_dir: Path,
    on_progress: "Callable[[str], None] | None" = None,
    voyage_id: str | None = None,
    on_validation_errors: "Callable[[list[dict]], None] | None" = None,
) -> tuple[Reconciliation, CharterpartyTerms, CalculationResult, CalculationResult]:
    """Run the multi-agent LangGraph pipeline against a voyage fixture directory.

    `on_progress` receives one message per executed graph node. The validation
    issues the graph ended on — including any left behind once the retry budget
    is spent — are handed to `on_validation_errors` so the caller can persist
    them alongside the reconciliation.
    """
    from keel_api.pipeline_agents import run_agent_pipeline

    if on_progress:
        on_progress("Initializing multi-agent LangGraph pipeline...")

    vid = voyage_id or fixture_dir.name or "unknown"
    result = run_agent_pipeline(fixture_dir, vid, on_progress=on_progress)

    if on_validation_errors:
        on_validation_errors(result.get("validation_errors") or [])

    reconciliation = Reconciliation.model_validate(result["reconciliation"])
    terms = CharterpartyTerms.model_validate(result["extracted_terms"])
    owner_result = CalculationResult.model_validate(result["owner_calculation"])
    charterer_result = CalculationResult.model_validate(result["charterer_calculation"])

    return reconciliation, terms, owner_result, charterer_result
