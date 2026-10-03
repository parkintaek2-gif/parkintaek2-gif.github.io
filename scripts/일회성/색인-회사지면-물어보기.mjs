/* 회사 지면이 몇 장이나 색인됐나 — 우리가 «이기는 꼴»이라 값어치가 크다.
   ⚠ URL 검사 API 는 하루 한도가 있다. 시장마다 네 장씩만 고르게 뽑아 묻는다. */
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

/** 고르게 뽑는다 — 앞쪽만 쏠리면 「새로 낸 것」만 재게 된다 */
function 고르게(것들, 몇개) {
  if (것들.length <= 몇개) return 것들;
  const 걸음 = 것들.length / 몇개;
  return Array.from({ length: 몇개 }, (_, i) => 것들[Math.floor(i * 걸음)]);
}

const 셈 = {};
for (const [이름, 사이트맵] of [
  ['한국', 'companies'], ['일본', 'japan'], ['대만', 'taiwan'], ['걸프', 'uae'],
]) {
  const xml = await fetch(`https://seoulmarkets.com/sitemap-${사이트맵}.xml`).then((r) => r.text());
  const 전부 = [...xml.matchAll(/<loc>([^<]*\/company\/[^<]*)<\/loc>/g)].map((m) => m[1]);
  const 고른것 = 고르게(전부, 4);
  console.log(`\n■ ${이름} — 회사 지면 ${전부.length}장 가운데 ${고른것.length}장을 묻는다`);
  for (const u of 고른것) {
    let i = null;
    try {
      const r = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
        method: 'POST', headers: { Authorization: 'Bearer ' + 토큰, 'Content-Type': 'application/json' },
        body: JSON.stringify({ inspectionUrl: u, siteUrl: 'sc-domain:seoulmarkets.com' }),
      }).then((x) => x.json());
      i = r.inspectionResult?.indexStatusResult ?? null;
    } catch (e) { /* 못 물으면 못물음으로 센다 */ }
    const d = 진단(i);
    셈[d.갈래] = (셈[d.갈래] || 0) + 1;
    console.log(`   ${d.빛} ${u.replace('https://seoulmarkets.com', '').padEnd(44)} ${d.말}`);
    await new Promise((x) => setTimeout(x, 1200));
  }
}
console.log('\n■ 회사 지면 갈래별');
for (const [k, v] of Object.entries(셈).sort((a, b) => b[1] - a[1])) console.log(`   ${String(v).padStart(3)}장  ${k}`);
