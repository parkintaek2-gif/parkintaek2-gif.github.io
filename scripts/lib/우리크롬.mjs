/**
 * 우리크롬.mjs — 점검 자가 손님 브라우저를 열 때 **스스로 이름을 대게 한다.**
 * ────────────────────────────────────────────────────────────────────────────
 * 🔴🔴 [2026-09-17 · 5번] 왜 만들었나
 *
 *   우리 점검 자들은 9222 로 사장님 크롬에 붙어 손님과 똑같이 지면을 연다.
 *   그래서 UA 에 `headless` 도 `bot` 도 없다 — 서버 계수기가 잡을 방법이 없었다.
 *   그날 실측으로 「많이 읽힌 지면」 1~4위가 전부 우리 점검이 두드리는 창구였고
 *   (`/v1/subscribe` 672 · `/v1/research` 551 · `/v1/hs` 397 · `/api/download` 324),
 *   그 수가 그대로 「하루 순방문자」로 보고에 올라가 사장님의 9월 목표를 300배 부풀렸다.
 *
 *   ⛔ UA 를 갈아 끼우는 길은 버렸다 — 결제 점검이 지나는 길이라 토스·페이팔 같은
 *     남의 지면이 다르게 굴 수 있다. 점검을 고치려다 점검을 못 믿게 만드는 짓이다.
 *   ✅ 그래서 **머리글 한 줄**만 붙인다. 손님은 절대 안 붙이는 이름이고,
 *     남의 지면은 모르는 머리글을 그냥 무시한다.
 *
 * ── ⛔ 지키는 것 (저장소 공통) ────────────────────────────────
 *   · `b.close()` 를 부르지 않는다 — 사장님이 쓰시던 창이 통째로 닫힌다. `disconnect()` 만
 *   · 언제나 «새 탭». 끝나면 그 탭만 닫는다
 *   · 손님처럼 보려면 `createBrowserContext()` 로 사장님 로그인과 떼어 놓는다
 *
 * ── 쓰는 법 ──────────────────────────────────────────────────
 *   import { 손님탭에서 } from './lib/우리크롬.mjs';
 *   const 것 = await 손님탭에서(async (page) => {
 *     await page.goto('https://klifemap.ai/');
 *     return page.title();
 *   });
 *
 *   이미 자기 손으로 붙는 자라면 탭 하나에만 붙여도 된다 —
 *   import { 이름대기 } from './lib/우리크롬.mjs';
 *   await 이름대기(page);
 *
 *   node scripts/lib/우리크롬.mjs --자가시험
 */

import { createRequire } from 'node:module';

/** 서버(src/lib/traffic.mjs)가 보는 머리글 이름. **두 곳이 같아야 한다** */
export const 머리글 = 'x-our-check';
/** 값은 쓰이지 않는다 — 「붙었나」만 본다. 그래도 사람이 읽고 알아보게 적는다 */
export const 값 = '5번-점검';

/** 붙일 머리글 한 벌 */
export function 머리글한벌(누구 = 값) {
  return { [머리글]: String(누구).slice(0, 40) };
}

/**
 * 이미 만든 탭에 이름을 붙인다. **던지지 않는다** — 점검이 이것 때문에 죽으면 안 된다.
 * @returns {Promise<boolean>} 붙였나
 */
export async function 이름대기(page, 누구 = 값) {
  try {
    await page.setExtraHTTPHeaders(머리글한벌(누구));
    return true;
  } catch {
    return false;   /* ⬜ 못 붙였으면 못 붙인 것이다. 붙인 척하지 않는다 */
  }
}

/* ── 붙고 쓰고 떨어지기 ─────────────────────────────────────── */

/** klifemap 쪽 puppeteer-core 를 빌린다 — 이 저장소에는 없다 */
function 퍼펫() {
  const require = createRequire('file:///C:/Users/User/Documents/GitHub/klifemap/package.json');
  return require('puppeteer-core');
}

/**
 * 손님과 같은 자리에서 한 번 본다 — 사장님 로그인과 떼어 낸 새 칸에 새 탭.
 * @param {(page:any)=>Promise<any>} 할것
 */
export async function 손님탭에서(할것, { 누구 = 값, 뿌리 = 'http://127.0.0.1:9222' } = {}) {
  const b = await 퍼펫().connect({ browserURL: 뿌리, defaultViewport: null });
  let ctx;
  try {
    ctx = await b.createBrowserContext();
    const page = await ctx.newPage();
    await 이름대기(page, 누구);
    try {
      return await 할것(page);
    } finally {
      try { await page.close(); } catch { /* 이미 닫혔으면 그만이다 */ }
    }
  } finally {
    if (ctx) { try { await ctx.close(); } catch { /* 그만이다 */ } }
    b.disconnect();     /* ⛔ close() 가 아니다 — 사장님 창을 닫지 않는다 */
  }
}

/* ── 자가시험 ───────────────────────────────────────────────── */

if (process.argv.includes('--자가시험')) {
  const 것들 = [];
  const 다 = (이름, 참) => 것들.push({ 이름, 참: !!참 });

  다('머리글 이름이 서버와 같다', 머리글 === 'x-our-check');
  다('머리글 한 벌을 낸다', 머리글한벌()[머리글] === 값);
  다('누구를 바꿀 수 있다', 머리글한벌('6번-결제점검')[머리글] === '6번-결제점검');
  다('길면 자른다', 머리글한벌('가'.repeat(100))[머리글].length === 40);

  /* ⛔ 못 붙였으면 «붙였다»고 하지 않는다 — 조용한 거짓이 제일 나쁘다 */
  const 가짜 = { setExtraHTTPHeaders: async () => { throw new Error('안 된다'); } };
  다('못 붙이면 false 를 낸다', (await 이름대기(가짜)) === false);
  const 진짜 = { 받은: null, setExtraHTTPHeaders: async (h) => { 진짜.받은 = h; } };
  다('붙이면 true 를 낸다', (await 이름대기(진짜)) === true);
  다('붙인 것이 그 머리글이다', 진짜.받은?.[머리글] === 값);

  /* 서버 쪽 판정과 짝이 맞나 — 두 파일이 갈리면 영영 모른다 */
  const t = await import('../../src/lib/traffic.mjs');
  다('서버가 보는 머리글 이름과 같다', t.우리점검머리글 === 머리글);
  다('서버가 우리를 봇으로 센다', (() => {
    t.센다({ host: 'x.com', pathname: '/시험', userAgent: 'Mozilla/5.0 Chrome/152', 우리점검: true });
    return t.현황().봇별[t.우리점검종류] === 1;
  })());
  다('머리글이 없으면 사람으로 센다', (() => {
    const 앞 = t.현황().사람;
    t.센다({ host: 'x.com', pathname: '/시험2', userAgent: 'Mozilla/5.0 Chrome/152' });
    return t.현황().사람 === 앞 + 1;
  })());

  const 진 = 것들.filter((x) => !x.참);
  console.log(`우리크롬 — 자가시험 ${것들.length - 진.length}/${것들.length}`);
  for (const x of 진) console.log('   🔴 ' + x.이름);
  process.exit(진.length ? 1 : 0);
}
