---
title: "Korean business segment reporting, by company size: the biggest disclose eight, the smallest disclose one"
dek: "Half of 737 Korean listed companies report a single business segment. Among companies above $10bn in market value only 23% do — and their median is eight. Segment disclosure is not in the accounts tape; it is in the annual report text."
category: equities
pubDate: 2026-09-29
dataAsOf: 2026-09-28T00:00:00+09:00
author: Newsroom
tags: ["segment reporting", "ifrs 8", "dart", "korea", "annual report", "disclosure"]
tickers: ["055550", "105560", "000880", "003540", "002020"]
sources:
  - org: "DART (Financial Supervisory Service electronic disclosure)"
    api: "Annual report source documents (document.xml), 2025 filings — segment wording is read from the report text, not from the standardised accounts API"
    url: "https://opendart.fss.or.kr/"
  - org: "Korea Exchange (KRX)"
    api: "Daily quotations — market capitalisation used only to place each company in a size band"
    url: "https://data.krx.co.kr"
  - org: "SeoulMarkets"
    api: "collect-dart-segments.mjs (784 companies fetched) and build-segments-data.mjs (737 counted)"
    url: "https://seoulmarkets.com/data/segment-reporting"
crossChecks:
  - "737 companies counted out of 784 fetched. The 47 difference is reported, not dropped silently: 29 annual-report source documents could not be retrieved, and in 18 more the report said segments exist but no segment name could be extracted."
  - "Size bands use KRX market capitalisation on the same date for every company; no company is missing a market value in the counted set."
  - "Band medians: Mega 8 segments, Large 2, Mid 1, Small 1. Share reporting a single segment: Mega 23%, Large 48%, Mid 53%, Small 53%."
excluded:
  - "We do not publish a segment count above 40. Forty is our own ceiling, and five companies hit it — Shinhan Financial Group, Hanwha and Kolon are shown as 40+ because our reader stopped, not because the company reports exactly forty."
  - "A count of segment expressions in an annual report is not the same as the number of IFRS 8 reportable segments. Some companies name product lines, divisions and subsidiaries in the same passage. We count what the report says, and we say that is what we count."
  - "We have not compared this against Japan, the United States or any other market. We have no equivalent count for them yet, so we make no claim that Korean single-segment reporting is high or low."
draft: false
---

Of 737 Korean listed companies whose 2025 annual reports we could read, 365 — almost exactly
half — describe themselves as having a single business segment. That share is not the same
across the market. It falls steadily as companies get larger, and among the largest it is less
than a quarter.

## Half the market reports one segment. The biggest quarter of it does not.

| Size band | Companies | Report a single segment | Median segments |
|---|---:|---:|---:|
| Mega ($10bn+) | 53 | 23% | 8 |
| Large ($1–10bn) | 193 | 48% | 2 |
| Mid ($300m–1bn) | 259 | 53% | 1 |
| Small (under $300m) | 232 | 53% | 1 |
| **All counted** | **737** | **50%** | **1** |

The gradient is the finding. A $10bn Korean company typically breaks itself into eight parts
in its annual report; a $300m one typically does not break itself up at all. Between the Mid
and Small bands the share is flat at 53% — the difference is concentrated at the top, not
spread evenly through the market.

## Where this data actually lives

Segment information is not in the standardised accounts feed. We checked: DART's
`fnlttSinglAcntAll` endpoint returns 229 account lines per company, and none of them is a
segment. Everything here comes from the annual report **source document** — the `document.xml`
inside each filing, which arrives as a 676KB archive and expands to roughly 6.3MB of text.

That matters for anyone trying to build this themselves. The accounts API is the obvious place
to look and it is the wrong place. The information exists only in prose, so it has to be read
out of prose.

## The companies that split themselves the most

| Company | Ticker | Segment expressions |
|---|---|---:|
| Shinhan Financial Group | 055550 | 40+ |
| Hanwha | 000880 | 40+ |
| Kolon | 002020 | 40+ |
| Daishin Securities | 003540 | 39 |
| KB Financial Group | 105560 | 38 |

Read the "40+" literally: it is our ceiling, not theirs. We stop counting at forty, and three
companies reached it. We would rather show you where our ruler ends than print a number that
looks precise and is not.

## What we are not claiming

A count of segment expressions in an annual report is not a count of IFRS 8 reportable
segments. Korean financial holding companies in particular name subsidiaries, divisions and
product lines in the same passage, which is why the top of that last table is financial groups.
A company appearing with 38 segment expressions has not told regulators it runs 38 reportable
segments; it has used the word that many times in ways our reader accepted.

We also could not read every company. Twenty-nine annual-report documents did not come back,
and in eighteen more the report stated that segments exist but we could not extract a name.
Those 47 are excluded from all figures above rather than counted as zero — a company we failed
to read is not a company with no segments.

## Method

We fetch the annual report source document for each listed company from DART, read segment
wording out of the report text, and count distinct segment names per company, capped at 40. We
exclude companies whose report explicitly says it reports as a single segment from the
name-extraction step and record them directly as one. Market capitalisation from KRX is used
only to assign a size band, never to compute a segment count. The full table, including every
company and its count, is published free at
[Korean companies' business segments](https://seoulmarkets.com/data/segment-reporting).

Company-by-company segment data for Korea, Japan and the Gulf is part of the SeoulMarkets
filings tape — see [Data for licence](https://seoulmarkets.com/data) for what is covered and
[Pricing](https://seoulmarkets.com/pricing) for terms. Not investment advice.
