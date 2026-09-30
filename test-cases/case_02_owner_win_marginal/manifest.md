# case_02_owner_win_marginal

**Owner win — marginal weather (Force 5, ops not prevented)**

Charterer logs a 12-hour weather delay, but port records show only Beaufort Force 5 with light drizzle and loading gear was never actually stood down. Below the threshold in Clause 3.2, so the exception fails and the disputed time is credited back to the owner.

## Source documents (in this folder)

| File | Role | Format modelled on |
|------|------|--------------------|
| `charterparty.pdf` | Voyage charter party (extract) | GENCON 1994 clause structure + a bespoke weather-exception clause |
| `sof_owner.pdf` | Owners' Statement of Facts | Standard SOF event log |
| `sof_charterer.pdf` | Charterers' Statement of Facts | Standard SOF event log (includes weather delays) |
| `claim_owner.pdf` | Owners' demurrage claim | Laytime claim statement |
| `claim_charterer.pdf` | Charterers' counter-statement | Laytime claim statement |
| `weather_port_xyz.json` | Independent port weather records | Hourly observation series |

The figures are hand-authored ("real docs + crafted numbers") so the case ties
out to a known answer. The `extracted_*.json` files are the seeded LLM
extraction (cache-first path) used by the deterministic checking loop.

## Charter terms

- Load port: **Valencia, Spain** (39.4561, -0.3262)
- Laytime allowance: **72 h**, exception **SHEX**
- Demurrage: **USD 48,000/day** (= USD 2,000.00/h)
- Weather clause: **WWD** — a charterparty drafting label, not a definition of any ruleset. Weather-working threshold: **Beaufort Force 6 or 2.0 mm/h**, this charterparty's own term in its threshold clause.
- Ruleset incorporated: **none** — this charterparty cites no ruleset, so the reconciliation's authority is `custom` and each weather verdict's authority is Keel's own policy against that clause. The threshold is the contract's own term and the share of hours that must meet it is this product's own policy; no ruleset supplies either.

## Hand-computed working

```
Window 05 Jul 08:00-20:00 = 12 h. rate/h = 48,000/24 = 2,000.
owner_amount = 12 * 2,000 = 24,000.
Weather: 13 obs all Force 5, precip 0.5 mm/h, ops_prevented=false.
qualifying = 0/13 -> majority false -> exception INVALID -> owner wins.
credited_to_owner = 24,000.
owner_total      = round(130,000/1000)*1000 = 130,000
charterer_total  = round(80,000/1000)*1000  = 80,000
reconciled_total = round((80,000 + 24,000)/1000)*1000 = 104,000
```

## Expected reconciliation (asserted by the checking loop)

- Owner total: **USD 130,000**
- Charterer total: **USD 80,000**
- Reconciled total: **USD 104,000**

| Disputed date | Verdict winner |
|---------------|----------------|
| 2026-07-05 | owner |
