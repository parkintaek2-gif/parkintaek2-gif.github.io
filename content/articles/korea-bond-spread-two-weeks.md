---
title: "Korea's 3-year/10-year bond spread stayed positive and widened a little over two weeks"
dek: "Over nine trading days to 2026-08-21, the gap between Korea's 10-year and 3-year government bond yields ran 0.46 to 0.60 points, ending near 0.55 — never inverted. It widened from the long end: the 10-year rose, the 3-year held. Not advice."
category: rates
pubDate: 2026-08-25
dataAsOf: 2026-08-21T00:00:00+09:00
author: Newsroom
tags: ["yield curve", "bond spread", "government bonds", "ktb", "3 year 10 year", "interest rates", "korea"]
tickers: []
sources:
  - org: "Korea government bonds (KTB), listed closing yields"
    api: "getBondPriceInfo (일자별 채권 종가·종가수익률), 국고채 issues only, nine trading days 2026-08-10 to 2026-08-21"
    url: "https://www.data.go.kr"
crossChecks:
  - "For each of the nine trading days, the 3-year and 10-year points are the listed KTB whose remaining maturity is closest to that tenor (within 25%), with the maturity read from the bond's name and a yield inside a plausible 0.3–8% band. The spread is the 10-year yield minus the 3-year"
  - "The 3y–10y spread ran 0.463 (Aug 10), 0.479, 0.491, 0.598, 0.503, 0.604 (Aug 18), 0.514, 0.536, and 0.550 (Aug 21). It stayed positive every day — the curve did not invert — and ended 9 basis points above where it began, inside a 0.46–0.60 band"
  - "The move came from the long end. The 10-year rose from about 4.24% to 4.37% over the window; the 3-year barely moved, from about 3.78% to 3.82%. A steeper curve here is long yields rising, not short yields falling"
  - "Three sessions in the window were market holidays and carry no data (Aug 15–17, around Liberation Day); those days are left out rather than filled in"
excluded:
  - "The Bank of Korea's official reference rates, which are built from over-the-counter final quotes and can differ from these listed-exchange closes"
  - "Any forecast or signal reading. A positive, widening 3y–10y spread is reported here as what the listed bonds did over nine days — not as a call on rates, growth or recession"
  - "Absolute price levels. Yields are scale-invariant and comparable across issues; the closing prices behind them are not the subject"
---

A yield curve is not one number, and it does not sit still. Over the **nine trading days to 2026-08-21**, the gap between Korea's 10-year and 3-year government bond yields — the piece of the curve investors watch most — ran between **0.46 and 0.60 points** and finished near **0.55**. It never turned negative.

## The spread, day by day

| Date | 3-year | 10-year | 3y–10y spread |
| --- | --- | --- | --- |
| 2026-08-10 | 3.78% | 4.24% | 0.46 |
| 2026-08-13 | 3.78% | 4.38% | 0.60 |
| 2026-08-18 | 3.82% | 4.42% | 0.60 |
| 2026-08-21 | 3.82% | 4.37% | 0.55 |

![Line chart: Korea government bond 3-year to 10-year yield spread in percentage points, nine trading days from 2026-08-10 to 2026-08-21, ranging 0.46 to 0.60 and ending near 0.55, never negative.](/charts/bond-yield-spread.svg)

## The steepening is at the long end

The spread widened by about **9 basis points** over the two weeks, and the reason is one-sided: the **10-year rose** (roughly 4.24% to 4.37%) while the **3-year held** near 3.8%. When people say a curve "steepened," it can mean short rates fell or long rates rose — here it was the long end doing the work.

An inverted curve — short yields above long — is the shape that draws headlines. Korea's did the opposite over this window: it stayed normally sloped and got a little steeper. For the single-day picture across every maturity from one to thirty years, see [Korea's government bond curve](/article/korea-government-bond-yield-curve).

These are **listed closing yields** of individual Korea Treasury Bonds, not the Bank of Korea's official reference rates, and nine days is a window, not a trend. We report what the bonds did. What it means is not ours to say — this is data, not advice.
