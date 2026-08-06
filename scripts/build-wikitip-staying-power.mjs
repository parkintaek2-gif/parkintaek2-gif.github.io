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
  peakGroups: [grp((r) => r.peak === 1, 'Peaked at #1'), grp((r) => r.peak > 1, 'Peaked below #1')],
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
