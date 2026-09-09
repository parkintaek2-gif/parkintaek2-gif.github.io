#!/usr/bin/env node
/**
 * make-turnover-vs-cap-charts.mjs — 「가치는 어디에, 거래는 어디서」 기사용 SVG.
 *   재료: 공공데이터포털 주식시세정보 15094808. MKTCAP(시총) vs ACC_TRDVAL(거래대금).
 *   둘 다 «비율»로만 낸다 — 시세 스케일과 무관, 검증가능.
 * 출력: public/charts/turnover-vs-cap-market.svg(그룹막대) · turnover-velocity.svg(회전율)
 *   + src/data/turnover-concentration.json
 */
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');
const CHARTS = path.join(ROOT, 'public/charts');
fs.mkdirSync(CHARTS, { recursive: true });
import { 시세 } from '../src/lib/stock-prices-datago.mjs';
/* 🔴 [2026-09-09] KRX 직접 경로에서 공공데이터포털로 갈아탔다.
 *   사장님: 「공공데이터포털에서만 수집하도록 해, krx 자료가 전혀 필요없네」
 *   까닭: KRX OPEN API 약관 제6조② 「비상업적인 목적으로만」 · 제11조 「제3자 제공 금지」.
 *   포털 15094808(금융위원회 · 이용허락범위 «제한 없음») 쪽이 커버도 넓다 —
 *   유가증권 943 → 코스닥·코넥스까지 2,873 종목.
 *   ⭐ 칸 이름은 KRX 그대로 나온다(MKTCAP·ISU_NM·ACC_TRDVAL…) — 아래 셈은 안 바꿨다.
 *   금지·대체의 정본: docs/수집-금지경로.tsv · 검사: scripts/check-forbidden-sources.mjs */
const { 날: dd, 줄들: 시세줄들, 까닭: 시세까닭 } = 시세(ROOT);
if (!시세줄들.length) { console.log(`⚠ 못 쟀다 — ${시세까닭}. 기존 출력 그대로 둔다.`); process.exit(0); }
const EN = { '삼성전자': 'Samsung Electronics', 'SK하이닉스': 'SK hynix', '삼성전자우': 'Samsung Elec. (pref)', '삼성전기': 'Samsung Electro-Mech.', 'SK스퀘어': 'SK Square', '카카오': 'Kakao', '금호건설': 'Kumho E&C' };
let all = [];
for (const r of 시세줄들) { all.push({ nm: r.ISU_NM, en: EN[r.ISU_NM] || r.ISU_NM, cap: +r.MKTCAP, val: +r.ACC_TRDVAL, mkt: r.MKT_NM }); }
const totCap = all.reduce((s, x) => s + x.cap, 0), totVal = all.reduce((s, x) => s + x.val, 0);
const kospi = all.filter((x) => x.mkt === 'KOSPI'), kosdaq = all.filter((x) => x.mkt === 'KOSDAQ');
const sum = (a, k) => a.reduce((s, x) => s + x[k], 0);
const pct = (v, t) => +(v / t * 100).toFixed(1);
const mkt = [
  { name: 'KOSPI', n: kospi.length, capPct: pct(sum(kospi, 'cap'), totCap), valPct: pct(sum(kospi, 'val'), totVal), vel: +(sum(kospi, 'val') / sum(kospi, 'cap') * 1000).toFixed(2) },
  { name: 'KOSDAQ', n: kosdaq.length, capPct: pct(sum(kosdaq, 'cap'), totCap), valPct: pct(sum(kosdaq, 'val'), totVal), vel: +(sum(kosdaq, 'val') / sum(kosdaq, 'cap') * 1000).toFixed(2) },
];
const byVal = [...all].sort((a, b) => b.val - a.val);
const shV = (n) => pct(byVal.slice(0, n).reduce((s, x) => s + x.val, 0), totVal);
const zero = all.filter((x) => x.val === 0).length;

const INK = '#0f172a', SUB = '#64748b', GRID = '#e2e8f0', BG = '#ffffff', CAPC = '#94a3b8', VALC = '#1d4ed8';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

// ── 그룹 막대: 시장별 시총% vs 거래대금% ──
function groupChart() {
  const W = 768, H = 400, ML = 90, MR = 30, MT = 64, MB = 44;
  const iw = W - ML - MR, ih = H - MT - MB, max = 100;
  const y = (p) => MT + ih * (1 - p / max);
  let grid = '';
  for (let t = 0; t <= 100; t += 25) grid += `<line x1="${ML}" y1="${y(t)}" x2="${W - MR}" y2="${y(t)}" stroke="${GRID}"/><text x="${ML - 8}" y="${y(t) + 4}" text-anchor="end" font-size="12" fill="${SUB}">${t}%</text>`;
  const gw = iw / mkt.length, bw = 46, gap = 14;
  let bars = '';
  mkt.forEach((m, i) => {
    const cx = ML + gw * i + gw / 2;
    const x1 = cx - bw - gap / 2, x2 = cx + gap / 2;
    bars += `<rect x="${x1.toFixed(1)}" y="${y(m.capPct).toFixed(1)}" width="${bw}" height="${(y(0) - y(m.capPct)).toFixed(1)}" fill="${CAPC}"/><text x="${(x1 + bw / 2).toFixed(1)}" y="${(y(m.capPct) - 6).toFixed(1)}" text-anchor="middle" font-size="12.5" font-weight="700" fill="${INK}">${m.capPct}%</text>`;
    bars += `<rect x="${x2.toFixed(1)}" y="${y(m.valPct).toFixed(1)}" width="${bw}" height="${(y(0) - y(m.valPct)).toFixed(1)}" fill="${VALC}"/><text x="${(x2 + bw / 2).toFixed(1)}" y="${(y(m.valPct) - 6).toFixed(1)}" text-anchor="middle" font-size="12.5" font-weight="700" fill="${VALC}">${m.valPct}%</text>`;
    bars += `<text x="${cx.toFixed(1)}" y="${H - MB + 20}" text-anchor="middle" font-size="13" font-weight="700" fill="${INK}">${m.name}</text><text x="${cx.toFixed(1)}" y="${H - MB + 35}" text-anchor="middle" font-size="10.5" fill="${SUB}">${m.n.toLocaleString()} issues</text>`;
  });
  const lx = ML;
  const legend = `<rect x="${lx}" y="46" width="12" height="12" fill="${CAPC}"/><text x="${lx + 17}" y="56" font-size="12" fill="${INK}">share of market value</text><rect x="${lx + 165}" y="46" width="12" height="12" fill="${VALC}"/><text x="${lx + 182}" y="56" font-size="12" fill="${INK}">share of that day's trading</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="Georgia,'Times New Roman',serif" role="img" aria-label="KOSPI and KOSDAQ share of market value versus share of daily trading value">
<rect width="${W}" height="${H}" fill="${BG}"/><text x="${ML}" y="26" font-size="16" font-weight="700" fill="${INK}">KOSDAQ is 7% of the value but 16% of the trading</text>
<text x="${W - MR}" y="26" text-anchor="end" font-size="10" fill="${SUB}">Source: KRX OPEN API · ${dd}</text>
${legend}${grid}${bars}</svg>`;
}

// ── 회전율 막대 ──
function velChart() {
  const W = 768, H = 300, ML = 110, MR = 80, MT = 56, MB = 30;
  const iw = W - ML - MR, max = Math.max(...mkt.map((m) => m.vel)) * 1.15, step = (H - MT - MB) / mkt.length, bh = 40, scale = iw / max;
  let out = '';
  mkt.forEach((m, i) => { const cy = MT + step * i + step / 2, w = m.vel * scale; out += `<rect x="${ML}" y="${(cy - bh / 2).toFixed(1)}" width="${w.toFixed(1)}" height="${bh}" fill="${VALC}" rx="2"/><text x="${ML - 10}" y="${(cy + 5).toFixed(1)}" text-anchor="end" font-size="13.5" font-weight="700" fill="${INK}">${m.name}</text><text x="${(ML + w + 8).toFixed(1)}" y="${(cy + 5).toFixed(1)}" font-size="13" font-weight="700" fill="${VALC}">${m.vel}</text>`; });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="Georgia,'Times New Roman',serif" role="img" aria-label="Daily turnover per 1000 of market cap: KOSDAQ trades far more actively than KOSPI">
<rect width="${W}" height="${H}" fill="${BG}"/><text x="20" y="26" font-size="16" font-weight="700" fill="${INK}">KOSDAQ shares change hands more than twice as fast</text>
<text x="20" y="42" font-size="12" fill="${SUB}">One day's trading value per ₩1,000 of market cap · ${dd}</text>${out}
<text x="${W - MR}" y="${H - 6}" text-anchor="end" font-size="10" fill="${SUB}">Source: KRX OPEN API</text></svg>`;
}

fs.writeFileSync(path.join(CHARTS, 'turnover-vs-cap-market.svg'), groupChart());
fs.writeFileSync(path.join(CHARTS, 'turnover-velocity.svg'), velChart());
fs.writeFileSync(path.join(ROOT, 'src/data/turnover-concentration.json'), JSON.stringify({
  asOf: dd, issues: all.length, zeroTradeIssues: zero,
  market: mkt,
  turnoverTop1: shV(1), turnoverTop5: shV(5), turnoverTop10: shV(10), turnoverTop30: shV(30), turnoverTop100: shV(100),
  topTurnover: byVal.slice(0, 8).map((x) => ({ en: x.en, sharePct: pct(x.val, totVal) })),
}, null, 1));
console.log('✅ turnover charts + data · KOSDAQ cap', mkt[1].capPct + '% val', mkt[1].valPct + '% · vel KOSPI', mkt[0].vel, 'KOSDAQ', mkt[1].vel, '· zero', zero);
