#!/usr/bin/env node
/**
 * build-kcw-quiet-hits.mjs — **「underrated」를 취향이 아니라 자료로 정한다.**
 *
 * ── 왜 (2026-08-22) ────────────────────────────────────────────
 * 사장님: 「왜 너의 커뮤니티인데 케이라이프맵의 커뮤니티 같지? 수정하자...**검색량**」
 * 내 커뮤니티 방이 띠 열둘 + 일간 열이었다 — 사주는 4번(KLifeMap)의 주제다.
 * 그래서 **내 유닛 말로 후보를 만들어 자동완성으로 쟀다.** 그중 방으로 낼 값이 가장 큰 것 —
 * ```
 *  underrated korean drama   자동완성 1번째 · 그 말로 시작하는 제안 9줄
 *    underrated korean drama romance / reddit / list / in netflix / 2025 / 2026 …
 * ```
 * 사람이 이 말을 치는데, **아무도 자료로 답하지 않는다.** 남들은 취향으로 목록을 만든다.
 * 우리는 셀 수 있다 — 넷플릭스 주간 10위, 93개국, 265주.
 *
 * ── 무엇을 「알려지지 않았는데 오래 간 것」으로 보나 ───────────
 * ⛔ 「좋은 작품」이라고 하지 않는다. 그건 우리가 판정할 것이 아니다.
 * ⭐ 두 문턱을 **잰 분포에서** 가져온다. 취향으로 정하지 않는다.
 *   ① 오래 갔다 — 주수가 전체 중간값(6주) 이상
 *   ② 거의 아무도 못 봤다 — 차트에 든 나라가 아래 사분위(2개국) 이하
 * 두 조건을 같이 넘는 것이 「조용히 오래 간 것」이다.
 *
 * ⚠ **차트에 들었다 ≠ 볼 수 있다.** 넷플릭스는 나라별 제공 여부를 안 낸다.
 *   ⚠ **차트에 안 들었다 ≠ 안 봤다.** 주간 10위 밖은 자료가 없다.
 *   ⚠ 한국에서 크게 흥한 작품이 해외 차트에 한 번도 안 들 수 있다.
 *   이 셋을 지면에 그대로 적는다. 안 적으면 이 목록이 「숨은 명작」으로 읽힌다.
 *
 * 쓰는 법
 *   node scripts/build-kcw-quiet-hits.mjs --자가시험
 *   node scripts/build-kcw-quiet-hits.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 자료길 = path.join(뿌리, 'src/data/wikitip-title-pages.json');
const 낼길 = path.join(뿌리, 'src/data/wikitip-quiet-hits.json');

/** 사분위. ⛔ 빈 배열이면 null 이다 — 0 이 아니다 */
export function 사분위(수들, 몫) {
  const a = (수들 ?? []).filter((x) => typeof x === 'number').sort((x, y) => x - y);
  if (!a.length) return null;
  return a[Math.min(a.length - 1, Math.floor(a.length * 몫))];
}

/**
 * 문턱을 **자료에서** 가져온다. 손으로 고른 수를 쓰지 않는다.
 * ⚠ 지면이 있는 것만으로 잰다 — 지면이 없는 374편은 자료 줄이 6줄도 안 되는 것들이다.
 */
export function 문턱정하기(것들) {
  const 주 = 사분위(것들.map((x) => x.weeks), 0.5);
  const 나라 = 사분위(것들.map((x) => x.markets), 0.25);
  return { 오래갔다: 주, 좁았다: 나라 };
}

/** 두 문턱을 같이 넘는 것. ⛔ 못 잰 칸이 있는 것은 넣지 않는다 — 0으로 안 채운다 */
export function 조용한것(것들, 문턱) {
  if (!문턱 || 문턱.오래갔다 == null || 문턱.좁았다 == null) return null;
  return 것들.filter((x) => typeof x.weeks === 'number' && typeof x.markets === 'number')
    .filter((x) => x.weeks >= 문턱.오래갔다 && x.markets <= 문턱.좁았다);
}

if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  검('사분위 중간값', 사분위([1, 2, 3, 4, 5], 0.5) === 3);
  검('사분위 아래', 사분위([1, 2, 3, 4], 0.25) === 2);
  검('⛔ 빈 배열은 null — 0 이 아니다', 사분위([], 0.5) === null);
  검('⛔ 숫자 아닌 칸은 셈에서 뺀다', 사분위([1, null, 3, undefined], 0.5) === 3);

  const 표본 = [
    { title: 'A', weeks: 20, markets: 1 },   // 오래 갔고 좁았다 → 든다
    { title: 'B', weeks: 20, markets: 90 },  // 오래 갔지만 온 세계가 봤다 → 안 든다
    { title: 'C', weeks: 1, markets: 1 },    // 좁았지만 금방 사라졌다 → 안 든다
    { title: 'D', weeks: 6, markets: 2 },    // 딱 문턱 → 든다(경계는 포함)
    { title: 'E', weeks: null, markets: 1 }, // ⛔ 못 잰 것 → 안 든다
  ];
  const 문 = { 오래갔다: 6, 좁았다: 2 };
  const r = 조용한것(표본, 문).map((x) => x.title);
  검('오래 갔고 좁은 것이 든다', r.includes('A'));
  검('⛔ 온 세계가 본 것은 안 든다', !r.includes('B'));
  검('⛔ 금방 사라진 것은 안 든다', !r.includes('C'));
  검('경계는 포함한다', r.includes('D'));
  검('⛔ 못 잰 것은 넣지 않는다 — 0 으로 안 채운다', !r.includes('E'));
  검('문턱이 없으면 null 을 준다', 조용한것(표본, { 오래갔다: null, 좁았다: 2 }) === null);

  const 문2 = 문턱정하기([
    { weeks: 2, markets: 1 }, { weeks: 6, markets: 4 }, { weeks: 10, markets: 30 }, { weeks: 4, markets: 2 },
  ]);
  검('문턱을 자료에서 가져온다', typeof 문2.오래갔다 === 'number' && typeof 문2.좁았다 === 'number');

  if (실패.length) {
    console.error(`❌ 자가시험 실패\n${실패.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log('✅ build-kcw-quiet-hits 자가시험 통과 (11)');
  process.exit(0);
}

const 원 = JSON.parse(fs.readFileSync(자료길, 'utf8'));
const 것들 = 원.titles.filter((x) => x.hasPage);
const 문턱 = 문턱정하기(것들);
const 든것 = 조용한것(것들, 문턱);

if (!든것) { console.error('⛔ 문턱을 못 정했다 — 못 쟀다. 0 으로 안 적는다'); process.exit(1); }

const 낼꼴 = (x) => ({
  title: x.title,
  slug: x.slug,
  type: x.type,
  weeks: x.weeks,
  markets: x.markets,
  peak: x.peak,
  firstWeek: x.firstWeek,
  lastWeek: x.lastWeek,
  /* 어느 나라에서 오래 갔나 — 「거의 아무도」가 누구인지 이름을 대야 한다 */
  where: (x.byMarket ?? []).map((m) => m.name),
});

const tv = 든것.filter((x) => x.type === 'TV').sort((a, b) => b.weeks - a.weeks).map(낼꼴);
const film = 든것.filter((x) => x.type !== 'TV').sort((a, b) => b.weeks - a.weeks).map(낼꼴);

/**
 * ⚠ 가장 좁은 문턱(1개국)만 쓰면 든 것이 22편이다 — 방으로 얇다.
 *   ⛔ 그렇다고 문턱을 손으로 늘리지 않는다. 대신 **나라 수를 띠로 갈라** 다 보여 준다.
 *   선은 그대로 잰 분포에서 온다 — 아래 사분위 1, 중간값 7. 「1개국 / 2개국 / 3~6개국」이다.
 *   ⭐ 좁은 쪽이 앞에 선다. 뒤로 갈수록 「거의 아무도」가 약해지는 것을 손님이 보게 한다.
 */
const 중간나라 = 사분위(것들.map((x) => x.markets), 0.5);
const 오래간것 = 것들.filter((x) => typeof x.weeks === 'number' && x.weeks >= 문턱.오래갔다);
const 띠짓기 = (아래, 위) => 오래간것
  .filter((x) => typeof x.markets === 'number' && x.markets >= 아래 && x.markets <= 위)
  .sort((a, b) => b.weeks - a.weeks).map(낼꼴);
const 띠들 = [
  { from: 1, to: 1, titles: 띠짓기(1, 1) },
  { from: 2, to: 2, titles: 띠짓기(2, 2) },
  { from: 3, to: Math.max(3, 중간나라 - 1), titles: 띠짓기(3, Math.max(3, 중간나라 - 1)) },
];

/* 견줄 반대쪽 — 온 세계가 봤는데 금방 사라진 것. 두 쪽을 같이 놓아야 문턱이 뜻을 갖는다 */
const 넓은문턱 = 사분위(것들.map((x) => x.markets), 0.75);
const 짧은문턱 = 사분위(것들.map((x) => x.weeks), 0.25);
const 반짝 = 것들.filter((x) => x.markets >= 넓은문턱 && x.weeks <= 짧은문턱)
  .sort((a, b) => b.markets - a.markets).slice(0, 12).map(낼꼴);

const 몸 = {
  generated: new Date().toISOString().slice(0, 10),
  whatThisIs: 'Korean titles that stayed on a Netflix weekly top 10 for a long run while charting in '
    + 'very few countries. Both thresholds are taken from the measured distribution of the '
    + 'titles we hold, not chosen by taste.',
  whatThisIsNot: 'Not a quality ranking and not a claim that these are good. Charting is not the same '
    + 'as being available, and not charting is not the same as not being watched — Netflix publishes '
    + 'only the weekly top 10, so a title huge at home can be absent here entirely.',
  source: 원.source,
  weekFrom: 원.weekFrom,
  weekTo: 원.weekTo,
  weekCount: 원.weekCount,
  marketCount: 원.marketCount,
  pagesConsidered: 것들.length,
  thresholds: {
    longRunWeeks: 문턱.오래갔다,
    fewCountries: 문턱.좁았다,
    howChosen: 'longRunWeeks is the median weeks of the titles we publish; fewCountries is the '
      + 'first quartile of the number of countries they charted in.',
    wideCountries: 넓은문턱,
    shortRunWeeks: 짧은문턱,
  },
  counts: {
    tv: tv.length, film: film.length, both: tv.length + film.length, wideAndBrief: 반짝.length,
    inBands: 띠들.reduce((n, b) => n + b.titles.length, 0),
  },
  medianCountries: 중간나라,
  bands: 띠들,
  wideAndBrief: 반짝,
};

fs.writeFileSync(낼길, `${JSON.stringify(몸, null, 1)}\n`);
console.log(`✅ 냈다 — ${path.relative(뿌리, 낼길)}`);
console.log(`   문턱: ${문턱.오래갔다}주 이상 · ${문턱.좁았다}개국 이하 (지면 ${것들.length}장에서 잰 분포)`);
console.log(`   든 것: TV ${tv.length}편 · 영화 ${film.length}편`);
console.log(`   견줄 반대쪽(${넓은문턱}개국 이상 · ${짧은문턱}주 이하): ${반짝.length}편`);
for (const b of 띠들) {
  console.log(`   ${b.from === b.to ? `${b.from}개국` : `${b.from}~${b.to}개국`} · ${문턱.오래갔다}주 이상 → ${b.titles.length}편`);
}
