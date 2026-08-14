#!/usr/bin/env node
/**
 * **쓰레기 글자가 손님 화면에 나갔나** — 사장님 지시(2026-08-14).
 *
 * 🔴 사장님: 「사이트는 내가 진짜 안 봐도 되게 **완벽하게 무오류**가 될 때까지 검수 및 감수하도록」
 *   그날 폰으로 리포트를 넘기시다 흠 아홉을 찾으셨다. 검수하던 세션 셋이 못 찾은 것이다.
 *   그중 하나는 **「리포트 생성 중 오류가 발생했습니다」가 손님 PDF 에 그대로 찍힌 것**이었다.
 *   🔴 그때 검사기는 **통과**시켰다. 「AI 절이 있나」를 세었고 있었기 때문이다.
 *   ⭐ **셈은 맞고 뜻이 틀렸다.**
 *
 * ── ⛔ 이 자가 지키는 것 ──────────────────────────────────────
 * ⛔ **빌드된 화면을 본다.** 소스가 아니다. 손님이 보는 것은 dist 다.
 * ⛔ 코드·스타일·스크립트 안은 안 센다. `null` 은 JS 에 늘 있다 — **손님 눈에 닿는 글자**만 본다.
 * ⛔ 우리가 일부러 쓴 말과 사고를 가른다 — 기사에 「error」가 나올 수 있다(오차를 말할 때).
 *    그래서 **낱말이 아니라 꼴**로 본다: `undefined`·`[object Object]`·`{{ }}` 같은 것.
 * ⚠ 늘리는 수는 막는다. 기준선은 0 이다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 방 = 'dist/wikitip';

/**
 * 🔴 이것이 화면에 있으면 **무조건 빨간불**이다. 사장님이 짚으신 목록에서 왔다.
 *   ⚠ 낱말 하나가 아니라 **틀**로 적는다 — 「error」만 보면 기사의 「margin of error」가 걸린다.
 */
export const 쓰레기 = [
  { 이름: '틀이 안 채워짐', 자: /\{\{[^}]{0,60}\}\}/g },
  { 이름: 'undefined', 자: /\bundefined\b/g },
  { 이름: 'NaN', 자: /(^|[\s>(])NaN([\s<).,%]|$)/g },
  { 이름: '[object …]', 자: /\[object [A-Z]\w*\]/g },
  { 이름: 'TODO·FIXME', 자: /\b(TODO|FIXME|XXX)\b/g },
  /**
   * 🔴 8/14 — 처음에 「글자 null 이 있으면 흠」으로 했다가 **둘 다 헛경보**였다.
   *   ① 「Under that null, 513 of the 700…」 — 귀무가설. 통계 용어다
   *   ② 「The cell in our data file is null, not 0」 — 못 잰 것을 0 으로 안 센다는 **우리 원칙**을 쓴 문장
   *   ⛔ 헛경보가 나면 아무도 이 자를 안 본다. 그게 자를 죽이는 길이다.
   *
   * ⭐ 그래서 **값 자리에 홀로 선 것**만 본다 — 표 칸·목록 칸이 통째로 `null` 인 것.
   *   문장 안의 null 은 사람이 쓴 말이고, 칸 안의 null 은 코드가 흘린 것이다.
   */
  { 이름: '값 자리가 null·undefined', 자: /<(td|th|li|dd)[^>]*>\s*(null|undefined|NaN|\[object [A-Z]\w*\])\s*<\/\1>/gi },
  { 이름: '오류 문구(한국어)', 자: /(오류가 발생|불러오는 중|생성 중입니다|실패했습니다|잠시 후 다시)/g },
  { 이름: '오류 문구(영어)', 자: /(Error: |Failed to |Loading\.\.\.|Something went wrong|Not Found\b)/g },
  { 이름: '깨진 글자', 자: /�/g },
  { 이름: '빈 표 칸이 줄줄이', 자: /(<td[^>]*>\s*<\/td>\s*){4,}/g },
];

/**
 * ⛔ 손님 눈에 닿는 글자만 남긴다.
 *   `<script>`·`<style>`·주석·`<template>` 안은 코드다. 거기 `null` 이 있는 것은 흠이 아니다.
 *   ⚠ Astro 는 자료를 `<script type="application/json">` 으로도 실어 보낸다. 그것도 코드다.
 */
export function 보이는글자(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<template[\s\S]*?<\/template>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ');
}

/** ⚠ 태그를 지우기 전에 봐야 하는 것들 — 태그 자체가 단서다 */
export function 태그도보는것() {
  return 쓰레기.filter((x) => x.이름 === '빈 표 칸이 줄줄이' || x.이름 === '값 자리가 null·undefined');
}

export function 훑기(html) {
  const 글자 = 보이는글자(html);
  const 찾은 = [];
  for (const x of 쓰레기) {
    const 볼것 = 태그도보는것().includes(x) ? html : 글자;
    const m = 볼것.match(x.자);
    if (m) 찾은.push({ 무엇: x.이름, 몇: m.length, 보기: String(m[0]).slice(0, 60).replace(/\s+/g, ' ') });
  }
  return 찾은;
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    const ok = typeof 바람 === 'function' ? 바람(실제) : JSON.stringify(실제) === JSON.stringify(바람);
    if (ok) 통 += 1; else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제).slice(0, 160)}`); }
  };
  재본다('깨끗한 화면은 0', 훑기('<p>Seventy-five titles charted in 93 countries.</p>'), []);
  재본다('🔴 undefined 를 잡는다', 훑기('<p>Reach: undefined</p>').map((x) => x.무엇), ['undefined']);
  /* ⚠ 표 칸에 두면 두 규칙에 다 걸린다. 문장 안에 두어 이 규칙만 잰다 */
  재본다('🔴 [object Object] 를 잡는다',
    훑기('<p>Reach was [object Object] here.</p>').map((x) => x.무엇), ['[object …]']);
  재본다('🔴 안 채워진 틀을 잡는다', 훑기('<h1>{{ title }}</h1>').map((x) => x.무엇), ['틀이 안 채워짐']);
  재본다('🔴 사장님이 보신 그 문구를 잡는다',
    훑기('<p>리포트 생성 중 오류가 발생했습니다</p>').map((x) => x.무엇), ['오류 문구(한국어)']);
  재본다('🔴 NaN 을 잡는다', 훑기('<td>NaN%</td>').map((x) => x.무엇), ['NaN']);
  재본다('🔴 깨진 글자를 잡는다', 훑기('<p>�</p>').map((x) => x.무엇), ['깨진 글자']);
  /* ⛔ 코드 안은 흠이 아니다 — 여기서 헛경보가 나면 아무도 이 자를 안 본다 */
  재본다('⛔ script 안의 null 은 안 센다', 훑기('<script>let a=null</script><p>ok</p>'), []);
  재본다('⛔ style 안은 안 센다', 훑기('<style>.a{color:red}</style><p>ok</p>'), []);
  재본다('⛔ 주석 안은 안 센다', 훑기('<!-- TODO: 나중에 --><p>ok</p>'), []);
  /* ⛔ 우리가 일부러 쓴 말과 사고를 가른다. 🔴 8/14 에 여기서 헛경보 둘이 났다 */
  재본다('⛔ 「margin of error」는 흠이 아니다',
    훑기('<p>within the margin of error</p>'), []);
  재본다('⛔ 「null hypothesis」는 흠이 아니다',
    훑기('<p>the null hypothesis holds</p>'), []);
  재본다('⛔ 「Under that null, 513…」은 흠이 아니다 — 귀무가설이다',
    훑기('<p>Under that null, 513 of the 700 would have.</p>'), []);
  재본다('⛔ 「is null, not 0」은 흠이 아니다 — 우리 원칙을 쓴 문장이다',
    훑기('<p>The cell is null, not 0, because those differ.</p>'), []);
  재본다('⛔ 「Nan」이 든 이름은 안 센다 — 김난희 같은 것',
    훑기('<p>Nanjing and Nancy</p>'), []);
  /* 🔴 그러나 **값 자리**에 홀로 선 것은 코드가 흘린 것이다 */
  재본다('🔴 표 칸이 통째로 null 이면 잡는다',
    훑기('<tr><td>Seoul</td><td>null</td></tr>').map((x) => x.무엇), ['값 자리가 null·undefined']);
  재본다('🔴 목록 칸이 undefined 면 잡는다',
    훑기('<li>undefined</li>').map((x) => x.무엇).includes('값 자리가 null·undefined'), true);
  재본다('⛔ 값이 든 칸은 안 잡는다', 훑기('<td>42</td>'), []);
  재본다('빈 표 칸이 줄줄이면 잡는다',
    훑기('<tr><td></td><td></td><td></td><td></td></tr>').map((x) => x.무엇), ['빈 표 칸이 줄줄이']);
  재본다('빈 칸 하나는 안 잡는다', 훑기('<tr><td></td><td>5</td></tr>'), []);
  console.log(`쓰레기 글자 검사 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  if (!fs.existsSync(방)) {
    console.error(`⛔ ${방} 이 없다 — npm run build 를 먼저 돌린다`);
    process.exit(1);
  }
  const 파일들 = [];
  const 훑어담기 = (곳) => {
    for (const 것 of fs.readdirSync(곳, { withFileTypes: true })) {
      const 길 = path.join(곳, 것.name);
      if (것.isDirectory()) 훑어담기(길);
      else if (것.name.endsWith('.html')) 파일들.push(길);
    }
  };
  훑어담기(방);

  const 걸린것 = [];
  for (const f of 파일들) {
    const 찾은 = 훑기(fs.readFileSync(f, 'utf8'));
    if (찾은.length) 걸린것.push({ 길: f, 찾은 });
  }

  console.log(`쓰레기 글자 검사 — 화면 ${파일들.length}장 · 걸린 화면 ${걸린것.length}장`);
  for (const x of 걸린것.slice(0, 40)) {
    const 주소 = x.길.replace(/\\/g, '/').replace('dist/wikitip', '').replace(/\.html$/, '') || '/';
    console.log(`   🔴 ${주소}`);
    for (const y of x.찾은) console.log(`        ${y.무엇} ×${y.몇}  「${y.보기}」`);
  }
  if (걸린것.length > 40) console.log(`   … 그 밖 ${걸린것.length - 40}장`);

  if (걸린것.length) {
    console.error('\n⛔ **손님 화면에 쓰레기 글자가 있다.** 기준선은 0 이다.');
    process.exit(1);
  }
  console.log('✅ 쓰레기 글자 없음');
}
