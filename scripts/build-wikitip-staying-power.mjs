/**
 * K Culture Wire — 오래 가는 것과 세게 오는 것은 다르다. (/staying-power)
 *
 * 결과 → src/data/wikitip-staying-power.json
 * 입력 → archive/raw/netflix-top10/global.ndjson (새 수집·키 없음)
 * 판정 → scripts/lib/korean-netflix-titles.mjs 한 곳에서만 온다.
 *
 * ── 🔴 2026-08-07: 이 지면은 원래 **스크립트가 없었다** ────────────────
 * 자료 파일을 손으로 만들어 두고 지면만 올렸다. 그래서 판정 규칙이 바뀌었을 때
 * **다시 만들 방법이 없어 틀린 채로 라이브에 남았다.** 실제로 남았다 —
 * 라이브 `/staying-power` 는 중국 드라마 `Teach You a Lesson` 을
 * 「가장 세게 온 한국 작품 2위」로 싣고 있었다. 미국 `The Perfect Employee`·`Run Away`,
 * 독일 `The Empress` 도 표 안에 있었다.
 * **되짚을 수 없는 자료는 되짚어지지 않는다.** 그래서 스크립트로 되돌린다.
 */
import fs from 'node:fs';
import readline from 'node:readline';
import { koreanTitleFilter, AUDITED } from './lib/korean-netflix-titles.mjs';

const ko = koreanTitleFilter();
const agg = new Map();
const weeksAll = new Set();

const rl = readline.createInterface({
  input: fs.createReadStream('archive/raw/netflix-top10/global.ndjson'),
  crlfDelay: Infinity,
});
for await (const line of rl) {
  if (!line.trim()) continue;
  let r; try { r = JSON.parse(line); } catch { continue; }
  if (!ko.keepRow(r.제목, r.구분)) continue;
  weeksAll.add(r.주);
  let a = agg.get(r.제목);
  if (!a) { a = { title: r.제목, type: r.구분, hours: 0, peak: 99, weeks: new Set() }; agg.set(r.제목, a); }
  a.hours += r.시청시간 || 0;
  a.weeks.add(r.주);
  if (typeof r.순위 === 'number' && r.순위 < a.peak) a.peak = r.순위;
  if (r.구분) a.type = r.구분;
}

const all = [...agg.values()].map((a) => ({
  title: a.title,
  kind: /^TV/i.test(a.type) ? 'series' : 'film',
  hours: a.hours,
  peak: a.peak,
  weeks: a.weeks.size,
  /** 주당 시청시간 — 「오래」와 「세게」를 가르는 자다. 총시간만 보면 둘이 섞인다. */
  perWeek: Math.round(a.hours / a.weeks.size),
})).sort((x, y) => y.hours - x.hours);

const shown = all.slice(0, 50);
const grp = (f, label) => {
  const g = shown.filter(f);
  return {
    label,
    n: g.length,
    avgHours: Math.round(g.reduce((s, r) => s + r.hours, 0) / g.length),
    avgWeeks: +(g.reduce((s, r) => s + r.weeks, 0) / g.length).toFixed(1),
    avgPerWeek: Math.round(g.reduce((s, r) => s + r.perWeek, 0) / g.length),
  };
};

/**
 * ── 🔴 2026-08-08 10:1x. **봉우리 무리를 상위 50편 안에서 셌다.** ────────
 * 시간 상위 50편만 놓고 「#1 을 찍으면 시간이 두 배, 주수는 그대로」라고 지면에 적었다.
 * 그 50편은 **시간으로 고른 것**이다. 결과로 표본을 고르고 그 결과를 설명한 꼴이다.
 * 235편 전부로 재면 문장이 뒤집힌다 — #1 을 찍은 것은 중앙 5주, 못 찍은 것은 중앙 2주다.
 * 「주수는 그대로」는 상위 50편 안에서 다들 9주쯤 되기 때문에 그렇게 보였을 뿐이다.
 *
 * ⛔ 그래서 무리는 **전체로** 센다. 그리고 평균만 내지 않는다 —
 *    한 편(오징어 게임)이 5.05bn 을 가져가는 분포라 평균은 그 한 편을 말한다. **중앙값을 같이 낸다.**
 */
const 중앙 = (xs) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : 0; };
const 무리 = (rows, label) => ({
  label,
  n: rows.length,
  avgHours: rows.length ? Math.round(rows.reduce((s, r) => s + r.hours, 0) / rows.length) : 0,
  medianHours: 중앙(rows.map((r) => r.hours)),
  avgWeeks: rows.length ? +(rows.reduce((s, r) => s + r.weeks, 0) / rows.length).toFixed(1) : 0,
  medianWeeks: 중앙(rows.map((r) => r.weeks)),
  avgPerWeek: rows.length ? Math.round(rows.reduce((s, r) => s + r.perWeek, 0) / rows.length) : 0,
});

/** 로그 시간과의 상관. **로그를 쓰는 까닭** — 시간이 세 자릿수를 넘나들어 원값이면 큰 것 몇 편이 다 정한다 */
export function 상관(xs, ys) {
  const n = xs.length;
  if (n < 3) return 0;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0; let sxx = 0; let syy = 0;
  for (let i = 0; i < n; i++) { const dx = xs[i] - mx; const dy = ys[i] - my; sxy += dx * dy; sxx += dx * dx; syy += dy * dy; }
  return +(sxy / Math.sqrt(sxx * syy)).toFixed(3);
}

const 로그시간 = all.map((r) => Math.log(r.hours || 1));
/** 오래 간 것끼리 묶어 놓고 봉우리를 견준다. **교란을 통제하지 않으면 길이를 봉우리라고 부르게 된다** */
const 띠 = [['1–2 weeks', 1, 2], ['3–5 weeks', 3, 5], ['6–10 weeks', 6, 10], ['11 weeks or more', 11, 999]]
  .map(([label, lo, hi]) => {
    const g = all.filter((r) => r.weeks >= lo && r.weeks <= hi);
    const a = g.filter((r) => r.peak === 1);
    const b = g.filter((r) => r.peak > 1);
    return {
      label,
      n: g.length,
      topN: a.length,
      topMedianHours: 중앙(a.map((r) => r.hours)),
      restN: b.length,
      restMedianHours: 중앙(b.map((r) => r.hours)),
      /** 띠 안에서 남는 배수. 이게 진짜 봉우리 몫이다 */
      ratio: b.length && a.length ? +(중앙(a.map((r) => r.hours)) / 중앙(b.map((r) => r.hours))).toFixed(2) : null,
    };
  });

/** 봉우리 등수별 중앙값. **줄세우기가 아니다** — 순서대로 안 간다는 것을 보이려고 낸다 */
const 등수별 = [];
for (let p = 1; p <= 10; p++) {
  const g = all.filter((r) => r.peak === p);
  if (!g.length) continue;
  등수별.push({ peak: p, n: g.length, medianHours: 중앙(g.map((r) => r.hours)), medianWeeks: 중앙(g.map((r) => r.weeks)) });
}

const 주분포 = [...all.reduce((m, r) => m.set(r.weeks, (m.get(r.weeks) || 0) + 1), new Map())]
  .sort((a, b) => a[0] - b[0]).map(([weeks, n]) => ({ weeks, n }));

const weeks = [...weeksAll].sort();
const st = ko.stats();
const out = {
  generated: new Date().toISOString(),
  source: 'Netflix Top 10 (Tudum) global weekly hours viewed; Korean titles identified via Wikidata country of origin (P495 = Q884), restricted to the Non-English charts',
  weekFrom: weeks[0],
  weekTo: weeks[weeks.length - 1],
  weekCount: weeks.length,
  titleCount: all.length,
  shown: shown.length,
  totalHours: all.reduce((s, r) => s + r.hours, 0),
  /** ⛔ 전체 235편으로 센다. 상위 50편으로 세던 것이 8/8 정정 대상이었다 */
  peakGroups: [무리(all.filter((r) => r.peak === 1), 'Peaked at #1'), 무리(all.filter((r) => r.peak > 1), 'Peaked below #1')],
  /** 예전 값 — **지면에 쓰지 않는다.** 무엇이 어떻게 틀렸는지 되짚을 수 있게 남긴다 */
  peakGroupsTop50Only: [grp((r) => r.peak === 1, 'Peaked at #1'), grp((r) => r.peak > 1, 'Peaked below #1')],
  peakByRank: 등수별,
  weeksBands: 띠,
  weeksDistribution: 주분포,
  oneWeekOnly: all.filter((r) => r.weeks === 1).length,
  correlations: {
    note: 'Pearson r against log hours. Log because one title holds 5.05bn of 23.7bn and the raw scale would let it decide everything.',
    weeksVsLogHours: 상관(all.map((r) => r.weeks), 로그시간),
    peakVsLogHours: 상관(all.map((r) => r.peak), 로그시간),
    weeksVsPeak: 상관(all.map((r) => r.weeks), all.map((r) => r.peak)),
  },
  longest: [...shown].sort((a, b) => b.weeks - a.weeks || b.hours - a.hours).slice(0, 10),
  fiercest: [...shown].sort((a, b) => b.perWeek - a.perWeek).slice(0, 10),
  rows: shown,
  excludedEnglishChart: st.droppedEnglishChart.length,
  excludedByHand: st.droppedByHand,
  audited: AUDITED,
};
fs.writeFileSync('src/data/wikitip-staying-power.json', JSON.stringify(out, null, 2));

console.log(`한국 작품 ${out.titleCount}편 · ${(out.totalHours / 1e9).toFixed(2)}bn 시간 · 주 ${out.weekCount}`);
console.log(`뺀 것 — 영어차트 ${out.excludedEnglishChart}편 · 손으로 ${out.excludedByHand.length}편`);
console.log('가장 오래:', out.longest.slice(0, 3).map((r) => `${r.title} ${r.weeks}w`).join(' · '));
console.log('가장 세게:', out.fiercest.slice(0, 3).map((r) => `${r.title} ${(r.perWeek / 1e6).toFixed(0)}m/w`).join(' · '));
