---
title: "Korea's exchange-traded gold has fallen 31% since January, and the small-lot contract is busier than ever"
dek: "Six and a half years of Korea Exchange gold prints: up 228% overall, up 60% in 2025, then down 30.9% from a peak set on 29 January. Turnover in the 100-gram contract is running 72% above last year through the whole decline."
category: commodities
pubDate: 2026-08-04
dataAsOf: 2026-08-03T18:00:00+09:00
author: Newsroom
tags: ["gold", "commodities", "korea exchange", "retail investors", "fuel prices"]
tickers: []
sources:
  - org: "Financial Services Commission (Korea)"
    api: "General Product Price Information Open API — getGoldPriceInfo (KRX gold market, daily close and turnover by contract)"
    url: "https://www.data.go.kr"
  - org: "Financial Services Commission (Korea)"
    api: "General Product Price Information Open API — getOilPriceInfo (KRX petroleum market, daily volume-weighted price by fuel and trade type)"
    url: "https://www.data.go.kr"
crossChecks:
  - "1,616 trading days, 2 January 2020 to 3 August 2026, 8,077 daily records across both markets — the full history the feed carries"
  - "Contract names change over the period (금 99.99K, 금 99.99_1Kg, 금 99.99_1kg, 미니금 100g, 미니금 99.99_100g). They were normalised to two contracts, 1kg and 100g, before any series was calculated; ungrouped, the same contract breaks into several partial series"
  - "Gold prices are quoted in won per gram. A 2020 open of 56,860 won/g and a 2026 close of 186,430 won/g correspond to roughly US$1,470 and US$4,140 per troy ounce at prevailing exchange rates, consistent with the international price in both periods"
  - "Fuel figures use only days on which both the competitive and the negotiated weighted average were non-zero. A zero in this feed means no trade of that type occurred, not a price of zero — 66 such days for diesel, 82 for gasoline and 259 for kerosene were excluded from the spread calculation"
excluded:
  - "Any comparison to international spot gold or to Korean retail jewellery prices. This feed carries exchange prints only, and no cross-source reconciliation was performed"
  - "Who the buyers are. The feed reports contract size and turnover, not investor category. The 100-gram contract is the smaller of the two and is the one an individual can realistically take delivery of, but the data does not label a single trade as retail"
  - "KRX emissions trading. Twelve plausible operation names were tested against this service and all returned 400 — the emissions market is a separate dataset that we have not yet located"
  - "Why gold turned in January. The data records that it did, and how much traded on the way down; it contains nothing about cause"
  - "Any figure for 2026 as a full year. The year is 143 trading days old in this sample and is described as such throughout"
draft: false
---

The Korea Exchange runs a gold market. It is not a futures market or a fund — buy on it and you own metal in a vault, quoted in won per gram, settled like a stock. The exchange publishes every day's close and turnover, and the full history goes back to the start of 2020.

Read the whole file at once and two things stand out.

## The run, and then the fall

| Year | Open | Close | Change |
| --- | ---: | ---: | ---: |
| 2020 | 56,860 | 66,370 | +16.7% |
| 2021 | 67,580 | 68,950 | +2.0% |
| 2022 | 70,090 | 74,360 | +6.1% |
| 2023 | 75,150 | 86,340 | +14.9% |
| 2024 | 86,940 | 127,850 | +47.1% |
| 2025 | 128,790 | 206,190 | +60.1% |
| 2026 (to 3 Aug) | 208,800 | 186,430 | −10.7% |

Won per gram, 1-kilogram contract. Across the whole period, **+227.9%**.

The year-to-date figure understates what happened inside 2026. Gold peaked at **269,810 won on 29 January** and closed at 186,430 on 3 August. That is **−30.9% in six months**. In won, the metal gave up 83,380 per gram — twice the 40,910 it gained across the whole of 2024.

## Turnover did not collapse with the price

Here is the part the price table hides. Daily turnover, in hundred-million won:

| Year | 100g contract | 1kg contract |
| --- | ---: | ---: |
| 2020 | 3.1 | 69.5 |
| 2021 | 2.9 | 73.0 |
| 2022 | 2.7 | 58.1 |
| 2023 | 2.7 | 43.3 |
| 2024 | 4.8 | 115.2 |
| 2025 | 26.6 | 871.6 |
| 2026 | 45.8 | 1,179.9 |

Through the first 143 trading days of 2026 — a period in which gold lost nearly a third of its value from the peak — the small contract traded **72.3% more per day than in all of 2025**, and the large contract 35.4% more.

Split 2026 at the January peak and the picture sharpens rather than reverses:

- **The 20 days to the peak:** 74.3 per day in the 100g contract, 2,134.5 in the 1kg
- **The 123 days since:** 41.2 and 1,024.7

So activity did fall by roughly half after the top — turnover chased the price up and thinned on the way down, as it usually does. But the *post-crash* run rate in the small contract, 41.2, is still **55% above the average for the whole of 2025**, a year gold rose 60%.

Whoever is trading the 100-gram contract has not gone away. They are doing more business at 186,000 won than they were doing at 129,000.

One caveat the data insists on: the small contract has never been more than **5.9%** of gold turnover in any year, and was 3.7% in 2026. This is a large market with a small retail-sized corner, and the corner is what grew.

## The other market on the same feed

The same API carries the Korea Exchange petroleum market, which publishes something unusual: **two** volume-weighted prices for each fuel each day — one for trades matched on the open order book, one for trades negotiated between counterparties.

The gap between them is a direct readout of how much the public order book is worth. In 2021, the average absolute gap across the three fuels was **31.1 won per litre**. In 2025 and again in 2026 it was **10.1 won** — a 68% narrowing.

| Fuel | 2021 (negotiated − competitive) | 2026 |
| --- | ---: | ---: |
| Diesel | −23.2 won | −2.3 won |
| Gasoline | −24.7 | −4.8 |
| Kerosene | −37.5 | +0.3 |

In 2021 a negotiated deal reliably beat the screen by 23 to 38 won a litre. In 2026 the two prices are within a few won of each other, and for kerosene the sign has flipped. A market built to make fuel pricing transparent now shows very little difference between the transparent price and the private one.

The kerosene line carries its own warning. On **259 of 1,614 days** — one day in six — no competitive trade happened at all, and the feed records a zero. Read as a price, that zero would put kerosene at nothing. It means the order book was empty.

## Two markets, the same money

Over these six and a half years the gold market turned over **48.50 trillion won** and the petroleum market **48.72 trillion** — within half a percent of each other.

They got there completely differently. Fuel ran at 150 to 210 hundred-million won a day of diesel, year after year, and is running lighter in 2026. Gold sat at 43 hundred-million won a day as recently as 2023, went nearly vertical through 2025, and now trades at twenty-seven times its 2023 rate on a price 31% below its peak.

One of these is infrastructure. The other is a position.
