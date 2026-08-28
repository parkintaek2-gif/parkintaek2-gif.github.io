---
title: "The Korean school with the most alumni travels the least"
dek: "Seoul Institute of the Arts has more alumni in our Netflix set than any school. Their titles reach a median of 16 countries. Dongguk's reach 41.5."
category: industry
pubDate: 2026-08-28
dataAsOf: 2026-08-28T17:00:00+09:00
author: Newsroom
tags: ["netflix", "schools", "korea", "actors", "wikidata", "measurement"]
pages:
  - "/school"
  - "/person"
  - "/by-country"
sources:
  - org: "Wikidata"
    api: "SPARQL — Korean actors, singers and songwriters, read for P69 (educated at). Schools recorded for 4,535 of 9,249 people"
    url: "https://query.wikidata.org"
  - org: "Netflix"
    api: "Tudum Top 10 weekly country lists, all-weeks-countries.tsv — 268 weeks, 2021-07-04 to 2026-08-16, 94 countries"
    url: "https://www.netflix.com/tudum/top10"
crossChecks:
  - "The two files are joined on the person's Wikidata Q identifier, never on a name. An earlier join in this newsroom matched on English names and silently dropped a person who had no English label, so name matching is not used here"
  - "Every school figure is a median, not a mean. One title in this data holds 3,228 chart places; a mean would let that single title decide a school's number"
  - "Each school is reported twice: once with all its alumni and once with its single widest-reaching person removed. Where the two numbers are far apart, the school's figure belongs to one person and is described that way"
  - "Reach is taken as the widest single title a person has, not the sum of their titles. The source file gives a country count per title but not which countries, so summing would count the same country more than once"
excluded:
  - "332 of the 355 schools in the join have fewer than five people in the Netflix set. They are excluded from every table here and are not ranked"
  - "103 people in the Netflix set have no Wikidata identifier recorded and could not be joined at all"
  - "Any claim that a school causes reach. This data cannot separate a school selecting people who would travel anyway from a school teaching something that travels"
  - "Musicians whose work does not appear in Netflix's Top 10 files. A singer who never charted on Netflix is invisible here no matter how widely they are heard"
  - "Hours viewed. Netflix publishes hours only for the global list, never per country"
---

We have known for a while which Korean school has the most alumni on screen. We had never asked
how far those alumni's work actually travels.

Two files answer it together. Wikidata records where 4,535 Korean actors, singers and songwriters
went to school. Netflix's weekly country files record, for 636 of the people we track, every title
that reached a country's Top 10 and how many countries it reached. Joined on each person's Wikidata
identifier, they give a school-by-school answer.

**The school with the most alumni in the set has almost the lowest reach of any school we can
measure.**

## Twenty-three schools have enough people to measure

All twenty-three are listed. Nothing is left out of this table.

| School | People | Median countries | Without its widest person |
|---|---:|---:|---:|
| Ewha Womans University | 5 | 68 | 55.5 |
| Kyunggi High School | 5 | 61 | 47.5 |
| Sejong University | 8 | 60 | 55 |
| Korea University | 6 | 56.5 | 48 |
| School of Performing Arts Seoul | 9 | 51 | 48.5 |
| Kaywon High School of Arts | 7 | 45 | 40.5 |
| Daejin University | 5 | 43 | 25 |
| Dongguk University | 32 | 41.5 | 40 |
| Kyung Hee University | 14 | 41.5 | 38 |
| Korea National University of Arts | 32 | 41.5 | 36 |
| Myongji University | 6 | 40 | 37 |
| Dankook University | 23 | 36 | 35 |
| Chung-Ang University | 52 | 35 | 34 |
| Kyung Hee Cyber University | 5 | 30 | 19.5 |
| Anyang Arts High School | 6 | 29.5 | 13 |
| Sungkyunkwan University | 19 | 28 | 20 |
| Seoul National University | 6 | 27.5 | 21 |
| Konkuk University | 22 | 25 | 23 |
| Dongduk Women's University | 13 | 20 | 16 |
| Hanyang University | 25 | 19 | 18.5 |
| University of Suwon | 5 | 19 | 15.5 |
| **Seoul Institute of the Arts** | **51** | **16** | **14** |
| Hanlim Multi Art School | 12 | 11 | 11 |

The remaining 332 schools in the join have fewer than five people in the Netflix set. They are not
ranked here at all, because a median drawn from two or three people is a person, not a school.

## The two largest schools sit at opposite ends

Chung-Ang University and Seoul Institute of the Arts are the two biggest suppliers of people to
this set — 52 and 51. They are 19 countries apart.

Seoul Institute of the Arts is the largest arts school in the country by almost any count. In our
roster it has 352 people, more than any other school. In the Netflix set it has 51 — again the
kind of number no small school reaches. And the median title of those 51 people reached
**16 countries**.

Dongguk University has 32 people in the set. Their median title reached **41.5**.

## This is not one person's number

The obvious objection is that a school's figure is really one famous graduate. That objection is
testable, so we tested it: the last column of the table removes each school's single
widest-reaching person and recomputes the median.

Seoul Institute of the Arts goes from 16 to 14. Removing its widest person makes it *lower*, not
higher. Dongguk goes from 41.5 to 40. Chung-Ang, from 35 to 34.

The schools where the objection does hold are visible in the same column. Anyang Arts High School
drops from 29.5 to 13 once Shin Ye-eun is removed — that school's figure is one person. Daejin
University drops from 43 to 25 without Lee You-mi, whose widest title reached 93 countries.
Those two rows should be read as being about a person, not a school.

The rows at the top and the rows at the bottom hold.

## What a low number here does not mean

A median of 16 countries is not a small career. It is a career whose most widely distributed title
was seen in 16 of the 94 countries Netflix publishes lists for — which is most of a continent.

It also measures only one channel. Seoul Institute of the Arts is a school with a large music and
stage presence, and this file cannot see a stage. A singer whose work never entered a Netflix
country Top 10 contributes nothing to their school's number here, however widely they are heard.
Of the 9,249 people in our roster, 636 appear in the Netflix set at all.

So the honest form of the finding is narrower than the headline: **among the people who do reach
Netflix's Top 10 lists, the ones from the largest arts school reach fewer countries than the ones
from several mid-sized universities.** Why that is, this data cannot say.

## What we cannot separate

We cannot tell whether a school shapes reach or selects for it. A university that admits people
who were already going to travel widely and a university that teaches something that travels
widely produce the same table.

Nor can we separate attending from graduating. Wikidata's *educated at* property does not
distinguish them, so neither do we — several people in this table left before finishing.

And 4,714 of the 9,249 people in our roster have no school recorded at all. A school that looks
small here may simply be a school Wikidata's editors have not filled in yet.

## The one number we would want next

The table above ranks schools by how far their alumni's *widest* title went. It says nothing about
how many titles each person has, or how long those titles stayed. A person with one title that
reached 90 countries and a person with nine titles that each reached 30 sit in very different
places in an industry and in the same place in this table.

That is a separate measurement and we have the rows to make it. It is not in this piece because
we have not made it yet.
