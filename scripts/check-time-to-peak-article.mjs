#!/usr/bin/env node
/**
 * **퍼지는 때 기사를 자료와 대조한다.** 표 둘을 자리로 읽는다.
 * ⛔ 이 기사의 요점은 **교란을 인정한 것**이다 — 「대부분은 길이 탓이다」가 뒤집히면
 *   기사가 통째로 다시 쓰여야 한다. 그래서 방향을 잰다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 기사 = 'content/kculturewire/when-a-korean-title-is-widest.md';
const 자료 = 'src/data/wikitip-time-to-peak.json';

export const 이름표 = new Map([
  ['Korean series', '한국 시리즈'],
  ['Every other series', '그 밖 시리즈'],
  ['Korean films', '한국 영화'],
  ['Every other film', '그 밖 영화'],
]);

/** 기사의 띠 이름 → 자료의 띠 이름 */
export const 띠표 = new Map([
  ['1–2 weeks', '1–2주'],
  ['3–4 weeks', '3–4주'],
  ['5–8 weeks', '5–8주'],
  ['9 weeks or more', '9주 이상'],
]);

export function 칸들(줄) {
  const s = String(줄).trim();
  if (!s.startsWith('|')) return null;
  return s.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
}

/** 칸에서 **첫 수**만. `**`·`%`·천 단위 쉼표를 벗긴다. 괄호 안 표본 수는 따로 뽑는다 */
export function 수(칸) {
  const m = String(칸).replace(/[*_]/g, '').replace(/\([^)]*\)/g, ' ')
    .replace(/(\d),(\d)/g, '$1$2').match(/-?\d+(?:\.\d+)?/);
  return m ? +m[0] : null;
}

/** 괄호 안 표본 수 — `50% *(6 titles)*` 의 6 */
export function 표본(칸) {
  const m = String(칸).replace(/[*_]/g, '').replace(/(\d),(\d)/g, '$1$2').match(/\(\s*(\d+)/);
  return m ? +m[1] : null;
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    if (JSON.stringify(실제) === JSON.stringify(바람)) 통 += 1;
    else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  재본다('칸들', 칸들('| Korean series | 209 |'), ['Korean series', '209']);
  재본다('수 — 천 단위 쉼표', 수('1,990'), 1990);
  재본다('수 — 굵게와 몫', 수('**20.1%**'), 20.1);
  /* ⛔ 괄호 안 표본 수를 몫으로 읽으면 안 된다 — 「50% (6 titles)」 는 50 이지 6 이 아니다 */
  재본다('수 — 괄호 안을 안 집는다', 수('50% *(6 titles)*'), 50);
  재본다('표본 — 괄호 안을 집는다', 표본('50% *(6 titles)*'), 6);
  재본다('표본 — 괄호가 없으면 null', 표본('50%'), null);
  재본다('띠표가 넷', 띠표.size, 4);
  console.log(`퍼지는 때 기사 대조자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  for (const p of [기사, 자료]) {
    if (!fs.existsSync(p)) { console.error(`⛔ 없다 — ${p}`); process.exit(1); }
  }
  const d = JSON.parse(fs.readFileSync(자료, 'utf8'));
  const 글 = fs.readFileSync(기사, 'utf8').replace(/\r\n/g, '\n');
  const 무리 = new Map(d.byGroup.map((g) => [g.group, g]));
  const 한시 = 무리.get('한국 시리즈'); const 밖시 = 무리.get('그 밖 시리즈');
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
    const 본다 = (이름, 적힌, 참) => {
      잰것.push(`표${표}/${라벨}/${이름}`);
      if (적힌 !== 참) 틀린.push(`표${표} ${라벨} ${이름} — 기사 ${적힌} · 자료 ${참}`);
    };
    if (표 === 1) {
      const g = 무리.get(이름표.get(라벨));
      if (!g) { 틀린.push(`표1 에 모르는 이름: ${라벨}`); continue; }
      본다('작품', 수(c[1]), g.titles);
      본다('가운데 주', 수(c[2]), g.medianWeek);
      본다('첫 주 몫', 수(c[3]), g.peakInWeekOnePc);
      본다('넷째 주까지', 수(c[4]), g.peakByWeekFourPc);
    } else if (표 === 2) {
      const 띠 = 띠표.get(라벨);
      if (!띠) { 틀린.push(`표2 에 모르는 띠: ${라벨}`); continue; }
      const a = 한시.byLengthBand.find((x) => x.band === 띠);
      const b = 밖시.byLengthBand.find((x) => x.band === 띠);
      본다('한국 몫', 수(c[1]), a.peakInWeekOnePc);
      본다('한국 표본', 표본(c[1]), a.titles);
      본다('그 밖 몫', 수(c[2]), b.peakInWeekOnePc);
      본다('그 밖 표본', 표본(c[2]), b.titles);
    }
  }
  if (표 !== 2) 틀린.push(`표가 ${표}개다 — 2개라야 한다`);
  if (줄수[1] !== 4) 틀린.push(`표1 이 ${줄수[1]}줄이다 — 무리 넷이라야 한다`);
  if (줄수[2] !== 4) 틀린.push(`표2 가 ${줄수[2]}줄이다 — 띠 넷이라야 한다`);

  /* 본문에 박힌 수 */
  const 뺀얇은것 = d.byGroup.reduce((s, g) => s + g.droppedThin, 0);
  const 뺀열린것 = d.byGroup.reduce((s, g) => s + g.droppedOpenEnded, 0);
  /* 🔴 처음에 **전체 무리의 최대**를 봤다(104 · 그 밖 영화). 이 기사는 한국 시리즈 이야기다.
     자가 기사보다 넓은 것을 보면 헛운다 — 재는 것을 기사에 맞춘다 */
  const 가장늦은 = 한시.latestWeek;
  for (const [이름, 값] of [
    ['얇아서 뺀 것', 뺀얇은것.toLocaleString('en-US')],
    ['끝에 걸려 뺀 것', String(뺀열린것)],
    ['가장 늦은 주', String(가장늦은)],
    ['나라 문턱', String(d.countryThreshold)],
  ]) {
    잰것.push(`본문/${이름}`);
    if (!글.includes(값)) 틀린.push(`본문 ${이름} — 「${값}」 이 기사에 없다`);
  }

  /* 🔴 방향 — 이 기사의 뼈대 */
  잰것.push('방향/한국 시리즈가 첫 주에 덜 넓나');
  if (!(한시.peakInWeekOnePc < 밖시.peakInWeekOnePc)) {
    틀린.push(`⛔ 한국 시리즈(${한시.peakInWeekOnePc})가 그 밖(${밖시.peakInWeekOnePc})보다 첫 주 몫이 안 낮다`);
  }
  /* ⛔ 이 기사의 정직 — 「대부분은 길이 탓」이 참이려면 가운데 띠에서 격차가 작아야 한다 */
  const 가운데띠 = (g) => g.byLengthBand.find((x) => x.band === '5–8주').peakInWeekOnePc;
  const 긴띠 = (g) => g.byLengthBand.find((x) => x.band === '9주 이상').peakInWeekOnePc;
  잰것.push('정직/가운데 띠에서 격차가 닫히나');
  const 가운데격차 = Math.abs(가운데띠(밖시) - 가운데띠(한시));
  if (가운데격차 > 8) {
    틀린.push(`⛔ 5–8주 띠 격차가 ${가운데격차.toFixed(1)}%p 다 — 기사는 「거의 사라진다」고 적었다`);
  }
  잰것.push('방향/긴 띠에서는 격차가 남나');
  if (!(긴띠(밖시) > 긴띠(한시) * 1.5)) {
    틀린.push(`⛔ 9주 이상 띠에서 격차가 안 남는다(${긴띠(한시)} 대 ${긴띠(밖시)}) — 기사의 둘째 결론이 무너진다`);
  }
  /* ⛔ 얇은 칸을 기사가 밝히고 있나 */
  const 얇은칸 = 한시.byLengthBand.find((x) => x.band === '1–2주');
  잰것.push('정직/얇은 칸을 밝혔나');
  if (얇은칸.titles < 10 && !/nothing should be read from it/i.test(글)) {
    틀린.push(`⛔ 1–2주 띠가 ${얇은칸.titles}편뿐인데 기사가 그 얇음을 안 밝힌다`);
  }

  if (틀린.length) {
    console.error(`⛔ 퍼지는 때 기사 대조 — ${틀린.length}건 틀렸다`);
    for (const t of 틀린) console.error(`   ${t}`);
    process.exit(1);
  }
  console.log(`✅ 퍼지는 때 기사 대조 — ${잰것.length}칸 전부 자료와 같다`);
}
