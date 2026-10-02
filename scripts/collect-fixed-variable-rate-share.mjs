#!/usr/bin/env node
/**
 * collect-fixed-variable-rate-share.mjs — 예금은행 고정/변동금리대출 비중 (한국은행, KOSIS 301)
 *
 * 왜 만드나 (2026-10-03 · 2번)
 *   docs/새데이터-KOSIS-후보.md 가 SeoulMarkets rates 카테고리(기사 1편뿐) 보강용으로
 *   찜해 둔 표 둘 — 잔액 기준(DT_121Y011) · 신규취급액 기준(DT_121Y010).
 *   같은 자료를 «두 잣대»(쌓인 것 vs 이번 달 새로 나간 것)로 보여주는 짝이라
 *   한 지면에서 나란히 놓으면 바로 쓸 수 있다.
 *
 *   node scripts/collect-fixed-variable-rate-share.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(
  path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'),
  '..'
);
const OUT_SRC = path.join(ROOT, 'src', 'data', 'fixed-variable-rate-share.json');

const ORG = '301';
const TABLES = {
  잔액기준: 'DT_121Y011',
  신규취급액기준: 'DT_121Y010',
};

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
  const out = { _meta: { builtAt: new Date().toISOString(), org: ORG, tables: TABLES, source: '한국은행 통화금융통계(KOSIS 301)' }, series: {} };

  for (const [기준, tbl] of Object.entries(TABLES)) {
    const u = `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${k}`
      + `&orgId=${ORG}&tblId=${tbl}&itmId=ALL&objL1=ALL&format=json&jsonVD=Y&prdSe=M&newEstPrdCnt=1`;
    const j = await get(u);
    if (isErr(j)) throw new Error(`${기준}: ${j.err} ${j.errMsg}`);
    const rows = j.map((r) => ({ 항목: r.C1_NM, 기준월: r.PRD_DE, 값: Number(r.DT), 단위: r.UNIT_NM }));
    out.series[기준] = { tblId: tbl, 기준월: rows[0]?.기준월 ?? null, rows };
    console.log(`${기준}(${tbl}) — ${rows.length}건, 기준월 ${rows[0]?.기준월}`);
  }

  await fs.writeFile(OUT_SRC, JSON.stringify(out, null, 2), 'utf8');
  console.log('→', OUT_SRC);
}

main().catch((e) => { console.error('ERR', e.message); process.exit(1); });
