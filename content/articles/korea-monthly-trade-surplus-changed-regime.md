---
title: "Korea's monthly trade surplus went from $6bn to $36bn"
dek: "Every one of the last 12 months ran a surplus, but the size changed regime near February 2026 — from about $8bn a month to about $26bn. It's exports."
category: macro
pubDate: 2026-08-27
dataAsOf: 2026-08-20T20:09:00+09:00
author: Newsroom
tags: ["korea trade", "trade balance", "exports", "trade surplus", "macro"]
tickers: []
sources:
  - org: "Korea Customs Service (via KOSIS, Statistics Korea)"
    api: "Exports and imports by partner country — table DT_1R11006_FRM101 (org 360), national monthly totals"
    url: "https://kosis.kr"
crossChecks:
  - "The 12 monthly figures sum to the same annual total whether added from the national series or from the 243 partner-country rows — exports 871.0bn, imports 683.3bn, balance 187.7bn USD. The two are independent aggregations of the same customs file and they agree"
  - "Each month's balance equals that month's exports minus imports to the dollar, checked row by row — the feed's balance column is not carrying a rounding or sign error"
  - "The step-up is not one outlier month. The surplus is below 13bn in all seven months through January 2026 and above 15bn in all five months after it — the two groups do not overlap"
excluded:
  - "Why the surplus jumped. The customs feed carries values, not causes — it cannot tell you whether this is stronger foreign demand, a weaker won lifting export receipts, front-loading ahead of tariffs, or something else, and we are not going to pick one"
  - "Volume versus price. These are nominal US-dollar customs values. A rising number can be more goods, dearer goods, or a cheaper won — this dataset cannot separate them"
  - "Whether the surplus lasts. Twelve months is twelve months. This is not a multi-year trend and we do not treat five rising months as a forecast"
  - "The partner breakdown, which we cover separately. This piece is the national total only"
draft: true
image: /charts/korea-trade-balance-monthly.svg
---

Korea ran a trade surplus in every one of the last twelve months. That part is not the story — Korea usually does. The story is the size, which did not drift up. It stepped up.

## Twelve months, one direction

| Month | Surplus (USD bn) |
| --- | ---: |
| 2025-07 | +6.5 |
| 2025-08 | +6.4 |
| 2025-09 | +9.5 |
| 2025-10 | +6.0 |
| 2025-11 | +9.5 |
| 2025-12 | +12.2 |
| 2026-01 | +8.7 |
| 2026-02 | **+15.7** |
| 2026-03 | **+26.7** |
| 2026-04 | **+23.7** |
| 2026-05 | **+26.9** |
| 2026-06 | **+36.1** |

Through January 2026 the monthly surplus averaged **$8.4bn** and never once reached $13bn. From February it averaged **$25.8bn** and never once fell below $15bn. The two runs do not overlap. Whatever changed, changed around the turn of the year, and it did not change back.

Add the halves and the same break shows: the six months of the second half of 2025 produced a **$50.0bn** surplus; the first six months of 2026 produced **$137.7bn** — 2.75 times as much. Over the full twelve months the surplus was **$187.7bn** on **$871.0bn** of exports and **$683.3bn** of imports.

## It is an export story, not an import story

A surplus can widen two ways: exports rise, or imports fall. Here only one of them moved.

| | 2025-07 | 2026-06 | Change |
| --- | ---: | ---: | ---: |
| Exports | $60.7bn | $102.2bn | **+68%** |
| Imports | $54.2bn | $66.1bn | +22% |
| Balance | +$6.5bn | +$36.1bn | +$29.6bn |

Imports grew — this is not an economy that stopped buying. But exports grew three times faster, and the gap between the two lines is the surplus. June 2026 is the first month in this file to clear **$100bn of exports** and the first to clear a **$36bn surplus**.

## What the number cannot tell you

The feed is a customs ledger: what crossed the border, in dollars, by month. It does not say why, and the honest answer to "why did the surplus triple" is that this dataset cannot supply one. Stronger demand abroad, a weaker won inflating dollar receipts, orders pulled forward ahead of tariff changes — each would show up here as the same rising line, and we are not going to choose between them from a price series.

It also cannot separate volume from price. A nominal dollar figure rising 68% is some mix of more goods, pricier goods, and a cheaper currency. Untangling that needs a deflator this table does not carry.

And twelve months is twelve months. Five rising months are a fact about the past, not a forecast. The most we will say is the narrow, verifiable thing: **the monthly surplus operated at one level through January and a visibly higher one after**, and the shift came from exports rather than from a fall in imports.

*Figures are customs-basis (통관) national totals from the Korea Customs Service, published through KOSIS, for July 2025 through June 2026. Free to reproduce with attribution — cite as SeoulMarkets (seoulmarkets.com) and link back.*
