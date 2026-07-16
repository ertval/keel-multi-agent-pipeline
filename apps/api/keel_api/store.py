"""SQLite persistence for voyage pipeline results.

Stores the full pipeline output as JSON so the API can serve it without
re-running the (slow) LLM extraction on every request.

Schema:
    voyages(id TEXT PRIMARY KEY, data_json TEXT, created_at TEXT, owner_name TEXT)
"""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import Column, String, Text, create_engine, text
from sqlalchemy.orm import DeclarativeBase, Session


def _db_path() -> str:
    return os.environ.get("KEEL_DB", str(Path(__file__).parent.parent / "keel.db"))


class Base(DeclarativeBase):
    pass


class VoyageRow(Base):
    __tablename__ = "voyages"
    id = Column(String, primary_key=True)
    data_json = Column(Text, nullable=False)
    created_at = Column(String, nullable=False)
    owner_name = Column(String, nullable=True)


_engine = None


def _get_engine():
    global _engine
    if _engine is None:
        _engine = create_engine(
            f"sqlite:///{_db_path()}",
            connect_args={"check_same_thread": False},
        )
        Base.metadata.create_all(_engine)
        _ensure_owner_name_column(_engine)
    return _engine


def _ensure_owner_name_column(engine) -> None:
    with engine.connect() as conn:
        result = conn.execute(text("PRAGMA table_info(voyages)"))
        columns = {row[1] for row in result}
        if "owner_name" not in columns:
            conn.execute(text("ALTER TABLE voyages ADD COLUMN owner_name TEXT"))
            conn.commit()


def save_voyage(
    voyage_id: str,
    data: dict,
    created_at: str | None = None,
    owner_name: str | None = None,
) -> None:
    created_at = created_at or datetime.now(timezone.utc).isoformat()
    if owner_name is None and isinstance(data, dict):
        owner_name = data.get("owner_name")
    with Session(_get_engine()) as session:
        row = VoyageRow(
            id=voyage_id,
            data_json=json.dumps(data),
            created_at=created_at,
            owner_name=owner_name,
        )
        session.merge(row)
        session.commit()


def load_voyage(voyage_id: str) -> dict | None:
    with Session(_get_engine()) as session:
        row = session.get(VoyageRow, voyage_id)
        return json.loads(row.data_json) if row else None


# ---------------------------------------------------------------------------
# In-memory processing status (reset on restart — fine for demo)
# ---------------------------------------------------------------------------

_status: dict[str, dict] = {}


def set_status(voyage_id: str, status: str, message: str) -> None:
    _status[voyage_id] = {"status": status, "message": message}


def get_status(voyage_id: str) -> dict | None:
    return _status.get(voyage_id)


def list_voyages() -> list[dict]:
    with Session(_get_engine()) as session:
        rows = session.query(VoyageRow).order_by(VoyageRow.created_at.desc()).all()
        voyages: list[dict] = []
        for row in rows:
            summary: dict = {"voyage_id": row.id, "created_at": row.created_at}
            if row.owner_name:
                summary["owner_name"] = row.owner_name
            try:
                data = json.loads(row.data_json)
            except json.JSONDecodeError:
                voyages.append(summary)
                continue

            if isinstance(data, dict):
                owner_name = data.get("owner_name")
                if owner_name and not summary.get("owner_name"):
                    summary["owner_name"] = owner_name
                status = data.get("status")
                if "resolution_seconds" in data:
                    summary["resolution_seconds"] = data.get("resolution_seconds")

                frontend = data.get("frontend") or {}
                if frontend:
                    charterparty = frontend.get("charterparty") or {}
                    owner_calc = frontend.get("owner_calculation") or {}
                    charterer_calc = frontend.get("charterer_calculation") or {}
                    summary.update({
                        "vessel_name": charterparty.get("vessel_name"),
                        "owner_name": charterparty.get("owner_name") or summary.get("owner_name"),
                        "charterer_name": charterparty.get("charterer_name"),
                        "owner_total_usd": owner_calc.get("total_usd"),
                        "charterer_total_usd": charterer_calc.get("total_usd"),
                        "reconciled_total_usd": frontend.get("reconciled_total_usd"),
                        "disputed_count": len(frontend.get("day_verdicts") or []),
                    })
                    status = status or "Reconciled"
                else:
                    reconciliation = data.get("reconciliation") or {}
                    summary.update({
                        "owner_total_usd": reconciliation.get("owner_total_usd"),
                        "charterer_total_usd": reconciliation.get("charterer_total_usd"),
                        "reconciled_total_usd": reconciliation.get("reconciled_total_usd"),
                        "disputed_count": len(reconciliation.get("disputed_items") or []),
                    })
                    status = status or "Processing"

                if status:
                    summary["status"] = status

            voyages.append(summary)
        return voyages


def delete_voyage(voyage_id: str) -> bool:
    """Delete a voyage by ID. Returns True if deleted, False if not found."""
    with Session(_get_engine()) as session:
        row = session.get(VoyageRow, voyage_id)
        if row is None:
            return False
        session.delete(row)
        session.commit()
        return True
