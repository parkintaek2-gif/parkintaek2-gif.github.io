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
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PUBLISHER } from '../src/consts.ts';

/**
 * 발행 주체 한 줄 — 상호·사업자등록번호·통신판매업 신고번호.
 *
 * 🔴 [2026-08-28] 사장님이 통신판매업 신고를 마치시고 신고증을 주셔서 넣었다.
 * ⛔ **값을 여기 손으로 적지 않는다.** `src/consts.ts` 의 PUBLISHER 한 곳이 원본이고,
 *   그 값은 4번이 등기사항전부증명서로 대조한 것이다. 베끼면 두 얼굴이 된다.
 * ⚠ 영문 지면이라 번호는 한국어 그대로 두되 «무엇인지»를 영어로 밝힌다 —
 *   번호만 적으면 영어 손님에게는 뜻 없는 글자다.
 *
 * 🔴 [2026-08-29 · 사장님 지시] 대표자 이름은 이 줄(모든 지면 꼬리말)에서 뺐다 —
 *   전자상거래법 표시의무는 그대로 지켜야 해서 «없앤» 것이 아니라 **`/about`으로
 *   옮겼다**(about.astro 에 "Representative director: …"가 이미 있다). 법적 링크
 *   목록(법적링크)에 `/about`이 이미 있어 손님이 한 번의 클릭으로 볼 수 있다.
 */
export function 발행주체() {
  return `Published by ${PUBLISHER.legalName} &middot; Business reg. ${PUBLISHER.bizRegNo} `
    + `&middot; Mail-order licence ${PUBLISHER.mailOrderNo} (${PUBLISHER.mailOrderAuthorityEn})`;
}

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
    /* 🔴 [2026-08-28 · 5번] **미리 지어 두는 지면에 발행 주체가 한 줄도 없었다.**
       Astro 틀만 고치고 빌드해서 세 보니 신고번호가 든 지면이 1,982장이었다 —
       나머지 700여 장이 이 꼬리말을 쓰는 «미리 지은» 지면이었다.
       ⛔ 「고쳤다」와 「전부에 나갔다」는 다른 말이다. 세어 보고 알았다.
       ⚠ 값을 여기 손으로 적지 않는다 — consts 한 곳에서 온다(아래 발행주체). */
    `    <p>${발행주체()}</p>`,
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

  /* 🔴 [2026-08-28] 발행 주체가 꼬리말에서 사라지면 여기서 걸린다 —
     Astro 틀만 고치고 이 자를 안 고쳐 700여 장이 빠져 있었다. 검사로 굳힌다. */
  참('꼬리말에 상호가 있다', 꼬리말().includes('KLifeDesign'));
  참('꼬리말에 사업자등록번호가 있다', 꼬리말().includes('456-87-03384'));
  참('꼬리말에 통신판매업 신고번호가 있다', 꼬리말().includes('2026-세종-0591'));
  참('신고번호가 무엇인지 영어로 밝힌다', /Mail-order licence/.test(꼬리말()));
  /* ⛔ 값을 이 파일에 손으로 적어 두면 두 얼굴이 된다 — consts 에서 오는지 본다 */
  참('값을 이 파일에 손으로 안 적었다',
    !/2026-세종-0591|456-87-03384/.test(
      readFileSync(fileURLToPath(import.meta.url), 'utf8').split('자가시험')[0]));
  참('더할 것이 있어도 발행 주체는 붙는다',
    꼬리말(['그 지면만의 문장']).includes('2026-세종-0591'));

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
