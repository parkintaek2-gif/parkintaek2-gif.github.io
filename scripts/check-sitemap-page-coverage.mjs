#!/usr/bin/env node
/**
 * check-sitemap-page-coverage.mjs — **지면을 만들면 사이트맵에도 들어갔나.**
 *
 * ── 왜 만들었나 (2026-09-18 · 6번) ──────────────────────────────────
 * `src/pages/sitemap-[section].xml.ts` 의 「pages」 목록은 손으로 적는다. 그 파일 자체
 * 주석에 **같은 사고가 최소 여섯 번** 적혀 있다 — 지면을 내고 이 목록에 안 넣어
 * 라이브 200 인데 검색엔 안 보이는 채로 몇 시간~며칠 있었다(2026-08-09·08-11·08-21·
 * 09-09·09-11·09-12 두 번, 그리고 이번 2026-09-18 — company-credit·foreign-holdings·
 * rankings/{market-cap,pbr,interest-cover}·research 여섯 장이 또 빠져 있었다).
 *
 * 5번이 「seoulmarkets.com/sitemap.xml 이 11줄이다」로 재서 잡았는데, 실은 사이트맵
 * «구조»(색인+갈래별 하위 파일)는 정상이었다 — 진짜 문제는 이 손으로 적는 목록이
 * 낡은 것이었다. **같은 사고가 여섯 번 나면 사람이 아니라 검사가 없는 문제다.**
 *
 * ── 무엇을 재나 ────────────────────────────────────────────────
 * `src/pages/**‍/*.astro` 중 SeoulMarkets 몫(wikitip·100y 제외, 동적 라우트 제외,
 * 명시적으로 뺀 것 제외)이 `dist/sitemap-*.xml` 어딘가에 있는지 본다.
 *
 * ⛔ 이 자는 «있어야 하는데 없는 것»만 잡는다. 우선순위·changefreq 값은 안 본다.
 * ⚠ `npm run build` 뒤에 돌린다 — dist/ 가 없으면 못 잰다.
 *
 * 쓰는 법
 *   npm run build && node scripts/check-sitemap-page-coverage.mjs
 *   node scripts/check-sitemap-page-coverage.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 사이트맵에 실릴 «의무»가 없는 지면 — 손으로 유지한다. 늘어나면 여기 한 줄 더한다. */
export const 제외 = new Set([
  '/404',
  '/recover',       // 손님이 직접 «주문번호»를 쳐야 뜨는 조회 도구 — 검색 가치 없음
]);

/** 파일 경로 → URL 경로. `index.astro` 는 그 폴더 자체, 동적 라우트(`[..]`)는 null(따로 다룬다) */
export function URL경로(상대경로) {
  let p = 상대경로.replace(/\\/g, '/').replace(/\.astro$/, '');
  if (p.includes('[')) return null;               // 동적 라우트 — 이 검사가 못 다룬다
  if (p === 'index') return '/';
  if (p.endsWith('/index')) p = p.slice(0, -('/index'.length));
  return '/' + p;
}

/** SeoulMarkets 몫 지면 파일만 — 다른 매체 폴더는 그쪽 검사가 있다 */
export function 내지면들(뿌리 = path.join(ROOT, 'src/pages')) {
  const 나옴 = [];
  const 걷기 = (dir, rel) => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (ent.name === 'wikitip' || ent.name === '100y') continue;   // 남의 것
      const full = path.join(dir, ent.name);
      const relPath = rel ? `${rel}/${ent.name}` : ent.name;
      if (ent.isDirectory()) { 걷기(full, relPath); continue; }
      if (!ent.name.endsWith('.astro')) continue;                    // .xml.ts 등은 별도
      const url = URL경로(relPath);
      if (url && !제외.has(url)) 나옴.push(url);
    }
  };
  걷기(뿌리, '');
  return 나옴;
}

/** dist/sitemap-*.xml (100y·wikitip 것 제외) 에서 <loc> 을 전부 모아 SITE_URL 을 뗀다 */
export function 사이트맵에실린것(dist = path.join(ROOT, 'dist')) {
  const 나옴 = new Set();
  if (!fs.existsSync(dist)) return 나옴;
  for (const f of fs.readdirSync(dist)) {
    if (!/^sitemap.*\.xml$/.test(f)) continue;
    const 글 = fs.readFileSync(path.join(dist, f), 'utf8');
    for (const m of 글.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      나옴.add(m[1].replace(/^https?:\/\/[^/]+/, '') || '/');
    }
  }
  return 나옴;
}

function 자가시험() {
  let ok = true;
  const 재다 = (이름, 참) => { if (!참) { ok = false; console.error('✕', 이름); } };

  재다('index.astro → /', URL경로('index.astro') === '/');
  재다('about.astro → /about', URL경로('about.astro') === '/about');
  재다('data/index.astro → /data', URL경로('data/index.astro') === '/data');
  재다('data/screener.astro → /data/screener', URL경로('data/screener.astro') === '/data/screener');
  재다('동적 라우트는 null', URL경로('[category].astro') === null);
  재다('404 는 제외 목록에 있다', 제외.has('/404'));

  const 가짜사이트맵 = new Set(['/', '/about']);
  재다('사이트맵에실린것 — <loc> 파싱',
    (() => {
      const tmp = fs.mkdtempSync(path.join(ROOT, '.tmp-sitemap-selftest-'));
      try {
        fs.writeFileSync(path.join(tmp, 'sitemap-pages.xml'),
          '<urlset><url><loc>https://seoulmarkets.com/about</loc></url></urlset>');
        const got = 사이트맵에실린것(tmp);
        return got.has('/about') && !got.has('/data');
      } finally {
        fs.rmSync(tmp, { recursive: true, force: true });
      }
    })());

  console.log(ok ? `✅ 자가시험 통과` : `⛔ 자가시험 실패`);
  return ok;
}

function 본일() {
  const dist = path.join(ROOT, 'dist');
  if (!fs.existsSync(dist)) {
    console.error('⛔ dist/ 가 없다. 먼저 npm run build 를 돌린다.');
    process.exit(1);
  }
  const 지면들 = 내지면들();
  const 실린것 = 사이트맵에실린것(dist);
  const 빠진것 = 지면들.filter((u) => !실린것.has(u));

  console.log(`■ 사이트맵 지면 커버리지 — SeoulMarkets 정적 지면 ${지면들.length}장 검사`);
  if (!빠진것.length) {
    console.log('✅ 전부 사이트맵에 있다.');
    process.exit(0);
  }
  console.log(`⛔ ${빠진것.length}장이 라이브인데 사이트맵에 없다 —`);
  for (const u of 빠진것) console.log('   ' + u);
  console.log('   고치는 법: src/pages/sitemap-[section].xml.ts 의 pages 목록에 «같은 커밋에서» 넣는다.');
  process.exit(1);
}

if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);
else if (process.argv[1] && process.argv[1].endsWith('check-sitemap-page-coverage.mjs')) 본일();
