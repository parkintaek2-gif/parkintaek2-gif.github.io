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
/* 🔴 [2026-09-17] 라벨은 **6번이 먼저 만든 `collect-uae-adx-balance-sheet.mjs` 것을 가져왔다.**
 *   그쪽이 내 것보다 정교하다 — 꼬리에 `(?=[\d(]|$)` 를 달아 **라벨 뒤에 말이 더 붙은 줄**을
 *   통째로 막는다. 「Total assets under management」·「Total liabilities and equity」가
 *   한 번에 걸러진다(내 것은 부정 예측으로 하나씩 막고 있었다).
 *   ⛔ 같은 일을 하는 자가 둘이면 «있는 것을 고친다»가 우리 규칙이다. 베껴 온 자리를 적어 둔다. */
/* ⚠ 꼬리에 `_ — – -` 를 더한 것은 **OCR 글 때문**이다(2026-09-17 실측).
 *   스캔 쪽을 읽으면 라벨과 수 사이의 점선이 이렇게 나온다 —
 *     `Total equity ——___11,193,228) _____—i' 505,293`
 *   이 글자들을 안 넣으면 OCR 로 애써 읽어 놓고 라벨에서 놓친다.
 *   ⛔ 넓혀도 안전하다 — 여전히 뒤에 «수»가 와야 하고(`(?=[\d(]|$)`),
 *     「Total assets under management」처럼 «말»이 붙은 줄은 그대로 막힌다. */
/* ⚠ 머리에 «한두 자리 수»를 허용한 것도 OCR 때문이다 — 스캔 쪽을 읽으면 쪽번호·각주가
 *   라벨 «앞»에 붙어 나온다: `2 Total assets 14,108,238 14,508,491`.
 *   ⛔ 줄머리 조건을 아예 풀지는 않는다 — 그러면 「represents 46% of the total assets」
 *     같은 본문이 걸린다. 앞에 올 수 있는 것은 «수»뿐이지 «말»이 아니다. */
const 머리 = String.raw`\s*(?:\d{1,2}\s+)?`;
const 꼬리 = String.raw`\s*(?:\d{1,2}\s*)?[\s.·_—–\-]*(?=[\d(]|$)`;
export const 자산재 = new RegExp(String.raw`^${머리}total\s+assets${꼬리}`, 'i');
export const 부채재 = new RegExp(String.raw`^${머리}total\s+liabilities${꼬리}`, 'i');
export const 자본재 = new RegExp(
  String.raw`^${머리}total\s+(?:net\s+)?(?:equity|shareholders[’']?\s*(?:equity|funds)|owners[’']?\s*equity|capital\s+and\s+reserves)${꼬리}`, 'i');
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
export const 대차합계재 = new RegExp(String.raw`^${머리}total\s+(?:liabilities\s+and\s+(?:equity|shareholders[’']?\s*(?:equity|funds))|equity\s+and\s+liabilities)${꼬리}`, 'i');
export const 비유동부채재 = new RegExp(String.raw`^${머리}total\s+non[- ]current\s+liabilities${꼬리}`, 'i');
export const 유동부채재 = new RegExp(String.raw`^${머리}total\s+current\s+liabilities${꼬리}`, 'i');
export const 비유동자산재 = new RegExp(String.raw`^${머리}total\s+non[- ]current\s+assets${꼬리}`, 'i');
export const 유동자산재 = new RegExp(String.raw`^${머리}total\s+current\s+assets${꼬리}`, 'i');

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

/* ── 🔴 스캔 쪽을 읽는다 (2026-09-17) ─────────────────────────────────────
 *
 * 사장님: 「**지난해 실적기준 감사보고서가 없다고? 어디있는데 너희가 못찾는 것 같다**」
 *
 * 감사보고서는 91/91 다 있었다. 그런데 대차대조표를 못 뽑는 것이 많아 «왜»를 셌다
 * (`--병목조사` 18건) — **못 뽑은 16건 가운데 15건이 「글자 없는 쪽」을 갖고 있었다.**
 * ```
 *   ADNH Q2 2026   1쪽 143자 · 2쪽 목차 · 3쪽 검토보고서 · **4쪽 0자** · 5쪽 손익계산서
 *                  ⇒ 목차 순서로 보면 그 0자 쪽이 «재무상태표»다. 그 쪽만 그림이었다
 * ```
 * ⛔ 라벨을 더 넓혀도 소용없다. 글자가 아예 없다.
 * ✅ 그래서 그 쪽만 **그림으로 찍어 읽는다** — 크롬으로 그리고 tesseract 로 읽는다.
 *   실측(ADNH 4쪽): `Total assets 14,108,238` · `Total liabilities 2,915,010` 이 읽혔고
 *   자본은 OCR 이 깨졌지만(`——___11,193,228)`) 숫자는 살아 있어
 *   **14,108,238 = 2,915,010 + 11,193,228** 로 검산이 딱 맞았다.
 * ⚠ OCR 은 글자를 «짐작»한다. 그래서 검산을 더 엄격히 하지 않는다 —
 *   원래 규칙(자산 = 부채 + 자본, 0.5%)이 그대로 걸러 준다. 안 맞으면 비운다.
 */
export const OCR자 = 'C:/Program Files/Tesseract-OCR/tesseract.exe';

/**
 * 🔴 [2026-09-17 실측] **단위도 통화도 문서마다 다르다. 둘 다 읽는다.**
 *
 * 6번 자의 `단위힌트()` 는 앞 6000자만 본다. 그런데 실측해 보니 —
 * ```
 *   ADNH    앞 6000자에 없음 · 글 전체에는 AED'000 이 84번
 *   ADCB    AED'000 160번
 *   ADNOCGAS  🔴 **USD'000** 117번 — AED 가 아니다
 *   ABNIC   표기 없음 (실단위로 적는 판)
 * ```
 * ⛔ 칸 이름이 `total_assets_aed` 라 «AED» 처럼 보이지만 **아니다.**
 *   ADNOC 계열은 달러로 보고한다. 통화를 안 적으면 걸프 전체 비교가 통째로 틀린다.
 * ✅ 그래서 글 «전체»에서 세어 **가장 많이 나온 표기**를 쓴다. 한 보고서 안에서
 *   표 머리마다 되풀이되므로 압도적으로 많은 쪽이 그 보고서의 단위다.
 * ⛔ 못 찾으면 «비운다». 「표기가 없으니 실단위겠지」로 채우지 않는다 — 천 배가 걸린 일이다.
 */
export function 단위읽기(글) {
  const t = String(글 ?? '');
  const 셈 = {};
  const 더 = (열쇠, n) => { if (n) 셈[열쇠] = (셈[열쇠] || 0) + n; };
  for (const 돈 of ['AED', 'USD']) {
    더(`${돈}'000`, (t.match(new RegExp(String.raw`${돈}[ '’]*000\b`, 'gi')) || []).length);
    더(`${돈}'000`, (t.match(new RegExp(String.raw`${돈}\s*thousands?\b`, 'gi')) || []).length);
    더(`${돈} million`, (t.match(new RegExp(String.raw`${돈}\s*millions?\b`, 'gi')) || []).length);
    더(`${돈} million`, (t.match(new RegExp(String.raw`millions?\s+of\s+${돈}`, 'gi')) || []).length);
    /* ⚠ 「UAE Dirhams」는 AED 일 때만 붙인다 — 두 통화 루프에 다 넣었더니 같은 글을
       AED 로도 USD 로도 세어 «엇비슷»이 되고 둘 다 버려졌다(자가시험이 잡았다). */
    const 딴이름 = 돈 === 'AED' ? String.raw`|UAE\s+Dirhams?|Dirhams?` : '';
    더(`${돈}'000`, (t.match(new RegExp(String.raw`thousands?\s+of\s+(?:${돈}${딴이름})`, 'gi')) || []).length);
  }
  const 줄 = Object.entries(셈).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
  if (!줄.length) return null;
  /* ⚠ 1·2등이 엇비슷하면 «못 정했다»로 둔다 — 두 통화가 섞인 문서를 우리가 고르지 않는다 */
  if (줄.length > 1 && 줄[1][1] > 0 && 줄[0][1] < 줄[1][1] * 2) return null;
  return 줄[0][0];
}

/** 글자가 거의 없는 쪽 번호들 — 그 쪽이 그림이다 */
export function 빈쪽찾기(pdf자리, 최대쪽 = 60) {
  const 것 = [];
  for (let p = 1; p <= 최대쪽; p += 1) {
    let 쪽글 = '';
    try { 쪽글 = execFileSync('pdftotext', ['-table', '-f', String(p), '-l', String(p), pdf자리, '-'], { maxBuffer: 1e8 }).toString('utf8'); }
    catch { break; }
    if (!쪽글) break;
    if (쪽글.replace(/\s/g, '').length < 40) 것.push(p);
  }
  return 것;
}

/** 그 쪽을 크롬으로 그려 PNG 로 찍고 tesseract 로 읽는다 */
async function 쪽읽기(브라우저, pdf자리, 쪽, 임시밑) {
  const png = `${임시밑}_p${쪽}`;
  const page = await 브라우저.newPage();                    /* ⭐ 언제나 새 탭 */
  try {
    await page.setViewport({ width: 1240, height: 1754, deviceScaleFactor: 2 });
    await page.goto(`file:///${pdf자리}#page=${쪽}&zoom=page-fit`, { waitUntil: 'load', timeout: 60000 });
    await new Promise((r) => setTimeout(r, 5000));          /* 뷰어가 그 쪽을 그릴 때까지 */
    await page.screenshot({ path: `${png}.png` });
  } finally {
    await page.close();
  }
  execFileSync(OCR자, [`${png}.png`, png, '-l', 'eng', '--psm', '6'], { maxBuffer: 1e8 });
  const 글 = fs.readFileSync(`${png}.txt`, 'utf8');
  for (const 끝 of ['.png', '.txt']) { try { fs.unlinkSync(png + 끝); } catch { /* 지워도 그만 */ } }
  return 글;
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

  /* 🔴 단위·통화를 읽는다 — 안 적으면 천 배가 틀리고, 통화를 섞으면 나라 비교가 통째로 틀린다 */
  다('AED\'000 을 읽는다', 단위읽기("AED'000 ".repeat(10)) === "AED'000");
  다('🔴 USD 로 내는 회사도 있다 — 통화를 가른다', 단위읽기("USD'000 ".repeat(10)) === "USD'000");
  다('백만 단위도 읽는다', 단위읽기('AED million '.repeat(10)) === 'AED million');
  다('「thousands of UAE Dirhams」 도 읽는다', 단위읽기('in thousands of UAE Dirhams '.repeat(6)) === "AED'000");
  다('표기가 없으면 null — 「없으니 실단위겠지」로 채우지 않는다', 단위읽기('Total assets 1,000') === null);
  다('🔴 두 통화가 엇비슷하게 섞이면 «못 정했다»로 둔다',
    단위읽기("AED'000 ".repeat(5) + "USD'000 ".repeat(4)) === null);
  다('한쪽이 압도적이면 그것을 쓴다', 단위읽기("AED'000 ".repeat(20) + "USD'000 ") === "AED'000");
  다('빈 것도 견딘다', 단위읽기('') === null && 단위읽기(null) === null);

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
  /* 🔴 [2026-09-17] **왜 못 뽑나 — 우리 자 탓인가 PDF 탓인가.** 짐작하지 않고 센다.
   *   라벨을 아무리 넓혀도 «글자가 없는 쪽»은 못 읽는다. 그런 문서가 몇이나 되는지 세면
   *   OCR 을 붙일 값이 있는지 정할 수 있다. ⛔ 「PDF 탓이다」를 재지 않고 적지 않는다. */
  /* 🔴🔴 [2026-09-17 02:0x] **단위를 안 적으면 이 수들은 쓸 수 없다.**
   *
   *   ADCB 한 회사 안에서 값이 이렇게 갈려 있었다 —
   *     833,184 · 808,857 · 773,654   (앞 사람이 적은 것)
   *     744,273,269                   (내가 적은 것)
   *   둘 다 맞다. **단위가 다를 뿐이다**(백만 AED 와 천 AED).
   *   ⛔ 단위 없이 PBR·ROE 를 내면 천 배 틀린다. 그리고 틀린 수 하나가
   *     옳은 스물셋을 같이 의심받게 한다.
   *   ⚠ 칸 이름이 `total_assets_aed` 라 «AED 단위»처럼 보이는 것도 함정이다 —
   *     실제로는 «그 보고서에 적힌 단위»다.
   *   ✅ 값을 우리가 곱해서 맞추지 않는다. 곱하다 틀리면 조용히 틀린다.
   *     보고서에 적힌 단위를 «읽어서 적어만» 둔다(6번 자의 원칙을 그대로 따른다).
   */
  else if (process.argv.includes('--단위채우기')) {
    const t = JSON.parse(fs.readFileSync(탭길, 'utf8'));
    const 줄들 = (t.rows || t).filter((x) => x.eng_pdf_url && x.total_assets_aed != null && !x.unit_hint);
    console.log(`■ 값은 있는데 «단위»가 없는 줄 ${줄들.length}개\n`);
    let 채움 = 0; let 못찾음 = 0; let 센것 = 0;
    for (const r of 줄들) {
      센것 += 1;
      const 자리 = `C:/Users/User/AppData/Local/Temp/_bs_u_${r.exchange}_${r.symbol}.pdf`;
      let 단위 = null;
      try { 단위 = 단위읽기(PDF글(r.eng_pdf_url, 자리)); } catch { /* 못 받으면 못 찾은 것으로 친다 */ }
      try { fs.unlinkSync(자리); } catch { /* 지워도 그만 */ }
      if (단위) { r.unit_hint = 단위; 채움 += 1; } else { 못찾음 += 1; }
      if (센것 % 20 === 0 && process.argv.includes('--적는다')) {
        fs.writeFileSync(탭길, JSON.stringify(t, null, 1));
        console.log(`   … ${센것}/${줄들.length} (채움 ${채움} · 못 찾음 ${못찾음})`);
      }
    }
    console.log(`\n■ 단위를 찾아 적은 것 ${채움} · 못 찾은 것 ${못찾음}`);
    console.log('⛔ 못 찾은 것은 «비운 채로» 둔다. 짐작으로 단위를 정하지 않는다 — 천 배가 걸린 일이다.');
    if (process.argv.includes('--적는다')) {
      fs.writeFileSync(탭길, JSON.stringify(t, null, 1));
      console.log('✅ 탭에 적었다 — ' + 탭길);
    } else { console.log('⬜ 아직 안 적었다. 적으려면 --적는다'); }
  }
  else if (process.argv.includes('--병목조사')) {
    const i = process.argv.indexOf('--병목조사');
    const 몇 = Number(process.argv[i + 1] || 20);
    const t = JSON.parse(fs.readFileSync(탭길, 'utf8'));
    const 줄들 = (t.rows || t).filter((x) => x.eng_pdf_url && x.total_assets_aed == null).slice(0, 몇);
    const 셈 = { 뽑힘: 0, 빈쪽있음: 0, 빈쪽없음: 0, 못받음: 0 };
    for (const r of 줄들) {
      const 자리 = `C:/Users/User/AppData/Local/Temp/_bs_bot_${r.exchange}_${r.symbol}.pdf`;
      let 글 = '';
      try {
        execFileSync('curl', ['-sS', '-f', ...헤더, r.eng_pdf_url, '-o', 자리], { maxBuffer: 1e8 });
        글 = execFileSync('pdftotext', ['-table', 자리, '-'], { maxBuffer: 1e8 }).toString('utf8');
      } catch { 셈.못받음 += 1; try { fs.unlinkSync(자리); } catch { /* 그만 */ } continue; }
      const 것 = 글에서뽑는다(글);
      if (것.됐나) { 셈.뽑힘 += 1; try { fs.unlinkSync(자리); } catch { /* 그만 */ } continue; }
      /* 쪽을 하나씩 뽑아 «글자가 거의 없는 쪽»을 센다 — 그 쪽이 이미지다 */
      let 빈쪽 = 0; let 전체 = 0;
      for (let p = 1; p <= 40; p += 1) {
        let 쪽글 = '';
        try { 쪽글 = execFileSync('pdftotext', ['-table', '-f', String(p), '-l', String(p), 자리, '-'], { maxBuffer: 1e8 }).toString('utf8'); }
        catch { break; }
        if (!쪽글) break;
        전체 += 1;
        if (쪽글.replace(/\s/g, '').length < 40) 빈쪽 += 1;
      }
      try { fs.unlinkSync(자리); } catch { /* 그만 */ }
      if (빈쪽 > 0) 셈.빈쪽있음 += 1; else 셈.빈쪽없음 += 1;
      console.log(`   ${r.symbol.padEnd(12)} ${String(r.period).padEnd(9)} ${것.왜.padEnd(34)} 쪽 ${전체} 중 «글자 없는 쪽» ${빈쪽}`);
    }
    console.log('\n■ 못 뽑은 까닭이 어디에 있나');
    console.log(`   뽑힘                  ${셈.뽑힘}`);
    console.log(`   못 뽑음 · 빈 쪽 있음   ${셈.빈쪽있음}   ← PDF 가 글자를 안 준다(OCR 이 있어야 한다)`);
    console.log(`   못 뽑음 · 빈 쪽 없음   ${셈.빈쪽없음}   ← 글자는 있는데 «우리 자»가 못 읽는다`);
    console.log(`   PDF 를 못 받음         ${셈.못받음}`);
    console.log('⭐ 「빈 쪽 없음」이 크면 우리 자를 고칠 값이 있다. 「빈 쪽 있음」이 크면 OCR 이 답이다.');
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

    /* 🔴 스캔 쪽을 읽으려면 크롬이 있어야 한다. 없으면 «없다고 적고» OCR 없이 간다 —
     *   ⛔ 조용히 건너뛰지 않는다. 안 재 본 것을 「못 뽑는다」로 세면 다음 사람이 속는다. */
    const OCR쓴다 = !process.argv.includes('--OCR없이');
    let 브라우저 = null;
    if (OCR쓴다) {
      try {
        const { createRequire } = await import('node:module');
        const 부르기 = createRequire('file:///C:/Users/User/Documents/GitHub/klifemap/package.json');
        브라우저 = await 부르기('puppeteer-core')
          .connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
        if (!fs.existsSync(OCR자)) { 브라우저.disconnect(); 브라우저 = null; console.log('⚠ tesseract 가 없다 — 스캔 쪽은 못 읽는다\n'); }
      } catch (e) { console.log(`⚠ 크롬(9222)에 못 붙었다 — 스캔 쪽은 못 읽는다: ${e.message}\n`); }
    }

    /* ⚠ 전부 돌리면 두 시간이 넘는다(스캔 쪽마다 크롬으로 그리고 읽는다).
     *   그 사이에 끊기면 «한 건도 안 남는다» — 그래서 스무 건마다 적어 둔다.
     *   ⛔ 「끝에 한 번 적는다」로 두면 중간에 죽을 때 애써 읽은 것이 다 사라진다. */
    const 적는다 = () => {
      if (!process.argv.includes('--적는다')) return;
      fs.writeFileSync(탭길, JSON.stringify(t, null, 1));
      덜적은게있다 = false;
    };
    let 덜적은게있다 = false;
    let 센것 = 0;

    let 됐다 = 0; let OCR로됐다 = 0; const 까닭수 = {};
    for (const r of 표본) {
      센것 += 1;
      덜적은게있다 = true;
      if (센것 % 20 === 0) { 적는다(); console.log(`   … ${센것}/${표본.length} 까지 적어 두었다`); }
      const 자리 = `C:/Users/User/AppData/Local/Temp/_bs_${r.exchange}_${r.symbol}.pdf`;
      let 것; let OCR로 = false;
      try { 것 = 글에서뽑는다(PDF글(r.eng_pdf_url, 자리)); }
      catch (e) { 것 = { 됐나: false, 왜: 'download-or-pdftotext-failed' }; }

      /* 글자로 못 뽑았고 «그림인 쪽»이 있으면 그 쪽만 읽어 다시 해 본다 */
      if (!것.됐나 && 브라우저 && fs.existsSync(자리)) {
        try {
          /* 🔴 [2026-09-17 02:5x 실측] 처음에 «빈 쪽 4개»까지만 읽었다. 그런데 세 보니 —
           *   AGTHIA 빈 쪽 26개 · ALPHADHABI 55개 — **문서 전체가 스캔**인 판이 있다.
           *   그런 문서는 재무상태표가 5~8쪽쯤이라 4개에서 끊으면 영영 못 닿는다
           *   (`scanned-image` 로 남은 20건이 그 꼴이었다).
           * ⭐ 10개로 늘려도 느려지지 않는다 — **찾는 즉시 멈춘다.** 재무상태표는 앞쪽에 있다. */
          const 빈쪽 = 빈쪽찾기(자리);
          for (const p of 빈쪽.slice(0, 10)) {
            const 글 = await 쪽읽기(브라우저, 자리, p, 자리.replace(/\.pdf$/, ''));
            const 다시 = 글에서뽑는다(글 + 'x'.repeat(2100));   /* 한 쪽이라 길이 문턱을 채워 준다 */
            if (다시.됐나) { 것 = 다시; OCR로 = true; break; }
          }
        } catch (e) { /* OCR 이 실패해도 앞서 적은 까닭을 그대로 쓴다 */ }
      }
      try { fs.unlinkSync(자리); } catch { /* 지워도 그만 */ }
      if (것.됐나) {
        됐다 += 1; if (OCR로) OCR로됐다 += 1;
        r.total_assets_aed = 것.자산; r.total_liabilities_aed = 것.부채; r.total_equity_aed = 것.자본;
        r.balance_sheet_reconciled = true; r.balance_sheet_reason = null;
        /* ⭐ OCR 로 읽은 것은 «그렇게 읽었다»고 적어 둔다 — 글자를 짐작한 값이다 */
        r.balance_sheet_source = OCR로 ? 'ocr-of-scanned-page' : 'pdf-text';
        console.log(`   ${OCR로 ? '🔍' : '✅'} ${r.symbol.padEnd(12)} ${String(r.period).padEnd(10)} 자산 ${것.자산.toLocaleString()} = 부채 ${것.부채.toLocaleString()} + 자본 ${것.자본.toLocaleString()}${OCR로 ? '  (스캔 쪽을 읽었다)' : ''}`);
      } else {
        까닭수[것.왜] = (까닭수[것.왜] || 0) + 1;
        r.balance_sheet_reason = 것.왜;
        console.log(`   ⬜ ${r.symbol.padEnd(12)} ${String(r.period).padEnd(10)} ${것.왜}`);
      }
    }
    if (브라우저) 브라우저.disconnect();          /* ⛔ close() 가 아니다 — 사장님 창이 닫힌다 */
    if (덜적은게있다) 적는다();                   /* 마지막 자투리까지 적는다 */
    console.log(`\n■ 검산을 통과해 채운 것 ${됐다}/${표본.length}  (그 가운데 스캔 쪽을 읽어 건진 것 ${OCR로됐다})`);
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
