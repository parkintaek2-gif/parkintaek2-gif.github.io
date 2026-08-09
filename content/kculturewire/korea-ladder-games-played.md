---
title: "Korea's top League players are not the ones grinding hardest. Europe's are."
dek: "Europe West's challengers average 921 ranked games to Korea's 770 and Southeast Asia's 410. In five of six regions you play more to reach the top tier. In Vietnam you play less, on all four days measured."
category: esports
purpose: both
pubDate: 2026-08-07
dataAsOf: 2026-08-06T22:00:01+09:00
author: Newsroom
tags: ["league of legends", "esports", "korea", "ranked ladder", "riot games"]
pages:
  - "/esports"
  - "/ladder-gap"
  - "/ladder-churn"
sources:
  - org: "Riot Games"
    api: "Developer API — /lol/league/v4/challengerleagues and /lol/league/v4/grandmasterleagues, queue RANKED_SOLO_5x5, collected once a day at 22:00 KST across six regions"
    url: "https://developer.riotgames.com"
crossChecks:
  - "Games played is Riot's own per-player wins-plus-losses for the current ranked season, averaged across the tier. It is not a rate — a player who joined the tier yesterday and one who has held it all season are both counted at their season total"
  - "The challenger-versus-grandmaster comparison is within the same region on the same night, so a region playing more overall does not create the gap. Korea's challengers average 12.6% more games than its grandmasters; Vietnam's average 4.3% fewer"
  - "The direction of that gap held on all four days collected for five of the six regions. Japan is the exception: +3.1, +2.6, +4.2 and then −0.4, which is what a 50-player tier does"
  - "Tier sizes are 300 challengers and 700 grandmasters in every region except Japan, where challenger is 50. Every percentage for Japan moves two points when one player moves"
excluded:
  - "Any claim that more games means more effort or more skill. Games played counts matches, not hours, and says nothing about how long a match ran or how long a player has been in the tier"
  - "Anything about professional play. This is the public solo-queue ladder. Pro players appear on it but are not identified, and nothing here describes teams, leagues or salaries"
  - "Player identity. We store no puuid or summoner ID, and no individual is named or counted twice on purpose"
  - "2026-08-05, which is missing. The collection key expired that day and a ladder cannot be rebuilt afterwards, so the day is gone rather than estimated"
  - "Why any region differs. Server population, season start dates, queue times and how Riot places new accounts all move these numbers, and none of them are in this data"
draft: false
---

The Korean ladder is the reference point everyone else is measured against. It is usually described in terms of difficulty — the hardest server, the deepest field. What almost nobody counts is how much the people at the top of it actually play.

They do not play the most. Europe does.

## The top tier by games played

| Region | Challenger games each | Grandmaster games each | Challenger vs grandmaster |
| --- | ---: | ---: | ---: |
| Europe West | **921** | 803 | +14.7% |
| Korea | 770 | 684 | +12.6% |
| North America | 659 | 624 | +5.6% |
| Vietnam | 601 | 628 | **−4.3%** |
| Japan | 465 | 467 | −0.4% |
| Southeast Asia | 410 | 396 | +3.5% |

*Ranked solo queue, 2026-08-06 22:00 KST. 300 challengers per region except Japan, which has 50.*

Europe West's challengers have played **2.2 times** as many ranked games as Southeast Asia's. Korea sits second, closer to Europe than to anyone below it.

## The more interesting column is the last one

Within a single region on a single night, the challenger and grandmaster tiers are playing the same server, the same queue, the same season. The only difference between them is that one is above the other. So the gap between their game counts asks a narrow question: **does getting into the top 300 involve playing more than the 700 below you?**

In four regions it does. In Europe West by 14.7%, in Korea by 12.6%, in North America by 5.6%, in Southeast Asia by 3.5%.

In **Vietnam it is reversed**. Vietnamese challengers have played 4.3% *fewer* games than the grandmasters beneath them, and that was true on all four days we have collected — −2.3%, −4.6%, −3.1%, −4.3%. It is not a one-night reading.

Japan sits at zero and moves around: +3.1, +2.6, +4.2, −0.4. Japan's challenger tier is 50 players rather than 300, so a handful of people entering or leaving swings it. We print it and do not lean on it.

## Set it beside what we already counted

We have now measured the same six ladders three other ways, and Korea has come out at an extreme each time.

| | What we counted | Korea |
| --- | --- | ---: |
| [Win rate](/esports) | How often challengers win | Lowest of six |
| [Tier gap](/ladder-gap) | Challenger win rate minus grandmaster | Smallest, 0.45 points |
| [Turnover](/ladder-churn) | Share of challengers Riot flags as long-standing | Highest, 54.0% |
| Games played | Challenger games each | Second, 770 |

Korea's top tier wins least often, is separated from the tier below it by the smallest margin, changes hands least, and does not play the most. Those four sit together comfortably: a crowded field where the people at the top stay there, without the top being a place you reach by volume alone.

**That is a description, not an explanation.** These are four fields of one nightly snapshot of one queue. None of them says why, and a fifth measurement could complicate all of it.

## What the number is not

Games played is a season total. A player who reached challenger last week and one who has held it since the season opened are both counted at whatever they have played this season — so a tier with a lot of recent arrivals will show a lower average without anyone playing less. That is a real limit, and it is one of the reasons the within-region comparison in the third column is more useful than the ranking in the first.
