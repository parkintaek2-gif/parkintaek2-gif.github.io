---
title: "More charting work raises an actor's floor 7x and the ceiling not at all"
dek: "We took the 1,113 actors credited in Netflix's charting Korean titles and counted their English Wikipedia readers. Median daily views go 56, 137, 304, 392 as charting credits pile up. The single highest belongs to someone with three."
category: stars
purpose: both
pubDate: 2026-09-04
dataAsOf: 2026-08-22T00:00:00+09:00
author: Newsroom
tags: ["korea", "actors", "netflix", "wikipedia", "measurement"]
sources:
  - org: "Wikimedia"
    api: "Pageviews API, en.wikipedia, all-access, user agents only, 2026-07-24 to 2026-08-22, 30 days; 1,113 actors requested and 1,113 returned, 0 missing pages and 0 failures"
    url: "https://wikimedia.org/api/rest_v1/"
  - org: "Wikidata / Netflix"
    api: "Cast list built from Wikidata P161 for Korean titles that appeared in Netflix's Top 10 tables; the credit count per actor is the number of those charting titles they are credited in"
    url: "https://www.wikidata.org/"
crossChecks:
  - "All 1,113 actors have both a credit count and a view figure. Nobody was dropped and no missing value was filled with a zero; the script reports both gap counts and both are 0"
  - "The four bands sum to 1,113, checked against the file's own total, so no actor is counted twice or lost at a boundary"
  - "Band edges are defined in one place in the script and tested at each edge, 1, 3, 4, 6 and 7, because a boundary written twice drifts"
  - "Views are a 30-day daily average from one API call per actor, so a single viral day cannot carry a band's median"
  - "Bot traffic is excluded by the API's user filter, which matters here because Wikipedia articles attract scrapers"
excluded:
  - "Cause. This cannot separate being cast more often because you are read, from being read because you are cast often. Both directions are consistent with every figure below"
  - "Korean-language attention. English Wikipedia is one language edition and Korean readers are not in this count at all"
  - "Work that never charted. The list itself was built from Netflix's Top 10 tables, so an actor's credit count here is not their filmography"
  - "Film and stage work outside Netflix, and any title Netflix did not chart in a country we hold"
  - "How much anyone was paid, and whether attention converted into anything"
---

Korean shows chart abroad and their casts acquire foreign readers. Wikimedia publishes how many.
We joined the two: 1,113 actors credited in Korean titles that reached Netflix's Top 10, and the
English Wikipedia pageviews each of them drew over the 30 days to 22 August. Every one of the
1,113 came back with a figure. None was estimated.

Then we grouped the actors by how many charting titles they are credited in.

| Charting credits | Actors | Median views/day | Above 1,000/day | Above 10,000/day | Highest in band |
|---|---:|---:|---:|---:|---:|
| 1 | 446 | 56 | 5 (1.1%) | 0 | 3,701 |
| 2–3 | 362 | 137 | 15 (4.1%) | 1 | **10,835** |
| 4–6 | 199 | 304 | 30 (15.1%) | 0 | 5,227 |
| 7 or more | 106 | 392 | 22 (20.8%) | 0 | 5,779 |

## The floor moves a lot

The median rises at every step: 56, 137, 304, 392. From one charting credit to seven or more is
a **7.0x** rise in the typical actor's daily readership.

The share clearing 1,000 readers a day rises faster still — 1.1%, 4.1%, 15.1%, 20.8%. That is
**18.5x**, more than double the movement in the median. Piling up charting credits does not
nudge everyone up a little; it moves a fifth of the group into a bracket that almost nobody in
the single-credit band reaches.

## The ceiling does not move at all

The highest daily average in the entire set of 1,113 is 10,835, and it belongs to an actress
with **three** charting credits — Ha Young, whose views peaked at 35,378 on 12 August, 6.26
times her own average.

No actor in the 4–6 band and no actor in the 7-or-more band clears 10,000. The best in the
busiest band is Jung Hae-in at 5,779 a day across seven credits. So Ji-sub, with six, is at 5,227.
Kim Go-eun, with eight, is at 2,287.

Read the last two columns together and the shape is plain: more charting work reliably lifts an
actor out of obscurity, and never once produces the biggest number in the room.

## The single-credit band is not a beginner band

Among the 446 actors with one charting credit, the top reader count is Steven Yeun at 3,701 a
day — an actor whose audience was built almost entirely outside Korean charting titles. Second
is J.Y. Park at 1,938, better known as the producer who founded JYP Entertainment. Third is
Hwang In-youp at 1,478.

Only five of those 446 clear 1,000 a day, and at least two of the five are people whose fame
arrived from somewhere this dataset does not see. That is worth saying because it is the
mechanism behind the unmoving ceiling: the very largest audiences in Korean entertainment are
not assembled by charting credits, and charting credits cannot reach them.

## What this does not settle

Nothing here says which way the arrow points. An actor may be cast repeatedly because
audiences already read about them, or read about because they are cast repeatedly. Both
readings fit every number above, and this data cannot choose between them.

The credit counts are also narrower than they look. They count Korean titles that entered
Netflix's Top 10 and no others, so an actor with a long career in film or on stage can sit in
the single-credit band. Their count is a measure of charting exposure, not of work.

And the readers counted are English Wikipedia's. Korean readers, who are most of any Korean
actor's audience, are absent from every figure on this page.

**This is a count of readers, not a ranking of actors.**
