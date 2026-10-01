"""Keep the test suite out of the demo database.

`store._db_path()` resolves `KEEL_DB` at import time and otherwise points at
`apps/api/keel.db` — the same file the running API serves `voyage_001` from. The
API seeds that file once at startup, and `DELETE /voyages/voyage_001` is
refused, so a suite that wrote into it left a demo whose rows no longer matched
the fixture. Point every test session at a throwaway file instead.

The name carries this process's id, so two sessions on one machine never share
one file, and the assignment is unconditional: a `KEEL_DB` already exported in
the shell must not be able to aim the suite back at the demo database.
"""

import atexit
import os
import tempfile
from pathlib import Path

_TEST_DB = Path(tempfile.gettempdir()) / f"keel-pytest-{os.getpid()}.db"
os.environ["KEEL_DB"] = str(_TEST_DB)


def _discard_test_db() -> None:
    for sidecar in (_TEST_DB, Path(f"{_TEST_DB}-wal"), Path(f"{_TEST_DB}-shm")):
        sidecar.unlink(missing_ok=True)


_discard_test_db()
atexit.register(_discard_test_db)
