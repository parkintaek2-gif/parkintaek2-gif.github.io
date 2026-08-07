---
title: "How long each Korean industry keeps the people it hires, from 16 years down to under four"
dek: "Listed companies file their workers' average tenure in their own annual reports. Weight it by headcount and rank Korea's 44 biggest industries: carmakers hold people 16 years, research firms under four."
category: equities
pubDate: 2026-08-08
dataAsOf: 2026-08-06T09:00:00+09:00
author: Newsroom
tags: ["human capital", "corporate disclosure", "labour", "tenure", "industry"]
tickers: []
sources:
  - org: "Financial Supervisory Service (Korea)"
    api: "DART Open API — empSttus (Employee Status, annual report item)"
    url: "https://opendart.fss.or.kr"
  - org: "Financial Supervisory Service (Korea)"
    api: "DART Open API — company (industry code)"
    url: "https://opendart.fss.or.kr"
crossChecks:
  - "Average tenure is a statutory disclosure item — 근속연수 — that each company files itself in its annual report, in free text such as '15년 8월', which we parse to decimal years. It is the company's own figure, not an outside estimate"
  - "Each company's tenure is weighted by its headcount and rolled up to its KSIC industry, so a 40,000-person carmaker and a 200-person parts shop each count for their own people, not one company one vote"
  - "An industry is ranked only where it employs at least 3,000 of these workers across at least 5 listed companies — 44 industries clear that bar, covering 1.83 million people — so no rung rests on a single firm"
  - "Where a company files tenure split by sex, the two are combined back to a headcount-weighted whole before the industry roll-up"
excluded:
  - "Industries with fewer than five listed filers or fewer than 3,000 covered workers. Their average would swing on one company and could not be told apart from that company's own history"
  - "Any reading of tenure as loyalty or as churn on its own. A low average can mean a revolving door or simply a young industry whose firms have not existed long enough for long tenures — the two look identical here, and where it matters we say which"
  - "Unlisted companies. This is the tenure of Korea's listed employers, which skew larger, older and better-paid than the whole economy"
draft: false
---

Every listed company in Korea files one number about its workers that reads like a confession: how long, on average, the people there have stayed. It sits in the annual report as 근속연수, average years of service, written by the company itself. Add it up across an industry — weighting each firm by how many people it employs — and you get a map of where Korea holds onto workers and where it hands them back.

## The ladder

For every listed company we took its filed average tenure and weighted it by headcount, then rolled it up by industry. The result is the average years a worker has been at their employer, by sector, across the 44 industries that employ at least 3,000 covered workers.

| | Industry | Firms | Workers | Avg tenure (yrs) |
| --- | --- | ---: | ---: | ---: |
| 1 | Motor vehicles | 113 | 174,307 | **16.0** |
| 2 | Electricity and gas | 13 | 32,083 | 15.4 |
| 3 | Telecommunications | 16 | 34,422 | 15.1 |
| 4 | Coke and refined petroleum | 5 | 5,913 | 15.1 |
| 5 | Beverages | 12 | 9,507 | 15.0 |
| 6 | Insurance and pensions | 14 | 37,939 | 14.5 |
| … | | | | |
| 40 | Motor vehicle trade | 8 | 3,113 | 5.9 |
| 41 | Publishing | 196 | 51,876 | 5.4 |
| 42 | Medical and optical instruments | 115 | 23,885 | 5.2 |
| 43 | Other scientific and technical services | 18 | 4,702 | 5.1 |
| 44 | Research and development | 77 | 5,908 | **3.8** |

The worker at the top of the ladder has been at their company **16.0 years**; the worker at the bottom, **3.8** — a gap of 4.2 times. Across all 1.83 million workers the headcount-weighted average is 11.3 years, a long number by any rich-country standard, and a reminder that this is the listed economy: the big, old, unionised employers, not the corner shop.

## What sits at the top

The top of the ladder is Korea's industrial spine. Carmakers, power and gas utilities, telecoms, refineries, the big insurers and banks — capital-heavy, decades-old, and in several cases unionised. These are places a worker joins young and does not leave, because the pay rises with years and the exit options rarely beat staying. Motor vehicles leads outright at 16 years across 113 filers and 174,000 people, which is not one flagship dragging an average: it is the shape of the whole sector.

## What sits at the bottom — and the trap in reading it

The bottom is more interesting, because it is where the number is easiest to misread.

Research and development sits dead last at 3.8 years. It would be wrong to call that a revolving door. The industry is thick with young, pre-revenue biotech and spun-out ventures — companies that have not *existed* for much longer than their average tenure, so their people could not have stayed longer even if none had ever left. A young industry's low tenure is firm age as much as churn, and the data cannot separate the two. The same caution applies to parts of medical instruments and information services.

Elsewhere on the bottom rungs the churn is real. Publishing (5.4 years, 196 firms), medical-device makers, motor-vehicle dealers and the grab-bag of professional and technical services are mature enough that a short average means people actually move through — into other firms, other sectors, or out. Retail and food, further up at 9–11 years, hold people longer than their reputation suggests, mostly because their headcount is dominated by a few very large chains.

## Why the number is worth having

Tenure is one of the few things about a workforce a company cannot flatter. It cannot round it up the way it can a growth forecast, and it files it under a rule, not a press release. Read down the ladder and you are reading, in a single figure per sector, where a Korean career compounds and where it resets — which matters to anyone deciding where to spend one.
