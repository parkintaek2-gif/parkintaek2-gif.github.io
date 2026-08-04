/**
 * collect-kosis-employment.mjs — KOSIS 「직업계고 졸업자 취업통계」 수집
 *
 * 왜 이걸 받나 — 백년지도 스토리보드 P1(학과 조회 결과)의 심장이 이 숫자다.
 *   「취업률 86.1 / 유지취업률 78.4 / 중도탈락률 3.2」  ← 이 둘의 차이가 서비스의 존재 이유
 * 대학알리미(포털 15158684)는 2번이 신청 중이라 아직 없다.
 * 그런데 **직업계고(특성화고·마이스터고) 축은 KOSIS 로 지금 받을 수 있다.**
 * 우리가 이미 가진 NEIS 특성화고 490개교·학과 925개와 붙는다.
 *
 * ⭐ 이 표에는 1차·2차·3차 유지취업률이 다 있다 —
 *   「취업은 했는데 1년 뒤·2년 뒤에도 남아 있나」를 그대로 계산할 수 있다.
 *
 * 라이선스 — KOSIS 통계정보 활용약관
 *   제8조 상업적 활용 가능 · 제7조 출처표시 의무
 *   제5조 「특정한 서비스 플랫폼 없이 그대로 제3자에게 유료 제공」 금지 → raw 재판매만 금지
 *   ⚠ 화면에 반드시 「출처: 국가데이터처 KOSIS, <조사명>, 기준 <연도>」를 박는다.
 *
 * ⚠ 분당 호출 제한 공지가 있다. 표 사이에 간격을 둔다.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'archive', 'raw', 'kosis');
const ORG = '334'; // 교육부

/** 받을 표. 이름은 KOSIS 원문 그대로 둔다 — 우리가 지어내면 나중에 대조가 안 된다. */
const TABLES = [
  { id: 'DT_920024_3N_007', nm: '직업계고 계열별 졸업현황' },
  { id: 'DT_920024_3N_013', nm: '직업계고 학교유형별 유지취업 현황' },
  { id: 'DT_920024_3N_014', nm: '직업계고 학교소재지역(시도)별 유지취업 현황' },
  { id: 'DT_920024_3N_001', nm: '직업계고 학교유형별 졸업현황' },
  { id: 'DT_920024_3N_002', nm: '직업계고 시도별 졸업현황' },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function key() {
  const env = await readFile(join(ROOT, '.env'), 'utf8');
  const m = env.match(/^KOSIS_API_KEY=(.+)$/m);
  if (!m) throw new Error('.env 에 KOSIS_API_KEY 가 없다');
  return m[1].trim();
}

/** ⚠ KOSIS 는 오류를 배열이 아닌 객체로 준다. 배열이면 정상. */
const isErr = (j) => !Array.isArray(j) && j && (j.err !== undefined || j.errMsg !== undefined);

async function get(url) {
  const r = await fetch(url);
  const t = await r.text();
  return JSON.parse(t);
}

async function meta(k, tblId, type) {
  const u = `https://kosis.kr/openapi/statisticsData.do?method=getMeta&apiKey=${k}`
    + `&orgId=${ORG}&tblId=${tblId}&type=${type}&format=json&jsonVD=Y`;
  const j = await get(u);
  return Array.isArray(j) ? j : [];
}

async function data(k, tblId, objLevels) {
  // 분류 축이 몇 개인지 표마다 다르다. 메타에서 본 축(A, B, …)을 objL1, objL2 … 로 넘긴다.
  const objParams = objLevels.map((_, i) => `objL${i + 1}=ALL`).join('&');
  const u = `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${k}`
    + `&orgId=${ORG}&tblId=${tblId}&itmId=ALL&${objParams}`
    + `&format=json&jsonVD=Y&prdSe=Y&newEstPrdCnt=5`;
  const j = await get(u);
  if (isErr(j)) throw new Error(`${j.err ?? ''} ${j.errMsg ?? ''}`.trim() || '알 수 없는 오류');
  return j;
}

async function main() {
  const k = await key();
  await mkdir(OUT, { recursive: true });
  const 수집시각 = new Date().toLocaleString('sv-SE'); // ⚠ KST. toISOString 은 UTC 라 새벽에 어긋난다
  const result = [];

  for (const t of TABLES) {
    try {
      const itm = await meta(k, t.id, 'ITM');
      // OBJ_ID 가 'ITEM' 이 아닌 것이 분류 축이다 (A, B, C …)
      const axes = [...new Set(itm.filter((x) => x.OBJ_ID && x.OBJ_ID !== 'ITEM').map((x) => x.OBJ_ID))].sort();
      const items = itm.filter((x) => x.OBJ_ID === 'ITEM').map((x) => ({ id: x.ITM_ID, nm: x.ITM_NM, unit: x.UNIT_NM }));

      await sleep(400);
      const rows = await data(k, t.id, axes);

      const 기간 = [...new Set(rows.map((r) => r.PRD_DE))].sort();
      await writeFile(
        join(OUT, `${t.id}.json`),
        JSON.stringify({ 표: t.nm, tblId: t.id, orgId: ORG, 출처: '국가데이터처 KOSIS', 수집시각, 축: axes, 항목: items, 기간, rows }),
        'utf8',
      );
      result.push({ ...t, 축: axes.join(','), 항목수: items.length, 행: rows.length, 기간: `${기간[0]}~${기간.at(-1)}` });
      console.log(`✅ ${t.id}  ${t.nm}  ${rows.length}행  ${기간[0]}~${기간.at(-1)}`);
    } catch (e) {
      result.push({ ...t, 오류: String(e.message).slice(0, 120) });
      console.log(`⛔ ${t.id}  ${t.nm}  — ${String(e.message).slice(0, 90)}`);
    }
    await sleep(700); // 분당 호출 제한 공지가 있다
  }

  await writeFile(join(OUT, 'summary.json'), JSON.stringify({ 수집시각, 표: result }, null, 2), 'utf8');
}

main().catch((e) => { console.error(e); process.exit(1); });
