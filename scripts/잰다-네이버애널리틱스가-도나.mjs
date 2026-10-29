/**
 * 잰다-네이버애널리틱스가-도나.mjs
 *   — **네 사이트에서 네이버 애널리틱스가 «실제로 도는가»를 라이브에서 잰다.**
 *
 * ── 🔴 왜 지었나 (2026-10-13 14:1x · 5번) ─────────────────────────────
 * 사장님이 네 사이트의 네이버 애널리틱스 코드를 사이트마다 «다르게» 주셨다.
 * 붙이는 것은 쉽다. 그런데 **붙였는데 안 세는 꼴**이 있다 —
 * ```
 *   · CSP 가 wcs.pstatic.net 을 막으면 스크립트가 통째로 안 뜬다
 *   · wa 값을 베껴 써서 «남의 사이트 수»에 섞인다
 *   · 어떤 지면에만 들어가고 나머지에는 안 들어간다
 * ```
 * ⭐ 셋 다 **화면은 멀쩡하고 수만 0** 이다. 가장 조용한 흠이다.
 *   ⛔ 「붙였다」를 「센다」로 읽지 않는다.
 *
 * ⚠ 이 자는 「네이버가 집계했나」까지는 모른다. 그것은 네이버 화면이 말한다.
 *   이 자가 답하는 것은 셋이다 —
 *     ① 스크립트가 지면에 있나  ② 그 사이트의 wa 가 맞나  ③ 브라우저에서 wcs 가 떴나
 *
 * ── 🔴 집계를 어디서 보나 (사장님 2026-10-13) ────────────────────────
 * 네이버 애널리틱스 계정 아이디는 **parkintaek@naver.com** 이다 (사장님 말씀).
 *   ⛔ 내가 로그인하지 않는다. 비밀번호를 다루지 않는다.
 *   ⇒ 집계 화면은 사장님이 열어 주신 창으로 본다.
 *   ⚠ 보고 메일(parkintaek2@gmail.com)과 «다른» 주소다. 섞지 않는다 —
 *     보고가 실제로 어디로 갔는지는 docs/보낸메일.tsv 로 재서 확인했다.
 *
 * 쓰는 법  node scripts/잰다-네이버애널리틱스가-도나.mjs --자가시험
 *          node scripts/잰다-네이버애널리틱스가-도나.mjs
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const 여기 = path.dirname(fileURLToPath(import.meta.url));

/**
 * 사이트 ↔ 그 사이트의 wa 값 (사장님 2026-10-13).
 * ⛔ 베껴 쓰지 않는다 — 겹치면 남의 사이트 수에 섞인다. 아래 자가시험이 그것을 막는다.
 */
export const 사이트 = [
  { 이름: 'klifemap.ai', 주소: 'https://klifemap.ai/', wa: '1cda8526e74f530' },
  { 이름: 'seoulmarkets.com', 주소: 'https://seoulmarkets.com/', wa: '127a65fcc0cbb30' },
  { 이름: '100yearmap.com', 주소: 'https://100yearmap.com/', wa: '1c7cedc7304e670' },
  { 이름: 'www.kculturewire.com', 주소: 'https://www.kculturewire.com/', wa: '1c7ceeac8b14510' },
];

/** 그 글에 네이버 애널리틱스 로더가 있나 */
export function 로더있나(글) {
  return /wcs\.pstatic\.net\/wcslog\.js/.test(String(글 == null ? '' : 글));
}

/** 그 글에 적힌 wa 값. 없으면 null — '' 로 읽지 않는다 */
export function wa읽기(글) {
  const m = String(글 == null ? '' : 글).match(/wcs_add\s*\[\s*["']wa["']\s*\]\s*=\s*["']([^"']+)["']/);
  return m ? m[1] : null;
}

/**
 * 판정. ⛔ 「모른다」를 「돈다」로 적지 않는다.
 * @param {{로더:boolean, wa:string|null, 떴나:boolean|null, 바란wa:string}} x
 */
/**
 * 🔴 [2026-10-13 14:4x] **「wcs 가 떴다」보다 한 걸음 더 깊은 것이 있다 — «비콘이 나갔나».**
 *   스크립트가 떠도 wcs_do() 가 안 불리면 아무것도 안 나간다.
 *   그러면 네이버 화면에는 하루 뒤에도 0 이 찍히고, 우리는 그제야 안다.
 * ⇒ 지면을 열어 둔 채 **wcs.naver.net 으로 요청이 나가는지** 본다.
 * ⛔ 요청이 나갔다고 «네이버가 집계했다»는 뜻은 아니다 —
 *   등록 안 된 wa 면 네이버가 받고 버린다. 그것은 밖에서 못 본다.
 */
export function 비콘판정(나갔나) {
  if (나갔나 === null) return { 빛: '⬜', 말: '못 쟀다' };
  if (나갔나) return { 빛: '✅', 말: '비콘이 네이버로 나갔다' };
  return { 빛: '🔴', 말: '비콘이 «안 나갔다» — wcs_do 가 안 불렸거나 CSP 가 막았다' };
}

export function 판정(x) {
  if (!x || typeof x !== 'object') return { 빛: '⬜', 말: '못 쟀다' };
  if (!x.로더) return { 빛: '🔴', 말: '로더가 지면에 없다 — 붙지 않았다' };
  if (!x.wa) return { 빛: '🔴', 말: '로더는 있는데 wa 값이 없다 — 반만 붙었다' };
  if (x.wa !== x.바란wa) {
    return { 빛: '🔴', 말: 'wa 가 다르다 — 이 사이트 수가 «남의 사이트»로 간다 (' + x.wa + ')' };
  }
  if (x.떴나 === null) return { 빛: '⬜', 말: '지면에는 맞게 있다 — 브라우저에서 도는지는 못 쟀다' };
  if (!x.떴나) {
    return { 빛: '🔴', 말: '지면에는 있는데 브라우저에서 wcs 가 안 떴다 — CSP 가 막았을 수 있다' };
  }
  return { 빛: '✅', 말: '붙었고 wa 가 맞고 브라우저에서 돈다' };
}

/* ── 자가시험 ──────────────────────────────────────────────────────── */
function 자가시험() {
  let 통과 = 0;
  let 실패 = 0;
  const 본다 = (말, 참) => {
    if (참) { 통과 += 1; console.log('  ✅ ' + 말); } else { 실패 += 1; console.log('  🔴 ' + 말); }
  };

  본다('🔴 네 사이트의 wa 가 서로 «다르다» — 겹치면 남의 수에 섞인다',
    new Set(사이트.map((s) => s.wa)).size === 사이트.length);
  본다('🔴 네 곳을 다 본다', 사이트.length === 4);
  본다('⛔ wa 가 빈 곳이 없다', 사이트.every((s) => s.wa && s.wa.length > 8));

  본다('로더를 알아본다', 로더있나('<script src="//wcs.pstatic.net/wcslog.js"></script>') === true);
  본다('⛔ 없으면 없다고 한다', 로더있나('<script src="/klm-dawn.js"></script>') === false);
  본다('⛔ 빈 값에도 안 터진다', 로더있나(null) === false);

  본다('wa 값을 읽는다', wa읽기('wcs_add["wa"] = "1cda8526e74f530";') === '1cda8526e74f530');
  본다('작은따옴표·빈칸이 달라도 읽는다',
    wa읽기("wcs_add [ 'wa' ]  =  'abc123' ;") === 'abc123');
  본다('⛔ 없으면 null — 빈 글자로 읽지 않는다', wa읽기('아무 글') === null);
  본다('⛔ 빈 값에도 안 터진다', wa읽기(null) === null);

  const 바란wa = '1cda8526e74f530';
  본다('✅ 셋 다 맞으면 초록',
    판정({ 로더: true, wa: 바란wa, 떴나: true, 바란wa }).빛 === '✅');
  본다('🔴 로더가 없으면 빨강', 판정({ 로더: false, wa: null, 떴나: null, 바란wa }).빛 === '🔴');
  본다('🔴 로더는 있는데 wa 가 없으면 «반만 붙었다»',
    /반만 붙었다/.test(판정({ 로더: true, wa: null, 떴나: null, 바란wa }).말));
  본다('🔴🔴 wa 가 다르면 «남의 사이트로 간다»고 말한다 — 가장 비싼 흠이다',
    /남의 사이트/.test(판정({ 로더: true, wa: '다른값', 떴나: true, 바란wa }).말));
  본다('🔴 브라우저에서 안 떴으면 CSP 를 짚는다',
    /CSP/.test(판정({ 로더: true, wa: 바란wa, 떴나: false, 바란wa }).말));
  본다('⬜ 브라우저를 못 봤으면 ⬜ — ⛔ 「돈다」로 적지 않는다',
    판정({ 로더: true, wa: 바란wa, 떴나: null, 바란wa }).빛 === '⬜');
  본다('⬜ 아무것도 못 쟀으면 ⬜', 판정(null).빛 === '⬜');

  console.log(String.fromCharCode(10) + '자가시험 ' + (통과 + 실패) + '개 · 통과 ' + 통과 + ' · 실패 ' + 실패);
  return 실패 === 0;
}

/* ── 본체 ──────────────────────────────────────────────────────────── */
async function 잰다() {
  const require = createRequire('file:///C:/Users/User/Documents/GitHub/klifemap/package.json');
  const puppeteer = require('puppeteer-core');
  const b = await puppeteer.connect({ browserURL: (process.env.KLM_CHROME_PORT ? 'http://127.0.0.1:' + process.env.KLM_CHROME_PORT : 'http://127.0.0.1:9222'), defaultViewport: null });
  const page = await b.newPage();
  let 나쁨 = 0;
  console.log('■ 네이버 애널리틱스가 «실제로 도는가» — 네 사이트' + String.fromCharCode(10));
  try {
    for (const s of 사이트) {
      let 로더 = false;
      let wa = null;
      let 떴나 = null;
      let 비콘 = null;
      try {
        /* ⭐ 지면을 열기 «전»에 귀를 연다 — 열고 나서 달면 이미 나간 것을 놓친다 */
        비콘 = false;
        const 듣는다 = (req) => { if (/wcs\.naver\.(net|com)/.test(req.url())) 비콘 = true; };
        page.on('request', 듣는다);
        await page.goto(s.주소, { waitUntil: 'networkidle2', timeout: 90000 });
        await new Promise((r) => setTimeout(r, 2500));
        const 글 = await page.content();
        로더 = 로더있나(글);
        wa = wa읽기(글);
        떴나 = await page.evaluate(() => Boolean(window.wcs) && typeof window.wcs_do === 'function');
        await new Promise((r) => setTimeout(r, 2500));   /* 비콘이 나갈 틈을 준다 */
        page.off('request', 듣는다);
      } catch (e) {
        console.log('  ⬜ ' + s.이름.padEnd(22) + '못 쟀다 — ' + String(e.message).slice(0, 50));
        continue;
      }
      const r = 판정({ 로더, wa, 떴나, 바란wa: s.wa });
      const bz = 비콘판정(비콘);
      console.log('  ' + r.빛 + ' ' + s.이름.padEnd(22) + r.말);
      console.log('     ' + bz.빛 + ' ' + bz.말);
      if (bz.빛 === '🔴') 나쁨 += 1;
      if (r.빛 === '🔴') 나쁨 += 1;
    }
  } finally { await page.close(); b.disconnect(); }
  console.log('');
  console.log('  ⛔ 이 자는 「네이버가 집계했나」까지는 모른다 — 그것은 네이버 화면이 말한다.');
  console.log('  ⚠ 네이버는 집계가 보이기까지 하루쯤 걸린다. 내일 화면으로 다시 본다.');
  return 나쁨 ? 1 : 0;
}

/* ── 들머리 ────────────────────────────────────────────────────────── */
const 내가진입점 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가진입점) {
  if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);
  else process.exit(await 잰다());
}
