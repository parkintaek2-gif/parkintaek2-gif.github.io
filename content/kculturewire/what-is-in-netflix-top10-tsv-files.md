---
title: "What is actually inside Netflix's Top 10 .tsv files — 501,040 rows, 94 countries, 269 weeks"
dek: "Netflix publishes two Top 10 data files. We counted what is in them so you do not have to download 30MB to find out: every column, the weeks and countries covered, and which columns are empty and how often."
category: titles
purpose: both
pubDate: 2026-09-05
dataAsOf: 2026-09-03T00:00:00+09:00
author: Newsroom
tags: ["netflix", "data", "tudum", "measurement", "reference"]
pages:
  - "/netflix-tudum-data-dictionary"
  - "/netflix-which-country"
sources:
  - org: "Netflix"
    api: "Public Top 10 data files, all-weeks-countries.tsv and all-weeks-global.tsv, downloaded 2026-09-03 and read line by line. We publish counts made from them, not the files"
    url: "https://www.netflix.com/tudum/top10"
crossChecks:
  - "We do not republish the files or quote sample rows. Every figure here is a count we made, which is our own measurement rather than a redistribution"
  - "An empty cell is a blank, N/A or NA. A literal 0 is not counted as empty, because folding zeroes and blanks together is what produces wrong totals from this data"
  - "Row counts, distinct titles, weeks and countries were each counted from the file itself rather than taken from any description of it"
  - "Our copy is dated 3 September 2026 and Netflix updates these files weekly, so the row counts here will drift. The date is printed beside every figure"
  - "This is a description of a file, not a claim about viewing. What a Top 10 file omits is stated in the piece rather than left implied"
---

Netflix publishes its Top 10 charts as two tab-separated files. People search for those file names
constantly — they are, by a wide margin, the most-searched thing that brings anyone to this site.

So here is what is in them, counted rather than described, so you can decide whether you need the
download.

## all-weeks-countries.tsv

| | |
|---|---:|
| Rows | 501,040 |
| Columns | 8 |
| Weeks | 269 (2021-07-04 to 2026-08-23) |
| Countries | 94 |
| Distinct titles named | 11,927 |

Columns: `country_name`, `country_iso2`, `week`, `category`, `weekly_rank`, `show_title`,
`season_title`, `cumulative_weeks_in_top_10`.

**Only one column is ever empty**: `season_title`, on 51.1% of rows — films and one-season shows
have no season to name.

## all-weeks-global.tsv

| | |
|---|---:|
| Rows | 10,760 |
| Columns | 9 |
| Weeks | 269 (2021-07-04 to 2026-08-23) |
| Distinct titles named | 3,428 |

Columns: the same, plus `weekly_hours_viewed`, `runtime` and `weekly_views`.

**Three columns have gaps**: `season_title` 51.5%, and `runtime` and `weekly_views` both 37.9%.

[The full column-by-column table is here](/netflix-tudum-data-dictionary).

## The two mistakes this data invites

**An empty cell is not a zero.** `weekly_views` is missing on 37.9% of global rows. Those titles were
in the Top 10 — the file just carries no view figure for them. Replacing those blanks with 0 and
summing is the commonest way to produce a confident wrong number from this file.

**A title missing from a country is not a title nobody watched.** These are top tens. A show that
placed eleventh produces no row at all. So any count of "countries where X charted" is a floor and
never a total. We say so on [every page of ours that uses it](/netflix-which-country), and it is worth
saying again here, because the file gives you no warning.

## What we do not do

We do not host the files or reproduce rows from them. They are Netflix's, and you download them from
[netflix.com/tudum/top10](https://www.netflix.com/tudum/top10). Everything above is a count we made
from our own copy, dated 3 September 2026 — Netflix updates the files weekly, so the row counts will
have moved by the time you read this.

---

*This describes a data file. It is not a measure of what anyone watched, and the file's own gaps are
listed above rather than smoothed over.*
