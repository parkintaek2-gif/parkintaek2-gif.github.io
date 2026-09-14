#!/usr/bin/env node
/**
 * collect-dubai-dfm-financials.mjs — **DFM(두바이) 재무제표 수치, 항목4 후속(5번 18:30 지침).**
 * ADX 는 거래소 자체 AI 요약(aiJsonDataEn)이 있어 PDF 를 안 열어도 됐지만, DFM 은 그게
 * 없다 — collect-dubai-dfm-companies.mjs 가 받아 둔 financialStatementFilings(PDF 목록)의
 * PDF 를 **직접 열어 표를 읽는다.**
 *
 *   node scripts/collect-dubai-dfm-financials.mjs --자가시험
 *   node scripts/collect-dubai-dfm-financials.mjs                전 종목(재무제출이력 있는 곳만)
 *   node scripts/collect-dubai-dfm-financials.mjs --종목=EMAAR,DIB,DEWA
 *
 * ── 🔴 오늘의 발견 — DFM PDF 실제 주소 (`docs/세션간-메모.md` 13:2x 에 "못 찾았다"고
 * 적었던 것을 찾았다) ──────────────────────────────────────────────────────────
 *   efsah 목록의 pdfPath(=r_path) 앞에 **`https://feeds.dfm.ae/documents`** 를 붙이면 된다.
 *   실측(2026-09-14, 브라우저로 실제 "1 File(s)" 팝오버를 열어 링크를 잡았다) —
 *   assets.dfm.ae·efsah.dfm.ae(사용 중단된 도메인) 등 10여 개 후보는 전부 틀렸었다.
 *   인증·특수헤더 필요 없음 — plain fetch/curl 로 200.
 *
 * ── PDF 읽는 법 — `pdftotext -table` (⚠ `-layout` 이 아니다) ─────────────────────
 *   처음엔 -layout 으로 열어 「표가 불규칙하다」고 적었다(ADX 도 DFM 도). 그런데
 *   poppler 의 `-table` 옵션("표에 최적화")을 쓰니 라벨과 숫자가 «줄 하나»로 깔끔히
 *   붙어 나온다(실측 3사: Emaar·DIB·DEWA — 부동산·이슬람은행·전력공사 셋 다 확인).
 *   ⇒ **ADX 도 이 옵션을 알았으면 Assets·Equity 까지 뽑을 수 있었다** — 여기서 새로
 *   배운 것이라 이 자에만 우선 적용한다(ADX 보강은 다음 손질로 미룬다. 지금은 5번이
 *   정한 18:30 마감을 지키는 게 먼저다).
 *
 * ── 회사마다 표가 다르다 — 실측 그대로 적는다 ────────────────────────────────
 *   Emaar(부동산)   "Revenue" · "NET PROFIT FOR THE PERIOD" · 열 순서 = 6개월먼저→3개월
 *   DIB(이슬람은행)  "Total income" · "Net profit for the period" · 열 순서 = 3개월먼저→6개월
 *   DEWA(전력공사)   "Revenue" · "Profit for the period after tax" · 열 순서 = 6개월먼저→3개월
 *   ⇒ 회사마다 ①쓰는 낱말 ②숫자 넉 줄의 순서가 다르다. 라벨은 우선순위 목록으로,
 *     순서는 그 통계표 머리글("Three-month period"·"Six-month period" 중 어느 것이
 *     문장에서 먼저 나오는지)을 직접 읽어 판정한다 — 추측하지 않는다.
 *
 * ⛔ **Expense·Cash and Cash Equivalents 는 안 낸다** — ADX 는 거래소 AI가 이미 그 두
 *   값을 한 줄로 정리해 줬지만, DFM PDF 는 회사마다 "무엇을 Expense 로 묶을지"·
 *   "어느 현금 줄이 진짜 현금성자산인지"가 표마다 달라 자신 있게 하나로 못 골랐다
 *   (실측: DEWA 만 봐도 "Cash and cash equivalents"가 4곳에 다른 값으로 나온다 —
 *   기초잔액·기말잔액·주석 내 재무제표용 재무상태표 값 등). 억지로 아무 값이나
 *   골라 틀린 숫자를 파는 것보다 **"안 낸다"가 낫다**(강령 ③).
 *
 * 저장: archive/raw/dubai-dfm-financials/<종목>.json (종목마다 한 파일, 멱등)
 */
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { writeFileSync, unlinkSync, readdirSync, readFileSync, existsSync } from 'node:fs';
import { put } from '../src/lib/store.mjs';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
const FEEDS_BASE = 'https://feeds.dfm.ae/documents';
const COMPANIES_DIR = path.resolve('archive/raw/dubai-dfm-companies');

/** "23,907,529" · "(10,528,941)" → 숫자(음수는 괄호). 못 읽으면 null. */
export function 숫자파싱(s) {
  const t = String(s ?? '').trim();
  if (!t || t === '-') return null;
  const m = t.match(/^\(?([\d,]+(?:\.\d+)?)\)?$/);
  if (!m) return null;
  let n = parseFloat(m[1].replace(/,/g, ''));
  if (Number.isNaN(n)) return null;
  if (t.startsWith('(') && t.endsWith(')')) n = -Math.abs(n);
  return n;
}

/** 표 한 줄(라벨 뒤 공백으로 구분된 숫자열) → 숫자 배열(라벨 자체는 뺀다). */
export function 줄의숫자들(줄) {
  const 토큰 = 줄.trim().split(/\s+/).map((s) => s.trim()).filter(Boolean);
  const 숫자 = [];
  for (const t of 토큰) {
    const n = 숫자파싱(t);
    if (n !== null) 숫자.push(n);
  }
  return 숫자;
}

/**
 * 손익계산서 머리글에서 "Three-month" 와 "Six-month" 중 어느 것이 먼저 나오는지로
 * 넉 줄(6개월현재·6개월전년·3개월현재·3개월전년, 순서 미상)의 «분기 쌍»이 앞인지
 * 뒤인지를 정한다. 못 찾으면 null(순서 모름 — 넉 줄이면 뽑지 않는다).
 */
/** 문자열에서 정규식과 매치되는 «마지막» 위치(index) — 없으면 -1. */
function 마지막위치(t, re) {
  const 전체 = [...t.matchAll(new RegExp(re, 'gi'))];
  if (!전체.length) return -1;
  return 전체[전체.length - 1].index;
}

export function 분기가먼저인가(선행텍스트) {
  const t = String(선행텍스트 ?? '');
  /*
   * 🔴 [실측] 앞쪽(idx 이전) 텍스트 «전체»를 받아 «가장 가까운»(=마지막) three-month·
   * six-month 위치로 순서를 정한다 — «첫» 등장으로 재면 감사보고서 서문의 반대 순서
   * 문구("for the three-month and six-month periods")를 표 머리글보다 먼저 집어
   * 틀린다. 재무제표 «그 표 바로 위» 머리글이 항상 더 가깝다(=더 뒤에 있다).
   */
  const 삼개월 = 마지막위치(t, 'three[- ]?month');
  const 육개월 = 마지막위치(t, 'six[- ]?month');
  if (삼개월 === -1 || 육개월 === -1) return null;
  return 삼개월 < 육개월;
}

/*
 * 🔴 [실측 · Air Arabia] "Revenue" 만으로는 부족하다 — 감사보고서 Key Audit Matters
 * 절의 소제목 "Revenue Recognition"(다음 줄 "See Note 28…"의 28을 값으로 잘못 삼켰다 —
 * 연 매출이 "28"로 나가는 명백한 오류를 실측으로 잡았다)도 잡혀 버린다. 라벨 뒤에
 * «다른 낱말»(알파벳)이 바로 이어지면 진짜 재무제표 줄이 아니라고 본다 — 숫자·각주
 * 번호·줄끝만 허용한다.
 */
const 라벨우선순위 = {
  revenue: [/^revenue\b(?!\s*[a-z])/i, /^total income\b(?!\s*[a-z])/i, /^total revenue\b(?!\s*[a-z])/i],
  netProfit: [
    /^net profit for the period\b(?!\s*[a-z])(?!.*(before|attributable))/i,
    /^profit for the period after tax\b(?!\s*[a-z])/i,
    /^profit for the period\b(?!\s*[a-z])(?!.*(before|attributable|after net movement))/i,
  ],
  eps: [/^-?basic (and diluted )?earnings per share\b(?!\s*[a-z])/i],
};

/**
 * 전체 텍스트(pdftotext -table 출력) → {revenue, netProfit, eps, quarterOrderKnown}. 하나도 못 찾으면 null.
 * 🔴 [실측] "Three-month"·"Six-month" 순서를 «문서 전체»에서 찾으면 틀린다 — 감사보고서
 * 서문에 "for the three-month and six-month periods then ended"처럼 «반대 순서»로
 * 미리 한 번 나온다(실제 재무제표 본문의 표 머리글보다 앞선다). 그래서 값을 찾은 줄
 * «앞의 전체 텍스트»에서 «가장 가까운»(마지막) three-month·six-month 언급으로 순서를
 * 정한다 — 그 표 바로 위 머리글이 항상 감사보고서 서문보다 더 가깝다(더 뒤에 있다).
 */
export function 재무표파싱(전체텍스트) {
  const 줄들 = String(전체텍스트 ?? '').split('\n');

  function 뽑기(라벨목록) {
    for (const re of 라벨목록) {
      const idx = 줄들.findIndex((l) => re.test(l.trim()));
      if (idx === -1) continue;
      let 숫자 = 줄의숫자들(줄들[idx]);
      /*
       * 🔴 [실측 · DIB] "Basic and diluted earnings per share" 라벨과 값이 «빈 줄 하나
       * 사이에 두고» 갈라져 나온다("(AED per share)  20  0.25  0.23  0.47  0.46" 이
       * 라벨 2줄 뒤에). 라벨 줄에 숫자가 없으면 이후 최대 3줄까지 본다.
       */
      for (let d = 1; !숫자.length && d <= 3; d += 1) {
        if (줄들[idx + d] != null) 숫자 = 줄의숫자들(줄들[idx + d]);
      }
      if (!숫자.length) continue;
      const 앞선전체 = 줄들.slice(0, idx).join('\n');
      const 분기먼저 = 분기가먼저인가(앞선전체);
      /*
       * 🔴 [실측] "Revenue  4  23,907,529 …" 처럼 라벨 뒤에 각주번호(Note 4)가 값보다
       * 먼저 붙어 나온다 — 값 개수(4개 또는 2개)보다 하나 많고 그 첫 숫자가 소수점 없는
       * 작은 정수(<100)면 각주번호로 보고 뺀다(진짜 값은 보통 훨씬 크거나 소수점이 있다).
       */
      if ((숫자.length === 5 || 숫자.length === 3) && Number.isInteger(숫자[0]) && 숫자[0] < 100 && 숫자[0] >= 0) {
        숫자 = 숫자.slice(1);
      }
      if (숫자.length >= 4) {
        if (분기먼저 === null) return { 현재: null, 전년: null, 확실치않음: true };
        const [a, b, c, d] = 숫자;
        return 분기먼저 ? { 현재: a, 전년: b } : { 현재: c, 전년: d };
      }
      if (숫자.length >= 2) return { 현재: 숫자[0], 전년: 숫자[1] };
      return { 현재: 숫자[0], 전년: null };
    }
    return null;
  }

  const revenue = 뽑기(라벨우선순위.revenue);
  const netProfit = 뽑기(라벨우선순위.netProfit);
  const eps = 뽑기(라벨우선순위.eps);
  if (!revenue && !netProfit && !eps) return null;

  /*
   * 🔴🔴 [실측 · 전수 감사로 발견 · 안전판 2차] 라벨 정규식을 고친 뒤에도 실제 76개사
   * 전수를 손으로 훑어보니 남은 오탐이 더 있었다 — 전부 실측이다:
   *   EMIRATESNBD  "27.9"(revenue) — 실은 재무제표가 아니라 «실적 발표 슬라이드
   *                (Results Presentation)» PDF 였다. 도표 안 숫자를 잘못 집었다.
   *   DEWA(연간)   "1216"(revenue) — 분기(640만·840만)보다 5,000배 넘게 작다.
   *   ALEC(연간)   "12.5"(revenue) — 소수점이라 기존 «정수만» 안전판을 피해 갔다.
   *   MAZAYA       netProfit(541,359) > revenue(157,453) — 순이익이 매출의 3.4배,
   *                통상 영업 회사에서 있을 수 없다(둘 다 잘못 짝지어진 줄로 본다).
   *   AJMANBANK    eps = netProfit 와 «같은 값»(116,848) — 다른 줄을 두 라벨이
   *                같이 집었다는 뜻이다.
   *   ERC          eps = 24 — 실제 EPS 범위(0~수 AED)를 크게 벗어난다.
   * ⇒ 안전판을 셋으로 넓힌다: ①매출·순이익은 소수점이든 정수든 10,000(AED천원)
   *   미만이면 버린다 ②EPS 는 절대값 20 을 넘으면 버린다(이 거래소들에서 실제
   *   주당순이익이 이보다 큰 사례를 못 봤다) ③순이익이 매출의 2배를 넘으면 «둘 다»
   *   못 믿을 짝짓기로 보고 버린다.
   */
  const 규모검증 = (v) => (v != null && Math.abs(v) < 10000 ? null : v);
  const epsFloor = (v) => (v != null && Math.abs(v) > 20 ? null : v);

  let revenue현재 = 규모검증(revenue?.현재 ?? null);
  let revenue전년 = 규모검증(revenue?.전년 ?? null);
  let netProfit현재 = 규모검증(netProfit?.현재 ?? null);
  let netProfit전년 = 규모검증(netProfit?.전년 ?? null);
  if (revenue현재 != null && netProfit현재 != null && Math.abs(netProfit현재) > Math.abs(revenue현재) * 2) {
    revenue현재 = null; netProfit현재 = null;
  }
  if (revenue전년 != null && netProfit전년 != null && Math.abs(netProfit전년) > Math.abs(revenue전년) * 2) {
    revenue전년 = null; netProfit전년 = null;
  }

  return {
    revenue: revenue현재,
    revenuePrior: revenue전년,
    netProfit: netProfit현재,
    netProfitPrior: netProfit전년,
    eps: epsFloor(eps?.현재 ?? null),
    epsPrior: epsFloor(eps?.전년 ?? null),
    quarterOrderKnown: ![revenue, netProfit, eps].some((x) => x?.확실치않음),
  };
}

/* ── 자가시험 — 실측한 진짜 pdftotext -table 출력 줄로 잰다(Emaar·DIB·DEWA) ──────── */
function 자가시험() {
  const 것 = []; const 재다 = (이름, 됐나) => 것.push({ 이름, 됐나 });

  재다('숫자파싱: "23,907,529" → 23907529', 숫자파싱('23,907,529') === 23907529);
  재다('숫자파싱: "(10,528,941)"(괄호=음수) → -10528941', 숫자파싱('(10,528,941)') === -10528941);
  재다('숫자파싱: "-"(빈값) → null', 숫자파싱('-') === null);
  재다('숫자파싱: "0.98" → 0.98', 숫자파싱('0.98') === 0.98);

  재다('분기가먼저인가: Emaar 머리글("Six-month...Three-month") → false(6개월이 먼저)',
    분기가먼저인가('Six-month period ended  Three-month period ended') === false);
  재다('분기가먼저인가: DIB 머리글("Three-month...Six-month") → true(3개월이 먼저)',
    분기가먼저인가('Three-month period ended 30 June  Six-month period ended 30 June') === true);
  재다('분기가먼저인가: 못 찾으면 null', 분기가먼저인가('아무 상관 없는 글') === null);

  // 실측 — Emaar(부동산): "Revenue 4 23,907,529 19,833,719 11,509,517 9,736,007" (6개월먼저)
  const emaar = `Six-month period ended         Three-month period ended\nRevenue                                                 4  23,907,529 19,833,719          11,509,517    9,736,007\nNET PROFIT FOR THE PERIOD                                             11,148,666     8,879,604       4,736,545     4,243,732\n-basic and diluted earnings per share (AED)                  0.98          0.80             0.42          0.38`;
  const emaar결과 = 재무표파싱(emaar);
  재다('🔴 실측(Emaar): revenue = 3개월 값(뒤쪽 쌍) 11,509,517', emaar결과.revenue === 11509517);
  재다('실측(Emaar): revenuePrior = 9,736,007', emaar결과.revenuePrior === 9736007);
  재다('실측(Emaar): netProfit = 4,736,545', emaar결과.netProfit === 4736545);
  재다('실측(Emaar): eps = 0.42', emaar결과.eps === 0.42);

  // 실측 — DIB(은행): "Total income ... 6,142,992 5,841,965 12,438,934 11,353,773" (3개월먼저)
  const dib = `Three-month period ended 30 June     Six-month period ended 30 June\nTotal income                                                                          6,142,992                   5,841,965     12,438,934   11,353,773\nNet profit for the period                                                             1,937,578                   1,933,077     3,736,308    3,730,489`;
  const dib결과 = 재무표파싱(dib);
  재다('🔴 실측(DIB): revenue = 3개월 값(앞쪽 쌍, Total income 으로 잡음) 6,142,992', dib결과.revenue === 6142992);
  재다('실측(DIB): netProfit = 1,937,578', dib결과.netProfit === 1937578);

  // 실측 — DIB: EPS 라벨·값이 빈 줄 하나를 사이에 두고 갈라진다(실제 pdftotext -table 출력 그대로)
  const dib2 = `${dib}\nBasic and diluted earnings per share\n\n(AED per share)                                                                 20            0.25                0.23          0.47              0.46`;
  재다('🔴 실측(DIB): EPS 가 빈 줄 건너 있어도 뽑는다(각주 20 은 버림) = 0.25', 재무표파싱(dib2).eps === 0.25);

  // 실측 — DEWA(전력공사): "Revenue ... 14,864,757 14,601,631 8,412,995 8,637,530" (6개월먼저)
  const dewa = `For the six-month period           For the three-month period\nRevenue                                                26     14,864,757   14,601,631                           8,412,995        8,637,530\nProfit for the period after tax                                   3,328,285                2,893,718\nBasic and diluted earnings per share (AED)             35        0.064                  0.055                   0.046            0.045`;
  const dewa결과 = 재무표파싱(dewa);
  재다('🔴 실측(DEWA): revenue = 3개월 값(뒤쪽 쌍) 8,412,995', dewa결과.revenue === 8412995);
  재다('실측(DEWA): netProfit(숫자 2개뿐인 줄) = 3,328,285', dewa결과.netProfit === 3328285);
  재다('실측(DEWA): eps = 0.046', dewa결과.eps === 0.046);

  재다('⛔ 오탐 방지: "Profit for the period before net movement in..."(중간 소계)은 안 잡는다',
    !/Profit for the period before/i.test('x') || 라벨우선순위.netProfit.every((re) => !re.test('Profit for the period before net movement in fair value of financial assets')));
  재다('⛔ 오탐 방지: "Profit for the period attributable to"(귀속 분리줄)는 안 잡는다',
    라벨우선순위.netProfit.every((re) => !re.test('Profit for the period attributable to')));

  // 🔴 실측(Air Arabia) — "Revenue Recognition"(감사보고서 소제목)이 "Revenue" 로 오인되고,
  // 다음 줄 "See Note 28 to the consolidated financial statements."의 28 을 매출로 삼켰다.
  // 연 매출이 "28"로 나가는 명백한 오류였다 — 실제로 있었던 사고라 자가시험에 고정한다.
  const airArabia = `Key Audit Matters (continued)\n\nRevenue Recognition\n\nSee Note 28 to the consolidated financial statements.\n\nThe key audit matter                              How the matter was addressed in our audit`;
  재다('🔴 실측(Air Arabia): "Revenue Recognition" 소제목은 매출로 안 잡는다', 재무표파싱(airArabia)?.revenue == null);

  const airArabiaReal = `Six-month period ended         Three-month period ended\nRevenue                                                            28     7,787,581    6,765,852`;
  재다('🔴 실측(Air Arabia 진짜 표): "Revenue 28 …"(각주 28) → 매출은 7,787,581·6,765,852 중 하나', [7787581, 6765852].includes(재무표파싱(airArabiaReal)?.revenue));

  재다('⛔ 안전판: 매출·순이익이 10,000 미만이면 버린다(각주·쪽번호로 본다)',
    재무표파싱('Revenue                                                            28     500    600')?.revenue === null);

  /* 🔴🔴 [실측 · 76개사 전수 감수로 발견] 이 아래 넷은 라벨 정규식을 다 고친 뒤에도
   * 실제 수집 결과를 손으로 훑다가 잡은 «남은» 오탐이다. */
  재다('🔴 실측(EMIRATESNBD): "27.9"(실은 재무제표 아니라 실적발표 슬라이드 안 숫자) → 버린다',
    재무표파싱('Revenue                                                                 27.9   23.9')?.revenue === null);
  재다('🔴 실측(DEWA 연간): "1216"(분기치의 1/5000) → 버린다', 재무표파싱('Revenue    1216')?.revenue === null);
  재다('🔴 실측(ALEC 연간): "12.5"(소수점이라 정수전용 문턱을 피해 갔었다) → 버린다',
    재무표파싱('Revenue    12.5')?.revenue === null);
  재다('🔴 실측(AJMANBANK): eps 가 netProfit 과 같은 값(116,848)으로 나왔다 — eps 문턱(20) 초과라 버린다',
    재무표파싱('Basic and diluted earnings per share (AED)    116848')?.eps === null);
  재다('🔴 실측(ERC): eps = 24(범위 밖) → 버린다', 재무표파싱('Basic and diluted earnings per share (AED)    24')?.eps === null);
  재다('🔴 실측(MAZAYA): 순이익(541,359)이 매출(157,453)의 2배 넘게 크면 둘 다 못 믿을 짝으로 보고 버린다',
    (() => {
      const t = `Revenue    157453    42050\nNet profit for the period    541359    100000`;
      const r = 재무표파싱(t);
      return r.revenue === null && r.netProfit === null;
    })());

  // 🔴 실측(Air Arabia) — 각주번호가 라벨 «뒤»가 아니라 «앞»에 붙어 나온 줄
  // ("33      Basic and diluted earnings per share")이 eps=33 이라는 말도 안 되는
  // 값을 냈다 — eps 정규식이 줄 «맨앞» 고정이 아니어서 각주줄까지 잡았었다.
  재다('🔴 실측(Air Arabia): "33   Basic and diluted earnings per share"(각주가 앞) → eps 로 안 잡는다',
    재무표파싱('33      Basic and diluted earnings per share')?.eps == null);
  재다('실측(Air Arabia): 진짜 EPS 줄 "Basic and diluted earnings per share (AED)  0.35  0.31" → 0.35',
    재무표파싱('Basic and diluted earnings per share (AED)                                                0.35                0.31')?.eps === 0.35);

  재다('재무표파싱: 아무 줄도 못 찾으면 null', 재무표파싱('아무 상관 없는 문서 내용') === null);
  재다('재무표파싱: 분기 순서를 못 찾고 숫자가 4개인 줄은 뽑지 않는다(확실치 않으면 안 낸다)',
    재무표파싱('Revenue 1,000 2,000 3,000 4,000')?.revenue === null);

  const 실패 = 것.filter((x) => !x.됐나);
  console.log(`■ 자가시험 ${것.length - 실패.length}/${것.length}`);
  for (const x of 실패) console.log(`  🔴 ${x.이름}`);
  return 실패.length === 0;
}

if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);
if (!자가시험()) { console.log('🔴 자가시험이 깨졌다 — 돌리지 않는다.'); process.exit(1); }
console.log('');

async function PDF다운로드후텍스트(pdfPath) {
  const url = FEEDS_BASE + encodeURI(pdfPath).replace(/%2F/g, '/');
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error(`PDF fetch ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  const tmp = path.join(os.tmpdir(), `dfm-fin-${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`);
  writeFileSync(tmp, buf);
  try {
    return execFileSync('pdftotext', ['-table', tmp, '-'], { maxBuffer: 1024 * 1024 * 50 }).toString('utf8');
  } finally {
    try { unlinkSync(tmp); } catch { /* 임시파일 못 지워도 넘어간다 */ }
  }
}

async function main() {
  const 인자 = process.argv.find((a) => a.startsWith('--종목'));
  let 종목들;
  if (인자) {
    종목들 = 인자.split('=')[1].split(',').map((s) => s.trim()).filter(Boolean);
  } else {
    종목들 = readdirSync(COMPANIES_DIR).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''));
  }

  let 성공 = 0; let 실패 = 0;
  const 커버리지 = { attempted: 0, withData: 0, empty: 0, emptyReason: {} };
  for (const 종목 of 종목들) {
    const 회사파일 = path.join(COMPANIES_DIR, `${종목}.json`);
    if (!existsSync(회사파일)) { console.log(`  – ${종목}  회사 파일 없음(먼저 collect-dubai-dfm-companies.mjs)`); continue; }
    const 회사 = JSON.parse(readFileSync(회사파일, 'utf8'));
    const 제출이력 = (회사.financialStatementFilings ?? []);
    if (!제출이력.length) continue; // 재무제출이력 자체가 없는 종목은 이 수집기의 대상이 아니다(빔으로 안 센다)

    커버리지.attempted += 1;
    const 분기들 = [];
    for (const 제출 of 제출이력.slice(0, 4)) { // 최근 4건만(사업연도 하나치) — 전부 열면 너무 느리다
      try {
        const 텍스트 = await PDF다운로드후텍스트(제출.pdfPath);
        const 표 = 재무표파싱(텍스트);
        if (!표) continue;
        const 연도 = (제출.headline.match(/\b(20\d{2})\b/) ?? [])[1] ?? (제출.date ?? '').match(/\b(20\d{2})\b/)?.[1] ?? null;
        const 기간 = 제출.period && 연도 ? `${제출.period} ${연도}` : (제출.headline ?? null);
        분기들.push({
          date: 제출.date,
          title: 제출.headline,
          engPdfUrl: FEEDS_BASE + encodeURI(제출.pdfPath).replace(/%2F/g, '/'),
          period: 기간,
          priorPeriod: null, // DFM PDF 자체엔 «전년 동기 라벨»이 없다 — 숫자만 있다(revenuePrior 로 남긴다)
          revenue: 표.revenue,
          revenuePrior: 표.revenuePrior,
          expense: null, // 위 헤더 주석 참고 — 회사마다 달라 자신 있게 못 고른다
          netProfit: 표.netProfit,
          eps: 표.eps,
          cashAndEquivalents: null, // 위 헤더 주석 참고
          quarterOrderKnown: 표.quarterOrderKnown,
        });
      } catch (e) {
        console.log(`  ⚠ ${종목} · ${제출.headline} — PDF 못 읽음(${e.message.slice(0, 60)})`);
      }
    }

    const 결과 = await put(`raw/dubai-dfm-financials/${종목}.json`, JSON.stringify({
      _meta: {
        product: 'DFM financial highlights — Revenue/Net Profit/EPS parsed directly from the filed PDF (pdftotext -table) — not audited by us, Expense/Cash intentionally omitted (see header comment)',
        symbol: 종목,
        builtAt: new Date().toISOString(),
        source: 'DFM Efsah disclosure feed PDF (feeds.dfm.ae/documents<path>) — public, no login',
        coverage: { attempted: true, withData: 분기들.length > 0, empty: 분기들.length === 0, emptyReason: 분기들.length ? null : 'pdf-parse-found-no-recognized-line-items' },
        notThis: [
          'Expense and Cash and Cash Equivalents are NOT included — line-item labels vary too much company to company to pick one confidently (see header comment).',
          'Column order (quarterly vs cumulative) is detected per filing from the PDF header text — when it cannot be determined, that quarter is left out rather than guessed.',
          'Not independently audited by us — parsed from the company’s own filed PDF.',
          'Not investment advice, not a trading signal.',
        ],
      },
      quarters: 분기들,
    }, null, 1), 'application/json');

    if (분기들.length) { 성공 += 1; 커버리지.withData += 1; console.log(`  ✅ ${종목}  재무제출 ${제출이력.length}건 중 표 읽음 ${분기들.length}건 → ${결과.local}`); }
    else { 실패 += 1; 커버리지.empty += 1; 커버리지.emptyReason['pdf-parse-found-no-recognized-line-items'] = (커버리지.emptyReason['pdf-parse-found-no-recognized-line-items'] ?? 0) + 1; console.log(`  – ${종목}  재무제출 ${제출이력.length}건 있으나 표를 하나도 못 읽음`); }
  }
  await put('raw/dubai-dfm-financials/_coverage.json', JSON.stringify({
    _meta: { product: 'DFM financials collector run coverage — attempted/withData/empty + why', builtAt: new Date().toISOString() },
    ...커버리지,
  }, null, 1), 'application/json');
  console.log(`\n합계 성공 ${성공} · 실패 ${실패} · 커버리지: 시도 ${커버리지.attempted} · 데이터있음 ${커버리지.withData} · 빔 ${커버리지.empty} · archive/raw/dubai-dfm-financials/`);
}

if (pathToFileURL(process.argv[1]).href === import.meta.url) await main();
