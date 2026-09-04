#!/usr/bin/env node
/**
 * collect-krx-stock.mjs — KRX 유가증권/코스닥 일별매매정보(종목별 시세·거래량).
 *   KRX Data Marketplace OPEN API. 헤더 AUTH_KEY, 파라미터 basDd=YYYYMMDD, JSON(OutBlock_1).
 *   base: http://data-dbg.krx.co.kr/svc/apis/sto/{service}
 * 출력: archive/raw/krx/{service}-{basDd}.json
 *
 * 왜: 그동안 못 갖던 «종목별 주가·거래량». 애널 목표주가 × 실주가(적중률) 교차상품의 재료.
 */
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { put } from '../src/lib/store.mjs';

/**
 * 🔴 [2026-09-04 · 6번] R2 백업 없이 archive/ 로컬에만 썼다. 5번의 전체 경고
 *   ("여러분 수집기가 store.put 을 거치는지 보십시오")를 계기로 6번이 오늘 만든 두
 *   수집기에서 같은 결함을 발견·고쳤고, 기존 것도 훑다가 이 자도 걸렸다.
 *   KRX 일별매매정보는 재현 안 되는 원자료(내일이면 오늘 basDd 는 다시 못 받는다는
 *   보장이 없지만 과거분은 API가 언제까지 열어 둘지 모른다) — writeFileSync 하나로
 *   이 PC 에만 남는 구조는 store.mjs 헤더가 경고하는 바로 그 사고다.
 */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

async function key() {
  const env = await readFile(join(ROOT, '.env'), 'utf8');
  const m = env.match(/^KRX_API_KEY=(.+)$/m);
  if (!m) throw new Error('.env 에 KRX_API_KEY 가 없다');
  return m[1].trim();
}

const k = await key();

async function pull(service, basDd) {
  const url = `http://data-dbg.krx.co.kr/svc/apis/sto/${service}?basDd=${basDd}`;
  const r = await fetch(url, { headers: { AUTH_KEY: k }, signal: AbortSignal.timeout(30000) });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { throw new Error('JSON 아님: ' + t.slice(0, 150)); }
  return { status: r.status, rows: j.OutBlock_1 || j.output || [], raw: j };
}

/** 최근 영업일을 찾는다 — 오늘부터 거꾸로, 유가증권이 행을 줄 때까지(주말·휴장 건너뜀). */
function ymd(d) { return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`; }

const argDd = process.argv[2];
const argSvc = process.argv[3];
const services = argSvc ? [argSvc] : ['stk_bydd_trd', 'ksq_bydd_trd']; // 유가증권·코스닥

// basDd 정하기: 인자 있으면 그것, 없으면 최근 영업일 자동탐색(KST 기준, ±하루 여유로 UTC 무시하고 로컬)
let basDd = argDd;
if (!basDd) {
  const now = new Date();
  for (let off = 0; off <= 6; off++) {
    const d = new Date(now); d.setDate(now.getDate() - off);
    const cand = ymd(d);
    const probe = await pull('stk_bydd_trd', cand);
    if (probe.status === 200 && probe.rows.length > 0) { basDd = cand; break; }
  }
  if (!basDd) throw new Error('최근 6일 내 영업일을 못 찾음');
}

let ok = 0;
for (const service of services) {
  const { status, rows, raw } = await pull(service, basDd);
  if (status === 200 && rows.length > 0) {
    const 저장 = await put(`raw/krx/${service}-${basDd}.json`, JSON.stringify({ service, basDd, rows }, null, 0), 'application/json');
    console.log(`✅ ${service} ${basDd} · ${rows.length}행 → ${저장.local}${저장.remote ? ' · R2 저장 완료' : (저장.remoteError ? ` · R2 실패: ${저장.remoteError}` : ' · R2 비활성')}`);
    ok++;
  } else {
    console.log(`⚠ ${service} ${basDd} · HTTP ${status} · ${JSON.stringify(raw).slice(0, 160)}`);
  }
}
console.log(`끝 · ${ok}/${services.length} 성공 · basDd ${basDd}`);
