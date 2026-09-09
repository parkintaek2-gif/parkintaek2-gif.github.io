#!/usr/bin/env node
/**
 * collect-kosis-industrial-activity.mjs — 산업활동동향(전산업생산지수, 원지수·계절조정지수).
 *   국가데이터처(구 통계청) org 101 · DT_1JH20201(원지수)·DT_1JH20202(계절조정지수) · 월.
 *   사장님 지시(2026-09-09): 「국가데이터처 보도자료 2026년 7월 산업활동동향...우리도 챙기지?」
 *   경기종합지수(collect-kosis-cycle.mjs, DT_1C8015)와는 다른 표다 — 저건 선행·동행·후행
 *   «순환변동치», 이건 실제 산업별(전산업·광공업·서비스업·건설업·공공행정) 생산 «지수».
 * 출력: archive/raw/kosis/DT_1JH20201.json · DT_1JH20202.json
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'archive', 'raw', 'kosis');

async function key() {
  const env = await readFile(join(ROOT, '.env'), 'utf8');
  const m = env.match(/^KOSIS_API_KEY=(.+)$/m);
  if (!m) throw new Error('.env 에 KOSIS_API_KEY 가 없다');
  return m[1].trim();
}
const get = async (u) => { const r = await fetch(u, { signal: AbortSignal.timeout(40000) }); const t = await r.text(); try { return JSON.parse(t); } catch { throw new Error('JSON 아님: ' + t.slice(0, 90)); } };
const isErr = (j) => !Array.isArray(j) && j && (j.err !== undefined || j.errMsg !== undefined);

const k = await key();
const org = '101';
const 표들 = ['DT_1JH20201', 'DT_1JH20202']; // 원지수 · 계절조정지수

await mkdir(OUT, { recursive: true });
for (const tblId of 표들) {
  const u = `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${k}`
    + `&orgId=${org}&tblId=${tblId}&itmId=ALL&objL1=ALL`
    + `&format=json&jsonVD=Y&prdSe=M&newEstPrdCnt=24`;
  const j = await get(u);
  if (isErr(j)) throw new Error(`${tblId}: ${j.err ?? ''} ${j.errMsg ?? ''}`.trim());
  const rows = Array.isArray(j) ? j : [];
  await writeFile(join(OUT, `${tblId}.json`), JSON.stringify({ tblId, orgId: org, rows }, null, 0));
  const P = [...new Set(rows.map((r) => r.PRD_DE))].sort();
  console.log(`✅ ${tblId} — ${rows.length}행 · ${P[0]}~${P[P.length - 1]}`);
  console.log('   C1:', [...new Set(rows.map((r) => r.C1_NM))].join(' | '));
}
