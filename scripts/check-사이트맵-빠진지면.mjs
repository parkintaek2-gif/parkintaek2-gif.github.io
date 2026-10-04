#!/usr/bin/env node
/**
 * check-사이트맵-빠진지면.mjs — **지면을 내고 사이트맵에 안 넣은 것을 잡는다.**
 *
 * ── 🔴🔴 왜 (같은 사고가 여섯 번째다) ────────────────────────────
 * `src/pages/sitemap-[section].xml.ts` 의 주석에만 같은 사고가 **다섯 번** 적혀 있다 —
 * ```
 *   2026-09-12 · 4번   무료 영문 지면 넷 중 셋이 빠져 있었다
 *   2026-09-18 · 6번   신용등급·외국인보유·재무축 다섯 장
 *   2026-09-18 · 6번   Research Index — 라이브 200 인데 목록에 없었다
 *   2026-09-23 · 5번   「새 지면을 같은 커밋에서 넣는다」고 적었다
 *   2026-10-04 · 2번   segment-reporting — 언제 빠졌는지도 모른다
 * ```
 * 그때마다 「다음엔 같은 커밋에서 넣는다」고 적고 끝냈다. 그리고 **2026-10-05 에
 * 또 셋이 빠졌다** — `/revenue-concentration` · `/korea-inflation-rate` ·
 * `/kpop-group-size`. 사람이 기억해서 지키는 구조는 이렇게 끝난다.
 *
 * ⇒ 두 가지를 같이 한다 —
 *   ① `sitemap-[section].xml.ts` 가 **빠진 것을 저절로 메운다**(빠진것찾기)
 *   ② 이 자가 **그래도 빠진 것이 있나**를 보고, 손으로 적어야 할 것을 알려 준다
 *
 * ⛔ 이 자는 막지 않는다. 보여 주고 사람이 판단한다 —
 *   일부러 사이트맵에 안 내는 지면이 있다(계정·결제·404).
 *
 * 쓰는 법
 *   node scripts/check-사이트맵-빠진지면.mjs
 *   node scripts/check-사이트맵-빠진지면.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 일부러 사이트맵에 안 내는 것. ⛔ 늘릴 때는 «왜»를 같이 적는다 */
export const 안낼것 = new Set([
  '404',          // 없는 지면
  'index',        // 첫 화면은 '/' 로 따로 들어간다
  'account',      // 로그인해야 보인다
  'recover',      // 비밀번호 되찾기
  'trial',        // 신청 화면
  'contact',      // 문의 — 색인할 값이 없다
  'privacy',      // 약관류는 따로 들어가 있다
  'sitemap',      // 사이트맵 자신
]);

/** 그 폴더의 지면 주소들. ⛔ 못 읽으면 빈 배열 — 「없다」로 읽지 않게 둘째 값을 함께 낸다 */
export function 지면들(밑, { 읽기 = fs.readdirSync } = {}) {
  let 목록 = [];
  try { 목록 = 읽기(밑); } catch { return { 길: [], 읽었나: false }; }
  const 길 = [];
  for (const f of 목록) {
    const 이름 = String(f);
    if (!이름.endsWith('.astro')) continue;
    const slug = 이름.replace(/\.astro$/, '');
    if (slug.includes('[') || slug.startsWith('_')) continue;   /* 동적·부분 지면 */
    if (안낼것.has(slug)) continue;
    길.push(`/${slug}`);
  }
  return { 길, 읽었나: true };
}

/** 사이트맵 소스에서 적힌 주소를 뽑는다. `loc: '/x'` 와 `path: '/x'` 둘 다 */
export function 적힌길(소스) {
  const s = String(소스 ?? '');
  const 것 = new Set();
  for (const m of s.matchAll(/(?:loc|path):\s*'(\/[^']*)'/g)) 것.add(m[1].replace(/\/+$/, '') || '/');
  for (const m of s.matchAll(/loc:\s*`(\/[^`$]*)`/g)) 것.add(m[1].replace(/\/+$/, '') || '/');
  return 것;
}

/**
 * 한 짝(지면 폴더 ↔ 사이트맵 소스)을 견준다.
 * @returns {{빠진것: string[], 센것: number, 읽었나: boolean}}
 */
export function 견준다(지면밑, 사이트맵길, { 읽기 = fs.readdirSync, 파일읽기 = fs.readFileSync } = {}) {
  const { 길, 읽었나 } = 지면들(지면밑, { 읽기 });
  if (!읽었나) return { 빠진것: [], 센것: 0, 읽었나: false };
  let 소스 = '';
  try { 소스 = String(파일읽기(사이트맵길, 'utf8')); } catch { return { 빠진것: [], 센것: 길.length, 읽었나: false }; }
  const 적힌것 = 적힌길(소스);
  return { 빠진것: 길.filter((p) => !적힌것.has(p)), 센것: 길.length, 읽었나: true };
}

/** 볼 짝들 */
export const 볼것 = [
  {
    이름: 'SeoulMarkets',
    지면: path.join(뿌리, 'src/pages'),
    사이트맵: path.join(뿌리, 'src/pages/sitemap-[section].xml.ts'),
  },
  {
    이름: 'K Culture Wire',
    지면: path.join(뿌리, 'src/pages/wikitip'),
    사이트맵: path.join(뿌리, 'src/pages/wikitip/sitemap.xml.ts'),
  },
  {
    이름: '백년지도',
    지면: path.join(뿌리, 'src/pages/100y'),
    사이트맵: path.join(뿌리, 'src/pages/100y/sitemap.xml.ts'),
  },
];

/* ── 자가시험 ─────────────────────────────────────────────── */
const 내가실행됐다 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--자가시험')) {
  let 통 = 0; const 진 = [];
  const 본다 = (이름, 참) => { if (참) 통 += 1; else 진.push(이름); };

  const 가짜파일 = ['aaa.astro', 'bbb.astro', '404.astro', 'index.astro', '[tag].astro', '_part.astro', 'x.md'];
  const r = 지면들('/어디', { 읽기: () => 가짜파일 });
  본다('지면 주소를 뽑는다', r.길.includes('/aaa') && r.길.includes('/bbb'));
  본다('⛔ 404·index 는 뺀다', !r.길.includes('/404') && !r.길.includes('/index'));
  본다('⛔ 동적 경로는 뺀다', !r.길.some((x) => x.includes('[')));
  본다('⛔ 밑줄로 시작하는 것은 뺀다', !r.길.includes('/_part'));
  본다('⛔ astro 아닌 것은 안 본다', !r.길.some((x) => x.includes('.md')));
  /* 🔴 못 읽은 것과 「없다」를 가른다 */
  본다('🔴 못 읽으면 «읽었나: false»', 지면들('/없는곳', { 읽기: () => { throw new Error('x'); } }).읽었나 === false);

  const 적힘 = 적힌길("{ loc: '/aaa' }, { path: '/ccc' }, { loc: '/ddd/' }, { loc: `/eee` }");
  본다('loc 을 읽는다', 적힘.has('/aaa'));
  본다('path 도 읽는다', 적힘.has('/ccc'));
  본다('끝 슬래시를 떼고 본다', 적힘.has('/ddd'));
  본다('백틱도 읽는다', 적힘.has('/eee'));
  본다('⛔ 빈 것에도 안 터진다', 적힌길(null).size === 0);

  const c = 견준다('/어디', '/사이트맵', {
    읽기: () => 가짜파일,
    파일읽기: () => "{ loc: '/aaa' }",
  });
  본다('🔴 빠진 것을 찾는다', c.빠진것.length === 1 && c.빠진것[0] === '/bbb');
  본다('⛔ 적힌 것은 안 센다', !c.빠진것.includes('/aaa'));
  본다('센 지면 수를 낸다', c.센것 === 2);
  본다('🔴 사이트맵을 못 읽으면 «읽었나: false»',
    견준다('/어디', '/x', { 읽기: () => 가짜파일, 파일읽기: () => { throw new Error('x'); } }).읽었나 === false);

  본다('볼 짝이 셋', 볼것.length === 3);
  본다('안낼것에 까닭을 적어 두었다', 안낼것.size >= 6);

  console.log(진.length ? `🔴 ${진.length} 떨어졌다 —\n  ${진.join('\n  ')}` : `✅ 자가시험 ${통} 통과`);
  process.exit(진.length ? 1 : 0);
}

if (내가실행됐다) {
  console.log('■ 지면을 내고 사이트맵에 안 넣은 것이 있나\n');
  let 모두빠진것 = 0; let 못읽은것 = 0;
  for (const 곳 of 볼것) {
    const r = 견준다(곳.지면, 곳.사이트맵);
    if (!r.읽었나) {
      못읽은것 += 1;
      console.log(`   ⬜ ${곳.이름} — 못 쟀다 (경로를 확인한다)`);
      continue;
    }
    if (!r.빠진것.length) {
      console.log(`   ✅ ${곳.이름.padEnd(16)} 지면 ${r.센것}장 · 빠진 것 없다`);
      continue;
    }
    모두빠진것 += r.빠진것.length;
    console.log(`   🔴 ${곳.이름.padEnd(16)} 지면 ${r.센것}장 · **빠진 것 ${r.빠진것.length}장**`);
    for (const p of r.빠진것) console.log(`        ${p}`);
  }
  console.log();
  if (못읽은것) console.log(`   ⬜ 못 잰 곳 ${못읽은것}개 — 0 으로 읽지 않는다`);
  if (모두빠진것) {
    console.log(`🔴 사이트맵에 안 들어간 지면 ${모두빠진것}장`);
    console.log('   ⚠ 일부러 안 내는 지면이면 이 자의 «안낼것» 에 까닭과 함께 넣는다');
    console.log('   ⛔ 이 자는 막지 않는다 — 사람이 판단한다');
  } else {
    console.log('✅ 빠진 지면이 없다');
  }
  process.exit(0);
}
