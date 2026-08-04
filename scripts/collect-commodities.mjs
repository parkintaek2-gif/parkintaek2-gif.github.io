#!/usr/bin/env node
/**
 * **일반상품시세** 수집 — Commodities 축. (한국거래소 금시장·석유시장)
 *
 *   npm run collect:commodities                      어제치 (기본)
 *   npm run collect:commodities -- --date 20260803
 *   npm run collect:commodities -- --from 20260701 --to 20260803
 *
 * ── 왜 지금 붙이나 ─────────────────────────────────────────────
 * 2026-08-04 13:18 승인 확인에서 **일반상품시세가 이미 승인돼 있었다.** 4,845건.
 * 그런데 `commodities` 카테고리에는 **기사가 한 편도 없었다.** 데이터가 열려 있는데
 * 수집기를 안 붙여 두고 「출처가 없다」고 알고 있던 셈이다.
 *
 * ── ⚠ 오퍼레이션 이름을 지어내지 않는다 ─────────────────────────
 * 채권에서 `getBondBasiInfo` 를 지어냈다가 `NO_OPENAPI_SERVICE_ERROR`(400)를
 * 「미승인」으로 잘못 읽고 몇 주를 날렸다. 이번엔 **실측으로 확인했다.**
 *
 *   200  getOilPriceInfo    4,845건   ← 석유시장
 *   200  getGoldPriceInfo   3,232건   ← 금시장
 *   400  배출권 계열 12가지 전부 실패 — **이 서비스에 배출권은 없다.**
 *        KRX 배출권시장은 별도 데이터셋이다. 찾으면 여기에 축을 하나 더 붙인다.
 *
 * ── 두 시장의 스키마가 다르다 ──────────────────────────────────
 * 같은 서비스인데 **필드가 아예 다르다.** 하나로 뭉개면 안 된다.
 *
 *   금(getGoldPriceInfo)    종목이 있다 — srtnCd·isinCd·itmsNm·clpr·mkp/hipr/lopr
 *                           증권처럼 종가·등락률이 온다
 *   석유(getOilPriceInfo)   종목이 없다 — oilCtg(경유·휘발유…) 별 **가중평균가**
 *                           ⭐ 그리고 가중평균이 **둘**이다:
 *                              wtAvgPrcCptn  경쟁매매 가중평균
 *                              wtAvgPrcDisc  협의매매 가중평균
 *                           두 값의 차이가 곧 「누가 어떻게 샀나」다. 합치지 않는다
 *
 * ── ⚠ 지키는 것 ───────────────────────────────────────────────
 * · **T+1**. 라이선스상 당일치를 쓰지 않는다. 기본이 어제다
 * · 시각은 **KST**. `toISOString()` 을 쓰면 새벽에 하루가 어긋난다
 * · `DATAGO_KEY` 는 **이미 URL 인코딩돼 있다.** 다시 인코딩하면 403 이다
 * · 하루치를 **한 파일**로 떨군다. 다시 돌리면 덮어쓴다(멱등)
 * · 시장을 한 파일에 섞되 `시장` 필드로 반드시 가른다
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const BASE = 'https://apis.data.go.kr/1160100/service/GetGeneralProductInfoService';
const 오퍼 = { 금: 'getGoldPriceInfo', 석유: 'getOilPriceInfo' };
const OUT_DIR = path.resolve('archive/raw/commodities');
const 쪽크기 = 1000;
const 간격ms = 350;

function 키읽기() {
  const p = path.resolve('.env');
  if (existsSync(p)) for (const l of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = l.match(/^\s*DATAGO_KEY\s*=\s*(.*)$/);
    if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  }
  return process.env.DATAGO_KEY ?? '';
}

/** ⚠ 이 PC 는 이미 KST 다. 9시간을 더하지 않고 toISOString 도 쓰지 않는다 */
export function 날짜문자(d) {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}
export function 어제() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return 날짜문자(d);
}

/** 숫자로 바꾸되 **빈 칸과 0 을 구분한다.** 공백 하나(' ')로 오는 필드가 실제로 있다 */
export function 수(v) {
  if (v == null) return null;
  const s = String(v).replace(/,/g, '').trim();
  if (!s || s === '-') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/**
 * 금은 종목 단위다. 증권 시세와 같은 꼴로 온다.
 *
 * ⚠ `fltRt` 가 `-.55` 처럼 **앞의 0 이 없는 꼴**로 온다. `Number('-.55')` 는
 *   -0.55 로 잘 읽히지만, 문자열로 두고 화면에 그대로 내면 `-.55` 가 나간다.
 *   여기서 숫자로 바꿔 둔다.
 */
export function 금정리(x, 일자) {
  return {
    일자: x.basDt ?? 일자,
    시장: '금',
    코드: (x.srtnCd ?? '').trim() || null,
    isin: (x.isinCd ?? '').trim() || null,
    이름: (x.itmsNm ?? '').trim(),
    종가: 수(x.clpr), 전일비: 수(x.vs), 등락률: 수(x.fltRt),
    시가: 수(x.mkp), 고가: 수(x.hipr), 저가: 수(x.lopr),
    거래량: 수(x.trqu), 거래대금: 수(x.trPrc),
  };
}

/**
 * 석유는 **유종별 집계**다. 종목도 종가도 없다.
 *
 * ⚠ 가중평균이 두 개인 것이 이 데이터의 핵심이다.
 *   경쟁매매(cptn)는 거래소 호가창에서 붙은 값, 협의매매(disc)는 당사자끼리 정한 값이다.
 *   **한쪽만 쓰면 시장을 절반만 본다.** 둘 다 남기고, 화면에서 나란히 보여 준다.
 */
export function 석유정리(x, 일자) {
  return {
    일자: x.basDt ?? 일자,
    시장: '석유',
    유종: (x.oilCtg ?? '').trim(),
    경쟁가중평균: 수(x.wtAvgPrcCptn),
    협의가중평균: 수(x.wtAvgPrcDisc),
    거래량: 수(x.trqu), 거래대금: 수(x.trPrc),
  };
}

async function 한시장(키, 오퍼이름, 일자, 정리) {
  const 모음 = [];
  for (let 쪽 = 1; ; 쪽++) {
    const u = `${BASE}/${오퍼이름}?serviceKey=${키}&numOfRows=${쪽크기}&pageNo=${쪽}&resultType=json&basDt=${일자}`;
    const r = await fetch(u, { signal: AbortSignal.timeout(30000) });
    const t = await r.text();
    let j;
    try { j = JSON.parse(t); } catch { throw new Error(`JSON 아님: ${t.slice(0, 120)}`); }
    /* ⚠ 400 은 「미승인」이 아니라 **내 URL 이 틀린 것**이다. 메시지를 그대로 올린다 */
    const h = j.response?.header ?? j.OpenAPI_ServiceResponse?.cmmMsgHeader;
    const 코드 = h?.resultCode ?? h?.returnReasonCode;
    if (코드 && 코드 !== '00') throw new Error(`${코드} ${h.resultMsg ?? h.returnAuthMsg ?? ''}`);
    const b = j.response?.body;
    const 항목 = b?.items?.item ? [].concat(b.items.item) : [];
    모음.push(...항목.map((x) => 정리(x, 일자)));
    const 총 = Number(b?.totalCount ?? 0);
    if (모음.length >= 총 || 항목.length === 0) return 모음;
    await new Promise((x) => setTimeout(x, 간격ms));
  }
}

async function main() {
  const 키 = 키읽기();
  if (!키) { console.error('✕ DATAGO_KEY 가 없다.'); process.exit(1); }
  const arg = (n) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : null; };

  let 날들 = [];
  const 하루 = arg('--date');
  const 부터 = arg('--from'), 까지 = arg('--to');
  if (하루) 날들 = [하루];
  else if (부터 && 까지) {
    const d = new Date(+부터.slice(0, 4), +부터.slice(4, 6) - 1, +부터.slice(6, 8));
    const e = new Date(+까지.slice(0, 4), +까지.slice(4, 6) - 1, +까지.slice(6, 8));
    for (; d <= e; d.setDate(d.getDate() + 1)) 날들.push(날짜문자(d));
  } else 날들 = [어제()];   /* ⚠ T+1 — 당일치를 기본으로 하지 않는다 */

  mkdirSync(OUT_DIR, { recursive: true });
  let 합 = 0, 빈날 = 0;
  for (const 일자 of 날들) {
    try {
      const 금 = await 한시장(키, 오퍼.금, 일자, 금정리);
      await new Promise((x) => setTimeout(x, 간격ms));
      const 석유 = await 한시장(키, 오퍼.석유, 일자, 석유정리);
      const 모음 = [...금, ...석유];
      if (!모음.length) { 빈날++; console.log(`  ${일자}  0건 (휴장일일 수 있다)`); continue; }
      writeFileSync(path.join(OUT_DIR, `${일자}.ndjson`), 모음.map((r) => JSON.stringify(r)).join('\n') + '\n');
      /* 협의매매가 실제로 있는 날만 세어 둔다 — 없는 날이 흔하다 */
      const 협의 = 석유.filter((r) => r.협의가중평균 != null).length;
      console.log(`✅ ${일자}  금 ${금.length}건 · 석유 ${석유.length}건(협의값 있음 ${협의})`);
      합 += 모음.length;
    } catch (e) {
      console.error(`✕ ${일자}  ${String(e.message).slice(0, 90)}`);
    }
    await new Promise((x) => setTimeout(x, 간격ms));
  }
  console.log(`\n합계 ${합.toLocaleString()}건 · 빈 날 ${빈날} · ${OUT_DIR}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
