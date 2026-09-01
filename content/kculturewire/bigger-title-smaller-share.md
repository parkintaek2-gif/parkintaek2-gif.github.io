---
title: "Hyun Bin took 34% of his show's peak. Song Kang-ho got 3.9%"
category: stars
genre: drama
purpose: both
dek: "We measured twelve Korean breakouts on English Wikipedia: the title's biggest day, and that day for its most-read cast member. The bigger the title, the smaller the share reaching any one actor. r = -0.68, n = 12, p = 0.016."
pubDate: 2026-09-01
dataAsOf: 2026-09-01T00:00:00+09:00
author: Newsroom
tags: ["hyun-bin", "song-kang-ho", "lee-jung-jae", "song-hye-kyo", "park-eun-bin", "ryu-jun-yeol", "gong-yoo", "kim-hyun-joo", "parasite", "squid-game", "crash-landing-on-you", "mousetrap"]
pages:
  - "/most-read"
  - "/person"
sources:
  - org: "Wikimedia"
    api: "Pageviews per-article daily, en.wikipedia, user agents only; one window per title around its release"
    url: "https://wikimedia.org/api/rest_v1/"
  - org: "Wikidata"
    api: "Cast members (P161) of each title with an English Wikipedia article"
    url: "https://query.wikidata.org/"
crossChecks:
  - "We did not pick who the lead is. For each title we measured every cast member with an English Wikipedia article and took whichever one was read most on the title's own biggest day. When we first ran this with hand-chosen leads, two of the twelve were wrong — Hellbound's most-read cast member is Kim Hyun-joo, not Yoo Ah-in, and The Silent Sea's is Gong Yoo, not Bae Doona."
  - "108 cast members were measured and 30 could not be — no article, no data in the window, or a renamed page. Those 30 are unmeasured, not zero, and one of them could hold a higher figure than the one we report for its title."
  - "The twelve titles are ones we knew had broken out. That is not a random sample of Korean titles, and a relationship inside a set of hits does not carry to titles that never became hits."
  - "One title's biggest day is compared against the same day for its cast, not against the cast's own biggest day. Actors often peak a day or two later, so these shares are floors on how much attention eventually transferred."
excluded:
  - "Why attention transfers, or fails to. Press coverage, interviews, existing fame and whether a face is on the poster are not in this data."
  - "Everything outside English Wikipedia. A Korean actor's own-language readership is a different measurement."
  - "Ensemble structure. Parasite has no single lead by design and Mousetrap has three named actors; we did not adjust for that, and it is inside the numbers."
draft: false
---

On 17 February 2020, *Crash Landing on You* had its biggest day on English Wikipedia: **131,083 reads**. The same day, **Hyun Bin** was read **44,880 times** — **34.2%** of the show's figure.

On 10 February 2020, *Parasite* had its biggest day: **2,696,922 reads**. The same day, **Song Kang-ho** — the most-read member of that cast — took **105,177**, which is **3.9%**.

Both are Korean breakouts. Both were the biggest thing in Korean culture in the same month. One of them handed a third of its attention to a person, and one handed less than a twenty-fifth.

## The twelve

For each title we took its single biggest day on English Wikipedia, then measured **every** cast member with an English Wikipedia article on that same day, and kept whichever one was read most. We did not decide who the star was — the count did.

| Title | Its biggest day | Most-read cast member | Their reads | Share |
| --- | --- | --- | --- | --- |
| Parasite | 2,696,922 | Song Kang-ho | 105,177 | **3.9%** |
| Squid Game | 889,821 | Lee Jung-jae | 92,964 | **10.4%** |
| All of Us Are Dead | 225,923 | Cho Yi-hyun | 39,862 | 17.6% |
| Crash Landing on You | 131,083 | Hyun Bin | 44,880 | **34.2%** |
| Hellbound | 108,058 | Kim Hyun-joo | 12,977 | 12.0% |
| Sweet Home | 106,217 | Song Kang | 19,439 | 18.3% |
| The Glory | 102,540 | Song Hye-kyo | 27,338 | 26.7% |
| Itaewon Class | 74,543 | Park Seo-joon | 23,054 | 30.9% |
| Extraordinary Attorney Woo | 69,017 | Park Eun-bin | 20,136 | 29.2% |
| Kingdom | 63,783 | Ju Ji-hoon | 11,142 | 17.5% |
| The Silent Sea | 59,760 | Gong Yoo | 13,678 | 22.9% |
| Mousetrap | 23,512 | Ryu Jun-yeol | 5,427 | 23.1% |

## The relationship, and what it survives

Plotted against the log of the title's peak, the share moves the other way: **r = −0.678**, with twelve titles. That gives t = −2.92 on 10 degrees of freedom, **p ≈ 0.016** — inside the 0.05 line we hold ourselves to.

**The bigger the title got, the less of it landed on any one person.**

We are stating it that carefully on purpose. Twelve is a small number, and these twelve are titles we already knew had broken out — we did not draw them at random from all Korean releases. A relationship measured inside a set of winners does not tell you what happens to everything else.

## Why the effect could be real anyway

There is a plain mechanism available, and it does not require anything mysterious.

A title that reaches 2.7 million reads in a day has reached far past the people who follow Korean film. Most of those readers arrived for the event — an Oscar, a phenomenon — and the event is the title. They look up the film and stop. A title at 60,000 reads has mostly been found by people already inside the audience, and those people go on to the cast page.

**A wider audience is a shallower one.** That is what a falling share looks like from the inside.

We cannot test that mechanism with this data, so we are offering it as a reading, not a finding. The finding is the number.

## What this is useful for

If you want to know whether a Korean title made anyone famous, the title's own peak is a poor guide — the biggest titles here converted the worst. *Crash Landing on You* was a twentieth of *Parasite*'s size and put nearly nine times the share onto its lead.

That is measurable, nobody publishes it, and it took twelve titles and 108 actors to say it with a number attached.
