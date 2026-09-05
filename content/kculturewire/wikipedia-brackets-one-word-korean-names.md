---
title: "Wikipedia gives Rain eight titles and So Ji-sub none"
dek: "Of the 100 most-read Korean stars, the 20 whose article sits under a single word carry a median of 6.5 bracketed titles — Rain (entertainer), Rain (singer), Rain (soldier). The 80 with a full name carry none. Fame does not explain it."
category: stars
purpose: both
pubDate: 2026-09-05
dataAsOf: 2026-09-01T00:00:00+09:00
author: Newsroom
tags: ["korea", "kpop", "actors", "wikipedia", "measurement"]
pages:
  - "/name-spelled"
  - "/streak-vs-read"
sources:
  - org: "Wikipedia"
    api: "MediaWiki API — action=query&redirects=1 for each person's article, then prop=redirects&rdlimit=max for every redirect pointing at it. Namespace 0 only"
    url: "https://en.wikipedia.org/w/api.php"
  - org: "Wikimedia"
    api: "Pageviews API, en.wikipedia, all-access, user agents only, monthly, 2023-06-01 to 2026-09-01, summed per title"
    url: "https://wikimedia.org/api/rest_v1/"
crossChecks:
  - "The one-word / full-name split is mechanical: it is the number of whitespace-separated words in the article title after brackets are stripped. J-Hope and G-Dragon count as one word; Lee Min-ho counts as two. Nobody was sorted by hand"
  - "Brackets that name a work are excluded — Face (Jimin EP), Snow Flower (V song), V (singer) discography. The filter looks for song, single, album, EP, mixtape, discography, filmography, tour, soundtrack, film or awards anywhere in the title, inside the brackets or outside"
  - "Fame was tested as an alternative explanation. Splitting the 100 into four equal groups by total reads, the full-name median is zero in every one of the four. Reads and total title count correlate at only 0.248 by rank"
  - "All 100 were measured and none dropped. 732 titles in total, every one of which drew at least one read in the window, so no count rests on a title nobody visited"
  - "Two one-word names carry no brackets at all — Ejae and Yeonjun — and we name them rather than treating them as noise. They are the check on the mechanism we propose"
excluded:
  - "When each redirect was created. The API gives us the redirects that exist now, not the order they appeared in, so nothing here is a claim about what happened first"
  - "Whether any bracket is the right one. Wikipedia's disambiguation rules are its own and this piece takes no position on them"
  - "Other language editions. Every one disambiguates differently, and a Korean-language encyclopedia has no reason to bracket a Korean name at all"
  - "Popularity. A bracket count measures collision with the rest of the world, not how many people like someone"
  - "Anyone outside the 100 most-read Korean stars we hold, and anything after 2026-09-01"
---

English Wikipedia holds eight different titles that will land you on the page about the singer
Rain. Five of them are the same word with a different bracket after it: *Rain (entertainer)*,
*Rain (singer)*, *Rain (actor)*, *Rain (soldier)*, *Rain (celebrity)*.

It holds six titles for So Ji-sub. Not one of them has a bracket.

We took the 100 most-read Korean stars we hold, asked Wikipedia's API for every redirect pointing
at each person's article, and counted the titles that exist to tell that person apart from someone
else. **The split is not between famous and obscure. It is between a name that is one word and a
name that is not.**

| Article title | Bracketed titles |
|---|---:|
| Jimin | 11 |
| Psy | 11 |
| T.O.P | 10 |
| IU (entertainer) | 9 |
| Jin (singer) | 8 |
| Suga | 8 |
| Rain (entertainer) | 8 |
| V (singer) | 7 |
| Jennie (singer) | 7 |
| Rosé (singer) | 7 |
| *median of the 20 one-word names* | **6.5** |
| *median of the 80 full names* | **0** |

Sixty-four of the 80 full names have no bracketed title whatsoever. Eighteen of the 20 one-word
names have at least one.

## It is not that they are more famous

The obvious objection is that these are the biggest names, and big names attract editors who make
redirects. We tested it and it does not hold.

Split the hundred into four equal groups by total reads. **The full-name median is zero in every
group** — at 330,000 reads and at 7.5 million alike. The one-word median climbs with reads, from 1
in the smallest group to 7 in the largest, but it starts above zero and stays there.

| Reads | One-word names | Full names |
|---|---:|---:|
| 0.33m – 1.18m | 1 | 0 |
| 1.24m – 2.09m | 5.5 | 0 |
| 2.11m – 3.11m | 6.5 | 0 |
| 3.11m – 7.53m | 7 | 0 |

Reads and total title count correlate at 0.248 by rank across all 100 — weak. Fame adds brackets
only to names that were going to collect them anyway.

## What a bracket is actually counting

A bracket is what an encyclopedia writes when a title is already taken. *Rain* is weather. *V* is a
letter. *Jin*, *Jennie*, *Danielle*, *Karina*, *Felix* and *Rose* are ordinary given names in
English. So the encyclopedia has to say which Rain, and it has said it eight different ways over
the years, keeping every old attempt alive as a redirect.

*Lee Min-ho* collides with nobody. Neither does *So Ji-sub*, *Kim Go-eun* or *Bae Suzy*. A
three-syllable Korean name written out in full is, in English, a nearly unique string.

The two one-word names in our hundred with **zero** brackets make the same point from the other
side. **Ejae** has 3.92 million reads — more than Rain, more than Psy, more than Jimin — and needs
no bracket, because no one else in the encyclopedia is called Ejae. **Yeonjun** has 376,559 and
needs none either. A one-word name only collects brackets if the word already belongs to someone.

## The Korean spelling is there, and almost nobody uses it

While counting titles we found a second thing worth reporting on its own.

**Seventy-two of the hundred have a Hangul redirect** — 소지섭 will take you to So Ji-sub, 아이유 to
IU. Somebody made each one deliberately. Across the whole set they drew **14,254 reads out of
232,311,005**, which is 0.006%, or about one read in sixteen thousand.

The doorway in Korean script exists for nearly three-quarters of these people, and on the English
encyclopedia it is essentially never used. That is not a failure of anything. It is a measurement
of who English Wikipedia is read by.

## What this cannot say

It cannot say when any redirect was made. The API returns what exists today, so nothing here is a
claim about which spelling came first or how the pile grew.

It cannot say whether a bracket is correct. Wikipedia decides that by its own rules, and several of
these people have been moved between brackets more than once — *IU (singer)* to *IU (entertainer)*
is one, and [readers did not follow that move either](/article/six-korean-stars-renamed-readers-did-not-follow).

And it is a count of collisions, not of standing. Jimin's eleven brackets and Ejae's zero say
nothing about either of them. They say that one name was already in use in English and the other
was not.

The seven-member table this line of counting started from is on
[the page behind it](/streak-vs-read).
