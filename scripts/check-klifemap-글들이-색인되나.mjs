#!/usr/bin/env node
/**
 * check-klifemap-글들이-색인되나.mjs — **진짜 검색 자산은 도구 지면이 아니라 «글»이다.**
 *
 * 🔴🔴 [2026-10-01 · 5번] 사장님 지시로 케이라이프맵 색인을 파다가 잡은 것 —
 *   우리 색인 검사자(`check-색인-왜안되나.mjs`)는 **도구 지면 열한 장만** 재고 있었다.
 *   그런데 사이트맵에는 주소가 **2,892개**이고 그중 **2,847개가 `/content/` 글**이다.
 *   ⇒ 검색 자산의 **98%를 한 번도 안 재고** 「색인이 1장뿐」이라고 보고해 온 것이다.
 *   ⛔ 「자를 먼저 의심한다」가 바로 이 자리다. 수가 이상하면 자부터 본다.
 *
 * 이 자가 재는 것
 *   ① 사이트맵에서 글 주소를 뽑는다 (2,847개)
 *   ② 그중 무작위로 몇 개를 구글이 받는 그대로 받아 «읽을 글자»를 센다
 *   ③ 글자가 선(1,800자)을 넘는 글이 몇 %인가를 낸다
 *
 * ⛔ 색인 여부(Search Console)는 하루 호출 한도가 있어 여기서 안 묻는다.
 *   그것은 `check-색인-왜안되나.mjs` 가 «표본»으로 묻도록 따로 잇는다.
 *
 * 쓰는 법
 *   node scripts/check-klifemap-글들이-색인되나.mjs            (표본 20개)
 *   node scripts/check-klifemap-글들이-색인되나.mjs --표본 60
 *   node scripts/check-klifemap-글들이-색인되나.mjs --자가시험
 */

export const 사이트맵 = 'https://klifemap.ai/sitemap.xml';
export const 글자선 = 1800;

/**
 * 🔴🔴 [2026-10-05 04:45 · 5번] **하나의 선을 네 말에 똑같이 대고 있었다.**
 *
 *   이 자가 중국어 글 608편을 **전부 빨강**으로 찍고 있었다(표본 12개 중 0개 통과).
 *   「자를 먼저 의심한다」로 같은 글의 네 말 판을 나란히 놓고 재 보니 —
 *
 *     /content/star-q101161499-astro
 *       ko  2,436자 · 문단 26 · 소제목 12 · 표줄 3
 *       en  4,557자 · 문단 26 · 소제목 12 · 표줄 3
 *       zh  1,663자 · 문단 26 · 소제목 12 · 표줄 3   ← 빨강이었다
 *       ja  2,185자 · 문단 26 · 소제목 12 · 표줄 3
 *
 *   **문단 수·소제목 수·표줄 수가 네 말에 완전히 같다.** 내용이 빠진 것이 아니라
 *   중국어가 한 글자에 더 많은 뜻을 담아 «글자 수»만 적은 것이다.
 *   ⇒ 빠진 글이 아니라 **잘못 잰 자**였다. 608편을 고치려 들었으면 헛일이었다.
 *
 * ⛔ 그래서 말마다 선을 따로 둔다. 비율은 네 말이 다 있는 글 576편의 실측
 *   가운뎃값에서 뽑았다 — ko 2,526 · en 4,510 · zh 1,692 · ja 2,218.
 *   ko 선 1,800 을 그 비율로 옮긴 값이다.
 * ⚠ 이것은 «얇은 글을 거르는» 우리 선이지 구글이 쓰는 값이 아니다. 구글 선은 모른다.
 */
export const 말별글자선 = { ko: 1800, en: 3200, zh: 1200, ja: 1550 };

/** 주소 꼬리에서 말을 읽는다. ⛔ 꼬리가 없으면 한국어다 */
export function 말읽기(주소) {
  const m = String(주소 ?? '').match(/-(ko|en|zh|ja)$/);
  return m ? m[1] : 'ko';
}

/** 그 주소에 댈 선. ⛔ 모르는 말이면 한국어 선을 쓴다 — 0 으로 두지 않는다 */
export function 선고르기(주소) {
  return 말별글자선[말읽기(주소)] ?? 글자선;
}
const 구글인척 = { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' };

/** 사이트맵 XML 에서 <loc> 주소를 뽑는다 */
export function 주소뽑기(xml) {
  return [...String(xml ?? '').matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
}

/** 글 주소만 — 도구 지면(.html)과 가른다 */
export function 글만고르기(주소들) {
  return (주소들 ?? []).filter((u) => /\/content\/[^/]+$/.test(u));
}

/**
 * **구글이 읽을 수 있는 글자만 센다.**
 * ⛔ `<style>` 안의 CSS 를 글자로 세면 안 된다 — 한 글에서 2천 자가 그냥 나온다.
 *   실제로 처음 재 볼 때 CSS 가 통째로 섞여 들어왔다.
 */
export function 읽을글자(html) {
  const 본 = String(html ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
  const 몸 = (본.match(/<body[\s\S]*<\/body>/i) || [본])[0];
  return 몸.replace(/<[^>]+>/g, '\n')
    .split('\n').map((s) => s.replace(/&nbsp;/g, ' ').replace(/&[a-z]+;/g, '').trim())
    .filter((s) => s.length >= 2)
    .join(' ')
    .replace(/\s{2,}/g, ' ')
    .trim().length;
}

/** 고르게 흩어서 표본을 뽑는다 — 앞쪽만 보면 한 묶음만 보게 된다 */
export function 표본고르기(주소들, 몇개) {
  const n = 주소들.length;
  if (n <= 몇개) return [...주소들];
  const 걸음 = n / 몇개;
  const 낸다 = [];
  for (let i = 0; i < 몇개; i += 1) 낸다.push(주소들[Math.floor(i * 걸음)]);
  return 낸다;
}

/* ── 자가시험 ──────────────────────────────────────────────── */
if (process.argv.includes('--자가시험') || process.argv.includes('--selftest')) {
  let 통과 = 0; let 실패 = 0;
  const 검 = (이름, 참) => { if (참) { 통과 += 1; console.log('✅ ' + 이름); } else { 실패 += 1; console.log('🔴 ' + 이름); } };

  검('<loc> 에서 주소를 뽑는다',
    주소뽑기('<url><loc>https://a/b</loc></url><url><loc>https://a/c</loc></url>').length === 2);
  검('앞뒤 공백이 있어도 뽑는다', 주소뽑기('<loc>\n  https://a/b\n</loc>')[0] === 'https://a/b');
  검('⛔ 빈 것에도 안 터진다', 주소뽑기('').length === 0 && 주소뽑기(null).length === 0);

  검('글 주소만 고른다', 글만고르기([
    'https://klifemap.ai/content/abc', 'https://klifemap.ai/saju.html', 'https://klifemap.ai/',
  ]).length === 1);
  검('⛔ 글 목록 지면(/content)은 글이 아니다', 글만고르기(['https://klifemap.ai/content']).length === 0);

  검('🔴 CSS 를 글자로 세지 않는다', (() => {
    const a = 읽을글자('<html><head><style>body{color:red;font-family:sans-serif;padding:20px}</style></head><body>가나다</body></html>');
    return a <= 4;
  })());
  검('🔴 자바스크립트도 안 센다',
    읽을글자('<body>가나다<script>var x = "아주 긴 글자".repeat(100);</script></body>') <= 4);
  검('본문 글자는 센다', 읽을글자('<body><h1>제목</h1><p>본문입니다</p></body>') >= 7);
  검('⛔ 빈 것에도 안 터진다', 읽을글자('') === 0 && 읽을글자(null) === 0);

  검('표본은 고르게 흩어진다', (() => {
    const 백개 = Array.from({ length: 100 }, (_, i) => `u${i}`);
    const s = 표본고르기(백개, 10);
    return s.length === 10 && s[0] === 'u0' && s[9] === 'u90';
  })());
  검('표본이 전체보다 많으면 전체를 낸다', 표본고르기(['a', 'b'], 10).length === 2);

  /* 🔴 [2026-10-05] 말마다 선이 달라야 한다 — 하나로 대서 중국어 608편이 다 빨강이었다 */
  검('꼬리에서 말을 읽는다',
    말읽기('https://klifemap.ai/content/star-q1-astro-zh') === 'zh'
    && 말읽기('https://klifemap.ai/content/star-q1-astro-ja') === 'ja');
  검('⛔ 꼬리가 없으면 한국어다', 말읽기('https://klifemap.ai/content/star-q1-astro') === 'ko');
  검('⛔ 빈 것에도 안 터진다', 말읽기(null) === 'ko' && 말읽기('') === 'ko');
  검('🔴 중국어 선이 한국어보다 낮다', 말별글자선.zh < 말별글자선.ko);
  검('🔴 영어 선이 한국어보다 높다', 말별글자선.en > 말별글자선.ko);
  검('네 말에 다 선이 있다',
    ['ko', 'en', 'zh', 'ja'].every((l) => Number.isFinite(말별글자선[l]) && 말별글자선[l] > 0));
  검('🔴 실제로 잰 중국어 1,663자가 제 선을 넘는다',
    1663 >= 선고르기('https://klifemap.ai/content/star-q101161499-astro-zh'));
  검('⛔ 같은 글자 수라도 한국어였으면 못 넘는다',
    1663 < 선고르기('https://klifemap.ai/content/star-q101161499-astro'));
  검('⛔ 모르는 꼬리면 한국어 선을 쓴다',
    선고르기('https://klifemap.ai/content/star-q1-astro-de') === 글자선);

  console.log(`\n${실패 === 0 ? '✅' : '🔴'} 자가시험 ${통과 + 실패}개 중 통과 ${통과}개`);
  process.exit(실패 === 0 ? 0 : 1);
}

/* ── 실제로 잰다 ───────────────────────────────────────────── */
const 몇개자리 = process.argv.indexOf('--표본');
const 표본수 = 몇개자리 > 0 ? Number(process.argv[몇개자리 + 1]) || 20 : 20;

console.log('■ 케이라이프맵 — «글»이 구글에 읽힐 만큼 차 있나\n');
const xml = await (await fetch(사이트맵, { headers: 구글인척 })).text();
const 모든주소 = 주소뽑기(xml);
const 글주소 = 글만고르기(모든주소);
console.log(`   사이트맵 주소 ${모든주소.length}개 · 그중 «글» ${글주소.length}개`
  + ` (도구 지면은 ${모든주소.length - 글주소.length}개)\n`);

const 표본 = 표본고르기(글주소, 표본수);
const 잰것 = [];
for (const u of 표본) {
  try {
    const r = await fetch(u, { headers: 구글인척 });
    if (!r.ok) { 잰것.push({ u, 글자: null, 왜: `HTTP ${r.status}` }); continue; }
    잰것.push({ u, 글자: 읽을글자(await r.text()) });
  } catch (e) { 잰것.push({ u, 글자: null, 왜: e.message }); }
}

const 잰것만 = 잰것.filter((x) => x.글자 !== null);
/* 🔴 선을 말마다 다르게 댄다 — 하나로 대면 중국어가 통째로 빨강이 된다 */
const 넘은것 = 잰것만.filter((x) => x.글자 >= 선고르기(x.u));
const 못잰것 = 잰것.filter((x) => x.글자 === null);

for (const x of 잰것.slice(0, 12)) {
  const 이름 = x.u.replace(/^https:\/\/klifemap\.ai/, '');
  if (x.글자 === null) console.log(`   ⬜ ${이름.padEnd(44)} 못 쟀다 — ${x.왜}`);
  else {
    const 선 = 선고르기(x.u);
    console.log(`   ${x.글자 >= 선 ? '✅' : '🔴'} ${이름.padEnd(44)} ${String(x.글자).padStart(6)}자`
      + `  (${말읽기(x.u)} 선 ${선})`);
  }
}
if (잰것.length > 12) console.log(`   … 그 밖 ${잰것.length - 12}개`);

const 가운데 = 잰것만.length
  ? [...잰것만].sort((a, b) => a.글자 - b.글자)[Math.floor(잰것만.length / 2)].글자 : 0;
console.log(`\n■ 표본 ${잰것만.length}개 — 제 말의 선을 넘은 글 ${넘은것.length}개`
  + ` (${잰것만.length ? Math.round((넘은것.length / 잰것만.length) * 100) : 0}%)`);
console.log(`   선 — ${Object.entries(말별글자선).map(([k, v]) => `${k} ${v}`).join(' · ')}자`);
console.log(`   가운뎃값 ${가운데}자`);
/* 말마다 갈라서 보여 준다 — 한 말만 무너져 있으면 전체 %로는 안 보인다 */
for (const 말 of Object.keys(말별글자선)) {
  const 이말 = 잰것만.filter((x) => 말읽기(x.u) === 말);
  if (!이말.length) continue;
  const 통 = 이말.filter((x) => x.글자 >= 말별글자선[말]).length;
  console.log(`   ${말}  ${통}/${이말.length} 통과`);
}
if (못잰것.length) console.log(`   ⬜ 못 잰 것 ${못잰것.length}개 — 0 으로 메우지 않는다`);
console.log(`\n⇒ 글 전체 ${글주소.length}개 가운데 선을 넘는 것은 어림잡아`
  + ` ${잰것만.length ? Math.round((넘은것.length / 잰것만.length) * 글주소.length) : 0}개로 보인다.`);
console.log('   ⚠ 이것은 «읽을 글자»를 잰 것이지 «색인됐나»가 아니다. 색인은 따로 묻는다.');
