# Keel PRD — Merged Critique Synthesis

**Sources**: 7 independent reviews — DeepSeek (deep), Gemini (gem), ChatGLM (glm), GPT-4o (gpt), Kimi (kimi), Llama/Meta (meta), Qwen (qwen)
**Date**: 2026-05-30

---

## Methodology

Each finding is tagged with which reviewers raised it. Consensus is graded:
- **🔴 Universal (6–7/7)**: Every reviewer flagged this. Non-negotiable fix.
- **🟠 Strong (4–5/7)**: Clear majority. High-priority fix.
- **🟡 Moderate (2–3/7)**: Notable concern. Worth addressing.
- **⚪ Single (1/7)**: Unique insight. Evaluate on merits.

---

## Part 1: Business Critique

### 🔴 B-01: Multi-Party Adoption is a GTM Death Trap
**Raised by**: deep, gem, glm, gpt, kimi, meta, qwen (7/7)

Every single reviewer flagged this as the #1 business risk. The adversarial nature of demurrage disputes means owners and charterers will not voluntarily share documents on the same platform. The "collaborative, multi-party system" framing is a fiction for V1.

**Consensus recommendation**: Pivot V1 to a **single-player audit weapon**. A charterer uploads the owner's claim documents, Keel shreds them and generates an audited rebuttal. The owner never needs to log in. Multi-party collaboration (shared workspace, dispute threads) moves to Phase 2/3 after trust is established.

---

### 🔴 B-02: Pricing is Dangerously Misaligned with Value
**Raised by**: deep, gem, glm, kimi, meta, qwen (6/7)

$500/month starter tier when a single successful audit saves $50K–$75K creates a 100x ROI mismatch. In maritime enterprise, cheap = toy. Greek owners pay $5K–$15K/month for Veson; $500 signals "student project."

**Consensus recommendation**: Raise starter to $1,500–$2,500/month minimum. Consider value-based or per-claim pricing. Align revenue with financial impact delivered.

---

### 🔴 B-03: "Verdict" / "Adjudication" Language Creates Legal Liability
**Raised by**: deep, gem, glm, gpt, kimi, qwen (6/7)

Using "verdict," "adjudicate," and "the truth is settled" positions Keel as making legal determinations. If relied upon and wrong, this creates tort liability for negligent misstatement. Maritime lawyers will flag this immediately.

**Consensus recommendation**: Rebrand throughout:
- "Verdict" → "Assessment" or "Recommendation"
- "Adjudicate" → "Evaluate" or "Analyze"
- "The truth is settled" → "Keel identifies the most supportable position"
- Add prominent disclaimer: outputs are for negotiation support, not legal advice.

---

### 🟠 B-04: Competitive Landscape is More Hostile Than Presented
**Raised by**: deep, gem, glm, gpt, kimi, meta (6/7)

The PRD understates incumbent momentum:
- **Veson CoCaptain** (May 2025): AI SOF parsing, side-by-side comparison, claims reconciliation — inside the system of record
- **Marcura**: Acquired HubSE (2025) + Shipdem (Feb 2026), offering end-to-end software + services
- **B&V SailFast**: AI extraction from handwritten SOFs, 40+ years of data, patent-pending tech
- **Windward**: Container D&D automation with GenAI contract parsing

The PRD's differentiation claims ("multi-party reconciliation + weather corroboration") are already being replicated by incumbents with deeper data and customer relationships.

**Consensus recommendation**: Acknowledge the competitive reality more honestly. The real moat is not the calculator or the reconciliation workflow — it's the **clause intelligence corpus + settlement outcome data** accumulated from pilots. Reposition toward "Claims Intelligence Copilot" rather than "Reconciliation Platform."

---

### 🟠 B-05: Greek Market / Athens Narrative is Over-Romanticized
**Raised by**: kimi, meta, qwen (3/7, but deep)

Greek shipping families are conservative, relationship-driven, with 6–18 month sales cycles. They're already embedded with Danaos/Veson/BV. The Piraeus angle is a demo narrative, not a GTM strategy. A slick SaaS tool from a 2-person team won't get past "send us a proposal."

**Consensus recommendation**: Treat Athens as tactical demo context, not strategic wedge. GTM needs named pilot customer commitments, not geographic hand-waving.

---

### 🟡 B-06: No Evidence SMEs Want Self-Service Software
**Raised by**: gpt, meta (2/7)

Many shipping SMEs solve claims via spreadsheets, email, brokers, and consultants. Marcura's acquisitions suggest the market prefers software + expert services, not pure self-serve SaaS.

**Consensus recommendation**: Consider a hybrid model where Keel can also be sold as a service-augmented tool, not purely self-service.

---

### 🟡 B-07: Network Effects (Phase 3) are Probably Fictional
**Raised by**: gpt, kimi (2/7)

"Anonymized reconciliation outcomes become the moat" is a VC slide, not a real moat. Every claim is heavily contextual (CP wording, counterparty, jurisdiction, cargo). Aggregated win rates are weak signals.

**Consensus recommendation**: De-emphasize data network effects. The real moat candidate is the **clause intelligence corpus** — a proprietary database of clause variations, dispute outcomes, and analyst decisions.

---

### 🟡 B-08: 5–10% Write-Down Statistic is Unsourced
**Raised by**: meta (1/7, but critical for fundraising)

The "5–10% of demurrage value lost to ambiguity" claim is attributed to Marcura with no citation. In investor diligence this gets shredded.

**Consensus recommendation**: Either cite the specific Marcura source or validate with primary data from pilot customers. Do not use unsourced statistics in investor materials.

---

### 🟡 B-09: Scope is Too Narrow (Weather-Only Wedge)
**Raised by**: gpt (1/7, but substantive)

Weather disputes are only one class of demurrage disputes. Real analysts spend time on NOR validity, WIBON, berth congestion, pumping warranties, shifting, cargo readiness, reversible laytime, and clause interpretation. Risk of building "the world's best weather dispute tool" instead of a platform.

**Consensus recommendation**: Expand the conceptual scope in the PRD vision (even if V1 execution remains narrow). Position as a **claims intelligence platform** that starts with weather and expands.

---

## Part 2: Technology Critique

### 🔴 T-01: BIMCO 2013 Implementation is Factually Incomplete/Wrong
**Raised by**: kimi, meta, glm (3/7, but the most technically damning)

The system uses a simplified "Wind Force ≥ 6 OR sustained rain" threshold. Kimi's critique is the most detailed: BIMCO 2013 contains **four distinct WWD formulations** (Definitions 15–18) with different calculation methods (pro-rata exclusion vs. actual interruption vs. artificial 24h day). The Force ≥ 6 threshold is an invention — BIMCO doesn't specify Beaufort thresholds. Weather exceptions depend on cargo type, port working hours, and actual vs. notional interruption.

**Consensus recommendation**: 
- Acknowledge the simplified threshold as a demo approximation in the PRD
- Phase 1 must implement at least Definitions 15 and 16 correctly
- Weather threshold should be configurable per CP clause, not hardcoded
- Consult a maritime lawyer for validation

---

### 🔴 T-02: Filename-Based Document Routing is a Dead End
**Raised by**: deep, gpt, kimi, meta (4/7)

`dispatcher.py` routes by filename (`charterparty.pdf`, `sof_*.pdf`). Real documents arrive as `scan001.pdf`, `IMG_4455.pdf`, combined PDFs, etc. This will embarrass the team in a live pilot.

**Consensus recommendation**: Content-based document classification is a **P0 for Phase 1 Month 1**, not an open question. Use LLM classification or heuristic page-structure analysis.

---

### 🔴 T-03: OCR Rejection Makes Product Unusable for Real Documents
**Raised by**: gem, glm, kimi, meta, qwen (5/7)

Real SOFs are scanned, faxed, stamped, and handwritten. Explicitly rejecting OCR limits Keel to a tiny subset of synthetic documents. B&V SailFast explicitly markets "handwritten notes to scanned Port Logs." 

Multiple reviewers also agree: **Tesseract is the wrong tool**. It's inadequate for complex maritime tabular data.

**Consensus recommendation**:
- Phase 1 Alpha: Accept only text-based PDFs but **fail loudly** on scans (don't silently produce garbage)
- Phase 1 Beta: Skip Tesseract entirely, go straight to Azure Document Intelligence or Google Document AI
- Phase 1 GA: Multimodal LLM extraction (page images → GPT-4o/Gemini)

---

### 🔴 T-04: Open-Meteo Weather Data is Legally Insufficient
**Raised by**: glm, gpt, kimi, meta, qwen (5/7)

Open-Meteo ERA5 reanalysis is 31km grid resolution, not port-specific. In arbitration, "we used a free weather API" is not defensible. BIMCO weather exceptions require evidence that weather **actually prevented operations**, often judged by port authority logs or local station data.

**Consensus recommendation**:
- Acknowledge Open-Meteo as a demo/corroboration tool, not a definitive source
- Phase 1: Integrate at least one paid, port-specific provider (DTN/Meteogroup, Visual Crossing)
- Position weather data as **corroborating evidence** alongside port authority logs (which users should upload)
- Allow manual weather data override by analysts

---

### 🟠 T-05: Missing Human-in-the-Loop (HITL) Validation
**Raised by**: gem, glm, gpt, kimi, qwen (5/7)

The pipeline runs end-to-end without human verification of LLM extractions. If the LLM misinterprets a timestamp by 12 hours, the engine confidently produces a completely wrong dollar amount. 

**Consensus recommendation**: Phase 1 must include an intermediate verification step where the analyst reviews extracted terms and timeline before the engine runs. This is not optional — it's the difference between a tool and a liability.

---

### 🟠 T-06: State Machine Will Not Scale Beyond Demo
**Raised by**: gem, gpt, qwen (3/7)

The linear state machine (BEFORE_NOR → ON_LAYTIME → WEATHER_PAUSE → ON_DEMURRAGE) works for the canonical demo but will collapse under real-world complexity: retroactive recalculations, overlapping exceptions, multi-port voyages, reversible laytime. By Month 3, it becomes an unmaintainable if/else tangle.

**Consensus recommendation**: Plan the architecture evolution toward an event-sourced temporal rules engine or DAG evaluator, even if V1 remains simple. Design for extensibility from the start.

---

### 🟠 T-07: Reconciliation Engine is Hardcoded for Canonical Demo
**Raised by**: deep, gpt (2/7, but architecturally critical)

`reconcile/adjudicator.py` has a separate canonical path that directly returns the demo's verdicts. The generic path is incomplete — it cannot generically reconcile two claims for any voyage other than the canonical one. A reconciliation platform that cannot generically reconcile is a demo, not a product.

**Consensus recommendation**: Generalize the reconciliation engine before Phase 1 pilot. The engine must compute complete timestamped laytime traces for both parties, diff them day-by-day, and re-evaluate rules against external evidence.

---

### 🟠 T-08: No Confidence Scoring or Semantic Validation for LLM Extractions
**Raised by**: gpt, kimi, meta (3/7)

Structured outputs guarantee schema compliance, not semantic correctness. A demurrage rate of $5,000,000/day is schema-valid but semantically wrong. No extraction confidence, no uncertainty propagation, no range validation.

**Consensus recommendation**: Add semantic validation layer:
- Range validation (demurrage rate $1K–$200K/day, laytime > 0)
- Cross-field consistency checks (NOR before loading start)
- Confidence scoring with HITL fallback for low-confidence extractions

---

### 🟠 T-09: Database Architecture (JSON Blobs) is an Anti-Pattern
**Raised by**: deep, glm, kimi, meta (4/7)

SQLite with `data_json TEXT` is zero queryability, no indexing, no referential integrity. The migration to PostgreSQL is described as a schema upgrade when it's actually a complete data model rewrite.

**Consensus recommendation**: Design the normalized PostgreSQL schema before writing Phase 1 code. Do not migrate JSON blobs — start fresh with proper relational tables.

---

### 🟠 T-10: Security, Auth, and Compliance are Afterthoughts
**Raised by**: deep, kimi, meta (3/7)

- CORS `*`, no auth, no rate limiting
- RLS with `set_config` is dangerous in async connection pooling (connection reuse leaks)
- "SOC 2 Type I by month 3" is fantasy for a 2-person team
- GDPR never mentioned (EU entities processing commercial documents)
- No secrets management plan
- No backup/DR strategy

**Consensus recommendation**: 
- SOC 2 timeline is unrealistic — remove or push to Phase 2
- Implement auth (JWT + Supabase Auth) as Day 1 of Phase 1
- Add GDPR section and data residency requirements
- Implement tenant isolation at application layer (ORM query filters) in addition to RLS
- Specify EU-region deployment

---

### 🟡 T-11: Celery May Be Wrong Choice for Workflow Orchestration
**Raised by**: glm (1/7, but architecturally sound)

Celery is a task queue, not a workflow orchestrator. The pipeline has branching paths, HITL pauses, and external API dependencies. Celery makes it difficult to visualize pipeline state, handle retries per-step, or pause mid-execution.

**Consensus recommendation**: Consider ARQ (lighter) for Phase 1 or move Temporal/Inngest from Phase 2 to Phase 1. If Celery, plan for Temporal migration.

---

### 🟡 T-12: PDF Bounding Box Citations Won't Survive Real Documents
**Raised by**: meta, qwen (2/7)

Bounding boxes from pdfplumber are brittle with scanned/skewed documents. PDF coordinate systems (bottom-up) differ from DOM (top-down). Citations will break silently on real documents.

**Consensus recommendation**: Consider text-snippet highlighting (fuzzy match on extracted text) as a more robust alternative to strict X/Y coordinate overlays. Store content hashes, not just page numbers.

---

### 🟡 T-13: Audit Trail is Not Legally Defensible
**Raised by**: gpt, meta (2/7)

Legal-grade auditability requires source versioning, document hash, extraction model version, rule version. Currently none appear in schemas. In-memory status tracking is lost on restart.

**Consensus recommendation**: Add document hash, model version, and rule version to audit entries. Move to immutable, persistent audit logs.

---

### ⚪ T-14: AIS Integration Needed for Vessel Position
**Raised by**: qwen (1/7)

Ships wait at anchorage (15+ miles offshore) with different weather than at berth. Weather queries should use vessel's actual GPS coordinates, not static port lat/lon.

**Consensus recommendation**: Valid for Phase 2. Note as a future enhancement for weather accuracy.

---

### ⚪ T-15: Multi-Tenant RLS Model Doesn't Fit Multi-Party Voyages
**Raised by**: qwen (1/7)

Standard `tenant_id` RLS assumes a document belongs to one tenant. A voyage involves Owner (Tenant A), Charterer (Tenant B), and possibly Broker (Tenant C). Need a many-to-many access control model.

**Consensus recommendation**: Design a `voyage_participants` junction table with role-based access. RLS policies check membership, not direct column.

---

## Part 3: Prioritized Action List for PRD Update

### Immediate (apply now)
1. ✏️ Reframe V1 as **single-player audit tool** — remove multi-party requirement from core use case
2. ✏️ Replace "verdict" / "adjudicate" / "truth is settled" with advisory language throughout
3. ✏️ Raise pricing floor ($1,500+ starter)
4. ✏️ Acknowledge BIMCO 2013 simplification — note that the demo uses an illustrative threshold, not a complete implementation
5. ✏️ Upgrade competitive landscape to honestly reflect Veson CoCaptain, B&V SailFast, Marcura's full position
6. ✏️ Promote document classification from "open question" to P0 requirement
7. ✏️ Drop Tesseract from the OCR plan — go directly to managed document AI services
8. ✏️ Add HITL extraction verification as a Phase 1 requirement
9. ✏️ Add disclaimer / legal advisory positioning
10. ✏️ Acknowledge Open-Meteo limitations — position as corroboration, not definitive evidence
11. ✏️ Remove "SOC 2 Type I by month 3" — unrealistic for 2-person team

### Phase 1 additions
12. Add semantic validation layer for LLM extractions (range checks, cross-field consistency)
13. Add confidence scoring to extraction outputs
14. Design normalized PostgreSQL schema upfront (not migrate JSON blobs)
15. Add GDPR/data residency section
16. Specify EU-region deployment
17. Add immutable audit logging with document hashes and model versions
18. Consider ARQ over Celery for Phase 1 simplicity

### Conceptual reframing
19. Expand vision scope from "demurrage reconciliation" to "claims intelligence platform"
20. Real moat = clause intelligence corpus + settlement outcome data (not network effects)
21. Acknowledge that Phase 1 plan is closer to 6–9 months for a 2-person team, not 3 months
