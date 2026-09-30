> **Superseded.** Controlling text is [docs/KEEL_UNIFIED_REPORT.md](KEEL_UNIFIED_REPORT.md). This file is retained as a source. Do not cite it where it conflicts with the unified report.

# Keel — Free Demo Hosting Report

**Date:** 2026-09-30
**Method:** 7 parallel research agents + direct verification of every repo-specific claim below (I read the files; the agents did the vendor research).
**Evidence standard:** every platform limit is cited to a vendor URL. Anything a research agent could not confirm is marked **[unverified]**. Two agents hit search-provider rate limits (HTTP 429) partway; their gaps are listed in §9.

---

## FINDINGS AT A GLANCE

Every finding from the 7 research agents and my own verification, consolidated. Sections in brackets point to detail.

### A. Findings about the repo (verified by me, not agent claims)

| # | Finding | Impact | § |
|---|---|---|:--:|
| A1 | **No Dockerfile and no `docker-compose.yml` exist.** The README's `docker compose up --build` is fiction. | Blocks every container-based deploy | 0 |
| A2 | **`USE_MOCK` does not cover the two fetches the demo depends on** — `fetchVoyageDetail` (`api.ts:156`) and `fetchVoyages` (`:203`) always hit the network. Mock branches exist only at 129, 219, 256, 284, 302, 323. | Demo mode does not exist today | 0, 3 |
| A3 | **`apps/web/public/mock-pdfs/` is empty.** The PDF citation viewer has no PDF to render offline. | The click-row→bbox-highlight moment — the best part of the demo — cannot render without a backend | 0, 3 |
| A4 | **`PdfViewer.tsx:10` loads its worker from `unpkg.com`.** An external CDN inside the demo's most impressive feature. | Single point of failure on bad conference wifi | 0, 3 |
| A5 | **No fetch timeout anywhere** in `api.ts` (8 `fetch()` call sites). | A ~1 min cold start shows a spinner for a minute. A minute of spinner is functionally a crash. | 0, 3, 7 |
| A6 | **`main.py:40-43` resolves `parents[3]/"fixtures"` and mounts `StaticFiles` at import time** — which raises if the directory is missing. | **Any Dockerfile that copies only `apps/api` crashes on boot** | 0, 5 |
| A7 | **`database.py` uses a CWD-relative `sqlite:///keel.db`.** | DB lands in `/` unless `WORKDIR` is set | 0, 5 |
| A8 | **`store.py:21-22` already has a `KEEL_DB` env seam.** | Repointing the DB is a config change, not a code change | 0, 8 |
| A9 | **`_get_or_seed_voyage()` (`main.py:66-94`) self-heals.** A wiped `keel.db` re-seeds `voyage_001` on the first `GET`. | **No persistent database is needed for a demo** | 0, 8 |
| A10 | **`api.ts` uses template concatenation** (`${API_BASE_URL}/voyages`, 7 sites) — not `new URL(path, base)`. | Setting `NEXT_PUBLIC_API_URL=""` yields same-origin relative fetches → single-container, zero-CORS architecture works | 0, 5 |
| A11 | **Upload URLs are already broken, independent of hosting.** `main.py:216` writes to `tempfile.mkdtemp()` but `:88-92` hardcodes `pdf_urls` to `/static/{id}/*.pdf`, and `/static` is mounted only from git-tracked `fixtures/`. | **Any uploaded voyage's citation link 404s.** Pre-existing bug | 7 |
| A12 | **The production build falls back to `http://localhost:8000`** if `NEXT_PUBLIC_API_URL` is unset (`next.config.ts:13`, `api.ts:15`). | Ship a bundle pointing at your own laptop; every judge sees an empty dashboard. **Make the production build throw.** | 3, 7 |
| A13 | **`app/api/voyages/route.ts` is a B-02 mock** and is the only thing forcing static-export failure. | Move it aside (don't delete) to enable `output: 'export'` | 5 |
| A14 | **`reconcile/adjudicator.py` hardcodes `date(2026,6,14/15/16)` verdicts** behind an `is_canonical` branch, and is imported nowhere (dead code). | A judge reading it kills the "deterministic rules engine" claim instantly. Fix before demo. | 7 |
| A15 | **`state_machine.py:44` excepts Sunday for both SHEX and FHEX** — FHEX silently behaves like SHEX. | Credibility-destroying if found; one-line fix | 7 |
| A16 | **`CORS allow_origins=["*"]`** (`main.py:24-28`). | Fine for a demo; don't get caught on it in a security question | 7 |
| A17 | **Next.js is 16.2.6 / React 19.2.4** — the PRD says 15. `uv.lock` for the API, `pnpm-lock.yaml` for the web. **CI builds nothing** — `ci.yml` only runs `json.tool` and `py_compile`. | Verify against docs, not the PRD | 0 |
| A18 | **`extractor.py` has no cache fallback** on the LLM call. | When the key expires, the run dies instead of falling back to `_cached_extracts.json` | 3, 7 |

### B. Findings about free hosting (agent research, vendor-cited)

| # | Finding | Impact | § |
|---|---|---|:--:|
| B1 | **The binding constraint is RAM at import time, not requests.** `main.py` imports PyMuPDF + pdfplumber + langgraph at module load (~250–400 MB RSS). Render free and Koyeb free are **both 512 MB / 0.1 vCPU**. | **Render/Koyeb free are disqualified on spec, not on sleeping** | 1, 2 |
| B2 | **Your 30–180 s pipeline rules out Lambda** (900 s cap, hard 6 MB synchronous payload — PDFs blow the cap). **Cloud Run is the only free tier with a documented 60-minute request ceiling.** | Narrows the field to ~3 options | 1, 2 |
| B3 | **Keep-warm has a quota cliff.** Render gives 750 instance-hrs/mo; one always-on service = 720 h. **A second = 1,440 h, which crosses the cap and Render "suspends all Free web services until the start of the next month."** | Burning the quota permanently removes your backend, including on demo day | 1 |
| B4 | **Render's published policy names "invoking external APIs" as a suspension trigger** for "uncommonly high volume of traffic." | An LLM-calling demo is not a normal free-tier workload. Plan accordingly. | 1 |
| B5 | **Cloud Run throttles CPU outside request handling by default** — and your pipeline is a `BackgroundTasks` job (work *after* the response). | **Add `--no-cpu-throttling`** or your LLM calls crawl | 4 |
| B6 | **Cloud Run's binding free quota is CPU, not RAM:** 180,000 vCPU-s ≈ **1,000 three-minute requests/month** (~17/day at 2 vCPU). | ~10× a demo's needs. Not a constraint. | 2 |
| B7 | **Oracle Always Free is the only free tier hitting all four constraints** (2 OCPU/12 GB, 200 GB block volume, never reclaimed, no request cap). | Best free option if you have a day of patience. Needs ARM64 + self-managed TLS. | 4 |
| B8 | **Fly.io has no free tier — confirmed.** Plans deprecated 7 Oct 2024; trial is 2 VM-hours/7 days, *not* $5 credit. | Corrects `docs/phase-1-plan.md` | 2 |
| B9 | **Oracle A1 is 2 OCPU / 12 GB, not 4 / 24.** Oracle's own page says 1,500 OCPU-hrs + 9,000 GB-hrs. A third-party blog contradicts it. | Corrects the entitlement. Size for the lower number. | 2 |
| B10 | **Koyeb free sleeps after 1 hour** (vs Render's 15 min) but **cannot attach Volumes** and is also 512 MB / 0.1 vCPU. | Longer window, same OOM problem | 2 |
| B11 | **HF Spaces has the best free RAM (2 vCPU / 16 GB) and only sleeps after 48 h** — the one host where keep-warm is unnecessary. **But its docs contradict themselves** ("Docker Spaces require a paid plan" vs. free hardware table) and disk is "not persistent." | Verify before relying on it. UID 1000 is the #1 cause of permission crashes. | 2, 4 |
| B12 | **Northflank Sandbox is the only free + genuinely always-on PaaS found** — but **0 volumes** and RAM unverified. | Watchlist | 2 |
| B13 | **Zeabur free** needs no card and sleeps with a "few seconds" cold start, but RAM is unverified. | Watchlist | 2 |
| B14 | **Cloudflare Workers is a hard no** — 128 MB and 10 ms CPU free, and Pyodide can't load PyMuPDF's native extensions. | Ruled out definitively | 2 |
| B15 | **Cheapest reliable paid fallback: Fly.io `shared-cpu-4x` 1 GB = $7.78/mo** (+$0.15 volume) = ~$7.93, rising to ~$8.93 after 1 Oct 2026. | The answer the moment "free" stops being hard | 4 |
| B16 | **Vercel Hobby states it "restricts users to non-commercial, personal use only."** | For a maritime product demo, treat as a real constraint — prefer Cloudflare Pages or single-container | 2, 9 |
| B17 | **Cloudflare Pages free tier: 500 builds/mo, 20 min build timeout, 48-hour throttle on creating new projects, no stated bandwidth cap.** | **Create the project now, not demo-night.** | 2, 9 |
| B18 | **`rewrites()` defaults to `afterFiles`, and `app/api/voyages/route.ts` is a real filesystem route** — the filesystem wins and your proxy silently never runs. | Use `beforeFiles` or delete the mock | 5 |
| B19 | **Cloud Run free egress is 1 GiB/month.** Inbound upload is free; *serving PDFs back to `PdfViewer`* is egress. | Fine for a demo; why R2 is the upgrade | 4 |
| B20 | **No free persistent volume exists on any free container tier** (Render: no disks; Koyeb: Volumes not allowed on Free; Cloud Run: ephemeral). | Confirms re-seeding is the right answer | 4, 8 |
| B21 | **Litestream + R2 works on a VPS but not on a free PaaS** — SQLite must be on local storage because `fcntl()` locking fails on network filesystems and WAL silently corrupts. | Rules out the obvious persistence workaround | — |
| B22 | **Turso free: 5 GB, 500M rows read/mo, 10M written/mo, never sleeps.** Strongest hosted-DB fit — but no SQLAlchemy dialect found, and the schema's SQLite-only `PRAGMA table_info`/`ALTER` calls would need to go. | Real option only if you need durability, which you don't (A9) | — |
| B23 | **UptimeRobot free: 50 monitors, no card, 5-min interval.** A real monitor (not a disguised keep-alive), 3× margin against Render's 15-min window, and it doubles as your "is the API alive" alarm. | Recommended keep-warm | 7 |
| B24 | **GitHub Actions cron: free/unlimited on public repos; private Free = 2,000 min/mo — a 5-min ping would consume ~8,640 and does not fit.** | Only usable if the repo is public | 7 |
| B25 | **Cloudflare Workers Cron: 5 triggers free, 10 ms CPU each, 288 req/day at 5-min.** Edge-executed, so a GitHub outage or IP-block can't blindspot it. | Good independent second keep-warm | 7 |
| B26 | **Don't hide the keep-alive.** No vendor publishes a policy penalising synthetic pings, but all publish that sustained consumption is punished. Target the documented quota and assume you're visible. | Honest engineering position | — |
| B27 | **NVIDIA NIM free is prototyping/research only**, rate limit is per-model and undocumented, and **there is no way to request an increase.** | **Not fixable by preparation — only survivable.** | 3, 7 |
| B28 | **ngrok Free: 3 online endpoints, 1 assigned dev domain (survives restarts), no card. But inserts an interstitial warning page.** | Best stable-URL 2-service tunnel. A $10 tier removes the interstitial. | 6 |
| B29 | **cloudflared Quick Tunnels: free, no account, random `trycloudflare.com` subdomain, 200 concurrent cap, no SSE.** Your `pollVoyageStatus` uses plain polling, so the SSE gap is safe. | Fastest to URL, least stable | 6 |
| B30 | **Vercel `vercel deploy` (frontend only) is free with a permanent, async-safe URL** — but needs a tunnel for the API. | Best async-judging link | 6 |
| B31 | **Laptop-as-server non-negotiables:** disable sleep/hibernate, pin to AC, **phone hotspot as primary rather than fallback** (convention wifi is captive-portalled and client-isolated), don't close the lid. | The tunnel dies the moment you close the laptop | 6 |
| B32 | **`StaticFiles` + `pdf.js` range requests are unverified.** `pdf.js` paginates via HTTP `Range`; if `StaticFiles` doesn't serve it, large PDFs fail. | One `curl -I` settles it | 9 |

### C. The three conclusions

1. **Build demo-mode first, host second.** You have a self-sealing DB (A9), a deterministic engine, and a committed canonical fixture. The demo can work with the backend **fully dead** — which is cheaper than any hosting option, survives conference wifi, and turns the LLM dependency (B27, A18) into a talking point.
2. **The single-container, one-URL architecture is the right shape** because `api.ts` uses template concatenation (A10). `NEXT_PUBLIC_API_URL=""` → same-origin relative fetches → **CORS is structurally impossible to get wrong**, and there's one cold start instead of two.
3. **Hosted: Cloud Run first, Oracle A1 if you have patience, Render free only as a last resort.** Keep-warm is not free in the way people assume (B3) — the quota cliff is a bigger demo-day risk than the cold start.

---

## 0. What I verified in the repo myself (not agent claims)

I read these files before writing this. Everything in §5–§7 depends on them being correct.

| Fact | Evidence |
|---|---|
| **No Dockerfile and no `docker-compose.yml` exist.** The README's `docker compose up --build` is fiction. | `find` across the repo, excluding `node_modules` → zero hits |
| **The frontend already templates `API_BASE_URL`** — it does *not* use `new URL(path, base)`. So an empty `NEXT_PUBLIC_API_URL` yields relative same-origin fetches. This is what makes the single-container trick work. | `apps/web/lib/api.ts:156` `fetch(\`${API_BASE_URL}/voyages/${voyageId}\`)`; same pattern at 137, 203, 238, 269, 289, 307, 328 |
| **`USE_MOCK` does not cover the two functions the demo depends on.** `USE_MOCK = false` at line 18; mock branches exist at 129, 219, 256, 284, 302, 323 — but **not** at `fetchVoyageDetail` (156) or `fetchVoyages` (203). Those two always hit the network. | `apps/web/lib/api.ts` |
| **`apps/web/public/mock-pdfs/` is empty.** The PDF citation viewer has no PDF to render in static/demo mode. | `ls -la apps/web/public/mock-pdfs/` → empty dir |
| **`PdfViewer` loads its worker from a CDN.** `pdfjs.GlobalWorkerOptions.workerSrc = \`//unpkg.com/pdfjs-dist@${pdfjs.version}/...\`` — an external dependency inside the demo's most impressive feature. | `apps/web/components/PdfViewer.tsx:10` |
| **`_FIXTURE_DIR` resolves to `<repo-root>/fixtures/voyage_001` and `StaticFiles()` is mounted at import time.** `Path(__file__).resolve().parents[3] / "fixtures" / "voyage_001"`, then `.parent`. **`StaticFiles(directory=...)` raises at import if the directory is missing** — a Dockerfile that copies only `apps/api` will crash on boot. | `apps/api/keel_api/main.py:40-43` |
| **A `KEEL_DB` env seam already exists.** `os.environ.get("KEEL_DB", ...)`. No code change needed to repoint the database. | `apps/api/keel_api/store.py:21-22` |
| **You do not need a persistent database.** `_get_or_seed_voyage()` re-runs the pipeline and re-saves `voyage_001` on any `GET` if the stored row isn't the canonical $187K/$62K/$112K shape. A wiped `keel.db` self-heals on first request. | `apps/api/keel_api/main.py:66-94` |
| **CORS is `allow_origins=["*"]`** — fine for a demo, and irrelevant if you go single-origin. | `apps/api/keel_api/main.py:24-28` |
| **Next.js is 16.2.6, React 19.2.4.** The PRD says 15. Package managers: `uv.lock` for the API, `pnpm-lock.yaml` for the web. | `apps/web/package.json`, `apps/api/uv.lock` |
| **CI does no building.** `ci.yml` only runs `json.tool` and `py_compile`. No build, no test, no deploy job. | `.github/workflows/ci.yml` |

---

## 1. The binding constraint (and it is not what the platforms advertise)

Free tiers advertise *requests*. Your app is constrained by three other things, in this order:

**1. RAM at import time.** `main.py` imports the entire chain at module load: FastAPI → pymupdf (PyMuPDF) → pdfplumber → sqlalchemy → jinja2 → langgraph → langchain-openai. PyMuPDF alone is ~250–400 MB RSS. **Render free and Koyeb free are both 512 MB / 0.1 vCPU** ([Render](https://render.com/docs/free), [Koyeb](https://www.koyeb.com/docs/reference/instances)). That is a coin flip on import, before any request arrives. **Render/Koyeb free are disqualified on spec, not on sleeping.**

**2. Request duration.** Your pipeline does 30–180 s LLM calls with 3 retries. **AWS Lambda caps at 900 s and has a hard 6 MB synchronous payload limit** — PDFs blow the payload cap outright. **Google Cloud Run is the only free option with a 60-minute documented ceiling** ([quotas](https://docs.cloud.google.com/run/quotas)).

**3. Warmth vs. quota — a trap.** Render gives 750 instance-hours/month. One always-on service = 720 h. **A second always-on service = 1,440 h, which crosses 750 and Render "suspends all of your Free web services until the start of the next month"** ([Render free docs](https://render.com/docs/free)). Keep-warm is not free in the way people assume — burning the quota *permanently removes your backend*, including on demo day. Worse: Render's published policy says it may suspend a free service for "initiates an uncommonly high volume of traffic" and explicitly names **invoking external APIs** among the triggers. **This repo calls an LLM on every pipeline run. You are squarely in that bucket.**

### The single most dangerous policy clause for this specific repo
> "Render may suspend a Free web service that **initiates an uncommonly high volume of traffic**," and the listed examples include **"invoking external APIs."** — [render.com/docs/free](https://render.com/docs/free)

An LLM-calling demo on Render free is not a normal free-tier workload. Plan accordingly.

---

## 2. The platform scoreboard (2026, verified)

| Platform | Free? | RAM | Persistent disk | Max request | Idle behaviour | Card? | Fits? |
|---|---|---|---|---|---|:--:|:--:|
| **Oracle Cloud Always Free** | ✅ | **2 OCPU / 12 GB** (A1, from 1,500 OCPU-hrs + 9,000 GB-hrs/mo) | ✅ **200 GB block volume** | none (self-managed) | **never reclaimed if used** | ✅ | **✅ only tier hitting all four** |
| **Google Cloud Run** | ✅ | up to 32 GB | ❌ ephemeral | **60 min** | scales to zero | ✅ | **✅ best free managed option** |
| **Modal** | ~$30/mo credit | 2 GB | ✅ **1 TiB/mo free** | [unverified] | container sleep | ✅ | ✅ effectively free |
| **HF Spaces (cpu-basic)** | ⚠️ | **2 vCPU / 16 GB** | ❌ "50GB of (**not persistent**) disk" | none documented | sleeps after 48 h | — | ⚠️ docs contradict themselves |
| **Render free** | ✅ | **512 MB / 0.1 CPU** | ❌ | none documented | **15 min** → spin down, ~1 min wake | $1 check | ❌ OOM risk |
| **Koyeb free** | ✅ | **512 MB / 0.1 vCPU / 2 GB SSD** | ❌ ("free instances **can't be used with Volumes**") | — | **1 hour** → scale to zero | — | ❌ OOM risk |
| **Zeabur free** | ✅ no card | [unverified] | [unverified] | — | auto-sleep, "a few seconds" cold start | — | ⚠️ unknown RAM |
| **Northflank Sandbox** | ✅ "**Always-on-compute – no sleeping**", 2 services, **0 volumes** | [unverified] | ❌ | [unverified] | never sleeps | — | ⚠️ the only free+always-on PaaS found |
| **Fly.io** | ❌ **confirmed removed** | 256 MB–2 GB paid | ✅ $0.15/GB-mo | — | 5 min auto-stop | ✅ | paid only |
| **Railway** | ❌ $1/mo credit only | 0.5 GB | 0.5 GB | — | — | — | unusable |
| **PlanetScale / PythonAnywhere** | ❌ | — | — | — | — | — | ruled out |
| **Cloudflare Workers** | ✅ | **128 MB** | ❌ in-memory | **10 ms CPU free** | — | — | ❌ PyMuPDF can't load (Pyodide, no native ext) |

### Three corrections to the existing `docs/phase-1-plan.md`
1. **Fly.io has no free tier — confirmed.** Plans deprecated **7 Oct 2024**; the current trial is 2 VM-hours/7 days, *not* $5 of credits. ([discontinued plans](https://fly.io/docs/about/discontinued-plans/), [free trial](https://fly.io/docs/about/free-trial/))
2. **Oracle A1 is 2 OCPU / 12 GB, not 4 / 24.** Oracle's own Always Free page states 1,500 OCPU-hrs / 9,000 GB-hrs. A third-party 2026 blog contradicts it. **Treat 2/12 as the entitlement and size for it.** ([docs](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always-Free_Resources.htm))
3. **Cloud Run's free quota is 180,000 vCPU-seconds** (request-based billing). At 1 vCPU × 180 s that's **~1,000 three-minute requests/month**; at 2 vCPU, ~500/month ≈ 17/day. Plenty for a demo — but **CPU, not RAM, is the binding quota.** ([pricing](https://cloud.google.com/run/pricing))

---

## 3. RECOMMENDATION: build the demo-mode fallback first, host second

This is the inversion. Agents consistently produced the same shape of answer, and it's the right one:

> **Your database self-seeds, your engine is deterministic, and your canonical output is a committed fixture. The demo can work with the backend completely dead. Build that first — it is cheaper than every hosting option, it is the only thing that survives conference wifi, and it converts your single biggest technical weakness (the LLM dependency) into a talking point.**

The repo already contains the substrate: `fixtures/voyage_001/expected_reconciliation.json`, `fixtures/voyage_001/_cached_extracts.json`, and four independent `test-cases/case_0*/expected.json` scenarios including `case_03_charterer_win_storm` and `case_04_split_decision`.

### What is missing (I verified each)

| Gap | File | Fix |
|---|---|---|
| **The two demo-critical fetches have no mock branch** | `apps/web/lib/api.ts:156` (`fetchVoyageDetail`), `:203` (`fetchVoyages`) | Add `if (USE_MOCK)` branches; the mock data (`MOCK_RECONCILIATIONS`, already described in-file as the "oracle from expected_reconciliation.json") is already there |
| **`USE_MOCK` is a build-time constant.** `NEXT_PUBLIC_*` is inlined at build time, so you cannot flip it after deploy. | `apps/web/lib/api.ts:18` | Make it `process.env.NEXT_PUBLIC_DEMO_MODE === "1"`, **and** add a runtime override: `new URLSearchParams(location.search).get("demo") === "1"`. This is the difference between recovering in 5 seconds and redeploying while judges watch. |
| **No fetch timeout.** A Render cold start is ~1 min; an untimed fetch shows a spinner for a minute. A minute of spinner is functionally a crash. | all 8 `fetch()` calls in `api.ts` | `AbortController` with a **6 s** timeout → fall back to mock. Do not use the default; do not use 30 s. |
| **No PDFs for the citation viewer** | `apps/web/public/mock-pdfs/` is **empty** | Copy `fixtures/voyage_001/*.pdf` (or generated equivalents) into `public/mock-pdfs/` and hardcode the path in place of the `/static/` rewrite at `api.ts:168-169`. **The click-audit-row → bbox-highlight moment is arguably the best part of the demo and it currently cannot render offline.** |
| **PDF worker from a CDN** | `components/PdfViewer.tsx:10` — `//unpkg.com/pdfjs-dist@...` | `npm i pdfjs-dist` and serve the worker from `public/`. An external CDN in your best feature is a demo-day single point of failure. |
| **No server-side cache fallback on the LLM** | `apps/api/keel_api/extraction/extractor.py` | Wrap the NIM call: on exception/timeout/429, fall back to `fixtures/voyage_001/_cached_extracts.json` instead of propagating. This is what saves you when the key expires. |

### Why this matters more than any hosting decision
NVIDIA NIM free tier is **prototyping/research only**, the rate limit is **per-model and not publicly documented**, and NVIDIA states plainly that **there is no way to request an increase** ([NIM FAQ](https://docs.api.nvidia.com/nim/re/docs/product), [NVIDIA forum](https://forums.developer.nvidia.com/t/api-rate-limit-increase-is-not-granted-by-requesting-it-here/368420)). This is **not fixable by preparation** — only survivable.

**Corollary for the demo script:** never make a raw LLM call the centrepiece. Drive the story from the reconciliation logic and the BIMCO WWD verdicts, which are pure Python and deterministic — *and say so out loud*. A judge asking "is the LLM reliable?" is then a question you already answered by showing the deterministic core.

---

## 4. The four hosting options, ranked

### 🥇 Option A — Google Cloud Run, single container, single URL. *Best free managed option.*

**Why:** 60-minute request ceiling (20× your worst case), RAM to 32 GB, stable `*.run.app` URL, and the free quota (~1,000 three-minute requests/month) is 10× a demo's needs.

**The one gotcha that will bite you:** Cloud Run **throttles CPU outside request handling by default**. Your pipeline is a `BackgroundTasks` job — work *after* the response is sent. So your LLM calls get throttled CPU and crawl. **Add `--no-cpu-throttling`.** [Known behaviour, not verified against a fetched doc this session.]

```
gcloud builds submit --tag gcr.io/$PROJECT/keel
gcloud run deploy keel \
  --image gcr.io/$PROJECT/keel \
  --region us-central1 \
  --allow-unauthenticated \
  --min-instances 0 --max-instances 1 \
  --cpu 1 --memory 512Mi \
  --timeout 600s \
  --no-cpu-throttling \
  --set-env-vars OPENAI_API_KEY=$OPENAI_API_KEY,OPENAI_BASE_URL=https://integrate.api.nvidia.com/v1,OPENAI_MODEL=meta/llama-3.1-8b-instruct
```
`--no-cpu-throttling` and the other flags are standard `gcloud run deploy` flags **[unverified — I fetched the pricing page, not the flag reference; run `gcloud run deploy --help`]**.

Also: **1 GiB free egress/month.** Inbound PDF upload is free, but *serving PDFs back to `PdfViewer`'s highlight overlay is egress*. For a demo that's fine; it's why R2 would be the right upgrade.

### 🥈 Option B — Oracle Cloud Always Free A1. *Only free tier that hits all four constraints.*

12 GB RAM (PyMuPDF becomes a non-issue), 200 GB block volume (real SQLite + uploads), never reclaimed while in use, no request cap. **Catches:** ARM64 image required (PyMuPDF has aarch64 wheels, pdfplumber is pure Python — both fine), you self-operate TLS via Caddy or an OCI free load balancer, **A1 capacity errors are common at signup**, and idle reclamation after 7 days of both <20% CPU and <20% memory. Credit card required. [capacity-error frequency: unverified]

**Pick this if you have a day of patience and want a genuinely zero-cost always-on demo.** It is the only answer to "is there any free tier that stays warm, handles >60 s, has ≥1 GB RAM, and has persistent disk?" — as a *managed container PaaS*, the answer is **none**; as a raw VM, this is it.

### 🥉 Option C — Render free. *Simplest deploy, highest chance of failure.*

Lowest friction by far and a working demo if it survives, but three independent problems: **512 MB / 0.1 CPU** (likely OOM on import), **15-min spin-down → ~1 min cold start**, and the **"invoking external APIs" suspension clause** aimed squarely at an LLM-calling app. Also no persistent disk, and `BackgroundTasks` dies mid-pipeline on spin-down.

**If you use it anyway:** pre-warm imports in a lifespan block so `/healthz` asserts PyMuPDF loaded, then UptimeRobot on `/healthz` at 5-minute intervals ([free: 50 monitors, no card](https://uptimerobot.com/pricing/)) — a real monitor, inside Render's 15-min window with 3× margin, and it doubles as your "is the API alive" alarm. **Budget the instance-hours explicitly: 720 h for one always-on service leaves only 30 h of headroom.**

### ⚠️ Option D — HF Spaces. *Great RAM, but read the contradiction.*

CPU Basic is listed at **2 vCPU / 16 GB, $0/hr**, and sleeps after 48 h — which makes keep-warm unnecessary, the only host where that's true. **But the same documentation states "creating a Space that runs on compute (Gradio or Docker) requires a paid plan,"** and persistent storage "is no longer available." Verify before relying on it. For a Docker Space: `sdk: docker` + **`app_port:` in the README YAML frontmatter** (not `EXPOSE`), **the container runs as UID 1000** (the #1 cause of permission crashes), and **disk is lost on every restart** — which is fine for you, because your DB self-seeds.

### Cheapest reliable (if free isn't hard)
**Fly.io `shared-cpu-4x` 1 GB — $7.78/mo** (+$0.15 for a 1 GB volume) = **~$7.93/mo**, rising to ~$8.93 after the 1 Oct 2026 price change. Always-on, real block storage, free shared IPv4. ([pricing](https://fly.io/pricing/))

---

## 5. The single-container architecture (one URL, zero CORS) — RECOMMENDED

Because `api.ts` uses **template concatenation** (`${API_BASE_URL}/voyages`, verified at 7 call sites), setting `NEXT_PUBLIC_API_URL=""` yields **relative same-origin fetches**. That means one container can serve both the compiled Next.js bundle and the API, on one origin, with CORS structurally impossible to get wrong.

**Three source changes:**

**1. `apps/web/next.config.ts`** — add export mode, change the default:
```ts
const nextConfig: NextConfig = {
  output: "export",
  turbopack: { root: path.resolve(__dirname), resolveAlias: { canvas: "./empty-module.ts" } },
  env: {
    // "" => same-origin relative URLs. Required for the single-container build.
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "",
  },
};
```
Locally, keep `pnpm dev` working with `NEXT_PUBLIC_API_URL=http://localhost:8000` in `.env` — the `??` only fires on `undefined`.

**2. Move aside the mock route.** `apps/web/app/api/voyages/route.ts` is a B-02 mock and is the *only* thing forcing export-mode failure. Don't delete it — `git mv` it to `.bak`.

**3. `generateStaticParams` on the dynamic pages.** The three `voyage/[id]/*` pages need them since only `voyage_001` exists:
```ts
export const dynamicParams = false;
export function generateStaticParams() { return [{ id: "voyage_001" }]; }
```

**4. `apps/api/keel_api/main.py`** — serve the export **at the very end of the file** (Starlette matches routes in registration order, so a `/` mount shadows everything after it):
```python
_WEB_DIR = Path("/srv/web")
if _WEB_DIR.is_dir():
    app.mount("/", StaticFiles(directory=str(_WEB_DIR), html=True), name="web")
```
`html=True` serves `out/dashboard.html` for `/dashboard`. **There is no SPA fallback for unknown client-side routes** — if anything 404s, add a catch-all registered *before* the mount.

**⚠️ The two build traps in this Dockerfile:**
- **`fixtures/` must land at `<repo-root>/fixtures`**, because `main.py:40-43` resolves `parents[3] / "fixtures"` and `StaticFiles` raises at import if it's missing. A Dockerfile that copies only `apps/api` **crashes on boot**.
- **`database.py` uses `sqlite:///keel.db`** — a CWD-relative path. Set `WORKDIR` to a writable dir or your DB lands in `/`.

`Dockerfile` skeleton:
```dockerfile
# Stage 1 — build the Next.js static export
FROM node:22-bookworm-slim AS web
WORKDIR /build
ENV CI=1 NEXT_TELEMETRY_DISABLED=1
COPY apps/web/package.json apps/web/pnpm-lock.yaml* ./
RUN corepack enable && corepack prepare pnpm@latest --activate && pnpm install --no-frozen-lockfile
COPY apps/web/ ./
ARG NEXT_PUBLIC_API_URL=""
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN pnpm build

# Stage 2 — Python runtime
FROM python:3.12-slim-bookworm AS py
COPY --from=ghcr.io/astral-sh/uv:0.5.11 /uv /uvx /bin/
ENV PYTHONDONTWRITEBYTECODE=1 UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy
WORKDIR /app
COPY apps/api/pyproject.toml apps/api/uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project
COPY apps/api/ ./
RUN uv sync --frozen --no-dev
COPY fixtures/ /fixtures/                      # ← main.py:41 hard requirement
COPY --from=web /build/out /srv/web
RUN mkdir -p /data && WORKDIR /data
ENV PYTHONPATH=/app KEEL_DB=/data/keel.db
EXPOSE 8000
CMD ["sh","-c","exec uvicorn keel_api.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
```
`ghcr.io/astral-sh/uv` image-copy is the documented uv-in-Docker pattern **[unverified — docs.astral.sh not fetched]; substitute `RUN pip install uv==0.5.11 && uv …` if you'd rather not depend on it.**

### Or: skip export mode entirely
Keep the full Next.js runtime, delete nothing, and deploy frontend → Vercel, backend → your platform of choice. **Caveat found by an agent:** `rewrites()` defaults to `afterFiles`, and `app/api/voyages/route.ts` is a real filesystem route — **the filesystem wins and your proxy silently never runs**. Use `beforeFiles` or delete the mock.

---

## 6. Zero-infra fallback (laptop + tunnel)

If hosting goes sideways, or for a rehearsal:

| Option | Free | Time | URL stable? | Card? | 2 services? |
|---|---|---|---|---|---|
| **ngrok Free** — `ngrok.yml` with two endpoints | ✅ $0 + $5 one-time | ~5 min | ✅ **assigned dev domain survives restarts** | not stated; no card needed | ✅ **3 online endpoints on Free** |
| **cloudflared Quick Tunnel ×2** | ✅ | ~2 min | ❌ random `*.trycloudflare.com`, dies with process | not required | ✅ (one URL per process) |
| **Vercel `vercel deploy`** (frontend only) | ✅ | ~4 min | ✅ permanent, async-safe | not mentioned | ❌ pair with a tunnel for API |

Verified: ngrok Free gives **3 online endpoints, 1 assigned dev domain, 1 GB transfer, 20k HTTP/S requests, HTTP only** ([pricing](https://ngrok.com/pricing)). **Killshot caveat: Free inserts an interstitial warning page on HTTP/S endpoints** — judges must click through. Fine live, annoying for async judging. Cloudflare quick tunnels: free, no account, **random subdomain**, **200 concurrent in-flight cap**, **does not support SSE** (your `pollVoyageStatus` uses plain polling, so you're safe) ([docs](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/trycloudflare/)).

**Five-minute ngrok sequence:**
```bash
cd apps/api && uv run uvicorn keel_api.main:app --port 8000 &
# write ngrok.yml at repo root: two endpoints, web→3000, api→8000
ngrok config add-authtoken <token> && ngrok start --all --config ngrok.yml
export NEXT_PUBLIC_API_URL=https://<your-api-subdomain>   # MUST precede the web build
cd apps/web && pnpm dev
```
Set `NEXT_PUBLIC_API_URL` **before** starting the web dev server — Turbopack reads it at build.

**Laptop non-negotiables** [standard practice, unverified]: disable sleep/hibernate entirely, pin to AC, **phone hotspot as primary rather than fallback** (convention wifi is captive-portalled and client-isolated), don't close the lid.

---

## 7. Demo-day runbook

**The three catastrophic failures, in likelihood order:**

**1. Backend asleep; the loading page shows instead of the product.** Render serves its own spinner for ~1 min while waking.
→ UptimeRobot 5-min on `/healthz`; **6 s client timeout → fixture fallback**; and **narrate the fallback as a feature** — "this is the audit-grade result set cached at build time; in production this is where the live pipeline output lands." Offline resilience is a *better story* than a spinner.

**2. NVIDIA key expired or rate-limited mid-extraction.** Unfixable by preparation, only survivable.
→ The `extractor.py` cache fallback + the four pre-baked `test-cases/` scenarios. Drive the demo from the deterministic core.

**3. Wifi dies / captive portal blocks your own backend.** Kills everything at once, and judges' phones on the same wifi are client-isolated too, so you lose the second-screen trick.
→ Hotspot as primary; `?demo=1` working on literally zero network (all bundled); **a recorded 90-second screen capture as the final backstop.** Narrate over video — a video is a controlled outcome, an error page is not.

**Pre-flight, in order:**
1. **20-minute cold-start test — the real test.** Leave the backend untouched, then load `/voyages/voyage_001/reconcile` and **time it.** Budget Render's ~1 min spin-up plus your own import cost.
2. **Kill-switch rehearsal.** Deliberately stop the backend. Confirm `?demo=1` renders detail → reconcile → letter with **$112,000** visible and the bbox highlight working.
3. **Verify the number on screen equals the number on your slide.** If they differ you have ~10 seconds of credibility.
4. **DevTools → Network → Offline, click the whole flow.** Anything that 404s now is a surprise later.
5. **One real LLM call.** Confirm the key is live and under the free rate limit. **Time it and write the number on your script** — you need to say "this takes about N seconds" out loud.
6. **Test on a phone, on real conference wifi if possible.** Captive portals permit DNS but block arbitrary egress — only discoverable by trying.
7. **Pin the deployment.** Never redeploy mid-session.

**Also fix before demo day (small, credibility-destroying if found):**
- **Remove the `?? "http://localhost:8000"` fallback in production.** If `NEXT_PUBLIC_API_URL` isn't set at build time you ship a bundle pointing at *your own laptop* and every judge sees an empty dashboard. **Make the production build throw instead.**
- **Upload URLs are already broken, independent of hosting.** `main.py:216` writes uploads to `tempfile.mkdtemp()`, but `main.py:88-92` unconditionally hardcodes `pdf_urls` to `/static/{voyage_id}/*.pdf` and `/static` is mounted only from the git-tracked `fixtures/` dir. **Any uploaded voyage's citation link 404s.** Pre-existing bug; fix or don't demo upload.
- Add `healthCheckPath: /healthz` (it already exists at `main.py:55-57`).
- Replace `allow_origins=["*"]` with an env-driven allowlist — trivial now, and you don't want to be caught on it in a security question.
- Fix the **FHEX bug** (`state_machine.py:44` excepts Sunday for both SHEX and FHEX) and the **dead `reconcile/` module** that hardcodes `date(2026,6,14/15/16)` verdicts. A judge reading `reconcile/adjudicator.py` and seeing hardcoded demo dates kills the "deterministic rules engine" claim instantly.

---

## 8. What I would actually do, in order

1. **Build the demo-mode fallback** (§3). Highest value per hour of any option on this page, and it's the only thing that survives conference wifi.
2. **Write the Dockerfile + `generateStaticParams` + the `main.py` static mount** (§5). One container, one URL, no CORS.
3. **Deploy to Cloud Run with `--no-cpu-throttling`** (Option A). If A1 capacity greets you, Oracle A1 (Option B). If you have no patience for either, Render free (Option C) with UptimeRobot and accept the risk.
4. **Stop worrying about the database.** It self-seeds (`main.py:66-94`). Keep SQLite, point `KEEL_DB` at `/data/keel.db`, re-seed on boot.
5. **Rehearse with ngrok + `?demo=1` before you ever touch a hosting account.** If the tunnel rehearsal is smooth, the hosted version will be.

---

## 9. Gaps and unverified items

**Agent failures:** 2 of 7 hit search-provider rate limits (HTTP 429). The frontend-hosting agent returned only partial vendor data (**Netlify, Render static, Deno Deploy, Firebase Spark, GitHub Pages, Surge, and Vercel's Hobby non-commercial ToS wording are all [unverified]**); the zero-infra agent returned partial (**Tailscale Funnel, Codespaces/Colab/Kaggle/Gitpod/Replit free tiers, and one-command deploy terms all [unverified]**). Vercel's Hobby page does state it "restricts users to **non-commercial, personal use only**" ([plan doc](https://vercel.com/docs/plans/hobby)) — for a maritime product demo, **treat that as a real constraint and prefer Cloudflare Pages or a single-container host.**

**Specifically unverified and worth checking before you commit:**
- **Vercel Hobby commercial-use restriction** — the plan doc says non-commercial; confirm against current Terms before demoing a commercial product on it.
- **HF Spaces**: whether Docker Spaces actually require a paid plan (the docs contradict their own free-hardware table).
- **Northflank free service RAM** — the one "free + never sleeps" PaaS found; RAM unknown.
- **Cloud Run's `--no-cpu-throttling` and background-CPU behaviour** — known, but I did not fetch the doc this session.
- **Whether `StaticFiles` serves HTTP `Range` headers correctly.** `pdf.js` uses range requests for pagination; if `Range` isn't served, large PDFs will fail to paginate in `PdfViewer`. One `curl -I` on a static PDF answers this.
- **BetterStack / Cronitor / healthchecks.io / Pingdom free tiers** — not researched; UptimeRobot is sufficient.
- **Measured 2026 cold starts** for Cloud Run, Vercel, Cloudflare Pages — not researched. My Render estimate (60–120 s end-to-end: ~1 min platform + 8–20 s PyMuPDF/pdfplumber/langgraph import) is **an estimate, not a vendor figure.**
- **`gcloud run deploy` flag names** — run `--help`.
- **The `ghcr.io/astral-sh/uv` image-copy pattern** — substitute `pip install uv` if you don't want to depend on it.
- **`render.yaml` Blueprint schema** — dashboard path is documented; the exact YAML keys are not verified here.

**One thing I did not research because it isn't hosting:** whether `apps/web/app/page.tsx`'s `redirect()` breaks under `output: 'export'`. An agent flagged it as unverified and I didn't check. **Run one `pnpm build` with export mode on before you commit to this architecture** — that single build tells you whether Recipe 0 works at all.