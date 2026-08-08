#!/usr/bin/env node
/**
 * 폰 너비(375px)에서 **화면 밖으로 나간 것이 있나** — 빌드 산출물을 진짜 브라우저로 잰다.
 *
 *   node scripts/check-100y-phone.mjs              파는 3장 · 무료 2장 · 학교 1장
 *   node scripts/check-100y-phone.mjs --넓게        파는 6장 · 무료 4장 · 학교 3장
 *   node scripts/check-100y-phone.mjs --라이브      **나가 있는 지면**을 잰다
 *   node scripts/check-100y-phone.mjs --자가시험    자가 시험만
 *
 * ## ⚠ 빌드와 라이브는 **다른 값이다**
 *
 *   2번 지시(17:3x) — *「⛔ 「241장 했습니다」는 빌드 숫자입니다. 라이브 숫자를 따로 적으십시오」*.
 *   오늘 커밋만 되고 안 나간 것이 여덟 번이었다. **빌드에서 잰 값을 라이브라고 하면 안 된다.**
 *   ⚠ 어느 쪽을 쟀는지 이 자가 **첫 줄에 못 박는다.**
 *
 * ## 🔴 왜 만들었나 (2026-08-08 16:3x)
 *
 *   내 점검표에 **「375px 실측 — ⬜ 못 잼. 사람 눈이 필요하다」**가 사흘 있었다.
 *   2번이 *「폰으로 사는 길을 끝까지 걸어 보십시오」* 하셔서 걸었더니 이것이 나왔다.
 *
 *   ```
 *   파는 지면(강남구 21곳)   감싼 칸 324px · 표 480px
 *   보이던 칸   학교 · 갈래
 *   ⛔ 화면 밖   졸업생 · 진학 · 그 밖   ← 이 지면이 파는 것이 바로 이 셋이다
 *   ```
 *
 * ## 🔴 왜 기존 자가 조용했나 — **자가 다른 물음에 답하고 있었다**
 *
 *   내 「가로 넘침」 검사는 **지면이 넘쳤나**를 봤고, 지면은 정말 안 넘쳤다.
 *   `.tablewrap` 의 `overflow-x:auto` 가 표를 **자기 안에서만** 잘라 놓았기 때문이다.
 *
 *   ```
 *   ⛔ 지면 안 넘침 ≠ 표 안 잘림.   두 물음인데 하나만 재고 있었다
 *   ```
 *
 *   ⭐ 그래서 이 자는 **둘 다** 본다. ①지면이 넘쳤나 ②감싼 칸보다 넓은 표가 있나.
 *
 * ## ⚠ 사람 눈을 대신하지 않는다
 *
 *   이 자가 재는 것은 **넘쳤나 · 잘렸나 · 짚을 수 있나** 셋뿐이다.
 *   「읽고 싶은가」·「예쁜가」는 못 잰다. 그건 그대로 사람 몫이다.
 *   ⛔ 이 자가 초록이라고 「폰에서 괜찮다」고 적지 않는다. **셋이 괜찮은 것**이다.
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
const 폰너비 = 375;
/** 손가락으로 짚는 곳의 권장 높이. 이보다 낮으면 못 짚는다 */
const 짚을높이 = 44;

/* ───────────────────────── 재는 규칙 (자가시험이 붙는 자리) ───────────────────────── */

/** 표가 감싼 칸보다 넓은가 — 넓으면 그 안에서 **칸이 잘려 안 보인다** */
export function 표가잘렸나(표너비, 감싼너비) {
  if (!Number.isFinite(표너비) || !Number.isFinite(감싼너비)) return false;
  return 표너비 > 감싼너비 + 1; // 1px 은 반올림
}

/** 짚을 수 있는 높이인가 */
export function 짚을수있나(높이) {
  return Number.isFinite(높이) && 높이 >= 짚을높이;
}

/** 한 지면의 잰 값에서 울 것을 뽑는다. ⛔ 여기서 브라우저를 안 쓴다 — 그래야 시험할 수 있다 */
export function 울것(잰것) {
  const 운다 = [];
  if (잰것.가로넘침 > 1) 운다.push(`${잰것.주소} — 지면이 가로로 ${잰것.가로넘침}px 넘친다`);
  for (const t of 잰것.표들 ?? []) {
    if (표가잘렸나(t.너비, t.감싼))
      운다.push(`${잰것.주소} — 표가 ${t.너비}px 인데 칸은 ${t.감싼}px. 밖에 있는 칸: ${t.안보이는칸.join('·') || '(머리글 없음)'}`);
  }
  for (const a of 잰것.단추들 ?? []) {
    if (!짚을수있나(a.높이)) 운다.push(`${잰것.주소} — 「${a.글}」 높이 ${a.높이}px (짚으려면 ${짚을높이}px)`);
  }
  return 운다;
}

/* ───────────────────────── 자가 시험 ───────────────────────── */
function 자가시험() {
  const 본보기 = [
    ['꼭 맞으면 안 운다', () => 표가잘렸나(324, 324) === false],
    ['1px 은 봐준다', () => 표가잘렸나(325, 324) === false],
    ['넘치면 운다', () => 표가잘렸나(480, 324) === true],
    ['숫자가 아니면 안 운다', () => 표가잘렸나(NaN, 324) === false],
    ['44 는 짚을 수 있다', () => 짚을수있나(44) === true],
    ['43 은 못 짚는다', () => 짚을수있나(43) === false],
    ['19px 글줄은 못 짚는다', () => 짚을수있나(19) === false],
    ['멀쩡한 지면은 조용하다', () => 울것({ 주소: '/a', 가로넘침: 0, 표들: [{ 너비: 324, 감싼: 324, 안보이는칸: [] }], 단추들: [{ 글: 'x', 높이: 44 }] }).length === 0],
    ['잘린 표를 잡는다', () => 울것({ 주소: '/a', 가로넘침: 0, 표들: [{ 너비: 480, 감싼: 324, 안보이는칸: ['진학', '그 밖'] }], 단추들: [] }).length === 1],
    ['잘린 칸 이름을 적는다', () => /진학·그 밖/.test(울것({ 주소: '/a', 가로넘침: 0, 표들: [{ 너비: 480, 감싼: 324, 안보이는칸: ['진학', '그 밖'] }], 단추들: [] })[0])],
    ['낮은 단추를 잡는다', () => 울것({ 주소: '/a', 가로넘침: 0, 표들: [], 단추들: [{ 글: '알림', 높이: 19 }] }).length === 1],
    ['지면 넘침을 잡는다', () => 울것({ 주소: '/a', 가로넘침: 40, 표들: [], 단추들: [] }).length === 1],
    ['셋이 같이 울 수도 있다', () => 울것({ 주소: '/a', 가로넘침: 40, 표들: [{ 너비: 480, 감싼: 324, 안보이는칸: [] }], 단추들: [{ 글: 'x', 높이: 10 }] }).length === 3],
    ['표가 없어도 안 죽는다', () => 울것({ 주소: '/a', 가로넘침: 0 }).length === 0],
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

/* ───────────────────────── 어느 지면을 잴까 ───────────────────────── */
const 넓게 = process.argv.includes('--넓게');
const 지역방 = path.join(빌드, 'report/area');

if (!fs.existsSync(지역방)) {
  console.log('⬜ 빌드가 없다 — **재지 못했다.** `node scripts/build-once.mjs` 먼저');
  process.exit(2);
}

/** ⚠ 값이 적힌 지면이 파는 것이다. **파일을 열어 갈라낸다** — 목록을 손으로 안 적는다 */
const 지역들 = fs.readdirSync(지역방).filter((f) => f.endsWith('.html'));
const 파는것 = [], 무료것 = [];
for (const f of 지역들) {
  (fs.readFileSync(path.join(지역방, f), 'utf8').includes('9,900원') ? 파는것 : 무료것).push(f);
}
const 학교방 = path.join(빌드, 'school');
const 학교들 = fs.existsSync(학교방) ? fs.readdirSync(학교방).filter((f) => f.endsWith('.html')) : [];

/** 골고루 뽑는다 — 앞에서만 뽑으면 가나다순 앞쪽만 본다 */
const 고르기 = (목록, 몇) => {
  if (목록.length === 0) return [];
  const 걸음 = Math.max(1, Math.floor(목록.length / 몇));
  return Array.from({ length: Math.min(몇, 목록.length) }, (_, i) => 목록[(i * 걸음) % 목록.length]);
};

const 볼것 = [
  ...고르기(파는것, 넓게 ? 6 : 3).map((f) => `/report/area/${f}`),
  ...고르기(무료것, 넓게 ? 4 : 2).map((f) => `/report/area/${f}`),
  ...고르기(학교들, 넓게 ? 3 : 1).map((f) => `/school/${f}`),
];

if (볼것.length === 0) {
  console.log('⬜ 잴 지면이 없다 — **재지 못했다**');
  process.exit(2);
}

/* ───────────────────────── 진짜 브라우저로 잰다 ───────────────────────── */
const 크롬 = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const 퍼핏 = 'C:/Users/USER/Documents/GitHub/klifemap/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';

if (!fs.existsSync(크롬) || !fs.existsSync(퍼핏)) {
  console.log('⬜ 크롬이나 puppeteer-core 가 없다 — **재지 못했다**');
  console.log(`   크롬 ${fs.existsSync(크롬) ? '있다' : '없다'} · puppeteer ${fs.existsSync(퍼핏) ? '있다' : '없다'}`);
  process.exit(2);
}

/**
 * 🔴 **`file://` 로 열지 않는다.** 처음에 그렇게 만들었다가 크게 헛짚었다 (2026-08-08 16:4x).
 *
 *   지면은 `<link href="/style.css">` 로 **맨 앞이 `/` 인 주소**를 쓴다.
 *   `file://` 로 열면 그게 `C:/style.css` 가 되어 **CSS 가 통째로 안 붙는다.**
 *
 *   ```
 *   그때 나온 값   「지면이 가로로 570px 넘친다」 · 「단추 21px」 …  ⛔ 9건
 *   진짜           옷을 안 입힌 지면을 재고 있었다. 지면은 멀쩡했다
 *   ```
 *
 *   ⚠ 무서운 것은 **그럴듯하게 틀렸다**는 점이다. 숫자가 나왔고 자가시험도 초록이었다.
 *     내가 오늘 아침에 고친 자리(단추 44px)가 21px 로 나온 것을 보고서야 알았다.
 *   ⛔ **자가 내는 숫자를 그대로 믿지 않는다.** 아는 답이 하나는 있어야 한다.
 */
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
const 라이브 = process.argv.includes('--라이브') || process.argv.includes('--live');
/**
 * ⚠ 라이브를 잴 때도 **어느 지면을 볼지는 빌드에서 고른다.**
 *   나가 있는 지면 목록을 따로 받을 길이 없어서다. 주소는 같으니 그대로 쓴다.
 * ⛔ 그래서 라이브에 아직 없는 지면을 부를 수 있다 — 그때는 「못 읽었다」로 센다.
 */
await new Promise((r) => 서버.listen(0, '127.0.0.1', r));
const 밑주소 = 라이브 ? 'https://100yearmap.com' : `http://127.0.0.1:${서버.address().port}`;
/** 라이브는 `.html` 이 붙은 주소를 안 쓴다 */
const 주소만들기 = (길) => 밑주소 + (라이브 ? encodeURI(길.replace(/\.html$/, '')) : 길);
console.log(라이브 ? '⚠ **라이브**(100yearmap.com)를 잰다' : '⚠ **빌드**(dist/100y)를 잰다 — 라이브가 아니다');

const puppeteer = (await import(pathToFileURL(퍼핏).href)).default;
const 브라우저 = await puppeteer.launch({
  executablePath: 크롬,
  headless: 'new',
  args: ['--no-sandbox'],
});

const 잰것들 = [];
const 못읽은것 = [];
try {
  for (const 길 of 볼것) {
    const 창 = await 브라우저.newPage();
    try {
      await 창.setViewport({ width: 폰너비, height: 760, deviceScaleFactor: 1, isMobile: true });
      const 답 = await 창.goto(주소만들기(길), { waitUntil: 'load', timeout: 30000 });
      if (답 && 답.status() !== 200) throw new Error(`${답.status()} — 나가 있지 않다`);
      /* 🔴 옷을 입었는지부터 본다. 안 입은 지면을 재면 **전부 거짓으로 운다** */
      const 옷 = await 창.evaluate(() => getComputedStyle(document.body).backgroundColor);
      if (옷 === 'rgba(0, 0, 0, 0)' || 옷 === 'transparent')
        throw new Error('CSS 가 안 붙었다 — 이 지면은 재지 않는다');
      const 잼 = await 창.evaluate(() => {
        const de = document.documentElement;
        const 안 = de.clientWidth;
        return {
          가로넘침: de.scrollWidth - 안,
          표들: [...document.querySelectorAll('table')].map((t) => ({
            너비: Math.round(t.getBoundingClientRect().width),
            감싼: Math.round(t.parentElement.clientWidth),
            안보이는칸: [...t.querySelectorAll('thead th')]
              .filter((x) => x.getBoundingClientRect().right > 안 + 1)
              .map((x) => x.textContent.trim()),
          })),
          /* 파는 길과 사겠다는 뜻을 남기는 자리 — 이 둘만 본다. 메뉴는 안 본다 */
          단추들: [...document.querySelectorAll('a.gotoarea')].map((a) => ({
            글: a.textContent.trim().replace(/\s+/g, ' ').slice(0, 30),
            높이: Math.round(a.getBoundingClientRect().height),
          })),
        };
      });
      잰것들.push({ 주소: 길, ...잼 });
    } catch (e) {
      못읽은것.push(`${길} — ${e.message.slice(0, 60)}`);
    } finally {
      await 창.close();
    }
  }
} finally {
  await 브라우저.close();
  await new Promise((r) => 서버.close(r)); // ⛔ 열어 둔 것은 반드시 닫는다
}

/* 🔴 못 읽은 것을 먼저 말한다. 조용히 넘기면 **0장을 훑고 「0건」이라 하는 병**이 된다 */
if (못읽은것.length) {
  console.log(`⬜ 못 읽은 지면 ${못읽은것.length}장`);
  for (const x of 못읽은것) console.log(`   ${x}`);
}
if (잰것들.length === 0) {
  console.log('⬜ 한 장도 못 쟀다 — **재지 못했다**');
  process.exit(2);
}

const 운다 = 잰것들.flatMap(울것);
const 표수 = 잰것들.reduce((a, x) => a + x.표들.length, 0);
const 단추수 = 잰것들.reduce((a, x) => a + x.단추들.length, 0);

console.log(`${폰너비}px 로 잰 지면 ${잰것들.length}장 (파는 ${파는것.length} 중 · 무료 ${무료것.length} 중) · 표 ${표수}개 · 길·단추 ${단추수}개`);
if (운다.length === 0 && 못읽은것.length === 0) {
  console.log('✅ 화면 밖으로 나간 것 0 · 못 짚을 만큼 낮은 것 0');
  console.log('⚠ 이 자가 재는 것은 「넘쳤나·잘렸나·짚을 수 있나」 셋뿐이다. 읽기 좋은가는 사람이 본다');
  process.exit(시험실패 ? 1 : 0);
}
for (const x of 운다) console.log(`⛔ ${x}`);
console.log(`\n⛔ ${운다.length}건`);
process.exit(1);
