---
title: "Taxes and transfers nearly halve Korea's income gap"
dek: "Korea's income gap before tax barely moved in seven years — the top-to-bottom ratio sat near 11. After taxes and transfers it drops to about 5.8. The real story is the gap between market and disposable income, not either number alone."
category: macro
pubDate: 2026-09-01
dataAsOf: 2026-09-01T00:00:00+09:00
author: Newsroom
tags: ["inequality", "redistribution", "income", "distribution", "korea", "debate"]
tickers: []
sources:
  - org: "Statistics Korea (KOSIS) Income Distribution Indicators — computed by SeoulMarkets"
    api: "KOSIS OpenAPI orgId=101, tblId=DT_1HDALF05, annual; itmId T001 (market income) / T002 (disposable income); objL2 10 (gini), 20 (quintile ratio), 90 (relative poverty). Pulled and recomputed by us, not quoted from a press release."
    url: "https://kosis.kr"
crossChecks:
  - "2024, market vs disposable income: gini 0.399 → 0.325; income quintile ratio 11.19 → 5.78; relative poverty 20.9% → 15.3%. Disposable is always lower — redistribution reduces measured inequality"
  - "Over 2017–2024 the market-income gini is roughly flat (0.406 → 0.399) while the disposable gini fell (0.352 → 0.325); the disposable quintile ratio fell from 6.84 to 5.78 as the market ratio held near 11. The wedge — what tax and transfers do — has widened"
  - "A collector script and self-check verify disposable inequality is below market inequality every year; if that ever inverts the build fails rather than publishing a wrong figure"
excluded:
  - "Any single 'the' gini or poverty number presented as Korea's inequality. There are two, and the distance between them is the point"
  - "Any claim about whether redistribution should be higher or lower. We report the two series and their gap; the judgement is the reader's"
  - "This is not investment advice"
image: /charts/redistribution-wedge.svg
draft: false
---

Here is how Korea's income inequality usually gets reported: one number — a gini coefficient, or a poverty rate — quoted as *the* level. But there are always **two** numbers, and the distance between them is the part that actually tells you what is happening.

We pulled the [Statistics Korea income-distribution table](https://kosis.kr) ourselves and computed both: inequality of **market income** (what people earn before the state touches it) and inequality of **disposable income** (after taxes and cash transfers). The gap between them is redistribution, made visible.

## Before tax, the gap barely moves

Measured on **market income**, Korea's inequality has been remarkably flat. The top-to-bottom income quintile ratio has sat near **11** the whole time — 11.27 in 2017, 11.19 in 2024. The market-income gini has hovered around **0.40** (0.406 then 0.399). Whatever the labour market did over seven years, it did not move the pre-tax gap.

## After tax and transfers, it nearly halves

On **disposable income** the picture is different. The same quintile ratio drops to about **5.8** (11.19 → 5.78 in 2024) — close to half. The gini falls from **0.399 to 0.325**, and the relative poverty rate from **20.9% to 15.3%.** None of that is the market narrowing the gap; it is taxes and transfers doing it after the fact.

| 2024 | Market income | Disposable income |
| --- | ---: | ---: |
| Income quintile ratio (×) | 11.19 | **5.78** |
| Gini coefficient | 0.399 | **0.325** |
| Relative poverty (%) | 20.9 | **15.3** |

*Source: KOSIS Income Distribution Indicators (DT_1HDALF05), pulled and recomputed by SeoulMarkets.*

## The wedge is the story

Watch the two series over time and the interesting thing is not either line — it is the **growing distance** between them. Market inequality is flat to slightly lower; disposable inequality has fallen further and faster (the disposable quintile ratio went from 6.84 in 2017 to 5.78 in 2024 while the market ratio held near 11). In other words, more of Korea's inequality reduction is now being done by the state, after income is earned, rather than by the market while it is earned.

That is exactly why quoting one number misleads. Say "Korea's gini is 0.325" and you credit the outcome to the economy; say "0.399" and you describe a market that has not budged. Both are real. Only the pair, and the wedge between them, is honest.

## The debate

So: when someone quotes "Korea's inequality," which number should it be — the market gap the economy produces, or the disposable gap the state leaves behind? And is a widening wedge a success (redistribution working) or a warning (the market gap not closing on its own)? **What do you think?** This is a talking point, not a verdict — argue it out below.
