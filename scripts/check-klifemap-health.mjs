#!/usr/bin/env node
/**
 * check-klifemap-health.mjs — **매출이 나는 서비스가 성한지 밖에서 잰다.**
 *
 *   node scripts/check-klifemap-health.mjs
 *   node scripts/check-klifemap-health.mjs --자가시험
 *
 * ── 🔴 왜 만드나 (2026-09-11 18:2x · 5번) ────────────────────────────────
 *
 * 사장님이 물으셨다 — 「케이라이프맵 로그인에 구글로그인 네이버로그인 등이 없어짐.
 *   **왜 자꾸 뭘 건드리면 자꾸 없어지나?**」
 *
 * 재 보니 버튼은 «보이는 증상 하나»였고, 실제로는 콘솔 환경변수가 통째로 사라져 있었다.
 *
 * ```
 *   klifemap-app 다시 뜬 시각   2026-09-11 16:28
 *   컨테이너 로그              ERROR "bucket required for s3 replica"
 *   /api/health               status degraded · oauth/AI/메일/관리자 전부 not_configured
 * ```
 *
 * 🔴 그 서비스의 DB 는 볼륨 없이 컨테이너 안에 있고, 오래 버티게 해 주던 것은
 *   R2 복제 하나뿐이었다. 그것이 끊긴 채로 **두 시간 넘게 아무도 몰랐다.**
 *   알아차린 것은 사장님이 «로그인 화면을 눈으로 보시고» 물으셨기 때문이다.
 *   ⛔ 사장님이 먼저 발견하시는 구조는 그것 자체가 결함이다.
 *
 * ── ⛔ 이 자가 지키는 것 ─────────────────────────────────────────────────
 * ⛔ 열쇠 «값»을 읽지 않는다. /api/health 는 길이와 켜짐/꺼짐만 내준다. 그것만 본다
 * ⛔ 못 닿은 것을 「고장났다」로 만들지 않는다 — 「못 쟀다」로 적는다
 * ✅ 배포한 유닛이 «배포 뒤에» 이것을 돌린다. 그리고 매시 소통에서도 돈다
 */

const 주소 = 'https://klifemap.ai/api/health';

/* ── 판정만 떼어 낸다 (밖에 안 나가고 시험할 수 있게) ─────────────────── */

/* 🔴 [2026-09-11 23:4x · 5번] 세 등급으로 가른다 — «상함»과 «기다림»은 다른 것이다.
 *
 * 처음엔 선택 칸이 하나라도 꺼져 있으면 전부 「상했다」로 빨간불을 켰다. 그런데 oauth 는
 * 사장님이 구글·네이버·카카오 콘솔에서 열쇠를 내주셔야 켜지는 칸이라 **계속 빨갛다.**
 *
 * ⛔ 늘 빨간 자리는 결국 안 읽힌다. 그리고 안 읽히는 순간 그 «아래»에 있는 진짜 빨간불까지
 *   같이 건너뛰게 된다 — Riot 을 매일 확인 목록에 남겨 뒀다가 겪은 것과 똑같은 병이다.
 *
 * 그래서 「자료가 사라지거나 손님이 못 쓰는 것」과 「열쇠가 와야 켜지는 것」을 가른다.
 *   상함    DB · 엔진 · 환경변수가 통째로 빔 · aiReports(판정 리포트가 상품이다)
 *   기다림  oauth · email · initialAdmin — 서비스는 돌고, 열쇠가 오면 켜진다
 * ⛔ 기다림을 «없는 것»으로 만들지 않는다. 화면에 ⏳ 로 남겨 무엇을 기다리는지 적는다. */
/* 🔴🔴 [2026-09-12 07:5x · 5번] **위 판정이 틀렸다. 몇 시간 만에 내가 잡혔다.**
 *
 * 아침에 나는 oauth·email 이 꺼진 것을 「기다림 — 서비스는 성하다」로 적었다.
 * 사장님이 그 자리에서 짚으셨다 —
 *   「케이라이프맵 유료서비스가 거의 모두 닫힌 거나 진배없다...아마추어도 해선 안 될 실수이다」
 *
 * 재 보니 사장님 말씀이 맞았다. 창구에 직접 물었다 —
 *   /api/auth/providers        []                          손님이 «들어오지 못한다»
 *   /api/health  email         not_configured              가입확인·영수증이 «안 나간다»
 *   /api/billing/toss/status   clientKey "test_ck_…"       돈이 «안 들어온다»
 *
 * ⛔ 내가 본 것은 «서버가 살아 있나»였고, 재야 했던 것은 «손님이 살 수 있나»였다.
 *   DB 가 ok 고 엔진이 ok 라도 손님이 문 앞에서 막히면 그 가게는 닫힌 것이다.
 *
 * ⇒ 그래서 「기다림」 칸을 비운다. 로그인과 메일은 «상함»이다.
 *   기다림은 정말로 «손님 길에 닿지 않는 것»만 들어간다(관리자 초기계정 따위). */
const 기다려도되는칸 = new Set(['initialAdmin']);

/**
 * health 몸통을 보고 무엇이 잘못됐는지 갈라 낸다.
 * @returns {{판정:'성함'|'기다림'|'상함'|'못쟀다', 잃은것:string[], 기다리는것:string[], 말:string}}
 */
export function 살핀다(몸통) {
  if (몸통 === null || 몸통 === undefined) {
    return { 판정: '못쟀다', 잃은것: [], 기다리는것: [], 말: '답을 못 받았다' };
  }
  const 선택 = 몸통.checks?.optional ?? {};
  const 잃은것 = [];
  const 기다리는것 = [];

  /* 🔴 R2 가 첫째다 — 이것이 끊기면 «자료가 사라질 수 있다». 나머지는 기능이 꺼질 뿐이다.
     ⚠ health 는 R2 를 따로 말해 주지 않는다. 그래서 다른 열쇠가 전부 비었으면
       «환경변수가 통째로 날아간 것»으로 보고 R2 도 의심한다 — 2026-09-11 에 실제로 그랬다 */
  const 열쇠칸 = ['aiReports', 'email', 'oauth'];
  const 있는칸 = 열쇠칸.filter((k) => k in 선택);
  const 꺼진칸 = 있는칸.filter((k) => 선택[k] !== 'configured');
  if (있는칸.length > 0 && 꺼진칸.length === 있는칸.length) {
    잃은것.push('환경변수가 통째로 비었다 — R2 복제도 끊겼을 수 있다');
  } else {
    for (const k of 꺼진칸) {
      if (기다려도되는칸.has(k)) 기다리는것.push(k + ' — 열쇠가 와야 켜진다');
      else 잃은것.push(k + ' 가 꺼져 있다');
    }
  }
  /* 선택 칸 목록에 없더라도 초기 관리자처럼 «기다리는» 칸은 따로 세어 둔다 */
  for (const k of Object.keys(선택)) {
    if (!열쇠칸.includes(k) && 기다려도되는칸.has(k) && 선택[k] !== 'configured') {
      기다리는것.push(k + ' — 열쇠가 와야 켜진다');
    }
  }

  if (몸통.checks?.database?.status && 몸통.checks.database.status !== 'ok') {
    잃은것.unshift('DB 가 ' + 몸통.checks.database.status);
  }
  if (몸통.checks?.engine?.status && 몸통.checks.engine.status !== 'ok') {
    잃은것.unshift('엔진이 ' + 몸통.checks.engine.status);
  }

  if (잃은것.length) return { 판정: '상함', 잃은것, 기다리는것, 말: 몸통.status ?? '' };
  if (기다리는것.length) return { 판정: '기다림', 잃은것: [], 기다리는것, 말: 몸통.status ?? '' };
  return { 판정: '성함', 잃은것: [], 기다리는것: [], 말: 몸통.status ?? '' };
}

/**
 * 🔴 **돈길을 잰다 — 「손님이 살 수 있나」.**
 *
 * 이것이 없어서 2026-09-12 아침에 「성하다」를 냈다. 서버가 사는 것과 장사가 되는 것은 다르다.
 * ⛔ 「enabled: true」를 「판다」로 읽지 않는다 — 토스는 «테스트 키»로도 enabled 가 참이다.
 *   test_ 로 시작하는 열쇠는 돈이 안 들어온다. 그것이 닫힌 것과 같다.
 *
 * @returns {{연다:boolean, 막힌것:string[]}}
 */
export function 돈길살핀다({ 토스, 페이팔, 로그인 } = {}) {
  const 막힌것 = [];

  if (!토스 || 토스.ok !== true || !토스.enabled) {
    막힌것.push('토스 결제가 꺼져 있다 — 원화로 받을 길이 없다');
  } else if (토스.live === false || String(토스.clientKey ?? '').startsWith('test_')) {
    막힌것.push('토스가 «테스트 열쇠»로 돌고 있다 — 손님이 눌러도 돈이 들어오지 않는다');
  }

  /* 페이팔은 해외 손님 몫이다. 없으면 «해외가 닫힌 것»이지 국내까지 닫힌 것은 아니다 */
  if (!페이팔 || 페이팔.enabled !== true) 막힌것.push('페이팔이 꺼져 있다 — 해외 손님은 못 산다');

  const 것 = Array.isArray(로그인?.providers) ? 로그인.providers : [];
  if (것.length === 0) 막힌것.push('소셜 로그인이 하나도 없다 — 손님이 문 앞에서 막힌다');

  return { 연다: 막힌것.length === 0, 막힌것 };
}

/**
 * 컨테이너가 방금 다시 떴나 — 다시 뜬 «직후»가 자료를 잃는 자리다.
 * ⛔ 「오래 떠 있다」를 안전으로 읽지 않는다. 위험한 것은 «다음에 다시 뜰 때»다
 */
export function 갓떴나(uptimeSec, 문턱 = 900) {
  if (!Number.isFinite(uptimeSec) || uptimeSec < 0) return null;   /* 못 쟀다 */
  return uptimeSec < 문턱;
}

/* ── 자가시험 ───────────────────────────────────────────────────────── */

function 자가시험() {
  let 통과 = 0; const 깨짐 = [];
  const 검 = (이름, 나옴, 바람) => {
    const 같다 = JSON.stringify(나옴) === JSON.stringify(바람);
    if (같다) 통과++; else 깨짐.push(`${이름} — 나온 것 ${JSON.stringify(나옴)} · 바란 것 ${JSON.stringify(바람)}`);
  };

  const 성한몸 = { status: 'ok', checks: { database: { status: 'ok' }, engine: { status: 'ok' },
    optional: { aiReports: 'configured', email: 'configured', oauth: 'configured' } } };
  검('성하면 성하다고 한다', 살핀다(성한몸).판정, '성함');

  /* 🔴 2026-09-11 에 실제로 온 답 */
  const 그날몸 = { ok: true, status: 'degraded', checks: { database: { status: 'ok' }, engine: { status: 'ok' },
    optional: { aiReports: 'not_configured', email: 'not_configured', oauth: 'not_configured' } } };
  검('그날 답을 상함으로 읽는다', 살핀다(그날몸).판정, '상함');
  검('그날 답에서 «통째로 비었다»를 집어낸다',
    살핀다(그날몸).잃은것[0].includes('통째로'), true);

  const 하나만 = { status: 'degraded', checks: { database: { status: 'ok' }, engine: { status: 'ok' },
    optional: { aiReports: 'configured', email: 'configured', oauth: 'not_configured' } } };
  검('하나만 꺼졌으면 «통째로»라고 하지 않는다', 살핀다(하나만).잃은것, ['oauth 가 꺼져 있다']);
  /* 🔴 아침에 이 시험이 「기다림」을 바랐다. 그것이 틀린 판정을 «지켜 주고» 있었다 —
     손님이 로그인을 못 하면 그 가게는 닫힌 것이다. 시험을 뒤집어 못 박는다 */
  검('🔴 oauth 가 꺼지면 «상함»이다 — 손님이 문 앞에서 막힌다', 살핀다(하나만).판정, '상함');

  /* 🔴 오늘 밤 실제로 온 답 — R2 를 되살린 «뒤»의 모양이다.
     DB·엔진·AI 는 성한데 oauth·email·initialAdmin 만 꺼져 있다.
     ⛔ 이것을 「상했다」로 읽으면 매시 자리가 영영 빨갛고, 그러면 아무도 안 읽는다 */
  const 오늘밤 = { ok: true, status: 'degraded', uptimeSec: 827,
    checks: { database: { status: 'ok' }, engine: { status: 'ok' },
      optional: { aiReports: 'configured', email: 'not_configured', oauth: 'not_configured',
        initialAdmin: 'not_configured' } } };
  검('🔴 R2 를 되살려도 로그인·메일이 죽었으면 «상함»이다', 살핀다(오늘밤).판정, '상함');
  검('무엇이 죽었는지 둘을 집어낸다', 살핀다(오늘밤).잃은것.length, 2);
  검('초기 관리자만 «기다림»으로 남는다', 살핀다(오늘밤).기다리는것.length, 1);

  /* ── 돈길 — 「손님이 살 수 있나」 ─────────────────────────────── */
  const 좋은돈길 = {
    토스: { ok: true, enabled: true, live: true, clientKey: 'live_ck_abc' },
    페이팔: { ok: true, enabled: true },
    로그인: { ok: true, providers: ['google', 'naver', 'kakao'] },
  };
  검('다 열려 있으면 연다고 한다', 돈길살핀다(좋은돈길).연다, true);

  /* 🔴 2026-09-12 08:0x 에 실제로 온 답 */
  const 오늘돈길 = {
    토스: { ok: true, enabled: true, live: false, clientKey: 'test_ck_AQ92ymxN34PzJ55D7pKj3ajRKXvd' },
    페이팔: { ok: true, enabled: false, live: false, clientId: null },
    로그인: { ok: true, providers: [] },
  };
  검('🔴 오늘 답은 «못 연다»', 돈길살핀다(오늘돈길).연다, false);
  검('테스트 열쇠를 «열렸다»로 읽지 않는다',
    돈길살핀다(오늘돈길).막힌것.some((x) => x.includes('테스트 열쇠')), true);
  검('막힌 것 셋을 다 센다', 돈길살핀다(오늘돈길).막힌것.length, 3);
  검('⛔ enabled 가 참이어도 test_ 열쇠면 막힌 것이다',
    돈길살핀다({ 토스: { ok: true, enabled: true, live: true, clientKey: 'test_ck_x' },
      페이팔: { enabled: true }, 로그인: { providers: ['google'] } }).연다, false);
  검('아예 못 받았으면 «연다»고 하지 않는다', 돈길살핀다({}).연다, false);

  /* ⛔ 다만 AI 리포트는 «상품»이다 — 이건 기다림이 아니라 상함이다 */
  const AI꺼짐 = { status: 'degraded', checks: { database: { status: 'ok' }, engine: { status: 'ok' },
    optional: { aiReports: 'not_configured', email: 'configured', oauth: 'configured' } } };
  검('⛔ AI 리포트가 꺼지면 «상함»이다 — 손님이 산 것이 안 나온다', 살핀다(AI꺼짐).판정, '상함');

  const DB상함 = { status: 'unhealthy', checks: { database: { status: 'error' }, engine: { status: 'ok' },
    optional: { aiReports: 'configured', email: 'configured', oauth: 'configured' } } };
  검('DB 가 상하면 맨 앞에 세운다', 살핀다(DB상함).잃은것[0], 'DB 가 error');

  검('⛔ 못 받았으면 «고장»이 아니라 «못 쟀다»', 살핀다(null).판정, '못쟀다');
  검('선택 칸이 아예 없으면 그것만으로 상했다 하지 않는다',
    살핀다({ status: 'ok', checks: { database: { status: 'ok' } } }).판정, '성함');

  검('갓떴나 — 600초면 갓 떴다', 갓떴나(600), true);
  검('갓떴나 — 7543초면 아니다', 갓떴나(7543), false);
  검('⛔ 갓떴나 — 못 쟀으면 null 이다 (false 로 만들지 않는다)', 갓떴나(undefined), null);
  검('갓떴나 — 음수는 못 쟀다', 갓떴나(-1), null);

  console.log(`■ 자가시험 ${통과 + 깨짐.length}가지 — 통과 ${통과} · 깨짐 ${깨짐.length}`);
  for (const d of 깨짐) console.log('   🔴 ' + d);
  return 깨짐.length === 0;
}

if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);

/* ── 실제로 잰다 ────────────────────────────────────────────────────── */

let 몸통 = null;
try {
  const r = await fetch(주소, { signal: AbortSignal.timeout(20000) });
  몸통 = await r.json();
} catch { 몸통 = null; }

/* 🔴 돈길도 함께 잰다 — 서버가 사는 것과 «장사가 되는 것»은 다르다 */
async function 물어본다(길) {
  try {
    const r = await fetch('https://klifemap.ai' + 길, { signal: AbortSignal.timeout(20000) });
    return await r.json();
  } catch { return null; }
}
const [토스, 페이팔, 로그인] = await Promise.all([
  물어본다('/api/billing/toss/status'),
  물어본다('/api/billing/paypal/status'),
  물어본다('/api/auth/providers'),
]);
const 돈길 = 돈길살핀다({ 토스, 페이팔, 로그인 });

const 본것 = 살핀다(몸통);
console.log('■ klifemap — 매출이 나는 서비스다. 밖에서 잰다');

if (본것.판정 === '못쟀다') {
  console.log('   ⬜ ' + 주소 + ' 에 못 닿았다 — 「고장」이 아니라 「못 쟀다」로 적는다');
  process.exit(0);
}

const 갓 = 갓떴나(몸통.uptimeSec);
console.log(`   떠 있은 시간  ${몸통.uptimeSec ?? '못 쟀다'}초` + (갓 === true ? '  ⚠ 방금 다시 떴다' : ''));

/* 🔴 돈길을 «맨 먼저» 낸다. 사장님이 물으시는 것은 「팔리나」이지 「떠 있나」가 아니다 */
if (돈길.연다) {
  console.log('   ✅ 돈길 — 손님이 «살 수 있다»');
} else {
  console.log('   🔴 돈길이 막혔다 — 손님이 «살 수 없다»');
  for (const x of 돈길.막힌것) console.log('      · ' + x);
}

if (본것.판정 === '성함' && 돈길.연다) {
  console.log('   ✅ 성하다 (status ' + 본것.말 + ')');
  process.exit(0);
}

/* ⏳ 서비스는 도는데 열쇠가 없어 꺼진 칸만 있는 자리.
   ⛔ 이것을 빨간불로 켜지 않는다. 대신 «무엇을 기다리는지»를 남겨 안 보이게 하지 않는다 */
if (본것.판정 === '기다림' && 돈길.연다) {
  console.log('   ⏳ 팔리고는 있다 — 손님 길에 안 닿는 칸만 꺼져 있다 (status ' + 본것.말 + ')');
  for (const x of 본것.기다리는것) console.log('      · ' + x);
  process.exit(0);
}

console.log('   🔴 상했다 (status ' + 본것.말 + ')');
for (const x of 본것.잃은것) console.log('      · ' + x);
console.log('');
console.log('   ⛔ 이 서비스의 DB 는 볼륨 없이 컨테이너 안에 있다. 오래 버티게 하는 것은 R2 복제뿐이다.');
console.log('      복제가 끊긴 채로 컨테이너가 다시 뜨면 그 사이 자료가 사라진다.');
console.log('   ✅ 고치는 길 — Cloudtype «대시보드»에서 환경변수를 다시 넣는다.');
console.log('      R2_BUCKET · R2_ENDPOINT · R2_ACCESS_KEY_ID · R2_SECRET_ACCESS_KEY 넷이 먼저다.');
console.log('   ⛔ klifemap 에 ctype apply 를 치지 않는다 — 그것이 2026-09-11 에 환경변수를 지웠다.');
process.exit(1);
