#!/usr/bin/env node
/**
 * check-백년지도-왜-안눌리나.mjs — **노출은 가장 많은데 클릭이 0인 까닭을 가른다.**
 *
 * 🔴🔴 [2026-10-02 · 5번] 사장님 「검색 유입량을 늘릴 수 있는 가장 좋은방법을 찾아서 해」
 *
 * 네 사이트를 견주니 이렇게 나왔다 (최근 28일) —
 * ```
 *   케이라이프맵     노출    7 · 클릭 1 · 먹히는 지면   2
 *   에스마켓츠       노출  417 · 클릭 5 · 먹히는 지면 142
 *   K컬처와이어      노출  423 · 클릭 3 · 먹히는 지면 216
 *   백년지도         노출  803 · 클릭 0 · 먹히는 지면 500   ← 여기
 * ```
 * ⭐ **백년지도는 이미 803번 뜨고 있다.** 클릭률을 0%에서 2%로만 올려도 16클릭이고,
 *   그것은 케이라이프맵 «전체 노출»의 두 배가 넘는다.
 *   ⇒ 안 뜨는 곳을 뜨게 만드는 것보다, **이미 뜨는 곳을 눌리게** 만드는 것이 훨씬 싸다.
 *
 * 다만 「안 눌린다」에는 까닭이 둘이고 처방이 정반대다. 그래서 먼저 가른다.
 * ```
 *   순위가 20위 밖  →  안 눌리는 게 당연하다. 제목을 고쳐도 안 바뀐다
 *   순위가 10위 안  →  보이는데도 안 눌린다. 제목·설명이 검색어와 안 맞는 것이다
 * ```
 * ⛔ 가르기 전에 제목부터 고치면 헛일을 한다.
 *
 * 쓰는 법
 *   node scripts/check-백년지도-왜-안눌리나.mjs
 *   node scripts/check-백년지도-왜-안눌리나.mjs --사이트 sc-domain:seoulmarkets.com
 *   node scripts/check-백년지도-왜-안눌리나.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSign } from 'node:crypto';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 평균 순위로 까닭을 가른다 — 처방이 정반대라 반드시 먼저 가른다 */
export function 까닭가르기(순위, 클릭) {
  if (순위 == null) return { 빛: '⬜', 갈래: '못쟀다', 처방: '먼저 재는 길을 고친다' };
  if (클릭 > 0) return { 빛: '✅', 갈래: '눌린다', 처방: '이 꼴을 다른 지면에 옮긴다' };
  if (순위 > 20) return { 빛: '🔴', 갈래: '순위가 멀다', 처방: '제목을 고쳐도 안 바뀐다 — 그 말로 쓴 글이 더 두꺼워야 한다' };
  if (순위 > 10) return { 빛: '🟡', 갈래: '두 쪽 밖', 처방: '첫 쪽에 못 든다 — 그 말을 제목·첫 문단에 넣는다' };
  return { 빛: '🟠', 갈래: '보이는데 안 눌린다', 처방: '제목·설명이 검색어와 안 맞는다 — 여기가 가장 싸게 고쳐진다' };
}

/** 가장 값어치 있는 자리 — 노출이 크고 순위가 가까운데 안 눌리는 것 */
export function 값어치(줄) {
  if (!줄 || 줄.클릭 > 0) return 0;
  if (줄.순위 == null || 줄.순위 > 20) return 0;
  /* 노출이 클수록, 순위가 가까울수록 값어치가 크다 */
  return Math.round(줄.노출 * (21 - 줄.순위));
}

/* ── 자가시험 ──────────────────────────────────────────────── */
if (process.argv.includes('--자가시험') || process.argv.includes('--selftest')) {
  let 통과 = 0; let 실패 = 0;
  const 검 = (이름, 참) => { if (참) { 통과 += 1; console.log('✅ ' + 이름); } else { 실패 += 1; console.log('🔴 ' + 이름); } };

  검('⛔ 못 잰 순위를 0 으로 읽지 않는다', 까닭가르기(null, 0).갈래 === '못쟀다');
  검('눌리면 초록', 까닭가르기(5, 2).갈래 === '눌린다');
  검('🔴 순위가 멀면 제목을 고쳐도 안 바뀐다고 말한다',
    까닭가르기(44, 0).갈래 === '순위가 멀다' && /두꺼워야/.test(까닭가르기(44, 0).처방));
  검('두 쪽 밖은 따로 가른다', 까닭가르기(14, 0).갈래 === '두 쪽 밖');
  검('🟠 첫 쪽인데 안 눌리면 제목·설명 문제', 까닭가르기(4, 0).갈래 === '보이는데 안 눌린다');

  검('값어치 — 눌리는 것은 0', 값어치({ 노출: 100, 클릭: 3, 순위: 2 }) === 0);
  검('값어치 — 순위가 멀면 0', 값어치({ 노출: 100, 클릭: 0, 순위: 44 }) === 0);
  검('값어치 — 노출이 클수록 크다',
    값어치({ 노출: 100, 클릭: 0, 순위: 5 }) > 값어치({ 노출: 10, 클릭: 0, 순위: 5 }));
  검('값어치 — 순위가 가까울수록 크다',
    값어치({ 노출: 50, 클릭: 0, 순위: 2 }) > 값어치({ 노출: 50, 클릭: 0, 순위: 18 }));
  검('⛔ 빈 것에도 안 터진다', 값어치(null) === 0);

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
    iss: sa.client_email, scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token', exp: 이제 + 3600, iat: 이제,
  })).toString('base64url');
  const 서명 = createSign('RSA-SHA256').update(`${머리}.${몸}`).sign(sa.private_key).toString('base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${머리}.${몸}.${서명}`,
    }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error('토큰을 못 받았다');
  return j.access_token;
}

const 날짜 = (며칠전) => {
  const d = new Date(Date.now() - 며칠전 * 86400000);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const 사이트자리 = process.argv.indexOf('--사이트');
const site = 사이트자리 > 0 ? process.argv[사이트자리 + 1] : 'sc-domain:100yearmap.com';
const 토큰 = await 토큰만들기();

async function 묻기(몸) {
  const r = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`,
    { method: 'POST', headers: { Authorization: 'Bearer ' + 토큰, 'Content-Type': 'application/json' }, body: JSON.stringify(몸) },
  );
  const j = await r.json();
  if (!r.ok) throw new Error(`${r.status} ${String(j.error?.message || '').slice(0, 80)}`);
  return j.rows ?? [];
}

const 기간 = { startDate: 날짜(28), endDate: 날짜(1) };
console.log(`■ ${site} — 최근 28일 (${기간.startDate} ~ ${기간.endDate})\n`);

/* ① 검색어별 — 사람이 무슨 말로 우리를 만나나 */
const 검색어 = await 묻기({ ...기간, dimensions: ['query'], rowLimit: 60 });
console.log(`■ 사람이 쓴 검색어 ${검색어.length}개 — 노출이 큰 차례\n`);
console.log('   검색어'.padEnd(36) + '노출'.padStart(6) + '클릭'.padStart(6) + '순위'.padStart(7) + '  무엇이 문제인가');
const 줄들 = 검색어.map((r) => ({
  말: r.keys[0], 노출: Math.round(r.impressions), 클릭: Math.round(r.clicks),
  순위: r.position != null ? Number(r.position.toFixed(1)) : null,
})).sort((a, b) => 값어치(b) - 값어치(a) || b.노출 - a.노출);

for (const x of 줄들.slice(0, 20)) {
  const d = 까닭가르기(x.순위, x.클릭);
  console.log(`   ${d.빛} ${x.말.slice(0, 32).padEnd(33)}${String(x.노출).padStart(5)}`
    + `${String(x.클릭).padStart(6)}${String(x.순위 ?? '—').padStart(7)}   ${d.처방.slice(0, 44)}`);
}

/* ② 갈래별 셈 — 어디에 힘을 써야 하나 */
const 셈 = new Map();
for (const x of 줄들) {
  const g = 까닭가르기(x.순위, x.클릭).갈래;
  const 것 = 셈.get(g) || { 수: 0, 노출: 0 };
  것.수 += 1; 것.노출 += x.노출; 셈.set(g, 것);
}
console.log('\n■ 갈래별 — 노출이 어디에 쌓여 있나');
for (const [g, v] of [...셈.entries()].sort((a, b) => b[1].노출 - a[1].노출)) {
  console.log(`   ${g.padEnd(16)} 검색어 ${String(v.수).padStart(3)}개 · 노출 ${String(v.노출).padStart(5)}`);
}

/* ③ 가장 값어치 있는 자리 */
const 고른것 = 줄들.filter((x) => 값어치(x) > 0).slice(0, 8);
if (고른것.length) {
  console.log('\n■ 🔴 가장 싸게 고쳐지는 자리 — 이미 보이는데 안 눌리는 검색어');
  for (const x of 고른것) {
    console.log(`   「${x.말}」 — 노출 ${x.노출} · 평균 ${x.순위}위 · 클릭 0`);
  }
  console.log('\n   ⇒ 이 말들이 지면 «제목»과 «첫 문단»에 그대로 들어 있는지 본다.');
  console.log('     구글은 검색어와 겹치는 제목을 굵게 보여 준다 — 겹치지 않으면 눈이 안 간다.');
} else {
  console.log('\n■ 이미 보이는데 안 눌리는 검색어가 없다 — 순위를 올리는 일이 먼저다');
}
