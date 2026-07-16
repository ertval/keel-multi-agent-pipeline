"""Generate the canonical voyage_001 fixture set.

Produces five text-based PDFs (via WeasyPrint CLI) and one weather JSON
under fixtures/voyage_001/. Re-run to regenerate; existing files are
overwritten. Idempotent.

Document content is hand-tuned so the engine + BIMCO 2013 rule library
will naturally output: owner $187,000, charterer $62,000, reconciled
$112,000. See PRD §4 and docs/tickets/README.md J-01 for the design.

Usage:
    python scripts/generate_fixtures.py

Requires WeasyPrint on PATH (brew install weasyprint).
"""

from __future__ import annotations

import json
import subprocess
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = REPO_ROOT / "fixtures" / "voyage_001"
OUT_DIR.mkdir(parents=True, exist_ok=True)


# ---------------------------------------------------------------------------
# Shared styling for all PDFs — clean, document-like, text-extractable
# ---------------------------------------------------------------------------

BASE_CSS = """
@page { size: A4; margin: 2.2cm 2cm; }
body { font-family: 'Times New Roman', Georgia, serif; font-size: 11pt; color: #111; }
h1 { font-size: 16pt; text-align: center; letter-spacing: 0.04em; margin-bottom: 0.2em; }
h2 { font-size: 12pt; margin-top: 1.4em; margin-bottom: 0.4em;
     border-bottom: 1px solid #888; padding-bottom: 0.15em; }
.subtitle { text-align: center; font-style: italic; margin-top: 0; margin-bottom: 1.5em; }
table { width: 100%; border-collapse: collapse; margin-top: 0.5em; }
th, td { border: 1px solid #444; padding: 0.35em 0.6em; text-align: left; vertical-align: top; }
th { background: #eee; }
.clause-num { font-weight: bold; }
.clause { margin: 0.6em 0; text-align: justify; }
.kv { width: 60%; margin: 0.6em 0; }
.kv td:first-child { background: #f4f4f4; font-weight: bold; width: 40%; }
.right { text-align: right; }
.total-row td { background: #eef; font-weight: bold; }
.signature { margin-top: 3em; }
.footer-note { margin-top: 2em; font-size: 9pt; color: #555; font-style: italic; }
"""


def render(html_body: str, output_pdf: Path) -> None:
    full_html = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>{BASE_CSS}</style></head>
<body>{html_body}</body></html>"""
    proc = subprocess.run(
        ["weasyprint", "-", str(output_pdf)],
        input=full_html.encode("utf-8"),
        capture_output=True,
    )
    if proc.returncode != 0:
        sys.stderr.write(proc.stderr.decode("utf-8", errors="replace"))
        raise SystemExit(f"WeasyPrint failed for {output_pdf}")
    print(f"  wrote {output_pdf.relative_to(REPO_ROOT)}")


# ---------------------------------------------------------------------------
# 1. Charterparty
# ---------------------------------------------------------------------------

CHARTERPARTY_HTML = """
<h1>VOYAGE CHARTERPARTY</h1>
<p class="subtitle">MV Hellenic Pioneer &mdash; Piraeus, Greece &mdash; Reference KEEL-V001</p>

<h2>1. Parties</h2>
<table class="kv">
<tr><td>Owner</td><td>Aegean Shipping Co., Piraeus</td></tr>
<tr><td>Charterer</td><td>Mediterranean Grains Ltd., Athens</td></tr>
<tr><td>Vessel</td><td>MV Hellenic Pioneer (IMO 9XXXXXX)</td></tr>
<tr><td>Cargo</td><td>52,000 MT Wheat in bulk</td></tr>
<tr><td>Load Port</td><td>Piraeus, Greece (37.9420&deg;N, 23.6470&deg;E)</td></tr>
<tr><td>Discharge Port</td><td>Alexandria, Egypt</td></tr>
</table>

<h2>2. Laytime</h2>
<p class="clause"><span class="clause-num">Clause 2.1.</span>
Laytime allowed for loading shall be <strong>72 running hours</strong>,
Sundays and Holidays excepted (SHEX). Laytime shall commence upon tender
of a valid Notice of Readiness plus six (6) hours turn time, regardless
of berth availability.</p>

<p class="clause"><span class="clause-num">Clause 2.2.</span>
The demurrage rate is <strong>USD 50,000 per running day</strong> and pro
rata, payable by the Charterer for time used in excess of the laytime
allowance. Despatch money is payable by the Owner at USD 25,000 per day
saved on all working time saved.</p>

<h2>3. Weather Working Days</h2>
<p class="clause"><span class="clause-num">Clause 3.1.</span>
Time lost on account of weather shall not count as laytime, provided
that such weather actually prevented loading operations. This clause is
to be interpreted in accordance with the
<strong>BIMCO Laytime Definitions for Charter Parties, 2013</strong>.
A "Weather Working Day" excludes only those periods during which weather
in fact halted operations; mere notation of inclement weather on the
Statement of Facts is not sufficient.</p>

<p class="clause"><span class="clause-num">Clause 3.2.</span>
The threshold for invocation of the weather exception under Clause 3.1
shall be conditions of Beaufort Force 6 or above sustained for the
period claimed, or precipitation of sufficient intensity to halt cargo
operations under prevailing port practice.</p>

<h2>4. Once on Demurrage, Always on Demurrage</h2>
<p class="clause"><span class="clause-num">Clause 4.1.</span>
Once on demurrage, the vessel shall remain on demurrage continuously
until completion of loading, save only where the weather exception under
Clause 3.1 is validly invoked in accordance with BIMCO 2013 thresholds.
For the avoidance of doubt, Sundays, Holidays, and shifting time shall
not interrupt the accrual of demurrage.</p>

<h2>5. Notice of Readiness</h2>
<p class="clause"><span class="clause-num">Clause 5.1.</span>
NOR may be tendered upon arrival at the port limits, whether in berth or
not, and shall be deemed accepted six (6) hours after tender.</p>

<p class="footer-note">Executed at Athens on 1 June 2026. Governing law:
English law. Disputes referred to LMAA arbitration in London.</p>
"""


# ---------------------------------------------------------------------------
# 2. Statement of Facts (Owner's version)
# ---------------------------------------------------------------------------

SOF_ROWS_OWNER = [
    ("2026-06-10 08:00", "NOR Tendered",
     "Master tendered Notice of Readiness on arrival at Piraeus port limits."),
    ("2026-06-10 14:00", "NOR Accepted",
     "NOR accepted by port authority."),
    ("2026-06-10 20:00", "Loading Commenced",
     "Vessel alongside Berth 7. First grab into Hold 1. Laytime commenced."),
    ("2026-06-13 20:00", "Laytime Expired",
     "Laytime allowance of 72 hours fully consumed. Vessel on demurrage from this time."),
    ("2026-06-17 13:46", "Loading Completed",
     "All hatches closed. Final draft survey complete. Vessel ready to sail."),
]

SOF_HTML_OWNER = """
<h1>STATEMENT OF FACTS</h1>
<p class="subtitle">MV Hellenic Pioneer &mdash; Piraeus, Greece &mdash; Owner's Record</p>

<table class="kv">
<tr><td>Vessel</td><td>MV Hellenic Pioneer</td></tr>
<tr><td>Port</td><td>Piraeus</td></tr>
<tr><td>Cargo</td><td>52,000 MT Wheat (bulk)</td></tr>
<tr><td>Submitted By</td><td>Aegean Shipping Co. (Owner)</td></tr>
</table>

<h2>Chronology</h2>
<table>
<tr><th>Timestamp (UTC)</th><th>Event</th><th>Remarks</th></tr>
""" + "".join(
    f"<tr><td>{ts}</td><td>{ev}</td><td>{rm}</td></tr>" for ts, ev, rm in SOF_ROWS_OWNER
) + """
</table>

<p class="footer-note">Owner's note: Per Clause 4.1, vessel was on
demurrage from 13 June 20:00. Weather conditions on 14&ndash;15 June
were of insufficient severity to halt operations (Beaufort Force 5 and
below) and do not interrupt demurrage under BIMCO 2013.</p>
"""


# ---------------------------------------------------------------------------
# 3. Statement of Facts (Charterer's version)
# ---------------------------------------------------------------------------

SOF_ROWS_CHARTERER = [
    ("2026-06-10 08:00", "NOR Tendered",
     "Notice of Readiness tendered at port limits."),
    ("2026-06-10 14:00", "NOR Accepted",
     "NOR accepted by port authority."),
    ("2026-06-10 20:00", "Loading Commenced",
     "Berth 7. First cargo into Hold 1. Laytime commenced."),
    ("2026-06-13 20:00", "Laytime Expired",
     "72-hour laytime allowance consumed. Vessel on demurrage."),
    ("2026-06-14 10:00", "Weather Delay Commenced",
     "Loading hampered by adverse weather. Foreman halted shore equipment."),
    ("2026-06-14 22:00", "Weather Delay Ended",
     "Conditions moderated. 12 hours weather delay logged."),
    ("2026-06-15 06:00", "Weather Delay Commenced",
     "Renewed adverse weather. Crane operations suspended."),
    ("2026-06-15 18:00", "Weather Delay Ended",
     "12 hours weather delay logged."),
    ("2026-06-16 00:00", "Weather Delay Commenced",
     "Severe gale, Force 7, heavy rain. Loading suspended on Master's instruction."),
    ("2026-06-17 12:00", "Weather Delay Ended",
     "Conditions moderated. 36 hours heavy weather logged."),
    ("2026-06-17 13:46", "Loading Completed",
     "All hatches closed."),
]

SOF_HTML_CHARTERER = """
<h1>STATEMENT OF FACTS</h1>
<p class="subtitle">MV Hellenic Pioneer &mdash; Piraeus, Greece &mdash; Charterer's Record</p>

<table class="kv">
<tr><td>Vessel</td><td>MV Hellenic Pioneer</td></tr>
<tr><td>Port</td><td>Piraeus</td></tr>
<tr><td>Cargo</td><td>52,000 MT Wheat (bulk)</td></tr>
<tr><td>Submitted By</td><td>Mediterranean Grains Ltd. (Charterer)</td></tr>
</table>

<h2>Chronology</h2>
<table>
<tr><th>Timestamp (UTC)</th><th>Event</th><th>Remarks</th></tr>
""" + "".join(
    f"<tr><td>{ts}</td><td>{ev}</td><td>{rm}</td></tr>"
    for ts, ev, rm in SOF_ROWS_CHARTERER
) + """
</table>

<p class="footer-note">Charterer's note: All weather periods on
14&ndash;17 June 2026 prevented or substantially hampered loading
operations and accordingly qualify as Weather Working Day exceptions
under Clause 3.1 of the charterparty.</p>
"""


# ---------------------------------------------------------------------------
# 4. Owner's Claim
# ---------------------------------------------------------------------------

CLAIM_OWNER_HTML = """
<h1>DEMURRAGE CLAIM &mdash; OWNER</h1>
<p class="subtitle">MV Hellenic Pioneer &mdash; Voyage KEEL-V001</p>

<table class="kv">
<tr><td>Claimant</td><td>Aegean Shipping Co. (Owner)</td></tr>
<tr><td>Respondent</td><td>Mediterranean Grains Ltd. (Charterer)</td></tr>
<tr><td>Rule Authority</td><td>BIMCO Laytime Definitions 2013</td></tr>
<tr><td>Demurrage Rate</td><td>USD 50,000 / day</td></tr>
</table>

<h2>Calculation Summary</h2>
<table>
<tr><th>Item</th><th>Hours</th><th class="right">Amount (USD)</th></tr>
<tr><td>Laytime allowance</td><td>72:00</td><td class="right">&mdash;</td></tr>
<tr><td>Time on demurrage (13 Jun 20:00 &rarr; 17 Jun 13:46)</td>
    <td>89:46</td><td class="right">186,944.44</td></tr>
<tr><td>Rounding adjustment</td><td>&mdash;</td><td class="right">55.56</td></tr>
<tr class="total-row"><td>Total demurrage due</td><td>&mdash;</td>
    <td class="right">187,000.00</td></tr>
</table>

<h2>Position</h2>
<p class="clause">Per Clause 4.1 of the charterparty, the vessel was on
demurrage continuously from 14 June 2026 at 00:00 until completion of
loading. The Owner contends that the weather conditions noted on 14 and
15 June 2026 were of Beaufort Force 5 and below and accordingly fall
below the threshold established in Clause 3.2 for the invocation of the
Weather Working Day exception under BIMCO 2013. Only the heavy weather
period of 16&ndash;17 June 2026 (Force 7, sustained, with heavy rain)
qualifies, and that period has been accounted for in the calculation
above by deducting zero hours from the laytime allowance (laytime having
already expired).</p>

<p class="clause">Accordingly, the Charterer is liable for the full
period during which the vessel remained on demurrage. The amount claimed
is <strong>USD 187,000.00</strong>.</p>

<p class="signature">Signed: Aegean Shipping Co., 20 June 2026.</p>
"""


# ---------------------------------------------------------------------------
# 5. Charterer's Counter-Claim
# ---------------------------------------------------------------------------

CLAIM_CHARTERER_HTML = """
<h1>DEMURRAGE COUNTER-CALCULATION &mdash; CHARTERER</h1>
<p class="subtitle">MV Hellenic Pioneer &mdash; Voyage KEEL-V001</p>

<table class="kv">
<tr><td>Claimant</td><td>Mediterranean Grains Ltd. (Charterer)</td></tr>
<tr><td>Respondent</td><td>Aegean Shipping Co. (Owner)</td></tr>
<tr><td>Rule Authority</td><td>BIMCO Laytime Definitions 2013</td></tr>
<tr><td>Demurrage Rate</td><td>USD 50,000 / day</td></tr>
</table>

<h2>Calculation Summary</h2>
<table>
<tr><th>Item</th><th>Hours</th><th class="right">Amount (USD)</th></tr>
<tr><td>Time elapsed on demurrage (13 Jun 20:00 &rarr; 17 Jun 13:46)</td>
    <td>89:46</td><td class="right">186,944.44</td></tr>
<tr><td>Less: weather exception 14 Jun 10:00&ndash;22:00 (Clause 3.1)</td>
    <td>-12:00</td><td class="right">-25,000.00</td></tr>
<tr><td>Less: weather exception 15 Jun 06:00&ndash;18:00 (Clause 3.1)</td>
    <td>-12:00</td><td class="right">-25,000.00</td></tr>
<tr><td>Less: weather exception 16 Jun 00:00&ndash;17 Jun 12:00 (Clause 3.1)</td>
    <td>-36:00</td><td class="right">-75,000.00</td></tr>
<tr><td>Rounding adjustment</td><td>&mdash;</td><td class="right">55.56</td></tr>
<tr class="total-row"><td>Total demurrage owed</td><td>29:46</td>
    <td class="right">62,000.00</td></tr>
</table>

<h2>Position</h2>
<p class="clause">The Charterer contends that all three weather periods
recorded on the Statement of Facts (14, 15 and 16&ndash;17 June 2026)
constitute valid Weather Working Day exceptions under Clause 3.1 of the
charterparty and BIMCO Laytime Definitions 2013. On each occasion the
prevailing weather prevented or substantially hampered loading
operations, as recorded by the port agent.</p>

<p class="clause">Accordingly, the demurrage owed is reduced to
<strong>USD 62,000.00</strong>.</p>

<p class="signature">Signed: Mediterranean Grains Ltd., 25 June 2026.</p>
"""


# ---------------------------------------------------------------------------
# 6. Weather records JSON
# ---------------------------------------------------------------------------


def build_weather_records() -> list[dict]:
    """Generate hourly observations from 14 Jun 00:00 → 17 Jun 23:00 UTC.

    Designed so the BIMCO 2013 threshold evaluator naturally produces:
      - 14 Jun weather window (10:00-22:00, Force 5)   → owner wins
      - 15 Jun weather window (06:00-18:00, Force 4)   → owner wins
      - 16 Jun → 17 Jun 12:00 (36h, Force 7 + rain)    → charterer wins
    """
    start = datetime(2026, 6, 14, 0, 0, tzinfo=timezone.utc)
    end = datetime(2026, 6, 17, 23, 0, tzinfo=timezone.utc)

    records: list[dict] = []
    t = start
    while t <= end:
        hour = t.hour
        day = t.day

        if day == 14 and 10 <= hour < 22:
            # Force 5 — below WWD threshold
            wf, ws, precip, prevented = 5, 19.0, 0.4, False
        elif day == 15 and 6 <= hour < 18:
            # Force 4 — below WWD threshold
            wf, ws, precip, prevented = 4, 13.0, 0.1, False
        elif (day == 16) or (day == 17 and hour < 12):
            # Force 7 sustained + heavy rain — meets WWD threshold
            wf, ws, precip, prevented = 7, 32.0, 5.6, True
        else:
            # Calm baseline
            wf, ws, precip, prevented = 3, 8.0, 0.0, False

        records.append({
            "timestamp": t.isoformat(),
            "wind_force_beaufort": wf,
            "wind_speed_knots": ws,
            "precipitation_mm_per_hour": precip,
            "operations_prevented": prevented,
            "citation": {
                "source": "fixture://piraeus_port_records",
                "observation_id": f"PIR-2026-{t.strftime('%m%d-%H')}",
            },
        })
        t += timedelta(hours=1)

    return records


# ---------------------------------------------------------------------------
# Driver
# ---------------------------------------------------------------------------


def main() -> None:
    print(f"Generating fixtures into {OUT_DIR.relative_to(REPO_ROOT)}/")

    targets = [
        (CHARTERPARTY_HTML, "charterparty.pdf"),
        (SOF_HTML_OWNER, "sof_owner.pdf"),
        (SOF_HTML_CHARTERER, "sof_charterer.pdf"),
        (CLAIM_OWNER_HTML, "claim_owner.pdf"),
        (CLAIM_CHARTERER_HTML, "claim_charterer.pdf"),
    ]
    for html, name in targets:
        render(html, OUT_DIR / name)

    weather_path = OUT_DIR / "weather_port_xyz.json"
    weather_path.write_text(json.dumps({
        "port": "Piraeus, Greece",
        "lat": 37.9420,
        "lon": 23.6470,
        "source": "fixture",
        "observations": build_weather_records(),
    }, indent=2) + "\n")
    print(f"  wrote {weather_path.relative_to(REPO_ROOT)}")

    print("Done.")


if __name__ == "__main__":
    main()
