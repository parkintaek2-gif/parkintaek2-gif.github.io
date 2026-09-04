#!/usr/bin/env node
/**
 * fetch-gsc.mjs — **네 사이트 아무거나** 검색 실적을 받아 온다 (질의별·지면별).
 * ─────────────────────────────────────────────────────────────────────────────
 * [왜 — 2026-09-04 · 5번]
 *   `check-navigational-impressions.mjs` 가 읽던 자료가 **창 2026-07-26~08-23** 이었다.
 *   재던 날 기준으로 **12일 낡은 것**이고, 그 사이 KCW 만 해도 수십 편을 냈다.
 *   ⛔ **낡은 창으로 콘텐트를 정하면, 이미 지나간 수요를 좇는다.**
 *
 *   받는 길은 이미 있었다 — `fetch-gsc-100y-queries.mjs`. 다만 **한 사이트에 박혀** 있었고
 *   («100yearmap» · «query» 한 갈래), 그래서 다른 세 사이트는 받을 자가 없었다.
 *   ⭐ 새로 짓지 않고 **그 자의 인증을 그대로 가져와 사이트·갈래만 열었다.**
 *
 * [⚠ 못 하는 것]
 *   ⬜ 서비스 계정이 그 속성에 «권한»이 없으면 못 받는다. 그때는 「못 쟀다」로 끝낸다 —
 *     빈 파일을 쓰지 않는다. 빈 파일은 「노출이 0 이다」로 잘못 읽힌다.
 *   ⬜ 구글은 마지막 사흘을 안 준다. 그래서 끝날을 «사흘 전»으로 잡는다.
 *
 * 쓰는 법
 *   node scripts/fetch-gsc.mjs --사이트 kcw
 *   node scripts/fetch-gsc.mjs --사이트 kcw --갈래 page
 *   node scripts/fetch-gsc.mjs --사이트 kcw --갈래 query+page   어느 물음에 «어느 지면»이 뜨나
 *   node scripts/fetch-gsc.mjs --모두              네 사이트 · 세 갈래를 다 받는다
 *   node scripts/fetch-gsc.mjs --자가시험
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createSign } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** ⚠ 이름을 한 곳에만 둔다 — 두 곳에 두면 어긋난다 */
export const 사이트들 = {
  kcw: { 속성: 'sc-domain:kculturewire.com', 딱지: 'kcw' },
  '100y': { 속성: 'sc-domain:100yearmap.com', 딱지: '100y' },
  seoulmarkets: { 속성: 'sc-domain:seoulmarkets.com', 딱지: 'seoulmarkets' },
  klifemap: { 속성: 'sc-domain:klifemap.ai', 딱지: 'klifemap' },
};
/* ⭐ [2026-09-04] 「질의×지면」을 더한다.
   질의만 보면 «무엇을 묻는지»는 알아도 «우리 어느 지면이 그 자리에 섰는지»를 모른다.
   그걸 모르면 처방이 갈린다 — 맞는 지면이 뜨는데 자리가 낮은 것과,
   엉뚱한 지면이 뜨는 것은 «완전히 다른 병»이다. */
export const 갈래들 = ['query', 'page', 'query+page'];

/**
 * 낼 파일 이름. ⚠ 기존 자료와 «같은 꼴»이어야 읽던 자들이 그대로 읽는다.
 *
 * 🔴 [2026-09-04] **다른 창인데 같은 이름을 써서 28일치를 덮어 버렸다.**
 *   `--일수 7` 로 받았더니 끝날이 같아 `gsc-kcw-qp-2026-09-01.json` 을 그대로 밀었다.
 *   28일치 471줄이 7일치 306줄로 바뀌었고, 오류도 경고도 없었다.
 *   커밋돼 있어 되살렸지만, 안 되어 있었으면 «조용히» 잃었을 자리다.
 * ✅ 그래서 28일이 아니면 이름에 «창 길이»를 넣는다. 28일치는 이름이 그대로라 읽던 자들이 산다.
 */
export function 낼이름(딱지, 갈래, 끝날, 일수 = 28) {
  const 가운데 = 갈래 === 'page' ? '-page' : 갈래 === 'query+page' ? '-qp' : '';
  const 창 = Number(일수) === 28 ? '' : `-${Number(일수)}d`;
  return `src/data/gsc-${딱지}${가운데}${창}-${끝날}.json`;
}

/** 구글이 주는 마지막 날. ⚠ 오늘이 아니다 — 마지막 사흘은 아직 안 굳었다 */
export function 창잡기(오늘 = new Date(), 일수 = 28) {
  const 끝 = new Date(오늘.getTime() - 3 * 864e5);
  const 첫 = new Date(오늘.getTime() - (일수 + 3) * 864e5);
  const 적기 = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { 첫날: 적기(첫), 끝날: 적기(끝) };
}

function 환경읽기() {
  try {
    const 본문 = readFileSync(path.join(뿌리, '.env'), 'utf8');
    for (const 줄 of 본문.split(/\r?\n/)) {
      const m = 줄.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  } catch { /* 없으면 그만 */ }
}

async function 토큰받기() {
  const 키파일 = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!키파일) throw new Error('GOOGLE_APPLICATION_CREDENTIALS 가 .env 에 없다');
  const 키 = JSON.parse(readFileSync(키파일, 'utf8'));
  const 지금초 = Math.floor(Date.now() / 1000);
  const 머리 = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const 몸 = Buffer.from(JSON.stringify({
    iss: 키.client_email, scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token', iat: 지금초, exp: 지금초 + 3600,
  })).toString('base64url');
  const 서명 = createSign('RSA-SHA256').update(`${머리}.${몸}`).sign(키.private_key, 'base64url');
  const 답 = await (await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${머리}.${몸}.${서명}`,
    }),
  })).json();
  if (!답.access_token) throw new Error('토큰 실패');
  return { 토큰: 답.access_token, 계정: 키.client_email };
}

async function 하나받기(토큰, 이름, 갈래, 일수) {
  const 곳 = 사이트들[이름];
  const { 첫날, 끝날 } = 창잡기(new Date(), 일수);
  const r = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(곳.속성)}/searchAnalytics/query`,
    { method: 'POST',
      headers: { Authorization: `Bearer ${토큰}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: 첫날, endDate: 끝날,
        dimensions: 갈래 === 'query+page' ? ['query', 'page'] : [갈래], rowLimit: 25000 }) });
  const j = await r.json();
  /* ⛔ 못 받으면 «빈 파일을 안 쓴다». 빈 파일은 「노출이 0」으로 잘못 읽힌다 */
  if (j.error) return { 됐나: false, 왜: j.error.message };
  const rows = (j.rows ?? []).map((x) => (갈래 === 'query+page'
    ? { key: x.keys[0], page: x.keys[1], impressions: x.impressions, clicks: x.clicks, position: x.position }
    : { key: x.keys[0], impressions: x.impressions, clicks: x.clicks, position: x.position }));
  const 이름길 = 낼이름(곳.딱지, 갈래, 끝날, 일수);
  writeFileSync(path.join(뿌리, 이름길), `${JSON.stringify({
    site: 곳.속성, dimension: 갈래, window: { from: 첫날, to: 끝날, days: 일수 }, rowLimit: 25000, rows,
  }, null, 2)}\n`);
  const 노출 = rows.reduce((a, x) => a + x.impressions, 0);
  const 클릭 = rows.reduce((a, x) => a + x.clicks, 0);
  return { 됐나: true, 길: 이름길, 줄수: rows.length, 노출, 클릭, 첫날, 끝날 };
}

/* ─── 자가시험 ────────────────────────────────────────────────────────────── */

function 자가시험() {
  let 통과 = 0; const 실패 = [];
  const 검 = (이름, 참) => { if (참 === true) 통과 += 1; else 실패.push(이름); };

  검('네 사이트가 다 들어 있다', Object.keys(사이트들).length === 4);
  검('속성 이름이 다 sc-domain 꼴', Object.values(사이트들).every((x) => x.속성.startsWith('sc-domain:')));
  검('딱지가 서로 다르다', new Set(Object.values(사이트들).map((x) => x.딱지)).size === 4);

  /* 낼 이름이 «기존 자료와 같은 꼴»이어야 읽던 자들이 그대로 읽는다 */
  검('질의 파일 이름이 기존과 같은 꼴',
    낼이름('kcw', 'query', '2026-08-26') === 'src/data/gsc-kcw-2026-08-26.json');
  검('지면 파일 이름이 기존과 같은 꼴',
    낼이름('kcw', 'page', '2026-08-26') === 'src/data/gsc-kcw-page-2026-08-26.json');
  검('100y 도 기존과 같은 꼴',
    낼이름('100y', 'query', '2026-08-29') === 'src/data/gsc-100y-2026-08-29.json');

  /* 창 — ⚠ toISOString 을 쓰면 KST 새벽에 하루가 어긋난다. 그 덫을 시험으로 막는다 */
  const c = 창잡기(new Date(2026, 8, 4, 6, 55), 28);
  검('끝날은 사흘 전이다', c.끝날 === '2026-09-01');
  검('첫날은 31일 전이다', c.첫날 === '2026-08-04');
  const 새벽 = 창잡기(new Date(2026, 8, 4, 0, 30), 28);
  검('⚠ 새벽 0시 30분에도 날이 안 어긋난다 (toISOString 덫)', 새벽.끝날 === '2026-09-01');
  const 연말 = 창잡기(new Date(2027, 0, 1, 9, 0), 28);
  검('해가 바뀌어도 맞는다', 연말.끝날 === '2026-12-29' && 연말.첫날 === '2026-12-01');
  검('일수를 바꾸면 첫날만 움직인다', (() => {
    const a = 창잡기(new Date(2026, 8, 4), 28), b = 창잡기(new Date(2026, 8, 4), 90);
    return a.끝날 === b.끝날 && a.첫날 !== b.첫날;
  })());
  검('갈래 셋이 다 있다', 갈래들.length === 3
    && ['query', 'page', 'query+page'].every((g) => 갈래들.includes(g)));
  검('질의×지면 파일 이름이 다른 둘과 안 겹친다', (() => {
    const 셋 = 갈래들.map((g) => 낼이름('kcw', g, '2026-09-01'));
    return new Set(셋).size === 3 && 셋[2].endsWith('-qp-2026-09-01.json');
  })());
  /* 🔴 [2026-09-04] 창이 달라도 이름이 같아 28일치를 덮어 버렸다. 그 덫을 시험으로 막는다 */
  검('🔴 창이 다르면 이름도 달라야 한다 (28일치를 덮지 않는다)',
    낼이름('kcw', 'query+page', '2026-09-01', 7) !== 낼이름('kcw', 'query+page', '2026-09-01', 28));
  검('7일치는 이름에 창 길이가 붙는다',
    낼이름('kcw', 'query+page', '2026-09-01', 7) === 'src/data/gsc-kcw-qp-7d-2026-09-01.json');
  검('28일치는 이름이 «그대로»다 (읽던 자들이 산다)',
    낼이름('kcw', 'page', '2026-09-01', 28) === 'src/data/gsc-kcw-page-2026-09-01.json');
  검('90일치도 갈린다', 낼이름('100y', 'query', '2026-09-01', 90) === 'src/data/gsc-100y-90d-2026-09-01.json');

  if (실패.length) {
    console.error(`❌ 자가시험 실패 ${실패.length}\n${실패.map((s) => `   · ${s}`).join('\n')}`);
    return false;
  }
  console.log(`✅ 자가시험 ${통과}개 전부 통과`);
  return true;
}

/* ─── 직접 돌릴 때 ────────────────────────────────────────────────────────── */

if (process.argv[1] && process.argv[1].endsWith('fetch-gsc.mjs')) {
  if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);
  환경읽기();

  const 인자 = (이름, 기본 = null) => {
    const i = process.argv.indexOf(`--${이름}`);
    return i >= 0 ? process.argv[i + 1] : 기본;
  };
  const 일수 = Number(인자('일수', 28));
  const 모두 = process.argv.includes('--모두');
  const 고른사이트 = 모두 ? Object.keys(사이트들) : [인자('사이트', 'kcw')];
  const 고른갈래 = 모두 ? 갈래들 : [인자('갈래', 'query')];

  for (const s of 고른사이트) {
    if (!사이트들[s]) { console.error(`⛔ 모르는 사이트 「${s}」 — ${Object.keys(사이트들).join(' · ')}`); process.exit(1); }
  }

  let 토큰; let 계정;
  try { ({ 토큰, 계정 } = await 토큰받기()); }
  catch (e) { console.error(`⛔ ${e.message} — **못 쟀다.** 빈 파일을 쓰지 않는다`); process.exit(1); }
  console.log(`서비스 계정 ${계정}\n`);

  let 받은것 = 0; const 못받은것 = [];
  for (const s of 고른사이트) {
    for (const g of 고른갈래) {
      const r = await 하나받기(토큰, s, g, 일수);
      if (!r.됐나) {
        console.log(`  ⬜ ${s} · ${g} — **못 쟀다**: ${r.왜.slice(0, 90)}`);
        못받은것.push(`${s}/${g}`);
        continue;
      }
      받은것 += 1;
      console.log(`  ✅ ${s} · ${g} — ${r.줄수}줄 · 노출 ${r.노출.toLocaleString('ko-KR')} · 클릭 ${r.클릭.toLocaleString('ko-KR')}`
        + `  (${r.첫날}~${r.끝날})\n       → ${r.길}`);
    }
  }
  console.log(`\n받은 것 ${받은것}개${못받은것.length ? ` · **못 쟀다** ${못받은것.length}개 — ${못받은것.join(' · ')}` : ''}`);
  if (못받은것.length) {
    console.log('⚠ 「못 쟀다」는 「노출이 0」이 아니다. 서비스 계정에 그 속성 권한이 없을 수 있다.');
  }
}
