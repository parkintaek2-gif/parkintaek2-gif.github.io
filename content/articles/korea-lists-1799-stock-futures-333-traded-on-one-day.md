---
title: "Korea lists futures on 1,799 stocks. On one day, 333 of them traded."
dek: "One name took a third of the day's stock-futures volume. Five names took half of it; five out of six listed stock futures did not trade at all."
category: equities
pubDate: 2026-09-19
dataAsOf: 2026-09-17T00:00:00+09:00
author: Newsroom
tags: ["derivatives", "KRX", "stock futures", "liquidity", "concentration", "korea"]
tickers: []
sources:
  - org: "Financial Services Commission (Korea) — derivative product prices, via data.go.kr"
    api: "GetDerivativeProductInfoService, stock futures daily closes and volume by listing"
    url: "https://www.data.go.kr"
crossChecks:
  - "17 September 2026, one trading day. 1,799 distinct underlying stocks carried a listed futures contract that day (index products — KOSPI 200, KOSDAQ 150, KRX300, mini-KOSPI 200, the volatility index — excluded from this count)."
  - "333 of those 1,799 (18.5%) recorded any trading volume greater than zero. The remaining 1,466 (81.5%) recorded zero."
  - "Volume is summed per underlying stock across all expiry-month listings for that stock. A stock with three expiry months listed and volume in only one still counts as 'traded'."
  - "Total stock-futures volume that day, all 1,799 underlyings: 4,345,345 contracts. Top 5 by volume: Samsung Electronics 1,447,923 (33.3%), SK Hynix 287,604 (6.6%), Samsung Heavy Industries 178,265 (4.1%), Hanwha Life 113,209 (2.6%), Daewoo E&C 100,605 (2.3%). Combined, these five are 49.0% of total stock-futures volume that day."
excluded:
  - "Any period outside 17 September 2026. This is one session, not a running count like our currency-futures piece; a name with zero volume this day may have traded the day before or after."
  - "Index futures and options — KOSPI 200, KOSDAQ 150, KRX300, mini-KOSPI 200 and the volatility index carry their own liquidity pattern and are excluded so this count is stock-only."
  - "Open interest. This file carries volume only; we are not stating how many contracts are being held, only how many changed hands."
  - "Any explanation for why a given stock's futures don't trade. Some may be recent listings, some may have no retail or institutional interest in the derivative form specifically while the underlying stock trades normally. This dataset does not carry the reason."
pages:
  - "/data"
---

Korea's exchange lists a futures contract on 1,799 individual stocks. On 17 September 2026 — the
most recent complete session in our archive — 333 of them changed hands. The other 1,466, more than
four out of every five listings, recorded zero volume for the day.

## Five names, half the volume

| Rank | Stock | Contracts traded | Share of stock-futures volume |
| --- | --- | ---: | ---: |
| 1 | Samsung Electronics | 1,447,923 | 33.3% |
| 2 | SK Hynix | 287,604 | 6.6% |
| 3 | Samsung Heavy Industries | 178,265 | 4.1% |
| 4 | Hanwha Life | 113,209 | 2.6% |
| 5 | Daewoo E&C | 100,605 | 2.3% |

Those five names took **49.0%** of all 4,345,345 contracts traded in stock futures that day. Samsung
Electronics alone was a third of it.

## The listing is not the liquidity

This is the same shape our 4 August count found in currency futures — a large published list, with
trading concentrated in a small fraction of it — reproduced here on the equity side of the same
exchange. 1,799 stocks carry a market for hedging or leverage on paper. On a given day, activity in
that market means an actual buyer and seller mostly in five names, and mostly in one.

We are not counting why. A listing with zero volume this session could trade tomorrow, could be a
name few institutions have positioned in, or could be a contract nobody has found a reason to use.
This file gives us the count, not the cause.

The full set of tables we build and keep, including this one, is listed on
[our data page](/data).

*This is not investment advice. These are counts of listed contracts and trading volume, not a
recommendation to trade any instrument named here.*
