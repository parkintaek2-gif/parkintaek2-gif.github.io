---
title: "Twenty-one corrections in three days, and eight distinct ways of being wrong. All eight now fail the build."
dek: "We tagged every changed figure with the kind of mistake that produced it. One kind accounts for eight of the twenty-one. This piece went out with four of the eight untested; the missing four were written the same afternoon."
category: screen
pubDate: 2026-08-08
dataAsOf: 2026-08-08T00:00:00+09:00
author: Newsroom
tags: ["corrections", "measurement", "method", "data quality"]
pages:
  - "/corrections"
  - "/data"
sources:
  - org: "K Culture Wire"
    api: "Our own corrections record — every changed figure on a page or in an article since 6 August 2026, each tagged with the cause that produced it and, where one exists, the check that now guards against it"
    url: "https://www.kculturewire.com/corrections"
crossChecks:
  - "The counts here are read from the corrections file the corrections page is built from, so this article cannot drift from that page"
  - "Every guard named is a script that exists in the repository; the check behind this article fails if a named guard is missing"
  - "The four unguarded causes are counted from the same file, so the gap cannot be understated by leaving one out"
excluded:
  - "Mistakes we caught before publishing. This record starts at the moment a wrong figure was readable by someone else; the ones we caught in drafting are not corrections and counting them would flatter us"
  - "Any claim that eight is the number of ways we can be wrong. It is the number we have met so far, and the fourth new kind appeared today"
  - "Severity ranking. A one-word label error and a 14% overcount are both listed as one correction each, because we have no honest way to weigh them against each other"
---

We keep a record of every figure we have published and had to change. As of today it holds
**21 corrections** — 11 on data pages and 10 in articles — made across three days.

Counting them was never the interesting part. What we wanted to know was whether they were 21
separate accidents or a few repeating shapes. So each one carries a tag for the **kind** of mistake
that produced it.

There are eight kinds.

## What went wrong, and how often

| Cause | Pages | Articles | Guarded by a test |
| --- | ---: | ---: | :--- |
| Matched a Korean title by name alone | 5 | 3 | yes |
| Our attribution query contradicted our own panel | 1 | 2 | yes |
| A KOSIS table classifies on two levels, we read one | 1 | 1 | yes |
| A sentence about the data was never measured | 1 | 1 | yes |
| Companies without pay data left in the denominator | 1 | 0 | yes |
| Our corrections article miscounted the corrections | 0 | 1 | yes |
| A comparison computed on a group selected by the outcome | 1 | 1 | yes |
| A limitation written down and never tested | 1 | 1 | yes |

**One cause produced eight of the twenty-one.** Titles entered our Korean panel because their English
name matched a Korean work, and foreign works with the same name came in with them. That single flaw
moved figures on five pages and in three articles, and it is the reason the panel now carries
[two independent columns saying how sure we are of each row](/data).

## The half that had no test now has one

When this piece first went out, four of the eight kinds failed the build if they recurred and four
did not. We published the gap rather than the coverage, because a list of missing tests is worth more
to someone deciding whether to trust these numbers than a sentence about taking accuracy seriously.

**The four missing tests were written the same afternoon.** Here is what each one actually does, which
matters more than the fact that it exists.

- **Our attribution query contradicting our own panel.** Every title in the panel is now checked
  against the query that decides whether a Korean work carries that name. If the query names no
  Korean work, the build stops. Titles the query has never heard of are counted separately and not
  treated as foreign — not knowing and knowing-otherwise are different facts.
- **Two-level classification in a government table.** For every year, the parts must sum to the
  published total. Reading one level and not the other leaves a residual, and that residual is what
  we once printed as a real category. Anything above 0.5% of the total now fails.
- **Denominators that quietly include what they should exclude.** The data must carry the headcount
  the pay average was actually divided by, separately from the total headcount, and the page must
  say the difference out loud. We cannot recompute the average from company rows we do not hold —
  so instead we made silence impossible.
- **Sentences about the data that were never measured.** The narrow version of this is the one that
  works: a claim that something is *empty in every year* is checkable, and each one now needs a
  signature naming what measures it.

That last test taught us something about tests. **The first version flagged 77 sentences and most of
them were good ones** — "nothing here says why", "nothing here is a ranking", the disclaimers we
write on purpose. A check that punishes those would have pushed us to delete the honest sentences to
make the build pass. We narrowed it to claims of emptiness, which is the shape the actual mistake
had, and it went from 77 findings to one — a correction notice quoting the old wrong sentence, which
is signed and stays.

## Why the tag matters more than the count

A correction that only fixes the number leaves the mechanism in place. Twice this week the same
mechanism produced a second error before we had named it: the title-matching flaw moved eight figures
across two days, and
[our own corrections article then miscounted those corrections](/article/one-flaw-twelve-corrections).

So a correction is not finished here until three things are true — the number is fixed, everything
quoting it has been swept, and something exists that would catch it happening again. The third is the
one people skip, and it is the only one that changes anything.

The fourth new kind of mistake appeared **today**, which is the honest note to end on: this is a
record of what we have met so far, not an inventory of what can go wrong.
