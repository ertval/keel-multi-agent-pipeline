# Keel Ticket Tracker

A brief and concise tracker for the 12-hour hackathon build.

## Joint Checkpoints

| Ticket | Name | Status | Blocked By | Blocks |
| :---: | :--- | :---: | :--- | :--- |
| **J-01** | [Pre-flight: schemas + fixture](file:///home/ertval/code/project-modules/keel/docs/tickets/README.md#L17) | `[x]` | — | A-01, A-03, A-04, B-01 |
| **J-02** | [API contract checkpoint](file:///home/ertval/code/project-modules/keel/docs/tickets/README.md#L30) | `[ ]` | A-04, B-04 | A-05, B-06 |
| **J-03** | [Canonical assertion green](file:///home/ertval/code/project-modules/keel/docs/tickets/README.md#L43) | `[ ]` | A-08, B-08 | A-09, A-10, B-09, B-10, B-11 |
| **J-04** | [Demo rehearsal](file:///home/ertval/code/project-modules/keel/docs/tickets/README.md#L56) | `[ ]` | B-12, A-10 | — |

## Person A — Backend / Engine (Magnus)

| Ticket | Name | Status | Blocked By | Blocks |
| :---: | :--- | :---: | :--- | :--- |
| **A-01** | [FastAPI scaffold](file:///home/ertval/code/project-modules/keel/docs/tickets/magnus.md#L11) | `[x]` | J-01 | A-02 |
| **A-02** | [Canonical assertion test](file:///home/ertval/code/project-modules/keel/docs/tickets/magnus.md#L25) | `[x]` | A-01, J-01 | — |
| **A-03** | [PDF parsers](file:///home/ertval/code/project-modules/keel/docs/tickets/magnus.md#L43) | `[x]` | J-01 | A-04 |
| **A-04** | [LLM extraction with strict json_schema](file:///home/ertval/code/project-modules/keel/docs/tickets/magnus.md#L59) | `[x]` | J-01, A-03 | A-05, J-02 |
| **A-05** | [Calculation engine](file:///home/ertval/code/project-modules/keel/docs/tickets/magnus.md#L76) | `[x]` | J-01, J-02 | A-08 |
| **A-06** | [Weather provider](file:///home/ertval/code/project-modules/keel/docs/tickets/magnus.md#L98) | `[x]` | J-01 | A-08 |
| **A-07** | [BIMCO 2013 rule library](file:///home/ertval/code/project-modules/keel/docs/tickets/magnus.md#L115) | `[x]` | J-01 | A-08 |
| **A-08** | [Reconciliation differ + adjudicator](file:///home/ertval/code/project-modules/keel/docs/tickets/magnus.md#L137) | `[ ]` | A-05, A-06, A-07 | J-03 |
| **A-09** | [Claim letter endpoint (STRETCH)](file:///home/ertval/code/project-modules/keel/docs/tickets/magnus.md#L157) | `[ ]` | J-03 | B-10 |
| **A-10** | [Bug-fix loop](file:///home/ertval/code/project-modules/keel/docs/tickets/magnus.md#L171) | `[ ]` | J-03 | J-04 |

## Person B — Frontend / Demo UX (Ertval)

| Ticket | Name | Status | Blocked By | Blocks |
| :---: | :--- | :---: | :--- | :--- |
| **B-01** | [shadcn/ui setup + design system](file:///home/ertval/code/project-modules/keel/docs/tickets/ertval.md#L13) | `[x]` | J-01 | B-02, B-03 |
| **B-02** | [Login page](file:///home/ertval/code/project-modules/keel/docs/tickets/ertval.md#L34) | `[x]` | B-01 | B-03 |
| **B-03** | [App shell (sidebar + topbar)](file:///home/ertval/code/project-modules/keel/docs/tickets/ertval.md#L54) | `[x]` | B-01, B-02 | B-04, B-05 |
| **B-04** | [Dashboard page](file:///home/ertval/code/project-modules/keel/docs/tickets/ertval.md#L77) | `[x]` | B-03 | B-05, J-02 |
| **B-05** | [Upload flow (modal in dashboard)](file:///home/ertval/code/project-modules/keel/docs/tickets/ertval.md#L98) | `[x]` | B-04 | B-06 |
| **B-06** | [Voyage detail page (redesigned)](file:///home/ertval/code/project-modules/keel/docs/tickets/ertval.md#L123) | `[x]` | B-05, J-02 | B-07, B-08 |
| **B-07** | [PDF viewer](file:///home/ertval/code/project-modules/keel/docs/tickets/ertval.md#L140) | `[x]` | B-06 | B-08 |
| **B-08** | [Reconciliation page (the demo centerpiece)](file:///home/ertval/code/project-modules/keel/docs/tickets/ertval.md#L156) | `[x]` | B-06, A-08 | B-09, J-03 |
| **B-09** | [Reconciled total display](file:///home/ertval/code/project-modules/keel/docs/tickets/ertval.md#L178) | `[x]` | B-08, J-03 | J-04 |
| **B-10** | [Claim letter preview (STRETCH)](file:///home/ertval/code/project-modules/keel/docs/tickets/ertval.md#L199) | `[x]` | A-09, J-03 | — |
| **B-11** | [Bbox overlay on PDF (STRETCH)](file:///home/ertval/code/project-modules/keel/docs/tickets/ertval.md#L212) | `[x]` | J-03 | — |
| **B-12** | [Demo polish](file:///home/ertval/code/project-modules/keel/docs/tickets/ertval.md#L225) | `[x]` | B-09 | J-04 |
