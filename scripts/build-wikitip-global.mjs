/**
 * K Culture Wire — 한국 작품의 **글로벌 넷플릭스 총 시청시간** 카탈로그.
 *
 * /titles 는 동남아 도달·지속(reach)이다. 이 지면은 **전 세계 hours viewed** — 다른 축이다.
 * 첫 화면은 상위 10만. 여기는 상위 50 + 총계.
 * 결과 → src/data/wikitip-global.json (지면 watched.astro).
 *
 * 입력(이미 있는 것): archive/raw/netflix-top10/global.ndjson {주,구분,순위,제목,시청시간,…}
 *   구분: Films/TV × (English)/(Non-English). 한국작품은 korean-titles.json(P495=Q884)로 매칭.
 * 라이선스: 넷플릭스 Tudum 글로벌 주간 순위. 원본 표 재배포 없이 **집계(합)**만.
 * 시각: KST.
 */
import fs from 'node:fs';
import readline from 'node:readline';

const korean = new Set(JSON.parse(fs.readFileSync('archive/raw/netflix-top10/korean-titles.json', 'utf8')).제목);
const agg = new Map();
const weeksAll = new Set();
let scanned = 0, hit = 0;

const rl = readline.createInterface({ input: fs.createReadStream('archive/raw/netflix-top10/global.ndjson'), crlfDelay: Infinity });
for await (const line of rl) {
  if (!line.trim()) continue;
  let r; try { r = JSON.parse(line); } catch { continue; }
  scanned++;
  if (!korean.has(r.제목)) continue;
  hit++;
  weeksAll.add(r.주);
  let a = agg.get(r.제목);
  if (!a) { a = { title: r.제목, type: r.구분, hours: 0, peak: 99, weeks: new Set() }; agg.set(r.제목, a); }
  a.hours += r.시청시간 || 0;
  a.weeks.add(r.주);
  if (typeof r.순위 === 'number' && r.순위 < a.peak) a.peak = r.순위;
  if (r.구분) a.type = r.구분;
}

const rows = [...agg.values()]
  .map((a) => ({ title: a.title, kind: /^TV/i.test(a.type) ? 'series' : 'film', hours: a.hours, peak: a.peak, weeks: a.weeks.size }))
  .sort((x, y) => y.hours - x.hours)
  .slice(0, 50);

const weeks = [...weeksAll].sort();
const totalHours = [...agg.values()].reduce((s, a) => s + a.hours, 0);
const out = {
  generated: new Date().toLocaleString('ko-KR'),
  source: 'Netflix Top 10 (Tudum) global weekly hours viewed; Korean titles identified via Wikidata country of origin (P495 = Q884)',
  weekFrom: weeks[0],
  weekTo: weeks[weeks.length - 1],
  weekCount: weeks.length,
  titleCount: agg.size,
  totalHours,
  rows,
};
fs.writeFileSync('src/data/wikitip-global.json', JSON.stringify(out, null, 2));

console.log(`scanned ${scanned.toLocaleString()} · korean hits ${hit.toLocaleString()} · distinct ${agg.size} · totalHours ${totalHours.toLocaleString()}`);
console.log('top 6:', rows.slice(0, 6).map((r) => `${r.title} (${(r.hours / 1e9).toFixed(2)}bn h, ${r.weeks}w)`).join(' · '));
