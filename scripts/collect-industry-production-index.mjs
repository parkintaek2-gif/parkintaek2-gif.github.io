#!/usr/bin/env node
/**
 * collect-industry-production-index.mjs — 전산업생산지수(원지수), 산업별(한국은행/통계청, KOSIS 101)
 *
 * 왜 만드나 (2026-10-03 · 2번)
 *   docs/새데이터-KOSIS-후보.md 가 SeoulMarkets macro 카테고리 보강용으로 찜한 표(101/DT_1JH20201).
 *   총지수(농림어업 제외)와 4개 산업(광공업·서비스업·건설업·공공행정)이 모두 2020=100 기준이라
 *   직접 비교할 수 있다. 실측 결과 건설업이 유독 낮아(2026-08 기준 75.3) 산업별 격차가 크다 —
 *   같은 자, 다른 산업이 보여주는 괴리를 그대로 놓는다(인과 주장 없음).
 *
 *   node scripts/collect-industry-production-index.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(
  path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'),
  '..'
);
const OUT_SRC = path.join(ROOT, 'src', 'data', 'industry-production-index.json');

const ORG = '101';
const TBL = 'DT_1JH20201';

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
  const u = `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${k}`
    + `&orgId=${ORG}&tblId=${TBL}&itmId=ALL&objL1=ALL&format=json&jsonVD=Y&prdSe=M&newEstPrdCnt=84`;
  const j = await get(u);
  if (isErr(j)) throw new Error(`${j.err} ${j.errMsg}`);

  const byGroup = {};
  for (const r of j) {
    const g = r.C1_NM;
    (byGroup[g] ??= []).push({ 월: r.PRD_DE, 값: Number(r.DT) });
  }
  for (const g of Object.keys(byGroup)) byGroup[g].sort((a, b) => a.월.localeCompare(b.월));

  const out = {
    _meta: {
      builtAt: new Date().toISOString(),
      org: ORG, tbl: TBL,
      source: '전산업생산지수(원지수), KOSIS 101/DT_1JH20201 — 2020=100 기준',
    },
    series: byGroup,
  };

  for (const [g, rows] of Object.entries(byGroup)) {
    console.log(`${g}: ${rows.length}개월(${rows[0].월}~${rows.at(-1).월}), 최신 ${rows.at(-1).값}`);
  }

  await fs.writeFile(OUT_SRC, JSON.stringify(out, null, 2), 'utf8');
  console.log('→', OUT_SRC);
}

main().catch((e) => { console.error('ERR', e.message); process.exit(1); });
