---
title: "We built the day pillar for 9,249 Korean entertainers — IU, Jungkook, RM and BTS included"
category: stars
genre: music
dek: "English saju sites read one chart at a time, so nobody has a denominator. We built one: 9,249 Korean entertainers with a birth date on record to the day. One of our four tests crossed the chance line; here is what we did to kill it."
pubDate: 2026-08-22
dataAsOf: 2026-08-22T00:00:00+09:00
author: Newsroom
tags: ["saju", "stars", "method", "kpop", "wikidata"]
pages:
  - "/day-pillar"
sources:
  - org: "Wikidata"
    api: "Humans (P31=Q5) with South Korean citizenship (P27=Q884) and an entertainment occupation (P106: actor, singer, songwriter, musician), best-ranked date of birth (P569) at day precision, CC0"
    url: "https://www.wikidata.org/"
  - org: "K Culture Wire"
    api: "Sixty-cycle day pillar table, anchored on 1900-01-01 = 甲戌"
  - org: "KLifeMap"
    api: "Saju engine (sajuEngine.js), read as a second opinion on every day pillar we compared — English edition of the same engine"
    url: "https://klifemap.ai/saju.html?lang=en"
crossChecks:
  - "The day-pillar table was anchored twice, on two dates whose day pillars are widely published: 2000-01-01 returns 戊午 and 1949-10-01 returns 甲子. KLifeMap's independent saju engine returns the same day pillar as ours for every date we compared."
  - "Group members were resolved by Wikidata membership in both directions (P463 and P527), never by matching a stage name. An earlier version of the table matched BLACKPINK's Lisa by name and attached a different person born in 1980; the published table has her real date, 27 March 1997."
  - "Only best-ranked birth statements are read. A first pass took any statement and reported ROSÉ as undated when her birth date is on record to the day, 11 February 1997."
excluded:
  - "875 people whose birth date is recorded only to the month or the year. They are counted and reported separately, not folded in as zeroes."
  - "The hour pillar, for everyone. Public records carry birth dates and almost never birth hours, so a four-pillar chart cannot be built for anyone here."
  - "Anyone whose citizenship on record is not South Korean. That is why BLACKPINK's Lisa appears in the group table but not in the 9,249."
---

There are at least eight English-language sites that will read a Korean star's saju chart for you. Every one of them does the same thing: one person, eight characters, a paragraph about what those characters mean. That is a reading, and a reading of one person has no denominator.

So we built the denominator. Wikidata records 9,249 Korean actors, singers, songwriters and musicians whose date of birth is on public record to the day. We put each of them on the sixty-day cycle and counted how they fall across the ten day stems and the twelve day branches. Nobody appears to have done this before, and the reason is structural rather than technical: a business that reads one chart at a time never needs a denominator.

## What the count says

Ten day stems, 9,249 people. A flat spread would put 924.9 in each column.

| Day stem | People | Best-known names in it |
|---|---|---|
| 庚 Gyeong | 984 | Lee Jung-jae, Jung Ho-yeon, Momo |
| 辛 Sin | 964 | Song Joong-ki, RM, Kim Soo-hyun |
| 甲 Gap | 949 | ROSÉ, Jisoo, Kim Seok-jin |
| 乙 Eul | 944 | V, J-Hope, Im Yoon-ah |
| 丁 Jeong | 940 | IU, Kang Seul-gi, Jimin |
| 丙 Byeong | 927 | Jungkook, Chun Jung-myung, Daniel Dae Kim |
| 癸 Gye | 914 | Yun Hyon-seok, Cho Jung-seok, BoA |
| 戊 Mu | 905 | Irene, Gong Yoo, Taeyeon |
| 壬 Im | 890 | Psy, Lee Min-ho, Jennie |
| 己 Gi | 832 | Suga, Bae Suzy, Ken Jeong |

The gap from the fullest column to the emptiest is 152 people out of 9,249. On the twelve day branches the spread is flatter still: 802 in 酉 down to 710 in 丑, chi-square 8.8 against a 0.05 threshold of 19.68.

Then we did the test that matters more. If a day pillar had anything to do with becoming widely known, it should crowd the famous end of the list harder than the middle. We took the most-linked tenth of the same people — 925 of them, everyone with an article in at least 14 Wikipedia editions — and counted again. Chi-square 6.77 on the stems, 5.05 on the branches. Both well inside chance.

## One test crossed the line, and we are not calling it a finding

The day-stem count across all 9,249 came out at chi-square 17.91. The 0.05 threshold at nine degrees of freedom is 16.92. It crossed.

The honest thing to do with a number like that is to try to kill it before publishing it, so that is what we did.

| What we tried | People | Chi-square |
|---|---|---|
| Everyone | 9,249 | 17.91 |
| Administrative-looking dates dropped (1 Jan, 31 Dec, 15 Jan, 1 Jul, 1 Mar) | 9,091 | 17.77 |
| Born 1900–1969 | 1,491 | 15.69 |
| Born 1970–1989 | 4,173 | 16.10 |
| Born 1990–2029 | 3,585 | 8.31 |

Dropping the dates that look filed rather than remembered moves it by 0.14. No single era crosses on its own. The most-linked tenth does not cross. The day branch does not cross. And we ran four tests in total — day stem and day branch, each for everyone and for the most-linked tenth — which means one crossing at the 0.05 level happens by chance roughly one time in five.

We publish the 17.91. We also publish every attempt to kill it. What we will not do is tell you that a day stem does anything, because our own data does not support that sentence.

## BTS across six of the ten

The count is about the group, so here is the same point in names. BTS's seven members have birth dates on record to the day, and they land on six different day stems: Jin on 甲, Suga on 己, J-Hope and V both on 乙, RM on 辛, Jimin on 丁, Jungkook on 丙. Seven of the most-photographed people alive, scattered across the cycle exactly the way 9,249 people are.

BLACKPINK's four sit on three stems — Jisoo 甲午, ROSÉ 甲申, Jennie 壬子, Lisa 戊辰. Lisa is in that table but not in the 9,249: her citizenship on record is Thai, and the count is of Korean citizens. Saying so is cheaper than letting a group of four look like a group of three.

## What this cannot tell you

A day pillar is one pillar of four, and the fourth cannot be built here for anyone. Public profiles carry dates; they almost never carry hours. That is not a gap in our data so much as a permanent feature of counting public figures.

Counting who exists is also not counting who succeeded. The most-linked tenth is a proxy for how widely a person is written about — not for talent, income, or a chart position.

And the flatness itself is the ordinary result. We have published it before on a different axis: across 1,047 Korean actors who reached a Netflix chart, the spread across the twelve zodiac years is indistinguishable from chance, chi-square 7.77 against 19.68. Two different axes, two different counts, the same shape.

The full table, every column, and the tests we ran are at [kculturewire.com/day-pillar](/day-pillar).
