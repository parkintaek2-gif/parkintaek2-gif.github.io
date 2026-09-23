---
title: "Stretch the window from three years to five and Korea's unbroken-profit share falls from 45.3% to 37.7%"
dek: "Of 2,049 Korean listed companies that filed a net profit in all five years from 2021 to 2025, 772 were profitable in every one. The same test over 2023–2025 passes 1,072 of 2,368 — the count moves with the window."
category: equities
pubDate: 2026-09-23
dataAsOf: 2025-12-31T00:00:00+09:00
author: Newsroom
tags: ["dart", "financial-statements", "profitability", "net-profit", "korea", "listed-companies"]
tickers: []
sources:
  - org: "Financial Supervisory Service (Republic of Korea) / DART"
    api: "Open DART financial statement API — annual business reports (사업보고서), report code 11011, fiscal years 2021 through 2025"
    url: "https://opendart.fss.or.kr"
  - org: "SeoulMarkets"
    api: "Filed-accounts tape built from those annual reports (build-v1-financials-tape.mjs), 13,545 company-year rows"
    url: "https://seoulmarkets.com/data/profit-streaks"
crossChecks:
  - "Five-year test: of 2,709 companies with a ticker in the DART company register, 2,049 filed a net-profit line in all five years 2021–2025. Of those, 772 reported a positive net profit in every one of the five, 193 reported a loss in every one"
  - "Three-year test on the same tape, restricted to 2023–2025: 2,368 companies filed in all three years and 1,072 were profitable in all three (45.3%)"
  - "Every year is tested individually. An earlier build of this count checked only the first and last year and reported 1,168 rather than 1,072 — a company that lost money in the middle year passed. The published figures test all years"
  - "Coverage by year, companies with a filed annual report: 2021 2,094 · 2022 2,187 · 2023 2,395 · 2024 2,528 · 2025 2,577"
excluded:
  - "The 660 companies that did not file a net-profit line in at least one of the five years. They are left out entirely rather than counted as a loss — but that exclusion leans the sample towards companies that were listed and filing for the whole run"
  - "Quarterly runs. Our tape holds annual business reports, so a streak measured in quarters — the form these studies usually take — is outside what we can check"
  - "Any comparison with published surveys of large Korean companies. Those count a different universe on a different test, and putting their number beside ours would invite a reading neither figure supports"
  - "Whether consolidated and separate-basis filings are mixed within one company's five-year run. We carry the basis on every row but did not require it to be constant"
draft: false
---

The phrase turns up every autumn: so many years of unbroken profit. It sounds like a property
of the company. It is at least as much a property of the window.

We hold annual accounts as filed with Korea's Financial Supervisory Service for 2,709 listed
companies with a ticker, now running from fiscal 2021 to fiscal 2025. Ask the same question
over two different windows and the answer moves by nearly eight percentage points.

| Window | Companies filing in every year | Profitable every year | Share |
|---|---|---|---|
| 2023–2025 (three years) | 2,368 | 1,072 | 45.3% |
| 2021–2025 (five years) | 2,049 | 772 | 37.7% |

Neither number is more correct than the other. They answer different questions, and a reader
who is told only "37.7% stayed profitable" has not been told which five years, or that two
more years of history removes roughly one in six of the companies that cleared the shorter bar.

## The other direction is worth counting too

Over the five-year window, 193 companies reported a loss in every one of the five years —
9.4% of the 2,049. Another 398 went from profit at the start to loss at the end, and 235 went
the other way. Those four groups do not add to the total: a company that zig-zagged belongs
to none of them.

## Staying in the black is a low bar

Being profitable every year is one test. Growing the profit every year is a much harder one.
Of the 772 companies that never lost money across the five years, **40** also increased net
profit in every single year — 2.0% of the 2,049 companies we could test, and 1.5% of the
listed universe.

By revenue, the largest of those 40 are Samsung C&T, LS Electric, Samsung Biologics, LIG
Defense & Aerospace and Hyundai Autoever. We are not presenting that as a ranking of quality.
It is the arithmetic result of one strict filter, and a company can fail it for reasons that
have nothing to do with how the business is doing — a one-off gain in an early year makes the
next year's comparison impossible to beat.

## Why the exclusion matters more than the headline

660 companies filed a net-profit line in some of the five years but not all of them. We leave
them out of the count entirely rather than reading a missing filing as a loss. That is the
honest treatment of a gap, but it is not a neutral one: a company that listed in 2023, or
that stopped filing in 2024, cannot appear. What survives the filter leans towards companies
that were there for the whole run — which is exactly the direction that would flatter a
profitability statistic.

That is the reason we publish the denominator beside every share, and why the same page
carries the three-year and five-year counts together rather than picking the flattering one.

The full breakdown, including the split by industry classification, is on the
[profit streaks page](/data/profit-streaks).
