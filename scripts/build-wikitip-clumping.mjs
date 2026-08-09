#!/usr/bin/env node
/**
 * 7.7% 는 **고르게인가 몰려서인가** — 우리 대표 수를 다시 읽는다.
 *
 * ⛔ 왜 이걸 재나 ─────────────────────────────────────────────
 *   우리가 제일 많이 내는 수는 「한국 작품이 세계 차트 자리의 7.7%」다.
 *   ⚠ 그 수는 **평균**이다. 열 칸짜리 차트에서 7.7% 는 「매주 0.77칸」인데,
 *      칸은 0.77개일 수 없다. 실제로는 **어떤 주엔 여러 칸, 어떤 주엔 0칸**이다.
 *   ⭐ 그 모양을 안 보이면 손님이 「늘 한 칸쯤 있다」로 읽는다. 그건 우리가 잰 것이 아니다.
 *
 * ⛔ 이 자가 지키는 것 ───────────────────────────────────────────
 * ⛔ **나라를 고정한다.** 나라마다 한국 몫이 다르다. 안 고정하면 나라 차이를 몰림으로 읽는다.
 * ⛔ 🔴 **대조군을 계산으로 만든다.** 같은 몫이 **고르게 흩어졌을 때**의 모양(이항분포)과 견준다.
 *    그래야 「몰렸다」가 눈대중이 아니라 수가 된다.
 *    ⚠ Math.random 을 안 쓴다 — 이항분포는 계산으로 나오고, 그래야 언제 돌려도 같은 답이다.
 * ⛔ **순위표를 안 만든다.** 나라 이름으로 줄 세우지 않는다. 몰림의 **분포**만 낸다.
 * ⚠ 왜 몰리는지는 이 자료에 **없다.** 공개일도 편성도 넷플릭스가 안 낸다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { koreanTitleFilter } from './lib/korean-netflix-titles.mjs';

const 나라파일 = 'archive/raw/netflix-top10/countries.ndjson';

const 낼파일 = 'src/data/wikitip-clumping.json';

/** 몫. 밑이 0 이면 **0 이 아니라 null** */
export function 몫(a, b) {
  if (!b) return null;
  return +((100 * a) / b).toFixed(1);
}

/**
 * 이항 확률 — 칸이 n개이고 한 칸이 한국일 확률이 p 일 때 **꼭 k칸**일 확률.
 * ⛔ 이것이 「고르게 흩어졌다면」의 모양이다. 실제와 견주려고 쓴다.
 * ⚠ 큰 수 계산에서 넘치지 않게 **로그로 더한다.**
 */
export function 이항(n, k, p) {
  if (k < 0 || k > n) return 0;
  if (p <= 0) return k === 0 ? 1 : 0;
  if (p >= 1) return k === n ? 1 : 0;
  let 로그 = 0;
  for (let i = 1; i <= k; i += 1) 로그 += Math.log(n - k + i) - Math.log(i);
  로그 += k * Math.log(p) + (n - k) * Math.log(1 - p);
  return Math.exp(로그);
}

/**
 * 몰림 — **한 칸이라도 있는 주**가 고른 경우보다 얼마나 적은가.
 * ⛔ 「많이 있는 주」를 세면 큰 나라가 이긴다. **있나 없나**로 보면 나라 크기가 죽는다.
 * @returns 0 이면 고른 것과 같다. 클수록 몰렸다(같은 몫이 더 적은 주에 뭉쳐 있다).
 */
export function 몰림(실제있는주몫, 고른있는주몫) {
  if (고른있는주몫 == null || !고른있는주몫) return null;
  return +(1 - 실제있는주몫 / 고른있는주몫).toFixed(3);
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    if (JSON.stringify(실제) === JSON.stringify(바람)) 통 += 1;
    else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  const 반올 = (x, d = 4) => +x.toFixed(d);
  재본다('몫 — 밑이 0 이면 null', 몫(1, 0), null);
  재본다('이항 — 열 칸에 0개일 확률(p=0)', 이항(10, 0, 0), 1);
  재본다('이항 — 다 찰 확률(p=1)', 이항(10, 10, 1), 1);
  /* 동전 두 번에 한 번 앞면 = 0.5 */
  재본다('이항 — 2번 중 1번(p=0.5)', 반올(이항(2, 1, 0.5)), 0.5);
  재본다('이항 — 칸 밖은 0', 이항(10, 11, 0.5), 0);
  /* 열 칸이 p=0.077 이면 0칸일 확률이 가장 크다 */
  재본다('이항 — 7.7% 면 0칸이 제일 흔하다',
    이항(10, 0, 0.077) > 이항(10, 1, 0.077), true);
  /* 🔴 이 두 줄이 이 자의 요점이다 */
  재본다('몰림 — 고른 것과 같으면 0', 몰림(0.5, 0.5), 0);
  재본다('몰림 — 있는 주가 적으면 양수', 몰림(0.25, 0.5), 0.5);
  재본다('몰림 — 밑이 0 이면 null', 몰림(0.1, 0), null);
  console.log(`몰림 수집기 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  for (const p of [나라파일]) {
    if (!fs.existsSync(p)) {
      console.log(`⛔ 원자료가 없다 — ${p}`);
      console.log('   ⚠ archive/ 는 git 에 안 올라간다. 「안 됐다」가 아니라 **못 쟀다**.');
      process.exit(1);
    }
  }
  /*
   * 🔴 **한국 제목은 하나뿐인 규칙으로 가른다.** 명단을 여기서 따로 만들지 않는다.
   *   ⛔ 처음에 korean-titles-keyed.json 의 제목을 그대로 썼더니 자리가 **38,234** 로 나왔다.
   *      우리 대표 수는 **37,750** 이다 — **484자리를 더 셌다.**
   *   ⚠ 까닭: 그 규칙은 (a) 손으로 뺀 목록과 (b) 넷플릭스 영어차트 딱지까지 본다.
   *      나는 둘 다 안 봤다. **같은 사이트에서 두 수가 나가는 것**이 제일 나쁘다.
   *   ⭐ 그래서 `koreanTitleFilter()` 를 부른다. 대표 수가 바뀌면 이 수도 같이 바뀐다.
   */
  const ko = await koreanTitleFilter();
  if (!ko || typeof ko.keepTitle !== 'function') {
    console.log('⛔ 한국 제목 규칙을 못 불렀다');
    process.exit(1);
  }

  /* ── (나라·주·구분) 칸마다 전체 칸 수와 한국 칸 수 ── */
  const 칸 = new Map();
  let 줄 = 0;
  for (const l of fs.readFileSync(나라파일, 'utf8').split('\n')) {
    if (!l) continue;
    줄 += 1;
    let r;
    try { r = JSON.parse(l); } catch { continue; }
    const iso2 = String(r.iso2).toUpperCase();
    if (iso2 === 'RU') continue;
    const k = `${iso2}|${r.주}|${r.구분}`;
    if (!칸.has(k)) 칸.set(k, { 전체: 0, 한국: 0 });
    const c = 칸.get(k);
    c.전체 += 1;
    if (ko.keepTitle(r.제목)) c.한국 += 1;
  }

  /* ── 나라마다 — 실제로 한 칸이라도 있던 주의 몫 vs 고르게 흩어졌을 때 ── */
  const 나라별 = new Map();
  for (const [k, c] of 칸) {
    const iso2 = k.split('|')[0];
    if (!나라별.has(iso2)) 나라별.set(iso2, { 주: 0, 있는주: 0, 한국칸: 0, 전체칸: 0, 몇칸: new Map() });
    const s = 나라별.get(iso2);
    s.주 += 1;
    s.한국칸 += c.한국; s.전체칸 += c.전체;
    if (c.한국 > 0) s.있는주 += 1;
    s.몇칸.set(c.한국, (s.몇칸.get(c.한국) ?? 0) + 1);
  }

  /* ⛔ 주가 적은 나라는 뺀다. 우리가 고른 자리다 */
  const 최소주 = 50;
  const 나라들 = [];
  for (const [iso2, s] of 나라별) {
    if (s.주 < 최소주 || !s.한국칸) continue;
    const p = s.한국칸 / s.전체칸;                 /* 그 나라의 한국 몫 */
    const 칸수 = Math.round(s.전체칸 / s.주);      /* 보통 10 */
    const 고른없는주 = 이항(칸수, 0, p);           /* 고르게 흩어졌을 때 0칸일 확률 */
    const 고른있는주몫 = 1 - 고른없는주;
    const 실제있는주몫 = s.있는주 / s.주;
    나라들.push({
      iso2,
      weeks: s.주,
      koreanShare: 몫(s.한국칸, s.전체칸),
      weeksWithAny: s.있는주,
      observedAnyPc: 몫(s.있는주, s.주),
      evenAnyPc: +(100 * 고른있는주몫).toFixed(1),
      clumping: 몰림(실제있는주몫, 고른있는주몫),
      mostInOneWeek: Math.max(...s.몇칸.keys()),
    });
  }
  나라들.sort((a, b) => a.iso2.localeCompare(b.iso2));   /* ⛔ 이름 차례. 줄세우지 않는다 */

  /* ── 세계 전체 ── */
  let 전체칸 = 0; let 한국칸 = 0; let 전체주 = 0; let 있는주 = 0;
  const 몇칸전체 = new Map();
  for (const [, c] of 칸) {
    전체칸 += c.전체; 한국칸 += c.한국; 전체주 += 1;
    if (c.한국 > 0) 있는주 += 1;
    몇칸전체.set(c.한국, (몇칸전체.get(c.한국) ?? 0) + 1);
  }
  const 세계몫 = 한국칸 / 전체칸;
  const 세계칸수 = Math.round(전체칸 / 전체주);
  const 세계고른있는주 = 1 - 이항(세계칸수, 0, 세계몫);
  const 세계실제있는주 = 있는주 / 전체주;

  const 분포 = [...몇칸전체.keys()].sort((a, b) => a - b).map((k) => ({
    korean: k,
    cells: 몇칸전체.get(k),
    observedPc: 몫(몇칸전체.get(k), 전체주),
    evenPc: +(100 * 이항(세계칸수, k, 세계몫)).toFixed(1),
  }));

  /* ── 스스로 본다 ── */
  if (!전체주) throw new Error('칸을 하나도 못 읽었다');
  if (!나라들.length) throw new Error(`주 ${최소주} 를 넘는 나라가 없다 — 문턱이 너무 높다`);
  {
    const 합 = 분포.reduce((s, x) => s + x.cells, 0);
    if (합 !== 전체주) throw new Error(`분포 합 ${합} 이 칸 ${전체주} 과 다르다`);
  }
  {
    const 몫합 = 분포.reduce((s, x) => s + x.evenPc, 0);
    if (Math.abs(몫합 - 100) > 1) throw new Error(`고른 분포 합이 ${몫합}% 다 — 이항 셈이 틀렸다`);
  }
  /* 🔴 요지 — 몰려 있어야 이 기사가 선다. 안 몰렸으면 기사를 다시 쓴다 */
  if (!(세계실제있는주 < 세계고른있는주)) {
    throw new Error(`실제로 한 칸이라도 있는 주(${세계실제있는주}) 가 고른 경우(${세계고른있는주}) 보다 적지 않다 — 「몰렸다」를 못 쓴다`);
  }

  const out = {
    generated: new Date().toISOString(),
    source: 'Netflix Top 10 (Tudum) weekly country lists. One cell is one country, one week, one of the two '
      + 'charts (films or series).',
    question: 'Our headline figure is an average. Is a Korean title on a country chart most weeks, or absent '
      + 'most weeks and several at once when it is there?',
    unit: 'A cell is one country-week-chart. "Any" means at least one Korean title held a place in that cell. '
      + 'The even comparison is what the same overall share would produce if places fell independently.',
    whyEvenComparison: 'Ten places cannot hold 0.77 of a title. To say a share is clumped you need to know what '
      + 'unclumped would look like, so each country is compared against a binomial with that country\'s own share.',
    whyPerCountry: 'Countries differ in how much Korean content they take. Pooling them would let a difference '
      + 'between countries be read as clumping inside one.',
    minimumWeeks: 최소주,
    rowsRead: 줄,
    cellsMeasured: 전체주,
    koreanPlaces: 한국칸,
    allPlaces: 전체칸,
    worldSharePc: 몫(한국칸, 전체칸),
    cellsWithAny: 있는주,
    observedAnyPc: 몫(있는주, 전체주),
    evenAnyPc: +(100 * 세계고른있는주).toFixed(1),
    clumping: 몰림(세계실제있는주, 세계고른있는주),
    distribution: 분포,
    marketsMeasured: 나라들.length,
    byMarket: 나라들,
    marketsMoreClumpedThanEven: 나라들.filter((x) => x.clumping > 0).length,
    cannotAnswer: 'This cannot say why the places arrive together. Netflix publishes neither release dates by '
      + 'country nor what it promoted where, and a chart place is an outcome rather than a decision.',
  };
  fs.writeFileSync(낼파일, `${JSON.stringify(out, null, 2)}\n`, 'utf8');

  console.log(`줄 ${줄.toLocaleString('en-US')} · 칸(나라×주×차트) ${전체주.toLocaleString('en-US')}`);
  console.log(`한국 자리 ${한국칸.toLocaleString('en-US')} / ${전체칸.toLocaleString('en-US')} = ${out.worldSharePc}%`);
  console.log(`한 칸이라도 있던 칸  실제 ${out.observedAnyPc}%  ·  고르게라면 ${out.evenAnyPc}%  → 몰림 ${out.clumping}`);
  console.log('한 칸에 한국 작품이 몇 개였나 —');
  for (const d of 분포.slice(0, 6)) {
    console.log(`   ${String(d.korean).padStart(2)}개  실제 ${String(d.observedPc).padStart(5)}%  고르게 ${String(d.evenPc).padStart(5)}%`);
  }
  console.log(`나라 ${나라들.length}곳 중 고른 것보다 몰린 곳 ${out.marketsMoreClumpedThanEven}`);
  console.log(`→ ${낼파일}`);
}
