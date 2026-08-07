---
title: "Six in ten formally employed Koreans work in the capital region. It barely pays more."
dek: "The Seoul metro area holds 61.2% of enrolled workers on a footprint that pays a 1.21x premium at most — and less than that once the pension ceiling and Seoul's rents are taken into account. The pull isn't the paycheque."
category: macro
pubDate: 2026-08-07
dataAsOf: 2026-06-30T00:00:00+09:00
author: Newsroom
tags: ["labour", "concentration", "regional", "national pension", "Seoul"]
sources:
  - org: "National Pension Service (Republic of Korea)"
    api: "National Pension enrolled-workplace register — monthly bulk file (2026-06)"
crossChecks:
  - "Capital region = Seoul + Gyeonggi + Incheon; shares computed against the 16-region national total"
  - "11,558,918 enrolled workers and 553,785 workplaces summed from the register"
  - "Region assigned from the address string's leading token, not the numeric province code"
excluded:
  - "Cost of living by region — not in this dataset; the housing point below is directional, not measured here"
  - "Commuters — a worker enrolled at a Seoul workplace may live in Gyeonggi; the register places them by workplace"
draft: false
---

Two facts from the same file sit oddly together. Most Korean formal employment is in and around Seoul. The pay for being there is thin. Put them side by side and the standard story — people go where the money is — stops explaining the map.

## The concentration

Of the 11.56 million workers enrolled through their workplaces in June 2026, **7.07 million — 61.2% — are in the capital region**: Seoul, Gyeonggi, and Incheon. Seoul and Gyeonggi alone hold 56.9%. About 54.9% of all enrolled workplaces sit there too. On a land area under 12% of the country, the formal economy is more than half concentrated.

That is one of the densest capital-region concentrations among advanced economies, and it is not softening in this snapshot: Gyeonggi, the ring province, is the single largest region by both workers (2.79m) and workplaces (150,482), ahead of Seoul itself.

## The premium that isn't there

If that pull were about pay, the capital region would command a clear wage premium. It does not. Measured by the average pension bill per worker — our proxy for earnings — Seoul sits second, behind shipbuilding Ulsan, and the whole national range from top to bottom is just **1.21x**. The capital's edge over the median region is a few percent, not a tier.

And that few percent is generous. Two things eat it:

- **The ceiling.** The pension proxy is capped, so it flatters lower-paid regions and understates Seoul — meaning the *measured* premium is a floor. That pushes the true gap up.
- **Rents.** This dataset says nothing about cost of living, and we are not going to pretend it does. But Seoul housing costs are not a few percent above Jeju's — they are a multiple. A thin nominal premium against a large cost gap points one way for take-home terms.

We can measure the first. We cannot measure the second from this file, so we flag it as directional and leave the number for the housing data to supply.

## Then why the pull?

If it is not the paycheque, the concentration is about something the wage proxy doesn't price: the density of *opportunity*. More employers within reach means more next jobs, more matches for a specific skill, more chance the one firm that needs exactly you is a subway ride away. Workers pile into the capital region for the option value of the labour market, not its average wage — which is why they keep coming even as the measured premium stays thin.

That is a hypothesis this file supports but does not prove. What the file does prove is the tension: the money reason for Korea's most defining economic pattern is the weakest reason available.

## What we did not claim

We placed each worker at their workplace, not their home — a Gyeonggi resident working in Gangnam counts as Seoul-region either way, but the split between Seoul and Gyeonggi is a workplace split, not a residential one. We have not adjusted for the industries that happen to sit in the capital, which is a separate cut. And the cost-of-living argument above is explicitly unmeasured here. The concentration figure — 61.2% — is the one hard number, and it is the one that matters.
