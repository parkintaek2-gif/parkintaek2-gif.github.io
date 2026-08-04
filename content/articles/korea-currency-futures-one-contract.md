---
title: "China is Korea's biggest trading partner. Its yuan futures are 0.03% of the market."
dek: "Across 629 trading days, 99.2% of Korean currency-futures turnover was one contract: the dollar. The exchange also lists 1,272 flexible-dated dollar futures that have never traded once."
category: fx
pubDate: 2026-08-04
dataAsOf: 2026-08-03T18:00:00+09:00
author: Newsroom
tags: ["currency futures", "won", "yuan", "market structure", "korea exchange"]
tickers: []
sources:
  - org: "Financial Services Commission (Korea)"
    api: "Derivative Product Price Information Open API — getStockFuturesPriceInfo (daily close, underlying price, turnover and open interest by contract)"
    url: "https://www.data.go.kr"
crossChecks:
  - "629 trading days, 2 January 2024 to 3 August 2026, with no missing months — every trading day in the window was fetched individually and checked"
  - "Contracts are assigned to a market by their underlying, following the convention that a currency future is FX and an index future is equities. The assignment was tested against a table of twelve real instrument names before any figure here was computed"
  - "Won per dollar is the underlying price the exchange publishes alongside each dollar future, not a rate we derived from the futures price"
  - "A closing price of zero is treated as 'did not trade', not as a price. On a typical day only about a fifth of listed contracts trade at all"
excluded:
  - "Spot FX turnover. This feed covers exchange-traded futures only; the interbank market is larger and is not reported here"
  - "Non-deliverable forwards and offshore won trading, which are not exchange products"
  - "Why the yuan contract is small. The data shows the size; it contains no explanation"
  - "Options. This operation returns futures only"
  - "Korea's trade shares by country. That China is the largest partner is context taken from general knowledge, not measured here, and no figure in this article rests on it"
  - "Any period before 2024. The archive is being extended backwards and 2022–2023 is still filling"
draft: false
---

China is Korea's largest trading partner — that part is not our measurement, and nothing below depends on how large. The Korea Exchange lists a yuan futures contract, and it works: it traded on 531 of the 629 days in this sample.

It is 0.03% of the currency futures market.

## The whole market, ranked

| Contract | Turnover | Share | Days traded | Peak open interest |
| --- | ---: | ---: | ---: | ---: |
| US dollar | 5,936.4tn won | **99.20%** | 629 of 629 | 1,538,305 |
| Euro | 28.5tn | 0.48% | 623 | 33,938 |
| Yen | 18.0tn | 0.30% | 620 | 40,107 |
| Yuan | 1.5tn | **0.03%** | 531 | 275 |

Over two and a half years the dollar contract moved **2,993 times** the value of the yuan contract. Peak open interest tells the same story from a different angle: at its busiest the yuan contract had 275 contracts outstanding. The dollar had over 1.5 million.

The euro and yen are small too, but they are small in the ordinary way — a few tenths of a percent, thousands of contracts open, trading nearly every day. The yuan is a different order of magnitude. Its peak open interest would fit in a single dollar-contract trade.

## What the dollar contract is actually for

The dollar contract carries 99.2% of the turnover because it is not really a currency market. It is the hedging instrument for everything else — exporters, importers, bond investors, equity investors, anyone with a won balance sheet and a dollar exposure. Korea's entire foreign-currency risk is expressed through one line.

That is efficient right up until it isn't. A market with one liquid instrument prices that instrument well and everything else badly. If you need to hedge a yuan receivable — and Korean exporters have a lot of them — the exchange has a contract for you, and 275 contracts of open interest to meet you in it.

## The 1,272 contracts that have never traded

The same feed carries something stranger. Alongside the standard dollar futures, the exchange lists **flexible-dated dollar futures**: contracts with customised expiry dates rather than the standard quarterly cycle.

Across 629 trading days there were **1,272 distinct flex contracts** listed, appearing in the price file **119,598 times**.

Trades: **zero.**
Open interest: **zero.**

Not "thin". Not "occasionally". In two and a half years of daily files, not one of these contracts has ever recorded a trade or an open position. They are listed, priced at zero, carried in the data every day, and never used.

This is worth knowing for a practical reason. If you count "listed contracts" as a measure of market depth — and league tables sometimes do — Korea's FX derivatives market looks like it offers 1,300 instruments. It offers four.

## Meanwhile, the won had a year

The same records carry the underlying spot rate the exchange publishes against each dollar future. It is the cleanest daily won/dollar series available from an official Korean open-data source.

- **2 January 2024:** 1,300.4
- **2 July 2026:** 1,555.8 — the weakest point in the sample
- **3 August 2026:** 1,429.8

The won lost 10.0% against the dollar over the whole window, but the shape matters more than the endpoint. It fell steadily for two and a half years to 1,555.8, and then in **22 trading days gave back 8.1% of that** — from 1,555.8 on 2 July to 1,429.8 on 3 August.

A 126-won round trip in a month, in the one contract that carries 99.2% of the market's hedging, on 1.5 million open contracts. Whatever happened in July, it happened in a market with nowhere else to go.

## How to read a concentration number

There is a temptation to read 99.2% as a failure — a market that should be more balanced. That is not what the data says, and we are not saying it.

What the data says is narrower and more useful: **Korean currency risk has one liquid venue.** Every hedging decision, every basis, every squeeze runs through the dollar contract. When you read that Korean exporters are hedged, this is the instrument they are hedged in. And when a company's exposure is to the yuan rather than the dollar, the exchange's answer is a contract with 275 open positions at its busiest.
