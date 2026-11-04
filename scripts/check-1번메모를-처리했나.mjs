#!/usr/bin/env node
/**
 * check-1번메모를-처리했나.mjs
 *   — **1번이 세션간 메모에 남긴 것을 내가 처리했나.**
 *
 * ── 🔴 왜 지었나 (2026-11-04 밤 · 사장님) ────────────────────────────
 * 사장님: 「**1번이 내일 이후 기사에 관한 메모를 남길거야. 확인후 조치하도록 해**」
 *
 * ⚠ 기억에 맡기면 창이 바뀔 때 통째로 사라진다. 세션간 메모는 17만 줄이라
 *   새로 붙은 줄이 그 안에 묻힌다. **사람이 기억해서 지키는 구조를 만들지 않는다.**
 *
 * ── 처리했다고 보는 기준 ────────────────────────────────────────────
 * 1번이 올린 칸 «뒤»에 내가 올린 칸이 있으면 처리한 것으로 본다.
 *   ⚠ 「읽었다」가 아니라 «답을 적었나»로 본다 — 읽기만 한 것은 처리가 아니다.
 *   ⛔ 답을 적었다고 일이 끝난 것은 아니다. 이 자는 「답했나」까지만 잰다.
 *     못 재는 것을 잰 척하지 않는다.
 *
 * 쓰는 법
 *   node scripts/check-1번메모를-처리했나.mjs
 *   node scripts/check-1번메모를-처리했나.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 칸 제목 줄에서 「누가 → 누구에게」를 읽는다. 아니면 null */
export function 누가누구에게(줄) {
  const m = String(줄 ?? '').match(/^#{2,3}\s*[^[]*\[\s*([^\]→]+?)\s*→\s*([^\]]+?)\s*\]/);
  if (!m) return null;
  return { 보낸이: m[1].trim(), 받는이: m[2].trim() };
}

/**
 * 아직 답하지 않은 1번의 칸을 찾는다.
 * ⚠ 1번이 올린 칸 뒤에 5번이 올린 칸이 하나도 없으면 「아직」이다.
 */
export function 아직답안한것(글) {
  const 줄들 = String(글 ?? '').split('\n');
  const 칸 = [];
  줄들.forEach((줄, i) => {
    const r = 누가누구에게(줄);
    if (!r) return;
    const 하나에서다섯으로 = r.보낸이.startsWith('1번') && r.받는이.startsWith('5번');
    const 다섯에서하나로 = r.보낸이.startsWith('5번') && r.받는이.startsWith('1번');
    if (하나에서다섯으로) 칸.push({ 줄번호: i + 1, 제목: 줄.trim(), 갈래: '물음' });
    else if (다섯에서하나로) 칸.push({ 줄번호: i + 1, 제목: 줄.trim(), 갈래: '답' });
  });
  const 아직 = [];
  칸.forEach((c, i) => {
    if (c.갈래 !== '물음') return;
    const 뒤에답이있나 = 칸.slice(i + 1).some((x) => x.갈래 === '답');
    if (!뒤에답이있나) 아직.push(c);
  });
  return 아직;
}

const 이파일이진입점 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (이파일이진입점 && process.argv.includes('--자가시험')) {
  let 탈 = 0;
  const 재 = (이름, 참) => { console.log((참 ? '  ✅ ' : '  🔴 ') + 이름); if (!참) 탈 += 1; };
  console.log('■ 자가시험');
  재('칸 제목에서 누가 누구에게인지 읽는다',
    JSON.stringify(누가누구에게('## [1번 → 5번] 2026-11-04 09:35 · 데스킹 부탁'))
    === JSON.stringify({ 보낸이: '1번', 받는이: '5번' }));
  재('앞에 글자가 붙어 있어도 읽는다',
    누가누구에게('## 🔴 [1번 → 5번] 21:45 · 한국시리즈').보낸이 === '1번');
  재('### 도 칸이다', 누가누구에게('### [5번 → 1번] 22:00 · 답').받는이 === '1번');
  재('칸이 아니면 null', 누가누구에게('그냥 글줄') === null);
  재('사장님 지시 칸은 1번 것이 아니다',
    (누가누구에게('## [사장님 지시 → 5번] 어쩌고') || {}).보낸이 !== '1번');

  const 글1 = ['## [1번 → 5번] 부탁', '내용'].join('\n');
  재('🔴 답이 없으면 아직이다', 아직답안한것(글1).length === 1);
  const 글2 = ['## [1번 → 5번] 부탁', '## [5번 → 1번] 했습니다'].join('\n');
  재('뒤에 답이 있으면 처리한 것이다', 아직답안한것(글2).length === 0);
  const 글3 = ['## [5번 → 1번] 먼저 한 말', '## [1번 → 5번] 새 부탁'].join('\n');
  재('⛔ 앞에 있던 답은 뒤에 온 부탁을 지우지 못한다', 아직답안한것(글3).length === 1);
  const 글4 = ['## [1번 → 5번] 첫째', '## [1번 → 5번] 둘째', '## [5번 → 1번] 답'].join('\n');
  재('답 하나가 앞의 둘을 함께 덮는다', 아직답안한것(글4).length === 0);
  재('빈 글에 안 터진다', 아직답안한것('').length === 0 && 아직답안한것(null).length === 0);
  console.log(탈 ? '\n🔴 ' + 탈 + '가지 떨어졌다' : '\n✅ 모두 통과');
  process.exit(탈 ? 1 : 0);
}

if (이파일이진입점) {
  let 글 = '';
  try { 글 = fs.readFileSync(path.join(뿌리, 'docs/세션간-메모.md'), 'utf8'); } catch (e) { 글 = ''; }
  if (!글) {
    console.log('⬜ 세션간 메모를 못 읽었다 — **못 쟀다**. 「없다」가 아니다');
    process.exitCode = 0;
  } else {
    const 아직 = 아직답안한것(글);
    if (!아직.length) {
      console.log('✅ 1번이 남긴 것에 모두 답했다');
      process.exitCode = 0;
    } else {
      console.log('🔴 1번이 남겼는데 «아직 답하지 않은» 칸 ' + 아직.length + '개');
      아직.forEach((c) => console.log('   ' + String(c.줄번호).padStart(7) + '줄  ' + c.제목.slice(0, 90)));
      console.log('\n   ⛔ 「읽었다」는 처리가 아니다. 메모에 답을 적어야 끝이다.');
      console.log('   ⚠ 답을 적었다고 일이 끝난 것도 아니다 — 이 자는 「답했나」까지만 잰다.');
      process.exitCode = 1;
    }
  }
}

export default { 누가누구에게, 아직답안한것 };
