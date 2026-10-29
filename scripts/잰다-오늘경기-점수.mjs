#!/usr/bin/env node
/**
 * 잰다-오늘경기-점수.mjs — **오늘 경기 점수를 라이브에서 직접 읽는다.**
 *
 * ── 왜 (2026-10-29 · 5번) ─────────────────────────────────────────────
 * 사장님: 「**경기 끝나면 바로 알려줄테니 제발 빨리 좀 기사를 마감해라**」
 * 그런데 검색은 경기가 끝나고도 한참 뒤에야 결과를 보여 준다 —
 * 오늘 3회가 지나도록 검색에는 「경기 전」 기사만 나왔다.
 * ⇒ 짐작하지 말고 **점수판을 직접 읽는다.**
 *
 * ⚠ 지면 글자를 긁지 않는다. 그 화면은 자바스크립트가 나중에 그려서
 *   처음에는 「로딩중」만 들어 있다 — 그것을 「경기가 없다」로 읽으면 거짓 보고가 된다.
 *   ⇒ 지면 «안에서» 그 화면이 쓰는 창구를 부른다. 그래야 머리(Referer)가 맞는다.
 *
 * ⛔ 점수를 지어내지 않는다. 못 읽으면 「못 읽었다」고 적는다.
 * ⛔ 사장님 크롬을 건드리지 않는다 — b.close() 를 부르지 않는다.
 *
 * 쓰는 법
 *   node scripts/잰다-오늘경기-점수.mjs              오늘
 *   node scripts/잰다-오늘경기-점수.mjs --날 2026-10-29
 */
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const 날자리 = process.argv.indexOf('--날');
const 날 = 날자리 > 0 ? process.argv[날자리 + 1]
  : new Date().toLocaleDateString('sv-SE');   /* KST 그대로. ⛔ toISOString 금지 */

const { 쓸포트를마련한다 } = await import(
  pathToFileURL('C:\\Users\\User\\Documents\\GitHub\\klifemap\\scripts\\크롬을-띄운다.mjs').href);

const 포트 = await 쓸포트를마련한다({});
if (!포트.포트) { console.log('🔴 크롬을 못 띄웠다 — ' + 포트.누구); process.exit(1); }
console.log('■ ' + 날 + ' · 크롬 포트 ' + 포트.포트);

const require2 = createRequire(path.join('C:\\Users\\User\\Documents\\GitHub\\klifemap', 'package.json'));
const puppeteer = require2('puppeteer-core');
const b = await puppeteer.connect({ browserURL: 'http://127.0.0.1:' + 포트.포트, defaultViewport: null });
const page = await b.newPage();
try {
  await page.goto('https://m.sports.naver.com/kbaseball/schedule/index',
    { waitUntil: 'domcontentloaded', timeout: 90000 });
  await new Promise((r) => setTimeout(r, 2500));

  const 받은 = await page.evaluate(async (d) => {
    const u = 'https://api-gw.sports.naver.com/schedule/games?fields='
      + encodeURIComponent('basic,schedule,baseball')
      + '&upperCategoryId=kbaseball&fromDate=' + d + '&toDate=' + d + '&size=30';
    try {
      const r = await fetch(u, { headers: { accept: 'application/json' } });
      return { 상태: r.status, 글: await r.text() };
    } catch (e) { return { 상태: 0, 글: String(e && e.message) }; }
  }, 날);

  if (받은.상태 !== 200) {
    console.log('⬜ 창구가 안 열렸다 (' + 받은.상태 + ') — 「경기가 없다」가 아니라 «못 쟀다»다');
    console.log('   ' + String(받은.글).slice(0, 200));
    process.exit(1);
  }

  let j = null;
  try { j = JSON.parse(받은.글); } catch (e) { /* 아래에서 막는다 */ }
  const 들 = j?.result?.games || [];
  if (!들.length) {
    console.log('⬜ 그 날 경기를 못 읽었다 — 글자 ' + 받은.글.length + '자');
    process.exit(1);
  }

  console.log('');
  for (const g of 들) {
    const 홈 = g.homeTeamName || g.homeTeamCode;
    const 원 = g.awayTeamName || g.awayTeamCode;
    const 점 = (g.awayTeamScore ?? '-') + ' : ' + (g.homeTeamScore ?? '-');
    const 상태 = g.statusInfo || g.statusCode || '';
    const 곳 = g.stadium || '';
    console.log('   ' + 원 + ' ' + 점 + ' ' + 홈 + '   [' + 상태 + ']  ' + 곳
      + (g.gameDateTime ? '  ' + String(g.gameDateTime).slice(11, 16) : ''));
  }
  console.log('');
  console.log('⛔ 여기 적힌 것만 쓴다. 안 적힌 것은 지어내지 않는다.');
} finally {
  await page.close();
  b.disconnect();
}
