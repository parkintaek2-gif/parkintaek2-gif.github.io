#!/usr/bin/env node
/**
 * **가수를 채운다.** — 사장님 지적(8/13) 「가수는 순위에 없는 건 아닐텐데」.
 *
 * 🔴 맞는 지적이었다. 82편의 배우 명단은 **넷플릭스 차트 작품 출연진**이라
 *   드라마에 안 나온 가수가 통째로 빠졌다. 아이유·지수·차은우가 든 것은 **배우 겸업**이라서다.
 *   ⛔ 그 상태로 「연예인」이라 부른 것이 잘못이었다. 가수를 따로 모아 다시 견준다.
 *
 * ── 어떻게 — 두 걸음으로 나눈다 ────────────────────────────────
 *   ① Q번호만 받는다(가볍다). 문서고리를 같이 달라 하면 응답이 커져 **네 번 죽었다**.
 *   ② Q번호를 **주고** 문서 제목을 받는다. 이 방향은 통했다(배우 1,355명 전부 받았다).
 *
 * 🔴 선수·배우와 **같은 자**를 쓴다 — 같은 언어판 넷, 같은 12개월, 같은 백만분율.
 */
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';
import { 동남아, 백만분율, 합치기, 문서있는판 } from './collect-sea-athletes.mjs';
import { 지금 } from './_kst.mjs';

const 결과길 = 'archive/raw/wikipedia/sea-musicians.json';
const 중간길 = 'archive/raw/wikipedia/sea-musicians.partial.json';
const UA = 'KCultureWire/1.0 (https://www.kculturewire.com) node';
const 처음 = '20250801';
const 끝 = '20260731';
const 하드시한 = 60000;

/** 갈래 — 노래하는 쪽. ⚠ 배우(Q33999)는 안 넣는다. 그쪽은 이미 잰 자료가 있다 */
export const 갈래 = [
  { key: 'singer', label: 'Singer', q: 'Q177220' },
  { key: 'rapper', label: 'Rapper', q: 'Q2252262' },
  { key: 'idol', label: 'Idol', q: 'Q108163588' },
  { key: 'songwriter', label: 'Songwriter', q: 'Q753110' },
];

/** ⭐ 사람만이 아니라 **무리**도 잰다. BTS·블랙핑크는 사람이 아니라 그룹이다 */
export const 무리갈래 = [
  { key: 'band', label: 'Band', q: 'Q215380' },
  { key: 'girlgroup', label: 'Girl group', q: 'Q4187955' },
  { key: 'boyband', label: 'Boy band', q: 'Q5741069' },
];

export const 쪽크기 = 500;
export const 덩이 = 120;

/**
 * 🔴 8/13 — **Wikidata 이름표는 훼손될 수 있다.**
 *   TXT(Tomorrow X Together)가 영문 이름표에 「Tacos de asada y cebollin」으로 적혀 있었다.
 *   문서고리는 멀쩡했다. 그러니 **이름은 문서 제목에서 가져온다.**
 *   ⛔ 이름표를 버리지는 않는다 — 자료에 같이 남겨 무엇이 어긋났는지 볼 수 있게 한다.
 * ⚠ 문서 제목도 언어판마다 다르다. 로마자 판(id·ms·vi)을 먼저 보고 없으면 이름표를 쓴다.
 */
export function 이름고르기(이름표, 제목들) {
  let 제목이름 = null;
  for (const p of ['id', 'ms', 'vi']) {
    const t = 제목들?.[p];
    if (t && /^[\x20-\x7E]+$/.test(t)) {
      제목이름 = t.replace(/_/g, ' ').replace(/\s*\([^)]*\)$/, '');
      break;
    }
  }
  if (!제목이름) return 이름표 ?? null;
  /**
   * ⭐ 8/14 — 제목만 쓰면 **대문자가 깎인다**(EXO→Exo, KARD→Kard).
   *   이름표와 제목이 **같은 말이면** 이름표를 쓴다 — 거기에 대문자가 살아 있다.
   *   글자가 아주 다르면 이름표가 훼손된 것이니 제목을 쓴다(TXT 가 그랬다).
   */
  const 다듬 = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (이름표 && 다듬(이름표) === 다듬(제목이름)) return 이름표;
  return 제목이름;
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    if (JSON.stringify(실제) === JSON.stringify(바람)) 통 += 1;
    else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  재본다('🔴 선수·배우와 같은 언어판', 동남아, ['id', 'vi', 'th', 'ms']);
  재본다('🔴 같은 백만분율 셈', 백만분율(5086, 50430364), 100.85);
  재본다('⛔ 배우는 안 넣는다 — 그쪽은 이미 쟀다', 갈래.some((g) => g.q === 'Q33999'), false);
  재본다('가수가 들어 있다', 갈래.some((g) => g.key === 'singer'), true);
  재본다('⭐ 무리도 잰다 — BTS 는 사람이 아니다', 무리갈래.length, 3);
  재본다('덩이가 너무 크지 않다', 덩이 <= 200, true);
  재본다('못 잰 것은 0 이 아니다', 백만분율(null, 1000), null);
  /* 🔴 8/13 — Wikidata 이름표가 훼손돼 TXT 가 「Tacos de asada y cebollin」이었다 */
  재본다('이름고르기 — 훼손된 이름표 대신 문서 제목을 쓴다',
    이름고르기('Tacos de asada y cebollin', { id: 'Tomorrow_X_Together', th: 'ทีบายที' }),
    'Tomorrow X Together');
  재본다('이름고르기 — 로마자 제목이 없으면 이름표를 쓴다',
    이름고르기('BTS', { th: 'บีทีเอส' }), 'BTS');
  재본다('이름고르기 — 괄호 꼬리를 뗀다',
    이름고르기('X', { id: 'Rain_(penyanyi)' }), 'Rain');
  /* ⭐ 8/14 — 제목만 쓰면 대문자가 깎인다. 같은 말이면 이름표를 쓴다 */
  재본다('이름고르기 — 같은 말이면 이름표의 대문자를 살린다',
    이름고르기('EXO', { id: 'Exo' }), 'EXO');
  재본다('이름고르기 — 괄호가 있어도 같은 말이면 이름표',
    이름고르기('KARD', { id: 'Kard_(grup_musik)' }), 'KARD');
  재본다('⛔ 그래도 아주 다르면 제목을 쓴다 — 이름표가 훼손된 것이다',
    이름고르기('Tacos de asada y cebollin', { id: 'Tomorrow_X_Together' }), 'Tomorrow X Together');
  재본다('이름고르기 — 둘 다 없으면 null', 이름고르기(null, {}), null);
  console.log(`가수 수집기 — 자가시험 ${통} 통과 · ${실} 실패`);
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
  console.log('① 언어판 밑값 — 🔴 선수·배우와 같은 창\n');
  const 밑 = {};
  for (const p of 동남아) {
    밑[p] = await 밑값(p);
    console.log(`   ${p.padEnd(3)} ${밑[p] ? 밑[p].toLocaleString('en-US') : '⛔ 못 쟀다'}`);
  }

  /* ① Q번호만 받는다 — 문서고리를 같이 달라 하면 응답이 커져 죽는다 */
  console.log('\n② Q번호만 받는다 (가볍다)');
  const 갈래맵 = new Map();
  const 이름맵 = new Map();
  for (const g of [...갈래, ...무리갈래]) {
    const 사람인가 = 갈래.includes(g);
    let 받은 = 0;
    for (let 쪽 = 0; 쪽 < 30; 쪽 += 1) {
      /* 사람은 국적(P27)으로, 무리는 어디서 났나(P495)로 고른다 — 무리에는 국적이 없다 */
      const 몸 = 사람인가
        ? `?p wdt:P31 wd:Q5 ; wdt:P27 wd:Q884 ; wdt:P106 wd:${g.q} .`
        : `?p wdt:P31 wd:${g.q} ; wdt:P495 wd:Q884 .`;
      const 줄들 = await 스파클(`SELECT ?p ?pLabel WHERE {
        ${몸}
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
      } ORDER BY ?p LIMIT ${쪽크기} OFFSET ${쪽 * 쪽크기}`);
      if (줄들 === null) break;
      for (const 줄 of 줄들) {
        const q = 줄.p.value.split('/').pop();
        if (!갈래맵.has(q)) 갈래맵.set(q, []);
        if (!갈래맵.get(q).includes(g.key)) 갈래맵.get(q).push(g.key);
        if (줄.pLabel?.value) 이름맵.set(q, 줄.pLabel.value);
      }
      받은 += 줄들.length;
      if (줄들.length < 쪽크기) break;
    }
    console.log(`   ${g.label.padEnd(12)} ${받은}`);
  }
  const 모든q = [...갈래맵.keys()];
  console.log(`   → 모두 ${모든q.length}`);

  /* ② Q번호를 **주고** 문서 제목을 받는다 — 이 방향은 가볍다 */
  console.log('\n③ Q번호를 주고 문서 제목을 받는다');
  const 제목 = new Map();
  let 막힌덩이 = 0;
  for (let i = 0; i < 모든q.length; i += 덩이) {
    const 이번 = 모든q.slice(i, i + 덩이);
    const 고리 = 동남아.map((p) => `
    OPTIONAL { ?a_${p} schema:about ?p ; schema:isPartOf <https://${p}.wikipedia.org/> . }`).join('');
    const 줄들 = await 스파클(`SELECT ?p ${동남아.map((p) => `?a_${p}`).join(' ')} WHERE {
      VALUES ?p { ${이번.map((q) => `wd:${q}`).join(' ')} }${고리}
    }`);
    if (줄들 === null) { 막힌덩이 += 1; continue; }
    for (const 줄 of 줄들) {
      const q = 줄.p.value.split('/').pop();
      if (!제목.has(q)) 제목.set(q, {});
      for (const p of 동남아) {
        const url = 줄[`a_${p}`]?.value;
        if (!url) continue;
        const 앞 = `https://${p}.wikipedia.org/wiki/`;
        if (url.startsWith(앞)) 제목.get(q)[p] = decodeURIComponent(url.slice(앞.length));
      }
    }
    if ((i / 덩이) % 5 === 0) process.stdout.write(`   ${Math.min(i + 덩이, 모든q.length)}/${모든q.length}\n`);
  }
  if (막힌덩이) console.log(`   ⚠ 못 받은 덩이 ${막힌덩이}개 — 그 사람들은 「문서 없음」이 아니라 **모른다**`);

  const 잴것 = 모든q.filter((q) => 동남아.some((p) => 제목.get(q)?.[p]));
  console.log(`\n④ ${모든q.length} 중 동남아 판에 문서가 있는 **${잴것.length}**`);

  const 이미 = fs.existsSync(중간길)
    ? new Map(Object.entries(JSON.parse(fs.readFileSync(중간길, 'utf8')))) : new Map();
  if (이미.size) console.log(`   ⭐ 지난번에 잰 ${이미.size}을 이어받는다`);

  console.log('\n⑤ 조회수 — 12개월 · 동남아 넷');
  let 센 = 0;
  const 모은것 = new Map(이미);
  const 적어두기 = () => fs.writeFileSync(중간길, JSON.stringify(Object.fromEntries(모은것)));
  const 줄들 = await 떼로(잴것.map((q) => async () => {
    if (모은것.has(q)) {
      센 += 1;
      /* ⚠ 이어받은 줄도 **이름은 다시 고른다.** 이름 고르는 법이 8/13 에 바뀌었다 */
      const 옛 = 모은것.get(q);
      const 새이름 = 이름고르기(옛.wikidataLabel ?? 이름맵.get(q), 옛.titles ?? 제목.get(q));
      if (새이름 && 새이름 !== 옛.name) {
        옛.wikidataLabel = 옛.wikidataLabel ?? 옛.name;
        옛.name = 새이름;
        모은것.set(q, 옛);
      }
      return 옛;
    }
    const t = 제목.get(q);
    const views = {};
    for (const p of 동남아) views[p] = t[p] ? await 조회수(p, t[p]) : null;
    센 += 1;
    const perMillion = {};
    for (const p of 동남아) perMillion[p] = views[p] === undefined ? undefined : 백만분율(views[p], 밑[p]);
    const 못잰것있나 = 동남아.some((p) => views[p] === undefined);
    const 갈래들 = 갈래맵.get(q) ?? [];
    const 줄 = {
      q,
      name: 이름고르기(이름맵.get(q), t),
      wikidataLabel: 이름맵.get(q) ?? null,
      kinds: 갈래들,
      isGroup: 갈래들.some((k) => 무리갈래.some((g) => g.key === k)),
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
    generated: 지금(),
    source: 'Wikidata (CC0) for article links; Wikimedia Pageviews API for reads',
    window: '2025-08 through 2026-07, 12 months, human traffic only',
    comparableWith: 'sea-athletes.json and sea-actors.json — same editions, same window, same unit',
    panel: 'Korean singers, rappers, idols and songwriters, plus Korean bands and groups',
    whyGroupsToo: 'A group is not a person and Wikipedia gives it its own article. Leaving groups '
      + 'out would drop the acts most people name first, so they are counted and flagged.',
    editionsSea: 동남아,
    editionTotals: 밑,
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
  console.log('\n🔴 견줄 자리 — 손흥민 342.3 · 고윤정 273.1 · 김상식 137.8\n');
  for (const x of 잰것.slice(0, 30)) {
    console.log(`   ${x.name.padEnd(24)} ${String(x.seaPerMillionTotal).padStart(8)}  `
      + `${동남아.map((p) => `${p} ${x.perMillion[p] ?? '—'}`).join(' · ')}`
      + `  ${x.isGroup ? '[무리]' : ''}`);
  }
}
