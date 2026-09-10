---
title: "Korea's exchange publishes two oil prices a day. On kerosene, only one of them exists."
dek: "Across 49 sessions the Korean petroleum exchange reported a negotiated weighted average every single time and a competitive one on 83 of 147 rows. For kerosene the competitive price was missing on 47 of 49 sessions."
category: commodities
pubDate: 2026-09-11
dataAsOf: 2026-09-09T00:00:00+09:00
author: Newsroom
tags: ["oil", "commodities", "KRX", "petroleum", "price discovery", "korea"]
tickers: []
sources:
  - org: "Financial Services Commission (Korea) — general commodity market prices, via data.go.kr"
    api: "KRX petroleum market daily weighted averages by fuel, competitive and negotiated reported separately; 49 sessions from 1 July to 9 September 2026"
    url: "https://www.data.go.kr"
crossChecks:
  - "The dataset reports two weighted averages per fuel per session, one for competitive trading and one for negotiated trading. 49 sessions across three fuels gives 147 rows, and all 147 were read"
  - "A competitive price of zero is treated as absent rather than as a price of zero won, because a weighted average of zero is not a price. Counted that way: the competitive figure is absent on 64 of 147 rows and the negotiated figure on none of them"
  - "By fuel, the competitive figure is absent on 8 of 49 sessions for petrol, 9 of 49 for diesel and 47 of 49 for kerosene"
  - "The negotiated premium is computed only on rows carrying both figures, and only reported where at least five such rows exist. Petrol: plus 0.313 percent across 41 sessions. Diesel: plus 0.362 percent across 40. Kerosene has two comparable sessions, so no figure is given for it"
excluded:
  - "A kerosene premium. Two comparable sessions is not a distribution, and printing a number from them would turn a coin flip into a finding. The tool that produced this piece refuses to emit that figure at all"
  - "Volume in physical units. The dataset reports a volume field without a unit, so the totals here are the reported figures and are not converted to litres or barrels"
  - "Retail pump prices. This is exchange trading. What a Korean driver pays is set elsewhere and is not in this file"
  - "Why competitive trading is absent. Thin participation, a negotiated-only convention for some fuels, or a reporting rule would all look identical here. The data shows which figure exists, not the reason"
  - "Any period longer than these 49 sessions. This archive was empty until 11 September 2026 and there is no earlier history behind it"
---

The Korea Exchange runs a petroleum market, and for each fuel it publishes **two** weighted average
prices per session: one for competitive trading, where orders meet on a book, and one for negotiated
trading, where the two sides agree a price between themselves.

Almost nobody looks at which of the two actually exists. We read 49 sessions — 147 fuel-days — and
counted.

| | Rows |
| --- | ---: |
| Fuel-days read | 147 |
| Negotiated price reported | **147** |
| Competitive price reported | 83 |
| Competitive price absent | **64** (43.5%) |

The negotiated figure never fails to appear. The competitive one is missing on more than four rows in
ten. So on those days, the number an exchange publishes as the price of that fuel is a price two
parties agreed on, not one a market cleared.

## Kerosene has essentially no competitive price

The absence is not spread evenly.

| Fuel | Sessions | Competitive price absent | Reported volume |
| --- | ---: | ---: | ---: |
| Petrol | 49 | 8 (16%) | 173,154,004 |
| Diesel | 49 | 9 (18%) | 127,573,238 |
| **Kerosene** | 49 | **47 (96%)** | 5,582,003 |

For petrol and diesel a missing competitive session is an exception. For kerosene it is the rule: on
47 of 49 sessions there was no competitive weighted average at all, and the published figure was the
negotiated one.

That single line is the piece. Korea's exchange kerosene price is, for practical purposes, a
negotiated price with a competitive price twice a quarter. Anyone treating the three fuels as three
comparable exchange series is comparing two market prices with one that is not.

## Where both exist, the negotiated price is the higher one

On rows carrying both figures we measured how far the negotiated average sits above the competitive
one.

| Fuel | Comparable sessions | Negotiated above competitive (median) |
| --- | ---: | ---: |
| Petrol | 41 | **+0.313%** |
| Diesel | 40 | **+0.362%** |
| Kerosene | 2 | *not reported* |

Both figures are small, both are positive, and both are steady enough across forty sessions to be
worth stating: negotiated buyers in this market pay about three-tenths of a percent more than the
book.

The kerosene row is blank on purpose. Two comparable sessions cannot carry a median, and the tool
behind this article will not emit one — it holds a floor of five and returns nothing below it. We
would rather print an empty cell than a number that is really a coin flip.

## A note on reading zeros

The dataset delivers a missing competitive price as **0**. Read literally, that is a weighted average
of zero won, and a tool that averages the column would report Korean kerosene trading at roughly four
percent of its actual price — because 47 of its 49 values are zeros.

We treat a zero as *absent* and count how many there are, which is why the absence is the finding
rather than a footnote. It is the same discipline as the rest of this desk: a gap gets counted and
named, never filled.

This archive did not exist two days ago. The collector for it was written on 4 August 2026 and had
never been run, so `archive/raw/commodities` held no files at all. We pulled 1 July to 9 September and
put it under the same daily watch as our bond and broker archives — but 49 sessions is 49 sessions,
and nothing here says what the year looks like.
