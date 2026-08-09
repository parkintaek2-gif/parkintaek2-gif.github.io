#!/usr/bin/env node
/**
 * **구간 길이 기사를 자료와 대조한다.** 표 셋을 자리로 읽는다.
 * ⛔ 방향까지 잰다 — 「한국 영화는 남과 같고 한국 시리즈만 길다」가 뒤집히면 기사가 거짓말이 된다.
 * ⛔ 「가장 큰 작품을 빼도 남는다」가 무너지면 그것도 잡는다. 그게 이 기사의 버팀목이다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 기사 = 'content/kculturewire/korean-films-leave-like-everyone-else.md';
const 자료 = 'src/data/wikitip-run-length.json';

/** 기사에 쓴 이름 → 자료의 무리 이름 */
export const 이름표 = new Map([
  ['Korean films', '한국 영화'],
  ['Every other film', '그 밖 영화'],
  ['Korean series', '한국 시리즈'],
  ['Every other series', '그 밖 시리즈'],
]);

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
  재본다('칸들', 칸들('| Korean films | 3,853 |'), ['Korean films', '3,853']);
  재본다('칸들 — 표가 아니면 null', 칸들('글'), null);
  /* ⛔ 천 단위 쉼표를 자리 구분으로 읽으면 3,853 이 3 이 된다 */
  재본다('수 — 천 단위 쉼표', 수('117,293'), 117293);
  재본다('수 — 굵게와 몫', 수('**38.5%**'), 38.5);
  재본다('수 — 없으면 null', 수('Korean films'), null);
  재본다('이름표가 넷', 이름표.size, 4);
  console.log(`구간 길이 기사 대조자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  for (const p of [기사, 자료]) {
    if (!fs.existsSync(p)) { console.error(`⛔ 없다 — ${p}`); process.exit(1); }
  }
  const d = JSON.parse(fs.readFileSync(자료, 'utf8'));
  const 글 = fs.readFileSync(기사, 'utf8').replace(/\r\n/g, '\n');
  const 무리 = new Map(d.byGroup.map((g) => [g.group, g]));
  const 틀린 = [];
  const 잰것 = [];

  const 줄들 = 글.split('\n');
  let 표 = 0; let 안 = false;
  const 줄수 = {};
  for (const l of 줄들) {
    const c = 칸들(l);
    if (!c) { 안 = false; continue; }
    if (/^:?-{2,}:?$/.test(c[0])) continue;
    if (!안) { 안 = true; 표 += 1; continue; }
    줄수[표] = (줄수[표] ?? 0) + 1;
    const 라벨 = c[0].replace(/[*_]/g, '').trim();
    const g = 무리.get(이름표.get(라벨));
    const 본다 = (이름, 적힌, 참) => {
      잰것.push(`표${표}/${라벨}/${이름}`);
      if (적힌 !== 참) 틀린.push(`표${표} ${라벨} ${이름} — 기사 ${적힌} · 자료 ${참}`);
    };
    if (표 === 1) {
      if (!g) { 틀린.push(`표1 에 모르는 이름: ${라벨}`); continue; }
      본다('구간', 수(c[1]), g.runs);
      본다('가운데', 수(c[2]), g.medianWeeks);
      본다('평균', 수(c[3]), g.meanWeeks);
      본다('한 주짜리', 수(c[4]), g.oneWeekPc);
      본다('4주 이상', 수(c[5]), g.fourPlusPc);
    } else if (표 === 2) {
      /* 갈래 차이 표 — 이름이 다르다 */
      const 참 = 라벨 === 'Korean titles' ? d.formatGapKorean
        : 라벨 === 'Every other title' ? d.formatGapOthers
          : 라벨 === 'Difference' ? d.formatGapDifference : undefined;
      잰것.push(`표2/${라벨}`);
      if (참 === undefined) 틀린.push(`표2 에 모르는 이름: ${라벨}`);
      else if (수(c[1]) !== 참) 틀린.push(`표2 ${라벨} — 기사 ${수(c[1])} · 자료 ${참}`);
    } else if (표 === 3) {
      if (!g) { 틀린.push(`표3 에 모르는 이름: ${라벨}`); continue; }
      본다('평균', 수(c[1]), g.meanWeeks);
      본다('큰것뺀 평균', 수(c[2]), g.meanWeeksWithoutBiggest);
      본다('4주 이상', 수(c[3]), g.fourPlusPc);
      본다('큰것뺀 4주 이상', 수(c[4]), g.fourPlusPcWithoutBiggest);
    }
  }
  if (표 !== 3) 틀린.push(`표가 ${표}개다 — 3개라야 한다`);
  if (줄수[1] !== 4) 틀린.push(`표1 이 ${줄수[1]}줄이다 — 4줄이라야 한다`);
  if (줄수[2] !== 3) 틀린.push(`표2 가 ${줄수[2]}줄이다 — 3줄이라야 한다`);
  if (줄수[3] !== 4) 틀린.push(`표3 이 ${줄수[3]}줄이다 — 4줄이라야 한다`);

  /* 본문에 박힌 수 */
  const 한시 = 무리.get('한국 시리즈'); const 밖시 = 무리.get('그 밖 시리즈');
  const 한영 = 무리.get('한국 영화');
  const 총구간 = d.byGroup.reduce((s, g) => s + g.runs, 0);
  const 총잘림 = d.byGroup.reduce((s, g) => s + g.truncated, 0);
  for (const [이름, 값] of [
    ['총 구간', 총구간.toLocaleString('en-US')],
    ['잘린 것', 총잘림.toLocaleString('en-US')],
    ['한국 시리즈 나갈 때 아래셋', `${한시.exitBottomThreePc}%`],
    ['그 밖 시리즈 나갈 때 아래셋', `${밖시.exitBottomThreePc}%`],
    ['한국 영화 나갈 때 아래셋', `${한영.exitBottomThreePc}%`],
    ['한국 시리즈 앉은 아래셋', `${한시.weeksBottomThreePc}%`],
    ['그 밖 시리즈 앉은 아래셋', `${밖시.weeksBottomThreePc}%`],
  ]) {
    잰것.push(`본문/${이름}`);
    if (!글.includes(값)) 틀린.push(`본문 ${이름} — 「${값}」 이 기사에 없다`);
  }

  /* 🔴 방향 — 이게 뒤집히면 기사가 통째로 거짓말이 된다 */
  const 밖영 = 무리.get('그 밖 영화');
  잰것.push('방향/한국 영화가 남의 영화와 비슷한가');
  if (Math.abs(한영.meanWeeks - 밖영.meanWeeks) > 0.3) {
    틀린.push(`⛔ 한국 영화(${한영.meanWeeks})와 그 밖 영화(${밖영.meanWeeks})가 벌어졌다 — 기사는 「같다」고 적었다`);
  }
  잰것.push('방향/한국 시리즈가 더 긴가');
  if (!(한시.meanWeeks > 밖시.meanWeeks)) {
    틀린.push(`⛔ 한국 시리즈(${한시.meanWeeks})가 그 밖(${밖시.meanWeeks})보다 안 길다`);
  }
  /* ⛔ 이 기사의 버팀목 — 큰 것을 빼도 남아야 한다 */
  잰것.push('버팀목/큰 것을 빼도 남나');
  if (!(한시.meanWeeksWithoutBiggest > 밖시.meanWeeksWithoutBiggest)) {
    틀린.push('⛔ 가장 큰 작품을 빼니 한국 시리즈 우위가 사라졌다 — 기사의 버팀목이 무너진다');
  }
  잰것.push('버팀목/4주 이상도 남나');
  if (!(한시.fourPlusPcWithoutBiggest > 밖시.fourPlusPcWithoutBiggest)) {
    틀린.push('⛔ 큰 것을 빼니 4주 이상 우위가 사라졌다');
  }
  /* ⛔ 갈래 차이를 뺀 나머지가 0 이하면 「한국 몫」이 없다 */
  잰것.push('방향/갈래 차이를 뺀 나머지가 남나');
  if (!(d.formatGapDifference > 0)) {
    틀린.push(`⛔ 갈래 차이를 빼니 남는 것이 ${d.formatGapDifference} 다 — 「한국 몫」이 없다`);
  }
  /* ⛔ 줄을 잃고 있으면 표 전체가 못 쓴다 */
  잰것.push('읽기/줄을 잃고 있나');
  if (d.rowsOverwritten > 50) 틀린.push(`⛔ 덮어쓴 줄이 ${d.rowsOverwritten} 이다 — 열쇠가 모자란다`);

  if (틀린.length) {
    console.error(`⛔ 구간 길이 기사 대조 — ${틀린.length}건 틀렸다`);
    for (const t of 틀린) console.error(`   ${t}`);
    process.exit(1);
  }
  console.log(`✅ 구간 길이 기사 대조 — ${잰것.length}칸 전부 자료와 같다`);
}
