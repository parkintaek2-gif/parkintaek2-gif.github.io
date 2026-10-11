#!/usr/bin/env node
/**
 * check-검색엔진마다-등록돼있나.mjs
 *   — **네 사이트가 어느 검색엔진에 등록돼 있나**를 로그인 없이 잰다.
 *
 * ── 🔴 왜 (2026-10-12 08:3x · 5번) ───────────────────────────────────
 *   사장님 2026-10-11 — 「**언어에 따라 접근할 검색엔진 달리하고. 네이버, 빙. 줌 등도 봐**」
 *
 *   오늘 `네이버에-우리가-있나.mjs` 를 돌리니 **여섯 말 모두 안 걸린다**고 나왔다.
 *   ⚠ 견줌으로 둔 「고령자 통계 → 100yearmap」까지 안 걸려서 자를 의심했다 —
 *     네이버에 직접 두드려 보니 200 · 90만 자 · 남의 결과(blog·cafe·kin·namu·wikipedia)가
 *     다 들어 있었다. **막힌 것이 아니라 정말로 우리가 없다.**
 *
 *   ⭐ 그리고 100yearmap 은 네이버에서 28일 168명을 받는다.
 *     우리가 겨눈 말로는 안 걸리는데 사람은 온다 ⇒ **겨누지 않은 말로 오고 있다.**
 *
 *   ⇒ 그러니 「말을 더 겨눈다」보다 **「검색엔진이 우리를 알고 있나」**가 먼저다.
 *
 * ── ⭐ 로그인 없이 잴 수 있는 것 ─────────────────────────────────────
 *   ⛔ 나는 로그인하지 않는다. 비밀번호를 다루지 않는다.
 *   그래도 이것들은 지면에서 바로 보인다 —
 *   ```
 *   naver-site-verification     네이버 서치어드바이저에 등록했나
 *   msvalidate.01               빙 웹마스터에 등록했나
 *   google-site-verification    구글 서치콘솔에 등록했나 (DNS 로 했으면 안 보인다)
 *   robots.txt 의 Sitemap:      네이버는 이 줄을 읽어 수집한다
 *   robots.txt 가 Yeti 를 막나  네이버 봇 이름이 Yeti 다
 *   ```
 *   ⚠ **메타태그가 없다고 「등록 안 됐다」가 아니다** — DNS·파일로 한 수도 있다.
 *     그래서 이 자는 「등록 안 됐다」가 아니라 **「지면에서는 못 봤다」**고 적는다.
 *     ⛔ 못 본 것을 없는 것으로 읽지 않는다. 이번 세션에서 여섯 번 데었다.
 *
 * ── 🔴🔴 빙은 «검색으로» 못 잰다 (2026-10-12 08:5x 에 세 번 재고 알았다) ──
 *   「빙에 걸리나」를 로그인 없이 재려고 세 가지로 쟀는데 **셋 다 틀렸다.**
 *   ```
 *   ① t.includes(터)          → ✅   거짓이었다. 검색창에 찍힌 내 검색어를 읽었다
 *   ② href="https://터"       → 🔴   거짓이었다. 견줌(wikipedia·github)도 0개였다
 *   ③ <cite> 안의 주소        → 🔴   거짓이었다. 견줌이 잡았다
 *   ```
 *   ③ 에서 드러난 것 — **빙이 봇에게 엉뚱한 결과를 준다.**
 *   `site:wikipedia.org` 를 쳤는데 vietnam.travel·tasteatlas 가 나오고,
 *   `site:klifemap.ai` 에 walmart.com 이 나왔다. 캐시된 남의 결과다.
 *
 *   ⭐⭐ 견줌을 안 뒀으면 **「빙에 네 사이트가 하나도 없다」는 큰 거짓**을 적었다.
 *     「자를 지을 때 «이 자가 아무것도 안 보고 있지는 않나»를 같이 심는다」 —
 *     그 자리가 오늘 두 번째로 제 흠을 잡았다.
 *   ⇒ **빙은 못 잰다고 적는다.** 「재 보고 안 된다고 적는 것도 결과다」(강령 ③).
 *     그래서 빙은 **웹마스터 등록**이 더 급하다 — 그것 말고는 볼 창이 없다.
 *
 *   ⚠ 네이버는 다르다. 네이버는 봇에게 «맞는» 결과를 준다 —
 *     「만세력」에 namu.wiki·wikipedia, 「갑자일주」에 cafe.naver·kin.naver 가 나왔다.
 *     그러니 `네이버에-우리가-있나.mjs` 의 🔴 는 **믿어도 된다.**
 *
 * ── ⚠ 말에 따라 어디를 보나 ──────────────────────────────────────────
 *   한국어 지면   네이버 · 다음 · 구글      (네이버가 가장 크다)
 *   영문 지면     구글 · 빙                 (네이버는 영문을 거의 안 보낸다)
 *   ⇒ 영문 사이트에 네이버가 없는 것은 흠이 아니다. **한국어 사이트에 없는 것이 흠이다.**
 *
 * 쓰는 법
 *   node scripts/check-검색엔진마다-등록돼있나.mjs
 *   node scripts/check-검색엔진마다-등록돼있나.mjs --자가시험
 */

/** 사이트마다 — 어떤 말을 쓰나, 그래서 어느 검색엔진이 꼭 있어야 하나 */
export const 사이트들 = [
  { 터: 'klifemap.ai', 말: '한국어', 꼭: ['네이버', '구글'] },
  { 터: '100yearmap.com', 말: '한국어', 꼭: ['네이버', '구글'] },
  { 터: 'seoulmarkets.com', 말: '영문', 꼭: ['구글', '빙'] },
  { 터: 'www.kculturewire.com', 말: '영문', 꼭: ['구글', '빙'] },
];

/** 지면 글에서 어느 검색엔진의 소유확인 표가 보이나 */
export function 보이는표(html) {
  const s = String(html ?? '');
  return {
    네이버: /name\s*=\s*["']naver-site-verification["']/i.test(s),
    빙: /name\s*=\s*["']msvalidate\.01["']/i.test(s),
    구글: /name\s*=\s*["']google-site-verification["']/i.test(s),
    다음: /name\s*=\s*["'](daum|dauc)-site-verification["']/i.test(s),
  };
}

/** robots.txt 에서 — 사이트맵을 냈나 · 네이버 봇(Yeti)을 막나 */
export function 로봇읽기(글) {
  const s = String(글 ?? '');
  if (!s.trim()) return null;      /* ⛔ 못 받은 것을 「막는다」로 읽지 않는다 */
  const 사이트맵 = [...s.matchAll(/^\s*Sitemap:\s*(\S+)\s*$/gim)].map((m) => m[1]);
  /* Yeti 칸을 찾아 그 아래 Disallow: / 가 있나 본다 */
  let 예티를막나 = false;
  const 칸들 = s.split(/\n\s*\n/);
  for (const 칸 of 칸들) {
    if (!/User-agent:\s*(Yeti|\*)/i.test(칸)) continue;
    if (/User-agent:\s*Yeti/i.test(칸) && /^\s*Disallow:\s*\/\s*$/im.test(칸)) 예티를막나 = true;
  }
  return { 사이트맵, 예티를막나 };
}

/** 한 사이트를 재고 「무엇이 빠졌나」를 낸다 */
export function 빠진것(터정보, 표, 로봇) {
  if (!표) return null;                    /* 못 받았다 */
  const 빠짐 = 터정보.꼭.filter((e) => !표[e]);
  const 더 = [];
  if (로봇 && !로봇.사이트맵.length) 더.push('robots.txt 에 Sitemap: 줄이 없다');
  if (로봇 && 로봇.예티를막나) 더.push('🔴 robots.txt 가 네이버 봇(Yeti)을 막는다');
  return { 빠진엔진: 빠짐, 더 };
}

/* ─────────────────────────────── 자가시험 ─────────────────────────────── */
async function 자가시험() {
  const { test } = await import('node:test');
  const A = (await import('node:assert/strict')).default;

  test('소유확인 표를 알아본다', () => {
    const r = 보이는표('<meta name="naver-site-verification" content="abc"><meta name="msvalidate.01" content="d">');
    A.equal(r.네이버, true);
    A.equal(r.빙, true);
    A.equal(r.구글, false);
  });
  test('⛔ 비슷한 말에 속지 않는다', () => {
    A.equal(보이는표('<p>naver-site-verification 이라는 것이 있다</p>').네이버, false,
      '글 안의 낱말을 표로 읽었다');
  });
  test('robots.txt 에서 사이트맵 줄을 뽑는다', () => {
    const r = 로봇읽기('User-agent: *\nAllow: /\n\nSitemap: https://a.com/sitemap.xml\nSitemap: https://a.com/s2.xml');
    A.equal(r.사이트맵.length, 2);
    A.equal(r.예티를막나, false);
  });
  test('🔴 Yeti 를 막는 것을 잡는다', () => {
    A.equal(로봇읽기('User-agent: Yeti\nDisallow: /').예티를막나, true);
  });
  test('⛔ 별표(*)로 막는 것을 Yeti 막는 것으로 읽지 않는다', () => {
    /* ⚠ 전부 막는 것은 다른 흠이다. 이 자는 「네이버만 막나」를 묻는다. */
    A.equal(로봇읽기('User-agent: *\nDisallow: /').예티를막나, false);
  });
  test('⛔ robots.txt 를 못 받으면 null — 「막는다」가 아니다', () => {
    A.equal(로봇읽기(''), null);
    A.equal(로봇읽기(null), null);
  });
  test('⚠ 말에 따라 꼭 있어야 할 엔진이 다르다 — 사장님 지시', () => {
    /* 「언어에 따라 접근할 검색엔진 달리하고. 네이버, 빙. 줌 등도 봐」 (2026-10-11) */
    const 한국어 = 사이트들.filter((x) => x.말 === '한국어');
    const 영문 = 사이트들.filter((x) => x.말 === '영문');
    A.ok(한국어.every((x) => x.꼭.includes('네이버')), '한국어 지면에 네이버가 빠졌다');
    A.ok(영문.every((x) => !x.꼭.includes('네이버')), '영문 지면에 네이버를 꼽았다 — 거짓 빨강이 난다');
    A.ok(영문.every((x) => x.꼭.includes('빙')), '영문 지면에 빙이 빠졌다');
  });
  test('빠진 것을 센다', () => {
    const r = 빠진것(사이트들[0], { 네이버: false, 구글: true, 빙: false },
      { 사이트맵: ['https://a/s.xml'], 예티를막나: false });
    A.deepEqual(r.빠진엔진, ['네이버']);
    A.equal(r.더.length, 0);
  });
  test('⛔ 못 받았으면 null — 「빠졌다」가 아니다', () => {
    A.equal(빠진것(사이트들[0], null, null), null);
  });
}

const 내가실행됐다 = Boolean(process.argv[1])
  && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop().replace(/ /g, '%20'));

if (process.argv.includes('--자가시험') || process.argv.includes('--selftest')) {
  await 자가시험();
} else {
  console.log('■ 네 사이트가 «어느 검색엔진»에 등록돼 있나 — 로그인 없이 잰 것');
  console.log('   🔴 사장님 2026-10-11 — 「언어에 따라 접근할 검색엔진 달리하고. 네이버, 빙. 줌 등도 봐」');
  console.log('   ⚠ 표가 안 보여도 «등록 안 됐다»가 아니다 — DNS·파일로 한 수도 있다. 「못 봤다」로 적는다.');
  console.log('');

  const 머리 = {
    'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
  };
  const 받는다 = async (u) => {
    try {
      const r = await fetch(u, { headers: 머리, redirect: 'follow', signal: AbortSignal.timeout(20000) });
      return r.ok ? await r.text() : null;
    } catch { return null; }
  };

  let 흠 = 0; let 못잼 = 0;
  for (const x of 사이트들) {
    const html = await 받는다('https://' + x.터 + '/');
    const robots = await 받는다('https://' + x.터 + '/robots.txt');
    const 표 = html ? 보이는표(html) : null;
    const 로봇 = 로봇읽기(robots);

    console.log('   ■ ' + x.터 + '  (' + x.말 + ' · 꼭 있어야: ' + x.꼭.join(' · ') + ')');
    if (!표) {
      console.log('      ⬜ 지면을 못 받았다 — **못 쟀다**');
      못잼 += 1; console.log(''); continue;
    }
    const 줄 = Object.entries(표).map(([e, 있나]) => (있나 ? '✅' : '⬜') + ' ' + e).join('   ');
    console.log('      소유확인 표   ' + 줄);
    if (로봇) {
      console.log('      robots.txt    사이트맵 ' + 로봇.사이트맵.length + '줄'
        + (로봇.예티를막나 ? '   🔴 네이버 봇(Yeti)을 막는다' : '   ✅ Yeti 를 막지 않는다'));
    } else {
      console.log('      robots.txt    ⬜ 못 받았다 — 「막는다」가 아니라 못 쟀다');
    }

    const r = 빠진것(x, 표, 로봇);
    if (r.빠진엔진.length) {
      console.log('      🔴 ' + x.말 + ' 지면인데 ' + r.빠진엔진.join(' · ') + ' 표를 못 봤다');
      흠 += r.빠진엔진.length;
    }
    for (const m of r.더) { console.log('      🔴 ' + m); 흠 += 1; }
    if (!r.빠진엔진.length && !r.더.length) console.log('      ✅ 꼭 있어야 할 것은 다 보인다');
    console.log('');
  }

  console.log('■ 흠 ' + 흠 + '개' + (못잼 ? ' · 못 잰 사이트 ' + 못잼 + '개' : ''));
  if (흠) {
    console.log('⚠ 「표를 못 봤다」는 「등록 안 됐다」가 아니다 — DNS·파일로 했을 수 있다.');
    console.log('   ⇒ 사장님께 서치어드바이저·웹마스터 화면을 여쭙거나, 표를 지면에 넣어 둔다.');
    console.log('   ⛔ 내가 로그인하지 않는다. 비밀번호를 다루지 않는다.');
    process.exit(1);
  }
  console.log('✅ 말에 맞는 검색엔진 표가 네 곳 다 보인다');
}
