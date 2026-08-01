---
title: "Korean brokerages posted 26,051 stock reports in three years. Twenty-six said sell."
dek: "A complete census of every company report published to Korea's most-read retail research board finds sell ratings at 0.114 percent — one for every 838 buys. Thirteen of the twenty firms never issued a single one."
category: equities
pubDate: 2026-08-02
dataAsOf: 2026-07-31T23:59:00+09:00
author: Newsroom
tags: ["equity research", "analyst ratings", "market structure", "retail investors"]
tickers: []
sources:
  - org: "Naver Corporation"
    api: "Naver Finance — Company Research board (public listing and report detail pages)"
    url: "https://finance.naver.com/research/company_list.naver"
crossChecks:
  - "Window is a complete census, not a sample: all 28,012 listed reports dated 2023-08-01 through 2026-07-31 were retrieved individually and matched 1:1 against the board's own index (100.0 percent)"
  - "Every one of the 26 sell-side ratings was inspected as an individual record rather than counted from an aggregate"
  - "Hi Investment & Securities and iM Securities are treated as one firm: the board shows a clean handover on 2024-08-05 / 2024-08-07 with no overlap"
  - "Six IR and credit-assessment bodies that publish company reports without ratings were separated out before computing any ratings percentage"
  - "The single implausible figure found in the data — a 2,000,000-won target on a bank trading near 25,000 — was re-fetched from the source page and confirmed as published"
excluded:
  - "Whether any target price was subsequently met — this article makes no accuracy claim, because the price history needed to test one is not yet in our archive"
  - "Analyst names — the board does not carry them outside the PDF, which we do not retrieve"
  - "Reports distributed only to institutional clients — not posted to this board and therefore outside the census"
draft: false
---

There is a well-worn claim about Korean equity research: nobody says sell. It is repeated often enough to have become background noise, usually without a number attached.

Here is the number. Between 1 August 2023 and 31 July 2026, brokerages posted 26,051 company reports to Naver Finance's research board, the most widely read free research feed available to Korean retail investors. Of the 22,833 that carried an investment rating, twenty-six recommended selling.

That is 0.114 percent. One sell for every 838 buys.

## What the data shows

The census covers 28,012 reports in total across 1,910 listed companies. We retrieved every one of them individually and matched the result against the board's own index; the match is complete, with no missing days and no gaps.

Of those, 1,961 came from IR agencies and credit-assessment bodies — organisations that publish company profiles without issuing a rating at all. Removing them leaves 26,051 reports from twenty securities firms, which is the population any statement about analyst ratings should be measured against.

| Rating | Reports | Share of rated |
|---|---:|---:|
| Buy, Strong Buy, Outperform, Overweight | 21,793 | 95.45% |
| Hold, Neutral, Market Perform | 985 | 4.31% |
| **Sell, Reduce, Underperform, Underweight** | **26** | **0.114%** |

A further 3,218 brokerage reports — 12.4 percent — carried no rating field at all. That category matters more than it looks, and we return to it below.

The scarcity is not spread evenly across the industry. It is concentrated in a way that a market-wide average conceals entirely.

| Firm | Reports | Sell ratings |
|---|---:|---:|
| Eugene Investment & Securities | 1,985 | 10 |
| Mirae Asset Securities | 2,165 | 5 |
| DS Investment & Securities | 965 | 3 |
| Hana Securities | 3,098 | 2 |
| Kiwoom Securities | 2,180 | 2 |
| Hanwha Investment & Securities | 1,733 | 2 |
| iM Securities (formerly Hi Investment) | 1,466 | 2 |
| **Shinhan Investment** | **3,057** | **0** |
| **Daishin Securities** | **2,348** | **0** |
| **SK Securities** | **2,099** | **0** |
| **Yuanta Securities Korea** | **1,702** | **0** |
| **Kyobo Securities** | **1,465** | **0** |
| **IBK Investment & Securities** | **1,139** | **0** |

Thirteen of the twenty firms did not issue a single sell rating in three years. Six of them published more than a thousand reports each while doing so. Shinhan Investment published 3,057 reports — the second-largest output on the board — without once recommending that a reader sell anything.

## The mechanism

Twenty-six is a small enough number to read one by one, and reading them changes the picture again.

Fourteen of the twenty-six were written about two companies in the same corner of the same industry: EcoPro BM (twelve) and its parent EcoPro (two), the cathode-materials pair at the centre of Korea's 2023 battery-share mania. Eugene Investment alone accounts for ten of those, restating a Reduce rating on EcoPro BM at intervals through 2023 and 2024.

Strip out that one episode and the remaining three years produce twelve sell ratings across the entire Korean market. Three of those are the same analyst call on SOOP, the streaming company formerly named AfreecaTV, repeated by Mirae Asset in March, April and July of 2025.

The count by year shows no trend toward more candour:

| Period | Sell ratings |
|---|---:|
| Aug–Dec 2023 | 9 |
| 2024 | 9 |
| 2025 | 4 |
| Jan–Jul 2026 | 4 |

Fourteen of the eighteen issued in 2023 and 2024 are the EcoPro cluster. Every sell rating recorded after August 2024 — eight of them — concerns a different company.

What the data cannot tell you is why. It can, however, rule out one explanation and point at another. Sell ratings are not absent because Korean firms rate cautiously in some other vocabulary: hold-type ratings are also rare, at 4.31 percent. Ninety-five percent of rated reports are positive.

The more suggestive figure is the 3,218 brokerage reports with no rating at all. A firm that does not want to publish a positive view has an option short of publishing a negative one, and 12.4 percent of the time it takes it. That is roughly a hundred and twenty times as common as saying sell. We are describing what the distribution looks like, not asserting intent; the reports themselves do not explain their own omissions.

## Where this breaks

Two limits on the above deserve to be stated before anyone carries the number elsewhere.

This is a census of one board, not of Korean equity research. Naver Finance carries what firms choose to post publicly. Samsung Securities appears 361 times in three years and Korea Investment & Securities nineteen times — both far below their actual output, which means their institutional research largely does not pass through here. The finding is precise about what Korean retail investors can read for free, which is the population that matters for a retail market, but it is not the full universe and should not be quoted as one.

Second, this article makes no claim about whether the ratings were right. Testing that requires price histories we do not yet hold under a licence permitting redistribution, and we would rather publish the census now than a guess later. The target prices are archived; the accuracy question stays open.

## The evidence

One record in the dataset is wrong at source, and it is worth showing rather than quietly correcting.

Hanwha Investment & Securities' sell rating on KakaoBank, dated 3 August 2023, carries a target price of 2,000,000 won — roughly eighty times where the stock was trading. The same firm's next sell on the same stock, in February 2024, lists 23,000. We re-fetched the original page rather than assume our parser had erred; the board itself publishes 2,000,000. The error belongs to the source, so we report the figure as published and flag it here. It does not affect any count in this article, all of which are counts of ratings rather than of prices.

Two firms in the data changed names mid-window. Hi Investment & Securities stops on 5 August 2024 and iM Securities begins on 7 August 2024, with no overlapping day; they are one firm and are counted as one. The two sell ratings attributed to that firm were both issued under the old name. Treating them as two separate houses would have added a fourteenth firm to the never-issued-a-sell list, which is exactly the kind of artefact that a rename produces if nobody checks.

Ratings were grouped by the wording each report itself carries, in Korean or English as published. Twenty-nine reports rated "Trading Buy" were left out of all three buckets rather than assigned to one, on the grounds that the term describes a holding period rather than a direction. Including them as buys moves the buy share from 95.45 to 95.57 percent and changes nothing else.

## The verdict

The claim that Korean analysts do not issue sell ratings is not folklore. Across a complete three-year census of the country's most-read public research board, the figure is twenty-six out of 22,833 — and more than half of those concern a single speculative episode in one industry.

The sharper finding is that this is a firm-level behaviour rather than a market-level one. Seven firms have issued a sell rating in the past three years. Thirteen have not, including six that published more than a thousand reports each. A reader who wants to know whether a research house has ever told its audience to sell can now check, because the answer is a matter of record rather than of reputation.

None of the above is investment advice. It is a count of what was published.
