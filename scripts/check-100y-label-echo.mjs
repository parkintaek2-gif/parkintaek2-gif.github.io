#!/usr/bin/env node
/**
 * **이름표가 값에서 되풀이돼 나가나** — 나간 지면을 읽어 잰다.
 *
 *   node scripts/check-100y-label-echo.mjs
 *   node scripts/check-100y-label-echo.mjs --자가시험
 *
 * ## 🔴 왜 (2026-08-08 17:3x · 8번이 눈으로 찾았다)
 *
 *   ```
 *   나간 글자   「출처 … · 이용허락범위 **이용허락범위 제한 없음**」
 *   어디에      /college-major 837장 + /how-long + /size = **839장**
 *   까닭        지면이 <strong>이용허락범위</strong> 를 붙이는데
 *               자료 값에도 그 말이 들어 있었다
 *   ```
 *
 *   ⭐ 8번 말 — *「자가 「출처가 있나」만 보고 **「어떻게 읽히나」는 안 봤습니다.**
 *     출처 대장 검사도, 폰 검사도 초록이었습니다. 겹친 말은 사람 눈에만 걸립니다」*
 *
 *   ⛔ **사람 눈에만 걸리는 것을 사람 눈에 두면 다음에 또 놓친다.** 그래서 자로 옮긴다.
 *
 * ## ⚠ 무엇을 잡고 무엇을 안 잡나 — **좁게 잡는다**
 *
 *   잡는 것은 **「이름표 바로 뒤에 그 이름표가 또 나오는 것」** 하나뿐이다.
 *
 *   ```
 *   ✅ 잡는다   <strong>이용허락범위</strong> 이용허락범위 제한 없음
 *   ⛔ 안 잡는다 …서울대학교</td><td>대학교…      칸이 다른 것이다. 겹친 말이 아니다
 *   ```
 *
 *   처음엔 **글자가 이웃해 되풀이되는 것을 다 잡으려** 했다가 4,963장에서
 *   「대학교 대학교」가 **15,489장**으로 나왔다. 표의 옆 칸이 붙어 보인 것이었다.
 *   ⛔ 소음이 크면 다음 진짜 경보를 못 읽는다. **좁게 잡는 쪽**을 골랐다.
 */
import fs from 'node:fs';
import path from 'node:path';

const 여기 = path.resolve(
  path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'),
  '..',
);
const 빌드 = path.join(여기, 'dist/100y');

/** 이름표 꼴 — 굵은 글씨·표 머리·설명 이름 */
const 이름표규칙 = /<(strong|b|dt|th)\b[^>]*>\s*([^<>]{2,24}?)\s*<\/\1>\s*([^<>]{0,40})/g;

/** 견줄 때 띄어쓰기·문장부호는 뺀다. 「이용허락범위:」와 「이용허락범위」는 같은 말이다 */
export const 다듬기 = (s) => String(s ?? '').replace(/[\s:：·\-—,.()]+/g, '');

/** 이름표 뒤 글자가 그 이름표로 시작하나 */
export function 되풀이됐나(이름표, 뒷글) {
  const a = 다듬기(이름표);
  const b = 다듬기(뒷글);
  if (a.length < 2 || !b) return false;
  return b.startsWith(a);
}

/** 한 지면에서 되풀이된 자리를 찾는다 */
export function 찾기(html) {
  const 걸린 = [];
  for (const m of String(html ?? '').matchAll(이름표규칙)) {
    if (되풀이됐나(m[2], m[3])) 걸린.push({ 이름표: m[2], 뒷글: m[3].trim().slice(0, 30) });
  }
  return 걸린;
}

/* ───────────────────────── 자가 시험 ───────────────────────── */
function 자가시험() {
  const 본보기 = [
    /* 🔴 8번이 찾은 그 병 — 이것을 못 잡으면 이 자는 있으나 마나다 */
    ['옛 병을 잡는다', () => 찾기('<p><strong>이용허락범위</strong> 이용허락범위 제한 없음</p>').length === 1],
    ['멀쩡한 것은 안 잡는다', () => 찾기('<p><strong>이용허락범위</strong> 제한 없음</p>').length === 0],
    ['표 옆 칸은 안 잡는다', () => 찾기('<td>서울대학교</td><td>대학교</td>').length === 0],
    ['th 도 본다', () => 찾기('<th>진학</th>진학 82%').length === 1],
    ['dt 도 본다', () => 찾기('<dt>출처</dt>출처 KOSIS').length === 1],
    ['쌍점이 붙어도 같은 말이다', () => 되풀이됐나('출처', ': 출처 KOSIS') === true],
    ['한 글자 이름표는 안 본다', () => 되풀이됐나('시', '시 서울') === false],
    ['앞이 같아도 다른 말이면 안 잡는다', () => 되풀이됐나('출처', '출발지 서울') === false],
    ['뒷글이 비면 안 잡는다', () => 되풀이됐나('출처', '') === false],
    ['null 이어도 안 죽는다', () => 되풀이됐나(null, null) === false],
    ['빈 html', () => 찾기('').length === 0],
    ['null html', () => 찾기(null).length === 0],
    /* ⚠ 「이용허락범위」 뒤에 「이용허락」만 와도 잡힌다 — 그게 맞다. 반쯤 겹친 것도 겹친 것이다 */
    ['반쯤 겹친 것도 잡는다', () => 되풀이됐나('이용허락', '이용허락범위 제한 없음') === true],
  ];
  let 진 = 0;
  for (const [이름, 재기] of 본보기) {
    let 됐나 = false;
    try { 됐나 = 재기() === true; } catch { 됐나 = false; }
    if (!됐나) { console.log(`  ⛔ 자가시험 실패 — ${이름}`); 진++; }
  }
  console.log(`자가시험 ${본보기.length}개 · 실패 ${진}개`);
  return 진;
}

if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 1 : 0);
const 시험실패 = 자가시험();

/* ───────────────────────── 진짜로 잰다 ───────────────────────── */
if (!fs.existsSync(빌드)) {
  console.log('⬜ 빌드가 없다 — **재지 못했다.** `node scripts/build-once.mjs` 먼저');
  process.exit(2);
}

let 본장 = 0, 사라짐 = 0;
const 걸린 = [];
const 훑기 = (d) => {
  let 목록;
  try { 목록 = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
  for (const e of 목록) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { 훑기(p); continue; }
    if (!e.name.endsWith('.html')) continue;
    let s;
    try { s = fs.readFileSync(p, 'utf8'); } catch { 사라짐++; continue; }
    본장++;
    for (const x of 찾기(s)) 걸린.push(`${path.relative(빌드, p).replace(/\\/g, '/')} — 「${x.이름표}」 뒤에 「${x.뒷글}」`);
  }
};
훑기(빌드);

/* 🔴 0장을 훑고 「0건」이라 하지 않는다 */
if (본장 === 0) {
  console.log('⬜ 지면을 한 장도 못 읽었다 — **재지 못했다**');
  process.exit(2);
}
if (사라짐) console.log(`⬜⬜ 훑는 사이에 사라진 지면 ${사라짐}장 — **덜 읽고 낸 값이다**`);

console.log(`훑은 지면 ${본장}장`);
if (걸린.length === 0) {
  console.log('✅ 이름표가 값에서 되풀이된 곳 0건');
  console.log('⚠ 이 자는 「이름표 바로 뒤」만 본다. 문장 안에서 겹친 말은 못 잡는다');
  process.exit(시험실패 ? 1 : 0);
}
for (const x of 걸린.slice(0, 20)) console.log(`⛔ ${x}`);
if (걸린.length > 20) console.log(`   … 그리고 ${걸린.length - 20}곳 더`);
console.log(`\n⛔ ${걸린.length}곳`);
process.exit(1);
