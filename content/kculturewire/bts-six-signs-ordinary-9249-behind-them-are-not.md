---
title: "BTS's six star signs are the ordinary result. The 9,249 behind them are not"
dek: "Seven members, six signs, one overlap — RM and Jung Kook, both Virgos. Drawing seven Korean stars at random gives six distinct signs 38.7% of the time, the commonest outcome there is. The population they came from is the strange part."
category: stars
purpose: both
pubDate: 2026-09-05
dataAsOf: 2026-09-05T00:00:00+09:00
author: Newsroom
tags: ["korea", "kpop", "bts", "astrology", "measurement"]
pages:
  - "/bts-star-signs"
  - "/star-signs"
sources:
  - org: "Wikidata"
    api: "Korean entertainers with a date of birth (P569), 9,249 people, archived locally as korean-entertainers-birth.json"
    url: "https://www.wikidata.org/"
crossChecks:
  - "The chance baseline is drawn from our own distribution, not from a flat twelve. Seven people are drawn 200,000 times with a fixed seed (20260905), so the figure reproduces exactly on a re-run"
  - "Every one of the 9,249 has a usable date of birth. Nobody was dropped, so the sign counts are of the whole set we hold"
  - "Capricorn is reported twice — as counted, and with 1 January removed — because 1 January is the date used when only a year of birth is known. Pisces, the largest sign, is unaffected by that date and stays largest either way"
  - "Months are compared per day, not per month, so February's 28 days do not make it look thin"
  - "The seven members' dates were run through the same boundary table as the other 9,242 people. No one was placed by hand"
excluded:
  - "What a star sign means. We do not say, and no birth date carries that information"
  - "Birth times. Public profiles do not publish them, so no natal chart is possible for anyone here"
  - "Whether Korean births in general follow this shape. These are entertainers with a Wikidata entry, not a national birth register, and we have not compared the two"
  - "Why 28 February also holds 48 people. We could not establish it and a guess would make every other flag here untrustworthy"
  - "The UK Official Albums Chart. It is why we opened the file and it is not a number of ours"
---

Seven people. Six star signs. **RM and Jung Kook are both Virgos, and nobody else in BTS overlaps.**

That looks like it should mean something. We checked whether it does, and the checking is where the
story turned out to be.

| Member | Born | Sign |
|---|---|---|
| Jin | 1992-12-04 | Sagittarius |
| Suga | 1993-03-09 | Pisces |
| J-Hope | 1994-02-18 | Aquarius |
| RM | 1994-09-12 | Virgo |
| Jimin | 1995-10-13 | Libra |
| V | 1995-12-30 | Capricorn |
| Jung Kook | 1997-09-01 | Virgo |

## Six of seven is the most likely answer there is

We hold 9,249 Korean entertainers with a date of birth. We drew seven of them at random 200,000
times, using the real distribution rather than an even one, and counted how many distinct signs
came out.

| Distinct signs | Share of draws |
|---|---:|
| 3 | 1.1% |
| 4 | 11.8% |
| 5 | 37.3% |
| **6** | **38.7%** |
| 7 | 11.0% |

**Six is the commonest outcome, though only just** — five comes up 37.3% of the time, and a
different seven people could easily have landed there instead. Either way, nothing about how BTS is
spread across the zodiac is unusual. If you were hoping for a pattern, this is the honest answer:
there isn't one.

## The population is where the strange number is

While building that baseline we had to count the signs across all 9,249, and that count does not
look like chance at all.

If birthdays fell evenly, each sign would hold about **771** people, and chance alone would move
that by roughly 27 either way. Four signs sit far outside that.

| Sign | People | Expected | Distance from chance |
|---|---:|---:|---:|
| Pisces | 919 | 771 | +5.6 sd |
| Capricorn | 857 | 771 | +3.2 sd |
| Scorpio | 712 | 771 | −2.2 sd |
| Gemini | 688 | 771 | −3.1 sd |

**Pisces holds 919 and Gemini 688** — a gap of 1.34 to one, in a set where chance should keep them
within about 50 of each other.

## It is a fact about the calendar, not about the zodiac

Counted by the day rather than the month, the shape is plain.

| Month | People | Per day |
|---|---:|---:|
| February | 863 | **30.5** |
| January | 897 | 28.9 |
| March | 859 | 27.7 |
| September | 746 | 24.9 |
| June | 654 | **21.8** |

**February makes 30.5 of these people a day and June makes 21.8** — 1.40 to one. Winter and early
spring carry more births than early summer, and the signs simply inherit the calendar. Pisces sits
across the end of February and most of March, which is why it is the largest sign in the set.

Nothing in this says a Pisces is more likely to become famous. It says more people in this set were
born in late winter, and Pisces is the sign that late winter lands in.

## One of these numbers is partly an artefact, and we are not hiding it

**Forty-eight people in our source are recorded as born on 1 January.** That is the date used when
only a year of birth is known, so it is not 48 real New Year's Day births. Capricorn drops from 857
to **809** with those removed — from +3.2 to about +1.4, which is inside the noise.

So Capricorn's excess may be an artefact. **Pisces' is not** — 1 January does not touch it, and at
+5.6 sd it stays the outlier either way.

Twenty-eight February also holds 48 people, and we could not work out why. We are leaving it
unflagged rather than guessing, because a flag we cannot defend would make the 1 January flag worth
less.

## Why we were counting this today

A Korean sports daily reported this week that BTS's *Arirang* was in its 24th week on the UK
Official Albums Chart. We did not measure that chart and make no claim about it — it is the reason
we opened the file, not a number of ours.

What we could do was take the seven people in the story and ask what our own data says about them.
The answer was "nothing unusual," and the honest thing is to publish that. **This is a statistic,
not a person.** We do not tell you what a sign means, because a date of birth does not carry that
information, and pretending otherwise would make us a fortune teller rather than a map.

The seven members' dates, the full twelve-sign table and the month-by-month counts are on
[the page behind it](/bts-star-signs).
