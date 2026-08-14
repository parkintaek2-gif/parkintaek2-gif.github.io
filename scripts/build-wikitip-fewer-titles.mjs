#!/usr/bin/env node
/**
 * **선반은 그대로인데 올라가는 작품이 줄었다** — 그러면 누가 그 자리를 가져갔나.
 *
 * ── 왜 이 물음인가 ─────────────────────────────────────────────
 *   넷플릭스가 2026년 한국 작품 33편 슬레이트를 냈다. 그런데 우리 자료로는
 *   **차트에 오르는 한국 작품 수가 2022년 127편에서 2025년 96편으로 줄었다.**
 *   ⚠ 자리는 안 줄었다 — 5,939 → 6,266. 작품당 자리가 46.8 → 65.3 으로 **늘었다.**
 *   ⭐ 그러면 물음은 하나다: **꼬리가 사라진 것인가, 머리가 커진 것인가.**
 *      둘은 전혀 다른 이야기다. 앞엣것이면 작은 작품이 못 뜨는 것이고,
 *      뒤엣것이면 큰 작품이 더 오래 남는 것이다.
 *
 * ── ⛔ 이 자가 지키는 것 ────────────────────────────────────
 * ⛔ **작품당 자리 하나로 말하지 않는다.** 그것은 두 수의 나눗셈이라 어느 쪽이 움직였는지 못 가린다.
 * ⛔ **덜 찬 해(2021·2026)를 추세에 안 섞는다.** 화면에 「덜 찬 해」라고 적는다.
 * ⛔ 작품을 줄세우지 않는다. 「윗 열 편」은 셈이지 이름표가 아니다 — 이름을 안 낸다.
 * ⛔ 제목만으로 센다(시즌으로 안 쪼갠다). 시즌 표기가 해마다 바뀌면 작품 수가 흔들리기 때문이다.
 *    ⚠ 이것이 오늘 /exit 에서 25,987줄을 잃게 한 그 칸이다. 거기서는 시즌이 **필요했고**
 *      여기서는 **넣으면 안 된다** — 재는 것이 다르다. 그 까닭을 여기 적어 둔다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { koreanTitleFilter } from './lib/korean-netflix-titles.mjs';
import { 지금 } from './_kst.mjs';

const 나라파일 = 'archive/raw/netflix-top10/countries.ndjson';
const 낼파일 = 'src/data/wikitip-fewer-titles.json';

/** 몫. 밑이 0 이면 **0 이 아니라 null** */
export function 몫(a, b) {
  if (!b) return null;
  return +((100 * a) / b).toFixed(1);
}

/**
 * 윗 n 편이 자리의 몇 %를 가져갔나.
 * ⛔ n 이 전체 작품 수보다 크면 100% 다 — 그 해를 다른 해와 못 견준다. null 을 돌려준다.
 */
export function 윗몫(자리들, n) {
  if (자리들.length < n) return null;
  const s = [...자리들].sort((a, b) => b - a);
  const 합 = s.reduce((a, b) => a + b, 0);
  if (!합) return null;
  return +((100 * s.slice(0, n).reduce((a, b) => a + b, 0)) / 합).toFixed(1);
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    if (JSON.stringify(실제) === JSON.stringify(바람)) 통 += 1;
    else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  재본다('몫 — 밑이 0 이면 null', 몫(1, 0), null);
  재본다('윗몫 — 반반', 윗몫([10, 10, 10, 10], 2), 50);
  재본다('윗몫 — 큰 것부터 센다', 윗몫([1, 1, 8], 1), 80);
  /* ⛔ n 이 작품 수보다 크면 100% 다. 그러면 해끼리 못 견준다 */
  재본다('윗몫 — 작품이 모자라면 null', 윗몫([5, 5], 3), null);
  재본다('윗몫 — 합이 0 이면 null', 윗몫([0, 0, 0], 2), null);
  console.log(`작품 수 수집기 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  if (!fs.existsSync(나라파일)) {
    console.log(`⛔ 원자료가 없다 — ${나라파일}`);
    console.log('   ⚠ archive/ 는 git 에 안 올라간다. 「안 됐다」가 아니라 **못 쟀다**.');
    process.exit(1);
  }
  const ko = koreanTitleFilter();

  const 해별 = new Map();
  let 줄 = 0;
  for (const l of fs.readFileSync(나라파일, 'utf8').split('\n')) {
    if (!l) continue;
    줄 += 1;
    let r;
    try { r = JSON.parse(l); } catch { continue; }
    if (String(r.iso2).toUpperCase() === 'RU') continue;
    if (!ko.keepTitle(r.제목)) continue;
    const 해 = String(r.주).slice(0, 4);
    if (!해별.has(해)) 해별.set(해, { 주: new Set(), 작품: new Map(), 나라: new Set() });
    const y = 해별.get(해);
    y.주.add(r.주);
    y.나라.add(r.iso2);
    y.작품.set(r.제목, (y.작품.get(r.제목) ?? 0) + 1);
  }

  const byYear = [...해별.keys()].sort().map((해) => {
    const y = 해별.get(해);
    const 자리들 = [...y.작품.values()];
    const 총자리 = 자리들.reduce((a, b) => a + b, 0);
    const 정 = [...자리들].sort((a, b) => a - b);
    return {
      year: 해,
      weeks: y.주.size,
      markets: y.나라.size,
      titles: y.작품.size,
      places: 총자리,
      placesPerTitle: +(총자리 / y.작품.size).toFixed(1),
      medianPlaces: 정[Math.floor(정.length / 2)],
      /* ⭐ 꼬리 — 자리 다섯 이하로 스쳐 간 작품이 몇 편인가 */
      tinyTitles: 자리들.filter((n) => n <= 5).length,
      tinyPc: 몫(자리들.filter((n) => n <= 5).length, y.작품.size),
      /* ⭐ 머리 — 윗 열 편이 자리의 몇 %를 가져갔나 */
      topTenPc: 윗몫(자리들, 10),
      /*
       * 🔴 **한 편이 끌고 있나.** 2021 은 윗열 몫이 71.7% 인데 그 해는 오징어 게임 해다.
       *   ⛔ 「머리가 커졌다」가 실은 「큰 게 하나 나왔다」면 전혀 다른 이야기다.
       *   ⭐ 가장 큰 한 편을 **빼고** 다시 잰다. 빼고도 오르면 머리가 두꺼워진 것이다.
       */
      topOnePc: 윗몫(자리들, 1),
      /*
       * ⭐ 이름을 낸다. ⛔ 줄세우기가 아니다 — **한 편이 그 해 자리의 4분의 1을 가져간 것**은
       *   그 자체가 사실이고, 안 적으면 독자가 물을 것을 우리가 숨긴 꼴이 된다.
       *   ⚠ 둘째·셋째는 안 적는다. 그 순간 순위표가 된다.
       */
      biggestTitle: [...y.작품].sort((a, b) => b[1] - a[1])[0][0],
      biggestPlaces: [...y.작품].sort((a, b) => b[1] - a[1])[0][1],
      topTenPcWithoutBiggest: (() => {
        const s = [...자리들].sort((a, b) => b - a).slice(1);   /* 가장 큰 한 편을 뺀다 */
        return 윗몫(s, 10);
      })(),
      topTenPlaces: [...자리들].sort((a, b) => b - a).slice(0, 10).reduce((a, b) => a + b, 0),
      /* 머리를 뺀 나머지가 몇 편이고 자리를 얼마나 갖나 — 꼬리가 마른 것인지 여기서 보인다 */
      restTitles: y.작품.size - 10,
      restPlaces: 총자리 - [...자리들].sort((a, b) => b - a).slice(0, 10).reduce((a, b) => a + b, 0),
    };
  }).map((y) => ({
    ...y,
    restPlacesPerTitle: y.restTitles > 0 ? +(y.restPlaces / y.restTitles).toFixed(1) : null,
  }));

  /* ── 스스로 본다 ── */
  if (!byYear.length) throw new Error('해를 하나도 못 갈랐다');
  for (const y of byYear) {
    if (y.titles > y.places) throw new Error(`${y.year} — 작품이 자리보다 많다`);
    if (y.topTenPc != null && (y.topTenPc < 0 || y.topTenPc > 100)) {
      throw new Error(`${y.year} — 윗 열 편 몫이 ${y.topTenPc} 다`);
    }
    if (y.topTenPlaces > y.places) throw new Error(`${y.year} — 윗 열 편 자리가 전체보다 많다`);
    if (y.tinyTitles > y.titles) throw new Error(`${y.year} — 꼬리가 전체보다 많다`);
  }
  const 온전 = byYear.filter((y) => y.weeks >= 40);
  if (온전.length < 2) throw new Error('온전한 해가 둘이 안 된다 — 추세를 못 말한다');
  const 첫 = 온전[0]; const 끝 = 온전[온전.length - 1];

  const out = {
    generated: 지금(),
    source: 'Netflix Top 10 (Tudum) weekly country lists, 2021-07-04 to 2026-07-26, Russia excluded.',
    question: 'Netflix has announced a larger Korean slate for 2026. On its own charts the number of Korean '
      + 'titles reaching any country top 10 has been falling since 2022, while the number of places they '
      + 'hold has not. So where did the places go: to bigger hits, or away from small ones?',
    unit: 'A place is one title, in one country, in one week. A title is counted once per year however many '
      + 'countries or weeks it appears in. Seasons of one show are counted as that show, not separately, so '
      + 'that a change in how Netflix labels seasons cannot move the title count.',
    whyNotPlacesPerTitle: 'Places divided by titles rose from '
      + `${첫.placesPerTitle} to ${끝.placesPerTitle}, but that single figure is a quotient of two moving `
      + 'numbers and cannot say which one moved. The columns beside it separate them.',
    rowsRead: 줄,
    partialYears: byYear.filter((y) => y.weeks < 40).map((y) => y.year),
    byYear,
    firstFullYear: 첫.year,
    lastFullYear: 끝.year,
    titlesFirst: 첫.titles,
    titlesLast: 끝.titles,
    titlesChangePc: 몫(끝.titles - 첫.titles, 첫.titles),
    placesFirst: 첫.places,
    placesLast: 끝.places,
    placesChangePc: 몫(끝.places - 첫.places, 첫.places),
    topTenFirst: 첫.topTenPc,
    topTenLast: 끝.topTenPc,
    topOneFirst: 첫.topOnePc,
    topOneLast: 끝.topOnePc,
    topTenWithoutBiggestFirst: 첫.topTenPcWithoutBiggest,
    topTenWithoutBiggestLast: 끝.topTenPcWithoutBiggest,
    whyWithoutBiggest: 'A rise in what the ten biggest titles hold could be one very large title rather than '
      + 'a thicker head. The same figure is therefore shown with the single biggest title of each year '
      + 'removed; if it still rises, no one title is carrying it.',
    tinyFirst: 첫.tinyTitles,
    tinyLast: 끝.tinyTitles,
    restPerTitleFirst: 첫.restPlacesPerTitle,
    restPerTitleLast: 끝.restPlacesPerTitle,
    cannotAnswer: 'This counts what reached a top 10, not what was released. A year with fewer charting titles '
      + 'may have had fewer Korean titles released, or the same number with fewer of them charting, and '
      + 'Netflix publishes no release counts by country of origin that would separate those. It also says '
      + 'nothing about viewing: a top 10 is a rank list, and a title just outside it is invisible here.',
  };
  fs.writeFileSync(낼파일, `${JSON.stringify(out, null, 2)}\n`, 'utf8');

  console.log(`줄 ${줄.toLocaleString('en-US')}`);
  console.log('해   주  작품  자리   작품당  가운데  꼬리(≤5)  윗10몫  나머지 편수 · 편당');
  for (const y of byYear) {
    console.log(`${y.year} ${String(y.weeks).padStart(3)} ${String(y.titles).padStart(5)} ${String(y.places).padStart(6)} `
      + `${String(y.placesPerTitle).padStart(7)} ${String(y.medianPlaces).padStart(6)} `
      + `${String(y.tinyTitles).padStart(6)} (${String(y.tinyPc).padStart(4)}%) ${String(y.topTenPc).padStart(6)}% `
      + `${String(y.restTitles).padStart(6)} · ${String(y.restPlacesPerTitle).padStart(5)}${y.weeks < 40 ? '  ⚠ 덜 찬 해' : ''}`);
  }
  console.log(`\n온전한 해 ${첫.year} → ${끝.year}`);
  console.log(`  작품    ${out.titlesFirst} → ${out.titlesLast}  (${out.titlesChangePc}%)`);
  console.log(`  자리    ${out.placesFirst.toLocaleString('en-US')} → ${out.placesLast.toLocaleString('en-US')}  (${out.placesChangePc}%)`);
  console.log(`  윗10몫  ${out.topTenFirst}% → ${out.topTenLast}%`);
  console.log(`  ↳ 가장 큰 한 편 빼고  ${out.topTenWithoutBiggestFirst}% → ${out.topTenWithoutBiggestLast}%  ← 한 편이 끄나`);
  console.log(`  가장 큰 한 편  ${out.topOneFirst}% → ${out.topOneLast}%`);
  console.log(`  꼬리    ${out.tinyFirst}편 → ${out.tinyLast}편`);
  console.log(`  나머지 편당 자리  ${out.restPerTitleFirst} → ${out.restPerTitleLast}  ← 머리를 뺀 쪽이 움직였나`);
  console.log(`→ ${낼파일}`);
}
