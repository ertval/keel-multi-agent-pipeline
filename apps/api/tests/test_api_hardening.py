"""Adversarial tests for the upload edge, the listing edge and the letter.

Each test here corresponds to a live probe that used to succeed against the
API: a filename that escaped the upload directory, an unbounded body, a
planted extraction cache, a request with no documents at all, and a
`per_page=0` that divided by zero.
"""

from __future__ import annotations

import json
import os
import shutil
import threading
from pathlib import Path

import fitz
import pytest
from fastapi.testclient import TestClient

from keel_api import main, store
from keel_api.store import load_voyage, patch_voyage, save_voyage

client = TestClient(app=main.app)

_REAL_PIPELINE_TASK = main._run_pipeline_task


@pytest.fixture(autouse=True)
def recorded_pipeline(monkeypatch):
    """Keep the admission logic under test and out of the pipeline.

    TestClient runs background tasks inline, so without this every accepted
    upload would parse a synthetic PDF and attempt a live extraction. The real
    task is the one that deletes the upload directory, so this one does it too.
    """
    calls: list[tuple[str, Path]] = []
    monkeypatch.setattr(
        main, "_run_pipeline_task", lambda voyage_id, fixture_dir: calls.append((voyage_id, fixture_dir))
    )
    monkeypatch.setattr(main, "_inflight_runs", 0)
    yield calls
    for _, fixture_dir in calls:
        shutil.rmtree(fixture_dir, ignore_errors=True)


def _pdf_bytes(lines: tuple[str, ...] = ("NOR Tendered 2026-06-10 08:00 Piraeus",)) -> bytes:
    doc = fitz.open()
    page = doc.new_page(width=612, height=792)
    for offset, line in enumerate(lines):
        page.insert_text((72, 100 + offset * 14), line, fontsize=11)
    raw = doc.tobytes()
    doc.close()
    return raw


def _part(name: str, payload: bytes, content_type: str = "application/pdf") -> tuple:
    return ("files", (name, payload, content_type))


def _weather_bytes(observations: int = 1) -> bytes:
    return json.dumps(
        {
            "observations": [
                {
                    "timestamp": f"2026-06-14T{hour:02d}:00:00+00:00",
                    "wind_force_beaufort": 3,
                    "wind_speed_knots": 8.0,
                    "precipitation_mm_per_hour": 0.0,
                    "operations_prevented": False,
                    "citation": {
                        "source": "port://piraeus",
                        "observation_id": f"PIR-{hour:04d}",
                    },
                }
                for hour in range(observations)
            ]
        }
    ).encode()


def _post(parts, field="files", **kwargs):
    """POST /voyages with each `(filename, payload, content_type)` under `field`."""
    return client.post(
        "/voyages", files=[(field, (name, payload, ct)) for name, payload, ct in parts], **kwargs
    )


# ─── F1/F6: hostile filenames never name a path outside the upload directory ──


def _escape_name(canary: Path, levels: int) -> str:
    """A filename that reaches `canary` from the upload directory, if joined."""
    return "../" * levels + str(canary.relative_to(canary.anchor))


@pytest.mark.parametrize("marker,levels", [("PWNED_ABS", 0), ("PWNED_PARENT", 2), ("PWNED_REL", 6)])
def test_traversal_filename_is_contained_and_writes_nothing_outside(
    tmp_path, marker, levels, recorded_pipeline
):
    """A multipart filename is a *name*, never a path.

    Each of the three shapes resolves to the same controlled canary directory:
    an absolute name, a short `../` walk, and a deep one. The reduced name must
    land inside the run's own upload directory instead.
    """
    canary_dir = tmp_path / "outside"
    canary_dir.mkdir()
    escaped = canary_dir / f"{marker}.pdf"
    filename = _escape_name(escaped, levels) if levels else str(escaped)

    response = _post([(filename, _pdf_bytes(), "application/pdf")])

    assert response.status_code in (200, 400, 413), response.text
    assert not escaped.exists(), f"{filename!r} escaped to {escaped}"
    for _, fixture_dir in recorded_pipeline:
        assert (fixture_dir / f"{marker}.pdf").exists()
        assert not (fixture_dir.parent / f"{marker}.pdf").exists()


@pytest.mark.parametrize("filename", [".", "..", "./", "../"])
def test_dot_only_filename_is_refused(filename):
    response = _post([(filename, _pdf_bytes(), "application/pdf")])

    assert response.status_code == 400
    assert response.json()["detail"] == "invalid filename: each document needs a file name"


def test_over_long_filename_is_refused():
    response = _post([("x" * 3000 + ".pdf", _pdf_bytes(), "application/pdf")])

    assert response.status_code == 400
    assert "filename" in response.json()["detail"]


def _raw_upload(filename: str, content_type: str = "application/pdf"):
    """POST one part with a hand-built `Content-Disposition` header.

    httpx percent-encodes a control character in a filename, so the raw body is
    the only way to put one in front of the parser.
    """
    boundary = "keelboundary"
    payload = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="files"; filename="{filename}"\r\n'
        f"Content-Type: {content_type}\r\n\r\n"
    ).encode() + _pdf_bytes() + f"\r\n--{boundary}--\r\n".encode()
    return client.post(
        "/voyages",
        content=payload,
        headers={"content-type": f"multipart/form-data; boundary={boundary}"},
    )


def test_control_character_filename_is_refused():
    response = _raw_upload("x\x01y.pdf")

    assert response.status_code == 400
    assert "control characters" in response.json()["detail"]


def test_empty_filename_does_not_reach_the_filesystem():
    response = _raw_upload("")

    assert response.status_code in (400, 422)
    assert response.status_code < 500


def test_non_document_suffix_is_refused():
    response = _post([("payload.html", b"<html></html>", "application/pdf")])

    assert response.status_code == 400
    assert "invalid filename" in response.json()["detail"]


# ─── F4: ceilings on the body, the part count and the file's own bytes ───────


def test_per_document_byte_cap_is_enforced(monkeypatch):
    monkeypatch.setattr(main, "_MAX_FILE_BYTES", 4096)
    monkeypatch.setattr(main, "_MAX_REQUEST_BYTES", 1 << 30)

    response = _post([("charterparty.pdf", b"%PDF-1.7\n" + b"0" * 8192, "application/pdf")])

    assert response.status_code == 413
    assert "per-document limit" in response.json()["detail"]


def test_per_request_byte_cap_is_enforced_even_when_each_file_fits(monkeypatch):
    """A chunked body carries no Content-Length, so the streaming budget is the
    only thing between the client and an unbounded write."""
    monkeypatch.setattr(main, "_MAX_FILE_BYTES", 1 << 30)
    monkeypatch.setattr(main, "_MAX_REQUEST_BYTES", 8192)
    boundary = "keelboundary"

    def body():
        yield (
            f"--{boundary}\r\n"
            'Content-Disposition: form-data; name="files"; filename="charterparty.pdf"\r\n'
            "Content-Type: application/pdf\r\n\r\n"
        ).encode()
        yield b"%PDF-1.7\n" + b"0" * 4096
        yield f"\r\n--{boundary}\r\n".encode()
        yield (
            f'Content-Disposition: form-data; name="files"; filename="sof_owner.pdf"\r\n'
            "Content-Type: application/pdf\r\n\r\n"
        ).encode()
        yield b"%PDF-1.7\n" + b"0" * 4096
        yield f"\r\n--{boundary}--\r\n".encode()

    response = client.post(
        "/voyages",
        content=body(),
        headers={"content-type": f"multipart/form-data; boundary={boundary}"},
    )

    assert response.status_code == 413
    assert "per-request limit" in response.json()["detail"]


def test_declared_content_length_over_the_cap_is_refused(monkeypatch):
    monkeypatch.setattr(main, "_MAX_REQUEST_BYTES", 1024)

    response = _post([("charterparty.pdf", _pdf_bytes(), "application/pdf")])
    assert response.status_code == 413

    oversized = client.post(
        "/voyages",
        files=[("files", ("charterparty.pdf", _pdf_bytes(), "application/pdf"))],
        headers={"content-length": str(1 << 30)},
    )
    assert oversized.status_code == 413
    assert "request body" in oversized.json()["detail"]


def test_file_count_cap_is_enforced(monkeypatch):
    monkeypatch.setattr(main, "_MAX_FILES", 2)

    response = _post(
        [
            ("charterparty.pdf", _pdf_bytes(), "application/pdf"),
            ("sof_owner.pdf", _pdf_bytes(), "application/pdf"),
            ("sof_charterer.pdf", _pdf_bytes(), "application/pdf"),
        ]
    )

    assert response.status_code == 413
    assert "at most 2 documents" in response.json()["detail"]


def test_default_file_count_cap_is_below_the_auditors_two_hundred_files():
    assert main._MAX_FILES < 200
    assert main._MAX_FILE_BYTES < 200 * 1024 * 1024
    assert main._MAX_REQUEST_BYTES < 200 * 1024 * 1024


# ─── F4: a document must be the document it claims to be ────────────────────


def test_zero_byte_upload_is_refused():
    response = _post([("charterparty.pdf", b"", "application/pdf")])

    assert response.status_code == 400
    assert "empty" in response.json()["detail"]


def test_random_bytes_named_pdf_is_refused():
    response = _post([("charterparty.pdf", os.urandom(512), "application/pdf")])

    assert response.status_code == 400
    assert "%PDF-" in response.json()["detail"]


def test_upload_without_a_content_type_is_refused():
    response = _post([("charterparty.pdf", _pdf_bytes(), "")])

    assert response.status_code == 400
    assert "content type" in response.json()["detail"]


def test_json_that_is_not_json_is_refused():
    response = _post(
        [("weather_port_xyz.json", b"not json at all", "application/json")]
    )

    assert response.status_code == 400
    assert "not valid JSON" in response.json()["detail"]


def test_weather_record_without_observations_is_refused():
    response = _post([("weather_port_xyz.json", b'{"records": []}', "application/json")])

    assert response.status_code == 400
    assert "observations" in response.json()["detail"]


def test_duplicate_filename_is_refused():
    response = _post(
        [
            ("charterparty.pdf", _pdf_bytes(), "application/pdf"),
            ("charterparty.pdf", _pdf_bytes(), "application/pdf"),
        ]
    )

    assert response.status_code == 400
    assert "duplicate" in response.json()["detail"]


# ─── F3/F8: the server's own cache and golden files are not client input ────


@pytest.mark.parametrize(
    "name",
    [
        "extracted_charterparty.json",
        "extracted_sof_owner.json",
        "extracted_sof_charterer.json",
        "extracted_owner_claim_amount.json",
        "extracted_charterer_claim_amount.json",
        "_cached_extracts.json",
        "expected_reconciliation.json",
    ],
)
def test_server_owned_json_is_refused(name):
    response = _post([(name, json.dumps({"owner_total_usd": 1_120_000_000}).encode(), "application/json")])

    assert response.status_code == 400
    assert "server" in response.json()["detail"]


def test_the_five_planted_cache_files_alone_cannot_reconcile():
    """The auditor's money-path probe: five JSONs, no PDFs, $1.12bn."""
    parts = [
        ("extracted_charterparty.json", json.dumps({"vessel": "MV Pwned"}).encode(), "application/json"),
        ("extracted_sof_owner.json", b"[]", "application/json"),
        ("extracted_sof_charterer.json", b"[]", "application/json"),
        ("extracted_owner_claim_amount.json", b"1120000000", "application/json"),
        ("extracted_charterer_claim_amount.json", b"1120000000", "application/json"),
    ]

    response = _post(parts)

    assert response.status_code == 400
    assert "extracted_charterparty.json" in response.json()["detail"]


@pytest.mark.parametrize(
    "name",
    ["weather_port_evil.json", "weather_port_999.json", "Weather_Port_xyz.json"],
)
def test_json_other_than_the_expected_weather_record_is_refused(name):
    response = _post([(name, b'{"observations": []}', "application/json")])

    assert response.status_code == 400
    assert "invalid filename" in response.json()["detail"]


def test_fixture_tree_is_no_longer_published_over_http():
    assert client.get("/static/voyage_001/expected_reconciliation.json").status_code == 404
    assert client.get("/static/voyage_001/_cached_extracts.json").status_code == 404
    assert client.get("/static/voyage_001/extracted_charterparty.json").status_code == 404


def test_upload_is_refused_while_every_run_slot_is_taken(monkeypatch):
    monkeypatch.setattr(main, "_MAX_CONCURRENT_RUNS", 1)
    monkeypatch.setattr(main, "_inflight_runs", 1)

    response = _post([("charterparty.pdf", _pdf_bytes(), "application/pdf")])

    assert response.status_code == 429
    assert "already running" in response.json()["detail"]


def test_default_run_slot_cap_is_small():
    assert main._MAX_CONCURRENT_RUNS <= 8


def test_list_endpoints_never_decode_the_whole_table():
    """The default is a page size, not a coincidence of a small table.

    A test database of a dozen rows passes whether or not the limit exists, so
    this seeds more rows than the limit allows and checks the page that comes
    back is one page. The filler is dated 1970 so it sorts behind everything
    else, and carries no `frontend` key so it stays out of `/reconciliations`.
    """
    from keel_api.store import (
        DEFAULT_LIST_ROWS,
        count_voyages,
        delete_voyage,
        list_voyages,
    )

    assert DEFAULT_LIST_ROWS <= 1000
    before = count_voyages()
    filler = [f"voyage_hardening_filler_{index:04d}" for index in range(DEFAULT_LIST_ROWS + 1)]
    for voyage_id in filler:
        save_voyage(voyage_id, {"status": "Processing"}, created_at="1970-01-01T00:00:00+00:00")
    try:
        assert len(list_voyages()) == DEFAULT_LIST_ROWS
        assert len(list_voyages(limit=None)) == before + len(filler)
    finally:
        for voyage_id in filler:
            delete_voyage(voyage_id)
    assert count_voyages() == before


# ─── F4: a request with no usable document is an error, not a demo run ──────


def _voyage_ids() -> set[str]:
    return {v["voyage_id"] for v in client.get("/voyages").json()}


def test_upload_with_no_parts_at_all_is_refused():
    before = _voyage_ids()

    response = client.post("/voyages")

    assert response.status_code == 400
    assert "no documents received" in response.json()["detail"]
    assert _voyage_ids() == before


def test_upload_with_the_wrong_field_name_is_refused():
    before = _voyage_ids()

    response = client.post(
        "/voyages", files=[("documents", ("charterparty.pdf", _pdf_bytes(), "application/pdf"))]
    )

    assert response.status_code == 400
    assert "no documents received" in response.json()["detail"]
    assert _voyage_ids() == before


def test_upload_with_no_pdf_is_refused():
    response = _post([("weather_port_xyz.json", _weather_bytes(), "application/json")])

    assert response.status_code == 400
    assert "no PDF" in response.json()["detail"]


# ─── F4: the upload directory does not outlive the run that created it ───────


def test_pipeline_run_removes_the_upload_directory(tmp_path, monkeypatch):
    """The counterparty's documents are deleted whether the pipeline ends well
    or badly, so probing the API cannot fill the disk with them."""
    fixture_dir = tmp_path / "keel-upload-abc"
    fixture_dir.mkdir()
    (fixture_dir / "charterparty.pdf").write_bytes(_pdf_bytes())

    def _fail(*args, **kwargs):
        raise RuntimeError("pipeline blew up")

    monkeypatch.setattr(main, "run_voyage_pipeline", _fail)
    _REAL_PIPELINE_TASK("voyage_hardening_restore", fixture_dir)

    assert fixture_dir.exists() is False


# ─── F2: a document is bounded in pages as well as in bytes ─────────────────


def test_page_ceiling_refuses_a_document_past_it(tmp_path):
    from keel_api.parsing.limits import MAX_PDF_PAGES, DocumentTooLarge
    from keel_api.parsing.pdfplumber_parser import parse_with_pdfplumber
    from keel_api.parsing.pymupdf_parser import parse_with_pymupdf

    assert MAX_PDF_PAGES == 200
    path = tmp_path / "huge.pdf"
    doc = fitz.open()
    for index in range(MAX_PDF_PAGES + 50):
        page = doc.new_page(width=612, height=792)
        page.insert_text((72, 100), f"page {index}", fontsize=11)
    doc.save(str(path))
    doc.close()

    with pytest.raises(DocumentTooLarge) as pdfplumber_error:
        parse_with_pdfplumber(path)
    assert "pages exceeds the 200-page limit" in str(pdfplumber_error.value)

    named = tmp_path / "charterparty.pdf"
    path.rename(named)
    with pytest.raises(DocumentTooLarge):
        parse_with_pymupdf(named)


# ─── F5: pagination bounds ──────────────────────────────────────────────────


@pytest.mark.parametrize("query", ["per_page=0", "per_page=-1", "page=0", "page=-1"])
def test_hostile_pagination_is_rejected_not_divided_by(query):
    response = client.get(f"/reconciliations?{query}")

    assert response.status_code == 422
    assert "detail" in response.json()


def test_page_beyond_the_end_is_an_empty_page_not_an_error():
    response = client.get("/reconciliations?page=99999&per_page=10")

    assert response.status_code == 200
    body = response.json()
    assert body["items"] == []
    assert body["page"] == 99999
    assert body["total_pages"] >= 1


def test_pagination_window_is_applied_in_sql():
    save_voyage(
        "voyage_hardening_page",
        {
            "status": "Reconciled",
            "frontend": {
                "charterparty": {"vessel_name": "MV Paged"},
                "owner_calculation": {"total_usd": 1},
                "charterer_calculation": {"total_usd": 1},
                "reconciled_total_usd": 1,
                "day_verdicts": [],
            },
        },
    )

    body = client.get("/reconciliations?page=1&per_page=1").json()

    assert len(body["items"]) == 1
    assert body["total"] >= 1
    assert body["per_page"] == 1


# ─── Routes whose contracts must survive the hardening ─────────────────────


def test_letter_refuses_a_pdf_format():
    response = client.get("/voyages/voyage_001/letter?format=pdf")

    assert response.status_code == 400
    assert "HTML only" in response.json()["detail"]


def test_errored_voyage_still_reports_409():
    voyage_id = "voyage_hardening_errored"
    save_voyage(voyage_id, {"status": "Processing"})
    client.patch(f"/voyages/{voyage_id}/status", json={"status": "Pending"})
    assert load_voyage(voyage_id)["status"] == "Pending"
    patch_voyage(voyage_id, {"error": "Could not process sof_owner.pdf: boom"})

    for path in (f"/voyages/{voyage_id}", f"/voyages/{voyage_id}/letter"):
        response = client.get(path)
        assert response.status_code == 409, path
        assert "no reconciliation" in response.json()["detail"]


def test_demo_voyage_cannot_be_deleted():
    response = client.delete("/voyages/voyage_001")

    assert response.status_code == 409
    assert "seeded demo voyage" in response.json()["detail"]


def test_healthz_is_200():
    assert client.get("/healthz").json() == {"status": "ok"}


def test_status_patch_is_atomic_and_keeps_the_rest_of_the_row():
    voyage_id = "voyage_hardening_patch"
    save_voyage(
        voyage_id,
        {
            "status": "In Review",
            "owner_name": "Aegean Shipping Co.",
            "frontend": {"reconciled_total_usd": 112000},
        },
        owner_name="Aegean Shipping Co.",
    )

    assert client.patch(f"/voyages/{voyage_id}/status", json={"status": "Reconciled"}).status_code == 200

    stored = load_voyage(voyage_id)
    assert stored["status"] == "Reconciled"
    assert stored["owner_name"] == "Aegean Shipping Co."
    assert stored["frontend"]["reconciled_total_usd"] == 112000


def test_patch_merges_the_row_in_one_transaction(monkeypatch):
    """No read helper, no write helper: a merge that goes through
    `load_voyage` + `save_voyage` reads the row, closes the connection and
    writes it back, which is a lost update waiting for a second caller."""
    def unreachable(*args, **kwargs):
        raise AssertionError("patch_voyage went around its own transaction")

    voyage_id = "voyage_hardening_patch_one_transaction"
    save_voyage(voyage_id, {"status": "Processing", "keep": "me"})

    monkeypatch.setattr(store, "load_voyage", unreachable)
    monkeypatch.setattr(store, "save_voyage", unreachable)

    assert patch_voyage(voyage_id, {"added": 1}) is True
    assert patch_voyage("voyage_hardening_absent", {"added": 1}) is False

    monkeypatch.undo()
    assert load_voyage(voyage_id) == {"status": "Processing", "keep": "me", "added": 1}


def test_two_concurrent_patches_of_one_row_keep_both_fields(monkeypatch):
    """Two callers patching the same row with disjoint keys must not lose one.

    Both threads are held at the store's `json.loads` — the read every merge
    performs — so that they read the same snapshot before either writes. With
    the write lock taken before the read, the second thread cannot reach the read
    until the first has committed, so the rendezvous times out and both fields
    survive. With a read and a write around the caller's dict, the rendezvous
    trips, both writes land, and one field is silently dropped.
    """
    voyage_id = "voyage_hardening_concurrent_patch"
    save_voyage(voyage_id, {"status": "Processing"})

    real_loads = store.json.loads
    rendezvous = threading.Barrier(2, timeout=1.0)
    armed = threading.Event()
    armed.set()

    def reads_snapshots_together(payload):
        decoded = real_loads(payload)
        if armed.is_set() and threading.current_thread().name.startswith("patch-"):
            try:
                rendezvous.wait()
            except threading.BrokenBarrierError:
                pass
        return decoded

    monkeypatch.setattr(store.json, "loads", reads_snapshots_together)

    def patch(field: str) -> None:
        patch_voyage(voyage_id, {field: field})

    workers = [
        threading.Thread(target=patch, args=(f"field_{index}",), name=f"patch-{index}")
        for index in range(2)
    ]
    for worker in workers:
        worker.start()
    for worker in workers:
        worker.join(timeout=30)
    armed.clear()

    assert not [worker for worker in workers if worker.is_alive()], "a patch thread hung"
    stored = load_voyage(voyage_id)
    assert stored["field_0"] == "field_0"
    assert stored["field_1"] == "field_1"
    assert stored["status"] == "Processing"


# ─── F9: an upload's failure names only the caller's own documents ──────────


def test_upload_error_never_names_a_document_the_caller_never_sent(tmp_path):
    """A failure that names a file the caller did not send must not surface it.

    `weather_port_xyz.json` is the provider's own name, and
    `charterparty.pdf` is the hard-coded subject map's guess; neither was in
    this request, so neither belongs in the dashboard dialog.
    """
    (tmp_path / "sof_owner.pdf").write_bytes(_pdf_bytes())

    summary = main._summarize_error(
        FileNotFoundError(
            2,
            "No such file or directory",
            "/tmp/keel-x/weather_port_xyz.json",
        ),
        tmp_path,
    )

    assert "charterparty.pdf" not in summary
    assert "weather_port_xyz.json" not in summary
    assert "the document" in summary
    assert summary.startswith("Could not process sof_owner.pdf: ")


def test_upload_error_names_the_documents_the_caller_did_send(tmp_path):
    (tmp_path / "sof_owner.pdf").write_bytes(_pdf_bytes())

    summary = main._summarize_error(
        ValueError("could not read /tmp/keel-x/sof_owner.pdf"),
        tmp_path,
    )

    assert "sof_owner.pdf" in summary
    assert "/tmp/keel-x" not in summary


def test_error_detail_is_capped_and_strips_the_temp_directory(tmp_path):
    (tmp_path / "sof_owner.pdf").write_bytes(_pdf_bytes())
    summary = main._summarize_error(
        ValueError("/tmp/keel-abc123/sof_owner.pdf: " + "x" * 5000),
        tmp_path,
    )

    assert "/tmp/keel-abc123" not in summary
    assert len(summary) < 260


# ─── F10: the letter escapes its inputs and ships a restrictive CSP ─────────


def _seed_letter_voyage(voyage_id: str, vessel_name: str) -> None:
    save_voyage(
        voyage_id,
        {
            "status": "In Review",
            "frontend": {
                "voyage_id": voyage_id,
                "charterparty": {
                    "vessel_name": vessel_name,
                    "laytime_allowed_hours": 72.0,
                    "demurrage_rate_per_day_usd": 50000.0,
                },
                "owner_calculation": {"total_usd": 187000.0},
                "charterer_calculation": {"total_usd": 62000.0},
                "day_verdicts": [
                    {
                        "date": "2026-06-14",
                        "owner_position": "Exception does not apply",
                        "charterer_position": "Exception claimed",
                        "verdict": "owner",
                        "winner_label": "Owner position better supported",
                        "dollars_credited_usd": 25000.0,
                        "justification": "0 of 12 hours met the threshold",
                    }
                ],
                "reconciled_total_usd": 112000.0,
                "math_breakdown": "$62,000 + $50,000 = $112,000",
            },
        },
    )


def test_letter_escapes_injected_markup():
    voyage_id = "voyage_hardening_xss"
    payload = '<img src=x onerror=alert(1)>'
    _seed_letter_voyage(voyage_id, payload)

    body = client.get(f"/voyages/{voyage_id}/letter").text

    assert payload not in body
    assert "<img" not in body
    assert "&lt;img src=x onerror=alert(1)&gt;" in body


def test_letter_response_carries_csp_and_nosniff():
    voyage_id = "voyage_hardening_headers"
    _seed_letter_voyage(voyage_id, "MV Hellenic Pioneer")

    response = client.get(f"/voyages/{voyage_id}/letter")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/html")
    assert "utf-8" in response.headers["content-type"].lower()
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["content-security-policy"] == (
        "default-src 'none'; style-src 'unsafe-inline'"
    )


def test_letter_footer_does_not_claim_bimco_2013_is_the_authority():
    voyage_id = "voyage_hardening_footer"
    _seed_letter_voyage(voyage_id, "MV Hellenic Pioneer")

    body = " ".join(client.get(f"/voyages/{voyage_id}/letter").text.split())

    assert "BIMCO Laytime Definitions 2013" not in body
    assert "Special Circular No. 8" in body
    assert "definition 16" in body
    assert "charter party" in body
    assert "not a legal opinion" in body


# ─── F7: the optional shared token ──────────────────────────────────────────


def test_shared_token_is_off_by_default(monkeypatch):
    monkeypatch.delenv("KEEL_API_TOKEN", raising=False)

    assert client.get("/voyages").status_code == 200


def test_shared_token_gates_every_route_but_the_liveness_probe(monkeypatch):
    monkeypatch.setenv("KEEL_API_TOKEN", "s3cret")

    assert client.get("/healthz").status_code == 200
    assert client.get("/voyages").status_code == 401
    assert client.get("/docs").status_code == 401
    assert client.patch(
        "/voyages/voyage_001/status", json={"status": "Closed"}
    ).status_code == 401

    authorised = {"headers": {"Authorization": "Bearer s3cret"}}
    assert client.get("/voyages", **authorised).status_code == 200
    assert client.get("/voyages", headers={"X-Keel-Token": "s3cret"}).status_code == 200
    assert client.get("/voyages", headers={"Authorization": "Bearer wrong"}).status_code == 401


def test_cors_is_not_a_wildcard():
    assert "*" not in main._DEFAULT_CORS_ORIGINS
    response = client.get("/voyages", headers={"Origin": "https://attacker.example"})
    assert "access-control-allow-origin" not in response.headers

    allowed = client.get("/voyages", headers={"Origin": "http://localhost:3000"})
    assert allowed.headers.get("access-control-allow-origin") == "http://localhost:3000"
