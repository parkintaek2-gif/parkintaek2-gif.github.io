---
title: "Korea's Netflix chart led Southeast Asia for 46 of 397 Korean titles. Usually they enter the same week."
dek: "Of the 397 Korean titles that reached Southeast Asia's top 10, Korea's own chart got there first for 46 and in the same week for 160 — and never charted 140 of them at all. Series enter together; films scatter."
category: screen
pubDate: 2026-08-08
dataAsOf: 2026-07-26T00:00:00+09:00
author: Newsroom
tags: ["korea", "netflix", "southeast-asia", "charts", "measurement"]
pages:
  - "/titles"
  - "/reach"
sources:
  - org: "Netflix"
    api: "Tudum weekly Top 10 country lists for Korea and the six Southeast Asian markets, 265 weeks from 2021-07-04 to 2026-07-26"
    url: "https://www.netflix.com/tudum/top10"
  - org: "Wikidata"
    api: "Country of origin (P495 = Q884) to identify Korean titles, and original broadcaster (P449) for the explanation tested below"
    url: "https://query.wikidata.org"
crossChecks:
  - "Each of the seven countries publishes exactly 5,300 rows over the same 265 weeks, so Korea is not being read against a longer or shorter record — the collector refuses to run if those counts differ"
  - "The 397 titles are the same panel that /titles and /reach read, and the collector refuses to run if its count disagrees with theirs"
  - "Every split is reported three ways — all titles, the panel's first week removed, and shared names also removed — and the same-week share moves by 1.6 points across all three"
excluded:
  - "Any statement about what will chart next. This is a record of what has already happened, and the figures below are the reason we do not sell the other kind"
  - "Leads shorter than seven days. Netflix publishes weeks, so a title that opened in Korea on Monday and in Jakarta on Friday looks simultaneous to us. We cannot see that lead and do not claim it is absent"
  - "Release dates. A chart entry is not a release, and Korean films reach Netflix after a cinema run that has no equivalent abroad"
  - "Lead times for nine titles whose name is shared by a film and a series. They stay in the counts, where only the first week matters, and are removed from every figure measured in weeks"
---

The question we are asked most often by readers outside Korea is some version of this: **if I watch
Korea's Netflix top 10, will I see it before my country does?**

That is a question about the future, and we do not sell those. But the backward-looking version is
measurable, and the answer is clear enough that the forward-looking one mostly answers itself.

## Korea got there first for 46 titles out of 397

397 Korean titles have entered the Netflix top 10 in Singapore, Malaysia, the Philippines, Thailand,
Indonesia or Vietnam. For each one we took the first week it charted anywhere in those six, and the
first week it charted in Korea.

| | Titles | Korea first | Same week | Korea later |
| --- | ---: | ---: | ---: | ---: |
| Charted in both | 257 | 46 (17.9%) | **160 (62.3%)** | 51 (19.8%) |
| Panel's first week removed | 246 | 45 | 154 | 47 |
| Shared names also removed | 241 | 43 (17.8%) | **154 (63.9%)** | 44 (18.3%) |

The three rows are the same measurement under progressively stricter conditions, and the answer does
not move: **around five titles in eight enter Korea and Southeast Asia in the same week.**

The remaining 140 titles never charted in Korea at all — 35.3% of everything that reached Southeast
Asia. Set against the whole panel, Korea's chart led for 46 titles in 397. **About one in nine.**

## "Same week" is not "same day", and we cannot tell the difference

Netflix publishes one list per week. A title that entered Korea's chart on a Monday and Jakarta's on
the following Friday appears here as a single simultaneous entry.

So the 62% is not evidence that these titles arrived at the same moment. It is evidence that **any
lead they had was shorter than the smallest unit our source publishes.** That is a limit of the
data, not a finding, and a reader deciding whether to watch Korea's chart should treat it as one.

What we can say is the size of the leads we *can* see. When Korea led, the median lead was **7
weeks**, and 14 of the 43 led by exactly one week. When Southeast Asia led, the median was **86
weeks** — those are catalogue titles finding a second audience abroad a year or two later, not
releases running ahead of Korea.

## Series enter together. Films do not.

| | Titles | Korea first | Same week | Korea later |
| --- | ---: | ---: | ---: | ---: |
| Series | 171 | 24 (14.0%) | **124 (72.5%)** | 23 (13.5%) |
| Films | 75 | 21 (28.0%) | **30 (40.0%)** | 24 (32.0%) |

Nearly three-quarters of Korean series enter both charts in the same week. Korean films do so
40% of the time, and the rest split almost evenly between arriving in Korea first and arriving
later.

The mechanism for series is not mysterious — a Netflix series is released to every country at once,
so the only thing that could separate the two charts is how hard each is to enter. For films it is
different: many Korean films run in Korean cinemas long before they reach Netflix anywhere, and
the order in which they then appear on two charts carries no single story.

## Fifteen titles charted in all six countries and never once in Korea

Not "charted lower in Korea". Never appeared.

| Title | Format | First week in Southeast Asia |
| --- | --- | --- |
| The Penthouse: War in Life | TV | 2022-01-09 |
| The Cursed | TV | 2022-03-20 |
| Bad And Crazy | TV | 2022-04-03 |
| Secret Royal Inspector & Joy | TV | 2022-05-08 |
| Sell Your Haunted House | TV | 2022-07-24 |
| Police University | TV | 2022-07-31 |
| Young Lady and Gentleman | TV | 2022-08-28 |
| Sh\*\*ting Stars | TV | 2022-10-16 |
| Jirisan | TV | 2022-10-30 |
| Unlock My Boss | TV | 2023-03-12 |
| Dr. Romantic | TV | 2023-05-07 |
| Murderer | Films | 2023-11-12 |
| Safe | Films | 2024-03-17 |
| Mama | Films | 2024-06-02 |
| The Stone | Films | 2025-08-03 |

It is worth being precise about what this is not. Korea's list has exactly the same number of places
as Singapore's — **5,300 rows each**, ten titles times two lists times 265 weeks. These titles did
not miss Korea's chart because Korea's chart is smaller.

## The explanation we had, and why we dropped it

Our first guess was the obvious one: these are television dramas. Koreans watched them when they
aired on KBS, SBS, tvN or JTBC, so they never needed Netflix for them, while outside Korea Netflix
was the only route. If that were right, the never-charted group should be full of titles with a
Korean broadcaster and the charted group should not.

We tested it with Wikidata's original-broadcaster field, and among series it goes the wrong way.

| Series | With a recorded Korean broadcaster |
| --- | ---: |
| Never charted in Korea (57) | 46 — **80.7%** |
| Charted in Korea (175) | 163 — **93.1%** |

The titles that *did* chart in Korea are the ones more likely to have aired on Korean television.
The explanation does not hold, and we do not have a replacement for it.

One detail is worth keeping, because it nearly fooled us. Ignoring format, the same comparison reads
**39.0% against 66.4%** — a gap three times larger, pointing the way we expected. That gap is
format mix: the never-charted group is 83 films and 57 series, films rarely carry a broadcaster
field at all, and the number was measuring how many films were in each group. Had we not split by
format we would have published a confirmation of a hypothesis that is false.

## What this can and cannot be used for

It answers a question about the past: how often, so far, has Korea's chart been the earlier one.
Forty-six times in 397.

It cannot tell you whether the next Korean title will follow that pattern, and we are not going to
dress it up as though it can. If you want the underlying counts, they are in the tables behind
[the Southeast Asia panel](/titles) and [the country-reach page](/reach); what those tables cannot
answer is listed on each of them, in the same place as what they can.
