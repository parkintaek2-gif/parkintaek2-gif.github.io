#!/usr/bin/env node
/**
 * collect-korea-trade-by-product.mjs — 한국 수출입액, 품목별(SITC 대분류), KOSIS 360
 *
 * 왜 만드나 (2026-10-04 · 2번)
 *   docs/새데이터-KOSIS-후보.md 의 fx 후보 — 「국가별·품목별 수출입액」 중 국가별 축
 *   (DT_1R11006_FRM101)은 trading-partners.astro·기존 기사와 겹쳐 뺐다. 품목별 축
 *   (DT_1R11001_FRM101, SITC 대분류 0~9)은 완전히 다른 축이라 겹치지 않는다 —
 *   「한국이 어느 나라와 거래하나」가 아니라 「한국이 무엇을 팔고 무엇을 사나」.
 *
 *   node scripts/collect-korea-trade-by-product.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(
  path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'),
  '..'
);
const OUT_SRC = path.join(ROOT, 'src', 'data', 'korea-trade-by-product.json');

const ORG = '360';
const TBL = 'DT_1R11001_FRM101';
const ITM_EXPORT = '13103112831T1';
const ITM_IMPORT = '13103112831T2';
const CATS = ['A', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const C1 = CATS.map((c) => `13102112831A.${c}+`).join('');

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
  const endYear = new Date().getFullYear();
  const u = `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${k}`
    + `&itmId=${ITM_EXPORT}+${ITM_IMPORT}+&objL1=${C1}&orgId=${ORG}&tblId=${TBL}`
    + `&format=json&jsonVD=Y&prdSe=Y&startPrdDe=${endYear - 6}&endPrdDe=${endYear}`;
  const j = await get(u);
  if (isErr(j)) throw new Error(`${j.err} ${j.errMsg}`);

  const byYear = {};
  for (const r of j) {
    const y = r.PRD_DE;
    const dir = r.ITM_ID === ITM_EXPORT ? 'export' : 'import';
    ((byYear[y] ??= {})[dir] ??= {})[r.C1_NM] = Number(r.DT);
  }

  const years = Object.keys(byYear).sort();
  const out = {
    _meta: {
      builtAt: new Date().toISOString(),
      org: ORG, tbl: TBL,
      source: '품목별 수출액 수입액(SITC 대분류), KOSIS 360/DT_1R11001_FRM101 — 단위 천달러, 연간',
    },
    years: byYear,
  };

  for (const y of years) {
    const exTotal = byYear[y].export?.['총액'];
    const imTotal = byYear[y].import?.['총액'];
    console.log(`${y}: 수출총액 ${exTotal ?? '없음'} · 수입총액 ${imTotal ?? '없음'}`);
  }

  await fs.writeFile(OUT_SRC, JSON.stringify(out, null, 2), 'utf8');
  console.log('→', OUT_SRC);
}

main().catch((e) => { console.error('ERR', e.message); process.exit(1); });
