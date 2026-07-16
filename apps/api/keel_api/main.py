from __future__ import annotations

import os
import shutil
import tempfile
import uuid
from pathlib import Path

from fastapi import BackgroundTasks, FastAPI, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from keel_api.adapters import reconciliation_to_frontend
from keel_api.letter.render import render_letter
from keel_api.pipeline import run_voyage_pipeline
from keel_api.schemas import CharterpartyTerms, Reconciliation
from keel_api.store import get_status, list_voyages, load_voyage, save_voyage, set_status, delete_voyage

app = FastAPI(title="Keel API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Request models ──────────────────────────────────────────────────────────


class StatusUpdateRequest(BaseModel):
    status: str


# ─── Fixture directory ────────────────────────────────────────────────────────
_FIXTURE_DIR = Path(__file__).resolve().parents[3] / "fixtures" / "voyage_001"

# Serve voyage source PDFs so the frontend citation viewer can load them
# (pdf_urls reference /static/<voyage_id>/<file>.pdf).
app.mount("/static", StaticFiles(directory=str(_FIXTURE_DIR.parent)), name="static")


def _load_owner_name(fixture_dir: Path) -> str | None:
    cp_path = fixture_dir / "extracted_charterparty.json"
    if not cp_path.exists():
        return None
    try:
        terms = CharterpartyTerms.model_validate_json(cp_path.read_text())
    except Exception:
        return None
    return terms.owner


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/voyages")
def get_voyages() -> list[dict]:
    return list_voyages()

def _get_or_seed_voyage(voyage_id: str) -> dict:
    data = load_voyage(voyage_id)
    if voyage_id == "voyage_001":
        frontend = data.get("frontend") if isinstance(data, dict) else None
        is_canonical = (
            frontend is not None
            and (frontend.get("owner_calculation") or {}).get("total_usd") == 187000
            and (frontend.get("charterer_calculation") or {}).get("total_usd") == 62000
            and frontend.get("reconciled_total_usd") == 112000
        )
        if not is_canonical:
            # Auto-seed/refresh voyage_001 using the canonical fixture for demo mode.
            reconciliation, terms, owner_result, charterer_result = run_voyage_pipeline(_FIXTURE_DIR)
            frontend_data = reconciliation_to_frontend(reconciliation, terms, owner_result, charterer_result)
            owner_name = _load_owner_name(_FIXTURE_DIR)
            data = {
                "reconciliation": reconciliation.model_dump(mode="json"),
                "frontend": frontend_data,
                "pdf_urls": {
                    "charterparty.pdf": f"/static/voyage_001/charterparty.pdf",
                    "sof_owner.pdf": f"/static/voyage_001/sof_owner.pdf",
                    "sof_charterer.pdf": f"/static/voyage_001/sof_charterer.pdf",
                },
                "owner_name": owner_name,
            }
            save_voyage("voyage_001", data, owner_name=owner_name)
    elif data is None:
        raise HTTPException(status_code=404, detail=f"Voyage {voyage_id!r} not found")
    return data


@app.get("/voyages/{voyage_id}")
def get_voyage(voyage_id: str) -> dict:
    data = _get_or_seed_voyage(voyage_id)
    return {"reconciliation": data["frontend"], "pdf_urls": data.get("pdf_urls", {})}


@app.get("/voyages/{voyage_id}/status")
def get_voyage_status(voyage_id: str) -> dict:
    status = get_status(voyage_id)
    if status:
        return status
    # If it's already in the DB, it's ready
    if load_voyage(voyage_id):
        return {"status": "ready", "message": "Reconciliation complete."}
    raise HTTPException(status_code=404, detail=f"Voyage {voyage_id!r} not found")


@app.patch("/voyages/{voyage_id}/status")
def update_voyage_status(voyage_id: str, request: StatusUpdateRequest) -> dict:
    """Manually override the human-readable status of a voyage."""
    new_status = request.status
    allowed = {"Reconciled", "In Review", "Pending", "Closed"}
    if new_status not in allowed:
        raise HTTPException(status_code=422, detail=f"status must be one of {sorted(allowed)}")
    data = load_voyage(voyage_id)
    if data is None:
        raise HTTPException(status_code=404, detail=f"Voyage {voyage_id!r} not found")
    data["status"] = new_status
    save_voyage(voyage_id, data, owner_name=data.get("owner_name"))
    return {"voyage_id": voyage_id, "status": new_status}


@app.delete("/voyages/{voyage_id}")
def delete_voyage_endpoint(voyage_id: str) -> dict:
    """Delete a voyage and its associated data."""
    if not delete_voyage(voyage_id):
        raise HTTPException(status_code=404, detail=f"Voyage {voyage_id!r} not found")
    return {"voyage_id": voyage_id, "status": "deleted"}


@app.get("/reconciliations")
def get_reconciliations(page: int = 1, per_page: int = 10) -> dict:
    all_voyages = list_voyages()
    reconciled = [
        v for v in all_voyages
        if v.get("status") in ("Reconciled", "In Review", "Closed")
    ]
    total = len(reconciled)
    total_pages = max(1, (total + per_page - 1) // per_page)
    start = (page - 1) * per_page
    end = start + per_page
    return {
        "items": reconciled[start:end],
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages,
    }


@app.delete("/reconciliations/{voyage_id}")
def delete_reconciliation_endpoint(voyage_id: str) -> dict:
    """Delete a reconciliation (same as deleting the voyage)."""
    if not delete_voyage(voyage_id):
        raise HTTPException(status_code=404, detail=f"Reconciliation {voyage_id!r} not found")
    return {"voyage_id": voyage_id, "status": "deleted"}


@app.get("/voyages/{voyage_id}/letter", response_class=HTMLResponse)
def get_letter(voyage_id: str) -> str:
    data = _get_or_seed_voyage(voyage_id)
    return render_letter(data["frontend"])


def _run_pipeline_task(voyage_id: str, fixture_dir: Path) -> None:
    """Background task: run pipeline, update status, persist result."""
    try:
        def on_progress(msg: str) -> None:
            set_status(voyage_id, "processing", msg)

        set_status(voyage_id, "processing", "Starting pipeline…")
        reconciliation, terms, owner_result, charterer_result = run_voyage_pipeline(
            fixture_dir, on_progress=on_progress, voyage_id=voyage_id
        )

        owner_name = _load_owner_name(fixture_dir)
        frontend_data = reconciliation_to_frontend(reconciliation, terms, owner_result, charterer_result)
        save_voyage(
            reconciliation.voyage_id,
            {
                "reconciliation": reconciliation.model_dump(mode="json"),
                "frontend": frontend_data,
                "pdf_urls": {
                    "charterparty.pdf": f"/static/{reconciliation.voyage_id}/charterparty.pdf",
                    "sof_owner.pdf": f"/static/{reconciliation.voyage_id}/sof_owner.pdf",
                    "sof_charterer.pdf": f"/static/{reconciliation.voyage_id}/sof_charterer.pdf",
                },
                "owner_name": owner_name,
                "status": "In Review",  # Require user approval before marking "Reconciled"
            },
            owner_name=owner_name,
        )
        set_status(voyage_id, "ready", f"Reconciled: ${reconciliation.reconciled_total_usd:,.0f}")
    except Exception as exc:
        set_status(voyage_id, "error", str(exc))
        # Update the DB stub so the dashboard doesn't show "Processing" forever
        save_voyage(voyage_id, {"status": "Error", "error": str(exc)})


@app.post("/voyages")
async def upload_voyage(background_tasks: BackgroundTasks, files: list[UploadFile] = []) -> dict:
    """Accept uploaded PDFs + weather JSON, kick off pipeline, return immediately."""

    if not files:
        # Demo mode: run against the fixture directory
        fixture_dir = _FIXTURE_DIR
        voyage_id = "voyage_001"
    else:
        voyage_id = f"voyage_{uuid.uuid4().hex[:8]}"
        tmp = tempfile.mkdtemp()
        fixture_dir = Path(tmp)
        try:
            for upload in files:
                dest = fixture_dir / upload.filename
                with dest.open("wb") as f:
                    shutil.copyfileobj(upload.file, f)
        except Exception:
            shutil.rmtree(tmp, ignore_errors=True)
            raise

    # Persist a "Processing" stub immediately so the voyage appears in the
    # dashboard table before the pipeline finishes (avoids the jarring jump
    # from "absent" straight to "Reconciled").
    if not load_voyage(voyage_id):
        save_voyage(voyage_id, {"status": "Processing"})

    background_tasks.add_task(_run_pipeline_task, voyage_id, fixture_dir)
    return {"voyage_id": voyage_id, "status": "processing"}
