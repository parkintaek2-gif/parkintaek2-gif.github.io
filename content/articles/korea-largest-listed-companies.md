---
title: "Korea's 10 largest listed companies — and why most rankings double-count Samsung"
dek: "The largest Korean companies by market value: Samsung Electronics is 29% of the whole market, SK hynix 21% — the two are nearly half. But most rankings count Samsung twice, because its preferred shares list separately. Not advice."
category: equities
pubDate: 2026-08-23
dataAsOf: 2026-08-21T00:00:00+09:00
author: Newsroom
tags: ["largest korean companies", "biggest company in korea", "samsung market cap", "kospi", "market-cap", "korea stock market"]
tickers: []
sources:
  - org: "Korea Exchange (KRX OPEN API)"
    api: "Daily trading — market capitalisation by issue, KOSPI + KOSDAQ, 2026-08-21; preferred shares consolidated to the issuer for company-level ranking"
crossChecks:
  - "Company level (preferred shares merged into the issuer): Samsung Electronics 29.4% of total market value, SK hynix 20.5% — the two together 49.9%"
  - "The rest of the company top 10: SK Square 2.4%, Samsung Electro-Mechanics 1.6%, Hyundai Motor 1.5%, LG Energy Solution 1.3%, Samsung Biologics 1.2%, Samsung Life 1.1%, Samsung C&T 1.0%, KB Financial 0.9%"
  - "By listed issue (not company), Samsung Electronics preferred shares rank 3rd at 2.7% — so an issue-level list counts Samsung twice and pushes the true 10th company off the table"
  - "Five of the ten largest companies are Samsung affiliates (Electronics, Electro-Mechanics, Biologics, Life, C&T)"
excluded:
  - "Ranked by share of total market value, not won amounts: the KRX price level in this feed is a simulation, so only ratios are used"
  - "Company level merges a firm's common and preferred shares (e.g. Samsung Electronics + its preferred line); it does NOT merge separate affiliates — Samsung Biologics, Samsung Life etc. are counted as the distinct listed companies they are"
  - "Market value is shares outstanding times one day's close (2026-08-21)"
  - "This is not investment advice"
image: /charts/largest-companies.svg
---

The single most-searched question about the Korean stock market has a surprisingly slippery answer: which companies are the biggest? Slippery because the rankings most sites publish quietly count one company twice.

![Bar chart: Korea's 10 largest listed companies by share of total market value, company level with preferred shares merged. Samsung Electronics 29.4%, SK hynix 20.5%, then a steep drop to SK Square 2.4% and smaller.](/charts/largest-companies.svg)

## Two companies, nearly half the market

At company level — merging each firm's common and preferred shares — **Samsung Electronics is 29.4% of the entire market** (KOSPI and KOSDAQ combined) and **SK hynix is 20.5%.** Those two alone are **49.9%** — essentially half of everything listed in Korea sits in two chipmakers riding the memory and AI cycle. After them the drop is a cliff: third place, SK Square, is 2.4%.

The rest of the top ten are all under 2.5%: **SK Square (2.4%), Samsung Electro-Mechanics (1.6%), Hyundai Motor (1.5%), LG Energy Solution (1.3%), Samsung Biologics (1.2%), Samsung Life (1.1%), Samsung C&T (1.0%) and KB Financial (0.9%).** Note how many carry the Samsung name — **five of the ten largest companies are Samsung affiliates.**

## Why the usual ranking is wrong

Here is the counting trap. Korea lists **preferred shares as separate securities** from common shares. So if you rank by listed *issue* — as most quick lists do — **Samsung Electronics' preferred line shows up as its own entry, ranked third at 2.7%**, as if it were a different company. That double-counts Samsung and shoves the genuine tenth-largest company (KB Financial, here) off the bottom of the list.

The honest fix is to rank by **company**, folding a firm's preferred shares back into the issuer — which is what the chart above does. It does *not*, however, merge separate affiliates: Samsung Biologics and Samsung Life are their own listed companies and are counted as such, even though they share a name.

## What this is, and is not

Every figure here is a **share of total market value**, not a won amount — the price level in this data feed is a simulation, so only the ratios, which do not depend on it, are used. "Largest" means most valuable on one trading day (2026-08-21), which moves with the market. For the fuller picture of just how top-heavy this is — [four stocks are half the market](/article/korea-four-stocks-half-the-market), and [the same lopsidedness runs through Korea's trade](/article/korea-everything-comes-down-to-four). This is a description of Korea's biggest listed companies, **not investment advice**.

## Update, 11 September 2026 — the answer changes with the measure

This article ranks by **one** measure: share of total market value on a single day. Since it was
published we have built the annual financial statements for every listed company, so the same
question can now be asked three more ways — by revenue, by total assets, and by operating profit.

They do not agree. Take the top ten on each of the four measures and put them in one pile and you
get **21 companies, not ten**; only **Samsung Electronics and Hyundai Motor** appear in all four.
SK Square, third here by market value, is **270th by revenue**. Korea Electric Power is fifth by
revenue and 34th by market value. Nineteen of the hundred most valuable companies have no revenue
line at all, most of them banks and insurers.

The four rankings, with the ranks side by side and every count of what is missing, are on
[the largest companies in Korea](/data/largest-companies). That page carries won amounts rather
than shares, because it is built on the public data portal's price dataset instead of the
simulated feed used here.

## Looking for the weights themselves?

This article stops at ten companies. If what you want is the **index weight of every KOSPI
constituent** — each company's share of total market value, all **828** of them, ranked and free
to read — that is a separate page: [what share of KOSPI is each company](/data/kospi-weights).
The two largest are **52.2 percent** of the market between them on 2026-09-09.

⚠ One caveat stated there and worth repeating: those are shares of **full** market value, not of
free float. Index providers weight by float, so a company whose founding family holds a large
block will sit lower in the official index than it does on that page. We say so rather than
publishing a float-adjusted number we cannot source.

## Related — where this shows up

- [What Korea's pension's 107% return really measures](https://seoulmarkets.com/article/korea-pension-107-percent-read-the-label) — the national pension is a major holder of these same large-caps; read the label on that number.
- [Korea's "biggest company" ranking measures hope, not output](https://seoulmarkets.com/article/korea-market-cap-is-not-productivity) — ranking these firms by market value is ranking a bet, not output.
