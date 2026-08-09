---
title: "Actors and K-pop acts are looked up in the same shape. The difference people assume is a size artefact."
dek: "Across 1,008 Korean actors and 2,361 K-pop acts, the biggest single day is about 5% of a 30-day month for both. The raw gap of 5.5% against 6.2% disappears once the two groups are compared at the same size."
category: people
purpose: both
pubDate: 2026-08-08
dataAsOf: 2026-08-06T00:00:00+09:00
author: Newsroom
tags: ["korea", "kpop", "actors", "attention", "measurement"]
pages:
  - "/kpop-attention"
sources:
  - org: "Wikimedia"
    api: "REST pageviews API for English Wikipedia articles, 30 days per roster — actors 2026-07-05 to 2026-08-03, K-pop acts 2026-07-08 to 2026-08-06"
    url: "https://wikimedia.org/api/rest_v1/"
  - org: "Wikidata"
    api: "Rosters of Korean performers and Korean musical acts, used to decide whose article to count"
    url: "https://query.wikidata.org"
crossChecks:
  - "Both groups are measured with the same statistic — one person's biggest single day divided by their own 30-day total — so nothing about the method differs between them"
  - "Every comparison is made inside a band of similar 30-day totals, because a name with 200 lookups in a month is mechanically lumpy and would otherwise decide the answer"
  - "The collector refuses to run if either matched group falls below 100 names, or if the two 30-day windows are more than ten days apart"
excluded:
  - "Any person-by-person comparison. The two windows are three days apart, so an event inside one and outside the other would land on individuals; only group-level figures are reported"
  - "Popularity. This counts how often an English Wikipedia article was opened, which is not the same as how much anyone is liked"
  - "Everyone without an English Wikipedia article, who cannot appear here at all"
  - "Any claim about why the very largest names are spikier. We can show the shape turns back up; we did not measure what causes it"
---

There is a thing everyone believes about Korean fandom: idol attention is event-driven — a comeback,
an award, a scandal — while attention on actors is steadier. It is a testable claim, and the test is
simple. Over thirty days, **how much of a person's total lands on their single biggest day?**

We measured it for **1,008 Korean actors** and **2,361 K-pop acts**, each against their own
thirty-day total.

## The raw answer, and why we did not publish it

| | Names | Biggest day, as a share of the month |
| --- | ---: | ---: |
| Actors | 1,008 | 5.5% |
| K-pop acts | 2,361 | 6.2% |

That is a 0.7-point gap in the direction the story predicts, and it is not a finding. It is a
consequence of who is in each group.

## Size decides this, until you hold it fixed

A name with 200 lookups in a month is lumpy by construction: forty of them landing on a Tuesday is
20% of the month and means nothing. So we banded both groups by their own thirty-day total.

| 30-day total | Actors | K-pop acts |
| --- | ---: | ---: |
| under 300 | **16.7%** (n=221) | **8.6%** (n=659) |
| 300–999 | 5.6% (n=108) | 6.0% (n=601) |
| 1,000–4,999 | 4.9% (n=337) | 5.2% (n=694) |
| 5,000–29,999 | 4.8% (n=282) | 5.1% (n=345) |
| 30,000 or more | 7.0% (n=60) | 7.1% (n=62) |

Two things fall out of that table, and only one of them is the thing we set out to measure.

**The first is that the groups are the same.** Above 5,000 lookups a month, actors sit at 5.0% and
K-pop acts at 5.1% — a gap of **0.1 points** across 342 and 407 names. The raw 0.7-point difference
was the under-300 band, where actors are lumpier than K-pop acts for the arithmetic reason above and
where a third of the K-pop roster lives. Once size is held fixed, the shape people describe is not
there.

**The second is the curve.** The share falls from 16.7% to 4.8% as names get bigger, and then turns
back up to 7.0% at the very top. The fall is mechanical. The rise is not — the largest names have
lumpier months than the merely large ones, in both groups, at the same point.

We are not going to explain that rise. It is what our
[K-pop attention page](/kpop-attention) already shows in a different form, and the honest position
is that the shape turns up at the top and we did not measure why.

## What this cannot be read as

It is not about popularity. It counts how often an English Wikipedia article was opened, which is a
measure of being looked up rather than of being liked, and everyone without an English article is
missing entirely.

It is not a person-by-person comparison. The two thirty-day windows sit **three days apart**, so a
single event inside one window and outside the other would move individuals. That is why nothing
here is reported below the group level, and why we did not name anybody.

And it is a month, not a career. Thirty days is long enough to contain a comeback or an award and
far too short to describe how a person's attention behaves across years.
