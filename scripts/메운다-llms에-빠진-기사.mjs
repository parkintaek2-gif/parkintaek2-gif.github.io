#!/usr/bin/env node
/**
 * 메운다-llms에-빠진-기사.mjs
 *   — **AI 인용 관문(llms.txt)에 빠진 기사를 «자동으로» 메운다.**
 *
 * ── 🔴🔴 왜 지었나 (2026-10-13 17:5x · 5번) ──────────────────────────
 * 사장님: 「**검색 색인+seo. AI geo. 커뮤니티 등 방문 유입 작업 하고있나?**」
 *         「**하루 업무의 2/3를 여기에 쓰도록**」
 *
 * 재 보니 —
 * ```
 * 2026-09-02   발행 109편 중 llms.txt 에 33편   (76편 빠짐)
 * 2026-10-13   발행 177편 중 llms.txt 에 133편  (44편 빠짐)
 * ```
 * ⛔ `check-llms-coverage.mjs` 는 **짚기만 하고 메우지 않는다.** 그 머리에
 *   「사람이 매번 세면 잊는다 — 그래서 검사로 둔다」고 적어 놓고, 정작 메우는 일은
 *   사람에게 남겨 두었다. **그래서 또 쌓였다.**
 *
 * ⭐⭐ 회사 강령 ④ — 「규칙은 문장이 아니라 검사로 둔다.
 *   **사람이 기억해서 지키는 구조를 만들지 않는다.**」
 *   짚는 자만 있고 메우는 자가 없으면, 그 규칙은 아직 사람 머리에 있는 것이다.
 *
 * ⚠ 그 자가 자동 갱신을 «일부러» 안 한 까닭도 맞다 —
 *   「사람이 문장을 다듬어 넣는 자리」다. 그래서 이 자는 이렇게 가른다:
 * ```
 * ✅ 이미 걸린 줄    손도 안 댄다. 사람이 다듬은 글이 그대로 남는다
 * ✅ 빠진 것만       기사 앞말(title·dek)로 한 줄씩 지어 «맨 끝 칸»에 붙인다
 * ⛔ 지우지 않는다   줄을 빼는 일은 이 자가 하지 않는다
 * ```
 * ⚠ dek 이 길면 자른다 — 관문은 목록이지 기사가 아니다. 160자에서 끊는다.
 *
 * 쓰는 법
 *   node scripts/메운다-llms에-빠진-기사.mjs --자가시험
 *   node scripts/메운다-llms에-빠진-기사.mjs            (보기만 — 안 고친다)
 *   node scripts/메운다-llms에-빠진-기사.mjs --적는다
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 발행기사목록, llms에걸린slug, 빠진것 } from './check-llms-coverage.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const llms경로 = path.join(뿌리, 'public/llms.txt');

/** 이 칸 아래에 붙인다. ⚠ 사람이 쓴 칸을 건드리지 않으려고 «우리 칸»을 따로 둔다 */
export const 우리칸머리 = '## Recent reporting (added automatically — not yet hand-sorted)';

/**
 * 한 편을 llms.txt 한 줄로 만든다.
 * ⛔ 제목·설명을 지어내지 않는다 — 기사 앞말에 있는 글자 그대로다.
 * ⚠ 대괄호는 마크다운 링크를 깨뜨린다. 제목 안의 `[` `]` 를 괄호로 바꾼다.
 */
export function 한줄짓기(기사, 바탕 = 'https://seoulmarkets.com') {
  if (!기사 || !기사.slug) return null;
  const 제목 = String(기사.title ?? '').replace(/\[/g, '(').replace(/\]/g, ')').trim();
  if (!제목) return null;                       /* ⛔ 제목이 없으면 줄을 안 만든다 */
  let 설명 = String(기사.dek ?? '').replace(/\s+/g, ' ').trim();
  if (설명.length > 160) 설명 = 설명.slice(0, 157).replace(/[\s,;:]+$/, '') + '…';
  const 길 = `${바탕}/article/${기사.slug}`;
  return 설명 ? `- [${제목}](${길}): ${설명}` : `- [${제목}](${길})`;
}

/**
 * 우리 칸을 갈아끼운 새 llms.txt 글을 돌려준다.
 * ⛔ 사람이 쓴 칸은 한 글자도 안 건드린다 — 우리 칸만 통째로 다시 쓴다.
 * ⚠ 우리 칸이 없으면 맨 끝에 새로 만든다.
 */
export function 새글짓기(원글, 줄들, { 칸머리 = 우리칸머리 } = {}) {
  const 엔 = String.fromCharCode(10);
  const 글 = String(원글 ?? '');
  if (!줄들 || !줄들.length) return 글;         /* 메울 것이 없으면 그대로 둔다 */
  const 칸 = [칸머리, '', ...줄들, ''].join(엔);
  const i = 글.indexOf(칸머리);
  if (i < 0) return 글.replace(/\s*$/, '') + 엔 + 엔 + 칸;
  /* 우리 칸이 이미 있으면 **그 칸만** 갈아끼운다 — 다음 `## ` 머리 앞까지 */
  const 뒤 = 글.slice(i + 칸머리.length);
  const j = 뒤.search(/\n## /);
  return 글.slice(0, i) + 칸 + (j < 0 ? '' : 뒤.slice(j + 1));
}

/* ── 상품 지면 ──────────────────────────────────────────────────────
 * 🔴🔴 [2026-10-13 18:2x] **파는 것이 AI 에 안 보이는 자리.**
 *   `check-llms-coverage.mjs --상품` 이 /data 지면 11장을 「llms.txt 에 없다」고 짚는다.
 *   그 자의 말 그대로 — 「AI 가 방문의 4분의 1을 데려온다. 거기 없으면 **파는 것이 안 보인다**」.
 *
 * ⚠ 지면마다 제목을 담는 «변수 이름»이 제각각이다(TITLE/DESC · title/description).
 *   ⛔ astro 소스를 파싱하지 않는다 — 이름 하나 바뀌면 조용히 빈다.
 *   ✅ **빌드된 지면의 <title> 과 meta description 을 읽는다.** 그것이 손님과 AI 가
 *     실제로 보는 값이다. ⭐ 검사는 손님이 실제로 여는 자리에서 한다.
 */
export const 상품칸머리 = '## Datasets (added automatically — not yet hand-sorted)';

/** 빌드된 HTML 한 장에서 제목과 설명을 뽑는다 */
export function 지면글읽기(html) {
  const s = String(html ?? '');
  const t = s.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const d = s.match(/<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["']/i)
    || s.match(/<meta\s+content=["']([\s\S]*?)["']\s+name=["']description["']/i);
  const 풀기 = (v) => String(v ?? '')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ').trim();
  return { 제목: 풀기(t?.[1]), 설명: 풀기(d?.[1]) };
}

/**
 * 상품 지면 한 줄.
 * ⚠ 제목 끝의 「 — SeoulMarkets」 같은 사이트 이름 꼬리는 뗀다 — 목록에서 되풀이된다.
 */
export function 상품한줄짓기(slug, 제목, 설명, 바탕 = 'https://seoulmarkets.com') {
  if (!slug) return null;
  /* ⚠ [2026-10-13] 처음에 `— SeoulMarkets` 만 뗐는데, 실제 지면은 **`| SMarkets`** 였다.
     ⛔ 짐작한 꼴로 시험을 짓고 통과시키면 라이브에서 안 떨어진다. 빌드물을 보고 고쳤다. */
  let t = String(제목 ?? '').replace(/\s*[—|·\-]\s*(SeoulMarkets|SMarkets)\s*$/i, '').trim();
  t = t.replace(/\[/g, '(').replace(/\]/g, ')');
  if (!t) return null;                           /* ⛔ 제목이 없으면 지어내지 않는다 */
  let d = String(설명 ?? '').replace(/\s+/g, ' ').trim();
  if (d.length > 160) d = d.slice(0, 157).replace(/[\s,;:]+$/, '') + '…';
  const 길 = `${바탕}/data/${slug}`;
  return d ? `- [${t}](${길}): ${d}` : `- [${t}](${길})`;
}

/* ── 자가시험 ──────────────────────────────────────────────────────── */
function 자가시험() {
  let 통과 = 0; let 실패 = 0;
  const 본다 = (말, 참) => {
    if (참) { 통과 += 1; console.log('  ✅ ' + 말); } else { 실패 += 1; console.log('  🔴 ' + 말); }
  };
  const 엔 = String.fromCharCode(10);

  const 기사 = { slug: 'foo-bar', title: 'A Title', dek: 'Some number moved 12%.' };
  본다('🔴 한 줄을 짓는다 — 제목·주소·설명',
    한줄짓기(기사) === '- [A Title](https://seoulmarkets.com/article/foo-bar): Some number moved 12%.');
  본다('⛔ 제목이 없으면 줄을 안 만든다 — 지어내지 않는다',
    한줄짓기({ slug: 'x' }) === null && 한줄짓기(null) === null);
  본다('✅ 설명이 없어도 줄은 만든다 — 주소는 있어야 AI 가 온다',
    한줄짓기({ slug: 'x', title: 'T' }) === '- [T](https://seoulmarkets.com/article/x)');
  본다('⛔ 제목 속 대괄호가 링크를 깨뜨리지 않게 괄호로 바꾼다',
    한줄짓기({ slug: 'x', title: 'A [B] C' }).includes('A (B) C'));
  본다('⚠ 긴 설명은 160자에서 끊는다 — 관문은 목록이지 기사가 아니다',
    한줄짓기({ slug: 'x', title: 'T', dek: 'a'.repeat(400) }).length < 230);
  본다('   끊었으면 말줄임을 붙인다 — 끊긴 것을 숨기지 않는다',
    /…$/.test(한줄짓기({ slug: 'x', title: 'T', dek: 'a'.repeat(400) })));
  본다('⚠ 줄바꿈이 든 설명도 한 줄로 만든다 — 안 그러면 목록이 깨진다',
    !한줄짓기({ slug: 'x', title: 'T', dek: 'a' + 엔 + 'b' }).includes(엔));

  const 원글 = ['# 머리', '', '## 사람이 쓴 칸', '- [손으로 쓴 줄](u): 설명'].join(엔);
  const 새글 = 새글짓기(원글, ['- [새 줄](v)']);
  본다('🔴🔴 사람이 쓴 칸을 한 글자도 안 건드린다',
    새글.includes('## 사람이 쓴 칸') && 새글.includes('- [손으로 쓴 줄](u): 설명'));
  본다('🔴 우리 칸을 만들어 새 줄을 붙인다',
    새글.includes(우리칸머리) && 새글.includes('- [새 줄](v)'));
  본다('⛔ 메울 것이 없으면 글을 안 건드린다 — 빈 칸을 만들지 않는다',
    새글짓기(원글, []) === 원글 && 새글짓기(원글, null) === 원글);

  /* 두 번 돌려도 칸이 둘로 늘지 않아야 한다 — 오늘 지시문에서 겪은 그 흠이다 */
  const 두번 = 새글짓기(새글, ['- [새 줄](v)', '- [또](w)']);
  본다('🔴🔴 두 번 돌려도 우리 칸이 «하나»다 — 이미 있으면 갈아끼운다',
    (두번.match(new RegExp(우리칸머리.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length === 1);
  본다('   갈아끼운 뒤에도 새 줄이 다 들어 있다',
    두번.includes('- [새 줄](v)') && 두번.includes('- [또](w)'));
  본다('   그래도 사람이 쓴 칸은 그대로다',
    두번.includes('- [손으로 쓴 줄](u): 설명'));

  /* 우리 칸 «뒤»에 사람 칸이 또 있을 때 그것을 먹지 않아야 한다 */
  const 뒤에도 = [우리칸머리, '', '- [옛 줄](o)', '', '## 뒤에 있는 사람 칸', '- [지키자](p)'].join(엔);
  const 갈아낀 = 새글짓기(뒤에도, ['- [새 줄](v)']);
  본다('🔴🔴 우리 칸 «뒤»의 사람 칸을 먹지 않는다 — 자르는 자리를 잘못 잡으면 통째로 사라진다',
    갈아낀.includes('## 뒤에 있는 사람 칸') && 갈아낀.includes('- [지키자](p)'));
  본다('   옛 줄은 갈아끼워 사라진다 — 우리 칸은 «우리가» 다시 쓰는 칸이다',
    !갈아낀.includes('- [옛 줄](o)'));

  /* ── 상품 지면 ── */
  본다('🔴 빌드된 지면에서 제목과 설명을 읽는다 — 소스 변수 이름에 기대지 않는다',
    지면글읽기('<title>T — SeoulMarkets</title><meta name="description" content="D">').제목 === 'T — SeoulMarkets');
  본다('   설명도 읽는다',
    지면글읽기('<title>T</title><meta name="description" content="D">').설명 === 'D');
  본다('⚠ meta 의 차례가 뒤바뀌어도 읽는다',
    지면글읽기('<meta content="D" name="description">').설명 === 'D');
  본다('⚠ HTML 글자(&amp; 따위)를 되돌린다 — 안 하면 목록에 &amp;amp; 가 찍힌다',
    지면글읽기('<title>A &amp; B</title>').제목 === 'A & B');
  본다('⛔ 없으면 빈 글 — ⛔ 「없다」를 지어내지 않는다',
    지면글읽기('<p>x</p>').제목 === '' && 지면글읽기(null).설명 === '');
  본다('🔴 상품 줄을 짓는다',
    상품한줄짓기('gold-bar-premium', 'Gold bar premium', 'What it costs.')
      === '- [Gold bar premium](https://seoulmarkets.com/data/gold-bar-premium): What it costs.');
  본다('⚠ 제목 끝의 사이트 이름 꼬리를 뗀다 — 목록에서 되풀이된다',
    상품한줄짓기('x', 'Gold bar premium — SeoulMarkets', 'd').includes('[Gold bar premium]'));
  본다('🔴 라이브가 실제로 쓰는 꼴 «| SMarkets» 도 뗀다 — 짐작한 꼴만 시험했다가 안 떨어졌다',
    상품한줄짓기('x', 'Two sizes, one gold bar | SMarkets', 'd')
      .includes('[Two sizes, one gold bar]'));
  본다('⛔ 가운데에 있는 사이트 이름은 안 건드린다 — 끝만 뗀다',
    상품한줄짓기('x', 'SMarkets data and more', 'd').includes('[SMarkets data and more]'));
  본다('⛔ 제목이 없으면 줄을 안 만든다',
    상품한줄짓기('x', '', 'd') === null && 상품한줄짓기(null, 'T', 'd') === null);
  본다('⚠ 상품 칸은 기사 칸과 «다른» 칸이다 — 섞으면 갈아끼울 때 서로 먹는다',
    상품칸머리 !== 우리칸머리);

  console.log(엔 + '자가시험 ' + (통과 + 실패) + '개 · 통과 ' + 통과 + ' · 실패 ' + 실패);
  return 실패 === 0;
}

/* ── 본체 ──────────────────────────────────────────────────────────── */
function 메운다(적나) {
  const 엔 = String.fromCharCode(10);
  const 원글 = fs.readFileSync(llms경로, 'utf8');
  const 기사들 = 발행기사목록();
  const 걸린 = llms에걸린slug(원글);
  const 빠짐 = 빠진것(기사들, 걸린);

  console.log('■ AI 인용 관문(llms.txt)에 빠진 기사를 메운다');
  console.log('');
  console.log('   발행 ' + 기사들.length + '편 · 걸린 것 ' + 걸린.size + ' · 빠짐 ' + 빠짐.length);
  console.log('');
  if (!빠짐.length) { console.log('   ✅ 빠진 기사가 없다'); return 0; }

  const 줄들 = [];
  const 못지은것 = [];
  for (const a of 빠짐) {
    const 줄 = 한줄짓기(a);
    if (줄) 줄들.push(줄); else 못지은것.push(a.slug);
  }
  for (const l of 줄들.slice(0, 8)) console.log('   + ' + l.slice(0, 118));
  if (줄들.length > 8) console.log('   … ' + (줄들.length - 8) + '줄 더');
  if (못지은것.length) {
    console.log('');
    console.log('   ⬜ 제목이 없어 줄을 못 지은 것 ' + 못지은것.length + '편 — ⛔ 지어내지 않았다');
    for (const s of 못지은것) console.log('      · ' + s);
  }
  console.log('');
  if (!적나) {
    console.log('   ⚠ 보기만 했다. 실제로 적으려면 --적는다');
    return 0;
  }
  const 새글 = 새글짓기(원글, 줄들);
  fs.writeFileSync(llms경로, 새글, 'utf8');
  console.log('   ✔ 적었다 — public/llms.txt (' + 원글.length + ' → ' + 새글.length + '자)');
  console.log('   ⛔ 「적었다」는 「AI 가 읽었다」가 아니다 — 배포하고 라이브에서 다시 센다.');
  return 0;
}

/**
 * 상품 지면을 메운다.
 * ⚠ **빌드된 dist 를 읽는다.** 빌드가 없으면 「못 쟀다」고 말하고 아무것도 안 한다 —
 *   ⛔ 빈 제목으로 줄을 지으면 AI 관문에 쓰레기가 쌓인다.
 */
function 상품메운다(적나) {
  const 원글 = fs.readFileSync(llms경로, 'utf8');
  const 지면방 = path.join(뿌리, 'src/pages/data');
  const 빌드방 = path.join(뿌리, 'dist/data');
  console.log('');
  console.log('■ 상품 지면(/data)을 메운다 — 파는 것이 AI 에 보이게');
  console.log('');
  if (!fs.existsSync(빌드방)) {
    console.log('   ⬜ dist/data 가 없다 — 먼저 빌드해야 제목을 읽는다. 「상품이 다 걸렸다」가 아니다.');
    return 0;
  }
  const 지면들 = fs.readdirSync(지면방)
    .filter((f) => f.endsWith('.astro') && f !== 'index.astro')
    .map((f) => f.replace(/\.astro$/, ''))
    .filter((s) => !원글.includes('/data/' + s));
  if (!지면들.length) { console.log('   ✅ 빠진 상품 지면이 없다'); return 0; }

  const 줄들 = []; const 못읽은것 = [];
  for (const s of 지면들) {
    /* 지면이 `/data/x.html` 일 수도 `/data/x/index.html` 일 수도 있다 — 둘 다 본다 */
    const 후보 = [path.join(빌드방, s + '.html'), path.join(빌드방, s, 'index.html')];
    const 길 = 후보.find((p) => fs.existsSync(p));
    if (!길) { 못읽은것.push(s + ' (빌드물이 없다)'); continue; }
    const { 제목, 설명 } = 지면글읽기(fs.readFileSync(길, 'utf8'));
    const 줄 = 상품한줄짓기(s, 제목, 설명);
    if (줄) 줄들.push(줄); else 못읽은것.push(s + ' (제목을 못 읽었다)');
  }
  for (const l of 줄들) console.log('   + ' + l.slice(0, 118));
  if (못읽은것.length) {
    console.log('');
    console.log('   ⬜ 못 넣은 것 ' + 못읽은것.length + '장 — ⛔ 지어내지 않았다');
    for (const s of 못읽은것) console.log('      · ' + s);
  }
  console.log('');
  if (!적나) { console.log('   ⚠ 보기만 했다. 적으려면 --적는다'); return 0; }
  if (!줄들.length) { console.log('   ⬜ 적을 줄이 없다'); return 0; }
  const 새글 = 새글짓기(원글, 줄들, { 칸머리: 상품칸머리 });
  fs.writeFileSync(llms경로, 새글, 'utf8');
  console.log('   ✔ 적었다 — ' + 줄들.length + '장 (' + 원글.length + ' → ' + 새글.length + '자)');
  return 0;
}

/* ── 들머리 ────────────────────────────────────────────────────────── */
const 내가진입점 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가진입점) {
  if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);
  else {
    const 적나 = process.argv.includes('--적는다');
    메운다(적나);
    /* ⚠ 기사를 먼저, 상품을 그 다음에 — 상품 쪽이 «방금 적은» llms.txt 를 다시 읽어야 한다 */
    process.exit(상품메운다(적나));
  }
}
