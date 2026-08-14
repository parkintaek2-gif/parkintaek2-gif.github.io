#!/usr/bin/env node
/**
 * **들어온 자리가 얼마나 갈지를 말해 주나** — 사는 쪽이 첫 주에 묻는 것.
 *
 * ── 왜 이 물음인가 ─────────────────────────────────────────────
 *   오늘 /exit 에서 **나갈 때** 자리를, /run-length 에서 **얼마나 버티나**를 쟀다.
 *   ⚠ 그런데 **들어온 자리 → 버틴 주**를 이은 적이 없다.
 *   ⭐ 그것이 첫 주 월요일에 실제로 쓸 수 있는 유일한 수다 —
 *      「7위로 들어왔다. 그러면 몇 주를 기대하나」.
 *
 * ── ⛔ 이 자가 지키는 것 ────────────────────────────────────
 * ⛔ 🔴 **자료가 끝나서 잘린 구간을 빼지 않으면 최근 것이 다 짧아 보인다.** 빼고 세고 몇 개인지 적는다.
 * ⛔ **영화와 시리즈를 안 섞는다.** 오늘 재 보니 한국 영화는 남과 같고 시리즈만 길었다.
 *    섞으면 그 둘이 서로를 가린다.
 * ⛔ **한국 아닌 것도 같이 잰다.** 「높이 들어오면 오래 간다」는 어디서나 참일 수 있다.
 *    한국 몫은 그 차이를 뺀 나머지다.
 * ⛔ 열쇠에 **구분과 시즌**을 넣는다. 오늘 이것이 빠져 25,987줄을 잃었다.
 * ⛔ 자리를 줄세우기로 읽히게 쓰지 않는다 — 1위가 「좋은 것」이 아니라 **들어온 칸**이다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { koreanTitleFilter } from './lib/korean-netflix-titles.mjs';
import { 지금 } from './_kst.mjs';

const 나라파일 = 'archive/raw/netflix-top10/countries.ndjson';
const 낼파일 = 'src/data/wikitip-opening.json';

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

/** 이어 붙은 주를 구간으로 가른다 */
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

/**
 * **자리 하나가 몇 주를 더 사 주나** — 가장 단순한 기울기.
 * ⛔ 회귀를 안 쓴다. 자리는 1~10 뿐이라 **양 끝의 가운데값 차이를 칸 수로 나누면** 그게 기울기다.
 *    회귀를 쓰면 「무엇을 가정했나」가 화면에서 안 보인다.
 * @returns 1위 쪽으로 한 칸 올라갈 때 늘어나는 주. 못 재면 null
 */
export function 칸당주(자리별가운데) {
  const 있는것 = 자리별가운데.map((v, i) => ({ 자리: i + 1, v })).filter((x) => x.v != null);
  if (있는것.length < 2) return null;
  const 위 = 있는것[0]; const 아래 = 있는것[있는것.length - 1];
  const 칸 = 아래.자리 - 위.자리;
  if (!칸) return null;
  return +((위.v - 아래.v) / 칸).toFixed(2);
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
  재본다('가운데 — 빈 것은 null', 가운데([]), null);
  const 차례 = new Map([['w1', 0], ['w2', 1], ['w3', 2]]);
  재본다('구간 길이', 구간들(['w1', 'w2'], 차례)[0].주수, 2);
  재본다('끊기면 둘', 구간들(['w1', 'w3'], 차례).length, 2);
  /* 1위 10주 → 10위 1주면 아홉 칸에 9주, 칸당 1주 */
  재본다('칸당 주 — 곧은 것', 칸당주([10, null, null, null, null, null, null, null, null, 1]), 1);
  /* ⛔ 빈 칸을 0 으로 세면 기울기가 뒤집힌다 */
  재본다('칸당 주 — 빈 칸을 0 으로 안 센다', 칸당주([null, 4, null, 2]), 1);
  재본다('칸당 주 — 잰 자리가 하나면 null', 칸당주([5, null, null]), null);
  재본다('칸당 주 — 아무것도 없으면 null', 칸당주([null, null]), null);
  console.log(`들어온 자리 수집기 — 자가시험 ${통} 통과 · ${실} 실패`);
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
    const k = `${iso2}|${r.구분}|${r.제목}|${r.시즌 ?? ''}`;
    if (!담.has(k)) 담.set(k, { iso2, 구분: r.구분, 한국: ko.keepTitle(r.제목), 순위: new Map() });
    const m = 담.get(k);
    if (m.순위.has(r.주)) 덮어쓴것 += 1;
    m.순위.set(r.주, r.순위);
  }

  const 나라차례 = new Map();
  for (const [iso2, ws] of 나라주) {
    const 정 = [...ws].sort();
    나라차례.set(iso2, { 차례: new Map(정.map((w, i) => [w, i])), 주수: 정.length });
  }

  const 만든다 = () => ({ 자리별: Array.from({ length: 10 }, () => []), 잘린것: 0 });
  const 통 = {
    '한국 시리즈': 만든다(), '그 밖 시리즈': 만든다(),
    '한국 영화': 만든다(), '그 밖 영화': 만든다(),
  };
  const 무리이름 = (한국, 구분) => `${한국 ? '한국' : '그 밖'} ${구분 === 'Films' ? '영화' : '시리즈'}`;

  for (const m of 담.values()) {
    const n = 나라차례.get(m.iso2);
    if (!n) continue;
    const 칸 = 통[무리이름(m.한국, m.구분)];
    if (!칸) continue;
    for (const g of 구간들([...m.순위.keys()].sort(), n.차례)) {
      /* ⛔ 잘린 구간은 길이를 모른다 */
      if (g.끝차례 >= n.주수 - 1) { 칸.잘린것 += 1; continue; }
      const 들어온자리 = m.순위.get(g.첫);
      if (!(들어온자리 >= 1 && 들어온자리 <= 10)) continue;
      칸.자리별[들어온자리 - 1].push(g.주수);
    }
  }

  const byGroup = Object.entries(통).map(([이름, c]) => {
    const 자리별 = c.자리별.map((들, i) => ({
      entry: i + 1,
      runs: 들.length,
      medianWeeks: 가운데(들),
      meanWeeks: 들.length ? +(들.reduce((a, b) => a + b, 0) / 들.length).toFixed(2) : null,
      fourPlusPc: 몫(들.filter((x) => x >= 4).length, 들.length),
      oneWeekPc: 몫(들.filter((x) => x === 1).length, 들.length),
    }));
    return {
      group: 이름,
      runs: c.자리별.reduce((s, 들) => s + 들.length, 0),
      truncated: c.잘린것,
      byEntry: 자리별,
      weeksPerStep: 칸당주(자리별.map((x) => x.medianWeeks)),
      topEntryMedian: 자리별[0].medianWeeks,
      bottomEntryMedian: 자리별[9].medianWeeks,
    };
  });

  /* ── 스스로 본다 ── */
  for (const g of byGroup) {
    if (!g.runs) throw new Error(`${g.group} — 구간이 하나도 없다`);
    const 합 = g.byEntry.reduce((s, x) => s + x.runs, 0);
    if (합 !== g.runs) throw new Error(`${g.group} — 자리별 합 ${합} 이 전체 ${g.runs} 와 다르다`);
    for (const e of g.byEntry) {
      if (e.medianWeeks != null && e.medianWeeks < 1) throw new Error(`${g.group} ${e.entry}위 — 가운데가 ${e.medianWeeks}`);
      if (e.fourPlusPc != null && (e.fourPlusPc < 0 || e.fourPlusPc > 100)) {
        throw new Error(`${g.group} ${e.entry}위 — 4주 이상 몫이 ${e.fourPlusPc}`);
      }
    }
  }
  if (덮어쓴것 > 50) throw new Error(`같은 칸을 ${덮어쓴것}번 덮어썼다 — 열쇠가 모자란다`);

  const 찾 = (g) => byGroup.find((x) => x.group === g);
  const 한시 = 찾('한국 시리즈'); const 밖시 = 찾('그 밖 시리즈');
  const 한영 = 찾('한국 영화'); const 밖영 = 찾('그 밖 영화');

  const out = {
    generated: 지금(),
    source: 'Netflix Top 10 (Tudum) weekly country lists, 2021-07-04 to 2026-07-26, Russia excluded.',
    question: 'A title appears on a country chart at some position. That is the one fact anyone has on '
      + 'the first Monday. Does it say anything about how long the title will be there?',
    unit: 'A run is one title in one country across consecutive chart weeks. The entry position is where it '
      + 'sat in the first week of that run; the length is how many weeks the run lasted.',
    whySlopeNotRegression: 'Positions run from 1 to 10 and nothing else, so the difference between the two '
      + 'ends divided by the nine steps between them is the whole relationship. A regression would hide '
      + 'the assumptions inside a coefficient; this way the table is the argument.',
    whyBothFormats: 'Korean films and Korean series behave differently on these charts, so they are never '
      + 'mixed. Every non-Korean title is measured the same way, because "entering higher lasts longer" '
      + 'could be true of every chart everywhere.',
    whyTruncatedRemoved: 'A run still on a chart in the last week we hold has no finished length and is '
      + 'removed rather than counted as short.',
    rowsRead: 줄,
    rowsOverwritten: 덮어쓴것,
    byGroup,
    koreanSeriesSlope: 한시.weeksPerStep,
    otherSeriesSlope: 밖시.weeksPerStep,
    koreanFilmSlope: 한영.weeksPerStep,
    otherFilmSlope: 밖영.weeksPerStep,
    cannotAnswer: 'This is what happened on average to runs that opened at each position; it is not a '
      + 'forecast for any one title, and the spread inside every position is wide. It also says nothing '
      + 'about viewing — a top 10 is a rank list, and Netflix publishes no country-level viewing figures.',
  };
  fs.writeFileSync(낼파일, `${JSON.stringify(out, null, 2)}\n`, 'utf8');

  console.log(`줄 ${줄.toLocaleString('en-US')} · 덮어쓴 것 ${덮어쓴것}`);
  for (const g of byGroup) {
    console.log(`\n${g.group} — 구간 ${g.runs.toLocaleString('en-US')} (잘린 것 ${g.truncated})  ⭐ 칸당 ${g.weeksPerStep}주`);
    console.log('  들어온 자리   구간    가운데 주   평균   4주 이상   한 주짜리');
    for (const e of g.byEntry) {
      console.log(`  ${String(e.entry).padStart(9)} ${String(e.runs).padStart(7)} ${String(e.medianWeeks).padStart(10)} ${String(e.meanWeeks).padStart(7)} ${String(e.fourPlusPc).padStart(8)}% ${String(e.oneWeekPc).padStart(9)}%`);
    }
  }
  console.log(`\n칸당 주  한국 시리즈 **${한시.weeksPerStep}** · 그 밖 시리즈 ${밖시.weeksPerStep} · 한국 영화 ${한영.weeksPerStep} · 그 밖 영화 ${밖영.weeksPerStep}`);
  console.log(`→ ${낼파일}`);
}
