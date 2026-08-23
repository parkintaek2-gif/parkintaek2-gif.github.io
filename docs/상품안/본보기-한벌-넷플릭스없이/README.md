# Korean culture data — the part that carries no chart licence question

Two panels and our corrections record. **Nothing in this bundle is derived from Netflix's charts**,
which is the whole point of it: it can be used today without waiting on anything.

## What this is, in four lines

1. **How often each K-pop act was looked up** on English Wikipedia — 2372 acts and members,
   30 days, daily. Groups and individuals are marked separately, and so are the ones who are
   also screen actors.
2. **Korea's music and broadcast exports** by year and by region, beside the workforce of its listed
   content companies — 216 rows.
3. **Everything we have published and had to correct**, with the old value beside the new one.
4. `columns.csv` says what every column means, including what a blank cell means. `coverage.csv`
   says what is missing and whether it can ever be filled.

## Why this bundle exists separately

Our fuller bundle includes a panel of Korean titles on Netflix. The redistribution terms for that
chart source are still being confirmed, and **we check a licence before we publish, not after.**

Rather than hold back the tables that have no such question, we cut them out into this one. The rule
we used is strict: a table is here only if **both its rows and the choice of which rows to include**
come from sources with no open question.

That rule cost us a column as well as a table. The K-pop panel in the fuller bundle carries a flag
saying whether an act also appears in a charting screen title; it is dropped here, because whether
someone is on that roster is decided by which titles reached a Netflix chart. Same line, applied to
a column rather than a file.

That is why the actor-to-title join is **not** here. Its rows are Wikidata statements, but which
titles it covers was decided by the Netflix charts, and we would rather draw the line clearly than
argue about the edge.

## Sources

| Panel | Source | Status |
| --- | --- | --- |
| K-pop attention | Wikimedia Pageviews API (en.wikipedia); roster from Wikidata | open |
| Music and broadcast exports | Content Industry Survey via KOSIS | open |
| Listed workforce | FSS DART annual report employee disclosures | confirmed unrestricted, 2026-08-05 |

## Read this before you build on it

**These are lookups, not listens.** The K-pop figure counts how many times an English Wikipedia page
was opened. It is curiosity, not consumption, and nobody should convert it into streams or sales.

**An act with no English article is invisible here.** It produces no row, so it cannot be counted as
a zero — it is simply absent, and we cannot say how many are.

**The survey years run behind.** 2025 and 2026 are not published yet.

Every figure in this bundle is produced by a build script from the same files our public pages read.
When a number changes on the site it changes here, and the change is written into `corrections.csv`.

Questions: parkintaek2@gmail.com
