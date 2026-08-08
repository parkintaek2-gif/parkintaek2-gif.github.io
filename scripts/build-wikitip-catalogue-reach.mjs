#!/usr/bin/env node
/**
 * **카탈로그가 커지면 작품 하나가 더 멀리 가나.** (57편째 기사와 `/catalogue-reach` 의 표)
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 55편째에서 「몇 곳이 절반을 채우나」를 냈다. 그건 **수**의 이야기였다.
 * 파는 자료(「내 작품 여정표」)를 사는 쪽이 실제로 묻는 것은 다른 것이다 —
 * **작품을 더 만들면 한 편이 더 멀리 가나.** 답이 「아니오」면 여정표는 크기로 짐작할 수 없고,
 * 그러면 회사마다 **재 봐야** 한다. 그게 파는 물건의 값이다.
 *
 * ── ⛔ 조심하는 것 ────────────────────────────────────────────
 * · **줄세우지 않는다.** 「어느 회사가 제일 멀리 가나」를 안 낸다. 크기 띠로 나란히 놓는다.
 * · **가운데값과 평균을 같이** 낸다. 한 편이 크게 터지면 평균만 올라간다. 둘이 어긋나면 그걸 적는다.
 * · **한 편짜리 회사는 따로 센다.** 1 → 2 편의 뜀은 **고른 탓**일 수 있다 —
 *   차트에 한 편이라도 오른 회사만 여기 있으므로, 두 편째가 오른 회사는 이미 다른 회사다.
 *   ⛔ 그 뜀을 「두 번째 작품의 값」이라고 부르지 않는다.
 * · 「멀리 갔다=인기」가 아니다. 우리가 본 것은 **차트에 걸린 나라 수**뿐이다.
 * · 회사가 붙은 작품이 901편 중 535편뿐이다. **덮는 몫을 지면이 말한다.**
 *
 * 결과 → src/data/wikitip-catalogue-reach.json
 * 쓰는 법: node scripts/build-wikitip-catalogue-reach.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const 나라판 = 'archive/raw/netflix-top10/countries.ndjson';
const 회사판 = 'archive/raw/netflix-top10/firm-works.json';
const 낼곳 = 'src/data/wikitip-catalogue-reach.json';

/** 크기 띠. 아래·위 다 포함 */
export const 띠정의 = [
  { key: '2', label: '2 titles', 아래: 2, 위: 2 },
  { key: '3-4', label: '3–4 titles', 아래: 3, 위: 4 },
  { key: '5-9', label: '5–9 titles', 아래: 5, 위: 9 },
  { key: '10-19', label: '10–19 titles', 아래: 10, 위: 19 },
  { key: '20+', label: '20 or more', 아래: 20, 위: Infinity },
];

/** 가운데값. 빈 것은 **0 이 아니라 null** 이다 */
export function 가운데값(a) {
  if (!a.length) return null;
  const v = [...a].sort((x, y) => x - y);
  const m = v.length % 2 ? v[(v.length - 1) / 2] : (v[v.length / 2 - 1] + v[v.length / 2]) / 2;
  return +m.toFixed(1);
}

/** 평균. 빈 것은 null */
export function 평균(a) {
  if (!a.length) return null;
  return +(a.reduce((s, x) => s + x, 0) / a.length).toFixed(1);
}

/**
 * 피어슨 상관. 어느 한쪽이 **꼼짝 않으면** 0 이 아니라 null 이다 —
 * 0 이라고 적으면 「관계가 없다」로 읽히는데, 사실은 **못 잰 것**이다.
 */
export function 상관(a, b) {
  if (a.length !== b.length || a.length < 3) return null;
  const n = a.length;
  const ma = a.reduce((s, x) => s + x, 0) / n;
  const mb = b.reduce((s, x) => s + x, 0) / n;
  let c = 0; let va = 0; let vb = 0;
  for (let i = 0; i < n; i += 1) { c += (a[i] - ma) * (b[i] - mb); va += (a[i] - ma) ** 2; vb += (b[i] - mb) ** 2; }
  if (!va || !vb) return null;
  return +(c / Math.sqrt(va * vb)).toFixed(3);
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통과 = 0; let 실패 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    const ok = typeof 바람 === 'function' ? 바람(실제) : JSON.stringify(실제) === JSON.stringify(바람);
    if (ok) 통과 += 1; else { 실패 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  재본다('가운데값 — 홀수', 가운데값([3, 1, 2]), 2);
  재본다('가운데값 — 짝수', 가운데값([1, 2, 3, 4]), 2.5);
  재본다('가운데값 — 빈 것은 null', 가운데값([]), null);
  재본다('평균', 평균([1, 2, 4]), 2.3);
  재본다('상관 — 딱 오르면 1', 상관([1, 2, 3], [2, 4, 6]), 1);
  재본다('상관 — 딱 내리면 -1', 상관([1, 2, 3], [6, 4, 2]), -1);
  /* ⛔ 이 두 줄이 이 함수의 요점이다 — 못 잰 것을 0 으로 적지 않는다 */
  재본다('상관 — 한쪽이 꼼짝 않으면 null', 상관([1, 1, 1], [1, 2, 3]), null);
  재본다('상관 — 셋보다 적으면 null', 상관([1, 2], [1, 2]), null);
  console.log(`자가시험 ${통과} 통과 · ${실패} 실패`);
  process.exit(실패 ? 1 : 0);
}

if (내가실행됐다) {
  await 만들기();
}

export async function 만들기() {
  const F = JSON.parse(fs.readFileSync(회사판, 'utf8'));

  /** 작품 → 닿은 시장 */
  const 닿음 = new Map();
  const rl = readline.createInterface({ input: fs.createReadStream(나라판), crlfDelay: Infinity });
  for await (const 줄 of rl) {
    if (!줄.trim()) continue;
    let r;
    try { r = JSON.parse(줄); } catch { continue; }
    if (r.iso2 === 'RU') continue; // 넷플릭스가 러시아에서 나갔다. 다른 지면과 같게 뺀다
    if (!닿음.has(r.제목)) 닿음.set(r.제목, new Set());
    닿음.get(r.제목).add(r.iso2);
  }

  const 회사들 = [];
  for (const f of F.firms) {
    const ts = f.works.map((w) => w.title).filter((t) => 닿음.has(t));
    if (!ts.length) continue;
    const 시장 = new Set();
    for (const t of ts) for (const c of 닿음.get(t)) 시장.add(c);
    회사들.push({
      firm: f.firm,
      grade: f.grade,
      titles: ts.length,
      markets: 시장.size,
      perTitle: +(ts.reduce((s, t) => s + 닿음.get(t).size, 0) / ts.length).toFixed(1),
    });
  }

  const 둘이상 = 회사들.filter((x) => x.titles >= 2);
  const 한편 = 회사들.filter((x) => x.titles === 1);

  const bands = 띠정의.map((b) => {
    const g = 둘이상.filter((x) => x.titles >= b.아래 && x.titles <= b.위);
    return {
      key: b.key,
      label: b.label,
      firms: g.length,
      perTitleMedian: 가운데값(g.map((x) => x.perTitle)),
      perTitleMean: 평균(g.map((x) => x.perTitle)),
      totalMarketsMedian: 가운데값(g.map((x) => x.markets)),
      titlesMedian: 가운데값(g.map((x) => x.titles)),
    };
  });

  /* 크기는 로그로 본다 — 2편과 4편의 차이가 20편과 22편의 차이보다 크다 */
  const 로그크기 = 둘이상.map((x) => Math.log(x.titles));
  const rPerTitle = 상관(로그크기, 둘이상.map((x) => x.perTitle));
  const rTotal = 상관(로그크기, 둘이상.map((x) => x.markets));

  const grades = ['A', 'B', 'C'].map((G) => {
    const g = 회사들.filter((x) => x.grade === G);
    return {
      grade: G,
      firms: g.length,
      titlesMedian: 가운데값(g.map((x) => x.titles)),
      marketsMedian: 가운데값(g.map((x) => x.markets)),
      perTitleMedian: 가운데값(g.map((x) => x.perTitle)),
    };
  });

  /* ── 스스로 본다 ── */
  if (bands.reduce((s, b) => s + b.firms, 0) !== 둘이상.length) throw new Error('띠에 담긴 회사 수 합이 안 맞는다');
  if (한편.length + 둘이상.length !== 회사들.length) throw new Error('한 편짜리 + 두 편 이상이 전체와 다르다');
  for (const x of 회사들) {
    if (x.perTitle > 93) throw new Error(`${x.firm}: 편당 시장이 93 을 넘는다`);
    if (x.markets > 93) throw new Error(`${x.firm}: 닿은 시장이 93 을 넘는다`);
    if (x.titles > 1 && x.markets < x.perTitle) throw new Error(`${x.firm}: 총 도달이 편당보다 작다`);
  }
  /* ⛔ 기사 요지 — 뒤집히면 기사를 다시 쓴다.
     ① 편당 도달은 크기와 **관계가 없어야** 한다 ② 총 도달은 **올라가야** 한다
     ③ 띠들의 편당 가운데값이 **평평해야** 한다 */
  if (rPerTitle == null || Math.abs(rPerTitle) > 0.25) {
    throw new Error(`편당 도달과 크기의 상관이 ${rPerTitle} 다 — 「관계가 없다」를 못 쓴다`);
  }
  if (rTotal == null || rTotal < 0.3) {
    throw new Error(`총 도달과 크기의 상관이 ${rTotal} 다 — 대비가 사라진다`);
  }
  const 편당들 = bands.filter((b) => b.firms > 0).map((b) => b.perTitleMedian);
  const 폭 = Math.max(...편당들) - Math.min(...편당들);
  if (폭 > 6) throw new Error(`띠별 편당 가운데값이 ${폭.toFixed(1)} 만큼 벌어진다 — 「평평하다」가 안 선다`);

  const out = {
    generated: new Date().toISOString(),
    source: 'Netflix Top 10 (Tudum) weekly country lists for reach; Wikidata production, broadcaster and distributor credits for which company is attached to which title, retrieved by item number rather than by name',
    question: 'Does a company with more charting titles get more countries out of each one?',
    unit: 'Reach is the number of markets in which a title appeared in a weekly top 10 at least once, out of 93. Per-title reach is a company\'s mean across its own charting titles; total reach is the union of the markets its titles reached, so it cannot exceed 93.',
    /** ⛔ 지면이 이 문장을 그대로 싣는다 */
    cannotAnswer: 'Reach counts countries, not viewers. A title that charted for one week in 40 markets and a title that led 40 markets for a year both count as 40. These figures also say nothing about why a catalogue travels — budget, cast, release timing and the deal behind the title are all invisible here.',
    firmsTotal: F.회사수,
    firmsWithCharting: 회사들.length,
    titlesAsked: F.물은작품,
    titlesWithFirm: F.회사붙은작품,
    firmCoveragePc: +((100 * F.회사붙은작품) / F.물은작품).toFixed(1),
    marketCount: 93,
    singleTitleFirms: {
      firms: 한편.length,
      perTitleMedian: 가운데값(한편.map((x) => x.perTitle)),
      reachedOneMarketOnly: 한편.filter((x) => x.markets === 1).length,
      biggest: Math.max(...한편.map((x) => x.markets)),
    },
    multiTitleFirms: 둘이상.length,
    rPerTitle,
    rTotal,
    bands,
    grades,
  };
  fs.writeFileSync(낼곳, JSON.stringify(out, null, 1));

  console.log(`차트에 오른 작품을 가진 회사 ${out.firmsWithCharting}곳 / 전체 ${out.firmsTotal}곳 · 회사가 붙은 작품 ${out.titlesWithFirm}/${out.titlesAsked} (${out.firmCoveragePc}%)`);
  console.log(`  크기 ↔ **편당** 닿은 시장  r = ${out.rPerTitle}   ← 관계가 없다`);
  console.log(`  크기 ↔ **총** 닿은 시장    r = ${out.rTotal}   ← 올라간다`);
  console.log('  크기 띠        회사수 · 편당 가운데값 · 편당 평균 · 총 도달 가운데값');
  for (const b of bands) {
    console.log(`  ${b.label.padEnd(14)} ${String(b.firms).padStart(3)}곳 ·`
      + ` ${String(b.perTitleMedian).padStart(6)} · ${String(b.perTitleMean).padStart(6)} · ${String(b.totalMarketsMedian).padStart(5)}`);
  }
  console.log(`  ⚠ 한 편짜리 ${out.singleTitleFirms.firms}곳 — 편당 가운데값 ${out.singleTitleFirms.perTitleMedian} · 한 곳에만 닿은 회사 ${out.singleTitleFirms.reachedOneMarketOnly}곳 · 가장 멀리 간 한 편 ${out.singleTitleFirms.biggest}곳`);
  console.log(`→ ${낼곳}`);
}
