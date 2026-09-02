#!/usr/bin/env node
/**
 * make-cvbd-dilution-chart.mjs — 「전환사채 실명 순위 — 금액 vs 잠재 희석률」.
 *   재료: archive/raw/dart-breaking/*.json 의 태그=convertible-bond 항목 +
 *   DART cvbdIsDecsn API 직접 호출 — 시세 아님, FSC 9/9 무관.
 *   ⭐ 희석률(cvisstk_tisstk_vs)은 DART 가 이미 계산해 준다 — 우리가 다시 셈하지 않는다.
 * ⛔ 정정(기재정정) 건은 원본 접수만 쓴다.
 * 출력: public/charts/cvbd-dilution.svg · src/data/cvbd-filings.json
 */
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');
const DIR = path.join(ROOT, 'archive/raw/dart-breaking');
const CHARTS = path.join(ROOT, 'public/charts');
fs.mkdirSync(CHARTS, { recursive: true });

function 키읽기() {
  const 파일 = path.join(ROOT, '.env');
  if (!fs.existsSync(파일)) return process.env.DART_API_KEY ?? '';
  for (const line of fs.readFileSync(파일, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^DART_API_KEY\s*=\s*(.+)/);
    if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  }
  return process.env.DART_API_KEY ?? '';
}
const K = 키읽기();

export function 원문숫자(s) {
  if (s == null || s === '-' || s === '') return null;
  const n = Number(String(s).replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

/** cvbdIsDecsn 레코드 하나 → 표준형. 금액·희석률 없으면 null(0으로 안 채움) */
export function 표준화(rec, meta) {
  const 금액 = 원문숫자(rec.bd_fta);
  const 희석 = 원문숫자(rec.cvisstk_tisstk_vs);
  if (금액 == null) return null;
  return {
    ...meta, 조달총액: 금액, 희석률: 희석,
    표면금리: rec.bd_intr_ex ?? null, 만기금리: rec.bd_intr_sf ?? null,
    발행방식: rec.bdis_mthn ?? null, 종류: rec.bd_knd ?? null,
    전환가: 원문숫자(rec.cv_prc), 전환청구시작: rec.cvrqpd_bgd ?? null,
  };
}

/** YYYYMMDD 문자열에 며칠을 더하거나 뺀다(달력 경계 넘어도 맞게) */
export function 날짜이동(yyyymmdd, 일수) {
  const y = +yyyymmdd.slice(0, 4), m = +yyyymmdd.slice(4, 6), d = +yyyymmdd.slice(6, 8);
  const dt = new Date(Date.UTC(y, m - 1, d + 일수));
  return `${dt.getUTCFullYear()}${String(dt.getUTCMonth() + 1).padStart(2, '0')}${String(dt.getUTCDate()).padStart(2, '0')}`;
}

/**
 * ⛔⛔ 2026-09-02 발견한 결함 — 이 창이 «20260801~20260901»로 못박혀 있었다.
 * 그래서 9/2 이후 접수된 전환사채는 (경보시스템이 후보로는 잡아도) 이 API 호출에서
 * 영원히 «API실패»로 나왔다 — 진짜 API 오류가 아니라 창 밖이었을 뿐이다.
 * 며칠씩 raw는 늘고 rows는 그대로였던 것이 이 결함 때문이었다(due-체크 헛불 원인 하나 더 찾음).
 * 고침 — 우리가 이미 아는 «접수일»(t.날짜) 중심으로 ±5일 창을 쓴다. 못박지 않는다.
 */
async function cvbdIsDecsn(corp_code, 접수일) {
  const bgn_de = 날짜이동(접수일, -5), end_de = 날짜이동(접수일, 5);
  const url = `https://opendart.fss.or.kr/api/cvbdIsDecsn.json?crtfc_key=${K}&corp_code=${corp_code}&bgn_de=${bgn_de}&end_de=${end_de}`;
  const r = await fetch(url);
  const j = await r.json();
  return j.status === '000' ? (j.list || []) : [];
}

if (process.argv.includes('--자가시험')) {
  let 통과 = 0, 실패 = 0;
  const 검 = (m, ok) => { if (ok) 통과++; else { 실패++; console.log('  ❌', m); } };
  검('며칠 더하기(월 안)', 날짜이동('20260902', 5) === '20260907');
  검('며칠 빼기(월 안)', 날짜이동('20260902', -5) === '20260828');
  검('월 경계를 넘는다', 날짜이동('20260831', 2) === '20260902');
  검('연 경계를 넘는다', 날짜이동('20261230', 5) === '20270104');
  검('⛔ 2026-09-02 실제 결함 사례 — 9/2 접수건이 자기 창 안에 든다', (() => {
    const 접수일 = '20260902';
    const bgn = 날짜이동(접수일, -5), end = 날짜이동(접수일, 5);
    return bgn <= 접수일 && 접수일 <= end;
  })());
  console.log(실패 === 0 ? `✅ 자가시험 — 통과 ${통과} · 실패 0` : `❌ 자가시험 — 통과 ${통과} · 실패 ${실패}`);
  process.exit(실패 === 0 ? 0 : 1);
}

async function main() {
  if (!K) { console.log('⛔ DART_API_KEY 없음.'); process.exit(1); }
  if (!fs.existsSync(DIR)) { console.log('⚠ 못 쟀다 — archive/raw/dart-breaking 없음.'); process.exit(0); }
  const files = fs.readdirSync(DIR).filter((f) => /^\d{8}\.json$/.test(f)).sort();
  if (!files.length) { console.log('⚠ 못 쟀다 — dart-breaking 파일 없음.'); process.exit(0); }

  const seen = new Set(); const targets = [];
  for (const f of files) {
    const d = f.replace('.json', '');
    const j = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
    for (const x of (j.후보 || [])) {
      if (x.태그 !== 'convertible-bond' || x.정정) continue;
      if (seen.has(x.corp_code)) continue;
      seen.add(x.corp_code);
      targets.push({ corp: x.corp, corp_code: x.corp_code, rcept: x.rcept, 날짜: d });
    }
  }
  if (!targets.length) { console.log('⚠ 못 쟀다 — convertible-bond(원본) 0건.'); process.exit(0); }

  const rows = []; let 실패 = 0;
  for (const t of targets) {
    let list;
    try { list = await cvbdIsDecsn(t.corp_code, t.날짜); } catch { 실패++; continue; }
    const rec = list.find((r) => r.rcept_no === t.rcept) || list[list.length - 1];
    if (!rec) { 실패++; continue; }
    const row = 표준화(rec, t);
    if (!row) continue;
    rows.push(row);
    await new Promise((r) => setTimeout(r, 120));
  }
  if (!rows.length) { console.log('⚠ 못 쟀다 — 금액 있는 전환사채 0건.'); process.exit(0); }
  rows.sort((a, b) => b.조달총액 - a.조달총액);

  const 억 = (won) => +(won / 1e8).toFixed(1);
  console.log(`✅ 전환사채 실명 ${rows.length}곳(대상 ${targets.length}·API실패 ${실패}) · 1위 ${rows[0].corp} ₩${억(rows[0].조달총액)}억 희석${rows[0].희석률 ?? '못잼'}%`);
  fs.writeFileSync(path.join(ROOT, 'src/data/cvbd-filings.json'), JSON.stringify({
    window: { from: files[0].replace('.json', ''), to: files.at(-1).replace('.json', '') },
    대상: targets.length, API실패: 실패, rows,
  }, null, 1));

  const INK = '#0f172a', SUB = '#64748b', BG = '#ffffff', ACC = '#1d4ed8', DIL = '#b91c1c';
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const top = rows;
  const W = 768, H = 60 + top.length * 34 + 40, ML = 190, MR = 90, MT = 56, MB = 30;
  const iw = W - ML - MR, max = 억(top[0].조달총액), step = (H - MT - MB) / top.length, bh = Math.min(24, step * 0.6), scale = iw / max;
  let bars = '';
  top.forEach((r, i) => {
    const cy = MT + step * i + step / 2, amt = 억(r.조달총액), w = amt * scale;
    const dilTxt = r.희석률 != null ? `${r.희석률}% dilution` : 'dilution: n/a';
    bars += `<rect x="${ML}" y="${(cy - bh / 2).toFixed(1)}" width="${w.toFixed(1)}" height="${bh}" fill="${ACC}" rx="2"/>` +
      `<text x="${ML - 10}" y="${(cy + 4).toFixed(1)}" text-anchor="end" font-size="11.5" fill="${INK}">${esc(r.corp)}</text>` +
      `<text x="${(ML + w + 6).toFixed(1)}" y="${(cy + 4).toFixed(1)}" font-size="11" font-weight="700" fill="${DIL}">₩${amt}억 · ${dilTxt}</text>`;
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="Georgia,'Times New Roman',serif" role="img" aria-label="Korean convertible-bond filings this week, ranked by amount raised, with each filing's potential dilution on conversion">
<rect width="${W}" height="${H}" fill="${BG}"/>
<text x="20" y="26" font-size="16" font-weight="700" fill="${INK}">A convertible bond pays almost no interest — the option is the return</text>
<text x="20" y="42" font-size="12" fill="${SUB}">Korean convertible-bond filings, ${files[0].slice(0,4)}-${files[0].slice(4,6)}-${files[0].slice(6,8)} to ${files.at(-1).slice(0,4)}-${files.at(-1).slice(4,6)}-${files.at(-1).slice(6,8)}, ranked by won raised</text>
${bars}
<text x="${W - MR}" y="${H - 8}" text-anchor="end" font-size="10" fill="${SUB}">Source: DART (Financial Supervisory Service), convertible-bond decision filings</text>
</svg>`;
  fs.writeFileSync(path.join(CHARTS, 'cvbd-dilution.svg'), svg);
}
main();
