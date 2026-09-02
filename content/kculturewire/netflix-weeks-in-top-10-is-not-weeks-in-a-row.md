---
title: "Netflix's \"weeks in top 10\" is not weeks in a row"
dek: "Every chart row carries a weeks-in-top-10 number. Across 500,340 rows it adds exactly one on every consecutive week — and after a gap it keeps counting 98% of the time. It is a cumulative tally, and reading it as a streak overstates runs."
category: titles
purpose: both
pubDate: 2026-09-03
dataAsOf: 2026-08-23T00:00:00+09:00
author: Newsroom
tags: ["netflix", "charts", "measurement", "method"]
pages:
  - "/weeks-counter"
  - "/exit"
sources:
  - org: "Netflix"
    what: "Tudum weekly Top 10, per-country lists, including the weeks-in-top-10 field on every row"
    api: "500,340 rows across 269 weeks and 93 markets, 2021-07-04 to 2026-08-23. Russia excluded — Netflix stopped publishing its list in February 2022"
limitations:
  - "Netflix publishes no documentation for this field. Everything here is inferred from how the number behaves across rows, not from a statement by Netflix."
  - "424 of 21,512 post-gap pairs restart the counter at 1 and we cannot explain them. Nothing else in the row separates them from the ones that continue."
  - "We measured behaviour inside the per-country files only. The global charts carry their own counter and we did not test whether it works the same way."
draft: false
---

Netflix's weekly top 10 files carry a field on every row: how many weeks that title has been in that
country's top 10. It appears in press write-ups as a streak — *twelve straight weeks in the top 10*.

It is not a streak. It is a **cumulative count**, and the difference is not small.

## What it does on consecutive weeks

We took every row of the per-country files — **500,340** of them, across 269 weeks and 93 markets —
and grouped them into cells: one title, with its season label, on one chart, in one country. That
gives **191,537** cells. Then we looked at every pair of rows in a cell that are one week apart.

There are **287,291** such pairs, and in **every single one** the counter goes up by exactly one.
Not 99.8%. All of them.

So on consecutive weeks the field behaves exactly as you would expect, which is why the streak
reading survives.

## What it does after a gap

Then we looked at the pairs that are **not** one week apart — a title left the chart and came back.
There are 21,512 of those.

| After a gap, the counter… | Pairs | Share |
| --- | ---: | ---: |
| continued from where it left off | **21,072** | **98%** |
| restarted at 1 | 424 | 2% |
| did something else | 16 | 0.1% |

**Ninety-eight per cent of the time it keeps counting.** A title that charted for six weeks,
vanished for four months and came back reappears at week seven — not week one.

Among Korean titles specifically, 1,250 of 1,314 post-gap pairs continue (95.1%) and 64 restart.

## Why this matters if you quote the number

Three things follow, and each one changes a sentence people write.

- **"25 weeks in the top 10" can be 25 weeks spread over two years.** The title may have been absent
  for most of the period between its first week and its last. The largest counter we found anywhere
  in the file is **133**; the largest on a Korean title is **72**.
- **It is per country and per chart.** All 191,537 cells begin at 1, so the number is not a world
  tally that arrives in each market — Vietnam's counter for a title and Malaysia's are independent.
- **Seasons are counted separately**, because Netflix lists them separately. A show in its second
  season starts again at 1 even though the show never left.

This is why every run length on this site is computed from the weeks themselves rather than read off
the field. When we say a Korean series holds a chart for a median of three weeks, that is three
consecutive weeks, measured by us. The two numbers are not interchangeable, and a comparison that
mixes them will make Korean titles look either much stickier or much less sticky than they are,
depending on which side of the comparison used which.

## The 424 we cannot explain

Two per cent of post-gap pairs do restart at 1. We do not know why.

Netflix publishes no note about this field, and nothing else in those rows — the season label, the
position, the gap length — separates them from the 21,072 that continue. It may be a different
ingestion path, a re-release, or a change in how a title is identified upstream. All three would look
identical here.

We are reporting the split rather than picking the explanation that reads best, and we are not
rounding the 2% away: if you are building anything on this field, 424 cells behave differently and
you cannot tell which ones in advance.

Every count above, with the row totals behind it, is on
[the weeks-counter page](/weeks-counter).
