/**
 * check-sitemap-pickup.mjs — **구글이 우리 사이트맵을 «받아 읽었나».** (5번, 2026-09-07)
 *
 * ── 왜 ───────────────────────────────────────────────────────
 * 2026-09-07 에 색인 판정을 표본으로 재 보니 klifemap 표본 25장 중 **12장이
 * 「URL is unknown to Google」** 이었다 — 구글이 «본 적조차 없다»는 말이다.
 * 그러면 첫 물음은 「사이트맵이 구글에 닿았나」다. 그것을 재는 자가 없었다.
 *
 * ⭐ 「제출했다」와 「구글이 내려받았다」와 「색인했다」는 **셋 다 다른 말**이다.
 *
 * ── ⛔ 이 자가 지키는 것 ────────────────────────────────────
 * ⛔ 🔴 응답의 `contents[].indexed` 를 «색인된 장수»로 읽지 않는다.
 *    구글이 그 값을 더는 채우지 않는다 — 네 사이트 다 0 으로 온다.
 *    실제로 색인된 지면이 있는 사이트도 0 이다. **0 을 「없다」로 읽으면 오진이 된다.**
 *    색인 장수는 `check-index-verdict.mjs` 로 «한 장씩 물어» 센다.
 * ⛔ 사이트맵이 여럿 잡히면 다 낸다 — www 와 non-www 가 따로 잡혀 있을 수 있다.
 *
 * 쓰는 법
 *   node scripts/check-sitemap-pickup.mjs
 *   node scripts/check-sitemap-pickup.mjs --시험만
 */
import fs from 'node:fs';
import path from 'node:path';
import { createSign } from 'node:crypto';

export const 사이트들 = {
  kcw: 'sc-domain:kculturewire.com',
  '100y': 'sc-domain:100yearmap.com',
  seoulmarkets: 'sc-domain:seoulmarkets.com',
  klifemap: 'sc-domain:klifemap.ai',
};

/** 며칠 전인가. ⛔ 값이 없으면 0 이 아니라 null */
export function 며칠전(때, 이제 = Date.now()) {
  if (!때) return null;
  const t = Date.parse(때);
  if (!Number.isFinite(t)) return null;
  return +((이제 - t) / 86400000).toFixed(1);
}

/**
 * 사이트맵 한 줄의 판정.
 * ⛔ indexed 를 절대 쓰지 않는다 — 구글이 안 채우는 값이다.
 */
export function 사이트맵재기(s, 이제 = Date.now()) {
  const 웹 = (s?.contents ?? []).find((c) => c.type === 'web') ?? {};
  const 지난날 = 며칠전(s?.lastDownloaded, 이제);
  let 판정 = '받아 갔다';
  if (지난날 === null) 판정 = '한 번도 안 받아 갔다';
  else if (지난날 > 7) 판정 = '오래됐다';
  return {
    길: s?.path ?? null,
    구글이받은때: s?.lastDownloaded ?? null,
    며칠전: 지난날,
    구글이센주소: Number(웹.submitted) || 0,
    오류: Number(s?.errors) || 0,
    경고: Number(s?.warnings) || 0,
    처리중: Boolean(s?.isPending),
    판정,
  };
}

/* ── 자가시험 ─────────────────────────────────────────────── */
function 자가시험() {
  let 통 = 0; let 실 = 0;
  const 봐 = (말, 참) => { if (참) { 통++; console.log('  ✅ ' + 말); } else { 실++; console.log('  🔴 ' + 말); } };
  const 이제 = Date.parse('2026-09-07T12:00:00Z');

  봐('네 사이트가 다 있다', Object.keys(사이트들).length === 4);
  봐('며칠 전을 낸다', 며칠전('2026-09-05T12:00:00Z', 이제) === 2);
  봐('⛔ 때가 없으면 0 이 아니라 null', 며칠전(null, 이제) === null);
  봐('⛔ 꼴이 아니어도 null', 며칠전('어제', 이제) === null);

  const 최근 = 사이트맵재기({
    path: 'https://x/sitemap.xml', lastDownloaded: '2026-09-06T00:00:00Z',
    contents: [{ type: 'web', submitted: '2821', indexed: '0' }], errors: '0', warnings: '0',
  }, 이제);
  봐('최근에 받아 간 것은 «받아 갔다»', 최근.판정 === '받아 갔다');
  봐('구글이 센 주소를 낸다', 최근.구글이센주소 === 2821);
  봐('🔴 indexed 를 아예 내지 않는다 — 구글이 안 채우는 값이다',
    !Object.keys(최근).some((k) => /색인|indexed/i.test(k)));

  const 오래 = 사이트맵재기({ path: 'p', lastDownloaded: '2026-08-01T00:00:00Z', contents: [] }, 이제);
  봐('일주일 넘으면 «오래됐다»', 오래.판정 === '오래됐다');

  const 없 = 사이트맵재기({ path: 'p', contents: [] }, 이제);
  봐('한 번도 안 받아 간 것을 따로 가른다', 없.판정 === '한 번도 안 받아 갔다');
  봐('그때 며칠전은 null 이다', 없.며칠전 === null);
  봐('주소 수가 없으면 0 으로 둔다(그 값은 구글이 준 것이라 0 이 맞다)', 없.구글이센주소 === 0);
  봐('오류·경고를 수로 낸다', 사이트맵재기({ path: 'p', lastDownloaded: '2026-09-06T00:00:00Z', errors: '3', warnings: '1', contents: [] }, 이제).오류 === 3);
  봐('처리 중을 참거짓으로 낸다', 사이트맵재기({ path: 'p', lastDownloaded: '2026-09-06T00:00:00Z', isPending: true, contents: [] }, 이제).처리중 === true);
  봐('⛔ 빈 것을 넣어도 안 터진다', 사이트맵재기(null, 이제).길 === null);

  console.log(`\n사이트맵 수거 검사 — 자가시험 ${통}가지 통과 · ${실}가지 실패`);
  if (실) process.exit(1);
  return 통;
}

/* ── 인증 ─────────────────────────────────────────────────── */
function 환경읽기() {
  try {
    const 본문 = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8');
    const LF = String.fromCharCode(10); const CR = String.fromCharCode(13);
    for (const 날 of 본문.split(LF)) {
      const 줄 = 날.split(CR).join('').trim();
      if (!줄 || 줄.startsWith('#')) continue;
      const i = 줄.indexOf('=');
      if (i <= 0) continue;
      const n = 줄.slice(0, i).trim();
      let v = 줄.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (n && process.env[n] === undefined) process.env[n] = v;
    }
  } catch { /* 없으면 그만 */ }
}

async function 토큰받기() {
  환경읽기();
  const 키파일 = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!키파일) throw new Error('GOOGLE_APPLICATION_CREDENTIALS 가 .env 에 없다');
  const 키 = JSON.parse(fs.readFileSync(키파일, 'utf8'));
  const t = Math.floor(Date.now() / 1000);
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const h = b64({ alg: 'RS256', typ: 'JWT' });
  const p = b64({
    iss: 키.client_email, scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token', iat: t, exp: t + 3600,
  });
  const sig = createSign('RSA-SHA256').update(`${h}.${p}`).sign(키.private_key, 'base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${h}.${p}.${sig}` }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error('토큰 실패 ' + JSON.stringify(j).slice(0, 160));
  return j.access_token;
}

async function 주된일() {
  const 통 = 자가시험();
  const tk = await 토큰받기();
  const 낼것 = { 잰때: new Date().toLocaleString('ko-KR'), 사이트: {} };

  for (const [이름, 속성] of Object.entries(사이트들)) {
    const u = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(속성)}/sitemaps`;
    const r = await fetch(u, { headers: { Authorization: `Bearer ${tk}` } });
    const j = await r.json();
    console.log(`\n=== ${이름} (${속성}) ===`);
    if (!r.ok) {
      console.log('  🔴', r.status, String(j?.error?.message ?? '').slice(0, 120));
      낼것.사이트[이름] = { 못받음: r.status };
      continue;
    }
    const 줄 = (j.sitemap ?? []).map((s) => 사이트맵재기(s));
    if (!줄.length) {
      console.log('  🔴 구글이 아는 사이트맵이 «0개» — 제출이 안 돼 있다');
      낼것.사이트[이름] = { 사이트맵: [] };
      continue;
    }
    for (const s of 줄) {
      const 표 = s.판정 === '받아 갔다' ? '✅' : s.판정 === '오래됐다' ? '⚠' : '🔴';
      console.log(`  ${표} ${s.길}`);
      console.log(`     구글이 받아 간 때 ${s.구글이받은때 ?? '⬜ 한 번도 없다'}`
        + (s.며칠전 === null ? '' : ` (${s.며칠전}일 전)`));
      console.log(`     구글이 센 주소 ${s.구글이센주소.toLocaleString('en-US')}장 · 오류 ${s.오류} · 경고 ${s.경고}`
        + (s.처리중 ? ' · ⚠ 처리 중' : ''));
    }
    낼것.사이트[이름] = { 사이트맵: 줄 };
  }

  console.log('\n⛔ 이 자는 «색인 장수»를 내지 않습니다.');
  console.log('   구글 응답의 indexed 값은 더는 채워지지 않아 네 사이트 다 0 으로 옵니다 —');
  console.log('   실제로 색인된 지면이 있는 사이트도 0 입니다. 0 을 「없다」로 읽으면 오진입니다.');
  console.log('   색인 장수는 node scripts/check-index-verdict.mjs 로 «한 장씩 물어» 셉니다.');

  const 어디 = path.join('src', 'data', `sitemap-pickup-${new Date().toISOString().slice(0, 10)}.json`);
  fs.writeFileSync(어디, JSON.stringify(낼것, null, 1), 'utf8');
  console.log(`\n📁 적었다 — ${어디}\n자가시험 ${통}가지 통과.`);
}

if (process.argv.includes('--시험만')) 자가시험();
else 주된일().catch((e) => { console.error('🔴', e.message); process.exit(1); });
