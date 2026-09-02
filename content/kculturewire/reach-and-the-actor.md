---
title: "Actors whose show travelled draw 3x the lookups"
dek: "Across 808 Korean actors joined to Netflix's country charts, those with a title in 20+ countries draw 2.99× the median Wikipedia lookups. Match on titles and recency and the gap holds everywhere but one band, where it reverses."
category: stars
purpose: both
pubDate: 2026-08-09
updatedDate: 2026-09-03
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
lists gives **808 Korean actors** who appear in both.

The first number out is large. Actors whose best title reached **20 countries or more** draw a median
**7,612** lookups over 30 days, against **2,547** for everyone else — **2.99×**.

That number is mostly wrong, and the way it is wrong is the point.

## Hold the amount of work fixed

An actor with five charting titles draws more lookups than an actor with one, whatever those titles
did. So the comparison has to happen inside a band of actors with the same amount of work.

| Charting titles | Actors | Under 20 countries | 20+ countries | Ratio |
| --- | ---: | ---: | ---: | ---: |
| All of them | 808 | 2,547 | 7,612 | **2.99×** |
| 1 | 309 | 1,564 | 2,195 | **1.4×** |
| 2 | 159 | 3,054 | 4,992 | 1.63× |
| 3–4 | 182 | 4,274 | 6,605 | 1.55× |
| 5 or more | 158 | 7,270 | 16,578 | **2.28×** |

Holding the amount of work fixed takes most of the headline away. The 2.99× becomes a range of
**1.4× to 2.28×**, and it is the actors with the most work — five titles or more — who keep the
largest gap. None of the four bands closes to nothing, which is the first sign that something is
left after the bookkeeping.

## Hold recency fixed too

Titles that reach many countries are disproportionately recent, and a recent title lifts lookups now.
So each band splits again by whether the actor's most recent charting week falls after **2025-08-01**.

| Charting titles | Last charted since 2025-08-01 | Before that |
| --- | ---: | ---: |
| 1 | **0.85×** | 2.61× |
| 2 | 1.91× | 1.52× |
| 3–4 | 2.19× | 1.29× |
| 5 or more | **2.43×** | **1.64×** |

**The objection takes the biggest number away — but not from the band we expected.** Among actors
with five or more charting titles the gap survives the split: 2.43× for those who charted in the
last year, 1.64× for those who did not. The same is true of the two middle bands.

The band recency was carrying is the **single-title** one. There the ratio is 2.61× among actors whose
one title charted before August 2025, and 0.85× among those whose one title charted since — which is
to say it disappears, and then reverses. For that group the first table was telling us when these
actors last worked, not how far the work went.

## What survives

The three upper rows. For actors with two or more charting titles the ratio holds on **both** sides
of the recency split — 1.91× and 1.52× at two titles, 2.19× and 1.29× at three or four,
2.43× and 1.64× at five or more. Whatever the join is picking up, it is not only that
the wide titles are the new ones.

What does **not** survive is the row we would have bet on. A single charting title is the cleanest
case — one credit, one outcome, least else going on — and it is the one case where matching on
recency empties the gap out entirely.

## The cell that runs backwards

Actors with exactly one title, charting recently, show **0.85×** — the actors whose title travelled
were looked up *less*. We are not going to explain that. With 33 actors on one side and 30 on the
other, a ratio of two medians is not a finding; it is what noise looks like at this size. We print it
rather than tidy it away, and every cell below **12** actors a side is marked *too thin to say*
instead of being given a number.

One more hole worth naming: cast lists are attached to 666 of the 943 charting titles, so **277
titles carry no actors here at all**. An actor whose only credits sit on those is absent from this
piece entirely — not counted as low, just absent.

## What a casting director should not take from this

Not that hiring an actor whose show travelled will make the next show travel. **Direction is not
established here and cannot be** — a travelling title may raise a profile, or a known face may be
cast into titles that were always going to travel. What the join does show is that the 2.99× headline
is roughly two parts bookkeeping to one part signal, and that anyone quoting it without the two
controls is quoting an artefact.

The full table, both controls, and every cell we refused to put a number on:
**[actor reach](/actor-reach)**.

**What this does not say:** that these actors are liked, or that anyone watched anything. A Wikipedia
page opening is a page opening — it climbs for a wedding and for a lawsuit alike, and we count
openings and never the reason.

## What changed on 3 September 2026

**The finding inverted, and we are printing the inversion rather than the old sentence.**

When this piece was published, the group that survived both controls was the actors with a *single*
charting title, and the group that collapsed was the actors with five or more. Recounted against a
rebuilt title list and a fresh 30-day lookup window, it is the other way round.

| Band, after matching on recency | Was | Now |
|---|---|---|
| 1 title, charted recently | 2.37× | **0.85×** — reversed |
| 1 title, charted earlier | 1.94× | 2.61× |
| 5+ titles, charted recently | 4.06× | 2.43× |
| 5+ titles, charted earlier | 1.11× | 1.64× |
| Raw headline | 2.91× | 2.99× |
| Actors joined | 812 | 808 |

Two things are worth saying plainly about that. The first is that the single-title cell was always
the thinnest in the table — 33 actors against 30 — and we said so at the time, in the section titled
*The cell that runs backwards*. A cell that thin was never going to hold still, and it did not.
The second is that the sections arguing the old shape had to be rewritten, not patched: leaving
"only one group keeps the gap" above a table that no longer says it would have been the worse error.

The check that reads this piece also had to change. It was demanding the sentence *recency takes the
biggest number away* about the five-title band, which is a claim the data no longer makes — a check
that insists on a stale finding will make the article lie to keep the build green. It now works out
from the data which band recency was carrying, and asks about that one.

## What changed on 3 September 2026

We re-collected the keyed title roster from Wikidata. One more charted title matched a Korean
Wikidata item, and it has no cast recorded.

| | Was | Now |
| --- | ---: | ---: |
| Charted titles matched to a Korean Wikidata item | 942 | 943 |
| Of those, titles with at least one cast member | 666 | 666 (unchanged) |
| Titles with no cast recorded | 276 | 277 |

**The join did not change.** What grew is the roster it is measured against, so the gap we name
here is one title wider than it was.
