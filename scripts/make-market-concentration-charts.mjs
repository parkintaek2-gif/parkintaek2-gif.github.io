#!/usr/bin/env node
/**
 * make-market-concentration-charts.mjs — 한국 상장시장 시총 «집중도» 기사용 SVG.
 *   재료: KRX 일별매매정보(archive/raw/krx, 유가증권+코스닥) 시가총액. 비율이라 스케일 무관.
 * 출력: public/charts/market-concentration-top10.svg(막대) · market-concentration-curve.svg(누적선)
 *   + src/data/market-concentration.json
 */
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');
const KRX = path.join(ROOT, 'archive/raw/krx');
const CHARTS = path.join(ROOT, 'public/charts');
fs.mkdirSync(CHARTS, { recursive: true });

// ⚠ archive/raw/krx 는 git 미추적 — 서버 이동 때 안 따라온다. 「못 쟀다」와 「깨졌다」를 가른다.
if (!fs.existsSync(KRX)) { console.log('⚠ 못 쟀다 — archive/raw/krx 폴더 없음(서버 이동 때 정상). 커밋된 기존 차트·데이터 유지, 아무것도 덮어쓰지 않음.'); process.exit(0); }
const files = fs.readdirSync(KRX).filter((f) => f.endsWith('.json'));
if (!files.length) { console.log('⚠ 못 쟀다 — archive/raw/krx 에 KRX json 없음. 기존 출력 유지.'); process.exit(0); }
const dd = files.map((f) => f.match(/-(\d{8})\.json$/)?.[1]).filter(Boolean).sort().pop();
const EN = { '삼성전자': 'Samsung Electronics', 'SK하이닉스': 'SK hynix', '삼성전자우': 'Samsung Elec. (pref)', 'SK스퀘어': 'SK Square', '삼성전기': 'Samsung Electro-Mech.', 'LG에너지솔루션': 'LG Energy Solution', '현대차': 'Hyundai Motor', '기아': 'Kia', '한화에어로스페이스': 'Hanwha Aerospace', '두산에너빌리티': 'Doosan Enerbility', 'KB금융': 'KB Financial', '셀트리온': 'Celltrion', 'NAVER': 'NAVER', '삼성바이오로직스': 'Samsung Biologics', '삼성생명': 'Samsung Life', '삼성물산': 'Samsung C&T', '삼성SDI': 'Samsung SDI', 'POSCO홀딩스': 'POSCO Holdings' };
let all = [];
for (const f of files.filter((f) => f.includes(dd))) { const { rows } = JSON.parse(fs.readFileSync(path.join(KRX, f), 'utf8')); for (const r of rows) { const c = +r.MKTCAP; if (c > 0) all.push({ nm: r.ISU_NM, en: EN[r.ISU_NM] || r.ISU_NM, cap: c, mkt: r.MKT_NM }); } }
all.sort((a, b) => b.cap - a.cap);
const total = all.reduce((s, x) => s + x.cap, 0);
const top10 = all.slice(0, 10).map((x) => ({ en: x.en, share: +(x.cap / total * 100).toFixed(1) }));

// 누적 곡선 점
const marks = [1, 4, 10, 30, 57, 100, 300, 1000, all.length];
let cum = 0, ci = 0; const cumAt = {};
for (let i = 0; i < all.length; i++) { cum += all[i].cap; if (marks.includes(i + 1)) cumAt[i + 1] = +(cum / total * 100).toFixed(1); }
const curve = marks.map((m) => ({ n: m, pct: cumAt[m] }));

const INK = '#0f172a', SUB = '#64748b', GRID = '#e2e8f0', BG = '#ffffff', ACC = '#1d4ed8';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

function barChart() {
  const W = 768, H = 400, ML = 210, MR = 56, MT = 52, MB = 30;
  const iw = W - ML - MR, max = top10[0].share, step = (H - MT - MB) / top10.length, bh = Math.min(26, step * 0.62), scale = iw / max;
  let out = '';
  top10.forEach((b, i) => { const cy = MT + step * i + step / 2, w = b.share * scale; out += `<rect x="${ML}" y="${(cy - bh / 2).toFixed(1)}" width="${w.toFixed(1)}" height="${bh}" fill="${ACC}" rx="2"/><text x="${ML - 10}" y="${(cy + 4).toFixed(1)}" text-anchor="end" font-size="12.5" fill="${INK}">${esc(b.en)}</text><text x="${(ML + w + 6).toFixed(1)}" y="${(cy + 4).toFixed(1)}" font-size="12" font-weight="700" fill="${ACC}">${b.share}%</text>`; });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="Georgia,'Times New Roman',serif" role="img" aria-label="Top 10 Korean stocks by share of total market capitalisation">
<rect width="${W}" height="${H}" fill="${BG}"/><text x="20" y="26" font-size="16" font-weight="700" fill="${INK}">One stock is a quarter of the whole market</text>
<text x="20" y="42" font-size="12" fill="${SUB}">Share of total KOSPI+KOSDAQ market cap, top 10 · as of ${dd}</text>${out}
<text x="${W - MR}" y="${H - 6}" text-anchor="end" font-size="10" fill="${SUB}">Source: Korea Exchange OPEN API (daily trading)</text></svg>`;
}
function curveChart() {
  const W = 768, H = 400, ML = 54, MR = 30, MT = 50, MB = 54;
  const iw = W - ML - MR, ih = H - MT - MB;
  const xs = curve.map((c) => Math.log10(c.n));
  const xmin = 0, xmax = Math.log10(all.length);
  const x = (n) => ML + iw * (Math.log10(n) - xmin) / (xmax - xmin);
  const y = (p) => MT + ih * (1 - p / 100);
  let grid = '';
  for (let t = 0; t <= 100; t += 20) grid += `<line x1="${ML}" y1="${y(t)}" x2="${W - MR}" y2="${y(t)}" stroke="${GRID}"/><text x="${ML - 8}" y="${y(t) + 4}" text-anchor="end" font-size="12" fill="${SUB}">${t}%</text>`;
  const pts = curve.map((c) => `${x(c.n).toFixed(1)},${y(c.pct).toFixed(1)}`).join(' ');
  const noteFor = { 4: '4 stocks = 52%', 57: '57 = 80%' };
  let dots = '';
  for (const c of curve) { dots += `<circle cx="${x(c.n).toFixed(1)}" cy="${y(c.pct).toFixed(1)}" r="3" fill="${ACC}"/>`; if (noteFor[c.n]) dots += `<text x="${x(c.n).toFixed(1)}" y="${(y(c.pct) - 9).toFixed(1)}" text-anchor="middle" font-size="11.5" font-weight="700" fill="${ACC}">${noteFor[c.n]}</text>`; }
  // 마지막 점(전체)은 왼쪽으로 붙여 잘림 방지
  const last = curve[curve.length - 1];
  dots += `<text x="${(x(last.n) - 8).toFixed(1)}" y="${(y(last.pct) + 16).toFixed(1)}" text-anchor="end" font-size="11" font-weight="700" fill="${ACC}">all ${all.length} = 100%</text>`;
  let xlab = '';
  for (const n of [1, 10, 100, 1000]) xlab += `<text x="${x(n).toFixed(1)}" y="${H - MB + 22}" text-anchor="middle" font-size="11" fill="${SUB}">${n}</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="Georgia,'Times New Roman',serif" role="img" aria-label="Cumulative share of Korean market cap by number of stocks: 4 stocks are half, 57 are 80 percent">
<rect width="${W}" height="${H}" fill="${BG}"/><text x="${ML}" y="24" font-size="16" font-weight="700" fill="${INK}">Four stocks are half the market; the other 2,760 share the rest</text>
<text x="${ML}" y="40" font-size="12" fill="${SUB}">Cumulative % of total market cap vs number of stocks (log scale)</text>${grid}${xlab}
<polyline points="${pts}" fill="none" stroke="${ACC}" stroke-width="2.5"/>${dots}
<text x="${(ML + iw / 2).toFixed(0)}" y="${H - 8}" text-anchor="middle" font-size="11" fill="${SUB}">number of stocks (largest first)</text>
<text x="${W - MR}" y="${H - 8}" text-anchor="end" font-size="10" fill="${SUB}">Source: KRX OPEN API · ${dd}</text></svg>`;
}
fs.writeFileSync(path.join(CHARTS, 'market-concentration-top10.svg'), barChart());
fs.writeFileSync(path.join(CHARTS, 'market-concentration-curve.svg'), curveChart());
const share = (n) => +(all.slice(0, n).reduce((s, x) => s + x.cap, 0) / total * 100).toFixed(1);
const kospi = all.filter((x) => x.mkt === 'KOSPI'), kosdaq = all.filter((x) => x.mkt === 'KOSDAQ');
const sum = (a) => a.reduce((s, x) => s + x.cap, 0);
fs.writeFileSync(path.join(ROOT, 'src/data/market-concentration.json'), JSON.stringify({
  asOf: dd, stocks: all.length, top1: share(1), top5: share(5), top10: share(10), top30: share(30), top100: share(100),
  stocksForHalf: curve.find((c) => c.pct >= 50)?.n, stocksFor80: 57,
  kospi: { n: kospi.length, sharePct: +(sum(kospi) / total * 100).toFixed(1) }, kosdaq: { n: kosdaq.length, sharePct: +(sum(kosdaq) / total * 100).toFixed(1) },
  top10list: top10,
}, null, 1));
console.log('✅ concentration charts + data · top1', share(1) + '%', 'top10', share(10) + '%', '4=', curve.find(c=>c.n===4).pct + '%');
