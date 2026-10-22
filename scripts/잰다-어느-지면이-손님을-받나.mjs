#!/usr/bin/env node
/**
 * 잰다-어느-지면이-손님을-받나.mjs
 *   — **밖에서 온 손님이 «어느 지면»으로 들어오나. 문이 어디에 났는지 센다.**
 *
 * ── 🔴 왜 (2026-10-22 · 5번) ────────────────────────────────────────
 * 7일을 갈라 재니 사이트마다 밖에서 오는 수가 크게 달랐다 —
 * ```
 *   백년지도 166세션 (네이버 140)   KLifeMap 61 (네이버 27)
 *   KCW 37 (X 30)                 SeoulMarkets 24 (X 10)
 * ```
 * 백년지도가 네이버로 다른 곳의 다섯 배를 받는다. **왜인지 알면 다른 곳에 쓸 수 있다.**
 * ⇒ 그런데 「어느 지면이 받나」를 재는 자가 없었다. 그래서 만든다.
 *
 * ⛔ Direct 는 밖이 아니다 — 우리 유닛의 라이브 확인이 거기 섞인다. 빼고 센다.
 * ⛔ 「통한 지면」을 「좋은 지면」으로 읽지 않는다. 그 말의 경쟁이 적었을 수도 있다.
 * ⚠ GA4 는 광고차단·쿠키거부로 덜 센다 — 바닥값이다.
 *
 * 쓰는 법
 *   node scripts/잰다-어느-지면이-손님을-받나.mjs
 *   node scripts/잰다-어느-지면이-손님을-받나.mjs --days 28 --몇개 15
 *   node scripts/잰다-어느-지면이-손님을-받나.mjs --자가시험
 */
import path from 'node:path';
import fsSync from 'node:fs';
import { fileURLToPath } from 'node:url';

const 여기 = path.dirname(fileURLToPath(import.meta.url));

/** 우리/Direct 인가 — 밖에서 온 것만 세려고 거른다 */
export function 우리것인가(출처) {
  const s = String(출처 ?? '').trim().toLowerCase();
  return s === '' || s === '(direct)' || s === 'direct' || s === '(not set)';
}

/** 호스트로 어느 사이트인지 가른다 */
export function 어느사이트(호스트) {
  const h = String(호스트 ?? '').toLowerCase();
  if (h.includes('100yearmap')) return '백년지도';
  if (h.includes('kculturewire')) return 'K Culture Wire';
  if (h.includes('klifemap')) return 'KLifeMap';
  if (h.includes('seoulmarkets')) return 'SeoulMarkets';
  return 호스트 || '(모름)';
}

/** 출처 이름을 읽기 쉽게 — 네이버는 모바일·PC 를 한 자리로 모은다 */
export function 출처이름(s) {
  const t = String(s ?? '').toLowerCase();
  if (t.includes('naver')) return '네이버';
  if (t.includes('google')) return '구글';
  if (t.includes('daum')) return '다음';
  if (t === 't.co' || t.includes('twitter') || t === 'x.com') return 'X(트위터)';
  if (t.includes('bing')) return '빙';
  if (t.includes('chatgpt') || t.includes('openai')) return 'ChatGPT';
  if (t.includes('perplexity')) return 'Perplexity';
  return s || '(모름)';
}

if (process.argv.includes('--자가시험')) {
  let 통 = 0; const 탈 = [];
  const 본다 = (이름, 참) => { if (참) 통 += 1; else { 탈.push(이름); console.log('🔴 ' + 이름); } };

  본다('⛔ Direct 는 밖이 아니다', 우리것인가('(direct)') && 우리것인가('direct') && 우리것인가(''));
  본다('⛔ (not set) 도 뺀다', 우리것인가('(not set)') === true);
  본다('밖에서 온 것은 센다', 우리것인가('naver') === false && 우리것인가('t.co') === false);
  본다('⛔ 빈 것에 안 터진다', 우리것인가(null) === true);

  본다('호스트로 사이트를 가른다',
    어느사이트('www.100yearmap.com') === '백년지도'
    && 어느사이트('klifemap.ai') === 'KLifeMap'
    && 어느사이트('www.kculturewire.com') === 'K Culture Wire'
    && 어느사이트('seoulmarkets.com') === 'SeoulMarkets');
  본다('⛔ 모르는 호스트는 그대로 적는다 — 「기타」로 숨기지 않는다',
    어느사이트('wiki-tip.com') === 'wiki-tip.com');

  본다('🔴 네이버 모바일과 PC 를 한 자리로 모은다',
    출처이름('m.search.naver.com') === '네이버' && 출처이름('naver') === '네이버');
  본다('X 의 여러 이름을 모은다',
    출처이름('t.co') === 'X(트위터)' && 출처이름('x.com') === 'X(트위터)');
  본다('⛔ 모르는 출처는 그대로', 출처이름('ecosia.org') === 'ecosia.org');
  본다('⛔ 빈 것에 안 터진다', 출처이름(null) === '(모름)');

  console.log(탈.length ? `\n🔴 자가시험 ${탈.length}건 탈` : `\n✅ 자가시험 ${통} 통과`);
  process.exit(탈.length ? 1 : 0);
}

/* ── 실제로 재기 ─────────────────────────────────────────────────── */
const { 토큰받기 } = await import(`file://${path.join(여기, 'ga4-report.mjs').replace(/\\/g, '/')}`);
const 날수 = Number((process.argv.find((a) => a.startsWith('--days')) || '').split('=')[1]
  || process.argv[process.argv.indexOf('--days') + 1] || 7) || 7;
const 몇개 = Number(process.argv[process.argv.indexOf('--몇개') + 1] || 10) || 10;
const 속성 = process.env.GA4_PROPERTY_ID || '549135289';

/* ⛔ 키 자리를 지어내지 않는다 — ga4-report.mjs 와 «같은» 곳에서 읽는다(.env 의 그 줄) */
const 키길 = process.env.GOOGLE_APPLICATION_CREDENTIALS
  || (fsSync.existsSync(path.resolve(여기, '..', '.env'))
    ? (fsSync.readFileSync(path.resolve(여기, '..', '.env'), 'utf8')
      .match(/^GOOGLE_APPLICATION_CREDENTIALS=(.+)$/m) || [])[1]?.trim()
    : null);
let 토큰;
try {
  const { readFileSync } = await import('node:fs');
  토큰 = await 토큰받기(JSON.parse(readFileSync(키길, 'utf8')), 'https://www.googleapis.com/auth/analytics.readonly');
} catch (e) { console.error(`🔴 토큰을 못 받았다 — ${e.message}`); process.exit(1); }

const 답 = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${속성}:runReport`, {
  method: 'POST',
  headers: { authorization: `Bearer ${토큰}`, 'content-type': 'application/json' },
  body: JSON.stringify({
    dateRanges: [{ startDate: `${날수}daysAgo`, endDate: 'yesterday' }],
    dimensions: [{ name: 'hostName' }, { name: 'sessionSource' }, { name: 'landingPage' }],
    metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
    limit: 2000,
  }),
});
if (!답.ok) { console.error(`🔴 GA4 가 ${답.status} — ${(await 답.text()).slice(0, 200)}`); process.exit(1); }
const 자료 = await 답.json();

const 모음 = new Map();     /* 사이트 → Map(지면 → {세션, 사람, 출처:Map}) */
for (const r of 자료.rows || []) {
  const [호스트, 출처, 지면] = r.dimensionValues.map((v) => v.value);
  if (우리것인가(출처)) continue;
  const 사이트 = 어느사이트(호스트);
  if (!모음.has(사이트)) 모음.set(사이트, new Map());
  const 표 = 모음.get(사이트);
  const 열쇠 = 지면 || '/';
  if (!표.has(열쇠)) 표.set(열쇠, { 세션: 0, 사람: 0, 출처: new Map() });
  const x = 표.get(열쇠);
  const 세 = Number(r.metricValues[0].value) || 0;
  x.세션 += 세;
  x.사람 += Number(r.metricValues[1].value) || 0;
  const o = 출처이름(출처);
  x.출처.set(o, (x.출처.get(o) || 0) + 세);
}

console.log(`\n■ 밖에서 온 손님이 «어느 지면»으로 들어오나 — 최근 ${날수}일 · 속성 ${속성}`);
console.log('⛔ Direct 는 뺐다 — 우리 유닛의 라이브 확인이 거기 섞인다\n');

const 차례 = [...모음.entries()]
  .map(([s, 표]) => [s, 표, [...표.values()].reduce((a, x) => a + x.세션, 0)])
  .sort((a, b) => b[2] - a[2]);

for (const [사이트, 표, 합] of 차례) {
  console.log(`## ${사이트} — 밖에서 온 세션 ${합}`);
  const 줄 = [...표.entries()].sort((a, b) => b[1].세션 - a[1].세션).slice(0, 몇개);
  for (const [지면, x] of 줄) {
    const 출처글 = [...x.출처.entries()].sort((a, b) => b[1] - a[1])
      .slice(0, 3).map(([o, n]) => `${o} ${n}`).join(' · ');
    console.log(`   ${String(x.세션).padStart(4)} 세션 · 사람 ${String(x.사람).padStart(3)}   ${지면}`);
    console.log(`        ${출처글}`);
  }
  console.log('');
}

console.log('⚠ GA4 는 광고차단·쿠키거부로 «덜 센다» — 바닥값으로 읽는다.');
console.log('⛔ 「통한 지면」을 「좋은 지면」으로 읽지 않는다 — 그 말의 경쟁이 적었을 수도 있다.');
