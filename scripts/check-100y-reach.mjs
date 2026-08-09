#!/usr/bin/env node
/**
 * 👆 **누름 자** — 짧은 주소로 들어온 사람이 **살 수 있는 데까지 몇 번 누르나**.
 *
 * ## 🔴 왜 (2026-08-10 06:25 · 2번 지시)
 *
 *   *「주소를 만든 것은 사람을 **데려오는** 데까지입니다. 데려온 다음이 멀면
 *     227명이 0명이 된 것과 똑같은 일이 한 칸 뒤에서 또 납니다」*
 *
 *   ⛔ 눈으로 세지 않는다. **진짜 브라우저로 눌러서** 센다.
 *   ⭐ 폰 너비(390px)로도 잰다 — 넓은 화면에 보이는 링크가 폰에서는 없을 수 있다.
 *     (오늘 아침 메뉴가 폰에서 47% 를 먹던 것과 같은 자리다)
 *
 * ## ⚠ 이 자가 재는 것과 **못 재는 것**
 *
 *   ```
 *   ✅ 지면에서 **눈에 보이고 누를 수 있는** 링크만 걸음으로 센다
 *      (넓이·높이 0 · display:none · visibility:hidden · opacity 0 은 안 센다)
 *   ✅ 찾은 **가장 짧은 길을 진짜로 한 번 더 눌러** 확인한다 — 「길이 있다」와 「눌린다」는 다르다
 *   ⛔ 스크롤을 얼마나 내려야 보이는지는 **안 센다.** 화면 밖이어도 「보인다」로 센다
 *   ⛔ 손님이 그 링크를 **알아볼지**는 못 잰다. 그건 사람이 볼 일이다
 *   ⛔ 자바스크립트로 열리는 메뉴 안쪽은 **안 연다** — 안 열고도 보이는 것만 센다
 *      (그래서 이 자가 내는 수는 **손님이 겪는 것보다 짧거나 같다.** 넉넉하게 안 잡는다)
 *   ```
 *
 * ## 무엇을 「살 수 있는 데」로 보나
 *
 *   ```
 *   값 9,900원 이 화면에 있고 + 다음칸 단추 글자가 같이 있는 지면
 *   ```
 *   ⚠ 아직 **살 수는 없다**(살수있나: false). 그래서 정확히는 **「값이 보이는 데」**다.
 *     개봉날 그 자리가 그대로 사는 자리가 된다. 그래서 지금 재 두는 것이 맞다.
 *
 * 쓰는 법
 *   node scripts/check-100y-reach.mjs --자가시험
 *   node scripts/check-100y-reach.mjs                 # 폰 390 · 넓은 1280 둘 다
 *   node scripts/check-100y-reach.mjs --너비 390
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { 짧은주소들, 물음표뗀곳 } = await import('../src/lib/short-links.ts');
const { 값글자, 다음칸 } = await import('../src/lib/price.ts');

/* ── 판단하는 것들 — 자가시험이 재는 자리 ───────────────────── */

/** 살 수 있는 데인가 — ⛔ 값만 있으면 안 된다. 받는 자리가 같이 있어야 한다 */
export function 값보이는데냐(글) {
  const s = String(글);
  return s.includes(값글자) && (s.includes(다음칸.단추) || s.includes(다음칸.머리));
}

/**
 * 🔴 **이 둘을 가른다** — 안 가르면 자가 2번 물음에 딴 답을 한다.
 *
 *   ```
 *   /price               값이 얼마인지 **알려 주는** 지면.   ⛔ 이건 물건이 아니다
 *   /report/area/<곳>    실제로 **파는 물건**(지역 한 벌).  ⭐ 2번이 물으신 것은 이쪽이다
 *   ```
 *   ⚠ 첫 판에서 age32·home 이 「1번」으로 나왔는데 그 도착이 `/price` 였다.
 *     맞는 수지만 **물으신 것과 다른 것**이다. 그래서 둘 다 잰다.
 */
export function 파는물건이냐(주소, 글) {
  return 자리이름(주소).startsWith('/report/area/') && 값보이는데냐(글);
}

/** 걸어도 되는 곳인가 — 우리 집 안 · 앵커 아님 · 파일 아님 */
export function 걸을수있나(주소, 여기) {
  if (!주소) return false;
  let u;
  try {
    u = new URL(주소, 여기);
  } catch {
    return false;
  }
  if (u.origin !== new URL(여기).origin) return false;
  if (!/^https?:$/.test(u.protocol)) return false;
  if (/\.(pdf|png|jpg|jpeg|svg|zip|csv|json|xml|mp4)$/i.test(u.pathname)) return false;
  return true;
}

/** 같은 곳인가 — ⛔ 물음표와 #앵커로 갈라지면 같은 지면을 몇 번씩 본다 */
export function 자리이름(주소) {
  const u = new URL(주소);
  return u.pathname.replace(/\/$/, '') || '/';
}

/**
 * 어느 링크를 **먼저** 걸어 볼까 — 작을수록 먼저.
 *
 * ⚠ 이것은 **셈을 바꾸지 않는다.** 같은 깊이 안에서 차례만 바꾼다.
 *   가장 짧은 길은 그대로 가장 짧은 길이다.
 * 🔴 필요한 까닭 — 안 하면 한 시작점에 지면 90장을 열어 **10분이 넘는다.**
 *   자가 느려서 안 돌면 그건 없는 자와 같다.
 */
export function 먼저걸을것(주소) {
  const p = 자리이름(주소);
  if (p.startsWith('/report/area/')) return 0;
  if (p === '/price') return 1;
  if (p === '/region') return 2;
  if (p.startsWith('/report')) return 3;
  return 9;
}

/** 사람이 읽게 풀어 준다 — ⚠ 못 풀면 그냥 둔다(자가 여기서 죽으면 안 된다) */
export function decotry(s) {
  try {
    return decodeURIComponent(s);
  } catch {
    return String(s);
  }
}

/* ── 자가시험 ────────────────────────────────────────────────── */
function 자가시험() {
  const 결과 = [];
  const 잰다 = (이름, 참) => {
    결과.push({ 이름, 참 });
    console.log(`  ${참 ? '✅' : '🔴'} ${이름}`);
  };

  잰다('① 값과 받는 자리가 같이 있어야 「값 보이는 데」다', 값보이는데냐(`${값글자} ${다음칸.단추}`));
  잰다('② 값만 있으면 아니다', !값보이는데냐(`이 한 벌은 ${값글자}입니다`));
  잰다('③ 받는 자리만 있으면 아니다', !값보이는데냐(다음칸.단추));
  잰다('④ 남의 집으로는 안 걷는다', !걸을수있나('https://klifemap.ai/x', 'https://100yearmap.com/'));
  잰다('⑤ 우리 집 안은 걷는다', 걸을수있나('/age/32', 'https://100yearmap.com/'));
  잰다('⑥ 상대 주소도 걷는다', 걸을수있나('school/7010125', 'https://100yearmap.com/report/'));
  잰다('⑦ mailto 는 안 걷는다', !걸을수있나('mailto:a@b.c', 'https://100yearmap.com/'));
  잰다('⑧ 내려받는 파일은 안 걷는다', !걸을수있나('/a/b.csv', 'https://100yearmap.com/'));
  잰다('⑨ 빈 것은 안 걷는다', !걸을수있나('', 'https://100yearmap.com/'));
  잰다('⑩ #앵커는 같은 자리로 본다', 자리이름('https://a.b/x#y') === 자리이름('https://a.b/x'));
  잰다('⑪ 물음표도 같은 자리로 본다', 자리이름('https://a.b/x?q=1') === 자리이름('https://a.b/x'));
  잰다('⑫ 끝의 빗금도 같은 자리로 본다', 자리이름('https://a.b/x/') === 자리이름('https://a.b/x'));
  잰다('⑬ 첫 화면은 / 다', 자리이름('https://a.b/') === '/');
  잰다('⑭ 짧은 주소 넷의 도착지가 다 우리 집 안이다', 짧은주소들.every((x) => 걸을수있나(x.가는곳, 'https://100yearmap.com/')));
  잰다('⑮ 값글자가 9,900원이다', 값글자 === '9,900원');

  /* 🔴 자가 2번 물음에 딴 답을 하던 자리 — /price 를 「파는 물건」으로 세면 안 된다 */
  const 값있는글 = `${값글자} ${다음칸.단추}`;
  잰다('⑯ /price 는 **파는 물건이 아니다**', !파는물건이냐('https://100yearmap.com/price', 값있는글));
  잰다('⑰ 지역 한 벌은 파는 물건이다', 파는물건이냐('https://100yearmap.com/report/area/%EC%84%9C%EC%9A%B8', 값있는글));
  잰다('⑱ 지역 한 벌이어도 값이 없으면 아니다', !파는물건이냐('https://100yearmap.com/report/area/x', '아무 말'));
  잰다('⑲ 못 푸는 주소에서 자가 죽지 않는다', decotry('%ZZ') === '%ZZ');
  잰다('⑳ 푸는 것은 푼다', decotry('%EC%84%9C') === '서');
  잰다('㉑ 지역 한 벌을 먼저 걸어 본다', 먼저걸을것('https://a.b/report/area/x') < 먼저걸을것('https://a.b/school/1'));
  잰다('㉒ 값 지면을 학교보다 먼저 걸어 본다', 먼저걸을것('https://a.b/price') < 먼저걸을것('https://a.b/school/1'));

  const 진 = 결과.filter((r) => !r.참).length;
  console.log(`\n자가시험 ${결과.length - 진}/${결과.length}`);
  return 진 === 0;
}

/* ── 라이브에서 진짜 눌러 보기 ───────────────────────────────── */

/** 지금 지면에서 **눈에 보이고 누를 수 있는** 링크만 걷어 온다 */
const 보이는링크걷기 = `(() => {
  const 것 = [];
  for (const a of document.querySelectorAll('a[href]')) {
    const r = a.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) continue;
    const s = getComputedStyle(a);
    if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) continue;
    것.push({ href: a.href, 글: (a.textContent || '').trim().slice(0, 40) });
  }
  return 것;
})()`;

async function 한지면열기(page, 주소) {
  await page.goto(주소, { waitUntil: 'domcontentloaded', timeout: 30000 });
  const 글 = await page.content();
  const 링크 = await page.evaluate(보이는링크걷기);
  return { 글, 링크 };
}

/** 한 시작점에서 값 보이는 데까지 **가장 짧은 길**을 찾는다 */
async function 길찾기(page, 시작, { 최대깊이 = 3, 최대지면 = 45, 도착판단 = null } = {}) {
  const 도착이냐 = 도착판단 ?? ((주소, 글) => 값보이는데냐(글));
  const 본곳 = new Set();
  const 줄 = [{ 주소: 시작, 길: [] }];
  본곳.add(자리이름(시작));
  let 본수 = 0;

  while (줄.length) {
    const { 주소, 길 } = 줄.shift();
    let 것;
    try {
      것 = await 한지면열기(page, 주소);
    } catch (e) {
      continue; /* 못 연 지면은 길이 아니다 */
    }
    본수 += 1;
    if (도착이냐(주소, 것.글)) return { 찾음: true, 누름: 길.length, 길, 도착: 주소, 본수 };
    if (길.length >= 최대깊이 || 본수 >= 최대지면) continue;

    const 아이들 = [];
    for (const l of 것.링크) {
      if (!걸을수있나(l.href, 주소)) continue;
      const 이름 = 자리이름(l.href);
      if (본곳.has(이름)) continue;
      본곳.add(이름);
      아이들.push({ 주소: l.href, 길: [...길, { href: l.href, 글: l.글 }] });
    }
    /* ⚠ 같은 깊이 안에서만 차례를 바꾼다. 가장 짧은 길은 그대로다 */
    아이들.sort((a, b) => 먼저걸을것(a.주소) - 먼저걸을것(b.주소));
    줄.push(...아이들);
  }
  return { 찾음: false, 누름: null, 길: [], 도착: null, 본수 };
}

/** 🔴 찾은 길을 **진짜로 눌러서** 확인한다 — 「길이 있다」와 「눌린다」는 다르다 */
async function 진짜눌러보기(page, 시작, 길, 도착이냐 = (주소, 글) => 값보이는데냐(글)) {
  await page.goto(시작, { waitUntil: 'domcontentloaded', timeout: 30000 });
  for (const 걸음 of 길) {
    const 골 = 자리이름(걸음.href);
    const 눌렸나 = await page.evaluate((목표) => {
      for (const a of document.querySelectorAll('a[href]')) {
        const p = (new URL(a.href).pathname.replace(/\/$/, '') || '/');
        if (p !== 목표) continue;
        const r = a.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0) continue;
        a.scrollIntoView({ block: 'center' });
        a.click();
        return true;
      }
      return false;
    }, 골);
    if (!눌렸나) return { 눌림: false, 어디: 골 };
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
  }
  const 글 = await page.content();
  return { 눌림: 도착이냐(page.url(), 글), 어디: null };
}

async function 라이브(너비들) {
  const puppeteer = (await import('file:///C:/Users/USER/Documents/GitHub/klifemap/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js')).default;
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
    args: ['--no-sandbox'],
  });

  const 표 = [];
  try {
    for (const 너비 of 너비들) {
      const page = await browser.newPage();
      await page.setViewport({ width: 너비, height: 844, deviceScaleFactor: 1 });
      console.log(`\n${'─'.repeat(58)}\n📐 너비 ${너비}px\n`);

      for (const 것 of 짧은주소들) {
        const 시작 = `https://100yearmap.com${물음표뗀곳(것.가는곳)}`;
        console.log(`/y/${것.키}`);
        console.log(`   도착지   ${decotry(물음표뗀곳(것.가는곳))}`);

        const 잴것 = [
          { 이름: '값이 보이는 데', 판단: null, 짧: '값' },
          { 이름: '파는 물건(지역 한 벌)', 판단: 파는물건이냐, 짧: '물건' },
        ];
        const 잰것 = {};
        for (const 재기 of 잴것) {
          const r = await 길찾기(page, 시작, { 도착판단: 재기.판단 });
          let 눌림 = null;
          if (r.찾음 && r.누름 > 0) {
            눌림 = await 진짜눌러보기(page, 시작, r.길, 재기.판단 ?? ((주소, 글) => 값보이는데냐(글)));
          }
          잰것[재기.짧] = { ...r, 눌림 };

          console.log(`   ${재기.이름.padEnd(20)} ${r.찾음 ? `${r.누름}번` : '🔴 못 감'}${r.찾음 && r.누름 === 0 ? '  ⭐ 도착지가 곧 거기다' : ''}`);
          r.길.forEach((걸음, i) => console.log(`       ${i + 1}) 「${걸음.글}」 → ${decotry(자리이름(걸음.href))}`));
          if (r.찾음 && r.누름 > 0) {
            console.log(`       진짜 눌러 봤나  ${눌림?.눌림 ? '✅ 눌린다' : `🔴 안 눌린다 (${눌림?.어디})`}`);
          }
        }
        표.push({ 너비, 키: 것.키, 도착지: 물음표뗀곳(것.가는곳), ...잰것 });
        console.log('');
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }

  console.log(`${'─'.repeat(58)}\n📊 표 — 누름 몇 번\n`);
  console.log('짧은 주소        값이 보이는 데      파는 물건(지역 한 벌)');
  console.log('                 폰390  넓1280       폰390  넓1280');
  const 쓰기 = (r) => (r == null ? ' — ' : r.찾음 ? `${String(r.누름)}번` : '못감');
  for (const 것 of 짧은주소들) {
    const 찾 = (w) => 표.find((r) => r.너비 === w && r.키 === 것.키);
    const p = 찾(390);
    const d = 찾(1280);
    console.log(
      `/y/${것.키.padEnd(12)} ${쓰기(p?.값).padEnd(6)} ${쓰기(d?.값).padEnd(11)}  ${쓰기(p?.물건).padEnd(6)} ${쓰기(d?.물건)}`,
    );
  }

  const 물건들 = 표.map((r) => ({ ...r.물건, 키: r.키, 너비: r.너비 }));
  const 먼것 = 물건들.filter((r) => r.찾음).sort((a, b) => b.누름 - a.누름)[0];
  const 못간것 = 물건들.filter((r) => !r.찾음);
  console.log('');
  if (못간것.length) console.log(`🔴 파는 물건까지 못 가는 것 ${못간것.length} — ${못간것.map((r) => `/y/${r.키}(${r.너비}px)`).join(' · ')}`);
  if (먼것) console.log(`⭐ 제일 먼 것 — /y/${먼것.키} (${먼것.너비}px) ${먼것.누름}번`);
  return 못간것.length === 0 && (먼것?.누름 ?? 0) <= 3;
}

/* ── 들머리 ──────────────────────────────────────────────────── */
const 인자 = process.argv.slice(2);
if (인자.includes('--자가시험')) {
  process.exit(자가시험() ? 0 : 1);
} else {
  if (!자가시험()) process.exit(1);
  const 너비 = 인자.includes('--너비') ? [Number(인자[인자.indexOf('--너비') + 1])] : [390, 1280];
  const 좋나 = await 라이브(너비);
  process.exit(좋나 ? 0 : 1);
}
