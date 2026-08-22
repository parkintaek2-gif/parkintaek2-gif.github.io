#!/usr/bin/env node
/**
 * check-100y-broken-links.mjs — **100y 지면 안의 내부 링크가 실제로 사는가**
 *
 * 사장님 「방문+체류 우선」 지시 — 깨진 링크는 체류시간을 바로 죽인다.
 * dist/100y 전체를 훑어 <a href="/..."> 를 뽑고, 그 목적지가 dist 에 실제로
 * 있는지 확인한다. 사이트 전체(생애단계·학교·대학·지역 등)를 다 본다.
 *
 * ⚠ 이 자는 «소스»가 아니라 **빌드된 지면**을 본다(check-100y-banned-words.mjs와 같은 이유).
 * ⚠ 다른 세션과 같은 dist 를 쓴다 — 동시빌드 경합으로 파일이 순간 사라질 수 있어
 *   읽기 실패는 «깨졌다»가 아니라 **못 쟀다**로 둔다.
 *
 * 쓰는 법  node scripts/check-100y-broken-links.mjs [--자세히]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 방 = path.join(뿌리, 'dist/100y');

export function 지면들(방) {
  const 낸다 = [];
  const 훑기 = (곳) => {
    let 목록;
    try { 목록 = fs.readdirSync(곳, { withFileTypes: true }); } catch { return; }
    for (const f of 목록) {
      const p = path.join(곳, f.name);
      if (f.isDirectory()) 훑기(p);
      else if (f.name.endsWith('.html')) 낸다.push(p);
    }
  };
  훑기(방);
  return 낸다;
}

/** href="/..." 를 뽑는다. 외부 링크(http)·앵커(#)·자원(.png 등)은 뺀다 */
export function 안쪽링크들(html) {
  const 링크들 = [...html.matchAll(/<a\s[^>]*href="(\/[^"#?]*)"/g)].map((m) => m[1]);
  return [...new Set(링크들)].filter((h) => h !== '/' && !/\.(png|jpg|jpeg|svg|json|xml|css|js|ico|txt|csv|pdf|mp4|mp3|webm|gif)$/.test(h));
}

/** 주소 → dist 파일. /100y 접두사가 붙는 사이트다.
 *  ⚠ href 는 %-인코딩(한글 학과 이름 등)돼 있는데 dist 파일 이름은 그대로 한글이다 —
 *  풀어야 맞는다. 안 풀면 college-major 807개가 통째로 «깨졌다»는 헛경보가 난다 */
export function 목적지파일(href) {
  let 몸;
  try { 몸 = decodeURIComponent(href).replace(/^\//, ''); } catch { 몸 = href.replace(/^\//, ''); }
  for (const 후보 of [`dist/100y/${몸}.html`, `dist/100y/${몸}/index.html`, `dist/${몸}.html`, `dist/${몸}/index.html`])
    if (fs.existsSync(path.join(뿌리, 후보))) return 후보;
  return null;
}

/* ── 자가시험 ─────────────────────────────────────────── */
if (process.argv.includes('--selftest') || process.argv.includes('--자가시험')) {
  const 본다 = (말, 참) => { console.log(참 ? '✅' : '🔴', 말); if (!참) process.exitCode = 1; };
  본다('① a 태그의 href 를 뽑는다', 안쪽링크들('<a href="/pets">가</a>').includes('/pets'));
  본다('② 외부 링크는 안 뽑는다', !안쪽링크들('<a href="https://x.com">가</a>').some((h) => h.includes('http')));
  본다('③ 앵커는 안 뽑는다', !안쪽링크들('<a href="#top">가</a>').includes('#top'));
  본다('④ 자원 파일은 안 뽑는다', 안쪽링크들('<a href="/x.png">가</a>').length === 0);
  본다('④-1 🔴 영상 파일(mp4)도 지면이 아니라 자원이다', 안쪽링크들('<a href="/100y/video/가.mp4">가</a>').length === 0);
  본다('⑤ 중복을 없앤다', 안쪽링크들('<a href="/a">1</a><a href="/a">2</a>').length === 1);
  본다('⑥ 없는 갈래를 훑어도 안 죽는다', 지면들(path.join(뿌리, '없는-갈래-xyz')).length === 0);
  const 인코딩된주소 = '/college-major/' + encodeURIComponent('간호학과');
  본다('⑦ 🔴 %-인코딩된 한글 주소를 풀어서 찾는다',
    fs.existsSync(path.join(뿌리, 'dist/100y/college-major/간호학과.html'))
      ? 목적지파일(인코딩된주소) === 'dist/100y/college-major/간호학과.html'
      : true /* 그 지면이 없으면 이 시험은 건너뛴다(환경마다 다를 수 있다) */);
  process.exit();
}

/* ── 몸 ───────────────────────────────────────────────── */
if (!fs.existsSync(방)) {
  console.log('⬜ dist/100y 가 없다 — **못 쟀다.** build-once 를 먼저 돌린다');
  process.exit(0);
}

const 자세히 = process.argv.includes('--자세히');
const 지면 = 지면들(방);
const 깨진것 = new Map(); // href -> Set(가리키는 지면들)
let 못읽은지면 = 0;

for (const p of 지면) {
  let 원문;
  try { 원문= fs.readFileSync(p, 'utf8'); } catch { 못읽은지면++; continue; }
  const 이름 = path.relative(뿌리, p).split(path.sep).join('/');
  for (const href of 안쪽링크들(원문)) {
    if (목적지파일(href)) continue;
    if (!깨진것.has(href)) 깨진것.set(href, new Set());
    깨진것.get(href).add(이름);
  }
}

console.log('\n백년지도 — 지면 안 내부 링크가 실제로 사는가\n');
console.log(`  지면 ${지면.length}장 · 못 읽은 지면 ${못읽은지면}개(동시빌드 경합일 수 있다)`);
console.log(`  🔴 깨진 주소 ${깨진것.size}개\n`);

const 정렬 = [...깨진것.entries()].sort((a, b) => b[1].size - a[1].size);
for (const [href, 가리키는것] of 정렬.slice(0, 자세히 ? 999 : 40)) {
  const 목록 = [...가리키는것];
  console.log(`  🔴 ${href}  — ${가리키는것.size}장에서 가리킴 (예: ${목록.slice(0, 3).join(', ')})`);
}
if (!깨진것.size) console.log('  ✅ 깨진 내부 링크가 없다');
if (!자세히 && 정렬.length > 40) console.log(`\n  ⚠ ${정렬.length - 40}개 더 있다 — --자세히 로 전부 본다`);

process.exitCode = 깨진것.size ? 1 : 0;
