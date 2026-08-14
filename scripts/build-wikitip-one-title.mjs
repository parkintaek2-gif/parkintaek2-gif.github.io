#!/usr/bin/env node
/**
 * **차트에 오른 배우의 절반은 작품이 한 편이다.** (`/one-title` · 기사 76편째)
 *
 * ── 어떻게 여기까지 왔나 ──────────────────────────────────────
 *   「일찍 시작하면 더 멀리 가나」를 재려 했다. 재 보니 **한 방향으로 안 갔다**
 *   (가운데 넓이 19 · 11 · 18 · 7 — 활동 햇수를 맞춰도 뒤집혔다).
 *   ⛔ 그것을 억지로 읽지 않았다. 대신 **왜 못 읽나**를 봤더니 —
 *   ⭐ 배우 절반이 차트에 오른 작품이 **한 편뿐**이었다.
 *      한 편뿐인 사람의 「도달」은 그 사람 것이 아니라 **그 작품 것**이다.
 *
 * ── ⛔ 이 자료가 지키는 것 ───────────────────────────────────
 * ⛔ 사람을 줄세우지 않는다. **몇 편인 사람이 몇 명인가**만 낸다. 이름을 안 낸다.
 * ⛔ 「한 편뿐이니 못한 배우」로 안 읽는다. 우리가 보는 것은 **넷플릭스 차트에 오른 것**뿐이고,
 *    극장·방송·연극은 이 표에 없다. 그 말을 자료에 담는다.
 * ⚠ 데뷔 나이가 아무것도 안 사더라는 **음성 결과**를 같이 낸다. 재고 안 실으면 안 잰 것과 같다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 지금 } from './_kst.mjs';

const 붙은길 = 'archive/raw/netflix-top10/korean-cast-joined.json';
const 사람길 = 'archive/raw/wikidata/korean-people.json';
const 판정길 = 'src/data/wikitip-title-ambiguity.json';
const 표길 = 'archive/raw/netflix-top10/countries.ndjson';
const 결과 = 'src/data/wikitip-one-title.json';
const 올해 = 2026;
const 최소칸 = 15;          /* ⛔ 열다섯 명이 안 되는 칸은 가운데값을 안 낸다 */

/** 몇 편인지로 묶는다. 6편 이상은 한 칸 — 꼬리를 늘어놓으면 줄세우기가 된다 */
export function 묶음이름(n) {
  return n >= 6 ? '6 or more' : String(n);
}
export const 칸차례 = ['1', '2', '3', '4', '5', '6 or more'];

export function 가운데(수들) {
  if (!수들.length) return null;
  const s = [...수들].sort((a, b) => a - b);
  return s[s.length >> 1];
}

/** 데뷔 나이 띠 */
export const 나이띠 = [
  { name: 'under 18', lo: 0, hi: 18 },
  { name: '18–20', lo: 18, hi: 21 },
  { name: '21–24', lo: 21, hi: 25 },
  { name: '25 or older', lo: 25, hi: 999 },
];

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    if (JSON.stringify(실제) === JSON.stringify(바람)) 통 += 1;
    else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  재본다('묶음이름 — 1', 묶음이름(1), '1');
  재본다('묶음이름 — 6 이상은 한 칸', 묶음이름(9), '6 or more');
  재본다('칸이 여섯', 칸차례.length, 6);
  재본다('가운데', 가운데([3, 1, 2]), 2);
  재본다('가운데 — 빈 것은 null(0 이 아니다)', 가운데([]), null);
  재본다('나이띠가 넷', 나이띠.length, 4);
  재본다('나이띠가 안 겹친다', 나이띠.every((b, i) => i === 0 || b.lo === 나이띠[i - 1].hi), true);
  console.log(`한 편 짓는 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  for (const p of [붙은길, 사람길, 판정길, 표길]) {
    if (!fs.existsSync(p)) { console.error(`⛔ 없다 — ${p}`); process.exit(1); }
  }
  const 붙은 = JSON.parse(fs.readFileSync(붙은길, 'utf8')).배우;
  const 사람 = JSON.parse(fs.readFileSync(사람길, 'utf8')).사람;
  const 판 = JSON.parse(fs.readFileSync(판정길, 'utf8'));
  const 한국제목 = new Set(판.perTitle.map((x) => x.title));

  const 시장 = new Map();
  for (const 줄 of fs.readFileSync(표길, 'utf8').split('\n')) {
    if (!줄.trim()) continue;
    let j; try { j = JSON.parse(줄); } catch { continue; }
    if (j.국가 === 'Russia' || !한국제목.has(j.제목)) continue;
    if (!시장.has(j.제목)) 시장.set(j.제목, new Set());
    시장.get(j.제목).add(j.국가);
  }

  /* 배우마다 차트에 오른 작품 수 */
  const 편수 = new Map();
  for (const q of Object.keys(붙은)) {
    const n = (붙은[q].작품이름 ?? []).filter((t) => 한국제목.has(t)).length;
    if (n) 편수.set(q, n);
  }
  const 총 = 편수.size;
  const 셈 = Object.fromEntries(칸차례.map((k) => [k, 0]));
  for (const n of 편수.values()) 셈[묶음이름(n)] += 1;
  let 누적 = 0;
  const 분포 = 칸차례.map((k) => {
    누적 += 셈[k];
    return {
      titles: k, actors: 셈[k], sharePc: +((100 * 셈[k]) / 총).toFixed(1),
      cumulativePc: +((100 * 누적) / 총).toFixed(1),
    };
  });

  /* ⚠ 음성 결과 — 데뷔 나이가 무엇을 사나. 활동 햇수를 맞춰 놓고도 본다 */
  const 나이줄 = [];
  for (const p of 사람) {
    if (!p.ageAtStart || !p.startedYear) continue;
    const 작품 = (붙은[p.q]?.작품이름 ?? []).filter((t) => 한국제목.has(t));
    if (!작품.length) continue;
    나이줄.push({
      나이: p.ageAtStart,
      햇수: 올해 - p.startedYear,
      편수: 작품.length,
      최대넓이: Math.max(...작품.map((t) => 시장.get(t)?.size ?? 0)),
    });
  }
  const 나이표 = 나이띠.map((b) => {
    const g = 나이줄.filter((x) => x.나이 >= b.lo && x.나이 < b.hi);
    return {
      band: b.name,
      actors: g.length,
      medianTitles: g.length >= 최소칸 ? 가운데(g.map((x) => x.편수)) : null,
      medianWidestReach: g.length >= 최소칸 ? 가운데(g.map((x) => x.최대넓이)) : null,
      medianYearsActive: g.length >= 최소칸 ? 가운데(g.map((x) => x.햇수)) : null,
    };
  });
  /* 🔴 한 방향으로 가나 — 안 가면 「샀다」고 쓸 수 없다 */
  const 넓이들 = 나이표.map((r) => r.medianWidestReach).filter((v) => v !== null);
  const 한방향 = 넓이들.every((v, i) => i === 0 || v <= 넓이들[i - 1])
    || 넓이들.every((v, i) => i === 0 || v >= 넓이들[i - 1]);

  const out = {
    generated: 지금(),
    source: 'Wikidata cast lists for Korean titles that reached a Netflix country chart, joined to '
      + 'public profile birth and start dates',
    question: 'How many charting titles does one Korean actor have, and does starting young buy more?',
    unit: 'Actors. One row is one person, counted once.',
    actorsWithAtLeastOne: 총,
    distribution: 분포,
    oneTitleOnlyPc: 분포[0].sharePc,
    twoOrFewerPc: 분포[1].cumulativePc,
    debutBands: 나이표,
    debutBandMinimum: 최소칸,
    /** ⚠ 참이면 「데뷔 나이가 무엇을 산다」고 못 쓴다 */
    debutAgeMonotonic: 한방향,
    whyReachIsNotThePersons: 'Half of these actors have exactly one charting title, so the reach we '
      + 'could attribute to them is the reach of that one title. It is a fact about the title, not '
      + 'about the person, and no amount of arithmetic separates the two here.',
    cannotAnswer: 'It counts titles that reached a Netflix country chart. Theatre, cinema releases '
      + 'that never charted, and broadcast work are absent, so a one-title actor here is not a '
      + 'one-title actor.',
  };
  fs.writeFileSync(결과, `${JSON.stringify(out, null, 2)}\n`);
  console.log(`배우 ${총}명 · 한 편뿐 ${out.oneTitleOnlyPc}% · 두 편 이하 ${out.twoOrFewerPc}%`);
  console.log(`데뷔 나이 띠 가운데 넓이: ${나이표.map((r) => `${r.band} ${r.medianWidestReach}`).join(' · ')}`);
  console.log(한방향 ? '⚠ 한 방향이다' : '⭐ 한 방향이 아니다 — 「데뷔 나이가 무엇을 산다」고 못 쓴다');
}
