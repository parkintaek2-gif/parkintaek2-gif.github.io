#!/usr/bin/env node
/**
 * fetch-gsc-100y-queries.mjs — 100yearmap.com 의 질의별(query) 28일 노출·클릭을 받아
 * check-navigational-impressions.mjs 가 읽는 {site, window, rows:[{key,impressions,clicks,position}]}
 * 꼴로 저장한다. (scripts/measure-click-gap.mjs 의 인증 방식을 그대로 옮겼다.)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createSign } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function 환경읽기() {
  try {
    const 본문 = readFileSync(path.join(뿌리, '.env'), 'utf8');
    for (const 줄 of 본문.split(/\r?\n/)) {
      const m = 줄.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  } catch { /* 없으면 그만 */ }
}
환경읽기();

const 사이트 = 'sc-domain:100yearmap.com';
const 일수 = 28;

const 키파일 = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!키파일) { console.error('⛔ GOOGLE_APPLICATION_CREDENTIALS 가 .env 에 없다'); process.exit(1); }
const 키 = JSON.parse(readFileSync(키파일, 'utf8'));

const 지금초 = Math.floor(Date.now() / 1000);
const 머리 = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
const 몸 = Buffer.from(JSON.stringify({
  iss: 키.client_email, scope: 'https://www.googleapis.com/auth/webmasters.readonly',
  aud: 'https://oauth2.googleapis.com/token', iat: 지금초, exp: 지금초 + 3600,
})).toString('base64url');
const 서명 = createSign('RSA-SHA256').update(`${머리}.${몸}`).sign(키.private_key, 'base64url');
const 토큰답 = await (await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${머리}.${몸}.${서명}`,
  }),
})).json();
if (!토큰답.access_token) { console.error('⛔ 토큰 실패 — 못 쟀다'); process.exit(1); }

const 끝날 = new Date(Date.now() - 3 * 864e5).toISOString().slice(0, 10);
const 첫날 = new Date(Date.now() - (일수 + 3) * 864e5).toISOString().slice(0, 10);

const r = await fetch(
  `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(사이트)}/searchAnalytics/query`,
  { method: 'POST',
    headers: { Authorization: `Bearer ${토큰답.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ startDate: 첫날, endDate: 끝날, dimensions: ['query'], rowLimit: 25000 }) });
const j = await r.json();
if (j.error) {
  console.log(`⛔ 못 쟀다 — ${j.error.message}`);
  process.exit(0);
}
const rows = (j.rows ?? []).map((x) => ({
  key: x.keys[0], impressions: x.impressions, clicks: x.clicks, position: x.position,
}));

const 나가는이름 = `src/data/gsc-100y-${끝날}.json`;
writeFileSync(path.join(뿌리, 나가는이름), JSON.stringify({
  site: 사이트, window: `${첫날}~${끝날}`, rows,
}, null, 2));
console.log(`✅ ${rows.length}개 질의 받음 → ${나가는이름}`);
