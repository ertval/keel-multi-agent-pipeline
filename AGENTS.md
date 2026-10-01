# AGENTS.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

# Repository Map & Architecture

To work with progressive disclosure, use the following high-level index of the repository. Do not read the entire codebase or full markdown documents unless you need granular details for a specific file.

**This section is the new-agent context. Read the traps list at the end before you touch anything — every one of them has already cost this repo a review finding.**

## What the build is

An analyst uploads a charterparty, both parties' Statements of Facts, both claim PDFs, and a port weather record. An LLM extracts text into Pydantic schemas, a pure-Python state machine computes laytime/demurrage for each party separately, a deterministic evaluator tests each disputed weather window, the difference is reconciled into one number, and a settlement letter is rendered as HTML.

## What the build is not

Do not describe, imply, or reintroduce any of these. They are not in the code.

- **No authentication.** The FastAPI service is anonymous by default. CORS is narrowed to `http://localhost:3000` (`main.py:547`); an optional shared `KEEL_API_TOKEN` can be set (`main.py:550-552`) but is off by default. `apps/web/proxy.ts:5-16` states in its own first line that it is **not** authentication — the cookie it checks is a published constant (`proxy.ts:24`).
- **No source PDFs ship.** The sanitised checkout has no PDFs, so `PdfViewer` cannot render a document and 16 parser/extraction tests fail. Do not describe a working PDF highlight.
- **No email, no "send to other party", no PDF export.** The letter endpoint is **HTML only**; `?format=pdf` returns 400 pointing at the browser's Print → Save as PDF (`main.py:757-772`). The page-level *Send to Other Party* button (`app/(dashboard)/voyage/[id]/letter/page.tsx:126`) opens a Delivery modal (`DialogTitle` `:348`) whose text reads "Not sent — no delivery service is connected" (`:383`) and whose footer offers "Print / Save as PDF" (`:397`) — **both strings are inside the modal, not on the page.** The reports page exports **CSV only** (`app/(dashboard)/reports/page.tsx:466-473`).
- **No trial, sign-up, account, or sales process.** `/register` was deleted as a fabrication.
- **No SOC 2 / ISO / GDPR certification. No "enterprise-grade".** No customer logos, testimonials, or throughput statistics.
- **No settings page.** The sidebar has four items and no dead link (`components/AppSidebar.tsx:35-40`); a `Settings` entry pointing at `href="#"` was removed.
- **No human-in-the-loop review gate**, no live weather provider, no checkpointer.

## Canonical invariant

Owner **$187,000**, charterer **$62,000**, reconciled **$112,000**. Day winners: owner / owner / charterer on 14 / 15 / 16 June 2026. `reconciled = charterer base + items favouring the owner` = `$62,000 + $50,000 = $112,000`. Asserted by `tests/test_canonical.py:40-77` and by 12 tests in `tests/test_reconciliation_cases.py`.

## Legal sourcing — read this before writing a sentence about BIMCO

- The framework is the *Laytime Definitions for Charter Parties 2013* (BIMCO Special Circular No. 8, 10 September 2013). It supplies **only the measurement basis** for an excepted period — definition 16, the actual period of interruption (`rules/evaluators.py:60`).
- It **sets no numeric weather threshold**: no wind force, no precipitation figure (`evaluators.py:21-25`).
- The **threshold and the invocation test come from the charterparty**.
- `Verdict.rule_authority` is **`custom`** (`evaluators.py:65`).
- `Reconciliation.rule_authority` is a **different claim**: the ruleset the charterparty *expressly incorporates by name*, derived by `_cited_rule_authority` (`pipeline_agents.py:333-343`) and `"custom"` when it incorporates none. For `voyage_001` it is **`BIMCO_2013`**, because the fixture's page-3 clause 3.1 incorporates the 2013 definitions by name (`tests/test_canonical.py:69`, `:70-74`). Both values are correct at once; do not treat either as wrong.
- The **strict-majority-of-hours** test is **this product's own policy**, not a BIMCO test (`evaluators.py:31-34`).
- **Never** attribute a numeric weather threshold to BIMCO — not in a docstring, a string, a rule id, a comment, or a UI label. Tests enforce this: `tests/test_adapters.py:144`, `:211-212`, `tests/test_api_hardening.py:675-681`.

## Core Documentation
- [README](README.md) — What it is, what it is not, verified setup/run/test commands with real output, security posture and its limits, and the full known-limitations list. **Read this first.**
- [PRD](docs/prd.md) — Product summary, the canonical $112,000 scenario, design rules, and stack. Section 7 describes the graph.
- [Continuation plan](docs/continuation-plan.md) — **The working roadmap.** Feature work is blocked behind a human sign-off gate (its step 1).
- [Execution plan](plan.md) — A historical record of the original multi-agent plan, with an up-to-date divergence note. Not a task list.
- [Ticket Directory README](docs/tickets/README.md) — Hackathon timeline and dependency graph from the original build. Historical.
- [Ticket Tracker](docs/tickets/tracker.md) — Completion status of backend/frontend tasks from that build. Historical.
- [Phase 1 plan](docs/phase-1-plan.md) — Superseded hardening plan. Historical; annotated, not rewritten.
- [Frontend agent rules](apps/web/AGENTS.md) — Next.js 16 specifics for `apps/web`.

## Codebase Layout & Entrypoints

### 1. Backend API (FastAPI) — `/apps/api`

Python `>=3.11` (`pyproject.toml:8`), managed with `uv`. Voyage processing is a LangGraph graph, not a single straight function.

- **Entrypoint:** [main.py](apps/api/keel_api/main.py) (872 lines) — routes, upload admission, the optional token guard, the demo-voyage seed, and the in-process run-slot cap. `lifespan` calls `_seed_demo_voyage()` (`:536-543`).
- **Agent graph:** [pipeline_agents.py](apps/api/keel_api/pipeline_agents.py) (742 lines) — the `StateGraph` and every node. Read `create_agent_pipeline` (`:641-689`) for the topology; read the node functions for behaviour.
- **Pipeline wrapper:** [pipeline.py](apps/api/keel_api/pipeline.py) (69 lines) — `run_voyage_pipeline` calls `run_agent_pipeline` and validates the returned state into the four typed results. `_utc`, `_weather_windows`, `_round_usd` live here and are imported by the graph.
- **Response adapter:** [adapters.py](apps/api/keel_api/adapters.py) — converts internal models to the shape in `apps/web/lib/types.ts`. This is where `day_verdicts`, `bimco_clause`, `measurement_basis`, and `math_breakdown` are assembled. **The money rule is here plus the engine, not in a `reconcile/` package** (that package is deleted).
- **Data contracts:** [schemas.py](apps/api/keel_api/schemas.py) — frozen Pydantic models. `RuleAuthority` (`:24`) and `WEATHER_CLAUSE_VALUES` (`:34`) are shared with the extractor's JSON schema.
- **Persistence:** [store.py](apps/api/keel_api/store.py) — SQLAlchemy 2.0 over SQLite. One `voyages(id, status, data_json, created_at, owner_name)` table; the whole reconciliation is a JSON blob. In-memory status map capped at 1000 entries (`:174`).
  - [database.py](apps/api/keel_api/database.py) — **DEAD. Imported nowhere.** Do not import it, and do not delete it without being asked.
- **Parsing layer:** `/apps/api/keel_api/parsing/`
  - [dispatcher.py](apps/api/keel_api/parsing/dispatcher.py) — `parse()` is the public entry and always fork+execs the sandbox; `dispatch_to_parser()` is the in-process routing (filename-based: `charterparty.pdf` → PyMuPDF, everything else → pdfplumber).
  - [sandbox.py](apps/api/keel_api/parsing/sandbox.py) — the child process. Installs `RLIMIT_AS` **before** importing the PDF libraries; pickles the result on stdout.
  - [limits.py](apps/api/keel_api/parsing/limits.py) — the ceilings: `MAX_PDF_PAGES = 200` (`:27`), `MAX_EXTRACTED_CHARS = 1_200_000` (`:28`), `MAX_TEXT_LINES` (`:29`), `MAX_TABLE_CELLS` (`:30`), `DEFAULT_ADDRESS_SPACE_BYTES = 3_000_000_000` (`:36`), `DEFAULT_PARSE_TIMEOUT_SECONDS = 120.0` (`:40`). Also defines `DocumentTooLarge` and `DocumentParseError`. **Read the module docstring (`:1-23`) before changing any of them:** it records the measurements the address space is sized from, and raising the address space is a trade-off with a cost, not a free win.
  - [pdfplumber_parser.py](apps/api/keel_api/parsing/pdfplumber_parser.py) — tabular extraction (SOFs, claims).
  - [pymupdf_parser.py](apps/api/keel_api/parsing/pymupdf_parser.py) — prose extraction (charterparties).
  - [models.py](apps/api/keel_api/parsing/models.py) — `ParsedDocument`, `TextLine`, `BBox`, and the `NO_BBOX` sentinel.
- **LLM extraction:** `/apps/api/keel_api/extraction/extractor.py` — OpenAI SDK `chat.completions` with strict `json_schema`, 3 attempts, 2 s apart, 30 s timeout, `temperature=0`. It cites documents by `p<page>L<line>` anchors that are resolved against real line geometry; an unresolvable anchor degrades to `NO_BBOX` rather than to a guess. **Not a LangChain chain**; `langchain-openai` is not a dependency.
- **Calculation engine:** `/apps/api/keel_api/engine/state_machine.py` — `LaytimeEngine.calculate` is pure Python, no LLM. States: `BEFORE_NOR`, `ON_LAYTIME`, `WEATHER_PAUSE`, `ON_DEMURRAGE`. **Read the module docstring (`:1-110`) before changing anything here** — it records the SHEX/FHEX gap, the definition 15/17 limitations, and the definition 30 asymmetry.
- **Rules:** `/apps/api/keel_api/rules/evaluators.py` — `evaluate_wwd_exception` returns a `WWDResult`, **not** a `Verdict`. The caller builds the `Verdict` from it.
- **Weather:** `/apps/api/keel_api/weather/fixture_provider.py` — `FixtureWeatherProvider`, the only provider. Reads `weather_port_xyz.json`; the window is half-open `[start, end)`.
- **Letter:** `/apps/api/keel_api/letter/render.py` — Jinja2 template producing HTML. Its footer (`:101-111`) is the place that states the measurement-basis provenance; a test asserts what it may not claim.

#### The graph, as it actually is

Seven nodes, compiled once, **no checkpointer**. From `create_agent_pipeline` (`pipeline_agents.py:641-689`):

```text
orchestrator ──→ cp_worker ──┐
       │                      ├──→ validator ──(retry, budget left)──→ retry_fanout
       └──→ sof_worker ───────┘              │                              │
                                               │(calculate)              ┌───┴────┐
                                               ↓                        ↓        ↓
                                        laytime_engine              cp_worker  sof_worker
                                               │
                                               ↓
                                        adjudicator → END
```

- **The join is real and is a list-form edge**: `add_edge(["cp_worker", "sof_worker"], "validator")` (`:669`). It is *not* two independent edges into the validator. `tests/test_agent_graph.py:259-336` proves this — `:259-299` are the structural edge assertions and `:302-336` is the discriminating test that builds the two-independent-edges mutant and shows only `builder.waiting_edges` separates the two.
- **The complete edge set** is asserted at `tests/test_agent_graph.py:280-299`: the seven unconditional edges are `__start__→orchestrator`, `orchestrator→cp_worker`, `orchestrator→sof_worker`, `retry_fanout→cp_worker`, `retry_fanout→sof_worker`, `laytime_engine→adjudicator`, `adjudicator→END`; the join contributes **zero** plain edges and the validator's two targets are conditional branches, not edges.
- **Entry point** is `orchestrator` (`:662`).
- **`retry_fanout` is a no-op node** (`:288-290`) whose only job is to break the join so retry can fan back out to **both** workers (`:682-683`).
- **Routing** is `check_validation_routing` (`:608-624`): `retry` while `validation_errors` is non-empty and `retry_count < 3`, otherwise `calculate` — including when errors remain after three attempts.
- **Cache**: `_all_extracts_cached` (`:95-97`) requires all five `extracted_*.json` files or none. A retry skips the cache and forwards only the messages addressed to that worker's document (`:100-113`, `:155`, `:184`).
- **`reset_agent_pipeline()`** (`:694-700`) clears the `lru_cache`. The compiled graph holds node function objects captured at compile time, so replacing a module-level node without calling this does nothing.
- **`on_progress`** receives one message per executed node from `_NODE_PROGRESS` (`:630-638`).

### 2. Frontend Application (Next.js) — `/apps/web`

Next.js **16.2.6** App Router, React 19, Tailwind 4, shadcn/ui, Playwright, **pnpm** (`pnpm-lock.yaml` is canonical; the old `package-lock.json` is deleted). `next build` runs Turbopack by default and is a **CI gate** — `tsc` and `eslint` both pass on code it rejects.

- **Install governance:** [pnpm-workspace.yaml](apps/web/pnpm-workspace.yaml) is load-bearing and nothing else in the tree names it. Its `allowBuilds` map runs the postinstall hooks for `sharp` (Next image optimisation) and `unrs-resolver` (without it `eslint` throws at require time), denies `msw` and `core-js`, and sets `minimumReleaseAge: 0`. It lives in `apps/web/`, not the root — there is no root `pnpm-workspace.yaml`, and the root `pnpm-lock.yaml` has an empty importer, so `pnpm install` belongs in `apps/web/`.
- **Route guard:** [proxy.ts](apps/web/proxy.ts) — Next 16 renamed `middleware.ts` to `proxy.ts`; the file is at the app root and exports `proxy` plus a `config.matcher`. It is a **demo stub**, and its own docstring says so. Guarded paths: `/dashboard`, `/voyages`, `/reports`, `/reconciliations`, `/voyage`.
- **Routes** (exactly these nine; `/register` and `/page1` are gone):
  - `/` — `app/page.tsx` → `app/landing/`, public landing page. Eleven designs behind `?v=<key>`; the key is resolved on the server, so `/` is `ƒ` (dynamic), not a static prerender. `app/page.tsx` is a 38-line router that holds no copy: it reads `searchParams`, calls `resolveVariant` and `renderVariant` (`app/landing/registry.ts:59-73`), and renders the chosen design plus the switcher. The eleven keys and labels are `VARIANT_OPTIONS` (`registry.ts:30-42`): `statement` (default), `telemetry`, `gazette`, `blueprint`, `swiss`, `stateflow`, `carbon`, `dusk`, `pleading`, `radar`, `manifest`, in files `v1-statement.tsx` … `v11-manifest.tsx`. An unknown or absent `?v=` renders the default rather than 404ing. `app/landing/content.ts` is the single source of truth for every claim any variant makes, and `app/landing/VariantSwitcher.tsx` is the only `"use client"` file in the directory.
  - `/login` — `app/(auth)/login/page.tsx`, a `"use client"` page that sets a demo cookie. No credential check.
  - `/dashboard` — `app/(dashboard)/dashboard/page.tsx`, stats + recent voyages + the upload dialog.
  - `/voyages`, `/reconciliations`, `/reports` — list pages under the same `(dashboard)` layout.
  - `/voyage/[id]`, `/voyage/[id]/reconcile`, `/voyage/[id]/letter` — detail, reconciliation, letter.
  - `app/(dashboard)/layout.tsx` is a server component wrapping `SidebarProvider`; `app/(dashboard)/error.tsx` is the segment error boundary and takes Next 16's `unstable_retry`.
- **API client:** `apps/web/lib/api.ts` — `API_BASE_URL` defaults to `http://127.0.0.1:8000` (`:20-21`), `USE_MOCK` is `false` (`:24`). **CORS trap:** the API's allowlist is origins, and it defaults to `http://localhost:3000`, so the browser must be on `localhost`, not `127.0.0.1` (`playwright.config.ts:12-16`).
- **Other `lib/`:** `types.ts` (the wire contract `adapters.py` targets), `sanitize-html.ts` (allowlist sanitiser for the injected letter), `utils.ts`.
- **Components:** `PdfViewer.tsx` (react-pdf, worker served from `/public/pdf.worker.min.mjs`, honest unavailable state), `AppSidebar.tsx`, `ThemeToggle.tsx`, `VoyageUnavailable.tsx`, `ui/*` (shadcn). Audit-trace tables and day-verdict cards are inline in their page routes, not separate files.
- **e2e:** `apps/web/tests/e2e/` — 7 spec files, **38 tests** (`pnpm exec playwright test --list` → `Total: 38 tests in 7 files`), one `chromium` project. `playwright.config.ts` starts `next dev` itself and binds **port 3000** — an unrelated process squatting 3000 makes the whole suite unrunnable. The three specs that need to know the app's own origin now read it off Playwright's `baseURL` fixture rather than hardcoding `3000` (`null-data.spec.ts:158`, `fabricated-data.spec.ts:126`, `proxy.spec.ts:60`), so nothing in the suite is port-bound except the port itself.

### 3. Test surfaces

- **Backend:** `apps/api/tests/` — **355 tests collected** across 18 `test_*.py` files. `cd apps/api && uv run pytest -q` → **16 failed, 338 passed, 1 skipped**. The 16 are missing source PDFs: 3 in `test_extraction.py`, 5 `test_fixture_file_exists` parameters, 8 in `test_parsers.py`. The 1 skip is `tests/test_extraction.py:136: OPENAI_API_KEY not set` — **not** PDF-dependent, so it is not a 17th quarantine. `uv run pytest -m canonical -q` → **15 passed, 340 deselected**; `uv run pytest -k canonical -q` → **19 passed, 336 deselected** (`-k` is wider: it also matches four tests whose *names* contain "canonical"). The CI deselect reproduction is `338 passed, 1 skipped, 16 deselected`. Notable modules by collected count: `test_api_hardening.py` (64), `test_validation.py` (46), `test_bimco_rules.py` (31), `test_reconciliation_contract.py` (30), `test_agent_graph.py` (27 control-flow proofs), `test_pdf_geometry.py` (25), `test_engine.py` (25), `test_reconciliation_cases.py` (23, 12 canonical-marked), `test_parsing_sandbox.py` (23, the only coverage of the parser ceilings).
- **Test isolation:** `apps/api/tests/conftest.py` points `KEEL_DB` at a per-session throwaway file under the system temp directory whose name carries the pytest process id, and deletes that file plus its WAL/SHM sidecars both before the suite and at interpreter exit, before anything imports `keel_api.store`, which reads `KEEL_DB` in `_db_path()` (`store.py:29`). The suite therefore cannot write into `apps/api/keel.db`, and leaves nothing behind. Do not remove it: without it `uv run pytest` wrote ~50 `voyage_*` rows into the demo database the running API serves, and `DELETE /voyages/voyage_001` is refused, so the damage outlived a restart.
- **Frontend:** `pnpm exec tsc --noEmit` → 0. `pnpm run lint` → 0 errors, 4 warnings. `pnpm run build` → 0. `pnpm exec playwright test` → 38 passed (needs a backend on `127.0.0.1:8000`).

---

## Traps

Each of these has already produced a review finding or a spurious failure.

1. **The fixture PDFs are absent.** `fixtures/voyage_001/` has eight JSON files and no `*.pdf`. Do not write that parsing, extraction, or the PDF highlight works here.
2. **The extraction cache filenames are server-owned and refused from uploads**: `_cached_extracts.json`, `expected_reconciliation.json`, and anything prefixed `extracted_` (`main.py:204-205`, `244-250`). A client that could plant them would choose the reconciled dollars and the LLM would never run. The one JSON a client may supply is `weather_port_xyz.json`.
3. **Do not untrack a build-critical path.** `apps/web/lib/` used to be entirely untracked while **20** tracked `.ts`/`.tsx` files imported from it, which is a clean checkout that cannot typecheck or build. All four files — `api.ts`, `sanitize-html.ts`, `types.ts`, `utils.ts` — **are** tracked now (`git ls-files apps/web/lib/` lists exactly those four), and so is every other path the build needs. The trap is the next untracked import, not the current state: CI's tracked-path gate is the only thing that can see it, because `git diff --exit-code` and `git add -A --dry-run` report nothing for a file that was simply never committed. The list is `ci.yml:38-86` and its length is asserted at `:90` as `expected=47`, so a path is added in two places on purpose. Six load-bearing tracked inputs were missing from that list until the last pass and were added: `apps/web/app/layout.tsx`, `apps/web/app/globals.css`, `apps/web/components/AppSidebar.tsx`, `apps/web/tests/e2e/smoke.spec.ts`, `apps/web/tests/e2e/demo-workflow.spec.ts`, `apps/web/playwright.config.ts`. `git rm --cached apps/web/app/layout.tsx` still left the gate printing `All 41 build-critical paths are tracked` and exiting 0, and `next build` then failed. The step now also compares the tracked set of `apps/web/app/landing/*.tsx` against this list's set of them (`ci.yml:113-129`), so a twelfth variant cannot land without a gate entry. A 21st `@/lib` hit appears if you drop the extension filter: `apps/web/components.json` carries `@/lib/utils` and `@/lib` in its alias config, and it is neither `.ts` nor `.tsx`.
4. **`apps/api/keel.db` must be deleted between runs.** A stale WAL/SHM pair makes seeding fail with a lock error, and `lifespan` swallows the exception (`main.py:539-542`), so the API boots with no demo voyage and every data-backed page renders empty. `rm -f apps/api/keel.db apps/api/keel.db-wal apps/api/keel.db-shm` before a backend run. This is now only about a half-written database from a previous API process — `tests/conftest.py` keeps the suite out of it.
5. **pnpm, not npm, and the install is governed by `apps/web/pnpm-workspace.yaml`.** There is a vestigial root `package-lock.json` and a root `pnpm-lock.yaml` whose only importer is empty. `apps/web/pnpm-lock.yaml` is canonical and the install belongs in `apps/web/`. A root `pnpm install` resolves nothing for the app.
6. **`next build` is a gate, not a formality.** A `useSearchParams()` outside a Suspense boundary passes `tsc` and `eslint` and fails the build. Run it.
7. **The demurrage figure never comes from the LLM.** The LLM extracts text into schemas. Every dollar is arithmetic in `engine/state_machine.py` and `rules/evaluators.py`, aggregated in `pipeline_agents.adjudicator_node` and shaped in `adapters.py`. Do not add a code path where a model emits a verdict or a dollar figure.
8. **Do not describe a graph shape the code does not have.** The validator is entered through a single list-form join, not two independent edges. A doc claiming the latter was already caught once.
9. **`middleware.ts` no longer exists.** Next 16 renamed the convention to `proxy.ts`. `next build` prints `ƒ Proxy (Middleware)` — that is Next's own label, not a file.
10. **No "BIMCO 2013 threshold" anywhere.** See the legal-sourcing section above.
11. **Node 22 in CI is a patch version (22.23.3), not the major**, because pnpm 11.4.0 requires `>=22.13` and a bare `22` can resolve to 22.11.
12. **Clause labels are positional, not the charterparty's numbering.** `adapters._parse_clause_id` (`adapters.py:80-94`) falls back to `Clause {index + 1}` when the clause body has no parseable number, and the fixture's bodies do not. So the wire and the UI call the weather-exception clause `Clause 3` (the charterparty says 3.1), the threshold clause `Clause 4` (it says 3.2), and the definition-30 demurrage carve-out `Clause 5` (it says 4.1). Cite the charterparty's own numbers in prose; do not quote a `Clause N` label as if the document contained it.
13. **Do not edit files under `docs/archive/**`, `docs/prd.md`, `docs/demo_workflow.md`, or `docs/tickets/{ertval,magnus}.md`** without checking who owns them. Historical documents get annotated, not rewritten.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
