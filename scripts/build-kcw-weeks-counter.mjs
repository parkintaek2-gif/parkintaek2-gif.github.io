#!/usr/bin/env node
/**
 * build-kcw-weeks-counter.mjs — **넷플릭스가 싣는 「몇 주째」가 무엇을 세나.**
 *
 * ── 🔴 왜 재나 (2026-09-03) ─────────────────────────────────
 * 나라별 표의 모든 줄에 `누적주`(weeks in top 10)가 붙어 있다. 우리는 그 칸을 세 자에서
 * 쓰면서도 **그것이 무엇을 세는지 확인한 적이 없다.**
 * ```
 *   연속으로 있던 주만 세나?      틈이 생기면 1 로 돌아가나?
 *   아니면 누적으로 계속 세나?    나라별인가 세계 기준인가?
 * ```
 * ⛔ 「몇 주째」를 우리 기사에서 쓰는데 그 뜻을 모르면, 우리가 그 수를 «해석»해 버린 것이다.
 *   우리 매체는 원자료를 가공해 파는 곳이고, 원자료 칸의 뜻은 우리가 확인할 몫이다.
 *
 * ── 무엇을 잰다 ─────────────────────────────────────────────
 * 한 칸(나라·차트·제목·시즌)의 줄들을 주 순서로 놓고 —
 * ```
 *   ① 바로 다음 주에 또 있을 때  누적주가 +1 인가
 *   ② 틈(한 주 이상 빠짐) 뒤에 돌아왔을 때  1 로 돌아가나, 이어서 세나
 *   ③ 첫 줄의 누적주가 1 이 아닌 칸  — 우리 자료가 시작되기 전부터 차트에 있던 것
 * ```
 * ⛔ 「틀렸다」고 말하지 않는다. 우리가 세는 방식과 «다르다»면 다른 것을 세는 것이다.
 * ⛔ 러시아는 뺀다. 다른 자들과 같은 규칙이다.
 * ⛔ 한국 작품만 세지 않는다 — 이것은 «원자료 칸의 뜻»이므로 전부 본다. 한국 것만 따로도 낸다.
 *
 * 쓰는 법
 *   node scripts/build-kcw-weeks-counter.mjs --자가시험
 *   node scripts/build-kcw-weeks-counter.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 오늘 } from './_kst.mjs';
import { koreanTitleFilter } from './lib/korean-netflix-titles.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 나라파일 = path.join(뿌리, 'archive/raw/netflix-top10/countries.ndjson');
const 낼곳 = path.join(뿌리, 'src/data/kcw-weeks-counter.json');

/** 주 문자열을 일수로 — 이어진 주인지 보려면 뺄 수 있어야 한다 */
export function 주를일수로(w) {
  const t = Date.parse(`${w}T00:00:00Z`);
  return Number.isFinite(t) ? Math.round(t / 86400000) : null;
}

/** 두 주가 바로 이어진 주인가 (7일 차이) */
export function 이어진주인가(앞, 뒤) {
  const a = 주를일수로(앞); const b = 주를일수로(뒤);
  if (a === null || b === null) return false;
  return b - a === 7;
}

/**
 * 한 칸의 줄들(주 순서)을 보고 이음새를 센다.
 * ⛔ 줄이 하나면 셀 이음새가 없다 — 0 을 돌려주되 「이음새 0」이라고 낸다.
 */
export function 이음새(줄들) {
  const r = { 이어진칸: 0, 이어지고plus1: 0, 틈칸: 0, 틈뒤1로: 0, 틈뒤이어서: 0, 틈뒤딴수: 0 };
  for (let i = 1; i < 줄들.length; i += 1) {
    const 앞 = 줄들[i - 1]; const 뒤 = 줄들[i];
    if (이어진주인가(앞.주, 뒤.주)) {
      r.이어진칸 += 1;
      if (뒤.누적주 === 앞.누적주 + 1) r.이어지고plus1 += 1;
    } else {
      r.틈칸 += 1;
      if (뒤.누적주 === 1) r.틈뒤1로 += 1;
      else if (뒤.누적주 === 앞.누적주 + 1) r.틈뒤이어서 += 1;
      else r.틈뒤딴수 += 1;
    }
  }
  return r;
}

if (process.argv.includes('--자가시험')) {
  const 실 = [];
  const 검 = (n, ok) => { if (!ok) 실.push(n); };
  검('주를 일수로', 주를일수로('2021-07-04') !== null);
  검('못 읽는 주는 null', 주를일수로('아무것') === null);
  검('7일 차이는 이어진 주', 이어진주인가('2021-07-04', '2021-07-11'));
  검('14일 차이는 틈', !이어진주인가('2021-07-04', '2021-07-18'));
  검('⛔ 빈 것도 안 터진다', !이어진주인가(undefined, undefined));

  const a = 이음새([{ 주: '2021-07-04', 누적주: 1 }, { 주: '2021-07-11', 누적주: 2 }]);
  검('이어진 주에 +1 이면 센다', a.이어진칸 === 1 && a.이어지고plus1 === 1);
  const b = 이음새([{ 주: '2021-07-04', 누적주: 1 }, { 주: '2021-07-11', 누적주: 5 }]);
  검('이어졌는데 +1 이 아니면 안 센다', b.이어진칸 === 1 && b.이어지고plus1 === 0);
  const c = 이음새([{ 주: '2021-07-04', 누적주: 3 }, { 주: '2021-08-01', 누적주: 1 }]);
  검('틈 뒤 1 로 돌아간 것을 센다', c.틈칸 === 1 && c.틈뒤1로 === 1);
  const d2 = 이음새([{ 주: '2021-07-04', 누적주: 3 }, { 주: '2021-08-01', 누적주: 4 }]);
  검('틈 뒤 이어서 센 것을 센다', d2.틈뒤이어서 === 1);
  const e = 이음새([{ 주: '2021-07-04', 누적주: 3 }, { 주: '2021-08-01', 누적주: 9 }]);
  검('틈 뒤 딴 수도 따로 센다', e.틈뒤딴수 === 1);
  검('줄이 하나면 이음새 0', 이음새([{ 주: '2021-07-04', 누적주: 1 }]).이어진칸 === 0);
  검('⛔ 빈 배열도 안 터진다', 이음새([]).틈칸 === 0);

  if (실.length) {
    console.error(`❌ 자가시험 실패 ${실.length}\n${실.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log('✅ build-kcw-weeks-counter 자가시험 통과 (12)');
  process.exit(0);
}

if (!fs.existsSync(나라파일)) {
  console.log(`⬜ **못 쟀다** — ${path.relative(뿌리, 나라파일)} 가 없다. archive/ 는 git 에 안 올라간다.`);
  process.exit(1);
}

const ko = await koreanTitleFilter();
if (!ko || typeof ko.keepTitle !== 'function') {
  console.log('⛔ 한국 제목 규칙을 못 불렀다');
  process.exit(1);
}

/* 칸 = 나라 · 차트 · 제목 · 시즌. 시즌을 넣어야 넷플릭스가 세는 단위와 같아진다 */
const 칸 = new Map();
const 나라이름 = new Map();
let 줄수 = 0; let 널 = 0; let 첫주 = null; let 끝주 = null;
for (const l of fs.readFileSync(나라파일, 'utf8').split('\n')) {
  if (!l) continue;
  let r;
  try { r = JSON.parse(l); } catch { continue; }
  const iso2 = String(r.iso2).toUpperCase();
  if (iso2 === 'RU') continue;
  줄수 += 1;
  if (r.국가 && !나라이름.has(iso2)) 나라이름.set(iso2, String(r.국가));
  if (r.누적주 == null) { 널 += 1; continue; }
  if (!첫주 || r.주 < 첫주) 첫주 = r.주;
  if (!끝주 || r.주 > 끝주) 끝주 = r.주;
  const k = `${iso2}|${r.구분}|${r.제목}|${r.시즌 ?? ''}`;
  if (!칸.has(k)) 칸.set(k, { 한국: ko.keepTitle(r.제목), 줄: [] });
  칸.get(k).줄.push({ 주: r.주, 누적주: r.누적주 });
}

/* 칸마다 가장 큰 누적주 — 「한 나라 톱10 에 가장 오래 있었던 것」 */
const 오래된칸 = [];
for (const [k, v] of 칸) {
  const [iso2, 구분, 제목, 시즌] = k.split('|');
  /* 🔴 여기서 정렬한다. 아래 합계 고리가 정렬하지만 이 고리가 «먼저» 돈다 —
     그것을 몰라 최장연속이 전부 1 로 나왔다(72줄 칸에서 1 은 있을 수 없는 값이다). */
  v.줄.sort((a, b) => a.주.localeCompare(b.주));
  let 최대 = 0; let 최대주 = null; let 첫 = null; let 끝 = null;
  let 연속 = 0; let 가장긴연속 = 0; let 앞주 = null;
  for (const x of v.줄) {
    if (x.누적주 > 최대) { 최대 = x.누적주; 최대주 = x.주; }
    if (!첫 || x.주 < 첫) 첫 = x.주;
    if (!끝 || x.주 > 끝) 끝 = x.주;
    연속 = (앞주 && 이어진주인가(앞주, x.주)) ? 연속 + 1 : 1;
    가장긴연속 = Math.max(가장긴연속, 연속);
    앞주 = x.주;
  }
  오래된칸.push({
    iso2, name: 나라이름.get(iso2) ?? iso2, chart: 구분, title: 제목, season: 시즌 || null,
    korean: v.한국, counter: 최대, counterWeek: 최대주, firstWeek: 첫, lastWeek: 끝, rows: v.줄.length,
    /* 첫 주와 끝 주 사이가 몇 주인가 — 72 가 95 주에 걸쳐 있으면 연속이 아니다 */
    spanWeeks: (주를일수로(끝) - 주를일수로(첫)) / 7 + 1,
    longestStreak: 가장긴연속,
  });
}
오래된칸.sort((a, b) => b.counter - a.counter);

const 합 = { 전체: null, 한국: null };
for (const 갈래 of ['전체', '한국']) {
  const s = {
    칸: 0, 줄: 0, 이어진칸: 0, 이어지고plus1: 0, 틈칸: 0, 틈뒤1로: 0, 틈뒤이어서: 0, 틈뒤딴수: 0,
    첫줄이1아닌칸: 0, 가장큰누적주: 0,
  };
  for (const [, v] of 칸) {
    if (갈래 === '한국' && !v.한국) continue;
    v.줄.sort((a, b) => a.주.localeCompare(b.주));
    s.칸 += 1; s.줄 += v.줄.length;
    if (v.줄[0].누적주 !== 1) s.첫줄이1아닌칸 += 1;
    for (const x of v.줄) s.가장큰누적주 = Math.max(s.가장큰누적주, x.누적주);
    const r = 이음새(v.줄);
    for (const k of ['이어진칸', '이어지고plus1', '틈칸', '틈뒤1로', '틈뒤이어서', '틈뒤딴수']) s[k] += r[k];
  }
  합[갈래] = s;
}

const 중앙값 = (a) => {
  if (!a.length) return null;
  const b = [...a].sort((x, y) => x - y);
  const m = Math.floor(b.length / 2);
  return b.length % 2 ? b[m] : +((b[m - 1] + b[m]) / 2).toFixed(1);
};
const 한국칸 = 오래된칸.filter((x) => x.korean);
const 두주이상 = 한국칸.filter((x) => x.rows >= 2);
const 빈틈없는 = 두주이상.filter((x) => x.longestStreak === x.rows && x.spanWeeks === x.rows);
const 분포 = {
  koreanCells: 한국칸.length,
  cellsOfTwoOrMore: 두주이상.length,
  medianWeeksPresent: 중앙값(두주이상.map((x) => x.rows)),
  medianSpan: 중앙값(두주이상.map((x) => x.spanWeeks)),
  medianLongestStreak: 중앙값(두주이상.map((x) => x.longestStreak)),
  unbrokenCells: 빈틈없는.length,
  unbrokenPc: 두주이상.length ? +((100 * 빈틈없는.length) / 두주이상.length).toFixed(1) : null,
  /* 걸침이 머문 주보다 두 배 넘는 칸 — 「흩어진 삶」 */
  scatteredCells: 두주이상.filter((x) => x.spanWeeks >= 2 * x.rows).length,
};

const 몫 = (a, b) => (b ? +((100 * a) / b).toFixed(1) : null);
const 낼것 = (s) => ({
  cells: s.칸,
  rows: s.줄,
  consecutivePairs: s.이어진칸,
  consecutivePlusOnePc: 몫(s.이어지고plus1, s.이어진칸),
  gapPairs: s.틈칸,
  afterGapResetToOne: s.틈뒤1로,
  afterGapContinued: s.틈뒤이어서,
  afterGapOther: s.틈뒤딴수,
  afterGapResetToOnePc: 몫(s.틈뒤1로, s.틈칸),
  afterGapContinuedPc: 몫(s.틈뒤이어서, s.틈칸),
  afterGapOtherPc: 몫(s.틈뒤딴수, s.틈칸),
  cellsStartingAboveOne: s.첫줄이1아닌칸,
  cellsStartingAboveOnePc: 몫(s.첫줄이1아닌칸, s.칸),
  largestCounter: s.가장큰누적주,
});

const out = {
  generated: 오늘(),
  source: 'Netflix Top 10 (Tudum) per-country weekly lists, including the "weeks in top 10" number Netflix attaches to each row. Russia excluded.',
  question: 'Netflix publishes a weeks-in-top-10 counter on every row. What does it count?',
  unit: 'One cell is one title (with its season label) on one chart in one country. Pairs are consecutive rows of that cell in week order.',
  whatThisIsNot: 'This does not say the counter is wrong. It says what it counts, which is not the same thing as what we count when we measure a run.',
  weekFrom: 첫주,
  weekTo: 끝주,
  rowsRead: 줄수,
  rowsWithoutCounter: 널,
  /* ⛔ 「가장 오래」를 이름으로 말하려면 그 칸이 «어느 나라·어느 주»인지 같이 내야 한다 */
  longestAll: 오래된칸.slice(0, 10),
  longestKorean: 오래된칸.filter((x) => x.korean).slice(0, 15),
  koreanCellShape: 분포,
  all: 낼것(합.전체),
  korean: 낼것(합.한국),
};
fs.writeFileSync(낼곳, `${JSON.stringify(out, null, 2)}\n`, 'utf8');
console.log(`줄 ${줄수.toLocaleString('en-US')} · 누적주 없는 줄 ${널} · 칸 ${칸.size.toLocaleString('en-US')}`);
for (const [이름, s] of [['전체', out.all], ['한국', out.korean]]) {
  console.log(`\n■ ${이름} — 칸 ${s.cells.toLocaleString('en-US')} · 줄 ${s.rows.toLocaleString('en-US')}`);
  console.log(`   이어진 주 ${s.consecutivePairs.toLocaleString('en-US')}쌍 중 +1 인 것 ${s.consecutivePlusOnePc}%`);
  console.log(`   틈 뒤 ${s.gapPairs.toLocaleString('en-US')}쌍 — 1 로 돌아감 ${s.afterGapResetToOnePc}% · 이어서 셈 ${s.afterGapContinuedPc}% · 딴 수 ${s.afterGapOtherPc}%`);
  console.log(`   첫 줄이 1 이 아닌 칸 ${s.cellsStartingAboveOne.toLocaleString('en-US')} (${s.cellsStartingAboveOnePc}%) · 가장 큰 누적주 ${s.largestCounter}`);
}
console.log(`\n냈다 — ${path.relative(뿌리, 낼곳)}`);
