#!/usr/bin/env node
/**
 * 구글이-얼마나-오나.mjs — **구글이 이 사이트에 «오기는» 하나.**
 *
 * ── 🔴 왜 (2026-10-05 22:3x · 5번) ───────────────────────────────────
 *   사장님: 「**구글 검색을 장악해야해. ai만 보면 안돼. 둘 다 봐**」
 *
 *   klifemap.ai 가 28일 구글 노출 7회 · 뜨는 지면 2장이다(사이트맵은 3,007장).
 *   까닭을 찾느라 **가설 둘을 세웠다가 둘 다 재서 기각했다** —
 *   
 *   세 번째로 **사이트맵 3,009줄 중 2,887줄(96%)이 /content/* 자동 생성 글**인 것을
 *   보고 「크롤 예산을 그것들이 먹는다」고 보았다. 그래서 표본 여덟에 물었더니 —
 *
 *   🔴🔴 **여덟 장 모두 「URL is unknown to Google」. 구글이 한 번도 안 왔다.**
 *
 * ── ⭐ 그래서 알게 된 것 ─────────────────────────────────────────────
 *   문제는 「구글이 보고 값이 없다고 했다」가 아니라 **「구글이 거의 안 온다」**다.
 *   
 *   ⇒ **크롤 예산이 아주 적다.** 지면을 더 내도 구글이 안 오면 아무 일도 안 생긴다.
 *   ⇒ 크롤 예산을 늘리는 것은 **바깥에서 들어오는 링크**다.
 *     사장님이 「커뮤니티 잘 활용해서 순위를 무조건 높여」라고 하신 자리와 같다.
 *
 * ⛔ 「대부분 자동 생성이라 문제일 것」처럼 짐작으로 고치지 않는다. 재야 안다.
 * ⚠ URL 검사 API 는 하루 할당량이 있다 — 표본만 본다. 전수가 아니다.
 *
 * 쓰는 법
 *   node scripts/구글이-얼마나-오나.mjs                 (표본 파일을 읽는다)
 *   node scripts/구글이-얼마나-오나.mjs --주소목록 <파일>
 */
import fs from 'node:fs';
import path from 'node:path';

const 뿌리 = process.cwd();

function 환경읽기() {
  try {
    const 본문 = fs.readFileSync(path.join(뿌리, '.env'), 'utf8');
    for (const 줄 of 본문.split(/\r?\n/)) {
      const m = 줄.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  } catch { }
}
function 열쇠읽기() {
  환경읽기();
  for (const 이름 of ['gsc-sa.json', 'search-console-sa.json', 'ga4-sa.json']) {
    const p = path.join(뿌리, 'secrets', 이름);
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  }
  const env = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (env && fs.existsSync(env)) return JSON.parse(fs.readFileSync(env, 'utf8'));
  throw new Error('열쇠를 못 찾았다');
}

const 열쇠 = 열쇠읽기();
const { createSign } = await import('node:crypto');
const 지금초 = Math.floor(Date.now() / 1000);
const 머리 = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
const 몸 = Buffer.from(JSON.stringify({
  iss: 열쇠.client_email,
  scope: 'https://www.googleapis.com/auth/webmasters',
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
if (!답.access_token) { console.log('🔴 토큰 실패 — ' + JSON.stringify(답).slice(0, 160)); process.exit(1); }
const 토큰 = 답.access_token;

/* 주소 목록을 받는다. ⛔ 못 읽으면 지어내지 않고 멈춘다 */
const 목록길 = (() => {
  const i = process.argv.indexOf('--주소목록');
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1];
  return path.join(뿌리, 'tmp', '_구글표본.txt');
})();
let 주소들;
try {
  주소들 = fs.readFileSync(목록길, 'utf8').split(/\r?\n/)
    .map((l) => l.trim()).filter((l) => /^https?:\/\//.test(l));
} catch (e) {
  console.log('🔴 주소 목록을 못 읽었다 — ' + 목록길);
  console.log('   --주소목록 <파일> 로 한 줄에 한 주소씩 담은 파일을 준다');
  process.exit(1);
}
if (!주소들.length) {
  console.log('🔴 주소 목록이 비었다 — ' + 목록길);
  process.exit(1);
}

console.log('■ /content/* 표본 ' + 주소들.length + '장이 구글에 색인됐나');
console.log('   사이트맵 3,009줄 가운데 2,887줄(96%)이 이 꼴이다\n');

const 셈 = {};
for (const u of 주소들) {
  const r = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + 토큰, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inspectionUrl: u, siteUrl: 'sc-domain:klifemap.ai' }),
  });
  if (!r.ok) {
    console.log('   ⬜ 못 쟀다 (' + r.status + ') ' + u.replace('https://klifemap.ai', ''));
    셈['못 쟀다'] = (셈['못 쟀다'] ?? 0) + 1;
    continue;
  }
  const j = await r.json();
  const s = j.inspectionResult?.indexStatusResult ?? {};
  const 판 = s.coverageState ?? '(모름)';
  const 마지막 = s.lastCrawlTime ? s.lastCrawlTime.slice(0, 10) : '한 번도 안 옴';
  셈[판] = (셈[판] ?? 0) + 1;
  const 빛 = /Submitted and indexed|URL is on Google/i.test(판) ? '✅' : '🔴';
  console.log(`   ${빛} ${판.padEnd(42)} ${마지막}  ${u.replace('https://klifemap.ai', '')}`);
  await new Promise((r2) => setTimeout(r2, 400));
}

console.log('\n■ 갈래별');
for (const [k, v] of Object.entries(셈).sort((a, b) => b[1] - a[1])) {
  console.log(`   ${String(v).padStart(3)}장  ${k}`);
}
console.log('\n⛔ 표본 여덟이다 — 2,887장 전체를 잰 것이 아니다. 「경향」으로만 읽는다');
