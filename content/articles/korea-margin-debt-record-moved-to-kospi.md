---
title: "Korea's margin debt hit a record. It moved to KOSPI."
dek: "Korea's margin loan balance hit a record ₩38.6 trillion on 24 June 2026, up 50% year-on-year. KOSDAQ's share fell from 48% in 2021 to 21% today — this year's leverage moved into large-cap KOSPI, not the smaller, speculative market."
category: equities
pubDate: 2026-09-04
dataAsOf: 2026-09-02T18:00:00+09:00
author: Newsroom
tags: ["margin debt", "leverage", "kospi", "kosdaq", "korean equities", "retail investors"]
tickers: []
sources:
  - org: "Korea Financial Investment Association (via data.go.kr)"
    api: "General Statistical Information on Financial Investment Companies — getGrantingOfCreditBalanceInfo (dataset 15094809, exchange-wide margin loan and short-margin balance, daily)"
    url: "https://www.data.go.kr"
crossChecks:
  - "1,177 daily records, 9 November 2021 to 2 September 2026 — the full history this operation carries. Fetched with pagination until totalCount was exhausted; re-running the collector overwrites overlapping dates with the latest value (idempotent)"
  - "The 2 September 2026 total, ₩33.44 trillion, matches the figure reported in the news coverage that prompted this check — verified independently before this piece was written"
  - "KOSDAQ share = 신용융자_코스닥 (KOSDAQ margin loan balance) ÷ 신용융자_전체 (exchange-wide total). The separate 신용대주 (short-margin) and 예탁증권담보융자 (securities-collateral loan) lines are not included in this ratio"
  - "Month-end figures use the last trading day on or before the calendar month-end in the feed (e.g. 30 January stands in for 31 January, a Saturday)"
excluded:
  - "Who is borrowing. This is an exchange-wide aggregate with no breakdown by investor age. Whether investors in their 20s and 30s specifically drove the 2026 increase — the claim in the news coverage that prompted this check — cannot be confirmed or denied from this data. Not measured"
  - "Forced-selling (반대매매) volume. No operation in this dataset reports it. Checked and not found"
  - "Why the balance peaked on 24 June or why it fell 25% by 31 July. The data records the level, not the cause"
  - "Any comparison to margin debt in other markets (e.g., the US FINRA series). No cross-market reconciliation was attempted"
draft: false
---

Korea's exchanges do not report who is borrowing to buy stocks. The Korea Financial Investment Association reports how much is borrowed, exchange-wide, every trading day, split between KOSPI and KOSDAQ. That series now runs 1,177 trading days, from 9 November 2021 to 2 September 2026, and it holds a record — and a pattern that cuts against the story usually told about it.

## The record, and the pullback

| Date | Margin loan balance | Change |
| --- | ---: | ---: |
| 31 Dec 2021 | ₩23.09T | — |
| 31 Dec 2024 | ₩15.82T | −31.5% from 2021 |
| 31 Dec 2025 | ₩27.29T | +72.5% from 2024 |
| 2 Jan 2026 | ₩27.42T | — |
| **24 Jun 2026** | **₩38.63T** | **all-time high in this series** |
| 2 Sep 2026 | ₩33.44T | −13.4% from the peak, +50.2% year-on-year |

The balance nearly doubled from its 2024 low to the June 2026 peak, and even after a pullback it is still up half from a year ago. That much lines up with a summer of headlines about rising margin lending. What the headlines did not specify is where the borrowing happened.

## KOSDAQ's share fell every month this year

KOSDAQ is the smaller, higher-turnover of Korea's two exchanges — the one usually associated with retail speculation. If the 2026 leverage buildup were concentrated there, KOSDAQ's share of the total margin balance should have risen. It did the opposite, every month:

| Month-end 2026 | KOSDAQ share of margin balance |
| --- | ---: |
| 30 Jan | 34.4% |
| 27 Feb | 33.7% |
| 31 Mar | 31.5% |
| 30 Apr | 30.9% |
| 29 May | 26.3% |
| 30 Jun | 21.7% |
| 31 Jul | 21.1% |
| 31 Aug | 20.9% |
| 2 Sep | 21.0% |

At the end of 2021, KOSDAQ carried 47.8% of exchange-wide margin debt — nearly half. By this September it carries 21.0% — a little over a fifth, and the lowest share in the data. Every one of KOSPI's competitors for the leveraged investor's money this year, in relative terms, has been KOSPI itself: the balance grew fastest in the large-cap market, not the small one.

There was also a sharp, brief deleveraging inside the record run: the total fell from ₩37.33 trillion on 30 June to ₩28.93 trillion by 31 July — a 22.5% drop in one month — before recovering to ₩33.25 trillion by the end of August. KOSDAQ's share barely moved through that swing (21.7% to 21.1% to 20.9%), which means the July unwind, like the year's buildup, was concentrated in KOSPI.

## What this does not show

The news coverage that prompted this check described rising margin lending and forced-selling (반대매매) among investors in their 20s and 30s. This feed cannot speak to either claim directly: it carries no investor-level breakdown, so the age composition of the increase is not measured here, and no operation in this dataset reports forced-selling volume — checked and not found. What it does show, cleanly, is that wherever the leverage is concentrated by age, it is concentrated in KOSPI by market. A story about young, small-cap-driven leverage and a data series showing the growth sitting in large-cap KOSPI are not necessarily in conflict — a young investor can borrow against Samsung Electronics as easily as against a KOSDAQ name — but the two claims are not the same claim, and only one of them is in this data.
