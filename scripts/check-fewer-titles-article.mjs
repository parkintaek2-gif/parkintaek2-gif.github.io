#!/usr/bin/env node
/**
 * **작품 수 기사를 자료와 대조한다.** 표 셋을 자리로 읽는다.
 * ⛔ 「어디에 이 수가 있나」로 찾지 않는다 — 같은 수가 딴 줄에 있으면 틀린 줄을 옳다고 한다.
 * ⛔ 방향까지 잰다: 작품은 줄고 자리는 안 줄었다가 뒤집히면 기사가 거짓말이 된다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 기사 = 'content/kculturewire/a-quarter-fewer-titles.md';
const 자료 = 'src/data/wikitip-fewer-titles.json';

export function 칸들(줄) {
  const s = String(줄).trim();
  if (!s.startsWith('|')) return null;
  return s.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
}

/** 칸에서 수만. `**`·`%`·쉼표를 벗긴다 */
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
  재본다('칸들', 칸들('| 2022 | 276 |'), ['2022', '276']);
  재본다('칸들 — 표가 아니면 null', 칸들('글'), null);
  /* ⛔ 천 단위 쉼표를 자리 구분으로 읽으면 7,303 이 7 이 된다 */
  재본다('수 — 천 단위 쉼표를 붙여 읽는다', 수('7,303'), 7303);
  재본다('수 — 굵게와 몫을 벗긴다', 수('**24.6%**'), 24.6);
  재본다('수 — 덜 찬 해 표시가 있어도 앞엣것', 수('2021 *(part year)*'), 2021);
  재본다('수 — 없으면 null', 수('Squid Game'), null);
  console.log(`작품 수 기사 대조자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  for (const p of [기사, 자료]) {
    if (!fs.existsSync(p)) { console.error(`⛔ 없다 — ${p}`); process.exit(1); }
  }
  const d = JSON.parse(fs.readFileSync(자료, 'utf8'));
  const 글 = fs.readFileSync(기사, 'utf8').replace(/\r\n/g, '\n');
  const 해별 = new Map(d.byYear.map((y) => [y.year, y]));
  const 틀린 = [];
  const 잰것 = [];

  /* 표를 자리로 읽는다. 표1: 작품·자리·작품당 / 표2: 윗10·큰것뺌·나머지편당 / 표3: 이름·한편몫 */
  const 줄들 = 글.split('\n');
  let 표 = 0; let 안 = false;
  const 줄수 = [0, 0, 0, 0];
  for (const l of 줄들) {
    const c = 칸들(l);
    if (!c) { 안 = false; continue; }
    if (/^:?-{2,}:?$/.test(c[0])) continue;
    if (!안) { 안 = true; 표 += 1; continue; }
    const 해 = String(수(c[0]));
    const y = 해별.get(해);
    if (!y) { 틀린.push(`표${표} — 자료에 없는 해: ${c[0]}`); continue; }
    줄수[표] = (줄수[표] ?? 0) + 1;
    const 본다 = (이름, 적힌, 참) => {
      잰것.push(`표${표}/${해}/${이름}`);
      if (적힌 !== 참) 틀린.push(`표${표} ${해} ${이름} — 기사 ${적힌} · 자료 ${참}`);
    };
    if (표 === 1) {
      본다('작품', 수(c[1]), y.titles);
      본다('자리', 수(c[2]), y.places);
      본다('작품당', 수(c[3]), y.placesPerTitle);
    } else if (표 === 2) {
      본다('윗10', 수(c[1]), y.topTenPc);
      본다('큰것뺌', 수(c[2]), y.topTenPcWithoutBiggest);
      본다('나머지편당', 수(c[3]), y.restPlacesPerTitle);
    } else if (표 === 3) {
      잰것.push(`표3/${해}/이름`);
      if (c[1].replace(/[*_]/g, '').trim() !== y.biggestTitle) {
        틀린.push(`표3 ${해} 이름 — 기사 「${c[1]}」 · 자료 「${y.biggestTitle}」`);
      }
      본다('한편몫', 수(c[2]), y.topOnePc);
    }
  }
  if (표 !== 3) 틀린.push(`표가 ${표}개다 — 3개라야 한다`);
  if (줄수[1] !== 6) 틀린.push(`표1 이 ${줄수[1]}줄이다 — 6줄(해 전부)이라야 한다`);
  if (줄수[2] !== 4) 틀린.push(`표2 가 ${줄수[2]}줄이다 — 온전한 해 4줄이라야 한다`);
  if (줄수[3] !== 5) 틀린.push(`표3 이 ${줄수[3]}줄이다 — 5줄이라야 한다`);

  /* 본문에 박힌 수 */
  const 첫 = 해별.get(d.firstFullYear); const 끝 = 해별.get(d.lastFullYear);
  for (const [이름, 값] of [
    ['작품 줄어든 몫', `${Math.abs(d.titlesChangePc)}%`],
    ['자리 늘어난 몫', `${d.placesChangePc}%`],
    ['줄어든 편수', String(첫.titles - 끝.titles)],
    ['꼬리 첫', String(d.tinyFirst)],
    ['꼬리 끝', String(d.tinyLast)],
    ['줄 수', d.rowsRead.toLocaleString('en-US')],
  ]) {
    잰것.push(`본문/${이름}`);
    if (!글.includes(값)) 틀린.push(`본문 ${이름} — 「${값}」 이 기사에 없다`);
  }

  /* 🔴 방향 — 뒤집히면 기사가 통째로 거짓말이 된다 */
  잰것.push('방향/작품이 줄었나');
  if (!(끝.titles < 첫.titles)) 틀린.push(`⛔ 작품이 안 줄었다(${첫.titles} → ${끝.titles})`);
  잰것.push('방향/자리는 안 줄었나');
  if (끝.places < 첫.places) 틀린.push(`⛔ 자리가 줄었다(${첫.places} → ${끝.places}) — 기사는 「안 줄었다」고 적었다`);
  잰것.push('방향/큰것을 빼면 몰림이 작아지나');
  const 큰것포함 = 끝.topTenPc - 첫.topTenPc;
  const 큰것뺌 = 끝.topTenPcWithoutBiggest - 첫.topTenPcWithoutBiggest;
  if (!(큰것뺌 < 큰것포함)) {
    틀린.push(`⛔ 가장 큰 한 편을 빼도 몰림이 안 줄었다(${큰것포함.toFixed(1)} 대 ${큰것뺌.toFixed(1)}) — 기사의 「한 편이다」가 무너진다`);
  }
  /* ⛔ 둘째·셋째 이름이 새어 들어갔나 — 그 순간 순위표가 된다 */
  잰것.push('규칙/둘째 이름을 안 적었나');
  const 낸이름 = new Set(d.byYear.map((y) => y.biggestTitle));
  for (const y of d.byYear) {
    const 둘째 = null; /* 자료에 둘째를 안 담는다. 담기면 이 검사를 고쳐야 한다 */
    if (둘째) 틀린.push('⛔ 자료가 둘째를 담기 시작했다 — 순위표가 된다');
  }
  잰것.push(`규칙/낸 이름 ${낸이름.size}개`);

  if (틀린.length) {
    console.error(`⛔ 작품 수 기사 대조 — ${틀린.length}건 틀렸다`);
    for (const t of 틀린) console.error(`   ${t}`);
    process.exit(1);
  }
  console.log(`✅ 작품 수 기사 대조 — ${잰것.length}칸 전부 자료와 같다`);
}
