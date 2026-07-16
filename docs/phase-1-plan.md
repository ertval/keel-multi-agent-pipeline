# Keel — Phase 1 Alpha Hardening Plan

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

| Area | Current state (verified) | File |
|------|--------------------------|------|
| Persistence | SQLite, single `voyages(id TEXT PK, data_json TEXT, created_at TEXT, owner_name TEXT)` table — the whole reconciliation is a JSON blob. No `tenant_id`. Schema migrated by inline `ALTER TABLE`. | `apps/api/keel_api/store.py` |
| Dead persistence layer | `database.py` exists but is **imported nowhere**. | `apps/api/keel_api/database.py` |
| Auth / tenancy | **None.** No auth dependency, no JWT, no `tenant_id`, CORS is `allow_origins=["*"]`. | `apps/api/keel_api/main.py` |
| Task processing | FastAPI in-process `BackgroundTasks`; uploaded PDFs land in temp dirs; status tracked in memory (lost on restart). | `apps/api/keel_api/main.py`, `pipeline.py` |
| Totals source | Reconciliation totals come from the **extracted claim amounts**, not the engine. `owner_total = round(owner_claim/1000)*1000` (engine `demurrage_due_usd` used only as a fallback when the claim is 0). | `apps/api/keel_api/pipeline.py` L206–213 |
| Orphaned demo logic | `reconcile/adjudicator.py` + `differ.py` are **imported nowhere** and hardcode `date(2026,6,14/15/16)` verdicts with an `is_canonical` branch. | `apps/api/keel_api/reconcile/` |
| BIMCO rules | One evaluator, a *simplified* WWD approximation (`wind_force ≥ 6` **or** `precip ≥ 2.0 mm/h`, then majority + ops-prevented). Thresholds are module constants, not per-clause config. No Def 15/16. | `apps/api/keel_api/rules/evaluators.py` |
| FHEX bug | `_eligible_laytime_hours` excludes `weekday() == 6` (Sunday) for *both* SHEX and FHEX. **FHEX silently behaves like SHEX** — it should except Fridays (weekday 4). | `apps/api/keel_api/engine/state_machine.py` L36–44 |
| Weather | Fixture JSON only (`FixtureWeatherProvider`). `WeatherProvider` Protocol exists in `schemas.py`; no live provider implemented. | `apps/api/keel_api/weather/fixture_provider.py` |
| Extraction | Single LLM call per doc; charterparty text **truncated at 12,000 chars**; 30s timeout, 3 retries; no confidence scoring, no document-hash / model-version capture. | `apps/api/keel_api/extraction/extractor.py` |
| Document routing | **Filename-based** (`_PYMUPDF_NAMES = {"charterparty.pdf"}`); text-only PDFs; no OCR, no scanned-document detection. | `apps/api/keel_api/parsing/dispatcher.py` |
| Frontend ↔ API | Live API (`USE_MOCK=false`); pipeline progress via **polling** (`pollVoyageStatus`), not SSE/WebSocket. | `apps/web/lib/api.ts` |
| Tests | Canonical $112K assertion + a new 4-case reconciliation checking loop (`test-cases/` + `test_reconciliation_cases.py`), one case proven through the live LLM. | `apps/api/tests/` |

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
- Replace `allow_origins=["*"]` with an explicit allowlist.
- `/api/v1/` versioning; payload-size limits; rate limiting.
- JWT auth with tenant-scoped claims (see §1.5).
- **Remove orphaned `reconcile/adjudicator.py` + `differ.py`** (hardcoded
  canonical-date verdicts) — they are dead and actively misleading.

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
- *(P0)* Implement BIMCO 2013 **Def 15** (pro-rata) and **Def 16** (actual
  interruption) correctly — the current single threshold is an illustrative demo,
  not a faithful definition.
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
- *(Known deferred bug)* the letter "PDF" button currently serves HTML — fold the
  fix into the export work.

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
