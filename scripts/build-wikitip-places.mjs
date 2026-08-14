#!/usr/bin/env node
/**
 * **동남아는 한국의 어디를 찾아보나** (`/places`) — 86편째.
 *   사장님 지시(8/13) — 「스타들이 가는 곳(맛집·카페·여행지·촬영지) 지도 시장 조사」
 *
 * ── ⛔ 이 지면이 못 하는 것을 먼저 적는다 ─────────────────────
 * ⛔ **가게를 못 잰다.** 위키백과에 식당·카페 문서가 없다. 잰 것은 동네·도시·궁궐·역이다.
 *    가게 층은 한국관광공사 TourAPI 가 있어야 얹힌다(열쇠 대기 · 3번·6번 몫).
 * ⛔ 조회수는 **관심이지 방문이 아니다.** 누가 왔는지는 이 자가 못 본다.
 * ⛔ 장소를 줄세우지 않는다. **나라마다 어디를 보나**를 나란히 놓는다.
 *
 * ⭐ 잰 것 중 뜻밖의 것 — **소속사가 도시와 나란히 선다.** 그것을 갈라 낸다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 원자료 = 'archive/raw/wikipedia/sea-places.json';
const 결과 = 'src/data/wikitip-places.json';
const 나라이름 = { id: 'Indonesia', vi: 'Vietnam', th: 'Thailand', ms: 'Malaysia' };
const 판들 = Object.keys(나라이름);

/**
 * 갈래를 사람이 읽는 말로 묶는다. ⛔ Wikidata 종류가 수십 가지라 그대로 내면 표가 안 읽힌다.
 * ⚠ 묶는 것은 내 판단이다. 그래서 **무엇을 어디에 넣었는지 자료에 적는다.**
 */
export const 묶음 = [
  /* ⚠ 도시가 역보다 앞이다 — 「metropolitan city」 는 도시지 역이 아니다 */
  { key: 'admin', label: 'Cities and districts', 표: ['city', 'district', 'dong', 'county', 'province', 'gu', 'eup', 'myeon', 'metropolis', 'metropolitan', 'megacity', 'capital', 'town', 'settlement'] },
  { key: 'station', label: 'Stations', 표: ['station', 'metro', 'railway', 'subway'] },
  { key: 'heritage', label: 'Palaces, temples and heritage', 표: ['palace', 'temple', 'shrine', 'fortress', 'tomb', 'treasure', 'heritage', 'historic'] },
  { key: 'nature', label: 'Islands, mountains and parks', 표: ['island', 'mountain', 'park', 'river', 'beach', 'lake', 'peak', 'valley'] },
  { key: 'company', label: 'Companies and agencies', 표: ['company', 'agency', 'label', 'enterprise', 'business', 'corporation', 'chaebol'] },
  { key: 'venue', label: 'Stadiums, museums and venues', 표: ['stadium', 'museum', 'arena', 'theatre', 'theater', 'hall', 'gallery', 'airport'] },
];

/**
 * 🔴 8/14 — 처음엔 `s.includes(w)` 로 **낱말 조각**을 맞췄다.
 *   그래서 `metro` 가 **metropolis·metropolitan** 을 삼켜 서울·부산·인천이 전부 「역」이 됐다.
 *   자가시험이 잡았다. → **낱말 단위**로 맞춘다. 조각으로는 안 맞춘다.
 * ⚠ 묶음이 겹치면 앞엣것이 이긴다. 그래서 순서에 뜻이 있고, 그 순서를 자료에 적는다.
 */
export function 묶기(갈래들) {
  const 낱말 = new Set(
    (갈래들 ?? []).flatMap((s) => String(s).toLowerCase().split(/[^a-z]+/).filter(Boolean)),
  );
  for (const m of 묶음) {
    if (m.표.some((w) => 낱말.has(w))) return m.key;
  }
  return 'other';
}

export function 가운데(수들) {
  const s = [...수들].filter((v) => typeof v === 'number').sort((a, b) => a - b);
  return s.length ? s[s.length >> 1] : null;
}

/** 한 판에서 가장 많이 찾아본 곳 */
export function 판으뜸(곳들, 판, n = 8) {
  return 곳들
    .filter((x) => typeof x.perMillion?.[판] === 'number')
    .sort((a, b) => b.perMillion[판] - a.perMillion[판])
    .slice(0, n)
    .map((x) => ({ name: x.name, perMillion: x.perMillion[판], views: x.views[판] }));
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    const ok = typeof 바람 === 'function' ? 바람(실제) : JSON.stringify(실제) === JSON.stringify(바람);
    if (ok) 통 += 1; else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  재본다('묶기 — 역', 묶기(['metro station']), 'station');
  재본다('묶기 — 도시', 묶기(['metropolitan city of South Korea']), 'admin');
  재본다('묶기 — 궁궐', 묶기(['palace']), 'heritage');
  재본다('묶기 — 섬', 묶기(['island']), 'nature');
  재본다('묶기 — 회사', 묶기(['record label', 'talent agency']), 'company');
  재본다('묶기 — 모르는 것은 other', 묶기(['battle']), 'other');
  재본다('묶기 — 빈 것도 other', 묶기([]), 'other');
  재본다('⚠ 묶음이 겹치면 앞엣것이 이긴다 — 그래서 순서가 뜻이 있다',
    묶기(['island', 'park']), 'nature');
  /* 🔴 8/14 — `metro` 가 metropolis·metropolitan 을 삼켜 서울·부산이 「역」이 됐다 */
  재본다('🔴 metropolis 는 역이 아니다', 묶기(['metropolis']), 'admin');
  재본다('🔴 서울의 실제 갈래로 재 본다',
    묶기(['city', 'megacity', 'metropolis', 'Special City of Korea', 'largest city', 'national capital']), 'admin');
  재본다('🔴 인천의 실제 갈래로 재 본다', 묶기(['metropolitan city of South Korea']), 'admin');
  /* ⚠ 역은 그대로 역이다 — 고친 것은 「metropolis 를 역으로 삼키던 것」뿐이다 */
  재본다('역은 그대로 역이다', 묶기(['metro station']), 'station');
  재본다('역은 그대로 역이다 — 지하철', 묶기(['underground station']), 'station');
  재본다('판으뜸 — 큰 것부터',
    판으뜸([{ name: 'A', perMillion: { id: 1 }, views: { id: 1 } },
      { name: 'B', perMillion: { id: 9 }, views: { id: 9 } }], 'id').map((x) => x.name), ['B', 'A']);
  재본다('판으뜸 — ⛔ 못 잰 곳은 뺀다',
    판으뜸([{ name: 'A', perMillion: { id: undefined }, views: {} }], 'id').length, 0);
  재본다('가운데 — 빈 것은 null', 가운데([]), null);
  console.log(`장소 지면 짓는 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  if (!fs.existsSync(원자료)) { console.error(`⛔ 없다 — ${원자료}`); process.exit(1); }
  const d = JSON.parse(fs.readFileSync(원자료, 'utf8'));
  if ((d.editionsNotFetched ?? []).length) {
    console.error(`⛔ 못 받은 판이 있다: ${d.editionsNotFetched.join(', ')} — 지면을 안 짓는다`);
    console.error('   그 나라가 「한국에 관심 없다」로 읽힌다. 수집기를 다시 돌려라.');
    process.exit(1);
  }

  const 곳 = d.people.map((x) => ({ ...x, 묶: 묶기(x.kinds) }));

  /* 묶음별 — 몇 곳이고 얼마나 읽히나 */
  const 묶음표 = [...묶음, { key: 'other', label: 'Other' }].map((m) => {
    const 이것 = 곳.filter((x) => x.묶 === m.key);
    const 합 = 판들.map((p) => 이것.reduce((a, x) => a + (x.perMillion[p] ?? 0), 0));
    return {
      group: m.key,
      label: m.label,
      places: 이것.length,
      perMillion: +합.reduce((a, b) => a + b, 0).toFixed(1),
      medianPlace: 가운데(이것.map((x) => x.seaPerMillionTotal)),
      byCountry: 판들.map((p, i) => ({ edition: p, country: 나라이름[p], perMillion: +합[i].toFixed(1) })),
    };
  }).filter((x) => x.places > 0).sort((a, b) => b.perMillion - a.perMillion);

  /* ⭐ 소속사가 도시와 나란히 서나 — 눈으로 보지 않고 센다 */
  const 회사 = 곳.filter((x) => x.묶 === 'company').sort((a, b) => b.seaPerMillionTotal - a.seaPerMillionTotal);
  const 도시 = 곳.filter((x) => x.묶 === 'admin').sort((a, b) => b.seaPerMillionTotal - a.seaPerMillionTotal);
  const 회사맨위 = 회사[0];
  const 도시맨위 = 도시[0];
  const 회사가이긴도시 = 회사맨위 ? 도시.filter((x) => x.seaPerMillionTotal < 회사맨위.seaPerMillionTotal).length : 0;

  const out = {
    generated: new Date().toISOString(),
    source: d.source,
    window: d.window,
    unit: d.unit ?? 'Reads per million reads of the whole language edition, summed across four '
      + 'editions, 12 months. One row is one place.',
    editions: 판들.map((p) => ({ code: p, country: 나라이름[p] })),
    question: 'Which parts of Korea do Southeast Asian readers look up?',
    placesMeasured: d.peopleMeasured,
    placesNotMeasured: d.peopleNotMeasured,
    groups: 묶음표,
    howGroupsWereMade: 'Wikidata gives dozens of place types. We fold them into seven readable '
      + 'groups by keyword, first match winning. The mapping is ours, so it is stated here rather '
      + 'than hidden: ' + 묶음.map((m) => `${m.label} = ${m.표.join('/')}`).join('; ') + '.',
    topByEdition: Object.fromEntries(판들.map((p) => [p, 판으뜸(곳, p)])),
    topOverall: 곳.slice(0, 15).map((x) => ({
      name: x.name,
      group: x.묶,
      perMillion: Object.fromEntries(판들.map((p) => [p, x.perMillion[p] ?? null])),
      total: x.seaPerMillionTotal,
    })),
    /** ⭐ 사장님 물음(8/13) — 스타의 일거수일투족. 회사가 그 축의 첫 자국이다 */
    topCompany: 회사맨위 ? { name: 회사맨위.name, total: 회사맨위.seaPerMillionTotal } : null,
    topCity: 도시맨위 ? { name: 도시맨위.name, total: 도시맨위.seaPerMillionTotal } : null,
    citiesBelowTopCompany: 회사가이긴도시,
    citiesCounted: 도시.length,
    companyFinding: 회사맨위 && 도시맨위
      ? `${회사맨위.name} scores ${회사맨위.seaPerMillionTotal}, above ${회사가이긴도시} of the `
        + `${도시.length} Korean cities and districts we measured. The most-read place of any kind `
        + `is ${도시맨위.name} at ${도시맨위.seaPerMillionTotal}. An entertainment company sits in `
        + 'the same band as a major city.'
      : null,
    /* 🔴 못 하는 말 — 표 바로 아래 같은 크기로 낸다 */
    cannotMeasureVenues: 'Wikipedia has articles on neighbourhoods, cities, palaces and stations. It '
      + 'does not have articles on individual restaurants and cafes. So this measures which parts of '
      + 'Korea are looked up, not which venues. A venue layer needs the Korea Tourism Organization '
      + 'API, which requires a key we do not yet hold.',
    readingIsNotVisiting: d.readingIsNotVisiting,
    whyNotPhilippines: 'The Tagalog Wikipedia is too small to measure with and Filipino readers '
      + 'largely use the English edition, so there is no honest Philippines figure to publish.',
  };
  fs.writeFileSync(결과, `${JSON.stringify(out, null, 2)}\n`);

  console.log(`⭐ ${결과}\n`);
  console.log('묶음                              곳     백만분율   가운데');
  for (const g of 묶음표) {
    console.log(`${g.label.padEnd(34)}${String(g.places).padStart(5)}${String(g.perMillion).padStart(11)}`
      + `${String(g.medianPlace).padStart(9)}`);
  }
  console.log(`\n🔴 ${out.companyFinding}`);
  console.log('\n나라마다 맨 위 셋');
  for (const p of 판들) {
    console.log(`   ${나라이름[p].padEnd(11)} ${out.topByEdition[p].slice(0, 3).map((x) => `${x.name} ${x.perMillion}`).join(' · ')}`);
  }
}
