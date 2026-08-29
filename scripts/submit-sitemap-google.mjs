#!/usr/bin/env node
/**
 * submit-sitemap-google.mjs — 구글 Search Console 에 사이트맵을 «제출»한다(크롤 재촉).
 *   방문 늘리기(사장님 2026-08-23): 우리는 색인 자체가 거의 안 돼 있다(28일 검색어 1개).
 *   ranking 전에 «크롤·색인»이 먼저다. 사이트맵 제출은 우리 소유 사이트에 대한 안전·가역 작업.
 *   search-console-report.mjs 와 같은 JWT 서명 방식, 다만 쓰기 scope(webmasters).
 * 쓰기: node scripts/submit-sitemap-google.mjs            (기본 사이트맵 제출)
 *        node scripts/submit-sitemap-google.mjs --list      (제출된 사이트맵 상태만 조회)
 */
import { readFileSync } from 'node:fs';
import { createSign } from 'node:crypto';
import path from 'node:path';

try { const 본문 = readFileSync(path.resolve('.env'), 'utf8'); for (const line of 본문.split('\n')) { const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m) { let 값 = m[2].replace(/^["']|["']$/g, ''); if (process.env[m[1]] === undefined) process.env[m[1]] = 값; } } } catch { /* ok */ }

const 키파일 = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!키파일) { console.error('⛔ GOOGLE_APPLICATION_CREDENTIALS 가 .env 에 없다'); process.exit(1); }
const 키 = JSON.parse(readFileSync(키파일, 'utf8'));
/*
 * 🔴 [2026-08-29] **여기 주소가 seoulmarkets 로 못박혀 있었다.**
 *   5번이 새 지면을 내고 「사이트맵을 구글에 알렸다」고 이 자를 돌렸더니 6번 사이트맵이
 *   제출됐다. 화면에는 ✅ 가 떴다 — ⛔ **성공 표시가 나온 채로 내 것은 하나도 안 알렸다.**
 *   자기 사이트를 못 고르는 자는 남의 것을 알리고 초록을 낸다.
 * ✅ 그래서 --사이트 로 고른다. 안 주면 예전처럼 seoulmarkets 다(쓰던 자리를 안 깬다).
 * ⚠ 서비스계정에 그 자산 권한이 없으면 403 이 온다. 그건 「못 알렸다」이지 실패가 아니다 —
 *   갈라서 적는다.
 */
const 사이트들 = {
  seoulmarkets: { site: 'sc-domain:seoulmarkets.com', map: 'https://seoulmarkets.com/sitemap.xml' },
  kculturewire: { site: 'sc-domain:kculturewire.com', map: 'https://www.kculturewire.com/sitemap.xml' },
  '100yearmap': { site: 'sc-domain:100yearmap.com', map: 'https://100yearmap.com/sitemap.xml' },
};
const 고른이름 = (() => {
  const i = process.argv.indexOf('--사이트');
  return i >= 0 ? process.argv[i + 1] : 'seoulmarkets';
})();
const 고른 = 사이트들[고른이름];
if (!고른) {
  console.error(`⛔ --사이트 ${고른이름} 를 모른다. 아는 것: ${Object.keys(사이트들).join(' · ')}`);
  process.exit(1);
}
const SITE = 고른.site;
const SITEMAP = 고른.map;
console.log(`■ ${고른이름} — ${SITEMAP}`);
const 쓰기 = !process.argv.includes('--list');

async function 토큰(scope) {
  const now = Math.floor(Date.now() / 1000);
  const 헤더 = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const 몸 = Buffer.from(JSON.stringify({ iss: 키.client_email, scope, aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 })).toString('base64url');
  const 서명 = createSign('RSA-SHA256').update(`${헤더}.${몸}`).sign(키.private_key, 'base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${헤더}.${몸}.${서명}` });
  const j = await r.json();
  if (!j.access_token) throw new Error('토큰 실패: ' + JSON.stringify(j));
  return j.access_token;
}

const base = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE)}/sitemaps`;

if (쓰기) {
  const tok = await 토큰('https://www.googleapis.com/auth/webmasters');
  const r = await fetch(`${base}/${encodeURIComponent(SITEMAP)}`, { method: 'PUT', headers: { Authorization: `Bearer ${tok}` } });
  if (r.status === 204 || r.ok) console.log(`✅ 사이트맵 제출됨 — ${SITEMAP} (HTTP ${r.status})`);
  else { console.log(`⚠ 제출 실패 HTTP ${r.status} — ${(await r.text()).slice(0, 200)}`); console.log('   (403이면 서비스계정에 쓰기 권한 없음 — 읽기전용만 부여됨. 사람이 SC에서 권한 올려야 함)'); process.exit(1); }
}

// 상태 조회(읽기 scope)
const rtok = await 토큰('https://www.googleapis.com/auth/webmasters.readonly');
const lr = await fetch(base, { headers: { Authorization: `Bearer ${rtok}` } });
const lj = await lr.json();
if (lj.sitemap) for (const s of lj.sitemap) console.log(`   · ${s.path} · 제출 ${s.lastSubmitted || '?'} · 처리 ${s.lastDownloaded || '아직'} · 경고 ${s.warnings || 0} · 오류 ${s.errors || 0}`);
else console.log('   (등록된 사이트맵 없음: ' + JSON.stringify(lj).slice(0, 150) + ')');
