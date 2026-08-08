#!/usr/bin/env node
/**
 * **종이로 뽑았을 때** 성한가 — 진짜 크롬으로 A4 에 앉혀 잰다.
 *
 *   node scripts/check-100y-print.mjs           파는 2장 · 무료 1장 · 학교 1장
 *   node scripts/check-100y-print.mjs --자가시험
 *   node scripts/check-100y-print.mjs --남긴다   잰 PDF 를 scratch 에 남긴다
 *
 * ## 🔴 왜 (2026-08-08 18:5x)
 *
 *   내 출시 점검표에 **「인쇄 페이지 나눔 — ⬜ 못 잼」**이 사흘 있었다.
 *   적어 둔 말은 *「@media print 는 넣었고 흰 종이 대비도 쟀는데, **실제 출력은 아직 못 봤다**」*.
 *
 *   ⚠ 백년지도는 **학부모가 뽑아서 아이와 같이 보는** 지면이다. 종이가 곁다리가 아니다.
 *   ⛔ 「사람 눈이 필요하다」로 두면 **다음에도 안 본다.** 오늘 375px 에서 그걸 겪었다 —
 *     사흘 ⬜ 이던 자리를 자로 옮기자마자 **파는 표의 세 칸이 화면 밖**인 것이 나왔다.
 *
 * ## 무엇을 잴 수 있고 무엇은 못 잼
 *
 *   ```
 *   ✅ 잰다   몇 쪽인가 · 종이 밖으로 잘려 나간 것이 있나 · 접힌 <details> 가 펴졌나
 *            · 주소가 찍히나(종이만 보고 다시 찾아올 수 있나) · 글자가 종이에 남나
 *   ⛔ 못 잰다 잉크가 예쁜가 · 읽고 싶은가. 그건 그대로 사람 몫이다
 *   ```
 *
 * ⚠ **쪽 수가 많은 것 자체는 흠이 아니다.** 자료 지면은 길다. 그래서 쪽 수는 **적기만** 하고
 *   울지 않는다. 우는 것은 **잘려 나간 것**과 **종이에서 사라진 것**뿐이다.
 *
 * ## ⬜ 못 세운 것 하나 — **적어 둔다**
 *
 *   「접힌 채 남은 곳」 규칙은 **셈 함수는 시험했지만(자가시험), 브라우저에서 실제로
 *   울려 보지는 못했다.** 종이 규칙 셋(`details { display:block }` 따위)을 일부러 지워도
 *   이 크롬은 닫힌 `<details>` 속을 **그대로 찍었다**(쪽 3→4 · 글자 1,860→1,890 —
 *   늘어난 것은 다시 보이게 된 summary 다).
 *
 *   ⛔ 그러니 이 규칙은 **「깨뜨려 봤고 운다」가 아니라 「아직 울려 보지 못했다」**이다.
 *     다른 브라우저·다른 판에서는 접힐 수 있어 규칙은 남긴다. 다만 **믿음의 크기를 적어 둔다.**
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const 여기 = path.resolve(
  path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'),
  '..',
);
const 빌드 = path.join(여기, 'dist/100y');

/* A4 — 크롬이 쓰는 값(인치). 여백은 기본 0.4in 로 둔다 */
const A4너비인치 = 8.27;
const 여백인치 = 0.4;
const 글자너비인치 = A4너비인치 - 여백인치 * 2;

/* ───────────────────────── 재는 규칙 ───────────────────────── */

/** 종이 폭(px)보다 넓게 나간 것이 있나. ⚠ 1px 은 반올림으로 본다 */
export function 종이밖인가(요소오른쪽, 종이폭) {
  if (!Number.isFinite(요소오른쪽) || !Number.isFinite(종이폭)) return false;
  return 요소오른쪽 > 종이폭 + 1;
}

/** 한 지면의 잰 값에서 울 것을 뽑는다. ⛔ 브라우저를 안 쓴다 — 그래야 시험할 수 있다 */
export function 울것(잰것) {
  const 운다 = [];
  const 이름 = 잰것?.주소 ?? '(모름)';
  if (!잰것) return ['잰 것이 없다'];

  if (잰것.쪽수 === 0) 운다.push(`${이름} — 종이가 0쪽이다. 아무것도 안 찍힌다`);
  for (const x of 잰것.종이밖 ?? []) 운다.push(`${이름} — 「${x.글}」이 종이 밖으로 ${x.넘침}px 나갔다`);
  if (잰것.접힌것 > 0) 운다.push(`${이름} — 종이에서 접힌 채 남은 곳 ${잰것.접힌것}곳. 출처가 접히면 영영 안 보인다`);
  if (잰것.주소찍히나 === false) 운다.push(`${이름} — 종이에 주소가 안 찍힌다. 종이만 보고 다시 못 찾아온다`);
  if (잰것.글자수 != null && 잰것.글자수 < 200) 운다.push(`${이름} — 종이에 남은 글자가 ${잰것.글자수}자뿐이다`);
  return 운다;
}

/* ───────────────────────── 자가 시험 ───────────────────────── */
function 자가시험() {
  const 성한것 = { 주소: '/a', 쪽수: 6, 종이밖: [], 접힌것: 0, 주소찍히나: true, 글자수: 4000 };
  const 본보기 = [
    ['성한 것은 조용하다', () => 울것(성한것).length === 0],
    ['0쪽이면 운다', () => 울것({ ...성한것, 쪽수: 0 }).length === 1],
    ['종이 밖은 운다', () => 울것({ ...성한것, 종이밖: [{ 글: '표', 넘침: 40 }] }).length === 1],
    ['넘친 것 이름을 적는다', () => /「표」/.test(울것({ ...성한것, 종이밖: [{ 글: '표', 넘침: 40 }] })[0])],
    ['접힌 채 남으면 운다', () => 울것({ ...성한것, 접힌것: 3 }).length === 1],
    ['주소가 안 찍히면 운다', () => 울것({ ...성한것, 주소찍히나: false }).length === 1],
    ['글자가 사라지면 운다', () => 울것({ ...성한것, 글자수: 12 }).length === 1],
    ['⚠ 쪽 수가 많은 것은 흠이 아니다', () => 울것({ ...성한것, 쪽수: 40 }).length === 0],
    ['여럿이 같이 울 수 있다', () => 울것({ ...성한것, 쪽수: 0, 접힌것: 2, 주소찍히나: false }).length === 3],
    ['잰 것이 없으면 그렇게 말한다', () => 울것(null).length === 1],
    ['1px 은 봐준다', () => 종이밖인가(801, 800) === false],
    ['넘치면 잡는다', () => 종이밖인가(900, 800) === true],
    ['숫자가 아니면 안 잡는다', () => 종이밖인가(NaN, 800) === false],
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

/* ───────────────────────── 잴 지면 고르기 ───────────────────────── */
const 지역방 = path.join(빌드, 'report/area');
if (!fs.existsSync(지역방)) {
  console.log('⬜ 빌드가 없다 — **재지 못했다.** `node scripts/build-once.mjs` 먼저');
  process.exit(2);
}
const 지역들 = fs.readdirSync(지역방).filter((f) => f.endsWith('.html'));
const 파는것 = [], 무료것 = [];
for (const f of 지역들) {
  (fs.readFileSync(path.join(지역방, f), 'utf8').includes('9,900원') ? 파는것 : 무료것).push(f);
}
const 학교방 = path.join(빌드, 'school');
const 학교들 = fs.existsSync(학교방) ? fs.readdirSync(학교방).filter((f) => f.endsWith('.html')) : [];
const 고르기 = (목록, 몇) => {
  if (!목록.length) return [];
  const 걸음 = Math.max(1, Math.floor(목록.length / 몇));
  return Array.from({ length: Math.min(몇, 목록.length) }, (_, i) => 목록[(i * 걸음) % 목록.length]);
};
const 볼것 = [
  ...고르기(파는것, 2).map((f) => `/report/area/${f}`),
  ...고르기(무료것, 1).map((f) => `/report/area/${f}`),
  ...고르기(학교들, 1).map((f) => `/school/${f}`),
];

/* ───────────────────────── 진짜 크롬으로 앉힌다 ───────────────────────── */
const 크롬 = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const 퍼핏 = 'C:/Users/USER/Documents/GitHub/klifemap/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
if (!fs.existsSync(크롬) || !fs.existsSync(퍼핏)) {
  console.log('⬜ 크롬이나 puppeteer-core 가 없다 — **재지 못했다**');
  process.exit(2);
}

/** 🔴 `file://` 로 열지 않는다 — `/style.css` 가 안 붙어 **옷 없는 지면**을 재게 된다 */
const 서버 = http.createServer((q, s) => {
  let 길 = decodeURIComponent(q.url.split('?')[0]);
  if (길.endsWith('/')) 길 += 'index.html';
  let p = path.join(빌드, 길);
  if (!fs.existsSync(p) && fs.existsSync(p + '.html')) p += '.html';
  if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { s.writeHead(404); return s.end(); }
  const 꼴 = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript', '.png': 'image/png', '.svg': 'image/svg+xml' }[path.extname(p)];
  s.writeHead(200, { 'content-type': 꼴 ?? 'application/octet-stream' });
  fs.createReadStream(p).pipe(s);
});
await new Promise((r) => 서버.listen(0, '127.0.0.1', r));
const 밑주소 = `http://127.0.0.1:${서버.address().port}`;

const puppeteer = (await import(pathToFileURL(퍼핏).href)).default;
const 브라우저 = await puppeteer.launch({ executablePath: 크롬, headless: 'new', args: ['--no-sandbox'] });

const 남긴다 = process.argv.includes('--남긴다');
const 잰것들 = [], 못읽은것 = [];
try {
  for (const 길 of 볼것) {
    const 창 = await 브라우저.newPage();
    try {
      await 창.goto(밑주소 + 길, { waitUntil: 'load', timeout: 30000 });
      /* 🔴 종이 규칙을 켜고 잰다. 이걸 안 켜면 화면 규칙을 재게 된다 */
      await 창.emulateMediaType('print');
      const 종이폭 = await 창.evaluate((인치) => {
        /* 종이 폭을 px 로 — 크롬 인쇄는 96dpi 다 */
        return Math.round(인치 * 96);
      }, 글자너비인치);
      await 창.setViewport({ width: 종이폭, height: 1200 });
      await new Promise((r) => setTimeout(r, 400));

      const 잼 = await 창.evaluate((폭) => {
        const 종이밖 = [...document.querySelectorAll('body *')]
          .filter((e) => {
            const r = e.getBoundingClientRect();
            if (!r.width || !r.height) return false;
            if (getComputedStyle(e).display === 'none') return false;
            return r.right > 폭 + 1;
          })
          .map((e) => ({ 글: (e.textContent || e.tagName).trim().replace(/\s+/g, ' ').slice(0, 24), 넘침: Math.round(e.getBoundingClientRect().right - 폭) }))
          .slice(0, 5);
        /**
         * ⚠ 종이에서 `<details>` 안(출처)이 **정말 자리를 차지하나.**
         *
         * 🔴 이 한 줄을 **두 번 틀리고 세 번째에 맞췄다** (2026-08-08 19:0x).
         *
         *   ```
         *   ① `!d.open` 으로 셌다        ⛔ open 은 **속성**이다. 종이 규칙은 속성을 안 건드린다
         *   ② innerText 에 있나로 셌다   ⛔ 크롬은 닫힌 details 속을 innerText 에서 **CSS 와 무관하게** 뺀다
         *   ③ 자리(높이)를 차지하나       ✅ 자리를 차지하면 그 자리에 잉크가 간다
         *   ```
         *
         *   ②로 쟀을 때 「3곳이 접혔다」고 울었는데, 같은 지면을 재 보니
         *   속이 **208·124·247px 자리를 차지**하고 있었다. **안 접혀 있었다.**
         *
         * ⛔ 자가 무엇을 보고 있는지 두 번 틀린 자리다. 결과(자리)로만 센다.
         */
        const 접힌것 = [...document.querySelectorAll('details')].filter((d) => {
          if (getComputedStyle(d).display === 'none') return false;
          const 속 = [...d.children].filter((e) => e.tagName !== 'SUMMARY');
          if (!속.length) return false;
          const 글 = 속.map((e) => e.textContent || '').join('').replace(/\s+/g, '');
          if (글.length < 12) return false; // 잴 만한 글이 없다
          const 높이 = 속.reduce((a, e) => a + e.getBoundingClientRect().height, 0);
          return 높이 < 1;
        }).length;
        /* 종이에만 뜨는 주소 줄 */
        const u = document.querySelector('.printurl');
        const 주소찍히나 = u ? getComputedStyle(u).display !== 'none' : null;
        return { 종이밖, 접힌것, 주소찍히나, 글자수: (document.body.innerText || '').replace(/\s+/g, '').length };
      }, 종이폭);

      const pdf = await 창.pdf({ format: 'A4', printBackground: false, margin: { top: `${여백인치}in`, right: `${여백인치}in`, bottom: `${여백인치}in`, left: `${여백인치}in` } });
      /* 쪽 수 — PDF 안의 `/Type /Page` 를 센다. ⚠ `/Pages` 는 빼야 한다 */
      const 쪽수 = (Buffer.from(pdf).toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length;
      if (남긴다) {
        const 낼곳 = path.join(여기, '.scratch-print');
        fs.mkdirSync(낼곳, { recursive: true });
        fs.writeFileSync(path.join(낼곳, 길.replace(/[\\/]/g, '_') + '.pdf'), pdf);
      }
      잰것들.push({ 주소: 길, 쪽수, ...잼 });
    } catch (e) {
      못읽은것.push(`${길} — ${e.message.slice(0, 60)}`);
    } finally {
      await 창.close();
    }
  }
} finally {
  await 브라우저.close();
  await new Promise((r) => 서버.close(r));
}

if (못읽은것.length) {
  console.log(`⬜ 못 읽은 지면 ${못읽은것.length}장`);
  for (const x of 못읽은것) console.log(`   ${x}`);
}
if (잰것들.length === 0) {
  console.log('⬜ 한 장도 못 쟀다 — **재지 못했다**');
  process.exit(2);
}

const 운다 = 잰것들.flatMap(울것);
console.log(`A4 에 앉혀 잰 지면 ${잰것들.length}장 (종이 글자폭 ${Math.round(글자너비인치 * 96)}px)`);
for (const x of 잰것들) {
  console.log(`  ${x.주소} — ${x.쪽수}쪽 · 종이 밖 ${x.종이밖.length}곳 · 접힌 채 ${x.접힌것}곳 · 주소줄 ${x.주소찍히나 === null ? '없음' : x.주소찍히나 ? '찍힘' : '안 찍힘'} · 글자 ${x.글자수.toLocaleString()}자`);
}
if (운다.length === 0) {
  console.log('✅ 종이 밖으로 잘려 나간 것 0 · 접힌 채 남은 곳 0 · 주소 찍힘');
  console.log('⚠ 이 자는 「잘렸나·사라졌나·찾아올 수 있나」만 잰다. 읽고 싶은가는 사람이 본다');
  process.exit(시험실패 ? 1 : 0);
}
for (const x of 운다) console.log(`⛔ ${x}`);
console.log(`\n⛔ ${운다.length}건`);
process.exit(1);
