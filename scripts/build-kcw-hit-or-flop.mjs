#!/usr/bin/env node
/**
 * build-kcw-hit-or-flop.mjs — **「<작품> hit or flop」에 답하는 자리를 만든다.** (`/hit-or-flop`)
 *
 * ── 왜 (2026-08-29) ───────────────────────────────────────────
 * 사장님 지시 — 「**영상만 하지말고, 텍스트 콘텐트를 만들어서 검색엔진 통해서 우리 쪽으로
 * 방문하게 해**」·「**인기 검색어는 스타 이름·작품명·노래제목이다**」.
 *
 * 🔴 **잰 수요** — Search Console 실측(2026-08-26 창)에서 `hit or flop` 을 붙여 물어본
 * 질의가 **아홉 개**였다. 노출 15회, 자리는 4~10위.
 * ```
 *   confidential assignment 2 international hit or flop   3회  7위
 *   our blues hit or flop                                 2회  4위
 *   a model family hit or flop                            2회 10위
 *   concrete utopia hit or flop                           2회 10위
 *   extraordinary you hit or flop                         2회 10위
 *   dali and cocky prince / delightfully deceitful /
 *   the childe / to my beloved thief                    각 1회
 * ```
 * ⚠ 우리 2,700여 장 가운데 **그 물음 «모양»에 답하는 지면이 하나도 없다.** 작품별 지면은
 *   수를 보여 주지만, 「그래서 이게 큰 건가」에는 답하지 않는다 — 견줄 «분포»가 없어서다.
 *
 * ── ⛔ 이 지면이 «하지 않는» 것 — 회사 강령 그대로 ────────────
 * 「hit」·「flop」은 **판정어**다. 우리는 판정하지 않는다.
 * ```
 *   ⛔ 「이건 flop 이다」          우리가 값어치를 매기는 것이다. 자격이 없다
 *   ✅ 「974편 중 N편이 더 넓게 갔다」  사실이다. 판단은 읽는 사람이 한다
 * ```
 * ⭐ 그래서 이 지면이 주는 것은 **자리**다 — 한 작품이 974편의 분포 «어디»에 있는지.
 *   평균을 규범으로 만들지 않는다. 「가운데가 정상」이라고 적지 않는다.
 *
 * ── ⛔ 이 자가 지키는 것 ──────────────────────────────────────
 * ⛔ 못 찾은 작품을 «찾은 척» 하지 않는다 — `notFound` 로 이름과 «왜 없는지»를 남긴다.
 * ⛔ 차트 자리를 시청시간·매출·관객수로 부르지 않는다. 넷플릭스는 그것을 안 낸다.
 * ⛔ 못 잰 칸을 0 으로 안 채운다. 그 자에서만 뺀다.
 * ⚠ 이 자료로는 **극장 성적·제작비·수익을 못 잰다.** 「hit/flop」이 보통 뜻하는 것이
 *   바로 그것이다 — 그래서 지면이 스스로 「우리는 그걸 못 잰다」고 적는다.
 *
 * 쓰는 법
 *   node scripts/build-kcw-hit-or-flop.mjs --자가시험
 *   node scripts/build-kcw-hit-or-flop.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 자료길 = path.join(뿌리, 'src/data/wikitip-title-pages.json');
const 질의길 = path.join(뿌리, 'src/data/gsc-kcw-2026-08-26.json');
const 모호길 = path.join(뿌리, 'src/data/wikitip-title-ambiguity.json');
const 낼길 = path.join(뿌리, 'src/data/kcw-hit-or-flop.json');

/* ── 자 ───────────────────────────────────────────────────── */

/** 견주려고 이름을 고른다. ⛔ 글자를 «지우지» 않는다 — 눌러 붙일 뿐이다 */
export function 이름고르기(s) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/[‘’“”]/g, "'")
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** 질의에서 「hit or flop」을 떼고 작품 이름만 남긴다 */
export function 질의에서작품(q) {
  const t = String(q ?? '').replace(/\b(hit or flop|flop or hit|hit\/flop)\b/gi, ' ');
  return t.replace(/\s+/g, ' ').trim();
}

/**
 * 백분위 — 이 값보다 «작은» 것이 전체의 몇 %인가.
 * ⛔ 값이 없으면 null. 0 이 아니다 — 0 은 「꼴찌」라는 «판정»이 된다.
 */
export function 백분위(값, 다) {
  if (!Number.isFinite(값)) return null;
  const v = (다 ?? []).filter(Number.isFinite);
  if (!v.length) return null;
  const 아래 = v.filter((x) => x < 값).length;
  return Math.round((아래 / v.length) * 100);
}

/** 나눈 자리들. ⛔ 빈 것은 null */
export function 분위수(다, 몫) {
  const v = (다 ?? []).filter(Number.isFinite).sort((a, b) => a - b);
  if (!v.length) return null;
  const i = Math.min(v.length - 1, Math.max(0, Math.round((몫 / 100) * (v.length - 1))));
  return v[i];
}

/**
 * 띠를 나눈다 — 평균 하나가 아니라 «분포»를 보인다.
 * ⛔ 「가운데가 정상」이라고 읽히지 않게, 띠마다 편수를 그대로 적는다.
 */
export function 띠나누기(다, 경계, 재기) {
  const v = (다 ?? []).map(재기).filter(Number.isFinite);
  const 띠 = [];
  for (let i = 0; i < 경계.length; i += 1) {
    const 아래 = 경계[i];
    const 위 = i + 1 < 경계.length ? 경계[i + 1] - 1 : Infinity;
    const n = v.filter((x) => x >= 아래 && x <= 위).length;
    띠.push({
      from: 아래,
      to: Number.isFinite(위) ? 위 : null,
      label: 아래 === 위 ? String(아래) : Number.isFinite(위) ? `${아래}–${위}` : `${아래}+`,
      titles: n,
      pct: v.length ? Math.round((n / v.length) * 100) : null,
    });
  }
  return { total: v.length, bands: 띠 };
}

/**
 * 물어본 작품을 우리 표에서 찾는다.
 * ⛔ 비슷한 것으로 «때우지» 않는다. 이름이 그대로 맞을 때만 찾은 것으로 친다.
 */
export function 찾기(이름, 표) {
  const k = 이름고르기(이름);
  if (!k) return null;
  return 표.get(k) ?? null;
}

/**
 * 🔴 「1위」가 실제로 무엇을 가르나.
 *   어디선가 1위인데 «그 나라가 유일한» 작품 — 「넷플릭스 1위」라는 말이 가장 크게
 *   흔들리는 자리다. ⛔ 이것을 「과장」이라고 부르지 않는다. 세어서 보일 뿐이다.
 */
export function 일위인데한나라뿐(작품들) {
  const 다 = (작품들 ?? []).filter((t) => t && Number.isFinite(t.markets));
  const 일위 = 다.filter((t) => t.peak === 1);
  const 겹침 = 일위.filter((t) => t.markets === 1);
  return {
    everNumberOne: 일위.length,
    numberOneInItsOnlyCountry: 겹침.length,
    shareOfNumberOnes: 일위.length ? Math.round((겹침.length / 일위.length) * 100) : null,
  };
}

/** 몇 나라 이상 간 편수. ⛔ 못 잰 것은 세지 않는다 */
export function 이상간편수(작품들, 나라) {
  return (작품들 ?? []).filter((t) => Number.isFinite(t?.markets) && t.markets >= 나라).length;
}

/* ── 자가시험 ─────────────────────────────────────────────── */
if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  검('이름을 눌러 붙인다', 이름고르기('Our Blues!') === 'our blues');
  검('& 를 and 로 읽는다', 이름고르기('Dali & Cocky Prince') === 'dali and cocky prince');
  검('굽은 따옴표도 같게 본다', 이름고르기('The King’s Affection') === 'the king s affection');
  검('⛔ 빈 것도 안 터진다', 이름고르기(undefined) === '' && 이름고르기(null) === '');

  검('질의에서 hit or flop 을 뗀다', 질의에서작품('our blues hit or flop') === 'our blues');
  검('가운데 있어도 뗀다', 질의에서작품('confidential assignment 2 international hit or flop')
    === 'confidential assignment 2 international');
  검('없으면 그대로 둔다', 질의에서작품('decision to leave netflix country')
    === 'decision to leave netflix country');

  const 다 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  검('백분위 — 가운데', 백분위(6, 다) === 50);
  검('백분위 — 맨 아래는 0', 백분위(1, 다) === 0);
  검('⛔ 값이 없으면 null 이지 0 이 아니다', 백분위(null, 다) === null && 백분위(undefined, 다) === null);
  검('⛔ 견줄 것이 없으면 null', 백분위(3, []) === null);
  검('분위수', 분위수(다, 50) === 6 && 분위수(다, 0) === 1 && 분위수(다, 100) === 10);
  검('⛔ 빈 분위수는 null', 분위수([], 50) === null);

  const 표본 = [{ m: 1 }, { m: 1 }, { m: 3 }, { m: 7 }, { m: 60 }];
  const 띠 = 띠나누기(표본, [1, 2, 5, 10], (t) => t.m);
  검('띠 수가 맞는다', 띠.total === 5 && 띠.bands.length === 4);
  검('한 나라뿐이 둘', 띠.bands[0].titles === 2 && 띠.bands[0].label === '1');
  검('마지막 띠는 열린 띠', 띠.bands[3].label === '10+' && 띠.bands[3].titles === 1);
  검('⛔ 못 잰 것은 세지 않는다', 띠나누기([{ m: null }, { m: 4 }], [1, 5], (t) => t.m).total === 1);

  const 겹 = [{ peak: 1, markets: 1 }, { peak: 1, markets: 9 }, { peak: 3, markets: 1 },
    { peak: 1, markets: null }];
  const 겹결과 = 일위인데한나라뿐(겹);
  검('🔴 1위인데 한 나라뿐인 것을 센다', 겹결과.numberOneInItsOnlyCountry === 1);
  검('⛔ 못 잰 나라 수는 세지 않는다', 겹결과.everNumberOne === 2);
  검('1위 중 몫을 낸다', 겹결과.shareOfNumberOnes === 50);
  검('⛔ 1위가 없으면 몫은 null 이지 0 이 아니다',
    일위인데한나라뿐([{ peak: 4, markets: 2 }]).shareOfNumberOnes === null);
  검('⛔ 빈 것도 안 터진다', 일위인데한나라뿐(undefined).everNumberOne === 0);
  검('몇 나라 이상을 센다', 이상간편수(겹, 5) === 1);
  검('⛔ 못 잰 것은 안 센다', 이상간편수([{ markets: null }], 1) === 0);

  const 표 = new Map([['our blues', { title: 'Our Blues', markets: 9 }]]);
  검('이름이 맞으면 찾는다', 찾기('Our Blues', 표).markets === 9);
  검('⛔ 비슷한 것으로 때우지 않는다', 찾기('Our Blue', 표) === null);

  if (실패.length) {
    console.error(`❌ 자가시험 실패 ${실패.length}\n${실패.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log('✅ build-kcw-hit-or-flop 자가시험 통과 (27)');
  process.exit(0);
}

/* 🔴 우리 도구는 작품마다 「이름만으로 한국 작품이라 가릴 수 있나」를 이미 재 두었다.
 *   그런데 그 판정이 지면에는 안 실린다 — 손님은 974편이 다 한국 것인 줄 안다.
 *   ⛔ 판정을 숨기지 않는다. 「못 가른다」도 결과다. */
const 모호 = new Map();
try {
  for (const x of JSON.parse(fs.readFileSync(모호길, 'utf8')).perTitle ?? []) {
    모호.set(이름고르기(x.title), { verdict: x.verdict, countries: x.countries ?? [] });
  }
} catch { /* ⛔ 못 읽으면 판정 칸을 «비운다». 지어내지 않는다 */ }
export function 판정칸(제목) {
  const v = 모호.get(이름고르기(제목));
  if (!v) return { koreanVerdict: null, wikidataCountries: null };
  return { koreanVerdict: v.verdict, wikidataCountries: v.countries };
}

/* ── 짓는다 ───────────────────────────────────────────────── */
const 원 = JSON.parse(fs.readFileSync(자료길, 'utf8'));
const 작품들 = 원.titles ?? [];
if (작품들.length < 100) {
  console.error(`🔴 못 짓는다 — 작품이 ${작품들.length}편뿐이다. 자료를 먼저 다시 모은다.`);
  process.exit(1);
}

const 색인 = new Map();
for (const t of 작품들) {
  const k = 이름고르기(t.title);
  if (k && !색인.has(k)) 색인.set(k, t);
  for (const s of t.otherSpellings ?? []) {
    const k2 = 이름고르기(s);
    if (k2 && !색인.has(k2)) 색인.set(k2, t);
  }
}

/* 🔴 물어본 작품은 «내가 고른» 것이 아니라 Search Console 실측에서 나온 것이다 */
const 질의 = JSON.parse(fs.readFileSync(질의길, 'utf8')).rows ?? [];
const 물음들 = 질의
  .filter((r) => /\bflop\b/i.test(r.key))
  .sort((a, b) => b.impressions - a.impressions);

const 나라들 = 작품들.map((t) => t.markets);
const 주들 = 작품들.map((t) => t.weeks);
const 자리들 = 작품들.map((t) => t.places);

const 물음 = 물음들.map((r) => {
  const 이름 = 질의에서작품(r.key);
  const t = 찾기(이름, 색인);
  if (!t) {
    return {
      asked: r.key, name: 이름, impressions: r.impressions, position: r.position,
      found: false,
      whyNot: 'We hold no chart row under this name. Either it never entered a country weekly '
        + 'top 10 in the weeks we hold, or Netflix listed it under a different name.',
    };
  }
  return {
    asked: r.key, name: 이름, impressions: r.impressions, position: r.position,
    found: true,
    title: t.title, slug: t.slug, hasPage: !!t.hasPage, type: t.type,
    markets: t.markets, weeks: t.weeks, places: t.places, peak: t.peak,
    firstWeek: t.firstWeek, lastWeek: t.lastWeek, atOnce: t.atOnce,
    pctCountries: 백분위(t.markets, 나라들),
    pctWeeks: 백분위(t.weeks, 주들),
    pctPlaces: 백분위(t.places, 자리들),
    ...판정칸(t.title),
  };
});

const 낼것 = {
  generated: new Date().toISOString().slice(0, 10),
  source: 원.source,
  weekFrom: 원.weekFrom,
  weekTo: 원.weekTo,
  weekCount: 원.weekCount,
  marketCount: 원.marketCount,
  unit: 원.unit,
  titleCount: 작품들.length,

  /* ⛔ 이 지면이 못 답하는 것 — 지면에 그대로 찍는다 */
  cannotAnswer: [
    'Whether a title made or lost money. Netflix publishes no budget, no revenue and no '
      + 'per-country viewing hours, so nothing here is a profit or loss statement.',
    'Cinema admissions or box office. Several of these titles opened in theatres first; '
      + 'that run is not in this data at all.',
    'How much of a country watched it. A chart place is a rank against other titles that '
      + 'week in that country, not an audience count.',
    'Titles that never entered any country weekly top 10. They leave no row, so we cannot '
      + 'tell "small" apart from "absent".',
  ],

  distribution: {
    countries: {
      ...띠나누기(작품들, [1, 2, 5, 10, 25, 50], (t) => t.markets),
      p50: 분위수(나라들, 50), p90: 분위수(나라들, 90), p99: 분위수(나라들, 99),
      max: Math.max(...나라들.filter(Number.isFinite)),
    },
    weeks: {
      ...띠나누기(작품들, [1, 2, 4, 9, 21], (t) => t.weeks),
      p50: 분위수(주들, 50), p90: 분위수(주들, 90), p99: 분위수(주들, 99),
      max: Math.max(...주들.filter(Number.isFinite)),
    },
  },

  everNumberOne: 작품들.filter((t) => t.peak === 1).length,
  /* 🔴 「넷플릭스 1위」라는 말이 가장 크게 흔들리는 자리 — 세어서 보인다 */
  ...일위인데한나라뿐(작품들),
  reached50: 이상간편수(작품들, 50),
  reached5: 이상간편수(작품들, 5),
  oneCountryOnly: 작품들.filter((t) => t.markets === 1).length,
  oneWeekOnly: 작품들.filter((t) => t.weeks === 1).length,
  oneCountryOneWeek: 작품들.filter((t) => t.markets === 1 && t.weeks === 1).length,

  asked: 물음,
  askedFound: 물음.filter((x) => x.found).length,
  askedMissing: 물음.filter((x) => !x.found).length,

  widest: [...작품들].filter((t) => Number.isFinite(t.markets))
    .sort((a, b) => b.markets - a.markets || b.weeks - a.weeks).slice(0, 15)
    .map((t) => ({ title: t.title, slug: t.slug, hasPage: !!t.hasPage, type: t.type,
      markets: t.markets, weeks: t.weeks, peak: t.peak })),
};

fs.writeFileSync(낼길, `${JSON.stringify(낼것, null, 2)}\n`);

console.log('■ /hit-or-flop 자료를 지었다');
console.log(`   작품 ${낼것.titleCount}편 · ${낼것.weekCount}주 · ${낼것.marketCount}나라`);
console.log(`   물어본 작품 ${물음.length}개 중 ✅ 찾음 ${낼것.askedFound} · ⬜ 못 찾음 ${낼것.askedMissing}`);
for (const x of 물음) {
  console.log(x.found
    ? `   ✅ ${x.name} — ${x.markets}나라 ${x.weeks}주 (나라 ${x.pctCountries}%지점)`
    : `   ⬜ ${x.name} — 우리 표에 줄이 없다`);
}
console.log(`   한 나라 한 주뿐 ${낼것.oneCountryOneWeek}편 · 어디선가 1위 ${낼것.everNumberOne}편`);
console.log(`   🔴 1위인데 그 나라가 «유일»한 것 ${낼것.numberOneInItsOnlyCountry}편`
  + ` — 1위 다섯 중 ${Math.round((낼것.shareOfNumberOnes ?? 0) / 20)}쯤(${낼것.shareOfNumberOnes}%)`);
console.log(`   50개국 이상 ${낼것.reached50}편 · 5개국 이상 ${낼것.reached5}편`);
console.log(`   ⛔ 「hit」·「flop」을 우리가 정하지 않는다 — 분포에서 «자리»만 보인다`);
console.log(`\n✔ ${path.relative(뿌리, 낼길)}`);
