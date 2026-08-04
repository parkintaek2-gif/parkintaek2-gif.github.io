#!/usr/bin/env node
/**
 * **채권시세** 수집 — Rates 축.
 *
 *   npm run collect:bonds                 어제치 (기본)
 *   npm run collect:bonds -- --date 20260731
 *   npm run collect:bonds -- --from 20260701 --to 20260731
 *
 * ── 왜 지금 붙이나 ─────────────────────────────────────────────
 * 2026-08-04 09:07 승인 확인에서 **채권시세가 이미 승인돼 있었다.** 555,999건.
 * 내가 오퍼레이션 이름을 `getBondBasiInfo` 로 지어내는 바람에
 * `NO_OPENAPI_SERVICE_ERROR` 가 났고, 그걸 **「미승인」으로 잘못 읽어 계속 보고했다.**
 * 진짜는 `getBondPriceInfo` 다.
 *
 * ⚠ 교훈 — `NO_OPENAPI_SERVICE_ERROR` 는 **승인 여부가 아니라 경로 문제**다.
 *   승인 상태를 판정하는 코드가 이 둘을 섞으면 안 된다.
 *
 * ── 무엇이 오나 ────────────────────────────────────────────────
 *   basDt      기준일          srtnCd/isinCd  종목코드
 *   itmsNm     종목명          mrktCtg        일반채권·소액채권 등
 *   clprPrc    종가            **clprBnfRt    종가 수익률(%)** ← Rates 축의 핵심
 *   mkpPrc/BnfRt · hiprPrc/BnfRt · loprPrc/BnfRt   시가·고가·저가와 각 수익률
 *   trqu       거래량          trPrc          거래대금
 *
 * ── ⚠ 지키는 것 ───────────────────────────────────────────────
 * · **T+1**. 라이선스상 당일치를 쓰지 않는다. 기본이 어제다
 * · 시각은 **KST**. `toISOString()` 을 쓰면 새벽에 하루가 어긋난다
 * · `DATAGO_KEY` 는 **이미 URL 인코딩돼 있다.** 다시 인코딩하면 403 이다
 * · 하루치를 **한 파일**로 떨군다. 다시 돌리면 덮어쓴다(멱등)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const BASE = 'https://apis.data.go.kr/1160100/service/GetBondSecuritiesInfoService/getBondPriceInfo';
const OUT_DIR = path.resolve('archive/raw/bonds');
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

export function 정리(x) {
  return {
    일자: x.basDt, 코드: x.srtnCd, isin: x.isinCd, 이름: (x.itmsNm ?? '').trim(),
    시장: (x.mrktCtg ?? '').trim() || null, 잔존연수: 수(x.xpYrCnt), 분류: (x.itmsCtg ?? '').trim() || null,
    종가: 수(x.clprPrc), 전일비: 수(x.clprVs), 수익률: 수(x.clprBnfRt),
    시가: 수(x.mkpPrc), 시가수익률: 수(x.mkpBnfRt),
    고가: 수(x.hiprPrc), 고가수익률: 수(x.hiprBnfRt),
    저가: 수(x.loprPrc), 저가수익률: 수(x.loprBnfRt),
    거래량: 수(x.trqu), 거래대금: 수(x.trPrc),
  };
}

async function 하루받기(키, 일자) {
  const 모음 = [];
  for (let 쪽 = 1; ; 쪽++) {
    const u = `${BASE}?serviceKey=${키}&numOfRows=${쪽크기}&pageNo=${쪽}&resultType=json&basDt=${일자}`;
    const r = await fetch(u, { signal: AbortSignal.timeout(30000) });
    const t = await r.text();
    let j;
    try { j = JSON.parse(t); } catch { throw new Error(`JSON 아님: ${t.slice(0, 120)}`); }
    const h = j.response?.header;
    if (h && h.resultCode !== '00') throw new Error(`${h.resultCode} ${h.resultMsg}`);
    const b = j.response?.body;
    const 항목 = b?.items?.item ? [].concat(b.items.item) : [];
    모음.push(...항목.map(정리));
    const 총 = Number(b?.totalCount ?? 0);
    if (모음.length >= 총 || 항목.length === 0) return { 모음, 총 };
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
    const 산출 = path.join(OUT_DIR, `${일자}.ndjson`);
    try {
      const { 모음, 총 } = await 하루받기(키, 일자);
      if (!모음.length) { 빈날++; console.log(`  ${일자}  0건 (휴장일일 수 있다)`); continue; }
      writeFileSync(산출, 모음.map((r) => JSON.stringify(r)).join('\n') + '\n');
      const 수익률있음 = 모음.filter((r) => r.수익률 != null).length;
      console.log(`✅ ${일자}  ${모음.length.toLocaleString()}건 (신고 총 ${총.toLocaleString()}) · 수익률 있음 ${수익률있음.toLocaleString()}`);
      합 += 모음.length;
    } catch (e) {
      console.error(`✕ ${일자}  ${String(e.message).slice(0, 90)}`);
    }
    await new Promise((x) => setTimeout(x, 간격ms));
  }
  console.log(`\n합계 ${합.toLocaleString()}건 · 빈 날 ${빈날} · ${OUT_DIR}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
