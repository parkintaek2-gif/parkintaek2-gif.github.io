#!/usr/bin/env node
/**
 * build-wikitip-hometowns.mjs — **가장 많이 읽히는 한국 스타는 어디서 태어났나.** (`/hometowns`)
 *
 * 🔴 사장님 지시(2026-08-20):
 *   「관광지 소개할 때도 **스타의 작품 배경 장소, 고향 등 연고지**, 스타가 방문하거나
 *    좋아하는 장소 등이 중심이 되는 게 좋겠지. 이때도 **스타의 이름, 소속그룹의 그룹명을 꼭 넣도록**」
 *
 * 그래서 이 자료는 **줄마다 사람 이름**이 있다. 「배우 몇 명」 같은 수는 아무도 안 찾는다.
 *
 * ── ⛔ 이 자료가 지키는 것 ────────────────────────────────────
 * ⛔⛔ **P19(태어난 곳)는 「고향」이 아니다.** 병원이 있는 도시가 적히기도 하고, 자란 곳과
 *    다르기도 하다. 그래서 지면에도 **「태어난 곳」이라고만 쓴다.** 「고향」이라 안 쓴다.
 * ⛔⛔ **좌표(P625)로 한국 안인지 다시 잰다.** 케산 전투를 「한국 장소」로 실었던 그 병이
 *    여기서도 난다 — 한국 스타가 로스앤젤레스에서 태어날 수 있다. **P17 로 안 가른다**
 *    (P17 은 관련 국가를 적는 칸이라 베트남 전투가 한국으로 걸렸다).
 * ⛔ **없는 것을 0 으로 안 센다.** P19 가 없으면 「안 적혀 있다」로 센다.
 * ⛔ 읽힌 수는 이미 백만분율이라 판 크기가 나눠져 있다.
 * ⛔ 광고 자리를 만들지 않는다.
 *
 * ── 🔴 처음 돌려 보고 셋을 고쳤다 (2026-08-22) ────────────────
 * ① **이름 자리에 `Q27655344` 가 찍혀 나왔다.** 명단에 이름이 아니라 id 가 들어 있는 줄이 있다.
 *    ⭐ 사람을 받을 때 위키데이터 영문 라벨을 같이 받아 두고, 이름이 id 꼴이면 라벨로 바꾼다.
 *    ⛔ 라벨도 없으면 **그 사람을 지면에서 뺀다.** 이름 없는 줄은 이 자료의 뜻을 없앤다.
 * ② **「South Korea」가 도시 목록에 8명으로 앉아 있었다.** P19 에 나라만 적힌 사람들이다.
 *    ⭐ P31(무엇인가)을 같이 받아 **나라는 도시에서 갈라낸다.** 도시가 아닌 것을 도시라 하지 않는다.
 * ③ **회령(Hoeryong)이 「한국 밖」으로 셌다.** 우리 상자는 북위 39.0 까지라 **북한 대부분이 밖**이다.
 *    ⛔ 그러니 「밖」을 「외국」으로 읽으면 틀린다. 상자 위쪽으로 벗어난 것은 **따로 적는다.**
 *
 * 쓰는 법
 *   node scripts/build-wikitip-hometowns.mjs --selftest
 *   node scripts/build-wikitip-hometowns.mjs            (위키데이터를 받는다 · 네트워크)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 안인가, 상자 } from './check-kcw-places-in-korea.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 명단방 = path.join(뿌리, 'archive', 'raw', 'wikipedia');
const 낼곳 = path.join(뿌리, 'src', 'data', 'wikitip-hometowns.json');
const 쟁여둘곳 = path.join(뿌리, 'archive', 'raw', 'wikidata', 'star-birthplaces.json');

/** ⭐ 몇 명을 볼지. 읽힌 수 순이다 — 사장님: 「인기있는 스타 순으로 콘텐트 양·개수를 정한다」 */
export const 볼사람 = 150;
export const 판이름 = { id: 'Indonesian', vi: 'Vietnamese', th: 'Thai', ms: 'Malay' };
export const 나라이름 = { id: 'Indonesia', vi: 'Vietnam', th: 'Thailand', ms: 'Malaysia' };

/** 세 명단을 합치고 **위키데이터 id 로 겹침을 뺀다** — IU 는 배우이자 가수다 */
export function 사람모으기(명단들) {
  const 본 = new Map();
  for (const d of 명단들) {
    for (const x of d.people ?? []) {
      if (!x.name || !x.q) continue;
      const 크기 = typeof x.seaPerMillionTotal === 'number' ? x.seaPerMillionTotal : null;
      const 전 = 본.get(x.q);
      if (전 && (전.total ?? -1) >= (크기 ?? -1)) continue;
      본.set(x.q, {
        q: x.q,
        name: x.name,
        total: 크기,
        perMillion: x.perMillion ?? {},
        isGroup: x.isGroup === true,
      });
    }
  }
  return [...본.values()];
}

/** ⛔ 단체는 태어난 곳이 없다. 사람만 본다 — 「BTS 가 태어난 도시」는 뜻이 없다 */
export function 사람만(것들) {
  return 것들.filter((x) => !x.isGroup);
}

export function 큰순(것들) {
  return [...것들].sort((a, b) => (b.total ?? -1) - (a.total ?? -1));
}

/** 위키데이터 엔티티에서 칸 하나를 뽑는다 */
export function 칸뽑기(엔티티, 칸) {
  return (엔티티?.claims?.[칸] ?? [])
    .map((c) => c.mainsnak?.datavalue?.value)
    .filter((v) => v != null);
}

export async function 받아오기(큐들, 칸들, 부르기 = fetch) {
  const 표 = new Map();
  for (let i = 0; i < 큐들.length; i += 50) {
    const 묶음 = 큐들.slice(i, i + 50);
    const url = 'https://www.wikidata.org/w/api.php?action=wbgetentities&format=json'
      + `&props=claims|labels&languages=en&ids=${묶음.join('|')}`;
    const r = await 부르기(url, { headers: { 'User-Agent': 'KCultureWire/1.0 (parkintaek2@gmail.com)' } });
    if (!r.ok) throw new Error(`위키데이터 ${r.status} — 다시 돌려라`);
    const j = await r.json();
    for (const [q, e] of Object.entries(j.entities ?? {})) {
      표.set(q, {
        label: e.labels?.en?.value ?? null,
        칸: Object.fromEntries(칸들.map((k) => [k, 칸뽑기(e, k)])),
      });
    }
  }
  return 표;
}

/** ⛔ 명단에 이름 대신 `Q12345` 가 들어 있는 줄이 있다. 라벨로 바꾸고, 라벨도 없으면 뺀다 */
export const 아이디꼴 = /^Q\d+$/;
export function 이름고치기(사람들, 라벨표) {
  const 산것 = [];
  const 버린것 = [];
  for (const p of 사람들) {
    if (!아이디꼴.test(p.name)) { 산것.push(p); continue; }
    const 라벨 = 라벨표.get(p.q)?.label ?? null;
    if (라벨 && !아이디꼴.test(라벨)) 산것.push({ ...p, name: 라벨, nameWasId: true });
    else 버린것.push(p);
  }
  return { 산것, 버린것 };
}

/** ⛔ 나라는 도시가 아니다. P31 로 가른다 — 「South Korea」를 도시라 부르지 않는다 */
export const 나라인것 = new Set(['Q6256', 'Q3624078', 'Q7275']);
export function 나라인가(곳) {
  return (곳?.칸?.P31 ?? []).some((v) => 나라인것.has(v?.id));
}

/**
 * ⭐ 사람 → 태어난 곳 → 좌표. **다섯 갈래로 가른다.**
 *   안(도시) · 나라만 적힘 · 상자 위쪽(북한 쪽) · 그 밖 · 안 적혀 있다
 * ⛔ 하나도 0 으로 접지 않는다. 다 더하면 사람 수와 같아야 한다.
 */
export function 가르기(사람들, 곳표, 좌표표, 네모 = 상자) {
  const 안 = [];
  const 나라만 = [];
  const 상자위 = [];
  const 밖 = [];
  const 없음 = [];
  for (const p of 사람들) {
    const 곳큐 = (곳표.get(p.q)?.칸?.P19 ?? [])[0]?.id ?? null;
    if (!곳큐) { 없음.push({ ...p, reason: 'P19 가 안 적혀 있다' }); continue; }
    const 곳 = 좌표표.get(곳큐);
    const 좌 = (곳?.칸?.P625 ?? [])[0] ?? null;
    const 자리 = 좌 ? { lat: 좌.latitude, lon: 좌.longitude } : null;
    const 몸 = { ...p, placeQ: 곳큐, place: 곳?.label ?? null, coord: 자리 };
    if (나라인가(곳)) { 나라만.push({ ...몸, reason: 'P19 에 도시가 아니라 나라만 적혀 있다' }); continue; }
    const 안인지 = 안인가(자리, 네모);
    if (안인지 === null) { 없음.push({ ...몸, reason: '그 곳에 좌표(P625)가 없다' }); continue; }
    if (안인지) { 안.push(몸); continue; }
    /* ⛔ 「밖」을 「외국」으로 읽으면 틀린다 — 우리 상자 위쪽은 북한이다 */
    if (자리.lat > 네모.북 && 자리.lon >= 네모.서 && 자리.lon <= 네모.동) 상자위.push(몸);
    else 밖.push(몸);
  }
  return { 안, 나라만, 상자위, 밖, 없음 };
}

/** 도시마다 몇 명이고 **누구인지** — 이름이 빠지면 이 자료는 뜻이 없다 */
export function 도시별(안것들) {
  const 표 = new Map();
  for (const p of 안것들) {
    const 키 = p.place ?? '(이름 없음)';
    if (!표.has(키)) 표.set(키, { place: 키, placeQ: p.placeQ, coord: p.coord, people: [] });
    표.get(키).people.push({ name: p.name, q: p.q, perMillionTotal: p.total });
  }
  return [...표.values()]
    .map((x) => ({
      ...x,
      count: x.people.length,
      people: x.people.sort((a, b) => (b.perMillionTotal ?? -1) - (a.perMillionTotal ?? -1)),
      readTotal: Number(x.people.reduce((s, y) => s + (y.perMillionTotal ?? 0), 0).toFixed(2)),
    }))
    .sort((a, b) => b.count - a.count || b.readTotal - a.readTotal);
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0;
  let 실 = 0;
  const 재본다 = (n, v, w) => {
    const ok = typeof w === 'function' ? w(v) : JSON.stringify(v) === JSON.stringify(w);
    if (ok) 통 += 1; else { 실 += 1; console.error(`  ⛔ ${n}\n     받은 것: ${JSON.stringify(v)}`); }
  };

  /* 겹침 — IU 가 두 명단에 있어도 한 사람이다 */
  const 모 = 사람모으기([
    { people: [
      { q: 'Q1', name: 'IU', seaPerMillionTotal: 100 },
      { q: 'Q2', name: 'BTS', isGroup: true, seaPerMillionTotal: 380 },
    ] },
    { people: [{ q: 'Q1', name: 'IU', seaPerMillionTotal: 120 }] },
  ]);
  재본다('⛔⛔ 위키데이터 id 로 겹침을 뺀다', 모.length, 2);
  재본다('⭐ 겹치면 큰 쪽을 남긴다', 모.find((x) => x.q === 'Q1').total, 120);
  재본다('⛔ 단체는 태어난 곳을 안 묻는다', 사람만(모).map((x) => x.name), ['IU']);
  재본다('⭐ 읽힌 수 순으로 줄 세운다', 큰순(모).map((x) => x.name), ['BTS', 'IU']);

  /* 칸 뽑기 */
  재본다('⭐ claims 에서 칸을 뽑는다',
    칸뽑기({ claims: { P19: [{ mainsnak: { datavalue: { value: { id: 'Q8684' } } } }] } }, 'P19'),
    [{ id: 'Q8684' }]);
  재본다('⛔ 칸이 없으면 빈 목록이다 — undefined 로 안 던진다', 칸뽑기({}, 'P19'), []);

  /* ⛔⛔ 좌표로 가른다. 한국 스타가 서울에서만 태어나지 않는다 */
  const 사람 = [
    { q: 'Q1', name: '서울사람', total: 10 },
    { q: 'Q2', name: '엘에이사람', total: 9 },
    { q: 'Q3', name: '좌표없는곳사람', total: 8 },
    { q: 'Q4', name: '안적힌사람', total: 7 },
  ];
  const 곳표 = new Map([
    ['Q1', { 칸: { P19: [{ id: 'QSeoul' }] } }],
    ['Q2', { 칸: { P19: [{ id: 'QLA' }] } }],
    ['Q3', { 칸: { P19: [{ id: 'QNoCoord' }] } }],
    ['Q4', { 칸: { P19: [] } }],
  ]);
  const 좌표표 = new Map([
    ['QSeoul', { label: 'Seoul', 칸: { P625: [{ latitude: 37.5665, longitude: 126.978 }] } }],
    ['QLA', { label: 'Los Angeles', 칸: { P625: [{ latitude: 34.0522, longitude: -118.2437 }] } }],
    ['QNoCoord', { label: 'Nowhere', 칸: { P625: [] } }],
  ]);
  const 갈 = 가르기(사람, 곳표, 좌표표);
  재본다('⭐ 서울은 안이다', 갈.안.map((x) => x.name), ['서울사람']);
  재본다('⛔⛔ 로스앤젤레스는 밖이다 — 한국 스타여도 그렇다', 갈.밖.map((x) => x.name), ['엘에이사람']);
  재본다('⛔ 좌표 없는 곳은 「못 쟀다」다 — 안으로도 밖으로도 안 넣는다',
    갈.없음.map((x) => x.reason), ['그 곳에 좌표(P625)가 없다', 'P19 가 안 적혀 있다']);
  재본다('⛔ 갈래를 다 더하면 사람 수와 같다 — 한 명도 안 흘린다',
    갈.안.length + 갈.나라만.length + 갈.상자위.length + 갈.밖.length + 갈.없음.length, 사람.length);

  /* ② 나라는 도시가 아니다 */
  const 나라섞임 = 가르기(
    [{ q: 'Q9', name: '나라만적힌사람', total: 3 }],
    new Map([['Q9', { 칸: { P19: [{ id: 'QKR' }] } }]]),
    new Map([['QKR', { label: 'South Korea', 칸: { P31: [{ id: 'Q6256' }], P625: [{ latitude: 36, longitude: 128 }] } }]]),
  );
  재본다('⛔⛔ 「South Korea」를 도시로 안 센다', 나라섞임.안.length, 0);
  재본다('⭐ 나라만 적힌 것은 따로 세어 보인다', 나라섞임.나라만.map((x) => x.place), ['South Korea']);
  재본다('⭐ P31 이 나라면 나라다', 나라인가({ 칸: { P31: [{ id: 'Q3624078' }] } }), true);
  재본다('⛔ P31 이 없으면 나라가 아니다 — 없는 것을 있다고 안 한다', 나라인가({ 칸: {} }), false);

  /* ③ 🔴 회령은 「외국」이 아니다. 우리 상자 위쪽이다 */
  const 회령 = 가르기(
    [{ q: 'Q9', name: '회령사람', total: 3 }],
    new Map([['Q9', { 칸: { P19: [{ id: 'QHR' }] } }]]),
    new Map([['QHR', { label: 'Hoeryong', 칸: { P625: [{ latitude: 42.4381, longitude: 129.7519 }] } }]]),
  );
  재본다('⛔⛔ 회령은 「그 밖」이 아니라 「상자 위쪽」이다', 회령.상자위.map((x) => x.place), ['Hoeryong']);
  재본다('⛔ 그러니 「밖」 칸엔 안 들어간다', 회령.밖.length, 0);

  /* ① 이름 자리에 id 가 들어 있는 줄 */
  const 이름 = 이름고치기(
    [{ q: 'Q1', name: 'Q27655344' }, { q: 'Q2', name: 'IU' }, { q: 'Q3', name: 'Q999' }],
    new Map([['Q1', { label: 'Rosé' }], ['Q3', { label: null }]]),
  );
  재본다('⭐ id 꼴 이름을 라벨로 바꾼다', 이름.산것.map((x) => x.name), ['Rosé', 'IU']);
  재본다('⛔⛔ 라벨도 없으면 지면에서 뺀다 — 이름 없는 줄은 안 낸다', 이름.버린것.map((x) => x.q), ['Q3']);
  재본다('⛔ 보통 이름은 건드리지 않는다', 이름.산것.find((x) => x.q === 'Q2').nameWasId, undefined);

  /* 도시별 — 이름이 반드시 들어간다 */
  const 시 = 도시별([
    { place: 'Seoul', placeQ: 'QS', coord: null, name: 'A', q: 'Q1', total: 5 },
    { place: 'Seoul', placeQ: 'QS', coord: null, name: 'B', q: 'Q2', total: 9 },
    { place: 'Busan', placeQ: 'QB', coord: null, name: 'C', q: 'Q3', total: 7 },
  ]);
  재본다('⭐ 사람이 많은 도시가 먼저다', 시.map((x) => x.place), ['Seoul', 'Busan']);
  재본다('⭐⭐ 도시마다 이름이 들어간다 — 수만 두지 않는다', 시[0].people.map((x) => x.name), ['B', 'A']);
  재본다('⭐ 도시의 읽힌 수를 더한다', 시[0].readTotal, 14);

  재본다('⭐ 한국 상자가 그대로다', [상자.남, 상자.북], [32.5, 39.0]);
  재본다('⭐ 명단 셋이 다 있다',
    ['sea-actors', 'sea-musicians', 'sea-athletes']
      .every((f) => fs.existsSync(path.join(명단방, `${f}.json`))), true);

  console.log(`태어난 곳 자료 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  const 명단 = ['sea-actors', 'sea-musicians', 'sea-athletes']
    .map((f) => JSON.parse(fs.readFileSync(path.join(명단방, `${f}.json`), 'utf8')));
  const 다 = 큰순(사람만(사람모으기(명단)));
  const 볼것 = 다.slice(0, 볼사람);
  console.log(`사람 ${다.length}명 중 읽힌 수 위 ${볼것.length}명을 본다`);

  console.log('① 태어난 곳(P19) 을 받는다…');
  const 곳표 = await 받아오기(볼것.map((x) => x.q), ['P19']);
  const 곳큐 = [...new Set(볼것
    .flatMap((x) => (곳표.get(x.q)?.칸?.P19 ?? []).map((v) => v.id))
    .filter(Boolean))];
  console.log(`   서로 다른 곳 ${곳큐.length}군데`);

  console.log('② 그 곳의 좌표(P625)와 무엇인지(P31) 를 받는다…');
  const 좌표표 = await 받아오기(곳큐, ['P625', 'P31']);

  /* ① 이름 자리에 id 가 찍힌 줄을 라벨로 고친다. 못 고치면 뺀다 */
  const { 산것: 볼사람들, 버린것 } = 이름고치기(볼것, 곳표);
  if (버린것.length) console.log(`⚠ 이름을 못 찾아 뺀 사람 ${버린것.length}명 — ${버린것.map((x) => x.q).join(' · ')}`);

  const { 안, 나라만, 상자위, 밖, 없음 } = 가르기(볼사람들, 곳표, 좌표표);
  const 도시 = 도시별(안);

  fs.mkdirSync(path.dirname(쟁여둘곳), { recursive: true });
  fs.writeFileSync(쟁여둘곳, JSON.stringify({
    generated: new Date().toISOString(),
    people: 볼사람들.map((x) => ({
      q: x.q, name: x.name, P19: (곳표.get(x.q)?.칸?.P19 ?? []).map((v) => v.id),
    })),
    places: [...좌표표].map(([q, v]) => ({ q, label: v.label, P625: v.칸.P625, P31: v.칸.P31 })),
  }, null, 2));

  const 줄 = (x) => ({ name: x.name, place: x.place, perMillionTotal: x.total });
  const 낼것 = {
    generated: new Date().toISOString(),
    source: 'Wikidata (place of birth P19, coordinates P625, instance of P31) and Wikimedia Pageviews',
    window: 'reads: August 2025 to July 2026, human traffic only, per million reads of each edition',
    looked: 볼사람들.length,
    peopleTotal: 다.length,
    droppedNoName: 버린것.length,
    inBox: 안.length,
    countryOnly: 나라만.length,
    northOfBox: 상자위.length,
    elsewhere: 밖.length,
    notRecorded: 없음.length,
    box: 상자,
    cities: 도시,
    countryOnlyPeople: 나라만.map(줄),
    northOfBoxPeople: 상자위.map(줄),
    elsewherePeople: 밖.map(줄),
    missing: 없음.map((x) => ({ name: x.name, reason: x.reason, perMillionTotal: x.total })),
    editionNames: 판이름,
    countryNames: 나라이름,
    cannotSay: [
      'P19 records where a person was born, which is not the same as where they are from. A hospital city is often recorded instead of the town a person grew up in. This page says "born in" and never "hometown".',
      'The box we test against reaches 39.0 degrees north, so most of North Korea falls outside it. Lee Soon-jae was born in Hoeryong, which is north of the box and not abroad. We count those separately rather than calling them foreign.',
      'A place with no coordinates in Wikidata is counted as unmeasured, not as outside Korea. Filling those in would change the counts.',
      'Reads are lookups on four Southeast Asian Wikipedias. They measure curiosity in that region, not fame in Korea, and not visits to any place.',
    ],
    limitation: 'We test whether a birthplace is in Korea with its coordinates (P625), not with its country field (P17). P17 records involvement as well as location — that is how a battle in Vietnam once entered our list of Korean places.',
  };
  fs.writeFileSync(낼곳, JSON.stringify(낼것, null, 2));

  console.log(`\n상자 안 ${안.length} · 나라만 적힘 ${나라만.length} · 상자 위(북한 쪽) ${상자위.length}`
    + ` · 그 밖 ${밖.length} · 안 적혀 있음 ${없음.length}`);
  console.log(`도시 ${도시.length}군데. 제일 많은 곳 —`);
  for (const c of 도시.slice(0, 8)) {
    console.log(`   ${String(c.count).padStart(3)}명  ${c.place.padEnd(22)} ${c.people.slice(0, 4).map((p) => p.name).join(' · ')}`);
  }
  for (const [이름, 것] of [['나라만 적힘', 나라만], ['상자 위(북한 쪽)', 상자위], ['그 밖', 밖]]) {
    if (것.length) console.log(`\n⚠ ${이름} ${것.length}명 — ${것.slice(0, 8).map((x) => `${x.name}(${x.place})`).join(' · ')}`);
  }
  console.log(`\n낸 것 — ${낼곳}`);
}
