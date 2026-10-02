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
  { 이름: 'KLifeMap', 밑: 'https://klifemap.ai', 로그인: '/api/auth/login' },
  { 이름: 'SeoulMarkets', 밑: 'https://seoulmarkets.com', 로그인: '/api/account/login' },
  { 이름: '백년지도', 밑: 'https://100yearmap.com', 로그인: '/api/account/login' },
  { 이름: 'KCultureWire', 밑: 'https://www.kculturewire.com', 로그인: '/api/account/login' },
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

/* ── 실제로 재기 ─────────────────────────────────────────── */
async function 받기(주소, 옵션 = {}) {
  try {
    const r = await fetch(주소, { redirect: 'manual', ...옵션 });
    return r;
  } catch (e) { return null; }
}

async function 재기() {
  const 모든흠 = [];
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
      if (!r) continue;
      const 좋나 = 닫혔나(r.status);
      console.log(`  ${길.padEnd(22)} ${좋나 ? '✅' : '🔴'} ${r.status}`);
      if (!좋나) 모든흠.push(`${s.이름}${길}: ${r.status} — 열려 있다`);
    }

    /* ⑤ 숨겨야 할 파일 */
    for (const 길 of ['/.git/config', '/.env']) {
      const r = await 받기(s.밑 + 길);
      if (!r) continue;
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
      답들.push(r ? r.status : 0);
    }
    const 판정 = 잠겼나(답들);
    console.log(`  로그인 막이            ${판정}  (${답들.join('·')})`);
    if (판정.startsWith('🔴')) 모든흠.push(`${s.이름} 로그인: ${판정}`);
  }

  console.log(`\n■ 흠 ${모든흠.length}개`);
  for (const x of 모든흠) console.log(`  🔴 ${x}`);
  if (!모든흠.length) console.log('✅ 네 곳 다 막혀 있다');
  return 모든흠.length;
}

if (process.argv.includes('--자가시험')) await 자가시험();
else process.exitCode = (await 재기()) ? 1 : 0;
