#!/usr/bin/env node
/**
 * **줄어든 것이 아니라 옮겨 간 것인가.** (53편째 기사와 `/where-it-moved` 의 표)
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 45편째에서 「아시아 아홉 시장이 **예외 없이** 줄었다」를 냈다. 그 기사가 답하지 않은 것이 있다 —
 * **어디서는 늘었나.** 세계 전체 몫은 5년 내내 7.7% 로 평평했는데 아시아가 줄었다면
 * 그 자리는 어디로 갔어야 한다.
 *
 * ── ⛔ 조심하는 것 ────────────────────────────────────────────
 * · **온전한 해만 견준다.** 2021 은 7월부터, 2026 은 7월까지라 반쪽이다.
 * · 해마다 주 수가 다르다 — 2023 은 **53주**다. 칸 수를 주 수에서 셈한다. ⛔ 1040 을 박지 않는다.
 * · 몫이 준 것이 「한국 것이 줄어서」인지 「남의 것이 늘어서」인지 몫만으로는 못 가른다.
 *   그래서 **자리 수와 서로 다른 작품 수를 같이** 낸다. 몫만 내면 읽는 사람이 지어낸다.
 * · 「인기가 식었다」라 안 쓴다. 우리가 본 것은 차트 자리뿐이다.
 *
 * 결과 → src/data/wikitip-where-it-moved.json
 * 쓰는 법: node scripts/build-wikitip-where-it-moved.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { koreanTitleFilter } from './lib/korean-netflix-titles.mjs';
import { 지금 } from './_kst.mjs';

const 나라판 = 'archive/raw/netflix-top10/countries.ndjson';
const 깊이 = 'src/data/wikitip-catalogue-depth.json';
const 낼곳 = 'src/data/wikitip-where-it-moved.json';
/** 견줄 두 해. ⛔ 둘 다 온전한 해여야 한다 */
export const 앞해 = 2022;
export const 뒷해 = 2025;
/** 한 주에 한 나라가 내주는 칸 — 영화 10 + 시리즈 10 */
export const 주당칸 = 20;

/** 몫. 칸 수가 0 이면 **0 이 아니라 null** 이다 */
export function 몫(자리, 칸) {
  if (!칸) return null;
  return +((100 * 자리) / 칸).toFixed(1);
}

/** 두 몫의 차이(포인트). 어느 하나가 null 이면 null */
export function 차이(뒤, 앞) {
  if (뒤 == null || 앞 == null) return null;
  return +(뒤 - 앞).toFixed(1);
}

/** 배수. 앞이 0 이면 **못 잰다** — 0 으로 나눈 값을 지어내지 않는다 */
export function 배수(뒤, 앞) {
  if (!앞) return null;
  return +(뒤 / 앞).toFixed(2);
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통과 = 0; let 실패 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    const ok = typeof 바람 === 'function' ? 바람(실제) : JSON.stringify(실제) === JSON.stringify(바람);
    if (ok) 통과 += 1; else { 실패 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  재본다('몫', 몫(104, 1040), 10);
  재본다('칸이 0 이면 null 이지 0 이 아니다', 몫(0, 0), null);
  재본다('차이', 차이(10.4, 4.2), 6.2);
  재본다('한쪽이 null 이면 null', 차이(null, 4.2), null);
  재본다('배수', 배수(108, 44), 2.45);
  재본다('앞이 0 이면 배수를 못 잰다', 배수(5, 0), null);
  재본다('견주는 두 해가 다르다', 앞해 !== 뒷해, true);
  재본다('주당 칸은 스물', 주당칸, 20);
  console.log(실패 ? `⛔ ${실패}개 틀렸다 (통과 ${통과})` : `✅ 검사 ${통과}개 통과`);
  process.exit(실패 ? 1 : 0);
}

if (내가실행됐다) {
  const ko = koreanTitleFilter();
  const 깊이자료 = JSON.parse(fs.readFileSync(깊이, 'utf8'));
  const 아시아열 = new Set(깊이자료.countries.filter((c) => c.inAsianTen).map((c) => c.iso2));

  /** iso2|해 → {한국:0, 작품:Set} · 해 → Set(주) */
  const 칸 = new Map(); const 해주 = new Map(); const 나라이름 = new Map();
  const rl = readline.createInterface({ input: fs.createReadStream(나라판), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.trim()) continue;
    let r; try { r = JSON.parse(line); } catch { continue; }
    if (r.iso2 === 'RU') continue;
    const y = +r.주.slice(0, 4);
    if (y !== 앞해 && y !== 뒷해) continue;
    나라이름.set(r.iso2, r.국가);
    if (!해주.has(y)) 해주.set(y, new Set());
    해주.get(y).add(r.주);
    if (!ko.keepTitle(r.제목)) continue;
    const k = `${r.iso2}|${y}`;
    if (!칸.has(k)) 칸.set(k, { 한국: 0, 작품: new Set() });
    const c = 칸.get(k);
    c.한국 += 1; c.작품.add(r.제목);
  }

  /* ⛔ 칸 수를 박지 않는다 — 주 수에서 셈한다. 2023 은 53주라 다르다 */
  const 해칸 = new Map([...해주].map(([y, s]) => [y, s.size * 주당칸]));
  const 앞칸 = 해칸.get(앞해); const 뒷칸 = 해칸.get(뒷해);
  if (!앞칸 || !뒷칸) throw new Error(`두 해의 칸 수를 못 셌다 — ${앞해}:${앞칸} ${뒷해}:${뒷칸}`);
  if (해주.get(앞해).size !== 해주.get(뒷해).size) {
    console.log(`⚠ 두 해의 주 수가 다르다 — ${앞해} ${해주.get(앞해).size}주 · ${뒷해} ${해주.get(뒷해).size}주. 몫으로 견주니 셈은 선다`);
  }

  const 줄 = [];
  for (const [iso2, name] of 나라이름) {
    const a = 칸.get(`${iso2}|${앞해}`) ?? { 한국: 0, 작품: new Set() };
    const b = 칸.get(`${iso2}|${뒷해}`) ?? { 한국: 0, 작품: new Set() };
    if (!a.한국 && !b.한국) continue;
    줄.push({
      iso2,
      name,
      inAsianTen: 아시아열.has(iso2),
      beforePlaces: a.한국,
      afterPlaces: b.한국,
      beforePc: 몫(a.한국, 앞칸),
      afterPc: 몫(b.한국, 뒷칸),
      changePp: 차이(몫(b.한국, 뒷칸), 몫(a.한국, 앞칸)),
      timesPlaces: 배수(b.한국, a.한국),
      beforeTitles: a.작품.size,
      afterTitles: b.작품.size,
    });
  }
  줄.sort((x, y) => y.changePp - x.changePp);

  const 늘 = 줄.filter((x) => x.changePp > 0);
  const 줄어 = 줄.filter((x) => x.changePp < 0);
  const 아시아 = 줄.filter((x) => x.inAsianTen);
  const 밖 = 줄.filter((x) => !x.inAsianTen);
  const 평균 = (a) => (a.length ? +(a.reduce((s, x) => s + x.changePp, 0) / a.length).toFixed(2) : null);

  /* ── 스스로 본다 ── */
  if (늘.length + 줄어.length + 줄.filter((x) => x.changePp === 0).length !== 줄.length) throw new Error('늘/줄어/그대로 합이 안 맞는다');
  for (const x of 줄) {
    if (x.beforeTitles > x.beforePlaces) throw new Error(`${x.name}: ${앞해} 작품 수가 자리 수보다 많다`);
    if (x.afterTitles > x.afterPlaces) throw new Error(`${x.name}: ${뒷해} 작품 수가 자리 수보다 많다`);
  }
  /* ⛔ 기사 요지 — 아시아 열은 하나도 안 늘어야 하고, 밖은 평균이 플러스여야 한다.
     뒤집히면 기사를 다시 쓴다 */
  if (아시아.some((x) => x.changePp > 0)) throw new Error('아시아 열 중 늘어난 곳이 있다 — 「예외 없이」를 못 쓴다');
  if (!(평균(밖) > 0)) throw new Error(`아시아 밖 평균이 ${평균(밖)}p 다 — 「옮겨 갔다」가 안 선다`);

  const out = {
    generated: 지금(),
    source: 'Netflix Top 10 (Tudum) weekly country lists; Korean titles identified via Wikidata country of origin (P495 = Q884) and by Wikidata item number where we hold one',
    question: `Korean titles lost chart share across Asia between ${앞해} and ${뒷해}. Where did that share go?`,
    unit: `Each market gives out ${주당칸} places a week — ten films and ten series. Share is Korean places divided by that year's places in that market.`,
    /** ⛔ 이 문장을 지면이 그대로 싣는다. 몫만으로는 못 가르는 것을 밝힌다 */
    cannotSeparate: 'A falling share can mean fewer Korean titles charted or that other titles pushed them out, and a chart position cannot tell those apart. That is why the place counts and the distinct-title counts are printed beside every share.',
    beforeYear: 앞해,
    afterYear: 뒷해,
    beforeWeeks: 해주.get(앞해).size,
    afterWeeks: 해주.get(뒷해).size,
    slotsPerWeek: 주당칸,
    beforeSlots: 앞칸,
    afterSlots: 뒷칸,
    markets: 줄.length,
    roseCount: 늘.length,
    fellCount: 줄어.length,
    asianTen: { markets: 아시아.length, meanChangePp: 평균(아시아), roseCount: 아시아.filter((x) => x.changePp > 0).length },
    elsewhere: { markets: 밖.length, meanChangePp: 평균(밖), roseCount: 밖.filter((x) => x.changePp > 0).length },
    topRisers: 줄.slice(0, 8),
    topFallers: 줄.slice(-8).reverse(),
    all: 줄,
  };
  fs.writeFileSync(낼곳, JSON.stringify(out, null, 1));
  console.log(`${앞해}(${out.beforeWeeks}주) → ${뒷해}(${out.afterWeeks}주) · 시장 ${out.markets}곳 — 늘어난 곳 ${out.roseCount} · 줄어든 곳 ${out.fellCount}`);
  console.log(`  아시아 열 ${out.asianTen.markets}곳 평균 ${out.asianTen.meanChangePp}p (늘어난 곳 ${out.asianTen.roseCount})`);
  console.log(`  그 밖 ${out.elsewhere.markets}곳 평균 ${out.elsewhere.meanChangePp}p (늘어난 곳 ${out.elsewhere.roseCount})`);
  console.log('  가장 많이 늘어난 곳 —');
  for (const x of out.topRisers.slice(0, 5)) console.log(`    ${x.name.padEnd(22)} ${x.beforePc}% → ${x.afterPc}% (+${x.changePp}p) · 작품 ${x.beforeTitles} → ${x.afterTitles}`);
  console.log('  가장 많이 줄어든 곳 —');
  for (const x of out.topFallers.slice(0, 5)) console.log(`    ${x.name.padEnd(22)} ${x.beforePc}% → ${x.afterPc}% (${x.changePp}p) · 작품 ${x.beforeTitles} → ${x.afterTitles}`);
  console.log(`→ ${낼곳}`);
}
