---
title: "Zero Korean companies changed CEO or owner for 17 straight trading days. Then seven did, in one."
dek: "DART recorded zero CEO-change and control-change disclosures on 17 straight scanned days. On September 18, three companies replaced their CEO and four filed ownership-change corrections."
category: equities
pubDate: 2026-09-20
dataAsOf: 2026-09-18T00:00:00+09:00
author: Newsroom
tags: ["dart", "governance", "ceo-change", "ownership-change", "disclosure", "korea"]
tickers: []
sources:
  - org: "Financial Services Commission (Republic of Korea) / DART"
    api: "Corporate Disclosure Information Open API — filing list by date, tagged for CEO-change and control-change report types"
    url: "https://www.data.go.kr/data/15059649/openapi.do"
  - org: "SeoulMarkets"
    api: "Daily breaking-disclosure scan, weighted by report-type (collect-dart-breaking.mjs)"
    url: "https://seoulmarkets.com"
crossChecks:
  - "Counted by distinct company name (not by raw filing count) across every archived scan day from 25 August through 19 September 2026: 17 days at zero for both tags, one day (18 September) at 3 CEO-change and 4 control-change companies, and 19 September back to zero for both"
  - "All three CEO-change filings on 18 September (Memraybity, Kolon TissueGene, BK Holdings) are original filings, not corrections"
  - "All four control-change filings on 18 September (Bect, Jungang Advanced Materials, Unitron Tech, Refine) are marked by DART as corrections to a previously filed disclosure, not a first-time filing. We did not trace each one back to its original filing date."
excluded:
  - "The original filing date behind each of the four control-change corrections — DART's report title marks a filing as a correction, but our daily scan does not carry a link back to the specific original report it corrects"
  - "Whether the three CEO changes and four ownership-change corrections share a common cause, such as a filing-season pattern — we checked for one and found none we could confirm"
  - "Any view on these seven companies as investments — a governance-event disclosure is not a valuation call"
draft: false
---

We tag every DART disclosure that reports a change of CEO or a change of controlling
shareholder — the two moments a company's people actually move a valuation, as opposed to
its day-to-day roster. Across the 17 business days we have a complete scan for, from 25 August
through 15 September 2026, that count sat at zero for both tags, every single day.

On 18 September, it was seven companies in one day: three CEO changes and four
control-change filings. On 19 September, it was back to zero.

## Zero for 17 days, then a cluster

| Date range | CEO-change (companies) | Control-change (companies) |
|---|---:|---:|
| 25 Aug – 15 Sep (17 scanned days) | 0 every day | 0 every day |
| **18 Sep** | **3** | **4** |
| 19 Sep | 0 | 0 |

The three CEO changes were original filings: Memraybity, Kolon TissueGene, and BK Holdings
each disclosed a new representative director on 18 September. We found no shared parent
company, industry, or filer among the three.

## The four control-change filings need a caveat we can't resolve

The four control-change disclosures — Bect, Jungang Advanced Materials, Unitron Tech, and
Refine — are each marked by DART as a correction to an earlier filing, not a
first-time disclosure. That matters: a correction filed on 18 September could be amending a
change that was originally disclosed weeks earlier, which would make "18 September" the date
of a paperwork fix rather than the date four companies changed hands. Our daily scan tags each
filing by its own report title and date; it does not carry a pointer back to the specific
original filing each correction amends, so we cannot tell you when the underlying ownership
change was first disclosed.

What we can say without that caveat: the three CEO changes are original filings, dated
18 September, on a day that otherwise ran 17-for-17 at zero.

## What this figure cannot tell you

A CEO-change or control-change filing is a disclosure obligation, not a verdict on the company.
We are not saying whether any of these seven changes is good or bad for the business, and we
are not offering a theory for why three unrelated CEO changes landed on the same calendar day.
We looked for one and did not find it.

## Method

We scan DART's daily filing list and tag each report by matching its title against a fixed set
of category patterns, including CEO-change and control-change. Multiple filings from the same
company on the same day are counted once, by company. The 17-day comparison window is every
business day for which we hold a complete daily scan between 25 August and 19 September 2026 —
gaps in our own archiving (16-17 September) are excluded from the "zero" count rather than
assumed to be zero. Not investment advice.
