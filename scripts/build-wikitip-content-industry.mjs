/**
 * K Culture Wire — 한국 콘텐츠 상장사의 사람. (/industry)
 *
 * 결과 → src/data/wikitip-content-industry.json
 * 입력 → src/data/rankings.json (금융감독원 전자공시 「직원 등의 현황」, 6번이 만든다)
 *
 * ── 왜 이제 와서 스크립트를 만드나 ─────────────────────────────
 * 손으로 만든 자료 파일이었다. 값은 2026-08-07 되짚기에서 원자료로 재계산해 맞는 것을 확인했다.
 * 그래도 **되짚을 수 없는 자료는 안 따라온다.** 값이 맞을 때 되돌려 둔다.
 *
 * ── ⚠ 자리번호로 읽지 않는다 ───────────────────────────────────
 * rankings.json 은 **우리 파일이 아니다.** 6번이 다시 만든다. 칸 순서가 바뀌면
 * 자리번호로 읽는 코드는 **오류 하나 없이 다른 값을 싣는다.** 이름으로 찾고 없으면 멈춘다.
 * (같은 날 /workforce 가 자리번호로 읽고 있는 것을 찾아 고쳤다.)
 *
 * ── 가중평균이다 ───────────────────────────────────────────────
 * 회사별 근속을 그냥 평균하면 직원 3명인 회사와 5만명인 회사가 같은 무게가 된다.
 * **인원으로 가중**한다. 그래야 「이 업종에서 일하는 사람의 평균 근속」이 된다.
 *
 * ⛔ 상장사만이다. 웹툰 제작사·기획사 상당수가 비상장이고 이 공시를 안 한다.
 * ⛔ 회사 이름을 담지 않는다. 줄세우기가 된다.
 */
import fs from 'node:fs';
import { 지금 } from './_kst.mjs';

const R = JSON.parse(fs.readFileSync('src/data/rankings.json', 'utf8'));
const C = Object.fromEntries(R.cols.map((c, i) => [c, i]));
for (const need of ['industry', 'tenure', 'headcount', 'femaleShare', 'pay', 'age']) {
  if (C[need] === undefined) throw new Error(`rankings.json 에 '${need}' 칸이 없다 — 세울 수 없다`);
}

/** 원자료 업종명 → 지면 이름. 「(includes games)」는 우리가 붙인 설명이다 — 게임사가 이 코드에 들어온다. */
const GROUPS = [
  ['Broadcasting', 'Broadcasting'],
  ['Film, video and audio production', 'Film, video and audio production'],
  ['Publishing', 'Publishing (includes games)'],
];

/**
 * 인원 가중평균.
 *
 * ⚠ **분모는 그 칸을 공시한 회사의 인원만**이다. 안 그러면 급여를 안 밝힌 회사의 직원이
 *   「0원을 받는 사람」으로 평균에 들어간다. 2026-08-07 되짚기 전의 자료는 그렇게 되어 있었다 —
 *   콘텐츠 456명, 시장 20,613명이 급여 0원으로 세어져 평균이 각각 0.7%·1.1% 낮게 나갔다.
 *   근속·인원은 있는 회사만 쓰므로 이 문제가 없고, 그래서 근속 값은 전과 같다.
 */
const 가중 = (rows, field) => {
  let 합 = 0, 인원 = 0;
  for (const r of rows) {
    const v = r[C[field]], h = r[C.headcount];
    if (v == null || h == null) continue;
    합 += v * h; 인원 += h;
  }
  return 인원 ? 합 / 인원 : null;  // 반올림은 부르는 쪽에서 한 번만 한다 — 두 번 하면 끝자리가 밀린다
};
/** 그 칸을 공시한 인원이 묶음 전체의 몇 %인가 — 지면이 「누구를 뺀 평균인가」를 적을 수 있게. */
const 공시율 = (rows, field) => {
  const 전체 = rows.reduce((s, r) => s + (r[C.headcount] ?? 0), 0);
  const 있는 = rows.filter((r) => r[C[field]] != null).reduce((s, r) => s + (r[C.headcount] ?? 0), 0);
  return { staffWith: 있는, staffTotal: 전체, pc: +((100 * 있는) / 전체).toFixed(1) };
};
/** 근속과 인원이 **둘 다** 있는 회사만 센다. 하나만 있는 곳을 세면 n 과 staff 가 어긋난다. */
const 쓸수있는 = (rows) => rows.filter((r) => r[C.tenure] != null && r[C.headcount] != null);

const 묶음 = (rows) => {
  const g = 쓸수있는(rows);
  return {
    n: g.length,
    staff: g.reduce((s, r) => s + r[C.headcount], 0),
    tenure: +가중(g, 'tenure').toFixed(2),
    female: +(가중(g, 'femaleShare') ?? 0).toFixed(1),
    pay: Math.round(가중(g, 'pay')),
    /* 나이는 회사의 「업력」칸이지 직원 나이가 아니다. 지면에 그렇게 적혀 있다. */
    age: +(가중(g, 'age') ?? 0).toFixed(1),
  };
};

const groups = GROUPS.map(([src, key]) => ({
  key,
  ...묶음(R.rows.filter((r) => r[C.industry] === src)),
}));
const 셋 = R.rows.filter((r) => GROUPS.some(([src]) => r[C.industry] === src));
const content = 묶음(셋);
const market = 묶음(R.rows);

/* ── 검산 ── 세 묶음의 인원을 더하면 콘텐츠 합이 나와야 한다. */
const 합 = groups.reduce((s, g) => s + g.staff, 0);
if (합 !== content.staff) throw new Error(`세 묶음 인원 합 ${합} ≠ 콘텐츠 합 ${content.staff}`);
const nl = groups.reduce((s, g) => s + g.n, 0);
if (nl !== content.n) throw new Error(`세 묶음 회사 수 합 ${nl} ≠ 콘텐츠 합 ${content.n}`);
/* 콘텐츠가 시장보다 클 수 없다. */
if (content.staff > market.staff) throw new Error('콘텐츠 인원이 시장 전체보다 많다');

fs.writeFileSync('src/data/wikitip-content-industry.json', JSON.stringify({
  generated: 지금(),
  source: `Financial Supervisory Service (Korea), DART annual report employee disclosures, filing year ${R.year}`,
  sourceKo: '금융감독원 전자공시(DART) 「직원 등의 현황」',
  year: R.year,
  groups,
  content,
  market,
  /** 급여를 공시한 인원의 비중 — 평균 급여가 누구의 평균인지 지면이 밝힌다. */
  payCoverage: { content: 공시율(셋.filter((r) => r[C.tenure] != null && r[C.headcount] != null), 'pay'), market: 공시율(R.rows.filter((r) => r[C.tenure] != null && r[C.headcount] != null), 'pay') },
  /** 세 업종에 속하는데 근속이나 인원이 비어 계산에서 빠진 회사. 지면이 「몇 곳 빠졌다」로 밝힌다. */
  dropped: R.rows.filter((r) => GROUPS.some(([src]) => r[C.industry] === src) && (r[C.tenure] == null || r[C.headcount] == null)).length,
}, null, 2));

console.log(`콘텐츠 ${content.n}곳 ${content.staff.toLocaleString()}명 근속 ${content.tenure}년 · 시장 ${market.n}곳 ${market.staff.toLocaleString()}명 ${market.tenure}년`);
groups.forEach((g) => console.log(` ${g.key.padEnd(34)} n=${g.n} staff=${g.staff.toLocaleString()} 근속=${g.tenure} 여성=${g.female}%`));
