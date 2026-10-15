#!/usr/bin/env node
/**
 * 잰다-중부매일-문이-열려있나.mjs
 *
 * 🔴🔴 [2026-10-15 · 5번] **왜 이 자가 필요한가.**
 * ─────────────────────────────────────────────────────────────────────
 * 사장님 — 「스포츠기사 예약이 잘 작동을 하지 않는 것 같은데… 조치를 해라」
 *
 * 재 보니 예약은 멀쩡했다. **들어갈 문이 막혀 있었다.**
 *   업무용 크롬(9222)의 claude.ai 로그인이
 *   중부매일 계정(jbnews0001@gmail.com) → u5@klifedesign.net 으로 «덮였다».
 * 그래서 회차를 못 읽고, 쓴 기사를 거두지도 못했다.
 *
 * ⛔ 더 나쁜 것 — **10-14 11시에 덮였는데 10-15 11:40 에 사장님이 말씀하실
 *   때까지 아무도 몰랐다.** 하루치 기사가 통째로 비었다.
 *   거두기는 날마다 돌았다. 돌면서 «아무것도 못 거두고» 조용히 끝났다.
 *   ⭐ 「돌았다」와 「됐다」는 다른 일이다.
 *
 * ⇒ 이 자는 **문이 열려 있나만** 잰다. 열려 있으면 조용하고, 막혔으면 운다.
 *
 * ⛔ 이 자는 고치지 않는다. 로그인은 사람이 해야 한다(자격증명은 우리가 못 가진다).
 * ⚠ 못 보는 것 — 「회차가 좋은 기사를 썼나」는 못 잰다. 그건 데스킹이 본다.
 *
 * 쓰기:  node scripts/잰다-중부매일-문이-열려있나.mjs
 *       node scripts/잰다-중부매일-문이-열려있나.mjs --자가시험
 */
import { createRequire } from 'node:module';

/** 중부매일 계정의 조직인가. ⛔ 못 받았으면 false 가 아니라 null 이다 */
export function 문이열렸나(답) {
  if (!답 || typeof 답 !== 'object') return null;
  if (답.상태 === null || 답.상태 === undefined) return null;
  return 답.상태 === 200;
}

/** 사람이 읽을 말로. ⛔ 「못 쟀다」와 「막혔다」를 가른다 */
export function 판정(결과) {
  if (결과 === null) return { 빛: '⬜', 말: '못 쟀다 — 크롬이 안 떠 있거나 붙지 못했다' };
  if (결과) return { 빛: '✅', 말: '문이 열려 있다 — 중부매일 계정으로 회차를 읽을 수 있다' };
  return { 빛: '🔴', 말: '문이 막혔다 — 중부매일 계정 로그인이 덮였다. 기사가 안 나간다' };
}

/** 어느 포트들을 볼까 — 9222 가 본래 자리, 9224 는 따로 띄운 자리 */
export const 볼포트 = [9222, 9224];

async function 한포트(포트, 조직) {
  const require = createRequire('file:///C:/Users/User/Documents/GitHub/klifemap/package.json');
  const puppeteer = require('puppeteer-core');
  let b;
  try {
    b = await puppeteer.connect({ browserURL: 'http://127.0.0.1:' + 포트, defaultViewport: null });
  } catch { return { 포트, 상태: null, 계정: null }; }
  const page = await b.newPage();
  try {
    await page.goto('https://claude.ai/new', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2500));
    const r = await page.evaluate(async (조직2) => {
      let 계정 = null;
      try {
        const a = await fetch('/api/bootstrap', { headers: { accept: 'application/json' } });
        if (a.ok) 계정 = (await a.json())?.account?.email_address ?? null;
      } catch { /* 모르면 null */ }
      const c = await fetch('/api/organizations/' + 조직2 + '/cowork/scheduled_tasks', { headers: { accept: 'application/json' } });
      return { 상태: c.status, 계정 };
    }, 조직);
    await page.close();
    return { 포트, ...r };
  } catch {
    try { await page.close(); } catch { /* 이미 닫혔다 */ }
    return { 포트, 상태: null, 계정: null };
  } finally {
    /* ⛔ b.close() 금지 — 사장님 창이 닫힌다 */
    await b.disconnect();
  }
}

async function 돈다() {
  const { 조직 } = await import('./set-jbnews-sports-prompt.mjs');
  console.log('■ 중부매일 계정으로 들어갈 «문»이 열려 있나');
  console.log('  ⛔ 예약이 살아 있어도 이 문이 막히면 기사는 한 편도 안 나간다.');
  console.log('');

  let 하나라도열림 = false;
  let 다못쟀다 = true;
  for (const 포트 of 볼포트) {
    const r = await 한포트(포트, 조직);
    const 열림 = 문이열렸나(r);
    if (열림 !== null) 다못쟀다 = false;
    if (열림) 하나라도열림 = true;
    const p = 판정(열림);
    console.log('  ' + p.빛 + ' 포트 ' + 포트 + '  '
      + (r.계정 ? '로그인 ' + r.계정 : '로그인 (못 봤다)').padEnd(34) + p.말);
  }

  console.log('');
  if (다못쟀다) {
    console.log('⬜ 두 포트 다 «못 쟀다» — 크롬이 안 떠 있다. 「막혔다」가 아니다.');
    process.exit(0);
  }
  if (하나라도열림) {
    console.log('✅ 들어갈 길이 있다.');
    process.exit(0);
  }
  console.log('🔴🔴 중부매일 계정으로 들어갈 길이 «하나도 없다» — 오늘 기사가 안 나간다.');
  console.log('   고치는 법 — 그 크롬에서 claude.ai 에 다시 로그인한다:');
  console.log('     「Google로 계속하기」 → jbnews0001@gmail.com');
  console.log('   ⛔ 자격증명은 우리가 못 가진다. 사람이 눌러야 한다.');
  process.exit(1);
}

/* ── 자가시험 ─────────────────────────────────────────────────────── */
function 자가시험() {
  let 통 = 0, 탈 = 0;
  const T = (뜻, 참) => { if (참) { 통++; console.log('  ✅ ' + 뜻); } else { 탈++; console.log('  🔴 ' + 뜻); } };

  console.log('■ 자가시험');
  T('200 이면 문이 열린 것이다', 문이열렸나({ 상태: 200 }) === true);
  T('🔴 404 면 막힌 것이다 — 조직이 안 보인다', 문이열렸나({ 상태: 404 }) === false);
  T('🔴 403 도 막힌 것이다 — 로그아웃', 문이열렸나({ 상태: 403 }) === false);
  T('⛔ 못 받았으면 null — false 로 적지 않는다', 문이열렸나(null) === null);
  T('⛔ 상태가 없으면 null 이다', 문이열렸나({ 계정: 'a@b' }) === null);
  T('⛔ 엉뚱한 것도 null 이다', 문이열렸나('200') === null);

  T('열렸으면 ✅', 판정(true).빛 === '✅');
  T('🔴 막혔으면 🔴 이고 «기사가 안 나간다»고 말한다',
    판정(false).빛 === '🔴' && 판정(false).말.includes('안 나간다'));
  T('⛔ 못 쟀으면 ⬜ 이고 «못 쟀다»고 말한다 — 「막혔다」로 읽히면 안 된다',
    판정(null).빛 === '⬜' && 판정(null).말.includes('못 쟀다'));

  T('본래 자리(9222)를 먼저 본다', 볼포트[0] === 9222);
  T('따로 띄운 자리(9224)도 본다', 볼포트.includes(9224));

  console.log('\n자가시험 — 통과 ' + 통 + ' · 실패 ' + 탈);
  process.exit(탈 ? 1 : 0);
}

const 곧바로부른것 = (() => {
  const 나 = decodeURIComponent(new URL(import.meta.url).pathname).split('/').pop();
  const 부른것 = String(process.argv[1] || '').split('/').pop().split(String.fromCharCode(92)).pop();
  return 나 !== '' && 나 === 부른것;
})();

if (!곧바로부른것) { /* 불러 쓰는 중이다 */ }
else if (process.argv.includes('--자가시험')) 자가시험();
else 돈다().catch((e) => { console.error('⬜ 못 쟀다 —', e.message); process.exit(0); });
