#!/usr/bin/env node
/**
 * **출처 기사를 자료와 대조한다.** 표 둘을 자리로 읽는다.
 *
 * ⛔ 이 기사의 요점은 **못 가른 둘을 남겼다**는 것이다. 그 표가 사라지면 방법이 실제보다 세 보인다.
 * ⛔ 그리고 **「한국 차트에 없으면 남의 것」이 틀렸다**는 말이 빠지면, 읽는 사람이 그 규칙을 쓴다.
 * ⚠ 자에 수를 손으로 적지 않는다 — 8/10 에 `check-clumping-article` 이 7.7% 를 박아 두었다가
 *   대표 수가 7.6% 로 바뀌자 **맞는 기사를 세웠다.** 전부 자료에서 읽는다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 기사 = 'content/kculturewire/a-title-is-not-a-key.md';
const 지면 = 'src/pages/wikitip/provenance.astro';
const 자료 = 'src/data/wikitip-provenance.json';

export function 칸들(줄) {
  const s = String(줄).trim();
  if (!s.startsWith('|')) return null;
  return s.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
}

/** 칸에서 수만. `**`·`%`·천 단위 쉼표를 벗긴다 */
export function 수(칸) {
  const m = String(칸).replace(/[*_]/g, '').replace(/(\d),(\d)/g, '$1$2').match(/-?\d+(?:\.\d+)?/);
  return m ? +m[0] : null;
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    if (JSON.stringify(실제) === JSON.stringify(바람)) 통 += 1;
    else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  재본다('칸들', 칸들('| Undercover | 48 | 24 |'), ['Undercover', '48', '24']);
  재본다('칸들 — 표가 아니면 null', 칸들('글'), null);
  재본다('수 — 몫', 수('33.3%'), 33.3);
  재본다('수 — 굵게', 수('**48**'), 48);
  재본다('수 — 없으면 null', 수('Netherlands'), null);
  console.log(`출처 기사 대조자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  for (const p of [기사, 지면, 자료]) {
    if (!fs.existsSync(p)) { console.error(`⛔ 없다 — ${p}`); process.exit(1); }
  }
  const d = JSON.parse(fs.readFileSync(자료, 'utf8'));
  const 글 = fs.readFileSync(기사, 'utf8').replace(/\r\n/g, '\n');
  const 한줄 = 글.replace(/\s+/g, ' ');
  const 지면글 = fs.readFileSync(지면, 'utf8');
  const 뺀 = new Map(d.removed.map((x) => [x.title, x]));
  const 못뺀 = new Map(d.couldNotSeparate.map((x) => [x.title, x]));
  const 틀린 = [];
  const 잰것 = [];

  let 표 = 0; let 안 = false;
  const 줄수 = {};
  for (const l of 글.split('\n')) {
    const c = 칸들(l);
    if (!c) { 안 = false; continue; }
    if (/^:?-{2,}:?$/.test(c[0])) continue;
    if (!안) { 안 = true; 표 += 1; continue; }
    줄수[표] = (줄수[표] ?? 0) + 1;
    const 라벨 = c[0].replace(/[*_]/g, '').trim();
    const 본다 = (이름, 적힌, 참) => {
      잰것.push(`표${표}/${라벨}/${이름}`);
      if (적힌 !== 참) 틀린.push(`표${표} ${라벨} ${이름} — 기사 ${적힌} · 자료 ${참}`);
    };
    if (표 === 1) {
      const x = 뺀.get(라벨);
      if (!x) { 틀린.push(`표1 에 뺀 편이 아닌 것: ${라벨}`); continue; }
      본다('자리', 수(c[1]), x.places);
      본다('시장 수', 수(c[2]), x.markets);
      잰것.push(`표1/${라벨}/으뜸시장`);
      if (c[3] !== x.topMarket) 틀린.push(`표1 ${라벨} 으뜸시장 — 기사 ${c[3]} · 자료 ${x.topMarket}`);
      본다('으뜸시장 몫', 수(c[4]), x.topMarketSharePc);
    } else if (표 === 2) {
      const x = 못뺀.get(라벨);
      if (!x) { 틀린.push(`표2 에 못 뺀 편이 아닌 것: ${라벨}`); continue; }
      본다('자리', 수(c[1]), x.places);
      잰것.push(`표2/${라벨}/시장`);
      if (c[2] !== x.topMarket) 틀린.push(`표2 ${라벨} 시장 — 기사 ${c[2]} · 자료 ${x.topMarket}`);
    }
  }
  if (표 !== 2) 틀린.push(`표가 ${표}개다 — 2개라야 한다`);
  /* ⛔ 못 가른 표가 통째로 빠지면 이 기사는 다른 글이 된다 */
  if (줄수[2] !== d.couldNotSeparate.length) {
    틀린.push(`표2 가 ${줄수[2]}줄이다 — 못 가른 ${d.couldNotSeparate.length}편이라야 한다`);
  }

  /* 본문에 박힌 수 — 전부 자료에서 읽는다 */
  for (const [이름, 값] of [
    ['뺀 편수', String(d.removedTitles)],
    ['뺀 자리', String(d.removedPlaces)],
    ['뺀 몫', `${d.removedPlacesPc}%`],
    ['집에 안 뜬 편수', String(d.neverChartedAtHome)],
    ['집에 안 뜬 몫', `${d.neverChartedAtHomePc}%`],
    ['패널', String(d.panelTitles)],
    ['으뜸 편의 자리', String(d.removed[0].places)],
  ]) {
    잰것.push(`본문/${이름}`);
    if (!한줄.includes(값)) 틀린.push(`본문 ${이름} — 「${값}」 이 기사에 없다`);
  }

  /* 🔴 방향 — 이 기사의 뼈대 */
  잰것.push('방향/뺀 편은 한국 차트에 한 자리도 없나');
  const 집에뜬것 = d.removed.filter((x) => x.homePlaces > 0);
  if (집에뜬것.length) 틀린.push(`⛔ 뺀 편 ${집에뜬것.length}편이 한국 차트에 떴다 — 규칙 ①이 깨졌다`);

  /* ⛔ 정직 — 못 가른 것을 밝히고 있나 */
  잰것.push('정직/못 가른 둘을 남겼다고 적었나');
  if (!/could not settle|we would rather carry/i.test(한줄)) {
    틀린.push('⛔ 「못 가른 둘을 남겼다」가 기사에 없다 — 이 방법이 실제보다 세 보인다');
  }
  잰것.push('정직/집 차트 규칙이 틀렸다고 적었나');
  if (!/does not work|never chart in Korea at all/i.test(한줄)) {
    틀린.push('⛔ 「한국 차트에 없으면 남의 것」이 틀렸다는 말이 없다 — 읽는 사람이 그 규칙을 쓴다');
  }
  잰것.push('정직/못 하는 것을 적었나');
  if (!/cannot do|invisible to this test/i.test(한줄)) {
    틀린.push('⛔ 「이 방법이 못 하는 것」이 기사에 없다');
  }

  /* ⚠ 지면도 같은 것을 지키나 — 못 가른 표가 지면에 있어야 한다 */
  잰것.push('지면/못 가른 표가 있나');
  if (!지면글.includes('couldNotSeparate')) {
    틀린.push('⛔ 지면에 못 가른 표가 없다 — 기사에만 적고 지면에서 빼면 같은 말이 아니다');
  }
  잰것.push('지면/수를 손으로 안 적었나');
  if (/\b48\b|\b37,?666\b/.test(지면글.replace(/^[\s\S]*?---\n/, ''))) {
    틀린.push('⛔ 지면에 수가 손으로 적혀 있다 — 자료에서 읽어야 한다');
  }

  if (틀린.length) {
    console.error(`⛔ 출처 기사 대조 — ${틀린.length}건 틀렸다`);
    for (const t of 틀린) console.error(`   ${t}`);
    process.exit(1);
  }
  console.log(`✅ 출처 기사 대조 — ${잰것.length}칸 전부 자료와 같다`);
}
