"""Extract charterparty terms from fixture PDF. Run once, commit the result.

Usage:
  export $(cat .env | xargs)
  uv run --directory apps/api python ../../scripts/extract_charterparty.py
"""

from __future__ import annotations
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "apps" / "api"))

from keel_api.extraction import extract_charterparty_terms
from keel_api.parsing import parse

FIXTURE_DIR = Path(__file__).resolve().parents[1] / "fixtures" / "voyage_001"

doc = parse(FIXTURE_DIR / "charterparty.pdf")
terms = extract_charterparty_terms(doc)
out = FIXTURE_DIR / "extracted_charterparty.json"
out.write_text(terms.model_dump_json(indent=2))
print(f"rate={terms.demurrage_rate_per_day_usd}, laytime={terms.laytime_allowance_hours}h, weather_clause={terms.weather_clause}")
print(f"→ {out}")
