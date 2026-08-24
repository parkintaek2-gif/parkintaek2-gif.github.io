---
title: "Korea's government bond curve, one day: 3.6% at a year, 4.7% at thirty"
dek: "On 2026-08-21, listed Korea Treasury Bonds closed near 3.6% around one year and rose to 4.7% at thirty — a normal upward slope, built from 45 KTBs. These are listed-close yields, not the Bank of Korea's official reference rates. Not advice."
category: rates
pubDate: 2026-08-24
dataAsOf: 2026-08-21T00:00:00+09:00
author: Newsroom
tags: ["bond-yield", "government-bonds", "ktb", "yield-curve", "interest-rates", "korea"]
tickers: []
sources:
  - org: "Korea government bonds (KTB), listed closing yields"
    api: "getBondPriceInfo (일자별 채권 종가·종가수익률), 국고채 issues only, basis date 2026-08-21"
    url: "https://www.data.go.kr"
crossChecks:
  - "The file for 2026-08-21 holds 396 listed bonds; 45 of them are Korea Treasury Bonds (국고채) with a readable maturity and a closing yield inside a plausible 0.3–8% band. Each KTB's remaining maturity is computed from the maturity month encoded in its name (e.g. 국고03500-5603 matures 2056-03) against the 2026-08 basis date"
  - "Picking, for each benchmark tenor, the KTB whose remaining maturity is closest (within 25%): 1y 3.60%, 2y 3.74%, 3y 3.82%, 5y 4.11%, 10y 4.37%, 20y 4.67%, 30y 4.70%. The slope is upward at every step — the ordinary shape, long money paid more than short"
  - "The gap is front-loaded: +0.51 points from 1y to 5y, then +0.26 from 5y to 10y, and only +0.33 across the whole 10y-to-30y span. The curve is steep at the short end and nearly flat past twenty years"
  - "One listed KTB near five years printed a 2.05% close — well below its neighbours around 4.1% — the kind of stale or thin quote a listed close can carry. It sits in the scatter but was not chosen as the 5y benchmark, which went to a 4.11% issue closer to exactly five years"
excluded:
  - "The Bank of Korea's official reference rates. Those are built from over-the-counter final quotes and can differ from these listed-exchange closes; this piece reports what the listed KTBs closed at, not the reference curve"
  - "Any trend claim. This is one day (T+1), not a time series — 'this is where it closed', not 'this is where it is heading'"
  - "Absolute price levels and any buy/sell read. Yields are scale-invariant and comparable across issues; the closing prices behind them are not the subject here"
---

Ask what a government pays to borrow in Korea and the honest answer is a curve, not a number. On **2026-08-21**, listed Korea Treasury Bonds closed at about **3.60% around one year** and climbed to **4.70% at thirty years** — the ordinary upward slope, where longer money costs more.

## The benchmark tenors, that day

| Remaining maturity | Closing yield |
| --- | --- |
| 1 year | 3.60% |
| 2 years | 3.74% |
| 3 years | 3.82% |
| 5 years | 4.11% |
| 10 years | 4.37% |
| 20 years | 4.67% |
| 30 years | 4.70% |

The steepness lives at the short end. From one to five years the yield adds half a point; from ten to thirty it adds only a third of a point across two decades. Short and long are far apart; long and longer are almost the same.

![Korea government bond yields by remaining maturity, 2026-08-21](/charts/bond-yield-curve.svg)

## What this is, and is not

These are **listed closing yields** of individual Korea Treasury Bonds, read from the exchange's daily file, with each bond's remaining maturity worked out from the maturity date encoded in its name. They are not the Bank of Korea's official reference rates, which are built from over-the-counter quotes and can sit a little apart from these listed closes.

It is also **one day**. A single close tells you where the curve sat on 2026-08-21, not where it is going. And a listed close can carry a stale quote: one bond near five years printed 2.05% against neighbours around 4.1% — visible as the low grey dot in the chart, and deliberately not used as a benchmark.

We report the shape and the numbers behind it. What they mean for any decision is not ours to say — this is data, not advice.
