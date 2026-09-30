# Keel — Product Requirements Document

**Status**: Hackathon MVP complete · This checkout runs the LangGraph pipeline in `pipeline_agents.py`
**Last updated**: 2026-09-30 (corrected against the tree at commit `0f657f6`)
**Owners**: 2-person team
**Build window**: 8 hours (completed) · Forward work lives in [`docs/continuation-plan.md`](continuation-plan.md)

> **Disagreement on the build window, annotated rather than reconciled.** This
> document says 8 hours (§ header above, §11, and the "8-hour execution plan"
> heading). The ticket documents say 12: `docs/tickets/README.md:5,28` and
> `docs/tickets/tracker.md:5,37` both describe a "12-hour hackathon build", and
> the ticket dependency graph and Gantt in `docs/tickets/README.md` run to hour
> 12 (A-10 and B-11 are `h10-12`, J-04 is `h11-12`). **Neither figure is
> verifiable from this checkout.** What is verifiable is that the two documents
> disagree, and that the ticket set is the more granular record: it schedules work
> through hour 12 while §11 here stops at hour 8. The ticket documents are
> history and are not rewritten to match this one; treat the true window as
> unestablished and pick the figure that matches whichever record you are citing.

### How to read this document

A PRD may describe a target. This one does, in places, and the build does not meet every target. Two conventions keep that honest:

- **Not built** — the capability does not exist in this checkout. No file implements it. It is a target.
- **Known gap** — the capability exists but is narrower than described here, and the code says so in its own docstring. The gap and its reason are recorded; they are not a specification the code meets.

Where an earlier version of this document asserted something the code does not do, the statement is corrected in place and the correction is marked. Nothing was deleted silently.

**Load-bearing legal source, corrected 2026-09-30.** The framework named throughout is the **Laytime Definitions for Charter Parties 2013** (BIMCO Special Circular No. 8). It is a list of numbered *definitions*, 1–33, not a set of numbered clauses — there is no "§6". Its weather provisions are definitions 15, 16, 17 and 18. It sets **no numeric weather threshold of any kind**: it contains no occurrence of "Beaufort", "wind", "precipitation" or "threshold", and no occurrence of "SHEX", "SHINC" or "FHEX". Anything in this repository that attributes a numeric weather threshold to BIMCO is wrong, and the code was corrected to stop doing it (§9.4, §10).

---

## 1. Product summary

**Keel** is a Claims Intake & Audit Intelligence Platform for maritime demurrage. An analyst uploads claim documents — charterparty, statements of facts, and the counterparty's claim — and Keel cross-references them against port weather records, extracts structured facts with an LLM, runs a deterministic calculation engine, and **assesses** each disputed day against the charterparty's own weather clause, using the Laytime Definitions only to fix *how an excepted period is measured*. Keel outputs a structured reconciliation report and a claim letter carrying the reconciled amount. Every number is traceable to a charterparty clause, an SOF row, or a weather record. Outputs are advisory negotiation support — Keel accelerates dispute resolution, it does not replace legal judgment.

**One-line pitch**: *"The owner claims $187K. Keel identifies a defensible position at $112K — with every disputed line cited to source."*

**The canonical demo (Section 5) is the north star.** Every architectural decision in this document exists to make that exact scenario execute flawlessly on stage.

---

## 2. Why this exists

### 2.1 The Demurrage Audit Opportunity

Standard laytime calculators are highly commoditized. Basic deterministic calculations have been solved by software since the 1980s. Additionally, the SME demurrage calculator space is heavily saturated:
- The SME demurrage market is already served by mature, freemium/low-cost calculators like Burmester & Vogel (40+ years, 2M+ voyages), Danaos (deeply embedded in Greek/Cypriot operators), Heisenberg Shipping, and SeaRates.
- Enterprise incumbents are moving downward into self-service. *(The specific acquisition claims in the earlier draft of this bullet — "Marcura acquired HubSE (2025) and Shipdem (Feb 2026)" — were **not** re-verified and are unsupported here. What is verified: Marcura and Dataloy announced an expanded partnership exposing Marcura Claims, DA-Desk and Portlog inside Dataloy's VMS, with claims calculations triggered from port events and synced to the voyage record.)*
- The **deterministic math engine is table stakes**, not a moat.

### 2.2 The Keel Focus: Adversarial Reconciliation

What is **not** commoditized is the **pre-processing chaos and the adversarial gap between parties**. Owners send claims based on their interpretation of the SOF; charterers dispute them based on theirs. The dispute lives in clause interpretation and SOF timestamp differences. ~~Industry estimates suggest 5–10% of total demurrage value is written down due to contract-term ambiguity.~~ **[Unverified — no citable source. The same unsourced figure is listed as an open question in §15; it is struck here rather than left standing as a statistic.]**

Keel's defensible wedge: **a single-player audit tool that lets one party ingest the counterparty's claim documents, automatically identify the specific clauses and timestamps where they diverge, and produce a structured reconciliation report with an audited counter-position**. The deterministic calculator becomes a verification primitive, not the headline feature. Multi-party collaboration (shared workspaces, dispute threads) is a target, not a plan; see [`docs/continuation-plan.md`](continuation-plan.md).

### 2.3 Why hackathon judges will care
- **Athens resonance**: Greek-owned fleet is a large share of global capacity and Piraeus is a European shipping hub. *(Unverified marketing context, not a claim about this build.)*
- **Visceral demo**: "Shipowner claims $187K. Charterer disputes. Keel reconciles to $112K, with every disputed line item cited to source." This one is testable — see §5.4 and `apps/api/tests/test_canonical.py`.
- **Honest AI story**: LLM extracts text into a schema. Math is deterministic. No hallucinated dollars. *(This architectural discipline is now table stakes across serious maritime AI vendors. Keel's differentiation must come from clause intelligence depth, not just the extraction/calculation split.)*

---

## 3. Users and use cases

### 3.1 Primary User (V1: Single-Player Audit)
Keel V1 is a **single-player audit tool**. One party uploads the counterparty's claim alongside their own documents to produce an audited reconciliation:
- **Charterer Demurrage Analyst** (primary V1 persona): Receives a claim from the owner. Uploads the owner's claim, both SOFs, the CP, and port weather data. Keel identifies discrepancies, assesses each disputed day against the charterparty's own weather clause, and generates a response letter carrying a defensible counter-position.
- **Owner Demurrage Analyst** (secondary V1 persona): Pre-audits their own claim before sending to ensure it cannot be disputed on weather grounds.

> **V1 design principle**: Keel must deliver full value to a single user without requiring the counterparty to create an account or upload anything. The counterparty's documents are uploaded *by* the user. Multi-party collaboration (shared workspaces, dispute threads, settlement workflows) is planned for Phase 2.

### 3.2 Core use case (hackathon demo scope)
1. **Upload**: Analyst drops voyage documents (Charterparty, Owner SOF, Charterer SOF, both claim PDFs, and a weather JSON) into Keel. **Not built in this checkout** — no source PDFs are bundled, so the demo runs on the voyage seeded at API start. See §8.
2. **Extract & Verify**: Keel extracts clauses and timelines via LLM. Analyst reviews extracted data against source documents before proceeding. **Not built** — there is no review screen and no correction path; this is step 1 of the continuation plan.
3. **Calculate & Assess**: Keel runs calculations under both owner and charterer interpretations side-by-side, then assesses each disputed day (June 14–16) against the charterparty's weather clause, with the port weather record as evidence and the Laytime Definitions fixing only the measurement basis.
4. **Document Generation**: Generates a claim letter carrying the reconciled total ($112K), each party's stated position per day, the assessment, and the credited figure.

> **Advisory positioning**: Keel's outputs are structured negotiation support — not legal advice, not an arbitration award, not a binding determination. The letter says so in its own footer (`apps/api/keel_api/letter/render.py`). All assessments carry that disclaimer.

### 3.3 Out of scope — and not built
Nothing in this list exists in the checkout. Each is stated so the gap is visible rather than implied.

| Capability | State | Where it would have to go |
|---|---|---|
| User accounts, sign-up, sessions | **Not built.** `apps/web/proxy.ts` is a demo stub whose first line reads `DEMO STUB — THIS IS NOT AUTHENTICATION`; it mints a published constant cookie. | Server-side session verification in the Next app, plus auth on the API. |
| API authentication | **Not built.** The API is anonymous by default. `KEEL_API_TOKEN` enables one shared secret with no identity, no expiry, no rotation, and no per-voyage check. | `AdmissionGuard` in `apps/api/keel_api/main.py` is the existing hook. |
| Email delivery of the letter | **Not built, and the UI says so.** "Send to Other Party" opens a dialog headed *Delivery Is Not Available* which states nothing was transmitted and nothing is queued. | A send path, behind a human sign-off gate. |
| PDF export of the letter | **Not built.** `GET /voyages/{id}/letter?format=pdf` returns **400** with "this endpoint serves HTML only and will not label HTML as a PDF". The UI's Download PDF button surfaces that refusal; Print → Save as PDF is the documented path. | A real renderer. |
| Live weather data | **Not built.** `keel_api/weather/` contains exactly one provider, `FixtureWeatherProvider`, which reads `weather_port_xyz.json` from the voyage directory. | A second `WeatherProvider` implementation. |
| Multi-tenancy, RBAC, per-voyage authorisation | **Not built.** No tenant concept anywhere. | `store.py` schema change plus a policy layer. |
| Observability, rate limiting, deploy pipeline | **Not built.** | — |
| Compliance certifications | **Not built, not claimed, not planned in this document.** | — |

Also out of scope (unchanged): email ingestion and inbox connectors; multi-port voyages, multi-hatch or multi-grade cargo, reversible laytime; OCR (text-based PDFs only); Veson / Dataloy / SAP integrations; predictive port-delay analytics.

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
| **WWD (Weather Working Day)** | A charterparty drafting label, not a defined term with a fixed meaning. The 2013 Laytime Definitions contain four weather provisions — definitions 15, 16, 17 and 18 — which measure an interruption differently. Which one a given charterparty adopted is fixed by its own wording, not by the label: a bare `WWD` is genuinely ambiguous between definition 15 and definition 16. |
| **Beaufort Scale** | 0–12 wind scale. The threshold applied is **the charterparty's own term**, read off its text (`CharterpartyTerms.weather_beaufort_threshold`). The Laytime Definitions contain no wind force, no Beaufort figure and no numeric threshold of any kind, so nothing in this product attributes a threshold to BIMCO. When the extractor cannot read a figure, Keel falls back to a configured default (Force 6) and says on its face that the figure is Keel's and has not been verified against the document. |
| **BIMCO / 2013 Laytime Definitions** | Laytime Definitions for Charter Parties 2013, BIMCO Special Circular No. 8, 10 September 2013. In this build they are the authority for **one thing only**: how an excepted period is measured (`Verdict.measurement_basis` = "Laytime Definitions for Charter Parties 2013, definition 16"). They are not the authority for the weather threshold or for the test that invokes the exception; `Verdict.rule_authority` is `"custom"` on a weather assessment for exactly that reason. |
| **Assessment** | Keel's per-day output. It states which party's position is **better supported** on the evidence, in those words — the product's own language, deliberately not "verdict", "determination", "adjudication" or "finding of law". Assessments are recommendations, not legal determinations. |
| **Audit Trail / Citations** | Step-by-step record of calculation decisions. Each row carries a `sof_citation` naming the Statement of Facts row the engine read, and a `clause_citation` naming the charterparty clause where one applies. Rows that cite no clause say so rather than inventing one. |
| **Time bar** | The contractual deadline for presenting a demurrage claim with its supporting documents. In the forms verified in the continuation plan it runs from **completion of discharge** (commonly 60/90/180 days), not from laytime commencement. **Not implemented in this build.** |
| **FDE / Veson IMOS** | Full-time Deployed Engineer (a scaling model, not a feature). Veson IMOS is an incumbent commercial operations platform. |

---

## 5. Canonical demo scenario — the north star

This is the **single scenario** Keel must execute end-to-end on stage. Every fixture, rule, and UI element is built to make this work.

### 5.1 The story
> *"The shipowner claims $187,000. The charterer's counter-claim is $62,000. Keel reconciles the dispute to $112,000. The dispute centres on 3 specific days (June 14–16). Keel puts each day's port weather record against the charterparty's own weather threshold, and shows the owner's position is better supported on June 14 and 15 while the charterer's is better supported on June 16. Keel generates the claim letter with the reconciled total."*

Note what changed from the earlier draft of this sentence, and why. The old text said Keel "checks port weather records against BIMCO 2013 rules". It does not. The Laytime Definitions fix the *measurement* of an excepted period; the *threshold* and the *test* are the charterparty's own. Saying otherwise to a counterparty is exactly the error the letter's footer now disclaims.

### 5.2 Required inputs (fixtures)
The pipeline reads six files from a voyage directory. **In this checkout the five PDFs are absent** — only the JSON and the cached extractions are committed. `GET /voyages/voyage_001` is served from a voyage seeded at API start, not from a fresh upload.

| File | Present in repo | Read by |
|---|---|---|
| `charterparty.pdf` | **No** | `pipeline_agents.cp_worker_node` |
| `sof_owner.pdf`, `sof_charterer.pdf` | **No** | `pipeline_agents.sof_worker_node` |
| `claim_owner.pdf`, `claim_charterer.pdf` | **No** | `pipeline_agents.sof_worker_node` (claim amounts) |
| `weather_port_xyz.json` | Yes | `weather/fixture_provider.py` |
| `extracted_*.json` (5 files) | Yes | `pipeline_agents._all_extracts_cached` |
| `expected_reconciliation.json` | Yes | `main._expected_totals` (demo re-seed check only) |

Consequence, stated plainly: with the PDFs absent, an upload cannot be analysed, 16 tests fail, and the citation viewer cannot render a page. The UI states this rather than failing quietly.

### 5.3 The dispute, mechanically
- Demurrage rate: **$50,000 / day**
- Disputed windows: June 14 (12 h), June 15 (12 h), June 16 (36 h) = **60 hours = 2.5 days = $125,000 gap**
- **Owner's position**: Weather exception invalid (all 3 days count). Owner total = **$187,000**.
- **Charterer's position**: Weather exception valid (all 3 days excluded). Charterer total = **$62,000**.

### 5.4 The assessment, as the code actually produces it

Verified against `GET /voyages/voyage_001` on the running API. Every figure below is the live value.

| Date | Logged delay | Peak wind / precip | Hours at threshold | Assessment | Credited to owner |
|---|---|---|---|---|---|
| 2026-06-14 | 12 h | Bft 5, 0.4 mm/h | 0 of 12 | Owner position better supported | $25,000 |
| 2026-06-15 | 12 h | Bft 4, 0.1 mm/h | 0 of 12 | Owner position better supported | $25,000 |
| 2026-06-16 | 36 h | Bft 7, 5.6 mm/h | 36 of 36 | Charterer position better supported | $0 |

Reconciled: **$62,000 + $50,000 = $112,000**.

The test applied is `CP_WEATHER.MAJORITY_OF_HOURS` — a strict majority of the *observed hours* in the window must meet or exceed the threshold, **and** at least one qualifying hour must record that operations were prevented. No test is applied to the duration or continuity of the event itself — only to how many of the observed hours meet the figure. The measurement basis is reported separately as "Laytime Definitions for Charter Parties 2013, definition 16", and `rule_authority` is `"custom"`.

Threshold provenance is stated per day, on the face of the justification, in one of two forms:

- with a source: *"stated in the weather-exception clause (page 3) — this charterparty's own term"*;
- without one: *"Keel's configured default, which has not been verified against the charterparty text."*

> **Correction, 2026-09-30.** An earlier version of this section said "Force 5 wind, 12h logged delay. Below WWD threshold" for June 14 and "Force 7 wind + heavy rain, **24h** logged delay" for June 16, and framed the whole section around a weather threshold attributed to BIMCO. Two errors: the June 16 window is 36 hours, not 24; and the threshold is the charterparty's, not a ruleset's. A third error propagated into `docs/demo_workflow.md` and into the data contract in §9, which specified a `rule_id` in a `BIMCO_2013.*` namespace naming a WWD threshold, and an example `owner_position` of the shape "Exception does not apply: Force 5 below WWD threshold". Neither exists in the code; the exact literals are recoverable from `docs/prd.md` at commit `0f657f6`. The live rule id is `CP_WEATHER.MAJORITY_OF_HOURS`; the live `owner_position` is the full prose sentence built by `pipeline_agents._owner_position`.

### 5.5 What this scenario forces into the architecture
1. **Port weather** (`weather/fixture_provider.py`): hourly wind and precipitation for the disputed window. Fixture-backed only.
2. **Weather exception evaluator** (`rules/evaluators.py`): `evaluate_wwd_exception` returns a `WWDResult`, not an assessment. The graph's `adjudicator_node` turns that into per-day `DisputedLineItem`s.
3. **LangGraph adjudicator node** (`pipeline_agents.py`): day-by-day weather credits and the reconciled total. There is no `reconcile/` package in this tree; the earlier reference to `reconcile/adjudicator.py` is stale.
4. **DisputedLineItem schema** (`schemas.py`): assessments, justifications, and citations.

### 5.6 What the judges see (literal sequence)
1. **Login**: `/login` renders with the text "Demo credentials: demo@keel.io / any password". The button is *Enter Demo Mode* and it sets a cookie — **not a login**.
2. **Dashboard**: voyage list, stat cards, and the *New Voyage Analysis* button.
3. **Upload dialog**: the six-document checklist, and — because nothing is bundled — a second button, *Demo Mode*, which opens the seeded voyage. This is what the recording script uses.
4. **Voyage detail**: extracted charterparty terms, both audit traces, and the clickable citation panel.
5. **Reconciliation**: June 14/15/16 day cards, the per-day assessment, and the reconciled total.
6. **Letter**: the backend's own rendered notice.

---

## 6. Non-negotiable design rules

1. **LLM never calculates**: The LLM extracts clauses, terms, and timestamps into a schema. All money is computed deterministically in Python.
2. **Citations for every number**: Every running total in the audit trace carries the `sof_citation` it came from, and a `clause_citation` where a charterparty clause applies. A row that cites no clause says so explicitly — the UI's citation panel prints *"The API cited no charterparty clause for this step, so there is no clause text to quote."* (`app/(dashboard)/voyage/[id]/page.tsx:465-467`) rather than substituting one.
3. **Attribution discipline, and no verdict language**: An assessment must name the test applied, the clause it was read from, and the source that fixes the measurement — three separate claims, reported separately. **No source document may be named as the authority for a numeric weather threshold or for the share of hours that must meet it**, because no such source exists. Outputs say *assessment* and *position better supported*; they do not say *verdict*, *determination*, *adjudicated*, or *binding*. All outputs carry the advisory disclaimer.
4. **Pre-curated fixtures**: The stage demo uses only `voyage_001`.
5. **Engine tests first**: "Once on demurrage" and the $112,000 reconciliation are asserted in tests. `cd apps/api && uv run pytest -m canonical -q` → **15 passed**.

---

## 7. Tech stack

| Layer | Choice | Status | Rationale |
|---|---|---|---|
| **Backend** | FastAPI (Python ≥ 3.11) | ✅ Implemented | Async, type-safe, fast API prototyping. |
| **Validation** | Pydantic v2 | ✅ Implemented | Strict schema structure for LLM and engine. |
| **Parsing** | pdfplumber & PyMuPDF, in a subprocess sandbox | ✅ Implemented | pdfplumber for tables and bboxes, PyMuPDF for prose text. `parsing/dispatcher.py` routes by filename. `parsing/sandbox.py` runs the dispatch in a child process under `RLIMIT_AS`; `parsing/limits.py` caps the input at 200 pages, 1,200,000 extracted characters, 3,000,000,000 bytes of address space and 120 s. |
| **LLM** | OpenAI SDK structured outputs (`gpt-4o` by default; `OPENAI_MODEL` / `OPENAI_BASE_URL` override) | ✅ Implemented | Strict `json_schema` output, `temperature=0`, 3 retries with backoff. Swappable to an NVIDIA NIM endpoint. Prompt text is capped at 12,000 chars. |
| **Weather** | `FixtureWeatherProvider` only | ✅ Fixture only | `keel_api/weather/` contains one implementation. It reads `weather_port_xyz.json` and filters to a half-open `[start, end)` window. **A live provider is a target, not a plan.** |
| **Engine** | Pure Python state machine | ✅ Implemented | Laytime calculator with NOR, turn time, SHEX, once-on-demurrage, weather pause, and a full audit trace. |
| **Persistence** | SQLite via SQLAlchemy (`store.py`) | ✅ Implemented | One `voyages` table with a `data_json` blob, plus a denormalised `status` column for list queries. In-memory status tracking, lost on restart. `database.py` is legacy and unused. |
| **Adapters** | `adapters.py` | ✅ Implemented | Converts internal Pydantic models to the frontend's JSON shape. |
| **Letter** | Jinja2 HTML template (`letter/render.py`) | ✅ Implemented | Party positions, per-day assessment table, reconciled totals, and the attribution + advisory footer. HTML only. |
| **Pipeline** | LangGraph `StateGraph` in `pipeline_agents.py`, wrapper in `pipeline.py` | ✅ Implemented | Orchestrator → (charterparty worker ‖ SOF worker) → join → validator → laytime engine → adjudicator. Compiled once via `lru_cache`. `POST /voyages` runs the graph in a background task. **No checkpointer** — see the limitation note below. |
| **Frontend** | Next.js **16** App Router, React 19 | ✅ Implemented | `app/page.tsx` (public landing page), `app/(auth)/login`, `app/(dashboard)/dashboard`, `voyages`, `reconciliations`, `reports`, `voyage/[id]`, `voyage/[id]/reconcile`, `voyage/[id]/letter` — nine routes plus `/_not-found`. |
| **Route guard** | `apps/web/proxy.ts` | ⚠️ Demo stub | First line: `DEMO STUB — THIS IS NOT AUTHENTICATION`. Protects URLs from a casual visitor; protects no data. |
| **UI Styling** | Tailwind v4 + shadcn/ui + `lucide-react` | ✅ Implemented | — |
| **PDF viewer** | `react-pdf` + locally served `pdf.worker.min.mjs` | ⚠️ Implemented, cannot render here | Bounding-box highlight overlays are implemented, and the local worker avoids the CDN. But **no source PDF ships with this checkout**, so the viewer always shows its "no source PDF" state. The UI says so and states that page numbers and figures are unaffected. |
| **E2E** | Playwright | ✅ Implemented | `cd apps/web && pnpm exec playwright test` → **31 passed** (6 spec files, chromium). Requires the API on `127.0.0.1:8000`. |
| **Tooling** | `uv` & `pnpm` | ✅ In use | — |

### The checkpointer, stated plainly

`create_agent_pipeline` returns `workflow.compile()` with **no checkpointer argument** (`apps/api/keel_api/pipeline_agents.py:689`). The module docstring says why, and the reason is correct for the current design: a checkpointer-less graph keeps no per-run state, which is what makes one compiled instance safe to share across requests.

The consequence for planning: **an `interrupt()` inside this graph cannot currently resume.** A human-in-the-loop gate *inside* the graph therefore requires a checkpointer as a prerequisite, not as a nicety. A review gate *between* runs — the shape the continuation plan recommends first — does not.

### Orchestration in this repo

`run_voyage_pipeline` does not run the steps inline. It calls `run_agent_pipeline`, which invokes a LangGraph `StateGraph` compiled once per process:

1. Orchestrator stores a 1,000-character preview of each PDF. Workers ignore that preview and parse the full document, or load `extracted_*.json`.
2. Charterparty worker and SOF worker extract in parallel at the graph level. Claim-amount extraction sits in the SOF worker. Both call `extraction/extractor.py` (OpenAI SDK JSON schema), not LangChain.
3. Validator requires a vessel name and in-range load-port coordinates. Failure fans back out to **both** workers while `retry_count` is under 3, then the graph proceeds regardless. The errors are tagged by document and field so only the right prompt sees them; they are never fed to the model as raw error text.
4. Laytime engine node runs `LaytimeEngine` for owner and charterer. The adjudicator applies fixture weather and `evaluate_wwd_exception`. The LLM still does not calculate money.

### Explicitly rejected
- **LlamaIndex**, and LangChain chains for extraction. LangGraph is used only as the state graph.
- **OCR pipelines**: Stick to text-based PDFs to avoid parsing issues.
- **Streamlit**.
- **Postgres / Docker**: Not in this checkout. There is no `docker-compose.yml`.

### Routes as implemented

`apps/api/keel_api/main.py`:

| Method | Path | Notes |
|---|---|---|
| GET | `/healthz` | Token-exempt. |
| GET | `/voyages` | Voyage list. |
| POST | `/voyages` | Multipart `files`; starts a background run. Refuses oversize, wrong-type, and server-owned filenames. Concurrency capped at 4. |
| GET | `/voyages/{id}` | `{reconciliation, pdf_urls}`. 409 when the row exists but has no reconciliation. |
| GET | `/voyages/{id}/status` | Live pipeline status; falls back to what the stored row proves. |
| PATCH | `/voyages/{id}/status` | Manual status override. |
| DELETE | `/voyages/{id}` | Refuses the seeded demo voyage. |
| GET | `/reconciliations` | Paginated, filtered on the reconciled statuses. |
| DELETE | `/reconciliations/{id}` | Same as deleting the voyage. |
| GET | `/voyages/{id}/letter` | HTML only. `format=pdf` → 400. |

`pdf_urls` is **not** a serving path. `_pdf_urls` publishes `/static/{id}/{name}` as the *key* the frontend groups citations by, and the API serves no document bytes at all — the fixture tree is not served and an upload's working directory is deleted when its run ends.

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Next.js 16 — App Router                                                  │
│                                                                          │
│  ┌──────────┐  ┌──────────────────────────────────────────────────────┐  │
│  │Sidebar   │  │Main content                                          │  │
│  │          │  │/                 → public landing page               │  │
│  │          │  │                    (not a redirect)                  │  │
│  │Dashboard │  │/login          → demo-mode entry (not auth)          │  │
│  │          │  │/dashboard      → stats + voyage table + upload dlg   │  │
│  │Voyages   │  │/voyages        → list                                │  │
│  │          │  │/reconciliations→ paginated list                      │  │
│  │Recon.    │  │/reports        → aggregate panels                    │  │
│  │Reports   │  │                                                      │  │
│  │          │  │/voyage/[id]          → terms + audit traces          │  │
│  │          │  │/voyage/[id]/reconcile→ day cards + $112K             │  │
│  │User      │  │/voyage/[id]/letter    → letter preview               │  │
│  └──────────┘  └──────────────────────────────────────────────────────┘  │
│   proxy.ts guards every URL above except / and /login. It authenticates  │
│   nobody. There is no Settings item and no settings page.                │
└────────────────────────────┬─────────────────────────────────────────────┘
                             │ REST (JSON), CORS from http://localhost:3000
┌────────────────────────────▼─────────────────────────────────────────────┐
│ FastAPI                                                                 │
│  POST /voyages → background task → graph                                 │
└──┬─────────────┬─────────────────┬─────────────────┬────────────────────┘
   │             │                 │                 │
   ▼             ▼                 ▼                 ▼
┌────────┐  ┌──────────────┐  ┌─────────────┐  ┌──────────────────┐
│ Parser │  │ LLM          │─▶│ Engine      │  │ Weather Provider │
│ pdfplum│─▶│ Extractor    │  │ State       │  │ Fixture JSON     │
│ ber/   │  │ OpenAI strict│  │ machine     │  │ (only impl.)     │
│ PyMuPDF│  │ json_schema  │  │ + audit     │  │ hourly records   │
│ sandbox│  └──────────────┘  │ trace       │  └────────┬─────────┘
└────────┘                    └──────┬──────┘           │
                                      │                  │
                                      ▼                  │
                             ┌──────────────────┐        │
                             │ adjudicator_node │◀───────┘
                             │  per-day         │
                             │  assessment      │◀──┐
                             └────────┬─────────┘   │
                                      ▼             │
                             ┌──────────────────┐   │
                             │ rules/evaluators │───┘
                             │  majority-of-    │
                             │  hours test      │
                             └──────────────────┘
```

The boxes below are the layers. Control flow between them is the graph in `pipeline_agents.py`, described above. `pipeline.py` only adapts the graph result back into the API's return tuple.

### Strict separation of concerns
- **Parsing**: bytes → text + table cells + bboxes.
- **Extraction**: text → structured Pydantic models. No math.
- **Weather**: port + dates → hourly observations.
- **Engine**: structured models → audit trace. Deterministic.
- **Rule library**: (observations, window, threshold) → `(valid, justification, citations)`. It decides nothing about money.
- **Adjudicator node**: two traces + weather + rules → per-day `DisputedLineItem`s and a reconciled total.
- **Presentation**: trace + reconciliation → UI.

---

## 8. Repository layout (actual)

```
keel-multi-agent-pipeline/
├── apps/
│   ├── api/                          # FastAPI service
│   │   ├── keel_api/
│   │   │   ├── main.py               # API entrypoint — /healthz, /voyages, /voyages/{id}, /reconciliations, /voyages/{id}/letter
│   │   │   ├── schemas.py            # Pydantic models (§9 contracts + WeatherSummary)
│   │   │   ├── pipeline_agents.py    # LangGraph: workers, validator, engine, adjudicator
│   │   │   ├── pipeline.py           # Wrapper: run_voyage_pipeline → run_agent_pipeline
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
│   │   │   ├── rules/
│   │   │   │   └── evaluators.py     # Majority-of-hours weather test; threshold is the CP's own
│   │   │   └── letter/               # Claim letter generation
│   │   │       └── render.py         # Jinja2 HTML settlement letter template
│   │   ├── tests/                    # pytest suite — 18 test_*.py files, 355 collected
│   │   │   ├── test_canonical.py     # End-to-end $112K assertion
│   │   │   ├── test_agent_graph.py   # Graph join, retry fan-out, cache path
│   │   │   ├── test_engine.py        # State machine unit tests
│   │   │   ├── test_bimco_rules.py   # Weather evaluator tests
│   │   │   ├── test_weather.py       # Weather provider tests
│   │   │   ├── test_extraction.py    # LLM extraction (3 fail: no PDFs)
│   │   │   ├── test_parsers.py       # PDF parsers (8 fail: no PDFs)
│   │   │   ├── test_fixtures.py      # Fixture presence (5 fail: no PDFs)
│   │   │   ├── test_adapters.py      # Frontend JSON shape
│   │   │   ├── test_reconciliation_contract.py
│   │   │   ├── test_reconciliation_cases.py
│   │   │   ├── test_api_hardening.py
│   │   │   ├── test_extractor_feedback.py
│   │   │   ├── test_pdf_geometry.py
│   │   │   ├── test_validation.py
│   │   │   ├── test_parsing_sandbox.py   # the parser ceilings — 23 tests
│   │   │   ├── test_delete.py
│   │   │   └── test_healthz.py
│   │   └── keel.db                   # SQLite database file (gitignored)
│   └── web/                          # Next.js 16 App
│       ├── app/
│       │   ├── page.tsx              # Public landing page — NOT a redirect to /login
│       │   ├── (auth)/login/         # Demo-mode entry
│       │   └── (dashboard)/
│       │       ├── layout.tsx, error.tsx
│       │       ├── dashboard/        # Stats + voyage table + upload dialog
│       │       ├── voyages/          # Voyages list page
│       │       ├── reconciliations/  # Reconciliations list page
│       │       ├── reports/          # Reports page
│       │       └── voyage/[id]/      # Detail → /reconcile → /letter
│       ├── components/
│       │   ├── AppSidebar.tsx        # Sidebar navigation — four items, no dead link
│       │   ├── PdfViewer.tsx         # react-pdf + bbox overlays (no PDFs ship here)
│       │   ├── VoyageUnavailable.tsx # 409 / no-reconciliation state
│       │   ├── ThemeToggle.tsx
│       │   └── ui/                   # shadcn primitives
│       ├── lib/                      # api.ts, types.ts, sanitize-html.ts, utils.ts
│       ├── proxy.ts                  # DEMO STUB route guard — not authentication
│       ├── pnpm-workspace.yaml       # allowBuilds: sharp + unrs-resolver (eslint needs it)
│       ├── public/                   # incl. pdf.worker.min.mjs, served locally
│       ├── tests/e2e/                # 6 Playwright spec files, 31 tests
│       └── package.json              # next 16.2.6, react 19.2.4
├── fixtures/voyage_001/              # Canonical demo fixtures
│   ├── weather_port_xyz.json         # Hourly port weather (Bft 5/4/7 across 14–16 June)
│   ├── extracted_*.json              # 5 cached LLM extraction outputs
│   ├── _cached_extracts.json
│   ├── expected_reconciliation.json  # Golden reference for the demo re-seed check
│   └── (the 5 source PDFs are NOT in this checkout)
├── test-cases/                       # 4 reconciliation cases + generators
├── scripts/                          # Fixture generation and extraction helpers
└── docs/
    ├── prd.md                        # This document
    ├── demo_workflow.md              # Recording script
    ├── continuation-plan.md          # The roadmap
    ├── phase-1-plan.md
    ├── tickets/                      # Hackathon task tracker
    └── archive/                      # Critique history
```

> **Correction, 2026-09-30.** This tree previously listed a `reconcile/` package with `adjudicator.py` and `differ.py`. **It does not exist.** The reconciliation lives entirely in `pipeline_agents.adjudicator_node` plus `pipeline._weather_windows`. Four other references in this document to `reconcile/adjudicator.py` were the same error and are annotated where they appear. The web app also has no `app/api/` proxy routes: the client calls the FastAPI service directly at `NEXT_PUBLIC_API_URL`.

---

## 9. Key data contracts

These schemas are the contracts between layers.

> **Correction, 2026-09-30 — this section was the origin of the rule-id fabrication.** The earlier version of §9 specified `rule_id: str` with an example in a `BIMCO_2013.*` namespace naming a WWD threshold, and an `owner_position` example of the shape *"Exception does not apply: Force 5 below WWD threshold"*. Neither exists anywhere in the code. The comment was read as a schema requirement and propagated into the letter, the UI and the demo script. §9 below now matches `apps/api/keel_api/schemas.py` field for field.
>
> On the module docstring: it no longer reads *"Sourced verbatim from PRD §9."* It reads *"Originated from PRD §9 and since grown: the weather clause values, the charterparty weather thresholds, the verdict measurement basis and the audit entry clause citation were all added during the build."* (`apps/api/keel_api/schemas.py:3`). **Correction, 2026-09-30:** an earlier version of this note said the stale attribution was still in the file and "reported, not fixed". That is no longer true — the source now says so accurately, and the deltas it names are the ones listed below.

### 9.1 Extraction output (LLM → engine)

```python
RuleAuthority = Literal["BIMCO_2013", "VOYLAYRULES_93", "custom"]

WEATHER_CLAUSE_VALUES = ("WWD", "WWDSHEX", "WWDSHINC", "WEATHER PERMITTING", "none")

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
    nor_turn_time_hours: float
    laytime_exception: Literal["SHEX", "FHEX", "SHINC"]
    weather_clause: Literal["WWD", "WWDSHEX", "WWDSHINC", "WEATHER PERMITTING", "none"]
    rule_authority: RuleAuthority
    # Added during the build. The weather-working threshold is a term of THIS
    # charterparty, not of any ruleset, so it is read off the charterparty text
    # like any other term. None means the document states no figure; the
    # evaluator then falls back to its configured default and says so.
    weather_beaufort_threshold: int | None = None
    weather_precipitation_threshold_mm: float | None = None
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

Three deltas from the original §9, all real:

1. `weather_clause` gained `WWDSHINC` and `WEATHER PERMITTING`. `WEATHER PERMITTING` is definition 18's own term; without it a charterparty drafted on that expressly preserved wording could not be represented, and the extractor would have had to silently pick another value — most likely `none`, losing the weather exception entirely.
2. `weather_beaufort_threshold` / `weather_precipitation_threshold_mm` were added so the threshold is a read term rather than a hardcoded constant.
3. **No field in `schemas.py` carries a numeric bound.** `grep` for `ge=` / `le=` / `Field(` over the file returns nothing. Every money field is an unbounded `float`. That is step 5 of the continuation plan, not a property this contract has.

### 9.2 Weather record (provider → adjudicator)

```python
class WeatherCitation(BaseModel):
    source: str
    observation_id: str

class WeatherObservation(BaseModel):
    timestamp: datetime
    wind_force_beaufort: int
    wind_speed_knots: float
    precipitation_mm_per_hour: float
    operations_prevented: bool
    citation: WeatherCitation

class WeatherProvider(Protocol):
    def get(self, port_lat: float, port_lon: float,
            start: datetime, end: datetime) -> list[WeatherObservation]: ...
```

`operations_prevented` is a **provider-supplied** flag, not a threshold evaluation — the module docstring for the fixture provider says the file "must … contain an `observations` array matching the WeatherObservation schema", and that is all it does.

### 9.3 Audit trace (engine → UI)

```python
class AuditEntry(BaseModel):
    seq: int
    timestamp: datetime
    state: Literal["BEFORE_NOR", "ON_LAYTIME", "WEATHER_PAUSE", "ON_DEMURRAGE"]
    rule_applied: str
    clause_citation: ClauseCitation | None
    sof_citation: SourceCitation | None
    laytime_consumed_hours: float
    running_total_usd: float

class CalculationResult(BaseModel):
    voyage_id: str
    party: Literal["owner", "charterer"]
    laytime_used_hours: float
    demurrage_due_usd: float
    trace: list[AuditEntry]

class WeatherSummary(BaseModel):
    peak_wind_force_beaufort: int
    peak_precipitation_mm_per_hour: float
    adverse_hours: float
    total_observed_hours: float
```

`demurrage_due_usd` is never negative in this build — there is no despatch path in the engine, only a despatch *rate* on the terms. The earlier comment "negative if despatch owed" described a feature that does not exist.

### 9.4 Reconciliation output (with per-day assessment)

```python
class Verdict(BaseModel):
    winner: Literal["owner", "charterer", "split"]
    justification: str
    # Names the test this product applied to the window, and nothing else:
    # not a citation into any source document, carries no definition number.
    # Live value: "CP_WEATHER.MAJORITY_OF_HOURS"
    rule_id: str
    # The source that fixes how an excepted period is *measured*, named on its
    # own so it is never read as the authority for the test or the threshold.
    # Live value: "Laytime Definitions for Charter Parties 2013, definition 16"
    measurement_basis: str
    # Always "custom" on a weather assessment.
    rule_authority: RuleAuthority
    hours_credited_to_owner: float
    dollars_credited_to_owner_usd: float

class DisputedLineItem(BaseModel):
    description: str                     # "Weather exception, 14 June 2026"
    disputed_date: date
    owner_position: str                  # full prose; see live value below
    charterer_position: str
    owner_amount_usd: float
    charterer_amount_usd: float
    verdict: Verdict
    clause_citations: list[ClauseCitation]
    sof_citations: list[SourceCitation]
    weather_citations: list[WeatherCitation]
    weather_summary: WeatherSummary | None = None

class Reconciliation(BaseModel):
    voyage_id: str
    owner_total_usd: float               # $187,000 canonical
    charterer_total_usd: float           # $62,000 canonical
    disputed_items: list[DisputedLineItem]
    reconciled_total_usd: float          # $112,000 canonical
    rule_authority: RuleAuthority
```

Two notes on the shape:

- `Verdict.winner` is the wire field name and the schema is frozen, but nothing in the UI or the letter uses the word. `adapters.py` maps it to `winner_label` = "Owner position better supported" / "Charterer position better supported", and `lib/api.ts` re-derives that label client-side. The internal name is a wart, not a product position.
- `Reconciliation.rule_authority` and `Verdict.rule_authority` are two different claims, and for the canonical run they hold different values. The **verdict** authority is `custom`, because no source supplies the threshold or the share test. The **reconciliation** authority reports which ruleset the charterparty *expressly incorporates by name* (a regex over its clauses, `_cited_rule_authority`, `pipeline_agents.py:333-343`), and `"custom"` when it incorporates none. For `voyage_001` it resolves to **`BIMCO_2013`**, because the fixture's page-3 clause 3.1 incorporates the *Laytime Definitions for Charter Parties 2013* by name; `tests/test_canonical.py:69` asserts exactly that, and `:70-74` asserts the clause that says so exists. A charterparty that incorporates no ruleset by name would leave it at `custom`.

  > **Correction, 2026-09-30.** The earlier version of this bullet ended "Neither is ever `BIMCO_2013` in the canonical run." That was false. Note also that `rule_authority` is **not on the wire** — `adapters.py` does not carry it into the `day_verdicts` payload, so `GET /voyages/voyage_001` exposes `measurement_basis`, `bimco_clause.clause_id` and the justification text, and the reconciliation's authority is observable through the internal model and the canonical test, not through a response body.

**Live `owner_position` for 2026-06-14**, verbatim from the API, replacing the invented example:

> The Owner claims the whole 12 hours as demurrage. The Owner's case is that the records do not reach the threshold over the claimed period, so the exception does not take these hours off the vessel's demurrage. The threshold applied is Beaufort Force 6 (or 2 mm/h precipitation), stated in the weather-exception clause (page 3) — this charterparty's own term. The port records for the claimed period show peak Beaufort Force 5 with 0.4 mm/h precipitation over 12 hours.

Both party positions are built by `pipeline_agents._owner_position` and `._charterer_position`. Neither states the other's conclusion; the assessment column is where the two cases are weighed.

---

## 10. Engine scope (v1)

### Implemented and verified

- NOR tender and acceptance; laytime commences `nor_turn_time_hours` after acceptance. Definition 25 of the 2013 definitions defers turn time to the charter party, so the figure is the charterparty's and the engine takes it from the terms.
- Laytime commencement and expiry; "once on demurrage, always on demurrage" for the day-counting axis.
- `SHINC` (count everything) and `SHEX` (exclude Sundays while on laytime).
- Weather pause/resume driven by `WEATHER_DELAY_START` / `WEATHER_DELAY_END`, on both the laytime and demurrage branches.
- Weather exception assessment: strict majority of observed hours at or above the charterparty's threshold, **and** at least one qualifying hour recording that operations were prevented. Citations: the first and last qualifying observation.
- Full audit trace with a `sof_citation` per row and a `clause_citation` on the weather rows.

### Known gaps — recorded, not claimed as supported

Each of the following is a limitation the code documents about itself. None is a specification the code meets.

| # | Gap | What the code does instead | Why | Cost to close |
|---|---|---|---|---|
| 1 | **Definition 15's pro-rata is arithmetic with nothing selecting it.** | `_pro_rata_struck_off_hours` exists and is correct, and is **never called**. | The ratio runs against a *stated working day*. `CharterpartyTerms` carries no working-day term, so no `weather_clause` label can select it. | Contract change (add a working-day term) then engine change. Not an engine bug. |
| 2 | **Definition 17's artificial working day is not modelled.** | `WWDSHEX` and `WWDSHINC` map to `ARTIFICIAL_DAY`, but `_struck_off_hours` returns the same hours for `ARTIFICIAL_DAY` and `ACTUAL_PERIOD`. | Definition 17's counting unit is 24 *working* hours. A 10-hour overnight stoppage spanning ~2 working hours should suspend ~2, not 10. **This over-credits the charterer**, and the module docstring says so. | Needs a working-day calendar plus per-hour working/non-working classification. No test asserts the artificial day changes the exclusion, because it does not. |
| 3 | **Definition 30's conditional demurrage carve-out is not implemented.** | A weather pause suspends accrual on demurrage *unconditionally*; no clause is consulted. | Definition 30 says demurrage is not subject to laytime exceptions *unless specifically stated*. The canonical fixture's **Clause 4.1** ("Once on Demurrage, Always on Demurrage") does state it, so the current behaviour is right **for that charterparty**. For one that does not, the engine over-credits the charterer. | There is no contract field that distinguishes the two cases. Adding one is a contract change. |
| 4 | **A bare `WWD` label is ambiguous between definitions 15 and 16.** | `WWD` → `ACTUAL_PERIOD` (definition 16's mechanic). | Definition 15 *is* "WEATHER WORKING DAY", so the label sits closer to 15 than to 16's "WWD OF 24 CONSECUTIVE HOURS". Which one a charterparty adopted is fixed by its wording, not the label. | Cannot be fixed by choosing better — it needs the clause text, or a disambiguating prompt. Until then the choice is a stated assumption. |
| 5 | **The weather threshold falls back to a configured default.** | `BEAUFORT_THRESHOLD = 6`, `PRECIPITATION_THRESHOLD_MM = 2.0` when the extractor reads no figure. | No ruleset prescribes them. The evaluator names the provenance on the face of the justification rather than implying the contract says it. | Better extraction, plus a "threshold not stated in this charterparty" state the reviewer must resolve. Never a silent default. |
| 6 | **`FHEX` is not implemented.** | For any exception other than `SHINC`, Sundays are excluded and nothing else. | A charterparty drafted FHEX needs its holidays extracted first. | A holiday calendar, which is a data problem before it is a code problem. |
| 7 | **No despatch.** | A despatch *rate* is extracted and displayed. | The engine accrues demurrage only. | — |

### Out of scope, unchanged
Reversible laytime, multi-port, multi-hatch pooling, per-hatch cargo matching, WIBON/WIPON handling, turn-time-during-work, alternate rule authorities, time-bar computation, claim-document line reconciliation.

---

## 11. Execution plan — COMPLETED

> **Disagreement on the build window — see the note in the document header.** The
> heading in the earlier version of this section read "8-hour execution plan".
> `docs/tickets/README.md` and `docs/tickets/tracker.md` describe a 12-hour build
> and schedule work through hour 12. Both figures are preserved in the tables
> below as written; neither is verifiable from this checkout.

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
| 5.5–7 | Reconciliation view displaying day-by-day dispute cards, weather observations, and the $112K reconciled total. | ✅ B-08, B-09 done |
| 7–8 | Final letter download and demo presentation script polish. | ✅ B-10, B-11, B-12 done |

### Implementation notes
*Historical record from that build (8 hours per the tables above, 12 per the ticket documents). Two of these four notes were wrong and are corrected below; the rest stand.*

- **A-08 (Reconciliation differ + adjudicator)**: Tracker shows open. The reconciliation is implemented — but **not** in `reconcile/adjudicator.py`, which never existed in this tree. It is `pipeline_agents.adjudicator_node` plus `pipeline._weather_windows`. The reconciliation was integrated into the graph rather than as a separate wired step.
- **J-02, J-03 (API contract & canonical assertion)**: Never formally checked off in the tracker. The pipeline does run end-to-end and the frontend does consume the API, and the canonical assertion exists (`test_canonical.py`, `pytest -m canonical` → 15 passed).
- **database.py vs store.py**: Two persistence modules exist. `store.py` is the active one used by `main.py`. `database.py` is legacy dead code from an early approach.
- **CORS**: The original note said `allow_origins=["*"]`. **Corrected:** it is `_DEFAULT_CORS_ORIGINS = ["http://localhost:3000"]`, overridable via `KEEL_CORS_ORIGINS`. A specific-origin allowlist is already in place. What is *not* in place is authentication: the API is anonymous by default.

---

## 12. Demo script (voiceover summary)

The recording script, with timings and every figure checked against the running app, lives in [`docs/demo_workflow.md`](demo_workflow.md). It is the authoritative version, and its own timing is **≈ 2:30 – 3:00** (`demo_workflow.md:3`). The voiceover below is the summary, corrected to match what the build actually does.

> **Correction, 2026-09-30.** The heading of this section used to read "Demo
> script (target 90 seconds)". That target contradicts the script this very
> section declares authoritative, which budgets 2:30–3:00 across seven timed
> scenes. The stale figure is removed rather than reconciled; the 90-second
> target survives only inside the historical ticket text, where it is the
> hackathon's own J-04 "done when" (`docs/tickets/README.md:134`) and is not a
> claim about this build.

> "This is Keel — a claims intelligence platform for maritime demurrage. We help analysts resolve disputes with an auditable, rule-based reconciliation.
>
> *[Login screen → dashboard → New Voyage Analysis → Demo Mode]*
>
> An analyst has a $187,000 demurrage claim. The charterer's own position is $62,000. The dispute is three days of weather: 14, 15 and 16 June.
>
> *[Voyage detail: terms, two audit traces, $187,000 vs $62,000]*
>
> Both numbers come out of the same deterministic engine. The only thing that differs is what each party put in their Statement of Facts. The LLM reads the documents into a schema — it never produces a dollar.
>
> *[Reconciliation: three day cards]*
>
> For each day, Keel holds the port weather record against the threshold **this charterparty states** — Force 6 or 2 mm/h, read from clause 3.2. A majority of the observed hours must reach it, and at least one of those hours must record that operations actually stopped.
> - 14 and 15 June: peak Force 5 and Force 4, zero of twelve hours at the threshold. The **owner's** position is better supported.
> - 16 June: all thirty-six hours at or above it, with operations recorded as prevented. The **charterer's** position is better supported.
>
> *[Reconciled total: $112,000]*
>
> $62,000 plus the two days that survive. Every figure carries the clause and the Statement of Facts row it came from.
>
> *[Letter]*
>
> And the letter a counterparty receives carries each party's stated position, the assessment, and the credited figure — with a footer that says exactly where the measurement basis comes from, and that the document supplying it states no Force 6 and no majority test."

**What changed from the earlier draft, and why.** The old voiceover said "cross-references logs against port weather records under BIMCO 2013 definitions" and "winds were Force 4/5 — below the WWD threshold". Both attributes a threshold to BIMCO that the Laytime Definitions do not contain. It also said the letter is produced "instantly" by clicking *Generate Claim Letter*; the letter page does exist and the letter *is* the backend's own HTML, so that part stands.

---

## 13. Post-hackathon roadmap — Enterprise rewrite plan

> **Superseded, 2026-09-30. Read [`docs/continuation-plan.md`](continuation-plan.md) instead.**
>
> This section is retained as a record of what was planned after the hackathon. It is **not** the roadmap, and three of its assumptions are now known to be wrong:
>
> 1. **It is out of order.** It opens with a database migration and observability stack — infrastructure that buys nothing until the product's reason for existing, a human review before anything is issued, is built. It never mentions a review gate as step one.
> 2. **It asserts an unverified competitive picture.** §13.1's vendor table and funding figures were not re-checked when this document was corrected. Treat every row as an unverified claim. The subset that *was* re-checked against primary sources is in the continuation plan, with the sources named.
> 3. **§13.2.4 mislabels definition 17.** Its table reads *"Def 17: artificial day of 24 working hours; interruption excluded from working hours only"*. That description is correct — and it is **not** what this engine does. `state_machine.py` documents the opposite as a known limitation: the artificial working day is not modelled, so `WWDSHEX`/`WWDSHINC` run on the actual-period measure and a long overnight stoppage is over-credited to the charterer. The table is left as written because it records the plan; §10 of this document is the accurate statement of the code.

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
- ~~Replace `allow_origins=["*"]` CORS with explicit origin allowlist.~~ ✅ **Already done.** `_DEFAULT_CORS_ORIGINS = ["http://localhost:3000"]`, overridable with `KEEL_CORS_ORIGINS`. This item is struck because it is no longer needed, not because it was deferred.
- Add request validation middleware (rate limiting, payload size limits).
- API versioning (`/api/v1/`) for stable contracts.
- Authentication via JWT (Supabase Auth or Auth0) with tenant-scoped claims, refresh token rotation, CSRF protection.
- Implement tenant isolation at **both** application layer (ORM query filters on every query) and database layer (RLS). Do not rely on RLS alone — connection pool leaks in async environments can expose cross-tenant data if `set_config` is not reset.
- Remove dead code: `database.py`. *(The other item in the original line, "orphaned canonical-path logic in `reconcile/adjudicator.py`", named a file that does not exist — struck.)*

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

The hackathon implements a simplified WWD approximation (Beaufort ≥ 6 threshold). **This is an illustrative threshold, and it is the charter party's own term rather than a ruleset's. It is not a BIMCO 2013 threshold, because that document contains no numeric weather threshold.** The four definitions it is trying to implement are: [definition 15 / definition 16 / definition 17 / definition 18 as tabulated below]

| BIMCO Definition | Key Mechanic |
|---|---|
| **Def 15: Weather Working Day** | Pro-rata exclusion: interruption duration ÷ working hours × 24h |
| **Def 16: WWD of 24 Consecutive Hours** | Actual interruption duration excluded from laytime |
| **Def 17: WWD of 24 Hours** | Artificial day of 24 working hours; interruption excluded from working hours only |
| **Def 18: (Working Day) Weather Permitting** | Same as Def 16 |

Phase 1 must implement at least Definitions 15 and 16 correctly. Weather thresholds must be **configurable per CP clause** (not hardcoded), because no ruleset specifies fixed Beaufort thresholds — weather exceptions depend on the clause's own wording, port working hours, and whether operations were actually prevented.

> **Status against the build, 2026-09-30.** The configurability half of that sentence **is done**: the threshold is read from the charterparty into `CharterpartyTerms.weather_beaufort_threshold` / `weather_precipitation_threshold_mm`, with a fallback to a configured default whose provenance is stated in the justification. The "definitions 15 and 16 correctly" half is **not**: definition 15's pro-rata function exists but no label selects it, and definition 16's actual-period measure is applied to `WWDSHEX`/`WWDSHINC` too, which should select definition 17's artificial day. See §10 for both gaps with their cost.
>
> **Correction, 2026-09-30.** This paragraph originally read "The hackathon implements a simplified BIMCO 2013 WWD approximation (Beaufort ≥ 6 threshold)" and called it a BIMCO threshold. That was wrong and the words attributing the figure to BIMCO have been removed from the sentence. The threshold is the charter party's own term; the fixture's happens to be Force 6, read from the clause on page 3. The four definitions tabulated here are correct as a statement of the framework; what the code does with each label is documented in `apps/api/keel_api/engine/state_machine.py`.

| Rule | Priority (as planned) | Complexity | State in this build |
|---|---|---|---|
| **Def 15 + 16** (correct WWD formulations, configurable thresholds) | P0 — Month 1–2 | Medium | Configurable threshold: done. Def 15 pro-rata: implemented, unreachable. Def 16: done. |
| **Custom holiday calendars** (port-specific public holidays) | P0 — Month 1 | Low | Not started. Blocks FHEX. |
| **FHEX** (Fridays excluded — Middle East/Gulf ports) | P0 — Month 1 | Low | Not started. `_eligible_laytime_hours` excludes Sundays only. |
| **WIBON** (Whether In Berth Or Not) NOR validity | P1 — Month 3 | Medium | Not started. |
| **VOYLAYRULES 1993** | P1 — Month 3–4 | Medium | Not started. `RuleAuthority` admits the name; nothing computes it. |
| **Reversible laytime** (load + discharge combined) | P2 — Month 5–6 | High | Not started. |
| **Multi-hatch / multi-grade cargo** | P2 — Month 5+ | High | Not started. |
| **Def 17 artificial working day** | *not in this table* | High | **Should have been here.** It is the one weather gap that over-credits the charterer, and the plan below does not name it. Added to the continuation plan. |

> **Legal validation**: Before shipping any codification to pilot customers, consult a maritime lawyer. Incorrect rule application that leads a client to an indefensible position is a liability risk.

Architecture: Refactor `rules/evaluators.py` into a rule registry pattern. Each rule is a self-contained evaluator with:
- `rule_id: str` — a name for the *test*, naming no source document. The live example is `CP_WEATHER.MAJORITY_OF_HOURS`; the per-definition id in the original text (a `BIMCO_2013.*` namespace followed by a definition suffix) is the pattern this build deliberately stopped using, because it reads as a citation into a document that contains no such test.
- `evaluate(observations, window, threshold) → RuleResult`
- `cite() → list[Citation]`

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
- The in-process LangGraph in `pipeline_agents.py` is the current orchestrator. It has no checkpointer and no human approval gate inside the graph. A later phase can replace it with a **durable workflow orchestrator** (Temporal or Inngest) if voyages must survive process restarts.
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
  1. **Piraeus / Athens** (pilot) — *(the "~19% of global capacity" figure was not re-verified and is unsupported here)*.
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

*Competitive context: the per-seat price points in this paragraph were not re-verified against any vendor's public pricing and are **unverified**. No vendor in this repository publishes a public price list for a claims-reconciliation product; treat the whole pricing section as a hypothesis for customer discovery, not as research.*

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
| BIMCO 2013 rules are oversimplified | ✅ Narrow scope to one weather formulation for the demo, and the letter's footer says which formulation and that the source states no threshold. | Implement definitions 15, 16 and 17 as distinct bases with a working-day term. Maritime lawyer validation before pilot launch. |
| Complex clause math fails | ✅ One weather clause shape for the demo voyage; everything else is the deterministic engine. | Rule registry pattern with isolated evaluators. Each rule has unit tests against known outcomes. |
| Demo data doesn't match production reality | Canonical fixtures are synthetic. | Partner with 2–3 pilot customers for real anonymized voyage data. Build golden dataset. Fail loudly on scanned documents until OCR is integrated. |
| Scalability under concurrent load | Single-process uvicorn, SQLite. Concurrency is already capped at `_MAX_CONCURRENT_RUNS` (default 4) with a 429 on excess. | PostgreSQL + ARQ workers. Load test with k6 before pilot launch. |
| Security / data isolation | ⚠️ **Corrected:** CORS is *not* `*` — it is an explicit origin allowlist, default `http://localhost:3000`, overridable by `KEEL_CORS_ORIGINS`. What remains true is worse: **there is no auth at all.** The API is anonymous by default, and `KEEL_API_TOKEN` is one shared secret with no identity, no expiry, no rotation and no per-voyage check. `apps/web/proxy.ts` mints a published cookie. | JWT + dual-layer tenant isolation (app-level ORM filters + RLS). Secrets management via environment variables + vault. EU-region deployment for data residency. |
| GDPR / regulatory compliance | Not addressed in hackathon. | Add data residency requirements (EU deployment). Draft DPA for pilot customers. Legal disclaimer on all assessments. Consult maritime lawyer for liability. |
| Legal liability from automated assessments | Partly mitigated: the letter's footer states it is advisory negotiation support, not a legal opinion, arbitration award or binding determination, and directs the reader to check the figures against the charter party. **There is no human sign-off gate and no send path at all.** | A review gate a person must pass before anything leaves the system — see the continuation plan, step 1. |
| Competitor moves (Veson CoCaptain, B&V SailFast, Marcura) | Differentiated demo narrative. | Speed to market. Clause intelligence corpus from pilot data. FDE embedding + custom rule co-creation. |

> **Note on certifications.** This product holds no security or compliance certification, and none is claimed anywhere in this repository. The sentence "for investor due diligence" in §13.2 means technical diligence, not an audit.

---

## 15. Open questions

### Resolved (hackathon)
- ~~**Fixture validation**: Synthesize canonical `voyage_001` to match $187K / $62K / $112K exactly.~~ ✅ Done — `GET /voyages/voyage_001` returns 187000.0 / 62000.0 / 112000.0, and `pytest -m canonical` is green.
- ~~**Weather JSON schema**: Match Open-Meteo's API shape for direct upgrade.~~ ⚠️ The schema is a clean interface and `FixtureWeatherProvider` validates against it. **The Open-Meteo side of that claim is unverified** — the field names and the m/s→Beaufort conversion have not been checked against a live Open-Meteo response in this checkout, and no live provider exists. Treat the "direct upgrade" as untested.
- ~~**Response document style**: Stick to standard CSS print-friendly HTML templates.~~ ✅ Jinja2 HTML template in `letter/render.py`, with a real CSP + `nosniff` + `no-referrer` header set on the route.

### Resolved (post-critique review)
- ~~**Document type detection**: Current parser routes by filename convention. Production needs content-based classification.~~ → **Promoted to P0 requirement** (§13.2.2). Still not built; still a real gap.
- ~~**Regulatory**: Does Keel's automated assessment generation create legal liability?~~ → **Yes.** Advisory positioning adopted throughout. The letter footer carries it. The word "verdict" is gone from the UI and the letter; `Verdict.winner` survives only as a frozen schema field name. Consult a maritime lawyer before any pilot.
- ~~**Attribution**: which source is the authority for the weather threshold?~~ → **Resolved 2026-09-30, and this is the correction that mattered.** No source is. The Laytime Definitions contain no numeric threshold; the threshold is the charterparty's own term; the majority-of-hours test is this product's policy. The verdict reports those three things separately, the letter says so in its footer, and the letter's own footer states that the cited document "states no Force 6 and no majority test".

### Open
- **Database migration strategy**: Start fresh with a normalised PostgreSQL schema for alpha customers, or keep the JSON blob? Not yet decided, and the continuation plan deliberately does not put it first.
- **LLM provider lock-in**: Current code supports OpenAI and NVIDIA NIM via `OPENAI_BASE_URL`. Whether to add other providers is open.
- **Holiday calendar data source**: Where to get a machine-readable port holiday calendar is open. It blocks FHEX, and it is a data problem before it is a code problem.
- **Rule validation by a maritime lawyer**: required before any pilot. The specific things to be shown to counsel are the seven engine gaps in §10 — there are seven rows, not five, and an earlier version of this line said five — plus the positional clause-labelling defect described in the root [README](../README.md#known-limitations), not a claim of completeness.
- **5–10% write-down statistic**: attributed to no citable source. Either find it, measure it with pilot data, or remove it from every document. **It has now been struck from §2.2, the only other place in this repository that carried it, so this repository contains no unsourced version of it.**
- **OCR provider selection**: unevaluated.
- **P&I club partnership**: unstarted.
- **Email ingestion timing**: open.
- **The `WWD` ambiguity (gap 4 in §10)**: the label is genuinely ambiguous between definitions 15 and 16. Whether the right fix is a better extraction prompt, a required working-day term, or refusing to assess an ambiguous clause is an open product decision, not only an engineering one.
