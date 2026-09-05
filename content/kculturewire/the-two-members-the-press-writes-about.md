---
title: "Korean outlets named two BTS members in three days. Readers opened the other five"
dek: "Across 90 K-culture headlines from two Korean outlets, 19 mentioned BTS. Only Jin and Jimin were named — 12 and 9 times. V and Jung Kook, the two most-read members on English Wikipedia, were named zero times."
category: stars
purpose: both
pubDate: 2026-09-04
dataAsOf: 2026-09-04T00:00:00+09:00
author: Newsroom
tags: ["korea", "kpop", "bts", "press", "measurement"]
pages:
  - "/member-vs-group"
  - "/most-read"
  - "/pickup"
sources:
  - org: "Star News, Ten Asia"
    api: "Our own daily archive of Korean entertainment headlines, 2026-09-02 to 2026-09-04, three days; 90 headlines from the two outlets our collector reads"
    url: "https://www.kculturewire.com/"
  - org: "Wikimedia"
    api: "Pageviews API, en.wikipedia, all-access, user agents only, 2026-07-24 to 2026-08-22, 30-day daily average per member"
    url: "https://wikimedia.org/api/rest_v1/"
crossChecks:
  - "Headlines are counted, not name occurrences. A headline naming a member twice counts once, and the script tests that case"
  - "Member names are counted only inside headlines that also carry the group name, because Jin, V and RM are short enough to match unrelated Korean words. The cost is that solo headlines omitting the group name are missed, and that cost is stated rather than hidden"
  - "The script's own tests pin what it cannot do: inside a group headline, the syllable in Jin still matches the Korean word for 'really', and that false match is asserted in the test rather than quietly fixed"
  - "All seven members were located in the reading panel before any zero was reported. Two were initially recorded as absent under guessed article titles and found under their real ones"
  - "Reading figures and headline counts come from different windows and are not combined into one score; they are placed side by side"
excluded:
  - "Any trend. The headline archive is three days old. Three days cannot separate a pattern from a week"
  - "Korean press as a whole. Two outlets are in this count, the two our collector reads"
  - "Why an outlet chose a member. Releases, appearances, agency distribution and campaign timing are none of them in this data"
  - "Korean-language reading. The pageview figures are English Wikipedia only"
  - "Whether headline attention converts into anything at all"
---

We archive Korean entertainment headlines every night. We also hold English Wikipedia reading
figures for 2,372 Korean music acts. Putting the two beside each other answers a question
neither one answers alone: **are the people the press writes about the people readers open?**

For BTS over the last three days, no.

## Nineteen of ninety

Two Korean entertainment outlets produced 90 headlines our collector kept across 2, 3 and 4
September. **Nineteen of them — 21.1% — carried the group name.**

| Day | Headlines kept | Mentioning BTS | Share |
|---|---:|---:|---:|
| 2 September | 33 | 6 | 18.2% |
| 3 September | 30 | 6 | 20.0% |
| 4 September | 27 | 7 | 25.9% |

One group took a fifth of a day's K-culture headlines, three days running, from outlets that
cover all of Korean entertainment.

Three days is three days. We are not calling that a trend, and the archive is not old enough to
support one.

## Two members named, five not

Inside those 19 headlines, exactly two members were named.

| Member | Headlines naming them | English Wikipedia readers/day |
|---|---:|---:|
| V | **0** | **3,948** |
| Jung Kook | **0** | **3,458** |
| Jimin | 9 | 2,285 |
| Jin | 12 | 2,161 |
| RM | 0 | 2,120 |
| Suga | 0 | 2,075 |
| J-Hope | 0 | 1,780 |
| BTS, the group | 19 | 8,689 |

The two members who appear in the headlines sit third and fourth by reading — Jimin third, Jin fourth. The two most-read
members appear **zero** times in three days of coverage from these outlets.

The spread between members is not large — 1,780 to 3,948, a little over twofold across all
seven. The spread in coverage is total: 21 headlines to none.

## What the headlines were about

Almost all of the 19 are about rankings. Fan-vote wins, weekly poll placings, consecutive weeks
at number one, most-searched lists. "Jin, 67 consecutive weeks at number one in an idol pick."
"Jimin, weekly global poll number one, a cumulative 220 firsts."

That is a coherent editorial choice, not an error: vote results arrive daily, they are
countable, and they name a member. Reading figures arrive from somewhere else entirely and name
nobody.

## The honest limits of this count

Member names are counted only inside headlines that also carry the group name. Jin, V and RM
are short strings in Korean and match unrelated words otherwise. That choice costs us any solo
headline that omits the group name, and we cannot say how many of those there were.

The same choice leaves one false match in place: inside a group headline, the syllable in Jin's
name also begins the Korean word for "really." Our script's own tests assert that false match
rather than paper over it, so anyone reading the code sees the flaw before they use the number.

And the two figures come from different windows — headlines from this week, reading from the 30
days to 22 August. We put them side by side. We did not combine them into a score.

**This is a count of headlines and of readers, not a ranking of members.**

The tables behind this are at [kculturewire.com/member-vs-group](/member-vs-group?from=body), [kculturewire.com/most-read](/most-read?from=body) and [kculturewire.com/pickup](/pickup?from=body).
