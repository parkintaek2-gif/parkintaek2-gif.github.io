#!/usr/bin/env node
/**
 * **어려운 시장 기사를 자료와 대조한다.** 표 셋을 자리로 읽는다.
 * ⛔ 이 기사의 요점은 **교란을 인정한 것**이다 — 「대부분은 한국 몫 탓」이 뒤집히면 다시 써야 한다.
 * ⛔ 그리고 **줄세우지 않았나**를 잰다. 93곳을 다 늘어놓으면 이 자가 선다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 기사 = 'content/kculturewire/which-markets-only-take-the-big-ones.md';
const 자료 = 'src/data/wikitip-hard-markets.json';

/** 기사의 띠 이름 → 자료의 띠 이름 */
export const 띠표 = new Map([
  ['Under 5%', '5% 미만'],
  ['5–8%', '5–8%'],
  ['8–12%', '8–12%'],
  ['12% or more', '12% 이상'],
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
  재본다('칸들', 칸들('| Estonia | 78 | 1.8% |'), ['Estonia', '78', '1.8%']);
  재본다('칸들 — 표가 아니면 null', 칸들('글'), null);
  재본다('수 — 몫', 수('1.8%'), 1.8);
  재본다('수 — 굵게', 수('**62**'), 62);
  재본다('수 — 소수 가운데값', 수('17.5'), 17.5);
  재본다('수 — 없으면 null', 수('Estonia'), null);
  재본다('띠표가 넷', 띠표.size, 4);
  console.log(`어려운 시장 기사 대조자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  for (const p of [기사, 자료]) {
    if (!fs.existsSync(p)) { console.error(`⛔ 없다 — ${p}`); process.exit(1); }
  }
  const d = JSON.parse(fs.readFileSync(자료, 'utf8'));
  const 글 = fs.readFileSync(기사, 'utf8').replace(/\r\n/g, '\n');
  const 넓은 = new Map(d.widestOnly.map((m) => [m.name, m]));
  const 좁은 = new Map(d.narrowToo.map((m) => [m.name, m]));
  const 띠 = new Map(d.byBand.map((b) => [b.band, b]));
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
    if (표 === 1 || 표 === 2) {
      const m = (표 === 1 ? 넓은 : 좁은).get(라벨);
      if (!m) { 틀린.push(`표${표} 에 모르는 시장: ${라벨}`); continue; }
      본다('가운데 넓이', 수(c[1]), m.medianBreadth);
      본다('한국 몫', 수(c[2]), m.koreanSharePc);
    } else if (표 === 3) {
      const b = 띠.get(띠표.get(라벨));
      if (!b) { 틀린.push(`표3 에 모르는 띠: ${라벨}`); continue; }
      본다('시장 수', 수(c[1]), b.markets);
      본다('가운데 넓이', 수(c[2]), b.medianBreadth);
      본다('띠 안 폭', 수(c[3]), b.spread);
    }
  }
  if (표 !== 3) 틀린.push(`표가 ${표}개다 — 3개라야 한다`);
  if (줄수[1] !== 5) 틀린.push(`표1 이 ${줄수[1]}줄이다 — 다섯 곳이라야 한다`);
  if (줄수[2] !== 5) 틀린.push(`표2 가 ${줄수[2]}줄이다 — 다섯 곳이라야 한다`);
  if (줄수[3] !== 4) 틀린.push(`표3 이 ${줄수[3]}줄이다 — 띠 넷이라야 한다`);

  /* 본문에 박힌 수 */
  const 한국 = d.narrowToo.find((m) => m.name === 'South Korea');
  const 에스토니아 = d.widestOnly.find((m) => m.name === 'Estonia');
  for (const [이름, 값] of [
    ['한국의 좁은 작품 몫', `${한국.narrowTitlePc}%`],
    ['에스토니아 한국 작품 수', String(에스토니아.koreanTitles)],
    ['안 낸 시장 수', String(d.marketsMeasured - 10)],
  ]) {
    잰것.push(`본문/${이름}`);
    if (!글.includes(값)) 틀린.push(`본문 ${이름} — 「${값}」 이 기사에 없다`);
  }

  /* 🔴 방향 — 이 기사의 뼈대 */
  잰것.push('방향/한국이 가장 좁은가');
  if (한국.medianBreadth !== Math.min(...d.narrowToo.map((m) => m.medianBreadth))) {
    틀린.push('⛔ 한국이 가장 좁은 쪽이 아니다 — 기사의 첫 문장이 무너진다');
  }
  잰것.push('방향/에스토니아가 한국보다 훨씬 넓은가');
  if (!(에스토니아.medianBreadth > 한국.medianBreadth * 10)) {
    틀린.push(`⛔ 에스토니아(${에스토니아.medianBreadth})가 한국(${한국.medianBreadth})의 열 배가 안 된다`);
  }
  /* ⛔ 이 기사의 정직 — 「대부분은 한국 몫 탓」이 참이려면 띠를 따라 내려가야 한다 */
  잰것.push('정직/띠를 따라 넓이가 내려가나');
  const 순 = ['5% 미만', '5–8%', '8–12%', '12% 이상'].map((b) => 띠.get(b).medianBreadth);
  for (let i = 1; i < 순.length; i += 1) {
    if (순[i] > 순[i - 1]) {
      틀린.push(`⛔ 띠를 따라 넓이가 안 내려간다(${순.join(' → ')}) — 기사의 「대부분은 한국 몫 탓」이 무너진다`);
      break;
    }
  }
  /* ⛔ 그리고 「전부는 아니다」가 참이려면 띠 안에 폭이 남아야 한다 */
  잰것.push('정직/띠 안에 폭이 남나');
  if (!(띠.get('5% 미만').spread > 20)) {
    틀린.push(`⛔ 5% 미만 띠 안 폭이 ${띠.get('5% 미만').spread} 다 — 기사의 「전부는 아니다」가 무너진다`);
  }
  /* ⛔ 줄세우지 않았나 — 93곳을 다 늘어놓으면 선다 */
  잰것.push('규칙/줄세우지 않았나');
  const 표줄 = Object.values(줄수).reduce((a, b) => a + b, 0);
  if (표줄 > 20) 틀린.push(`⛔ 표에 ${표줄}줄이 있다 — 93곳을 늘어놓으면 순위표가 된다`);
  /* ⛔ 갈라낼 수 없다는 것을 기사가 밝히고 있나 */
  잰것.push('정직/못 갈랐다고 적었나');
  if (!/cannot take that further|We cannot/i.test(글)) {
    틀린.push('⛔ 「더는 못 간다」가 기사에 없다 — 이 표는 인과로 읽히기 쉽다');
  }

  if (틀린.length) {
    console.error(`⛔ 어려운 시장 기사 대조 — ${틀린.length}건 틀렸다`);
    for (const t of 틀린) console.error(`   ${t}`);
    process.exit(1);
  }
  console.log(`✅ 어려운 시장 기사 대조 — ${잰것.length}칸 전부 자료와 같다`);
}
