#!/usr/bin/env node
/**
 * **들어온 자리 기사를 자료와 대조한다.** 표 둘을 자리로 읽는다.
 * ⛔ 방향까지 잰다 — 「위로 들어올수록 오래 간다」와 「한국 쪽 기울기가 더 가파르다」가
 *   뒤집히면 기사가 통째로 거짓말이 된다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 기사 = 'content/kculturewire/what-the-opening-position-buys.md';
const 자료 = 'src/data/wikitip-opening.json';

export const 이름표 = new Map([
  ['Korean series', '한국 시리즈'],
  ['Every other series', '그 밖 시리즈'],
  ['Korean films', '한국 영화'],
  ['Every other film', '그 밖 영화'],
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
  재본다('칸들', 칸들('| 1 | 488 | **6** |'), ['1', '488', '**6**']);
  재본다('칸들 — 표가 아니면 null', 칸들('글'), null);
  /* ⛔ 천 단위 쉼표를 자리 구분으로 읽으면 1,139 가 1 이 된다 */
  재본다('수 — 천 단위 쉼표', 수('1,139'), 1139);
  재본다('수 — 굵게와 몫', 수('**90.4%**'), 90.4);
  재본다('수 — 없으면 null', 수('Korean series'), null);
  재본다('이름표가 넷', 이름표.size, 4);
  console.log(`들어온 자리 기사 대조자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  for (const p of [기사, 자료]) {
    if (!fs.existsSync(p)) { console.error(`⛔ 없다 — ${p}`); process.exit(1); }
  }
  const d = JSON.parse(fs.readFileSync(자료, 'utf8'));
  const 글 = fs.readFileSync(기사, 'utf8').replace(/\r\n/g, '\n');
  const 무리 = new Map(d.byGroup.map((g) => [g.group, g]));
  const 한시 = 무리.get('한국 시리즈');
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
    const 본다 = (이름, 적힌, 참) => {
      잰것.push(`표${표}/${이름}`);
      if (적힌 !== 참) 틀린.push(`표${표} ${이름} — 기사 ${적힌} · 자료 ${참}`);
    };
    if (표 === 1) {
      /* 한국 시리즈의 자리별 표 */
      const 자리 = 수(c[0]);
      const e = 한시.byEntry.find((x) => x.entry === 자리);
      if (!e) { 틀린.push(`표1 에 모르는 자리: ${c[0]}`); continue; }
      본다(`${자리}위/구간`, 수(c[1]), e.runs);
      본다(`${자리}위/가운데`, 수(c[2]), e.medianWeeks);
      본다(`${자리}위/4주이상`, 수(c[3]), e.fourPlusPc);
      본다(`${자리}위/한주짜리`, 수(c[4]), e.oneWeekPc);
    } else if (표 === 2) {
      const 라벨 = c[0].replace(/[*_]/g, '').trim();
      const g = 무리.get(이름표.get(라벨));
      if (!g) { 틀린.push(`표2 에 모르는 이름: ${라벨}`); continue; }
      본다(`${라벨}/구간`, 수(c[1]), g.runs);
      본다(`${라벨}/1위 가운데`, 수(c[2]), g.topEntryMedian);
      본다(`${라벨}/10위 가운데`, 수(c[3]), g.bottomEntryMedian);
      본다(`${라벨}/칸당`, 수(c[4]), g.weeksPerStep);
    }
  }
  if (표 !== 2) 틀린.push(`표가 ${표}개다 — 2개라야 한다`);
  if (줄수[1] !== 10) 틀린.push(`표1 이 ${줄수[1]}줄이다 — 자리 열 줄이라야 한다`);
  if (줄수[2] !== 4) 틀린.push(`표2 가 ${줄수[2]}줄이다 — 무리 넷이라야 한다`);

  /* 본문에 박힌 수 */
  const 총잘림 = d.byGroup.reduce((s, g) => s + g.truncated, 0);
  for (const [이름, 값] of [
    ['잘린 것', 총잘림.toLocaleString('en-US')],
    ['한국 시리즈 구간', 한시.runs.toLocaleString('en-US')],
  ]) {
    잰것.push(`본문/${이름}`);
    if (!글.includes(값)) 틀린.push(`본문 ${이름} — 「${값}」 이 기사에 없다`);
  }

  /* 🔴 방향 — 뒤집히면 기사가 거짓말이 된다 */
  잰것.push('방향/위로 들어오면 오래 가나');
  for (const g of d.byGroup) {
    if (!(g.topEntryMedian > g.bottomEntryMedian)) {
      틀린.push(`⛔ ${g.group} — 1위(${g.topEntryMedian})가 10위(${g.bottomEntryMedian})보다 안 길다`);
    }
    if (!(g.weeksPerStep > 0)) 틀린.push(`⛔ ${g.group} — 칸당 주가 ${g.weeksPerStep} 다`);
  }
  잰것.push('방향/시리즈가 영화보다 기울기가 가파른가');
  if (!(d.koreanSeriesSlope > d.koreanFilmSlope && d.otherSeriesSlope > d.otherFilmSlope)) {
    틀린.push('⛔ 시리즈가 영화보다 기울기가 가파르다가 뒤집혔다');
  }
  /* ⛔ 이 기사의 두 번째 결론 — 한국 쪽이 더 가파르다 */
  잰것.push('방향/한국 쪽이 더 가파른가');
  if (!(d.koreanSeriesSlope > d.otherSeriesSlope)) {
    틀린.push(`⛔ 한국 시리즈(${d.koreanSeriesSlope})가 그 밖(${d.otherSeriesSlope})보다 안 가파르다`);
  }
  if (!(d.koreanFilmSlope > d.otherFilmSlope)) {
    틀린.push(`⛔ 한국 영화(${d.koreanFilmSlope})가 그 밖(${d.otherFilmSlope})보다 안 가파르다`);
  }
  /* ⛔ 기사가 「예보가 아니다」를 밝히고 있나 — 이 표는 그렇게 읽히기 쉽다 */
  잰것.push('정직/예보가 아니라고 적었나');
  if (!/not a forecast/i.test(글)) 틀린.push('⛔ 「예보가 아니다」가 기사에 없다 — 이 표는 예보로 읽히기 쉽다');
  /* ⛔ 줄을 잃고 있으면 표 전체가 못 쓴다 */
  잰것.push('읽기/줄을 잃고 있나');
  if (d.rowsOverwritten > 50) 틀린.push(`⛔ 덮어쓴 줄이 ${d.rowsOverwritten} 이다`);

  if (틀린.length) {
    console.error(`⛔ 들어온 자리 기사 대조 — ${틀린.length}건 틀렸다`);
    for (const t of 틀린) console.error(`   ${t}`);
    process.exit(1);
  }
  console.log(`✅ 들어온 자리 기사 대조 — ${잰것.length}칸 전부 자료와 같다`);
}
