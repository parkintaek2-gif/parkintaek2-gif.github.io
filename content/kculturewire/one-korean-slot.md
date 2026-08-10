---
title: "We wrote that a market has one Korean slot. Measured, two-thirds of that was arithmetic"
category: titles
purpose: both
dek: "When a Korean title reaches a market's top three, the other Korean titles there fall by 0.395. Non-Korean arrivals cost 0.014. That looks decisive until you notice the two groups start from different heights."
pubDate: 2026-08-10
dataAsOf: 2026-07-26T00:00:00+09:00
author: Newsroom
tags: ["korea", "netflix", "markets", "measurement", "limits"]
pages:
  - "/crowding"
sources:
  - org: "Netflix"
    api: "Tudum weekly Top 10 country lists, 492,900 rows read, 2021-07-04 to 2026-07-26, 93 markets, Films and TV counted as separate charts, Russia excluded"
    url: "https://www.netflix.com/tudum/top10"
crossChecks:
  - "Non-Korean arrivals at the same top-three positions are used as a control, so the comparison is against what any arrival does rather than against nothing"
  - "The control is weighted to the same distribution of starting levels as the Korean cases, because a chart that starts high falls whatever arrives"
  - "The arriving title is removed from the count on both sides, so the fall cannot be the arriving title itself"
  - "The band with no other Korean title present is reported separately, because it is where the claim fails"
excluded:
  - "Russia, excluded across this publication because Netflix withdrew and the remaining weeks are not comparable"
  - "Any reading of why a title left. A run ending on its own and a run displaced look identical in a rank table"
---

On 9 August we published a sentence on [our hard-markets page](/hard-markets) explaining why some
countries only ever show the biggest Korean titles:

> *there is one Korean slot and the biggest title takes it*

It was an explanation, not a measurement. We had not tested it. This is the test.

## What a Korean arrival looks like

Take every week where a Korean title entered a market's top three without being on that chart the
week before — 2,258 of them. Count the **other** Korean titles on that chart, four weeks before
against four weeks from the arrival. Then do exactly the same for arrivals that are not Korean.

| Arrivals at the top 3 | Cases | Other Korean titles before | Change after |
|---|---:|---:|---:|
| Korean title arrives | 2,258 | 1.916 | **-0.395** |
| Any other title arrives | 36,654 | 0.563 | **-0.014** |

A twenty-eight-fold difference. Published on its own it would have looked like proof.

## Why it is not

Read the third column. The Korean cases start at 1.916 other Korean titles; the control starts at
0.563. **A Korean title reaches a market's top three most often in markets that already carry
several Korean titles** — and a chart that starts high falls whatever arrives, because there is
more to lose.

So we grouped both sides by how many other Korean titles were there to begin with, and compared
like with like:

| Other Korean titles before | Korean arrivals | Change | Other arrivals | Change | Difference |
|---|---:|---:|---:|---:|---:|
| 0 | 643 | +0.130 | 21,459 | +0.157 | **-0.027** |
| 1 | 527 | -0.237 | 10,634 | -0.188 | -0.049 |
| 2 | 347 | -0.519 | 2,808 | -0.296 | -0.222 |
| 3 | 357 | -0.617 | 1,294 | -0.503 | -0.114 |
| 4 or more | 384 | -1.173 | 459 | -0.875 | -0.298 |

The control falls almost as far in every band. Weighted to the same starting levels, a non-Korean
arrival would have cost **-0.273**; the Korean arrivals cost **-0.395**. What is left is
**-0.122**, and **68% of the raw gap was the starting level rather than the arrival.**

## What survives

Something does. A Korean title reaching the top three of a market costs that market about
**a tenth of another Korean title**, over and above what any arrival costs. In the markets that
already carry four or more, it costs about three-tenths.

And the top row of the table is the honest limit on the original sentence. **Where there was no
other Korean title, a Korean arrival brings slightly fewer than a non-Korean one does** — +0.130
against +0.157. In the markets we described as having "one Korean slot", the slot does not behave
like a slot at all. Whatever is happening there, it is not one title displacing another.

So the sentence was not wrong. It was much smaller than it sounded, and it does not hold in the
markets we wrote it about.

## What this cannot tell you

It shows places, not reasons. A Korean title that disappears the week a bigger one arrives may be
ending its own run on schedule; nothing in a rank table separates that from displacement, and a
four-week window cannot either.

It is also not viewing. A title pushed to eleventh place is invisible here at any level of
watching, so "lost its place" is a statement about a chart, not about an audience.
