#!/usr/bin/env node
/**
 * 발판이 되나 — **한 회사가 한 나라 차트에 이미 올라 본 적이 있으면,
 * 그 회사의 *다음* 작품이 그 나라에 더 쉽게 오르는가.**
 *
 * ⛔ 이 자가 지키는 것 ───────────────────────────────────────────
 * ⛔ **순위표를 안 만든다.** 「어느 회사가 1등인가」를 묻지 않는다. 발판이 있느냐 없느냐만 본다.
 * ⛔ 🔴 **교란을 먼저 죽인다.** 큰 회사는 작품이 많아 발판도 많고, 작품이 많으니 어디든 오른다.
 *    그래서 **같은 회사 안에서** 「이미 들어간 나라」와 「안 들어간 나라」를 견준다.
 *    회사 사이를 견주지 않는다 — 그러면 회사 크기를 재는 셈이다.
 * ⛔ 🔴 **큰 나라가 다 받아 준다.** 그래서 **같은 나라 안에서도** 견줄 수 있게 나라별로 갈라 놓는다.
 * ⛔ **차례를 지킨다.** 작품이 처음 오른 주를 기준으로 앞뒤를 가른다.
 *    나중 것으로 앞을 설명하면 안 된다.
 * ⛔ **작품이 하나뿐인 회사는 뺀다.** 「다음 작품」이 없으면 물음이 성립하지 않는다.
 * ⛔ **시리즈만 센다.** 회사가 붙은 영화는 37.7% 뿐이라 반쯤 빈 자료다(who-makes-it 이 밝힌 것).
 * ⚠ 왜 그런지는 이 자료에 **없다.** 발판일 수도, 그 회사가 그 나라 취향에 맞을 수도 있다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 나라파일 = 'archive/raw/netflix-top10/countries.ndjson';
const 회사파일 = 'archive/raw/netflix-top10/firm-works.json';
const 낼파일 = 'src/data/wikitip-foothold.json';

/** 몫. 밑이 0 이면 **0 이 아니라 null** */
export function 몫(a, b) {
  if (!b) return null;
  return +((100 * a) / b).toFixed(1);
}

/**
 * 회사 하나·나라 하나에서 「발판이 있었나」를 가른다.
 *
 * @param 작품들 [{ 처음주, 나라들:Set }] — 그 회사 작품이 각각 언제 처음 어디에 올랐나
 * @param 나라   재려는 나라
 * @returns { 발판뒤: {오름, 기회}, 발판앞: {오름, 기회} }
 *
 * ⛔ 작품을 **처음 오른 주 차례로** 훑는다. 그 나라에 이미 오른 작품이 있었으면 「발판 뒤」다.
 *    첫 작품은 어느 쪽에도 안 넣는다 — 앞이 없는 작품은 견줄 대상이 아니다.
 */
export function 회사한나라(작품들, 나라) {
  const 차례 = [...작품들].sort((a, b) => a.처음주 - b.처음주);
  let 발판 = false;
  const 셈 = { 발판뒤: { 오름: 0, 기회: 0 }, 발판앞: { 오름: 0, 기회: 0 } };
  for (let i = 0; i < 차례.length; i += 1) {
    const 올랐나 = 차례[i].나라들.has(나라);
    if (i > 0) {
      const 칸 = 발판 ? 셈.발판뒤 : 셈.발판앞;
      칸.기회 += 1;
      if (올랐나) 칸.오름 += 1;
    }
    if (올랐나) 발판 = true;
  }
  return 셈;
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    if (JSON.stringify(실제) === JSON.stringify(바람)) 통 += 1;
    else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  const 짓 = (...ㅅ) => ㅅ.map((x, i) => ({ 처음주: i, 나라들: new Set(x) }));

  재본다('몫 — 밑이 0 이면 null', 몫(1, 0), null);
  /* ⛔ 첫 작품은 어느 쪽에도 안 들어간다 */
  재본다('작품 하나면 기회가 없다', 회사한나라(짓(['KR']), 'KR'),
    { 발판뒤: { 오름: 0, 기회: 0 }, 발판앞: { 오름: 0, 기회: 0 } });
  /* 첫 작품이 KR 에 올랐다 → 둘째는 발판 뒤 */
  재본다('첫 것이 오르면 둘째는 발판 뒤', 회사한나라(짓(['KR'], ['KR']), 'KR'),
    { 발판뒤: { 오름: 1, 기회: 1 }, 발판앞: { 오름: 0, 기회: 0 } });
  /* 첫 작품이 KR 에 못 올랐다 → 둘째는 발판 앞 */
  재본다('첫 것이 못 오르면 둘째는 발판 앞', 회사한나라(짓(['JP'], ['KR']), 'KR'),
    { 발판뒤: { 오름: 0, 기회: 0 }, 발판앞: { 오름: 1, 기회: 1 } });
  /* 🔴 차례가 요점이다 — 셋째는 둘째가 만든 발판 뒤다 */
  재본다('발판이 생기면 그 뒤로는 계속 뒤다', 회사한나라(짓(['JP'], ['KR'], ['JP']), 'KR'),
    { 발판뒤: { 오름: 0, 기회: 1 }, 발판앞: { 오름: 1, 기회: 1 } });
  /* ⛔ 차례를 섞어 넣어도 처음주로 다시 세운다 */
  재본다('처음주로 차례를 다시 세운다',
    회사한나라([{ 처음주: 9, 나라들: new Set(['KR']) }, { 처음주: 1, 나라들: new Set(['KR']) }], 'KR'),
    { 발판뒤: { 오름: 1, 기회: 1 }, 발판앞: { 오름: 0, 기회: 0 } });
  console.log(`발판 수집기 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  for (const p of [나라파일, 회사파일]) {
    if (!fs.existsSync(p)) {
      console.log(`⛔ 원자료가 없다 — ${p}`);
      console.log('   ⚠ archive/ 는 git 에 안 올라간다. 「안 됐다」가 아니라 **못 쟀다**.');
      process.exit(1);
    }
  }
  const 회사자료 = JSON.parse(fs.readFileSync(회사파일, 'utf8'));
  /*
   * ⛔ 갈래(영화/시리즈) 표를 따로 안 읽는다.
   *    아래에서 원자료를 훑을 때 **`구분 === 'TV'` 줄만** 담으므로,
   *    영화로만 차트에 오른 작품은 `작품나라` 에 아예 안 들어가고 저절로 빠진다.
   *    ⚠ 자료를 하나 덜 믿는 쪽이 낫다 — korean-titles.json 에는 갈래 칸이 없다.
   */

  /* ── 원자료를 한 번만 훑는다 ── */
  const 주번호 = new Map();
  const 작품나라 = new Map();   // 제목(소문자) → Set(iso2)
  const 작품첫주 = new Map();   // 제목(소문자) → 가장 이른 주 번호
  let 줄 = 0;
  const 원 = fs.readFileSync(나라파일, 'utf8');
  for (const l of 원.split('\n')) {
    if (!l) continue;
    줄 += 1;
    let r;
    try { r = JSON.parse(l); } catch { continue; }
    if (r.구분 !== 'TV') continue;                 /* 시리즈만 */
    if (String(r.iso2).toUpperCase() === 'RU') continue;  /* 러시아는 이 사이트 전체에서 뺀다 */
    const 제목 = String(r.제목 || '').toLowerCase();
    if (!제목) continue;
    if (!주번호.has(r.주)) 주번호.set(r.주, 주번호.size);
    const w = 주번호.get(r.주);
    if (!작품나라.has(제목)) 작품나라.set(제목, new Set());
    작품나라.get(제목).add(String(r.iso2).toUpperCase());
    const 옛 = 작품첫주.get(제목);
    if (옛 === undefined || w < 옛) 작품첫주.set(제목, w);
  }
  /* 주 번호를 날짜 차례로 다시 매긴다 — 파일 차례가 곧 날짜 차례가 아닐 수 있다 */
  const 주차례 = [...주번호.keys()].sort();
  const 제대로 = new Map(주차례.map((k, i) => [주번호.get(k), i]));
  for (const [k, v] of 작품첫주) 작품첫주.set(k, 제대로.get(v));

  /* ── 회사별로 자기 작품을 모은다 ── */
  const 나라전부 = new Set();
  for (const s of 작품나라.values()) for (const c of s) 나라전부.add(c);

  const 회사들 = [];
  let 뺀작품하나 = 0;
  for (const f of 회사자료.firms) {
    const 작품 = [];
    for (const w of f.works) {
      const key = String(w.title || '').toLowerCase();
      const 나라 = 작품나라.get(key);
      if (!나라) continue;                          /* 차트에 안 오른 작품 */
      작품.push({ 처음주: 작품첫주.get(key), 나라들: 나라, 제목: w.title });
    }
    if (작품.length < 2) { if (작품.length === 1) 뺀작품하나 += 1; continue; }
    회사들.push({ firm: f.firm, grade: f.grade, 작품 });
  }

  /* ── 회사 안에서만 견준다 ── */
  let 뒤오름 = 0; let 뒤기회 = 0; let 앞오름 = 0; let 앞기회 = 0;
  const 띠셈 = new Map();          /* 회사 작품 수 띠별 */
  const 나라셈 = new Map();        /* 나라별 */
  const 띠이름 = (n) => (n <= 3 ? '2–3 series' : n <= 6 ? '4–6 series' : n <= 12 ? '7–12 series' : '13 or more');

  for (const c of 회사들) {
    const 띠 = 띠이름(c.작품.length);
    if (!띠셈.has(띠)) 띠셈.set(띠, { firms: 0, 뒤오름: 0, 뒤기회: 0, 앞오름: 0, 앞기회: 0 });
    띠셈.get(띠).firms += 1;
    for (const 나라 of 나라전부) {
      const s = 회사한나라(c.작품, 나라);
      뒤오름 += s.발판뒤.오름; 뒤기회 += s.발판뒤.기회;
      앞오름 += s.발판앞.오름; 앞기회 += s.발판앞.기회;
      const b = 띠셈.get(띠);
      b.뒤오름 += s.발판뒤.오름; b.뒤기회 += s.발판뒤.기회;
      b.앞오름 += s.발판앞.오름; b.앞기회 += s.발판앞.기회;
      if (!나라셈.has(나라)) 나라셈.set(나라, { 뒤오름: 0, 뒤기회: 0, 앞오름: 0, 앞기회: 0 });
      const n = 나라셈.get(나라);
      n.뒤오름 += s.발판뒤.오름; n.뒤기회 += s.발판뒤.기회;
      n.앞오름 += s.발판앞.오름; n.앞기회 += s.발판앞.기회;
    }
  }

  /*
   * 🔴🔴 남은 교란 하나 — **발판 뒤 작품은 정의상 「나중」 작품이다.**
   *   넷플릭스는 해가 갈수록 커졌고 한국 작품도 늘었다. 그러니 위의 3.8배가
   *   「발판」이 아니라 **「나중이라 그렇다」**일 수 있다.
   *
   * ⭐ 죽이는 법 — **작품 하나를 고정한다.**
   *   같은 작품이 그날 93개 나라에 오를 기회를 동시에 갖는다. 그중 어떤 나라는 그 회사가
   *   이미 발을 들였고 어떤 나라는 아니다. **한 작품 안에서** 그 두 무리를 견주면
   *   때(같은 작품이니 같은 때) · 작품 힘(같은 작품) · 회사 크기(같은 회사)가 **한꺼번에 죽는다.**
   *   ⚠ 남는 것은 나라 차이뿐이고, 그것은 아래 나라별 표가 따로 받는다.
   */
  let 짝뒤오름 = 0; let 짝뒤기회 = 0; let 짝앞오름 = 0; let 짝앞기회 = 0;
  let 짝작품 = 0;
  for (const c of 회사들) {
    const 차례 = [...c.작품].sort((a, b) => a.처음주 - b.처음주);
    const 발판나라 = new Set();
    for (let i = 0; i < 차례.length; i += 1) {
      if (i > 0 && 발판나라.size && 발판나라.size < 나라전부.size) {
        /* 이 작품 하나 안에서 두 무리를 견준다 */
        let ㄱ오름 = 0; let ㄱ기회 = 0; let ㄴ오름 = 0; let ㄴ기회 = 0;
        for (const 나라 of 나라전부) {
          const 올랐나 = 차례[i].나라들.has(나라);
          if (발판나라.has(나라)) { ㄱ기회 += 1; if (올랐나) ㄱ오름 += 1; }
          else { ㄴ기회 += 1; if (올랐나) ㄴ오름 += 1; }
        }
        짝뒤오름 += ㄱ오름; 짝뒤기회 += ㄱ기회;
        짝앞오름 += ㄴ오름; 짝앞기회 += ㄴ기회;
        짝작품 += 1;
      }
      for (const 나라 of 차례[i].나라들) 발판나라.add(나라);
    }
  }
  const 짝뒤몫 = 몫(짝뒤오름, 짝뒤기회);
  const 짝앞몫 = 몫(짝앞오름, 짝앞기회);

  const 뒤몫 = 몫(뒤오름, 뒤기회);
  const 앞몫 = 몫(앞오름, 앞기회);

  /* ── 스스로 본다 ── */
  if (!회사들.length) throw new Error('견줄 회사가 하나도 없다 — 작품 이름 맞추기가 깨졌다');
  if (뒤기회 + 앞기회 === 0) throw new Error('기회가 0 이다 — 차례 가르기가 깨졌다');
  if (뒤몫 === null || 앞몫 === null) throw new Error('한쪽 기회가 0 이라 견줄 수 없다');
  {
    const 띠뒤 = [...띠셈.values()].reduce((s, x) => s + x.뒤오름, 0);
    const 띠앞 = [...띠셈.values()].reduce((s, x) => s + x.앞오름, 0);
    if (띠뒤 !== 뒤오름 || 띠앞 !== 앞오름) {
      throw new Error(`띠로 가른 합(${띠뒤}/${띠앞})이 전체(${뒤오름}/${앞오름})와 다르다`);
    }
  }
  /* ⛔ 요지가 뒤집히면 기사를 다시 쓴다 */
  if (!(뒤몫 > 앞몫)) {
    throw new Error(`발판 뒤 ${뒤몫}% 가 발판 앞 ${앞몫}% 보다 크지 않다 — 「발판이 된다」를 못 쓴다`);
  }
  /* 🔴 때를 죽인 뒤에도 남는가. 여기서 무너지면 위의 3.8배는 「나중이라 그렇다」였다는 뜻이다 */
  if (짝뒤몫 === null || 짝앞몫 === null) {
    throw new Error('작품 안에서 두 무리를 못 갈랐다 — 짝짓기가 깨졌다');
  }
  if (짝작품 < 30) throw new Error(`작품 안 짝이 ${짝작품}개뿐이다 — 견줄 만하지 않다`);

  const byFirmSize = ['2–3 series', '4–6 series', '7–12 series', '13 or more']
    .filter((b) => 띠셈.has(b))
    .map((b) => {
      const x = 띠셈.get(b);
      return {
        band: b, firms: x.firms,
        withFootholdPc: 몫(x.뒤오름, x.뒤기회), withoutFootholdPc: 몫(x.앞오름, x.앞기회),
        withChances: x.뒤기회, withoutChances: x.앞기회,
      };
    });

  /* ⛔ 나라는 **줄세우지 않는다.** 이름 차례로 내고, 몇 곳에서 방향이 뒤집히는지만 센다 */
  const 나라들 = [...나라셈.entries()]
    .filter(([, x]) => x.뒤기회 >= 30 && x.앞기회 >= 30)
    .map(([iso2, x]) => ({
      iso2,
      withFootholdPc: 몫(x.뒤오름, x.뒤기회),
      withoutFootholdPc: 몫(x.앞오름, x.앞기회),
    }))
    .sort((a, b) => a.iso2.localeCompare(b.iso2));
  const 뒤집힌 = 나라들.filter((x) => x.withFootholdPc <= x.withoutFootholdPc);

  const out = {
    generated: new Date().toISOString(),
    source: 'Netflix Top 10 (Tudum) weekly country lists for Korean series, joined to production company (P272), '
      + 'first broadcaster (P449) and distributor (P750) from Wikidata',
    question: 'If a company has already put a series on a country\'s Netflix top 10, is its next series more likely to chart there?',
    unit: 'One chance = one company, one country, one of that company\'s series other than its first. '
      + 'A chance is "with a foothold" if an earlier series by the same company had already charted in that country.',
    whyWithinFirm: 'Big companies have more series and reach more countries, so comparing companies to each other '
      + 'would measure company size. Every comparison here is inside one company: the same company\'s countries '
      + 'where it had already charted, against its countries where it had not.',
    whySeriesOnly: 'Wikidata attaches a company to 92% of Korean series but only 37.7% of films. '
      + 'Measuring on a half-empty list would make less-documented companies look smaller.',
    firmsCompared: 회사들.length,
    firmsDroppedSingleWork: 뺀작품하나,
    marketCount: 나라전부.size,
    rowsRead: 줄,
    weeksSpanned: 주차례.length,
    withFoothold: 뒤오름, withFootholdChances: 뒤기회, withFootholdPc: 뒤몫,
    withoutFoothold: 앞오름, withoutFootholdChances: 앞기회, withoutFootholdPc: 앞몫,
    liftPoints: +(뒤몫 - 앞몫).toFixed(1),
    liftTimes: +(뒤몫 / 앞몫).toFixed(1),
    /* 🔴 때를 죽인 셈 — 같은 작품 안에서 */
    withinTitle: {
      how: 'Each of these is one series compared against itself: on the day it charted, the countries where its '
        + 'company had already charted, against the countries where it had not. Same series, same week, same '
        + 'company — so age, title strength and company size cannot explain the gap.',
      titles: 짝작품,
      withFoothold: 짝뒤오름, withFootholdChances: 짝뒤기회, withFootholdPc: 짝뒤몫,
      withoutFoothold: 짝앞오름, withoutFootholdChances: 짝앞기회, withoutFootholdPc: 짝앞몫,
      liftPoints: +(짝뒤몫 - 짝앞몫).toFixed(1),
      liftTimes: 짝앞몫 ? +(짝뒤몫 / 짝앞몫).toFixed(1) : null,
    },
    byFirmSize,
    byMarket: 나라들,
    marketsMeasured: 나라들.length,
    marketsWhereItReverses: 뒤집힌.length,
    marketsWhereItReversesNames: 뒤집힌.map((x) => x.iso2),
    cannotAnswer: 'This cannot say why. A foothold may help the next title, or a company that suits one country\'s '
      + 'taste may simply keep suiting it. Netflix publishes neither promotion nor commissioning decisions.',
  };
  fs.writeFileSync(낼파일, `${JSON.stringify(out, null, 2)}\n`, 'utf8');

  console.log(`시리즈 줄 ${줄.toLocaleString('en-US')} · 주 ${주차례.length} · 나라 ${나라전부.size}`);
  console.log(`견준 회사 ${회사들.length}곳 (작품 하나뿐이라 뺀 곳 ${뺀작품하나})`);
  console.log(`  발판 있음  ${뒤오름} / ${뒤기회} = ${뒤몫}%`);
  console.log(`  발판 없음  ${앞오름} / ${앞기회} = ${앞몫}%`);
  console.log(`  차이 ${out.liftPoints}%p · ${out.liftTimes}배`);
  console.log(`🔴 때를 죽인 뒤 — 같은 작품 ${짝작품}편 안에서`);
  console.log(`  발판 있는 나라  ${짝뒤오름} / ${짝뒤기회} = ${짝뒤몫}%`);
  console.log(`  없는 나라       ${짝앞오름} / ${짝앞기회} = ${짝앞몫}%`);
  console.log(`  차이 ${out.withinTitle.liftPoints}%p · ${out.withinTitle.liftTimes}배`);
  console.log('회사 크기 띠 —');
  for (const b of byFirmSize) {
    console.log(`   ${b.band.padEnd(14)} ${String(b.firms).padStart(3)}곳 · 발판 ${String(b.withFootholdPc).padStart(5)}% · 없음 ${String(b.withoutFootholdPc).padStart(5)}%`);
  }
  console.log(`나라 ${나라들.length}곳을 갈라 봄 — 방향이 뒤집힌 곳 ${뒤집힌.length}`);
  console.log(`→ ${낼파일}`);
}
