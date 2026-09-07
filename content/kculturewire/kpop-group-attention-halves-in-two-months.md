---
title: "BigBang is back. For 651 Korean acts, attention halves two months after the peak"
dek: "We found every Korean act's single best month on English Wikipedia and counted what survived it. The median act fell below half within two months. One group held out 65. BigBang's own last peak halved in one."
category: stars
purpose: both
pubDate: 2026-09-07
dataAsOf: 2026-08-31T00:00:00+09:00
author: Newsroom
tags: ["kpop", "bigbang", "stray kids", "bts", "attention", "wikipedia", "comeback"]
pages:
  - "/group-afterlife"
sources:
  - org: "Wikidata"
    api: "SPARQL — P31/P279* Q215380 (musical group), P495 (country of origin) Q884"
    url: "https://query.wikidata.org/sparql"
  - org: "Wikimedia Foundation"
    api: "Pageviews REST API — en.wikipedia, all-access, agent=user, monthly, 2015-07 to 2026-08"
    url: "https://wikimedia.org/api/rest_v1/"
crossChecks:
  - "Every act is measured the same way: English Wikipedia, human traffic only (agent=user), whole months, the same window. The current month is excluded on every act because it is not finished."
  - "An act needs at least 24 usable months to enter the table. 46 of the 697 acts found had fewer and were dropped rather than counted as zero."
  - "A decline counts only if three consecutive months sit below half the peak, so a single quiet month cannot register as a fall."
limitation: "Wikipedia reading is a measure of looking something up, not of listening to it. An act can tour, sell out arenas and hold a fanbase while its encyclopedia article goes quiet, and a Wikipedia article also tends to be written up after an act becomes known, which flattens its earliest months. What this measures is the shape of public curiosity, not the size of an audience."
---

*BigBang is back*, the reviews of their Oakland shows said this week, and *still matters*.
That is a claim about attention, and attention is something we can count.

We took every Korean musical act with an English Wikipedia article, found the single month
in which each was looked up most, and counted what was left afterwards. 697 acts came back
from Wikidata; 651 had enough months to measure.

## The median act loses half of its best month within two months

| | |
| --- | ---: |
| Korean acts measured | **651** |
| Dropped for too few months — *not counted as zero* | 46 |
| Have fallen below half of their peak month | 625 |
| **Median months from peak to half** | **2** |
| Have not fallen below half | 26 |
| …of those, peaked in the most recent month, so had no time to fall | 5 |

Two months is not a long time, and it is not an artefact of small articles either. Among
the 94 acts whose peak month drew 50,000 reads or more, the median is also two months, and
35 of those 94 were already below half in the very next month.

Of the 26 acts that have not halved, only **eight** are a year or more past their peak.
The rest simply have not had time.

## BigBang halved in one month. That is the ordinary case

| Act | Peak month | Peak reads | August 2026 | Left | Peak to half |
| --- | --- | ---: | ---: | ---: | ---: |
| SuperM | 2019-10 | 1,083,688 | 4,816 | 0.4% | 1 month |
| BTS | 2021-06 | 1,010,083 | 260,085 | 25.7% | 13 months |
| Blackpink | 2020-10 | 889,189 | 140,881 | 15.8% | 1 month |
| SHINee | 2017-12 | 694,349 | 17,626 | 2.5% | 1 month |
| **BigBang** | **2025-01** | **288,936** | **70,134** | **24.3%** | **1 month** |
| Girls' Generation | 2018-01 | 318,400 | 45,764 | 14.4% | 1 month |
| Super Junior | 2017-11 | 267,836 | 16,696 | 6.2% | 2 months |

A very large peak buys nothing. SuperM's debut month is the biggest single month any
Korean act has had in this window — over a million reads — and the month after was already
below half. Today the article draws just under five thousand.

BigBang's last peak was recent: January 2025, 288,936 reads. It halved the following
month. What is unusual about BigBang is not the fall but where it stopped: 24.3% of peak
is high for an act nineteen months past it, and close to where BTS sits.

## One group is not like the others

| Act | Months from peak to half | Peak month | Peak reads | Left today |
| --- | ---: | --- | ---: | ---: |
| **Stray Kids** | **65** | 2020-09 | 155,819 | **51.5%** |
| INFINITE | 26 | 2015-07 | 85,079 | 4.0% |
| VIXX | 21 | 2015-11 | 63,350 | 6.0% |
| Mamamoo | 19 | 2019-12 | 103,450 | 22.1% |
| Seventeen | 14 | 2023-05 | 156,287 | 30.6% |
| Red Velvet | 14 | 2020-07 | 125,024 | 27.4% |
| BTS | 13 | 2021-06 | 1,010,083 | 25.7% |

Stray Kids peaked in September 2020 and did not drop below half until February 2026 —
**sixty-five months**, two and a half times the next longest run in this group, and they
are still at 51.5% of that peak today. Whatever the mechanism, no other act with a large
peak has held one anywhere near that long.

The finding is the size of the gap, not the order of the list. Second place is 26 months.

## The eight that never halved are mostly not idol pop

Bolbbalgan4, Achime, Target, Broccoli You Too?, 3rd Line Butterfly, les, Mot, Sinawe.
Sinawe's peak was in May 2020 and it still holds 53.2% of it seventy-five months later.

Most of these are rock and indie acts whose readership was never large enough to spike in
the first place. A flat line has no peak to fall from, and that is a real property of these
acts rather than a flaw in the count — but it means "never halved" and "still popular" are
not the same sentence.

## The same two months show up in dramas

We measured this separately, on different data and a different unit: for 26 Korean titles
with enough months to measure, the median time to lose half of their peak Wikipedia
readership was also **two months**. Groups and shows are not the same thing and the two
numbers are not added together — but the timescale of Korean cultural attention on the
English-reading internet appears to be about eight weeks, whatever the object is.

Comics are the exception that proves it. A Korean webtoon that becomes a drama is read
**fourteen times more** as a result, and a Japanese manga in the same position only 3.7
times. An adaptation *builds* attention. A comeback mostly spends it.

## Method

Acts came from Wikidata: anything that is a musical group or a subclass of one, with South
Korea as country of origin, that has an English Wikipedia article. Reads are monthly
English Wikipedia pageviews, all-access, human traffic only, from July 2015 to August 2026;
September 2026 is excluded on every act because it is not finished. The peak is the highest
single month. An act is counted as halved on the first month of three consecutive months
below half the peak, so one quiet month cannot trigger it. 46 acts had fewer than 24 usable
months and were dropped — not set to zero, because "too new to measure" and "nobody read
it" are different facts.
