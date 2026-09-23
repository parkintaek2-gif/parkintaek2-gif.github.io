---
title: "49.0% on KOSPI, 31.9% on KOSDAQ — and on KONEX we cannot count at all"
dek: "Split Korea's five-year profit streaks by listing board and the market-wide 37.7% comes apart. KONEX gets no figure: only 6 of its 107 companies filed annual accounts in all five years."
category: equities
pubDate: 2026-09-23
dataAsOf: 2025-12-31T00:00:00+09:00
author: Newsroom
tags: ["kospi", "kosdaq", "konex", "dart", "profitability", "financial-statements", "korea"]
tickers: []
sources:
  - org: "Financial Supervisory Service (Republic of Korea) / DART"
    api: "Open DART financial statement API — annual business reports, fiscal 2021 through 2025"
    url: "https://opendart.fss.or.kr"
  - org: "SeoulMarkets"
    api: "Filed-accounts tape, 13,545 company-year rows, joined to the DART listed-company register for board membership"
    url: "https://seoulmarkets.com/data/profit-streaks"
crossChecks:
  - "KOSPI: 830 companies in the register, 698 filed a net-profit line in all five years, 342 of those were profitable in every year (49.0%) and 29 lost money in every year (4.2%)"
  - "KOSDAQ: 1,772 in the register, 1,345 filed in all five years, 429 profitable every year (31.9%), 164 loss-making every year (12.2%)"
  - "KONEX: 107 in the register, 6 filed in all five years. We publish no rate from six companies"
  - "Market-wide the same test gives 772 of 2,049 (37.7%). The board split does not average to that figure by hand because each board has a different share of companies dropping out of the five-year filter"
excluded:
  - "Any five-year profitability rate for KONEX. Six companies is not a sample of 107, and putting a percentage on it would be the kind of number that travels further than its own caveat"
  - "The reason KONEX filings are so sparse in our tape — whether it is a disclosure-obligation difference, a collection gap on our side, or both. We have not established which"
  - "Companies that changed board during the five years. Board membership is taken from the current register, so a KOSDAQ-to-KOSPI transfer is counted under where it sits now"
  - "Any judgement about which board is the better place to invest. A profitability rate is a description of a population, not a recommendation"
draft: false
---

We published a market-wide figure this morning: of 2,049 Korean listed companies that filed a
net profit in all five years from 2021 to 2025, 772 — 37.7% — were profitable in every one.

Split that by listing board and the single number stops being useful.

| Board | In register | Filed all five years | Profitable every year | Loss-making every year |
|---|---|---|---|---|
| KOSPI | 830 | 698 | 342 — 49.0% | 29 — 4.2% |
| KOSDAQ | 1,772 | 1,345 | 429 — 31.9% | 164 — 12.2% |
| KONEX | 107 | 6 | not countable | not countable |

Roughly half of the KOSPI companies with a complete five-year record never had a losing year.
On KOSDAQ it is closer to a third, and the companies that lost money in *every* one of the five
years are three times as common a share.

None of that is surprising to anyone who knows the two boards. It is worth putting a number on
anyway, because the market-wide 37.7% is a blend of two populations that behave differently,
and a reader who applies it to a specific company is applying the wrong denominator roughly
half the time.

## The KONEX row is the one we spent the most time on

KONEX has 107 companies in the register. Six of them filed an annual business report we could
read in all five years.

We could compute a percentage from those six. We are not going to. A rate built on six
companies out of 107 would be quoted without its denominator within a week, and it would be
quoted as a fact about KONEX.

What we can say is the thing that is actually true and actually useful: **for the KONEX board,
filed annual accounts are sparse enough that multi-year tests do not work.** Whether that is
a disclosure-obligation difference, a gap in our own collection, or both, we have not
established — and saying so is more honest than a number that hides the question.

This is the same reason the coverage page for the statement tape reports KOSPI, KOSDAQ and
KONEX separately rather than publishing one headline percentage. A buyer screening for
small-cap Korean names needs to know that the KONEX column is nearly empty *before* they build
anything on it.

The full five-year counts, including the industry split, are on the
[profit streaks page](/data/profit-streaks), and board-by-board coverage is on the
[statement-tape coverage page](/data/financials).
