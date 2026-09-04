---
title: "Wikipedia renamed Jungkook. 72% still arrive at the old name"
dek: "English Wikipedia moved his article to Jung Kook in March 2025. Seventeen months on, 4.09m of the 5.77m reads about him land on the old title. Of the 30 most-read Korean stars, only he is reached mostly by a dropped name."
category: stars
purpose: both
pubDate: 2026-09-05
dataAsOf: 2026-09-01T00:00:00+09:00
author: Newsroom
tags: ["korea", "kpop", "bts", "wikipedia", "measurement"]
pages:
  - "/streak-vs-read"
sources:
  - org: "Wikimedia"
    api: "Pageviews API, en.wikipedia, all-access, user agents only, monthly, 2023-06-01 to 2026-09-01, summed per title"
    url: "https://wikimedia.org/api/rest_v1/"
  - org: "Wikipedia"
    api: "MediaWiki API — action=query&redirects=1 to find each person's article, prop=redirects&rdlimit=max for every redirect pointing at it, and list=logevents&letype=move for the date a title was moved"
    url: "https://en.wikipedia.org/w/api.php"
crossChecks:
  - "The rename date is read from Wikipedia's own move log, not inferred: Jungkook to Jung Kook on 2025-03-15. We do not describe it as recent or long ago without that date beside it"
  - "Redirect reads are not double counting. The pageviews API records a request to a redirect title under that title, so a person's reads are split across titles until they are summed"
  - "Only namespace 0 titles are summed. Talk pages and user pages carry the same words and would inflate a person's total"
  - "The measure is a share, so it does not reward being widely read. J.Y. Park at 329,604 total reads and Jungkook at 5,766,465 are compared on the same scale"
  - "30 people, all measured — no one was dropped for missing data. Every person's title count is printed so a low share can be told apart from a thin count"
  - "This started as a defect in our own work. Counting only main articles made two other people look six to twelve times less read than they are, which is what sent us looking at redirect traffic in the first place"
excluded:
  - "What anyone typed into a search box. We can see which page title a reader arrived at, not the words they searched"
  - "Search engines that resolve an alternative spelling to the main article. Those arrivals are counted as main-article reads, so redirect shares here are floors"
  - "Whether either spelling is correct. Wikipedia's naming rules are its own, and this piece takes no position on them"
  - "Popularity. This is which spelling readers arrive at, not how many people like someone"
  - "Other language editions. English Wikipedia is one of many, and romanisation differs in each"
  - "Anything after 2026-09-01, the last month in the window"
---

English Wikipedia moved the article about BTS's youngest member on **15 March 2025**. It had been
at *Jungkook*; it became *Jung Kook*. The old title stayed behind as a redirect, which is what
Wikipedia always does, and the world went on typing it.

Seventeen months later, here is where the reading actually lands.

| Title | Reads, June 2023 to September 2026 |
|---|---:|
| Jungkook — the old title, now a redirect | 4,089,795 |
| Jung Kook — the article | 1,608,357 |
| 20 other redirects | 68,313 |
| **All titles** | **5,766,465** |

**72.1% of the reading about him arrives at a name the encyclopedia stopped using**, and the old
title out-reads the new one by 2.5 to 1.

## He is the only one of thirty

We took the 30 most-read Korean stars we hold, asked Wikipedia's API which article each name
resolves to and what redirects point at it, and summed the reads for every title. That is 30
people and several hundred titles.

For 29 of them the answer is dull, which is the finding. The median share arriving by redirect is
**0.2%**. Readers land on the article title itself.

| Person | Titles counted | Share arriving by a redirect |
|---|---:|---:|
| Jungkook | 22 | 72.1% |
| Jun | 7 | 48.5% |
| J.Y. Park | 14 | 32.3% |
| Suga | 16 | 16.2% |
| RM | 10 | 9.2% |
| Kim Seok-jin | 21 | 8.5% |
| *median of all 30* | — | **0.2%** |
| Park Ji-hyun | 3 | 0% |
| Pom Klementieff | 2 | 0% |

Only one person in the thirty is read mostly through a name that is no longer the article's.

## What a redirect share is actually measuring

A high share means the name a reader knows and the name the encyclopedia chose are not the same
string. Three things produce that, and they look identical in this data.

A **rename** is one: the article moves and the traffic does not follow, which is Jungkook's case
and the only one here with a move log entry to prove it.

A **stage name against a legal name** is another. Jun sits at 48.5% because the article is under
one form of his name while readers arrive through several others. Nothing was renamed; the names
simply coexist.

**Romanisation** is the third. Korean names reach English in more than one spelling, and readers
type the one they saw first.

The share cannot tell these apart on its own. The move log can, for the first kind, and that is why
we looked it up rather than describing the rename as recent or long-standing from memory.

## Why we were counting redirects at all

This began as a mistake in our own work.

Building a different piece two days ago, we counted each member's reads from their main article
alone. RM came out at 184,204 reads and Suga at 354,555 — six to twelve times below their real
figures, because we had asked for the wrong titles and because most of their traffic was sitting
under redirects we never requested. The numbers looked wrong next to their neighbours, which is
the only reason we checked.

The fix was to stop naming titles ourselves and ask the API for the full redirect list. Doing that
across thirty people produced this piece: **the discarded half of the data turned out to hold a
measurable fact about how people search for Korean names.**

Redirect traffic is normally thrown away. For 29 of these 30 people, throwing it away costs almost
nothing. For one, it loses 72% of him.

The seven-member table this grew out of, and everything that measure cannot say, is on
[the page behind it](/streak-vs-read).
