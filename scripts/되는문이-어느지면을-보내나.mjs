#!/usr/bin/env node
/**
 * 되는문이-어느지면을-보내나.mjs — **ChatGPT 와 네이버가 «어느 지면»을 보내나.**
 *
 * ── 🔴 왜 (2026-10-05 21:0x · 5번) ───────────────────────────────────
 *   사장님: 「**언제까지 검색에 우리 것이 잘 노출되는 걸 기다려야 하냐?**」
 *
 *   28일 바깥 유입 553명을 hostName 으로 갈라 재니 이랬다 —
 *   ```
 *   ChatGPT   223명 (40%)   ← 1등
 *   네이버    181명 (33%)
 *   구글       10명 (2%)
 *   ```
 *   ⭐ **기다릴 까닭이 없었다.** 이미 열려 있는 문이 둘인데 우리가 구글만 보고
 *     있었다. 사장님이 치중하라 하신 「AI GEO」가 이미 우리 최대 유입구다.
 *
 *   ⛔ 「ChatGPT 가 223명이다」로 끝내면 못 늘린다. **어느 지면이 받는지**를
 *     알아야 그 꼴을 복제한다. 되는 것을 찾았으면 그것을 베끼는 것이 가장 빠르다.
 *
 * ── ⚠ hostName 으로 가른다 ───────────────────────────────────────────
 *   GA4 속성 549135289 하나에 네 사이트가 다 들어 있다. 안 가르면 수가 거짓이 된다.
 *
 * 쓰는 법
 *   node scripts/되는문이-어느지면을-보내나.mjs
 *   node scripts/되는문이-어느지면을-보내나.mjs --날수 90
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 여기 = path.dirname(fileURLToPath(import.meta.url));
const 뿌리 = path.join(여기, '..');
const 속성 = '549135289';

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

/** ⛔ toISOString() 금지 */
function 날글(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const 날수 = (() => {
  const i = process.argv.indexOf('--날수');
  return i >= 0 && process.argv[i + 1] ? Number(process.argv[i + 1]) : 28;
})();

const 열쇠 = 열쇠읽기();

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
  if (!r.ok) return { 못쟀다: `GA4 ${r.status} ${(await r.text()).slice(0, 160)}` };
  return r.json();
}

const 끝 = new Date();
const 시작 = new Date(끝.getTime() - (날수 - 1) * 86400000);
const 기간 = [{ startDate: 날글(시작), endDate: 날글(끝) }];

/* 재는 문 — 되는 것부터 */
const 문들 = [
  { 이름: 'ChatGPT (AI 검색)', 꼴: 'chatgpt' },
  { 이름: '네이버', 꼴: 'naver' },
  { 이름: 'Bing', 꼴: 'bing' },
  { 이름: 'Reddit', 꼴: 'reddit' },
  { 이름: '다음 카페', 꼴: 'cafe.daum' },
  { 이름: '구글', 꼴: 'google' },
];

console.log(`■ 되는 문이 «어느 지면»을 보내나 — ${날글(시작)} ~ ${날글(끝)}`);
console.log('   28일 바깥 553명 중 ChatGPT 223 · 네이버 181 · 구글 10 이다');
console.log('   ⭐ 되는 것을 찾았으면 베낀다. 그것이 기다리지 않는 길이다\n');

for (const 문 of 문들) {
  const j = await 물어보다({
    dateRanges: 기간,
    dimensions: [{ name: 'hostName' }, { name: 'landingPagePlusQueryString' }],
    metrics: [{ name: 'totalUsers' }, { name: 'averageSessionDuration' }],
    dimensionFilter: {
      andGroup: {
        expressions: [
          { filter: { fieldName: 'sessionSource', stringFilter: { matchType: 'CONTAINS', value: 문.꼴 } } },
          { notExpression: { filter: { fieldName: 'sessionSource', stringFilter: { matchType: 'EXACT', value: '(direct)' } } } },
        ],
      },
    },
    orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
    limit: 14,
  });

  console.log(`── ${문.이름} ──`);
  if (j.못쟀다) { console.log('   ⬜ 못 쟀다 — ' + j.못쟀다 + '\n'); continue; }
  const 줄들 = j.rows ?? [];
  if (!줄들.length) { console.log('   ⬜ 이 문으로 온 줄이 없다\n'); continue; }

  let 합 = 0;
  for (const r of 줄들) {
    const 집 = r.dimensionValues[0].value.replace(/^www\./, '');
    const 길 = r.dimensionValues[1].value;
    const 사람 = Number(r.metricValues[0].value);
    const 초 = Math.round(Number(r.metricValues[1].value));
    합 += 사람;
    console.log(`   ${String(사람).padStart(4)}명 ${String(초 + '초').padStart(7)}  ${집}${길.slice(0, 54)}`);
  }
  console.log(`   (위 ${줄들.length}줄 합 ${합}명)\n`);
}

console.log('⭐ 할 것 — 가장 많이 받는 지면의 «꼴»을 다른 사이트·다른 말로 복제한다');
console.log('⛔ 구글만 보고 「아직 안 된다」고 적지 않는다. 이미 되는 문이 둘 있다');
