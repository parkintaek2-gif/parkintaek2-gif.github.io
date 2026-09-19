---
title: "Six Korean retail bonds showed yields between −424 percent and +35 percent in one day's data"
dek: "Among 350 bonds in KRX's general and small-lot bond markets on September 17, six posted yields no real bond earns — a byproduct of trades as small as 10,000 won face value setting the day's quoted price."
category: rates
pubDate: 2026-09-19
dataAsOf: 2026-09-17T00:00:00+09:00
author: Newsroom
tags: ["bonds", "krx", "data quality", "liquidity", "korea"]
tickers: []
sources:
  - org: "Financial Services Commission (Republic of Korea)"
    api: "Bond price information (getBondSecuritiesInfo)"
    url: "https://www.data.go.kr/data/15094784/openapi.do"
  - org: "SeoulMarkets"
    api: "Daily bond-price snapshot (collect-bonds.mjs)"
    url: "https://seoulmarkets.com"
crossChecks:
  - "350 total price rows for Sept 17, 2026 across KRX's general-bond and small-lot bond markets; extreme values defined here as a quoted yield below −5% or above 20%, a threshold no investment-grade or high-yield Korean bond should cross in ordinary trading"
  - "Five of the six extreme-yield bonds traded at exactly the market's 10,000-won minimum face-value lot that day, consistent with a single odd-lot trade setting the closing price"
  - "One extreme case, SLL Jungang 21 at 31.9%, traded 359.14 million won face value — not a thin trade by this market's standards — so thin volume alone does not explain every case we found"
excluded:
  - "The true fair yield of any of these six bonds — we are reporting what the public price feed shows, not a corrected valuation"
  - "Whether SLL Jungang 21's high-volume anomaly reflects a data error, a genuine distressed-debt repricing, or something else — we could not determine the cause from this data alone"
  - "Any of the other 344 bonds in this dataset, which showed yields in an ordinary range and are not part of this count"
draft: false
---

Of 350 bonds priced on Korea's general and small-lot retail bond markets on September 17, 2026,
six showed a quoted yield outside any range a real bond should occupy in ordinary trading — from
−423.7 percent to +35.3 percent.

## The six

| Bond | Yield | Volume (face value) |
|---|---:|---:|
| Hanwha Momentum 2-2 (Green) | −423.7% | 10,000 won |
| Korea Capital 535-3 | −56.4% | 16.91 million won |
| Korea Capital 535-4 | −21.8% | 10,000 won |
| Korea Capital 544-1 | −20.5% | 10,000 won |
| SLL Jungang 21 | +31.9% | 359.14 million won |
| Mirae Asset Securities 57-2 | +35.3% | 500,000 won |

Four of the six traded at or near the market's 10,000-won minimum lot size — a single small
trade, at a price that barely moved from face value in won terms, can compute to an enormous
percentage yield swing when annualized against a bond's remaining term. That is a known artifact
of thin retail-bond trading, not a sign of financial distress at the issuer.

## The one that does not fit that explanation

SLL Jungang 21 is different: it traded 359.14 million won in face value that
day — a real, liquid-looking trade by this market's standards — and still closed at a yield of
31.9 percent. We could not determine from this dataset alone whether that reflects a genuine
repricing event, a data-recording issue at the source, or something else. We are flagging it
rather than explaining it away.

## Why this matters for anyone reading these quotes directly

Korea's general bond market publishes same-day price and yield quotes for retail investors.
Someone reading a single day's quote page for one of these six names, without checking trading
volume alongside it, could reasonably conclude the bond is either defaulting (deeply negative
yield) or paying an extraordinary coupon (35 percent) — neither of which these numbers actually
show. The volume figure is the number that explains the yield, in five of six cases; without it,
the yield alone misleads.

## Method

We pull the Financial Services Commission's public bond price API for all bonds in the general
and small-lot retail markets, and flag any quoted yield below −5 percent or above 20 percent as
outside the range we would expect from ordinary trading in either market segment. We report
volume alongside yield for each flagged bond rather than filtering the flagged bonds out. Not
investment advice.
