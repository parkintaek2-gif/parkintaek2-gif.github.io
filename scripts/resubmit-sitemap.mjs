#!/usr/bin/env node
/**
 * 사이트맵 재제출 — 4번이 klifemap.ai에서 찾은 병(구글이 3주째 sitemap.xml을 안 읽음)을
 * 나머지 세 사이트(seoulmarkets·100yearmap·kculturewire)에도 같은 방식으로 확인·재제출한다.
 *
 * 쓰기:
 *   node scripts/resubmit-sitemap.mjs sc-domain:seoulmarkets.com https://seoulmarkets.com/sitemap.xml
 *   node scripts/resubmit-sitemap.mjs sc-domain:seoulmarkets.com https://seoulmarkets.com/sitemap.xml --누른다
 */
import { readFileSync } from 'node:fs';
import { createSign } from 'node:crypto';
import path from 'node:path';

(function 환경파일읽기() {
  try {
    const 본문 = readFileSync(path.resolve('.env'), 'utf8');
    for (const 줄 of 본문.split(/\r?\n/)) {
      const m = 줄.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
      if (!m) continue;
      const 값 = m[2].trim().replace(/^["']|["']$/g, '');
      if (process.env[m[1]] === undefined) process.env[m[1]] = 값;
    }
  } catch { /* 없으면 정상 */ }
})();

const 키파일 = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const 사이트 = process.argv[2];
const 사이트맵URL = process.argv[3];
const 누른다 = process.argv.includes('--누른다');

if (!사이트 || !사이트맵URL) {
  console.error('쓰기: node scripts/resubmit-sitemap.mjs sc-domain:seoulmarkets.com https://seoulmarkets.com/sitemap.xml [--누른다]');
  process.exit(1);
}
if (!키파일) { console.error('⛔ GOOGLE_APPLICATION_CREDENTIALS 가 .env 에 없다'); process.exit(1); }

const 키 = JSON.parse(readFileSync(키파일, 'utf8'));

function jwt만들기() {
  const 지금 = Math.floor(Date.now() / 1000);
  const 헤더 = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const 몸 = Buffer.from(JSON.stringify({
    iss: 키.client_email,
    scope: 'https://www.googleapis.com/auth/webmasters',
    aud: 'https://oauth2.googleapis.com/token',
    iat: 지금,
    exp: 지금 + 3600,
  })).toString('base64url');
  const 서명대상 = `${헤더}.${몸}`;
  const 서명 = createSign('RSA-SHA256').update(서명대상).sign(키.private_key, 'base64url');
  return `${서명대상}.${서명}`;
}

async function 토큰받기() {
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt만들기() }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error(`토큰 실패: ${JSON.stringify(j)}`);
  return j.access_token;
}

async function main() {
  const 토큰 = await 토큰받기();

  const 목록r = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(사이트)}/sitemaps`,
    { headers: { Authorization: `Bearer ${토큰}` } },
  );
  const 목록 = await 목록r.json();
  if (목록.error) { console.error(`🔴 ${사이트}: ${목록.error.message}`); process.exit(1); }

  console.log(`■ ${사이트} — 구글이 아는 사이트맵`);
  for (const s of 목록.sitemap ?? []) {
    console.log(`   ${s.path}`);
    console.log(`   마지막으로 읽은 날: ${s.lastDownloaded ?? '(없음 — 한 번도 안 읽음)'}`);
    console.log(`   그때 잡힌 주소: ${s.contents?.[0]?.submitted ?? '?'}`);
  }
  if (!목록.sitemap?.length) console.log('   (등록된 사이트맵이 없다)');

  if (누른다) {
    const put = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(사이트)}/sitemaps/${encodeURIComponent(사이트맵URL)}`,
      { method: 'PUT', headers: { Authorization: `Bearer ${토큰}` } },
    );
    console.log(put.ok ? `✅ 재제출 완료 (${put.status})` : `🔴 재제출 실패 (${put.status})`);
  } else {
    console.log('(--누른다 안 붙여서 재제출은 안 했다. 상태만 봤다)');
  }
}

main().catch((e) => { console.error('🔴 실패:', e.message); process.exit(1); });
