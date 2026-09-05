---
title: "K-drama casting news is everywhere. It moved English reading in none of six cases"
dek: "We counted daily English Wikipedia reads for every performer named in a K-drama casting story, 14 days before against 7 days after. Four held level, two were read less afterwards, none rose. Six is a small number and we report it as six."
category: stars
purpose: both
pubDate: 2026-09-05
dataAsOf: 2026-09-04T00:00:00+09:00
issueAt: 2026-09-05T16:15:05+09:00
author: Newsroom
tags: ["korea", "kdrama", "casting", "wikipedia", "measurement", "press"]
pages:
  - "/casting-news-reading"
  - "/rookie-reading"
sources:
  - org: "Wikimedia"
    api: "Pageviews API, en.wikipedia, all-access, user agents only (bots excluded), daily, 30 days either side of each story date, per performer"
    url: "https://wikimedia.org/api/rest_v1/"
  - org: "Google News"
    api: "RSS search for K-drama casting stories. Dates and outlets are taken from the feed, not chosen by us"
    url: "https://news.google.com/rss"
  - org: "Wikipedia"
    api: "REST summary endpoint, used to confirm each name resolves to the performer and not to a similarly titled page"
    url: "https://en.wikipedia.org/w/api.php"
crossChecks:
  - "The day of the story is excluded from both windows. A single day contains hours before and after publication and belongs to neither side"
  - "Medians, not averages, on both sides. One large day would otherwise decide the comparison by itself"
  - "A change inside plus or minus 20% is recorded as level. Daily reading moves that much on its own, and calling a 5% drift a finding would be reporting noise"
  - "Only stories with a complete seven-day window after them are counted. Three more names are in the set and are named in the piece rather than dropped, because reporting only the cases that finished in time is choosing the answer"
  - "Six complete cases. We state the number every time we state the result, and we do not describe it as an industry pattern"
  - "No causal claim is made. Other things happen on the same days and this measure cannot separate them"
---

Casting news is the steady drumbeat of English-language K-drama coverage. A show is announced, a
name is attached, the story goes out. This morning brought another one: the South China Morning
Post's roundup naming Kim Mu-yeol, Jung Hae-in and others.

Something nobody counts: **does anyone go and read about the actor afterwards?**

We can count that, for one narrow definition of reading — how many people open the performer's
English Wikipedia page each day. So we took every casting story our collector held, took each name
in it, and compared the fortnight before with the week after.

## Six stories, none of them upward

| Performer | Story | Before | After | Change |
|---|---|---:|---:|---:|
| Doh Kyung-soo | 2026-08-22 | 292 | 316 | 1.08× |
| Lee Min-ho | 2026-07-04 | 1,397 | 1,512 | 1.08× |
| Lee Chae-min | 2026-08-08 | 811 | 826 | 1.02× |
| Kim Tae-ri | 2026-07-04 | 646 | 564 | 0.87× |
| Cha Eun-woo | 2026-08-22 | 2,699 | 1,901 | 0.70× |
| Roh Yoon-seo | 2026-08-08 | 2,687 | 1,186 | 0.44× |

Daily English Wikipedia reads, median. [The full table, with the cases still waiting, is here](/casting-news-reading).

Four sit inside the band we treat as level. Two are lower after the story than before it. **None
rose.**

## What that does and does not mean

It does not mean the stories were pointless, and we are not going to write that. Reading an
encyclopedia page is one narrow slice of paying attention, and it is the slice we happen to be able
to count. Somebody who reads the casting story, notes the name and waits for the show has done
everything the story asked of them and produced no row in our data.

What it does mean is narrower and, we think, more useful:

**A casting announcement is smaller than the ordinary week it lands in.** Roh Yoon-seo's reading
halved across that fortnight. We do not know why — our data holds counts and dates, not reasons —
but whatever was moving it was much larger than anything the announcement added. The same is true
in the other direction for the three that rose slightly.

If the press cycle were driving English-language attention, six stories would not all land inside
the noise.

## Six is six

We are publishing a result from six cases, and we are not going to dress it as more than that. The
honest version of this finding is: *in the six K-drama casting stories we have measured completely,
none was followed by a rise in English reading of the people named.*

Three more names are in the set without a complete window — Kim Mu-yeol and Jung Hae-in from this
morning, and Kim Ji-won from 31 August with four of seven days so far. They are
[listed on the page](/casting-news-reading) rather than dropped. A measure that quietly reports only
the cases that finished in time is a measure that picked its own answer.

We will add each new casting story to this table as it comes through, and the count will get less
small.

---

*This counts people who opened an English Wikipedia page. It says nothing about audiences in Korea,
about the shows themselves, or about anyone's career.*
