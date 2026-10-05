#!/usr/bin/env node
/**
 * check-네사이트-보안-라이브.mjs — **어제 막은 것이 «라이브에서» 실제로 막고 있나.**
 *
 * 🔴🔴 사장님 (2026-10-02) — 「**어제 체크한 보안상태는 모든 사이트가 괜찮나?**」
 *   ⛔ 어제 쓴 문서를 근거로 답하지 않는다. 고친 것과 «나간 것»은 다르다.
 *     (2026-08-09 에 「배포 10회」가 전부 push 였고 라이브는 2/10 이었다.)
 *
 * ── 무엇을 재나 ────────────────────────────────────────────────
 * ①  손님 정보 창구가 열려 있나   /api/db/customers · /api/admin/* 가 401/403 인가
 * ②  로그인 무작위 대입 막이      «없는 계정»으로 여섯 번 틀려 잠기는가
 * ③  보안 머리줄                  HSTS · X-Content-Type-Options · X-Frame-Options · CSP
 * ④  관리자 열쇠가 새나           지면 글에 키 이름이 값과 함께 박혀 있지 않나
 * ⑤  디렉터리가 열려 있나         /.git/config · /.env 가 200 으로 나오지 않나
 *
 * ⛔ 있는 계정으로 시도하지 않는다 — 손님 계정이 잠긴다.
 * ⛔ 비밀번호를 지어내 맞히려 들지 않는다. «막이가 도는가»만 본다.
 * ⛔ 메일이 실제로 나가는 창구는 두드리지 않는다.
 * ⛔ 받은 값(토큰·열쇠)을 화면에 찍지 않는다 — 있나 없나만 적는다.
 *
 * 쓰는 법   node scripts/check-네사이트-보안-라이브.mjs [--자가시험]
 */

export const 사이트 = [
  /* 「목록」은 손님 누구나 여는 «공개» 목록 창구다 — 여기로만 대량 조회를 잰다 */
  /* ⚠ KLifeMap 의 반복 호출은 «없는 길»로 잰다.
     /api/reviews 같은 공개·읽기전용 창구는 **일부러** 막이에서 빼 두었다
     (server.js 의 PUBLIC_ALWAYS — 홈 한 장이 API 를 여섯 개 부르므로 막으면 손님이 먼저 막힌다).
     ⇒ 그 창구로 재면 영원히 빨간불이 난다. 없는 길은 404 를 내면서도 막이를 거치므로
       «막이가 도는가»만 깨끗하게 잴 수 있다. 부작용도 없다. */
  { 이름: 'KLifeMap', 밑: 'https://klifemap.ai', 로그인: '/api/auth/login', 목록: '/api/reviews', 반복: '/api/__ratecheck' },
  { 이름: 'SeoulMarkets', 밑: 'https://seoulmarkets.com', 로그인: '/api/account/login', 반복: '/api/comments?slug=check-rate-limit' },
  { 이름: '백년지도', 밑: 'https://100yearmap.com', 로그인: '/api/account/login', 반복: '/api/comments?slug=check-rate-limit' },
  { 이름: 'KCultureWire', 밑: 'https://www.kculturewire.com', 로그인: '/api/account/login', 반복: '/api/comments?slug=check-rate-limit' },
];

/** 그 창구가 «닫혀 있나». 401·403·404 면 닫힌 것이다 */
export function 닫혔나(상태) {
  return 상태 === 401 || 상태 === 403 || 상태 === 404 || 상태 === 405;
}

/** 로그인 답들을 보고 «잠김 막이가 도는가»를 가른다 */
export function 잠겼나(답들) {
  /* 뒤로 갈수록 429(너무 잦음)나 401 이 이어지면 막이가 있는 것으로 본다.
     ⚠ 200 이 섞이면 «없는 계정인데 들어가진다»는 뜻이라 그 자체가 흠이다 */
  if (답들.some((x) => x === 200)) return '🔴 없는 계정으로 200 이 났다';
  if (답들.some((x) => x === 429)) return '✅ 막는다(429)';
  const 뒤 = 답들.slice(-2);
  if (뒤.every((x) => x === 401 || x === 403)) return '⚠ 401 만 돌아온다 — 잠겼는지 밖에서는 못 가른다';
  return `⚠ 섞여 있다 (${답들.join('·')})`;
}

/** 한 번에 내주는 건수가 너무 많지 않나. 1000건을 넘겨 주면 대량 조회가 열린 것이다 */
export function 대량인가(건수) {
  if (건수 == null) return '⚠ 못 쟀다';
  if (건수 > 1000) return `🔴 한 번에 ${건수}건을 내준다`;
  if (건수 > 200) return `⚠ 한 번에 ${건수}건 — 줄이는 편이 낫다`;
  return `✅ ${건수}건으로 끊는다`;
}

/** 잇달아 두드렸을 때 막이가 도나 */
export function 반복막나(답들) {
  if (!답들.length) return '⚠ 못 쟀다';
  if (답들.some((x) => x === 429)) return '✅ 막는다(429)';
  if (답들.every((x) => x === 0)) return '⚠ 못 쟀다 — 응답이 없다';
  return `🔴 ${답들.length}번을 잇달아 두드려도 안 막는다`;
}

/**
 * 지면 글에 열쇠가 값째로 박혀 있나.
 * ⛔ 값을 돌려주지 않는다 — 몇 개인지만 센다.
 */
export function 열쇠샘(글) {
  const 꼴 = /(api[_-]?key|secret|token|password|authorization)\s*[:=]\s*["'`]([^"'`\s]{16,})["'`]/gi;
  const 걸린것 = [];
  let m;
  while ((m = 꼴.exec(String(글 ?? '')))) {
    /* 자리표(placeholder)는 세지 않는다 — __SAJU_API_KEY__ 처럼 배포 때 채우는 자리다 */
    if (/^__.*__$/.test(m[2]) || /^(your|example|changeme|xxx)/i.test(m[2])) continue;
    걸린것.push(m[1].toLowerCase());
  }
  return 걸린것;
}

export function 머리줄흠(머리) {
  const 흠 = [];
  const g = (k) => 머리.get(k) || '';
  if (!/max-age=\d+/.test(g('strict-transport-security'))) 흠.push('HSTS 없음');
  if (!/nosniff/i.test(g('x-content-type-options'))) 흠.push('X-Content-Type-Options 없음');
  if (!/(DENY|SAMEORIGIN)/i.test(g('x-frame-options')) && !/frame-ancestors/i.test(g('content-security-policy'))) {
    흠.push('클릭재킹 막이 없음(X-Frame-Options·frame-ancestors)');
  }
  if (!g('content-security-policy')) 흠.push('CSP 없음');
  return 흠;
}

/* ── 자가시험 ────────────────────────────────────────────── */
async function 자가시험() {
  const { default: test } = await import('node:test');
  const A = (await import('node:assert/strict')).default;

  /* 🔴🔴 [2026-10-06 · 5번] 못 받은 문을 건너뛰고 「다 막혀 있다」를 찍던 것을 못 박는다.
     ⛔ 못 두드려 본 문을 「닫혀 있다」고 말하지 않는다. 빨강보다 나쁜 거짓 초록이다. */
  test('🔴 못 잰 칸이 하나라도 있으면 「다 막혀 있다」고 말하지 않는다', () => {
    A.equal(끝판정(0, 0, 16).초록, true, "다 쟀고 흠도 없는데 초록이 아니다");
    A.equal(끝판정(0, 1, 16).초록, false, "못 잰 칸이 있는데 초록이라 했다");
    A.equal(끝판정(1, 0, 16).초록, false, "흠이 있는데 초록이라 했다");
  });

  test('⚠ 한두 칸 못 잰 것으로는 빨간불을 내지 않는다 — 늘 조금씩 끊긴다', () => {
    A.equal(끝판정(0, 2, 16).못잼많다, false);
    A.equal(끝판정(0, 2, 16).나갈값, 0, "한두 칸 못 쟀다고 종료값을 올렸다");
  });

  test('🔴 못 잰 칸이 잰 칸의 1/4을 넘으면 그 자체가 빨간불이다', () => {
    A.equal(끝판정(0, 20, 16).못잼많다, true);
    A.ok(끝판정(0, 20, 16).나갈값 > 0, "거짓 초록으로 끝났다");
  });

  test('⛔ 잰 칸이 0이어도 안 터진다 — 아무것도 못 쟀으면 초록이 아니다', () => {
    A.equal(끝판정(0, 0, 0).초록, true);
    A.equal(끝판정(0, 5, 0).초록, false);
    A.equal(끝판정(0, 5, 0).못잼많다, true);
  });
  test('닫혔나 — 401·403·404·405 는 닫힌 것', () => {
    for (const s of [401, 403, 404, 405]) A.equal(닫혔나(s), true, `${s}`);
    for (const s of [200, 302, 500]) A.equal(닫혔나(s), false, `${s}`);
  });

  test('🔴 잠겼나 — 없는 계정으로 200 이 나면 흠이다', () => {
    A.match(잠겼나([401, 401, 200]), /🔴/);
  });

  test('잠겼나 — 429 가 나오면 막는 것', () => {
    A.match(잠겼나([401, 401, 401, 429]), /✅/);
  });

  test('잠겼나 — 401 만 이어지면 «못 가른다»고 적는다', () => {
    A.match(잠겼나([401, 401, 401, 401]), /⚠/);
  });

  test('머리줄흠 — 다 있으면 흠이 없다', () => {
    const h = new Map([
      ['strict-transport-security', 'max-age=31536000'],
      ['x-content-type-options', 'nosniff'],
      ['x-frame-options', 'SAMEORIGIN'],
      ['content-security-policy', "default-src 'self'"],
    ]);
    A.deepEqual(머리줄흠(h), []);
  });

  test('대량 조회를 가른다', () => {
    A.match(대량인가(5000), /🔴/);
    A.match(대량인가(500), /⚠/);
    A.match(대량인가(50), /✅/);
    A.match(대량인가(null), /못 쟀다/);
  });

  test('반복 호출 막이를 가른다', () => {
    A.match(반복막나([200, 200, 429]), /✅/);
    A.match(반복막나([200, 200, 200]), /🔴/);
    A.match(반복막나([0, 0, 0]), /못 쟀다/);
    A.match(반복막나([]), /못 쟀다/);
  });

  test('열쇠가 값째로 박힌 것을 찾는다', () => {
    A.deepEqual(열쇠샘('const apiKey = "sk-live-0123456789abcdef"'), ['apikey']);
    A.deepEqual(열쇠샘('window.SAJU_API_KEY = "__SAJU_API_KEY__";'), []);
    A.deepEqual(열쇠샘('api_key = "short"'), []);
    A.deepEqual(열쇠샘('그냥 글'), []);
  });

  test('🔴 머리줄흠 — 하나도 없으면 넷을 다 잡는다', () => {
    A.equal(머리줄흠(new Map()).length, 4);
  });

  test('머리줄흠 — CSP 의 frame-ancestors 도 클릭재킹 막이로 인정한다', () => {
    const h = new Map([
      ['strict-transport-security', 'max-age=1'],
      ['x-content-type-options', 'nosniff'],
      ['content-security-policy', "frame-ancestors 'self'"],
    ]);
    A.deepEqual(머리줄흠(h), []);
  });
}

/* ⚠ 다 재고 난 뒤 소켓이 끊기며 뒤늦은 거절이 올라와 결과 뒤에 긴 오류가 찍혔다.
   결과는 이미 찍힌 뒤라 판정은 멀쩡하지만, 그 오류가 다음 사람에게 「검사가 깨졌다」로 보인다.
   ⛔ 삼키지는 않는다 — 한 줄로 적어 두고 종료 코드는 그대로 둔다. */
process.on('unhandledRejection', (e) => {
  console.error('⚠ 늦게 온 거절(판정에는 영향 없음):', String(e?.message ?? e).slice(0, 120));
});

/**
 * 🔴🔴 [2026-10-03] **이 검사가 며칠째 한 줄도 못 냈다.**
 *
 *   `SocketError: other side closed (UND_ERR_SOCKET)` 가 떠서 통째로 죽었다.
 *   바로 위의 unhandledRejection 으로는 안 잡혔다 — 그것은 «거절»이 아니라
 *   HTTP/2 스트림이 던지는 **uncaughtException** 이기 때문이다.
 *
 * ⛔ 「검사가 안 돈다」는 「흠이 없다」가 아니다. 보안 점검이 조용히 쉬고 있었다.
 *   사장님: 「**보안 철저하게 해. 우리 서비스들**」·「**다른 ai에게 뚫리지 마라**」
 *
 * ⚠ 네트워크가 끊긴 것만 넘긴다. 그 밖의 예외는 «그대로 터뜨린다» —
 *   진짜 결함을 이 그물로 덮으면 이 자는 쓸모가 없어진다.
 */
export const 네트워크탈 = new Set([
  'UND_ERR_SOCKET', 'ECONNRESET', 'ECONNREFUSED', 'EPIPE', 'ETIMEDOUT',
  'ERR_HTTP2_STREAM_ERROR', 'ERR_HTTP2_STREAM_CANCEL', 'ENOTFOUND', 'EAI_AGAIN',
]);
export function 넘길탈인가(e) {
  const 코드 = e?.code ?? e?.cause?.code ?? '';
  if (네트워크탈.has(코드)) return true;
  return /other side closed|socket hang up|terminated|aborted/i.test(String(e?.message ?? ''));
}
process.on('uncaughtException', (e) => {
  if (!넘길탈인가(e)) throw e;
  console.error('⚠ 연결이 끊겼다(그 창구만 「못 쟀다」로 적는다):',
    String(e?.code ?? e?.message ?? e).slice(0, 80));
});

/* ── 실제로 재기 ─────────────────────────────────────────── */
async function 받기(주소, 옵션 = {}) {
  try {
    /* ⚠ 제한시간이 없으면 응답이 안 오는 창구 하나가 검사 전체를 세운다(2026-10-03 실제로 멈췄다) */
    const r = await fetch(주소, { redirect: 'manual', signal: AbortSignal.timeout(12000), ...옵션 });
    return r;
  } catch (e) { return null; }
}

/**
 * 몸통을 안 읽을 응답은 **버린다고 말해 준다.**
 *
 * 🔴 [2026-10-03] 안 읽고 버려 둔 몸통이 쌓이자 HTTP/2 스트림이 뒤늦게
 *   `other side closed` 를 던져 검사가 통째로 죽었다. 상태만 볼 자리에서는 여기를 부른다.
 */
async function 몸버리기(r) {
  try { await r?.body?.cancel(); } catch { /* 이미 닫혔으면 그만이다 */ }
}

/**
 * 끝판정 — **「다 막혀 있다」를 언제 말해도 되나.**
 *
 * 🔴 [2026-10-06 · 5번] 못 받은 문을 `continue` 로 건너뛰고 「✅ 네 곳 다 막혀 있다」를 찍고 있었다.
 *   /admin 이 한 번 안 닿으면 **두드려 보지도 않고 초록**이 났다 — 빨강보다 나쁜 거짓 초록이다.
 * ⛔ 못 두드려 본 문을 「닫혀 있다」고 말하지 않는다.
 * ⚠ 그렇다고 못잼을 다 빨강으로 치지도 않는다 — 한두 칸은 늘 끊긴다. 1/4을 선으로 둔다.
 */
export function 끝판정(흠수, 못잼수, 잰칸) {
  const 못잼많다 = 못잼수 > Math.max(2, 잰칸 / 4);
  return {
    초록: 흠수 === 0 && 못잼수 === 0,     /* 둘 다 0일 때만 「다 막혀 있다」 */
    못잼많다,
    나갈값: 흠수 + (못잼많다 ? 못잼수 : 0),
  };
}

async function 재기() {
  const 모든흠 = [];
  /* 🔴🔴 [2026-10-06 07:4x · 5번] **못 잰 것을 「막혀 있다」로 읽고 있었다.**
     못 받으면 `if (!r) continue;` 로 «조용히 건너뛰고», 끝에서 「✅ 네 곳 다 막혀 있다」를 찍었다.
     ⇒ /admin 이 한 번 안 닿으면 **두드려 보지도 않고 초록**이 난다.
     ⛔ 빨강보다 나쁜 «거짓 초록»이다. 자물쇠가 있는데 없는 것과 같다.
     ⚠ 같은 날 다국어 색인 자에서는 거꾸로 틀려 있었다 — 못 받은 것을 흠으로 셌다.
       두 자가 반대로 틀렸고, 뿌리는 하나다: **「못 쟀다」를 따로 세지 않았다.** */
  const 모든못잼 = [];
  let 잰칸 = 0;
  for (const s of 사이트) {
    console.log(`\n■ ${s.이름}  ${s.밑}`);

    /* ③ 머리줄 */
    const 첫 = await 받기(s.밑);
    if (!첫) { console.log('  🔴 열리지 않는다'); 모든흠.push(`${s.이름}: 안 열린다`); continue; }
    const 흠 = 머리줄흠(첫.headers);
    console.log(`  머리줄  ${흠.length ? `🔴 ${흠.join(' · ')}` : '✅ 넷 다 있다'}`);
    if (흠.length) 모든흠.push(`${s.이름}: ${흠.join(' · ')}`);

    /* ① 손님 정보 창구 */
    for (const 길 of ['/api/db/customers', '/api/admin/orders', '/api/admin/users']) {
      const r = await 받기(s.밑 + 길);
      if (!r) { 모든못잼.push(`${s.이름}${길}: 못 받았다`); continue; }
      잰칸 += 1;
      await 몸버리기(r);
      const 좋나 = 닫혔나(r.status);
      console.log(`  ${길.padEnd(22)} ${좋나 ? '✅' : '🔴'} ${r.status}`);
      if (!좋나) 모든흠.push(`${s.이름}${길}: ${r.status} — 열려 있다`);
    }

    /* ⑤ 숨겨야 할 파일 */
    for (const 길 of ['/.git/config', '/.env']) {
      const r = await 받기(s.밑 + 길);
      if (!r) { 모든못잼.push(`${s.이름}${길}: 못 받았다`); continue; }
      잰칸 += 1;
      await 몸버리기(r);
      const 좋나 = r.status !== 200;
      console.log(`  ${길.padEnd(22)} ${좋나 ? '✅' : '🔴'} ${r.status}`);
      if (!좋나) 모든흠.push(`${s.이름}${길}: 200 — 통째로 보인다`);
    }

    /* ② 로그인 막이 — ⛔ 없는 계정으로만 두드린다 */
    const 없는계정 = `nobody-${Date.now()}@example.invalid`;
    const 답들 = [];
    for (let i = 0; i < 6; i += 1) {
      const r = await 받기(s.밑 + s.로그인, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 없는계정, password: `아무거나-${i}` }),
      });
      await 몸버리기(r);
      답들.push(r ? r.status : 0);
    }
    const 판정 = 잠겼나(답들);
    console.log(`  로그인 막이            ${판정}  (${답들.join('·')})`);
    if (판정.startsWith('🔴')) 모든흠.push(`${s.이름} 로그인: ${판정}`);

    /* ⑧ 관리자 화면이 인증 없이 열리나 */
    for (const 길 of ['/admin', '/admin/', '/dashboard', '/api/admin']) {
      const r = await 받기(s.밑 + 길);
      if (!r) { 모든못잼.push(`${s.이름}${길}: 못 받았다`); continue; }
      잰칸 += 1;
      /* 200 이어도 로그인 화면이면 닫힌 것이다 — 글을 보고 가른다 */
      let 로그인화면 = false;
      if (r.status === 200) {
        const 글 = await r.text().catch(() => '');
        /* 🔴 [2026-10-03] 앞 4000자만 보다가 /dashboard 를 「열려 있다」로 잘못 짚었다 —
           로그인 안내가 화면 한참 아래에 있었다. 글 전체를 본다. */
        로그인화면 = /로그인 하러|로그인 후|sign in|log in|로그인이 필요/i.test(글);
      }
      const 좋나 = 닫혔나(r.status) || r.status === 302 || r.status === 301 || 로그인화면;
      console.log(`  ${길.padEnd(22)} ${좋나 ? '✅' : '🔴'} ${r.status}${로그인화면 ? ' (로그인 화면)' : ''}`);
      if (!좋나) 모든흠.push(`${s.이름}${길}: ${r.status} — 인증 없이 열린다`);
    }

    /* ⑨ 첫 화면 글에 열쇠가 값째로 박혀 있나 */
    const 첫글 = await 첫.clone().text().catch(() => '');
    const 샌것 = 열쇠샘(첫글);
    console.log(`  연계 열쇠              ${샌것.length ? `🔴 ${샌것.length}개` : '✅ 안 샌다'}`);
    if (샌것.length) 모든흠.push(`${s.이름}: 첫 화면에 열쇠 ${샌것.length}개가 값째로 박혔다`);

    /* ⑥ 대량 조회 — 공개 목록 창구에 큰 limit 를 넣어 본다 */
    if (s.목록) {
      const r = await 받기(s.밑 + s.목록 + (s.목록.includes('?') ? '&' : '?') + 'limit=100000');
      let 건수 = null;
      if (r && r.status === 200) {
        try {
          const j = await r.json();
          const 몸 = Array.isArray(j) ? j : (j.items || j.rows || j.data || j.list);
          if (Array.isArray(몸)) 건수 = 몸.length;
        } catch { /* JSON 이 아니면 못 쟀다 */ }
      }
      console.log(`  대량 조회              ${대량인가(건수)}`);
      if (String(대량인가(건수)).startsWith('🔴')) 모든흠.push(`${s.이름}${s.목록}: 대량 조회가 열렸다`);
    }

    /* ⑦ 반복 호출 — 🔴 [2026-10-03] 여기서 «지면»을 두드리고 있었다. 틀린 자다.
       우리는 지면에 막이를 «일부러» 안 건다 — 한 화면이 그림·스크립트를 수십 개 받아 가므로
       막으면 손님과 검색엔진이 먼저 막힌다. 그런데도 검사가 울어 가짜 빨간불이 났다.
       ⇒ 막이를 건 «API 창구»를 두드린다. 그리고 지면은 «안 막히는지»를 따로 본다.
       ⛔ 돈·메일 창구는 건드리지 않는다. 읽기만 하는 창구로 잰다. */
    if (s.반복) {
      const 잇달아 = [];
      for (let i = 0; i < 80; i += 1) {
        const r = await 받기(s.밑 + s.반복 + (s.반복.includes('?') ? '&' : '?') + 'n=' + Date.now() + '-' + i);
        잇달아.push(r ? r.status : 0);
        if (r && r.status === 429) break;
      }
      const 반복판정 = 반복막나(잇달아);
      console.log(`  API 반복 호출 막이     ${반복판정}`);
      if (반복판정.startsWith('🔴')) 모든흠.push(`${s.이름}${s.반복}: ${반복판정}`);
    } else {
      console.log('  API 반복 호출 막이     ⚠ 잴 창구를 안 적었다');
    }

    /* ⑦-2 지면은 «안 막혀야» 한다 — 막히면 손님과 검색엔진이 먼저 막힌다 */
    const 지면답 = [];
    for (let i = 0; i < 40; i += 1) {
      const r = await 받기(s.밑 + '/?t=' + Date.now() + '-' + i);
      지면답.push(r ? r.status : 0);
      if (r && r.status === 429) break;
    }
    const 지면막혔나 = 지면답.includes(429);
    console.log(`  지면은 안 막나         ${지면막혔나 ? `🔴 ${지면답.length}번째에 막혔다` : `✅ ${지면답.length}번을 두드려도 안 막는다`}`);
    if (지면막혔나) 모든흠.push(`${s.이름}: 지면이 막힌다 — 손님과 검색엔진이 먼저 막힌다`);
  }

  console.log(`\n■ 흠 ${모든흠.length}개`
    + (모든못잼.length ? ` · ⚠ 못 잰 칸 ${모든못잼.length}개 (잰 칸 ${잰칸}개)` : ''));
  for (const x of 모든흠) console.log(`  🔴 ${x}`);
  for (const x of 모든못잼) console.log(`  ⚠ 못 쟀다 — ${x}`);

  /* ⛔ 「다 막혀 있다」는 **흠이 0이고 못잼도 0일 때만** 말한다.
     못 두드려 본 문을 「닫혀 있다」고 말하지 않는다. */
  const 판 = 끝판정(모든흠.length, 모든못잼.length, 잰칸);
  if (판.초록) console.log('✅ 네 곳 다 막혀 있다');
  else if (!모든흠.length) console.log('⚠ 흠은 없지만 «못 두드려 본 문»이 있다 — 「다 막혀 있다」고 말하지 않는다');
  if (판.못잼많다) console.log('🔴 못 잰 칸이 너무 많다 — 검사가 돌았다고 말할 수 없다');
  return 판.나갈값;
}

if (process.argv.includes('--자가시험')) await 자가시험();
else process.exitCode = (await 재기()) ? 1 : 0;
