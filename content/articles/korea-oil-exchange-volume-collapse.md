---
title: "Korea's oil exchange traded half as much fuel in 2026, and its auction has gone quiet four days in five"
dek: "Daily volume on KRX's diesel, petrol and kerosene markets has fallen sharply since April 2026 — down as much as 74% year-on-year for diesel — and the exchange's competitive auction increasingly prints no price at all."
category: commodities
pubDate: 2026-08-22
dataAsOf: 2026-08-20T00:00:00+09:00
author: Newsroom
tags: ["oil", "diesel", "petrol", "kerosene", "krx", "korea", "trading volume"]
tickers: []
sources:
  - org: "Financial Services Commission (Korea)"
    api: "General Product Price Information Open API — getOilPriceInfo (KRX petroleum electronic market, daily volume-weighted price and turnover by fuel and trade type)"
    url: "https://www.data.go.kr"
crossChecks:
  - "1,624 trading days, 2 January 2020 to 20 August 2026 — diesel has a record on all 1,624, petrol on 1,623, kerosene on 1,622"
  - "Daily volume and the day's weighted-average price are internally consistent: on 1 July 2026, diesel turnover of 887,158,156 won divided by volume of 500,627 gives 1,772.06 won a litre, matching that day's 1,772.09 won negotiated average"
  - "Trading-day average volume by fuel and year (litres): diesel ran 12–15 million a day from 2020 through 2025, then fell to 5.1 million in 2026 (through 20 August); petrol held 6.7–7.9 million through 2025 before falling to 5.1 million; kerosene held 2.4–2.9 million through 2025 before falling to 1.3 million"
  - "Same-month year-on-year, diesel's daily average fell 47.9% in January 2026, 66.1% in April, 59.2% in May, 67.4% in June and 73.6% in July, against the same month of 2025"
  - "A day with no competitive-auction trade prints a weighted-average of exactly 0 for that field while the negotiated price still prints — this is the exchange's own encoding for 'no auction trade,' not a price of zero. Diesel's share of such days ran 0.4%–2.5% a year from 2020–2025 and reached 31.1% in 2026 (through 20 August); petrol ran 0.8%–6.1% and reached 29.8%; kerosene ran 3.2%–17.6% and reached 80.1%"
  - "Within 2026 the jump is sudden, not gradual, for diesel and petrol: 0% of days in January and February, 0%–4.8% in March, then 81.8% of days in April and 77.8% in May, easing to 42.9% in June, 22.7% in July and 11.1% in the first nine trading days of August"
  - "Across kerosene's full 1,622-day history, sorting by that day's traded volume: on the thinnest 10% of days (volume at or below 402,000 litres) the competitive auction failed to print 69.8% of the time; on the busiest 10% (5.44 million litres or more) it failed 1.9% of the time"
excluded:
  - "Any cause for the 2026 volume decline or the April jump in missing auctions — a change in who trades, a rule change at the exchange, or something else. The feed carries daily prices and turnover, not participant identity or exchange notices, so the reason is not in this file"
  - "Whether the auction is recovering. August's missing-auction rate (11.1%) is lower than April's (81.8%), but the month is only nine trading days old in this sample and that is too short to call a trend"
  - "A volume split between the competitive and negotiated markets. The feed reports one turnover figure per fuel per day, not one for each trade type, so the link drawn here is between total volume and whether the auction printed at all — not how much traded in the auction specifically"
  - "Retail or pump prices, and any comparison to Brent or Dubai crude. These are wholesale exchange turnover figures in won a litre"
  - "2026 as a full year. It is 151 trading days old in this sample and is described as such throughout"
draft: false
---

Korea Exchange's petroleum market prints a volume figure every trading day for diesel, petrol and kerosene, alongside the two weighted-average prices [this desk wrote about earlier](/article/korea-oil-exchange-two-prices). A companion piece on this desk has already tracked [diesel's volume sliding through 2025](/article/korea-oil-exchange-diesel-decline-spread) — down 22.9% from 2020 to 2025, year over year. This piece picks the story up where that one stops: what has happened since, inside 2026 itself.

## Half the fuel changed hands

Diesel is normally the exchange's biggest fuel by a wide margin — 12 to 15 million litres a day, most years, against 7-ish million for petrol and under 3 million for kerosene. That held from 2020 through 2025. In 2026 it broke.

| Year | Diesel (L/day) | Petrol (L/day) | Kerosene (L/day) |
| --- | ---: | ---: | ---: |
| 2020 | 13,938,299 | 6,912,280 | 2,592,500 |
| 2021 | 15,123,425 | 7,898,334 | 2,934,310 |
| 2022 | 12,492,095 | 7,633,178 | 2,784,366 |
| 2023 | 13,221,323 | 7,554,441 | 2,659,795 |
| 2024 | 12,061,266 | 6,695,542 | 2,390,862 |
| 2025 | 11,013,647 | 7,440,501 | 2,548,082 |
| 2026* | 5,108,599 | 5,083,827 | 1,325,633 |

*2026 covers 151 trading days, 2 January to 20 August.

Diesel's daily average has been cut by more than half from 2025, and petrol's is down by a third — enough that the two, historically not close, are now trading nearly the same volume. Measured the same month against a year earlier, diesel's fall accelerates through the year: -47.9% in January, -0.7% in February, -28.5% in March, then -66.1%, -59.2%, -67.4% and -73.6% in April through July.

## The auction stopped printing, on the same schedule

The exchange's competitive-auction price is not always present — this desk covered that for kerosene already, where it goes missing about one day in six across the full history. What the volume data shows is that diesel and petrol have started doing the same thing, and it lines up with the drop in trading almost month for month.

A missing auction shows up as a weighted average of exactly 0, distinct from an actual price — the negotiated price still prints that day. Counted by year, diesel's and petrol's auctions were reliable through 2025:

| Year | Diesel | Petrol | Kerosene |
| --- | ---: | ---: | ---: |
| 2020 | 0.8% | 2.0% | 3.2% |
| 2021 | 1.2% | 0.8% | 5.6% |
| 2022 | 0.8% | 1.2% | 9.3% |
| 2023 | 2.4% | 4.1% | 8.6% |
| 2024 | 2.5% | 6.1% | 17.6% |
| 2025 | 0.4% | 1.2% | 14.9% |
| 2026* | 31.1% | 29.8% | 80.1% |

Share of trading days with no competitive-auction print, by year.

Inside 2026 the shift is a step, not a drift. January and February ran clean — 0% of days missing an auction for either fuel. March was still nearly clean. Then April: 81.8% of trading days for both diesel and petrol printed no auction price at all. May held close to that (77.8%). June, July and the first nine days of August eased — 42.9%, 22.7%, 11.1% — but remain far above anything seen before 2026.

## Thin days are quiet-auction days

Kerosene's longer history gives room to test whether this is really about volume. Sort its 1,622 trading days by that day's turnover and split into tenths: on the thinnest 10% of days — 402,000 litres or less — the competitive auction failed to print 69.8% of the time. On the busiest 10% — 5.44 million litres or more — it failed 1.9% of the time.

That is a strong association, not a proof of mechanism: the feed carries one turnover number per fuel per day, not a breakdown of how much of it went through the auction specifically, so what exactly happens on a thin day inside the auction is outside this file. But the direction is consistent with what 2026 shows for diesel and petrol — volume collapsed first, and the auction went quiet alongside it.

## Why this is worth a column

None of this says which price — auction or negotiated — is the "real" one; this desk already declined to make that call. What it adds is scale: a market that quotes two prices for the same fuel is a manageable footnote when both prices are printing most days. A market where one of the two has stopped printing four days out of five, for fuels where that used to be rare, is a different market than the one the 2020–2025 data describes. Anyone treating "the KRX diesel price" as a stable daily quote should know that, for much of 2026, one of the two prices behind it simply was not there.
