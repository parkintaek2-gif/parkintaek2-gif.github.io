#!/usr/bin/env node
/**
 * 백년지도 CSS 를 **주석 없이** 내보낸다.
 *
 * ## 🔴 왜 (2026-08-09 11:4x · 3번이 라이브에서 잼)
 *
 *   2번이 klifemap 에서 *「우리 주석이 손님 js 로 나간다 — 네 파일 17건」*을 잡고
 *   각 자리에 재 보라고 했다. 백년지도는 「Astro 정적이라 js 를 안 내보낸다」로
 *   깨끗할 줄 알았는데, **CSS 가 그대로 나가고 있었다.**
 *
 *   ```
 *   https://100yearmap.com/style.css
 *      「사장님 지시로 남아 있던 항목」 · 「사장님 지시 2026-08-05」  3건
 *      「1번이 회람 문서에 …라고 적어」                              2건
 *   ```
 *   ⛔ 화면엔 안 보이는데 **주소를 치면 누구나 읽는다.** 지시 내용도 날짜도 자리 번호도 나간다.
 *
 * ## ⚠ 그렇다고 주석을 지우지 않는다
 *
 *   그 주석은 **왜 그렇게 해 두었는지**를 담고 있다. 지우면 다음 사람이 같은 실수를 다시 한다
 *   (「is:inline 으로 되돌리지 말 것」·「100y.css 로 이름 짓지 말 것」이 거기 있다).
 *
 *   ✅ 그래서 **둘로 가른다** —
 *   ```
 *   src/styles/100y.src.css     주석이 든 정본.  ⛔ 손님에게 안 나간다(public 이 아니다)
 *   public/100y/style.css       주석을 뺀 것.    ⭐ 이 자가 만든다. 손으로 고치지 않는다
 *   ```
 *
 * ## ⛔ 손으로 고치지 말 것
 *
 *   `public/100y/style.css` 를 직접 고치면 다음 빌드에 덮인다.
 *   `npm test` 가 **둘이 어긋났는지** 본다(`--확인`).
 *
 *   ```
 *   node scripts/build-100y-style.mjs          내보낸다
 *   node scripts/build-100y-style.mjs --확인    어긋났으면 운다 (npm test 가 부른다)
 *   node scripts/build-100y-style.mjs --자가시험
 *   ```
 */
import fs from 'node:fs';
import path from 'node:path';

const 뿌리 = process.cwd();
const 정본 = path.join(뿌리, 'src/styles/100y.src.css');
const 내보낼곳 = path.join(뿌리, 'public/100y/style.css');

/**
 * CSS 주석을 뺀다.
 *
 * ⚠ 글자값 안의 `/*` 는 주석이 아니다 — `content: "/* 이건 글자 *\/"` 같은 것.
 *   지금 우리 CSS 에는 없지만, **없다고 안 지키면 언젠가 한 줄이 통째로 사라진다.**
 *   그래서 따옴표 안은 건너뛴다.
 * ⚠ 빈 줄이 겹치는 것도 정리한다 — 주석만 있던 줄이 빈 줄로 남는다.
 */
export function 주석빼기(글) {
  let 나온다 = '';
  let i = 0;
  let 따옴표 = null;
  while (i < 글.length) {
    const c = 글[i];
    const 다음 = 글[i + 1];
    if (따옴표) {
      나온다 += c;
      if (c === '\\') { 나온다 += 다음 ?? ''; i += 2; continue; }
      if (c === 따옴표) 따옴표 = null;
      i += 1;
      continue;
    }
    if (c === '"' || c === "'") { 따옴표 = c; 나온다 += c; i += 1; continue; }
    if (c === '/' && 다음 === '*') {
      const 끝 = 글.indexOf('*/', i + 2);
      i = 끝 < 0 ? 글.length : 끝 + 2;
      continue;
    }
    나온다 += c;
    i += 1;
  }
  return 나온다
    .split('\n')
    .map((줄) => 줄.replace(/\s+$/, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\n+/, '')
    .trimEnd() + '\n';
}

function 자가시험() {
  const 것들 = [
    ['주석을 뺀다', () => 주석빼기('a{color:red} /* 사장님 지시 */').includes('사장님') === false],
    ['규칙은 남는다', () => 주석빼기('/* 왜 */ a{color:red}').includes('a{color:red}')],
    ['여러 줄 주석도 뺀다', () => 주석빼기('/*\n 1번이 적었다\n*/ b{}').includes('1번이') === false],
    ['따옴표 안의 /* 는 안 건드린다', () =>
      주석빼기('a::after{content:"/* 글자 */"}').includes('content:"/* 글자 */"')],
    ['안 닫힌 주석은 끝까지 뺀다', () => 주석빼기('a{} /* 안 닫음').trim() === 'a{}'],
    ['빈 줄이 겹치지 않는다', () => !/\n\n\n/.test(주석빼기('a{}\n/* x */\n\n\n/* y */\nb{}'))],
    ['⛔ 표시도 안 나간다', () => 주석빼기('/* ⛔ 하지 마라 */ a{}').includes('⛔') === false],
    ['글이 아니면 안 죽는다', () => 주석빼기('') === '\n'],
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

if (!fs.existsSync(정본)) {
  console.log(`⬜ 정본이 없다 — ${path.relative(뿌리, 정본)}`);
  process.exit(2);
}

const 원본 = fs.readFileSync(정본, 'utf8');
const 낼것 = 주석빼기(원본);
const 지금 = fs.existsSync(내보낼곳) ? fs.readFileSync(내보낼곳, 'utf8') : null;

/** 규칙이 사라지지 않았나 — 중괄호 짝으로 센다. ⛔ 주석을 빼다 규칙을 지우면 지면이 민얼굴이 된다 */
const 규칙수 = (s) => (s.match(/\{/g) ?? []).length;
if (규칙수(낼것) !== 규칙수(원본)) {
  console.log(`⛔ 규칙 수가 달라졌다 — 정본 ${규칙수(원본)} · 낸 것 ${규칙수(낼것)}. **안 쓴다**`);
  process.exit(1);
}

if (process.argv.includes('--확인')) {
  if (지금 === 낼것) {
    console.log(`✅ 내보낸 CSS 가 정본과 맞다 (${(낼것.length / 1024).toFixed(1)}KB · 주석 ${((원본.length - 낼것.length) / 1024).toFixed(1)}KB 뺌)`);
    process.exit(시험실패 ? 1 : 0);
  }
  console.log('⛔ `public/100y/style.css` 가 정본과 다르다 — `node scripts/build-100y-style.mjs` 를 돌려라');
  process.exit(1);
}

fs.writeFileSync(내보낼곳, 낼것, 'utf8');
console.log(
  `✅ 주석 없는 CSS 를 냈다 — ${(원본.length / 1024).toFixed(1)}KB → ${(낼것.length / 1024).toFixed(1)}KB` +
    ` (주석 ${((원본.length - 낼것.length) / 1024).toFixed(1)}KB 가 손님에게 안 나간다)`,
);
process.exit(시험실패 ? 1 : 0);
