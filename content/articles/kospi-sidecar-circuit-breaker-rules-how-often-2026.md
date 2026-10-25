---
title: "KOSPI sidecar and circuit breaker: what triggers them, and how often the index came close since August"
dek: "A Korean sidecar pauses program orders for 5 minutes when KOSPI 200 futures move 5%; a circuit breaker halts trading for 20 minutes when the KOSPI falls 8%. In 44 sessions from 18 August, the KOSPI 200 swung 5% intraday on 6 days."
category: equities
pubDate: 2026-10-26
dataAsOf: 2026-10-22T00:00:00+09:00
author: Newsroom
tags: ["kospi sidecar", "korea circuit breaker", "krx circuit breaker rules", "program trading halt korea", "kospi 200 volatility", "korea stock market rules"]
tickers: []
sources:
  - org: "Korea Exchange index data via data.go.kr (Financial Services Commission, index quotes)"
    api: "Daily open, high, low, close and change of the KOSPI and KOSPI 200 for 44 sessions, 18 August to 22 October 2026. Collected daily by SeoulMarkets."
  - org: "Economist (economist.co.kr), 15 October 2026, citing the Korea Exchange"
    api: "Circuit breaker rule (8% fall held for 1 minute; 20-minute halt) and the 15 October 2026 triggers on KOSDAQ at about 12:23 and on KOSPI 15 minutes later; previous trigger 29 July 2026; sell sidecars earlier the same session."
  - org: "OhmyNews, 21 October 2026"
    api: "Buy sidecar on the KOSPI at about 10:51 on 21 October 2026, KOSPI 200 futures up more than 5% for 1 minute; the previous buy sidecar was on 20 August."
crossChecks:
  - "KOSPI 200 days with an intraday high or low 5% or more from the prior close (18 Aug–22 Oct): 19 Aug (low −7.26%), 20 Aug (high +7.63%), 7 Sep (high +5.10%), 13 Oct (low −7.94%), 15 Oct (low −9.90%), 21 Oct (high +5.44%)."
  - "KOSPI days with an intraday low 8% or more below the prior close: one, 15 October (−9.29%), the day of the circuit breaker."
  - "KOSPI closes of ±5% or more: 4 of 44 (19 Aug −5.80%, 20 Aug +5.89%, 13 Oct −5.46%, 15 Oct −7.57%). ±3% or more: 12 of 44."
excluded:
  - "KOSPI 200 futures prices, which set off the sidecar. We hold the spot index only, so a 5% spot move is a close proxy, not the trigger itself."
  - "A full count of 2026 sidecars and circuit breakers. Press tallies disagree and we have not counted Korea Exchange notices."
  - "Whether a sidecar fired on 19 August, 7 September or 13 October. We did not find a report we could check for each."
  - "This is not investment advice."
draft: false
---

Korea's stock market has two automatic brakes, and in 2026 both have been used often. On **15 October** the KOSPI and KOSDAQ both hit a circuit breaker. Six days later, on **21 October**, a "buy sidecar" fired as the market jumped. Here is what each one does, and what our daily index file shows about how often the market came close.

## The two brakes

| | Sidecar | Circuit breaker, stage 1 |
|---|---|---|
| What sets it off | KOSPI 200 **futures** up or down **5%** from the prior close, for 1 minute | KOSPI (or KOSDAQ) index **down 8%** from the prior close, for 1 minute |
| Direction | Either way: a "buy" or a "sell" sidecar | Falls only |
| What stops | Program-trading orders, for **5 minutes** | **All trading**, for **20 minutes**, then 10 minutes of single-price auction |
| Ordinary orders | Keep trading | Stop |

A sidecar is a speed bump for computer-driven orders. A circuit breaker stops the market. The rules also set deeper stages at 15% and 20%; we did not check their current wording, and our data shows no day near either.

## What our data shows: 44 sessions from 18 August

Our archive of official index quotes covers **44 trading days**, 18 August to 22 October 2026. A sidecar is triggered by futures, which we do not hold, so we count the nearest thing: days when the **KOSPI 200 spot index** traded 5% or more away from the previous close.

| Date | KOSPI 200, intraday extreme | KOSPI 200 close | What the press reported |
|---|---|---|---|
| 19 Aug | low **−7.26%** | −6.41% | not checked |
| 20 Aug | high **+7.63%** | +6.75% | buy sidecar (referred to by OhmyNews on 21 Oct) |
| 7 Sep | high **+5.10%** | +5.10% | not checked |
| 13 Oct | low **−7.94%** | −6.25% | not checked |
| 15 Oct | low **−9.90%** | −8.13% | sell sidecars, then circuit breakers (Economist) |
| 21 Oct | high **+5.44%** | +3.76% | buy sidecar at about 10:51 (OhmyNews) |

That is **6 of 44 sessions**, about one in seven.

## The circuit breaker: once in 44 days

The KOSPI's intraday low reached 8% below the prior close on **one** day in the window: **15 October**, when it touched **−9.29%** and closed down 7.57% at 5,554.22. That is the day the circuit breaker fired. Our spot data and the press report agree.

The closest other day was 19 August, when the KOSPI's low was −6.83%. No halt.

## How big the days were

| KOSPI daily close | Sessions (of 44) |
|---|---|
| Up or down 3% or more | **12** |
| Up or down 5% or more | **4** |
| Down 8% or more | 0 |

Twelve sessions of 3% in nine weeks. The rules were written for rare days; in this stretch they are not rare.

## What we did not count

We have not counted every sidecar and circuit breaker of 2026. Press tallies we found disagree with each other, and we have not gone through the Korea Exchange's own notices. When we do, it will be a count, not an estimate. For the month's sector moves around these days, see [what rose and fell over 19–22 October](/article/kospi-sectors-week-october-19-22-2026-construction-up-chemicals-down).

*These are market rules and counts of past days. They say nothing about the next one.*

Related: [VKOSPI at 55 on 15 October](/article/vkospi-55-october-15-volatility-futures-barely-trade) · [KOSPI up, four in five stocks down](/article/kospi-up-four-in-five-stocks-fall-breadth-october-2026) · [entertainment rose while the KOSPI fell 19%](/article/korea-entertainment-stocks-rose-october-2026-while-kospi-fell-19).
More from the same data: [Korean banks are up 6% since the KOSPI peaked](/article/kospi-is-a-semiconductor-index).
