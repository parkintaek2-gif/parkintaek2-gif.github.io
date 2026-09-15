#!/usr/bin/env node
/**
 * check-seoulmarkets-payment.mjs — **SeoulMarkets 손님이 «돈을 낼 수 있나»를 잰다.**
 *
 *   node scripts/check-seoulmarkets-payment.mjs            잰다 (막혔으면 종료코드 1)
 *   node scripts/check-seoulmarkets-payment.mjs --적는다      재고 마커까지 남긴다
 *   node scripts/check-seoulmarkets-payment.mjs --누구 6번    마커에 적힐 자리 이름
 *   node scripts/check-seoulmarkets-payment.mjs --자가시험
 *
 * ── 🔴 사장님 지시 (2026-09-15, 원문) ────────────────────────────────────
 *
 * 「**에스마켓츠도 케이라이프맵처럼 유료 판매를 본격적으로 시작햇으니 결제창이 제대로
 *   작동하는 지, 만약 로그인을 해야만 살 수 있으면 로그인 작동하는지, 비회원구매가
 *   있으면 로그인 안해도 바로 결제가 작동하는 지를 확인해야지...
 *   시간 간격은 케이라이프맵과 같이**」
 *
 * 「시간 간격은 케이라이프맵과 같이」 = 2026-09-12 지시 그대로 —
 * 「**담당 유닛과 총괄이 6시간마다. 둘이 체크하므로 3시간에 한번씩 체크하는 게 된다.
 *   결제가 안되면 매출은 0이다. 매우 주의해야 한다**」
 *   ⇒ SeoulMarkets 는 6번(담당)과 5번(총괄)이 엇갈려 잰다.
 *
 * ── ⭐ 이 사이트는 케이라이프맵과 «꼴이 다르다». 그래서 재는 것도 다르다 ──
 *
 * 2026-09-15 19:4x 에 실측했다 —
 * ```
 *   /api/auth/providers   404      로그인이 «아예 없다»
 *   /login  /account      404
 *   회원 DB               없다      (server.mjs 머리글: 「누가 샀나」를 페이팔에 되묻는다)
 * ```
 * ⇒ **여기는 «비회원 구매만» 있다.** 사장님 물으심 셋 가운데 답이 이렇게 갈린다 —
 *   「로그인을 해야만 살 수 있나」  → 아니다. 로그인 자체가 없다
 *   「비회원구매가 되나」            → 그것이 «유일한» 길이다. 그래서 이 자가 그것만 판다
 *
 * ⛔ 그러니 이 자에 「로그인이 되나」를 넣지 않는다. 없는 것을 매일 확인하라고 두면
 *   세션이 「이건 원래 안 되는 것」으로 넘기면서 그 아래 «되는 항목»까지 건너뛴다.
 * ✅ 대신 **「로그인 없이 끝까지 가나」**를 잰다. 그것이 여기서 매출을 정하는 하나다.
 *
 * ── 🔴 어디까지 재고 어디서 멈추나 ───────────────────────────────────────
 * ```
 * ✅ 잰다  설정(/api/pay/config) · 값이 정본과 같나 · 주문 만들기(/api/pay/order)
 * ✅ 잰다  손님 브라우저에서 «페이팔 단추가 실제로 그려지나» (크롬 9222 가 있을 때)
 * ⛔ 안 한다  /api/pay/capture — **그것이 돈이 오가는 자리다.**
 *           사장님 지시: 「결제, 입출금 등 돈이 직접 오가는 건만 승인받도록」
 * ```
 * ⚠ 주문을 «만드는 것»은 돈이 움직이지 않는다(승인은 capture 에서 일어난다).
 *   그래서 주문 만들기까지가 승인 없이 잴 수 있는 끝이고, 여기서 멈춘다.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 사이트 = 'https://seoulmarkets.com';

/* ── 판정만 떼어 낸다 (밖에 안 나가고 시험할 수 있게) ───────────────────── */

/**
 * 페이팔이 «진짜 돈을 받는 판»인가.
 * ⛔ enabled:true 를 「받는다」로 읽지 않는다 — 심사용 모래상자로도 참이 된다.
 *   케이라이프맵이 바로 그 꼴이었다(test_ 열쇠인데 enabled:true).
 */
export function 돈받는판인가(설정) {
  const 막힌것 = [];
  if (!설정 || 설정.enabled !== true) {
    막힌것.push('페이팔이 꺼져 있다 — 손님이 낼 길이 «하나도» 없다');
    return { 산다: false, 막힌것 };
  }
  if (설정.live !== true) 막힌것.push('페이팔이 «모래상자(sandbox)»다 — 눌러도 돈이 안 들어온다');
  const id = String(설정.clientId ?? '');
  if (!id) 막힌것.push('clientId 가 비었다 — 화면이 단추를 못 그린다');
  else if (/^sb-|^AZ.*sandbox/i.test(id)) 막힌것.push('clientId 가 모래상자 열쇠다');
  if (String(설정.currency ?? '') !== 'USD') {
    막힌것.push('통화가 USD 가 아니다 — 지면은 달러로 적어 두었다');
  }
  return { 산다: 막힌것.length === 0, 막힌것 };
}

/**
 * 🔴 화면에 적힌 값과 «청구될 값»이 같은가.
 * 이것이 어긋나면 손님이 본 값과 다른 돈이 빠진다. 사고 가운데 가장 나쁜 갈래다.
 */
export function 값이맞나(설정, 정본) {
  const 것 = (설정 && 설정.products) || {};
  const 어긋난것 = [];
  for (const 코드 of Object.keys(정본 || {})) {
    const 서버 = 것[코드];
    if (!서버) { 어긋난것.push(코드 + ' 가 서버 설정에 없다'); continue; }
    if (String(서버.usd) !== String(정본[코드].usd)) {
      어긋난것.push(코드 + ' 값이 다르다 — 저장소 ' + 정본[코드].usd + ' · 서버 ' + 서버.usd);
    }
  }
  return { 맞나: 어긋난것.length === 0, 어긋난것 };
}

/**
 * 🔴 손님길 셋째 다리 — **산 것을 «다시 볼» 수 있나.**
 *
 * 사장님(2026-09-15): 「**유료 사이트는 항상 뭘 확인하라고 했지?
 *   그걸 담당 세션과 네가 같이 확인을 해야 돼..결제가 안되는 사이트는 정말 쓰레기야**」
 * 그리고 앞서(2026-09-13): 「**비회원 결제는 감명서를 다시 못보잖아**」
 *
 * ⇒ 유료 사이트의 손님길은 «셋»이다 — 들어오기 · 돈 내기 · **다시 보기**.
 *   여기는 회원이 없으므로 셋째가 더 중요하다. 주문번호 하나가 손님이 가진 전부다.
 * ⛔ 「결제가 됐으니 됐다」로 끝내지 않는다. 산 것을 못 찾으면 반쪽만 판 것이다.
 */
export function 다시볼수있나({ 되찾는지면, 되찾는답 } = {}) {
  const 막힌것 = [];
  if (되찾는지면 == null) return { 된다: null, 막힌것: [], 까닭: '못 쟀다' };
  if (되찾는지면.status !== 200) {
    막힌것.push('/recover 가 ' + 되찾는지면.status + ' 다 — 손님이 산 것을 찾을 곳이 없다');
  } else if (되찾는지면.주문칸없음) {
    막힌것.push('/recover 에 주문번호 넣을 칸이 없다 — 지면은 있는데 쓸 수가 없다');
  }
  /* ⛔ 가짜 주문번호에 «파일을 주면» 그것이 더 큰 사고다 — 안 산 사람이 받아 간다 */
  if (되찾는답 != null) {
    if (되찾는답.상태 === 200) 막힌것.push('🔴 안 산 주문번호에 파일을 내준다 — 누구나 공짜로 받아 간다');
    else if (되찾는답.상태 >= 500) 막힌것.push('되찾기가 서버 오류(' + 되찾는답.상태 + ')로 죽는다');
  }
  return { 된다: 막힌것.length === 0, 막힌것, 까닭: null };
}

/** 주문이 «만들어지나» — 이것이 되면 페이팔 쪽 열쇠가 살아 있다는 뜻이다 */
export function 주문됐나(답) {
  if (!답) return { 됐나: false, 까닭: '주문 만들기가 답을 안 줬다 — 서버나 페이팔 열쇠가 막혔다' };
  const id = 답.id ||답.orderID || (답.order && 답.order.id);
  if (!id) return { 됐나: false, 까닭: '주문 번호가 안 왔다 — ' + String(답.error || JSON.stringify(답)).slice(0, 120) };
  return { 됐나: true, 까닭: null, 주문번호: id };
}

/**
 * 셋을 합쳐 한 마디로 — 사장님이 물으시는 것은 「팔리나」 하나다.
 * @param 단추 {null|{그려졌나:boolean}} 크롬으로 못 쟀으면 null (⛔ 0 으로 치지 않는다)
 */
export function 팔리나({ 설정, 정본, 주문, 단추, 되찾기 } = {}) {
  const 판 = 돈받는판인가(설정);
  const 값 = 값이맞나(설정, 정본);
  const 주 = 주문됐나(주문);
  const 되 = 다시볼수있나(되찾기 ?? {});
  const 막힌것 = [...판.막힌것, ...값.어긋난것.map((x) => '값이 어긋난다 — ' + x), ...되.막힌것];
  if (!주.됐나) 막힌것.push(주.까닭);
  /* ⛔ 못 쟀으면 «막혔다»로 몰지 않는다. 못 쟀다고 따로 말한다 */
  const 못잰것 = [];
  if (되.된다 === null) 못잰것.push('산 것을 다시 볼 수 있나 — 못 쟀다');
  if (단추 === null || 단추 === undefined) 못잰것.push('손님 브라우저에서 단추가 그려지나 — 못 쟀다(크롬 9222 가 안 떠 있다)');
  else if (단추.그려졌나 !== true) 막힌것.push('페이팔 단추가 «화면에 안 그려진다» — 설정은 살아 있는데 손님 눈에는 살 곳이 없다');

  return {
    판정: 막힌것.length === 0 ? '팔린다' : '매출0',
    막힌것,
    못잰것,
    주문번호: 주.주문번호 ?? null,
  };
}

/* ── 실제로 잰다 ───────────────────────────────────────────────────────── */

async function 물어본다(길, 보낼것) {
  try {
    const r = await fetch(사이트 + 길, {
      method: 보낼것 ? 'POST' : 'GET',
      headers: 보낼것 ? { 'Content-Type': 'application/json' } : undefined,
      body: 보낼것 ? JSON.stringify(보낼것) : undefined,
      signal: AbortSignal.timeout(25000),
    });
    return await r.json();
  } catch { return null; }
}

/** 로그인 자리가 «정말로 없나» — 있으면 그것도 재야 하므로 확인한다 */
async function 로그인있나() {
  const 것 = ['/api/auth/providers', '/login', '/account'];
  const 살아있는것 = [];
  for (const u of 것) {
    try {
      const r = await fetch(사이트 + u, { signal: AbortSignal.timeout(15000) });
      if (r.status !== 404) 살아있는것.push(u + ' (' + r.status + ')');
    } catch { /* 못 쟀으면 넘어간다 */ }
  }
  return 살아있는것;
}

/** 손님 브라우저에서 «단추가 그려지나». ⛔ 크롬이 없으면 null — 0 으로 치지 않는다 */
async function 단추그려지나() {
  try {
    const v = await fetch('http://127.0.0.1:9222/json/version', { signal: AbortSignal.timeout(4000) });
    if (!v.ok) return null;
  } catch { return null; }
  let b = null; let page = null;
  try {
    const { createRequire } = await import('node:module');
    const require = createRequire('file:///C:/Users/User/Documents/GitHub/klifemap/package.json');
    const puppeteer = require('puppeteer-core');
    b = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
    page = await b.newPage();                       /* ⭐ 언제나 «새 탭» */
    await page.setViewport({ width: 400, height: 860 });   /* 손님 크기로 본다 */
    await page.goto(사이트 + '/data#buy', { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise((r) => setTimeout(r, 2500));
    /* 손님이 하는 대로 — 상품 하나를 고른다 */
    await page.evaluate(() => {
      const 칩 = document.querySelectorAll('#buyProducts .chip');
      if (칩.length) 칩[칩.length - 1].click();
    });
    await new Promise((r) => setTimeout(r, 3500));
    return await page.evaluate(() => ({
      그려졌나: document.querySelectorAll('#paypalButtons iframe').length > 0,
      틀수: document.querySelectorAll('#paypalButtons iframe').length,
      상품칩수: document.querySelectorAll('#buyProducts .chip').length,
      총액: ((document.getElementById('buyTotal') || {}).textContent || '').trim(),
      로그인하라는말: /\b(log ?in|sign ?in)\b/i.test(document.body.innerText),
    }));
  } catch { return null; }
  finally {
    /* ⛔ b.close() 를 부르지 않는다 — 사장님이 쓰시던 창이 통째로 닫힌다 */
    try { if (page) await page.close(); } catch { /* 넘어간다 */ }
    try { if (b) b.disconnect(); } catch { /* 넘어간다 */ }
  }
}

/** 손님길 셋째 다리를 실제로 잰다 */
async function 되찾기잰다() {
  const 것 = {};
  try {
    const r = await fetch(사이트 + '/recover', { signal: AbortSignal.timeout(20000) });
    const 글 = await r.text();
    것.되찾는지면 = { status: r.status, 주문칸없음: !/id="orderId"/.test(글) };
  } catch { 것.되찾는지면 = null; }
  try {
    /* ⛔ 가짜 번호로 «막히는지»를 본다. 안 막히면 누구나 공짜로 받아 가는 것이다 */
    const r = await fetch(사이트 + '/api/download?order=NOTAREALORDER&product=academic&dataset=people',
      { signal: AbortSignal.timeout(25000) });
    것.되찾는답 = { 상태: r.status };
  } catch { 것.되찾는답 = null; }
  return 것;
}

async function 잰다() {
  const { 상품: 정본 } = await import('../src/data/licence-products.mjs');
  const 설정 = await 물어본다('/api/pay/config');
  /* ⛔ capture 는 «부르지 않는다». 주문 만들기까지가 돈이 안 움직이는 끝이다 */
  const 주문 = await 물어본다('/api/pay/order', { product: 'all' });
  const [로그인자리, 단추, 되찾기] = await Promise.all([로그인있나(), 단추그려지나(), 되찾기잰다()]);

  const 답 = 팔리나({ 설정, 정본, 주문, 단추, 되찾기 });
  const 때 = new Date();

  console.log('■ SeoulMarkets 결제 점검 — ' + 때.toLocaleString('ko-KR'));
  console.log('   ⭐ 재는 것은 「서버가 떠 있나」가 아니라 «손님이 살 수 있나»다\n');
  console.log('   페이팔 설정   ' + (설정
    ? ('enabled=' + 설정.enabled + ' · live=' + 설정.live + ' · ' + 설정.currency
      + ' · clientId ' + String(설정.clientId ?? '').slice(0, 10) + '…')
    : '🔴 못 쟀다'));
  console.log('   값이 맞나     ' + (값이맞나(설정, 정본).맞나 ? '지면·서버 같다' : '🔴 어긋난다'));
  console.log('   주문 만들기   ' + (답.주문번호 ? '된다 (' + 답.주문번호 + ')' : '🔴 안 된다')
    + '   ⛔ 승인(capture)은 부르지 않았다 — 돈이 오가는 자리다');
  console.log('   로그인 자리   ' + (로그인자리.length
    ? ('있다 — ' + 로그인자리.join(' · ') + ' ⇒ 이것도 재야 한다')
    : '없다 (비회원 구매만) — 그러니 위 셋이 매출의 전부다'));
  console.log('   손님 화면     ' + (단추
    ? ((단추.그려졌나 ? '✅ 페이팔 단추 ' + 단추.틀수 + '개가 그려진다' : '🔴 단추가 «안» 그려진다')
      + ' · 상품 ' + 단추.상품칩수 + '개 · ' + (단추.총액 || '총액 없음')
      + (단추.로그인하라는말 ? ' · ⚠ 화면이 로그인을 말한다' : ''))
    : '⬜ 못 쟀다 — 크롬 9222 가 안 떠 있다'));
  /* 🔴 손님길 셋째 다리 — 사장님: 「비회원 결제는 감명서를 다시 못보잖아」 */
  console.log('   다시 보기     ' + (되찾기.되찾는지면
    ? ('/recover ' + 되찾기.되찾는지면.status
      + (되찾기.되찾는지면.주문칸없음 ? ' · 🔴 주문번호 넣을 칸이 없다' : ' · 주문번호 칸 있다')
      + (되찾기.되찾는답 ? ' · 안 산 번호는 ' + 되찾기.되찾는답.상태 + ' 로 막는다' : ''))
    : '⬜ 못 쟀다'));
  console.log('');

  if (답.판정 === '팔린다') {
    console.log('   ✅ 팔린다 — 로그인 없이 바로 사고, 산 것을 다시 찾을 수 있다');
  } else {
    console.log('   🔴🔴 **매출 0** — 손님이 돈을 낼 수 없다');
    for (const x of 답.막힌것) console.log('      · ' + x);
    console.log('');
    console.log('   ✅ 먼저 볼 곳 — Cloudtype 스테이지 시크릿');
    console.log('      PAYPAL_CLIENT_ID · PAYPAL_CLIENT_SECRET · PAYPAL_ENV(live)');
    console.log('      ⛔ 이름을 짐작해서 넣지 않는다. src/lib/paypal.mjs 에서 찾아 확인한다');
  }
  for (const x of 답.못잰것) console.log('   ⬜ ' + x);

  if (process.argv.includes('--적는다')) {
    const i = process.argv.indexOf('--누구');
    const 누구 = i > 0 ? (process.argv[i + 1] || '5번') : '5번';
    const 곳 = path.join(뿌리, 'docs', '고정업무-마커');
    fs.mkdirSync(곳, { recursive: true });
    /* ⛔ toISOString() 을 쓰지 않는다 — 이 PC 는 이미 한국시간이고 새벽에 하루가 어긋난다 */
    const p = (n) => String(n).padStart(2, '0');
    const 날 = 때.getFullYear() + '-' + p(때.getMonth() + 1) + '-' + p(때.getDate());
    const 이름 = `${날}-${p(때.getHours())}시-서울마켓츠결제점검.txt`;
    fs.writeFileSync(path.join(곳, 이름),
      [`잰 때   ${때.toLocaleString('ko-KR')}`,
       `잰 자리  ${누구}`,
       `판정    ${답.판정}`,
       `주문    ${답.주문번호 ?? '안 만들어졌다'}`,
       `로그인   ${로그인자리.length ? 로그인자리.join(' · ') : '없다 (비회원 구매만)'}`,
       `단추    ${단추 ? (단추.그려졌나 ? '그려진다(' + 단추.틀수 + ')' : '안 그려진다') : '못 쟀다'}`,
       ...답.막힌것.map((x) => `막힘    ${x}`),
       ...답.못잰것.map((x) => `못 쟀다  ${x}`)].join('\n') + '\n');
    console.log('\n   ✅ 마커를 남겼다 — docs/고정업무-마커/' + 이름);
    console.log('   ⛔ 「봤다」는 증거가 아니다. 마커가 증거다');
  }

  return 답.판정 === '팔린다' ? 0 : 1;
}

/** 일일 점검이 부르는 공통 입구 */
export async function 일일점검(사이트코드) {
  if (사이트코드 !== 'seoulmarkets') return { 됐나: null, 말: 'SeoulMarkets 칸에서만 잽니다' };
  try {
    const { 상품: 정본 } = await import('../src/data/licence-products.mjs');
    const 설정 = await 물어본다('/api/pay/config');
    const 주문 = await 물어본다('/api/pay/order', { product: 'all' });
    const 답 = 팔리나({ 설정, 정본, 주문, 단추: undefined });
    if (답.판정 === '팔린다') return { 됐나: true, 말: '로그인 없이 살 수 있다 · 주문 ' + 답.주문번호 };
    return { 됐나: false, 말: '🔴 매출 0 — ' + 답.막힌것.join(' · ') };
  } catch (e) {
    return { 됐나: null, 말: '못 쟀다 — ' + String(e.message).slice(0, 80) };
  }
}

/* ── 자가시험 ─────────────────────────────────────────────────────────── */

export function 자가시험() {
  const 것 = []; const 재다 = (이름, 됐나) => 것.push({ 이름, 됐나 });
  /* 2026-09-15 19:4x 에 실제로 온 답 */
  const 살아있는설정 = {
    enabled: true, live: true, currency: 'USD',
    clientId: 'BAABm84SolXIEd5y0pfnN7IAE-HRjW_R5sQgJjiqb_RY_rgNrBsQ9kqPNIuqK2gxXFYUt3H8UwYJHHIH1M',
    products: { academic: { usd: '79.00' }, single: { usd: '990.00' }, all: { usd: '2990.00' } },
  };
  const 정본 = { academic: { usd: '79.00' }, single: { usd: '990.00' }, all: { usd: '2990.00' } };
  const 주문 = { id: '5AB12345CD678901E' };
  const 단추 = { 그려졌나: true, 틀수: 2 };
  /* 2026-09-15 21:3x 실측 — /recover 200 · 주문칸 있음 · 안 산 번호는 402 로 막힌다 */
  const 되찾기 = { 되찾는지면: { status: 200, 주문칸없음: false }, 되찾는답: { 상태: 402 } };

  재다('오늘 실제 답은 «팔린다»', 팔리나({ 설정: 살아있는설정, 정본, 주문, 단추, 되찾기 }).판정 === '팔린다');

  /* ── 손님길 셋째 다리 ─────────────────────────────────────────────── */
  재다('🔴 /recover 가 404 면 매출0 — 산 것을 찾을 곳이 없다',
    팔리나({ 설정: 살아있는설정, 정본, 주문, 단추,
      되찾기: { 되찾는지면: { status: 404 }, 되찾는답: { 상태: 402 } } }).판정 === '매출0');
  재다('🔴 지면은 200 인데 주문번호 칸이 없으면 잡는다',
    다시볼수있나({ 되찾는지면: { status: 200, 주문칸없음: true } }).막힌것.some((x) => /칸이 없다/.test(x)));
  재다('🔴🔴 안 산 번호에 파일을 내주면 «그것이 더 큰 사고»다',
    다시볼수있나({ 되찾는지면: { status: 200, 주문칸없음: false }, 되찾는답: { 상태: 200 } })
      .막힌것.some((x) => /공짜로 받아 간다/.test(x)));
  재다('되찾기가 500 으로 죽으면 잡는다',
    다시볼수있나({ 되찾는지면: { status: 200, 주문칸없음: false }, 되찾는답: { 상태: 500 } }).된다 === false);
  재다('⬜ 못 쟀으면 «막혔다»가 아니라 null', 다시볼수있나({}).된다 === null);
  재다('402 로 막는 것이 «맞는» 답이다',
    다시볼수있나({ 되찾는지면: { status: 200, 주문칸없음: false }, 되찾는답: { 상태: 402 } }).된다 === true);

  재다('🔴 꺼져 있으면 매출0',
    팔리나({ 설정: { enabled: false }, 정본, 주문, 단추 }).판정 === '매출0');
  재다('🔴 모래상자면 매출0 — enabled:true 라도',
    돈받는판인가({ ...살아있는설정, live: false }).산다 === false);
  재다('⛔ clientId 가 비면 잡아낸다',
    돈받는판인가({ ...살아있는설정, clientId: '' }).막힌것.some((x) => /clientId/.test(x)));
  재다('통화가 USD 가 아니면 잡아낸다',
    돈받는판인가({ ...살아있는설정, currency: 'KRW' }).산다 === false);

  재다('🔴 지면 값과 서버 값이 다르면 잡아낸다', (() => {
    const 틀린 = { ...살아있는설정, products: { ...살아있는설정.products, all: { usd: '2490.00' } } };
    const r = 값이맞나(틀린, 정본);
    return r.맞나 === false && /2990.*2490|2490/.test(r.어긋난것.join(' '));
  })());
  재다('서버에 상품이 빠지면 잡아낸다',
    값이맞나({ products: { academic: { usd: '79.00' } } }, 정본).어긋난것.length === 2);

  재다('주문번호가 오면 된 것이다', 주문됐나({ id: 'X1' }).됐나 === true);
  재다('⛔ 주문이 null 이면 안 된 것이다', 주문됐나(null).됐나 === false);
  재다('⛔ 주문에 번호가 없으면 안 된 것이다', 주문됐나({ error: 'no keys' }).됐나 === false);
  재다('주문 별칭 orderID 도 읽는다', 주문됐나({ orderID: 'X2' }).주문번호 === 'X2');

  재다('🔴 단추가 «안 그려지면» 매출0 — 설정이 살아 있어도',
    팔리나({ 설정: 살아있는설정, 정본, 주문, 단추: { 그려졌나: false } }).판정 === '매출0');
  재다('⬜ 못 쟀으면 «막혔다»로 몰지 않는다 — 못 쟀다고 따로 말한다', (() => {
    const r = 팔리나({ 설정: 살아있는설정, 정본, 주문, 단추: null, 되찾기 });
    return r.판정 === '팔린다' && r.못잰것.length === 1;
  })());

  재다('막힌 것이 여럿이면 다 센다',
    팔리나({ 설정: { enabled: true, live: false, currency: 'KRW', clientId: '' }, 정본, 주문: null, 단추 })
      .막힌것.length >= 4);

  const 실패 = 것.filter((x) => !x.됐나);
  console.log(`■ 자가시험 ${것.length - 실패.length}/${것.length}`);
  for (const x of 실패) console.log(`  🔴 ${x.이름}`);
  return 실패.length === 0;
}

if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);
else if (process.argv[1] && process.argv[1].endsWith('check-seoulmarkets-payment.mjs')) {
  process.exit(await 잰다());
}
