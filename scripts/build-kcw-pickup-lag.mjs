#!/usr/bin/env node
/**
 * build-kcw-pickup-lag.mjs — **어느 나라가 한국 작품을 먼저 집어 드나.**
 *
 * ── 🔴 왜 재나 (2026-09-03) ─────────────────────────────────
 * 우리에게 「먼저」를 다룬 지면이 둘 있는데 둘 다 이 물음이 아니다 —
 * ```
 *   /who-is-first   위키백과 «판»(인도네시아어·베트남어…)이 먼저 «쓰는» 것
 *   /home-first     한국 차트가 먼저인가 밖이 먼저인가 (두 갈래)
 * ```
 * **93개 시장을 줄 세워 「몇 주 늦게 집어 드나」를 잰 적은 없다.**
 *
 * ⭐ 재는 법 — 한 작품의 «데뷔»는 그 작품이 어느 나라든 처음 차트에 든 주다.
 *   그 나라가 그 작품을 처음 실은 주에서 데뷔 주를 빼면 **늦음(주)**이다.
 *   나라마다 그 늦음의 중앙값을 낸다.
 *
 * ── ⛔ 이 자가 지키는 것 ────────────────────────────────────
 * ⛔ 「먼저 집어 든다」를 「먼저 본다」로 바꿔 쓰지 않는다. 넷플릭스가 나라마다 언제 공개하는지가
 *   여기 섞여 있다 — 늦음의 대부분은 공개일일 수 있고, 우리는 그것을 못 가른다.
 * ⛔ 늦음이 0 인 것을 「1등」이라 부르지 않는다. 같은 주에 여러 나라가 0 이 된다.
 * ⛔ 작품이 적은 나라는 안 낸다(최소 30편). 우리가 고른 자리이므로 그 수를 밝힌다.
 * ⛔ 데뷔가 우리 창의 첫 주(2021-07-04)인 작품은 **뺀다** — 그 전에 이미 차트에 있었을 수 있고,
 *   그러면 늦음이 실제보다 작게 나온다. 몇 편을 뺐는지 낸다.
 * ⛔ 한국 작품 판정은 대표 규칙 하나를 부른다. 러시아는 뺀다.
 *
 * 쓰는 법
 *   node scripts/build-kcw-pickup-lag.mjs --자가시험
 *   node scripts/build-kcw-pickup-lag.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 오늘 } from './_kst.mjs';
import { koreanTitleFilter } from './lib/korean-netflix-titles.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 나라파일 = path.join(뿌리, 'archive/raw/netflix-top10/countries.ndjson');
const 낼곳 = path.join(뿌리, 'src/data/kcw-pickup-lag.json');

/** 창의 첫 주 — 이 주에 데뷔한 것은 앞이 잘린 것이므로 뺀다 */
export const 창첫주 = '2021-07-04';
/** 낼 나라의 최소 작품 수 */
export const 최소작품 = 30;

/** 두 주 사이가 몇 주인가 */
export function 주차이(앞, 뒤) {
  const a = Date.parse(`${앞}T00:00:00Z`);
  const b = Date.parse(`${뒤}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.round((b - a) / (7 * 86400000));
}

/** 중앙값 — 빈 배열이면 null(0 이 아니다) */
export function 중앙값(a) {
  if (!Array.isArray(a) || !a.length) return null;
  const b = [...a].sort((x, y) => x - y);
  const m = Math.floor(b.length / 2);
  return b.length % 2 ? b[m] : +((b[m - 1] + b[m]) / 2).toFixed(1);
}

if (process.argv.includes('--자가시험')) {
  const 실 = [];
  const 검 = (n, ok) => { if (!ok) 실.push(n); };
  검('한 주 차이', 주차이('2021-07-04', '2021-07-11') === 1);
  검('같은 주는 0', 주차이('2021-07-04', '2021-07-04') === 0);
  검('열 주 차이', 주차이('2021-07-04', '2021-09-12') === 10);
  검('못 읽으면 null', 주차이('아무것', '2021-07-04') === null);
  검('중앙값 홀수', 중앙값([1, 5, 3]) === 3);
  검('중앙값 짝수', 중앙값([1, 2, 3, 4]) === 2.5);
  검('⛔ 빈 배열은 null — 0 이 아니다', 중앙값([]) === null);
  검('⛔ 빈 것도 안 터진다', 중앙값(undefined) === null);
  if (실.length) {
    console.error(`❌ 자가시험 실패 ${실.length}\n${실.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log('✅ build-kcw-pickup-lag 자가시험 통과 (8)');
  process.exit(0);
}

if (!fs.existsSync(나라파일)) {
  console.log(`⬜ **못 쟀다** — ${path.relative(뿌리, 나라파일)} 가 없다.`);
  process.exit(1);
}
const ko = await koreanTitleFilter();
if (!ko || typeof ko.keepTitle !== 'function') { console.log('⛔ 한국 제목 규칙을 못 불렀다'); process.exit(1); }

/* 작품 → 나라 → 첫 주 */
const 작품 = new Map();
const 나라이름 = new Map();
let 줄수 = 0;
for (const l of fs.readFileSync(나라파일, 'utf8').split('\n')) {
  if (!l) continue;
  let r;
  try { r = JSON.parse(l); } catch { continue; }
  const iso2 = String(r.iso2).toUpperCase();
  if (iso2 === 'RU') continue;
  줄수 += 1;
  if (r.국가 && !나라이름.has(iso2)) 나라이름.set(iso2, String(r.국가));
  if (!ko.keepTitle(r.제목)) continue;
  const t = String(r.제목);
  if (!작품.has(t)) 작품.set(t, new Map());
  const m = 작품.get(t);
  if (!m.has(iso2) || r.주 < m.get(iso2)) m.set(iso2, r.주);
}

/* 나라별 늦음 모으기 */
const 나라별 = new Map();
let 뺀작품 = 0; let 센작품 = 0;
for (const [, m] of 작품) {
  const 데뷔 = [...m.values()].sort()[0];
  if (데뷔 === 창첫주) { 뺀작품 += 1; continue; }   /* 앞이 잘린 작품 */
  센작품 += 1;
  for (const [iso2, 주] of m) {
    const 늦음 = 주차이(데뷔, 주);
    if (늦음 === null) continue;
    if (!나라별.has(iso2)) 나라별.set(iso2, []);
    나라별.get(iso2).push(늦음);
  }
}

const 시장들 = [...나라별.entries()]
  .filter(([, a]) => a.length >= 최소작품)
  .map(([iso2, a]) => ({
    iso2,
    name: 나라이름.get(iso2) ?? iso2,
    titles: a.length,
    medianLagWeeks: 중앙값(a),
    /* 데뷔 주에 같이 실은 몫 — 「먼저 집어 든」 쪽 */
    sameWeekAsDebutPc: +((100 * a.filter((x) => x === 0).length) / a.length).toFixed(1),
    withinFourWeeksPc: +((100 * a.filter((x) => x <= 4).length) / a.length).toFixed(1),
  }))
  .sort((x, y) => x.medianLagWeeks - y.medianLagWeeks || y.sameWeekAsDebutPc - x.sameWeekAsDebutPc);

const out = {
  generated: 오늘(),
  source: 'Netflix Top 10 (Tudum) per-country weekly lists. Russia excluded — Netflix stopped publishing its list in February 2022.',
  question: 'A Korean title first charts somewhere. How many weeks later does each other market first carry it?',
  unit: "A title's debut is the earliest week it appears on any country's top 10 in these files. A market's lag on that title is the weeks between the debut and that market's own first week with it. We report each market's median lag.",
  whatThisIsNot: 'This is not when people in a country started watching. Netflix decides when a title becomes available in each market, and that release calendar is inside this number in a way these files cannot separate from anything else.',
  whyDebutWeekDropped: `Titles whose debut is the first week we hold (${창첫주}) are dropped, because they may have been charting before Netflix began publishing and their lag would come out too small.`,
  minTitlesPerMarket: 최소작품,
  rowsRead: 줄수,
  koreanTitlesSeen: 작품.size,
  titlesCounted: 센작품,
  titlesDroppedAtWindowStart: 뺀작품,
  marketsMeasured: 시장들.length,
  marketsDropped: 나라별.size - 시장들.length,
  fastest: 시장들.slice(0, 12),
  slowest: [...시장들].reverse().slice(0, 12),
};
fs.writeFileSync(낼곳, `${JSON.stringify(out, null, 2)}\n`, 'utf8');
console.log(`줄 ${줄수.toLocaleString('en-US')} · 한국 작품 ${작품.size} (센 것 ${센작품} · 창 첫 주라 뺀 것 ${뺀작품})`);
console.log(`시장 ${시장들.length} (작품 ${최소작품}편 미만이라 뺀 것 ${나라별.size - 시장들.length})`);
console.log('\n■ 빨리 집어 드는 열둘');
for (const m of out.fastest) console.log(`   ${m.name.padEnd(16)} 중앙값 ${String(m.medianLagWeeks).padStart(4)}주 · 데뷔 주 같이 ${m.sameWeekAsDebutPc}% · 4주 안 ${m.withinFourWeeksPc}% · ${m.titles}편`);
console.log('\n■ 가장 늦게 집어 드는 열둘');
for (const m of out.slowest) console.log(`   ${m.name.padEnd(16)} 중앙값 ${String(m.medianLagWeeks).padStart(4)}주 · 데뷔 주 같이 ${m.sameWeekAsDebutPc}% · ${m.titles}편`);
console.log(`\n냈다 — ${path.relative(뿌리, 낼곳)}`);
