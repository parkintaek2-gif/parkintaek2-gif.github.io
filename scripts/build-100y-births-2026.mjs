#!/usr/bin/env node
/**
 * build-100y-births-2026.mjs — 백년지도 「2026 출생 시도별」 축 자료를 KOSIS에서 받아 한 파일로 만든다.
 *
 * ── 왜 (2026-10-31 · 1번) ─────────────────────────────────────────────
 * 이슈   국가데이터처가 10월 28일 「2026년 8월 인구동향」을 냈다. 8월 출생아 23,703명, 26개월째 1년 전보다 늘었다.
 *        기사는 전국 수와 세종·전북 조출생률 두 줄만 다뤘다.
 * 축     KOSIS 월별 시도 표(101/DT_1B8000G)로 17개 시도 × 2019년 1월~2026년 8월 출생·사망·혼인·이혼을 받고,
 *        2025년 확정 시군구 표(101/DT_1B81A23 출생아·합계출산율, 101/DT_1B81A28 모의 평균 출산연령)를 붙인다.
 *
 * ⛔ 월별 수는 «잠정»이다. 내려받은 날(받은때)을 적는다.
 * ⛔ 시군구는 기초 단위(코드 끝자리 0)만 쓴다 — 일반시 아래 구(창원 의창구 등)는 겹쳐 세지 않게 뺀다.
 * ⛔ 「전남광주통합특별시」(코드 12)는 광주+전남을 더한 줄이라 시도 목록에서 빼고 따로 둔다.
 *
 * 쓰는 법  node scripts/build-100y-births-2026.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const KEY = (fs.readFileSync(path.join(ROOT, '.env'), 'utf8').match(/^KOSIS_API_KEY=(.+)$/m) ?? [])[1]?.trim();
if (!KEY) { console.error('⛔ .env 에 KOSIS_API_KEY 가 없다'); process.exit(1); }

async function 받기(tbl, prd, from, to, 둘째 = true) {
  const u = 'https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList'
    + `&apiKey=${KEY}&itmId=ALL&objL1=ALL${둘째 ? '&objL2=ALL' : ''}&format=json&jsonVD=Y`
    + `&prdSe=${prd}&startPrdDe=${from}&endPrdDe=${to}&orgId=101&tblId=${tbl}`;
  const j = await (await fetch(u)).json();
  if (!Array.isArray(j)) throw new Error(`${tbl} — ${JSON.stringify(j)}`);
  return j;
}

const 짧은 = (s) => s.replace(/특별자치시|특별자치도|특별시|광역시/, '').replace(/^(충청|전라|경상)(북|남)도$/, (_, a, b) => ({ 충청: '충', 전라: '전', 경상: '경' })[a] + b).replace(/도$/, '');

/* ── 월별 시도 ───────────────────────────────────────────────── */
const 월 = await 받기('DT_1B8000G', 'M', '201901', '202608');
const 항목 = { '출생아수(명)': '출생', '사망자수(명)': '사망', '혼인건수(건)': '혼인', '이혼건수(건)': '이혼', '조출생률(천명당)': '조출생률', '합계출산율': '합계출산율' };
const 시도표 = new Map();
let 바뀐날 = '';
for (const x of 월) {
  const k = 항목[x.C2_NM];
  if (!k) continue;
  if (x.LST_CHN_DE > 바뀐날) 바뀐날 = x.LST_CHN_DE;
  if (!시도표.has(x.C1)) 시도표.set(x.C1, { 코드: x.C1, 이름: x.C1_NM, 월: {} });
  const r = 시도표.get(x.C1);
  r.월[x.PRD_DE] ??= {};
  r.월[x.PRD_DE][k] = Number(x.DT);
}
const 정리 = (r) => ({
  코드: r.코드, 이름: r.이름, 짧은: r.코드 === '00' ? '전국' : 짧은(r.이름),
  월: Object.keys(r.월).sort().map((m) => ({ 월: m, ...r.월[m] })),
});
const 전국 = 정리(시도표.get('00'));
const 시도 = [...시도표.values()].filter((r) => r.코드 !== '00' && r.코드 !== '12').map(정리);
const 통합 = 시도표.has('12') ? 정리(시도표.get('12')) : null;

/* ── 2025 시군구 ─────────────────────────────────────────────── */
const a23 = await 받기('DT_1B81A23', 'Y', '2024', '2025', false);
const a28 = await 받기('DT_1B81A28', 'Y', '2025', '2025', false);
const 군 = new Map();
const 시도이름 = new Map();
for (const x of a23) if (x.C1.length === 2) 시도이름.set(x.C1, x.C1_NM);
for (const x of [...a23, ...a28]) {
  if (x.C1.length !== 5 || !x.C1.endsWith('0')) continue;
  if (!군.has(x.C1)) 군.set(x.C1, { 코드: x.C1, 시도: 짧은(시도이름.get(x.C1.slice(0, 2)) ?? ''), 이름: x.C1_NM });
  const r = 군.get(x.C1);
  const v = x.DT === '-' || x.DT === '' ? null : Number(x.DT);
  if (x.TBL_ID === 'DT_1B81A23') {
    if (x.ITM_NM.startsWith('출생아')) r[`출생${x.PRD_DE.slice(2)}`] = v;
    if (x.ITM_NM.startsWith('합계')) r[`합계${x.PRD_DE.slice(2)}`] = v;
  } else {
    if (x.ITM_NM.startsWith('모의 평균')) r.평균연령 = v;
    const m = x.ITM_NM.match(/(\d\d)-(\d\d)세/);
    if (m) { r.연령 ??= {}; r.연령[m[1]] = v; }
  }
}
/* 세종은 기초 코드(29010 세종시)가 따로 있어 그대로 들어온다 — 시도 코드 29를 또 넣으면 2,954명이 겹친다 */
const 시군구 = [...군.values()].filter((r) => r.출생25 != null);
const 전국25 = {
  출생25: Number(a23.find((x) => x.C1 === '00' && x.PRD_DE === '2025' && x.ITM_NM.startsWith('출생'))?.DT),
  출생24: Number(a23.find((x) => x.C1 === '00' && x.PRD_DE === '2024' && x.ITM_NM.startsWith('출생'))?.DT),
  합계25: Number(a23.find((x) => x.C1 === '00' && x.PRD_DE === '2025' && x.ITM_NM.startsWith('합계'))?.DT),
  평균연령: Number(a28.find((x) => x.C1 === '00' && x.ITM_NM.startsWith('모의 평균'))?.DT),
};

const 날 = new Date();
const 받은때 = `${날.getFullYear()}-${String(날.getMonth() + 1).padStart(2, '0')}-${String(날.getDate()).padStart(2, '0')}`;
const 낼 = {
  출처: {
    이름: '국가데이터처 KOSIS · 「인구동향조사」(신고 기반 행정통계 — 표본조사 아님)',
    월별표: '101/DT_1B8000G 월·분기·연간 인구동향(출생·사망·혼인·이혼) — 2019년 1월~2026년 8월, 월별 수는 잠정',
    시군구표: '101/DT_1B81A23 시군구 출생아수·합계출산율(2024·2025 확정) · 101/DT_1B81A28 시군구 모의 평균 출산연령·연령별 출생(2025)',
    발표: '「2026년 8월 인구동향」 2026-10-28 12:00 발표',
    KOSIS마지막수정: 바뀐날,
    이용허락범위: 'KOSIS 통계정보 활용약관 제8조 — 상업적 활용 가능',
  },
  받은때,
  '⚠': '월별 수는 잠정치라 다음 발표 때 고쳐질 수 있다. 1~8월 월별 수를 더한 값(전국 193,784명)이 보도자료 누계(193,783명)와 1명 다르다 — 월별 잠정치의 반올림·수정 차이로 보고 지면에는 둘 다 적는다.',
  전국, 시도, 전남광주통합: 통합,
  시군구2025: { 전국: 전국25, 목록: 시군구 },
};
const 길 = path.join(ROOT, 'src/data/100yearmap/births-2026.json');
fs.writeFileSync(길, JSON.stringify(낼, null, 1));
console.log(`✅ ${길} — 시도 ${시도.length} · 월 ${전국.월.length} · 시군구 ${시군구.length} · KOSIS 수정 ${바뀐날}`);
