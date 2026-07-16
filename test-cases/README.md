# Reconciliation test cases

A small library of end-to-end reconciliation scenarios, one per folder, used to
verify the Keel pipeline (`parse → extract → calculate → reconcile`) against
known answers.

Each case ships **real-format source documents with crafted numbers**: the PDFs
are modelled on genuine maritime paperwork (GENCON-1994-style charter party with
BIMCO 2013 WWD wording, standard Statement of Facts event logs, BIMCO-style
demurrage claims) but the figures are hand-authored so every case ties out to a
single, checkable result.

## Folders

| Case | Scenario | Owner | Charterer | Reconciled |
|------|----------|------:|----------:|-----------:|
| `case_01_clean_voyage` | No weather dispute — figures pass through unchanged | 90,000 | 90,000 | **90,000** |
| `case_02_owner_win_marginal` | Force 5, ops not prevented → below BIMCO 2013 threshold → owner credited | 130,000 | 80,000 | **104,000** |
| `case_03_charterer_win_storm` | Sustained Force 8 + heavy rain, ops prevented → exception upheld | 150,000 | 90,000 | **90,000** |
| `case_04_split_decision` | Two windows: one owner-win (Force 4), one charterer-win (Force 9) | 175,000 | 100,000 | **125,000** |

Each folder contains:

```
charterparty.pdf              # source docs (provenance / live-LLM input)
sof_owner.pdf  sof_charterer.pdf
claim_owner.pdf  claim_charterer.pdf
weather_port_xyz.json         # independent hourly port weather records
extracted_charterparty.json   # seeded LLM extraction (cache-first → offline & deterministic)
extracted_sof_owner.json  extracted_sof_charterer.json
extracted_owner_claim_amount.json  extracted_charterer_claim_amount.json
expected.json                 # hand-authored answer asserted by the checking loop
manifest.md                   # sources + hand-computed working for this case
```

## The checking loop

`apps/api/tests/test_reconciliation_cases.py` walks every folder here and asserts
the pipeline reproduces that folder's `expected.json` — owner / charterer /
reconciled totals plus each disputed day's verdict. It runs **offline and
deterministically**: because the seeded `extracted_*.json` files are present,
`keel_api.pipeline._load_or_extract` takes its cache-first branch and never calls
the LLM. New folders are picked up automatically.

```
uv --project apps/api run pytest apps/api/tests/test_reconciliation_cases.py -v
```

The expected values are written as hand-authored literals in the generator's
`CASES` table, **not** recomputed with the same arithmetic the engine uses — so
the test is a genuine independent check, not a tautology.

## Live-LLM proof (the real upload path)

To prove the documents actually flow through the real extraction path — the same
`run_voyage_pipeline` that `POST /voyages` runs in the background — `case_02` was
run with its seeded cache removed, forcing live LLM extraction:

```
set -a; source .env; set +a
uv --project apps/api run python test-cases/_live_llm_proof.py case_02_owner_win_marginal
```

The script copies the case to a temp dir, deletes the `extracted_*.json` cache,
and runs the pipeline (it never modifies this folder). With the configured NVIDIA
NIM model (`meta/llama-3.1-8b-instruct`) reading the real PDFs, the live run
reproduced the hand-authored answer exactly:

```
owner_total_usd      : 130000.0
charterer_total_usd  : 80000.0
reconciled_total_usd : 104000.0
disputed_items       : 1
  - 2026-07-05  winner=owner  credited_to_owner=24000.0
```

## Regenerating

All data files are generated from a single table in
`test-cases/_generate_fixtures.py` (PyMuPDF for the PDFs). Edit `CASES` and run:

```
uv --project apps/api run python test-cases/_generate_fixtures.py
```
