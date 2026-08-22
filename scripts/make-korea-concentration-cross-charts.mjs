#!/usr/bin/env node
/**
 * make-korea-concentration-cross-charts.mjs — 「모든 것이 넷으로 수렴한다」.
 *   주가(KRX) × 무역(관세청)을 «같은 잣대»(Gini·상위4 점유율)로 재서 한 지면에 엮는다.
 *   단일피드 벤더가 못 만드는 교차. 비율·Gini 라 스케일(sim 인플레) 불변 — 검증가능.
 *   재료: ① archive/raw/krx 시총·거래대금  ② src/data/trade-country-monthly.json 파트너 수출·수입.
 * 출력: public/charts/concentration-top4.svg · concentration-gini.svg + src/data/concentration-cross.json
 */
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');
const KRX = path.join(ROOT, 'archive/raw/krx');
const TRADE = path.join(ROOT, 'src/data/trade-country-monthly.json');
const CHARTS = path.join(ROOT, 'public/charts');
fs.mkdirSync(CHARTS, { recursive: true });

function gini(x) { x = x.filter((v) => v >= 0).sort((m, n) => m - n); const n = x.length; if (!n) return null; let cum = 0, s = 0; for (let i = 0; i < n; i++) { cum += x[i]; s += cum; } return +((n + 1 - 2 * (s / cum)) / n).toFixed(3); }
const top = (vals, k) => { const s = [...vals].sort((a, b) => b - a); const t = s.reduce((x, y) => x + y, 0); return +(s.slice(0, k).reduce((x, y) => x + y, 0) / t * 100).toFixed(1); };
const half = (vals) => { const s = [...vals].sort((a, b) => b - a); const t = s.reduce((x, y) => x + y, 0); let c = 0; for (let i = 0; i < s.length; i++) { c += s[i]; if (c / t >= 0.5) return i + 1; } };

// ── 주가: archive 가드(못 쟀다 vs 깨졌다) ──
if (!fs.existsSync(KRX)) { console.log('⚠ 못 쟀다 — archive/raw/krx 없음(서버 이동 때 정상). 기존 출력 유지.'); process.exit(0); }
const kf = fs.readdirSync(KRX).filter((f) => f.endsWith('.json'));
if (!kf.length) { console.log('⚠ 못 쟀다 — KRX json 없음.'); process.exit(0); }
const dd = kf.map((f) => f.match(/-(\d{8})\.json$/)?.[1]).filter(Boolean).sort().pop();
let caps = [], vals = [];
for (const f of kf.filter((f) => f.includes(dd))) { const { rows } = JSON.parse(fs.readFileSync(path.join(KRX, f), 'utf8')); for (const r of rows) { const c = +r.MKTCAP, v = +r.ACC_TRDVAL; if (c > 0) caps.push(c); if (v > 0) vals.push(v); } }

// ── 무역: 커밋본 ──
if (!fs.existsSync(TRADE)) { console.log('⚠ 못 쟀다 — trade-country-monthly.json 없음.'); process.exit(0); }
const td = JSON.parse(fs.readFileSync(TRADE, 'utf8'));
const mm = td.window.latest_month;
const get = (c, fld) => { const y = c.months.find((z) => z.month === mm); return y ? (+y[fld] || 0) : 0; };
const ex = td.countries.map((c) => get(c, 'exports')).filter((v) => v > 0);
const im = td.countries.map((c) => get(c, 'imports')).filter((v) => v > 0);

const dims = [
  { key: 'Stock market cap', units: `${caps.length} listed stocks`, gini: gini(caps), top4: top(caps, 4), top10: top(caps, 10), half: half(caps) },
  { key: 'Stock trading', units: `${vals.length} traded stocks`, gini: gini(vals), top4: top(vals, 4), top10: top(vals, 10), half: half(vals) },
  { key: 'Exports', units: `${ex.length} partner countries`, gini: gini(ex), top4: top(ex, 4), top10: top(ex, 10), half: half(ex) },
  { key: 'Imports', units: `${im.length} partner countries`, gini: gini(im), top4: top(im, 4), top10: top(im, 10), half: half(im) },
];

const INK = '#0f172a', SUB = '#64748b', GRID = '#e2e8f0', BG = '#ffffff', ACC = '#1d4ed8', REF = '#dc2626', GOLD = '#f59e0b';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const ym = `${mm.slice(0, 4)}-${mm.slice(5, 7)}`;

// ── Chart A: 상위 4가 절반 (네 차원) ──
function top4Chart() {
  const W = 768, H = 400, ML = 150, MR = 70, MT = 66, MB = 40;
  const iw = W - ML - MR, max = 70, step = (H - MT - MB) / dims.length, bh = Math.min(34, step * 0.5), scale = iw / max, x = (p) => ML + p * scale;
  let out = '';
  // 50% 기준선
  out += `<line x1="${x(50).toFixed(1)}" y1="${MT - 8}" x2="${x(50).toFixed(1)}" y2="${H - MB}" stroke="${REF}" stroke-dasharray="4 3"/><text x="${x(50).toFixed(1)}" y="${MT - 12}" text-anchor="middle" font-size="11" font-weight="700" fill="${REF}">half</text>`;
  dims.forEach((d, i) => {
    const cy = MT + step * i + step / 2, w = d.top4 * scale;
    out += `<rect x="${ML}" y="${(cy - bh / 2).toFixed(1)}" width="${w.toFixed(1)}" height="${bh}" fill="${ACC}" rx="2"/>`;
    out += `<text x="${ML - 10}" y="${(cy - 1).toFixed(1)}" text-anchor="end" font-size="13.5" font-weight="700" fill="${INK}">${esc(d.key)}</text>`;
    out += `<text x="${ML - 10}" y="${(cy + 13).toFixed(1)}" text-anchor="end" font-size="10.5" fill="${SUB}">of ${esc(d.units)}</text>`;
    out += `<text x="${(ML + w + 8).toFixed(1)}" y="${(cy + 5).toFixed(1)}" font-size="13" font-weight="700" fill="${ACC}">${d.top4}%</text>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="Georgia,'Times New Roman',serif" role="img" aria-label="The top four are about half of Korea's market cap, stock trading, exports and imports alike">
<rect width="${W}" height="${H}" fill="${BG}"/><text x="20" y="26" font-size="17" font-weight="700" fill="${INK}">Whatever you measure, the top four are half of it</text>
<text x="20" y="44" font-size="12" fill="${SUB}">Share held by the four largest — stocks as of ${dd}, trade ${ym}</text>${out}
<text x="${W - MR}" y="${H - 8}" text-anchor="end" font-size="10" fill="${SUB}">Source: Korea Exchange · Korea Customs Service</text></svg>`;
}
// ── Chart B: Gini, 소득/부 기준선과 함께 ──
function giniChart() {
  const W = 768, H = 420, ML = 150, MR = 60, MT = 78, MB = 40;
  const iw = W - ML - MR, max = 1.0, step = (H - MT - MB) / dims.length, bh = Math.min(30, step * 0.46), scale = iw / max, x = (v) => ML + v * scale;
  let out = '';
  const refs = [{ v: 0.40, t: 'typical income Gini ~0.40' }, { v: 0.63, t: 'most unequal nation ~0.63' }];
  for (const r of refs) out += `<line x1="${x(r.v).toFixed(1)}" y1="${MT - 10}" x2="${x(r.v).toFixed(1)}" y2="${H - MB}" stroke="${REF}" stroke-dasharray="4 3"/><text x="${x(r.v).toFixed(1)}" y="${MT - 14}" text-anchor="middle" font-size="10" fill="${REF}">${esc(r.t)}</text>`;
  dims.forEach((d, i) => {
    const cy = MT + step * i + step / 2, w = d.gini * scale;
    out += `<rect x="${ML}" y="${(cy - bh / 2).toFixed(1)}" width="${w.toFixed(1)}" height="${bh}" fill="${GOLD}" rx="2"/>`;
    out += `<text x="${ML - 10}" y="${(cy + 5).toFixed(1)}" text-anchor="end" font-size="13" font-weight="700" fill="${INK}">${esc(d.key)}</text>`;
    out += `<text x="${(ML + w + 8).toFixed(1)}" y="${(cy + 5).toFixed(1)}" font-size="13" font-weight="700" fill="#b45309">${d.gini}</text>`;
  });
  let ax = '';
  for (let t = 0; t <= 1; t += 0.25) ax += `<text x="${x(t).toFixed(1)}" y="${H - MB + 20}" text-anchor="middle" font-size="11" fill="${SUB}">${t.toFixed(2)}</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="Georgia,'Times New Roman',serif" role="img" aria-label="Gini concentration of Korea's market and trade, all above 0.9, versus income Gini reference lines">
<rect width="${W}" height="${H}" fill="${BG}"/><text x="20" y="26" font-size="17" font-weight="700" fill="${INK}">More concentrated than any country's incomes</text>
<text x="20" y="44" font-size="12" fill="${SUB}">Gini of concentration (0 = even, 1 = all in one). Higher = more lopsided.</text>${out}${ax}
<text x="${(ML + iw / 2).toFixed(0)}" y="${H - 6}" text-anchor="middle" font-size="11" fill="${SUB}">Gini coefficient</text></svg>`;
}
fs.writeFileSync(path.join(CHARTS, 'concentration-top4.svg'), top4Chart());
fs.writeFileSync(path.join(CHARTS, 'concentration-gini.svg'), giniChart());
fs.writeFileSync(path.join(ROOT, 'src/data/concentration-cross.json'), JSON.stringify({
  _왜: '주가×무역을 같은 잣대(Gini·상위4)로 교차. 비율/Gini라 sim 인플레 불변·검증가능.',
  stockAsOf: dd, tradeMonth: ym, dims,
}, null, 1));
console.log('✅ concentration cross · ' + dims.map((d) => `${d.key} top4 ${d.top4}%/G${d.gini}`).join(' · '));
