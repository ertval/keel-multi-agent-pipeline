"""Out-of-process PDF parsing entry point.

`keel_api.parsing.dispatcher.parse` runs the real parsers here so that a
hostile document can only exhaust *this* process: the address-space limit is
installed before the PDF libraries are even imported, and the process is
fork+exec'd rather than forked, so it inherits no file descriptors, no locks
and no heap from the API worker.

Protocol: a pickle on stdout, `("ok", ParsedDocument)` or an 8-field error
tuple `("error", module, qualname, message, traceback, errno, strerror,
filename)`. The exit code is 0 for success and 1 for failure. Invoked as
`python -m keel_api.parsing.sandbox PATH`.
"""

from __future__ import annotations

import os
import pickle
import resource
import sys
import traceback
from pathlib import Path

from keel_api.parsing.limits import (
    DEFAULT_ADDRESS_SPACE_BYTES,
    DocumentTooLarge,
)

# Rendering a traceback allocates, so a child that has just run out of address
# space usually cannot render its own. The report is built and pickled before the
# limit goes on, and this stands in whenever the formatting step dies too.
_NO_ROOM_FOR_A_TRACEBACK = (
    "the parser process had no memory left to render this traceback"
)


def address_space_limit() -> int:
    raw = os.environ.get("KEEL_PARSE_AS_LIMIT", "").strip()
    try:
        limit = int(raw)
    except ValueError:
        return DEFAULT_ADDRESS_SPACE_BYTES
    return limit if limit > 0 else DEFAULT_ADDRESS_SPACE_BYTES


def _format_exc() -> str:
    try:
        return traceback.format_exc()
    except BaseException:
        return _NO_ROOM_FOR_A_TRACEBACK


def _encode(payload: tuple) -> bytes | None:
    try:
        return pickle.dumps(payload, protocol=pickle.HIGHEST_PROTOCOL)
    except BaseException:
        return None


def _out_of_memory(name: str, limit: int, detail: str) -> tuple:
    return (
        "error",
        DocumentTooLarge.__module__,
        DocumentTooLarge.__qualname__,
        f"{name}: parsing exceeded its {limit}-byte address space",
        detail,
        None,
        None,
        None,
    )


def _failed(exc: BaseException) -> tuple:
    return (
        "error",
        type(exc).__module__,
        type(exc).__qualname__,
        str(exc),
        _format_exc(),
        getattr(exc, "errno", None),
        getattr(exc, "strerror", None),
        getattr(exc, "filename", None),
    )


def main(argv: list[str]) -> int:
    path = Path(argv[1])
    limit = address_space_limit()
    starved = _encode(_out_of_memory(path.name, limit, _NO_ROOM_FOR_A_TRACEBACK))

    try:
        resource.setrlimit(resource.RLIMIT_AS, (limit, limit))
    except (OSError, ValueError):
        pass

    parsed = True
    try:
        from keel_api.parsing.dispatcher import dispatch_to_parser

        encoded = pickle.dumps(
            ("ok", dispatch_to_parser(path)), protocol=pickle.HIGHEST_PROTOCOL
        )
    except MemoryError:
        parsed = False
        encoded = _encode(_out_of_memory(path.name, limit, _format_exc())) or starved
    except BaseException as exc:
        parsed = False
        encoded = _encode(_failed(exc)) or starved

    sys.stdout.buffer.write(encoded or starved)
    sys.stdout.buffer.flush()
    return 0 if parsed else 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
