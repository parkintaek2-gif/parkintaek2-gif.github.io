#!/usr/bin/env node
/**
 * build-bonus-share-annual.mjs — **한국 급여에서 «특별급여(보너스)»가 차지하는 몫, 연도별 + 어느 달에 몰리나**
 *
 * ── 왜 (2026-08-29) ─────────────────────────────────────────────
 * 실질임금 기사(korea-real-wages-flat-since-2021)가 「월별 수치는 보너스 때문에 출렁인다」고
 * 했다 — 그 «보너스»를 정면으로 재는 후속. 사업체노동력조사(이미 배선)로 재현 가능·시세 무관(9/9 안전).
 * 남들이 안 쓴 축: 「보너스가 연봉의 몇 %이고 어느 달에 몰리나」.
 * ⛔ 원인(성과급 문화 등) 단정 안 함 — 계열은 몫을 담지 이유를 담지 않는다.
 *
 * ── 원천 ────────────────────────────────────────────────────────
 * 118 사업체노동력조사, 상용근로자, 전산업·전규모. itmId:
 *   13103110311MD_16 = 상용특별급여(보너스)   ·   13103110311MD_13 = 상용임금총액
 * 표 세 겹(임금과 같은 표): MON041(9차) · MON051(10차) · MON054(11차)
 * 보너스 몫 = 특별급여 ÷ 임금총액.
 * ⛔ 키 출력·커밋 안 함. .env gitignore.
 *
 *   node scripts/build-bonus-share-annual.mjs         # 받아 저장 + 차트
 *   node scripts/build-bonus-share-annual.mjs --dry
 *   node scripts/build-bonus-share-annual.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');

/** 월별 {특별,총} → 연도별 보너스몫(%)과 개월수. ⛔ 빈 해는 안 넣는다 */
export function 연도별몫(월별) {
  const 통 = {};
  for (const [월, v] of Object.entries(월별)) {
    if (!v || !Number.isFinite(v.특별) || !Number.isFinite(v.총) || v.총 <= 0) continue;
    const y = 월.slice(0, 4);
    (통[y] ??= { 특별: 0, 총: 0, 개월: 0 });
    통[y].특별 += v.특별; 통[y].총 += v.총; 통[y].개월 += 1;
  }
  const 낸다 = {};
  for (const [y, t] of Object.entries(통)) 낸다[y] = { 몫: Math.round((t.특별 / t.총) * 1000) / 10, 개월: t.개월 };
  return 낸다;
}

/** 완결연도(12개월)에서, 한 해 보너스총액 중 각 «월»이 차지하는 평균 몫(%) — 어느 달에 몰리나 */
export function 달별집중(월별) {
  const 해별 = {};
  for (const [월, v] of Object.entries(월별)) {
    if (!v || !Number.isFinite(v.특별)) continue;
    const y = 월.slice(0, 4), m = 월.slice(4, 6);
    (해별[y] ??= {}); 해별[y][m] = v.특별;
  }
  const 완결 = Object.entries(해별).filter(([, mm]) => Object.keys(mm).length === 12);
  if (!완결.length) return null;
  const 합 = {}; for (let i = 1; i <= 12; i++) 합[String(i).padStart(2, '0')] = 0;
  for (const [, mm] of 완결) {
    const 해총 = Object.values(mm).reduce((a, b) => a + b, 0);
    if (해총 <= 0) continue;
    for (const [m, v] of Object.entries(mm)) 합[m] += (v / 해총) / 완결.length;
  }
  const 낸다 = {}; for (const [m, v] of Object.entries(합)) 낸다[m] = Math.round(v * 1000) / 10;
  return 낸다;
}

if (process.argv.includes('--자가시험') || process.argv.includes('--selftest')) {
  let 셈 = 0; const 본다 = (m, ok) => { 셈++; console.log(ok ? '✅' : '🔴', m); if (!ok) process.exitCode = 1; };
  const 월 = { '202001': { 특별: 10, 총: 100 }, '202002': { 특별: 30, 총: 130 }, '202101': { 특별: 20, 총: 200 } };
  const y = 연도별몫(월);
  본다('① 연도별 보너스몫', y['2020'].몫 === Math.round((40 / 230) * 1000) / 10 && y['2020'].개월 === 2);
  본다('② 다른 해 분리', y['2021'].몫 === 10 && y['2021'].개월 === 1);
  본다('③ ⛔ 총=0 은 안 셈', !('2019' in 연도별몫({ '201901': { 특별: 5, 총: 0 } })));
  const 완결월 = {}; for (let i = 1; i <= 12; i++) { const m = String(i).padStart(2, '0'); 완결월['2020' + m] = { 특별: i === 12 ? 120 : 0, 총: 100 }; }
  const d = 달별집중(완결월);
  본다('④ 12월 몰림 100%', d['12'] === 100 && d['01'] === 0);
  본다('⑤ 불완전 해는 null', 달별집중({ '202001': { 특별: 1, 총: 1 } }) === null);
  console.log(`\n${process.exitCode ? '❌' : '✅'} build-bonus-share-annual 자가시험 (${셈})`);
  process.exit();
}

const 시늉 = process.argv.includes('--dry');
const KEY = fs.readFileSync(path.join(ROOT, '.env'), 'utf8').match(/^KOSIS_API_KEY=(.+)$/m)?.[1]?.trim();
if (!KEY) throw new Error('.env 에 KOSIS_API_KEY 없다');
const 받기 = async (tbl, obj, itm, n) => {
  const u = `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${KEY}&orgId=118&tblId=${tbl}&itmId=${itm}&objL1=${obj}&objL2=size01&format=json&jsonVD=Y&prdSe=M&newEstPrdCnt=${n}`;
  const r = await fetch(u, { signal: AbortSignal.timeout(30000) });
  const t = await r.text(); let j; try { j = JSON.parse(t); } catch { throw new Error(`${tbl}/${itm} JSON아님`); }
  if (j?.err) throw new Error(`${tbl}/${itm} err ${j.err}`); if (!Array.isArray(j)) throw new Error(`${tbl}/${itm} 답 이상`);
  return j;
};
const 뽑기 = (rows) => { const o = {}; for (const r of rows) if (r.C1_NM === '전체' && r.C2_NM === '전규모(1인이상)' && r.DT != null && r.DT !== '') o[r.PRD_DE] = Number(r.DT); return o; };
const 특별 = {}, 총 = {};
for (const [tbl, obj, n] of [['DT_118N_MON041', '15118INDUSTRY_9S0', 200], ['DT_118N_MON051', '190326INDUSTRY_10S0', 120], ['DT_118N_MON054', '260225INDUSTRY_11S0', 24]]) {
  Object.assign(특별, 뽑기(await 받기(tbl, obj, '13103110311MD_16', n)));
  Object.assign(총, 뽑기(await 받기(tbl, obj, '13103110311MD_13', n)));
}
const 월별 = {}; for (const m of Object.keys(총)) if (특별[m] != null) 월별[m] = { 특별: 특별[m], 총: 총[m] };
const 연도별 = 연도별몫(월별); const 달집중 = 달별집중(월별);
const 최근달 = Object.keys(월별).sort().at(-1);
const 완결 = Object.entries(연도별).filter(([, v]) => v.개월 === 12).map(([y]) => y).sort();
console.log(`보너스 몫 — ${Object.keys(월별).sort()[0]}~${최근달} (${Object.keys(월별).length}개월)`);
for (const y of 완결) console.log(`  ${y}: 보너스 ${연도별[y].몫}%`);
console.log(`  달별 집중(완결연도 평균, 한 해 보너스 중 %): ${JSON.stringify(달집중)}`);

if (시늉) { console.log('\n--dry'); process.exit(0); }
const 출처 = { 이름: '국가데이터처 KOSIS · 고용노동부 사업체노동력조사', 항목: '상용특별급여 MD_16 ÷ 상용임금총액 MD_13', 표: 'DT_118N_MON041·051·054', 모수: '상용근로자 전산업·전규모', 이용허락범위: 'KOSIS 약관 제8조 상업적 활용 가능' };
fs.writeFileSync(path.join(ROOT, 'src', 'data', 'korea-bonus-share.json'), JSON.stringify({ 출처, 받은때: new Date().toISOString().slice(0, 10), 최근달, 연도별, 달집중 }, null, 1));

// 차트 — 달별 집중(막대): 어느 달에 보너스가 몰리나
const 달들 = Object.keys(달집중);
const W = 720, H = 340, pad = 48, bw = (W - pad * 2) / 12 * 0.7;
const hi = Math.ceil(Math.max(...Object.values(달집중)) / 5) * 5;
const X = (i) => pad + (i + 0.5) * ((W - pad * 2) / 12);
const Y = (v) => H - pad - (v / hi) * (H - pad * 2);
const bars = 달들.map((m, i) => `<rect x="${(X(i) - bw / 2).toFixed(1)}" y="${Y(달집중[m]).toFixed(1)}" width="${bw.toFixed(1)}" height="${(H - pad - Y(달집중[m])).toFixed(1)}" fill="${['12', '02'].includes(m) ? '#0b6' : '#8ab'}"/>`).join('');
const xlab = 달들.map((m, i) => `<text x="${X(i).toFixed(1)}" y="${H - pad + 16}" font-size="10" text-anchor="middle" fill="#555">${+m}</text>`).join('');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Share of the year's bonus pay falling in each month, Korea"><rect width="${W}" height="${H}" fill="#fff"/><text x="${pad}" y="26" font-size="14" fill="#111" font-weight="600">Which month the year's bonus lands in — Korea (avg of full years)</text><line x1="${pad}" y1="${H - pad}" x2="${W - pad}" y2="${H - pad}" stroke="#ccc"/>${bars}${xlab}<text x="${W - pad}" y="${H - 8}" font-size="10" text-anchor="end" fill="#999">Source: KOSIS · Survey on Labor Force at Establishments</text></svg>`;
fs.writeFileSync(path.join(ROOT, 'public', 'charts', 'korea-bonus-months.svg'), svg);
console.log('\n저장: src/data/korea-bonus-share.json · public/charts/korea-bonus-months.svg');
