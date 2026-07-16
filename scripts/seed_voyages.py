"""Seed the sqlite database with demo voyages for the dashboard.

Usage:
  python scripts/seed_voyages.py

The script reads cached fixture extracts from fixtures/voyage_001 and
writes multiple voyages into apps/api/keel.db (or KEEL_DB if set).
"""

from __future__ import annotations

import json
import sys
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT / "apps" / "api"))

from keel_api.adapters import reconciliation_to_frontend
from keel_api.engine import LaytimeEngine
from keel_api.pipeline import run_voyage_pipeline
from keel_api.schemas import CharterpartyTerms, Reconciliation, SOFEvent
from keel_api.store import save_voyage

FIXTURE_DIR = REPO_ROOT / "fixtures" / "voyage_001"


@dataclass(frozen=True)
class VoyageSeed:
    voyage_id: str
    vessel_name: str
    owner_name: str
    status: str
    scale: float
    days_ago: int
    resolution_seconds: int | None
    include_audit: bool = True


def _load_cached_terms_and_events(fixture_dir: Path) -> tuple[
    CharterpartyTerms,
    list[SOFEvent],
    list[SOFEvent],
]:
    cp_path = fixture_dir / "extracted_charterparty.json"
    owner_path = fixture_dir / "extracted_sof_owner.json"
    charterer_path = fixture_dir / "extracted_sof_charterer.json"

    if not cp_path.exists() or not owner_path.exists() or not charterer_path.exists():
        missing = [
            p.name
            for p in (cp_path, owner_path, charterer_path)
            if not p.exists()
        ]
        raise FileNotFoundError(
            "Missing cached extracts: " + ", ".join(missing)
        )

    terms = CharterpartyTerms.model_validate_json(cp_path.read_text())
    owner_events = [
        SOFEvent.model_validate(e)
        for e in json.loads(owner_path.read_text())
    ]
    charterer_events = [
        SOFEvent.model_validate(e)
        for e in json.loads(charterer_path.read_text())
    ]
    return terms, owner_events, charterer_events


def _clone_reconciliation(reconciliation: Reconciliation) -> Reconciliation:
    return Reconciliation.model_validate(reconciliation.model_dump(mode="json"))


def _apply_scale(reconciliation: Reconciliation, scale: float) -> None:
    reconciliation.owner_total_usd = round(reconciliation.owner_total_usd * scale, 2)
    reconciliation.charterer_total_usd = round(reconciliation.charterer_total_usd * scale, 2)
    for item in reconciliation.disputed_items:
        item.owner_amount_usd = round(item.owner_amount_usd * scale, 2)
        item.charterer_amount_usd = round(item.charterer_amount_usd * scale, 2)
        item.verdict.dollars_credited_to_owner_usd = round(
            item.verdict.dollars_credited_to_owner_usd * scale,
            2,
        )
    owner_wins = sum(
        item.verdict.dollars_credited_to_owner_usd for item in reconciliation.disputed_items
    )
    reconciliation.reconciled_total_usd = round(
        reconciliation.charterer_total_usd + owner_wins,
        2,
    )


def _build_frontend(
    reconciliation: Reconciliation,
    terms: CharterpartyTerms,
    owner_result,
    charterer_result,
) -> dict:
    return reconciliation_to_frontend(
        reconciliation,
        terms,
        owner_result,
        charterer_result,
    )


def seed_db() -> None:
    reconciliation, terms, owner_result, charterer_result = run_voyage_pipeline(FIXTURE_DIR)

    seeds = [
        VoyageSeed(
            voyage_id="voyage_001",
            vessel_name="MV Aegean Star",
            owner_name="Aegean Maritime",
            status="Reconciled",
            scale=1.0,
            days_ago=0,
            resolution_seconds=9,
            include_audit=True,
        ),
        VoyageSeed(
            voyage_id="voyage_002",
            vessel_name="MV Piraeus Dawn",
            owner_name="Hellas Marine Group",
            status="In Review",
            scale=1.25,
            days_ago=2,
            resolution_seconds=42,
        ),
        VoyageSeed(
            voyage_id="voyage_003",
            vessel_name="MV Olympia Grace",
            owner_name="Olympia Bluewater",
            status="Pending",
            scale=0.75,
            days_ago=4,
            resolution_seconds=None,
        ),
        VoyageSeed(
            voyage_id="voyage_004",
            vessel_name="MV Athos Navigator",
            owner_name="Athos Navigation Ltd",
            status="Reconciled",
            scale=1.05,
            days_ago=8,
            resolution_seconds=13,
        ),
    ]

    now = datetime.now(timezone.utc)

    for seed in seeds:
        recon = _clone_reconciliation(reconciliation)
        recon.voyage_id = seed.voyage_id
        _apply_scale(recon, seed.scale)

        terms_copy = CharterpartyTerms.model_validate(terms.model_dump(mode="json"))
        terms_copy.vessel = seed.vessel_name
        terms_copy.owner = seed.owner_name

        frontend = _build_frontend(
            recon,
            terms_copy,
            owner_result if seed.include_audit else None,
            charterer_result if seed.include_audit else None,
        )

        data = {
            "reconciliation": recon.model_dump(mode="json"),
            "frontend": frontend,
            "pdf_urls": {
                "charterparty.pdf": f"/static/{seed.voyage_id}/charterparty.pdf",
                "sof_owner.pdf": f"/static/{seed.voyage_id}/sof_owner.pdf",
                "sof_charterer.pdf": f"/static/{seed.voyage_id}/sof_charterer.pdf",
            },
            "status": seed.status,
            "resolution_seconds": seed.resolution_seconds,
            "owner_name": seed.owner_name,
        }

        created_at = (now - timedelta(days=seed.days_ago)).isoformat()
        save_voyage(seed.voyage_id, data, created_at=created_at, owner_name=seed.owner_name)
        print(f"seeded {seed.voyage_id} ({seed.status})")


if __name__ == "__main__":
    seed_db()
