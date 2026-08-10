---
title: "Half the titles in our Southeast Asia panel cannot be verified as Korean. Here is exactly how big that is."
dek: "197 of 397 titles never reached a global Top 10, so Netflix's language label — the only thing that separates a Korean work from a foreign one with the same name — cannot be applied to them. They are also the small ones."
category: titles
purpose: ads
pubDate: 2026-08-07
dataAsOf: 2026-08-07T00:00:00+09:00
author: Newsroom
tags: ["korean drama", "netflix", "measurement", "data quality", "korea"]
pages:
  - "/titles"
  - "/reach"
  - "/staying-power"
sources:
  - org: "Netflix"
    api: "Top 10 weekly lists (Tudum), global and per-country, 265 weeks from 2021-07-04 to 2026-07-26. The global lists carry a language category; the country lists do not"
    url: "https://www.netflix.com/tudum/top10"
  - org: "Wikidata"
    api: "Country of origin (P495 = Q884), used to match chart titles to Korean works by name"
    url: "https://query.wikidata.org"
crossChecks:
  - "The counts here are produced by the same build that produces the pages, and the pages read them from the data rather than carrying a typed number. A check fails the build if any figure the build measures is not shown on a page that uses it"
  - "The language label comes from Netflix's own global chart categories, not from our judgement about a title"
  - "The 'small' claim is a median over the unverified group itself: one country, three weeks. It is not an average, which a handful of large titles would distort"
  - "Nine titles were removed by hand after being read one at a time; 36 were removed because Netflix files them on its English charts. Both counts are printed on the pages"
excluded:
  - "Any estimate of how many of the 197 are actually foreign. We can name examples but we have not audited the group, and a guess dressed as a figure is worse than the gap"
  - "Any claim that the unverified titles are wrong. Most are probably Korean. The point is that we cannot show it from published data"
  - "Hours viewed. Netflix publishes hours for its global chart only"
---

Netflix does not say where a title was made. Anyone building a Korean panel has to decide that for
themselves, and the usual method is to match a list of Korean works against the charts by name. That
works until two countries make something with the same name, which they do constantly.

There is one thing in the published data that settles it. Netflix splits its **global** Top 10 by a
title's primary language, and a Korean work belongs on the Non-English side. If a title has reached
the global chart, the label tells you which work charted.

**Country charts carry no language field.** And 197 of the 397 titles in our Southeast Asia panel
have never reached a global Top 10. For those, the check cannot be run at all. They are in the panel
on a name match and nothing else.

## How much this actually costs you

Two numbers, and they point in different directions.

**By title count it is half the panel.** 197 of 397 — 49.6%.

**By size it is small.** The median title in that unverified group charted in **one country for
three weeks**. The verified group's median is 28 countries and 8 weeks. Whatever is wrong in the
unverified half is concentrated in titles that barely moved.

Both numbers are true and neither is the answer on its own. If you are counting titles, half your
rows are unconfirmed. If you are weighting by reach, the unconfirmed part is a tail.

## What is actually in there

We looked. Among the unverified titles that did travel widely, foreign works with Korean-sounding
company are plainly present — *Tarot* in 54 markets, *Gossip Girl* in 45, *Mr. Robot* in 43,
*Barbie* in 37. None of those is a Korean work; each matched because Wikidata also records a Korean
film or series with that exact name.

Others in the same group are real: *Snowpiercer*, *Scent of a Woman*, *Watcher*, *Mine* are Korean
works that simply never broke into a global Top 10. **We are not going to tell you what share is
which**, because we have not read all 197, and a guess presented as a figure would be worse than the
gap it papers over.

## Where the rule does work

On the titles that can be checked, it removes real errors rather than hypothetical ones.

**36 titles** matched a Korean work by name and turned out to sit on Netflix's English charts — so
they are the English-language work, not the Korean one. **Seven more** came out of this panel by
hand after being read one at a time: *Teach You a Lesson* is Chinese, *Hunger* is Thai, *The
Empress* is German.

The hand list is longer than seven — it is maintained once for every panel we build, and only the
entries that actually appear in Southeast Asia's charts show up in this count. The most recent
addition, on 7 August 2026, was *Friends*: Wikidata carries a 2002 Korean drama of that name, but
the title charting for 108 weeks across 36 markets is the American sitcom. It never charted in these
six countries, so it is not among the seven above.

On 8 August 2026 **eight more** came out, and not by reading them. They came out because our own
attribution query — the one that produces the shared/unambiguous split above — returned **no Korean
work at all** for those exact titles. *Waterworld*, *Re/Member*, *Into the Storm*, *Wildflower*,
*Feng Shui*, *Glorious Days*, *Long Live Love!* and *You and Me* were sitting in a Korean panel while
the instrument we publish said nothing Korean carries those names.

**That is a different kind of removal and we count it separately.** Reading a title is a judgement;
this was our own measurement contradicting our own list, which is not a judgement at all. A check now
fails our build if any title in the panel is one the attribution query says no Korean work carries.

## Why we print this at all

A panel that quietly includes what it cannot verify is more dangerous than one that says so, because
the first kind gets quoted. These counts are now on `/titles`, `/reach` and `/staying-power`, read
from the build rather than typed in, and a check fails our build if any limit the build measures
stops being shown.

That check was written on 7 August 2026 after we found that the figure had been computed for weeks
and displayed nowhere. Counting a limit and showing it are different things, and until that day we
had been treating them as the same.

---

Netflix has a second chart we had not used, and it settles some of these titles. [Read what Korea’s own chart says about them →](/article/a-third-of-what-travels-never-charts-at-home)
