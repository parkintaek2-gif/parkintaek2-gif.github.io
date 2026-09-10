---
title: "We measured Korea's two oil prices in August. Ten weeks later the kerosene auction is almost gone."
dek: "Our August count put the kerosene auction dark one day in six across six years. Over the 49 sessions to 9 September it was dark 47 times — and petrol and diesel have tripled their own dark rate."
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
  - "Why the auction went quiet. Thin participation, a negotiated-only convention for some fuels, or a reporting change would all look identical in this data. We report the level and the change, never the cause"
  - "Any period longer than these 49 sessions in this file. Our own six-year count is a separate collection and is cited rather than re-derived here"
---

The Korea Exchange runs a petroleum market, and for each fuel it publishes **two** weighted average
prices per session: one for competitive trading, where orders meet on a book, and one for negotiated
trading, where the two sides agree a price between themselves.

We counted those two prices once before. On 8 August we published
[a six-year read of them](/article/korea-oil-exchange-two-prices) — 1,619 trading days to 6 August
2026 — and reported that the competitive auction printed nothing at all on 4.1 percent of diesel
days, 5.1 percent of petrol days and **16.2 percent of kerosene days**. One day in six for kerosene.

This is what the same measurement looks like on the 49 sessions to 9 September.

| | Rows |
| --- | ---: |
| Fuel-days read | 147 |
| Negotiated price reported | **147** |
| Competitive price reported | 83 |
| Competitive price absent | **64** (43.5%) |

The negotiated figure never fails to appear. The competitive one is missing on more than four rows in
ten — against roughly one in twenty across the six years to August. So on those days the number the
exchange publishes as the price of that fuel is a price two parties agreed on, not one a market
cleared.

## Kerosene has essentially no competitive price

The absence is not spread evenly.

| Fuel | Dark, 6 years to Aug | Dark, 49 sessions to 9 Sep | Reported volume |
| --- | ---: | ---: | ---: |
| Petrol | 5.1% | **8 of 49 (16%)** | 173,154,004 |
| Diesel | 4.1% | **9 of 49 (18%)** | 127,573,238 |
| **Kerosene** | 16.2% | **47 of 49 (96%)** | 5,582,003 |

For petrol and diesel a missing competitive session used to be a rare exception and is now roughly a
one-in-six event. For kerosene it has stopped being an exception at all: on 47 of 49 sessions there
was no competitive weighted average, and the published figure was the negotiated one.

It is not one bad fortnight. Split by month, the level holds:

| Month | Kerosene sessions | Auction dark | Petrol dark | Diesel dark |
| --- | ---: | ---: | ---: | ---: |
| July 2026 | 22 | **22 (100%)** | 4 (18%) | 5 (23%) |
| August 2026 | 20 | 18 (90%) | 3 (15%) | 3 (15%) |
| September (to 9th) | 7 | **7 (100%)** | 1 (14%) | 1 (14%) |

Our August figure of 16.2 percent was a six-year average, and July 2026 sits inside that window — so
the average was already being lifted by this stretch while also hiding it. That is the point worth
keeping: a rate computed over six years cannot tell you that the last three months were near-total.

Korea's exchange kerosene price is now, for practical purposes, a negotiated price with a competitive
price twice a quarter. Anyone treating the three fuels as three comparable exchange series is
comparing two market prices with one that has largely stopped being one.

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
book. That agrees with our August read, which put the median gap a little above the auction at 5.0,
1.6 and 0.9 won a litre while also finding the negotiated price *below* the auction on 37 to 46
percent of individual days. A small positive median and a near coin-flip day to day are the same
finding stated two ways, and neither is a claim that one price is the right one.

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

One note on how this was built. The daily collection behind this piece did not exist yesterday: the
collector was written on 4 August 2026 and had never been run, so its archive folder held no files.
That is why our August article drew on a separate six-year pull and this one draws on a fresh daily
archive — two collections, cited separately, not merged into one series. We have now pulled 1 July to
9 September and put the daily collection under the same watch as our bond and broker archives.

Forty-nine sessions is 49 sessions. What it can say is that the level in July, August and the first
week of September is far above the six-year average we published a month ago. What it cannot say is
when it changed, because the daily archive does not reach back before July.
