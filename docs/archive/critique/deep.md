# Strict Critique of Keel PRD

This critique evaluates the Keel PRD on both **business** and **technology** grounds, using current industry benchmarks and best practices. The analysis is blunt and constructive, aimed at surfacing the gaps that will matter most when moving from a hackathon demo to a venture-backable product.

---

## 1. Business Critique

### 1.1 Market Fit & Positioning
**The wedge is real, but the moat is shallow.**  
The demurrage space is genuinely saturated with calculators (BV, Danaos, Heisenberg), and the PRD correctly identifies that deterministic math is table stakes. The “adversarial reconciliation” angle is compelling—focusing on the $125K gap between two claims, not just the number-crunching. However, the actual demonstration reduces the dispute to a **single, easily adjudicable weather clause** (BIMCO 2013 WWD threshold). Real disputes rarely boil down to one clear-cut rule; they involve NOR validity, berth availability, or ambiguous “consecutive weather working day” interpretations. The demo’s simplicity papers over the true complexity the platform will face.

**Competitive reality:**  
- **Marcura** (post-acquisitions) is aggressively moving downmarket with a **human+AI services model**. They can offer a “done-for-you” reconciliation that many SMEs will prefer over self-service software.  
- **Veson’s CoCaptain** is embedded inside IMOS, which already contains the master data (CP, SOF, vessel positions). Keel will require external data import—a friction point.  
- **Voyager Portal** already does SOF parsing and contract clause testing. The PRD’s claim that Keel differentiates via multi-party reconciliation and weather corroboration is correct, but both are easily replicable if competitors decide to add that layer.

**Bottom line:** The market is consolidating around end-to-end platforms. A point solution for reconciliation needs **network effects** (data on claim outcomes) to survive; the PRD’s Phase 3 “data network effects” idea is crucial but too far out to protect the early-stage product.

### 1.2 Customer Validation & Pricing
- **Pilot strategy is vague.** “2–3 pilot customers (Athens-based SME operators, 5–50 vessels)” is the right scale, but the PRD assumes a $500/month starter tier will be acceptable. Greek shipowners are notoriously cost-sensitive and often rely on in‑house spreadsheets or free BV calculators. Convincing them to pay **$6,000/year** for a single-purpose tool will require demonstrable ROI that the demo does not yet prove.  
- **The “FDE” (Full-time Deployed Engineer) model** is mentioned but not explained. Embedding an engineer at a charterer’s office to co‑create custom rules is a high‑touch sales motion that will strain a 2‑person team and is hard to scale without enterprise pricing.  
- **Per-claim pricing for consultancies/P&I clubs** is sensible, but the PRD offers no data on claim volumes or willingness to pay in that segment. The $50–150/claim range might be too low if the typical demurrage dispute is $100K; a 0.1% fee is negligible, but they might pay for speed. This needs validation.

### 1.3 Regulatory & Liability Risk
The PRD glosses over the **legal status of automated adjudication**. If Keel generates a “reconciled total” and a formal claim letter, it is effectively making a legal interpretation. A maritime lawyer will quickly point out that a machine verdict is not binding and could expose Keel to liability if relied upon. The Phase 1 plan to add a disclaimer is insufficient; the entire UX must position Keel as an **advisory tool**, not a judge. The phrase “the truth is settled” in the one-liner is dangerously absolute.

### 1.4 Fundraising Narrative Dependence
The document cites a **$200M TMV maritime/logistics fund** (May 2026) as a sign of VC appetite. This is a future projection in a PRD that itself is dated May 2026. If the fund does not materialize or is smaller than claimed, the narrative weakens. The pitch should rely on intrinsic value, not a speculative macro tailwind.

---

## 2. Technology Critique

### 2.1 Architecture: Hackathon Success, Production Failure
The hackathon architecture is a **single-process monolith** with FastAPI, SQLite, and in‑memory state. This is perfectly acceptable for a 90-second stage demo, but the Phase 1 rewrite plan has critical omissions and unrealistic timelines.

**a) Database: SQLite → PostgreSQL is necessary but insufficiently specified.**  
- The current `store.py` stores everything as a JSON blob in a single TEXT column. That means zero queryability, no indexing, and no referential integrity. The Phase 1 plan for normalized tables is correct, but the migration strategy is an open question: will they migrate existing demo data or start fresh? Starting fresh forfeits the ability to show the canonical demo to investors from the same codebase.  
- **Row-Level Security (RLS)** is mentioned, but RLS alone does not guarantee tenant isolation if the application layer does not consistently set the tenant context. The plan needs a clear middleware that validates JWT claims and sets the database session’s `app.current_tenant_id` before every query.  
- **No mention of connection pooling, migration testing, or zero-downtime schema changes**, all of which are best practices for production PostgreSQL.

**b) Pipeline execution: BackgroundTasks are a hack.**  
- The demo uses FastAPI’s `BackgroundTasks` for LLM calls and PDF parsing. These run in the same process and will block the event loop if the task is CPU‑bound (pdfplumber) or if the LLM call takes >30 seconds. The API endpoint will return a 202 immediately, but the client must **poll** for results—a pattern that causes race conditions and extra load.  
- Phase 1 proposes Celery/ARQ, which is the right direction, but the PRD does not define a **task status API** or a WebSocket/SSE endpoint for real-time progress. The frontend currently polls; that’s okay for alpha, but production needs push updates.  
- **LLM extraction caching:** The code caches extraction results as JSON files. In a distributed Celery setup, this will break because files are local. The plan should move caching to Redis or a shared object store.

**c) Reconciliation engine is dangerously hardcoded for the canonical demo.**  
- The codebase has a `reconcile/adjudicator.py` with a **separate canonical path** that directly returns the demo’s day‑by‑day verdicts. The generic path (`pipeline.py`) is incomplete—it does not actually call the BIMCO evaluator for arbitrary disputed windows because the SOF events lack enough structured data to identify which days are disputed.  
- This means the “reconciliation” for any voyage other than the canonical one will fail or produce garbage. The PRD acknowledges the hack but does not treat this as a critical blocker for Phase 1. **A reconciliation platform that cannot generically reconcile two claims is a demo, not a product.**  
- The correct approach: the engine must compute a complete, timestamped laytime trace for both parties, with each rule application tagged by clause. The differ should then compare these traces day‑by‑day and flag where the consumed hours diverge, then re‑evaluate the rule for that day using external evidence.

**d) Parser routing by filename is brittle.**  
- `parsing/dispatcher.py` decides which parser to use based on filename (`charterparty.pdf`, `sof_owner.pdf`). In real claims, documents come with arbitrary names (e.g., `scan001.pdf`, `email_attachment_3.pdf`). The Phase 1 plan to add content-based classification is correct, but it’s mentioned only in the “Open Questions” list—it must be a P0 in the first month.

### 2.2 Tech Stack Choices & Missed Opportunities
**What’s good:** FastAPI + Pydantic v2, strict JSON schema for LLM output, Python state machine, tailwind/shadcn, Next.js App Router. These are modern, productive choices that accelerated the hackathon.

**What’s problematic or missing:**

- **LLM model reliance:** The hackathon uses GPT‑4o exclusively with a fallback to NVIDIA NIM. GPT‑4o is expensive and has latency >5 seconds for a 12K‑character charterparty. The Phase 1 plan to add a fallback chain (4o → 4o‑mini → cache) is sound, but **batch processing** for non‑real‑time reprocessing should be prioritized earlier to keep costs low.  
- **No structured logging or tracing.** The backend currently uses `print()` or basic logging. For a multi‑stage pipeline, OpenTelemetry is not a luxury; without it, debugging why a particular voyage produced a wrong number will be extremely difficult. The Phase 1 observability plan is good but must be implemented before pilot customers onboard.  
- **CORS `*` and no authentication** are acceptable for a demo, but the Phase 1 plan says “must be locked down” without specifying whether it will use API keys, OAuth2, or JWT. The frontend currently has a mock login—real authentication integration (e.g., Supabase Auth, Auth0) will touch every API call and needs careful planning.  
- **Static asset handling:** PDFs are stored in the filesystem (`/tmp`). The Phase 1 plan to move to object storage (S3/R2) is right, but it must consider **presigned URLs** for frontend access, which requires changes to the `PdfViewer` component and the API.  
- **PDF rendering with react‑pdf:** The demo uses bounding‑box overlays. In production, large multi‑page SOFs will cause performance issues if the entire PDF is rendered client‑side. Server‑side image generation or tiled rendering may be needed.

### 2.3 Testing & Quality Assurance
The hackathon has a strong **canonical assertion test** (`test_canonical.py`) that locks the $112K output. However, the test suite is otherwise minimal:

- There are unit tests for the engine and BIMCO rules, but no **integration tests** for the full pipeline with varied inputs.  
- The LLM extraction tests (`test_extraction.py`) likely test against cached fixture outputs, not against real GPT‑4o responses. That means they cannot catch prompt drift or model version changes. A **golden dataset evaluation framework** (Phase 1) must run nightly in CI to detect extraction regressions.  
- **Edge cases:** The engine’s “once on demurrage” and SHEX logic are tested, but the PRD does not mention tests for overlapping weather delays, midnight crossings, or timezone handling—all of which are real-world pitfalls in maritime claims.

### 2.4 Deployment & DevOps
The Phase 1 deployment architecture (Vercel + Railway/Fly.io + Supabase) is pragmatic and appropriate for a small team. However, the plan omits:

- **Environment parity:** The hackathon runs locally. The first staging environment must mirror production (PostgreSQL, Redis, object storage) or deployment issues will waste pilot time.  
- **Secrets management:** API keys for OpenAI, weather providers, and database credentials must never be committed. The plan should specify use of environment variables with a `.env` pattern and a vault for production.  
- **Database backup and disaster recovery:** No mention of automated backups for the SQLite → PostgreSQL transition. For pilot customers, losing data would be catastrophic.  
- **Rollback strategy:** The CI pipeline includes “automated rollback” for Alembic migrations. In practice, downgrading a migration that drops a column will lose data; the plan needs to discuss non‑destructive migrations and blue‑green deployment patterns.

---

## 3. Overall Verdict

**The PRD describes an impressive hackathon demo but a dangerously incomplete product plan.** The business wedge is intellectually sound, but the go‑to‑market assumptions are untested, and the competitive landscape is far more hostile than the document admits. Technically, the architecture would collapse under the first real multi‑party voyage that doesn’t exactly match the canonical scenario. The Phase 1 plan lists the right intentions but underestimates the effort required to turn a single‑scenario pipeline into a generalized, maintainable, and secure production system.

**Critical priority actions before any VC demo:**

1. **Generalize the reconciliation engine** to work without hardcoded canonical logic. This is a showstopper.  
2. **Validate pricing and willingness to pay** with at least 5 real‑world charterer/owner analysts, not just hypotheticals.  
3. **Build a true async task architecture** (Celery + status API) before putting the platform in front of a pilot customer.  
4. **Implement content‑based document classification**—filename routing will embarrass you in a live pilot.  
5. **Add disclaimer and legal review** to avoid liability from automated adjudication outputs.  

If these five items are not resolved, Keel will remain a brilliant stage prop, not a viable business.