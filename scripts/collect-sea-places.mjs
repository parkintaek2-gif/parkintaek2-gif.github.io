#!/usr/bin/env node
/**
 * **동남아는 한국의 어디를 찾아보나** — 사장님 지시(8/13).
 *   「스타들이 가는 곳(맛집·카페·여행지·촬영지)의 정보가 필요한 지도 시장 조사」
 *
 * ── 왜 이걸 먼저 하나 ──────────────────────────────────────────
 *   촬영지·맛집 정본은 한국관광공사 TourAPI 에 있는데 **키가 필요하다**(사장님 손).
 *   ⭐ 그 사이에 **키 없이 지금 잴 수 있는 것**이 있다 — 그 사람들이 한국의 어느 장소를
 *      위키백과에서 찾아보는가. 「지도가 필요한 시장인가」의 첫 자국이다.
 *
 * 🔴 선수·배우·가수와 **같은 자**를 쓴다 — 같은 언어판 넷, 같은 12개월, 같은 백만분율.
 *   그래야 「손흥민 342.3」 옆에 「명동 얼마」를 놓을 수 있다.
 *
 * ⛔ 이 수집기가 지키는 것
 * ⛔ 장소를 줄세우지 않는다. **어느 나라가 어디를 보나**를 나란히 놓는다.
 * ⛔ 조회수는 관심이지 방문이 아니다. 그 말을 자료에 담는다.
 * ⛔ 못 잰 것을 0 으로 세지 않는다.
 */
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';
import { 동남아, 백만분율, 합치기, 문서있는판 } from './collect-sea-athletes.mjs';

const 결과길 = 'archive/raw/wikipedia/sea-places.json';
const 중간길 = 'archive/raw/wikipedia/sea-places.partial.json';
const UA = 'KCultureWire/1.0 (https://www.kculturewire.com) node';
const 처음 = '20250801';
const 끝 = '20260731';
const 하드시한 = 60000;

/**
 * 무엇을 장소로 보나 — 🔴 **종류(P31)로 고르지 않는다.**
 *
 *   처음엔 동·구·궁궐… 열두 갈래의 Q번호를 적어 뒀다가 **동 0개·구 0개**가 나왔다.
 *   강남구는 「district of Seoul」이라는 제 종류를 갖고, 내가 적은 Q26283 이 아니었다.
 *   ⛔ 종류를 하나씩 맞히려 들면 한국 행정구역 체계를 내가 다 알아야 한다. 계속 틀린다.
 *
 * ⭐ 대신 **좌표(P625)가 있으면 장소**로 본다. 좌표는 장소만 갖는다.
 *    종류는 받아 온 뒤에 **읽어서** 붙인다 — 내가 정하지 않는다.
 *
 * ⚠ 「맛집·카페」는 위키백과에 거의 없다. 있는 것은 동네·거리·궁궐·섬·산·역이다.
 *   그래서 이 자료는 「어느 동네가 궁금한가」를 재지 「어느 가게가 궁금한가」를 못 잰다.
 *   ⛔ 그 한계를 자료에 적는다. TourAPI 열쇠가 나오면 가게 층을 그 위에 얹는다.
 */
export const 장소조건 = 'wdt:P17 wd:Q884 ; wdt:P625 ?좌표';

export const 쪽크기 = 500;
export const 덩이 = 120;

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    if (JSON.stringify(실제) === JSON.stringify(바람)) 통 += 1;
    else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  재본다('🔴 사람 자료와 같은 언어판 — 아니면 나란히 못 놓는다', 동남아, ['id', 'vi', 'th', 'ms']);
  재본다('🔴 같은 백만분율 셈', 백만분율(5086, 50430364), 100.85);
  /* 🔴 8/14 — 종류 Q번호를 열두 개 적어 뒀다가 동 0개·구 0개가 나왔다. 좌표로 바꿨다 */
  재본다('⛔ 종류 Q번호를 손으로 적지 않는다', 장소조건.includes('P625'), true);
  재본다('한국 것만 고른다', 장소조건.includes('wd:Q884'), true);
  재본다('못 잰 것은 0 이 아니다', 백만분율(null, 1000), null);
  재본다('문서 없음과 0 을 안 섞는다',
    문서있는판({ views: { id: 0, vi: null, th: 5, ms: undefined } }), 2);
  console.log(`장소 수집기 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

function 받기(host, 길) {
  return new Promise((resolve) => {
    let 끝났나 = false;
    const 한번만 = (v) => { if (!끝났나) { 끝났나 = true; clearTimeout(시한); resolve(v); } };
    const 시한 = setTimeout(() => {
      try { req.destroy(); } catch { /* 이미 죽었다 */ }
      한번만({ code: 0, body: '', 온전한가: false });
    }, 하드시한);
    const req = https.request({ host, path: 길, headers: { 'User-Agent': UA, Accept: 'application/json' } },
      (res) => {
        const 조각 = [];
        res.on('data', (c) => { 조각.push(c); });
        res.on('end', () => 한번만({
          code: res.statusCode,
          body: Buffer.concat(조각).toString('utf8'),
          온전한가: res.complete,
        }));
      });
    req.on('error', () => 한번만({ code: 0, body: '', 온전한가: false }));
    req.setTimeout(30000, () => { req.destroy(); 한번만({ code: 0, body: '', 온전한가: false }); });
    req.end();
  });
}

async function 스파클(질의) {
  for (let 번 = 0; 번 < 5; 번 += 1) {
    const r = await 받기('query.wikidata.org', `/sparql?format=json&query=${encodeURIComponent(질의)}`);
    if (r.code === 200 && r.온전한가) {
      try { return JSON.parse(r.body).results.bindings; } catch { /* 다시 */ }
    }
    await new Promise((s) => { setTimeout(s, 3000 * (번 + 1)); });
  }
  return null;
}

async function 조회수(판, 제목) {
  const 길 = `/api/rest_v1/metrics/pageviews/per-article/${판}.wikipedia/all-access/user/`
    + `${encodeURIComponent(제목.replace(/ /g, '_'))}/monthly/${처음}/${끝}`;
  for (let 번 = 0; 번 < 4; 번 += 1) {
    const r = await 받기('wikimedia.org', 길);
    if (r.code === 404) return null;
    if (r.code === 200 && r.온전한가) {
      try { return 합치기(JSON.parse(r.body).items ?? []); } catch { /* 다시 */ }
    }
    await new Promise((s) => { setTimeout(s, 800 * (2 ** 번)); });
  }
  return undefined;
}

async function 밑값(판) {
  const 길 = `/api/rest_v1/metrics/pageviews/aggregate/${판}.wikipedia/all-access/user/monthly/${처음}/${끝}`;
  const r = await 받기('wikimedia.org', 길);
  if (r.code !== 200 || !r.온전한가) return null;
  try { return 합치기(JSON.parse(r.body).items ?? []); } catch { return null; }
}

async function 떼로(일들, 폭 = 3) {
  const 답 = [];
  for (let i = 0; i < 일들.length; i += 폭) {
    답.push(...await Promise.all(일들.slice(i, i + 폭).map((f) => f())));
  }
  return 답;
}

if (내가실행됐다) {
  console.log('① 언어판 밑값 — 🔴 사람 자료와 같은 창\n');
  const 밑 = {};
  for (const p of 동남아) {
    밑[p] = await 밑값(p);
    console.log(`   ${p.padEnd(3)} ${밑[p] ? 밑[p].toLocaleString('en-US') : '⛔ 못 쟀다'}`);
  }

  /**
   * ⭐ 판별로 「그 판에 문서가 있는 한국 장소」를 바로 받는다.
   *   ⛔ 「한국 장소 전부」를 받고 거르지 않는다 — 수만 개라 무겁고, 대부분 버린다.
   *      물음을 좁히면 질의가 가벼워지고 결과가 곧 잴 것이 된다.
   */
  console.log('\n② 판마다 「그 판에 문서가 있는 한국 장소」를 바로 받는다');
  const 제목 = new Map();
  const 이름맵 = new Map();
  for (const p of 동남아) {
    let 받은 = 0;
    for (let 쪽 = 0; 쪽 < 30; 쪽 += 1) {
      const 줄들 = await 스파클(`SELECT ?p ?pLabel ?a WHERE {
        ?p ${장소조건} .
        ?a schema:about ?p ; schema:isPartOf <https://${p}.wikipedia.org/> .
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
      } ORDER BY ?p LIMIT ${쪽크기} OFFSET ${쪽 * 쪽크기}`);
      if (줄들 === null) break;
      for (const 줄 of 줄들) {
        const q = 줄.p.value.split('/').pop();
        if (!제목.has(q)) 제목.set(q, {});
        const 앞 = `https://${p}.wikipedia.org/wiki/`;
        const url = 줄.a?.value;
        if (url && url.startsWith(앞)) 제목.get(q)[p] = decodeURIComponent(url.slice(앞.length));
        if (줄.pLabel?.value) 이름맵.set(q, 줄.pLabel.value);
      }
      받은 += 줄들.length;
      if (줄들.length < 쪽크기) break;
    }
    console.log(`   ${p.padEnd(4)} ${받은}`);
  }
  const 잴것 = [...제목.keys()].filter((q) => 동남아.some((p) => 제목.get(q)?.[p]));
  console.log(`\n③ 동남아 판에 문서가 있는 한국 장소 **${잴것.length}**`);

  /* 종류는 **받아 온 뒤에 읽는다.** ⛔ 내가 정하지 않는다 */
  console.log('\n④ 종류를 읽어 붙인다 (내가 정하지 않는다)');
  const 갈래맵 = new Map();
  let 막힌덩이 = 0;
  for (let i = 0; i < 잴것.length; i += 덩이) {
    const 이번 = 잴것.slice(i, i + 덩이);
    const 줄들 = await 스파클(`SELECT ?p (GROUP_CONCAT(DISTINCT ?tL; separator="|") AS ?ts) WHERE {
      VALUES ?p { ${이번.map((q) => `wd:${q}`).join(' ')} }
      ?p wdt:P31 ?t . ?t rdfs:label ?tL . FILTER(lang(?tL)="en")
    } GROUP BY ?p`);
    if (줄들 === null) { 막힌덩이 += 1; continue; }
    for (const 줄 of 줄들) 갈래맵.set(줄.p.value.split('/').pop(), 줄.ts.value.split('|'));
  }
  if (막힌덩이) console.log(`   ⚠ 종류를 못 받은 덩이 ${막힌덩이}개 — 그 장소는 갈래가 빈다`);
  const 갈래셈 = new Map();
  for (const ts of 갈래맵.values()) for (const t of ts) 갈래셈.set(t, (갈래셈.get(t) ?? 0) + 1);
  console.log(`   많은 갈래: ${[...갈래셈].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([t, n]) => `${t} ${n}`).join(' · ')}`);

  const 이미 = fs.existsSync(중간길)
    ? new Map(Object.entries(JSON.parse(fs.readFileSync(중간길, 'utf8')))) : new Map();
  if (이미.size) console.log(`   ⭐ 지난번에 잰 ${이미.size}을 이어받는다`);

  console.log('\n⑤ 조회수 — 12개월 · 동남아 넷');
  let 센 = 0;
  const 모은것 = new Map(이미);
  const 적어두기 = () => fs.writeFileSync(중간길, JSON.stringify(Object.fromEntries(모은것)));
  const 줄들 = await 떼로(잴것.map((q) => async () => {
    if (모은것.has(q)) { 센 += 1; return 모은것.get(q); }
    const t = 제목.get(q);
    const views = {};
    for (const p of 동남아) views[p] = t[p] ? await 조회수(p, t[p]) : null;
    센 += 1;
    const perMillion = {};
    for (const p of 동남아) perMillion[p] = views[p] === undefined ? undefined : 백만분율(views[p], 밑[p]);
    const 못잰것있나 = 동남아.some((p) => views[p] === undefined);
    const 줄 = {
      q,
      name: 이름맵.get(q) ?? q,
      kinds: 갈래맵.get(q) ?? [],
      titles: t,
      views,
      perMillion,
      seaEditionsWithArticle: 문서있는판({ views }),
      seaPerMillionTotal: 못잰것있나 ? null
        : +동남아.reduce((a, p) => a + (perMillion[p] ?? 0), 0).toFixed(2),
    };
    모은것.set(q, 줄);
    if (센 % 40 === 0) { 적어두기(); process.stdout.write(`   ${센}/${잴것.length} (적어 뒀다)\n`); }
    return 줄;
  }), 3);
  적어두기();

  const 잰것 = 줄들.filter((x) => x.seaPerMillionTotal !== null);
  const 못잰것 = 줄들.filter((x) => x.seaPerMillionTotal === null);
  잰것.sort((a, b) => b.seaPerMillionTotal - a.seaPerMillionTotal);

  fs.writeFileSync(결과길, `${JSON.stringify({
    generated: new Date().toISOString(),
    source: 'Wikidata (CC0) for places and article links; Wikimedia Pageviews API for reads',
    window: '2025-08 through 2026-07, 12 months, human traffic only',
    comparableWith: 'sea-athletes.json · sea-actors.json · sea-musicians.json — same editions, '
      + 'same window, same unit',
    panel: 'Places in South Korea that carry a Wikidata type we counted as a destination',
    panelCaveat: 'Wikipedia has articles on neighbourhoods, districts, islands, palaces, markets '
      + 'and stations. It does not have articles on individual restaurants and cafes. So this '
      + 'measures which parts of Korea are looked up, not which venues. The venue layer needs the '
      + 'Korea Tourism Organization API, which requires a key.',
    readingIsNotVisiting: 'A read is curiosity, not a trip. It cannot say who came, only who looked. '
      + 'Arrival counts by nationality are published separately by the Korea Tourism Organization '
      + 'and are the right instrument for visits.',
    editionsSea: 동남아,
    editionTotals: 밑,
    /** ⭐ 갈래는 **읽어 온 것**이다. 내가 정한 목록이 아니다 */
    kindsSeen: [...갈래셈].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([kind, n]) => ({ kind, n })),
    howPlacesWereChosen: 'Anything in South Korea with coordinates. We do not pick types by hand — '
      + 'an earlier version listed twelve Wikidata types and returned zero neighbourhoods and zero '
      + 'districts, because Korean administrative units carry their own type items. Types here are '
      + 'read back from the data, not chosen.',
    candidates: 모든q.length,
    withArticle: 잴것.length,
    peopleMeasured: 잰것.length,
    peopleNotMeasured: 못잰것.length,
    queryChunksLost: 막힌덩이,
    people: 잰것,
    couldNotMeasure: 못잰것.map((x) => ({ q: x.q, name: x.name, kinds: x.kinds, titles: x.titles })),
  }, null, 2)}\n`);

  console.log(`\n⭐ ${결과길}`);
  console.log(`   잰 것 ${잰것.length} · 못 잰 것 ${못잰것.length}`);
  console.log('\n🔴 견줄 자리 — 손흥민 342.3 · 고윤정 273.1\n');
  for (const x of 잰것.slice(0, 30)) {
    console.log(`   ${x.name.padEnd(26)} ${String(x.seaPerMillionTotal).padStart(8)}  `
      + `${동남아.map((p) => `${p} ${x.perMillion[p] ?? '—'}`).join(' · ')}  [${x.kinds.join(',')}]`);
  }
}
