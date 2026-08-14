#!/usr/bin/env node
/**
 * **차트에서 어떻게 나가나** — 들어오는 것은 다 쟀고, 나가는 것은 한 번도 안 쟀다.
 *
 * ── 왜 이 물음인가 ─────────────────────────────────────────────
 *   우리 지면은 들어오는 쪽을 여럿 잰다 — 몇 나라에 한꺼번에 뜨나(/arrival),
 *   들어온 주가 가장 높은 자리인가(/climb), 몇 주를 버티나(/staying-power).
 *   ⚠ 그런데 **마지막 주에 몇 위였나**는 아무 데도 없다.
 *   ⭐ 그것이 「떨어졌다」의 뜻을 바꾼다 —
 *      10위에서 사라지면 **바닥에서 미끄러진 것**이고,
 *      3위에서 사라지면 작품이 죽은 게 아니라 **남이 밀고 들어온 것**이다.
 *      돈을 어디에 쓸지 정하는 사람에게 이 둘은 전혀 다른 이야기다.
 *
 * ── ⭐ 대조군이 공짜로 있다 ────────────────────────────────────
 *   나라·주마다 1~10위가 **정확히 한 자리씩** 있다. 그러니 자리가 나가는 것과
 *   상관없다면 나가는 자리는 **각 10.0%** 여야 한다. 흉내 낼 것이 없다 — 판이 대조군이다.
 *
 * ── ⛔ 이 자가 지키는 것 ────────────────────────────────────
 * ⛔ 🔴 **자료가 끝나서 사라진 것을 「나갔다」로 세지 않는다.** 마지막 주에 차트에 있던 작품은
 *    나간 적이 없다. 그것을 섞으면 마지막 주 자리 분포가 통째로 딸려 들어온다.
 * ⛔ 🔴 **그 나라 차트가 빠진 주도 「나갔다」가 아니다.** 우리가 못 본 것이지 작품이 나간 게 아니다.
 * ⛔ **한 주만 뜬 작품은 들어온 자리 = 나간 자리**다. 갈라서 따로 센다. 섞으면 둘 다 흐려진다.
 * ⛔ 시장을 줄세우지 않는다. 양 끝을 나란히 놓고 **왜 다른지**를 같이 적는다.
 * ⚠ 「돌아온 작품」이 있다(/returns). 그래서 **한 번 나간 것**이 아니라 **한 구간이 끝난 것**을 센다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { koreanTitleFilter } from './lib/korean-netflix-titles.mjs';
import { 지금 } from './_kst.mjs';

const 나라파일 = 'archive/raw/netflix-top10/countries.ndjson';
const 낼파일 = 'src/data/wikitip-exit.json';

/** 몫. 밑이 0 이면 **0 이 아니라 null** */
export function 몫(a, b) {
  if (!b) return null;
  return +((100 * a) / b).toFixed(1);
}

/**
 * 이어 붙은 주들을 **구간**으로 가른다.
 * ⛔ 「주 사이가 7일」로 세지 않는다. 그 나라 차트가 통째로 빠진 주가 있으면 헛나뉜다.
 *    **그 나라에 실제로 있는 주 차례**에서 바로 다음인지를 본다.
 * @param 있는주 그 작품이 그 나라에서 나온 주(정렬됨)
 * @param 차례 그 나라 전체 주 → 몇 번째인지
 */
export function 구간들(있는주, 차례) {
  const 결과 = [];
  let 지금 = null;
  for (const w of 있는주) {
    const i = 차례.get(w);
    if (i == null) continue;
    if (지금 && i === 지금.끝차례 + 1) { 지금.끝 = w; 지금.끝차례 = i; 지금.주수 += 1; }
    else { 지금 = { 첫: w, 끝: w, 첫차례: i, 끝차례: i, 주수: 1 }; 결과.push(지금); }
  }
  return 결과;
}

/**
 * 이 구간이 **정말 나간 것**인가.
 * ⛔ 그 나라의 마지막 주에 아직 있었다면 나간 게 아니다 — 우리 자료가 끝난 것이다.
 */
export function 나갔나(구간, 그나라주수) {
  return 구간.끝차례 < 그나라주수 - 1;
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    if (JSON.stringify(실제) === JSON.stringify(바람)) 통 += 1;
    else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  const 차례 = new Map([['w1', 0], ['w2', 1], ['w3', 2], ['w4', 3], ['w5', 4]]);
  재본다('이어진 것은 한 구간', 구간들(['w1', 'w2', 'w3'], 차례).length, 1);
  재본다('끊기면 두 구간', 구간들(['w1', 'w3'], 차례).length, 2);
  재본다('구간의 주수', 구간들(['w1', 'w2', 'w3'], 차례)[0].주수, 3);
  /* ⛔ 그 나라에 w3 자체가 없으면 w2→w4 는 **끊긴 것이 아니다** */
  const 빠진차례 = new Map([['w1', 0], ['w2', 1], ['w4', 2]]);
  재본다('나라 차트가 빠진 주는 끊김이 아니다', 구간들(['w2', 'w4'], 빠진차례).length, 1);
  재본다('모르는 주는 버린다', 구간들(['w1', 'zz'], 차례)[0].주수, 1);
  재본다('빈 것', 구간들([], 차례), []);
  /* ⛔ 마지막 주에 있던 것은 나간 것이 아니다 */
  재본다('마지막 주면 안 나갔다', 나갔나({ 끝차례: 4 }, 5), false);
  재본다('마지막 앞이면 나갔다', 나갔나({ 끝차례: 3 }, 5), true);
  재본다('몫 — 밑이 0 이면 null', 몫(1, 0), null);
  console.log(`나가는 자리 수집기 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  if (!fs.existsSync(나라파일)) {
    console.log(`⛔ 원자료가 없다 — ${나라파일}`);
    console.log('   ⚠ archive/ 는 git 에 안 올라간다. 「안 됐다」가 아니라 **못 쟀다**.');
    process.exit(1);
  }
  const ko = koreanTitleFilter();

  /* 나라 → 그 나라에 있는 주 · 나라·제목 → 나온 주들 */
  const 나라주 = new Map();
  const 묶음 = new Map();          /* `${iso2}|${제목}` → { 주: [], 순위: Map(주→순위), 한국 } */
  let 줄 = 0;
  let 덮어쓴것 = 0;
  for (const l of fs.readFileSync(나라파일, 'utf8').split('\n')) {
    if (!l) continue;
    줄 += 1;
    let r;
    try { r = JSON.parse(l); } catch { continue; }
    const iso2 = String(r.iso2).toUpperCase();
    if (iso2 === 'RU') continue;
    if (!나라주.has(iso2)) 나라주.set(iso2, new Set());
    나라주.get(iso2).add(r.주);
        /*
     * 🔴🔴 2026-08-09 23:0x — **열쇠에 구분(TV·영화)이 빠져 있었다.**
     *   같은 이름이 그 나라 그 주에 두 차트에 함께 오르면 **한 줄이 통째로 사라졌다** —
     *   재 보니 **26,018줄(5.28%)**. 그래서 앉은 자리가 10.0% 씩이 아니라 9.1~10.6% 로 나왔다.
     *   ⭐ 그 어긋남이 아니었으면 못 봤다. 원자료에 물어보니 **49,290칸이 전부 10줄**이었다.
     *   ⛔ 구간은 한 나라의 **한 차트 안에서** 이어진 주다. 두 차트를 이으면 구간도 거짓이 된다.
     * ⛔ 그리고 이 줄에는 **보이지 않는 NUL 문자**가 구분자로 박혀 있었다. 눈에 안 보이는 것을
     *   구분자로 쓰지 않는다 — 다음 사람이 편집하다 조용히 지운다. grep 도 이 파일을 binary 로 봤다.
     */
    /*
     * 🔴🔴 그리고 **시즌도 빠져 있었다.** 한 주 top 10 에 시즌 1과 시즌 2가 **나란히 앉는다**
     *   (AR 2026-05-10 「Envious」 시즌4가 1위·시즌3이 7위). 제목만으로 묶으면 뒤엣것이 앞엣것을
     *   덮어써 **25,987줄이 사라졌다.** 1위는 43,341줄만 남고 10위는 49,290줄 그대로였다 —
     *   덮어쓰기가 늘 **낮은 자리를 살리기** 때문이다.
     * ⭐ 시즌이 맞는 단위다. /returns 에서 이미 「돌아온 줄 알았더니 시즌 2」를 갈라 놨다.
     */
    const k = `${iso2}|${r.구분}|${r.제목}|${r.시즌 ?? ''}`;
    if (!묶음.has(k)) {
      묶음.set(k, { iso2, 국가: r.국가, 주: [], 순위: new Map(), 한국: ko.keepTitle(r.제목), 구분: r.구분 });
    }
    const m = 묶음.get(k);
    /* ⛔ 덮어쓰면 세어 둔다. 조용히 넘기면 이번 같은 것을 또 놓친다 */
    if (m.순위.has(r.주)) 덮어쓴것 += 1;
    m.주.push(r.주);
    m.순위.set(r.주, r.순위);
  }

  const 나라차례 = new Map();
  for (const [iso2, ws] of 나라주) {
    const 정 = [...ws].sort();
    나라차례.set(iso2, { 차례: new Map(정.map((w, i) => [w, i])), 주수: 정.length });
  }

  /* ── 구간을 만들고, 정말 나간 것만 센다 ── */
  /*
   * 🔴🔴 **교란 — 한국 작품은 원래 아래쪽에 많이 앉아 있다.**
   *   한국 작품이 차트에서 차지하는 자리가 애초에 8·9·10 쪽에 몰려 있다면,
   *   나가는 자리가 아래인 것은 **나가는 방식과 아무 상관이 없다.** 앉아 있던 자리가 아래일 뿐이다.
   *   ⛔ 그러면 「한국 56.7% 대 전체 50.5%」는 두 무리의 성질 차이가 아니라 **자리 분포 차이**다.
   * ⭐ 죽이는 법 — 무리마다 **그 무리가 실제로 보낸 모든 주의 자리 분포**를 같이 낸다.
   *   나가는 분포를 10.0% 가 아니라 **자기 앉은 자리 분포**에 대고 잰다. 그게 진짜 대조군이다.
   */
  const 만든다 = () => ({
    구간: 0, 나간것: 0, 안나감: 0, 한주짜리: 0,
    나간자리: new Array(11).fill(0), 들어온자리: new Array(11).fill(0),
    나간자리한주뺀것: new Array(11).fill(0),
    앉은자리: new Array(11).fill(0),
  });
  const 한국 = 만든다();
  const 전체 = 만든다();
  const 시장별 = new Map();

  for (const m of 묶음.values()) {
    const n = 나라차례.get(m.iso2);
    if (!n) continue;
    const 주정 = [...new Set(m.주)].sort();
    /* ⭐ 앉은 자리 — 나가고 말고를 안 가리고 **보낸 모든 주**를 센다 */
    for (const w of 주정) {
      const s = m.순위.get(w);
      if (!(s >= 1 && s <= 10)) continue;
      전체.앉은자리[s] += 1;
      if (m.한국) 한국.앉은자리[s] += 1;
    }
    for (const g of 구간들(주정, n.차례)) {
      for (const 통 of [전체, ...(m.한국 ? [한국] : [])]) {
        통.구간 += 1;
        if (g.주수 === 1) 통.한주짜리 += 1;
        if (!나갔나(g, n.주수)) { 통.안나감 += 1; continue; }
        통.나간것 += 1;
        const 끝순 = m.순위.get(g.끝);
        const 첫순 = m.순위.get(g.첫);
        if (끝순 >= 1 && 끝순 <= 10) {
          통.나간자리[끝순] += 1;
          if (g.주수 > 1) 통.나간자리한주뺀것[끝순] += 1;
        }
        if (첫순 >= 1 && 첫순 <= 10) 통.들어온자리[첫순] += 1;
      }
      if (!m.한국) continue;
      if (!나갔나(g, n.주수)) continue;
      const 끝순 = m.순위.get(g.끝);
      if (!(끝순 >= 1 && 끝순 <= 10)) continue;
      if (!시장별.has(m.국가)) 시장별.set(m.국가, { 국가: m.국가, 나간것: 0, 아래셋: 0 });
      const s = 시장별.get(m.국가);
      s.나간것 += 1;
      if (끝순 >= 8) s.아래셋 += 1;
    }
  }

  const 자리표 = (통) => {
    const 총 = 통.나간자리.reduce((a, b) => a + b, 0);
    const 총한주뺀 = 통.나간자리한주뺀것.reduce((a, b) => a + b, 0);
    const 총앉은 = 통.앉은자리.reduce((a, b) => a + b, 0);
    return Array.from({ length: 10 }, (_, i) => {
      const r = i + 1;
      const 앉 = 몫(통.앉은자리[r], 총앉은);
      const 나 = 몫(통.나간자리[r], 총);
      return {
        rank: r,
        exits: 통.나간자리[r],
        exitPc: 나,
        exitPcMultiWeek: 몫(통.나간자리한주뺀것[r], 총한주뺀),
        entriesPc: 몫(통.들어온자리[r], 통.들어온자리.reduce((a, b) => a + b, 0)),
        /* ⭐ 이 자리에서 보낸 주 가운데 몇 %가 그 주에 끝났나 — 자리 분포를 나눠 없앤다 */
        weeksPc: 앉,
        weeksAtRank: 통.앉은자리[r],
        endRatePc: 몫(통.나간자리[r], 통.앉은자리[r]),
      };
    });
  };

  const 한국표 = 자리표(한국);
  const 전체표 = 자리표(전체);
  /* ⭐ 아래 셋(8·9·10) 이 나가는 자리의 몇 %인가. 자리와 상관없다면 30.0% 여야 한다 */
  const 아래셋 = (표) => +표.slice(7).reduce((a, b) => a + (b.exitPc ?? 0), 0).toFixed(1);
  const 위셋 = (표) => +표.slice(0, 3).reduce((a, b) => a + (b.exitPc ?? 0), 0).toFixed(1);
  /* ⭐ 앉은 자리 쪽 아래 셋 — 이것과 나가는 아래 셋을 나란히 놔야 교란이 죽는다 */
  const 앉은아래셋 = (표) => +표.slice(7).reduce((a, b) => a + (b.weeksPc ?? 0), 0).toFixed(1);

  /* ── 스스로 본다 ── */
  /*
   * 🔴🔴 **이 검사가 오늘 나를 잡았다.** 나라·주·차트마다 1~10위가 정확히 한 자리씩 있으므로,
   *   우리가 제대로 읽었다면 **앉은 자리가 자리마다 정확히 10.0%** 여야 한다.
   *   ⛔ 처음에 9.28~10.56% 가 나왔고, 그 어긋남 하나가 열쇠에서 시즌이 빠진 것을 드러냈다.
   *   ⭐ 이 성질을 검사로 못박는다. 다시 어긋나면 **기사가 나가기 전에** 선다.
   */
  const 앉은합 = 전체.앉은자리.reduce((a, b) => a + b, 0);
  for (let r = 1; r <= 10; r += 1) {
    const p = (100 * 전체.앉은자리[r]) / 앉은합;
    if (Math.abs(p - 10) > 0.15) {
      throw new Error(`앉은 자리 ${r}위가 ${p.toFixed(2)}% 다 — 10.0% 라야 한다. 줄을 잃고 있다(열쇠를 본다)`);
    }
  }
  if (덮어쓴것 > 50) throw new Error(`같은 칸을 ${덮어쓴것}번 덮어썼다 — 열쇠가 모자란다`);
  if (!한국.나간것) throw new Error('한국 작품 구간이 하나도 안 나갔다 — 셈이 틀렸다');
  const 합 = 한국표.reduce((a, b) => a + (b.exitPc ?? 0), 0);
  if (Math.abs(합 - 100) > 0.5) throw new Error(`나간 자리 몫 합이 ${합} 이다 — 100 이라야 한다`);
  if (한국.나간것 + 한국.안나감 !== 한국.구간) throw new Error('나간 것 + 안 나간 것이 구간 수와 다르다');
  /* 🔴 이 자의 요점이다 — 안 나간 것(자료 끝)을 안 세고 있나 */
  if (!한국.안나감) throw new Error('안 나간 구간이 0 이다 — 자료 끝 걸러내기가 안 돌았다');

  /* 시장 — ⛔ 줄세우지 않는다. 양 끝만 나란히 놓는다. 얇은 시장은 뺀다 */
  const 시장최소 = 40;
  const 시장들 = [...시장별.values()].filter((s) => s.나간것 >= 시장최소)
    .map((s) => ({ ...s, 아래셋몫: 몫(s.아래셋, s.나간것) }))
    .sort((a, b) => b.아래셋몫 - a.아래셋몫);

  const out = {
    generated: 지금(),
    source: 'Netflix Top 10 (Tudum) weekly country lists, 2021-07-04 to 2026-07-26, Russia excluded.',
    question: 'Everything published about a chart is about getting on it. This asks the other question: '
      + 'when a title leaves, what position was it in the week before it went?',
    unit: 'A run is one title in one country across consecutive chart weeks. A title that leaves and comes '
      + 'back later has two runs, because the two departures are two separate events.',
    whyTheBaselineIsFree: 'Every country-week has exactly one title at each position from 1 to 10. If leaving '
      + 'had nothing to do with position, departures would fall at 10.0% on each rank. Nothing has to be '
      + 'simulated: the chart itself is the control.',
    whatWasExcluded: 'A run still on the chart in the last week we hold has not left — our data ended, the run '
      + 'did not. Those runs are counted and set aside rather than treated as departures, because including '
      + 'them would import the final week\'s whole position table into the answer.',
    rowsRead: 줄,
    rowsOverwritten: 덮어쓴것,
    marketCount: 나라주.size,
    weekCount: Math.max(...[...나라차례.values()].map((x) => x.주수)),
    korean: {
      runs: 한국.구간,
      departures: 한국.나간것,
      stillOnChart: 한국.안나감,
      singleWeekRuns: 한국.한주짜리,
      byRank: 한국표,
      bottomThreePc: 아래셋(한국표),
      topThreePc: 위셋(한국표),
      weeksBottomThreePc: 앉은아래셋(한국표),
    },
    allTitles: {
      runs: 전체.구간,
      departures: 전체.나간것,
      byRank: 전체표,
      bottomThreePc: 아래셋(전체표),
      topThreePc: 위셋(전체표),
      weeksBottomThreePc: 앉은아래셋(전체표),
    },
    whyWeeksColumnIsHere: 'Korean titles do not sit evenly across a chart, so departures could look '
      + 'bottom-heavy simply because Korean weeks are bottom-heavy. Each group is therefore also shown '
      + 'against the positions its own titles actually occupied, which is the comparison that survives.',
    marketMinDepartures: 시장최소,
    marketsMeasured: 시장들.length,
    marketsHigh: 시장들.slice(0, 5),
    marketsLow: 시장들.slice(-5),
    whyMarketsDiffer: 'A market where departures cluster at the bottom is one where a title slides out. A market '
      + 'where they are spread further up is one where titles are pushed out while still ranking well, which '
      + 'happens where the chart turns over quickly. The two ends of this table are not better and worse '
      + 'markets; they are different rates of replacement.',
    cannotAnswer: 'A departure from a top 10 is not a departure from the service. A title that leaves at '
      + 'position 10 may have lost almost no viewing at all, and a title pushed out at position 3 may have '
      + 'lost none. Netflix publishes no viewing figures for country charts, so nothing here measures how '
      + 'many people watched anything.',
  };
  fs.writeFileSync(낼파일, `${JSON.stringify(out, null, 2)}\n`, 'utf8');

  console.log(`줄 ${줄.toLocaleString('en-US')} · 시장 ${나라주.size}`);
  console.log(`한국 구간 ${한국.구간.toLocaleString('en-US')} · 나갔다 ${한국.나간것.toLocaleString('en-US')} · 아직 있다 ${한국.안나감} · 한 주짜리 ${한국.한주짜리.toLocaleString('en-US')}`);
  console.log('\n자리  나갈 때(한국)  앉은 주(한국)  그 자리 끝날 확률  들어올 때  나갈 때(전체)  앉은 주(전체)');
  for (let r = 1; r <= 10; r += 1) {
    const k = 한국표[r - 1]; const a = 전체표[r - 1];
    console.log(`${String(r).padStart(3)} ${String(k.exitPc).padStart(11)}% ${String(k.weeksPc).padStart(12)}% ${String(k.endRatePc).padStart(16)}% ${String(k.entriesPc).padStart(9)}% ${String(a.exitPc).padStart(13)}% ${String(a.weeksPc).padStart(12)}%`);
  }
  console.log(`\n아래 셋(8·9·10)  한국 ${out.korean.bottomThreePc}% · 전체 ${out.allTitles.bottomThreePc}%   ⭐ 자리와 무관하면 30.0%`);
  console.log(`  ↳ 🔴 앉은 주 기준  한국 ${out.korean.weeksBottomThreePc}% · 전체 ${out.allTitles.weeksBottomThreePc}%  ← 교란이 얼마나 먹었나`);
  console.log(`위 셋(1·2·3)     한국 ${out.korean.topThreePc}% · 전체 ${out.allTitles.topThreePc}%`);
  console.log(`\n시장 ${시장들.length}곳(나간 것 ${시장최소}건 이상) — 아래 셋 몫`);
  for (const s of out.marketsHigh) console.log(`  ↑ ${s.국가.padEnd(22)} ${s.아래셋몫}%  (${s.나간것}건)`);
  for (const s of out.marketsLow) console.log(`  ↓ ${s.국가.padEnd(22)} ${s.아래셋몫}%  (${s.나간것}건)`);
  console.log(`→ ${낼파일}`);
}
