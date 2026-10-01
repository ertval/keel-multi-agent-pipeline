"""The parser boundary: what the child reports, and what may cross back.

`parse()` runs the PDF libraries in a fork+exec'd child with `RLIMIT_AS`
installed before those libraries import, so every assertion here is a claim
about a boundary rather than about a function: the work happens in another
process, a child that exhausts its address space can still say so, a class name
from a child never decides what the API worker raises, and an `OSError`'s own
attributes survive the trip.
"""

from __future__ import annotations

import pickle
import subprocess
import sys

import fitz
import pytest

from keel_api.parsing import dispatcher, sandbox
from keel_api.parsing.dispatcher import _reraise, parse
from keel_api.parsing.limits import (
    DEFAULT_ADDRESS_SPACE_BYTES,
    DEFAULT_PARSE_TIMEOUT_SECONDS,
    MAX_EXTRACTED_CHARS,
    MAX_PDF_PAGES,
    DocumentParseError,
    DocumentTooLarge,
)
from keel_api.parsing.models import ParsedDocument

# Enough for the interpreter and a PDF library, not enough for the document: 16
# dense pages need about 320 MB on this tree and the child is given 200 MB, so
# it runs out part way through page set rather than during the import.
STARVED_LIMIT = 200_000_000

# pdfplumber's address space, measured on this tree: 40 pages of 55 lines (179k
# extracted characters) parse in 0.51 GB and 200 pages of the same (894k
# characters) in 2.03 GB. That is ~2 kB of address space per extracted character
# over a ~150 MB interpreter-and-library floor, which is what makes the text
# ceiling and the address space one decision rather than two.
ADDRESS_SPACE_FLOOR = 150_000_000
ADDRESS_SPACE_PER_CHAR = 2_000

DENSE_LINES_PER_PAGE = 55


# ─── helpers ────────────────────────────────────────────────────────────────


def _dense_pdf(target, pages: int, lines_per_page: int = DENSE_LINES_PER_PAGE):
    """A page set at the density the audit measured: real prose, tightly set."""
    clauses = [
        "The Owners shall not be liable for any failure to exercise due",
        "diligence in the safe navigation of the Vessel, nor for any loss,",
        "damage or delay resulting from the use of the Vessel in breach.",
        "Laytime shall commence at the expiry of the time stated in the",
        "Notice of Readiness and shall be counted in the port of loading",
        "at the rate of four hundred and eighty running hours beginning",
        "twelve hours after the expiry of the said Notice of Readiness.",
    ]
    doc = fitz.open()
    for page_no in range(pages):
        page = doc.new_page(width=612, height=792)
        y = 40.0
        for line_no in range(lines_per_page):
            page.insert_text(
                (36, y),
                f"{page_no + 1:04d}.{line_no + 1:03d}  "
                f"{clauses[line_no % len(clauses)]}",
                fontsize=7,
            )
            y += 9.0
    doc.save(str(target), deflate=True)
    doc.close()
    return target


def _sparse_pdf(target, pages: int):
    doc = fitz.open()
    for page_no in range(pages):
        page = doc.new_page(width=612, height=792)
        for line_no in range(3):
            page.insert_text((72, 100 + line_no * 14), f"page {page_no} line {line_no}", fontsize=11)
    doc.save(str(target), deflate=True)
    doc.close()
    return target


def _error_payload(
    module: str,
    qualname: str,
    message: str,
    errno: int | None = None,
    strerror: str | None = None,
    filename: str | None = None,
) -> bytes:
    return pickle.dumps(
        (
            "error",
            module,
            qualname,
            message,
            "child traceback",
            errno,
            strerror,
            filename,
        ),
        protocol=pickle.HIGHEST_PROTOCOL,
    )


class _FakeChild:
    """The half of `subprocess.Popen` that `parse()` actually uses."""

    def __init__(self, stdout: bytes, returncode: int = 1):
        self._stdout = stdout
        self.returncode = returncode

    def communicate(self, timeout=None):
        return self._stdout, b""

    def kill(self):
        self.returncode = -9


def _recording_popen(stdout: bytes, returncode: int = 1):
    calls: list[tuple[list[str], dict]] = []
    child = _FakeChild(stdout, returncode)

    def popen(argv, **kwargs):
        calls.append((argv, kwargs))
        return child

    popen.calls = calls
    popen.child = child
    return popen


# ─── the parsing work happens in another process ────────────────────────────


def test_parse_spawns_the_sandbox_module_with_the_document_path(tmp_path, monkeypatch):
    path = _sparse_pdf(tmp_path / "sof_owner.pdf", 1)
    popen = _recording_popen(
        pickle.dumps(
            ("ok", ParsedDocument(path=str(path), pages=["NOR 2026-06-10"])),
            protocol=pickle.HIGHEST_PROTOCOL,
        ),
        returncode=0,
    )
    monkeypatch.setattr(dispatcher.subprocess, "Popen", popen)

    parsed = parse(path)

    assert parsed.pages == ["NOR 2026-06-10"]
    assert len(popen.calls) == 1
    argv, kwargs = popen.calls[0]
    assert argv == [sys.executable, "-m", "keel_api.parsing.sandbox", str(path)]
    assert kwargs["close_fds"] is True
    assert kwargs["start_new_session"] is True
    assert kwargs["stderr"] == subprocess.DEVNULL


def test_parse_never_calls_a_parser_in_the_worker(tmp_path, monkeypatch):
    """The in-process call is the mutation this guards: it would take the API
    worker down with the document, and no assertion about argv would notice."""
    path = _sparse_pdf(tmp_path / "sof_owner.pdf", 1)
    popen = _recording_popen(
        pickle.dumps(("ok", ParsedDocument(path=str(path))), protocol=pickle.HIGHEST_PROTOCOL),
        returncode=0,
    )
    monkeypatch.setattr(dispatcher.subprocess, "Popen", popen)

    def poisoned(_path):
        raise AssertionError("a PDF library ran in the API worker")

    monkeypatch.setattr(dispatcher, "dispatch_to_parser", poisoned)

    assert isinstance(parse(path), ParsedDocument)


def test_a_real_document_parses_through_the_real_child(tmp_path):
    path = _sparse_pdf(tmp_path / "sof_owner.pdf", 2)

    parsed = parse(path)

    assert len(parsed.pages) == 2
    assert any("page 0 line 0" in line.text for line in parsed.lines)
    assert all(line.bbox.x1 > line.bbox.x0 for line in parsed.lines)


def test_a_missing_document_keeps_its_type_and_its_filename(tmp_path):
    """`main._error_subject` reads `exc.filename` to name the failed document,
    and it can only do that if the attribute crosses the boundary."""
    missing = tmp_path / "absent_sof.pdf"

    with pytest.raises(FileNotFoundError) as failure:
        parse(missing)

    assert failure.value.errno == 2
    assert failure.value.filename == str(missing)
    assert str(failure.value) == f"[Errno 2] No such file or directory: {str(missing)!r}"


# ─── a child with no memory left can still say why ──────────────────────────


def test_a_child_that_exhausts_its_address_space_names_that_as_the_reason(tmp_path, monkeypatch):
    """A real parse in a real child, told the ceiling is one it cannot meet."""
    path = _dense_pdf(tmp_path / "sof_owner.pdf", 16)
    monkeypatch.setenv("KEEL_PARSE_AS_LIMIT", str(STARVED_LIMIT))

    with pytest.raises(DocumentTooLarge) as failure:
        parse(path)

    message = str(failure.value)
    assert "address space" in message
    assert str(STARVED_LIMIT) in message
    assert "produced no result" not in message


class _Buffer:
    def __init__(self):
        self.written = b""

    def write(self, payload):
        self.written += payload

    def flush(self):
        pass


def _run_sandbox_in_process(monkeypatch, path, dispatch):
    """Run `sandbox.main` here with a recorder in place of `setrlimit`."""
    monkeypatch.setattr(sandbox.resource, "setrlimit", lambda *_args, **_kwargs: None)
    monkeypatch.setattr(dispatcher, "dispatch_to_parser", dispatch)
    buffer = _Buffer()
    monkeypatch.setattr(sandbox.sys, "stdout", type("Out", (), {"buffer": buffer})())
    code = sandbox.main(["sandbox", str(path)])
    return code, pickle.loads(buffer.written)


def test_a_memory_failure_is_reported_even_when_the_traceback_cannot_be(
    tmp_path, monkeypatch
):
    """`traceback.format_exc()` allocates, so the handler that reports the out
    of memory is the one most likely to raise a second one."""
    path = _sparse_pdf(tmp_path / "sof_owner.pdf", 1)

    def starved(_path):
        raise MemoryError

    monkeypatch.setattr(
        sandbox.traceback, "format_exc", lambda: (_ for _ in ()).throw(MemoryError())
    )

    code, payload = _run_sandbox_in_process(monkeypatch, path, starved)

    assert code == 1
    assert payload[0] == "error"
    assert (payload[1], payload[2]) == ("keel_api.parsing.limits", "DocumentTooLarge")
    assert "address space" in payload[3]
    assert payload[4] == sandbox._NO_ROOM_FOR_A_TRACEBACK


def test_a_memory_failure_still_carries_the_traceback_when_there_is_room(
    tmp_path, monkeypatch
):
    path = _sparse_pdf(tmp_path / "sof_owner.pdf", 1)

    def starved(_path):
        raise MemoryError

    code, payload = _run_sandbox_in_process(monkeypatch, path, starved)

    assert code == 1
    assert "MemoryError" in payload[4]


def test_the_starved_report_is_picklable_before_the_limit_goes_on():
    payload = sandbox._out_of_memory("sof_owner.pdf", STARVED_LIMIT, sandbox._NO_ROOM_FOR_A_TRACEBACK)

    assert pickle.loads(pickle.dumps(payload))[:4] == (
        "error",
        "keel_api.parsing.limits",
        "DocumentTooLarge",
        f"sof_owner.pdf: parsing exceeded its {STARVED_LIMIT}-byte address space",
    )


def test_a_parsed_document_is_still_reported_as_a_success(tmp_path, monkeypatch):
    path = _sparse_pdf(tmp_path / "sof_owner.pdf", 1)
    document = ParsedDocument(path=str(path), pages=["NOR 2026-06-10 08:00"])

    code, payload = _run_sandbox_in_process(monkeypatch, path, lambda _path: document)

    assert code == 0
    assert payload[0] == "ok"
    assert payload[1].pages == ["NOR 2026-06-10 08:00"]


# ─── a child's class name never chooses what the worker raises ──────────────


@pytest.mark.parametrize("qualname", ["SystemExit", "KeyboardInterrupt", "GeneratorExit"])
def test_a_base_exception_from_the_child_does_not_escape_the_worker(
    qualname, tmp_path, monkeypatch
):
    """`_run_pipeline_task` catches `Exception`. A `SystemExit` re-raised out of
    a parse would unwind the worker and leave the voyage at `Processing`."""
    path = _sparse_pdf(tmp_path / "sof_owner.pdf", 1)
    popen = _recording_popen(
        _error_payload("builtins", qualname, f"parser called {qualname}(1)")
    )
    monkeypatch.setattr(dispatcher.subprocess, "Popen", popen)

    with pytest.raises(DocumentParseError) as failure:
        parse(path)

    assert qualname in str(failure.value)
    assert "1" in str(failure.value)


@pytest.mark.parametrize("qualname", ["SystemExit", "KeyboardInterrupt"])
def test_reraise_refuses_a_non_exception_class_on_its_own(qualname):
    with pytest.raises(DocumentParseError) as failure:
        _reraise("builtins", qualname, "parser called sys.exit(1)")

    assert qualname in str(failure.value)


def test_reraise_refuses_a_class_the_worker_cannot_import():
    with pytest.raises(DocumentParseError) as failure:
        _reraise("no.such.module", "Boom", "the child fell over")

    assert "no.such.module.Boom" in str(failure.value)


def test_reraise_refuses_a_name_that_is_not_a_class():
    with pytest.raises(DocumentParseError):
        _reraise("builtins", "str", "not a class")


# ─── an OSError's own attributes cross back with it ─────────────────────────


def test_oserror_details_survive_the_boundary(tmp_path, monkeypatch):
    path = _sparse_pdf(tmp_path / "sof_owner.pdf", 1)
    popen = _recording_popen(
        _error_payload(
            "builtins",
            "FileNotFoundError",
            "[Errno 2] No such file or directory: '/x/y.pdf'",
            errno=2,
            strerror="No such file or directory",
            filename="/x/y.pdf",
        )
    )
    monkeypatch.setattr(dispatcher.subprocess, "Popen", popen)

    with pytest.raises(FileNotFoundError) as failure:
        parse(path)

    assert failure.value.errno == 2
    assert failure.value.filename == "/x/y.pdf"
    assert str(failure.value) == "[Errno 2] No such file or directory: '/x/y.pdf'"


def test_a_document_too_large_from_the_child_keeps_its_type(tmp_path, monkeypatch):
    path = _sparse_pdf(tmp_path / "sof_owner.pdf", 1)
    popen = _recording_popen(
        _error_payload(
            "keel_api.parsing.limits",
            "DocumentTooLarge",
            f"{path.name}: 201 pages exceeds the {MAX_PDF_PAGES}-page limit for one document",
        )
    )
    monkeypatch.setattr(dispatcher.subprocess, "Popen", popen)

    with pytest.raises(DocumentTooLarge) as failure:
        parse(path)

    assert f"{MAX_PDF_PAGES}-page limit" in str(failure.value)


# ─── the ceilings still refuse a hostile document ───────────────────────────


def test_a_document_past_the_page_ceiling_is_refused(tmp_path):
    path = tmp_path / "huge3000.pdf"
    doc = fitz.open()
    for index in range(MAX_PDF_PAGES + 50):
        page = doc.new_page(width=612, height=792)
        page.insert_text((72, 100), f"page {index}", fontsize=11)
    doc.save(str(path), deflate=True)
    doc.close()

    with pytest.raises(DocumentTooLarge) as failure:
        parse(path)

    assert f"{MAX_PDF_PAGES + 50} pages exceeds the {MAX_PDF_PAGES}-page limit" in str(failure.value)


def test_the_text_ceiling_is_enforced_while_the_pages_are_read(tmp_path, monkeypatch):
    """Read in-process, not through the child: the ceiling is a constant the
    child reads off disk, so a monkeypatched one would never reach it, and a
    document that really holds `MAX_EXTRACTED_CHARS` of text needs 2.5 GB and a
    minute to discover that it is one character too long."""
    from keel_api.parsing.pdfplumber_parser import parse_with_pdfplumber

    path = _dense_pdf(tmp_path / "dense.pdf", 4)
    monkeypatch.setattr("keel_api.parsing.pdfplumber_parser.MAX_EXTRACTED_CHARS", 1_000)

    with pytest.raises(DocumentTooLarge) as failure:
        parse_with_pdfplumber(path)

    assert "extracted text exceeds 1000 characters" in str(failure.value)


# ─── a document at the documented density is admitted, and the numbers agree ─


def test_a_page_set_at_the_documented_density_parses(tmp_path):
    path = _dense_pdf(tmp_path / "dense.pdf", 8)

    parsed = parse(path)

    assert len(parsed.pages) == 8
    assert len(parsed.lines) == 8 * DENSE_LINES_PER_PAGE
    assert sum(len(page) for page in parsed.pages) < MAX_EXTRACTED_CHARS


def test_the_address_space_admits_the_densest_document_the_page_ceiling_allows():
    """200 pages at the density measured above — 11,000 lines, 894k characters —
    is a real document and it needs 2.03 GB to parse. The ceiling that refused
    it was 1 GB, which made the address space the primary defence against a
    document that was never hostile."""
    assert DEFAULT_ADDRESS_SPACE_BYTES >= 3_000_000_000
    assert DEFAULT_PARSE_TIMEOUT_SECONDS >= 120
    assert MAX_PDF_PAGES == 200


def test_the_text_ceiling_and_the_address_space_are_one_decision():
    """Every character the text ceiling allows has to fit in the address space,
    or the address space is the real ceiling and the documented one is a lie."""
    worst_case = ADDRESS_SPACE_FLOOR + ADDRESS_SPACE_PER_CHAR * MAX_EXTRACTED_CHARS
    assert worst_case <= DEFAULT_ADDRESS_SPACE_BYTES
