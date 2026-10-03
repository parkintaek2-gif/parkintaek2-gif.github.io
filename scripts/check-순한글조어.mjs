/**
 * check-순한글조어.mjs — 고객 화면과 외부 작업물에 «신문에서 안 쓰는 순우리말 조어»가 있는지 찾는다.
 *
 * 🔴 사장님 (2026-10-03): 「한국에서는 실제로 순한글은 잘 안써, 주로 한자어를 씀..
 *    기억해놔. 고객 대상 서비스, 외부 대상 작업물에 적용해야 하니」
 *
 * ⛔ 코드 주석·개발 문서는 보지 않는다 — 사장님이 적용 범위를 「고객 대상·외부 대상」으로 정하셨다.
 *    .astro 머리말, JSX 주석, 블록 주석, <script>·<style>·HTML 주석을 모두 지우고
 *    «손님 눈에 닿는 글자»만 본다.
 *
 * ⚠ 이 도구의 한계
 *   중괄호 안에 문자열이 섞인 JSX 식(보기: {지면있나.has(t.title) ? '예' : '아니오'})은
 *   코드로 못 가른다. 그래서 «변수 이름»이 몇 건 걸려 나온다 — 손님 화면에는 값만 찍히므로
 *   그런 건은 넘기면 된다. 판별법: 보기 글이 영어·기호로 둘러싸여 있으면 변수 이름이다.
 *
 * 쓰는 법
 *   node check-순한글조어.mjs --자가시험
 *   node check-순한글조어.mjs <폴더> [폴더…]
 */
import fs from 'node:fs';
import path from 'node:path';

/* 찾을 말과 바꿔 쓸 한자어 */
export const 조어표 = [
  { 말: '네 말', 대신: '4개 언어 · 다국어' },
  { 말: '세 말', 대신: '3개 언어' },
  { 말: '바깥 말', 대신: '외국어' },
  { 말: '지면', 대신: '페이지 · 화면' },
  { 말: '걸이', 대신: '태그 · 마커' },
  { 말: '덩이', 대신: '항목 · 구간' },
  { 말: '자가시험', 대신: '자체 검증' },
  { 말: '못박', 대신: '확정 · 명시' },
  { 말: '쟀', 대신: '측정했' },
  { 말: '잰다', 대신: '측정한다' },
];

const 머리말꼴 = new RegExp('^---[^]*?^---', 'm');
const JSX주석꼴 = new RegExp('[{]\\s*/\\*[^]*?\\*/\\s*[}]', 'g');
const 블록주석꼴 = new RegExp('/\\*[^]*?\\*/', 'g');
const 스크립트꼴 = new RegExp('<script[^]*?</script>', 'gi');
const 스타일꼴 = new RegExp('<style[^]*?</style>', 'gi');
const HTML주석꼴 = new RegExp('<!--[^]*?-->', 'g');
const 태그꼴 = new RegExp('<[^>]+>', 'g');

/** 개발자만 보는 자리를 지운다 */
export function 코드주석지우기(글) {
  return String(글 ?? '')
    .replace(머리말꼴, ' ')
    .replace(JSX주석꼴, ' ')
    .replace(블록주석꼴, ' ');
}

/* 중괄호 안에 따옴표가 없으면 순수한 코드다 — 변수 이름은 손님에게 안 보인다 */
const 코드식꼴 = new RegExp('[{][^{}\'"`]*[}]', 'g');

/** 손님 눈에 닿는 글자만 남긴다 */
export function 본문만(html) {
  return 코드주석지우기(html)
    .replace(스크립트꼴, ' ')
    .replace(스타일꼴, ' ')
    .replace(HTML주석꼴, ' ')
    .replace(태그꼴, ' ')
    .replace(코드식꼴, ' ');
}

/** 한 글에서 조어를 찾아 [{말, 대신, 수, 보기}] 로 돌려준다 */
export function 조어찾기(글) {
  const 본문 = String(글 ?? '');
  const 나온것 = [];
  for (const { 말, 대신 } of 조어표) {
    const 자리 = [];
    let i = 본문.indexOf(말);
    while (i >= 0) {
      /* ⛔ 앞 글자가 한글이면 다른 낱말의 «속»이다 — 「정해지면」 의 «지면» 을 잡으면 안 된다 */
      const 앞 = i > 0 ? 본문[i - 1] : '';
      const 앞이한글 = 앞 >= '가' && 앞 <= '힣';
      if (!앞이한글) 자리.push(i);
      i = 본문.indexOf(말, i + 1);
    }
    if (!자리.length) continue;
    const 보기 = 본문.slice(Math.max(0, 자리[0] - 18), 자리[0] + 말.length + 18).replace(/\s+/g, ' ').trim();
    나온것.push({ 말, 대신, 수: 자리.length, 보기 });
  }
  return 나온것;
}

/* ── 자가시험 ─────────────────────────────────────────────── */
if (process.argv.includes('--자가시험')) {
  const 짝 = [];
  const 본다 = (이름, 실제, 바람) => 짝.push([이름, JSON.stringify(실제) === JSON.stringify(바람), 실제, 바람]);

  본다('스크립트 안은 안 본다', 조어찾기(본문만('<p>안녕</p><script>var 지면=1;</script>')).length, 0);
  본다('HTML 주석 안은 안 본다', 조어찾기(본문만('<p>안녕</p><!-- 네 말 -->')).length, 0);
  본다('JSX 주석 안은 안 본다', 조어찾기(본문만('<p>안녕</p>{/* 이 지면은 */}')).length, 0);
  본다('블록 주석 안은 안 본다', 조어찾기(본문만('<p>안녕</p>/* 이 지면은 */')).length, 0);
  본다('astro 머리말은 안 본다', 조어찾기(본문만('---\nconst 지면 = 1;\n---\n<p>안녕</p>')).length, 0);
  본다('본문의 조어는 잡는다', 조어찾기(본문만('<p>네 말로 제공합니다</p>')).length, 1);
  본다('수를 센다', 조어찾기('지면 지면 지면')[0].수, 3);
  본다('바꿔 쓸 말을 함께 낸다', 조어찾기('네 말')[0].대신, '4개 언어 · 다국어');
  본다('없으면 빈 목록', 조어찾기('4개 언어로 제공합니다').length, 0);
  본다('변수 이름은 안 본다', 조어찾기(본문만('<p>{지면수} pages</p>')).length, 0);
  본다('글자가 든 중괄호는 본다', 조어찾기(본문만("<p>{'이 지면은'}</p>")).length, 1);
  본다('태그를 지운다', 본문만('<b>가</b><i>나</i>').replace(/\s+/g, ''), '가나');

  let 깨짐 = 0;
  for (const [이름, 맞나, 실제, 바람] of 짝) {
    console.log((맞나 ? '✅' : '🔴') + ' ' + 이름 + (맞나 ? '' : ` — 나온 값 ${JSON.stringify(실제)} / 바란 값 ${JSON.stringify(바람)}`));
    if (!맞나) 깨짐 += 1;
  }
  console.log(`\n자가시험 ${짝.length}개 · 깨진 것 ${깨짐}개`);
  process.exit(깨짐 ? 1 : 0);
}

/* ── 실제로 재기 ──────────────────────────────────────────── */
const 폴더들 = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!폴더들.length) {
  console.log('쓰는 법: node check-순한글조어.mjs <폴더> [폴더…]  ·  node check-순한글조어.mjs --자가시험');
  process.exit(1);
}

const 볼확장자 = new Set(['.html', '.htm', '.astro', '.md', '.mdx']);
let 파일수 = 0; const 걸린것 = [];

function 훑기(뿌리) {
  const 쌓임 = [뿌리];
  while (쌓임.length) {
    const 여기 = 쌓임.pop();
    let 목록;
    try { 목록 = fs.readdirSync(여기, { withFileTypes: true }); } catch { continue; }
    for (const 것 of 목록) {
      const 길 = path.join(여기, 것.name);
      if (것.isDirectory()) {
        if (['node_modules', '.git', 'dist', 'build', '.astro'].includes(것.name)) continue;
        쌓임.push(길); continue;
      }
      if (!볼확장자.has(path.extname(것.name).toLowerCase())) continue;
      파일수 += 1;
      let 글; try { 글 = fs.readFileSync(길, 'utf8'); } catch { continue; }
      const 나온것 = 조어찾기(본문만(글));
      if (나온것.length) 걸린것.push({ 길, 나온것 });
    }
  }
}

for (const f of 폴더들) 훑기(f);

for (const { 길, 나온것 } of 걸린것) {
  console.log('🔴 ' + 길);
  for (const o of 나온것) console.log(`     「${o.말}」 ${o.수}번 → ${o.대신}   … ${o.보기} …`);
}
console.log(`\n■ 파일 ${파일수}개 · 조어가 든 파일 ${걸린것.length}개`);
if (!걸린것.length) console.log('✅ 고객 화면에 순우리말 조어가 없다');
