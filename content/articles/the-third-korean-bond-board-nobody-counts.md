---
title: "Korea lists bonds on three boards. Everyone quotes one of them"
dek: "Government paper trades on a board of 8 to 12 listings. Beside it sit 270 to 346 general listings and a near-fixed 40 small-lot listings retail buyers use. Over 22 sessions the gap ran 0.41 to 0.95 points."
category: rates
pubDate: 2026-09-11
dataAsOf: 2026-09-09T00:00:00+09:00
author: Newsroom
tags: ["bonds", "yields", "spread", "retail", "KTS", "small-lot"]
sources:
  - org: "Financial Services Commission (Republic of Korea)"
    api: "Bond Securities Information Service — getBondPriceInfo"
    url: "https://www.data.go.kr/"
crossChecks:
  - "Every board figure is a median, never a mean. One general-board listing settled at 117.082 percent on 9 September, and a mean would have carried it into the headline"
  - "Yields outside 0.1 to 20 percent are counted and reported, not deleted. There were 11 such rows on 9 September out of 321. They are what the source published and the record says so"
  - "Opening, high and low yield fields are not used anywhere in this piece. 22 of 3,547 rows carried a negative high yield, and the largest intraday range those fields imply is 23,602 percentage points, which is not a market move"
  - "The residual-maturity and classification columns arrive filled on 2.8 percent of rows, so no maturity bucket appears here. Maturity is derivable from listing names, and our yield-curve page does that separately"
  - "The series had a hole. Collection stopped after 24 August and was not noticed for 18 days because this dataset sat outside our missing-day check. The 12 absent sessions were refetched from source on 11 September and the check now covers it"
  - "A board with fewer than three listings on a given day is reported as unmeasured rather than given a median"
---

There are three places a bond can be listed in Seoul, and they do not behave alike.

The one everyone quotes is the government board — the inter-dealer market for treasury paper. On
9 September it held **ten listings**. Across 22 sessions it never held more than twelve or fewer than
eight. That handful of listings is what "the Korean bond yield" means in almost every sentence written
about it.

Beside it sits the general board: **271 listings** on the same day, ranging from 270 to 346 over the
window. Bank paper, capital-company paper, utility paper, corporate paper.

And beside that sits a third board almost nobody outside Korea has counted: the small-lot board,
**40 listings**, and it is 40 nearly every day. Twenty-one of our 22 sessions show 40; one shows 39.
It is a small, near-fixed universe of housing-bond series, and it is the board a Korean household
actually buys from.

## The three boards, 9 September

| Board | Listings | Median yield |
|---|---:|---:|
| Government (inter-dealer) | 10 | 3.878% |
| Small-lot | 40 | 4.477% |
| General | 271 | 4.645% |

The general board sits **0.767 percentage points** above government paper. The small-lot board sits
**0.599** above it. The three boards are kept side by side, updated each trading day, on our
[bond boards page](/data/bond-boards).

## The gap is not a constant

Over 22 sessions the general-board premium over government paper ran from **0.412 to 0.950 percentage
points**. The small-lot premium ran from **0.426 to 0.774**.

| | Narrowest | Widest | 9 September |
|---|---:|---:|---:|
| General over government | 0.412 | 0.950 | 0.767 |
| Small-lot over government | 0.426 | 0.774 | 0.599 |

A single number quoted as "the spread" is therefore a number picked from a range twice its own width.
The government board moved too — its median ran 3.630 to 4.011 percent inside the same window — so the
premium widens and narrows for reasons on both sides of it.

## Sorted by who issued the paper

The board a bond trades on is not the same question as who owes the money. Sorting the same
9 September session by issuer type, using the listing names, gives a second ordering.

| Issuer type | Listings | Median yield |
|---|---:|---:|
| Financial | 100 | 5.049% |
| Unclassified | 96 | 4.731% |
| Local government | 32 | 4.468% |
| Public corporation | 33 | 4.406% |
| Treasury | 40 | 4.386% |
| Housing bonds | 20 | 4.043% |

Financial-sector paper pays **0.663 percentage points** over treasury paper. Housing bonds pay
**0.343 below** it, which is the one line in the table that deserves a second look rather than a
conclusion — these are short, amortising series and the yield convention on them is not the treasury
convention.

The 96 unclassified listings are unclassified because our sorting reads issuer type out of the listing
name, and 96 names do not announce it. They are not folded into "corporate" to make the table tidier.
A sorting rule that guesses would move a quarter of the board on our say-so.

## What is missing from this, and why

Three columns arrive in this feed that are not used above.

The opening, high and low yield fields are unusable. Across 3,547 rows we found 22 with a negative
high yield, and one listing whose high and low imply a same-day range of 23,602 percentage points. A
ranking built on intraday range would be a ranking of feed errors, so those columns are left alone.

The residual-maturity and classification columns arrive filled on 2.8 percent of rows. No maturity
bucket appears in this piece for that reason. Maturity is recoverable from listing names — a name
carries its redemption month — and that is done separately. Where the trading actually happens is a
third question again: on this board of a few hundred listings,
[the ten most-traded take 99 percent of the money](/data/concentration).

And there was a hole. This series stopped after 24 August and stayed stopped for 18 days, because the
dataset sat outside the check that tells us when a daily file is missing. The collector was never
broken; nobody ran it. The 12 absent sessions were refetched from source on 11 September, which is why
this piece has 22 sessions rather than ten, and the check now covers this dataset.
