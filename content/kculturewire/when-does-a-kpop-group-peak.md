---
title: "When does a K-pop group peak? Two years after debut — and only one in five peaks in its debut year"
dek: "For the 183 Korean acts whose whole career fits inside our measuring window, the median act's biggest month on Wikipedia came two years after debut. 35 peaked in year one. 20 waited six years or more."
category: stars
purpose: both
pubDate: 2026-09-07
dataAsOf: 2026-08-31T00:00:00+09:00
author: Newsroom
tags: ["kpop", "debut", "attention", "wikipedia", "rookie", "peak"]
pages:
  - "/group-afterlife"
sources:
  - org: "Wikidata"
    api: "SPARQL — P31/P279* of musical group, musical ensemble, girl group or boy band; South Korea by P495, P17 or P740; P571 inception. No wikibase:label service — it silently drops rows."
    url: "https://query.wikidata.org/sparql"
  - org: "Wikimedia Foundation"
    api: "Pageviews REST API — en.wikipedia, all-access, agent=user, monthly, 2015-07 to 2026-08"
    url: "https://wikimedia.org/api/rest_v1/"
crossChecks:
  - "The peak-timing figures use only acts that debuted in 2016 or later. Our reads begin in July 2015, so for an act that debuted earlier we cannot see whether its true peak came before our window — those 350 acts are excluded from this question rather than given a wrong peak."
  - "Debut year comes from Wikidata's inception property, not from our own reading of a discography. 533 of the 774 measured acts carry one; the rest are absent from the debut tables and are not guessed at."
  - "Every act is measured on the same unit: whole calendar months of English Wikipedia pageviews, human traffic only, current month excluded."
limitation: "A Wikipedia article is usually created and filled in after an act becomes known, which can push an act's measured peak later than its real one and makes very early months unreliable. This measures when public curiosity was highest, not when record sales or streams were."
---

The assumption behind a lot of writing about K-pop is that an act peaks fast: debut, a
burst of attention, then a long decline. We can check that, and for the acts we can watch
from the very beginning, it is wrong.

## Two years, not one

We measured 774 Korean acts on English Wikipedia, month by month, and found each one's
single biggest month. 533 of them carry a debut year in Wikidata. But our reads start in
July 2015, so for an act that debuted before then we cannot tell whether its real peak
happened before we were looking.

So this question uses only the **183 acts that debuted in 2016 or later**, whose entire
career sits inside the window. The other 350 are excluded, not given a made-up peak.

| Gap between debut year and peak month | Acts |
| --- | ---: |
| Peaked in the debut year itself | 35 |
| One to two years later | **72** |
| Three to five years later | 56 |
| Six years or more | 20 |

The median gap is **two years**. Only 35 of 183 — fewer than one in five — had their biggest
month in the year they debuted. 107 of them, a clear majority, peaked within two years,
but the tail is long: 20 acts did not reach their best month until at least six years in.

## Once the peak arrives, it goes the same way for everyone

Whenever the peak comes, what follows it is remarkably uniform. Across all 774 acts, the
median time to fall below half of the peak month is **two months**, and it barely moves by
generation:

| Debut years | Acts | Median months from peak to half |
| --- | ---: | ---: |
| 1990–1994 | 13 | 2 |
| 1995–1999 | 44 | 2 |
| 2000–2004 | 42 | 2 |
| 2005–2009 | 67 | 2 |
| 2010–2014 | 158 | 3 |
| 2015–2019 | 145 | 2 |
| 2020–2024 | 64 | 2 |

Thirty years of changing formats, platforms and fandom mechanics, and the shape of the fall
is the same. For acts that debuted before 2016 this is the fall from their highest month
*inside our window*, which may not be their career high — but the speed of the descent is
measured the same way for all of them, and it does not vary.

The only act that has genuinely broken this is Stray Kids, which took **65 months** to fall
below half of its September 2020 peak. The next longest is 26.

## What the two numbers mean together

Attention is slower to arrive than the debut-hype story suggests and faster to leave than
almost anyone plans for. An act typically spends two years getting to its biggest month and
eight weeks losing half of it.

The same eight-week figure turns up for Korean *titles*: 26 of them, [measured separately on
a different unit](/half-life), also halve in two months. Comics are the one place the arrow points the
other way — a Korean webtoon is [read **fourteen times more**](/webtoon-adaptations) after a drama is made from it,
because an adaptation brings new readers rather than spending existing ones.

## Method

Acts came from Wikidata: musical groups, musical ensembles, girl groups and boy bands (or
subclasses of one) tied to South Korea by country of origin, country, or place of formation,
with an English Wikipedia article. We do not use Wikidata’s label service, which drops
rows without saying so. Debut year is Wikidata's inception property;
533 of the 774 measured acts have one and no debut year was inferred. Reads are monthly
English Wikipedia pageviews, all-access, human traffic only, July 2015 to August 2026, with
September 2026 excluded because it is unfinished. An act counts as halved on the first of
three consecutive months below half its peak. The peak-timing table uses the 183 acts that
debuted in 2016 or later, because only for those can we be sure the window contains the
peak.
