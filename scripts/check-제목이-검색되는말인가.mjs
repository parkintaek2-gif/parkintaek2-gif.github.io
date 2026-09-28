#!/usr/bin/env node
/**
 * check-제목이-검색되는말인가.mjs — **우리 지면 제목에 «사람이 찾는 말»이 들어 있나.**
 *
 * ── 🔴 왜 (2026-09-29 · 5번) ─────────────────────────────────────────
 * 사장님 최우선 지시(검색·AI 유입)에 따라 GSC 를 재 보니 —
 *   SeoulMarkets 에서 1페이지에 선 질의 12개를 «세 지면»이 다 가져갔고, 그중 하나가 8개였다.
 *   그 이기는 지면의 제목은 이랬다 —
 *     「Korea's 10 **largest listed companies** — and why most rankings double-count Samsung」
 *   **사람이 실제로 검색하는 말이 앞에 있고, 뒤에 우리만 아는 결론이 붙는다.**
 *
 *   그런데 내가 그날 낸 지면 제목은 「How Korean companies **split themselves**」였다.
 *   뜻은 맞지만 **아무도 그렇게 검색하지 않는다.** 찾아올 길이 없는 제목이다.
 *
 * ⭐ 그래서 이 자는 **GSC 가 알려 준 «실제 질의»**를 잣대로 삼는다.
 *   내 느낌이 아니라 «사람이 정말 친 말»과 맞대어 본다.
 *   ⛔ 「좋은 제목처럼 보인다」로 판정하지 않는다.
 *
 * 쓰는 법
 *   node scripts/check-제목이-검색되는말인가.mjs
 *   node scripts/check-제목이-검색되는말인가.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 어느 말이든 제목에 있으면 «검색될 만하다»고 보지 않는다 — 이런 말은 누구나 쓴다 */
export const 흔한말 = new Set(['the', 'a', 'an', 'and', 'or', 'of', 'in', 'on', 'for', 'to', 'is', 'are',
  'we', 'our', 'you', 'your', 'this', 'that', 'it', 'by', 'with', 'from', 'at', 'as', 'how', 'what',
  'why', 'when', 'who', 'not', 'but', 'more', 'most', 'all', 'one', 'two', 'do', 'does', 'did',
  'smarkets', 'seoulmarkets']);

export function 낱말로(s) {
  return String(s ?? '').toLowerCase()
    .replace(/[^a-z0-9가-힣\s]/g, ' ')
    .split(/\s+/).filter((w) => w.length > 1 && !흔한말.has(w));
}

/**
 * 제목이 «실제 질의»와 얼마나 겹치나.
 * ⚠ 한 낱말만 겹쳐도 세지 않는다 — 「companies」 하나로는 아무 데도 못 간다.
 *   ⇒ «두 낱말 이상» 이어서 겹치는 질의가 있어야 «찾아올 길이 있다»고 본다.
 */
/** 어간으로 견준다 — korea/korean, company/companies 를 같은 말로 본다.
 *  ⚠ 「길이에 따라 다르게 자르면」 korea(5자)는 그대로, korean(6자)은 kore 가 되어
 *    같은 말이 서로 다른 어간이 된다. 실제로 그 길로 자가시험이 떨어졌다.
 *  ⇒ **모두 같은 길이로 자른다.** 뭉개지는 쪽이 어긋나는 쪽보다 낫다. */
export function 어간(w) {
  const s = String(w ?? '').toLowerCase();
  return s.length > 4 ? s.slice(0, 4) : s;
}

export function 겹치나(제목, 질의들) {
  const 제 = new Set(낱말로(제목).map(어간));
  const 걸린것 = [];
  for (const q of 질의들 ?? []) {
    const 질 = 낱말로(q).map(어간);
    if (!질.length) continue;
    const 겹침 = 질.filter((w) => 제.has(w)).length;
    /* 🔴 [2026-09-29] 처음엔 «두 낱말만» 겹쳐도 「길 있다」고 했다. 그랬더니
       「How Korean companies split themselves」가 「largest korean companies」와
       korean·companies 둘이 겹쳐 통과해 버렸다 — 정작 핵심어 «largest» 가 빠졌는데도.
       ⇒ **질의 낱말이 «전부» 제목에 있어야** 그 질의로 찾아올 길이 있다고 본다.
         자가시험이 이 느슨함을 잡아 줬다. */
    if (겹침 === 질.length) 걸린것.push({ 질의: q, 겹침 });
  }
  return 걸린것.sort((a, b) => b.겹침 - a.겹침);
}

/** 판정 — ⛔ 「없다」와 「못 쟀다」를 가른다 */
export function 판정(제목, 질의들) {
  if (!제목) return { 갈래: '못쟀다', 말: '제목을 못 읽었다' };
  if (!질의들 || !질의들.length) return { 갈래: '못쟀다', 말: '맞대어 볼 실제 질의가 없다' };
  const 걸린것 = 겹치나(제목, 질의들);
  if (!걸린것.length) {
    return { 갈래: '길없음', 말: '실제 질의와 두 낱말 이상 겹치는 것이 없다 — 찾아올 길이 없는 제목이다' };
  }
  return { 갈래: '길있음', 말: `${걸린것.length}개 질의와 겹친다 (${걸린것[0].질의})`, 걸린것 };
}

/* ── 자가시험 ─────────────────────────────────────────────────────── */
export function 자가시험() {
  const 것 = [];
  const 본다 = (이름, 참, 덧 = '') => 것.push({ 이름, 참: !!참, 덧 });

  const 질의 = ['largest korean companies', 'korean stock market biggest companies',
    'kospi index constituents weights', 'korea business segments'];

  본다('⛔ 흔한 말을 낱말로 세지 않는다',
    !낱말로('How and the What of it').includes('how'));
  본다('실제 낱말은 남긴다', 낱말로('Korean business segments').join(',') === 'korean,business,segments');

  const 이기는제목 = 'Korea\'s 10 largest listed companies — and why most rankings double-count Samsung';
  본다('🔴 이기는 제목은 실제 질의와 겹친다', 판정(이기는제목, 질의).갈래 === '길있음');

  const 못이기는제목 = 'How Korean companies split themselves';
  const p = 판정(못이기는제목, 질의);
  본다('🔴 「split themselves」는 찾아올 길이 없다고 잡는다', p.갈래 === '길없음', p.말.slice(0, 30));

  const 고친제목 = 'Korean companies’ business segments — half report only one';
  본다('✅ 고친 제목은 길이 생긴다', 판정(고친제목, 질의).갈래 === '길있음');

  본다('⛔ 한 낱말만 겹치면 «길 있다»고 하지 않는다',
    판정('Companies', ['largest korean companies']).갈래 === '길없음');
  본다('🔴 맞대어 볼 질의가 없으면 «못 쟀다»지 «없다»가 아니다',
    판정('아무 제목', []).갈래 === '못쟀다');
  본다('⛔ 빈 것에 안 터진다',
    판정(null, 질의).갈래 === '못쟀다' && 겹치나('x', null).length === 0);

  const 빨강 = 것.filter((x) => !x.참);
  console.log(`■ check-제목이-검색되는말인가 자가시험 ${것.length - 빨강.length}/${것.length}`);
  for (const x of 것) console.log(`  ${x.참 ? '✅' : '🔴'} ${x.이름}${x.덧 ? `  (${x.덧})` : ''}`);
  return 빨강.length === 0;
}

/* ── 진입점 ───────────────────────────────────────────────────────── */
const 내가진입점 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가진입점) {
  if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);

  /* GSC 가 알려 준 «실제 질의»를 잣대로 삼는다 */
  const 자료방 = path.join(뿌리, 'src', 'data');
  const 질의모음 = [];
  for (const f of fs.readdirSync(자료방).filter((x) => /^gsc-.*-qp-/.test(x))) {
    try {
      for (const r of (JSON.parse(fs.readFileSync(path.join(자료방, f), 'utf8')).rows) || []) {
        if (r.key) 질의모음.push(String(r.key));
      }
    } catch (e) { /* 못 읽은 것은 건너뛴다 */ }
  }
  const 질의들 = [...new Set(질의모음)];
  console.log(`■ 맞대어 볼 «실제 질의» ${질의들.length}개 (GSC 가 알려 준 것)`);
  if (!질의들.length) {
    console.log('⛔ 질의가 없다 — node scripts/fetch-gsc.mjs --모두 를 먼저 돌린다');
    process.exit(0);
  }

  /* 우리 지면의 제목을 읽는다 */
  const 볼곳 = path.join(뿌리, 'src', 'pages', 'data');
  const 결과 = [];
  for (const f of fs.readdirSync(볼곳).filter((x) => x.endsWith('.astro'))) {
    const 글 = fs.readFileSync(path.join(볼곳, f), 'utf8');
    const 제목 = (글.match(/const TITLE\s*=\s*['"`]([^'"`]+)/) || [])[1]
      || (글.match(/<h1[^>]*>([^<]+)</) || [])[1] || null;
    if (!제목) continue;
    결과.push({ f, 제목, ...판정(제목, 질의들) });
  }

  const 길없음 = 결과.filter((x) => x.갈래 === '길없음');
  console.log(`\n■ 지면 ${결과.length}개 가운데 «찾아올 길이 없는» 제목 ${길없음.length}개`);
  for (const x of 길없음) console.log(`  🔴 ${x.f.replace('.astro', '').padEnd(26)} ${x.제목.slice(0, 54)}`);

  const 길있음 = 결과.filter((x) => x.갈래 === '길있음');
  console.log(`\n  ✅ 길이 있는 제목 ${길있음.length}개 — 보기 셋`);
  for (const x of 길있음.slice(0, 3)) console.log(`     ${x.f.replace('.astro', '').padEnd(26)} ${x.말.slice(0, 60)}`);

  console.log('\n⚠ 「길이 없다」가 「나쁜 제목」이라는 뜻은 아니다 —');
  console.log('  아직 그 말로 검색된 적이 없다는 뜻이다. 새 축이면 당연히 없다.');
  console.log('  ⇒ 사람이 찾을 만한 말을 «하나는» 제목에 넣었는지 눈으로 본다.');
}
