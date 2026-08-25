#!/usr/bin/env node
/**
 * check-100y-name-placement.mjs — 100yearmap 판. 사장님 지시(2026-08-25) —
 * 「인기 검색어도 찾아야지 … 제목, 본문 중 위, 가운데, 마지막에 나와야 하겠지」
 *
 * ⛔ 처음엔 5번 파일(check-name-placement.mjs)의 함수(고르기·제목·본문·점수)를
 *   그대로 빌려 썼다가 잡았다 — 그 자의 `고르기()`는 `/[^a-z0-9]+/g`로 지운다.
 *   **한글이 통째로 사라진다**(고르기('가곡고등학교') === ''). 영문 사이트
 *   (kculturewire)에는 맞지만 전부 한글인 100yearmap엔 못 쓴다. 안 대 봤으면
 *   0/4를 «진짜 결함」인 줄 알았을 것이다 — 아는 참인 자리(title 태그에 학교명이
 *   그대로 있다)에 대 보고 잡았다. 5번 파일은 고치지 않고, 한글이 살아남는 판을
 *   이 파일에 따로 둔다(`\p{L}\p{N}` 로 유니코드 글자·숫자를 남긴다).
 *
 * 100yearmap의 「고유명사」는 케이컬쳐의 스타·작품명과 다르다 — **학교 이름·대학
 * 이름**이 그것이다. 손님이 실제로 치는 말은 "OO고등학교"·"OO대학교"다.
 *
 * 쓰는 법  node scripts/check-100y-name-placement.mjs --자가시험
 *          node scripts/check-100y-name-placement.mjs [--몇개=30]
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 🔴 5번의 check-name-placement.mjs 를 그대로 빌려 쓰려다 잡은 것 —
 * 그 자의 `고르기()`는 `/[^a-z0-9]+/g`로 지운다. **한글이 통째로 사라진다**
 * (고르기('가곡고등학교') === ''). 영문 사이트(kculturewire)에는 맞지만
 * 100yearmap(전부 한글)에는 못 쓴다 — 5번 파일을 고치지 않고, 한글이 살아남는
 * 판을 이 파일에 따로 둔다. 안 대 봤으면 0/4가 «진짜 결함」인 줄 알았을 것이다.
 */
export function 고르기(s) {
  return String(s ?? '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&[a-z]+;/gi, ' ')
    .toLowerCase()
    .replace(/[’'`´]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

export function 제목(html) {
  const m = String(html ?? '').match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? 고르기(m[1]) : null;
}

export function 본문(html) {
  let s = String(html ?? '');
  s = s.replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<header[\s\S]*?<\/header>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ');
  const m = s.match(/<main[\s\S]*?<\/main>/i) ?? s.match(/<article[\s\S]*?<\/article>/i);
  if (m) s = m[0];
  return 고르기(s.replace(/<[^>]*>/g, ' '));
}

export function 자리들(본문글, 이름) {
  const n = 고르기(이름);
  if (!n || !본문글) return { 위: false, 가운데: false, 끝: false, 몇번: 0 };
  const L = 본문글.length;
  const 셋 = [본문글.slice(0, Math.floor(L / 3)),
    본문글.slice(Math.floor(L / 3), Math.floor((2 * L) / 3)),
    본문글.slice(Math.floor((2 * L) / 3))];
  let 몇번 = 0;
  let i = 본문글.indexOf(n);
  while (i !== -1) { 몇번 += 1; i = 본문글.indexOf(n, i + 1); }
  return { 위: 셋[0].includes(n), 가운데: 셋[1].includes(n), 끝: 셋[2].includes(n), 몇번 };
}

export function 점수(제목글, 본문글, 이름) {
  const n = 고르기(이름);
  const 제 = !!제목글 && !!n && 제목글.includes(n);
  const a = 자리들(본문글, 이름);
  return { 제목: 제, ...a, 자리수: [제, a.위, a.가운데, a.끝].filter(Boolean).length };
}

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 인자 = (이름, 기본) => {
  const 머리 = `--${이름}=`;
  const a = process.argv.find((x) => x.startsWith(머리));
  return a ? a.slice(머리.length) : 기본;
};
const 몇개 = Number(인자('몇개', '30'));

const dist = path.resolve(뿌리, 'dist/100y');
if (!existsSync(dist)) { console.error('⛔ dist/100y 가 없다 — 먼저 build-once.mjs'); process.exit(1); }

const schools = JSON.parse(readFileSync(path.join(뿌리, 'src/data/100yearmap/pages-school.json'), 'utf8'));
const unis = JSON.parse(readFileSync(path.join(뿌리, 'src/data/100yearmap/pages-university.json'), 'utf8'));

/** 이름에서 «학교/대학교» 접미사를 뗀 짧은 형태도 같이 잰다 — 손님은 짧게 친다 */
function 후보이름들(온이름) {
  const 짧게 = 온이름.replace(/(고등학교|대학교|대학)$/, '');
  return 짧게 && 짧게 !== 온이름 ? [온이름, 짧게] : [온이름];
}

function 한장재기(경로, 이름) {
  if (!existsSync(경로)) return null;
  const html = readFileSync(경로, 'utf8');
  const 제목글 = 제목(html);
  const 본문글 = 본문(html);
  const 이름들 = 후보이름들(이름);
  // 온이름·짧은이름 중 «더 잘 나온» 쪽으로 잰다(하나라도 걸리면 그 자리는 됨)
  let 최고 = null;
  for (const n of 이름들) {
    const s = 점수(제목글, 본문글, n);
    if (!최고 || s.자리수 > 최고.자리수) 최고 = s;
  }
  return 최고;
}

if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  검('⛔ 한글을 안 지운다(5번 자와 다른 자리)', 고르기('가곡고등학교') === '가곡고등학교');
  검('제목 태그를 읽는다', 제목('<title>가곡고등학교 — 백년지도</title>') === '가곡고등학교 백년지도');
  검('제목이 없으면 null', 제목('<html></html>') === null);

  const h = '<html><head><title>T</title></head><body>'
    + '<nav>가곡고등학교 안내</nav><footer>가곡고등학교 문의</footer>'
    + '<main>가곡고등학교 진학률 자료</main></body></html>';
  검('머리말을 걷어낸다', !본문(h).includes('안내'));
  검('꼬리말을 걷어낸다', !본문(h).includes('문의'));
  검('main 안만 본다', 본문(h) === '가곡고등학교 진학률 자료');

  const 글 = `가곡고등학교 ${'x '.repeat(60)}가곡고등학교 ${'y '.repeat(60)}가곡고등학교`;
  const a = 자리들(고르기(글), '가곡고등학교');
  검('위·가운데·끝에 있다', a.위 && a.가운데 && a.끝);
  검('세 번 나온다', a.몇번 === 3);

  const s = 점수('가곡고등학교 백년지도', 고르기(글), '가곡고등학교');
  검('제목까지 넣어 넷을 센다', s.자리수 === 4);

  검('후보이름들 — 학교 접미사를 뗀 짧은 형도 만든다', 후보이름들('가곡고등학교').includes('가곡'));
  검('후보이름들 — 대학교 접미사도 뗀다', 후보이름들('경북대학교').includes('경북'));

  if (실패.length) { console.error('❌ 자가시험 실패\n' + 실패.map((s) => `   · ${s}`).join('\n')); process.exit(1); }
  console.log(`✅ check-100y-name-placement 자가시험 통과 (${11})`);
  process.exit(0);
}

console.log('■ 사장님 지시 — 「그 이름이 제목, 본문 중 위·가운데·마지막에 나와야」 (100yearmap)');

function 갈래재기(제목말, 목록, 경로짓기, 이름꼴) {
  const 표본 = 목록.slice(0, 몇개);
  let 넷 = 0, 셋이하 = 0, 못잼 = 0;
  const 모자란것 = [];
  for (const x of 표본) {
    const 경로 = 경로짓기(x);
    const 이름 = 이름꼴(x);
    const s = 한장재기(경로, 이름);
    if (!s) { 못잼 += 1; continue; }
    if (s.자리수 === 4) 넷 += 1; else { 셋이하 += 1; 모자란것.push({ 이름, ...s }); }
  }
  console.log(`\n## ${제목말} — 표본 ${표본.length}장`);
  console.log(`  4/4 ${넷}장 · 3/4 이하 ${셋이하}장 · 못 쟀다 ${못잼}장`);
  if (모자란것.length) {
    console.log('  모자란 곳(자리수 낮은 순):');
    for (const m of 모자란것.sort((a, b) => a.자리수 - b.자리수).slice(0, 10)) {
      console.log(`    ${m.자리수}/4 제목${m.제목 ? '✅' : '⛔'} 위${m.위 ? '✅' : '⛔'} 가운데${m.가운데 ? '✅' : '⛔'} 끝${m.끝 ? '✅' : '⛔'} · ${m.이름}`);
    }
  }
  return { 넷, 셋이하, 못잼 };
}

갈래재기(
  '학교 지면 (/school/[code])',
  schools,
  (s) => path.join(dist, 'school', `${s.code}.html`),
  (s) => s.title,
);

갈래재기(
  '대학 지면 (/university/[id])',
  unis,
  (u) => path.join(dist, 'university', `${u.schlId}.html`),
  (u) => u.표시명,
);

console.log('\n⚠ 「4/4가 안 되면 억지로 끼워 넣으라」는 뜻이 아니다 — 그 지면이 실제로');
console.log('  다루는 것만 재고 있다. 모자란 자리는 «가운데»가 가장 흔한 구멍일 수 있다.');
