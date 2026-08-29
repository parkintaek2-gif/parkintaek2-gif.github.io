#!/usr/bin/env node
/**
 * check-seoulmarkets-broken-links.mjs — **SeoulMarkets 지면 안의 내부 링크가 실제로 사는가**
 *
 * ── 왜 (2026-08-29, 5번 지적: 「목록에 있다 ≠ 지면이 있다」는 어느 유닛에서나 난다) ──
 * 지면을 안 내거나(draft:true), 슬러그를 손으로 만들거나, 상위 N만 생성한 템플릿(예: /trade
 * 상위 60국)을 가리키면 «목록엔 있는데 지면이 없는» 링크가 생긴다. 나(6번)는 나라별 61장·
 * 기사 클러스터 링크가 많아 특히 위험하다. 깨진 내부링크는 크롤·순위를 갉는다(내 병목).
 * 3번(check-100y)·5번(check-kcw)엔 있었는데 6번엔 없어서 짓는다.
 *
 * ── 재는 것 ────────────────────────────────────────────
 * SeoulMarkets 소유 지면(dist 루트의 *.html + article/·trade/·tag/)만 훑어 `<a href="/...">`를
 * 뽑고, 그 목적지가 dist 루트에 실제로 있는지 본다. 없으면 «깨진 링크».
 * ⚠ wikitip(KCW)·100y·esports 는 주소 다시쓰기 규칙이 달라 **제외**한다(섞으면 전부 헛경보).
 * ⚠ 자원(mp4·png·csv…)·앵커·물음표·외부링크는 지면이 아니라 뺀다.
 * ⚠ 읽기 실패·빌드 도중은 «깨졌다»가 아니라 «못 쟀다»로 센다(0으로 안 채운다).
 *
 * 쓰는 법  node scripts/check-seoulmarkets-broken-links.mjs [--자세히]
 *          node scripts/check-seoulmarkets-broken-links.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(뿌리, 'dist');
// SeoulMarkets 소유가 아닌 갈래(같은 dist 를 쓰는 다른 사이트) — 링크 목적지에서 뺀다.
// ⚠ esports 는 SeoulMarkets 것(src/pages/esports.astro)이라 여기 넣지 않는다.
const 남의갈래 = new Set(['wikitip', '100y']);
// 다른 사이트의 «홈»이 dist 루트 .html 로 떨어진다(dist/100y.html·dist/wikitip.html) — 스캔에서 뺀다.
const 남의홈 = new Set(['100y.html', 'wikitip.html']);
// 정적 지면이 아니라 «서버가 동적으로 서빙»하는 네임스페이스 — dist 에 없지만 라이브 200 이다.
// /v1/* = 데이터 API(/api 페이지가 문서로 링크). 2026-08-29 라이브 확인: /v1/countries·meta·institutions·hs/8542 모두 200.
const 동적네임 = new Set(['v1']);

export const 자원끝 = /\.(png|jpg|jpeg|webp|avif|svg|json|xml|css|js|mjs|ico|txt|csv|tsv|pdf|mp4|mp3|webm|gif|woff2?|ttf|zip)$/i;

/** SeoulMarkets 지면만 모은다: dist 루트 *.html + article/·trade/·tag/ 아래 .html */
export function 지면들(dist = DIST) {
  const 낸다 = [];
  let 루트;
  try { 루트 = fs.readdirSync(dist, { withFileTypes: true }); } catch { return []; }
  // 루트 바로 아래의 *.html (index·fx·macro·about … = SeoulMarkets 것) — 남의 사이트 홈은 뺀다
  for (const f of 루트) if (f.isFile() && f.name.endsWith('.html') && !남의홈.has(f.name)) 낸다.push(path.join(dist, f.name));
  // SeoulMarkets 하위 갈래만 재귀
  const 훑기 = (곳) => {
    let 목록; try { 목록 = fs.readdirSync(곳, { withFileTypes: true }); } catch { return; }
    for (const f of 목록) {
      const p = path.join(곳, f.name);
      if (f.isDirectory()) 훑기(p);
      else if (f.name.endsWith('.html')) 낸다.push(p);
    }
  };
  for (const 갈래 of ['article', 'trade', 'tag']) 훑기(path.join(dist, 갈래));
  return 낸다;
}

export function 안쪽링크들(html) {
  const 링크들 = [...String(html).matchAll(/<a\s[^>]*href="(\/[^"#?]*)"/g)].map((m) => m[1]);
  return [...new Set(링크들)].filter((h) => {
    if (h === '/' || 자원끝.test(h)) return false;
    const 첫 = h.replace(/^\//, '').split('/')[0];
    return !남의갈래.has(첫) && !동적네임.has(첫);
  });
}

/** 주소 → dist 파일. SeoulMarkets 는 루트 그대로: /article/x → dist/article/x.html */
export function 후보들(href) {
  let 몸;
  try { 몸 = decodeURIComponent(href).replace(/^\//, ''); } catch { 몸 = href.replace(/^\//, ''); }
  return [`dist/${몸}.html`, `dist/${몸}/index.html`];
}

export function 목적지파일(href, 있나 = (p) => fs.existsSync(path.join(뿌리, p))) {
  for (const 후보 of 후보들(href)) if (있나(후보)) return 후보;
  return null;
}

export const 헛경보몫 = 0.05;
export function 빌드중인가(깨진수, 지면수, 문턱 = 헛경보몫) {
  if (!Number.isFinite(깨진수) || !Number.isFinite(지면수) || 지면수 <= 0) return false;
  return 깨진수 / 지면수 > 문턱;
}

if (process.argv.includes('--selftest') || process.argv.includes('--자가시험')) {
  let 셈 = 0; const 본다 = (말, 참) => { 셈 += 1; console.log(참 ? '✅' : '🔴', 말); if (!참) process.exitCode = 1; };
  본다('① a href 뽑기', 안쪽링크들('<a href="/article/x">x</a>').includes('/article/x'));
  본다('② 외부링크 제외', 안쪽링크들('<a href="https://x.com">x</a>').length === 0);
  본다('③ 앵커 제외', 안쪽링크들('<a href="#top">x</a>').length === 0);
  본다('④ 물음표 제외', 안쪽링크들('<a href="/a?b=1">x</a>').length === 0);
  본다('⑤ 자원(png) 제외', 안쪽링크들('<a href="/og/x.png">x</a>').length === 0);
  본다('⑤-1 CSV 자원 제외(무료 데이터 링크)', 안쪽링크들('<a href="/data/korea-trade-balance.csv">x</a>').length === 0);
  본다('⑥ 중복 안 셈', 안쪽링크들('<a href="/a">1</a><a href="/a">2</a>').length === 1);
  본다('⑦ 루트(/) 제외', 안쪽링크들('<a href="/">h</a>').length === 0);
  본다('⑧ 🔴 남의 갈래(/wikitip/…) 제외 — 섞으면 헛경보', 안쪽링크들('<a href="/wikitip/person/iu">x</a>').length === 0);
  본다('⑧-1 남의 갈래(/100y/…) 제외', 안쪽링크들('<a href="/100y/age">x</a>').length === 0);
  본다('⑧-2 🔴 동적 API(/v1/…) 제외 — dist 에 없지만 라이브 200', 안쪽링크들('<a href="/v1/countries">x</a>').length === 0);
  const 가짜 = new Set(['dist/article/korea-real-wages-flat-since-2021.html', 'dist/trade/vietnam.html', 'dist/fx.html']);
  const 있나 = (p) => 가짜.has(p);
  본다('⑨ 🔴 /article/x → dist/article/x.html', 목적지파일('/article/korea-real-wages-flat-since-2021', 있나) === 'dist/article/korea-real-wages-flat-since-2021.html');
  본다('⑩ /trade/vietnam → dist/trade/vietnam.html', 목적지파일('/trade/vietnam', 있나) === 'dist/trade/vietnam.html');
  본다('⑪ 갈래지면 /fx → dist/fx.html', 목적지파일('/fx', 있나) === 'dist/fx.html');
  본다('⑫ 없는 지면은 못 찾는다', 목적지파일('/trade/atlantis', 있나) === null);
  본다('⑬ 빌드 도중 큰 몫은 못쟀다', 빌드중인가(400, 500) === true);
  본다('⑭ 몇 개는 진짜 결함', 빌드중인가(3, 7000) === false);
  본다('⑮ %-인코딩 풀어 찾기', 목적지파일('/tag/' + encodeURIComponent('무역'), (p) => p === 'dist/tag/무역.html') === 'dist/tag/무역.html');
  console.log(`\n${process.exitCode ? '❌' : '✅'} check-seoulmarkets-broken-links 자가시험 (${셈})`);
  process.exit();
}

if (!fs.existsSync(DIST)) { console.log('⬜ dist 가 없다 — **못 쟀다.** npm run build 를 먼저 돌린다'); process.exit(0); }
const 자세히 = process.argv.includes('--자세히');
const 지면 = 지면들();
if (!지면.length) { console.log('⬜ SeoulMarkets 지면이 dist 에 없다 — **못 쟀다.** 빌드 먼저'); process.exit(0); }
const 깨진것 = new Map(); let 못읽은 = 0;
for (const p of 지면) {
  let 원문; try { 원문 = fs.readFileSync(p, 'utf8'); } catch { 못읽은 += 1; continue; }
  const 이름 = path.relative(뿌리, p).split(path.sep).join('/');
  for (const href of 안쪽링크들(원문)) {
    if (목적지파일(href)) continue;
    if (!깨진것.has(href)) 깨진것.set(href, new Set());
    깨진것.get(href).add(이름);
  }
}
console.log('\nSeoulMarkets — 지면 안 내부 링크가 실제로 사는가\n');
console.log(`  지면 ${지면.length.toLocaleString('ko-KR')}장` + (못읽은 ? ` · ⬜ 못 읽은 ${못읽은}장` : ''));
console.log(`  ${깨진것.size ? '🔴' : '✅'} 깨진 주소 ${깨진것.size}개\n`);
const 정렬 = [...깨진것.entries()].sort((a, b) => b[1].size - a[1].size);
for (const [href, 가리키는것] of 정렬.slice(0, 자세히 ? 9999 : 40))
  console.log(`  🔴 ${href}  — ${가리키는것.size}장 (예: ${[...가리키는것].slice(0, 3).join(', ')})`);
if (!깨진것.size) console.log('  ✅ 깨진 내부 링크가 없다');
if (빌드중인가(깨진것.size, 지면.length)) {
  console.log(`\n⬜ **못 쟀을 수 있다** — 깨진 몫 ${(깨진것.size / 지면.length * 100).toFixed(0)}%. dist 를 다시 짓는 중이면 헛경보다. 빌드 끝나고 다시 잰다.`);
  process.exitCode = 2;
} else process.exitCode = 깨진것.size ? 1 : 0;
