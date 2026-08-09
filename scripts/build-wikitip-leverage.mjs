#!/usr/bin/env node
/**
 * **레버리지가 정말 커졌나** — 지금 업계 이슈를 우리 자료로 검증한다.
 *
 * ── 이슈(우리가 잰 것이 아니다 · 남이 낸 수) ────────────────────
 *   「2015년 한국 드라마 회당 제작비 약 $360,000 → 2024년 오징어 게임 2 회당 약 $980만.
 *    10년이 안 되어 27배. **그 돈을 댈 수 있는 곳이 몇 안 되어 넷플릭스의 지렛대가 커졌다**」
 *   ⛔ 제작비는 **우리에게 없다.** 이 자는 그 수를 다시 내지 않는다.
 *
 * ── 그러면 우리가 잴 수 있는 것은 무엇인가 ──────────────────────
 *   「지렛대가 커졌다」가 참이면 **차트가 소수에게 몰려 갔어야** 한다.
 *   ⭐ 우리는 회사×작품×나라×주를 가지고 있다. **해마다** 그 몰림을 잴 수 있다.
 *   ⭐ 그리고 「방송을 거친 작품 대 안 거친 작품」의 비중도 해마다 잴 수 있다 —
 *      방송사를 안 거치는 작품이 늘었다면 그것이 지렛대가 옮겨 간 자국이다.
 *
 * ── ⛔ 이 자가 지키는 것 ────────────────────────────────────
 * ⛔ **남의 수와 우리 수를 섞지 않는다.** 제작비는 인용이고 나머지는 우리 셈이다.
 * ⛔ 🔴 **해마다 차트에 오른 작품 수가 다르다.** 몰림은 표본이 작을수록 커 보인다.
 *    그래서 **같은 자리 수를 고르게 뿌렸을 때**를 같이 낸다. 그 차이만 성과로 센다.
 * ⛔ **회사를 줄세우지 않는다.** 「절반을 채우는 곳이 몇 곳인가」만 낸다. 이름은 안 낸다.
 * ⚠ 2026 은 해가 안 끝났다. **덜 찬 해**라고 화면에 적는다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { koreanTitleFilter } from './lib/korean-netflix-titles.mjs';

const 나라파일 = 'archive/raw/netflix-top10/countries.ndjson';
const 회사파일 = 'archive/raw/netflix-top10/firm-works.json';
const 낼파일 = 'src/data/wikitip-leverage.json';

/** 몫. 밑이 0 이면 **0 이 아니라 null** */
export function 몫(a, b) {
  if (!b) return null;
  return +((100 * a) / b).toFixed(1);
}

/**
 * 절반을 채우는 데 몇 곳이 드나. **작을수록 몰린 것**이다.
 * ⛔ 한 작품에 회사가 여럿 붙으므로 **작품을 집합으로** 센다. 더해서 세면 절반을 넘겨 버린다.
 * @param 회사별작품 Map(회사 → Set(작품))
 * @param 전체작품수 그 해에 차트에 오른 작품 수
 */
export function 절반덮개(회사별작품, 전체작품수) {
  const s = [...회사별작품.values()].sort((a, b) => b.size - a.size);
  const 본 = new Set();
  let n = 0;
  for (const w of s) {
    n += 1;
    for (const t of w) 본.add(t);
    if (본.size * 2 >= 전체작품수) return n;
  }
  return n;
}

/**
 * 고르게 뿌렸다면 절반에 몇 곳이 들까 — **표본 크기가 만드는 착시를 뺀다.**
 * ⛔ 회사가 F곳이고 작품이 T편이면, 고르게일 때 한 곳이 T/F 편씩 갖는다.
 *    그러면 절반을 덮는 데 **F/2 곳**(올림)이 든다.
 * ⚠ 이것이 「몰림 0」의 자리다. 실제가 이보다 훨씬 작으면 몰린 것이다.
 */
export function 고른절반덮개(회사수) {
  if (!회사수) return null;
  return Math.ceil(회사수 / 2);
}

/**
 * 🔴 **절반덮개로는 추세를 말할 수 없다.** 그것은 3·4·5 같은 **정수**다.
 *    89.3% 와 88.5% 의 차이는 「3곳 중 28」과 「3곳 중 26」일 뿐 — **회사 수가 움직인 것**이지
 *    몰림이 움직인 것이 아닐 수 있다. 한 해에 한 칸씩만 움직이는 자로 다섯 해 추세를 재면 안 된다.
 * ⭐ 그래서 **연속으로 움직이는 자**를 하나 더 둔다 — 가장 큰 세 곳이 그 해 작품의 몇 %를 덮나.
 * ⛔ 이것도 회사 수에 흔들린다(회사가 적으면 셋이 더 많이 덮는다). 그래서 **고른 경우와 나눠서** 낸다.
 * @returns { 실제, 고르면, 배 } — 배가 1이면 고른 것과 같다. 클수록 몰린 것.
 */
export function 윗세곳(회사별작품, 전체작품수) {
  const 회사수 = 회사별작품.size;
  if (!회사수 || !전체작품수) return { 실제: null, 고르면: null, 배: null };
  const s = [...회사별작품.values()].sort((a, b) => b.size - a.size).slice(0, 3);
  const 본 = new Set();
  for (const w of s) for (const t of w) 본.add(t);
  const 실제 = +((100 * 본.size) / 전체작품수).toFixed(1);
  /* 고르게라면 셋이 3/F 를 덮는다. ⛔ 회사가 셋 이하면 셋이 전부다 — 100% */
  const 고르면 = +(100 * Math.min(3, 회사수) / 회사수).toFixed(1);
  return { 실제, 고르면, 배: 고르면 ? +(실제 / 고르면).toFixed(2) : null };
}

/**
 * 🔴🔴 **교란 자가 몇 편부터 쓸 만한가.**
 *    「기록이 꽉 찬 작품만」으로 갈랐더니 2025년이 **7편**이었다. 7편의 100% 는
 *    ⛔ **한 편이 뒤집히면 14%p 가 움직인다** — 내가 재려던 폭(8.8%p)보다 크다.
 *    그런 자로는 무엇도 못 가른다. 「100%」가 화면에 뜨면 발견처럼 읽히는데 발견이 아니다.
 * ⭐ 그래서 **한 편이 움직이는 폭이 재려는 폭보다 작아야** 쓴다 → 100/30 ≈ 3.3%p < 8.8%p.
 * ⚠ 이 문턱을 넘는 해가 하나도 없으면 **교란을 못 죽인 것이다.** 죽인 척하지 않는다.
 */
export const 꽉찬최소 = 30;

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    if (JSON.stringify(실제) === JSON.stringify(바람)) 통 += 1;
    else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  const 짓 = (...묶음) => new Map(묶음.map((w, i) => [`F${i}`, new Set(w)]));
  재본다('몫 — 밑이 0 이면 null', 몫(1, 0), null);
  재본다('한 곳이 절반을 덮는다', 절반덮개(짓(['a', 'b'], ['c'], ['d']), 4), 1);
  재본다('두 곳이 필요하다', 절반덮개(짓(['a'], ['b'], ['c'], ['d']), 4), 2);
  /* ⛔ 겹치는 작품을 두 번 세면 절반을 일찍 넘긴다 */
  재본다('겹치는 작품을 두 번 안 센다', 절반덮개(짓(['a', 'b'], ['a', 'b'], ['c'], ['d']), 4), 1);
  재본다('고른 경우 — 회사 10곳이면 5곳', 고른절반덮개(10), 5);
  재본다('고른 경우 — 홀수는 올린다', 고른절반덮개(9), 5);
  재본다('고른 경우 — 0곳이면 null', 고른절반덮개(0), null);
  /* 윗세곳 — 회사 6곳이 작품 6편을 하나씩. 고르므로 셋이 절반, 배는 1.00 */
  재본다('윗세곳 — 고르면 배가 1', 윗세곳(짓(['a'], ['b'], ['c'], ['d'], ['e'], ['f']), 6),
    { 실제: 50, 고르면: 50, 배: 1 });
  /* 몰린 경우 — 큰 셋이 6편 중 5편을 덮는다 */
  재본다('윗세곳 — 몰리면 배가 1보다 크다',
    윗세곳(짓(['a', 'b', 'c'], ['d'], ['e'], ['f'], ['a'], ['b']), 6),
    { 실제: 83.3, 고르면: 50, 배: 1.67 });
  /* ⛔ 겹치는 작품을 두 번 세면 100%를 넘는다 */
  재본다('윗세곳 — 겹침을 두 번 안 센다', 윗세곳(짓(['a', 'b'], ['a', 'b'], ['a', 'b']), 2),
    { 실제: 100, 고르면: 100, 배: 1 });
  /* ⛔ 회사가 셋 이하면 셋이 전부다 — 고르면도 100%라 배가 1이라야 한다 */
  재본다('윗세곳 — 회사가 둘이면 배가 1', 윗세곳(짓(['a'], ['b']), 2),
    { 실제: 100, 고르면: 100, 배: 1 });
  재본다('윗세곳 — 빈 것은 null', 윗세곳(new Map(), 0), { 실제: null, 고르면: null, 배: null });
  console.log(`지렛대 수집기 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  for (const p of [나라파일, 회사파일]) {
    if (!fs.existsSync(p)) {
      console.log(`⛔ 원자료가 없다 — ${p}`);
      console.log('   ⚠ archive/ 는 git 에 안 올라간다. 「안 됐다」가 아니라 **못 쟀다**.');
      process.exit(1);
    }
  }
  const ko = await koreanTitleFilter();
  const 회사자료 = JSON.parse(fs.readFileSync(회사파일, 'utf8'));

  /* 제목(소문자) → 붙은 회사들 · 방송사를 따로 본다 */
  const 제목회사 = new Map();
  const 제목방송 = new Map();
  /* 🔴 **기록이 얼마나 찼나**를 제목마다 들고 간다 — 아래 교란을 죽이는 데 쓴다 */
  const 제목역할 = new Map();
  for (const f of 회사자료.firms) {
    for (const w of f.works) {
      const k = String(w.title || '').toLowerCase();
      if (!k) continue;
      if (!제목회사.has(k)) 제목회사.set(k, new Set());
      제목회사.get(k).add(f.firm);
      if (!제목역할.has(k)) 제목역할.set(k, new Set());
      for (const r of (w.roles || [])) 제목역할.get(k).add(r);
      if ((w.roles || []).includes('첫방송')) {
        if (!제목방송.has(k)) 제목방송.set(k, new Set());
        제목방송.get(k).add(f.firm);
      }
    }
  }

  /* ── 해마다 — 차트에 오른 한국 시리즈와 그 회사 ── */
  const 해별 = new Map();
  let 줄 = 0;
  for (const l of fs.readFileSync(나라파일, 'utf8').split('\n')) {
    if (!l) continue;
    줄 += 1;
    let r;
    try { r = JSON.parse(l); } catch { continue; }
    if (r.구분 !== 'TV') continue;
    if (String(r.iso2).toUpperCase() === 'RU') continue;
    if (!ko.keepTitle(r.제목)) continue;
    const 해 = String(r.주).slice(0, 4);
    const 제목 = String(r.제목).toLowerCase();
    if (!해별.has(해)) 해별.set(해, { 작품: new Set(), 자리: 0, 주: new Set() });
    const y = 해별.get(해);
    y.작품.add(제목); y.자리 += 1; y.주.add(r.주);
  }

  const 해들 = [...해별.keys()].sort();
  const byYear = 해들.map((해) => {
    const y = 해별.get(해);
    const 회사별 = new Map();
    let 회사붙은작품 = 0;
    let 방송거친작품 = 0;
    let 역할칸합 = 0;
    /* ⭐ 교란을 죽이는 갈래 — **기록이 꽉 찬 작품만**(제작·배급·첫방송 중 둘 이상) */
    let 꽉찬작품 = 0;
    let 꽉찬중방송 = 0;
    for (const t of y.작품) {
      const fs2 = 제목회사.get(t);
      if (!fs2 || !fs2.size) continue;
      회사붙은작품 += 1;
      const 역할 = 제목역할.get(t) ?? new Set();
      역할칸합 += 역할.size;
      const 방송 = 제목방송.has(t);
      if (방송) 방송거친작품 += 1;
      /* ⛔ 「첫방송이 있으니 꽉 찼다」로 세면 **재려는 것으로 표본을 고르게 된다.**
       *    그래서 첫방송을 **뺀** 나머지 둘(제작·배급)이 다 있는 작품만 꽉 찼다고 본다. */
      if (역할.has('제작') && 역할.has('배급')) {
        꽉찬작품 += 1;
        if (방송) 꽉찬중방송 += 1;
      }
      for (const f of fs2) {
        if (!회사별.has(f)) 회사별.set(f, new Set());
        회사별.get(f).add(t);
      }
    }
    const 절반 = 회사붙은작품 ? 절반덮개(회사별, 회사붙은작품) : null;
    const 고른 = 고른절반덮개(회사별.size);
    const 셋 = 윗세곳(회사별, 회사붙은작품);
    return {
      year: 해,
      weeks: y.주.size,
      titles: y.작품.size,
      titlesWithFirm: 회사붙은작품,
      places: y.자리,
      firms: 회사별.size,
      halfTakesFirms: 절반,
      halfTakesIfEven: 고른,
      /* ⭐ 몰림 = 고른 경우보다 얼마나 적은 곳이 절반을 덮나 */
      concentrationPc: (절반 != null && 고른) ? +(100 * (1 - 절반 / 고른)).toFixed(1) : null,
      /* ⭐ 연속으로 움직이는 자 — 절반덮개가 정수라 못 잡는 것을 잡는다 */
      topThreePc: 셋.실제,
      topThreeIfEven: 셋.고르면,
      topThreeRatio: 셋.배,
      broadcastTitles: 방송거친작품,
      broadcastPc: 몫(방송거친작품, 회사붙은작품),
      /* 🔴 교란 재기 — 최근 작품일수록 위키데이터가 덜 찼다면 방송 하락은 **자의 결함**이다 */
      rolesPerTitle: 회사붙은작품 ? +(역할칸합 / 회사붙은작품).toFixed(2) : null,
      wellRecordedTitles: 꽉찬작품,
      broadcastPcWellRecorded: 몫(꽉찬중방송, 꽉찬작품),
    };
  });

  /* ── 스스로 본다 ── */
  if (!byYear.length) throw new Error('해를 하나도 못 갈랐다');
  for (const y of byYear) {
    if (y.titlesWithFirm > y.titles) throw new Error(`${y.year} — 회사 붙은 작품이 전체보다 많다`);
    if (y.broadcastTitles > y.titlesWithFirm) throw new Error(`${y.year} — 방송 거친 작품이 전체보다 많다`);
    if (y.halfTakesFirms != null && y.halfTakesFirms > y.firms) {
      throw new Error(`${y.year} — 절반 덮는 곳이 회사 수보다 많다`);
    }
    if (y.concentrationPc != null && (y.concentrationPc < 0 || y.concentrationPc > 100)) {
      throw new Error(`${y.year} — 몰림이 0~100 밖이다: ${y.concentrationPc}`);
    }
    if (y.topThreePc != null && (y.topThreePc < 0 || y.topThreePc > 100)) {
      throw new Error(`${y.year} — 윗세곳 몫이 0~100 밖이다: ${y.topThreePc}`);
    }
    if (y.wellRecordedTitles > y.titlesWithFirm) {
      throw new Error(`${y.year} — 기록이 꽉 찬 작품이 전체보다 많다`);
    }
  }
  /* ⛔ 첫 해와 마지막 해가 다 있어야 추세를 말할 수 있다 */
  const 첫 = byYear[0]; const 끝 = byYear[byYear.length - 1];
  if (!첫.concentrationPc || !끝.concentrationPc) throw new Error('양 끝 해의 몰림을 못 쟀다');

  /* 🔴 덜 찬 해 — 주가 40 아래면 반 해도 안 된 것이다 */
  const 덜찬해 = byYear.filter((y) => y.weeks < 40).map((y) => y.year);
  /* 🔴 교란 자가 설 수 있는 해가 있나. 없으면 **못 갈랐다**고 적는다 */
  const 교란쓸만한해 = byYear.filter((y) => y.wellRecordedTitles >= 꽉찬최소).map((y) => y.year);

  const 온전한 = byYear.filter((y) => y.weeks >= 40);
  const 온전첫 = 온전한[0]; const 온전끝 = 온전한[온전한.length - 1];

  const out = {
    generated: new Date().toISOString(),
    source: 'Netflix Top 10 (Tudum) weekly country lists for Korean series, joined to production company (P272), '
      + 'first broadcaster (P449) and distributor (P750) from Wikidata.',
    question: 'Production costs are reported to have risen roughly 27-fold in under a decade, and the argument '
      + 'that follows is that only a few buyers can now finance a Korean series. If that shifted power, the '
      + 'charts should show it. Did they?',
    unit: 'One year holds every Korean series that reached any country top 10 that year. "Half takes" is how '
      + 'many companies it takes to cover half of those titles, counting each title once however many companies '
      + 'are credited on it.',
    whyEvenComparison: 'Concentration looks stronger when there are fewer titles to spread around, and the '
      + 'number of Korean series charting changes every year. Each year is therefore also compared against what '
      + 'the same companies would produce if titles were shared out equally.',
    costClaim: {
      whatIsClaimed: 'Around $360,000 per episode in 2015 against roughly $9.8m per episode for Squid Game '
        + 'season 2 in 2024 — a 27-fold rise in under a decade.',
      whoseNumber: 'Reported by others. We did not measure it and do not hold production budgets of any kind.',
      whyItIsHere: 'It is the claim this page tests the consequence of, not evidence this page provides.',
    },
    rowsRead: 줄,
    yearsMeasured: byYear.length,
    partialYears: 덜찬해,
    byYear,
    firstFullYear: 온전첫.year,
    lastFullYear: 온전끝.year,
    concentrationFirst: 온전첫.concentrationPc,
    concentrationLast: 온전끝.concentrationPc,
    concentrationChange: +(온전끝.concentrationPc - 온전첫.concentrationPc).toFixed(1),
    /* ⛔ 「어느 해나 몇 배다」라고 쓰려면 **가장 낮은 해**를 재야 한다. 안 재고 쓰면 절대 문장이다 */
    topThreeMin: Math.min(...byYear.map((y) => y.topThreeRatio)),
    topThreeMinYear: byYear.reduce((a, b) => (b.topThreeRatio < a.topThreeRatio ? b : a)).year,
    topThreeFirst: 온전첫.topThreeRatio,
    topThreeLast: 온전끝.topThreeRatio,
    topThreeChange: +(온전끝.topThreeRatio - 온전첫.topThreeRatio).toFixed(2),
    broadcastFirst: 온전첫.broadcastPc,
    broadcastLast: 온전끝.broadcastPc,
    broadcastChange: +(온전끝.broadcastPc - 온전첫.broadcastPc).toFixed(1),
    rolesPerTitleFirst: 온전첫.rolesPerTitle,
    rolesPerTitleLast: 온전끝.rolesPerTitle,
    /* 🔴 교란 자가 섰나 못 섰나 — 지면이 이 값을 보고 말을 바꾼다 */
    confoundTestMinTitles: 꽉찬최소,
    confoundTestUsableYears: 교란쓸만한해,
    confoundTestRan: 교란쓸만한해.length > 0,
    broadcastVerdict: 교란쓸만한해.length > 0
      ? 'The confound test ran; see the well-recorded column.'
      : 'The share of charting titles that passed through a broadcaster falls from '
        + `${온전첫.broadcastPc}% to ${온전끝.broadcastPc}%, but recorded credits per title fall over the `
        + `same years (${온전첫.rolesPerTitle} to ${온전끝.rolesPerTitle}), so a title with no recorded `
        + 'broadcaster and a title that never had one look identical here. Restricting to titles whose '
        + `entry is demonstrably filled in leaves at most ${Math.max(...byYear.map((y) => y.wellRecordedTitles))} `
        + `titles in a year, and one title moves that figure by more than the decline being tested. We `
        + 'therefore cannot say whether this decline is real, and do not report it as a finding.',
    whyTwoConcentrationMeasures: 'How many companies cover half the titles can only move a whole company '
      + 'at a time, so it is too blunt to read a trend from. The share of titles covered by the three '
      + 'largest companies moves continuously, and is shown against what those three would cover if every '
      + 'company held an equal number.',
    whyWellRecordedColumn: 'A title counts as passing through a broadcaster only if Wikidata records one. '
      + 'If Wikidata simply fills in recent titles more slowly, that alone would produce a decline. The '
      + 'last column repeats the measurement on titles where both a production company and a distributor '
      + 'are recorded, so the entry is demonstrably filled in, and the broadcaster field is the only one '
      + 'in question.',
    cannotAnswer: 'This cannot say what anyone paid, what was commissioned, or who held the rights. Netflix '
      + 'publishes chart positions; it publishes no money at all. A shift in who appears on a chart is '
      + 'consistent with a shift in power and equally consistent with a change in taste.',
  };
  fs.writeFileSync(낼파일, `${JSON.stringify(out, null, 2)}\n`, 'utf8');

  const 부호 = (n) => (n > 0 ? `+${n}` : `${n}`);
  console.log(`줄 ${줄.toLocaleString('en-US')} · 해 ${byYear.length}`);
  console.log('해   주   작품  회사  절반  고르면  몰림    윗셋   배   역할/편  방송   꽉찬것만');
  for (const y of byYear) {
    console.log(`${y.year} ${String(y.weeks).padStart(3)} ${String(y.titlesWithFirm).padStart(5)} `
      + `${String(y.firms).padStart(5)} ${String(y.halfTakesFirms).padStart(4)} `
      + `${String(y.halfTakesIfEven).padStart(6)} ${String(y.concentrationPc).padStart(6)}% `
      + `${String(y.topThreePc).padStart(5)}% ${String(y.topThreeRatio).padStart(5)} `
      + `${String(y.rolesPerTitle).padStart(6)} ${String(y.broadcastPc).padStart(6)}% `
      + `${String(y.broadcastPcWellRecorded).padStart(7)}%${y.weeks < 40 ? '  ⚠ 덜 찬 해' : ''}`);
  }
  console.log(`\n온전한 해 ${온전첫.year} → ${온전끝.year}`);
  console.log(`  몰림(절반덮개)  ${out.concentrationFirst}% → ${out.concentrationLast}%  (${부호(out.concentrationChange)}%p)  ⚠ 정수라 무디다`);
  console.log(`  윗세곳 배        ${out.topThreeFirst} → ${out.topThreeLast}  (${부호(out.topThreeChange)})`);
  console.log(`  방송 거침        ${out.broadcastFirst}% → ${out.broadcastLast}%  (${부호(out.broadcastChange)}%p)`);
  console.log(`  역할/편          ${out.rolesPerTitleFirst} → ${out.rolesPerTitleLast}  ← 기록도 같이 줄었다`);
  console.log(out.confoundTestRan
    ? `  ⭐ 교란 자가 섰다 — ${교란쓸만한해.join(', ')}`
    : `  ⛔ 교란을 **못 갈랐다** — 꽉 찬 작품이 한 해 최대 ${Math.max(...byYear.map((y) => y.wellRecordedTitles))}편(문턱 ${꽉찬최소}). 방송 하락은 **안 낸다**`);
  console.log(`→ ${낼파일}`);
}
