#!/usr/bin/env node
/**
 * ga4-report.mjs — **GA4 에서 순방문자수를 읽는다.** (5번, 2026-08-23)
 *
 * ── 왜 ───────────────────────────────────────────────────────
 * 방문자수를 오늘까지 「⚠ 못 잼」으로 보고했다. 그런데 GA4 태그는 이미 붙어 있고
 * 살아 있다(`src/components/Analytics.astro`) — **수는 구글 쪽에 쌓이고 있었고**,
 * 없던 것은 그것을 코드로 읽어 오는 창구였다. 그 창구가 GA4 Data API 다.
 *
 * ⭐ **속성 ID 를 사장님께 여쭙지 않는다.** Admin API 의 `accountSummaries` 가
 *   「이 계정이 볼 수 있는 속성」을 돌려주므로 **스스로 찾는다.** 사람 손을 한 번 덜 쓴다.
 *
 * ── ⛔ 이 자가 지키는 것 ─────────────────────────────────────
 * ⛔ **열쇠를 화면에 안 찍는다.** 계정 주소(공개 식별자)까지만 적는다.
 * ⛔ **막힌 곳을 「0」으로 적지 않는다.** 권한이 없으면 「못 쟀다」와 **무엇을 켜야 하는지**를
 *   적는다. 짐작한 방문자수를 내보내는 것이 못 재는 것보다 나쁘다.
 * ⛔ 쿠키·IP 를 우리가 따로 남기지 않는다(2026-08-05 결정). 이 자는 **읽기만** 한다.
 *
 * 쓰는 법
 *   node scripts/ga4-report.mjs --찾는다          볼 수 있는 속성을 찾는다
 *   node scripts/ga4-report.mjs --days 28         순방문자수를 잰다
 *   node scripts/ga4-report.mjs --속성=123456789 --days 7
 *   node scripts/ga4-report.mjs --selftest
 */
import { readFileSync, existsSync } from 'node:fs';
import { createSign } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/* ⚠ Node 가 .env 를 자동으로 안 읽는다. search-console-report.mjs 와 같은 방식이다 */
(function 환경파일읽기() {
  try {
    const 본문 = readFileSync(path.resolve('.env'), 'utf8');
    for (const 줄 of 본문.split(/\r?\n/)) {
      const m = 줄.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
      if (!m) continue;
      const 값 = m[2].trim().replace(/^["']|["']$/g, '');
      if (process.env[m[1]] === undefined) process.env[m[1]] = 값;
    }
  } catch { /* .env 없으면 정상 */ }
})();

export const 갈래 = 'https://www.googleapis.com/auth/analytics.readonly';

/** 어떤 오류인지 **갈라** 적는다. ⛔ 「실패」 한 마디로 뭉개면 무엇을 켤지 알 수 없다 */
export function 무엇이막혔나(오류글) {
  const s = String(오류글 ?? '');
  if (/analyticsadmin\.googleapis\.com|Google Analytics Admin API has not been used/i.test(s)) {
    return { 무엇: 'admin-api-꺼짐',
      할것: 'Google Cloud 에서 「Google Analytics Admin API」를 사용 설정한다',
      주소: 'https://console.cloud.google.com/apis/library/analyticsadmin.googleapis.com' };
  }
  if (/analyticsdata\.googleapis\.com|Google Analytics Data API has not been used/i.test(s)) {
    return { 무엇: 'data-api-꺼짐',
      할것: 'Google Cloud 에서 「Google Analytics Data API」를 사용 설정한다',
      주소: 'https://console.cloud.google.com/apis/library/analyticsdata.googleapis.com' };
  }
  if (/PERMISSION_DENIED|403|does not have sufficient permissions|User does not have/i.test(s)) {
    return { 무엇: '권한없음',
      할것: 'GA4 → 관리 → 속성 액세스 관리에서 서비스 계정을 「뷰어」로 더한다',
      주소: 'https://analytics.google.com/' };
  }
  return { 무엇: '모름', 할것: '오류 글을 그대로 읽는다', 주소: null };
}

/** 속성 목록에서 우리 사이트 것을 고른다. ⛔ 하나뿐이면 그것을 쓰되 **어느 것인지 적는다** */
export function 우리속성(요약들, 찾는말 = 'culture') {
  const 것들 = [];
  for (const a of 요약들 ?? []) {
    for (const p of a.propertySummaries ?? []) {
      것들.push({
        속성: String(p.property ?? '').replace('properties/', ''),
        이름: p.displayName ?? '',
        계정: a.displayName ?? '',
      });
    }
  }
  const 맞는것 = 것들.filter((x) => x.이름.toLowerCase().includes(찾는말.toLowerCase()));
  return { 전부: 것들, 고른것: 맞는것.length === 1 ? 맞는것[0] : null, 맞는것 };
}

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 참 = (n, v) => { if (v) 통 += 1; else { 실 += 1; console.error(`  ⛔ ${n}`); } };

  /* 🔴 막힌 곳을 갈라 적어야 사람이 «무엇을 켤지» 안다. 「실패」 한 마디는 쓸모가 없다 */
  참('Admin API 꺼짐을 알아본다',
    무엇이막혔나('Google Analytics Admin API has not been used in project 123').무엇 === 'admin-api-꺼짐');
  참('Data API 꺼짐을 알아본다',
    무엇이막혔나('analyticsdata.googleapis.com is disabled').무엇 === 'data-api-꺼짐');
  참('권한 없음을 알아본다', 무엇이막혔나('PERMISSION_DENIED').무엇 === '권한없음');
  참('모르는 것은 모른다고 한다', 무엇이막혔나('something else').무엇 === '모름');
  참('켤 주소를 함께 준다',
    무엇이막혔나('analyticsdata.googleapis.com is disabled').주소.includes('analyticsdata'));

  const 요약 = [{
    displayName: 'KLifeDesign',
    propertySummaries: [
      { property: 'properties/111111111', displayName: 'K Culture Wire' },
      { property: 'properties/222222222', displayName: 'SeoulMarkets' },
    ],
  }];
  const r = 우리속성(요약);
  참('속성 목록을 편다', r.전부.length === 2);
  참('이름으로 우리 것을 고른다', r.고른것.속성 === '111111111');
  /* ⛔ 둘 이상 맞으면 **고르지 않는다.** 짐작으로 남의 속성을 읽으면 안 된다 */
  참('둘 이상 맞으면 고르지 않는다', 우리속성([{
    displayName: 'x',
    propertySummaries: [
      { property: 'properties/1', displayName: 'Culture A' },
      { property: 'properties/2', displayName: 'Culture B' },
    ],
  }]).고른것 === null);
  참('하나도 안 맞으면 고르지 않는다', 우리속성(요약, '없는말').고른것 === null);
  참('빈 목록도 안 죽는다', 우리속성(null).전부.length === 0);
  참('읽기 갈래만 청한다', 갈래.endsWith('analytics.readonly'));

  console.log(`GA4 를 읽는 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  const 키파일 = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!키파일 || !existsSync(키파일)) {
    console.log('⚠ 서비스 계정 키파일이 없다 — **못 쟀다.** (.env 의 GOOGLE_APPLICATION_CREDENTIALS)');
    process.exit(0);
  }
  const 키 = JSON.parse(readFileSync(키파일, 'utf8'));

  const jwt만들기 = () => {
    const 지금 = Math.floor(Date.now() / 1000);
    const 헤더 = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const 몸 = Buffer.from(JSON.stringify({
      iss: 키.client_email, scope: 갈래, aud: 'https://oauth2.googleapis.com/token',
      iat: 지금, exp: 지금 + 3600,
    })).toString('base64url');
    const 대상 = `${헤더}.${몸}`;
    return `${대상}.${createSign('RSA-SHA256').update(대상).sign(키.private_key, 'base64url')}`;
  };

  const 토큰받기 = async () => {
    const r = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt만들기(),
      }),
    });
    const j = await r.json();
    if (!j.access_token) throw new Error(`토큰 실패: ${JSON.stringify(j)}`);
    return j.access_token;
  };

  /* ⛔ 계정 주소는 공개 식별자다 — 그것까지만 적는다. 열쇠는 절대 안 찍는다 */
  console.log(`GA4 를 읽는다 — 서비스 계정 ${키.client_email}\n`);

  const 막혔다 = (제목, 글) => {
    const m = 무엇이막혔나(글);
    console.log(`🔴 ${제목} — **못 쟀다.**`);
    console.log(`   막힌 것: ${m.무엇}`);
    console.log(`   할 것  : ${m.할것}`);
    if (m.주소) console.log(`   주소   : ${m.주소}`);
    console.log(`   구글이 준 말: ${String(글).slice(0, 300)}`);
    console.log('\n⛔ 이것은 「방문자 0명」이 아니다. **재지 못한 것**이다.');
  };

  let 토큰;
  try { 토큰 = await 토큰받기(); } catch (e) { 막혔다('토큰을 못 받았다', e.message); process.exit(0); }
  console.log('✅ 토큰 받았다 — 서비스 계정 자체는 산다\n');

  /* ── ① 볼 수 있는 속성 찾기 ─────────────────────────────── */
  let 속성 = process.argv.find((a) => a.startsWith('--속성='))?.split('=')[1]
    ?? process.env.GA4_PROPERTY_ID ?? null;
  if (!속성) {
    const r = await fetch('https://analyticsadmin.googleapis.com/v1beta/accountSummaries?pageSize=200',
      { headers: { Authorization: `Bearer ${토큰}` } });
    const j = await r.json();
    if (j.error) { 막혔다('볼 수 있는 속성을 못 물었다', j.error.message); process.exit(0); }
    const 찾음 = 우리속성(j.accountSummaries);
    if (!찾음.전부.length) {
      console.log('🔴 이 계정이 볼 수 있는 GA4 속성이 **하나도 없다** — 아직 뷰어로 안 들어갔다.');
      console.log('   할 것: GA4 → 관리 → 속성 액세스 관리 → 아래 주소를 「뷰어」로 더한다');
      console.log(`          ${키.client_email}`);
      console.log('\n⛔ 이것은 「방문자 0명」이 아니다. **재지 못한 것**이다.');
      process.exit(0);
    }
    console.log('볼 수 있는 속성:');
    for (const x of 찾음.전부) console.log(`   ${x.속성}  ${x.이름}  (계정 ${x.계정})`);
    if (process.argv.includes('--찾는다')) {
      console.log('\n⭐ 쓰려면 .env 에 적는다 —  GA4_PROPERTY_ID=<위 번호>');
      process.exit(0);
    }
    if (!찾음.고른것) {
      console.log('\n⚠ 어느 것이 우리 것인지 **자로 못 가른다**(이름에 culture 가 하나가 아니다).');
      console.log('   --속성=<번호> 로 주거나 .env 에 GA4_PROPERTY_ID 를 적는다.');
      console.log('⛔ 짐작으로 남의 속성을 읽지 않는다.');
      process.exit(0);
    }
    속성 = 찾음.고른것.속성;
    console.log(`\n⭐ 이름으로 골랐다 — ${속성} (${찾음.고른것.이름})`);
  }

  /* ── ② 순방문자수 재기 ──────────────────────────────────── */
  const 일수 = Number(process.argv[process.argv.indexOf('--days') + 1]) || 28;
  const r2 = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${속성}:runReport`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${토큰}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dateRanges: [{ startDate: `${일수}daysAgo`, endDate: 'yesterday' }],
        metrics: [{ name: 'totalUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }],
      }),
    },
  );
  const j2 = await r2.json();
  if (j2.error) { 막혔다('수를 못 읽었다', j2.error.message); process.exit(0); }

  const 값 = (j2.rows?.[0]?.metricValues ?? []).map((x) => Number(x.value));
  const [순방문, 세션, 지면열림] = 값;
  console.log(`\n📊 최근 ${일수}일 (어제까지) — 속성 ${속성}`);
  console.log(`   순방문자수(totalUsers)  ${Number.isFinite(순방문) ? 순방문.toLocaleString('en-US') : '못 쟀다'}`);
  console.log(`   세션(sessions)          ${Number.isFinite(세션) ? 세션.toLocaleString('en-US') : '못 쟀다'}`);
  console.log(`   지면 열림(pageViews)    ${Number.isFinite(지면열림) ? 지면열림.toLocaleString('en-US') : '못 쟀다'}`);
  if (Number.isFinite(순방문)) {
    console.log(`   ⭐ 하루 평균 순방문자  ${(순방문 / 일수).toFixed(1)}명`
      + `  (9월 목표 1,000명)`);
  }
  console.log('\n⚠ GA4 는 광고차단·쿠키거부로 **덜 세는 쪽**이다. 바닥값으로 읽는다 —');
  console.log('   실제 방문자는 이보다 많을 수 있다. 「이보다 적을 수는 없다」가 우리가 말할 수 있는 것이다.');
}
