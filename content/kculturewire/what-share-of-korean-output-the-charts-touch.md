---
title: "Netflix's Southeast Asia charts reach 30% of Korean series made since 2021, and 14% of the films"
dek: "Our panel never had a denominator. Wikidata records 782 Korean series and 1,120 Korean films from the chart era; 237 series and 160 films reached a Top 10. Series are twice as likely to be seen at all."
category: titles
purpose: both
pubDate: 2026-08-08
dataAsOf: 2026-08-08T00:00:00+09:00
author: Newsroom
tags: ["netflix", "korea", "measurement", "coverage", "film", "series"]
pages:
  - "/titles"
  - "/screen-split"
sources:
  - org: "Wikidata"
    api: "Works with country of origin P495 = Q884, split by type — film Q11424 and television series Q5398426 — counted whole, counted with a date, and counted from 2021 using publication date P577 or start time P580"
    url: "https://query.wikidata.org"
  - org: "Netflix"
    api: "Top 10 weekly country lists (Tudum) for Singapore, Malaysia, the Philippines, Thailand, Indonesia and Vietnam, 2021-07-04 to 2026-07-26"
    url: "https://www.netflix.com/tudum/top10"
crossChecks:
  - "The panel side of every ratio is read from the same file the site is built from, not recounted, so the numerator here cannot drift from the numerator on our other pages"
  - "The first version of this count used publication date alone and returned 84 chart-era series, fewer than the 237 in our own panel. A coverage share above 100% is impossible, which is how we found that series carry start time instead"
  - "The collector now refuses to publish any share above 100% and records it as empty, so the same error cannot reach a page silently"
excluded:
  - "Any claim that these are production totals. Wikidata records what someone wrote down; if more was made than is recorded, our share is lower than shown and never higher"
  - "The whole-catalogue shares as a measure of reach. Most of that catalogue predates the chart entirely, so 1.6% and 5.0% describe the archive, not the era"
  - "Any comparison between the chart-era rows and the whole-catalogue rows. The first counts only items carrying a date and the second counts everything, so they have different denominators"
  - "Documentaries, shorts, web series and anything Wikidata files under another class. Two classes are counted here and nothing else"
---

Every figure we publish about Korean titles on Netflix starts from the same place: **397 titles that
reached a Top 10** in six Southeast Asian markets. Until today we had never said what that is 397
*out of*.

A share without a denominator is not a share. So we counted one.

## What the charts touch

| | Recorded in Wikidata | Made since 2021 | Reached a Top 10 | Share of the chart era |
| --- | ---: | ---: | ---: | ---: |
| Television series | 4,752 | 782 | 237 | **30.3%** |
| Films | 10,233 | 1,120 | 160 | **14.3%** |

Roughly **three in ten** Korean series made since the charts began have appeared on one in Southeast
Asia. For films it is **fewer than one and a half in ten**.

Against the whole recorded catalogue the shares are 5.0% and 1.6%, but those numbers describe an
archive rather than a market: most of what Wikidata holds was made long before Netflix published a
weekly list, and a 1979 film had no chance to appear on one.

## The same asymmetry, again

A Korean series is **twice as likely** to reach a chart as a Korean film. That is not a new finding
here so much as the same finding arriving from a new direction. We have already measured that
[the median Korean series charts in 35 countries and the median film in
11](/article/korean-series-travel-films-do-not), and that
[films are far more likely to carry a name we cannot verify](/article/short-titles-are-where-we-cannot-check-ourselves).

Now we can add the step before both: **fewer films get onto the chart at all.** Whatever is
happening to Korean film abroad is happening at the door, not only after it.

**We are not going to tell you why.** Volume of Korean film output includes a long tail of small
releases that were never licensed to a streaming service in Southeast Asia, and nothing in these
counts separates that tail from a film that was available and simply not watched. Settling it needs
a distribution record we do not have.

## How we found our own mistake

The first version of this count asked Wikidata for a publication date (`P577`) and got **84** Korean
series from the chart era.

Our panel holds 237.

A coverage share cannot exceed 100%, so the error was in the denominator, not the panel: Korean
television series overwhelmingly carry **start time** (`P580`) rather than publication date. Counting
both fields raises the chart-era series from 84 to 782 and the ones with any date at all from 210 to
3,792.

The collector now refuses to emit a share above 100% and writes an empty cell instead. **The
impossible number was the only reason we looked**, and if it had been merely implausible rather than
impossible we would probably have published it.

## What this does not mean

Wikidata is a record of what somebody wrote down, not a census of what was made. Its 10,233 films are
a floor. If Korean cinema produced more than that — and it almost certainly did, once you count
releases nobody catalogued — then our 14.3% is **an upper bound that gets smaller**, never larger.

We would rather hand you a ceiling and say so than hand you a number and let you assume it is a
count.
