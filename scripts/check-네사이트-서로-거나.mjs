#!/usr/bin/env node
/**
 * check-네사이트-서로-거나.mjs — **네 사이트가 라이브에서 서로 링크를 거나.**
 *
 * ── 🔴🔴 왜 만들었나 (2026-10-05 17:4x · 5번) ─────────────────────────
 *   사장님: 「**순위를 무조건 높여......커뮤니티 잘 활용해서**」
 *
 *   재 보니 **KLifeMap 이 받는 링크가 가장 적었다** —
 *   ```
 *   klifemap     → 100y 1 · kcw 1 · seoulmarkets 1
 *   100y         → klifemap 2
 *   kcw          → klifemap 0      ← 비어 있었다
 *   seoulmarkets → klifemap 0      ← 비어 있었다
 *   ```
 *   그런데 klifemap 은 지면 3,004장에 30일 구글 노출이 **7**이다
 *   (다른 셋은 508·839·1,120). 표본 27장 가운데 **93%를 구글이 한 번도 안 왔다.**
 *
 *   빠져 있던 까닭은 **옛것**이었다 — 2026-08-05 에 klifemap.ai 가 PG 승인
 *   보류라 뺐고, 100yearmap 쪽은 2026-09-04 에 되살렸는데 나머지 두 자리
 *   (`src/consts.ts` · `src/layouts/WikiTip.astro`)는 **한 달을 그대로 남았다.**
 *   ⇒ 사람이 기억해서 지키는 구조라 빠진 것이다. 그래서 **자**로 만든다.
 *
 * ── ⭐ 이 자가 다르게 세는 것 ─────────────────────────────────────────
 *   **`<a href>` 안에 든 것만 센다.** 글자로 「klifemap.ai」라고 적힌 것,
 *   주석에 든 것, `<script>` 안의 문자열은 **링크가 아니다.**
 *   ⚠ 2026-10-05 에 저장소를 grep 해서 「47개」를 봤는데 라이브 `<a href>` 로는
 *     0개였다. 저장소에 있는 것과 손님·구글이 받는 것은 다르다.
 *
 * ── ⛔ 못 박은 수 ────────────────────────────────────────────────────
 *   줄면 막는다. 늘면 못 박은 수를 올린다 — 그래야 다음에 또 빠질 때 걸린다.
 *
 * 쓰는 법
 *   node scripts/check-네사이트-서로-거나.mjs
 *   node scripts/check-네사이트-서로-거나.mjs --자가시험
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const 사이트 = {
  klifemap: 'https://klifemap.ai/',
  '100y': 'https://100yearmap.com/',
  kcw: 'https://www.kculturewire.com/',
  seoulmarkets: 'https://seoulmarkets.com/',
};

export const 도메인 = {
  klifemap: /klifemap\.ai/,
  '100y': /100yearmap\.com/,
  kcw: /kculturewire\.com/,
  seoulmarkets: /seoulmarkets\.com/,
};

/**
 * 🔴 2026-10-05 17:45 에 라이브에서 잰 수다. **받는 쪽**으로 못 박는다.
 *   주는 쪽이 아니라 받는 쪽을 보는 까닭 — 수집을 끌어오는 것은 «받는 링크»다.
 * ⛔ 이 수를 내릴 때는 왜 내리는지 함께 적는다. 그냥 맞추지 않는다.
 */
export const 못박은_받는수 = { klifemap: 4, '100y': 3, kcw: 3, seoulmarkets: 3 };

/** `<a href>` 안에 그 도메인이 든 것만 센다 — 글자만 적힌 것은 링크가 아니다 */
export function 링크수(글, 꼴) {
  const 걸이 = String(글 ?? '').match(/<a\b[^>]*href=["'][^"']+["'][^>]*>/gi) || [];
  return 걸이.filter((a) => 꼴.test(a)).length;
}

/** 준 수를 받은 수로 뒤집는다 */
export function 받는수(줄들) {
  const 답 = {};
  for (const 이름 of Object.keys(사이트)) {
    답[이름] = (줄들 ?? []).reduce((a, r) => a + ((r.셈 ?? {})[이름] ?? 0), 0);
  }
  return 답;
}

/**
 * 판정 — 못 박은 수보다 **줄면** 막는다.
 * ⛔ 못 잰 것(사이트를 못 받은 것)은 막지 않는다. 「못 쟀다」와 「깨졌다」는 다르다.
 */
export function 판정(받음, 못잰곳 = []) {
  const 줄은것 = Object.entries(못박은_받는수)
    .filter(([k]) => !못잰곳.includes(k))
    .filter(([k, v]) => (받음[k] ?? 0) < v)
    .map(([k, v]) => `${k} ${받음[k] ?? 0} < ${v}`);
  if (줄은것.length) return { 빛: '🔴', 말: `서로 거는 링크가 줄었다 — ${줄은것.join(' · ')}` };
  if (못잰곳.length) return { 빛: '⚠', 말: `못 잰 곳 ${못잰곳.join(' · ')} — 막지 않는다` };
  const 늘은것 = Object.entries(못박은_받는수).filter(([k, v]) => (받음[k] ?? 0) > v);
  if (늘은것.length) {
    return { 빛: '✅', 말: `늘었다 — ${늘은것.map(([k, v]) => `${k} ${받음[k]} > ${v}`).join(' · ')}. 못 박은 수를 올린다` };
  }
  return { 빛: '✅', 말: '못 박은 수를 지킨다' };
}

/* ── 자가시험 ─────────────────────────────────────────────── */
export function 자가시험() {
  let 통과 = 0; let 깨짐 = 0;
  const 본다 = (말, 참) => { if (참) { 통과++; console.log(`  ✅ ${말}`); } else { 깨짐++; console.log(`  🔴 ${말}`); } };

  console.log('\n■ 네 사이트가 서로 거나 — 자가시험\n');

  본다('🔴 <a href> 안에 든 것만 센다',
    링크수('<a href="https://klifemap.ai/">여기</a>', 도메인.klifemap) === 1);
  본다('⛔ 글자로만 적힌 것은 링크가 아니다 — 저장소 grep 이 47개를 셌던 자리다',
    링크수('<p>klifemap.ai 를 보세요</p>', 도메인.klifemap) === 0);
  본다('⛔ 주석에 든 것도 안 센다',
    링크수('<!-- https://klifemap.ai/ 를 넣을 것 -->', 도메인.klifemap) === 0);
  본다('⛔ script 안의 문자열도 안 센다',
    링크수('<script>var u="https://klifemap.ai/";</script>', 도메인.klifemap) === 0);
  본다('꼬리가 붙어도 센다 — ?lang=en&from=kcw&at=footer',
    링크수('<a href="https://klifemap.ai/?lang=en&amp;from=kcw&amp;at=footer">KLifeMap</a>', 도메인.klifemap) === 1);
  본다('여럿이면 여럿으로 센다',
    링크수('<a href="https://klifemap.ai/a">1</a><a href="https://klifemap.ai/b">2</a>', 도메인.klifemap) === 2);

  {
    /* 🔴 2026-10-05 에 실제로 잰 «고치기 전» 꼴이다 */
    const 고치기전 = [
      { 이름: 'klifemap', 셈: { '100y': 1, kcw: 1, seoulmarkets: 1 } },
      { 이름: '100y', 셈: { klifemap: 2, kcw: 1, seoulmarkets: 1 } },
      { 이름: 'kcw', 셈: { klifemap: 0, '100y': 1, seoulmarkets: 1 } },
      { 이름: 'seoulmarkets', 셈: { klifemap: 0, '100y': 1, kcw: 1 } },
    ];
    본다('🔴 고치기 전에는 klifemap 이 2개만 받았다', 받는수(고치기전).klifemap === 2);
    본다('🔴 그 상태면 막는다', 판정(받는수(고치기전)).빛 === '🔴');

    const 고친뒤 = [
      { 이름: 'klifemap', 셈: { '100y': 1, kcw: 1, seoulmarkets: 1 } },
      { 이름: '100y', 셈: { klifemap: 2, kcw: 1, seoulmarkets: 1 } },
      { 이름: 'kcw', 셈: { klifemap: 1, '100y': 1, seoulmarkets: 1 } },
      { 이름: 'seoulmarkets', 셈: { klifemap: 1, '100y': 1, kcw: 1 } },
    ];
    본다('고친 뒤에는 klifemap 이 4개를 받는다', 받는수(고친뒤).klifemap === 4);
    본다('그 상태면 통과한다', 판정(받는수(고친뒤)).빛 === '✅');
  }

  본다('⛔ 못 잰 곳은 막지 않는다 — 「못 쟀다」와 「깨졌다」는 다르다',
    판정({ klifemap: 0, '100y': 3, kcw: 3, seoulmarkets: 3 }, ['klifemap']).빛 === '⚠');
  본다('⛔ 하나만 줄어도 막는다',
    판정({ klifemap: 4, '100y': 3, kcw: 3, seoulmarkets: 2 }).빛 === '🔴');
  본다('늘면 못 박은 수를 올리라고 한다',
    판정({ klifemap: 9, '100y': 3, kcw: 3, seoulmarkets: 3 }).말.includes('올린다'));

  console.log(`\n  통과 ${통과} · 깨짐 ${깨짐}\n`);
  return 깨짐 === 0;
}

/** 라이브에서 잰다. 되돌리는 것은 `{ 줄들, 못잰곳 }` */
export async function 라이브에서잰다() {
  const 줄들 = [];
  const 못잰곳 = [];
  for (const [이름, 주소] of Object.entries(사이트)) {
    let 글 = '';
    try {
      const r = await fetch(주소, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; klm-link-audit)' } });
      글 = await r.text();
    } catch {
      못잰곳.push(이름);
      continue;
    }
    const 셈 = {};
    for (const [남, 꼴] of Object.entries(도메인)) {
      if (남 === 이름) continue;
      셈[남] = 링크수(글, 꼴);
    }
    줄들.push({ 이름, 셈 });
  }
  return { 줄들, 못잰곳 };
}

/* ── 혼자 돌 때 ───────────────────────────────────────────── */
const 내가실행됐다 = Boolean(process.argv[1]) && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && (process.argv.includes('--자가시험') || process.argv.includes('--selftest'))) {
  process.exit(자가시험() ? 0 : 1);
}

if (내가실행됐다) {
  console.log('■ 네 사이트가 라이브에서 서로 거나 (첫 화면 · <a href> 안만)');
  console.log('   사장님 2026-10-05 — 「순위를 무조건 높여......커뮤니티 잘 활용해서」\n');

  const { 줄들, 못잰곳 } = await 라이브에서잰다();
  for (const r of 줄들) {
    const 합 = Object.values(r.셈).reduce((a, b) => a + b, 0);
    const 글자 = Object.entries(r.셈).map(([k, v]) => `${k} ${String(v).padStart(2)}`).join(' · ');
    console.log(`   ${합 === 0 ? '🔴' : '✅'} ${r.이름.padEnd(14)} → ${글자}   (합 ${합})`);
  }
  for (const 이름 of 못잰곳) console.log(`   ⚠ ${이름.padEnd(14)} 못 받았다`);

  const 받음 = 받는수(줄들);
  console.log('\n   ■ «받는» 링크 수 — 수집을 끌어오는 것은 이쪽이다');
  for (const [이름, 수] of Object.entries(받음)) {
    if (못잰곳.includes(이름)) { console.log(`   ⚠ ${이름.padEnd(14)} 못 쟀다`); continue; }
    const 선 = 못박은_받는수[이름];
    console.log(`   ${수 < 선 ? '🔴' : '✅'} ${이름.padEnd(14)} ${수}  (못 박은 수 ${선})`);
  }

  const r = 판정(받음, 못잰곳);
  console.log(`\n${r.빛} ${r.말}`);
  process.exit(r.빛 === '🔴' ? 1 : 0);
}
