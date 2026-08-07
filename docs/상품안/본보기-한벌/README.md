# K Culture Wire — Korean Content Panel

Sample bundle, 2026-08-07. Nine files. Start here.

## Read this first: what is empty

We would rather you learn this from us than from a spreadsheet at six in the evening.

| What | How much | Can it be filled? |
| --- | ---: | --- |
| Titles whose name is shared with a foreign work, so we cannot say which one charted | 157 of 405 rows (38.8%) | **No.** Netflix publishes no country of production. Nothing in the source separates them |
| Titles Wikidata gives no country for | 21 rows (5.2%) | **Partly** — by a per-title human check we have not done |
| Hours viewed per country | every row | **No.** Netflix publishes hours for the global chart only |
| What sits below each weekly top ten | unknown | **No.** Unpublished, so we cannot even count what is missing |
| Export figures for 2025 and 2026 | 2 years | **Later.** The survey runs about eighteen months behind |
| K-pop acts with no English Wikipedia article — invisible to us entirely | uncountable | **No.** An act with no article produces no row, so we cannot even say how many are missing |
| K-pop history before 2026 | 30 days is all there is | **Later.** We began collecting daily this month. The window grows from here |

The same thing is in `coverage.csv` in a form you can filter.

**Weighted by viewing rather than by title count, the picture is better** — 79.8% of hours
sit on titles only Korean works carry. The ambiguity is concentrated in small titles. Both numbers are
below and neither is the real one on its own.

| File | What it is | Rows |
| --- | --- | ---: |
| `korean-title-panel.csv` | Every Korean title that charted in six Southeast Asian markets since 2021 | 405 |
| `kpop-attention-panel.csv` | Every K-pop act with an English Wikipedia article, and how often it was opened over 30 days | 2361 |
| `cast-title-join.csv` | Which actor appears in which charting Korean title, keyed on Wikidata Q-numbers | 3415 |
| `provenance.csv` | How sure we are that each title is Korean, and how much of the total that covers | 3 |
| `industry-panel.csv` | Korean music and broadcast exports by year, beside the workforce of listed content companies | 216 |
| `corrections.csv` | Every figure we have published and had to change | 12 |
| `coverage.csv` | What is empty, how much, and whether it can be filled | 17 |
| `method.md` | How each number is made, in the words our build scripts use | — |

## The file you cannot assemble from either source alone

`cast-title-join.csv`. **Netflix does not publish cast. Wikidata does not know about Netflix's
charts.** This file is the two of them joined — 3415 rows saying which person appears in
which charting Korean title.

It is keyed on **Wikidata Q-numbers**, for both the person and the title, not on names. That matters
more than it sounds. Joining these two sources on title text attaches cast to only 317 of 1,005
titles, because chart names and article names disagree constantly — *Squid Game* on the chart is
*Squid Game (TV series)* in the encyclopaedia. On Q-numbers it reaches 636 of
906. We spent a day rebuilding this because we had originally stored the count
of titles per actor and thrown the identifiers away, which made every question of the form *did this
show move its cast* unanswerable.

Names also change — disambiguators get added, romanisation is revised. Q-numbers do not. If you want
to line this month's file up against next month's, join on the Q-number columns.

⚠ 270 titles carry no cast statement in Wikidata at all
and are absent here rather than present with an empty cast. 265 of the
1355 people have no English Wikipedia article, so they are in the join but cannot be matched
to the attention panels. Both counts are in `coverage.csv`.

## The column most people will not have seen

`attribution`, in the title panel.

Netflix does not say where a title was made. Anyone building a Korean panel has to decide that for
themselves, and the usual way is to match a list of Korean titles against the chart by name. That
works until two countries make something with the same name — and they do, often.

So every row here carries what we think **and how sure we are**:

- `koreaOnly` — only Korean works carry this exact title. A name match cannot go wrong.
- `shared` — a foreign work shares the name. The `attribution_countries` column names them. We do
  not know which one charted, and we say so instead of choosing.
- `unknown` — Wikidata gives no country for any work with this name.

Two different numbers, and both matter.

| | Only Korean | Shared name | No country |
| --- | ---: | ---: | ---: |
| This panel, by titles | 227 | 157 | 21 |
| Global catalogue, by viewing hours | 79.8% | 17% | 3.2% |

**The panel has a much higher share of shared names than the global catalogue does.** That is not a
different standard — it is the same test on a different population. Titles that chart in Southeast
Asia without ever reaching the global Top 10 are smaller, and smaller titles carry ordinary English
names far more often. Weighted by viewing, the ambiguity is concentrated in the tail.
If you need a conservative cut, filter to `koreaOnly`. If you need coverage, take all of it and
report the share. Either way you can state your own error bound, which is the point.

## `corrections.csv`

Every number we have published and then changed, with the old value, the new value and the reason.

We include it because a figure that changes quietly is worse than one that was never published —
somebody has already quoted it. On 7 August 2026 a single flaw in how we matched titles had put wrong
figures on seven pages and four articles at once. All of it is in that file, including the size of
the error.

If you put one of our numbers in a report, this file tells you whether it still stands.

## What we could not measure

Stated plainly, because you will hit these:

1. **17% of viewing sits on titles a foreign work shares a name with.** We mark them; we do not
   resolve them. Nothing in the published data resolves them.
2. **Country charts carry no hours.** `countries_reached` is chart entry, not viewing. There is no
   viewing figure per market anywhere in Netflix's country data.
3. **Only the top ten exists.** A title watched widely that never breaks a top ten is absent entirely.
4. **Exports are nominal dollars.** Part of every increase is price, not volume. We did not adjust.
5. **Workforce covers listed companies only.** Much of Korean production is private and files nothing.

## Terms

Aggregates and our own attribution work, not redistribution of anyone's source tables. Netflix's
weekly tables and Riot Games ladder data are not in this bundle. KOSIS and DART figures are Korean
public open data and are cited above.

Questions: parkintaek2@gmail.com
