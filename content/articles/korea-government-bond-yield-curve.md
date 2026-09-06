---
title: "Korea's bond curve, one day: 3.47% at a year, 4.64% at thirty — then it dips"
dek: "On 2026-09-04, Bank of Korea's own reference yields ran from 3.47% at one year to a peak of 4.64% at thirty years, then fell back to 4.54% at fifty. The long end of Korea's curve is not a straight climb."
category: rates
pubDate: 2026-09-06
dataAsOf: 2026-09-04T00:00:00+09:00
author: Newsroom
tags: ["bond-yield", "government-bonds", "ktb", "yield-curve", "interest-rates", "korea", "bank of korea"]
tickers: []
sources:
  - org: "Bank of Korea, ECOS (Economic Statistics System)"
    api: "StatisticSearch, table 817Y002 (시장금리, market interest rates, daily), items for Korea Treasury Bond maturities 1/2/3/5/10/20/30/50 years, basis date 2026-09-04"
    url: "https://ecos.bok.or.kr"
crossChecks:
  - "All eight benchmark maturities (1, 2, 3, 5, 10, 20, 30, 50 years) printed a value on the same basis date, 2026-09-04, read directly from ECOS's own daily series — no interpolation or nearest-maturity matching was needed, unlike a listed-bond scatter"
  - "Yields rise at every step from 1 year (3.469%) to 30 years (4.636%): +0.238 points from 1y to 3y, +0.217 from 3y to 5y, +0.259 from 5y to 10y, +0.213 from 10y to 20y, +0.063 from 20y to 30y — the increase shrinks steadily as maturity lengthens"
  - "The 50-year yield (4.542%) is lower than the 30-year yield (4.636%) by 0.094 points — the only inversion on the curve. Every other adjacent pair rises with maturity"
excluded:
  - "Any trend claim. This is one official reference-rate reading for one day, not a time series — where the curve sat on 2026-09-04, not where it is heading"
  - "Why the 30-to-50-year segment inverts. The source gives the rate, not a reason; long-end demand and supply factors are not measured here"
  - "This is not investment advice"
---

Ask what the Korean government pays to borrow and the honest answer is a curve, not a number — and on 2026-09-04, that curve was not a straight climb. Bank of Korea's own official reference yields ran from **3.47% at one year** up to **4.64% at thirty years**, the ordinary shape where longer money costs more. But at the very long end, that pattern broke: the fifty-year yield came in at **4.54%** — lower than thirty.

## The benchmark maturities, that day

| Maturity | Yield |
| --- | --- |
| 1 year | 3.469% |
| 2 years | 3.707% |
| 3 years | 3.884% |
| 5 years | 4.101% |
| 10 years | 4.360% |
| 20 years | 4.573% |
| 30 years | 4.636% |
| 50 years | 4.542% |

Every step from one year to thirty years adds yield, but the size of each step shrinks: +0.238 points crossing from one to three years, down to +0.063 points crossing from twenty to thirty. The climb is flattening well before it ends.

![Korea government bond yields by maturity, 2026-09-04](/charts/bond-yield-curve.svg)

## Where the curve turns over

Thirty years is the peak, not fifty. The fifty-year yield sits 0.094 points below the thirty-year yield — the one place on this curve where a longer maturity pays less than a shorter one. Every other adjacent pair, from one year up through thirty, rises with maturity; only the last segment reverses.

## What this is, and is not

These are Bank of Korea's own official benchmark reference yields for Korea Treasury Bonds, published daily by maturity — not a listed bond's closing trade price, and not derived by matching individual bond issues to target maturities. It is also **one day**: a single reading of where the curve sat on 2026-09-04, not a trend and not a forecast.

We report the shape and the numbers behind it. What they mean for any decision is not ours to say — this is data, not advice.
