#!/usr/bin/env node
/**
 * **동남아는 한국 선수를 얼마나, 그리고 서로 다르게 읽나** (`/sea-athletes`)
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 *   사장님 지시(8/13) — 「동남아에서 인기 있는 한국인 프로스포츠선수, 이스포츠 포함」.
 *   ⛔ 「동남아」를 한 덩어리로 묻지 않는다. **나라마다 다른 얼굴을 본다.**
 *      그 다름이 이 지면의 발견이고, 하나로 뭉치면 그 발견이 사라진다.
 *
 * ── ⛔ 이 지면이 지키는 것 ────────────────────────────────────
 * ⛔ **순위표를 만들지 않는다.** 나라 넷을 나란히 놓고 **왜 다른지**를 같이 적는다.
 * ⛔ 문서가 없는 것(`null`)과 아무도 안 본 것(`0`)과 **못 잰 것**(`undefined`)을 안 섞는다.
 * ⛔ 필리핀을 0 으로 적지 않는다. **못 잰다**고 적는다.
 * ⛔ 광고 자리를 만들지 않는다. Riot Production(App 866800) 승인 전이다.
 * ⚠ 「인기」라고 쓰지 않는다. 우리가 잰 것은 **찾아본 횟수**다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 지금 } from './_kst.mjs';

const 원자료 = 'archive/raw/wikipedia/sea-athletes.json';
const 결과 = 'src/data/wikitip-sea-athletes.json';
const 나라이름 = { id: 'Indonesia', vi: 'Vietnam', th: 'Thailand', ms: 'Malaysia' };
const 판이름 = { id: 'Indonesian', vi: 'Vietnamese', th: 'Thai', ms: 'Malay' };
const 몇명 = 8;                /* 나라마다 몇 명까지 보일까 — ⛔ 길게 늘어놓으면 줄세우기가 된다 */

/**
 * 한 판에서 가장 많이 찾아본 사람들. ⛔ 못 잰 것은 넣지 않는다.
 * @param 역할 'player' 면 **선수만**(사장님이 물으신 것), null 이면 감독까지 다.
 *   ⚠ `both`(선수 겸 감독)는 선수 표에서 뺀다 — 신태용·박항서는 지금 감독으로 읽힌다.
 */
export function 판으뜸(사람들, 판, n = 몇명, 역할 = null) {
  return 사람들
    .filter((x) => typeof x.perMillion?.[판] === 'number')
    .filter((x) => (역할 === null ? true : (x.role ?? 'player') === 역할))
    .sort((a, b) => b.perMillion[판] - a.perMillion[판])
    .slice(0, n)
    .map((x) => ({
      name: x.name, sports: x.sports, role: x.role ?? 'player',
      /* ⚠ 백만분율만 내면 읽는 사람이 「이게 뭐지」가 된다. **원래 횟수를 옆에 둔다** */
      perMillion: x.perMillion[판], views: x.views[판],
      ...(쏠림(x) ?? {}),
    }));
}

/** 나라 넷의 으뜸 얼굴이 **같은 사람인가**. 이게 이 지면의 물음이다 */
export function 얼굴이같나(으뜸모음) {
  const 첫째들 = Object.values(으뜸모음).map((v) => v[0]?.name).filter(Boolean);
  return { names: 첫째들, allSame: new Set(첫째들).size === 1, distinct: new Set(첫째들).size };
}

/**
 * ⭐ **한 나라에 얼마나 쏠렸나.** 감독이 선수와 다른 점이 여기다 —
 *   선수는 여러 나라에서 고루 읽히고, 감독은 **자기가 맡은 한 나라에서만** 읽힌다.
 *   ⛔ 「쏠렸다」를 눈으로 보고 쓰지 않는다. 으뜸 나라 몫으로 잰다.
 */
export function 쏠림(줄) {
  const 판들 = Object.keys(나라이름);
  const 값 = 판들.map((p) => 줄.perMillion?.[p]).filter((v) => typeof v === 'number');
  const 합 = 값.reduce((a, b) => a + b, 0);
  if (!합) return null;
  const 으뜸 = Math.max(...값);
  const 어디 = 판들.find((p) => 줄.perMillion?.[p] === 으뜸);
  return { topEdition: 어디, topSharePc: +((100 * 으뜸) / 합).toFixed(1) };
}

/**
 * ⭐ 「읽히나」보다 앞선 물음 — **그 판에 문서가 있기는 한가.**
 *   읽힌 횟수는 문서가 있는 사람만 낸다. 그래서 문서 수가 관심의 첫 자국이다.
 */
export function 문서수(사람들, 판) {
  return 사람들.filter((x) => x.titles?.[판]).length;
}

/** 종목 구성 — 한 판을 이스포츠가 얼마나 차지하나 */
export function 종목몫(사람들, 판) {
  const 잰것 = 사람들.filter((x) => typeof x.perMillion?.[판] === 'number' && x.perMillion[판] > 0);
  const 총 = 잰것.reduce((a, x) => a + x.perMillion[판], 0);
  const 셈 = new Map();
  for (const x of 잰것) {
    /* 한 사람이 두 종목이면 첫 종목으로 센다 — ⛔ 두 번 세면 몫이 100 을 넘는다 */
    const s = x.sports[0] ?? 'other';
    셈.set(s, (셈.get(s) ?? 0) + x.perMillion[판]);
  }
  return [...셈].map(([sport, v]) => ({
    sport, perMillion: +v.toFixed(2), sharePc: 총 ? +((100 * v) / 총).toFixed(1) : null,
  })).sort((a, b) => b.perMillion - a.perMillion);
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    if (JSON.stringify(실제) === JSON.stringify(바람)) 통 += 1;
    else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  const 셋 = [
    { name: 'A', sports: ['football'], perMillion: { id: 5, vi: 1 }, views: { id: 50, vi: 10 } },
    { name: 'B', sports: ['esports'], perMillion: { id: 2, vi: 9 }, views: { id: 20, vi: 90 } },
    { name: 'C', sports: ['football'], perMillion: { id: undefined, vi: 3 }, views: {} },
  ];
  재본다('판으뜸 — 큰 것부터', 판으뜸(셋, 'id').map((x) => x.name), ['A', 'B']);
  재본다('판으뜸 — ⛔ 못 잰 사람(undefined)은 뺀다', 판으뜸(셋, 'id').length, 2);
  재본다('판으뜸 — 판마다 순서가 다르다', 판으뜸(셋, 'vi').map((x) => x.name), ['B', 'C', 'A']);
  재본다('얼굴이같나 — 다르면 distinct 가 2',
    얼굴이같나({ id: 판으뜸(셋, 'id'), vi: 판으뜸(셋, 'vi') }),
    { names: ['A', 'B'], allSame: false, distinct: 2 });
  재본다('얼굴이같나 — 같으면 allSame',
    얼굴이같나({ id: [{ name: 'A' }], vi: [{ name: 'A' }] }).allSame, true);
  재본다('종목몫 — 몫의 합이 100', +종목몫(셋, 'id').reduce((a, x) => a + x.sharePc, 0).toFixed(0), 100);
  재본다('종목몫 — 이스포츠를 따로 센다',
    종목몫(셋, 'vi').find((x) => x.sport === 'esports')?.perMillion, 9);
  재본다('문서수 — 조회수가 아니라 문서가 있나를 센다', 문서수([
    { titles: { id: 'A' } }, { titles: { id: 'B', vi: 'B' } }, { titles: {} },
  ], 'id'), 2);
  재본다('문서수 — 판마다 다르다', 문서수([
    { titles: { id: 'A' } }, { titles: { id: 'B', vi: 'B' } }, { titles: {} },
  ], 'vi'), 1);
  재본다('쏠림 — 한 나라에 다 몰리면 100%',
    쏠림({ perMillion: { id: 0, vi: 50, th: 0, ms: 0 } }), { topEdition: 'vi', topSharePc: 100 });
  재본다('쏠림 — 고루 퍼지면 낮다',
    쏠림({ perMillion: { id: 25, vi: 25, th: 25, ms: 25 } }).topSharePc, 25);
  재본다('쏠림 — 아무 값도 없으면 null(0 이 아니다)',
    쏠림({ perMillion: { id: null, vi: undefined } }), null);
  재본다('나라 넷', Object.keys(나라이름).length, 4);
  재본다('⛔ 필리핀은 나라 목록에 없다', Object.keys(나라이름).includes('ph'), false);
  console.log(`동남아 지면 짓는 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  if (!fs.existsSync(원자료)) { console.error(`⛔ 없다 — ${원자료}`); process.exit(1); }
  const d = JSON.parse(fs.readFileSync(원자료, 'utf8'));
  const 판들 = d.editionsSea;

  const 으뜸 = {};       /* 선수만 — 사장님이 물으신 것 */
  const 겸직으뜸 = {};    /* 선수 겸 감독 — 지금 그 나라 대표팀을 맡은 사람들 */
  const 종목 = {};
  for (const p of 판들) {
    으뜸[p] = 판으뜸(d.people, p, 몇명, 'player');
    겸직으뜸[p] = 판으뜸(d.people, p, 8, 'both');
    종목[p] = 종목몫(d.people, p);
  }
  const 얼굴 = 얼굴이같나(으뜸);

  /**
   * ⭐ 사장님 물음(8/13) — 「손흥민 외 이강인 등에 전혀 무관심? 감독은 쓸만한 데이터가 있니」
   *   손흥민 하나로 지면을 채운 것은 내 잘못이다. **선수와 감독을 나란히 놓고 넷을 다 낸다.**
   */
  const 줄만들기 = (x) => ({
    name: x.name,
    role: x.role ?? 'player',
    sport: x.sports[0],
    perMillion: Object.fromEntries(판들.map((p) => [p, x.perMillion[p] ?? null])),
    views: Object.fromEntries(판들.map((p) => [p, x.views[p] ?? null])),
    seaPerMillionTotal: x.seaPerMillionTotal,
    ...(쏠림(x) ?? {}),
  });
  const 축구 = d.people.filter((x) => x.sports.includes('football') && x.seaPerMillionTotal > 0);
  const 선수줄 = 축구.filter((x) => (x.role ?? 'player') === 'player')
    .sort((a, b) => b.seaPerMillionTotal - a.seaPerMillionTotal).slice(0, 14).map(줄만들기);
  const 감독줄 = 축구.filter((x) => x.role === 'both')
    .sort((a, b) => b.seaPerMillionTotal - a.seaPerMillionTotal).slice(0, 12).map(줄만들기);

  /* 🔴 감독이 선수를 이기나 — 눈으로 보지 않고 센다 */
  const 선수맨위 = 선수줄[0]?.seaPerMillionTotal ?? 0;
  const 감독맨위 = 감독줄[0]?.seaPerMillionTotal ?? 0;
  const 감독이이긴선수 = 선수줄.filter((x) => x.seaPerMillionTotal < 감독맨위).length;
  /** 쏠림 가운데값 — 감독이 선수보다 한 나라에 몰리나 */
  const 가운데쏠림 = (줄들) => {
    const v = 줄들.map((x) => x.topSharePc).filter((x) => typeof x === 'number').sort((a, b) => a - b);
    return v.length ? v[v.length >> 1] : null;
  };

  /* 한 판에서라도 잰 사람이 몇인가 · 이스포츠가 든 사람이 몇인가 */
  const 이스포츠 = d.people.filter((x) => x.sports.includes('esports'));

  const out = {
    generated: 지금(),
    source: d.source,
    window: d.window,
    unit: 'Reads per million reads of the whole language edition, 12 months. One row is one person.',
    editions: 판들.map((p) => ({
      code: p,
      country: 나라이름[p],
      language: 판이름[p],
      editionReads: d.editionTotals[p],
      /** ⭐ 읽히기 전에 — 그 판이 한국 선수를 몇 명이나 적어 두었나 */
      koreanAthletesWithArticle: 문서수(d.people, p),
    })),
    peopleFound: d.peopleFound,
    peopleMeasured: d.peopleMeasured,
    peopleNotMeasured: d.peopleNotMeasured,
    esportsMeasured: 이스포츠.length,
    topByEdition: 으뜸,
    /** ⭐ 사장님 물음(8/13) — 선수와 감독을 나란히, 나라 넷을 다 낸다 */
    footballPlayers: 선수줄,
    footballManagers: 감독줄,
    managersBeatingPlayers: 감독이이긴선수,
    playersListed: 선수줄.length,
    topPlayerTotal: 선수맨위,
    topManagerTotal: 감독맨위,
    medianTopSharePlayers: 가운데쏠림(선수줄),
    medianTopShareManagers: 가운데쏠림(감독줄),
    playerVsManager: `The most-read Korean manager scores ${감독맨위} against the most-read player's `
      + `${선수맨위}. Of the ${선수줄.length} players listed, ${감독이이긴선수} score below the top manager. `
      + 'A manager is read in one country and a player in several, which is why the two are in '
      + 'separate tables and not one ranking.',
    roleCounts: d.roleCounts ?? null,
    whyCoachesAreSeparate: 'Wikidata records both roles for anyone who played before managing, so '
      + 'it cannot say which one a reader came for. We keep them in their own table rather than '
      + 'rank a national-team manager against a player. In two of these four countries the '
      + 'most-read Korean is a manager, and that is the finding, not a nuisance.',
    sportMixByEdition: 종목,
    /** ⭐ 이 지면의 물음 — 나라 넷이 같은 얼굴을 찾아보나 */
    topNamesAcrossEditions: 얼굴.names,
    sameFaceEverywhere: 얼굴.allSame,
    distinctTopFaces: 얼굴.distinct,
    question: 'Four Southeast Asian Wikipedias, four different Korean athletes at the top. '
      + 'The question is not who is biggest but why the four lists disagree.',
    whyNotPhilippines: d.whyNotPhilippines,
    whyThisIsAFloor: d.whyThisIsAFloor,
    cannotAnswer: d.cannotAnswer,
    noArticleIsNotNoInterest: `Of ${d.peopleFound.toLocaleString('en-US')} Korean athletes on `
      + `Wikidata, ${(d.peopleFound - d.peopleMeasured - d.peopleNotMeasured).toLocaleString('en-US')} `
      + 'have no article in any of these four editions. That is an absence of an article, not an '
      + 'absence of interest, and we do not count it as a zero.',
  };
  fs.writeFileSync(결과, `${JSON.stringify(out, null, 2)}\n`);

  console.log(`⭐ ${결과}`);
  console.log(`   잰 사람 ${d.peopleMeasured}명 · 못 잰 사람 ${d.peopleNotMeasured}명 · 이스포츠 ${이스포츠.length}명`);
  console.log(`   나라 넷의 으뜸: ${얼굴.names.join(' · ')}  → 서로 다른 얼굴 ${얼굴.distinct}`);
  for (const p of 판들) {
    console.log(`\n   ${나라이름[p]} (${p})`);
    for (const x of 으뜸[p].slice(0, 6)) {
      console.log(`      ${x.name.padEnd(22)} ${String(x.perMillion).padStart(7)} /백만  `
        + `${String(x.views).padStart(7)}회  [${x.sports.join(',')}]`);
    }
    console.log(`      · 선수 겸 감독: ${겸직으뜸[p].map((x) => `${x.name} ${x.perMillion}`).join(' · ') || '없음'}`);
    console.log(`      종목몫: ${종목[p].slice(0, 4).map((s) => `${s.sport} ${s.sharePc}%`).join(' · ')}`);
  }
}
