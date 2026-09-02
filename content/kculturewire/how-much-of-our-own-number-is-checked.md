---
title: "A sixth of our most-quoted figure rests on unchecked titles"
dek: "Korean titles hold 7.9% of the world's Netflix top 10 places — 39,139 of 498,480. Of those, 82.3% carry the label we use to exclude same-name foreign works. 16.4% carry no label at all, and we keep them because we cannot check them."
category: industry
purpose: ads
pubDate: 2026-08-09
updatedDate: 2026-09-03
dataAsOf: 2026-07-26T00:00:00+09:00
author: Newsroom
tags: ["korea", "netflix", "method", "measurement", "corrections"]
pages:
  - "/world-share"
sources:
  - org: "Netflix"
    api: "Tudum weekly Top 10 country lists, 2021-07-04 to 2026-07-26, and the global lists that carry the English / Non-English label"
    url: "https://www.netflix.com/tudum/top10"
  - org: "Wikidata"
    api: "Country of origin (P495 = Q884), and item numbers matched by number rather than by name"
    url: "https://query.wikidata.org"
crossChecks:
  - "The share is counted in chart places rather than in titles, because a title count makes the unchecked group look smaller than the weight it carries"
  - "Two independent checks are reported separately — Netflix's language label and a Wikidata item number — because neither is a superset of the other"
  - "The confirmation counts are summed over exactly the 93 complete markets the headline figure uses, and the collector refuses to write if the three groups do not add to the total"
excluded:
  - "Any adjustment to the headline figure. We did not remove the unchecked places to make the number cleaner; removing them would make it smaller and no more true"
  - "Russia, which Netflix withdrew from, as on every page of this site"
---

The number we publish most often is **7.7%** — the share of the world's Netflix top-10 places held by
Korean titles, 39,139 of 498,480 across 93 markets and five years. It is on our front page, in our
articles, and in the sheets we offer to companies.

This week we finally asked how much of it we have actually checked.

## The rule, and the hole in it

A title enters our Korean count because its name matches a Korean work in Wikidata. That rule can
fail in exactly one direction: another country made something with the same name.

The guard against it is Netflix's own label. Netflix classes its global charts as English and
Non-English, so a title that shows up on the English global chart is not the Korean work of that
name, and we drop it. That guard works — it is how *Suits* and *The Perfect Couple* left our
catalogue in an earlier correction.

But the label exists **only on the global charts**. A title that never reached a global top 10 has
nothing to check against. We keep it, because dropping titles for lacking a label we cannot obtain
would quietly delete real Korean shows.

Keeping is not the same as confirming. Here is the size of the difference:

| Of the 39,139 Korean chart places | Places | Share |
|---|---:|---:|
| Carry Netflix's Non-English label — checked | 32,129 | **82.1%** |
| No label at all — kept because we could not check | 6,481 | **16.6%** |
| Label says both — the name is on an English chart too | 529 | 1.4% |

## Why we had never published this

We had. Sort of. Two of our pages carry a count of titles with no language label, and the sentence
has always been true. It has always been the wrong unit too.

When that count read **197 titles**, the phrase it produced was *197 titles out of nine hundred*,
which sounds like a rounding error.

**16.1% of
the places behind our headline figure** does not. The same fact, counted the way the number is
actually used, is roughly six times more alarming — and it is the version that matters if you are
deciding whether to rely on the figure.

The count reads **215** today, against the 421 titles in the panel, and the unit problem has
flipped rather than gone away: as a title count it now reads like half the panel, which overstates
the risk as badly as *197 out of nine hundred* understated it. Neither is the number to quote. The
share of chart places is.

We counted titles because titles were what the collector happened to have. That is not a reason.

## A second check, which disagrees about which titles are the problem

The language label asks whether a title is *not English*. It never asks *which work this is*. For
that we hold a Wikidata item number, matched by number rather than by name — the fix we made in
August after discovering that name matching is case-sensitive and was silently dropping Korean films
filed as *LAND* and *DETOUR*.

By that measure the picture is much better: **97.6%** of the places sit on titles with an item
number. Only **934 places — 2.4%** entered on a name match alone.

Neither check is a superset of the other. A title can carry a Wikidata number and still have no
language label; the reverse happens too. So we publish both rather than the flattering one.

## What we did not do

We did not remove the 6,059 unchecked places to make the number cleaner. It would have taken one
line, the headline would have moved from 7.7% to something slightly lower, and it would have been
**smaller without being truer** — those titles are not known to be wrong, only unverified.

We also did not stop publishing 7.7%. A figure with a stated confidence is more useful than no
figure, and considerably more useful than a figure whose confidence is not stated.

## How this came up

It came from another desk. A colleague auditing a different dataset had been counting the rows their
tool silently *dropped*, found none, and then went looking in the opposite direction — for rows it
silently *let in*. They found 369 withdrawn workplaces being counted as active.

We had done the same audit that morning and stopped at the same halfway point: we had counted what
our collectors throw away, confirmed it was nothing, and never asked what they wave through.

**A pipeline has two silences and most people only ever check one.**

## What this means for the figure

7.9% stands. What changes is the sentence around it: of the places it counts, 82.3% are confirmed
not to be English-language works of the same name, 1.4% are known to be ambiguous, and 16.1% are
unverified in that specific way. On the other axis, 99.2% are identified by a database number rather
than by their name.

If you use our figure, that is the disclosure you should have had from the start. It is on
**[the world share page](/world-share)** now, in the same table as the number itself, which is where
it should have been.

## What changed on 3 September 2026

Our list of Korean titles had been frozen at 8 August. We rebuilt it, it went from 397 titles to
420, and one title we had been counting as Korean (*Dangerous Liaisons*, the 2022 French film) is
not. **3 figures in this piece moved with it.** None of them changed what the piece found. The
ones a reader is most likely to have quoted:

| | Was | Now |
|---|---|---|
| Korean chart places | 39,612 | 39,139 |
| Places we can check against a label | 82.3% | 82.1% |
| Places we cannot check | 16.4% | 16.6% |

Every table above is now generated from the counted file rather than typed out, and a check reads
each figure back out of that file on every build. We print what moved rather than swapping it
quietly: one wrong number makes the correct ones beside it worth doubting.