#!/usr/bin/env node
/**
 * extract-uae-balance-sheet.mjs — **걸프 감사보고서 PDF 에서 대차대조표를 «검산해서» 뽑는다.**
 *
 *   node scripts/extract-uae-balance-sheet.mjs --자가시험
 *   node scripts/extract-uae-balance-sheet.mjs --몇개 12        표본만 해 본다(안 적는다)
 *   node scripts/extract-uae-balance-sheet.mjs --전부 --적는다   다 하고 탭에 넣는다
 *
 * ── 🔴 왜 만드나 (2026-09-16 · 5번) ──────────────────────────────────────
 *
 * 사장님: 「**지난해 실적기준 감사보고서가 없다고? 그게 말이 되냐? 어디있는데
 *   너희가 못찾는 것 같다**」 · 「**걸프**」
 *
 * 사장님 말씀이 맞았다. 재서 확인했다 —
 * ```
 *   2025 연간 줄                       91
 *   그 가운데 영문 감사보고서 PDF 주소   91   ← 전부 우리 손에 있었다
 *   자산·자본이 채워진 것               33
 *   비어 있는 58건 중 12건을 열어 보니 —
 *     글자가 뽑히는 것(스캔 아님)        11 / 12
 *     대차대조표 말이 들어 있는 것        10 / 12
 * ```
 * ⛔ 「없다」가 아니라 **우리가 안 뽑은 것**이었다. 그리고 내가 사장님께
 *   「스캔 이미지라 못 뽑는다」고 보고했는데 그것도 틀렸다 — 스캔은 91건 중 6건뿐이다.
 * ⛔ **우리 도구가 약한 것을 출처 탓으로 적지 않는다.** 같은 날 스크리너에서
 *   「아부다비가 시가총액을 안 낸다」고 적었던 것과 똑같은 잘못이다.
 *
 * ── ⭐ 어떻게 «틀린 수»를 안 파나 — 짐작하지 않고 검산한다 ────────────────
 *
 * 표에서 라벨과 수가 다른 줄로 떨어지고, 열이 몇 개인지도 문서마다 다르다.
 * ```
 *   재무상태표     Total assets    3,003,198   2,918,407      ← 앞이 올해, 뒤가 작년
 *   부문 주석      Total assets  2,701,584 … (2,372,154)  3,003,198  ← «맨 뒤»가 합계
 * ```
 * ⛔ 「맨 앞을 쓴다」도 「맨 뒤를 쓴다」도 둘 다 어떤 문서에서는 틀린다.
 * ✅ 그래서 **고르지 않고 검산한다** — 자산 = 부채 + 자본 이 맞는 짝만 받는다.
 *   맞는 짝이 없으면 **비운다.** 그것도 결과다.
 *
 * ⛔ 오늘 시가총액을 «계산»으로 메꾸려다 버린 것과 같은 규칙이다
 *   (주식수 = 순이익 ÷ EPS 로 만든 판은 두바이로 검산하니 오차 가운데값 99.9% 였다).
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36';
const 헤더 = ['-A', UA, '-H', 'Referer: https://www.adx.ae/', '-H', 'adx-gateway-apikey: 1863a94c-582b-46f9-b4f0-0d02c0cc5307'];
export const 탭길 = 'src/data/uae-financials-tape.json';
export const 맞는차 = 0.005;          /* 0.5% 안에서만 «맞다»고 본다 */
export const 라벨오독선 = 0.01;       /* 부채·자본이 자산의 1% 미만이면 «라벨을 잘못 읽은 것»으로 본다 */

/* ── 판정만 떼어 낸다 ─────────────────────────────────────────────────── */

/** 「1,234」·「(89)」·「1,234.5」 → 숫자. 괄호는 음수. 아니면 null */
export function 수읽기(글) {
  const t = String(글 ?? '').trim();
  if (!/^\(?-?[\d,]+(\.\d+)?\)?$/.test(t)) return null;
  const 음수 = t.startsWith('(') && t.endsWith(')');
  const n = Number(t.replace(/[(),]/g, ''));
  if (!Number.isFinite(n)) return null;
  return 음수 ? -n : n;
}

/** 한 줄에서 수를 왼쪽부터 다 뽑는다. ⛔ 각주 번호(한두 자리)는 수로 세지 않는다 */
export function 줄에서수들(줄) {
  const 것 = String(줄 ?? '').match(/\(?-?[\d][\d,]*(\.\d+)?\)?/g) || [];
  return 것.map(수읽기).filter((n) => n !== null && Math.abs(n) >= 1000);
}

/**
 * 라벨이 붙은 줄들을 모은다. 라벨 뒤에 수가 없으면 «다음 두 줄»까지 본다
 * (표가 라벨과 수를 다른 줄로 흘리는 판이 있다).
 *
 * 🔴 [2026-09-16 실측] 그런데 그 「다음 줄 잇기」가 **남의 수를 훔쳐 왔다.**
 * ```
 *   Total equity                                          ← 수가 잘려 없다
 *   Total liabilities and equity       744,273,269        ← 이걸 «자본»으로 가져갔다
 * ```
 * 그래서 ADCB 가 「자산 744,273,269 = 부채 992,703 + 자본 744,273,269」으로
 * 검산을 **우연히 통과**했다. 자본이 자산과 같고 부채가 0.13% 인 은행은 없다.
 * ✅ 그러니 **다음 줄이 또 다른 «라벨»이면 잇지 않는다.** 수만 있는 줄일 때만 잇는다.
 */
export function 라벨줄찾기(글, 재) {
  const 줄들 = String(글 ?? '').split(/\r?\n/);
  const 낸것 = [];
  for (let i = 0; i < 줄들.length; i += 1) {
    if (!재.test(줄들[i])) continue;
    let 수 = 줄에서수들(줄들[i]);
    for (let j = 1; j <= 2 && !수.length && i + j < 줄들.length; j += 1) {
      if (라벨인가(줄들[i + j])) break;          /* ⛔ 남의 라벨 줄에서 수를 훔쳐 오지 않는다 */
      수 = 줄에서수들(줄들[i + j]);
    }
    if (수.length) 낸것.push({ 줄번호: i + 1, 수 });
  }
  return 낸것;
}

/** 그 줄이 «라벨이 붙은 줄»인가 — 빈 줄도 수만 있는 줄도 아닌, 글자로 시작하는 줄 */
export function 라벨인가(줄) {
  return /^\s*[A-Za-z]/.test(String(줄 ?? ''));
}

/**
 * 🔴 여기가 이 자의 심장이다 — **고르지 않고 검산한다.**
 * 자산 후보 × 부채 후보 × 자본 후보를 다 맞춰 보고, 자산 = 부채 + 자본 이 맞는 짝만 받는다.
 * ⛔ 맞는 짝이 여럿이면(값이 서로 다르면) «못 정했다»로 비운다 — 아무거나 고르지 않는다.
 */
export function 검산해서고른다(자산들, 부채들, 자본들, 차 = 맞는차) {
  const 맞은것 = [];
  for (let i = 0; i < 자산들.length; i += 1) {
    const a = 자산들[i];
    if (a <= 0) continue;
    for (const l of 부채들) {
      for (const e of 자본들) {
        if (Math.abs(a - (l + e)) / a > 차) continue;
        /* 🔴 「검산이 맞았다」가 「제대로 읽었다」는 아니다 — 둘 중 하나가 자산과 같은 값이면
         *    나머지는 0 에 가까워지고, 그래도 a = l + e 는 «맞아 버린다».
         *    실제로 ADCB 가 그렇게 통과했다(부채 992,703 · 자산 744,273,269 · 0.13%).
         *    ⛔ 자본이 자산의 1% 도 안 되는 상장사도, 부채가 1% 도 안 되는 상장사도 사실상 없다.
         *    ⬜ 놓치는 쪽을 고른다 — 못 쟀으면 못 쟀다고 적는 것이 우리 강령이다. */
        if (Math.abs(l) / a < 라벨오독선 || Math.abs(e) / a < 라벨오독선) continue;
        맞은것.push({ 자산: a, 부채: l, 자본: e, 자리: i });
      }
    }
  }
  if (!맞은것.length) return { 됐나: false, 왜: 'no-reconciling-total-assets-liabilities-equity' };
  const 자산종류 = [...new Set(맞은것.map((x) => x.자산))];
  if (자산종류.length === 1) return { 됐나: true, ...맞은것[0] };

  /* 🔴 짝이 둘 이상 나오는 것은 «흔한 일»이다. 표가 두 가지라서 그렇다 —
   *
   *   재무상태표   열이 «해»다      올해 | 작년        → 둘 다 각각 검산이 맞는다
   *   부문 주석    열이 «부문»이다  A | B | C | 조정 | 합계 → 부문도 맞고 합계도 맞는다
   *
   * ⛔ 그래서 「여럿이면 비운다」로 두면 멀쩡한 것을 다 버린다(자가시험이 잡아 줬다).
   * ✅ 가르는 잣대 — **앞 열들을 더하면 맨 뒤 열이 되는가.**
   *    되면 그것은 «부분과 합계»인 부문 주석이니 **맨 뒤(합계)**를 쓴다.
   *    안 되면 열이 «해»이니 **맨 앞(올해)**을 쓴다.
   *    ⚠ 우리 자료는 «연간»이라 올해 = 그 회계연도다. 작년 값을 올해로 싣지 않는다. */
  const 합계꼴 = (() => {
    if (자산들.length < 3) return false;
    const 앞 = 자산들.slice(0, -1).reduce((x, y) => x + y, 0);
    const 뒤 = 자산들[자산들.length - 1];
    return 뒤 !== 0 && Math.abs(앞 - 뒤) / Math.abs(뒤) <= 차;
  })();
  const 고른자리 = 합계꼴 ? 자산들.length - 1 : 0;
  const 고른것 = 맞은것.find((x) => x.자리 === 고른자리);
  if (!고른것) return { 됐나: false, 왜: 'ambiguous-multiple-reconciling-sets' };
  return { 됐나: true, ...고른것, 표꼴: 합계꼴 ? 'segment-total' : 'year-columns' };
}

/* ── 라벨 — 🔴 «and equity» 가 붙은 줄은 부채가 아니다 ───────────────────
 *
 *   Total liabilities                  664,764,162   ← 부채다
 *   Total liabilities and equity       744,273,269   ← 이건 «자산»과 같은 값이다
 *
 * 앞의 것만 부채로 받는다. 뒤의 것을 부채로 읽으면 자본이 0 에 가까워지고
 * 그래도 검산은 맞아 버린다(위 라벨오독선이 막지만, 애초에 안 잡는 것이 낫다).
 */
export const 자산재 = /^\s*Total\s+assets\b/i;
export const 부채재 = /^\s*Total\s+liabilit\w*\s*(?!.*\band\s+(equity|shareholder))/i;
export const 자본재 = /^\s*Total\s+(net\s+)?(equity|shareholders'?\s+(equity|funds)|capital\s+and\s+reserves)\b(?!.*\band\s+liabilit)/i;
/* 🔴 [2026-09-16 실측] 「Total liabilities」 한 줄을 «안 쓰는» 회사가 많다.
 *   ADNOCLS 는 Total non-current assets / Total current assets / Total assets 로만 적고
 *   부채도 비유동·유동 둘로만 적는다. 그래서 「부채 줄이 없다」로 8건이 버려지고 있었다.
 *   ✅ 둘을 더해 부채 후보로 쓴다. 더한 값이 틀리면 어차피 검산이 걸러 낸다. */
/* 🔴 [2026-09-16 실측 · --라벨조사 30] 못 뽑은 문서 29개에서 라벨을 세어 보니 —
 * ```
 *   total assets        14개 문서
 *   total liabilities   10개 문서
 *   total equity         2개 문서   ← 여기가 병목이었다
 * ```
 * 자본 합계 줄을 안 적는 판이 훨씬 많다. 대신 거의 모든 재무상태표가
 * **「Total liabilities and equity」(대차 균형 줄)**로 닫는다. 그 값은 자산과 «같아야» 한다.
 * ✅ 그러니 그 줄로 자산을 검산하고, 자본은 **자산 − 부채**로 낸다(정의상 항등식이다).
 * ⛔ 대신 부채 후보가 둘 이상 갈리면 비운다 — 아무거나 빼서 자본을 만들지 않는다. */
export const 대차합계재 = /^\s*Total\s+(liabilit\w*\s+and\s+(equity|shareholder)|equity\s+and\s+liabilit)/i;
export const 비유동부채재 = /^\s*Total\s+non[- ]current\s+liabilit/i;
export const 유동부채재 = /^\s*Total\s+current\s+liabilit/i;
export const 비유동자산재 = /^\s*Total\s+non[- ]current\s+assets/i;
export const 유동자산재 = /^\s*Total\s+current\s+assets/i;

/** 같은 열 자리끼리 더해 후보를 만든다 (비유동 + 유동) */
export function 합쳐서후보(앞, 뒤) {
  const n = Math.min(앞.length, 뒤.length);
  const 것 = [];
  for (let i = 0; i < n; i += 1) 것.push(앞[i] + 뒤[i]);
  return 것;
}

/**
 * 🔴 OCR 이 깨진 문서인가 — 글자는 뽑히지만 «믿을 수 없는» 글자다.
 * 실측(ADIB) — 「269,734.257」·「215.909.795」·「Total liahililics」·「Tol:1I r11uiry」.
 * 점을 천단위로 찍은 수가 거듭 나오면 스캔 뜬 판을 OCR 한 것이다.
 * ⛔ 이것을 「라벨이 없다」로 적으면 다음 사람이 「출처가 안 낸다」로 잘못 읽는다.
 */
export function OCR깨졌나(글) {
  return (String(글 ?? '').match(/\d\.\d{3}\.\d{3}/g) || []).length >= 3;
}

/** PDF 글 한 장에서 대차대조표를 뽑는다 */
export function 글에서뽑는다(글) {
  if (!글 || 글.replace(/\s/g, '').length < 2000) return { 됐나: false, 왜: 'scanned-image' };
  if (OCR깨졌나(글)) return { 됐나: false, 왜: 'ocr-garbled-numbers' };
  const 뽑 = (재) => 라벨줄찾기(글, 재).flatMap((x) => x.수);
  /* ⚠ 자산 배열은 «자리»로 해열/부문합계를 가르는 데 쓰인다. 그러니 직접 라벨이 있으면
   *   그것만 쓴다 — 합친 후보를 뒤에 붙이면 그 자리 판정이 흐트러진다. */
  const 자산직접 = 뽑(자산재);
  const 자산 = 자산직접.length ? 자산직접 : 합쳐서후보(뽑(비유동자산재), 뽑(유동자산재));
  const 부채 = [...뽑(부채재), ...합쳐서후보(뽑(비유동부채재), 뽑(유동부채재))];
  const 자본 = 뽑(자본재);
  const 대차합계 = 뽑(대차합계재);
  if (!자산.length && !부채.length && !자본.length && !대차합계.length) {
    return { 됐나: false, 왜: 'no-balance-sheet-in-document' };
  }
  /* ① 셋이 다 있으면 곧바로 검산한다 */
  if (자산.length && 부채.length && 자본.length) {
    const 것 = 검산해서고른다(자산, 부채, 자본);
    if (것.됐나) return 것;
  }
  /* ② 자본 줄이 없으면 «대차 균형 줄»로 자산을 확인하고 자본을 뺄셈으로 낸다 */
  if (자산.length && 부채.length && 대차합계.length) {
    const 것 = 균형줄로푼다(자산, 부채, 대차합계);
    if (것.됐나) return 것;
  }
  if (!자산.length) return { 됐나: false, 왜: 'no-total-assets-line' };
  if (!부채.length) return { 됐나: false, 왜: 'no-total-liabilities-line' };
  if (!자본.length) return { 됐나: false, 왜: 'no-total-equity-line' };
  return 검산해서고른다(자산, 부채, 자본);
}

/**
 * 「Total liabilities and equity」로 자산을 검산하고, 자본 = 자산 − 부채 로 낸다.
 * ⛔ 부채 후보가 둘 이상 갈리면 «비운다». 아무 값이나 빼서 자본을 지어내지 않는다.
 */
export function 균형줄로푼다(자산들, 부채들, 대차합계들, 차 = 맞는차) {
  const 맞는자산 = [...new Set(자산들.filter(
    (a) => a > 0 && 대차합계들.some((s) => Math.abs(a - s) / a <= 차),
  ))];
  if (맞는자산.length !== 1) {
    return { 됐나: false, 왜: 맞는자산.length ? 'ambiguous-balancing-total' : 'no-balancing-total-match' };
  }
  const a = 맞는자산[0];
  const 쓸부채 = [...new Set(부채들.filter(
    (l) => l / a >= 라벨오독선 && (a - l) / a >= 라벨오독선,
  ))];
  if (쓸부채.length !== 1) {
    return { 됐나: false, 왜: 쓸부채.length ? 'ambiguous-total-liabilities' : 'no-plausible-total-liabilities' };
  }
  return { 됐나: true, 자산: a, 부채: 쓸부채[0], 자본: a - 쓸부채[0], 표꼴: 'balancing-total' };
}

/* ── 실제로 받아서 뽑는다 ────────────────────────────────────────────── */

/**
 * 🔴 [2026-09-16 실측] **`-layout` 이 아니라 `-table` 이다.**
 *
 * 처음에 `-layout` 으로 짰다가 ADNH·ADCB 로 재 보고 알았다 — `-layout` 은 칸이 넓은
 * 재무제표에서 **라벨을 한 칸 밀어 붙인다.** 같은 줄이 이렇게 갈렸다.
 * ```
 *   -layout   Total assets   2,701,584 … 3,003,198     ← 실은 «부채» 줄이다
 *   -table    Total assets   9,964,582 … 14,508,491
 *             Total liabilities  2,701,584 … 3,003,198  ← 라벨이 제자리에 붙는다
 * ```
 * ⛔ 이건 「못 뽑는다」가 아니라 **「틀린 값을 뽑는다」**라 훨씬 나쁘다.
 *   검산이 그 틀린 값끼리 맞아 버리면 그대로 실린다.
 * ✅ ADCB 를 `-table` 로 다시 뽑으니 744,273,269 = 664,764,162 + 79,509,107 로 딱 맞았다.
 */
function PDF글(주소, 자리) {
  execFileSync('curl', ['-sS', '-f', ...헤더, 주소, '-o', 자리], { maxBuffer: 1e8 });
  return execFileSync('pdftotext', ['-table', 자리, '-'], { maxBuffer: 1e8 }).toString('utf8');
}

/* ── 자가시험 ─────────────────────────────────────────────────────────── */

function 자가시험() {
  const 것들 = [];
  const 다 = (이름, 참) => 것들.push({ 이름, 참: !!참 });

  다('쉼표 든 수를 읽는다', 수읽기('3,003,198') === 3003198);
  다('괄호는 음수다', 수읽기('(2,372,154)') === -2372154);
  다('소수도 읽는다', 수읽기('1,234.5') === 1234.5);
  다('글자는 null', 수읽기('Total') === null && 수읽기('') === null && 수읽기(null) === null);

  /* ⛔ 각주 번호·쪽수가 수로 섞이면 검산이 엉뚱하게 맞아 버린다 */
  다('작은 수(각주·쪽수)는 안 센다', 줄에서수들('Total assets   15   3,003,198').join() === '3003198');
  다('여러 열을 다 뽑는다', 줄에서수들('Total assets  2,701,584  638,016  3,003,198').length === 3);
  다('수가 없으면 빈 배열', 줄에서수들('Total liabilities').length === 0);

  /* 실측한 두 가지 표 모양 */
  const 재무상태표 = [
    'Consolidated statement of financial position',
    'Total assets                    3,003,198      2,918,407',
    'Total liabilities               1,150,000      1,100,000',
    'Total equity                    1,853,198      1,818,407',
  ].join('\n') + 'x'.repeat(2100);
  const r1 = 글에서뽑는다(재무상태표);
  다('🔴 재무상태표 — 올해 짝을 검산으로 고른다', r1.됐나 && r1.자산 === 3003198 && r1.자본 === 1853198);
  다('작년 값을 섞지 않는다', r1.부채 === 1150000);

  const 부문주석 = [
    'Total assets      2,701,584   638,016   180,844   1,854,908   (2,372,154)   3,003,198',
    'Total liabilities   900,000   100,000    50,000     200,000     (100,000)   1,150,000',
    'Total equity      1,801,584   538,016   130,844   1,654,908   (2,272,154)   1,853,198',
  ].join('\n') + 'x'.repeat(2100);
  const r2 = 글에서뽑는다(부문주석);
  다('🔴 부문 주석 — «맨 뒤» 합계를 검산으로 고른다', r2.됐나 && r2.자산 === 3003198);

  /* ⛔ 안 맞으면 «비운다» — 이것이 이 자의 핵심이다 */
  const 안맞음 = ['Total assets 1,000,000', 'Total liabilities 400,000', 'Total equity 100,000'].join('\n') + 'x'.repeat(2100);
  다('🔴 검산이 안 맞으면 채우지 않는다', 글에서뽑는다(안맞음).됐나 === false);
  다('그 까닭을 적는다', /no-reconciling/.test(글에서뽑는다(안맞음).왜));

  다('0.5% 안이면 받는다', 검산해서고른다([1000000], [600000], [402000]).됐나 === true);
  다('0.5% 밖이면 안 받는다', 검산해서고른다([1000000], [600000], [410000]).됐나 === false);
  다('자산이 0·음수면 안 받는다', 검산해서고른다([0], [0], [0]).됐나 === false);

  /* 🔴 짝이 둘 이상 나오는 것은 흔하다 — 표가 두 가지라서다. 자리로 가른다.
     ⚠ 이 시험은 처음에 「여럿이면 비운다」였는데, 그러면 멀쩡한 것을 다 버린다는 것을
       자가시험이 잡아 줬다. 규칙을 고쳤으니 시험도 따라 고친다. */
  const 해열 = 검산해서고른다([1000000, 2000000], [600000, 1200000], [400000, 800000]);
  다('🔴 열이 «해»면 맨 앞(올해)을 쓴다', 해열.됐나 && 해열.자산 === 1000000 && 해열.표꼴 === 'year-columns');
  const 부문 = 검산해서고른다([600000, 400000, 1000000], [360000, 240000, 600000], [240000, 160000, 400000]);
  다('🔴 앞 열을 더해 맨 뒤가 되면 «합계»를 쓴다', 부문.됐나 && 부문.자산 === 1000000 && 부문.표꼴 === 'segment-total');
  /* 고른 자리에 맞는 짝이 없으면 그때는 비운다 — 아무거나 끌어오지 않는다 */
  const 못고름 = 검산해서고른다([1234567, 1000000, 2000000], [600000, 1200000], [400000, 800000]);
  다('🔴 고른 자리에 짝이 없으면 비운다', 못고름.됐나 === false && /ambiguous/.test(못고름.왜));

  다('스캔(글자 없음)은 그렇게 적는다', 글에서뽑는다('짧다').왜 === 'scanned-image');
  다('빈 것도 견딘다', 글에서뽑는다('').됐나 === false && 글에서뽑는다(null).됐나 === false);
  다('자산 줄이 없으면 그 까닭', /no-total-assets/.test(글에서뽑는다('Total equity 1,000,000' + 'x'.repeat(2100)).왜));
  다('부채·자본 줄이 없으면 그 까닭',
    /no-total-liabilities/.test(글에서뽑는다('Total assets 1,000,000' + 'x'.repeat(2100)).왜));

  /* 라벨과 수가 다른 줄로 떨어진 판 */
  다('라벨 다음 줄의 수를 잇는다', 라벨줄찾기('Total assets\n\n   3,003,198', /^\s*Total\s+assets/i)[0].수[0] === 3003198);
  다('세 줄 뒤까지는 안 본다', 라벨줄찾기('Total assets\n\n\n\n 3,003,198', /^\s*Total\s+assets/i).length === 0);

  다('본문 속 「total assets」는 줄머리가 아니라 안 잡는다',
    라벨줄찾기('represents 46% of the total assets and 1,000,000', 자산재).length === 0);

  /* 🔴 2026-09-16 에 ADCB 가 «틀린 값으로» 검산을 통과했다. 그 셋을 시험으로 굳힌다 */

  다('🔴 다음 줄이 남의 라벨이면 그 수를 훔쳐 오지 않는다',
    라벨줄찾기('Total equity\nTotal liabilities and equity   744,273,269', 자본재).length === 0);
  다('수만 있는 줄은 그대로 잇는다',
    라벨줄찾기('Total equity\n      79,509,107', 자본재)[0].수[0] === 79509107);
  다('라벨인가 — 글자로 시작하면 라벨', 라벨인가('Total liabilities') && !라벨인가('   79,509,107') && !라벨인가(''));

  다('🔴 「Total liabilities and equity」는 부채로 안 잡는다',
    라벨줄찾기('Total liabilities and equity   744,273,269', 부채재).length === 0);
  다('그래도 「Total liabilities」는 잡는다',
    라벨줄찾기('Total liabilities   664,764,162', 부채재)[0].수[0] === 664764162);
  다('「Total equity and liabilities」는 자본으로 안 잡는다',
    라벨줄찾기('Total equity and liabilities   744,273,269', 자본재).length === 0);
  다('「Total shareholders\' equity」도 자본으로 잡는다',
    라벨줄찾기("Total shareholders' equity   79,509,107", 자본재)[0].수[0] === 79509107);
  다('「Total risk weighted assets」는 자산으로 안 잡는다',
    라벨줄찾기('Total risk weighted assets  183,836,931', 자산재).length === 0);

  /* 🔴 ADCB 실측 — 검산은 맞는데 자본이 자산과 같고 부채가 0.13% 였다 */
  다('🔴 부채가 자산의 1% 도 안 되면 라벨 오독으로 보고 안 받는다',
    검산해서고른다([744273269], [992703], [744273269]).됐나 === false);
  다('자본이 자산의 1% 도 안 되면 안 받는다',
    검산해서고른다([1000000], [995000], [5000]).됐나 === false);
  다('제대로 읽은 ADCB 값은 그대로 받는다',
    검산해서고른다([744273269], [664764162], [79509107]).됐나 === true);

  /* 🔴 ADIB 실측 — 글자는 뽑히는데 OCR 이 깨졌다(점이 천단위) */
  다('🔴 점을 천단위로 찍은 수가 거듭 나오면 OCR 깨짐으로 적는다',
    OCR깨졌나('269.734.257 … 215.909.795 … 197.592.557'));
  다('멀쩡한 소수는 OCR 깨짐이 아니다', OCR깨졌나('1,234.5  3.14  0.005') === false);
  다('OCR 깨짐은 그 까닭으로 적는다',
    글에서뽑는다('Total assets 269.734.257\n215.909.795\n197.592.557' + 'x'.repeat(2100)).왜 === 'ocr-garbled-numbers');

  /* 🔴 ADNOCLS 실측 — 「Total liabilities」 한 줄이 없고 비유동·유동으로만 적는다 */
  다('같은 자리끼리 더한다', 합쳐서후보([100, 200], [10, 20]).join() === '110,220');
  다('한쪽이 비면 빈 배열', 합쳐서후보([100], []).length === 0);
  다('짧은 쪽에 맞춘다', 합쳐서후보([100, 200, 300], [10]).join() === '110');
  const 유동나눔 = [
    'Total non-current liabilities   700,000    650,000',
    'Total current liabilities       300,000    250,000',
    'Total assets                  1,500,000  1,400,000',
    'Total equity                    500,000    500,000',
  ].join('\n') + 'x'.repeat(2100);
  const r3 = 글에서뽑는다(유동나눔);
  다('🔴 부채 줄이 없으면 비유동+유동을 더해 검산한다',
    r3.됐나 && r3.자산 === 1500000 && r3.부채 === 1000000 && r3.자본 === 500000);

  /* 🔴 자본 줄이 없는 판 — 「Total liabilities and equity」로 자산을 검산하고 자본은 뺄셈 */
  다('대차 균형 줄로 자본을 낸다',
    (() => { const x = 균형줄로푼다([1000000], [600000], [1000000]);
      return x.됐나 && x.자본 === 400000 && x.표꼴 === 'balancing-total'; })());
  다('균형 줄과 안 맞으면 비운다', 균형줄로푼다([1000000], [600000], [900000]).됐나 === false);
  다('🔴 부채 후보가 갈리면 비운다 — 아무거나 빼지 않는다',
    /ambiguous-total-liabilities/.test(균형줄로푼다([1000000], [600000, 700000], [1000000]).왜));
  다('부채가 자산과 거의 같으면 안 받는다(자본이 0 이 된다)',
    균형줄로푼다([1000000], [999000], [1000000]).됐나 === false);
  const 자본없음 = [
    'Total assets                  1,500,000',
    'Total liabilities             1,000,000',
    'Total liabilities and equity  1,500,000',
  ].join('\n') + 'x'.repeat(2100);
  const r4 = 글에서뽑는다(자본없음);
  다('🔴 자본 줄이 없어도 균형 줄이 있으면 뽑는다',
    r4.됐나 && r4.자산 === 1500000 && r4.부채 === 1000000 && r4.자본 === 500000);
  다('「Total net equity」도 자본으로 잡는다',
    라벨줄찾기('Total net equity   882,512', 자본재)[0].수[0] === 882512);
  다('까닭을 부채·자본으로 갈라 적는다',
    글에서뽑는다('Total assets 1,000,000\nTotal equity 400,000' + 'x'.repeat(2100)).왜 === 'no-total-liabilities-line');

  /* 라벨이 셋 다 없으면 «그 문서에 대차대조표가 없는 것»이다 — ABNIC 실측 */
  다('🔴 세 라벨이 다 없으면 「대차대조표가 문서에 없다」로 적는다',
    글에서뽑는다('Total comprehensive income 33,060,536' + 'x'.repeat(2100)).왜 === 'no-balance-sheet-in-document');

  const 진 = 것들.filter((x) => !x.참);
  console.log(`자가시험 ${것들.length - 진.length}/${것들.length}`);
  for (const x of 진) console.log('   🔴 ' + x.이름);
  process.exit(진.length ? 1 : 0);
}

/* ── 들머리 ───────────────────────────────────────────────────────────── */

/* ⛔ argv[1] 이 없을 때(다른 자가 import 할 때) pathToFileURL 이 죽는다 — 막아 둔다 */
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes('--자가시험')) 자가시험();
  /* 🔴 「왜 못 뽑나」를 짐작하지 않는다 — 못 뽑은 문서에서 「Total …」 라벨을 «세어» 본다.
   *   이 자가 없어서 PDF 를 하나씩 손으로 열어 보고 있었다. */
  else if (process.argv.includes('--라벨조사')) {
    const i = process.argv.indexOf('--라벨조사');
    const 몇 = Number(process.argv[i + 1] || 20);
    const t = JSON.parse(fs.readFileSync(탭길, 'utf8'));
    const 줄들 = (t.rows || t).filter((x) => x.eng_pdf_url && x.total_assets_aed == null).slice(0, 몇);
    const 셈 = {};
    let 못뽑은문서 = 0;
    for (const r of 줄들) {
      const 자리 = `C:/Users/User/AppData/Local/Temp/_bs_lab_${r.exchange}_${r.symbol}.pdf`;
      let 글 = '';
      try { 글 = PDF글(r.eng_pdf_url, 자리); } catch { /* 못 받으면 건너뛴다 */ }
      try { fs.unlinkSync(자리); } catch { /* 지워도 그만 */ }
      if (!글 || 글에서뽑는다(글).됐나) continue;
      못뽑은문서 += 1;
      const 본것 = new Set();
      for (const 줄 of 글.split(/\r?\n/)) {
        const m = /^\s*(Total[A-Za-z' ()/-]{0,45})/.exec(줄);
        if (!m || !줄에서수들(줄).length) continue;
        본것.add(m[1].trim().replace(/\s+/g, ' ').toLowerCase());
      }
      for (const x of 본것) 셈[x] = (셈[x] || 0) + 1;
    }
    console.log(`■ 못 뽑은 문서 ${못뽑은문서}개에서 본 「Total …」 라벨 (수가 붙은 줄만)\n`);
    for (const [k, v] of Object.entries(셈).sort((a, b) => b[1] - a[1]).slice(0, 40)) {
      console.log(`   ${String(v).padStart(3)}개 문서  ${k}`);
    }
  }
  else {
    const 인자 = (이름, 기본) => {
      const i = process.argv.indexOf(`--${이름}`);
      return (i >= 0 && process.argv[i + 1]) ? process.argv[i + 1] : 기본;
    };
    const 몇개 = process.argv.includes('--전부') ? Infinity : Number(인자('몇개', '12'));
    const t = JSON.parse(fs.readFileSync(탭길, 'utf8'));
    const 줄들 = t.rows || t;
    const 할것 = 줄들.filter((x) => x.eng_pdf_url && x.total_assets_aed == null);
    const 표본 = 할것.slice(0, 몇개 === Infinity ? 할것.length : 몇개);
    console.log(`■ 자산이 비어 있고 PDF 가 있는 줄 ${할것.length}개 · 이번에 ${표본.length}개를 뽑는다\n`);

    let 됐다 = 0; const 까닭수 = {};
    for (const r of 표본) {
      const 자리 = `C:/Users/User/AppData/Local/Temp/_bs_${r.exchange}_${r.symbol}.pdf`;
      let 것;
      try { 것 = 글에서뽑는다(PDF글(r.eng_pdf_url, 자리)); }
      catch (e) { 것 = { 됐나: false, 왜: 'download-or-pdftotext-failed' }; }
      try { fs.unlinkSync(자리); } catch { /* 지워도 그만 */ }
      if (것.됐나) {
        됐다 += 1;
        r.total_assets_aed = 것.자산; r.total_liabilities_aed = 것.부채; r.total_equity_aed = 것.자본;
        r.balance_sheet_reconciled = true; r.balance_sheet_reason = null;
        console.log(`   ✅ ${r.symbol.padEnd(12)} ${String(r.period).padEnd(10)} 자산 ${것.자산.toLocaleString()} = 부채 ${것.부채.toLocaleString()} + 자본 ${것.자본.toLocaleString()}`);
      } else {
        까닭수[것.왜] = (까닭수[것.왜] || 0) + 1;
        r.balance_sheet_reason = 것.왜;
        console.log(`   ⬜ ${r.symbol.padEnd(12)} ${String(r.period).padEnd(10)} ${것.왜}`);
      }
    }
    console.log(`\n■ 검산을 통과해 채운 것 ${됐다}/${표본.length}`);
    for (const [k, v] of Object.entries(까닭수).sort((a, b) => b[1] - a[1])) console.log(`   ${String(v).padStart(3)}  ${k}`);
    console.log('⛔ 검산이 안 맞은 것은 «비운 채로» 두었다. 짐작으로 채우지 않는다.');

    if (process.argv.includes('--적는다')) {
      fs.writeFileSync(탭길, JSON.stringify(t, null, 1));
      console.log('✅ 탭에 적었다 — ' + 탭길);
    } else {
      console.log('⬜ 아직 안 적었다. 적으려면 --적는다');
    }
  }
}
