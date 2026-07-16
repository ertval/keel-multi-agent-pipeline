"""Extract charterer SOF events from fixture PDF. Run once, commit the result.

Usage:
  export $(cat .env | xargs)
  uv run --directory apps/api python ../../scripts/extract_sof_charterer.py
"""

from __future__ import annotations
import json, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "apps" / "api"))

from keel_api.extraction import extract_sof_events
from keel_api.parsing import parse

FIXTURE_DIR = Path(__file__).resolve().parents[1] / "fixtures" / "voyage_001"

doc = parse(FIXTURE_DIR / "sof_charterer.pdf")
events = extract_sof_events(doc)
out = FIXTURE_DIR / "extracted_sof_charterer.json"
out.write_text(json.dumps([e.model_dump(mode="json") for e in events], indent=2))
print(f"→ {out} ({len(events)} events)")
for e in events:
    print(f"   {e.event_type:30s} {e.timestamp}")
