---
title: "Korean equity funds: the fee eats most of what the manager adds"
dek: "Ranked by three-year return, the best performers are not the most expensive ones. Across the group, higher fees show almost no relationship to higher returns."
category: funds
pubDate: 2026-07-26
dataAsOf: 2026-06-30T00:00:00+09:00
author: Funds Desk
tags: ["sample", "funds", "fees", "asset managers"]
sources:
  - org: "Korea Financial Investment Association"
    api: "Fund disclosure (monthly performance filing)"
    url: "https://dis.kofia.or.kr"
  - org: "Financial Services Commission (Republic of Korea)"
    api: "Fund Product Basic Information Open API"
    url: "https://www.data.go.kr/data/15094792/openapi.do"
crossChecks:
  - "Fund identifiers matched against the FSC fund product dataset before comparison"
  - "Only funds with a full three-year record under the same manager were ranked"
excluded:
  - "Funds below the KRW 5bn disclosure threshold — not covered by the monthly filing"
  - "Funds whose manager changed inside the ranking window, to avoid crediting the wrong person"
draft: false
---

> **This is a layout sample.** The figures below are illustrative and were written to test
> rendering, not reported from a live data pull. Delete this file before the site goes public.

Fund fees in Korea are disclosed, standardised and published monthly. Almost nobody reads them next to the returns.

## What the data shows

Ranking domestic equity funds by return, the ordering changes substantially depending on the period you pick — which is the first thing worth noticing. A fund that leads over one month is rarely the one that leads over three years.

```fundchart
{
  "title": "The leaderboard changes with the period",
  "sub": "Total return by holding period, per cent",
  "source": "Illustrative figures for layout testing. In a live article: Korea Financial Investment Association monthly fund performance disclosure, as of 30 Jun 2026. Only funds with a complete record under one manager are ranked. Not investment advice.",
  "periods": ["1M", "3M", "6M", "1Y", "3Y"],
  "default": "1Y",
  "funds": [
    { "name": "Core Korea Value", "house": "Hanul Asset Mgmt", "returns": {"1M": 2.4, "3M": 5.1, "6M": 9.8, "1Y": 18.2, "3Y": 41.6} },
    { "name": "Blue Chip Growth", "house": "Daehan Investment", "returns": {"1M": 3.1, "3M": 6.8, "6M": 11.2, "1Y": 15.7, "3Y": 28.3} },
    { "name": "Dividend Focus", "house": "Hanul Asset Mgmt", "returns": {"1M": 1.2, "3M": 2.9, "6M": 6.4, "1Y": 12.9, "3Y": 33.1} },
    { "name": "Semiconductor Leaders", "house": "Jeil Asset Mgmt", "returns": {"1M": 5.6, "3M": 9.2, "6M": 14.1, "1Y": 11.4, "3Y": 19.7} },
    { "name": "Small Cap Discovery", "house": "Namsan Asset Mgmt", "returns": {"1M": -1.8, "3M": -3.2, "6M": 1.1, "1Y": 4.2, "3Y": 22.8} },
    { "name": "ESG Korea", "house": "Daehan Investment", "returns": {"1M": 0.4, "3M": 1.1, "6M": 2.8, "1Y": -2.6, "3Y": 8.4} },
    { "name": "Total Return Balanced", "house": "Jeil Asset Mgmt", "returns": {"1M": -0.6, "3M": 0.8, "6M": 3.2, "1Y": -5.1, "3Y": 3.9} }
  ]
}
```

Switch the period and the ordering reshuffles. The two funds that look strongest over one month sit mid-table over three years; the fund that looks worst over one month is comfortably positive over three.

## The mechanism

Fees in Korea are quoted as a total expense ratio and deducted continuously from net asset value, so they compound against the investor rather than arriving as a bill. Over one month a difference of half a percentage point in fees is invisible next to market noise. Over three years it is not.

That is why the period selector above matters more than it looks. A fund family that markets on one-year numbers is, structurally, marketing on the horizon where fees are hardest to see.

## Where this breaks

Ranking by raw return rewards risk-taking, not skill. A fund that concentrated in semiconductors and got the cycle right will top a three-year table without its manager having done anything repeatable. Adjusting for volatility would change the ordering, and we have not done that here.

Survivorship is the second problem. Funds that closed or merged during the window are not in the disclosure, and they are disproportionately the bad ones. Every ranking of surviving funds flatters the industry.

Third, we excluded funds whose manager changed inside the window. That is the honest choice — crediting a three-year record to someone who arrived last year would be wrong — but it also removes exactly the funds where manager turnover is the story.

## The evidence

Returns and fees come from the Korea Financial Investment Association's monthly fund performance disclosure, which covers public funds above the KRW 5bn threshold and is filed in the first week of each month for the prior month-end. Fund identifiers were matched against the Financial Services Commission fund dataset before any comparison.

The disclosure also carries the assigned manager for each fund. That field is what makes manager-level analysis possible at all, and it is the basis for the exclusion described above.

## The verdict

Fees are the one variable in this table that is known in advance and does not depend on the market cooperating. Returns are not.

That is an observation about how the fee structure interacts with the disclosure calendar, not a recommendation of any fund or manager.
