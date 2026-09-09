---
title: "Only 12 of 379 Korean groups have both men and women — and 12 is a floor, not a count"
dek: "We sorted every one of the 428 Korean music groups on Wikidata by the sex recorded for each member. 185 are all-men, 182 all-women, 12 mixed. But 127 groups still contain a member with no sex recorded, so the mixed number can only go up."
category: stars
purpose: both
genre: music
pubDate: 2026-09-09
dataAsOf: 2026-09-09T00:00:00+09:00
author: Newsroom
tags: ["kpop", "groups", "gender", "wikidata", "method", "data-gaps"]
pages:
  - "/group-mix"
sources:
  - org: "Wikidata"
    api: "SPARQL — has part(s) (P527) for each Korean music group, then sex or gender (P21) for every member returned."
    url: "https://query.wikidata.org/sparql"
crossChecks:
  - "Groups are sorted only when every named member has a sex recorded. 49 of the 428 have no usable member record at all and are reported as unsorted rather than folded into a category."
  - "We counted how many sorted groups could still change category if a missing member record were filled in: 127 of the 379. That number is published beside the headline, because it is the reason the headline says floor."
  - "Rock bands sit in the same Wikidata property as idol groups and were not separated. Removing them was tempting because the mixed list contains several, but the boundary would have been ours rather than the data's."
  - "Wikidata lists people who were members, not current line-ups. A group that was mixed and is no longer, or the reverse, is counted on its full recorded membership, and we say so rather than implying these are today's rosters."
excluded:
  - "Any claim about why mixed groups are rare. Industry practice and Wikidata's editing patterns would both produce a small number, and we cannot separate them here."
  - "Sex or gender as anything other than what Wikidata editors recorded. It is not a legal record and not self-description collected by us."
---

Korean pop is built out of groups, and almost none of them mix men and women. We wanted the
actual number rather than the impression, so we counted.

Of the **428 Korean music groups** recorded on Wikidata, **379** could be sorted by the sex
recorded for every named member. Of those, **185 are all-men**, **182 are all-women**, and
**12 have both** — **3.2%**.

| Category | Groups |
|---|---:|
| All men | 185 |
| All women | 182 |
| Both men and women | 12 |
| Could not be sorted | 49 |

## The 12

| Group | Men | Women |
|---|---:|---:|
| AllDay Project | 2 | 3 |
| Jaurim | 3 | 1 |
| KARD | 2 | 2 |
| Cool | 2 | 1 |
| Us | 1 | 2 |
| Banana Girl | 1 | 2 |
| Moogadang | 2 | 1 |
| Triple H | 2 | 1 |
| SSAK3 | 2 | 1 |
| AKMU | 1 | 1 |
| A-Force | 1 | 1 |
| Trouble Maker | 1 | 1 |

Four of those are duos, and several are project units assembled for a single release rather
than standing groups. The list is short enough to print in full, which is the main reason to
print it in full: a reader can check our sorting against their own knowledge, one row at a
time.

## Why we say floor and not count

**127 of the 379 sorted groups still contain at least one member with no sex recorded.**
Every one of those 127 is currently filed as all-men or all-women on the strength of the
members we can see. Fill in a single missing record and any of them could move into the
mixed column.

So 12 is the smallest the mixed number can be. It is not our estimate of the true number,
and we do not have one. A headline of "only 12 mixed groups in Korean pop" would be a
stronger sentence than our data can carry, which is why the number sits next to the word
that limits it.

This is worth being blunt about, because the shape of the error runs one way. Missing
records can only *add* to the mixed count, never subtract from it. Anyone quoting 12 as the
answer will be quoting a number we know to be too low.

## What this is not

**Not current line-ups.** Wikidata records people who were members. A group counted as
mixed may not be mixed today, and the reverse.

**Not idol groups only.** Rock bands and older acts sit in the same Wikidata property. We
left them in, because pulling them out would have meant drawing the line ourselves, and
three of the twelve mixed groups are exactly the kind of act that line would have removed.

**Not an explanation.** Whether mixed groups are rare because of how the industry is
organised or because of how Wikidata is written, this count cannot tell you. Both would
produce a small number.

The full sortable table, including the 49 groups we could not sort and the 127 that could
change, is on [Korean groups by who is in them](/group-mix).

*This is a count of public records. It is a statistic, not a statement about any
individual.*
