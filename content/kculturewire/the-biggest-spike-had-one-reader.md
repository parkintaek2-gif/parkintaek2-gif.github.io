---
title: "The month's biggest Korean-star spike started from one reader"
dek: "We ranked 3,253 Korean stars by the same surge measure a trending list uses. The top result rose 654x — from one English Wikipedia reader in week one to 654 in week four. Put a floor under it and the top falls to 6.26x."
category: stars
purpose: both
pubDate: 2026-09-04
dataAsOf: 2026-08-22T00:00:00+09:00
author: Newsroom
tags: ["korea", "kpop", "actors", "wikipedia", "measurement"]
sources:
  - org: "Wikimedia"
    api: "Pageviews API, en.wikipedia, all-access, user agents only, 2026-07-24 to 2026-08-22; surge is the last seven days of the window divided by the first seven, computed by our collector at collection time and left untouched here"
    url: "https://wikimedia.org/api/rest_v1/"
  - org: "Wikidata"
    api: "Two panels merged by name — Korean music acts, and actors credited in Korean titles that reached a Netflix Top 10"
    url: "https://www.wikidata.org/"
crossChecks:
  - "The two panels hold 2,372 and 1,113 rows. 232 names appear in both, and for all 232 the daily figure is identical because both came from one API call pattern over one window. Merging by name leaves 3,253 people; adding the panels would have counted those 232 twice"
  - "The surge formula was read out of the collector, not inferred from the field name. Our first draft described it as peak-day over average, which the data contradicted: one act had 61 a day, a 234 peak and a 654 surge"
  - "The denominator is printed beside every multiple in this piece, recovered as last-seven divided by the surge, so a reader can see whether a large multiple came from a large or a tiny base"
  - "Acts whose first seven days held zero views have a null surge in the source, not a division by zero, so they are absent from these rankings rather than ranked infinitely high"
  - "3,250 of the 3,253 people carry a surge figure. The three without one are excluded and counted, not filled in"
excluded:
  - "Why any of these rose. Releases, castings, awards, scandals and deaths all produce the same shape in this data, and none of them are in it"
  - "Korean-language attention. English Wikipedia is one edition"
  - "Weekday patterns. The window is 30 days, so each weekday occurs four or five times, which is too few to separate a pattern from noise"
  - "Whether a spike lasted. This compares two seven-day blocks a month apart and says nothing about the shape between them"
  - "Anything after 2026-08-22, the last day of the window"
---

Every trending list has a denominator, and almost none of them show it.

We built one on purpose. Wikimedia publishes daily English Wikipedia readers; we hold 3,253
Korean stars — music acts and actors credited in charting Korean titles, merged by name — and
for each one a surge figure computed the ordinary way: **the last seven days of a 30-day window
divided by the first seven.**

Ranked that way, the biggest riser among Korean stars in the month to 22 August is Choi Yu-jin,
up **654x**.

Here is the denominator. In the first week of the window her English Wikipedia article was
opened **once**. In the last week, 654 times.

## Move the floor and the winner changes

The only thing that separates a 654x from a 6x here is how few readers you allow at the bottom.

| Minimum daily readers | People left | Biggest surge | From | To |
|---|---:|---|---:|---:|
| none | 3,250 | Choi Yu-jin, 654x | 1 | 654 |
| 100 | 1,079 | Choi Yu-ju, 36.4x | 149 | 5,424 |
| 1,000 | 109 | Ha Young, 6.26x | 11,957 | 74,850 |

Three different names, three different orders of magnitude, one dataset and one formula. The
multiple falls from 654 to 6.26 as the floor rises, and the number of actual readers gained
rises the whole way: 653 more reads in the top row, 62,893 more in the bottom one.

**The largest multiple in the month belongs to the smallest event in it.**

Choi Yu-jin and Choi Yu-ju are different people, and they land at the top of two different
floors — a reminder that near-identical romanisations sit next to each other in this kind of
list and are easy to conflate.

## What a floor of 1,000 leaves

At the top floor only 109 of 3,253 people remain, and the ranking becomes boring in the way
that useful rankings often are. Ha Young leads at 6.26x, going from 11,957 reads in the first
week to 74,850 in the last. Jung Hae-in follows at 5.93x. BigBang, at 3.25x, is the highest
group.

Nobody at this floor gains readers by a multiple you would put in a headline. They gain them by
the tens of thousands.

## A second measure, and it disagrees politely

Comparing the last seven days to the 30-day average instead of to the first seven days gives a
gentler reading of the same month. Among the 472 people averaging 300 readers a day or more:

- Hong Min-gi at **3.59x** the month's own average in the final week
- Go Ara at **3.30x**
- Tarzzan at **2.62x**, Choi Yu-ju at 2.57x, NCT 127 at 2.24x

And falling, on the same measure: Park Bo-kyung at **0.17x**, Jin Seon-kyu at 0.25x, Cha
Ye-ryun at 0.37x — each of them still reading in the hundreds or thousands a day, but well
below where the month put them on average.

Neither measure is the right one. They answer different questions: one asks how the last week
compares to the first, the other asks how it compares to the whole month.

## How to read any surge number, including ours

Three questions settle most of it.

1. **What was the base?** A multiple built on one reader is not evidence of anything.
2. **Where is the floor?** If the list does not say, the top of it is probably a small number
   that moved.
3. **What is the window?** Ours is 30 days, split into two sevens with 16 days in between that
   this measure never looks at.

We also nearly got our own formula wrong. Our first draft of this piece described the surge as
the peak day divided by the daily average. The data refused: one act had 61 readers a day, a
peak of 234, and a surge of 654. Reading the collector settled it. **A field name is not a
definition.**

**This is a count of readers, not a ranking of stars.**
