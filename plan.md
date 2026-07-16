# Execution Plan: Keel Multi-Agent Pipeline

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
