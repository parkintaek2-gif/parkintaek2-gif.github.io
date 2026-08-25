---
title: "Six bonds were 90% of a day's Korean bond trading"
dek: "Korea's listed bond market has a price on hundreds of issues but trades almost none of them. On 2026-08-21, six bonds were 90% of all trading value, and government benchmarks were 95%. It held that way every day we measured. Not advice."
category: rates
pubDate: 2026-08-25
dataAsOf: 2026-08-21T00:00:00+09:00
author: Newsroom
tags: ["bonds", "rates", "liquidity", "concentration", "government-bonds", "korea"]
tickers: []
sources:
  - org: "Korea Exchange (KRX OPEN API)"
    api: "Daily listed-bond trading (close, trading value ACC_TRDVAL, residual maturity) for 2026-08-10 through 2026-08-21 (9 trading days)"
crossChecks:
  - "On 2026-08-21, of 396 bonds with a quote that day, the 6 most-traded (1.5% of them) were 90% of all trading value; the top 10 were 98.6%"
  - "The single most-traded issue — the on-the-run 3-year Treasury bond 국고03500-2906(26-5) — was 36.6% of the day's bond trading by itself; the top three were all Treasuries, together 73.5%"
  - "Korea Treasury Bonds (국고) were 95.1% of the day's trading value while making up 51 of the 396 quoted issues"
  - "Across all 9 trading days measured, the top 10 issues held 98.2–99.3% of trading and Treasuries held 95.1–98.2% — a structure, not a one-day snapshot"
excluded:
  - "The universe is bonds that carried a close and trading value in the KRX daily file that day (i.e. had a quote); it is not the full registry of listed bonds, and non-trading issues are simply absent — so read every share as 'of quoted-bond turnover'"
  - "Concentration is measured on trading value (a KRX-reported aggregate), reported only as ratios, which do not depend on the won price level"
  - "Treasury benchmarks are the most liquid by design, so high concentration is expected; the point is the degree (≈99% in ten issues) and that 300-plus other issues split about 1%"
  - "Nine trading days is a short window; we say 'held every day measured', not that it is fixed forever"
  - "This is not investment advice"
image: /charts/bond-trading-concentration.svg
---

We have written about how concentrated Korea's [stock market](/data/concentration) is — [four companies are half its value](/article/korea-four-stocks-half-the-market), and on a normal day [two stocks are half its trading](/article/korea-market-barbell-silent-tail). The bond market is the same shape, only more extreme.

## Six bonds, ninety percent

On **2026-08-21**, the Korea Exchange carried a quote on **396 bonds**. They traded **₩4.2 trillion** between them. But almost all of that was a handful of issues: the **six** most-traded bonds — **1.5%** of the list — were **90%** of the day's trading value. The **top ten were 98.6%**. The other **386 bonds split about 1.4%**.

![Bar chart of Korean bond trading value by rank: the single most-traded issue is 36.6%, ranks 2–5 add 52.7%, ranks 6–10 add 9.3%, and the remaining 386 bonds are just 1.4%.](/charts/bond-trading-concentration.svg)

The single busiest bond — the current **three-year Treasury benchmark**, 국고03500-2906(26-5) — was **36.6%** of all bond trading on its own. The top three, all Treasuries, were **73.5%** together.

## It's a government-benchmark market

Sort by type and the picture is blunt: **Korea Treasury Bonds were 95.1%** of the day's trading value, out of 51 of the 396 quoted issues. Everything else on the board — housing bonds, local-government bonds, bank and corporate paper, hundreds of them — shared the remaining **5%**.

This is not a one-day accident. Across **all nine trading days** we measured (2026-08-10 to 08-21), the top ten issues never left the **98.2–99.3%** band, and Treasuries stayed between **95.1% and 98.2%**. The concentration is a fixture.

## What it means, and what it doesn't

A caution first, because it matters: this counts bonds that had a **quote** that day. Hundreds more are listed and simply do not appear — they had no trade. So read the figures as *of the bonds that actually traded*. That is exactly the point, though: the tradeable Korean bond market, day to day, **is** a small set of government benchmarks. Price discovery happens in a few Treasury issues; the rest of the market sits still.

For anyone building a curve or a fund from Korean bonds, this is the terrain. We publish the underlying [concentration data](/data/concentration) and track the Treasury [yield curve](/article/korea-government-bond-yield-curve) from the same listed closes — every figure dated, ratios not levels.

Not investment advice.
