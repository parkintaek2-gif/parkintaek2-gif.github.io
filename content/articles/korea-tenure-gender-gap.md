---
title: "In 76 percent of Korea's large listed companies, men stay longer than women"
dek: "Companies file average tenure by gender in their own annual reports. Across 1,837 listed firms employing 1.83 million people, the weighted gap is 2.11 years — and it is widest in the industries Korea exports."
category: equities
pubDate: 2026-08-04
updatedDate: 2026-08-05
dataAsOf: 2026-08-04T09:00:00+09:00
author: Newsroom
tags: ["human capital", "corporate disclosure", "labour", "gender gap"]
tickers: []
sources:
  - org: "Financial Supervisory Service (Korea)"
    api: "DART Open API — empSttus (Employee Status, annual report item)"
    url: "https://opendart.fss.or.kr"
  - org: "Financial Supervisory Service (Korea)"
    api: "DART Open API — company (industry code, incorporation date)"
    url: "https://opendart.fss.or.kr"
crossChecks:
  - "Tenure by gender is a statutory disclosure item filed by the company itself in its annual report, not an outside estimate"
  - "All 3,925 listed entities in DART's corporate registry were queried; 2,921 had filed a 2025 employee-status table"
  - "60 companies were excluded because a filed figure falls outside any plausible range — a tenure above 35 years or an average salary above 1bn won or below 10m won. These are unit-entry errors by the filer, not outliers. They were removed, not corrected"
  - "Only firms with at least 100 employees are counted: at 3 employees an average tenure of 20 years describes two founders, not a retention record"
  - "The headline 2.11-year figure is weighted by headcount. The unweighted company average is 1.57 years and the median 1.1 years — all three are reported so the choice of weighting cannot flatter the result"
excluded:
  - "Why the gap exists — this article reports the filed numbers and does not attribute cause"
  - "Pay. Average pay is filed in the same table and will be treated separately; mixing tenure and pay in one comparison obscures both"
  - "Unlisted companies, which file no such table, and listed firms below 100 employees"
  - "Part-time and contract composition, which the disclosure does not break out by gender"
corrections:
  - date: 2026-08-05
    note: >-
      Headcount for companies that file their employee table split by business
      division was understating the total: only the first division was counted.
      986 of 2,921 companies were affected, Samsung Electronics among them
      (50,817 counted against 128,881 filed). Every figure in this article was
      recomputed. The share of companies where men have the longer tenure moved
      from 78.0 to 76.0 percent, the headcount-weighted gap from 2.32 to 2.11
      years, and the sample from 1,066 companies to 1,837 — the earlier sample
      was also limited by a tenure-parsing bug, since fixed, that discarded
      tenure filed as Korean free text. Direction and ranking are unchanged.
draft: false
---

Korean companies are required to state, in their annual report, how long their employees have worked there — separately for men and women. It is a small table near the back of a long filing. Almost nobody reads it.

Read all of them at once and a pattern appears that is hard to look away from.

Of 1,837 listed companies with at least 100 employees that filed both figures for 2025, **1,397 report that men have worked there longer than women.** That is 76.0 percent. Women have the longer average tenure at 416 companies, and the two are equal at 24.

Weighted by headcount — that is, counted across the 1,828,238 employees these firms actually employ — the gap is **2.11 years**. The unweighted company average is 1.57 years. The median company reports 1.1 years.

## The gap is widest where Korea builds things

Grouped by industry, the spread is not uniform. It is concentrated.

| Industry | Average gap | Companies |
| --- | ---: | ---: |
| Non-metallic minerals | +3.75 years | 25 |
| Other transport equipment | +3.36 years | 23 |
| Pulp and paper | +3.32 years | 22 |
| Building construction | +3.20 years | 37 |
| … | | |
| Financial services | +0.60 years | 55 |
| Insurance and pensions | +0.06 years | 14 |
| Research and development | −0.05 years | 19 |
| Financial support services | −0.55 years | 28 |

At the top of the list are heavy and process industries. At the bottom — where the gap effectively disappears — are finance and information services.

The individual extremes are wider still. Dongwon Mobility, with 532 employees, reports 20.0 years for men and 3.0 for women, a gap of 17.0 years. SJG Sejong, an auto-parts maker with 617 employees, reports 23.4 against 6.5. Hanon Systems, with 2,223 employees, reports 19.41 against 6.44.

## Where women stay longer, it is not a rounding error

The 416 companies where women have the longer tenure are not clustered at the margin. Seoyon E-Hwa reports 25.2 years for women against 13.8 for men — a gap of 11.4 years in the other direction, at a company with 1,068 employees. Korea Movenex reports 28.31 against 17.76. Asia Paper reports 22 against 14.

Three of the five largest reversals are in auto parts and pulp — the same industries that produce the largest gaps in the usual direction. Whatever is driving these numbers, it is not simply "manufacturing."

## What this number is, and what it is not

Average tenure is not a turnover rate. A company that has hired quickly will show a low average because it is full of new people, not because anyone left. A company that has not hired in a decade will show a high one. The two look identical in this column.

It is also a company-filed figure. Nobody audits the tenure table the way the financial statements are audited. Sixty companies filed a number that cannot be right — a tenure of 54 years at a firm whose staff average four and a half, an average salary entered in thousands of won rather than won. Those were removed from the count rather than corrected, because correcting them would mean guessing what the filer meant.

What the number is, is the company's own statement about itself, made under a disclosure requirement, in a document its directors sign. Read one at a time, each is unremarkable. Read 1,837 at once, and 76 percent of them say the same thing.
