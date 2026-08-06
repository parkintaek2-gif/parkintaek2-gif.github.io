#!/usr/bin/env node
/**
 * **증권상품시세** 수집 — ETF · ETN · ELW.
 *
 *   npm run collect:products                       어제치 (기본)
 *   npm run collect:products -- --date 20260803
 *   npm run collect:products -- --from 20250101 --to 20260803
 *
 * ── 왜 붙이나 ──────────────────────────────────────────────────
 * 승인은 오래전에 나 있었는데 **수집기가 없어 1,169,095건이 놀고 있었다.**
 * 오늘 지수시세도 같은 상태였다. **승인과 수집은 다른 일이다** — 현황판에 그렇게 적었다.
 *
 * ── 오퍼레이션 셋을 실측으로 확인했다 (지어내지 않았다) ─────────
 *   getETFPriceInfo   1,155건/일
 *   getETNPriceInfo     370건/일
 *   getELWPriceInfo   2,830건/일
 *   getSecuritiesProductInfo → 400. **없는 이름이다.** 400 은 미승인이 아니라 내 URL 문제다
 *
 * ── ⚠ 셋의 스키마가 다르다. 하나로 뭉개면 안 된다 ──────────────
 *   ETF  `nav`            **순자산가치**. 종가와 다르면 그게 괴리(프리미엄/디스카운트)다
 *   ETN  `indcVal`        **지표가치**. ETF 의 nav 에 해당하지만 이름이 다르다
 *   ELW  `udasAstNm/Clpr` **기초자산 이름과 종가**. nav 가 없다 — 파생이라 없는 게 맞다
 *   → `기준값` 하나로 합치되 **무엇이었는지 `기준값종류` 에 남긴다.**
 *     합치기만 하면 나중에 「이게 nav 였나 지표가치였나」를 아무도 모른다.
 *
 * ── ⚠ 지키는 것 ───────────────────────────────────────────────
 * · **T+1**. 기본이 어제다        · 시각은 **KST**. `toISOString()` 안 쓴다
 * · `DATAGO_KEY` 는 **이미 URL 인코딩돼 있다.** 다시 걸면 403
 * · 하루치를 한 파일로. 다시 돌리면 덮어쓴다(멱등)
 * · 값 0 은 **「거래 없음」일 수 있다.** 종가·거래량은 0 을 null 로 바꾸지 않는다 —
 *   ELW 는 실제로 10원짜리도 거래된다. 대신 `거래량 === 0` 으로 가른다
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { put, storeStatus, remoteEnabled } from '../src/lib/store.mjs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const BASE = 'https://apis.data.go.kr/1160100/service/GetSecuritiesProductInfoService';
const 종류 = [
  { op: 'getETFPriceInfo', 갈래: 'ETF' },
  { op: 'getETNPriceInfo', 갈래: 'ETN' },
  { op: 'getELWPriceInfo', 갈래: 'ELW' },
];
const OUT_DIR = path.resolve('archive/raw/products');
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

/** ⚠ `-.16` 처럼 앞의 0 이 없는 꼴로 온다 */
export function 수(v) {
  if (v == null) return null;
  const s = String(v).replace(/,/g, '').trim();
  if (!s || s === '-') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/**
 * 셋을 한 꼴로 편다.
 * ⚠ **기준값의 정체를 반드시 남긴다.** ETF 는 순자산가치, ETN 은 지표가치,
 *   ELW 는 없다. 이름만 통일하고 정체를 버리면 나중에 못 되돌린다.
 */
export function 정리(x, 갈래) {
  const 기준 = 갈래 === 'ETF' ? 수(x.nav) : 갈래 === 'ETN' ? 수(x.indcVal) : null;
  return {
    일자: x.basDt,
    갈래,
    코드: (x.srtnCd ?? '').trim() || null,
    isin: (x.isinCd ?? '').trim() || null,
    이름: (x.itmsNm ?? '').replace(/\s+/g, ' ').trim(),
    종가: 수(x.clpr), 전일비: 수(x.vs), 등락률: 수(x.fltRt),
    시가: 수(x.mkp), 고가: 수(x.hipr), 저가: 수(x.lopr),
    거래량: 수(x.trqu), 거래대금: 수(x.trPrc),
    시가총액: 수(x.mrktTotAmt),
    상장좌수: 수(x.stLstgCnt ?? x.lstgScrtCnt),
    기준값: 기준,
    기준값종류: 갈래 === 'ETF' ? '순자산가치(nav)' : 갈래 === 'ETN' ? '지표가치(indcVal)' : null,
    /** ETF/ETN 만. 추종하는 지수 */
    기초지수: (x.bssIdxIdxNm ?? '').trim() || null,
    기초지수종가: 수(x.bssIdxClpr),
    /** ELW 만. 기초자산 */
    기초자산: (x.udasAstNm ?? '').trim() || null,
    기초자산종가: 수(x.udasAstClpr),
    /** ⚠ 거래량 0 이면 그날 안 거래된 것이다. 종가는 전일 값이 남아 있을 수 있다 */
    거래없음: 수(x.trqu) === 0,
  };
}

async function 한갈래(키, op, 갈래, 일자) {
  const 모음 = [];
  for (let 쪽 = 1; ; 쪽++) {
    const u = `${BASE}/${op}?serviceKey=${키}&numOfRows=${쪽크기}&pageNo=${쪽}&resultType=json&basDt=${일자}`;
    const r = await fetch(u, { signal: AbortSignal.timeout(35000) });
    const t = await r.text();
    let j;
    try { j = JSON.parse(t); } catch { throw new Error(`JSON 아님: ${t.slice(0, 100)}`); }
    const h = j.response?.header ?? j.OpenAPI_ServiceResponse?.cmmMsgHeader;
    const 코드 = h?.resultCode ?? h?.returnReasonCode;
    /* ⚠ 400 은 미승인이 아니라 내 URL 이 틀린 것이다 */
    if (코드 && 코드 !== '00') throw new Error(`${코드} ${h.resultMsg ?? h.returnAuthMsg ?? ''}`);
    const b = j.response?.body;
    const 항목 = b?.items?.item ? [].concat(b.items.item) : [];
    모음.push(...항목.map((x) => 정리(x, 갈래)));
    if (모음.length >= Number(b?.totalCount ?? 0) || !항목.length) break;
    await new Promise((x) => setTimeout(x, 간격ms));
  }
  return 모음;
}

async function 하루(키, 일자) {
  const 전부 = [];
  for (const { op, 갈래 } of 종류) {
    전부.push(...await 한갈래(키, op, 갈래, 일자));
    await new Promise((x) => setTimeout(x, 간격ms));
  }
  if (전부.length) {
    const body = 전부.map((r) => JSON.stringify(r)).join('\n') + '\n';
    const res = await put(`raw/products/${일자}.ndjson`, body, 'application/x-ndjson');
    if (res.remoteError) console.warn(`  ⚠ ${일자} R2 실패: ${String(res.remoteError).slice(0, 80)} (로컬엔 있다)`);
  }
  return 전부;
}

async function main() {
  const 키 = 키읽기();
  if (!키) { console.error('✕ DATAGO_KEY 가 없다.'); process.exit(1); }
  mkdirSync(OUT_DIR, { recursive: true });
  if (!remoteEnabled) console.warn('⚠ R2 미설정(ARCHIVE_S3_*): 로컬에만 저장된다. 운영·백업이면 .env 를 확인하라.');
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
      const r = await 하루(키, 일자);
      if (!r.length) { 빈날++; if (날들.length < 40) console.log(`  ${일자}  0건 (휴장일일 수 있다)`); continue; }
      if (날들.length < 40) {
        const c = (g) => r.filter((x) => x.갈래 === g).length;
        console.log(`✅ ${일자}  ETF ${c('ETF')} · ETN ${c('ETN')} · ELW ${c('ELW')} = ${r.length}건`);
      }
      합 += r.length;
    } catch (e) { console.error(`✕ ${일자}  ${String(e.message).slice(0, 90)}`); }
    await new Promise((x) => setTimeout(x, 간격ms));
  }
  console.log(`\n합계 ${합.toLocaleString()}건 · 빈 날 ${빈날} · ${OUT_DIR}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
