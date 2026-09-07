---
title: "94 K-pop acts peaked in January. 38 in September. February never wins big"
dek: "For 774 Korean acts we know the single month each was read most on English Wikipedia. By calendar month they are not even — January runs 45% above expectation, September 39% below. Among the 100 biggest peaks, none landed in February."
category: stars
purpose: both
pubDate: 2026-09-07
dataAsOf: 2026-09-07T21:00:00+09:00
author: Newsroom
tags: ["kpop", "attention", "wikipedia", "seasonality", "calendar", "peak"]
pages:
  - "/peak-month"
sources:
  - org: "Wikidata"
    api: "SPARQL — P31/P279* of musical group, musical ensemble, girl group or boy band; South Korea by P495, P17 or P740. No wikibase:label service — it silently drops rows."
    url: "https://query.wikidata.org/sparql"
  - org: "Wikimedia Foundation"
    api: "Pageviews REST API — en.wikipedia, all-access, agent=user, monthly, 2015-07 to 2026-08"
    url: "https://wikimedia.org/api/rest_v1/"
crossChecks:
  - "Expectation is not the flat one-twelfth. February has 28 days and collects fewer reads, so it is less likely to hold an act's best month for reasons that have nothing to do with music. We built the expectation from the actual number of days each calendar month contributes to the window, and the day counts are printed on the data page so the arithmetic can be checked. Without that correction February reads as 59% of expectation; with it, 64%."
  - "The window opens in July 2015 and closes in August 2026, so July and August appear twelve times while the other months appear eleven. That is corrected by the same day-count expectation — July drops from 135% of a flat expectation to 123%."
  - "Standard deviations are shown only where the sample passes 30 acts. The 100-act subset is reported with counts and expectations but is not leaned on for significance."
  - "No new collection was run for this. The peak months were already in the dataset behind /group-afterlife; this article re-counts them on a different axis."
limitation: "This measures the month an act was looked up most, not the month it released anything. We do not hold release dates, so any reading of this as advice about comeback timing is a claim about data we did not collect. A Wikipedia article is also usually created after an act becomes known, which makes very early months unreliable."
---

We already knew, for 774 Korean musical acts, the single month each one was read most on
English Wikipedia. We used it to ask how fast attention drains away after that month. We
never asked the simpler question sitting in the same column: **which month is it?**

It is not spread evenly.

| Month | Acts peaking | Days in window | Expected | Of expected | SD |
|---|---:|---:|---:|---:|---:|
| **January** | **94** | 341 | 64.7 | **145%** | **+3.64** |
| February | 38 | 311 | 59.0 | 64% | −2.73 |
| March | 80 | 341 | 64.7 | 124% | +1.90 |
| **April** | **89** | 330 | 62.6 | **142%** | **+3.34** |
| May | 59 | 341 | 64.7 | 91% | −0.71 |
| June | 63 | 330 | 62.6 | 101% | +0.05 |
| July | 87 | 372 | 70.6 | 123% | +1.96 |
| August | 76 | 372 | 70.6 | 108% | +0.65 |
| **September** | **38** | 330 | 62.6 | **61%** | **−3.11** |
| October | 51 | 341 | 64.7 | 79% | −1.70 |
| November | 43 | 330 | 62.6 | 69% | −2.48 |
| December | 56 | 341 | 64.7 | 87% | −1.08 |

**Five** of the twelve months sit more than two standard deviations from expectation:
January (+3.64) and April (+3.34) above it, September (−3.11), February (−2.73) and
November (−2.48) below it. The seven that remain are unremarkable, and that is worth saying
plainly — the calendar is uneven, not chaotic.

## The correction matters more than the finding

The third column is the part worth reading first. February has 28 days. A short month
collects fewer reads, so it is *less likely* to hold an act's best month for reasons that
have nothing to do with music or scheduling. Our window also opens in July 2015 and closes
in August 2026, which means July and August appear twelve times while every other month
appears eleven.

Both of those are instrument artefacts, and both point the same way as the result — which
is exactly when a number should be distrusted. So the expectation above is not a flat
one-twelfth. It is proportional to the days each calendar month actually contributes.

The correction changes the answer:

| | Flat expectation | Day-weighted |
|---|---:|---:|
| February | 59% | **64%** |
| July | 135% | **123%** |
| September | 59% | **61%** |

February is still low. July is still high but much less so — a third of its apparent excess
was the calendar. September barely moves, which is why it survives as the strongest low.

## Among the 100 biggest peaks, February is empty

Restricting to the 100 acts whose best month drew at least 50,000 reads removes the risk
that a small article with a noisy month is driving the pattern.

| Month | Acts | Expected | SD |
|---|---:|---:|---:|
| April | 13 | 8.1 | +1.73 |
| January | 11 | 8.4 | +0.91 |
| March | 11 | 8.4 | +0.91 |
| May | 11 | 8.4 | +0.91 |
| June | 11 | 8.1 | +1.02 |
| July | 11 | 9.1 | +0.62 |
| October | 8 | 8.4 | -0.12 |
| December | 8 | 8.4 | -0.12 |
| August | 6 | 9.1 | -1.03 |
| November | 6 | 8.1 | -0.73 |
| September | 4 | 8.1 | -1.44 |
| **February** | **0** | **7.6** | **-2.76** |

**Not one of the hundred biggest peaks landed in February.** Everything else in this table
is inside two standard deviations of expectation — April, the highest, reaches only
+1.73. The January and September extremes that were so clear in the full set are gone.

That last point is the honest one. The pattern in the 774 is real; in the 100 it mostly
dissolves. Whatever produces it works on acts read in the thousands, not the hundreds of
thousands. The more quotable version of this article — "the biggest K-pop moments happen in
January" — is not what the numbers say.

## What we did not measure

We do not hold release dates. This is the month an act was **looked up** most, and reading
it as guidance about when to schedule a comeback is a claim about data we never collected.
There are at least three ordinary explanations we cannot separate with what we have: awards
season and year-end lists sitting in January, the academic and fiscal calendar, and the
plain fact that a Wikipedia article is usually written after an act becomes known.

What the table does establish is narrower and still useful: the calendar is not flat, the
flatness you would assume is wrong by a third in both directions, and two of the three
months that stand out do so only once you stop dividing by twelve.

The full table, with the day counts and both subsets, is on
[the peak-month page](/peak-month). The same 774 acts
[lose half of that peak within two months](/group-afterlife) of reaching it, and Korean
titles [halve on the same timescale](/half-life) measured on entirely different data.
