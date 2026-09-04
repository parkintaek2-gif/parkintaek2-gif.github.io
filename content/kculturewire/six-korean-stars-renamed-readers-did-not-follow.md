---
title: "Six Korean stars were renamed on Wikipedia. Readers followed none of them"
dek: "English Wikipedia has moved six of the 100 most-read Korean stars to a different name in the last two years. In every one, the old title still takes most of the reading — 72% to 94% of it, four to 22 months on."
category: stars
purpose: both
pubDate: 2026-09-05
dataAsOf: 2026-09-01T00:00:00+09:00
author: Newsroom
tags: ["korea", "kpop", "actors", "wikipedia", "measurement"]
pages:
  - "/streak-vs-read"
sources:
  - org: "Wikimedia"
    api: "Pageviews API, en.wikipedia, all-access, user agents only, monthly, 2023-06-01 to 2026-09-01, summed per title"
    url: "https://wikimedia.org/api/rest_v1/"
  - org: "Wikipedia"
    api: "MediaWiki API — action=query&redirects=1 for each person's article, prop=redirects&rdlimit=max for every redirect pointing at it, and list=logevents&letype=move for the date and direction of each rename"
    url: "https://en.wikipedia.org/w/api.php"
crossChecks:
  - "Every rename date and direction is read from Wikipedia's own move log, not inferred from the spelling. All six have a log entry naming the old title, the new title and the day"
  - "The six were not chosen. They are every person among the 100 whose reading arrives mostly at a title other than the article's, and each turned out to have a move log entry"
  - "Redirect reads are not double counting: the pageviews API records a request to a redirect under that redirect's own title, so a person's reads are split across titles until summed"
  - "Only namespace 0 titles are summed. Talk and user pages are excluded"
  - "We published a narrower version of this at 30 people earlier today and said one person was affected. At 100 people it is six. The earlier figure was right for 30 and is superseded here"
  - "Lee Jun-ho's move removed a disambiguator rather than changing the name. We say so rather than filing it with the spelling changes, because internal links, not typing, may explain his share"
excluded:
  - "What anyone typed into a search box. We see the page title a reader arrived at, not their query"
  - "Search engines that resolve an old spelling straight to the new article. Those arrivals count as new-title reads, so every share here is a floor"
  - "Whether any rename was correct. Wikipedia's naming rules are its own and this piece takes no position on them"
  - "Why each article was moved. The log gives the date and the titles, not the argument"
  - "Popularity. This is which title readers land on, not how many people like someone"
  - "Other language editions, and anything after 2026-09-01"
---

English Wikipedia renamed the article about IU on 7 June 2025, moving it from *IU (singer)* to
*IU (entertainer)*. Fourteen months later, **75.1%** of the reading about her still arrives at the
old title.

She is not the exception. We took the 100 most-read Korean stars we hold, asked Wikipedia which
article each name resolves to and every redirect pointing at it, and summed the reads for each
title separately. Six of the hundred are read mostly through a title the encyclopedia no longer
uses — and all six turn out to have been renamed.

| Person | Where readers land | Where the article is now | Renamed | Months since | Share on the old title |
|---|---|---|---|---:|---:|
| Im Yoon-ah | Im Yoon-ah | Lim Yoona | 2026-02-10 | 6 | 93.5% |
| Kim You-jung | Kim Yoo-jung | Kim You-jung | 2025-12-09 | 8 | 88.2% |
| Danielle Marsh | Danielle Marsh | Danielle (singer) | 2026-04-03 | 4 | 88.2% |
| IU | IU (singer) | IU (entertainer) | 2025-06-07 | 14 | 75.1% |
| Lee Jun-ho | Lee Jun-ho (entertainer) | Lee Jun-ho | 2024-10-07 | 22 | 73.6% |
| Jung Kook | Jungkook | Jung Kook | 2025-03-15 | 17 | 72.1% |

For the other 94, this barely happens. **The median share arriving through any redirect is 0.3%.**
Readers land on the article title, and the redirects sit unused.

## The renames are three different things

They look alike in the traffic and they are not alike at all.

**One vowel.** Kim Yoo-jung became Kim You-jung in December 2025. Both are ordinary romanisations
of the same syllable; one of them is what 88.2% of her readers type.

**A whole surname.** Im Yoon-ah became Lim Yoona in February 2026 — initial consonant, spacing and
hyphen all changed at once. At 93.5% this is the widest gap in the six, and the newest move but
one.

**A disambiguator, not a name.** Danielle Marsh became *Danielle (singer)*; Lee Jun-ho lost his
*(entertainer)* tag; IU moved from *(singer)* to *(entertainer)*. Nothing about the person's name
changed. What changed is the bracket Wikipedia uses to tell people apart, and readers do not type
brackets — for these three the traffic is probably arriving through links and search results
pointing at the older form.

We keep the three kinds apart rather than calling all six "romanisation", because the move log
tells us which is which and grouping them would hide it.

## Time does not appear to close the gap

If readers drifted to a new title over time, the oldest rename here would have the smallest share
on the old name. It does not.

Lee Jun-ho was renamed **22 months** ago and still sits at 73.6%. Danielle Marsh was renamed **four
months** ago and sits at 88.2%. The newest and the oldest are 14.6 points apart, in the direction you
would expect, and the middle of the table is not ordered at all: IU at 14 months has a lower share
than Kim You-jung at 8 months and a higher one than Jung Kook at 17.

**Six points do not make a trend**, and we are not claiming one. What we can say is that no move
here has been followed by its readers, including one made almost two years ago.

## A correction to our own piece from this morning

We published a narrower version of this measurement earlier today, at 30 people, and wrote that
**one** person was affected. That was correct for those 30 — the other five sit outside the top 30
by reads. At 100 people the count is six, and the pattern is a good deal clearer than one case
could show.

We are leaving the earlier piece up with a note pointing here rather than editing its numbers,
because the 30-person figure was true of what was measured.

## What this measure is and is not

It is a count of which page title a reader arrived at. It is not a count of what anyone typed: a
search engine that sends an old spelling straight to the new article produces a new-title read, so
**every share in the table is a floor**. It says nothing about whether a rename was right, and
nothing about how many people like anyone.

It exists at all because we got a related count wrong two days ago and had to go looking at
redirect traffic to find out why. That traffic is normally discarded. For 94 of these 100 people,
discarding it costs almost nothing. For six, it is where most of the reading is.

The seven-member table this line of work started from is on
[the page behind it](/streak-vs-read).
