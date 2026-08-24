#!/usr/bin/env node
/**
 * build-bond-yield-series.mjs — 국고채 수익률 «시계열» + 단기·장기 스프레드.
 *
 * ── 왜 (2026-08-25, 신조 자물쇠) ──────────────────────────────
 * rates 축이 얇고 실수요는 크다("korea yield curve"·"korea bond spread"). 하루치 곡선은
 * 이미 냈다(build-bond-yield-curve). 이제 collect-bonds 로 모은 여러 날을 시계열로 엮어
 * **곡선이 «어떻게 움직였나»**를 낸다 — 3y-10y·2y-10y 스프레드는 세계가 보는 지표다.
 *
 * ── ⚠ 정직 규칙 ───────────────────────────────────────────────
 * · 상장 국고채 종가수익률이다(한국은행 공식 장외 기준금리 아님) — 지면에 명시.
 * · 벤치마크 만기(1·2·3·5·10·20·30년)마다 잔존이 가장 가까운 종목. 못 맞추면 그 점은 «뺀다»(0 아님).
 * · 며칠 안 되면 «추세»라 부르지 않는다 — "이 기간에 이렇게 움직였다"까지만.
 * · 스프레드 = 장기(10y) - 단기(3y 또는 2y). 음수면 «역전»이라 사실대로 적는다.
 *
 * 출력: src/data/bond-yield-series.json + public/charts/bond-yield-spread.svg
 * archive 없으면 «못 쟀다» exit 0. 자가시험: node scripts/build-bond-yield-series.mjs --self-test
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAW_DIR = path.join(ROOT, 'archive', 'raw', 'bonds');
const OUT = path.join(ROOT, 'src', 'data', 'bond-yield-series.json');
const CHART = path.join(ROOT, 'public', 'charts', 'bond-yield-spread.svg');
const BENCH = [1, 2, 3, 5, 10, 20, 30];

export function parseMaturity(name) {
  if (!name) return null;
  const m = String(name).match(/국고[0-9]{4,6}-(\d{2})(\d{2})/);
  if (!m) return null;
  const mm = +m[2];
  if (mm < 1 || mm > 12) return null;
  return { year: 2000 + +m[1], month: mm };
}
const residual = (mat, asOf) => (mat ? (mat.year * 12 + mat.month - 1 - (asOf.year * 12 + asOf.month - 1)) / 12 : null);

function readRows(file) {
  const t = fs.readFileSync(file, 'utf8').trim();
  if (!t) return [];
  if (t[0] === '[') { try { return JSON.parse(t); } catch { /* fall */ } }
  return t.split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l));
}

/** 하루치 rows → 벤치마크 만기별 수익률 { '3': 3.6, '10': 4.37, ... }. */
function curveForDay(rows) {
  const date = String(rows[0]?.일자 || '').replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
  const asOf = { year: +date.slice(0, 4), month: +date.slice(5, 7) };
  const seen = new Set();
  const ktb = [];
  for (const r of rows) {
    const name = r.이름 || '';
    if (!/^국고/.test(name)) continue;
    const code = r.코드 || name;
    if (seen.has(code)) continue;
    seen.add(code);
    const y = Number(r.수익률);
    const ry = residual(parseMaturity(name), asOf);
    if (ry == null || ry <= 0 || !Number.isFinite(y) || y < 0.3 || y > 8) continue;
    ktb.push({ y, ry });
  }
  const yields = {};
  for (const t of BENCH) {
    let best = null;
    for (const b of ktb) { const d = Math.abs(b.ry - t); if (d <= t * 0.25 && (!best || d < best.d)) best = { y: b.y, d }; }
    if (best) yields[t] = +best.y.toFixed(3);
  }
  return { date, yields, ktbUsed: ktb.length };
}

function selfTest() {
  const rows = [
    { 일자: '20260821', 이름: '국고03125-2909(24-7)', 코드: 'a', 수익률: 3.82 }, // ~3y
    { 일자: '20260821', 이름: '국고03875-3609(16-6)', 코드: 'b', 수익률: 4.37 }, // ~10y
    { 일자: '20260821', 이름: '국고02625-2709(22-8)', 코드: 'c', 수익률: 3.60 }, // ~1y
  ];
  const c = curveForDay(rows);
  const ok = c.date === '2026-08-21' && Math.abs(c.yields[3] - 3.82) < 0.01 && Math.abs(c.yields[10] - 4.37) < 0.01;
  if (!ok) { console.error('❌ 자가시험 실패', c); process.exit(1); }
  const spread = +(c.yields[10] - c.yields[3]).toFixed(3);
  if (Math.abs(spread - 0.55) > 0.001) { console.error('❌ 스프레드 계산 틀림', spread); process.exit(1); }
  console.log('✅ 자가시험 통과 — 하루 곡선·스프레드(3y-10y) 계산 정상');
}

function main() {
  if (process.argv.includes('--self-test')) { selfTest(); return; }
  if (!fs.existsSync(RAW_DIR)) { console.log('«못 쟀다» — archive/raw/bonds 없음. exit 0'); return; }
  const files = fs.readdirSync(RAW_DIR).filter((f) => /\d{8}/.test(f)).sort();
  if (!files.length) { console.log('«못 쟀다» — 채권 raw 0. exit 0'); return; }

  const series = [];
  for (const f of files) {
    const rows = readRows(path.join(RAW_DIR, f));
    if (!rows.length) continue;
    const c = curveForDay(rows);
    if (c.yields[3] == null || c.yields[10] == null) continue; // 스프레드 못 내는 날은 뺀다
    series.push({
      date: c.date,
      y1: c.yields[1] ?? null, y2: c.yields[2] ?? null, y3: c.yields[3], y5: c.yields[5] ?? null,
      y10: c.yields[10], y20: c.yields[20] ?? null, y30: c.yields[30] ?? null,
      spread3_10: +(c.yields[10] - c.yields[3]).toFixed(3),
      spread2_10: c.yields[2] != null ? +(c.yields[10] - c.yields[2]).toFixed(3) : null,
      ktbUsed: c.ktbUsed,
    });
  }
  series.sort((a, b) => a.date.localeCompare(b.date));
  if (series.length < 1) { console.log('«못 쟀다» — 스프레드 낼 수 있는 날 0. exit 0'); return; }

  const first = series[0], last = series[series.length - 1];
  const out = {
    source: 'Korea government bonds (KTB), listed close yields — data.go.kr getBondPriceInfo, T+1',
    note: 'Listed-KTB closing yields, not the Bank of Korea official reference rates. A short window, not a trend. Spread = 10-year minus 3-year (and minus 2-year); a negative value is an inversion.',
    days: series.length,
    from: first.date, to: last.date,
    latest: last,
    spread3_10_change_bp: Math.round((last.spread3_10 - first.spread3_10) * 100),
    series,
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
  writeChart(out);

  console.log(`✅ bond-yield-series · ${series.length}일(${first.date}~${last.date}) · 최신 3y ${last.y3}% · 10y ${last.y10}% · 3y-10y 스프레드 ${last.spread3_10}%p · 기간변화 ${out.spread3_10_change_bp}bp`);
}

function writeChart(out) {
  const s = out.series;
  const W = 720, H = 380, ML = 56, MR = 20, MT = 40, MB = 52;
  const sp = s.map((d) => d.spread3_10);
  const yMin = Math.min(...sp), yMax = Math.max(...sp);
  const pad = Math.max(0.05, (yMax - yMin) * 0.3);
  const lo = yMin - pad, hi = yMax + pad;
  const px = (i) => ML + (s.length === 1 ? 0.5 : i / (s.length - 1)) * (W - ML - MR);
  const py = (v) => MT + (1 - (v - lo) / (hi - lo || 1)) * (H - MT - MB);
  const ticks = [];
  for (let k = 0; k <= 4; k++) ticks.push(+(lo + (k / 4) * (hi - lo)).toFixed(2));
  const grid = ticks.map((v) => `<line x1="${ML}" y1="${py(v).toFixed(1)}" x2="${W - MR}" y2="${py(v).toFixed(1)}" stroke="#e6e6e3"/>` +
    `<text x="${ML - 8}" y="${(py(v) + 4).toFixed(1)}" text-anchor="end" font-size="12" fill="#666">${v.toFixed(2)}</text>`).join('');
  const xlab = s.map((d, i) => (i % Math.ceil(s.length / 6) === 0 || i === s.length - 1)
    ? `<text x="${px(i).toFixed(1)}" y="${H - MB + 20}" text-anchor="middle" font-size="11" fill="#666">${d.date.slice(5)}</text>` : '').join('');
  const line = s.map((d, i) => `${i ? 'L' : 'M'}${px(i).toFixed(1)},${py(d.spread3_10).toFixed(1)}`).join(' ');
  const dots = s.map((d, i) => `<circle cx="${px(i).toFixed(1)}" cy="${py(d.spread3_10).toFixed(1)}" r="3" fill="#0f4c81"/>`).join('');
  const zero = (lo < 0 && hi > 0) ? `<line x1="${ML}" y1="${py(0).toFixed(1)}" x2="${W - MR}" y2="${py(0).toFixed(1)}" stroke="#b4472a" stroke-dasharray="4 3"/>` : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="Georgia,'Times New Roman',serif">
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  <text x="${ML}" y="24" font-size="15" font-weight="700" fill="#111">Korea government bond 3y–10y yield spread (%pt) — ${out.from} to ${out.to}</text>
  ${grid}${zero}${xlab}
  <line x1="${ML}" y1="${MT}" x2="${ML}" y2="${H - MB}" stroke="#333"/>
  <line x1="${ML}" y1="${H - MB}" x2="${W - MR}" y2="${H - MB}" stroke="#333"/>
  <path d="${line}" fill="none" stroke="#0f4c81" stroke-width="2"/>${dots}
  <text x="${W - MR}" y="${H - 8}" text-anchor="end" font-size="10" fill="#999">Listed KTB close (data.go.kr), not the official reference rate · not advice</text>
</svg>
`;
  fs.mkdirSync(path.dirname(CHART), { recursive: true });
  fs.writeFileSync(CHART, svg);
}

main();
