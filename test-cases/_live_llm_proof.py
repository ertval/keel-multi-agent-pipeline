"""Prove the real upload->parse->LLM-extract->reconcile path end to end.

Copies one case to a temp dir, DELETES the seeded extracted_*.json cache so the
pipeline is forced down the live-LLM branch of _load_or_extract, runs the same
run_voyage_pipeline that POST /voyages executes in the background, and prints
the structured reconciliation. The real test-cases/ folder is never modified.

Run with the API creds sourced from .env:
    set -a; source .env; set +a
    uv --project apps/api run python test-cases/_live_llm_proof.py case_02_owner_win_marginal
"""

from __future__ import annotations

import shutil
import sys
import tempfile
from pathlib import Path

from keel_api.pipeline import run_voyage_pipeline

HERE = Path(__file__).resolve().parent
CASE = sys.argv[1] if len(sys.argv) > 1 else "case_02_owner_win_marginal"


def main() -> None:
    src = HERE / CASE
    if not src.exists():
        raise SystemExit(f"no such case: {src}")

    with tempfile.TemporaryDirectory() as tmp:
        work = Path(tmp) / CASE
        shutil.copytree(src, work)
        # Force the live-LLM branch: remove the seeded extraction cache.
        for f in work.glob("extracted_*.json"):
            f.unlink()
        removed = sorted(p.name for p in src.glob("extracted_*.json"))
        print(f"Removed seeded cache for live run: {removed}\n")

        print(f"=== LIVE pipeline run on {CASE} (LLM extraction) ===")
        rec, terms, owner_res, charterer_res = run_voyage_pipeline(
            work, on_progress=lambda m: print(f"  • {m}")
        )

    print("\n=== Extracted charter terms (LLM) ===")
    print(f"  vessel              : {terms.vessel}")
    print(f"  demurrage_rate/day  : {terms.demurrage_rate_per_day_usd}")
    print(f"  laytime_allowance_h : {terms.laytime_allowance_hours}")
    print(f"  rule_authority      : {terms.rule_authority}")

    print("\n=== Reconciliation (LLM-extracted inputs) ===")
    print(f"  owner_total_usd     : {rec.owner_total_usd}")
    print(f"  charterer_total_usd : {rec.charterer_total_usd}")
    print(f"  reconciled_total_usd: {rec.reconciled_total_usd}")
    print(f"  disputed_items      : {len(rec.disputed_items)}")
    for it in rec.disputed_items:
        print(f"    - {it.disputed_date}  winner={it.verdict.winner}  "
              f"credited_to_owner={it.verdict.dollars_credited_to_owner_usd}")


if __name__ == "__main__":
    main()
