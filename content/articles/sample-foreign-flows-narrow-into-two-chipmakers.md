---
title: "Foreign buying of Korean chipmakers has narrowed to two names"
dek: "Net foreign purchases on KOSPI rose for a fourth straight session, but almost all of it landed in the same two semiconductor lines — a concentration that has preceded sharp reversals before."
category: equities
pubDate: 2026-07-30
dataAsOf: 2026-07-29T15:30:00+09:00
author: Markets Desk
tickers: ["005930", "000660"]
tags: ["sample", "foreign flows", "semiconductors", "KOSPI"]
sources:
  - org: "Financial Services Commission (Republic of Korea)"
    api: "Stock Price Information Open API"
    url: "https://www.data.go.kr/data/15094808/openapi.do"
  - org: "Financial Services Commission (Republic of Korea)"
    api: "Index Price Information Open API"
    url: "https://www.data.go.kr/data/15094807/openapi.do"
crossChecks:
  - "Index close reconciled against the Index Price Information API for the same session date"
  - "Both issue codes matched to the KRX Listed Securities dataset before use"
excluded:
  - "Intraday order-book imbalance — not available in any redistributable public source"
  - "Investor-type net purchase totals — not published in the open-data feeds we are licensed to redistribute"
draft: false
---

> **This is a layout sample.** The figures below are illustrative and were written to test
> rendering, not reported from a live data pull. Delete this file before the site goes public.

Foreign investors have been net buyers of Korean equities for four consecutive sessions. That much is unremarkable — foreign flows turn positive for a week at a time several times a year. What is unusual is how little of the market that buying touched.

## What the data shows

On the session ending 29 July, the benchmark closed higher for a fourth day. Beneath that, the distribution of gains was extraordinarily narrow: two semiconductor issues accounted for the overwhelming majority of the index's advance, while the median listed stock was roughly flat.

A rising index carried by two names is arithmetically a rising index. It is not a broad recovery, and the difference matters for anyone reading the headline number as a signal about Korean corporate health generally.

## The mechanism

Korea's benchmark is capitalisation-weighted, and its two largest constituents are both memory-semiconductor manufacturers. Together they represent a share of index weight that has no parallel in the S&P 500 or the FTSE 100. When global memory pricing expectations shift, index-tracking and sector-rotation flows arrive at those two lines first and in size.

The result is a structural quirk: Korea's headline equity index functions, on a large fraction of trading days, as a leveraged expression of the global memory cycle rather than as a barometer of the Korean economy. Foreign flow data does not distinguish between an investor expressing a view on Korea and one expressing a view on DRAM.

## Where this breaks

Three things would falsify the reading above.

First, concentration is not itself directional. Narrow leadership has preceded both continued rallies and sharp reversals; it tells you the index is fragile, not which way it will break.

Second, our source data settles one business day late. The concentration described here is a fact about a session that has already closed. If flows broadened on the following day, this article would not know it.

Third, we cannot see who is buying. The open-data feeds we are permitted to redistribute publish prices and volumes, not investor-type breakdowns. Attributing the move to "foreign investors" leans on the aggregate flow series rather than on issue-level attribution, and that inference is weaker than the price data behind it.

## The evidence

The narrowness claim rests on two things we can verify directly from the price feed: the index change for the session, and the individual closes and volumes for the two issues. Both were pulled from the Financial Services Commission price APIs and reconciled against each other for the same session date.

The claim we cannot verify directly — that foreign rather than domestic institutional money drove it — is flagged as an inference, and the investor-type series that would settle it is listed under excluded figures below.

## The verdict

The index rose. Breadth did not. Anyone treating the four-session advance as evidence that Korean equities broadly have turned is reading a two-stock story as a five-hundred-stock one.

That is a statement about market structure, not about direction, and it should not be read as a reason to buy or sell anything.
