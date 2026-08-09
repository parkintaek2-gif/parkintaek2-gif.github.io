#!/usr/bin/env node
/**
 * 🔴🔴 **기사의 표를 자료와 대조한다.**
 *
 * 왜 이 자가 있나 ─────────────────────────────────────────────
 *   61번 기사에서 나라 다섯 곳 수치를 **손으로 지어 냈다.** 다섯 다 틀렸고,
 *   그 중 하나(US)는 실제로 **0%** 인데 1.8% 라고 적었다 — 기사에서 가장 센 사실이었다.
 *   ⛔ 사람이 옮겨 적는 한 또 난다. 그러니 **자가 옮겨 적었는지 확인한다.**
 *
 * ⛔ 이 자가 지키는 것 ────────────────────────────────────────
 * ⛔ 표 칸을 **자리로** 읽는다. 「어디에 이 수가 있나」로 찾지 않는다 —
 *    같은 수가 딴 줄에 있으면 틀린 줄을 옳다고 해 버린다.
 * ⛔ 기사에 **자료에 없는 수가 있으면** 잡는다. 인용한 남의 수(제작비)는 미리 적어 두고 뺀다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 기사 = 'content/kculturewire/the-charts-did-not-concentrate.md';
const 자료 = 'src/data/wikitip-leverage.json';

/** 표 한 줄을 칸으로 가른다. ⛔ 양끝 빈 칸을 버린다 */
export function 칸들(줄) {
  const s = String(줄).trim();
  if (!s.startsWith('|')) return null;
  return s.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
}

/** 칸에서 수만 뽑는다. `*(part year)*`·`%`·`×`·`**` 를 벗긴다. 수가 없으면 null */
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
  재본다('칸들', 칸들('| 2022 | 107 | 55 |'), ['2022', '107', '55']);
  재본다('칸들 — 표가 아니면 null', 칸들('그냥 글'), null);
  재본다('수 — 굵게 표시를 벗긴다', 수('**11.6×**'), 11.6);
  재본다('수 — 몫 표시를 벗긴다', 수('63.6%'), 63.6);
  /* ⛔ 「2021 *(part year)*」에서 2021 을 집어야 한다. 괄호 안 것을 집으면 안 된다 */
  재본다('수 — 앞의 것을 집는다', 수('2021 *(part year)*'), 2021);
  재본다('수 — 없으면 null', 수('Year'), null);
  console.log(`기사 대조자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  for (const p of [기사, 자료]) {
    if (!fs.existsSync(p)) { console.error(`⛔ 없다 — ${p}`); process.exit(1); }
  }
  const j = JSON.parse(fs.readFileSync(자료, 'utf8'));
  const 글 = fs.readFileSync(기사, 'utf8').replace(/\r\n/g, '\n');
  const 해별 = new Map(j.byYear.map((y) => [y.year, y]));
  const 틀린 = [];
  const 잰것 = [];

  /* ── 표 둘을 자리로 읽는다 ── */
  const 줄들 = 글.split('\n');
  let 표번호 = 0;
  let 표안 = false;
  for (const l of 줄들) {
    const c = 칸들(l);
    if (!c) { 표안 = false; continue; }
    if (/^-+:?$|^:?-+:?$/.test(c[0]) || /^-{2,}$/.test(c[0])) continue;  /* 가름줄 */
    if (!표안) { 표안 = true; 표번호 += 1; continue; }                    /* 머리줄 */
    const 해 = String(수(c[0]));
    const y = 해별.get(해);
    if (!y) { 틀린.push(`표${표번호} — 자료에 없는 해: ${c[0]}`); continue; }

    /* ⛔ 자리로 정한다. 표1 과 표2 의 칸 뜻이 다르다 */
    const 봄 = 표번호 === 1
      ? [['작품', y.titlesWithFirm], ['회사', y.firms],
        ['절반덮개', y.halfTakesFirms], ['고르면', y.halfTakesIfEven]]
      : [['윗세곳', y.topThreePc], ['고르면', y.topThreeIfEven], ['배', y.topThreeRatio]];
    봄.forEach(([이름, 참], i) => {
      const 적힌 = 수(c[i + 1]);
      잰것.push(`${해}/${이름}`);
      if (적힌 !== 참) 틀린.push(`표${표번호} ${해} ${이름} — 기사 ${적힌} · 자료 ${참}`);
    });
  }
  if (표번호 !== 2) 틀린.push(`표가 ${표번호}개다 — 2개라야 한다`);

  /* ── 본문에 박힌 수 ── */
  const 온전 = j.byYear.filter((y) => y.weeks >= 40);
  const 첫 = 온전[0]; const 끝 = 온전[온전.length - 1];
  const 본문 = [
    ['줄 수', j.rowsRead.toLocaleString('en-US')],
    ['시장 수', '93'],
    ['첫 해 방송몫', `${첫.broadcastPc}%`],
    ['끝 해 방송몫', `${끝.broadcastPc.toFixed(1)}%`],
    ['첫 해 역할/편', String(첫.rolesPerTitle)],
    ['끝 해 역할/편', String(끝.rolesPerTitle)],
    ['꽉 찬 것 최대', String(Math.max(...j.byYear.map((y) => y.wellRecordedTitles)))],
    ['2025 꽉 찬 것', String(해별.get('2025').wellRecordedTitles)],
  ];
  for (const [이름, 값] of 본문) {
    잰것.push(`본문/${이름}`);
    if (!글.includes(값)) 틀린.push(`본문 ${이름} — 「${값}」 이 기사에 없다`);
  }

  /* ── 🔴 방향을 못 지키면 기사가 거짓말이 된다 ── */
  if (!(끝.topThreeRatio < 첫.topThreeRatio)) {
    틀린.push(`⛔ 윗세곳 배가 안 내려갔다(${첫.topThreeRatio} → ${끝.topThreeRatio}) — 기사는 「내려갔다」고 적었다`);
  }
  잰것.push('방향/윗세곳이 내려갔나');
  /* ⛔ 교란 자가 서 버렸으면 「못 갈랐다」 문단을 고쳐야 한다 */
  if (j.confoundTestRan) 틀린.push('⛔ 교란 자가 이제 선다 — 기사의 「못 갈랐다」 문단을 다시 쓴다');
  잰것.push('방향/교란을 여전히 못 가르나');

  /* ── 🔴 인용한 남의 수가 우리 수로 안 읽히나 ── */
  for (const 남 of ['360,000', '9.8m', '27-fold']) {
    잰것.push(`인용/${남}`);
    if (!글.includes(남)) 틀린.push(`인용 ${남} — 기사에서 사라졌다`);
  }
  if (!/not our figures|Those are not our figures/i.test(글)) {
    틀린.push('⛔ 「우리 수가 아니다」라는 말이 기사에 없다 — 남의 수와 우리 수가 섞인다');
  }
  잰것.push('인용/남의 수라고 밝혔나');

  if (틀린.length) {
    console.error(`⛔ 기사 대조 — ${틀린.length}건 틀렸다`);
    for (const t of 틀린) console.error(`   ${t}`);
    process.exit(1);
  }
  console.log(`✅ 기사 대조 — ${잰것.length}칸 전부 자료와 같다`);
}
