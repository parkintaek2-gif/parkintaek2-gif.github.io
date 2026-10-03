/* 8월에 노출을 내던 KCW 갈래가 지금 색인돼 있나 — 「3분의 2가 어디로 갔나」에 답하려고 */
import { 진단 } from '../check-색인-왜안되나.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { createSign } from 'node:crypto';

const 뿌리 = path.resolve('.');
for (const 줄 of fs.readFileSync(path.join(뿌리, '.env'), 'utf8').split(/\r?\n/)) {
  const m = 줄.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
  if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
}
const 키 = JSON.parse(fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'));
const s0 = Math.floor(Date.now() / 1000);
const h = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
const bb = Buffer.from(JSON.stringify({
  iss: 키.client_email, scope: 'https://www.googleapis.com/auth/webmasters.readonly',
  aud: 'https://oauth2.googleapis.com/token', iat: s0, exp: s0 + 3600,
})).toString('base64url');
const sig = createSign('RSA-SHA256').update(`${h}.${bb}`).sign(키.private_key, 'base64url');
const 토큰 = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${h}.${bb}.${sig}` }),
}).then((r) => r.json()).then((j) => j.access_token);

/* 8월에 실제로 노출을 내던 지면을 고른다 — 짐작이 아니라 그때 자료에서 뽑는다 */
const 옛것 = JSON.parse(fs.readFileSync('src/data/gsc-kcw-qp-2026-09-08.json', 'utf8')).rows || [];
const 지면별 = new Map();
for (const r of 옛것) {
  const p = String(r.page || '');
  if (!p) continue;
  지면별.set(p, (지면별.get(p) || 0) + (r.impressions || 0));
}
const 고른것 = [...지면별.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
console.log(`■ 8월에 노출이 가장 많던 KCW 지면 ${고른것.length}장 — 지금 색인돼 있나\n`);

const 셈 = {};
for (const [u, imp] of 고른것) {
  let i = null;
  try {
    const r = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
      method: 'POST', headers: { Authorization: 'Bearer ' + 토큰, 'Content-Type': 'application/json' },
      body: JSON.stringify({ inspectionUrl: u, siteUrl: 'sc-domain:kculturewire.com' }),
    }).then((x) => x.json());
    i = r.inspectionResult?.indexStatusResult ?? null;
  } catch (e) { /* 못 물으면 못물음 */ }
  const d = 진단(i);
  셈[d.갈래] = (셈[d.갈래] || 0) + 1;
  const 길 = u.replace(/^https?:\/\/[^/]+/, '');
  console.log(`   ${d.빛} 8월 노출 ${String(imp).padStart(3)}  ${길.padEnd(42)} ${d.말}`);
  await new Promise((x) => setTimeout(x, 1200));
}
console.log('\n■ 갈래별');
for (const [k, v] of Object.entries(셈).sort((a, b) => b[1] - a[1])) console.log(`   ${String(v).padStart(3)}장  ${k}`);
