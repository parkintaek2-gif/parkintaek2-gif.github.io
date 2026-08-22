#!/usr/bin/env node
/**
 * measure-kcw-winnable.mjs — **바꿀 수 있는 노출과 못 바꿀 노출을 갈라 센다.**
 *
 * ── 왜 (2026-08-22 실측) ────────────────────────────────────────
 * `measure-kcw-ctr-gap` 이 일 순서를 「노출이 큰 것부터」로 줬다. 그 첫째가
 * `/market/nicaragua` — 노출 175 · 순위 7.7 · 클릭 0 이었다.
 * 그 지면에 닿는 검색어를 실제로 뽑아 보니 여덟 개가 전부 이런 것이었다 —
 * ```
 *  60건  https://www.netflix.com/tudum/top10?week=2024-11-03
 *  36건  "https://www.netflix.com/tudum/top10?week=2024-11-03"
 *  12건  "netflix.com/tudum/top10?week=2024-11-03"
 * ```
 * **넷플릭스 주소를 검색창에 그대로 치는 사람**이다. 그 사람이 찾는 지면은 1등에 있고
 * 그것이 넷플릭스다. 우리 제목을 무엇으로 바꿔도 안 눌린다.
 *
 * ⛔ 그러면 그 175는 **일 순서 맨 앞에 설 자격이 없다.** 노출과 순위만 보면 가장 큰
 *   구멍처럼 보이는데 손을 대도 아무 일이 안 일어난다. 자가 사람을 헛일로 보낸다.
 * ⭐ 그래서 노출을 **두 통으로 가른다** — 우리가 답이 될 수 있는 말과, 남의 주소를 찾는 말.
 *
 * ── 무엇을 「못 바꿀 노출」로 보나 ─────────────────────────────
 * ① 검색어가 **주소**다 (`http`, `www.`, 도메인+경로 꼴)
 * ② 검색어가 **파일 이름**이다 (`all-weeks-countries.tsv`)
 * ⛔ 그 외에는 넘기지 않는다. 「이건 안 될 것 같다」는 판정을 자가 하지 않는다.
 *   남의 상호가 들어간 것만으로 넘기지도 않는다 — 「netflix korea」는 우리가 답이 될 수 있다.
 *
 * ⚠ 「못 바꿀 노출」은 **지우는 것이 아니다.** 세서 따로 적는다 —
 *   못 잰 칸을 0으로 안 채우는 것과 같은 까닭이다. 나중에 뜻이 달라질 수 있다.
 *
 * 쓰는 법
 *   node scripts/measure-kcw-winnable.mjs --자가시험
 *   node scripts/measure-kcw-winnable.mjs --잰다 [--지면수=12] [--일수=28]
 *   node scripts/measure-kcw-winnable.mjs --잰다 --쓴다
 *
 * ⚠ Search Console API 를 지면마다 한 번씩 부른다. 지면수를 크게 주면 오래 걸린다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createSign } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 사이트 = 'sc-domain:kculturewire.com';
const ORIGIN = 'https://www.kculturewire.com';
const 큐길 = path.join(뿌리, 'src/data/wikitip-ctr-gap.json');
const 낼길 = path.join(뿌리, 'src/data/wikitip-winnable.json');

/**
 * 검색어가 **주소를 치는 말**인가.
 * ⛔ 「우리 것이 아닌 브랜드가 들어갔다」로 판정하지 않는다 — 갈림은 **주소 꼴인가**로만 한다.
 */
export function 주소를치나(검색어) {
  const s = String(검색어 ?? '').trim().replace(/^["']|["']$/g, '').toLowerCase();
  if (!s) return false;
  if (/^https?:\/\//.test(s)) return true;
  if (/^www\./.test(s)) return true;
  if (/\.(tsv|csv|json|xml|xlsx)\b/.test(s)) return true;
  if (/[a-z0-9-]+\.(com|net|org|co|io|ai|tv)\//.test(s)) return true;
  return false;
}

/** 두 통으로 가른다. 합은 언제나 전체와 같아야 한다 — 잃어버리는 노출이 없게 */
export function 가르기(행들) {
  const 될것 = [];
  const 안될것 = [];
  for (const r of 행들 ?? []) (주소를치나(r.검색어) ? 안될것 : 될것).push(r);
  const 합 = (a) => a.reduce((n, r) => n + (r.노출 ?? 0), 0);
  return { 될것, 안될것, 될노출: 합(될것), 안될노출: 합(안될것) };
}

if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  /* 🔴 오늘 실제로 본 여덟 줄이다 */
  검('http 로 시작하면 주소', 주소를치나('https://www.netflix.com/tudum/top10?week=2024-11-03'));
  검('따옴표가 붙어도 주소', 주소를치나('"https://www.netflix.com/tudum/top10?week=2024-11-03"'));
  검('www. 로 시작하면 주소', 주소를치나('www.netflix.com/tudum/top10?week=2024-11-03'));
  검('도메인+경로면 주소', 주소를치나('netflix.com/tudum/top10?week=2024-11-03'));
  검('파일 이름이면 주소', 주소를치나('all-weeks-countries.tsv'));

  /* ⛔ 우리가 답이 될 수 있는 말을 넘기면 그 일이 큐에서 사라진다 */
  검('«korea ladder» 는 될 것', 주소를치나('korea ladder') === false);
  검('«netflix korea» 는 될 것 — 상호만으로 넘기지 않는다', 주소를치나('netflix korea') === false);
  검('«netflix top 10 nicaragua» 는 될 것', 주소를치나('netflix top 10 nicaragua') === false);
  검('«knight flower netflix» 는 될 것', 주소를치나('knight flower netflix') === false);
  검('⛔ 빈 값은 주소가 아니다', 주소를치나('') === false && 주소를치나(null) === false);

  const g = 가르기([
    { 검색어: 'korea ladder', 노출: 9 },
    { 검색어: 'https://www.netflix.com/tudum/top10?week=2024-11-03', 노출: 60 },
  ]);
  검('가른 노출 합이 전체와 같다', g.될노출 + g.안될노출 === 69);
  검('될 것이 하나', g.될것.length === 1 && g.될노출 === 9);
  검('안 될 것이 하나', g.안될것.length === 1 && g.안될노출 === 60);
  검('⛔ 빈 배열도 안 터진다', 가르기([]).될노출 === 0 && 가르기(undefined).안될노출 === 0);

  if (실패.length) {
    console.error(`❌ 자가시험 실패\n${실패.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log('✅ measure-kcw-winnable 자가시험 통과 (14)');
  process.exit(0);
}

if (!process.argv.includes('--잰다')) {
  console.log('⛔ --잰다 나 --자가시험 을 준다');
  process.exit(1);
}

/* ── 여기부터 실측 ── */
(function 환경파일읽기() {
  try {
    for (const 줄 of fs.readFileSync(path.join(뿌리, '.env'), 'utf8').split(/\r?\n/)) {
      const m = 줄.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  } catch { /* 없으면 정상 */ }
})();

const 키파일 = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!키파일) {
  console.error('⛔ GOOGLE_APPLICATION_CREDENTIALS 가 없다 — **못 쟀다**. 0이 아니다');
  process.exit(1);
}
const 키 = JSON.parse(fs.readFileSync(키파일, 'utf8'));

async function 토큰받기() {
  const 이제 = Math.floor(Date.now() / 1000);
  const h = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const b = Buffer.from(JSON.stringify({
    iss: 키.client_email,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: 이제,
    exp: 이제 + 3600,
  })).toString('base64url');
  const 서명 = createSign('RSA-SHA256').update(`${h}.${b}`).sign(키.private_key, 'base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${h}.${b}.${서명}`,
    }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error(`토큰 실패: ${JSON.stringify(j)}`);
  return j.access_token;
}

const 인자 = (이름, 기본) => Number((process.argv.find((a) => a.startsWith(`${이름}=`))?.split('=')[1]) ?? 기본);
const 지면수 = 인자('--지면수', 12);
const 일수 = 인자('--일수', 28);

const 큐 = JSON.parse(fs.readFileSync(큐길, 'utf8'));
const 대상 = (큐.firstPageNoClickRows ?? 큐.rows ?? [])
  .filter((r) => (r.클릭 ?? 0) === 0 && (r.노출 ?? 0) > 0)
  .sort((a, b) => (b.노출 ?? 0) - (a.노출 ?? 0))
  .slice(0, 지면수);

if (!대상.length) {
  console.error('⛔ 큐가 비었다 — measure-kcw-ctr-gap 을 --쓴다 로 먼저 돌린다');
  process.exit(1);
}

const 토큰 = await 토큰받기();
const 끝 = new Date(); 끝.setDate(끝.getDate() - 2);
const 시작 = new Date(끝); 시작.setDate(시작.getDate() - 일수);
const 날짜 = (d) => d.toISOString().slice(0, 10);

async function 검색어받기(주소) {
  const r = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(사이트)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${토큰}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDate: 날짜(시작),
        endDate: 날짜(끝),
        dimensions: ['query'],
        rowLimit: 100,
        dimensionFilterGroups: [{
          filters: [{ dimension: 'page', operator: 'equals', expression: ORIGIN + 주소 }],
        }],
      }),
    },
  );
  const j = await r.json();
  if (j.error) return { 못쟀다: j.error.message };
  return {
    행: (j.rows ?? []).map((x) => ({
      검색어: x.keys[0], 노출: x.impressions, 순위: +x.position.toFixed(1),
    })),
  };
}

console.log(`# 바꿀 수 있는 노출인가 — 클릭 0인 지면 ${대상.length}장 · 최근 ${일수}일`);
console.log(`  ${날짜(시작)} ~ ${날짜(끝)}\n`);

const 낼것 = [];
let 될합 = 0;
let 안될합 = 0;
let 감춘합 = 0;
let 못잰장 = 0;
for (const p of 대상) {
  const res = await 검색어받기(p.주소);
  if (res.못쟀다) { 못잰장 += 1; console.log(`⚠ 못 쟀다 · ${p.주소} — ${res.못쟀다}`); continue; }
  const g = 가르기(res.행);
  /**
   * 🔴 2026-08-22 — /for-industry 는 지면 기준 노출 9인데 **검색어 줄이 0개**로 왔다.
   *   구글은 드문 검색어를 개인정보 때문에 감춘다(anonymized queries). 그래서
   *   **검색어별 합은 지면 합보다 늘 작다.**
   *   ⛔ 그 차이를 0으로 두면 「닿는 말이 없다」로 잘못 읽혀 그 지면이 큐에서 지워진다.
   *   ⭐ 차이를 «구글이 안 알려 준 노출»로 따로 세서 적는다. 못 잰 것은 못 쟀다고 적는다.
   */
  const 감춘것 = Math.max(0, (p.노출 ?? 0) - g.될노출 - g.안될노출);
  될합 += g.될노출; 안될합 += g.안될노출; 감춘합 += 감춘것;
  낼것.push({
    page: p.주소,
    impressions: p.노출,
    position: p.순위,
    winnableImpressions: g.될노출,
    addressQueryImpressions: g.안될노출,
    impressionsGoogleWithheld: 감춘것,
    topWinnableQueries: g.될것.sort((a, b) => b.노출 - a.노출).slice(0, 5)
      .map((r) => ({ query: r.검색어, impressions: r.노출, position: r.순위 })),
  });
  const 몫 = (g.될노출 + g.안될노출) ? Math.round((100 * g.안될노출) / (g.될노출 + g.안될노출)) : null;
  console.log(`${g.될노출 === 0 && 감춘것 === 0 ? '⛔' : '  '} ${p.주소}`);
  console.log(`     노출 ${p.노출} · 순위 ${p.순위} · 바꿀 수 있는 것 ${g.될노출} · 남의 주소 ${g.안될노출}${몫 === null ? '' : ` (${몫}%)`}· 구글이 안 알려 준 것 ${감춘것}`);
  for (const r of g.될것.sort((a, b) => b.노출 - a.노출).slice(0, 4)) {
    console.log(`       «${r.검색어}» 노출 ${r.노출} · ${r.순위}위`);
  }
}

console.log('\n## 합');
console.log(`  바꿀 수 있는 노출        ${될합}`);
console.log(`  남의 주소를 찾는 노출    ${안될합}   ⛔ 제목을 고쳐도 안 눌린다`);
console.log(`  구글이 안 알려 준 노출   ${감춘합}   ⚠ 못 쟀다. 0 이 아니다 — 드문 검색어를 구글이 감춘다`);
console.log();
if (못잰장) console.log(`  ⚠ 못 잰 지면 ${못잰장}장 — 0이 아니다`);

if (process.argv.includes('--쓴다')) {
  const 몸 = {
    generated: 날짜(new Date()),
    window: { start: 날짜(시작), end: 날짜(끝), days: 일수 },
    whatThisIs: 'Zero-click pages split by whether the searches reaching them are things we could ever answer. '
      + 'A query that is somebody else’s web address is counted separately, because the page that searcher '
      + 'wants is already ranked first and it is not ours.',
    whatThisIsNot: 'Not a judgement of page quality, and not a claim that address queries are worthless — only '
      + 'that rewriting our own title cannot win them. Pages we could not measure are listed as unmeasured, never '
      + 'as zero.',
    winnableImpressions: 될합,
    addressQueryImpressions: 안될합,
    impressionsGoogleWithheld: 감춘합,
    unmeasuredPages: 못잰장,
    rows: 낼것,
  };
  fs.writeFileSync(낼길, `${JSON.stringify(몸, null, 1)}\n`);
  console.log(`\n✅ 적었다 — ${path.relative(뿌리, 낼길)}`);
} else {
  console.log('\n⚠ 아직 안 적었다. 적으려면 --쓴다');
}
