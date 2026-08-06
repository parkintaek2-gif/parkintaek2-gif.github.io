---
title: "Korea's convertibles create new shares at a 24% discount. Cash raises, 12%."
dek: "Measured against the market price on the day the shares are created, convertibles dilute at a 23.8% discount and cash raises at 12.5%. Control for the 456 companies that used both and the convertible still discounts 7.7 points deeper."
category: equities
pubDate: 2026-08-06
dataAsOf: 2026-08-05T00:00:00+09:00
author: Newsroom
tags: ["equity issuance", "convertible bonds", "dilution", "discount to market", "korea"]
tickers: []
sources:
  - org: "Financial Supervisory Service (Korea)"
    api: "Open DART — capital increase / decrease history (증자·감자 현황) by corporate filing"
    url: "https://opendart.fss.or.kr"
  - org: "Korea Exchange / Financial Services Commission (Korea)"
    api: "Daily closing prices by issue, used to fix the market price on each issue date"
    url: "https://www.data.go.kr"
crossChecks:
  - "The DART filing snapshot holds 2,693 companies and 28,541 issuance events. This analysis uses the 11,644 cash- or convertible-type events dated 2 January 2020 or later that carry a usable issue price"
  - "Each event's issue price is compared to the issuer's own closing price on the issue date, or the most recent trading day within seven days if the market was closed. 10,182 of 11,644 events (87.5%) matched a price"
  - "The company control compares, within each of the 456 companies that used both routes, that company's median convertible discount against its own median cash discount — so company, sector and credit are held fixed"
  - "Issue-type classification (cash versus convertible) maps the filing's form field through a fixed table that is checked in the build's test suite; forms the table does not recognise are excluded, not bucketed"
excluded:
  - "5,895 events dated before 2 January 2020, where the daily price archive does not reach. None of them appears in any figure here"
  - "1,462 events from 2020 on whose issuer had no traded price on or near the issue date — delisted shells and non-trading names. Counted as unmatched, never as zero"
  - "672 events with an implausible issue price — unit-entry errors outside 1 to 10,000,000 won. Removed, not corrected, because the filer's intended figure cannot be recovered"
  - "Bonus issues, stock splits, capital reductions, employee options and in-kind contributions. This compares only the two routes that raise cash or swap debt for stock"
  - "The amount of money or the number of shares each route raised. This is about the price the shares were created at, not the size of the raise"
  - "Why convertibles convert below market. The structure — a conversion price fixed months in advance — makes it close to inevitable; the data measures the size of the discount, not the motive"
draft: false
---

A Korean company that needs equity has two ways to get it. It can sell new shares for cash — a rights issue to existing holders, or a public offering. Or it can let a convertible do the work: a bond, a warrant, or a debt-for-stock swap that turns into shares at a price fixed in advance.

Both create new shares. Both dilute everyone who already owns the stock. The question a shareholder should ask is the same in each case: *how far below the market did those new shares get printed?*

## The answer, measured on the day the shares appear

For every issuance event since 2020 that carried a usable price, we took the company's own closing price on the day the shares were created and asked what discount the new shares came at. Positive means the shares were issued below market — dilution at a markdown.

| Route | Events priced | Median discount to market |
| --- | ---: | ---: |
| Cash raise (rights / public) | 1,827 | **12.5%** |
| Convertible (CB, warrant, debt swap) | 8,355 | **23.8%** |

A cash raise prints new shares at a median 12.5% below the going price. A convertible prints them at 23.8% — nearly twice the markdown.

That is the number that matters to a holder, and it is the opposite of reassuring. The instrument that companies reach for when they want financing to look painless — no discounted rights offer, no headline placement — is the one that quietly creates shares at the deeper discount.

## Is it the instrument, or the companies that use it?

Here is where this kind of number usually falls apart. Convertibles are not spread evenly. Smaller, more volatile, more cash-hungry companies lean on them, and those companies might dilute more heavily whatever route they took. If so, the 24% is a fact about the *companies*, not the *convertible*.

So we held the company fixed. Of the names in the sample, **456 used both routes** — the same issuer, at different times, raised cash *and* converted a bond. Inside each one, we compared that company's own convertible discount to its own cash discount.

- In **288 of 456 (63.2%)**, the convertible discounted deeper than the same company's cash raise.
- In 166 (36.4%), the cash raise was deeper.
- The median company converted its bonds **7.7 percentage points** below where it sold its cash shares.

The gap shrinks when you control for the company — from an 11-point spread to about 8 — but it does not vanish. Most of it is the instrument. A convertible, in the same company's hands, still creates shares at a visibly deeper discount.

## Why the raw prices oversell it

There is a louder version of this story, and it is wrong. Line up the issue prices themselves and convertibles look like they print at barely half the price of a cash raise. That comparison is a trap, and it is worth seeing why.

An issue price on its own says nothing about a discount. A convertible that turns into stock at 3,000 won on a 3,300-won share is a small markdown; a cash raise at 6,000 won on a 12,000-won share is a large one. The convertible has the lower *price* and the smaller *discount*. Reading dilution off the raw price rewards exactly the wrong issues — the cheap-stock names where convertibles cluster — and manufactures a gap that is mostly a fact about share prices.

Measured properly, against the market on the day the shares appear, the real gap is about 8 to 11 points of discount. Smaller than the raw prices shout, larger than zero, and pointed the same way every time you tighten the lens.

## What the discount is

None of this makes the convertible a trick. Its discount is structural, not stealthy. A convertible fixes its conversion price in advance; the shares appear later, usually because the stock has risen enough to make conversion worthwhile — which guarantees they arrive below the market of the day. The 23.8% is that mechanism working as designed.

But "as designed" is the point for a shareholder. A cash raise announces its discount up front, in a document everyone reads. A convertible's discount is set months earlier and paid out later, in shares, on a day nobody is watching for it. Same dilution, delivered where it is harder to see — and, in the same company's own hands, delivered deeper.
