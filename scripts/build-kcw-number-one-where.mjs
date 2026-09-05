#!/usr/bin/env node
/**
 * build-kcw-number-one-where.mjs — **「차트 1위」가 «어느 나라에서» 1위였나.**
 * ────────────────────────────────────────────────────────────────────────────
 * [🔴 왜 재나 — 이슈에 «반응»한다 (2026-09-03 20:3x)]
 *   사장님: 「공격형(이슈화, 이슈를 만드는) … 콘텐트 생산 … **이게 제일 중요해**」
 *
 *   오늘 저녁 커뮤니티·SNS 우물 664건에 이 두 제목이 반복된다 —
 *   ```
 *   'Teach You a Lesson' tops Netflix non-English chart for 2nd week
 *   'Agent Kim Reactivated' tops Netflix non-English chart for 3rd week
 *   ```
 *   ⛔ 「톱을 찍었다」는 **한 개의 세계 순위표** 이야기다. 그런데 손님이 보는 것은
 *      «자기 나라» 순위표다. **어느 나라에서 1위였는지는 아무도 안 쓴다.**
 *      우리는 나라별 표 원본을 갖고 있다.
 *
 *   ⭐ 오늘 먼저 재 둔 것이 이 자의 바탕이다 —
 *      `build-kcw-weeks-counter.mjs` 로 `누적주` 가 «연속»이 아니라 «누적»임을 확인했고,
 *      `build-kcw-demon-hunters-year.mjs` 로 「1년」이 나라마다 다름을 봤다.
 *
 * [무엇을 재나 — 한 제목마다]
 *   1. 몇 나라 표에 올랐나
 *   2. 그 가운데 «1위까지» 간 나라는 몇이고, 10위권에만 머문 나라는 몇인가
 *   3. 우리 자료에서 그 제목이 «몇 주»에 걸쳐 있나 (기사 제목의 「N주째」와 견주게)
 *   4. 한국 자신에서는 몇 위까지 갔나
 *
 * [⛔ 지키는 것]
 *   · 러시아는 뺀다 — 다른 자들과 같은 규칙
 *   · 제목은 «앞에서» 맞춘다. 오늘 `/demon\s*hunters/` 로 잡았다가
 *     `Holy Night: Demon Hunters`(딴 한국 영화)를 물고 온 적이 있다
 *   · 「1위를 못 찍었다」와 「자료에 없다」를 가른다. 뒤엣것은 «못 쟀다»다
 *   · 주 수를 나라별로 더해 「합계」라 부르지 않는다
 *
 * 쓰는 법
 *   node scripts/build-kcw-number-one-where.mjs --자가시험
 *   node scripts/build-kcw-number-one-where.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 오늘 } from './_kst.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 나라파일 = path.join(뿌리, 'archive/raw/netflix-top10/countries.ndjson');
const 낼곳 = path.join(뿌리, 'src/data/kcw-number-one-where.json');

/**
 * 오늘 우물에서 반복된 한국 제목들. ⛔ 손으로 고른 것임을 밝힌다 —
 * 우물의 제목 빈도로 골랐고, 그 빈도는 `archive/raw/community-desk/` 에 남아 있다.
 */
export const 볼제목들 = [
  { 열쇠: 'Teach You a Lesson', 왜: '우물에 7회 · 「non-English chart 2주째 1위」로 보도' },
  { 열쇠: 'Agent Kim', 왜: '우물에 5회 · 「non-English chart 3주째 1위」로 보도' },
  { 열쇠: 'Our Sticky Love', 왜: '우물에 3회 · 결말 기사가 돌았다' },
  { 열쇠: 'KPop Demon Hunters', 왜: '우물 최다 42회 — 견줄 자리로 둔다' },
];

/**
 * 제목이 그 작품인가 — «앞에서» 맞춘다.
 * 🔴 오늘 `/demon\s*hunters/i` 로 잡았다가 `Holy Night: Demon Hunters` 를 물고 왔다.
 *   그 뒤로 이 저장소의 규칙은 「앞에서 맞춘다」다.
 */
export function 제목맞나(제목, 열쇠) {
  const t = String(제목 ?? '').trim().toLowerCase();
  return t.startsWith(String(열쇠 ?? '').trim().toLowerCase());
}

/** 나라별 최고 순위에서 「1위까지 갔나」를 가른다 */
export function 일위나라세기(나라별최고) {
  let 일위 = 0; let 열위권만 = 0;
  for (const 순 of 나라별최고.values()) {
    if (순 === 1) 일위 += 1; else 열위권만 += 1;
  }
  return { 일위, 열위권만 };
}

function 자가시험() {
  let 흠 = 0; let 잰수 = 0;
  const 본다 = (이름, 참) => { 잰수 += 1; if (참) console.log(`  ✅ ${이름}`); else { console.log(`  🔴 ${이름}`); 흠 += 1; } };

  본다('제목을 앞에서 맞춘다', 제목맞나('Teach You a Lesson', 'Teach You a Lesson') === true);
  본다('대소문자를 안 가린다', 제목맞나('teach you a lesson: part 2', 'Teach You a Lesson') === true);
  /* 🔴 오늘 실제로 물고 온 꼴 — 앞에서 맞추면 안 걸린다 */
  본다('⭐ 가운데에 들어 있는 것은 안 잡는다 (Holy Night: Demon Hunters)',
    제목맞나('Holy Night: Demon Hunters', 'Demon Hunters') === false);
  본다('딴 작품은 아니라고 한다', 제목맞나('Squid Game', 'Agent Kim') === false);
  본다('빈 것을 견딘다', 제목맞나(null, 'x') === false && 제목맞나('x', null) === true);

  본다('1위 나라를 센다', (() => {
    const m = new Map([['A', 1], ['B', 1], ['C', 4]]);
    const r = 일위나라세기(m);
    return r.일위 === 2 && r.열위권만 === 1;
  })());
  본다('1위가 없으면 0 이다', 일위나라세기(new Map([['A', 3]])).일위 === 0);
  본다('빈 것은 둘 다 0', (() => {
    const r = 일위나라세기(new Map());
    return r.일위 === 0 && r.열위권만 === 0;
  })());
  본다('볼 제목이 넷이다', 볼제목들.length === 4);
  본다('제목마다 «왜 골랐나»가 적혀 있다', 볼제목들.every((x) => x.왜 && x.왜.length > 5));

  console.log(흠 ? `\n🔴 자가시험 ${잰수}가지 중 ${흠}가지 틀렸다` : `\n✅ 자가시험 ${잰수}가지 다 맞다`);
  return 흠;
}

function main() {
  const 인자 = process.argv.slice(2);
  console.log('# 「차트 1위」가 어느 나라에서 1위였나\n');
  const 흠 = 자가시험();
  if (인자.includes('--자가시험')) process.exit(흠 ? 1 : 0);
  if (흠) { console.log('\n⛔ 자가시험이 틀렸다. 재지 않는다.'); process.exit(1); }

  if (!fs.existsSync(나라파일)) {
    console.log('\n⬜ **못 쟀다** — countries.ndjson 이 없다.');
    process.exit(1);
  }

  const 모음 = new Map(볼제목들.map((x) => [x.열쇠, {
    ...x, 나라별최고: new Map(), 주: new Set(), 맞은제목: new Map(), 한국최고: null, 한국주: new Set(),
  }]));
  const 온주 = new Set();
  let 러시아뺀줄 = 0;

  for (const line of fs.readFileSync(나라파일, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    let j;
    try { j = JSON.parse(line); } catch { continue; }
    온주.add(j.주);
    if (j.국가 === 'Russia' || j.iso2 === 'RU') { 러시아뺀줄 += 1; continue; }
    for (const r of 모음.values()) {
      if (!제목맞나(j.제목, r.열쇠)) continue;
      r.맞은제목.set(j.제목, (r.맞은제목.get(j.제목) ?? 0) + 1);
      r.주.add(j.주);
      const 순 = Number(j.순위);
      if (!Number.isFinite(순)) continue;
      const 앞 = r.나라별최고.get(j.국가);
      if (앞 === undefined || 순 < 앞) r.나라별최고.set(j.국가, 순);
      if (j.국가 === 'South Korea' || j.iso2 === 'KR') {
        r.한국주.add(j.주);
        if (r.한국최고 === null || 순 < r.한국최고) r.한국최고 = 순;
      }
    }
  }

  const 자료주 = [...온주].filter(Boolean).sort();
  const 표 = [];
  for (const r of 모음.values()) {
    const { 일위, 열위권만 } = 일위나라세기(r.나라별최고);
    표.push({
      제목: r.열쇠,
      왜골랐나: r.왜,
      나라수: r.나라별최고.size,
      일위나라: 일위,
      열위권만: 열위권만,
      일위몫: r.나라별최고.size ? Math.round((일위 / r.나라별최고.size) * 1000) / 10 : null,
      주수: r.주.size,
      한국최고: r.한국최고,
      한국주수: r.한국주.size,
      맞은제목: [...r.맞은제목.entries()].map(([제목, 줄]) => ({ 제목, 줄 })).sort((a, b) => b.줄 - a.줄),
    });
  }
  표.sort((a, b) => b.일위나라 - a.일위나라);

  const 낼것 = {
    잰때: 오늘(),
    whatThisIs: 'For each title, how many countries put it at number one in their own Netflix Top 10, '
      + 'against how many carried it but never at the top, read from the raw weekly country tables.',
    whatThisIsNot: 'Not a global chart position and not a view count. Press lines like "tops the '
      + 'non-English chart for a second week" describe one worldwide list; this counts country lists. '
      + 'The two are different measurements and we do not convert between them.',
    출처: 'Netflix Top 10 weekly country tables (archive/raw/netflix-top10/countries.ndjson)',
    자료창: { 첫주: 자료주[0] ?? null, 끝주: 자료주[자료주.length - 1] ?? null },
    제목을어떻게골랐나: 'Titles repeated in our own community and news collection for 2026-09-03 '
      + '(archive/raw/community-desk/2026-09-03.json, 664 items). Chosen by frequency, not by us.',
    못잰것: [
      `자료 끝 주는 ${자료주[자료주.length - 1] ?? '?'} 다. 그 뒤 주는 «못 쟀다».`,
      '기사가 말하는 「N주째 1위」는 세계 순위표의 수다. 우리는 그 표를 갖고 있지 않다 — 나라별 표만 있다.',
      '자료에 없는 제목(Perfect Crown · Mousetrap)은 「1위를 못 찍었다」가 아니라 «못 쟀다»다.',
      '러시아는 빼고 셌다.',
    ],
    러시아뺀줄,
    표,
  };

  fs.writeFileSync(낼곳, JSON.stringify(낼것, null, 2));

  console.log(`\n자료 창 ${낼것.자료창.첫주} ~ ${낼것.자료창.끝주}\n`);
  for (const x of 표) {
    console.log(`■ ${x.제목}`);
    console.log(`     나라 ${x.나라수} · 1위까지 간 나라 ${x.일위나라} (${x.일위몫}%) · 10위권에만 머문 나라 ${x.열위권만}`);
    console.log(`     우리 자료에서 ${x.주수}주에 걸쳐 있다 · 한국 ${x.한국최고 ? x.한국최고 + '위 · ' + x.한국주수 + '주' : '⬜ 표에 없다'}`);
    for (const m of x.맞은제목) console.log(`     └ 맞은 제목 ${m.줄}줄  ${m.제목}`);
  }
  console.log(`\n  냈다 — ${path.relative(뿌리, 낼곳)}`);
}

if (process.argv[1] && process.argv[1].endsWith('build-kcw-number-one-where.mjs')) main();
