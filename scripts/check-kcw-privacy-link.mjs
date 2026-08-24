#!/usr/bin/env node
/**
 * check-kcw-privacy-link.mjs — **손님이 받는 모든 지면에 법적 링크가 있나.** (5번, 2026-08-24)
 *
 * ── 왜 이 검사가 생겼나 ──────────────────────────────────────
 * 사장님이 물으셨다: 「kculturewire.com/privacy 주소 등록함 개인정보보호방침 …
 * **커뮤니티 웹에 적용했니?**」 재 보니 **안 되어 있었다.**
 * ```
 * /community              🔴 없음
 * /born-on/*  366장       🔴 없음
 * /week/*     268장       🔴 없음     ← 합쳐 635장
 * ```
 * Astro 레이아웃을 지나는 지면에는 있었고, **각 빌더가 직접 써 넣는 정적 지면에는 없었다.**
 * 꼬리말이 세 군데에 베껴져 있어서 하나를 고쳐도 나머지가 안 따라오는 꼴이었다.
 *
 * 🔴 이것이 왜 검사여야 하나 — 두 가지가 걸려 있다.
 *   ① **손님이 쿠키를 받는데 그 안내를 못 찾는다.** 이건 우리 강령 문제다.
 *   ② 애드센스 심사가 개인정보처리방침을 본다. 없는 지면이 635장이면 걸린다.
 *   ⛔ 되돌릴 때 값이 큰 것은 「보는 검사」에 두지 않는다. **막는 검사**다.
 *
 * ⛔ **소스가 아니라 지어진 결과물(dist)을 본다.** 소스에 있어도 결과물에 없으면
 *   손님에게는 없는 것이다. 오늘 그 차이 때문에 635장을 놓쳤다.
 * ⛔ **아무것도 안 보고 통과시키지 않는다.** 지면이 적으면 「못 쟀다」로 낸다.
 *
 * 쓰는 법
 *   node scripts/check-kcw-privacy-link.mjs
 *   node scripts/check-kcw-privacy-link.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 없으면안되는길 } from './kcw-static-footer.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 방 = path.join(뿌리, 'dist', 'wikitip');
const 직접불렸나 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

/** 지면이 적으면 통과가 아니다. 빌드가 덜 됐을 때 초록을 내면 안 된다 */
export const 적어도 = 500;

/**
 * 지면 하나를 본다. ⛔ 목록을 손으로 적지 않는다 — `kcw-static-footer` 에서 가져온다.
 */
export function 지면판정(html) {
  const 글 = String(html ?? '');
  const 빠진것 = 없으면안되는길.filter((길) => !글.includes(`href="${길}"`));
  return { 좋다: 빠진것.length === 0, 빠진것 };
}

/** 갈래로 접는다 — 어느 갈래가 통째로 빠졌는지 보이게 */
export function 갈래이름(상대길) {
  /**
   * 🔴 자가시험이 결함을 잡았다 — 빈 값을 `String()` 하면 `'null'` 이 되어 갈래가
   *   «/null» 로 나왔다. 자가시험이 없었으면 갈래 목록에 `/null` 이 섞여 나갔고,
   *   그걸 보고 「/null 갈래가 왜 있지」를 한참 찾았을 것이다.
   * ⛔ 빈 값은 빈 값으로 받는다.
   */
  if (상대길 === null || 상대길 === undefined || String(상대길).trim() === '') return '(뿌리)';
  const 첫 = String(상대길).split(/[/\\]/).filter(Boolean)[0] ?? '';
  return 첫.endsWith('.html') ? '(뿌리)' : `/${첫}`;
}

/** 결과를 접는다. ⛔ 「못 봤다」를 통과로 접지 않는다 */
export function 모아판정(전체, 빨강수) {
  if (!Number.isFinite(전체) || 전체 < 적어도) return '못쟀다';
  return 빨강수 > 0 ? '빨강' : '통과';
}

if (직접불렸나 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 참 = (이름, 값) => { if (값) 통 += 1; else { 실 += 1; console.log(`   🔴 ${이름}`); } };

  const 좋은 = 없으면안되는길.map((l) => `<a href="${l}">x</a>`).join('');
  참('다 있으면 좋다', 지면판정(좋은).좋다 === true);
  참('privacy 가 없으면 잡는다',
    지면판정('<a href="/terms">t</a><a href="/about">a</a>').빠진것.includes('/privacy'));
  참('빈 글은 전부 빠진 것', 지면판정('').빠진것.length === 없으면안되는길.length);
  참('빈 값도 안 죽는다', 지면판정(null).좋다 === false);
  /* ⛔ 비슷한 글자에 속지 않는다 — /privacy-policy 는 /privacy 가 아니다.
       ⚠ 처음 이 시험을 뜻 없는 삼항으로 써서 **무엇을 해도 통과**하게 만들어 두었다.
         통과하는 시험이 아니라 «갈라내는» 시험이어야 한다. */
  참('다른 주소를 privacy 로 안 센다',
    지면판정('<a href="/privacy-policy">p</a>').빠진것.includes('/privacy') === true);

  참('갈래를 뽑는다', 갈래이름('week/2024-11-03.html') === '/week');
  참('뿌리 지면은 (뿌리)', 갈래이름('about.html') === '(뿌리)');
  참('빈 값도 안 죽는다 2', 갈래이름(null) === '(뿌리)');

  /* 🔴 아무것도 안 보고 통과시키지 않는다 */
  참('지면이 적으면 못 쟀다', 모아판정(3, 0) === '못쟀다');
  참('0장이면 못 쟀다', 모아판정(0, 0) === '못쟀다');
  참('값이 없으면 못 쟀다', 모아판정(NaN, 0) === '못쟀다');
  참('충분히 보고 빨강이 없으면 통과', 모아판정(1500, 0) === '통과');
  참('빨강이 하나라도 있으면 빨강', 모아판정(1500, 1) === '빨강');

  참('없으면 안 되는 길에 privacy 가 있다', 없으면안되는길.includes('/privacy'));
  참('없으면 안 되는 길이 셋 이상', 없으면안되는길.length >= 3);

  console.log(`법적 링크를 보는 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (직접불렸나 && !process.argv.includes('--selftest')) {
  if (!fs.existsSync(방)) {
    console.log('⚠ dist/wikitip 이 없다 — **못 쟀다.** 먼저 짓는다');
    process.exit(1);
  }
  const 지면들 = [];
  (function 걷기(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) 걷기(p);
      else if (e.name.endsWith('.html')) 지면들.push(p);
    }
  }(방));

  const 빨강 = [];
  const 갈래별 = new Map();
  for (const f of 지면들) {
    const 상대 = path.relative(방, f);
    const r = 지면판정(fs.readFileSync(f, 'utf8'));
    const k = 갈래이름(상대);
    const v = 갈래별.get(k) ?? { 전체: 0, 빨강: 0 };
    v.전체 += 1;
    if (!r.좋다) { v.빨강 += 1; 빨강.push([상대, r.빠진것]); }
    갈래별.set(k, v);
  }

  console.log(`손님이 받는 지면 ${지면들.length}장에서 **법적 링크**를 본다`);
  console.log(`없으면 안 되는 것: ${없으면안되는길.join(' · ')}\n`);

  console.log(`${'갈래'.padEnd(16)} ${'지면'.padStart(6)} ${'빠진 것'.padStart(8)}`);
  for (const [k, v] of [...갈래별].sort((a, b) => b[1].빨강 - a[1].빨강 || b[1].전체 - a[1].전체)) {
    console.log(`${k.padEnd(16)} ${String(v.전체).padStart(6)} ${String(v.빨강).padStart(8)}`
      + (v.빨강 ? '  🔴' : '  ✅'));
  }

  const 판 = 모아판정(지면들.length, 빨강.length);
  if (판 === '못쟀다') {
    console.log(`\n⚠ **못 쟀다** — 지면이 ${지면들.length}장뿐이다(적어도 ${적어도}장). 빌드가 덜 됐다.`);
    console.log('⛔ 이것은 통과가 아니다. 아무것도 안 보고 초록을 내지 않는다');
    process.exit(1);
  }
  if (판 === '통과') { console.log('\n✅ 모든 지면에 법적 링크가 있다'); process.exit(0); }

  console.log(`\n🔴 빠진 지면 ${빨강.length}장 — **배포하지 않는다**`);
  for (const [f, 빠진] of 빨강.slice(0, 15)) console.log(`   ${f.padEnd(44)} ${빠진.join(', ')}`);
  if (빨강.length > 15) console.log(`   … 그리고 ${빨강.length - 15}장 더`);
  console.log('\n⭐ 정적으로 짓는 지면이면 `scripts/kcw-static-footer.mjs` 의 `꼬리말()` 을 쓴다.');
  console.log('   꼬리말을 빌더마다 베끼면 오늘처럼 갈라진다.');
  process.exit(1);
}
