---
title: "In one Korean province, workers leave the payroll fastest — and it pays the least."
dek: "Each month a share of enrolled workers drops out of workplace pension coverage. On the tourism island of Jeju it is 4.28%; in research-heavy Daejeon, 3.12%. Across regions, higher pay and lower churn move together."
category: macro
pubDate: 2026-08-07
dataAsOf: 2026-06-30T00:00:00+09:00
author: Newsroom
tags: ["labour", "turnover", "regional", "national pension", "methodology"]
sources:
  - org: "National Pension Service (Republic of Korea)"
    api: "National Pension enrolled-workplace register — monthly bulk file (2026-06)"
crossChecks:
  - "Separation rate = the month's dropped members divided by enrolled members, aggregated by region"
  - "Region assigned from the address string's leading token, not the numeric province code"
  - "Wage-churn correlation computed across the 16 regions, unweighted, r = -0.43"
excluded:
  - "The reason for each separation — the register records that a member left, not whether they quit, retired, moved jobs, or were laid off"
  - "Re-enrolments elsewhere in the same month — a job-to-job move can show as a separation here"
draft: false
---

Turnover has a geography, and in Korea it runs opposite to pay.

The national-pension register records, each month, how many enrolled members a workplace lost. Sum those across a region and divide by its enrolled workforce and you get a separation rate — a monthly read on how fast people leave the formal payroll. In June 2026 the national figure was 3.56%. The regional spread around it is not random.

## What the data shows

- **Jeju — 4.28%.** The highest, on the tourism island.
- **Incheon — 3.98%.**
- **Gangwon — 3.87%**, and **Sejong — 3.85%**.
- ...
- **Gyeongbuk — 3.25%**, and **Daejeon — 3.12%**, the lowest.

The two ends are not accidents. Jeju runs on hospitality and seasonal work, where jobs start and stop by the calendar. Daejeon runs on government research institutes, defence, and universities — payrolls that do not churn. The stable end of the map is the salaried, institutional end.

## Pay and churn move together

Line each region's separation rate against its average pension bill — our proxy for pay from the companion cut — and the two are inversely related, with a correlation of **-0.43**. Regions that pay more tend to shed workers more slowly.

Jeju is the clean illustration: it is last in pay *and* first in churn. The place where the formal wage proxy is lowest is also the place people cycle out of fastest. That is what a seasonal, low-margin labour market looks like from inside the pension data.

The relationship is moderate, not mechanical. Sejong breaks it — a planned government city with decent pay but high churn, because it is still being populated and staffed. Correlation of -0.43 leaves plenty of room for a province to sit off the line, and Sejong does.

## Why this is a proxy, and what it misses

A "separation" here means a member left a workplace's enrolment. It does not say why. Someone who quit for a better job, someone who retired, someone who moved to self-employment, and someone who was laid off all look identical in this field. A job-to-job move can even register as a separation in one workplace and a fresh enrolment in another the same month.

So this is a churn rate, not an unemployment rate, and certainly not a layoff rate. What it measures well is *instability of formal attachment* — how often the employment relationship, whatever its cause, breaks. On that narrow definition the map is clear and the regional ordering is stable.

## What we did not claim

We have not seasonally adjusted. June is not a neutral month for a tourism economy, and Jeju's figure in particular should be read as a summer reading, not an annual one — a point we would want a full twelve months to settle before drawing a trend. We publish the single month here because it is the month we have, labelled as such.
