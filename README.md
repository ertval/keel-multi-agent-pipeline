# Keel

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![LangGraph](https://img.shields.io/badge/LangGraph-StateGraph-orange?style=flat-square)](https://github.com/langchain-ai/langgraph)
[![Pydantic](https://img.shields.io/badge/Pydantic-V2-E28743?style=flat-square&logo=pydantic&logoColor=white)](https://docs.pydantic.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)

A demurrage reconciliation tool for maritime charterparties. One analyst uploads
a charterparty, both parties' Statements of Facts, both claim PDFs, and a port
weather record. An LLM reads the documents into Pydantic schemas, a pure-Python
state machine computes laytime and demurrage for each party separately, a
deterministic evaluator tests each disputed weather window, and the difference
between the two positions is reconciled into one number with a per-day audit
trail and a settlement letter rendered as HTML.

The dollars never come from the model. The LLM extracts text into schemas
(`apps/api/keel_api/extraction/extractor.py`); every figure is arithmetic in
`apps/api/keel_api/engine/state_machine.py` and
`apps/api/keel_api/rules/evaluators.py`.

Roadmap: [docs/continuation-plan.md](docs/continuation-plan.md).

---

## What this is not

Read this before anything else. Each item below is a claim the code does not
support, and several of them appear in older versions of these docs.

- **No authentication.** The FastAPI service is anonymous by default. CORS is
  narrowed to `http://localhost:3000` (`apps/api/keel_api/main.py:547`) and an
  optional shared `KEEL_API_TOKEN` can be set (`main.py:550-552`), but unset is
  the default and no route requires identity. The frontend's `proxy.ts` is a UI
  convenience whose own first line says it is not authentication: the cookie it
  checks is a published constant (`apps/web/proxy.ts:5-16`, `:24`).
- **No source PDFs in this checkout.** The sanitised public copy ships no PDFs.
  The PDF viewer therefore cannot render a document, and 16 parser and
  extraction tests are quarantined (see [Tests](#tests)).
- **No email, no delivery, no PDF export.** `GET /voyages/{id}/letter` serves
  HTML only and rejects `?format=pdf` with a 400 pointing at the browser's
  Print → Save as PDF (`main.py:757-772`). The page-level *Send to Other Party*
  button (`apps/web/app/(dashboard)/voyage/[id]/letter/page.tsx:126`) opens a
  Delivery modal whose dialog reads "Not sent — no delivery service is connected"
  (`:383`) — the string is inside the modal (`DialogTitle` at `:348`,
  `DialogFooter` at `:387`), not on the page. The reports page exports **CSV
  only** (`apps/web/app/(dashboard)/reports/page.tsx:466-473`).
- **No trial, no sign-up, no account, no sales process.** `/register` was deleted
  as a fabrication, and every landing design states it in the product copy:
  *"Accounts and sign-in. The entry page sets a flag in your browser; nothing is
  checked and no account exists."*
  (`apps/web/app/landing/content.ts:164`, `DOES_NOT_RUN[0]`, which all eleven
  variants render under *Not in this build*).
- **No settings page, and no dead navigation to one.** The sidebar has exactly
  four items — Dashboard, Voyages, Reconciliations, Reports
  (`apps/web/components/AppSidebar.tsx:35-40`). A `Settings` link pointing at `href="#"`
  was removed rather than shipped.
- **No certification.** No SOC 2, no ISO, no GDPR certification, no
  "enterprise-grade" claim. Nothing asserts one any more: the line that used to
  say so on the landing page is gone, and all eleven designs render their claims
  from `apps/web/app/landing/content.ts`. A case-insensitive search of
  `apps/web/app/landing/` for `soc|iso|gdpr|certif` returns only variable names
  (`isOwner`, `isolate`) and the word *certification* in that file's own module
  docstring (`:6`), which is a warning to a variant not to invent one.
  `apps/web/app/page.tsx` is a 38-line router over the designs and holds no copy
  at all.
- **No customer data, no logos, no testimonials, no throughput numbers.** The
  only voyage is the Piraeus fixture `voyage_001`. Rows `voyage_002` …
  `voyage_007` in `apps/web/lib/api.ts` are unreachable fallback rows that exist
  only to draw the list pages when the API is down, and `lib/api.ts:422-427`
  says so. This is now unconditionally true: `apps/api/tests/conftest.py` points
  `KEEL_DB` at a per-session throwaway file before anything imports `store`, so
  the suite can no longer write test voyages into the demo database (see
  [Tests](#tests)).
- **Advisory output.** Not a legal opinion, not an arbitration award. The letter
  footer says so (`apps/api/keel_api/letter/render.py:108-111`).

---

## Honest status by subsystem

| Subsystem | State | Where |
|---|---|---|
| LangGraph graph (7 nodes, join, bounded retry) | Works; asserted by tests | `apps/api/keel_api/pipeline_agents.py:642-689` |
| Pure-Python laytime engine | Works; unit-tested | `apps/api/keel_api/engine/state_machine.py` |
| Weather-exception evaluator | Works; definition 16 measure | `apps/api/keel_api/rules/evaluators.py` |
| Reconciliation + frontend adapter | Works | `pipeline_agents.py:462-603`, `adapters.py` |
| Canonical $112,000 path | Green, 15 tests | `apps/api/tests/test_canonical.py`, `test_reconciliation_cases.py` |
| Document parsing | Works, but **cannot be exercised here** — no PDFs ship | `apps/api/keel_api/parsing/` |
| LLM extraction | Written; **not exercisable without a key or the JSON cache** | `apps/api/keel_api/extraction/extractor.py` |
| Upload path | Works and is hardened | `main.py:775-872` |
| Frontend | Next.js 16, typechecks, lints, builds, 38 e2e green | `apps/web/` |
| Human-in-the-loop review of extracted terms | **Not built** | — |
| Live weather provider | **Not implemented** (fixture provider only) | `apps/api/keel_api/weather/fixture_provider.py` |
| PDF export of the letter | **Not implemented** (HTML only) | `main.py:757` |
| Email / counterparty delivery | **Not implemented** | — |

---

## Prerequisites

| Tool | Version used here | Notes |
|---|---|---|
| Python | 3.11+ | `apps/api/pyproject.toml:8` requires `>=3.11` |
| [uv](https://github.com/astral-sh/uv) | 0.11.16 | CI pins this exact version |
| Node.js | 22.23.3 in CI | 24.11.0 also works locally |
| pnpm | 11.4.0 in CI and locally | `packageManager` is absent from `apps/web/package.json`, so CI pins it itself |
| `OPENAI_API_KEY` | optional | only needed for a live extraction; see below |

There is no Docker Compose file in this repo.

---

## Setup and run

### Backend

```bash
cd apps/api
uv sync
uv run uvicorn keel_api.main:app --host 127.0.0.1 --port 8000
```

On startup the API seeds the demo voyage `voyage_001` into SQLite at
`apps/api/keel.db` (`main.py:509-533`, `536-543`). The database file is
gitignored (`.gitignore:84`).

> **Delete `apps/api/keel.db` before a backend run.** A stale WAL/SHM pair left by
> a previous process makes seeding fail with a lock error, and the lifespan
> swallows it (`main.py:539-542`), so the API comes up with no demo voyage and
> the frontend renders empty lists.
>
> ```bash
> rm -f apps/api/keel.db apps/api/keel.db-wal apps/api/keel.db-shm
> ```
>
> This is still needed, and it is *only* about a half-written database left by a
> previous API process. It is no longer about the test suite:
> `apps/api/tests/conftest.py` points `KEEL_DB` at a per-session throwaway file
> under the system temp directory and deletes it on exit, so running the suite
> leaves `apps/api/keel.db` untouched. Before that file existed, `uv run pytest`
> wrote roughly fifty `voyage_*` test rows into the live demo database, and
> `GET /voyages` returned them alongside `voyage_001`.

Confirm it seeded before trusting anything else — this is what CI waits for:

```bash
curl -s http://127.0.0.1:8000/voyages | grep -o '"voyage_id":"voyage_001"'
```

Interactive API docs: <http://127.0.0.1:8000/docs>.

### Frontend

```bash
cd apps/web
pnpm install
pnpm dev
```

The install belongs in `apps/web/`, not the repo root. The root `pnpm-lock.yaml`
has an empty importer (`.: {}`) and there is no root `pnpm-workspace.yaml`, so a
root `pnpm install` resolves nothing for the app. `apps/web/pnpm-lock.yaml` is
the canonical lockfile; the old `apps/web/package-lock.json` was deleted.

`apps/web/pnpm-workspace.yaml` is the file that governs that install, and it is
load-bearing. Its `allowBuilds` map runs the postinstall hooks for `sharp` (Next
image optimisation) and `unrs-resolver` (without which `eslint` dies at require
time), and explicitly denies `msw` and `core-js`. `minimumReleaseAge: 0` is set
alongside it. Delete the file and `pnpm run lint` stops working; nothing else in
the tree names it.

### Both at once

From the repo root:

```bash
pnpm dev
```

This runs `dev:web` and `dev:api` concurrently (`package.json:6-8`). Verified: both
services answer within 4 s and `voyage_001` is seeded.

- Frontend: <http://localhost:3000>
- API: <http://127.0.0.1:8000>

### Does the frontend need an API key?

No, for the demo path. `_all_extracts_cached` (`pipeline_agents.py:95-97`)
requires all five `extracted_*.json` files in the fixture directory, and
`fixtures/voyage_001/` ships all five, so the graph never calls the LLM. A live
extraction still needs `OPENAI_API_KEY`, plus optionally `OPENAI_BASE_URL` and
`OPENAI_MODEL` (`extractor.py:52-67`; see `.env.example`).

Every landing design states the same thing in its **footer**: *"The bundled
voyage runs without a key. Extracting from your own documents needs an OpenAI
key."* (`apps/web/app/landing/content.ts:189`, in `FOOTER.notes`, rendered by all
eleven variants). An earlier version of that line read "Live OpenAI key
required", which was false for the demo path.

### Uploads are bounded

A voyage is five PDFs and one weather record, so every ceiling is an order of
magnitude above a real upload (`main.py:175-194`):

| Limit | Default | Env override |
|---|---|---|
| Bytes per document | 25 MB | `KEEL_MAX_UPLOAD_BYTES` |
| Bytes per request | 60 MB | `KEEL_MAX_REQUEST_BYTES` |
| Documents per request | 12 | `KEEL_MAX_FILES` |
| Weather observations | 20,000 | — (`main.py:190`) |
| Concurrent pipeline runs | 4 | `KEEL_MAX_CONCURRENT_RUNS` |
| Pages per PDF | 200 | — (`parsing/limits.py:27`) |
| Extracted characters | 1,200,000 | — (`parsing/limits.py:28`) |
| Parser address space | 3,000,000,000 bytes | `KEEL_PARSE_AS_LIMIT` (`sandbox.py:38`) |
| Parser wall clock | 120 s | `KEEL_PARSE_TIMEOUT` (`dispatcher.py:46`) |

Two of those four numbers were raised in the last hardening pass and the change
is a trade-off, not a free win: see
[the parser ceilings in the security posture](#security-posture-and-its-limits)
and known limitation 19.

Exceeding the run-slot cap returns **429** (`main.py:842-849`); exceeding a byte
ceiling returns **413**; a hostile filename, an unsupported content type, or a
planted cache file returns **400**. Parsing runs in a fork+exec'd child process
with `RLIMIT_AS` installed before the PDF libraries import
(`parsing/sandbox.py:86-98`, `parsing/dispatcher.py:102-113`), so a hostile
document cannot take the API worker down.

The extraction cache files are **server-owned**. `_cached_extracts.json` and
`expected_reconciliation.json` are refused by name, and any name starting with
`extracted_` is refused as a prefix (`main.py:204-205`, `244-250`). A client that
could plant those would choose the reconciled dollars and the LLM would never be
consulted. The one JSON a client may supply is `weather_port_xyz.json`.

---

## The canonical scenario

`fixtures/voyage_001` — a Piraeus grain voyage, charterparty, two statements of
facts, two claim PDFs, and an hourly port weather log.

| Figure | Value |
|---|---|
| Owner claim | **$187,000** |
| Charterer claim | **$62,000** |
| Reconciled total | **$112,000** |
| 14 June 2026 | owner wins, $25,000 credited |
| 15 June 2026 | owner wins, $25,000 credited |
| 16 June 2026 | charterer wins, $0 credited |

The arithmetic is `charterer base + items favouring the owner`:

```
$62,000 (charterer base) + $50,000 (items favouring the owner's position) = $112,000
```

Verified against a running API:

```console
$ curl -s http://127.0.0.1:8000/voyages/voyage_001 | python3 -c "..."
owner      187000.0
charterer  62000.0
reconciled 112000.0
math       $62,000 (charterer base) + $50,000 (items favouring the owner's position) = $112,000
2026-06-14 owner      25000.0 CP_WEATHER.MAJORITY_OF_HOURS | Laytime Definitions for Charter Parties 2013, definition 16
2026-06-15 owner      25000.0 CP_WEATHER.MAJORITY_OF_HOURS | Laytime Definitions for Charter Parties 2013, definition 16
2026-06-16 charterer     0.0 CP_WEATHER.MAJORITY_OF_HOURS | Laytime Definitions for Charter Parties 2013, definition 16
```

### Where the weather threshold comes from

The threshold and the test for invoking the weather exception come from **the
charterparty**, not from any ruleset.

The *Laytime Definitions for Charter Parties 2013* (BIMCO Special Circular No. 8)
supplies **only the measurement basis** for an excepted period — definition 16, the
actual period of interruption (`rules/evaluators.py:60`). Those definitions set
**no numeric weather threshold**: they contain no wind force and no precipitation
figure (`evaluators.py:21-25`). Accordingly:

| Field | Value | Meaning |
|---|---|---|
| `Verdict.rule_authority` | `custom` | No source document is the authority for the test or the threshold (`evaluators.py:65`) |
| `Verdict.measurement_basis` | `Laytime Definitions for Charter Parties 2013, definition 16` | The source that fixes the measure |
| `Verdict.rule_id` | `CP_WEATHER.MAJORITY_OF_HOURS` | Names the test this product applied; not a citation and carries no definition number |
| Threshold | clause-derived, else Keel's configured default | `BEAUFORT_THRESHOLD = 6`, `PRECIPITATION_THRESHOLD_MM = 2.0` (`evaluators.py:54-55`) |

When the LLM reads a threshold off the charterparty text, the UI and the letter
name the clause it came from. When it cannot, they say the figure is Keel's
configured default and **has not been verified against the charterparty text**
(`evaluators.py:94-108`).

The **strict-majority-of-hours** invocation test is **this product's own policy**,
not a BIMCO test. It reads a charterparty clause that says the threshold must be
recorded "for a majority of the hours of the period claimed"
(`evaluators.py:31-34`). `evaluate_wwd_exception` has **four** justification
paths and only **two** of them carry that disclosure in words:

| Path | Says the majority test is this product's own policy? |
|---|---|
| Upheld — `evaluators.py:195-206` | **Yes.** "…that share test is this product's own policy against the charterparty clause, and it is not a test drawn from the Laytime Definitions…" |
| Short of a majority — `evaluators.py:207-216` | **Yes**, in a shorter form: "The strict-majority test applied here is this product's own policy reading the charterparty clause, not a test drawn from the Laytime Definitions." |
| Majority met, operations not prevented — `evaluators.py:217-225` | **No.** It explains why operational impact must be evidenced and names the measurement basis, but says nothing about the majority test's provenance. |
| No observations — `evaluators.py:158-173` | **No.** It names the measurement basis only. |

So the disclosure is not on every verdict. It is on both majority-judged paths,
which is where a reader is being asked to accept the share test; the two paths
that turn on operational evidence rather than on the share do not repeat it. The
canonical run exercises the first two paths (14 and 15 June are short of a
majority, 16 June is upheld) and so does carry the disclosure on all three days.

No document, string, rule id, or field in this repo attributes a numeric weather
threshold to BIMCO. `tests/test_adapters.py:144` and `:211-212` assert that
`bimco_clause.clause_id` and the position sentences never contain "bimco", and
`tests/test_api_hardening.py:675-681` asserts the letter footer does not claim
BIMCO 2013 is the authority.

---

## Tests

### Backend

```bash
cd apps/api
uv run pytest -q
```

**Real output — 16 failures are expected and quarantined:**

```console
$ uv run pytest -q
...
FAILED tests/test_extraction.py::test_extract_charterparty_terms_returns_correct_type
FAILED tests/test_extraction.py::test_extract_sof_events_returns_list_of_sof_events
FAILED tests/test_extraction.py::test_extract_sof_events_timestamps_are_datetimes
FAILED tests/test_fixtures.py::test_fixture_file_exists[charterparty.pdf] - A...
FAILED tests/test_fixtures.py::test_fixture_file_exists[sof_owner.pdf] - Asse...
FAILED tests/test_fixtures.py::test_fixture_file_exists[sof_charterer.pdf] - ...
FAILED tests/test_fixtures.py::test_fixture_file_exists[claim_owner.pdf] - As...
FAILED tests/test_fixtures.py::test_fixture_file_exists[claim_charterer.pdf]
FAILED tests/test_parsers.py::test_parse_returns_nonempty_pages[charterparty.pdf]
FAILED tests/test_parsers.py::test_parse_returns_nonempty_pages[sof_owner.pdf]
FAILED tests/test_parsers.py::test_parse_returns_nonempty_pages[sof_charterer.pdf]
FAILED tests/test_parsers.py::test_parse_returns_nonempty_pages[claim_owner.pdf]
FAILED tests/test_parsers.py::test_parse_returns_nonempty_pages[claim_charterer.pdf]
FAILED tests/test_parsers.py::test_charterparty_has_text_content - pymupdf.Fi...
FAILED tests/test_parsers.py::test_sof_owner_has_table_rows - FileNotFoundErr...
FAILED tests/test_parsers.py::test_sof_charterer_has_table_rows - FileNotFound...
16 failed, 338 passed, 1 skipped in 39.89s
```

**Why they fail:** the sanitised public checkout ships no PDFs.
`fixtures/voyage_001/` holds eight JSON files and no `*.pdf`, so the three tests
in `test_extraction.py`, the five `test_fixture_file_exists` parameters, and the
eight tests in `test_parsers.py` cannot pass here. 355 tests are collected; 16
fail; 338 pass; 1 is skipped — and that one skip is
`tests/test_extraction.py:136: OPENAI_API_KEY not set`, which is **not**
PDF-dependent, so it does not become a 17th quarantine when the PDFs come back.

The north-star gate:

```bash
uv run pytest -m canonical -q
```

```console
$ uv run pytest -m canonical -q
...............                                                          [100%]
15 passed, 340 deselected in 4.26s
```

Those 15 are 3 in `test_canonical.py` and 12 in
`test_reconciliation_cases.py` (4 cases × totals, verdicts, and authority).

`-k canonical` selects a wider set, because it also matches tests whose *names*
contain "canonical" rather than the marker:

```console
$ uv run pytest -k canonical -q
19 passed, 336 deselected in 3.95s
```

**The suite does not touch the demo database.** `apps/api/tests/conftest.py`
points `KEEL_DB` at a throwaway file under the system temp directory whose name
carries the pytest process id, so two sessions on one machine never share one
file (`tests/conftest.py:19-20`), and deletes that file and its WAL/SHM sidecars
both before the suite and at interpreter exit (`:23-29`). `store._db_path()`
resolves `KEEL_DB` (`store.py:29`). Without that file the suite shared
`apps/api/keel.db` with the running API and wrote ~50 `voyage_*` test rows into
it; `DELETE /voyages/voyage_001` is refused (`main.py:699-717`) and `voyage_001`
is only re-seeded at startup, so the damage survived a restart. Verified — the
throwaway file exists while the suite runs and is gone afterwards, and the demo
database is never created:

```console
$ cd apps/api && rm -f keel.db* ; (uv run pytest -q &) ; sleep 12
$ ls /tmp/keel-pytest-*.db*
/tmp/keel-pytest-4762.db  /tmp/keel-pytest-4762.db-shm  /tmp/keel-pytest-4762.db-wal
$ ls keel.db
ls: cannot access 'keel.db': No such file or directory
$ wait ; tail -1
16 failed, 338 passed, 1 skipped in 31.71s
$ ls /tmp/keel-pytest-*.db*
ls: cannot access '/tmp/keel-pytest-*.db*': No such file or directory
```

The CI backend job runs the same suite with a **16-entry `--deselect` list** and
additionally audits that each deselected test still fails *and* still fails
because of a missing fixture PDF. Reproduced locally:

```console
$ uv run pytest -q --deselect <the 16 node ids from KNOWN_MISSING_PDF_TESTS>
338 passed, 1 skipped, 16 deselected in 33.23s
```

### Frontend

```bash
cd apps/web
pnpm exec tsc --noEmit          # exit 0, no output
pnpm run lint                   # ✖ 4 problems (0 errors, 4 warnings)
pnpm run build                  # exit 0, 12 routes
```

The 4 lint warnings are the budget CI enforces with `--max-warnings 4`: three
`@next/next/no-img-element` (`apps/web/app/(auth)/login/page.tsx:149`,
`apps/web/app/(dashboard)/voyage/[id]/letter/page.tsx:195`,
`apps/web/components/AppSidebar.tsx:73`) and one
`@typescript-eslint/no-unused-vars` (`public/theme-init.js:9`).

`pnpm run build` is a **real gate**, not a formality: `tsc` and `eslint` both pass
on code `next build` rejects. Its route table:

```console
Route (app)
┌ ƒ /
├ ○ /_not-found
├ ○ /dashboard
├ ○ /login
├ ○ /reconciliations
├ ○ /reports
├ ƒ /voyage/[id]
├ ƒ /voyage/[id]/letter
├ ƒ /voyage/[id]/reconcile
└ ○ /voyages

ƒ Proxy (Middleware)
```

`/` is `ƒ` because it resolves a variant key from `searchParams` on the server,
which opts the route out of prerendering. The landing page is a **variant
system**: `?v=<key>` selects one of **eleven** designs from
`apps/web/app/landing/`, and a bare URL renders the default. The keys and labels
are `VARIANT_OPTIONS` in `apps/web/app/landing/registry.ts:30-42` — `statement`
(default), `telemetry`, `gazette`, `blueprint`, `swiss`, `stateflow`, `carbon`,
`dusk`, `pleading`, `radar`, `manifest` — in files `v1-statement.tsx` …
`v11-manifest.tsx`. An unrecognised key renders the default rather than 404ing.
`app/page.tsx` itself is a 38-line router over them and holds no copy:
`apps/web/app/landing/content.ts` is the single source of truth for every claim
any design makes, and a design may arrange that copy but never restate it. Fonts
are self-hosted through `next/font/google` in `apps/web/app/layout.tsx:33-43`.

### End-to-end

A running backend on `127.0.0.1:8000` is required: every spec reads the seeded
demo voyage.

```bash
rm -f apps/api/keel.db apps/api/keel.db-wal apps/api/keel.db-shm
cd apps/api && uv run uvicorn keel_api.main:app --host 127.0.0.1 --port 8000 &
cd apps/web && pnpm exec playwright test
```

```console
$ pnpm exec playwright test
  ...
  40 passed
```

The 38 is the claim; the duration is not one. This run reuses an
already-running `next dev` on a loaded machine, and the suite is deliberately
built around real page loads rather than mocks.

`playwright.config.ts` starts `next dev` itself on `127.0.0.1:3000` and drives a
single `chromium` project.

---

## CI

`.github/workflows/ci.yml` — 4 jobs (`repo`, `backend`, `frontend`, `e2e`) on
`ubuntu-24.04`, with uv `0.11.16` / Python 3.11, Node 22.23.3, pnpm 11.4.0.

| Job | Gates |
|---|---|
| `repo` | 47 build-critical paths are tracked (`git ls-files --error-unmatch`), and the tracked `app/landing/*.tsx` set is the one that list names; every JSON under `fixtures/` and `test-cases/` parses, with a floor of 20; `python3 -m compileall -q scripts/ test-cases/` |
| `backend` | `uv sync --locked`; `pytest -q` with the 16-entry deselect list; an audit that reads exception **types** from JUnit XML; `pytest -m canonical -q` |
| `frontend` | `pnpm install --frozen-lockfile`; `tsc --noEmit`; `pnpm run lint --max-warnings 4`; `pnpm run build` |
| `e2e` | start the API and wait for a seeded `voyage_001`; `playwright test --fail-on-flaky-tests`; upload the Playwright report (`if: always()`) |

> **This workflow has never run on GitHub Actions.** It has only been driven
> locally. Every gate above was verified in this checkout; none of it has a
> GitHub Actions run behind it.

The tracked-path gate **passes** on this tree: nothing is untracked, and all 47
entries in the list resolve in the index. The list lives at `ci.yml:38-86` and
its length is asserted at `ci.yml:90` (`expected=47`), so adding or removing a
path means editing two places on purpose. A second assertion in the same step
(`ci.yml:113-129`) compares the tracked set of `apps/web/app/landing/*.tsx`
against the list's set of them, because a length check cannot see a file that was
never written down.

```console
$ git ls-files --others --exclude-standard | wc -l
0
```

**Eight build-critical files were missing from that list** across two passes, and
each was the same defect the gate exists to catch — a path the build needs that no
other gate can name:

- `apps/api/tests/conftest.py` — a clean checkout without it runs the suite
  against `apps/api/keel.db` and writes test voyages into the demo database the
  running API serves `voyage_001` from.
- `apps/api/tests/test_parsing_sandbox.py` — 23 tests, and the only coverage of
  `DEFAULT_ADDRESS_SPACE_BYTES`, `DEFAULT_PARSE_TIMEOUT_SECONDS` and
  `MAX_EXTRACTED_CHARS`. A clean checkout without it silently loses every test
  that pins the parser ceilings.
- `apps/web/app/layout.tsx`, `apps/web/app/globals.css`,
  `apps/web/components/AppSidebar.tsx`, `apps/web/tests/e2e/smoke.spec.ts`,
  `apps/web/tests/e2e/demo-workflow.spec.ts`, `apps/web/playwright.config.ts` —
  the root layout, its stylesheet, the sidebar, two specs and the Playwright
  config.

With the two backend files omitted, the gate printed `All 23 build-critical paths
are tracked` and exited 0 on a tree where both were untracked. With
`apps/web/app/layout.tsx` untracked it printed `All 41 build-critical paths are
tracked` and exited 0 as well, and `next build` then failed. Both are recorded
findings rather than runs reproduced here, but the failure mode is the point:
`git diff --exit-code` and `git add -A --dry-run` report nothing at all for a
file that was simply never committed, so a length assertion alone can only catch
the mistake of writing the wrong number, not the mistake of omitting a path.

Without any of them, a clean checkout cannot typecheck, cannot build, and cannot
import the parsing package. `apps/web/lib/` in particular was **entirely
untracked** while **20** tracked `.ts`/`.tsx` files imported from it:

```bash
$ git ls-files apps/web | grep -E '\.tsx?$' | xargs grep -l '@/lib' | wc -l
20
```

All four of its files are tracked now — `git ls-files apps/web/lib/` lists
exactly `api.ts`, `sanitize-html.ts`, `types.ts` and `utils.ts`. A 21st hit shows
up if you drop the extension filter — `apps/web/components.json` carries
`@/lib/utils` and `@/lib` in its alias config. It is neither `.ts` nor `.tsx`, so
it is not one of the 20.

---

## Security posture, and its limits

What the code actually does:

- **CORS narrowed.** `allow_origins` defaults to `["http://localhost:3000"]`,
  overridable by `KEEL_CORS_ORIGINS` (`main.py:547`, `601-607`).
- **Optional shared token.** Setting `KEEL_API_TOKEN` makes every route except
  `/healthz` require it, compared with `hmac.compare_digest`, accepted via
  `Authorization: Bearer` or `X-Keel-Token` (`main.py:546-552`, `562-594`).
- **Upload admission.** Every filename and part count is checked before anything
  is opened for writing; the name is reduced to its final path component and
  then re-checked for containment (`main.py:215-241`, `775-801`).
- **Content validation.** `%PDF-` magic-byte check, content-type allowlist
  (`application/pdf`, `application/json`), per-observation Pydantic validation of
  the weather record (`main.py:283-325`).
- **Server-owned names refused.** `_cached_extracts.json`,
  `expected_reconciliation.json`, and every `extracted_*` name (`main.py:204-205`,
  `244-250`).
- **Bounded parsing in a subprocess.** Fork+exec, `RLIMIT_AS`, wall-clock
  timeout (`parsing/sandbox.py:86-98`, `parsing/dispatcher.py:102-124`). The ceilings
  are 3,000,000,000 bytes and 120 s, and that is a trade-off, not a free win —
  read the next paragraph before you rely on it.
- **Request admission middleware.** 413 on an over-large `Content-Length`; 401
  when a token is required and absent (`main.py:562-594`).
- **Upload working directory deleted** when the run ends (`main.py:501-505`).
- **Letter response hardened.** `Content-Security-Policy: default-src 'none';
  style-src 'unsafe-inline'`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: no-referrer` (`main.py:750-754`).
- **Letter HTML sanitised in the browser** on an allowlist, before injection
  (`apps/web/lib/sanitize-html.ts`).

> **The parser ceilings were raised, and that is a trade-off this repository
> chose deliberately.** The address-space default went 1,000,000,000 →
> 3,000,000,000 bytes (`parsing/limits.py:36`) and the wall clock 60 s → 120 s
> (`:40`), because the old numbers were refusing *legitimate* documents rather
> than hostile ones. Measured on this tree by binary-searching the address space
> until a parse flips: a sparse 200-page document needs 0.31 GB, a 40-page dense
> document 0.51 GB, and a 200-page dense document — roughly 894,000 extracted
> characters — **2.03 GB** (`limits.py:10-12`). A 1 GB default therefore
> **rejected a real charterparty**, which is the opposite of what a backstop is
> for. The new 3 GB default sits about 48% above that 2.03 GB worst legal case,
> and 150 MB of interpreter-and-library floor plus ~2 kB for every character the
> 1,200,000-character ceiling allows comes to 2.55 GB, still comfortably inside
> it (`limits.py:16-19`, `:32-35`). The cost, stated plainly: **a hostile
> 200-page document can now hold a parser child process for up to 120 seconds
> and about 2.55 GB of address space.** What still bounds it is the
> extracted-character ceiling, the page ceiling (200, and it is the one check
> that happens *before* any page is expanded, `limits.py:27`), and the
> in-process run-slot cap of 4 concurrent pipeline runs (`main.py:194`,
> `842-849`): a caller cannot start a fifth run, and a run can hold one parse
> for two minutes. Whether two minutes and 2.55 GB per parse is the right
> ceiling for your deployment is a judgement this repository does not get to
> make for you.

What it does not do, and you should assume it does not:

- **No identity.** `KEEL_API_TOKEN` is off by default and is a single shared
  secret, not per-user identity.
- **No tenancy.** One `voyages` table, no `tenant_id` (`store.py:36-42`).
- **No rate limiting** beyond the concurrent-run cap.
- **No encryption at rest.** SQLite, plaintext, on local disk.
- **The frontend guard is not a boundary.** `apps/web/proxy.ts:5-16` says so
  itself: the cookie is a published constant and the API behind it is open by
  default. `apps/web/app/(auth)/login/page.tsx:12-15` repeats it.
- **The API reference is unauthenticated.** `/docs`, `/redoc` and
  `/openapi.json` answer 200 to any caller, because `FastAPI(...)` is
  constructed with no `docs_url`/`redoc_url`/`openapi_url` override
  (`main.py:597`) and `KEEL_API_TOKEN`, when set, exempts nothing else on a
  route FastAPI itself serves. The exposure is small and was measured, not
  guessed: **7 documented paths, 4 schemas, no internal model leaked** — the
  schemas are `Body_upload_voyage_voyages_post`, `HTTPValidationError`,
  `StatusUpdateRequest` and `ValidationError`, and no route returns document
  bytes. It does tell an anonymous caller that this service exists, what it
  accepts and what it returns, which is reconnaissance. It is on the roadmap as
  a one-line `main.py` change; see
  [docs/continuation-plan.md §16](docs/continuation-plan.md#16-three-disclosures-that-are-not-steps).
- **The letter sanitiser keeps the letter's own stylesheet, and its reject list
  is not a CSS parser.** `sanitizeLetterHtml` hoists a `<style>` element found in
  the   parsed `<head>` so the letter keeps its typography, and
  `serializeStyleSheet` refuses an empty sheet, one containing `<` or `>`, and
  one containing `@import`, `url(`, `expression(` or `javascript:`
  (`lib/sanitize-html.ts:104-107`). A `<style>` element anywhere else — in the
  body — is dropped with its content (`DROP_WITH_CONTENT`, `:67-94`, consulted
  at `:117` before the element is looked at any further), and the `style`
  *attribute* is never kept. What is not covered: a head-level sheet that
  fetches without any of those five tokens, e.g.
  `p{background-image:image-set("//host/x.png")}`, passes. Verified in Chromium:
  `url()`, `@import` and `expression()` sheets issue no request and a body-level
  sheet issues none, but a surviving `image-set()` sheet **does** issue an
  off-document GET. The letter is injected into the app's own page, which
  carries no CSP, so the API's `style-src 'unsafe-inline'` does not contain it.
  No script executes — `window.__XSS` was never set in any probe — but an
  off-document request is a channel. Fixing it properly means comparing the
  sheet against the one the template ships rather than pattern-matching CSS; it
  is on the roadmap, not done here.
- **No document bytes are served.** `_pdf_urls` publishes citation keys only; the
  fixture tree is not routed and an upload's directory is deleted when its run
  ends (`main.py:429-441`). There is therefore no PDF preview in this build even
  if the PDFs were present.
- **Demo seed is a fixture, not a user.** `_seed_demo_voyage` re-runs the
  pipeline on `fixtures/voyage_001` at every startup (`main.py:509-533`).
  `voyage_001` cannot be deleted (409, `main.py:699-717`).

---

## Known limitations

These are recorded in the code's own docstrings. They are not hidden here.

1. **Definition 15's pro-rata is arithmetic only.** `_pro_rata_struck_off_hours`
   exists and returns `interruption_hours * 24 / working_day_hours`, but **no
   `weather_clause` value selects it** and `calculate` never calls it: the ratio
   runs against a stated working day, and `CharterpartyTerms` carries no
   working-day term. Adding one is a contract change, not an engine change.
   (`engine/state_machine.py:83-86`, `:106-109`, `:196-209`)
2. **Definition 17's artificial working day is not modelled.**
   `_struck_off_hours` returns the same hours for `ACTUAL_PERIOD` and
   `ARTIFICIAL_DAY`, so a `WWDSHEX` or `WWDSHINC` charterparty is computed on the
   actual-period measure. Definition 17 counts 24 *working* hours, so such a
   charterparty over-credits the charterer. No test asserts the artificial day
   changes the exclusion, because it does not.
   (`engine/state_machine.py:88-96`, `:184-193`)
3. **The engine always suspends demurrage for a weather stoppage.** It does not
   implement definition 30's conditional here: `WEATHER_DELAY_START` suspends
   accrual whether the vessel is on laytime or on demurrage, unconditionally, and
   no clause is consulted. That is correct for a charterparty drafted to cover
   the claimed period — the canonical fixture's **Clause 4.1** does — and wrong
   for one that did not, where definition 30 would bar the suspension. No
   contract field distinguishes the two cases.
   (`engine/state_machine.py:19-36`)
4. **Clause numbering in the audit trail does not match the charterparty.**
   `adapters._parse_clause_id` (`adapters.py:80-94`) tries to read a number out of
   the clause text and, failing that, falls back to a **positional**
   `Clause {index + 1}`. The canonical fixture's clause bodies do not begin with a
   number, so every label is positional. The result is that the weather-exception
   clause the charterparty calls **3.1** is labelled **Clause 3** in the UI and on
   the wire, the threshold clause it calls **3.2** is labelled **Clause 4**, and
   the definition-30 carve-out it calls **4.1** is labelled **Clause 5**. A
   reader checking the letter against the PDF will not find "Clause 5". Every
   citation also still names the correct document and page, which is what makes
   the defect recoverable rather than a fabrication. Fixing it means parsing the
   heading's own numbering rather than the body's, which is extraction work, not
   an adapter bug.
5. **A bare `WWD` label is genuinely ambiguous.** Definition 15 *is* "WEATHER
   WORKING DAY", so the label sits closer to 15 than to 16's "WWD OF 24
   CONSECUTIVE HOURS". This code maps `"WWD"` to `ACTUAL_PERIOD`. The label
   carries no definition number and the charterparty's own wording decides.
   (`engine/state_machine.py:65-81`)
6. **FHEX is not implemented.** The day-counting axis excludes Sundays and
   nothing else, for any exception other than `SHINC`, so a charterparty drafted
   FHEX needs its holidays extracted first. SHEX/SHINC are charterparty
   conventions, not terms of the Laytime Definitions.
   (`engine/state_machine.py:14-17`, `:98-104`, `:213-228`)
7. **The threshold falls back to a configured default.** It is read off the
   charterparty when the LLM can read it; otherwise `BEAUFORT_THRESHOLD = 6` /
   `PRECIPITATION_THRESHOLD_MM = 2.0` apply and the verdict, the letter, and the
   UI each say the figure is unverified against the document.
   (`rules/evaluators.py:51-55`, `:94-108`)
8. **The strict-majority-of-hours test is this product's own policy**, not a BIMCO
   test, and no sustained-period test is applied. See
   [Where the weather threshold comes from](#where-the-weather-threshold-comes-from).
9. **The majority test and the exception are not the same claim.** A majority of
   hours is not a finding that every claimed hour was an interrupted period.
   `evaluate_wwd_exception` has four justification paths and only **two** put the
   policy disclosure into words — the upheld path (`:195-206`) and the
   short-of-majority path (`:207-216`) — and only the upheld path also carries the
   "a majority of hours is not a finding that every claimed hour was an
   interrupted period" sentence. The majority-met-but-operations-not-prevented
   path (`:217-225`) and the no-observations path (`:158-173`) carry neither, so
   the disclosure is **not** on every verdict. The canonical run lands on the two
   majority-judged paths (14 and 15 June short, 16 June upheld), so all three
   canonical day cards do carry it. Path-by-path table:
   [Where the weather threshold comes from](#where-the-weather-threshold-comes-from).
   (`rules/evaluators.py:158-173`, `:195-225`)
10. **Retries cannot move the dollars.** On retry the SOF worker re-extracts the
   chronologies but never the claim amounts, because no validation error concerns
   a claim amount and re-reading one would move the money.
   (`pipeline_agents.py:173-179`, `:226-242`)
11. **A partial extraction cache is not used at all.** All five `extracted_*.json`
    files or none: a partial set would mix cached and freshly-extracted facts
    inside one reconciliation. (`pipeline_agents.py:84-97`)
12. **There is no checkpointer.** The graph compiles once, is cached with
    `lru_cache`, and keeps no per-run state, which is what makes sharing the one
    instance across requests safe. Replacing a module-level node requires
    `reset_agent_pipeline()`. (`pipeline_agents.py:641-700`)
13. **After three failed validations the graph still calculates** and leaves
    `validation_errors` on state. `run_voyage_pipeline` hands them to the caller,
    which persists them beside the reconciliation. A clean pass never enters the
    retry loop. (`pipeline_agents.py:283-285`, `:608-624`; `pipeline.py:61-62`;
    `main.py:451-455`, `485-491`)
14. **No human sign-off gate.** Extracted terms and SOF events go straight to the
    engine, and every landing design says so under *Not in this build*: *"A human
    review step between the calculation and the reconciled figure."*
    (`apps/web/app/landing/content.ts:167`).
15. **The prompt is truncated.** Charterparty text is capped at 12,000 characters
    and 60 annotated lines per page. (`extractor.py:35-38`, `:86-123`)
16. **Parsing is text-only and filename-routed.** `charterparty.pdf` goes to
    PyMuPDF, everything else to pdfplumber. No OCR, no content-based
    classification, and a document uploaded under an unexpected name is parsed by
    the most expensive parser. (`parsing/dispatcher.py:36-42`)
17. **In-process status is lost on restart.** `GET /voyages/{id}/status` falls
    back to what the stored row proves. (`store.py:174-188`; `main.py:666-684`)
18. **`GET` never runs the pipeline**, but `GET /voyages/{id}` returns 409 for a
    row with no reconciliation rather than 404, and `/reconciliations` filters to
    `Reconciled`, `In Review`, `Closed`. (`main.py:610`, `:630-654`, `:720-738`)
19. **The parser ceilings are generous, and that is a trade-off.** The address
    space is 3,000,000,000 bytes and the wall clock 120 s
    (`parsing/limits.py:36`, `:40`), raised from 1,000,000,000 and 60 s because
    the old pair refused a legitimate 200-page dense document (2.03 GB measured,
    `limits.py:10-12`) rather than catching a hostile one. The consequence: a
    hostile 200-page document can hold a parser child process for **up to 120
    seconds and about 2.55 GB** (150 MB floor + ~2 kB per character the
    1,200,000-character ceiling allows, `limits.py:32-35`), bounded by
    `MAX_EXTRACTED_CHARS`, by `MAX_PDF_PAGES = 200` checked before any page is
    expanded (`:27`), and by the 4-run cap (`main.py:194`, `842-849`). The full
    argument, including why 3 GB and not 2.2 GB, is in
    [Security posture](#security-posture-and-its-limits).
20. **`Reconciliation.rule_authority` never reaches the wire.** It is computed —
    `_cited_rule_authority` (`pipeline_agents.py:333-343`) returns `BIMCO_2013`
    for `voyage_001`, because the fixture's page-3 clause 3.1 expressly
    incorporates the 2013 definitions by name — and stored, and then omitted
    from the `reconciliation` dict that `reconciliation_to_frontend` builds
    (`adapters.py:232-254`). A live `GET /voyages/voyage_001` has no
    `rule_authority` key at all, so the most load-bearing legal fact about a
    reconciliation — which ruleset the charterparty incorporates — is shown to
    nobody. `apps/web/lib/types.ts:16-29` documents this honestly, so it is a
    disclosure gap and not a false claim. It is on the roadmap as
    [§16](docs/continuation-plan.md#16-three-disclosures-that-are-not-steps);
    it is **not** redundant with what the UI shows, because the UI shows the
    per-day `measurement_basis` and `bimco_clause.clause_id`, which are
    different claims.

---

## API surface

| Method | Route | Notes |
|---|---|---|
| `GET` | `/healthz` | The only token-exempt route |
| `GET` | `/voyages` | Summary list, newest first |
| `POST` | `/voyages` | Multipart `files`; 400 with no parts, 413 over the ceilings, 429 over the run cap. Returns `{voyage_id, status}` and runs the pipeline in the background |
| `GET` | `/voyages/{id}` | `{reconciliation, pdf_urls}`; 404 unknown, 409 no reconciliation yet. The `reconciliation` object carries **no `rule_authority` key** — see known limitation 20 |
| `GET` | `/voyages/{id}/status` | In-memory status with a stored-row fallback |
| `PATCH` | `/voyages/{id}/status` | One of `Reconciled`, `In Review`, `Pending`, `Closed` |
| `DELETE` | `/voyages/{id}` | 409 for `voyage_001` |
| `GET` | `/reconciliations` | `page`, `per_page`; paginated |
| `DELETE` | `/reconciliations/{id}` | 409 for `voyage_001` |
| `GET` | `/voyages/{id}/letter` | **HTML only**; `?format=pdf` → 400 |
| `GET` | `/docs`, `/redoc`, `/openapi.json` | FastAPI's own reference UI. **Unauthenticated**, 7 documented paths and 4 schemas, no internal model leaked. See [Security posture](#security-posture-and-its-limits) |

---

## Repository layout

```text
keel-multi-agent-pipeline/
├── apps/
│   ├── api/
│   │   ├── keel_api/
│   │   │   ├── main.py             # FastAPI: routes, upload admission, demo seed
│   │   │   ├── pipeline_agents.py  # LangGraph StateGraph, 7 nodes, no checkpointer
│   │   │   ├── pipeline.py         # run_voyage_pipeline wrapper + shared helpers
│   │   │   ├── adapters.py         # internal models -> apps/web/lib/types.ts shape
│   │   │   ├── schemas.py          # frozen Pydantic contracts
│   │   │   ├── store.py            # SQLite persistence (SQLAlchemy 2.0)
│   │   │   ├── engine/             # pure-Python laytime state machine
│   │   │   ├── extraction/         # OpenAI SDK structured outputs
│   │   │   ├── parsing/            # dispatch, PyMuPDF, pdfplumber, limits, sandbox
│   │   │   ├── rules/              # weather-exception evaluator
│   │   │   ├── letter/             # Jinja2 HTML letter template
│   │   │   ├── weather/            # FixtureWeatherProvider
│   │   │   └── database.py         # DEAD: imported nowhere
│   │   └── tests/                  # 355 tests, 16 quarantined here
│   │       └── conftest.py          # points KEEL_DB away from apps/api/keel.db
│   └── web/                        # Next.js 16 App Router, pnpm
│       ├── app/                    # 12 routes + _not-found; no /register, no /page1
│       │   ├── page.tsx            # 38 lines: resolves ?v= server-side, renders one design
│       │   └── landing/            # 11 designs + registry.ts, content.ts, VariantSwitcher.tsx
│       ├── components/             # AppSidebar, PdfViewer, ThemeToggle, ui/*
│       ├── lib/                    # api.ts, types.ts, sanitize-html.ts, utils.ts
│       ├── proxy.ts                # DEMO STUB route guard — not authentication
│       ├── pnpm-workspace.yaml     # allowBuilds: sharp, unrs-resolver (lint depends on it)
│       └── tests/e2e/              # 7 Playwright spec files, 38 tests
├── fixtures/voyage_001/            # 8 JSON files, no PDFs
├── test-cases/                     # 4 reconciliation cases + generators
├── scripts/                        # fixture generation and standalone extractors
└── docs/
```

`apps/api/keel_api/reconcile/` was deleted. Its `adjudicator.py` and `differ.py`
hard-coded the three canonical dates behind an `is_canonical` branch; the money
rule now lives in `pipeline_agents.adjudicator_node` plus the engine.

---

## Related

- [**ertval.github.io**](https://ertval.github.io) — Portfolio & CV
- [**two-tier-safe-ai-gate**](https://github.com/ertval/two-tier-safe-ai-gate) — Safe AI execution model (Go + Inngest + Omnigent)
- [**keel-multi-agent-pipeline**](https://github.com/ertval/keel-multi-agent-pipeline) — Multi-agent maritime intelligence (Python + LangGraph)
- [**social-network**](https://github.com/ertval/social-network) — Go vertical-slices full-stack monolith (Next.js)
- [**make-your-game**](https://github.com/ertval/make-your-game) — Pure JS ECS game engine
- [**real-time-forum**](https://github.com/ertval/real-time-forum) — Go + Vanilla JS real-time WebSocket SPA
- [**forum**](https://github.com/ertval/forum) — Go hexagonal architecture monolith (zero-dependency)

Licence: MIT ([LICENSE](LICENSE)).
