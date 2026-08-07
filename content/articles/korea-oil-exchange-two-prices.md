---
title: "Korea's oil exchange prints two prices for the same fuel, and they disagree four days in ten"
dek: "The KRX oil market quotes two prices per fuel — a competitive-auction average and a negotiated one. Over six years they disagree: the negotiated runs below the auction on 37–46% of days, and the kerosene auction goes dark one day in six."
category: commodities
pubDate: 2026-08-08
dataAsOf: 2026-08-06T00:00:00+09:00
author: Newsroom
tags: ["oil", "kerosene", "diesel", "petrol", "krx", "korea"]
tickers: []
sources:
  - org: "Korea Exchange (KRX), petroleum electronic market"
    api: "Daily petroleum market weighted-average prices (석유시장 유종별 가중평균), 2020-01-02 to 2026-08-06"
    url: "https://www.data.go.kr"
crossChecks:
  - "The market publishes two weighted-average prices for each fuel each day: one for competitive-auction trades (경쟁가중평균) and one for negotiated trades (협의가중평균). This piece compares the two on the 1,619 trading days from 2020-01-02 to 2026-08-06"
  - "On days when both prices exist, the negotiated price is below the competitive-auction price on 37.2% of days for diesel (578 of 1,553), 44.8% for petrol (688 of 1,536) and 46.0% for kerosene (623 of 1,355). The median gap is small — the negotiated price a little above the auction, by 5.0, 1.6 and 0.9 won a litre — but the daily gap ranges across roughly 200 won in both directions"
  - "The competitive-auction price is missing — no auction trade printed that day — on 4.1% of days for diesel (66 of 1,619), 5.1% for petrol (82 of 1,618) and 16.2% for kerosene (262 of 1,617)"
  - "A single recent day (2026-08-06) shows the pattern: diesel 1,768 auction / 1,774.73 negotiated, petrol 1,779 / 1,785.73, and kerosene with no auction price at all, only a negotiated 1,381.73"
excluded:
  - "Any claim about which price is 'correct'. The exchange publishes both; this piece reports that they differ and how often, not which one a buyer should use"
  - "The mechanism behind a negative gap. Negotiated blocks and auction lots can differ in size, timing and counterparty, and the data here carries only the two daily averages — not the trades behind them — so the cause of any one day's gap is not in this file"
  - "Trade volume split between the two markets. The file reports a single daily volume per fuel, not one for auction and one for negotiated, so this piece does not weight the two prices by how much traded in each"
  - "Retail or pump prices. These are wholesale exchange quotes and do not carry fuel tax; they are not what a driver pays"
draft: false
---

Ask for "the Korean oil price" and Korea's own exchange will hand you two numbers. Not a bid and an ask — two settled, published, weighted-average prices for the same fuel on the same day. One is the average of trades struck in the competitive auction; the other, the average of trades done by negotiation. Most days they sit close. Often enough to matter, they do not.

## Two prices, and they disagree

The KRX petroleum market lists diesel, petrol and kerosene, and for each it prints both a competitive-auction average and a negotiated average every trading day. We took all 1,619 days from the start of 2020 to 6 August 2026 and asked a simple question: when both prices exist, how often is the negotiated one *below* the auction?

| Fuel | Negotiated below auction | Auction price missing |
| --- | ---: | ---: |
| Diesel | 37.2% of days | 4.1% of days |
| Petrol | 44.8% of days | 5.1% of days |
| Kerosene | 46.0% of days | 16.2% of days |

Close to four days in ten for diesel, closer to five for petrol and kerosene, the negotiated market clears *under* the auction. The reflex is to assume a negotiated deal costs more — you are paying for size, or for certainty. Here, nearly half the time, it costs less.

The typical gap is small. Take the median across every day both prices exist and the negotiated price sits just above the auction — by 5.0 won a litre for diesel, 1.6 for petrol, 0.9 for kerosene. But the median hides the spread. Day to day the gap runs across roughly two hundred won in either direction; a fuel that averages a one-won premium can trade a hundred won cheaper on Tuesday and a hundred won dearer on Thursday. The two prices track each other loosely, not tightly.

## The auction that isn't always there

The second column is the quieter finding. The competitive-auction price is not missing because of a holiday — the market was open and the negotiated price printed. It is missing because *no auction trade happened at all* that day.

For diesel and petrol that is rare, one day in twenty or so. For kerosene it is one day in six. Kerosene's competitive auction is thin enough that, again and again, the only price the market can quote is a negotiated one. On 6 August 2026 that is exactly what you see: diesel and petrol each carry both prices, and kerosene carries a single negotiated figure — 1,381.73 won a litre — with the auction column blank.

So the honest version of "the kerosene price" is narrower than it sounds. One day in six there is no auction reference for it; there is only what two parties agreed.

## Why this is worth a column

None of this says the exchange is broken. Two prices for two ways of trading is exactly what a competitive market and a negotiated market are supposed to produce, and publishing both is more honest than blending them into one number that hides the difference.

But it does mean "the KRX oil price" is not a single thing you can quote without choosing. The two are not interchangeable: they disagree in direction, not just size, on a large minority of days, and for kerosene one of them is often simply absent. Anyone building off these figures — an index, a contract reference, a chart — is picking one market over the other, whether they know it or not. The least a data source can do is say which, and how often the choice would have mattered.
