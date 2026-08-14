#!/usr/bin/env node
/**
 * 형제가 옆에 있으면 — **같은 회사의 작품 둘이 한 나라 차트에 같이 서면 서로 잡아먹나.**
 *
 * ⛔ 차트는 열 칸뿐이다. 회사가 배급 일정을 짤 때 「우리 것 둘을 같은 달에 낼까」는
 *    돈이 걸린 결정이다. 이 자는 그 물음에만 답한다.
 *
 * ⛔ 이 자가 지키는 것 ───────────────────────────────────────────
 * ⛔ **순위표를 안 만든다.** 어느 회사가 잘하나를 묻지 않는다.
 * ⛔ 🔴 **작품을 고정한다.** 같은 작품이 **혼자 선 주**와 **형제와 함께 선 주**를 견준다.
 *    작품 힘·회사·나라가 한꺼번에 죽는다.
 * ⛔ 🔴 **나이를 고정한다.** 작품은 주가 갈수록 순위가 내려간다. 형제는 보통 나중에 오므로
 *    나이를 안 맞추면 **내려가는 것을 형제 탓으로** 읽게 된다.
 *    그래서 **같은 누적주끼리만** 견준다(넷플릭스가 주는 「몇 주째」 칸).
 * ⛔ **한 나라 안에서만** 견준다. 나라가 다르면 칸 경쟁이 다르다.
 * ⚠ 왜 그런지는 이 자료에 **없다.** 자리를 뺏은 것인지, 같이 뜬 것인지 이 수는 못 가른다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 지금 } from './_kst.mjs';

const 나라파일 = 'archive/raw/netflix-top10/countries.ndjson';
const 회사파일 = 'archive/raw/netflix-top10/firm-works.json';
const 낼파일 = 'src/data/wikitip-siblings.json';

/** 몫. 밑이 0 이면 **0 이 아니라 null** */
export function 몫(a, b) {
  if (!b) return null;
  return +((100 * a) / b).toFixed(1);
}

/** 평균. 빈 것은 **0 이 아니라 null** */
export function 평균(들) {
  if (!들.length) return null;
  return +(들.reduce((s, x) => s + x, 0) / 들.length).toFixed(2);
}

/** 나이를 띠로 묶는다. ⛔ 우리가 고른 자리다 — 자료에서 나온 것이 아니다 */
export function 나이띠이름(n) {
  if (n <= 2) return 'Weeks 1–2';
  if (n <= 4) return 'Weeks 3–4';
  if (n <= 8) return 'Weeks 5–8';
  return 'Week 9 and later';
}

/**
 * 한 작품의 주들을 「혼자」와 「형제와 함께」로 가른다. **같은 나이 띠 안에서만** 짝짓는다.
 *
 * @param 주들 [{ 나이, 순위, 형제수 }]
 * @returns { 짝: [{띠, 혼자순위, 함께순위}], 안짝: 수 }
 *
 * ⛔ 🔴 처음에 **나이를 딱 맞춰** 짝지었더니 짝이 205개뿐이고 25,176 주를 버렸다.
 *    까닭이 있다 — 한 작품이 한 나라에서 **누적주 N 을 두 번 겪지 않는다.**
 *    그러니 「같은 나이에 혼자인 주와 함께인 주」는 거의 생기지 않고, 남은 205개는
 *    누적주가 되감기는 이상한 경우뿐이었다. **대표성이 없는 표본이었다.**
 * ⭐ 그래서 띠로 묶는다. 한 작품이 1–2주 띠 안에서 두 주를 보내며 한 주는 혼자,
 *    다른 주는 형제와 함께일 수 있다. 그것이 짝이다.
 * ⚠ 값: 띠 안에서 나이가 한 주까지 어긋날 수 있다. 그것을 지면에 적는다.
 * ⛔ 띠 안에 한쪽만 있으면 **버린다.** 그 주들은 견줄 짝이 없다.
 */
export function 나이맞춰짝(주들) {
  const 띠별 = new Map();
  for (const w of 주들) {
    if (w.나이 == null) continue;
    const b = 나이띠이름(w.나이);
    if (!띠별.has(b)) 띠별.set(b, { 혼자: [], 함께: [] });
    (w.형제수 > 0 ? 띠별.get(b).함께 : 띠별.get(b).혼자).push(w.순위);
  }
  const 짝 = [];
  let 안짝 = 0;
  for (const 띠 of ['Weeks 1–2', 'Weeks 3–4', 'Weeks 5–8', 'Week 9 and later']) {
    const v = 띠별.get(띠);
    if (!v) continue;
    if (v.혼자.length && v.함께.length) 짝.push({ 띠, 혼자순위: 평균(v.혼자), 함께순위: 평균(v.함께) });
    else 안짝 += v.혼자.length + v.함께.length;
  }
  return { 짝, 안짝 };
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    if (JSON.stringify(실제) === JSON.stringify(바람)) 통 += 1;
    else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  const ㅈ = (나이, 순위, 형제수) => ({ 나이, 순위, 형제수 });
  재본다('몫 — 밑이 0 이면 null', 몫(1, 0), null);
  재본다('평균 — 빈 것은 null', 평균([]), null);
  재본다('평균', 평균([2, 4]), 3);
  /* 🔴 이 줄이 이 자의 요점이다 — 띠가 다르면 짝이 아니다 */
  재본다('띠가 다르면 안 짝짓는다',
    나이맞춰짝([ㅈ(1, 3, 0), ㅈ(6, 8, 1)]), { 짝: [], 안짝: 2 });
  재본다('같은 띠면 나이가 달라도 짝짓는다',
    나이맞춰짝([ㅈ(1, 3, 0), ㅈ(2, 7, 1)]),
    { 짝: [{ 띠: 'Weeks 1–2', 혼자순위: 3, 함께순위: 7 }], 안짝: 0 });
  재본다('같은 띠 여럿은 평균낸다',
    나이맞춰짝([ㅈ(1, 2, 0), ㅈ(2, 4, 0), ㅈ(2, 8, 1)]),
    { 짝: [{ 띠: 'Weeks 1–2', 혼자순위: 3, 함께순위: 8 }], 안짝: 0 });
  재본다('띠 이름', [나이띠이름(2), 나이띠이름(3), 나이띠이름(9)],
    ['Weeks 1–2', 'Weeks 3–4', 'Week 9 and later']);
  재본다('나이가 없으면 버린다', 나이맞춰짝([ㅈ(null, 3, 0), ㅈ(null, 5, 1)]), { 짝: [], 안짝: 0 });
  console.log(`형제 수집기 — 자가시험 ${통} 통과 · ${실} 실패`);
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

  /* 제목(소문자) → 그 제목을 가진 회사들 */
  const 제목회사 = new Map();
  for (const f of 회사자료.firms) {
    for (const w of f.works) {
      const k = String(w.title || '').toLowerCase();
      if (!k) continue;
      if (!제목회사.has(k)) 제목회사.set(k, new Set());
      제목회사.get(k).add(f.firm);
    }
  }

  /* ── 원자료를 한 번만 훑어 (나라·주) 칸마다 어떤 한국 작품이 있었나를 모은다 ── */
  const 칸 = new Map();       // `${iso2}|${주}` → [{제목, 순위, 나이}]
  let 줄 = 0; let 한국줄 = 0;
  const 주모음 = new Set();
  for (const l of fs.readFileSync(나라파일, 'utf8').split('\n')) {
    if (!l) continue;
    줄 += 1;
    let r;
    try { r = JSON.parse(l); } catch { continue; }
    if (r.구분 !== 'TV') continue;
    const iso2 = String(r.iso2).toUpperCase();
    if (iso2 === 'RU') continue;
    const 제목 = String(r.제목 || '').toLowerCase();
    if (!제목회사.has(제목)) continue;      /* 회사가 붙은 한국 시리즈만 */
    한국줄 += 1;
    주모음.add(r.주);
    const k = `${iso2}|${r.주}`;
    if (!칸.has(k)) 칸.set(k, []);
    칸.get(k).push({ 제목, 순위: r.순위, 나이: r.누적주 });
  }

  /* ── 작품마다 주별로 「형제가 몇이었나」를 붙인다 ── */
  const 작품주 = new Map();    // `${iso2}|${제목}` → [{나이, 순위, 형제수}]
  let 형제있는주 = 0;
  for (const [k, 줄들] of 칸) {
    const iso2 = k.split('|')[0];
    for (const a of 줄들) {
      const 내회사 = 제목회사.get(a.제목);
      /* ⛔ 같은 제목이 두 줄일 리 없지만, 형제를 셀 때 **자기 자신을 안 센다** */
      const 형제 = 줄들.filter((b) => b.제목 !== a.제목
        && [...제목회사.get(b.제목)].some((f) => 내회사.has(f))).length;
      if (형제 > 0) 형제있는주 += 1;
      const kk = `${iso2}|${a.제목}`;
      if (!작품주.has(kk)) 작품주.set(kk, []);
      작품주.get(kk).push({ 나이: a.나이, 순위: a.순위, 형제수: 형제 });
    }
  }

  /* ── 작품 안에서, 나이를 맞춰 견준다 ── */
  let 짝수 = 0; let 안짝 = 0;
  const 혼자들 = []; const 함께들 = [];
  const 칸들 = new Set();
  const 나이띠 = new Map();
  for (const [kk, 주들] of 작품주) {
    const { 짝, 안짝: ㅇ } = 나이맞춰짝(주들);
    안짝 += ㅇ;
    if (!짝.length) continue;
    칸들.add(kk);
    for (const p of 짝) {
      짝수 += 1;
      혼자들.push(p.혼자순위); 함께들.push(p.함께순위);
      const b = p.띠;
      if (!나이띠.has(b)) 나이띠.set(b, { 짝: 0, 혼자: [], 함께: [] });
      const t = 나이띠.get(b);
      t.짝 += 1; t.혼자.push(p.혼자순위); t.함께.push(p.함께순위);
    }
  }

  const 혼자평 = 평균(혼자들);
  const 함께평 = 평균(함께들);

  /* ── 스스로 본다 ── */
  if (!짝수) throw new Error('나이를 맞춘 짝이 하나도 없다 — 누적주 칸이 비었거나 짝짓기가 깨졌다');
  if (혼자평 === null || 함께평 === null) throw new Error('한쪽이 비어 견줄 수 없다');
  if (짝수 < 50) throw new Error(`짝이 ${짝수}개뿐이다 — 견줄 만하지 않다`);
  {
    const 띠짝 = [...나이띠.values()].reduce((s, x) => s + x.짝, 0);
    if (띠짝 !== 짝수) throw new Error(`띠로 가른 짝 합 ${띠짝} 이 전체 ${짝수} 와 다르다`);
  }
  /* ⛔ 순위는 **작을수록 좋다.** 부호를 뒤집어 읽지 않게 자가 붙든다 */
  if (!(혼자평 >= 1 && 혼자평 <= 10 && 함께평 >= 1 && 함께평 <= 10)) {
    throw new Error(`평균 순위가 1~10 밖이다 (혼자 ${혼자평} · 함께 ${함께평}) — 칸을 잘못 읽었다`);
  }

  const byAge = ['Weeks 1–2', 'Weeks 3–4', 'Weeks 5–8', 'Week 9 and later']
    .filter((b) => 나이띠.has(b))
    .map((b) => {
      const t = 나이띠.get(b);
      const a = 평균(t.혼자); const c = 평균(t.함께);
      return { band: b, pairs: t.짝, aloneRank: a, withSiblingRank: c, difference: +(c - a).toFixed(2) };
    });

  const out = {
    generated: 지금(),
    source: 'Netflix Top 10 (Tudum) weekly country lists for Korean series, joined to production company (P272), '
      + 'first broadcaster (P449) and distributor (P750) from Wikidata. Netflix\'s own "weeks in top 10" column '
      + 'is used to hold a title\'s age fixed.',
    question: 'When two series from the same Korean company are on a country\'s chart in the same week, '
      + 'do they sit lower than when either is there alone?',
    unit: 'One pair = one series in one country at one age in weeks, with its average rank on the weeks it was '
      + 'alone set against its average rank on the weeks a series from the same company was also on that chart. '
      + 'Rank 1 is the top of the chart, so a higher number is worse.',
    whyAgeFixed: 'A title\'s rank falls as its run goes on, and a company\'s second title usually arrives later. '
      + 'Comparing without holding age fixed would credit the decline to the sibling instead of to time. '
      + 'Every comparison here is between weeks at the same "weeks in top 10" value.',
    rowsRead: 줄,
    koreanRowsWithCompany: 한국줄,
    weeksSpanned: 주모음.size,
    weeksWithASibling: 형제있는주,
    titleMarketCellsCompared: 칸들.size,
    pairs: 짝수,
    weeksDroppedNoMatchingAge: 안짝,
    aloneRank: 혼자평,
    withSiblingRank: 함께평,
    difference: +(함께평 - 혼자평).toFixed(2),
    byAge,
    cannotAnswer: 'This cannot say whether a sibling took the other title\'s place or whether both rose together. '
      + 'Netflix publishes a rank, not the viewing that produced it, and never publishes what was not watched.',
  };
  fs.writeFileSync(낼파일, `${JSON.stringify(out, null, 2)}\n`, 'utf8');

  console.log(`시리즈 줄 ${줄.toLocaleString('en-US')} · 회사 붙은 한국 줄 ${한국줄.toLocaleString('en-US')} · 주 ${주모음.size}`);
  console.log(`형제가 있던 줄 ${형제있는주.toLocaleString('en-US')}`);
  console.log(`나이를 맞춰 견준 짝 ${짝수.toLocaleString('en-US')} (작품×나라 ${칸들.size}) · 나이 짝이 없어 버린 주 ${안짝.toLocaleString('en-US')}`);
  console.log(`  혼자일 때 평균 순위  ${혼자평}`);
  console.log(`  형제와 함께일 때     ${함께평}`);
  console.log(`  차이 ${out.difference} (양수면 형제가 있을 때 **더 아래**)`);
  console.log('나이 띠 —');
  for (const b of byAge) {
    console.log(`   ${b.band.padEnd(18)} 짝 ${String(b.pairs).padStart(5)} · 혼자 ${b.aloneRank} · 함께 ${b.withSiblingRank} · 차이 ${b.difference}`);
  }
  console.log(`→ ${낼파일}`);
}
