---
title: "Rank Korean musicians by look-ups and IU is not first — the top name is there for acting"
dek: "232 of the 1,550 individuals in our K-pop panel also appear in Korean titles that reached a Netflix Top 10. They are 15% of the names and 41% of the attention. Removing them does not correct the list. It produces a second one."
category: titles
genre: music
purpose: both
pubDate: 2026-08-07
dataAsOf: 2026-08-06T00:00:00+09:00
author: Newsroom
tags: ["k-pop", "korean drama", "attention", "netflix", "wikipedia", "measurement", "korea"]
pages:
  - "/kpop-attention"
  - "/actors"
sources:
  - org: "Wikimedia Foundation"
    api: "Pageviews API, en.wikipedia, all-access, user agent class 'user', 30 days from 2026-07-08 to 2026-08-06"
    url: "https://wikimedia.org/api/rest_v1/"
  - org: "Wikidata"
    api: "Music roster — P27=Q884 with occupation singer, rapper, composer or musician, plus musical groups reached by P31/P279* from Q215380 with P495=Q884. Screen roster — P161 (cast member) on Korean titles that appeared in a Netflix Top 10"
    url: "https://query.wikidata.org"
  - org: "Netflix"
    api: "Top 10 weekly lists (Tudum), used only to decide which Korean titles the screen roster is drawn from"
    url: "https://www.netflix.com/tudum/top10"
crossChecks:
  - "Every view figure in this piece comes from the music panel's own 30-day window, 2026-07-08 to 2026-08-06. The screen roster is used for membership only — to decide who is flagged — and never for its view totals, because it was collected over a different window (2026-07-05 to 2026-08-03) and the two are not directly comparable"
  - "The overlap is measured against individuals only, 154 of 1,545. Counted against the whole panel including the 816 groups it is 154 of 2,361, or 6.5% of names and 23.1% of views. Both denominators are stated wherever the figure appears"
  - "Nobody is removed from the roster for having two occupations. Wikidata records both for these people, and the roster is built by rule; hand-removing names would make the rule untestable"
  - "The screen roster is 1,008 measured names out of 1,344 selected. The 336 with no English Wikipedia article are absent from it, so a working actor can be missing from the flag for lack of an article as easily as for lack of a Netflix credit"
excluded:
  - "Any claim that these people are better known for acting than for music. We measured one page per person. A page does not record why it was opened"
  - "Any claim about who is more popular. This counts article opens in English over thirty days, not records sold, streams played or tickets bought"
  - "Any ranking of the two lists against each other. They are the same measurement over two overlapping populations and are printed side by side for that reason"
---

The most-read individual in our K-pop panel over the last thirty days is So Ji-sub, with 156,817
openings of his English Wikipedia article — a third again as many as the next name. He has released
records. He is on the list because Wikidata records him as a singer. Almost nobody outside Korea
knows him that way.

He is not an anomaly. Of the 1,550 individuals in the panel, **232 also appear in Korean titles that
reached a Netflix Top 10**. They are 15.0% of the names and **41.0% of the views** — 2,951,915 of
7,207,889. The average person carrying both credits was looked up 12,724 times; the average person
carrying only the music credit, 3,229. A factor of 3.9.

## Two lists, printed side by side

| # | Everyone in the panel | Views | Only those with no screen credit | Views |
| ---: | --- | ---: | --- | ---: |
| 1 | So Ji-sub ★ | 156,817 | Jennie | 119,891 |
| 2 | Jennie | 119,891 | V | 118,449 |
| 3 | V | 118,449 | Jung Kook | 103,735 |
| 4 | Steven Yeun ★ | 111,016 | Eric Nam | 88,713 |
| 5 | Jung Kook | 103,735 | Rosé | 79,674 |
| 6 | Eric Nam | 88,713 | Jimin | 68,543 |
| 7 | Jisoo ★ | 88,091 | Jin | 64,831 |
| 8 | Rosé | 79,674 | RM | 63,603 |
| 9 | Lee Jun-young ★ | 72,108 | Suga | 62,249 |
| 10 | Cha Eun-woo ★ | 70,888 | San | 61,169 |

★ also appears in a Korean title that reached a Netflix Top 10.

Five of the top ten carry the flag, and those five hold **49% of the top ten's views**. The proportion
barely moves as the list lengthens: 10 of the top 20 and 49% of views, 28 of the top 50 and 54% of views.

The second column is not the corrected list. It is a different question answered with the same data.
The first column says *who in Korean music gets looked up*. The second says *who gets looked up for
music alone*. Both are true, they disagree at the top, and which one you want depends entirely on what
you are about to do with it.

## Why we flag instead of remove

The obvious move is to drop these 154 as contamination. We do not, for a reason that is easy to state:
they are not contamination. Wikidata records Jisoo as a singer and as a cast member because she is
both. Removing her decides, on her behalf, which career counts — and it makes the rule that built the
roster untestable, because the roster would then be a rule plus a list of exceptions somebody typed.

So the panel carries a column, `also_on_screen_actor_roster`, and this figure: **filtering it out
removes a third of the attention in the panel.** Anyone who filters it without knowing that has
quietly changed what they are measuring.

## What the flag actually means

It does not mean "is an actor." It means "appears, per Wikidata, in the cast of a Korean film or
series that reached a Netflix Top 10."

IU is not flagged. She has led several series. Lee Sang-yi is not flagged, and the title of his
Wikipedia article is *Lee Sang-yi (actor)*. Neither has a cast credit on a Korean title that charted
in the window our screen roster is drawn from, so neither carries the flag — and the flag is honest
about being a Netflix-shaped question rather than a career one.

There is a second gap underneath, and it moved rather than closed. The screen roster now
began as 1,113 names and 1,113 could be measured; **0 had no English Wikipedia article at all** — because we
now build the roster only from cast members who have one. The hole is a step earlier: Wikidata
records 1,408 Korean cast members across these titles and 1,113 of them have an English article, so
295 people are outside the flag before it is raised. A working actor can be missing for lack of an
article as easily as for lack of a credit. A flag built from two volunteer datasets and one
company's weekly chart inherits the holes in all three.

## What this is not

Every figure here counts openings of an English Wikipedia article over thirty days. It is not sales,
not streams, not chart position, and not attention inside Korea, where the reading happens in Korean
on pages we do not count.

It also cannot say **why** a page was opened. So Ji-sub's 156,817 openings are not evidence that
people were looking for an actor rather than a singer. They are evidence that people were looking for
So Ji-sub. The split in the table above is a split by credit, not by intent, and no data we can reach
turns one into the other.

---

If the top of music attention is actors, does screen work carry back into it? [Read what predicts an actor being looked up →](/article/playing-at-home-predicts-being-looked-up-abroad)
