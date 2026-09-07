---
title: "Mexico held KPop Demon Hunters 51 weeks. In 14 days, not one Korean article reached its most-read list"
dek: "Wikipedia publishes each country's most-read articles daily. Across 20 countries and 14 days, 87 Korean articles ever appeared — 63 of the 93 appearances were Japan alone. Nine countries had none."
category: industry
purpose: both
pubDate: 2026-09-07
dataAsOf: 2026-09-06T00:00:00+09:00
author: Newsroom
tags: ["mexico", "japan", "wikipedia", "by-country", "attention", "k-drama", "kpop"]
pages:
  - "/what-countries-read"
sources:
  - org: "Wikimedia Foundation"
    api: "Pageviews REST API — top-per-country, all-access, daily, 2026-08-24 to 2026-09-06"
    url: "https://wikimedia.org/api/rest_v1/"
  - org: "Wikidata"
    api: "P27 citizenship, P495 country of origin, P17 country — each article resolved individually, not by name"
    url: "https://www.wikidata.org"
crossChecks:
  - "Every one of the 21,975 distinct articles that entered any country's daily list was resolved against Wikidata individually. No article was called Korean because its title looked Korean."
  - "The five items where South Korea is one country among several — two co-productions and three dual nationals — are named in the article rather than dropped or hidden."
  - "Turkey returned no data for all 14 days and therefore has no row at all, rather than a row of zeroes. 46 country-days were unavailable in total and are recorded as unavailable."
limitation: "This instrument only sees the top of each country's reading. An article that did not reach a country's daily most-read list is invisible here, which is not the same as unread — and the cut-off is much higher in countries where the list is short. Read counts also arrive rounded to the nearest hundred, so no figure here is precise."
---

Mexico kept *KPop Demon Hunters* in its Netflix Top 10 for 51 weeks — two weeks longer
than the United States managed, and fifth-longest of the 93 countries that charted it at
all. This week Mexico's Canal 5 picked up a dubbed Korean drama, and Korea's president is
reported to be taking a K-pop act with him on a visit there.

So we checked what Mexicans actually looked up.

Wikipedia publishes, for every country, the articles readers in that country opened most
each day. We took 14 days of it across 20 countries, resolved all **21,975 distinct
articles** that appeared against Wikidata, and counted the Korean ones.

In Mexico: **none.** Not one Korean article reached the daily most-read list on any of the
14 days.

## Across 20 countries, Korea reached the top of one country's reading

| Country | Distinct articles measured | Korean ones | Most-read Korean article |
| --- | ---: | ---: | --- |
| **Japan** | 4,617 | **63** | Yoo Bong-sik |
| India | 2,274 | 10 | Mousetrap |
| Philippines | 159 | 6 | Mousetrap |
| United States | 3,712 | 4 | Hope |
| Malaysia | 117 | 3 | Mousetrap |
| France | 2,749 | 3 | Bugonia |
| United Kingdom | 4,319 | 2 | Kim Min-su |
| Spain | 966 | 1 | Lee Kang-in |
| Germany | 3,584 | 1 | Hwang Hee-chan |
| **Mexico** | 234 | **0** | — |
| **Poland** | **807** | **0** | — |
| Brazil, Argentina, Chile, Colombia, Peru, Indonesia, Thailand | 30–546 each | 0 | — |

87 distinct Korean articles — a title counts once per Wikipedia language edition — making
93 country-appearances. **63 of those 93 were Japan.**

## Read the second column before the third

The number of distinct articles that reaches a country's daily list is not the same
everywhere: 30 for Peru, 4,617 for Japan. A country with a short list has a high cut-off,
so a zero there is weak evidence. The strongest zero in this table is Poland — 807 distinct
articles measured over two weeks, and not one of them Korean.

Mexico's 234 is in between. It is enough to say Korea did not reach the top of Mexican
reading; it is not enough to say Mexicans are not reading about Korea at all. We are not
going to say the second thing.

## What Japan reads is the thing everyone assumes everyone reads

| Article (Japan’s top ten of 63) | Reads over 13 days |
| --- | ---: |
| Yoo Bong-sik | 43,400 |
| Extraordinary Attorney Woo | 41,600 |
| Human Vapor | 39,400 |
| NCT Wish | 38,400 |
| Park Eun-bin | 37,400 |
| Illit | 34,900 |
| Ateez | 24,500 |
| Tomorrow X Together | 18,000 |
| Stray Kids | 16,500 |
| Ji Chang-wook | 15,400 |

Japanese Wikipedia is where Korean actors, groups and dramas get looked up **by name**, in
volume, day after day. It is the only country in this set where that happens.

Everywhere else the Korean articles that surface are mostly athletes. The United Kingdom's
was a footballer. Spain's was a footballer. Germany's was a footballer. Of the four in the
United States, one was BTS and one was a baseball player.

## Charting is not curiosity

This is the finding, and it cuts against how the K-culture story is usually told.

A title can sit in a country's Netflix Top 10 for a year — Mexico gave *KPop Demon Hunters*
51 weeks, Latvia 62 — without anyone in that country ever opening the encyclopedia about
it. Watching something a service has put in front of you and going to look something up
are different acts, and only the second one leaves a trace of curiosity.

That fits what we have measured elsewhere. Attention to a Korean act
[halves two months after its peak](/group-afterlife); Korean *titles* halve in the same two
months. The one place the arrow runs the other way is comics: a Korean webtoon is read
[fourteen times more](/webtoon-adaptations) once a drama is made from it, because an
adaptation sends people to look something up rather than merely watch it.

## How we decided an article is Korean

By Wikidata property, never by the look of a title: citizenship (P27), country of origin
(P495), or country (P17) equal to South Korea, resolved article by article. That rule
admits works and people where Korea is one country among several, and we name all five
rather than quietly keep or drop them: *Human Vapor* (Japan and Korea), *Bugonia* (United
States, Korea, Ireland), Tomohiro Machiyama (Japan and Korea), Yoshihiro Akiyama (Japan and
Korea), Pom Klementieff (Canada, Korea, France).

## Method

Wikimedia's `top-per-country` endpoint returns the articles most read in a given country on
a given day, across all Wikipedia language editions. We collected 14 days for 20 countries,
dropped main pages, search pages and other non-article entries, and resolved every distinct
article that remained. Read counts come rounded to the nearest hundred and are not
presented as precise. Turkey returned no data on all 14 days and has no row at all rather
than a row of zeroes; 46 country-days were unavailable in total and are recorded as such
in the underlying file.
