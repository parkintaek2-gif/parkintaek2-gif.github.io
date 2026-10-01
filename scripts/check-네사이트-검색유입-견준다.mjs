#!/usr/bin/env node
/**
 * check-네사이트-검색유입-견준다.mjs — **네 사이트를 나란히 놓고 어디가 먹히는지 잰다.**
 *
 * 🔴🔴 사장님 지시 (2026-10-02)
 *   > 「**검색 유입량을 늘릴 수 있는 가장 좋은방법을 찾아서 해**」
 *   > 「**자꾸 묻네...스스로 발전, 스스로 판단, 스스로 비즈니스 목표 달성!!!!**」
 *
 * ⇒ 고르시라고 올리지 않는다. 재서 «가장 나은 길»을 내가 찾는다.
 *   그러려면 먼저 **네 사이트를 견줘야** 한다. 케이라이프맵만 안 되는 것인지,
 *   우리 방식 전체가 안 되는 것인지에 따라 처방이 완전히 달라지기 때문이다.
 *
 *   · 케이라이프맵만 막혔다  → 그 사이트의 무엇이 다른가를 찾는다
 *   · 넷 다 막혔다          → 우리가 글을 만드는 «방식»이 문제다
 *   · 한 곳이 잘 된다        → **그 방식을 나머지에 옮긴다** (가장 값싼 길)
 *
 * ⛔ 「노출 0」과 「못 쟀다」를 같이 적지 않는다.
 *
 * 쓰는 법
 *   node scripts/check-네사이트-검색유입-견준다.mjs
 *   node scripts/check-네사이트-검색유입-견준다.mjs --일수 90
 *   node scripts/check-네사이트-검색유입-견준다.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSign } from 'node:crypto';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const 사이트들 = [
  { 이름: '케이라이프맵', site: 'sc-domain:klifemap.ai' },
  { 이름: '에스마켓츠', site: 'sc-domain:seoulmarkets.com' },
  { 이름: 'K컬처와이어', site: 'sc-domain:kculturewire.com' },
  { 이름: '백년지도', site: 'sc-domain:100yearmap.com' },
];

/** 며칠 전 날짜 (KST 기준 — ⛔ toISOString 쓰지 않는다) */
export function 날짜문자(며칠전, 오늘 = new Date()) {
  const d = new Date(오늘.getTime() - 며칠전 * 24 * 60 * 60 * 1000);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** 줄들을 받아 「무엇이 먹히나」를 가린다 */
export function 진단(줄) {
  if (줄 == null) return { 빛: '⬜', 말: '못 쟀다' };
  const { 노출, 클릭, 지면수 } = 줄;
  if (노출 === 0) return { 빛: '🔴', 말: '검색 결과에 한 번도 안 뜬다' };
  if (클릭 === 0) return { 빛: '🟡', 말: '뜨기는 하는데 아무도 안 누른다 — 제목·설명 문제' };
  if (지면수 <= 3) return { 빛: '🟡', 말: '몇 지면만 먹힌다 — 그 지면을 본보기로 삼는다' };
  return { 빛: '✅', 말: '여러 지면이 먹힌다' };
}

/** 가장 값어치 있는 다음 수를 고른다 — ⛔ 고르시라고 올리지 않는다 */
export function 다음수고르기(잰것) {
  const 잰것만 = (잰것 ?? []).filter((x) => x.줄);
  if (!잰것만.length) return '못 쟀다 — 먼저 재는 길을 고친다';
  const 먹히는곳 = 잰것만.filter((x) => x.줄.클릭 > 0).sort((a, b) => b.줄.클릭 - a.줄.클릭);
  const 안먹히는곳 = 잰것만.filter((x) => x.줄.노출 === 0);
  if (먹히는곳.length && 안먹히는곳.length) {
    return `«${먹히는곳[0].이름}» 가 먹힌다 — 그 방식을 ${안먹히는곳.map((x) => x.이름).join('·')} 에 옮긴다`;
  }
  if (먹히는곳.length) return `«${먹히는곳[0].이름}» 가 가장 먹힌다 — 그 축을 더 판다`;
  return '넷 다 안 먹힌다 — 글 만드는 방식 자체를 바꾼다';
}

/* ── 자가시험 ──────────────────────────────────────────────── */
if (process.argv.includes('--자가시험') || process.argv.includes('--selftest')) {
  let 통과 = 0; let 실패 = 0;
  const 검 = (이름, 참) => { if (참) { 통과 += 1; console.log('✅ ' + 이름); } else { 실패 += 1; console.log('🔴 ' + 이름); } };

  const 기준 = new Date(2026, 9, 2);   /* 2026-10-02 */
  검('며칠 전 날짜를 KST 로 낸다', 날짜문자(1, 기준) === '2026-10-01');
  검('달을 넘어가도 맞는다', 날짜문자(2, 기준) === '2026-09-30');

  검('⛔ 못 잰 것을 0 으로 읽지 않는다', 진단(null).빛 === '⬜');
  검('노출 0 은 빨강', 진단({ 노출: 0, 클릭: 0, 지면수: 0 }).빛 === '🔴');
  검('뜨는데 안 눌리면 노랑', 진단({ 노출: 100, 클릭: 0, 지면수: 9 }).빛 === '🟡');
  검('몇 지면만 먹히면 노랑', 진단({ 노출: 100, 클릭: 5, 지면수: 2 }).빛 === '🟡');
  검('여러 지면이 먹히면 초록', 진단({ 노출: 100, 클릭: 5, 지면수: 20 }).빛 === '✅');

  검('🔴 먹히는 곳이 있으면 «그 방식을 옮기라»고 고른다',
    /옮긴다/.test(다음수고르기([
      { 이름: '가', 줄: { 노출: 10, 클릭: 3, 지면수: 5 } },
      { 이름: '나', 줄: { 노출: 0, 클릭: 0, 지면수: 0 } },
    ])));
  검('넷 다 안 먹히면 방식을 바꾸라고 고른다',
    /방식 자체/.test(다음수고르기([{ 이름: '가', 줄: { 노출: 5, 클릭: 0, 지면수: 1 } }])));
  검('⛔ 못 쟀으면 그렇게 말한다', /못 쟀다/.test(다음수고르기([])));

  console.log(`\n${실패 === 0 ? '✅' : '🔴'} 자가시험 ${통과 + 실패}개 중 통과 ${통과}개`);
  process.exit(실패 === 0 ? 0 : 1);
}

/* ── 열쇠 ─────────────────────────────────────────────────── */
function 환경읽기() {
  const 길 = path.join(뿌리, '.env');
  if (!fs.existsSync(길)) return;
  for (const 줄 of fs.readFileSync(길, 'utf8').split('\n')) {
    const m = 줄.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, '');
  }
}
환경읽기();

async function 토큰만들기() {
  const 열쇠길 = process.env.GOOGLE_APPLICATION_CREDENTIALS
    || path.join(뿌리, 'secrets', 'search-console-sa.json');
  const sa = JSON.parse(fs.readFileSync(열쇠길, 'utf8'));
  const 머리 = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const 이제 = Math.floor(Date.now() / 1000);
  const 몸 = Buffer.from(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: 이제 + 3600, iat: 이제,
  })).toString('base64url');
  const 서명 = createSign('RSA-SHA256').update(`${머리}.${몸}`).sign(sa.private_key).toString('base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${머리}.${몸}.${서명}`,
    }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error('토큰을 못 받았다 — ' + JSON.stringify(j).slice(0, 160));
  return j.access_token;
}

const 일수자리 = process.argv.indexOf('--일수');
const 일수 = 일수자리 > 0 ? Number(process.argv[일수자리 + 1]) || 28 : 28;
const 토큰 = await 토큰만들기();

async function 묻기(site, 몸) {
  const r = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`,
    { method: 'POST', headers: { Authorization: 'Bearer ' + 토큰, 'Content-Type': 'application/json' }, body: JSON.stringify(몸) },
  );
  const j = await r.json();
  if (!r.ok) throw new Error(`${r.status} ${String(j.error?.message || '').slice(0, 80)}`);
  return j.rows ?? [];
}

console.log(`■ 네 사이트 검색 유입 — 최근 ${일수}일 (${날짜문자(일수)} ~ ${날짜문자(1)})\n`);
console.log('사이트'.padEnd(14) + '노출'.padStart(9) + '클릭'.padStart(8) + '먹히는 지면'.padStart(13) + '  무엇이 보이나');

const 잰것 = [];
for (const { 이름, site } of 사이트들) {
  let 줄 = null; let 왜 = null;
  try {
    const 합 = await 묻기(site, { startDate: 날짜문자(일수), endDate: 날짜문자(1), dimensions: [], rowLimit: 1 });
    const 지면 = await 묻기(site, { startDate: 날짜문자(일수), endDate: 날짜문자(1), dimensions: ['page'], rowLimit: 500 });
    줄 = {
      노출: Math.round(합[0]?.impressions ?? 0),
      클릭: Math.round(합[0]?.clicks ?? 0),
      지면수: 지면.filter((r) => (r.impressions ?? 0) > 0).length,
      윗지면: 지면.sort((a, b) => (b.clicks - a.clicks) || (b.impressions - a.impressions)).slice(0, 3),
    };
  } catch (e) { 왜 = e.message; }
  const d = 진단(줄);
  console.log(`${d.빛} ${이름.padEnd(12)}${String(줄 ? 줄.노출 : '—').padStart(8)}`
    + `${String(줄 ? 줄.클릭 : '—').padStart(8)}${String(줄 ? 줄.지면수 : '—').padStart(12)}   ${d.말}${왜 ? ` (${왜})` : ''}`);
  잰것.push({ 이름, site, 줄 });
}

/* 먹히는 지면이 있으면 그것을 보여 준다 — 본보기가 거기 있다 */
for (const x of 잰것) {
  if (!x.줄 || !x.줄.윗지면?.length || x.줄.노출 === 0) continue;
  console.log(`\n■ ${x.이름} — 실제로 먹히는 지면`);
  for (const r of x.줄.윗지면) {
    const u = String(r.keys?.[0] ?? '').replace(/^https?:\/\/[^/]+/, '') || '/';
    console.log(`   클릭 ${String(Math.round(r.clicks)).padStart(4)} · 노출 ${String(Math.round(r.impressions)).padStart(6)}  ${u.slice(0, 70)}`);
  }
}

console.log(`\n⇒ 가장 값어치 있는 다음 수 — ${다음수고르기(잰것)}`);
