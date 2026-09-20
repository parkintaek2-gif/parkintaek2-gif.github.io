#!/usr/bin/env node
/**
 * 쿠키-털기.mjs — 한 사이트의 «굳은 쿠키»만 털어 낸다. 사장님 창은 닫지 않는다.
 * ─────────────────────────────────────────────────────────────────────────────
 * [왜 만들었나 · 2026-09-20]
 *   1번이 EDINET API 열쇠 신청에서 이틀 막혔다. 이메일 인증·캡차·비밀번호·SMS 까지
 *   다 통과했는데 마지막에 오류가 났고, 그 뒤로 **몇 번을 다시 해도 같은 화면**이었다.
 *   사장님이 인증 코드까지 주셨는데도 안 풀렸다.
 *
 *   내가 그 주소를 열어 봤더니 —
 *     https://api.edinet-fsa.go.jp/  →  notfound.html
 *     「규定外操作が行われました。**ブラウザを閉じて再度操作を行ってください。**」
 *     (규정외 조작이 행해졌습니다. 브라우저를 닫고 다시 조작하십시오)
 *
 *   ⭐ **신청이 잘못된 것이 아니라 쿠키가 굳은 것이었다.** 그 상태에서는 무엇을 해도
 *     같은 화면이 나온다. 숨김 창(새 쿠키 통)으로 열었더니 로그인 화면이 정상으로 떴다.
 *
 * [그래서 이 자가 하는 일]
 *   사장님 크롬을 «닫지 않고» 그 도메인 쿠키만 턴다. 다른 사이트 로그인은 그대로 산다.
 *
 * ⛔ b.close() 를 부르지 않는다 — 사장님이 쓰시던 창이 통째로 닫힌다. disconnect() 만.
 * ⛔ 비밀번호·토큰을 읽지 않는다. 쿠키 «이름과 도메인»만 세고 지운다. 값은 안 본다.
 *
 * 쓰는 법
 *   node scripts/쿠키-털기.mjs edinet-fsa.go.jp b2clogin.com     그 도메인들을 턴다
 *   node scripts/쿠키-털기.mjs --자가시험
 *
 * ⭐ 판별법 — 「같은 오류가 몇 번을 해도 똑같이 난다」면 대개 이것이다.
 *   같은 시도를 세 번 되풀이하기 전에 쿠키를 한 번 털어 본다.
 */
import { createRequire } from 'node:module';

export function 골라내기(쿠키들, 낱말들) {
  const 것 = (낱말들 ?? []).map((s) => String(s).toLowerCase()).filter(Boolean);
  if (!것.length) return [];
  return (쿠키들 ?? []).filter((c) => {
    const d = String(c.domain ?? '').toLowerCase();
    return 것.some((n) => d.includes(n));
  });
}

export function 도메인간추리기(쿠키들) {
  return [...new Set((쿠키들 ?? []).map((c) => c.domain))].sort();
}

/* ── 자가시험 ─────────────────────────────────────────────────────── */
function 자가시험() {
  let 산 = 0; let 죽 = 0;
  const 재다 = (말, 참) => { if (참) { 산 += 1; } else { 죽 += 1; console.log('   ✕ ' + 말); } };
  const 통 = [
    { domain: 'api.edinet-fsa.go.jp', name: 'a' },
    { domain: '.fsaedinetauth.b2clogin.com', name: 'b' },
    { domain: 'accounts.google.com', name: 'c' },
    { domain: 'klifemap.ai', name: 'd' },
  ];
  재다('낱말이 든 도메인만 고른다', 골라내기(통, ['edinet-fsa.go.jp']).length === 1);
  재다('여러 낱말을 함께 고른다', 골라내기(통, ['edinet-fsa.go.jp', 'b2clogin.com']).length === 2);
  재다('점으로 시작하는 도메인도 잡는다',
    골라내기(통, ['b2clogin.com'])[0].domain === '.fsaedinetauth.b2clogin.com');
  재다('⛔ 낱말이 없으면 «아무것도» 안 턴다 — 통째로 터는 사고를 막는다',
    골라내기(통, []).length === 0 && 골라내기(통, null).length === 0);
  재다('⛔ 빈 문자열은 모든 것을 고르지 않는다', 골라내기(통, ['']).length === 0);
  재다('남의 로그인은 안 건드린다', !골라내기(통, ['edinet']).some((c) => /google|klifemap/.test(c.domain)));
  재다('대소문자를 가리지 않는다', 골라내기(통, ['EDINET-FSA.GO.JP']).length === 1);
  재다('도메인을 간추린다', 도메인간추리기(통).length === 4);
  console.log('   자가시험 ' + 산 + '개 통과' + (죽 ? ' · ' + 죽 + '개 실패' : ''));
  return 죽 === 0;
}

const 인자 = process.argv.slice(2);
if (인자.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);

const 낱말들 = 인자.filter((x) => !x.startsWith('--'));
if (!낱말들.length) {
  console.log('쓰는 법: node scripts/쿠키-털기.mjs <도메인낱말> [<도메인낱말> …]');
  console.log('  보기 : node scripts/쿠키-털기.mjs edinet-fsa.go.jp b2clogin.com');
  console.log('⛔ 낱말 없이 부르면 아무것도 안 턴다 — 통째로 터는 사고를 막는다');
  process.exit(1);
}

const require = createRequire('file:///C:/Users/User/Documents/GitHub/klifemap/package.json');
const puppeteer = require('puppeteer-core');
const b = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
const page = await b.newPage();
try {
  const 칼 = await page.createCDPSession();
  const { cookies } = await 칼.send('Network.getAllCookies');
  const 털것 = 골라내기(cookies, 낱말들);
  console.log('■ 쿠키 ' + cookies.length + '개 가운데 ' + 털것.length + '개가 걸린다');
  console.log('   도메인: ' + (도메인간추리기(털것).join(', ') || '(없다)'));
  for (const c of 털것) {
    await 칼.send('Network.deleteCookies', { name: c.name, domain: c.domain, path: c.path });
  }
  console.log('   ✅ 털었다 — 이제 그 사이트를 «처음 오는 사람»처럼 연다');
  console.log('   ⚠ 저장된 로그인(자동 채우기)은 그대로 산다. 쿠키만 턴 것이다');
} finally { await page.close().catch(() => {}); b.disconnect(); }
