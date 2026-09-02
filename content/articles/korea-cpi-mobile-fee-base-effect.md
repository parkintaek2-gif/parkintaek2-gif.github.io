---
title: "Korea CPI: mobile fee jumped 26.7%, rest flat"
dek: "Korea's August CPI rose 3.09% year-on-year. The 'telecom base effect' two papers cited sits almost entirely in one line: the mobile phone fee index, up 26.74% — while landline and internet fees barely moved."
category: macro
pubDate: 2026-09-03
dataAsOf: 2026-09-03T00:00:00+09:00
author: Newsroom
tags: ["cpi", "inflation", "telecom", "korea", "base effect"]
tickers: []
sources:
  - org: "KOSIS (Korea Statistical Information Service, 국가데이터처)"
    api: "statisticsParameterData.do, table DT_1J22001 (Consumer Price Index by Purpose, 2020=100), national level (T10), monthly, August 2025 vs August 2026 — pulled and computed by us"
  - org: "Ministry of Economy and Finance (Korea)"
    api: "Press briefing on the 2 September 2026 CPI release, reported by domestic outlets, estimating CPI growth at 2.5% with the telecom base effect excluded — cited as the ministry's own figure, not recomputed by us"
crossChecks:
  - "Overall CPI: 116.45 (Aug 2025) → 120.05 (Aug 2026), +3.09% year-on-year — matches the published headline of +3.1%"
  - "Communications category overall: 87.87 → 102.48, +16.63% — more than five times the headline rate"
  - "Telephone & fax services sub-index: 84.17 → 101.94, +21.11%"
  - "Mobile phone fee index: 80.52 → 102.05, +26.74% — the single largest mover we found in this category"
  - "Landline fee index: 100.30 → 100.37, +0.07%; internet fee index: 100.62 → 100.62, +0.00% — both effectively flat"
excluded:
  - "The exact percentage-point contribution of the mobile fee item to the 3.09% headline — this needs a published item-weight table, and we could not locate one on KOSIS with a clear usage license. We cite the ministry's own '2.5% ex-base-effect' estimate instead of recomputing a contribution figure ourselves"
  - "Why last year's mobile discount ended when it did, or any carrier-level pricing detail — KOSIS publishes one national aggregate index for the item, not carrier data, and the reason is outside what either dataset shows"
  - "Any claim about future CPI prints — this is a backward-looking index comparison for two named months only"
image: /charts/cpi-telecom-base-effect.svg
draft: false
---

Korea's August consumer price index rose 3.09% from a year earlier, matching the government's published +3.1% headline almost exactly once we pulled the same series ourselves. Two newspapers explained the jump as a "telecom base effect" — last year's mobile discount promotion dropping out of the comparison — and the finance ministry estimated that, without it, the real increase would be closer to 2.5%. We went to the primary KOSIS index to see exactly where that effect lives.

## One line item, not a category

![Bar chart showing year-on-year change in Korea's August CPI: overall CPI +3.09%, all communications +16.63%, landline and internet fees near zero, mobile phone fee +26.74%.](/charts/cpi-telecom-base-effect.svg)

| Item | Aug 2025 | Aug 2026 | Change |
| --- | ---: | ---: | ---: |
| Overall CPI | 116.45 | 120.05 | **+3.09%** |
| Communications (all) | 87.87 | 102.48 | **+16.63%** |
| — Telephone & fax services | 84.17 | 101.94 | **+21.11%** |
| — Landline fee | 100.30 | 100.37 | +0.07% |
| — Mobile phone fee | 80.52 | 102.05 | **+26.74%** |
| — Internet fee | 100.62 | 100.62 | 0.00% |

*All index values and percentage changes are computed by us directly from KOSIS's own monthly series (2020=100). We did not use any pre-computed year-on-year figure from KOSIS — each change above is (this year minus last year) divided by last year, from the raw index levels.*

## Where the "base effect" actually sits

The word "communications" covers landline, mobile, and internet fees together, and the category as a whole rose 16.63% — more than five times the headline rate. But splitting it apart shows the move is not spread across the category. Landline and internet fee indexes are essentially unchanged from a year ago, both under a tenth of a percentage point. The entire swing sits in the mobile phone fee index, which rose 26.74%.

That fits the base-effect explanation: a discount promotion pushed last August's mobile index down to 80.52, and this August's index of 102.05 is being compared against that unusually low base rather than against a normal month. The size of the move — one item moving 26.74% against two flat neighbors in the same official category — is what we can confirm directly from the data; we did not have to take either newspaper's word for which line item was responsible.

## What we can't put a number on

We cannot tell you exactly how many of the 3.09 percentage points of headline inflation this one item accounts for. That requires the official item-weight table used to build the composite index, and we could not locate one on KOSIS with a usage license we could confirm was clear to use. So on that specific number, we cite the finance ministry's own estimate — "about 2.5% with the base effect excluded" — as an attributed figure, not something we recomputed ourselves.

What we can say, from the index levels alone: the story is not "communications got more expensive." It's one item, out of three, doing all the moving. This is a measure of a published statistical index, not a forecast, and it is **not investment advice**.

## The debate

A single sub-item moving 26.7% while its two neighbors sit flat, inside a category that gets reported as one number — how much should a headline inflation figure lean on an explanation like this? **What do you think?** This is a talking point, not a verdict — argue it out below.
