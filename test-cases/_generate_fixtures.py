"""Generate the reconciliation test-case fixtures.

This script is the *provenance* for every file under test-cases/<case>/.
Re-running it regenerates the source PDFs, the seeded extraction JSON, the
weather records, and the per-case manifest from the single CASES table below.

Design notes
------------
* "Real docs + crafted numbers": the source PDFs are modelled on genuine
  maritime document formats (GENCON-style charterparty prose, a standard
  Statement of Facts event table, a BIMCO-style demurrage claim) but the
  figures are hand-authored so each case ties out to a known answer.

* Determinism: keel_api.pipeline._load_or_extract is cache-first — when all
  five extracted_*.json files exist it never calls the LLM. We seed those
  files here so the checking loop runs offline and produces identical results
  every time. (One case is also proven end-to-end through the live extractor;
  see test-cases/README.md.)

* The expected reconciliation in each case (owner_total / charterer_total /
  reconciled_total / per-window verdicts) is written as hand-authored literals
  in the CASES table — NOT recomputed by this script with the same arithmetic
  the engine uses. That keeps the pytest harness an independent check.

Reconciliation model (mirrors keel_api.pipeline.run_voyage_pipeline):
    owner_total      = round(owner_claim_usd      / 1000) * 1000
    charterer_total  = round(charterer_claim_usd  / 1000) * 1000
    for each WEATHER_DELAY window in the *charterer* SOF:
        disputed_hours = (end - start) in hours
        owner_amount   = disputed_hours * (demurrage_rate_per_day / 24)
        weather valid (charterer wins) iff
            (#qualifying_obs / #obs > 0.5) AND any(obs.operations_prevented)
            where qualifying = wind_force >= 6 OR precip_mm_per_h >= 2.0
        credited_to_owner = owner_amount if owner wins else 0
    reconciled_total = round((charterer_total + sum(credited_to_owner)) / 1000) * 1000
"""

from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

import fitz  # PyMuPDF

HERE = Path(__file__).resolve().parent

ZERO_BBOX = [0.0, 0.0, 0.0, 0.0]


# ---------------------------------------------------------------------------
# Case definitions
# ---------------------------------------------------------------------------
# Each weather window: (start_iso, end_iso, force, precip_mm_h, ops_prevented,
#                       expected_winner). The generator fills hourly weather
#                       observations across [start, end] inclusive with uniform
#                       conditions so the verdict is unambiguous.

CASES = [
    {
        "id": "case_01_clean_voyage",
        "title": "Clean voyage — no weather dispute",
        "summary": (
            "Vessel runs onto demurrage; no weather delays are logged by "
            "either party, so there is nothing to adjudicate. Owner and "
            "charterer claim the same figure and it passes through unchanged."
        ),
        "vessel": "MV Northern Trader",
        "owner": "Northern Bulk Carriers Ltd.",
        "charterer": "Hanseatic Grain Traders GmbH",
        "load_port": "Rotterdam, Netherlands",
        "lat": 51.9496,
        "lon": 4.1453,
        "laytime_hours": 96.0,
        "demurrage_rate": 45000.0,
        "despatch_rate": 22500.0,
        "nor_turn_hours": 6.0,
        "laytime_exception": "SHEX",
        "weather_clause": "WWD",
        "load_start": "2026-07-01T20:00:00",
        "load_end": "2026-07-05T08:00:00",
        "windows": [],
        "owner_claim": 90000.0,
        "charterer_claim": 90000.0,
        "expected": {
            "owner_total_usd": 90000,
            "charterer_total_usd": 90000,
            "reconciled_total_usd": 90000,
            "verdicts": [],  # no disputed days
        },
        "working": (
            "No WEATHER_DELAY events in either SOF -> no disputed items.\n"
            "credited_total = 0.\n"
            "owner_total      = round(90,000 / 1000) * 1000 = 90,000\n"
            "charterer_total  = round(90,000 / 1000) * 1000 = 90,000\n"
            "reconciled_total = round((90,000 + 0) / 1000) * 1000 = 90,000"
        ),
    },
    {
        "id": "case_02_owner_win_marginal",
        "title": "Owner win — marginal weather (Force 5, ops not prevented)",
        "summary": (
            "Charterer logs a 12-hour weather delay, but port records show only "
            "Beaufort Force 5 with light drizzle and loading gear was never "
            "actually stood down. Below the BIMCO 2013 Force-6 threshold, so the "
            "exception fails and the disputed time is credited back to the owner."
        ),
        "vessel": "MV Adriatic Star",
        "owner": "Adriatic Shipping S.p.A.",
        "charterer": "Levante Commodities S.L.",
        "load_port": "Valencia, Spain",
        "lat": 39.4561,
        "lon": -0.3262,
        "laytime_hours": 72.0,
        "demurrage_rate": 48000.0,
        "despatch_rate": 24000.0,
        "nor_turn_hours": 6.0,
        "laytime_exception": "SHEX",
        "weather_clause": "WWD",
        "load_start": "2026-07-03T18:00:00",
        "load_end": "2026-07-06T10:00:00",
        "windows": [
            ("2026-07-05T08:00:00", "2026-07-05T20:00:00", 5, 0.5, False, "owner"),
        ],
        "owner_claim": 130000.0,
        "charterer_claim": 80000.0,
        "expected": {
            "owner_total_usd": 130000,
            "charterer_total_usd": 80000,
            "reconciled_total_usd": 104000,
            "verdicts": [{"date": "2026-07-05", "winner": "owner"}],
        },
        "working": (
            "Window 05 Jul 08:00-20:00 = 12 h. rate/h = 48,000/24 = 2,000.\n"
            "owner_amount = 12 * 2,000 = 24,000.\n"
            "Weather: 13 obs all Force 5, precip 0.5 mm/h, ops_prevented=false.\n"
            "qualifying = 0/13 -> majority false -> exception INVALID -> owner wins.\n"
            "credited_to_owner = 24,000.\n"
            "owner_total      = round(130,000/1000)*1000 = 130,000\n"
            "charterer_total  = round(80,000/1000)*1000  = 80,000\n"
            "reconciled_total = round((80,000 + 24,000)/1000)*1000 = 104,000"
        ),
    },
    {
        "id": "case_03_charterer_win_storm",
        "title": "Charterer win — sustained storm (Force 8, ops prevented)",
        "summary": (
            "A 24-hour gale (Beaufort Force 8, heavy rain) shuts the berth. Port "
            "records confirm sustained conditions above the BIMCO 2013 threshold "
            "with operations prevented throughout, so the weather exception is "
            "validly invoked and none of the disputed time is credited to owner."
        ),
        "vessel": "MV Pacific Crest",
        "owner": "Pacific Crest Maritime Inc.",
        "charterer": "Sul Atlântico Açúcar Ltda.",
        "load_port": "Santos, Brazil",
        "lat": -23.9608,
        "lon": -46.3336,
        "laytime_hours": 84.0,
        "demurrage_rate": 60000.0,
        "despatch_rate": 30000.0,
        "nor_turn_hours": 6.0,
        "laytime_exception": "SHEX",
        "weather_clause": "WWD",
        "load_start": "2026-08-10T04:00:00",
        "load_end": "2026-08-13T18:00:00",
        "windows": [
            ("2026-08-12T00:00:00", "2026-08-13T00:00:00", 8, 6.0, True, "charterer"),
        ],
        "owner_claim": 150000.0,
        "charterer_claim": 90000.0,
        "expected": {
            "owner_total_usd": 150000,
            "charterer_total_usd": 90000,
            "reconciled_total_usd": 90000,
            "verdicts": [{"date": "2026-08-12", "winner": "charterer"}],
        },
        "working": (
            "Window 12 Aug 00:00 -> 13 Aug 00:00 = 24 h. rate/h = 60,000/24 = 2,500.\n"
            "owner_amount = 24 * 2,500 = 60,000.\n"
            "Weather: 25 obs all Force 8, precip 6.0 mm/h, ops_prevented=true.\n"
            "qualifying = 25/25 -> majority true AND ops prevented -> VALID -> charterer wins.\n"
            "credited_to_owner = 0.\n"
            "owner_total      = round(150,000/1000)*1000 = 150,000\n"
            "charterer_total  = round(90,000/1000)*1000  = 90,000\n"
            "reconciled_total = round((90,000 + 0)/1000)*1000 = 90,000"
        ),
    },
    {
        "id": "case_04_split_decision",
        "title": "Split decision — one owner-win day, one charterer-win day",
        "summary": (
            "Two separate weather delays. The first (Force 4, clear) fails the "
            "threshold and is credited to owner; the second (Force 9 hurricane-"
            "force squall, ops prevented) is upheld for the charterer. The "
            "reconciled total reflects only the first window's credit."
        ),
        "vessel": "MV Iberian Dawn",
        "owner": "Iberian Dawn Shipping Ltd.",
        "charterer": "Gibraltar Steel & Ore Co.",
        "load_port": "Algeciras, Spain",
        "lat": 36.1408,
        "lon": -5.4562,
        "laytime_hours": 72.0,
        "demurrage_rate": 50000.0,
        "despatch_rate": 25000.0,
        "nor_turn_hours": 6.0,
        "laytime_exception": "SHEX",
        "weather_clause": "WWD",
        "load_start": "2026-09-01T20:00:00",
        "load_end": "2026-09-05T20:00:00",
        "windows": [
            ("2026-09-03T08:00:00", "2026-09-03T20:00:00", 4, 0.2, False, "owner"),
            ("2026-09-05T00:00:00", "2026-09-05T12:00:00", 9, 8.0, True, "charterer"),
        ],
        "owner_claim": 175000.0,
        "charterer_claim": 100000.0,
        "expected": {
            "owner_total_usd": 175000,
            "charterer_total_usd": 100000,
            "reconciled_total_usd": 125000,
            "verdicts": [
                {"date": "2026-09-03", "winner": "owner"},
                {"date": "2026-09-05", "winner": "charterer"},
            ],
        },
        "working": (
            "rate/h = 50,000/24 = 2,083.33...\n"
            "Window A 03 Sep 08:00-20:00 = 12 h -> owner_amount = 25,000.\n"
            "  Weather: 13 obs Force 4, precip 0.2, ops false -> INVALID -> owner wins -> credit 25,000.\n"
            "Window B 05 Sep 00:00-12:00 = 12 h -> owner_amount = 25,000.\n"
            "  Weather: 13 obs Force 9, precip 8.0, ops true -> VALID -> charterer wins -> credit 0.\n"
            "credited_total = 25,000.\n"
            "owner_total      = round(175,000/1000)*1000 = 175,000\n"
            "charterer_total  = round(100,000/1000)*1000 = 100,000\n"
            "reconciled_total = round((100,000 + 25,000)/1000)*1000 = 125,000"
        ),
    },
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _parse(ts: str) -> datetime:
    return datetime.fromisoformat(ts)


def write_text_pdf(path: Path, title: str, lines: list[str]) -> None:
    """Render a simple, parseable text PDF (one column, auto-paginating)."""
    doc = fitz.open()
    margin_x, margin_y = 56, 64
    leading = 15
    fontsize = 10.5

    def new_page():
        page = doc.new_page(width=595, height=842)  # A4
        return page, margin_y

    page, y = new_page()
    # Title
    page.insert_text((margin_x, y), title, fontsize=14, fontname="helv")
    y += leading * 2
    for line in lines:
        # crude wrap at ~95 chars
        chunks = [line[i:i + 95] for i in range(0, max(len(line), 1), 95)] or [""]
        for chunk in chunks:
            if y > 842 - margin_y:
                page, y = new_page()
            page.insert_text((margin_x, y), chunk, fontsize=fontsize, fontname="helv")
            y += leading
    doc.save(str(path))
    doc.close()


def charterparty_lines(c: dict) -> list[str]:
    return [
        "GENCON 1994-STYLE VOYAGE CHARTER PARTY (extract)",
        "",
        f"Vessel: {c['vessel']}",
        f"Owners: {c['owner']}",
        f"Charterers: {c['charterer']}",
        f"Loading Port: {c['load_port']}",
        "",
        "Clause 1 — Laytime",
        f"  Laytime allowed for loading shall be {c['laytime_hours']:.0f} running hours,",
        "  Sundays and Holidays excepted (SHEX).",
        "",
        "Clause 2 — Demurrage / Despatch",
        f"  The demurrage rate is USD {c['demurrage_rate']:,.0f} per running day and pro rata,",
        "  payable by the Charterers for all time used in excess of the laytime allowance.",
        f"  Despatch money shall be USD {c['despatch_rate']:,.0f} per running day for laytime saved.",
        "",
        "Clause 3.1 — Weather Working Days (WWD)",
        "  Time lost on account of weather shall not count as laytime, provided that such",
        "  weather actually prevented loading operations.",
        "",
        "Clause 3.2 — Threshold",
        "  The threshold for invocation of the weather exception under Clause 3.1 shall be",
        "  conditions of Beaufort Force 6 or above sustained for the period claimed, or",
        "  precipitation of sufficient intensity to halt cargo operations under prevailing",
        "  port practice, in each case assessed in accordance with the BIMCO Laytime",
        "  Definitions for Charter Parties 2013.",
        "",
        "Clause 4.1 — Once on Demurrage",
        "  Once on demurrage the Vessel shall remain on demurrage continuously until",
        "  completion of loading, save only where the weather exception under Clause 3.1 is",
        "  validly invoked in accordance with the BIMCO 2013 thresholds.",
        "",
        "Clause 5 — Notice of Readiness",
        f"  NOR may be tendered upon arrival at the port limits, whether in berth or not,",
        f"  and shall be deemed accepted {c['nor_turn_hours']:.0f} hours after tender.",
    ]


def sof_lines(c: dict, events: list[dict], party: str) -> list[str]:
    lines = [
        "STATEMENT OF FACTS",
        f"Vessel: {c['vessel']}    Port: {c['load_port']}",
        f"Prepared by: {'Master / Owners' if party == 'owner' else 'Charterers Agents'}",
        "",
        "Date/Time (UTC)      Event                    Remarks",
        "-" * 92,
    ]
    for e in events:
        ts = e["timestamp"].replace("T", " ")
        lines.append(f"{ts}   {e['event_type']:<22}   {e['description']}")
    return lines


def claim_lines(c: dict, amount: float, party: str) -> list[str]:
    who = "OWNERS' DEMURRAGE CLAIM" if party == "owner" else "CHARTERERS' COUNTER-STATEMENT"
    return [
        who,
        f"Vessel: {c['vessel']}",
        f"Charter Party: {c['load_port']} loading, {c['demurrage_rate']:,.0f} USD/day demurrage",
        "",
        "Summary of time used and amount claimed:",
        f"  Demurrage rate ................ USD {c['demurrage_rate']:,.0f} per day",
        f"  Net time on demurrage claimed . per attached calculation",
        "",
        f"  TOTAL AMOUNT CLAIMED .......... USD {amount:,.0f}",
        "",
        ("This statement is submitted without prejudice and in full reservation of rights."),
    ]


def build_events(c: dict, party: str) -> list[dict]:
    """Owner SOF: clean (no weather). Charterer SOF: includes weather windows."""
    load_start = _parse(c["load_start"])
    nor_tendered = load_start - timedelta(hours=12)
    nor_accepted = nor_tendered + timedelta(hours=c["nor_turn_hours"])
    load_end = _parse(c["load_end"])

    def ev(ts: datetime, etype: str, desc: str) -> dict:
        return {
            "timestamp": ts.strftime("%Y-%m-%dT%H:%M:%S"),
            "event_type": etype,
            "description": desc,
            "source": {"page": 1, "bbox": list(ZERO_BBOX), "row_text": desc},
        }

    events = [
        ev(nor_tendered, "NOR_TENDERED", "Notice of Readiness tendered at port limits."),
        ev(nor_accepted, "NOR_ACCEPTED", "NOR accepted; laytime to commence per CP."),
        ev(load_start, "LOADING_START", "First cargo grab into hold. Laytime commenced."),
    ]
    if party == "charterer":
        for (ws, we, force, precip, prevented, _winner) in c["windows"]:
            s = _parse(ws)
            e = _parse(we)
            hrs = int((e - s).total_seconds() // 3600)
            events.append(ev(s, "WEATHER_DELAY_START",
                             f"Loading suspended — adverse weather (Force {force})."))
            events.append(ev(e, "WEATHER_DELAY_END",
                             f"Conditions moderated. {hrs} hours weather delay logged."))
    events.append(ev(load_end, "LOADING_END", "Loading completed; all hatches closed."))
    events.sort(key=lambda x: x["timestamp"])
    return events


def build_weather(c: dict) -> dict:
    obs = []
    for (ws, we, force, precip, prevented, _winner) in c["windows"]:
        s = _parse(ws).replace(tzinfo=timezone.utc)
        e = _parse(we).replace(tzinfo=timezone.utc)
        t = s
        while t <= e:
            oid = f"{c['id'][:3].upper()}-{t.strftime('%Y%m%d-%H')}"
            obs.append({
                "timestamp": t.strftime("%Y-%m-%dT%H:%M:%S+00:00"),
                "wind_force_beaufort": force,
                "wind_speed_knots": round(force * 3.5 + 2.0, 1),
                "precipitation_mm_per_hour": precip,
                "operations_prevented": prevented,
                "citation": {
                    "source": f"fixture://{c['load_port'].split(',')[0].lower()}_port_records",
                    "observation_id": oid,
                },
            })
            t += timedelta(hours=1)
    return {
        "port": c["load_port"],
        "lat": c["lat"],
        "lon": c["lon"],
        "source": "fixture",
        "observations": obs,
    }


def build_charterparty_terms(c: dict) -> dict:
    cl = charterparty_lines(c)
    clause_texts = [
        f"Laytime allowed for loading shall be {c['laytime_hours']:.0f} running hours, Sundays and Holidays excepted (SHEX).",
        f"The demurrage rate is USD {c['demurrage_rate']:,.0f} per running day and pro rata, payable by the Charterers.",
        "Time lost on account of weather shall not count as laytime, provided that such weather actually prevented loading operations.",
        "The threshold for invocation of the weather exception under Clause 3.1 shall be conditions of Beaufort Force 6 or above sustained for the period claimed, assessed per BIMCO Laytime Definitions 2013.",
        "Once on demurrage the Vessel shall remain on demurrage continuously until completion of loading, save only where the weather exception under Clause 3.1 is validly invoked per BIMCO 2013.",
        f"NOR may be tendered upon arrival at the port limits, whether in berth or not, and shall be deemed accepted {c['nor_turn_hours']:.0f} hours after tender.",
    ]
    return {
        "vessel": c["vessel"],
        "charterer": c["charterer"],
        "owner": c["owner"],
        "load_port": c["load_port"],
        "load_port_lat": c["lat"],
        "load_port_lon": c["lon"],
        "laytime_allowance_hours": c["laytime_hours"],
        "demurrage_rate_per_day_usd": c["demurrage_rate"],
        "despatch_rate_per_day_usd": c["despatch_rate"],
        "nor_turn_time_hours": c["nor_turn_hours"],
        "laytime_exception": c["laytime_exception"],
        "weather_clause": c["weather_clause"],
        "rule_authority": "BIMCO_2013",
        "clauses": [
            {"page": 2 + i, "bbox": list(ZERO_BBOX), "text": t}
            for i, t in enumerate(clause_texts)
        ],
    }


def manifest_md(c: dict) -> str:
    exp = c["expected"]
    verdict_rows = "\n".join(
        f"| {v['date']} | {v['winner']} |" for v in exp["verdicts"]
    ) or "| _(none)_ | _(no disputed days)_ |"
    return f"""# {c['id']}

**{c['title']}**

{c['summary']}

## Source documents (in this folder)

| File | Role | Format modelled on |
|------|------|--------------------|
| `charterparty.pdf` | Voyage charter party (extract) | GENCON 1994 clause structure + BIMCO 2013 WWD wording |
| `sof_owner.pdf` | Owners' Statement of Facts | Standard SOF event log |
| `sof_charterer.pdf` | Charterers' Statement of Facts | Standard SOF event log (includes weather delays) |
| `claim_owner.pdf` | Owners' demurrage claim | BIMCO-style claim statement |
| `claim_charterer.pdf` | Charterers' counter-statement | BIMCO-style claim statement |
| `weather_port_xyz.json` | Independent port weather records | Hourly observation series |

The figures are hand-authored ("real docs + crafted numbers") so the case ties
out to a known answer. The `extracted_*.json` files are the seeded LLM
extraction (cache-first path) used by the deterministic checking loop.

## Charter terms

- Load port: **{c['load_port']}** ({c['lat']}, {c['lon']})
- Laytime allowance: **{c['laytime_hours']:.0f} h**, exception **{c['laytime_exception']}**
- Demurrage: **USD {c['demurrage_rate']:,.0f}/day** (= USD {c['demurrage_rate']/24:,.2f}/h)
- Weather clause: **{c['weather_clause']}**, authority **BIMCO 2013**

## Hand-computed working

```
{c['working']}
```

## Expected reconciliation (asserted by the checking loop)

- Owner total: **USD {exp['owner_total_usd']:,}**
- Charterer total: **USD {exp['charterer_total_usd']:,}**
- Reconciled total: **USD {exp['reconciled_total_usd']:,}**

| Disputed date | Verdict winner |
|---------------|----------------|
{verdict_rows}
"""


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    for c in CASES:
        d = HERE / c["id"]
        d.mkdir(parents=True, exist_ok=True)

        owner_events = build_events(c, "owner")
        charterer_events = build_events(c, "charterer")
        terms = build_charterparty_terms(c)
        weather = build_weather(c)

        # Source PDFs (provenance / live-LLM input)
        write_text_pdf(d / "charterparty.pdf", "CHARTER PARTY", charterparty_lines(c))
        write_text_pdf(d / "sof_owner.pdf", "STATEMENT OF FACTS — OWNERS",
                       sof_lines(c, owner_events, "owner"))
        write_text_pdf(d / "sof_charterer.pdf", "STATEMENT OF FACTS — CHARTERERS",
                       sof_lines(c, charterer_events, "charterer"))
        write_text_pdf(d / "claim_owner.pdf", "DEMURRAGE CLAIM — OWNERS",
                       claim_lines(c, c["owner_claim"], "owner"))
        write_text_pdf(d / "claim_charterer.pdf", "COUNTER-STATEMENT — CHARTERERS",
                       claim_lines(c, c["charterer_claim"], "charterer"))

        # Seeded extraction (cache-first → deterministic, offline)
        (d / "extracted_charterparty.json").write_text(json.dumps(terms, indent=2))
        (d / "extracted_sof_owner.json").write_text(json.dumps(owner_events, indent=2))
        (d / "extracted_sof_charterer.json").write_text(json.dumps(charterer_events, indent=2))
        (d / "extracted_owner_claim_amount.json").write_text(str(c["owner_claim"]))
        (d / "extracted_charterer_claim_amount.json").write_text(str(c["charterer_claim"]))

        # Weather + expected answer + manifest
        (d / "weather_port_xyz.json").write_text(json.dumps(weather, indent=2))
        (d / "expected.json").write_text(json.dumps(
            {"id": c["id"], "title": c["title"], **c["expected"]}, indent=2))
        (d / "manifest.md").write_text(manifest_md(c))

        print(f"wrote {c['id']}: {len(list(d.iterdir()))} files")


if __name__ == "__main__":
    main()
