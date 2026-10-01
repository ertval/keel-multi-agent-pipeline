# Continuation plan

**Status:** rewritten 2026-09-30 as an executable, risk-ordered roadmap.
**Last updated:** 2026-09-30
**Scope of this checkout:** `keel-multi-agent-pipeline`.

This is the working plan. It replaces the aspirational version that stood here before; what that version got wrong, and what became of it, is recorded in [§15](#15-what-this-file-used-to-say). Archive notes and the original hackathon tickets stay as history under `docs/archive/` and `docs/tickets/`.

Every step below cites the `file:line` that justifies it, and every verification command was run in this checkout. Where a step depends on something nobody has verified, it says so.

---

## 1. Where we are

The product is a single-player demurrage audit. An analyst uploads a charterparty, both statements of facts, both claim PDFs, and a port weather record. An LLM extracts facts into a schema. A pure-Python state machine and a deterministic evaluator produce the dollars. The canonical case is owner **$187,000** against charterer **$62,000**, reconciled to **$112,000**, with the owner's position better supported on 14 and 15 June 2026 and the charterer's on 16 June.

What is finished and tested:

```
$ cd apps/api && uv run pytest -q
16 failed, 338 passed, 1 skipped in 39.89s
$ uv run pytest -m canonical -q
15 passed, 340 deselected in 4.26s
$ cd apps/web && pnpm exec playwright test
31 passed (1.6m)
```

The 16 failures are the absent source PDFs — 3 in `test_extraction.py`, 5 `test_fixture_file_exists` parameters, 8 in `test_parsers.py`. Every other layer is green: 355 tests are collected, 338 pass and 1 is skipped, and that skip is `tests/test_extraction.py:136: OPENAI_API_KEY not set`, which is **not** PDF-dependent and therefore does not become a 17th quarantine when the PDFs come back.

`uv run pytest` also no longer writes into the demo database.
`apps/api/tests/conftest.py` points `KEEL_DB` at a per-session throwaway file
whose name carries the pytest process id and deletes it, with its WAL/SHM
sidecars, both before the suite and at interpreter exit; `store._db_path()`
resolves the variable in `_db_path()` (`store.py:29`). It used to share
`apps/api/keel.db` with the running API and wrote ~50 `voyage_*` rows into it;
because `DELETE /voyages/voyage_001` is refused (`main.py:699-717`) and the demo
is only re-seeded at startup, that damage outlived a restart. This matters to
step 1: a sign-off gate writing to a row that a test run can quietly overwrite
would be worth nothing.

That file is also now in `ci.yml`'s tracked-path gate, together with
`tests/test_parsing_sandbox.py` — see §16. A gate that stands behind files
nothing in CI can name is worth nothing either.

**The three facts that decide the order of this plan:**

1. **There is no human sign-off gate and no send path.** `main.py:480` writes `"status": "In Review"` with the comment *"Require user approval before marking 'Reconciled'"* — and `PATCH /voyages/{id}/status` (`main.py:687-696`) lets any unauthenticated caller set any of `Reconciled | In Review | Pending | Closed`. The status field names a gate that does not exist. The letter page's *Send to Other Party* opens a dialog headed **Delivery Is Not Available** and sends nothing.
2. **The graph has no checkpointer.** `create_agent_pipeline` returns `workflow.compile()` with no checkpointer argument (`pipeline_agents.py:689`). Nothing calls `interrupt()`. An in-graph pause cannot resume today.
3. **The API is anonymous.** `AdmissionGuard` only enforces `KEEL_API_TOKEN` when that variable is set (`main.py:546-551`, `:582-592`), and when set it is one shared secret with no identity, no expiry, no rotation and no per-voyage check. `apps/web/proxy.ts` mints a published constant cookie and its own first line says it is not authentication.

Ordered by risk, those three outrank every feature, but **not for the same
reason**, and it is worth keeping the reasons apart:

- **Fact 1 is the sharpest of the three.** A missing sign-off gate is
  directly, and on its own, a way for this product to say something to a
  counterparty that a person never approved. Nothing downstream of it changes
  that.
- **Fact 3 is a way for a *third party* to do the same thing**, one step removed:
  an unauthenticated caller can promote a voyage to `Reconciled` on their own
  initiative, so the gate in fact 1 would be decorative rather than absent. That
  is why step 3 follows step 1 instead of running beside it.
- **Fact 2 is not that at all.** A missing checkpointer is a *capability* gap, not
  a publication gap. It is in this list because it constrains the shape of the
  fix rather than because it is urgent: it is the reason fact 1's gate has to sit
  **between** two runs instead of **inside** the graph, and the reason no step in
  this plan needs one. If fact 2 is fixed, a different and cheaper fix for fact 1
  opens up. If it is not, fact 1 is still fixable. Nothing here emits anything
  today because there is no checkpointer.

So: facts 1 and 3 are ranked by risk and the order between them is a judgement
call the plan makes explicitly in §3. Fact 2 is listed because it constrains them,
and the reasoning above keeps it from being mistaken for a co-equal risk.

---

## 2. Rules that stay in force

1. The LLM extracts text into schemas. It does not choose a position or a dollar amount.
2. One analyst uploads the other side's documents. No counterparty account in this phase.
3. Every disputed day names the test applied, the charter-party clause, and the measurement basis — three separate claims, never conflated.
4. No document is ever named as the authority for a numeric weather threshold or for the share of hours that must meet it. The Laytime Definitions contain no such figure.
5. Outputs stay advisory. No "verdict", no "determination", no "binding".
6. Prefer a small deterministic rule over a new agent.

---

## 3. Ordering, and why

The order below is by **risk**, not by novelty. The reasoning in one line each:

| # | Step | Why this slot |
|---|---|---|
| 1 | Human sign-off gate + audit-log surfacing | It is the product's reason to exist, it needs no new infrastructure, and until it exists the product can emit an unreviewed figure a counterparty reads as advice. |
| 2 | Restore the source PDFs, un-quarantine 16 tests | The checkout cannot parse anything and 16 of 355 collected tests are red. It is a mechanical follow-up once the PDFs exist. |
| 3 | Real authentication + per-voyage authorisation | Step 1 writes an approval to a row that anyone can currently read and overwrite. The gate is decorative without this. |
| 4 | Remove the extraction-cache trust boundary | A client-supplied file is read as trusted extraction output. The HTTP route already refuses those names; the graph does not. |
| 5 | Bound the money fields in `schemas.py` | Every money field is an unbounded float fed by a model. Cheapest possible defence, and it must land before step 1's reviewer sees a number. |
| 6 | Real PDF export | The endpoint refuses today. Annoying, not dangerous. It lands after the gate because a gate is worth more than a printer. |
| 7 | A genuine weather provider | Corroboration, never the sole basis. Low urgency: the threshold already comes from the charter party. |
| 8 | Live integrations | Every one needs a customer license. None is on the critical path to a defensible figure. |

Steps 1–5 are all small and none needs a new service. Steps 6–8 need infrastructure or third parties, which is why they are behind the ones that do not.

The steps are not the whole backlog. Three disclosures that need doing but are
not steps — two of them one-line backend changes and one a sanitiser fix — are
in [§16](#16-three-disclosures-that-are-not-steps).

---

## 4. Step 1 — Human sign-off gate, and the audit log a reviewer needs

**What it changes.** A voyage's reconciliation stops being publishable the moment the pipeline finishes. A reviewer sees every extracted term and every assessment with its citation, corrects or overrides what they disagree with, and only then marks the voyage issued. Nothing leaves the system without that mark.

**Why first.** Two reasons, and the second is the serious one. The first: the whole product is "a defensible position", and defensible means a person stood behind it. The second: `main.py:480` already writes `"In Review"` and the PATCH route lets anyone promote it to `Reconciled`. Until the gate exists and is authenticated, the status vocabulary is decoration.

**Files**

| File | Change |
|---|---|
| `apps/api/keel_api/store.py` | Append-only `signoffs` table: `voyage_id`, `signed_by`, `signed_at`, `decision` (`approved` \| `overridden` \| `rejected`), `note`, and a JSON snapshot of the reconciliation as approved. |
| `apps/api/keel_api/main.py` | New `POST /voyages/{id}/signoff`. Delete or gate the `PATCH /voyages/{id}/status` promotion path so the status cannot be set to `Reconciled` without a signoff row. |
| `apps/web/app/(dashboard)/voyage/[id]/reconcile/page.tsx` | The review surface: terms, both traces, day cards, and the per-day assessment each with its citation and threshold provenance. |
| `apps/web/app/(dashboard)/voyage/[id]/page.tsx` | Reuse the existing citation panel; it already distinguishes "the API cited no charterparty clause for this step". |
| `apps/web/lib/types.ts` | `Signoff` shape. |

**Low-confidence surfacing** rides along in the same screen, because it is the same job: the reviewer is already there.

- Surface the threshold provenance that is already computed but not visualised as a warning. `pipeline_agents._threshold_source` returns `None` when no extracted clause states a threshold (`pipeline_agents.py:354-366`), and the justification then says the figure is Keel's default and unverified. That is a *must-fix-before-issuing* condition and the UI should say so in one place.
- Surface `_cited_rule_authority` (`pipeline_agents.py:333-343`): when the charter party does not expressly incorporate a ruleset, the reconciliation's `rule_authority` is `custom`. A reviewer should see that as a fact, not discover it in a payload.
- Surface `PipelineState.validation_errors` on the row. `run_voyage_pipeline` already hands them to `on_validation_errors` (`pipeline.py:48-62`) and `main._run_pipeline_task` already persists them (`main.py:451-491`) — but the graph still calculates after three failed validations (`pipeline_agents.py:621-624`), so a voyage can be issued carrying errors. Blocking issue on non-empty errors is the rule.

**How to verify it is done.**

```
cd apps/api && uv run pytest -q          # existing 338 must stay green
uv run pytest -m canonical -q           # 15 must stay green
cd apps/web && pnpm exec tsc --noEmit && pnpm run lint && pnpm run build
pnpm exec playwright test               # 31 must stay green, plus new specs
```

New tests, each of which fails before the change:

1. `POST /voyages/{id}/signoff` with no auth configured returns 403. *(Today it is 200.)*
2. `GET /voyages/{id}` after a pipeline run shows a reconciliation whose status is not `Reconciled`, and `PATCH …/status {"status":"Reconciled"}` is refused with no signoff row. *(Today it is accepted.)*
3. A voyage with non-empty `validation_errors` cannot be approved.
4. A voyage whose threshold provenance is Keel's default cannot be approved without an explicit override note.
5. The letter is served only for an approved voyage; otherwise 409.

**Depends on:** nothing. **Size: M** (about 4–6 days for two people). The schema and the two API tests are a day; the review screen is the rest.

**Deliberately not in this step:** a LangGraph checkpointer. It is a prerequisite for a gate *inside* the graph, and this gate sits between runs. See [§13](#13-the-checkpointer-and-why-it-is-a-prerequisite-rather-than-a-nicety). *(An earlier version of this line said "See step 9"; this plan has eight steps, 1–8, and no ninth. The checkpointer is not a step — it is §13, and §13 says no step in the plan needs one.)*

---

## 5. Step 2 — Restore the source PDFs, un-quarantine 16 tests

**What it changes.** `fixtures/voyage_001/` gets its five PDFs back, and the 16 quarantined tests leave the deselect list.

**Why second.** Without the PDFs the product cannot do the thing it exists to do in this checkout: parse and extract. 16 of 355 collected tests are red, and the failure mode looks like a broken parser rather than a missing file. It is also the cheapest possible win.

**The CI follow-up is mechanical, and CI tells you exactly what to do.** `.github/workflows/ci.yml:158-174` holds `KNOWN_MISSING_PDF_TESTS` as a literal 16-entry list, and the job fails if the count is not 16 (`:205-211`). Each entry is then re-run on its own (`:268-270`); if a quarantined test starts passing, the job emits a remediation message naming the line to delete, its line number, and the two literal `16`s to update. So committing the PDFs turns CI red on purpose, with instructions. That is the designed path, not a surprise.

**Files**

| File | Change |
|---|---|
| `fixtures/voyage_001/{charterparty,sof_owner,sof_charterer,claim_owner,claim_charterer}.pdf` | Restore. `.gitattributes` already marks `*.pdf binary`. |
| `.github/workflows/ci.yml` | Delete the 16 entries, the count assert, and the audit loop; update both literal `16`s. |

**How to verify it is done.**

```
cd apps/api && uv run pytest -q          # expect 0 failed, 354 passed, 1 skipped (355 collected)
```

The arithmetic, stated so it can be checked: 355 tests are collected and one of
them is skipped — `tests/test_extraction.py:136`, `OPENAI_API_KEY not set` — which
is **not** PDF-dependent and so is not part of the 16 and stays skipped after the
PDFs land. That leaves **354 runnable**, of which 338 pass and 16 fail today
(338 + 16 = 354, and 354 + 1 skipped = 355 collected). Un-quarantining the 16
therefore means **354 passed, 1 skipped, 0 failed**. The `339` an earlier version
of this line named was 355 minus the 16, which double-counts the skip: 339
passed plus 1 skipped is 340, not the 355 that are collected. If that skip ever
disappears, the expectation is `355 passed, 0 skipped` and nothing else changes.

`apps/web/tests/e2e/` also has the PDF-viewer specs. They pass today because they assert the *honest empty state*; with the PDFs back they should assert the opposite, and that is a deliberate test change with the file list in it.

**Depends on:** having the original PDFs. If they cannot be recovered, generate equivalents with `scripts/generate_fixtures.py` and say in the commit that they are regenerated. **Size: S** (mechanical).

---

## 6. Step 3 — Real authentication and per-voyage authorisation

**What it changes.** An identity exists. Every voyage belongs to an organisation. Access is checked per voyage, not per route.

**Why third.** It follows the gate rather than preceding it: step 1 writes an approval signed by somebody, and today that name would be an unauthenticated string. Doing the gate first and auth second means one review surface gets built rather than two.

**What exists today, precisely.**

- `AdmissionGuard` (`main.py:562-594`) checks a shared secret only when `KEEL_API_TOKEN` is set. Off by default, so the API is anonymous by default.
- The secret has no identity attached, no expiry, no rotation, and no per-voyage scope. `hmac.compare_digest` is the only cryptographic primitive used, and it is doing the right thing with the wrong model.
- `_TOKEN_EXEMPT_PATHS = {"/healthz"}` is the only exemption.
- `apps/web/proxy.ts` checks a **published constant** (`DEMO_TOKEN = "keel-demo-session"`, `proxy.ts:24`) and says in its own docstring that it "is NOT AUTHENTICATION" and that "the API is the real trust boundary and it is currently open".
- There is no tenant concept anywhere: `store.py` has one `voyages` table and no owner column beyond a display `owner_name` (`store.py:36-42`).

**Files**

| File | Change |
|---|---|
| `apps/api/keel_api/store.py` | `tenants`, `users`, `voyage_participants(voyage_id, tenant_id, party_role)`. |
| `apps/api/keel_api/main.py` | Replace the shared-secret branch with real session verification; per-voyage authorisation on every `/voyages/{id}` route, including `DELETE`. |
| `apps/web/proxy.ts` | Server-side session verification. Keep the honest docstring only while it remains a stub. |

**How to verify it is done.**

1. Every existing test in `test_api_hardening.py` (64 tests) must be re-read: several assert the anonymous behaviour. Each must be rewritten to assert the authorised behaviour, not deleted.
2. New tests: an unauthenticated `GET /voyages/{id}` is 401; a user in tenant B is 403 on tenant A's voyage; the seeded demo voyage is reachable in development only.
3. `apps/web/tests/e2e/proxy.spec.ts` — currently 11 tests about the stub — is replaced, not extended.

**Depends on:** step 1 (an approval needs an identity). **Size: L** (1.5–3 weeks). Provider selection is the open decision; pick one and commit to it rather than designing for three.

**Scope note:** multi-tenancy as a data model is out of scope for now. Authentication plus per-voyage authorisation is enough to close the hole; RLS is a later hardening step and only makes sense after the database is no longer SQLite.

---

## 7. Step 4 — Remove the extraction-cache trust boundary

**What it changes.** An upload directory's `extracted_*.json` stops being readable as trusted extraction output.

**Why fourth.** The HTTP route already refuses the filenames. The graph does not. That is a hole with a one-line fix on the route side and a real design question on the graph side.

**The inconsistency, exactly.**

`main.py:198-205` documents the risk and `main.py:244-256` closes it at the edge:

```python
_SERVER_OWNED_JSON = frozenset({"_cached_extracts.json", "expected_reconciliation.json"})
_CACHE_JSON_PREFIX = "extracted_"
```

`_refuse_server_owned_name` rejects any upload whose name is in that set or starts with `extracted_`, and rejects any `.json` that is not `weather_port_xyz.json`. The only JSON a client may supply is the weather record, which is validated against `WeatherObservation` (`main.py:319-325`).

The graph, however, reads all five of them as authoritative:

- `_EXTRACT_CACHE_FILES` (`pipeline_agents.py:86-92`) — the five `extracted_*.json`.
- `_all_extracts_cached` (`pipeline_agents.py:95-97`) — all five present, or none.
- `cp_worker_node` (`pipeline_agents.py:155-157`) returns `json.loads(...)` of `extracted_charterparty.json` verbatim as `extracted_terms`.
- `sof_worker_node` (`pipeline_agents.py:184-198`) returns the two SOF chronologies and both claim amounts the same way.

Any code path that constructs a fixture directory without going through `upload_documents` — a seed script, `test-cases/_generate_fixtures.py`, `scripts/`, a future worker reading from object storage — reopens the hole the route closed. The current defence is one call site's argument list.

**Files**

| File | Change |
|---|---|
| `apps/api/keel_api/pipeline_agents.py` | Take the trusted-cache decision from the caller, not from the directory's contents. `run_agent_pipeline` grows a `use_extraction_cache: bool` (default `False`); only the demo seed and the fixture tests pass `True`. |
| `apps/api/keel_api/main.py` | The seed passes `True`; `POST /voyages` does not. |
| `apps/api/tests/test_agent_graph.py` | The existing patched-cache test must assert the flag, not just the absence of extractor calls. |

**How to verify it is done.** A new test writes a poisoned `extracted_charterparty.json` with a demurrage rate of 1, runs the graph over that directory with the default argument, and asserts the poisoned value was **not** used. Today it would be. Then `uv run pytest -m canonical -q` must still be 15, because the seed passes the flag.

**Depends on:** nothing. **Size: S** (half a day). Doing it before step 3 is deliberate: it is a one-day fix and there is no reason to leave a known hole in the tree for a fortnight.

---

## 8. Step 5 — Bound the money fields in `schemas.py`

**What it changes.** Every money field carries a range, so a model that returns `demurrage_rate_per_day_usd: 5e9` cannot reach the engine.

**Why fifth, and why before step 1 ships.** Step 1 puts a human in front of the numbers. A human in front of an unbounded number is still a human who can be shown `5e9`. The range check is cheaper than the reviewer being reliable.

**The state of it.** `grep -n 'ge=\|le=\|Field(' apps/api/keel_api/schemas.py` returns nothing. Every money field is a bare `float`: `laytime_allowance_hours`, `demurrage_rate_per_day_usd`, `despatch_rate_per_day_usd`, `nor_turn_time_hours`, `laytime_used_hours`, `demurrage_due_usd`, `running_total_usd`, `owner_amount_usd`, `charterer_amount_usd`, `hours_credited_to_owner`, `dollars_credited_to_owner_usd`, and both totals.

`validator_node` checks a vessel name and the lat/lon ranges (`pipeline_agents.py:257-285`). It checks nothing about the money.

**Files**

| File | Change |
|---|---|
| `apps/api/keel_api/schemas.py` | `Field(gt=…, le=…)` on the money and hour fields. |
| `apps/api/keel_api/pipeline_agents.py` | Extend `validator_node` so a bound violation becomes a `ValidationIssue` tagged to the charter party — it already retries both workers with document-scoped feedback. |
| `apps/api/tests/test_validation.py` | Boundary cases. |

**How to verify it is done.** A test feeds `demurrage_rate_per_day_usd = 1e12` and asserts the engine never sees it. `pytest -m canonical` must stay at 15.

**Sizing the ranges is the real work and it needs a maritime lawyer, not an engineer.** A demurrage rate of $5,000/day is real; $0 is real for a spot fixture; so is a $250,000/day for a very large vessel. Pick bounds that are wide enough not to reject a real charter party, and record where each number came from. **Size: S** for the code, plus the legal input.

---

## 9. Step 6 — A real PDF export

**What it changes.** `GET /voyages/{id}/letter?format=pdf` stops returning 400.

**Why sixth.** It is the most visible annoyance in the build and the least dangerous. It is behind the gate because a signed-off figure in a printable form is worth more than an unsigned one in a printer.

**The state of it.** `main.py:757-772` refuses any format but `html`:

> "Unsupported letter format 'pdf': this endpoint serves HTML only and will not label HTML as a PDF. Use the browser's Print -> Save as PDF."

The frontend already handles the refusal correctly and tells the user so (`apps/web/app/(dashboard)/voyage/[id]/letter/page.tsx:60-91`), including checking the `content-type` so an HTML body labelled `application/pdf` is not written to disk. That check is the reason this step is cheap: the client is already prepared.

**Files:** `letter/render.py` (render to a PDF library that supports the template's inline CSS), `main.py` (the `format` branch), `letter/page.tsx` (drop the notice once it succeeds). Pick one library and check its licence and its font handling before wiring it; the template uses Georgia with `text-transform: uppercase`, both of which a naive renderer drops.

**How to verify it is done.** `GET …?format=pdf` returns `application/pdf`; the magic bytes are `%PDF-`; the totals in the PDF are `$187,000 / $62,000 / $112,000`; and a new Playwright spec asserts a downloaded PDF, not an HTML body. **Depends on:** step 1 (issue state). **Size: S–M.**

---

## 10. Step 7 — A genuine weather provider

**What it changes.** A second `WeatherProvider` implementation, and an explicit statement of what a hindcast is and is not.

**Why seventh.** Corroboration, not the basis of the finding. The threshold already comes from the charter party and the hours already come from the Statements of Facts; adding a data source improves the evidence a reviewer looks at, it does not change the structure of the answer. It also cannot be evaluated until step 1 exists, because "is this observation good enough to rely on" is a reviewer's question.

**The state of it.** `apps/api/keel_api/weather/` contains exactly one file, `fixture_provider.py`. It reads `weather_port_xyz.json` from the voyage directory and filters to a half-open `[start, end)` window (`fixture_provider.py:48-53`), which is right — a 12-hour window holds 12 hourly observations, not 13, so the majority denominator matches the period being assessed.

**Design constraints that are not optional:**

1. `operations_prevented` is a provider-supplied flag on the observation (`schemas.py:109`). A live hindcast does not know whether a shore crane stopped. Keep it sourced from the Statement of Facts and say so on the citation, or the engine will be reading its own assumption back to itself.
2. Reanalysis grids are coarse. *[Unverified in this document: the "roughly 31 km" figure for ERA5 cells is stated from memory and I could not confirm it against ECMWF's published documentation while writing this. It is plausible and it is the reason the point stands, but treat the number as unconfirmed until someone checks ECMWF's own grid-resolution statement. The underlying claim — that a reanalysis grid is far coarser than a berth-level anemometer — is not in doubt.]* Label the citation as a hindcast and never let it be the sole reason hours are struck off.
3. Label the source, the grid or station, and the retrieval time in `WeatherCitation`, which currently has only `source` and `observation_id` (`schemas.py:99-101`).

**How to verify it is done.** The same 15 canonical tests pass with the fixture provider swapped out. A test asserts the citation names the provider and the retrieval time. **Depends on:** step 1, for the reviewer who decides how much weight the observation gets. **Size: M.**

---

## 11. Step 8 — Live integrations

Last, and only on a customer license. Every item here is blocked on someone else's API access, and none of it makes a figure more defensible.

| Target | What is actually true | When |
|---|---|---|
| **Any VMS, via files** | Reconciliation CSV plus the letter. The reports page already writes a real CSV (`apps/web/app/(dashboard)/reports/page.tsx:454-473`). This is the integration that needs no vendor. | With step 6. |
| **Dataloy** | Their VMS has a documented Laytime Calculations module — demurrage and despatch rates, tiered rates, a Time Sheet of not-to-count deductions, reversible terms, proration and cargo match — and a Claim Drawer with claim causes, settled amounts and downtimes. Marcura and Dataloy have announced an expanded partnership exposing Marcura Claims, DA-Desk and Portlog inside the Dataloy VMS, with claims calculations triggered from port events and synced to the voyage record. **Implication for us:** the laytime calculation is already a solved problem inside the systems our users already run. Our value is the adversarial reconciliation across two parties' documents, and it has to be reachable without replacing the VMS. | When a customer supplies keys. |
| **BIMCO standard time sheet** | BIMCO's *Standard Time Sheet (short form)* was published in 1975 and is recommended by BIMCO and FONASBA "to assist in the calculation of laytime"; BIMCO still lists 1975 as the latest edition. **It is a computation worksheet, not a date range.** Its shape is a grid of laytime-commenced-to-laytime-completed with deduction rows carrying from, to, deducted time, percentage, reason and proration — which is the same information our audit trace already carries, in a form an analyst is already trained to read. | Output format choice for step 8's file pack. Not a code dependency. |
| **Time bar** | In every form checked, the demurrage claim time bar runs from **completion of discharge**, commonly 60/90/180 days, and it strictly requires the supporting documents — in *The Adventure* the port logs and time sheets were held to be required and their absence barred the claim in full. So a time-bar warning is genuinely useful to an analyst. **A laytime "time bar" running from NOR tender rather than from laytime commencement is asserted in our own prior notes and could not be verified against any published form — see §14.** | Warning only. Never a computed deadline. |
| **Veson, Marcura, ShipNet, Q88, SAP IS-OIL** | No public claim-line write-back found for any of them. Veson's API is licensed. A two-person team does not become an IMOS consultancy. | Not planned. |

**Rule for this step:** a connector ships when a named customer provides credentials and a written scope. Not before.

---

## 12. The engine gaps, priced

These are not footnotes. Each is a real limitation documented in `apps/api/keel_api/engine/state_machine.py`, each changes a number, and each belongs in the backlog with its cost attached. Line references in that module are abbreviated to `state_machine.py:N` below.

| # | Gap | `file:line` | Effect | Cost to close |
|---|---|---|---|---|
| 1 | **Definition 30's conditional demurrage carve-out is not implemented.** A weather pause suspends accrual on demurrage unconditionally; no clause is consulted. | `state_machine.py:26-36`, `:356-361` | Correct for the canonical fixture, whose **Clause 4.1** ("Once on Demurrage, Always on Demurrage") expressly carves out "where the weather exception … is validly invoked". **Over-credits the charterer** on any charter party that does not say so. | There is no contract field that distinguishes the two cases. Add one (`weather_exception_applies_on_demurrage: bool`), thread it through, and test both ways. **M.** |
| 2 | **Definition 17's artificial working day is not modelled.** `WWDSHEX` and `WWDSHINC` map to `ARTIFICIAL_DAY` and `_struck_off_hours` returns the same hours for both bases. | `state_machine.py:88-96`, `:184-193` | Definition 17's unit is 24 *working* hours. A 10-hour overnight stoppage spanning ~2 working hours should suspend ~2. **This over-credits the charterer** and it is the one weather gap that produces the wrong answer rather than a stated assumption. | A working-day calendar and per-hour working/non-working classification, then a real branch in `_struck_off_hours`. No test asserts the artificial day changes the exclusion, because it does not. **L.** |
| 3 | **Definition 15's pro-rata is arithmetic nothing selects.** `_pro_rata_struck_off_hours` exists, is correct, and is never called. | `state_machine.py:83-86`, `:106-109`, `:196-209` | A charter party on definition 15's terms is computed on the wrong basis. Silent, not loud. | The ratio runs against a *stated working day*, and `CharterpartyTerms` carries no working-day term. Contract change first, then engine. Gap 2's calendar unblocks it. **S once 2 lands.** |
| 4 | **A bare `WWD` label is ambiguous between definitions 15 and 16.** `WWD` maps to `ACTUAL_PERIOD`. | `state_machine.py:65-81`, `:130-136` | Definition 15 *is* "WEATHER WORKING DAY", so the label sits closer to 15 than to 16's "WWD OF 24 CONSECUTIVE HOURS". A charter party on 15 gets 16's arithmetic. | Not fixable by picking better. Needs the clause text, or refusing to assess an ambiguous clause and escalating it to the reviewer. That is a product decision. **S for the prompt, and a policy decision on top.** |
| 5 | **The threshold falls back to a configured default.** `BEAUFORT_THRESHOLD = 6`, `PRECIPITATION_THRESHOLD_MM = 2.0` when the extractor reads no figure. | `evaluators.py:51-55`, `:94-108`; `pipeline_agents.py:480-489` | A silent default would be a fabrication. It is not silent: the justification names it as Keel's and unverified. But a voyage can still be assessed on a figure the contract never mentions. | Step 1's override-with-note closes the process hole. Extraction quality closes the rest. Also: make "no threshold stated" a first-class state rather than a silent default. **M.** |
| 6 | **`FHEX` is not implemented.** For any exception other than `SHINC`, Sundays are excluded and nothing else. | `state_machine.py:15-16`, `:213-228` | A Gulf-port charter party on FHEX gets Sunday-only exclusion. | A holiday calendar, which is a data problem first. **M, plus data.** |
| 7 | **No despatch.** A despatch rate is extracted and displayed; the engine never pays it. | `state_machine.py:387-392` | Understates a charterer's entitlement on an early completion. | A terminal-time comparison. **S.** |
| 8 | **Clause labels in the audit trail are positional, not the charterparty's own numbering.** `adapters._parse_clause_id` reads a number out of the clause *body* and falls back to `Clause {index + 1}` when there is none; the canonical fixture's clause bodies do not start with one, so every label is positional. | `adapters.py:80-94`; the renumbering is visible in `fixtures/voyage_001/extracted_charterparty.json:17-77` | The wire and the UI call the weather-exception clause `Clause 3` where the charterparty says **3.1**, the threshold clause `Clause 4` where it says **3.2**, and the definition-30 carve-out in gap 1 `Clause 5` where it says **4.1**. A reader who checks the letter against the PDF will not find "Clause 5". Document and page are still correct, so the trail is recoverable — but it is an audit-trail defect sitting directly behind the demo's voiceover, and the demo's own script leans on quoting clause numbers. | Parse the heading's own numbering (the generator emits it as `<span class="clause-num">Clause 4.1.</span>`, `scripts/generate_fixtures.py:119-123`) instead of the body's, or carry the heading text into `ClauseCitation` and let the adapter read it. Extraction-layer work, not an adapter bug. **S.** |

**Rule:** a gap that over-credits one side is a correctness bug and gets scheduled like one. Gaps 1 and 2 are. The rest are scope. Gap 8 is neither: it moves no money, but it puts a wrong clause number on a real citation, which is the one class of defect a counterparty's lawyer can use to dismiss the whole trail, so it is priced at **S** and should not be deferred behind the scope items.

Gap 8 is new as of 2026-09-30. It was not in this table before, and no document in this repository named it. The root [README](../README.md#known-limitations) records it as known limitation 4 and `AGENTS.md` records it as trap 12.

---

## 13. The checkpointer, and why it is a prerequisite rather than a nicety

`create_agent_pipeline` compiles with no checkpointer (`pipeline_agents.py:689`), and the docstring gives the reason: *"A checkpointer-less compiled graph keeps no per-run state, which is what makes sharing the single instance across requests safe."* That reasoning is correct for how the graph runs today — `app.invoke(initial_state)` start to finish, one request, one answer (`pipeline_agents.py:732-733`).

The consequence for planning is precise and worth stating plainly:

- **An `interrupt()` inside this graph cannot resume.** There is no persistence between nodes, so there is nothing to resume from and no thread id to resume under. Adding a gate inside the graph means adding a checkpointer *first* — which means adding one while the single shared compiled instance is the design, which needs either per-run graph instances or a thread id on every call.
- **A gate between runs needs neither.** Step 1's design is exactly that: the pipeline finishes, the row sits in `In Review`, a person acts. Nothing has to survive an interrupt.

So: **step 1 does not need a checkpointer, and no step in this plan does.** The first thing that would is a gate *inside* the graph, which is why there is no slot for it above. Add a checkpointer when — and only when — that is the requirement rather than a review between runs. When it comes, the acceptance test is that an `interrupt()` in the adjudicator can be resumed after a process restart and returns the identical reconciliation. Nothing less proves it.

---

## 14. Standards and competitive context, and what is verified

Checked 2026-09-30. Each claim carries its source. Anything I could not confirm is marked and left unasserted.

### The Laytime Definitions for Charter Parties 2013

**Verified, from BIMCO's own publication.** The document is BIMCO Special Circular No. 8, adopted at the Documentary Committee in Paris in May 2013, issued 10 September 2013, drafted jointly with the Baltic Exchange, CMI and FONASBA.

- **It is a list of numbered definitions, 1 to 33, under a "List of Definitions" heading after a preamble.** There is no section 6. Definition 6 is *PER HATCH PER DAY*. Any claim citing section 6 of the 2013 document, or "§6" of any kind, is citing a provision that does not exist. *(BIMCO, Laytime Definitions for Charter Parties 2013, sample-contract PDF; and the full text as reproduced in the BIMCO Special Circular No. 8 issued with VOYLAYRULES.)*
- **Its weather provisions are definitions 15, 16, 17 and 18**, and they fix how an interruption is *measured*:
  - **15 WEATHER WORKING DAY** — exclusion by reference to the ratio the interruption bears to the time which would have been worked, the reference period being 24 hours.
  - **16 WEATHER WORKING DAY OF 24 CONSECUTIVE HOURS** — the actual period during which the weather interrupted or would have interrupted work is excluded.
  - **17 WEATHER WORKING DAY OF 24 HOURS** — a period of 24 hours made up of one or more Working Days; the actual period of the interruption is excluded, and the counting unit is 24 *working* hours.
  - **18 (WORKING DAY) WEATHER PERMITTING** — the same meaning as 16.
- **No definition states a numeric weather threshold.** Reading the published full text, there is no wind force, no Beaufort figure, no rainfall figure and no threshold of any kind, and no occurrence of SHEX, SHINC or FHEX — those are charter-party drafting conventions, not terms of the Definitions. Definitions 19 to 24 are about EXCEPTED/EXCLUDED days, UNLESS SOONER COMMENCED, UNLESS USED, TO AVERAGE LAYTIME and REVERSIBLE LAYTIME; 25 to 29 are about NOR and readiness; 30 to 33 are demurrage and despatch.
- **Definition 25 (NOTICE OF READINESS)** is a definition of the notice itself and defers the timing consequence to the charter party. The engine's use of `nor_turn_time_hours` from the extracted terms is consistent with that.
- **Definition 30 (DEMURRAGE)** is the one that bites the engine: *"Demurrage shall not be subject to exceptions which apply to Laytime unless specifically stated in the Charter Party."* That is why gap 1 in §12 is a correctness bug and not a preference.
- **2013 is still the current edition.** BIMCO's contract page for it states: *"The latest edition of these definitions is the Laytime Definitions for Charter Parties 2013."*

**What this changes about our own claims.** We may say that definition 16 supplies the measurement basis, and we may quote what 15, 16, 17 and 18 say about measurement. We may not say that BIMCO supplies a threshold, a Beaufort figure, a rainfall figure, a majority test, a section 6, or a rule that weather must objectively prevent operations. The threshold and the invocation test come from the charter party; the strict-majority-of-hours test is this product's own policy, and `evaluators.py:31-34` says so in the module docstring.

### Competitive and standards context

| Claim | Verified? | Source and finding |
|---|---|---|
| Dataloy's VMS has a laytime/demurrage module with rates, tiered rates, a deduction Time Sheet, reversible terms, proration and cargo match | **Yes** | Dataloy's own product documentation, *Laytime Calculations*. It also documents "once on demurrage, always on demurrage" as its stated default and a provisional-estimate mode that locks figures while the call is still open. |
| Dataloy's claims module is a claim drawer: main details, claim causes, bills of lading, adjusted and settled amounts, and a read-only downtimes list | **Yes** | Dataloy documentation, *Claim Drawer*. |
| Marcura products are being surfaced inside Dataloy's VMS, with claims calculations triggered from port events and synced to the voyage record | **Yes** | Marcura / Dataloy partnership announcement, reported by The Digital Ship. Named products: DA-Desk, Portlog and Marcura Claims (formerly ClaimsHub). |
| BIMCO's *Standard Time Sheet (short form)* is a laytime computation worksheet, latest edition 1975, recommended by BIMCO and FONASBA | **Yes** | BIMCO contract page for the Standard Time Sheet Short Form. Its content is a deductions grid — from, to, deducted time, percentage, reason, proration — spanning laytime-commenced to laytime-completed. It is a worksheet, not a date-range selector, and it is not a data feed. |
| The demurrage claim time bar runs from completion of discharge, commonly 60/90/180 days, and strictly requires the supporting documents | **Yes** | Skuld's P&I notes on demurrage time bars; Watson Farley & Williams on demurrage time-bar clauses; and *The Adventure* [2015] EWHC 318 (Comm), where the port logs and time sheets were required and their absence barred the claim in full. |
| **A laytime "time bar" that starts at NOR tender rather than laytime commencement** | **No — unverified** | I could not find this in any published charter-party form. Every time bar I checked runs from completion of discharge. The BIMCO laytime programme for 2025–2026 lists "time bar clauses" as a live topic, which suggests forms are changing, but I have no text. **Do not write this claim anywhere.** If a customer produces one, the feature is "warn when the contractual deadline is near", never "the deadline is 90 days". |
| Veson IMOS, Marcura Claims/HubSE/Shipdem, Burmester & Vogel SailFast, Windward, Voyager, Base — the vendor and funding table in the old §13.1 of the PRD | **No — unverified** | Those rows are retained in `docs/prd.md` as a historical record and are marked unverified there. I did not re-check them and they are not load-bearing for any step in this plan. |
| Any vendor's public pricing | **No — none published** | No vendor named in this document publishes a price list for a claims-reconciliation product. The pricing table in the PRD is a hypothesis for customer discovery. |

---

## 15. What this file used to say

The previous continuation plan was aspirational and out of order. Kept as a record; the reasoning is preserved, the plan is not.

| Old section | What happened |
|---|---|
| §1 "Where we are" — listed ten defects in the LangGraph wrapper as open | All fixed. The list-form join, the both-workers retry fan-out, the cache path and the `evaluate_wwd_exception` call signature are now tested in `test_agent_graph.py` and `test_canonical.py`. Its closing line — *"Do not add maritime features on top of a graph that cannot emit a valid reconciliation"* — was correct and is why this file starts with tests, not features. |
| §3 "Current fix sprint" — a to-do list of graph fixes | Done and reviewed. Superseded. |
| §4 "Verification gate" — adversarial review of the fix sprint | Done. `pytest -m canonical -q` → 15 passed. |
| §5 "General plan after the gate" — a seven-step table led by human sign-off, then a time bar, then dual-SOF alignment | **The ordering was right and the plan was not.** Its step 1 (human sign-off) is this file's step 1; its time-bar step folded into §11 with the deadline explicitly never computed; dual-SOF alignment and claim-line reconciliation survive as scope but are not scheduled, because nothing verified in this tree makes them more urgent than the gate. |
| §5 "Defer" — the long list of good instincts | Kept. Dataloy Remark, Veson, Marcura PortLog, OCR, forecasts, chat, email ingestion: all still deferred, and §11 says why with sources. |
| §5 "Reject" — the list of things not to build | Kept, and it is the reason there is no LLM-proposed deduction anywhere in this plan. |
| §5 "API debt to clear alongside step 1" — four items | Three are done: the graph no longer runs inside GET, validation errors are persisted alongside the row (`main.py:451-491`), and concurrent runs get distinct ids (`main.py:864`). **One is not:** `pdf_urls` still advertises `/static/{id}/{name}` for documents the API never serves — `_pdf_urls` (`main.py:429-441`) says so in its own docstring, and the frontend's preview shows the honest empty state. Pick one: serve the bytes, or stop advertising the path. **S.** |
| §6 "External research" — judgements about competitor practice | Superseded by §14, which carries sources. One item moved: the old §6 asserted a NOR-tender time bar. **§14 records it as unverified.** |

**The sign-off gate stays behind nothing.** The old plan also said feature work stays blocked until the canonical path is green after review. It is green. The gate is now the first thing to build, and it is unblocked.

---

## 16. Three disclosures that are not steps

None of these is a step, and none blocks another. Two are one-line backend
changes; the third is a browser sanitiser fix. They are recorded here because
each is a fact the tree currently computes, stores or serves and then does
nothing useful with, and because a roadmap that only lists what is *large* is a
roadmap that quietly loses the small things.

### 16.1 `Reconciliation.rule_authority` never reaches the wire

**The state of it, precisely.**

| Where | What |
|---|---|
| `pipeline_agents.py:333-343` | `_cited_rule_authority(terms)` derives it: the ruleset the charterparty **expressly incorporates by name**, and `"custom"` when it incorporates none. For `voyage_001` it returns **`BIMCO_2013`**, because the fixture's page-3 clause 3.1 incorporates the 2013 definitions by name (`tests/test_canonical.py:69-74`). |
| `pipeline_agents.py:600` | Assigned to `Reconciliation.rule_authority` and persisted with the row. |
| `adapters.py:232-254` | `reconciliation_to_frontend` builds the `reconciliation` dict from `voyage_id`, `charterparty`, `owner_calculation`, `charterer_calculation`, `day_verdicts`, `reconciled_total_usd` and `math_breakdown`. **`rule_authority` is not among them.** |
| the wire | A live `GET /voyages/voyage_001` therefore has no `rule_authority` key at all. Verified against the running API: the `reconciliation` object carries exactly those seven keys. |
| `apps/web/lib/types.ts:16-29` | Declares the `RuleAuthority` union and says, in its own docstring, that *"no wire shape currently carries it, so nothing in the app reads it."* |

**Why it is a gap and not a redundancy.** The three claims this product is
careful to keep apart are the test applied, the charterparty clause, and the
measurement basis. The UI shows the second and the third: each day card carries
`bimco_clause.clause_id` (`CP_WEATHER.MAJORITY_OF_HOURS`) and
`measurement_basis` (*Laytime Definitions for Charter Parties 2013, definition
16*). Neither is `rule_authority`. What is missing is a fourth and separate
claim: **which ruleset the charterparty itself incorporates**, which governs how
its clauses are read. `Verdict.rule_authority` being `custom` and
`Reconciliation.rule_authority` being `BIMCO_2013` are both correct at once, and
today a reader can only see the first of them. On a reconciliation whose
charterparty incorporates nothing, the honest "this charterparty cites no
ruleset" is indistinguishable from silence.

**Files**

| File | Change |
|---|---|
| `apps/api/keel_api/adapters.py` | One line in `reconciliation_to_frontend`: `"rule_authority": reconciliation.rule_authority`. |
| `apps/web/lib/types.ts` | Add the field to the reconciliation interface and drop the "no wire shape currently carries it" sentence. |
| `apps/web/app/(dashboard)/voyage/[id]/reconcile/page.tsx` | Show it once, next to the existing measurement-basis line: the incorporated ruleset, or "this charterparty incorporates none" when `custom`. |

**How to verify it is done.** `GET /voyages/voyage_001` returns
`"rule_authority": "BIMCO_2013"`; a fixture whose clause 3.1 omits the
incorporation returns `"custom"`; `test_canonical.py:69-74` still passes unchanged
(it asserts the internal field, which is the source of both). **Size: S.**
Coordinate the backend and frontend change in one commit — the type and the
adapter are two halves of one contract.

### 16.2 `/docs`, `/redoc` and `/openapi.json` are unauthenticated

`app = FastAPI(title="Keel API", version="0.1.0", lifespan=lifespan)`
(`main.py:597`) sets no `docs_url`, `redoc_url` or `openapi_url`, so all three
are served, and none of them is in `_TOKEN_EXEMPT_PATHS`, which does not matter
because `AdmissionGuard` only enforces `KEEL_API_TOKEN` when that variable is
set (`main.py:546-551`, `:582-592`) — and unset is the default. Verified against
the running API: all three answer 200 to an anonymous caller.

**The exposure, measured rather than guessed.** `/openapi.json` documents **7
paths and 4 schemas**: `Body_upload_voyage_voyages_post`, `HTTPValidationError`,
`StatusUpdateRequest` and `ValidationError`. No internal Pydantic model is
leaked — `schemas.py`'s `Reconciliation`, `CharterpartyTerms` and the rest do not
appear, because the adapter hands the browser a dict FastAPI never typed as a
response model. No document bytes are reachable from it. What it *is* is
reconnaissance: it tells an anonymous caller that this service exists, what it
accepts, which status codes it returns and which multipart names it honours,
which is a map of the upload surface for anyone who wants one.

**Why it is listed rather than dismissed.** It is not a vulnerability, and it
should not be described as one. It is also not "genuinely trivial and correct"
in the sense of *leave it alone*: the honest fix is small, it is in one file the
deployer already configures, and leaving it unstated is what makes it look like a
decision nobody made.

**Files**

| File | Change |
|---|---|
| `apps/api/keel_api/main.py` | `docs_url`/`redoc_url`/`openapi_url` from the environment, defaulting to `None` when `KEEL_API_TOKEN` is set and to FastAPI's own defaults when it is not. One constructor call plus a helper. |
| `README.md`, `apps/web/README.md` | Already describe it as unauthenticated and measured; update the counts if the schema set changes. |

**How to verify it is done.** With `KEEL_API_TOKEN` set, `/docs`, `/redoc` and
`/openapi.json` are 404 (or 401) for an anonymous caller and the reference is
reachable with the token; with it unset they are 200, which is the documented
local-dev behaviour. `test_api_hardening.py` already asserts the token guard's
route coverage and is where both cases belong. **Size: S.**

### 16.3 The letter sanitiser's stylesheet reject list is a blacklist

`apps/web/lib/sanitize-html.ts` keeps the letter's typography by hoisting a
`<style>` element found in the parsed `<head>` (`sanitizeLetterHtml`,
`:130-139`) and re-emitting it through `serializeStyleSheet` (`:104-107`), which
returns `""` for an empty sheet, for a body containing `<` or `>`, and for one
containing `@import`, `url(`, `expression(` or `javascript:`. A `<style>`
element anywhere else is dropped with its content by `DROP_WITH_CONTENT`
(`:67-94`), which is consulted at `:117` before the element is looked at any
further — so the body-level case is closed, and a `style` *attribute* is never
kept because only `class` is in the attribute allowlist.

**What is still open.** The five tokens are a blacklist over CSS, and CSS can
fetch without any of them. Verified in Chromium by sanitising markup, injecting
the result, and watching the request log: `url()`, `@import` and `expression()`
sheets issue **no** request, a body-level sheet issues **no** request, and
`p{background-image:image-set("//host/x.png")}` **does** issue an off-document
GET. No script executes in any of them — `window.__XSS` was never set — but the
letter is injected into the app's own page, which carries no CSP, so the API
response's `style-src 'unsafe-inline'` does not contain it. The exposure is a
request that leaves the browser, not code that runs in it.

**Why it is not being fixed with one more regex.** Adding `image-set(` closes
this instance and the next one is `cross-fetch(` or a future fetch primitive.
Pattern-matching CSS is a losing position.

**Files**

| File | Change |
|---|---|
| `apps/web/lib/sanitize-html.ts` | Stop blacklisting. Either compare the sheet to the one `letter/render.py` ships and drop anything that is not byte-identical, or accept a stylesheet by hash/number from the server so the browser never has to judge CSS at all. |
| `apps/web/tests/e2e/fabricated-data.spec.ts` | `the sanitised real letter keeps its content and its stylesheet` (`:302-313`) must keep passing — it is the test that says the typography survives. Add the `image-set()` case beside it. |

**How to verify it is done.** The existing stylesheet test still passes; a
sanitised sheet containing `image-set("//host/x.png")` issues no request; and no
CSS the server did not send survives at all. **Size: S**, and it is a better fix
than the regex because it also removes the need for a CSS parser in the
browser.
