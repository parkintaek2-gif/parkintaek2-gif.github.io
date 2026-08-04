#!/usr/bin/env node
/**
 * **지수시세** 수집 — Equities 축. (코스피·코스닥·KRX 시리즈 148종)
 *
 *   npm run collect:indices                      어제치 (기본)
 *   npm run collect:indices -- --date 20260803
 *   npm run collect:indices -- --from 20250101 --to 20260803
 *
 * ── 왜 붙이나 ──────────────────────────────────────────────────
 * 승인은 오래전에 나 있었는데 **수집기가 없었다.** 249,465건이 그냥 있었다.
 * 사장님 지시(2026-08-04): 「홈페이지 앞에 여러 그래픽들을 좀 실어주고,
 * **정적으로** — 무거우면 안 되니까」. 그 그래픽의 재료가 이 지수 시계열이다.
 *
 * ── ⚠ 이름만으로는 키가 안 된다 ───────────────────────────────
 * 실측(2026-08-03) — **「IT 서비스」가 두 줄로 온다.**
 *   {idxNm:'IT 서비스', idxCsf:'KOSPI시리즈',  clpr:1159.33, epyItmsCnt:25}
 *   {idxNm:'IT 서비스', idxCsf:'KOSDAQ시리즈', clpr: 607.25, epyItmsCnt:227}
 * `idxNm` 으로만 묶으면 **코스피 IT 와 코스닥 IT 가 한 줄로 뭉개진다.**
 * 에러는 안 난다. 그래프만 조용히 틀린다.
 * → 키는 반드시 **`idxCsf` + `idxNm`** 이다. 이 파일에서 `키()` 로 만든다.
 *
 * ── 무엇이 오나 ────────────────────────────────────────────────
 *   basDt 기준일        idxNm 지수명       idxCsf 계열(KOSPI/KOSDAQ/KRX 시리즈)
 *   clpr 종가           vs 전일비          fltRt 등락률
 *   mkp/hipr/lopr       trqu 거래량        trPrc 거래대금
 *   epyItmsCnt 구성종목수                  lstgMrktTotAmt 상장시가총액
 *   yrWRcrdHgst/Dt 52주 최고와 그 날짜     yrWRcrdLwst/Dt 52주 최저
 *   basPntm 기준시점    basIdx 기준지수
 *
 * ⚠ 산출지수(K-샤프지수 등)는 **거래량·시총이 전부 0** 이다. 거래되는 게 아니라 계산값이다.
 *   0 을 「거래가 없었다」로도, 「0원」으로도 읽으면 안 된다. `구성종목수 === 0` 으로 가른다.
 *
 * ── ⚠ 지키는 것 ───────────────────────────────────────────────
 * · **T+1**. 기본이 어제다        · 시각은 **KST**. `toISOString()` 안 쓴다
 * · `DATAGO_KEY` 는 **이미 URL 인코딩돼 있다.** 다시 걸면 403
 * · 하루치를 한 파일로. 다시 돌리면 덮어쓴다(멱등)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const BASE = 'https://apis.data.go.kr/1160100/service/GetMarketIndexInfoService/getStockMarketIndex';
const OUT_DIR = path.resolve('archive/raw/indices');
const 쪽크기 = 1000;
const 간격ms = 250;

function 키읽기() {
  const p = path.resolve('.env');
  if (existsSync(p)) for (const l of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = l.match(/^\s*DATAGO_KEY\s*=\s*(.*)$/);
    if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  }
  return process.env.DATAGO_KEY ?? '';
}

/** ⚠ 이 PC 는 이미 KST 다 */
export function 날짜문자(d) {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}
export function 어제() { const d = new Date(); d.setDate(d.getDate() - 1); return 날짜문자(d); }

/** ⚠ `-.3` 처럼 앞의 0 이 없는 꼴로 온다. Number 가 읽지만 문자열로 두면 화면에 그대로 나간다 */
export function 수(v) {
  if (v == null) return null;
  const s = String(v).replace(/,/g, '').trim();
  if (!s || s === '-') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** `20260731` → `2026-07-31`. 빈 값은 null. **지어내지 않는다** */
export function 날짜(v) {
  const s = String(v ?? '').trim();
  const m = s.match(/^(20\d\d)(\d{2})(\d{2})$/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

/**
 * ⭐ **지수의 유일키.** 이름만 쓰면 코스피 IT 와 코스닥 IT 가 뭉개진다.
 *   조인·집계·그래프에서 이 함수만 쓴다.
 */
export function 키(r) {
  return `${(r.계열 ?? '').trim()}|${(r.이름 ?? '').trim()}`;
}

export function 정리(x) {
  const 구성 = 수(x.epyItmsCnt);
  return {
    일자: x.basDt,
    이름: (x.idxNm ?? '').trim(),
    계열: (x.idxCsf ?? '').trim() || null,
    /** ⚠ 0 이면 **거래되는 지수가 아니라 산출지수**다(K-샤프 등). 거래량 0 의 뜻이 다르다 */
    구성종목수: 구성,
    산출지수: 구성 === 0,
    종가: 수(x.clpr), 전일비: 수(x.vs), 등락률: 수(x.fltRt),
    시가: 수(x.mkp), 고가: 수(x.hipr), 저가: 수(x.lopr),
    거래량: 수(x.trqu), 거래대금: 수(x.trPrc),
    시가총액: 수(x.lstgMrktTotAmt),
    연최고: 수(x.yrWRcrdHgst), 연최고일: 날짜(x.yrWRcrdHgstDt),
    연최저: 수(x.yrWRcrdLwst), 연최저일: 날짜(x.yrWRcrdLwstDt),
    기준시점: 날짜(x.basPntm), 기준지수: 수(x.basIdx),
    연초대비: 수(x.lsYrEdVsFltRt),
  };
}

async function 하루(키값, 일자) {
  const 모음 = [];
  for (let 쪽 = 1; ; 쪽++) {
    const u = `${BASE}?serviceKey=${키값}&numOfRows=${쪽크기}&pageNo=${쪽}&resultType=json&basDt=${일자}`;
    const r = await fetch(u, { signal: AbortSignal.timeout(30000) });
    const t = await r.text();
    let j;
    try { j = JSON.parse(t); } catch { throw new Error(`JSON 아님: ${t.slice(0, 110)}`); }
    const h = j.response?.header ?? j.OpenAPI_ServiceResponse?.cmmMsgHeader;
    const 코드 = h?.resultCode ?? h?.returnReasonCode;
    /* ⚠ 400 은 미승인이 아니라 **내 URL 이 틀린 것**이다 */
    if (코드 && 코드 !== '00') throw new Error(`${코드} ${h.resultMsg ?? h.returnAuthMsg ?? ''}`);
    const b = j.response?.body;
    const 항목 = b?.items?.item ? [].concat(b.items.item) : [];
    모음.push(...항목.map(정리));
    if (모음.length >= Number(b?.totalCount ?? 0) || !항목.length) break;
    await new Promise((x) => setTimeout(x, 간격ms));
  }
  if (모음.length) {
    /* 같은 키가 두 번 오면 뒤엣것을 남긴다 — 원본이 그렇게 주면 그게 최신이다 */
    const 본 = new Map();
    for (const r of 모음) 본.set(키(r), r);
    const 줄 = [...본.values()];
    writeFileSync(path.join(OUT_DIR, `${일자}.ndjson`), 줄.map((r) => JSON.stringify(r)).join('\n') + '\n');
    return { 건수: 줄.length, 중복: 모음.length - 줄.length };
  }
  return { 건수: 0, 중복: 0 };
}

async function main() {
  const 키값 = 키읽기();
  if (!키값) { console.error('✕ DATAGO_KEY 가 없다.'); process.exit(1); }
  mkdirSync(OUT_DIR, { recursive: true });
  const arg = (n) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : null; };

  let 날들 = [];
  const 하루치 = arg('--date'), 부터 = arg('--from'), 까지 = arg('--to');
  if (하루치) 날들 = [하루치];
  else if (부터 && 까지) {
    const d = new Date(+부터.slice(0, 4), +부터.slice(4, 6) - 1, +부터.slice(6, 8));
    const e = new Date(+까지.slice(0, 4), +까지.slice(4, 6) - 1, +까지.slice(6, 8));
    for (; d <= e; d.setDate(d.getDate() + 1)) 날들.push(날짜문자(d));
  } else 날들 = [어제()];   /* ⚠ T+1 */

  let 합 = 0, 빈날 = 0;
  for (const 일자 of 날들) {
    try {
      const { 건수, 중복 } = await 하루(키값, 일자);
      if (!건수) { 빈날++; if (날들.length < 40) console.log(`  ${일자}  0건 (휴장일일 수 있다)`); continue; }
      if (날들.length < 40) console.log(`✅ ${일자}  ${건수}종${중복 ? ` (중복 ${중복} 정리)` : ''}`);
      합 += 건수;
    } catch (e) { console.error(`✕ ${일자}  ${String(e.message).slice(0, 90)}`); }
    await new Promise((x) => setTimeout(x, 간격ms));
  }
  console.log(`\n합계 ${합.toLocaleString()}건 · 빈 날 ${빈날} · ${OUT_DIR}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
