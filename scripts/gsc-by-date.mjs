#!/usr/bin/env node
/**
 * gsc-by-date.mjs — **검색 노출·클릭을 «날짜 축»으로 본다.**
 *
 *   node scripts/gsc-by-date.mjs --days 14
 *   node scripts/gsc-by-date.mjs --days 14 --사이트 seoulmarkets --지면
 *   node scripts/gsc-by-date.mjs --자가시험
 *
 * ── 🔴 왜 만드나 (2026-09-16 · 사장님) ───────────────────────────────────
 *
 * 사장님: 「**GSC 재서 9/14 급등 까닭 찾아봐**」
 *
 * GA4 로 재니 9/14(월) 순방문자가 67명으로 그 전 최고(35명)의 두 배였다.
 * 그런데 `fetch-gsc.mjs` 는 **기간 합계**만 받는다 — 갈래가 query·page·query+page 뿐이라
 * 「그 하루에 무엇이 일어났나」를 볼 수 없다.
 * ⇒ GSC 는 `date` 갈래를 준다. 그것을 쓰면 그날 하나만 떼어 볼 수 있다.
 *
 * ⛔ 이 자는 «까닭을 지어내지 않는다». 날짜별 수를 낼 뿐이다.
 *   노출이 같이 튀었으면 「검색이 데려왔다」, 노출은 평평한데 방문만 튀었으면
 *   「검색 밖에서 왔다」— 그 가름까지가 이 자의 몫이고, 그다음은 사람이 본다.
 *
 * ⚠ GSC 는 이틀쯤 늦게 채워진다. 끝날 가까운 이틀은 «덜 찬 수»다. 그렇게 적는다.
 */
import { readFileSync } from 'node:fs';
import { createSign } from 'node:crypto';
import { 사이트들 } from './fetch-gsc.mjs';

/** 이 PC 는 이미 한국시간이다. ⛔ toISOString() 을 쓰지 않는다 */
export function 날글(d) {
  const p = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}

/** 어제까지 N일. ⛔ 오늘은 안 넣는다 — 하루가 안 끝나 늘 낮게 나온다 */
export function 창잡기(오늘 = new Date(), 일수 = 14) {
  const 끝 = new Date(오늘); 끝.setDate(끝.getDate() - 1);
  const 첫 = new Date(끝); 첫.setDate(첫.getDate() - (일수 - 1));
  return { 첫날: 날글(첫), 끝날: 날글(끝) };
}

/** 튄 날을 가른다 — 가운데값의 몇 배인가. ⛔ 평균을 쓰지 않는다(튄 날이 평균을 끌어올린다) */
export function 가운데값(수들) {
  const it = [...수들].filter(Number.isFinite).sort((a, b) => a - b);
  if (!it.length) return null;
  const m = Math.floor(it.length / 2);
  return it.length % 2 ? it[m] : (it[m - 1] + it[m]) / 2;
}

export function 튄날찾기(줄들, 배수 = 1.8) {
  const 가 = 가운데값(줄들.map((r) => r.impressions));
  if (!가) return [];
  return 줄들.filter((r) => r.impressions >= 가 * 배수)
    .map((r) => ({ ...r, 배: Math.round((r.impressions / 가) * 10) / 10 }));
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
  const 서명 = createSign('RSA-SHA256').update(머리 + '.' + 몸).sign(키.private_key, 'base64url');
  const 답 = await (await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: 머리 + '.' + 몸 + '.' + 서명,
    }),
  })).json();
  if (!답.access_token) throw new Error('토큰 실패 — ' + JSON.stringify(답).slice(0, 160));
  return 답.access_token;
}

async function 물어본다(토큰, 속성, 몸) {
  const r = await fetch(
    'https://searchconsole.googleapis.com/webmasters/v3/sites/'
    + encodeURIComponent(속성) + '/searchAnalytics/query',
    { method: 'POST',
      headers: { Authorization: 'Bearer ' + 토큰, 'Content-Type': 'application/json' },
      body: JSON.stringify(몸) });
  const j = await r.json();
  if (j.error) return { 됐나: false, 왜: j.error.message };
  return { 됐나: true, rows: j.rows ?? [] };
}

const 인자 = (이름, 기본) => {
  const i = process.argv.indexOf(이름);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : 기본;
};

async function 본일() {
  const 일수 = Number(인자('--days', '14'));
  const 고른사이트 = 인자('--사이트', null);
  const { 첫날, 끝날 } = 창잡기(new Date(), 일수);
  const 토큰 = await 토큰받기();
  const 볼것 = 고른사이트 ? { [고른사이트]: 사이트들[고른사이트] } : 사이트들;

  console.log('■ 검색 노출·클릭 — 날짜 축 (' + 첫날 + ' ~ ' + 끝날 + ')');
  console.log('  ⚠ GSC 는 이틀쯤 늦게 찬다. 끝 이틀은 «덜 찬 수»다\n');

  for (const [이름, 곳] of Object.entries(볼것)) {
    if (!곳) { console.log('🔴 모르는 사이트 — ' + 이름); continue; }
    const r = await 물어본다(토큰, 곳.속성,
      { startDate: 첫날, endDate: 끝날, dimensions: ['date'], rowLimit: 1000 });
    if (!r.됐나) { console.log('🔴 ' + 이름 + ' — ' + r.왜); continue; }
    const 줄들 = r.rows.map((x) => ({
      날: x.keys[0], impressions: x.impressions, clicks: x.clicks,
      position: Math.round(x.position * 10) / 10,
    }));
    const 최대 = Math.max(1, ...줄들.map((x) => x.impressions));
    console.log('── ' + 곳.속성.replace('sc-domain:', '') + ' ──');
    for (const x of 줄들) {
      const 칸 = '█'.repeat(Math.round((x.impressions / 최대) * 28));
      console.log('   ' + x.날 + '  노출 ' + String(x.impressions).padStart(5)
        + ' · 클릭 ' + String(x.clicks).padStart(3) + ' · 자리 ' + String(x.position).padStart(5)
        + '  ' + 칸);
    }
    const 튄것 = 튄날찾기(줄들);
    if (튄것.length) {
      console.log('   ⭐ 튄 날 — ' + 튄것.map((x) => x.날 + '(가운데값의 ' + x.배 + '배)').join(' · '));
    } else {
      console.log('   ⬜ 가운데값의 1.8배를 넘는 날이 없다 — 검색 쪽에 «급등이 없다»');
    }
    /* 그날 하나를 떼어 무엇이 떴는지 본다 */
    if (process.argv.includes('--지면') && 튄것.length) {
      for (const x of 튄것) {
        const p = await 물어본다(토큰, 곳.속성,
          { startDate: x.날, endDate: x.날, dimensions: ['page'], rowLimit: 15 });
        if (!p.됐나) continue;
        console.log('   · ' + x.날 + ' 그날 뜬 지면 —');
        for (const row of p.rows.slice(0, 8)) {
          console.log('       노출 ' + String(row.impressions).padStart(4)
            + ' 클릭 ' + String(row.clicks).padStart(3) + '  ' + row.keys[0].slice(0, 86));
        }
      }
    }
    console.log('');
  }
  console.log('⛔ 이 자는 수만 냅니다. 노출이 같이 튀었으면 검색이 데려온 것이고,');
  console.log('   노출이 평평한데 방문만 튀었으면 «검색 밖»에서 온 것입니다.');
}

export function 자가시험() {
  const 것 = []; const 재다 = (이름, 됐나) => 것.push({ 이름, 됐나 });
  재다('날글: 한국시간 그대로', 날글(new Date(2026, 8, 14)) === '2026-09-14');
  const c = 창잡기(new Date(2026, 8, 16), 14);
  재다('창: 오늘을 안 넣는다 — 끝날이 어제다', c.끝날 === '2026-09-15');
  재다('창: 14일이면 9/2 부터다', c.첫날 === '2026-09-02');
  재다('가운데값: 홀수', 가운데값([1, 5, 3]) === 3);
  재다('가운데값: 짝수', 가운데값([1, 2, 3, 4]) === 2.5);
  재다('⛔ 가운데값: 빈 것은 null', 가운데값([]) === null);
  const 줄 = [{ impressions: 10 }, { impressions: 10 }, { impressions: 12 }, { impressions: 40 }];
  재다('튄날: 가운데값의 1.8배 넘는 것만', 튄날찾기(줄).length === 1);
  재다('튄날: 몇 배인지 적는다', 튄날찾기(줄)[0].배 === 3.6);
  재다('⛔ 튄날: 평평하면 없다', 튄날찾기([{ impressions: 10 }, { impressions: 11 }]).length === 0);
  const 실패 = 것.filter((x) => !x.됐나);
  console.log('■ 자가시험 ' + (것.length - 실패.length) + '/' + 것.length);
  for (const x of 실패) console.log('  🔴 ' + x.이름);
  return 실패.length === 0;
}

if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);
else if (process.argv[1] && process.argv[1].endsWith('gsc-by-date.mjs')) {
  본일().catch((e) => { console.error('🔴 ' + e.message); process.exit(1); });
}
