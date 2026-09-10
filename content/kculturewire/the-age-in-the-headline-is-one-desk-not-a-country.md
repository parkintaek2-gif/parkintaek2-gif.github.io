---
title: "Korean entertainment headlines put your age in quotation marks. One desk does almost all of it"
dek: "Ten days of Korean front pages, 1,365 headlines. One entertainment desk opened 27 percent of its stories with an age in quote marks. The other did it in 3 percent. The general and business papers: zero in 1,080."
category: industry
purpose: both
pubDate: 2026-09-11
dataAsOf: 2026-09-11T01:45:00+09:00
author: Newsroom
tags: ["korean media", "headlines", "age", "measurement", "entertainment press"]
pages:
  - "/kpop-attention"
sources:
  - org: "K Culture Wire newsroom archive"
    api: "Daily front-page headline capture from four Korean outlets, 2 to 11 September 2026, stored as dated files"
    url: "https://www.kculturewire.com/"
crossChecks:
  - "The practice counted is an age inside quotation marks or brackets, which is the form the desks actually use. A bare mention of an age in running text is counted separately and is not what this piece is about"
  - "Headline totals per outlet differ by a factor of nine, so every rate is printed beside the count it came from"
  - "Sex is not measured. Guessing it from a name would be inventing a variable, and the practice may well fall unevenly by sex, which is a question this count cannot answer"
  - "Whether the printed ages are correct is also not measured. That needs recorded birth years and we did not fetch them"
  - "Ten days is ten days. 26 ages is a small sample, and the age brackets below should be read as a first look rather than a distribution"
  - "The pattern-matching character class silently broke twice while this was built, once returning zero matches. Both times the tool's own tests refused to publish a figure, which is why the number here is 26 rather than 0"
---

Read a Korean entertainment headline and you will often be told how old the subject is, before you are
told anything else, and the number will be in quotation marks.

> "82-year-old" Kim Do-hyang, a fall three months ago
>
> "32-year-old" Han So-hee went blonde and the mood changed completely
>
> "39-year-old" Han Ji-eun, really? First dramatic short cut in 20 years

English-language desks do not write this way. The age, if it appears at all, goes in the body. So the
obvious question is how common the Korean form actually is — and the answer turns out to be narrower
than "Korean media."

## What we counted

We capture the front pages of four Korean outlets every day and keep the files. Ten days, four
outlets, 1,365 headlines. For each one we looked for an age inside quotation marks or brackets, the
form the desks actually use.

| Outlet | Beat | Headlines | With a quoted age | Rate | Age in first position |
|---|---|---:|---:|---:|---:|
| TenAsia | K-culture | 73 | 20 | **27.4%** | 18 |
| Star News | K-culture | 212 | 6 | 2.8% | 4 |
| Maeil Business | business | 695 | 0 | 0.0% | 0 |
| Dong-A Ilbo | general | 385 | 0 | 0.0% | 0 |

## It is one desk

TenAsia opened **more than one headline in four** with a quoted age, and 18 of its 20 put the number
in the very first position, before the name.

Star News, covering the same beat on the same days, did it six times in 212 headlines.

The business paper and the general paper did it **zero times in 1,080 headlines**.

That is the finding. This is not a Korean press convention, and it is not even an entertainment-press
convention. It is one desk's house style, and it is strong enough there that a reader who only ever
saw TenAsia would reasonably conclude that Korean journalism always announces your age.

Which desk a story comes from turns out to matter for what reaches English readers at all. Our count
of [who the English-speaking world looks up when it looks up K-pop](/kpop-attention) is built from
the same kind of daily capture, and the names that travel are not evenly drawn from the desks that
write about them.

## Which ages get announced

Of the 26 quoted ages across the ten days:

| Age bracket | Times |
|---|---:|
| 30s | 7 |
| 40s | 9 |
| 60s | 1 |
| 70s | 4 |
| 80s | 5 |

Nobody in their twenties or fifties had an age quoted in these ten days. With 26 cases that gap is not
yet a pattern — it is one of the things worth watching as the archive gets longer. But the shape it
hints at is a practice aimed at two moments: people in their thirties and forties, where the number
carries an implication about looking younger than it, and people past seventy, where it carries an
implication about still being active.

## What we did not measure

We did not measure sex. A count that guessed it from names would be inventing a variable and printing
it as a finding, and the practice may well fall unevenly by sex — which is a question this count
cannot answer.

We did not check whether the printed ages are right. That needs recorded birth years, and reading
them is a separate job from reading headlines.

And ten days is ten days. The rate at one desk is 27.4 percent across 73 headlines, which is a real
count of a real ten days, and not a claim about the year.

## One note on how this was built

The pattern that finds a quoted age broke twice while this was written. Korean desks use at least five
quotation forms, and a character class holding all of them is easy to get wrong; the second time it
silently matched nothing at all, which would have produced an article reporting that the practice does
not exist.

Both times the tool refused to print a figure, because it runs its own tests before it will emit a
number and a failing test stops it. That is why the count above is 26 and not 0. We mention it because
a measurement that can return zero for the wrong reason is worth saying out loud.
