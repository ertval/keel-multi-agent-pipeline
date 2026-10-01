# Keel — Hackathon Demo Recording Workflow

A presentation-ready script (≈ 2:30 – 3:00 min) for the recorded demo, corrected 2026-09-30 against the running application.

**Every figure, label and button in this script was checked against the app.** Where the previous version of this script was wrong, the correction is noted at the point of the error so a presenter who has memorised the old lines knows what changed.

The whole demo is built around one sentence the judges should hear in the first 10 seconds:

> **"The shipowner claims $187,000. Keel reconciles it to $112,000 — and shows you the clause and the timestamp for every dollar of the difference."**

---

## Read this before you record

Four things are true of this checkout and they change the script. Do not script around them; narrate them.

1. **No source PDFs ship with this build.** `fixtures/voyage_001/` holds the weather JSON, the five cached extraction files, and the expected reconciliation. The five PDFs are absent. Consequences you will see on screen: the upload dialog's second button is **Demo Mode**, which opens the voyage the API seeds at start-up; and the citation panel says the preview cannot load, because there is no document to load.
2. **There is no send path and no sign-off gate.** The letter page's *Send to Other Party* button opens a dialog headed **Delivery Is Not Available**. Click it. It is the most honest thing on the screen and it costs eight seconds.
3. **The weather threshold is the charterparty's, not BIMCO's.** The demo says so out loud. Getting this wrong in a recorded demo to a room that includes a maritime lawyer is the single most expensive mistake available here.
4. **A key is not needed to run the demo, and the landing page says so.** `/` is a public landing page — it does not redirect to `/login` — and its *This Build* panel reads *"No API key needed for the demo voyage; a key is needed to extract from your own PDFs"* (`app/page.tsx:571`). An earlier version of that line claimed a key was required, which was false for the demo path and would have cost you a question in Q&A. If someone asks for the key: `_all_extracts_cached` (`pipeline_agents.py:95-97`) finds all five `extracted_*.json` files in the fixture directory, so the graph never calls the LLM. `OPENAI_API_KEY` is only needed for a live extraction of your own upload.

---

## Pre-flight (off camera, 5 minutes before recording)

1. Delete the stale database, then start the API. A stale SQLite WAL makes seeding fail with a lock error, `lifespan` swallows it, and the API boots with no demo voyage and every data page renders empty.

   ```bash
   cd apps/api
   rm -f keel.db keel.db-wal keel.db-shm
   uv run uvicorn keel_api.main:app --host 127.0.0.1 --port 8000
   ```

   *This is now only about a half-written database left by a previous API
   process.* It used to also be about the test suite: `uv run pytest` shares
   `apps/api/keel.db` unless something points `KEEL_DB` elsewhere, and it did,
   writing ~50 `voyage_*` test rows into the very database this API serves —
   which is why you may find a `voyage_contract_pos_*` or `voyage_hardening_*`
   row on the dashboard. `apps/api/tests/conftest.py` now points `KEEL_DB` at a
   per-session throwaway file whose name carries the pytest process id and
   deletes it, with its WAL/SHM sidecars, on exit, so the suite cannot touch the
   demo database. If you see those rows, they are from a run predating that file,
   and the `rm -f` above clears them.

   Then confirm the demo voyage exists:

   ```bash
   curl -s http://127.0.0.1:8000/voyages/voyage_001 | head -c 200
   ```

2. Start the web app **in `apps/web`**, not at the repo root:

   ```bash
   cd apps/web
   pnpm dev
   ```

3. Use `http://localhost:3000`, not `http://127.0.0.1:3000`. The API's CORS allowlist is a list of *origins* and defaults to `http://localhost:3000`; a request from the `127.0.0.1` origin gets no `Access-Control-Allow-Origin` header and every data-backed page renders empty with no error. This is the most common way to break the demo five minutes before recording.

4. Open `http://localhost:3000/login` once, so Turbopack has compiled the routes. A cold `next dev` compiles each route on first request and a first-request stall mid-recording is very visible.

5. Browser window 1280×800. Hide the bookmarks bar. Close devtools. Mute notifications.

6. Warm the pipeline once so you know the number you will say. The fixture path is cache-only, so there is no API key needed and no LLM call:

   ```
   $ cd apps/api && uv run python -c "
   import time; from pathlib import Path
   from keel_api.pipeline import run_voyage_pipeline
   fx = Path('../../fixtures/voyage_001').resolve()
   t0 = time.perf_counter()
   run_voyage_pipeline(fx, voyage_id='voyage_001')
   print(f'{time.perf_counter()-t0:.3f}s')"
   1.232s
   ```

   **Say "about a second", not "90 seconds" and not "10 seconds".** Measured on this machine: the first (cold) run is ~1.2 s, a warm one ~7 ms. The status poll interval is 250 ms, which is why the progress messages flash past — treat them as "the latest thing the server said", not a progress stream. Do not promise to narrate over a spinner; there is no spinner worth narrating over.

---

## Scene 1 — The hook (0:00 – 0:15)

**On screen:** `http://localhost:3000/login`

**Voiceover:**
> "A shipowner has claimed $187,000 in demurrage. The charterer's own position is $62,000. That $125,000 gap is weather — three disputed dates, 60 hours of claimed stoppage, at $50,000 a day. That is what Keel settles."

Click **Enter Demo Mode**. The page beneath says *"Demo credentials: demo@keel.io / any password"*.

> "One thing before we start: this is demo mode. There are no user accounts, and the route guard in the app is a stub that anyone can satisfy from the console. The backend is unauthenticated too. It is an open tool, and I will come back to that."

> *(If asked: the API does have an optional `KEEL_API_TOKEN` — one shared secret, off by default, with no identity, no expiry and no per-voyage check. It is a door, not a lock.)*

---

## Scene 2 — The shell (0:15 – 0:30)

**On screen:** `/dashboard` — sidebar, stat cards, Recent Voyages.

> "Keel is claims intake and audit support. One analyst, one voyage, one reconciliation. Here is the seeded demo voyage — $187,000 against $62,000."

Hover **Reports** for one second. That is the whole beat. The old script said to hover "to flash 1,500 lines of charts"; it is one page of aggregate panels and you should not oversell it.

Click **New Voyage Analysis** (top right).

---

## Scene 3 — Intake, honestly (0:30 – 0:50)

**On screen:** the upload dialog.

> "The pipeline reads five PDFs and one weather record. This build ships none of the five PDFs — the checkout is sanitised — so the checklist cannot be ticked. There is a second button."

Click **Demo Mode**.

> "Behind that button, the same pipeline runs on the cached extraction for a Piraeus fixture voyage. Here is what actually happens, and it takes about a second."

> "A LangGraph runs an orchestrator, a charterparty worker and an SOF worker. The workers converge on a validator — one join, not two edges. The validator checks the vessel name and the load-port coordinates and, if it complains, fans back out to *both* workers with the finding tagged to the document that can fix it, up to three times. Then a pure-Python state machine does every dollar of laytime, for the owner and for the charterer, on the same engine. The model fills a JSON schema. It never produces a number."

---

## Scene 4 — The audit trail (0:50 – 1:20)

**On screen:** `/voyage/voyage_001` — Charterparty Terms, Owner Calculation, Charterer Calculation, the two audit-trace tables.

> "Owner, $187,000. Charterer, $62,000. Same engine, same once-on-demurrage rule, same SHEX handling. The only difference is what each party wrote in their own Statement of Facts."

**This is the corrected beat. The old script said: "Click one extracted field → PDF viewer opens with the bbox overlay highlighting the clause on the page. This is the 'no hallucinated dollars' moment — sell it." That does not happen in this build, because there is no PDF to render.** Do the real thing instead:

1. Click a **`p.1`** pill in the Owner trace, step 1. The panel that opens is headed **DOCUMENT VIEWER** and reads:

   > *Owner calculation · step 1 · sof_owner.pdf · p.1*
   >
   > *This build ships no source PDF, so the preview cannot load. The citation still names the document and page the engine read. The page number and every figure in the audit trace come from the pipeline and are unaffected.*
   >
   > *CHARTERPARTY CLAUSE THIS STEP WAS MEASURED AGAINST*
   >
   > *The API cited no charterparty clause for this step, so there is no clause text to quote. The figures above still rest on the SOF row they were read from.*

   > "The panel tells you which party and which step it came from, which document, and the page. And because a NOR event cites no clause, it says exactly that instead of quoting something to fill the space."

2. Click the **`WEATHER_PAUSE: Weather delay commenced`** row in the *Charterer* trace (step 5). The same panel, different content: the header now reads *Charterer calculation · step 5 · sof_charterer.pdf · p.1*, and under the charter-party heading the clause is quoted in full, tagged **charterparty.pdf · p.3**.

   > "Two different documents on one row. The timestamp came from the Statement of Facts. The rule came from the charter party. The panel keeps them apart."

   **Pause on the preview pane.** It is the honest empty state, and it is the best thirty seconds in the demo:

   > "No PDF ships with this build, so there is nothing to render — and the panel says that, rather than blaming a document server that answered correctly. The page number above it is real. It came out of the parser."

Click **View Reconciliation**.

---

## Scene 5 — The money shot: per-day assessment (1:20 – 2:10)

**On screen:** `/voyage/voyage_001/reconcile` — the header badge, the two party-total cards, three day cards, the reconciled total.

> "Three disputed days. Here is the header, and it is the whole argument of this product in one line: **measurement basis from the Laytime Definitions, threshold from this charterparty**."

> "The 2013 Laytime Definitions supply how an excepted period is *measured*. They contain no wind force, no rainfall figure and no threshold of any kind — the framework's own text is definitions 1 to 33, and definition 16 is the one we use. The Force 6 and 2 mm/h figures are this charter's own term, read from its threshold clause on page 3 — which the charter party's own cross-references call clause 3.2, and which sets the threshold "for a majority of the hours of the period claimed". The justification on every day card names the source: "stated in the weather-exception clause (page 3) — this charterparty's own term"."

**Expand the clause panel on the 14 June card** — the small toggle labelled *Test
applied*, which sits **mid-card**, between the weather-record strip and the
assessment block, not at the foot of the card.
`#clause-toggle-2026-06-14`. Three labelled blocks appear:

> "Three separate claims, in three separate blocks. **Test applied:** `CP_WEATHER.MAJORITY_OF_HOURS` — that is a name for the test, and it names no document. **Charterparty text quoted:** the clause, as the engine read it, with its page. **Measurement basis:** definition 16 of the 2013 definitions — and the page adds two sentences under it: that the source fixes how an excepted period is measured but 'is not the authority for the test above or for the charterparty threshold', and that the rule id 'is not a quotation from the charterparty'. If any of those three were being conflated, this is where you would see it."

**Day 1 — 14 June:**
> "Twelve hours logged as a weather delay. Peak Force 5, 0.4 mm/h, zero hours adverse. Under **Keel assessment** the justification reads: *'Weather records show 0 of the 12 observed hours at or above the charterparty's weather-working threshold of Beaufort Force 6 (or precipitation of 2 mm/h), stated in the weather-exception clause (page 3) (peak: Force 5) — short of a majority. The strict-majority test applied here is this product's own policy reading the charterparty clause, not a test drawn from the Laytime Definitions.'* Then: **+$25,000**."

**Day 2 — 15 June**, faster:
> "Force 4, same shape: zero of twelve observed hours at the threshold. Owner's position better supported. Another $25,000."

**Day 3 — 16 June:**
> "Thirty-six hours. Peak Force 7, 5.6 mm/h, all thirty-six hours adverse. The justification: *'Weather records show all 36 of the 36 observed hours met or exceeded the charterparty's weather-working threshold … and at least one of those hours records that loading operations were prevented. The whole of the claimed period is therefore excepted from laytime, because a majority of the observed hours met the threshold — that share test is this product's own policy against the charterparty clause, and it is not a test drawn from the Laytime Definitions, so a majority of hours is not a finding that every claimed hour was an interrupted period.'* The charterer's position is better supported. **+$0**."

> "Read that last clause again. A majority of bad hours is **not** a finding that every claimed hour was a bad hour. The product says that about itself, in the letter, unprompted. It is the difference between a tool an analyst can defend and a tool an analyst gets sued over."

**Scroll to the reconciled total:**
> "$62,000 charterer base, plus the two days that survive, gives **$112,000**. And the justification under the last day says, in the product's own words, that a majority of hours at the threshold 'is not a finding that every claimed hour was an interrupted period'. That sentence is in the letter the counterparty receives."

> "Every row of both traces carries the Statement of Facts line it came from, and the weather rows carry the charter party clause as well. The trace does not make every dollar traceable to a clause — the NOR and laytime-expiry rows have no clause to point at, and the app says so instead of inventing one."

---

## Scene 6 — The letter, and the honest button (2:10 – 2:45)

Click **Generate Claim Letter** → `/voyage/voyage_001/letter`. The page renders the backend's own HTML letter, not a React mock-up.

> "This is the artifact a counterparty would receive — the backend's own HTML, not a mock-up. Per day: the owner's position, the charterer's position, the assessment, and the figure credited. Then the arithmetic: charterer base liability, items favouring the owner's position, reconciled total."

> "And be precise about what is in it. The letter quotes the threshold and where it came from, on every day, because that text is inside the positions. It does **not** carry a per-day clause citation or a per-day weather record — those live in the app's day card and the trace row, and only the *justification for the final disputed day* is printed in full. I would rather say that than have a counterparty's lawyer find it."

Scroll to the footer. Read it — do not paraphrase it:

> "'Excepted periods are measured on the basis given by definition 16 of the Laytime Definitions for Charter Parties 2013. **That document supplies the measurement basis only: it states no Force 6 and no majority test.** The weather thresholds applied here, and the test for invoking the weather exception, are the ones stated in the charter party for this voyage.'"

> "That is the sentence I would want in a letter I received. It tells the other side exactly what I relied on, and it tells them not to rely on the framework for something it does not say."

> "And it says the notice is advisory negotiation support — not a legal opinion, not an arbitration award, not a binding determination."

**Then click "Send to Other Party"** and read the dialog aloud:

> "Delivery is not available. Nothing has been transmitted and nothing is queued. Keel has no mail client, and I would not want a tool like this to have one without a person signing off first."

**Then close the dialog** — click *Close* in its footer, or press Escape. The modal
covers the page, so "Download PDF" is not reachable until it is gone. *(This step
was missing from the earlier version of this script, which is why it is called
out: the two buttons are siblings on the page, not one inside the other.)*

**Then click "Download PDF"**, the page-level button to the right of the one you
just used: a notice appears reading *"PDF export was refused by the letter
service (HTTP 400). Use Print → Save as PDF instead."*

> "The API serves HTML only, and it will not relabel HTML as a PDF. The 400 is deliberate. Print to Save as PDF instead."

> *(This is a target for the roadmap, not a bug being demonstrated.)*

---

## Scene 7 — Close (2:45 – 3:00)

Back to the dashboard. The voyage row shows **$112,000**.

> "Keel is not a laytime calculator. Those have existed for forty years and the arithmetic was never the hard part. The hard part is that two people read two Statements of Facts and reach two different numbers, and neither of them can show their working. Keel shows the working: the timestamp, the clause, the weather hour, and the test — and then tells you which of those three came from a document and which of them is our own policy.
>
> What it does not do is decide. The engine reconciles, and a person still has to agree before anything leaves this building. That screen does not exist yet. It is the first thing I would build."

---

## Contingencies

| If | Do |
|---|---|
| A page renders empty | You are on `127.0.0.1:3000`. Go to `localhost:3000`. |
| The dashboard has no voyage | Stale SQLite WAL from a previous API process. `rm -f apps/api/keel.db*` and restart the API. |
| The dashboard shows `voyage_contract_*` or `voyage_hardening_*` rows | A test run predating `tests/conftest.py` wrote into the demo database. Same fix: `rm -f apps/api/keel.db*` and restart. |
| An upload of real PDFs is rejected | Expected in this checkout — the source PDFs are not here. Use Demo Mode. |
| The dev server stalls on first page load | Turbopack compiling. Open each page once during pre-flight. |
| Someone asks for the PDF | "The API refuses it and says why. Print → Save as PDF." |
| Someone asks who signs off | "Nobody yet. That's step 1." Do not say the system does it. |
| Someone asks about the threshold's source | "The threshold clause on page 3 of this charter party, which its own text cross-references as clause 3.2. Not BIMCO — the 2013 definitions contain no number." |
| Someone asks what "majority of hours" is | "Our policy, reading their clause. Not BIMCO's test." |
| Someone asks for a live weather feed | "There is one provider and it reads a JSON fixture. Corroboration, not evidence." |

---

## Corrections applied to this script, 2026-09-30

Recorded so a presenter who has rehearsed the old lines knows exactly what to change.

| # | Old line | Problem | Now |
|---|---|---|---|
| 1 | A rule id in a `BIMCO_2013.*` namespace naming a WWD threshold, said to "fire". | That rule id does not exist in the code. It was a comment in the PRD's data-contract section (§9) and was copied forward as if it were a runtime value. The live id is `CP_WEATHER.MAJORITY_OF_HOURS`, with `measurement_basis` reported separately. | Scene 5 names the live id and the separate measurement basis. |
| 2 | "Force 7, heavy rain, [staying at that force]." | No test on duration or continuity of the event exists anywhere in the evaluator. The test is a strict majority of observed hours meeting the figure. | Scene 5 states the majority test and says explicitly that no duration test is applied. |
| 3 | "The letter cites BIMCO 2013, the charterparty clause, and the weather record per disputed day." | The letter does not cite a weather record per day. It carries the per-day positions, the assessment, the credited figure, and the justification for the **final** disputed day only. No per-day clause citation is rendered in the letter either — the clause lives in the app's day card and the trace row, not in the letter. | Scene 6 describes what the letter actually carries. |
| 4 | "Every dollar traces to a clause." | Only the weather rows carry a `clause_citation`. NOR, laytime-expiry and completion rows carry only a `sof_citation`, and the UI says so. | Scene 4 and Scene 5 both state the limit rather than overclaiming. |
| 5 | Recommended caption: *"BIMCO 2013, section 6: weather must objectively prevent operations, not merely be logged."* | **The 2013 document has no section 6.** Its provisions are numbered *definitions* 1–33, and no definition states that test. The "must actually prevent operations" requirement is in the **fixture charter party's own Clause 3.1** — *"provided that such weather actually prevented loading operations"* — not in the framework. | The caption is removed. Scene 5 attributes the test to the charter party and the measure to definition 16. |
| 6 | Scene 4: click a field, PDF opens with a bbox highlight. | No source PDFs ship, so the viewer cannot render. The old beat would have failed on camera. | Scene 4 walks the citation panel and the honest empty preview state, which is a stronger beat. |
| 7 | "Upload the 5 PDFs and the weather JSON" + "Have the 6 fixture files pre-selected in Finder." | The five PDFs are not in this checkout. The drag-and-drop cannot succeed. | Pre-flight now says so, and Scene 3 uses the Demo Mode button. |
| 8 | "Hover Reports to flash 1,500 lines of charts." | The reports page is one page of aggregate panels. | One-second hover, no claim. |
| 9 | "…The charterer emails this back to the owner." | Nothing is sent. There is no send path at all. | Scene 6 clicks the button and reads "Delivery Is Not Available". |
| 10 | "We just did it in 90 seconds" / "in 10 seconds". | Measured cold run is ~1.2 s. | "About a second", with the measurement in pre-flight. |
| 11 | Scene 3 narrating over a spinner. | A cache-only run is ~7 ms warm; there is no spinner to narrate over. | Scene 3 narrates the graph shape instead. |
| 12 | "The charterer's analyst thinks it should be closer to $62,000." | Framed as a guess. In the fixture, $62,000 is the charterer's extracted claim figure and $187,000 the owner's — both read from claim PDFs. | Stated as two claims, two totals. |

---

## Still worth adding before you record

Only items that are cheap **and** that the build can actually show today. None of these is implemented; all three are in `docs/continuation-plan.md` as work to do, not features to promise.

1. **A one-line "where this comes from" caption above the day cards.** Use the wording in Scene 5, not the old §6 line. The header badge on the reconcile page already says most of this; the caption is a repeat for a camera.
2. **A second seeded voyage with a different outcome mix**, so the dashboard looks populated and the engine is visibly not pinned to one answer. `test-cases/` already holds four cases with different splits; a second seed is a small job.
3. **A "Why this is hard" line on the dashboard**, phrased as the second half of the closing: *the dispute is which timestamp counts, and the model has to be checked*. Do not put a time-saving counter on it. There is no `resolution_seconds` in the build and no manual benchmark to divide by, so a number there would be invented.
