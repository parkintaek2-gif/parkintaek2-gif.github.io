/* check-데이터지면이-외톨이인가.mjs
 * 새로 지은 데이터 지면이 «/data 목록»에서 닿나 — 빌드 «전»에 1초로 잡는다
 *
 *   node scripts/check-데이터지면이-외톨이인가.mjs --자가시험
 *   node scripts/check-데이터지면이-외톨이인가.mjs
 *
 * ── 🔴🔴 왜 이 자가 필요한가 (2026-10-13 01:5x · 5번) ───────────────────
 *
 * 오늘 새벽 여섯째 데이터 지면을 내면서 **또** /data 목록에 안 걸었다.
 * 빌드를 3분 돌리고 «끝난 뒤에야» 재서 알았다.
 *
 * ⛔ 사이트맵 쪽은 `check-sitemap-page-coverage.mjs` 가 잡아 준다. 그 자는 있었다.
 *   그런데 **목록 쪽을 보는 자는 없었다.** 그리고 저를 문 것은 목록 쪽이다.
 *   ⭐ **사이트맵에 «있는» 것과 손님이 «닿는» 것은 다르다.**
 *     링크가 없으면 구글은 그 지면을 낮게 본다 — 2026-10-10 에 그렇게 적어 두고도
 *     2026-10-12 와 오늘 또 겪었다. 세 번째다.
 *
 * ⛔ 「다음엔 잊지 말자」로 두지 않는다. 그 파일 주석에 이미 그렇게 적혀 있었고
 *   **내가 그 파일을 열어 놓고도 빠뜨렸다.** 글은 그 파일을 여는 사람만 본다(강령 ④).
 *
 * ⭐ 이 자는 **빌드를 안 돌린다.** 소스만 읽는다 — 그래야 짓는 중에 부를 수 있다.
 *   빌드 뒤에 잡는 자는 3분을 버린 뒤에 알려 준다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 지면방 = path.join(뿌리, 'src', 'pages', 'data');
export const 목록길 = path.join(지면방, 'index.astro');

/** 데이터 지면 이름들. ⛔ index 는 목록 자신이라 뺀다. */
export function 지면이름들(파일들) {
  return (파일들 ?? [])
    .filter((n) => n.endsWith('.astro'))
    .map((n) => n.replace(/\.astro$/, ''))
    .filter((n) => n !== 'index')
    .sort();
}

/**
 * 목록 글에서 «걸린» 지면 이름을 뽑는다.
 * ⛔ 이름이 글 어딘가에 있나가 아니라 **href 로 걸렸나**를 본다 —
 *   주석에 이름만 적힌 것을 「걸렸다」로 읽으면 2026-08-10 i18n-t 사고와 같은 꼴이 된다.
 */
export function 걸린이름들(목록글) {
  const 것 = new Set();
  const 뽑개 = /href:\s*['"`]\/data\/([a-z0-9][a-z0-9-]*)['"`]/gi;
  let m = 뽑개.exec(String(목록글 ?? ''));
  while (m) { 것.add(m[1]); m = 뽑개.exec(String(목록글 ?? '')); }
  return [...것].sort();
}

/**
 * 판정 — 목록에 안 걸린 지면이 하나라도 있으면 막는다.
 * ⛔ 지면이 한 장도 없으면 «성하다»가 아니라 «못 쟀다»다.
 */
export function 판정(지면들, 걸린것) {
  if (!지면들?.length) {
    return { 빛: '⬜', 말: '데이터 지면을 한 장도 못 찾았다 — ⛔ 「다 걸렸다」가 아니다', 외톨이: [] };
  }
  const 걸림 = new Set(걸린것 ?? []);
  const 외톨이 = 지면들.filter((n) => !걸림.has(n));
  if (외톨이.length) {
    return {
      빛: '🔴',
      말: `${외톨이.length}장이 /data 목록에서 «안 닿는다» — 구글은 링크 없는 지면을 낮게 본다`,
      외톨이,
    };
  }
  return { 빛: '✅', 말: `데이터 지면 ${지면들.length}장이 다 목록에서 닿는다`, 외톨이: [] };
}

/* ── 자가시험 ──────────────────────────────────────────────────────── */
function 자가시험() {
  let 통과 = 0; let 실패 = 0;
  const 본다 = (말, 참) => {
    if (참) { 통과 += 1; console.log('  ✅ ' + 말); } else { 실패 += 1; console.log('  🔴 ' + 말); }
  };

  본다('.astro 만 센다',
    JSON.stringify(지면이름들(['a.astro', 'b.md', 'c.astro'])) === '["a","c"]');
  본다('⛔ index 는 목록 자신이라 뺀다',
    !지면이름들(['index.astro', 'a.astro']).includes('index'));
  본다('⛔ 빈 목록에도 안 터진다', 지면이름들(null).length === 0);

  본다('href 로 걸린 것을 뽑는다',
    JSON.stringify(걸린이름들("href: '/data/foo-bar',")) === '["foo-bar"]');
  본다('따옴표 세 가지를 다 읽는다',
    걸린이름들('href: "/data/a", href: `/data/b`, href: \'/data/c\'').length === 3);
  본다('🔴 주석에 «이름만» 적힌 것은 걸린 것이 아니다 — i18n-t 사고와 같은 꼴이다',
    걸린이름들('/* account-name-variants 를 넣을 것 */').length === 0);
  본다('⛔ 다른 갈래의 href 는 안 센다',
    걸린이름들("href: '/article/foo'").length === 0);
  본다('⛔ 같은 것이 두 번 적혀도 한 번으로 센다',
    걸린이름들("href: '/data/a', href: '/data/a'").length === 1);

  /* 🔴 오늘 실제로 난 꼴 */
  본다('🔴 목록에 없는 지면을 잡는다',
    판정(['account-name-variants', 'valuation'], ['valuation']).빛 === '🔴');
  본다('   어느 장인지 그대로 낸다',
    판정(['account-name-variants', 'valuation'], ['valuation']).외톨이[0] === 'account-name-variants');
  본다('   왜 흠인지 적는다 — 구글이 낮게 본다',
    /구글은 링크 없는 지면을 낮게 본다/.test(판정(['a'], []).말));
  본다('✅ 다 걸렸으면 초록불', 판정(['a', 'b'], ['a', 'b']).빛 === '✅');
  본다('⛔ 목록에만 있고 지면이 없는 것은 이 자가 안 본다 — 다른 흠이다',
    판정(['a'], ['a', 'b']).빛 === '✅');
  본다('⬜ 지면을 한 장도 못 찾으면 ⬜ — ⛔ 「다 걸렸다」가 아니다',
    판정([], []).빛 === '⬜');

  /* ⭐ 진짜 저장소로도 재 본다 — 가짜로만 재면 믿을 수 없다 */
  if (fs.existsSync(지면방) && fs.existsSync(목록길)) {
    const 지면들 = 지면이름들(fs.readdirSync(지면방));
    const 걸린것 = 걸린이름들(fs.readFileSync(목록길, 'utf8'));
    본다('⭐ 진짜 저장소에 데이터 지면이 여러 장 있다', 지면들.length > 5);
    본다('   오늘 낸 지면이 목록에 걸려 있다',
      걸린것.includes('account-name-variants'));
  } else {
    본다('⬜ 지면 방이나 목록을 못 찾았다', false);
  }

  console.log('\n자가시험 ' + (통과 + 실패) + '개 · 통과 ' + 통과 + ' · 실패 ' + 실패);
  return 실패 === 0;
}

/* ── 본체 ──────────────────────────────────────────────────────────── */
function 잰다() {
  if (!fs.existsSync(지면방) || !fs.existsSync(목록길)) {
    console.log('⬜ 지면 방이나 목록을 못 찾았다 — ' + 지면방);
    return 2;
  }
  const 지면들 = 지면이름들(fs.readdirSync(지면방));
  const 걸린것 = 걸린이름들(fs.readFileSync(목록길, 'utf8'));
  const p = 판정(지면들, 걸린것);

  console.log('■ 데이터 지면이 /data 목록에서 닿나');
  console.log('   지면 ' + 지면들.length + '장 · 목록에 걸린 것 ' + 걸린것.length + '개');
  console.log('   ' + p.빛 + ' ' + p.말);
  for (const n of p.외톨이) console.log('      🔴 /data/' + n);
  if (p.외톨이.length) {
    console.log('   ⭐ 고치는 법 — src/pages/data/index.astro 의 목록에 «같은 커밋에서» 넣는다.');
    console.log('      ⛔ 새 글을 짓지 않는다. 지면이 스스로 적은 말을 그대로 옮긴다.');
  }
  console.log('   ⚠ 이 자는 «목록»만 본다. 사이트맵은 check-sitemap-page-coverage.mjs 가 본다');
  console.log('   ⭐ 빌드를 안 돌린다 — 짓는 «중»에 불러야 3분을 안 버린다');
  return p.빛 === '🔴' ? 1 : 0;
}

/* ── 들머리 ────────────────────────────────────────────────────────── */
const 내가진입점 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가진입점) {
  if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);
  else process.exit(잰다());
}
