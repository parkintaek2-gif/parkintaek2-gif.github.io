---
title: "At number one a Korean title has a 1.2% chance of being gone next week. At number ten it is 70.3%"
category: screen
purpose: both
dek: "Everything written about a chart is about getting on it. We measured 11,779 departures instead — the position a Korean title held the week before it vanished, against the 10.0% each rank would take if position did not matter."
pubDate: 2026-08-09
dataAsOf: 2026-07-26T00:00:00+09:00
author: Newsroom
tags: ["korea", "netflix", "charts", "measurement", "limits"]
pages:
  - "/exit"
sources:
  - org: "Netflix"
    api: "Tudum weekly Top 10 country lists, 493,600 rows read, 2021-07-04 to 2026-07-26, 93 markets, Russia excluded"
    url: "https://www.netflix.com/tudum/top10"
  - org: "Wikidata"
    api: "Korean titles identified by item number and country of origin, using the same single rule as the rest of this publication"
    url: "https://query.wikidata.org"
crossChecks:
  - "Runs still on the chart in the last week we hold are counted and set aside rather than treated as departures, because our data ending is not a title leaving"
  - "A gap in a run is measured against the weeks that country's chart actually has, so a market missing a week is not read as a title disappearing and returning"
  - "Every rank from 1 to 10 holds exactly one place per country-week-chart, so the collector refuses to write unless the positions it read come out at 10.0% each — that check caught a real error before publication"
  - "Korean titles are compared against the positions their own weeks occupied, not only against an even split, because a group that sits low would produce bottom-heavy departures for that reason alone"
excluded:
  - "Russia, excluded across this publication because Netflix withdrew and the remaining weeks are not comparable"
  - "Markets with fewer than 40 measured departures, which cannot support a distribution"
---

Everything anyone publishes about a chart is about getting onto it. Openings, debuts, how many
countries at once, how high it went. We have published several of those ourselves.

Nobody measures the other end. So we did: for every Korean title in every market, **what position
was it in during the last week before it disappeared?** The full table, every position and every
market, is at [how a title leaves](/exit) — and the arriving end we have already published at
[does it arrive in one country or many](/arrival) and [is the week it enters its highest](/climb).

## The chart bottom is a trapdoor. The top is not.

A run is one title in one country across consecutive chart weeks. We found 12,026 of them. Of those,
**11,779 ended** — the other 247 are still on a chart in the last week we hold, and a run our data
outlives has not left, so they are set aside rather than counted.

Take every week a Korean title spent at a given position, and ask what share of those weeks turned
out to be its last:

| Position | Chance it is gone next week |
|---|---:|
| 1 | **1.2%** |
| 2 | 4.8% |
| 3 | 9.6% |
| 4 | 17% |
| 5 | 24% |
| 6 | 32.6% |
| 7 | 43.7% |
| 8 | 53.4% |
| 9 | 62.2% |
| 10 | **70.3%** |

A title at number one is almost never gone next week. A title at number ten is gone more often than
not. Between position 7 and position 8 the run crosses a coin flip.

**This is not the same as saying titles decline.** It says the bottom of a top 10 is not a low
position on a list — it is the edge of the list, and the difference between rank 9 and rank 10 is
worth more than the difference between rank 1 and rank 2.

## Where departures land, and the comparison that matters

Of the 11,779 departures, **56.8% happened from positions 8, 9 or 10.** If leaving had nothing to
do with position, that figure would be 30.0%, because every country-week-chart has exactly one
place at each rank. Only **5.2%** of departures happened from the top three.

There is an obvious objection, and it is the right one: Korean titles might simply sit near the
bottom of charts, in which case bottom-heavy departures would follow automatically and mean nothing.

They do not. **Korean titles spent 28.7% of their chart weeks in positions 8 to 10** — almost
exactly the 30.0% an even spread gives. They sit level; they leave from the bottom.

The same measurement for every title on these charts, Korean or not:

| | Korean titles | All titles |
|---|---:|---:|
| Departures from positions 8–10 | 56.8% | 51.2% |
| Departures from positions 1–3 | 5.2% | 7.3% |
| Weeks spent in positions 8–10 | 28.7% | 30% |

Korean runs end from the bottom **more** often than the chart average, and from the top less often.
Both groups sit level, so the gap is in how they leave, not where they were. A Korean title on these
charts is slightly more likely to slide out and slightly less likely to be pushed out while still
ranking well.

Entries look nothing like exits, which is worth stating plainly: **13.7%** of Korean runs began at
position 10 and **6.6%** began at position 1. Getting on a chart is spread across the whole list.
Leaving it is not.

## Markets differ, and not by quality

Across the 91 markets with at least 40 measured departures, the share leaving from the bottom three
runs from **68.9% in Argentina to 41.5% in Slovakia**.

| Highest | | Lowest | |
|---|---:|---|---:|
| Argentina | 68.9% | Slovakia | 41.5% |
| Indonesia | 68.7% | France | 44.3% |
| Norway | 66.7% | Luxembourg | 44.8% |

A market at the top of that list is one where titles slide out of the chart. A market at the bottom
is one where titles are pushed out while still ranking well — which is what happens where the chart
turns over quickly and something new arrives before the old title has finished falling.

**Neither is a better market.** They are different rates of replacement, and a plan built for one
will be wrong in the other: in Argentina an extra week of visibility is bought by holding position,
and in Slovakia it is bought by whatever is not arriving that week.

## What this cannot tell you

A departure from a top 10 is not a departure from Netflix. A title leaving from position 10 may have
lost almost no viewing; a title pushed out at position 3 may have lost none at all. Netflix
publishes no viewing figures for country charts, so nothing here measures how many people watched
anything.

It also cannot tell you *why* any single run ended. A new release, a holiday, a marketing push
somewhere else and a change in how Netflix ranks all look identical in a rank table.

**And one correction to our own method, made before publishing.** The first version of this count
keyed each run by country and title, which quietly merged two seasons of the same show when both
held places in the same week — Netflix lists them separately, and they are separate runs. It lost
25,987 rows. We caught it because the positions we had read came out at 9.28% to 10.56% instead of
10.0% each, which is impossible if a chart is read correctly. The collector now refuses to publish
unless that figure comes out flat, and it does.
