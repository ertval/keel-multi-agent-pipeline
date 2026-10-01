"""Route a PDF to the right parser based on filename convention.

- charterparty.pdf  → pymupdf (prose narrative)
- sof_*.pdf         → pdfplumber (tabular SOF)
- claim_*.pdf       → pdfplumber (tabular claim)
- fallback          → pdfplumber

Every filename other than `charterparty.pdf` therefore reaches pdfplumber, so a
document nobody has classified is parsed by the most expensive parser in the
tree. Parsing runs in a child process with a bounded address space and a wall
clock (see `keel_api.parsing.sandbox`): a request that names no document, or
names one that a client chose, must not be able to take the API worker down.
"""

from __future__ import annotations

import importlib
import logging
import os
import pickle
import subprocess
import sys
from pathlib import Path

from keel_api.parsing.limits import (
    DEFAULT_PARSE_TIMEOUT_SECONDS,
    DocumentParseError,
    DocumentTooLarge,
)
from keel_api.parsing.models import ParsedDocument
from keel_api.parsing.pdfplumber_parser import parse_with_pdfplumber
from keel_api.parsing.pymupdf_parser import parse_with_pymupdf

logger = logging.getLogger(__name__)

_PYMUPDF_NAMES = {"charterparty.pdf"}


def dispatch_to_parser(path: Path) -> ParsedDocument:
    if path.name in _PYMUPDF_NAMES:
        return parse_with_pymupdf(path)
    return parse_with_pdfplumber(path)


def _parse_timeout() -> float:
    raw = os.environ.get("KEEL_PARSE_TIMEOUT", "").strip()
    try:
        timeout = float(raw)
    except ValueError:
        return DEFAULT_PARSE_TIMEOUT_SECONDS
    return timeout if timeout > 0 else DEFAULT_PARSE_TIMEOUT_SECONDS


def _child_env() -> dict[str, str]:
    env = dict(os.environ)
    # The child is exec'd from an arbitrary working directory, so make the
    # importable roots of this interpreter explicit rather than inherited.
    env["PYTHONPATH"] = os.pathsep.join(entry for entry in sys.path if entry)
    return env


def _reraise(
    module: str,
    qualname: str,
    message: str,
    errno: int | None = None,
    strerror: str | None = None,
    filename: str | None = None,
) -> None:
    """Re-raise the child's own exception so callers keep their error handling.

    Only an `Exception` subclass is rebuilt here. A child that names
    `SystemExit`, `KeyboardInterrupt` or any other `BaseException` gets a
    `DocumentParseError` instead, because re-raising one of those in the API
    worker would unwind the worker rather than fail the request that asked for
    the document — and nothing in the PDF libraries raises one.

    `errno`/`strerror`/`filename` are carried across the boundary so a rebuilt
    `OSError` still has the attributes callers read off it: `main._error_subject`
    harvests `exc.filename` to name the document that failed.
    """
    exc_type: type[Exception] | None = None
    try:
        candidate = getattr(importlib.import_module(module), qualname, None)
        if isinstance(candidate, type) and issubclass(candidate, Exception):
            exc_type = candidate
    except Exception:
        exc_type = None
    if exc_type is None:
        raise DocumentParseError(
            f"{message} ({module}.{qualname} is not an Exception, so the parser "
            f"process's own type was not re-raised)"
        )
    if issubclass(exc_type, OSError) and errno is not None:
        try:
            raise exc_type(errno, strerror or message, filename)
        except TypeError:
            pass
    raise exc_type(message)


def parse(path: Path) -> ParsedDocument:
    """Parse `path` in a child process that cannot outgrow its address space."""
    timeout = _parse_timeout()
    try:
        process = subprocess.Popen(
            [sys.executable, "-m", "keel_api.parsing.sandbox", str(path)],
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            env=_child_env(),
            close_fds=True,
            start_new_session=True,
        )
    except OSError as exc:
        raise DocumentParseError(f"{path.name}: could not start the parser process") from exc

    try:
        stdout, _ = process.communicate(timeout=timeout)
    except subprocess.TimeoutExpired:
        process.kill()
        process.communicate()
        raise DocumentTooLarge(
            f"{path.name}: parsing did not finish within {timeout:.0f}s and was abandoned"
        ) from None

    if not stdout:
        raise DocumentParseError(
            f"{path.name}: the parser process exited with status "
            f"{process.returncode} and produced no result"
        )

    kind, *rest = pickle.loads(stdout)
    if kind == "ok":
        return rest[0]

    module, qualname, message, child_traceback, errno, strerror, filename = rest
    logger.error("Parser process failed on %s\n%s", path.name, child_traceback)
    _reraise(module, qualname, message, errno, strerror, filename)
