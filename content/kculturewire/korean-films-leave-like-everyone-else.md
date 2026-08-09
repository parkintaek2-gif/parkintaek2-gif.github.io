---
title: "Korean films leave a Netflix chart exactly as fast as everyone else's. Korean series do not"
category: screen
purpose: both
dek: "Across 208,053 finished runs, a Korean film holds a country chart for 1.96 weeks on average and every other film for 2.02. Korean series run 3.72 weeks against 2.71 — and removing each group's biggest title barely moves it."
pubDate: 2026-08-10
dataAsOf: 2026-07-26T00:00:00+09:00
author: Newsroom
tags: ["korea", "netflix", "charts", "measurement", "limits"]
pages:
  - "/run-length"
sources:
  - org: "Netflix"
    api: "Tudum weekly Top 10 country lists, 493,600 rows read, 2021-07-04 to 2026-07-26, 93 markets, Russia excluded"
    url: "https://www.netflix.com/tudum/top10"
  - org: "Wikidata"
    api: "Korean titles identified by item number and country of origin, using the same single rule as the rest of this publication"
    url: "https://query.wikidata.org"
crossChecks:
  - "Every non-Korean title on the same charts is measured the same way, so a difference between Korean films and Korean series is not read as Korean when it is only a difference between films and series"
  - "Each group is repeated with its single most-charting title removed, because a mean run length can be carried by one very long-running show"
  - "Runs still on a chart in the last week we hold are removed and counted separately, since an unfinished run has no length"
  - "Netflix publishes films and series as two separate top 10s, so each has exactly one place at every position and neither crowds the other"
excluded:
  - "Russia, excluded across this publication because Netflix withdrew and the remaining weeks are not comparable"
  - "1,860 runs that were still on a chart in the final week and therefore have no finished length"
---

A series has another episode coming. A film does not. If that changes anything about how long
something stays on a chart, the two should part company — and Netflix makes the comparison easy by
publishing films and series as **two separate top 10s**, each with exactly one place at every
position.

We had never split them. So we did, across every run in five years of country charts: one title, in
one country, for as many consecutive weeks as it lasted. The full table is at
[how long a title holds a chart](/run-length), and the companion measurement — the position a title
was in the week before it vanished — is at [how a title leaves](/exit).

## Korean films are unremarkable

| | Runs | Median weeks | Mean weeks | Gone after one week | Lasting 4+ weeks |
|---|---:|---:|---:|---:|---:|
| Korean films | 3,830 | 2 | **1.96** | 41.8% | 8.8% |
| Every other film | 117,316 | 2 | **2.02** | 42.4% | 9.9% |
| Korean series | 7,892 | 3 | **3.73** | 30.6% | 38.6% |
| Every other series | 79,015 | 2 | **2.71** | 34.1% | 23.3% |

Read the first two rows and there is nothing to report. A Korean film holds a country's top 10 for
1.96 weeks on average; every other film on the same charts holds it for 2.02. Four in ten of each are
gone the following week. Fewer than one in ten of each last a month.

**Whatever Korean film travels on, it is not staying power.** On this measure Korean films are
indistinguishable from the rest of the world's films.

The series rows are a different picture. A Korean series runs **3.72 weeks** against 2.71 for every
other series, and **38.5%** of Korean series runs last four weeks or more against 23.3%.

## The part that is actually Korean

Series outlast films everywhere, so most of the gap between the Korean rows is just the difference
between the two formats. The number worth having is what is left after removing it:

| | Series minus films, mean weeks |
|---|---:|
| Korean titles | **1.77 weeks** |
| Every other title | **0.69 weeks** |
| Difference | **1.08 weeks** |

Korean series pull away from Korean films by a week more than other series pull away from other
films. That extra week is the Korean part, and it sits entirely on the series side.

## One title could have done this. It did not.

A mean is easy to move with a handful of very long runs, and we have been caught by exactly that
before — a rise in chart concentration that turned out to be one show returning. So each group was
measured again with its single most-charting title taken out:

| | Mean weeks | Without the biggest title | 4+ weeks | Without the biggest title |
|---|---:|---:|---:|---:|
| Korean series | 3.73 | **3.57** | 38.6% | **36.6%** |
| Every other series | 2.71 | **2.67** | 23.3% | **23%** |
| Korean films | 1.96 | 1.96 | 8.8% | 8.7% |
| Every other film | 2.02 | 2.02 | 9.9% | 9.9% |

The gap narrows and stays. Korean series still run about nine tenths of a week longer than other
series with their biggest contributor removed, and still reach four weeks half again as often.

## How they leave

There is one more asymmetry, and it runs the other way. Of Korean series runs that ended, **62.9%**
ended from positions 8, 9 or 10 — against 57.5% for other series and 44.3% for Korean films. A
Korean series is on the chart longer and then slides off the bottom of it; a Korean film is more
often simply gone.

That is consistent with where the two sit while they are there. Korean series spend 28.2% of their
chart weeks in the bottom three positions and other series 30.2%, so Korean series are not sitting
lower — they climb, hold, and then slide.

## What this cannot tell you

A run ending is not viewing ending. A title one place outside a top 10 is invisible here at any
level of viewing, so a shorter run means less time on a rank list and nothing else. Netflix
publishes no viewing figures for its country charts.

It also cannot tell you *why* Korean series hold longer. Weekly release schedules, episode counts,
dubbing, and how much of a season lands at once would all produce this shape, and none of them is in
this data. What we can say is narrower: **the staying power people describe as Korean is a property
of Korean series, and Korean films do not have it.**
