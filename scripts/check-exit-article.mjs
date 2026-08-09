#!/usr/bin/env node
/**
 * **나가는 자리 기사를 자료와 대조한다.**
 * 61번 기사에서 손으로 지어 낸 수 다섯이 다 틀렸다. 사람이 옮겨 적는 한 또 난다.
 *
 * ⛔ 표 칸을 **자리로** 읽는다. 「어디에 이 수가 있나」로 찾으면 틀린 줄을 옳다고 한다.
 * ⛔ 방향까지 잰다 — 「위는 안 나가고 아래는 나간다」가 뒤집히면 기사가 거짓말이 된다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 기사 = 'content/kculturewire/how-a-title-leaves.md';
const 자료 = 'src/data/wikitip-exit.json';

/** 표 한 줄을 칸으로 가른다 */
export function 칸들(줄) {
  const s = String(줄).trim();
  if (!s.startsWith('|')) return null;
  return s.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
}

/** 칸에서 수만 뽑는다. `**`·`%` 를 벗긴다. 수가 없으면 null */
export function 수(칸) {
  const m = String(칸).replace(/[*_]/g, '').match(/-?\d+(?:\.\d+)?/);
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
  재본다('칸들', 칸들('| 1 | **1.2%** |'), ['1', '**1.2%**']);
  재본다('칸들 — 표가 아니면 null', 칸들('그냥 글'), null);
  재본다('수 — 굵게와 몫을 벗긴다', 수('**70.3%**'), 70.3);
  재본다('수 — 정수', 수('17%'), 17);
  재본다('수 — 없으면 null', 수('Position'), null);
  /* ⛔ 빈 칸이 0 으로 읽히면 안 된다 */
  재본다('수 — 빈 칸은 null', 수(''), null);
  console.log(`나가는 자리 기사 대조자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  for (const p of [기사, 자료]) {
    if (!fs.existsSync(p)) { console.error(`⛔ 없다 — ${p}`); process.exit(1); }
  }
  const d = JSON.parse(fs.readFileSync(자료, 'utf8'));
  const 글 = fs.readFileSync(기사, 'utf8').replace(/\r\n/g, '\n');
  const 틀린 = [];
  const 잰것 = [];

  /* ── 표① 자리별 끝날 확률 — 자리로 읽는다 ── */
  const 줄들 = 글.split('\n');
  let 표번호 = 0;
  let 표안 = false;
  let 확률줄 = 0;
  for (const l of 줄들) {
    const c = 칸들(l);
    if (!c) { 표안 = false; continue; }
    if (/^:?-{2,}:?$/.test(c[0])) continue;
    if (!표안) { 표안 = true; 표번호 += 1; continue; }
    if (표번호 !== 1) continue;
    확률줄 += 1;
    const 자리 = 수(c[0]);
    const 적힌 = 수(c[1]);
    const 참 = d.korean.byRank[자리 - 1]?.endRatePc;
    잰것.push(`끝날확률/${자리}위`);
    if (적힌 !== 참) 틀린.push(`표1 ${자리}위 — 기사 ${적힌} · 자료 ${참}`);
  }
  if (확률줄 !== 10) 틀린.push(`표1 이 ${확률줄}줄이다 — 10줄이라야 한다`);

  /* ── 표② 한국 대 전체 ── */
  const 표2 = [
    ['아래셋', d.korean.bottomThreePc, d.allTitles.bottomThreePc],
    ['위셋', d.korean.topThreePc, d.allTitles.topThreePc],
    ['앉은 아래셋', d.korean.weeksBottomThreePc, d.allTitles.weeksBottomThreePc],
  ];
  표안 = false; 표번호 = 0;
  let i2 = 0;
  for (const l of 줄들) {
    const c = 칸들(l);
    if (!c) { 표안 = false; continue; }
    if (/^:?-{2,}:?$/.test(c[0])) continue;
    if (!표안) { 표안 = true; 표번호 += 1; continue; }
    if (표번호 !== 2) continue;
    const [이름, 한, 전] = 표2[i2] ?? [];
    i2 += 1;
    if (!이름) { 틀린.push('표2 에 줄이 더 있다'); continue; }
    잰것.push(`한국대전체/${이름}`);
    if (수(c[1]) !== 한) 틀린.push(`표2 ${이름} 한국 — 기사 ${수(c[1])} · 자료 ${한}`);
    if (수(c[2]) !== 전) 틀린.push(`표2 ${이름} 전체 — 기사 ${수(c[2])} · 자료 ${전}`);
  }
  if (i2 !== 3) 틀린.push(`표2 가 ${i2}줄이다 — 3줄이라야 한다`);

  /* ── 본문에 박힌 수 ── */
  const 본문 = [
    ['구간', d.korean.runs.toLocaleString('en-US')],
    ['나갔다', d.korean.departures.toLocaleString('en-US')],
    ['아직 있다', String(d.korean.stillOnChart)],
    ['시장 수', String(d.marketsMeasured)],
    ['시장 문턱', String(d.marketMinDepartures)],
    ['1위 들어옴', `${d.korean.byRank[0].entriesPc}%`],
    ['10위 들어옴', `${d.korean.byRank[9].entriesPc}%`],
  ];
  for (const [이름, 값] of 본문) {
    잰것.push(`본문/${이름}`);
    if (!글.includes(값)) 틀린.push(`본문 ${이름} — 「${값}」 이 기사에 없다`);
  }

  /* 시장 양 끝 — 이름과 몫이 짝으로 맞나 */
  for (const m of [d.marketsHigh[0], d.marketsLow[d.marketsLow.length - 1]]) {
    잰것.push(`시장/${m.국가}`);
    if (!글.includes(m.국가)) 틀린.push(`시장 ${m.국가} 가 기사에 없다`);
    if (!글.includes(`${m.아래셋몫}%`)) 틀린.push(`시장 ${m.국가} 의 ${m.아래셋몫}% 가 기사에 없다`);
  }

  /* ── 🔴 방향 — 뒤집히면 기사가 거짓말이 된다 ── */
  const 위 = d.korean.byRank[0].endRatePc;
  const 아래 = d.korean.byRank[9].endRatePc;
  잰것.push('방향/아래가 위보다 잘 나가나');
  if (!(아래 > 위 * 5)) 틀린.push(`⛔ 10위(${아래}%)가 1위(${위}%)의 다섯 배도 안 된다 — 기사의 「덫문」이 무너진다`);
  잰것.push('방향/한국이 전체보다 아래에서 나가나');
  if (!(d.korean.bottomThreePc > d.allTitles.bottomThreePc)) {
    틀린.push('⛔ 한국이 전체보다 아래에서 더 나간다가 뒤집혔다');
  }
  /* ⛔ 교란이 되살아났나 — 한국이 실제로 아래에 앉아 있으면 위 비교가 무효다 */
  잰것.push('교란/한국이 아래에 앉아 있나');
  if (d.korean.weeksBottomThreePc > d.allTitles.weeksBottomThreePc + 2) {
    틀린.push(`⛔ 한국이 앉은 자리부터 아래다(${d.korean.weeksBottomThreePc}% 대 ${d.allTitles.weeksBottomThreePc}%) — 기사의 「자리 때문이 아니다」를 다시 쓴다`);
  }
  /* ⛔ 줄을 잃고 있으면 표 전체가 못 쓴다 */
  잰것.push('읽기/줄을 잃고 있나');
  if (d.rowsOverwritten > 50) 틀린.push(`⛔ 덮어쓴 줄이 ${d.rowsOverwritten} 이다 — 열쇠가 모자란다`);

  /* ⛔ 우리가 고친 것을 기사가 계속 밝히고 있나 */
  잰것.push('정직/우리 실수를 적었나');
  if (!/25,987|10\.56%/.test(글)) {
    틀린.push('⛔ 우리가 고친 자리(25,987줄 · 10.56%)를 기사가 안 밝힌다');
  }

  if (틀린.length) {
    console.error(`⛔ 나가는 자리 기사 대조 — ${틀린.length}건 틀렸다`);
    for (const t of 틀린) console.error(`   ${t}`);
    process.exit(1);
  }
  console.log(`✅ 나가는 자리 기사 대조 — ${잰것.length}칸 전부 자료와 같다`);
}
