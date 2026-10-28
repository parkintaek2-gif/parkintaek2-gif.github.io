/**
 * 결제창까지-와서-멈추나.mjs — **결제창을 연 사람이 몇이고, 그 뒤로 몇이 갔나** 센다.
 *
 * ── 🔴 왜 (2026-10-27 · 사장님 「멈춘 주문 73건이 뭐지?」) ──────────────
 * 나는 「73건」을 근거 없이 들고 다녔다. 대장 어디에도 잰 자리가 없었다.
 * ⛔ 들고 다니던 말을 수로 올리지 않는다. 다시 «잰다».
 *
 * 장부(/api/admin/payments)는 열쇠가 있어야 하는데 그 실행이 막혀 있다. 그래서
 * **손님이 실제로 밟은 자리**를 GA4 로 센다 — 결제창을 연 사람 수와, 그 뒤 결과 지면에
 * 닿은 사람 수. 둘의 차가 「결제창까지 와서 멈춘」 사람이다.
 *
 * ⛔ 이것은 «주문 건수»가 아니라 «사람 수»다. 장부와 같은 수가 아니다 — 그렇게 적는다.
 * ⛔ 못 쟀으면 0 으로 적지 않는다.
 * ⛔ 손님을 하나하나 들여다보지 않는다. 세는 것만 한다.
 *
 * 쓰는 법
 *   node scripts/결제창까지-와서-멈추나.mjs
 *   node scripts/결제창까지-와서-멈추나.mjs --날수 7
 *   node scripts/결제창까지-와서-멈추나.mjs --자가시험
 */
import { 토큰받기 } from './ga4-report.mjs';
import fs2 from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
/* 서비스 계정 열쇠 — ga4-klifemap-channels.mjs 와 같은 자리를 본다 */
function 열쇠읽기() {
  for (const 이름 of ['gsc-sa.json', 'ga4-sa.json', 'search-console-sa.json']) {
    const q = path.join(뿌리, 'secrets', 이름);
    if (fs2.existsSync(q)) return JSON.parse(fs2.readFileSync(q, 'utf8'));
  }
  const env = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (env && fs2.existsSync(env)) return JSON.parse(fs2.readFileSync(env, 'utf8'));
  throw new Error('서비스 계정 열쇠를 못 찾았다 (secrets/gsc-sa.json)');
}

export const 속성 = '549135289';

/** 지면 주소에서 「무슨 자리인가」를 가른다 */
export function 어느자리(길) {
  const p = String(길 || '').toLowerCase();
  if (p.includes('checkout')) return '결제창';
  if (p.includes('paid=1') || p.includes('결제끝')) return '결제를 마치고 돌아온 자리';
  if (p.includes('pricing')) return '값 보는 자리';
  if (p.includes('dashboard')) return 'My KLifeMap';
  return null;
}

/** 센 것을 손님이 알아듣는 말로 — ⛔ 못 쟀으면 「못 쟀다」라고 적는다 */
export function 멈춘사람(결제창, 마친것) {
  if (!Number.isFinite(결제창) || !Number.isFinite(마친것)) return null;
  return Math.max(0, 결제창 - 마친것);
}

async function 잰다(날수) {
  const 토큰 = await 토큰받기(열쇠읽기(), 'https://www.googleapis.com/auth/analytics.readonly');
  const r = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${속성}:runReport`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + 토큰, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dateRanges: [{ startDate: `${날수}daysAgo`, endDate: 'today' }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'totalUsers' }, { name: 'screenPageViews' }],
      limit: 2000,
    }),
  });
  if (!r.ok) {
    console.log('🔴 GA4 가 안 열린다 —', r.status, (await r.text()).slice(0, 160));
    console.log('   ⛔ 이것은 「0명」이 아니라 «못 쟀다»다.');
    process.exitCode = 1; return;
  }
  const j = await r.json();
  const 줄 = j.rows || [];

  const 모음 = {};
  for (const x of 줄) {
    const 길 = x.dimensionValues[0].value;
    const 자리 = 어느자리(길);
    if (!자리) continue;
    const 사람 = Number(x.metricValues[0].value) || 0;
    const 지면 = Number(x.metricValues[1].value) || 0;
    if (!모음[자리]) 모음[자리] = { 사람: 0, 지면: 0 };
    모음[자리].사람 += 사람;
    모음[자리].지면 += 지면;
  }

  console.log(`■ 결제창까지 와서 멈추나 — 최근 ${날수}일 (KLifeMap)`);
  console.log('   ⬜ «사람 수»다. 장부의 «주문 건수»와 같은 수가 아니다.\n');
  const 차례 = ['값 보는 자리', '결제창', '결제를 마치고 돌아온 자리', 'My KLifeMap'];
  for (const 자리 of 차례) {
    const v = 모음[자리];
    console.log('   ' + 자리.padEnd(24)
      + (v ? String(v.사람).padStart(5) + '명 · 지면 ' + String(v.지면).padStart(5) : '    0명 (한 사람도 안 왔다)'));
  }

  const 결제창 = 모음['결제창'] ? 모음['결제창'].사람 : 0;
  const 마친것 = 모음['결제를 마치고 돌아온 자리'] ? 모음['결제를 마치고 돌아온 자리'].사람 : 0;
  const 멈춤 = 멈춘사람(결제창, 마친것);
  console.log('\n   🔴 결제창을 열고 끝내지 못한 사람 — ' + 멈춤 + '명 (' + 결제창 + ' − ' + 마친것 + ')');
  if (결제창 === 0) {
    console.log('   ⛔ 결제창을 연 사람이 0명이다. 「멈췄다」가 아니라 **아무도 거기까지 안 온다**는 뜻이다.');
    console.log('      고칠 자리가 결제가 아니라 그 앞(사람이 오게 하는 일)에 있다.');
  }
}

if (process.argv.includes('--자가시험')) {
  let 샌다 = 0, 센수 = 0;
  const 참 = (이름, 값) => { 센수++; if (!값) { 샌다++; console.log('  🔴 ' + 이름); } };
  참('결제창을 알아본다', 어느자리('/checkout.html?service=saju') === '결제창');
  참('마치고 돌아온 자리를 알아본다', 어느자리('/saju.html?paid=1') === '결제를 마치고 돌아온 자리');
  참('값 보는 자리를 알아본다', 어느자리('/pricing.html') === '값 보는 자리');
  참('⛔ 그 밖은 null — 아무 지면이나 끌어오지 않는다', 어느자리('/astro.html') === null && 어느자리('') === null);
  참('멈춘 사람을 뺀다', 멈춘사람(10, 3) === 7);
  참('⛔ 마친 사람이 더 많아도 음수를 내지 않는다', 멈춘사람(3, 10) === 0);
  참('⛔ 못 쟀으면 null — 0 으로 적지 않는다', 멈춘사람(null, 3) === null && 멈춘사람(10, undefined) === null);
  console.log(샌다 ? ('🔴 ' + 샌다 + '개 샜다 / ' + 센수) : ('✅ 자가시험 ' + 센수 + '개 모두 통과'));
  process.exitCode = 샌다 ? 1 : 0;
} else {
  const i = process.argv.indexOf('--날수');
  잰다(i > 0 ? (parseInt(process.argv[i + 1], 10) || 28) : 28);
}
