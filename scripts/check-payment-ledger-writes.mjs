#!/usr/bin/env node
/**
 * check-payment-ledger-writes.mjs — **결제 점검이 «지시대로 돌렸을 때» 대장에 남는가.**
 *
 *   node scripts/check-payment-ledger-writes.mjs --자가시험
 *   node scripts/check-payment-ledger-writes.mjs
 *
 * ── 왜 이 자가 생겼나 (2026-09-18 15:1x · 5번) ──────────────────────────
 * 매시 결제 점검의 고정 지시는 이 한 줄이다 —
 * ```
 *   node scripts/check-seoulmarkets-payment.mjs
 * ```
 * 그런데 그 자는 `--적는다` 를 «붙여야만» 대장에 적고 있었다. 그래서 지시대로 돌리면
 * 화면에는 「✅ 팔린다」가 뜨는데 **대장에는 한 줄도 안 남았다.**
 * 실제로 2026-09-18 에 seoulmarkets 줄이 12:11 뒤로 끊겨 있었다 — 13·14·15시 다
 * 돌렸는데도. 같은 자리의 klifemap 쪽 줄은 이어져 있어서, 대장만 보면 서울마켓츠를
 * 안 잰 것처럼 보였다.
 *
 * ⛔ 「봤다」는 증거가 아니다. 대장의 줄이 증거다.
 *   그 증거가 **사람이 꼬리표를 기억해야만** 남는 구조면, 언젠가 반드시 빠진다.
 * ⛔ 이런 결함은 «조용하다» — 검사는 초록이고 화면도 초록이고 아무 데도 빨간불이 없다.
 *   대장을 눈으로 훑어야만 보인다. 그래서 사람 대신 이 자가 본다.
 *
 * ── 무엇을 재나 ─────────────────────────────────────────────────────────
 * 결제 점검 자들이 대장에 적는 자리를 «어떤 조건으로» 감싸고 있는지 본다.
 *   🔴 `--적는다` 를 요구하면  →  지시대로 돌릴 때 안 남는다
 *   ✅ 기본으로 적으면         →  남는다
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 대장에 적는 자들 — 고정 지시가 «꼬리표 없이» 부르는 것들이다 */
export const 볼것 = [
  'scripts/check-seoulmarkets-payment.mjs',
  'scripts/check-klifemap-payment.mjs',
];

/**
 * 글 안에서 «대장에 적는 자리»가 꼬리표를 요구하는지 본다.
 * @returns {{적나:boolean, 까닭:string}}
 */
export function 기본으로적나(글) {
  const s = String(글 ?? '');
  if (!/손님길-자물쇠/.test(s)) return { 적나: false, 까닭: '대장에 적는 자리가 아예 없다' };
  /* 주석은 걷어낸다 — 설명하는 글을 코드로 세면 안 된다(2026-09-18 에 세 번 겪었다) */
  const 깐 = s
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/^([ \t]*)\/\/[^\n]*/gm, (m, 앞) => 앞 + ' '.repeat(m.length - 앞.length));
  if (/if\s*\(\s*process\.argv\.includes\(\s*['"]--적는다['"]\s*\)\s*\)/.test(깐)) {
    return { 적나: false, 까닭: '`--적는다` 를 붙여야만 적는다 — 고정 지시엔 그 꼬리표가 없다' };
  }
  return { 적나: true, 까닭: '기본으로 적는다' };
}

/* ── 자가시험 — 일부러 틀린 것을 넣어 «정말 무는지» 본다 ───────── */
function 자가시험() {
  let 든것 = 0, 깬것 = 0;
  const 재 = (무엇, 실제, 바람) => {
    if (실제 === 바람) 든것 += 1;
    else { 깬것 += 1; console.log(`🔴 ${무엇}\n   나온것 ${실제}\n   바람   ${바람}`); }
  };
  재('🔴 --적는다 를 요구하면 잡는다',
    기본으로적나("if (process.argv.includes('--적는다')) { 손님길-자물쇠 }").적나, false);
  재('✅ 기본으로 적으면 통과',
    기본으로적나("if (!process.argv.includes('--안적는다')) { 손님길-자물쇠 }").적나, true);
  재('✅ 아무 조건 없이 적어도 통과',
    기본으로적나('await import("./손님길-자물쇠.mjs")').적나, true);
  재('⛔ 대장에 적는 자리가 없으면 그것도 잡는다',
    기본으로적나('console.log("팔린다")').적나, false);
  재('⛔ 큰따옴표로 써도 잡는다',
    기본으로적나('if (process.argv.includes("--적는다")) { 손님길-자물쇠 }').적나, false);
  재('⭐ 주석 «안»에 적힌 옛 코드는 세지 않는다 — 설명하는 글을 코드로 읽지 않는다',
    기본으로적나("/* 옛날엔 if (process.argv.includes('--적는다')) 였다 */\n손님길-자물쇠").적나, true);
  재('⛔ null 도 견딘다', 기본으로적나(null).적나, false);

  console.log(`\n자가시험 ${든것}가지 통과${깬것 ? ` · 🔴 ${깬것}가지 깨짐` : ''}`);
  return 깬것 === 0;
}

/* ── 본 일 ──────────────────────────────────────────────── */
function 본일() {
  console.log('■ 결제 점검이 «지시대로 돌렸을 때» 대장에 남는가');
  let 깨진것 = 0;
  for (const 길 of 볼것) {
    const p = path.join(뿌리, 길);
    if (!fs.existsSync(p)) { console.log(`   ⬜ ${길} — 파일이 없다(못 쟀다)`); continue; }
    const { 적나, 까닭 } = 기본으로적나(fs.readFileSync(p, 'utf8'));
    console.log(`   ${적나 ? '✅' : '🔴'} ${path.basename(길).padEnd(34)} ${까닭}`);
    if (!적나) 깨진것 += 1;
  }
  if (!깨진것) { console.log('\n✅ 다 남는다 — 「팔린다」인지 아닌지가 대장에 쌓인다'); return true; }
  console.log(`\n🔴 ${깨진것}개가 «지시대로 돌리면» 대장에 안 남는다`);
  console.log('   ✅ 고치는 법 — 그 자리를 `if (!process.argv.includes(\'--안적는다\'))` 로 바꾼다');
  console.log('   ⛔ 「돌릴 때 꼬리표를 붙이면 된다」로 넘기지 않는다 — 사람이 기억해야 하는 증거는 언젠가 빠진다');
  return false;
}

const 이파일이시작인가 = process.argv[1]
  && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (이파일이시작인가) {
  if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);
  else process.exit(본일() ? 0 : 1);
}
