#!/usr/bin/env node
/**
 * **집에서 잘 걸리면 밖에서도 걸리나.** (51편째 기사와 `/home-abroad` 의 표)
 *
 * ── 왜 묻나 ─────────────────────────────────────────────────────
 * 공급사가 우리에게 살 만한 값을 매기려면 「우리 작품이 밖으로 나갈까」에 답이 있어야 한다.
 * 업계가 흔히 쓰는 잣대는 **국내 성적**이다. 그것이 정말 밖을 말해 주는지 잰다.
 *
 * ── 🔴 첫 읽기가 틀렸다 (2026-08-09 03:5x) ─────────────────────
 * 처음엔 「한국 6주에서 **문턱**이 있다」고 읽었다 — 밖 나라 중앙값이 1 → 19 로 뛰었기 때문이다.
 * ⛔ 그건 **중앙값이 50% 선을 지난 것**이지 문턱이 아니었다. 분포를 보니 —
 *      10개국 이상 간 비율 11% → 25% → 57% → 65%  = **기울기**다.
 * ⭐ 그래서 이 자료는 「문턱」이라는 말을 **안 쓴다.** 뛴 것은 중앙값이고, 바탕은 기울기다.
 *
 * ── ⛔ 지키는 것 ──────────────────────────────────────────────
 * · 한국에 **안 걸린 편**과 걸린 편을 그냥 견주지 않는다 —
 *   안 걸린 쪽은 **정의상 전부 밖에 걸린 것**이라 견주면 답이 정해져 있다.
 * · 반론 셋(중앙값 눈속임 · 형식 · 시기)을 **자료 안에 넣는다.** 지면이 스스로 시험한다.
 * · 「인기」라 쓰지 않는다. 우리가 본 것은 **차트에 며칠 있었나**뿐이다.
 *
 * 결과 → src/data/wikitip-home-abroad.json
 * 쓰는 법: node scripts/build-wikitip-home-abroad.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { koreanTitleFilter } from './lib/korean-netflix-titles.mjs';
import { 지금 } from './_kst.mjs';

const 나라판 = 'archive/raw/netflix-top10/countries.ndjson';
const 낼곳 = 'src/data/wikitip-home-abroad.json';

/** 한국 차트 자리 수로 나눈 띠. ⛔ 이름을 「문턱」이라 붙이지 않는다 */
export const 띠 = [
  { lo: 1, hi: 2, label: '1–2' },
  { lo: 3, hi: 5, label: '3–5' },
  { lo: 6, hi: 10, label: '6–10' },
  { lo: 11, hi: Infinity, label: '11 or more' },
];

/** 몇 %가 조건에 맞나. 빈 무리는 **0 이 아니라 null** 이다 — 안 잰 것을 0 으로 적지 않는다 */
export function 몫(무리, 맞나) {
  if (!무리.length) return null;
  return +((100 * 무리.filter(맞나).length) / 무리.length).toFixed(1);
}

/** 가운데값. 빈 무리는 null */
export function 가운데(수들) {
  if (!수들.length) return null;
  const s = [...수들].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

/** 넷플릭스 구분값이 영화인가. `Films` · `Films (English)` 따위가 온다 */
export function 영화인가(구분) {
  return /film/i.test(String(구분 ?? ''));
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통과 = 0; let 실패 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    const ok = typeof 바람 === 'function' ? 바람(실제) : JSON.stringify(실제) === JSON.stringify(바람);
    if (ok) 통과 += 1; else { 실패 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  재본다('몫 — 절반', 몫([1, 2, 3, 4], (x) => x > 2), 50);
  재본다('몫 — 빈 무리는 null 이지 0 이 아니다', 몫([], () => true), null);
  재본다('가운데값', 가운데([5, 1, 3]), 3);
  재본다('가운데값 — 빈 것은 null', 가운데([]), null);
  재본다('영화 가려내기', [영화인가('Films'), 영화인가('Films (English)'), 영화인가('TV'), 영화인가(null)],
    [true, true, false, false]);
  재본다('띠가 겹치지 않고 빈틈도 없다',
    띠.every((b, i) => i === 0 || 띠[i - 1].hi + 1 === b.lo), true);
  재본다('띠가 1 에서 시작한다', 띠[0].lo, 1);
  재본다('마지막 띠는 열려 있다', 띠[띠.length - 1].hi, Infinity);
  console.log(실패 ? `⛔ ${실패}개 틀렸다 (통과 ${통과})` : `✅ 검사 ${통과}개 통과`);
  process.exit(실패 ? 1 : 0);
}

if (내가실행됐다) {
  const ko = koreanTitleFilter();
  const 집 = new Map();
  let 창첫 = '9999-99-99'; let 창끝 = '0000-00-00'; const 주들 = new Set();

  const rl = readline.createInterface({ input: fs.createReadStream(나라판), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.trim()) continue;
    let r; try { r = JSON.parse(line); } catch { continue; }
    if (r.iso2 === 'RU') continue;
    if (r.주 < 창첫) 창첫 = r.주;
    if (r.주 > 창끝) 창끝 = r.주;
    주들.add(r.주);
    if (!ko.keepTitle(r.제목)) continue;
    if (!집.has(r.제목)) 집.set(r.제목, { home: 0, abroad: 0, countries: new Set(), kind: r.구분, first: '9999-99-99' });
    const x = 집.get(r.제목);
    if (r.주 < x.first) x.first = r.주;
    if (r.iso2 === 'KR') x.home += 1;
    else { x.abroad += 1; x.countries.add(r.iso2); }
  }

  const 전부 = [...집].map(([title, x]) => ({
    title, home: x.home, abroad: x.abroad, countries: x.countries.size,
    film: 영화인가(x.kind), first: x.first,
  }));
  const 집에걸림 = 전부.filter((x) => x.home > 0);
  const 집에안걸림 = 전부.filter((x) => x.home === 0);

  const 띠줄 = 띠.map((b) => {
    const g = 집에걸림.filter((x) => x.home >= b.lo && x.home <= b.hi);
    const 영화 = g.filter((x) => x.film);
    const 시리즈 = g.filter((x) => !x.film);
    return {
      band: b.label,
      titles: g.length,
      reachedTenPc: 몫(g, (x) => x.countries >= 10),
      reachedTwentyPc: 몫(g, (x) => x.countries >= 20),
      neverLeftPc: 몫(g, (x) => x.countries === 0),
      medianCountries: 가운데(g.map((x) => x.countries)),
      medianAbroadPlaces: 가운데(g.map((x) => x.abroad)),
      film: { titles: 영화.length, reachedTenPc: 몫(영화, (x) => x.countries >= 10) },
      series: { titles: 시리즈.length, reachedTenPc: 몫(시리즈, (x) => x.countries >= 10) },
      medianFirstWeek: [...g.map((x) => x.first)].sort()[Math.floor(g.length / 2)] ?? null,
    };
  });

  /** 집에 한 번도 안 걸렸는데 스무 나라 넘게 간 편 — **이 갈래가 있다는 것이 요지의 절반이다** */
  const 집없이멀리 = 집에안걸림.filter((x) => x.countries >= 20)
    .sort((a, b) => b.countries - a.countries)
    .map((x) => ({ title: x.title, countries: x.countries, places: x.abroad, film: x.film }));

  /* ── 스스로 본다. 틀리면 파일을 안 낸다 ── */
  if (집에걸림.length + 집에안걸림.length !== 전부.length) throw new Error('걸림/안걸림 합이 전체와 다르다');
  const 띠합 = 띠줄.reduce((s, b) => s + b.titles, 0);
  if (띠합 !== 집에걸림.length) throw new Error(`띠 합 ${띠합} 가 집에 걸린 편수 ${집에걸림.length} 와 다르다`);
  for (const b of 띠줄) {
    if (b.film.titles + b.series.titles !== b.titles) throw new Error(`${b.band}: 영화+시리즈가 띠 편수와 다르다`);
  }
  /* ⛔ 요지가 뒤집히면 기사를 다시 쓴다 — 「집에 오래 걸릴수록 더 멀리 간다」가 참이어야 한다 */
  const 첫띠 = 띠줄[0].reachedTenPc; const 셋째띠 = 띠줄[2].reachedTenPc;
  if (!(셋째띠 > 첫띠 * 2)) throw new Error(`기사 요지가 뒤집혔다 — 1~2 띠 ${첫띠}% · 6~10 띠 ${셋째띠}%`);
  /* ⛔ 「문턱」이 아니라 「기울기」라고 적으려면 **중간 띠가 사이값**이어야 한다 */
  const 둘째띠 = 띠줄[1].reachedTenPc;
  if (!(둘째띠 > 첫띠 && 둘째띠 < 셋째띠)) throw new Error(`가운데 띠가 사이값이 아니다 — 기울기라 못 쓴다 (${첫띠}·${둘째띠}·${셋째띠})`);

  const out = {
    generated: 지금(),
    source: 'Netflix Top 10 (Tudum) weekly country lists, 2021–2026; Korean titles identified via Wikidata country of origin (P495 = Q884) and by Wikidata item number where we hold one',
    question: 'Does how long a Korean title stays on Korea’s own Netflix chart tell you whether it will travel?',
    unit: 'One place is one title on one country’s weekly top 10. A title on the list for six weeks in Korea has six home places.',
    weekFrom: 창첫,
    weekTo: 창끝,
    weekCount: 주들.size,
    titles: 전부.length,
    chartedAtHome: 집에걸림.length,
    neverChartedAtHome: 집에안걸림.length,
    /** ⛔ 이 둘을 그냥 견주면 안 되는 까닭. 지면이 이 문장을 싣는다 */
    whyNotCompared: 'Titles that never charted in Korea are, by definition, titles we only know about because they charted somewhere else. Comparing the two groups directly would answer a question we have already decided.',
    bands: 띠줄,
    travelledWithoutHome: 집없이멀리,
    travelledWithoutHomeCount: 집없이멀리.length,
  };
  fs.writeFileSync(낼곳, JSON.stringify(out, null, 1));
  console.log(`한국 작품 ${out.titles}편 — 집에 걸린 것 ${out.chartedAtHome} · 안 걸린 것 ${out.neverChartedAtHome}`);
  for (const b of 띠줄) {
    console.log(`  집 ${b.band.padEnd(11)} ${String(b.titles).padStart(3)}편 · 10개국+ ${String(b.reachedTenPc).padStart(4)}%`
      + ` · 한 나라도 못 감 ${String(b.neverLeftPc).padStart(4)}%`
      + ` · 영화 ${String(b.film.reachedTenPc).padStart(4)}% 대 시리즈 ${String(b.series.reachedTenPc).padStart(4)}%`);
  }
  console.log(`⭐ 집에 한 번도 안 걸리고 20개국 넘게 간 편 ${out.travelledWithoutHomeCount}편 — ${집없이멀리.slice(0, 4).map((x) => `${x.title}(${x.countries})`).join(' · ')}`);
  console.log(`→ ${낼곳}`);
}
