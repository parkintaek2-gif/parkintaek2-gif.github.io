#!/usr/bin/env node
/**
 * **이스포츠 선수의 한 해는 한 달이다.** (`/one-month` · 기사 78편째)
 *
 * ── 어떻게 여기까지 왔나 ──────────────────────────────────────
 *   77편째에서 「베트남만 이스포츠 60.6%」를 냈다. 그다음 물음은 **언제 읽히나**였다.
 *   달 단위로 쪼개니 — ⭐ 이스포츠 선수 열한 명이 **전원 같은 한 달**에 몰렸다(2025-11).
 *   축구 선수는 흩어졌고, 은퇴한 박지성은 거의 고르게 읽혔다.
 *
 * ── ⛔ 이 자료가 지키는 것 ───────────────────────────────────
 * ⛔ **「대회 때문에 뛰었다」고 안 쓴다.** 우리가 잰 것은 「그 달에 몰렸다」이고,
 *    대회 날짜는 **달력에서 확인한 별개의 사실**이다. 둘을 나란히 놓고 독자가 읽게 둔다.
 * ⛔ 사람을 줄세우지 않는다. **얼마나 몰렸나**로 놓고 왜 다른지를 적는다.
 * ⛔ 못 잰 달을 0 으로 세지 않는다.
 * ⚠ 은퇴 선수를 **대조군으로 남긴다** — 이벤트가 없는 사람이 어떤 모양인지 없으면
 *   「몰렸다」가 무엇에 견준 말인지 알 수 없다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 원자료 = 'archive/raw/wikipedia/sea-athletes-monthly.json';
const 결과 = 'src/data/wikitip-one-month.json';

/**
 * 달력에서 확인한 사실. ⛔ 내 기억이 아니라 Wikidata 에서 받은 날짜다.
 * ⚠ 이것은 **까닭이 아니라 같은 달에 있었던 일**이다. 자료가 그렇게 말하게 적는다.
 */
export const 달력 = [
  { month: '202511', event: '2025 League of Legends World Championship', ended: '2025-11-09',
    note: 'The tournament ran 14 October to 9 November; the final fell in November.' },
  { month: '202606', event: '2026 FIFA World Cup', started: '2026-06-11',
    note: 'The tournament opened on 11 June 2026 and runs to 19 July.' },
];

export function 달력에서(달) {
  return 달력.find((x) => x.month === 달) ?? null;
}

/** 종목으로 묶어 몰림을 견준다 — 이것이 이 지면의 물음이다 */
export function 종목별몰림(사람들, 종목) {
  const 그들 = 사람들.filter((x) => x.sports?.includes(종목) && x.spread);
  if (!그들.length) return null;
  const 값 = 그들.map((x) => x.spread.peakSharePc).sort((a, b) => a - b);
  const 봉우리달 = new Map();
  for (const x of 그들) 봉우리달.set(x.peak, (봉우리달.get(x.peak) ?? 0) + 1);
  const [가장흔한달, 몇명] = [...봉우리달].sort((a, b) => b[1] - a[1])[0] ?? [null, 0];
  return {
    sport: 종목,
    people: 그들.length,
    medianPeakSharePc: 값[값.length >> 1],
    minPeakSharePc: 값[0],
    maxPeakSharePc: 값[값.length - 1],
    commonestPeakMonth: 가장흔한달,
    peopleSharingThatMonth: 몇명,
    /** ⭐ 전원이 같은 달인가 — 이 값이 이 지면의 발견이다 */
    allSameMonth: 몇명 === 그들.length,
  };
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    if (JSON.stringify(실제) === JSON.stringify(바람)) 통 += 1;
    else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  const 셋 = [
    { name: 'A', sports: ['esports'], peak: '202511', spread: { peakSharePc: 40 } },
    { name: 'B', sports: ['esports'], peak: '202511', spread: { peakSharePc: 50 } },
    { name: 'C', sports: ['football'], peak: '202606', spread: { peakSharePc: 20 } },
    { name: 'D', sports: ['football'], peak: '202508', spread: { peakSharePc: 10 } },
    { name: 'E', sports: ['esports'], peak: null, spread: null },   /* 못 잰 사람 */
  ];
  재본다('종목별몰림 — 못 잰 사람은 안 센다', 종목별몰림(셋, 'esports').people, 2);
  재본다('종목별몰림 — 전원 같은 달이면 참', 종목별몰림(셋, 'esports').allSameMonth, true);
  재본다('종목별몰림 — 다른 달이면 거짓', 종목별몰림(셋, 'football').allSameMonth, false);
  재본다('종목별몰림 — 가운데값', 종목별몰림(셋, 'esports').medianPeakSharePc, 50);
  재본다('종목별몰림 — 없는 종목은 null', 종목별몰림(셋, 'golf'), null);
  재본다('달력 — 2025-11 에 무엇이 있었나',
    달력에서('202511').event, '2025 League of Legends World Championship');
  재본다('달력 — 없는 달은 null', 달력에서('202503'), null);
  재본다('⚠ 달력에 적힌 것은 날짜뿐이다 — 「까닭」 칸이 없다',
    Object.keys(달력[0]).includes('cause'), false);
  재본다('달력 둘', 달력.length, 2);
  console.log(`한 달 짓는 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  if (!fs.existsSync(원자료)) { console.error(`⛔ 없다 — ${원자료}`); process.exit(1); }
  const d = JSON.parse(fs.readFileSync(원자료, 'utf8'));

  const 줄들 = d.people
    .filter((x) => x.spread)
    .map((x) => ({
      name: x.name,
      sport: x.sports[0],
      role: x.role,
      peakMonth: x.peak,
      peakSharePc: x.spread.peakSharePc,
      totalReads: x.spread.total,
      whatElseWasThatMonth: 달력에서(x.peak)?.event ?? null,
    }))
    .sort((a, b) => b.peakSharePc - a.peakSharePc);

  const 종목들 = [...new Set(줄들.map((x) => x.sport))];
  const 몰림표 = 종목들.map((s) => 종목별몰림(d.people, s)).filter(Boolean);

  const out = {
    generated: new Date().toISOString(),
    source: d.source,
    window: d.window,
    unit: d.unit,
    evenMonthSharePc: d.evenMonthSharePc,
    question: 'Reads of an esports player and reads of a footballer do not arrive the same way. '
      + 'One arrives in a single month.',
    people: 줄들,
    bySport: 몰림표,
    calendar: 달력,
    /** 🔴 이 문장이 이 자료의 울타리다. 지면이 반드시 보여 준다 */
    correlationNotCause: 'We measured when reads arrived. The tournament dates come from the '
      + 'calendar, not from our data. The two are printed side by side because that is the honest '
      + 'shape of what we know: a month is crowded, and something happened that month. We did not '
      + 'measure that one caused the other.',
    cannotAnswer: d.cannotAnswer,
  };
  fs.writeFileSync(결과, `${JSON.stringify(out, null, 2)}\n`);

  console.log(`⭐ ${결과}`);
  console.log(`고르면 한 달이 ${d.evenMonthSharePc}%\n`);
  for (const s of 몰림표) {
    console.log(`${s.sport.padEnd(10)} ${s.people}명 · 가운데 몰림 ${s.medianPeakSharePc}% `
      + `(${s.minPeakSharePc}~${s.maxPeakSharePc}) · 가장 흔한 봉우리 ${s.commonestPeakMonth} `
      + `${s.peopleSharingThatMonth}/${s.people}명${s.allSameMonth ? '  ⭐ 전원 같은 달' : ''}`);
  }
}
