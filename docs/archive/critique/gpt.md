This is a strong hackathon PRD. It is not yet a strong startup PRD.

The biggest issue is that the PRD is optimized around a demo narrative ("$187K → $112K") rather than around proving a sustainable wedge in a market where incumbents are rapidly converging on AI-assisted claims automation. The architecture is cleaner than most hackathon projects, but several design decisions would become liabilities in production.

# Executive Assessment

| Area                                 | Rating |
| ------------------------------------ | ------ |
| Hackathon viability                  | 9/10   |
| Technical architecture (MVP)         | 8/10   |
| Technical architecture (production)  | 5/10   |
| Market attractiveness                | 8/10   |
| Defensibility                        | 4/10   |
| Differentiation vs incumbents        | 4/10   |
| Likelihood of customer paying        | 6/10   |
| VC attractiveness                    | 6/10   |
| FDE-backed consulting attractiveness | 8/10   |

---

# Business Critique

## Problem #1: Your moat is weaker than the PRD assumes

The PRD repeatedly states:

> "multi-party reconciliation"

as the moat.

I don't think it is.

The reason:

Recent products are already moving toward exactly this workflow.

Marcura now owns both HubSE and Shipdem and is heavily investing in AI-driven claims processing. Their public messaging increasingly emphasizes automated claim review, document extraction, and workflow orchestration. ([marcura.com][1])

Veson's Claims CoCaptain already provides:

* SOF comparison
* clause extraction
* source citations
* claim reconciliation
* claim negotiation workflows
* AI explanations
* document provenance
* activity logs

These overlap significantly with Keel's proposed workflow. ([Veson Help Center][2])

The PRD understates how close incumbents already are.

---

## Problem #2: The wedge is too narrow

Current positioning:

> "adjudicate weather disputes"

The issue:

Weather disputes are only one class of demurrage disputes.

In reality analysts spend time on:

* NOR validity
* WIBON
* berth congestion
* pumping warranties
* shifting
* cargo readiness
* reversible laytime
* notice periods
* local customs
* clause interpretation

Weather is probably not the dominant category.

You risk building:

> "The world's best weather dispute tool"

instead of

> "The operating system for claims negotiation"

The latter is much larger.

---

## Problem #3: You may be attacking the wrong buyer

Your user:

> Demurrage Analyst

This is logical.

But the economic buyer is often:

* Head of Claims
* Chartering Manager
* Operations Director
* CFO

The PRD never discusses:

* purchasing process
* budget owner
* implementation timeline
* ROI model

Without this you have no GTM.

---

## Problem #4: No evidence SMEs want self-service

This is the biggest market risk.

The PRD assumes:

> SMEs will buy software.

But many shipping SMEs currently solve claims via:

* spreadsheets
* email
* brokers
* consultants
* outsourced specialists

The actual winning model might be:

> AI-assisted claims service

rather than

> SaaS platform

Marcura's acquisitions suggest the same conclusion:

They continue combining software with expert services rather than going fully self-serve. ([marcura.com][3])

This should make you uncomfortable.

---

## Problem #5: Network effects are probably fictional

Phase 3 says:

> anonymized reconciliation outcomes become the moat

I don't buy this.

Reason:

Every claim is heavily contextual.

Customers care about:

* charterparty wording
* counterparties
* legal jurisdiction
* vessel class
* cargo

Aggregated win rates are weak signals.

This looks like a VC slide moat rather than a real moat.

---

# What Is The Real Moat?

The PRD misses what could actually become a moat:

## Clause Intelligence

Not weather.

Not reconciliation.

Not calculation.

Instead:

A proprietary corpus of:

* charterparty clauses
* dispute outcomes
* analyst decisions
* settlement patterns

If Keel learns:

> "Clause X under BIMCO wording usually results in outcome Y"

that becomes valuable.

The strongest future product isn't:

> Calculator

It's:

> Recommendation engine for claims strategy.

---

# Technology Critique

Now the architecture.

---

## Problem #6: Filename-based document routing is a dead end

Current:

```python
dispatcher.py
routes PDFs by filename
```

This is acceptable for a demo.

Production:

Claims arrive as:

```
IMG_4455.pdf
scan.pdf
attachment.pdf
```

You already acknowledge this.

I would classify this as:

### Architectural Debt Level: Critical

Document classification should be first-class from day 1.

---

## Problem #7: GPT extraction architecture is brittle

Current:

```python
PDF
 -> text
 -> GPT extraction
 -> structured schema
```

Failure mode:

```
bad OCR
↓
bad extraction
↓
bad calculation
↓
confidently wrong verdict
```

This is the central production risk.

The PRD does not adequately address:

* extraction confidence
* uncertainty propagation
* conflicting evidence

---

## Problem #8: Missing confidence model

This is a major design flaw.

Every extraction should produce:

```python
confidence
evidence
alternative interpretations
```

Instead you have:

```python
value
citation
```

Real contracts are ambiguous.

You need:

```python
ClauseInterpretationCandidate[]
```

not

```python
Clause
```

---

## Problem #9: State machine is too simplistic

Current states:

```python
BEFORE_NOR
ON_LAYTIME
WEATHER_PAUSE
ON_DEMURRAGE
```

This works for demo.

Production charterparties become combinatorial.

Eventually you'll need:

* event sourcing
* temporal reasoning
* rule engine

not a simple finite state machine.

Otherwise every new clause becomes:

```python
if ...
elif ...
elif ...
```

and the engine collapses.

---

## Problem #10: BIMCO encoded as code

Current:

```python
rules/evaluators.py
```

This will not scale.

The real problem:

Customers have custom clauses.

Eventually:

```python
BIMCO + rider clause 17 + rider clause 44
```

The architecture should move toward:

```python
Rule DSL
```

or

```python
Rule graph
```

not Python conditionals.

---

## Problem #11: Audit trace is not legally defensible

You claim:

> Every number traceable

Not enough.

Legal-grade auditability requires:

* source versioning
* document hash
* extraction version
* model version
* rule version

Currently none appear in schemas.

This is a major omission.

---

## Problem #12: Open-Meteo may not survive customer scrutiny

This is bigger than it looks.

A customer can immediately say:

> "The rain station is 18 km from berth."

Now your verdict collapses.

Weather evidence in claims often requires:

* station provenance
* port authority logs
* surveyor reports
* operational evidence

not generic weather APIs.

---

## Problem #13: Reconciliation architecture is backwards

Current model:

```python
owner trace
charterer trace
weather
↓
reconcile
```

I think the better model is:

```python
Evidence Graph

CP
SOF owner
SOF charterer
weather
claim
emails
port logs

↓

facts

↓

rule evaluation

↓

verdict
```

You are reconciling outputs.

You should reconcile facts.

Huge difference.

---

# Product Strategy Critique

The biggest missing feature is:

## Human Override Layer

You mention it later.

It should be core.

Reason:

Nobody wants:

> AI decides.

They want:

> AI proposes.

The winning workflow is:

```text
AI identifies dispute
AI proposes resolution
Analyst approves
Letter generated
```

Not:

```text
AI settles truth
```

The phrase:

> "The truth is settled"

is dangerous.

Lawyers will hate it.

Customers may hate it.

Better:

> "Keel identifies the most supportable position."

---

# What I Would Change

If I were turning this into a startup tomorrow:

## Repositioning

Not:

> Demurrage Reconciliation Platform

Instead:

> Claims Intelligence Copilot for Maritime Operators

---

## Expand Scope

Handle:

* weather
* NOR validity
* WIBON
* pumping
* shifting
* berth congestion

from day one conceptually.

---

## Architecture

Move toward:

```text
Document Layer
    ↓
Fact Layer
    ↓
Evidence Graph
    ↓
Rule Engine
    ↓
Verdict Suggestions
    ↓
Human Approval
```

rather than:

```text
Parser
 ↓
LLM
 ↓
Calculator
 ↓
Reconciliation
```

---

## Moat

Build:

```text
Clause corpus
+
Settlement outcomes
+
Analyst decisions
+
Counterparty behavior
```

That becomes increasingly difficult for competitors to replicate.

---

# Final Verdict

The PRD is excellent for winning a maritime-focused hackathon because it tells a crisp story, has deterministic outputs, and demonstrates a real workflow.

As a venture-scale company, however, I would score it:

**Business: 6/10**

* Real pain point.
* Real buyers.
* Strong demo.
* Weak moat.
* Incumbents already converging on similar functionality. ([marcura.com][1])

**Technology: 7/10**

* Clean separation of concerns.
* Good deterministic philosophy.
* Good schema discipline.
* Overfit to canonical demo.
* Not yet architected for the clause complexity of real-world maritime claims.

The strongest future version of Keel is not a demurrage calculator and not a weather adjudicator. It is a **maritime claims intelligence platform that learns how disputes are resolved and helps analysts negotiate faster and more accurately than incumbent systems.** That vision is materially stronger than the current PRD.

[1]: https://marcura.com/blog/marcura-acquires-hubse?utm_source=chatgpt.com "Marcura Acquires HubSE to Enhance Demurrage Automation Across All Cargo Types"
[2]: https://help.veson.com/imosx/imos-x-claims-cocaptain?utm_source=chatgpt.com "IMOS X - Claims CoCaptain | Veson Help Center"
[3]: https://marcura.com/blog/marcura-acquires-shipdem-strengthening-chemical-tanker-claims-capability?utm_source=chatgpt.com "Marcura Acquires Shipdem to Strengthen Chemical Tanker Demurrage Expertise"
