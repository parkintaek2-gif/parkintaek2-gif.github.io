#!/usr/bin/env node
/**
 * 한 나라가 다른 나라보다 **먼저 뜨나** — 이웃 차트가 선행 지표가 되는가.
 *
 * ⛔ 편성 담당자가 실제로 묻는 물음이다. 「태국에서 떴으니 우리도 걸까」.
 *    그러려면 **먼저 뜨는 쪽이 정해져 있어야** 한다. 그때그때면 신호가 아니다.
 *
 * ⛔ 이 자가 지키는 것 ───────────────────────────────────────────
 * ⛔ 🔴 **성립하는지부터 잰다.** 넷플릭스가 세계 동시 공개를 하면 대부분 **같은 주**에 뜬다.
 *    그러면 「먼저」랄 것이 아예 없고, 선행 지표라는 물음 자체가 헛것이다.
 *    ⭐ 그 수를 **맨 앞에** 낸다. 뒤엣것은 그다음이다.
 * ⛔ **순위표를 안 만든다.** 「제일 잘 맞히는 나라」를 안 뽑는다.
 *    나라 짝이 얼마나 **한쪽으로 쏠리나**의 분포만 낸다.
 * ⛔ **같은 작품이 두 나라에 다 오른 경우만** 센다. 안 오른 나라를 「늦었다」로 안 민다.
 * ⛔ **짝마다 작품이 적으면 뺀다.** 두세 편으로 「먼저 뜬다」를 말하지 않는다.
 * ⚠ 왜 그런지는 이 자료에 **없다.** 공개일도 홍보도 넷플릭스가 안 낸다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 나라파일 = 'archive/raw/netflix-top10/countries.ndjson';
const 한국열쇠 = 'archive/raw/netflix-top10/korean-titles-keyed.json';
const 낼파일 = 'src/data/wikitip-lead-lag.json';

/** 짝마다 이만큼은 있어야 견준다. ⛔ 우리가 고른 자리다 */
export const 최소작품 = 20;

/** 몫. 밑이 0 이면 **0 이 아니라 null** */
export function 몫(a, b) {
  if (!b) return null;
  return +((100 * a) / b).toFixed(1);
}

/**
 * 한쪽으로 얼마나 쏠렸나. 50% 면 0, 100% 나 0% 면 50.
 * ⛔ 「A 가 먼저」와 「B 가 먼저」를 줄세우지 않으려고 **크기만** 낸다.
 */
export function 쏠림(먼저, 짝) {
  const p = 몫(먼저, 짝);
  if (p === null) return null;
  return +Math.abs(p - 50).toFixed(1);
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    if (JSON.stringify(실제) === JSON.stringify(바람)) 통 += 1;
    else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  재본다('몫 — 밑이 0 이면 null', 몫(1, 0), null);
  재본다('쏠림 — 반반이면 0', 쏠림(5, 10), 0);
  재본다('쏠림 — 다 먼저면 50', 쏠림(10, 10), 50);
  재본다('쏠림 — 하나도 안 먼저여도 50', 쏠림(0, 10), 50);
  /* ⛔ 방향을 안 낸다 — A 가 먼저든 B 가 먼저든 쏠림은 같다 */
  재본다('쏠림은 방향을 안 가린다', 쏠림(8, 10) === 쏠림(2, 10), true);
  재본다('쏠림 — 짝이 0 이면 null', 쏠림(0, 0), null);
  console.log(`앞뒤 수집기 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  for (const p of [나라파일, 한국열쇠]) {
    if (!fs.existsSync(p)) {
      console.log(`⛔ 원자료가 없다 — ${p}`);
      console.log('   ⚠ archive/ 는 git 에 안 올라간다. 「안 됐다」가 아니라 **못 쟀다**.');
      process.exit(1);
    }
  }
  /*
   * ⛔ 이 파일의 열쇠는 **Q번호**다. 파일 스스로 그렇게 적어 두었다 —
   *    「제목 문자열은 열쇠가 아니다. 같은 이름을 여러 나라가 쓴다」.
   *    그래서 `작품` 안의 `넷플릭스제목` 으로만 원자료와 맞춘다.
   * ⛔ 영화는 뺀다. 시리즈만 센다(`갈래`).
   */
  const 열쇠 = JSON.parse(fs.readFileSync(한국열쇠, 'utf8'));
  const 한국제목 = new Set(
    Object.values(열쇠.작품 || {})
      .filter((x) => x && x.갈래 !== 'film' && x.넷플릭스제목)
      .map((x) => String(x.넷플릭스제목).toLowerCase()),
  );
  if (!한국제목.size) { console.log('⛔ 한국 제목 명단을 못 읽었다'); process.exit(1); }

  /* ── 원자료를 한 번만 훑어 작품×나라의 **첫 주**를 모은다 ── */
  const 주번호 = new Map();
  const 첫주 = new Map();      // `${제목}|${iso2}` → 가장 이른 주 문자열
  let 줄 = 0; let 한국줄 = 0;
  for (const l of fs.readFileSync(나라파일, 'utf8').split('\n')) {
    if (!l) continue;
    줄 += 1;
    let r;
    try { r = JSON.parse(l); } catch { continue; }
    if (r.구분 !== 'TV') continue;
    const iso2 = String(r.iso2).toUpperCase();
    if (iso2 === 'RU') continue;
    const 제목 = String(r.제목 || '').toLowerCase();
    if (!한국제목.has(제목)) continue;
    한국줄 += 1;
    주번호.set(r.주, 0);
    const k = `${제목}|${iso2}`;
    const 옛 = 첫주.get(k);
    if (옛 === undefined || r.주 < 옛) 첫주.set(k, r.주);
  }
  const 주차례 = [...주번호.keys()].sort();
  const 주번호로 = new Map(주차례.map((w, i) => [w, i]));

  /* ── 작품마다 나라별 첫 주 ── */
  const 작품 = new Map();      // 제목 → Map(iso2 → 주번호)
  for (const [k, w] of 첫주) {
    const [제목, iso2] = k.split('|');
    if (!작품.has(제목)) 작품.set(제목, new Map());
    작품.get(제목).set(iso2, 주번호로.get(w));
  }

  /* ── 🔴 먼저 이것부터 — 두 나라에 다 오른 짝 가운데 **같은 주**가 얼마인가 ── */
  const 짝셈 = new Map();      // `A|B` (A<B 알파벳) → { 짝, 같은주, A먼저 }
  let 짝전체 = 0; let 같은주전체 = 0;
  let 작품수 = 0;
  for (const [, 나라맵] of 작품) {
    const 목록 = [...나라맵.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    if (목록.length < 2) continue;
    작품수 += 1;
    for (let i = 0; i < 목록.length; i += 1) {
      for (let j = i + 1; j < 목록.length; j += 1) {
        const [A, wa] = 목록[i]; const [B, wb] = 목록[j];
        const k = `${A}|${B}`;
        if (!짝셈.has(k)) 짝셈.set(k, { 짝: 0, 같은주: 0, A먼저: 0 });
        const s = 짝셈.get(k);
        s.짝 += 1; 짝전체 += 1;
        if (wa === wb) { s.같은주 += 1; 같은주전체 += 1; } else if (wa < wb) s.A먼저 += 1;
      }
    }
  }

  const 같은주몫 = 몫(같은주전체, 짝전체);

  /* ── 같은 주가 아닌 것만 놓고, 짝마다 얼마나 쏠렸나 ── */
  const 짝들 = [];
  for (const [k, s] of 짝셈) {
    const 다른주 = s.짝 - s.같은주;
    if (다른주 < 최소작품) continue;
    const 쏠 = 쏠림(s.A먼저, 다른주);
    짝들.push({ pair: k.replace('|', '–'), titles: s.짝, differentWeek: 다른주, skew: 쏠 });
  }
  짝들.sort((a, b) => a.pair.localeCompare(b.pair));   /* ⛔ 이름 차례. 줄세우지 않는다 */

  /* ── 쏠림의 분포. ⛔ 「제일 센 짝」을 안 뽑는다 ── */
  const 쏠림띠 = [
    { band: 'Under 10 points from even', lo: 0, hi: 10 },
    { band: '10–20 points', lo: 10, hi: 20 },
    { band: '20–30 points', lo: 20, hi: 30 },
    { band: '30 points or more', lo: 30, hi: 51 },
  ].map((b) => ({
    band: b.band,
    pairs: 짝들.filter((x) => x.skew >= b.lo && x.skew < b.hi).length,
  }));

  const 쏠림중앙 = (() => {
    const v = 짝들.map((x) => x.skew).sort((a, b) => a - b);
    if (!v.length) return null;
    const m = Math.floor(v.length / 2);
    return v.length % 2 ? v[m] : +((v[m - 1] + v[m]) / 2).toFixed(1);
  })();

  /*
   * 🔴🔴 쏠림이 크다고 「이웃이 신호」인 것은 아니다.
   *   작은 나라는 세계 동시 공개여도 차트에 **몇 주 늦게** 든다. 그러면 쏠림은
   *   「신호」가 아니라 **나라마다 다른 속도**를 재는 것이고, 그때는 이웃을 볼 필요가 없다.
   *   자기가 빠른 쪽인지 늦은 쪽인지만 알면 된다.
   *
   * ⭐ 가르는 법 — **이행성**을 잰다. A 가 B 보다 먼저, B 가 C 보다 먼저일 때 A 가 C 보다 먼저인가.
   *   거의 늘 그렇다면 **하나의 줄(속도 순서)** 이 있다는 뜻이고, 이웃 신호가 아니다.
   *   자주 깨진다면 짝마다 다르다는 뜻이고, 그때가 진짜 이웃 신호다.
   * ⛔ 그래도 **나라를 줄세워 내지 않는다.** 「줄이 있나 없나」만 낸다.
   */
  const 방향 = new Map();   /* `A|B` → true 면 A 가 먼저인 쪽이 많다 */
  for (const x of 짝들) {
    const [A, B] = x.pair.split('–');
    const s = 짝셈.get(`${A}|${B}`);
    const 다른주 = s.짝 - s.같은주;
    if (s.A먼저 * 2 === 다른주) continue;      /* 딱 반반이면 방향이 없다 */
    방향.set(`${A}|${B}`, s.A먼저 * 2 > 다른주);
  }
  const 먼저인가 = (X, Y) => {
    if (방향.has(`${X}|${Y}`)) return 방향.get(`${X}|${Y}`);
    if (방향.has(`${Y}|${X}`)) return !방향.get(`${Y}|${X}`);
    return null;
  };
  const 나라목록 = [...new Set(짝들.flatMap((x) => x.pair.split('–')))].sort();
  let 삼각 = 0; let 이행 = 0;
  for (let a = 0; a < 나라목록.length; a += 1) {
    for (let b = a + 1; b < 나라목록.length; b += 1) {
      for (let c = b + 1; c < 나라목록.length; c += 1) {
        const [X, Y, Z] = [나라목록[a], 나라목록[b], 나라목록[c]];
        const xy = 먼저인가(X, Y); const yz = 먼저인가(Y, Z); const xz = 먼저인가(X, Z);
        if (xy === null || yz === null || xz === null) continue;
        삼각 += 1;
        /* 셋이 고리를 이루면(가위바위보) 안 이행이다 */
        const 고리 = (xy && yz && !xz) || (!xy && !yz && xz);
        if (!고리) 이행 += 1;
      }
    }
  }
  const 이행몫 = 몫(이행, 삼각);

  /* ── 스스로 본다 ── */
  if (!짝전체) throw new Error('나라 짝이 하나도 없다 — 제목 맞추기가 깨졌다');
  if (삼각 && (이행몫 === null || 이행몫 < 50)) {
    throw new Error(`이행성이 ${이행몫}% 다 — 반보다 낮으면 셈이 뒤집혔다는 뜻이다`);
  }
  if (같은주몫 === null) throw new Error('같은 주 몫을 못 구했다');
  if (!짝들.length) throw new Error(`최소 ${최소작품}편을 넘는 나라 짝이 없다 — 문턱이 너무 높다`);
  {
    const 띠합 = 쏠림띠.reduce((s, x) => s + x.pairs, 0);
    if (띠합 !== 짝들.length) throw new Error(`띠 합 ${띠합} 이 짝 ${짝들.length} 과 다르다`);
  }
  for (const x of 짝들) {
    if (x.skew < 0 || x.skew > 50) throw new Error(`쏠림이 0~50 밖이다: ${x.pair} ${x.skew}`);
  }

  const out = {
    generated: new Date().toISOString(),
    source: 'Netflix Top 10 (Tudum) weekly country lists for Korean series. A title\'s "arrival" in a country '
      + 'is the first week it appears on that country\'s chart.',
    question: 'Does one country\'s chart lead another\'s, so that a scheduler could watch a neighbour and know '
      + 'what is coming?',
    unit: 'One observation = one Korean series that reached the charts of both countries in a pair. It is '
      + '"same week" if it first appeared in both on the same week, otherwise one of the two came first.',
    whySameWeekFirst: 'If Netflix releases worldwide on one day, most titles arrive everywhere at once and there '
      + 'is no lead to find. That number has to come before any talk of leading indicators.',
    minimumTitlesPerPair: 최소작품,
    rowsRead: 줄,
    koreanRows: 한국줄,
    weeksSpanned: 주차례.length,
    titlesInTwoOrMoreMarkets: 작품수,
    countryPairsObserved: 짝셈.size,
    observations: 짝전체,
    sameWeek: 같은주전체,
    sameWeekPc: 같은주몫,
    pairsMeasured: 짝들.length,
    medianSkew: 쏠림중앙,
    triangles: 삼각,
    transitiveTriangles: 이행,
    transitivePc: 이행몫,
    whyTransitivity: 'If one country simply charts a title sooner than another every time, the pairs line up into a single order and there is no neighbour to watch — a scheduler only needs to know whether their own market is an early one. Cycles in the pairs would mean the lead really is pair-specific.',
    skewBands: 쏠림띠,
    pairs: 짝들,
    cannotAnswer: 'This cannot say why a title reached one chart before another. Netflix publishes neither its '
      + 'release dates by country nor what it promoted where, and a chart entry is an outcome, not a launch.',
  };
  fs.writeFileSync(낼파일, `${JSON.stringify(out, null, 2)}\n`, 'utf8');

  console.log(`시리즈 줄 ${줄.toLocaleString('en-US')} · 한국 줄 ${한국줄.toLocaleString('en-US')} · 주 ${주차례.length}`);
  console.log(`두 나라 이상에 오른 작품 ${작품수} · 나라 짝 ${짝셈.size} · 관측 ${짝전체.toLocaleString('en-US')}`);
  console.log(`🔴 같은 주에 뜬 것 ${같은주전체.toLocaleString('en-US')} = ${같은주몫}%`);
  console.log(`견준 나라 짝 ${짝들.length} (다른 주가 ${최소작품}편 넘는 짝) · 쏠림 중앙값 ${쏠림중앙}`);
  console.log(`🔴 이행성 — 삼각 ${삼각.toLocaleString('en-US')} 중 ${이행.toLocaleString('en-US')} 이 이행 = ${이행몫}%`);
  for (const b of 쏠림띠) console.log(`   ${b.band.padEnd(28)} ${b.pairs}짝`);
  console.log(`→ ${낼파일}`);
}
