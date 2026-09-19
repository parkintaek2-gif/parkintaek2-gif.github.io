---
title: "Three Korean companies announced buybacks on the same day. Only one will retire the shares."
dek: "Exem, Shinhung, and Handsome Corporation filed buybacks on September 18. Handsome's plan is 7-10x larger and the only one that also commits to cancelling the shares."
category: equities
pubDate: 2026-09-20
dataAsOf: 2026-09-18T00:00:00+09:00
author: Newsroom
tags: ["dart", "buyback", "treasury-stock", "share-cancellation", "korea"]
tickers: []
sources:
  - org: "Financial Services Commission (Republic of Korea) / DART"
    api: "Treasury Stock Acquisition Decision (tsstkAqDecsn) — filing detail by company and date"
    url: "https://opendart.fss.or.kr/api/tsstkAqDecsn.json"
  - org: "SeoulMarkets"
    api: "Daily breaking-disclosure scan, weighted by report-type (collect-dart-breaking.mjs), cross-checked against the structured buyback-decision API"
    url: "https://seoulmarkets.com"
crossChecks:
  - "All three filings carry an acquisition-decision date (aq_dd) of 18 September 2026, pulled from DART's structured buyback-decision API, not just the filing-list scan"
  - "Planned acquisition value: Exem ₩1.0bn (999,999,481 won), Shinhung ₩1.405bn, Handsome Corporation ₩10.0bn (10,000,006,030 won) — Handsome Corporation's plan is about 7.1x Shinhung's and 10.0x Exem's"
  - "Only Handsome Corporation's stated purpose field includes cancellation (소각) alongside shareholder-value language; Exem's and Shinhung's purpose fields name shareholder value or price stabilization without mentioning cancellation"
excluded:
  - "Whether Exem or Shinhung will cancel these shares later — DART's purpose field is what the company filed for this specific decision, not a prediction of future action"
  - "Any comparison of the three companies' market capitalization or how large each buyback is relative to it — we are reporting the filed won-value and share count, not a market-cap ratio we have not computed"
  - "Investment guidance on any of the three names — a buyback filing is a disclosed corporate decision, not a signal we are endorsing"
draft: false
---

Three separately listed Korean companies — Exem, Shinhung, and Handsome Corporation (Hyundai Department
Store Group's fashion unit) — each filed a treasury-stock buyback decision with DART on the same
day, 18 September 2026. The three plans are not the same size, and only one of them commits to
permanently retiring the shares.

## The three filings, side by side

| Company | Planned value | Shares | Purpose states cancellation? |
|---|---:|---:|:-:|
| Exem | ₩1.0bn | 793,021 | No |
| Shinhung | ₩1.405bn | 100,000 | No |
| Handsome Corporation | ₩10.0bn | 629,327 | **Yes** |

Handsome Corporation's planned acquisition value is roughly 7.1 times Shinhung's and 10.0 times Exem's.
Its filing states the purpose as "shareholder value enhancement through treasury stock
acquisition and cancellation" — the only one of the three whose purpose field names
cancellation.

## Why the cancellation detail matters

A buyback alone moves shares out of public float and into a company's own treasury — it does
not, by itself, reduce the total share count. A company can hold treasury shares indefinitely
or reissue them later. Cancellation (소각) permanently retires the shares, which is a stronger
and less reversible commitment than acquisition on its own. Exem's stated purpose is "share
price stabilization and shareholder value enhancement"; Shinhung's is "share acquisition for
shareholder value enhancement" — neither mentions cancellation in the field DART requires
companies to state their purpose in.

## What this figure cannot tell you

We are reporting what each company filed for this specific decision, not what it will
ultimately do. A company that files without a cancellation clause today can announce
cancellation later, and a company that includes cancellation language does not guarantee timing
or that market conditions won't change the plan. Buyback execution windows here run from
19 September through 7 October (Exem), 21 September through 20 December (Shinhung), and
21 September through 22 October (Handsome Corporation).

## Method

We match DART's daily filing-list scan against the specific report type "Treasury Stock
Acquisition Decision" and pull the structured detail record for each match via DART's own
tsstkAqDecsn API, rather than relying on the filing title alone. Figures are as filed, not
independently recalculated. Not investment advice.
