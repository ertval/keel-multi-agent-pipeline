# Keel — Product Requirements Document

**Status**: Hackathon MVP complete · Post-hackathon planning
**Last updated**: 2026-05-30
**Owners**: 2-person team
**Build window**: 8 hours (completed) · Phase 1 alpha planned

---

## 1. Product summary

**Keel** is a Claims Intake & Audit Intelligence Platform for maritime demurrage. An analyst uploads claim documents — charterparty, statements of facts, and the counterparty's claim — and Keel cross-references them against external evidence (port weather records), extracts structured facts with an LLM, runs a deterministic calculation engine, and **evaluates** disputed line items using a codified rule library (BIMCO Laytime Definitions 2013). Keel outputs a structured reconciliation report and a formal claim letter with the recommended amount. Every number is traceable to a clause, an SOF row, or a weather record. Outputs are advisory — Keel accelerates dispute resolution, it does not replace legal judgment.

**One-line pitch**: *"The owner claims $187K. Keel identifies a defensible position at $112K — with every disputed line cited to source."*

**The canonical demo (Section 5) is the north star.** Every architectural decision in this document exists to make that exact scenario execute flawlessly on stage.

---

## 2. Why this exists

### 2.1 The Demurrage Audit Opportunity

Standard laytime calculators are highly commoditized. Basic deterministic calculations have been solved by software since the 1980s. Additionally, the SME demurrage calculator space is heavily saturated:
- The SME demurrage market is already served by mature, freemium/low-cost calculators like Burmester & Vogel (40+ years, 2M+ voyages), Danaos (deeply embedded in Greek/Cypriot operators), Heisenberg Shipping, and SeaRates.
- Enterprise incumbents are moving downward: Marcura acquired HubSE (2025) and Shipdem (Feb 2026) explicitly to serve self-service / SME segments.
- The **deterministic math engine is table stakes**, not a moat.

### 2.2 The Keel Focus: Adversarial Reconciliation

What is **not** commoditized is the **pre-processing chaos and the adversarial gap between parties**. Owners send claims based on their interpretation of the SOF; charterers dispute them based on theirs. The dispute lives in clause interpretation and SOF timestamp differences. Industry estimates suggest 5–10% of total demurrage value is written down due to contract-term ambiguity, though this figure requires validation with pilot customer data.

Keel's defensible wedge: **a single-player audit tool that lets one party ingest the counterparty's claim documents, automatically identify the specific clauses and timestamps where they diverge, and produce a structured reconciliation report with an audited counter-position**. The deterministic calculator becomes a verification primitive, not the headline feature. Multi-party collaboration (shared workspaces, dispute threads) is a Phase 2 goal once single-player value is proven.

### 2.3 Why hackathon judges will care
- **Athens resonance**: Greek-owned fleet is ~19% of global capacity. Piraeus is the European shipping capital. *(Note: This is demo context, not GTM strategy. Greek operators are conservative adopters with 6–18 month sales cycles and existing vendor relationships.)*
- **Visceral demo**: "Shipowner claims $187K. Charterer disputes. Keel identifies a defensible position at $112K in 10 seconds, with every disputed line item cited to source."
- **Honest AI story**: LLM does extraction only. Math is deterministic. No hallucinated dollars. *(Note: This architectural discipline is now table stakes across serious maritime AI vendors. Keel's differentiation must come from clause intelligence depth, not just the extraction/calculation split.)*

---

## 3. Users and use cases

### 3.1 Primary User (V1: Single-Player Audit)
Keel V1 is a **single-player audit tool**. One party uploads the counterparty's claim alongside their own documents to produce an audited reconciliation:
- **Charterer Demurrage Analyst** (primary V1 persona): Receives a claim from the owner. Uploads the owner's claim, both SOFs, the CP, and port weather data. Keel identifies discrepancies, evaluates disputed items against BIMCO rules, and generates an audited response letter with a defensible counter-position.
- **Owner Demurrage Analyst** (secondary V1 persona): Pre-audits their own claim before sending to ensure it cannot be disputed on weather grounds.

> **V1 design principle**: Keel must deliver full value to a single user without requiring the counterparty to create an account or upload anything. The counterparty's documents are uploaded *by* the user. Multi-party collaboration (shared workspaces, dispute threads, settlement workflows) is planned for Phase 2.

### 3.2 Core use case (hackathon demo scope)
1. **Upload**: Analyst drops voyage documents (Charterparty, Owner SOF, Charterer SOF, and calculations) into Keel.
2. **Extract & Verify**: Keel extracts clauses and timelines via LLM. Analyst reviews extracted data against source documents before proceeding *(HITL verification — full implementation in Phase 1)*.
3. **Calculate & Evaluate**: Keel runs calculations under both owner and charterer interpretations side-by-side, then evaluates discrepancies (e.g., June 14–16 weather delays) against port weather records and BIMCO 2013 definitions.
4. **Document Generation**: Generates a formal claim letter with the recommended total ($112K) and supporting evidence.

> **Advisory positioning**: Keel's outputs are structured negotiation support — not legal advice or binding determinations. All assessments carry a disclaimer that they are for informational and negotiation purposes only.

### 3.3 Out of scope for hackathon
- Email Ingestion / inbox connectors
- Multi-port voyages, multi-hatch / multi-grade cargo, or reversible laytime
- OCR (pre-curate text-based PDFs)
- User accounts, auth, multi-tenancy (mocked for demo)
- Veson / Dataloy / SAP integrations
- Predictive port-delay analytics

---

## 4. Terminology glossary

This project uses standard maritime law and shipping industry terminology. Every term below appears in the codebase, the UI, and the docs.

| Term | Definition |
|---|---|
| **Owner (Shipowner)** | The vessel owner. Under CP agreements, they send demurrage claims (e.g., $187K) when charterers exceed allowed port time. Uses Keel to generate claims and audit disputes. |
| **Charterer** | The cargo owner leasing the vessel. Responsible for loading/discharge operations. Uses Keel to verify claims, find the reconciled amount ($112K), and generate response letters. |
| **Demurrage Analyst** | Analyst at a charterer or owner company who handles demurrage calculations, audits, and dispute letters. Keel's primary user persona. |
| **Charterparty (CP)** | The lease contract specifying vessel, laytime allowance, demurrage/despatch rates, and exception rules. |
| **Statement of Facts (SOF)** | Chronological log of port events (arrival, loading, weather delays). Owner and charterer SOFs often disagree on weather delay durations. |
| **Claim Document / Letter** | Stated demurrage calculation from the owner (claim document) or response/reconciled calculation from the charterer (claim letter). |
| **Laytime / Allowance** | Allowed hours (e.g., 72h) for loading/discharge. Exceeding this triggers demurrage. |
| **Demurrage / Despatch** | Demurrage is the daily penalty rate (e.g., $50,000/day) for exceeding laytime. Despatch is the bonus (typically 50% of demurrage) for early completion. |
| **"Once on demurrage..."** | General rule: once laytime is exceeded and demurrage starts, exceptions (weekends, holidays) no longer pause the clock. |
| **NOR / Turn Time** | Notice of Readiness (readiness notice). Turn time is a grace period (e.g., 6h) after NOR before the laytime clock starts. |
| **SHEX / FHEX / SHINC** | Exception codes: Sundays/Holidays Excepted (SHEX), Fridays/Holidays Excepted (FHEX), Sundays/Holidays Included (SHINC). |
| **WWD (Weather Working Day)** | Day when weather permits operations. Weather exceptions pause the clock per BIMCO 2013 rules. BIMCO 2013 defines four distinct WWD formulations (Definitions 15–18) with different calculation methods. |
| **Beaufort Scale** | 0–12 wind scale. The hackathon demo uses a simplified threshold of wind Force ≥ 6 as an illustrative approximation. In practice, BIMCO 2013 does not specify fixed Beaufort thresholds — weather exceptions depend on cargo type, port working hours, and whether operations were actually prevented. |
| **BIMCO / 2013 Definitions** | Standard shipping body and its laytime rules used by Keel to evaluate weather exception validity. |
| **Reconciliation & Assessment** | Automated evaluation of disputes per day. Assessments indicate which party's position is better supported: "owner favored", "charterer favored", or "requires manual review". These are recommendations, not legal determinations. |
| **Audit Trail / Citations** | Step-by-step record of calculation decisions, each linking to CP clauses, SOF lines, or port weather logs. |
| **FDE / Veson IMOS** | Full-time Deployed Engineer (Phase 1 scaling model). Veson IMOS is the dominant legacy incumbent software. |

---

## 5. Canonical demo scenario — the north star

This is the **single scenario** Keel must execute end-to-end on stage. Every fixture, rule, and UI element is built to make this work.

### 5.1 The story
> *"The shipowner claims $187,000. The charterer's counter-claim is $62,000. They drop the documents into Keel, which reconciles the dispute to $112,000. It shows the dispute centers on 3 specific days (June 14–16). By checking port weather records against BIMCO 2013 rules, Keel shows the owner is correct on June 14 and 15, while the charterer is correct on June 16. Keel generates the claim letter with the reconciled total."*

### 5.2 Required inputs (fixtures)
- `charterparty.pdf`: Laytime clause, demurrage rate, weather clause (BIMCO 2013), and SHEX.
- `sof_owner.pdf` & `sof_charterer.pdf`: Logged port events, NOR, and weather delay claims.
- `claim_owner.pdf` & `claim_charterer.pdf`: Initial calculations ($187,000 vs. $62,000).
- `weather_port_xyz.json`: Hourly port weather records (wind force, rain) for June 14–16.

### 5.3 The dispute, mechanically
- Demurrage rate: **$50,000 / day**
- Disputed window: June 14–16 (2.5 days of disputed weather hours = $125,000 gap).
- **Owner's position**: Weather exception invalid (all 3 days count). Owner total = **$187,000**.
- **Charterer's position**: Weather exception valid (all 3 days excluded). Charterer total = **$62,000**.

### 5.4 The evaluation
Keel applies BIMCO 2013 rules per day using external weather observations:
- **June 14**: Force 5 wind, 12h logged delay. Below WWD threshold. **Owner's position supported** (+$12h / +$25,000).
- **June 15**: Force 4 wind, 12h logged delay. Below WWD threshold. **Owner's position supported** (+$12h / +$25,000).
- **June 16**: Force 7 wind + heavy rain, 24h logged delay. Meets WWD threshold. **Charterer's position supported** (0h / $0).
- **Recommended total**: $62,000 + $50,000 = **$112,000**.

> **Demo simplification note**: The hackathon demo uses a simplified Beaufort ≥ 6 threshold as an illustrative approximation. A production implementation must handle the full BIMCO 2013 WWD formulations (Definitions 15–18), which vary by cargo type and port working hours. The threshold must be configurable per charterparty clause, not hardcoded.

### 5.5 What this scenario forces into the architecture
1. **Port weather abstraction** (`weather_provider.py`): Ingests weather records.
2. **BIMCO 2013 rules** (`engine/rules/bimco_2013.py`): Codified rule evaluators.
3. **Reconciliation adjudicator** (`reconcile/adjudicator.py`): Yields day-by-day verdicts and dollar impact.
4. **DisputedLineItem Schema**: Holds verdicts, justifications, and citations.

### 5.6 What the judges see (literal sequence)
1. **Login**: Analyst logs in to Keel's enterprise dark theme interface.
2. **Dashboard**: View active voyages, reconciliation metrics, and click "New Voyage Analysis".
3. **Upload**: Drops the 5 PDFs and the weather JSON.
4. **Detail Page**: Sidebar remains active. Shows side-by-side claims ($187K vs $62K) and extracted terms.
5. **Reconciliation**: Highlights June 14–16 with day-by-day weather data, rule evaluation, and verdicts.
6. **Reconciled Total**: Displays **$112,000** with clickable source citations.
7. **Letter**: Generates the formal response letter detailing the resolution.

---

## 6. Non-negotiable design rules

1. **LLM never calculates**: The LLM extracts clauses, terms, and timestamps. All math is done deterministically in Python.
2. **Citations for every number**: Every number in the UI has a clickable link back to the source PDF (page/bbox) or weather record (timestamp).
3. **Rule-based evaluation**: Assessments must cite specific BIMCO 2013 clauses or port weather data, never statistical midpoints or arbitrary splits. All outputs carry advisory disclaimers.
4. **Pre-curated fixtures**: Only use the 6 canonical files for the stage demo.
5. **Engine tests first**: Enforce "once on demurrage" and BIMCO weather adjudication yielding exactly **$112,000** in tests from start.

---

## 7. Tech stack

| Layer | Choice | Status | Rationale |
|---|---|---|---|
| **Backend** | FastAPI (Python 3.11) | ✅ Implemented | Async, type-safe, fast API prototyping. |
| **Validation** | Pydantic v2 | ✅ Implemented | Strict JSON schema structure for LLM and engine. |
| **Parsing** | pdfplumber & PyMuPDF | ✅ Implemented | pdfplumber for tables and bboxes, PyMuPDF for text speed. Dispatcher routes by filename. |
| **LLM** | OpenAI `gpt-4o` (configurable via `OPENAI_MODEL` / `OPENAI_BASE_URL`) | ✅ Implemented | Structured outputs with strict json_schema. Supports NVIDIA NIM swap. Retry with backoff (3 attempts). |
| **Weather** | JSON Fixture (v1), Open-Meteo (v2 planned) | ✅ Fixture done | Port weather observations for deterministic adjudication. |
| **Engine** | Pure Python state machine | ✅ Implemented | Laytime calculator with NOR, turn time, SHEX, once-on-demurrage, weather pause. |
| **Persistence** | SQLite + SQLAlchemy (store.py) | ✅ Implemented | Voyage CRUD with JSON blob storage. In-memory status tracking. Auto-migration for schema changes. |
| **Adapters** | Response adapters (adapters.py) | ✅ Implemented | Converts internal Pydantic models to frontend-expected JSON shape. |
| **Letter** | Jinja2 HTML template (letter/render.py) | ✅ Implemented | Settlement letter with day-by-day adjudication table and reconciled totals. |
| **Pipeline** | Orchestrator (pipeline.py) | ✅ Implemented | End-to-end: parse → extract → calculate (×2) → reconcile. LLM result caching. Background task support. |
| **Frontend** | Next.js 15 (App Router) | ✅ Implemented | Enterprise SaaS shell with sidebar, dashboard, voyage detail, reconciliation, letter preview. |
| **UI Styling** | Tailwind + shadcn/ui | ✅ Implemented | Custom dark theme using deep navy and jewel-tone accents. |
| **PDF render** | react-pdf | ✅ Implemented | Bounding-box highlight overlays for UI citations. |
| **Tooling** | `uv` & `pnpm` | ✅ In use | Fast package managers. |

### Explicitly rejected (hackathon)
- **LangChain / LlamaIndex**: Too heavy/unstable for an 8-hour build.
- **OCR pipelines**: Stick to text-based PDFs to avoid parsing issues.
- **Streamlit**: Looks unprofessional for venture-backed enterprise SaaS.
- **Postgres / Docker**: Too heavy for hackathon; **planned for Phase 1 alpha** (see §13).

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Next.js — Enterprise SaaS Shell                                         │
│                                                                          │
│  ┌──────────┐  ┌──────────────────────────────────────────────────────┐  │
│  │ Sidebar  │  │ Main Content Area                                    │  │
│  │          │  │                                                      │  │
│  │ Dashboard│  │  /login           → Auth page (mock)                 │  │
│  │ Voyages  │  │  /dashboard       → Stats + voyages table            │  │
│  │ Recon.   │  │  /voyages/[id]    → Charterparty + calculations      │  │
│  │ Reports  │  │  /voyages/[id]/reconcile → Day verdicts + $112K      │  │
│  │ Settings │  │  /voyages/[id]/letter    → Claim letter preview      │  │
│  │          │  │                                                      │  │
│  │ ──────── │  │  Upload dialog (modal) triggered from dashboard      │  │
│  │ User     │  │                                                      │  │
│  │ Logout   │  └──────────────────────────────────────────────────────┘  │
│  └──────────┘                                                            │
└────────────────────────────┬─────────────────────────────────────────────┘
                             │ REST (JSON)
┌────────────────────────────▼─────────────────────────────────────────────┐
│ FastAPI                                                                   │
│  /upload  /extract  /calculate  /reconcile  /letter                       │
└──┬─────────────┬─────────────────┬─────────────────┬─────────────────────┘
   │             │                 │                 │
   ▼             ▼                 ▼                 ▼
┌────────┐  ┌──────────────┐  ┌─────────────┐  ┌──────────────────┐
│ Parser │  │ LLM Extractor│  │ Engine      │  │ Weather Provider │
│ pdfplum│─▶│ OpenAI +     │─▶│ State       │  │ Fixture JSON v1  │
│ber/Py- │  │ json_schema  │  │ machine     │  │ Open-Meteo v2    │
│ MuPDF  │  │ (no math!)   │  │ Audit trace │  │ Returns: hourly  │
└────────┘  └──────────────┘  └──────┬──────┘  │ weather records  │
                                     │         └─────────┬────────┘
                                     │                   │
                                     ▼                   │
                            ┌──────────────────┐         │
                            │ Reconciler       │◀────────┘
                            │  1. Field diff   │
                            │  2. Per-day      │
                            │     adjudicator  │◀──┐
                            │     w/ BIMCO 2013│   │
                            └────────┬─────────┘   │
                                     │             │
                                     ▼             │
                            ┌──────────────────┐   │
                            │ Rule Library     │───┘
                            │ BIMCO 2013       │
                            │ (evaluators)     │
                            └──────────────────┘
```

### Strict separation of concerns
- **Parsing**: bytes → text + table cells + bboxes.
- **Extraction**: text → structured Pydantic models. No math.
- **Weather**: port + dates → hourly observations.
- **Engine**: structured models → audit trace. Deterministic.
- **Rule library**: evaluates clauses against (clause, SOF, weather) → `(winner, justification, citations)`.
- **Reconciliation**: two traces + weather + rules → verdicts.
- **Presentation**: trace + reconciliation → UI.

---

## 8. Repository layout (actual)

```
keel/
├── apps/
│   ├── api/                          # FastAPI service
│   │   ├── keel_api/
│   │   │   ├── main.py               # API entrypoint — /healthz, /voyages, /voyages/{id}, /reconciliations, /voyages/{id}/letter
│   │   │   ├── schemas.py            # Pydantic models (§9 contracts + WeatherSummary)
│   │   │   ├── pipeline.py           # Pipeline orchestrator — parse → extract → calculate → reconcile
│   │   │   ├── adapters.py           # Response adapters — internal Pydantic → frontend JSON shape
│   │   │   ├── store.py              # SQLite persistence via SQLAlchemy — voyage CRUD + in-memory status
│   │   │   ├── database.py           # Legacy DB module (superseded by store.py, candidate for removal)
│   │   │   ├── parsing/              # pdfplumber + PyMuPDF wrappers
│   │   │   │   ├── dispatcher.py     # Routes PDFs by filename → correct parser
│   │   │   │   ├── pdfplumber_parser.py  # Tables + bboxes
│   │   │   │   ├── pymupdf_parser.py     # Fast prose text
│   │   │   │   └── models.py         # ParsedDocument model
│   │   │   ├── extraction/           # GPT-4o fact extraction
│   │   │   │   └── extractor.py      # CharterpartyTerms, SOFEvents, claim amounts — with retry logic
│   │   │   ├── engine/               # Laytime state machine calculator
│   │   │   │   └── state_machine.py  # NOR → ON_LAYTIME → ON_DEMURRAGE with SHEX/weather pause
│   │   │   ├── weather/              # Port weather records provider
│   │   │   │   └── fixture_provider.py  # Fixture-backed WeatherProvider (Protocol compliant)
│   │   │   ├── rules/                # Codified BIMCO 2013 evaluators
│   │   │   │   └── evaluators.py     # WWD threshold logic (Beaufort ≥6 / precip ≥2mm/h)
│   │   │   ├── reconcile/            # Reconciliation layer
│   │   │   │   ├── adjudicator.py    # Day-by-day dispute adjudication (canonical + generic paths)
│   │   │   │   └── differ.py         # Identifies disputed weather-delay windows from SOF events
│   │   │   └── letter/               # Claim letter generation
│   │   │       └── render.py         # Jinja2 HTML settlement letter template
│   │   ├── tests/                    # pytest suite
│   │   │   ├── test_canonical.py     # End-to-end $112K assertion
│   │   │   ├── test_engine.py        # State machine unit tests
│   │   │   ├── test_bimco_rules.py   # BIMCO 2013 evaluator tests
│   │   │   ├── test_weather.py       # Weather provider tests
│   │   │   ├── test_extraction.py    # LLM extraction tests
│   │   │   ├── test_parsers.py       # PDF parser tests
│   │   │   ├── test_fixtures.py      # Fixture validation tests
│   │   │   ├── test_delete.py        # Voyage deletion tests
│   │   │   └── test_healthz.py       # Health check tests
│   │   └── keel.db                   # SQLite database file (gitignored)
│   └── web/                          # Next.js 15 App
│       ├── app/
│       │   ├── (auth)/login/         # Enterprise login page
│       │   ├── (dashboard)/
│       │   │   ├── dashboard/        # Dashboard with stats + voyages table + upload modal
│       │   │   ├── voyage/[id]/      # Voyage detail → reconcile → letter
│       │   │   ├── voyages/          # Voyages list page
│       │   │   ├── reconciliations/  # Reconciliations list page
│       │   │   └── reports/          # Reports page
│       │   └── api/                  # Next.js API proxy routes
│       ├── components/
│       │   ├── AppSidebar.tsx         # Enterprise sidebar navigation
│       │   ├── PdfViewer.tsx          # PDF viewer with bbox highlight overlays
│       │   └── ThemeToggle.tsx        # Dark/light mode toggle
│       └── package.json
├── fixtures/voyage_001/              # Canonical demo fixtures
│   ├── charterparty.pdf              # CP with BIMCO 2013 weather clause
│   ├── sof_owner.pdf & sof_charterer.pdf  # Divergent SOFs
│   ├── claim_owner.pdf & claim_charterer.pdf  # $187K vs $62K
│   ├── weather_port_xyz.json         # 72h hourly port weather (Force 5/4/7)
│   ├── extracted_*.json              # Cached LLM extraction outputs
│   └── expected_reconciliation.json  # Golden reference for assertions
└── docs/
    ├── prd.md                        # This document
    └── tickets/                      # Hackathon task tracker
```

---

## 9. Key data contracts

These schemas are the contracts between layers. Lock them early.

### 9.1 Extraction output (LLM → engine)

```python
class ClauseCitation(BaseModel):
    page: int
    bbox: tuple[float, float, float, float]
    text: str

class SourceCitation(BaseModel):
    page: int
    bbox: tuple[float, float, float, float]
    row_text: str

class CharterpartyTerms(BaseModel):
    vessel: str
    charterer: str
    owner: str
    load_port: str
    load_port_lat: float
    load_port_lon: float
    laytime_allowance_hours: float
    demurrage_rate_per_day_usd: float
    despatch_rate_per_day_usd: float
    nor_turn_time_hours: float           # typically 6 or 12
    laytime_exception: Literal["SHEX", "FHEX", "SHINC"]
    weather_clause: Literal["WWD", "WWDSHEX", "none"]
    rule_authority: Literal["BIMCO_2013", "VOYLAYRULES_93", "custom"]
    clauses: list[ClauseCitation]

class SOFEvent(BaseModel):
    timestamp: datetime
    event_type: Literal[
        "NOR_TENDERED", "NOR_ACCEPTED",
        "LOADING_START", "LOADING_END",
        "WEATHER_DELAY_START", "WEATHER_DELAY_END",
        "SHIFTING", "COMPLETED",
    ]
    description: str
    source: SourceCitation
```

### 9.2 Weather record (provider → adjudicator)

```python
class WeatherCitation(BaseModel):
    source: str                          # e.g. "Open-Meteo Archive" or "fixture"
    observation_id: str                  # internal id for traceability

class WeatherObservation(BaseModel):
    timestamp: datetime                  # hourly
    wind_force_beaufort: int
    wind_speed_knots: float
    precipitation_mm_per_hour: float
    operations_prevented: bool           # provider's threshold evaluation
    citation: WeatherCitation

class WeatherProvider(Protocol):
    def get(self, port_lat: float, port_lon: float,
            start: datetime, end: datetime) -> list[WeatherObservation]: ...
```

### 9.3 Audit trace (engine → UI)

```python
class AuditEntry(BaseModel):
    seq: int
    timestamp: datetime
    state: Literal["BEFORE_NOR", "ON_LAYTIME", "WEATHER_PAUSE", "ON_DEMURRAGE"]
    rule_applied: str                    # e.g. "SHEX: Sunday excluded"
    clause_citation: ClauseCitation | None
    sof_citation: SourceCitation | None
    laytime_consumed_hours: float
    running_total_usd: float

class CalculationResult(BaseModel):
    voyage_id: str
    party: Literal["owner", "charterer"]
    laytime_used_hours: float
    demurrage_due_usd: float             # negative if despatch owed
    trace: list[AuditEntry]

# Additional schema added during implementation:

class WeatherSummary(BaseModel):
    peak_wind_force_beaufort: int
    peak_precipitation_mm_per_hour: float
    adverse_hours: float
    total_observed_hours: float
```

### 9.4 Reconciliation output (with per-day adjudication)

```python
class Verdict(BaseModel):
    winner: Literal["owner", "charterer", "split"]
    justification: str                   # plain-language reasoning
    rule_id: str                         # e.g. "BIMCO_2013.WWD.threshold"
    rule_authority: Literal["BIMCO_2013", "VOYLAYRULES_93", "custom"]
    hours_credited_to_owner: float       # net laytime time added back
    dollars_credited_to_owner_usd: float

class DisputedLineItem(BaseModel):
    description: str                     # "Weather exception, June 14"
    disputed_date: date
    owner_position: str                  # "Exception does not apply: Force 5 below WWD threshold"
    charterer_position: str              # "Exception applies: SOF logs 12h weather delay"
    owner_amount_usd: float               # what owner asks for on this day
    charterer_amount_usd: float           # what charterer asks for on this day
    verdict: Verdict
    clause_citations: list[ClauseCitation]
    sof_citations: list[SourceCitation]
    weather_citations: list[WeatherCitation]
    weather_summary: WeatherSummary | None = None  # Added: structured weather snapshot per disputed day

class Reconciliation(BaseModel):
    voyage_id: str
    owner_total_usd: float                # $187,000 in canonical demo
    charterer_total_usd: float            # $62,000 in canonical demo
    disputed_items: list[DisputedLineItem]
    reconciled_total_usd: float           # $112,000 in canonical demo
    rule_authority: Literal["BIMCO_2013", "VOYLAYRULES_93", "custom"]
```

---

## 10. Engine scope (v1)

**In scope** (verified against canonical fixture):
- NOR tender time + turn time (6h / 12h)
- Laytime commencement
- SHEX / FHEX / SHINC rules
- WWD exception & BIMCO 2013 weather evaluation:
  - **Demo approximation**: Wind Force ≥ 6 OR sustained rain ≥ 2mm/h as a simplified illustrative threshold.
  - **Production note**: BIMCO 2013 Definitions 15–18 define four distinct WWD formulations with different calculation methods (pro-rata exclusion, actual interruption, artificial 24h day). The production engine must support configurable thresholds per CP clause. Fixed Beaufort thresholds are not specified by BIMCO.
  - Operation-prevention check (actual delay corroboration).
- "Once on demurrage, always on demurrage" (non-negotiable).
- Despatch (50% of demurrage rate).

**Out of scope** (planned for Phase 1–2 expansion):
- Reversible laytime, multi-port, multi-hatch pooling.
- Custom port holiday calendars.
- Berth vs. anchorage NOR validity disputes.
- Alternate rule authorities.

---

## 11. 8-hour execution plan — COMPLETED

**Pre-hour-0:** Pre-generate canonical `voyage_001` files. ✅

### Person A — Backend / Engine
| Hour | Task | Status |
|---|---|---|
| 0–1.5 | FastAPI scaffold. Write **canonical assertion test** (`reconciled_total_usd == 112_000`). Start extraction schema. | ✅ A-01, A-02 done |
| 1.5–3.5 | Implement laytime state machine (NOR, turn time, SHEX, once-on-demurrage). Output $187K and $62K trace states. | ✅ A-05 done |
| 3.5–5.5 | Integrate weather provider + BIMCO 2013 weather exception rule evaluator. Run day-by-day reconciliation. | ✅ A-06, A-07 done |
| 5.5–7 | Build Claim Letter generator (Jinja2 HTML print template). | ✅ Letter renderer done |
| 7–8 | Integration bug-fixing, manual test support. | ✅ Pipeline wired end-to-end |

### Person B — Frontend / UX
| Hour | Task | Status |
|---|---|---|
| 0–1.5 | Next.js, tailwind & shadcn setup. Core login and design tokens. | ✅ B-01, B-02 done |
| 1.5–3.5 | App shell sidebar & dashboard page with upload modal (supporting multi-party files). | ✅ B-03, B-04, B-05 done |
| 3.5–5.5 | Voyage detail page showing CP terms, calculations, and aligned SOF timeline. | ✅ B-06, B-07 done |
| 5.5–7 | Reconciliation view displaying day-by-day dispute cards, weather observations, and adjudicated $112K total. | ✅ B-08, B-09 done |
| 7–8 | Final letter download and demo presentation script polish. | ✅ B-10, B-11, B-12 done |

### Implementation notes
- **A-08 (Reconciliation differ + adjudicator)**: Tracker shows open, but reconciliation logic is fully implemented in `pipeline.py` (generic path) and `reconcile/adjudicator.py` (canonical path). The reconciliation was integrated directly into the pipeline rather than as a separate wired step.
- **J-02, J-03 (API contract & canonical assertion)**: Not formally checked off in tracker, but the full pipeline runs end-to-end and the frontend consumes API data correctly.
- **database.py vs store.py**: Two persistence modules exist. `store.py` is the active one used by `main.py`. `database.py` is legacy dead code from an early approach — should be removed in Phase 1.
- **CORS**: Currently `allow_origins=["*"]` — acceptable for demo, must be locked down in Phase 1.

---

## 12. Demo script (target 90 seconds)

> "This is Keel — a claims intelligence platform for maritime demurrage. We help analysts resolve disputes faster with auditable, rule-based analysis.
>
> *[Show login screen → dashboard]*
>
> An analyst receives a $187,000 demurrage claim. They upload the charterparty, both statements of facts, and the owner's claim into Keel.
>
> *[Drag CP, SOF files, weather logs]*
>
> Keel's LLM extracts clauses and timelines without hallucinating numbers. We see the owner claims $187,000, while the charterer's position is $62,000. They disagree on weather exceptions for June 14, 15, and 16.
>
> *[Open Reconciliation View]*
>
> Keel cross-references logs against port weather records under BIMCO 2013 definitions:
> - On June 14 & 15, winds were Force 4/5 — below the WWD threshold. The evidence supports the **Owner's** position.
> - On June 16, Force 7 winds + heavy rain halted operations. The evidence supports the **Charterer's** position.
>
> *[Highlight recommended total: $112,000]*
>
> Keel identifies a defensible position at **$112,000** with full auditability. We click 'Generate Claim Letter' and instantly produce a formal response citing the clauses, weather data, and supporting analysis. What takes days of analyst spreadsheet work happens in seconds."

---

## 13. Post-hackathon roadmap — Enterprise rewrite plan

### 13.1 Competitive landscape (as of mid-2026)

The demurrage software market is consolidating rapidly. Understanding where Keel fits — and where the gap remains — is critical for fundraising narrative and product strategy.

| Competitor | Focus | Recent moves | Keel's honest assessment |
|---|---|---|---|
| **Marcura (PortLog + Claims)** | High-volume claims processing for large operators; 2M+ voyages processed | Acquired HubSE (2025) and Shipdem (Feb 2026). Now offers both self-service software and fully managed claims services across tanker, dry bulk, and chemical segments. | **Strongest incumbent threat.** Services + software moat. Proprietary dataset of millions of settled claims. Keel's advantage: purpose-built rules engine with clause-level citations vs. Marcura's human-in-the-loop approach. |
| **Veson Nautical (IMOS X)** | Dominant commercial ops platform ($5K–15K/mo) | Launched "Claims CoCaptain" (May 2025): AI SOF parsing, side-by-side comparison, claims reconciliation — all inside the system of record. 1.1M claims worth $71B processed. | **Most dangerous for enterprise.** Veson already has the CP terms, vessel schedules, and user logins. If Veson adds weather corroboration inside IMOS, Keel's wedge narrows significantly. Keel's advantage: standalone tool accessible without IMOS license. |
| **BV / Burmester & Vogel** | Legacy laytime calculators (40+ years, 2M+ voyages) | Launched **SailFast** — AI extraction from "handwritten notes to scanned Port Logs," draft calculations in <60 seconds. Patent-pending extraction tech. Customers include ASR Group, UME Shipping, Titan America. | **Underestimated in previous versions of this PRD.** B&V has deep maritime data and is actively modernizing. Keel's advantage: reconciliation workflow and clause-level dispute analysis (B&V focuses on calculation, not dispute resolution). |
| **Windward** | Container D&D automation | Launched AI-powered D&D solution (Feb 2025) using GenAI to parse contracts and calculate costs. Reduced billing from 30+ days to under a minute. | Different segment (containers), same narrative. Validates market timing but not a direct competitor. |
| **Voyager Portal** | SOF parsing + contract clause testing | Active in AI-driven SOF analysis for charterers | **Closest competitor in approach.** Keel differentiates with structured reconciliation workflow and external weather corroboration. |
| **Base** | Port call and demurrage management for agents/principals | Growing in Mediterranean/European market | Agent-facing, not analyst-facing. Keel targets the analyst workflow directly. |
| **Dockflow** | Predictive logistics AI | Raised €1.4M (Dec 2025) | Early-stage, broad scope — not focused on claims resolution. |

> **Honest competitive assessment**: Keel's core workflow — document ingestion + AI extraction + side-by-side comparison + weather corroboration — is already being replicated by incumbents with existing customer relationships and proprietary data. The differentiation is **degree**, not **kind**. Keel's real moat will come from the **clause intelligence corpus** (proprietary database of clause variations, dispute outcomes, and analyst decisions) accumulated from pilot customers, not from the calculation or extraction features themselves.

**Key market trends driving Keel's thesis:**
- Industry moving from **"systems of record"** (spreadsheets) to **"systems of action"** (AI agents that process, evaluate, and resolve).
- TMV launched a **$200M maritime/logistics fund** (May 2026) — though this is a projection and should not be relied upon as validation.
- Nauta ($7M seed, Aug 2025), Dockflow (€1.4M, Dec 2025) show investor interest in adjacent logistics AI.
- Large operators (Cargill, major charterers) actively seeking AI partners for claims automation.

---

### 13.2 Phase 1 — Alpha hardening for VC demo & pilot customers (months 1–6)

Goal: Take the hackathon MVP from "demo-grade" to "enterprise-alpha" — robust enough for 2–3 pilot customers (SME operators, 5–50 vessels) and investor due diligence. *(Revised from 3 months to 6 months based on realistic scoping for a 2-person team.)*

#### 13.2.1 Backend architecture rewrite

The hackathon backend works end-to-end but has structural debt that must be resolved before production pilots.

**Database: SQLite → PostgreSQL**
| Current (hackathon) | Target (alpha) |
|---|---|
| SQLite via `store.py` with JSON blob storage | PostgreSQL with proper relational schema |
| Single `voyages` table with `data_json TEXT` column | Normalized tables: `voyages`, `charterparty_terms`, `sof_events`, `disputed_items`, `verdicts`, `audit_entries` |
| In-memory status tracking (lost on restart) | Persistent status tracking in DB |
| No multi-tenancy | Row-Level Security (RLS) with `tenant_id` on every table |
| Legacy `database.py` coexisting with `store.py` | Single unified persistence layer with SQLAlchemy 2.0 async |

**Task processing: BackgroundTasks → ARQ (lightweight async queue)**
| Current | Target |
|---|---|
| FastAPI `BackgroundTasks` (in-process) | ARQ with Redis broker (lighter than Celery; sufficient for Phase 1 scale). Plan Temporal/Inngest migration in Phase 2 for HITL workflow pauses and complex branching. |
| No task visibility or retry | Task status API + WebSocket/SSE for real-time progress. Dead-letter queue for failures. |
| Pipeline blocks on LLM timeouts (30s hard limit) | Configurable timeouts with exponential backoff via `tenacity` |
| Temp files in `/tmp` for uploaded PDFs | Object storage (S3/R2) with presigned URLs for frontend access |

**Observability: Zero → Production-grade**
- OpenTelemetry instrumentation for distributed tracing across pipeline stages.
- Structured logging (JSON) with correlation IDs per voyage processing run.
- Prometheus metrics: pipeline latency (p50/p95/p99), LLM token usage, extraction accuracy.
- Sentry for error tracking and alerting.

**API hardening:**
- Replace `allow_origins=["*"]` CORS with explicit origin allowlist.
- Add request validation middleware (rate limiting, payload size limits).
- API versioning (`/api/v1/`) for stable contracts.
- Authentication via JWT (Supabase Auth or Auth0) with tenant-scoped claims, refresh token rotation, CSRF protection.
- Implement tenant isolation at **both** application layer (ORM query filters on every query) and database layer (RLS). Do not rely on RLS alone — connection pool leaks in async environments can expose cross-tenant data if `set_config` is not reset.
- Remove dead code: `database.py`, orphaned canonical-path logic in `reconcile/adjudicator.py`.

**Semantic validation layer (new):**
- Range validation on LLM extractions: demurrage rate $1K–$200K/day, laytime allowance > 0, NOR before loading start.
- Cross-field consistency checks: timestamps must be chronologically ordered, rates must be positive.
- Confidence scoring per extracted field. Flag low-confidence extractions for manual review.
- Extraction outputs include document hash, model version, and prompt version for reproducibility.

**Immutable audit logging (new):**
- Every pipeline action (upload, extraction, calculation, assessment, override, letter generation) recorded with `user_id`, `tenant_id`, `timestamp`, `document_hash`, `model_version`, `rule_version`.
- Audit logs are append-only and immutable (WORM pattern). Not stored in SQLite in-memory — persisted to PostgreSQL with archival to object storage.
- Supports legal defensibility: full provenance chain from source document to final assessment.

#### 13.2.2 Document processing upgrade path

The hackathon uses text-based PDFs only. Real-world claims arrive as scanned documents, email attachments, and faxed SOFs. **B&V SailFast already handles "handwritten notes to scanned Port Logs" — Keel must close this gap to be competitive.**

| Stage | Approach | Timeline |
|---|---|---|
| **Alpha (Month 1–2)** | Keep pdfplumber + PyMuPDF for text PDFs. **Fail loudly on scanned documents** (detect and reject with clear error message rather than silently producing garbage). Add content-based document classification (LLM or heuristic) to replace filename routing — **P0, not optional**. | Week 1–4 |
| **Beta (Month 3–4)** | Integrate **Azure Document Intelligence** or **Google Document AI** for structured table extraction from scanned SOFs. Skip Tesseract entirely — it is inadequate for complex maritime tabular data (skewed scans, stamps, handwritten notes). | Week 8–16 |
| **GA (Month 5–6)** | Multimodal extraction: send page images to GPT-4o/Gemini for highest accuracy. Layout-aware models (LayoutLMv3 or Azure custom table training) for SOF timeline extraction — the LLM classifies events, not extracts tabular structure. | Week 18–24 |

**HITL verification step (P0 — new):**
- After LLM extraction, present extracted terms and timeline to the analyst for visual verification against the source document **before** the engine runs.
- Highlight low-confidence fields. Allow manual correction.
- This is non-negotiable: if the LLM misinterprets a timestamp by 12 hours (e.g., AM/PM confusion in a poorly formatted table), the engine will confidently produce a completely wrong dollar amount.

**LLM extraction improvements:**
- Move from single-call extraction to **chunked processing** for long charterparties (>12K chars currently truncated).
- Add **golden dataset evaluation**: curate 20+ real CP/SOF pairs, measure extraction accuracy before every model or prompt change. Run nightly in CI to detect extraction regressions from prompt drift or model version changes.
- Support model fallback chain: GPT-4o → GPT-4o-mini → cached fixture (graceful degradation).
- Batch API for non-latency-sensitive reprocessing (cost reduction: ~50%).

**Citation robustness (new):**
- In addition to bounding box coordinates, store the exact raw text string and surrounding context for each citation.
- Use fuzzy text matching on the frontend as a fallback when bbox coordinates don't align (common with scanned/skewed documents).
- Store content-addressable hashes of cited clauses — page numbers alone break when CP amendments change pagination.

#### 13.2.3 Weather provider upgrade

The hackathon uses fixture JSON. Production requires credible weather evidence.

> **Critical limitation**: Open-Meteo ERA5 reanalysis uses ~31km grid cells. In arbitration, opposing counsel will challenge this: "Our anemometer at the berth read Force 5, your satellite data says Force 6." BIMCO weather exceptions require evidence that weather **actually prevented operations**, often judged by port authority logs or local meteorological station data — not interpolated reanalysis grids.

| Provider | Approach | Notes |
|---|---|---|
| **Open-Meteo Historical Weather API** | Free, ERA5 reanalysis data back to 1940. Request `wind_speed_10m` + `precipitation` hourly. Convert wind speed (m/s) to Beaufort programmatically. | **Corroboration source**, not definitive evidence. Useful for initial screening. No API key needed. |
| **Port authority logs / user uploads** | Allow analysts to upload official port meteorological logs (PDF or structured data). These carry legal weight in arbitration. | **Primary evidence source for disputes.** P1 priority. |
| **DTN/Meteogroup or Visual Crossing** | Commercial, port-specific historical weather with station-level resolution. | Evaluate for Phase 1 if pilot customers need higher-fidelity automated data. |
| **Open-Meteo Marine Weather API** | Adds wave height, period, ocean current — useful for anchorage/berth disputes. | Phase 2 enrichment. |

Implementation: `WeatherProvider` Protocol already defined in `schemas.py`. Add `OpenMeteoWeatherProvider` class implementing the same interface. Feature-flag to toggle between fixture, Open-Meteo, and uploaded port logs. **Allow analyst manual override of weather assessments with justification logged to audit trail.**

#### 13.2.4 BIMCO rule library expansion

The hackathon implements a simplified BIMCO 2013 WWD approximation (Beaufort ≥ 6 threshold). **This is an illustrative demo threshold, not a complete BIMCO 2013 implementation.** BIMCO 2013 actually defines four distinct WWD formulations:

| BIMCO Definition | Key Mechanic |
|---|---|
| **Def 15: Weather Working Day** | Pro-rata exclusion: interruption duration ÷ working hours × 24h |
| **Def 16: WWD of 24 Consecutive Hours** | Actual interruption duration excluded from laytime |
| **Def 17: WWD of 24 Hours** | Artificial day of 24 working hours; interruption excluded from working hours only |
| **Def 18: (Working Day) Weather Permitting** | Same as Def 16 |

Phase 1 must implement at least Definitions 15 and 16 correctly. Weather thresholds must be **configurable per CP clause** (not hardcoded), because BIMCO does not specify fixed Beaufort thresholds — weather exceptions depend on cargo type, port working hours, and whether operations were actually prevented.

| Rule | Priority | Complexity |
|---|---|---|
| **BIMCO 2013 Def 15 + 16** (correct WWD formulations, configurable thresholds) | P0 — Month 1–2 | Medium — replace simplified threshold with proper formulations |
| **Custom holiday calendars** (port-specific public holidays) | P0 — Month 1 | Low — data table + date lookup |
| **FHEX** (Fridays excluded — Middle East/Gulf ports) | P0 — Month 1 | Low — extend `_eligible_laytime_hours` weekday check |
| **WIBON** (Whether In Berth Or Not) NOR validity | P1 — Month 3 | Medium — affects laytime start logic |
| **VOYLAYRULES 1993** | P1 — Month 3–4 | Medium — different threshold definitions |
| **Reversible laytime** (load + discharge combined) | P2 — Month 5–6 | High — requires multi-port voyage model |
| **Multi-hatch / multi-grade cargo** | P2 — Month 5+ | High — parallel laytime streams |

> **Legal validation**: Before shipping any BIMCO rule implementation to pilot customers, consult a maritime lawyer to validate the codification. Incorrect rule application that leads a client to an indefensible position is a liability risk.

Architecture: Refactor `rules/evaluators.py` into a rule registry pattern. Each rule is a self-contained evaluator class with:
- `rule_id: str` (e.g., `BIMCO_2013.WWD.def15`)
- `evaluate(observations, terms, window) → RuleResult`
- `cite() → list[ClauseCitation]`
- Design for extensibility: eventual evolution toward a rules DSL or directed acyclic graph (DAG) evaluator to avoid if/else combinatorial explosion as clause coverage grows.

#### 13.2.5 Multi-tenancy & access control

| Concern | Approach |
|---|---|
| **Tenant isolation** | PostgreSQL RLS with `tenant_id` **plus** application-layer ORM query filters on every query. Do not rely on RLS alone in async environments — connection pool reuse can leak tenant context if `set_config` is not properly reset. Middleware must validate JWT claims and set tenant context before every query. |
| **Auth** | JWT tokens with `tenant_id` + `role` claims. Supabase Auth or Auth0 for managed identity. Implement refresh token rotation and CSRF protection for the Next.js frontend. |
| **Roles** | `analyst`, `admin`. In V1 (single-player), role determines document visibility. In V2 (multi-party), a `voyage_participants` junction table linking `voyage_id`, `tenant_id`, and `party_role` (Owner/Charterer) enables many-to-many access control. |
| **Audit trail** | Immutable event log: every action (upload, extraction, assessment override, letter generation) recorded with `user_id`, `tenant_id`, `timestamp`, `document_hash`, `model_version`, `rule_version`. Append-only storage (WORM pattern). |

#### 13.2.6 Frontend alpha improvements

- **HITL extraction review UI (P0)**: After LLM extraction, present extracted terms side-by-side with the source document. Highlight low-confidence fields. Allow manual correction before engine runs.
- **Real-time pipeline status**: WebSocket or SSE for live progress updates during pipeline processing (replace polling).
- **Assessment override UI**: Allow analysts to manually override a weather assessment with justification — logged to audit trail.
- **Multi-voyage dashboard**: Filtering, sorting, search across all voyages. Status workflow: Processing → In Review → Reconciled → Closed.
- **Export**: PDF letter download, CSV export of audit trace, Excel export of reconciliation summary.
- **Responsive design**: Ensure usability on tablets (claims analysts frequently use iPads in port offices).

#### 13.2.7 Deployment architecture

| Component | Platform | Rationale |
|---|---|---|
| **Frontend** | Vercel (Next.js optimized) | Zero-config CI/CD, global CDN, ISR support. |
| **API** | Railway or Fly.io (Docker container) | Long-running pipeline tasks need containers, not serverless. |
| **Database** | Supabase (managed PostgreSQL with RLS) or Railway PostgreSQL | Built-in RLS, auth, and real-time subscriptions. |
| **Task broker** | Upstash Redis (serverless) or Railway Redis | Celery/ARQ broker. |
| **Object storage** | Cloudflare R2 or Supabase Storage | Uploaded PDFs and generated letters. |
| **Monitoring** | Sentry + Posthog | Error tracking + product analytics. |

**CI/CD pipeline:**
- GitHub Actions: lint → test → build → deploy (staging) → smoke test → deploy (production).
- Canonical $112K assertion test runs on every PR as a gate.
- Database migrations via Alembic with automated rollback.

---

### 13.3 Phase 2 — Productization (months 4–9)

#### 13.3.1 Clause Intelligence Library
- Build a corpus of 500+ charterparty clause variations from pilot customer data.
- Fine-tune extraction models per clause category (laytime, demurrage, weather, NOR, SHEX/FHEX/SHINC).
- Auto-detect which rule authority applies from CP text (BIMCO 2013 vs. VOYLAYRULES 93 vs. custom).
- **Clause embedding search**: Given a new CP, find the most similar clauses in the library and suggest interpretation.

#### 13.3.2 Port Intelligence Layer
- Integrate **Marcura PortLog** or **Marine Traffic** API for port-stay event verification.
- Build **port behavior models**: historical average turnaround times, typical weather patterns, berth availability.
- Predictive demurrage risk scoring at fixture stage: "This voyage to Piraeus in June has a 35% chance of weather-related demurrage based on 5-year historical weather data."

#### 13.3.3 Agentic workflow engine
- Replace the linear pipeline with a **durable workflow orchestrator** (Temporal or Inngest).
- Support **human-in-the-loop** approvals: analyst reviews extractions before calculation, reviews verdicts before letter generation.
- **Email ingestion**: Claims arrive via email. An agent parses attachments, identifies document types, and routes them into the pipeline.
- **Automated follow-up**: Generate draft response letters, track dispute resolution status, send reminders for aging claims.

#### 13.3.4 Multi-party collaboration
- **Shared workspace**: Owner and charterer see the same voyage from their respective perspectives.
- **Dispute thread**: Threaded comments on specific verdict decisions. Each party can propose counter-arguments with evidence.
- **Settlement workflow**: Propose → Counter → Accept. Digital signature integration for settlement agreements.

---

### 13.4 Phase 3 — Scaling (months 10–18)

#### 13.4.1 Geographic expansion
- **Target markets** (in priority order):
  1. **Piraeus / Athens** (pilot) — Greek-owned fleet is ~19% of global capacity.
  2. **Singapore** — Major bunkering and transshipment hub.
  3. **Hamburg / Rotterdam** — European dry bulk and container trade.
  4. **Dubai / Fujairah** — Middle East tanker and LNG trade (FHEX rules critical).
  5. **Limassol** — Cyprus ship management hub.

#### 13.4.2 Pricing model

> **Pricing philosophy**: Keel replaces analyst time ($80K–$120K salary) and recovers disputed amounts ($50K–$150K per successful audit). Pricing must reflect financial impact, not seat count. Underpricing signals "toy" in maritime enterprise — Greek operators pay $5K–$15K/month for Veson. **All pricing below requires validation with 5–10 target customers before commitment.**

| Tier | Target | Price | Includes |
|---|---|---|---|
| **Starter** | SME operators (5–20 vessels) | $1,500/month | 50 voyages/month, 2 users, email support |
| **Professional** | Mid-market (20–100 vessels) | $3,500/month | 200 voyages/month, 10 users, API access, priority support |
| **Enterprise** | Large operators (100+ vessels) | Custom ($5K–$10K/mo) | Unlimited, SSO/SAML, dedicated CSM, SLA, on-prem option |
| **Per-claim pricing** | Consultancies / P&I clubs | $150–500/claim | Pay-per-use for low-volume, high-value disputes |
| **Success fee (pilot)** | Early adopters | Base + 1–2% of reconciled savings | Aligns revenue with demonstrated value; builds case studies |

*Competitive context: Veson IMOS is $5K–15K/month. Marcura charges per-claim processing fees. BV/legacy calculators are $50–200/month but offer no reconciliation. A $500/month tier would be 100x ROI on a single successful audit — too cheap to be trusted in this market.*

#### 13.4.3 Platform evolution
- **API-first**: Expose Keel's reconciliation engine as an embeddable API for other platforms (Veson, Danaos, etc.).
- **Marketplace**: Third-party rule evaluators (P&I clubs, law firms) can publish their own clause interpretation logic.
- **Clause intelligence corpus** (real moat): Proprietary database of charterparty clause variations, dispute outcomes, analyst decisions, and settlement patterns. "Clause X under BIMCO wording usually results in outcome Y" — this is the data asset that becomes increasingly difficult for competitors to replicate.
- **Benchmarking dataset**: Aggregated, anonymized reconciliation outcomes — "What is the typical weather exception outcome for June in Piraeus?" *(Note: Every claim is heavily contextual. Aggregated win rates are weak signals unless paired with clause-level and counterparty-level context. This is a supporting feature, not the primary moat.)*

---

## 14. Risks and mitigations

| Risk | Hackathon mitigation | Alpha mitigation (Phase 1) |
|---|---|---|
| Engine yields wrong numbers on stage | ✅ Canonical test with strict $112K assertion. Pre-cached LLM extractions. | CI gate: canonical assertion + golden dataset regression suite (20+ real voyages). Property-based tests for timezone, midnight crossings, DST. |
| LLM extraction is non-deterministic | ✅ `temperature=0`, strict `json_schema`, cached fixture extractions as fallback. | Golden dataset evaluation framework (nightly CI). Confidence scoring + semantic validation (range checks, cross-field consistency). HITL verification before engine runs. Model fallback chain (GPT-4o → mini → cache). |
| LLM extraction is semantically wrong | Not mitigated in hackathon. | Semantic validation layer: range validation, cross-field consistency checks. HITL review UI. Document hash + model version in audit trail for reproducibility. |
| Port weather data lacks legal weight | ✅ Fixture JSON offline source. | Open-Meteo as corroboration (not definitive evidence). Support uploaded port authority logs as primary evidence. Allow analyst manual override with justification. Evaluate paid port-specific providers (DTN/Meteogroup). |
| BIMCO 2013 rules are oversimplified | ✅ Narrow scope to simplified threshold for demo. | Implement Definitions 15 + 16 correctly with configurable thresholds. Maritime lawyer validation before pilot launch. |
| Complex clause math fails | ✅ Narrow scope to BIMCO 2013 for demo voyage. | Rule registry pattern with isolated evaluators. Each rule has unit tests against known outcomes. Design for eventual rules DSL/DAG. |
| Demo data doesn't match production reality | Canonical fixtures are synthetic. | Partner with 2–3 pilot customers for real anonymized voyage data. Build golden dataset. Fail loudly on scanned documents until OCR is integrated. |
| Scalability under concurrent load | Single-process uvicorn, SQLite. | PostgreSQL + ARQ workers. Load test with k6 before pilot launch. |
| Security / data isolation | `allow_origins=["*"]`, no auth. | JWT + dual-layer tenant isolation (app-level ORM filters + RLS). Secrets management via environment variables + vault. EU-region deployment for data residency. |
| GDPR / regulatory compliance | Not addressed in hackathon. | Add data residency requirements (EU deployment). Draft DPA for pilot customers. Legal disclaimer on all automated assessments. Consult maritime lawyer for liability. |
| Legal liability from automated assessments | Not addressed in hackathon. | Advisory positioning: all outputs are "structured negotiation support, not legal advice." Prominent disclaimers in UI and generated letters. Avoid "verdict" / "adjudicate" language. |
| Competitor moves (Veson CoCaptain, B&V SailFast, Marcura) | Differentiated demo narrative. | Speed to market. Clause intelligence corpus from pilot data. FDE embedding + custom rule co-creation. Acknowledge that workflow differentiation is degree, not kind — real moat is proprietary clause data. |

---

## 15. Open questions

### Resolved (hackathon)
- ~~**Fixture validation**: Synthesize canonical `voyage_001` to match $187K / $62K / $112K exactly.~~ ✅ Done — fixtures validated, pipeline produces exact amounts.
- ~~**Weather JSON schema**: Match Open-Meteo's API shape for direct upgrade.~~ ✅ Schema is compatible. Open-Meteo returns `wind_speed_10m` (m/s) which maps to Beaufort via standard conversion table.
- ~~**Response document style**: Stick to standard CSS print-friendly HTML templates.~~ ✅ Jinja2 HTML template implemented in `letter/render.py`.

### Resolved (post-critique review)
- ~~**Document type detection**: Current parser routes by filename convention. Production needs content-based classification.~~ → **Promoted to P0 requirement** (§13.2.2). Content-based classification is non-negotiable for Month 1.
- ~~**Regulatory**: Does Keel's automated assessment generation create legal liability?~~ → **Yes.** Advisory positioning adopted throughout. All outputs carry disclaimers. "Verdict" replaced with "Assessment." Consult maritime lawyer before pilot launch.
- ~~**Pricing validation**: $500/month starter tier.~~ → **Raised to $1,500/month** based on value analysis ($50K–$75K savings per successful audit). Still requires validation with 5–10 target customers.

### Open (Phase 1)
- **Database migration strategy**: Start fresh with normalized PostgreSQL schema for alpha customers. Do not migrate JSON blobs.
- **LLM provider lock-in**: Current code supports OpenAI + NVIDIA NIM via `OPENAI_BASE_URL`. Should we add Anthropic Claude / Google Gemini as extraction providers for redundancy?
- **Holiday calendar data source**: BIMCO doesn't publish a machine-readable port holiday calendar. Options: scrape port authority sites, license from a maritime data provider, or crowdsource from pilot customers.
- **BIMCO 2013 validation**: Hire or consult a maritime lawyer to validate the codified rule implementations (Definitions 15–18) before pilot launch. Incorrect rule application is a liability risk.
- **5–10% write-down statistic**: Currently attributed to "Marcura" with no specific citation. Either find and cite the source, validate with primary data from pilot customers, or remove from investor materials.
- **OCR provider selection**: Azure Document Intelligence vs. Google Document AI vs. AWS Textract. Evaluate based on accuracy on real maritime SOF samples.
- **P&I club partnership**: Approach Standard Club or Gard for legal endorsement of BIMCO rule engine + access to historical dispute data (solves golden dataset problem).
- **Email ingestion timing**: Multiple critiques suggest email/Outlook integration should be Phase 1, not Phase 2, because Greek SME analysts live in Outlook — a web portal requiring manual PDF download is friction that kills adoption.
