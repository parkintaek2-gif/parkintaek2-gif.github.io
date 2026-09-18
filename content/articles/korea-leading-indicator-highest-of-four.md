---
title: "Korea's leading indicator is the highest of four Asian economies we track. China's is the only one below trend."
dek: "OECD composite leading indicators for Korea, Japan, India and China through August 2026. Korea's has risen every month for 20 months running; China's has fallen every month for 19. Not a forecast — a reading of where each series sits now."
category: macro
pubDate: 2026-09-18
dataAsOf: 2026-09-17T11:26:00+09:00
author: Newsroom
tags: ["leading indicator", "oecd", "business cycle", "korea", "china", "japan", "india"]
tickers: []
sources:
  - org: "OECD"
    api: "Composite Leading Indicators (amplitude-adjusted), SDMX API"
    url: "https://sdmx.oecd.org/public/rest/data/OECD.SDD.STES,DSD_STES@DF_CLI,4.1/"
crossChecks:
  - "All four series retrieved in a single SDMX call with the same base, adjustment method and vintage — no mixing of series definitions across countries"
  - "The Gulf economies (UAE, Saudi Arabia) are not OECD members and are absent from this series entirely, not shown as zero or estimated"
  - "The streak counts (20, 19, 17, 37 months) are read directly off the monthly series with no smoothing applied beyond OECD's own amplitude adjustment"
excluded:
  - "Whether the indicator's current direction will continue — a leading indicator is a description of where a series sits now, not a prediction of what comes next"
  - "Any causal claim about why each economy's reading looks the way it does — this article reports levels and direction, not explanations"
  - "Investment or trading implications — this is not investment advice"
draft: false
---

Four Asian economies, one indicator, one snapshot: as of August 2026, South Korea's OECD composite leading indicator (CLI) stands at 102.9 — the highest of the four countries we track this way, and the only one that has climbed in every single month for the past 20 months straight. China's sits at 98.1, the only one of the four currently below the long-term trend line of 100, and it has fallen every month for the past 19.

## What the indicator is — and is not

The CLI is built to anticipate turning points in economic activity relative to its own long-term trend, not to measure the level of activity itself. A reading of 100 marks the trend; above it signals the economy is running above its own historical trend, below it signals the opposite. OECD amplitude-adjusts the series so its swings are comparable across countries, which is what makes a side-by-side reading like this possible.

| Country | August 2026 | 12 months earlier | Change | Current streak |
|---|---:|---:|---:|---|
| South Korea | 102.9 | 99.5 | +3.3 | Up 20 months straight |
| India | 101.6 | 100.0 | +1.6 | Up 37 months straight |
| Japan | 100.3 | 99.6 | +0.7 | Up 17 months straight |
| **China** | **98.1** | **100.1** | **−2.0** | **Down 19 months straight** |

South Korea's twelve-month climb, from 99.5 to 102.9, is the sharpest move of the four. China's is the only line pointed the other way, and it is the only one of the four sitting below the 100 trend mark at all.

## Why the long streaks are not, by themselves, surprising

OECD's amplitude adjustment produces a smoothed series by design — it is built to filter out short-term noise, which mechanically produces long runs in one direction once a turn has happened. A 17-to-37-month streak is not an unusual reading for this kind of indicator; it is closer to how the series is supposed to behave. The number worth attention here is not the streak length on its own, but where each country's reading currently sits relative to the other three and to the 100 line — and on that measure, Korea leads and China is the outlier.

## Method, in full

Figures are OECD's composite leading indicator, amplitude-adjusted, monthly, retrieved directly from OECD's SDMX API for Korea, Japan, India and China. The Gulf economies (UAE, Saudi Arabia) are not OECD members and are not part of this series; we do not substitute an estimate for them. This is a description of where each series stands as of the stated date, not a forecast and not investment advice.
