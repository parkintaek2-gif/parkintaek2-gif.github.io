#!/usr/bin/env node
/**
 * measure-school-reach.mjs — **학교와 「넷플릭스에서 얼마나 멀리 갔나」를 잇는다.** (5번, 2026-08-28)
 *
 * ── 무엇을 재나 ────────────────────────────────────────────────
 * 우리에게 두 자료가 따로 있었다 —
 *   ① 사람 → 학교        `archive/raw/wikidata/korean-entertainers-school.json` (4,535명)
 *   ② 사람 → 넷플릭스 도달 `src/data/wikitip-people.json` (636명 · 작품별 나라 수·자리 수)
 * 둘을 **이어 본 적이 없다.** 이으면 「이 학교를 나온 사람의 작품이 몇 나라까지 갔나」가 나온다.
 *
 * ⚠ 잇는 열쇠는 **위키데이터 번호(q)** 다. 이름으로 잇지 않는다 —
 *   2026-08-27 에 이름으로 이으려다 BLACKPINK 로제가 «영문 이름이 없어» 통째로 빠졌다.
 *
 * ── ⛔ 이 자가 «하지 않는» 말 ──────────────────────────────────
 * ⛔ 「이 학교에 가면 성공한다」 — 인과가 아니다. 학교가 사람을 뽑은 것인지
 *   사람이 학교를 고른 것인지 이 자료로는 못 가른다. **분포를 보여 줄 뿐이다.**
 * ⛔ **평균을 쓰지 않는다.** 오징어게임 하나가 3,228자리다 —
 *   그 한 편이 낀 학교는 평균이 통째로 끌려간다. **가운데값**으로 본다.
 * ⛔ 사람이 적은 학교를 줄 세우지 않는다. `--최소`(기본 5명) 아래는 «못 잼»이다.
 *
 * ⭐ 그리고 **한 사람 빼기(leave-one-out)** 를 같이 낸다 — 가장 큰 한 사람을 빼도
 *   그 학교가 그 자리에 남는지 본다. 안 남으면 그것은 «학교»가 아니라 «그 한 사람»이다.
 *
 * 쓰는 법
 *   node scripts/measure-school-reach.mjs --자가시험
 *   node scripts/measure-school-reach.mjs --잰다 [--최소=5] [--적는다=src/data/kcw-school-reach.json]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

/** 가운데값. ⛔ 빈 목록은 0 이 아니라 null 이다 — 「아무도 없다」와 「0이다」는 다르다 */
export function 가운데값(수들) {
  const xs = (수들 ?? []).filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (xs.length === 0) return null;
  const m = Math.floor(xs.length / 2);
  return xs.length % 2 ? xs[m] : (xs[m - 1] + xs[m]) / 2;
}

/**
 * 한 사람을 빼고 다시 잰다 — «가장 큰 한 사람»을 뺀 가운데값.
 * 🔴 이것이 이 자의 안전장치다. 한 사람이 만든 수를 학교의 수로 말하지 않는다.
 */
export function 가장큰한사람빼고(수들) {
  const xs = (수들 ?? []).filter((x) => Number.isFinite(x)).sort((a, b) => b - a);
  if (xs.length <= 1) return null;          // 한 명뿐이면 뺄 것이 없다
  return 가운데값(xs.slice(1));
}

/** 한 사람의 «도달» — 작품들이 닿은 나라를 «겹치지 않게» 센다 */
export function 사람도달(사람) {
  const 나라들 = new Set();
  let 자리합 = 0;
  for (const t of 사람?.titles ?? []) {
    if (Number.isFinite(t?.markets)) 나라들.add(`${t.slug}:${t.markets}`);
    if (Number.isFinite(t?.places)) 자리합 += t.places;
  }
  /* ⚠ 작품마다 나라 수는 알지만 «어느 나라인지»는 이 자료에 없다.
     그래서 나라를 합집합으로 못 센다 — **가장 넓게 간 작품 하나**로 대신한다.
     ⛔ 나라 수를 더하면 같은 나라를 여러 번 세게 된다. 그건 거짓 수다. */
  const 가장넓은 = Math.max(0, ...(사람?.titles ?? []).map((t) => Number(t?.markets) || 0));
  return { 가장넓은나라수: 가장넓은, 자리합, 작품수: (사람?.titles ?? []).length };
}

if (내가실행됐다 && process.argv.includes('--자가시험')) {
  let 통 = 0; const 실 = [];
  const 검 = (이름, 참) => { if (참) 통 += 1; else 실.push(이름); };

  검('홀수 개의 가운데값', 가운데값([1, 5, 3]) === 3);
  검('짝수 개는 두 개의 평균', 가운데값([1, 3, 5, 7]) === 4);
  /* ⛔ 빈 것을 0 으로 만들지 않는다 */
  검('빈 목록은 null', 가운데값([]) === null && 가운데값(null) === null);
  검('숫자 아닌 것은 버린다', 가운데값([1, '가', 3]) === 2);

  /* 🔴 봉우리 하나가 평균을 끌어가는 실제 모양 — 오징어게임 3,228자리 */
  const 봉우리있음 = [10, 12, 15, 20, 3228];
  검('가운데값은 봉우리에 안 끌린다', 가운데값(봉우리있음) === 15);
  /* ⚠ 손으로 12.5 라고 적었다가 틀렸다. [10,12,15,20] 의 가운데값은 (12+15)/2 = 13.5 다.
     자가 아니라 «시험»이 틀린 자리였다 — 2026-08-27 에도 같은 데 걸렸다.
     ⭐ 기대값을 손으로 적을 때는 종이에 한 번 세어 본다. */
  검('가장 큰 하나를 빼면 더 낮아진다', 가장큰한사람빼고(봉우리있음) === 13.5);
  검('빼기 전보다 낮다', 가장큰한사람빼고(봉우리있음) < 가운데값(봉우리있음));
  검('한 명뿐이면 뺄 것이 없다', 가장큰한사람빼고([5]) === null);
  검('빈 것도 안 죽는다', 가장큰한사람빼고([]) === null && 가장큰한사람빼고(null) === null);

  const p = { titles: [{ slug: 'a', markets: 93, places: 3228 }, { slug: 'b', markets: 40, places: 619 }] };
  검('가장 넓게 간 작품을 쓴다', 사람도달(p).가장넓은나라수 === 93);
  /* ⛔ 나라 수를 더하면 같은 나라를 두 번 센다 */
  검('나라 수를 더하지 않는다', 사람도달(p).가장넓은나라수 !== 133);
  검('자리는 더해도 된다', 사람도달(p).자리합 === 3847);
  검('작품이 없으면 0 이다', 사람도달({ titles: [] }).가장넓은나라수 === 0);
  검('빈 것도 안 죽는다', 사람도달(null).작품수 === 0);

  if (실.length) { console.error(`❌ 자가시험 ${실.length}건 실패\n${실.map((s) => `   · ${s}`).join('\n')}`); process.exit(1); }
  console.log(`✅ 학교와 도달을 잇는 자 — 자가시험 ${통}개 통과`);
  process.exit(0);
}

if (내가실행됐다 && process.argv.includes('--잰다')) {
  const 최소 = Number((process.argv.find((a) => a.startsWith('--최소='))?.split('=')[1]) ?? 5);
  const 학교길 = path.join(뿌리, 'archive/raw/wikidata/korean-entertainers-school.json');
  const 사람길 = path.join(뿌리, 'src/data/wikitip-people.json');
  for (const p of [학교길, 사람길]) {
    if (!fs.existsSync(p)) { console.error(`⛔ ${path.relative(뿌리, p)} 이 없다`); process.exit(1); }
  }
  const 학교자료 = JSON.parse(fs.readFileSync(학교길, 'utf8'));
  const 사람자료 = JSON.parse(fs.readFileSync(사람길, 'utf8'));

  /* ① q → 사람 */
  const q로사람 = new Map();
  let q없는사람 = 0;
  for (const p of 사람자료.people ?? []) {
    if (!p.q) { q없는사람 += 1; continue; }
    q로사람.set(p.q, p);
  }

  /* ② 학교 → 그 학교 사람들 중 «도달을 아는» 사람 */
  const 학교별 = new Map();
  for (const 줄 of 학교자료.사람 ?? []) {
    const p = q로사람.get(줄.q);
    if (!p) continue;                       // 도달을 모르는 사람 — 셈에서 뺀다
    for (const s of 줄.schools ?? []) {
      if (!s?.slug) continue;
      const cur = 학교별.get(s.slug) ?? { 이름: s.name, slug: s.slug, 사람: [] };
      cur.사람.push({ 이름: p.name, slug: p.slug, ...사람도달(p) });
      학교별.set(s.slug, cur);
    }
  }

  console.log('■ 학교 × 넷플릭스 도달 — 두 자료를 «위키데이터 번호»로 이었다');
  console.log(`  학교 자료 ${(학교자료.사람 ?? []).length}명 · 도달 자료 ${(사람자료.people ?? []).length}명`);
  console.log(`  이어진 학교 ${학교별.size}곳 · 판정 바닥값 ${최소}명\n`);
  if (q없는사람) console.log(`  ⚠ 도달 자료에서 위키데이터 번호가 없어 못 이은 사람 ${q없는사람}명\n`);

  const 줄들 = [];
  for (const [, v] of 학교별) {
    const 나라수들 = v.사람.map((x) => x.가장넓은나라수);
    줄들.push({
      학교: v.이름, slug: v.slug, 사람수: v.사람.length,
      가운데나라수: 가운데값(나라수들),
      한사람빼고: 가장큰한사람빼고(나라수들),
      가장넓은사람: v.사람.slice().sort((a, b) => b.가장넓은나라수 - a.가장넓은나라수)[0] ?? null,
    });
  }

  const 잴수있는것 = 줄들.filter((r) => r.사람수 >= 최소).sort((a, b) => b.가운데나라수 - a.가운데나라수);
  const 못재는것 = 줄들.filter((r) => r.사람수 < 최소);

  console.log(`  ${'학교'.padEnd(34)} ${'사람'.padStart(4)} ${'가운데'.padStart(6)} ${'한사람빼고'.padStart(9)}  가장 넓게 간 사람`);
  for (const r of 잴수있는것) {
    console.log(`  ${r.학교.slice(0, 34).padEnd(34)} ${String(r.사람수).padStart(4)}`
      + ` ${String(r.가운데나라수).padStart(6)} ${String(r.한사람빼고 ?? '-').padStart(9)}`
      + `  ${r.가장넓은사람?.이름 ?? '-'} (${r.가장넓은사람?.가장넓은나라수 ?? '-'})`);
  }

  console.log(`\n  ⛔ 사람이 ${최소}명 아래라 «못 잼»으로 둔 학교 ${못재는것.length}곳 — 줄 세우지 않았다.`);
  console.log('  ⛔ 이 표는 「이 학교에 가면 멀리 간다」는 뜻이 아니다. 인과를 못 가린다.');
  console.log('  ⚠ 「가운데」는 그 학교 사람들이 «가장 넓게 간 작품»의 나라 수의 가운데값이다.');
  console.log('  ⚠ 「한사람빼고」가 «가운데»보다 많이 낮으면 그 학교의 수는 «한 사람»이 만든 것이다.');

  const 적는곳 = (process.argv.find((a) => a.startsWith('--적는다='))?.split('=')[1]) ?? null;
  if (적는곳) {
    fs.writeFileSync(path.join(뿌리, 적는곳), JSON.stringify({
      잰때: new Date().toISOString().slice(0, 10),
      무엇: '학교별로, 그 학교 사람들의 작품이 가장 넓게 간 나라 수의 가운데값',
      '⛔ 아닌 것': '이 학교에 가면 멀리 간다는 뜻이 아니다. 인과를 못 가린다.',
      최소인원: 최소, 학교수: 학교별.size,
      잴수있는것, 못재는것수: 못재는것.length,
      /**
       * 🔴🔴 [2026-08-29] **적은 쪽을 «버리고» 있었다. 수만 남기고 내용을 지웠다.**
       *
       * AI 인용을 재다 알았다 — 학교 낱장 55장 중 32장이 도달을 못 써서 «모두 똑같은»
       * 설명문(「Wikidata records a school for 4,535 of 9,249」)을 달고 있었다.
       * 그런데 그 학교들도 1~4명은 «재어 놓았다». 연세대는 명부 75명 중 몇 명의 작품이
       * 실제로 차트에 들었는지 우리가 안다. 그것을 버리고 있었다.
       *
       * ⛔ 「못 쟀다」와 「재 봤는데 적었다」는 «다른 말»이다. 뒤엣것은 그 자체가 사실이다.
       * ⚠ 다만 1~4명의 «가운데값»은 못 미더우니 내지 않는다. 대신 «세는 것»만 낸다 —
       *    「몇 사람의 작품이 차트에 들었나」와 「그중 가장 넓게 간 것은 몇 나라인가」.
       *    세는 것은 표본이 작아도 참말이다.
       */
      적게잰것: 못재는것
        .map((r) => ({
          학교: r.학교,
          slug: r.slug,
          사람수: r.사람수,
          가장넓은사람: r.가장넓은사람,
          '⚠': `${r.사람수}명만 재었다 — 가운데값을 내지 않는다`,
        }))
        .sort((a, b) => b.사람수 - a.사람수),
    }, null, 1));
    console.log(`\n✅ 적었다 — ${적는곳}`);
  } else {
    console.log('\n⚠ 아직 안 적었다. 적으려면 --적는다=src/data/kcw-school-reach.json');
  }
}

/**
 * 🔴🔴 [2026-08-29] **인자 없이 부르면 «조용히» 끝나고 있었다.**
 * 오늘 새벽 `check-daily-shipping.mjs` 에서 고친 것과 «같은 병»이다. 한 자에서 고쳤다고
 * 끝난 것이 아니었다 — 같은 결함이 다른 자에도 있었고, 방금 내가 또 거기 걸렸다
 * (`--적는다` 만 주고 `--잰다` 를 빠뜨려 아무 일도 안 일어났는데 종료코드는 0 이었다).
 * ⛔ 다음 사람은 그 침묵을 「잴 것이 없구나」로 읽는다.
 */
if (내가실행됐다 && !process.argv.includes('--잰다') && !process.argv.includes('--자가시험')) {
  console.log('⛔ 아무것도 안 쟀습니다 — 무엇을 할지 안 알려 주셨습니다.\n');
  console.log('쓰는 법');
  console.log('  node scripts/measure-school-reach.mjs --잰다');
  console.log('  node scripts/measure-school-reach.mjs --잰다 --적는다=src/data/kcw-school-reach.json');
  console.log('  node scripts/measure-school-reach.mjs --자가시험\n');
  console.log('⚠ `--적는다` 만 줘도 «아무 일도 안 일어납니다». --잰다 가 있어야 합니다.');
  process.exit(2);
}
