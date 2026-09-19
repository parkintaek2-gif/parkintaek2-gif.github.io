---
title: "Ten Korean-listed companies filed delisting-risk disclosures on the same day"
dek: "DART recorded delisting-risk disclosures from ten separately listed companies on September 18 — zero on any other day this week. We could not confirm why they clustered on this date."
category: equities
pubDate: 2026-09-19
dataAsOf: 2026-09-18T00:00:00+09:00
author: Newsroom
tags: ["dart", "delisting", "disclosure", "korea", "kosdaq"]
tickers: []
sources:
  - org: "Financial Services Commission (Republic of Korea) / DART"
    api: "Corporate Disclosure Information Open API — filing list by date"
    url: "https://www.data.go.kr/data/15059649/openapi.do"
  - org: "SeoulMarkets"
    api: "Daily breaking-disclosure scan, weighted by report-type (collect-dart-breaking.mjs)"
    url: "https://seoulmarkets.com"
crossChecks:
  - "Counted by distinct company name after de-duplicating multiple filings from the same firm on the same day; ten companies, twelve raw filings"
  - "Checked the five prior business days (Sept 10, 11, 14, 15) for the same report-type tag: zero companies on each of those days"
  - "\"Delisting-risk\" here means the company itself filed a disclosure whose report title matches DART's delisting-risk-disclosure category — not that KRX has announced an actual delisting"
excluded:
  - "Why ten firms filed on the same calendar day — we checked for a shared regulatory deadline and found none we could confirm, so we report the count without a cause"
  - "Whether any of these ten will actually be delisted — a delisting-risk filing is a disclosure obligation, not an outcome"
  - "Any view on whether to hold or sell these names — this is not investment advice"
draft: false
---

Ten separately listed Korean companies filed a delisting-risk disclosure with DART on September 18, 2026. On each of the four prior business days we checked, the same count was zero.

The ten: Mgen Solution, Qaid, Zaigle, Omni Systems, Jarvis, K Bio Labs, Kyobo 16th SPAC,
East Aide, Jeil M&S, and Samyoung ENC.

## What we counted, and what we did not

| Date | Delisting-risk filings (distinct companies) |
|---|---:|
| Sept 10 | 0 |
| Sept 11 | 0 |
| Sept 14 | 0 |
| Sept 15 | 0 |
| **Sept 18** | **10** |

We scan DART's daily filing list and tag each report by its title text. "Delisting-risk disclosure"
is one of the report categories KRX requires when a listed company meets
specific trigger conditions — such as an auditor's opinion qualification, sustained capital
impairment, or another listing-rule breach. Filing the disclosure is a regulatory obligation
that follows from meeting a trigger; it is a warning flag, not a delisting decision.

We looked for a shared cause — a filing deadline, an index-rebalancing date, an audit-season
cutoff — that would explain why ten unrelated companies filed on the same day. We did not find
one we could confirm, so we are not naming one. It may be coincidence, a shared regulatory
deadline we have not identified, or something else; we report the count, not a theory.

## What this figure cannot tell you

A delisting-risk filing does not mean KRX has moved to delist the company, does not tell you
how likely an eventual delisting is, and does not distinguish a first-time trigger from a
company already working through an improvement period. Some companies file this disclosure
repeatedly over months or years without ever being delisted. We hold the filing count, not the
outcome.

## Method

We pull DART's daily filing list via the public Corporate Disclosure Information API and match
each report title against a fixed set of category patterns, including delisting-risk disclosure.
Multiple filings from the same company on the same day are counted once. The five-day comparison
window is the most recent business days for which we hold a complete daily scan. Not investment
advice.
