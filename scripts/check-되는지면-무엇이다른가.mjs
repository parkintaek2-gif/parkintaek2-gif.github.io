#!/usr/bin/env node
/**
 * check-되는지면-무엇이다른가.mjs — **되는 지면과 안 되는 지면이 무엇이 다른가.**
 *
 * ── 🔴 왜 (2026-10-06 00:1x · 5번) ───────────────────────────────────
 *   사장님: 「**언제까지 검색에 우리 것이 잘 노출되는 걸 기다려야 하냐?**」
 *
 *   재 보니 KLifeMap 진짜 손님 60명 가운데 **36명이 `/mansecalendar.html` 한 장**으로
 *   들어오고 **309초(5분)** 를 머문다. 구글 전체는 1명이다.
 *   ⇒ 되는 것이 하나 있다. **그것이 왜 되는지 알아야 복제한다.**
 *
 * ── ⛔ 짐작하지 않는다 ───────────────────────────────────────────────
 *   「만세력이 도구라서 되나 보다」로 넘어가지 않는다. **GA4 에 물어서 가른다** —
 *   지면마다 사람 수·머문 시간·이탈을 재고, 되는 쪽과 안 되는 쪽의 차이를 본다.
 *
 * ── ⭐ 무엇에 쓰나 ───────────────────────────────────────────────────
 *   「같은 꼴을 더 낸다」를 정하려면 **무엇이 같은 꼴인지**를 수로 알아야 한다.
 *   ⛔ 지면을 더 찍는 데 시간을 쓰지 않는다 — «되는 꼴»만 더 낸다.
 *
 * 쓰는 법
 *   node scripts/check-되는지면-무엇이다른가.mjs
 *   node scripts/check-되는지면-무엇이다른가.mjs --날수 90
 *   node scripts/check-되는지면-무엇이다른가.mjs --자가시험
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 여기 = path.dirname(fileURLToPath(import.meta.url));
const 뿌리 = path.join(여기, '..');
const 속성 = '549135289';

/**
 * 지면을 꼴로 가른다.
 * ⚠ 「도구」는 손님이 **무엇을 넣으면 답이 나오는** 지면이다 — 읽기만 하는 글과 다르다.
 * ⛔ 이 가르기를 바꿀 때는 왜 바꾸는지 적는다. 수가 따라 움직인다.
 */
export function 지면꼴(길) {
  const u = String(길 ?? '').split('?')[0];
  if (/^\/(mansecalendar|ilzin|saju|astro|mingli-gunghap|mingli-taekil|tarot|liuyao|gwansang|horoscope|man-nai|sinnyeon-unse)\.html$/.test(u)) return '도구';
  if (/^\/content\/star-q\d+/.test(u)) return '유명인(틀)';
  if (/^\/content\//.test(u)) return '글';
  if (/^\/(pricing|about|api|coaching|psychometrics)\.html$/.test(u)) return '안내';
  if (u === '/' || u === '/index.html') return '첫 화면';
  return '그 밖';
}

/** 머문 시간이 길수록 좋다. ⛔ 0초는 「안 머물렀다」가 아니라 «못 쟀다»일 수 있다 */
export function 머문것읽기(초) {
  const n = Number(초);
  if (!Number.isFinite(n)) return null;
  return Math.round(n);
}

/* ── 자가시험 ─────────────────────────────────────────────── */
export function 자가시험() {
  let 통과 = 0; let 깨짐 = 0;
  const 본다 = (말, 참) => { if (참) { 통과++; console.log(`  ✅ ${말}`); } else { 깨짐++; console.log(`  🔴 ${말}`); } };

  console.log('\n■ 되는 지면 가르기 — 자가시험\n');
  본다('🔴 만세력은 도구다 — 36명을 데려오는 그 지면이다', 지면꼴('/mansecalendar.html') === '도구');
  본다('오늘의 운세도 도구다', 지면꼴('/ilzin.html') === '도구');
  본다('⚠ 꼬리가 붙어도 같은 꼴로 본다', 지면꼴('/saju.html?cdb=eyJ') === '도구');
  본다('유명인 지면은 틀로 찍은 것이다', 지면꼴('/content/star-q20145-saju') === '유명인(틀)');
  본다('사람이 쓴 글은 글이다', 지면꼴('/content/tti-2026-so') === '글');
  본다('첫 화면을 가른다', 지면꼴('/') === '첫 화면' && 지면꼴('/index.html') === '첫 화면');
  본다('요금은 안내다', 지면꼴('/pricing.html') === '안내');
  본다('⛔ 빈 것에도 안 터진다', 지면꼴(null) === '그 밖');
  본다('머문 시간을 읽는다', 머문것읽기('309.4') === 309);
  본다('⛔ 못 읽으면 null — 0 으로 치지 않는다', 머문것읽기('없음') === null);

  console.log(`\n  통과 ${통과} · 깨짐 ${깨짐}\n`);
  return 깨짐 === 0;
}

/* ── 혼자 돌 때 ───────────────────────────────────────────── */
const 내가실행됐다 = Boolean(process.argv[1]) && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && (process.argv.includes('--자가시험') || process.argv.includes('--selftest'))) {
  process.exit(자가시험() ? 0 : 1);
}

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

function 날글(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

if (내가실행됐다) {
  const 날수 = (() => {
    const i = process.argv.indexOf('--날수');
    return i >= 0 && process.argv[i + 1] ? Number(process.argv[i + 1]) : 28;
  })();

  const 열쇠 = 열쇠읽기();
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
  if (!답.access_token) { console.log('🔴 토큰 실패'); process.exit(1); }
  const 토큰 = 답.access_token;

  const 끝 = new Date();
  const 시작 = new Date(끝.getTime() - (날수 - 1) * 86400000);

  const r = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${속성}:runReport`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${토큰}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dateRanges: [{ startDate: 날글(시작), endDate: 날글(끝) }],
      /* 🔴 [2026-10-06 00:2x] 처음에 지면 길만 물었더니 /esports-games · /rates 가 섞였다 —
         이 GA4 속성 하나에 네 사이트가 다 들어 있다. 호스트를 함께 물어 가른다.
         ⛔ 섞인 채로 재면 「KLifeMap 지면이 몇 명」이 통째로 거짓이 된다. */
      dimensions: [{ name: 'landingPagePlusQueryString' }, { name: 'hostName' }],
      metrics: [
        { name: 'totalUsers' },
        { name: 'sessions' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
      ],
      orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
      limit: 200,
    }),
  });
  if (!r.ok) { console.log('🔴 GA4 ' + r.status); process.exit(1); }
  const j = await r.json();

  console.log(`■ 되는 지면과 안 되는 지면이 무엇이 다른가 — ${날글(시작)} ~ ${날글(끝)} (KLifeMap)`);
  console.log('   🔴 진짜 손님 60명 가운데 36명이 만세력 한 장으로 들어온다. 구글 전체는 1명이다\n');

  const 꼴별 = {};
  for (const row of (j.rows ?? [])) {
    const 길 = row.dimensionValues[0].value;
    const 호스트 = row.dimensionValues[1].value;
    if (호스트 && !/klifemap/i.test(호스트)) continue;   /* ⛔ 남의 사이트를 안 섞는다 */
    const 꼴 = 지면꼴(길);
    const 사람 = Number(row.metricValues[0].value);
    const 세션 = Number(row.metricValues[1].value);
    const 초 = 머문것읽기(row.metricValues[2].value);
    if (!꼴별[꼴]) 꼴별[꼴] = { 사람: 0, 세션: 0, 초합: 0, 초잰세션: 0, 지면: 0 };
    const x = 꼴별[꼴];
    x.사람 += 사람; x.세션 += 세션; x.지면 += 1;
    /* ⛔ 못 잰 것을 0 으로 더하지 않는다 — 평균이 거짓으로 낮아진다 */
    if (초 !== null) { x.초합 += 초 * 세션; x.초잰세션 += 세션; }
  }

  console.log('   꼴            사람   세션   지면수   한 세션이 머문 시간');
  for (const [꼴, x] of Object.entries(꼴별).sort((a, b) => b[1].사람 - a[1].사람)) {
    const 평균 = x.초잰세션 ? Math.round(x.초합 / x.초잰세션) : null;
    console.log(`   ${꼴.padEnd(12)} ${String(x.사람).padStart(5)}  ${String(x.세션).padStart(5)}`
      + `  ${String(x.지면).padStart(6)}   ${평균 === null ? '못 쟀다' : 평균 + '초'}`);
  }

  console.log('\n   ■ 사람이 가장 많이 들어온 지면 열 장');
  const 우리것 = (j.rows ?? []).filter((x) => { const h = x.dimensionValues[1]?.value; return !h || /klifemap/i.test(h); });
  for (const row of 우리것.slice(0, 10)) {
    const 길 = row.dimensionValues[0].value;
    const 초 = 머문것읽기(row.metricValues[2].value);
    console.log(`   ${String(row.metricValues[0].value).padStart(5)}명  ${String((초 ?? 0) + '초').padStart(7)}`
      + `  [${지면꼴(길)}]  ${길.slice(0, 54)}`);
  }

  console.log('\n⭐ 되는 꼴을 알아야 «같은 꼴»을 더 낸다. ⛔ 지면을 그냥 더 찍지 않는다');
}
