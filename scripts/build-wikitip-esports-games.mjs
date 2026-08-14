#!/usr/bin/env node
/**
 * **우리가 「이스포츠」라 부른 것은 한 게임이었다** (`/esports-games` · 기사 80편째)
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 *   78편에서 「이스포츠 선수가 한 달에 몰린다」고 썼다. 종목을 안 갈랐다.
 *   ⭐ 갈라 보니 잰 사람이 거의 다 **리그오브레전드** 선수였다.
 *      한국에 스타크래프트II 선수가 481명 있는데 동남아 판 문서는 넷뿐이다.
 *   🔴 그러니 78편의 말은 **너무 넓었다.** 이 지면이 그것을 좁힌다.
 *
 * ── ⛔ 이 지면이 지키는 것 ────────────────────────────────────
 * ⛔ 게임을 줄세우지 않는다. **한국에 몇 명 / 문서가 몇 / 읽히는 게 몇**을 나란히 놓는다.
 * ⛔ 셋이 안 되는 게임은 봉우리를 말하지 않는다.
 * 🔴 78편을 **좁혔다는 사실을 감추지 않는다.** 지면이 그 문장을 스스로 낸다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 지금 } from './_kst.mjs';

const 원자료 = 'archive/raw/wikipedia/esports-games.json';
const 결과 = 'src/data/wikitip-esports-games.json';

/** 한국에 몇 명인가 — Wikidata 에서 따로 받아 둔 수 */
export const 한국선수수 = {
  'StarCraft II': 481,
  'League of Legends': 418,
  KartRider: 43,
  'Warcraft III': 29,
  Valorant: 9,
  'Counter-Strike': 6,
  'Heroes of the Storm': 6,
};

/** 문서가 있는 비율 — 「있나」와 「적혔나」는 다른 물음이다 */
export function 문서율(게임, 문서수) {
  const 총 = 한국선수수[게임];
  if (!총) return null;
  return +((100 * 문서수) / 총).toFixed(1);
}

/** ⭐ 이 지면의 결론 — 잰 사람이 한 게임에 얼마나 쏠렸나 */
export function 한게임쏠림(게임들) {
  const 잰것 = 게임들.filter((g) => g.group?.people > 0);
  const 총 = 잰것.reduce((a, g) => a + g.group.people, 0);
  if (!총) return null;
  const 으뜸 = [...잰것].sort((a, b) => b.group.people - a.group.people)[0];
  return {
    game: 으뜸.game,
    people: 으뜸.group.people,
    ofTotal: 총,
    sharePc: +((100 * 으뜸.group.people) / 총).toFixed(1),
    gamesWithAnyone: 잰것.length,
  };
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    if (JSON.stringify(실제) === JSON.stringify(바람)) 통 += 1;
    else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  재본다('문서율 — 스타2 넷이면 0.8%', 문서율('StarCraft II', 4), 0.8);
  재본다('문서율 — LoL 열여섯이면 3.8%', 문서율('League of Legends', 16), 3.8);
  재본다('문서율 — 모르는 게임은 null(0 이 아니다)', 문서율('Nothing', 3), null);
  const 셋 = [
    { game: 'League of Legends', group: { people: 12 } },
    { game: 'StarCraft II', group: { people: 2 } },
    { game: 'Valorant', group: { people: 0 } },
  ];
  재본다('한게임쏠림 — 으뜸 게임', 한게임쏠림(셋).game, 'League of Legends');
  재본다('한게임쏠림 — 몫', 한게임쏠림(셋).sharePc, 85.7);
  재본다('한게임쏠림 — 잰 사람이 있는 게임만 센다', 한게임쏠림(셋).gamesWithAnyone, 2);
  재본다('한게임쏠림 — 아무도 없으면 null',
    한게임쏠림([{ game: 'A', group: { people: 0 } }]), null);
  재본다('한국선수수에 스타2 가 LoL 보다 많다',
    한국선수수['StarCraft II'] > 한국선수수['League of Legends'], true);
  console.log(`게임 갈래 짓는 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  if (!fs.existsSync(원자료)) { console.error(`⛔ 없다 — ${원자료}`); process.exit(1); }
  const d = JSON.parse(fs.readFileSync(원자료, 'utf8'));

  const 줄들 = d.games.map((g) => ({
    game: g.game,
    playersInKorea: 한국선수수[g.game] ?? null,
    withSeaArticle: g.withArticle,
    articleSharePc: 문서율(g.game, g.withArticle),
    measured: g.group.people,
    peakMonth: g.group.tooFew ? null : g.group.month,
    sharingPeak: g.group.tooFew ? null : g.group.sharing,
    sharingPeakPc: g.group.tooFew ? null : g.group.sharingPc,
    medianPeakSharePc: g.group.tooFew ? null : g.group.medianPeakSharePc,
    tooFewToSay: g.group.tooFew,
  })).sort((a, b) => b.measured - a.measured);

  const 쏠림 = 한게임쏠림(d.games);

  const out = {
    generated: 지금(),
    source: d.source,
    unit: d.unit,
    minReadsPerYear: d.minReadsPerYear,
    minPeopleForAGroup: d.minPeopleForAGroup,
    question: 'We called it an esports pattern. Splitting by game shows it was one game.',
    games: 줄들,
    concentration: 쏠림,
    verdict: d.verdict,
    /** 🔴 78편을 좁히는 문장. 지면이 반드시 낸다 */
    narrowsAnEarlierClaim: 'An earlier piece of ours said Korean esports players in these editions '
      + 'peak in a single month. Split by game, almost every one of them turns out to play the same '
      + 'game, so the honest version is narrower: it is a League of Legends pattern, and we could '
      + 'not test whether it holds for any other title.',
    whyOtherGamesCannotBeTested: 'It is not that other games were checked and found different. '
      + 'There were not enough readers to check. Korea has more StarCraft II players on Wikidata '
      + 'than League of Legends players, and four of them have an article in these four editions.',
    cannotAnswer: d.cannotAnswer,
    /** 🔴 이 자료를 만들다 헛일한 것. 다음 사람이 같은 데 안 빠지게 남긴다 */
    howWeFoundTheGame: 'Wikidata records the game in P2416, not in P641. P641 says "esports" for '
      + '1,263 of the 1,266 Korean players, which is true and useless. We spent a run finding that out.',
  };
  fs.writeFileSync(결과, `${JSON.stringify(out, null, 2)}\n`);

  console.log(`⭐ ${결과}`);
  console.log(`   잰 사람의 ${쏠림.sharePc}% 가 ${쏠림.game} — ${쏠림.people}/${쏠림.ofTotal}명\n`);
  console.log('게임'.padEnd(24) + '한국  문서  문서율   잰사람  같은 달');
  for (const g of 줄들) {
    console.log(`${g.game.padEnd(24)}${String(g.playersInKorea ?? '—').padStart(5)}`
      + `${String(g.withSeaArticle).padStart(6)}${String(g.articleSharePc ?? '—').padStart(7)}%`
      + `${String(g.measured).padStart(8)}   `
      + (g.tooFewToSay ? '⛔ 안 말한다' : `${g.sharingPeak}/${g.measured} ${g.peakMonth}월`));
  }
}
