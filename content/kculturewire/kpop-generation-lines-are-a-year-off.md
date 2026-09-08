---
title: "Korean writing now has a sixth K-pop generation. We tested the first five and the lines are a year off"
dek: "The generation labels are quoted like facts, but nobody sets them. We put 182 Korean acts against English Wikipedia reading: the bands overlap 86% to 100%, and in both boundary years we could measure, the real break sits one year away."
category: stars
purpose: both
pubDate: 2026-09-08
dataAsOf: 2026-09-08T10:58:00+09:00
author: Newsroom
tags: ["kpop", "generations", "wikipedia", "attention", "method", "girl-groups"]
pages:
  - "/generations"
sources:
  - org: "Wikidata"
    api: "SPARQL — property P571 (inception) for each act. Where an act carries several, the earliest is used."
    url: "https://query.wikidata.org/sparql"
  - org: "Wikimedia Foundation"
    api: "Pageviews REST API — en.wikipedia, all-access, agent=user, monthly, 2025-09 to 2026-08. Reused from the member-versus-group count, not re-collected."
    url: "https://wikimedia.org/api/rest_v1/"
crossChecks:
  - "A second, unrelated measurement points the same way. Our group-afterlife page counts something different — how many months an act takes to fall from its best month to half of it — and found that number does not vary by debut era either: about two months whether the act started in 1995 or 2020. Two instruments, two units, one conclusion, and neither was built to test the other."
  - "The boundary test does not depend on our bins. Year-to-year changes in median reading are computed with no reference to the generation lines; the lines are marked on the result afterwards. Anyone who would draw the boundaries elsewhere can read the same year-by-year table and mark their own."
  - "We printed our own wrong explanation and its correction. Fifth-generation acts show a median member share of 2.5%, and our first reading was that their members have no English articles yet. Measured, that is false: those acts carry a median of 4 members with an article against 2 for the third generation. The articles exist and are barely read. Four of the five send under 5% of their reading to members. Whether the encyclopaedia has not caught up or attention on very new groups genuinely sits on the group name, five acts and one twelve-month window cannot separate — so we claim neither, and the page prints all five acts rather than the median."
limitation: "Wikidata records inception, which is not always debut — some acts trained for years before releasing, and we do not have release dates for all of them. Of 380 acts, 72 had no usable founding year and are left out of every table rather than placed in an unknown row. Only the English Wikipedia is counted; the same question on the Indonesian, Vietnamese, Thai and Malay editions can order acts differently. The newest bins are thin: five acts in the fifth generation and none at all in the sixth, so nothing here settles what the newest groups will look like."
---

A Korean outlet described a group this week as a **sixth-generation** girl group. The phrase
went by without explanation, the way it usually does. First generation, second, third — the
labels are used as if some body had set them.

None has. No institution defines the boundaries, no database records them, and the years
shift depending on who is writing. They are a convention, which is a perfectly reasonable
thing for a convention to be. But a convention can be checked, so we checked it.

## What we did

We took the 380 Korean acts from our member-versus-group count, asked Wikidata for each
act's founding year, and kept the **308** that had one. Set aside suspected sub-units —
they read like people rather than groups, because the sub-unit's own name is the part
nobody knows — and **182 acts** remain. Against each we put twelve months of English
Wikipedia reading, act page and member pages added together.

Then we wrote the conventional boundaries into the code, in the open, so they could be
argued with: first 1996–2002, second 2003–2011, third 2012–2017, fourth 2018–2022, fifth
2023–2025, sixth 2026 onward.

## The medians climb. That part of the story holds

| Generation | Acts | Median reads |
|---|---:|---:|
| Before the labels (pre-1996) | 9 | 35,481 |
| First (1996–2002) | 28 | 63,586 |
| Second (2003–2011) | 43 | 116,555 |
| Third (2012–2017) | 69 | 114,924 |
| Fourth (2018–2022) | 28 | 124,132 |
| Fifth (2023–2025) | 5 | 263,840 |
| Sixth (2026–) | **0** | — |

Later acts are read more. A group from the fourth generation is read about twice as much as
one from the first, and the newest bin is higher still. If that is all you wanted from the
labels, they deliver it.

## But the bands sit on top of each other

A median is one point. What decides whether a label is useful is the spread, so we measured
how much the middle half of each generation overlaps the middle half of the next.

| Pair | Middle halves overlap |
|---|---:|
| Before the labels → First | 100% |
| First → Second | 86% |
| Second → Third | 90% |
| Third → Fourth | 92% |
| Fourth → Fifth | 100% |

At 86% to 100%, knowing an act's generation tells you close to nothing about how much that
act is read. Two of the pairs overlap completely: one generation's middle half sits entirely
inside the other's. The label describes when a group started. It does not describe the group.

## And the breaks are a year off the lines

This is the test we care about most, because it does not use our bins at all. Line the acts
up by founding year, compare the median reading of each year against the next, and see where
the big moves are. If the boundaries are real, the big moves should sit on them.

Sixteen year-to-year gaps had at least four acts on both sides — enough not to be one act
moving. Two of those sixteen are generation boundaries. Among the two largest jumps,
**neither** is a boundary.

| Year begins | Median moves | Change | On a boundary? |
|---|---:|---:|---|
| 2011 | 518,907 → 57,247 | 9.06× | — |
| 2019 | 369,279 → 43,059 | 8.58× | — |
| 2001 | 25,376 → 130,973 | 5.16× | — |
| 2007 | 96,357 → 446,433 | 4.63× | — |
| **2018** | 109,879 → 369,279 | 3.36× | **yes** |

The detail worth sitting with: in both boundary years we could measure, the real break is
**adjacent** to the line rather than on it.

- **2012**, the most-quoted boundary of all — the third generation, the BTS and Twice era —
  ranks **11th of 16** at 1.75×. The year before it, 2011, is the single largest break in
  the whole set at 9.06×.
- **2018**, the fourth-generation line, does rank 5th at 3.36×. But 2019, immediately after
  it, is 8.58× — more than double.

So this is not a finding that nothing changes. Something changes, twice, hard. It changes a
year from where the label puts it.

## One column we got wrong, and what it turned into

The fifth generation shows a median member share of **2.5%** — the share of an act's
reading that lands on member pages rather than the act page. Every older generation is
above 46%. Our first explanation was that these members have no English Wikipedia articles
yet.

That is false, and measuring it said so. Fifth-generation acts carry a median of **4**
members with an article; the third generation carries **2**. The articles exist. They are
barely read.

| Act | Founded | Members with an article | Member share |
|---|---:|---:|---:|
| KiiiKiii | 2025 | 1 | 0.0% |
| TWS | 2024 | 1 | 0.2% |
| Hearts2Hearts | 2025 | 4 | 2.5% |
| Illit | 2024 | 4 | 3.2% |
| Kiss of Life | 2023 | 4 | 47.0% |

Four of the five send under 5% to members. Whether that is the encyclopaedia lagging or
attention on very new groups genuinely sitting on the group name, **five acts and one
twelve-month window cannot tell apart.** So we claim neither. What we will not do is print
2.5% as a fact about how fans of new groups behave — and we print all five rows so nobody
has to take the median on trust.

## The sixth generation is in print before it is in the data

Our set holds no acts founded in 2026. That is not a claim that no such groups exist —
Korean outlets are naming them now, and they are right that something is starting. It is a
statement about what can be counted: an act founded this year has had no twelve-month
window to be read in, and English Wikipedia has usually not written it down yet.

The label arrives first. The record arrives later. For a while there is nothing to count,
and we would rather say that than produce a number from five months of a group's existence.

## What would change our mind

If the next recount moved the big breaks onto 2012 and 2018, we would say so. The
year-by-year table is the part that does not depend on our bins, and it is on the data page
for anyone who would draw the lines differently: [do the generation labels show up in the
reading](/generations).
