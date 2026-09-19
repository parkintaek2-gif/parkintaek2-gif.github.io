/**
 * tests/tiers-rate-limit.test.mjs
 * ─────────────────────────────────────────────────────────────────────────
 * 🔴 [2026-09-19 · 2번] 실측 — src/lib/tiers.mjs 는 「파는 것은 양(量)이다」라고
 * 스스로 적어 둔, 이 API 의 «유일한 유료화 장치»인데 rateCheck()·tierOf() 를
 * 재는 검사가 하나도 없었다(파일 자체 --자가시험은 TIER_CATALOG 모양만 본다).
 * 게다가 `ENFORCE_FROM = '2026-08-17'` — **오늘(2026-09-19)은 이미 그 날짜를
 * 지났다.** 즉 지금 이 순간 라이브에서 실제로 429 를 돌려야 하는 자리인데,
 * 그걸 재는 검사가 없었다. F7 의 다른 세 자리(문서·openapi·JS 클라이언트)와
 * 같은 «새로 만든 것일수록 안 잡힌다» 병이다.
 *
 * ⛔ 이 검사가 지키는 것
 * ⛔ 무료 등급이 한도(분당 60회)를 넘으면 «시행일 이후»엔 실제로 막힌다(allowed:false).
 * ⛔ 시행일 «이전» 시각을 넣으면 한도를 넘어도 막지 않는다(공지 기간 약속).
 * ⛔ pro 등급은 perMinute 이 없어 절대 안 막힌다(RapidAPI 가 따로 건다).
 * ⛔ 분(창)이 바뀌면 셈이 초기화된다 — 다음 분에는 다시 60회를 쓸 수 있다.
 * ⛔ tierOf() — 프록시 시크릿이 안 맞으면(또는 환경변수 자체가 없으면) pro 가 아니다.
 *   기본값은 언제나 «닫힘»이어야 한다(파일 자신의 규칙).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { rateCheck, tierOf, ENFORCE_FROM, LIMITS } from '../src/lib/tiers.mjs';

test('🔴 오늘은 이미 ENFORCE_FROM 을 지났다 — 시행 중이어야 한다', () => {
  const 오늘 = new Date().toLocaleString('sv-SE').slice(0, 10);
  assert.ok(오늘 >= ENFORCE_FROM, `ENFORCE_FROM(${ENFORCE_FROM})이 아직 안 지났으면 이 검사군 전체를 다시 본다`);
});

test('🔴 시행일 이후 — 무료 등급이 분당 한도를 넘으면 실제로 막는다', () => {
  const 시행중시각 = new Date('2026-09-19T03:00:00+09:00'); // ENFORCE_FROM 이후
  const ip = '203.0.113.50';
  let 마지막 = null;
  for (let i = 0; i < LIMITS.free.perMinute + 5; i++) {
    마지막 = rateCheck(ip, 'free', 시행중시각);
  }
  assert.equal(마지막.allowed, false, `분당 ${LIMITS.free.perMinute}회를 넘었는데 막지 않는다`);
  assert.equal(마지막.enforced, true);
  assert.equal(마지막.remaining, 0);
});

test('시행일 이후에도 한도 «안**에서는» 막지 않는다', () => {
  const 시행중시각 = new Date('2026-09-19T03:05:00+09:00');
  const ip = '203.0.113.51';
  const r = rateCheck(ip, 'free', 시행중시각);
  assert.equal(r.allowed, true);
  assert.equal(r.remaining, LIMITS.free.perMinute - 1);
});

test('⛔ 시행일 «이전» 시각이면 한도를 넘어도 안 막는다(공지 기간 약속) — 다만 센다', () => {
  const 시행전시각 = new Date('2026-08-01T03:00:00+09:00');
  const ip = '203.0.113.52';
  let 마지막 = null;
  for (let i = 0; i < LIMITS.free.perMinute + 20; i++) {
    마지막 = rateCheck(ip, 'free', 시행전시각);
  }
  assert.equal(마지막.allowed, true, '시행 전인데 막았다 — 「공지 뒤 시행」 약속을 어긴 것이다');
  assert.equal(마지막.enforced, false);
  assert.equal(마지막.remaining, 0, '넘었으면 남은 것은 0이어야 한다(세는 것 자체는 계속한다)');
});

test('🔴 pro 등급은 perMinute 이 없어 아무리 불러도 안 막힌다', () => {
  const 시행중시각 = new Date('2026-09-19T03:10:00+09:00');
  const ip = '203.0.113.53';
  let 마지막 = null;
  for (let i = 0; i < 500; i++) {
    마지막 = rateCheck(ip, 'pro', 시행중시각);
  }
  assert.equal(마지막.allowed, true);
  assert.equal(마지막.limit, null);
});

test('분(창)이 바뀌면 다시 60회를 쓸 수 있다', () => {
  const ip = '203.0.113.54';
  const 분1 = new Date('2026-09-19T03:20:00+09:00');
  for (let i = 0; i < LIMITS.free.perMinute; i++) rateCheck(ip, 'free', 분1);
  const 다찼다 = rateCheck(ip, 'free', 분1);
  assert.equal(다찼다.allowed, false, '테스트 전제가 틀렸다 — 60회를 다 썼는데 아직 여유가 있다');

  const 분2 = new Date('2026-09-19T03:21:00+09:00'); // 다음 분
  const 새분 = rateCheck(ip, 'free', 분2);
  assert.equal(새분.allowed, true, '분이 바뀌었는데도 막혀 있다 — 고정 창이 안 풀렸다');
  assert.equal(새분.remaining, LIMITS.free.perMinute - 1);
});

test('IP 가 다르면 서로 한도를 나눠 쓰지 않는다', () => {
  const 시각 = new Date('2026-09-19T03:30:00+09:00');
  for (let i = 0; i < LIMITS.free.perMinute; i++) rateCheck('203.0.113.60', 'free', 시각);
  const 딴IP = rateCheck('203.0.113.61', 'free', 시각);
  assert.equal(딴IP.allowed, true, '다른 IP 인데 앞 IP 가 다 쓴 한도를 같이 나눠 썼다');
});

/* ── tierOf ──────────────────────────────────────────────────────────── */

test('🔴 tierOf — RapidAPI 프록시 시크릿이 없으면(환경변수 자체가 없으면) pro 로 안 준다', async () => {
  const 원래 = process.env.RAPIDAPI_PROXY_SECRET;
  delete process.env.RAPIDAPI_PROXY_SECRET;
  try {
    const t = await tierOf({ 'x-rapidapi-proxy-secret': '아무거나' });
    assert.equal(t, 'free', '비밀값이 설정 안 됐는데 pro 를 줬다 — 유료화가 그냥 뚫린다');
  } finally {
    if (원래 !== undefined) process.env.RAPIDAPI_PROXY_SECRET = 원래;
  }
});

test('tierOf — 프록시 시크릿이 있고 정확히 맞으면 pro 다', async () => {
  const 원래 = process.env.RAPIDAPI_PROXY_SECRET;
  process.env.RAPIDAPI_PROXY_SECRET = '테스트비밀값';
  try {
    const t = await tierOf({ 'x-rapidapi-proxy-secret': '테스트비밀값' });
    assert.equal(t, 'pro');
  } finally {
    if (원래 === undefined) delete process.env.RAPIDAPI_PROXY_SECRET;
    else process.env.RAPIDAPI_PROXY_SECRET = 원래;
  }
});

test('🔴 tierOf — 프록시 시크릿이 «틀리면» pro 로 안 준다', async () => {
  const 원래 = process.env.RAPIDAPI_PROXY_SECRET;
  process.env.RAPIDAPI_PROXY_SECRET = '진짜비밀값';
  try {
    const t = await tierOf({ 'x-rapidapi-proxy-secret': '아무말이나' });
    assert.equal(t, 'free', '틀린 값을 줬는데 pro 로 통과시켰다');
  } finally {
    if (원래 === undefined) delete process.env.RAPIDAPI_PROXY_SECRET;
    else process.env.RAPIDAPI_PROXY_SECRET = 원래;
  }
});

test('tierOf — 헤더가 아예 없으면 free 다(죽지 않는다)', async () => {
  const t = await tierOf(undefined);
  assert.equal(t, 'free');
});
