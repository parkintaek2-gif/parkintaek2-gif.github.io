#!/usr/bin/env node
/**
 * build-kcw-asked.mjs — **손님이 실제로 우리에게 가져오는 물음**을 첫 화면에 놓는다.
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 사장님: 「**키워드 검색량을 재서 해.**」 · 「어떻게 하면 사람들을 우리 안에서 **머물도록**
 * 하냐가 커뮤니티의 주요 역할이야.」
 *
 * 두 실측이 한 자리에서 만난다 —
 * ```
 * Search Console 4주  우리에게 오는 물음은 「<제목> netflix country」·「hit or flop」·
 *                     「korea ladder」·「Tudum 파일 주소」였다. 순위 7~17, 클릭 거의 0
 * 서버 로그 이레      지면 열림 5,026 중 우리 안에서 걸어온 것 296(5.9%).
 *                     첫 화면은 549번 열려 우리 최대 자리다
 * ```
 * ⇒ **첫 화면에 그 물음들을 놓고 답하는 지면으로 보낸다.** 짐작한 메뉴가 아니라 잰 물음이다.
 *
 * ── 규칙 ─────────────────────────────────────────────────────
 * ⛔ **노출·클릭 수를 지면에 싣지 않는다.** 우리 방문 수는 손님이 볼 값이 아니고,
 *   실으면 그 수가 우리 이야기가 된다. 물음과 갈 곳만 낸다.
 * ⛔ 물음을 지어내지 않는다. Search Console 이 준 말만 쓴다.
 * ⛔ 답하는 지면이 실제로 **있는** 물음만 낸다. 없으면 그것은 만들 일감이지 문이 아니다.
 * ⚠ 손님이 친 말은 그대로 쓰지 않고 **사람이 읽는 물음**으로 다시 쓴다
 *   (「a model family hit or flop」 → 「Was A Model Family a hit?」). 뜻은 안 바꾼다.
 *
 * 쓰는 법  node scripts/build-kcw-asked.mjs --자가시험
 *          node scripts/build-kcw-asked.mjs --잰다 [--쓴다]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 낼길 = path.join(뿌리, 'src/data/wikitip-asked.json');

/**
 * 물음의 **꼴**을 알아본다. 손님이 친 말은 꼴이 몇 가지뿐이다.
 * ⛔ 제목 하나하나를 손으로 적지 않는다 — 다음 주에 다른 제목이 오면 못 따라온다.
 */
export function 꼴알아보기(질의) {
  const q = String(질의 ?? '').trim().toLowerCase();
  if (!q) return null;
  if (/tudum|all-weeks|top10\/data/.test(q)) return { 꼴: 'files' };
  if (/\bladder\b|challenger|\blol\b|league of legends/.test(q)) return { 꼴: 'ladder' };
  const 히트 = q.match(/^(.+?)\s+(?:international\s+)?hit or flop$/);
  if (히트) return { 꼴: 'hitflop', 제목: 히트[1] };
  const 나라 = q.match(/^(?:what countries can i watch\s+)?(.+?)\s+(?:netflix\s+)?(?:countr(?:y|ies)|which country|distribution)$/);
  if (나라) return { 꼴: 'countries', 제목: 나라[1] };
  const 나라2 = q.match(/^(.+?)\s+netflix$/);
  if (나라2) return { 꼴: 'countries', 제목: 나라2[1] };
  return null;
}

/** 제목 글자를 주소 조각으로. ⚠ 자료의 slug 규칙과 같아야 한다 */
export const 조각 = (제목) => String(제목).toLowerCase()
  .replace(/['’]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

/**
 * 물음 하나를 **사람이 읽는 물음 + 갈 곳**으로 바꾼다.
 * @param {object} 있는제목 slug → 제목(우리가 지면을 낸 것만)
 */
export function 물음만들기(질의, 있는제목) {
  const k = 꼴알아보기(질의);
  if (!k) return null;
  if (k.꼴 === 'files') {
    return { ask: 'Where are Netflix’s own Top 10 files, and what is in them?', href: '/netflix-top10-data' };
  }
  if (k.꼴 === 'ladder') {
    return { ask: 'What was the Challenger cutoff on the Korean server?', href: '/esports' };
  }
  const s = 조각(k.제목);
  const 제목 = 있는제목[s];
  if (!제목) return null;                       // ⛔ 답할 지면이 없으면 문이 아니다
  if (k.꼴 === 'hitflop') return { ask: `Was ${제목} a hit?`, href: `/title/${s}` };
  return { ask: `Which countries did ${제목} chart in?`, href: `/title/${s}` };
}

/** 겹치는 물음을 접는다. 같은 갈 곳이면 한 번만 낸다 */
export function 접기(물음들, { 최대 = 8 } = {}) {
  const 본것 = new Set();
  const 낸것 = [];
  for (const m of 물음들) {
    if (!m) continue;
    if (본것.has(m.href)) continue;
    본것.add(m.href);
    낸것.push(m);
    if (낸것.length >= 최대) break;
  }
  return 낸것;
}

if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };
  const 있는 = { 'a-model-family': 'A Model Family', 'decision-to-leave': 'Decision to Leave' };

  검('파일 주소 꼴을 안다', 꼴알아보기('https://www.netflix.com/tudum/top10/data/all-weeks-countries.tsv').꼴 === 'files');
  검('사다리 꼴을 안다', 꼴알아보기('korea ladder').꼴 === 'ladder');
  검('챌린저도 사다리다', 꼴알아보기('challenger cutoff korea').꼴 === 'ladder');
  검('hit or flop 에서 제목을 뽑는다', 꼴알아보기('a model family hit or flop').제목 === 'a model family');
  검('international 이 끼어도 뽑는다',
    꼴알아보기('confidential assignment 2 international hit or flop').제목 === 'confidential assignment 2');
  검('나라 물음에서 제목을 뽑는다', 꼴알아보기('decision to leave netflix country').제목 === 'decision to leave');
  검('countries 도 받는다', 꼴알아보기('18 again netflix countries').제목 === '18 again');
  검('which country 도 받는다', 꼴알아보기('my roommate is a gumiho netflix which country').제목 === 'my roommate is a gumiho');
  검('distribution 도 나라 물음이다', 꼴알아보기('alchemy of souls distribution').제목 === 'alchemy of souls');
  검('⛔ 모르는 꼴은 null', 꼴알아보기('biggest korean music labels') === null);
  검('⛔ 빈 것은 null', 꼴알아보기('') === null && 꼴알아보기(null) === null);

  검('조각을 만든다', 조각('A Model Family') === 'a-model-family');
  검('작은따옴표를 없앤다', 조각("Sh**ting Stars") === 'sh-ting-stars');

  검('사람이 읽는 물음으로 바꾼다',
    물음만들기('a model family hit or flop', 있는).ask === 'Was A Model Family a hit?');
  검('갈 곳을 붙인다', 물음만들기('a model family hit or flop', 있는).href === '/title/a-model-family');
  검('나라 물음도 바꾼다',
    물음만들기('decision to leave netflix country', 있는).ask === 'Which countries did Decision to Leave chart in?');
  검('⛔ 지면이 없는 제목은 안 낸다', 물음만들기('some unknown drama hit or flop', 있는) === null);
  검('파일 물음은 제목이 없어도 낸다', 물음만들기('tudum top10 data', 있는).href === '/netflix-top10-data');

  const 접힌 = 접기([
    { ask: 'a', href: '/x' }, { ask: 'b', href: '/x' }, null, { ask: 'c', href: '/y' },
  ]);
  검('같은 갈 곳은 한 번만', 접힌.length === 2);
  검('null 을 건너뛴다', 접힌.every(Boolean));
  검('최대를 지킨다', 접기([{ ask: 'a', href: '/1' }, { ask: 'b', href: '/2' }], { 최대: 1 }).length === 1);

  if (실패.length) { console.error('❌ 자가시험 실패\n' + 실패.map((s) => `   · ${s}`).join('\n')); process.exit(1); }
  console.log('✅ build-kcw-asked 자가시험 통과 (21)');
  process.exit(0);
}

if (!process.argv.includes('--잰다')) {
  console.error('⛔ --잰다 나 --자가시험 을 준다');
  process.exit(1);
}

/* 지면이 실제로 있는 제목만 답할 수 있다 */
const 작품 = JSON.parse(fs.readFileSync(path.join(뿌리, 'src/data/wikitip-title-pages.json'), 'utf8'));
const 있는제목 = {};
for (const t of 작품.titles) if (t.hasPage) 있는제목[t.slug] = t.title;

/* Search Console 에서 물음을 받아 온다. ⛔ 손으로 목록을 적지 않는다 */
const 글 = execFileSync('node', [path.join(뿌리, 'scripts/search-console-report.mjs'),
  'sc-domain:kculturewire.com', '--행수=1000'], { encoding: 'utf8', cwd: 뿌리, maxBuffer: 1e8 });
const 질의들 = [...글.matchAll(/^\s*노출\s+\d+\s+·\s+클릭\s+\d+\s+·\s+순위\s+[\d.]+\s+(.+)$/gm)]
  .map((m) => m[1].trim().replace(/^"|"$/g, ''));

console.log(`Search Console 에서 물음 ${질의들.length}개를 받았다`);

const 물음들 = 접기(질의들.map((q) => 물음만들기(q, 있는제목)), { 최대: 8 });
console.log(`지면이 답할 수 있는 물음 ${물음들.length}개`);
물음들.forEach((m) => console.log(`   · ${m.ask}  →  ${m.href}`));

if (process.argv.includes('--쓴다')) {
  fs.writeFileSync(낼길, JSON.stringify({
    generated: new Date().toISOString().slice(0, 10),
    whatThisIs: 'Questions readers actually arrived with, taken from the search terms Google records for this site and rewritten as plain questions. Only questions we already have a page for are listed.',
    asked: 물음들,
  }, null, 1));
  console.log(`\n적었다 → ${path.relative(뿌리, 낼길)}`);
} else {
  console.log('\n⚠ 아직 안 적었다. 적으려면 --쓴다');
}
