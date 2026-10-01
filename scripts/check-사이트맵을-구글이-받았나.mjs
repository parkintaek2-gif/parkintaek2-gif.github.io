#!/usr/bin/env node
/**
 * check-사이트맵을-구글이-받았나.mjs — **구글이 우리 사이트맵을 «언제» 받아 갔나.**
 *
 * 🔴🔴 [2026-10-01 · 5번] 케이라이프맵에서 글 2,847편이 «한 번도 크롤 안 됨»으로 나왔다.
 *   사이트맵·robots·내부링크·쪽넘김을 다 재 봤는데 전부 멀쩡했다.
 *   그러면 남은 물음은 하나다 — **구글이 사이트맵을 받아 가기는 했나.**
 *   「제출했다」와 「구글이 받아 갔다」는 다른 말이다. 제출만 하고 믿어 왔다.
 *
 * ⛔ 「냈다」를 「됐다」로 읽지 않는다. 구글이 적어 둔 날짜를 본다.
 *
 * 쓰는 법
 *   node scripts/check-사이트맵을-구글이-받았나.mjs
 *   node scripts/check-사이트맵을-구글이-받았나.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSign } from 'node:crypto';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const 사이트들 = [
  'sc-domain:klifemap.ai',
  'sc-domain:seoulmarkets.com',
  'sc-domain:kculturewire.com',
  'sc-domain:100yearmap.com',
];

/** 구글이 적어 준 날짜가 얼마나 지났나 (일). 없으면 null */
export function 며칠전(iso, 지금 = Date.now()) {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return Math.floor((지금 - t) / (24 * 60 * 60 * 1000));
}

/** 한 사이트맵 줄을 읽기 쉽게 — ⛔ 못 받은 것을 「0개」로 적지 않는다 */
export function 한줄로(s) {
  const 쓴것 = (s?.contents ?? []).reduce((a, c) => a + Number(c.submitted || 0), 0);
  const 색인 = (s?.contents ?? []).reduce((a, c) => a + Number(c.indexed || 0), 0);
  return {
    주소: s?.path ?? '(모름)',
    받아간날: s?.lastDownloaded ?? null,
    지난날: 며칠전(s?.lastDownloaded),
    낸주소수: 쓴것 || null,
    오류: Number(s?.errors || 0),
    경고: Number(s?.warnings || 0),
    /* ⚠ 구글은 sitemaps API 의 indexed 를 더는 안 채운다. 0 을 「색인 0」으로 읽지 않는다 */
    색인수_믿지말것: 색인,
  };
}

/** 빛 — 받아 간 적이 없거나 오래됐으면 빨강 */
export function 빛(줄) {
  if (!줄.받아간날) return '🔴';
  if (줄.오류 > 0) return '🔴';
  if (줄.지난날 !== null && 줄.지난날 > 14) return '🟡';
  return '✅';
}

if (process.argv.includes('--자가시험') || process.argv.includes('--selftest')) {
  let 통과 = 0; let 실패 = 0;
  const 검 = (이름, 참) => { if (참) { 통과 += 1; console.log('✅ ' + 이름); } else { 실패 += 1; console.log('🔴 ' + 이름); } };
  const 지금 = Date.parse('2026-10-01T00:00:00Z');

  검('며칠 지났는지 센다', 며칠전('2026-09-21T00:00:00Z', 지금) === 10);
  검('⛔ 없으면 null — 0 으로 메우지 않는다', 며칠전(null) === null && 며칠전('말도안됨') === null);
  검('⛔ 한 번도 안 받아 갔으면 빨강', 빛(한줄로({ path: 'a' })) === '🔴');
  검('오류가 있으면 빨강', 빛({ 받아간날: '2026-10-01', 지난날: 0, 오류: 2 }) === '🔴');
  검('보름 넘게 안 받아 갔으면 노랑', 빛({ 받아간날: 'x', 지난날: 20, 오류: 0 }) === '🟡');
  검('어제 받아 갔으면 초록', 빛({ 받아간날: 'x', 지난날: 1, 오류: 0 }) === '✅');
  검('낸 주소 수를 더한다', 한줄로({ contents: [{ submitted: '10' }, { submitted: '5' }] }).낸주소수 === 15);
  검('⛔ 빈 것에도 안 터진다', 한줄로(null).주소 === '(모름)');

  console.log(`\n${실패 === 0 ? '✅' : '🔴'} 자가시험 ${통과 + 실패}개 중 통과 ${통과}개`);
  process.exit(실패 === 0 ? 0 : 1);
}

/* ── 열쇠 ─────────────────────────────────────────────────── */
function 환경읽기() {
  const 길 = path.join(뿌리, '.env');
  if (!fs.existsSync(길)) return;
  for (const 줄 of fs.readFileSync(길, 'utf8').split('\n')) {
    const m = 줄.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, '');
  }
}
환경읽기();

async function 토큰만들기() {
  const 열쇠길 = process.env.GOOGLE_APPLICATION_CREDENTIALS
    || path.join(뿌리, 'secrets', 'search-console-sa.json');
  const sa = JSON.parse(fs.readFileSync(열쇠길, 'utf8'));
  const 머리 = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const 이제 = Math.floor(Date.now() / 1000);
  const 몸 = Buffer.from(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: 이제 + 3600, iat: 이제,
  })).toString('base64url');
  const 서명 = createSign('RSA-SHA256').update(`${머리}.${몸}`).sign(sa.private_key).toString('base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${머리}.${몸}.${서명}`,
    }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error('토큰을 못 받았다 — ' + JSON.stringify(j).slice(0, 160));
  return j.access_token;
}

const 토큰 = await 토큰만들기();
console.log('■ 구글이 우리 사이트맵을 «받아 갔나»\n');
let 빨강 = 0;
for (const site of 사이트들) {
  const r = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/sitemaps`, {
    headers: { Authorization: 'Bearer ' + 토큰 },
  });
  const j = await r.json();
  if (!r.ok) { console.log(`   ⬜ ${site} — 못 물었다 (${r.status} ${String(j.error?.message || '').slice(0, 70)})`); continue; }
  const 목록 = j.sitemap ?? [];
  if (!목록.length) { console.log(`   🔴 ${site} — **사이트맵이 하나도 등록돼 있지 않다**`); 빨강 += 1; continue; }
  console.log(`   ${site}`);
  for (const s of 목록) {
    const 줄 = 한줄로(s);
    const b = 빛(줄);
    if (b === '🔴') 빨강 += 1;
    const 언제 = 줄.받아간날 ? `${줄.지난날}일 전` : '**한 번도 안 받아 갔다**';
    console.log(`     ${b} ${줄.주소.replace(/^https?:\/\/[^/]+/, '').padEnd(26)}`
      + ` 받아간 때 ${언제.padEnd(22)} 낸 주소 ${줄.낸주소수 ?? '못 쟀다'}`
      + (줄.오류 ? ` · 🔴 오류 ${줄.오류}` : '') + (줄.경고 ? ` · 경고 ${줄.경고}` : ''));
  }
}
console.log(`\n${빨강 ? `🔴 손봐야 할 자리 ${빨강}개` : '✅ 네 사이트 모두 구글이 사이트맵을 받아 갔다'}`);
console.log('⚠ 「받아 갔다」와 「색인했다」는 다른 말이다 — 색인은 check-색인-왜안되나.mjs 가 묻는다.');
