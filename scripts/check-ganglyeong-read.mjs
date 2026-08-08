#!/usr/bin/env node
/**
 * check-ganglyeong-read.mjs — **오늘 강령을 봤나.** 안 봤으면 다른 일을 못 하게 막는다.
 *
 * 🔴 사장님(2026-08-09 00:5x) — *「그걸 봐야 다른 걸 할 수 있게 해」*
 *
 * ⛔ 강령 문서에는 「하루를 시작하며 본다」가 **처음부터 적혀 있었다.** 그런데 안 봤다.
 *   문장은 안 지켜진다. **못 지나가게 막아야 지켜진다.**
 *
 * 어떻게 되나
 *   각 자리가 `node scripts/ganglyeong-brief.mjs --자리 N` 을 돌리면
 *   `.ganglyeong/<날짜>-<자리>.txt` 에 본 표가 남는다.
 *   이 검사는 **오늘 표가 있나**만 본다. 없으면 1 로 죽는다.
 *
 * 쓰는 법
 *   node scripts/check-ganglyeong-read.mjs --자리 3 --오늘 2026-08-09
 *   node scripts/check-ganglyeong-read.mjs --selftest
 *
 * ⚠ 날짜는 **밖에서 넘긴다.** 이 자가 시계를 보면 자정 근처에서 자기 혼자 날이 바뀐다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 표폴더 = path.join(뿌리, '.ganglyeong');

/** 본 표 이름 — 날짜와 자리로만 만든다 */
export const 표이름 = (오늘, 자리) => `${String(오늘 ?? '').trim()}-${String(자리 ?? '').trim()}.txt`;

/** 오늘 그 자리가 봤나 */
export function 봤나(오늘, 자리, 있나 = (p) => fs.existsSync(p)) {
  const 이름 = 표이름(오늘, 자리);
  if (!오늘 || !자리) return false;
  return 있나(path.join(표폴더, 이름));
}

/* ── 검사 ── */
if (process.argv.includes('--selftest')) {
  let 통과 = 0, 실패 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    const ok = JSON.stringify(실제) === JSON.stringify(바람);
    if (ok) 통과 += 1; else { 실패 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  const 있는척 = (집합) => (p) => 집합.has(path.basename(p));
  재본다('표가 있으면 봤다', 봤나('2026-08-09', '3', 있는척(new Set(['2026-08-09-3.txt']))), true);
  재본다('어제 표는 안 쳐준다', 봤나('2026-08-09', '3', 있는척(new Set(['2026-08-08-3.txt']))), false);
  재본다('남의 표는 안 쳐준다', 봤나('2026-08-09', '3', 있는척(new Set(['2026-08-09-5.txt']))), false);
  재본다('날짜가 없으면 안 봤다', 봤나('', '3', () => true), false);
  재본다('자리가 없으면 안 봤다', 봤나('2026-08-09', '', () => true), false);
  재본다('표 이름은 날짜-자리', 표이름('2026-08-09', '3'), '2026-08-09-3.txt');
  재본다('앞뒤 빈칸을 턴다', 표이름(' 2026-08-09 ', ' 3 '), '2026-08-09-3.txt');
  console.log(실패 ? `\n⛔ ${실패}개 틀렸다 (통과 ${통과})` : `✅ 검사 ${통과}개 통과`);
  process.exit(실패 ? 1 : 0);
}

/* ── 실행 ── */
const argv = process.argv.slice(2);
const 값 = (이름) => { const i = argv.indexOf(이름); return i >= 0 ? argv[i + 1] : ''; };
const 자리 = 값('--자리');
const 오늘 = 값('--오늘');

if (!자리 || !오늘) {
  console.error('⛔ 쓰는 법: node scripts/check-ganglyeong-read.mjs --자리 3 --오늘 2026-08-09');
  process.exit(2);
}

if (봤나(오늘, 자리)) {
  console.log(`✅ ${자리}번 — 오늘(${오늘}) 강령을 봤다.`);
  process.exit(0);
}

console.error(`\n⛔ ${자리}번 — **오늘(${오늘}) 강령을 아직 안 봤다.**`);
console.error('   먼저 이것부터 하십시오 —');
console.error(`     node scripts/ganglyeong-brief.mjs --자리 ${자리}`);
console.error('\n   🔴 사장님: 「자꾸 취지·목적을 잊고 옆으로 새지 마라. 그걸 봐야 다른 걸 할 수 있게 해」');
process.exit(1);
