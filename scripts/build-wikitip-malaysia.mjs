#!/usr/bin/env node
/**
 * **말레이시아만 다르다** (`/malaysia`) — 84편째 기사의 표.
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 *   어제 셋을 나란히 놓고 보니 말레이시아 칸이 계속 어긋났다.
 *   사람은 어느 무리든 **7~8.6%** 인데 브랜드만 **23%** 다. 그 나라만 그렇다.
 *   ⭐ 「작은 나라라 다 작다」가 아니다 — **작은 것이 아니라 다른 것을 본다.**
 *
 * ── ⛔ 이 지면이 지키는 것 ────────────────────────────────────
 * ⛔ 「왜 그런가」를 지어내지 않는다. 우리가 잰 것은 **그렇다**까지다.
 * ⛔ 말레이시아를 다른 셋과 견줄 때 **밑값을 나눈 뒤에** 견준다. 안 그러면 편만 잰다.
 * ⛔ 광고 자리를 만들지 않는다. Riot Production(App 866800) 승인 전이다.
 * ⚠ 인구가 아니라 **위키백과 크기**로 나눈다. 우리는 독자를 재지 국민을 재지 않는다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 지금 } from './_kst.mjs';

const 견줌길 = 'src/data/wikitip-fame-compare.json';
const 선수길 = 'archive/raw/wikipedia/sea-athletes.json';
const 가수길 = 'archive/raw/wikipedia/sea-musicians.json';
const 배우길 = 'archive/raw/wikipedia/sea-actors.json';
const 브랜드길 = 'archive/raw/wikipedia/sea-brands.json';
const 결과 = 'src/data/wikitip-malaysia.json';
const 나 = 'ms';
const 판들 = ['id', 'vi', 'th', 'ms'];
const 나라이름 = { id: 'Indonesia', vi: 'Vietnam', th: 'Thailand', ms: 'Malaysia' };

/**
 * ⭐ 한 사람이 **말레이시아에 얼마나 쏠렸나.** 네 나라 합에서 말레이시아 몫.
 *   ⛔ 못 잰 사람은 뺀다. 넷을 다 잰 사람만 견준다 — 셋만 잰 사람은 몫이 부풀어 오른다.
 */
export function 말레이몫(줄) {
  const 값 = 판들.map((p) => 줄.perMillion?.[p]);
  if (값.some((v) => typeof v !== 'number')) return null;
  const 합 = 값.reduce((a, b) => a + b, 0);
  if (!합) return null;
  return +((100 * 줄.perMillion[나]) / 합).toFixed(1);
}

/** 말레이시아가 유독 많이 보는 이름들 — 몫이 큰 순 */
export function 말레이가더보는것(줄들, 최소 = 3, n = 12) {
  return 줄들
    .map((x) => ({ 줄: x, 몫: 말레이몫(x) }))
    .filter((x) => x.몫 !== null && (x.줄.seaPerMillionTotal ?? 0) >= 최소)
    .sort((a, b) => b.몫 - a.몫)
    .slice(0, n)
    .map(({ 줄, 몫 }) => ({
      name: 줄.name,
      malaysiaSharePc: 몫,
      total: 줄.seaPerMillionTotal,
      perMillion: Object.fromEntries(판들.map((p) => [p, 줄.perMillion[p] ?? null])),
      views: Object.fromEntries(판들.map((p) => [p, 줄.views?.[p] ?? null])),
    }));
}

/** 한 무리 전체의 말레이시아 몫 */
export function 무리몫(줄들) {
  const 합 = Object.fromEntries(판들.map((p) => [p, 0]));
  for (const x of 줄들) {
    for (const p of 판들) {
      const v = x.perMillion?.[p];
      if (typeof v === 'number') 합[p] += v;
    }
  }
  const 총 = Object.values(합).reduce((a, b) => a + b, 0);
  return 총 ? +((100 * 합[나]) / 총).toFixed(1) : null;
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    const ok = typeof 바람 === 'function' ? 바람(실제) : JSON.stringify(실제) === JSON.stringify(바람);
    if (ok) 통 += 1; else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  재본다('말레이몫 — 고르면 25%',
    말레이몫({ perMillion: { id: 10, vi: 10, th: 10, ms: 10 } }), 25);
  재본다('말레이몫 — 말레이시아뿐이면 100%',
    말레이몫({ perMillion: { id: 0, vi: 0, th: 0, ms: 5 } }), 100);
  재본다('⛔ 못 잰 칸이 있으면 null — 셋만 재면 몫이 부푼다',
    말레이몫({ perMillion: { id: 10, vi: null, th: 10, ms: 10 } }), null);
  재본다('말레이몫 — 다 0 이면 null(0 이 아니다)',
    말레이몫({ perMillion: { id: 0, vi: 0, th: 0, ms: 0 } }), null);
  const 셋 = [
    { name: 'A', seaPerMillionTotal: 40, perMillion: { id: 5, vi: 5, th: 5, ms: 25 }, views: {} },
    { name: 'B', seaPerMillionTotal: 40, perMillion: { id: 10, vi: 10, th: 10, ms: 10 }, views: {} },
    { name: '작은것', seaPerMillionTotal: 1, perMillion: { id: 0, vi: 0, th: 0, ms: 1 }, views: {} },
  ];
  재본다('말레이가더보는것 — 몫이 큰 순', 말레이가더보는것(셋).map((x) => x.name), ['A', 'B']);
  재본다('⛔ 너무 작은 것은 뺀다 — 한 번 읽힌 것이 100% 로 올라온다',
    말레이가더보는것(셋).some((x) => x.name === '작은것'), false);
  /* ⚠ 시험 자료의 셋째 줄은 말레이시아만 1 이라 무리몫이 25% 가 안 된다.
     처음에 `slice(0,2)` 로 잘라 놓고 셋째가 안 든다고 여겼는데, 든 것은 A·B 였고
     둘의 합이 이미 안 고르다. **고른 자료를 따로 만든다** */
  재본다('무리몫 — 고르면 25%', 무리몫([
    { perMillion: { id: 10, vi: 10, th: 10, ms: 10 } },
    { perMillion: { id: 5, vi: 5, th: 5, ms: 5 } },
  ]), 25);
  재본다('무리몫 — 한 사람이 쏠려도 무리 전체로 센다', 무리몫(셋.slice(0, 2)), (v) => v > 25);
  재본다('무리몫 — 빈 것은 null', 무리몫([]), null);
  재본다('판 넷', 판들.length, 4);
  console.log(`말레이시아 짓는 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  for (const p of [견줌길, 선수길, 가수길, 배우길, 브랜드길]) {
    if (!fs.existsSync(p)) { console.error(`⛔ 없다 — ${p}`); process.exit(1); }
  }
  const 견줌 = JSON.parse(fs.readFileSync(견줌길, 'utf8'));
  const 선수자료 = JSON.parse(fs.readFileSync(선수길, 'utf8'));
  const 가수자료 = JSON.parse(fs.readFileSync(가수길, 'utf8'));
  const 배우자료 = JSON.parse(fs.readFileSync(배우길, 'utf8'));
  const 브랜드자료 = JSON.parse(fs.readFileSync(브랜드길, 'utf8'));

  const 무리 = [
    { key: 'groups', label: 'Groups and bands', 줄들: 가수자료.people.filter((x) => x.isGroup) },
    { key: 'musicians', label: 'Solo musicians', 줄들: 가수자료.people.filter((x) => !x.isGroup) },
    { key: 'actors', label: 'Actors', 줄들: 배우자료.people },
    { key: 'athletes', label: 'Athletes', 줄들: 선수자료.people.filter((x) => (x.role ?? 'player') === 'player') },
    { key: 'brands', label: 'Luxury, fashion and car brands', 줄들: 브랜드자료.people },
  ];

  const 몫표 = 무리.map((g) => ({
    group: g.key, label: g.label, people: g.줄들.length, malaysiaSharePc: 무리몫(g.줄들),
  }));

  const 사람몫 = 몫표.filter((x) => x.group !== 'brands').map((x) => x.malaysiaSharePc);
  const 브랜드몫 = 몫표.find((x) => x.group === 'brands').malaysiaSharePc;
  const 사람최대 = Math.max(...사람몫);
  const 배수 = +(브랜드몫 / (사람몫.reduce((a, b) => a + b, 0) / 사람몫.length)).toFixed(1);

  /* 말레이시아가 유독 많이 보는 이름 — 사람과 브랜드를 갈라서 */
  const 사람전부 = [...가수자료.people, ...배우자료.people,
    ...선수자료.people.filter((x) => (x.role ?? 'player') === 'player')];
  const 본것 = new Set();
  const 겹안친사람 = 사람전부.filter((x) => { if (본것.has(x.q)) return false; 본것.add(x.q); return true; });

  const out = {
    generated: 지금(),
    source: 견줌.source,
    window: 견줌.window,
    unit: 'Share of a subject\'s four-country total that sits in the Malay Wikipedia. '
      + 'An evenly-read subject lands at 25%.',
    editions: 견줌.editions,
    question: 'Malaysia reads Korean people less than its neighbours do, and Korean brands more. '
      + 'The question is whether that is one thing or two.',
    sharesByGroup: 몫표,
    peopleShareRangePc: [Math.min(...사람몫), 사람최대],
    brandSharePc: 브랜드몫,
    brandOverPeopleRatio: 배수,
    /** ⛔ 너무 작은 것은 뺀다 — 한 번 읽힌 것이 100% 로 올라온다 */
    minimumTotal: 3,
    peopleMalaysiaLeans: 말레이가더보는것(겹안친사람),
    brandsMalaysiaLeans: 말레이가더보는것(브랜드자료.people),
    whyNotPopulation: 'We divide by the size of each Wikipedia, not by population. Malaysia has '
      + 'roughly a fifth of Indonesia\'s people but the Malay edition draws roughly a fifth of the '
      + 'Indonesian edition\'s reads, so the two cancel less than they look like they should. What '
      + 'is left is a difference in what gets read, not how many can read.',
    cannotAnswer: 'We cannot say why. A share is not a reason. Malay is also read outside Malaysia '
      + 'and many Malaysian readers use English or Chinese Wikipedia instead, so this measures the '
      + 'Malay edition rather than the country.',
  };
  fs.writeFileSync(결과, `${JSON.stringify(out, null, 2)}\n`);

  console.log(`⭐ ${결과}\n`);
  console.log('무리별 말레이시아 몫 (고르면 25%)');
  for (const g of 몫표) console.log(`   ${g.label.padEnd(32)} ${String(g.malaysiaSharePc).padStart(6)}%  (${g.people})`);
  console.log(`\n사람 ${Math.min(...사람몫)}~${사람최대}% · 브랜드 ${브랜드몫}% — **${배수}배**`);
  console.log('\n말레이시아가 유독 많이 보는 사람');
  for (const x of out.peopleMalaysiaLeans.slice(0, 8)) {
    console.log(`   ${x.name.padEnd(30)} ${String(x.malaysiaSharePc).padStart(6)}%  합 ${x.total}`);
  }
  console.log('\n말레이시아가 유독 많이 보는 브랜드');
  for (const x of out.brandsMalaysiaLeans.slice(0, 6)) {
    console.log(`   ${x.name.padEnd(30)} ${String(x.malaysiaSharePc).padStart(6)}%  합 ${x.total}`);
  }
}
