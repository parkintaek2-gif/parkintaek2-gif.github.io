---
title: "July is the thinnest month for K-pop idol birthdays, March the fullest"
category: stars
dek: "We counted 1,282 members of 263 K-pop groups. Put on a per-day footing, March runs at 1.20 times an even month and July at 0.70. Scattering the same birthdays evenly 10,000 times produced a gap that wide 1.2% of the time."
purpose: both
pubDate: 2026-09-04
dataAsOf: 2026-09-04T00:00:00+09:00
author: Newsroom
tags: ["kpop", "birthdays", "wikidata", "measurement", "groups"]
pages:
  - "/kpop-birthdays"
sources:
  - org: "Wikidata"
    api: "Date of birth (P569) for members of Korean idol groups, CC0. 263 groups, 1,581 member places, 1,295 distinct people with a date; 1,282 after removing 1 January"
    url: "https://www.wikidata.org/"
crossChecks:
  - "Months are not the same length, so every month is put on a per-day footing before comparison. February uses 28.2425 days, the leap-year average, not 28."
  - "1 January held 13 people, 3.67 times an average day. That is the date sources fall back on when only a birth year is known, so it is removed and the removal is shown. With it the chance figure is 1.6%; without it, 1.2%."
  - "A person who appears in two groups is counted once, by name. 1,581 member places reduce to 1,295 people."
  - "The noise test uses a fixed seed (20260904) so the 1.2% can be reproduced by anyone re-running the script."
---

Ask which month has the most K-pop idol birthdays and the honest first answer is that nobody has
counted. We hold birth dates for the members of 263 K-pop groups, so we counted.

**July is the thinnest month, March the fullest.**

## Why raw totals would have been wrong

February has 28 days and March has 31. Count heads and February loses by construction. So every
month here is put on a per-day footing first, and February uses 28.2425 days — the leap-year
average — rather than 28.

On that footing an even year gives every month **1.00x**. March comes out at **1.20x** and July at
**0.70x**. Between them sit ten months that mostly hug 1.00.

| Month | Members | Per day | vs an even month |
| --- | ---: | ---: | ---: |
| March | 131 | 4.226 | **1.20x** |
| February | 113 | 4.001 | 1.14x |
| January | 118 | 3.933 | 1.12x |
| August | 120 | 3.871 | 1.10x |
| November | 109 | 3.633 | 1.03x |
| October | 112 | 3.613 | 1.03x |
| December | 111 | 3.581 | 1.02x |
| May | 106 | 3.419 | 0.97x |
| April | 102 | 3.400 | 0.97x |
| September | 94 | 3.133 | 0.89x |
| June | 93 | 3.100 | 0.88x |
| July | 76 | 2.452 | **0.70x** |

The full table, with each month's share, is on [K-pop idol birthdays by month](/kpop-birthdays).

## Is a gap that wide just luck?

With 1,282 people spread across twelve months, some months will run ahead by chance. So we
scattered the same number of birthdays evenly across a year 10,000 times and asked how often the
gap between the fullest and thinnest month came out as wide as ours.

**It did 1.2% of the time.** That is below the 5% line we hold ourselves to, so the gap is not
explained by chance alone.

The test uses a fixed seed, 20260904, so the 1.2% is not a number you have to take on trust —
re-run the script and the same figure comes back.

## The date we had to remove first

Before any of that, one date had to come out.

**1 January held 13 people — 3.67 times an average day.** No month produces a spike like that on a
single date. It is the date records fall back on when only a birth year is known, so it counts
paperwork rather than births.

| Date | Members | vs an average day |
| --- | ---: | ---: |
| 1 January | 13 | 3.67x |
| 20 March | 11 | 3.11x |
| 1 August | 9 | 2.54x |
| 6 November | 9 | 2.54x |
| 15 October | 9 | 2.54x |
| 26 May | 9 | 2.54x |

Removing it moves January from 1.21x to 1.12x and hands the top spot to March. The chance figure
moves from 1.6% to 1.2%. The finding survives either way — but the table worth printing is the one
without it.

## What this does not say

It does not say why. Korean births are not evenly spread across the year either, and the way an
idol roster gets assembled — debut cohorts, agency intakes, which members reach an encyclopaedia
entry at all — could produce a gap of this size on its own. We did not separate those, and we are
not going to pretend the data can.

It also says nothing about any one person. This is a count of 1,282 people. A July birthday is not
rare, and a March birthday is not lucky. Roughly one K-pop member in seventeen was born in July
against one in ten for March, and that is the whole of it.

Members whose birth date is not recorded on Wikidata are not in the count. We hold 1,581 member
places across 263 groups; after collapsing people who appear in more than one group, and after
removing 1 January, 1,282 remain.
