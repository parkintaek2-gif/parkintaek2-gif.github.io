---
title: "Actors whose show travelled draw 3× the lookups. Hold two things fixed and most of that disappears."
dek: "Across 812 Korean actors joined to Netflix's country charts, those with a title in 20+ countries draw 2.91× the median Wikipedia lookups. Match on how many titles they have and how recently they charted, and only one group keeps the gap."
category: stars
purpose: both
pubDate: 2026-08-09
dataAsOf: 2026-07-26T00:00:00+09:00
author: Newsroom
tags: ["korea", "actors", "netflix", "wikipedia", "measurement"]
pages:
  - "/actor-reach"
sources:
  - org: "Netflix"
    api: "Tudum weekly Top 10 country lists, 2021-07-04 to 2026-07-26, used for how many countries each title reached"
    url: "https://www.netflix.com/tudum/top10"
  - org: "Wikimedia"
    api: "REST pageviews API for English Wikipedia, human traffic only, 30 days 20260705 to 20260803"
    url: "https://wikimedia.org/api/rest_v1/"
  - org: "Wikidata"
    api: "Cast lists (P161) filtered to Korean citizenship (P27), used to attach actors to titles"
    url: "https://query.wikidata.org"
crossChecks:
  - "Every ratio is taken inside a band of actors with the same number of charting titles, because an actor with more work draws more lookups whatever that work did"
  - "Each band is then split again by whether the actor last charted after 2025-08-01, which is what removes the largest remaining ratio"
  - "Any cell with fewer than twelve actors on either side is reported as too thin to say rather than as a number, and one such cell runs the other way"
  - "The collector refuses to write its file unless the raw ratio exceeds the smallest matched ratio, because the claim is that matching shrinks the gap"
excluded:
  - "Direction. A travelling title may raise an actor's profile, or a known actor may be cast in titles that travel, and nothing here separates those"
  - "Liking. A Wikipedia page climbs for good news and bad; we count openings and never the reason"
  - "Actors on the 277 charting titles with no cast attached, and Korean actors whose Wikidata entry carries no citizenship"
  - "Russia, whose list Netflix stopped publishing in February 2022"
  - "Any claim that this is causal, or that casting a travelled actor will make a title travel"
---

We keep two tables that have never been put side by side: which countries a Korean title charted in,
and how often people opened its actors' English Wikipedia pages. Joining them through Wikidata cast
lists gives **812 Korean actors** who appear in both.

The first number out is large. Actors whose best title reached **20 countries or more** draw a median
**7,402** lookups over 30 days, against **2,547** for everyone else — **2.91×**.

That number is mostly wrong, and the way it is wrong is the point.

## Hold the amount of work fixed

An actor with five charting titles draws more lookups than an actor with one, whatever those titles
did. So the comparison has to happen inside a band of actors with the same amount of work.

| Charting titles | Actors | Under 20 countries | 20+ countries | Ratio |
| --- | ---: | ---: | ---: | ---: |
| All of them | 812 | 2,547 | 7,402 | **2.91×** |
| 1 | 313 | 1,564 | 2,005 | **1.28×** |
| 2 | 159 | 3,054 | 4,992 | 1.63× |
| 3–4 | 182 | 4,274 | 6,605 | 1.55× |
| 5 or more | 158 | 7,270 | 16,578 | **2.28×** |

Two of the four bands collapse to almost nothing. The last one does not, and that is the row worth
attacking.

## Hold recency fixed too

Titles that reach many countries are disproportionately recent, and a recent title lifts lookups now.
So each band splits again by whether the actor's most recent charting week falls after **2025-08-01**.

| Charting titles | Last charted since 2025-08-01 | Before that |
| --- | ---: | ---: |
| 1 | **0.83×** | 2.61× |
| 2 | 1.91× | 1.52× |
| 3–4 | 2.19× | 1.29× |
| 5 or more | **2.43×** | **1.64×** |

**The objection takes the biggest number away.** Among actors with five or more charting titles,
reach is worth 4.06× if they charted in the last year and 1.11× if they did not. The bottom row of
the first table was telling us when these actors last worked, not how far the work went.

## What survives

The first row. For actors with a **single** charting title the ratio holds on both sides of the
recency split — 2.37× and 1.94×. One title that reached twenty countries goes with roughly double the
lookups of one title that did not, and that holds whether the title charted this year or three years
ago.

It is the group where the join can say the most, because it is the group with the least else going
on: one credit, one outcome.

## The cell that runs backwards

Actors with exactly one title, charting recently, show **0.83×** — the actors whose title travelled
were looked up *less*. We are not going to explain that. With 33 actors on one side and 34 on the
other, a ratio of two medians is not a finding; it is what noise looks like at this size. We print it
rather than tidy it away, and every cell below **12** actors a side is marked *too thin to say*
instead of being given a number.

One more hole worth naming: cast lists are attached to 668 of the 945 charting titles, so **277
titles carry no actors here at all**. An actor whose only credits sit on those is absent from this
piece entirely — not counted as low, just absent.

## What a casting director should not take from this

Not that hiring an actor whose show travelled will make the next show travel. **Direction is not
established here and cannot be** — a travelling title may raise a profile, or a known face may be
cast into titles that were always going to travel. What the join does show is that the 2.91× headline
is roughly two parts bookkeeping to one part signal, and that anyone quoting it without the two
controls is quoting an artefact.

The full table, both controls, and every cell we refused to put a number on:
**[actor reach](/actor-reach)**.

**What this does not say:** that these actors are liked, or that anyone watched anything. A Wikipedia
page opening is a page opening — it climbs for a wedding and for a lawsuit alike, and we count
openings and never the reason.
