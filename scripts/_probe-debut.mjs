/**
 * 일찍 시작한 사람이 더 멀리 가나? ⛔ 결론을 정해 두지 않는다.
 *
 * 잴 것 — 데뷔 나이(ageAtStart) 대 그 사람의 **작품 수**와 **작품이 간 시장 수**.
 * 🔴 교란이 하나 뻔하다: **일찍 시작한 사람은 더 오래 일했다.**
 *    그래서 활동 햇수를 맞춰 놓고도 봐야 한다.
 */
import fs from 'node:fs';

const 사람 = JSON.parse(fs.readFileSync('archive/raw/wikidata/korean-people.json', 'utf8')).사람;
const 붙은 = JSON.parse(fs.readFileSync('archive/raw/netflix-top10/korean-cast-joined.json', 'utf8')).배우;
const 판 = JSON.parse(fs.readFileSync('src/data/wikitip-title-ambiguity.json', 'utf8'));
const 한국제목 = new Set(판.perTitle.map((x) => x.title));

/** 작품마다 간 시장 수 */
const 시장 = new Map();
for (const 줄 of fs.readFileSync('archive/raw/netflix-top10/countries.ndjson', 'utf8').split('\n')) {
  if (!줄.trim()) continue;
  let j; try { j = JSON.parse(줄); } catch { continue; }
  if (j.국가 === 'Russia' || !한국제목.has(j.제목)) continue;
  if (!시장.has(j.제목)) 시장.set(j.제목, new Set());
  시장.get(j.제목).add(j.국가);
}

const 올해 = 2026;
const 줄 = [];
for (const p of 사람) {
  if (!p.ageAtStart || !p.startedYear) continue;
  const 작품 = (붙은[p.q]?.작품이름 ?? []).filter((t) => 한국제목.has(t));
  if (!작품.length) continue;
  const 넓이 = Math.max(...작품.map((t) => (시장.get(t)?.size ?? 0)));
  줄.push({ 나이: p.ageAtStart, 햇수: 올해 - p.startedYear, 작품수: 작품.length, 최대넓이: 넓이 });
}

const 가운데 = (a) => { const s = [...a].sort((x, y) => x - y); return s[s.length >> 1]; };
const 띠 = [[0, 18], [18, 21], [21, 25], [25, 99]];
const 이름 = ['under 18', '18–20', '21–24', '25+'];

console.log(`잰 사람 ${줄.length}명 (데뷔 나이·차트에 오른 작품 둘 다 있는 사람)\n`);
console.log('데뷔 나이   사람   가운데 작품수   가운데 최대넓이   가운데 활동햇수');
for (let i = 0; i < 띠.length; i += 1) {
  const g = 줄.filter((x) => x.나이 >= 띠[i][0] && x.나이 < 띠[i][1]);
  if (!g.length) continue;
  console.log(`${이름[i].padEnd(11)}${String(g.length).padStart(5)}`
    + `${String(가운데(g.map((x) => x.작품수))).padStart(14)}`
    + `${String(가운데(g.map((x) => x.최대넓이))).padStart(17)}`
    + `${String(가운데(g.map((x) => x.햇수))).padStart(17)}`);
}

/* 🔴 교란 죽이기 — 활동 햇수를 맞춰 놓고 다시 본다 */
console.log('\n활동 햇수를 맞춰 놓고 — 가운데 최대넓이');
const 햇수띠 = [[0, 10], [10, 20], [20, 99]];
const 햇수이름 = ['0–9 yrs', '10–19 yrs', '20+ yrs'];
console.log('활동햇수      under 18      18–20        21–24        25+');
for (let h = 0; h < 햇수띠.length; h += 1) {
  const 칸 = [];
  for (let i = 0; i < 띠.length; i += 1) {
    const g = 줄.filter((x) => x.햇수 >= 햇수띠[h][0] && x.햇수 < 햇수띠[h][1]
      && x.나이 >= 띠[i][0] && x.나이 < 띠[i][1]);
    칸.push(g.length >= 15 ? `${가운데(g.map((x) => x.최대넓이))} (${g.length})` : `— (${g.length})`);
  }
  console.log(햇수이름[h].padEnd(12) + 칸.map((c) => c.padEnd(13)).join(''));
}
console.log('\n⚠ 열다섯 명이 안 되는 칸은 가운데값을 안 낸다 — 한 사람이 끌고 간다');
