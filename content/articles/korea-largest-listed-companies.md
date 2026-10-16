---
title: "Most Korea market-cap rankings count Samsung twice — here is the list when you do not"
dek: "Samsung Electronics is 29% of the Korean stock market and SK hynix 21% — nearly half between them. Most rankings count Samsung twice, because its preferred shares list separately, pushing the true tenth firm off the table."
category: equities
pubDate: 2026-08-23
dataAsOf: 2026-08-21T00:00:00+09:00
author: Newsroom
# 🔴 [2026-10-04 · 5번] 이 지면은 28일 노출 152회로 우리 전체에서 가장 많은데 자리는 66위였다.
# 사람이 실제로 치는 말을 재 보니(scripts/재본다-그말을-몇명이-찾나.mjs) 1차례가
# 「biggest korean companies」·「korean companies by market cap」인데, 우리는
# 「largest listed companies」라고 써 두고 있었다. 치는 말과 쓴 말이 달랐다.
# ⛔ 파일 이름(슬러그)은 바꾸지 않는다 — 바꾸면 쌓인 색인이 처음으로 돌아간다.
# 🔴 [2026-10-16 · 5번] 10/4 에 제목을 「치는 말」에 맞춘 뒤 자리가 66위 → 73위로 «더» 내려갔다.
# 재 보니 까닭은 자기잠식이었다 — /data/largest-companies 가 같은 말 다발을 이미 쥐고 있는데
# 이 기사까지 같은 말로 맞추는 바람에 둘이 서로 겨뤘다(「korean companies」 에 기사 80위·자료 80위).
# ⇒ 역할을 갈랐다. 「biggest/largest korean companies」 는 자료 지면에 넘기고,
#   이 기사는 「삼성을 두 번 세는 문제」 하나만 판다. 제목·dek·tags·리드·H2 에서 겹치는 말을 뺐다.
# ⛔ 자료 지면 제목은 10/18 까지 못 고친다(10/4 변경의 식은기간). 그래서 기사 쪽만 손댔다.
tags: ["samsung market cap", "samsung preferred shares", "kospi concentration", "korea market concentration", "sk hynix market cap", "kospi", "market-cap", "korea stock market"]
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

Ask which firms sit at the top of the Korean stock market and most published rankings give the same answer — and quietly count one company twice. Samsung Electronics lists its preferred shares as a separate line, so an issue-level table seats Samsung in two chairs and pushes the true tenth company off the page. The full four-way ranking of every listed firm is in our data page on [the largest companies in Korea](/data/largest-companies); this piece is about what the double count does to it.

![Bar chart: Korea's 10 largest listed companies by share of total market value, company level with preferred shares merged. Samsung Electronics 29.4%, SK hynix 20.5%, then a steep drop to SK Square 2.4% and smaller.](/charts/largest-companies.svg)

## Two companies are nearly half the market

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
