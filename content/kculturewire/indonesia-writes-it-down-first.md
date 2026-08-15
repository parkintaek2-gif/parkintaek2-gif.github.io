---
title: "One Wikipedia writes down Korean titles first, and it is not the biggest one"
category: titles
purpose: both
dek: "Across 25 Korean titles with an article on all four Southeast Asian Wikipedias, the Indonesian edition was first or joint-first 24 times and last not once. The Vietnamese edition is larger on every measure we checked."
pubDate: 2026-08-15
dataAsOf: 2026-08-15T00:00:00+09:00
author: Newsroom
tags: ["wikipedia", "southeast asia", "korea", "attention", "method"]
pages:
  - "/written-down-first"
sources:
  - org: "Wikipedia"
    api: "action=query&prop=revisions&rvdir=newer — the first revision of each article"
    url: "https://www.mediawiki.org/wiki/API:Revisions"
  - org: "Wikimedia"
    api: "Pageviews API, human traffic only, monthly — used to test each first-revision date"
    url: "https://wikimedia.org/api/rest_v1/"
  - org: "Wikimedia"
    api: "meta=siteinfo&siprop=statistics — articles, active editors and total edits per edition"
    url: "https://www.mediawiki.org/wiki/API:Siteinfo"
---

A Korean drama is released. Four Southeast Asian Wikipedias will eventually carry an article about
it. We wanted to know which one gets there first.

For 25 titles that have an article on all four, the answer is the same almost every time. The
Indonesian Wikipedia wrote first, or tied for first, on 24 of them. It came last on none.

| Wikipedia | First or joint-first | Came last | Median place |
|---|---|---|---|
| Indonesian | 24 of 25 | 0 | 1st |
| Vietnamese | 8 of 25 | 1 | 2nd |
| Thai | 1 of 25 | 12 | 3rd |
| Malay | 1 of 25 | 12 | 3rd |

Seven of the 25 are ties, which is why the first column adds up to more than 25. The one title
where the Indonesian edition was not first or joint-first is *Reborn Rich*, where the Vietnamese
article came earlier.

## The obvious explanation is wrong

A bigger encyclopaedia with more editors should cover anything sooner. That is the first thing to
check, and it does not survive contact with the numbers.

| Wikipedia | Articles | Active editors | Total edits |
|---|---|---|---|
| Vietnamese | 1,304,001 | 4,726 | 75,384,273 |
| Indonesian | 790,784 | 4,690 | 29,552,153 |
| Malay | 440,840 | 2,018 | 6,913,168 |
| Thai | 186,434 | 2,963 | 13,172,524 |

The Vietnamese Wikipedia is the largest of the four on all three measures — it has two thirds
again as many articles as the Indonesian one, and two and a half times as many edits. It writes
about Korean titles first eight times out of 25.

We can rule that explanation out. We did not measure what replaces it, and we are not going to
guess in print.

## The order is not just about who is first

If only the first place were fixed and the rest were noise, the median place of the other three
would be similar. They are not: Vietnamese sits second, Thai and Malay share third. Ten of the 25
titles arrive in the exact order Indonesia, Vietnam, Thailand, Malaysia; eight more swap only the
last two.

The gap from the first edition to the last is a median of 8 months. It runs from 0 — *Squid Game*,
which all four wrote up in September 2021 — to 83 months. That longest case is *Signal*: Indonesia
wrote it up, Vietnam followed two months later, Malaysia nine months later, and Thailand nearly
seven years after that.

| Title | Order of arrival | Spread |
|---|---|---|
| Signal | Indonesia · Vietnam +2 · Malaysia +9 · Thailand +83 | 83 months |
| Itaewon Class | Indonesia · Vietnam +4 · Malaysia +17 · Thailand +31 | 31 months |
| The King: Eternal Monarch | Indonesia · Vietnam +5 · Malaysia +8 · Thailand +31 | 31 months |
| Hotel del Luna | Indonesia · Vietnam +1 · Malaysia +4 · Thailand +29 | 29 months |
| Squid Game | Indonesia · Vietnam · Thailand · Malaysia | 0 months |

Remove any single title from the 25 and the median gap stays at 8 months. We check every median we
publish that way now, after one of ours moved by most of its own size and had to be corrected twice
in a day; the [method is here](/one-out).

## We checked our own dates before we used them

This whole article rests on one number per article: the date of its first revision. That number is
less solid than it looks.

A first-revision date says when an article has existed *under its current name*. Move an article
or merge it into another and the earlier revisions travel with it, leaving behind a date that can
be years too recent. Nothing in the data marks this. The date simply looks wrong and reads fine.

We found it by accident. The Korean Wikipedia's article on *Squid Game* reports a first revision of
January 2025, for a title from 2021.

The test turned out to be free. If we already know which months an article was read, and it was
read before its own first revision, then the article existed earlier and the date has been erased.
We ran that on every date we had: **153 dates could be tested, and none of them failed.** A further
83 could not be tested at all, because those articles have no month with any reading in our data.

The Korean Wikipedia is not in this article, and that is why. Its dates fail the one case we can
see, and we hold no Korean pageview data to check the rest against. An edition we cannot test is
not an edition we will publish.

## What this does not tell you

This counts when someone wrote an article, not when anyone read one. An audience can arrive long
before an encyclopaedia does, or never arrive at all. A title that reached Thailand's Wikipedia
seven years late may have been watched there the whole time.

It also covers 25 titles, not 59. A title with no article on one of the four editions is left out
completely rather than counted as arriving late — counting it would make an edition look slow for
a title it never covered at all.

And it says nothing about why. We know the order is not explained by how big the encyclopaedia is.
That is one explanation removed, not an explanation found.
