#!/usr/bin/env node
/**
 * 순위가 시청을 얼마나 말해 주나 — **우리가 파는 물건의 값어치를 스스로 잰다.**
 *
 * ⛔ 왜 이걸 재나 ─────────────────────────────────────────────
 *   우리가 파는 자료는 **나라별 순위**다. 넷플릭스는 나라 차트에 시청시간을 **한 줄도** 안 준다
 *   (493,600줄 중 0줄). 그런데 **세계 차트에는 준다**(10,600줄 전부).
 *   ⭐ 그러니 세계 차트로 「순위를 알면 시청을 얼마나 아는가」를 잴 수 있고,
 *      그 답이 곧 **우리 물건이 무엇을 못 말하는지**다.
 *
 * ⛔ 이 자가 지키는 것 ───────────────────────────────────────────
 * ⛔ **우리에게 불리해도 낸다.** 순위가 시청을 잘 못 말하면 그렇게 적는다.
 * ⛔ **갈래를 고정한다.** Films/TV × English/Non-English 는 규모가 다르다.
 *    안 고정하면 갈래 차이를 순위 탓으로 읽는다.
 * ⛔ **순위표를 안 만든다.** 작품 이름을 안 낸다. 순위 칸의 성질만 본다.
 * ⚠ 세계 차트는 나라 차트가 아니다. 여기서 잰 것을 나라에 그대로 옮길 수 없다 — 그것도 적는다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 세계파일 = 'archive/raw/netflix-top10/global.ndjson';
const 나라파일 = 'archive/raw/netflix-top10/countries.ndjson';
const 낼파일 = 'src/data/wikitip-rank-tells.json';

/** 중앙값. 빈 것은 **0 이 아니라 null** */
export function 가운데(들) {
  if (!들.length) return null;
  const v = [...들].sort((a, b) => a - b);
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}

/** 분위. p 는 0~1 */
export function 분위(들, p) {
  if (!들.length) return null;
  const v = [...들].sort((a, b) => a - b);
  const i = Math.min(v.length - 1, Math.max(0, Math.round(p * (v.length - 1))));
  return v[i];
}

/**
 * 흩어짐 — **90분위 ÷ 10분위**. 「위아래가 몇 배 벌어지나」.
 * ⛔ 표준편차를 안 쓴다. 시청시간은 한쪽으로 길게 늘어진 분포라 평균이 가운데가 아니다.
 * ⛔ 밑이 0 이면 **1 이 아니라 null** — 「안 벌어졌다」가 아니라 못 쟀다.
 */
export function 벌어짐(들) {
  const 아래 = 분위(들, 0.1);
  const 위 = 분위(들, 0.9);
  if (아래 == null || !아래) return null;
  return +(위 / 아래).toFixed(2);
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    if (JSON.stringify(실제) === JSON.stringify(바람)) 통 += 1;
    else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  재본다('가운데 — 빈 것은 null', 가운데([]), null);
  재본다('가운데 — 홀수', 가운데([3, 1, 2]), 2);
  재본다('가운데 — 짝수', 가운데([1, 2, 3, 4]), 2.5);
  /* ⚠ 열 개짜리에서 0.9 분위는 자리 9(값 9)다 — 10 이 아니다.
     ⛔ 처음에 10 으로 적었다가 자가시험에 걸렸다. 자가 맞고 내 기대가 틀렸다. */
  재본다('분위 — 아래위', [분위([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 0.1),
    분위([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 0.9)], [2, 9]);
  재본다('벌어짐', 벌어짐([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), 4.5);
  /* ⛔ 밑이 0 이면 1 이 아니라 null */
  재본다('벌어짐 — 아래가 0 이면 null', 벌어짐([0, 0, 1, 2, 3]), null);
  재본다('벌어짐 — 빈 것은 null', 벌어짐([]), null);
  console.log(`순위가 말하는 것 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  for (const p of [세계파일, 나라파일]) {
    if (!fs.existsSync(p)) {
      console.log(`⛔ 원자료가 없다 — ${p}`);
      console.log('   ⚠ archive/ 는 git 에 안 올라간다. 「안 됐다」가 아니라 **못 쟀다**.');
      process.exit(1);
    }
  }

  /* ── ① 나라 차트에 시청 칸이 정말 하나도 없나. **없다고 단정하지 않고 센다** ── */
  let 나라줄 = 0; let 나라시청 = 0;
  for (const l of fs.readFileSync(나라파일, 'utf8').split('\n')) {
    if (!l) continue;
    나라줄 += 1;
    let r;
    try { r = JSON.parse(l); } catch { continue; }
    if (r.시청시간 != null || r.시청수 != null) 나라시청 += 1;
  }

  /* ── ② 세계 차트 — 갈래마다 순위별 시청시간 ── */
  const 갈래 = new Map();      // 구분 → Map(순위 → [시청시간])
  let 세계줄 = 0; let 시청있는줄 = 0;
  const 주모음 = new Set();
  for (const l of fs.readFileSync(세계파일, 'utf8').split('\n')) {
    if (!l) continue;
    세계줄 += 1;
    let r;
    try { r = JSON.parse(l); } catch { continue; }
    if (r.시청시간 == null) continue;
    시청있는줄 += 1;
    주모음.add(r.주);
    if (!갈래.has(r.구분)) 갈래.set(r.구분, new Map());
    const m = 갈래.get(r.구분);
    if (!m.has(r.순위)) m.set(r.순위, []);
    m.get(r.순위).push(r.시청시간);
  }

  const 갈래들 = [...갈래.keys()].sort();
  const byChart = 갈래들.map((c) => {
    const m = 갈래.get(c);
    const 전부 = [...m.values()].flat();
    const 순위별 = [...m.keys()].sort((a, b) => a - b).map((rk) => ({
      rank: rk,
      weeks: m.get(rk).length,
      medianHours: 가운데(m.get(rk)),
      spread: 벌어짐(m.get(rk)),
    }));
    const 일위 = 가운데(m.get(1) || []);
    const 십위 = 가운데(m.get(10) || []);
    return {
      chart: c,
      weeks: (m.get(1) || []).length,
      allSpread: 벌어짐(전부),
      /* ⭐ 순위를 알 때 남는 흩어짐 — 순위별 벌어짐의 가운데 */
      /* ⚠ 가운데() 가 짝수 개에서 평균을 내며 부동소수점 꼬리가 남는다(2.1900000000000004).
         지면이 그 꼬리를 그대로 찍으면 잰 것보다 정밀해 보인다. 두 자리로 자른다 */
      withinRankSpread: (() => {
        const v = 가운데(순위별.map((x) => x.spread).filter((x) => x != null));
        return v == null ? null : +v.toFixed(2);
      })(),
      medianTop: 일위,
      medianTenth: 십위,
      topOverTenth: 일위 && 십위 ? +(일위 / 십위).toFixed(2) : null,
      byRank: 순위별,
    };
  });

  /* ── 스스로 본다 ── */
  if (!세계줄) throw new Error('세계 차트를 한 줄도 못 읽었다');
  if (!byChart.length) throw new Error('갈래를 하나도 못 갈랐다');
  for (const c of byChart) {
    if (c.byRank.length !== 10) throw new Error(`${c.chart} 의 순위가 ${c.byRank.length}개다 — 열이 아니다`);
    /* ⛔ 순위가 낮을수록 시청이 적어야 한다. 뒤집혀 있으면 칸을 잘못 읽은 것이다 */
    if (!(c.medianTop > c.medianTenth)) {
      throw new Error(`${c.chart} — 1위 중앙값이 10위보다 크지 않다. 순위 칸을 잘못 읽었다`);
    }
    if (c.allSpread == null || c.withinRankSpread == null) {
      throw new Error(`${c.chart} — 벌어짐을 못 쟀다`);
    }
  }
  /* 🔴 요지 — 순위를 알아도 흩어짐이 크게 안 줄면 「순위는 시청을 못 말한다」가 선다.
     ⛔ 어느 쪽이든 참이지만, 셈이 뒤집히면(순위를 알수록 더 흩어지면) 자가 선다 */
  for (const c of byChart) {
    if (c.withinRankSpread > c.allSpread * 1.05) {
      throw new Error(`${c.chart} — 순위를 알 때가 모를 때보다 더 흩어진다(${c.withinRankSpread} > ${c.allSpread}). 셈이 틀렸다`);
    }
  }

  const 좁힘 = byChart.map((c) => ({
    chart: c.chart,
    narrowedPc: +(100 * (1 - c.withinRankSpread / c.allSpread)).toFixed(1),
  }));

  const out = {
    generated: new Date().toISOString(),
    source: 'Netflix Top 10 (Tudum). The global weekly lists carry hours viewed; the per-country lists do not.',
    question: 'If you know a title\'s rank, how much do you know about how much it was watched?',
    unit: 'Spread is the 90th percentile divided by the 10th — how many times bigger a high week is than a low '
      + 'one. "Knowing nothing" is the spread across every row of a chart; "knowing the rank" is the median of '
      + 'the spreads inside each of the ten rank positions.',
    whyChartFixed: 'Films and series, English and non-English, are four charts of different sizes. Mixing them '
      + 'would let a difference between charts be read as a difference between ranks.',
    countryRowsRead: 나라줄,
    countryRowsWithViewing: 나라시청,
    globalRowsRead: 세계줄,
    globalRowsWithViewing: 시청있는줄,
    weeksSpanned: 주모음.size,
    byChart,
    narrowing: 좁힘,
    cannotAnswer: 'The global lists are not the country lists. A rank on a country chart is produced by that '
      + 'country\'s viewers, and Netflix never publishes those hours at all, so how well rank stands in for '
      + 'viewing inside one country cannot be measured from anything Netflix releases.',
  };
  fs.writeFileSync(낼파일, `${JSON.stringify(out, null, 2)}\n`, 'utf8');

  console.log(`나라 차트 ${나라줄.toLocaleString('en-US')}줄 중 시청 칸이 있는 줄 **${나라시청}**`);
  console.log(`세계 차트 ${세계줄.toLocaleString('en-US')}줄 중 시청시간이 있는 줄 ${시청있는줄.toLocaleString('en-US')} · 주 ${주모음.size}`);
  for (const c of byChart) {
    console.log(`\n${c.chart}  (주 ${c.weeks})`);
    console.log(`  1위 중앙값 ${(c.medianTop / 1e6).toFixed(1)}백만 시간 · 10위 ${(c.medianTenth / 1e6).toFixed(1)} · ${c.topOverTenth}배`);
    console.log(`  모를 때 벌어짐 ${c.allSpread}배 → 순위를 알 때 ${c.withinRankSpread}배`);
    console.log(`  🔴 좁혀 준 몫 ${좁힘.find((x) => x.chart === c.chart).narrowedPc}%`);
  }
  console.log(`\n→ ${낼파일}`);
}
