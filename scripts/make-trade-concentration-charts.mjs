#!/usr/bin/env node
/**
 * make-trade-concentration-charts.mjs — 「한국은 누구에게 팔고 누구에게서 사나」 집중도.
 *   재료: src/data/trade-country-monthly.json (관세청/KOSIS, 파트너×월). 커밋본이라 archive 의존 없음.
 *   ⚠ 절대 USD 는 안 쓴다 — 이 표의 월 총액엔 스케일 불연속(2026-03)이 있다. «점유율»만 낸다
 *     (점유율은 그 불연속을 가로질러 안정적임을 확인함 → 검증가능·스케일 무관).
 * 출력: public/charts/trade-partner-shares.svg(짝 막대) · trade-concentration-curve.svg(누적선)
 *   + src/data/trade-concentration.json
 */
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');
const SRC = path.join(ROOT, 'src/data/trade-country-monthly.json');
const CHARTS = path.join(ROOT, 'public/charts');
fs.mkdirSync(CHARTS, { recursive: true });
if (!fs.existsSync(SRC)) { console.log('⚠ 못 쟀다 — trade-country-monthly.json 없음. 기존 출력 유지.'); process.exit(0); }
const d = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const arr = d.countries;
const mm = d.window?.latest_month || d.national[d.national.length - 1].month;
const CLEAN = { "China peoples' republic of": 'China', 'U.S.A': 'United States', 'Hong kong(BR)': 'Hong Kong', 'Viet nam': 'Vietnam' };
const nm = (en) => CLEAN[en] || en.replace(/\b\w/g, (c) => c.toUpperCase());
const get = (c, fld) => { const x = c.months.find((y) => y.month === mm); return x ? (+x[fld] || 0) : 0; };
function conc(fld) {
  const rows = arr.map((c) => ({ en: nm(c.name_en), v: get(c, fld) })).filter((r) => r.v > 0).sort((a, b) => b.v - a.v);
  const tot = rows.reduce((s, r) => s + r.v, 0);
  const sh = (n) => +(rows.slice(0, n).reduce((s, r) => s + r.v, 0) / tot * 100).toFixed(1);
  let cum = 0, forHalf = 0, for80 = 0;
  const curve = [];
  for (let i = 0; i < rows.length; i++) { cum += rows[i].v; if (!forHalf && cum / tot >= 0.5) forHalf = i + 1; if (!for80 && cum / tot >= 0.8) for80 = i + 1; if ([1, 2, 3, 5, 10, 20, 50, rows.length].includes(i + 1)) curve.push({ n: i + 1, pct: +(cum / tot * 100).toFixed(1) }); }
  return { partners: rows.length, top1: sh(1), top2: sh(2), top3: sh(3), top5: sh(5), top10: sh(10), forHalf, for80, curve, shareByName: Object.fromEntries(rows.map((r) => [r.en, +(r.v / tot * 100).toFixed(1)])) };
}
const ex = conc('exports'), im = conc('imports');
// 짝 막대에 쓸 파트너: 수출·수입 합쳐 큰 상위 7
const names = [...new Set([...Object.keys(ex.shareByName).slice(0, 8), ...Object.keys(im.shareByName).slice(0, 8)])];
const paired = names.map((n) => ({ en: n, ex: ex.shareByName[n] || 0, im: im.shareByName[n] || 0 })).sort((a, b) => (b.ex + b.im) - (a.ex + a.im)).slice(0, 7);

const INK = '#0f172a', SUB = '#64748b', GRID = '#e2e8f0', BG = '#ffffff', EXC = '#1d4ed8', IMC = '#f59e0b';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const ym = `${mm.slice(0, 4)}-${mm.slice(5, 7)}`;

function pairedChart() {
  const W = 768, H = 420, ML = 120, MR = 40, MT = 66, MB = 30;
  const iw = W - ML - MR, max = Math.max(...paired.map((p) => Math.max(p.ex, p.im))) * 1.12, step = (H - MT - MB) / paired.length, bh = Math.min(15, step * 0.32), scale = iw / max;
  let out = '';
  paired.forEach((p, i) => {
    const cy = MT + step * i + step / 2;
    const ye = cy - bh - 1, yi = cy + 1;
    out += `<text x="${ML - 10}" y="${(cy + 4).toFixed(1)}" text-anchor="end" font-size="12.5" fill="${INK}">${esc(p.en)}</text>`;
    out += `<rect x="${ML}" y="${ye.toFixed(1)}" width="${(p.ex * scale).toFixed(1)}" height="${bh}" fill="${EXC}"/><text x="${(ML + p.ex * scale + 5).toFixed(1)}" y="${(ye + bh - 1).toFixed(1)}" font-size="11" font-weight="700" fill="${EXC}">${p.ex}%</text>`;
    out += `<rect x="${ML}" y="${yi.toFixed(1)}" width="${(p.im * scale).toFixed(1)}" height="${bh}" fill="${IMC}"/><text x="${(ML + p.im * scale + 5).toFixed(1)}" y="${(yi + bh - 1).toFixed(1)}" font-size="11" font-weight="700" fill="${IMC}">${p.im}%</text>`;
  });
  const legend = `<rect x="${ML}" y="48" width="12" height="12" fill="${EXC}"/><text x="${ML + 17}" y="58" font-size="12" fill="${INK}">share of exports</text><rect x="${ML + 150}" y="48" width="12" height="12" fill="${IMC}"/><text x="${ML + 167}" y="58" font-size="12" fill="${INK}">share of imports</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="Georgia,'Times New Roman',serif" role="img" aria-label="Korea's top trading partners by share of exports versus share of imports, ${ym}">
<rect width="${W}" height="${H}" fill="${BG}"/><text x="${ML}" y="26" font-size="16" font-weight="700" fill="${INK}">Korea sells to two giants, but buys mostly from one</text>
<text x="${W - MR}" y="26" text-anchor="end" font-size="10" fill="${SUB}">Source: Korea Customs Service · ${ym}</text>
${legend}${out}</svg>`;
}
function curveChart() {
  const W = 768, H = 400, ML = 54, MR = 34, MT = 52, MB = 54;
  const iw = W - ML - MR, ih = H - MT - MB;
  const maxN = Math.max(ex.partners, im.partners);
  const x = (n) => ML + iw * (Math.log10(n) - 0) / (Math.log10(maxN) - 0);
  const y = (p) => MT + ih * (1 - p / 100);
  let grid = '';
  for (let t = 0; t <= 100; t += 20) grid += `<line x1="${ML}" y1="${y(t)}" x2="${W - MR}" y2="${y(t)}" stroke="${GRID}"/><text x="${ML - 8}" y="${y(t) + 4}" text-anchor="end" font-size="12" fill="${SUB}">${t}%</text>`;
  let xlab = '';
  for (const n of [1, 3, 10, 50, maxN]) xlab += `<text x="${x(n).toFixed(1)}" y="${H - MB + 22}" text-anchor="middle" font-size="11" fill="${SUB}">${n}</text>`;
  const line = (curve, col) => `<polyline points="${curve.map((c) => `${x(c.n).toFixed(1)},${y(c.pct).toFixed(1)}`).join(' ')}" fill="none" stroke="${col}" stroke-width="2.5"/>` + curve.map((c) => `<circle cx="${x(c.n).toFixed(1)}" cy="${y(c.pct).toFixed(1)}" r="2.6" fill="${col}"/>`).join('');
  const legend = `<rect x="${ML + 40}" y="${MT + 6}" width="12" height="12" fill="${EXC}"/><text x="${ML + 57}" y="${MT + 16}" font-size="12" fill="${INK}">exports</text><rect x="${ML + 130}" y="${MT + 6}" width="12" height="12" fill="${IMC}"/><text x="${ML + 147}" y="${MT + 16}" font-size="12" fill="${INK}">imports</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="Georgia,'Times New Roman',serif" role="img" aria-label="Cumulative share of Korea's trade by number of partners: four partners are half of both exports and imports">
<rect width="${W}" height="${H}" fill="${BG}"/><text x="${ML}" y="24" font-size="16" font-weight="700" fill="${INK}">Four partners are half of Korea's trade — either way</text>
<text x="${ML}" y="40" font-size="12" fill="${SUB}">Cumulative % of trade vs number of partners (log scale) · ${ym}</text>${grid}${xlab}${legend}
${line(ex.curve, EXC)}${line(im.curve, IMC)}
<text x="${(ML + iw / 2).toFixed(0)}" y="${H - 8}" text-anchor="middle" font-size="11" fill="${SUB}">number of partner countries (largest first)</text>
<text x="${W - MR}" y="${H - 8}" text-anchor="end" font-size="10" fill="${SUB}">Source: Korea Customs Service (via KOSIS)</text></svg>`;
}
fs.writeFileSync(path.join(CHARTS, 'trade-partner-shares.svg'), pairedChart());
fs.writeFileSync(path.join(CHARTS, 'trade-concentration-curve.svg'), curveChart());
fs.writeFileSync(path.join(ROOT, 'src/data/trade-concentration.json'), JSON.stringify({
  _왜: '수출·수입 목적지 집중도(점유율만). 절대 USD 는 스케일 불연속 있어 안 씀 — 점유율은 불연속 가로질러 안정.',
  month: ym, exports: { partners: ex.partners, top1: ex.top1, top2: ex.top2, top3: ex.top3, top5: ex.top5, top10: ex.top10, forHalf: ex.forHalf, for80: ex.for80 },
  imports: { partners: im.partners, top1: im.top1, top2: im.top2, top3: im.top3, top5: im.top5, top10: im.top10, forHalf: im.forHalf, for80: im.for80 },
  paired,
}, null, 1));
console.log(`✅ trade concentration · ${ym} · EX top2 ${ex.top2}% half@${ex.forHalf} · IM top1 ${im.top1}% half@${im.forHalf}`);
