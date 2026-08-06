/**
 * collect-kosis-seoulmarkets.mjs — SeoulMarkets(6번) 용 KOSIS 표 수집
 *
 * 2번 지시(2026-08-06): 애널리포트 보류 → 기사 편수를 KOSIS 새 데이터로 채운다.
 * 사장님: 「확보 불가능한 걸 계속 잡지마. 기존 데이터를 어떻게 가공할지, 새 데이터는 더 없는지 찾아」
 * KOSIS 는 키가 이미 .env 에 있고 신청·가입·사장님 손이 필요 없다.
 *
 * 받는 표 (docs/새데이터-KOSIS-후보.md 의 6번 몫)
 *   fx           국가별·품목별 수출입액        360/DT_1R11006_FRM101 (fx 1편뿐)
 *   rates        예금은행 고정/변동금리 비중    301/DT_121Y011        (rates 1편뿐)
 *   commodities  생산자물가지수 · 수입물가지수   301/DT_404Y014 · DT_401Y015 (commodities 1편뿐)
 *
 * 라이선스 — KOSIS 통계정보 활용약관 제8조 상업활용 가능 · 제7조 출처표시.
 *   ⚠ 화면에 「출처: 국가데이터처 KOSIS, <조사명>, 기준 <연도>」를 반드시 박는다.
 *   ⚠ raw 를 그대로 제3자에 유료 제공만 금지(제5조). 우리가 가공해 지면·표로 파는 것은 된다.
 *
 * ⚠ 통계설명(정의)은 collect-kosis-explanation.mjs 로 따로 받는다(2번 지침 ①).
 * ⚠ 이 수집기는 archive/raw/kosis 에 원본을 둔다. 지면은 src/data 로 가공본을 커밋해야 산다.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'archive', 'raw', 'kosis');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 표별 orgId·주기(prdSe)가 다르다. 이름은 KOSIS 원문 그대로. */
const TABLES = [
  { cat: 'fx',          org: '360', id: 'DT_1R11006_FRM101', nm: '국가별 품목별 수출입액',      prdSe: 'M' },
  { cat: 'rates',       org: '301', id: 'DT_121Y011',        nm: '예금은행 신규취급액 고정변동 금리비중', prdSe: 'M' },
  { cat: 'commodities', org: '301', id: 'DT_404Y014',        nm: '생산자물가지수',                prdSe: 'M' },
  { cat: 'commodities', org: '301', id: 'DT_401Y015',        nm: '수입물가지수',                  prdSe: 'M' },
];

async function key() {
  const env = await readFile(join(ROOT, '.env'), 'utf8');
  const m = env.match(/^KOSIS_API_KEY=(.+)$/m);
  if (!m) throw new Error('.env 에 KOSIS_API_KEY 가 없다');
  return m[1].trim();
}

/** KOSIS 는 오류를 배열이 아닌 객체로 준다. 배열이면 정상. */
const isErr = (j) => !Array.isArray(j) && j && (j.err !== undefined || j.errMsg !== undefined);

async function get(url) {
  const r = await fetch(url, { signal: AbortSignal.timeout(40000) });
  const t = await r.text();
  try { return JSON.parse(t); } catch { throw new Error(`JSON 아님: ${t.slice(0, 90)}`); }
}

async function meta(k, org, tblId) {
  const u = `https://kosis.kr/openapi/statisticsData.do?method=getMeta&apiKey=${k}`
    + `&orgId=${org}&tblId=${tblId}&type=ITM&format=json&jsonVD=Y`;
  const j = await get(u);
  return Array.isArray(j) ? j : [];
}

async function data(k, org, tblId, axes, prdSe) {
  const objParams = axes.map((_, i) => `objL${i + 1}=ALL`).join('&');
  const u = `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${k}`
    + `&orgId=${org}&tblId=${tblId}&itmId=ALL&${objParams}`
    + `&format=json&jsonVD=Y&prdSe=${prdSe}&newEstPrdCnt=12`;
  const j = await get(u);
  if (isErr(j)) throw new Error(`${j.err ?? ''} ${j.errMsg ?? ''}`.trim() || '알 수 없는 오류');
  return j;
}

/** 통계설명(정의). 2번 지침 ①: 숫자만 받고 정의를 기억에 두면 지면 설명이 어긋난다.
    ed72fb3e 가 기사에서 「이 숫자가 무엇인가」를 원문 정의로 쓰게 함께 저장한다. */
async function 설명(k, org, tblId) {
  const u = `https://kosis.kr/openapi/statisticsExplData.do?method=getMeta&apiKey=${k}`
    + `&orgId=${org}&tblId=${tblId}&metaItm=All&format=json&jsonVD=Y`;
  try { const j = await get(u); return Array.isArray(j) ? j : (j ? [j] : []); } catch { return []; }
}

async function main() {
  const k = await key();
  await mkdir(OUT, { recursive: true });
  const 수집시각 = new Date().toLocaleString('sv-SE'); // KST. toISOString 금지
  const result = [];

  for (const t of TABLES) {
    try {
      const itm = await meta(k, t.org, t.id);
      const axes = [...new Set(itm.filter((x) => x.OBJ_ID && x.OBJ_ID !== 'ITEM').map((x) => x.OBJ_ID))].sort();
      const items = itm.filter((x) => x.OBJ_ID === 'ITEM').map((x) => ({ id: x.ITM_ID, nm: x.ITM_NM, unit: x.UNIT_NM }));
      await sleep(500);
      const 정의 = await 설명(k, t.org, t.id);
      await sleep(500);
      const rows = await data(k, t.org, t.id, axes, t.prdSe);
      const 기간 = [...new Set(rows.map((r) => r.PRD_DE))].sort();
      await writeFile(
        join(OUT, `${t.id}.json`),
        JSON.stringify({ 표: t.nm, cat: t.cat, tblId: t.id, orgId: t.org, 출처: '국가데이터처 KOSIS', 수집시각, 축: axes, 항목: items, 통계설명: 정의, 기간, rows }),
        'utf8',
      );
      result.push({ ...t, 축: axes.join(','), 항목수: items.length, 행: rows.length, 정의: 정의.length > 0, 기간: `${기간[0]}~${기간.at(-1)}` });
      console.log(`✅ ${t.cat.padEnd(11)} ${t.id}  ${rows.length}행  ${기간[0]}~${기간.at(-1)}  축[${axes.join(',')}]`);
    } catch (e) {
      result.push({ ...t, 오류: String(e.message).slice(0, 120) });
      console.log(`⛔ ${t.cat.padEnd(11)} ${t.id}  ${t.nm} — ${String(e.message).slice(0, 90)}`);
    }
    await sleep(800); // 분당 호출 제한
  }

  await writeFile(join(OUT, 'summary-seoulmarkets.json'), JSON.stringify({ 수집시각, 표: result }, null, 2), 'utf8');
  const 성공 = result.filter((r) => !r.오류).length;
  console.log(`\nKOSIS 6번 표 ${성공}/${TABLES.length} 성공 → archive/raw/kosis/`);
}

main().catch((e) => { console.error(e); process.exit(1); });
