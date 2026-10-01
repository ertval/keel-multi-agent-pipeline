# Keel — Phase 1 Alpha Hardening Plan

> ## ⚠️ SUPERSEDED — 2026-09-30
>
> **This document is a historical record and nothing in it shipped.** It is kept
> for the reasoning behind it, not as a plan. The working roadmap is
> [docs/continuation-plan.md](continuation-plan.md), whose step 1 is a human
> sign-off gate on extracted terms and SOF events. The code as it actually is is
> described in [AGENTS.md](../AGENTS.md) and [README.md](../README.md).
>
> Do not act on the "current state" audit in §0 without re-verifying it: that
> table was written against the `alpha-prep` branch and several of its rows are
> now false. The rows that changed are corrected **in place**, each marked
> `> **Superseded — <date>:**`, and everything else is left as written.
>
> Three terms are worth stating plainly here because the plan uses them as if
> they were goals this build met:
>
> - **"enterprise-alpha"** (§Status) was never reached. There is no
>   multi-tenancy, no Postgres, no queue, no observability, and no
>   human-in-the-loop review UI in this repo. There is no SOC 2, ISO, or GDPR
>   certification and none is claimed anywhere. **On "no auth":** the route guard
>   is a demo stub and there is no identity, no session and no `tenant_id` — but
>   the API is not unguarded against *configured* callers. An optional shared
>   `KEEL_API_TOKEN` gates every route except `/healthz` (`main.py:546-552`,
>   `:562-594`), off by default, and it is one shared secret with no expiry, no
>   rotation and no per-voyage check. §0 records the same thing; "no auth" in the
>   sentence above means no authentication *system*.
> - **No customer or pilot data exists.** The only voyage is the Piraeus fixture
>   `voyage_001`.
> - **The free-tier cost tables in §2** were research verified in May 2026 and
>   have not been re-checked. They are planning input, not a quotation.

**Status:** Plan for review (not yet started). Derived from PRD §13.2.
**Window:** Months 1–6, 2-person team.
**Goal:** Take the hackathon MVP from "demo-grade" to "enterprise-alpha" — robust
enough for 2–3 pilot customers (SME operators, 5–50 vessels) and investor due
diligence.

This plan is grounded in the *actual* codebase as it stands on the `alpha-prep`
branch, not an idealized version. Every "current state" claim below cites the
file it came from so the scope is honest.

---

## 0. Where we actually are (codebase audit)

> **Superseded — 2026-09-30:** written against `alpha-prep`. Rows corrected below
> are now false as written; the rest were accurate and are left alone.

| Area | Current state (verified) | File |
|------|--------------------------|------|
| Persistence | SQLite, single `voyages(id TEXT PK, data_json TEXT, created_at TEXT, owner_name TEXT)` table — the whole reconciliation is a JSON blob. No `tenant_id`. Schema migrated by inline `ALTER TABLE`. | `apps/api/keel_api/store.py` |
| Dead persistence layer | `database.py` exists but is **imported nowhere**. | `apps/api/keel_api/database.py` |
| Auth / tenancy | **None.** No auth dependency, no JWT, no `tenant_id`, CORS is `allow_origins=["*"]`. <br>*Superseded — 2026-09-30: the CORS claim is no longer true. `allow_origins` now defaults to `["http://localhost:3000"]` and is overridable with `KEEL_CORS_ORIGINS` (`main.py:547`, `:601-607`), and an **optional** shared `KEEL_API_TOKEN` can require a bearer token on every route except `/healthz` (`main.py:546-552`, `:562-594`). It is off by default, there is still no identity and still no `tenant_id`, so the §1.5 work below is entirely undone.* | `apps/api/keel_api/main.py` |
| Task processing | FastAPI in-process `BackgroundTasks` calls `run_voyage_pipeline`, which invokes the LangGraph in `pipeline_agents.py` synchronously inside that task. No checkpointer. Uploaded PDFs land in temp dirs; status tracked in memory (lost on restart). | `apps/api/keel_api/main.py`, `pipeline.py`, `pipeline_agents.py` |
| Totals source | The graph adjudicator sets reconciled dollars from each party's engine `demurrage_due_usd`, plus weather credits. It does not use the old linear rule (rounded extracted claim amounts, engine only as a fallback). <br>*Superseded — 2026-09-30: this row is now **backwards**. The adjudicator does use the extracted claim amount, rounded, and falls back to the engine only when that claim is zero (`pipeline_agents.py:579-590`); the reconciled total is the rounded charterer total plus the sum of the per-day credits (`:591-592`). `reconciled = charterer base + items favouring the owner`.* | `apps/api/keel_api/pipeline_agents.py` adjudicator node |
| Orphaned demo logic | `reconcile/adjudicator.py` + `differ.py` are **imported nowhere** and hardcode `date(2026,6,14/15/16)` verdicts with an `is_canonical` branch. <br>*Superseded — 2026-09-30: **deleted**, along with the whole `keel_api/reconcile/` package. The money rule now lives in `pipeline_agents.adjudicator_node` plus `apps/api/keel_api/adapters.py`.* | ~~`apps/api/keel_api/reconcile/`~~ |
| BIMCO rules | One evaluator, a *simplified* WWD approximation (`wind_force ≥ 6` **or** `precip ≥ 2.0 mm/h`, then majority + ops-prevented). Thresholds are module constants, not per-clause config. No Def 15/16. <br>*Superseded — 2026-09-30, on two counts.* (1) **Sourcing:** the numeric threshold is the *charterparty's own term*, not a BIMCO one. The Laytime Definitions for Charter Parties 2013 set no wind force and no precipitation figure; they supply only the measurement basis (definition 16), and a weather verdict's `rule_authority` is `custom` (`rules/evaluators.py:3-42`, `:60-65`). Never attribute a threshold to BIMCO. (2) **Status:** the thresholds are now read off the charterparty when the extractor can, falling back to `BEAUFORT_THRESHOLD = 6` / `PRECIPITATION_THRESHOLD_MM = 2.0` with the fallback named as unverified (`evaluators.py:51-55`, `:94-108`); definition 16 is the measure actually applied. Definition 15 remains arithmetic with no clause selecting it, and definition 17's artificial working day is still not modelled (`engine/state_machine.py:83-96`). | `apps/api/keel_api/rules/evaluators.py` |
| FHEX bug | `_eligible_laytime_hours` excludes `weekday() == 6` (Sunday) for *both* SHEX and FHEX. **FHEX silently behaves like SHEX** — it should except Fridays (weekday 4). <br>*Superseded — 2026-09-30: the bug is unchanged and is now documented in the module docstring, but the line reference is stale — the function is at `engine/state_machine.py:213-228`, not L36–44. FHEX remains unimplemented (`state_machine.py:14-17`).* | `apps/api/keel_api/engine/state_machine.py` `:213-228` |
| Weather | Fixture JSON only (`FixtureWeatherProvider`). `WeatherProvider` Protocol exists in `schemas.py`; no live provider implemented. | `apps/api/keel_api/weather/fixture_provider.py` |
| Extraction | Single LLM call per doc; charterparty text **truncated at 12,000 chars**; 30s timeout, 3 retries; no confidence scoring, no document-hash / model-version capture. | `apps/api/keel_api/extraction/extractor.py` |
| Document routing | **Filename-based** (`_PYMUPDF_NAMES = {"charterparty.pdf"}`); text-only PDFs; no OCR, no scanned-document detection. | `apps/api/keel_api/parsing/dispatcher.py` |
| Frontend ↔ API | Live API (`USE_MOCK=false`); pipeline progress via **polling** (`pollVoyageStatus`), not SSE/WebSocket. | `apps/web/lib/api.ts` |
| Tests | Canonical $112K assertion + a new 4-case reconciliation checking loop (`test-cases/` + `test_reconciliation_cases.py`), one case proven through the live LLM. | `apps/api/tests/` |

> **Superseded — 2026-09-30:** the test row is incomplete rather than wrong. 330
> tests are collected; `uv run pytest -q` gives **16 failed, 313 passed, 1
> skipped**, and the 16 are missing source PDFs rather than product defects.
> `uv run pytest -m canonical -q` gives **15 passed**. The frontend adds 31
> Playwright tests. See [README.md](../README.md#tests).
>
> Also: parsing is no longer in-process. `parse()` fork+execs a sandbox with an
> address-space limit and a wall clock (`parsing/dispatcher.py:79-115`,
> `parsing/sandbox.py`, `parsing/limits.py`), and the upload path has real
> admission control (`main.py:175-194`, `:215-325`, `:775-872`).

**Implication for sequencing:** multi-tenancy is *foundational* — it touches the
DB schema, every query, auth, and the audit log. It must land before pilot data
exists, otherwise it becomes a migration nightmare. Everything else can be
layered behind it.

---

## 1. Workstreams

Priorities use the PRD's convention: **P0** = required for first pilot, **P1** =
required before a second/third pilot, **P2** = Phase-1 stretch / Phase-2 seed.

### 1.1 Backend architecture rewrite (PRD §13.2.1)

**Database: SQLite → PostgreSQL** *(P0)*
- Introduce SQLAlchemy 2.0 async + Alembic. Replace the `data_json` blob with
  normalized tables: `tenants`, `users`, `voyages`, `charterparty_terms`,
  `sof_events`, `disputed_items`, `verdicts`, `audit_entries`.
- Every table carries `tenant_id`. Persist pipeline status (today it's in-memory).
- **Delete `database.py`** (dead) so there is one persistence layer, not two.
- Migration path: keep the existing Pydantic schemas as the API contract; map
  them to ORM models so the frontend contract doesn't churn.

**Task processing: BackgroundTasks → ARQ + Redis** *(P0)*
- Move the pipeline off in-process `BackgroundTasks` onto ARQ with a Redis broker.
- Add a task-status API + SSE/WebSocket for live progress (replaces polling).
- Dead-letter queue for failures; `tenacity` exponential backoff around LLM calls
  (today there's a fixed 3× retry / 2s delay in `extractor.py`).
- Move uploaded PDFs out of temp dirs into object storage with presigned URLs.

**Observability: zero → production-grade** *(P1)*
- OpenTelemetry tracing across pipeline stages; JSON structured logs with a
  per-voyage correlation ID; Sentry for errors. Prometheus/p95 latency + LLM
  token metrics can be P1/P2.

**API hardening** *(P0 for the security items)*
- ~~Replace `allow_origins=["*"]` with an explicit allowlist.~~
  > **Superseded — 2026-09-30: done.** `allow_origins` defaults to
  > `["http://localhost:3000"]`, overridable with `KEEL_CORS_ORIGINS`
  > (`main.py:547`, `:601-607`). Payload-size limits also landed (25 MB per
  > document, 60 MB per request, 12 documents, a 200-page cap, and a subprocess
  > with an address-space limit — `main.py:175-194`, `parsing/limits.py`).
  > Rate limiting did **not**: the only concurrency control is the run-slot cap
  > that returns 429 (`main.py:842-849`). `/api/v1/` versioning and JWT auth with
  > tenant-scoped claims (§1.5) did not.
- `/api/v1/` versioning; payload-size limits; rate limiting.
- JWT auth with tenant-scoped claims (see §1.5).
- ~~**Remove orphaned `reconcile/adjudicator.py` + `differ.py`** (hardcoded
  canonical-date verdicts) — they are dead and actively misleading.~~
  > **Superseded — 2026-09-30: done.** Both files and the `keel_api/reconcile/`
  > package are deleted. The money rule is in `pipeline_agents.adjudicator_node`
  > plus `adapters.py`.

**Semantic validation layer (new)** *(P1)*
- Range checks on extractions (demurrage $1K–$200K/day, laytime > 0, NOR before
  loading start); chronological-order checks on SOF timestamps; per-field
  confidence scoring; capture document hash + model/prompt version on every
  extraction for reproducibility.

**Immutable audit log (new)** *(P1)*
- Append-only (WORM) `audit_entries` with `user_id`, `tenant_id`, `timestamp`,
  `document_hash`, `model_version`, `rule_version` for every action. Persisted to
  Postgres, archived to object storage.

### 1.2 Document processing (PRD §13.2.2)

- *(P0)* **Replace filename routing** (`dispatcher.py`) with content-based
  classification (heuristic or LLM). The current `{"charterparty.pdf"}` map breaks
  the moment a real customer uploads `CP_final_v3.pdf`.
- *(P0)* **Fail loudly on scanned/image PDFs** — detect "no extractable text" and
  reject with a clear error rather than silently producing garbage.
- *(P0)* **HITL extraction review**: surface extracted terms + timeline for analyst
  verification *before* the engine runs (a 12-hour AM/PM misread produces a
  confidently wrong dollar figure). Needs backend (persist drafts + corrections)
  and frontend (§1.6).
- *(P1)* Chunked extraction for charterparties beyond the 12K-char truncation.
- *(P1)* **Golden-dataset CI gate**: the new `test-cases/` harness is the seed.
  Grow it to 20+ real CP/SOF pairs and run it on every PR + nightly to catch
  extraction regressions from prompt/model drift.
- *(Beta, Month 3–4)* Azure Document Intelligence / Google Document AI for scanned
  SOF tables. *(GA, Month 5–6)* multimodal page-image extraction.

### 1.3 Weather provider (PRD §13.2.3)

- *(P0)* Implement `OpenMeteoWeatherProvider` against the existing
  `WeatherProvider` Protocol; feature-flag fixture ↔ Open-Meteo ↔ uploaded logs.
  Convert wind speed → Beaufort programmatically.
- *(P1)* **Port-authority log upload** — the only source with real arbitration
  weight. Plus analyst manual override of a weather verdict, logged to the audit
  trail.
- Frame Open-Meteo (ERA5 ~31 km grid) as *corroboration*, not definitive evidence,
  in the UI — opposing counsel will challenge interpolated reanalysis.

### 1.4 BIMCO rule library (PRD §13.2.4)

- *(P0)* **Fix FHEX** in `state_machine.py` (except Friday, weekday 4, not Sunday).
  Low effort, currently wrong.
- *(P0)* Refactor `rules/evaluators.py` into a **rule-registry pattern**: each rule
  a self-contained class with `rule_id`, `evaluate(observations, terms, window)`,
  `cite()`. Make Beaufort/precip thresholds **configurable per CP clause** (today
  they're module constants).
  > *Superseded — 2026-09-30, partly: the thresholds are configurable per CP
  > clause — `CharterpartyTerms.weather_beaufort_threshold` and
  > `weather_precipitation_threshold_mm` are extracted from the document and
  > passed into `evaluate_wwd_exception`, with Keel's module constants only as a
  > named fallback (`schemas.py:73-74`, `pipeline_agents.py:479-511`). No
  > registry pattern exists.*
- *(P0)* Implement BIMCO 2013 **Def 15** (pro-rata) and **Def 16** (actual
  interruption) correctly — the current single threshold is an illustrative demo,
  not a faithful definition.
  > *Superseded — 2026-09-30: definition 16's measure is what the engine now
  > applies, and it is named per verdict in `measurement_basis`. Definition 15's
  > pro-rata arithmetic exists (`_pro_rata_struck_off_hours`) but **no clause
  > selects it**, and definition 17's artificial working day is **not modelled**,
  > so `WWDSHEX`/`WWDSHINC` run on the actual-period measure
  > (`engine/state_machine.py:83-96`, `:184-209`). And the framing itself was
  > wrong: no BIMCO definition supplies a numeric weather threshold. The threshold
  > and the invocation test are the charterparty's own terms
  > (`rules/evaluators.py:3-42`).*
- *(P0/P1)* Custom port holiday calendars (P0); WIBON NOR validity + VOYLAYRULES 93
  (P1). Reversible/multi-hatch laytime is P2.
- **Legal validation gate**: have a maritime lawyer review any rule codification
  before it ships to a pilot — a wrong rule that leads a client to an indefensible
  position is a liability.

### 1.5 Multi-tenancy & access control (PRD §13.2.5)

- *(P0, foundational)* Postgres **RLS on `tenant_id`** *plus* application-layer ORM
  query filters on every query — do **not** rely on RLS alone, because async
  connection-pool reuse can leak tenant context if `set_config` isn't reset.
- *(P0)* JWT with `tenant_id` + `role` (`analyst`, `admin`) claims; refresh-token
  rotation; CSRF protection for the Next.js app. Managed identity via Supabase
  Auth or Auth0.
- *(P2 → V2)* `voyage_participants` junction (`voyage_id`, `tenant_id`,
  `party_role`) for owner/charterer many-to-many access.

### 1.6 Frontend alpha (PRD §13.2.6)

- *(P0)* **HITL extraction review UI** — extracted terms side-by-side with the
  source doc, low-confidence fields highlighted, manual correction before the
  engine runs.
- *(P1)* SSE/WebSocket live pipeline status (replace `pollVoyageStatus`).
- *(P1)* Assessment-override UI with justification → audit trail.
- *(P1)* Dashboard filter/sort/search; status workflow Processing → In Review →
  Reconciled → Closed; CSV/Excel/PDF exports; tablet-responsive layout.
  > *Superseded — 2026-09-30: the status workflow landed as a manual PATCH, not an
  > automatic one — `PATCH /voyages/{id}/status` accepts `Reconciled`,
  > `In Review`, `Pending`, `Closed` (`main.py:687-696`), and an uploaded voyage
  > is persisted as `"In Review"` pending analyst approval (`main.py:480`). The
  > export is **CSV only** (`app/(dashboard)/reports/page.tsx:466-473`). Filter,
  > search, XLSX and PDF export did not.*
- ~~*[Known deferred bug]* the letter "PDF" button currently serves HTML — fold the
  fix into the export work.~~
  > **Superseded — 2026-09-30: no longer a bug, and there is nothing to fold
  > into.** The API serves HTML only and returns a 400 for `?format=pdf`, naming
  > the browser's Print → Save as PDF instead (`main.py:757-772`); the letter page
  > calls it and handles the refusal honestly
  > (`apps/web/app/(dashboard)/voyage/[id]/letter/page.tsx:59-83`). Note that
  > "Print / Save as PDF" (`:397`) is **not** a page-level button — it is the
  > primary action in the Delivery modal's `DialogFooter` (`:387`), reached by
  > clicking *Send to Other Party* (`:126`). The page-level buttons are *Send to
  > Other Party*, *Download PDF* (`:135`) and *Print* (`:143`).
  > There is still no
  > server-side PDF generation, which remains absent by design.

---

## 2. Deployment architecture — can the alpha run for free?

**Short answer: yes, an alpha can be hosted entirely on free tiers — but the
PRD §13.2.7 table has two stale assumptions that must be corrected, and "free"
means accepting cold starts and a few hard caps.** Figures below were
re-verified in May 2026 (sources at the end).

### 2.1 Two corrections to PRD §13.2.7

1. **Fly.io no longer has a free tier.** It was removed in 2024; new accounts get
   only $5 in trial credits. A minimal always-on machine is ~$2/mo. So Fly is a
   *cheap* option, not a *free* one. **Render's free web service is the genuinely
   free container path** (with the cold-start caveat below). Railway likewise has
   no standing free tier (trial credit only).
2. **Vercel Hobby prohibits commercial use.** The Hobby plan is free but is
   restricted to non-commercial personal use, and its functions cap at 60s. A
   commercial pilot / VC-demo product therefore can't sit on Hobby. **Use
   Cloudflare Pages for the frontend** (free, no commercial restriction, no hard
   bandwidth cap) or move to Vercel Pro ($20/mo).

Note also: the API must run as a **long-lived container** (the pipeline + ARQ
worker need a persistent process and >60s budget) — this rules out
serverless-function hosting for the backend regardless of plan, which matches the
PRD's own note.

### 2.2 Free-tier component comparison (verified May 2026)

| Component | Free option (recommended) | Free-tier reality | Notable alternative |
|-----------|---------------------------|-------------------|---------------------|
| Frontend | **Cloudflare Pages** | Free; 500 builds/mo; no hard bandwidth cap; **commercial use allowed**; 25 MiB/asset | Vercel Hobby (free, **non-commercial only**, 60s fn) / Vercel Pro $20/mo |
| API + ARQ worker (container) | **Render free web service** | 512 MB / 0.1 CPU; **spins down after 15 min idle**, ~1 min cold start; **ephemeral filesystem** | Fly.io ~$2/mo always-on (no free tier); Render Starter $7/mo always-on |
| Postgres | **Neon free** | 0.5 GB/project, 100 CU-hrs/mo, scale-to-zero (auto-suspend ~5 min) | **Supabase free** — 500 MB DB + 1 GB files + **Auth + RLS bundled**, but **pauses after 7 days idle** |
| Redis broker | **Upstash Redis free** | 500K commands/mo, 256 MB, 10 DBs | Render Redis (paid) |
| Object storage (PDFs/letters) | **Cloudflare R2 free** | 10 GB storage, **zero egress fees**, 1M Class-A + 10M Class-B ops/mo | Supabase Storage (1 GB on free) |
| Error tracking | **Sentry free** | 5,000 errors/mo, 1 user, 30-day retention | self-host (overkill for alpha) |
| Product analytics | **PostHog free** | 1M events/mo, 5K session recordings, 100K error events | — |

### 2.3 Recommended free alpha stack

- **Frontend:** Cloudflare Pages.
- **Backend (API + ARQ worker):** Render free — but see the caveat: Render free
  workers also spin down, so for a *demo* run API + worker in **one** container, or
  budget the $7/mo Render Starter for an always-on API.
- **Postgres + Auth:** **Supabase free** is the pragmatic pick because it bundles
  Auth + RLS (directly serves §1.5) and gives 1 GB file storage. Its 7-day
  auto-pause is the catch — mitigate with a lightweight cron ping. If you'd rather
  keep auth separate, **Neon free** has friendlier scale-to-zero economics but no
  bundled auth.
- **Redis:** Upstash free (well within 500K cmd/mo at pilot volume).
- **Object storage:** Cloudflare R2 (zero egress is ideal for serving citation
  PDFs to the viewer — this also resolves the ephemeral-filesystem problem on
  Render free).
- **Observability:** Sentry + PostHog free.

### 2.4 What "free" costs you (caveats)

- **Cold starts:** Render free (~1 min after 15-min idle), Neon scale-to-zero
  (~seconds), Supabase 7-day pause (manual/cron unpause). Fine for an async,
  human-in-the-loop claims tool; **not** fine for a live, latency-sensitive VC demo
  unless you warm it first.
- **Ephemeral filesystem on Render free** → uploaded PDFs *must* go to R2
  (which we want anyway).
- **Caps to watch:** Sentry 5K errors/mo is the tightest; Neon 0.5 GB and Upstash
  500K cmd/mo are generous for 2–3 pilots.

### 2.5 Cost ladder (when free isn't enough)

| Tier | Monthly | What it buys |
|------|--------:|--------------|
| All-free | **$0** | Functional alpha; cold starts; manual unpause; not demo-warm |
| Demo-reliable | **~$7** | Render Starter ($7) always-on API → no API cold start |
| Comfortable | **~$27** | + Vercel Pro ($20) if Vercel is required for the frontend |
| Pilot-grade | **~$40–60** | + always-on worker + Supabase Pro ($25) to kill the 7-day pause |

### 2.6 CI/CD (PRD §13.2.7)

- GitHub Actions: lint → test → build → deploy(staging) → smoke → deploy(prod).
- **The canonical $112K assertion + the `test-cases/` reconciliation loop run as a
  required PR gate** (the harness already exists; wire it into CI).
- Alembic migrations with automated rollback.

---

## 3. Suggested 6-month sequencing (2-person team)

1. **Months 1–2 (foundation):** Postgres + Alembic + SQLAlchemy async; multi-tenancy
   (RLS + ORM filters) + JWT auth; remove dead code (`database.py`,
   `reconcile/`); CORS allowlist; ARQ + Redis + object storage; deploy the free
   stack + CI gate. **Fix FHEX.** Content-based document routing + fail-loud on
   scanned docs.
2. **Months 2–4 (correctness + trust):** rule-registry refactor + BIMCO Def 15/16
   + per-clause thresholds; `OpenMeteoWeatherProvider` + port-log upload + manual
   override; HITL extraction-review UI + SSE progress; semantic validation +
   immutable audit log; golden-dataset growth.
3. **Months 4–6 (pilot polish):** Document AI for scanned SOFs; dashboard
   filter/sort/search + exports (incl. the letter-PDF fix) + tablet layout;
   observability depth (OTel/Prometheus); legal review of rule codifications;
   harden for 2–3 pilots.

---

## 4. Explicitly NOT in Phase 1

Reversible/multi-hatch laytime, VOYLAYRULES 93 beyond P1 scoping, multi-party
collaboration / dispute threads / settlement workflow, clause-intelligence corpus,
port-intelligence layer, agentic/Temporal workflow engine, email ingestion — all
Phase 2+ (PRD §13.3).

---

## 5. Sources (free-tier figures, verified May 2026)

- [Render — Deploy for Free (docs)](https://render.com/docs/free)
- [Fly.io — Resource Pricing (docs)](https://fly.io/docs/about/pricing/) · [Fly.io Free Tier 2026: What's Left After the Cuts?](https://www.saaspricepulse.com/tools/flyio)
- [Vercel — Hobby Plan (docs)](https://vercel.com/docs/plans/hobby) · [Vercel Functions Limits](https://vercel.com/docs/functions/limitations)
- [Cloudflare R2 — Pricing (docs)](https://developers.cloudflare.com/r2/pricing/) · [Cloudflare Pages — Limits (docs)](https://developers.cloudflare.com/pages/platform/limits/)
- [Neon vs Supabase Free Tier — 2026 Deep Dive](https://agentdeals.dev/neon-vs-supabase)
- [Upstash — Pricing & Limits (docs)](https://upstash.com/docs/redis/overall/pricing)
- [Sentry — Pricing](https://sentry.io/pricing/) · [PostHog — Pricing](https://posthog.com/pricing)
