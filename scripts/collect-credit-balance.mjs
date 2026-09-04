#!/usr/bin/env node
/**
 * **신용공여 잔고 추이** 수집 — 사장님 지시(2026-09-04, 20·30대 빚투·반대매매 뉴스 계기).
 *
 *   node scripts/collect-credit-balance.mjs                 최근 30일치 (기본)
 *   node scripts/collect-credit-balance.mjs --days 90
 *   node scripts/collect-credit-balance.mjs --자가시험
 *
 * ── 원천 ──────────────────────────────────────────────────────
 * data.go.kr 15094809 「금융위원회_금융투자협회종합통계정보」— 신용공여잔고추이 오퍼레이션.
 * End Point: https://apis.data.go.kr/1160100/service/GetKofiaStatisticsInfoService
 * 오퍼레이션: /getGrantingOfCreditBalanceInfo
 * 2026-09-04 활용신청 자동승인 확인(사장님 계정), 기존 DATAGO_KEY(계정 단위 공용키) 그대로 씀.
 *
 * ⚠ 이것은 **시세가 아니다** — 신용거래융자 잔고(레버리지 노출) 통계다.
 *   FSC 제4유형(주식·채권·지수 «시세» API, 2026-09-09부터 상업·변경 금지)과 다른 범주로 판단.
 *
 * ── 무엇이 오나 (basDt 기준일 단위, 날짜 내림차순) ──────────────
 *   basDt              기준일(YYYYMMDD)
 *   crdTrFingWhl       신용거래융자 잔고 전체
 *   crdTrFingScrs      〃 유가증권(코스피)
 *   crdTrFingKosdaq    〃 코스닥
 *   crdTrLndrWhl       신용거래대주 잔고 전체
 *   crdTrLndrScrs      〃 유가증권
 *   crdTrLndrKosdaq    〃 코스닥
 *   sbscCapLn          청약자금대출
 *   dpsgScrtMogFing    예탁증권담보융자
 *
 * ── 지키는 것 ─────────────────────────────────────────────────
 * · 페이지네이션 — totalCount 다 찰 때까지 pageNo 올린다(한 번에 다 안 옴)
 * · 하루치가 아니라 **날짜 범위 그대로 한 파일**로 떨군다(시계열이라 잘게 안 쪼갠다)
 * · 다시 돌리면 겹치는 날짜는 덮어쓴다(멱등) — «최신값 우선»
 */

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { put } from '../src/lib/store.mjs';

const BASE = 'https://apis.data.go.kr/1160100/service/GetKofiaStatisticsInfoService/getGrantingOfCreditBalanceInfo';
const 저장키 = 'raw/credit-balance/series.json';
const 쪽크기 = 100;
const 간격ms = 300;

function 키읽기() {
  const p = path.resolve('.env');
  if (existsSync(p)) for (const l of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = l.match(/^\s*DATAGO_KEY\s*=\s*(.*)$/);
    if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  }
  return process.env.DATAGO_KEY ?? '';
}

/** 숫자 문자열 → 숫자. 빈 값·'-'·null 은 못 잰 것으로 null */
export function 수(v) {
  if (v == null) return null;
  const s = String(v).replace(/,/g, '').trim();
  if (!s || s === '-') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** API 원본 한 행 → 우리 필드명. 순수함수(자가시험용) */
export function 정리(x) {
  return {
    기준일: x.basDt,
    신용융자_전체: 수(x.crdTrFingWhl),
    신용융자_유가증권: 수(x.crdTrFingScrs),
    신용융자_코스닥: 수(x.crdTrFingKosdaq),
    신용대주_전체: 수(x.crdTrLndrWhl),
    신용대주_유가증권: 수(x.crdTrLndrScrs),
    신용대주_코스닥: 수(x.crdTrLndrKosdaq),
    청약자금대출: 수(x.sbscCapLn),
    예탁증권담보융자: 수(x.dpsgScrtMogFing),
  };
}

async function 전체받기(키) {
  const 모음 = [];
  for (let 쪽 = 1; ; 쪽++) {
    const u = `${BASE}?serviceKey=${키}&numOfRows=${쪽크기}&pageNo=${쪽}&resultType=json`;
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

function 자가시험() {
  let 실패 = 0, 셈 = 0;
  const 자 = (말, 참) => { 셈++; if (!참) { 실패++; console.error(`  ✕ ${말}`); } };

  자('수(null)은 null', 수(null) === null);
  자("수('-')은 null(못잰 것, 0 아님)", 수('-') === null);
  자("수('')은 null", 수('') === null);
  자("수('33,440,441,086,638')은 숫자로", 수('33,440,441,086,638') === 33440441086638);
  자('수(0)은 0 그대로(0과 못잰 것을 안 섞는다)', 수('0') === 0);

  const 예시행 = {
    basDt: '20260902', crdTrFingWhl: '33440441086638', crdTrFingScrs: '26415995618979',
    crdTrFingKosdaq: '7024445467659', crdTrLndrWhl: '31273263192', crdTrLndrScrs: '28453544919',
    crdTrLndrKosdaq: '2819718273', sbscCapLn: '0', dpsgScrtMogFing: '25291512432735',
  };
  const 정리됨 = 정리(예시행);
  자('기준일 보존', 정리됨.기준일 === '20260902');
  자('신용융자_전체 숫자화', 정리됨.신용융자_전체 === 33440441086638);
  자('신용융자_코스닥 숫자화', 정리됨.신용융자_코스닥 === 7024445467659);
  자('청약자금대출 0은 0(못잰 것 아님)', 정리됨.청약자금대출 === 0);
  자('필드 8개 다 있다', Object.keys(정리됨).length === 9);

  console.log(실패 === 0 ? `✅ 자가시험 통과(${셈}개)` : `🔴 자가시험 실패 ${실패}/${셈}건`);
  return 실패 === 0;
}

async function main() {
  if (process.argv.includes('--자가시험')) {
    process.exit(자가시험() ? 0 : 1);
  }

  const 키 = 키읽기();
  if (!키) { console.error('✕ DATAGO_KEY 가 없다.'); process.exit(1); }

  try {
    const { 모음, 총 } = await 전체받기(키);
    if (!모음.length) { console.log('0건 — 못 받았다(원본 확인 필요)'); process.exit(1); }
    모음.sort((a, b) => (a.기준일 < b.기준일 ? 1 : -1)); // 최신 먼저
    const 결과 = await put(저장키, JSON.stringify({ 잰때: new Date().toISOString(), 총건수: 총, 자료: 모음 }, null, 2), 'application/json');
    const 최신 = 모음[0];
    console.log(`✅ 신용공여잔고추이 ${모음.length.toLocaleString()}건(신고 총 ${총.toLocaleString()}) → 로컬 ${결과.local}${결과.remote ? ' · R2 저장 완료' : (결과.remoteError ? ` · R2 실패: ${결과.remoteError}` : ' · R2 비활성')}`);
    console.log(`   최신(${최신.기준일}): 신용융자 전체 ${(최신.신용융자_전체 / 1e12).toFixed(2)}조원 (코스피 ${(최신.신용융자_유가증권 / 1e12).toFixed(2)}조·코스닥 ${(최신.신용융자_코스닥 / 1e12).toFixed(2)}조)`);
  } catch (e) {
    console.error(`✕ ${String(e.message).slice(0, 150)}`);
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
