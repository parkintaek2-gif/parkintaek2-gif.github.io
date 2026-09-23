---
title: "Six in ten Japanese listed companies close their books in the same month"
dek: "2,198 of 3,672 Japanese listed filers have a March fiscal year-end. Those companies are also three times the size of the rest by median revenue, and report losses at half the rate."
category: equities
pubDate: 2026-09-23
dataAsOf: 2026-03-31T00:00:00+09:00
author: Newsroom
tags: ["japan", "edinet", "fiscal-year", "financial-statements", "earnings-season", "listed-companies"]
tickers: []
sources:
  - org: "Financial Services Agency (Japan) / EDINET"
    api: "Annual securities reports (有価証券報告書) — most recent filing on file per company, including the period-end date on each filing"
    url: "https://disclosure.edinet-fsa.go.jp"
  - org: "SeoulMarkets"
    api: "Japan filed-accounts tape (build-japan-financials-tape.mjs), 3,672 companies"
    url: "https://seoulmarkets.com/japan/companies"
crossChecks:
  - "Month counted from the period-end date carried on each filing, not inferred from the filing date. All 3,672 companies carry one"
  - "March 2,198 (59.9%) · December 549 (15.0%) · February 209 (5.7%) · September 198 (5.4%) · August 101 (2.8%). The remaining seven months hold 417 companies between them"
  - "Loss rate, March closers: 192 of 2,198 filers with a net-profit line reported a loss (8.7%). All other months: 238 of 1,473 (16.2%)"
  - "Median revenue, March closers: JPY 42.1bn. All other months: JPY 14.1bn"
excluded:
  - "Why the March closers are larger. Company age, industry mix and listing venue would all be candidates, and our tape carries none of them — we did not test any explanation and are not offering one"
  - "A Korean comparison. Our Korean tape records the fiscal year but not the period-end date, so we cannot count the same way on that side and will not estimate it"
  - "Companies with no annual securities report on file, which are absent from the 3,672 entirely"
  - "Any suggestion that a fiscal year-end causes profitability. The two figures are measured on the same companies; nothing here establishes a direction"
draft: false
---

Most markets spread their reporting across the calendar. Japan does not.

Of the 3,672 Japanese listed companies whose annual securities reports we hold, **2,198 —
59.9% — close their financial year on 31 March.** Another 549 close in December. Those two
months carry three quarters of the entire listed market between them.

| Fiscal year-end | Companies | Share |
|---|---|---|
| March | 2,198 | 59.9% |
| December | 549 | 15.0% |
| February | 209 | 5.7% |
| September | 198 | 5.4% |
| August | 101 | 2.8% |
| All seven other months | 417 | 11.4% |

For anyone reading Japanese accounts from outside, this is the first practical fact about the
market, ahead of any individual company: the reporting calendar is not a calendar, it is a
single date with a long tail.

## The March cohort is not a random half of the market

Two measures separate the March closers from everyone else, and both point the same way.

**Size.** Median revenue among March closers is JPY 42.1bn. Among companies closing in any
other month it is JPY 14.1bn — roughly a third. The March group is where the large filers sit.

**Loss rate.** 192 of the 2,198 March closers with a readable net-profit line reported a loss,
8.7%. Among the other months it is 238 of 1,473, 16.2% — close to double.

We are not explaining either gap. Company age, industry mix and listing venue would all be
reasonable candidates, and our tape carries none of them. A fiscal year-end does not make a
company profitable; what the two figures say is that the March cohort and the rest are
different populations, and that a statistic computed over "Japanese listed companies" without
splitting them is averaging across two quite different groups.

## What this means for reading the data

A single year-end shared by six companies in ten has one consequence that shows up immediately
in any dataset built from filings: the accounts arrive together. Comparisons across Japanese
companies are unusually clean, because most of them are measuring the same twelve months. But
comparisons *into* Japan are not — a Japanese March-2026 filing covers April 2025 to March
2026, which overlaps a Korean or US fiscal 2025 without matching it.

That is the reason our own Japan-Korea comparison carries the caveat in the first paragraph
rather than the footnote.

Per-company pages, including the period-end date on each filing, are at
[/japan/companies](/japan/companies).
