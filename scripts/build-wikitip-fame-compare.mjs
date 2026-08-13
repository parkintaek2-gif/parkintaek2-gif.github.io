#!/usr/bin/env node
/**
 * **연예인이 선수보다 높은가** (`/fame-compare`) — 사장님 물음(8/13).
 *
 * ── ⛔ 이 지면이 지키는 것 ────────────────────────────────────
 * ⛔ 「연예인 대 선수」를 **한 줄 순위표로 만들지 않는다.** 나란히 놓고 **모양이 어떻게 다른지**를 낸다.
 * ⛔ 두 자료가 **같은 자로 잰 것인지 먼저 확인한다.** 다르면 짓지 않고 멈춘다 —
 *    언어판이 다르거나 창이 다르면 견줌 자체가 거짓이 된다.
 * ⚠ 「인기」라고 쓰지 않는다. 잰 것은 **찾아본 횟수**다.
 * ⚠ 배우 명단은 **넷플릭스 차트에 오른 작품의 출연진**이다. 한국 연예인 전부가 아니다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 선수길 = 'archive/raw/wikipedia/sea-athletes.json';
const 배우길 = 'archive/raw/wikipedia/sea-actors.json';
/**
 * 🔴 사장님 지적(8/13) — 「가수는 순위에 없는 건 아닐텐데」.
 *   맞았다. 배우 명단이 넷플릭스 차트 작품 출연진이라 **드라마에 안 나온 가수가 통째로 빠졌다.**
 *   ⛔ 그 상태로 「연예인」이라 부른 것이 잘못이었다. 가수를 따로 모아 같은 자로 견준다.
 *   ⚠ 가수 자료가 아직 없으면 **없는 대로 짓는다.** 있으면 무리에 더한다.
 */
const 가수길 = 'archive/raw/wikipedia/sea-musicians.json';
const 결과 = 'src/data/wikitip-fame-compare.json';
const 나라이름 = { id: 'Indonesia', vi: 'Vietnam', th: 'Thailand', ms: 'Malaysia' };
const 판들 = Object.keys(나라이름);

/**
 * 🔴 **견주기 전에 견줄 수 있는지 본다.** 같은 언어판·같은 밑값이어야 한다.
 *   ⛔ 어긋나면 지면을 안 짓는다. 어긋난 채 견주면 그 지면의 모든 수가 거짓이다.
 */
export function 견줄수있나(가, 나) {
  const 탈 = [];
  if (JSON.stringify(가.editionsSea) !== JSON.stringify(나.editionsSea)) 탈.push('언어판이 다르다');
  if (가.window !== 나.window) 탈.push('창이 다르다');
  for (const p of 가.editionsSea ?? []) {
    if (가.editionTotals?.[p] !== 나.editionTotals?.[p]) 탈.push(`${p} 밑값이 다르다`);
  }
  return { ok: 탈.length === 0, 탈 };
}

/** 몇 명이 어느 문턱을 넘나 — 꼭대기가 아니라 **층의 두께**를 본다 */
export function 문턱넘은수(줄들, 문턱) {
  return 줄들.filter((x) => (x.seaPerMillionTotal ?? 0) >= 문턱).length;
}

export const 문턱들 = [50, 100, 200, 300];

/** 어느 나라가 그 무리를 가장 많이 읽나 — 무리 전체의 나라별 합에서 몫 */
export function 나라몫(줄들) {
  const 합 = Object.fromEntries(판들.map((p) => [p, 0]));
  for (const x of 줄들) {
    for (const p of 판들) {
      const v = x.perMillion?.[p];
      if (typeof v === 'number') 합[p] += v;
    }
  }
  const 총 = Object.values(합).reduce((a, b) => a + b, 0);
  return 판들.map((p) => ({
    edition: p, country: 나라이름[p],
    perMillion: +합[p].toFixed(1),
    sharePc: 총 ? +((100 * 합[p]) / 총).toFixed(1) : null,
  }));
}

export function 가운데(수들) {
  const s = [...수들].filter((v) => typeof v === 'number').sort((a, b) => a - b);
  return s.length ? s[s.length >> 1] : null;
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    if (JSON.stringify(실제) === JSON.stringify(바람)) 통 += 1;
    else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  const 같음 = { editionsSea: ['id', 'vi'], window: 'w', editionTotals: { id: 10, vi: 20 } };
  재본다('🔴 같은 자면 견준다', 견줄수있나(같음, { ...같음 }).ok, true);
  재본다('⛔ 창이 다르면 안 견준다',
    견줄수있나(같음, { ...같음, window: 'x' }).탈, ['창이 다르다']);
  재본다('⛔ 밑값이 다르면 안 견준다',
    견줄수있나(같음, { ...같음, editionTotals: { id: 11, vi: 20 } }).탈, ['id 밑값이 다르다']);
  재본다('⛔ 언어판이 다르면 안 견준다',
    견줄수있나(같음, { ...같음, editionsSea: ['id'] }).ok, false);
  const 셋 = [{ seaPerMillionTotal: 300 }, { seaPerMillionTotal: 120 }, { seaPerMillionTotal: 10 }];
  재본다('문턱넘은수 — 100', 문턱넘은수(셋, 100), 2);
  재본다('문턱넘은수 — 아무도 못 넘으면 0', 문턱넘은수(셋, 999), 0);
  재본다('나라몫 — 몫의 합이 100',
    +나라몫([{ perMillion: { id: 30, vi: 70, th: 0, ms: 0 } }])
      .reduce((a, x) => a + (x.sharePc ?? 0), 0).toFixed(0), 100);
  재본다('나라몫 — 못 잰 것은 안 더한다',
    나라몫([{ perMillion: { id: 10, vi: undefined } }]).find((x) => x.edition === 'vi').perMillion, 0);
  재본다('가운데', 가운데([3, 1, 2]), 2);
  재본다('가운데 — 빈 것은 null', 가운데([]), null);
  console.log(`견주는 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  for (const p of [선수길, 배우길]) {
    if (!fs.existsSync(p)) { console.error(`⛔ 없다 — ${p}`); process.exit(1); }
  }
  const 선수자료 = JSON.parse(fs.readFileSync(선수길, 'utf8'));
  const 배우자료 = JSON.parse(fs.readFileSync(배우길, 'utf8'));

  const 잴수있나 = 견줄수있나(선수자료, 배우자료);
  if (!잴수있나.ok) {
    console.error('🔴 **견줄 수 없다** — 두 자료가 같은 자로 잰 것이 아니다:');
    for (const t of 잴수있나.탈) console.error(`   · ${t}`);
    console.error('⛔ 지면을 안 짓는다. 어긋난 채 견주면 이 지면의 모든 수가 거짓이 된다.');
    process.exit(1);
  }
  console.log('✅ 두 자료가 같은 자로 쟀다 — 언어판·창·밑값이 모두 같다\n');

  const 선수 = 선수자료.people.filter((x) => (x.role ?? 'player') === 'player');
  const 감독 = 선수자료.people.filter((x) => x.role === 'both');
  const 배우 = 배우자료.people;

  /* 🔴 가수 — 사장님 지적으로 뒤에 붙였다. 아직 없으면 없는 대로 짓되 **그 사실을 적는다** */
  let 가수솔로 = [];
  let 가수무리 = [];
  let 가수자료 = null;
  if (fs.existsSync(가수길)) {
    가수자료 = JSON.parse(fs.readFileSync(가수길, 'utf8'));
    const 잴수있나2 = 견줄수있나(선수자료, 가수자료);
    if (!잴수있나2.ok) {
      console.error('🔴 가수 자료가 **같은 자로 잰 것이 아니다**:');
      for (const t of 잴수있나2.탈) console.error(`   · ${t}`);
      process.exit(1);
    }
    가수솔로 = 가수자료.people.filter((x) => !x.isGroup);
    가수무리 = 가수자료.people.filter((x) => x.isGroup);
    console.log('✅ 가수 자료도 같은 자로 쟀다\n');
  } else {
    console.log('⚠ 가수 자료가 아직 없다 — 없는 대로 짓고 지면에 그 사실을 적는다\n');
  }

  const 무리 = [
    { key: 'actors', label: 'Actors', 줄들: 배우 },
    ...(가수솔로.length ? [{ key: 'musicians', label: 'Musicians', 줄들: 가수솔로 }] : []),
    ...(가수무리.length ? [{ key: 'groups', label: 'Groups and bands', 줄들: 가수무리 }] : []),
    { key: 'athletes', label: 'Athletes', 줄들: 선수 },
    { key: 'managers', label: 'Managers who also played', 줄들: 감독 },
  ];

  const 요약 = 무리.map((g) => ({
    group: g.key,
    label: g.label,
    people: g.줄들.length,
    top: g.줄들[0]?.name ?? null,
    topTotal: g.줄들[0]?.seaPerMillionTotal ?? null,
    median: 가운데(g.줄들.map((x) => x.seaPerMillionTotal)),
    aboveThreshold: Object.fromEntries(문턱들.map((t) => [t, 문턱넘은수(g.줄들, t)])),
    byCountry: 나라몫(g.줄들),
  }));

  const 열 = (줄들, n) => 줄들.slice(0, n).map((x) => ({
    name: x.name,
    perMillion: Object.fromEntries(판들.map((p) => [p, x.perMillion?.[p] ?? null])),
    views: Object.fromEntries(판들.map((p) => [p, x.views?.[p] ?? null])),
    total: x.seaPerMillionTotal,
  }));

  /* 🔴 사장님 물음에 대한 답 — 눈으로 보지 않고 센다. **가수까지 넣어서** 센다 */
  const 연예전부 = [...배우, ...가수솔로, ...가수무리]
    .sort((a, b) => b.seaPerMillionTotal - a.seaPerMillionTotal);
  const 배우맨위 = 연예전부[0]?.seaPerMillionTotal ?? 0;
  const 배우맨위이름 = 연예전부[0]?.name ?? '';
  const 선수맨위 = 선수[0]?.seaPerMillionTotal ?? 0;
  const 선수맨위이름 = 선수[0]?.name ?? '';
  const 배우가더높나 = 배우맨위 > 선수맨위;
  const 선수맨위보다높은배우 = 연예전부.filter((x) => x.seaPerMillionTotal > 선수맨위).length;

  const out = {
    generated: new Date().toISOString(),
    source: 'Wikidata (CC0) for article links; Wikimedia Pageviews API for reads',
    window: 선수자료.window,
    unit: 'Reads per million reads of the whole language edition, summed across the four editions, '
      + '12 months. One row is one person.',
    editions: 판들.map((p) => ({ code: p, country: 나라이름[p], editionReads: 선수자료.editionTotals[p] })),
    question: 'Are Korean entertainers looked up far more than Korean athletes in Southeast Asia?',
    groups: 요약,
    topActors: 열(연예전부, 14),
    topAthletes: 열(선수, 8),
    /** 🔴 한 줄 답 */
    entertainerLeadsOverall: 배우가더높나,
    actorsAboveTopAthlete: 선수맨위보다높은배우,
    entertainersCounted: 연예전부.length,
    topAthleteName: 선수맨위이름,
    topAthleteTotal: 선수맨위,
    topActorName: 배우맨위이름,
    topActorTotal: 배우맨위,
    answer: 배우가더높나
      ? `Yes, at the very top. ${배우맨위이름} scores ${배우맨위} against ${선수맨위이름}'s ${선수맨위}, `
        + `and ${선수맨위보다높은배우} of the ${연예전부.length.toLocaleString('en-US')} entertainers `
        + 'measured are above the most-read athlete.'
      : `No. The most-read athlete, ${선수맨위이름}, scores ${선수맨위}, and not one of the `
        + `${연예전부.length.toLocaleString('en-US')} entertainers measured is above him. What differs `
        + 'is the band beneath: the entertainers fill it and the athletes do not.',
    actorPanel: 배우자료.panel,
    actorPanelCaveat: 배우자료.panelCaveat,
    musicPanel: 가수자료?.panel ?? null,
    musicPanelNote: 가수자료
      ? 가수자료.whyGroupsToo
      : 'Musicians who never acted are not yet in this comparison. The actor panel is the cast of '
        + 'Netflix-charting titles, so it reaches singers only through their acting credits. That '
        + 'measurement is running and will be added here.',
    cannotAnswer: 'Reading an encyclopaedia article is not liking someone. This counts people '
      + 'looking someone up. Readers in these four countries also use the English Wikipedia, which '
      + 'cannot be split by country, so every figure here is a floor on interest, not a measure of it.',
    whyNotPhilippines: 선수자료.whyNotPhilippines,
  };
  fs.writeFileSync(결과, `${JSON.stringify(out, null, 2)}\n`);

  console.log(`⭐ ${결과}\n`);
  console.log('무리                     사람   맨 위                     맨 위 값   가운데   50↑  100↑  200↑  300↑');
  for (const g of 요약) {
    console.log(`${g.label.padEnd(26)}${String(g.people).padStart(5)}   ${(g.top ?? '').padEnd(22)}`
      + `${String(g.topTotal).padStart(8)}${String(g.median).padStart(9)}`
      + 문턱들.map((t) => String(g.aboveThreshold[t]).padStart(6)).join(''));
  }
  console.log('\n나라별 몫');
  for (const g of 요약) {
    console.log(`   ${g.label.padEnd(26)}${g.byCountry.map((c) => `${c.country} ${c.sharePc}%`).join(' · ')}`);
  }
  console.log(`\n🔴 답: ${out.answer}`);
}
