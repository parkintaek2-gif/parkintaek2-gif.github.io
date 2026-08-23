#!/usr/bin/env node
/**
 * check-100y-indexed.mjs — **낸 지면이 구글에 실제로 들어갔나**를 구글에게 직접 묻는다.
 *
 * ── 왜 만드나 ───────────────────────────────────────────────
 * 5번이 kculturewire에서 같은 것을 재서(2026-08-23 23:5x) **작품 지면이 38%만 색인됐다**를
 * 찾았고, 「3번은 색인이 많이 들어가 있을 것으로 짐작되지만 재 봐야 안다」고 남겼다.
 * 짐작으로 두지 않고 우리도 같은 방식(URL Inspection API)으로 직접 잰다.
 *
 * ⛔ 5번 파일(check-kcw-indexed.mjs)을 고치지 않는다 — 남의 진행 중 파일이다.
 *   같은 판정 로직만 이 사이트에 맞춰 옮겨 적는다(사이트·집·갈래만 다르다).
 *
 * ⭐ 우리 소유 속성이라 권위 있는 답이 온다: `coverageState`(들어갔나·발견만 됐나·
 *   크롤됐는데 안 넣었나) · `robotsTxtState` · `lastCrawlTime`.
 * ⚠ 하루 2,000건 · 분당 600건 한도가 있다. 그래서 **표본**으로 잰다(기본 60장).
 * ⛔ 표본으로 잰 것을 「전체가 그렇다」고 말하지 않는다. 표본 수를 같이 적는다.
 * ⛔ 같은 지면을 몇 분 사이에 두 번 물으면 갈림이 달라질 수 있다(5번 실측) —
 *   「그때 그 순간의 답」이지 「그 지면의 영구한 상태」가 아니다.
 *
 * ── 정직 규칙 ────────────────────────────────────────────────
 * ⛔ **대조군을 먼저 넣는다.** 없는 주소 하나를 같이 물어 그것이 「안 들어갔다」로 나올 때만
 *   나머지 답을 믿는다. 아니면 **「못 쟀다」**로 적고 끝낸다(「0장」이 아니다).
 * ⛔ 권한이 없거나 API 가 꺼져 있으면 그것도 「못 쟀다」다 — 「색인 0」으로 적지 않는다.
 *
 * 쓰는 법  node scripts/check-100y-indexed.mjs --자가시험
 *          node scripts/check-100y-indexed.mjs --잰다 [--n=60] [--쓴다]
 *          node scripts/check-100y-indexed.mjs --잰다 --주소=/school/7531159,/before
 */
import fs from 'node:fs';
import path from 'node:path';
import { createSign } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 낼길 = path.join(뿌리, 'src/data/100yearmap-indexed.json');
const 사이트 = 'sc-domain:100yearmap.com';
const 집 = 'https://100yearmap.com';
/** ⛔ 있으면 안 되는 주소. 대조군이다 — 이것이 「들어갔다」로 나오면 자를 못 쓴다 */
export const 대조군주소 = `${집}/this-page-must-not-exist-zzz-5beon-control`;

function 환경읽기() {
  try {
    const 본문 = fs.readFileSync(path.join(뿌리, '.env'), 'utf8');
    for (const 줄 of 본문.split(/\r?\n/)) {
      const m = 줄.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  } catch { /* 없으면 그만 */ }
}

/**
 * 구글이 돌려준 한 건을 우리 말로 접는다. (5번의 check-kcw-indexed.mjs 와 같은 판정)
 * ⛔ 모르는 말이 오면 **「모른다」로 남긴다.** 「안 들어갔다」로 몰지 않는다.
 */
export function 판정(응답) {
  const r = 응답?.inspectionResult?.indexStatusResult;
  if (!r) return { 꼴: '모른다', 왜: '응답에 indexStatusResult 가 없다' };
  const 상태 = String(r.coverageState ?? '');
  const 판 = String(r.verdict ?? '');
  if (/^Submitted and indexed$|^Indexed, not submitted in sitemap$/i.test(상태)) {
    return { 꼴: '들어갔다', 상태, 판, 마지막크롤: r.lastCrawlTime ?? null };
  }
  if (/^Discovered - currently not indexed$/i.test(상태)) {
    return { 꼴: '발견만', 상태, 판, 마지막크롤: r.lastCrawlTime ?? null };
  }
  if (/^Crawled - currently not indexed$/i.test(상태)) {
    return { 꼴: '크롤했는데안넣음', 상태, 판, 마지막크롤: r.lastCrawlTime ?? null };
  }
  if (/unknown to google/i.test(상태)) return { 꼴: '구글이모른다', 상태, 판 };
  if (/not found|404/i.test(상태)) return { 꼴: '없는주소', 상태, 판 };
  if (/blocked|robots/i.test(상태)) return { 꼴: '막혀있다', 상태, 판 };
  /* ⭐ 2026-08-24 실측(첫 돌림, ko-KR 로 물었을 때) — 「‘NOINDEX’ 태그에 의해 제외되었습니다」.
     ⛔ 이건 흠이 아닐 수 있다 — 우리가 일부러 noindex 를 건 지면(202/4,997장)이 있다.
     그래서 「안 들어갔다」 쪽이 아니라 **따로** 가른다. 일부러 건 것인지는 지면 쪽에서 봐야 안다 */
  if (/excluded.*noindex|noindex.*tag/i.test(상태)) return { 꼴: '노인덱스로뺌', 상태, 판 };
  /**
   * 🔴 2026-08-24 — 5번이 자기 파일에서 찾아 알려 준 것 — 여기가 위험한 자리였다.
   *   옛 코드는 `if (판 === 'PASS') return { 꼴: '들어갔다' }` 였다. **모르는 상태 글자에
   *   verdict 만 PASS 면 「들어갔다」로 몰았다** — 색인을 부풀리는 쪽으로 틀리는 되돌림이다.
   *   구글이 문구를 바꾸거나 다른 언어로 답하면 그날부터 색인 수가 조용히 올라간다.
   * ⭐ 그래서 「들어간듯」으로 갈라 둔다. ⛔ 셈을 낼 때 「들어갔다」에 안 섞는다.
   */
  if (판 === 'PASS') {
    return { 꼴: '들어간듯', 상태, 판, 마지막크롤: r.lastCrawlTime ?? null,
      왜: `상태 글자를 못 알아봤다(verdict 만 PASS): ${상태 || '(빈칸)'}` };
  }
  return { 꼴: '모른다', 상태, 판, 왜: `처음 보는 상태: ${상태 || '(빈칸)'}` };
}

/** 대조군이 제 몫을 했나 — 「들어갔다」로 나오면 이 자는 못 쓴다 */
export const 대조군믿을만한가 = (판정결과) => 판정결과.꼴 !== '들어갔다';

/** 표본을 고르게 뽑는다. ⛔ 앞에서만 뽑으면 한 갈래만 재게 된다 */
export function 고르게뽑기(전체, n) {
  if (n >= 전체.length) return [...전체];
  const 걸음 = 전체.length / n;
  const 뽑음 = [];
  for (let i = 0; i < n; i++) 뽑음.push(전체[Math.floor(i * 걸음)]);
  return 뽑음;
}

/** 갈래 — 어느 무리가 안 들어가나를 봐야 고칠 데를 안다 (100yearmap 몫으로 다시 짰다) */
export function 갈래(주소) {
  const p = String(주소).replace(집, '') || '/';
  if (p === '/') return 'home';
  if (p.startsWith('/school/')) return 'school';
  if (p.startsWith('/major/')) return 'major';
  if (p.startsWith('/college-major/')) return 'college-major';
  if (p.startsWith('/university/')) return 'university';
  if (p.startsWith('/report/area/')) return 'report-area';
  if (p.startsWith('/report/')) return 'report';
  if (p.startsWith('/region/')) return 'region';
  if (p.startsWith('/age/')) return 'age';
  if (p.startsWith('/life/')) return 'life';
  return 'fixed';
}

if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };
  const 싼다 = (상태, verdict = 'PASS') => ({ inspectionResult: { indexStatusResult: { coverageState: 상태, verdict, lastCrawlTime: '2026-08-20T01:00:00Z' } } });

  검('들어간 것을 안다', 판정(싼다('Submitted and indexed')).꼴 === '들어갔다');
  검('사이트맵 밖에서 들어간 것도 들어간 것', 판정(싼다('Indexed, not submitted in sitemap')).꼴 === '들어갔다');
  검('발견만 된 것을 가른다', 판정(싼다('Discovered - currently not indexed', 'NEUTRAL')).꼴 === '발견만');
  검('크롤했는데 안 넣은 것을 가른다', 판정(싼다('Crawled - currently not indexed', 'NEUTRAL')).꼴 === '크롤했는데안넣음');
  검('없는 주소를 안다', 판정(싼다('Not found (404)', 'FAIL')).꼴 === '없는주소');
  검('⭐ 구글이 모르는 주소를 안다', 판정(싼다('URL is unknown to Google', 'NEUTRAL')).꼴 === '구글이모른다');
  검('⭐ 그것도 대조군으로 믿을 만하다', 대조군믿을만한가(판정(싼다('URL is unknown to Google', 'NEUTRAL'))) === true);
  검('막힌 것을 안다', 판정(싼다('Blocked by robots.txt', 'FAIL')).꼴 === '막혀있다');
  검('⭐ 일부러 건 noindex 를 가른다(흠이 아닐 수 있다)', 판정(싼다("Excluded by 'noindex' tag", 'FAIL')).꼴 === '노인덱스로뺌');
  검('🔴 모르는 상태 + PASS 는 «들어갔다»가 아니다', 판정(싼다('제출됨. 색인이 생성됨', 'PASS')).꼴 !== '들어갔다');
  검('그것은 «들어간듯» 으로 갈라 둔다', 판정(싼다('제출됨. 색인이 생성됨', 'PASS')).꼴 === '들어간듯');
  검('«들어간듯» 은 까닭을 적는다', /못 알아봤다/.test(판정(싼다('무슨 말', 'PASS')).왜 ?? ''));
  검('영어 정본은 그대로 «들어갔다»', 판정(싼다('Submitted and indexed', 'PASS')).꼴 === '들어갔다');
  검('⭐ 처음 보는 상태는 «모른다»', 판정(싼다('Something New From Google', 'NEUTRAL')).꼴 === '모른다');
  검('⭐ 응답이 비면 «모른다»', 판정({}).꼴 === '모른다' && 판정(null).꼴 === '모른다');
  검('마지막 크롤 시각을 남긴다', 판정(싼다('Submitted and indexed')).마지막크롤 === '2026-08-20T01:00:00Z');
  검('대조군이 «없는주소» 면 믿는다', 대조군믿을만한가(판정(싼다('Not found (404)', 'FAIL'))) === true);
  검('⛔ 대조군이 «들어갔다» 면 못 믿는다', 대조군믿을만한가(판정(싼다('Submitted and indexed'))) === false);

  const 백 = Array.from({ length: 100 }, (_, i) => `/p${i}`);
  검('표본을 고르게 뽑는다', 고르게뽑기(백, 10).length === 10);
  검('첫 것과 끝 쪽이 다 들어간다', 고르게뽑기(백, 10)[0] === '/p0' && 고르게뽑기(백, 10)[9] === '/p90');
  검('표본이 전체보다 크면 전체를 준다', 고르게뽑기(백, 500).length === 100);
  검('갈래를 안다', 갈래(`${집}/school/x`) === 'school' && 갈래(`${집}/report/area/x`) === 'report-area');
  검('report 단독은 report', 갈래(`${집}/report/7010057`) === 'report');
  검('첫 화면 갈래', 갈래(집) === 'home' && 갈래(`${집}/`) === 'home');

  if (실패.length) { console.error('❌ 자가시험 실패\n' + 실패.map((s) => `   · ${s}`).join('\n')); process.exit(1); }
  console.log('✅ check-100y-indexed 자가시험 통과 (22)');
  process.exit(0);
}

if (!process.argv.includes('--잰다')) {
  console.error('⛔ --잰다 나 --자가시험 을 준다');
  process.exit(1);
}

환경읽기();
const 키파일 = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!키파일 || !fs.existsSync(키파일)) {
  console.log('⚠ 못 쟀다 — 서비스 계정 키가 이 창에 없다. 「색인 0」이라고 적지 않는다');
  process.exit(0);
}
const 키 = JSON.parse(fs.readFileSync(키파일, 'utf8'));

function jwt만들기() {
  const 지금 = Math.floor(Date.now() / 1000);
  const h = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const b = Buffer.from(JSON.stringify({
    iss: 키.client_email,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: 지금,
    exp: 지금 + 3600,
  })).toString('base64url');
  const sig = createSign('RSA-SHA256').update(`${h}.${b}`).sign(키.private_key, 'base64url');
  return `${h}.${b}.${sig}`;
}

const 토큰응답 = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt만들기() }),
}).then((r) => r.json());
if (!토큰응답.access_token) {
  console.log(`⚠ 못 쟀다 — 토큰을 못 받았다: ${JSON.stringify(토큰응답).slice(0, 200)}`);
  process.exit(0);
}
const 토큰 = 토큰응답.access_token;

async function 물어본다(주소) {
  const r = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
    method: 'POST',
    headers: { Authorization: `Bearer ${토큰}`, 'Content-Type': 'application/json' },
    /* ⚠ 2026-08-24 실측 — ko-KR 로 물으면 구글이 coverageState 를 한국어로 준다
       (「발견됨 - 현재 색인이 생성되지 않음」 등). 판정 정규식은 5번 것을 그대로 옮겨
       영어 문자열 기준이라 전부 「모른다」로 떨어졌다 — en-US 로 고정한다 */
    body: JSON.stringify({ inspectionUrl: 주소, siteUrl: 사이트, languageCode: 'en-US' }),
  });
  if (!r.ok) {
    const 글 = await r.text();
    return { 오류: `HTTP ${r.status} ${글.slice(0, 200)}` };
  }
  return r.json();
}

/* ① 대조군 먼저 */
const 대조 = await 물어본다(대조군주소);
if (대조.오류) {
  console.log(`⚠ 못 쟀다 — ${대조.오류}`);
  console.log('   ⛔ 「색인 0」으로 적지 않는다. API 가 꺼져 있거나 권한이 없는 것이다.');
  process.exit(0);
}
const 대조판정 = 판정(대조);
if (!대조군믿을만한가(대조판정)) {
  console.log(`⚠ 못 쟀다 — 대조군(없는 주소)이 «${대조판정.꼴}» 로 나온다. 이 자를 믿을 수 없다`);
  process.exit(0);
}
console.log(`대조군 통과 — 없는 주소가 «${대조판정.꼴}»(${대조판정.상태 ?? ''})로 나온다`);

/* ② 사이트맵에서 주소를 모으고 고르게 뽑는다 */
const 사이트맵길 = path.join(뿌리, 'dist/100y/sitemap.xml');
if (!fs.existsSync(사이트맵길)) {
  console.log('⚠ 못 쟀다 — dist/100y/sitemap.xml 이 없다(빌드 먼저)');
  process.exit(0);
}
const 전체 = [...fs.readFileSync(사이트맵길, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const n = Number((process.argv.find((a) => a.startsWith('--n='))?.split('=')[1]) ?? 60);
const 준주소 = process.argv.find((a) => a.startsWith('--주소='))?.split('=').slice(1).join('=');
const 고른것 = 준주소
  ? 준주소.split(',').map((s) => s.trim()).filter(Boolean).map((s) => (s.startsWith('http') ? s : 집 + s))
  : null;
if (고른것 && !고른것.length) { console.error('⛔ --주소 에 아무것도 없다'); process.exit(1); }
const 표본 = 고른것 ?? 고르게뽑기(전체, n);

console.log(`사이트맵 ${전체.length}장 중 ${표본.length}장을 고르게 뽑아 묻는다 (하루 한도 2,000건)`);

const 결과 = [];
for (const 주소 of 표본) {
  const 답 = await 물어본다(주소);
  if (답.오류) { 결과.push({ 주소, 꼴: '못물었다', 왜: 답.오류 }); continue; }
  결과.push({ 주소, 갈래: 갈래(주소), ...판정(답) });
}

const 셈 = new Map();
for (const x of 결과) 셈.set(x.꼴, (셈.get(x.꼴) ?? 0) + 1);
console.log('\n## 표본이 어떻게 갈렸나');
for (const [k, v] of [...셈].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k.padEnd(16)} ${String(v).padStart(3)}장 (${(v / 결과.length * 100).toFixed(1)}%)`);
}

const 갈래별 = new Map();
for (const x of 결과) {
  const g = 갈래별.get(x.갈래) ?? {};
  g[x.꼴] = (g[x.꼴] ?? 0) + 1;
  갈래별.set(x.갈래, g);
}
console.log('\n## 갈래마다');
for (const [g, v] of 갈래별) {
  console.log(`  ${String(g).padEnd(14)} ${Object.entries(v).map(([k, n2]) => `${k} ${n2}`).join(' · ')}`);
}

const 안들어간것 = 결과.filter((x) => x.꼴 === '발견만' || x.꼴 === '크롤했는데안넣음');
if (안들어간것.length) {
  console.log(`\n## 안 들어간 것 보기 (표본 안에서 ${안들어간것.length}장)`);
  안들어간것.slice(0, 12).forEach((x) => console.log(`  ${x.꼴.padEnd(16)} ${x.주소.replace(집, '')}`));
}
const 모르는것 = 결과.filter((x) => x.꼴 === '모른다' || x.꼴 === '못물었다');
if (모르는것.length) {
  console.log(`\n⚠ 못 판정한 것 ${모르는것.length}장 — 「안 들어갔다」로 몰지 않는다`);
  모르는것.slice(0, 5).forEach((x) => console.log(`  ${x.주소.replace(집, '')} — ${x.왜 ?? x.상태 ?? ''}`));
}

/**
 * 🔴 2026-08-24 — 5번 것을 그대로 옮긴다. ko-KR 로 물었던 첫 회차에서 80장이 전부
 *   「모른다」로 떨어졌는데, 화면에는 갈림 표가 그대로 나와 **결과처럼 보였다.**
 *   못 판정한 몫이 크면 이 회차를 통째로 「못 쟀다」로 세운다.
 */
const 못판정몫 = 결과.length ? 모르는것.length / 결과.length : 0;
if (못판정몫 >= 0.3) {
  console.log(`\n⛔⛔ **이 회차는 못 쟀다.** 못 판정한 것이 ${(100 * 못판정몫).toFixed(0)}% 다`
    + ' — 위 갈림 표를 결론으로 쓰지 않는다.');
  console.log('   먼저 볼 것 ① 물을 때 languageCode 가 en-US 인가'
    + ' (한국어로 물으면 구글이 한국어로 답하고 이 판정이 다 빗나간다)');
  console.log('   ② 구글이 상태 문구를 바꿨나 — 위 「못 판정한 것」의 상태 글자를 그대로 읽는다');
}

if (process.argv.includes('--쓴다')) {
  fs.writeFileSync(낼길, JSON.stringify({
    generated: new Date().toISOString().slice(0, 10),
    whatThisIs: `Google's own answer, page by page, on whether it has indexed us. A sample of ${결과.length} taken evenly across the ${전체.length} pages in our sitemap, asked through the Search Console URL Inspection API.`,
    whatThisIsNot: 'Not a count of the whole site. It is a sample, and a page can be indexed and still never appear for anything anyone searches — that is a different question, measured separately.',
    sitemapPages: 전체.length,
    sampled: 결과.length,
    control: { url: 대조군주소, 꼴: 대조판정.꼴, 상태: 대조판정.상태 ?? null },
    byState: [...셈].map(([k, v]) => ({ state: k, pages: v })),
    byKind: [...갈래별].map(([k, v]) => ({ kind: k, states: v })),
    rows: 결과.slice(0, 200),
  }, null, 1));
  console.log(`\n적었다 → ${path.relative(뿌리, 낼길)}`);
} else {
  console.log('\n⚠ 아직 안 적었다. 적으려면 --쓴다');
}
