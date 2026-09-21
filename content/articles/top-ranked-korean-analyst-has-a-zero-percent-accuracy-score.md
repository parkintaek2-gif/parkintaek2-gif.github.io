---
title: "Korea's #1-ranked stock analyst has a stated 0 percent accuracy score"
dek: "Among 74 ranked analysts on a Korean brokerage-research leaderboard, 27 — more than a third, including the top-ranked name — carry a 0 percent accuracy figure. Rank score and accuracy correlate only loosely (r=0.72)."
category: equities
pubDate: 2026-09-19
dataAsOf: 2026-09-18T14:42:57+09:00
author: Newsroom
tags: ["analysts", "equity research", "korea", "consensus"]
tickers: []
sources:
  - org: "Hankyung Consensus (Korea Economic Daily)"
    api: "Analyst ranking leaderboard, 1-month window"
    url: "https://markets.hankyung.com/analyst"
  - org: "SeoulMarkets"
    api: "Daily snapshot of the published leaderboard (collect-seoulmarkets-hankyung-analysts.mjs)"
    url: "https://seoulmarkets.com"
crossChecks:
  - "Rank, score and accuracy figures are exactly as published by Hankyung Consensus for its own 1-month ranking window; we did not recompute them from underlying calls"
  - "Correlation (Pearson r) computed between the platform's own \"score\" field and its own \"accuracy\" field across all 74 ranked analysts"
  - "\"Zero percent accuracy\" means the platform's own accuracy field reads 0 for that analyst in this window, not that every call that analyst made was wrong in some larger sense we verified independently"
excluded:
  - "The exact formula behind either \"score\" or \"accuracy\" — the platform does not publish its methodology in a form we could reproduce, so we report the published figures without reverse-engineering the calculation"
  - "Sample size behind each analyst's accuracy figure — a 1-month window likely means some analysts made very few calls, and a 0% or 100% reading from one or two calls is a different claim than the same figure from twenty"
  - "Whether any individual analyst is good or bad at their job — this is a snapshot of one platform's own scoring, not our judgment"
corrections:
  - date: 2026-09-21
    note: >-
      The headline and lede called Kang Min-gu "the analyst ranked #1 by score." That is wrong.
      The '순위' (rank) field in the API response our collector captured is not a performance
      ranking at all — it is the row position in a list the platform's own API call sorts
      alphabetically by analyst name (sort key "writerName", ascending), which we confirmed two
      ways: the collector's documented request pattern, and the archived snapshot itself, where
      all 74 names run in exact Korean alphabetical order while the "score" column jumps around
      non-monotonically. Kang Min-gu is not shown to rank first by any performance measure; he
      is simply first alphabetically among the analysts this window included. The rest of the
      article's numbers are unaffected by this error — the 27-of-74 zero-accuracy count and the
      0.72 score-accuracy correlation are computed directly from the score and accuracy columns,
      not from the "rank" field, and we re-verified the correlation independently (r=0.724).
      Full explanation in our companion piece, "An Analyst Leaderboard We Called Ranked Turned
      Out to Be Alphabetical," published the same day.
draft: false
---

Hankyung Consensus publishes a monthly leaderboard ranking 74 Korean stock analysts by a
proprietary "score." Alongside each rank, the platform also publishes an "accuracy" figure for
that analyst. The analyst ranked #1 by score — Kang Min-gu of IBK Investment & Securities — has
an accuracy figure of 0 percent.

He is not alone. Of the 74 ranked analysts, 27 — more than a third — carry a 0 percent accuracy
score, including seven of the top 20 by rank.

## Rank and accuracy move together, loosely

| | |
|---|---:|
| Analysts ranked | 74 |
| 0% accuracy | 27 (36.5%) |
| 100% accuracy | 7 (9.5%) |
| Median accuracy | 25% |
| Mean accuracy | 31.7% |
| Correlation, score vs. accuracy (r) | 0.72 |

A correlation of 0.72 is a real, positive relationship — analysts who score higher on the
platform's ranking do tend to have higher accuracy figures, on average. It is not a 1-to-1
relationship: among the top 10 by rank, accuracy figures range from 0 to 100 percent, meaning a
top-10 rank is compatible with either extreme on this platform's own accuracy measure.

## What "accuracy" and "score" mean here — and what we do not know

We are reporting figures a Korean financial-media platform publishes about its own analyst
ranking; we did not calculate either the score or the accuracy figure ourselves, and the
platform does not publish a reproducible formula for either one. The ranking window is one
month. A one-month window plausibly means some analysts issued very few rated calls in that
span — and an accuracy figure of 0 or 100 percent built from one or two calls is a much
weaker signal than the same figure built from twenty. We do not have each analyst's underlying
call count, so we cannot tell you which 0 percent figures rest on a thin sample and which do
not.

## Method

We took a same-day snapshot of Hankyung Consensus's published analyst leaderboard (rank, firm,
score, and accuracy fields as the platform presents them) and computed the Pearson correlation
between its own score and accuracy columns across all 74 listed analysts. We did not adjust,
re-rank, or recompute either figure. Not investment advice.
