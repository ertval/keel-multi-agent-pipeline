> **Superseded.** Controlling text is [docs/KEEL_UNIFIED_REPORT.md](KEEL_UNIFIED_REPORT.md). This file is retained as a source. Do not cite it where it conflicts with the unified report.

# Keel — Market Moat & Adjacent-Opportunity Report

**Date:** 2026-09-30
**Method:** 10 parallel research agents + full read of the repo (`docs/prd.md`, `docs/phase-1-plan.md`, `apps/api/keel_api/**`, `test-cases/`).
**Evidence standard:** every factual claim carries a source URL. Anything not confirmed by a retrieved source is marked **[unverified]**. Two agents hit search-provider rate limits (HTTP 429) mid-run; their scope was re-covered by other agents, and gaps are listed in §9.

---

## 0. What the repo actually is (read, not assumed)

Keel is a two-person hackathon MVP turned alpha-planning repo. Working demo, real architecture:

- **`pipeline.py` / `pipeline_agents.py`** — LangGraph Orchestrator-Worker-Validator graph. LLM extracts charterparty clauses + Statement-of-Facts (SOF) event timelines → deterministic `LaytimeEngine` (`engine/state_machine.py`, NOR + turn time, SHEX/FHEX/SHINC, WWD pause, once-on-demurrage) → `rules/evaluators.py` BIMCO 2013 WWD threshold → `reconcile/adjudicator.py` per-day verdicts → Jinja2 claim letter.
- **Canonical scenario:** owner claims $187K, charterer $62K, reconciled to **$112K**, every number cited to a CP clause bbox, an SOF row, or a weather observation.
- **`test-cases/`** — 4 hand-authored reconciliation cases with independent expected values, one proven through a live NVIDIA NIM LLM run. This is the best asset in the repo and it is under-used.
- **Phase-1 plan (`docs/phase-1-plan.md`) is honest.** It self-identifies: SQLite→Postgres, no auth, no tenancy, filename-based doc routing, 12K-char truncation, FHEX bug (`state_machine.py:44` excludes Sunday for both SHEX and FHEX), dead code in `reconcile/`, and totals sourced from extracted claim amounts rather than the engine.

### The repo's own moat thesis (PRD §2.2, §13.1, §13.4.3)
> "The deterministic math engine is table stakes, not a moat." … "workflow differentiation is **degree**, not **kind**." … "Keel's real moat will come from the **clause intelligence corpus**."

**Verdict: the thesis is directionally right and materially wrong in one place and under-informed in two others.** Details below.

---

## 1. THE HEADLINE: your wedge is already claimed, and one incumbent has said your moat is table stakes in two years

### 1.1 Five competitors ship adjacent-or-identical products today

| Player | What they actually ship | AI + date | Scale (self-reported) | The gap they leave |
|---|---|---|---|---|
| **Marcura** (Copenhagen) | CP Risk Analyser (pre-fixture clause contradiction detection) + Marcura Claims (full laytime/demurrage claims platform) + Hub Exchange (bilateral claim negotiation network) + Veson Platform Partner | Charter Party Risk Analyser, per-customer protected instance, "Knowledge Base & Reinforcement Learning" | 600,000+ SOFs, 20,000+ claims/yr, 950 shipping companies, 53 countries, 100+ human specialists, ISO 27001 audited by Lloyd's Register. Acquired **HubSE (2025), Shipdem (Feb 2026), Fairway Maritime (Jul 2026)** → now "largest laytime processor by volume" | Owns the **owner's** side. Applies weather exceptions **from the ship's own SOF**, citing the clause — *it does not check the weather claim against external evidence*. That is precisely your product. |
| **Burmester & Vogel** (Boston, 43 yrs) | BV Laytime (calc + tracker + Claims Kanban + **Discrepancy Discoverer**) + **SailFast** + EverBL + PortIQ. Pending patent **WO-2025122898-A1 "Analysis of laytime in maritime shipping operations"** (filed 2023-12-06) | SailFast: "handwritten notes to scanned Port Logs → draft calculation in <60s". Acquired **Laysoft/Laytime2000** (Mar 2025, 200+ dry-bulk users), **Marsoft** (Feb 2026) | Engine "validated against **18,155 real laytime calculations**"; 1,000+ customers | **Discrepancy Discoverer is your product from the owner's side**: "upload your calculation *and the counterparty's*" → aligns port events, compares allowances, flags differences with the CP clause. Stops at comparison, not external weather corroboration. |
| **Voyager Portal** (Houston) | Charterer-side demurrage + full claim lifecycle, AI SoF parser | Series A **$11.5M**, Motion Ventures strategic (Jul 2025), 42 staff. CTO: *"turning them almost into an executable program"* | Chevron, BASF, Equinor, OMV, Alcotra. Claims 5% demurrage reduction / 30 hrs saved per analyst per week; **$50K/yr** entry | Charterer-side and enterprise — the opposite ICP from an SME analyst. No external weather corroboration. |
| **Veson Nautical** (IMOS X) | System of record. **Claims CoCaptain**, May 2025: AI SOF parsing, side-by-side comparison, claims reconciliation, P&L writeback | May 2025 | >950K claims / >$24B cumulative. **Launched a Partner Network (Jun 2025) with Platform Partners ZeroNorth, Chinsay, Maritech and Marcura** — "free of charge for joint customers" | Decided to *partner* for claims rather than own the engine. **That is your distribution channel, not just a threat.** |
| **Demurrage.IA** (São Paulo) | Near-identical spec to your PRD: "deterministic 80-rule engine, zero LLM in the calc path, citation chain, LMAA submission package, **20% success fee**" | Claims Claude Opus + Sonnet [model names unverified] | Phase-2 MVP, $99–$2,499/mo | Success-fee positioning already taken. |

Also live: **DryNor Maritime** (Copenhagen) sells *exactly* your wedge by hand — "owner presents a claim → we read it the way an operator would, prepare the counter calculation and take it to settlement" — SLA-based, external charterer-side desk. **Maritime Claims Consulting** (Houston) owns the contingency-fee model: "no upfront cost, fee = savings not previously identified." **Greywing** (Singapore) gives away free SOF extraction with source-line citations. **Chartera** (Singapore) ships a free public laytime calculator. **BIMCO SmartCon** ships Recap→CP, clause-text verification, AI duplicate checking.

> **The free-calculator layer is saturated** (8+ tools). **The commercial claims layer is consolidating fast** (Marcura: 3 acquisitions in 18 months). And there is a community-built **laytime MCP server on GitHub** that exposes laytime/demurrage as an agent-callable tool [unverified — repo not loaded]. **Check this first.**

### 1.2 The most dangerous quote in the whole report — and it's from your competitor

Marcura SVP, Nov 2025: *"The barriers to entry aren't technological. AI capabilities for document analysis are widely available. What sets Marcura apart is the bedrock of data and experience… I expect this type of capability to become **table stakes within two years**."*

That is your moat thesis, delivered by the incumbent, with a two-year fuse. Your window is roughly **4–8 quarters**.

### 1.3 So: is per-day adversarial reconciliation with weather corroboration genuinely unserved?

**Yes — and this is the one defensible gap.** Every player in the field (Marcura, Demurrage.IA, laytime.com, Voyager, PORTINSIGHT) **accepts the vessel's weather assertion**. B&V's Discrepancy Discoverer does not verify that operations were actually prevented. Nobody station-anchors evidence at a berth.

But it is a **narrow** gap, and it is threatened from two directions: B&V ships a counter-party mode (small change, they already align two calculations), or a Greek SME does DryNor with an LLM (already happening).

---

## 2. The moat scorecard

Helmer-style Powers, scored 1–5 (1 = no moat, 5 = genuinely hard to replicate).

| Moat candidate | Score | Time to build | Defensibility | Verdict |
|---|:--:|:--:|---|---|
| **Deterministic laytime/WWD engine** | **1** | 2–4 mo | Near-zero. Free tools, a GitHub MCP server, a **pending B&V patent**, and Chartera's free tier. Worse than table stakes — it is the part a competitor can use *against* you. | **Reject as moat.** Keep as credibility asset. |
| **Clause-text corpus** (the PRD's pick) | **3** | 18–36 mo | **Weak, because the literature is already public**: Schofield *Laytime and Demurrage* (8th edn), Krikris *Snapshot Guide* (~270 LMAA awards, ~840 issues, 1980–2020), West of England + Steamship Mutual bulletins, LMAA award summaries, BIMCO forms. None are proprietary. | **Reject as stated.** Re-cut as outcomes ↓ |
| **Adjudicated dispute-outcome corpus** (clause × port × weather regime × NOR defect → what was actually paid/conceded) | **4** | 24–48 mo | **High.** Ground truth obtainable only by ingesting closed claims or winning disputes. Non-replicable, compounds per case. Marcura has the *volume*; nobody has a *validated outcome benchmark*. | **INVEST. This is the moat.** |
| **Arbitration-grade evidence product** (filing-ready packet, reproducible offline, examinable expert report) | **4** | 12–18 mo | Underrated. Changes the competitor set from "other AI tools" to "Excel and a nervous analyst," and the buyer from ops to counsel (who has budget). | **INVEST.** |
| **Per-customer eval/feedback loops** | **3** | 12–18 mo | Real only if protected per instance and cumulative — **Marcura already does exactly this**. | Possible but contested. |
| **Workflow depth / system-of-record lock-in** | **2 for you / 5 for Veson** | 24–48 mo | This is Veson's Power, not yours. You are a bolt-on. | Reject. |
| **EDI / DCSA / EDIFACT integration** | **1** | 6–12 mo | Commodity. BAPLIE/CODECO/IFTMIN are public UN/EDIFACT D.95B specs with downloadable schemas; DCSA publishes APIs openly. A barrier to *entry*, getting cheaper. | Reject. |
| **Brand/trust in arbitration** | **3** | 5+ yrs | Slow, expensive, real. Cannot be cloned by a model. | Long-term. |
| **Weather corroboration** | **1–2** | 3–6 mo | See §4 — a commodity, and legally *weak*. | Reject as moat. Keep as accelerant. |
| **Outcome-based pricing** | **3 (tactic)** | now | Copyable; Demurrage.IA already charges 20%. B2B procurement is actively skeptical of outcome pricing (BCG 2025). | Tactic, not moat. |

### 2.1 Invest in exactly three things

1. **Adjudicated dispute-outcome corpus.** Not clause text — *labelled outcomes*. For clause variant X, port P, weather regime R, NOR defect D: what did the owner actually recover, what did the charterer actually concede. Stanford Law's ascending moat order (workflows → harness → compliance → data OS → **embedded judgment**) ends at judgment capture. EvenUp's moat is 200,000+ cases of *how experienced attorneys value injuries*, not document templates. You're one analyst-dispute dataset away from the same asset. **Start capturing it now; it's the company's primary asset and the thing you measure.**
2. **Arbitration-grade evidence as a distinct product category.** Reframe from "audit tool" → "filing-ready, reproducible evidence packet." London LMAA took ~2,100 maritime references in 2025 (+16% YoY, all-time high); Singapore 168. LMAA Small Claims Procedure is a **£5,000 fixed fee** with a **£6,000 recoverable-cost cap** — so getting it wrong costs 10× the tool. That's a dated, sourced, underserved corridor, narrow enough to be a company.
3. **Speed-to-first-win on the single disputed voyage**, priced as contingency. B&V and Voyager both already claim 10×. Don't compete on throughput — compete on *one voyage, one letter, one price*.

### 2.2 Explicitly reject

- The math engine as a moat (see §2 table).
- Clause *text* as a moat — the literature is public and in print since 1980.
- EDI/DCSA integration as defensibility.
- Building a system of record / full claims-management platform. Bessemer's arithmetic: vertical AI competes for **labor** budgets (~10× the software market), but capturing that budget requires owning the workflow — which requires the team you don't have.

---

## 3. Venture-scale or strategic acquisition? Blunt answer

**This is a $2–8M strategic acquisition or a good bootstrapped business. I would not fund it as a venture on the demurrage thesis.**

The market is real; the ceiling is capped by buyer count and by Marcura's position.

**The cautionary tales, and they fail the same way — technical success, insufficient workflow embeddedness:**
- **Casetext** — best-in-class legal research + CARA AI. Acquired by Thomson Reuters 2023, **shut down April 1, 2025**, folded into CoCounsel. Best product, zero standalone value.
- **Robin AI** — ~$70M raised, laid off a third of staff Oct 2025, sold managed services **at a knockdown price** Dec 2025. The acquirer took the team and clients and **explicitly did not buy the technology platform**.
- **Botkeeper** — $90M raised, 11 years, 200+ accounting firms. Shut down in **early 2026, immediately after the technology finally worked** (80% of transactions coded at 98% accuracy). CEO: *"If customers can drop you during consolidation, you are useful, **not indispensable**."*

**The one venture-scale analogue — and its shape matters.** **EvolutionIQ**: 2 people, insurance claims where 80% of the money went, hybrid AI+human, exited to CCC for **$750M in 7 years**. It was a *services-led claims business* where software was a cost-reduction tool. That's the only route to venture scale here — and it's the route Marcura itself took by buying **Fairway Maritime (6 people, 20 years, Jul 2026)** rather than building.

**Named acquirer targets, in order of fit:**

| Target | Why |
|---|---|
| **Burmester & Vogel** | Best fit by a wide margin. 40+ years, 1,000+ customers, owns a laytime patent, already acquiring in-category (Laysoft, Marsoft). |
| **Marcura** | Buying claims capability by acquisition. Their CEO conceded *"the outcome still turns on commercial judgement"* — your outcome corpus is exactly their gap. |
| **Voyager Portal** | $11.5M Series A, 42 people, demurrage is the stated growth engine. Needs a defensible audit layer to move upmarket. |
| **Chartera** (Singapore) | Youngest, closest feature overlap; likely an acquihire — and a good one. |
| **Veson Nautical** | Owns the system of record; natural module. Low willingness to pay for a non-embedded asset. |
| **Kpler** | Just closed $241M for Spire Maritime. Buys data aggressively, but thesis is trade intelligence, not claims. |
| **Windward** | Went private (FTV, Mar 2025); maritime AI with a government channel. Risk ≠ claims. |

**Do not build IMOS-with-demurrage.** That is how a 2-person team gets acquired for its talent, not its IP. Decide *now*, while you have leverage, whether you're building a company or a 4–8 quarter option.

---

## 4. Weather: commodity input, legally weak, and biased the wrong way

**Verdict: external weather corroboration is a commodity, and it is the *weakest* evidence tier — not a moat.**

- **Free substitutes exist.** ERA5/ERA5-Land/MERRA-2/NASA POWER/IEM/NCEI/Meteostat are free with permissive licences. Open-Meteo's free tier is a complete substitute for your fixture. Anyone can build the ERA5 version of Keel in a weekend.
- **The grids are wrong for a berth and the literature says so.** ERA5's 31 km grid is documented to *underestimate strong winds offshore* (WES 2024; Kalverla et al.) and *overestimate low wind / underestimate high wind* (Chen 2024, Int. J. Climatol.) — i.e. **biased toward finding the weather benign**, the opposite of what a charterer's WWD claim needs. ERA5 10 m wind has the lowest correlation of any level (r = 0.71). **Your 31 km cell cannot resolve a berth.**
- **Open-Meteo is a commercial-licence problem, not a free one.** Free tier = **non-commercial use only**; standard tier is 1M calls/mo with mandatory CC-BY attribution and no published € prices. Historical waves are **50 km**. Also: Open-Meteo Marine MFWAM 8 km only from Oct 2021 — useless for older disputes.
- **Commercial blended APIs are worse than nothing in front of an expert.** Weatherbit openly ML-backfills gaps; Tomorrow.io's own docs warn the historical archive "deviates from the recent historical data -7 days." A tribunal cannot be shown how a gap-filled hour was derived.

### 4.1 The finding that inverts your product framing

> **Carver on Charterparties, via Krikris (i-law, Nov 2025):** *"It is a matter of long-standing practice among London maritime arbitrators to **prefer the conditions recorded in the vessel's logs to evidence from a weather routing company** unless there is evidence to suggest that they have been falsified or deliberately exaggerated."*

And it has already been rejected for exactly your reason: in ***Oinoussian Captain*** a charterer's speed analysis failed because it *"relied upon comparative weather readings from **nearest vessels some hundreds of miles away**"* — held *"not sufficiently precise to carry the charterers' burden."* **That is your ERA5 cell, 300 miles from the berth, in a published award.**

And in an LMAA award reported Oct 2025 the tribunal went the other way too — it **accepted the vessel's logs as prima facie** because the master's contemporaneous record, corroborated by the port's state met agency and the port captain, was the best available evidence.

Also hostile: **methodology opacity ⇒ adverse costs.** A panel rejected a speed claim supported by a weather analysis company's report absent a methodology explanation, and **adverse cost orders have issued where flawed methodologies wasted time** (London Arbitration 23/21, 32/22, 15/23).

**Reframe: stop selling "external weather verification." Sell SOF credibility assessment** — a statement about whether *this ship's log is reliable*, backed by station records + berth-time AIS + targeted imagery. That matches how the law actually treats the problem, and it attacks the only evidence the tribunal currently prefers.

### 4.2 The three best non-weather independent "operations were prevented" signals

1. **AIS berth-window integrity (highest value).** Independent of both parties, vendor-attested, and AIS is admitted evidence. Two powerful inferences: (a) **air-draught heading oscillation at fixed berth** — a vessel working cargo holds steady heading; beam wind shows up as ±5–15° yaw flicker with SOG <0.5 kn, so a claimed 12-hour wind stop with a *flat* heading trace is near-self-refuting; (b) **gangway/anchor watch cycles** — a hard stop often shows as still-at-same-position-with-gangway-in-place. Data: Marine berth calls + historical positions (archive to 2015; heading reliable post-2017-11-17); SkyFi on-demand CSV (from Oct 2018) — the no-subscription, order-a-slice model is ideal for episodic evidence. **Test this on 20 known-good demurrage files before building on it.**
2. **Terminal/stevedore operational event timestamps (PortXchange-class).** Direct evidence of whether cargo work *stopped*, from the counterparty's own system record. Rotterdam coverage is >50% of terminals, 90k+ port calls/yr, and explicitly "stores information to perform historical analyses." **CRITICAL [unverified]: is historical data exportable to a third-party auditor, and does an equivalent exist for Piraeus, Singapore, Jebel Ali, Fujairah, Limassol?** This single answer can invalidate the signal for 5 of 7 target ports.
3. **Targeted SAR/optical imagery for 2–4 high-value moments.** "14:32 UTC Sentinel-1 shows no gangway down and zero hatch-cover movement during a claimed 9-hour stoppage" is a single exhibit a tribunal cannot argue with. Use for moments, not timelines — SAR revisit falls short by orders of magnitude. Free/open: Sentinel-1 (20 m), EMSA CleanSeaNet. Commercial: ICEYE, SkyFi SATIM.

### 4.3 Favourable precedent worth knowing

- **EMSA CleanSeaNet / *Maersk Kiera* (2012):** satellite images "may be admitted as **primary evidence** in a maritime pollution prosecution."
- **NY CPLR 4528:** official US weather bureau records are *prima facie* evidence — US jurisdiction only, doesn't extend to ERA5 or Greek/Dutch services.
- **West of England P&I:** *"the SOF is persuasive evidence, it is by no means binding… open for a party to rebut with, for example, **evidence from a local weather station**."* That's your opponent's own club telling them how to beat you — and therefore telling you what you must beat.
- **Station-anchored assets exist and are unglamorous:** KNMI station **343 "Rotterdam Geulhaven"** — a harbour station *inside* the Port of Rotterdam publishing DDVEC/FHX/precip/pressure in CSV/JSON/XML. **No digitised equivalent found for Piraeus** — flag as absent.
- **IMO Compendium (FAL.5/Circ.56, Mar 2026) now standardises meteorological and oceanographic observations** as a dataset. Align your weather schema to it early; nearly free.

---

## 5. Other problems in maritime software this stack solves better

Scored on the four traits that make Keel's architecture fit: **(A)** unstructured documents, **(B)** deterministic contract/regulatory rules, **(C)** external physical-world data, **(D)** money disputes.

| # | Problem | Buyer | Who solves it today | A/B/C/D | Evidence-based size | Defensibility | Our wedge |
|---|---|---|---|:--:|---|:--:|---|
| 1 | **Time-charter off-hire + speed/consumption claims & hire-deduction defence** | Owner (loss control) + charterer (defence) | Thaylen (no disclosed funding); Speedclaim.net (15% contingency, ~100 tanker CP claims reviewed); Miros; Kpler | ✅✅✅✅ | **Kpler: 10% consumption gap at $800/mt VLSFO = $912k/vessel/yr.** Thaylen: $150–200k per claim | High — AIS × weather × CP warranty, matched per vessel-year | **Same engine.** Only new work: NYPE/SHELLTIME 4 warranty clauses + the net-loss vs defined-period off-hire distinction (outcome-determinative per West P&I and 4–5 Gray's Inn Square). Kpler prices TC-in risk pre-fixture — you do it post-dispute. |
| 2 | **Off-spec / off-quantity bunker claims** | Owner, charterer, **P&I club**, bunker trader | Nobody funded. P&I in-house claims teams; surveyors; counsel | ✅✅✅✅ | **Gard: 70+ bunker claims Jan–May 2026, +50% YoY, almost all fuel quality** | Very high — sample custody chain + lab certs + BDN + engine log | **Genuinely open.** ISO 8217 Table 2 compliance is *not* the test — clause 5 fitness-for-use is. That's a rules-engine problem. **GTM must be P&I clubs.** |
| 3 | **Port disbursement account (DA) audit & recovery** | Owner DPA desk + **port agent** + charterer rebill | Marcura DA-Desk (1,800+ rules, 2M port calls); DIABOS; Inchcape OneCape; MagicPort; Metacad | ✅✅✅✅ | **Credit notes on ~4% of DAs, avg $4,300, up to $380,000**; port charges are 20–30% of vessel opex | High — tariff library + rebate history + agent behaviour | Highest volume of the three. **The open flank is the *agent* side** (Marcura owns the owner side): agents carry cash exposure and recover on only ~40% of escalated BIMCO interventions, and the top disputed line items are *document-completeness and SOF-cross-reference* problems — your exact skill. |
| 4 | **OSV/AHTS/PSV standby, knock-for-knob, tide & weather-window delay** | OSV owner, offshore EPCI, oil major | Almost nothing | ✅✅✅✅ | 3,209-unit OSV fleet, **76% marketed utilisation**; Jones Act SOV rates **>$50k/day** | Very high but hard to collect (patchy AIS, bespoke logs) | 4/4 fit, near-zero competition. Long procurement cycles; needs OSV domain learning from scratch. |
| 5 | **Laytime/demurrage — bulk/tanker (home turf)** | Owner + charterer | Veson, Marcura, B&V, Voyager | ✅✅✅✅ | Dry bulk **$8–10B/yr**, 6–8% of freight spend; rates **$15–30k/day** | High, but Marcura is buying it | **Keep as beachhead + reference implementation. Not the growth engine.** |
| 6 | **Port congestion / force-majeure delay claims (Hormuz, canal closure)** | Owner + charterer + trader | Nobody systematic | ✅✅✅✅ | Episodic; Sea rates $1,000→$1,800/FEU transpacific after Jun 2026 | Medium — episodic event data, 2-year cadence | **Open and huge when it fires.** BIMCO's **Virtual NOR / JIT Arrival Clause** (consultation Aug 2026) creates *new* evidentiary standards before anyone has tooling. |
| 7 | **Marine cargo insurance claim adjudication** | Insurer / MGA / broker | ClaimSorted ($13.3M seed, Oct 2025); Hesper AI; Zentis AI | ✅✅✅✅ | Cargo premium **$24.2B** (57% of $42.6B global marine) | High, but buyer's own data | Perfect trait fit, wrong company stage. Insurance sales = 6–12 mo + Lloyd's/FCA overlay + AI Act audit-log obligations. **You will lose to ClaimSorted's balance sheet.** |
| 8 | **EU ETS / FuelEU charterparty cost allocation + off-hire treatment** | Owner / charterer commercial | OceanScore; Navatom; Wärtsilä FOS; Synergy-Azolla CASPER (250+ vessels) | ~✅✅~ | EUA ~€80/t; 70% of 2025 emissions surrenderable Sept 2026, 100% from 2027; Argus launched the first FuelEU pooling spot price 21 Sep 2026 | Medium | Off-hire treatment for EU ETS is genuinely contested and sits *inside* a hire calculation. **Feature, not company.** |
| 9 | **Container D&D** | Freight forwarder / importer | Windward; cargo.one (€17–20M, Mar 2026); Unwaived; Last Rev; Flexport MCP; Shipsy Vera | ✅✅~✅ | **$15.4B collected by 9 carriers, Apr 2020–Mar 2025 (FMC primary source)** — dwarfing all vessel demurrage | Low-medium — Windward owns the data | **NOT RECOMMENDED.** 46 CFR 541 has been live since May 2024; §541.5 strips the obligation to pay a non-compliant invoice; recovery is already table stakes. |
| 10 | **Sanctions / dark-fleet DD** | Bank, trader, insurer, P&I | Windward, Kharon, Sayari, Zerodock, **Quartermaster ($140M, Sep 2026)** | ✅✅✅~ | Windward Q2 2026: 2,157 vessels with prolonged dark activity, 7× QoQ | Very high | Weak on **D** (compliance exposure, not money dispute). Data-sensor business, not rules-engine. Capital-intensive. |
| 11 | **Port State Control detention appeal** | Manager / owner / charterer | RightShip (85%-accuracy detention prediction) | ✅✅~✅ | 74,000+ PSC inspections, 9,700+ days lost (2024) | Medium — RightShip owns the corpus | Mostly *preventive*, not adjudicative. Wrong problem shape. |
| 12 | **S&P / vessel valuation** | Owner, bank, lessor | VesselsValue (76,000+ vessels, 100,000+ transactions) | ~ | — | Very high | **Poor fit** — it's a regression problem, not a document+rules+evidence problem. |

### 5.1 Top 3 recommendations

**#1 — TC off-hire & speed/consumption claims.** Highest leverage because it is *literally the same machine*: clauses → deterministic day-count against exceptions → cited inputs. Only new code is the performance-warranty and off-hire clause sets plus the but-for concurrent-cause test. You already have the weather fixture. The business insight: **owners claim up and charterers defend down the same underperformance** — a 2-person team can't referee both, so go **side-pure** (charterer-side defence dossier). Note the constraint: speed claims and off-hire claims are **mutually exclusive** (Kasi, MLB 9/2021). *Risk: you must own or license high-frequency AIS — public feeds lose vessels for 12+ hours mid-voyage, which destroys the speed-over-ground profile.*

**#2 — Bunker quality claims (outside demurrage).** Four traits, perfect; most genuinely open; best defensibility (sample custody chain is documentary and compounds per claim). **Only viable GTM is through P&I clubs** — Gard publishes a bunker claims report twice a year; that report is your lead list. Honest weakness: low frequency per owner.

**#3 — DA / port-cost recovery.** Highest volume, proven ROI model you can cite without inventing anything, same evidence plumbing. Go at the **agent side**, not the owner side (Marcura owns the owner side).

**Where to find these buyers (not conferences):**
- **BIMCO Maritime Operations Academy, Athens, 17–20 Nov 2026 (€2,205)** — syllabus explicitly covers off-hire disputes, hire deductions, speed and performance claims. This is your buyer list.
- **Asdem Athens Tanker Conference, 22 Oct 2026 (€1,400)** — one paper is literally *"AI along the demurrage claim — where the money leaks."* Asdem London Jan 2026 had a **Time Bar case-study workshop to help parties handle claims in-house.**
- **Gard / P&I bunker claims handlers** for #2; **International Bunker Conference (IBC 45), 19–21 May 2026, Oslo–Kiel** — deliberately capped, small, senior, "not a generalist event."
- **FONASBA congress** for #3 — the most concentrated room of port agents anywhere. Their **Code of Conduct for Ship Agents** is the rulebook your engine would encode.

---

## 6. Technical moat: what an expert will find in your code first

I read the code. Five findings, in the order a reviewer will find them.

### 6.1 🔴 Your headline number comes from a cache, and the retry loop is a no-op

- `pipeline_agents.py:88-91` and `:102-105` — workers return `extracted_*.json` **if it exists**.
- `pipeline_agents.py:243-248` — on validation failure the graph routes back to `cp_worker`, which **re-reads the same cache** and returns byte-identical output.
- `pipeline_agents.py:150-153` — the vessel-name consistency check the README advertises as the multi-agent value proposition is literally `pass # can add soft warning`.
- `pipeline_agents.py:163` — `retry_count: state["retry_count"] + 1` increments on **every** validator pass including successful ones, so a clean run burns retry budget for free.

**The consequence: `$112,000` flows through a JSON cache, not through the LLM, and the validator loop is structurally incapable of changing the result.** This isn't a bug to patch — it invalidates the README's thesis as currently demonstrated, because the thesis is *"retry with feedback improves extraction"* and the implementation *cannot demonstrate it*. **Fix this before anything else in this report.**

### 6.2 🔴 "Validator + retry" is a 2023-era answer, and the naive version is now known to be harmful

- **A validator fed the agent's own conclusions is an anti-pattern.** An audit layer reading agents' own reports localised the true fault origin **4.1% of the time — below uniform guessing (20%)**. Deleting the field carrying the agent's own conclusion raised accuracy to 45.2%. *"An accountability layer needs evidence sufficiently independent of the conclusions it verifies."*
- **Multi-model diversity does not fix it.** Four independent GPT-4o instances agreed on the same wrong answer **56%** of the time vs 0.4% predicted under independence (140×). A 3-family replication: 55% three-way agreement, p=0.41 — statistically indistinguishable from same-family.
- **Self-correction often degrades accuracy without external feedback.** GPT-5 *loses* accuracy under self-correction. The stability threshold is Error-Introduction-Rate ≲0.5%; iterate only when `EIR/Acc > 1/(1−Acc)`. At high accuracy the threshold can sit *below* baseline accuracy, making all self-correction harmful.
- **Consensus ≠ verification.** In "majority-wrong" regimes majority voting scores **0% by construction**.

**Your validator and your workers share a model family, a prompt, and a context.** The expert's question — "what is *independent* about your validator?" — currently has no answer.

### 6.3 🟠 Five free fixes with measured effects

| Fix | Measured effect |
|---|---|
| **Re-label the validator's input as an external artifact** — keep the extracted record byte-identical, change only *who appears to have written it* in the chat template | Explicit-correction rate **+23–93pp** across 13 model-domain cells, 10 with p<0.001. Prompt-structure-only, costs nothing. |
| **Deterministic domain validators instead of a rubric.** IMO check digit; IMO↔vessel name↔voyage three-way join; UN/LOCODE resolution where lat/lon must match the *named* port (your current check is `-90..90 / -180..180`, which catches typos and not substitutions); chronological monotonicity with declared timezone; `NOR − arrival_at_discharge_port ≤ 0`. | Highest-yield checks are mechanical and fail loudly. |
| **Add negatives + support counts to every eval.** In a frozen-checkpoint audit of CUAD: **82.2% span recall at 8.2% precision**, and only **9 of 41 categories have ≥30 positives and ≥30 negatives**. Two categories had *no negatives at all*, making their FP rate undefined. | Report **precision and recall separately, never F1 alone** — F1 hides a 45% FP rate behind a healthy-looking number. |
| **Cheapest citation check: resolvability.** Is `source_id` a member of the *retrieval log*, not the model's own list? A set-membership join costing microseconds that kills fabricated citations dead. | Your `extractor.py:124` instructs the model to emit `[0.0, 0.0, 0.0, 0.0]` "where not available" — **a silent null-bbox channel indistinguishable from a real citation.** A citation that can be silently fake is worse than no citation. |
| **Make layout diversity a first-class eval axis.** Same model, same record count, same compute: in-distribution **100%** → 5-layout adversarial split **77.3%** (terse 51.6%, **tabular schema compliance 0%**). Re-rendering the *same records* across layouts → **99.6% (+22.3pp)**. | *"The data diversity was the load-bearing variable, not the architecture or the training regime."* Table rotation destroys recognition across every model (PaddleOCR 74.3 → 23.3 TEDS). |

### 6.4 🟠 Your eval story is one canonical number

`test_canonical.py` asserts $112,000. That is a unit test, not an eval harness. Recommended: **250–400 document-level cases**, minimum 40 per stratum (born-digital CP 50 · scanned SOF 50 · faxed/3rd-gen carbon SOF 40 · rotated 30 · handwritten amendments 40 · stamps over printed fields 20 · multi-page packets 20). Anchors: *"53 cases catches large regressions; subtle drops (≤5pp) need 200+"*; a 4B model fine-tuned on CUAD plateaus around **408 contracts**.

**Gate mechanics:** four verdicts (`PASS` / `REGRESSION` / `INCONCLUSIVE` / `INFRA`) with non-zero exits. Noise floor **measured** via Student-t intervals over k≥3 runs, not assumed. Critical slices hard-block regardless of statistics — for you: schema validity, `string-not-in-input` violations, port resolution, monotonic chronology, and the canonical end-to-end dollar total as its own slice. **Deterministic scorers gate; the LLM judge is advisory and never flips the verdict** (a judge scored a decimal-shifted summary 93, above the faithful candidate).

**The best adjacent pattern to copy: CLAUSE** — perturbation-based adversarial suites. Take your golden CPs and *inject* the anomaly classes your validator should catch. Cheapest possible red-team for a consistency validator.

**The honest nearest comparator:** Claude Sonnet 4.5 scored **92.4%** on 18 bill-of-lading fields and failed one field in **183 of 200** documents — frontier model, clean PDF, one redundant spec field, ~8% silent failure. That is the real shape of this problem.

### 6.5 🟠 Small domain fine-tune beats frontier zero-shot on structured extraction — published in your exact domain

Fine-tuned Llama-3.1-8B: **99.6%** field accuracy vs Claude Sonnet 4.5 **92.4%**, Gemini 3.1 Flash Lite 91.9% — **18× cheaper, 45× faster**. Coupled with §6.3's layout-diversity result, this is the clearest evidence that **your eval set is the moat you are closest to**, and you currently have one synthetic fixture.

### 6.6 🔵 What an expert will think is naive

- **"LLM never calculates" is presented as the differentiator. It's table stakes, and it's the weakest part of your claim.** A 2023 practitioner already knew not to let GPT-4 do arithmetic. The 2026 framing: *every emitted value is a typed selection from a catalog bound to a verbatim source span, and a deterministic core materialises it.* **"Numeric answers are the weakest link everywhere"** — as of Aug 2026 SAP, Microsoft, NetSuite and Salesforce all ship citations that resolve to knowledge content; none ships a mechanism binding a figure to the transaction behind it.
- **`pages[0][:1000]` "preview" strings in `orchestrator_node` are dead state** — workers ignore them and re-parse.
- **`pdfplumber_parser.py:36-39` falls back to the whole-page rectangle** for cell bboxes; the code comment promises a word-level search that doesn't exist.
- **Text-layer-only parsing for documents that are often faxes.** `pymupdf_parser.py` calls `page.get_text("text")` and nothing else. On the scan/fax strata your 12K truncation and 1K preview will silently drop events. Note: on document QA, **OCR pipelines beat direct-VQA (0.562 vs 0.498)**, and VLMs err by *rephrasing* (semantic cosine 0.946) while OCR errs by *character substitution* — **use both**. Also: "newer = better" is false — Mistral OCR 3 underperformed Mistral OCR 2 by 23.3pp on DocVQA.
- **Zero occurrences of `confidence` in `keel_api/`.** No confidence field, no routing, no review queue, no abstention, no correction capture. EU AI Act Art. 14 requires oversight measures that address automation bias *by name*.
- **Self-reported LLM confidence is not a probability.** Self-confidence >90 on ~80% of outputs, wrong on ~25% of those; reliability diagram **flat at ~75% across every bucket 60–99**. A flat reliability diagram means any threshold routes near-random errors to humans. Use ensemble disagreement (3–5 samples) + a retrieval-grounding check instead, and report **coverage at a fixed error rate**, not accuracy.

### 6.7 Architecture verdict

**Zero occurrences of `confidence`, a validator with no independent input, and a retry loop that cannot change the answer** is not an architecture. It is a fixture harness wearing an architecture.

The 2026 defensible reliability layer is six components, ordered by return:
1. **The never-generate-a-number contract** — model emits `{field, raw_span_text, page, bbox}`; a deterministic normaliser materialises values.
2. **Deterministic domain validators** (IMO check digit, UN/LOCODE, chronology, NOR invariants) — failing loudly.
3. **Validator input relabelled as external artifact** — free, measured, +23–93pp.
4. **Server-written, hash-chained provenance** with `origin: structured | generated`, plus a test asserting every monetary figure is covered by a claim with evidence and that the stated total equals the sum of the records it cites.
5. **Offline-calibrated confidence** (reliability diagram before you build the gate) with learning-to-defer abstention.
6. **A closed loop that can actually change the answer** — the retried worker receives the *specific violated invariant* plus the candidate spans, and re-execution cannot be a cache hit.

**On LangGraph/CrewAI/AutoGen/ADK, multi-agent orchestration, structured-output extraction, and VLM document parsing: all commodity in 2026.** LangGraph is the right low-churn choice (1.0 Oct 2025, no breaking changes until 2.0) but is not a differentiator. Stop selling it.

---

## 7. Regulation: mostly a compliance tax, with three real exceptions

### 7.1 Your AI Act timeline premise is out of date

**Regulation (EU) 2026/1744 (Digital Omnibus on AI)** entered into force 27 July 2026 and replaced Art. 113(c): **Annex III high-risk obligations now apply from 2 Dec 2027** (not Aug 2026); Annex I from 2 Aug 2028. Art. 50 transparency applies from 2 Aug 2026. **You have 16 months and the classification guidelines are still draft** (published 19 May 2026, consultation closed 23 July 2026). [Verified via Commission AI Act Service Desk + Gibson Dunn/Freshfields/Pollicino briefings; **the OJ text of 2026/1744 was not read directly — confirm before citing in a board paper.**]

### 7.2 Classification verdict

Annex III 8(a): *"AI systems intended to be used by a judicial authority or on their behalf to assist a judicial authority in researching and interpreting facts and the law…, **or to be used in a similar way in alternative dispute resolution**."*

Categories 1–7 are closed to you (creditworthiness of natural persons; life/health insurance risk). **Category 8 is genuinely contested:**
- **Narrow (you're out):** the ADR limb means the same *kind* of system used by the same *kind* of actor. *"An AI tool used solely by a law firm for its own litigation strategy, with no output reaching or directly informing a court or arbitrator, is less likely to fall within point 8(a)."*
- **Broad (you're in):** your *declared intended purpose* is to produce a counter-claim position asserted against an owner. Arbitration produces a binding award, so Recital 61's "legal effects" test is met. The scholarly view (EJRR) is that 8(a) *does* capture commercial arbitration and that this is unintended — which concedes the default is **in**.

**Human-in-the-loop does not save you:** "human involvement has no effect on the classification," because classification turns on *intended purpose*. And the guidelines say a system "intended to produce a specific recommendation or evaluation of a case… may play too decisive a role to qualify as preparatory." **Your product's stated purpose is exactly that.**

> **Verdict: plan on Annex III 8(a) being arguable and Art. 6(3) being your actual defence. Do not plan on the narrow reading holding.**

Three levers, in leverage order:
1. **Confine AI to extraction and clause classification; keep the monetary determination in the deterministic state machine.** *(The "deterministic engine is not an AI system" argument under Art. 3(1) is unverified — the Commission's own guidelines treat transcription/classification as in-scope AI functions, so the extraction layer will likely be the AI system. Verify before relying on it.)*
2. **Reframe intended purpose to 6(3)(a) narrow procedural task.** "Transforming unstructured into structured data, classifying documents into predefined categories" qualifies; "systems that rank, score, or label inputs as 'useful' or 'less useful' for a human assessment go beyond a purely procedural role." Position the engine as producing **the clock and the citations**; position a named human as producing **the position**.
3. **6(3)(b): improve a previously completed human activity** — "must not be intended to provide a materially different result from the one previously reached by the human." This fits a **verification/checking** product (did the signed SOF support the claimed hours? did the CP actually contain WWDSHEX?) far better than a first-draft product. **And it is the product most likely to survive contact with a tribunal.**

Cost of getting it wrong: Art. 99(4) up to **€15M or 3% of global turnover**. Mitigating: Art. 43 conformity assessment for Annex III is **internal control** (no notified body) — it's documentation and engineering discipline, not third-party certification. **Art. 27 FRIA does not apply** to you or your customers.

**Action: write the Art. 6(3) classification memo now and register it under Art. 49, while the guidelines are still draft.** This is the highest-leverage € you can spend.

### 7.3 Three blockers, three moats

**Blockers:**
- **B1 — Losing the 8(a) argument with no documented Art. 6(3) self-assessment ready.** Survivable, but not as an afterthought.
- **B2 — No licensed BIMCO Holiday Calendar.** ITIC's shipbroker loss-prevention sheet documents a broker who told an owner the Algeria weekend hours ran "1700 Thursday to 0800 Saturday" when the BIMCO calendar said 0800 Sunday — **a 24-hour error that settled at US$25,527 in demurrage**. That is your entire thesis, resolved against the professional in one paragraph. BIMCO's Holiday Calendar API is **not public** — membership/SmartCon tier/approved relationship only. Free-download BIMCO forms carry Conditions of Use forbidding derivative reproduction for your own drafting. **This gates the product, not the reverse.**
- **B3 — DPF collapse.** *Trump v. Slaughter* (29 June 2026) overruled *Humphrey's Executor* and removed the FTC-independence premise underpinning Decision 2023/1795. NOYB demanded repeal 30 June 2026; EDPB asked the Commission to assess 31 July 2026; *Latombe* (C-703/25 P) still before the CJEU. **Mitigation: EU/UK-region storage from day one, SCCs with automatic fallback cascade, refreshed TIAs.** Also watch MARAD 2026-007 (LOGINK/Nuctech biometrics + PII + geolocational metadata access) — you ingest CPs and SOFs full of UBO chains, ports, cargo origin and certificates of origin, which is precisely that dataset class.

**Moats:**
- **M1 — A published, versioned, arbitration-cited rule codification corpus.** Every rule carrying (a) the clause text or licence reference, (b) an LMAA/SIAC award construing it, (c) a changelog showing how the rule moved when case law moved. This is precisely what BIMCO's Aug 2026 position concedes AI cannot replicate: *"consultation across the industry, scrutiny by experts, consideration of insurance implications… and approval by the Documentary Committee."* **Tribunals decide on authority, not ISO certificates. Nobody in the field publishes this.** It is also simultaneously your best AI Act 6(3)(b) argument and your strongest LMAA ¶12 expert-evidence position.
- **M2 — Licensed BIMCO data + authenticity verification.** The incumbents advertise **BPVOY4 and SHELLVOY6 — which are not BIMCO forms.** Nobody we can see holds a licensed, current BIMCO clause-and-holiday corpus. And BIMCO's **Contract Authenticity Clause** (which warrants use of "an Authentic BIMCO Template procured from a properly authorised source," with a free verification tool at sc.bimco.org/verify) needs exactly this service. **You'd be aligned with BIMCO, not competing with them.**
- **M3 — eBL-native, DCSA/Compendium-aligned evidence chain.** NL recognises eBLs from Jul 2026; PRC Provisions effective 1 Sep 2026; **IGP&I-approved DCSA Standard Annex v.2 live across five platforms since 4 Jun 2026**, enabling eBL transfer in jurisdictions with *no* eBL legislation. As the substrate migrates from paper SOFs to transferable electronic records whose legal force rests on **control and integrity**, provenance becomes legally load-bearing.

**Don't build GTM on ISO certification.** Marcura is ISO 27001 audited by Lloyd's Register plus 9001/14001/45001; B&V cites 18,155 validated calculations; Greywing says "source-traced. audit-ready"; laytime.com says "supports arbitration." **Already claimed.** The real procurement signal is already visible in the incumbents' own copy: *"the AI does the data entry, human-in-the-loop specialists do the judgement"* and *"nothing is sent without a person signing it off."* Buyers want **defensible provenance and a named human** — which is conveniently also the posture that survives Annex III 8(a).

**BIMCO strategy: pursue partnership, never endorsement.** The Technology Partnership Programme states "membership does not imply BIMCO's endorsement of any product." Using their name to imply validation is a repudiation risk. Do join the Technology Partnership Programme, pursue a Holiday Calendar + clause licence, join the **Agentic Contracts Advisory Board** (with Hunit, Apr 2026), sign the Shared Principles declaration (Mar 2026, free, explicitly a leadership-signalling instrument), and **position as an authenticity/verification layer, not a drafter**. And note BIMCO's own survey: **25% of Documentary Committee members have already encountered AI-drafted clauses** — the demand is real and the fear is documented.

---

## 8. Market economics and GTM

### 8.1 🔴 Your PRD's core statistic is refuted as stated — delete it

PRD line 31: *"Industry estimates suggest 5–10% of total demurrage value is written down due to contract-term ambiguity."*

**The actual Marcura source says:** *"Charter party ambiguities account for 5–10% of **total demurrage write-downs** across the industry."*

Three fatal differences: **wrong denominator** (write-downs ≠ total value — off by ~10×); **the denominator is undefined** (no methodology, no sample size, on a vendor marketing page authored by a VP of Sales); and **you are citing your competitor's marketing copy**, on the same page that pitches Marcura and reports Marcura's own 7–8% spend reduction. An investor who does five minutes of research will find this.

**Worse — it contradicts your own demo.** If the best-in-class managed service (Marcura, 100+ human specialists) achieves **7–8% total demurrage spend reduction**, and clause ambiguity is only 5–10% of *write-downs*, then your **$187K → $112K = 40% swing is not credible against an industry benchmark of 7–8%.** A $187K claim's realistic recoverable delta is **~$9–15K, not $75K.**

**Replace it with properly sourced numbers:**
- Dry bulk demurrage **$8–10B/yr**, 6–8% of freight spend; dry bulk vessel rates **$15–30k/day** (Marcura).
- **~45 discrete steps** per claim; **~75% of analyst time is administrative**; 99% of SOFs still processed manually (~12M hours/yr).
- **~15% of fixtures carry contradictory NOR↔cargo clauses** (Marcura sample, n undisclosed — label it).
- **LMAA took ~2,100 maritime references in 2025** (+16% YoY, all-time high); Singapore 168; SIAC 886 new cases / US$14.53B in dispute.
- **P&I FD&D: 75% resolved by club claims handlers without external counsel** (Steamship Mutual). Deductibles $10k–$75k per dispute; London P&I up to $7.5M/claim.
- **IG P&I net claims 2024/25 = $3.1B, +25% YoY**, on $3.96B premium.
- **Container D&D: $15.4B collected by 9 carriers, Apr 2020–Mar 2025** (FMC primary source) — a much better-documented pool than vessel demurrage.
- **LMAA Small Claims Procedure: £5,000 fixed fee, £6,000 recoverable-cost cap.** Cost of getting it wrong exceeds cost of the tool by 10×.

**NOT FOUND — do not use:** % of ships finishing inside laytime; % of port calls incurring demurrage; average vessel demurrage dispute size; % settling vs arbitrating; number of demurrage analysts. **Also: Veson's "$5–15K/mo" is unsourced — there is no public price list.**

### 8.2 Bottom-up math

| Line | Value | Basis |
|---|---|---|
| Global vessel demurrage pool | **$9B/yr** (floor — dry bulk only, excludes tanker/gas/chemicals) | Marcura; cross-checks to 6–8% of $168.5B dry bulk |
| Recoverable by better audit | × **4%** (deliberately below both vendors' claims of 7–8% and 5%) | conservative |
| Software capture | × 20% | assumption |
| **TAM** | **~$72M/yr** | vs PwC: entire maritime software market $1.8B (2023) → $2.9B (2028) |
| **SAM** (English, voyage-charter bulk/tanker/gas) | **~$18M/yr** | assumption |
| **SOM at your pricing** | 5 customers = **$150K ARR** = 0.8% of SAM | |

**The 1–2% success fee is structurally wrong at this deal size.** A customer with $2M/yr demurrage spend has ~$80K/yr of recoverable value; a 1% fee is **$800/yr** — you'd pay more in sales cost than you collect. **Drop the success fee, or make it a minority add-on for large enterprise deals only.** (Note Demurrage.IA already charges 20%, so success-fee positioning isn't differentiated anyway.)

### 8.3 🔴 Your wedge already exists as a human service, and the software is closing in

| Who | What | Threat |
|---|---|---|
| **Burmester & Vogel** | "**Discrepancy Discoverer** — upload your calculation *and the counterparty's*. Engine aligns port events, compares allowances, flags every difference with the CP clause." 18,155-calc validation. JSON:API published. | **Your product from the owner's side.** |
| **DryNor Maritime** (Copenhagen) | "Owner presents a demurrage claim → time sheets arrive with a claim attached. **DryNor reads them the way an operator would, prepares the counter calculation and takes the matter to settlement.**" External charterer-side desk, SLA-based. | **Your exact wedge, done manually, per case.** |
| **Maritime Claims Consulting** (Houston) | "**No upfront cost. Performance-based model.** Fee = savings *not previously identified*." Attorney-backed + AI claims software. | Owns the contingency-fee positioning. |
| **Greywing** (Singapore) | Proteus: free SOF extraction with source-line citations; "account creation happens **after** you've seen it work." | Owns the free-until-proven top of funnel. |
| **Chartera** (Singapore) | Free public laytime calculator, AI "teammate" for maritime commercial desks. | Free layer + APAC. |

**The defensible gap is narrow but real:** nobody ships a *charterer-side, adversarial, single-player audit with cited counter-positions* as a product. B&V's Discrepancy Discoverer assumes you already have your own calculation. DryNor does it by hand. That gap closes if B&V ships counter-party mode, or a Greek SME does DryNor with an LLM.

### 8.4 🔴 Posidonia and SMM are both past. Next editions are 2028.

- **Posidonia 2026** ran 1–5 June: 2,227 exhibitors, 35,000+ visitors, 24 pavilions, ~70 conferences, 30+ AI exhibitors. **Next: Posidonia 2028, 5–9 June 2028.**
- **SMM 2026** ran 1–4 Sept: 50,000 visitors, 2,300 exhibitors. **Next: 5–8 Sept 2028.**

**A 2-person team must not spend a euro on a 2026–27 conference booth. The 12-month window contains no marquee ship show.** Relevant remaining events: ShipTek Singapore (6 Oct 2026), Marine Money Oslo (15 Sep 2026), Oslo Ocean Days (9–10 Sep 2026, new), BIMCO Maritime Operations Academy Athens (17–20 Nov 2026), Asdem Athens Tanker Conference (22 Oct 2026), IBC 45 Oslo–Kiel (May 2027), SIL Barcelona (Jun 2027).

**The demurrage-specific event belongs to your competitor:** Voyager Portal's **Demurrage Innovation Forum** (Houston Apr 2025 → Singapore Nov 2025 → Mumbai 21 May 2026, 80+ per edition, free but limited seats). Norton Rose Fulbright spoke on it.

### 8.5 The one channel to start

**▶ Performance-fee co-delivery with charterer-side advisors — starting with DryNor (Denmark) plus 2 direct Greek/Cypriot SME pilots.**

- Only channel with a **3–6 week** cycle; no Veson displacement, no 6–18 month IT procurement.
- DryNor/MCC/Demurrage Desk have **already proven the wedge is worth buying** — they just do it manually at 10–40 hrs/case. You're 10× cheaper, not asking anyone to change a habit.
- Success-fee-only kills the "why do I need a new system" objection entirely.
- It produces **case studies + a settled-claim corpus** — the two things every year-2 motion requires.

**Named channel candidates:** DryNor Maritime (Copenhagen) · Maritime Claims Consulting (Houston) · Demurrage Desk / InceDemurrage (BE — the law+consultancy+tech template for this exact product, live since 2022; Jean-Paul Dezutter lectures at BIMCO/IFCHOR/Cambridge) · Interlloyd Averij (Rotterdam, Lloyd's Agent for NL, own Recovery Department) · Timagenis Law (Piraeus, Chambers Band 1 Greece) · Watson Farley & Williams Athens (built the Piraeus disputes team 2024, represents IG P&I Clubs) · Norton Rose Fulbright (the only major firm publicly theorising about AI in demurrage — Partner Utsav Mathur, Head of AI Chuck Hollis) · Signal Ventures (Athens/London/Singapore; owns Signal Ocean + tanker pools; best investor *and* best warm channel) · HMC/ICS Greek Branch (ran a 3-day Laytime & Demurrage seminar Apr 2026 for exactly your persona — co-teach for a referral list) · Greywing (APAC referral).

**First 10 pilot targets:** DryNor Maritime (Copenhagen) · **Albatros Management** (Piraeus, ~100 vessels/yr, has a dedicated `cpdesk@` charter-party desk, board member of Hellenic Shipbrokers Association) · **Mastermind Shipmanagement** (Limassol, ~20 MPP/bulk/cement) · **Timagenis Law** (Piraeus) · **Interlloyd Averij** (Rotterdam) · **Centurion Bulk** (Singapore — has a named "Global Head of Operation, Laytime and Legal/Claims", i.e. a motivated champion) · **Dadaylilar Shipping** (Istanbul, est. 1875, family-owned = fast decisions, job descriptions publicly include charterparty disputes with P&I clubs) · **Aries Bulk** (Copenhagen, est. 2023, explicitly says "we believe technology holds the key to process efficiency") · **Atlas Bulk/Metis Shipping** (Istanbul, 48–120 claim events/yr, pure SME) · **Iona Shipmanagement** (Limassol).

**12-month revenue model:** ~€96–110K ARR-equivalent, Month-12 MRR ~€14,400 (8 orgs), assuming 5% freemium→paid conversion, ~600 free audits/yr, €1,800/mo org or €900/claim + 10%. **Flag:** the model needs ~600 free audits — your architecture matters more to this number than any GTM choice. *(No logistics-specific PLG conversion dataset exists; all benchmarks above are general B2B SaaS. Directional only.)*

### 8.6 Avoid

- **Free laytime calculator → PLG as the primary motion.** Saturated (8+ tools: TheCharterBox, Greywing, Chartera, ShipCalculators, MetaCAD, themaritime.net, ShipSearch, balticdryindex, Heisenberg). Freemium median 4.5–5%, and B2B freemium without a viral loop is a support cost. **Keep freemium as a qualification gate**: free → upload the owner's claim → get the *discrepancy list* → paid → get the *counter-position and letter*. Card-required 14-day trial (30% conversion vs 17%).
- **Veson IMOS displacement** in year 1 (>70% of Veson clients already integrate 3rd parties → partner, not rival). Year-2 play.
- **Open-sourcing the engine.** OpenFOAM is the governing negative: €250k/yr maintenance funding against "hundreds of millions" of commercial revenue, and the 2025 campaign **failed, down 2%**. Open-source only the *neutral* WWD/SHEX/SHINC evaluators — they're publicly specified anyway and make your threshold decisions auditable by anyone. That's a trust argument, not a distribution strategy. **Keep the adjudication engine and outcome corpus closed.**

### 8.7 No 2025–26 maritime AI funding was found

Searched Eightfold, Tiger Global, Alibaba, DP World, MSCE, Southvest, Spartan, Inmar, Blue Cube, Maris, Seed Capital, Horinvest, Boreal, Z Capital: **no 2025–26 maritime claims/logistics AI rounds found. Do not plan on any of them.** Largest verified Greek maritime-AI round in 2026 is **€500,000** (Corallia → Neptune Zero, May 2026). Your realistic Greek pre-seed is **€300K–€1M**, not €5M.

---

## 9. The product-shape question: app, API, or data layer?

**Verdict: staged — app first, one component API second, data product conditional on a trigger.**

- **You cannot win as a data layer.** Kpler owns the AIS layer (13,000+ receivers, archive to 2010, MCP endpoint, Cloud DB partner program) with **no public price list**. Clarksons ToS **explicitly prohibits generating derived data**. Sea-Intelligence prices 12-month services in the low thousands. **eBL is ~11% and covers container bills, not charterparties or SOFs.**
- **The structural blocker on a corpus:** **BIMCO Energy Efficiency Data Sharing Clause 2025 defaults to shared voyage data *not* being usable to support claims against owners.** The corpus may physically exist and still be contractually unusable for your exact purpose. This likely kills a "buy an outcome corpus" path regardless of whether a seller exists.
- **The one verified platform precedent points away from API-first.** BlackRock Aladdin = **$2B technology/subscription revenue (2025)**, and it *began internal as a single-workstation risk tool, then externalised*. The lesson is "become indispensable infrastructure for named institutions," not "become an API."
- **The likely shape of your exit** (from the Robin AI precedent): a 2-person team that hasn't chosen ends up choosing for a **3.9× profit multiple**.

**Staged plan:**
- **Stage 1 (0–9 mo): app, deepen.** Sell audits. Build the corpus nobody else has — each adjudicated case is a labelled (clause × SOF facts × weather → verdict) row. *Trigger:* 60 audits completed, ≤1 human intervention per audit on the state machine.
- **Stage 2 (9–18 mo): one component API, not a data API.** `POST /adjudicate(charterparty, sof)` → laytime + WWD verdict + audit trace. Sold to chartering/S&OP platforms that hold the documents but have no calculator. They keep the document store; you're the calculator called inside their workflow. *Trigger:* 3 signed integrations where the customer explicitly wanted you *embedded*, not merely linked.
- **Stage 3 (18 mo+, conditional): data product.** Only if the corpus survives the BIMCO clause question and 2+ counterparties ask to buy it. *Trigger: a third party pays for the corpus without being nudged.* **If nobody pays by month 24, kill it** — that's the OpenFOAM outcome arriving early and cheaply.

**Three "system of record already has this" risks, and insulation:**
1. **Port community systems become the authoritative port-call clock.** Insulate: position as a **consumer** of port-call event streams, never a competing system of record. If PortXchange grants third-party historical export, integrate at Stage 2; if it doesn't, that's evidence port operators intend to be the system of record.
2. **P&I clubs and claims handlers already have internal demurrage tooling**, and the outcome corpus exists — it's just private and used against *you* if you claim to have it. Insulate: sell to the side of the dispute that has nothing — charterers, brokers, P&I-less operators — and if you ever sell to clubs, position as **expert-witness infrastructure** (trail, reproducibility, defensibility), never as a competitor that profits from claim volume.
3. **Chartering/document platforms normalise CPs and SOFs natively; your input path is a PDF upload, which is structurally inferior.** Insulate: never compete to be the document store. Your product is the **deterministic verdict and the audit trail**, both of which survive the loss of the ingestion layer — and arguably get stronger computed over someone else's already-normalised records. **This is the honest reason the API is a co-opting move.**

---

## 10. Ranked actions

**Do first (weeks):**
1. **Fix the cache/retry no-op in `pipeline_agents.py`.** Delete the cache branch or make the retried worker receive the violated invariant and be unable to cache-hit. Nothing else in this report matters if your headline demo can't execute its own thesis. Also fix the `retry_count` increment and implement the vessel-name check you advertise.
2. **Verify the GitHub `laytime-calculator-pro` MCP server.** If a free agent-callable laytime engine exists, your build-vs-partner calculus changes.
3. **Delete/rewrite PRD line 31.** The 5–10% claim is refuted as written and it cites your competitor's marketing copy.
4. **Rebuild the canonical fixture on a realistic delta** (7–8%, not 40%), and keep a separate clearly-labelled "worst-case weather dispute" scenario for the demo.
5. **Write the Art. 6(3) classification memo and register it under Art. 49** while the guidelines are still draft. Contact BIMCO (`contracts@bimco.org`, `innovation@bimco.org`, `gh@bimco.org`) about a Holiday Calendar + clause licence and the Agentic Contracts Advisory Board.

**Do next (30–90 days):**
6. **Get 3 real disputed claim files** (with real outcomes) from DryNor / Timagenis / Interlloyd. This is the gating input for everything — the market researcher, the moat thesis, and the eval set all depend on it.
7. **Build the eval harness** — 250–400 cases across 7 strata, layout-diversity as a separate axis, precision/recall with support counts, CLAUSE-style perturbation injection, four-verdict CI gate with a measured noise floor. Start from `test-cases/`.
8. **Reframe weather as SOF credibility assessment**, and test the AIS heading/ROT signal on 20 known-true weather stoppages before building anything. Ask PortXchange one question: is historical Synchronizer data exportable to a third party, at what price, and for which ports?
9. **Fix FHEX** in `state_machine.py:44` (it excepts Sunday for both SHEX and FHEX) and land content-based document routing + fail-loud on scanned PDFs. Both are small and both are credibility-destroying if found.
10. **Email DryNor, Timagenis, Interlloyd, Albatros, Mastermind, Aries Bulk** with the $112K scenario as the sales asset. Performance-fee only. Don't spend on conferences.

**Do in 6–12 months:**
11. Start the **adjudicated outcome corpus** as the company's primary asset and primary metric.
12. Fix the reliability layer in §6.7 order — never-generate-a-number, deterministic validators, relabelled validator input, server-written hash-chained provenance.
13. **Decide: company or 4–8 quarter option.** Write the acquirer's memo (B&V / Marcura / Voyager / Chartera) while you still have leverage.

---

## 11. What I could not establish

- **Two of ten research agents hit search-provider rate limits (HTTP 429) and returned no usable output.** Competitor landscape and legal-AI landscape were re-run under tighter budgets; the legal-AI re-run succeeded fully, the competitor re-run was rate-limited again. **Competitor facts in this report therefore come from other agents' corroborated retrievals (Marcura, B&V, Veson, Voyager, Greywing, Demurrage.IA, Chartera, BIMCO, DryNor, MCC, MarineFlow) rather than a dedicated competitor sweep.** Rows for MarineFlow AI and Chartera are thin.
- **Burmester & Vogel headcount is contradictory** (13 per PitchBook, 45 per Dealroom; "1,000+ customers" vs "150+ global clients" on their own site). Unreconciled.
- **Veson's cumulative claims figures are internally inconsistent across their own pages** (950,000 claims/$24B vs 1.1M claims/>$71B). The 3× jump in dollar value in two years is implausible. Ask Veson directly.
- **Marcura funding, valuation, revenue, headcount: undisclosed.** Prices your most likely acquirer — worth chasing.
- **PortXchange historical export rights** — unverified. Could invalidate the terminal-ops-evidence signal for 5 of 7 target ports.
- **Whether marine PI underwriters will write E&O for an AI determinator** — no evidence either way. Also unresolved: whether your output is legally "advice" creating a duty of care, and to whom. **Genuine legal-research gap.**
- **Regulation (EU) 2026/1744 OJ text not read directly.** Verify Art. 113(c) as replaced before citing in a board paper.
- **AI Act Art. 3(1) definition of "AI system" not read directly** — the "deterministic engine is not an AI system" lever is unverified and probably narrower than it sounds.
- **No source found** for: % of ships finishing inside laytime; % of port calls incurring demurrage; average vessel demurrage dispute size; % settling vs arbitrating; number of demurrage analysts; Veson pricing; global count of shipping companies.
- **Not researched:** eIDAS/qualified signatures and maritime settlement blockchain; legal-AI API precedents (Clausica, Ironclad, Icertis); maritime AI shutdown cases 2025–26; whether any small maritime AI team has actually been acquired in 2025–26.
- **All 2026 arXiv/ACM IDs** (the 2602–2609 series) came from search-surfaced abstracts; numbers are internally consistent and attributed but were not verified against full papers.