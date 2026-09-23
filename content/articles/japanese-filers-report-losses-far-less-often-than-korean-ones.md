---
title: "11.7% of Japanese listed filers reported a net loss. In Korea the figure is 38.2%"
dek: "We now hold filed annual accounts for 3,672 Japanese listed companies alongside 2,709 Korean ones. On the most recent filing each side, the median Japanese filer earned an 8.0% return on equity; the median Korean filer earned 2.6%."
category: equities
pubDate: 2026-09-23
dataAsOf: 2026-03-31T00:00:00+09:00
author: Newsroom
tags: ["japan", "korea", "financial-statements", "edinet", "dart", "profitability", "listed-companies"]
tickers: []
sources:
  - org: "Financial Services Agency (Japan) / EDINET"
    api: "Annual securities reports (有価証券報告書) — most recent filing on file per company"
    url: "https://disclosure.edinet-fsa.go.jp"
  - org: "Financial Supervisory Service (Republic of Korea) / DART"
    api: "Open DART financial statement API — annual business reports, fiscal 2025"
    url: "https://opendart.fss.or.kr"
  - org: "SeoulMarkets"
    api: "Japan and Korea filed-accounts tapes (build-japan-financials-tape.mjs, build-v1-financials-tape.mjs)"
    url: "https://seoulmarkets.com/japan/companies"
crossChecks:
  - "Japan: 3,672 companies, of which 3,671 filed a net-profit line and 430 of those (11.7%) reported a loss. 3,612 filed an operating-profit line and 400 of those reported an operating loss"
  - "Korea, fiscal 2025: 2,709 companies in the register, 2,577 filed a net-profit line, 985 of those (38.2%) reported a loss"
  - "Medians are computed within each market from the same filings, skipping rows where an input was missing or a denominator was zero — never by filling a gap with zero"
  - "Japanese fiscal year-ends cluster hard: 2,198 of 3,672 companies (59.9%) close in March and 549 (15.0%) in December"
  - "Basis mix, Japan: 2,900 of 3,672 filings are consolidated and 772 standalone. Korea's tape carries consolidated and separate filings side by side in the same way"
excluded:
  - "Any claim that the two sets of accounts are like-for-like. Korean figures are fiscal 2025; Japanese figures are each company's most recent filing, which for six in ten companies covers April 2025 to March 2026. The periods overlap but are not the same"
  - "Accounting-standard differences. Korean filers report under K-IFRS; Japanese filers report under Japanese GAAP, IFRS or US GAAP depending on the company, and we did not normalise between them"
  - "Listing-threshold differences between the two markets, which change who is in each population before any accounting question arises"
  - "Any explanation of the gap. We counted what was filed; why the distributions differ is a question this data cannot answer"
  - "Currency conversion. Yen figures stay in yen and won figures stay in won — an exchange rate would be a number we made up, not one the companies reported"
draft: false
---

We have opened company pages for the Japanese listed market: 3,672 companies, one page each,
built from the annual securities reports they filed with Japan's Financial Services Agency.
That puts two complete filed-accounts sets on the same site for the first time, and the first
thing worth doing with them is the simplest — count how many companies in each market lost
money.

| On the most recent filed accounts | Japan (3,672 filers) | Korea (fiscal 2025) |
|---|---|---|
| Reported a net loss | 430 of 3,671 — 11.7% | 985 of 2,577 — 38.2% |
| Median operating margin | 5.98% | 2.84% |
| Median return on equity | 8.0% | 2.6% |
| Median equity / assets | 56.9% | 60.3% |
| Median revenue | JPY 28.0bn | — (see note) |

The loss rate is the figure that does not need interpreting. Roughly one Japanese listed filer
in nine reported a net loss on its most recent annual accounts. In Korea, on fiscal 2025, it
was closer to two in five.

The balance-sheet line runs the other way, and mildly: the median Korean filer carries slightly
more equity against assets than the median Japanese one. Solvency and profitability are
different questions, and on this data they do not point the same way.

## What would make this comparison wrong

Four things, and they are all in the data rather than in the interpretation.

The periods are not identical. Korean figures are fiscal 2025. Japanese figures are each
company's most recent filing on file, and because 59.9% of Japanese companies close their books
in March, most of those cover April 2025 to March 2026. They overlap; they are not the same
twelve months.

The accounting standards are not identical. Korean filers report under K-IFRS. Japanese filers
report under Japanese GAAP, IFRS or US GAAP depending on the company. We did not normalise
between them, and a margin computed from two different standards is not a clean like-for-like.

The populations are not identical. Each market sets its own listing thresholds, which decides
who is in the count before any accounting question arises.

And we are not explaining the gap. A count of loss-making filers is a count. Why one market's
distribution sits where it does is a question these two tapes cannot answer, and we would rather
leave the gap visible than fill it with a story.

## Why the median, not the average

One very large filer would pull an average far enough to hide the ordinary company. Toyota's
accounts should not decide what "a Japanese listed company" looks like, and Samsung's should
not decide it for Korea. Every central figure above is a median computed inside its own market,
and every one of them skips — rather than zero-fills — the rows where an input was missing.

Revenue is the one line we have left out of the comparison column above. Comparing a yen median
against a won median means picking an exchange rate, and an exchange rate is a number we would
be making up rather than one the companies reported.

Company-level pages for the Japanese market are at [/japan/companies](/japan/companies), and
the Korean set is at [/companies](/companies).
