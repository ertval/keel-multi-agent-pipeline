# Execution Plan: Keel Multi-Agent Pipeline

**This document is a historical record.** It is the plan as written for the
public showcase of the original hackathon build. It is not a task list, and it
is not a description of the current code — read [docs/continuation-plan.md](docs/continuation-plan.md)
for the working roadmap and [AGENTS.md](AGENTS.md) for the code as it actually
is.

## Divergence from the plan, as of 2026-09-30

The plan below landed substantially as written: the LangGraph state, the
orchestrator, the charterparty and SOF workers, the validator, the laytime engine
node, the adjudicator node, the cached-JSON no-key fixture path, and `langgraph`
in `pyproject.toml` are all present.

It has since diverged in the following ways. **The code wins.**

- **Retry now re-enters both workers, not just `cp_worker`.** A `retry_fanout`
  node breaks the join so retry can fan out to `cp_worker` and `sof_worker`
  (`pipeline_agents.py:288-290`, `:682-683`).
- **The validator is entered through one list-form join**,
  `add_edge(["cp_worker", "sof_worker"], "validator")`
  (`pipeline_agents.py:669`) — not the two independent edges this plan implied.
  `tests/test_agent_graph.py:259-336` proves it: `:259-299` are the structural
  edge assertions, and the discriminating test that builds the
  two-independent-edges mutant is at `:302-336`.
- **The validator does send structured feedback into the extractors.**
  `ValidationIssue` is tagged with the document and field that can fix it
  (`pipeline_agents.py:49-53`), `_errors_for` routes each message to the right
  worker (`:100-113`), and all three extractors take a `validation_errors`
  argument (`extractor.py:186-196`, `:284-287`, `:367-370`, `:446-449`).
- **`langchain-openai` was removed** from `pyproject.toml`. Extraction is the
  OpenAI SDK in `extraction/extractor.py`.
- **The graph has no checkpointer.** It is compiled once, cached with
  `lru_cache`, and shared across requests (`pipeline_agents.py:641-689`).
- **The adjudicator no longer calls a separate linear reconciliation, because
  that reconciliation never existed here: the `reconcile/` package is deleted.**
  `keel_api/reconcile/adjudicator.py` and `differ.py` hard-coded the three
  canonical dates behind an `is_canonical` branch; both are gone. The money rule
  lives in **`pipeline_agents.adjudicator_node` plus the engine** — party totals
  and the reconciled total at `pipeline_agents.py:579-601`, the per-day
  arithmetic at `:492-577` — and is shaped for the wire in
  **`apps/api/keel_api/adapters.py`**, which assembles `day_verdicts`,
  `bimco_clause`, `measurement_basis`, and `math_breakdown`.
- **The demo-seed guard now checks the response contract, not just the totals.**
  `_demo_matches_expected` requires the three totals to equal the fixture, every
  stored audit-trace citation to name its source document, and the stored row to
  still carry what this build emits — the current weather rule id, a
  `measurement_basis` on every day verdict, and a `clause_citation` key on every
  audit-trace row (`main.py:96-163`). A totals-only comparison kept serving rows
  written by older builds indefinitely.
- **The validator's contract changed.** It checks that `vessel` is present and
  that load-port coordinates are present and in range, and it increments
  `retry_count` only when it found something (`pipeline_agents.py:247-285`).
  It does not compare chronologies.
- **After three failed validations the graph still calculates**, leaving
  `validation_errors` on state for the API to persist (`pipeline_agents.py:608-624`;
  `pipeline.py:61-62`; `main.py:451-455`, `485-491`).
- **A retry never re-reads a claim amount**, because no validation error concerns
  one and re-reading it would move the dollars (`pipeline_agents.py:173-179`,
  `:226-242`).
- **Parsing is now bounded and out of process.** `parsing/parse()` fork+execs a
  sandbox with an address-space limit and a wall clock
  (`parsing/dispatcher.py:79-115`, `parsing/sandbox.py`, `parsing/limits.py`).
- **The letter endpoint serves HTML only.** It refuses `?format=pdf` with a 400
  pointing at the browser's Print → Save as PDF (`main.py:757-772`).
- **The plan's weather-threshold premise was wrong.** The Laytime Definitions for
  Charter Parties 2013 supply only the measurement basis for an excepted period
  (definition 16) and set no weather threshold; the threshold and the
  majority-of-hours test come from the charterparty, and a weather verdict's
  `rule_authority` is `custom` (`rules/evaluators.py:3-42`, `:60-65`).

---

This document outlines the design decisions and implementation plan for the public showcase of the `keel-multi-agent-pipeline`.

---

## 🎯 Objectives
- **Solve LLM Hallucinations:** Single-prompt LLM extraction frequently fails to extract consistent names, dates, and locations from dense shipping PDFs.
- **Implement Orchestrator-Worker-Validator:**
  - **Orchestrator:** Coordinates execution flow and manages state.
  - **Workers:** Specialized agents extract Charterparty terms and Statement of Facts chronologies independently.
  - **Validator:** An independent node checking extracted values for consistency. Loops back for worker self-correction on failures.
- **Deterministic Math Engine Integration:** Feed output to the pure-Python laytime engine and weather exception rules.
- **Zero-Dependency Quick Start:** Allow running E2E tests using high-fidelity cached fixtures without requiring live API keys.

---

## 🛠️ Step-by-Step Implementation Map

### Step 1: Clone and Clean Codebase
- Duplicate the private `keel` repository to a public-facing showcase directory.
- Sanitize the commit history, erase local `.env` files, delete SQLite databases, and purge PDF test cases.
- Retain only the pure business logic: `engine/` laytime math, `rules/` BIMCO definitions, and `weather/` providers.

### Step 2: Configure Dependency Stack
- Update the Hatch/uv project metadata (`pyproject.toml`) to change the author name.
- Inject `langgraph` and `langchain-openai` into the dependencies array.

### Step 3: Implement LangGraph State Graph
- Code `apps/api/keel_api/pipeline_agents.py` with the following nodes:
  - `orchestrator`: Loads PDF preview files.
  - `cp_worker`: Extracts Charterparty terms. Supports cached JSON lookup for zero-key execution.
  - `sof_worker`: Extracts Owner and Charterer Statement of Facts.
  - `validator`: Audits coordination coordinates and checks coordinate values.
  - `laytime_engine`: Executes calculations using `LaytimeEngine`.
  - `adjudicator`: Computes final dispute verdicts using weather provider exception rules.
- Connect conditional edges to retry extraction up to 3 times if validator logs errors.

### Step 4: Adapt API Pipeline Entry Point
- Refactor `run_voyage_pipeline` inside `apps/api/keel_api/pipeline.py` to call our LangGraph multi-agent runner.
- Reconstruct output models to match original tuples, keeping the FastAPI database seed and E2E test suites fully intact.
