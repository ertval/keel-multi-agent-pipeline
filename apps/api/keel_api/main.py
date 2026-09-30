from __future__ import annotations

import hmac
import json
import logging
import os
import re
import shutil
import tempfile
import threading
import uuid
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import BackgroundTasks, FastAPI, HTTPException, Query, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, ValidationError
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from keel_api.adapters import reconciliation_to_frontend
from keel_api.letter.render import render_letter
from keel_api.pipeline import run_voyage_pipeline
from keel_api.rules.evaluators import _RULE_ID as _WEATHER_RULE_ID
from keel_api.schemas import CharterpartyTerms, WeatherObservation
from keel_api.store import (
    count_voyages,
    delete_voyage,
    get_status,
    list_voyages,
    load_voyage,
    patch_voyage,
    save_voyage,
    set_status,
)

logger = logging.getLogger(__name__)


def _env_int(name: str, default: int, minimum: int = 1) -> int:
    try:
        value = int(os.environ.get(name, "").strip())
    except ValueError:
        return default
    return value if value >= minimum else default


def _env_list(name: str, default: list[str]) -> list[str]:
    raw = os.environ.get(name)
    if raw is None:
        return default
    return [item.strip() for item in raw.split(",") if item.strip()]

# ─── Request models ──────────────────────────────────────────────────────────


class StatusUpdateRequest(BaseModel):
    status: str


# ─── Fixture directory ────────────────────────────────────────────────────────
_FIXTURE_DIR = Path(__file__).resolve().parents[3] / "fixtures" / "voyage_001"
_EXPECTED_RECONCILIATION = _FIXTURE_DIR / "expected_reconciliation.json"
_DEMO_VOYAGE_ID = "voyage_001"

# The agent graph reads each party's Statement of Facts from these two filenames
# by convention (pipeline_agents.sof_worker_node), and the audit trace's
# `sof_citation` comes from those events, so these are the citation's real source
# documents. A party's trace therefore cites its own SOF, never the counterparty's.
_OWNER_SOF_DOCUMENT = "sof_owner.pdf"
_CHARTERER_SOF_DOCUMENT = "sof_charterer.pdf"


def _load_owner_name(fixture_dir: Path) -> str | None:
    cp_path = fixture_dir / "extracted_charterparty.json"
    if not cp_path.exists():
        return None
    try:
        terms = CharterpartyTerms.model_validate_json(cp_path.read_text())
    except Exception:
        return None
    return terms.owner


def _expected_totals() -> dict[str, float]:
    """Canonical totals as declared by the fixture, not as literals in this app."""
    expected = json.loads(_EXPECTED_RECONCILIATION.read_text())
    return {
        "owner": float(expected["owner_total_usd"]),
        "charterer": float(expected["charterer_total_usd"]),
        "reconciled": float(expected["reconciled_total_usd"]),
    }


def _demo_citations_named(frontend: dict) -> bool:
    """True when every stored audit-trace citation still names its source document.

    A row written before the pipeline threaded document names through carries
    `null`, which silently breaks the UI's click-to-highlight lookup, and its
    totals still match the fixture — so a totals-only check would keep serving it
    forever. Citations are only required to be named when the trace has any.
    """
    traces = [
        entry
        for party in ("owner_calculation", "charterer_calculation")
        for entry in (frontend.get(party) or {}).get("audit_trace") or []
    ]
    citations = [entry["citation"] for entry in traces if entry.get("citation")]
    return all(citation.get("document") for citation in citations)


def _demo_matches_expected(data: dict | None) -> bool:
    """True when the stored demo voyage is still what this code would produce.

    Comparing against the fixture (rather than against numbers typed into this
    module) is what lets a corrected expectation actually re-seed the demo.
    """
    frontend = (data or {}).get("frontend") or {}
    if not frontend:
        return False
    try:
        expected = _expected_totals()
    except (OSError, ValueError, KeyError, TypeError):
        logger.warning(
            "Cannot read expected totals from %s; re-seeding the demo voyage",
            _EXPECTED_RECONCILIATION,
        )
        return False
    actual = {
        "owner": (frontend.get("owner_calculation") or {}).get("total_usd"),
        "charterer": (frontend.get("charterer_calculation") or {}).get("total_usd"),
        "reconciled": frontend.get("reconciled_total_usd"),
    }
    if not all(
        actual[key] is not None and float(actual[key]) == expected[key] for key in expected
    ):
        return False
    return _demo_citations_named(frontend) and _demo_contract_current(frontend)


def _demo_contract_current(frontend: dict) -> bool:
    """True when the stored row still carries the fields this build emits.

    A totals-only comparison keeps serving a row written by an older build
    indefinitely: renaming the weather rule id, adding `measurement_basis`, or
    adding a clause citation to the trace leaves the three totals untouched, so
    the demo would keep publishing a contract the current code no longer emits.
    """
    verdicts = frontend.get("day_verdicts") or []
    if not verdicts:
        return False
    for verdict in verdicts:
        clause_id = (verdict.get("bimco_clause") or {}).get("clause_id")
        if clause_id != _WEATHER_RULE_ID:
            return False
        if not verdict.get("measurement_basis"):
            return False
    for party in ("owner_calculation", "charterer_calculation"):
        for entry in (frontend.get(party) or {}).get("audit_trace") or []:
            if "clause_citation" not in entry:
                return False
    return True


_DOCUMENT_REF = re.compile(r"[\w][\w.\-]*\.(?:pdf|json)\b", re.IGNORECASE)
_DOCUMENT_PATH_REF = re.compile(r"[\w./\\-]*[\w][\w.\-]*\.(?:pdf|json)\b", re.IGNORECASE)
_ERROR_SUBJECT_BY_MODEL = {"CharterpartyTerms": "charterparty.pdf"}
_MAX_ERROR_DETAIL = 160
# Both document patterns nest unbounded quantifiers, so a long message makes
# them backtrack quadratically. Nothing past this point can reach the summary
# anyway, which is capped at _MAX_ERROR_DETAIL.
_MAX_ERROR_SCAN = 2 * _MAX_ERROR_DETAIL

# ─── Upload admission ─────────────────────────────────────────────────────────
# A voyage is five PDFs and one weather record, so every ceiling below is an
# order of magnitude above a real upload. A request that exceeds one of them is
# refused at the edge rather than written to disk and parsed.

_MAX_FILE_BYTES = _env_int("KEEL_MAX_UPLOAD_BYTES", 25 * 1024 * 1024)
_MAX_REQUEST_BYTES = _env_int("KEEL_MAX_REQUEST_BYTES", 60 * 1024 * 1024)
_MAX_FILES = _env_int("KEEL_MAX_FILES", 12)
_STREAM_CHUNK = 1 << 20
_MAX_FILENAME_CHARS = 255
_PDF_MAGIC = b"%PDF-"
_MAGIC_SCAN_BYTES = 1024
_ALLOWED_CONTENT_TYPES = {"application/pdf", "application/json"}
_ALLOWED_SUFFIXES = {".pdf", ".json"}
_WEATHER_DOCUMENT = "weather_port_xyz.json"
_MAX_WEATHER_OBSERVATIONS = 20_000
# A pipeline run occupies a worker for as long as the extraction takes, so an
# unbounded number of concurrent runs starves every other route: the reads
# behind them stop answering long before any of the runs finish.
_MAX_CONCURRENT_RUNS = _env_int("KEEL_MAX_CONCURRENT_RUNS", 4)
_inflight_runs = 0
_inflight_lock = threading.Lock()

# The pipeline reads these as its own trusted output, so a client that plants
# them chooses the reconciled dollars and the LLM is never consulted:
# `pipeline_agents._all_extracts_cached` accepts the five `extracted_*.json`
# files, and the two below sit in the fixture directory beside them. The
# uploaded weather record is the one JSON a client may supply, under the exact
# name the provider reads, and it is validated against the observation schema.
_SERVER_OWNED_JSON = frozenset({"_cached_extracts.json", "expected_reconciliation.json"})
_CACHE_JSON_PREFIX = "extracted_"


class _UploadRefused(Exception):
    def __init__(self, status_code: int, detail: str) -> None:
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail


def _safe_destination(fixture_dir: Path, raw_name: str | None) -> Path:
    """The single path a multipart filename may name, or a refusal.

    `upload.filename` is the raw multipart parameter, so joining it to the
    upload directory is arbitrary file write: an absolute name replaces the
    base and `../` walks out of it. The name is therefore reduced to its final
    component first, and everything that survives that reduction is still
    refused — an empty or dot-only name, a control character, an over-long
    name, and any suffix other than the two the pipeline reads.
    """
    name = Path(raw_name or "").name
    if not name or name in {".", ".."}:
        raise _UploadRefused(400, "invalid filename: each document needs a file name")
    if len(name) > _MAX_FILENAME_CHARS or len(name.encode("utf-8", "surrogatepass")) > _MAX_FILENAME_CHARS:
        raise _UploadRefused(
            400, f"invalid filename: at most {_MAX_FILENAME_CHARS} characters"
        )
    if any(ord(char) < 32 or ord(char) == 127 for char in name):
        raise _UploadRefused(400, "invalid filename: control characters are not accepted")
    if Path(name).suffix.lower() not in _ALLOWED_SUFFIXES:
        raise _UploadRefused(400, f"invalid filename: {name!r} is not a .pdf or .json document")
    dest = fixture_dir / name
    if not dest.resolve().is_relative_to(fixture_dir.resolve()):
        raise _UploadRefused(
            400, "invalid filename: the document must be written inside the upload directory"
        )
    return dest


def _refuse_server_owned_name(name: str) -> None:
    if name in _SERVER_OWNED_JSON or name.startswith(_CACHE_JSON_PREFIX):
        raise _UploadRefused(
            400,
            f"{name!r} is the server's own extraction cache, not a client document; "
            "upload the source PDF instead",
        )
    if name.endswith(".json") and name != _WEATHER_DOCUMENT:
        raise _UploadRefused(
            400,
            f"invalid filename: the only JSON document a client supplies is "
            f"{_WEATHER_DOCUMENT}, not {name!r}",
        )


async def _write_upload(upload: UploadFile, dest: Path, budget: list[int]) -> int:
    """Stream one upload to disk, refusing the moment it passes a ceiling."""
    written = 0
    with dest.open("wb") as out:
        while True:
            chunk = await upload.read(_STREAM_CHUNK)
            if not chunk:
                break
            written += len(chunk)
            budget[0] -= len(chunk)
            if written > _MAX_FILE_BYTES:
                raise _UploadRefused(
                    413,
                    f"{dest.name} exceeds the {_MAX_FILE_BYTES}-byte per-document limit",
                )
            if budget[0] < 0:
                raise _UploadRefused(
                    413,
                    f"upload exceeds the {_MAX_REQUEST_BYTES}-byte per-request limit",
                )
            out.write(chunk)
    return written


def _validate_upload(upload: UploadFile, dest: Path, size: int) -> None:
    """Refuse anything that is not the document its name and type claim."""
    declared = (upload.content_type or "").split(";")[0].strip().lower()
    if declared not in _ALLOWED_CONTENT_TYPES:
        raise _UploadRefused(
            400,
            f"unsupported content type for {dest.name}: declare "
            f"{' or '.join(sorted(_ALLOWED_CONTENT_TYPES))}",
        )
    if size == 0:
        raise _UploadRefused(400, f"{dest.name} is empty")

    with dest.open("rb") as handle:
        head = handle.read(_MAGIC_SCAN_BYTES)

    if dest.suffix.lower() == ".pdf":
        if _PDF_MAGIC not in head:
            raise _UploadRefused(400, f"{dest.name} is not a PDF (no %PDF- header)")
        return

    try:
        payload = json.loads(dest.read_text())
    except (UnicodeDecodeError, ValueError) as exc:
        raise _UploadRefused(400, f"{dest.name} is not valid JSON") from exc
    if not isinstance(payload, dict):
        raise _UploadRefused(400, f"{dest.name} must be a JSON object")
    if dest.name != _WEATHER_DOCUMENT:
        return

    observations = payload.get("observations")
    if not isinstance(observations, list) or not observations:
        raise _UploadRefused(400, f"{dest.name} must hold a non-empty observations array")
    if len(observations) > _MAX_WEATHER_OBSERVATIONS:
        raise _UploadRefused(
            400, f"{dest.name} holds more than {_MAX_WEATHER_OBSERVATIONS} observations"
        )
    try:
        for observation in observations:
            WeatherObservation.model_validate(observation)
    except ValidationError as exc:
        raise _UploadRefused(
            400, f"{dest.name} has {exc.error_count()} unreadable weather observation(s)"
        ) from exc


def _exception_chain(exc: BaseException) -> list[BaseException]:
    chain: list[BaseException] = []
    pending: list[BaseException | None] = [exc]
    while pending:
        current = pending.pop(0)
        if current is None or any(current is seen for seen in chain):
            continue
        chain.append(current)
        pending.extend((current.__cause__, current.__context__))
    return chain


def _error_subject(chain: list[BaseException], suspects: list[str]) -> str:
    """The document(s) a failure points at, for the user-facing summary.

    `suspects` is empty when the run was fed an upload, which is what disables
    the hard-coded subject map and the document-name harvest below: neither may
    name a file the caller never sent, so a user who uploaded `bad_cp.json` is
    not told about `charterparty.pdf` and is not shown the app's own fixture
    names.
    """
    if suspects:
        allowed = set(suspects)
        documents: list[str] = []
        for linked in chain:
            for text in (getattr(linked, "filename", None) or "", str(linked)):
                for match in _DOCUMENT_REF.findall(text[:_MAX_ERROR_SCAN]):
                    name = Path(match).name
                    if name in allowed and name not in documents:
                        documents.append(name)
        if documents:
            return ", ".join(documents)
        return ", ".join(suspects)
    for linked in chain:
        title = getattr(linked, "title", None)
        if isinstance(title, str) and title in _ERROR_SUBJECT_BY_MODEL:
            return _ERROR_SUBJECT_BY_MODEL[title]
    for linked in chain:
        for text in (getattr(linked, "filename", None) or "", str(linked)):
            names = [
                Path(match).name
                for match in _DOCUMENT_REF.findall(text[:_MAX_ERROR_SCAN])
            ]
            if names:
                return ", ".join(names)
    return "the uploaded documents"


def _error_detail(chain: list[BaseException], allowed: frozenset[str] | None = None) -> str:
    for linked in chain:
        if isinstance(linked, ValidationError):
            return f"{linked.error_count()} invalid field(s) in {linked.title}"
        first_line = str(linked).strip().splitlines()[:1]
        if first_line and first_line[0].strip():
            # Keep the file name but drop the server-side directory it lives in:
            # uploads land in a temp path, which is noise in a dialog.
            detail = first_line[0].strip()[:_MAX_ERROR_SCAN]
            detail = _DOCUMENT_PATH_REF.sub(
                lambda m: Path(m.group(0)).name, detail
            )
            if allowed is not None:
                # A provider or a parser can name one of the app's own fixture
                # files in its message; naming it would tell the uploader about
                # a document they never sent.
                detail = _DOCUMENT_REF.sub(
                    lambda m: m.group(0) if m.group(0) in allowed else "the document",
                    detail,
                )
            return detail
    return type(chain[0]).__name__


def _uploaded_documents(fixture_dir: Path) -> list[str]:
    try:
        return sorted(
            path.name
            for path in fixture_dir.iterdir()
            if path.suffix.lower() in {".pdf", ".json"}
        )
    except OSError:
        return []


def _summarize_error(exc: BaseException, fixture_dir: Path | None = None) -> str:
    """One short line naming the document at fault.

    The full exception (including Pydantic's multi-kilobyte validation dump)
    stays in the server log, never in the dashboard dialog.
    """
    chain = _exception_chain(exc)
    suspects = _uploaded_documents(fixture_dir) if fixture_dir is not None else []
    # Non-empty suspects mean the run was fed an upload, and every document name
    # the failure mentions is then held to that request's own file list.
    allowed = frozenset(suspects) if suspects else None
    detail = _error_detail(chain, allowed)
    if len(detail) > _MAX_ERROR_DETAIL:
        detail = detail[: _MAX_ERROR_DETAIL - 1].rstrip() + "…"
    return f"Could not process {_error_subject(chain, suspects)}: {detail}"



def _pdf_urls(voyage_id: str) -> dict[str, str]:
    """Citation-viewer paths, one per source document name.

    The API publishes no document bytes: the fixture tree is not served and an
    upload's working directory is deleted when its run ends, so these paths are
    the keys the frontend groups citations by and nothing more. A client that
    needs the preview must be given the bytes by an authenticated route.
    """
    return {
        _OWNER_SOF_DOCUMENT: f"/static/{voyage_id}/{_OWNER_SOF_DOCUMENT}",
        _CHARTERER_SOF_DOCUMENT: f"/static/{voyage_id}/{_CHARTERER_SOF_DOCUMENT}",
        "charterparty.pdf": f"/static/{voyage_id}/charterparty.pdf",
    }


def _run_pipeline_task(voyage_id: str, fixture_dir: Path) -> None:
    """Background task: run pipeline, update status, persist result."""
    global _inflight_runs
    try:
        def on_progress(msg: str) -> None:
            set_status(voyage_id, "processing", msg)

        validation_errors: list = []

        def on_validation_errors(issues: list) -> None:
            validation_errors[:] = issues

        set_status(voyage_id, "processing", "Starting pipeline…")
        reconciliation, terms, owner_result, charterer_result = run_voyage_pipeline(
            fixture_dir,
            on_progress=on_progress,
            voyage_id=voyage_id,
            on_validation_errors=on_validation_errors,
        )

        owner_name = _load_owner_name(fixture_dir)
        frontend_data = reconciliation_to_frontend(
            reconciliation,
            terms,
            owner_result,
            charterer_result,
            owner_document=_OWNER_SOF_DOCUMENT,
            charterer_document=_CHARTERER_SOF_DOCUMENT,
        )
        save_voyage(
            reconciliation.voyage_id,
            {
                "reconciliation": reconciliation.model_dump(mode="json"),
                "frontend": frontend_data,
                "pdf_urls": _pdf_urls(reconciliation.voyage_id),
                "owner_name": owner_name,
                "status": "In Review",  # Require user approval before marking "Reconciled"
                "validation_errors": validation_errors,
            },
            owner_name=owner_name,
        )
        if validation_errors:
            set_status(
                voyage_id,
                "ready",
                f"Reconciled with {len(validation_errors)} validation "
                f"warning(s): ${reconciliation.reconciled_total_usd:,.0f}",
            )
        else:
            set_status(voyage_id, "ready", f"Reconciled: ${reconciliation.reconciled_total_usd:,.0f}")
    except Exception as exc:
        logger.exception("Pipeline failed for voyage %s (%s)", voyage_id, fixture_dir)
        summary = _summarize_error(exc, fixture_dir)
        set_status(voyage_id, "error", summary)
        # Keep whatever the row already holds; the stub only records the failure
        # so the dashboard doesn't show "Processing" forever.
        patch_voyage(voyage_id, {"status": "Error", "error": summary})
    finally:
        # The uploaded documents are the counterparty's own and the letter's
        # footer calls them "exchanged with a counterparty", so the working
        # directory outliving the run would be an unbounded store of them.
        shutil.rmtree(fixture_dir, ignore_errors=True)
        _release_run_slot()


def _seed_demo_voyage() -> None:
    """Populate the canonical demo voyage so read endpoints stay side-effect free."""
    if _demo_matches_expected(load_voyage(_DEMO_VOYAGE_ID)):
        return
    reconciliation, terms, owner_result, charterer_result = run_voyage_pipeline(
        _FIXTURE_DIR, voyage_id=_DEMO_VOYAGE_ID
    )
    owner_name = _load_owner_name(_FIXTURE_DIR)
    save_voyage(
        _DEMO_VOYAGE_ID,
        {
            "reconciliation": reconciliation.model_dump(mode="json"),
            "frontend": reconciliation_to_frontend(
                reconciliation,
                terms,
                owner_result,
                charterer_result,
                owner_document=_OWNER_SOF_DOCUMENT,
                charterer_document=_CHARTERER_SOF_DOCUMENT,
            ),
            "pdf_urls": _pdf_urls(_DEMO_VOYAGE_ID),
            "owner_name": owner_name,
        },
        owner_name=owner_name,
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Best effort: the demo must never be the reason the API refuses to boot.
    try:
        _seed_demo_voyage()
    except Exception:
        logger.exception("Could not seed the demo voyage %s", _DEMO_VOYAGE_ID)
    yield


_TOKEN_EXEMPT_PATHS = frozenset({"/healthz"})
_DEFAULT_CORS_ORIGINS = ["http://localhost:3000"]


def _shared_token() -> str:
    return os.environ.get("KEEL_API_TOKEN", "").strip()


def _presented_token(authorization: str | None, x_keel_token: str | None) -> str:
    if authorization and authorization.lower().startswith("bearer "):
        return authorization[7:].strip()
    if authorization:
        return authorization.strip()
    return (x_keel_token or "").strip()


class AdmissionGuard(BaseHTTPMiddleware):
    """Refuse oversized bodies and, when configured, unauthenticated callers.

    Off by default: `KEEL_API_TOKEN` unset keeps the demo and the e2e suite
    working exactly as before, and setting it makes every route except the
    liveness probe require the shared token.
    """

    async def dispatch(self, request: Request, call_next):
        declared = request.headers.get("content-length")
        if declared and declared.isdigit() and int(declared) > _MAX_REQUEST_BYTES:
            return JSONResponse(
                status_code=413,
                content={
                    "detail": (
                        f"request body exceeds the {_MAX_REQUEST_BYTES}-byte limit"
                    )
                },
            )

        expected = _shared_token()
        if expected and request.url.path not in _TOKEN_EXEMPT_PATHS:
            presented = _presented_token(
                request.headers.get("authorization"), request.headers.get("x-keel-token")
            )
            if not presented or not hmac.compare_digest(presented, expected):
                return JSONResponse(
                    status_code=401,
                    content={"detail": "a valid API token is required for this route"},
                    headers={"WWW-Authenticate": "Bearer"},
                )

        return await call_next(request)


app = FastAPI(title="Keel API", version="0.1.0", lifespan=lifespan)

app.add_middleware(AdmissionGuard)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_env_list("KEEL_CORS_ORIGINS", _DEFAULT_CORS_ORIGINS),
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Content-Type", "Authorization", "X-Keel-Token"],
    allow_credentials=False,
)


_RECONCILED_STATUSES = ("Reconciled", "In Review", "Closed")


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/voyages")
def get_voyages() -> list[dict]:
    return list_voyages()


def _require_voyage(voyage_id: str) -> dict:
    data = load_voyage(voyage_id)
    if data is None:
        raise HTTPException(status_code=404, detail=f"Voyage {voyage_id!r} not found")
    return data


def _require_reconciliation(voyage_id: str, data: dict) -> dict:
    """The `frontend` payload the read endpoints serve, or a deliberate refusal.

    A row saved before the pipeline finished, or after it failed, has no
    `frontend` key. Reading it used to raise an uncaught KeyError, so every
    failed upload permanently 500'd its own detail and letter endpoints.
    409 says "this exists, but not in the state you asked for", which keeps it
    distinct from the 404 above and from a still-running pipeline.
    """
    frontend = data.get("frontend")
    if frontend:
        return frontend
    error = data.get("error")
    if not error:
        live_status = get_status(voyage_id) or {}
        if live_status.get("status") == "error":
            error = live_status.get("message")
    if error:
        detail = f"Voyage {voyage_id!r} has no reconciliation: {error}"
    else:
        detail = (
            f"Voyage {voyage_id!r} has no reconciliation yet "
            f"(status: {data.get('status', 'unknown')})"
        )
    raise HTTPException(status_code=409, detail=detail)


@app.get("/voyages/{voyage_id}")
def get_voyage(voyage_id: str) -> dict:
    data = _require_voyage(voyage_id)
    return {
        "reconciliation": _require_reconciliation(voyage_id, data),
        "pdf_urls": data.get("pdf_urls", {}),
    }


@app.get("/voyages/{voyage_id}/status")
def get_voyage_status(voyage_id: str) -> dict:
    status = get_status(voyage_id)
    if status:
        return status
    # The in-memory status is lost on restart, so fall back to what the stored
    # row proves: a row with no reconciliation is not "ready", whatever it says.
    data = load_voyage(voyage_id)
    if data is not None:
        error = data.get("error")
        if error:
            return {"status": "error", "message": error}
        if not data.get("frontend"):
            return {
                "status": "processing",
                "message": f"Reconciliation in progress (status: {data.get('status', 'unknown')}).",
            }
        return {"status": "ready", "message": "Reconciliation complete."}
    raise HTTPException(status_code=404, detail=f"Voyage {voyage_id!r} not found")


@app.patch("/voyages/{voyage_id}/status")
def update_voyage_status(voyage_id: str, request: StatusUpdateRequest) -> dict:
    """Manually override the human-readable status of a voyage."""
    new_status = request.status
    allowed = {"Reconciled", "In Review", "Pending", "Closed"}
    if new_status not in allowed:
        raise HTTPException(status_code=422, detail=f"status must be one of {sorted(allowed)}")
    if not patch_voyage(voyage_id, {"status": new_status}):
        raise HTTPException(status_code=404, detail=f"Voyage {voyage_id!r} not found")
    return {"voyage_id": voyage_id, "status": new_status}


def _refuse_demo_deletion(voyage_id: str, noun: str) -> None:
    """The demo voyage is re-created only at startup, so deleting it bricks the demo."""
    if voyage_id == _DEMO_VOYAGE_ID:
        raise HTTPException(
            status_code=409,
            detail=(
                f"{noun} {voyage_id!r} is the seeded demo voyage and cannot be deleted. "
                "It is re-seeded on every API start so the dashboard demo keeps working."
            ),
        )


@app.delete("/voyages/{voyage_id}")
def delete_voyage_endpoint(voyage_id: str) -> dict:
    """Delete a voyage and its associated data."""
    _refuse_demo_deletion(voyage_id, "Voyage")
    if not delete_voyage(voyage_id):
        raise HTTPException(status_code=404, detail=f"Voyage {voyage_id!r} not found")
    return {"voyage_id": voyage_id, "status": "deleted"}


@app.get("/reconciliations")
def get_reconciliations(
    page: int = Query(1, ge=1, le=100_000),
    per_page: int = Query(10, ge=1, le=200),
) -> dict:
    start = (page - 1) * per_page
    reconciled = list_voyages(
        limit=per_page,
        offset=start,
        statuses=_RECONCILED_STATUSES,
    )
    total = count_voyages(statuses=_RECONCILED_STATUSES)
    return {
        "items": reconciled,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": max(1, -(-total // per_page)),
    }


@app.delete("/reconciliations/{voyage_id}")
def delete_reconciliation_endpoint(voyage_id: str) -> dict:
    """Delete a reconciliation (same as deleting the voyage)."""
    _refuse_demo_deletion(voyage_id, "Reconciliation")
    if not delete_voyage(voyage_id):
        raise HTTPException(status_code=404, detail=f"Reconciliation {voyage_id!r} not found")
    return {"voyage_id": voyage_id, "status": "deleted"}


_LETTER_HEADERS = {
    "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
}


@app.get("/voyages/{voyage_id}/letter", response_class=HTMLResponse)
def get_letter(voyage_id: str, fmt: str = Query("html", alias="format")) -> HTMLResponse:
    """Render the settlement letter. HTML only — no PDF is produced by the API."""
    if fmt.strip().lower() != "html":
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unsupported letter format {fmt!r}: this endpoint serves HTML only and "
                "will not label HTML as a PDF. Use the browser's Print -> Save as PDF."
            ),
        )
    data = _require_voyage(voyage_id)
    return HTMLResponse(
        content=render_letter(_require_reconciliation(voyage_id, data)),
        headers=_LETTER_HEADERS,
    )


async def upload_documents(fixture_dir: Path, files: list[UploadFile]) -> int:
    """Write every accepted upload, refusing the request at the first fault.

    Every name and every part count is checked *before* anything is opened for
    writing, so a hostile filename never becomes a path, a body that is over the
    ceiling never becomes a file, and the whole request is refused on its first
    fault instead of leaving a half-populated directory behind.
    """
    accepted: list[tuple[UploadFile, Path]] = []
    seen: set[str] = set()
    for upload in files:
        dest = _safe_destination(fixture_dir, upload.filename)
        if dest.name in seen:
            raise _UploadRefused(400, f"duplicate filename: {dest.name!r} appears twice")
        seen.add(dest.name)
        _refuse_server_owned_name(dest.name)
        accepted.append((upload, dest))

    budget = [_MAX_REQUEST_BYTES]
    pdfs = 0
    for upload, dest in accepted:
        written = await _write_upload(upload, dest, budget)
        _validate_upload(upload, dest, written)
        pdfs += dest.suffix.lower() == ".pdf"
    if not pdfs:
        raise _UploadRefused(400, "no PDF was received, so there is nothing to reconcile")
    return len(accepted)


def _reserve_run_slot() -> bool:
    global _inflight_runs
    with _inflight_lock:
        if _inflight_runs >= _MAX_CONCURRENT_RUNS:
            return False
        _inflight_runs += 1
        return True


def _release_run_slot() -> None:
    global _inflight_runs
    with _inflight_lock:
        _inflight_runs = max(0, _inflight_runs - 1)


@app.post("/voyages")
async def upload_voyage(
    background_tasks: BackgroundTasks, files: list[UploadFile] | None = None
) -> dict:
    """Accept the uploaded voyage documents, then run the pipeline in the background.

    There is no implicit demo mode: a request that carries no document this
    pipeline can read is an error, never a reconciliation of the seeded
    fixture that nobody uploaded.
    """
    if not files:
        raise HTTPException(
            status_code=400,
            detail=(
                "no documents received: send the voyage PDFs and the weather record "
                "as multipart form parts named 'files'"
            ),
        )
    if len(files) > _MAX_FILES:
        raise HTTPException(
            status_code=413,
            detail=f"{len(files)} parts received; at most {_MAX_FILES} documents per request",
        )
    if not _reserve_run_slot():
        raise HTTPException(
            status_code=429,
            detail=(
                f"{_MAX_CONCURRENT_RUNS} analyses are already running; "
                "retry once one of them reports a status"
            ),
        )

    fixture_dir = Path(tempfile.mkdtemp(prefix="keel-upload-"))
    try:
        await upload_documents(fixture_dir, files)
    except _UploadRefused as refused:
        shutil.rmtree(fixture_dir, ignore_errors=True)
        _release_run_slot()
        raise HTTPException(status_code=refused.status_code, detail=refused.detail) from None
    except BaseException:
        shutil.rmtree(fixture_dir, ignore_errors=True)
        _release_run_slot()
        raise

    # Every upload gets its own id so concurrent runs never overwrite each other.
    voyage_id = f"voyage_{uuid.uuid4().hex[:8]}"

    # Persist a "Processing" stub immediately so the voyage appears in the
    # dashboard table before the pipeline finishes (avoids the jarring jump
    # from "absent" straight to "Reconciled").
    save_voyage(voyage_id, {"status": "Processing"})

    background_tasks.add_task(_run_pipeline_task, voyage_id, fixture_dir)
    return {"voyage_id": voyage_id, "status": "processing"}
