# AGENTS.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

# Repository Map & Architecture

To work with progressive disclosure, use the following high-level index of the repository. Do not read the entire codebase or full markdown documents unless you need granular details for a specific file.

## Core Documentation
- [PRD (Product Requirements Document)](file:///home/ertval/code/project-modules/keel/docs/prd.md) — Product summary, the canonical scenario, non-negotiable design rules, tech stack, and roadmap.
- [Ticket Directory README](file:///home/ertval/code/project-modules/keel/docs/tickets/README.md) — Details of the 12-hour hackathon execution timeline, joint tickets, and dependency graph.
- [Ticket Tracker](file:///home/ertval/code/project-modules/keel/docs/tickets/tracker.md) — Current completion status of backend/frontend tasks.

## Codebase Layout & Entrypoints

### 1. Backend API (FastAPI) — `/apps/api`
The backend handles document parsing, LLM-based fact extraction, laytime calculation, and weather exception rules evaluation.
- **Entrypoint:** [main.py](file:///home/ertval/code/project-modules/keel/apps/api/keel_api/main.py) — API entrypoint (currently health checks `/healthz`; integration routes are mocked on the frontend).
- **Pipeline Orchestrator:** [pipeline.py](file:///home/ertval/code/project-modules/keel/apps/api/keel_api/pipeline.py) — The orchestrator structure for running the end-to-end audit process (A-08 reconciliation and pipeline are not yet fully wired).
- **Data Contracts:** [schemas.py](file:///home/ertval/code/project-modules/keel/apps/api/keel_api/schemas.py) — Pydantic schemas shared between layers and the frontend.
- **Parsing Layer:** `/apps/api/keel_api/parsing/`
  - [dispatcher.py](file:///home/ertval/code/project-modules/keel/apps/api/keel_api/parsing/dispatcher.py) — Routes PDFs to specialized parsers based on document type.
  - [pdfplumber_parser.py](file:///home/ertval/code/project-modules/keel/apps/api/keel_api/parsing/pdfplumber_parser.py) — Handles tabular data extraction (SOFs/claims).
  - [pymupdf_parser.py](file:///home/ertval/code/project-modules/keel/apps/api/keel_api/parsing/pymupdf_parser.py) — Handles prose narrative extraction (charterparties).
- **LLM Extraction Layer:** `/apps/api/keel_api/extraction/`
  - [extractor.py](file:///home/ertval/code/project-modules/keel/apps/api/keel_api/extraction/extractor.py) — Extracts contract terms and statement of facts events via GPT-4o JSON Schema.
- **Calculation Engine:** `/apps/api/keel_api/engine/`
  - [state_machine.py](file:///home/ertval/code/project-modules/keel/apps/api/keel_api/engine/state_machine.py) — Pure Python state machine calculator enforcing laytime and SHEX/SHINC rules.
- **Weather Provider:** `/apps/api/keel_api/weather/`
  - [fixture_provider.py](file:///home/ertval/code/project-modules/keel/apps/api/keel_api/weather/fixture_provider.py) — Pre-built fixture-backed weather record provider.
- **Rules Library:** `/apps/api/keel_api/rules/`
  - [evaluators.py](file:///home/ertval/code/project-modules/keel/apps/api/keel_api/rules/evaluators.py) — BIMCO 2013 Weather Working Day (WWD) threshold logic.
- **Execution & Integration Tests:** `/apps/api/tests/`
  - [test_parsers.py](file:///home/ertval/code/project-modules/keel/apps/api/tests/test_parsers.py), [test_extraction.py](file:///home/ertval/code/project-modules/keel/apps/api/tests/test_extraction.py), [test_engine.py](file:///home/ertval/code/project-modules/keel/apps/api/tests/test_engine.py), [test_weather.py](file:///home/ertval/code/project-modules/keel/apps/api/tests/test_weather.py), [test_bimco_rules.py](file:///home/ertval/code/project-modules/keel/apps/api/tests/test_bimco_rules.py) — Unit and integration tests for each module.
  - [test_canonical.py](file:///home/ertval/code/project-modules/keel/apps/api/tests/test_canonical.py) — End-to-end integration test (asserts the canonical $112K scenario, currently failing on unimplemented pipeline orchestrator).

### 2. Frontend Application (Next.js) — `/apps/web`
The frontend renders the dashboard, uploads voyage documents, displays side-by-side reconciliation, highlight overlays on PDFs, and generates the final claim letter.
- **App Routes:** `/apps/web/app/`
  - `page.tsx` — Redirects to login.
  - `(auth)/login/page.tsx` — Enterprise login page.
  - `(dashboard)/dashboard/page.tsx` — Dashboard view (with stats, recent voyages table, and upload flow dialog).
  - `voyage/[id]/page.tsx` — Voyage detail page showing extracted terms, side-by-side calculations, and the audit trace table.
  - `voyage/[id]/reconcile/page.tsx` — Reconciliation view presenting disputed line items, BIMCO WWD verdicts, and the money shot ($112,000 reconciled total).
  - `voyage/[id]/letter/page.tsx` — Styled preview of the final demurrage claim letter.
- **Components:** `/apps/web/components/`
  - [PdfViewer.tsx](file:///home/ertval/code/project-modules/keel/apps/web/components/PdfViewer.tsx) — Embeds PDF with bounding box highlight overlays (from clicked audit-trace rows).
  - [AppSidebar.tsx](file:///home/ertval/code/project-modules/keel/apps/web/components/AppSidebar.tsx) — Enterprise sidebar navigation layout.
  - *(Note: Audit trace tables and reconciliation day-verdict cards are implemented inline directly inside their respective page routes rather than as separate files.)*


---
