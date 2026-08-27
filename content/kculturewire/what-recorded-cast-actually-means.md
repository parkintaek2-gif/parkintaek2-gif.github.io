---
title: "Korean titles on Netflix: a median of 5 recorded cast names"
dek: "Wikidata records no cast at all for 266 of 901 Korean titles. Of the 635 that have any, the median series lists five names. What that limits."
category: titles
purpose: ads
pubDate: 2026-08-08
dataAsOf: 2026-08-07T00:00:00+09:00
author: Newsroom
tags: ["korean drama", "korean film", "wikidata", "measurement", "data quality", "korea"]
pages:
  - "/actors"
  - "/titles"
sources:
  - org: "Wikidata"
    api: "Cast member (P161) with citizenship (P27 = Q884) on Korean titles that appeared in a Netflix Top 10, joined on Q-numbers"
    url: "https://query.wikidata.org"
  - org: "Netflix"
    api: "Top 10 weekly lists (Tudum), used to decide which Korean titles enter the set"
    url: "https://www.netflix.com/tudum/top10"
crossChecks:
  - "Counts are of the join as published in our data bundle, produced by the same build, not retyped"
  - "The 266 titles with no cast are those matched to a Korean Wikidata item that carries no P161 statement at all. They are absent from the join rather than present with an empty cast"
  - "Medians are given separately for film and series because their recorded cast sizes differ and a combined median would hide that"
excluded:
  - "Any estimate of true cast size. We do not know how many people were actually credited in these productions and we are not going to model it"
  - "Any correction factor. Every figure we publish from this join is reported as it comes out of the data, with the direction of the likely error stated instead"
  - "Crew, directors, writers and uncredited appearances. P161 records cast"
---

We have published several things this week that come from one join: which Korean actor appears in
which Korean title that reached a Netflix Top 10. Before any of it is used, here is what the join is
actually made of.

| | Titles | Median cast recorded |
| --- | ---: | ---: |
| Films | 371 | 4 |
| Series | 297 | 4 |

**A sixteen-episode drama is represented here by a median of four names.** Seventy-seven titles have
exactly one person recorded. And 277 of the 945 Korean titles we matched carry no cast statement at
all, so they are not in the join in any form.

That is the whole foundation: **3,588 casting slots**, 1,395 people, 668 titles.

## What thin records do to each figure

The useful thing about this particular gap is that its direction is knowable even where its size is
not.

**"48.5% of people appear in exactly one title" is a ceiling, not an estimate.** Every missing credit
turns a repeat worker into a one-timer. It cannot work the other way. The true share of one-timers is
lower, by an amount we cannot compute.

**"61.6% of multi-title actors work in both film and series" is a floor.** A missing credit can only
make a crosser look like a specialist. The true crossing rate is higher.

**"96.7% of titles form one connected body" is also a floor.** Adding a cast member can create a
link between two titles; it can never remove one. More complete records would make the catalogue
look more connected, not less.

**"The busiest actors are film actors" is the one that could genuinely reverse.** Series casts are
long and recorded thinly — that is exactly where the missing names should be. If they were filled in,
the series slot count would rise and the gap would narrow. We flagged that in the piece itself rather
than here, because a limit that could overturn a finding belongs beside the finding.

## Why we use it anyway

Because the alternative is not a better dataset. Netflix publishes no cast. No open source lists who
appeared in Korean films and series with identifiers you can join on. Wikidata is thin, and it is the
only thing there is.

So the rule we work to is: **publish the figure as it comes out, state which way the error runs, and
never apply a correction factor we cannot defend.** A number with a known direction of bias is
usable. A number silently adjusted towards what we expected is not.

## What we changed to make the join usable at all

Until 7 August 2026 we had stored, for each actor, **how many** charting titles they appeared in —
and not which ones. Every question of the form *did this show move its cast* was therefore
unanswerable, and rebuilding the link took a full day of re-querying.

The join is now keyed on Wikidata Q-numbers for both the person and the title, not on names, because
names change and identifiers do not. Matching these two sources on title text attaches cast to only
317 of 1,005 titles — chart names and article titles disagree constantly. On Q-numbers it reaches 668 of 945.

The file is in our data bundle as `cast-title-join.csv`, with a column dictionary that says what a
blank cell means in each column, and a coverage file that carries every number above.

---

These limits sit under every network figure we publish, and under the tables themselves. [Read what is in the data and what is missing →](/data)
