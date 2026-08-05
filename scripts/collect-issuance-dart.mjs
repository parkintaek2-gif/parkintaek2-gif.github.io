#!/usr/bin/env node
/**
 * **증자(감자) 현황 · 주식의 총수** — DART 에서 받는다.
 *
 *   npm run collect:issuance            이어받기
 *   npm run collect:issuance -- --limit 200
 *
 * ── ⭐ 왜 DART 인가 — **메일 없이 풀었다** ──────────────────────
 * 같은 자료를 공공데이터포털 **주식발행정보(15043423)** 에서도 준다. 152,396건을
 * 받아 봤고 상장사와 99.3% 가 붙었다. 그런데 **공공누리 제2유형(상업적 이용금지)** 이었다 —
 * 원천이 한국예탁결제원이라 별도 정보이용계약이 필요하다. 전부 격리했다.
 *
 * 사장님 지시: **「1. 메일 안 보내고 해결해. 안 되면 2. 메일 보내서 해결해」**
 *
 * 계약을 물으러 가기 전에 **같은 사실을 주는 다른 출처**를 찾았다. DART 가 준다.
 *
 * ```
 *                     예탁결제원 15043423      DART irdsSttus
 * 라이선스             🔴 2유형 · 계약 필요      🟢 **제한 없음**
 * 발행일·형태·수량      있음                     있음
 * **발행가**           **없음**                 **있음**   ← 희석 기사의 핵심이다
 * 자기주식·유통주식수    없음                     stockTotqySttus 에 있음
 * ```
 *
 * **막힌 것은 그 기관의 표현이지 사실이 아니다.** 사실에는 저작권이 없다.
 *
 * ── 무엇이 오나 ────────────────────────────────────────────────
 * `irdsSttus` 한 번에 그 회사의 **증자·감자 이력이 여러 해치** 온다(표본 40곳 중 31곳).
 *   유상증자(주주배정·제3자배정·일반공모) · 전환권행사 · 무상증자 · 자본감소 …
 * `stockTotqySttus` 는 발행총수·감소총수·**자기주식·유통주식수**를 준다.
 *   ⚠ 유통주식수는 시가총액 계산의 분모다. 상장주식수로 계산하면 자기주식이 섞인다.
 *
 * ── ⚠ 지키는 것 ────────────────────────────────────────────────
 * · **원문을 같이 저장한다.** 파서를 고쳤을 때 다시 안 받으려고 —
 *   오늘 그게 없어서 2,921번을 다시 불렀고, 있어서 0번으로 고쳤다
 * · 이어받기 · DART 일일 한도(20,000)에서 멈추면 그대로 중단
 * · 키는 로그에 찍지 않는다 (저장소가 공개다)
 */

import { readFileSync, existsSync, mkdirSync, appendFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const OUT_DIR = path.resolve('archive/raw/dart-issuance');
const 간격ms = 200;
const 연도 = 2025;

function 키읽기() {
  const p = path.resolve('.env');
  if (existsSync(p)) for (const l of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = l.match(/^\s*DART_API_KEY\s*=\s*(.*)$/);
    if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  }
  return process.env.DART_API_KEY ?? '';
}

/** ⚠ `-` 와 빈칸은 **없음**이다. 0 으로 만들지 않는다 */
export function 수(v) {
  if (v == null) return null;
  const s = String(v).replace(/,/g, '').trim();
  if (!s || /^[-–—]$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** "2021.09.11" · "2021-09-11" · "20210911" → "20210911". 못 읽으면 null */
export function 날짜(v) {
  const s = String(v ?? '').replace(/[^0-9]/g, '');
  return /^\d{8}$/.test(s) ? s : null;
}

/**
 * 증자 한 줄. **원문(`형태원문`)을 같이 남긴다** — 형태 문자열이 자유서식이라
 * 나중에 분류를 고칠 때 다시 받지 않으려고.
 */
export function 증자정리(x) {
  return {
    접수번호: x.rcept_no ?? null,
    일자: 날짜(x.isu_dcrs_de),
    일자원문: x.isu_dcrs_de ?? null,
    형태원문: x.isu_dcrs_stle ?? null,      // 유상증자(제3자배정) · 전환권행사 · 무상증자 …
    주식종류: x.isu_dcrs_stock_knd ?? null,
    수량: 수(x.isu_dcrs_qy),
    액면가: 수(x.isu_dcrs_mstvdv_fval_amount),
    발행가: 수(x.isu_dcrs_mstvdv_amount),   // ⭐ 예탁결제원 자료에는 없던 항목
    결산일: x.stlm_dt ?? null,
  };
}

/** 주식의 총수 한 줄 */
export function 총수정리(x) {
  return {
    구분: x.se ?? null,                      // 보통주 · 우선주 · 합계
    발행할주식총수: 수(x.isu_stock_totqy),
    현재발행총수: 수(x.now_to_isu_stock_totqy),
    현재감소총수: 수(x.now_to_dcrs_stock_totqy),
    감자: 수(x.redc), 이익소각: 수(x.profit_incnr), 상환주식상환: 수(x.rdmstk_repy), 기타: 수(x.etc),
    발행주식총수: 수(x.istc_totqy),
    자기주식: 수(x.tesstk_co),
    유통주식수: 수(x.distb_stock_co),        // ⭐ 시가총액의 진짜 분모
  };
}

async function 부르기(키, ep, corp) {
  const u = `https://opendart.fss.or.kr/api/${ep}.json?crtfc_key=${키}&corp_code=${corp}&bsns_year=${연도}&reprt_code=11011`;
  const r = await fetch(u, { signal: AbortSignal.timeout(20000) });
  return r.json();
}

async function main() {
  const 키 = 키읽기();
  if (!키) { console.error('✕ DART_API_KEY 가 없다.'); process.exit(1); }
  mkdirSync(OUT_DIR, { recursive: true });
  const 산출 = path.join(OUT_DIR, `issuance-${연도}.ndjson`);

  /**
   * ⚠ **시장 코드로 거른다.** `corp_cls` 는 Y(유가)·K(코스닥)·N(코넥스)·E(기타)다.
   *   E 는 대부분 상장폐지·등록취소라 2025년 사업보고서가 없다 — 실측으로 앞 다섯 곳이
   *   전부 `013 조회된 데이타가 없습니다` 였다. **약 1,000번을 헛부르게 된다.**
   */
  const 전체 = readFileSync(path.resolve('archive/raw/dart-company/company.ndjson'), 'utf8')
    .split('\n').filter((x) => x.trim()).map((l) => JSON.parse(l));
  const 상장 = 전체.filter((c) => ['Y', 'K', 'N'].includes(String(c.시장 ?? '')));
  console.log(`명단 ${전체.length.toLocaleString()} → 시장 Y·K·N 만 ${상장.length.toLocaleString()} ` +
    `(E 등 ${(전체.length - 상장.length).toLocaleString()}곳 제외)`);

  /* 이어받기 */
  const 완료 = new Set();
  if (existsSync(산출)) for (const l of readFileSync(산출, 'utf8').split('\n')) {
    if (!l.trim()) continue;
    try { 완료.add(JSON.parse(l).corp); } catch { /* 깨진 줄 */ }
  }
  const i = process.argv.indexOf('--limit');
  const 한도 = i > -1 ? Number(process.argv[i + 1]) : Infinity;
  const 남은 = 상장.filter((c) => !완료.has(c.corp)).slice(0, 한도);
  console.log(`상장사 ${상장.length.toLocaleString()} · 이미 받음 ${완료.size.toLocaleString()} · 이번에 ${남은.length.toLocaleString()}`);

  let 성공 = 0, 없음 = 0, 실패 = 0, 증자행 = 0;
  for (const [n, c] of 남은.entries()) {
    try {
      const a = await 부르기(키, 'irdsSttus', c.corp);
      /* ⚠ 한도 초과면 **멈춘다.** 계속 두드리면 내일까지 막힌다 */
      if (a.status === '020') { console.error('\n✕ DART 일일 한도 초과. 멈춘다.'); break; }
      await new Promise((s) => setTimeout(s, 간격ms));
      const b = await 부르기(키, 'stockTotqySttus', c.corp);
      if (b.status === '020') { console.error('\n✕ DART 일일 한도 초과. 멈춘다.'); break; }

      if (a.status !== '000' && b.status !== '000') { 없음++; }
      else {
        /* 「-」만 있는 줄은 **증자가 없었다**는 뜻이다. 버리지 말고 빈 배열로 둔다 */
        const 증자 = (a.list ?? []).map(증자정리).filter((x) => x.일자 || x.수량 != null);
        증자행 += 증자.length;
        appendFileSync(산출, JSON.stringify({
          corp: c.corp, 종목: c.종목, 이름: c.이름, 영문: c.영문, 연도: String(연도),
          증자, 총수: (b.list ?? []).map(총수정리),
        }) + '\n');
        성공++;
      }
    } catch { 실패++; }
    if ((n + 1) % 200 === 0) console.log(`  ${n + 1}/${남은.length} — 성공 ${성공} · 증자행 ${증자행.toLocaleString()} · 미제출 ${없음} · 실패 ${실패}`);
    await new Promise((s) => setTimeout(s, 간격ms));
  }
  console.log(`\n✅ 성공 ${성공.toLocaleString()} · 증자행 ${증자행.toLocaleString()} · 미제출 ${없음.toLocaleString()} · 실패 ${실패.toLocaleString()}`);
  console.log(`   ${산출}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
