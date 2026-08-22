#!/usr/bin/env node
/**
 * collect-kosis-cycle.mjs — 경기종합지수(선행·동행·후행 + 순환변동치 + 구성지표).
 *   통계청 org 101 · DT_1C8015 · 월. 사장님 지시(건설·선행·후행 경기지표) 축.
 * 출력: archive/raw/kosis/DT_1C8015.json
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
const org = '101', tblId = 'DT_1C8015';
const u = `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${k}`
  + `&orgId=${org}&tblId=${tblId}&itmId=ALL&objL1=ALL`
  + `&format=json&jsonVD=Y&prdSe=M&newEstPrdCnt=18`;
const j = await get(u);
if (isErr(j)) throw new Error(`${j.err ?? ''} ${j.errMsg ?? ''}`.trim());
const rows = Array.isArray(j) ? j : [];
await mkdir(OUT, { recursive: true });
await writeFile(join(OUT, 'DT_1C8015.json'), JSON.stringify({ tblId, orgId: org, 수집시각: '(stamp after)', rows }, null, 0));
const P = [...new Set(rows.map((r) => r.PRD_DE))].sort();
console.log(`✅ ${rows.length}행 · ${P[0]}~${P[P.length - 1]}`);
console.log('C1:', [...new Set(rows.map((r) => r.C1_NM))].join(' | '));
console.log('C2:', [...new Set(rows.map((r) => r.C2_NM))].slice(0, 20).join(' | '));
console.log('ITM:', [...new Set(rows.map((r) => r.ITM_NM))].slice(0, 12).join(' | '));
