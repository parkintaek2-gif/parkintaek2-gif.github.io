---
title: "Korean film and television share actors freely — but less freely than chance alone would produce"
dek: "Of 701 actors with two or more charting Korean titles, 61.6% have worked in both film and series. If format meant nothing, the figure would be 73.2%. The gap is the size of the wall, and it is smaller than reputation suggests."
category: screen
pubDate: 2026-08-08
dataAsOf: 2026-08-07T00:00:00+09:00
author: Newsroom
tags: ["korean drama", "korean film", "netflix", "casting", "wikidata", "korea"]
pages:
  - "/actors"
  - "/titles"
sources:
  - org: "Wikidata"
    api: "Cast member (P161) with citizenship (P27 = Q884) on Korean titles that appeared in a Netflix Top 10, joined on Q-numbers; film or series from each title's instance-of statement"
    url: "https://query.wikidata.org"
  - org: "Netflix"
    api: "Top 10 weekly lists (Tudum), used to decide which Korean titles enter the set"
    url: "https://www.netflix.com/tudum/top10"
crossChecks:
  - "Restricted to the 701 people with two or more titles here, because someone with one title cannot be shown to cross anything"
  - "The chance figure is a null model, not an observation: for a person with n titles it is the probability that n independent draws are not all film and not all series, with the film probability set to film's share of the 636 titles (55.3%). It is stated as a comparison, not as what would really happen"
  - "Film and series come from Wikidata's own instance-of statement, not our reading of a title"
  - "No pageview data is used, so nothing here depends on whether a person has an English Wikipedia article"
excluded:
  - "Any claim about the whole industry. This is people credited in Korean titles that reached a Netflix Top 10 — a small, self-selected slice"
  - "Any claim about billing or role size. P161 records a cast member; a lead and one scene are the same row"
  - "Any claim that Wikidata's cast lists are complete. They are not. Missing credits push a person towards looking like a specialist, so the true crossing rate is probably higher than 61.6%"
  - "Theatre, advertising, variety and anything that did not chart. A person who alternates between film and stage looks like a film specialist here"
---

Korean screen work is often described as two industries — film people and television people — with
an occasional crossing that gets remarked on. The join between Netflix's charts and Wikidata's cast
lists lets us put a number on it.

Of the **701 actors with two or more charting Korean titles**, 432 have appeared in both a film and a
series. That is **61.6%**. Most people who work more than once work across the line.

## The number that makes it interesting

61.6% sounds like a wall that barely exists. To know whether it is low or high you need something to
compare it against, so we asked what the figure would be if format meant nothing at all — if each of
a person's titles were drawn without regard to whether it was a film or a series.

**73.2%.** Under that null, 513 of the 701 would have worked in both.

So the wall is real and it is thin: about **81 people** who could have crossed, given how many titles
they have, did not. Format is doing something. It is not doing very much.

## Where the separation actually sits

| Of the 701 with two or more titles | People | Share |
| --- | ---: | ---: |
| Both film and series | 432 | 61.6% |
| Series only | 184 | 26.2% |
| Film only | 85 | 12.1% |

**Series-only outnumber film-only by more than two to one.** That is the asymmetry: there is a
population that works in television and does not appear in a charting Korean film, and it is twice
the size of the population that does the reverse.

And it thins out fast with volume. Among the 195 people with **five or more** titles, 174 have done
both — 12 are film-only and 9 series-only. Work enough and you cross almost regardless.

## What would move these numbers

**Incomplete cast lists push in one direction only.** If a person did four series and two films and
Wikidata records only the series, they appear here as a series specialist. Missing credits cannot
turn a specialist into a crosser; they can only do the reverse. **61.6% is therefore a floor**, and
the true crossing rate is higher by an amount we cannot measure.

**The null model is a comparison, not a prediction.** It assumes a person's titles are independent
draws at film's overall share of the set. Nobody's career works that way. It is there to answer
"compared to what", which a bare 61.6% cannot.

**And this is only what charted.** A film actor whose work never reached a Netflix Top 10, or who
works mainly in theatre or advertising, is either absent or looks like something they are not.
