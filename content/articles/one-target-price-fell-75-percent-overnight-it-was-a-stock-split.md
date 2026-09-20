---
title: "One broker's target price fell 75 percent overnight. It was a stock split, not a downgrade."
dek: "Of 53 target-price revisions filed on September 21, one showed a 75% overnight cut. The company's shares had been split 4-for-1 five weeks earlier — the number was arithmetic, not a bearish call."
category: equities
pubDate: 2026-09-21
dataAsOf: 2026-09-21T00:00:00+09:00
author: Newsroom
tags: ["dart", "hankyung-consensus", "target-price", "stock-split", "data-quality", "korea"]
tickers: ["036800.KQ"]
sources:
  - org: "Hankyung Consensus"
    api: "Daily broker research report list (collect-seoulmarkets-hankyung-consensus.mjs)"
    url: "https://markets.hankyung.com"
  - org: "Financial Services Commission (Republic of Korea) / DART"
    api: "Corporate Disclosure Information Open API — filing list by date"
    url: "https://www.data.go.kr/data/15059649/openapi.do"
crossChecks:
  - "53 of 578 broker reports filed against Korean stocks on 2026-09-21 carried both a new target price and a prior one different from it: 33 raised, 20 cut, before we excluded the case below."
  - "One of those 20 cuts was LS Securities on NICE Information & Telecommunication (KOSDAQ: 036800): previous target 40,000 won, new target 10,000 won, a 75.0% cut in one filing."
  - "DART's own disclosure list for this company shows trading was halted on 2026-07-24 for a stock split ('주식분할') and the split-adjusted shares resumed trading on 2026-08-14 ('액면분할 주권 변경상장') — five weeks before this report. The exact ratio is not stated in the filing titles themselves, but 40,000 divided by 10,000 is exactly 4, consistent with a 4-for-1 split."
excluded:
  - "NICE Information & Telecommunication from every count in this article after the first crossCheck — once the split explains the number, treating it as a bearish call would be wrong."
  - "The other 52 revisions' accuracy or investment merit — this article is about one data-hygiene catch, not a scorecard of today's calls."
  - "The exact stock-split ratio as declared in the original filing text — we did not open the underlying disclosure document, and we compute 4-for-1 only from the arithmetic of the two prices."
draft: false
---

Fifty-three Korean stocks got a revised broker target price on September 21, 2026 — 33 raised, 20
cut. One of the cuts was not a cut at all.

LS Securities' new report on NICE Information & Telecommunication (KOSDAQ: 036800) lists a target
price of 10,000 won against a previous target of 40,000 won — a 75.0% reduction, by far the
steepest move in today's batch. Read on its own, that looks like the most bearish call of the day.

## What we found before publishing it as one

We check DART's own disclosure list for any stock carrying an unusually large target-price move
before we count it. For this company, the list showed two filings from Korea Exchange itself:

| Date | Filing |
|---|---|
| 2026-07-24 | Trading halt — stock split ("주식분할") |
| 2026-08-14 | Trading resumed — split-adjusted shares relisted ("액면분할 주권 변경상장") |

The company's shares had been split and relisted five weeks before this report. Forty thousand
divided by ten thousand is exactly four, consistent with a 4-for-1 split — though the filing
titles alone do not state the ratio, and we did not open the underlying disclosure document to
confirm it directly.

## What this means for the count

Once the split explains the arithmetic, the honest count of today's target-price revisions is 52,
not 53: 33 raised, 19 cut. We are not saying LS Securities made an error — a research note can
simply carry forward a pre-split reference price without it being a mistake in the note itself.
The problem, if there is one, sits in any dataset (including our own, before this check) that
compares a "previous target" to a "new target" without asking whether the stock underneath moved
its own decimal point in between.

## What we did not check

- Whether any of the other 52 revisions involve a similar corporate action (splits, rights issues,
  reverse splits) we have not screened for individually.
- The investment merit of any of today's 33 upgrades or 19 remaining downgrades.
- The precise stock-split ratio as filed — we inferred 4-for-1 from the two prices, not from the
  filing text.

---

*This is not investment advice. Figures are drawn from published broker research summaries and
official disclosure filings, and are presented for data-quality reporting, not as a trading
signal.*
