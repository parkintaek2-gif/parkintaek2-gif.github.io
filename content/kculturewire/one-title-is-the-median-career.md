---
title: "Half the Korean actors on a Netflix chart are there for exactly one title"
category: stars
purpose: both
dek: "We tried to test whether debuting younger buys a wider career. The answer did not come out in one direction, so we went looking for why — and found that for 658 of 1,329 actors, the chart only ever lit them once."
pubDate: 2026-08-13
dataAsOf: 2026-08-13T00:00:00+09:00
author: Newsroom
tags: ["korea", "stars", "netflix", "measurement", "limits", "negative-result"]
pages:
  - "/one-title"
sources:
  - org: "Netflix Tudum"
    api: "Weekly country Top 10 lists, the panel of Korean titles behind our chart data"
  - org: "Wikidata"
    api: "Cast lists for those titles, and public profile first-credit dates for the actors in them"
draft: false
---

Of the 1,329 Korean actors with a title on a Netflix country chart, 658 have exactly one. That is 49.5%. Add the actors with two and you have 68.7% of the panel.

We did not set out to count that. We set out to test a sentence that gets said often and measured rarely: that Korean actors who start young end up reaching further.

## The test that did not come out

Grouping actors by age at first credit and taking the median widest reach — the largest number of countries any one of their titles charted in — gives this:

| Age at first credit | Actors | Median titles | Median widest reach | Median years active |
|---|---|---|---|---|
| under 18 | 136 | 2 | 19 | 22 |
| 18–20 | 235 | 2 | 11 | 22 |
| 21–24 | 265 | 2 | 18 | 21 |
| 25 or older | 113 | 2 | 7 | 22 |

19, then 11, then 18, then 7. It does not move in one direction. Holding years active fixed does not rescue it — inside the 10-to-19-year band the four figures run 10, 20, 19, 10, and inside the 20-plus band, 20, 7, 11, 7.

A result like that has two honest readings: debut age buys nothing here, or the instrument cannot see it. We looked at which.

## Why the instrument cannot see it

The median actor in every one of those four bands has **two** charting titles. Half the panel has one.

When an actor has a single charting title, everything we could attribute to that person — how many countries they reached, how long they stayed, how high they got — is a fact about the title. It is the same number, read twice. There is no arithmetic that separates the person from the work when the work is a sample of one.

| Charting titles | Actors | Share | Cumulative |
|---|---|---|---|
| 1 | 658 | 49.5% | 49.5% |
| 2 | 255 | 19.2% | 68.7% |
| 3 | 160 | 12.0% | 80.7% |
| 4 | 90 | 6.8% | 87.5% |
| 5 | 56 | 4.2% | 91.7% |
| 6 or more | 110 | 8.3% | 100% |

That is the shape of the problem. It is not a shortage of data — we have every Korean title that reached a chart. It is that the chart lights each person about once.

## What this does not say

A chart is not a career. This counts titles that reached a Netflix country chart in the weeks we hold. Theatre, cinema releases that never charted, television that never went to Netflix, and any work before the chart existed are all absent. An actor with one charting title here is not an actor with one title.

So the honest version of the sentence we tested is narrower than the sentence: on Netflix charts, debut age does not predict reach, and the main reason is that most actors appear on those charts once.

The data carries a flag, `debutAgeMonotonic`, currently false. If the bands ever line up in one direction, the flag flips and the claim becomes writable. Until then it is not.

The full table is at [Half of the Korean actors on a Netflix chart are there for one title](/one-title).
