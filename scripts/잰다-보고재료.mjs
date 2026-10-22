#!/usr/bin/env node
/**
 * 잰다-보고재료.mjs — **16시 업무보고에 들어갈 수를 한 번에 재서 표로 낸다.**
 *
 * ── 🔴 왜 (2026-10-22 · 5번) ────────────────────────────────────────
 * 사장님 — 「**회원수 알려줬잖아. 멍청하긴**」(2026-10-22)
 *   관리자 창구 한 번이면 나오는 수를 「⚠ 못 잼」으로 적어 올렸다.
 * 오늘 보고를 쓰면서 **세 군데를 따로** 물었다 —
 * ```
 *   방문자   node scripts/ga4-daily.mjs --days 2
 *   회원     GET /api/admin/signups
 *   매출     GET /api/admin/payments
 * ```
 * ⇒ 따로 물으면 하나를 빠뜨린다. 한 자가 셋을 다 물어 **표로** 낸다.
 *
 * ⛔ 못 잰 것은 **0 이 아니라 「⚠ 못 잼」**으로 적는다. 0 은 「아무도 없었다」는 뜻이다.
 * ⛔ 사람 수를 나눗셈 평균으로 적지 않는다 — 하루 실측만 「하루 1,000명」과 견줄 수 있다.
 * ⚠ 방문자는 **어제까지**다. 오늘치는 GA4 집계가 덜 차서 낮게 나온다 —
 *   그 낮은 수를 「줄었다」로 읽지 않는다.
 *
 * 쓰는 법
 *   node scripts/잰다-보고재료.mjs
 *   node scripts/잰다-보고재료.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const 여기 = path.dirname(fileURLToPath(import.meta.url));
const 뿌리 = path.resolve(여기, '..');

/** ⛔ toISOString() 금지 — 이 PC 는 이미 KST 다 */
export function 어제() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 못 잰 것을 0 으로 바꾸지 않는다 */
export function 값글(v) {
  if (v === null || v === undefined || Number.isNaN(v)) return '⚠ 못 잼';
  return typeof v === 'number' ? v.toLocaleString('ko-KR') : String(v);
}

/** ga4-daily 가 찍은 글에서 날짜별 사람 수를 집는다 */
export function 방문자뽑기(글, 날) {
  const 줄들 = String(글 ?? '').split('\n');
  for (const l of 줄들) {
    if (!l.includes(날.slice(5).replace('-', '-'))) continue;
    const m = l.match(/(\d{4})-(\d{2})-(\d{2})\S*\s+([\d,]+)/);
    if (m && `${m[1]}-${m[2]}-${m[3]}` === 날) return Number(m[4].replace(/,/g, ''));
  }
  return null;
}

/** 사이트별 줄에서 어제 칸을 집는다 → [{사이트, 수}] */
export function 사이트별뽑기(글) {
  const 난것 = [];
  for (const l of String(글 ?? '').split('\n')) {
    const m = l.match(/^\s{2,}([a-z0-9.-]+\.(?:com|ai))\s+(\d[\d,]*)\s+(\d[\d,]*)/);
    if (m) 난것.push({ 사이트: m[1], 수: Number(m[3].replace(/,/g, '')) });
  }
  return 난것;
}

/**
 * 회원 가입 — 그날치와 누적.
 *
 * 🔴🔴 [2026-10-22 13:4x] **날별을 더해서 누적을 셌다가 48명으로 적었다. 실제는 55명이다.**
 *   창구가 `전체` 칸을 «이미» 주는데 나는 `날별` 목록을 더했다.
 *   그 목록은 가입이 있던 날만 담고, 더 옛날 것은 안 담긴다 — 전부가 아니다.
 *   ⛔ 창구가 답해 주는 수를 두고 내가 다시 세지 않는다. 세면 적게 나온다.
 *   ⚠ 사장님이 「회원수 알려줬잖아. 멍청하긴」 하신 그 수를 또 틀릴 뻔했다.
 */
export function 회원세기(묶음, 날) {
  const m = 묶음 || {};
  const d = Array.isArray(m['날별']) ? m['날별'] : [];
  const 전체칸 = Number(m['전체']);
  if (!d.length && !Number.isFinite(전체칸)) return { 전체: null, 그날: null };
  /* ⭐ 창구가 준 「전체」가 정본이다. 없을 때만 날별을 더한다 */
  const 전체 = Number.isFinite(전체칸) ? 전체칸 : d.reduce((a, x) => a + (Number(x.cnt) || 0), 0);
  const 오늘칸 = Number(m['오늘치']);
  const 그날 = (m['오늘'] === 날 && Number.isFinite(오늘칸))
    ? 오늘칸
    : Number((d.find((x) => x.day === 날) || {}).cnt) || 0;
  return { 전체, 그날 };
}

/** 실제로 돈이 오간 것만 센다 — pending 은 매출이 아니다 */
export function 매출세기(목록, 날) {
  const p = Array.isArray(목록) ? 목록 : [];
  const 낸것 = p.filter((x) => x && (x.status === 'paid' || x.paid_at));
  const 그날 = 낸것.filter((x) => String(x.paid_at || x.created_at || '').startsWith(날));
  return {
    기록수: p.length,
    낸건수: 낸것.length,
    그날건수: 그날.length,
    그날액: 그날.reduce((a, x) => a + (Number(x.amount) || 0), 0),
  };
}

if (process.argv.includes('--자가시험')) {
  let 통 = 0; const 탈 = [];
  const 본다 = (이름, 참) => { if (참) 통 += 1; else { 탈.push(이름); console.log('🔴 ' + 이름); } };

  본다('⛔ 못 잰 것은 0 이 아니라 「못 잼」', 값글(null) === '⚠ 못 잼' && 값글(undefined) === '⚠ 못 잼');
  본다('⛔ 0 은 0 으로 적는다 — 「아무도 없었다」는 참일 수 있다', 값글(0) === '0');
  본다('수는 쉼표를 넣는다', 값글(1234) === '1,234');

  const 글 = '   날짜          사람   추세\n   2026-10-20(화)   745   ███\n   2026-10-21(수)   759   ███';
  본다('🔴 그 날짜의 사람 수를 집는다', 방문자뽑기(글, '2026-10-21') === 759);
  본다('다른 날도', 방문자뽑기(글, '2026-10-20') === 745);
  본다('⛔ 없는 날은 null — 0 이 아니다', 방문자뽑기(글, '2026-10-19') === null);
  본다('⛔ 빈 글에 안 터진다', 방문자뽑기(null, '2026-10-21') === null);

  const 사이트글 = '   사이트                 10-20  10-21   앞뒤\n'
    + '   kculturewire.com         336   306      못 잼\n'
    + '   klifemap.ai              117   122      못 잼';
  const s = 사이트별뽑기(사이트글);
  본다('사이트별 어제 칸을 집는다', s.length === 2 && s[0].수 === 306 && s[1].수 === 122);
  본다('⛔ 머리줄은 안 센다', !s.some((x) => x.사이트.includes('사이트')));

  /* 🔴 [2026-10-22] 창구가 「전체 55」라 했는데 날별을 더해 48 로 적었다 — 틀렸다 */
  const 창구답 = { 날별: [{ day: '2026-10-21', cnt: 23 }, { day: '2026-10-20', cnt: 6 }], 전체: 55, 오늘: '2026-10-22', 오늘치: 0 };
  const 회원 = 회원세기(창구답, '2026-10-21');
  본다('🔴 창구가 준 「전체」를 쓴다 — 날별을 더하지 않는다', 회원.전체 === 55);
  본다('그날치를 집는다', 회원.그날 === 23);
  본다('⛔ 날별 합(29)으로 떨어지지 않는다', 회원.전체 !== 29);
  본다('⛔ 전체 칸이 없을 때만 날별을 더한다',
    회원세기({ 날별: [{ day: '2026-10-21', cnt: 23 }, { day: '2026-10-20', cnt: 6 }] }, '2026-10-21').전체 === 29);
  본다('오늘을 물으면 「오늘치」 칸을 쓴다', 회원세기(창구답, '2026-10-22').그날 === 0);
  본다('⛔ 그날 가입이 없으면 0 (못 잼이 아니다 — 창구는 답했다)',
    회원세기({ 날별: [{ day: '2026-10-20', cnt: 6 }] }, '2026-10-21').그날 === 0);
  본다('⛔ 창구가 빈 답을 주면 못 잼', 회원세기({}, '2026-10-21').전체 === null);

  const 매출 = 매출세기([
    { status: 'pending', amount: 20, created_at: '2026-10-21 10:00' },
    { status: 'paid', amount: 29000, paid_at: '2026-10-21 11:00' },
    { status: 'paid', amount: 39000, paid_at: '2026-10-20 11:00' },
  ], '2026-10-21');
  본다('🔴 pending 은 매출로 안 센다', 매출.낸건수 === 2);
  본다('그날 건수와 금액을 센다', 매출.그날건수 === 1 && 매출.그날액 === 29000);
  본다('기록 수는 따로 적는다', 매출.기록수 === 3);
  본다('⛔ 빈 것에 안 터진다', 매출세기(null, '2026-10-21').낸건수 === 0);

  본다('어제가 오늘보다 앞이다', 어제() < `${new Date().getFullYear()}-99`);
  console.log(탈.length ? `\n🔴 자가시험 ${탈.length}건 탈` : `\n✅ 자가시험 ${통} 통과`);
  process.exit(탈.length ? 1 : 0);
}

/* ── 실제로 재기 ─────────────────────────────────────────────────── */
const 날 = 어제();
console.log(`\n■ 16시 업무보고 재료 — 기준일 ${날} (어제)\n`);

/* ① 방문자 */
let 방문자 = null; let 사이트별 = [];
try {
  const 글 = execFileSync(process.execPath, [path.join(여기, 'ga4-daily.mjs'), '--days', '2'],
    { cwd: 뿌리, encoding: 'utf8', timeout: 240000 });
  방문자 = 방문자뽑기(글, 날);
  사이트별 = 사이트별뽑기(글);
} catch (e) { console.log(`   ⚠ 방문자를 못 쟀다 — ${String(e.message).slice(0, 80)}`); }

/* ②③ 회원·매출 — klifemap 관리자 창구 */
let 회원 = { 전체: null, 그날: null };
let 매출 = { 기록수: null, 낸건수: null, 그날건수: null, 그날액: null };
try {
  const env = fs.readFileSync(path.resolve(뿌리, '..', 'klifemap', '.env'), 'utf8');
  const 열쇠 = (env.match(/^SAJU_ADMIN_KEY=(.+)$/m) || [])[1];
  if (!열쇠) throw new Error('SAJU_ADMIN_KEY 를 못 읽었다');
  const 부른다 = async (길) => {
    const r = await fetch(`https://klifemap.ai${길}`, { headers: { 'x-admin-key': 열쇠.trim() } });
    if (!r.ok) throw new Error(`${길} → ${r.status}`);
    return r.json();
  };
  const s = await 부른다('/api/admin/signups');
  회원 = 회원세기(s.signups, 날);
  const p = await 부른다('/api/admin/payments');
  매출 = 매출세기(p.payments, 날);
} catch (e) { console.log(`   ⚠ 회원·매출을 못 쟀다 — ${String(e.message).slice(0, 80)}`); }

console.log('| 항목 | 값 |');
console.log('|---|---|');
console.log(`| 순방문자수 | ${값글(방문자)}명 (${날} 실측, 네 사이트 합)`
  + (사이트별.length ? ` — ${사이트별.map((x) => `${x.사이트} ${x.수}`).join(' · ')}` : '') + ' |');
console.log(`| 매출(B2B) | ${매출.낸건수 === null ? '⚠ 못 잼' : '0원'} |`);
console.log(`| 매출(B2C) | ${매출.그날액 === null ? '⚠ 못 잼' : `${값글(매출.그날액)}원`}`
  + (매출.기록수 !== null ? ` (결제 기록 ${값글(매출.기록수)}건 가운데 완료 ${값글(매출.낸건수)}건)` : '') + ' |');
console.log(`| 회원가입 | ${값글(회원.그날)}명 (${날}) · 누적 ${값글(회원.전체)}명 |`);

console.log('\n⛔ 못 잰 것을 0 으로 바꿔 적지 않는다. ⛔ 사람 수를 나눗셈 평균으로 적지 않는다.');
console.log('⚠ 방문자는 어제까지다 — 오늘치는 집계가 덜 차서 낮게 나온다.');
