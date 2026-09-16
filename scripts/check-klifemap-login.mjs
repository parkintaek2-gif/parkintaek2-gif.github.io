#!/usr/bin/env node
/**
 * check-klifemap-login.mjs — **손님이 «들어올 수 있나»를 끝까지 재는 자.**
 *
 *   node scripts/check-klifemap-login.mjs
 *   node scripts/check-klifemap-login.mjs --자가시험
 *
 * ── 🔴 왜 만드나 (2026-09-16 · 5번) ──────────────────────────────────────
 *
 * 카카오가 REST API 키의 「클라이언트 시크릿」을 **기본 켜짐**으로 바꿨다(KOE010 안내 메일).
 * 우리 서버에는 `OAUTH_KAKAO_CLIENT_SECRET` 이 없었다. 그래서 이렇게 됐다 —
 *
 * ```
 *   /api/health              oauthDetail.kakao = "on"     ← 멀쩡해 보인다
 *   /api/auth/providers      ["google","naver","kakao"]   ← 멀쩡해 보인다
 *   로그인 지면              카카오 단추가 그려진다        ← 멀쩡해 보인다
 *   손님이 «누르고 나서»      카카오 화면까지 잘 가고, 아이디를 넣은 «뒤에» 튕긴다
 * ```
 *
 * 🔴 **빨간불이 아무 데도 안 켜지는 갈래다.** 서버 200 · 지면 멀쩡 · 오류 로그 없음.
 *   깨지는 곳은 «토큰 교환» 한 자리뿐이고, 그 자리는 손님이 아이디를 넣어야 지나간다.
 *   그래서 지금까지의 자는 「단추가 있나」까지만 봤고, 그것으로는 영영 못 잡는다.
 *
 * ── ⭐ 어떻게 «누르지 않고» 토큰 교환까지 가나 ────────────────────────────
 *
 * 1. `GET /auth/<제공자>` 를 부르면 서버가 상태값(state)을 «제 기억에» 넣고 302 를 준다
 * 2. 그 상태값을 그대로 들고 `GET /auth/<제공자>/callback?code=<가짜>&state=<그것>` 을 부른다
 * 3. 서버는 우리 client_id·client_secret 으로 «진짜 토큰 교환»을 시도한다
 * 4. 제공자가 내는 오류가 두 갈래로 갈린다 —
 *
 * ```
 *   자격이 «통과»했다 → 코드가 틀렸다고만 한다   invalid_grant · KOE320 · Malformed auth code
 *   자격이 «거절»됐다 → 열쇠가 틀렸다고 한다     invalid_client · KOE010 · unauthorized_client
 * ```
 *
 * ⭐ 곧 **가짜 코드로도 열쇠가 맞는지 끝까지 잴 수 있다.** 계정이 새로 생기지 않는다
 *   (토큰 교환이 실패하므로 가입·로그인 어느 쪽도 일어나지 않는다).
 *
 * 2026-09-16 16:5x 실측 —
 * ```
 *   google  {"error":"invalid_grant","error_description":"Malformed auth code."}
 *   naver   {"error":"invalid_request","error_description":"no valid data in session"}
 *   kakao   {"error":"invalid_grant", … "KOE320"}      ← 고치기 «전»에는 KOE010 이었다
 * ```
 *
 * ── ⛔ 이 자가 지키는 것 ─────────────────────────────────────────────────
 * ⛔ 열쇠 «값»을 읽지 않는다. 오류 글만 본다
 * ⛔ 모르는 오류를 「고장」으로도 「성함」으로도 적지 않는다 — **「못 쟀다」**로 적는다
 * ⛔ 진짜 인가 코드를 넣지 않는다. 가짜만 넣는다
 * ✅ 「단추가 있나」를 「로그인이 되나」로 읽지 않는다 — 그 착각이 이 사고를 만들었다
 */

const 밑주소 = process.env.KLM_BASE || 'https://klifemap.ai';
export const 제공자들 = ['google', 'naver', 'kakao'];
export const 가짜코드 = 'ZZZ_bogus_probe_do_not_use';

/* ── 판정만 떼어 낸다 (밖에 안 나가고 시험할 수 있게) ─────────────────── */

/* 열쇠가 틀렸을 때만 나오는 말들. 여기 걸리면 «손님이 못 들어온다» */
const 열쇠거절 = [
  'invalid_client', 'unauthorized_client', 'incorrect client', 'bad client credentials',
  'client authentication failed', 'koe010', 'koe101', 'invalid_client_secret',
];
/* 열쇠는 통과했고 «코드»만 틀렸을 때 나오는 말들. 여기 걸리면 성한 것이다 */
const 코드만틀림 = [
  'invalid_grant', 'koe320', 'malformed auth code', 'authorization code not found',
  'no valid data in session',
];

/**
 * 토큰 교환 결과 글을 보고 «열쇠가 통과했나»를 가른다.
 * @returns {{판정:'통과'|'거절'|'못잼', 왜:string}}
 */
export function 열쇠가통과했나(글) {
  const g = String(글 || '').toLowerCase();
  if (!g.trim()) return { 판정: '못잼', 왜: '아무 글도 못 받았다' };
  /* ⚠ 거절을 «먼저» 본다 — 카카오는 KOE010 을 invalid_grant 와 함께 낸 적이 있다.
       두 갈래에 다 걸리면 «나쁜 쪽»으로 읽는 것이 안전하다 */
  for (const t of 열쇠거절) if (g.includes(t)) return { 판정: '거절', 왜: t };
  for (const t of 코드만틀림) if (g.includes(t)) return { 판정: '통과', 왜: t };
  return { 판정: '못잼', 왜: '내가 모르는 오류다' };
}

/** 302 의 Location 에서 상태값을 꺼낸다. 없으면 null */
export function 상태값꺼내기(자리) {
  const m = String(자리 || '').match(/[?&]state=([^&#]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

/** 302 가 제대로 된 제공자 쪽으로 가는가 */
const 제공자문 = { google: 'accounts.google.com', naver: 'nid.naver.com', kakao: 'kauth.kakao.com' };
export function 제대로된곳으로가나(제공자, 자리) {
  const 문 = 제공자문[제공자];
  if (!문) return { 간다: false, 왜: '내가 모르는 제공자다' };
  const s = String(자리 || '');
  if (!s.includes(문)) return { 간다: false, 왜: 문 + ' 로 안 간다' };
  if (!/[?&]client_id=[^&]+/.test(s)) return { 간다: false, 왜: 'client_id 가 비어 있다' };
  if (!상태값꺼내기(s)) return { 간다: false, 왜: 'state 가 없다' };
  return { 간다: true, 왜: '' };
}

/* ── 실제로 재는 자리 ──────────────────────────────────────────────────── */

async function 하나잰다(제공자) {
  let 자리 = '';
  try {
    const r = await fetch(`${밑주소}/auth/${제공자}`, { redirect: 'manual' });
    자리 = r.headers.get('location') || '';
  } catch (e) {
    return { 제공자, 판정: '못잼', 왜: '문을 못 두드렸다: ' + String(e.message).slice(0, 60) };
  }
  const 문 = 제대로된곳으로가나(제공자, 자리);
  if (!문.간다) return { 제공자, 판정: '거절', 왜: '들어가는 문부터 틀렸다 — ' + 문.왜 };

  const state = 상태값꺼내기(자리);
  let 글 = '';
  try {
    const r2 = await fetch(`${밑주소}/auth/${제공자}/callback?code=${가짜코드}&state=${encodeURIComponent(state)}`);
    글 = await r2.text();
  } catch (e) {
    return { 제공자, 판정: '못잼', 왜: '되돌아오는 길을 못 밟았다: ' + String(e.message).slice(0, 60) };
  }
  const 것 = 열쇠가통과했나(글);
  return { 제공자, 판정: 것.판정, 왜: 것.왜, 글: 글.replace(/[A-Za-z0-9_-]{24,}/g, '<가림>').slice(0, 160) };
}

/* ── 자가시험 ─────────────────────────────────────────────────────────── */

function 자가시험() {
  const 것들 = [];
  const 다 = (이름, 참) => 것들.push({ 이름, 참: !!참 });

  /* 실측한 세 글 (2026-09-16 16:5x) */
  다('구글 가짜코드 = 통과', 열쇠가통과했나('{"error":"invalid_grant","error_description":"Malformed auth code."}').판정 === '통과');
  다('네이버 가짜코드 = 통과', 열쇠가통과했나('{"error":"invalid_request","error_description":"no valid data in session"}').판정 === '통과');
  다('카카오 가짜코드 = 통과', 열쇠가통과했나('{"error":"invalid_grant","error_description":"authorization code not found for code=x","error_code":"KOE320"}').판정 === '통과');

  /* 고치기 «전»에 손님이 겪던 것 */
  다('카카오 KOE010 = 거절', 열쇠가통과했나('{"error":"invalid_client","error_code":"KOE010"}').판정 === '거절');
  다('구글 열쇠 틀림 = 거절', 열쇠가통과했나('{"error":"invalid_client","error_description":"Unauthorized"}').판정 === '거절');
  다('unauthorized_client = 거절', 열쇠가통과했나('{"error":"unauthorized_client"}').판정 === '거절');
  다('두 갈래에 다 걸리면 거절로 읽는다', 열쇠가통과했나('invalid_grant … KOE010').판정 === '거절');

  /* 모르는 것은 «못 쟀다» — 성함으로도 고장으로도 적지 않는다 */
  다('빈 글 = 못잼', 열쇠가통과했나('').판정 === '못잼');
  다('모르는 오류 = 못잼', 열쇠가통과했나('{"error":"teapot"}').판정 === '못잼');
  다('null = 못잼', 열쇠가통과했나(null).판정 === '못잼');

  /* 상태값 꺼내기 */
  다('state 를 꺼낸다', 상태값꺼내기('https://kauth.kakao.com/oauth/authorize?client_id=a&state=abc123') === 'abc123');
  다('state 가 가운데 있어도 꺼낸다', 상태값꺼내기('https://x/y?state=zz&scope=') === 'zz');
  다('state 없으면 null', 상태값꺼내기('https://x/y?client_id=a') === null);
  다('%xx 를 푼다', 상태값꺼내기('https://x/y?state=a%2Bb') === 'a+b');
  다('빈 것도 null', 상태값꺼내기('') === null);

  /* 들어가는 문 */
  다('카카오 문이 맞다', 제대로된곳으로가나('kakao', 'https://kauth.kakao.com/oauth/authorize?client_id=a&state=b').간다);
  다('구글 문이 맞다', 제대로된곳으로가나('google', 'https://accounts.google.com/o/oauth2/v2/auth?client_id=a&state=b').간다);
  다('네이버 문이 맞다', 제대로된곳으로가나('naver', 'https://nid.naver.com/oauth2.0/authorize?client_id=a&state=b').간다);
  다('엉뚱한 곳이면 아니다', !제대로된곳으로가나('kakao', 'https://example.com/?client_id=a&state=b').간다);
  다('client_id 비면 아니다', !제대로된곳으로가나('kakao', 'https://kauth.kakao.com/oauth/authorize?state=b').간다);
  다('state 없으면 아니다', !제대로된곳으로가나('kakao', 'https://kauth.kakao.com/oauth/authorize?client_id=a').간다);
  다('모르는 제공자면 아니다', !제대로된곳으로가나('facebook', 'https://facebook.com/?client_id=a&state=b').간다);

  /* 셋을 다 본다 — 하나라도 빠지면 그 하나가 조용히 죽는다 */
  다('제공자 셋을 다 잰다', 제공자들.length === 3 && ['google', 'naver', 'kakao'].every((p) => 제공자들.includes(p)));
  다('가짜 코드임이 이름에 드러난다', /bogus|가짜/i.test(가짜코드));

  const 진 = 것들.filter((x) => !x.참);
  console.log(`자가시험 ${것들.length - 진.length}/${것들.length}`);
  for (const x of 진) console.log('   🔴 ' + x.이름);
  process.exit(진.length ? 1 : 0);
}

/* ── 들머리 ───────────────────────────────────────────────────────────── */

if (process.argv.includes('--자가시험')) 자가시험();
else {
  const 잰것 = [];
  for (const p of 제공자들) 잰것.push(await 하나잰다(p));

  console.log('■ KLifeMap 「들어오기」 — 손님이 «끝까지» 들어올 수 있나  (' + new Date().toLocaleString('ko-KR') + ')');
  for (const x of 잰것) {
    const 표 = x.판정 === '통과' ? '✅' : x.판정 === '거절' ? '🔴' : '⬜';
    console.log(`   ${표} ${x.제공자.padEnd(7)} ${x.판정}  — ${x.왜}`);
  }
  const 거절 = 잰것.filter((x) => x.판정 === '거절');
  const 못잼 = 잰것.filter((x) => x.판정 === '못잼');
  if (거절.length) {
    console.log('');
    console.log('   🔴 손님이 «아이디를 넣은 뒤에» 튕긴다. 단추는 그려지므로 지면만 봐서는 안 보인다.');
    for (const x of 거절) console.log('      · ' + x.제공자 + ' — ' + (x.글 || x.왜));
    console.log('   ✅ 고치는 길 — Cloudtype «대시보드»에 그 제공자의 CLIENT_SECRET 을 넣고 배포한다.');
    console.log('      ⛔ klifemap 에 ctype apply 를 치지 않는다 — 환경변수가 통째로 지워진다.');
    process.exit(1);
  }
  if (못잼.length) {
    console.log('');
    console.log('   ⬜ 못 쟀다 — 성하다고도 상했다고도 적지 않는다.');
    for (const x of 못잼) console.log('      · ' + x.제공자 + ' — ' + (x.글 || x.왜));
    process.exit(2);
  }
  console.log('   ✅ 셋 다 열쇠가 통과한다 — 손님이 들어올 수 있다');
  process.exit(0);
}
