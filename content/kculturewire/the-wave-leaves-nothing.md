---
title: "A Korean series fills the encyclopaedia, then empties it. What it leaves behind is a slightly lower floor"
category: industry
purpose: both
dek: "Five Korean titles could be measured before and after their peak month in four Southeast Asian Wikipedias. The median peak was 2.2 times the surrounding months. The median floor afterwards was 6.7% lower than before."
pubDate: 2026-08-15
dataAsOf: 2026-08-15T00:00:00+09:00
author: Newsroom
tags: ["korean drama", "wikipedia", "attention", "squid game", "korea", "method"]
pages:
  - "/wave-and-floor"
  - "/what-actually-fell"
sources:
  - org: "Wikimedia"
    api: "Pageviews API, Indonesian, Vietnamese, Thai and Malay editions, monthly, August 2022 to June 2026"
draft: false
---

Yesterday's article ended without an explanation, which is an uncomfortable place to leave a reader. Going back through the same editions for something we had missed, we found one number behaving unlike all the others: reads of Korean screen articles, averaged, were up 88.7% over the year. The median for the same group was down 29.1%.

Both figures are correct. One article was doing all the work.

That article is worth knowing about on its own. In January 2025, reads of the Squid Game article across the Indonesian, Vietnamese, Thai and Malay Wikipedias came to 2,046 per million reads of those editions — **thirty-five times** the six months before it. Nothing else in this dataset comes close.

Which raises a question a Korean studio might actually want answered. When a title lands like that and then recedes, does it leave the floor higher than it found it?

## What we measured

For each title: find its highest month, average the six months before it and the six after, and skip two months either side of the peak because those are still the wave. Then compare the two floors.

| Title | Peak | Peak ÷ floor | Floor before | Floor after | Change |
| --- | --- | --- | --- | --- | --- |
| Kingdom | 2025-02 | 4.6× | 43.2 | 69.3 | +60.2% |
| Train to Busan | 2025-01 | 1.9× | 84.1 | 79.9 | −5.0% |
| Crash Landing on You | 2024-04 | 2.4× | 128.8 | 120.1 | −6.7% |
| Vincenzo | 2024-04 | 2.2× | 72.5 | 60.3 | −16.9% |
| All of Us Are Dead | 2025-07 | 1.8× | 101 | 72.9 | −27.8% |

Reads are per million reads of that Wikipedia, summed across the four editions.

The median wave is 2.2 times the surrounding months. The median floor afterwards is 6.7% lower than before. One title of five ended higher.

We are reporting the median and not the mean because with five titles a single one moves the mean by itself — the mean change here is +0.8%, which would let us write that the floor holds steady. It does not describe any of these five titles.

## The biggest wave is the one we cannot use

Squid Game is missing from that table, and the reason is the most interesting thing on this page.

Its floor after the peak looked like it had risen 366%. Then we read the six months that floor was made of:

| 2025-04 | 2025-05 | 2025-06 | 2025-07 | 2025-08 | 2025-09 |
| --- | --- | --- | --- | --- | --- |
| 211 | 144 | 386 | 617 | 169 | 96 |

June and July are not a floor. They are the next season, arriving inside the window we were using to measure the aftermath of the last one. Three of those six months are more than triple the floor before the peak.

So the largest wave in the data tells us nothing about what waves leave behind, and the check that caught it is now part of the tool: if any month in the after-floor is more than three times the before-floor, it is not a floor.

## Fifteen titles we could not measure

This is most of what we fetched, and pretending otherwise would misrepresent how thin the answer is.

| Why not | Titles | How many |
| --- | --- | --- |
| The peak sits too close to the start of the window | Alchemy of Souls, Itaewon Class, Queen of Tears, Mask Girl | 4 |
| Not enough months in the four editions | Sweet Home, Hellbound, The Glory, Extraordinary Attorney Woo, Moving, The8 Show | 6 |
| The peak sits too close to the end of the window | Parasite, Oldboy, Culinary Class Wars | 3 |
| A second wave sits where the floor should be | Squid Game | 1 |
| The floor before the wave was too thin to take a percentage | Physical: 100 | 1 |

Physical: 100 is the clearest case of why the last rule exists. Its floor before the peak was 1.3 per million and afterwards 2.4 — an 82.7% rise between two numbers that are both, in practice, nobody.

## The peaks are not spread out, which is the real problem

Five peaks, three clusters: April 2024, January and February 2025, July 2025. Two of the five titles peaked in neighbouring months.

If each of these titles had risen in its own month, we would be measuring titles. Sharing months means we may be measuring those months — something that happened across these four editions in early 2025 and lifted several Korean articles at once. Reads per million already divides out an edition getting busier overall. It does not divide out a season when Korean drama in general was being looked up.

We cannot separate the two here. Five titles is not enough to try.

## What this cannot tell you

A read is not a viewer. Someone opening an encyclopaedia article about a series may have watched it, may be deciding whether to, or may have seen the name and been curious.

The titles were chosen as ones we expected to have had a wave, not the most-read Korean titles and not a random sample. A set chosen that way leans toward titles that travelled.

And we are not saying the wave caused the floor to move in either direction. Twelve months either side of a peak contain everything else that happened in those months.

What we can say is narrower and, for anyone counting on a hit to build something durable, worth knowing: across the five Korean titles where the question could be asked cleanly, the months after the wave look slightly quieter than the months before it. The full tables, including every title we had to drop and why, are on [wave and floor](/wave-and-floor).
