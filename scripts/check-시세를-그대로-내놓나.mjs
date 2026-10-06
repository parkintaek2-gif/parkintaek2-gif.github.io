#!/usr/bin/env node
/**
 * check-시세를-그대로-내놓나.mjs
 *   — **사장님이 그으신 선을 «재는» 자.**
 *
 * ── 🔴🔴 사장님 판정 (2026-10-06 20:54) — 원문 그대로 ──────────────────
 *   「**시세는 시세를 직접 서비스만 안하면 상관없는거야**」
 *   「**per 등 계산하는데 쓴 건 괜찮아**」
 *
 * 오늘 내가 틀린 것 — 「제4유형(상업적 이용금지)」이라는 글자만 보고 시가총액을 읽던
 * 코드 두 곳을 묻지 않고 끊었다. 그런데 바꾼 쪽도 똑같이 제4유형이었다.
 * ⇒ **글자를 본 것이지 쓰임새를 안 봤다.** 가르는 선은 이용허락 글자가 아니라
 *   «우리가 그것으로 무엇을 하느냐»였다.
 *
 * ⛔ 그런데 그 쓰임새를 **재는 자가 없다.** 자물쇠는 「어디서 가져오나」만 보고 있었고
 *   「손님에게 무엇을 내놓나」는 아무도 안 셌다. 그래서 선이 그어져도 지킬 길이 없었다.
 *
 * ⇒ 이 자는 **판정하지 않는다. 센다.**
 *   「지금 손님이 받아 가는 것 가운데 시세에서 바로 온 칸은 이것들이다」를 늘어놓는다.
 *   ⭐ 우리가 바늘을 세우지 않는다. 지형을 그려 놓고 바늘은 사장님이 세우신다.
 *
 * ⛔ 「흠 0개」라고 말하지 않는다 — 이 자는 흠을 세는 자가 아니다.
 * ⛔ 못 읽은 것을 「없다」로 적지 않는다. 세는 칸이 셋이다.
 *
 * 쓰기
 *   node scripts/check-시세를-그대로-내놓나.mjs
 *   node scripts/check-시세를-그대로-내놓나.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * 「시세 그 자체」로 읽힐 수 있는 칸 이름들.
 * ⚠ 이것은 «의심할 이름»이지 «죄목»이 아니다. 걸리면 사람이 보고 가른다.
 * ⛔ marketCap 을 여기 넣는다 — 시가총액은 시세 × 주식수이므로 시세에서 바로 온다.
 *   다만 그것이 «PER 계산 입력»이면 사장님 판정상 괜찮다. 그래서 세기만 한다.
 */
export const 시세칸 = [
  'close', 'closePrice', 'clpr', 'price', 'lastPrice', 'currentPrice',
  'open', 'high', 'low', 'mkp', 'hipr', 'lopr',
  'marketCap', 'mrktTotAmt', 'market_cap', '시가총액', '종가', '현재가',
];

/**
 * 우리가 «파는» 자료 — 손님이 그대로 받아 가는 것.
 *
 * ⛔ [2026-10-06 20:55 · 5번] 처음에 Index Tape 길을 `korea-indices-tape.json` 이라고
 *   **유추해서** 적었다. 실제 이름은 `korea-index-tape.json` 이다(indices 가 아니라 index).
 *   ⬜ 「못 읽었다」가 떠서 잡았다 — 만약 「없다」로 셌다면 거짓 초록이 될 뻔했다.
 *   ⭐ 셋째 칸(못잼)이 또 한 번 값을 했다.
 *   ⇒ 길은 «유추하지 않는다». 지면이 import 하는 줄을 읽어서 적는다.
 *     (src/pages/data/indices.astro 29줄 — `import tape from '../../data/korea-index-tape.json'`)
 */
export const 파는자료 = [
  { 이름: 'Valuation Tape', 길: 'src/data/korea-valuation-tape.json' },
  { 이름: 'Financial Statement Tape', 길: 'src/data/korea-financials-tape.json' },
  { 이름: 'Index Tape', 길: 'src/data/korea-index-tape.json' },
  { 이름: 'Japan Tape', 길: 'src/data/japan-financials-tape.json' },
  { 이름: 'Taiwan Tape', 길: 'src/data/taiwan-financials-tape.json' },
];

/**
 * 한 자료의 «첫 줄»에서 칸 이름을 모은다.
 * ⛔ 파일을 통째로 읽지 않는다 — 수십 MB 다. 첫 행 하나면 칸 이름은 다 나온다.
 * ⛔ 못 읽으면 null — 「칸이 없다」가 아니다.
 */
export function 칸이름모으기(자료) {
  if (!자료 || typeof 자료 !== 'object') return null;
  const 행 = Array.isArray(자료.rows) ? 자료.rows[0] : null;
  if (!행 || typeof 행 !== 'object') return null;
  return Object.keys(행);
}

/** 그 칸들 가운데 시세에서 바로 온 것. ⛔ 못 읽었으면 null — 빈 배열이 아니다 */
export function 시세에서온칸(칸들, 의심 = 시세칸) {
  if (!Array.isArray(칸들)) return null;
  const 낮춘의심 = new Map((의심 ?? []).map((x) => [String(x).toLowerCase(), x]));
  return 칸들.filter((k) => 낮춘의심.has(String(k).toLowerCase()));
}

/**
 * 판정 — 세는 칸이 셋이다.
 * ⛔ 「있다」를 「어긴다」로 읽지 않는다. PER 계산에 쓰는 것은 사장님 판정상 괜찮다.
 */
export function 판정(걸린칸) {
  if (걸린칸 == null) return { 결: '못잼', 말: '칸 이름을 못 읽었다 — 「없다」가 아니다' };
  if (!걸린칸.length) return { 결: '없음', 말: '시세에서 바로 온 칸이 없다' };
  return { 결: '있음', 말: `시세에서 바로 온 칸 ${걸린칸.length}개 — ${걸린칸.join(' · ')}` };
}

/* ── 자가시험 ─────────────────────────────────────────────── */
export function 자가시험() {
  const 결과 = [];
  const 본다 = (이름, 참) => 결과.push({ 이름, 참: !!참 });

  본다('첫 행에서 칸 이름을 모은다',
    칸이름모으기({ rows: [{ code: '1', close: 100 }] }).join() === 'code,close');
  본다('⛔ rows 가 없으면 null — 「칸이 없다」가 아니다', 칸이름모으기({}) === null);
  본다('⛔ null 에 안 터진다', 칸이름모으기(null) === null);
  본다('⛔ 빈 rows 도 null — 첫 행이 없으면 못 읽은 것이다', 칸이름모으기({ rows: [] }) === null);

  본다('시세 칸을 집는다', 시세에서온칸(['code', 'close', 'per']).join() === 'close');
  본다('⭐ 시가총액도 집는다 — 시세 × 주식수라 시세에서 바로 온다',
    시세에서온칸(['marketCap']).length === 1);
  본다('⛔ 대소문자에 안 속는다', 시세에서온칸(['MarketCap']).length === 1);
  본다('⛔ PER·ROE 는 시세 칸이 아니다 — 계산해서 나온 수다',
    시세에서온칸(['per', 'pbr', 'roe']).length === 0);
  본다('⛔ 배열이 아니면 null — 빈 배열이 아니다', 시세에서온칸(null) === null);

  본다('있으면 «있음» — 「어긴다」가 아니다', 판정(['close']).결 === '있음');
  본다('없으면 없음', 판정([]).결 === '없음');
  본다('⛔ 못 읽은 것은 못잼 — 「없다」로 세지 않는다', 판정(null).결 === '못잼');

  return 결과;
}

/* ── 실제로 잰다 ───────────────────────────────────────────── */
const 이파일이진입점 =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (이파일이진입점) {
  if (process.argv.includes('--자가시험')) {
    const 결과 = 자가시험();
    let 빨강 = 0;
    console.log('■ 시세를 그대로 내놓나 — 자가시험');
    for (const r of 결과) { if (!r.참) 빨강++; console.log(`  ${r.참 ? '✅' : '🔴'} ${r.이름}`); }
    console.log(빨강 ? `🔴 빨강 ${빨강}개` : `✅ ${결과.length}가지 다 통과`);
    process.exit(빨강 ? 1 : 0);
  }

  console.log('■ 우리가 파는 자료에 «시세에서 바로 온 칸»이 있나');
  console.log('   🔴 사장님 (2026-10-06): 「시세는 시세를 직접 서비스만 안하면 상관없는거야」');
  console.log('                           「per 등 계산하는데 쓴 건 괜찮아」');
  console.log('   ⛔ 이 자는 «판정하지 않는다. 센다.» 걸린 것이 곧 흠이 아니다\n');

  let 있음 = 0; let 못잼 = 0;
  for (const x of 파는자료) {
    let 자료 = null;
    try { 자료 = JSON.parse(fs.readFileSync(path.join(뿌리, x.길), 'utf8')); } catch { 자료 = null; }
    const 것 = 판정(시세에서온칸(칸이름모으기(자료)));
    const 빛 = 것.결 === '있음' ? '🟡' : 것.결 === '못잼' ? '⬜' : '✅';
    console.log(`   ${빛} ${x.이름.padEnd(26)} ${것.말}`);
    if (것.결 === '있음') 있음 += 1;
    if (것.결 === '못잼') 못잼 += 1;
  }

  console.log('');
  if (있음) {
    console.log(`   🟡 시세에서 바로 온 칸을 가진 자료 ${있음}가지`);
    console.log('   ⇒ 사람이 가른다 — 그 칸이 «계산에 쓰이나», «그대로 팔리나»');
    console.log('      ✅ 계산에 쓰는 것이면 괜찮다 (사장님 판정)');
    console.log('      ⛔ 그대로 팔리는 것이면 사장님께 여쭌다. 혼자 끊지 않는다');
  } else if (!못잼) {
    console.log('   ✅ 시세에서 바로 온 칸이 없다 — 다 계산해서 낸 수다');
  }
  if (못잼) console.log(`   ⬜ 못 읽은 것 ${못잼}가지 — 「없다」로 세지 않았다`);
  /* ⛔ 이 자는 배포를 막지 않는다. 판정은 사람 몫이고, 막으면 거짓 빨강이 된다 */
  process.exit(0);
}
