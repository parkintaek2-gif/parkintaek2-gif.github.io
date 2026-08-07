---
title: "One flaw in how we matched titles put wrong figures on seven pages and five articles in a single morning"
dek: "Our Korean Netflix catalogue was 294 titles and 27.7 billion hours. It is 236 and 23.7 billion. Here is the mistake, how it spread, why counting alone would never have caught it, and what we changed so it cannot happen the same way twice."
category: screen
pubDate: 2026-08-07
dataAsOf: 2026-08-07T00:00:00+09:00
author: Newsroom
tags: ["netflix", "korea", "measurement", "corrections", "data quality"]
pages:
  - "/watched"
  - "/titles"
  - "/staying-power"
sources:
  - org: "Netflix"
    api: "Top 10 weekly lists (Tudum), global and per-country, 265 weeks from 2021-07-04 to 2026-07-26. The global lists carry a language category; the country lists do not"
    url: "https://www.netflix.com/tudum/top10"
  - org: "Wikidata"
    api: "Country of origin (P495 = Q884), used to match chart titles to Korean works by name"
    url: "https://query.wikidata.org"
crossChecks:
  - "Every figure in this piece is read from the same corrections record that feeds our corrections page and the corrections file in our data bundle, not retyped for the article"
  - "The seven page corrections and five article corrections are counted separately because they are stored separately — pages in a data file, articles in each article's own front matter"
  - "The before and after figures are the ones actually published, not reconstructions"
excluded:
  - "Any claim that the corrected figures are final. They are the best we can currently show, and 204 of 405 titles in the Southeast Asia panel still cannot be language-verified at all"
  - "Any suggestion that we found this because our process is good. We found it because one title on a page looked wrong to a person reading it"
---

On 7 August 2026 we changed twelve published figures. Seven were on data pages, five were inside
articles. **All twelve came from one flaw**, and it had been live for days.

| Page | Was | Now |
| --- | --- | --- |
| /watched | 294 titles · 27.7bn hours | 236 titles · 23.7bn hours |
| /titles and /reach | 448 titles | 405 titles |
| /screen-split | built on the 294 | built on the 236 |
| /staying-power | listed *Teach You a Lesson* as a Korean title | removed |
| Front page | included two Chinese dramas | removed |
| /tv-exports | terrestrial 65.7% of exports | 81.5% |
| /industry | content pay ₩75.6m | ₩76.1m |

## The flaw

Netflix does not publish a country of production. To build a Korean panel you have to decide which
chart rows are Korean, and the obvious method is to take a list of Korean works from Wikidata and
match it against the charts **by title text**.

That works until two countries make something with the same name, which they do constantly.
*Teach You a Lesson* is Chinese. *Hunger* is Thai. *Forgotten Love* is Polish. *The Empress* is
German. Each of them matched a Korean work with the identical English name, and each of them was
counted as Korean.

Fifty-two titles were in our catalogue that should not have been. They carried four billion viewing
hours with them.

## Why counting would never have found it

This is the part worth keeping.

**Every total looked healthy.** 294 titles is a plausible number. 27.7 billion hours is a plausible
number. Nothing was zero, nothing was negative, no check failed, and the figures moved smoothly week
to week. A monitor watching for anomalies would have watched this for a year without a flicker.

The error was found because somebody read a page and thought *that title does not look Korean*. Not
a threshold, not an alert — a person recognising a name. We have said before that things which fail
loudly are the easy ones; this is the other kind.

## The part that surprised us

Fixing the source was maybe a third of the work. **The wrong figures had been quoted.**

Two of our own articles cited the 294-title catalogue as background. A third used it to compute a
different statistic entirely. `/screen-split` was built on the same base. `/industry` had an
unrelated error — non-disclosing companies left in a denominator — that only surfaced because we were
already re-reading everything.

A correction is not finished when the cause is fixed. It is finished when everything that repeated
the number has been swept, and something exists to stop it recurring. Twelve figures moved because
one rule was wrong; a sweep that stopped at the rule would have left seven of them standing.

## What changed so it cannot happen the same way

**The rule lives in one file now.** It had been copied into two build scripts, so fixing one left the
other wrong. That is now `scripts/lib/korean-netflix-titles.mjs`, and everything that needs the
judgement calls it.

**The rule got a real test.** Netflix splits its *global* chart by a title's primary language, and a
Korean work belongs on the Non-English side. Restricting to that removed the 52 automatically rather
than by inspection. Nine more came out by hand after we read the largest titles one at a time.

**Hand-made data files were converted to scripts.** Seven data files on the site had no build script
— they had been produced once and edited since. A file nobody generates cannot follow a rule change.

**And a check now looks at the output rather than trusting the rule.** Putting the rule in one place
does not stop the next script from failing to call it, which is exactly what happened later the same
day when a new collector we wrote re-introduced the same foreign titles. A check now reads every
roster we produce and fails the build if a known foreign title is in it.

## What is still wrong

204 of the 405 titles in the Southeast Asia panel have never reached a global Top 10, so the
language test cannot be applied to them at all. They are in the panel on a name match — the same
weak key that caused all of this — and we cannot tell you what share of them is foreign, because we
have not read all 204.

That number is now printed on the pages that use it, and there is a check that fails our build if it
stops being printed. It is the honest state of the thing: one flaw found and fixed, and a second,
larger version of the same flaw that we can measure the size of but not yet close.
