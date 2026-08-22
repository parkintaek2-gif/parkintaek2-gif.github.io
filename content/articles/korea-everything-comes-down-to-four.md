---
title: "Korea's stock market and trade: the top four are half of everything"
dek: "How concentrated is the Korean stock market? Rank Korea's stocks, or its export and import partners, and the top four are about half every time — every Gini past 0.9. KOSPI, KOSDAQ and trade, one pattern. Not advice."
category: macro
pubDate: 2026-08-22
dataAsOf: 2026-08-21T00:00:00+09:00
author: Newsroom
tags: ["korea stock market", "kospi", "kosdaq", "samsung", "korea exports", "trade partners", "concentration", "gini"]
tickers: []
sources:
  - org: "Korea Exchange (KRX OPEN API)"
    api: "Daily trading — market cap and trading value by issue, KOSPI + KOSDAQ, 2026-08-21"
  - org: "Korea Customs Service (via KOSIS, Statistics Korea)"
    api: "Exports and imports by partner country, table DT_1R11006_FRM101 (org 360), month 2026-06"
crossChecks:
  - "The four largest are 52.4% of stock market cap, 53.1% of stock trading value, 56.5% of exports and 50.1% of imports — all near half"
  - "In every one of the four rankings, exactly four units make up the first half of the total"
  - "The concentration Gini is 0.945 for market cap, 0.953 for trading, 0.924 for exports and 0.907 for imports — all above 0.9"
  - "For reference, national income Gini coefficients run about 0.30-0.45, and the most unequal countries reach roughly 0.63; Korea's market and trade concentration sit far above that band"
excluded:
  - "The Gini here measures how concentrated a quantity is across units (listed firms, or partner countries) — a standard concentration Gini; the comparison to income Gini across people is an intuition anchor, not an identical calculation"
  - "Stock figures are one trading day and use only shares and Gini, which are scale-invariant, because the price level in this feed is not used; trade figures are one month and use shares, since the absolute dollar totals carry a scale discontinuity"
  - "Preferred shares and holding structures are counted as separate stock issues; entrepôt flows (e.g. Hong Kong) inflate some partner shares — neither changes the top-four-are-half result"
  - "This is not investment advice"
image: /charts/concentration-top4.svg
---

Here is a number that keeps coming back. Take Korea's **2,764 listed stocks** and rank them by market value: the four biggest are **[52.4%](/article/korea-four-stocks-half-the-market)** of the whole. Rank the same stocks by how much money actually traded in them on a given day: the top four are **53.1%**. Now leave the stock market entirely and rank Korea's **200-plus trading partners** by exports: the top four are **56.5%**. By imports: **50.1%**.

Four different rankings of two completely different things — a stock market and a customs ledger — and each time the leaders land in the same place: **about half.**

![Bar chart: the four largest are 52.4% of Korea's stock market cap, 53.1% of stock trading, 56.5% of exports and 50.1% of imports — all clustered at the halfway line.](/charts/concentration-top4.svg)

## Four, over and over

It is not just that the shares are similar. Count how many units it takes to cross the halfway mark in each ranking, and the answer is identical: **four stocks are half the market's value; four stocks are half its trading; four countries are half of exports; four countries are half of imports.** [Samsung Electronics and SK hynix](/article/korea-four-stocks-half-the-market) anchor the market; [the United States and China](/article/korea-trade-partners-two-giants-one-supplier) anchor the trade. Two pairs of giants, holding up two halves of the economy.

## More lopsided than inequality itself

To measure "concentration" with one number, economists use the **Gini coefficient** — 0 if everything is spread perfectly evenly, 1 if a single holder has it all. Applied across Korea's listed firms and its trading partners, all four readings sit **above 0.9**: market cap **0.945**, trading **0.953**, exports **0.924**, imports **0.907**.

![Bar chart: Gini of concentration for Korea's market cap (0.945), trading (0.953), exports (0.924) and imports (0.907), all far above the reference lines for typical national income Gini (~0.40) and the most unequal nation (~0.63).](/charts/concentration-gini.svg)

For a sense of scale: when the same coefficient is used on household **incomes**, a typical country scores around 0.40, and the single most unequal nation on earth reaches roughly 0.63. Korea's market and trade are more top-heavy than *any* country's income distribution. (The two calculations are not identical — one spreads a quantity across firms or countries, the other across people — but the gap is so large the comparison holds as intuition.)

## Why it matters, and what it is not

Concentration is not automatically bad — it is what world-beating champions look like, and Korea's are real. But it is a **dependence**, and dependence is a risk worth seeing plainly: when four names carry half of everything, the whole rises and falls with a handful of decisions made far away — a chip cycle, a tariff, one partner's slowdown. The value here is simply in **seeing the shape**, measured the same way across places nobody usually compares. Every figure is a share or a ratio, chosen because they do not depend on the price or dollar levels in the raw feeds. This is a portrait of how Korea's market and trade are built — **not investment advice**.
