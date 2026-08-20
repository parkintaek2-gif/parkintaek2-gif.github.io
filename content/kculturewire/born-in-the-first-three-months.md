---
title: "Cha Eun-woo, Kim Tae-hee and 383 other Korean stars were born in January, February or March. We are not running it"
category: stars
dek: "Korean stars are born in the first quarter 1.31 times as often as in the third. The test clears its threshold by 0.24, and removing any one of those 385 people puts it back below. Here is the finding we did not publish, and why."
pubDate: 2026-08-21
dataAsOf: 2026-08-21T00:00:00+09:00
author: Newsroom
tags: ["wikipedia", "stars", "method", "zodiac"]
pages:
  - "/star-signs"
  - "/zodiac"
sources:
  - org: "Wikidata"
    api: "Names and dates of birth (P569), CC0"
    url: "https://www.wikidata.org/"
crossChecks:
  - "Expected counts were computed from the length of each month rather than by dividing by twelve, so February is not penalised for being short."
  - "The leave-one-out test was run on all 1,303 people individually, not on a sample; the 385 removals that break the result are exactly the January-to-March births."
---

Here is a headline we could have written this morning.

Korean actors and singers are born in January, February and March far more often than in July,
August and September — 385 against 293, a ratio of 1.31. Cha Eun-woo was born in March, Kim
Tae-hee in March, Park Ji-hoon in February, Park Min-young in March, Choi Woo-shik in March, Ma
Dong-seok in March.

We are not running it. This is the working.

## What we counted

1,303 Korean actors and singers with a date of birth on Wikidata. We compared how many fall in
each month against how many would fall there if birthdays were spread evenly — using the length of
each month, so February is not marked down for being short.

| Month | Stars | Expected | Difference |
| --- | --- | --- | --- |
| January | 138 | 110.6 | +27.4 |
| February | 118 | 100.8 | +17.2 |
| March | 129 | 110.6 | +18.4 |
| April | 104 | 107.0 | −3.0 |
| May | 108 | 110.6 | −2.6 |
| June | 94 | 107.0 | −13.0 |
| July | 106 | 110.6 | −4.6 |
| August | 91 | 110.6 | −19.6 |
| September | 96 | 107.0 | −11.0 |
| October | 112 | 110.6 | +1.4 |
| November | 100 | 107.0 | −7.0 |
| December | 107 | 110.6 | −3.6 |

The chi-square figure is **19.92**. The threshold for calling a twelve-way split uneven is
**19.68**.

It clears. By 0.24.

## Then we did the thing we always do

We remove one observation and look again. If a finding rests on any single person, it is not a
finding yet.

Of the 1,303 people, **385** can be removed one at a time to push the result back below the
threshold. And those 385 are not scattered: they are exactly the January, February and March
births. Take out Cha Eun-woo, or Kim Tae-hee, or any one of the other 383, and the result stops
clearing.

That is not a robust effect. That is a coin landing on its edge.

## The control we do not have

Even if it had cleared comfortably, it would not yet be a fact about stardom.

Births in the general Korean population are not spread evenly across the year either. To say
anything about performers we would need the national monthly birth series to compare against, and
without it a January bump among actors might be nothing more than a January bump among Koreans.

**We do not hold that series.** Not "it is unavailable" — we have not fetched it, and until we do,
this measurement cannot separate the two explanations. We are saying so rather than leaving the
gap where a reader would assume we had checked.

## Why publish the non-story

There is an established name for the shape we were hoping to see. The relative age effect —
described in Canadian junior hockey by Barnsley, Thompson and Barnsley in 1985, and reviewed
across domains by Musch and Grondin in 2001 — is the finding that people born early in a selection
year are over-represented among those who get selected. Korea's school year begins in March, which
is exactly the kind of cut-off that produces it.

That is a good hypothesis. It is not what we measured. What we measured is a distribution that
squeaks past a threshold and falls back the moment one person leaves the room, in a panel with no
control group attached.

The distance between those two sentences is the whole job.

The names, the twelve signs, and the other count that came out as chance are on
[which Korean stars share your zodiac sign](https://www.kculturewire.com/star-signs) and
[the year you were born](https://www.kculturewire.com/zodiac).
