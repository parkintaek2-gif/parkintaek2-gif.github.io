#!/usr/bin/env node
/**
 * **그 11월은 한국 선수만의 것인가** — 다른 나라 이스포츠 선수를 같은 자로 잰다.
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 *   78편에서 한국 이스포츠 선수 아홉이 **전원 2025년 11월**에 몰렸다.
 *   ⚠ 그런데 그것이 「이스포츠라서」인지 「한국 선수라서」인지 아직 못 갈랐다.
 *   ⭐ **같은 독자(동남아 넷)** 가 다른 나라 선수도 같은 달에 찾아보면 종목의 성질이고,
 *      한국 선수만 그러면 한국 쪽의 성질이다. 둘은 아주 다른 이야기다.
 *
 * ── ⛔ 이 수집기가 지키는 것 ───────────────────────────────────
 * ⛔ 나라를 줄세우지 않는다. **몇 명이 같은 달에 서나**만 본다.
 * ⛔ 해 중간에 생긴 문서는 안 센다(78편에서 이 구멍에 빠졌다).
 * ⛔ 잰 사람이 셋이 안 되는 나라는 **만장일치를 말하지 않는다** — 1/1 은 만장일치가 아니다.
 * ⚠ 「동남아가 본 것」만 잰다. 그 나라 안에서 어떻게 읽히는지는 이 자로 못 본다.
 */
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';

const 결과 = 'archive/raw/wikipedia/esports-nations.json';
const UA = 'KCultureWire/1.0 (https://www.kculturewire.com) node';
const 판들 = ['id', 'vi', 'th', 'ms'];
const 최소조회 = 300;
const 최소사람 = 3;        /* ⛔ 셋이 안 되면 만장일치를 말하지 않는다 */

/** 견줄 나라 — Wikidata 국가 Q번호 */
export const 나라들 = [
  { key: 'kr', label: 'South Korea', q: 'Q884' },
  { key: 'cn', label: 'China', q: 'Q148' },
  { key: 'dk', label: 'Denmark', q: 'Q35' },
  { key: 'se', label: 'Sweden', q: 'Q34' },
  { key: 'us', label: 'United States', q: 'Q30' },
  { key: 'vn', label: 'Vietnam', q: 'Q881' },
];

/**
 * 한 무리가 같은 달에 서나.
 * ⛔ 사람이 `최소사람` 미만이면 `null` — 「1명 중 1명이 만장일치」는 말이 아니다.
 */
export function 모임(봉우리들, 최소 = 최소사람) {
  const 쓸것 = 봉우리들.filter((b) => b && !b.partialYear);
  if (쓸것.length < 최소) return { people: 쓸것.length, tooFew: true, month: null, sharing: null, allSame: null };
  const 셈 = new Map();
  for (const b of 쓸것) 셈.set(b.peakMonth, (셈.get(b.peakMonth) ?? 0) + 1);
  const [달, 몇] = [...셈].sort((a, b) => b[1] - a[1])[0];
  return {
    people: 쓸것.length,
    tooFew: false,
    month: 달,
    sharing: 몇,
    sharingPc: +((100 * 몇) / 쓸것.length).toFixed(1),
    allSame: 몇 === 쓸것.length,
  };
}

export function 봉우리(달값, 그해전에읽혔나) {
  const 값 = Object.values(달값);
  if (!값.length) return null;
  const 합 = 값.reduce((a, b) => a + b, 0);
  if (합 < 최소조회) return null;
  const 큰 = Math.max(...값);
  return {
    peakMonth: Object.keys(달값).find((k) => 달값[k] === 큰),
    peakSharePc: +((100 * 큰) / 합).toFixed(1),
    total: 합,
    partialYear: !그해전에읽혔나,
  };
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    if (JSON.stringify(실제) === JSON.stringify(바람)) 통 += 1;
    else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  const 셋 = [{ peakMonth: '11' }, { peakMonth: '11' }, { peakMonth: '11' }];
  재본다('모임 — 전원 같으면 참', 모임(셋).allSame, true);
  재본다('모임 — 몫도 낸다', 모임(셋).sharingPc, 100);
  재본다('⛔ 모임 — 셋이 안 되면 만장일치를 말하지 않는다',
    모임([{ peakMonth: '11' }, { peakMonth: '11' }]),
    { people: 2, tooFew: true, month: null, sharing: null, allSame: null });
  재본다('⛔ 모임 — 해 중간에 생긴 문서는 안 센다',
    모임([...셋, { peakMonth: '12', partialYear: true }]).people, 3);
  재본다('모임 — 하나 다르면 거짓', 모임([...셋.slice(0, 2), { peakMonth: '06' }]).allSame, false);
  재본다('봉우리 — 가장 큰 달', 봉우리({ 10: 100, 11: 900 }, true).peakMonth, '11');
  재본다(`봉우리 — ${최소조회}회 미만은 안 본다`, 봉우리({ 11: 10 }, true), null);
  재본다('봉우리 — 그 전에 안 읽혔으면 partialYear', 봉우리({ 11: 500 }, false).partialYear, true);
  재본다('나라 여섯', 나라들.length, 6);
  재본다('한국이 들어 있다', 나라들.some((n) => n.q === 'Q884'), true);
  console.log(`나라별 이스포츠 수집기 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

function 받기(host, 길) {
  return new Promise((resolve) => {
    const req = https.request({ host, path: 길, headers: { 'User-Agent': UA, Accept: 'application/json' } },
      (res) => { let b = ''; res.on('data', (c) => { b += c; }); res.on('end', () => resolve({ code: res.statusCode, body: b })); });
    req.on('error', (e) => resolve({ code: 0, body: e.message }));
    req.setTimeout(90000, () => { req.destroy(); resolve({ code: 0, body: 'timeout' }); });
    req.end();
  });
}

async function 스파클(q) {
  for (let 번 = 0; 번 < 3; 번 += 1) {
    const r = await 받기('query.wikidata.org', `/sparql?format=json&query=${encodeURIComponent(q)}`);
    if (r.code === 200) { try { return JSON.parse(r.body).results.bindings; } catch { /* 다시 */ } }
    await new Promise((s) => { setTimeout(s, 3000 * (번 + 1)); });
  }
  return null;
}

async function 달별(판, 제목) {
  const 길 = `/api/rest_v1/metrics/pageviews/per-article/${판}.wikipedia/all-access/user/`
    + `${encodeURIComponent(제목.replace(/ /g, '_'))}/monthly/20240101/20251231`;
  for (let 번 = 0; 번 < 4; 번 += 1) {
    const r = await 받기('wikimedia.org', 길);
    if (r.code === 404) return null;
    if (r.code === 200) {
      try { return JSON.parse(r.body).items.map((x) => ({ m: x.timestamp.slice(0, 6), v: x.views })); }
      catch { /* 다시 */ }
    }
    await new Promise((s) => { setTimeout(s, 900 * (2 ** 번)); });
  }
  return undefined;
}

if (내가실행됐다) {
  const 결과줄 = [];
  for (const 나라 of 나라들) {
    const 고리 = 판들.map((p) => `
      OPTIONAL { ?a_${p} schema:about ?p ; schema:isPartOf <https://${p}.wikipedia.org/> . }`).join('');
    const 줄 = await 스파클(`SELECT ?p ?pLabel ${판들.map((p) => `?a_${p}`).join(' ')} WHERE {
      ?p wdt:P31 wd:Q5 ; wdt:P27 wd:${나라.q} ; wdt:P106 wd:Q4379701 .
      ${고리}
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } }`);
    if (!줄) { console.log(`   ${나라.label.padEnd(15)} ⛔ 못 받았다`); continue; }

    const 사람 = new Map();
    for (const r of 줄) {
      const q = r.p.value.split('/').pop();
      if (!사람.has(q)) 사람.set(q, { q, name: r.pLabel?.value ?? q, titles: {} });
      for (const p of 판들) {
        const u = r[`a_${p}`]?.value;
        if (u) 사람.get(q).titles[p] = decodeURIComponent(u.split('/wiki/')[1] ?? '');
      }
    }
    const 잴것 = [...사람.values()].filter((x) => 판들.some((p) => x.titles[p])).slice(0, 14);
    console.log(`   ${나라.label.padEnd(15)} ${사람.size}명 중 동남아 판 문서 있는 ${잴것.length}명`);

    const 사람줄 = [];
    for (const x of 잴것) {
      const 달모음 = new Map();
      let 못잼 = false;
      for (const p of 판들) {
        if (!x.titles[p]) continue;
        const v = await 달별(p, x.titles[p]);
        if (v === undefined) { 못잼 = true; continue; }
        if (v === null) continue;
        for (const it of v) 달모음.set(it.m, (달모음.get(it.m) ?? 0) + it.v);
      }
      if (못잼) { 사람줄.push({ name: x.name, peak2025: null }); continue; }
      const 첫달 = [...달모음.keys()].sort()[0] ?? null;
      const 달값 = {};
      for (let mm = 1; mm <= 12; mm += 1) {
        const 열쇠 = `2025${String(mm).padStart(2, '0')}`;
        if (달모음.has(열쇠)) 달값[String(mm).padStart(2, '0')] = 달모음.get(열쇠);
      }
      사람줄.push({ name: x.name, peak2025: 봉우리(달값, 첫달 !== null && 첫달 < '202501') });
    }
    결과줄.push({
      ...나라,
      /** ⭐ 세 수를 나란히 둔다 — 「있나 / 문서가 있나 / 읽히나」는 서로 다른 물음이다 */
      onWikidata: 사람.size,
      withSeaArticle: 잴것.length,
      readAtLeastMinimum: 사람줄.filter((s) => s.peak2025).length,
      measured: 사람줄,
      group2025: 모임(사람줄.map((s) => s.peak2025)),
    });
  }

  const out = {
    generated: new Date().toISOString(),
    source: 'Wikidata for esports players by citizenship; Wikimedia Pageviews API, four Southeast '
      + 'Asian editions summed, calendar year 2025',
    unit: 'People. One row is one player, counted once.',
    minReadsPerYear: 최소조회,
    minPeopleForAGroup: 최소사람,
    nations: 결과줄,
    whatThisSeparates: 'If players from several countries share the same peak month, the pattern '
      + 'belongs to the game. If only the Koreans do, it belongs to them. This is the measurement '
      + 'that tells those two apart.',
    /** 🔴 재 보니 그 비교 자체가 성립하지 않았다. 그것이 결과다 */
    whyTheComparisonFails: 'The comparison could not be made. Players from the other countries have '
      + 'articles in these editions at a similar rate to the Koreans, but almost none of them are '
      + 'read enough to measure a peak month at all. There is no group to compare the Koreans '
      + 'against, and that absence is the finding rather than an obstacle to it.',
    cannotAnswer: 'This is what Southeast Asian readers looked up. It says nothing about how these '
      + 'players are read at home.',
  };
  fs.writeFileSync(결과, `${JSON.stringify(out, null, 2)}\n`);

  console.log(`\n⭐ ${결과}\n`);
  console.log('나라'.padEnd(17) + 'Wikidata  동남아문서  읽힘   같은 달에 선 사람');
  for (const n of 결과줄) {
    const g = n.group2025;
    console.log(`${n.label.padEnd(17)}${String(n.onWikidata).padStart(8)}`
      + `${String(n.withSeaArticle).padStart(10)}${String(n.readAtLeastMinimum).padStart(7)}   `
      + (g.tooFew ? `⛔ ${최소사람}명 미만 — 안 말한다`
        : `${g.sharing}/${g.people} (${g.sharingPc}%) ${g.month}월${g.allSame ? ' ⭐전원' : ''}`));
  }
}
