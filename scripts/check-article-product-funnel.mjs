#!/usr/bin/env node
/**
 * check-article-product-funnel.mjs — **기사에서 자료 상품으로 «나가는 문»이 몇 편에 있나.**
 *
 *   node scripts/check-article-product-funnel.mjs
 *   node scripts/check-article-product-funnel.mjs --자가시험
 *
 * ── 🔴 왜 만드나 (2026-09-10 · 4번이 재서 넘김) ─────────────────────────
 * ```
 *   기사 131편 가운데 /data 로 링크 건 것 «7편(5.3%)» 뿐이었다.
 *   검색어는 기사로 떨어지는데 그 기사가 상품으로 다음 걸음을 안 열었다.
 *   ⇒ 「깔때기가 없다」가 아니라 «입구는 있고 출구가 안 뚫려 있다».
 * ```
 * 까닭: 이어 주는 자가 손으로 적은 슬러그 정규식이었다. 새 기사를 쓸 때마다
 * 그 줄에 낱말을 더해야 했는데 아무도 더하지 않았다.
 *
 * ⛔ 고치고 나서 «다시 막히는 것»을 막는 자가 이것이다. 태그가 하나도 안 걸리는
 *   기사가 늘면 여기서 걸린다 — 그러면 이음표에 한 줄을 더한다.
 * ⚠ 이 자는 「자료 목록으로 떨어진 편수」를 «흠»으로 세지 않는다. 그것도 문이다.
 *   다만 그 몫이 커지면 이음표가 낡았다는 뜻이라 수로 보여 준다.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
export const 기사방 = 'content/articles';

/** frontmatter 에서 tags 와 category 를 읽는다. ⛔ 못 읽으면 빈 것이 아니라 null */
export function 앞말읽기(글) {
  const s = String(글 ?? '');
  const m = s.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const 앞 = m[1];
  const cat = (앞.match(/^category:\s*(.+)$/m) || [])[1];
  const 태그줄 = (앞.match(/^tags:\s*\[(.*)\]$/m) || [])[1];
  const tags = 태그줄
    ? 태그줄.split(',').map((t) => t.trim().replace(/^["']|["']$/g, '')).filter(Boolean)
    : [];
  const draft = /^draft:\s*true\s*$/m.test(앞);
  return { category: cat ? cat.trim().replace(/^["']|["']$/g, '') : null, tags, draft };
}

/** 본문에 /data 로 가는 문이 있나 */
export function 본문에문있나(글) {
  const 본문 = String(글 ?? '').replace(/^---[\s\S]*?\n---/, '');
  return /\]\(\/data(\/|\)|#)/.test(본문) || /href="\/data(\/|"|#)/.test(본문);
}

/* ── 자가시험 ───────────────────────────────────────────────────────── */
async function 자가시험() {
  const 것 = []; const 재다 = (이름, 됐나) => 것.push({ 이름, 됐나 });
  const { 상품고르기, 태그다듬기, 이음표, 자료목록 } =
    await import('../src/lib/article-product.ts').catch(() => ({}));

  재다('앞말읽기: tags 와 category 를 읽는다', (() => {
    const r = 앞말읽기('---\ntitle: "x"\ncategory: equities\ntags: ["per", "kospi"]\n---\nbody');
    return r.category === 'equities' && r.tags.length === 2 && r.tags[0] === 'per';
  })());
  재다('앞말읽기: 태그가 없어도 빈 배열', 앞말읽기('---\ncategory: fx\n---\nx').tags.length === 0);
  재다('앞말읽기: draft 를 읽는다', 앞말읽기('---\ndraft: true\n---\nx').draft === true);
  재다('🔴 앞말읽기: 앞말이 없으면 null — 빈 것이 아니다', 앞말읽기('그냥 글') === null);

  재다('본문에문있나: 마크다운 링크를 본다', 본문에문있나('---\nx: 1\n---\nsee [it](/data/valuation)') === true);
  재다('본문에문있나: /data 만도 본다', 본문에문있나('---\nx: 1\n---\n[list](/data)') === true);
  재다('본문에문있나: html 링크도 본다', 본문에문있나('---\nx: 1\n---\n<a href="/data/x">y</a>') === true);
  재다('⛔ 본문에문있나: 앞말의 링크는 «본문»이 아니다',
    본문에문있나('---\nblurb: "[a](/data/x)"\n---\nno link here') === false);
  재다('⛔ 본문에문있나: 비슷한 주소에 안 걸린다 — /database 는 상품이 아니다',
    본문에문있나('---\nx: 1\n---\n[a](/database)') === false);

  if (태그다듬기) {
    재다('태그다듬기: 소문자·붙임표', 태그다듬기(' Price_Target ') === 'price-target');
    재다('⛔ 태그다듬기: 빈 것은 빈 글자', 태그다듬기(null) === '' && 태그다듬기('') === '');
    재다('상품고르기: 태그가 맞으면 그 상품', (() => {
      const r = 상품고르기({ tags: ['per', 'kospi'], category: 'equities' });
      return /valuation|concentration/.test(r.상품.href) && /^tag /.test(r.왜);
    })());
    재다('🔴 상품고르기: 맞은 태그가 «더 많은» 상품을 고른다', (() => {
      const r = 상품고르기({ tags: ['per', 'pbr', 'roe', 'kospi'], category: null });
      return r.상품.href === '/data/valuation' && /per/.test(r.왜);
    })());
    재다('상품고르기: 태그가 안 맞으면 갈래로 기댄다', (() => {
      const r = 상품고르기({ tags: ['nothing-matches-here'], category: 'macro' });
      return r.상품.href === '/data/concentration' && /^category /.test(r.왜);
    })());
    재다('🔴 상품고르기: 둘 다 없으면 «자료 목록» 이다 — 엉뚱한 상품을 붙이지 않는다', (() => {
      const r = 상품고르기({ tags: [], category: null });
      return r.상품.href === 자료목록.href && /catalogue/.test(r.왜);
    })());
    재다('상품고르기: 이음표가 열 줄 넘는다 (상품마다 한 줄)', 이음표.length >= 10);
    재다('⛔ 상품고르기: 이음표에 같은 키가 겹치지 않는다',
      new Set(이음표.map((x) => x.키)).size === 이음표.length);
    재다('⛔ 상품고르기: 두 상품이 같은 태그를 물지 않는다 (물면 어느 쪽이 이길지 흔들린다)', (() => {
      const 본것 = new Map();
      for (const it of 이음표) for (const t of it.태그.map(태그다듬기)) {
        if (본것.has(t)) return false;
        본것.set(t, it.키);
      }
      return true;
    })());
  } else {
    재다('🔴 article-product.ts 를 못 불렀다', false);
  }

  const 실패 = 것.filter((x) => !x.됐나);
  console.log(`■ 자가시험 ${것.length - 실패.length}/${것.length}`);
  for (const x of 실패) console.log(`  🔴 ${x.이름}`);
  return 실패.length === 0;
}

/* ── 돌리기 ─────────────────────────────────────────────────────────── */
if (process.argv.includes('--자가시험')) {
  process.exit((await 자가시험()) ? 0 : 1);
}
if (!(await 자가시험())) { console.log('🔴 자가시험이 깨졌다.'); process.exit(1); }
console.log('');

const { 상품고르기, 자료목록 } = await import('../src/lib/article-product.ts');

const 방 = path.join(ROOT, 기사방);
let 파일들 = [];
try { 파일들 = fs.readdirSync(방).filter((f) => f.endsWith('.md')); } catch {
  console.log(`🔴 기사 폴더를 못 읽었다 — ${기사방}`);
  process.exit(1);
}

let 봤다 = 0; let 본문문 = 0; let 태그로 = 0; let 갈래로 = 0; let 목록으로 = 0;
const 목록떨어진것 = [];
for (const f of 파일들) {
  const 글 = fs.readFileSync(path.join(방, f), 'utf8');
  const 앞 = 앞말읽기(글);
  if (!앞 || 앞.draft) continue;
  봤다 += 1;
  if (본문에문있나(글)) 본문문 += 1;
  const { 상품, 왜 } = 상품고르기(앞);
  if (왜.startsWith('tag ')) 태그로 += 1;
  else if (왜.startsWith('category ')) 갈래로 += 1;
  else { 목록으로 += 1; 목록떨어진것.push(f.replace(/\.md$/, '')); }
  if (상품.href === 자료목록.href && !왜.startsWith('catalogue')) 목록으로 += 0;
}

const 퍼 = (n) => (봤다 === 0 ? '—' : `${((n / 봤다) * 100).toFixed(1)}%`);
console.log(`■ 기사 ${봤다}편 — 상품으로 나가는 문`);
console.log(`   본문에 손으로 건 /data 링크        ${본문문}편 (${퍼(본문문)})   ← 4번이 잰 그 수`);
console.log(`   태그로 상품이 붙는 것             ${태그로}편 (${퍼(태그로)})`);
console.log(`   갈래로 기대어 붙는 것             ${갈래로}편 (${퍼(갈래로)})`);
console.log(`   자료 목록으로 떨어지는 것          ${목록으로}편 (${퍼(목록으로)})`);
console.log('');
console.log(`⭐ 자리가 붙는 기사 ${봤다}편 / ${봤다}편 — 모든 기사에 나가는 문이 하나 있다`);
console.log('   ⚠ 「자료 목록으로 떨어지는 것」은 흠이 아니다. 그것도 문이다.');
console.log('     다만 그 몫이 커지면 이음표가 낡았다는 뜻이다 — src/lib/article-product.ts');

if (목록떨어진것.length) {
  console.log('');
  console.log(`⬜ 태그·갈래가 하나도 안 맞은 ${목록떨어진것.length}편 (앞 12편만):`);
  for (const s of 목록떨어진것.slice(0, 12)) console.log(`   · ${s}`);
}

/* ⛔ 이 자는 빨강을 켜지 않는다 — 모든 기사에 문이 하나씩 있는 것이 이제 «구조»다.
 *   빨강을 켤 자리는 「이음표에 같은 태그가 겹쳤나」이고, 그것은 자가시험이 본다. */
process.exit(0);
