#!/usr/bin/env node
/**
 * measure-kcw-ctr-gap.mjs — **1페이지에 있으면서 클릭이 0인 지면**을 뽑는다.
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 2026-08-22 에 4주를 갈라 보니 우리 병이 순위가 아니었다.
 * ```
 * 1~10위    지면 210장 · 노출 1,069 · 클릭 8
 * 그중 클릭 0  83장 · 노출 824        ← 여기가 병이다
 * 전체 클릭률  0.65%
 * ```
 * 1페이지에 있는데 안 눌린다는 것은 **제목·설명이 그 물음에 답하지 않는다**는 뜻이다.
 * 지면을 더 내도 이 병은 안 낫는다. 그래서 이 자는 «고칠 지면 목록»을 만든다.
 *
 * ⭐ 같은 노출에서 클릭률만 0.65% → 3% 가 되면 클릭이 15 → 70 이다. 새 지면 0장으로.
 * ⛔ 낚지 않는다. 제목이 약속한 것을 지면이 실제로 줘야 한다 — 아니면 지면을 고친다.
 * ⚠ 이 자는 **무엇을 고칠지 정해 주지 않는다.** 어디가 아픈지만 짚는다. 고치는 것은 사람 몫이다.
 *
 * 쓰는 법  node scripts/measure-kcw-ctr-gap.mjs --자가시험
 *          node scripts/measure-kcw-ctr-gap.mjs --잰다 [--쓴다]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 낼길 = path.join(뿌리, 'src/data/wikitip-ctr-gap.json');

/** Search Console 보고 한 줄을 뜯는다 */
export function 줄뜯기(줄) {
  const m = String(줄).match(/노출\s+(\d+)\s+·\s+클릭\s+(\d+)\s+·\s+순위\s+([\d.]+)\s+(\S+)/);
  if (!m) return null;
  return {
    노출: Number(m[1]),
    클릭: Number(m[2]),
    순위: Number(m[3]),
    주소: m[4].replace('https://www.kculturewire.com', '') || '/',
  };
}

/** 지면 갈래 — 어느 무리가 아픈지 보려면 갈래가 필요하다 */
export function 갈래(주소) {
  const p = String(주소);
  if (p === '/') return 'home';
  if (p.startsWith('/article/')) return 'article';
  if (p.startsWith('/title/')) return 'title';
  if (p.startsWith('/market/')) return 'market';
  if (p.startsWith('/firm/')) return 'firm';
  if (p.startsWith('/room/') || p === '/community') return 'community';
  if (p.startsWith('/born-on')) return 'birthday';
  if (p.startsWith('/stem/') || p === '/day-pillar') return 'saju';
  return 'dataset';
}

/**
 * 아픈 지면을 고른다 — **1페이지 안(순위 ≤ 문턱)이고 클릭이 0이고 노출이 최소 이상.**
 * ⛔ 노출이 1~2 인 것은 안 넣는다. 우연과 구분이 안 된다.
 */
export function 아픈것(줄들, { 문턱 = 10, 최소노출 = 3 } = {}) {
  return 줄들
    .filter((x) => x && x.순위 <= 문턱 && x.클릭 === 0 && x.노출 >= 최소노출)
    .sort((a, b) => b.노출 - a.노출);
}

/** 갈래마다 앓는 크기 */
export function 갈래별(아픈것들) {
  const m = new Map();
  for (const x of 아픈것들) {
    const k = 갈래(x.주소);
    const v = m.get(k) ?? { 장: 0, 노출: 0 };
    v.장++; v.노출 += x.노출;
    m.set(k, v);
  }
  return [...m].sort((a, b) => b[1].노출 - a[1].노출);
}

/** 클릭률 — ⛔ 노출이 0이면 몫을 만들지 않는다 */
export const 클릭률 = (클릭, 노출) => (노출 > 0 ? 클릭 / 노출 : null);

if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  const 한줄 = 줄뜯기('   노출    175 · 클릭    0 · 순위 7.9   https://www.kculturewire.com/market/nicaragua');
  검('한 줄을 뜯는다', 한줄 && 한줄.노출 === 175 && 한줄.클릭 === 0 && 한줄.순위 === 7.9);
  검('집 주소를 뗀다', 한줄.주소 === '/market/nicaragua');
  검('첫 화면은 «/»', 줄뜯기('노출 21 · 클릭 2 · 순위 8.9 https://www.kculturewire.com/').주소 === '/');
  검('⛔ 아닌 줄은 null', 줄뜯기('아무 글') === null);

  검('갈래를 안다', 갈래('/article/x') === 'article' && 갈래('/title/y') === 'title');
  검('첫 화면 갈래', 갈래('/') === 'home');
  검('커뮤니티 갈래', 갈래('/community') === 'community' && 갈래('/room/rat') === 'community');
  검('모르는 것은 자료 지면', 갈래('/watched') === 'dataset');

  const 줄들 = [
    { 노출: 175, 클릭: 0, 순위: 7.9, 주소: '/market/nicaragua' },
    { 노출: 67, 클릭: 0, 순위: 7.9, 주소: '/titles' },
    { 노출: 2, 클릭: 0, 순위: 5, 주소: '/tiny' },            // 노출이 적어 뺀다
    { 노출: 30, 클릭: 3, 순위: 6, 주소: '/clicked' },          // 눌리니 뺀다
    { 노출: 150, 클릭: 0, 순위: 15.1, 주소: '/second-page' },  // 2페이지라 뺀다
  ];
  const 아픈 = 아픈것(줄들);
  검('1페이지·클릭0·노출 충분한 것만 고른다', 아픈.length === 2);
  검('노출 큰 것이 먼저', 아픈[0].주소 === '/market/nicaragua');
  검('⛔ 노출 2 는 우연과 구분이 안 되니 뺀다', !아픈.some((x) => x.주소 === '/tiny'));
  검('⛔ 눌리는 지면은 아프지 않다', !아픈.some((x) => x.주소 === '/clicked'));
  검('⛔ 2페이지는 이 자의 일이 아니다', !아픈.some((x) => x.주소 === '/second-page'));

  const g = 갈래별(아픈);
  검('갈래별로 접는다', g.length === 2 && g[0][0] === 'market' && g[0][1].노출 === 175);

  검('클릭률을 낸다', Math.abs(클릭률(15, 2322) - 0.00646) < 0.0001);
  검('⛔ 0 으로 나누지 않는다', 클릭률(0, 0) === null);

  if (실패.length) { console.error('❌ 자가시험 실패\n' + 실패.map((s) => `   · ${s}`).join('\n')); process.exit(1); }
  console.log('✅ measure-kcw-ctr-gap 자가시험 통과 (15)');
  process.exit(0);
}

if (!process.argv.includes('--잰다')) {
  console.error('⛔ --잰다 나 --자가시험 을 준다');
  process.exit(1);
}

const 글 = execFileSync('node', [path.join(뿌리, 'scripts/search-console-report.mjs'),
  'sc-domain:kculturewire.com', '--축=page', '--행수=1000'], { encoding: 'utf8', cwd: 뿌리, maxBuffer: 1e8 });
const 줄들 = 글.split(/\r?\n/).map(줄뜯기).filter(Boolean);
if (!줄들.length) { console.log('⚠ 못 쟀다 — Search Console 에서 줄을 못 받았다'); process.exit(0); }

const 노출합 = 줄들.reduce((a, x) => a + x.노출, 0);
const 클릭합 = 줄들.reduce((a, x) => a + x.클릭, 0);
const 아픈 = 아픈것(줄들);
const 아픈노출 = 아픈.reduce((a, x) => a + x.노출, 0);

console.log(`\n# 클릭이 안 나는 자리 — 지면 ${줄들.length}장 · 노출 ${노출합.toLocaleString('en-US')} · 클릭 ${클릭합}`);
console.log(`  전체 클릭률 ${(클릭률(클릭합, 노출합) * 100).toFixed(2)}%`);
console.log(`\n## 1페이지인데 클릭 0 — ${아픈.length}장 · 노출 ${아픈노출.toLocaleString('en-US')}`);
console.log('  (이 노출에서 클릭률 3% 만 나오면 클릭이 ' + Math.round(아픈노출 * 0.03) + '개다)');
for (const x of 아픈.slice(0, 25)) {
  console.log(`  노출 ${String(x.노출).padStart(4)} · 순위 ${String(x.순위).padStart(5)} · ${x.주소}`);
}
console.log('\n## 갈래별로 어디가 아픈가');
for (const [k, v] of 갈래별(아픈)) console.log(`  ${k.padEnd(10)} ${String(v.장).padStart(3)}장 · 노출 ${v.노출}`);

if (process.argv.includes('--쓴다')) {
  fs.writeFileSync(낼길, JSON.stringify({
    generated: new Date().toISOString().slice(0, 10),
    whatThisIs: 'Pages that already sit on the first page of Google for something and still get no clicks, taken from Search Console. The list is a work queue, not a ranking.',
    whatThisIsNot: 'Not a measure of page quality, and not a list of what to write. It says where the promise on the search result did not match the page, and nothing about which side to change.',
    pagesSeen: 줄들.length,
    impressions: 노출합,
    clicks: 클릭합,
    firstPageNoClick: 아픈.length,
    firstPageNoClickImpressions: 아픈노출,
    byKind: 갈래별(아픈).map(([k, v]) => ({ kind: k, pages: v.장, impressions: v.노출 })),
    rows: 아픈.slice(0, 100),
  }, null, 1));
  console.log(`\n적었다 → ${path.relative(뿌리, 낼길)}`);
} else {
  console.log('\n⚠ 아직 안 적었다. 적으려면 --쓴다');
}
