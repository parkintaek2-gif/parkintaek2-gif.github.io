#!/usr/bin/env node
/**
 * check-카페손님-어느글로.mjs — **다음 카페에서 오는 손님이 «어느 글»로 들어오나.**
 *
 * ── 🔴 왜 (2026-10-05 23:5x · 5번) ───────────────────────────────────
 *   사장님: 「**언제까지 검색에 우리 것이 잘 노출되는 걸 기다려야 하냐?**」
 *   「**ai이고 내가 많은 권한을 믿고 줬으면 응당의 결과물을 내야지.**」
 *
 *   실측 — KLifeMap 28일 «진짜 손님» 60명의 출처:
 *   ```
 *   cafe.daum.net + m.cafe.daum.net   37명  ← 62%
 *   네이버(검색+referral)              12명
 *   구글                               1명
 *   ChatGPT                            1명
 *   ```
 *   ⭐ **구글이 아니라 다음 카페가 지금 유일하게 돌고 있는 문이다.**
 *   구글을 기다리는 동안 이미 사람을 보내 주고 있는 자리가 있었다.
 *
 * ── 이 자가 내는 것 ──────────────────────────────────────────────────
 *   카페에서 온 손님이 **어느 지면으로** 들어오고 **얼마나 머무는지**.
 *   그래야 「그 글과 같은 꼴을 더 낸다」·「그 카페에 더 올린다」를 정할 수 있다.
 *
 * ⛔ 「카페에서 37명이 왔다」로 끝내지 않는다 — 어느 글인지 알아야 늘릴 수 있다.
 *
 * 쓰는 법
 *   node scripts/check-카페손님-어느글로.mjs
 *   node scripts/check-카페손님-어느글로.mjs --날수 90
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const 여기 = path.dirname(fileURLToPath(import.meta.url));
const 뿌리 = path.join(여기, '..');
const 속성 = '549135289';

/* ⚠ .env 를 먼저 읽는다 — 열쇠 경로가 거기 있다.
   안 읽고 돌렸다가 「서비스 계정 열쇠를 못 찾았다」로 떨어졌다. */
function 환경읽기() {
  try {
    const 본문 = fs.readFileSync(path.join(뿌리, '.env'), 'utf8');
    for (const 줄 of 본문.split(/\r?\n/)) {
      const m = 줄.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
      if (m && process.env[m[1]] === undefined) {
        process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
      }
    }
  } catch { /* 없으면 그만 */ }
}

function 열쇠읽기() {
  환경읽기();
  for (const 이름 of ['gsc-sa.json', 'ga4-sa.json', 'search-console-sa.json']) {
    const p = path.join(뿌리, 'secrets', 이름);
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  }
  const env = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (env && fs.existsSync(env)) return JSON.parse(fs.readFileSync(env, 'utf8'));
  throw new Error('서비스 계정 열쇠를 못 찾았다 (secrets/gsc-sa.json)');
}

/** ⛔ toISOString() 금지 — UTC 라 새벽에 하루가 어긋난다 */
function 날글(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const 날수 = (() => {
  const i = process.argv.indexOf('--날수');
  return i >= 0 && process.argv[i + 1] ? Number(process.argv[i + 1]) : 28;
})();

const 열쇠 = 열쇠읽기();

/* ⚠ google-auth-library 가 이 저장소에 없다. fetch-gsc.mjs 와 같은 방식으로
   JWT 를 직접 만들어 토큰을 받는다 — 라이브러리 없이 된다.
   ⛔ scope 가 서치콘솔과 다르다. GA4 는 analytics.readonly 다. */
async function 토큰받기() {
  const { createSign } = await import('node:crypto');
  const 지금초 = Math.floor(Date.now() / 1000);
  const 머리 = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const 몸 = Buffer.from(JSON.stringify({
    iss: 열쇠.client_email,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: 지금초, exp: 지금초 + 3600,
  })).toString('base64url');
  const 서명 = createSign('RSA-SHA256').update(머리 + '.' + 몸).sign(열쇠.private_key, 'base64url');
  const 답 = await (await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: 머리 + '.' + 몸 + '.' + 서명,
    }),
  })).json();
  if (!답.access_token) throw new Error('토큰 실패 — ' + JSON.stringify(답).slice(0, 160));
  return 답.access_token;
}
const 토큰 = await 토큰받기();

async function 물어보다(몸) {
  const r = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${속성}:runReport`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${토큰}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(몸),
  });
  if (!r.ok) throw new Error(`GA4 ${r.status} ${(await r.text()).slice(0, 200)}`);
  return r.json();
}

const 끝 = new Date();
const 시작 = new Date(끝.getTime() - (날수 - 1) * 86400000);

console.log(`■ 다음 카페에서 오는 손님이 어느 글로 들어오나 — ${날글(시작)} ~ ${날글(끝)}`);
console.log('   KLifeMap 28일 진짜 손님 60명 가운데 카페가 37명(62%)이다. 구글은 1명\n');

const j = await 물어보다({
  dateRanges: [{ startDate: 날글(시작), endDate: 날글(끝) }],
  dimensions: [{ name: 'landingPagePlusQueryString' }, { name: 'sessionSource' }],
  metrics: [
    { name: 'totalUsers' },
    { name: 'sessions' },
    { name: 'averageSessionDuration' },
  ],
  dimensionFilter: {
    filter: {
      fieldName: 'sessionSource',
      stringFilter: { matchType: 'CONTAINS', value: 'cafe.daum.net' },
    },
  },
  orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
  limit: 25,
});

const 줄 = j.rows ?? [];
if (!줄.length) {
  console.log('   ⬜ 카페에서 온 줄이 없다 — 날수를 늘려 본다 (--날수 90)');
  process.exit(0);
}

let 합 = 0;
console.log('   사람  세션  머문시간   들어온 지면');
for (const r of 줄) {
  const 길 = r.dimensionValues[0].value;
  const 사람 = Number(r.metricValues[0].value);
  const 세션 = Number(r.metricValues[1].value);
  const 초 = Math.round(Number(r.metricValues[2].value));
  합 += 사람;
  console.log(`   ${String(사람).padStart(4)}  ${String(세션).padStart(4)}  ${String(초 + '초').padStart(7)}   ${길.slice(0, 64)}`);
}
console.log(`\n   합 ${합}명`);
console.log('\n⭐ 다음에 할 것 — 이 지면과 «같은 꼴»을 더 내고, 이 글을 올린 카페에 더 올린다');
console.log('⛔ 「카페에서 왔다」로 끝내지 않는다. 어느 글인지 알아야 늘릴 수 있다');
