#!/usr/bin/env node
/**
 * 물어본다-색인됐나.mjs — **구글에게 「이 지면이 색인에 있나」를 직접 묻는다.**
 *
 * ── 🔴 왜 만드나 (2026-10-06 · 5번) ───────────────────────────────────
 * klifemap 은 글이 **2,890장**인데 28일 동안 구글 노출이 **7회**다(지면 두 장).
 * 스타 지면 2,248장은 **한 번도 뜬 적이 없다.**
 *
 * ⛔ 그렇다고 「색인이 안 됐다」고 적을 수는 없다 —
 *   **「GSC 실적에 안 뜬다」는 「노출이 한 번도 없었다」일 뿐**이고,
 *   색인에는 있는데 아무 질의에도 안 걸렸을 수도 있다. 둘은 다른 말이다.
 * ⇒ 그래서 **구글에게 직접 묻는다.** URL 검사 API 가 그 답을 준다.
 *
 * ⚠ 오늘 아침에 겹침을 61% → 60% 로 줄이는 데 시간을 썼다. 그런데 그 지면들이
 *   «색인에 아예 없다»면 겹침은 고칠 자리가 아니었다. **먼저 물어야 했다.**
 *
 * ── ⛔ 지키는 것 ──────────────────────────────────────────────────────
 * · 하루 한도가 있다(계정당 하루 2,000건·분당 600건). **몇 장만 골라 묻는다.**
 * · 못 물으면 «못 쟀다»로 둔다. 「색인이 없다」로 읽지 않는다.
 * · 열쇠 값을 화면에 찍지 않는다. 계정 이름까지만 적는다.
 *
 * 쓰는 법
 *   node scripts/물어본다-색인됐나.mjs --자가시험
 *   node scripts/물어본다-색인됐나.mjs --사이트 klifemap --주소 /content/star-q18116606-saju
 *   node scripts/물어본다-색인됐나.mjs --사이트 klifemap --묶음별   갈래마다 몇 장씩 골라 묻는다
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 토큰받기 } from './fetch-gsc.mjs';

const 여기 = path.dirname(fileURLToPath(import.meta.url));
export const 뿌리 = path.resolve(여기, '..');

export const 사이트들 = {
  klifemap: { 속성: 'sc-domain:klifemap.ai', 바닥: 'https://klifemap.ai' },
  seoulmarkets: { 속성: 'sc-domain:seoulmarkets.com', 바닥: 'https://seoulmarkets.com' },
  '100y': { 속성: 'sc-domain:100yearmap.com', 바닥: 'https://100yearmap.com' },
  kcw: { 속성: 'sc-domain:kculturewire.com', 바닥: 'https://kculturewire.com' },
};

/** 묶음마다 몇 장씩 물을지. ⛔ 한도가 있으니 적게 — 갈래가 색인되나만 보면 된다 */
export const 묶음당몇장 = 3;

export const 묶음들 = [
  { 이름: 'star saju ko', 꼴: /\/content\/star-q\d+-saju$/ },
  { 이름: 'star astro ko', 꼴: /\/content\/star-q\d+-astro$/ },
  { 이름: 'star saju en', 꼴: /\/content\/star-q\d+-saju-en$/ },
  { 이름: 'star astro en', 꼴: /\/content\/star-q\d+-astro-en$/ },
  { 이름: 'ttigh 궁합', 꼴: /\/content\/ttigh-/ },
  { 이름: 'ilju 일주', 꼴: /\/content\/ilju-/ },
  { 이름: 'ilzin 일진', 꼴: /\/content\/ilzin-/ },
];




/**
 * 🔴 [2026-10-06 10:0x · 5번] **사이트맵이 «묶음»일 때 자식 사이트맵을 물어 버렸다.**
 *   seoulmarkets 의 `/sitemap.xml` 은 지면이 아니라 사이트맵 열한 개를 가리키는 묶음이다.
 *   그런데 내 자는 그 안의 `<loc>` 을 그냥 지면으로 알고 `/sitemap-japan.xml` 따위를 물었다.
 *   구글은 당연히 「모른다」고 했고, 나는 하마터면 **「서울마켓츠가 통째로 색인에 없다」**로 읽을 뻔했다.
 * ⛔ 자료의 «꼴»을 안 보고 읽으면 엉뚱한 결론이 난다.
 * ⇒ 묶음이면 한 겹 펴서 진짜 지면 주소를 가져온다.
 * ⚠ 한 겹만 편다. 묶음 안에 묶음이 또 있으면 그것은 «못 쟀다»로 둔다.
 */
export async function 사이트맵묶음펴기(맵글, 받기 = fetch, 최대 = 4) {
  const locs = [...String(맵글 ?? '').matchAll(/<loc>([^<]+)<\/loc>/g)].map((x) => x[1].trim());
  const 묶음인가 = /<sitemapindex/i.test(String(맵글 ?? ''));
  if (!묶음인가) return { 주소들: locs, 폈나: false };

  const 모은것 = [];
  for (const 하나 of locs.slice(0, 최대)) {
    try {
      const 글 = await (await 받기(하나)).text();
      for (const m of String(글).matchAll(/<loc>([^<]+)<\/loc>/g)) 모은것.push(m[1].trim());
    } catch { /* 한 장 못 받아도 나머지는 본다 */ }
  }
  return { 주소들: 모은것, 폈나: true, 묶음수: locs.length, 편것: Math.min(locs.length, 최대) };
}

/**
 * 🔴 [2026-10-06 · 5번] 사이트맵이 주는 주소가 «절대»일 수도 «상대»일 수도 있다.
 *   kcw 사이트맵은 www 절대주소를 쓴다. 바닥을 또 붙이면 주소가 망가진다.
 * ⛔ 내가 짜 맞추지 않는다 — 절대면 그대로 쓴다.
 */
export function 온주소(바닥, 길) {
  const s = String(길 ?? '');
  return /^https?:\/\//i.test(s) ? s : (바닥 + s);
}

/** 화면에 짧게 보이려고 호스트를 뗀다. ⛔ 묻는 주소는 안 건드린다 */
export function 보일주소(길) {
  return String(길 ?? '').replace(/^https?:\/\/[^/]+/i, '') || '/';
}

/**
 * 🔴 [2026-10-06 09:4x · 5번] **이 자가 klifemap 에서만 돌았다.**
 *   묶음 표가 klifemap 주소 꼴(star·ttigh·ilju·ilzin)로만 돼 있어서,
 *   다른 사이트에 대면 홈 한 장만 묻고 끝났다. 그러면 「다른 사이트는 괜찮다」로 읽힌다.
 * ⛔ 못 잰 것을 「괜찮다」로 읽지 않는다 ⇒ 묶음이 하나도 안 맞으면 **사이트맵에서 고루 뽑는다.**
 * ⚠ 고루 뽑는 것은 묶음별로 보는 것만 못하다. 그래도 「안 쟀다」보다는 낫다.
 */
export function 고루뽑기(주소들, 몇 = 12) {
  /* ⛔ 겹친 주소를 먼저 뺀다 — 안 빼면 짧은 목록에서 같은 것을 두 번 묻는다(자가시험이 잡았다) */
  const 것 = [...new Set((주소들 || []).filter(Boolean))];
  if (것.length <= 몇) return 것.slice();
  const 걸음 = 것.length / 몇;
  const 뽑 = [];
  for (let i = 0; i < 몇; i += 1) {
    const x = 것[Math.min(것.length - 1, Math.floor(i * 걸음))];
    if (!뽑.includes(x)) 뽑.push(x);
  }
  return 뽑;
}

/**
 * 구글이 돌려주는 coverageState 를 우리 말로.
 * ⛔ 모르는 값을 「색인 안 됨」으로 뭉뚱그리지 않는다 — 그대로 적어 둔다.
 */
export function 상태말(코드) {
  const s = String(코드 ?? '');
  if (!s) return { 색인됐나: null, 말: '⚠ 못 쟀다 — 답이 비었다' };
  if (/Submitted and indexed|Indexed, not submitted|색인이 생성되었습니다/i.test(s)) return { 색인됐나: true, 말: '✅ 색인에 있다' };
  /* 🔴🔴 [2026-10-06] **오늘 klifemap 에서 스물한 장이 다 이 답이었다.**
     「겹침이 많아 구글이 거른다」가 아니라 **구글이 지면의 «존재»를 모른다.** */
  if (/URL is unknown to Google|아직 알려지지 않은/i.test(s)) {
    return { 색인됐나: false, 말: '🔴🔴 구글이 이 주소를 «모른다» — 크롤한 적도 없다' };
  }
  if (/Crawled - currently not indexed|크롤링됨 - 현재 색인이 생성되지 않음/i.test(s)) return { 색인됐나: false, 말: '🔴 읽기는 했는데 색인에 «안» 넣었다' };
  if (/Discovered - currently not indexed|발견됨 - 현재 색인이 생성되지 않음/i.test(s)) return { 색인됐나: false, 말: '🔴 찾기만 하고 읽지도 않았다' };
  if (/Duplicate/i.test(s)) return { 색인됐나: false, 말: '🔴 겹친다고 보고 버렸다 (canonical 이 남을 가리킨다)' };
  if (/not found|404/i.test(s)) return { 색인됐나: false, 말: '🔴 404 로 본다' };
  if (/redirect/i.test(s)) return { 색인됐나: false, 말: '⬜ 넘김(redirect)으로 본다' };
  if (/excluded|blocked|noindex/i.test(s)) return { 색인됐나: false, 말: '🔴 우리가 막아 놓았다' };
  return { 색인됐나: null, 말: `⚠ 모르는 답 — 그대로 적는다: ${s}` };
}


/**
 * 🔴 [2026-10-06 · 5번] **구글이 주소를 모른다면, 먼저 물을 것은 「사이트맵을 받았나」다.**
 * ⛔ 「사이트맵 파일이 있다」와 「구글이 그것을 읽었다」는 다른 말이다.
 *   파일은 라이브에 멀쩡히 있는데 구글이 한 번도 안 가져갔을 수 있다.
 */
export async function 사이트맵묻기(토큰, 속성, 보내기 = fetch) {
  try {
    const r = await 보내기(
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(속성)}/sitemaps`,
      { headers: { Authorization: `Bearer ${토큰}` } });
    const j = await r.json();
    if (!r.ok) return { 못잼: true, 까닭: (j.error && j.error.message) || `HTTP ${r.status}` };
    return { 것들: j.sitemap || [] };
  } catch (e) { return { 못잼: true, 까닭: e.message }; }
}

/** 한 주소를 묻는다. ⛔ 못 물으면 null — 「색인이 없다」가 아니다 */
export async function 하나묻기(토큰, 속성, 주소, 보내기 = fetch) {
  try {
    const r = await 보내기('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
      method: 'POST',
      headers: { Authorization: `Bearer ${토큰}`, 'Content-Type': 'application/json' },
      /* 🔴 [2026-10-06 09:0x · 5번] **한국어로 물었더니 결을 하나도 못 가렸다.**
         구글이 「Google에는 아직 알려지지 않은 URL입니다」처럼 «옮긴 말»로 답했고,
         내 표는 영어 결만 알아 스물두 장이 통째로 「모르는 답」으로 떨어졌다.
         ⇒ **영어로 묻는다.** 결이 바뀌지 않는다. 한국어 결도 표에 함께 둔다(혹시 모르니). */
      body: JSON.stringify({ inspectionUrl: 주소, siteUrl: 속성, languageCode: 'en' }),
    });
    const j = await r.json();
    if (!r.ok) return { 못잼: true, 까닭: (j.error && j.error.message) || `HTTP ${r.status}` };
    const i = j.inspectionResult && j.inspectionResult.indexStatusResult;
    if (!i) return { 못잼: true, 까닭: '답에 indexStatusResult 가 없다' };
    return {
      coverageState: i.coverageState,
      verdict: i.verdict,
      마지막크롤: i.lastCrawlTime || null,
      구글이고른canonical: i.googleCanonical || null,
      우리가건canonical: i.userCanonical || null,
    };
  } catch (e) { return { 못잼: true, 까닭: e.message }; }
}

/**
 * 구글이 고른 canonical 이 우리가 건 것과 다른가.
 * ⛔ 다르면 그 지면은 «남의 지면의 그림자»로 묶인 것이다 — 겹침 문제의 진짜 모습이다.
 */
export function canonical어긋났나(답) {
  if (!답 || 답.못잼) return null;
  if (!답.구글이고른canonical || !답.우리가건canonical) return null;
  return 답.구글이고른canonical !== 답.우리가건canonical;
}

async function 자가시험() {
  let 통 = 0; let 탈 = 0;
  const 검 = (이름, 참) => { if (참) { 통++; console.log('✅', 이름); } else { 탈++; console.log('🔴', 이름); } };

  검('색인에 있는 것을 가린다', 상태말('Submitted and indexed').색인됐나 === true);
  검('⛔ 「읽었는데 색인 안 함」을 가린다',
    상태말('Crawled - currently not indexed').색인됐나 === false);
  검('⛔ 「찾기만 했다」를 가린다',
    상태말('Discovered - currently not indexed').색인됐나 === false);
  검('⛔ 「겹친다고 버렸다」를 가린다 — 겹침 문제의 진짜 모습이다',
    상태말('Duplicate without user-selected canonical').색인됐나 === false);
  검('⛔ 모르는 답은 «모른다»로 두고 그대로 적는다', (() => {
    const r = 상태말('Something New From Google');
    return r.색인됐나 === null && r.말.includes('Something New From Google');
  })());
  검('⛔ 빈 답도 «못 쟀다» — 「색인 없음」이 아니다',
    상태말('').색인됐나 === null && 상태말(null).색인됐나 === null);

  검('canonical 이 어긋난 것을 가린다',
    canonical어긋났나({ 구글이고른canonical: 'A', 우리가건canonical: 'B' }) === true);
  검('canonical 이 같으면 false',
    canonical어긋났나({ 구글이고른canonical: 'A', 우리가건canonical: 'A' }) === false);
  검('⛔ 못 쟀으면 null — 「어긋나지 않았다」가 아니다',
    canonical어긋났나({ 못잼: true }) === null && canonical어긋났나(null) === null);
  검('⛔ canonical 을 못 받았으면 null',
    canonical어긋났나({ 구글이고른canonical: 'A' }) === null);

  /* 🔴🔴 [2026-10-06] 오늘 klifemap 에서 스물한 장이 다 이 답이었다 */
  검('🔴 「구글이 모르는 주소」를 가린다 — 겹침이 아니라 «존재를 모른다»',
    상태말('URL is unknown to Google').색인됐나 === false);
  검('🔴 한국어로 온 답도 가린다 — 처음에 한국어로 물어 스물두 장을 다 놓쳤다',
    상태말('Google에는 아직 알려지지 않은 URL입니다.').색인됐나 === false
    && 상태말('제출되고 색인이 생성되었습니다.').색인됐나 === true
    && 상태말('발견됨 - 현재 색인이 생성되지 않음').색인됐나 === false);

  /* 🔴 [2026-10-06] 묶음이 안 맞는 사이트에서 홈 한 장만 묻고 끝나던 것을 못 박는다 */
  검('고루 뽑으면 앞뒤로 퍼진다 — 앞쪽만 뽑지 않는다', (() => {
    const 것 = Array.from({ length: 100 }, (_, i) => '/a' + i);
    const 뽑 = 고루뽑기(것, 10);
    return 뽑.length === 10 && 뽑[0] === '/a0' && 뽑[9] !== '/a9';
  })());
  검('⛔ 달라는 수보다 적으면 있는 대로 다 준다', 고루뽑기(['/a', '/b'], 10).length === 2);
  검('⛔ 빈 것·null 에도 안 터진다', 고루뽑기([], 5).length === 0 && 고루뽑기(null, 5).length === 0);
  검('⛔ 같은 주소를 두 번 담지 않는다', (() => {
    const 뽑 = 고루뽑기(['/a', '/a', '/a'], 3);
    return new Set(뽑).size === 뽑.length;
  })());

  /* 🔴 [2026-10-06] 사이트맵이 www 를 쓴다 — 바닥을 또 붙여 아홉 장을 통째로 못 물었다 */
  검('⛔ 절대 주소면 바닥을 또 붙이지 않는다',
    온주소('https://kculturewire.com', 'https://www.kculturewire.com/tag/tourism')
      === 'https://www.kculturewire.com/tag/tourism');
  검('상대 주소면 바닥을 붙인다',
    온주소('https://klifemap.ai', '/content/x') === 'https://klifemap.ai/content/x');
  검('화면에는 호스트를 떼고 보인다',
    보일주소('https://www.kculturewire.com/tag/tourism') === '/tag/tourism');
  검('⛔ 호스트만 있으면 / 로 보인다', 보일주소('https://a.com') === '/');
  검('⛔ 빈 것·null 에도 안 터진다', 보일주소('') === '/' && 보일주소(null) === '/');

  /* 🔴 [2026-10-06] 사이트맵 묶음을 지면으로 알고 물어 「서울마켓츠가 통째로 색인에 없다」로 읽을 뻔했다 */
  {
    const 보통맵 = '<urlset><url><loc>https://a.com/x</loc></url></urlset>';
    const r1 = await 사이트맵묶음펴기(보통맵);
    검('⛔ 묶음이 아니면 펴지 않고 그대로 돌려준다',
      r1.폈나 === false && r1.주소들.length === 1 && r1.주소들[0] === 'https://a.com/x');

    const 묶음맵 = '<sitemapindex><sitemap><loc>https://a.com/s1.xml</loc></sitemap>'
      + '<sitemap><loc>https://a.com/s2.xml</loc></sitemap></sitemapindex>';
    const 가짜받기 = async (u) => ({
      text: async () => (u.endsWith('s1.xml')
        ? '<urlset><url><loc>https://a.com/p1</loc></url></urlset>'
        : '<urlset><url><loc>https://a.com/p2</loc></url></urlset>'),
    });
    const r2 = await 사이트맵묶음펴기(묶음맵, 가짜받기);
    검('🔴 묶음이면 한 겹 펴서 «진짜 지면» 주소를 가져온다',
      r2.폈나 === true && r2.주소들.length === 2 && r2.주소들.includes('https://a.com/p2'));
    검('몇 개를 폈는지 적는다', r2.묶음수 === 2 && r2.편것 === 2);

    const 터지는받기 = async () => { throw new Error('끊김'); };
    const r3 = await 사이트맵묶음펴기(묶음맵, 터지는받기);
    검('⛔ 자식 사이트맵을 못 받아도 안 터진다 — 빈 목록으로 둔다',
      r3.폈나 === true && r3.주소들.length === 0);

    검('⛔ 빈 글·null 에도 안 터진다',
      (await 사이트맵묶음펴기('')).주소들.length === 0
      && (await 사이트맵묶음펴기(null)).주소들.length === 0);
  }
  검('⛔ 한도가 있으니 묶음당 적게 묻는다', 묶음당몇장 <= 5);
  검('사이트 넷이 다 있다', Object.keys(사이트들).length === 4);
  검('⛔ 속성이 다 sc-domain 꼴', Object.values(사이트들).every((x) => x.속성.startsWith('sc-domain:')));

  console.log(탈 ? `\n🔴 자가시험 ${탈}건 탈` : `\n✅ 자가시험 ${통} 통과`);
  process.exit(탈 ? 1 : 0);
}

async function 주다() {
  if (process.argv.includes('--자가시험')) return await 자가시험();

  const 인자 = (n, 기본) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : 기본; };
  const 이름 = 인자('--사이트', 'klifemap');
  const 곳 = 사이트들[이름];
  if (!곳) { console.log('🔴 모르는 사이트 —', 이름); process.exit(2); }

  const { 토큰, 계정 } = await 토큰받기();
  console.log(`■ 구글에게 「색인에 있나」를 직접 묻는다 — ${곳.바닥}`);
  console.log(`   계정 ${계정}`);
  console.log('⚠ 이 자는 «구글이 뭐라고 하는가»만 적는다. 왜 그런지는 따로 봐야 한다.\n');

  /* ⭐ 주소를 모른다면 사이트맵부터 의심한다 — 그 답을 «먼저» 찍는다 */
  const 맵답 = await 사이트맵묻기(토큰, 곳.속성);
  if (맵답.못잼) console.log(`⚠ 사이트맵 상태를 못 물었다 — ${맵답.까닭}\n`);
  else if (!맵답.것들.length) {
    console.log('🔴🔴 구글에 «제출된 사이트맵이 하나도 없다** — 그래서 주소를 모를 수 있다\n');
  } else {
    console.log('■ 구글이 받은 사이트맵');
    for (const s of 맵답.것들) {
      const 줄수 = (s.contents || []).reduce((n, c) => n + Number(c.submitted || 0), 0);
      console.log(`   ${String(s.path).replace(곳.바닥, '').padEnd(34)} 마지막으로 가져간 때 `
        + `${s.lastDownloaded ? String(s.lastDownloaded).slice(0, 10) : '«한 번도 없다»'}`
        + ` · 주소 ${줄수}개${s.errors ? ` · 흠 ${s.errors}` : ''}${s.isPending ? ' · 아직 처리 중' : ''}`);
    }
    console.log('');
  }

  let 주소들 = [];
  const 하나 = 인자('--주소', null);
  if (하나) 주소들 = [{ 묶음: '손으로 준 것', 길: 하나 }];
  else {
    /* 🔴 [2026-10-06 09:5x · 5번] **kcw 에서 아홉 장을 통째로 못 물었다.**
       그 사이트맵은 `https://www.kculturewire.com/...` 처럼 «www» 절대주소를 쓴다.
       그런데 내가 비-www 바닥을 «또» 앞에 붙여 주소가 망가졌다.
       구글은 「You do not own this site」라고 답했고, 나는 하마터면
       「kcw 는 권한이 없다」로 읽을 뻔했다 — 실은 내가 만든 주소가 틀린 것이었다.
       ⭐ 자가 그것을 「못 물었다」로 냈기에 「색인 안 됨」으로 번지지 않았다. 셋째 칸이 또 일했다.
       ⇒ **사이트맵이 주는 절대 주소를 그대로 쓴다.** 내가 짜 맞추지 않는다. */
    const 맵글 = await (await fetch(곳.바닥 + '/sitemap.xml')).text();
    const 편것 = await 사이트맵묶음펴기(맵글);
    if (편것.폈나) {
      console.log(`   ⚠ /sitemap.xml 은 «묶음»이다 — 사이트맵 ${편것.묶음수}개 가운데 ${편것.편것}개를 펴서 본다\n`);
    }
    const 맵 = 맵글;
    const 모두 = 편것.폈나 ? 편것.주소들 : [...맵.matchAll(/<loc>([^<]+)<\/loc>/g)].map((x) => x[1]);
    console.log(`   사이트맵에 주소 ${모두.length}개\n`);
    for (const 묶 of 묶음들) {
      const 것 = 모두.filter((s) => 묶.꼴.test(보일주소(s)));
      if (!것.length) continue;
      const 걸음 = Math.max(1, Math.floor(것.length / 묶음당몇장));
      for (let i = 0, n = 0; i < 것.length && n < 묶음당몇장; i += 걸음, n += 1) {
        주소들.push({ 묶음: `${묶.이름} (${것.length}장)`, 길: 것[i] });
      }
    }
    /* ⛔ 묶음이 하나도 안 맞으면 «홈 한 장만 묻고 끝」이 된다 — 그것을 「괜찮다」로 읽지 않는다 */
    if (!주소들.length) {
      console.log('   ⚠ 아는 묶음이 하나도 없다 — 사이트맵에서 고루 뽑아 묻는다\n');
      for (const 길 of 고루뽑기(모두.filter((s) => s && s !== '/'), 12)) {
        주소들.push({ 묶음: '사이트맵에서 고루', 길 });
      }
    }
    /* ⛔ 홈도 «사이트맵이 쓰는 호스트»로 묻는다 — 비-www 로 물었더니 구글이 「모른다」고 했다.
       그 사이트가 www 로 서는데 내가 엉뚱한 호스트를 물은 것이다. */
    주소들.unshift({ 묶음: '홈', 길: 모두.find((s) => /^https?:\/\/[^/]+\/?$/.test(s)) || (곳.바닥 + '/') });
  }

  let 색인된것 = 0; let 안된것 = 0; let 못잰것 = 0;
  let 앞묶음 = '';
  for (const { 묶음, 길 } of 주소들) {
    if (묶음 !== 앞묶음) { console.log(`\n── ${묶음}`); 앞묶음 = 묶음; }
    const 답 = await 하나묻기(토큰, 곳.속성, 온주소(곳.바닥, 길));
    if (답.못잼) { 못잰것 += 1; console.log(`   ⚠ ${길.padEnd(42)} 못 물었다 — ${답.까닭}`); continue; }
    const 뜻 = 상태말(답.coverageState);
    if (뜻.색인됐나 === true) 색인된것 += 1;
    else if (뜻.색인됐나 === false) 안된것 += 1;
    else 못잰것 += 1;
    const 어긋 = canonical어긋났나(답);
    console.log(`   ${보일주소(길).padEnd(42)} ${뜻.말}`
      + (답.마지막크롤 ? ` · 마지막 크롤 ${String(답.마지막크롤).slice(0, 10)}` : ' · 크롤한 적 없다')
      + (어긋 ? `\n      ⚠ 구글은 canonical 을 «다른 주소»로 골랐다 → ${답.구글이고른canonical}` : ''));
  }

  console.log(`\n■ 물어본 ${주소들.length}장 — ✅ 색인 ${색인된것} · 🔴 아님 ${안된것} · ⚠ 못 쟀다 ${못잰것}`);
  console.log('⛔ 「못 쟀다」를 「색인 안 됨」으로 읽지 않는다.');
  console.log('⚠ 이것은 표본이다. 묶음 전체를 말하려면 더 물어야 한다.');
  process.exit(0);
}

/* ⛔ 「걸림돌 없는 꼭대기 부름」을 만들지 않는다 */
const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가실행됐다) await 주다();
