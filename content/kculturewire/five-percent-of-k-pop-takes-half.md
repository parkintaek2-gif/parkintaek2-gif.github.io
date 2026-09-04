---
title: "5% of K-pop acts take half the reading, and groups are the concentrated half"
dek: "We counted English Wikipedia readers for 2,372 Korean music acts over 30 days. The top 5% took 50.2% of all daily reading. Among groups alone the top 1% took 29.0%, against 19.2% among individuals."
category: stars
purpose: both
pubDate: 2026-09-04
dataAsOf: 2026-08-22T00:00:00+09:00
author: Newsroom
tags: ["korea", "kpop", "wikipedia", "concentration", "measurement"]
pages:
  - "/kpop-attention"
sources:
  - org: "Wikimedia"
    api: "Pageviews API, en.wikipedia, all-access, user agents only, 2026-07-24 to 2026-08-22, 30 days; 2,372 acts requested and 2,372 returned, 0 missing pages and 0 call failures"
    url: "https://wikimedia.org/api/rest_v1/"
  - org: "Wikidata"
    api: "Panel is Korean-citizenship singers, rappers, composers and musicians, plus Korean musical groups reached through subclass links so girl groups and boy bands are included, not only the parent class"
    url: "https://www.wikidata.org/"
crossChecks:
  - "All 2,372 acts returned a reading figure, so no share below is computed over a set with holes and no missing value was filled with a zero"
  - "The n in each top-n% is rounded up, not down. One per cent of 822 groups is 8.22 acts, and taking 8 would report less concentration than there is"
  - "Top half and bottom half shares were checked to sum to 100 in the script's own tests, so the split is not double-counting anyone"
  - "The 1,550 individuals and 822 groups are disjoint, tagged in the source file, and their counts sum to the 2,372 total"
  - "The actor comparison uses the same API, the same 30-day window and the same bot filter as this panel, so the two ceilings are measured on one instrument"
excluded:
  - "Which members belong to which group. The source file has no field linking them, so whether a member out-reads their own group is unmeasured here, not zero"
  - "Whether someone is really a musician. The panel is built from Wikidata occupations, so people better known as actors appear in it. We did not remove them, because removing them would mean us deciding who counts"
  - "Korean-language attention. English Wikipedia is one edition and Korean readers are absent from every figure"
  - "Why the concentration exists. Release schedules, activity, tour dates and label size are none of them in this data"
  - "Anything after 2026-08-22, the last day in the window"
---

There are more Korean music acts than anyone can follow. Wikidata lists 2,372 with an English
Wikipedia article — 1,550 people and 822 groups. Wikimedia publishes how many readers each one
drew. Over the 30 days to 22 August, we counted all of them.

The reading is not spread out. It is stacked.

| Panel | Acts | Median views/day | Top 1% take | Top 5% take | Top 10% take | Bottom half take |
|---|---:|---:|---:|---:|---:|---:|
| All acts | 2,372 | 29 | 21.5% | **50.2%** | 66.0% | 3.7% |
| Groups | 822 | 18 | **29.0%** | 57.7% | 72.4% | 3.1% |
| Individuals | 1,550 | 37 | 19.2% | 46.9% | 62.9% | 4.3% |

**Five per cent of the acts take half of all the reading.** The bottom half of the list — 1,186
acts — take 3.7% between them. 630 of the 2,372 draw fewer than ten readers a day.

## Groups are the concentrated half

Split the panel and the two halves behave differently. Among the 822 groups, the top 1% — nine
groups, the count rounded up — take **29.0%** of all group reading. Among the 1,550
individuals, the top 1% take **19.2%**.

At every cut the groups are more top-heavy: 57.7% against 46.9% in the top 5%, 72.4% against
62.9% in the top 10%.

BTS alone is read 8,689 times a day, the highest figure in the whole panel. Blackpink is at
4,499, Stray Kids at 2,577, Cortis at 2,490, Ateez at 2,049 and Le Sserafim at 1,937. After
those six the group list falls away fast: only 17 of 822 groups clear 1,000 readers a day.

## And yet the median individual out-reads the median group

The same table holds the opposite fact. The middle group in the list draws **18** readers a
day. The middle individual draws **37** — twice as many.

So the two statements are both true, and they are not in conflict: group attention is piled
higher at the very top, and thinner in the middle. A named person with an English Wikipedia
article is the more reliably read of the two; a group is the more likely to be enormous.

453 of the 1,550 individuals clear 100 readers a day, against 162 of the 822 groups — 29.2%
against 19.7%, the same shape from the other end.

## Nobody in K-pop clears ten thousand

Not one of the 2,372 acts averages 10,000 readers a day. BTS, at 8,689, is the ceiling.

That is worth putting beside a figure from our own count last night. On the same API, over the
same 30 days, with the same bot filter, the most-read actor credited in a charting Korean title
averaged **10,835** a day. One actress out-reads every K-pop act in this panel, including BTS.

We are not claiming the actress is more famous than BTS. English Wikipedia reading is a narrow
instrument and a single title in the window can move one article a long way. What the two
numbers do establish is that the K-pop ceiling and the Korean-acting ceiling sit in the same
range, measured the same way — which is not what the export coverage of the two industries
would suggest.

## What this does not explain

Nothing here says why the stacking happens. Release timing, touring, label size and how long an
act has existed are all absent from this data, and each of them could produce the shape above.

The panel is also drawn from Wikidata occupations, which is why So Ji-sub — an actor with a
music credit — sits second in the overall list at 5,227 a day, and Steven Yeun sixth at 3,701.
We left them in. Taking them out would mean deciding who counts as a K-pop act, and that is a
judgement, not a measurement.

The largest gap is one the data simply cannot close: there is no field linking a group to its
members. Whether Jennie out-reads Blackpink, or V out-reads BTS, is not answered here. It is
unmeasured, and unmeasured is not zero.

**This is a count of readers, not a ranking of acts.**
