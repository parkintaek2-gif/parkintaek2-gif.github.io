/**
 * 우리 넷플릭스 목록에서 **이름이 겹치는 작품이 얼마나 되나**를 잰다.
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 2026-08-07 되짚기에서 「손으로 본 것은 시간의 약 3분의 2까지고 그 아래는 안 봤다」를
 * 미확인으로 남겼다. 2번 지시: 「미확인인 채로 오픈하면 모르고 내는 것이다. 아는 채로 내야 한다」.
 *
 * 꼬리를 한 편씩 눈으로 볼 수는 없다. 대신 **위험을 잰다.**
 * 우리 판정은 제목 글자다. 그러니 위험은 오직 하나 — **같은 이름을 다른 나라 작품도 쓰는가.**
 * 위키데이터에 그 이름을 가진 영화·드라마의 나라를 전부 물어 셋으로 가른다.
 *
 *   한국만        그 이름을 한국 작품만 쓴다 → 글자로 골라도 틀릴 수 없다
 *   겹침          다른 나라 작품도 같은 이름을 쓴다 → 우리가 어느 쪽을 세었는지 모른다
 *   모름          위키데이터가 그 이름의 나라를 모른다 → 판단 근거가 없다
 *
 * ⛔ 「겹침」이 곧 「틀렸다」가 아니다. **모른다는 뜻이다.** 그 크기를 지면에 적으려고 잰다.
 *    짐작으로 빼지 않는다 — 빼면 맞는 것을 잃는다.
 *
 * 결과 → src/data/wikitip-title-ambiguity.json (지면 /about 과 출처 줄이 읽는다)
 * 쓰는 법: node scripts/check-title-ambiguity.mjs
 */
import fs from 'node:fs';
import readline from 'node:readline';
import { koreanTitleFilter } from './lib/korean-netflix-titles.mjs';

const UA = 'KCultureWire/1.0 (parkintaek2@gmail.com) title ambiguity check';
const ENDPOINT = 'https://query.wikidata.org/sparql';
const BATCH = 25;

/* ── 목록 ── 우리가 실제로 세고 있는 제목 전부와 그 시청시간. */
const ko = koreanTitleFilter();
const agg = new Map();
{
  const rl = readline.createInterface({
    input: fs.createReadStream('archive/raw/netflix-top10/global.ndjson'), crlfDelay: Infinity,
  });
  for await (const line of rl) {
    if (!line.trim()) continue;
    let r; try { r = JSON.parse(line); } catch { continue; }
    if (!ko.keepRow(r.제목, r.구분)) continue;
    agg.set(r.제목, (agg.get(r.제목) || 0) + (r.시청시간 || 0));
  }
}
const list = [...agg].map(([title, hours]) => ({ title, hours })).sort((a, b) => b.hours - a.hours);
const 총시간 = list.reduce((s, x) => s + x.hours, 0);

/* 첫 화면 이번 주 칸도 같은 자로 잰다. 가장 많이 보이는 자리라 여기가 제일 아프다.
   목록에 없는 제목(글로벌에 못 오르고 나라별에만 뜬 것)도 있어서 따로 붙인다. */
const 첫화면 = JSON.parse(fs.readFileSync('src/data/wikitip-charts.json', 'utf8')).동남아.map((r) => r.제목);
for (const t of 첫화면) if (!agg.has(t)) list.push({ title: t, hours: 0, frontPageOnly: true });

/* ── 위키데이터에 묻는다 ── 제목마다 그 이름을 가진 영화·드라마의 나라 전부. */
const 나라 = new Map();
const 못물음 = [];
const sparqlEscape = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

for (let i = 0; i < list.length; i += BATCH) {
  const chunk = list.slice(i, i + BATCH);
  const values = chunk.map((x) => `'${sparqlEscape(x.title)}'@en`).join(' ');
  const query = `SELECT ?t ?countryLabel WHERE {
    VALUES ?t { ${values} }
    ?item rdfs:label ?t .
    ?item wdt:P31/wdt:P279* ?type . VALUES ?type { wd:Q11424 wd:Q5398426 }
    ?item wdt:P495 ?country .
    SERVICE wikibase:label { bd:serviceParam wikibase:language 'en'. }
  }`;
  let ok = false;
  for (let 시도 = 0; 시도 < 3 && !ok; 시도++) {
    try {
      const r = await fetch(`${ENDPOINT}?format=json&query=${encodeURIComponent(query)}`, {
        headers: { 'User-Agent': UA, Accept: 'application/sparql-results+json' },
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      for (const b of j.results.bindings) {
        const t = b.t.value;
        if (!나라.has(t)) 나라.set(t, new Set());
        나라.get(t).add(b.countryLabel.value);
      }
      ok = true;
    } catch (e) {
      if (시도 === 2) 못물음.push(...chunk.map((x) => x.title));
    }
  }
  process.stdout.write(ok ? '.' : 'x');
}
process.stdout.write('\n');

/* ── 가른다 ── 한국만 / 겹침 / 모름. 못 물은 것은 「모름」에 넣지 않고 따로 센다. */
const KOREA = 'South Korea';
const 통 = { koreaOnly: [], shared: [], unknown: [], unreachable: [] };
for (const x of list) {
  if (못물음.includes(x.title)) { 통.unreachable.push(x); continue; }
  const c = 나라.get(x.title);
  if (!c) { 통.unknown.push(x); continue; }
  if (c.size === 1 && c.has(KOREA)) 통.koreaOnly.push(x);
  else 통.shared.push({ ...x, countries: [...c].sort() });
}
const 시간 = (arr) => arr.reduce((s, x) => s + x.hours, 0);
const 몫 = (arr) => +((100 * 시간(arr)) / 총시간).toFixed(1);

const out = {
  generated: new Date().toISOString(),
  method: 'Every title we count is asked of Wikidata: which countries produced a film or TV series with exactly this English label. A title only Korean works carry cannot be mismatched by our title-text rule. A shared title means we cannot tell from the text alone which work charted — it does not mean the entry is wrong.',
  titles: list.length,
  totalHours: 총시간,
  koreaOnly: { titles: 통.koreaOnly.length, hours: 시간(통.koreaOnly), sharePc: 몫(통.koreaOnly) },
  shared: { titles: 통.shared.length, hours: 시간(통.shared), sharePc: 몫(통.shared) },
  unknown: { titles: 통.unknown.length, hours: 시간(통.unknown), sharePc: 몫(통.unknown) },
  unreachable: { titles: 통.unreachable.length, hours: 시간(통.unreachable), sharePc: 몫(통.unreachable) },
  /** 겹치는 것 중 큰 것부터 — 손으로 볼 차례를 정하는 데 쓴다. */
  sharedTop: 통.shared.sort((a, b) => b.hours - a.hours).slice(0, 20)
    .map((x) => ({ title: x.title, hours: x.hours, countries: x.countries })),
  /** 편마다 판정을 남긴다. 요약만 두면 「어느 편이 어느 쪽인가」를 못 쓴다 —
      상품이든 지면이든 값은 그 칸에 있다. 요약은 이것을 접은 것일 뿐이다. */
  perTitle: list.map((x) => {
    const c = 나라.get(x.title);
    const v = 못물음.includes(x.title) ? 'unreachable'
      : !c ? 'unknown' : (c.size === 1 && c.has(KOREA) ? 'koreaOnly' : 'shared');
    return { title: x.title, hours: x.hours, verdict: v, countries: c ? [...c].sort() : [] };
  }),
  /** 첫 화면 이번 주 칸 — 가장 많이 보이는 자리다. 한 줄씩 어느 쪽인지 적는다. */
  frontPage: 첫화면.map((t) => {
    const c = 나라.get(t);
    const 상태 = !c ? 'unknown' : (c.size === 1 && c.has(KOREA) ? 'koreaOnly' : 'shared');
    return { title: t, verdict: 상태, countries: c ? [...c].sort() : [] };
  }),
};
fs.writeFileSync('src/data/wikitip-title-ambiguity.json', JSON.stringify(out, null, 2));

console.log(`목록 ${out.titles}편 · ${(총시간 / 1e9).toFixed(2)}bn 시간`);
console.log(` 한국만  ${out.koreaOnly.titles}편 ${out.koreaOnly.sharePc}% — 글자로 골라도 틀릴 수 없다`);
console.log(` 겹침    ${out.shared.titles}편 ${out.shared.sharePc}% — 어느 쪽을 세었는지 모른다`);
console.log(` 모름    ${out.unknown.titles}편 ${out.unknown.sharePc}% — 위키데이터가 나라를 모른다`);
if (out.unreachable.titles) console.log(` 못 물음 ${out.unreachable.titles}편 ${out.unreachable.sharePc}%`);
console.log('겹치는 것 중 큰 것:', out.sharedTop.slice(0, 5).map((x) => `${x.title}(${x.countries.length}국)`).join(' · '));
