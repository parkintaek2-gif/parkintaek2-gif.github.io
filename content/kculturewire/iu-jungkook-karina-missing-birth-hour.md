---
title: "IU, Jungkook and Karina: a missing birth hour moved one chart by a whole day"
category: stars
genre: music
dek: "KLifeMap read the charts of IU, Jungkook and Karina without their birth hours. Trying all twelve hour branches moved one reading a day earlier. The cause was a 32-minute clock correction, not astrology. We say what stays unknowable."
pubDate: 2026-08-22
dataAsOf: 2026-08-22T00:00:00+09:00
author: Newsroom
tags: ["saju", "stars", "klifemap", "method", "kpop"]
pages:
  - "/star-signs"
  - "/born-on"
sources:
  - org: "KLifeMap"
    api: "Saju engine (sajuEngine.js), three-pillar reading; day pillars re-confirmed 2026-08-22 — English edition of the same engine"
    url: "https://klifemap.ai/saju.html?lang=en"
  - org: "KLifeMap"
    api: "The three readings as published, in Korean: star-iu-samju-saju, star-jungkook-samju-saju, star-karina-samju-saju"
    url: "https://klifemap.ai/content/star-iu-samju-saju"
  - org: "Wikidata"
    api: "Date of birth (P569), CC0"
    url: "https://www.wikidata.org/"
  - org: "K Culture Wire"
    api: "Zodiac-year spread of 1,047 Korean actors who reached a Netflix chart"
crossChecks:
  - "Every day pillar here was derived twice, by two separate programs written on different sides of the company: KLifeMap's engine and our own sixty-cycle table. 1993-05-16 returns 丁酉, 1997-09-01 returns 丙午, 2000-04-11 returns 己亥 in both."
  - "Both programs were anchored on two dates whose day pillars are widely published — 2000-01-01 (戊午) and 1949-10-01 (甲子) — and both return those."
  - "The twenty-four-hour sweep was run against KLifeMap's engine directly. Hours 1 through 23 return the same day pillar for all three people; only hour 0 differs."
excluded:
  - "We do not publish a four-pillar chart for anyone. Public profiles carry birth dates and almost never birth hours, so the hour pillar cannot be built from the public record."
  - "We do not extend KLifeMap's reading. What its engine output states is quoted; nothing is added to it."
  - "Karina's birth date is the one on her public record. We did not seek a birth hour for any of the three, and would not publish one if it were offered privately."
---

IU was born on 16 May 1993. Jungkook of BTS was born on 1 September 1997. Karina of aespa was born on 11 April 2000. Those three dates, and the fact that none of the three has a published birth hour, are the only things in this article that are not a reading.

## What the reading said

[KLifeMap](https://klifemap.ai/saju.html?lang=en), which sells saju readings in Korean, ran the three charts for us. Saju sets a birth moment out as four pillars of two characters each — year, month, day and hour — so a complete chart is eight characters. Without an hour, three pillars stand and the fourth cannot be built.

Its engine returned the day pillar 丁酉 for IU, 丙午 for Jungkook, and 己亥 for Karina. On the readings built from those three pillars, it reported that the balancing element it looks for came out the same across all twelve possible hours in each case: water for IU, wood for Jungkook, fire for Karina. Where the missing hour did change its output was elsewhere — for IU the engine split five hours to strong and seven to weak, and for Jungkook and Karina the classification of the chart's governing structure came out five and five different ways respectively.

That is KLifeMap's reading, not ours. We report it the way we would report any vendor's output, and we do not add a sentence to it.

## The hour nobody knows moved one chart by a day

The first version we were handed gave IU's day pillar as 丙申, one place back in the sixty-cycle from 丁酉 — a difference of exactly one day. We checked it before setting any of it in type, and the check is the part of this story worth keeping.

Our own sixty-cycle table returned 丁酉. So did KLifeMap's own engine when asked for the date alone. The disagreement only appeared when an hour was supplied, so we ran the engine across all twenty-four hours:

| Person | hour 0 | hours 1–23 |
|---|---|---|
| IU · 1993-05-16 | 丙申 | **丁酉** |
| Jungkook · 1997-09-01 | 乙巳 | **丙午** |
| Karina · 2000-04-11 | 戊戌 | **己亥** |

One hour in twenty-four disagrees, and it is the same hour in every case. The cause is written in the engine itself: it shifts a Korean clock time by 32 minutes to approximate true solar time at the longitude of Seoul. Midnight minus 32 minutes falls on the previous day, so a chart cast at exactly 00:00 is cast on the day before. KLifeMap had been representing the midnight branch by 00:30, which crossed that boundary; it now uses 23:45 and checks that all twelve candidates fall on the same date.

The correction changed one of its published figures. Jungkook's balancing element had been reported as wood in eleven of twelve hours with the midnight hour differing; with the boundary fixed it is wood in all twelve. The single outlier was the clock, not the chart.

## What none of this can tell you

This is a three-pillar reading, not a four-pillar one. Knowing the hour can change it, and for these three the hour is not public. That is the ordinary case rather than the exception: birth dates are published for almost every Korean public figure and birth hours for almost none.

And a count we published ourselves, on our own data: across 1,047 Korean actors who reached a Netflix chart, the spread across the twelve zodiac years is indistinguishable from chance — chi-square 7.77 against a threshold of 19.68. Being born in one year rather than another does not pick out who reaches a chart, and this article does not say otherwise.

Each reading is published in full, in Korean, by KLifeMap — [IU](https://klifemap.ai/content/star-iu-samju-saju), [Jungkook](https://klifemap.ai/content/star-jungkook-samju-saju) and [Karina](https://klifemap.ai/content/star-karina-samju-saju) — and readers who want to run their own date through the same engine in English can do that at [klifemap.ai](https://klifemap.ai/saju.html?lang=en). We have since written one article on each of the three: [IU](/article/iu-saju-water-in-all-twelve-hours), [Jungkook](/article/jungkook-saju-structure-splits-five-ways), [Karina](/article/karina-saju-structure-settled-in-half-the-cases).

What we can count — who shares a birth year with whom, and how flat that spread is — is at [kculturewire.com/star-signs](/star-signs).
