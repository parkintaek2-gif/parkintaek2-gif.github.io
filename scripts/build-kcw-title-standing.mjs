#!/usr/bin/env node
/**
 * build-kcw-title-standing.mjs — **작품 하나가 974편 «어디»에 서 있는지 잰다.**
 *
 * ── 🔴 왜 만드나 (2026-08-30 16:3x · 5번) ──────────────────
 * Search Console 실측(90일) — 「<작품> hit or flop」 꼴로 물어본 검색이
 * **작품 지면 18장**에 이미 떨어지고 있다.
 * ```
 * our sticky love 5 · dali and cocky prince 4 · the 8th night 4 · concrete utopia 3 …
 * ```
 * ⭐ 구글은 이미 **맞는 지면**으로 보내고 있다. 그런데 그 지면에는
 *   **「hit or flop」이라는 말도, 그 물음에 대한 답도 없다.** 순위가 4~10 에 머무는 자리다.
 *
 * ⛔ 그래서 지면을 «더 내지» 않는다. **있는 지면이 그 물음에 답하게** 한다.
 *
 * ── ⛔ 이 자가 «절대» 하지 않는 것 ───────────────────────────
 * 「hit」·「flop」은 **판정어**다. 우리는 판정하지 않는다.
 *   ⛔ 「이건 flop 이다」                우리가 값어치를 매기는 것이다
 *   ✅ 「974편 중 447편이 한 나라뿐이었다」  사실이다. 판단은 읽는 사람이 한다
 * ⭐ 이 자가 주는 것은 **자리**다 — 나라 수·주 수·최고 순위가 974편 분포의 몇 %인지.
 *
 * ⛔ 「상위 몇 %」를 «점수»처럼 쓰지 않는다. 화면에는 언제나 «몇 편 중 몇 편»을 같이 낸다.
 * ⛔ 못 잰 작품은 «자리»를 안 준다. 0% 로 채우지 않는다.
 *
 * 쓰는 법
 *   node scripts/build-kcw-title-standing.mjs --자가시험
 *   node scripts/build-kcw-title-standing.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 표길 = path.join(뿌리, 'src/data/wikitip-title-pages.json');
const 낼길 = path.join(뿌리, 'src/data/kcw-title-standing.json');

/**
 * 값 하나가 «몇 편보다 크거나 같은지» 센다.
 * ⛔ 백분위를 먼저 내지 않는다 — **편수**가 먼저다. 백분위는 그것을 사람 말로 옮긴 것뿐이다.
 * ⛔ 못 잴 값(null·NaN)은 셈에서 «뺀다». 0 으로 치지 않는다.
 */
export function 아래에몇편(값, 값들) {
  if (!Number.isFinite(값)) return null;
  const 쓸것 = (값들 ?? []).filter(Number.isFinite);
  if (!쓸것.length) return null;
  return { 아래: 쓸것.filter((v) => v < 값).length, 같음: 쓸것.filter((v) => v === 값).length, 전체: 쓸것.length };
}

/** 사람 말로 — ⛔ 「상위 N%」만 던지지 않는다. 늘 «몇 편 중 몇 편»을 같이 준다 */
export function 자리말(셈) {
  if (!셈) return null;
  const 위 = 셈.전체 - 셈.아래 - 셈.같음;
  return { 아래: 셈.아래, 같음: 셈.같음, 위, 전체: 셈.전체,
    아래몫: Math.round((셈.아래 / 셈.전체) * 100), 위몫: Math.round((위 / 셈.전체) * 100) };
}

/** 최고 순위는 «작을수록 좋다» — 그래서 뒤집어 센다. ⛔ 이것을 잊으면 뜻이 거꾸로 된다 */
export function 순위자리(값, 값들) {
  if (!Number.isFinite(값)) return null;
  const 쓸것 = (값들 ?? []).filter(Number.isFinite);
  if (!쓸것.length) return null;
  return 자리말({ 아래: 쓸것.filter((v) => v > 값).length, 같음: 쓸것.filter((v) => v === 값).length, 전체: 쓸것.length });
}

/* ── 자가시험 ───────────────────────────────────────────────── */
export function 자가시험() {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  검('아래에 몇 편인지 센다', (() => {
    const r = 아래에몇편(3, [1, 2, 3, 4, 5]);
    return r.아래 === 2 && r.같음 === 1 && r.전체 === 5;
  })());
  검('⛔ 못 잴 값은 null — 0 이 아니다',
    아래에몇편(null, [1, 2]) === null && 아래에몇편(NaN, [1, 2]) === null);
  검('⛔ 셀 것이 없으면 null', 아래에몇편(3, []) === null && 아래에몇편(3, null) === null);
  검('⚠ 못 잴 값이 섞여 있으면 «빼고» 센다 — 0 으로 안 친다',
    아래에몇편(3, [1, null, 2, NaN, 5]).전체 === 3);

  검('⭐ 자리말은 «몇 편 중 몇 편»을 같이 준다', (() => {
    const r = 자리말({ 아래: 2, 같음: 1, 전체: 5 });
    return r.아래 === 2 && r.위 === 2 && r.전체 === 5 && r.아래몫 === 40;
  })());
  검('⛔ 없는 것은 null', 자리말(null) === null);

  검('🔴 최고 순위는 «작을수록 좋다» — 뒤집어 센다', (() => {
    /* 1위가 가장 좋다. [1,2,3,4,5] 에서 값 2 는 «자기보다 나쁜 것» 3편 위에 있다 */
    const r = 순위자리(2, [1, 2, 3, 4, 5]);
    return r.아래 === 3 && r.같음 === 1;
  })());
  검('1위는 아래에 아무것도 없는 것이 아니라 «가장 위»다', (() => {
    const r = 순위자리(1, [1, 2, 3]);
    return r.위 === 0 && r.아래 === 2;
  })());
  검('⛔ 못 잴 순위는 null', 순위자리(null, [1, 2]) === null);

  return 실패;
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--자가시험')) {
  const 실패 = 자가시험();
  if (실패.length) {
    console.error(`❌ 자가시험 실패 ${실패.length}\n${실패.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log('✅ 작품 자리 재는 자 — 자가시험 9 통과');
  process.exit(0);
}

if (내가실행됐다) {
  const 표 = JSON.parse(fs.readFileSync(표길, 'utf8'));
  const 작품들 = Array.isArray(표) ? 표 : (표.titles ?? null);
  if (!Array.isArray(작품들) || 작품들.length < 100) {
    console.log('⬜ **못 쟀다** — 작품 표를 못 읽었다.');
    process.exit(1);
  }

  const 나라들 = 작품들.map((t) => t.markets);
  const 주들 = 작품들.map((t) => t.weeks);
  const 순위들 = 작품들.map((t) => t.peak);

  const 낼것 = {};
  let 자리준것 = 0;
  let 못준것 = 0;
  for (const t of 작품들) {
    if (!t.hasPage) continue;
    const 나라 = 자리말(아래에몇편(t.markets, 나라들));
    const 주 = 자리말(아래에몇편(t.weeks, 주들));
    const 순위 = 순위자리(t.peak, 순위들);
    /* ⛔ 셋 다 못 재면 자리를 «안 준다». 반쪽짜리로 채우지 않는다 */
    if (!나라 && !주 && !순위) { 못준것 += 1; continue; }
    낼것[t.slug] = { markets: t.markets, weeks: t.weeks, peak: t.peak, 나라, 주, 순위 };
    자리준것 += 1;
  }

  fs.writeFileSync(낼길, `${JSON.stringify({
    잰날: new Date().toISOString(),
    전체작품: 작품들.length,
    잰것: 자리준것,
    못잰것: 못준것,
    뜻하는것: '974편 안에서 이 작품이 나라 수·주 수·최고 순위로 어디에 서 있나',
    안뜻하는것: ['돈을 벌었나', '잘 만든 작품인가', '사람들이 좋아했나'],
    작품: 낼것,
  }, null, 1)}\n`);

  console.log(`✅ 자리를 잰 작품 ${자리준것}편 (못 잰 것 ${못준것}편) → ${path.relative(뿌리, 낼길)}`);
  console.log('\n  보기 —');
  for (const s of ['squid-game', 'our-sticky-love', 'the-8th-night', 'concrete-utopia']) {
    const r = 낼것[s];
    if (!r) { console.log(`    ${s.padEnd(22)} ⚠ 없다`); continue; }
    console.log(`    ${s.padEnd(22)} 나라 ${r.markets} (974편 중 ${r.나라.아래}편보다 넓다)`
      + ` · 주 ${r.weeks} (${r.주.아래}편보다 길다) · 최고 ${r.peak}위`);
  }
  console.log('\n⛔ 이것은 «판정»이 아니다. 974편 안에서 어디에 서 있는지다.');
}
