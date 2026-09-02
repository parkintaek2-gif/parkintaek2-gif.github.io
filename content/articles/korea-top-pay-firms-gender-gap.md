---
title: "Meritz Securities: top pay, 2.18x gender gap"
dek: "CEOScore reported nine Korean firms with H1 2026 average pay above ₩100m. We re-pulled the same DART filings and split them by gender — every one has a gap, from 1.31x to 2.18x."
category: macro
pubDate: 2026-09-02
dataAsOf: 2026-09-02T00:00:00+09:00
author: Newsroom
tags: ["pay", "gender gap", "dart", "korea", "debate"]
tickers: ["071050", "008560", "037620", "138040", "005940", "000660"]
sources:
  - org: "CEOScore (기업데이터연구소), reported 2 September 2026"
    url: "https://www.etoday.co.kr/news/view/2620737"
    api: "Third-party ranking cited as the starting point — ten Korean firms with H1 2026 average employee pay above ₩100 million, compiled from companies' own half-year filings"
  - org: "DART (Financial Supervisory Service) — half-year report employee-status disclosure (empSttus)"
    api: "We independently re-pulled the same disclosure (bsns_year=2026, reprt_code=11012) for each named company using our own collector (scripts/collect-tenure.mjs), which already computes headcount-weighted, gender-split averages"
crossChecks:
  - "We reproduced 9 of the 10 CEOScore-reported figures directly from DART within about 1%: e.g. Korea Investment Holdings ₩184.0m (CEOScore) vs ₩183.9m (our pull); SK hynix ₩144.0m vs ₩144.1m. Mirae Asset Securities' filing did not return under this query and is excluded, not estimated"
  - "Splitting the same disclosure by gender, all 9 reproduced firms show a pay gap: Meritz Securities 2.18x (men ₩203.5m vs women ₩93.3m, 1,152 men/558 women), Yuanta Securities 1.98x, Dunamu 1.81x, Korea Investment Holdings 1.63x, Hana Securities 1.54x, Korea Investment & Securities 1.39x, SK hynix 1.33x, NH Investment & Securities 1.31x"
  - "One exception in direction: Meritz Financial Group shows women earning more (0.85x, i.e. men lower) — but on only 28 men and 9 women, a small enough headcount that one senior hire or departure moves the average sharply"
excluded:
  - "Mirae Asset Securities — the same DART query returned no record for its 2026 half-year filing under this report code; not included as zero or estimated"
  - "The other roughly ten companies in CEOScore's full 20-firm list beyond the ten named in press coverage, which we did not have individual names for to re-pull"
  - "Any claim that the gap is caused by discrimination rather than role, tenure, or seniority mix — DART's disclosure gives company-wide averages by gender, not job-matched pay, so this cannot separate those causes"
  - "Any view on whether these nine companies pay fairly — this reports what they disclosed, split by a dimension the original coverage didn't show, and is not investment advice"
image: /charts/top-pay-gender-gap.svg
draft: false
---

On 2 September, CEOScore reported that ten of Korea's large companies posted H1 2026 average employee pay above ₩100 million — Korea Investment Holdings topped the list at ₩184.0 million. We went to the same source, the companies' own DART half-year filings, and asked one question the ranking didn't answer: **average pay for whom?**

## The same filings, split by gender

![Bar chart comparing men's and women's average pay at nine Korean companies reported to have H1 2026 average employee pay above 100 million won. Every company's bar for men is longer than its bar for women.](/charts/top-pay-gender-gap.svg)

| Company | Men | Women | Gap | Headcount (M/F) |
| --- | ---: | ---: | ---: | ---: |
| Meritz Securities | ₩203.5m | ₩93.3m | **2.18x** | 1,152 / 558 |
| Yuanta Securities Korea | ₩184.7m | ₩93.2m | 1.98x | 1,098 / 706 |
| Dunamu | ₩163.1m | ₩89.9m | 1.81x | 516 / 241 |
| Korea Investment Holdings | ₩199.0m | ₩122.0m | 1.63x | 90 / 22 |
| Hana Securities | ₩145.6m | ₩94.6m | 1.54x | 1,022 / 791 |
| Korea Investment & Securities | ₩186.0m | ₩134.0m | 1.39x | 1,491 / 1,307 |
| SK hynix | ₩157.0m | ₩118.0m | 1.33x | 24,238 / 11,912 |
| NH Investment & Securities | ₩137.0m | ₩104.9m | 1.31x | 1,777 / 1,385 |
| Meritz Financial Group* | ₩125.0m | ₩147.0m | 0.85x | 28 / 9 |

*Small headcount — see note below. Source: DART half-year filings (empSttus), 2026, re-pulled by SeoulMarkets.*

## We checked our own numbers before printing them

Before splitting anything by gender, we confirmed our pull matched the reported ranking: our recomputed company-wide averages landed within roughly 1% of CEOScore's nine reproducible figures (Mirae Asset Securities' filing did not return under our query, so it's left out rather than guessed). That match is the point of doing this at all — a public ranking is only as useful as the primary filing behind it, and here the primary filing is open to anyone with a DART API key.

## What the headline number was hiding

Every one of the nine companies with a large-enough sample shows the same shape: men's average pay is higher than women's, by a factor of 1.31 at the smallest gap (NH Investment & Securities) to 2.18 at the largest (Meritz Securities). A "₩100 million average" headline, read without this split, reads as if it describes a typical employee. At Meritz Securities, ₩203.5 million is closer to describing a typical **man**; the average woman there earned ₩93.3 million — under half.

The one company that runs the other way, Meritz Financial Group, is worth reading carefully rather than as a counter-example: 28 men and 9 women is small enough that a handful of senior hires or departures can flip the average in either direction in a single half-year. We show it because we don't drop inconvenient rows, not because it carries the same weight as SK hynix's 24,238-to-11,912 comparison.

## What this can't tell you

A company-wide gender average mixes everyone — a new graduate hire and a 20-year managing director, both counted the same way. It cannot say whether the gap comes from fewer women in senior, higher-paid roles, from tenure differences, or from something else — DART's disclosure doesn't break pay down by role or seniority, only by gender and by employment type. What it can say, precisely, is what these nine companies' own half-year filings report: a gap exists, at every reproducible one of them, and none of it appeared in the ranking that made headlines this week.

This is not investment advice, and it is not a claim about intent at any of these nine companies — it reports a dimension of a public disclosure that the original coverage did not include.

## The debate

Should a "highest average pay" ranking be required to report the gender split alongside the headline number — or does a company-wide average serve its purpose (comparing employers, not individuals) without it? **What do you think?** This is a talking point, not a verdict — argue it out below.
