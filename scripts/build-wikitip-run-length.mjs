#!/usr/bin/env node
/**
 * **영화와 시리즈는 다르게 버티나** — 우리가 여태 한 칸에 뭉쳐 놓은 것.
 *
 * ── 왜 이 물음인가 ─────────────────────────────────────────────
 *   오늘 /exit 에서 「어느 자리에서 나가나」를 쟀는데 **영화와 시리즈를 안 갈랐다.**
 *   ⚠ 둘은 버티는 방식이 다를 수밖에 없다 — 시리즈는 **다음 회가 온다.** 영화는 안 온다.
 *   ⭐ 그러면 한 나라 차트에서 **몇 주를 이어 붙어 있나**가 갈라져야 한다.
 *
 * ── ⭐ 대조군이 공짜로 있다 ────────────────────────────────────
 *   넷플릭스는 **영화 차트와 TV 차트를 따로** 낸다. 그러니 둘을 견주는 것은
 *   길이가 같은 두 자를 견주는 것이다(각각 1~10위가 한 자리씩).
 *   ⛔ 그래도 「한국 영화가 짧다」만으로는 부족하다 — **영화가 원래 짧을** 수 있다.
 *      그래서 **한국 아닌 것도 같이 잰다.** 갈래 차이를 빼고 남는 것이 한국 몫이다.
 *
 * ── ⛔ 이 자가 지키는 것 ────────────────────────────────────
 * ⛔ 자료가 끝나서 사라진 구간은 **길이를 모른다.** 「1주였다」로 세면 최근 것이 다 짧아 보인다.
 *    그런 구간은 **빼고 세고, 몇 개를 뺐는지 적는다.**
 * ⛔ 그 나라 차트가 빠진 주를 끊김으로 안 본다. 나라마다 있는 주 차례에서 잰다.
 * ⛔ 열쇠에 **구분과 시즌**을 넣는다. 오늘 이것이 빠져 25,987줄을 잃었다.
 * ⛔ 시장을 줄세우지 않는다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { koreanTitleFilter } from './lib/korean-netflix-titles.mjs';

const 나라파일 = 'archive/raw/netflix-top10/countries.ndjson';
const 낼파일 = 'src/data/wikitip-run-length.json';

/** 몫. 밑이 0 이면 **0 이 아니라 null** */
export function 몫(a, b) {
  if (!b) return null;
  return +((100 * a) / b).toFixed(1);
}

/** 가운데값. ⛔ 빈 것은 0 이 아니라 null */
export function 가운데(들) {
  if (!들.length) return null;
  const s = [...들].sort((a, b) => a - b);
  const i = Math.floor(s.length / 2);
  return s.length % 2 ? s[i] : +((s[i - 1] + s[i]) / 2).toFixed(1);
}

/**
 * 이어 붙은 주를 구간으로 가른다.
 * @returns [{ 끝차례, 주수 }]
 */
export function 구간들(있는주, 차례) {
  const 결과 = [];
  let 지금 = null;
  for (const w of 있는주) {
    const i = 차례.get(w);
    if (i == null) continue;
    if (지금 && i === 지금.끝차례 + 1) { 지금.끝차례 = i; 지금.주수 += 1; 지금.끝 = w; }
    else { 지금 = { 첫: w, 끝: w, 끝차례: i, 주수: 1 }; 결과.push(지금); }
  }
  return 결과;
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
  재본다('가운데 — 홀수', 가운데([3, 1, 2]), 2);
  재본다('가운데 — 짝수는 두 개의 가운데', 가운데([1, 2, 3, 4]), 2.5);
  /* ⛔ 빈 것을 0 으로 돌려주면 「1주짜리」와 구별이 안 된다 */
  재본다('가운데 — 빈 것은 null', 가운데([]), null);
  const 차례 = new Map([['w1', 0], ['w2', 1], ['w3', 2], ['w4', 3]]);
  재본다('이어진 것은 한 구간', 구간들(['w1', 'w2', 'w3'], 차례).length, 1);
  재본다('구간 길이', 구간들(['w1', 'w2', 'w3'], 차례)[0].주수, 3);
  재본다('끊기면 둘', 구간들(['w1', 'w3'], 차례).length, 2);
  /* ⛔ 그 나라에 w2 가 없으면 w1→w3 은 끊긴 것이 아니다 */
  재본다('빠진 주는 끊김이 아니다', 구간들(['w1', 'w3'], new Map([['w1', 0], ['w3', 1]])).length, 1);
  재본다('빈 것', 구간들([], 차례), []);
  console.log(`구간 길이 수집기 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  if (!fs.existsSync(나라파일)) {
    console.log(`⛔ 원자료가 없다 — ${나라파일}`);
    console.log('   ⚠ archive/ 는 git 에 안 올라간다. 「안 됐다」가 아니라 **못 쟀다**.');
    process.exit(1);
  }
  const ko = koreanTitleFilter();

  const 나라주 = new Map();
  const 담 = new Map();
  let 줄 = 0;
  let 덮어쓴것 = 0;
  for (const line of fs.readFileSync(나라파일, 'utf8').split('\n')) {
    if (!line) continue;
    줄 += 1;
    let r;
    try { r = JSON.parse(line); } catch { continue; }
    const iso2 = String(r.iso2).toUpperCase();
    if (iso2 === 'RU') continue;
    if (!나라주.has(iso2)) 나라주.set(iso2, new Set());
    나라주.get(iso2).add(r.주);
    /* ⛔ 구분·시즌이 빠지면 한 주 top10 에 나란히 앉은 시즌이 뭉개진다 */
    const k = `${iso2}|${r.구분}|${r.제목}|${r.시즌 ?? ''}`;
    if (!담.has(k)) 담.set(k, { iso2, 구분: r.구분, 제목: r.제목, 한국: ko.keepTitle(r.제목), 순위: new Map() });
    const m = 담.get(k);
    if (m.순위.has(r.주)) 덮어쓴것 += 1;
    m.순위.set(r.주, r.순위);
  }

  const 나라차례 = new Map();
  for (const [iso2, ws] of 나라주) {
    const 정 = [...ws].sort();
    나라차례.set(iso2, { 차례: new Map(정.map((w, i) => [w, i])), 주수: 정.length });
  }

  /*
   * 🔴 **한 작품이 끌고 있나.** 평균은 아주 긴 구간 몇 개에 흔들린다 —
   *   오늘 /fewer-titles 에서 「머리가 두꺼워졌다」가 실은 오징어 게임 한 편이었다.
   *   ⭐ 그래서 무리마다 **구간을 가장 많이 만든 한 작품을 빼고** 다시 잰다.
   *   ⛔ 빼고도 남으면 한 작품이 끄는 것이 아니다.
   */
  const 만든다 = () => ({
    길이: [], 한주: 0, 나간자리: [], 잘린것: 0, 앉은자리: new Array(11).fill(0),
    작품별: new Map(),
  });
  const 통 = {
    '한국 영화': 만든다(), '한국 시리즈': 만든다(),
    '그 밖 영화': 만든다(), '그 밖 시리즈': 만든다(),
  };
  const 이름 = (한국, 구분) => `${한국 ? '한국' : '그 밖'} ${구분 === 'Films' ? '영화' : '시리즈'}`;

  for (const m of 담.values()) {
    const n = 나라차례.get(m.iso2);
    if (!n) continue;
    const 칸 = 통[이름(m.한국, m.구분)];
    if (!칸) continue;
    for (const [, s] of m.순위) if (s >= 1 && s <= 10) 칸.앉은자리[s] += 1;
    for (const g of 구간들([...m.순위.keys()].sort(), n.차례)) {
      /* ⛔ 자료가 끝나서 잘린 구간은 길이를 모른다. 빼고 세고 몇 개인지 적는다 */
      if (g.끝차례 >= n.주수 - 1) { 칸.잘린것 += 1; continue; }
      칸.길이.push(g.주수);
      if (!칸.작품별.has(m.제목)) 칸.작품별.set(m.제목, []);
      칸.작품별.get(m.제목).push(g.주수);
      if (g.주수 === 1) 칸.한주 += 1;
      const 순 = m.순위.get(g.끝);
      if (순 >= 1 && 순 <= 10) 칸.나간자리.push(순);
    }
  }

  const byGroup = Object.entries(통).map(([이름칸, c]) => {
    const 아래셋 = c.나간자리.filter((x) => x >= 8).length;
    const 앉은합 = c.앉은자리.reduce((a, b) => a + b, 0);
    return {
      group: 이름칸,
      runs: c.길이.length,
      truncated: c.잘린것,
      medianWeeks: 가운데(c.길이),
      meanWeeks: c.길이.length ? +(c.길이.reduce((a, b) => a + b, 0) / c.길이.length).toFixed(2) : null,
      oneWeekPc: 몫(c.한주, c.길이.length),
      fourPlusPc: 몫(c.길이.filter((x) => x >= 4).length, c.길이.length),
      longestRun: c.길이.length ? Math.max(...c.길이) : null,
      exitBottomThreePc: 몫(아래셋, c.나간자리.length),
      /* ⭐ 앉은 자리가 고른지 — 안 고르면 나간 자리 견줌이 흔들린다 */
      weeksBottomThreePc: 몫(c.앉은자리.slice(8).reduce((a, b) => a + b, 0), 앉은합),
      ...(() => {
        /* ⛔ 구간을 가장 많이 만든 한 작품을 뺀다. 빼고도 남으면 한 편이 끄는 것이 아니다 */
        const 들 = [...c.작품별.entries()].sort((a, b) => b[1].length - a[1].length);
        const 큰것 = 들[0];
        const 남은 = 들.slice(1).flatMap(([, v]) => v);
        return {
          biggestTitleRuns: 큰것 ? 큰것[1].length : 0,
          meanWeeksWithoutBiggest: 남은.length
            ? +(남은.reduce((a, b) => a + b, 0) / 남은.length).toFixed(2) : null,
          fourPlusPcWithoutBiggest: 몫(남은.filter((x) => x >= 4).length, 남은.length),
        };
      })(),
    };
  });

  /* ── 스스로 본다 ── */
  const 찾 = (g) => byGroup.find((x) => x.group === g);
  for (const g of byGroup) {
    if (!g.runs) throw new Error(`${g.group} — 구간이 하나도 없다`);
    if (g.oneWeekPc > 100 || g.oneWeekPc < 0) throw new Error(`${g.group} — 한 주짜리 몫이 ${g.oneWeekPc}`);
    if (g.medianWeeks < 1) throw new Error(`${g.group} — 가운데 길이가 ${g.medianWeeks}`);
  }
  if (덮어쓴것 > 50) throw new Error(`같은 칸을 ${덮어쓴것}번 덮어썼다 — 열쇠가 모자란다`);

  /* ⭐ 한국 몫 = (한국 영화−시리즈) − (그 밖 영화−시리즈). 갈래 차이를 뺀 나머지다 */
  const 한영 = 찾('한국 영화'); const 한시 = 찾('한국 시리즈');
  const 밖영 = 찾('그 밖 영화'); const 밖시 = 찾('그 밖 시리즈');
  const 갈래차한국 = +(한시.meanWeeks - 한영.meanWeeks).toFixed(2);
  const 갈래차그밖 = +(밖시.meanWeeks - 밖영.meanWeeks).toFixed(2);

  const out = {
    generated: new Date().toISOString(),
    source: 'Netflix Top 10 (Tudum) weekly country lists, 2021-07-04 to 2026-07-26, Russia excluded.',
    question: 'A series has another episode coming; a film does not. If that changes how long something '
      + 'holds a chart place, the two should part company — and Netflix publishes films and series as two '
      + 'separate top 10s, so they can be compared without either crowding the other.',
    unit: 'A run is one title in one country across consecutive chart weeks. Seasons of a show are counted '
      + 'separately, because Netflix lists them separately and they are separate runs.',
    whyNonKoreanToo: 'Korean films might hold a chart for fewer weeks than Korean series simply because films '
      + 'do that everywhere. Every non-Korean title on the same charts is therefore measured the same way, '
      + 'and what is left after removing the format gap is the part that is about Korean titles.',
    whyOneTitleCheck: 'A mean run length moves easily with a handful of very long runs. Each group is '
      + 'therefore measured again with its single most-charting title removed; if the difference survives, no '
      + 'one show is carrying it.',
    whyTruncatedRemoved: 'A run still on a chart in the last week we hold has no finished length. Counting it '
      + 'would make recent titles look short. Those runs are removed and counted separately.',
    rowsRead: 줄,
    rowsOverwritten: 덮어쓴것,
    byGroup,
    formatGapKorean: 갈래차한국,
    formatGapOthers: 갈래차그밖,
    formatGapDifference: +(갈래차한국 - 갈래차그밖).toFixed(2),
    cannotAnswer: 'A run ending is not viewing ending. A title outside a top 10 is invisible here at any '
      + 'level of viewing, so a shorter run means less time on a rank list and nothing more. Netflix '
      + 'publishes no viewing figures for country charts.',
  };
  fs.writeFileSync(낼파일, `${JSON.stringify(out, null, 2)}\n`, 'utf8');

  console.log(`줄 ${줄.toLocaleString('en-US')} · 덮어쓴 것 ${덮어쓴것}`);
  console.log('무리          구간      잘린 것  가운데  평균   한 주짜리  4주 이상  가장 긴  나갈 때 아래셋  앉은 아래셋');
  for (const g of byGroup) {
    console.log(`${g.group.padEnd(12)} ${String(g.runs).padStart(7)} ${String(g.truncated).padStart(8)} ${String(g.medianWeeks).padStart(6)} ${String(g.meanWeeks).padStart(6)} ${String(g.oneWeekPc).padStart(8)}% ${String(g.fourPlusPc).padStart(8)}% ${String(g.longestRun).padStart(7)} ${String(g.exitBottomThreePc).padStart(13)}% ${String(g.weeksBottomThreePc).padStart(11)}%`);
  }
  console.log(`\n시리즈−영화 평균 길이 차이   한국 **${갈래차한국}주** · 그 밖 **${갈래차그밖}주**`);
  console.log(`  ⭐ 갈래 차이를 뺀 나머지 = ${out.formatGapDifference}주`);
  console.log(`→ ${낼파일}`);
}
