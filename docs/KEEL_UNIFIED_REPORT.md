# Keel — Unified Market, Moat, and Demo Report

**Date:** 2026-09-30
**Status:** Controlling document. Supersedes `docs/market-moat-report.md`, `docs/STRATEGIC_PLAN.md`, and `docs/hosting-demo-report.md`.
**Method:** The three source reports were merged and deduplicated. Quantitative claims were re-checked on 2026-09-30 against primary pages. Product claims were checked against the repo. An adversarial review of this file then ran against the sources, the code, and a second web pass. Defects from that review are folded in below. Where the sources disagreed, this file states the resolution and does not average them.

**Evidence marks**

| Mark | Meaning |
|---|---|
| Sourced | Re-checked this pass. URL in [§14](#14-sources). |
| Code | Read in this repo on 2026-09-30. |
| Carried | Kept from a source report. Not re-checked this pass. Do not cite in a board paper or on the website. |
| Rejected | Appeared in a source report and is dropped or corrected below. |

---

## 1. Resolved position

Keel is a charterer-side demurrage audit: extract the charterparty and both statements of facts, run laytime in deterministic Python, apply BIMCO 2013 weather-working-day thresholds, and show a cited counter-position. That product is the beachhead. It is not a moat by itself.

**What to build the company on**

1. An **adjudicated outcome corpus**: for a clause variant, port, weather regime, and NOR defect, what was actually paid or conceded. Clause text is public. Outcomes are not.
2. An **arbitration-grade evidence packet**: reproducible, offline, every figure tied to a source span. Sell this to the person who has to defend the number, not as another calculator.
3. **One disputed voyage, one letter, one price**, co-delivered with charterer-side advisors. Do not compete with Marcura or Veson on throughput or on being the system of record.

**What this file rejects from the strategic plan**

- “Neutral bilateral settlement exchange” as the operating plan. It remains a conditional late option (§11), not the product being sold.
- Station-level weather and ERA5 hindcasts as a moat. External weather is a commodity input, and London arbitration practice prefers the vessel’s logs unless they are falsified or exaggerated ([West of England](https://www.westpandi.com/news-and-resources/news/guides/defence-guides/defence-guide-interruptions-and-exceptions-to-layt/); Carver via Krikris, i-law). Sell **SOF credibility assessment**, not “we verified the weather.”
- Document parsing, a deterministic laytime engine, and multi-agent orchestration as defensibility. They are credibility assets. Marcura’s own materials already treat document AI as widely available; a specific November 2025 “table stakes within two years” quotation attributed to a Marcura SVP was **not found** this pass. A 29 Oct 2025 piece by Janani Yagnamurthy (styled VP Analytics / SVP Product) says adoption cycles are compressing to about two to three years. Do not quote the sharper line.
- Container D&D, sanctions/dark-fleet, S&P valuation, and a full chartering desk (recap, TCE, eBL, UCP 600) as near-term products. Wrong shape, capital-heavy, or already owned.
- The strategic plan’s hosting recipe (Hugging Face Docker Space as a free always-on backend, Render monolith as a peer option). See §10.

**Commercial ceiling, stated plainly.** The demurrage workflow is a real market with a capped buyer set and active consolidators. This pass does not support a venture-scale story on demurrage software alone. A bootstrapped audit practice, or a small strategic sale to a laytime incumbent, fits the evidence better than a platform raise. Named acquisition logic (Burmester & Vogel, then Marcura, then Voyager) is carried from the moat report and was not re-underwritten here.

---

## 2. What the repo is, and what Horizon 1 means

### 2.1 Code inventory

| Layer | Where | What it does |
|---|---|---|
| API | `apps/api/keel_api/main.py` | FastAPI. Seeds `voyage_001`. Static files from `fixtures/`. |
| Pipeline | `pipeline.py` → `pipeline_agents.py` | LangGraph: orchestrator, CP worker, SOF worker, validator, laytime engine, adjudicator. |
| Engine | `engine/state_machine.py` | NOR, turn time, SHEX / SHINC, once-on-demurrage. |
| Rules | `rules/evaluators.py` | BIMCO 2013 WWD thresholds (wind, precipitation, operations prevented). |
| Web | `apps/web` | Next.js **16.2.6**, React **19.2.4**. Marketing site plus portal. |

The canonical fixture reconciles an owner figure of **$187,000** and a charterer figure of **$62,000** to **$112,000**. That is a worked example in `test_canonical.py` and the UI. It is not an industry recovery rate (§8).

### 2.2 Horizon 1 — treated as the shipped claims product

The user directed this report to treat Horizon 1 as implemented. The strategic plan’s written Horizon 1 list is wider than the code. The webpage and any external claim must follow the code column.

| Strategic-plan Horizon 1 item | Status in repo (2026-09-30) | Say this on the site |
|---|---|---|
| LangGraph orchestrator–worker–validator, wired from `run_voyage_pipeline` | **Shipped, with defects.** Graph is in `pipeline_agents.py` and called from `pipeline.py`. | Live alpha architecture. Do not claim the retry loop improves extraction (§9). |
| BIMCO 2013 weather evaluation | **Partial.** `evaluators.py` implements WWD thresholds (force, precipitation, prevention, majority of hours). Definitions 15 (pro-rata working day) and 16 (24 consecutive hours) are **not** implemented. | “BIMCO 2013 WWD thresholds.” Do not say Definitions 15 and 16. |
| Side-by-side reconciliation and click-to-source PDF boxes | **Shipped on voyage detail** (`voyage/[id]/page.tsx`, `PdfViewer.tsx`). The reconcile page is day-verdict cards and does not mount the PDF viewer. | Live on the voyage page. |
| Claim letter | **Shipped** (`voyage/[id]/letter`). | Live. |
| Dashboard, voyages, reconciliations, reports | **Shipped.** | Live. |
| Outlook / Sedna ingestion and time-bar tracking | **Absent.** Landing copy still says “Coming Soon.” | Do not mark live. |

Also still open inside the shipped alpha (code, this pass):

- FHEX uses the Sunday exclusion. `state_machine.py` lines 35–45: any exception other than `SHINC` skips weekday 6 only. FHEX should except Friday. The docstring says “excluding Sundays for SHEX/FHEX.”
- Workers return `extracted_*.json` when the file exists, so a validator retry cannot change the extraction.
- The vessel-name mismatch branch is `pass`.
- `retry_count` increments on the validator return whether or not there are errors.
- `reconcile/adjudicator.py` hardcodes 14–16 June 2026 and is not imported. The live path is `adjudicator_node` in `pipeline_agents.py`.
- Uploads are written to a temp directory, while stored `pdf_urls` point at `/static/{id}/…`, which only serves git fixtures. An uploaded voyage’s citation link 404s.
- No project `Dockerfile` or `docker-compose.yml`. CI (`.github/workflows/ci.yml`) runs JSON checks and `py_compile`, not pytest and not a Next.js build.
- `PdfViewer` loads `pdf.worker` from `unpkg.com`.
- `USE_MOCK` does not wrap `fetchVoyageDetail` or `fetchVoyages`. `public/mock-pdfs/` is empty.
- No confidence field, no review queue, no abstention.

`main.py` resolving fixtures via `parents[3]` is **correct** for this layout. A container that copies only `apps/api` still crashes on boot, because `StaticFiles` mounts that directory at import.

---

## 3. Market landscape

Consolidation is real. The open gap is narrow: a **charterer-side, single-player audit that cites a counter-position and does not assume the other party already has a calculation**. Burmester & Vogel’s Discrepancy Discoverer compares two calculations the user uploads. DryNor does the charterer-side counter-calculation by hand.

### 3.1 Competitors (corrected)

| Player | What is sourced | What the source reports got wrong |
|---|---|---|
| **Marcura** | Claims marketing: 600,000+ SOFs, 20,000+ claims/year. Group marketing: 950 companies, 53 countries. DA-Desk / port-call pages: on the order of 200,000 port calls and 350+ clients. PortLog pages: on the order of 50 million SOF events. Payment totals on Marcura pages vary ($14B–$21.6B); do not pick one. HQ in public materials is **Dubai**, with a Copenhagen representative office — not “Marcura (Copenhagen)” as the headquarters. Acquisitions: **HubSE** announced about 26 Feb 2025; **Shipdem** about 18 Feb 2026; **Fairway Maritime** assets 14 Jul 2026. Marcura’s Fairway release calls Marcura Claims the largest laytime processor by volume. That superlative is their marketing. Public claims copy applies SOF weather stoppages to CP exceptions. No primary claims page found that says they check those stoppages against an independent station. | Strategic plan’s single blended stat block mixed DA-Desk, Claims, and PortLog. Moat report’s “Copenhagen” as HQ. |
| **Burmester & Vogel** | BV Laytime, SailFast, Discrepancy Discoverer. Own site: engine validated against **18,155** calculations; “1,000+ customers”; homepage also says “150+ global clients.” PitchBook: 13 employees. **WO2025122898A1**, “Analysis of laytime in maritime shipping operations,” assignee Burmester & Vogel Ltd, priority **6 Dec 2023**, PCT filed **6 Dec 2024**, published **12 Jun 2025**. Laysoft / Laytime2000 announced **26 Mar 2025** (closed Q4 2024). Marsoft announced **10 Mar 2026**, not February. | Headcount remains unreconciled (13 vs “1,000+ customers” vs “150+ clients”). Dealroom “45” was not verified; a search hit a different firm. |
| **Veson Nautical** | Claims CoCaptain launched **29 May 2025** (AI SOF parsing, side-by-side comparison, inside IMOS). May 2025 blog: **950,000 claims / $24B**. Current claims product page: **1.1 million claims / $71B+**. Both are Veson’s pages. The jump is not explained here; do not cite either figure as audited. Partner Network with ZeroNorth, Chinsay, Maritech, and Marcura launched **March 2021**, not June 2025. No official price list. “$50k–$500k/year” and “~$100M ARR” are **rejected** as Veson disclosures. A GetLatka estimate near $102M is a third-party estimate only. | Strategic plan §3.1 pricing and ARR. Moat report’s June 2025 partner-network date. |
| **Sedna** | Acquired **Dataloy** in July 2025. Product is marketed as **Sedna VMS**. | None material. |
| **Voyager Portal** | Motion Ventures round **31 Jul 2025**; the company post does **not** state an $11.5M Series A. Series A was **$8.4M in December 2021**. Homepage marketing: about 5% demurrage reduction and about 30 hours saved per analyst per week. Demurrage Innovation Forum: Houston 15 Apr 2025, Singapore 18 Nov 2025, Mumbai 21 May 2026. Alcotra is a Voyager case study. Chevron, BASF, Equinor, OMV appear on a Motion Ventures post, not as a Voyager customer list verified here. Staff count ~42 and “$50k/year entry” are directory figures, not primary. | Moat report’s “$11.5M Series A, July 2025.” |
| **DryNor** (Copenhagen) | Human charterer-side counter-calculation through to settlement. | None material. |
| **Maritime Claims Consulting** | Performance-based fee on savings not previously identified (company post, Aug 2025). | None material. |
| **Greywing** | Free manual calculator and a free one-SOF Proteus trial. Not unlimited free extraction. | “Gives away free SOF extraction” overstated. |
| **Chartera** | Freemium calculator. The live app states **10** free calculations on a personal email and **20** on a company-domain email. Not an unlimited public tool. | “Free public calculator” overstated. |
| **Demurrage.IA** | **Rejected.** No primary site or report found for a São Paulo product with a 20% success fee and $99–$2,499/month pricing. Do not name it as a competitor or as proof that success-fee pricing is taken. | Entire moat-report row. |

### 3.2 The gap, after the correction

Nobody in the sourced set publishes a charterer-side product that (a) starts from the owner’s claim alone, (b) produces a cited counter-position, and (c) treats weather as a credibility check on the log rather than as a substitute for it. That gap is small. It closes if Burmester & Vogel adds a one-sided counter-calculation, or if a desk like DryNor wraps the same workflow in software.

“No platform provides a neutral side-by-side workspace” (strategic plan §3.2) is **rejected**. Veson CoCaptain and B&V Discrepancy Discoverer both compare line items. The unmet piece is the one-sided, cited charterer counter-position plus an evidence packet a tribunal can examine.

---

## 4. Moat

Scores are 1 (no moat) to 5 (hard to copy). Strategic-plan “pillars” are folded into the same rows so they are not a second, softer scorecard.

| Candidate | Score | Verdict |
|---|:--:|---|
| Deterministic laytime / WWD engine | 1 | Keep. Not a moat. Free calculators exist. B&V has a pending laytime patent (§3). |
| Multi-agent orchestration, PDF parsing, LangGraph | 1 | Commodity. The landing page still lists the orchestrator as “Coming Soon”; the code has it. Selling the graph is the wrong sentence either way. |
| Clause-text corpus | 3 as a library, weak as a moat | Literature is public (Schofield, Krikris snapshot of LMAA awards, club bulletins, BIMCO forms). **Carried** for the bibliography; the conclusion is: do not call clause text the moat. |
| Adjudicated outcome corpus (clause × port × weather regime × NOR defect → what was paid) | 4 | **Invest, with two conditions.** (1) P&I clubs and claims handlers already hold private outcome files. Do not market “the” corpus. Sell charterer-side audits and, if a club is ever a buyer, an expert-witness trail, not a rival claims factory. (2) **BIMCO Energy Efficiency Data Sharing Clause 2025** defaults to shared voyage data **not** being usable to support claims against owners ([clause](https://www.bimco.org/contractual-affairs/bimco-clauses/current-clauses/energy-efficiency-data-sharing-clause/)). A sensor corpus can exist and still be contractually unusable for off-hire, speed, or consumption claims. That blocks “buy someone else’s outcome data” unless the clause is opted out of. Capture outcomes from disputes you actually handle. |
| Arbitration-grade evidence packet | 4 | **Invest.** Changes the buyer from an ops analyst to someone who files. |
| “Neutral Switzerland” network | 2 now / 5 only with liquidity | A network effect you do not have. Do not build the exchange in order to deserve the moat. |
| Workflow lock-in / system of record | 2 for Keel, 5 for Veson | Bolt-on. Partner later. Do not displace IMOS in year one. |
| Weather corroboration, including ERA5 | 1–2 | **Accelerant, not a moat.** Open-Meteo’s free tier is **non-commercial**. Its historical marine grid is **0.5° (~50 km)**. Historical ERA5 on Open-Meteo is **0.25° (~25 km)**; “31 km” is ECMWF’s common shorthand for the same 0.25° grid, not a third product. Gridded reanalysis is a poor berth sensor, and tribunals already prefer logs. |
| EDI / DCSA integration | 1 | Public specs. A cost of doing business later, not defensibility. |
| Outcome-based pricing | tactic | Copyable. With Demurrage.IA unverified, do not cite that company. A 1–2% success fee on a small book does not pay for the sale (§8). |
| P&I endorsement, SOC 2, ISO 27001 | 3 as trust, 1 as differentiation | Marcura already cites ISO 27001. Buyers in incumbent copy want a named human and a trail. Get the trail first. |
| Pre-fixture demurrage underwriting | 2 | Real product later. Not this team’s wedge. Kpler-class shops already price voyage risk before the fixture. **Carried.** |

**Three investments.** Outcome corpus. Evidence packet. Speed to a paid result on a single voyage.

**Explicit non-investments.** Engine-as-moat. Clause text as moat. EDI. Building IMOS-with-demurrage. Container D&D (FMC already removed the duty to pay a non-compliant invoice; see §7). Sanctions surveillance. A bilateral exchange before anyone has settled a claim in the product.

---

## 5. Weather and evidence — product framing

External weather does not replace the log.

- **London practice.** Carver, as quoted by Krikris: arbitrators prefer conditions in the vessel’s logs to a weather-routing company unless the logs look falsified or deliberately exaggerated. In *Oinoussian Captain*, readings from vessels hundreds of miles away were held not precise enough. **Sourced** via i-law (paywalled page; the proposition was confirmed against the public record of that article this pass).
- **West of England.** The SOF is persuasive and not binding. A party may rebut it with local weather-station evidence. That is the bar: a **station**, not a 25 km cell.
- **Open-Meteo licence.** Free API: non-commercial use only. Historical weather (the ERA5 hindcast) is **not** on the Standard plan; the pricing page lists it on Free (non-commercial) and on **Professional and above**. “Any paid key” is not enough. Historical marine grids at 0.5° do not resolve a berth. Self-hosted ERA5 is the other lawful path.
- **NY CPLR 4528** (official US weather bureau records as prima facie) is US-only and does not cover ERA5. **Carried.**
- **KNMI station 343 (Rotterdam Geulhaven)** is a harbour station with open files. No digitised equivalent was found for Piraeus in the moat report. **Carried.**

**Product sentence:** assess whether this ship’s log is reliable, using station records and, only after a test on known files, AIS behaviour at the berth. Do not lead with “certified meteorological hindcast.”

Three non-weather signals, in the order the moat report ranked them. All three are **carried** and unproven on Keel’s own files:

1. AIS at the berth (heading flicker while alongside; gangway-in-place). Test on 20 known stoppages before building.
2. Terminal event timestamps (PortXchange-class). Historical export to a third-party auditor was **not** verified. If it is unavailable, this signal fails for most target ports.
3. SAR or optical imagery for two to four moments, not for a timeline.

---

## 6. Adjacent problems

Same four-trait filter as the moat report: unstructured documents, deterministic rules, external physical data, a money dispute. The strategic plan’s six “platforms” are cut to three candidates and three explicit deferrals.

| Rank | Problem | Decision | Note |
|---|---|---|---|
| Beachhead | Voyage-charter laytime / demurrage | **Keep.** Horizon 1. | Not the growth story. The reference implementation. |
| 1 | Time-charter off-hire and speed/consumption defence | **Next module, gated.** | Same machine: clause, day count, cited inputs. New work is the performance warranty and the net-loss off-hire test. Charterer-side only. Speed claims and off-hire claims are mutually exclusive on the same period (**carried**: Kasi, MLB 9/2021). Public AIS that drops out for hours cannot support a speed profile. **Do not start this module on counterparty sensor feeds** covered by the BIMCO Energy Efficiency Data Sharing Clause 2025 default (shared voyage data not usable for claims against owners). Use documents the charterer already holds, or an explicit opt-out. |
| 2 | Bunker quality and quantity | **Next, via P&I, not via owners one by one.** | Gard: **over 70** bunker-related claims, January–May 2026, about +50% year on year. ISO 8217 table compliance is not the fitness-for-use test. **Carried** design notes (cappuccino effect, mass-flow meters, sample custody) stay in the appendix; they are not a committed spec. |
| 3 | Port disbursement (DA) audit, **agent side** | **After 1 and 2, if capacity remains.** | Marcura owns the owner-side DA desk. “3% to 15% of agency invoices / $5B” in the strategic plan is **unsourced** and is not used. A separate carried figure (credit notes on about 4% of DAs) is also not re-checked. Do not put either number on the site. |
| — | EU ETS / FuelEU / CII | **Feature inside a hire calculation, not a product line.** | Phase-in is real (§7). Do not open a nav item until off-hire and speed exist, because the dispute is “who pays the allowances during off-hire.” |
| — | Container D&D | **Do not build.** | See §7. Windward and others already sell it. |
| — | Pre-fixture recap, TCE, eBL, letters of credit, sanctions | **Do not build on this roadmap.** | Retained only so the strategic plan’s scope is visibly closed, not forgotten. |

---

## 7. Regulation and the numbers that survive

### 7.1 EU AI Act timing — corrected and confirmed

**Regulation (EU) 2026/1744** (Digital Omnibus on AI) was published in the Official Journal on 24 July 2026 and entered into force on **27 July 2026**.

- Annex III high-risk obligations: **2 December 2027**.
- Annex I (product-embedded): **2 August 2028**.
- Article 50 transparency: generally **2 August 2026**, which is already past as of this report. For systems that generate synthetic content and were placed on the market before 2 August 2026, **Article 111(4)** (inserted by Regulation 2026/1744) gives until **2 December 2026** to comply with Article 50(2). That transition is not a rewrite of Article 50 itself.

Annex III point 8(a) (judicial use, including the alternative-dispute-resolution limb) is still the classification fight. Human review does not by itself take a system out of a high-risk category. The working posture, carried from the moat report and not re-litigated against the guidelines PDF this pass:

- Confine the model to extraction and classification.
- Keep money in the state machine.
- Describe the product as a check on a human’s completed calculation (Article 6(3)(b) is the better fit than a first-draft “the system decided”).
- Write the classification memo. Do not wait for a board paper.
- If the high-risk classification sticks, Article 99(4) fines run up to **€15 million or 3% of global turnover**. Annex III conformity assessment is **internal control** (Article 43), not a notified body. Article 27 (fundamental-rights impact assessment) **does not apply** to this provider or its customers. **Carried** from the moat report’s reading of the Act; re-check the article text before a filing.

The moat report’s warning still holds: the “deterministic engine is not an AI system” argument was not read against Article 3(1) in full. Do not rely on it.

### 7.2 Other sourced legal facts

| Fact | Use |
|---|---|
| **LMAA** new maritime references in 2025: **approximately 2,015**, **+16%** year on year (HFW, 2026; LMAA’s own statistics page uses the same estimate). “~2,100” is an estimate for London (LMAA plus a small LCIA transport slice), not the LMAA statistic. | Cite “about 2,015” for LMAA. |
| Singapore maritime (SIAC + SCMA) **168** in 2025 (HFW: SIAC maritime 85 + SCMA 83; two forums, not one case counted twice). SIAC overall **886** new cases; **US$14.53B** is the total sum in dispute for all new filings (SIAC annual report). | Do not call 168 or 886 “LMAA.” |
| LMAA Small Claims Procedure, from **31 Mar 2024**: arbitrator fee **£5,000**; recoverable legal-costs cap **£6,000**. If the counterclaim exceeds the claim: extra arbitrator fee **£3,000**, combined costs cap **£7,000**. | The cost of a bad small claim exceeds a tool subscription. |
| “LMAA is >75% of world maritime arbitration” and “Arbitration Act 2025 Small Claims ≤ $100k” tiers in the strategic plan | **>75%** is a long-running industry estimate, not the HFW 2026 census. The **Arbitration Act 2025** exists and, per HFW, came into force **1 August 2025**. Dollar brackets in the strategic plan were **not** re-verified; do not repeat them. |
| FMC: nine carriers collected about **$15.4B** in detention and demurrage, **1 Apr 2020 – 31 Mar 2025**. 46 CFR Part 541 effective **28 May 2024**. **§541.5**: missing required invoice information eliminates the obligation to pay. **World Shipping Council v. FMC** (D.C. Circuit, **23 Sep 2025**) vacated **§541.4** (who may be billed). The rest of Part 541 remains in effect. | Supports “do not build container D&D.” |
| EU ETS maritime phase-in: **40%** of 2024 emissions, surrender by **30 Sep 2025**; **70%** of 2025 emissions, surrender by **30 Sep 2026**; **100%** from reporting year 2026, surrender by 30 Sep of the following year. | Strategic plan’s “40% (24), 70% (25), 100% (26)” is the phase-in, not the surrender calendar. Label both. |
| FuelEU Maritime: 2025 GHG-intensity limit **89.34 gCO₂eq/MJ**. Penalty construction in official summaries: deficit energy via about **41,000 MJ per tonne of VLSFO-equivalent**, times **€2,400**. A further-year multiplier applies. | Safe as a design note. Not a Horizon 2 screen. |
| BIMCO Holiday Calendar via the Data Exchange is **members-only**. Contract Authenticity Clause exists. Verification tool: `https://sc.bimco.org/verify`. | A licence is a gate for holiday-accurate laytime, not a moat you can scrape. |
| BIMCO already publishes Virtual Arrival (2013) and JIT Arrival (2021). In August 2026 it was consulting on a **combined Virtual NOR + JIT** clause, aimed at publication in 2026. | New evidentiary standard. Watch. Do not staff a product on a draft clause. |
| IG P&I net claims **2024/25: US$3.1B** (Lockton). | Context only. |
| PwC Strategy&: maritime software about **$1.8B (2023) → $2.9B (2028)**. | Consultancy projection, not a filing. |

### 7.3 Market statistics — delete, keep, or label

**Delete from the PRD, the landing page, and sales decks**

- “5–10% of total demurrage value is written down due to contract-term ambiguity.” Marcura’s sentence is different: charterparty ambiguities account for **5–10% of total demurrage write-downs**. Same page family also claims teams using Marcura Claims saw a **7–8% reduction in overall demurrage spend**. Both lines are vendor marketing, with no public sample size. Citing them as Keel’s market proof cites a competitor’s sales page, and the $187k → $112k fixture (~40% gap between the two positions) is not an illustration of a 7–8% spend reduction.
- Landing metrics **$50M+ disputed claims audited**, **<10s audit time**, and **100% calculation auditability**. Not in any source report. Not true of this repo as a portfolio.
- “3–15% of agency invoices / over $5B.” Unsourced in the strategic plan.
- Veson price range and ARR. See §3.

**Keep, labeled as Marcura estimates, not as independent TAM**

- Dry bulk demurrage on the order of **$8–10B/year**, framed as **6–8% of freight spend**, and day rates **$15–30k**. Published as Marcura analysis. No independent study was found. Bottom-up TAM in the moat report ($72M software TAM, $18M SAM, $150k SOM) used a 4% recovery and a 20% software-capture assumption on that Marcura pool. **Those two percentages are assumptions.** Repeat them only with the label.

**Not found, still.** Share of ships that finish inside laytime. Share of port calls that incur demurrage. Average vessel-demurrage dispute size. Share that settle versus arbitrate. Number of demurrage analysts.

---

## 8. Economics and go-to-market

**Pricing.** A 1–2% success fee on a book whose realistic audit delta is a few percent of spend does not cover the cost of sale. Charge for the voyage or the seat. Use a performance fee only as a co-delivery term with an advisor who already has the client, not as the list price.

**Channel that matches the product.** Performance-fee co-delivery with charterer-side desks, plus a few direct SME pilots. DryNor is the clearest public example of the manual version of the wedge. Named law firms, managers, and owner lists in the moat report §8.5 are **carried and not re-verified**. Do not put them on the website.

**Do not spend on a booth.** Posidonia 2026 ran **1–5 June 2026**; next edition **5–9 June 2028**. SMM Hamburg 2026 ran **1–4 September 2026**; next edition **5–8 September 2028**. The 12-month calendar has no Posidonia or SMM. Voyager’s Demurrage Innovation Forum is a competitor’s room.

**Freemium calculator as the main motion.** Rejected. The free layer is crowded (Greywing, Chartera, and others). A free *discrepancy list* that withholds the counter-position and the letter is a qualification gate, not a product strategy.

**Greek venture capital as the plan.** The moat report’s “no 2025–26 maritime-claims round; realistic Greek pre-seed €300k–€1M” is **carried**. This pass did confirm nearby rounds that are **not** this market: Kpler’s Spire Maritime deal about **$241M** (closed 2025), Quartermaster **$140M** announced **28 Sep 2026** (surveillance, not claims), ClaimSorted **$13.3M** seed **20 Oct 2025** (insurance claims). Do not pitch Keel as the next one of those.

**Cautionary exits, corrected.** Casetext’s standalone product was reported retired **1 April 2025** after Thomson Reuters folded the technology into CoCounsel (secondary write-up; the date is widely reported, not read from a Thomson Reuters shutdown notice in this pass). Robin AI cut staff in late 2025; a managed-services book was reported sold to Scissero in December 2025 — the acquirer was not described as buying the platform. Botkeeper shut down in early February 2026. EvolutionIQ was acquired by CCC for **$730M** (announced December 2024, closed 6 January 2025), not “about $750M.” The lesson those cases support: a tool the buyer can drop during consolidation is not a company. It is carried as analogy, not as a forecast for Keel.

---

## 9. Reliability work still inside Horizon 1

Horizon 1 being “implemented” does not close the defects in §2.2. An outside reviewer who reads `pipeline_agents.py` will see a retry loop that reloads the same JSON. That contradicts any claim that validation feedback improves the extract.

Order of work, unchanged in substance from the moat report §6.7, and still the right order:

1. Model emits a field, a verbatim span, a page, and a box. Python materialises the number.
2. Deterministic checks: IMO check digit, vessel name, UN/LOCODE against the named port, chronology, NOR not before arrival. Fail loudly.
3. Validator sees the artifact as an external record, not as its own previous answer.
4. Server-side provenance: every monetary figure traces to a record, and the total equals the sum.
5. Only then a retry that cannot be a cache hit and that receives the violated check.
6. Eval set grown from `test-cases/` (four cases today) toward a stratified set. Report precision and recall separately. One canonical dollar assertion is a regression test, not an evaluation.

Research citations behind the “relabel the validator,” “self-correction can hurt,” and “fine-tune beats zero-shot on bills of lading” paragraphs are **carried**. They were not re-read against the papers this pass. Do not put those percentages on the website.

---

## 10. Hosting and demo

The hosting report controls this section. The strategic plan §9 is withdrawn where it conflicts. Limits below were checked against vendor docs on 2026-09-30.

### 10.1 Recommendation

1. **Demo mode before any host.** The database re-seeds `voyage_001`. The engine is deterministic. Drive the demo from the reconciliation and the four committed `test-cases/`, not from a live model call. The missing pieces are still: mock branches on `fetchVoyageDetail` and `fetchVoyages`, PDFs in `public/mock-pdfs/`, a worker served from `public/` rather than unpkg, a short client timeout that falls back to the fixture, and an extractor fallback to `fixtures/voyage_001/_cached_extracts.json` when the model call fails. `?demo=1` has to work with the API dead.
2. **One container, one origin, and do not assume static export works today.** `api.ts` builds URLs by string concatenation, so an empty `NEXT_PUBLIC_API_URL` is same-origin. That removes CORS. A production build must not fall back to `http://localhost:8000`. `apps/web/app/api/voyages/route.ts` is a real route and is what blocks `output: 'export'`. Next.js `rewrites()` default to `afterFiles`, so that file wins over a proxy rewrite and the rewrite never runs. Move the route aside (do not delete it) before an export build, or set the rewrite to `beforeFiles`. Run one `pnpm build` in export mode before committing to that architecture. The current home page is a client component, not a `redirect()`.
3. **Managed free host: Cloud Run**, single container. The HTTP request timeout can be set up to **60 minutes**; that cap applies to the request, not to work that continues after the response. `main.py` runs the pipeline as a background task after the response, so either hold the request open until the job finishes (and stay inside 60 minutes) or enable **instance-based** CPU (`--no-cpu-throttling`). That flag’s free tier is **240,000 vCPU-seconds** / month, not the **180,000** of request-based billing. CPU outside the request is throttled unless the flag is set. Egress free tier: **1 GiB / month within North America**.
4. **Free VM: Oracle Cloud Always Free Ampere A1**, if a capacity error does not block signup. **Free-only tenancies: 1,500 OCPU-hours and 9,000 GB-hours / month (about 2 OCPU and 12 GB).** Paid tenancies are still documented at about **4 OCPU and 24 GB**. Block storage: **200 GB** combined. Size a free-only account for 2 / 12. Needs an ARM image and self-managed TLS. **Not “always on” by default:** Oracle may reclaim an Always Free instance that stays idle (CPU, network, and A1 memory under the published low-utilisation threshold, including a 7-day window). A quiet demo VM can disappear. Put a real keep-warm on it or do not promise the URL.
5. **When free is over: Fly.io `shared-cpu-4x` with 1 GB** at about **$7.78 / month** on the pricing page checked 30 Sep 2026, rising to about **$8.78 / month on 1 Oct 2026**. Fly.io has **no free tier** for orgs created after the 7 Oct 2024 cutoff. The trial is **2 VM-hours or 7 days**, not a $5 credit. Volume is extra (~$0.15 / GB-month).

### 10.2 Do not use for this app

| Option | Why |
|---|---|
| **Render free** | 512 MB, 0.1 CPU, no disk. Spin-down after 15 minutes. **750 instance-hours / month**: one always-on service is 720 hours. A second service crosses the cap and free services are suspended until next month. The free-tier policy names unusually high outbound calls to public APIs as a suspension trigger. Importing PyMuPDF plus the agent stack is already near the RAM cap. |
| **Koyeb free** | 512 MB, 0.1 vCPU, sleep after 1 hour, no volumes on free. Same RAM problem. |
| **New Hugging Face Docker Space as “the free 16 GB backend”** | CPU Basic hardware is listed at **2 vCPU / 16 GB**, and free hardware sleeps after **48 hours**. **Creating a Docker Space requires a paid plan** (PRO, or a Team/Enterprise org). A free personal account may still host a small number of **ZeroGPU Gradio** Spaces; that does not run this API. Disk is not persistent. The container runs as **UID 1000**. The strategic plan’s Dockerfile-on-a-free-Space path is not available to a free personal account. |
| **Cloudflare Workers** | 128 MB and 10 ms CPU on the free plan. PyMuPDF will not load. |
| **Lambda** | 15-minute max, **6 MB** synchronous payload. Charterparty PDFs and a multi-minute pipeline do not fit. |
| **Vercel as the upload path** | Hobby is **non-commercial personal use**. Function bodies are **4.5 MB**. PDFs must not be proxied through the function. A commercial demo belongs on the container, not on Hobby. |
| **Railway as a host** | Free plan still exists as **$1 / month** of credit after a $5 trial, with a 0.5 GB service cap. Not a fit. |

### 10.3 Tunnels and keep-warm

- **cloudflared quick tunnel:** no account, random `*.trycloudflare.com` host, **200** concurrent in-flight requests, **no server-sent events**. Polling status is fine. The URL dies with the process.
- **ngrok free:** up to **3** online endpoints, one assigned dev domain, interstitial page on browser traffic, 1 GB and 20,000 requests / month.
- **UptimeRobot free:** 50 monitors, 5-minute interval. Fits a 15-minute Render sleep window. It does not fix Render’s RAM or suspension policy.
- **GitHub Actions cron:** included minutes are unlimited on **public** repos; **private** Free is **2,000 minutes / month**. A 5-minute ping on a private repo does not fit (~8,640 minutes). Larger runners are billed even on public repos.
- Laptop demo: the tunnel ends when the machine sleeps. That operational note is practice, not a vendor quote.

### 10.4 Demo-day failures, in order

1. API asleep or slow, and the UI waits without a timeout. Fix: 6-second abort, then the fixture, narrated as the cached audit.
2. Model key missing or rate-limited. NVIDIA’s free NIM terms were described in the hosting report as prototyping-only with no guaranteed increase. **Carried.** Do not centre the demo on a live extraction.
3. Network blocks the API. `?demo=1` with local PDFs, plus a 90-second recording.

Also before any public URL: fix or hide upload (citation 404), fix FHEX or do not mention FHEX, and do not leave the hardcoded June 2026 adjudicator where a reader can mistake it for the engine.

---

## 11. Roadmap after the merge

Horizons below replace strategic plan §7. Horizon 1 is the claims alpha the user has marked implemented, **scoped by §2.2**. Later horizons are the moat report’s sequence, not the six-platform diagram.

### Horizon 1 — shipped claims alpha

Live: intake, dashboard, voyage side-by-side, PDF boxes on the voyage page, reconcile day cards, letter, deterministic laytime for SHEX/SHINC and once-on-demurrage, WWD thresholds, LangGraph pipeline.

Not live, even though the old Horizon 1 list included them: email ingestion, time bars, BIMCO Definitions 15 and 16, a retry loop that changes answers, FHEX, demo-offline mode, a container.

### Horizon 1.1 — close the alpha before adding modules

Fix the §2.2 defects that a pilot or a judge can find. Build demo mode (§10). Capture **settled outcome** on a voyage (amount conceded, by whom, which day). That field is the start of the corpus and is a small UI change, not a new company.

### Horizon 2 — one adjacent claim type, then a second

Default order: **speed and off-hire defence**, then **bunker quality/quantity** if a P&I handler will look at it, then **agent-side DA** only if the first module is in use. Each module gets its own route, its own empty state, and no fake totals. EU ETS allowance splits ride along with off-hire; they do not get a top-level product.

Do not feed Horizon 2 from counterparty noon-report or sensor shares that the BIMCO Energy Efficiency Data Sharing Clause 2025 puts off limits for claims against owners. Clubs already have private outcome files; the charterer-side packet is the product, not a claim to own “the” industry corpus.

Triggers to start a module: three real disputed files with known outcomes, and the canonical test still green after the FHEX and cache fixes. Before choosing to build another laytime engine, check whether a public agent-callable laytime tool (the moat report’s unverified `laytime-calculator-pro` MCP) already exists. If it does, partner or wrap it. Do not treat a second calculator as the company.

### Horizon 3 — only if a buyer asks to embed

One `POST` that accepts a charterparty and a SOF and returns laytime, WWD verdicts, and the trace. Read-only Veson or Sedna connectors if a signed pilot requires them. SOC 2 when a procurement checklist requires it. Durable workflows (Temporal or similar) when a dispute actually sits open for weeks in production. Not before.

### Horizon 4 — conditional, easy to kill

Bilateral settlement and pre-fixture scoring only if counterparties are already settling inside Keel and someone offers to pay for the corpus. If nobody pays for the corpus by month 24 of selling audits, stop the data product. eBL, letter-of-credit checking, and sanctions screens are out.

### Webpage plan

This is the implementation plan for `apps/web`. It is not a claim that the new modules exist.

**A. Correct the marketing site (`app/page.tsx`, `app/page1.tsx`, `app/layout.tsx` metadata)**

`page1.tsx` repeats the same offers. Change both, or make `/page1` redirect to `/`.

| Current | Change |
|---|---|
| Eyebrow “Next-Gen Maritime AI • Phase 1 Alpha Live” | “Charterer-side demurrage audit · Alpha” |
| Headline “Deterministic Truth to Global Trade” | A claim about a cited counter-position on one voyage. Do not say the model establishes truth, and do not say weather is verified. |
| “billions of dollars remain trapped” | Remove. No source. |
| Stat row `$50M+`, `<10s`, `100%` | Remove. Optional replacement: the canonical fixture, labeled **“Worked example, not a portfolio.”** Owner $187,000 · charterer $62,000 · reconciled $112,000. |
| Offerings: email plugin “Q3 2026”, document classification, validation/HITL, multi-agent “Coming Soon” | **Live card:** claims intake, side-by-side, click-to-source on the voyage page, WWD thresholds, letter. **Live, qualified:** orchestrator is in the alpha; do not promise self-correction. **Not live:** email, content-based routing, confidence review, Definitions 15/16, FHEX. Drop the Q3 2026 date; that quarter ends on the date of this report. |
| Values: “zero calculation hallucinations” as the mandate | Keep the rule “Python calculates.” Add the rule “a figure without a source span is not shown.” |
| Metadata description (“applies BIMCO 2013 weather clauses”) | Align with WWD thresholds and cited reconciliation. Mention the output is advisory, matching the footer. |

**B. Portal copy (`dashboard`, `reports`, `letter`, sidebar)**

- Reports and dashboard charts that say weather “confirm[s] operations were fully prevented” should say the threshold test on the observations **in the file**, not that the log was independently proven.
- “Claims saved” must not treat the $75,000 gap in the fixture as a typical saving.
- Sidebar **Settings** stays inert until there is a settings page. Do not add Horizon 2 links that 404.

**C. Features to add, in order**

1. **Outcome capture** on the voyage page: settled amount, party, date, note. Writes the first corpus row. Empty until a human enters it.
2. **Evidence packet** on the letter page: list of cited spans, missing-citation warnings, and a download of the letter plus the trace. This is the arbitration-facing shape of a screen that already exists.
3. **PDF viewer on the reconcile page**, reusing `PdfViewer`, so day cards and boxes are one flow. Today they are split.
4. **Demo mode** in the client: `?demo=1` and a timeout fallback, local worker, local mock PDFs. Required before a public demo URL.
5. **Speed & consumption** route, charterer defence only, behind a visible “In build” state until the engine exists. Inputs: warranty, good-weather definition, and documents the charterer already holds. Do not design the screen around counterparty sensor feeds; the BIMCO Energy Efficiency Data Sharing Clause 2025 default bars using shared voyage data for claims against owners. Output: time lost and fuel difference, each row cited. No off-hire on the same hours.
6. **Bunker** route, same pattern: BDN, sample, and spec in; protest deadline and variance out. No ISO-8217-only pass/fail presented as the legal test.
7. **DA audit** route last: tariff line versus invoice line. No “$5B leakage” copy.

Do not add nav items for email, ETS, eBL, sanctions, pre-fixture, or a bilateral room in this pass.

**D. Build sequence and checks**

1. Copy and metadata only. Check `/`, `/login`, `/dashboard` in the browser. Confirm the $50M row is gone and the fixture is labeled.
2. Outcome field and evidence list on an existing voyage. Check voyage detail, reconcile, and letter still show $112,000 for `voyage_001`.
3. Reconcile-page PDF. Click a day, see the same box the voyage page shows.
4. Demo mode with the API stopped.
5. New module routes one at a time, each with an empty state and no invented money.

Shared state: voyage records gain an optional settlement. Dashboard and reports read that field and must show “unset” rather than zero when it is empty, or “claims saved” will drift.

---

## 12. Conflict log

Decisions so a later edit does not reintroduce a rejected line.

| Topic | Market moat | Strategic plan | Hosting report | Resolution |
|---|---|---|---|---|
| Moat | Outcome corpus + evidence packet. Weather is weak. | Six pillars including weather, network, pre-fixture. | — | §4. Strategic pillars demoted. |
| North star | Bolt-on audit, not a system of record. | Neutral bilateral exchange. | — | Exchange is Horizon 4, conditional. |
| $112k | Illustrates a fixture; 40% is not the industry delta. | Canonical demo total. | Demo must show $112,000. | Keep the fixture. Label it. Do not infer TAM from it. |
| Marcura scale | 600k SOFs, 20k claims, 950 companies. | 200k calls, 350 clients, $15B, 50M events. | — | Both families exist on different Marcura pages. Do not merge into one sentence. HQ is Dubai. |
| Veson volume | Notes 950k/$24B vs 1.1M/$71B as inconsistent. | States 1.1M / $71B and ~$100M ARR. | — | Report both Veson figures. Drop ARR and the price range. |
| Voyager round | $11.5M Series A, Jul 2025. | Named, no round size. | — | **Rejected.** Jul 2025 Motion round, amount not $11.5M. |
| Demurrage.IA | Full row. | — | — | **Rejected.** No source. |
| Marcura “table stakes” quote | Load-bearing. | — | — | Exact sentence **not found**. Use only the Oct 2025 2–3 year adoption comment, or omit. |
| Partner network | Jun 2025. | — | — | **March 2021.** |
| B&V Marsoft | Feb 2026. | — | — | **10 Mar 2026.** |
| LMAA | ~2,100 references. | >75% of world arbitration. | — | **2,015** LMAA references. >75% not used as a 2025 census. |
| EvolutionIQ | ~$750M. | — | — | **$730M.** |
| Horizon 1 email | Not the moat-report’s first action. | Deliverable. | — | **Not in the repo.** Not “done.” |
| Def 15 / 16 | — | Immediate work item. | — | **Not in `evaluators.py`.** |
| HF Spaces | — | Free 16 GB Docker backend. | Docs contradict; verify. | **Creating Docker Spaces requires a paid plan.** |
| Render | — | Viable monolith. | Disqualified on RAM and policy. | Disqualified. |
| Oracle shape | — | — | 2 OCPU / 12 GB, not 4 / 24. | **2 / 12 on free-only tenancies. 4 / 24 still documented for paid tenancies.** Idle reclaim after low use (including a 7-day window) means it is not a set-and-forget always-on host. |
| Fly price | — | — | ~$7.93, then ~$8.93 on 1 Oct 2026. | Machine about **$7.78**, then about **$8.78** on 1 Oct 2026, before volume. |
| Cloud Run CPU flag | — | — | Flag unverified. | **Confirmed** in Cloud Run billing docs. Changes the free-tier bucket. |
| FHEX, cache, unpkg, empty mock PDFs, no Dockerfile | Flagged. | Not in the hosting section. | Flagged. | **Still true in code.** |

---

## 13. Still open

Not established this pass, and not safe to add later without a source:

- PortXchange historical export rights.
- Whether a marine insurer will write E&O for this output, and whether the output is “advice.”
- Article 3(1) read end-to-end, and a finished Article 6(3) memo.
- Exact Marcura SVP “table stakes” sentence.
- Burmester & Vogel headcount versus “1,000+ customers.”
- Which Veson claims total is current, and why the dollar total tripled.
- Independent (non-Marcura) size of vessel demurrage.
- The pilot-target company list, FONASBA, and the event prices in the moat report §5.1.
- Academic percentages in moat-report §6 (validator relabeling, CUAD, bill-of-lading fine-tune).
- Measured cold-start seconds. The hosting report’s “about one minute on Render” is an estimate.
- `StaticFiles` and HTTP `Range` for `pdf.js`. One `curl -I` still unanswered.
- Whether `app/page.tsx` `redirect` behavior matters under `output: 'export'`. The current home page is a client component, not a `redirect()`. Re-test export mode before betting the deploy on it.
- GitHub `laytime-calculator-pro` MCP server. **Carried as unverified.** If it exposes a usable laytime engine, the build-versus-partner decision changes. Check it before writing another calculator.
- ITIC Algeria holiday example (about $25,527). **Carried.**
- Oracle idle-reclaim percentages beyond the 7-day / low-utilisation rule stated in §10. Confirm the current Always Free page before relying on a quiet VM.
- Open-Meteo Professional price in euros. The tier gate is sourced; the euro amount was not copied into this file.

---

## 14. Sources

Checked 2026-09-30 unless noted. Marketing pages are labeled as such.

**Competitors**

- Marcura Claims: https://marcura.com/demurrage-software
- Marcura port calls: https://marcura.com/manage-port-calls
- Marcura acquisitions: https://marcura.com/resources/blog/marcura-acquires-fairway-maritime-demurrage-management · https://www.ajot.com/news/marcura-acquires-hubse-expanding-demurrage-automation-across-all-cargo-types · https://www.ajot.com/news/marcura-acquires-shipdem-strengthening-chemical-tanker-claims-capability
- Marcura leakage wording: https://marcura.com/resources/blog/demurrage-claims-leakage
- Marcura AI adoption piece (29 Oct 2025): https://maritime-executive.com/editorials/why-81-of-maritime-companies-are-piloting-ai-only-11-are-ready-to-scale
- B&V: https://burmester-vogel.com/products/bv-laytime/ · https://burmester-vogel.com/products/sailfast/ · https://burmester-vogel.com/
- Patent: https://patents.google.com/patent/WO2025122898A1
- Laysoft: https://burmester-vogel.com/news/burmester-vogel-announces-acquisition-of-laysoft/
- Marsoft: https://smartmaritimenetwork.com/2026/03/10/burmester-vogel-acquires-marsoft/
- Veson CoCaptain: https://veson.com/news/veson-nautical-launches-ai-powered-claims-management/ · https://veson.com/products/imos/claims/ · https://veson.com/blog/introducing-claims-cocaptain-ai-powered-claims-management/
- Veson Partner Network (2021): https://veson.com/news/veson-nautical-launches-veson-partner-network/
- Sedna / Dataloy: https://sedna.com/resources/sedna-acquires-dataloy-systems
- Voyager: https://www.voyagerportal.com/resources/voyager-portal-funding-motion-ventures/ · https://www.voyagerportal.com/demurrage-innovation-forum/
- DryNor: https://drynormaritime.com/
- Greywing calculator: https://www.grey-wing.com/product/laytime-calculator
- Chartera: https://app.chartera.io/laytime

**Market and law**

- HFW Arbitration in Numbers 2026 (LMAA 2,015): https://www.hfw.com/app/uploads/2026/07/008356-REPORT-Arbitration-in-Numbers-2026.pdf
- LMAA fees: https://lmaa.london/fees/
- SIAC Annual Report 2025: https://siac.org.sg/wp-content/uploads/2025/09/SIAC-Annual-Report-2025.pdf
- Arbitration Act 2025: https://www.lcia.org/the-english-arbitration-act-2025.aspx
- FMC D&D: https://www.fmc.gov/detention-and-demurrage/ · https://www.law.cornell.edu/cfr/text/46/541.5 · https://www.fmc.gov/articles/u-s-court-of-appeals-issues-decision-in-case-on-demurrage-and-detention-billing-practices/
- EU 2026/1744: https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=celex%3A32026R1744 · https://digital-strategy.ec.europa.eu/en/news/ai-omnibus-enters-force
- West of England laytime exceptions: https://www.westpandi.com/news-and-resources/news/guides/defence-guides/defence-guide-interruptions-and-exceptions-to-layt/
- Open-Meteo licence and grids: https://open-meteo.com/en/pricing · https://open-meteo.com/en/terms · https://open-meteo.com/en/docs/marine-weather-api · https://open-meteo.com/en/docs/historical-weather-api
- EU ETS FAQ: https://climate.ec.europa.eu/eu-action/transport-decarbonisation/reducing-emissions-shipping-sector/faq-maritime-transport-eu-emissions-trading-system-ets_en
- FuelEU summary: https://download.classnk.or.jp/documents/FuelEU_faq_e.pdf
- BIMCO holiday data terms, authenticity clause, verify tool, Virtual NOR consultation (21 Aug 2026), Energy Efficiency Data Sharing Clause: https://www.bimco.org/media/1svlixqt/terms-of-use-bimco-data-exchange-platform.pdf · https://www.bimco.org/contractual-affairs/bimco-clauses/current-clauses/bimco-contract-authenticity-clause/ · https://sc.bimco.org/verify · https://www.bimco.org/news-insights/bimco-news/2026/08/21-virtual-nor/ · https://www.bimco.org/contractual-affairs/bimco-clauses/current-clauses/energy-efficiency-data-sharing-clause/
- LMAA appointment statistics: https://lmaa.london/lmaa-statistics-of-appointments-and-awards-2025/
- World Shipping Council v. FMC (23 Sep 2025): https://www.fmc.gov/articles/u-s-court-of-appeals-issues-decision-in-case-on-demurrage-and-detention-billing-practices/
- Gard bunkers (19 Jun 2026): https://www.gard.no/en/insights/beyond-specification-bunker-claims-insights-early-2026/
- Lockton IG claims: https://comms.lockton.com/marine/pi-report-2025/market-trends
- PwC Strategy& software projection: https://www.strategyand.pwc.com/n1/en/digitalization-maritime-industry.html
- Posidonia: https://posidonia-events.com/ · SMM: https://www.smm-hamburg.com/
- CCC / EvolutionIQ: https://ir.cccis.com/news-releases/news-release-details/ccc-intelligent-solutions-announces-acquisition-evolutioniq
- Kpler / Spire: https://virginiabusiness.com/spire-sells-maritime-business-for-241m-to-kpler/
- Quartermaster: https://techcrunch.com/2026/09/28/ocean-surveillance-startup-quartermaster-raises-another-140m/
- ClaimSorted: https://www.claimsjournal.com/services/newswire/2025/10/20/333606.htm

**Hosting**

- Render: https://render.com/docs/free
- Koyeb: https://www.koyeb.com/docs/reference/instances · https://www.koyeb.com/docs/reference/volumes
- Hugging Face: https://huggingface.co/docs/hub/spaces-gpus · https://huggingface.co/docs/hub/spaces-overview · https://huggingface.co/docs/hub/spaces-sdks-docker
- Cloud Run: https://cloud.google.com/run/pricing · https://docs.cloud.google.com/run/docs/configuring/request-timeout · https://docs.cloud.google.com/run/docs/configuring/billing-settings
- Fly.io: https://fly.io/docs/about/discontinued-plans/ · https://fly.io/docs/about/free-trial/ · https://fly.io/pricing/ · https://fly.io/pricing-update/
- Oracle: https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm · https://docs.oracle.com/en-us/iaas/Content/Compute/References/arm.htm
- Vercel: https://vercel.com/docs/limits/fair-use-guidelines · https://vercel.com/docs/functions/limitations
- Cloudflare tunnel: https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/trycloudflare/
- Cloudflare Workers: https://developers.cloudflare.com/workers/platform/limits/
- ngrok: https://ngrok.com/docs/pricing-limits/free-plan-limits
- Lambda: https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html
- Railway: https://docs.railway.com/pricing/free-trial · https://railway.com/pricing
- UptimeRobot: https://uptimerobot.com/pricing/
- GitHub Actions: https://docs.github.com/en/billing/concepts/product-billing/github-actions
