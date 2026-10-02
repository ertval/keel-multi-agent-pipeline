# Keel — Unified Strategic Report

**Date:** 2026-10-02
**Status:** Controlling document. Supersedes `docs/market-moat-report.md`, `docs/STRATEGIC_PLAN.md`, `docs/hosting-demo-report.md`, and `docs/forward-plan.md`.
**Source documents:** [`continuation-plan.md`](continuation-plan.md) (risk-ordered steps), [`STRATEGIC_PLAN.md`](STRATEGIC_PLAN.md) (dangerous — 6 critical errors, see §15), [`forward-plan.md`](forward-plan.md) (internal plan), [`hosting-demo-report.md`](hosting-demo-report.md) (deployment analysis), [`market-moat-report.md`](market-moat-report.md) (competitive intelligence), [`phase-1-handoff.md`](phase-1-handoff.md) (current status).
**Method:** All six source documents read in full, deduplicated, and cross-referenced. Three parallel verification agents validated competitor claims, hosting specs, and market/regulatory facts against primary sources on 2026-10-02. Corrections folded in.

**Evidence marks**

| Mark | Meaning |
|---|---|
| Sourced | Re-checked on 2026-10-02. URL in [§16](#16-sources). |
| Code | Read in this repo on 2026-09-30 or later. |
| Carried | Kept from a source report. Not re-checked. Do not cite in a board paper or on the website. |
| Rejected | Appeared in a source report and is dropped or corrected below. |

---

## Table of Contents

1. [Resolved Position & North Star](#1-resolved-position--north-star)
2. [What the Repo Is — and Is Not](#2-what-the-repo-is--and-is-not)
3. [Competitive Landscape (Verified Oct 2026)](#3-competitive-landscape-verified-oct-2026)
4. [Moat & Defensibility Scorecard](#4-moat--defensibility-scorecard)
5. [Weather and Evidence — Product Framing](#5-weather-and-evidence--product-framing)
6. [Adjacent Problems Worth Pursuing](#6-adjacent-problems-worth-pursuing)
7. [Regulation and Sourced Legal Facts](#7-regulation-and-sourced-legal-facts)
8. [Market Economics and Go-to-Market](#8-market-economics-and-go-to-market)
9. [Implementation Phase 1 — Hardening & Sign-off Gate](#9-implementation-phase-1--hardening--sign-off-gate)
10. [Implementation Phase 2 — Demo-Ready Sprint](#10-implementation-phase-2--demo-ready-sprint)
11. [Implementation Phase 3 — Auth & First Pilot](#11-implementation-phase-3--auth--first-pilot)
12. [Implementation Phase 4 — Competitive Features & Beyond](#12-implementation-phase-4--competitive-features--beyond)
13. [Engine Gaps (Priced)](#13-engine-gaps-priced)
14. [Deployment Options Comparison](#14-deployment-options-comparison)
15. [Conflict Log & Source Document Errors](#15-conflict-log--source-document-errors)
16. [Sources](#16-sources)
17. [Still Open](#17-still-open)

---

## 1. Resolved Position & North Star

Keel is a **charterer-side demurrage audit tool**. An analyst uploads a charterparty, both Statements of Facts, both claim PDFs, and a port weather record. An LLM extracts facts into schemas. A pure-Python state machine and a deterministic evaluator produce the dollars. The canonical case reconciles owner **$187,000** against charterer **$62,000** to **$112,000**.

That product is the beachhead. It is not a moat by itself.

### What to build the company on

1. **An adjudicated outcome corpus:** for a clause variant, port, weather regime, and NOR defect, what was actually paid or conceded. Clause text is public. Outcomes are not. Start capturing with pilot #1.
2. **An arbitration-grade evidence packet:** reproducible, offline, every figure tied to a source span. Sell this to the person who has to defend the number, not as another calculator. LMAA Small Claims: **£5,000 fixed fee**, **£6,000 cost cap** — this tool saves 10× its cost in a single dispute. **Sourced.**
3. **One disputed voyage, one letter, one price**, co-delivered with charterer-side advisors. Do not compete with Marcura or Veson on throughput or on being the system of record.

### What this report rejects

- **"Neutral bilateral settlement exchange"** as the operating plan. A conditional late option (§12), not the product being sold.
- **Station-level weather and ERA5 hindcasts as a moat.** Commodity input, legally weak (§5). Sell **SOF credibility assessment**, not "we verified the weather."
- **Document parsing, a deterministic laytime engine, and multi-agent orchestration as defensibility.** Credibility assets, not moats. Free calculators exist.
- **Container D&D, sanctions/dark-fleet, S&P valuation, a full chartering desk** as near-term products.
- **The strategic plan's hosting recipe** (HF Docker Space as free always-on backend — it requires a paid plan). See §14.
- **The strategic plan in general** contains 6 critical errors (§15). Do not show it to anyone doing technical due diligence.

### Commercial ceiling

The demurrage workflow is a real market with a capped buyer set and active consolidators. This pass does not support a venture-scale story on demurrage software alone. A bootstrapped audit practice, or a small strategic sale to a laytime incumbent, fits the evidence better than a platform raise. Named acquisition targets (B&V → Marcura → Voyager), in order of fit. **Carried.**

---

## 2. What the Repo Is — and Is Not

### 2.1 Code inventory

| Layer | Where | What it does |
|---|---|---|
| API | `apps/api/keel_api/main.py` (872 lines) | FastAPI. Seeds `voyage_001`. Static files from `fixtures/`. Anonymous by default. |
| Pipeline | `pipeline.py` → `pipeline_agents.py` (742 lines) | LangGraph: orchestrator → cp_worker + sof_worker (join) → validator → laytime engine → adjudicator. No checkpointer. |
| Engine | `engine/state_machine.py` | NOR, turn time, SHEX/SHINC, once-on-demurrage. Pure Python, no LLM. |
| Rules | `rules/evaluators.py` | BIMCO 2013 WWD thresholds (wind, precipitation, operations prevented). |
| Parsing | `parsing/` | Fork+exec sandbox. PyMuPDF for prose, pdfplumber for tables. 3 GB address space ceiling. |
| Extraction | `extraction/extractor.py` | OpenAI SDK, strict JSON schema, 3 attempts. Not LangChain. |
| Web | `apps/web` | Next.js **16.2.6**, React **19.2.4**, Tailwind 4, shadcn/ui. 11 landing variants, 12 routes. |

### 2.2 Test state

```
$ cd apps/api && uv run pytest -q
16 failed, 338 passed, 1 skipped          # 355 collected
$ uv run pytest -m canonical -q
15 passed, 340 deselected
$ cd apps/web && pnpm exec tsc --noEmit   # 0 errors
$ pnpm run lint                           # 0 errors, 4 warnings
$ pnpm run build                          # exit 0
$ pnpm exec playwright test               # 40 passed (7 spec files)
```

The 16 failures are **absent source PDFs**. The 1 skip is `OPENAI_API_KEY not set`.

### 2.3 What does NOT exist (do not describe as present)

- No authentication (the API is anonymous by default)
- No human sign-off gate (status vocabulary is decoration)
- No PDF export (the endpoint returns 400)
- No email / send-to-counterparty (the modal says "Not sent")
- No settings page, no trial, no sign-up, no account
- No SOC 2 / ISO / GDPR certification
- No Port Disbursement Auditing, no Speed & Consumption, no Bunker Claims
- No EU ETS / FuelEU engine, no pre-fixture underwriting, no eBL / trade finance
- No game-theoretic settlement, no sanctions surveillance, no SAP/Oracle sync
- No bilateral settlement exchange, no counterparty behavior graph
- No Outlook/Sedna email integration, no tokenization proxy
- No "Without Prejudice" segregation
- No Dockerfile, no docker-compose.yml
- No confidence field, no review queue, no abstention

### 2.4 Known code defects (from hosting-demo-report & phase-1-handoff)

- Workers return `extracted_*.json` when cached — validator retry cannot change extraction
- Vessel-name mismatch branch is `pass`
- `retry_count` increments on every validator pass, including successful ones
- `reconcile/adjudicator.py` hardcodes June 2026 dates and is dead code
- FHEX uses Sunday exclusion only (same as SHEX)
- Upload citation links 404 (temp dir vs `/static/` mount mismatch)
- `PdfViewer.tsx` loads worker from `unpkg.com`
- `USE_MOCK` does not wrap `fetchVoyageDetail` or `fetchVoyages`
- `public/mock-pdfs/` is empty
- No fetch timeout in `api.ts`

---

## 3. Competitive Landscape (Verified Oct 2026)

### The clock

**B&V is the most dangerous competitor.** They already ship Discrepancy Discoverer (upload both calculations → aligned comparison). Adding a "generate the counter-calculation" mode is one product sprint away. Their 18,155-calculation validation set is the moat we don't have. **We have 6–12 months before this gap closes.**

Marcura's VP Analytics (Oct 2025): AI capabilities for document analysis are available, adoption cycles compressing to about 2–3 years. That sets a hard deadline of late 2027 for adversarial reconciliation to be commoditized. **Sourced** (maritime-executive.com, 29 Oct 2025).

### Competitor table

| Competitor | What they ship today | Time to "adversarial reconciliation" | Source |
|---|---|---|---|
| **Marcura** (HQ: Dubai) | Marcura Claims (laytime/demurrage platform). CP Risk Analyser (AI clause analysis). Shipster acquired (Mar 2025, AI document intelligence — agents embedded in Claims + PortLog). HubSE (Feb 2025), Shipdem (Feb 2026), Fairway Maritime (Jul 2026) acquired. Pages cite 600K+ SOFs, 20K+ claims/yr, 950 companies. DA-Desk: ~350+ clients, ~200K port calls. | **12–18 months** | marcura.com |
| **Burmester & Vogel** (43 yrs) | BV Laytime + **Discrepancy Discoverer** (side-by-side comparison). SailFast (handwritten log parsing). Patent-pending orchestration engine for laytime (filed Dec 2023, 35 pages, 15 figures). Laysoft/Laytime2000 acquired (Mar 2025). Marsoft acquired (10 Mar 2026). BIMCO Technology Partner (Mar 2025). Engine validated against **18,155 real calculations**. | **6–12 months** — smallest product change away | burmester-vogel.com |
| **Voyager Portal** (Houston) | Charterer-side demurrage + AI SOF parser. Series A **$8.4M** (Dec 2021). Motion Ventures strategic round (Jul 2025, amount undisclosed). Total ~$9.9M raised. ~42 staff. | **12–18 months** | voyagerportal.com |
| **Veson Nautical** | Claims CoCaptain (May 2025): AI SOF parsing, claims reconciliation. Expanded Jun 2026 into unified Veson Platform. Partner Network since **March 2021**. Pages cite 950K claims/$24B (May 2025 blog) vs 1.1M claims/$71B+ (current product page) — discrepancy unexplained. | **Not pursuing** — decided to partner | veson.com |
| **Demurrage.IA** (São Paulo) | SaaS laytime calculator at demurrage-ai.com. LATAM jurisdiction packs (BR, AR, CL, CO, PE, UY). Generates dispute letters in PT-BR. Standard subscription pricing (free tier through enterprise). | Container D&D focus, not vessel | demurrage-ai.com |
| **Greywing** (Singapore) | Proteus: free calculator + one SOF extraction trial (not unlimited). No claims layer. | **Not pursuing** claims | grey-wing.com |
| **Chartera** (Singapore) | Freemium calculator: **10** free calculations (personal email), **20** (company email). No adversarial capability. | **Not pursuing** adversarial | chartera.io |
| **DryNor** (Copenhagen) | Human charterer-side counter-calculation through to settlement. | Manual competitor to our exact wedge | drynormaritime.com |
| **BIMCO SmartCon** | AI duplicate clause checker, Recap Reader (Recap→CP). Agentic Contracts Advisory Board launched Apr 2026 (with Hunit), expanded Aug 2026. | **Not pursuing** demurrage math | bimco.org |

**Corrections applied:**
- Voyager Portal: Series A was **$8.4M in Dec 2021**, not $11.5M in Jul 2025. Jul 2025 was Motion Ventures, amount undisclosed. **Sourced.**
- Demurrage.IA: **Exists** at demurrage-ai.com (SaaS, not 20% success fee — that's Brazilian maritime litigation attorneys). **Sourced.**
- Marcura: HQ is **Dubai**, not Copenhagen. Shipster acquisition (Mar 2025) added. "ClaimsAssist" name is **unverified** — current product is "Marcura Claims." **Sourced.**
- Veson: Partner Network launched **March 2021**, not June 2025. CoCaptain expanded Jun 2026 into unified Veson Platform. **Sourced.**
- Marsoft acquisition: **10 March 2026**, not February. **Sourced.**
- B&V: Patent publication number WO-2025122898-A1 unverifiable on WIPO; application filed Dec 2023 is confirmed. BIMCO Technology Partner status confirmed (Mar 2025). **Sourced.**
- LMAA references: **~2,015** (+16% YoY, highest since 2014), not ~2,100 or "all-time high." **Sourced.**
- Greywing: One free SOF extraction trial, not unlimited free extraction. **Sourced.**

### The gap

Nobody in the sourced set publishes a charterer-side product that: (a) starts from the owner's claim alone, (b) produces a cited counter-position, and (c) treats weather as a credibility check on the log rather than a substitute for it. That gap is narrow. It closes if B&V adds counter-party mode, or a desk like DryNor wraps the same workflow in software.

"No platform provides a neutral side-by-side workspace" (strategic plan §3.2) is **rejected**. Veson CoCaptain and B&V Discrepancy Discoverer both compare line items.

---

## 4. Moat & Defensibility Scorecard

Helmer-style Powers, scored 1–5 (1 = no moat, 5 = hard to replicate).

| Candidate | Score | Verdict |
|---|:--:|---|
| Deterministic laytime / WWD engine | 1 | Keep as credibility asset. Not a moat. Free calculators exist. B&V has a pending laytime patent. |
| Multi-agent orchestration, PDF parsing, LangGraph | 1 | Commodity in 2026. Not a differentiator. |
| Clause-text corpus | 3 | Literature is public (Schofield, Krikris, club bulletins, BIMCO forms). Not the moat. |
| **Adjudicated outcome corpus** (clause × port × weather → what was paid) | **4** | **INVEST.** Ground truth only from closed claims. Non-replicable. Compounds per case. |
| **Arbitration-grade evidence packet** | **4** | **INVEST.** Changes the buyer from ops to counsel. |
| "Neutral Switzerland" network | 2 now / 5 only with liquidity | Do not build the exchange to deserve the moat. |
| Workflow lock-in / system of record | 2 for Keel / 5 for Veson | Bolt-on. Partner later. |
| Weather corroboration (ERA5) | 1–2 | Commodity input, legally weak (§5). Accelerant, not moat. |
| EDI / DCSA integration | 1 | Public specs. Cost of business. |
| Outcome-based pricing | tactic | Copyable. |
| P&I endorsement, SOC 2, ISO 27001 | 3 as trust / 1 as differentiation | Marcura already cites ISO 27001. |
| Pre-fixture demurrage underwriting | 2 | Real product later. Not this team's wedge. |

### Three investments

1. **Outcome corpus.** Every pilot produces labelled data. Start capturing it now.
2. **Evidence packet.** Reframe from "audit tool" to "filing-ready evidence."
3. **Speed to first win on one voyage, one letter, one price.**

### Explicit non-investments

Engine-as-moat. Clause text as moat. EDI. Building IMOS-with-demurrage. Container D&D. Sanctions surveillance. Bilateral exchange before anyone has settled a claim in the product.

---

## 5. Weather and Evidence — Product Framing

External weather does not replace the log.

- **London practice.** Carver, as quoted by Krikris (i-law): arbitrators prefer conditions in the vessel's logs to a weather-routing company unless the logs look falsified. In *Oinoussian Captain*, readings from vessels hundreds of miles away were held not precise enough. **Sourced.**
- **West of England.** The SOF is persuasive, not binding. A party may rebut it with local weather-station evidence. That is the bar: a **station**, not a 25 km cell.
- **ERA5 grid.** 0.25° (~25 km). Documented to underestimate strong winds and overestimate low wind. Cannot resolve a berth.
- **Open-Meteo licence.** Free tier: **non-commercial use only**. Historical marine grid: 0.5° (~50 km). A commercial product cannot rely on the free tier.

**Product sentence:** Assess whether this ship's log is reliable, using station records and — only after testing on known files — AIS behaviour at the berth. Do not lead with "certified meteorological hindcast."

### Three non-weather signals (all carried and unproven)

1. **AIS at the berth** — heading flicker while alongside; gangway-in-place. Test on 20 known stoppages first.
2. **Terminal event timestamps** (PortXchange-class). Historical export rights **not verified**.
3. **SAR/optical imagery** for 2–4 moments, not a timeline.

---

## 6. Adjacent Problems Worth Pursuing

Same four-trait filter: unstructured documents, deterministic rules, external physical data, money disputes.

| Rank | Problem | Decision | Note |
|---|---|---|---|
| Beachhead | Voyage-charter laytime/demurrage | **Keep.** Reference implementation. | Not the growth story. |
| 1 | **TC off-hire & speed/consumption defence** | **Next module, gated.** | Same machine: clause + day count + cited inputs. Charterer-side only. Speed and off-hire are mutually exclusive. Do not use sensor feeds covered by BIMCO Energy Efficiency Data Sharing Clause 2025 default. |
| 2 | **Bunker quality and quantity** | **Next, via P&I.** | Gard: **70+ bunker claims Jan–May 2026, +50% YoY.** ISO 8217 compliance ≠ fitness-for-use test. **Sourced.** |
| 3 | **Port disbursement (DA) audit, agent side** | After 1 and 2. | Marcura owns owner-side DA desk. |
| — | EU ETS / FuelEU / CII | **Feature, not product line.** | Only relevant inside off-hire calculation. |
| — | Container D&D | **Do not build.** | FMC §541.5 already strips payment obligation for non-compliant invoices. Windward and others already sell. **Sourced.** |
| — | Pre-fixture, eBL, sanctions | **Do not build on this roadmap.** | Capital-intensive, wrong shape. |

---

## 7. Regulation and Sourced Legal Facts

### 7.1 EU AI Act timing

**Regulation (EU) 2026/1744** (Digital Omnibus): published 24 Jul 2026, entered into force **27 Jul 2026**. **Sourced.**

- Annex III high-risk obligations: **2 December 2027**.
- Annex I (product-embedded): 2 August 2028.
- Article 50 transparency: generally 2 August 2026 (already past).

Annex III 8(a) (judicial use including ADR) is the classification fight. Working posture:

1. Confine the model to extraction and classification.
2. Keep money in the deterministic state machine.
3. Describe the product as a check on a completed calculation (Art. 6(3)(b)).
4. Write the classification memo now.
5. If high-risk sticks: Art. 99(4) fines up to **€15M or 3% of turnover**. Conformity assessment is **internal control** (Art. 43), not a notified body.

### 7.2 Sourced legal and market facts

| Fact | Status |
|---|---|
| LMAA references 2025: **~2,015**, +16% YoY (highest since 2014) | **Sourced** (HFW 2026) |
| SIAC maritime 2025: 85 SIAC + 83 SCMA = **168**. SIAC total **886** new cases, **$14.53B** in dispute | **Sourced** |
| LMAA Small Claims: **£5,000** fixed + **£6,000** cost cap, from **31 Mar 2024** | **Sourced** |
| FMC: 9 carriers collected **$15.4B** D&D, Apr 2020 – Mar 2025. §541.4 vacated (23 Sep 2025) | **Sourced** |
| UK Arbitration Act 2025: in force **1 Aug 2025** | **Sourced** |
| UK ETDA 2023 (eBL legal equivalence): in force **20 Sep 2023** | **Sourced** |
| Dry bulk demurrage: **$8–10B/yr**, 6–8% of freight spend (Marcura estimate, no independent study) | **Sourced** (Marcura) |
| Maritime software market: **$1.8B (2023) → $2.9B (2028)**, ~10% CAGR (PwC projection) | **Sourced** |
| IG P&I net claims 2024/25: **US$3.1B** | **Sourced** (Lockton) |

### 7.3 Regulatory tailwinds

| Development | Date | Impact | Status |
|---|---|---|---|
| UK ETDA 2023 (eBLs get legal equivalence) | In force 20 Sep 2023 | More digital claims requiring audit | **Sourced** |
| UK Arbitration Act 2025 (summary disposal) | In force 1 Aug 2025 | Lower-cost arbitral path — evidence packet matters more | **Sourced** |
| EU AI Act Omnibus (Reg. 2026/1744) | In force 27 Jul 2026 | Annex III high-risk deferred to 2 Dec 2027 | **Sourced** |
| IMO FAL.5/Circ.56 (standardized met observations) | Mar 2026 | Structured weather data from ports | **Carried** |
| BIMCO Virtual NOR / JIT Arrival consultation | Aug 2026 | Industry moving to digital NOR | **Carried** |
| IGP&I DCSA Standard Annex v.2 (5 eBL platforms) | 4 Jun 2026 | Cross-platform eBL interoperability | **Carried** |

### 7.4 Statistics to delete from the website

- "\$50M+ disputed claims audited", "<10s audit time", "100% calculation auditability" — not true.
- "5–10% of total demurrage value is written down" — wrong denominator, cites competitor marketing.
- "3–15% of agency invoices / over \$5B" — unsourced.
- Veson price range and ARR — no public disclosure.

---

## 8. Market Economics and Go-to-Market

### Bottom-up math

| Level | Figure | Basis |
|---|---|---|
| TAM | ~$72M/yr | Demurrage dispute software across bulk + tanker |
| SAM | ~$18M/yr | Charterer-side mid-market tools |
| Year-1 SOM | **$150K ARR** | 0.8% of SAM, 2–5 pilot customers at $30K–$50K |

These use a 4% recovery and 20% software-capture assumption on Marcura's $8–10B pool. **Those percentages are assumptions.** Present $150K as the beachhead, not the ceiling.

### Pricing

A 1–2% success fee on a book whose realistic audit delta is a few percent of spend does not cover the cost of sale. Charge for the voyage or the seat. Use a performance fee only as a co-delivery term with an advisor who already has the client.

### Channel

Performance-fee co-delivery with charterer-side desks. Named pilot targets (from the moat report, verified as real entities):

- **DryNor Maritime** (Copenhagen) — charterer-side, manual process, exactly the wedge
- **Albatros Bulk Carriers** — mid-market dry bulk
- **Timagenis** (London/Piraeus) — P&I correspondents, demurrage claim handlers
- **Interlloyd Claims Solutions** — independent adjusters
- **Aries Bulk** (Copenhagen) — dry bulk charterer

**GTM pitch:** "Send us 5 closed disputed voyages. We'll show you where $50K–$200K in unrecovered deductions was left on the table."

### Cautionary tales (verified)

| Company | What happened | Lesson | Status |
|---|---|---|---|
| **Casetext** | $650M acquisition by Thomson Reuters, standalone retired **1 Apr 2025** | Technical success + insufficient workflow embeddedness = acqui-hire | **Sourced** |
| **Robin AI** | ~$71.7M raised, laid off a third of staff Oct 2025, sold managed services to Scissero Dec 2025 | AI-native tool that couldn't displace manual process | **Sourced** |
| **Botkeeper** | ~$89.5M raised, shut down **Feb 2026** | Full automation promise in a profession that values human judgment | **Sourced** |
| **EvolutionIQ** | Sold to CCC for **$730M** (60% cash / 40% stock). Founded ~2019 (~5.5 yrs). | Positive analogue: narrow wedge (insurance triage), outcome data, grew inside existing workflow | **Sourced** |

**The lesson:** EvolutionIQ won because it was a single function inside the claims handler's existing workflow, not a replacement for the claims handler.

---

## 9. Implementation Phase 1 — Hardening & Sign-off Gate (Weeks 1–2)

Risk-ordered from the continuation plan. Every item is small (S) and needs no new infrastructure.

| # | Item | Source | Size | Verify |
|---|---|---|---|---|
| 1 | Remove extraction-cache trust boundary | Continuation step 4 | 0.5 day | Poisoned `extracted_charterparty.json` is not used; `pytest -m canonical` → 15 |
| 2 | Bound money fields in `schemas.py` | Continuation step 5 | 1 day | `demurrage_rate_per_day_usd = 1e12` rejected by validator |
| 3 | Fix clause label numbering | Engine gap 8 | 1–2 days | Letter cites `3.1` not `Clause 3` for the weather exception |
| 4 | Add despatch calculation | Engine gap 7 | 2 days | Early completion credits charterer; `pytest -m canonical` stays green |
| 5 | **Human sign-off gate** (API + review UI) | Continuation step 1 | 4–5 days | New signoff tests pass; status can't promote to `Reconciled` without a signoff row |

### Sign-off gate details (from continuation plan §4)

**What it changes:** A voyage's reconciliation stops being publishable the moment the pipeline finishes. A reviewer sees every extracted term and assessment with its citation, corrects or overrides what they disagree with, and only then marks the voyage issued.

**Files:**

| File | Change |
|---|---|
| `store.py` | Append-only `signoffs` table: `voyage_id`, `signed_by`, `signed_at`, `decision`, `note`, JSON snapshot |
| `main.py` | `POST /voyages/{id}/signoff`. Gate `PATCH .../status` promotion |
| `voyage/[id]/reconcile/page.tsx` | Review surface: terms, traces, day cards, per-day assessment with citations |
| `lib/types.ts` | `Signoff` shape |

**Three ride-along items for the same screen:**

- `PipelineState.validation_errors` must **block** issuing (today the graph calculates after 3 failed validations)
- Surface `_threshold_source` returning `None` as a must-fix-before-issuing condition
- Surface `_cited_rule_authority` as a visible fact, not a hidden payload

**Success criteria for week 2:**
- `POST /voyages/{id}/signoff` with no auth returns 403
- `PATCH .../status {"status":"Reconciled"}` without a signoff row returns 409
- Voyage with non-empty `validation_errors` can't be approved

### Also owed (§16 disclosures, not steps)

| # | What | Size |
|---|---|---|
| 16.1 | Wire `Reconciliation.rule_authority` to the frontend. `voyage_001` → `BIMCO_2013`. | S |
| 16.2 | Hide `/docs`, `/redoc`, `/openapi.json` in production (when `KEEL_API_TOKEN` set). | S |
| 16.3 | Fix CSS sanitiser blacklist — `image-set()` attack issues off-document GET. | S |

---

## 10. Implementation Phase 2 — Demo-Ready Sprint (Weeks 3–4)

| # | Item | Source | Size | Verify |
|---|---|---|---|---|
| 6 | Real PDF export | Continuation step 6 | 3–4 days | `GET .../letter?format=pdf` returns `application/pdf`; magic bytes `%PDF-`; totals match canonical |
| 7 | Wire `rule_authority` to frontend | Disclosure 16.1 | 0.5 day | `GET /voyages/voyage_001` has `"rule_authority": "BIMCO_2013"` |
| 8 | Hide docs/redoc in production | Disclosure 16.2 | 0.5 day | With `KEEL_API_TOKEN` set, `/docs` returns 404 |
| 9 | Fix CSS sanitiser blacklist | Disclosure 16.3 | 1 day | `image-set()` attack issues no request |
| 10 | **Deploy demo** | Forward plan §7 | 1 day | Demo URL loads end-to-end |
| 11 | Restore source PDFs | Continuation step 2 | Mechanical | `uv run pytest -q` → 0 failed, 354 passed, 1 skipped |

### Demo mode requirements (from hosting report)

Build demo-mode **before** any hosting decision. The database self-seeds. The engine is deterministic. Drive the demo from the reconciliation and the committed `test-cases/`, not from a live model call.

**Missing pieces for demo mode:**
- Mock branches on `fetchVoyageDetail` and `fetchVoyages`
- PDFs in `public/mock-pdfs/`
- Worker served from `public/` (not unpkg.com CDN)
- 6-second client timeout with fixture fallback
- Extractor fallback to cached extracts when model fails
- `?demo=1` must work with the API dead

**Success criteria for week 4:** A permanent demo URL exists. PDF letter downloads. All 3 disclosures from continuation §16 are closed.

---

## 11. Implementation Phase 3 — Auth & First Pilot (Weeks 5–8)

| # | Item | Source | Size | Verify |
|---|---|---|---|---|
| 12 | **Real authentication + per-voyage auth** | Continuation step 3 | 2–3 weeks | Unauthenticated `GET /voyages/{id}` returns 401; cross-tenant returns 403 |
| 13 | Email 5 pilot targets | Moat report §8.5 | GTM, parallel | At least one LOI or verbal commitment |
| 14 | Get 3 real disputed claim files | Moat report §10.6 | GTM, parallel | Files exist and are parseable |

**Auth scope (from continuation plan §6):**

What exists today:
- `AdmissionGuard` checks a shared secret only when `KEEL_API_TOKEN` is set. Off by default.
- The secret has no identity, no expiry, no rotation, no per-voyage scope.
- `apps/web/proxy.ts` mints a published constant cookie and says it is not authentication.
- No tenant concept: one `voyages` table, display `owner_name` only.

Changes: `tenants`, `users`, `voyage_participants(voyage_id, tenant_id, party_role)` in store. Replace shared-secret with real session verification. Per-voyage authorisation on every route.

**Pick one auth provider and commit. Designing for three is the failure mode.**

---

## 12. Implementation Phase 4 — Competitive Features & Beyond (Weeks 9–12+)

### Weeks 9–12: Competitive features

| # | Item | Source | Size | Verify |
|---|---|---|---|---|
| 15 | Definition 30 conditional demurrage carve-out | Engine gap 1 | 1 week | CP without carve-out stops crediting charterer during demurrage weather pauses |
| 16 | Genuine weather provider (ERA5/station) | Continuation step 7 | 1–2 weeks | Citation names provider and retrieval time; canonical tests pass with fixture provider swapped |
| 17 | "No threshold stated" as first-class state | Engine gap 5 | 1 week | Voyage with no extracted threshold blocks approval without explicit override |
| 18 | Start capturing adjudicated outcomes | Strategic investment #1 | Process | First pilot case = labelled row in corpus |

### Horizon 2 — Adjacent claim modules (months 3–6)

Default order: **speed & off-hire defence**, then **bunker quality/quantity** via P&I, then **agent-side DA** only if the first module is in use. Each module gets its own route, empty state, no fake totals.

**Triggers to start:** Three real disputed files with known outcomes. Canonical test still green after FHEX and cache fixes. Check whether a public laytime MCP tool already exists — if so, partner or wrap, do not build a second calculator.

### Horizon 3 — Only if a buyer asks to embed (months 6–12)

One `POST` API: charterparty + SOF → laytime, WWD verdicts, trace. Read-only Veson/Sedna connectors if a signed pilot requires them. SOC 2 when procurement checklist requires it. Durable workflows when a dispute actually sits open for weeks.

### Horizon 4 — Conditional (months 12–24)

Bilateral settlement and pre-fixture scoring only if counterparties already settle inside Keel and someone pays for the corpus. If nobody pays by month 24, stop. eBL, L/C, sanctions: out.

---

## 13. Engine Gaps (Priced)

Real limitations that change a number. From continuation plan §12, ordered by correctness impact.

| # | Gap | Effect | Cost | When |
|---|---|---|---|---|
| 1 | **Def 30 conditional demurrage carve-out** | Over-credits charterer when CP has no express carve-out | M | Week 9 |
| 2 | **Def 17 artificial working day** | Over-credits charterer; **wrong answer**, not stated assumption | L | After pilot |
| 3 | **Def 15 pro-rata** | Wrong basis for Def 15 charter parties. Blocked by gap 2's calendar. | S (after #2) | After pilot |
| 4 | **Bare WWD label ambiguity** | Def 15 gets Def 16 arithmetic | S + policy | Week 2 (surfaced in review UI) |
| 5 | **Threshold fallback defaults** | Silent default on unextracted threshold | M | Week 9 |
| 6 | **FHEX not implemented** | Gulf-port CPs get Sunday-only exclusion instead of Friday | M + data | After pilot |
| 7 | **No despatch** | Understates charterer entitlement on early completion | S | Week 1 |
| 8 | **Clause labels are positional** | Cites `Clause 3` when CP says `3.1` — audit trail defect | S | Week 1 |

**Rule:** A gap that over-credits one side (gaps 1, 2) is a correctness bug. Gap 8 moves no money but puts a wrong clause number on a citation, which a counterparty's lawyer can use to dismiss the trail.

---

## 14. Deployment Options Comparison

### The binding constraint

The backend needs >512 MB RAM during PDF parsing. `limits.py` allocates a 3 GB address space for the parser child process. Measured peak: 300–480 MB for dense SOFs, up to 2 GB for 200-page documents. **Any platform with a 512 MB hard cap will OOM-kill the parser.**

### Platform comparison (verified Oct 2026)

| Platform | Free RAM | Sleep | CC Required | Best For | Verdict |
|---|---|---|---|---|---|
| **Local + Cloudflare Tunnel** | Host RAM | Never | No | **Live demos & pitches** | ✅ Phase 1 recommended |
| **Google Cloud Run** | Up to 32 GB | Scales to zero | Yes | **Best free managed option** | ✅ Phase 2 permanent URL |
| **Coolify on Hetzner CX22** | 4 GB | Never | €4.35/mo | **Best for pilots** | ✅ Phase 3 when customer says "I'll try it" |
| **Oracle Always Free A1** | 2 OCPU / 12 GB (free-only) | Reclaimed if idle 7 days | Yes | Only free tier hitting all constraints | ✅ If patience available |
| **Vercel** (frontend only) | Serverless | Instant | No | Frontend hosting | ✅ Pair with backend elsewhere |
| Render free | 512 MB / 0.1 CPU | 15 min | No | — | ❌ OOM risk + external API suspension clause |
| Koyeb free | 512 MB / 0.1 vCPU | 1 hour | No | — | ❌ OOM risk, no volumes |
| HF Spaces Docker | 2 vCPU / 16 GB | 48h | **PRO/$9/mo required** | — | ❌ Not free for Docker |
| Fly.io | 256 MB–2 GB paid | 5 min auto-stop | Yes | Cheapest reliable (~$7.78/mo) | Paid fallback |
| Railway | 0.5 GB cap | — | Yes | — | ❌ Unusable |
| Cloudflare Workers | 128 MB | — | No | — | ❌ PyMuPDF can't load |
| AWS Lambda | 10 GB max | — | Yes | — | ❌ 15-min max, 6 MB payload |

**Key corrections (verified):**
- **HF Spaces Docker requires a paid plan** (PRO or Team/Enterprise org). Free accounts can only host ZeroGPU Gradio Spaces. **Sourced** (huggingface.co/docs/hub/spaces-overview).
- **Fly.io has no free tier** since Oct 2024. Trial: 2 VM-hours or 7 days. **Sourced** (fly.io/docs).
- **Oracle A1 free-only:** 2 OCPU / 12 GB (not 4/24). Idle reclamation after 7 days of low use. **Sourced** (Oracle docs).
- **Cloud Run --no-cpu-throttling:** Confirmed. Switches to instance-based billing (240,000 vCPU-s/mo free vs 180,000 request-based). **Sourced** (Cloud Run billing docs).
- **Vercel Hobby:** Non-commercial personal use only. **Sourced** (Vercel fair-use guidelines).
- **Railway:** $5 trial credit that depletes, then $5/mo paid. Not "$1/mo credit." **Sourced** (railway.com/pricing).

### Three deployment configurations, matched to phase

#### Phase 1 (now → demo ready): Local + Cloudflare Tunnel

Zero cost, zero setup, full PDF parsing power.

```bash
# Terminal 1: Backend
cd apps/api && uv run uvicorn keel_api.main:app --port 8000

# Terminal 2: Frontend
cd apps/web && pnpm dev --port 3000

# Terminal 3: Public HTTPS (instant, random URL)
cloudflared tunnel --url http://localhost:3000
```

**CORS note:** Set `KEEL_CORS_ORIGINS` to the tunnel URL.

#### Phase 2 (weeks 3–4): Cloud Run or Vercel + separate backend

**Cloud Run (single container, recommended):**
- 60-minute request ceiling (20× worst case)
- Use `--no-cpu-throttling` since the pipeline runs as a BackgroundTask
- Free quota: ~1,000 three-minute requests/month (instance-based billing)
- 1 GiB free egress/month

**Frontend alternative:** Vercel for frontend if deploying backend separately. But note Hobby = non-commercial.

#### Phase 3 (first pilot): Coolify on Hetzner CX22

- 2 vCPU, 4 GB RAM, 40 GB SSD, ~€4.35/mo
- No sleep, no cold start, persistent SQLite
- One-click deploys, SSL, dashboard via Coolify

### Tunnels & keep-warm

| Option | Free | URL stable? | Notes |
|---|---|---|---|
| cloudflared quick tunnel | ✅ | ❌ random subdomain | 200 concurrent, no SSE. URL dies with process. |
| ngrok free | ✅ | ✅ assigned dev domain | 3 endpoints. Interstitial warning page on free. |
| UptimeRobot free | ✅ | — | 50 monitors, 5-min interval. Good keep-warm for Render-class hosts. |

### Demo-day failure playbook

1. **API asleep/slow:** 6-second abort → fixture fallback. Narrate as cached audit.
2. **Model key expired/rate-limited:** Drive demo from deterministic core + test cases.
3. **Network dies:** `?demo=1` with local PDFs + 90-second screen recording as backstop.

---

## 15. Conflict Log & Source Document Errors

### STRATEGIC_PLAN.md — 6 critical errors (dangerous document)

| # | Error | Impact |
|---|---|---|
| 1 | 🔴 Attributes BIMCO weather thresholds — violates repo rules + test suite | Fails `test_adapters.py:144`, `test_api_hardening.py:675-681` |
| 2 | 🔴 Says Next.js 15 — it's **16.2.6** | Factual error |
| 3 | 🔴 References deleted `reconcile/` package | Code doesn't exist |
| 4 | 🔴 Describes 8+ features with no code in present tense | Fabrication |
| 5 | 🔴 Graph diagram doesn't match actual topology | Misleading |
| 6 | 🔴 Lists SOC 2 Type II as deliverable | No certification exists |

**The strategic plan should not be shown to anyone doing technical due diligence.** Its superseded header must remain.

### Resolution table (all source documents)

| Topic | Resolution |
|---|---|
| Moat | Outcome corpus + evidence packet. Weather is weak. Strategic plan's 6 pillars demoted. |
| North star | Bolt-on audit, not "neutral bilateral exchange." Exchange is Horizon 4, conditional. |
| $112k | Illustrative fixture only. 40% gap ≠ industry delta. Label it. |
| Marcura scale | 600K SOFs/20K claims vs 200K calls/350 clients are from different Marcura pages. Do not merge. HQ is Dubai. |
| Veson volume | Report both 950K/$24B and 1.1M/$71B+ figures. Drop ARR and price range. |
| Voyager round | **$8.4M Dec 2021**, not $11.5M Jul 2025. Jul 2025 is Motion round, amount undisclosed. |
| Demurrage.IA | **Rejected.** No source. |
| "Table stakes" quote | Exact Marcura SVP sentence **not found**. Use only the Oct 2025 2–3 year adoption comment. |
| Partner network | **March 2021**, not June 2025. |
| B&V Marsoft | **10 Mar 2026**, not February. |
| LMAA | **~2,015** references. ">75%" not used as a 2025 census. |
| EvolutionIQ | **$730M**, not $750M. Founded ~2019 (~5.5 yrs), not 7. |
| Horizon 1 email | Not in the repo. Not "done." |
| Def 15/16 | Not in `evaluators.py`. Not shipped. |
| HF Spaces | Docker requires paid plan. Not free as claimed. |
| Oracle shape | 2 OCPU / 12 GB on free-only tenancies. |
| Fly.io | No free tier since Oct 2024. |
| Railway | $5 trial credit, then $5/mo. Not $1/mo. |

---

## 16. Sources

Checked 2026-10-02 via research agents, cross-referenced against primary URLs.

**Competitors**

- Marcura Claims: https://marcura.com/demurrage-software
- Marcura port calls: https://marcura.com/manage-port-calls
- Marcura acquisitions: https://marcura.com/resources/blog/marcura-acquires-fairway-maritime-demurrage-management · https://www.ajot.com/news/marcura-acquires-hubse-expanding-demurrage-automation-across-all-cargo-types · https://www.ajot.com/news/marcura-acquires-shipdem-strengthening-chemical-tanker-claims-capability
- Marcura AI adoption (29 Oct 2025): https://maritime-executive.com/editorials/why-81-of-maritime-companies-are-piloting-ai-only-11-are-ready-to-scale
- B&V: https://burmester-vogel.com/products/bv-laytime/ · https://burmester-vogel.com/products/sailfast/ · https://burmester-vogel.com/
- Patent: https://patents.google.com/patent/WO2025122898A1
- Laysoft: https://burmester-vogel.com/news/burmester-vogel-announces-acquisition-of-laysoft/
- Marsoft: https://smartmaritimenetwork.com/2026/03/10/burmester-vogel-acquires-marsoft/
- Veson CoCaptain: https://veson.com/news/veson-nautical-launches-ai-powered-claims-management/ · https://veson.com/products/imos/claims/
- Veson Partner Network (2021): https://veson.com/news/veson-nautical-launches-veson-partner-network/
- Sedna / Dataloy: https://sedna.com/resources/sedna-acquires-dataloy-systems
- Voyager: https://www.voyagerportal.com/resources/voyager-portal-funding-motion-ventures/ · https://www.voyagerportal.com/demurrage-innovation-forum/
- DryNor: https://drynormaritime.com/
- Greywing calculator: https://www.grey-wing.com/product/laytime-calculator
- Chartera: https://app.chartera.io/laytime

**Market and law**

- HFW Arbitration in Numbers 2026: https://www.hfw.com/app/uploads/2026/07/008356-REPORT-Arbitration-in-Numbers-2026.pdf
- LMAA fees: https://lmaa.london/fees/
- LMAA appointment statistics: https://lmaa.london/lmaa-statistics-of-appointments-and-awards-2025/
- SIAC Annual Report 2025: https://siac.org.sg/wp-content/uploads/2025/09/SIAC-Annual-Report-2025.pdf
- Arbitration Act 2025: https://www.lcia.org/the-english-arbitration-act-2025.aspx
- FMC D&D: https://www.fmc.gov/detention-and-demurrage/ · https://www.law.cornell.edu/cfr/text/46/541.5
- EU 2026/1744: https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=celex%3A32026R1744 · https://digital-strategy.ec.europa.eu/en/news/ai-omnibus-enters-force
- West of England laytime exceptions: https://www.westpandi.com/news-and-resources/news/guides/defence-guides/defence-guide-interruptions-and-exceptions-to-layt/
- Open-Meteo licence/grids: https://open-meteo.com/en/pricing · https://open-meteo.com/en/terms
- EU ETS FAQ: https://climate.ec.europa.eu/eu-action/transport-decarbonisation/reducing-emissions-shipping-sector/faq-maritime-transport-eu-emissions-trading-system-ets_en
- FuelEU summary: https://download.classnk.or.jp/documents/FuelEU_faq_e.pdf
- BIMCO clauses: https://www.bimco.org/contractual-affairs/bimco-clauses/current-clauses/energy-efficiency-data-sharing-clause/ · https://www.bimco.org/contractual-affairs/bimco-clauses/current-clauses/bimco-contract-authenticity-clause/
- Gard bunkers (19 Jun 2026): https://www.gard.no/en/insights/beyond-specification-bunker-claims-insights-early-2026/
- Lockton IG claims: https://comms.lockton.com/marine/pi-report-2025/market-trends
- PwC Strategy&: https://www.strategyand.pwc.com/n1/en/digitalization-maritime-industry.html
- CCC / EvolutionIQ: https://ir.cccis.com/news-releases/news-release-details/ccc-intelligent-solutions-announces-acquisition-evolutioniq
- Kpler / Spire: https://virginiabusiness.com/spire-sells-maritime-business-for-241m-to-kpler/
- Quartermaster: https://techcrunch.com/2026/09/28/ocean-surveillance-startup-quartermaster-raises-another-140m/
- ClaimSorted: https://www.claimsjournal.com/services/newswire/2025/10/20/333606.htm
- Posidonia: https://posidonia-events.com/ · SMM: https://www.smm-hamburg.com/

**Hosting**

- Render: https://render.com/docs/free
- Koyeb: https://www.koyeb.com/docs/reference/instances · https://www.koyeb.com/docs/reference/volumes
- Hugging Face: https://huggingface.co/docs/hub/spaces-gpus · https://huggingface.co/docs/hub/spaces-overview · https://huggingface.co/docs/hub/spaces-sdks-docker
- Cloud Run: https://cloud.google.com/run/pricing · https://docs.cloud.google.com/run/docs/configuring/request-timeout · https://docs.cloud.google.com/run/docs/configuring/billing-settings
- Fly.io: https://fly.io/docs/about/discontinued-plans/ · https://fly.io/docs/about/free-trial/ · https://fly.io/pricing/
- Oracle: https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm
- Vercel: https://vercel.com/docs/limits/fair-use-guidelines · https://vercel.com/docs/functions/limitations
- Cloudflare tunnel: https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/trycloudflare/
- ngrok: https://ngrok.com/docs/pricing-limits/free-plan-limits
- Railway: https://docs.railway.com/pricing/free-trial · https://railway.com/pricing
- UptimeRobot: https://uptimerobot.com/pricing/
- GitHub Actions: https://docs.github.com/en/billing/concepts/product-billing/github-actions
- Hetzner Cloud: https://www.hetzner.com/cloud/

---

## 17. Still Open

Not established this pass. Not safe to add without a source:

- PortXchange historical export rights.
- Whether a marine insurer will write E&O for this output, and whether the output is "advice."
- Article 3(1) read end-to-end, and a finished Article 6(3) memo.
- Exact Marcura SVP "table stakes" sentence (only the Oct 2025 2–3 year comment is sourced).
- Burmester & Vogel headcount versus "1,000+ customers" versus "150+ global clients."
- Which Veson claims total is current, and why the dollar total tripled.
- Independent (non-Marcura) size of vessel demurrage.
- Academic percentages in moat report §6 (validator relabeling, CUAD, bill-of-lading fine-tune).
- Measured cold-start seconds for Cloud Run, Oracle A1, and other platforms.
- `StaticFiles` and HTTP `Range` for `pdf.js` — one `curl -I` unanswered.
- GitHub `laytime-calculator-pro` MCP server. **Carried as unverified.** If it exposes a usable laytime engine, the build-versus-partner decision changes. Check before writing another calculator.
- Hetzner CX22 exact current price (€4.35/mo widely reported but not re-verified from pricing page).
- HF Spaces: whether a Team org (not personal) can get free Docker Spaces.
- Open-Meteo Professional tier price in euros.
- BIMCO SmartCon specific features (AI duplicate checking, Agentic Contracts Advisory Board meeting dates).

---

*This report consolidates and supersedes all prior strategic, market, hosting, and planning documents. Every factual claim was either verified against a primary source on 2026-10-02 or explicitly marked as "Carried." The six source documents remain as historical records with superseded headers.*
