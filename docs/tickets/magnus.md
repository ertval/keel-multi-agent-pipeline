# Person A — Backend / Engine

Owner of: FastAPI service, LLM extraction, deterministic calculation engine, BIMCO 2013 rule library, reconciliation adjudicator.

The single deliverable: by hour 8, the canonical assertion test passes — voyage_001 fixture produces `reconciled_total_usd == 112_000` through the real pipeline.

Tickets are listed in execution order. Don't skip ahead; the dependencies matter.

---

## A-01 — FastAPI scaffold

**Estimate**: 30 min · **Hour**: 1 → 1.5
**Blocked by**: [J-01](README.md#j-01--pre-flight-schemas--fixture-hour-0--1)
**Blocks**: A-02, all downstream work

- `uv init apps/api`, add deps: `fastapi`, `uvicorn`, `pydantic`, `pdfplumber`, `pymupdf`, `openai`, `sqlalchemy`, `pytest`, `jinja2`.
- Empty FastAPI app at `apps/api/keel_api/main.py` with health check at `GET /healthz`.
- `pytest` runs (empty test suite, exits 0).

**Done when**: `uv run uvicorn keel_api.main:app` serves a 200 on `/healthz`.

---

## A-02 — Canonical assertion test (FAILING)

**Estimate**: 30 min · **Hour**: 1.5 → 2
**Blocked by**: A-01, J-01
**Blocks**: nothing directly — but this is the north star

- Write `apps/api/tests/test_canonical.py::test_voyage_001_reconciles_to_112k`.
- Test loads the six fixture files, runs the full pipeline (parse → extract → calculate → reconcile), and asserts:
  - `owner_total_usd == 187_000`
  - `charterer_total_usd == 62_000`
  - `reconciled_total_usd == 112_000`
  - Three disputed items with verdicts: June 14 = owner, June 15 = owner, June 16 = charterer.
- Test will **fail** at this point. That is correct. It will go green at J-03.

**Done when**: `pytest -k canonical` runs (and fails with a clear `NotImplementedError` or shape error).

---

## A-03 — PDF parsers

**Estimate**: 60 min · **Hour**: 2 → 3
**Blocked by**: J-01
**Blocks**: A-04

- `apps/api/keel_api/parsing/`:
  - `pdfplumber_parser.py`: returns text + table cells + bboxes for tabular SOF docs.
  - `pymupdf_parser.py`: returns plain text + page numbers for narrative charterparty docs.
- A `parse(path: Path) → ParsedDocument` dispatcher that picks the right parser by document type hint.
- Smoke-test on all 5 fixture PDFs — no exceptions, non-empty output.

**Done when**: `parse(charterparty.pdf)` returns a `ParsedDocument` with at least 1 page of text; `parse(sof_owner.pdf)` returns at least one table row.

---

## A-04 — LLM extraction with strict json_schema

**Estimate**: 120 min · **Hour**: 2 → 4 (overlap with A-03 once parsers exist)
**Blocked by**: J-01, A-03
**Blocks**: A-05, J-02

- `apps/api/keel_api/extraction/`:
  - `prompts.py`: one prompt per document type (charterparty, SOF, claim).
  - `client.py`: OpenAI `gpt-4o` with `response_format={"type": "json_schema", "schema": ...}`, `temperature=0`.
  - Returns `CharterpartyTerms`, `list[SOFEvent]`, etc. per [PRD §9.1](../prd.md).
- **Hand-validate against voyage_001 fixture.** The extracted values must match what the engine will need to compute $187K / $62K. Iterate on prompt until it does.
- If extraction is flaky, add a `bypass=True` mode that returns hand-validated cached extracts from `fixtures/voyage_001/_cached_extracts.json`. This is acceptable for the demo.

**Done when**: extraction on voyage_001 fixture returns Pydantic-validated objects with all required fields populated and timestamps correct.

---

## A-05 — Calculation engine (state machine)

**Estimate**: 120 min · **Hour**: 3 → 5 (start during A-04, parallel safe)
**Blocked by**: J-01
**Blocks**: A-08, J-02

- `apps/api/keel_api/engine/`:
  - `timeline.py`: merges SOF events into a sorted, normalized timeline.
  - `rules.py`: SHEX, FHEX, SHINC, turn time, **once-on-demurrage** evaluator.
  - `calculator.py`: state machine; consumes timeline + charterparty terms, emits `(CalculationResult, list[AuditEntry])`.
  - `trace.py`: `AuditEntry` dataclass per [PRD §9.3](../prd.md).
- **Tests in this order**:
  1. `test_once_on_demurrage_ignores_weekends` (write first, this is the rule that can't be wrong)
  2. `test_nor_turn_time_6h`
  3. `test_shex_excludes_sundays`
  4. `test_owner_position_returns_187k` (uses fixture)
  5. `test_charterer_position_returns_62k` (uses fixture)

**Done when**: tests 1-3 pass on synthetic inputs; tests 4-5 pass against the voyage_001 fixture.

---

## A-06 — Weather provider (fixture-backed)

**Estimate**: 60 min · **Hour**: 5 → 6
**Blocked by**: J-01
**Blocks**: A-08

- `apps/api/keel_api/weather/`:
  - `provider.py`: `WeatherProvider` protocol per [PRD §9.2](../prd.md).
  - `fixture.py`: implementation that reads `weather_port_xyz.json` from the fixture set. Filters by `port_lat/lon` and `(start, end)`.
- The fixture JSON must be designed (in J-01) so that:
  - June 14 + 15 records show Force 5 / Force 4 with `operations_prevented=false`
  - June 16 records show Force 7 + heavy rain with `operations_prevented=true`

**Done when**: `provider.get(port_lat, port_lon, jun14, jun17)` returns 72 hourly records (3 days × 24h) matching the canonical fixture design.

---

## A-07 — BIMCO 2013 rule library

**Estimate**: 120 min · **Hour**: 5 → 7 (overlap with A-06)
**Blocked by**: J-01
**Blocks**: A-08

- `apps/api/keel_api/rules/bimco_2013.py`:
  - `evaluate_wwd_exception(clause, sof_events, weather_records) → Verdict`.
  - Threshold logic: weather exception is validly invoked iff weather records for the disputed window show **at least one** of:
    - Wind force ≥ 6 sustained over the SOF-claimed delay window, OR
    - Precipitation sufficient to halt operations per industry practice, OR
    - `operations_prevented=true` from the weather provider for the majority of the claimed window.
  - Returns a `Verdict` per [PRD §9.4](../prd.md) with `rule_id="BIMCO_2013.WWD.threshold"`, justification text, and `dollars_credited_to_owner_usd`.
- **Tests**:
  1. `test_bimco_wwd_force_5_below_threshold` → owner wins
  2. `test_bimco_wwd_force_7_meets_threshold` → charterer wins
  3. `test_bimco_wwd_borderline_force_6_short_duration` → owner wins (edge case)

**Done when**: tests 1 and 2 pass. Edge case is documented but doesn't need to be perfect for the demo.

---

## A-08 — Reconciliation differ + adjudicator

**Estimate**: 120 min · **Hour**: 6 → 8
**Blocked by**: A-05, A-06, A-07
**Blocks**: J-03

- `apps/api/keel_api/reconcile/differ.py`: compare two `CalculationResult` traces, emit list of disputed days (where the two parties' treatment of laytime/exceptions diverges).
- `apps/api/keel_api/reconcile/adjudicator.py`: for each disputed day, dispatch to the appropriate rule in `bimco_2013` and produce a `DisputedLineItem` with a `Verdict`.
- `Reconciliation.reconciled_total_usd` = `charterer_total_usd + sum(item.verdict.dollars_credited_to_owner_usd for item in disputed_items)`.

**Done when**: running the full pipeline on voyage_001 returns a `Reconciliation` where `reconciled_total_usd == 112_000` and the three day-verdicts match the expected oracle.

---

## ⛳ Checkpoint: [J-03 — Canonical assertion green](README.md#j-03--canonical-assertion-green-hour-8) (hour 8)

If this isn't green at hour 8, **drop all stretch work** and join Person B on fix-mode. Nothing else matters until the canonical scenario goes green end-to-end through the UI.

---

## A-09 — Claim letter endpoint (STRETCH)

**Estimate**: 60 min · **Hour**: 9 → 10
**Blocked by**: J-03
**Blocks**: B-07

- `apps/api/keel_api/letter/render.py`: Jinja2 template, takes a `Reconciliation` and emits HTML.
- `GET /voyage/{id}/letter` returns HTML for inline rendering.
- Stretch-of-stretch: WeasyPrint PDF export at `?format=pdf`. **Skip if anything else is unstable.**

**Done when**: hitting `/voyage/voyage_001/letter` returns HTML containing the three verdict justifications and `$112,000` total.

---

## A-10 — Bug-fix loop

**Estimate**: 120 min · **Hour**: 10 → 12
**Blocked by**: J-03

- Pair on whatever Person B finds broken when they integrate.
- Add fixture-cache fallbacks for any flaky external call (LLM, future weather API).
- Run the canonical test one more time at hour 11 and hour 11.5.

**Done when**: J-04 demo rehearsal runs clean twice.
