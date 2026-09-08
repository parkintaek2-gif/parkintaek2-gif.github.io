---
title: "A piece asked if K-pop's new power fans are middle-aged. We can't measure age, so we tested the proxy"
dek: "Wikimedia publishes no reader age. It does publish device, which is often used as a proxy for one. Across 372 Korean acts, desktop share barely moves with debut era: 2.9 points from the 1990s to the 2020s."
category: stars
purpose: both
pubDate: 2026-09-08
dataAsOf: 2026-09-08T12:15:00+09:00
author: Newsroom
tags: ["kpop", "wikipedia", "audience", "device", "method", "attention"]
pages:
  - "/desktop-or-phone"
sources:
  - org: "Wikimedia Foundation"
    api: "Pageviews REST API — en.wikipedia, agent=user, monthly, 2025-09 to 2026-08. Fetched twice per act: access=desktop and access=all-access. Phone is the remainder, so it is mobile web plus the app together."
    url: "https://wikimedia.org/api/rest_v1/"
  - org: "Wikidata"
    api: "SPARQL — property P571 (inception), used only to place each act in a ten-year band."
    url: "https://query.wikidata.org/sparql"
crossChecks:
  - "The denominator was verified against a count made a day earlier for a different question. Desktop share is desktop reads over all-access reads, so a wrong denominator would produce a wrong share silently. We already held all-access totals for these acts from the member-versus-group collection, fetched them again today, and compared: 372 of 372 acts agree to within one percent, with a median difference of 0.0%. The well did not move under us."
  - "The flat result was tested a second time with the noisy acts removed. A percentage of a small number swings easily, so we repeated the comparison using only the 61 acts read at least 100,000 times in the window. The spread between decade bands stayed inside 2.8 points and the median moved by less than one point. If the flatness had come from small acts, this is where it would have broken."
  - "Eight acts were dropped rather than shown. Our floor is 1,000 reads in the window; below that a share moves on a handful of visits. The dropped acts are counted and named in the data file, not filled in as zero."
limitation: "This measures device, not age, not income and not location — Wikimedia publishes none of those, and nothing here is a claim about how old any audience is. Phone combines mobile web and the Wikipedia app because all-access minus desktop cannot separate them. Only the English Wikipedia is counted. And a device split says nothing about how somebody arrived: a reader on a phone may have come from a social post and a reader on a desktop from a search, and we cannot see either."
---

An English-language piece this week put a question that is genuinely interesting: are K-pop's
new power fans middle-aged Americans with money and time to spend?

We cannot answer it. Wikimedia publishes no reader age, and nothing below is a claim about
how old anybody is. But there is a reason to write this anyway, because **device** is the
thing people reach for when they want to talk about age without measuring it — phones for
the young, desktops for everyone else. Wikimedia does publish device. So we tested the
proxy.

## What the split actually is

For the twelve months to August 2026 we counted English Wikipedia reading for 372 Korean
acts twice over: once for desktop, once for everything. Phone is the remainder — mobile web
and the app together, which the data cannot separate.

| What we counted | Value |
|---|---|
| Acts measured | 372 of 380 |
| Reads in the window | 28,363,111 |
| Desktop, all reading added together | **32.4%** |
| Desktop for the median act | **34.2%** |
| Phone (mobile web plus app) | 67.6% |

Two numbers rather than one, because they answer different questions. Added together, the
biggest acts dominate; the median describes a typical act. The 1.8-point gap between them
says the very largest acts sit slightly further toward the phone than the rest.

## It does not move with debut era

If device tracked audience age at all, an act that debuted in 1997 should be read
differently from one that debuted in 2023. Here is every ten-year band holding at least ten
acts.

| Founded | Acts | Desktop share, median act |
|---|---:|---:|
| 1990s | 30 | 34.2% |
| 2000s | 62 | 37.0% |
| 2010s | 173 | 34.1% |
| 2020s | 34 | 35.7% |

The entire spread is **2.9 points**, and it does not even run in one direction — the 2000s
sit highest and the 2010s lowest, with the newest band in between. Across three decades of
debuts, that is flat.

## We tried to break it, and could not

A percentage of a small number is fragile, so the obvious objection is that the flatness
comes from hundreds of little acts whose shares wobble. We removed them: only acts read at
least 100,000 times in the window, 61 of them.

| Founded | Acts | Desktop share, median act |
|---|---:|---:|
| 2000s | 13 | 34.2% |
| 2010s | 24 | 32.5% |
| 2020s | 14 | 35.3% |

Still flat — 2.8 points, median 33.5% across all 61. This is where the finding should have
fallen apart, and it held.

## So what can be said

Only this, and it is worth having: **device is not a stand-in for the age of a K-pop
audience.** Anyone reading a desktop share as evidence about who a fandom is made of is
reading a number that does not vary with the thing they want it to vary with.

Whether the original claim is true, we do not know. It may well be. What we can say is that
the most easily available proxy for it does not support it, does not contradict it, and
should not be cited either way.

Individual acts do sit far apart — the ends of our list run from 3.2% desktop to 57.9% — but
read the reads column before building anything on that. The extremes are mostly acts with
small totals, which is exactly where a share stops meaning much. We print them anyway, on
the data page, with the totals beside them: [desktop or phone, and why it is not
age](/desktop-or-phone).
