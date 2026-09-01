#!/usr/bin/env node
/**
 * make-capital-raising-summary-chart.mjs — 세 편(자사주매입·유상증자·전환사채)을 한 장으로 묶는다.
 *   재료: 이미 낸 세 데이터 파일(src/data/{buyback,rights-issue,cvbd}-filings.json) — 새 API 호출 없음.
 * 출력: public/charts/capital-raising-size-vs-outcome.svg
 */
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');
const CHARTS = path.join(ROOT, 'public/charts');

const 억 = (won) => +(won / 1e8).toFixed(1);
const b = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/buyback-filings.json'), 'utf8'));
const r = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/rights-issue-filings.json'), 'utf8'));
const c = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/cvbd-filings.json'), 'utf8'));

/** DART company.json 의 corp_name_eng — 이미 각 기사에서 확보해 인용한 값 그대로(재조회 안 함) */
const 영문명 = {
  '삼성바이오로직스': 'Samsung Biologics', '파이온엑스': 'PhionX',
  'KG모빌리티': 'KG Mobility', '성호전자': 'Sungho Electronics', '아이티센씨티에스': 'ITCEN CTS',
};
const en = (corp) => 영문명[corp] ?? corp;

const byCorp = (rows, name) => rows.find((x) => x.corp === name);
const biggestBuyback = b.rows[0];
const smallCancels = b.rows.filter((x) => x.소각 && !x.다른목적).sort((x, y) => x.금액원 - y.금액원)[0];
const biggestRights = r.rows[0];
const worstRightsDilution = [...r.rows].sort((x, y) => y.희석률 - x.희석률)[0];
const cvbdBig = byCorp(c.rows, '성호전자'); // ₩13.0bn, 1.02% — raised more than ITCEN CTS, diluted far less
const cvbdSmall = byCorp(c.rows, '아이티센씨티에스'); // ₩5.0bn, 6.76%

export const 요약 = [
  { 축: 'Buybacks', 큰것: { 이름: en(biggestBuyback.corp), 값: 억(biggestBuyback.금액원), 결과: biggestBuyback.소각 ? 'cancels' : 'no cancel' }, 작은것: { 이름: en(smallCancels.corp), 값: 억(smallCancels.금액원), 결과: 'cancels' } },
  { 축: 'Rights issues', 큰것: { 이름: en(biggestRights.corp), 값: 억(biggestRights.조달총액), 결과: `${biggestRights.희석률}% dilution` }, 작은것: { 이름: en(worstRightsDilution.corp), 값: 억(worstRightsDilution.조달총액), 결과: `${worstRightsDilution.희석률}% dilution` } },
  { 축: 'Convertible bonds', 큰것: { 이름: en(cvbdBig.corp), 값: 억(cvbdBig.조달총액), 결과: `${cvbdBig.희석률}% dilution` }, 작은것: { 이름: en(cvbdSmall.corp), 값: 억(cvbdSmall.조달총액), 결과: `${cvbdSmall.희석률}% dilution` } },
];

function main() {
  fs.mkdirSync(CHARTS, { recursive: true });
  const INK = '#0f172a', SUB = '#64748b', BG = '#ffffff', ACC = '#1d4ed8', FLAG = '#b91c1c';
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const W = 768, rowH = 92, MT = 60, H = MT + 요약.length * rowH + 20;
  let rows = '';
  요약.forEach((row, i) => {
    const y = MT + i * rowH;
    rows += `<text x="24" y="${y + 18}" font-size="13" font-weight="700" fill="${INK}">${esc(row.축)}</text>`;
    rows += `<text x="118" y="${y + 40}" font-size="12.5" font-weight="700" fill="${ACC}">${esc(row.큰것.이름)} — ₩${row.큰것.값}억 — ${esc(row.큰것.결과)}</text>`;
    rows += `<text x="118" y="${y + 60}" font-size="12.5" font-weight="700" fill="${FLAG}">${esc(row.작은것.이름)} — ₩${row.작은것.값}억 — ${esc(row.작은것.결과)}</text>`;
    if (i < 요약.length - 1) rows += `<line x1="20" y1="${y + rowH - 12}" x2="${W - 20}" y2="${y + rowH - 12}" stroke="#e2e8f0"/>`;
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="Georgia,'Times New Roman',serif" role="img" aria-label="Three ways Korean companies raised capital this week, comparing the biggest filing against a smaller one that better served shareholders in each category">
<rect width="${W}" height="${H}" fill="${BG}"/>
<text x="24" y="30" font-size="16" font-weight="700" fill="${INK}">Size didn't predict the outcome, in all three</text>
<text x="24" y="46" font-size="12" fill="${SUB}">DART filings, 2026-08-25 to 2026-09-01. Two filers per category — the amount raised does not track the outcome.</text>
${rows}
<text x="${W - 24}" y="${H - 8}" text-anchor="end" font-size="10" fill="${SUB}">Source: DART (Financial Supervisory Service)</text>
</svg>`;
  fs.writeFileSync(path.join(CHARTS, 'capital-raising-size-vs-outcome.svg'), svg);
  console.log('✅ capital-raising summary chart · 3 rows');
}
main();
