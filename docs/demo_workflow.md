# Keel — Hackathon Demo Recording Workflow

A tight, presentation-ready demo script (≈ 2:30 – 3:00 min) for showcasing Keel to the hackathon judges, plus high-leverage additions worth implementing before recording.

The whole demo is built around one sentence the judges should hear in the first 10 seconds:

> **"The shipowner claims $187,000. By the end of this demo, Keel will tell you the correct number is $112,000 — and prove it."**

---

## Pre-flight (off camera, 5 minutes before recording)

1. Run `pnpm dev` from the repo root → confirm http://localhost:3000 and http://localhost:8000/docs are both live.
2. Open the dashboard at least once so `voyage_001` is processed/cached (extraction cache lives in `fixtures/voyage_001/_cached_extracts.json`). The upload step should feel ~5s, not 30s.
3. Delete any stale "Demo Mode" voyages from previous rehearsals — judges should see an empty-ish, credible dashboard or 1–2 prior reconciled voyages for realism.
4. Have the 6 fixture files pre-selected in Finder so the drag-drop is one motion:
   - `charterparty.pdf`
   - `sof_owner.pdf`
   - `sof_charterer.pdf`
   - `claim_owner.pdf`
   - `claim_charterer.pdf`
   - `weather_port_xyz.json`
5. Set browser zoom to 110% in a 1280×800 window. Hide bookmarks bar. Light theme on (now the default).
6. Close devtools, mute notifications.

---

## Scene 1 — The pitch hook (0:00 – 0:15)

**On screen:** `/login` page.

**Voiceover:**
> "A Greek charterer just got a $187,000 demurrage claim from a shipowner. Their analyst thinks it should be closer to $62,000. That $125,000 gap is what Keel settles."

Log in with the demo credentials (instant — it's mocked).

---

## Scene 2 — The platform shell (0:15 – 0:30)

**On screen:** Dashboard with sidebar visible, stats cards, recent voyages table.

**Voiceover:**
> "Keel is a claims-intake and audit-intelligence platform. Analysts handle 5 to 20 active claims at a time — this is the queue."

- Hover briefly over the **Reports** link in the sidebar to flash the reports page (1,500 lines of charts) — signals "real product, not a toy."
- Click **New Voyage Analysis** in the top-right.

---

## Scene 3 — Document intake (0:30 – 0:55)

**On screen:** Upload modal with the 6-file checklist.

**Voiceover:**
> "The owner sent 5 PDFs — charterparty, two Statements of Facts, and both sides' calculations — plus port weather records. We drop them in."

- Drag all 6 files from `fixtures/voyage_001/` in a single motion. Watch the checklist tick off green.
- Click **Analyse Voyage**. Narrate over the spinner:

> "Behind the scenes: pdfplumber and PyMuPDF parse the documents, GPT-4o organizes and delegates structured facts under a strict JSON schema — but it never does a single calculation. All math runs in a deterministic state machine."

---

## Scene 4 — Voyage detail + cited extraction (0:55 – 1:25)

**On screen:** `/voyage/voyage_001` — extracted CP terms, both SOF timelines, side-by-side $187K vs $62K calculation cards.

**Voiceover:**
> "Keel pulled out laytime allowance, demurrage rate, weather clause, NOR timestamps — every field links back to the source PDF."

- Click one extracted field → PDF viewer opens with the bbox overlay highlighting the clause on the page. **This is the "no hallucinated dollars" moment — sell it.**
- Pan to the side-by-side calc cards: **Owner $187,000 / Charterer $62,000**.

> "Both calculations run end-to-end through the same deterministic engine — same `once on demurrage, always on demurrage` rule, same SHEX handling. The only difference is what each party put in their SOF."

Click **View Reconciliation**.

---

## Scene 5 — The moneyshot: per-day adjudication (1:25 – 2:15)

**On screen:** `/voyage/voyage_001/reconcile` — three day cards for June 14 / 15 / 16.

**Voiceover:**
> "Here's where Keel earns its keep. Three disputed days. For each one, we pull hourly port weather from external records and apply BIMCO Laytime Definitions 2013."

**Click June 14 card to expand:**
> "Owner says: Force 5 wind, below the WWD threshold — no exception. Charterer says: SOF logged a delay. Weather data confirms Force 5, light precipitation. Rule `BIMCO_2013.WWD.threshold` fires. Owner wins. +12 hours of laytime, +$25,000."

**Click June 15** — same beat, faster:
> "Force 4. Owner wins. +12 hours."

**Click June 16:**
> "Force 7, sustained heavy rain. Threshold met. Charterer wins. Zero hours added."

Scroll to the **Reconciled Total** banner:
> "Net result: one day of disputed time added back. Reconciled claim: **$112,000**. Every dollar traces to a clause, an SOF row, or a weather observation."

---

## Scene 6 — Claim letter (2:15 – 2:35)

Click **Generate Claim Letter** → `/voyage/voyage_001/letter`.

**Voiceover:**
> "Final output: a formal claim letter, cites BIMCO 2013, the charterparty clause, and the weather record per disputed day. The charterer emails this back to the owner. From inbox to defensible response in under a minute."

---

## Scene 7 — Close (2:35 – 3:00)

Back to dashboard. The new voyage shows **Reconciled: $112,000** in the table.

**Voiceover:**
> "Keel doesn't sell a calculator — those are commoditized. Keel sells the audit and the reconciliation. 5 to 10% of every demurrage dollar is written down because nobody has time to do this by hand. We just did it in 90 seconds."

---

## 🚀 Quick wins worth adding before you record

Cheap additions the judges will look for:

1. **"Time saved" counter on the dashboard stat card.** `resolution_seconds` is already tracked. Add a fifth card: *"Analyst hours saved: 14h"* (compute against a `MANUAL_BENCHMARK_MINUTES = 240` constant per voyage). One-line value prop visible without a click.

2. **Confidence badge on each extraction.** The voyage detail page shows extracted CP terms; render a tiny "High confidence · cited" pill next to each. Sells the "honest AI" story visually instead of only verbally.

3. **Copy-as-email button on the claim letter page.** Judges will ask "what happens next?" — a one-click *Copy to clipboard, formatted as email body* button makes the loop visibly closed. ~30 LOC in the letter page.

4. **A second "fake" reconciled voyage in the seed data** with a different verdict mix (e.g., charterer wins 2-of-3 days). Makes the dashboard feel populated and proves the engine isn't hardcoded to one outcome.

5. **Keyboard shortcut `D` to jump straight to the demo voyage** from anywhere. If your live demo glitches mid-flow, you recover instantly without scrolling.

6. **A 1-line "Why this is hard" caption above the day cards** on the reconcile page — e.g., *"BIMCO 2013 §6: weather must objectively prevent operations, not merely be logged."* Educates judges who aren't maritime experts. Without this, the verdicts look arbitrary.

**Highest leverage:** #1, #4, and #6 — each changes how a non-maritime judge perceives the product in under 10 seconds of additional screen time.
