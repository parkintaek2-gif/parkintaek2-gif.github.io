---
title: "We graded 2,415 Korean listed companies on their own filings. The national power utility scored near the bottom."
dek: "SMarkets Grade, our balance-sheet score built from DART filings, places Korea Electric Power at SM8 — second-weakest of nine tiers — on 4.17x debt-to-equity and a 0.46 current ratio. Not a credit rating, not advice."
category: equities
pubDate: 2026-09-17
dataAsOf: 2026-09-16T08:25:00+09:00
author: Newsroom
tags: ["credit grade", "kepco", "balance sheet", "dart", "korean equities", "utilities"]
tickers: ["015760"]
sources:
  - org: "Financial Supervisory Service (Korea, Open DART)"
    api: "Annual consolidated financial statements (report code 11011), fiscal year 2025, retrieved company by company"
    url: "https://opendart.fss.or.kr"
  - org: "SeoulMarkets"
    api: "SMarkets Grade methodology (src/lib/smarkets-grade.mjs) applied to the Korea Valuation Tape, priced 2026-09-14"
    url: "https://seoulmarkets.com/data/company-credit"
crossChecks:
  - "KEPCO's four measured ratios were recomputed by hand from the same filed line items shown in this article and matched the grading engine's output exactly"
  - "The two unmeasured measures (interest coverage, borrowings-to-assets) are unmeasured because KEPCO's filed statement does not carry a separate finance-costs or short/long-term-borrowings line in the fields we collect — not because the ratio was computed and hidden"
  - "2,415 of 2,709 listed companies (89.1 percent) received a grade; the rest were withheld as NR, never assigned a low grade, when fewer than four of six measures could be computed"
  - "Total liabilities is derived as total assets minus total equity — an accounting identity, not an estimate — and is used identically for every company in this article and on the underlying methodology page"
excluded:
  - "Whether KEPCO's government backing, rate-setting arrangement, or public-utility status changes its actual default risk — this grade uses only the four filed balance-sheet and income-statement ratios it could compute, nothing else"
  - "Any comparison to a licensed credit rating agency's actual rating on KEPCO — we did not retrieve one and make no claim about how it would compare"
  - "A view on whether KEPCO stock is cheap, expensive, or a buy or sell — this is not investment advice"
draft: false
---

Korea Electric Power Corporation — the state-run utility that supplies electricity to nearly every household and factory in the country — scores SM8 on SeoulMarkets' own credit grade. That is the second-weakest of nine tiers, one step above the bottom.

This is not a claim from a licensed rating agency. It is what comes out of a scoring method we built ourselves, using nothing but the balance-sheet and income-statement figures Korean companies file with financial regulators. We publish the full formula, the thresholds and the weights, so anyone can recompute it. Here is what it found when applied to Korea's largest utility.

## What the grade actually measures

SMarkets Grade scores six balance-sheet and income-statement ratios, each against a public threshold table, then averages the scores a company has using published weights. A company needs at least four of the six to receive a grade; short of that, it is marked NR — not rated, not scored low. KEPCO cleared that bar with four.

| Measure | Weight | KEPCO's value | Score (1 strong – 9 weak) |
|---|---:|---:|---:|
| Total liabilities to equity | 15% | 4.17x | 8 |
| Current assets to current liabilities | 15% | 0.46x | 9 |
| Operating income to total assets | 10% | 5.3% | 5 |
| Altman Z (1968 formula) | 10% | 0.60 | 8 |
| Operating income to finance costs | 30% | — | not measured |
| Total borrowings to total assets | 20% | — | not measured |

Two of the six measures — the two carrying the most weight, 50 percent combined — could not be computed, because KEPCO's filed statement, in the line items we collect from DART, does not break out a separate finance-costs figure or short/long-term borrowings total. The grade is built from the remaining four measures, worth 50 percent of the total weight, re-normalised so their weights sum to 100. **A grade built on half the intended weight carries less information than a full one, and we say so on the methodology page itself.**

On the four it could measure, KEPCO's balance sheet is stretched. Total liabilities run 4.17 times total equity — total liabilities here is total assets minus total equity, an accounting identity, not an estimate. Current liabilities of ₩67.1 trillion outweigh current assets of ₩30.7 trillion by more than two to one, a current ratio of 0.46. The classic 1968 Altman Z-score, built from five ratios including working capital and retained earnings relative to assets, comes to 0.60 — well inside the zone the original formula associates with distress, though Altman built the formula for US industrial firms in the 1960s and never validated it against a state-owned regulated utility.

## Why we are not calling this a credit downgrade

A regulated national utility is not a normal company. Its revenue comes from electricity tariffs the government sets, not a competitive market; its debt is backed, implicitly or explicitly, by the state that owns it. None of that enters our grade, because none of it is a line item on a balance sheet. We measure four ratios from filed statements — nothing about the entity issuing them.

That is a limitation, and we are stating it plainly rather than letting the SM8 label imply more than it does. It is also exactly the kind of company our own house rule warns about: a number is a fact, but what it means still depends on who is asking it and why.

## The other 2,414

KEPCO is one grade among 2,415. Across the full listing, 89.1 percent of Korea's 2,709 listed companies received a grade; the remaining 10.9 percent were withheld as NR because too few of the six measures could be computed from what they filed — never scored as weak for lack of data.

Grades cluster in the middle: SM4, SM5 and SM6 together hold 1,241 companies, 51.4 percent of everyone graded. The weakest two tiers, SM8 and SM9, hold 121 companies combined — a group where KEPCO is unusual not for the tier itself but for its size. Most SM8/SM9 companies are considerably smaller; by market capitalisation, KEPCO is the single largest company graded at SM8 or below.

Weak grades are not spread evenly by industry, either. Among industries with at least 15 graded companies, Real Estate has the highest share in the two weakest tiers, at 48.1 percent, followed by Pulp and Paper Manufacturing at 36.4 percent and Retail Trade at 30.0 percent.

## Method, in full

SMarkets Grade is our own measure, built for this purpose in September 2026, and it is not the rating of any licensed credit rating agency. It uses six ratios — interest coverage, borrowings to assets, total liabilities to equity, the current ratio, return on assets and the Altman Z-score — scored 1 to 9 against public thresholds and combined using published weights, with unmeasured ratios removed from both the score and the weight base rather than counted as zero. The full threshold table, the weights and the underlying company-by-company data are published at seoulmarkets.com/data/company-credit. This is not investment advice.
