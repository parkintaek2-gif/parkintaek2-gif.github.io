#!/usr/bin/env node
/**
 * collect-krx-stock.mjs — KRX 유가증권/코스닥 일별매매정보(종목별 시세·거래량).
 *   KRX Data Marketplace OPEN API. 헤더 AUTH_KEY, 파라미터 basDd=YYYYMMDD, JSON(OutBlock_1).
 *   base: http://data-dbg.krx.co.kr/svc/apis/sto/{service}
 * 출력: archive/raw/krx/{service}-{basDd}.json
 *
 * 왜: 그동안 못 갖던 «종목별 주가·거래량». 애널 목표주가 × 실주가(적중률) 교차상품의 재료.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'archive', 'raw', 'krx');

async function key() {
  const env = await readFile(join(ROOT, '.env'), 'utf8');
  const m = env.match(/^KRX_API_KEY=(.+)$/m);
  if (!m) throw new Error('.env 에 KRX_API_KEY 가 없다');
  return m[1].trim();
}

const basDd = process.argv[2] || '20260820';
const service = process.argv[3] || 'stk_bydd_trd'; // 유가증권. 코스닥=ksq_bydd_trd
const k = await key();
const url = `http://data-dbg.krx.co.kr/svc/apis/sto/${service}?basDd=${basDd}`;
const r = await fetch(url, { headers: { AUTH_KEY: k }, signal: AbortSignal.timeout(30000) });
const t = await r.text();
let j; try { j = JSON.parse(t); } catch { throw new Error('JSON 아님: ' + t.slice(0, 200)); }
const rows = j.OutBlock_1 || j.output || [];
console.log('HTTP', r.status, '· service', service, '· basDd', basDd);
if (!Array.isArray(rows) || rows.length === 0) {
  console.log('행 0 · 응답:', JSON.stringify(j).slice(0, 300));
} else {
  console.log('행', rows.length, '· 키:', Object.keys(rows[0]).join(','));
  console.log('표본:', JSON.stringify(rows[0]));
  await mkdir(OUT, { recursive: true });
  await writeFile(join(OUT, `${service}-${basDd}.json`), JSON.stringify({ service, basDd, rows }, null, 0));
  console.log('저장:', `archive/raw/krx/${service}-${basDd}.json`);
}
