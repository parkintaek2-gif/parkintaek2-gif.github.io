#!/usr/bin/env node
/**
 * collect-krx-stock.mjs — KRX 유가증권/코스닥 일별매매정보(종목별 시세·거래량).
 *   KRX Data Marketplace OPEN API. 헤더 AUTH_KEY, 파라미터 basDd=YYYYMMDD, JSON(OutBlock_1).
 *   base: https://data-dbg.krx.co.kr/svc/apis/sto/{service}   ⚠ http 는 302 로 넘긴다. https 로 직결한다
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
 *
 * ⭐ [2026-09-06 · 5번이 실측해 덧붙임] 위 「언제까지 열어 둘지 모른다」를 재 봤다.
 *   9월 6일에 basDd 를 손으로 주고 과거분을 받아 보니 **아흐레 전까지 그대로 나왔다.**
 *
 *     20260904 → 943행    20260902 → 943행    20260901 → 943행    20260828 → 944행
 *
 *   ⇒ KRX 는 «소급이 되는» 자료다. 하루 빠져도 다음에 basDd 를 주면 메울 수 있다.
 *   ⛔ 그렇다고 매일 받는 일을 미루지 않는다 — 며칠까지 되는지는 여전히 모르고,
 *      「나중에 받으면 되지」로 미루다 보면 그 며칠을 넘긴다.
 *   ⭐ 이 줄을 적는 까닭은 따로 있다 — **하루가 비었을 때 사고로 오해하지 말라는 것**이다.
 *      실제로 2026-09-06 에 archive/raw/krx 가 9/4 에서 멈춰 있어 「누락」으로 볼 뻔했다.
 *      돌려 보니 KRX 가 9/5(금)를 아직 빈 배열로 주고 있었다 — 우리가 빠뜨린 것이 아니다.
 *      ⇒ 폴더가 비었다고 경보하기 전에 **basDd 를 손으로 줘서 한 번 받아 본다.**
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
  /* 🔴 [2026-09-09] http 는 302 로 https 로 넘긴다. 재서 확인했다 —
     http HTTP 302 → Location: https://… · https 직결도 HTTP 200 · 행 수 같음.
     ⛔ 방향이 바뀌는 redirect 는 사용자 정의 머리글(AUTH_KEY)을 흘릴 수 있다.
     그리고 공공데이터포털 공지(2026-08-03)도 「오픈API 는 https(443)로」라고 못박았다.
     ⇒ 처음부터 https 로 부른다. 왕복도 한 번 줄어든다. */
  const url = `https://data-dbg.krx.co.kr/svc/apis/sto/${service}?basDd=${basDd}`;
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
