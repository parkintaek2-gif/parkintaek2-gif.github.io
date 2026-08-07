---
title: "In Korea, the industries that hold their workers longest are mostly the ones that pay them most"
dek: "Rank 44 listed industries by how long they keep people and by what they pay, and the two line up at 0.67. Long-tenure sectors pay 1.7 times the high-churn ones — but retail keeps people cheaply, and research pays for talent it cannot keep."
category: equities
pubDate: 2026-08-08
dataAsOf: 2026-08-06T09:00:00+09:00
author: Newsroom
tags: ["human capital", "pay", "corporate disclosure", "tenure", "industry"]
tickers: []
sources:
  - org: "Financial Supervisory Service (Korea)"
    api: "DART Open API — empSttus (Employee Status: average tenure and average annual pay)"
    url: "https://opendart.fss.or.kr"
  - org: "Financial Supervisory Service (Korea)"
    api: "DART Open API — company (industry code)"
    url: "https://opendart.fss.or.kr"
crossChecks:
  - "Both figures come from the same filing: 근속연수 (average years of service) and 1인평균 급여액 (average annual pay per employee), each disclosed by the company itself in its annual report"
  - "Each is weighted by the company's headcount and rolled up to its KSIC industry; the correlation of 0.67 is measured across the 44 industries with at least 3,000 covered workers and 5 filers"
  - "The correlation is an association, not a one-way cause. Tenure and pay feed each other — seniority scales pay, and pay retains people — so neither figure is read here as the source of the other"
  - "Pay is as filed; holding companies count head office only and bonus and option treatment differ by company, so a single company's pay is noisier than an industry's headcount-weighted average"
excluded:
  - "Industries below the 3,000-worker, 5-filer bar, whose pay or tenure would turn on one company"
  - "Any claim that longer tenure earns higher pay for a given worker. This compares industries, not careers; within one company the seniority link is real but it is not what these industry averages measure"
  - "Unlisted employers, which pay less and turn over faster than the listed set shown here"
draft: false
---

Two numbers sit side by side in every Korean annual report: how long the average worker has stayed, and how much the average worker is paid. Put them on the same axis, industry by industry, and they move together — the sectors that hold people longest are, with a few loud exceptions, the sectors that pay them most.

## They track at 0.67

Across the 44 listed industries big enough to rank — each with at least 3,000 covered workers — average tenure and average pay correlate at **0.67**, both weighted by headcount. That is a strong line for social data, and you can see it in the ends. The ten longest-tenure industries pay an average of **112 million won** a year; the ten shortest-tenure pay **66 million** — a 1.7-times gap that rides on top of the tenure gap, not instead of it.

| Industry | Avg tenure (yrs) | Avg pay (₩m/yr) |
| --- | ---: | ---: |
| Motor vehicles | 16.0 | 117 |
| Telecommunications | 15.1 | 123 |
| Coke and refined petroleum | 15.1 | 139 |
| Insurance and pensions | 14.5 | 123 |
| Financial services | 14.2 | 116 |
| Retail trade | 10.9 | **57** |
| Publishing | 5.4 | 77 |
| Research and development | 3.8 | **71** |

The top of both ladders is the same place: carmakers, telecoms, refiners, insurers and banks — old, capital-heavy, and paying six figures in dollar terms to people who joined young and stayed. The highest single pay figure, 147 million won at financial-support services, sits at a middling 11.6 years, a reminder that the very top of the pay scale is bought by the work, not only the years.

## Where the line breaks — and why that is the interesting part

A correlation of 0.67 leaves a lot unexplained, and the residuals tell their own stories.

**Retail keeps people cheaply.** Retail trade holds its 77,000 listed workers for **10.9 years** — longer than most of manufacturing — yet pays the least of any long-tenure industry, **57 million won**. Loyalty here is not bought with wages; it is the shape of a workforce dominated by a few very large chains, where people stay because the ladder is stable, not because it is tall. Tenure without pay is its own kind of signal.

**Research pays for people it cannot keep.** Research and development sits at the very bottom for tenure, **3.8 years**, but pays **71 million** — above the average for the whole low-tenure group. This is talent priced at the door rather than by seniority: young, high-skill, and mobile, working at firms too new to have long-tenured staff in the first place. The pay is real; the short tenure is youth as much as churn.

## What the pair is good for

Neither number is worth much alone. Tenure without pay can be a stable low-wage floor; pay without tenure can be a signing war for scarce skills. Together they sort Korea's industries into something more honest than either: the places that hold people *and* pay them, the places that hold people *instead of* paying them, and the places that pay for people they are always about to lose.
