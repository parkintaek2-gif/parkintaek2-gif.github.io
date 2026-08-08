#!/usr/bin/env node
/**
 * check-tests-wired.mjs — **검사가 `npm test` 에 물려 있나**를 검사한다.
 *
 * 🔴 왜 — 2026-08-08 15:4x, 8번이 「npm test 가 안 부르는 것이 있다」고 알렸다. 세어 보니
 *   **검사 파일 68개 중 53개가 안 불리고 있었다.** 부르는 것은 15개뿐이었다.
 *   우리 규칙이 「규칙은 문장이 아니라 검사로 둔다」인데,
 *   **안 불리는 검사는 그냥 문장이다.** 78% 가 문장이었다.
 *
 * ⛔ 그래서 이 검사를 둔다. 새 검사를 만들고 물려 놓지 않으면 여기서 운다.
 * ⚠ 한 번에 53개를 다 물릴 수는 없다 — 어떤 것은 느리고, 어떤 것은 그 기사 하나를 위한
 *   일회용이다. 그래서 **「봐준 목록」**을 두되, 그 목록이 **줄어들기만 하게** 한다.
 *   ⛔ 목록에 새로 넣으려면 **까닭을 한 줄 적어야** 한다. 조용히 늘리지 못하게.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 검사로 세는 파일 이름 무늬 */
export const 검사무늬 = /(\.test\.mjs|^check-.*\.mjs)$/;

/**
 * 봐주는 것 — **까닭이 있어야 들어온다.** 까닭 없이 이름만 넣지 않는다.
 * ⚠ 이 목록은 **줄어들기만 한다.** 늘리려면 왜 상시 검사가 아닌지 적는다.
 */
export const 봐준다 = {
  'check-tests-wired.mjs': '이 파일. 자기를 자기가 부르면 안 된다',
};

export function 갈라내기(파일들, 부름, 봐줄것 = 봐준다) {
  const 검사 = 파일들.filter((f) => 검사무늬.test(f));
  const 안불림 = 검사.filter((f) => !String(부름 ?? '').includes(f) && !(f in 봐줄것));
  return { 검사수: 검사.length, 안불림 };
}

/* ── 검사 ── */
if (process.argv.includes('--selftest')) {
  let 통과 = 0, 실패 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    const ok = typeof 바람 === 'function' ? 바람(실제) : JSON.stringify(실제) === JSON.stringify(바람);
    if (ok) 통과 += 1; else { 실패 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  재본다('물린 것은 안 걸린다', 갈라내기(['a.test.mjs'], 'node scripts/a.test.mjs', {}).안불림, []);
  재본다('안 물린 것은 걸린다', 갈라내기(['a.test.mjs'], 'node scripts/b.test.mjs', {}).안불림, ['a.test.mjs']);
  재본다('봐준 것은 안 걸린다', 갈라내기(['a.test.mjs'], '', { 'a.test.mjs': '까닭' }).안불림, []);
  재본다('검사 아닌 파일은 안 센다', 갈라내기(['build.mjs'], '', {}).검사수, 0);
  재본다('check- 로 시작하면 센다', 갈라내기(['check-x.mjs'], '', {}).검사수, 1);
  재본다('가운데 check- 는 안 센다', 갈라내기(['make-check-x.mjs'], '', {}).검사수, 0);
  재본다('빈 목록', 갈라내기([], '', {}).안불림, []);
  재본다('부름이 null 이어도 안 죽는다', 갈라내기(['a.test.mjs'], null, {}).안불림, ['a.test.mjs']);
  재본다('봐준 것에 까닭이 다 있다', Object.values(봐준다).every((x) => x && x.length > 3), true);
  console.log(실패 ? `\n⛔ ${실패}개 틀렸다 (통과 ${통과})` : `✅ 검사 ${통과}개 통과`);
  process.exit(실패 ? 1 : 0);
}

/* ── 실행 ── */
const j = JSON.parse(fs.readFileSync(path.join(뿌리, 'package.json'), 'utf8'));
const 파일들 = fs.readdirSync(path.join(뿌리, 'scripts'));
const { 검사수, 안불림 } = 갈라내기(파일들, j.scripts?.test ?? '');

/** ⚠ 오늘 53개다. 이 수를 **줄이기만** 한다 — 늘어나면 운다 */
const 오늘까지봐주는수 = 53;

console.log(`검사 파일 ${검사수}개 · npm test 가 부르는 것 ${검사수 - 안불림.length}개 · 안 부르는 것 ${안불림.length}개`);
if (안불림.length > 오늘까지봐주는수) {
  console.error(`\n⛔ 안 불리는 검사가 늘었다 (${오늘까지봐주는수} → ${안불림.length}).`);
  console.error('   새로 만든 검사를 npm test 에 물리십시오. 안 불리는 검사는 문장일 뿐입니다.');
  for (const f of 안불림.slice(0, 10)) console.error(`   · ${f}`);
  process.exit(1);
}
if (안불림.length) {
  console.log(`⚠ 아직 ${안불림.length}개가 안 불립니다 — 줄여 가는 중입니다(오늘 기준 ${오늘까지봐주는수}개).`);
}
