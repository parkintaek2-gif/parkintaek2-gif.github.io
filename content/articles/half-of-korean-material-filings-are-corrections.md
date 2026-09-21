---
title: "More Than Half of Korea's Material Filings Are Corrections of Earlier Ones"
dek: "Of 816 material disclosures Korean listed companies filed in 28 days, 430 — 52.7% — are re-filings marked as corrections. Convertible bonds 72%, capital raises 65%, supply contracts 60%. Not advice."
category: equities
pubDate: 2026-09-22
dataAsOf: 2026-09-21T00:00:00+09:00
author: Newsroom
tags: ["dart", "disclosure", "korea", "kospi", "kosdaq", "measurement", "corrections"]
tickers: []
sources:
  - org: "Financial Supervisory Service (Republic of Korea) / DART"
    api: "Disclosure listings captured daily from 25 August to 21 September 2026 and filtered to material events only. Each filing title carries the regulator's own correction prefix when it is a re-filing; that prefix is what we count."
    url: "https://dart.fss.or.kr"
crossChecks:
  - "816 material filings from 475 listed companies, 25 August to 21 September 2026, are the same rows published on our Korean material disclosures page — the article and the page are built from one file, so they cannot disagree."
  - "430 of the 816 carry the regulator's correction prefix. Counting the raw capture instead, before dropping filings with no ticker, gives 442 of 862 — 51.3%, the same finding at a slightly different population."
  - "The correction share differs sharply by event type and is not an artefact of one crowded category: convertible bond issues 39 of 54 (72%), paid-in capital increases 87 of 134 (65%), single supply contracts 168 of 280 (60%), treasury share buybacks 4 of 20 (20%), delisting-risk notices 0 of 12."
  - "It is not a one-exchange effect either. KOSDAQ 253 of 489 (52%), KOSPI 163 of 302 (54%)."
excluded:
  - "Why any individual filing was corrected. The listing tells us a correction was filed; it does not tell us what changed inside the document, and we did not open 430 filings to find out."
  - "Whether this rate is high or low against other markets. We have not measured the equivalent for Tokyo, the Gulf or the United States, so we are not going to imply a comparison we did not make."
  - "Any claim that a correction signals weakness at the filer. A company that corrects a number is a company that filed the correction."
  - "Anything before 25 August 2026. The source does not hand back a bulk history of listings, so the record starts the day we began collecting."
draft: false
---

Korean listed companies filed **816 material disclosures** between 25 August and 21 September
2026. **430 of them — 52.7% — were corrections of filings those same companies had already made.**

That is not a rounding-error minority. For the month we measured, a reader who followed Korea's
material disclosure stream saw, more often than not, a document that existed to fix an earlier
document.

## The rate by event type

Korea's regulator prefixes a corrected re-filing with '기재정정' (description corrected). We count
that prefix and nothing else — we do not judge what changed inside the document.

| Event | Filings | Corrections | Share |
|---|---:|---:|---:|
| Convertible bond issue | 54 | 39 | **72%** |
| Bonus share issue | 3 | 2 | 67% |
| Paid-in capital increase | 134 | 87 | **65%** |
| Single supply contract | 280 | 168 | **60%** |
| Debt guarantee | 9 | 5 | 56% |
| Stake acquisition | 57 | 31 | 54% |
| Material report | 168 | 71 | 42% |
| Material management matter | 52 | 18 | 35% |
| Conversion price reset | 3 | 1 | 33% |
| Treasury share buyback | 20 | 4 | **20%** |
| Delisting risk | 12 | 0 | **0%** |

The spread is the finding. If the correction rate were a filing-system quirk it would be flat
across categories. It is not. The three categories that describe **money the company is about to
raise or has just won** — convertible bonds, cash capital increases, supply contracts — sit at 60%
and above. The two categories where the company is **spending its own cash or reporting bad news**
— buybacks and delisting-risk notices — sit at 20% and zero.

## It is not one exchange

| Market | Filings | Corrections | Share |
|---|---:|---:|---:|
| KOSPI | 302 | 163 | 54% |
| KOSDAQ | 489 | 253 | 52% |

The large-cap board and the growth board correct at the same rate. Whatever produces this, it is
not a small-company effect.

## What a correction is, and what it is not

A correction is a filing. It is public, it is dated, and it supersedes an earlier public statement
by the same company. In that sense the system is working: something was wrong and the company said
so in the open.

What we cannot tell you from the listing alone is **what** changed. A contract value may have been
restated, a counterparty renamed, a date moved, a typo fixed. Reading 430 documents to classify the
changes is a larger job than this piece, and we would rather say that than guess.

We also have no comparison. We have not measured how often American 8-K filers amend, or Tokyo
filers, or the Gulf exchanges we cover. Until we do, "52.7%" is a fact about Korea and not a verdict
on Korea.

## Why we could count this at all

Most disclosure feeds hand you the current version of a document. We keep the **listing** — what
was filed, on what day, under what title — every day, and the regulator's own correction prefix
travels with the title. Counting corrections is then arithmetic on a record nobody usually keeps.

The 816 filings are the same rows on our [Korean material disclosures page](/data/korea-disclosures), tagged into 18 event types with a link
to each original. The article and the page are built from one file, so they cannot drift apart.

One subtraction we should name: we captured 862 filings and published 816. The 46 we dropped carry
no ticker — unlisted filers, and subsidiary filings made under a parent's name. On the raw 862 the
correction share is 51.3%, so the subtraction does not move the finding.
