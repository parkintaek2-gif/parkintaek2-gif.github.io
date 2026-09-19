---
title: "Korea registered 138 new fund codes in a day — half were equity funds, two were retirement target-date funds"
dek: "A single day's fund-code registrations show what asset managers are launching right now: 69 equity funds, 23 bond funds, 21 fund-of-funds, and only two target-date retirement funds."
category: funds
pubDate: 2026-09-19
dataAsOf: 2026-09-16T00:00:00+09:00
author: Newsroom
tags: ["funds", "tdf", "asset management", "korea", "fund registration"]
tickers: []
sources:
  - org: "Korea Financial Investment Association (KOFIA)"
    api: "Standard fund code assignment list"
    url: "https://freesis.kofia.or.kr"
  - org: "SeoulMarkets"
    api: "Daily fund-code registration scan (collect-fund-codes.mjs)"
    url: "https://seoulmarkets.com"
crossChecks:
  - "138 fund codes were assigned on September 16, 2026 with a code-issue date matching that day"
  - "Type classification (equity, bond, mixed-bond, fund-of-funds, real estate, derivatives, money-market) is KOFIA's own field on each registration record, not inferred by us from the fund name"
  - "Target-date-fund count (2) was found by matching \"TDF\" plus a four-digit target year in the fund's registered name, so any TDF launched under a name without that pattern would be missed"
excluded:
  - "Whether 138 is a typical day's registration count — we have not yet built a multi-day baseline for this series"
  - "Fund size, target investors, or expected assets under management — a registration record does not carry any of that"
  - "Investment merit of any named fund type — this is a count of registrations, not a recommendation"
draft: false
---

Korea's fund-code registry assigned 138 new standard fund codes on September 16, 2026. Sorted
by KOFIA's own type classification, 69 were equity funds, 23 were bond funds, 21 were
fund-of-funds, 20 were mixed-bond funds, and single-digit counts covered real estate,
derivatives, and short-term money-market funds. Two were target-date retirement funds (TDFs) —
one targeting 2050, one targeting 2060.

## What launched that day

| Fund type | Count |
|---|---:|
| Equity | 69 |
| Bond | 23 |
| Mixed-bond | 20 |
| Fund-of-funds | 21 |
| Real estate | 1 |
| Derivatives | 2 |
| Money-market | 2 |
| **Total** | **138** |

Every listed Korean fund is assigned a standard code by KOFIA before it can be sold, and the
registration record carries the fund's own type classification, its formal name, and the date
the code was issued. This is a snapshot of one day's launches, not a stock of funds currently
open for sale — a registration says a fund now exists as a legal vehicle, not that assets have
started flowing into it.

## What we are not claiming

We do not yet know whether 138 is a busy day or a quiet one for fund registration — this is the
first day of this series we have published, and we have not built a comparison baseline across
multiple days. Two TDF launches out of 138 total registrations is a real count from this one
day; whether that ratio holds on other days, or whether TDF launches cluster around particular
weeks of the year, is follow-up work we have not done yet.

## Method

We pull KOFIA's standard fund-code assignment list and filter to records with a code-issue date
matching the day in question, then group by the type field KOFIA itself assigns to each record.
Target-date-fund identification is by name pattern match, not by KOFIA type field, since TDFs are
not their own top-level type category in this data. Not investment advice.
