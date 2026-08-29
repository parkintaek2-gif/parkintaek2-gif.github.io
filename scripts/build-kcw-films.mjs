#!/usr/bin/env node
/**
 * build-kcw-films.mjs — **「Korean movies on Netflix」에 답하는 자리를 만든다.** (`/korean-movies-on-netflix`)
 *
 * ── 왜 (2026-08-29) ───────────────────────────────────────────
 * 사장님 지시 — 「**영상만 하지말고, 텍스트 콘텐트를 만들어서 검색엔진 통해서 우리 쪽으로
 * 방문하게 해. 색인 잊지말고.**」
 *
 * 잰 수요 — `korean movies on netflix` 자동완성 1번째 · 제안 10줄.
 * 그런데 우리 2,723장 가운데 **그 물음에 답하는 제목이 한 장도 없었다.**
 * `/most-popular` 도 `/netflix-top-10-korean-drama` 도 다 **드라마** 이야기다.
 * ⚠ 영화 줄은 이미 쥐고 있었다. 안 쓰던 축이었을 뿐이다.
 *
 * ── 🔴 재서 알아낸 것 (실측) ──────────────────────────────────
 * ```
 *                     편수    가운데 나라   가운데 주   한 나라뿐   한 주뿐
 *   영화              577         1          3        328(57%)   118
 *   시리즈            396         5          6        119(30%)    37
 * ```
 * ⭐ **영화가 시리즈보다 «많이» 차트에 오른다. 그런데 한 편이 가는 거리는 훨씬 짧다.**
 *   목록은 넓고 얇다 — 이것이 이 지면이 말하는 것이다.
 * ⛔ 「영화가 시리즈보다 못하다」로 쓰지 않는다. 우리는 값어치를 판정하지 않는다.
 *   ⚠ 극장 개봉작이 뒤늦게 넷플릭스에 실린 것과, 넷플릭스가 처음부터 낸 것이
 *     한 표에 섞여 있다. 우리 자료로는 못 가른다 — 그래서 지면에 그렇게 적는다.
 *
 * ── ⛔ 이 자가 지키는 것 ──────────────────────────────────────
 * ⛔ 「best」·「must watch」를 안 쓴다. 차트에 얼마나 넓게·오래 있었나만 말한다.
 * ⛔ 차트 자리를 시청시간으로 부르지 않는다. 넷플릭스는 나라별 시청시간을 안 낸다.
 * ⛔ 못 잰 칸을 0 으로 안 채운다.
 * ⛔ 지면이 없는 작품은 목록에 이름만 남기고 **링크를 걸지 않는다** — 죽은 링크를 안 만든다.
 *
 * 쓰는 법
 *   node scripts/build-kcw-films.mjs --자가시험
 *   node scripts/build-kcw-films.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 자료길 = path.join(뿌리, 'src/data/wikitip-title-pages.json');
const 낼길 = path.join(뿌리, 'src/data/kcw-films.json');

/** 목록에 몇 편씩 보일까 */
export const 목록길이 = 25;

/** 가운데값. ⛔ 빈 것은 0 이 아니라 null */
export function 가운데값(값들) {
  const v = (값들 ?? []).filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return null;
  return v.length % 2 ? v[(v.length - 1) / 2] : (v[v.length / 2 - 1] + v[v.length / 2]) / 2;
}

/**
 * 한 갈래의 «생김새»를 잰다.
 * ⛔ 못 잰 칸이 있는 작품을 0 으로 세지 않는다 — 그 자에서만 뺀다.
 */
export function 생김새(작품들) {
  const 다 = 작품들 ?? [];
  if (!다.length) return null;
  return {
    titles: 다.length,
    published: 다.filter((t) => t.hasPage).length,
    medianCountries: 가운데값(다.map((t) => t.markets)),
    medianWeeks: 가운데값(다.map((t) => t.weeks)),
    medianPlaces: 가운데값(다.map((t) => t.places)),
    oneCountryOnly: 다.filter((t) => t.markets === 1).length,
    oneWeekOnly: 다.filter((t) => t.weeks === 1).length,
    everNumberOne: 다.filter((t) => t.peak === 1).length,
  };
}

/**
 * 한 자로 상위 N. ⛔ 그 자를 «못 잰» 작품은 아예 줄에서 뺀다 — 0 으로 놓고 꼴찌 시키지 않는다.
 * ⚠ 지면이 없는 작품도 목록에는 넣는다. 없는 척하는 것이 더 나쁘다. 링크만 안 건다.
 */
export function 상위(작품들, 재기, n = 목록길이) {
  return (작품들 ?? [])
    .map((t) => ({ t, v: 재기(t) }))
    .filter((x) => Number.isFinite(x.v))
    .sort((a, b) => (b.v - a.v) || String(a.t.title).localeCompare(String(b.t.title)))
    .slice(0, n)
    .map((x) => ({
      title: x.t.title,
      slug: x.t.hasPage ? x.t.slug : null,   /* ⛔ 지면이 없으면 링크를 안 건다 */
      countries: x.t.markets,
      weeks: x.t.weeks,
      places: x.t.places,
      firstWeek: x.t.firstWeek,
      lastWeek: x.t.lastWeek,
      atOnce: Number.isFinite(x.t.atOnce) ? x.t.atOnce : null,
    }));
}

/** 해마다 몇 편이 처음 차트에 들었나 — 「해마다 얼마나 나오나」에 답한다 */
export function 해마다(작품들) {
  const 셈 = new Map();
  for (const t of 작품들 ?? []) {
    if (typeof t.firstWeek !== 'string' || t.firstWeek.length < 4) continue;  /* 못 쟀다 */
    const y = t.firstWeek.slice(0, 4);
    셈.set(y, (셈.get(y) ?? 0) + 1);
  }
  return [...셈].sort((a, b) => a[0].localeCompare(b[0])).map(([year, titles]) => ({ year: +year, titles }));
}

if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  검('가운데값 홀수', 가운데값([3, 1, 2]) === 2);
  검('가운데값 짝수', 가운데값([1, 2, 3, 4]) === 2.5);
  검('⛔ 빈 것은 null — 0 이 아니다', 가운데값([]) === null && 가운데값(undefined) === null);
  검('⛔ 숫자 아닌 칸은 빼고 센다', 가운데값([1, null, 3, undefined]) === 2);

  const 표본 = [
    { title: 'A', slug: 'a', hasPage: true, markets: 10, weeks: 5, places: 30, peak: 1, firstWeek: '2023-01-01', lastWeek: '2023-02-05', atOnce: 8 },
    { title: 'B', slug: 'b', hasPage: false, markets: 1, weeks: 1, places: 1, peak: 7, firstWeek: '2024-06-02', lastWeek: '2024-06-02', atOnce: 1 },
    { title: 'C', slug: 'c', hasPage: true, markets: 1, weeks: 3, places: 3, peak: 1, firstWeek: '2024-07-07', lastWeek: '2024-07-21', atOnce: 1 },
    { title: 'D', slug: 'd', hasPage: true, weeks: 9, places: 9, peak: 4, firstWeek: '2025-01-05', lastWeek: '2025-03-02', atOnce: 1 },
  ];

  const g = 생김새(표본);
  검('편수를 센다', g.titles === 4);
  검('지면 있는 것만 따로 센다', g.published === 3);
  검('한 나라뿐인 것을 센다', g.oneCountryOnly === 2);
  검('한 주뿐인 것을 센다', g.oneWeekOnly === 1);
  검('1위 경험을 센다', g.everNumberOne === 2);
  검('⛔ 나라 수를 못 잰 D 는 가운데값에서 빠진다', g.medianCountries === 1);
  검('⛔ 빈 목록은 null', 생김새([]) === null);

  const 넓 = 상위(표본, (t) => t.markets, 3);
  검('큰 것이 앞', 넓[0].title === 'A');
  검('⛔ 못 잰 D 는 이 줄에서 빠진다', !넓.some((x) => x.title === 'D'));
  검('세 개만', 넓.length === 3);
  검('⛔ 지면 없는 것은 링크를 안 건다', 넓.find((x) => x.title === 'B').slug === null);
  검('지면 있는 것은 주소가 있다', 넓.find((x) => x.title === 'A').slug === 'a');
  검('같은 값이면 이름 순 — 답이 매번 같아야 한다',
    상위([{ title: 'Z', slug: 'z', hasPage: true, markets: 5 }, { title: 'Y', slug: 'y', hasPage: true, markets: 5 }],
      (t) => t.markets)[0].title === 'Y');

  const 해 = 해마다(표본);
  검('해마다 센다', 해.length === 3 && 해[1].year === 2024 && 해[1].titles === 2);
  검('⛔ 첫 주를 못 잰 것은 어느 해에도 안 넣는다',
    해마다([{ firstWeek: null }, { firstWeek: '2023-01-01' }]).length === 1);
  검('⛔ 빈 것도 안 터진다',
    해마다(undefined).length === 0 && 상위(undefined, (t) => t.markets).length === 0);

  if (실패.length) {
    console.error(`❌ 자가시험 실패 ${실패.length}\n${실패.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log('✅ build-kcw-films 자가시험 통과 (21)');
  process.exit(0);
}

const 원 = JSON.parse(fs.readFileSync(자료길, 'utf8'));
const 영화 = 원.titles.filter((t) => t.type === 'Films');
const 시리즈 = 원.titles.filter((t) => t.type === 'TV');

if (!영화.length) throw new Error('영화가 하나도 안 잡혔다 — 자를 먼저 의심한다');

const 낼것 = {
  generated: new Date().toISOString(),
  source: 원.source,
  weekFrom: 원.weekFrom,
  weekTo: 원.weekTo,
  marketCount: 원.marketCount,
  unit: 원.unit,
  cannotAnswer: 원.cannotAnswer,
  /**
   * ⚠ 지면이 스스로 말해야 하는 한계. 우리 자료에는 「극장에서 먼저 걸린 영화」와
   *   「넷플릭스가 처음부터 낸 영화」를 가르는 칸이 없다. 한 표에 섞여 있다.
   */
  notSeparated: 'Our rows do not say whether a film opened in cinemas first or went straight to '
    + 'Netflix. Both sit in the same table here, because we cannot tell them apart from what we hold.',
  films: 생김새(영화),
  series: 생김새(시리즈),
  byYear: 해마다(영화),
  widest: 상위(영화, (t) => t.markets),
  longest: 상위(영화, (t) => t.weeks),
  mostPlaces: 상위(영화, (t) => t.places),
};

/* ── 스스로 본다 ── */
if (낼것.films.titles < 100) throw new Error(`영화가 ${낼것.films.titles}편뿐이다 — 자를 의심한다`);
if (!낼것.widest.length || !낼것.longest.length) throw new Error('목록이 비었다');
for (const 줄 of [...낼것.widest, ...낼것.longest, ...낼것.mostPlaces]) {
  if (Number.isFinite(줄.countries) && 줄.countries > 원.marketCount) {
    throw new Error(`${줄.title}: 나라 수가 ${원.marketCount} 를 넘는다`);
  }
  if (Number.isFinite(줄.atOnce) && Number.isFinite(줄.countries) && 줄.atOnce > 줄.countries) {
    throw new Error(`${줄.title}: 한 주 넓이가 전체 나라 수보다 크다`);
  }
}

fs.writeFileSync(낼길, `${JSON.stringify(낼것, null, 1)}\n`);

console.log('■ 한국 영화가 넷플릭스 주간 top 10 에 오른 자취\n');
const 줄 = (이름, g) => console.log(`   ${이름.padEnd(8)} ${String(g.titles).padStart(4)}편`
  + ` · 지면 ${String(g.published).padStart(3)}장`
  + ` · 가운데 ${String(g.medianCountries).padStart(2)}나라 ${String(g.medianWeeks).padStart(2)}주 ${String(g.medianPlaces).padStart(3)}자리`
  + ` · 한 나라뿐 ${String(g.oneCountryOnly).padStart(3)}편 · 한 주뿐 ${String(g.oneWeekOnly).padStart(3)}편`);
줄('영화', 낼것.films);
줄('시리즈', 낼것.series);
console.log(`\n   ⭐ 영화가 ${낼것.films.titles - 낼것.series.titles}편 «더» 올랐는데,`
  + ` 한 편이 닿는 나라는 가운데값으로 ${낼것.films.medianCountries} 대 ${낼것.series.medianCountries} 다.`);
console.log(`   → ${낼길}`);
