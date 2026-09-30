# Keel Ticket Tracker

> ## ⚠️ SUPERSEDED — 2026-09-30
>
> **This is the completion state of a 12-hour hackathon build, preserved as
> written.** The `[x]` / `[ ]` marks are what was true at the end of that day.
> They are **not** the state of the code today, and they contradict each other:
> A-08 is marked `[ ]` and B-10/B-11 are marked `[x]`, which was already true at
> the time and is not a statement about the current tree.
>
> **The working roadmap is [../continuation-plan.md](../continuation-plan.md).**
> The code as it actually is is described in [AGENTS.md](../../AGENTS.md) and
> [README.md](../../README.md).
>
> Corrections, each marked `> **Superseded — 2026-09-30:**`:
>
> - **The `file:///home/ertval/code/project-modules/keel/…` links are dead.** They
>   point at a private sibling repository that is not part of this checkout, so
>   none of them resolves here. Rewritten below as repo-relative paths.
> - **There is no `/register` route**; it was deleted as a fabrication. Login is a
>   demo stub that performs no credential check.
> - **There is no authentication of any kind** in this repo. The FastAPI service is
>   anonymous by default, and `apps/web/proxy.ts` says in its own first line that
>   it is not authentication. No SOC 2, ISO, or GDPR certification exists or is
>   claimed.
> - **"BIMCO 2013 rule library" (A-07) is a ticket title, not a sourcing claim.**
>   It must not be read as saying BIMCO supplies a weather threshold. It does
>   not: the *Laytime Definitions for Charter Parties 2013* supply only the
>   measurement basis for an excepted period (definition 16) and set no numeric
>   threshold. The threshold and the invocation test come from the charterparty,
>   and a weather verdict's `rule_authority` is `custom`
>   (`apps/api/keel_api/rules/evaluators.py:3-42`, `:60-65`).
> - **A-08 "Reconciliation differ + adjudicator" refers to a deleted package.**
>   `keel_api/reconcile/adjudicator.py` and `differ.py` are gone; the money rule
>   lives in `pipeline_agents.adjudicator_node` plus `apps/api/keel_api/adapters.py`.

A brief and concise tracker for the 12-hour hackathon build.

## Joint Checkpoints

| Ticket | Name | Status | Blocked By | Blocks |
| :---: | :--- | :---: | :--- | :--- |
| **J-01** | [Pre-flight: schemas + fixture](README.md#L53) | `[x]` | — | A-01, A-03, A-04, B-01 |
| **J-02** | [API contract checkpoint](README.md#L74) | `[ ]` | A-04, B-04 | A-05, B-06 |
| **J-03** | [Canonical assertion green](README.md#L96) | `[ ]` | A-08, B-08 | A-09, A-10, B-09, B-10, B-11 |
| **J-04** | [Demo rehearsal](README.md#L125) | `[ ]` | B-12, A-10 | — |

## Person A — Backend / Engine (Magnus)

| Ticket | Name | Status | Blocked By | Blocks |
| :---: | :--- | :---: | :--- | :--- |
| **A-01** | [FastAPI scaffold](magnus.md#L11) | `[x]` | J-01 | A-02 |
| **A-02** | [Canonical assertion test](magnus.md#L25) | `[x]` | A-01, J-01 | — |
| **A-03** | [PDF parsers](magnus.md#L43) | `[x]` | J-01 | A-04 |
| **A-04** | [LLM extraction with strict json_schema](magnus.md#L59) | `[x]` | J-01, A-03 | A-05, J-02 |
| **A-05** | [Calculation engine](magnus.md#L76) | `[x]` | J-01, J-02 | A-08 |
| **A-06** | [Weather provider](magnus.md#L98) | `[x]` | J-01 | A-08 |
| **A-07** | [BIMCO 2013 rule library](magnus.md#L115) | `[x]` | J-01 | A-08 |
| **A-08** | [Reconciliation differ + adjudicator](magnus.md#L137) | `[ ]` | A-05, A-06, A-07 | J-03 |
| **A-09** | [Claim letter endpoint (STRETCH)](magnus.md#L157) | `[ ]` | J-03 | B-10 |
| **A-10** | [Bug-fix loop](magnus.md#L171) | `[ ]` | J-03 | J-04 |

## Person B — Frontend / Demo UX (Ertval)

| Ticket | Name | Status | Blocked By | Blocks |
| :---: | :--- | :---: | :--- | :--- |
| **B-01** | [shadcn/ui setup + design system](ertval.md#L13) | `[x]` | J-01 | B-02, B-03 |
| **B-02** | [Login page](ertval.md#L34) | `[x]` | B-01 | B-03 |
| **B-03** | [App shell (sidebar + topbar)](ertval.md#L54) | `[x]` | B-01, B-02 | B-04, B-05 |
| **B-04** | [Dashboard page](ertval.md#L77) | `[x]` | B-03 | B-05, J-02 |
| **B-05** | [Upload flow (modal in dashboard)](ertval.md#L98) | `[x]` | B-04 | B-06 |
| **B-06** | [Voyage detail page (redesigned)](ertval.md#L123) | `[x]` | B-05, J-02 | B-07, B-08 |
| **B-07** | [PDF viewer](ertval.md#L140) | `[x]` | B-06 | B-08 |
| **B-08** | [Reconciliation page (the demo centerpiece)](ertval.md#L156) | `[x]` | B-06, A-08 | B-09, J-03 |
| **B-09** | [Reconciled total display](ertval.md#L178) | `[x]` | B-08, J-03 | J-04 |
| **B-10** | [Claim letter preview (STRETCH)](ertval.md#L199) | `[x]` | A-09, J-03 | — |
| **B-11** | [Bbox overlay on PDF (STRETCH)](ertval.md#L212) | `[x]` | J-03 | — |
| **B-12** | [Demo polish](ertval.md#L225) | `[x]` | B-09 | J-04 |

> **Superseded — 2026-09-30 — current status of the tickets this table tracks.**
>
> | Ticket area | Where it stands now |
> |---|---|
> | A-01 FastAPI | `apps/api/keel_api/main.py`, 872 lines, 10 routes, an upload admission path and an optional `KEEL_API_TOKEN`. |
> | A-02 Canonical test | **Green and enforced.** `uv run pytest -m canonical -q` → 15 passed; a named CI step. |
> | A-03 PDF parsers | PyMuPDF and pdfplumber, text-only, filename-routed, and now run in a subprocess with an address-space limit and a wall clock (`parsing/`). **Not exercisable in this checkout — no PDFs ship**, so 16 tests are quarantined. |
> | A-04 LLM extraction | OpenAI SDK, strict `json_schema`, 3 attempts, 30 s timeout, `temperature=0`, `p<page>L<line>` anchors resolved against real geometry. `langchain-openai` was removed. Runs from the `extracted_*.json` cache with no key. |
> | A-05 Calculation engine | `engine/state_machine.py`. FHEX still unimplemented; definition 17's artificial day still not modelled. |
> | A-06 Weather provider | `FixtureWeatherProvider` only. No live provider; the `WeatherProvider` protocol is still unimplemented elsewhere. |
> | A-07 Rules | `rules/evaluators.py`. See the sourcing correction at the top of this file. |
> | A-08 Adjudicator | **Shipped, by a different route.** The `reconcile/` package is deleted; the money rule is in `pipeline_agents.adjudicator_node` plus `adapters.py`. The canonical path is green. |
> | A-09 Claim letter | **HTML only.** `GET /voyages/{id}/letter` returns 400 for `?format=pdf` and points at the browser's Print → Save as PDF (`main.py:757-772`). No delivery of any kind. |
> | B-02 Login | A `"use client"` page that sets a published demo cookie. No credential check, no account. `/register` was deleted as a fabrication. |
> | B-05 Upload flow | Works, bounded at 25 MB/document, 60 MB/request, 12 documents, 200 pages/PDF, 4 concurrent runs. |
> | B-07 / B-11 PDF viewer and bbox overlay | Implemented in `components/PdfViewer.tsx`, with the worker vendored to `public/pdf.worker.min.mjs`. **Cannot render here: no source PDFs ship**, so it always shows its unavailable state. The citations behind it are real. |
> | B-10 Claim letter preview | Works. The page's send button reads "Not sent — no delivery service is connected". |
> | New since the hackathon | 27 graph control-flow tests (`test_agent_graph.py`), 62 API-hardening tests, a CSV-only reports export, 31 Playwright e2e tests, and a 4-job CI workflow with a tracked-path gate. Total: **330 backend tests** (16 failing on missing PDFs), **31 e2e tests**. |
