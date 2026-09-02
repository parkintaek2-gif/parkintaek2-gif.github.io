#!/usr/bin/env node
/**
 * build-kcw-all-ten-weeks.mjs — **한 나라의 열 자리를 한국 작품이 다 차지한 주.**
 *
 * ── 왜 재나 (2026-09-03) ────────────────────────────────────
 * `wikitip-clumping.json` 의 `byMarket` 에 «안 쓰던 축» 둘이 있었다 —
 * ```
 *   clumping        그 나라에서 한국 작품이 «몰려» 오나 (고르게 흩어질 때와의 차이)
 *   mostInOneWeek   한 주에 최대 몇 자리를 차지했나
 * ```
 * 재 보니 몰림이 가장 심한 넷이 **말레이시아·싱가포르·인도네시아·필리핀** — 우리 1차 독자다.
 * 그리고 말레이시아·인도네시아는 `mostInOneWeek = 10` 이었다. **열 자리 전부**다.
 *
 * ⭐ 우리 기사 `the-four-weeks-the-whole-shelf-was-korean` 은 그런 주가 «넷»이라고 적었다.
 *   그건 **모든 나라·모든 차트를 한 통에 넣고 센 것**이다. 이 자는 그것을
 *   **나라별·차트별로** 갈라 낸다 — 어느 나라에서 언제, 어느 차트(영화/시리즈)였나.
 *
 * ── ⛔ 이 자가 지키는 것 ────────────────────────────────────
 * ⛔ 한국 작품 판정은 **대표 규칙 하나**를 부른다(`koreanTitleFilter`). 여기서 새로 정하지 않는다 —
 *   같은 사이트에서 두 수가 나가는 것이 제일 나쁘다.
 * ⛔ 러시아는 뺀다(2022-02 부터 넷플릭스가 목록을 안 낸다). 다른 자들과 같은 규칙이다.
 * ⛔ archive/ 는 git 에 안 올라간다. 없으면 **「못 쟀다」**고 적고 서지 않는다.
 * ⛔ 「인기」·「석권」이라 안 쓴다. 우리가 가진 것은 차트 «자리»다.
 *
 * 쓰는 법
 *   node scripts/build-kcw-all-ten-weeks.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 오늘 } from './_kst.mjs';
import { koreanTitleFilter } from './lib/korean-netflix-titles.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 나라파일 = path.join(뿌리, 'archive/raw/netflix-top10/countries.ndjson');
const 낼곳 = path.join(뿌리, 'src/data/kcw-all-ten-weeks.json');

/** 한 칸(나라·주·차트)의 열쇠 */
export function 칸열쇠(iso2, 주, 구분) {
  return `${String(iso2).toUpperCase()}|${주}|${구분}`;
}

/** 그 칸이 «전부 한국»인가 — 열 자리 중 열 자리 */
export function 전부한국인가(칸) {
  return !!칸 && 칸.전체 >= 10 && 칸.한국 === 칸.전체;
}

if (process.argv.includes('--자가시험')) {
  const 실 = [];
  const 검 = (n, ok) => { if (!ok) 실.push(n); };
  검('열쇠를 만든다', 칸열쇠('my', '2023-01-01', 'Films') === 'MY|2023-01-01|Films');
  검('열 자리 다 한국이면 참', 전부한국인가({ 전체: 10, 한국: 10 }));
  검('아홉이면 거짓', !전부한국인가({ 전체: 10, 한국: 9 }));
  검('⛔ 자리가 열보다 적은 칸은 안 센다 — 「다 찼다」가 아니다',
    !전부한국인가({ 전체: 7, 한국: 7 }));
  검('⛔ 빈 것도 안 터진다', !전부한국인가(undefined));
  if (실.length) {
    console.error(`❌ 자가시험 실패 ${실.length}\n${실.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log('✅ build-kcw-all-ten-weeks 자가시험 통과 (5)');
  process.exit(0);
}

if (!fs.existsSync(나라파일)) {
  console.log(`⬜ **못 쟀다** — ${path.relative(뿌리, 나라파일)} 가 없다.`);
  console.log('   archive/ 는 git 에 안 올라간다. 수집기를 먼저 돌린다.');
  process.exit(1);
}

const ko = await koreanTitleFilter();
if (!ko || typeof ko.keepTitle !== 'function') {
  console.log('⛔ 한국 제목 규칙을 못 불렀다 — 여기서 새로 정하지 않는다');
  process.exit(1);
}

const 칸 = new Map();
const 나라이름 = new Map();
let 줄수 = 0;
for (const l of fs.readFileSync(나라파일, 'utf8').split('\n')) {
  if (!l) continue;
  let r;
  try { r = JSON.parse(l); } catch { continue; }
  const iso2 = String(r.iso2).toUpperCase();
  if (iso2 === 'RU') continue;
  줄수 += 1;
  /* ⚠ 원자료의 칸 이름은 «국가» 다. 처음에 「나라」로 읽어 나라 이름이 다 iso2 로 나왔다 —
     원자료의 칸 이름을 짐작하지 않는다. 한 줄을 열어 보고 적는다 */
  if (r.국가 && !나라이름.has(iso2)) 나라이름.set(iso2, String(r.국가));
  const k = 칸열쇠(iso2, r.주, r.구분);
  if (!칸.has(k)) 칸.set(k, { 전체: 0, 한국: 0, 제목: [] });
  const c = 칸.get(k);
  c.전체 += 1;
  if (ko.keepTitle(r.제목)) { c.한국 += 1; c.제목.push(String(r.제목)); }
}

const 다찬것 = [];
const 아홉 = [];
for (const [k, c] of 칸) {
  const [iso2, 주, 구분] = k.split('|');
  if (전부한국인가(c)) {
    다찬것.push({ iso2, name: 나라이름.get(iso2) ?? iso2, week: 주, chart: 구분, titles: c.제목.slice().sort(),
      distinctTitles: new Set(c.제목).size });
  } else if (c.전체 >= 10 && c.한국 === c.전체 - 1) {
    아홉.push({ iso2, name: 나라이름.get(iso2) ?? iso2, week: 주, chart: 구분 });
  }
}
다찬것.sort((a, b) => a.week.localeCompare(b.week) || a.iso2.localeCompare(b.iso2));

/* 나라별로 몇 번인가 */
const 나라별 = new Map();
for (const x of 다찬것) {
  if (!나라별.has(x.iso2)) 나라별.set(x.iso2, { iso2: x.iso2, name: x.name, weeks: 0, charts: new Set() });
  const s = 나라별.get(x.iso2);
  s.weeks += 1; s.charts.add(x.chart);
}

const out = {
  generated: 오늘(),
  source: 'Netflix Top 10 (Tudum) per-country weekly lists. Russia excluded — Netflix stopped publishing its list in February 2022.',
  question: 'In which country, and in which week, did Korean titles hold every one of the ten places on a Netflix chart?',
  unit: 'One cell is one country, one week, one of the two charts (films or series). A cell counts only if the chart published ten places.',
  whatThisIsNot: 'This is not viewing. Netflix publishes the position, not how many people watched. A chart place is a rank.',
  koreanRule: 'Korean titles are decided by the one rule the rest of this site uses, so this count moves when that rule moves.',
  rowsRead: 줄수,
  cellsRead: 칸.size,
  allTenCells: 다찬것.length,
  nineOfTenCells: 아홉.length,
  /* ⭐ 아슬아슬하게 놓친 칸도 «어디»가 중요하다. 다 찬 칸이 여덟뿐이라
     여덟만으로는 「어느 나라가 그런 나라인가」를 못 말한다 */
  nineByMarket: (() => {
    const m = new Map();
    for (const x of 아홉) {
      if (!m.has(x.iso2)) m.set(x.iso2, { iso2: x.iso2, name: x.name, weeks: 0 });
      m.get(x.iso2).weeks += 1;
    }
    return [...m.values()].sort((a, b) => b.weeks - a.weeks || a.name.localeCompare(b.name));
  })(),
  byMarket: [...나라별.values()]
    .map((s) => ({ ...s, charts: [...s.charts].sort() }))
    .sort((a, b) => b.weeks - a.weeks || a.name.localeCompare(b.name)),
  cells: 다찬것,
};
fs.writeFileSync(낼곳, `${JSON.stringify(out, null, 2)}\n`, 'utf8');
console.log(`줄 ${줄수.toLocaleString('en-US')} · 칸 ${칸.size.toLocaleString('en-US')}`);
console.log(`열 자리 전부 한국인 칸 ${다찬것.length} · 아홉 자리인 칸 ${아홉.length}`);
for (const s of out.byMarket) console.log(`   ${s.name} (${s.iso2}) — ${s.weeks}번 · ${s.charts.join('·')}`);
console.log(`냈다 — ${path.relative(뿌리, 낼곳)}`);
