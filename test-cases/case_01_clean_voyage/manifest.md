# case_01_clean_voyage

**Clean voyage — no weather dispute**

Vessel runs onto demurrage; no weather delays are logged by either party, so there is nothing to adjudicate. Owner and charterer claim the same figure and it passes through unchanged.

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

- Load port: **Rotterdam, Netherlands** (51.9496, 4.1453)
- Laytime allowance: **96 h**, exception **SHEX**
- Demurrage: **USD 45,000/day** (= USD 1,875.00/h)
- Weather clause: **WWD**, authority **BIMCO 2013**

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
