---
title: "K-pop members outdraw their own groups nearly four to one — and the one exception turned out to be a hole in Wikidata"
dek: "Across 86 groups whose full membership can be measured, the members' pages were opened 3.88 times as often as the group's. Newer groups looked like the opposite until we checked why: Wikidata lists two members for Fromis 9."
category: music
pubDate: 2026-08-07
dataAsOf: 2026-08-06T00:00:00+09:00
author: Newsroom
tags: ["k-pop", "attention", "wikipedia", "wikidata", "measurement", "korea"]
pages:
  - "/kpop-attention"
sources:
  - org: "Wikimedia Foundation"
    api: "Pageviews API, en.wikipedia, all-access, user agent class 'user', 30 days from 2026-07-08 to 2026-08-06"
    url: "https://wikimedia.org/api/rest_v1/"
  - org: "Wikidata"
    api: "Roster by rule — P27=Q884 with occupation singer, rapper, composer or musician, plus musical groups reached by P31/P279* from Q215380 with P495=Q884. Membership from P527 (has part). Formation year from P571 (inception)"
    url: "https://query.wikidata.org"
crossChecks:
  - "The roster is built by query, not typed by hand. 2,362 acts were selected and 2,361 measured; one name the pageviews API would not answer for after three tries is left out rather than written as zero"
  - "Group and member pages are counted separately and never added together. A group's article and its members' articles are different pages, and summing them counts the same interest twice"
  - "Membership comes from Wikidata P527 in 41 batches of twenty groups. Every batch returned; none were dropped for a timeout, so the 32% of groups with no membership recorded is a real gap in Wikidata and not a gap in our collection"
  - "The headline 3.88 figure is restricted to the 86 groups where Wikidata lists at least three members and every one of them is in our measured roster. The unrestricted figure across all 247 comparable groups is 2.47, and both are reported"
  - "Formation year comes from Wikidata P571, earliest value where several are recorded. It is available for 550 of 816 groups. Groups with no year are excluded from the era table and from nothing else"
  - "154 of the 2,361 acts also appear on our screen-actor roster because Wikidata records both occupations for them. They are flagged rather than removed, and they carry 23.1% of all views in the panel"
excluded:
  - "Any claim about popularity, sales, streams or chart position. Every figure here is how many times an English Wikipedia article was opened, which is a measure of looking something up and nothing more"
  - "Any claim about attention inside Korea. This is the English Wikipedia. Korean-language reading is a different measurement we do not make here"
  - "Any statement that a group's fans prefer its members. We measured pages, not people. One reader opening seven member pages and one reader each opening one are identical in this data"
  - "The 2023–2026 era row in the restricted table, as evidence of anything. It contains two groups"
---

Ask which is read more often, a K-pop group or the people in it, and the answer is not close. Across
the 86 groups where Wikidata records at least three members and every one of them has an English
Wikipedia article we can measure, the members' pages were opened **2,013,997 times in thirty days
against 519,087 for the groups** — 3.88 to one. In 80 of those 86 groups the members won.

That is the finding. The more useful part of this piece is the finding we nearly published instead.

## The gradient that was not there

Sorted by the year a group formed, the same measurement produces a clean and satisfying story.

| Group formed | Groups | Members' views ÷ group's views |
| --- | ---: | ---: |
| 1990–2009 | 52 | 4.02 |
| 2010–2014 | 63 | 2.24 |
| 2015–2019 | 70 | 3.14 |
| 2020–2022 | 20 | 1.46 |
| 2023–2026 | 10 | **0.40** |

Read that column and the conclusion writes itself: older groups are read through their members, newer
groups are read as a single object. It is a plausible claim about how audiences arrive at a group,
and it would have been the headline.

Then we put one more column beside it — how much of each era's *listed* membership we could actually
measure.

| Group formed | Members with an article we could measure | Members' views ÷ group's views |
| --- | ---: | ---: |
| 1990–2009 | 95% | 4.02 |
| 2010–2014 | 89% | 2.24 |
| 2015–2019 | 86% | 3.14 |
| 2020–2022 | 71% | 1.46 |
| 2023–2026 | 77% | 0.40 |

The thing that falls across the eras is not only attention. It is coverage. A newly debuted act's
members are the least likely people in K-pop to have an English Wikipedia article, and a member with
no article registers as zero views — indistinguishable, in the arithmetic, from a member nobody looked up.

Restrict the comparison to groups whose entire listed membership is measurable, and the gradient goes
away:

| Group formed | Groups | Members' views ÷ group's views |
| --- | ---: | ---: |
| 1990–2009 | 26 | 3.78 |
| 2010–2014 | 18 | 4.93 |
| 2015–2019 | 27 | 3.72 |
| 2020–2022 | 5 | 2.18 |
| 2023–2026 | 2 | 2.32 |

Members outdraw the group in every era. The high point is 2010–2014, not the 1990s. The last two rows
hold five groups and two groups, which is not enough to say anything about recent debuts at all —
and saying nothing is the correct outcome there, not a smaller version of the original claim.

## Fromis 9

The clearest way to see the hole is a group whose name contains its own headcount.

Fromis 9 debuted with nine members. Its article was opened 18,953 times in the thirty days. Wikidata
records **two** members for it.

It is not alone. Babymonster's group page drew 37,936 views — fourteenth of the 816 groups in the
panel — and Wikidata lists two members for it. Meovv: 21,200 views, two members listed. KiiiKiii:
9,287 views, one. The Boyz: 9,213 views, two.

None of that is an error in Wikidata. It is a volunteer database that records what somebody has got
round to recording, and newly debuted members are the last to be written up. But if you take P527 as
a membership list and divide, you will conclude that fans of new groups are indifferent to the
individuals — when what you have measured is that nobody has written the pages yet.

Across all 816 groups in the panel, Wikidata records membership for 263 of them. **Two-thirds of
K-pop groups have no membership recorded at all.** That is the real coverage figure, and it is the
first number anyone building on this data should be told.

## What survives

With the artefact removed, three things stand.

**Members outdraw their group, and by a lot.** 3.88 to one where the comparison is clean, 2.47 to one
if you include every group with at least one measurable member. In 93% of the clean cases the members
won. Girls' Generation's nine members drew 130,642 views against the group's 39,036. Apink's seven
drew 94,840 against 12,776 — 7.4 to one, for a group formed in 2006.

**The biggest groups are the least lopsided.** BTS drew 383,622 views to its group page, more than
any other act in the panel, and its six measurable members drew 512,591 — 1.34 to one, against a
panel norm near four. NewJeans sits at 1.06. A group large enough to be a household name in English
is looked up as itself; the ratio is a rough measure of how far a name travels on its own.

**Where the group does outdraw its members, it is worth asking whether the members exist in the data
at all** before concluding anything about fans. That is the whole lesson of the middle section, and
it applies to any panel assembled from a volunteer database — which, for K-pop measured from outside
Korea, is most of them.

## What this is not

Every number here counts openings of an English Wikipedia article. It is not streams, not sales, not
chart position, and not attention inside Korea. It says how often somebody looked a name up in
English, over thirty days, which is a narrow thing to know and the only per-artist demand signal
published openly and daily for everyone in this panel.

Thirty days is also all we have. We began collecting daily this month. A month from now this article
could be written about trends; today it cannot.

---

Members outdraw groups. Across the whole field, though, no single act is large. [Read how concentrated K-pop attention really is →](/article/music-has-no-squid-game-and-is-more-concentrated-anyway)
