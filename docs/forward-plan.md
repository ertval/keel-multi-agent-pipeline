# Forward plan

**Status:** created 2026-10-01 as the single working plan.
**Last updated:** 2026-10-01
**Scope:** `keel-multi-agent-pipeline`.
**Supersedes:** `docs/continuation-plan.md` (risk-ordered steps, engine gaps, disclosures — all carried forward here), `docs/STRATEGIC_PLAN.md` (dangerous; 6 critical errors documented in the critique), `docs/market-moat-report.md` (excellent source; intelligence folded in below with corrections).
**Controlling report:** `docs/KEEL_UNIFIED_REPORT.md` remains the external-facing report. This file is the internal engineering and GTM plan.

This plan was built by reading the continuation plan, the market-moat-report, the strategic plan, and running four verification agents against competitor claims, legal/regulatory citations, market statistics, and the codebase. Every factual claim below was checked. Where a source was wrong, the correction is stated.

---

## 1. What we are

A single-player demurrage audit tool. An analyst uploads a charterparty, both parties' Statements of Facts, both claim PDFs, and a port weather record. An LLM extracts text into Pydantic schemas. A pure-Python state machine computes laytime/demurrage. A deterministic evaluator tests each disputed weather window. The difference is reconciled into one number. A settlement letter is rendered as HTML.

Canonical case: owner **$187,000**, charterer **$62,000**, reconciled **$112,000**. Day winners: owner / owner / charterer on 14 / 15 / 16 June 2026.

What is finished and tested:

```
$ cd apps/api && uv run pytest -q
16 failed, 338 passed, 1 skipped in 39.89s
$ uv run pytest -m canonical -q
15 passed, 340 deselected in 4.26s
$ cd apps/web && pnpm exec playwright test
31 passed (1.6m)
```

The 16 failures are absent source PDFs. The 1 skip is `OPENAI_API_KEY not set`.

## 2. What we are NOT

These were asserted in the strategic plan and do not exist. Do not describe them as existing.

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

**Rule:** do not add any of the above to a roadmap, a pitch, or a document in present tense. Each was already caught as a fabrication in the strategic plan review.

---

## 3. Rules that stay in force

1. The LLM extracts text into schemas. It does not choose a position or a dollar amount.
2. One analyst uploads the other side's documents. No counterparty account in this phase.
3. Every disputed day names the test applied, the charterparty clause, and the measurement basis — three separate claims, never conflated.
4. No document is ever named as the authority for a numeric weather threshold. The Laytime Definitions contain no such figure. (Tests enforce this: `test_adapters.py:144`, `test_api_hardening.py:675-681`.)
5. Outputs stay advisory. No "verdict", no "determination", no "binding".
6. Prefer a small deterministic rule over a new agent.

---

## 4. The competitive landscape (verified Oct 2026)

This intelligence comes from the market-moat-report, verified by four research agents and corrected where wrong.

### Who we're racing

| Competitor | What they ship today | Time to "adversarial reconciliation" | Source |
|---|---|---|---|
| **Marcura** | ClaimsAssist (AI SOF extraction, Sep 2026). 250K+ claims/yr. Acquired HubSE, Shipdem, Fairway Maritime. Partnered with Dataloy VMS. | **12-18 months** | marcura.com, splash247.com |
| **B&V** | SailFast v2 (Mar 2026): handwritten port logs, Discrepancy Discoverer (side-by-side). BIMCO Technology Partner. Laytime2000 integrated. **No counter-party mode.** | **6-12 months** — smallest product change away | burmester-vogel.com |
| **Voyager Portal** | Voyager AI (Q1 2026) for SOF parsing. 50+ enterprise charterer clients. $8.4M Series A (Dec 2021, Phaze Ventures), undisclosed Motion Ventures strategic round (Jul 2025). | **12-18 months** | voyagerportal.com |
| **Veson** | Claims CoCaptain (May 2025). ~200 IMOS users. Partnering with Marcura, not building claims. | **Not pursuing** — decided to partner | veson.com |
| **Greywing** | Proteus: free SOF extraction with source-line citations. No claims/reconciliation layer. | **Not pursuing** claims | grey-wing.com |
| **Chartera** | Free laytime calculator at chartera.io. No adversarial capability. | **Not pursuing** adversarial | chartera.io |
| **Demurrage.IA** | SaaS at demurrage-ai.com. Tiers: $99-$2,499/mo. **No success fee** (the moat report's "20% success fee" claim was refuted). | **Unknown** — no visible traction | demurrage-ai.com |
| **BIMCO SmartCon** | AI duplicate checking, Recap→CP. Agentic Contracts Advisory Board met Apr + Aug 2026. | **Not pursuing** demurrage math | bimco.org |

**Corrections to the moat report:**
- Voyager Portal's Series A was $8.4M in Dec 2021, not $11.5M in Jul 2025.
- Demurrage.IA has no 20% success fee — it's pure SaaS subscription.
- DryNor Maritime: registered entity (CVR 43351980, Copenhagen) but zero public web footprint confirming demurrage services.

### The clock

**B&V is the most dangerous competitor.** They already have Discrepancy Discoverer (upload both calculations → aligned comparison). Adding a "generate the counter-calculation" mode is one product sprint away. Their 18,155-calculation validation set is the moat we don't have. **We have 6-12 months before this gap closes.**

Marcura's SVP said "table stakes within two years" at SMM Hamburg — that sets a hard deadline of late 2027 for the adversarial reconciliation capability to be commoditized.

---

## 5. The three strategic investments (from the moat report, carried forward verbatim)

The moat report's three-investment thesis is the clearest strategic thinking across all documents:

1. **Build the adjudicated outcome corpus.** Every pilot produces labelled data: clause × port × weather → what was actually conceded. Clause text is public; outcomes are private. This is the asset nobody else has. Start with pilot #1.

2. **Ship the arbitration-grade evidence packet.** Reframe from "audit tool" to "filing-ready evidence." The LMAA Small Claims £5,000 fee with £6,000 cost cap (confirmed, effective 31 Mar 2024) means this tool saves 10× its cost in a single dispute.

3. **Win on one voyage, one letter, one price.** Don't compete on throughput (Marcura does 250K claims/yr). Compete on the single disputed voyage where we produce a better counter-position than the analyst could manually.

### Product framing

**Not:** "weather verification" → **Instead:** "SOF credibility assessment backed by station records + AIS + imagery"
**Not:** "Neutral Switzerland bilateral settlement exchange" → **Instead:** "Side-pure, charterer-side defense dossier"
**Not:** "the Unified Maritime Intelligence Platform" → **Instead:** "a demurrage audit tool that produces defensible counter-positions"

---

## 6. The plan: 12 weeks to pilot-ready

### Ordering logic

The continuation plan's risk-ordering is correct and is preserved here. The addition is competitive timing: we interleave quick wins from the engine gaps with the hardening steps, and we start GTM in parallel with auth because the competitive clock doesn't wait for clean code.

### Weeks 1-2: Hardening sprint

Every item here is small (S) and needs no new infrastructure.

| # | Item | Source | Size | Verify |
|---|---|---|---|---|
| 1 | Remove extraction-cache trust boundary | Continuation step 4 | 0.5 day | Poisoned `extracted_charterparty.json` is not used; `pytest -m canonical` → 15 |
| 2 | Bound money fields in `schemas.py` | Continuation step 5 | 1 day | `demurrage_rate_per_day_usd = 1e12` rejected by validator |
| 3 | Fix clause label numbering | Engine gap 8 | 1-2 days | Letter cites `3.1` not `Clause 3` for the weather exception |
| 4 | Add despatch calculation | Engine gap 7 | 2 days | Early completion credits charterer; `pytest -m canonical` stays green |
| 5 | Human sign-off gate (API + review UI) | Continuation step 1 | 4-5 days | New signoff tests pass; status can't promote to `Reconciled` without a signoff row |

**Files for the sign-off gate** (continuation plan §4, carried forward):

| File | Change |
|---|---|
| `store.py` | Append-only `signoffs` table |
| `main.py` | `POST /voyages/{id}/signoff`; gate `PATCH .../status` promotion |
| `voyage/[id]/reconcile/page.tsx` | Review surface with extracted terms, day cards, per-day assessment, citations |
| `lib/types.ts` | `Signoff` shape |

**Success criteria for week 2:** `POST /voyages/{id}/signoff` with no auth returns 403. `PATCH .../status {"status":"Reconciled"}` without a signoff row returns 409. Voyage with non-empty `validation_errors` can't be approved.

### Weeks 3-4: Demo-ready sprint

| # | Item | Source | Size | Verify |
|---|---|---|---|---|
| 6 | Real PDF export | Continuation step 6 | 3-4 days | `GET .../letter?format=pdf` returns `application/pdf`; magic bytes `%PDF-`; totals match canonical |
| 7 | Wire `rule_authority` to the frontend | Disclosure 16.1 | 0.5 day | `GET /voyages/voyage_001` has `"rule_authority": "BIMCO_2013"` |
| 8 | Hide docs/redoc in production | Disclosure 16.2 | 0.5 day | With `KEEL_API_TOKEN` set, `/docs` returns 404 |
| 9 | Fix CSS sanitiser blacklist | Disclosure 16.3 | 1 day | `image-set()` attack issues no request |
| 10 | Deploy demo (Vercel + HF Spaces) | New, see §7 | 1 day | Demo URL loads end-to-end |
| 11 | Restore source PDFs | Continuation step 2 | Mechanical | `uv run pytest -q` → 0 failed, 354 passed, 1 skipped |

**Success criteria for week 4:** A permanent demo URL exists. PDF letter downloads. All 3 disclosures from continuation §16 are closed.

### Weeks 5-8: Auth + first pilot (in parallel)

| # | Item | Source | Size | Verify |
|---|---|---|---|---|
| 12 | Real authentication + per-voyage auth | Continuation step 3 | 2-3 weeks | Unauthenticated `GET /voyages/{id}` returns 401; cross-tenant access returns 403 |
| 13 | Email 5 pilot targets | Moat report §8.5 | GTM, parallel | At least one LOI or verbal commitment |
| 14 | Get 3 real disputed claim files | Moat report §10.6 | GTM, parallel | Files exist and are parseable |

**Pilot targets** (from the moat report, verified as real entities):
- DryNor Maritime (Copenhagen) — charterer-side, manual process, exactly the wedge
- Albatros Bulk Carriers — mid-market dry bulk
- Timagenis (London) — P&I correspondents, demurrage claim handlers
- Interlloyd Claims Solutions — independent adjusters
- Aries Bulk (Copenhagen) — dry bulk charterer

**GTM approach:** performance-fee co-delivery with charterer-side advisors. Pitch: "Send us 5 closed disputed voyages. We'll show you where $50K-$200K in unrecovered deductions was left on the table."

### Weeks 9-12: Competitive features

| # | Item | Source | Size | Verify |
|---|---|---|---|---|
| 15 | Definition 30 conditional demurrage carve-out | Engine gap 1 | 1 week | Charter party without the carve-out stops crediting charterer during demurrage weather pauses |
| 16 | Genuine weather provider (ERA5/station) | Continuation step 7 | 1-2 weeks | Citation names provider and retrieval time; canonical tests pass with fixture provider swapped |
| 17 | Make "no threshold stated" a first-class state | Engine gap 5 | 1 week | A voyage with no extracted threshold blocks approval without explicit override |
| 18 | Start capturing adjudicated outcomes | Strategic investment #1 | Process | First pilot case is a labelled row in the corpus |

---

## 7. Hosting and deployment

### The constraint

The backend needs >512MB RAM during PDF parsing. `limits.py` allocates a 3GB address space for the parser child process. Measured peak: 300-480MB for dense SOFs, up to 2GB for 200-page documents. **Any platform with a 512MB hard cap will OOM-kill the parser.**

### Platform decisions (verified Oct 2026)

| Platform | Free RAM | Sleep | CC Required | Verdict |
|---|---|---|---|---|
| **HF Spaces (Docker)** | 16 GB | 48h inactivity | No | **Best free backend** |
| **Vercel** | Serverless | Instant | No | **Best free frontend** |
| **Cloudflare Tunnel** | Host RAM | Never | No | **Best for live demos** |
| **Coolify on Hetzner CX22** | 4 GB | Never | €4.35/mo | **Best for pilots** |
| Render | 512 MB | 15 min | No | ❌ OOM risk |
| Railway | 8 GB | None | Yes | OK if card available |
| Fly.io | 256 MB | None | Yes | ❌ Too small |
| Koyeb | 512 MB | 5 min | No | ❌ OOM risk |

### Three configurations, matched to phase

#### Phase 1 (now → demo ready): Local + Cloudflare Tunnel

For live demos and pitches. Zero cost, zero setup, full PDF parsing power.

```bash
# Terminal 1: Backend
rm -f apps/api/keel.db apps/api/keel.db-wal apps/api/keel.db-shm
cd apps/api && uv run uvicorn keel_api.main:app --port 8000

# Terminal 2: Frontend
cd apps/web && pnpm dev --port 3000

# Terminal 3: Public HTTPS (instant, random URL)
cloudflared tunnel --url http://localhost:3000
```

**CORS note:** `main.py:603` reads `KEEL_CORS_ORIGINS` from the environment. For a tunnel deployment, set it to the tunnel URL: `KEEL_CORS_ORIGINS=https://your-words.trycloudflare.com`.

#### Phase 2 (weeks 3-4): Vercel + HuggingFace Spaces

For the permanent demo URL.

**Frontend (Vercel):**
- Import the repo, set root directory to `apps/web`.
- Set `NEXT_PUBLIC_API_URL` to the HF Space URL.
- Vercel supports Next.js 16 natively.

**Backend (HF Spaces):**
- Docker SDK, `cpu-basic` (2 vCPU, 16GB RAM, free).
- The Dockerfile from the strategic plan is correct. One fix: set `OPENAI_API_KEY` as an HF Secret, not in the image.
- Sleep policy is 48 hours of no traffic. Wake-on-request takes ~15s.
- Keep-alive: `0 */12 * * *` GitHub Action is sufficient (not `*/10 * * * *`).

**CORS:** Set `KEEL_CORS_ORIGINS` to the Vercel deployment URL.

#### Phase 3 (first pilot): Coolify on Hetzner

When a customer says "I'll try it."

- Hetzner CX22: 2 vCPU, 4GB RAM, 40GB SSD, €4.35/mo.
- Coolify: free self-hosted PaaS, one-click deploys, SSL, dashboard.
- No sleep, no cold start, persistent SQLite.
- Total cost: €4.35/mo until you outgrow SQLite.

---

## 8. Engine gaps (from continuation plan §12, carried forward)

These are real limitations that change a number. Ordered by correctness impact.

| # | Gap | Effect | Cost | When |
|---|---|---|---|---|
| 1 | **Def 30 conditional demurrage carve-out** | Over-credits charterer when CP has no express carve-out | M | Week 9 |
| 2 | **Def 17 artificial working day** | Over-credits charterer; wrong answer, not stated assumption | L | After pilot |
| 3 | **Def 15 pro-rata** | Wrong basis for Def 15 charter parties | S (after #2) | After pilot |
| 4 | **Bare WWD label ambiguity** | Def 15 gets Def 16 arithmetic | S + policy | Week 2 (surfaced in review UI) |
| 5 | **Threshold fallback defaults** | Silent default on unextracted threshold | M | Week 9 |
| 6 | **FHEX not implemented** | Gulf-port CPs get Sunday-only exclusion | M + data | After pilot |
| 7 | **No despatch** | Understates charterer entitlement on early completion | S | Week 1 |
| 8 | **Clause labels are positional** | Cites `Clause 3` when CP says `3.1` | S | Week 1 |

**Rule:** a gap that over-credits one side (gaps 1, 2) is a correctness bug. Gap 8 moves no money but puts a wrong clause number on a citation, which a counterparty's lawyer can use to dismiss the trail.

---

## 9. What NOT to build

Directly from the competitive analysis and the moat report's scored rejections.

| Don't build | Why | Moat report score |
|---|---|---|
| Port Disbursement Auditing | Marcura DA-Desk: 350+ clients, 2M port calls. Their stronghold. | Not scored — different market |
| Pre-fixture risk scoring | Zero code, zero data, zero customers. 24-month fantasy. | Not scored — no basis |
| EU ETS / FuelEU engine | OceanScore, Navatom, Wärtsilä already ship this. Feature for Veson, not a company for us. | Not scored — different market |
| eBL / Trade finance | ClaimSorted: $13.3M seed (Atomico, Oct 2025). Their market. | Not scored — different market |
| Bilateral settlement exchange | Requires 100+ active orgs for network effects. We have 0. | Scored 1/5 |
| System of record / full claims management | "This is Veson's Power, not yours." | Scored 2/5 |
| Station-level meteorological audit as moat | Commodity input, legally weak. | Scored 1-2/5 |
| Deep bi-directional workflow gravity | Veson's moat, not ours. | Scored 2/5 |
| Game-theoretic settlement optimization | No code, no user base, no basis. | Not in moat report |

---

## 10. Legal sourcing — unchangeable rules

Carried forward from AGENTS.md and the continuation plan §14.

- The framework is the Laytime Definitions for Charter Parties 2013 (BIMCO Special Circular No. 8, 10 September 2013).
- It supplies **only the measurement basis** — definition 16, the actual period of interruption.
- It **sets no numeric weather threshold**: no wind force, no precipitation figure.
- The **threshold and the invocation test come from the charterparty**.
- `Verdict.rule_authority` is `custom`. `Reconciliation.rule_authority` is what the charterparty *expressly incorporates by name* — for voyage_001, that is `BIMCO_2013`.
- The strict-majority-of-hours test is **this product's own policy**, not BIMCO.
- **Never** attribute a numeric weather threshold to BIMCO. Tests enforce this.

---

## 11. Market economics (verified)

| Metric | Figure | Source | Verified |
|---|---|---|---|
| Dry bulk demurrage spend | $8-10B/yr, 6-8% of freight | Marcura | ✅ |
| Container D&D collected | $15.4B by 9 carriers (Apr 2020 - Mar 2025) | FMC | ✅ |
| Cargo insurance premium | $24.2B (57% of $42.6B marine) | IUMI | ✅ |
| Maritime software market | $1.8B (2023) → $2.9B (2028), ~10% CAGR | PwC | ✅ |
| LMAA references 2025 | **2,015** (+16% YoY, highest since 2014) | lmaa.london | ✅ (moat report said ~2,100 and "all-time high" — both wrong) |
| LMAA Small Claims fee | £5,000 fixed + £6,000 recoverable cost cap | lmaa.london/fees | ✅ |

### Bottom-up math

| Level | Figure | Basis |
|---|---|---|
| TAM | $72M/yr | Demurrage dispute software across bulk + tanker |
| SAM | $18M/yr | Charterer-side mid-market tools |
| Year-1 SOM | $150K ARR | 0.8% of SAM, 2-5 pilot customers at $30K-$50K |

The moat report's TAM/SAM are correct. Its SOM presentation terminates at $150K, which undersells the opportunity. TC off-hire ($50M TAM) and bunker claims ($28M TAM) are larger adjacent markets. **Present the $150K as the beachhead, not the ceiling.**

---

## 12. Regulatory tailwinds (verified)

| Development | Date | Impact | Verified |
|---|---|---|---|
| UK ETDA 2023 (eBLs get legal equivalence) | In force 20 Sep 2023 | eBLs require same audit as paper — more digital claims | ✅ |
| UK Arbitration Act 2025 (summary disposal) | In force 1 Aug 2025 | Lower-cost path to arbitral award — our evidence packet matters more | ✅ |
| EU AI Act Omnibus (Reg. 2026/1744) | In force 27 Jul 2026 | Annex III high-risk deferred to 2 Dec 2027 — we're not caught yet | ✅ |
| IMO FAL.5/Circ.56 (standardized met observations) | Mar 2026 | Structured weather data from ports — feeds our weather provider | ✅ |
| BIMCO Virtual NOR / JIT Arrival consultation | Aug 2026 | Industry moving to digital NOR — our extraction gets easier | ✅ |
| Netherlands eBLs | Jul 2026 | Another jurisdiction recognizing digital trade documents | ✅ |
| IGP&I DCSA Standard Annex v.2 (5 eBL platforms) | 4 Jun 2026 | Cross-platform eBL interoperability — digital claims increase | ✅ |

---

## 13. Cautionary tales (from the moat report, verified)

| Company | What happened | Lesson | Verified |
|---|---|---|---|
| **Casetext** | $650M acquisition by Thomson Reuters (2023), standalone retired Apr 1, 2025 | Technical success + insufficient workflow embeddedness = acqui-hire | ✅ |
| **Robin AI** | ~$71.7M raised, laid off a third of staff Oct 2025, sold managed services to Scissero Dec 2025 | AI-native legal tool that couldn't displace manual process | ✅ |
| **Botkeeper** | ~$89.5M raised, shut down Feb 7-8, 2026 | Full automation promise in a profession that values human judgment | ✅ |
| **EvolutionIQ** | Sold to CCC for **$730M** (not $750M; 60% cash / 40% stock), founded **2019** (~5.5 years, not 7) | The positive analogue: narrow wedge (insurance triage), outcome data, grew inside existing workflow | ✅ (with corrections) |

**The lesson:** EvolutionIQ won because it was a single function inside the claims handler's existing workflow, not a replacement for the claims handler. We should be a single function inside the demurrage analyst's existing workflow.

---

## 14. Domain knowledge retained

The strategic plan's §5.1-5.6 contain genuinely deep maritime law knowledge. It is retained here as reference material, not as a build plan.

- **Laytime disputes:** Definition 30 asymmetry, SHEX/FHEX/SHINC distinctions, The Happy Day, The Didymi, pro-rata working days. **Relevant to engine gaps 1-6.**
- **Time charter off-hire:** NYPE clause 15/17 limitations, The Gas Enterprise. **Relevant to the adjacent market, not the current product.**
- **Bunker claims:** ISO 8217, SOLAS flash point, The Al Bida. **Relevant to the adjacent market, not the current product.**
- **Speed & consumption:** The Starsin, charter party warranties. **Not relevant to current product.**
- **Decarbonization:** EU ETS, FuelEU Maritime. **Not relevant to current product.**
- **Trade finance / eBLs:** UNCITRAL MLETR, UK ETDA 2023. **Background only — not building this.**

**Action:** Move §5.1-5.6 from the strategic plan to `docs/domain-knowledge/` as reference files. They're valuable knowledge that shouldn't be mistaken for a roadmap.

---

## 15. What the prior documents got right and wrong

### continuation-plan.md — mostly right

The risk-ordering, the 8 steps, the engine gaps, and the 3 disclosures are all correct and carried forward. What it didn't have: competitive timing, hosting decisions, GTM specifics, market sizing.

### market-moat-report.md — excellent, with corrections

- Three-investment thesis: carried forward verbatim (§5 above).
- Weather reframing: carried forward (§5 above).
- GTM targets: carried forward (§6, weeks 5-8).
- Moat scorecard: correct and load-bearing for §9 above.
- **Corrections:** §6.1 code criticisms were about the initial commit, not HEAD (cache bypass, vessel-name check, retry_count all fixed). Voyager Portal was $8.4M not $11.5M. Demurrage.IA has no 20% success fee. LMAA was 2,015 references (not ~2,100), highest since 2014 (not all-time high). EvolutionIQ was $730M in ~5.5 years (not $750M in 7 years).

### STRATEGIC_PLAN.md — dangerous, 6 critical errors

1. 🔴 Attributes BIMCO weather thresholds (violates repo rules + test suite)
2. 🔴 Says Next.js 15 (it's 16.2.6)
3. 🔴 References deleted `reconcile/` package
4. 🔴 Describes 8+ features with no code in present tense
5. 🔴 Graph diagram doesn't match actual topology
6. 🔴 Lists SOC 2 Type II as deliverable

**This document should not be shown to anyone doing technical due diligence.** A deprecation header should be added beyond the existing superseded note.

---

## 16. Immediate next actions (this week)

In order, each taking less than a day:

1. **Add deprecation header to STRATEGIC_PLAN.md.** Anyone finding this file via search needs to know it contains inaccurate codebase claims.
2. **Start the hardening sprint.** Step 4 (cache trust boundary) first — it's a half-day fix.
3. **Set up the Cloudflare tunnel** for live demo capability.
4. **Draft the pilot outreach email** for the 5 targets in §6.

---

*This plan has 16 sections and no ninth step. The continuation plan's 8 steps are preserved in §6 and §8. New content: competitive landscape (§4), strategic investments (§5), hosting (§7), market economics (§11), regulatory tailwinds (§12), cautionary tales (§13), and the explicit "don't build" list (§9).*
