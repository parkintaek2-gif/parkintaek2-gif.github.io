#!/usr/bin/env node
/**
 * build-kcw-alongside.mjs — **「이거 다음에 뭐 봐?」에 «추천» 대신 «사실»로 답한다.**
 *
 * ── 왜 만드나 (2026-08-30 15:2x · 5번) ──────────────────────
 * 자동완성으로 재 보니 손님이 실제로 치는 말 가운데 이런 것들이 컸다 —
 * ```
 * what to watch after squid game   자동완성 1번째 · 그 말로 시작하는 줄 6
 * korean shows like squid game     자동완성 1번째 · 그 말로 시작하는 줄 4
 * where was squid game filmed      자동완성 1번째 · 9줄   ⛔ 우리에게 촬영지 자료가 없다 — 안 한다
 * ```
 * ⭐ 앞의 둘은 **우리가 가진 것으로 답할 수 있다.** 넷플릭스 주간 톱10 원자료가
 *   나라 × 주 × 순위로 501,040 행 있다.
 *
 * ── 🔴 그런데 이것은 «추천»이 되기 쉬운 자리다. 그래서 못박는다 ──
 * 회사 강령 — 「**우리가 바늘을 세우지 않는다.** 지형을 그려 놓고, 바늘은 보는 사람이 세운다」
 * 「⛔ 『이렇게 하세요』는 조언이다 · ✅ 『N명 중 M명이 그렇게 했다』는 사실이다」
 *
 * ⛔ 그래서 이 자는 **「비슷한 작품」이나 「추천작」을 만들지 않는다.** 닮음을 재지 않는다.
 * ✅ 이 자가 세는 것은 딱 하나다 —
 *   **「그 작품이 그 나라 그 주에 톱10에 있을 때, 같은 목록에 함께 있던 다른 한국 작품」**
 *   그것이 몇 «나라-주»였는지를 센다. 취향이 아니라 **같은 칸에 있었던 횟수**다.
 *
 * ⚠ 이것이 뜻하는 것과 «안» 뜻하는 것을 지면에도 적는다 —
 *   ✅ 뜻한다   같은 나라 같은 주에 두 작품이 나란히 톱10 안에 있었다
 *   ⛔ 안 뜻한다 그 사람들이 «둘 다 봤다» · 그 작품이 «비슷하다» · 그것이 «다음에 볼 것»이다
 *
 * ── ⛔ 이 자가 더 지키는 것 ──────────────────────────────────
 * ⛔ 한국 작품인지는 **우리 표(974편)에 있는 것**으로만 가른다. 제목만 보고 안 정한다.
 * ⛔ 자기 자신은 안 센다.
 * ⛔ 함께 있은 «나라-주»가 적은 것은 낸다 해도 «적다»고 같이 적는다. 수를 숨기지 않는다.
 * ⛔ 원자료가 없으면 **못 쟀다**고 말하고 멈춘다. 빈 표를 내지 않는다.
 *
 * 쓰는 법
 *   node scripts/build-kcw-alongside.mjs --자가시험
 *   node scripts/build-kcw-alongside.mjs            src/data/kcw-alongside.json 을 낸다
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 원자료방 = path.join(뿌리, 'archive/raw/netflix-top10');
const 표길 = path.join(뿌리, 'src/data/wikitip-title-pages.json');
const 낼길 = path.join(뿌리, 'src/data/kcw-alongside.json');

/** 가장 최근 나라별 원자료를 고른다. ⛔ 없으면 null — 빈 표를 만들지 않는다 */
export function 최신원자료(파일들) {
  const 것 = (파일들 ?? []).filter((f) => /^countries-\d{4}-\d{2}-\d{2}\.tsv$/.test(f));
  if (!것.length) return null;
  return 것.sort().at(-1);
}

/** TSV 한 줄을 칸으로. ⛔ 칸 수가 안 맞으면 null — 조용히 밀려 읽지 않는다 */
export function 줄가르기(줄, 칸수) {
  if (typeof 줄 !== 'string' || !줄) return null;
  const c = 줄.split('\t');
  return c.length === 칸수 ? c : null;
}

/**
 * **함께 있었던 것**을 센다. 이 자의 알맹이다.
 * @param 칸 Map<`${iso2}|${week}`, Set<제목>>
 * @returns Map<제목, Map<함께있던제목, 나라주수>>
 */
export function 함께센다(칸, 우리것) {
  const 셈 = new Map();
  for (const 있던것 of 칸.values()) {
    const 목록 = [...있던것].filter((t) => 우리것.has(t));
    if (목록.length < 2) continue;          /* 혼자 있었으면 함께 있은 것이 없다 */
    for (const a of 목록) {
      if (!셈.has(a)) 셈.set(a, new Map());
      const 내것 = 셈.get(a);
      for (const b of 목록) {
        if (a === b) continue;              /* ⛔ 자기 자신은 안 센다 */
        내것.set(b, (내것.get(b) ?? 0) + 1);
      }
    }
  }
  return 셈;
}

/** 낼 만한 것으로 추린다. ⛔ 수를 «숨기지» 않는다 — 적으면 적다고 같이 낸다 */
export function 추리기(내것, 몇개 = 12) {
  return [...(내것 ?? new Map())]
    .sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0]))
    .slice(0, 몇개)
    .map(([제목, 나라주]) => ({ 제목, 나라주 }));
}

/* ── 자가시험 ───────────────────────────────────────────────── */
export function 자가시험() {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  검('가장 최근 원자료를 고른다',
    최신원자료(['countries-2026-08-23.tsv', 'countries-2026-08-29.tsv']) === 'countries-2026-08-29.tsv');
  검('⛔ 없으면 null — 빈 표를 안 만든다', 최신원자료([]) === null && 최신원자료(null) === null);
  검('엉뚱한 파일은 안 고른다', 최신원자료(['global-2026-08-29.tsv', 'readme.md']) === null);

  검('칸이 맞으면 가른다', 줄가르기('a\tb\tc', 3)?.length === 3);
  검('🔴 칸 수가 다르면 null — 밀려 읽으면 나라가 제목이 된다', 줄가르기('a\tb', 3) === null);
  검('⛔ 빈 줄은 null', 줄가르기('', 3) === null && 줄가르기(null, 3) === null);

  const 우리것 = new Set(['A', 'B', 'C']);
  const 칸 = new Map([
    ['KR|2026-01-01', new Set(['A', 'B', '남의것'])],
    ['JP|2026-01-01', new Set(['A', 'B'])],
    ['US|2026-01-01', new Set(['A', 'C'])],
    ['FR|2026-01-01', new Set(['A'])],
  ]);
  const 셈 = 함께센다(칸, 우리것);
  검('⭐ 같은 칸에 있은 나라-주를 센다', 셈.get('A').get('B') === 2);
  검('한 번만 겹친 것은 1', 셈.get('A').get('C') === 1);
  검('⛔ 자기 자신은 안 센다', 셈.get('A').get('A') === undefined);
  검('⛔ 우리 표에 없는 작품은 안 센다', 셈.get('A').get('남의것') === undefined);
  검('⛔ 혼자 있던 칸은 아무것도 안 만든다', !셈.has('FR'));
  검('B 쪽에서도 A 가 2 로 보인다 — 셈이 대칭이다', 셈.get('B').get('A') === 2);

  const 추린것 = 추리기(셈.get('A'), 12);
  검('많이 겹친 것이 앞에 온다', 추린것[0].제목 === 'B' && 추린것[0].나라주 === 2);
  검('수를 같이 낸다 — 숨기지 않는다', 추린것.every((r) => Number.isFinite(r.나라주)));
  검('몇 개만 달라면 그만큼만', 추리기(셈.get('A'), 1).length === 1);
  검('⛔ 없는 것을 주면 빈 배열 — 죽지 않는다', 추리기(null).length === 0);

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
  console.log('✅ 함께 있던 것 세는 자 — 자가시험 16 통과');
  process.exit(0);
}

if (내가실행됐다) {
  let 파일들 = [];
  try { 파일들 = fs.readdirSync(원자료방); } catch { /* 없다 */ }
  const 고른것 = 최신원자료(파일들);
  if (!고른것) {
    console.log('⬜ **못 쟀다** — 넷플릭스 주간 원자료가 없다.');
    console.log(`   있어야 할 곳: ${path.relative(뿌리, 원자료방)}\\countries-YYYY-MM-DD.tsv`);
    console.log('   ⛔ 빈 표를 내지 않는다.');
    process.exit(1);
  }

  const 표 = JSON.parse(fs.readFileSync(표길, 'utf8'));
  /* 🔴 [2026-08-30] 처음에 `Object.values(표).find(Array.isArray)` 만 썼다가
     **엉뚱한 한 칸짜리 배열**을 집어 「우리 표 1편」이 나왔다. 그러면 아래가 전부 0 이 된다.
     ⚠ 0 이 나왔을 때 「한국 작품이 안 겹치는구나」로 읽었으면 그대로 틀린 결론을 냈다.
     ⛔ 이름 있는 자리를 «먼저» 본다. 못 찾으면 세운다 — 조용히 딴것을 집지 않는다. */
  const 작품들 = Array.isArray(표) ? 표 : (표.titles ?? 표.rows ?? 표.items ?? null);
  if (!Array.isArray(작품들) || 작품들.length < 100) {
    console.log('⬜ **못 쟀다** — 작품 표를 못 읽었다(생김새가 달라졌다).');
    console.log(`   본 것: ${Array.isArray(작품들) ? `${작품들.length}편` : typeof 작품들}`
      + ` · 맨 위 열쇠: ${Object.keys(표).slice(0, 6).join(', ')}`);
    process.exit(1);
  }
  /* ⛔ 한국 작품인지는 «우리 표»로만 가른다. 제목 생김새로 안 정한다 */
  const 우리것 = new Map(작품들.map((t) => [t.title, t]));
  const 지면있는것 = new Set(작품들.filter((t) => t.hasPage).map((t) => t.title));

  console.log(`원자료 ${고른것} 를 읽는다 — 우리 표 ${우리것.size}편 (지면 있는 것 ${지면있는것.size}편)`);

  const 글 = fs.readFileSync(path.join(원자료방, 고른것), 'utf8');
  const 줄들 = 글.split('\n');
  const 머리 = 줄가르기(줄들[0].replace(/\r$/, ''), 8);
  if (!머리 || 머리[5] !== 'show_title') {
    console.log('⬜ **못 쟀다** — 원자료의 칸 생김새가 달라졌다. 조용히 밀려 읽지 않는다.');
    console.log(`   본 머리: ${줄들[0].slice(0, 120)}`);
    process.exit(1);
  }

  const 칸 = new Map();
  let 읽은줄 = 0;
  let 못읽은줄 = 0;
  for (let i = 1; i < 줄들.length; i += 1) {
    const c = 줄가르기(줄들[i].replace(/\r$/, ''), 8);
    if (!c) { if (줄들[i].trim()) 못읽은줄 += 1; continue; }
    읽은줄 += 1;
    const 제목 = c[5];
    if (!우리것.has(제목)) continue;              /* 한국 작품만 담는다 */
    const 열쇠 = `${c[1]}|${c[2]}`;
    if (!칸.has(열쇠)) 칸.set(열쇠, new Set());
    칸.get(열쇠).add(제목);
  }
  console.log(`  읽은 줄 ${읽은줄.toLocaleString()} · 못 읽은 줄 ${못읽은줄}`
    + ` · 한국 작품이 든 나라-주 칸 ${칸.size.toLocaleString()}`);

  const 셈 = 함께센다(칸, new Set(우리것.keys()));

  const 낼것 = [];
  for (const 제목 of 지면있는것) {
    const 내것 = 셈.get(제목);
    if (!내것 || !내것.size) continue;
    const 원본 = 우리것.get(제목);
    const 함께 = 추리기(내것, 12)
      .filter((r) => 지면있는것.has(r.제목))          /* 갈 곳이 있는 것만 잇는다 */
      .map((r) => ({ ...r, slug: 우리것.get(r.제목)?.slug ?? null }))
      .filter((r) => r.slug);
    if (!함께.length) continue;
    낼것.push({
      title: 제목, slug: 원본.slug, type: 원본.type,
      markets: 원본.markets, peak: 원본.peak, weeks: 원본.weeks,
      함께있던나라주합: [...내것.values()].reduce((n, v) => n + v, 0),
      함께있던편수: 내것.size,
      함께,
    });
  }
  낼것.sort((a, b) => b.함께있던나라주합 - a.함께있던나라주합);

  /*
   * ⭐ [2026-08-30 17:3x] **반대쪽도 센다** — 한 번도 다른 한국 작품과 목록을 나눠 본 적 없는 작품.
   *   `/what-to-watch-after` 가 「누구 옆에 있었나」라면 이쪽은 「끝까지 혼자였다」다.
   * ⛔ 이것을 「인기가 없었다」로 읽으면 안 된다. 오히려 **아무도 없는 나라·주에 혼자 들어간 것**이다.
   *   그 나라 그 주에 한국 작품이 그것 하나뿐이었다는 뜻이다.
   * ⚠ 지면이 있는 작품만 센다 — 지면이 없으면 손님이 갈 곳이 없다.
   */
  const 혼자였던것 = [];
  for (const 제목 of 지면있는것) {
    if (셈.has(제목) && 셈.get(제목).size) continue;
    const t = 우리것.get(제목);
    /* ⛔ 차트에 아예 안 오른 것은 «혼자였던 것»이 아니다. 잰 적이 없는 것이다 */
    if (!t || !Number.isFinite(t.markets) || t.markets < 1) continue;
    혼자였던것.push({
      title: 제목, slug: t.slug, type: t.type,
      markets: t.markets, weeks: t.weeks, peak: t.peak, places: t.places,
      firstWeek: t.firstWeek, lastWeek: t.lastWeek,
    });
  }
  혼자였던것.sort((a, b) => b.weeks - a.weeks || b.markets - a.markets);

  fs.writeFileSync(낼길, `${JSON.stringify({
    잰날: new Date().toISOString(),
    원자료: 고른것,
    읽은줄, 못읽은줄,
    한국작품이든칸: 칸.size,
    지면있는작품: 지면있는것.size,
    낸작품: 낼것.length,
    혼자였던편수: 혼자였던것.length,
    뜻하는것: '같은 나라 같은 주에 두 작품이 나란히 넷플릭스 톱10 안에 있었던 횟수',
    안뜻하는것: ['같은 사람이 둘 다 봤다', '두 작품이 비슷하다', '다음에 볼 것이다'],
    작품: 낼것,
    혼자였던것,
  }, null, 1)}\n`);

  console.log(`\n✅ 낸 작품 ${낼것.length}편 → ${path.relative(뿌리, 낼길)}`);
  console.log('\n  가장 많이 «함께 있었던» 짝 열 —');
  for (const t of 낼것.slice(0, 10)) {
    const 첫 = t.함께[0];
    console.log(`    ${t.title.padEnd(34).slice(0, 34)} ↔ ${첫.제목.padEnd(30).slice(0, 30)} ${String(첫.나라주).padStart(4)} 나라-주`);
  }
  console.log('\n⛔ 이 수는 «추천»이 아니다. 같은 칸에 있었던 횟수다.');
}
