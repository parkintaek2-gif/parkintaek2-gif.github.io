#!/usr/bin/env node
/**
 * **고른 열 장에만 넣을 자료** — 2번 지시(01:2x) 「530장 말고 열 장만 먼저 두껍게」.
 *
 * ── ⛔ 무엇을 넣고 무엇을 안 넣나 ──────────────────────────────
 * ⛔ **글자를 늘리지 않는다.** 넣는 것은 전부 원자료에서 **잰 것**이다.
 * ⛔ **파는 것을 안 내준다.** 여정표(유료)가 가진 것은 「작품마다 **주별 자취**」와
 *    「회사 카탈로그 전체 표」와 「안 오른 작품」이다. 그 셋은 여기 안 넣는다.
 *    ⭐ 여기 넣는 것은 **시장마다 접은 요약**이다 — 몇 번 올랐다 내렸나, 어느 자리에서 나갔나.
 *      주 하나하나를 늘어놓지 않는다. 그게 경계다.
 * ⛔ 열 장 **밖의 지면은 한 글자도 안 바꾼다.** 안 그러면 일주일 뒤 비교가 못 된다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { koreanTitleFilter } from './lib/korean-netflix-titles.mjs';
import { 지금 } from './_kst.mjs';

const 나라파일 = 'archive/raw/netflix-top10/countries.ndjson';
const 고른파일 = 'docs/5번-두껍게-열장.json';
const 제목파일 = 'src/data/wikitip-title-pages.json';
const 낼파일 = 'src/data/wikitip-deepened.json';

/**
 * 이어 붙은 주를 **구간**으로 가른다. 그 나라에 실제로 있는 주 차례에서 바로 다음인지를 본다.
 * ⛔ 「주 사이가 7일」로 세지 않는다 — 그 나라 차트가 통째로 빠진 주가 있으면 헛나뉜다.
 */
export function 구간들(있는주, 차례) {
  const 결과 = [];
  let 지금 = null;
  for (const w of 있는주) {
    const i = 차례.get(w);
    if (i == null) continue;
    if (지금 && i === 지금.끝차례 + 1) { 지금.끝 = w; 지금.끝차례 = i; 지금.주수 += 1; }
    else { 지금 = { 첫: w, 끝: w, 첫차례: i, 끝차례: i, 주수: 1 }; 결과.push(지금); }
  }
  return 결과;
}

/** 몫. 밑이 0 이면 **0 이 아니라 null** */
export function 몫(a, b) {
  if (!b) return null;
  return +((100 * a) / b).toFixed(1);
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    if (JSON.stringify(실제) === JSON.stringify(바람)) 통 += 1;
    else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  const 차례 = new Map([['w1', 0], ['w2', 1], ['w3', 2], ['w4', 3]]);
  재본다('이어진 것은 한 구간', 구간들(['w1', 'w2'], 차례).length, 1);
  재본다('끊기면 두 구간', 구간들(['w1', 'w3'], 차례).length, 2);
  재본다('구간의 주수', 구간들(['w1', 'w2', 'w3'], 차례)[0].주수, 3);
  /* ⛔ 그 나라에 w2 가 아예 없으면 w1→w3 은 끊긴 것이 아니다 */
  재본다('빠진 주는 끊김이 아니다', 구간들(['w1', 'w3'], new Map([['w1', 0], ['w3', 1]])).length, 1);
  재본다('빈 것', 구간들([], 차례), []);
  재본다('몫 — 밑이 0 이면 null', 몫(1, 0), null);
  console.log(`두껍게 하기 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  for (const p of [나라파일, 고른파일, 제목파일]) {
    if (!fs.existsSync(p)) {
      console.log(`⛔ 없다 — ${p}`);
      if (p === 나라파일) console.log('   ⚠ archive/ 는 git 에 안 올라간다. 「안 됐다」가 아니라 **못 쟀다**.');
      if (p === 고른파일) console.log('   먼저 이것을 부른다: node scripts/pick-deepen-ten.mjs');
      process.exit(1);
    }
  }
  const 고른 = JSON.parse(fs.readFileSync(고른파일, 'utf8'));
  const 제목자료 = JSON.parse(fs.readFileSync(제목파일, 'utf8'));
  const ko = koreanTitleFilter();

  /* 슬러그 → 제목 */
  const 슬러그제목 = new Map(제목자료.titles.map((t) => [t.slug, t.title]));
  const 볼제목 = new Map();
  for (const s of 고른.pickedSlugs) {
    const 제 = 슬러그제목.get(s);
    if (!제) throw new Error(`고른 슬러그가 자료에 없다: ${s}`);
    볼제목.set(제, s);
  }

  /* 원자료 한 번 읽기 */
  const 나라주 = new Map();
  const 담 = new Map();          /* `${slug}|${iso2}|${구분}|${시즌}` → { iso2, 국가, 순위: Map } */
  const 주별한국편수 = new Map(); /* `${iso2}|${주}` → 그 주 그 나라 한국 작품 수 */
  let 줄 = 0;
  for (const l of fs.readFileSync(나라파일, 'utf8').split('\n')) {
    if (!l) continue;
    줄 += 1;
    let r;
    try { r = JSON.parse(l); } catch { continue; }
    const iso2 = String(r.iso2).toUpperCase();
    if (iso2 === 'RU') continue;
    if (!나라주.has(iso2)) 나라주.set(iso2, new Set());
    나라주.get(iso2).add(r.주);
    if (!ko.keepTitle(r.제목)) continue;
    const 칸 = `${iso2}|${r.주}`;
    주별한국편수.set(칸, (주별한국편수.get(칸) ?? 0) + 1);
    const s = 볼제목.get(r.제목);
    if (!s) continue;
    /* ⛔ 열쇠에 구분·시즌을 넣는다 — 빠지면 한 주 top10 에 나란히 앉은 시즌이 뭉개진다 */
    const k = `${s}|${iso2}|${r.구분}|${r.시즌 ?? ''}`;
    if (!담.has(k)) 담.set(k, { slug: s, iso2, 국가: r.국가, 순위: new Map() });
    담.get(k).순위.set(r.주, r.순위);
  }

  const 작품별 = new Map(고른.pickedSlugs.map((s) => [s, new Map()]));
  for (const g of 담.values()) {
    const 정 = [...나라주.get(g.iso2)].sort();
    const 차례 = new Map(정.map((w, i) => [w, i]));
    const 있는주 = [...g.순위.keys()].sort();
    const 구간 = 구간들(있는주, 차례);
    const 시장들 = 작품별.get(g.slug);
    if (!시장들.has(g.국가)) {
      시장들.set(g.국가, { market: g.국가, iso2: g.iso2, runs: 0, places: 0, longestRun: 0, exits: [], stillOn: 0 });
    }
    const m = 시장들.get(g.국가);
    for (const c of 구간) {
      m.runs += 1;
      m.places += c.주수;
      if (c.주수 > m.longestRun) m.longestRun = c.주수;
      if (c.끝차례 >= 정.length - 1) { m.stillOn += 1; continue; }
      const 순 = g.순위.get(c.끝);
      if (순 >= 1 && 순 <= 10) m.exits.push(순);
    }
  }

  /* 그 작품이 차트에 있던 주에, 그 나라 차트에 한국 작품이 몇 편 더 있었나 */
  const 동무 = new Map();
  for (const g of 담.values()) {
    if (!동무.has(g.slug)) 동무.set(g.slug, { 주칸: 0, 남 : 0 });
    const a = 동무.get(g.slug);
    for (const w of g.순위.keys()) {
      const n = 주별한국편수.get(`${g.iso2}|${w}`) ?? 1;
      a.주칸 += 1;
      a.남 += Math.max(0, n - 1);
    }
  }

  const titles = 고른.picked.map((p) => {
    const 시장들 = [...작품별.get(p.slug).values()].sort((a, b) => b.places - a.places);
    const 총구간 = 시장들.reduce((s, m) => s + m.runs, 0);
    const 돌아온시장 = 시장들.filter((m) => m.runs > 1).length;
    const 나간것 = 시장들.flatMap((m) => m.exits);
    const a = 동무.get(p.slug) ?? { 주칸: 0, 남: 0 };
    return {
      slug: p.slug,
      title: p.title,
      pairedWith: p.pairedWith,
      byMarketRuns: 시장들.map((m) => ({
        market: m.market,
        runs: m.runs,
        places: m.places,
        longestRun: m.longestRun,
        /* ⛔ 여러 번이면 자리를 하나로 안 접는다. 「나간 자리들」을 그대로 적는다 */
        leftFrom: m.exits.length ? m.exits.join(', ') : null,
        stillOn: m.stillOn,
      })),
      totalRuns: 총구간,
      marketsWithReturn: 돌아온시장,
      exitsCounted: 나간것.length,
      exitBottomThree: 나간것.filter((n) => n >= 8).length,
      companionAvg: a.주칸 ? +(a.남 / a.주칸).toFixed(2) : null,
      companionWeeksAlone: null,
    };
  });

  /* 혼자였던 칸 수 — 위에서 못 세니 다시 센다 */
  for (const t of titles) {
    let 혼자 = 0; let 칸 = 0;
    for (const g of 담.values()) {
      if (g.slug !== t.slug) continue;
      for (const w of g.순위.keys()) {
        칸 += 1;
        if ((주별한국편수.get(`${g.iso2}|${w}`) ?? 1) <= 1) 혼자 += 1;
      }
    }
    t.companionWeeksAlone = 몫(혼자, 칸);
  }

  /* ── 스스로 본다 ── */
  if (titles.length !== 고른.pickedSlugs.length) throw new Error('고른 수와 만든 수가 다르다');
  const 원 = new Map(제목자료.titles.map((t) => [t.slug, t]));
  for (const t of titles) {
    const o = 원.get(t.slug);
    const 자리합 = t.byMarketRuns.reduce((s, m) => s + m.places, 0);
    if (자리합 !== o.places) throw new Error(`${t.slug}: 자리 합 ${자리합} 이 원래 ${o.places} 와 다르다`);
    if (t.byMarketRuns.length !== o.markets) throw new Error(`${t.slug}: 시장 수가 원래와 다르다`);
    if (t.totalRuns < t.byMarketRuns.length) throw new Error(`${t.slug}: 구간이 시장보다 적다`);
    if (t.exitBottomThree > t.exitsCounted) throw new Error(`${t.slug}: 아래 셋이 나간 것보다 많다`);
    for (const m of t.byMarketRuns) {
      if (m.longestRun > m.places) throw new Error(`${t.slug}/${m.market}: 가장 긴 구간이 자리보다 크다`);
    }
  }

  /*
   * ⛔ **왜 골랐나·언제 색인을 셌나·후보가 몇이었나는 여기 안 담는다.**
   *   이 파일은 지면이 읽는 **공개 자료**다. 실험 내막을 담으면 지면이 그것까지 화면에 적어야 하고
   *   (자가 「세어 두고 안 보여 준다」로 선다), 손님 화면에 우리 사정을 늘어놓게 된다.
   *   ⭐ 고른 기록은 `docs/5번-두껍게-열장.json` 에 그대로 있다. 그쪽이 실험 기록이다.
   * ⛔ `titles` 배열도 안 담는다 — `bySlug` 와 같은 것을 두 번 담는 꼴이라 언젠가 둘이 어긋난다.
   */
  const out = {
    generated: 지금(),
    whatIsStillOnlyInTheSheet: 'The week-by-week path of a title, the full company catalogue table and the '
      + 'titles that never charted remain in the company sheet. What is here is the per-market summary: '
      + 'how many separate runs, the longest, and the position each run ended from.',
    rowsRead: 줄,
    bySlug: Object.fromEntries(titles.map((t) => [t.slug, t])),
  };
  fs.writeFileSync(낼파일, `${JSON.stringify(out, null, 2)}\n`, 'utf8');

  console.log(`줄 ${줄.toLocaleString('en-US')} · 두껍게 할 ${titles.length}장\n`);
  console.log('작품                              시장  구간  돌아온 시장  나간 것  아래셋  같은 주 다른 한국 작품  혼자였던 칸');
  for (const t of titles) {
    console.log(`${t.slug.padEnd(33)} ${String(t.byMarketRuns.length).padStart(4)} ${String(t.totalRuns).padStart(5)} ${String(t.marketsWithReturn).padStart(11)} ${String(t.exitsCounted).padStart(8)} ${String(t.exitBottomThree).padStart(7)} ${String(t.companionAvg).padStart(21)} ${String(t.companionWeeksAlone).padStart(12)}%`);
  }
  console.log(`→ ${낼파일}`);
}
