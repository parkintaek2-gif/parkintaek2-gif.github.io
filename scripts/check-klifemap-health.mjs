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

/**
 * health 몸통을 보고 무엇이 잘못됐는지 갈라 낸다.
 * @returns {{판정:'성함'|'상함'|'못쟀다', 잃은것:string[], 말:string}}
 */
export function 살핀다(몸통) {
  if (몸통 === null || 몸통 === undefined) return { 판정: '못쟀다', 잃은것: [], 말: '답을 못 받았다' };
  const 선택 = 몸통.checks?.optional ?? {};
  const 잃은것 = [];

  /* 🔴 R2 가 첫째다 — 이것이 끊기면 «자료가 사라질 수 있다». 나머지는 기능이 꺼질 뿐이다.
     ⚠ health 는 R2 를 따로 말해 주지 않는다. 그래서 다른 열쇠가 전부 비었으면
       «환경변수가 통째로 날아간 것»으로 보고 R2 도 의심한다 — 2026-09-11 에 실제로 그랬다 */
  const 열쇠칸 = ['aiReports', 'email', 'oauth'];
  const 있는칸 = 열쇠칸.filter((k) => k in 선택);
  const 꺼진칸 = 있는칸.filter((k) => 선택[k] !== 'configured');
  if (있는칸.length > 0 && 꺼진칸.length === 있는칸.length) {
    잃은것.push('환경변수가 통째로 비었다 — R2 복제도 끊겼을 수 있다');
  } else {
    for (const k of 꺼진칸) 잃은것.push(k + ' 가 꺼져 있다');
  }

  if (몸통.checks?.database?.status && 몸통.checks.database.status !== 'ok') {
    잃은것.unshift('DB 가 ' + 몸통.checks.database.status);
  }
  if (몸통.checks?.engine?.status && 몸통.checks.engine.status !== 'ok') {
    잃은것.unshift('엔진이 ' + 몸통.checks.engine.status);
  }

  if (잃은것.length) return { 판정: '상함', 잃은것, 말: 몸통.status ?? '' };
  return { 판정: '성함', 잃은것: [], 말: 몸통.status ?? '' };
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

const 본것 = 살핀다(몸통);
console.log('■ klifemap — 매출이 나는 서비스다. 밖에서 잰다');

if (본것.판정 === '못쟀다') {
  console.log('   ⬜ ' + 주소 + ' 에 못 닿았다 — 「고장」이 아니라 「못 쟀다」로 적는다');
  process.exit(0);
}

const 갓 = 갓떴나(몸통.uptimeSec);
console.log(`   떠 있은 시간  ${몸통.uptimeSec ?? '못 쟀다'}초` + (갓 === true ? '  ⚠ 방금 다시 떴다' : ''));

if (본것.판정 === '성함') {
  console.log('   ✅ 성하다 (status ' + 본것.말 + ')');
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
