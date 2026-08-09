---
title: "Three in five Korean film titles share their name with a foreign work. For series it is one in four."
dek: "We asked Wikidata which countries made something with each of our 397 chart titles. Films come back ambiguous 58.1% of the time, series 23.6%. Short names are the reason, and Korean films get short names — but that is not the whole gap."
category: screen
purpose: ads
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
  - "The three verdicts are produced by the build and sum to the panel: 227 names only Korean works carry, 149 shared with a foreign work, 21 that Wikidata gives no country for"
  - "Word counts are taken from the chart title as Netflix publishes it, so The Glory is two words and D.P. is one"
  - "The South Korea comparison uses Netflix's own Korean country chart over the same weeks, counted as distinct weeks per country rather than rows, because the source file repeats 1,179 of 34,172 panel rows"
excluded:
  - "Any claim that a shared title is the wrong title. Shared means the name alone cannot settle it, and for most of these the Korean work is plainly the one that charted"
  - "Any correction to the panel itself. Nothing has been removed on the strength of this measurement; what it produces is a queue for human review, and any removals will appear on our corrections page with the evidence"
  - "Hours. Netflix publishes viewing hours for its global lists only, so everything here is counted in titles and chart-weeks"
corrections:
  - date: 2026-08-08
    note: "Published against a 405-title panel; the panel is now 397. Within an hour of this piece going out we found eight titles that our own attribution query said no Korean work carries — Waterworld, Re/Member, Into the Storm, Wildflower, Feng Shui, Glorious Days, Long Live Love! and You and Me — and removed them. Every figure in this article moved: films are 58.1% rather than 59.9%, series 23.6% rather than 23.9%, and the review queue is 20 one-country titles rather than 25. Wildflower was named here as a clear miss and is now gone from the panel rather than queued in it. The direction of the finding did not change, which is the least interesting thing about it: the piece argued our film numbers are the soft ones, and seven of the eight removals were films (167 down to 160) and one was a series (238 to 237)."
---

Our Southeast Asia panel holds **397 Korean titles**. A title is in it because its English name matches
a Korean work in Wikidata. That rule can fail in exactly one way: another country made something with
the same name.

So we asked, for every title in the panel, which countries produced a film or series carrying exactly
that label.

| | Titles | Name shared with a foreign work |
| --- | ---: | ---: |
| Series | 237 | **23.6%** |
| Films | 160 | **58.1%** |
| Whole panel | 397 | 37.5% |

**Three in five of our film titles cannot be settled by name. For series it is fewer than one in
four.** Anyone using our film numbers is standing on much softer ground than anyone using our series
numbers, and until now we had not said so, because we had not measured it.

## The reason is length, mostly

Sort the same 397 titles by how many words are in the name and the pattern is not subtle.

| Words in the title | Titles | Name shared |
| --- | ---: | ---: |
| One | 99 | **73.7%** |
| Two | 131 | 41.2% |
| Three | 89 | 14.6% |
| Four or more | 78 | **11.5%** |

A one-word title is more than six times as likely to collide as a four-word one. *Carter*,
*Karma*, *Hunt*, *Believer*, *Ballerina* — each of those is a Korean work, and each is also the name
of something else, often several things.

Korean films get short names. The median film title in the panel is two words and 40% of them are a
single word; the median series title is three words and only 14.8% are one word. Series arrive with
names like *Extraordinary Attorney Woo* and *When Life Gives You Tangerines*, which nothing else in
the world is called.

## But length is not the whole gap

Hold the length fixed and the films are still worse.

| Words | Series shared | Films shared |
| --- | ---: | ---: |
| One | 57.1% (35) | **82.8%** (64) |
| Two | 32.1% (81) | **56%** (50) |
| Three or more | 8.3% (121) | **26.1%** (46) |

At every length, a Korean film's title is roughly 25 points more likely to be shared than a Korean
series' title of the same length. Short film names are not just short, they are drawn from a smaller
and more common pool — one-word abstractions, single names, ordinary nouns.

**This means our film panel is the part of our data most likely to contain something that is not
Korean, and it is the part we can least easily check.** It is also the smaller side: 160 titles against
237, and 449 chart-weeks against 1,810.

## A second ruler we had not used

Wikidata tells us a collision is possible. It cannot tell us which work actually charted. For that we
had one instrument sitting unused: **Netflix's own South Korea chart.**

A Korean title normally also plays in Korea. Of the 149 shared titles, **76 have never appeared on
Netflix's Korean top ten** in five years. Twenty of those charted in exactly one country in the
world, and fourteen of the twenty are films.

That list contains the clearest miss we have found since the title-matching correction:

- ***Impetigore*** charted for five weeks in Indonesia and nowhere else on earth. It is an Indonesian
  horror film. Wikidata has a Korean work of the same name, so our rule took it.
- ***The Lord Musang King*** charted for one week, in Malaysia. It is Malaysian.
- ***Wildflower*** charted for thirteen weeks, in the Philippines, in no other country, ever.

**One of those three is no longer in the panel.** Between this piece first publishing and this
revision we removed eight titles, *Wildflower* among them, for a reason stronger than the queue: our
own attribution query returned no Korean work at all for those exact names. *Impetigore* and *The
Lord Musang King* stayed, because Wikidata does list a Korean work of each name. Both are still in
the queue and both, we think, are the Indonesian and Malaysian films.

## Why we have not simply deleted the eighty-four

Because the same test also flags titles that are obviously Korean.

***Vagabond*** charted eight weeks in Vietnam and nowhere else, including not in Korea. It is a Korean
drama. ***Smugglers*** and ***Keys to the Heart*** are Korean films; neither ever reached Korea's own
top ten. A Korean title can miss the Korean chart for reasons that say nothing about where it was
made: it was released before July 2021 and had its run before this data begins, it was a cinema film
Netflix never streamed domestically, or it simply lost its week at home to something bigger.

**Absence from the Korean chart is a reason to look, not a verdict.** The measurement produces a
queue: 20 titles that charted in one country only, 19 more concentrated above half in a single
country, 37 that spread widely but never touched Korea. We will work down it and every removal will
appear on our corrections page with the evidence that moved it.

## What this changes about reading us

Two things, and we would rather you took them from us than found them yourself.

**Our series figures are the solid half.** 23.6% name ambiguity, and the biggest series in the panel
are Netflix originals whose names are unique.

**Our film figures carry real risk of contamination**, concentrated in one-word titles that charted
briefly in a single country. Those are also the smallest entries — the median flagged title stayed
two weeks — so the risk sits in the tail rather than the top. It is still there.

The one thing we can say without hedging is the size of what we do not know, which is what this piece
is. A panel that reported 397 titles and said nothing else would be a cleaner-looking number and a
worse one.

---

Every panel here carries its verification columns with it. [Read what is in the data and what is missing from it →](/data)
