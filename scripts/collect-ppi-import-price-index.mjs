#!/usr/bin/env node
/**
 * collect-ppi-import-price-index.mjs — 생산자물가지수 vs 수입물가지수(원화기준) 총지수
 * (한국은행 301/DT_404Y014·DT_401Y015, KOSIS)
 *
 * 왜 만드나 (2026-10-03 · 2번)
 *   docs/새데이터-KOSIS-후보.md 가 SeoulMarkets commodities 카테고리(기사 1편뿐) 보강용으로
 *   찜해 둔 표 둘. 두 지수 모두 2020=100 기준이라 같은 자로 바로 견줄 수 있다.
 *   둘 다 426/235개 세부품목을 갖지만, 여기서는 총지수(헤드라인)만 쓴다 — 세부 품목까지
 *   받으면 셀 4만 개 한도를 넘는다(실측 — objL1=ALL 로 84개월 요청하면 err 31).
 *   총지수 전용 항목코드로 objL1 을 좁혀서 받는다.
 *
 *   node scripts/collect-ppi-import-price-index.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(
  path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'),
  '..'
);
const OUT_SRC = path.join(ROOT, 'src', 'data', 'ppi-import-price-index.json');

const ORG = '301';
const PPI_TBL = 'DT_404Y014';
const PPI_총지수_CODE = '13102134604ACC_CD.*AA';
const IMP_TBL = 'DT_401Y015';
const IMP_총지수_CODE = '13102134643ACC_CD.*AA';
const IMP_원화기준_CODE = '13102134643CRR_CTRT_CD.W';

async function key() {
  const env = await fs.readFile(path.join(ROOT, '.env'), 'utf8');
  const m = env.match(/^KOSIS_API_KEY=(.+)$/m);
  if (!m) throw new Error('.env 에 KOSIS_API_KEY 가 없다');
  return m[1].trim();
}

async function get(url) {
  const r = await fetch(url);
  const t = await r.text();
  return JSON.parse(t);
}

const isErr = (j) => !Array.isArray(j) && j && (j.err !== undefined || j.errMsg !== undefined);

async function main() {
  const k = await key();

  const uPpi = `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${k}`
    + `&orgId=${ORG}&tblId=${PPI_TBL}&itmId=ALL&objL1=${encodeURIComponent(PPI_총지수_CODE)}`
    + `&format=json&jsonVD=Y&prdSe=M&newEstPrdCnt=84`;
  const jPpi = await get(uPpi);
  if (isErr(jPpi)) throw new Error(`PPI: ${jPpi.err} ${jPpi.errMsg}`);

  const uImp = `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${k}`
    + `&orgId=${ORG}&tblId=${IMP_TBL}&itmId=ALL&objL1=${encodeURIComponent(IMP_총지수_CODE)}`
    + `&objL2=${encodeURIComponent(IMP_원화기준_CODE)}&format=json&jsonVD=Y&prdSe=M&newEstPrdCnt=84`;
  const jImp = await get(uImp);
  if (isErr(jImp)) throw new Error(`수입물가: ${jImp.err} ${jImp.errMsg}`);

  const toSeries = (rows) => rows
    .map((r) => ({ 월: r.PRD_DE, 값: Number(r.DT) }))
    .sort((a, b) => a.월.localeCompare(b.월));

  const out = {
    _meta: {
      builtAt: new Date().toISOString(),
      org: ORG,
      tables: { 생산자물가지수: PPI_TBL, 수입물가지수_원화기준: IMP_TBL },
      source: '한국은행 통화금융통계(KOSIS 301) — 둘 다 2020=100 기준, 같은 자로 견줄 수 있다',
    },
    생산자물가지수: toSeries(jPpi),
    수입물가지수_원화기준: toSeries(jImp),
  };

  console.log(`PPI ${out.생산자물가지수.length}개월(${out.생산자물가지수[0].월}~${out.생산자물가지수.at(-1).월})`);
  console.log(`수입물가 ${out.수입물가지수_원화기준.length}개월(${out.수입물가지수_원화기준[0].월}~${out.수입물가지수_원화기준.at(-1).월})`);

  await fs.writeFile(OUT_SRC, JSON.stringify(out, null, 2), 'utf8');
  console.log('→', OUT_SRC);
}

main().catch((e) => { console.error('ERR', e.message); process.exit(1); });
