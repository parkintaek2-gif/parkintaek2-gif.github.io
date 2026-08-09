---
title: "A Netflix weekly top ten is not ten titles. One show has held seven of the places."
dek: "Across 493,600 country-chart rows, 18,586 weekly lists put one title in two or more places. Seasons explain 26,068 of the 26,093 extra rows. The 25 that are left are two different films sharing one name inside a single top ten."
category: screen
purpose: both
pubDate: 2026-08-08
dataAsOf: 2026-07-26T00:00:00+09:00
author: Newsroom
tags: ["netflix", "measurement", "data quality", "series", "film"]
pages:
  - "/titles"
  - "/reach"
sources:
  - org: "Netflix"
    api: "Top 10 weekly country lists (Tudum), every country Netflix publishes, 2021-07-04 to 2026-07-26. Each row carries week, country, list (Films or TV), rank, title, season and weeks-on-chart"
    url: "https://www.netflix.com/tudum/top10"
crossChecks:
  - "Every (country, week, list, rank) slot in the file holds exactly one title: 493,600 rows, 493,600 distinct slots, no rank claimed twice"
  - "No row in the file is a byte-for-byte repeat of another row, so nothing here is a download that ran twice"
  - "Adding season to the key takes the repeated titles from 26,093 rows to 25, which is what identifies seasons as the cause rather than a guess about it"
  - "The 25 remaining pairs were checked on Netflix's own weeks-on-chart column, which differs within 23 of them"
excluded:
  - "Hours. Netflix publishes viewing hours for its global list only; the country lists carry rank and nothing else, so everything here is counted in rows, slots and weeks"
  - "Any claim about which Inheritance or which Mummy is which. The file gives no year, no runtime and no identifier, so we can say two works are present and not which two"
  - "The two remaining pairs whose weeks-on-chart also match. We cannot separate them with anything in the file and we are not going to separate them with a guess"
---

Netflix publishes a top ten for each country each week, split into films and television. We hold
**493,600 of those rows**, from July 2021 to July 2026.

The file is clean in the way people usually check for. Every combination of country, week, list and
rank appears **exactly once** — 493,600 rows, 493,600 slots, no rank ever claimed by two titles. No row
is a byte-for-byte copy of another, so nothing here is a download that ran twice.

It is not clean in the way that matters for joining. **A title is not a key.**

## One name, several places

Take the title, the country, the week and the list — the four things you would naturally join on — and
**18,586 of those combinations hold more than one row**. That is 26,093 rows more than there are
distinct titles-in-a-list, or **5.29% of the file**.

| Places one title held in a single weekly ten | Times |
| --- | ---: |
| 2 | 13,264 |
| 3 | 3,629 |
| 4 | 1,251 |
| 5 | 395 |
| 6 | 44 |
| **7** | **3** |

It reaches **419 titles across 94 countries**. *Friends* took seven of Jordan's ten television places
in the week of 9 April 2023, and seven again the week of 22 May 2022; it took seven of Latvia's the
week of 11 September 2022. *The Rookie* held six of the Bahamas' ten for four consecutive weeks in
July 2025.

## Seasons explain almost all of it

Netflix charts seasons separately and prints the season in its own column. Add that column to the key
and the 26,093 extra rows fall to **25**. Seasons account for **26,068 of them** — 99.9%.

That is a fact about the product, not an error in the file. A viewer finishing one season and starting
the next is two things happening, and Netflix counts them as two. But it means the sentence *"the show
spent 40 weeks on the chart in Jordan"* is not a number you can read off a row count, and neither is
*"the country's ten most-watched shows"*. In the weeks above, Jordan's ten most-watched shows were
four.

We are exposed to this ourselves. Our Southeast Asia panel of Korean titles reads **34,172 rows** out
of this file, covering **32,993 distinct title-country-weeks**. Count rows and you get **1,179 more
than there are weeks**, an overstatement of 3.5%, concentrated on the titles with the most seasons —
*Squid Game* occupies three places in a single country's list in the weeks after its last season
landed. Every figure we publish counts distinct weeks for exactly this reason, which is also why our
numbers will not match a row count taken from the same file.

## The twenty-five that are left

Strip the seasons out and 25 pairs survive: same title, same country, same week, same list, **no
season on either row**. They are not seasons and they are not duplicate downloads. They are two
different films with the same name in one top ten.

| Title | Pairs | When |
| --- | ---: | --- |
| *Inheritance* | 21 | 23 June 2024, across Latin America and the Caribbean |
| *The Mummy* | 3 | August 2022, Latvia and Lithuania |
| *Cheaper by the Dozen* | 1 | 14 December 2025, Trinidad and Tobago |

Netflix's own weeks-on-chart column separates **23 of the 25**. In Chile that week, one *Inheritance*
sat at rank 2 in its fourth week on the chart and the other at rank 3 in its first. In Mexico they were
ranks 2 and 5, again a fourth week beside a first. A title cannot be in its first and its fourth week
at the same time, so these are two works.

The remaining two match on weeks-on-chart as well, and the file carries no year, no runtime and no
identifier. We can say two works are there. We cannot say which two, and we have not guessed.

## Why this is the whole problem in miniature

Most of our work on this data is spent on one question: [does a name identify a
work](/titles)? Netflix does not publish a country of production, so we match titles against Wikidata
by name, and we
[measure how often that name is shared with a foreign work](/article/short-titles-are-where-we-cannot-check-ourselves)
rather than assume it is not.

The usual objection to that worry is that it is an artefact of joining two datasets that were never
meant to meet. These 25 rows say otherwise. **The collision happens inside Netflix's own file, with no
join at all** — one country, one week, one list of ten, and the same six letters printed twice for two
different films.

If a name cannot separate two films in a single top ten, it cannot separate a Korean film from a
foreign one across five years and ninety-four countries either. That is why our panel carries a
[second column saying how sure we are](/reach), and why we publish the queue of titles we have not
settled instead of quietly settling them.
