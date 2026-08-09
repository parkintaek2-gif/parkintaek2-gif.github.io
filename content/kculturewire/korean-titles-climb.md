---
title: "Korean titles climb the Netflix chart after they arrive. Most other titles peak in week one."
dek: "Across 93 markets, 57.5% of Korean chart runs reach a higher rank than their opening week against 40.5% for everything else. Longer runs give more chances to climb — and the gap holds inside every run-length band."
category: screen
pubDate: 2026-08-08
dataAsOf: 2026-07-26T00:00:00+09:00
author: Newsroom
tags: ["korea", "netflix", "charts", "measurement"]
pages:
  - "/climb"
sources:
  - org: "Netflix"
    api: "Tudum weekly Top 10 country lists for every country Netflix publishes — 93 markets with a complete record, 265 weeks from 2021-07-04 to 2026-07-26, read at weekly rank level"
    url: "https://www.netflix.com/tudum/top10"
  - org: "Wikidata"
    api: "Country of origin (P495 = Q884) to identify Korean titles, with titles Netflix classes on its English-language global charts excluded"
    url: "https://query.wikidata.org"
crossChecks:
  - "A run is one title in one country on one list, not one title. Keying on the title alone would merge a show's separate runs in six countries into one, and would also merge two seasons charting side by side"
  - "Runs of a single week are excluded, because a run with one week cannot climb and counting it as 'did not climb' would be counting the calendar rather than the title"
  - "Climbed and peaked-in-week-one are exact complements, and the collector refuses to run unless they sum to the number of runs in every group it reports"
excluded:
  - "Any word for why. We can show that the rank improved; we cannot show that anyone recommended anything, and the piece does not use the phrase word of mouth as a finding"
  - "Viewing. A rank is a position against the other titles in that country that week, not a number of people"
  - "Russia, whose list Netflix stopped publishing in February 2022, so its runs cover a different window from every other market"
  - "Any claim that this is the largest such gap, or that Korean titles climb higher than others — we measured whether they climb, not how far"
---

A title enters a country's Netflix top 10 at some rank. The interesting question is what happens
next: is that week the highest it will ever sit, or does it move up?

Netflix publishes a rank per title per country per week, so this is answerable for every run on the
chart. We read **108,403 runs** — a run being one title, in one country, on one list — and asked
whether any later week beat the opening week.

## Korean titles climb. Most titles do not.

| | Runs | Climbed after week one | Peaked in week one |
| --- | ---: | ---: | ---: |
| Korean titles | 7,022 | **57.5%** | 42.5% |
| Everything else | 101,381 | **40.5%** | 59.5% |

A Korean title's opening week is its best week 42.7% of the time. For everything else on the same
charts, in the same weeks, it is 59.5%. **The typical non-Korean title arrives at its peak; the
typical Korean one does not.**

## The obvious objection, and what happens to it

Korean runs last longer — 4.9 weeks on average against 3.9 — and a longer run has more weeks in
which to beat its first. If that is all this is, the gap should vanish once we compare runs of the
same length.

| Run length | Korean climbed | Everything else | Gap |
| --- | ---: | ---: | ---: |
| 2 weeks | 39.7% | 30.7% | +9.0 |
| 3 weeks | 65.2% | 49.8% | +15.4 |
| 4–5 weeks | 63.3% | 47.1% | +16.2 |
| 6–10 weeks | 69.1% | 50.0% | +19.1 |
| 11 weeks or more | 81.7% | 58.0% | +23.7 |

It does not vanish in any band. The smallest gap is 8.8 points among two-week runs and the largest
is 23.5 points among the longest. **Length is not the explanation**, and among runs long enough for
the question to mean much the gap gets wider rather than narrower.

The same holds when the two formats are separated, which matters because Korean chart presence is
more heavily series than the field is:

| Format | Korean climbed | Everything else | Gap |
| --- | ---: | ---: | ---: |
| Series | 62.5% | 46.6% | +15.9 |
| Films | 47.1% | 37.1% | +10.0 |

Korean films climb less often than Korean series — 46.9% against 62.4% — but still more often than
non-Korean films. The gap is not an artefact of what Korea puts on the chart.

## What we are not saying

We are not saying this is word of mouth. That is the explanation everyone reaches for, ourselves
included, and this data cannot see it. A rank can improve because the title gained viewers or
because the titles above it lost them, and nothing here separates those.

We are also not saying Korean titles climb *higher*. We measured whether a later week beat the
opening week, not by how much. A run that goes from tenth to ninth counts exactly as a run that
goes from tenth to first.

What is left after both of those is still worth having, because it is a fact about the shape of
these runs rather than an impression: on the same charts, in the same weeks, measured the same way,
Korean titles are about **1.4 times as likely** to have their best week later than their first.

Every band and both formats are on [the climb table](/climb), with what it cannot answer printed
beside it. It reads the same 93-market panel as [the world-share page](/world-share), where the
share of places those runs add up to is counted.
