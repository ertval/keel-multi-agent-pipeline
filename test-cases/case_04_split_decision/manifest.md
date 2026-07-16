# case_04_split_decision

**Split decision — one owner-win day, one charterer-win day**

Two separate weather delays. The first (Force 4, clear) fails the threshold and is credited to owner; the second (Force 9 hurricane-force squall, ops prevented) is upheld for the charterer. The reconciled total reflects only the first window's credit.

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

- Load port: **Algeciras, Spain** (36.1408, -5.4562)
- Laytime allowance: **72 h**, exception **SHEX**
- Demurrage: **USD 50,000/day** (= USD 2,083.33/h)
- Weather clause: **WWD**, authority **BIMCO 2013**

## Hand-computed working

```
rate/h = 50,000/24 = 2,083.33...
Window A 03 Sep 08:00-20:00 = 12 h -> owner_amount = 25,000.
  Weather: 13 obs Force 4, precip 0.2, ops false -> INVALID -> owner wins -> credit 25,000.
Window B 05 Sep 00:00-12:00 = 12 h -> owner_amount = 25,000.
  Weather: 13 obs Force 9, precip 8.0, ops true -> VALID -> charterer wins -> credit 0.
credited_total = 25,000.
owner_total      = round(175,000/1000)*1000 = 175,000
charterer_total  = round(100,000/1000)*1000 = 100,000
reconciled_total = round((100,000 + 25,000)/1000)*1000 = 125,000
```

## Expected reconciliation (asserted by the checking loop)

- Owner total: **USD 175,000**
- Charterer total: **USD 100,000**
- Reconciled total: **USD 125,000**

| Disputed date | Verdict winner |
|---------------|----------------|
| 2026-09-03 | owner |
| 2026-09-05 | charterer |
