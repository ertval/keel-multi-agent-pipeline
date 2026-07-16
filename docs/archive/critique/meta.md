**Keel PRD – strict critique**

You built a clean hackathon demo, but the document reads like a pitch deck stapled to a to-do list. The core idea is right — demurrage math is commoditized, the fight is over interpretation — but both the business wedge and the technical foundation are fragile for an enterprise product.

## Business: wedge is real, moat is not

**1. You're walking into a consolidation wave, not an open field**
- Marcura didn't just buy HubSE in 2025, it bought Shipdem in Feb 2026 to cover chemical tankers specifically. Their press release says the integration combines Shipdem's technical expertise with Marcura's "self-service and managed services, offering end-to-end solutions". HubSE was positioned as the "first commodity-agnostic demurrage solution" for owners *and* charterers.
- Veson launched IMOS X Claims CoCaptain on May 29, 2025 — an AI-powered extension "designed to streamline the demurrage claims process" inside IMOS. That's your exact target user, already inside their system of record.
- Windward launched AI D&D automation in Feb 2025 reducing billing from "30+ days to under a minute" by processing unstructured contracts. Different segment (containers), same narrative: LLM extraction + deterministic calc.

Your PRD claims "deterministic math is table stakes" — correct — but then positions Keel as unique for "adversarial reconciliation." Marcura, Veson, and Voyager Portal already market side-by-side comparison and audit trails. The differentiation is *degree*, not *kind*.

**2. Multi-party is the hardest GTM, not the easiest**
You need both owner *and* charterer analysts to upload documents to the same workspace. In practice:
- Owners won't upload to a charterer-controlled tool (gives away claim strategy)
- Charterers won't trust owner-provided weather data
- P&I clubs and brokers sit in the middle and already use Marcura as neutral third party

The PRD hand-waves this as "collaborative," but doesn't solve trust, data ownership, or who pays. Your pricing ($500/mo starter) assumes SME operators will pay for software they currently do in Excel for free. Greek owners control ~20% of global fleet, and with Chinese owners that's 34% — but they're famously conservative, relationship-driven, and already have embedded Danaos or Veson contracts.

**3. The 5–10% write-down statistic is un-sourced**
You attribute it to "Marcura" with no citation. In investor diligence this gets shredded. You need primary data from 2–3 pilot customers showing actual write-downs, not a market slide.

**4. Athens resonance is tactical, not strategic**
Yes, Piraeus is the capital. But judges care about repeatable revenue, not geography. Your roadmap lists 5 cities for expansion without explaining why a Greek SME would switch from a 40-year-old BV calculator that costs $100/month.

## Technology: hackathon-smart, production-naive

**1. Stack choices are fine for 8 hours, dangerous for Phase 1**
- FastAPI + Pydantic v2 + Next.js 15 is the right modern pairing. Good call rejecting LangChain and Streamlit.
- But you chose **SQLite with JSON blob storage** (`data_json TEXT`). That's explicitly an anti-pattern for the PostgreSQL-first architecture you claim to want. Best-practice guides for FastAPI production emphasize "PostgreSQL for reliable database management" and async SQLAlchemy from day one. Migrating from blob JSON to normalized tables later will be a 3-month rewrite, not a migration.

**2. Background processing will fail at first pilot**
FastAPI `BackgroundTasks` is in-process. The PRD admits "Pipeline blocks on LLM timeouts (30s hard limit)." Production guidance is clear: "FastAPI's synchronous request-response model causes delays... Celery's task queue mechanism ensures background processing without blocking the API". You need Celery/Redis *before* pilots, not after.

**3. LLM extraction is under-specified**
- "No math" rule is excellent — keep it.
- But you truncate CPs at 12K chars, have no chunking, no confidence scoring, and cache extractions as fixtures. Real charterparties are 30–80 pages with scanned tables. Your dual-parser (pdfplumber + PyMuPDF) adds complexity without solving the core problem: 70% of SOFs arrive as scanned PDFs or email photos. You explicitly rejected OCR for the hackathon — that's fine, but Phase 1 can't launch without Azure Document Intelligence or similar.
- No model fallback chain implemented. `OPENAI_BASE_URL` is not redundancy.

**4. Weather adjudication is brittle**
- BIMCO 2013 WWD requires "weather prevented operations" — not just Beaufort ≥6. You code `wind_force_beaufort` from Open-Meteo, but Open-Meteo provides m/s, not Beaufort. Converting m/s → Beaufort loses nuance (gusts vs sustained, direction relative to berth). You also need wave height for anchorage disputes, which Open-Meteo Marine provides but you haven't integrated.
- Your canonical test hardcodes Force 5/4/7 for June 14–16. That's a demo cheat, not a rule engine. Real disputes hinge on whether rain was "continuous" or operations were "actually prevented" — you need port logs, not just weather.

**5. Citations architecture won't survive versioning**
Storing bbox coordinates from pdfplumber works for your 6 fixtures. In production, owners send CP amendments as Word → PDF with different pagination. Your clickable citations will break silently. You need content-addressable hashing of clauses, not page numbers.

**6. Security and multi-tenancy are vaporware**
- `allow_origins=["*"]`, no auth, SQLite file on disk. The PRD lists "JWT + RLS" for Phase 1, but RLS with `tenant_id` requires rewriting every query. You have two persistence modules (`store.py` vs `database.py`) — that's tech debt on day 1.
- Audit trail requirement: "every number traceable" is good, but you store audit entries in memory status tracking ("lost on restart"). For legal disputes, you need immutable logs (WORM storage), not SQLite.

**7. Testing is a single golden path**
One test (`reconciled_total_usd == 112_000`) is not a test suite. You need:
- Property-based tests for "once on demurrage"
- Fuzzing for SHEX across timezones
- Golden dataset of 20+ real voyages (you list this as future work — it should be gating alpha)

**8. Deployment architecture adds latency**
Vercel (frontend) + Railway/Fly.io (API) + Supabase (DB) + Upstash (Redis) = 4 vendors, 3 regions, no VPC peering. For Greek users in Piraeus, every PDF upload will traverse US-East. You need a single-region EU deployment for data residency (many CPs are confidential).

## What to fix before raising

**Business:**
- Kill the "multi-party platform" narrative for now. Start as charterer-only audit tool — they have the pain (paying claims) and budget. Land 3 Athens charterers, prove 2% savings, then add owner collaboration.
- Price at $2k/mo minimum. $500 signals "toy." Marcura charges per-claim; Veson is $5k–15k. You are replacing analyst time ($80k salary), not a calculator.
- Get a letter from one Greek operator validating the 5–10% write-down. Without it, investors will assume you're solving a spreadsheet problem.

**Technology:**
1. **Immediate:** Migrate to PostgreSQL + Alembic now. Normalize schemas per your §13.2.1 table — don't ship alpha with JSON blobs.
2. **Pipeline:** Replace BackgroundTasks with ARQ (simpler than Celery) + Redis. Implement proper timeouts and dead-letter queue.
3. **Extraction:** Add chunking + confidence scores. For Phase 1, accept only text PDFs but fail loudly on scans — don't silently hallucinate.
4. **Rules:** Extract BIMCO evaluators into a registry with unit tests per clause. Your current `evaluators.py` mixes WWD logic with hardcoded thresholds.
5. **Observability:** Add OpenTelemetry and Sentry before pilots. You can't debug LLM extraction without trace IDs.
6. **Security:** Implement Supabase Auth + RLS on day 1 of Phase 1. Delete `database.py`. Lock CORS.

The demo is visceral — "$187K → $112K in 10 seconds" works. But the PRD conflates a hackathon win with product-market fit. The real moat isn't the calculator or the LLM extraction; it's the **rule library + port-specific precedent data** you accumulate from pilots. Marcura has 2M+ voyages. You have 1 fixture.

Focus Phase 1 on getting 20 real voyages from 2 Greek charterers, building the golden dataset, and proving you can beat their current write-down rate by 3 points. Everything else — multi-party, predictive analytics, marketplace — is distraction until you have that data.