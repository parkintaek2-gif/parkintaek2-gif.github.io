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

/* ⚠ 동남아 목록(/titles·/reach)도 **반드시** 넣는다. 글로벌 Top10 에 못 오르고
   나라별 차트에만 뜬 작품이 절반이나 된다 — 2026-08-07 에 상품 한 벌을 열어 보고 알았다.
   405줄 중 202줄에 판정이 비어 있었다. 이 칸이 그 상품의 값인데 절반이 빈 채였다.
   「글로벌만 재고 동남아는 안 잰다」는 우리가 정한 적 없는 경계였다. */
const 동남아 = JSON.parse(fs.readFileSync('src/data/wikitip-titles.json', 'utf8')).rows.map((r) => r.title);
const 이미 = new Set(list.map((x) => x.title));
for (const t of 동남아) if (!이미.has(t)) { list.push({ title: t, hours: 0, seaOnly: true }); 이미.add(t); }

/* 🔴 2026-08-09. **같은 경계가 한 고리 바깥에 또 있었다.**
   위 주석은 「글로벌만 재고 동남아는 안 잰다」를 정한 적 없는 경계라 적었다. 맞다.
   그런데 그때 고친 것은 동남아 여섯 나라까지였고, 나라 판은 **93개 시장**이다.
   재 보니 나라 판 한국 작품 938편 중 판정이 있는 것은 432편 — **506편은 한 번도 안 물었다.**
   `/catalogue-depth` 는 그 93개 시장을 다 싣는다. 판정이 없으면 「모른다」조차 못 적는다.
   ⛔ 한 고리를 고치고 그 바깥을 안 본 것이 잘못이었다. **차트에 뜬 것은 전부 묻는다.** */
const 나라자리 = new Map();
{
  const rl = readline.createInterface({
    input: fs.createReadStream('archive/raw/netflix-top10/countries.ndjson'), crlfDelay: Infinity,
  });
  for await (const line of rl) {
    if (!line.trim()) continue;
    let r; try { r = JSON.parse(line); } catch { continue; }
    if (r.iso2 === 'RU') continue;
    if (!ko.keepTitle(r.제목)) continue;
    나라자리.set(r.제목, (나라자리.get(r.제목) || 0) + 1);
  }
}
/* 자리 많은 것부터 넣는다 — 중간에 끊겨도 큰 것부터 답이 남는다 */
for (const [t, 자리] of [...나라자리].sort((a, b) => b[1] - a[1])) {
  if (이미.has(t)) continue;
  list.push({ title: t, hours: 0, countryOnly: true, places: 자리 });
  이미.add(t);
}

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
const 통 = { koreaOnly: [], shared: [], noKorea: [], unknown: [], unreachable: [] };
const 못물음집 = new Set(못물음);

/**
 * 🔴 2026-08-09. **`shared` 가 두 가지를 한 통에 담고 있었다.**
 * 2026-08-08 에 여덟 편을 뺄 때 이렇게 적었다 — 「겹침은 한국이 **들어 있고** 딴 나라도 있는 것이다.
 * 여기 여덟은 한국이 **아예 없다.** 두 경우를 한 딱지로 묶고 있었던 것이 잘못이었다.」
 * ⛔ 그런데 그 깨달음이 **손으로 뺀 여덟 편에만** 적용됐고 이 자에는 안 들어왔다.
 *    자를 안 고치면 다음에 같은 것이 또 들어와도 또 손으로 찾아야 한다.
 *
 *   koreaOnly  그 이름을 한국 작품만 쓴다        → 글자로 골라도 틀릴 수 없다
 *   shared     한국이 **있고** 딴 나라도 있다     → 어느 쪽을 세었는지 **모른다**
 *   noKorea    한국이 **하나도 없다**             → 모르는 게 아니라 **한국 작품이 아니다**
 *   unknown    위키데이터가 그 이름의 나라를 모른다 → 판단 근거가 없다
 */
const 판정하기 = (title) => {
  if (못물음집.has(title)) return 'unreachable';
  const c = 나라.get(title);
  if (!c) return 'unknown';
  if (c.size === 1 && c.has(KOREA)) return 'koreaOnly';
  return c.has(KOREA) ? 'shared' : 'noKorea';
};
/* ⚠ 시간 비중은 **글로벌 목록만**으로 낸다. 동남아 전용 제목은 시청시간이 0 이라
   섞으면 편수는 늘고 비중은 그대로여서 「몇 편 중 몇 편」이 지면과 어긋난다.
   판정(perTitle)은 전부에 주고, 요약(koreaOnly/shared/unknown)은 글로벌 것만 센다. */
const 글로벌만 = list.filter((x) => !x.seaOnly && !x.frontPageOnly && !x.countryOnly);
for (const x of 글로벌만) {
  const v = 판정하기(x.title);
  const c = 나라.get(x.title);
  통[v].push(c ? { ...x, countries: [...c].sort() } : x);
}
const 시간 = (arr) => arr.reduce((s, x) => s + x.hours, 0);
const 몫 = (arr) => +((100 * 시간(arr)) / 총시간).toFixed(1);

const out = {
  generated: new Date().toISOString(),
  method: 'Every title we count is asked of Wikidata: which countries produced a film or TV series with exactly this English label. A title only Korean works carry cannot be mismatched by our title-text rule. A shared title means we cannot tell from the text alone which work charted — it does not mean the entry is wrong.',
  /** 요약이 대상으로 삼은 편수 — 글로벌 목록. 지면이 이 수를 인용한다. */
  titles: 글로벌만.length,
  /** 판정을 준 편수 — 동남아 전용 제목까지 포함. 상품 패널이 이 수를 쓴다. */
  titlesAssessed: list.length,
  totalHours: 총시간,
  koreaOnly: { titles: 통.koreaOnly.length, hours: 시간(통.koreaOnly), sharePc: 몫(통.koreaOnly) },
  shared: { titles: 통.shared.length, hours: 시간(통.shared), sharePc: 몫(통.shared) },
  /** 한국이 **하나도 없는** 편. 겹침(모른다)이 아니라 **명단에 있으면 안 되는** 것이다. */
  noKorea: { titles: 통.noKorea.length, hours: 시간(통.noKorea), sharePc: 몫(통.noKorea) },
  unknown: { titles: 통.unknown.length, hours: 시간(통.unknown), sharePc: 몫(통.unknown) },
  unreachable: { titles: 통.unreachable.length, hours: 시간(통.unreachable), sharePc: 몫(통.unreachable) },
  /** 겹치는 것 중 큰 것부터 — 손으로 볼 차례를 정하는 데 쓴다. */
  sharedTop: 통.shared.sort((a, b) => b.hours - a.hours).slice(0, 20)
    .map((x) => ({ title: x.title, hours: x.hours, countries: x.countries })),
  /** 편마다 판정을 남긴다. 요약만 두면 「어느 편이 어느 쪽인가」를 못 쓴다 —
      상품이든 지면이든 값은 그 칸에 있다. 요약은 이것을 접은 것일 뿐이다. */
  perTitle: list.map((x) => {
    const c = 나라.get(x.title);
    return {
      title: x.title,
      hours: x.hours,
      ...(x.places ? { places: x.places } : {}),
      verdict: 판정하기(x.title),
      countries: c ? [...c].sort() : [],
    };
  }),
  /** 첫 화면 이번 주 칸 — 가장 많이 보이는 자리다. 한 줄씩 어느 쪽인지 적는다. */
  frontPage: 첫화면.map((t) => ({
    title: t, verdict: 판정하기(t), countries: 나라.get(t) ? [...나라.get(t)].sort() : [],
  })),
  /** 🔴 한국이 하나도 없는데 명단에 있는 편 — 자리 많은 것부터. **뺄 차례가 이 순서다.** */
  noKoreaQueue: list
    .filter((x) => 판정하기(x.title) === 'noKorea')
    .map((x) => ({ title: x.title, places: x.places || 0, hours: x.hours, countries: [...나라.get(x.title)].sort() }))
    .sort((a, b) => b.places - a.places || b.hours - a.hours),
};
fs.writeFileSync('src/data/wikitip-title-ambiguity.json', JSON.stringify(out, null, 2));

console.log(`목록 ${out.titles}편 · ${(총시간 / 1e9).toFixed(2)}bn 시간`);
console.log(` 한국만  ${out.koreaOnly.titles}편 ${out.koreaOnly.sharePc}% — 글자로 골라도 틀릴 수 없다`);
console.log(` 겹침    ${out.shared.titles}편 ${out.shared.sharePc}% — 한국이 있고 딴 나라도 있다. 어느 쪽인지 모른다`);
console.log(` 한국없음 ${out.noKorea.titles}편 ${out.noKorea.sharePc}% — 🔴 모르는 게 아니라 한국 작품이 아니다`);
console.log(` 모름    ${out.unknown.titles}편 ${out.unknown.sharePc}% — 위키데이터가 나라를 모른다`);
console.log(`판정 준 편수 ${out.titlesAssessed}편 (나라 판까지 전부)`);
console.log(`🔴 뺄 차례 — 자리 많은 것부터:`);
for (const x of out.noKoreaQueue.slice(0, 12)) {
  console.log(`   ${x.title.padEnd(34)} ${String(x.places).padStart(4)}자리 · ${x.countries.join('·')}`);
}
console.log(`   … 한국 없음이 모두 ${out.noKoreaQueue.length}편`);
if (out.unreachable.titles) console.log(` 못 물음 ${out.unreachable.titles}편 ${out.unreachable.sharePc}%`);
console.log('겹치는 것 중 큰 것:', out.sharedTop.slice(0, 5).map((x) => `${x.title}(${x.countries.length}국)`).join(' · '));
