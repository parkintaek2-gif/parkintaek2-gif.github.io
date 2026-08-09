#!/usr/bin/env node
/**
 * **우리끼리 쓰는 말이 손님 파일로 새 나가나** — 라이브에서 잰다.
 *
 * ## 🔴 왜 (2026-08-09 11:2x · 2번)
 *
 *   klifemap 이 **네 파일 17건**을 내보내고 있었다 —
 *   `/* 🔴 [2026-08-08] … 지시 「…」` 이 그대로. 화면엔 안 보이는데 **주소를 치면 누구나 읽는다.**
 *
 *   ⛔ 2번이 처음에 **HTML 만 재고** 「0건」이라 적었다가 무름. 첫 화면만 보면 안 된다.
 *   ⛔ 저장소를 보면 안 된다 — 저장소에는 주석이 **있는 것이 맞다.** 나가는 것이 문제다.
 *
 * ## 🔴 백년지도에서 실제로 나온 것 — **CSS 였다**
 *
 *   「Astro 정적이라 js 를 안 내보낸다」로 깨끗한 줄 알았는데 `/style.css` 가 통째로 나갔다.
 *   ```
 *   사장님 3건 · 「1번이 …」 2건 · ⛔ 표시 다수   (주석 6.1KB)
 *   ```
 *   → `scripts/build-100y-style.mjs` 로 **주석 없는 것만 내보내게** 갈랐다.
 *
 * ## ⚠ 낱말이 아니라 **주석**을 찾는다
 *
 *   ```
 *   ⛔ 낱말로 찾으면    /how-long 의 「사장님이 혼자 장사하고 계실 수도」에 운다 — 그건 손님에게 하는 말이다
 *                      schools.csv 의 「공항로811번가길」에 운다 — 그건 주소다
 *   ✅ 주석에서 찾으면  나가면 안 되는 것만 남는다
 *   ```
 *   ⚠ 소음이 크면 다음 진짜 경보를 못 읽는다. 오늘 세 자리가 다 이 자리에서 데었다.
 *
 *   ```
 *   node scripts/check-100y-leak.mjs            라이브를 잰다
 *   node scripts/check-100y-leak.mjs --자가시험
 *   ```
 */
import fs from 'node:fs';
import path from 'node:path';

const 빌드 = path.resolve(process.cwd(), 'dist/100y');
const 밑 = 'https://100yearmap.com';

/** 주석 안에 있으면 안 되는 말 */
const 안될말 = [
  ['사장님', /사장님/],
  ['자리 번호', /[1-9]번(?:이|가|은|는|을|를|께|에게)/],
  ['지시', /지시(?:서|사항|를|한|했)/],
  ['세션', /세션\s*간/],
  ['프롬프트', /프롬프트/],
  ['할 일 표시', /TODO|FIXME/],
];

/** `/* … *\/` 와 `<!-- … -->` 를 뽑는다. ⚠ 따옴표 안의 `/*` 는 주석이 아니다 */
export function 주석뽑기(글, 갈래) {
  const 나온다 = [];
  if (갈래 === 'html') {
    for (const m of String(글).matchAll(/<!--([\s\S]*?)-->/g)) 나온다.push(m[1]);
    return 나온다;
  }
  let i = 0;
  let 따옴표 = null;
  const s = String(글);
  while (i < s.length) {
    const c = s[i];
    if (따옴표) {
      if (c === '\\') { i += 2; continue; }
      if (c === 따옴표) 따옴표 = null;
      i += 1;
      continue;
    }
    if (c === '"' || c === "'") { 따옴표 = c; i += 1; continue; }
    if (c === '/' && s[i + 1] === '*') {
      const 끝 = s.indexOf('*/', i + 2);
      나온다.push(s.slice(i + 2, 끝 < 0 ? s.length : 끝));
      i = 끝 < 0 ? s.length : 끝 + 2;
      continue;
    }
    if (c === '/' && s[i + 1] === '/') {
      const 끝 = s.indexOf('\n', i);
      나온다.push(s.slice(i + 2, 끝 < 0 ? s.length : 끝));
      i = 끝 < 0 ? s.length : 끝;
      continue;
    }
    i += 1;
  }
  return 나온다;
}

/** 주석 하나에서 안 될 말을 찾는다 */
export function 새는말찾기(주석) {
  return 안될말.filter(([, 무늬]) => 무늬.test(주석)).map(([이름]) => 이름);
}

function 자가시험() {
  const 것들 = [
    ['css 주석을 뽑는다', () => 주석뽑기('a{} /* 사장님 지시 */', 'css').length === 1],
    ['두 줄짜리 주석도', () => 주석뽑기('/* 가\n나 */', 'css')[0].includes('나')],
    ['따옴표 안은 주석이 아니다', () => 주석뽑기('a{content:"/* 사장님 */"}', 'css').length === 0],
    ['// 도 주석이다', () => 주석뽑기('let a=1 // 1번이 적었다', 'js').length === 1],
    ['html 주석을 뽑는다', () => 주석뽑기('<p>x</p><!-- 지시사항 -->', 'html').length === 1],
    ['주석이 없으면 빈 목록', () => 주석뽑기('a{color:red}', 'css').length === 0],
    ['사장님을 잡는다', () => 새는말찾기('사장님 지시로 고쳤다').includes('사장님')],
    ['자리 번호를 잡는다', () => 새는말찾기('1번이 회람에 적었다').includes('자리 번호')],
    ['⛔ **손님에게 하는 말**에는 안 운다', () =>
      새는말찾기 && 주석뽑기('<p>사장님이 혼자 장사하고 계실 수도 있습니다</p>', 'html').length === 0],
    ['⛔ 주소 「811번가길」에는 안 운다', () =>
      주석뽑기('부산광역시 강서구 공항로811번가길 46', 'csv').length === 0],
    ['보통 주석에는 안 운다', () => 새는말찾기('여기는 표를 가로로 민다').length === 0],
    ['빈 글에 안 죽는다', () => 주석뽑기('', 'css').length === 0],
  ];
  let 진 = 0;
  for (const [이름, 재기] of 것들) {
    let 됐나 = false;
    let 까닭 = null;
    try { 됐나 = 재기() === true; } catch (e) { 까닭 = e?.message ?? String(e); }
    if (!됐나) { console.log(`  ⛔ 자가시험 실패 — ${이름}${까닭 ? ` (터졌다: ${까닭})` : ''}`); 진 += 1; }
  }
  console.log(`자가시험 ${것들.length}개 · 실패 ${진}개`);
  return 진;
}

if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 1 : 0);
const 시험실패 = 자가시험();

/* ─────────────── 무엇이 나가는지부터 센다 ─────────────── */
function 훑기(디렉토리, 모음 = []) {
  let 것들;
  try { 것들 = fs.readdirSync(디렉토리, { withFileTypes: true }); } catch { return 모음; }
  for (const 것 of 것들) {
    const p = path.join(디렉토리, 것.name);
    if (것.isDirectory()) 훑기(p, 모음);
    else 모음.push(p);
  }
  return 모음;
}

const 모두 = 훑기(빌드);
if (모두.length === 0) {
  console.log('⬜ 빌드가 없다 — **재지 못했다.** `node scripts/build-once.mjs` 먼저');
  process.exit(2);
}

const 곧게 = (p) => '/' + path.relative(빌드, p).split(path.sep).join('/');
const 글파일 = new Set(['.js', '.mjs', '.json', '.csv', '.txt', '.xml', '.css', '.svg', '.map', '.webmanifest']);
const html = 모두.filter((p) => p.endsWith('.html'));
const 글로된것 = 모두.filter((p) => 글파일.has(path.extname(p).toLowerCase()));
const 그림등 = 모두.length - 글로된것.length - html.length;

/** ⚠ 지면은 4,900장이라 다 못 받는다 — **갈래마다 세 장**씩 고르게 뽑는다 */
const 갈래별 = new Map();
for (const p of html) {
  const 첫 = 곧게(p).split('/').filter(Boolean)[0].replace(/\.html$/, '');
  if (!갈래별.has(첫)) 갈래별.set(첫, []);
  갈래별.get(첫).push(p);
}
const 뽑은 = [];
for (const [, 목록] of 갈래별) {
  const 걸음 = Math.max(1, Math.floor(목록.length / 3));
  for (let i = 0; i < Math.min(3, 목록.length); i++) 뽑은.push(목록[(i * 걸음) % 목록.length]);
}

const 볼것 = [...new Set([...글로된것.map(곧게), ...뽑은.map(곧게), '/'])];

console.log('■ 무엇이 나가나 (빌드에서 셈)');
console.log(`   글로 된 파일 ${글로된것.length}개 · 그림 등 ${그림등.toLocaleString()}개 · 지면 ${html.length.toLocaleString()}장`);
console.log(`   → 라이브에서 받아 본 것 ${볼것.length}개 (글 파일은 **전부** · 지면은 갈래마다 세 장)`);

let 읽음 = 0;
let 못읽음 = 0;
let 주석수 = 0;
const 걸린것 = [];

for (const 길 of 볼것) {
  let 글;
  try {
    const r = await fetch(밑 + encodeURI(길));
    if (r.status !== 200) { 못읽음 += 1; continue; }
    글 = await r.text();
  } catch {
    못읽음 += 1;
    continue;
  }
  읽음 += 1;
  const 갈래 = 길.endsWith('.html') || 길 === '/' ? 'html' : path.extname(길).slice(1) || 'txt';
  for (const 주석 of 주석뽑기(글, 갈래)) {
    주석수 += 1;
    const 난것 = 새는말찾기(주석);
    if (난것.length) 걸린것.push({ 길, 난것, 보기: 주석.replace(/\s+/g, ' ').trim().slice(0, 60) });
  }
}

console.log(`■ 라이브에서 읽은 것 ${읽음}개 · 못 읽은 것 ${못읽음}개 · 그 안의 주석 ${주석수.toLocaleString()}개`);
if (걸린것.length === 0) {
  console.log('✅ 손님 파일에 실려 나간 우리 말 **0건**');
} else {
  console.log(`⛔ 걸린 것 **${걸린것.length}건**`);
  for (const x of 걸린것.slice(0, 20)) console.log(`   ${x.길}  [${x.난것.join('·')}]  ${x.보기}`);
}
console.log('⚠ 이 자는 **글로 읽히는 파일의 주석**만 본다. 그림 속 글자는 못 본다');
process.exit(시험실패 || 걸린것.length || 못읽음 ? 1 : 0);
