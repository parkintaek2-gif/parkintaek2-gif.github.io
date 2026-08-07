---
title: "Three in five Korean film titles share their name with a foreign work. For series it is one in four."
dek: "We asked Wikidata which countries made something with each of our 405 chart titles. Films come back ambiguous 59.9% of the time, series 23.9%. Short names are the reason, and Korean films get short names — but that is not the whole gap."
category: screen
pubDate: 2026-08-08
dataAsOf: 2026-07-26T00:00:00+09:00
author: Newsroom
tags: ["netflix", "korea", "measurement", "data quality", "film", "series"]
pages:
  - "/titles"
  - "/screen-split"
sources:
  - org: "Netflix"
    api: "Top 10 weekly country lists (Tudum), every country Netflix publishes, 2021-07-04 to 2026-07-26. Our Southeast Asia panel is Singapore, Malaysia, the Philippines, Thailand, Indonesia and Vietnam"
    url: "https://www.netflix.com/tudum/top10"
  - org: "Wikidata"
    api: "For every chart title, the countries of origin (P495) of every film or TV series carrying exactly that English label"
    url: "https://query.wikidata.org"
crossChecks:
  - "The three verdicts are produced by the build and sum to the panel: 227 names only Korean works carry, 157 shared with a foreign work, 21 that Wikidata gives no country for"
  - "Word counts are taken from the chart title as Netflix publishes it, so The Glory is two words and D.P. is one"
  - "The South Korea comparison uses Netflix's own Korean country chart over the same weeks, counted as distinct weeks per country rather than rows, because the source file repeats 1,186 of 34,273 panel rows"
excluded:
  - "Any claim that a shared title is the wrong title. Shared means the name alone cannot settle it, and for most of these the Korean work is plainly the one that charted"
  - "Any correction to the panel itself. Nothing has been removed on the strength of this measurement; what it produces is a queue for human review, and any removals will appear on our corrections page with the evidence"
  - "Hours. Netflix publishes viewing hours for its global lists only, so everything here is counted in titles and chart-weeks"
---

Our Southeast Asia panel holds **405 Korean titles**. A title is in it because its English name matches
a Korean work in Wikidata. That rule can fail in exactly one way: another country made something with
the same name.

So we asked, for every title in the panel, which countries produced a film or series carrying exactly
that label.

| | Titles | Name shared with a foreign work |
| --- | ---: | ---: |
| Series | 238 | **23.9%** |
| Films | 167 | **59.9%** |
| Whole panel | 405 | 38.8% |

**Three in five of our film titles cannot be settled by name. For series it is fewer than one in
four.** Anyone using our film numbers is standing on much softer ground than anyone using our series
numbers, and until now we had not said so, because we had not measured it.

## The reason is length, mostly

Sort the same 405 titles by how many words are in the name and the pattern is not subtle.

| Words in the title | Titles | Name shared |
| --- | ---: | ---: |
| One | 102 | **74.5%** |
| Two | 133 | 42.1% |
| Three | 92 | 17.4% |
| Four or more | 78 | **11.5%** |

A one-word title is more than six times as likely to collide as a four-word one. *Carter*,
*Karma*, *Hunt*, *Believer*, *Ballerina* — each of those is a Korean work, and each is also the name
of something else, often several things.

Korean films get short names. The median film title in the panel is two words and 39.5% of them are a
single word; the median series title is three words and only 15.1% are one word. Series arrive with
names like *Extraordinary Attorney Woo* and *When Life Gives You Tangerines*, which nothing else in
the world is called.

## But length is not the whole gap

Hold the length fixed and the films are still worse.

| Words | Series shared | Films shared |
| --- | ---: | ---: |
| One | 58.3% (36) | **83.3%** (66) |
| Two | 32.1% (81) | **57.7%** (52) |
| Three or more | 8.3% (121) | **30.6%** (49) |

At every length, a Korean film's title is roughly 25 points more likely to be shared than a Korean
series' title of the same length. Short film names are not just short, they are drawn from a smaller
and more common pool — one-word abstractions, single names, ordinary nouns.

**This means our film panel is the part of our data most likely to contain something that is not
Korean, and it is the part we can least easily check.** It is also the smaller side: 167 titles against
238, and 464 chart-weeks against 1,823.

## A second ruler we had not used

Wikidata tells us a collision is possible. It cannot tell us which work actually charted. For that we
had one instrument sitting unused: **Netflix's own South Korea chart.**

A Korean title normally also plays in Korea. Of the 157 shared titles, **84 have never appeared on
Netflix's Korean top ten** in five years. Twenty-five of those charted in exactly one country in the
world, and eighteen of the twenty-five are films.

That list contains the clearest miss we have found since the title-matching correction:

- ***Impetigore*** charted for five weeks in Indonesia and nowhere else on earth. It is an Indonesian
  horror film. Wikidata has a Korean work of the same name, so our rule took it.
- ***The Lord Musang King*** charted for one week, in Malaysia. It is Malaysian.
- ***Wildflower*** charted for thirteen weeks, in the Philippines, in no other country, ever.

## Why we have not simply deleted the eighty-four

Because the same test also flags titles that are obviously Korean.

***Vagabond*** charted eight weeks in Vietnam and nowhere else, including not in Korea. It is a Korean
drama. ***Smugglers*** and ***Keys to the Heart*** are Korean films; neither ever reached Korea's own
top ten. A Korean title can miss the Korean chart for reasons that say nothing about where it was
made: it was released before July 2021 and had its run before this data begins, it was a cinema film
Netflix never streamed domestically, or it simply lost its week at home to something bigger.

**Absence from the Korean chart is a reason to look, not a verdict.** The measurement produces a
queue: 25 titles that charted in one country only, 19 more concentrated above half in a single
country, 40 that spread widely but never touched Korea. We will work down it and every removal will
appear on our corrections page with the evidence that moved it.

## What this changes about reading us

Two things, and we would rather you took them from us than found them yourself.

**Our series figures are the solid half.** 23.9% name ambiguity, and the biggest series in the panel
are Netflix originals whose names are unique.

**Our film figures carry real risk of contamination**, concentrated in one-word titles that charted
briefly in a single country. Those are also the smallest entries — the median flagged title stayed
two weeks — so the risk sits in the tail rather than the top. It is still there.

The one thing we can say without hedging is the size of what we do not know, which is what this piece
is. A panel that reported 405 titles and said nothing else would be a cleaner-looking number and a
worse one.
