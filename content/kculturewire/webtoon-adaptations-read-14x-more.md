---
title: "A Korean webtoon is read 14x more once it becomes a drama. Japanese manga, 3.7x"
dek: "51 comics that Korean studios adapted, measured beside the adaptations. Korean webtoon sources were out-read in 16 of 18 cases, median gap 14x. Foreign sources — mostly Japanese manga — 3.7x, and won a third of the time."
category: titles
purpose: both
pubDate: 2026-09-07
dataAsOf: 2026-09-06T00:00:00+09:00
author: Newsroom
tags: ["webtoon", "manhwa", "k-drama", "adaptation", "manga", "wikipedia", "attention"]
pages:
  - "/webtoon-adaptations"
  - "/webtoon"
sources:
  - org: "Wikidata"
    api: "SPARQL — P144 (based on), P31/P279* Q1004 (comic), P495 (country of origin) Q884 (South Korea)"
    url: "https://query.wikidata.org/sparql"
  - org: "Wikimedia Foundation"
    api: "Pageviews REST API — en.wikipedia, all-access, agent=user, daily, 2026-08-08 to 2026-09-06"
    url: "https://wikimedia.org/api/rest_v1/"
crossChecks:
  - "Both sides of every pair are counted the same way: English Wikipedia, human traffic only (agent=user), the same 30 days. No bot traffic is included on either side."
  - "Pairs where either side has no English Wikipedia article are excluded rather than counted as zero. 145 adaptation pairs were returned; 51 had articles on both sides and are the ones measured here."
  - "Origin country comes from Wikidata P495 on the source work, queried separately from the pairing. All 51 sources carried a country, so none fall into an 'unknown' bucket."
limitation: "Wikipedia reading is a proxy for attention, not for viewership or sales. A drama on a global streaming service is easier to look up than a webtoon read inside a publisher's app, and that asymmetry is part of what this measures. The 30-day window also favours whatever aired recently."
---

Korean studios keep turning comics into television. The question nobody had put a
number on is which side of that trade gets the attention — the comic or the show.

We took every comic that Wikidata records as the source of an adapted work with a
Korean connection, kept the 51 pairs where both the comic and the adaptation have an
English Wikipedia article, and counted how often each was read over the same 30 days.
Human traffic only, same window, both sides.

## The adaptation usually wins. How much it wins by depends on where the comic came from

Of the 51 pairs, the adaptation was read more in 37. That much is unsurprising. The
split underneath it is not.

| Source of the comic | Pairs | Adaptation read more | Original read more | Median gap when the adaptation wins |
| --- | ---: | ---: | ---: | ---: |
| **Korean webtoon or manhwa** | 18 | **16 (89%)** | 2 | **14.0x** |
| Foreign — mostly Japanese manga | 33 | 21 (64%) | 12 | 3.7x |

A Korean webtoon that gets adapted is typically read **fourteen times** less than the
show made from it. A foreign comic in the same position is read 3.7 times less, and
in a third of cases it is read *more* than the Korean adaptation of it.

## The gap is not small at the top

| Adaptation | 30-day reads | Source comic | 30-day reads | Gap |
| --- | ---: | --- | ---: | ---: |
| Orange Marmalade (TV series) | 1,142 | Orange Marmalade | 14 | 81.6x |
| Dear X (TV series) | 25,027 | Dear X (webtoon) | 409 | 61.2x |
| All of Us Are Dead | 39,217 | All of Us Are Dead (webtoon) | 1,273 | 30.8x |
| Princess Hours | 17,352 | Goong (manhwa) | 661 | 26.3x |
| Priest (2011 film) | 49,415 | Priest (manhwa) | 2,835 | 17.4x |

*Orange Marmalade* is the clearest case: the webtoon was looked up 14 times in a
month. Fourteen. The drama made from it was looked up 1,142 times.

## Two Korean webtoons out-read their adaptations, and both are small

| Source comic | 30-day reads | Adaptation | 30-day reads |
| --- | ---: | --- | ---: |
| Girls of the Wild's | 739 | Sweet Combat | 661 |
| Yumi's Cells (webtoon) | 712 | Yumi's Cells: The Movie | 435 |

Neither is a case of a webtoon holding its own against a hit. Both sit under a
thousand reads. *Yumi's Cells* is the more interesting of the two, because the same
webtoon also has a television adaptation — and against **that** one the webtoon loses
16.8x. The film simply reached fewer people than the comic did.

## Where the foreign originals win, they win as themselves

The twelve cases where the source out-read the Korean adaptation are almost entirely
Japanese properties that were already famous before any Korean studio touched them.

| Source comic | 30-day reads | Korean adaptation | 30-day reads |
| --- | ---: | --- | ---: |
| Liar Game | 14,985 | Liar Game (2014 TV series) | 1,265 |
| Hana-Kimi | 12,198 | To the Beautiful You | 3,218 |
| Parasyte | 11,679 | Parasyte: The Grey | 7,320 |
| City Hunter | 9,208 | City Hunter (2011 TV series) | 4,926 |
| Nodame Cantabile | 3,779 | Naeil's Cantabile | 758 |

These readers arrived for the manga. The Korean version is the footnote.

## What this says about the two industries

Korean webtoons and Japanese manga are both comic industries, and both feed
adaptations. But they hand the adaptation a different starting position.

A Japanese manga brings an audience with it. A Korean webtoon, on the English-reading
internet, mostly does not — it acquires one *after* the drama airs. That is why the
median gap is 14x on one side and 3.7x on the other.

⚠ **This is a measure of looking things up, not of watching or reading them.** A
webtoon read inside a publisher's app leaves no Wikipedia trace; a drama on a global
streaming service invites one. Part of the 14x is that asymmetry rather than
indifference. What the number does show is where the *English-language curiosity*
sits — and it sits on the adaptation.

## Method

Wikidata returned 145 comic-to-adaptation pairs with a Korean connection. 94 were
dropped because one side or the other has no English Wikipedia article — dropped, not
counted as zero, because "no article" and "nobody read it" are different facts. The
remaining 51 were measured over 2026-08-08 to 2026-09-06, English Wikipedia, human
traffic only, both sides on the same days. Origin country was queried separately from
Wikidata P495; all 51 sources carried one.
