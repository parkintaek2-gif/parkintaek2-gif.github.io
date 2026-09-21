---
title: "A Korean REIT Issued Two Convertible Bonds the Same Day. Together They're 8.13% Dilution."
dek: "Koramco Life Infra REIT's board approved two private convertible bonds on 21 September — same conversion price, same coupon, same maturity date — worth a combined 34 billion won and 8,308,894 potential new shares."
category: equities
pubDate: 2026-09-22
dataAsOf: 2026-09-22T00:00:00+09:00
author: Newsroom
tags: ["dart", "reit", "korea", "disclosure", "dilution", "convertible-bond"]
tickers: ["357120"]
sources:
  - org: "Financial Services Commission (Republic of Korea) / DART"
    api: "Open DART API — cvbdIsDecsn (Decision on Convertible Bond Issuance), two filings dated 21 September 2026 (rcept_no 20260921000425 and 20260921000428)"
    url: "https://opendart.fss.or.kr/"
crossChecks:
  - "Both filings carry the same board decision date (21 September 2026), the same coupon (4.00% stated / 5.95% yield to maturity), the same maturity (29 September 2029), and the same conversion price (4,092 won per share)."
  - "Filing one: 24,000,000,000 won face value, convertible into 5,865,102 shares, stated at 5.68% of shares outstanding. Filing two: 10,000,000,000 won face value, convertible into 2,443,792 shares, stated at 2.45% of shares outstanding. Combined: 34,000,000,000 won and 8,308,894 shares, summing the two filings' own percentages to 8.13%."
  - "Both bonds are private placements (사모), unlisted, with subscription and payment dates of 29 September 2026 and a conversion window opening 30 September 2027."
excluded:
  - "Whether the two bonds are legally the same series split into two filings or genuinely separate instruments — DART's structured API returns them as two distinct rcept_no filings with two distinct receipt numbers, which is what we report."
  - "What the proceeds will be used for — both filings' use-of-proceeds fields read blank except an 'other' line (24 billion won and 10 billion won respectively, matching each bond's face value), with no further breakdown in the structured response."
  - "REIT-specific dilution mechanics (Korean REITs pay out most income as distributions, so a conversion's effect on per-share distributions is a separate calculation we have not done here)."
draft: false
---

Koramco Life Infra REIT (KOSPI: 357120) filed two convertible bond issuance decisions with Korea's
Financial Supervisory Service on 21 September, 2026, both dated to the same board meeting. Combined,
the two bonds carry a face value of 34 billion won and convert into up to 8,308,894 new shares.

## What the two filings say, side by side

| Field | Bond 1 | Bond 2 |
|---|---|---|
| Face value | &#8361;24,000,000,000 | &#8361;10,000,000,000 |
| Convertible shares | 5,865,102 | 2,443,792 |
| Dilution (filing's own figure) | 5.68% | 2.45% |
| Conversion price | &#8361;4,092 | &#8361;4,092 |
| Coupon (stated / yield to maturity) | 4.00% / 5.95% | 4.00% / 5.95% |
| Maturity | 29 September 2029 | 29 September 2029 |
| Method | Private placement | Private placement |

Every term that could differ between the two bonds &mdash; price, coupon, maturity, method &mdash;
is identical. The only differences in the filings are the face value, the receipt number, and the
resulting share count. Added together, the two filings' own dilution percentages sum to 8.13%.

## What we don't know from this data

The structured DART API response does not break down what the raised capital is for beyond a single
"other" line matching each bond's face value, so we cannot say more specifically what the money is
funding. We also have not attempted to work out how a REIT's per-share distribution changes if both
bonds convert &mdash; that requires the REIT's current distribution-per-share figure and portfolio
income, which is outside this filing.

*This is not investment advice. Figures are drawn from official regulatory filings and are presented
for data-quality reporting, not as a trading signal.*
