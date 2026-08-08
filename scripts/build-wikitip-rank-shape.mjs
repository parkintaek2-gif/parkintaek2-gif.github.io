#!/usr/bin/env node
/**
 * **차트에 오르는 것과 꼭대기에 서는 것은 다른 일인가.** (56편째 기사와 `/rank-shape` 의 표)
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 지금까지 우리는 늘 **몫**만 냈다 — 「이 나라 차트 자리의 몇 %가 한국 것인가」.
 * 그런데 차트에는 **자리마다 순위가 있다.** 1위 칸의 한국 몫과 10위 칸의 한국 몫이
 * 같아야 할 까닭은 없다. 같은지 물어본 적이 없어서 물어본다.
 *
 * ── ⛔ 조심하는 것 ────────────────────────────────────────────
 * · **한 작품이 끄는 것**을 먼저 의심한다. 1위 칸은 자리가 열 배 적어 한 작품이 모양을 만든다.
 *   그래서 띠마다 **서로 다른 작품 수**와 **가장 큰 작품의 몫**을 같이 낸다.
 * · **영화와 시리즈는 차트가 따로다.** 합쳐 놓으면 둘 중 하나가 모양을 지배해도 안 보인다.
 *   갈래를 갈라서도 같은 모양이 나오는지 본다. 안 나오면 기사를 다시 쓴다.
 * · **곳수가 아니라 방향도 센다.** 띠 평균이 낮아도 그건 몇 곳이 크게 낮아서일 수 있다.
 *   띠마다 「1위 몫이 전체 몫보다 낮은 시장이 몇 곳인가」를 같이 낸다.
 * · 「한국 작품이 1위감이 아니다」라 안 쓴다. 우리가 본 것은 **차트에 실린 순위뿐**이다.
 *   왜 그 자리인지는 이 자료로 못 답한다.
 * · 띠는 **그 시장의 전체 한국 몫**으로 가른다 — 나라 이름이나 지역으로 가르지 않는다.
 *
 * 결과 → src/data/wikitip-rank-shape.json
 * 쓰는 법: node scripts/build-wikitip-rank-shape.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { koreanTitleFilter } from './lib/korean-netflix-titles.mjs';

const 나라판 = 'archive/raw/netflix-top10/countries.ndjson';
const 낼곳 = 'src/data/wikitip-rank-shape.json';

/** 띠 — 그 시장의 전체 한국 몫으로 가른다. 아래는 포함, 위는 안 포함 */
export const 띠정의 = [
  { key: 'under5', label: 'Under 5%', 아래: 0, 위: 5 },
  { key: '5to10', label: '5–10%', 아래: 5, 위: 10 },
  { key: '10to20', label: '10–20%', 아래: 10, 위: 20 },
  { key: 'over20', label: '20% and over', 아래: 20, 위: Infinity },
];

/** 몫. 칸이 0 이면 **0 이 아니라 null** 이다 */
export function 몫(자리, 칸) {
  if (!칸) return null;
  return +((100 * 자리) / 칸).toFixed(1);
}

/** 두 몫의 차이(포인트). 어느 하나가 null 이면 null */
export function 차이(뒤, 앞) {
  if (뒤 == null || 앞 == null) return null;
  return +(뒤 - 앞).toFixed(1);
}

/** 전체 몫이 pc 인 시장은 어느 띠인가 */
export function 띠고르기(pc) {
  if (pc == null) return null;
  const t = 띠정의.find((b) => pc >= b.아래 && pc < b.위);
  return t ? t.key : null;
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통과 = 0; let 실패 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    const ok = typeof 바람 === 'function' ? 바람(실제) : JSON.stringify(실제) === JSON.stringify(바람);
    if (ok) 통과 += 1; else { 실패 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  재본다('몫 — 보통', 몫(25, 200), 12.5);
  재본다('몫 — 칸이 0 이면 null', 몫(0, 0), null);
  재본다('차이 — 보통', 차이(35.3, 26.7), 8.6);
  재본다('차이 — 한쪽이 null 이면 null', 차이(null, 3), null);
  재본다('띠고르기 — 경계는 위쪽 띠로', 띠고르기(5), '5to10');
  재본다('띠고르기 — 5 바로 아래는 아래 띠', 띠고르기(4.9), 'under5');
  재본다('띠고르기 — 20 이상은 마지막 띠', 띠고르기(43.1), 'over20');
  재본다('띠고르기 — null 은 null', 띠고르기(null), null);
  console.log(`자가시험 ${통과} 통과 · ${실패} 실패`);
  process.exit(실패 ? 1 : 0);
}

if (내가실행됐다) {
  await 만들기();
}

export async function 만들기() {
  const ko = koreanTitleFilter();
  /** iso2 → 시장 하나 */
  const 시장 = new Map();
  /** 나중에 띠를 알아야 셀 수 있는 것이 있어 원본을 한 번 더 본다 */
  const 행 = [];

  const 빈갈래 = () => ({
    // [한국, 전체] 를 순위 1..10 에 담는다. 0번 칸은 갈래 합계다
    순위: Array.from({ length: 11 }, () => [0, 0]),
  });

  const rl = readline.createInterface({ input: fs.createReadStream(나라판), crlfDelay: Infinity });
  for await (const 줄 of rl) {
    if (!줄.trim()) continue;
    let r;
    try { r = JSON.parse(줄); } catch { continue; }
    if (r.iso2 === 'RU') continue; // 넷플릭스가 러시아에서 나갔다. 다른 지면과 같게 뺀다
    if (!(r.순위 >= 1 && r.순위 <= 10)) continue;
    if (!시장.has(r.iso2)) {
      시장.set(r.iso2, { iso2: r.iso2, name: r.국가, 한국: 0, 전체: 0, Films: 빈갈래(), TV: 빈갈래() });
    }
    const m = 시장.get(r.iso2);
    const 한국인가 = ko.keepTitle(r.제목) ? 1 : 0;
    m.전체 += 1; m.한국 += 한국인가;
    const g = r.구분 === 'Films' ? 'Films' : 'TV';
    m[g].순위[r.순위][0] += 한국인가; m[g].순위[r.순위][1] += 1;
    m[g].순위[0][0] += 한국인가; m[g].순위[0][1] += 1;
    행.push({ iso2: r.iso2, 순위: r.순위, 구분: g, 제목: r.제목, 한국: 한국인가 });
  }

  const 시장들 = [...시장.values()].map((m) => ({ ...m, 몫: 몫(m.한국, m.전체) }));
  const 띠어디 = new Map(시장들.map((m) => [m.iso2, 띠고르기(m.몫)]));

  /** 한 무리(시장 여럿)에서 순위별 몫을 뽑는다. 갈래를 안 주면 영화+시리즈를 합친다 */
  const 순위줄 = (무리, 갈래) => {
    const 칸 = [];
    for (let r = 1; r <= 10; r += 1) {
      let a = 0; let b = 0;
      for (const m of 무리) {
        for (const g of 갈래 ? [갈래] : ['Films', 'TV']) { a += m[g].순위[r][0]; b += m[g].순위[r][1]; }
      }
      칸.push({ rank: r, korean: a, slots: b, pc: 몫(a, b) });
    }
    let a = 0; let b = 0;
    for (const m of 무리) {
      for (const g of 갈래 ? [갈래] : ['Films', 'TV']) { a += m[g].순위[0][0]; b += m[g].순위[0][1]; }
    }
    const 전체몫 = 몫(a, b);
    const 아래인곳 = 무리.filter((m) => {
      let ka = 0; let kb = 0; let oa = 0; let ob = 0;
      for (const g of 갈래 ? [갈래] : ['Films', 'TV']) {
        ka += m[g].순위[1][0]; kb += m[g].순위[1][1];
        oa += m[g].순위[0][0]; ob += m[g].순위[0][1];
      }
      const one = 몫(ka, kb); const all = 몫(oa, ob);
      return one != null && all != null && one < all;
    }).length;
    return {
      korean: a, slots: b, overallPc: 전체몫,
      rank1Pc: 칸[0].pc, rank10Pc: 칸[9].pc,
      gapPp: 차이(칸[0].pc, 전체몫),
      belowAtOne: 아래인곳,
      byRank: 칸,
    };
  };

  /** 한 무리의 1위 칸을 어떤 작품들이 잡았나 */
  const 일위작품 = (키집합) => {
    const 셈 = new Map();
    let 칸 = 0;
    for (const r of 행) {
      if (!키집합.has(r.iso2) || r.순위 !== 1) continue;
      칸 += 1;
      if (r.한국) 셈.set(r.제목, (셈.get(r.제목) || 0) + 1);
    }
    const 큰 = [...셈].sort((a, b) => b[1] - a[1]);
    const 합 = 큰.reduce((s, x) => s + x[1], 0);
    return { 칸, 합, 편수: 큰.length, 큰 };
  };

  const bands = 띠정의.map((b) => {
    const 무리 = 시장들.filter((m) => 띠어디.get(m.iso2) === b.key);
    const 합 = 순위줄(무리);
    const 일 = 일위작품(new Set(무리.map((m) => m.iso2)));
    const 셋 = 일.큰.slice(0, 3).reduce((s, x) => s + x[1], 0);
    /** 시장마다 「1위 칸을 잡은 서로 다른 한국 작품 수」 — 띠 평균 */
    const 곳별편수 = 무리.map((m) => 일위작품(new Set([m.iso2])).편수);
    return {
      key: b.key,
      label: b.label,
      markets: 무리.length,
      marketNames: 무리.map((m) => m.name).sort((x, y) => x.localeCompare(y)),
      ...합,
      films: 순위줄(무리, 'Films'),
      tv: 순위줄(무리, 'TV'),
      /** ⛔ 「한 작품이 끌었나」에 답하는 칸 */
      rank1Titles: {
        koreanWeeks: 일.합,
        distinctTitles: 일.편수,
        distinctPerMarketMean: +(곳별편수.reduce((s, x) => s + x, 0) / (무리.length || 1)).toFixed(1),
        biggestTitle: 일.큰.length ? 일.큰[0][0] : null,
        biggestWeeks: 일.큰.length ? 일.큰[0][1] : 0,
        biggestSharePc: 몫(일.큰.length ? 일.큰[0][1] : 0, 일.합),
        topThreeSharePc: 몫(셋, 일.합),
        /** 위 세 편을 뺀 1위 몫. 「그 셋을 빼면 어떻게 되나」에 답한다 */
        rank1PcWithoutTopThree: 몫(일.합 - 셋, 일.칸),
        topThree: 일.큰.slice(0, 3).map(([t, c]) => ({ title: t, weeks: c, sharePc: 몫(c, 일.합) })),
      },
    };
  });

  const 전체 = 순위줄(시장들);
  const 몫높은데낮은곳 = 시장들.filter((m) => {
    const one = 몫(m.Films.순위[1][0] + m.TV.순위[1][0], m.Films.순위[1][1] + m.TV.순위[1][1]);
    return one != null && m.몫 != null && one < m.몫;
  }).length;

  /* ── 스스로 본다 ── */
  if (bands.reduce((s, b) => s + b.markets, 0) !== 시장들.length) throw new Error('띠에 담긴 시장 수 합이 전체와 다르다');
  for (const b of bands) {
    if (b.byRank.length !== 10) throw new Error(`${b.label}: 순위 칸이 10개가 아니다`);
    const 칸합 = b.byRank.reduce((s, x) => s + x.slots, 0);
    const 한합 = b.byRank.reduce((s, x) => s + x.korean, 0);
    if (칸합 !== b.slots) throw new Error(`${b.label}: 순위별 칸 합 ${칸합} 이 띠 전체 ${b.slots} 와 다르다`);
    if (한합 !== b.korean) throw new Error(`${b.label}: 순위별 한국 합 ${한합} 이 띠 전체 ${b.korean} 와 다르다`);
    if (b.films.slots + b.tv.slots !== b.slots) throw new Error(`${b.label}: 영화+시리즈 칸이 합과 다르다`);
    if (b.rank1Titles.koreanWeeks !== b.byRank[0].korean) throw new Error(`${b.label}: 1위 작품 셈이 순위표와 다르다`);
  }
  /* ⛔ 기사 요지 — 뒤집히면 기사를 다시 쓴다.
     ① 가운데 두 띠는 1위에서 **낮아야** 한다 ② 맨 위 띠는 1위에서 **높아야** 하고
     ③ 그것이 한 작품 때문이면 안 된다 ④ 맨 아래 띠의 1위는 큰 작품 셋을 빼면 무너져야 한다 */
  const 가운데 = bands.filter((b) => b.key === '5to10' || b.key === '10to20');
  for (const b of 가운데) {
    if (!(b.gapPp < 0)) throw new Error(`${b.label}: 1위 몫이 전체보다 낮지 않다(${b.gapPp}p) — 「가운데에 산다」가 안 선다`);
    if (!(b.tv.gapPp < 0 && b.films.gapPp < 0)) throw new Error(`${b.label}: 갈래를 갈랐더니 한쪽이 뒤집힌다 — 합친 표만 보고 쓰면 안 된다`);
  }
  const 위 = bands.find((b) => b.key === 'over20');
  if (!(위.gapPp > 0)) throw new Error('20%+ 띠에서 1위 몫이 전체보다 높지 않다 — 기사의 대비가 사라진다');
  if (위.belowAtOne !== 0) throw new Error(`20%+ 띠에 1위가 더 낮은 시장이 ${위.belowAtOne}곳 있다 — 「열 곳 모두」를 못 쓴다`);
  if (!(위.rank1Titles.biggestSharePc < 15)) throw new Error(`20%+ 띠 1위를 한 작품이 ${위.rank1Titles.biggestSharePc}% 잡았다 — 한 작품이 끈 것이다`);
  const 아래 = bands.find((b) => b.key === 'under5');
  if (!(아래.rank1Titles.rank1PcWithoutTopThree < 아래.overallPc)) {
    throw new Error('맨 아래 띠에서 큰 세 편을 빼도 1위 몫이 전체보다 높다 — 「한 작품이 만든 예외」가 안 선다');
  }

  const out = {
    generated: new Date().toISOString(),
    source: 'Netflix Top 10 (Tudum) weekly country lists; Korean titles identified via Wikidata country of origin (P495 = Q884) and by Wikidata item number where we hold one',
    question: 'A chart place is a chart place — but is a Korean title as likely to be at number one as to be anywhere on the list?',
    unit: 'Every market hands out the same number of places at every rank: one film slot and one series slot at rank 1 each week, and the same at rank 10. Share at a rank is Korean places at that rank divided by all places at that rank.',
    /** ⛔ 이 문장을 지면이 그대로 싣는다. 이 자료가 못 답하는 것 */
    cannotAnswer: 'A rank is an outcome, not an explanation. These figures cannot say whether a title placed lower because fewer people watched it, because it arrived in a crowded week, or because it was released with less promotion. Netflix publishes the position and, for some weeks, hours viewed — not the reason.',
    markets: 시장들.length,
    ranks: 10,
    slotsTotal: 전체.slots,
    overallPc: 전체.overallPc,
    rank1Pc: 전체.rank1Pc,
    rank10Pc: 전체.rank10Pc,
    marketsBelowAtOne: 몫높은데낮은곳,
    bands,
  };
  fs.writeFileSync(낼곳, JSON.stringify(out, null, 1));

  console.log(`시장 ${out.markets}곳 · 자리 ${out.slotsTotal.toLocaleString()}개 — 전체 몫 ${out.overallPc}% · 1위 칸 ${out.rank1Pc}% · 10위 칸 ${out.rank10Pc}%`);
  console.log(`  1위 몫이 전체 몫보다 낮은 시장: ${out.marketsBelowAtOne} / ${out.markets}`);
  console.log('  띠      곳수 |  1위   2위   3위   4위   5위   6위   7위   8위   9위  10위 | 전체 | 1위-전체 | 낮은곳');
  for (const b of bands) {
    console.log(`  ${b.label.padEnd(12)} ${String(b.markets).padStart(3)}곳 |`
      + ` ${b.byRank.map((x) => String(x.pc).padStart(5)).join(' ')} |`
      + ` ${String(b.overallPc).padStart(5)} | ${(b.gapPp > 0 ? '+' : '') + b.gapPp}p`.padEnd(11)
      + ` | ${b.belowAtOne}/${b.markets}`);
  }
  console.log('  「한 작품이 끌었나」 —');
  for (const b of bands) {
    const t = b.rank1Titles;
    console.log(`    ${b.label.padEnd(12)} 서로 다른 ${String(t.distinctTitles).padStart(3)}편 · 곳당 평균 ${String(t.distinctPerMarketMean).padStart(5)}편`
      + ` · 가장 큰 것 ${String(t.biggestTitle).slice(0, 20).padEnd(22)} ${String(t.biggestSharePc).padStart(5)}%`
      + ` · 위 셋 빼면 1위 몫 ${t.rank1PcWithoutTopThree}%`);
  }
  console.log(`→ ${낼곳}`);
}
