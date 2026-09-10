---
title: "One K-pop member outdraws her own group — by 0.4%"
dek: "Jennie's solo single matched a BTS record, so we counted lookups for three groups and all fifteen members. Only Lisa passed her own group page — by 7,413 out of 1.8 million. Added up, BLACKPINK's four beat its name 3.25 times."
category: industry
purpose: both
genre: music
pubDate: 2026-09-10
dataAsOf: 2026-09-10T00:00:00+09:00
author: Newsroom
tags: ["kpop", "blackpink", "bts", "aespa", "solo", "attention", "method", "wikipedia"]
pages:
  - "/fictional-vs-real"
sources:
  - org: "Wikimedia Foundation — Pageviews API"
    api: "Per-article monthly pageviews on English Wikipedia, all-access, user agents only. Window September 2025 to August 2026, eighteen articles (three group pages and fifteen member pages). Wikimedia Analytics data is released into the public domain under CC0."
    url: "https://wikimedia.org/api/rest_v1/"
  - org: "Wikipedia Action API"
    api: "Used before counting, to resolve each article title through its redirects and to confirm that the resolved article actually links to the group. Neither check is optional; both changed our numbers."
    url: "https://en.wikipedia.org/w/api.php"
crossChecks:
  - "Every title was resolved through redirects before counting. The pageviews API does not follow redirects, so a redirect title returns only the traffic that arrived through that name. Counting 'RM (rapper)' rather than 'RM (musician)' gave 27,156 instead of 711,190 — twenty-six times too small."
  - "Every member article was then checked for a link to its group's article. A member page links its group; a page that does not is probably a different person. This check caught 'Karina (singer)', which resolves to a different Karina with 3,493 lookups, and sent us to 'Karina (South Korean singer)' with 397,504."
  - "A group is published only when the group page and every one of its members returned data. No group here is computed from a partial line-up, because a short line-up biases the members-versus-group ratio downward."
  - "Both windows are published for every group: the twelve-month total and the most recent single month. For BLACKPINK they disagree, and we say so."
  - "The biggest single member is published before the sum of the members, and the sum is labelled as a sum."
excluded:
  - "Chart positions, weeks on chart, streams and sales. The news peg was a Billboard record; Billboard chart data is licensed and we do not hold a licence for it, so we counted something we are allowed to count and said which."
  - "Groups whose line-up we could not fully resolve in this pass. We would rather publish three complete groups than five with holes."
  - "Any claim that a member outdrawing a group means the group is finished, or that a member being smaller means anything about that member. We counted lookups over twelve months."
  - "Solo discographies, activity dates and hiatus periods. We did not measure them, so we do not explain the numbers with them."
---

On 10 September 2026 a Korean paper reported that Jennie's single "Drakula" had spent
fifteen weeks in the Billboard top ten, tying BTS's "Butter". A solo record matching a
group record is the kind of line that gets read as a shift: the members are now bigger
than the band.

We cannot check that on the charts — Billboard's data is licensed and we do not hold a
licence. We can check something adjacent and open: how many people go and look each of
them up. So we counted twelve months of English Wikipedia lookups for three groups and
all fifteen of their members. It is the same well, the same window and the same filter we
used to count [fictional groups against real ones](/fictional-vs-real), which means the two
sets of numbers can be laid beside each other.

## Only one member passed her own group, and only just

| BLACKPINK | Twelve-month lookups |
|---|---|
| **Lisa** | **1,826,251** |
| BLACKPINK (the group page) | 1,818,838 |
| Rosé | 1,572,819 |
| Jennie | 1,379,477 |
| Jisoo | 1,135,686 |

Lisa is ahead of her own group by **7,413 lookups out of 1.8 million** — 0.4%. That is one
member, in one of three groups, by a margin thinner than a rounding error.

And in the most recent single month of the window, nobody passed their group. Lisa drew
105,267 against the group page's own last month; the group was ahead of every member.

## In BTS and aespa nobody came close

| BTS | Twelve-month lookups | Share of the group page |
|---|---|---|
| BTS (the group page) | 3,025,276 | — |
| V | 1,350,428 | 0.45 |
| Jungkook | 1,155,142 | 0.38 |
| RM | 711,190 | 0.24 |
| Jimin | 706,366 | 0.23 |
| Jin | 670,861 | 0.22 |
| Suga | 664,049 | 0.22 |
| J-Hope | 579,762 | 0.19 |

| aespa | Twelve-month lookups | Share of the group page |
|---|---|---|
| aespa (the group page) | 604,115 | — |
| Karina | 397,504 | 0.66 |
| Winter | 301,028 | 0.50 |
| Giselle | 284,585 | 0.47 |
| Ningning | 269,158 | 0.45 |

The most-looked-up BTS member draws 0.45 of the group page. The most-looked-up aespa member
draws 0.66. Neither is close to passing.

## Add the members up and the picture inverts

The single-member comparison asks "is anyone bigger than the band." A different question is
"how much of the attention sits on people rather than on the band name." For that you add
the members, and the answer is different:

| Group | Members added up | Times the group page |
|---|---|---|
| BLACKPINK | 5,914,233 | **3.25** |
| aespa | 1,252,275 | **2.07** |
| BTS | 5,837,798 | **1.93** |

BLACKPINK's four members together are looked up 3.25 times as often as the BLACKPINK page.
BTS's seven together manage 1.93 times — with three more members.

We publish the biggest single member first and this sum second, on purpose. A sum divided by
one rival page can be pushed up by a single entry, and a sum over seven people will always
beat a sum over four. The two numbers answer different questions and neither replaces the
other.

## Two things nearly went out wrong, and both were caught by asking Wikipedia

This is the part worth keeping if you ever count pageviews yourself.

**The pageviews API does not follow redirects.** We asked for `RM (rapper)` and got 27,156
lookups. It is a plausible-looking number and we could have printed it. `RM (rapper)` is a
redirect; the article is `RM (musician)`, and it has **711,190** lookups. The redirect count
is only the people who arrived by typing that particular name — twenty-six times too small.
Suga and Jungkook had the same problem.

**A redirect can land you on a different person.** `Karina (singer)` resolves to `Karina`,
which returned 3,493 lookups. Again, a filled-in cell. But 3,493 a year is not a global
girl-group member, and the article is a different Karina. The one we wanted is
`Karina (South Korean singer)`, at **397,504**.

So the collector now does two things before it counts anything: it resolves every title
through its redirects, and it asks whether the resolved article links to the group's own
article. A member page links its group. A page that does not is probably somebody else, and
that row is reported as unmeasured rather than counted.

Both of these produced *numbers*. Neither number was the thing we meant. A cell being full
is not the same as a cell being right.

## What this does not tell you

Lookups are lookups. They are not streams, sales, tickets, chart weeks or income. A member
page and a group page are both opened by devoted fans and by people who just saw a name in a
headline, and this count cannot tell those two readers apart.

We also did not measure why any of these numbers are what they are. Solo releases, military
service, hiatuses and acting work all move attention around, and we counted none of them, so
we are not going to explain the table with them.

And the news peg itself — fifteen weeks in a Billboard top ten — is not in this piece at all,
because we are not licensed to republish it. We counted what we are allowed to count and
labelled it.

Two related counts, from the same well: how much attention
[a fictional group draws against real ones](/fictional-vs-real), and how much
[market value each label carries per artist on its roster](/cap-per-artist).

*These are statistics, not you. This is not investment advice.*
