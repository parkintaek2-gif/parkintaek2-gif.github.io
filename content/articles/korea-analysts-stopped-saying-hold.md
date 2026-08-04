---
title: "Korean analysts didn't just stop saying sell. They stopped saying hold."
dek: "Across 55,580 rated broker reports since 2014, the neutral rating has fallen from 9.7% to 3.3% of all calls. The collapse happened in two steps, in 2018 and 2020, and it shows up inside individual firms — not just in the market average."
category: equities
pubDate: 2026-08-04
dataAsOf: 2026-08-03T23:59:00+09:00
author: Newsroom
tags: ["equity research", "analyst ratings", "market structure", "retail investors"]
tickers: []
sources:
  - org: "Naver Corporation"
    api: "Naver Finance — Company Research board (public listing and report detail pages)"
    url: "https://finance.naver.com/research/company_list.naver"
crossChecks:
  - "55,580 reports carrying an investment rating, spanning 2014 to 3 August 2026, across 1,086 listed companies and 35 brokerages"
  - "Ratings arrive in at least 18 different spellings across firms and years, including English, Korean, and outright typos (MarketPelform, Tirading). All were mapped to buy, hold or sell before counting; ungrouped, the same rating splits across several rows and every share is wrong"
  - "The trend was tested against a sourcing artefact: the collection path is the same board for 99.9% of the sample (12 of 66,105 records came from a broker site directly), so the shift is not an effect of changing where we look"
  - "The trend was tested a second time inside a single firm. Hana Securities, the largest single contributor at 5,006 rated reports since 2020, shows the same shape — 8.7% hold in 2017, 3.6% in 2018 — so this is not an artefact of the mix of firms changing over time"
  - "Years with fewer than 300 rated reports are excluded from the yearly series rather than shown with a noisy percentage"
  - "Hi Investment & Securities and iM Securities are counted as one firm, as in our earlier census: the last Hi report is dated 2024-08-05 and the first iM report 2024-08-07, with no overlap"
excluded:
  - "Why the shift happened. The data records that it did and when; it contains no explanation, and we are not offering one"
  - "Whether any rating was correct. Testing that needs the price history after each call, which is not yet in our archive"
  - "Analyst names. The board carries them only inside the PDF, which we do not retrieve — the name field is populated on 10 of 66,105 records, so no individual ranking is possible"
  - "Reports before 2014. Records exist back to December 2007 but too few carry a rating to compute a share"
  - "Samsung Securities' position in the firm table should be read with its sample size, 381 rated reports — the smallest of any firm shown, and roughly a thirteenth of the largest"
draft: false
---

We reported on 2 August that Korean brokerages issued twenty-six sell ratings in three years. That number gets quoted because it is shocking, and because it is easy to file under a familiar story: sell-side analysts do not say sell, everywhere, always.

The longer series says something less familiar. Over 55,580 rated reports going back to 2014, the sell rating was never really there to lose — 89 sell calls across the whole period. What has actually changed is the **hold** rating, and it has changed a lot.

## The middle is disappearing

| Year | Rated reports | Buy | Hold | Sell |
| --- | ---: | ---: | ---: | ---: |
| 2014 | 1,870 | 91.0% | 8.8% | 3 |
| 2015 | 3,926 | 90.3% | 9.1% | 24 |
| 2016 | 4,111 | 91.0% | 8.9% | 3 |
| 2017 | 4,221 | 90.2% | **9.7%** | 2 |
| 2018 | 4,189 | 93.8% | 6.1% | 6 |
| 2019 | 3,364 | 93.3% | 6.6% | 4 |
| 2020 | 2,488 | 95.0% | 4.6% | 10 |
| 2021 | 1,579 | 96.5% | 3.4% | 3 |
| 2022 | 2,736 | 96.0% | 3.9% | 3 |
| 2023 | 6,976 | 95.6% | 4.2% | 14 |
| 2024 | 7,497 | 95.4% | 4.5% | 9 |
| 2025 | 7,641 | 95.0% | 5.0% | 4 |
| 2026 (to 3 Aug) | 4,971 | 96.6% | **3.3%** | 4 |

For four straight years — 2014 through 2017 — roughly one rating in eleven was a hold. It has not been back to that level since. Had 2026 kept 2017's rate, there would be 484 hold ratings on the board this year instead of 164.

The decline is not a slope. It is two steps: 2017 to 2018 (9.7% to 6.1%) and 2019 to 2020 (6.6% to 4.6%). Between and after those breaks, the level is roughly flat. Something changed twice and then held.

## Two tests it had to pass

A trend in a long archive is usually a trend in the archive, not in the world. Two things could produce this shape without any analyst changing behaviour: we could have started collecting from a different place, or the mix of firms in the sample could have shifted toward the ones that never say hold.

**The collection path is constant.** All but 12 of 66,105 records come from the same public research board, across the whole period.

**The shape survives inside a single firm.** Hana Securities is the largest single contributor in the sample. Its own hold rate:

| Year | 2015 | 2016 | 2017 | 2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 | 2026 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Hold | 7.4% | 8.3% | 8.7% | 3.6% | 5.8% | 2.1% | 1.4% | 2.5% | 4.8% | **8.6%** | 5.1% | 1.9% |

The 2018 break is there, and sharper than the market's — 8.7% to 3.6% in one year, inside one firm, with no change in who is being counted.

That 2024 reading matters too, and it is why this is a description rather than a law. One firm went back to 8.6% for a year and then came down again. Whatever is driving this is not a ratchet.

## Which firms still use the middle rating

Since 2020, ranked by the share of ratings that were *not* buy — hold and sell together. Firms with at least 300 rated reports.

| # | Firm | Not buy | Rated reports | of which sell |
| ---: | --- | ---: | ---: | ---: |
| 1 | DB Financial Investment | 8.0% | 414 | 0 |
| 2 | Ebest Investment & Securities | 7.6% | 2,102 | 1 |
| 3 | Mirae Asset Securities | 7.5% | 2,939 | 13 |
| 4 | Daishin Securities | 6.5% | 2,715 | 0 |
| 5 | Hanwha Investment & Securities | 6.1% | 2,084 | 4 |
| 6 | iM Securities (formerly Hi Investment) | 5.4% | 1,603 | 2 |
| 7 | Yuanta Securities Korea | 5.3% | 1,796 | 0 |
| 8 | Hana Securities | 4.3% | 5,006 | 3 |
| 9 | Eugene Investment & Securities | 3.7% | 2,066 | 11 |
| 10 | SK Securities | 3.1% | 2,003 | 0 |
| 11 | Kiwoom Securities | 2.7% | 2,482 | 3 |
| 12 | Shinhan Securities | 2.6% | 3,339 | 0 |
| 13 | DS Investment & Securities | 2.0% | 1,121 | 3 |
| 14 | IBK Securities | 1.9% | 1,453 | 0 |
| 15 | Kyobo Securities | 1.0% | 1,990 | 0 |
| 16 | Samsung Securities | 0.0% | 381 | 0 |

The top of this table is not a list of bearish houses. **Eight percent is the maximum**, and it belongs to a firm that has published zero sell ratings in six years. The gap between the most and least differentiated research on this board is eight percentage points of hold.

At the bottom, Samsung Securities posted 381 rated reports since 2020 and every one was a buy. That is the smallest sample in the table and should be read as such — but it is not a rounding error either. Kyobo Securities managed 1.0% across nearly two thousand.

## What this does to a reader

A rating scale with three positions and 94% of the mass on one of them carries almost no information. The practical consequence is not that investors are misled by buy ratings — nobody reads a Korean buy rating as an instruction. It is that the **absence** of a buy no longer means anything either, because analysts who are unenthusiastic increasingly publish nothing rather than publish a hold.

Which leaves the target price doing the work the rating used to do. 84.3% of reports in this archive carry one, and unlike the rating, it is a number that can eventually be checked against what the stock did.

That check is the next thing we intend to publish, and we do not have it yet: it requires the price history after each call, which is not in our archive. Until it is, we are reporting what analysts said — not whether they were right.
