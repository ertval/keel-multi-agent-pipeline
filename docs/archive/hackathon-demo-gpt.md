# Keel Hackathon Demo Workflow

Purpose: record a tight 2-minute judge video that proves Keel's core value:

> The owner claims **$187,000**. Keel reconciles it to **$112,000** with cited charterparty, SOF, BIMCO 2013, and weather evidence.

## Recording Assumptions

- Use the canonical fixture voyage: `voyage_001`.
- Record the web UI, not terminal output.
- Prefer the built-in **Demo Mode** button during recording. It avoids waiting on file dialogs and keeps the video deterministic.
- If the backend is fully running and upload is stable, you may drag the six fixture files from `fixtures/voyage_001/`, but do not spend video time debugging uploads.

## Pre-Recording Setup

1. Start the app:

   ```bash
   pnpm dev
   ```

2. Open `http://localhost:3000`.
3. Browser zoom: 90% or 100%, whichever keeps the three reconciliation cards visible.
4. Close unrelated tabs and notifications.
5. Have this path ready if you want to show real documents:

   ```text
   fixtures/voyage_001/
   ```

6. Rehearse once and make sure these screens load:
   - `/login`
   - `/dashboard`
   - `/voyage/voyage_001`
   - `/voyage/voyage_001/reconcile`
   - `/voyage/voyage_001/letter`

## Two-Minute Script

### 0:00-0:10 — Open With The Problem

Screen: Keel login page.

Say:

> Keel is a claims intake and audit platform for maritime demurrage. In shipping, an owner may send a claim for hundreds of thousands of dollars, and the charterer has to manually verify clauses, SOF timestamps, and weather exceptions. That usually means days in PDFs and Excel.

Action:

- Click **Enter Demo Mode**.

### 0:10-0:25 — Show This Is A Platform

Screen: Dashboard.

Say:

> This is built for the charterer's demurrage analyst. The dashboard tracks active voyages, disputed items, reconciled value, and average resolution time.

Action:

- Point briefly to the stats cards.
- Point to the recent voyage table.
- Click **New Voyage Analysis**.

### 0:25-0:40 — Show The Intake

Screen: New Voyage Analysis modal.

Say:

> For a new case, the analyst drops in the charterparty, both Statements of Facts, the owner's claim, the charterer's counter-calculation, and the port weather record.

Action:

- Let the checklist be visible for 2-3 seconds.
- Click **Demo Mode** in the modal.

Do not spend time dragging files unless upload is already smooth in rehearsal.

### 0:40-1:00 — Show Extraction And The Dispute

Screen: Voyage detail page.

Say:

> Keel extracts the contract terms and calculates both positions. Here the owner's claimed total is **$187,000**, while the charterer's position is **$62,000**. The gap is not arbitrary. It comes from three disputed weather days.

Action:

- Point to **Charterparty Terms**: laytime, demurrage rate, exceptions.
- Point to **Owner Calculation: $187,000**.
- Point to **Charterer Calculation: $62,000**.
- If time allows, click one audit trace row to show the document citation/PDF viewer.
- Click **View Reconciliation**.

### 1:00-1:35 — The Money Shot

Screen: Reconciliation page.

Say:

> This is the core of Keel. The LLM only extracts facts. The adjudication is deterministic. Keel applies the BIMCO 2013 weather working day rule against port weather evidence for each disputed day.

Action:

- Show the two position cards: owner **$187,000**, charterer **$62,000**.
- Move across the three day cards:
  - June 14: Owner wins.
  - June 15: Owner wins.
  - June 16: Charterer wins.
- Point to the weather record chips: Beaufort force, precipitation, adverse hours.
- Open one **BIMCO 2013** clause toggle if the motion is smooth.

Say:

> Two days are credited back to the owner. One day remains excepted for the charterer. So Keel does not split the difference. It produces a rule-backed reconciled total.

Action:

- Scroll or point to the bottom band.
- Pause on **Reconciled total: $112,000**.

### 1:35-1:55 — Show The Output

Screen: Reconciliation bottom band, then claim letter.

Say:

> The analyst can now generate the response letter with the reasoning attached: party positions, weather evidence, BIMCO clause citations, and the final payable amount.

Action:

- Click **Generate Claim Letter**.
- Let the letter preview load.
- Point to:
  - Owner total.
  - Charterer total.
  - Per-day analysis.
  - **Reconciled Total Payable: $112,000**.

### 1:55-2:00 — Close

Screen: Claim letter or reconciled total.

Say:

> Keel turns adversarial demurrage claims from manual PDF review into a cited, deterministic reconciliation workflow.

## Exact Click Path

1. `/login`
2. **Enter Demo Mode**
3. **New Voyage Analysis**
4. **Demo Mode**
5. **View Reconciliation**
6. Optional: open one BIMCO clause toggle
7. **Generate Claim Letter**

## What Judges Must Remember

- The user is the **charterer**, not the shipowner.
- Keel is not just a calculator; it is a claim audit and reconciliation workflow.
- The key number is **$112,000**, derived from:

  ```text
  $62,000 charterer baseline + $50,000 adjudicated weather credit = $112,000
  ```

- The strongest differentiator is the evidence chain:
  - Charterparty clause.
  - SOF event rows.
  - Port weather record.
  - BIMCO 2013 rule.
  - Deterministic calculation.

## Avoid In The Video

- Do not explain implementation internals for more than one sentence.
- Do not say the AI calculates the claim. Say it extracts facts; deterministic rules calculate and adjudicate.
- Do not show broken or pending backend states.
- Do not browse source code.
- Do not spend time on settings, reports, or non-canonical voyages.

## Backup Recording Plan

If upload or backend polling is unreliable, skip intake after showing the upload modal:

1. Say: "For the recording, I will use the preloaded canonical voyage."
2. Navigate directly to:

   ```text
   http://localhost:3000/voyage/voyage_001
   ```

3. Continue from the voyage detail page.

This is acceptable because the judging value is the reconciliation and evidence chain, not watching files upload.
