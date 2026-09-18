---
title: "Sunday Adds 28% to K-Pop Wikipedia Reading. We Audited Our Own Yardstick and Found It."
dek: "Our attention stories compare one day's English Wikipedia reading to a 30-day average. Across seven Korean stars over 78 days, the weekday alone moves that number 28% — for Jin, 68%. We re-checked three published calls; all hold."
category: stars
pubDate: 2026-09-18
dataAsOf: 2026-09-16T00:00:00+09:00
author: Newsroom
tags: ["wikipedia", "attention", "method", "weekday"]
pages:
  - "/what-moves-english-reading"
sources:
  - org: "Wikimedia Foundation — Pageviews API"
    api: "Daily English Wikipedia pageviews, all-access, user agents only, 1 July-16 September 2026, for Jimin, Kim Ji-won, Park Bo-gum, Jung Hae-in, Jin (singer), Lisa (rapper), Cha Eun-woo"
    url: "https://wikimedia.org/api/rest_v1/"
crossChecks:
  - "78 days per page, 1 July-16 September 2026. Each star's own 78-day mean is set to 1.00, so the weekday figures below are that star's own reading, not a comparison between stars."
  - "Seven-star average by weekday: Sunday 1.18x, Monday 1.04x, Tuesday 0.95x, Wednesday 0.92x, Thursday 0.92x, Friday 0.97x, Saturday 1.02x. Highest day over lowest day: 28%."
  - "The spread is not the same for everyone. Jin (singer): Sunday 1.41x, Friday 0.84x — 68%. Jimin: Sunday 1.29x, Friday 0.88x — 47%. Kim Ji-won: Sunday 1.07x, Wednesday 0.97x — 10%."
  - "Re-check of three calls we already published. Jin, 7 September, 'did not move his Wikipedia page': 1.02x once the weekday share is divided out — the call holds, and holds more strongly than we wrote it."
  - "Le Sserafim, 14 September, 'a real Wikipedia spike': 2.36x with the weekday share removed. The call holds."
  - "Stray Kids, 12 September, 'rose at Rock in Rio': their Saturday factor is 1.00, so there was no weekday share to remove. The call holds."
excluded:
  - "An eighth page, Karina (singer), was dropped by the tool itself: the daily reading was too low for a weekday average we would trust. We are not reporting a number we could not measure."
  - "Cycles other than the weekday — start of month, awards season, tour calendars. We did not test for those and are not claiming they are absent."
  - "Any correction to the 221 articles already published. We re-measured three of them; the rest still carry raw multipliers, and we say so below rather than quietly restating them."
---

Every attention story on this site rests on one number. We take a person's English Wikipedia page, average its daily reading over 30 days, and ask how many times that average a particular day reached. A news event lands, we look at the day it landed, and we report what the reading did. That number is why we can say a billion-stream announcement did not travel, or that a festival set did.

This week we turned the yardstick on itself, and found something sitting inside it.

## The day of the week is worth 28%

We pulled 78 days of daily English Wikipedia reading — 1 July to 16 September 2026 — for seven Korean stars, set each person's own average to 1.00, and sorted their days by weekday.

| Weekday | Seven-star average |
|---|---|
| Sunday | 1.18x |
| Monday | 1.04x |
| Tuesday | 0.95x |
| Wednesday | 0.92x |
| Thursday | 0.92x |
| Friday | 0.97x |
| Saturday | 1.02x |

Sunday runs 28% above Thursday. No event is required. That is what an ordinary week looks like when nothing at all has happened.

## It is not the same 28% for everybody

The average hides the part that matters more. Set each star's own quietest day against their own busiest day:

| Star | Highest day | Lowest day | Spread |
|---|---|---|---|
| Jin (singer) | Sunday 1.41x | Friday 0.84x | 68% |
| Jimin | Sunday 1.29x | Friday 0.88x | 47% |
| Jung Hae-in | Sunday 1.21x | Thursday 0.81x | 49% |
| Lisa (rapper) | Friday 1.15x | Thursday 0.87x | 32% |
| Park Bo-gum | Saturday 1.07x | Wednesday 0.96x | 11% |
| Kim Ji-won | Sunday 1.07x | Wednesday 0.97x | 10% |
| Cha Eun-woo | Saturday 1.03x | Tuesday 0.94x | 10% |

Which means the same headline figure carries different weight depending on whose page it is. A Sunday reading of 1.3x is a real move for Kim Ji-won, whose Sundays normally sit at 1.07x. The identical 1.3x on Jin's page, whose Sundays normally sit at 1.41x, is a quiet day.

Lisa is the one that breaks the pattern: her busiest day is Friday, not Sunday. We are not going to invent a reason for that. We measured it and we are reporting it.

## We went back to three calls we had already published

The honest question is whether this changed anything we told readers.

**Jin, 7 September — "his billion-stream song did not move his Wikipedia page."** Once the weekday share is divided out, that day comes to 1.02x. The call holds, and it holds more firmly than we originally wrote it: a raw figure that looked like a small rise turns out to be an ordinary Monday.

**Le Sserafim, 14 September — "a real Wikipedia spike."** 2.36x with the weekday share removed. The call holds.

**Stray Kids, 12 September — "rose at Rock in Rio."** Their Saturday factor is 1.00 — there was no weekday share to remove. The call holds.

Three for three. But we want to be precise about what that means, because "we were right" is the easy version of this story and it is not quite the true one. The three calls were right; the method that produced them was not looking at the weekday at all. On a 2.4x or a 1.0x the weekday cannot flip the answer. On a 1.15x it can, and sooner or later we will meet a 1.15x.

## What changes, and what does not

From here the weekday share comes out before we call a day a move. The tool that does it is in our repository, it refuses to produce a weekday average when the underlying reading is too thin, and it has its own tests.

That refusal is the part we care about most. An eighth page went into this measurement and came back out: Karina's daily reading was low enough that a weekday average built on it would have been noise wearing the costume of a number. The tool dropped her rather than reporting it. We would rather publish seven rows and say why the eighth is missing.

The 221 attention stories already on this site still carry raw multipliers. We are not going to go back and silently restate them. We have said here what the raw figures do and do not account for, and readers can weigh the older pieces with that in hand.

One last thing this does not do. It measures a weekly rhythm in how many people opened an English Wikipedia page. It does not measure why any individual person opened it, and it says nothing about whether the reading was warm or cold. We hold one measurement, and the weekday is now part of reading it properly.

This method note lives alongside our running record on
[what-moves-english-reading](/what-moves-english-reading).

*These are statistics, not you. This is not investment advice.*
