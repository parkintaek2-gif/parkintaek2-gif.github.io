---
title: "We said reaching number one doubles a title's hours. Most of that gap was run length."
dek: "Measured on all 246 Korean titles instead of the fifty largest, the number-one group runs five weeks to everyone else's two. Hold length fixed and the gap that is left is 1.3× among titles that lasted six to ten weeks."
category: titles
purpose: both
pubDate: 2026-08-08
dataAsOf: 2026-07-26T00:00:00+09:00
author: Newsroom
tags: ["netflix", "korea", "measurement", "selection bias", "series", "film"]
pages:
  - "/staying-power"
  - "/watched"
sources:
  - org: "Netflix"
    api: "Top 10 weekly global lists (Tudum), Non-English film and TV, 2021-07-04 to 2026-07-26, with hours viewed per title per week"
    url: "https://www.netflix.com/tudum/top10"
  - org: "Wikidata"
    api: "Country of origin (P495 = Q884) for every charting title, used to decide which titles are Korean"
    url: "https://query.wikidata.org"
crossChecks:
  - "The 232 titles and 23.68bn hours are the same panel the page has always used; only the grouping changed, so the correction cannot be an artefact of a different title list"
  - "Medians are reported beside means because one title holds 5.05bn of the 23.72bn, and a mean of any group containing it describes that title"
  - "Correlations are taken against log hours, since hours span three orders of magnitude and the raw scale would let the largest few titles set the coefficient"
  - "The banded comparison uses the same peak definition as the headline one, so the shrinking gap is not a change of measure"
excluded:
  - "Any claim about causation. Nothing here says reaching number one produces hours or that hours produce a number one; both are measured after the fact from the same weekly rows"
  - "The 1–2 week band as evidence. Exactly one title in it reached number one, so the 19.7× there rests on a single row and we do not read it"
  - "Country-level runs. Netflix publishes hours for the global lists only, so every figure here is global"
  - "Any ordering of titles by how well they did. The ranks are groups here, not a league table"
corrections:
  - date: 2026-08-08
    note: "This piece is itself the correction. Our /staying-power page carried the heading 'Reaching number one doubles the hours. It adds no weeks.' Both halves came from a table computed on the fifty largest titles by hours — a group selected on the outcome being explained. Recomputed on all 235: the ratio is 4.3× on medians rather than 2.5× on means, and run length differs sharply rather than not at all. The page now reports the whole panel, shows medians beside means, and shows the banded comparison."
---

On 7 August we put a heading on [our staying-power page](/staying-power): *"Reaching number one
doubles the hours. It adds no weeks."*

The second sentence was wrong, the first was the right shape and the wrong size, and the reason is
the same for both. **We computed the comparison on the fifty largest titles by hours** — a group
selected on the very thing we were trying to explain.

## What the selection did

Inside the top fifty, every title has already had a long run. The number-one group averaged 9.8 weeks
and everyone else 9.0, so run length looked irrelevant. It is not irrelevant; it is what got those
titles into the top fifty in the first place.

Here is the same comparison over the whole panel.

| Peaked at | Titles | Median hours | Median weeks | Mean hours |
| --- | ---: | ---: | ---: | ---: |
| **#1** | 67 | **103.4m** | **5** | 229.3m |
| Below #1 | 179 | 23.3m | 2 | 51.0m |

The gap in hours is larger than we said — **4.4× on medians**, against the 2.5× we reported on means
of the top fifty. And the claim that it adds no weeks is simply false: the median number-one title
runs **five weeks against two**.

We also report medians now. One title holds 5.05bn of the panel's 23.72bn hours, so a mean of any
group containing *Squid Game* is substantially a description of *Squid Game*.

## Then most of the gap turns out to be length

If number-one titles run longer, part of that 4.4× is just more weeks in which to accumulate hours.
So hold the length roughly fixed and look again.

| Titles that lasted | Reached #1 | Median hours | Did not | Median hours | Ratio |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1–2 weeks | 1 | 125.9m | 91 | 6.4m | — |
| 3–5 weeks | 43 | 74.6m | 57 | 46.0m | 1.62× |
| 6–10 weeks | 16 | 162.8m | 25 | 128.9m | **1.26×** |
| 11 weeks or more | 7 | 653.9m | 6 | 331.1m | 1.97× |

Among titles that lasted six to ten weeks, reaching number one goes with **1.26×** the median hours —
not 4.3×, and not 2.5×. The 1–2 week row has one title on the left of it and we do not read it.

**Most of what we had attributed to the peak was length.**

## The ranks do not run in order either

If the top spot were a ladder, median hours would fall as the peak rank rises. They do not.

| Peaked at | Titles | Median hours | Median weeks |
| --- | ---: | ---: | ---: |
| #1 | 67 | 103.4m | 5 |
| #2 | 27 | **123.4m** | 5 |
| #3 | 30 | 67.8m | 5 |
| #4 | 24 | 46.8m | 3 |

A title that peaked at number two has a **higher** median than one that peaked at number one. That is
not a paradox and it is not a ranking: reaching number one in a quiet week is easier than reaching
number two in a crowded one, and the chart position records the week it happened in, not the size of
the audience.

## Neither column is the cause of the other

Against log hours, weeks on chart correlates at **0.731** and peak rank at **−0.753**. They are the
same strength. And they correlate with each other at **−0.473**, so a table showing one is partly
showing the other. There is no version of this data in which we can hand you a single number and call
it the driver, and we are not going to invent one.

What the panel does say plainly is that **21.5% of Korean titles that reached a global Non-English
Top 10 were there for exactly one week** — 53 of 246. The most common outcome for a title that
charts at all is to chart once.

## What we changed

The page now computes the peak groups on all 232 titles rather than fifty, reports medians beside
means, and carries the banded table above. The old top-fifty figures stay in the data file under a
different key so the mistake can be traced rather than quietly overwritten, which is the same rule we
applied when [one flaw in title matching moved figures on seven pages](/article/one-flaw-twelve-corrections).

The general lesson is cheap to state and easy to repeat: **if you cut a panel by the outcome and then
explain the outcome, the cut will answer for you.** We had the whole panel in the same file the whole
time.
