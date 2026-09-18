#!/usr/bin/env node
/**
 * check-klifemap-payment.mjs — **손님이 «돈을 낼 수 있나»를 잰다.**
 *
 *   node scripts/check-klifemap-payment.mjs            잰다 (막혔으면 종료코드 1)
 *   node scripts/check-klifemap-payment.mjs --적는다     재고 마커까지 남긴다
 *   node scripts/check-klifemap-payment.mjs --자가시험
 *
 * ── 🔴 사장님 지시 (2026-09-12, 원문) ────────────────────────────────────
 *
 * 「**결제가 잘 이뤄지는 지는 해당 유닛 담당자와 총괄이 6시간마다 체크해라.
 *   총괄이 케이라이프맵 일을 담당하고 있으니, 다른 세션이 같이 체크한다.
 *   둘이 체크하므로 3시간에 한번씩 체크하는 게 된다.
 *   결제가 안되면 매출은 0이다. 매우 주의해야 한다**」
 *
 * ── 왜 이 자가 생겼나 ───────────────────────────────────────────────────
 *
 * 2026-09-12 아침에 KLifeMap 유료 서비스가 «사실상 전부 닫혀» 있는 것이 드러났다.
 *
 * ```
 *   /api/auth/providers        []                    소셜 로그인 0 — 손님이 문 앞에서 막힌다
 *   /api/auth/email/send       {"simulated":true}    인증코드가 안 나간다 = 가입이 안 끝난다
 *   /api/billing/toss/status   clientKey "test_ck_…" 돈이 안 들어온다
 *   /api/billing/paypal/status enabled:false         해외 결제 0
 * ```
 *
 * ⛔ 그런데 그것을 «재는 자가 없었다». 서버가 떠 있고 DB 가 성하니 「괜찮다」였고,
 *   5번이 그날 아침 그 상태를 「서비스는 성하다」라고 적어 올리기까지 했다.
 *   사장님: 「아마추어도 해선 안 될 실수이다」
 *
 * ⭐ 그래서 이 자가 재는 것은 «서버가 떠 있나»가 아니라 **«손님이 살 수 있나»**다.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 사이트 = 'https://klifemap.ai';

/* ── 판정만 떼어 낸다 (밖에 안 나가고 시험할 수 있게) ───────────────────── */

/**
 * 손님이 «가입»을 끝낼 수 있나.
 * ⚠ 가입에 이메일 인증이 «필수»다(server.js: 인증을 통과한 줄이 없으면 400).
 *   그러니 메일이 안 나가면 소셜 로그인이 유일한 문이고, 그마저 없으면 문이 없다.
 */
export function 들어올수있나({ 로그인, 메일보냄 } = {}) {
  const 문 = [];
  const 것 = Array.isArray(로그인?.providers) ? 로그인.providers : [];
  if (것.length > 0) 문.push('소셜 로그인 ' + 것.length + '가지');
  /* simulated:true 는 «보낸 척»이다. 손님에게 코드가 안 간다 */
  const 메일산다 = 메일보냄 && 메일보냄.ok === true && 메일보냄.simulated !== true;
  if (메일산다) 문.push('이메일 가입');
  return { 열렸나: 문.length > 0, 문 };
}

/**
 * 낸 돈이 «우리에게 들어오나».
 * ⛔ enabled:true 를 「받는다」로 읽지 않는다 — 심사용 테스트 열쇠로도 참이 된다.
 */
export function 돈이들어오나({ 토스, 페이팔 } = {}) {
  const 막힌것 = [];
  if (!토스 || 토스.ok !== true || 토스.enabled !== true) {
    막힌것.push('토스가 꺼져 있다 — 원화로 받을 길이 없다');
  } else if (String(토스.clientKey ?? '').startsWith('test_') || 토스.live === false) {
    막힌것.push('토스가 «심사용 테스트 열쇠»다 — 손님이 눌러도 돈이 안 들어온다');
  }
  if (!페이팔 || 페이팔.enabled !== true) 막힌것.push('페이팔이 꺼져 있다 — 해외 손님은 못 산다');
  /* 국내가 막히면 매출이 «0»이고, 해외만 막히면 «줄어든» 것이다. 둘을 가른다 */
  const 국내막힘 = 막힌것.some((x) => x.includes('토스'));
  return { 들어오나: 막힌것.length === 0, 국내막힘, 막힌것 };
}

/**
 * 🔴 손님길 셋째 다리 — **산 감명서를 «다시 볼» 수 있나.**
 *
 * 사장님(2026-09-13): 「**비회원 결제는 감명서를 다시 못보잖아**」
 * 사장님(2026-09-15): 「**세 징검다리를 너, 담당 유닛 2이 번갈아 가면서 확인해**」
 *
 * ⚠ KLifeMap 은 SeoulMarkets 와 다르다 — 회원(로그인)이 있고, 「감명 내역」은
 *   로그인한 회원의 화면이다. 그래서 되찾는 «지면 하나»가 아니라 ①안내 지면에
 *   그 기능이 실려 있는가 ②무인증 요청이 «남의 것을 새어 주지 않는가»로 잰다.
 * ⛔ 실제 로그인→목록→상세 왕복까지는 **운영 DB에 테스트 손님을 못 심어** 이 자로는
 *   못 잰다. 그건 klifemap/tools/check-감명다시보기.mjs 를 로컬(배포 전)에서 인자
 *   없이 돌리는 쪽이 맡는다 — 여기서는 «입구가 살아 있나»까지만 잰다. 통과로
 *   부풀리지 않는다(강령 셋째 — 못 잰 것은 못 쟀다고 적는다).
 */
export function 다시볼수있나({ 로그인지면, 목록무인증, 결제무인증 } = {}) {
  if (로그인지면 == null && 목록무인증 == null && 결제무인증 == null) {
    return { 된다: null, 막힌것: [], 까닭: '못 쟀다' };
  }
  const 막힌것 = [];
  if (typeof 로그인지면 === 'string' && !/감명\s*내역/.test(로그인지면)) {
    막힌것.push('login.html 에 「감명 내역」 글자가 없다 — 지면이 빠졌거나 이름이 바뀌었다');
  }
  /* ⛔ 무인증인데 200 이면 «막힘»이 아니라 «남의 것이 새는» 반대 방향 사고다 — 더 나쁘다 */
  if (목록무인증 && 목록무인증.status !== 401) {
    막힌것.push('🔴 토큰 없이 /api/my/sessions 가 ' + 목록무인증.status + ' — 남의 감명 내역이 샐 수 있다');
  }
  if (결제무인증 && 결제무인증.status !== 401) {
    막힌것.push('🔴 토큰 없이 /api/my/payments 가 ' + 결제무인증.status + ' — 남의 결제내역이 샐 수 있다');
  }
  return { 된다: 막힌것.length === 0, 막힌것, 까닭: null };
}

/**
 * 🔴🔴 [2026-09-17] **손님이 «실제로» 결제창까지 가나** — 이 자리가 없어서 사고가 났다.
 *
 * 사장님: 「대체 유료서비스에서 결제가 안되는 게 말이되나? 내가 몇 번씩 하루에도 확인하라고
 *         한게 징검다리 셋이잖아...뭐한 거야, 대체?」
 *        「내가 지인한테 부탁해서 커뮤니티와 입소문을 낸 건데 진짜 허무하고 짜증나고 실망스럽다」
 *        「똑바로 체크해서 **결제까지 다 해봐**」
 *
 * 무슨 일이 있었나 — 위 `돈이들어오나` 는 **설정만** 본다(토스 enabled·live·실키).
 * 그 셋이 다 참인데도 손님은 「결제창을 열지 못했습니다」만 봤다. 까닭은 **키 종류**였다 —
 * 우리 라이브 키는 `live_gck_`(주문서형·결제창형)인데 코드는 `tp.payment()`(API 개별 연동)를
 * 불렀고, 토스가 그 조합을 거부했다. 설정을 아무리 읽어도 이것은 안 보인다.
 * ⇒ **브라우저로 손님이 되어 눌러 봐야만** 보인다.
 *
 * ⚠ 그리고 «사장님 계정»으로 누르면 「관리자라 0원 즉시 처리」로 빠져 결제 경로를 아예 안 탄다.
 *   그래서 이 검사는 **로그인 안 한 손님**으로 잰다.
 * ⛔ 못 쟀으면(브라우저가 없으면) «통과»로 세지 않는다. 「못 쟀다」로 남긴다.
 */
export function 결제창열리나({ 결제수단그려짐, 결제창틀높이 } = {}) {
  if (결제수단그려짐 == null && 결제창틀높이 == null) {
    return { 열리나: null, 막힌것: [], 까닭: '못 쟀다 — 브라우저(9222)에 못 붙었다' };
  }
  const 막힌것 = [];
  if (!결제수단그려짐) 막힌것.push('🔴 손님 화면에 «결제수단»이 안 그려진다 — 카드를 고를 수 없다');
  if (!(Number(결제창틀높이) > 100))막힌것.push('🔴 「결제하기」를 눌러도 «결제창»이 안 열린다');
  return { 열리나: 막힌것.length === 0, 막힌것, 까닭: null };
}

/** 셋을 합쳐 한 마디로 — 사장님이 물으시는 것은 「팔리나」 하나다 */
export function 팔리나(답들) {
  const 문 = 들어올수있나(답들);
  const 돈 = 돈이들어오나(답들);
  const 되 = 다시볼수있나(답들);
  const 창 = 결제창열리나(답들);
  const 막힌것 = [];
  if (!문.열렸나) 막힌것.push('손님이 «가입도 로그인도» 못 한다 — 문이 하나도 없다');
  막힌것.push(...돈.막힌것, ...창.막힌것, ...되.막힌것);
  /* ⛔ 못 쟀으면 «막혔다»로 몰지 않는다. 못 쟀다고 따로 말한다 */
  const 못잰것 = [];
  if (창.열리나 === null) 못잰것.push('🔴 손님으로 결제창까지 — 못 쟀다 (이 자리가 빈 채로 사고가 났다)');
  if (되.된다 === null) 못잰것.push('산 감명서를 다시 볼 수 있나 — 못 쟀다');
  /* 🔴 문이 막혔거나 국내 결제가 막혔으면 매출은 0 이다. 다시보기가 막히면 반쪽만 판 것이라
     심각으로 올린다 — 돈은 받았는데 손님이 산 것을 잃는 사고다 */
  const 심각 = !문.열렸나 || 돈.국내막힘 || 창.열리나 === false || 되.된다 === false;
  return {
    판정: 막힌것.length === 0 ? '팔린다' : (심각 ? '매출0' : '줄었다'),
    막힌것,
    못잰것,
    열린문: 문.문,
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

/** 셋째 다리용 — GET 하나를 status 만 뽑아 온다(본문은 로그인 지면만 필요하다) */
async function 상태만(길) {
  try {
    const r = await fetch(사이트 + 길, { signal: AbortSignal.timeout(15000) });
    return { status: r.status };
  } catch { return null; }
}

/**
 * 🔴 «로그인 안 한 손님»이 되어 결제창까지 눌러 본다. 브라우저가 없으면 null 을 낸다.
 * ⛔ 카드번호는 넣지 않는다 — 결제창이 «뜨는 것»까지만 본다. 승인은 부르지 않는다.
 * ⚠ 이메일은 우리 시험 주소를 쓴다. 남의 주소를 지어내지 않는다.
 */
async function 손님으로결제창까지() {
  let b = null; let 방 = null; let page = null;
  try {
    const { createRequire } = await import('node:module');
    const 부르기 = createRequire('file:///C:/Users/User/Documents/GitHub/klifemap/package.json');
    b = await 부르기('puppeteer-core').connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
    방 = await b.createBrowserContext();          /* 사장님 로그인과 갈라 놓는다 */
    page = await 방.newPage();
    /* 🔴 [2026-09-17] 이 점검이 «사람»으로, 그것도 «새 손님»으로 세어지고 있었다 —
       새 칸을 열므로 bj_vid 가 매번 새로 생겨 매시 점검이 unique_visits 를 한 명씩 늘렸다.
       머리글로 스스로 이름을 댄다. UA 는 안 건드린다(토스·페이팔이 다르게 굴 수 있다). */
    await (await import('./lib/우리크롬.mjs')).이름대기(page, '5번-결제점검');
    const 쉼 = (ms) => new Promise((r) => setTimeout(r, ms));
    await page.setViewport({ width: 430, height: 1400 });
    await page.evaluateOnNewDocument(() => { try { localStorage.setItem('bj_lang', 'ko'); } catch (e) { /* 막혀도 간다 */ } });
    await page.goto(사이트 + '/checkout.html?service=saju', { waitUntil: 'networkidle2', timeout: 60000 });
    await 쉼(4500);
    /* 비회원 문을 연다 */
    await page.evaluate(() => {
      const 넣 = (id, v) => { const e = document.getElementById(id); if (e) { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); } };
      넣('guestEmail', 'u5@klifedesign.net'); 넣('guestPhone', '01000000000');
      for (const id of ['guestAgreeTerms', 'guestAgreePrivacy', 'guestAgreeAge']) { const e = document.getElementById(id); if (e && !e.checked) e.click(); }
      const s = document.getElementById('guestSubmitBtn'); if (s) s.click();
    });
    await 쉼(8000);
    await page.evaluate(() => { const e = document.getElementById('cardBtn'); if (e) e.click(); });
    await 쉼(14000);
    const 그려짐 = await page.evaluate(() => {
      const 상자 = document.getElementById('tossWidgetBox');
      return !!(상자 && !상자.classList.contains('hidden') && document.querySelector('#tossMethods iframe'));
    });
    await page.evaluate(() => { const e = document.getElementById('tossPayBtn'); if (e) e.click(); });
    await 쉼(14000);
    const 높이 = await page.evaluate(() => {
      const 틀 = [...document.querySelectorAll('iframe')]
        .filter((f) => /tosspayments\.com/.test(f.src || ''))
        .map((f) => Math.round(f.getBoundingClientRect().height));
      return 틀.length ? Math.max(...틀) : 0;
    });
    return { 결제수단그려짐: 그려짐, 결제창틀높이: 높이 };
  } catch (e) {
    return { 결제수단그려짐: null, 결제창틀높이: null, 왜: e.message };
  } finally {
    try { if (page) await page.close(); } catch { /* 닫혀도 그만 */ }
    try { if (방) await 방.close(); } catch { /* 그만 */ }
    if (b) b.disconnect();                        /* ⛔ close() 가 아니다 */
  }
}

async function 잰다() {
  const [토스, 페이팔, 로그인, 로그인지면글, 목록무인증, 결제무인증] = await Promise.all([
    물어본다('/api/billing/toss/status'),
    물어본다('/api/billing/paypal/status'),
    물어본다('/api/auth/providers'),
    fetch(사이트 + '/login.html', { signal: AbortSignal.timeout(15000) }).then((r) => r.text()).catch(() => null),
    상태만('/api/my/sessions'),
    상태만('/api/my/payments'),
  ]);
  /* ⚠ 우리 주소로만 찔러 본다 — 손님 주소로 메일을 보내지 않는다 */
  const 메일보냄 = await 물어본다('/api/auth/email/send', { email: 'u5@klifedesign.net' });

  /* 🔴 여기가 새로 붙은 자리 — 설정만 읽지 않고 «손님이 되어» 결제창까지 눌러 본다.
     ⚠ 브라우저를 띄우므로 30~60초가 든다. --빨리 를 주면 건너뛰되 «못 쟀다»로 적는다. */
  const 창 = process.argv.includes('--빨리')
    ? { 결제수단그려짐: null, 결제창틀높이: null, 왜: '--빨리 로 건너뜀' }
    : await 손님으로결제창까지();

  const 답 = 팔리나({
    토스, 페이팔, 로그인, 메일보냄, 로그인지면: 로그인지면글, 목록무인증, 결제무인증,
    결제수단그려짐: 창.결제수단그려짐, 결제창틀높이: 창.결제창틀높이,
  });
  const 때 = new Date();

  console.log('■ klifemap 결제 점검 — ' + 때.toLocaleString('ko-KR'));
  console.log('   ⭐ 재는 것은 「서버가 떠 있나」가 아니라 «손님이 살 수 있나»다\n');
  console.log('   들어오는 문   ' + (답.열린문.length ? 답.열린문.join(' · ') : '🔴 «하나도 없다»'));
  console.log('   토스          ' + (토스 ? ('enabled=' + 토스.enabled + ' · live=' + 토스.live +
    ' · key=' + String(토스.clientKey ?? '').slice(0, 8) + '…') : '못 쟀다'));
  console.log('   페이팔        ' + (페이팔 ? ('enabled=' + 페이팔.enabled) : '못 쟀다'));
  console.log('   인증메일      ' + (메일보냄
    ? (메일보냄.simulated === true ? '🔴 simulated — «보낸 척»만 한다' : '나간다')
    : '못 쟀다'));
  /* 🔴 손님이 «실제로» 결제창까지 가나 — 이 줄이 없어서 결제가 죽은 줄 몰랐다 */
  console.log('   🔴 결제창       ' + (창.결제수단그려짐 == null
    ? ('⬜ 못 쟀다 — ' + (창.왜 || '브라우저(9222)에 못 붙었다'))
    : (창.결제수단그려짐 ? '결제수단 그려짐' : '🔴 결제수단 «안» 그려짐')
      + ' · ' + (Number(창.결제창틀높이) > 100
        ? ('결제창 열림(' + 창.결제창틀높이 + 'px)')
        : '🔴 결제창 «안» 열림')));
  console.log('   다시 보기     ' + (목록무인증 && 결제무인증
    ? ('login.html 「감명 내역」 ' + (typeof 로그인지면글 === 'string' && /감명\s*내역/.test(로그인지면글) ? '있음' : '없음')
      + ' · 무인증 sessions=' + 목록무인증.status + ' payments=' + 결제무인증.status)
    : '못 쟀다'));
  console.log('');
  for (const x of 답.못잰것) console.log('   ⬜ ' + x);

  if (답.판정 === '팔린다') {
    console.log('   ✅ 팔린다 — 손님이 들어와서 돈을 내고 다시 볼 수 있다');
  } else if (답.판정 === '줄었다') {
    console.log('   ⚠ 국내는 팔리는데 한쪽이 막혔다');
    for (const x of 답.막힌것) console.log('      · ' + x);
  } else {
    console.log('   🔴🔴 **매출 0** — 손님이 돈을 낼 수 없거나 산 것을 잃는다');
    for (const x of 답.막힌것) console.log('      · ' + x);
    console.log('');
    console.log('   ✅ 고치는 길 — Cloudtype 스테이지 시크릿에 넣고 다시 띄운다');
    console.log('      TOSS_CLIENT_KEY · TOSS_SECRET_KEY');
    console.log('      🔴 [2026-09-12 19:1x 실측] **실키가 «아직 발급된 적이 없다».**');
    console.log('         토스 개발자센터 라이브 갈피 — live_ck_/live_sk_ 둘 다 «없음»,');
    console.log('         개별 연동 키 칸도 비었고 화면이 「내 키는 전자결제 신청하고');
    console.log('         확인할 수 있어요 · 이용 신청하기」라고 말한다.');
    console.log('         ⇒ 막힌 것은 코드도 배포도 아니고 «전자결제 이용 신청»이다.');
    console.log('         ⛔ 이 자리에 원래 「단건 계약 완료 — 실키가 있다」라고 적혀 있었다.');
    console.log('            확인 안 하고 적은 거짓이었고, 그 한 줄이 사람을 엉뚱한 데로 보냈다.');
    console.log('      OAUTH_GOOGLE/NAVER/KAKAO_CLIENT_ID·SECRET  (손님이 들어오는 문)');
    console.log('      SMTP_* 또는 NCP_*                          (가입 인증코드)');
    console.log('   ⛔ klifemap 에 ctype apply 를 «env 선언 없이» 치지 않는다 — 그것이 09-11 에 다 지웠다');
  }

  /* 🔴 [2026-09-18 · 5번] 서울마켓츠 쪽에서 같은 병을 잡고 여기도 함께 고쳤다 —
   *   `--적는다` 를 붙여야만 대장에 남아, 고정 지시 명령줄 그대로 돌리면 증거가 안 남았다.
   *   ⛔ 증거를 «사람이 꼬리표를 기억해야만» 남는 구조로 두지 않는다.
   *   ⇒ 기본으로 적고, 정말 안 남기고 싶을 때만 `--안적는다` 를 붙인다. */
  if (!process.argv.includes('--안적는다')) {
    const 곳 = path.join(뿌리, 'docs', '고정업무-마커');
    fs.mkdirSync(곳, { recursive: true });
    const 날 = 때.getFullYear() + '-' + String(때.getMonth() + 1).padStart(2, '0') + '-' +
      String(때.getDate()).padStart(2, '0');
    const 시 = String(때.getHours()).padStart(2, '0');
    const 이름 = `${날}-${시}시-결제점검.txt`;
    fs.writeFileSync(path.join(곳, 이름),
      [`잰 때   ${때.toLocaleString('ko-KR')}`,
       `잰 자리  5번(총괄)`,
       `판정    ${답.판정}`,
       `열린문  ${답.열린문.join(' · ') || '없다'}`,
       ...답.막힌것.map((x) => `막힘    ${x}`)].join('\n') + '\n');
    console.log('\n   ✅ 마커를 남겼다 — docs/고정업무-마커/' + 이름);
    /* 🔴🔴 [2026-09-17] **마커만 남기고 «대장»에 안 적어서 자물쇠가 영영 안 풀렸다.**
     *
     * 그날 22:26 에 이 자를 돌려 「팔린다」를 받고 마커까지 남겼는데, 손님길 자물쇠는
     * 여전히 「21:30 칸 — 아직 안 쟀다」였다. 두 곳이 서로 다른 것을 보고 있었다 —
     *   이 자 → docs/고정업무-마커/…txt      (마커)
     *   자물쇠 → docs/손님길점검.tsv          (대장)
     * ⛔ 그러면 «재도 안 풀리는 자물쇠»다. 그건 자물쇠가 아니라 장식이다.
     *   (6번은 대장에 적고 있었다. 내가 돌린 자만 끊겨 있었다)
     * ✅ 잰 그 자리에서 대장에도 적는다. 「봤다」가 아니라 «줄»이 증거다. */
    try {
      const { 적는다 } = await import('./손님길-자물쇠.mjs');
      적는다({ 사이트: 'klifemap', 누구: '5번', 판정: 답.판정,
        말: '잰 다리: 들어오기·돈 내기·다시 보기' });
    } catch (e) {
      /* ⛔ 조용히 넘기지 않는다 — 안 적히면 자물쇠가 또 거짓말을 한다 */
      console.log('   🔴 대장에 못 적었다 — ' + String(e?.message ?? e).slice(0, 80));
    }
    console.log('   ⛔ 「봤다」는 증거가 아니다. 마커가 증거다');
  }

  return 답.판정 === '팔린다' ? 0 : 1;
}

/* ── 자가시험 ─────────────────────────────────────────────────────────── */

function 자가시험() {
  let 통과 = 0; const 깨짐 = [];
  const 검 = (이름, 나옴, 바람) => {
    if (JSON.stringify(나옴) === JSON.stringify(바람)) 통과++;
    else 깨짐.push(`${이름} — 나온 것 ${JSON.stringify(나옴)} · 바란 것 ${JSON.stringify(바람)}`);
  };

  /* 🔴 2026-09-12 08:0x 에 실제로 온 답 */
  const 그날 = {
    토스: { ok: true, enabled: true, live: false, clientKey: 'test_ck_AQ92ymxN34PzJ55D7pKj3ajRKXvd' },
    페이팔: { ok: true, enabled: false },
    로그인: { ok: true, providers: [] },
    메일보냄: { ok: true, simulated: true },
  };
  검('그날 답은 «매출0»', 팔리나(그날).판정, '매출0');
  검('문이 하나도 없다고 집어낸다', 팔리나(그날).열린문, []);
  검('막힌 것 셋을 다 센다', 팔리나(그날).막힌것.length, 3);

  검('⛔ simulated 는 «나간다»가 아니다',
    들어올수있나({ 로그인: { providers: [] }, 메일보냄: { ok: true, simulated: true } }).열렸나, false);
  검('메일이 진짜 나가면 문이 하나 열린 것이다',
    들어올수있나({ 로그인: { providers: [] }, 메일보냄: { ok: true } }).문, ['이메일 가입']);
  검('소셜만 있어도 문은 열린 것이다',
    들어올수있나({ 로그인: { providers: ['google'] }, 메일보냄: { ok: true, simulated: true } }).열렸나, true);

  검('⛔ test_ 열쇠는 «안 들어온다»',
    돈이들어오나({ 토스: { ok: true, enabled: true, live: true, clientKey: 'test_ck_x' },
      페이팔: { enabled: true } }).들어오나, false);
  검('실키면 들어온다',
    돈이들어오나({ 토스: { ok: true, enabled: true, live: true, clientKey: 'live_ck_x' },
      페이팔: { enabled: true } }).들어오나, true);
  검('페이팔만 꺼지면 «국내막힘»이 아니다',
    돈이들어오나({ 토스: { ok: true, enabled: true, live: true, clientKey: 'live_ck_x' },
      페이팔: { enabled: false } }).국내막힘, false);
  검('페이팔만 꺼진 것은 «줄었다»이지 매출0 이 아니다',
    팔리나({ 토스: { ok: true, enabled: true, live: true, clientKey: 'live_ck_x' },
      페이팔: { enabled: false }, 로그인: { providers: ['google'] },
      메일보냄: { ok: true } }).판정, '줄었다');

  const 다열림 = {
    토스: { ok: true, enabled: true, live: true, clientKey: 'live_ck_x' },
    페이팔: { ok: true, enabled: true },
    로그인: { ok: true, providers: ['google', 'naver', 'kakao'] },
    메일보냄: { ok: true },
  };
  검('다 열리면 팔린다', 팔리나(다열림).판정, '팔린다');
  검('열린 문을 둘 다 센다', 팔리나(다열림).열린문.length, 2);

  검('⛔ 아무것도 못 받았으면 «팔린다»고 하지 않는다', 팔리나({}).판정, '매출0');

  /* 🔴🔴 [2026-09-17] 이 넷이 없어서 결제가 죽은 줄 몰랐다. 사장님이 두 번 말씀하셨다 —
     「똑바로 체크해서 결제까지 다 해봐」 */
  검('🔴 결제수단이 안 그려지면 «막힌 것»이다',
    결제창열리나({ 결제수단그려짐: false, 결제창틀높이: 0 }).열리나, false);
  검('🔴 「결제하기」를 눌러도 결제창이 안 열리면 막힌 것이다',
    결제창열리나({ 결제수단그려짐: true, 결제창틀높이: 0 }).열리나, false);
  검('둘 다 되면 열린 것이다',
    결제창열리나({ 결제수단그려짐: true, 결제창틀높이: 650 }).열리나, true);
  검('⬜ 못 쟀으면 «통과»로 세지 않는다', 결제창열리나({}).열리나, null);
  검('🔴 결제창이 안 열리면 판정이 «매출0» 이다 — 설정이 다 참이어도',
    팔리나({
      토스: { ok: true, enabled: true, live: true, clientKey: 'live_gck_x' },
      페이팔: { enabled: true }, 로그인: { providers: ['google'] }, 메일보냄: { ok: true },
      로그인지면: '감명 내역', 목록무인증: { status: 401 }, 결제무인증: { status: 401 },
      결제수단그려짐: true, 결제창틀높이: 0,
    }).판정, '매출0');
  검('못 받았을 때 토스를 «꺼졌다»로 적는다',
    돈이들어오나({}).막힌것[0].includes('토스가 꺼져 있다'), true);

  /* ── 손님길 셋째 다리 — 다시 보기 ─────────────────────────────────── */
  검('아무것도 안 주면 못 쟀다(null) — 막혔다로 몰지 않는다', 다시볼수있나({}).된다, null);
  검('login.html 에 「감명 내역」 글자가 없으면 잡는다',
    다시볼수있나({ 로그인지면: '로그인 화면입니다', 목록무인증: { status: 401 }, 결제무인증: { status: 401 } })
      .막힌것.some((x) => x.includes('감명 내역')), true);
  검('「감명 내역」 있고 둘 다 401 이면 된다',
    다시볼수있나({ 로그인지면: '감명 내역 목록', 목록무인증: { status: 401 }, 결제무인증: { status: 401 } }).된다, true);
  검('🔴🔴 무인증인데 sessions 가 200 이면 «남의 것이 샌다»로 잡는다(막힘보다 나쁘다)',
    다시볼수있나({ 로그인지면: '감명 내역', 목록무인증: { status: 200 }, 결제무인증: { status: 401 } })
      .막힌것.some((x) => x.includes('샐 수 있다')), true);
  검('🔴 무인증인데 payments 가 200 이어도 잡는다',
    다시볼수있나({ 로그인지면: '감명 내역', 목록무인증: { status: 401 }, 결제무인증: { status: 200 } })
      .막힌것.some((x) => x.includes('결제내역')), true);

  검('다시보기가 막히면 국내 결제가 살아 있어도 매출0 이다(반쪽만 판 것)',
    팔리나({ 토스: { ok: true, enabled: true, live: true, clientKey: 'live_ck_x' },
      페이팔: { enabled: true }, 로그인: { providers: ['google'] }, 메일보냄: { ok: true },
      로그인지면: '로그인', 목록무인증: { status: 200 }, 결제무인증: { status: 401 } }).판정, '매출0');
  검('셋 다 열리면 팔린다', 팔리나({
    토스: { ok: true, enabled: true, live: true, clientKey: 'live_ck_x' },
    페이팔: { enabled: true }, 로그인: { providers: ['google'] }, 메일보냄: { ok: true },
    로그인지면: '감명 내역', 목록무인증: { status: 401 }, 결제무인증: { status: 401 },
  }).판정, '팔린다');
  검('다시보기를 못 쟀으면 「못잰것」에 남는다(팔린다를 부풀리지 않되 막지도 않는다)',
    팔리나(다열림).못잰것.some((x) => x.includes('다시 볼 수 있나')), true);

  console.log(`■ 자가시험 ${통과 + 깨짐.length}가지 — 통과 ${통과} · 깨짐 ${깨짐.length}`);
  for (const d of 깨짐) console.log('   🔴 ' + d);
  return 깨짐.length === 0;
}

if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);
else process.exit(await 잰다());
