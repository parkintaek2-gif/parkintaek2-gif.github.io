---
title: "Undercover took 48 places in our Korean panel. It is Belgian"
category: industry
purpose: both
dek: "Two works can carry the same English title, and a chart row does not say which one it is. Thirteen titles in our Korean panel turned out to be foreign works. The test that found them is not the name — it is where they charted."
pubDate: 2026-08-10
updatedDate: 2026-09-03
dataAsOf: 2026-07-26T00:00:00+09:00
author: Newsroom
tags: ["korea", "netflix", "method", "measurement", "limits", "corrections"]
pages:
  - "/provenance"
sources:
  - org: "Netflix"
    api: "Tudum weekly Top 10 country lists, 493,600 rows read, 2021-07-04 to 2026-07-26, 93 markets, Russia excluded"
    url: "https://www.netflix.com/tudum/top10"
  - org: "Wikidata"
    api: "Country of origin and original language for every film and television series carrying each English title"
    url: "https://query.wikidata.org"
crossChecks:
  - "Absence from Korea's own chart was tested as a rule on its own and rejected, because 381 of 974 Korean titles never chart in Korea at all"
  - "Every removed title was checked to have zero places on Korea's own chart, and the builder fails if any of them has one"
  - "Two titles met the market test but were kept, because a Korean work genuinely shares their name and we cannot tell which one charted"
  - "The removed places are reported as a share of the panel so the size of the error is visible rather than described"
excluded:
  - "Russia, excluded across this publication because Netflix withdrew and the remaining weeks are not comparable"
  - "Any title where Wikidata knows no foreign work of that name, because then there is nothing to attribute the chart row to"
---

A Netflix country chart gives you a title and a rank. It does not give you a work. If two productions
carry the same English name, the row is the same either way, and any list built by matching title
text will quietly collect both.

Ours did. **Thirteen titles in our Korean panel were foreign works.** The largest of them,
*Undercover*, held 48 chart places across 24 countries. It is the Belgian series.

## What gave them away

Not the name — the names are identical. **Where they charted.**

| Title | Places | Markets | Largest market | Its share |
|---|---:|---:|---|---:|
| Breathless | 250 | 69 | Spain | 5.2% |
| Dangerous Liaisons | 165 | 70 | France | 2.4% |
| One More Time | 58 | 38 | Sweden | 5.2% |
| Undercover | 48 | 24 | Netherlands | 33.3% |
| UFO | 17 | 12 | Turkey | 29.4% |

*Undercover* never appeared on Korea's own chart. Its heaviest markets are the Netherlands and
Belgium, which is where a Flemish-language Netflix series would be heaviest. Nine of the thirteen
charted in exactly one country, and in every case that country is the one Wikidata names as the
origin of a same-titled foreign work.

## The obvious test does not work

The first rule we tried was "if it never charts in Korea, it is not Korean." It is wrong, and the
size of the error is the point: **381 of our 974 Korean titles — 39.2% — never chart in Korea at
all.** A drama that airs on KBS or tvN is on Korean television, not on Netflix Korea, so it can
travel to sixty countries without ever appearing at home. Applying that rule alone would have thrown
out hundreds of genuine titles to catch 16 foreign ones.

So the test requires three things at once, and all three must hold:

1. The title never charted in Korea.
2. Wikidata attributes **no Korean work at all** to that name.
3. The market where it charted most is one Wikidata names as the origin of a work with that name.

Condition 2 is what makes it safe. A name that a Korean work also carries is never removed, however
foreign the chart pattern looks.

## Two we could not settle

| Title | Places | Market | Why it stayed |
|---|---:|---|---|
| Keys to the Heart | 3 | Philippines | A Korean film carries this name |
| Life Is Beautiful | 2 | Italy | A Korean film carries this name |

Both met conditions 1 and 3. Both failed condition 2, so both stayed in the panel. We do not know
which work charted, and we would rather carry two uncertain rows than delete two of our own.

## How large the error was

The 16 titles held **557 chart places out of 39,696, which is 1.4%.** The largest single one, *Breathless*, held 250 of them. They were spread across 38 of
the 93 markets, and
the largest effect on anything we publish was that Malta left the top five of
[the markets that only take wide titles](/hard-markets) and Croatia entered it.

The share is small. That is not the reason to report it, and it is not a reason to have left it
alone: a method that says "we match on title text" has to say what happens when title text is not
unique, and until today ours did not.

## What this cannot do

It needs a foreign work that Wikidata already knows about. A title with no entry anywhere is
invisible to this test, and so is one where the foreign work exists but its country is unrecorded.

It also says nothing about titles inside the panel that are correctly Korean but whose chart rows
belong to a second work of the same name in some weeks and not others. We can only accept or reject
a title whole. Nothing in a rank table separates one row from another.

## What changed on 3 September 2026

Our list of Korean titles had been frozen at 8 August. We rebuilt it, it went from 397 titles to
420, and one title we had been counting as Korean (*Dangerous Liaisons*, the 2022 French film) is
not. **15 figures in this piece moved with it.** None of them changed what the piece found. The
ones a reader is most likely to have quoted:

| | Was | Now |
|---|---|---|
| Titles removed as not Korean | 13 | 16 |
| Chart places they had carried | 84 | 557 |
| Their share of our Korean total | 0.21% | 1.4% |
| Titles that never chart in Korea | 384 of 977 | 381 of 974 |

Every table above is now generated from the counted file rather than typed out, and a check reads
each figure back out of that file on every build. We print what moved rather than swapping it
quietly: one wrong number makes the correct ones beside it worth doubting.