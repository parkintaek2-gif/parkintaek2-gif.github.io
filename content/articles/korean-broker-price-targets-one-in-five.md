---
title: "Korean brokerages' price targets are met about one time in five"
dek: "Score every target against the stock twelve months later. Across 19,495 rated reports, 21.6% of price targets were reached. Brokers promised 38% upside on average; the shares delivered 10%."
category: equities
pubDate: 2026-08-08
dataAsOf: 2026-08-05T00:00:00+09:00
author: Newsroom
tags: ["brokerages", "analysts", "target price", "research", "korea"]
tickers: []
sources:
  - org: "Korea Exchange (close prices)"
    api: "Daily stock prices via the public data portal (data.go.kr dataset 15094808)"
    url: "https://www.data.go.kr"
  - org: "Brokerage research (published facts)"
    api: "Report date, brokerage, stock, target price and rating — as published by each house"
crossChecks:
  - "Each report's target price is compared to the stock's close about twelve months after publication. A target is counted 'met' if the price twelve months on is at or above it. Across 19,495 reports from houses with at least 20 scored reports, 21.6% were met"
  - "Past reports carry no ticker at the source, so the ticker was restored from the company name against the exchange's current listing. The reports that could not be matched — mostly delisted or renamed names — are dropped, not guessed"
  - "The average target implied 37.9% upside from the price on the day it was published; the shares actually returned 9.9% over the following twelve months. The gap, not the level, is the finding"
  - "Prices are Korea Exchange closes obtained from the public data portal, licence unrestricted. Report facts (date, house, stock, target, rating) are used; report text, PDFs and view counts are not stored"
excluded:
  - "Delisted and renamed tickers that could not be matched back to a price. Their removal biases the hit rate upward — a company that failed is exactly the one a target missed — so the true hit rate is lower than 21.6%"
  - "Targets reached at any point during the twelve months but not held to the twelve-month close. Measuring on a single closing price undercounts targets that were briefly touched, so this is a floor for how often a target printed"
  - "Houses with fewer than 20 scored reports, to keep any single ranking off a thin sample"
draft: false
---

A target price is the most-quoted number a brokerage produces and the least-audited. Every report carries one; almost nobody keeps score. So we did — matching each target to what the stock actually did twelve months later, across a multi-year archive of rated reports.

## One in five

Across **19,495 reports** from houses with a meaningful sample, **21.6%** of price targets were reached within twelve months. Four out of five were not. And the miss is not a rounding error: the average target implied **37.9%** upside from the price on the day it was written, while the shares returned **9.9%** over the next year. Brokers, on average, promised roughly four times the gain the market delivered.

## By house

The hit rate is not uniform. Among the houses that publish the most, it runs from the mid-teens to about thirty percent.

| Brokerage | Hit rate (12m) |
| --- | ---: |
| SK Securities | 30.8% |
| Kiwoom | 24.7% |
| Hana | 22.8% |
| Mirae Asset | 21.6% |
| Shinhan | 21.6% |
| Kyobo | 21.4% |
| Eugene | 16.3% |
| Daishin | 15.9% |

The spread is real, but so is the ceiling: no high-volume house reached even a third of its targets. The number a client is told at the top of every report — "target price" — is met, at best, once in three and, on average, once in five.

## Why the gap, and what it isn't

This is not a claim that the analysis is bad. A target is a twelve-month aspiration under one set of assumptions; markets move on others. What the data measures is calibration — how far the promised number sat above the outcome — and on that measure targets are optimistic almost everywhere.

Two things push the *true* hit rate below 21.6%. Delisted and renamed companies drop out of the match, and those are disproportionately the names a target missed — survivorship flatters the number. And a target briefly touched but not held to the twelve-month close is not counted, which cuts the other way but smaller. Net, 21.6% is a generous reading.

None of this is published by the houses about themselves. It only exists because someone kept the targets and the prices, side by side, long enough to score them.
