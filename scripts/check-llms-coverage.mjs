#!/usr/bin/env node
/**
 * check-llms-coverage.mjs — public/llms.txt(AI 인용 관문)에 발행된 기사가 다 들어갔는가.
 *
 * ── 왜 (2026-09-02, GEO 지시 [5번→6번] ①) ──────────────────────────────
 * 「llms.txt 55줄 — 큰 지면이 다 들어갔는지 세어 본다. 안 넣을 것은 «봐줄것»에 적는다」.
 * 재 보니 발행 기사 109편 중 llms.txt에는 33편만 있었다(2026-09-02). 사람이 매번 세면
 * 잊는다 — 그래서 검사로 둔다.
 *
 * ⛔ 이 스크립트는 llms.txt를 고치지 않는다(사람이 문장을 다듬어 넣는 자리라 자동 갱신 안 함).
 *   빠진 목록만 낸다. 새 기사를 낼 때마다 이 검사를 돌려 빠짐이 쌓이지 않게 한다.
 *
 * 쓰는 법
 *   node scripts/check-llms-coverage.mjs
 *   node scripts/check-llms-coverage.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 기사폴더 = path.join(뿌리, 'content/articles');
const llms경로 = path.join(뿌리, 'public/llms.txt');

/** frontmatter의 draft·title·category만 얕게 읽는다(check-frontmatter.mjs와 같은 이유) */
export function 앞말읽기(원문) {
  const m = 원문.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const 값 = {};
  for (const 줄 of m[1].split(/\r?\n/)) {
    const kv = 줄.match(/^([a-zA-Z]+):\s*(.*)$/);
    if (!kv) continue;
    const [, k, raw] = kv;
    const q = raw.match(/^"([\s\S]*)"\s*$/) || raw.match(/^'([\s\S]*)'\s*$/);
    if (q) 값[k] = q[1];
    else if (raw && !raw.startsWith('[') && !raw.startsWith('-')) 값[k] = raw.trim();
  }
  return 값;
}

/** 발행(draft 아닌) 기사 slug 목록 */
export function 발행기사목록(폴더 = 기사폴더) {
  if (!fs.existsSync(폴더)) return [];
  return fs.readdirSync(폴더)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const slug = f.replace(/\.md$/, '');
      const 원문 = fs.readFileSync(path.join(폴더, f), 'utf8');
      const 값 = 앞말읽기(원문);
      return { slug, ...값 };
    })
    .filter((a) => a.draft !== 'true');
}

/** llms.txt 안에 걸린 article slug 집합 */
export function llms에걸린slug(llms원문) {
  const 걸린 = new Set();
  for (const m of llms원문.matchAll(/\/article\/([a-z0-9-]+)/gi)) 걸린.add(m[1]);
  return 걸린;
}

/** 빠진 기사 목록(발행됐지만 llms.txt에 안 걸린 것) */
export function 빠진것(기사들, 걸린) {
  return 기사들.filter((a) => !걸린.has(a.slug));
}

/* 🔴🔴 [2026-10-13 18:0x · 5번] **가드가 없어서 남의 시험을 가로챘다.**
   ───────────────────────────────────────────────────────────────────────
   `메운다-llms에-빠진-기사.mjs` 가 이 파일에서 세 함수를 가져다 쓰는데,
   그쪽에서 `--자가시험` 을 치면 **import 하는 순간 이 블록이 먼저 돌고 exit** 했다.
   화면에는 「✅ 자가시험 통과 6」이 찍혔다 — 그런데 그 6개는 **이 파일 것**이고
   부르는 쪽 시험 17개는 **한 줄도 안 돌았다.**
   ⭐⭐ 자가 보여 주는 것과 재는 것이 다르면 그 자는 사람을 속인다 — 스물두 번째다.
   ⚠ 같은 흠을 `collect-jbnews-sports-articles.mjs` 에서 이미 겪고 고쳐 놓았다
     (그 파일 1390줄 둘레). **그때 이 파일까지 따라오지 않았다** —
     ⭐ 하나를 고치면 그 «뜻»이 쓰이는 곳까지 따라간다. 그러지 못한 자리다.
   ⇒ 아래 134줄과 같은 꼴로, 내가 직접 불렸을 때만 돈다. */
const 내가진입점 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가진입점 && process.argv.includes('--자가시험')) {
  let 통과 = 0, 실패 = 0;
  const 검 = (m, ok) => { if (ok) 통과++; else { 실패++; console.log('  ❌', m); } };

  const 걸린 = llms에걸린slug('- [x](https://seoulmarkets.com/article/foo-bar): 설명');
  검('article 링크에서 slug를 뽑는다', 걸린.has('foo-bar'));
  검('없는 건 안 걸림', !걸린.has('baz'));

  const 기사들 = [{ slug: 'a', draft: 'false' }, { slug: 'b', draft: 'false' }];
  const 빠짐 = 빠진것(기사들, new Set(['a']));
  검('걸린 것은 빠진 것에서 뺀다', !빠짐.some((x) => x.slug === 'a'));
  검('안 걸린 것은 빠진 것에 남는다', 빠짐.some((x) => x.slug === 'b'));

  const 값 = 앞말읽기('---\ntitle: "제목"\ndraft: true\n---\n본문');
  검('draft:true를 읽는다', 값.draft === 'true');
  검('title을 읽는다', 값.title === '제목');

  console.log(실패 === 0 ? `✅ 자가시험 — 통과 ${통과} · 실패 0` : `❌ 자가시험 — 통과 ${통과} · 실패 ${실패}`);
  process.exit(실패 === 0 ? 0 : 1);
}

/* 🔴 [2026-10-13 18:0x] 본체도 import 하면 돌아 **남의 화면에 글을 쏟았다.**
   ⛔ 「시험만」이 아니라 **파일 전체**에 가드를 건다 — 함수를 가져다 쓰는 쪽은
     이 자의 화면 글을 바라지 않는다. */
if (내가진입점) {
const 기사들 = 발행기사목록();
const llms원문 = fs.existsSync(llms경로) ? fs.readFileSync(llms경로, 'utf8') : '';
const 걸린 = llms에걸린slug(llms원문);
const 빠짐 = 빠진것(기사들, 걸린);

console.log(`■ llms.txt 인용 관문 커버리지 — 발행 ${기사들.length}편 중 ${걸린.size}편 걸림 · ${빠짐.length}편 빠짐\n`);
if (빠짐.length) {
  const 갈래별 = {};
  for (const a of 빠짐) (갈래별[a.category ?? '(미상)'] ??= []).push(a);
  for (const [cat, 목록] of Object.entries(갈래별)) {
    console.log(`  ${cat} (${목록.length})`);
    for (const a of 목록) console.log(`    · ${a.slug} — ${a.title ?? '(제목없음)'}`);
  }
  console.log('\n⚠ 위 목록은 `node scripts/메운다-llms에-빠진-기사.mjs --적는다` 로 메운다.');
  console.log('  ⭐ [2026-10-13] 그 전에는 「사람이 갈라 넣는다」였고, 그래서 76편이 쌓였다.');
  console.log('    짚는 자만 있고 메우는 자가 없으면 그 규칙은 아직 사람 «머리»에 있는 것이다.');
} else {
  console.log('✅ 빠진 것 없음.');
}
}  /* ← 내가진입점 블록을 여기서 닫는다. 아래 export 는 최상위여야 한다
      ⚠ [2026-10-13] 블록을 파일 끝까지 끌고 갔다가 `export` 가 블록 안에 들어가 터졌다.
        ⭐ 가드를 걸 때는 «export 가 어디 있는지»부터 본다. */

/* ────────────────────────────────────────────────────────────────────────
 * 🔴 [2026-09-16] **상품 지면도 잰다.** 기사만 재고 있었다.
 *
 * 사장님이 「GEO 를 검색보다 앞에 둔다」에 ok 하셨다. 근거는 실측이다 —
 *   12일(9/2~9/13) GA4 326명 중 AI Assistant 80명(25%) · Organic Search 21명(6%),
 *   같은 기간 GSC 클릭은 «1회». 검색이 아니라 AI 가 손님을 데려온다.
 *
 * 그런데 그날 재 보니 **데이터 상품 지면 17장이 llms.txt 에 하나도 없었고
 * UAE 언급이 0**이었다. 우리를 데려오는 유일한 길이 «우리가 무엇을 파는지 몰랐다».
 *
 * ⛔ 기사만 세는 자는 그것을 못 잡는다. 파는 것은 기사가 아니라 지면이기 때문이다.
 * ✅ 그래서 src/pages/data/*.astro 를 세어 llms.txt 와 맞댄다.
 *   새 상품 지면을 내고 llms.txt 에 안 올리면 여기서 걸린다.
 */
export function 상품지면목록(폴더 = 'src/pages/data') {
  const 뿌 = path.join(뿌리 ?? process.cwd(), 폴더);
  let 것 = [];
  try { 것 = fs.readdirSync(뿌); } catch { return []; }
  return 것
    .filter((f) => f.endsWith('.astro') && f !== 'index.astro')
    .map((f) => f.replace(/\.astro$/, ''));
}

export function 상품빠진것(지면들, llms원문) {
  const 글 = String(llms원문 ?? '');
  return 지면들.filter((s) => !글.includes('/data/' + s));
}

/* ⚠ [2026-10-13] `process.argv[1]?.endsWith(...)` 로 자기 이름을 보고 있었다.
   ⛔ 그 꼴은 **부르는 쪽 파일 이름이 우연히 같으면** 또 돈다. 진입점은 경로로 잰다. */
if (process.argv.includes('--상품') || 내가진입점) {
  const 지면 = 상품지면목록();
  const 글 = (() => { try { return fs.readFileSync(path.join(뿌리 ?? process.cwd(), 'public/llms.txt'), 'utf8'); } catch { return ''; } })();
  const 빠진 = 상품빠진것(지면, 글);
  console.log(`\n■ 상품 지면 커버리지 — ${지면.length}장 중 ${지면.length - 빠진.length}장 걸림 · ${빠진.length}장 빠짐`);
  if (빠진.length) {
    for (const s of 빠진) console.log(`  🔴 /data/${s} — llms.txt 에 없다`);
    console.log('  ⛔ AI 가 방문의 4분의 1을 데려온다. 거기 없으면 파는 것이 안 보인다.');
  } else {
    console.log('  ✅ 상품 지면이 다 걸려 있다.');
  }
}
