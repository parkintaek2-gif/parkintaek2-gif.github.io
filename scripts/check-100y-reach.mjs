#!/usr/bin/env node
/**
 * 첫 화면에서 **몇 번 눌러 닿나** — 나간 지면의 `<a href>` 만 보고 센다.
 *
 *   node scripts/check-100y-reach.mjs            깊이별 장수
 *   node scripts/check-100y-reach.mjs --먼곳      세 번 이상 걸리는 갈래를 보여준다
 *   node scripts/check-100y-reach.mjs --자가시험
 *
 * ## 🔴 왜 (2026-08-08 20:3x · 2번 지시)
 *
 *   *「사이트맵 4,768장 중 **구글이 색인한 것이 아직 0장**입니다.
 *     ⚠ **잇는 것이 요청보다 먼저입니다.** 구글은 링크를 타고 옵니다.
 *     첫 화면에서 세 번 눌러 못 닿는 지면은 색인을 걸어도 잘 안 잡힙니다」*
 *
 *   ⛔ *「링크는 눈으로 세지 말고 `<a href>` 로 세십시오」* — 그래서 이 자를 만든다.
 *
 * ## ⚠ 무엇을 세고 무엇을 안 세나
 *
 *   ```
 *   ✅ 센다    같은 사이트 안으로 가는 <a href> 만
 *   ⛔ 안 센다  밖으로 나가는 링크 · 앵커(#) · mailto · 사이트맵 xml
 *   ⚠ 안 센다  `<link rel>`·`<script>` — 사람이 누르는 것이 아니다
 *   ```
 *
 *   ⚠ 주소가 파일로 어떻게 떨어지는지는 빌드 꼴(`file`)을 따른다 —
 *     `/major` 는 `major.html`, `/` 는 `../100y.html`. 이걸 틀리면 **전부 「못 닿음」이 된다.**
 */
import fs from 'node:fs';
import path from 'node:path';

const 여기 = path.resolve(
  path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'),
  '..',
);
const 빌드 = path.join(여기, 'dist/100y');
const 첫화면파일 = path.join(여기, 'dist/100y.html');

/* ───────────────────────── 재는 규칙 ───────────────────────── */

/** 이 링크를 셀 것인가 */
export function 셀링크인가(href) {
  const h = String(href ?? '').trim();
  if (!h) return false;
  if (/^(https?:|mailto:|tel:|javascript:|data:)/i.test(h)) return false;
  if (h.startsWith('#')) return false;
  if (!h.startsWith('/')) return false; // 우리 지면은 다 절대경로로 나간다
  if (/\.(xml|json|png|jpe?g|svg|css|js|pdf|ico|txt)$/i.test(h.split('?')[0])) return false;
  return true;
}

/** 주소를 **잣대 꼴**로 다듬는다. `/a/`·`/a.html`·`/a?x=1` 이 다 같은 곳이다 */
export function 주소다듬기(href) {
  let h = String(href ?? '').split('#')[0].split('?')[0];
  /**
   * 🔴 **퍼센트 인코딩을 푼다.** 이걸 안 해서 처음에 **836장을 「못 닿는다」고 냈다**
   *   (2026-08-08 20:3x).
   *
   *   ```
   *   지면이 거는 것   /college-major/%EA%B0%84%ED%98%B8%ED%95%99%EA%B3%BC
   *   파일 이름        간호학과.html
   *   ```
   *
   *   ⛔ 글자가 달라 안 만난다. **차림표는 837장을 멀쩡히 걸고 있었는데**
   *     내 자가 못 읽고 「아무 데도 안 닿는다」고 했다.
   *   ⚠ 오늘 다섯 번째다 — 자가 딴 것을 보고 있던 자리.
   */
  try { h = decodeURIComponent(h); } catch { /* 반쯤 인코딩된 것은 그대로 둔다 */ }
  h = h.replace(/^\/100y(?=\/|$)/, ''); // 빌드 접두사는 손님 주소가 아니다
  h = h.replace(/\.html?$/i, '');
  if (h.length > 1) h = h.replace(/\/$/, '');
  return h || '/';
}

/** 다듬은 주소 → 빌드 파일 자리. ⚠ 없으면 null (지면이 아닌 주소다) */
export function 주소를파일로(주소, 있나 = fs.existsSync) {
  if (주소 === '/') return 있나(첫화면파일) ? 첫화면파일 : null;
  const 후보 = [path.join(빌드, 주소.slice(1) + '.html'), path.join(빌드, 주소.slice(1), 'index.html')];
  for (const p of 후보) if (있나(p)) return p;
  return null;
}

/** 한 지면에서 나가는 링크들 */
export function 링크뽑기(html) {
  return [...String(html ?? '').matchAll(/<a\b[^>]*\bhref=["']([^"']+)["']/gi)]
    .map((m) => m[1].replace(/&amp;/g, '&'))
    .filter(셀링크인가)
    .map(주소다듬기);
}

/** 주소가 어느 갈래인가 — 보고할 때 묶어 보이려고 */
export function 갈래(주소) {
  if (주소 === '/') return '첫화면';
  const 첫 = 주소.split('/').filter(Boolean)[0] ?? '';
  return 첫 || '첫화면';
}

/* ───────────────────────── 자가 시험 ───────────────────────── */
function 자가시험() {
  const 본보기 = [
    ['안으로 가는 것만 센다', () => 셀링크인가('/major') === true],
    ['밖은 안 센다', () => 셀링크인가('https://klifemap.ai/x') === false],
    ['메일은 안 센다', () => 셀링크인가('mailto:a@b.c') === false],
    ['앵커는 안 센다', () => 셀링크인가('#top') === false],
    ['사이트맵은 안 센다', () => 셀링크인가('/sitemap.xml') === false],
    ['빈 것은 안 센다', () => 셀링크인가('') === false],
    ['상대경로는 안 센다', () => 셀링크인가('major') === false],
    ['.html 을 뗀다', () => 주소다듬기('/major.html') === '/major'],
    ['꼬리 빗금을 뗀다', () => 주소다듬기('/major/') === '/major'],
    ['물음표를 뗀다', () => 주소다듬기('/major?a=1') === '/major'],
    ['앵커를 뗀다', () => 주소다듬기('/major#x') === '/major'],
    ['빌드 접두사를 뗀다', () => 주소다듬기('/100y/major') === '/major'],
    ['첫 화면은 /', () => 주소다듬기('/') === '/'],
    ['⚠ 100y 만 있어도 첫 화면', () => 주소다듬기('/100y') === '/'],
    ['⛔ 100years 는 안 뗀다', () => 주소다듬기('/100years/x') === '/100years/x'],
    /* 🔴 이걸 놓쳐서 836장을 「못 닿는다」고 낼 뻔했다 */
    ['퍼센트 인코딩을 푼다', () => 주소다듬기('/college-major/%EA%B0%84%ED%98%B8%ED%95%99%EA%B3%BC') === '/college-major/간호학과'],
    ['괄호가 든 것도 푼다', () => 주소다듬기('/college-major/%EA%B0%84%ED%98%B8%EA%B3%BC(4%EB%85%84%EC%A0%9C)') === '/college-major/간호과(4년제)'],
    ['반쯤 인코딩돼도 안 죽는다', () => 주소다듬기('/a/%E0%A4%A') === '/a/%E0%A4%A'],
    ['링크를 뽑는다', () => 링크뽑기('<a href="/major">가</a><a href="https://x">나</a>').length === 1],
    ['&amp; 를 푼다', () => 링크뽑기('<a href="/a?b=1&amp;c=2">x</a>')[0] === '/a'],
    ['따옴표 두 가지', () => 링크뽑기("<a href='/major'>x</a>").length === 1],
    ['속성이 앞에 있어도', () => 링크뽑기('<a class="x" href="/major">y</a>').length === 1],
    ['갈래를 가른다', () => 갈래('/school/700') === 'school'],
    ['첫 화면 갈래', () => 갈래('/') === '첫화면'],
    ['파일 찾기 — 없으면 null', () => 주소를파일로('/없는것', () => false) === null],
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
if (!fs.existsSync(빌드) || !fs.existsSync(첫화면파일)) {
  console.log('⬜ 빌드가 없다 — **재지 못했다.** `node scripts/build-once.mjs` 먼저');
  process.exit(2);
}

/** 나간 지면 전부 — 이것이 분모다 */
const 모든지면 = new Set();
const 훑기 = (d) => {
  let 목록;
  try { 목록 = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
  for (const e of 목록) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { 훑기(p); continue; }
    if (!e.name.endsWith('.html') || e.name === '404.html') continue;
    /* 소유확인 파일은 지면이 아니다 */
    if (/^(naver[0-9a-f]{16,}|google[0-9a-f]{12,})\.html$/i.test(e.name)) continue;
    모든지면.add(주소다듬기('/' + path.relative(빌드, p).replace(/\\/g, '/')));
  }
};
훑기(빌드);
모든지면.add('/');

if (모든지면.size < 100) {
  console.log(`⬜ 지면을 ${모든지면.size}장밖에 못 찾았다 — **재지 못했다**(남이 빌드 중일 수 있다)`);
  process.exit(2);
}

/** 첫 화면부터 너비 우선으로 걸어 본다 */
const 깊이 = new Map([['/', 0]]);
let 이번칸 = ['/'];
let 못읽음 = 0;
for (let d = 0; d < 6 && 이번칸.length; d++) {
  const 다음칸 = [];
  for (const 주소 of 이번칸) {
    const p = 주소를파일로(주소);
    if (!p) continue;
    let html;
    try { html = fs.readFileSync(p, 'utf8'); } catch { 못읽음++; continue; }
    for (const 다음 of 링크뽑기(html)) {
      if (깊이.has(다음)) continue;
      if (!모든지면.has(다음)) continue; // 지면이 아닌 주소는 안 센다
      깊이.set(다음, d + 1);
      다음칸.push(다음);
    }
  }
  이번칸 = 다음칸;
}

const 깊이별 = new Map();
for (const [, d] of 깊이) 깊이별.set(d, (깊이별.get(d) ?? 0) + 1);
const 두번안에 = [...깊이.values()].filter((d) => d <= 2).length;
const 못닿음 = [...모든지면].filter((u) => !깊이.has(u));

console.log(`나간 지면 ${모든지면.size.toLocaleString()}장 · 첫 화면에서 걸어 닿은 것 ${깊이.size.toLocaleString()}장`);
for (const d of [...깊이별.keys()].sort((a, b) => a - b)) {
  console.log(`  ${d}번 눌러 닿는 것 ${깊이별.get(d).toLocaleString()}장`);
}
console.log(`🔴 두 번 안에 닿는 것 **${두번안에.toLocaleString()}장** (${((두번안에 / 모든지면.size) * 100).toFixed(1)}%)`);
if (못읽음) console.log(`⬜⬜ 훑는 사이에 못 읽은 지면 ${못읽음}장 — 덜 읽고 낸 값이다`);

/** 갈래별로 어디까지 닿나 */
const 갈래셈 = new Map();
for (const u of 모든지면) {
  const g = 갈래(u);
  if (!갈래셈.has(g)) 갈래셈.set(g, { 전부: 0, 두번: 0, 못: 0, 가장얕은: Infinity });
  const c = 갈래셈.get(g);
  c.전부++;
  const d = 깊이.get(u);
  if (d == null) c.못++;
  else {
    if (d <= 2) c.두번++;
    if (d < c.가장얕은) c.가장얕은 = d;
  }
}
console.log('\n■ 갈래별 — 전부 / 두 번 안에 / 못 닿음 / 가장 얕은 곳');
for (const [g, c] of [...갈래셈.entries()].sort((a, b) => b[1].전부 - a[1].전부)) {
  console.log(
    `  ${g.padEnd(14)} ${String(c.전부).padStart(5)} / ${String(c.두번).padStart(5)} / ${String(c.못).padStart(4)} / ${c.가장얕은 === Infinity ? '—' : c.가장얕은}`,
  );
}

if (process.argv.includes('--먼곳')) {
  const 셋이상 = [...깊이.entries()].filter(([, d]) => d >= 3).map(([u]) => u);
  console.log(`\n■ 세 번 이상 걸리는 것 ${셋이상.length.toLocaleString()}장 — 앞 20개`);
  for (const u of 셋이상.slice(0, 20)) console.log(`  ${u}  (${깊이.get(u)}번)`);
  console.log(`\n■ 아예 못 닿는 것 ${못닿음.length.toLocaleString()}장 — 앞 20개`);
  for (const u of 못닿음.slice(0, 20)) console.log(`  ${u}`);
}

console.log('\n⚠ 이 자는 「닿나」만 잰다. 구글이 실제로 색인했는지는 서치콘솔에서 본다');
process.exit(시험실패 ? 1 : 0);
