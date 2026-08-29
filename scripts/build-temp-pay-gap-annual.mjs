#!/usr/bin/env node
/**
 * build-temp-pay-gap-annual.mjs — **상용 vs 임시일용 임금 격차, 연도별** (사업체노동력조사)
 *
 * ── 왜 (2026-08-30) ─────────────────────────────────────────────
 * 노동 클러스터를 «이중노동시장»(regular vs temporary) 축으로 넓힌다. 재현 가능·시세 무관(9/9 안전).
 * itmId: 13103110311MD_13 상용임금총액 · 13103110311MD_17 임시일용임금총액.
 * 격차 = 임시일용 ÷ 상용(%). ⛔ 원인(계약형태·업종) 단정 안 함 — 계열은 값을 담지 이유를 담지 않는다.
 * 표 세 겹(임금과 같은 표): MON041·051·054. ⛔ 키 출력·커밋 안 함.
 *
 *   node scripts/build-temp-pay-gap-annual.mjs        # 받아 저장 + 차트
 *   node scripts/build-temp-pay-gap-annual.mjs --dry · --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');

/** 월별 {상용,임시} → 연도별 {상용평균,임시평균,비율%,개월}. ⛔ 빈 해·불완전 짝 제외 */
export function 연도별(월별) {
  const 통 = {};
  for (const [월, v] of Object.entries(월별)) {
    if (!v || !Number.isFinite(v.상용) || !Number.isFinite(v.임시) || v.상용 <= 0) continue;
    const y = 월.slice(0, 4); (통[y] ??= { 상용: [], 임시: [] });
    통[y].상용.push(v.상용); 통[y].임시.push(v.임시);
  }
  const 낸다 = {};
  for (const [y, t] of Object.entries(통)) {
    if (t.상용.length !== 12) continue;
    const 상 = Math.round(t.상용.reduce((a, b) => a + b, 0) / 12);
    const 임 = Math.round(t.임시.reduce((a, b) => a + b, 0) / 12);
    낸다[y] = { 상용: 상, 임시: 임, 비율: Math.round((임 / 상) * 1000) / 10 };
  }
  return 낸다;
}

if (process.argv.includes('--자가시험') || process.argv.includes('--selftest')) {
  let 셈 = 0; const 본다 = (m, ok) => { 셈++; console.log(ok ? '✅' : '🔴', m); if (!ok) process.exitCode = 1; };
  const 월 = {}; for (let i = 1; i <= 12; i++) { const m = '2020' + String(i).padStart(2, '0'); 월[m] = { 상용: 300, 임시: 120 }; }
  const y = 연도별(월);
  본다('① 연평균·비율', y['2020'].상용 === 300 && y['2020'].임시 === 120 && y['2020'].비율 === 40);
  본다('② ⛔ 불완전 해(12개월 아님) 제외', !('2019' in 연도별({ '201901': { 상용: 300, 임시: 120 } })));
  본다('③ ⛔ 상용 0 제외', !('2018' in 연도별({ '201801': { 상용: 0, 임시: 1 } })));
  console.log(`\n${process.exitCode ? '❌' : '✅'} build-temp-pay-gap-annual 자가시험 (${셈})`);
  process.exit();
}

const 시늉 = process.argv.includes('--dry');
const KEY = fs.readFileSync(path.join(ROOT, '.env'), 'utf8').match(/^KOSIS_API_KEY=(.+)$/m)?.[1]?.trim();
if (!KEY) throw new Error('.env 에 KOSIS_API_KEY 없다');
const 받기 = async (tbl, obj, itm, n) => {
  const u = `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${KEY}&orgId=118&tblId=${tbl}&itmId=${itm}&objL1=${obj}&objL2=size01&format=json&jsonVD=Y&prdSe=M&newEstPrdCnt=${n}`;
  const r = await fetch(u, { signal: AbortSignal.timeout(30000) }); const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { throw new Error(`${tbl}/${itm} JSON아님`); }
  if (j?.err) throw new Error(`${tbl}/${itm} err ${j.err}`); if (!Array.isArray(j)) throw new Error(`${tbl}/${itm} 답 이상`);
  return j;
};
const 뽑기 = (rows) => { const o = {}; for (const r of rows) if (r.C1_NM === '전체' && r.C2_NM === '전규모(1인이상)' && r.DT != null && r.DT !== '') o[r.PRD_DE] = Number(r.DT); return o; };
const 상용 = {}, 임시 = {};
for (const [tbl, obj, n] of [['DT_118N_MON041', '15118INDUSTRY_9S0', 200], ['DT_118N_MON051', '190326INDUSTRY_10S0', 120], ['DT_118N_MON054', '260225INDUSTRY_11S0', 24]]) {
  Object.assign(상용, 뽑기(await 받기(tbl, obj, '13103110311MD_13', n)));
  Object.assign(임시, 뽑기(await 받기(tbl, obj, '13103110311MD_17', n)));
}
const 월별 = {}; for (const m of Object.keys(상용)) if (임시[m] != null) 월별[m] = { 상용: 상용[m], 임시: 임시[m] };
const 연 = 연도별(월별);
const 완결 = Object.keys(연).sort();
console.log(`상용 vs 임시일용 임금 — 완결연도 ${완결[0]}~${완결.at(-1)}`);
for (const y of 완결) console.log(`  ${y}: 상용 ${연[y].상용.toLocaleString()} · 임시 ${연[y].임시.toLocaleString()} · 임시/상용 ${연[y].비율}%`);

if (시늉) { console.log('\n--dry'); process.exit(0); }
const 출처 = { 이름: '국가데이터처 KOSIS · 고용노동부 사업체노동력조사', 항목: '상용임금총액 MD_13 · 임시일용임금총액 MD_17', 표: 'DT_118N_MON041·051·054', 모수: '전산업·전규모·1인당 월평균', 이용허락범위: 'KOSIS 약관 제8조 상업적 활용 가능' };
fs.writeFileSync(path.join(ROOT, 'src', 'data', 'korea-temp-pay-gap.json'), JSON.stringify({ 출처, 받은때: new Date().toISOString().slice(0, 10), 연도별: 연 }, null, 1));

// 차트 — 임시/상용 비율(%) 연도별
const xs = 완결, vals = xs.map((y) => 연[y].비율);
const W = 720, H = 340, pad = 48;
const lo = Math.floor(Math.min(...vals) / 5) * 5 - 5, hi = Math.ceil(Math.max(...vals) / 5) * 5;
const X = (i) => pad + (i / (xs.length - 1)) * (W - pad * 2), Y = (v) => H - pad - ((v - lo) / (hi - lo)) * (H - pad * 2);
const line = xs.map((y, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(연[y].비율).toFixed(1)}`).join(' ');
const dots = xs.map((y, i) => `<circle cx="${X(i).toFixed(1)}" cy="${Y(연[y].비율).toFixed(1)}" r="3" fill="#0b6"/>`).join('');
const xlab = xs.map((y, i) => (i % 2 === 0 || i === xs.length - 1) ? `<text x="${X(i).toFixed(1)}" y="${H - pad + 18}" font-size="11" text-anchor="middle" fill="#555">${y}</text>` : '').join('');
const ylab = [lo, Math.round((lo + hi) / 2), hi].map((v) => `<text x="${pad - 8}" y="${Y(v).toFixed(1) + 4}" font-size="11" text-anchor="end" fill="#555">${v}%</text>`).join('');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Temporary workers' pay as a share of regular workers', Korea"><rect width="${W}" height="${H}" fill="#fff"/><text x="${pad}" y="26" font-size="14" fill="#111" font-weight="600">Temp workers' pay as a share of regular workers' — Korea</text><line x1="${pad}" y1="${H - pad}" x2="${W - pad}" y2="${H - pad}" stroke="#ccc"/><line x1="${pad}" y1="${pad}" x2="${pad}" y2="${H - pad}" stroke="#ccc"/>${ylab}${xlab}<path d="${line}" fill="none" stroke="#0b6" stroke-width="2"/>${dots}<text x="${W - pad}" y="${H - 8}" font-size="10" text-anchor="end" fill="#999">Source: KOSIS · Survey on Labor Force at Establishments</text></svg>`;
fs.writeFileSync(path.join(ROOT, 'public', 'charts', 'korea-temp-pay-gap.svg'), svg);
console.log('\n저장: src/data/korea-temp-pay-gap.json · public/charts/korea-temp-pay-gap.svg');
