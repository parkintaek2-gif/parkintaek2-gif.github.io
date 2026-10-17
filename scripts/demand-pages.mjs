#!/usr/bin/env node
/**
 * demand-pages.mjs — **이미 수요가 있는데 «아직 구글에 없는» 지면을 찾는다.**
 *
 * ── 🔴🔴 왜 (2026-10-17 · 5번) ─────────────────────────────────────────
 * 사장님 — 「**2/3 업무량을 … 방문자 늘리기에**」
 *
 * 그날 재서 나온 것 —
 * ```
 *   /companies   노출 339 · 클릭 6 · 9.1위     ← 서울마켓츠에서 가장 큰 지면
 *      그 안에서  「daoudata」  노출 45 · 6위
 *                「gemvax」    노출 13 · 4위
 * ```
 * 사람들이 «회사 이름»을 치고 있었다. 그런데 그 회사의 «낱장»에 물어보니 —
 * ```
 *   /company/daou-data        🔴 한 번도 안 왔다 (발견됨 - 색인 생성되지 않음)
 *   /company/gemvax-and-kael  🔴 한 번도 안 왔다
 * ```
 * ⇒ **낱장이 색인에 없어서 목록 지면이 대신 뜨고 있었다.** 손님이 회사 하나를 찾는데
 *   2,521개가 늘어선 목록이 나오니 안 눌린다. 클릭 6/339 가 그것이다.
 *
 * ⭐ 그래서 이 자가 한다 — **수요가 이미 잰 지면부터** 색인 줄에 세운다.
 *   하루 요청 수가 열 장 안팎이다. 2,521장을 아무 차례로 밀면 몇 해가 걸린다.
 *   ⛔ 아무거나 밀지 않는다. **사람이 이미 치고 있는 이름**부터 민다.
 *
 * ⛔ 이 자가 안 하는 것 — 지면을 만들지 않는다. 이미 있는 지면을 줄 세울 뿐이다.
 *
 * 쓰는 법
 *   node scripts/demand-pages.mjs              수요 지면을 뽑아 본다
 *   node scripts/demand-pages.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 견주기 좋게 — 소문자, 글자·숫자만 */
export function 고르기(말) {
  return String(말 ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * 손님이 친 말로 회사 낱장을 찾는다.
 *
 * ⚠ 「daoudata」 처럼 붙여 치는 것이 많아 띄어쓰기를 지우고 견준다.
 * ⚠ 「gemvax」 는 회사 이름이 「GEMVAX & KAEL」 이라 **앞머리만** 맞는다.
 *   ⛔ 앞머리 맞추기는 헛것을 만들기 쉽다. 그래서 둘을 건다 —
 *     ① 친 말이 여섯 글자 이상 ② 앞머리가 맞는 회사가 «단 하나»
 *   둘 중 하나라도 안 되면 **안 찾은 것으로 둔다.** 못 찾았다고 적는 편이 낫다.
 *
 * @param 검색어
 * @param 이름표  Map<고른이름, 주소>
 * @returns 주소 또는 null
 */
export function 이름으로찾기(검색어, 이름표) {
  const q = 고르기(검색어);
  if (q.length < 4) return null;
  if (이름표.has(q)) return 이름표.get(q);
  if (q.length < 6) return null;
  let 맞은것 = null;
  for (const [이름, 주소] of 이름표) {
    if (!이름.startsWith(q)) continue;
    if (맞은것) return null;          /* 둘 이상이면 못 고른다 */
    맞은것 = 주소;
  }
  return 맞은것;
}

/**
 * 검색어×지면 줄에서 「수요는 있는데 목록 지면이 받고 있는」 것만 고른다.
 * ⛔ 이미 낱장이 받고 있는 검색어는 손댈 것이 없다.
 */
export function 목록이받는것(줄들, 목록주소들) {
  const 목록 = new Set(목록주소들 ?? []);
  return (줄들 ?? [])
    .filter((x) => x && 목록.has(String(x.지면 ?? '').replace(/^https?:\/\/[^/]+/, '')))
    .filter((x) => Number(x.노출 ?? 0) >= 3)
    .sort((a, b) => Number(b.노출) - Number(a.노출));
}

/* ── 자가시험 ─────────────────────────────────────────────────────────── */
export function 자가시험() {
  const 것 = [];
  const 검 = (이름, 참) => 것.push({ 이름, 참: !!참 });

  const 표 = new Map([
    ['daoudata', '/company/daou-data'],
    ['gemvaxkael', '/company/gemvax-and-kael'],
    ['hitejinro', '/company/hite-jinro'],
    ['hitejinroholdings', '/company/hite-jinro-holdings'],
    ['samsungelectronics', '/company/samsung-electronics'],
  ]);

  검('🔴 붙여 친 이름을 찾는다 — 실제로 노출 45를 받던 말',
    이름으로찾기('daoudata', 표) === '/company/daou-data');
  검('🔴 띄어 친 것도 같은 곳을 찾는다',
    이름으로찾기('DAOU DATA', 표) === '/company/daou-data');
  검('🔴 앞머리만 쳐도 찾는다 — 「gemvax」',
    이름으로찾기('gemvax', 표) === '/company/gemvax-and-kael');
  검('⛔ 앞머리가 둘에 맞으면 «안» 고른다 — hitejinro / hitejinroholdings',
    이름으로찾기('hitejinr', 표) === null);
  검('⭐ 다만 꼭 맞으면 고른다 — 「hitejinro」는 그 자체가 한 회사다',
    이름으로찾기('hitejinro', 표) === '/company/hite-jinro');
  검('⛔ 너무 짧은 말은 안 고른다', 이름으로찾기('dao', 표) === null);
  검('⛔ 다섯 글자 앞머리는 안 고른다 — 헛것이 는다', 이름으로찾기('samsu', 표) === null);
  검('⛔ 없는 이름은 null', 이름으로찾기('zzzzzzzz', 표) === null);
  검('⛔ 빈 것에 안 터진다', 이름으로찾기('', 표) === null && 이름으로찾기(null, 표) === null);
  검('고르기 — 대문자·점·빈칸을 지운다', 고르기('DAOU DATA CORP.') === 'daoudatacorp');

  const 줄 = [
    { 검색어: 'daoudata', 지면: 'https://seoulmarkets.com/companies', 노출: 45 },
    { 검색어: 'gemvax', 지면: 'https://seoulmarkets.com/companies', 노출: 13 },
    { 검색어: 'x', 지면: 'https://seoulmarkets.com/companies', 노출: 1 },
    { 검색어: 'y', 지면: 'https://seoulmarkets.com/company/dae-il', 노출: 20 },
  ];
  const r = 목록이받는것(줄, ['/companies']);
  검('목록 지면이 받는 것만 고른다', r.length === 2);
  검('⛔ 낱장이 이미 받는 것은 뺀다', !r.some((x) => x.검색어 === 'y'));
  검('⛔ 노출 한둘짜리는 뺀다 — 흔들림과 못 가른다', !r.some((x) => x.검색어 === 'x'));
  검('노출 많은 것이 먼저다', r[0].검색어 === 'daoudata');
  검('⛔ 빈 것에 안 터진다', 목록이받는것(null, null).length === 0);

  for (const x of 것) console.log(`${x.참 ? '✅' : '🔴'} ${x.이름}`);
  const 탈 = 것.filter((x) => !x.참).length;
  console.log(탈 ? `\n🔴 자가시험 ${탈}건 탈` : `\n✅ 자가시험 ${것.length} 통과`);
  return 탈 === 0;
}

/* ── 손으로 돌릴 때 ───────────────────────────────────────────────────── */
const 나인가 = process.argv[1] && process.argv[1].includes('demand-pages');
if (나인가 && process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);

if (나인가) {
  const { 토큰받기 } = await import('./ga4-report.mjs');
  const { 주소표만들기, 주소조각, 꼬리표떼기 } = await import('../src/lib/company-slug.mjs');
  (function 환경파일읽기() {
    try {
      const 본문 = fs.readFileSync(path.join(뿌리, '.env'), 'utf8');
      for (const 줄 of 본문.split(/\r?\n/)) {
        const m = 줄.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
        if (!m) continue;
        if (process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
      }
    } catch { /* 없으면 정상 */ }
  })();

  const 키길 = process.env.GOOGLE_APPLICATION_CREDENTIALS
    || process.env.SEARCH_CONSOLE_KEY_FILE || process.env.GA4_KEY_FILE;
  const 키 = JSON.parse(fs.readFileSync(키길, 'utf8'));
  const 토 = await 토큰받기(키, 'https://www.googleapis.com/auth/webmasters');

  /* ① 손님이 친 말 × 받은 지면 */
  const r = await fetch(
    'https://searchconsole.googleapis.com/webmasters/v3/sites/'
    + encodeURIComponent('sc-domain:seoulmarkets.com') + '/searchAnalytics/query',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${토}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDate: new Date(Date.now() - 29 * 86400000).toLocaleDateString('sv-SE'),
        endDate: new Date(Date.now() - 2 * 86400000).toLocaleDateString('sv-SE'),
        dimensions: ['query', 'page'], rowLimit: 25000,
      }),
    },
  );
  const j = await r.json();
  if (j.error) { console.log('🔴 못 쟀다 —', j.error.message); process.exit(1); }
  const 줄 = (j.rows ?? []).map((x) => ({
    검색어: x.keys[0], 지면: x.keys[1], 노출: x.impressions, 클릭: x.clicks, 순위: x.position,
  }));

  const 목록주소 = ['/companies', '/japan/companies', '/taiwan/companies', '/uae/companies'];
  const 고른것 = 목록이받는것(줄, 목록주소);
  console.log(`■ 목록 지면이 받고 있는 검색어 ${고른것.length}개`);

  /* ② 그 말이 가리키는 «낱장» 주소를 찾는다 */
  const tape = JSON.parse(fs.readFileSync(path.join(뿌리, 'src/data/korea-financials-tape.json'), 'utf8'));
  /* 🔴🔴 [2026-10-17] 처음에 tape.rows 를 통째로 넘겼더니 주소가 전부 404 였다.
     한 회사가 «해마다 한 줄»씩 들어 있어서 slug 가 다 겹친 것으로 보이고,
     겹치면 종목코드를 뒤에 붙이는 규칙이 2,703개 모두에 걸렸다.
     지면을 찍는 [slug].astro 는 «회사당 한 줄»(회사머리)로 표를 짓는다. 똑같이 한다.
     ⛔ 이것이 「주소표를 쪽부분으로 지으면 안 된다」고 저장소가 이미 적어 둔 바로 그 함정이다. */
  const 묶음 = new Map();
  for (const r2 of tape.rows) { if (!묶음.has(r2.code)) 묶음.set(r2.code, r2); }
  const 회사머리 = [...묶음.values()];
  const 표 = 주소표만들기(회사머리);
  const 이름표 = new Map();
  for (const r2 of 회사머리) {
    const 주소 = 표.get(String(r2.code));
    if (!주소) continue;
    const 키2 = 고르기(꼬리표떼기(r2.name_en || ''));
    if (키2 && !이름표.has(키2)) 이름표.set(키2, `/company/${주소}`);
  }
  console.log(`   회사 이름표 ${이름표.size.toLocaleString('ko-KR')}개로 맞춰 본다\n`);

  const 찾은것 = [];
  for (const x of 고른것) {
    const 주소 = 이름으로찾기(x.검색어, 이름표);
    if (!주소) { console.log(`   ⬜ 못 찾음  노출 ${String(x.노출).padStart(3)}  「${x.검색어}」`); continue; }
    찾은것.push({ ...x, 낱장: 주소 });
    console.log(`   ✅ 노출 ${String(x.노출).padStart(3)} · ${x.순위.toFixed(1)}위  「${x.검색어}」 → ${주소}`);
  }
  /* 🔴 [2026-10-17] 주소를 «지어 놓고» 색인 요청을 하면 404 에 할당량을 버린다.
     처음 돌렸을 때 실제로 열넷이 다 404 였다 — 주소표를 쪽부분으로 지은 탓이다.
     고쳤지만, 고쳤다고 믿지 않는다. **한 번은 실물을 본다.** */
  const 성한것 = [];
  for (const x of 찾은것) {
    let 코드 = 0;
    try { 코드 = (await fetch('https://seoulmarkets.com' + x.낱장, { redirect: 'follow' })).status; }
    catch { 코드 = 0; }
    if (코드 === 200) 성한것.push(x);
    else console.log('   🔴 ' + (코드 || '못 열림') + ' — ' + x.낱장 + ' (주소가 틀렸다. 빼고 간다)');
  }
  찾은것.length = 0;
  찾은것.push(...성한것);

  console.log(`\n■ 수요가 이미 있는 낱장 ${찾은것.length}장 — 다 실물로 200 을 봤다`);
  console.log('⛔ 이 자는 지면을 만들지 않는다. 색인 줄에 세울 차례를 정할 뿐이다.');

  if (찾은것.length) {
    const 낼곳 = path.join(뿌리, 'docs/수요지면.tsv');
    fs.writeFileSync(낼곳,
      '# 검색어\t노출\t순위\t낱장 주소 (수요가 이미 있는데 색인에 없는 곳)\n'
      + 찾은것.map((x) => `${x.검색어}\t${x.노출}\t${x.순위.toFixed(1)}\t${x.낱장}`).join('\n') + '\n',
      'utf8');
    console.log(`📈 적었다 — docs/수요지면.tsv`);
  }
}
