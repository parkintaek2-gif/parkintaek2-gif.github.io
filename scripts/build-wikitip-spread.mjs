#!/usr/bin/env node
/**
 * **무엇이 나라를 안 가리나** (`/spread`) — 85편째.
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 *   81편에서 감독의 **쏠림**을 쟀다(자기를 뽑은 나라에서만 읽힌다, 가운데 80.3%).
 *   그 자를 **모든 무리에** 대 보면 다른 물음이 나온다 —
 *   ⭐ 「무엇이 나라를 **안 가리나**」. 쏠림이 낮을수록 지역 전체가 같이 읽는다.
 *
 * ── ⛔ 이 지면이 지키는 것 ────────────────────────────────────
 * ⛔ **크기와 고름을 섞지 않는다.** 많이 읽히는 것과 고루 읽히는 것은 다른 물음이다.
 *    BTS 는 둘 다인데, 그 둘을 한 수로 뭉치면 어느 쪽도 안 보인다.
 * ⛔ 적게 읽히는 것을 「고르다」고 하지 않는다 — 값이 작으면 쏠림이 튄다.
 *    **문턱을 넘은 것만** 센다. 문턱을 자료에 적는다.
 * ⚠ 넷 다 고르면 25%다. 그것이 바닥이지 0 이 아니다. 화면에 그 말을 적는다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 결과 = 'src/data/wikitip-spread.json';
const 나라이름 = { id: 'Indonesia', vi: 'Vietnam', th: 'Thailand', ms: 'Malaysia' };
const 판들 = Object.keys(나라이름);

/** ⛔ 값이 작으면 쏠림이 튄다. 이만큼은 넘어야 센다 */
export const 문턱 = 10;

/** 넷이 고르면 25% — 그것이 **바닥**이다. 0 이 아니다 */
export const 고름바닥 = +(100 / 판들.length).toFixed(1);

export function 쏠림(줄) {
  const 값 = 판들.map((p) => 줄.perMillion?.[p]).filter((v) => typeof v === 'number');
  const 합 = 값.reduce((a, b) => a + b, 0);
  if (!합) return null;
  const 으뜸 = Math.max(...값);
  return {
    topSharePc: +((100 * 으뜸) / 합).toFixed(1),
    topEdition: 판들.find((p) => 줄.perMillion?.[p] === 으뜸),
  };
}

export function 가운데(수들) {
  const s = [...수들].filter((v) => typeof v === 'number').sort((a, b) => a - b);
  return s.length ? s[s.length >> 1] : null;
}

/** 한 무리의 고름. ⛔ 문턱을 넘은 것만 센다 */
export function 무리고름(줄들, 문턱값 = 문턱) {
  const 셀것 = 줄들.filter((x) => (x.seaPerMillionTotal ?? 0) >= 문턱값);
  const 쏠림들 = 셀것.map((x) => 쏠림(x)?.topSharePc).filter((v) => typeof v === 'number');
  return {
    counted: 셀것.length,
    ofAll: 줄들.length,
    medianTopSharePc: 가운데(쏠림들),
    /** 넷 다 40% 아래면 「나라를 안 가린다」고 부를 만하다 */
    underForty: 쏠림들.filter((v) => v < 40).length,
  };
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    const ok = typeof 바람 === 'function' ? 바람(실제) : JSON.stringify(실제) === JSON.stringify(바람);
    if (ok) 통 += 1; else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  재본다('고름 바닥은 25% — 0 이 아니다', 고름바닥, 25);
  재본다('쏠림 — 한 나라에 다 몰리면 100',
    쏠림({ perMillion: { id: 0, vi: 50, th: 0, ms: 0 } }).topSharePc, 100);
  재본다('쏠림 — 넷이 고르면 바닥값', 쏠림({ perMillion: { id: 5, vi: 5, th: 5, ms: 5 } }).topSharePc, 25);
  재본다('쏠림 — 값이 없으면 null(0 이 아니다)', 쏠림({ perMillion: {} }), null);
  /* ⛔ 값이 작은 것을 「고르다」고 하면 안 된다 — 문턱이 그것을 막는다 */
  재본다('무리고름 — 문턱 아래는 안 센다',
    무리고름([{ seaPerMillionTotal: 3, perMillion: { id: 3 } }]).counted, 0);
  재본다('무리고름 — 문턱을 넘으면 센다',
    무리고름([{ seaPerMillionTotal: 40, perMillion: { id: 10, vi: 10, th: 10, ms: 10 } }]).medianTopSharePc, 25);
  재본다('무리고름 — 전체 수도 같이 남긴다',
    무리고름([{ seaPerMillionTotal: 3, perMillion: { id: 3 } }]).ofAll, 1);
  재본다('가운데 — 빈 것은 null', 가운데([]), null);
  console.log(`고름 짓는 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  const 읽기 = (p) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null);
  const 선수자료 = 읽기('archive/raw/wikipedia/sea-athletes.json');
  const 배우자료 = 읽기('archive/raw/wikipedia/sea-actors.json');
  const 가수자료 = 읽기('archive/raw/wikipedia/sea-musicians.json');
  const 브랜드자료 = 읽기('archive/raw/wikipedia/sea-brands.json');
  for (const [이름, x] of [['선수', 선수자료], ['배우', 배우자료], ['가수', 가수자료], ['브랜드', 브랜드자료]]) {
    if (!x) { console.error(`⛔ ${이름} 자료가 없다`); process.exit(1); }
  }
  /* 🔴 견주기 전에 견줄 수 있는지 본다 */
  for (const [이름, x] of [['배우', 배우자료], ['가수', 가수자료], ['브랜드', 브랜드자료]]) {
    if (x.window !== 선수자료.window) { console.error(`⛔ ${이름} 자료의 창이 다르다`); process.exit(1); }
    for (const p of 판들) {
      if (x.editionTotals?.[p] !== 선수자료.editionTotals?.[p]) {
        console.error(`⛔ ${이름} 자료의 ${p} 밑값이 다르다 — 견줄 수 없다`);
        process.exit(1);
      }
    }
  }
  console.log('✅ 네 자료가 같은 자로 쟀다\n');

  /**
   * 🔴 8/14 — 처음엔 「선수」를 한 무리로 놓았다가 **가운데 쏠림 100%** 가 나왔다.
   *   갈라 보니 축구는 50.4% 고 이스포츠가 100% 였다. 문턱 넘은 이스포츠 14명 중 13명이
   *   **베트남판에만 문서가 있다.**
   *   ⛔ 그러니 「한국 선수는 한 나라에서만 읽힌다」가 아니라
   *      **「이스포츠 선수 문서가 베트남 위키에만 있다」**가 참말이다. 갈라서 낸다.
   *   ⚠ 이것은 관심의 쏠림이 아니라 **문서의 쏠림**이다. 그 말을 자료에 적는다.
   */
  const 선수 = 선수자료.people.filter((x) => (x.role ?? 'player') === 'player');
  const 무리 = [
    { key: 'groups', label: 'K-pop groups', 줄들: 가수자료.people.filter((x) => x.isGroup) },
    { key: 'musicians', label: 'Solo musicians', 줄들: 가수자료.people.filter((x) => !x.isGroup) },
    { key: 'actors', label: 'Actors', 줄들: 배우자료.people },
    { key: 'footballers', label: 'Footballers', 줄들: 선수.filter((x) => x.sports?.includes('football')) },
    { key: 'esports', label: 'Esports players', 줄들: 선수.filter((x) => x.sports?.includes('esports')) },
    { key: 'managers', label: 'Managers who also played', 줄들: 선수자료.people.filter((x) => x.role === 'both') },
    { key: 'brands', label: 'Luxury, fashion and car brands', 줄들: 브랜드자료.people },
  ];

  const 표 = 무리.map((g) => ({ group: g.key, label: g.label, ...무리고름(g.줄들) }))
    .filter((x) => x.medianTopSharePc !== null)
    .sort((a, b) => a.medianTopSharePc - b.medianTopSharePc);

  /* 가장 고른 무리와 가장 쏠린 무리 */
  const 가장고름 = 표[0];
  const 가장쏠림 = 표[표.length - 1];

  /**
   * 이름을 낼 몇 — ⛔ 줄세우기가 아니라 **양 끝**을 보인다.
   * ⚠ 같은 사람이 배우 명단과 가수 명단에 둘 다 있다(김설현이 두 표기로 나왔다).
   *   이름을 다듬어 한 번만 낸다 — 붙임표와 사이띄기를 지우고 견준다.
   */
  const 다듬기 = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const 본이름 = new Set();
  const 다 = 무리.flatMap((g) => g.줄들.filter((x) => (x.seaPerMillionTotal ?? 0) >= 문턱)
    .map((x) => ({ name: x.name, group: g.key, label: g.label, total: x.seaPerMillionTotal, ...(쏠림(x) ?? {}) })))
    .filter((x) => typeof x.topSharePc === 'number')
    .filter((x) => { const k = 다듬기(x.name); if (본이름.has(k)) return false; 본이름.add(k); return true; });
  const 고른것 = [...다].sort((a, b) => a.topSharePc - b.topSharePc || b.total - a.total).slice(0, 10);
  const 쏠린것 = [...다].sort((a, b) => b.topSharePc - a.topSharePc || b.total - a.total).slice(0, 10);

  const out = {
    generated: new Date().toISOString(),
    source: 'Wikidata (CC0) for article links; Wikimedia Pageviews API for reads',
    window: 선수자료.window,
    unit: 'Concentration — the share of a name\'s four-country total that sits in its single largest '
      + 'country. Four equal countries give 25%. One country alone gives 100%.',
    editions: 판들.map((p) => ({ code: p, country: 나라이름[p] })),
    evenFloorPc: 고름바닥,
    threshold: 문턱,
    whyThreshold: `Below ${문턱} reads per million the concentration figure swings on a handful of `
      + 'views, so names under that are counted in the panel but left out of the median.',
    question: 'Which kinds of Korean name are read across Southeast Asia rather than in one country?',
    groups: 표,
    mostEven: 가장고름,
    mostConcentrated: 가장쏠림,
    finding: `${가장고름.label} are the most evenly read, with a median concentration of `
      + `${가장고름.medianTopSharePc}% against an even floor of ${고름바닥}%. `
      + `${가장쏠림.label} are the most concentrated at ${가장쏠림.medianTopSharePc}%.`,
    mostEvenNames: 고른것,
    mostConcentratedNames: 쏠린것,
    /**
     * 🔴 이스포츠 줄은 관심의 쏠림이 아니라 **문서의 쏠림**이다. 안 적으면 오독된다.
     */
    esportsCaveat: 'The esports row is not a fact about interest. Of the esports players above the '
      + 'threshold, all but one have an article in the Vietnamese Wikipedia and in no other edition '
      + 'here. Their concentration is 100% because there is nowhere else for the reading to sit. '
      + 'Read it as a gap in the encyclopaedias, not a gap in attention.',
    cannotAnswer: 'Concentration says where reading sits, not how much there is. A name read evenly '
      + 'and rarely scores the same as one read evenly and widely. The totals are in the tables so '
      + 'both can be seen at once. And where a name has an article in only one edition, its '
      + 'concentration is fixed at 100% by that fact alone.',
    whyNotPhilippines: 선수자료.whyNotPhilippines,
  };
  fs.writeFileSync(결과, `${JSON.stringify(out, null, 2)}\n`);

  console.log(`⭐ ${결과}\n`);
  console.log('무리                              센 것/전체   가운데 쏠림   40% 아래');
  for (const g of 표) {
    console.log(`${g.label.padEnd(34)}${String(`${g.counted}/${g.ofAll}`).padStart(10)}`
      + `${String(`${g.medianTopSharePc}%`).padStart(13)}${String(g.underForty).padStart(10)}`);
  }
  console.log(`\n🔴 ${out.finding}`);
  console.log('\n가장 고르게 읽히는 이름');
  for (const x of 고른것.slice(0, 6)) console.log(`   ${x.name.padEnd(24)} ${x.topSharePc}%  ${x.label}`);
  console.log('\n가장 한 나라에 쏠린 이름');
  for (const x of 쏠린것.slice(0, 6)) console.log(`   ${x.name.padEnd(24)} ${x.topSharePc}% ${x.topEdition}  ${x.label}`);
}
