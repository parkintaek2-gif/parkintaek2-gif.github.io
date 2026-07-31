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

<figure class="chart">
<p class="chart__title">Two stocks did almost all of it</p>
<p class="chart__sub">Contribution to the benchmark's move, percentage points · session ending 29 Jul 2026</p>
<svg viewBox="0 0 640 176" role="img" aria-label="Semiconductor A contributed 0.71 percentage points and Semiconductor B 0.34, while all other constituents combined contributed 0.06.">
  <line class="grid" x1="317.5" y1="14" x2="317.5" y2="146"/>
  <line class="grid" x1="455" y1="14" x2="455" y2="146"/>
  <line class="grid" x1="592.5" y1="14" x2="592.5" y2="146"/>
  <path d="M180,20 h386.5 a4,4 0 0 1 4,4 v12 a4,4 0 0 1 -4,4 h-386.5 z" fill="var(--c1)"/>
  <path d="M180,68 h183 a4,4 0 0 1 4,4 v12 a4,4 0 0 1 -4,4 h-183 z" fill="var(--c1)"/>
  <path d="M180,116 h29 a4,4 0 0 1 4,4 v12 a4,4 0 0 1 -4,4 h-29 z" fill="var(--c-mute)"/>
  <text x="172" y="34" text-anchor="end">Semiconductor A</text>
  <text x="172" y="82" text-anchor="end">Semiconductor B</text>
  <text x="172" y="130" text-anchor="end">All other constituents</text>
  <text class="v" x="582" y="34">+0.71</text>
  <text class="v" x="379" y="82">+0.34</text>
  <text class="v" x="225" y="130">+0.06</text>
  <line class="axis" x1="180" y1="14" x2="180" y2="146"/>
  <text x="180" y="164" text-anchor="middle">0</text>
  <text x="317.5" y="164" text-anchor="middle">0.25</text>
  <text x="455" y="164" text-anchor="middle">0.50</text>
  <text x="592.5" y="164" text-anchor="middle">0.75</text>
</svg>
<figcaption>Illustrative figures for layout testing. In a live article: derived from Financial Services Commission stock and index price data, weighted by index share. Not investment advice.</figcaption>
</figure>

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
