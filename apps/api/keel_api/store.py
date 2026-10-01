"""SQLite persistence for voyage pipeline results.

Stores the full pipeline output as JSON so the API can serve it without
re-running the (slow) LLM extraction on every request.

`status` is a denormalised copy of the human-readable status held inside
`data_json`. Without it every list request had to read and JSON-decode the
whole table, which is ~170 ms once the payloads reach ~124 KB; the column lets
both list endpoints filter, count and page in SQL and decode only the page.

Schema:
    voyages(id TEXT PRIMARY KEY, status TEXT, data_json TEXT,
            created_at TEXT, owner_name TEXT)
"""

from __future__ import annotations

import json
import os
from collections import OrderedDict
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import Column, String, Text, create_engine, func, select, text
from sqlalchemy.orm import DeclarativeBase, Session


def _db_path() -> str:
    return os.environ.get("KEEL_DB", str(Path(__file__).parent.parent / "keel.db"))


class Base(DeclarativeBase):
    pass


class VoyageRow(Base):
    __tablename__ = "voyages"
    id = Column(String, primary_key=True)
    status = Column(String, nullable=True, index=True)
    data_json = Column(Text, nullable=False)
    created_at = Column(String, nullable=False)
    owner_name = Column(String, nullable=True)


def _derived_status(data: object) -> str | None:
    """The status the list endpoints report, as `data_json` implies it."""
    if not isinstance(data, dict):
        return None
    status = data.get("status")
    if data.get("frontend"):
        return status or "Reconciled"
    return status or "Processing"


_engine = None

DEFAULT_LIST_ROWS = 500


def _get_engine():
    global _engine
    if _engine is None:
        _engine = create_engine(
            f"sqlite:///{_db_path()}",
            connect_args={"check_same_thread": False, "timeout": 30},
        )
        Base.metadata.create_all(_engine)
        _ensure_owner_name_column(_engine)
        _ensure_status_column(_engine)
        _apply_pragmas(_engine)
    return _engine


def _apply_pragmas(engine) -> None:
    """WAL plus a busy timeout, so concurrent readers and writers queue instead
    of failing the whole request with `database is locked`."""
    with engine.connect() as conn:
        conn.execute(text("PRAGMA journal_mode=WAL"))
        conn.execute(text("PRAGMA synchronous=NORMAL"))
        conn.execute(text("PRAGMA busy_timeout=30000"))
        conn.commit()


def _ensure_owner_name_column(engine) -> None:
    with engine.connect() as conn:
        result = conn.execute(text("PRAGMA table_info(voyages)"))
        columns = {row[1] for row in result}
        if "owner_name" not in columns:
            conn.execute(text("ALTER TABLE voyages ADD COLUMN owner_name TEXT"))
            conn.commit()


def _ensure_status_column(engine) -> None:
    with engine.connect() as conn:
        result = conn.execute(text("PRAGMA table_info(voyages)"))
        columns = {row[1] for row in result}
        if "status" not in columns:
            conn.execute(text("ALTER TABLE voyages ADD COLUMN status TEXT"))
        rows = conn.execute(
            text("SELECT id, data_json FROM voyages WHERE status IS NULL")
        ).fetchall()
        for row_id, data_json in rows:
            try:
                derived = _derived_status(json.loads(data_json))
            except json.JSONDecodeError:
                derived = None
            if derived is not None:
                conn.execute(
                    text("UPDATE voyages SET status = :status WHERE id = :id"),
                    {"status": derived, "id": row_id},
                )
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
            status=_derived_status(data),
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


def patch_voyage(voyage_id: str, updates: dict) -> bool:
    """Merge `updates` into a voyage's stored JSON in one write transaction.

    The read and the write used to be a separate `load_voyage` + `save_voyage`
    pair around the caller's own dict, so two concurrent callers could each read
    the same row and the second write would silently drop the first one's field.
    `BEGIN IMMEDIATE` takes the write lock up front, which is what serialises
    the two on SQLite. Returns False when the voyage does not exist.
    """
    with Session(_get_engine()) as session:
        session.connection().exec_driver_sql("BEGIN IMMEDIATE")
        row = session.get(VoyageRow, voyage_id)
        if row is None:
            session.rollback()
            return False
        try:
            data = json.loads(row.data_json)
        except json.JSONDecodeError:
            data = {}
        if not isinstance(data, dict):
            data = {}
        data.update(updates)
        row.data_json = json.dumps(data)
        row.status = _derived_status(data)
        session.commit()
        return True


# ---------------------------------------------------------------------------
# In-memory processing status (reset on restart — fine for demo)
# ---------------------------------------------------------------------------

_MAX_TRACKED_VOYAGES = 1000
_status: "OrderedDict[str, dict]" = OrderedDict()


def set_status(voyage_id: str, status: str, message: str) -> None:
    # Every upload gets an entry and nothing ever removed one, so the map grew
    # for the lifetime of the process; the oldest entries are dropped instead.
    _status[voyage_id] = {"status": status, "message": message}
    _status.move_to_end(voyage_id)
    while len(_status) > _MAX_TRACKED_VOYAGES:
        _status.popitem(last=False)


def get_status(voyage_id: str) -> dict | None:
    return _status.get(voyage_id)


def list_voyages(
    limit: int | None = 500,
    offset: int = 0,
    statuses: tuple[str, ...] | None = None,
) -> list[dict]:
    """Summaries, newest first, decoded only for the page that is returned.

    `limit` defaults to `DEFAULT_LIST_ROWS` rather than None so no caller can
    accidentally ask the API to JSON-decode the whole table.
    """
    query = select(VoyageRow).order_by(VoyageRow.created_at.desc(), VoyageRow.id.desc())
    if statuses is not None:
        query = query.where(VoyageRow.status.in_(statuses))
    if offset:
        query = query.offset(offset)
    if limit is not None:
        query = query.limit(limit)

    with Session(_get_engine()) as session:
        rows = session.execute(query).scalars().all()
        return [_summary(row) for row in rows]


def count_voyages(statuses: tuple[str, ...] | None = None) -> int:
    query = select(func.count()).select_from(VoyageRow)
    if statuses is not None:
        query = query.where(VoyageRow.status.in_(statuses))
    with Session(_get_engine()) as session:
        return int(session.execute(query).scalar_one())


def _summary(row: VoyageRow) -> dict:
    summary: dict = {"voyage_id": row.id, "created_at": row.created_at}
    if row.owner_name:
        summary["owner_name"] = row.owner_name
    try:
        data = json.loads(row.data_json)
    except json.JSONDecodeError:
        return summary

    if not isinstance(data, dict):
        return summary

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
    return summary


def delete_voyage(voyage_id: str) -> bool:
    """Delete a voyage by ID. Returns True if deleted, False if not found."""
    with Session(_get_engine()) as session:
        row = session.get(VoyageRow, voyage_id)
        if row is None:
            return False
        session.delete(row)
        session.commit()
    _status.pop(voyage_id, None)
    return True
