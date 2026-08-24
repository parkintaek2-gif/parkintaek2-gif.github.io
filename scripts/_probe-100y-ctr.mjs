/**
 * _probe-100y-ctr.mjs — 순위는 좋은데 클릭이 0인 검색어가 **어느 지면**인지 찾는다.
 * (3번 임시 조사자 — search-console-report.mjs 의 JWT 방식을 그대로 따른다, 남의 파일 안 고침)
 *
 * 쓰는 법  node scripts/_probe-100y-ctr.mjs "검색어"
 */
import { readFileSync } from 'node:fs';
import { createSign } from 'node:crypto';
import path from 'node:path';

(function 환경파일읽기() {
  const 본문 = readFileSync(path.resolve('.env'), 'utf8');
  for (const 줄 of 본문.split(/\r?\n/)) {
    const m = 줄.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    const 값 = m[2].trim().replace(/^["']|["']$/g, '');
    if (process.env[m[1]] === undefined) process.env[m[1]] = 값;
  }
})();

const 키 = JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'));
function jwt만들기() {
  const 지금 = Math.floor(Date.now() / 1000);
  const 헤더 = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const 몸 = Buffer.from(JSON.stringify({
    iss: 키.client_email, scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token', iat: 지금, exp: 지금 + 3600,
  })).toString('base64url');
  const 서명대상 = `${헤더}.${몸}`;
  const 서명 = createSign('RSA-SHA256').update(서명대상).sign(키.private_key, 'base64url');
  return `${서명대상}.${서명}`;
}
async function 토큰받기() {
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt만들기() }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error(`토큰 실패: ${JSON.stringify(j)}`);
  return j.access_token;
}

const 검색어 = process.argv[2];
if (!검색어) { console.error('쓰기: node scripts/_probe-100y-ctr.mjs "검색어"'); process.exit(1); }

const 토큰 = await 토큰받기();
const r = await fetch(
  'https://www.googleapis.com/webmasters/v3/sites/sc-domain%3A100yearmap.com/searchAnalytics/query',
  {
    method: 'POST',
    headers: { Authorization: `Bearer ${토큰}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      startDate: '2026-07-25', endDate: '2026-08-22',
      dimensions: ['page', 'query'],
      dimensionFilterGroups: [{ filters: [{ dimension: 'query', operator: 'equals', expression: 검색어 }] }],
      rowLimit: 10,
    }),
  },
);
const j = await r.json();
console.log(JSON.stringify(j, null, 1));
