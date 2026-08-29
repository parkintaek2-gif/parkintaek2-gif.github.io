#!/usr/bin/env node
/**
 * build-workdays-annual.mjs — **한국 근로자 1인당 월평균 근로시간, 연도별** (사업체노동력조사)
 *
 * ── 왜 (2026-08-29) ─────────────────────────────────────────────
 * 노동 클러스터(청년실업·실질임금·기업규모별임금)를 잇는 롱테일. 「한국인은 몇 시간
 * 일하나」는 영어권에서 꾸준히 검색되고, AI가 인용하기 좋은 «단정 사실 + 출처 + 재현 수치»
 * 형이다. 2번이 신규 롱테일 우선을 승인(2026-08-29). ⚠ 시세 무관 = 9/9 제4유형 안전.
 *
 * ── 원천 ────────────────────────────────────────────────────────
 * 임금과 같은 표(사업체노동력조사)가 근로시간도 담는다 — itmId 만 다르다:
 *   13103110311MD_4 = 전체근로일수(상용+임시일용, 근로자 1인당 월평균, 시간)
 * 산업분류 개정 세 겹을 잇는다(임금 수집기와 같은 표):
 *   118/DT_118N_MON041  9차   2011-01~2019-12
 *   118/DT_118N_MON051  10차  2020-01~2025-12
 *   118/DT_118N_MON054  11차  2026-01~
 * ⚠ 월별은 조업일수·명절로 크게 튄다(2월 ~132h, 7월 ~168h) — 연평균이 이걸 상쇄한다.
 * ⚠ 이 표는 «사업체노동력조사»(상용 1인이상 사업체) 값이라 OECD 연간노동시간과 모수가
 *   달라 숫자가 다르다. OECD 수치를 갖다 붙이지 않는다 — 우리가 잰 표만 말한다.
 * ⛔ 키를 출력·커밋하지 않는다. .env 는 gitignore.
 *
 *   node scripts/build-workdays-annual.mjs        # 받아 저장 + 차트
 *   node scripts/build-workdays-annual.mjs --dry  # 저장 안 하고 재기만
 *   node scripts/build-workdays-annual.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');

/** 월별 시간 → 연도별 평균(개월수와 함께). ⛔ 빈 해는 넣지 않는다(0으로 안 채운다) */
export function 연도별평균(월별) {
  const 통 = {};
  for (const [월, 값] of Object.entries(월별)) {
    if (!Number.isFinite(값)) continue;
    (통[월.slice(0, 4)] ??= []).push(값);
  }
  const 낸다 = {};
  for (const [연, 배열] of Object.entries(통))
    낸다[연] = { 평균: Math.round((배열.reduce((a, b) => a + b, 0) / 배열.length) * 10) / 10, 개월수: 배열.length };
  return 낸다;
}

/** 이음매(산업분류 개정 경계)에서 튀는가 — 15% 넘으면 이상 */
export function 이음매검사(월별, 쌍들) {
  return 쌍들.map(([전, 후]) => {
    const a = 월별[전], b = 월별[후];
    const 변화율 = (a && b) ? Math.round(((b / a) - 1) * 1000) / 10 : null;
    return { 전, 후, 변화율 };
  });
}

if (process.argv.includes('--자가시험') || process.argv.includes('--selftest')) {
  let 셈 = 0; const 본다 = (m, ok) => { 셈++; console.log(ok ? '✅' : '🔴', m); if (!ok) process.exitCode = 1; };
  const 월 = { '201501': 180, '201502': 140, '201512': 160, '202501': 170, '202502': 130 };
  const y = 연도별평균(월);
  본다('① 연평균 낸다', y['2015'].평균 === 160 && y['2015'].개월수 === 3);
  본다('② 다른 해 분리', y['2025'].평균 === 150 && y['2025'].개월수 === 2);
  본다('③ ⛔ 빈 해는 없다', !('2020' in y));
  본다('④ NaN 은 안 센다', 연도별평균({ '202601': NaN, '202602': 100 })['2026'].개월수 === 1);
  const s = 이음매검사({ '201912': 164, '202001': 150 }, [['201912', '202001']]);
  본다('⑤ 이음매 변화율', s[0].변화율 === -8.5);
  본다('⑥ 한쪽 없으면 못잼(null)', 이음매검사({ '201912': 164 }, [['201912', '202001']])[0].변화율 === null);
  console.log(`\n${process.exitCode ? '❌' : '✅'} build-workdays-annual 자가시험 (${셈})`);
  process.exit();
}

const 시늉 = process.argv.includes('--dry');
const KEY = fs.readFileSync(path.join(ROOT, '.env'), 'utf8').match(/^KOSIS_API_KEY=(.+)$/m)?.[1]?.trim();
if (!KEY) throw new Error('.env 에 KOSIS_API_KEY 가 없다');

const ITM = '13103110311MD_4'; // 전체근로일수(근로자 1인당 월평균, 시간)
const 받기 = async (tblId, objL1, n) => {
  const u = `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${KEY}`
    + `&orgId=118&tblId=${tblId}&itmId=${ITM}&objL1=${objL1}&objL2=size01&format=json&jsonVD=Y&prdSe=M&newEstPrdCnt=${n}`;
  const r = await fetch(u, { signal: AbortSignal.timeout(30000) });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { throw new Error(`${tblId} JSON 아님: ${t.slice(0, 150)}`); }
  if (j?.err) throw new Error(`${tblId} err ${j.err} ${j.errMsg}`);
  if (!Array.isArray(j)) throw new Error(`${tblId} 답: ${JSON.stringify(j).slice(0, 150)}`);
  return j;
};

const t9 = await 받기('DT_118N_MON041', '15118INDUSTRY_9S0', 200);
const t10 = await 받기('DT_118N_MON051', '190326INDUSTRY_10S0', 120);
const t11 = await 받기('DT_118N_MON054', '260225INDUSTRY_11S0', 24);

const 월별 = {};
for (const r of [...t9, ...t10, ...t11])
  if (r.C1_NM === '전체' && r.C2_NM === '전규모(1인이상)' && r.DT != null && r.DT !== '')
    월별[r.PRD_DE] = Number(r.DT);

const 연도별 = 연도별평균(월별);
const 이음매 = 이음매검사(월별, [['201912', '202001'], ['202512', '202601']]);
const 이음매이상 = 이음매.filter((x) => x.변화율 != null && Math.abs(x.변화율) > 15);
const 최근달 = Object.keys(월별).sort().at(-1);
const 완결해 = Object.entries(연도별).filter(([, v]) => v.개월수 === 12).map(([y]) => y).sort();
const 첫해 = 완결해[0], 끝해 = 완결해.at(-1);

console.log(`근로일수 — ${Object.keys(월별).sort()[0]}~${최근달} (${Object.keys(월별).length}개월)`);
console.log(`  🔴 이음매 검사(±15% 밖이면 이상): ${JSON.stringify(이음매)} → ${이음매이상.length ? '⚠ 이상 ' + 이음매이상.length : '이상 없음'}`);
console.log(`  완결연도 ${첫해}(${연도별[첫해].평균}h) → ${끝해}(${연도별[끝해].평균}h) = ${(((연도별[끝해].평균 / 연도별[첫해].평균) - 1) * 100).toFixed(1)}%`);
for (const y of 완결해) console.log(`    ${y}: ${연도별[y].평균}h/월 (연 ${Math.round(연도별[y].평균 * 12).toLocaleString()}h)`);

if (시늉) { console.log('\n--dry 라 저장 안 함'); process.exit(0); }

const 출처 = {
  이름: '국가데이터처 KOSIS · 고용노동부 「사업체노동력조사」',
  표: { '9차': '118/DT_118N_MON041 (2011~2019)', '10차': '118/DT_118N_MON051 (2020~2025)', '11차': '118/DT_118N_MON054 (2026~)' },
  항목: '전체근로일수 13103110311MD_4 (상용+임시일용, 근로자 1인당 월평균, 일)',
  모수: '전산업 · 상용근로자 1인 이상 사업체 · 전규모',
  이용허락범위: 'KOSIS 통계정보 활용약관 제8조 — 상업적 활용 가능',
};
fs.writeFileSync(path.join(ROOT, 'src', 'data', 'korea-workdays.json'),
  JSON.stringify({ 출처, 받은때: new Date().toISOString().slice(0, 10), 최근달, 이음매, 월별, 연도별 }, null, 1));

// 차트 — 완결연도만(부분해는 비교 불가라 뺀다)
const W = 720, H = 340, pad = 48;
const xs = 완결해;
const vals = xs.map((y) => 연도별[y].평균);
const lo = Math.floor(Math.min(...vals) / 5) * 5 - 5, hi = Math.ceil(Math.max(...vals) / 5) * 5;
const X = (i) => pad + (i / (xs.length - 1)) * (W - pad * 2);
const Y = (v) => H - pad - ((v - lo) / (hi - lo)) * (H - pad * 2);
const line = xs.map((y, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(연도별[y].평균).toFixed(1)}`).join(' ');
const dots = xs.map((y, i) => `<circle cx="${X(i).toFixed(1)}" cy="${Y(연도별[y].평균).toFixed(1)}" r="3" fill="#0b6"/>`).join('');
const xlab = xs.map((y, i) => (i % 2 === 0 || i === xs.length - 1) ? `<text x="${X(i).toFixed(1)}" y="${H - pad + 18}" font-size="11" text-anchor="middle" fill="#555">${y}</text>` : '').join('');
const ylab = [lo, Math.round((lo + hi) / 2), hi].map((v) => `<text x="${pad - 8}" y="${Y(v).toFixed(1) + 4}" font-size="11" text-anchor="end" fill="#555">${v}</text>`).join('');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Korea average monthly days worked per worker, ${첫해}-${끝해}">
<rect width="${W}" height="${H}" fill="#fff"/>
<text x="${pad}" y="26" font-size="14" fill="#111" font-weight="600">Average monthly days worked per worker — Korea, ${첫해}–${끝해}</text>
<line x1="${pad}" y1="${H - pad}" x2="${W - pad}" y2="${H - pad}" stroke="#ccc"/>
<line x1="${pad}" y1="${pad}" x2="${pad}" y2="${H - pad}" stroke="#ccc"/>
${ylab}${xlab}<path d="${line}" fill="none" stroke="#0b6" stroke-width="2"/>${dots}
<text x="${W - pad}" y="${H - 8}" font-size="10" text-anchor="end" fill="#999">Source: KOSIS · Survey on Labor Force at Establishments (hours)</text>
</svg>`;
fs.writeFileSync(path.join(ROOT, 'public', 'charts', 'korea-workdays.svg'), svg);
console.log('\n저장: src/data/korea-workdays.json · public/charts/korea-workdays.svg');
