#!/usr/bin/env node
/**
 * check-kcw-article-backlinks.mjs — **기사가 가리킨 지면이 그 기사를 «받고 있나».**
 *
 * ── 🔴 왜 만드나 (2026-08-30 18:2x · 5번) ──────────────────
 * 오늘 낸 지면 `/what-to-watch-after` 가 기사 하나를 **조용히 안 걸고 있었다.**
 * 기사는 frontmatter 에 `pages: ["/what-to-watch-after"]` 라고 제대로 적어 뒀는데,
 * **지면 쪽에 «받는 자리»(`<KcwRelatedArticles>`)가 없었다.**
 *
 * ⚠ 이 구조 자체는 옳다 — 관계를 «기사»가 들고 있고 지면은 읽기만 한다(2026-08-07 에 정한 것).
 *   그런데 그 대가로 **지면이 조각 하나를 빠뜨리면 아무 데서도 안 터진다.**
 *   기사는 자기가 걸렸다고 믿고, 지면은 그런 기사가 있는 줄 모른다.
 * 🔴 나는 그것을 **라이브를 눈으로 훑어보다** 잡았다. 그건 자가 할 일이다.
 *
 * ── ⛔ 이 자가 지키는 것 ─────────────────────────────────────
 * ⛔ **없는 지면을 가리킨 기사**와 **받는 자리가 없는 지면**을 «갈라서» 센다. 약이 다르다.
 * ⛔ 못 읽은 것은 「없다」로 안 친다 — 못 읽었다고 적는다.
 * ⚠ 낱장 지면(`/title/x`)은 안 본다. 그쪽은 조각이 아니라 표로 잇는다.
 *
 * 쓰는 법
 *   node scripts/check-kcw-article-backlinks.mjs --자가시험
 *   node scripts/check-kcw-article-backlinks.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 기사방 = path.join(뿌리, 'content/kculturewire');
const 지면방 = path.join(뿌리, 'src/pages/wikitip');
/*
 * 🔴 [2026-08-30] 이 자가 처음에 `/community` 를 «없는 지면»이라고 했다. **살아 있는데도.**
 *   우리 지면은 두 길로 난다 — ① Astro 길(`src/pages/wikitip/…astro`)
 *   ② 미리 지어 둔 HTML(`public/wikitip/…/index.html`). `/community` 는 뒤쪽이다.
 * ⛔ 한쪽만 보고 「없다」고 말하면, 고칠 것이 없는데 사람이 고치러 간다.
 * ⚠ 미리 지어 둔 지면에는 조각을 «못 넣는다» — 그래서 「안 받는다」로도 안 센다. 따로 적는다.
 */
const 굳은지면방 = path.join(뿌리, 'public/wikitip');

export const 받는조각 = 'KcwRelatedArticles';

/** frontmatter 에서 `pages:` 목록을 뽑는다. ⛔ 못 읽으면 null — 빈 배열이 아니다 */
export function 가리킨지면(글) {
  const s = String(글 ?? '');
  const m = s.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const 앞 = m[1];
  /*
   * ⚠ 여기서 두 번 걸렸다. 둘 다 자가시험이 잡았다 —
   *   ① `\s*$` 를 쓰면 여러줄 모드에서 «줄바꿈까지» 먹어 첫 항목을 삼킨다.
   *      ⇒ 그 줄 안의 빈칸(` \t`)만 허용한다.
   *   ② 🔴 `\Z` 는 **자바스크립트 정규식에 없다.** 글자 「Z」로 읽힌다.
   *      ⇒ 입력 끝은 `(?![\s\S])` 로 쓴다.
   *      ⛔ 다른 말(펄·파이썬)에서 되던 것을 그대로 옮기지 않는다.
   */
  const p = 앞.match(/^pages:[ \t]*\r?\n([\s\S]*?)(?=^\S|(?![\s\S]))/m);
  if (!p) return [];                       /* pages 가 없는 것은 «빈 것»이 맞다 */
  return [...p[1].matchAll(/^\s*-\s*["']?([^"'\r\n]+)["']?\s*$/gm)].map((x) => x[1].trim());
}

/** 지면 주소 → 파일 이름 후보. ⛔ 짐작 하나만 두지 않는다 */
export function 지면파일후보(길) {
  const s = String(길 ?? '').replace(/^\//, '').replace(/\/$/, '');
  if (!s) return ['index.astro'];
  return [`${s}.astro`, `${s}/index.astro`];
}

/** 낱장인가 — `/title/x` 처럼 두 칸짜리는 조각 대신 표로 잇는다 */
export function 낱장인가(길) {
  return String(길 ?? '').replace(/^\//, '').split('/').filter(Boolean).length > 1;
}

/* ── 자가시험 ───────────────────────────────────────────────── */
export function 자가시험() {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  const 글 = ['---', 'title: "A"', 'pages:', '  - "/clumping"', '  - "/reach"', 'draft: false', '---', '본문'].join('\n');
  검('pages 목록을 뽑는다', JSON.stringify(가리킨지면(글)) === JSON.stringify(['/clumping', '/reach']));
  검('따옴표가 없어도 뽑는다',
    JSON.stringify(가리킨지면('---\npages:\n  - /a\n---\nx')) === JSON.stringify(['/a']));
  검('pages 가 없으면 «빈 것»이 맞다', JSON.stringify(가리킨지면('---\ntitle: "A"\n---\nx')) === JSON.stringify([]));
  검('⛔ frontmatter 가 없으면 null — 빈 배열이 아니다', 가리킨지면('본문만 있다') === null);
  검('⛔ 빈 값도 null', 가리킨지면(null) === null);
  검('⚠ pages 뒤의 다른 칸을 안 삼킨다',
    JSON.stringify(가리킨지면('---\npages:\n  - /a\nauthor: X\n---\nx')) === JSON.stringify(['/a']));

  검('지면 파일 후보를 둘 준다',
    JSON.stringify(지면파일후보('/clumping')) === JSON.stringify(['clumping.astro', 'clumping/index.astro']));
  검('홈은 index', 지면파일후보('/')[0] === 'index.astro');

  검('낱장을 알아본다', 낱장인가('/title/squid-game') === true);
  검('큰 지면은 낱장이 아니다', 낱장인가('/clumping') === false);

  return 실패;
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--자가시험')) {
  const 실패 = 자가시험();
  if (실패.length) {
    console.error(`❌ 자가시험 실패 ${실패.length}\n${실패.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log('✅ 기사↔지면 잇는 자 — 자가시험 10 통과');
  process.exit(0);
}

if (내가실행됐다) {
  let 기사들;
  try { 기사들 = fs.readdirSync(기사방).filter((f) => f.endsWith('.md')); }
  catch { console.log(`⬜ **못 쟀다** — ${path.relative(뿌리, 기사방)} 이 없다`); process.exit(0); }

  const 받아야할지면 = new Map();     /* 지면 → 그 지면을 가리킨 기사들 */
  const 못읽은기사 = [];
  const 없는지면 = [];
  const 굳은채가리킴 = [];   /* 미리 지어 둔 지면 — 살아 있지만 조각을 못 넣는다 */

  for (const f of 기사들) {
    const 글 = fs.readFileSync(path.join(기사방, f), 'utf8');
    if (/^draft:\s*true/m.test(글)) continue;
    const 목록 = 가리킨지면(글);
    if (목록 === null) { 못읽은기사.push(f); continue; }
    for (const 길 of 목록) {
      if (낱장인가(길)) continue;
      const 있나 = 지면파일후보(길).some((c) => fs.existsSync(path.join(지면방, c)));
      if (!있나) {
        /* ⭐ Astro 길에 없어도 «미리 지어 둔» 지면일 수 있다. 그건 살아 있는 지면이다 */
        const 굳었나 = fs.existsSync(path.join(굳은지면방, 길.replace(/^\//, ''), 'index.html'))
          || fs.existsSync(path.join(굳은지면방, `${길.replace(/^\//, '')}.html`));
        if (굳었나) { 굳은채가리킴.push({ 기사: f, 길 }); continue; }
        없는지면.push({ 기사: f, 길 });
        continue;
      }
      if (!받아야할지면.has(길)) 받아야할지면.set(길, []);
      받아야할지면.get(길).push(f);
    }
  }

  const 안받는지면 = [];
  for (const [길, 기사목록] of 받아야할지면) {
    const 파일 = 지면파일후보(길).map((c) => path.join(지면방, c)).find((p) => fs.existsSync(p));
    const 글 = fs.readFileSync(파일, 'utf8');
    if (!글.includes(받는조각)) 안받는지면.push({ 길, 기사수: 기사목록.length, 기사: 기사목록 });
  }

  console.log(`기사↔지면 — 기사 ${기사들.length}편 · 가리켜진 큰 지면 ${받아야할지면.size}장`);
  if (못읽은기사.length) {
    console.log(`\n⚠ **못 읽은 기사 ${못읽은기사.length}편** — frontmatter 를 못 봤다. 「없다」로 안 친다`);
    for (const f of 못읽은기사) console.log(`     ${f}`);
  }
  if (없는지면.length) {
    console.log(`\n🔴 **없는 지면을 가리킨 기사 ${없는지면.length}건** — 손님을 404 로 보낸다`);
    for (const x of 없는지면) console.log(`     ${x.기사}  →  ${x.길}`);
  } else {
    console.log('\n✅ 기사가 가리킨 지면이 다 있다');
  }
  if (안받는지면.length) {
    console.log(`\n🔴 **기사를 «안 받는» 지면 ${안받는지면.length}장** — 기사는 걸었다고 믿는데 화면에 안 뜬다`);
    console.log(`   ⭐ 고치는 법: 그 지면에 <${받는조각} page="<주소>" /> 한 줄을 넣는다`);
    for (const x of 안받는지면) {
      console.log(`     ${x.길.padEnd(28)} 기사 ${x.기사수}편이 가리키는데 안 받는다`);
      for (const f of x.기사.slice(0, 3)) console.log(`         ${f}`);
    }
  } else {
    console.log('✅ 가리켜진 지면이 다 기사를 받고 있다');
  }
  const 흠 = 없는지면.length + 안받는지면.length;
  console.log(흠 ? '\n⛔ 위를 고친다.' : '\n✅ 기사와 지면이 서로 이어져 있다.');
  process.exit(흠 ? 1 : 0);
}
