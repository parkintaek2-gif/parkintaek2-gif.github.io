#!/usr/bin/env node
/**
 * check-kcw-search-ready.mjs — **109편 중 밖에서 찾아질 준비가 된 편이 몇인가.**
 *
 * 🔴 2번 23:2x 지시 — 「밖에서 온 사람이 전 유닛 합쳐 하루 27명이다.
 *   편 수를 늘리는 것보다, 이미 있는 109편이 **밖에서 찾아지게** 만드는 쪽이 값이 싸다」
 *
 * ⭐ **라이브를 잰다.** 검색 로봇이 보는 것은 dist 가 아니라 라이브다.
 *   dist 를 재면 「빌드했는데 안 나간 것」을 놓친다 — 오늘 그 구멍을 네 번 겪었다.
 *
 * 네 칸을 본다 — 넷 다 있어야 셈에 넣는다.
 *   ① 제목      <title> 이 있고 비어 있지 않다
 *   ② 설명      <meta name="description"> 이 있고 비어 있지 않다
 *   ③ canonical <link rel="canonical"> 이 **그 기사 자신**을 가리킨다
 *   ④ 사이트맵   sitemap.xml 에 그 주소가 있다
 *
 * ⛔ 못 받은 편을 「빠진 편」으로 세지 않는다. 「못 쟀다」로 따로 센다.
 *
 * 쓰는 법
 *   node scripts/check-kcw-search-ready.mjs
 *   node scripts/check-kcw-search-ready.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 기사방 = path.join(뿌리, 'content', 'kculturewire');
export const 주소 = 'https://www.kculturewire.com';

export function 제목있나(글) {
  const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(글 ?? '');
  return !!(m && m[1].trim().length > 0);
}
export function 설명있나(글) {
  const m = /<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i.exec(글 ?? '')
    ?? /<meta[^>]+content=["']([^"']*)["'][^>]*name=["']description["']/i.exec(글 ?? '');
  return !!(m && m[1].trim().length > 0);
}
/** ⛔ canonical 이 **자기 자신**을 가리켜야 한다. 남을 가리키면 그 편은 검색에서 사라진다 */
export function canonical맞나(글, 슬러그) {
  const m = /<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i.exec(글 ?? '');
  if (!m) return false;
  return m[1].replace(/\/$/, '') === `${주소}/article/${슬러그}`;
}

export function 네칸(글, 슬러그, 사이트맵글) {
  return {
    title: 제목있나(글),
    description: 설명있나(글),
    canonical: canonical맞나(글, 슬러그),
    sitemap: (사이트맵글 ?? '').includes(`/article/${슬러그}`),
  };
}
/** ⚠ 불리언으로 못박는다. `a && b` 는 마지막 «값»을 내서 0 이 섞이면 false 가 아니라 0 이 된다 */
export const 다찼나 = (칸) => Boolean(칸.title && 칸.description && 칸.canonical && 칸.sitemap);

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재 = (n, v, w) => { if (JSON.stringify(v) === JSON.stringify(w)) 통 += 1; else { 실 += 1; console.error(`  ⛔ ${n} → ${JSON.stringify(v)}`); } };
  재('제목을 찾는다', 제목있나('<title>Hi</title>'), true);
  재('⛔ 빈 제목은 없는 것', 제목있나('<title>  </title>'), false);
  재('⛔ 제목이 없으면 false', 제목있나('<html></html>'), false);
  재('설명을 찾는다', 설명있나('<meta name="description" content="x">'), true);
  재('순서가 바뀌어도 찾는다', 설명있나('<meta content="x" name="description">'), true);
  재('⛔ 빈 설명은 없는 것', 설명있나('<meta name="description" content=" ">'), false);
  재('canonical 이 자기면 참', canonical맞나(`<link rel="canonical" href="${주소}/article/abc">`, 'abc'), true);
  재('⛔⛔ 남을 가리키면 거짓', canonical맞나(`<link rel="canonical" href="${주소}/article/zzz">`, 'abc'), false);
  재('끝 슬래시는 같은 것으로 본다', canonical맞나(`<link rel="canonical" href="${주소}/article/abc/">`, 'abc'), true);
  재('사이트맵에 있으면 참', 네칸('', 'abc', '<loc>/article/abc</loc>').sitemap, true);
  재('넷 다 있어야 찬다', 다찼나({ title: 1, description: 1, canonical: 1, sitemap: 0 }), false);
  재('기사방이 있다', fs.existsSync(기사방), true);
  console.log(`밖에서 찾아질 준비를 보는 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  const 슬러그들 = fs.readdirSync(기사방).filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, ''));
  const sm = await fetch(`${주소}/sitemap.xml`);
  if (!sm.ok) { console.error(`⛔ 사이트맵을 못 받았다 (${sm.status}) — 재지 않는다`); process.exit(1); }
  const 사이트맵글 = await sm.text();

  const 찬것 = []; const 빈것 = []; const 못쟀다 = [];
  const 빠진칸 = { title: 0, description: 0, canonical: 0, sitemap: 0 };
  for (const s of 슬러그들) {
    let 글;
    try {
      const r = await fetch(`${주소}/article/${s}`);
      if (!r.ok) { 못쟀다.push({ s, why: `HTTP ${r.status}` }); continue; }
      글 = await r.text();
    } catch (e) { 못쟀다.push({ s, why: String(e.message ?? e) }); continue; }
    const 칸 = 네칸(글, s, 사이트맵글);
    if (다찼나(칸)) 찬것.push(s);
    else {
      빈것.push({ s, 칸 });
      for (const k of Object.keys(빠진칸)) if (!칸[k]) 빠진칸[k] += 1;
    }
  }

  console.log(`\n넷 다 갖춘 편  **${찬것.length} / ${슬러그들.length}**`);
  console.log(`⚠ 못 쟀다 ${못쟀다.length}편  (라이브에 없거나 못 받은 것 — 「빠진 편」으로 안 셈)`);
  for (const m of 못쟀다) console.log(`   ${m.why}  ${m.s}`);
  console.log('\n빠진 칸 — 종류별');
  for (const [k, n] of Object.entries(빠진칸)) console.log(`   ${k.padEnd(12)} ${n}편`);
  if (빈것.length) {
    console.log('\n안 찬 편 (앞 15)');
    for (const b of 빈것.slice(0, 15)) {
      console.log(`   ${Object.entries(b.칸).filter(([, v]) => !v).map(([k]) => k).join('·')}  ${b.s}`);
    }
  }
}
