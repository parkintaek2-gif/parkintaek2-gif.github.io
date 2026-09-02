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

if (process.argv.includes('--자가시험')) {
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
  console.log('\n⚠ 위 목록을 「봐줄것」으로 뺄 것과 「llms.txt에 넣을 것」으로 사람이 갈라 넣는다(자동 갱신 안 함).');
} else {
  console.log('✅ 빠진 것 없음.');
}
