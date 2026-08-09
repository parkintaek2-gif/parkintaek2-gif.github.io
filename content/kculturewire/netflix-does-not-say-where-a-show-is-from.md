---
title: "Netflix never says where a show is from. Every count of Korean content on it is an inference — including ours."
dek: "The weekly charts carry nine columns and none is country of production. Match titles by name, as everyone must, and 17% of Korean viewing sits on names another country also uses. We measured the gap and publish its size."
category: screen
purpose: both
pubDate: 2026-08-07
dataAsOf: 2026-07-26T00:00:00+09:00
author: Newsroom
tags: ["netflix", "data", "korean drama", "method", "korea"]
pages:
  - "/watched"
  - "/screen-split"
  - "/corrections"
sources:
  - org: "Netflix"
    api: "Top 10 weekly global and per-country tables (Tudum). Column headers read verbatim from the published TSV files, 2026-08-04 download"
    url: "https://www.netflix.com/tudum/top10"
  - org: "Wikidata"
    api: "SPARQL query for the country of origin (P495) of every film and television series carrying each chart title as its exact English label"
    url: "https://query.wikidata.org"
crossChecks:
  - "The global table's nine columns are week, category, weekly_rank, show_title, season_title, weekly_hours_viewed, runtime, weekly_views and cumulative_weeks_in_top_10. The country table's eight are country_name, country_iso2, week, category, weekly_rank, show_title, season_title and cumulative_weeks_in_top_10. Neither carries a country of production"
  - "Of the 236 titles in our global Korean catalogue, 143 carry a title only Korean works use, 79 share it with a foreign work and 14 have no country recorded on Wikidata for any work of that name — 79.8%, 17.0% and 3.2% of the viewing hours"
  - "Across the wider set of 440 titles we assessed, 174 share a name. 95 of those never reached the global chart at all, and only 11 have drawn 100 million hours or more"
  - "Among the twenty most-watched titles in the catalogue, four carry a shared name"
excluded:
  - "Any claim that a shared name means the entry is wrong. For a title like The Glory a reader can settle it from context in a second; the point is that the data cannot, and that a machine counting at scale cannot either"
  - "Co-productions. A title Wikidata records as both Korean and American may be one work with two countries rather than two works with one name. Our method cannot separate those two cases and we have not tried"
  - "Titles whose English label on Wikidata differs from the label Netflix publishes. Those are invisible to this test in both directions, and we cannot count what we cannot match"
  - "Any suggestion that Netflix is obliged to publish a country field. It publishes more than most services publish at all, and this article is about what follows from the omission, not about whether the omission is wrong"
draft: false
---

Netflix publishes more about what people watch than any of its competitors. Every Tuesday it posts a global Top 10 with hours viewed, and a Top 10 for each of ninety-odd countries, going back to July 2021. Anyone can download the tables.

Here is every column in the global one:

> `week` · `category` · `weekly_rank` · `show_title` · `season_title` · `weekly_hours_viewed` · `runtime` · `weekly_views` · `cumulative_weeks_in_top_10`

And the per-country one:

> `country_name` · `country_iso2` · `week` · `category` · `weekly_rank` · `show_title` · `season_title` · `cumulative_weeks_in_top_10`

**Nothing in either says where anything was made.**

## So every count is an inference

"Korean content was watched X billion hours on Netflix" is a sentence that appears constantly — in trade press, in bank research notes, in government material. None of it can come from Netflix's data alone, because Netflix's data does not contain the word Korea in that sense anywhere.

What everyone does instead, ourselves included, is take a list of Korean films and series from somewhere else and match it against the chart **by title text**. It is the only join available. The chart gives a name and nothing else to join on.

That works until two countries make something with the same name.

## How often they do

We asked Wikidata, for every title in our Korean catalogue, which countries have produced a film or television series carrying that exact English name.

| | Titles | Share of Korean viewing |
| --- | ---: | ---: |
| Only Korean works carry this title | 143 | **79.8%** |
| A foreign work shares the title | 79 | **17.0%** |
| Wikidata records no country for the name | 14 | 3.2% |

Roughly **one hour in six** of what gets counted as Korean viewing sits on a title that at least one other country also made something called.

## That is not the same as one hour in six being wrong

Look at what the shared names actually are and the risk sorts itself into two piles.

At the top of the chart the collisions are obvious and harmless to a human. *The Glory* is shared with a Chinese work. *Business Proposal* with a Hong Kong one. *Little Women* with Japanese, British and American ones. Nobody reading a Korean-drama chart is confused about which *Little Women* spent eleven weeks on it — **but the data cannot tell you, and neither can a program counting 265 weeks of it.**

Further down, the names stop being resolvable at all:

| Title | Countries that have made something with this name |
| --- | ---: |
| *Desire* | 16 |
| *Rewind* | 14 |
| *Yesterday* | 14 |
| *Youth* | 13 |
| *Wonderland* | 13 |

Of the 174 shared-name titles across everything we assessed, **95 never reached the global chart at all** and only **11** have drawn 100 million hours or more. Among the twenty most-watched titles, four carry a shared name — and all four are ones a reader would resolve instantly.

**The ambiguity is real, and it is concentrated in small titles with ordinary English names.** Weighted by viewing it is 17%. Counted by title across our Southeast Asian panel it is 38.8%. Neither number is the true one on its own; they are the same test applied to two different populations, and the difference between them *is* the finding.

## Why this is worth publishing rather than quietly handling

We found this because we got it wrong first. Until 7 August our own catalogue counted 294 titles and 27.7 billion hours. Fifty-two of those titles were works Netflix classes on its English-language charts — *The Perfect Couple*, *Suits*, *Hit Man* — that are not Korean at all and had been swept in by name. The corrected figures are 236 titles and 23.7 billion hours, a cut of 14%, and every one of those corrections is [listed here](/corrections).

Having fixed the part that was fixable, the honest thing to do with the part that is not is to measure it and say how big it is. So every title in our data now carries a column saying which of the three it falls into, and every page that quotes a total says what share of it rests on names we cannot resolve.

One field in the source table would end the whole problem. Until it exists, every number published about Korean content on Netflix — ours included — carries an error bar that almost nobody states. Ours is 17%.
