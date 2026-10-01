# case_03_charterer_win_storm

**Charterer win — sustained storm (Force 8, ops prevented)**

A 24-hour gale (Beaufort Force 8, heavy rain) shuts the berth. Port records confirm sustained conditions above the threshold in Clause 3.2 with operations prevented throughout, so the weather exception is validly invoked and none of the disputed time is credited to owner.

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

- Load port: **Santos, Brazil** (-23.9608, -46.3336)
- Laytime allowance: **84 h**, exception **SHEX**
- Demurrage: **USD 60,000/day** (= USD 2,500.00/h)
- Weather clause: **WWD** — a charterparty drafting label, not a definition of any ruleset. Weather-working threshold: **Beaufort Force 6 or 2.0 mm/h**, this charterparty's own term in its threshold clause.
- Ruleset incorporated: **none** — this charterparty cites no ruleset, so the reconciliation's authority is `custom` and each weather verdict's authority is Keel's own policy against that clause. The threshold is the contract's own term and the share of hours that must meet it is this product's own policy; no ruleset supplies either.

## Hand-computed working

```
Window 12 Aug 00:00 -> 13 Aug 00:00 = 24 h. rate/h = 60,000/24 = 2,500.
owner_amount = 24 * 2,500 = 60,000.
Weather: 25 obs all Force 8, precip 6.0 mm/h, ops_prevented=true.
qualifying = 25/25 -> majority true AND ops prevented -> VALID -> charterer wins.
credited_to_owner = 0.
owner_total      = round(150,000/1000)*1000 = 150,000
charterer_total  = round(90,000/1000)*1000  = 90,000
reconciled_total = round((90,000 + 0)/1000)*1000 = 90,000
```

## Expected reconciliation (asserted by the checking loop)

- Owner total: **USD 150,000**
- Charterer total: **USD 90,000**
- Reconciled total: **USD 90,000**

| Disputed date | Verdict winner |
|---------------|----------------|
| 2026-08-12 | charterer |
