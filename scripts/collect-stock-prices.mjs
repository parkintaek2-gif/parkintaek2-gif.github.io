#!/usr/bin/env node
/**
 * **주식시세** 수집 — 상장 전 종목의 일별 종가·시가총액·상장주식수.
 *
 *   npm run collect:stocks                         어제치 (기본)
 *   npm run collect:stocks -- --date 20260803
 *   npm run collect:stocks -- --from 20200101 --to 20260803
 *
 * ── 왜 이게 제일 큰가 ─────────────────────────────────────────
 * 승인된 것 중 **최대(4,368,788건)**이고, 우리가 가진 것 중 **유일하게 종목 단위**다.
 * 지수·파생·증권상품은 전부 묶음이라 「어느 회사」를 말할 수 없었다.
 * 이게 붙으면 **순위표(rankings)의 사람 축과 주가를 붙일 수 있다** —
 * 근속·급여·성별격차를 시총·수익률과 맞대는 것이 우리가 하려던 일이다.
 *
 * ── 실측 (지어내지 않았다) ────────────────────────────────────
 *   getStockPriceInfo    2,872건/일   ✅
 *   getItemInfo          코드 12 「해당 오픈API 서비스가 없거나 폐기됨」 ← 없는 이름
 *   getStockMarketInfo   코드 12                                    ← 없는 이름
 *   ⚠ 12/400 은 **미승인이 아니라 내 URL 문제**다. 403 이라야 미승인이다
 *
 * ── ⚠ 0 을 값으로 읽지 않는다 ────────────────────────────────
 * 거래정지·상장 첫날 등에서 거래량 0 이 나온다. 그때 종가는 전일 값이 남아 있다.
 * **null 로 바꾸지 않는다**(원자료를 훼손하는 것이다). 대신 `거래없음` 으로 표시한다.
 *
 * ── ⚠ 지키는 것 ───────────────────────────────────────────────
 * · **T+1**. 기본이 어제다        · 시각은 **KST**. `toISOString()` 안 쓴다
 * · `DATAGO_KEY` 는 **이미 URL 인코딩돼 있다.** 다시 걸면 403
 * · 하루치를 한 파일로. 다시 돌리면 덮어쓴다(멱등)
 * · **긴 구간은 하루가 끝날 때마다 쓴다.** 끝에 모아서 쓰면 중간에 죽을 때 전부 날린다 —
 *   채권 백필에서 94%에서 죽어 전부 날린 적이 있다. 같은 실수를 반복하지 않는다
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const URL_ = 'https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService/getStockPriceInfo';
const OUT_DIR = path.resolve('archive/raw/stocks');
const 진행파일 = path.resolve('archive/raw/stocks/.progress.json');
const 쪽크기 = 1000;
const 간격ms = 220;

function 키읽기() {
  const p = path.resolve('.env');
  if (existsSync(p)) for (const l of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = l.match(/^\s*DATAGO_KEY\s*=\s*(.*)$/);
    if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  }
  return process.env.DATAGO_KEY ?? '';
}

/** ⚠ 이 PC 는 이미 KST 다. 9시간을 더하지 않는다 */
export function 날짜문자(d) {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}
export function 어제() { const d = new Date(); d.setDate(d.getDate() - 1); return 날짜문자(d); }

/** ⚠ `-.16` 처럼 앞의 0 이 없는 꼴로 온다. 쉼표도 섞인다 */
export function 수(v) {
  if (v == null) return null;
  const s = String(v).replace(/,/g, '').trim();
  if (!s || s === '-') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** KOSPI/KOSDAQ/KONEX. 공백·표기 흔들림을 여기서 흡수한다 */
export function 시장(v) {
  const s = (v ?? '').replace(/\s+/g, '').toUpperCase();
  if (s.includes('KOSPI') || s.includes('유가증권')) return 'KOSPI';
  if (s.includes('KOSDAQ') || s.includes('코스닥')) return 'KOSDAQ';
  if (s.includes('KONEX') || s.includes('코넥스')) return 'KONEX';
  return (v ?? '').trim() || null;
}

export function 정리(x) {
  const 거래량 = 수(x.trqu);
  return {
    일자: x.basDt,
    코드: (x.srtnCd ?? '').trim() || null,
    isin: (x.isinCd ?? '').trim() || null,
    이름: (x.itmsNm ?? '').replace(/\s+/g, ' ').trim(),
    시장: 시장(x.mrktCtg),
    종가: 수(x.clpr), 전일비: 수(x.vs), 등락률: 수(x.fltRt),
    시가: 수(x.mkp), 고가: 수(x.hipr), 저가: 수(x.lopr),
    거래량, 거래대금: 수(x.trPrc),
    상장주식수: 수(x.lstgStCnt),
    시가총액: 수(x.mrktTotAmt),
    /** ⚠ 거래량 0 이면 그날 안 거래된 것. 종가는 전일 값이 남아 있을 수 있다 */
    거래없음: 거래량 === 0,
  };
}

async function 하루(키, 일자) {
  const 모음 = [];
  for (let 쪽 = 1; ; 쪽++) {
    const u = `${URL_}?serviceKey=${키}&numOfRows=${쪽크기}&pageNo=${쪽}&resultType=json&basDt=${일자}`;
    const r = await fetch(u, { signal: AbortSignal.timeout(35000) });
    const t = await r.text();
    let j;
    try { j = JSON.parse(t); } catch { throw new Error(`JSON 아님: ${t.slice(0, 90)}`); }
    const h = j.response?.header ?? j.OpenAPI_ServiceResponse?.cmmMsgHeader;
    const 코드 = h?.resultCode ?? h?.returnReasonCode;
    if (코드 && 코드 !== '00') throw new Error(`${코드} ${h.resultMsg ?? h.returnAuthMsg ?? ''}`);
    const b = j.response?.body;
    const 항목 = b?.items?.item ? [].concat(b.items.item) : [];
    모음.push(...항목.map(정리));
    if (모음.length >= Number(b?.totalCount ?? 0) || !항목.length) break;
    await new Promise((x) => setTimeout(x, 간격ms));
  }
  /* ⚠ 하루가 끝나면 **즉시 쓴다.** 모아서 쓰지 않는다 */
  if (모음.length) {
    writeFileSync(path.join(OUT_DIR, `${일자}.ndjson`), 모음.map((r) => JSON.stringify(r)).join('\n') + '\n');
  }
  return 모음;
}

async function main() {
  const 키 = 키읽기();
  if (!키) { console.error('✕ DATAGO_KEY 가 없다.'); process.exit(1); }
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

  /* 이미 받은 날은 건너뛴다 — 백필을 끊었다 이어도 처음부터 다시 돌지 않게 */
  const 건너뜀 = 날들.filter((d) => existsSync(path.join(OUT_DIR, `${d}.ndjson`))).length;
  날들 = 날들.filter((d) => !existsSync(path.join(OUT_DIR, `${d}.ndjson`)));
  if (건너뜀) console.log(`이미 있는 ${건너뜀}일은 건너뛴다`);

  let 합 = 0, 빈날 = 0, 실패 = 0;
  const 짧다 = 날들.length < 40;
  for (const [i, 일자] of 날들.entries()) {
    try {
      const r = await 하루(키, 일자);
      if (!r.length) { 빈날++; if (짧다) console.log(`  ${일자}  0건 (휴장일일 수 있다)`); continue; }
      합 += r.length;
      if (짧다) {
        const c = (m) => r.filter((x) => x.시장 === m).length;
        console.log(`✅ ${일자}  KOSPI ${c('KOSPI')} · KOSDAQ ${c('KOSDAQ')} · KONEX ${c('KONEX')} = ${r.length}건`);
      } else if ((i + 1) % 50 === 0) {
        console.log(`  ${일자}  누적 ${합.toLocaleString()}건 (${i + 1}/${날들.length})`);
        writeFileSync(진행파일, JSON.stringify({ 마지막: 일자, 누적: 합, 시각: new Date().toLocaleString('ko-KR') }));
      }
    } catch (e) { 실패++; console.error(`✕ ${일자}  ${String(e.message).slice(0, 90)}`); }
    await new Promise((x) => setTimeout(x, 간격ms));
  }
  console.log(`\n합계 ${합.toLocaleString()}건 · 빈 날 ${빈날} · 실패 ${실패} · ${OUT_DIR}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
