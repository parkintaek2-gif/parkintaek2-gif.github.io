---
title: "Korea's pay map doesn't put Seoul on top. A shipbuilding city does."
dek: "Averaged across every enrolled workplace, the national-pension bill is highest in Ulsan, not the capital. Top to bottom, the regional spread is just 1.21x — the smallest of the axes that move Korean pay."
category: macro
pubDate: 2026-08-07
dataAsOf: 2026-06-30T00:00:00+09:00
author: Newsroom
tags: ["labour", "wages", "regional", "national pension", "methodology"]
sources:
  - org: "National Pension Service (Republic of Korea)"
    api: "National Pension enrolled-workplace register — monthly bulk file (2026-06)"
crossChecks:
  - "Region assigned from the address string's leading token, not the numeric province code — the numeric field mixes non-standard entries (one merges Gwangju into South Jeolla)"
  - "Per-worker figure = each workplace's monthly billed amount divided by its enrolled headcount, then aggregated by region"
  - "Licence scope confirmed on the dataset page: redistribution not restricted"
excluded:
  - "Gross wages — the register does not carry them. The billed amount is a proxy, censored at the pension ceiling"
  - "The self-employed and workers below the enrolment floor — the register covers workplace-enrolled members only"
draft: false
---

Ask which part of Korea pays best and most people will say Seoul. The country's national-pension records say otherwise.

Every month the National Pension Service publishes a register of the workplaces enrolled in the scheme — in June 2026, some 553,785 of them, covering 11.56 million workers. Each workplace reports how many people it enrols and the amount it is billed. Divide the second by the first and you get an unusually wide, unusually clean read on what a formally employed Korean earns, region by region.

## What the data shows

Ranked by the average monthly pension bill per enrolled worker, the top of the table is not the capital.

- **Ulsan — ₩387,123.** The heavy-industry cluster: shipyards, autos, refineries.
- **Seoul — ₩381,101.**
- **Gyeonggi — ₩370,890.** The province ringing Seoul.
- ...
- **Jeju — ₩315,315.** The tourism island, at the bottom.

Top to bottom, that is a ratio of **1.21x** (Seoul to Jeju) — 1.23x if you measure from Ulsan. For a number people assume is dominated by a Seoul premium, the spread is strikingly compressed, and the single highest cell belongs to a shipbuilding port of 244,000 workers, not to the capital of ten million.

## Why "pension bill," not "wage"

The register does not record wages. It records the amount billed, which is 9% of a worker's reported earnings base — 4.5% from the employee, 4.5% from the employer. Averaged over Seoul's enrolled workers, that ₩381,100 implies a reported earnings base of roughly ₩4.23m a month.

The word *reported* is doing work. The earnings base is capped: in 2026 it stops at ₩6.17m a month, so anyone paid more is recorded as if they earned exactly that. Seoul has more workers pinned against that ceiling than Jeju does. So this measure **understates** the capital's true lead — the real Seoul-to-Jeju gap is wider than 1.21x, not narrower.

That cuts against the headline, and we are stating it plainly rather than burying it: 1.21x is a floor on the regional gap, not the gap itself. What survives the caveat is the ranking, and the ranking is the surprise — heavy-industry Ulsan sits above Seoul because its enrolled workers cluster near, and against, the ceiling.

## The macro reading

Set this beside the other two axes that sort Korean pay, measured on the same register. What a firm *does* and how *big* it is open gaps of 2.34x and 1.56x respectively. Where it *sits* opens 1.21x. Region is the weakest of the three.

For anyone modelling Korean labour costs, the implication is that geography is a poor proxy for pay. A plant in Ulsan is not a discount on a plant in Seoul; a back office in Daegu is not obviously cheaper labour than one in Incheon. The dispersion that matters lives in industry mix and firm size — not on the map.

## What we did not claim

We have not decomposed how much of the 1.21x is composition — Seoul being thick with finance and IT, Jeju thin — versus a genuine same-job premium. That requires holding industry constant, which the next cut does. Nor have we touched the informally employed or the self-employed, who are outside this register entirely. The figure here is what the pension system sees, no more.
