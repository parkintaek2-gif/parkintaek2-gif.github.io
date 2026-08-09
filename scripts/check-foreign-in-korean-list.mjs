#!/usr/bin/env node
/**
 * **한국 작품 명단에 남의 작품이 앉아 있나.** 근거는 *뜬 시장*이다.
 *
 * ── 🔴 왜 만드나 (2026-08-10 05:3x) ──────────────────────────
 *   못맞춤 14편에 위키데이터 열쇠를 붙이려다 뒤집혔다. 13편이 남의 작품이었다.
 *   `Undercover` 48자리는 **한국에 한 자리도 없고** 네덜란드 18 · 벨기에 6 이었다 — 벨기에 시리즈다.
 *   붙였으면 가짜 한국 자리 84개를 만들었다.
 *
 * ── ⛔ 못 쓰는 규칙을 먼저 버렸다 ────────────────────────────
 *   「한국 차트에 한 자리도 없으면 남의 것」 → **틀렸다.**
 *   재 보니 한국 작품 915편 중 **355편(38.8%)이 한국 차트에 한 자리도 없다.**
 *   `Young Lady and Gentleman`(351자리)은 KBS 로 나갔지 넷플릭스 코리아로 안 나갔다.
 *   ⛔ 이 규칙을 걸었으면 **멀쩡한 355편**이 걸렸다. 그래서 근거를 하나 더 겹친다.
 *
 * ── ⭐ 쓰는 규칙 — 근거 셋이 **다 맞을 때만** 센다 ─────────────
 *   ① 한국 차트에 **한 자리도 없다**
 *   ② 위키데이터가 그 이름에 **한국 아닌 나라**를 붙여 두었다
 *   ③ 그 작품이 **가장 많이 뜬 시장**이 바로 그 나라다   ← 자국 쏠림
 *   ⭐ ③이 가르는 칸이다. 넷플릭스 나라별 차트는 자국 작품에 크게 쏠린다.
 *   ⚠ 이것도 **증명이 아니라 의심**이다. 그래서 이 자는 목록을 낼 뿐,
 *      NOT_KOREAN 에 **자동으로 넣지 않는다.** 사람이 한 편씩 보고 넣는다.
 *
 * ── ⚠ 이 자가 못 하는 것 ─────────────────────────────────────
 *   `archive/` 는 다른 창에 없다. 원자료가 없으면 **「못 쟀다」**로 끝낸다.
 *   ⛔ 「깨끗하다」로 통과시키지 않는다 — 안 잰 것을 잰 것처럼 두면 자물쇠가 아니다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 판정 = 'src/data/wikitip-title-ambiguity.json';
const 표 = 'archive/raw/netflix-top10/countries.ndjson';
const KOREA = 'South Korea';

/** 한 작품의 자리를 시장별로 센다. */
export function 시장별(줄들) {
  const m = new Map();
  for (const c of 줄들) m.set(c, (m.get(c) ?? 0) + 1);
  return m;
}

/**
 * 가장 많이 뜬 시장**들**. 동률이면 **전부** 돌려준다.
 * 🔴 2026-08-10 — 처음엔 동률에서 이름 순으로 하나만 골랐다. 그래서 `Motherland`
 *   (Ireland 1 · United Kingdom 1)가 안 걸렸다 — 이름 순으로 Ireland 가 뽑혔고
 *   위키데이터가 아는 나라는 United Kingdom 이었다.
 *   ⛔ 동률을 몰래 하나로 줄이면 **자물쇠가 조용히 헐거워진다.** 전부 돌려준다.
 */
export function 으뜸시장(셈) {
  if (!셈.size) return { 자리: 0, 시장들: [] };
  const 최대 = Math.max(...셈.values());
  return { 자리: 최대, 시장들: [...셈.entries()].filter(([, v]) => v === 최대).map(([k]) => k).sort() };
}

/**
 * 근거 셋을 다 대 본다. 하나라도 어긋나면 `null`(의심 아님).
 * @param 셈    시장 → 자리 수
 * @param 남나라 위키데이터가 그 이름에 붙인 나라들(한국 뺀 것)
 */
export function 의심(셈, 남나라) {
  if (!셈.size) return null;
  if (셈.get(KOREA)) return null;                       /* ① 한국 차트에 떴다 → 아니다 */
  const 남 = new Set(남나라.filter((c) => c !== KOREA));
  if (!남.size) return null;                            /* ② 댈 남의 나라가 없다 → 모른다 */
  const 으뜸 = 으뜸시장(셈);
  const 맞은것 = 으뜸.시장들.filter((c) => 남.has(c));
  if (!맞은것.length) return null;                       /* ③ 자국 쏠림이 없다 → 아니다 */
  const 총 = [...셈.values()].reduce((a, b) => a + b, 0);
  return {
    으뜸시장: 맞은것.join('·'), 으뜸자리: 으뜸.자리, 총자리: 총, 시장수: 셈.size, 남나라: [...남].sort(),
  };
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    if (JSON.stringify(실제) === JSON.stringify(바람)) 통 += 1;
    else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  재본다('시장별 — 센다', [...시장별(['A', 'B', 'A']).entries()].sort(), [['A', 2], ['B', 1]]);
  재본다('으뜸시장', 으뜸시장(시장별(['A', 'B', 'B'])), { 자리: 2, 시장들: ['B'] });
  /* 🔴 Motherland 를 놓쳤던 자리다 — 동률을 하나로 줄이면 안 된다 */
  재본다('으뜸시장 — 동률은 전부 돌려준다', 으뜸시장(시장별(['B', 'A'])), { 자리: 1, 시장들: ['A', 'B'] });
  재본다('의심 — 동률 중 하나만 그 나라여도 걸린다',
    의심(시장별(['Ireland', 'United Kingdom']), ['United Kingdom']).으뜸시장, 'United Kingdom');
  재본다('의심 — 한국 차트에 떴으면 아니다',
    의심(시장별([KOREA, 'Belgium', 'Belgium']), ['Belgium']), null);
  재본다('의심 — 댈 나라가 없으면 아니다', 의심(시장별(['Belgium']), []), null);
  재본다('의심 — 한국만 댔으면 아니다', 의심(시장별(['Belgium']), [KOREA]), null);
  재본다('의심 — 으뜸이 그 나라가 아니면 아니다',
    의심(시장별(['Kenya', 'Kenya', 'Belgium']), ['Belgium']), null);
  재본다('의심 — 근거 셋이 다 맞으면 낸다', 의심(
    시장별(['Netherlands', 'Netherlands', 'Belgium', 'Kenya']), ['Belgium', 'Netherlands']),
  { 으뜸시장: 'Netherlands', 으뜸자리: 2, 총자리: 4, 시장수: 3, 남나라: ['Belgium', 'Netherlands'] });
  /* ⛔ 355편이 걸리던 규칙이 되살아나면 이 시험이 선다 */
  재본다('🔴 한국 차트에 없는 것만으로는 안 걸린다',
    의심(시장별(['Japan', 'Japan', 'Taiwan']), ['United States']), null);
  재본다('의심 — 빈 것', 의심(시장별([]), ['Belgium']), null);
  console.log(`남의 작품이 한국 명단에 있나 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  if (!fs.existsSync(판정)) { console.error(`⛔ 없다 — ${판정}`); process.exit(1); }
  if (!fs.existsSync(표)) {
    console.log('⬜ **못 쟀다** — archive/raw/netflix-top10/countries.ndjson 이 이 창에 없다.');
    console.log('⛔ 「깨끗하다」가 아니다. 원자료가 있는 창에서 돌린다.');
    process.exit(0);
  }
  const d = JSON.parse(fs.readFileSync(판정, 'utf8'));
  const 남나라 = new Map(d.perTitle.map((x) => [x.title, x.countries ?? []]));
  const 열쇠있다 = new Set(d.perTitle.filter((x) => x.q).map((x) => x.title));
  const 줄모음 = new Map();
  for (const 줄 of fs.readFileSync(표, 'utf8').split('\n')) {
    if (!줄.trim()) continue;
    let j; try { j = JSON.parse(줄); } catch { continue; }
    if (j.국가 === 'Russia' || !남나라.has(j.제목)) continue;
    if (!줄모음.has(j.제목)) 줄모음.set(j.제목, []);
    줄모음.get(j.제목).push(j.국가);
  }

  /**
   * 🔴 걸린 것을 **둘로 가른다.** 이 갈래가 이 자의 값이다.
   *   한국없음  위키데이터가 그 이름에 **한국 작품을 하나도** 안 붙였다 → 뺄 수 있다
   *   겹침      한국 작품도 **같은 이름을 쓴다** → ⛔ 못 가른다. 빼면 우리 것을 잃는다
   * ⚠ `Keys to the Heart`(그것만이 내 세상)·`Life Is Beautiful`(인생은 아름다워)가
   *   여기서 갈렸다. 셋 다 맞았는데도 **한국 작품이 같은 이름을 쓴다.** 안 뺀다.
   */
  const 판정표 = new Map(d.perTitle.map((x) => [x.title, x.verdict]));
  const 걸린것 = [];
  for (const [제목, 나라들] of 줄모음) {
    /* ⭐ Q번호가 붙은 편은 **이름이 아니라 열쇠로** 한국 작품임이 확인된 것이다. 건너뛴다. */
    if (열쇠있다.has(제목)) continue;
    const r = 의심(시장별(나라들), 남나라.get(제목));
    if (r) 걸린것.push({ 제목, 갈래: 판정표.get(제목) === 'shared' ? '겹침' : '한국없음', ...r });
  }
  걸린것.sort((a, b) => b.총자리 - a.총자리);

  const 총자리 = [...줄모음.values()].reduce((s, a) => s + a.length, 0);
  const 걸린자리 = 걸린것.reduce((s, x) => s + x.총자리, 0);
  console.log(`한국 작품 명단 ${줄모음.size}편 · ${총자리.toLocaleString('en-US')}자리`);
  console.log(`🔴 근거 셋이 다 맞는 편 **${걸린것.length}편 · ${걸린자리.toLocaleString('en-US')}자리** `
    + `= ${((100 * 걸린자리) / 총자리).toFixed(2)}%\n`);
  for (const 갈래 of ['한국없음', '겹침']) {
    const 몫 = 걸린것.filter((x) => x.갈래 === 갈래);
    console.log(갈래 === '한국없음'
      ? `\n🔴 **한국 작품이 아예 없는 이름** ${몫.length}편 — 뺄 수 있다`
      : `\n⚠ **한국 작품도 같은 이름을 쓴다** ${몫.length}편 — ⛔ 못 가른다. 빼면 우리 것을 잃는다`);
    console.log('자리   시장  으뜸시장(자리)        제목');
    for (const x of 몫.slice(0, 40)) {
      console.log(`${String(x.총자리).padStart(5)} ${String(x.시장수).padStart(5)}  `
        + `${`${x.으뜸시장}(${x.으뜸자리})`.padEnd(22)}${x.제목}`);
    }
    if (몫.length > 40) console.log(`   … 모두 ${몫.length}편`);
  }
  console.log('\n⛔ 이 목록은 **의심이지 판결이 아니다.** 자동으로 안 뺀다 — 사람이 한 편씩 본다.');
}
