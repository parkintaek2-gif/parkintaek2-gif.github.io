#!/usr/bin/env node
/**
 * **색인된 12장과 닮은 열 장을 고른다** — 2번 지시(01:2x) 「530장 말고 열 장만 먼저」.
 *
 * ── 왜 열 장인가 ───────────────────────────────────────────────
 *   530장을 다 두껍게 한 뒤에도 색인이 안 되면 **그 일이 통째로 헛것**이 된다.
 *   우리는 아직 구글이 왜 안 넣었는지 모른다 — 얇기로는 설명이 안 됐다(색인된 12장 중
 *   5장이 시장 한 곳짜리다). 열 장이면 **일주일 뒤에 답이 나온다.**
 *
 * ── ⛔ 어떻게 고르나 ───────────────────────────────────────────
 * ⛔ **두꺼운 것부터 고르지 않는다.** 그러면 「두꺼워서 들어갔다」가 저절로 나온다 — 실험이 못 된다.
 * ⭐ 색인된 12장 **하나하나에 가장 닮은 안 된 것**을 붙인다(갈래 같고 · 시장/자리가 가까운 것).
 *    /siblings 에서 쓴 짝짓기와 같은 수다. 닮은 짝이라야 뒤에 「두껍게 한 것만 달라졌다」를 말할 수 있다.
 * ⛔ 한 장을 두 번 고르지 않는다. 이미 색인된 것도 안 고른다(그건 이미 답이 나온 쪽이다).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 자료 = 'src/data/wikitip-title-pages.json';
/* ⛔ src/data 에 안 둔다 — 거기는 **지면이 읽는 공개 자료** 방이다.
   이 파일은 「무엇을 왜 골랐나」라는 **실험 기록**이라 문서 방에 둔다. */
const 낼파일 = 'docs/5번-두껍게-열장.json';

/**
 * 구글 `site:kculturewire.com` 을 끝까지 걸어 눈으로 센 것 (2026-08-09 23:1x KST).
 * ⚠ 이것은 **그날의 것**이다. 다시 세면 바뀔 수 있다. 바뀌면 이 목록을 고친다.
 */
export const 색인된작품 = [
  'stepmom', 'seoul-vibe', 'project-y', 'bad-guys', 'the-way-back', 'one-on-one',
  'the-crowned-clown', 'the-killing-vote', 'the-devil-s-plan',
  'can-this-love-be-translated', 'the-world-of-the-married', 'the-secret-life-of-my-secretary',
];

/** 몇 장을 두껍게 하나. ⛔ 2번 지시가 열 장이다 */
export const 고를수 = 10;

/**
 * 얼마나 닮았나. **작을수록 닮은 것.** 갈래가 다르면 못 붙인다.
 * ⛔ 시장과 자리를 그냥 더하면 자리(수천)가 시장(수십)을 눌러 버린다. **각자의 크기로 나눈다.**
 */
export function 거리(a, b) {
  if (a.type !== b.type) return null;
  const 시장 = Math.abs(a.markets - b.markets) / Math.max(1, a.markets, b.markets);
  const 자리 = Math.abs(a.places - b.places) / Math.max(1, a.places, b.places);
  return +(시장 + 자리).toFixed(4);
}

/**
 * 색인된 것 하나하나에 가장 닮은 **안 된 것**을 붙인다.
 * ⛔ 이미 고른 것은 다시 안 고른다. ⛔ 붙일 짝이 없으면 그 자리는 비운다(억지로 안 채운다).
 */
export function 짝짓기(색인된것들, 후보들, 몇개) {
  const 쓴것 = new Set();
  const 결과 = [];
  for (const 기준 of 색인된것들) {
    let 가장 = null; let 가장거리 = Infinity;
    for (const c of 후보들) {
      if (쓴것.has(c.slug)) continue;
      const d = 거리(기준, c);
      if (d == null || d >= 가장거리) continue;
      가장 = c; 가장거리 = d;
    }
    if (!가장) continue;
    쓴것.add(가장.slug);
    결과.push({ 기준: 기준.slug, 고른것: 가장.slug, 거리: 가장거리 });
    if (결과.length >= 몇개) break;
  }
  return 결과;
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    if (JSON.stringify(실제) === JSON.stringify(바람)) 통 += 1;
    else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  const ㅈ = (slug, type, markets, places) => ({ slug, type, markets, places });
  재본다('같은 것끼리는 거리 0', 거리(ㅈ('a', 'TV', 10, 100), ㅈ('b', 'TV', 10, 100)), 0);
  /* ⛔ 갈래가 다르면 못 붙인다 */
  재본다('갈래가 다르면 null', 거리(ㅈ('a', 'TV', 10, 100), ㅈ('b', 'Films', 10, 100)), null);
  /* ⛔ 자리가 시장을 누르면 안 된다 — 각자의 크기로 나눈다 */
  const 가까움 = 거리(ㅈ('a', 'TV', 10, 100), ㅈ('b', 'TV', 10, 200));
  const 멂 = 거리(ㅈ('a', 'TV', 10, 100), ㅈ('b', 'TV', 90, 100));
  재본다('시장이 많이 다르면 더 멀다', 멂 > 가까움, true);
  const 색 = [ㅈ('x', 'TV', 10, 100), ㅈ('y', 'TV', 50, 900)];
  const 후 = [ㅈ('p', 'TV', 11, 105), ㅈ('q', 'TV', 48, 880), ㅈ('r', 'Films', 10, 100)];
  재본다('닮은 짝을 붙인다', 짝짓기(색, 후, 2).map((x) => x.고른것), ['p', 'q']);
  /* ⛔ 한 장을 두 번 고르지 않는다 */
  재본다('두 번 안 고른다', 짝짓기([ㅈ('x', 'TV', 10, 100), ㅈ('y', 'TV', 10, 100)], [ㅈ('p', 'TV', 10, 100)], 2).length, 1);
  재본다('몇 개에서 멈춘다', 짝짓기(색, 후, 1).length, 1);
  재본다('붙일 짝이 없으면 비운다', 짝짓기([ㅈ('x', 'Films', 1, 1)], [ㅈ('p', 'TV', 1, 1)], 1), []);
  console.log(`열 장 고르기 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  if (!fs.existsSync(자료)) { console.error(`⛔ 없다 — ${자료}`); process.exit(1); }
  const d = JSON.parse(fs.readFileSync(자료, 'utf8'));
  const 지면있는것 = d.titles.filter((t) => t.hasPage);
  const 색인 = new Set(색인된작품);
  const 기준들 = 색인된작품.map((s) => 지면있는것.find((t) => t.slug === s)).filter(Boolean);
  const 없는것 = 색인된작품.filter((s) => !지면있는것.some((t) => t.slug === s));
  if (없는것.length) console.log(`⚠ 자료에 없는 색인 슬러그: ${없는것.join(' · ')}`);
  const 후보 = 지면있는것.filter((t) => !색인.has(t.slug));

  const 짝 = 짝짓기(기준들, 후보, 고를수);
  if (짝.length !== 고를수) throw new Error(`${짝.length}장만 골랐다 — ${고를수}장이라야 한다`);
  const 고른슬러그 = 짝.map((x) => x.고른것);
  if (new Set(고른슬러그).size !== 고른슬러그.length) throw new Error('같은 것을 두 번 골랐다');
  for (const s of 고른슬러그) if (색인.has(s)) throw new Error(`이미 색인된 것을 골랐다: ${s}`);

  const 자세히 = 짝.map((x) => {
    const 기 = 지면있는것.find((t) => t.slug === x.기준);
    const 고 = 지면있는것.find((t) => t.slug === x.고른것);
    return {
      pairedWith: x.기준,
      slug: x.고른것,
      title: 고.title,
      type: 고.type,
      markets: 고.markets,
      places: 고.places,
      weeks: 고.weeks,
      pairedMarkets: 기.markets,
      pairedPlaces: 기.places,
      distance: x.거리,
    };
  });

  const out = {
    generated: new Date().toISOString(),
    why: 'Ten title pages selected to be deepened, so that a week from now we can see whether depth is '
      + 'what decides indexing. Chosen by matching each already-indexed title page to the most similar '
      + 'page that is not indexed — same format, closest market count and place count — rather than by '
      + 'picking the biggest, which would guarantee the answer we were hoping for.',
    indexedAsOf: '2026-08-09',
    indexedCount: 색인된작품.length,
    indexedSlugs: 색인된작품,
    candidateCount: 후보.length,
    picked: 자세히,
    pickedSlugs: 고른슬러그,
  };
  fs.writeFileSync(낼파일, `${JSON.stringify(out, null, 2)}\n`, 'utf8');

  console.log(`후보 ${후보.length}장에서 ${짝.length}장을 골랐다\n`);
  console.log('짝(색인됨)                       고른 것                          갈래   시장  자리   짝의 시장·자리');
  for (const x of 자세히) {
    console.log(`${x.pairedWith.padEnd(32)} ${x.slug.padEnd(32)} ${String(x.type).padEnd(6)} ${String(x.markets).padStart(4)} ${String(x.places).padStart(5)}   ${x.pairedMarkets}·${x.pairedPlaces}`);
  }
  console.log(`\n→ ${낼파일}`);
}
