#!/usr/bin/env node
/**
 * 잰다-들어오는링크가-없는-지면.mjs
 *   — **빌드 결과를 통째로 훑어 「아무 지면도 가리키지 않는 지면」을 센다.**
 *
 * ── 🔴 왜 (2026-10-22 · 5번) ────────────────────────────────────────
 * 같은 날 KLifeMap 에서 재 보니 글 2,580장 가운데 **194장**이 아무에게도
 * 안 가리켜지고 있었다. 사이트맵에만 있고 크롤러가 닿을 길이 없는 지면이다.
 * K Culture Wire 도 2026-08-22 에 108편 중 25편이 그랬다.
 * ⇒ 백년지도·SeoulMarkets 는 어떤지 **재 보고** 안다. 짐작하지 않는다.
 *
 * ⛔ 「나가는 링크가 많다」를 「모든 지면에 길이 났다」로 읽지 않는다. 다른 수다.
 *
 * ⚠ 빌드 폴더 구조는 «주소»가 아니다 — 2026-10-22 에 `dist/100y/…` 를 `/100y/…` 로
 *   읽어 두 번 거짓 0 을 냈다. 그래서 이 자는 **파일 경로를 주소로 바꿔** 맞춘다.
 *
 * 🔴🔴 [2026-10-22 13:3x] **이 주석을 적어 놓고 내가 바로 또 걸렸다.**
 *   `dist` 를 통째로 재니 「51%가 막혔다」가 나왔다. 거짓이다 —
 *   이 한 폴더에 **세 사이트**가 들어 있고 저마다 도메인이 다르다.
 * ```
 *   dist/100y/…      →  100yearmap.com/…        링크는 `/age` 로 걸린다
 *   dist/wikitip/…   →  www.kculturewire.com/…  링크는 `/article/…` 로 걸린다
 *   그 밖             →  seoulmarkets.com/…
 * ```
 *   ⇒ 폴더 접두사를 **떼고** 재야 링크와 주소가 맞는다.
 *   ⛔ 적어 두는 것과 지키는 것은 다르다. 그래서 자에 박는다 —
 *     사이트를 안 고르면 **아예 안 돈다.**
 *
 * 쓰는 법
 *   node scripts/잰다-들어오는링크가-없는-지면.mjs dist --사이트 100y
 *   node scripts/잰다-들어오는링크가-없는-지면.mjs dist --사이트 wikitip --보기 20
 *   node scripts/잰다-들어오는링크가-없는-지면.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';

/** 파일 경로를 손님이 여는 주소로 바꾼다 — `a/b.html` → `/a/b`, `a/index.html` → `/a` */
export function 주소로(뿌리, 길) {
  let s = String(길 ?? '').slice(String(뿌리 ?? '').length).replace(/\\/g, '/');
  if (!s.startsWith('/')) s = '/' + s;
  s = s.replace(/\/index\.html?$/i, '') || '/';
  s = s.replace(/\.html?$/i, '');
  return s === '' ? '/' : s;
}

/** 글에서 우리 지면으로 가는 주소만 뽑는다 */
export function 링크뽑기(글) {
  const 난것 = new Set();
  for (const m of String(글 ?? '').matchAll(/href="([^"#?]+)/g)) {
    let u = m[1];
    if (!u.startsWith('/')) continue;                  /* 바깥 주소·상대 주소는 안 센다 */
    if (/\.(css|js|png|jpg|jpeg|svg|webp|ico|xml|json|txt|webmanifest|pdf|md)$/i.test(u)) continue;
    u = u.replace(/\/index\.html?$/i, '').replace(/\.html?$/i, '');
    u = u.replace(/\/+$/, '') || '/';
    난것.add(u);
  }
  return [...난것];
}

if (process.argv.includes('--자가시험')) {
  let 통 = 0; const 탈 = [];
  const 본다 = (이름, 참) => { if (참) 통 += 1; else { 탈.push(이름); console.log('🔴 ' + 이름); } };

  본다('index.html 은 폴더 주소가 된다', 주소로('dist', 'dist/100y/index.html') === '/100y');
  본다('낱장은 확장자를 뗀다', 주소로('dist', 'dist/100y/age.html') === '/100y/age');
  본다('맨 위 index 는 /', 주소로('dist', 'dist/index.html') === '/');
  본다('역슬래시도 센다', 주소로('dist', 'dist\\a\\b.html') === '/a/b');

  본다('우리 주소만 뽑는다',
    링크뽑기('<a href="/a">x</a><a href="https://남.com/b">y</a><a href="c">z</a>').join() === '/a');
  본다('확장자가 붙은 것은 같은 주소로 모은다',
    링크뽑기('<a href="/a.html">x</a><a href="/a">y</a>').join() === '/a');
  본다('index.html 도 같은 주소로', 링크뽑기('<a href="/a/index.html">x</a>').join() === '/a');
  본다('⛔ 자료 파일은 안 센다',
    링크뽑기('<a href="/x.css">a</a><a href="/y.png">b</a><a href="/z.xml">c</a>').length === 0);
  본다('⛔ 토막표·물음표는 떼고 센다',
    링크뽑기('<a href="/a#b">x</a><a href="/a?c=1">y</a>').join() === '/a');
  본다('⛔ 빈 것에 안 터진다', 링크뽑기(null).length === 0 && 주소로('', null) === '/');

  console.log(탈.length ? `\n🔴 자가시험 ${탈.length}건 탈` : `\n✅ 자가시험 ${통} 통과`);
  process.exit(탈.length ? 1 : 0);
}

const 받은뿌리 = process.argv[2];
if (!받은뿌리 || !fs.existsSync(받은뿌리)) {
  console.error('⛔ 쓰는 법: node scripts/잰다-들어오는링크가-없는-지면.mjs <빌드폴더> --사이트 <100y|wikitip|seoulmarkets>');
  process.exit(1);
}

/* 🔴 사이트를 안 고르면 아예 안 돈다 — 한 폴더에 세 도메인이 섞여 있다 */
const 사이트자리 = process.argv.indexOf('--사이트');
const 사이트 = 사이트자리 >= 0 ? process.argv[사이트자리 + 1] : null;
if (!사이트) {
  console.error('\n⛔ `--사이트` 를 반드시 준다. 이 폴더에는 세 도메인이 섞여 있다 —');
  console.error('   100y        → 100yearmap.com      (dist/100y 아래, 접두사를 뗀다)');
  console.error('   wikitip     → www.kculturewire.com (dist/wikitip 아래, 접두사를 뗀다)');
  console.error('   seoulmarkets → seoulmarkets.com    (dist 바로 아래, 위 둘을 뺀다)');
  console.error('\n⚠ 통째로 재면 「51%가 막혔다」 같은 «거짓 수»가 나온다. 실제로 그랬다(2026-10-22).\n');
  process.exit(1);
}
const 알려진사이트 = ['100y', 'wikitip', 'seoulmarkets'];
if (!알려진사이트.includes(사이트)) {
  console.error(`⛔ 모르는 사이트다 — ${사이트}. ${알려진사이트.join(' · ')} 가운데 고른다`);
  process.exit(1);
}
/* 100y·wikitip 은 그 폴더가 곧 도메인 뿌리다. seoulmarkets 는 dist 자체가 뿌리다 */
const 뿌리 = 사이트 === 'seoulmarkets' ? 받은뿌리 : path.join(받은뿌리, 사이트);
if (!fs.existsSync(뿌리)) { console.error(`⛔ ${뿌리} 가 없다`); process.exit(1); }
/* seoulmarkets 를 잴 때는 남의 사이트 폴더를 뺀다 */
const 뺄폴더 = 사이트 === 'seoulmarkets' ? ['100y', 'wikitip'] : [];
const 보기수 = (() => {
  const i = process.argv.indexOf('--보기');
  return i >= 0 ? Number(process.argv[i + 1]) || 12 : 12;
})();

const 파일들 = [];
(function 훑기(d) {
  let 목록; try { 목록 = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
  for (const e of 목록) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) {
      if (['_astro', 'node_modules', ...뺄폴더].includes(e.name)) continue;
      훑기(p); continue;
    }
    if (/\.html?$/i.test(e.name)) 파일들.push(p);
  }
}(뿌리));

const 있는주소 = new Set(파일들.map((p) => 주소로(뿌리, p)));
const 들어오는수 = new Map();
let 나가는합 = 0;

for (const p of 파일들) {
  let 글; try { 글 = fs.readFileSync(p, 'utf8'); } catch { continue; }
  const 나 = 주소로(뿌리, p);
  for (const u of 링크뽑기(글)) {
    if (u === 나) continue;                  /* 자기 자신은 안 센다 */
    if (!있는주소.has(u)) continue;          /* 없는 지면은 안 센다 */
    들어오는수.set(u, (들어오는수.get(u) || 0) + 1);
    나가는합 += 1;
  }
}

const 막힌것 = [...있는주소].filter((u) => !들어오는수.has(u) && u !== '/');
const 수들 = [...들어오는수.values()];
console.log(`\n■ ${뿌리} — 지면 ${있는주소.size}장`);
console.log(`   나가는 링크 합계      ${나가는합}개 (지면당 ${(나가는합 / Math.max(있는주소.size, 1)).toFixed(1)}개)`);
console.log(`   들어오는 링크가 있는 지면 ${들어오는수.size}장`);
console.log(`   ${막힌것.length ? '🔴' : '✅'} 아무도 안 가리키는 지면 ${막힌것.length}장`
  + ` (${Math.round((막힌것.length / Math.max(있는주소.size, 1)) * 100)}%)`);
console.log(`   한 지면이 최다        ${수들.length ? Math.max(...수들) : 0}번 가리켜진다`);
if (막힌것.length) {
  console.log('   보기 —');
  for (const u of 막힌것.slice(0, 보기수)) console.log(`     ${u}`);
  if (막힌것.length > 보기수) console.log(`     … 그 밖 ${막힌것.length - 보기수}장`);
}
console.log('\n⚠ 이 자는 재기만 한다. ⛔ 「나가는 링크가 많다」를 「길이 났다」로 읽지 않는다.');
