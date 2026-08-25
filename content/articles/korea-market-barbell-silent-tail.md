---
title: "One in twenty listed Korean stocks didn't trade a single share"
dek: "Korea's market is a barbell. On both days we've measured, two stocks were about half of all trading while roughly one in twenty listed issues traded nothing at all. A crowded head, a silent tail. Not advice."
category: equities
pubDate: 2026-08-25
dataAsOf: 2026-08-24T00:00:00+09:00
author: Newsroom
tags: ["liquidity", "trading-volume", "concentration", "kospi", "kosdaq", "korea"]
tickers: []
sources:
  - org: "Korea Exchange (KRX OPEN API)"
    api: "Daily trading information for KOSPI (stk_bydd_trd) and KOSDAQ (ksq_bydd_trd): trading value (ACC_TRDVAL) and market cap by issue, 2026-08-21 and 2026-08-24"
crossChecks:
  - "On 2026-08-24, 139 of 2,765 listed issues (5.0%) recorded zero trading value; on 2026-08-21 it was 137 of 2,764 (5.0%) — the same share on both days measured"
  - "The head is the mirror image: on 2026-08-24 the two most-traded issues, Samsung Electronics (27.6% of the day's trading value) and SK hynix (22.4%), were 50.0% of all trading between them"
  - "The ten most-traded issues were 62.7% of the day's trading value; the top 30 were 71.3%"
  - "By market value the concentration is nearly as steep: the largest issue is 25.1% of total cap and the top five are 52.1%"
excluded:
  - "This is two trading days (2026-08-21 and 2026-08-24); daily trading shares swing with the news, so treat the head figures as snapshots — the zero-trade share held at 5.0% on both, but two days is not a proven constant"
  - "Zero trading value means the exchange reported no trades for that issue on that day; it is not a claim that the company is defunct or delisted"
  - "All figures are reported as ratios (share of trading, share of issues, share of cap), which do not depend on the won price level"
  - "Trading value is close price times volume as reported by KRX, aggregated by the exchange"
  - "This is not investment advice"
image: /charts/market-concentration-top10.svg
---

Korea's stock market is usually described from the top down: [four companies are half of its value](/article/korea-four-stocks-half-the-market), and [Samsung alone is about a quarter of it](/data/concentration). That is true. But it describes only one end of the market. Look at the other end — the bottom — and the picture is stranger: on a normal trading day, a chunk of the market does not trade at all.

## The silent tail

On **2026-08-24**, **139 of 2,765** listed issues — **5.0%, one in twenty** — recorded **zero trading value**. Not a small trade. No trade. The same count held the trading day before: **137 of 2,764**, also **5.0%**.

Two days is not a law, and we say so. But the number landing in the same place both times is worth watching, and we now measure it daily. Zero trading value simply means the exchange reported no trades in that issue that day; it does not mean the company is gone. It means that, for that session, those shares had no market.

## The crowded head

Now the other end. On the same day, the two most-traded stocks did half of everything:

- **Samsung Electronics** — 27.6% of the day's trading value
- **SK hynix** — 22.4%
- **Together: 50.0%** of all trading, in two names.

Widen the lens and it barely eases: the **ten** most-traded issues were **62.7%** of the day's turnover, the **top thirty** were **71.3%**. The rest of the roughly 2,700 traded issues split what was left.

![Bar chart of the ten largest Korean issues by share of total market capitalisation, showing Samsung Electronics far ahead of the rest.](/charts/market-concentration-top10.svg)

## A barbell, not a bell curve

Put the two ends together and Korea's market is a **barbell**. At one end, two or three names absorb most of the money that moves. At the other, one in twenty issues moves no money at all. The busy middle that the word "market" usually calls to mind — thousands of stocks trading actively against each other — is thinner than it looks.

This is the same story our [concentration data](/data/concentration) tells by market value, seen through trading instead: a market that is heavy at the top and hollow at the bottom. We publish the concentration figures as a [free daily CSV](/data/korea-concentration.csv) you can reproduce with credit — and from now on the zero-trade count rides along with it.

Not investment advice — ratios, from official Korea Exchange closes, every figure dated.
