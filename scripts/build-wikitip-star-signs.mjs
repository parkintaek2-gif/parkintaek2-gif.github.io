#!/usr/bin/env node
/**
 * **띠마다 어느 스타가 있나 — 이름으로.** (`/star-signs`)
 *
 * ⭐⭐ 사장님 지시(8/16·8/20) — 제목과 본문에 **스타의 이름과 소속 그룹명**을 넣는다.
 *    손님은 「Jungkook」과 「BTS」를 친다. 「배우 1,023명」을 안 친다.
 * ⭐ 3번이 한국어판(`100yearmap.com/saju`)을 냈다. 이 지면은 그 **영어판 유입구**다.
 *
 * ── ⛔⛔ 이 지면이 절대 안 하는 것 ───────────────────────────
 * ⛔ **점을 치지 않는다.** 「이 띠라서 떴다」를 한 줄도 안 쓴다 —
 *    우리가 이미 반대를 발행했다: 배우 1,047명의 띠 분포는 **우연과 구분되지 않는다**
 *    (카이제곱 7.77 · 문턱 19.68 · `/zodiac`). 여기서 말을 바꾸면 그 신뢰가 깎인다.
 * ⛔ **사주를 풀지 않는다.** 사주 원국은 태어난 **시**가 있어야 서는데 공개 자료에 시가 없다.
 * ⛔ **1·2월생을 띠로 안 센다.** 음력 설 앞뒤로 띠가 갈린다 — 원본이 그래서 뺐다.
 * ⛔ 이름을 **읽힌 순**으로 세운다. 「많이 읽혔다」는 잰 것이고 「인기」는 잰 것이 아니다.
 *
 * 쓰는 법
 *   node scripts/build-wikitip-star-signs.mjs
 *   node scripts/build-wikitip-star-signs.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 사람길 = path.join(뿌리, 'archive', 'raw', 'wikidata', 'korean-people.json');
export const 배우길 = path.join(뿌리, 'archive', 'raw', 'wikipedia', 'sea-actors.json');
export const 음악길 = path.join(뿌리, 'archive', 'raw', 'wikipedia', 'sea-musicians.json');
export const 띠자료길 = path.join(뿌리, 'src', 'data', 'wikitip-zodiac.json');
export const 낼길 = path.join(뿌리, 'src', 'data', 'wikitip-star-signs.json');

export const 차례 = ['Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake',
  'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig'];

/** 띠마다 몇 이름까지 보일까. ⚠ 화면이 읽히는 길이지 뜻이 있는 수가 아니다 */
export const 보일이름 = 8;

/** ⛔ 못 잰 읽힘을 0 으로 안 센다 — 「안 읽혔다」와 「우리 패널에 없다」는 다르다 */
export function 읽힘붙이기(사람, 읽힘표) {
  const v = 읽힘표.get(사람.q);
  return { ...사람, seaPerMillionTotal: typeof v === 'number' ? v : null };
}

/** 한 띠의 이름들 — 읽힌 순. ⛔ 못 잰 사람은 뒤가 아니라 **아예 목록에서 뺀다** */
export function 띠줄세우기(사람들, 띠, 몇 = 보일이름) {
  const 이것 = 사람들.filter((p) => p.zodiac === 띠 && typeof p.seaPerMillionTotal === 'number');
  이것.sort((a, b) => b.seaPerMillionTotal - a.seaPerMillionTotal);
  return {
    sign: 띠,
    inPanel: 사람들.filter((p) => p.zodiac === 띠).length,
    withReads: 이것.length,
    names: 이것.slice(0, 몇).map((p) => ({
      q: p.q, name: p.name, born: p.born, perMillion: p.seaPerMillionTotal,
    })),
  };
}

/** ⭐ 「이 띠가 더 많이 읽힌다」로 안 읽히게, 띠마다 사람 수를 같이 낸다 */
export function 고른가(줄들) {
  const 수 = 줄들.map((r) => r.inPanel);
  return { min: Math.min(...수), max: Math.max(...수), spread: Math.max(...수) - Math.min(...수) };
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (n, v, w) => {
    const ok = typeof w === 'function' ? w(v) : JSON.stringify(v) === JSON.stringify(w);
    if (ok) 통 += 1; else { 실 += 1; console.error(`  ⛔ ${n}\n     받은 것: ${JSON.stringify(v)}`); }
  };
  재본다('띠는 열둘이다', 차례.length, 12);
  재본다('읽힘을 붙인다', 읽힘붙이기({ q: 'Q1' }, new Map([['Q1', 3.5]])).seaPerMillionTotal, 3.5);
  재본다('⛔⛔ 못 잰 읽힘은 0 이 아니라 null',
    읽힘붙이기({ q: 'Q2' }, new Map()).seaPerMillionTotal, null);

  const 사람들 = [
    { q: 'A', name: 'A', zodiac: 'Rat', seaPerMillionTotal: 5 },
    { q: 'B', name: 'B', zodiac: 'Rat', seaPerMillionTotal: 50 },
    { q: 'C', name: 'C', zodiac: 'Rat', seaPerMillionTotal: null },
    { q: 'D', name: 'D', zodiac: 'Ox', seaPerMillionTotal: 1 },
  ];
  const r = 띠줄세우기(사람들, 'Rat');
  재본다('⭐ 많이 읽힌 이름이 앞에 온다', r.names.map((x) => x.name), ['B', 'A']);
  재본다('⛔ 못 잰 사람은 목록에서 뺀다', r.names.some((x) => x.name === 'C'), false);
  재본다('⛔ 그래도 그 사람이 띠에 있다는 것은 센다', [r.inPanel, r.withReads], [3, 2]);
  재본다('보일 수를 지킨다', 띠줄세우기(사람들, 'Rat', 1).names.length, 1);

  const 고름 = 고른가([{ inPanel: 3 }, { inPanel: 1 }]);
  재본다('⭐ 띠마다 사람 수가 얼마나 다른지 낸다', [고름.min, 고름.max, 고름.spread], [1, 3, 2]);

  재본다('⭐ 원본이 있다', [사람길, 배우길, 음악길, 띠자료길].every((p) => fs.existsSync(p)), true);
  console.log(`띠마다 이름을 세우는 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  const 원 = JSON.parse(fs.readFileSync(사람길, 'utf8'));
  const 띠자료 = JSON.parse(fs.readFileSync(띠자료길, 'utf8'));
  const 읽힘표 = new Map();
  for (const 길 of [배우길, 음악길]) {
    for (const p of JSON.parse(fs.readFileSync(길, 'utf8')).people ?? []) {
      if (typeof p.seaPerMillionTotal === 'number') 읽힘표.set(p.q, p.seaPerMillionTotal);
    }
  }
  const 사람들 = 원.사람.filter((p) => p.zodiac).map((p) => 읽힘붙이기(p, 읽힘표));
  const 줄들 = 차례.map((t) => 띠줄세우기(사람들, t));

  const 자료 = {
    generated: 원.갱신?.slice(0, 10) ?? null,
    source: 'Birth dates from Wikidata (CC0). Reads from the Wikimedia Pageviews API, human '
      + 'traffic only, across the Indonesian, Vietnamese, Thai and Malay Wikipedias.',
    window: '2025-08 through 2026-07, 12 months',
    question: 'Which Korean stars were born in your Chinese zodiac year?',
    signs: 차례,
    peopleWithSign: 사람들.length,
    withReads: 사람들.filter((p) => typeof p.seaPerMillionTotal === 'number').length,
    rows: 줄들,
    evenness: 고른가(줄들),
    /** 🔴 이 지면의 뼈대. 재미로 보되 **점으로 읽히지 않게** 못을 박는다 */
    notAForecast: 'This is a list of birthdays, not a reading. We tested whether the zodiac year '
      + `picks out who reaches a Netflix chart and it does not: across ${띠자료.withZodiac} `
      + `Korean actors the chi-square statistic was ${띠자료.chiSquare} against a threshold of `
      + `${띠자료.chiSquareThreshold}, which is indistinguishable from chance. Nothing on this `
      + 'page says a sign made anyone successful, because our own measurement says it did not.',
    whyNoSaju: 띠자료.whyNoIndividualReading,
    whyJanFebExcluded: 띠자료.whyJanFebExcluded,
    orderIsReads: 'Within each sign the names are ordered by how often their Wikipedia articles '
      + 'were opened in the four Southeast Asian editions, per million reads of each edition. '
      + 'That is a measure of being looked up, not of popularity, and a star we could not measure '
      + 'is left out of the list rather than placed last.',
    cannotSay: [
      'Not a forecast. A birth year is not a prediction, and we measured that it does not pick '
        + 'out who charts.',
      'Not a full saju. The four pillars need the hour of birth, and public profiles almost never '
        + 'carry it.',
      'Not popularity. The order inside each sign counts encyclopaedia article opens.',
    ],
  };
  fs.writeFileSync(낼길, `${JSON.stringify(자료, null, 1)}\n`);

  console.log(`띠 붙은 사람 ${자료.peopleWithSign} · 그중 읽힘 잰 사람 ${자료.withReads}`);
  for (const r of 줄들) {
    console.log(`   ${r.sign.padEnd(8)} ${String(r.inPanel).padStart(4)}명 (읽힘 ${String(r.withReads).padStart(3)})  `
      + r.names.slice(0, 4).map((n) => n.name).join(' · '));
  }
  console.log(`\n띠마다 사람 수 ${자료.evenness.min}~${자료.evenness.max}`);
  console.log(`자료 → ${path.relative(뿌리, 낼길)}`);
}
