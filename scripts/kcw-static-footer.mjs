#!/usr/bin/env node
/**
 * kcw-static-footer.mjs — **정적으로 짓는 지면들의 «법적 꼬리말»을 한 군데에 둔다.** (5번, 2026-08-24)
 *
 * ── 왜 이 자가 생겼나 ────────────────────────────────────────
 * 사장님이 물으셨다(2026-08-24): 「kculturewire.com/privacy 주소 등록함 개인정보보호방침 …
 * **커뮤니티 웹에 적용했니?**」
 *
 * 재 보니 **안 되어 있었다.** 라이브를 지면마다 받아 세니 —
 * ```
 * 집·기사·작품·나라·회사   ✅ /privacy 링크 있음  (Astro 레이아웃이 붙여 준다)
 * /community              🔴 없음
 * /born-on/*  366장       🔴 없음
 * /week/*     268장       🔴 없음      ← 합쳐 635장
 * ```
 * 이 지면들은 **Astro 레이아웃을 안 지나고** 각 빌더가 `public/wikitip/` 에 HTML 을
 * 직접 써 넣는다. 그래서 꼬리말이 셋으로 갈려 있었고, 셋 다 법적 링크가 없었다.
 *
 * 🔴 애드센스 심사가 도는 중이다. 개인정보처리방침 링크가 없는 지면이 635장이면
 *   심사가 걸릴 자리다. 그리고 무엇보다 **손님이 쿠키를 받는데 그 안내를 못 찾는다.**
 *
 * ── ⛔ 이 자가 지키는 것 ────────────────────────────────────
 * ⛔ **꼬리말을 빌더마다 베끼지 않는다.** 베끼면 오늘처럼 셋이 갈라지고, 하나를 고쳐도
 *   나머지가 안 따라온다. 한 군데에 두고 들여다 쓴다.
 * ⛔ **링크 목록을 손으로 적지 않는다** — 여기 `법적링크` 하나가 원본이다.
 *   `check-kcw-privacy-link.mjs` 가 라이브 지면에 이것이 있는지 검사한다.
 * ⚠ Astro 레이아웃(`WikiTip.astro`)의 꼬리말과 **같은 주소**를 쓴다. 다르면 두 얼굴이 된다.
 */

/**
 * 반드시 들어가야 하는 법적 링크. ⛔ `/privacy` 를 빼면 검사가 막는다.
 * ⚠ Astro 레이아웃과 같은 주소·같은 이름을 쓴다.
 */
export const 법적링크 = [
  { 길: '/about', 이름: 'About' },
  { 길: '/corrections', 이름: 'Corrections' },
  { 길: '/privacy', 이름: 'Cookies' },
  { 길: '/terms', 이름: 'Terms' },
  { 길: '/contact', 이름: 'Contact' },
];

/** 없으면 안 되는 것. 검사가 이 목록을 본다 */
export const 없으면안되는길 = ['/privacy', '/terms', '/about'];

/**
 * 꼬리말 HTML 을 낸다.
 * @param {string[]} 더할것  그 지면만의 문장(HTML 조각). 없으면 법적 줄만 낸다.
 * ⛔ 더할 것이 있어도 **법적 줄은 항상 붙는다.** 지면이 골라 뺄 수 없다.
 */
export function 꼬리말(더할것 = []) {
  const 링크 = 법적링크
    .map((l) => `<a href="${l.길}">${l.이름}</a>`)
    .join(' &middot; ');
  const 앞 = (더할것 ?? [])
    .filter((x) => typeof x === 'string' && x.trim())
    .map((x) => `    <p>${x}</p>`)
    .join('\n');
  return [
    '  <footer>',
    앞,
    `    <p>K Culture Wire &middot; ${링크}</p>`,
    '    <p>Cookies are set by Google Analytics on this site. What is stored, and how to refuse it,'
      + ' is on <a href="/privacy">the cookies page</a>.</p>',
    '  </footer>',
  ].filter(Boolean).join('\n');
}

/** 꼬리말에 법적 링크가 다 있나. ⛔ 빌더가 스스로 확인할 수 있게 내준다 */
export function 다들었나(html) {
  const 글 = String(html ?? '');
  const 빠진것 = 없으면안되는길.filter((길) => !글.includes(`href="${길}"`));
  return { 좋다: 빠진것.length === 0, 빠진것 };
}

/* ── 자가시험 ─────────────────────────────────────────────── */
if (process.argv[1] && process.argv[1].endsWith('kcw-static-footer.mjs')
  && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 참 = (이름, 값) => { if (값) 통 += 1; else { 실 += 1; console.log(`   🔴 ${이름}`); } };

  const f = 꼬리말();
  참('privacy 가 들어간다', f.includes('href="/privacy"'));
  참('terms 가 들어간다', f.includes('href="/terms"'));
  참('about 가 들어간다', f.includes('href="/about"'));
  참('쿠키를 왜 쓰는지 한 줄이 있다', /Cookies are set by/.test(f));
  참('footer 로 감싼다', f.startsWith('  <footer>') && f.trim().endsWith('</footer>'));

  /* 🔴 지면이 법적 줄을 골라 뺄 수 없어야 한다 */
  const g = 꼬리말(['this page only says this']);
  참('그 지면만의 문장이 들어간다', g.includes('this page only says this'));
  참('그래도 법적 줄이 남는다', g.includes('href="/privacy"'));
  참('빈 문장은 안 넣는다', !꼬리말(['', '  ']).includes('<p></p>'));
  참('빈 값도 안 죽는다', 꼬리말(null).includes('href="/privacy"'));
  참('글이 아닌 것은 버린다', 꼬리말([null, 42, 'ok']).includes('ok'));

  참('다 들었으면 좋다', 다들었나(f).좋다 === true);
  참('privacy 가 빠지면 잡는다',
    다들었나('<a href="/terms">T</a><a href="/about">A</a>').빠진것.includes('/privacy'));
  참('빈 글은 전부 빠진 것', 다들었나('').빠진것.length === 없으면안되는길.length);
  참('빈 값도 안 죽는다 2', 다들었나(null).좋다 === false);

  console.log(`정적 지면 꼬리말 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}
