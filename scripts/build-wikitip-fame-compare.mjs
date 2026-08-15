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
import { 지금 } from './_kst.mjs';
/* ⭐ 근거 칸의 표준 문구 — 자료 고유의 한계는 위에서 덧붙인다 */
import { 근거, 중앙값 as 중앙값자, 백만분율 as 백만분율자 } from './_evidence-kcw.mjs';

const 선수길 = 'archive/raw/wikipedia/sea-athletes.json';
const 배우길 = 'archive/raw/wikipedia/sea-actors.json';
/**
 * 🔴 사장님 지적(8/13) — 「가수는 순위에 없는 건 아닐텐데」.
 *   맞았다. 배우 명단이 넷플릭스 차트 작품 출연진이라 **드라마에 안 나온 가수가 통째로 빠졌다.**
 *   ⛔ 그 상태로 「연예인」이라 부른 것이 잘못이었다. 가수를 따로 모아 같은 자로 견준다.
 *   ⚠ 가수 자료가 아직 없으면 **없는 대로 짓는다.** 있으면 무리에 더한다.
 */
const 가수길 = 'archive/raw/wikipedia/sea-musicians.json';
/**
 * 사장님 지시(8/13) — 「패션 브랜드, 명품 엠베서더 등도 먹히는 콘텐트인지」·「자동차까지」
 * 🔴 못 재는 것을 먼저 적는다: Wikidata 에 **앰배서더 관계가 없다**(실물로 찾아 0건).
 *   그래서 「누가 어느 브랜드 얼굴인가」가 아니라 **브랜드가 얼마나 읽히나**를 스타 옆에 놓는다.
 */
const 브랜드길 = 'archive/raw/wikipedia/sea-brands.json';
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

  /* 🔴 브랜드 — 사장님 ②③. 없으면 없는 대로 짓는다 */
  let 브랜드줄 = [];
  let 브랜드자료 = null;
  if (fs.existsSync(브랜드길)) {
    브랜드자료 = JSON.parse(fs.readFileSync(브랜드길, 'utf8'));
    const 잴수있나3 = 견줄수있나(선수자료, 브랜드자료);
    if (!잴수있나3.ok) {
      console.error('🔴 브랜드 자료가 같은 자로 잰 것이 아니다:');
      for (const t of 잴수있나3.탈) console.error(`   · ${t}`);
      process.exit(1);
    }
    브랜드줄 = 브랜드자료.people;
    console.log('✅ 브랜드 자료도 같은 자로 쟀다\n');
  }

  const 무리 = [
    ...(가수무리.length ? [{ key: 'groups', label: 'Groups and bands', 줄들: 가수무리 }] : []),
    ...(가수솔로.length ? [{ key: 'musicians', label: 'Solo musicians', 줄들: 가수솔로 }] : []),
    { key: 'actors', label: 'Actors', 줄들: 배우 },
    { key: 'athletes', label: 'Athletes', 줄들: 선수 },
    { key: 'managers', label: 'Managers who also played', 줄들: 감독 },
    ...(브랜드줄.length ? [{ key: 'brands', label: 'Luxury, fashion and car brands', 줄들: 브랜드줄 }] : []),
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

  /**
   * 🔴 사장님 물음에 대한 답 — 눈으로 보지 않고 센다. **가수까지 넣어서** 센다.
   * ⛔ 겹치는 사람을 두 번 세지 않는다. 아이유·차은우·임윤아는 **배우 명단과 가수 명단에 둘 다** 있다.
   *   Q번호로 하나만 남긴다. 안 그러면 「연예인 2,724명」이 부풀고 상위 표에 같은 이름이 두 번 선다.
   */
  const 본것 = new Set();
  const 연예전부 = [...가수무리, ...가수솔로, ...배우]
    .filter((x) => { if (본것.has(x.q)) return false; 본것.add(x.q); return true; })
    .sort((a, b) => b.seaPerMillionTotal - a.seaPerMillionTotal);
  const 겹친사람 = (가수무리.length + 가수솔로.length + 배우.length) - 연예전부.length;
  const 배우맨위 = 연예전부[0]?.seaPerMillionTotal ?? 0;
  const 배우맨위이름 = 연예전부[0]?.name ?? '';
  const 선수맨위 = 선수[0]?.seaPerMillionTotal ?? 0;
  const 선수맨위이름 = 선수[0]?.name ?? '';
  const 배우가더높나 = 배우맨위 > 선수맨위;
  const 선수맨위보다높은배우 = 연예전부.filter((x) => x.seaPerMillionTotal > 선수맨위).length;

  const out = {
    /**
     * ⭐⭐ **근거 칸** — 사장님 지시(8/15). 표준 문구에 **이 자료 고유의 한계**를 덧붙인다.
     * ⛔ 고유 한계를 안 주면 `근거()` 가 던진다 — 붙여넣기만 있는 칸은 찬 척하는 것이다.
     */
    ...근거([중앙값자, 백만분율자], {
      방법: "Each panel is summarised by its median person rather than its total, so that a panel with more names in it cannot outrank a smaller one by size alone.",
      한계: "The panels were assembled from different Wikidata queries and are not the same kind of list — one is drawn from chart appearances, another from occupation alone — so a gap between panels can be a gap between how the two lists were built. Reading about someone is not liking them, and it is not watching anything.",
    }),
    generated: 지금(),
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
    /** ⛔ 겹친 사람 — 배우이면서 가수인 사람. 한 번만 센다 */
    countedInBothPanels: 겹친사람,
    overlapNote: `${겹친사람} people appear in both the acting and the music panel — IU, Cha Eun-woo, `
      + 'Im Yoon-ah and others who do both. They are counted once in the combined figure and once in '
      + 'each group table, which is why the group rows do not sum to the combined total.',
    topAthleteName: 선수맨위이름,
    topAthleteTotal: 선수맨위,
    topActorName: 배우맨위이름,
    topActorTotal: 배우맨위,
    answer: 배우가더높나
      ? `Yes, at the very top. ${배우맨위이름} scores ${배우맨위} against ${선수맨위이름}'s ${선수맨위}. `
        + `But only ${선수맨위보다높은배우} of the ${연예전부.length.toLocaleString('en-US')} entertainers `
        + 'measured clears the most-read athlete, so the lead is one act wide, not a category-wide gap.'
      : `No. The most-read athlete, ${선수맨위이름}, scores ${선수맨위}, and not one of the `
        + `${연예전부.length.toLocaleString('en-US')} entertainers measured is above him. What differs `
        + 'is the band beneath: the entertainers fill it and the athletes do not.',
    actorPanel: 배우자료.panel,
    actorPanelCaveat: 배우자료.panelCaveat,
    /** ⭐ 사장님 ②③ — 브랜드가 스타만큼 읽히나 */
    topBrands: 열(브랜드줄, 12),
    topBrandName: 브랜드줄[0]?.name ?? null,
    topBrandTotal: 브랜드줄[0]?.seaPerMillionTotal ?? null,
    brandVsPerson: 브랜드줄.length
      ? `The most-read brand, ${브랜드줄[0].name}, scores ${브랜드줄[0].seaPerMillionTotal} — about `
        + `${(배우맨위 / 브랜드줄[0].seaPerMillionTotal).toFixed(1)} times less than the most-read `
        + 'Korean act. A house is not read about the way a person is. What travels is the person '
        + 'wearing it, which is where the ambassador announcements land.'
      : null,
    brandCannotAnswer: 브랜드자료?.cannotAnswer ?? null,
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
