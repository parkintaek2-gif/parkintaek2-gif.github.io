#!/usr/bin/env node
/**
 * probe-kcw-filming-locations.mjs — **「어디서 찍었나」에 답할 수 있는지 «먼저 재 본다».**
 *
 * ── 🔴 왜 «지면부터» 안 만드나 (2026-08-30 17:2x · 5번) ────
 * 자동완성으로 재니 이것이 오늘 잰 것 가운데 **가장 컸다** —
 * ```
 * where was squid game filmed   자동완성 1번째 · 그 말로 시작 9줄
 * ```
 * 다른 후보들(6줄·4줄)보다 크다. 그런데 **우리에게 촬영지 자료가 없다.**
 *
 * ⛔ 그래서 지면을 먼저 짓지 않는다. **먼저 «있는지»를 재고, 얼마나 덮이는지를 세고,**
 *   그 다음에 지면을 낼지 정한다.
 *   ⚠ 오늘만 두 번, 이미 있는 것을 또 만들 뻔했다(나이대 지면 · BTS 지면).
 *     「만들기 전에 잰다」가 그때마다 나를 살렸다.
 *
 * ── ⛔ 이 자가 지키는 것 ─────────────────────────────────────
 * ⛔ **이름이 겹치면 «버린다».** 같은 제목의 다른 작품을 우리 작품으로 삼지 않는다.
 *   ⚠ 우리는 이미 `wikitip-title-ambiguity.json` 으로 이 위험을 안다.
 *   그래서 **한국 작품(P495 = Q884)** 인 것만 받는다.
 * ⛔ 덮이는 몫이 낮으면 **낮다고 적고 지면을 «안 낸다».** 절반이 빈 표를 내지 않는다.
 * ⛔ 위키데이터를 몰아치지 않는다 — 한 번에 한 뭉치씩, 사이를 둔다.
 *
 * 쓰는 법
 *   node scripts/probe-kcw-filming-locations.mjs --자가시험
 *   node scripts/probe-kcw-filming-locations.mjs --몇 60      먼저 60편만 재 본다
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 표길 = path.join(뿌리, 'src/data/wikitip-title-pages.json');
const 낼길 = path.join(뿌리, 'src/data/kcw-filming-probe.json');

/** 위키데이터에 물을 SPARQL. ⛔ 한국 작품만 받는다 — 이름만 같은 남의 것을 안 받는다 */
export function 물음만들기(제목들) {
  const 값 = 제목들.map((t) => `"${String(t).replace(/["\\]/g, '')}"@en`).join(' ');
  return `SELECT ?item ?itemLabel ?loc ?locLabel WHERE {
  VALUES ?label { ${값} }
  ?item rdfs:label ?label .
  ?item wdt:P495 wd:Q884 .
  OPTIONAL { ?item wdt:P915 ?loc . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}`;
}

/**
 * 돌아온 줄들을 «작품마다» 모은다.
 * ⛔ 한 제목에 항목(Q번호)이 둘 이상이면 **그 제목을 버린다** — 어느 쪽인지 모른다.
 */
export function 모으기(줄들) {
  const 항목 = new Map();
  for (const r of 줄들 ?? []) {
    const 이름 = r?.itemLabel?.value;
    const q = r?.item?.value?.split('/').pop();
    if (!이름 || !q) continue;
    if (!항목.has(이름)) 항목.set(이름, new Map());
    const m = 항목.get(이름);
    if (!m.has(q)) m.set(q, new Set());
    const 곳 = r?.locLabel?.value;
    if (곳) m.get(q).add(곳);
  }
  const 좋은것 = {};
  const 겹친것 = [];
  const 곳없는것 = [];
  for (const [이름, m] of 항목) {
    if (m.size > 1) { 겹친것.push(이름); continue; }   /* ⛔ 이름이 겹친다 — 버린다 */
    const [q, 곳들] = [...m][0];
    if (!곳들.size) { 곳없는것.push(이름); continue; }
    좋은것[이름] = { q, 곳: [...곳들].sort() };
  }
  return { 좋은것, 겹친것, 곳없는것 };
}

/* ── 자가시험 ───────────────────────────────────────────────── */
export function 자가시험() {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  검('한국 작품만 받는 조건이 들어간다', 물음만들기(['A']).includes('wdt:P495 wd:Q884'));
  검('촬영지를 «있으면» 받는다 — 없다고 버리지 않는다',
    물음만들기(['A']).includes('OPTIONAL') && 물음만들기(['A']).includes('wdt:P915'));
  검('⛔ 따옴표를 넣은 제목이 물음을 깨뜨리지 못한다',
    !물음만들기(['A"B']).includes('A"B'));

  const 줄 = [
    { item: { value: 'http://www.wikidata.org/entity/Q1' }, itemLabel: { value: 'A' }, locLabel: { value: 'Seoul' } },
    { item: { value: 'http://www.wikidata.org/entity/Q1' }, itemLabel: { value: 'A' }, locLabel: { value: 'Busan' } },
    { item: { value: 'http://www.wikidata.org/entity/Q2' }, itemLabel: { value: 'B' } },
    { item: { value: 'http://www.wikidata.org/entity/Q3' }, itemLabel: { value: 'C' }, locLabel: { value: 'Jeju' } },
    { item: { value: 'http://www.wikidata.org/entity/Q4' }, itemLabel: { value: 'C' }, locLabel: { value: 'Seoul' } },
  ];
  const r = 모으기(줄);
  검('한 작품의 여러 촬영지를 모은다', r.좋은것.A?.곳.join() === 'Busan,Seoul');
  검('⛔ 촬영지가 없는 것은 «좋은 것»에 안 넣는다', !r.좋은것.B && r.곳없는것.includes('B'));
  검('⛔⛔ 이름이 겹치면 버린다 — 남의 작품을 우리 것으로 안 삼는다',
    !r.좋은것.C && r.겹친것.includes('C'));
  검('⛔ 빈 값에 안 죽는다', 모으기(null).겹친것.length === 0);

  return 실패;
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--자가시험')) {
  const 실패 = 자가시험();
  if (실패.length) {
    console.error(`❌ 자가시험 실패 ${실패.length}\n${실패.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log('✅ 촬영지 재는 자 — 자가시험 8 통과');
  process.exit(0);
}

if (내가실행됐다) {
  const i = process.argv.indexOf('--몇');
  const 몇 = i >= 0 ? Number(process.argv[i + 1]) : 60;
  const 표 = JSON.parse(fs.readFileSync(표길, 'utf8'));
  /* 넓게 간 것부터 잰다 — 손님이 묻는 것이 그쪽이다 */
  const 작품들 = 표.titles.filter((t) => t.hasPage)
    .sort((a, b) => b.markets - a.markets).slice(0, 몇);
  console.log(`■ 넓게 간 ${작품들.length}편으로 «먼저» 재 본다 (전체 아님)`);

  const 뭉치 = 25;
  let 좋은것 = {};
  const 겹친것 = [];
  const 곳없는것 = [];
  let 못물은뭉치 = 0;

  for (let n = 0; n < 작품들.length; n += 뭉치) {
    const 조각 = 작품들.slice(n, n + 뭉치).map((t) => t.title);
    const 주소 = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(물음만들기(조각))}`;
    try {
      const 답 = await fetch(주소, {
        headers: { accept: 'application/sparql-results+json', 'user-agent': 'KCultureWire/1.0 (kculturewire.com)' },
      });
      if (!답.ok) { 못물은뭉치 += 1; console.log(`  ⚠ 뭉치 ${n / 뭉치 + 1} — HTTP ${답.status}, **못 물었다**`); continue; }
      const j = await 답.json();
      const r = 모으기(j?.results?.bindings ?? []);
      좋은것 = { ...좋은것, ...r.좋은것 };
      겹친것.push(...r.겹친것);
      곳없는것.push(...r.곳없는것);
      console.log(`  뭉치 ${n / 뭉치 + 1}: 촬영지 있음 ${Object.keys(r.좋은것).length}`
        + ` · 곳 없음 ${r.곳없는것.length} · 이름 겹침 ${r.겹친것.length}`);
    } catch (e) {
      못물은뭉치 += 1;
      console.log(`  ⚠ 뭉치 ${n / 뭉치 + 1} — ${String(e.message).slice(0, 60)}, **못 물었다**`);
    }
    await new Promise((r) => setTimeout(r, 1200));   /* ⛔ 몰아치지 않는다 */
  }

  const 있음 = Object.keys(좋은것).length;
  const 덮인몫 = Math.round((있음 / 작품들.length) * 100);
  fs.writeFileSync(낼길, `${JSON.stringify({
    잰날: new Date().toISOString(), 잰편수: 작품들.length,
    촬영지있음: 있음, 곳없음: 곳없는것.length, 이름겹침: 겹친것.length, 못물은뭉치,
    덮인몫, 좋은것, 겹친것, 곳없는것,
  }, null, 1)}\n`);

  console.log(`\n■ 잰 ${작품들.length}편 중 — 촬영지 있음 **${있음}편(${덮인몫}%)**`
    + ` · 위키데이터에 곳이 안 적힌 것 ${곳없는것.length} · 이름 겹쳐 버린 것 ${겹친것.length}`
    + `${못물은뭉치 ? ` · ⚠ 못 물은 뭉치 ${못물은뭉치}` : ''}`);
  if (있음) {
    console.log('\n  보기 —');
    for (const [이름, v] of Object.entries(좋은것).slice(0, 6)) {
      console.log(`    ${이름.padEnd(30).slice(0, 30)} ${v.곳.slice(0, 3).join(' · ')}`);
    }
  }
  console.log(덮인몫 >= 40
    ? '\n✅ 덮이는 몫이 쓸 만하다 — 지면을 낼 값이 있다.'
    : '\n⛔ **덮이는 몫이 낮다.** 절반이 빈 표를 내지 않는다 — 지면을 «안 낸다».'
      + '\n   ⭐ 「재 보고 안 된다고 적는 것도 결과다.」');
}
