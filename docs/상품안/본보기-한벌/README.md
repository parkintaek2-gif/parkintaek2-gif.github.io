# K Culture Wire — Korean Content Panel

Sample bundle, 2026-08-07. Six files. Start here.

| File | What it is | Rows |
| --- | --- | ---: |
| `korean-title-panel.csv` | Every Korean title that charted in six Southeast Asian markets since 2021 | 405 |
| `provenance.csv` | How sure we are that each title is Korean, and how much of the total that covers | 3 |
| `industry-panel.csv` | Korean music and broadcast exports by year, beside the workforce of listed content companies | 216 |
| `corrections.csv` | Every figure we have published and had to change | 12 |
| `method.md` | How each number is made, in the words our build scripts use | — |

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
