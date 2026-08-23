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
const SITE = 'sc-domain:seoulmarkets.com';
const SITEMAP = 'https://seoulmarkets.com/sitemap.xml';
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
