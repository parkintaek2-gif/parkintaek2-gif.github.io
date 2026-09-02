#!/usr/bin/env node
/**
 * make-offshore-assets-chart.mjs — 「해외금융계좌 신고 — 신고액 증가의 대부분은 신고자 증가다」.
 *
 * ⛔ 이 표의 숫자는 개인 계좌 마이크로데이터가 아니라 **국세청이 이미 공표한 집계치**다
 *   (국세청 2026-09-02 보도자료). 우리가 원본 신고 데이터를 다시 계산한 게 아니라,
 *   공표된 세 수(신고인원·신고금액, 3개년)로 «1인당 평균»만 우리가 직접 나눈다.
 *   그래서 house 원칙("우리가 센 것")은 「1인당 평균 계산」에만 해당하고, 원본 집계
 *   자체는 인용이다 — sources/crossChecks에서 이 구분을 명확히 한다.
 * 출력: public/charts/offshore-assets-per-filer.svg · src/data/offshore-assets.json
 */
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');
const CHARTS = path.join(ROOT, 'public/charts');
fs.mkdirSync(CHARTS, { recursive: true });

// 국세청 2026-09-02 보도자료 공표치(조원 단위 금액, 명 단위 인원). 원 단위로 바꿔 계산한다.
export const 원자료 = {
  2024: { 금액조원: 64.9, 인원: null },
  2025: { 금액조원: 94.5, 인원: 6858 },
  2026: { 금액조원: 107.1, 인원: 7484 },
};

/** 조원 단위를 억원 단위 1인당 평균으로. 인원 없으면 null(0으로 안 채움) */
export function 일인당억원(연도자료) {
  if (연도자료.인원 == null || 연도자료.인원 <= 0) return null;
  const 억원 = 연도자료.금액조원 * 10000; // 1조원 = 1만 억원
  return +(억원 / 연도자료.인원).toFixed(2);
}

/** 전년대비 증가율(%). 이전 값 없거나 0이면 null */
export function 증가율(이번, 이전) {
  if (이전 == null || 이전 === 0 || 이번 == null) return null;
  return +(((이번 - 이전) / 이전) * 100).toFixed(1);
}

function main() {
  const y25 = 원자료[2025], y26 = 원자료[2026];
  const 인당25 = 일인당억원(y25), 인당26 = 일인당억원(y26);
  const 금액증가율 = 증가율(y26.금액조원, y25.금액조원);
  const 인원증가율 = 증가율(y26.인원, y25.인원);
  const 인당증가율 = 증가율(인당26, 인당25);

  console.log(`✅ 해외금융계좌 신고 — 금액 +${금액증가율}% · 신고인원 +${인원증가율}% · 1인당 평균 +${인당증가율}%(₩${인당25}억→₩${인당26}억)`);

  fs.writeFileSync(path.join(ROOT, 'src/data/offshore-assets.json'), JSON.stringify({
    출처: '국세청 보도자료, 2026-09-02',
    원자료,
    파생: { 인당25억원: 인당25, 인당26억원: 인당26, 금액증가율, 인원증가율, 인당증가율 },
    못잼: { '2024인원': '보도자료에 2024년 신고인원 미공개 — 2024→2025 인당 계산 불가' },
  }, null, 1));

  const INK = '#0f172a', SUB = '#64748b', BG = '#ffffff', A1 = '#1d4ed8', A2 = '#b91c1c';
  const W = 640, H = 260, ML = 60, MR = 40, MT = 50, MB = 40;
  const rows = [
    { label: 'Total reported (₩tn)', v25: y25.금액조원, v26: y26.금액조원, growth: 금액증가율, unit: 'tn' },
    { label: 'Number of filers', v25: y25.인원, v26: y26.인원, growth: 인원증가율, unit: '' },
    { label: 'Avg. per filer (₩bn)', v25: +(인당25 / 10).toFixed(2), v26: +(인당26 / 10).toFixed(2), growth: 인당증가율, unit: '' },
  ];
  const iw = W - ML - MR, rh = (H - MT - MB) / rows.length;
  let bars = '';
  rows.forEach((r, i) => {
    const max = Math.max(r.v25, r.v26) * 1.15;
    const scale = iw / max;
    const y0 = MT + rh * i + 6, bh = (rh - 18) / 2;
    const w25 = r.v25 * scale, w26 = r.v26 * scale;
    bars += `<text x="${ML}" y="${(y0 - 4).toFixed(1)}" font-size="12" font-weight="700" fill="${INK}">${r.label} — +${r.growth}%</text>`;
    bars += `<rect x="${ML}" y="${y0.toFixed(1)}" width="${w25.toFixed(1)}" height="${bh}" fill="${SUB}" rx="2"/>`;
    bars += `<text x="${(ML + w25 + 6).toFixed(1)}" y="${(y0 + bh - 2).toFixed(1)}" font-size="10.5" fill="${SUB}">2025: ${r.v25}${r.unit}</text>`;
    bars += `<rect x="${ML}" y="${(y0 + bh + 2).toFixed(1)}" width="${w26.toFixed(1)}" height="${bh}" fill="${A1}" rx="2"/>`;
    bars += `<text x="${(ML + w26 + 6).toFixed(1)}" y="${(y0 + bh * 2).toFixed(1)}" font-size="10.5" font-weight="700" fill="${A1}">2026: ${r.v26}${r.unit}</text>`;
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="Georgia,'Times New Roman',serif" role="img" aria-label="Three bars comparing 2025 to 2026 for Korea's offshore-asset reporting: total amount up 13.3%, number of filers up 9.1%, average amount per filer up only 3.9%">
<rect width="${W}" height="${H}" fill="${BG}"/>
<text x="20" y="24" font-size="15" font-weight="700" fill="${INK}">Most of the headline increase is more filers, not richer ones</text>
${bars}
<text x="${W - MR}" y="${H - 8}" text-anchor="end" font-size="10" fill="${SUB}">Source: National Tax Service press release, 2 Sep 2026 (aggregate figures; per-filer average computed by SeoulMarkets)</text>
</svg>`;
  fs.writeFileSync(path.join(CHARTS, 'offshore-assets-per-filer.svg'), svg);
}

if (process.argv.includes('--자가시험')) {
  let 통과 = 0, 실패 = 0;
  const 검 = (m, ok) => { if (ok) 통과++; else { 실패++; console.log('  ❌', m); } };
  검('1인당 평균을 억원으로 정확히 계산', 일인당억원({ 금액조원: 94.5, 인원: 6858 }) === +((94.5 * 10000 / 6858).toFixed(2)));
  검('인원 없으면 null(0 아님)', 일인당억원({ 금액조원: 64.9, 인원: null }) === null);
  검('증가율 계산', 증가율(110, 100) === 10);
  검('이전값 0이면 null', 증가율(10, 0) === null);
  검('이전값 없으면 null', 증가율(10, null) === null);
  검('⛔ 실제 사례 — 금액증가율(13.3%)이 인원증가율(9.1%)보다 크다', 증가율(107.1, 94.5) > 증가율(7484, 6858));
  검('⛔ 실제 사례 — 1인당 증가율은 금액증가율보다 훨씬 작다(~3.9%)', 증가율(일인당억원(원자료[2026]), 일인당억원(원자료[2025])) < 5);
  console.log(실패 === 0 ? `✅ 자가시험 — 통과 ${통과} · 실패 0` : `❌ 자가시험 — 통과 ${통과} · 실패 ${실패}`);
  process.exit(실패 === 0 ? 0 : 1);
} else {
  main();
}
