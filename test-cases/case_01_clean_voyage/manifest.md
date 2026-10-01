# case_01_clean_voyage

**Clean voyage — no weather dispute**

Vessel runs onto demurrage; no weather delays are logged by either party, so there is nothing to adjudicate. Owner and charterer claim the same figure and it passes through unchanged.

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

- Load port: **Rotterdam, Netherlands** (51.9496, 4.1453)
- Laytime allowance: **96 h**, exception **SHEX**
- Demurrage: **USD 45,000/day** (= USD 1,875.00/h)
- Weather clause: **WWD** — a charterparty drafting label, not a definition of any ruleset. Weather-working threshold: **Beaufort Force 6 or 2.0 mm/h**, this charterparty's own term in its threshold clause.
- Ruleset incorporated: **none** — this charterparty cites no ruleset, so the reconciliation's authority is `custom` and each weather verdict's authority is Keel's own policy against that clause. The threshold is the contract's own term and the share of hours that must meet it is this product's own policy; no ruleset supplies either.

## Hand-computed working

```
No WEATHER_DELAY events in either SOF -> no disputed items.
credited_total = 0.
owner_total      = round(90,000 / 1000) * 1000 = 90,000
charterer_total  = round(90,000 / 1000) * 1000 = 90,000
reconciled_total = round((90,000 + 0) / 1000) * 1000 = 90,000
```

## Expected reconciliation (asserted by the checking loop)

- Owner total: **USD 90,000**
- Charterer total: **USD 90,000**
- Reconciled total: **USD 90,000**

| Disputed date | Verdict winner |
|---------------|----------------|
| _(none)_ | _(no disputed days)_ |
