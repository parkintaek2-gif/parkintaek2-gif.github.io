/**
 * K Culture Wire — 한국 웹툰 사업체의 두 경제. (/webtoon)
 *
 * 결과 → src/data/wikitip-webtoon.json
 * 입력 → archive/raw/kosis/webtoon-2024.json
 *          DT_467002_A005  웹툰 관련 매출액 (사례수·구간별 비중·평균)
 *          DT_467002_A004  매출액 중 웹툰 관련 비중 (의존도)
 *
 * ── 왜 이제 와서 스크립트를 만드나 ─────────────────────────────
 * 손으로 만든 자료 파일이었다. 값은 2026-08-07 되짚기에서 원자료와 맞는 것을 확인했다(98개 값).
 * 그래도 **되짚을 수 없는 자료는 규칙이 바뀌어도 안 따라온다.** 값이 맞을 때 되돌려 둔다.
 *
 * ⚠ 단위를 두 번 틀릴 뻔한 자리다. 원자료 「매출액 평균」은 **백만원**이다.
 *   지면은 **십억원(₩bn)** 으로 적는다. 1,000 으로 나눈다 — 100 이 아니다.
 *   2026-08-06 에 100 으로 나눠 ₩8.06bn 을 ₩80.6bn 으로 낼 뻔했고 기사와 대조해 배포 전에 잡았다.
 *   그래서 여기서는 **나누지 않고 백만원 그대로** 낸다. 지면이 나눈다. 나누는 자리를 하나로 둔다.
 *
 * ⛔ 사업체 수가 아니라 **사례수(응답한 곳)** 다. 조사에 답한 396곳이지 한국 웹툰 사업체 전부가 아니다.
 */
import fs from 'node:fs';

const raw = JSON.parse(fs.readFileSync('archive/raw/kosis/webtoon-2024.json', 'utf8'));
const A5 = raw.DT_467002_A005.rows;  // 매출액
const A4 = raw.DT_467002_A004.rows;  // 웹툰 의존도

/** 원자료 축 이름 → 지면 이름. 축 이름은 원자료 것을 그대로 두고 옆에 영문을 붙인다. */
const AXES = [
  ['전체', 'All businesses', null],
  ['플랫폼', 'Platforms', '사업 유형'],
  ['CP', 'Content providers', '사업 유형'],
  ['웹툰 서비스 제공', 'Webtoon service provision', '주사업 분야'],
  ['웹툰 콘텐츠 유통·중개', 'Distribution and brokerage', '주사업 분야'],
  ['웹툰 기획·제작', 'Planning and production', '주사업 분야'],
  ['웹툰 콘텐츠 출판', 'Publishing', '주사업 분야'],
  ['기타', 'Other', '주사업 분야'],
  ['10인 미만', 'Under 10 staff', '종사자 규모'],
  ['10~50인 미만', '10–49 staff', '종사자 규모'],
  ['50인 이상', '50+ staff', '종사자 규모'],
  ['10억원 미만', 'Revenue under ₩1bn', '매출 규모'],
  ['10~100억원 미만', 'Revenue ₩1–10bn', '매출 규모'],
  ['100억원 이상', 'Revenue ₩10bn+', '매출 규모'],
];

const pick = (rows, 축, 항목) => {
  const hit = rows.filter((r) => r.축 === 축 && r.항목 === 항목);
  /* 같은 (축, 항목) 이 둘 이상이면 축이 두 층이라는 뜻이다 — /tv-exports 에서 겪은 결함이다.
     그때는 이름만 보고 첫 줄을 집어 수출 형태 하나만 싣고 있었다. 여기서는 멈춘다. */
  if (hit.length > 1) throw new Error(`「${축} / ${항목}」이 ${hit.length}줄이다 — 축이 두 층인지 먼저 본다`);
  return hit.length ? hit[0].값 : null;
};

const rows = AXES.map(([ko, key]) => ({
  key,
  ko,
  n: pick(A5, ko, '사례수'),
  under1: pick(A5, ko, '10억원 미만'),
  mid: pick(A5, ko, '100억원 미만'),
  over10: pick(A5, ko, '100억원 이상'),
  mean: pick(A5, ko, '매출액 평균'),
  dep75: pick(A4, ko, '75% 이상'),
  dep25: pick(A4, ko, '25% 미만'),
}));

/* ── 검산 ── 매출 구간 셋을 더하면 100% 가 나와야 한다. 안 나오면 구간을 잘못 짚은 것이다. */
const 벗어난 = rows
  .map((r) => ({ key: r.key, sum: +(r.under1 + r.mid + r.over10).toFixed(1) }))
  .filter((x) => Math.abs(x.sum - 100) > 0.3);
if (벗어난.length) {
  throw new Error(`매출 구간 합이 100% 가 아닌 칸: ${벗어난.map((x) => `${x.key} ${x.sum}%`).join(', ')}`);
}
/* 어느 칸도 비면 안 된다. 비어 있으면 축 이름이 원자료와 어긋난 것이다. */
const 빈칸 = rows.filter((r) => Object.values(r).some((v) => v === null));
if (빈칸.length) throw new Error(`값이 빈 칸: ${빈칸.map((r) => r.key).join(', ')} — 축 이름을 원자료와 맞춘다`);

const groups = {
  '사업 유형': ['Platforms', 'Content providers'],
  '주사업 분야': ['Webtoon service provision', 'Distribution and brokerage', 'Planning and production', 'Publishing', 'Other'],
  '종사자 규모': ['Under 10 staff', '10–49 staff', '50+ staff'],
  '매출 규모': ['Revenue under ₩1bn', 'Revenue ₩1–10bn', 'Revenue ₩10bn+'],
};

fs.writeFileSync('src/data/wikitip-webtoon.json', JSON.stringify({
  generated: new Date().toISOString(),
  source: 'Korea Creative Content Agency, 웹툰산업실태조사 (Webtoon Industry Survey), reference year 2024, via KOSIS tables DT_467002_A005 and DT_467002_A004',
  sourceKo: '국가데이터처 KOSIS, 한국콘텐츠진흥원 「웹툰산업실태조사」',
  year: 2024,
  unitMean: 'million KRW',
  groups,
  rows,
}, null, 2));

const all = rows[0];
console.log(`${rows.length}칸 · 사례수 ${all.n}곳 · 구간합 검산 통과 ✅`);
console.log(` 전체   ₩1bn 미만 ${all.under1}% · 평균 ${all.mean.toLocaleString()}백만원 (= ₩${(all.mean / 1000).toFixed(2)}bn)`);
console.log(` 플랫폼 평균 ${rows[1].mean.toLocaleString()}백만원 · CP 평균 ${rows[2].mean.toLocaleString()}백만원`);
