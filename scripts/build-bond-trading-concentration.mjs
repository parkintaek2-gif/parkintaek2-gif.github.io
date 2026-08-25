#!/usr/bin/env node
/**
 * build-bond-trading-concentration.mjs — 상장 채권 «거래»가 몇 종목에 몰리나.
 *
 * ── 왜 (2026-08-25, 신조 자물쇠 · rates 축) ───────────────────
 * 집중도는 우리 프랜차이즈다(주식·무역). 채권에도 그대로 있다 — 오히려 더 극단이다.
 * 하루 호가가 잡힌 ~400개 채권 중 거래대금의 대부분이 손꼽는 국고채 지표물에 몰린다.
 * 영문으로 이 각을 낸 곳이 없다. 9일 내내 top10 이 98%대라 스냅샷이 아니라 «구조»다.
 *
 * ── ⚠ 정직 규칙 ───────────────────────────────────────────────
 * · 모수 = 그날 KRX 채권 파일에 «종가·거래대금이 잡힌» 종목(=호가 있던 것). 등록된 채권 전체가
 *   아니다 — 「호가 잡힌 채권의 거래대금 중」이라고 지면에 못박는다. (미거래분은 이 파일에 없다.)
 * · 거래대금(ACC_TRDVAL)은 KRX 집계값 그대로. 비율만 낸다(원 절대액은 곁가지).
 * · 국고=이름이 「국고」로 시작. 나머지(국민주택·지방채·특수채·회사채 등)는 «기타»로 묶는다.
 * · 하루는 스냅샷, 여러 날은 «이 기간 내내 이랬다»까지만 — 「추세」라 안 부른다.
 *
 * 출력: src/data/bond-trading-concentration.json + public/charts/bond-trading-concentration.svg
 * archive 없으면 «못 쟀다» exit 0. 자가시험: node scripts/build-bond-trading-concentration.mjs --self-test
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAW_DIR = path.join(ROOT, 'archive', 'raw', 'bonds');
const OUT = path.join(ROOT, 'src', 'data', 'bond-trading-concentration.json');
const CHART = path.join(ROOT, 'public', 'charts', 'bond-trading-concentration.svg');

const isKTB = (nm) => /^국고/.test(String(nm || ''));

// 한 파일 → 거래대금>0 인 종목의 {값, 국고여부} 배열
function readDay(file) {
  const out = [];
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line.trim()) continue;
    let j;
    try { j = JSON.parse(line); } catch { continue; }
    const v = parseFloat(j.거래대금);
    if (!isFinite(v) || v <= 0) continue;
    out.push({ v, ktb: isKTB(j.이름), nm: j.이름 });
  }
  return out;
}

// 한 날의 집중도 지표
export function concentration(rows) {
  const sorted = [...rows].sort((a, b) => b.v - a.v);
  const tot = sorted.reduce((a, b) => a + b.v, 0);
  if (tot <= 0) return null;
  const share = (n) => sorted.slice(0, n).reduce((a, b) => a + b.v, 0) / tot * 100;
  // 90% 도달에 필요한 종목 수
  let cum = 0, k90 = 0;
  for (const r of sorted) { cum += r.v; k90++; if (cum / tot >= 0.90) break; }
  const ktbShare = sorted.filter((r) => r.ktb).reduce((a, b) => a + b.v, 0) / tot * 100;
  return {
    issues: sorted.length,
    top1: +share(1).toFixed(1),
    top5: +share(5).toFixed(1),
    top10: +share(10).toFixed(1),
    k90,
    ktbShare: +ktbShare.toFixed(1),
    top3Names: sorted.slice(0, 3).map((r) => ({ name: r.nm, share: +(r.v / tot * 100).toFixed(1) })),
    totalTrillion: +(tot / 1e12).toFixed(2),
  };
}

function selfTest() {
  // 100 종목: 1개가 90, 나머지 99개가 각 0.1 (합 9.9) → top1≈90.1%, 90% 도달에 1종목
  const rows = [{ v: 90, ktb: true, nm: '국고TEST' }];
  for (let i = 0; i < 99; i++) rows.push({ v: 0.1, ktb: false, nm: '기타' + i });
  const c = concentration(rows);
  const ok = c.issues === 100 && c.k90 === 1 && c.top1 > 90 && c.ktbShare > 90;
  // 균등 10종목 → top1=10%, 90%에 9종목
  const even = concentration(Array.from({ length: 10 }, (_, i) => ({ v: 1, ktb: false, nm: 'x' + i })));
  const ok2 = even.top1 === 10 && even.k90 === 9;
  if (ok && ok2) { console.log('✅ 자가시험 통과 — 집중/균등 두 경우'); process.exit(0); }
  console.error('❌ 자가시험 실패', JSON.stringify({ c, even })); process.exit(1);
}

function bar(shares, labels) {
  const W = 720, H = 300, ML = 50, MR = 20, MT = 30, MB = 60;
  const iw = W - ML - MR, ih = H - MT - MB;
  const max = 100;
  const px = (i) => ML + (iw / shares.length) * (i + 0.5);
  const py = (v) => MT + ih * (1 - v / max);
  const bw = iw / shares.length * 0.6;
  const bars = shares.map((v, i) => {
    const x = px(i) - bw / 2, y = py(v), h = MT + ih - y;
    const fill = i === shares.length - 1 ? '#c9c9c4' : '#2b4a6f';
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" fill="${fill}"/>` +
      `<text x="${px(i).toFixed(1)}" y="${(y - 6).toFixed(1)}" text-anchor="middle" font-size="15" fill="#111">${v.toFixed(1)}%</text>` +
      `<text x="${px(i).toFixed(1)}" y="${(H - MB + 20).toFixed(1)}" text-anchor="middle" font-size="13" fill="#444">${labels[i]}</text>`;
  }).join('\n  ');
  const grid = [0, 25, 50, 75, 100].map((v) => `<line x1="${ML}" y1="${py(v).toFixed(1)}" x2="${W - MR}" y2="${py(v).toFixed(1)}" stroke="#e6e6e3"/><text x="${ML - 8}" y="${(py(v) + 4).toFixed(1)}" text-anchor="end" font-size="12" fill="#888">${v}</text>`).join('\n  ');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="Georgia,'Times New Roman',serif">
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  ${grid}
  ${bars}
  <line x1="${ML}" y1="${MT}" x2="${ML}" y2="${H - MB}" stroke="#333"/>
  <line x1="${ML}" y1="${H - MB}" x2="${W - MR}" y2="${H - MB}" stroke="#333"/>
</svg>`;
}

function main() {
  if (process.argv.includes('--self-test')) return selfTest();
  if (!fs.existsSync(RAW_DIR)) { console.log('못 쟀다 — archive/raw/bonds 없음'); process.exit(0); }
  const files = fs.readdirSync(RAW_DIR).filter((f) => f.endsWith('.ndjson')).sort();
  if (!files.length) { console.log('못 쟀다 — 파일 0'); process.exit(0); }

  const series = [];
  for (const f of files) {
    const c = concentration(readDay(path.join(RAW_DIR, f)));
    if (c) series.push({ date: f.replace('.ndjson', ''), top10: c.top10, ktbShare: c.ktbShare, k90: c.k90, issues: c.issues });
  }
  const latestFile = files[files.length - 1];
  const latest = concentration(readDay(path.join(RAW_DIR, latestFile)));
  const asOf = latestFile.replace('.ndjson', '');

  const top10s = series.map((s) => s.top10);
  const ktbs = series.map((s) => s.ktbShare);
  const out = {
    _왜: '상장 채권(호가 잡힌 것)의 거래대금이 몇 종목에 몰리나. 집중도 프랜차이즈의 채권판.',
    asOf, days: series.length,
    latest,
    range: {
      top10Min: Math.min(...top10s), top10Max: Math.max(...top10s),
      ktbMin: Math.min(...ktbs), ktbMax: Math.max(...ktbs),
    },
    series,
  };
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));

  // 차트: top1 / top2–5 / top6–10 / 나머지
  const t1 = latest.top1, t5 = latest.top5, t10 = latest.top10;
  const shares = [t1, +(t5 - t1).toFixed(1), +(t10 - t5).toFixed(1), +(100 - t10).toFixed(1)];
  const labels = ['#1', '#2–5', '#6–10', `rest (${latest.issues - 10})`];
  fs.mkdirSync(path.dirname(CHART), { recursive: true });
  fs.writeFileSync(CHART, bar(shares, labels));

  console.log(`✅ ${asOf} · 호가채권 ${latest.issues}종목 · ${latest.totalTrillion}조`);
  console.log(`   top1 ${latest.top1}% top5 ${latest.top5}% top10 ${latest.top10}% · 90%까지 ${latest.k90}종목 · 국고 ${latest.ktbShare}%`);
  console.log(`   ${series.length}일 range: top10 ${out.range.top10Min}–${out.range.top10Max}% · 국고 ${out.range.ktbMin}–${out.range.ktbMax}%`);
  console.log(`   → ${OUT} · ${CHART}`);
}

main();
