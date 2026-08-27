#!/usr/bin/env node
/**
 * **손님이 치는데 우리 제목에 없는 낱말**을 지면마다 찾는다.
 *
 * ── 🔴 왜 만드나 (2026-08-27 16:2x · 5번) ────────────────────────────
 * 오늘 이 방법으로 두 번 크게 건졌다. 손으로 두 번 했으면 자로 만들 때다.
 *
 *   ① 생일 지면 366장 — GSC 로 재 보니 검색어에 「kpop」이 있는 다섯 개는 순위 54~63,
 *      없는 두 개는 **9·12** 였다. 지면에 「K-pop」이라는 낱말이 **한 번도 없었다.**
 *   ② 달 지면 12장 — 같은 흠. 「kpop birthdays in january」 63위.
 *
 * ⭐ 규칙 하나로 줄이면 이렇다 —
 *   **손님이 그 말로 우리를 찾아왔는데(노출이 있는데) 우리 제목이 그 말을 안 하고 있으면,
 *   순위가 뒤로 밀린다.** 구글이 제목을 가장 무겁게 읽기 때문이다.
 *
 * ⛔ 「낱말을 넣어라」가 아니다. **그 말이 사실인지부터 본다.**
 *   K-pop 을 넣을 수 있었던 것은 위키데이터에서 9,249명의 소속을 캐 왔기 때문이다.
 *   근거 없이 낱말만 넣는 것은 낚는 것이고, 우리 강령 ①에 어긋난다.
 *   그래서 이 자는 **고치지 않는다. 찾아서 보여 주기만 한다.**
 *
 * ── 무엇을 세는가 ────────────────────────────────────────────────
 *   ① GSC 에서 (지면 × 검색어) 를 받는다
 *   ② 지면마다 「그 지면에 닿은 검색어들의 낱말」을 노출 수로 무게를 매겨 모은다
 *   ③ dist 의 그 지면 «제목»에 그 낱말이 있는지 본다
 *   ④ 없는데 노출이 큰 낱말부터 보여 준다
 *
 * ⚠ 흔한 말(the·in·on·korean…)은 뺀다. 그것이 빠졌다고 순위가 밀리지 않는다.
 * ⚠ 「제목에 없다」가 곧 「넣어야 한다」는 아니다. 사람이 보고 정한다.
 *
 * 쓰는 법:
 *   node scripts/find-missing-words.mjs sc-domain:kculturewire.com --days 28
 *   node scripts/find-missing-words.mjs --자가시험
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { createSign } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* ── 재는 규칙 (순수 함수 — 자가시험이 여기를 잰다) ───────────────── */

/** 세지 않는 흔한 말. ⚠ 「korean」은 우리 제목에 거의 다 있으므로 뺀다(늘 통과해 뜻이 없다). */
export const 흔한말 = new Set([
  'the', 'a', 'an', 'of', 'in', 'on', 'at', 'to', 'for', 'and', 'or', 'is', 'are', 'was', 'were',
  'be', 'by', 'with', 'from', 'as', 'that', 'this', 'it', 'its', 'do', 'does', 'did', 'how', 'what',
  'when', 'where', 'who', 'which', 'why', 'can', 'has', 'have', 'had', 'i', 'you', 'we', 'they',
  'my', 'your', 'our', 'their', 'not', 'no', 'all', 'any', 'more', 'most', 'much', 'many',
  'korean', 'korea', 'com', 'www', 'https', 'http',
]);

/**
 * 검색어를 낱말로 쪼갠다. 소문자로 맞추고, 흔한 말과 한 글자를 뺀다.
 * ⛔ 숫자만 있는 조각은 뺀다 — 「2024」가 제목에 없다고 흠이 아니다(해마다 바뀐다).
 */
export function 낱말들(글자) {
  return [...new Set(String(글자 ?? '').toLowerCase()
    .replace(/[^a-z0-9가-힣'\-\s]/g, ' ')
    .split(/\s+/)
    .map((w) => w.replace(/^[-']+|[-']+$/g, ''))
    .filter((w) => w.length > 1 && !흔한말.has(w) && !/^\d+$/.test(w)))];
}

/**
 * 제목이 그 낱말을 «담고 있나».
 * ⚠ 「kpop」과 「k-pop」은 같은 말이다 — 손님은 붙여 치고 우리는 붙임표를 쓴다.
 *   이것을 안 맞춰 주면 고쳐 놓고도 「아직 없다」고 나온다.
 * ⚠ 복수형도 같은 말로 본다(birthday/birthdays).
 */
export function 담고있나(제목, 낱말) {
  const t = String(제목 ?? '').toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
  const w = String(낱말 ?? '').toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
  if (!w) return true;
  if (t.includes(w)) return true;
  if (w.endsWith('s') && t.includes(w.slice(0, -1))) return true;
  if (t.includes(`${w}s`)) return true;
  return false;
}

/**
 * 지면 하나에 대해 **빠진 낱말**을 노출 무게 순으로 낸다.
 * @param {{query:string, impressions:number, position:number}[]} 검색어들
 */
export function 빠진낱말(제목, 검색어들 = []) {
  const 무게 = new Map();
  for (const r of 검색어들) {
    for (const w of 낱말들(r.query)) {
      if (담고있나(제목, w)) continue;
      const 이전 = 무게.get(w) ?? { 낱말: w, 노출: 0, 검색어수: 0, 순위합: 0 };
      이전.노출 += r.impressions ?? 0;
      이전.검색어수 += 1;
      이전.순위합 += (r.position ?? 0) * (r.impressions ?? 1);
      무게.set(w, 이전);
    }
  }
  return [...무게.values()]
    .map((x) => ({ ...x, 평균순위: x.노출 ? x.순위합 / x.노출 : null }))
    .sort((a, b) => b.노출 - a.노출 || b.검색어수 - a.검색어수);
}

/* ── dist 에서 제목 읽기 ────────────────────────────────────────── */

/** 주소 → dist 파일 자리들. ⚠ `/a` 는 `a.html` 일 수도 `a/index.html` 일 수도 있다. */
export function 파일자리들(주소, 뿌리경로, 접두 = '') {
  const 이름 = (주소 || '/').split('?')[0].split('#')[0].replace(/\/$/, '').replace(/^\//, '');
  const 자리 = [];
  const 붙임 = (밑) => {
    if (이름 === '') { if (밑 !== 뿌리경로) 자리.push(`${밑}.html`); 자리.push(path.join(밑, 'index.html')); return; }
    자리.push(path.join(밑, `${이름}.html`));
    자리.push(path.join(밑, 이름, 'index.html'));
  };
  if (접두) 붙임(path.join(뿌리경로, 접두));
  붙임(뿌리경로);
  return 자리;
}

export function 제목뽑기(글자) {
  if (typeof 글자 !== 'string') return null;
  const m = 글자.match(/<title>([\s\S]*?)<\/title>/i);
  if (!m) return null;
  const 풀 = m[1].replace(/&mdash;/g, '—').replace(/&amp;/g, '&')
    .replace(/&#39;|&rsquo;|&apos;/g, "'").replace(/&quot;/g, '"').trim();
  const 자리 = Math.max(풀.lastIndexOf(' | '), 풀.lastIndexOf(' — '), 풀.lastIndexOf(' - '));
  return 자리 > 0 ? 풀.slice(0, 자리).trim() : 풀;
}

/* ── 실제로 재기 ─────────────────────────────────────────────── */

function 환경읽기() {
  try {
    for (const 줄 of readFileSync(path.join(뿌리, '.env'), 'utf8').split(/\r?\n/)) {
      const m = 줄.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  } catch { /* 없으면 정상 */ }
}

async function 토큰받기(키) {
  const 지금 = Math.floor(Date.now() / 1000);
  const 헤더 = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const 몸 = Buffer.from(JSON.stringify({
    iss: 키.client_email,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: 지금, exp: 지금 + 3600,
  })).toString('base64url');
  const 서명대상 = `${헤더}.${몸}`;
  const jwt = `${서명대상}.${createSign('RSA-SHA256').update(서명대상).sign(키.private_key, 'base64url')}`;
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error(`토큰 실패: ${JSON.stringify(j).slice(0, 200)}`);
  return j.access_token;
}

async function 재기(사이트, 일수, 행수) {
  환경읽기();
  const 키파일 = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!키파일 || !existsSync(키파일)) {
    console.error('⛔ GOOGLE_APPLICATION_CREDENTIALS 를 못 찾았다. 「못 쟀다」는 「없다」가 아니다.');
    process.exit(1);
  }
  const 토큰 = await 토큰받기(JSON.parse(readFileSync(키파일, 'utf8')));
  const 끝 = new Date(); 끝.setDate(끝.getDate() - 2);
  const 시작 = new Date(끝); 시작.setDate(시작.getDate() - 일수);
  const 날 = (d) => d.toISOString().slice(0, 10);
  const r = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(사이트)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${토큰}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDate: 날(시작), endDate: 날(끝),
        dimensions: ['page', 'query'], rowLimit: 행수,
      }),
    },
  );
  const j = await r.json();
  if (j.error) { console.error(`🔴 ${j.error.message}`); process.exit(1); }
  return { 행: j.rows ?? [], 창: `${날(시작)} ~ ${날(끝)}`, 행수 };
}

function 화면(결과, 뿌리경로, 접두, 적어도) {
  const { 행, 창, 행수 } = 결과;
  console.log(`# 손님이 치는데 우리 제목에 없는 낱말 — ${창}`);
  if (행.length >= 행수) console.log(`⚠ 구글이 준 줄이 상한(${행수})과 같다 — **잘렸을 수 있다.**`);
  const 지면별 = new Map();
  for (const row of 행) {
    const [page, query] = row.keys;
    const 주소 = page.replace(/^https?:\/\/[^/]+/, '');
    if (!지면별.has(주소)) 지면별.set(주소, []);
    지면별.get(주소).push({ query, impressions: row.impressions, position: row.position });
  }
  const 낼것 = [];
  let 못잼 = 0;
  for (const [주소, 검색어들] of 지면별) {
    const 자리 = 파일자리들(주소, 뿌리경로, 접두);
    const f = 자리.find((p) => existsSync(p));
    if (!f) { 못잼 += 1; continue; }
    const 제목 = 제목뽑기(readFileSync(f, 'utf8'));
    if (제목 === null) { 못잼 += 1; continue; }
    const 빠진 = 빠진낱말(제목, 검색어들).filter((x) => x.노출 >= 적어도);
    if (빠진.length) 낼것.push({ 주소, 제목, 빠진, 노출합: 검색어들.reduce((s, x) => s + x.impressions, 0) });
  }
  낼것.sort((a, b) => b.빠진[0].노출 - a.빠진[0].노출);
  console.log(`  지면 ${지면별.size}장 · 빠진 낱말이 있는 지면 **${낼것.length}장**`
    + (못잼 ? ` · ⚠ 지면 파일을 못 찾아 «못 잰» 것 ${못잼}장` : ''));
  console.log('');
  for (const it of 낼것.slice(0, 25)) {
    console.log(`  ${it.주소}   (노출 ${it.노출합})`);
    console.log(`     제목  「${it.제목}」`);
    for (const w of it.빠진.slice(0, 5)) {
      console.log(`     🔴 「${w.낱말}」 — 노출 ${w.노출} · 검색어 ${w.검색어수}개`
        + (w.평균순위 ? ` · 그 말로 온 평균순위 ${w.평균순위.toFixed(1)}` : ''));
    }
    console.log('');
  }
  if (!낼것.length) console.log('✅ 노출이 큰 낱말 중 제목에서 빠진 것이 없다');
  console.log('⛔ **낱말을 넣으라는 말이 아니다.** 그 말이 우리 지면에서 «사실인지»부터 본다.');
  console.log('   근거 없이 낱말만 넣으면 낚는 것이고, 손님이 들어와서 없는 것을 보면 더 나빠진다.');
  console.log('   K-pop 을 넣을 수 있었던 것은 9,249명의 소속을 캐 왔기 때문이다.');
  console.log('');
  console.log('🔴 **그리고 가장 큰 낱말이 함정일 수 있다 — 2026-08-27 에 처음 돌려 보고 알았다.**');
  console.log('   이 자가 맨 위에 올린 것이 「tudum」·「top10」·「all-weeks-countries.tsv」였다.');
  console.log('   노출이 크고 순위도 2~4위로 좋다. 그런데 **클릭이 0** 이다 —');
  console.log('   그 사람들은 «넷플릭스 원본 파일»을 찾아온 것이라, 우리가 가져올 수 있는 클릭이');
  console.log('   아니다. 주소를 통째로 친 검색어(https://…)가 섞여 있으면 그 갈래로 본다.');
  console.log('   ⭐ 가르는 물음 하나 — **「이 사람이 우리 지면에서 원하는 것을 얻나?」**');
  console.log('     얻으면 고칠 값이 있고, 남의 것을 찾아온 것이면 순위를 올려도 안 눌린다.');
}

/* ── 자가시험 ─────────────────────────────────────────────── */
function 자가시험() {
  let 통과 = 0; let 실패 = 0;
  const 검 = (이름, 조건) => { if (조건) { 통과++; console.log(`  ✅ ${이름}`); } else { 실패++; console.log(`  ⛔ ${이름}`); } };

  검('흔한 말을 뺀다', !낱말들('how many are in the group').includes('the'));
  검('한 글자를 뺀다', !낱말들('a b kpop').includes('b'));
  검('숫자만 있는 조각을 뺀다 — 해마다 바뀐다', !낱말들('kpop 2024').includes('2024'));
  검('「korean」은 안 센다 — 우리 제목에 거의 다 있다', !낱말들('korean actors').includes('korean'));
  검('남는 말은 남긴다', 낱말들('august 1 kpop birthday').sort().join(',') === 'august,birthday,kpop');

  검('🔴 kpop 과 k-pop 을 같은 말로 본다', 담고있나('10 in K-pop groups', 'kpop') === true);
  검('붙임표를 넣어 쳐도 같다', 담고있나('K-pop groups', 'k-pop') === true);
  검('복수형을 같은 말로 본다', 담고있나('a birthday page', 'birthdays') === true);
  검('단수형도 같은 말로 본다', 담고있나('birthdays here', 'birthday') === true);
  검('없는 말은 없다고 한다', 담고있나('Korean stars born on 1 August', 'kpop') === false);
  검('빈 낱말은 있는 것으로 본다 — 흠으로 세지 않는다', 담고있나('아무것', '') === true);

  const 검색어들 = [
    { query: 'august 1 kpop birthday', impressions: 10, position: 63 },
    { query: 'kpop idols march birthdays', impressions: 5, position: 56 },
    { query: 'korean actors born in september', impressions: 3, position: 12 },
  ];
  const r = 빠진낱말('Korean stars born on 1 August', 검색어들);
  검('⭐ 가장 큰 빠진 낱말이 kpop 이다', r[0].낱말 === 'kpop');
  검('노출을 합친다', r[0].노출 === 15);
  검('검색어 수를 센다', r[0].검색어수 === 2);
  검('제목에 있는 말은 안 낸다', !r.some((x) => x.낱말 === 'august'));
  검('⭐ 제목을 고치면 kpop 이 사라진다',
    !빠진낱말('22 Korean stars born on 1 August — 10 in K-pop groups', 검색어들).some((x) => x.낱말 === 'kpop'));
  검('빈 입력이어도 안 죽는다', 빠진낱말('제목', []).length === 0 && 빠진낱말().length === 0);

  검('제목에서 꼬리를 뗀다', 제목뽑기('<title>A page | K Culture Wire</title>') === 'A page');
  검('엔티티를 되돌린다', 제목뽑기('<title>Korea&#39;s ladder | K Culture Wire</title>') === "Korea's ladder");

  console.log(`\n자가시험 ${통과 + 실패}개 · 실패 ${실패}개`);
  return 실패;
}

const 이파일직접 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (이파일직접) {
  if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 1 : 0);
  else {
    const 사이트 = process.argv[2];
    if (!사이트) {
      console.error('쓰는 법: node scripts/find-missing-words.mjs sc-domain:kculturewire.com [--days 28] [--행수 5000] [--적어도 3]');
      process.exit(1);
    }
    const arg = (n, d) => { const i = process.argv.indexOf(n); return i > -1 ? Number(process.argv[i + 1]) : d; };
    const 결과 = await 재기(사이트, arg('--days', 28), arg('--행수', 5000));
    화면(결과, path.join(뿌리, 'dist'), 'wikitip', arg('--적어도', 2));
  }
}
