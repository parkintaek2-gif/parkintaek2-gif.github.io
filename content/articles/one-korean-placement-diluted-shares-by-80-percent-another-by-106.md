---
title: "One Korean private placement diluted shares by 80 percent. Another, by 106 percent."
dek: "NC& and Satoshi Holdings each filed third-party share placements this month. NC&'s new shares equal 79.7% of its prior count; Satoshi's new shares exceed its prior count outright, at 105.9%."
category: equities
pubDate: 2026-09-20
dataAsOf: 2026-09-18T00:00:00+09:00
author: Newsroom
tags: ["dart", "rights-issue", "dilution", "third-party-placement", "korea"]
tickers: []
sources:
  - org: "Financial Services Commission (Republic of Korea) / DART"
    api: "Paid-in Capital Increase Decision (piicDecsn) — filing detail by company and date"
    url: "https://opendart.fss.or.kr/api/piicDecsn.json"
  - org: "SeoulMarkets"
    api: "Daily breaking-disclosure scan, weighted by report-type (collect-dart-breaking.mjs), cross-checked against the structured capital-increase API"
    url: "https://seoulmarkets.com"
crossChecks:
  - "NC& Co.: new shares 4,000,000 against a pre-issuance total of 5,016,703 (79.7%), raising 10,000,000,000 won stated for operating capital, via third-party allotment. Original filing 16 September, corrected 18 September; figures are from the corrected filing."
  - "Satoshi Holdings Co.: new shares 5,509,745 against a pre-issuance total of 5,204,642 (105.9%) — the new share count exceeds the prior total — raising roughly 2.7bn won for operating capital and 11.7bn won for debt repayment, via third-party allotment. Original filing 16 September, corrected 18 September; figures are from the corrected filing."
  - "Satoshi Holdings also filed a market-notice disclosure on 17 September flagging a market-capitalization shortfall (below the 20bn-won administrative-issue threshold) — a separate, verified filing from the same week."
excluded:
  - "A third company we checked, Woosung Materials, filed five separate corrections to its own capital-increase decision across 10-18 September — too many revisions in too short a window for us to identify which figures are final, so we excluded it rather than report a number that might already be superseded"
  - "Share price or market reaction to either placement — we are reporting share-count dilution as filed, not a price effect we have not measured"
  - "Whether either placement will be completed as filed, or whether the market-cap flag on Satoshi Holdings will result in an actual administrative-issue designation — both are forward outcomes, not filed facts"
draft: false
---

Two Korean-listed companies each filed a third-party share placement this month with strikingly
different dilution. NC& Co. is issuing new shares equal to 79.7 percent of its prior total.
Satoshi Holdings Co. is issuing new shares that exceed its prior total outright — 105.9 percent
of what existed before the filing.

## Two placements, side by side

| | New shares | Shares before | Dilution |
|---|---:|---:|---:|
| NC& Co. | 4,000,000 | 5,016,703 | **79.7%** |
| Satoshi Holdings | 5,509,745 | 5,204,642 | **105.9%** |

Both are structured as third-party allotments (제3자배정증자), meaning the new shares go to
specific investors rather than existing shareholders or the open market. NC& states its raised
capital — 10 billion won — is for operating funds. Satoshi Holdings splits its raise between
roughly 2.7 billion won for operating funds and 11.7 billion won for debt repayment.

## A separate flag on one of the two names

Independent of the placement, Satoshi Holdings filed a market notice on 17 September disclosing
that its market capitalization had fallen below the 20-billion-won threshold that can trigger an
administrative-issue designation. We are reporting this because it is a separate, dated filing
from the same week, not because we are drawing a conclusion about the placement's purpose.

## Why we dropped a third company we checked

We also pulled capital-increase data for Woosung Materials, which filed a rights issue in the
same period. Its own filing history shows five separate corrections to that decision between
10 and 18 September — enough revision traffic that we could not confirm which figures were
final at the time we checked. Rather than publish a number that might already be superseded, we
excluded it.

## What this figure cannot tell you

A filed share count is not a completed transaction — placements can be adjusted or withdrawn
before closing. We are not saying whether either raise is good or bad for the company, and we
have not measured any price reaction to either filing.

## Method

We match DART's daily filing-list scan against the report type "paid-in capital increase
decision" and pull the structured detail record for each match via DART's own piicDecsn API,
using the most recently corrected filing where a correction exists. Company English names are
taken from DART's own company-registry API. Not investment advice.
