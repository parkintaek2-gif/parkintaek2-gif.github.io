#!/usr/bin/env node
/**
 * make-buyback-cancel-chart.mjs — 「자사주 매입 신고 실명 순위 vs 소각 여부」 차트+데이터.
 *   재료: archive/raw/dart-breaking/*.json 의 태그=buyback 항목(DART tsstkAqDecsn, 실명 그대로).
 *   ⛔ 시세 API 아님(공시), FSC 제4유형(9/9) 무관. 이 파일은 재실행하면 같은 archive 로 같은 값을 낸다(재현 가능).
 * 출력: public/charts/buyback-cancellation-ranking.svg · src/data/buyback-filings.json
 */
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');
const DIR = path.join(ROOT, 'archive/raw/dart-breaking');
const CHARTS = path.join(ROOT, 'public/charts');
fs.mkdirSync(CHARTS, { recursive: true });

if (!fs.existsSync(DIR)) { console.log('⚠ 못 쟀다 — archive/raw/dart-breaking 없음. 기존 출력 유지.'); process.exit(0); }
const files = fs.readdirSync(DIR).filter((f) => /^\d{8}\.json$/.test(f)).sort();
if (!files.length) { console.log('⚠ 못 쟀다 — dart-breaking 파일 없음.'); process.exit(0); }

/** DART company.json 에서 확보한 공식 영문명(짐작 아님, corp_name_eng 그대로) */
export const 영문명 = {
  '진양폴리우레탄': 'Chinyang Polyurethane', '진양화학': 'Chinyang Chemical', '세진티에스': 'Sejin T.S',
  '이지메디컴': 'EZmedicom', '저스템': 'Justem', '고스트스튜디오': 'Ghost Studio',
  '셀트리온': 'Celltrion', '태원물산': 'Taewonmulsan', '카스': 'Cas',
};
/** 통상적 재량 매입(«주가안정·주주가치»류)과 다른 목적 — 소각 비교에서 뺀다(판정 아니라 사실 구분) */
export const 다른목적 = {
  '이지메디컴': '합병반대주주 주식매수청구권 행사 — 법정 의무 매입, 재량적 자사주 매입이 아님',
  '저스템': '임직원 성과보상 재원마련 — 나눠줄 목적, 소각 여부가 애초에 무관한 범주',
};

/** 한 항목을 표준형으로. 금액 없으면 null(0으로 안 채움) */
export function 표준화(x, 날짜) {
  const 금액 = x.수?.금액원 && x.수.금액원 !== '-' ? Number(String(x.수.금액원).replace(/,/g, '')) : null;
  return { corp: x.corp, code: x.code || null, corp_code: x.corp_code, rcept: x.rcept, 날짜, 금액원: 금액, 소각: !!x.수?.소각, 목적: x.수?.목적 ?? null, 방법: x.수?.방법 ?? null };
}

/** corp_code 로 묶어 «금액이 있는 최신 기재»만 남긴다(정정으로 값 빠진 최신 레코드 배제) */
export function 정리(항목들) {
  const byCorp = new Map();
  for (const it of 항목들) {
    if (it.금액원 == null) continue;
    const prev = byCorp.get(it.corp_code);
    if (!prev || it.날짜 > prev.날짜) byCorp.set(it.corp_code, it);
  }
  return [...byCorp.values()].sort((a, b) => b.금액원 - a.금액원);
}

function main() {
  let raw = [];
  for (const f of files) {
    const d = f.replace('.json', '');
    const j = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
    for (const x of (j.후보 || [])) if (x.태그 === 'buyback') raw.push(표준화(x, d));
  }
  const 순위 = 정리(raw);
  if (!순위.length) { console.log('⚠ 못 쟀다 — 금액 있는 buyback 필터 0건.'); process.exit(0); }

  const 억 = (won) => +(won / 1e8).toFixed(2);
  const rows = 순위.map((r) => ({ ...r, 억원: 억(r.금액원), en: 영문명[r.corp] || r.corp, 다른목적: 다른목적[r.corp] || null }));

  const INK = '#0f172a', SUB = '#64748b', BG = '#ffffff', YES = '#15803d', NO = '#b91c1c', OTHER = '#94a3b8';
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const W = 768, H = 60 + rows.length * 34 + 40, ML = 190, MR = 70, MT = 56, MB = 30;
  const iw = W - ML - MR, max = rows[0].억원, step = (H - MT - MB) / rows.length, bh = Math.min(24, step * 0.6), scale = iw / max;
  let bars = '';
  rows.forEach((r, i) => {
    const cy = MT + step * i + step / 2, w = r.억원 * scale;
    const color = r.다른목적 ? OTHER : (r.소각 ? YES : NO);
    const label = r.소각 ? 'cancels' : (r.다른목적 ? 'other purpose' : 'no cancel');
    bars += `<rect x="${ML}" y="${(cy - bh / 2).toFixed(1)}" width="${w.toFixed(1)}" height="${bh}" fill="${color}" rx="2"/>` +
      `<text x="${ML - 10}" y="${(cy + 4).toFixed(1)}" text-anchor="end" font-size="12" fill="${INK}">${esc(r.en)}</text>` +
      `<text x="${(ML + w + 6).toFixed(1)}" y="${(cy + 4).toFixed(1)}" font-size="11.5" font-weight="700" fill="${color}">₩${r.억원}억 · ${label}</text>`;
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="Georgia,'Times New Roman',serif" role="img" aria-label="Korean listed companies' buyback filings this week ranked by budget, marked by whether they commit to cancelling the shares">
<rect width="${W}" height="${H}" fill="${BG}"/>
<text x="20" y="26" font-size="16" font-weight="700" fill="${INK}">The biggest buyback didn't promise to cancel a single share</text>
<text x="20" y="42" font-size="12" fill="${SUB}">Korean listed-company buyback filings, ${files[0].slice(0,4)}-${files[0].slice(4,6)}-${files[0].slice(6,8)} to ${files.at(-1).slice(0,4)}-${files.at(-1).slice(4,6)}-${files.at(-1).slice(6,8)}, ranked by budget</text>
${bars}
<text x="${W - MR}" y="${H - 8}" text-anchor="end" font-size="10" fill="${SUB}">Source: DART (Financial Supervisory Service) filings, treasury-stock acquisition decisions</text>
</svg>`;
  fs.writeFileSync(path.join(CHARTS, 'buyback-cancellation-ranking.svg'), svg);
  fs.writeFileSync(path.join(ROOT, 'src/data/buyback-filings.json'), JSON.stringify({
    window: { from: files[0].replace('.json', ''), to: files.at(-1).replace('.json', '') },
    rows,
  }, null, 1));
  console.log(`✅ buyback chart+data · ${rows.length}곳 · 1위 ${rows[0].en} ₩${rows[0].억원}억 소각=${rows[0].소각}`);
}
main();
