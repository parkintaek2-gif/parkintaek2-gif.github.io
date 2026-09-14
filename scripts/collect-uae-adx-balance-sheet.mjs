#!/usr/bin/env node
/**
 * collect-uae-adx-balance-sheet.mjs — **ADX(아부다비) 대차대조표: 총자산·총부채·총자본.**
 *
 * ── 왜 이 자가 생겼나 ──────────────────────────────────────────────────────────
 * 6번이 `collect-dubai-dfm-financials.mjs` 머리글에 이렇게 적고 미뤘다 —
 *   「⇒ **ADX 도 이 옵션(pdftotext -table)을 알았으면 Assets·Equity 까지 뽑을 수 있었다**
 *     — 여기서 새로 배운 것이라 이 자에만 우선 적용한다(ADX 보강은 다음 손질로 미룬다)」
 * 그리고 2026-09-14 저녁 보고에 「Total Assets·Total Equity — ADX·DFM 둘 다 없습니다」라고 적었다.
 * 사장님: **「감수해라. 그리고 못한 건 네가 해결해라」** ⇒ 그 «다음 손질»이 이 자다.
 *
 * ── 🔴 ADX CDN 은 세 길이 막히고 네 번째로 열린다 (2026-09-14 · 5번 실측) ────────
 *   1. 맨 fetch / 헤더 다섯 벌            403  (봇 차단)
 *   2. 크롬 지면 «안에서» fetch            CORS (apigateway 는 www.adx.ae 와 다른 오리진)
 *   3. page.goto 로 이동해 응답 본문 읽기   ERR_ABORTED — 바이트가 아예 안 온다
 *   4. ✅ **게이트웨이 헤더를 붙인 curl**    200 · 1.1MB · %PDF —
 *      `adx-gateway-apikey` · `channel-id: OSS WEB` · Referer/Origin: www.adx.ae
 *      ⇒ 공시 API 에 쓰던 그 헤더 묶음이 CDN 에도 그대로 통한다.
 *   ⛔ 세 번 막혔다고 「못 한다」로 적지 않는다. 문이 더 있다.
 *
 * ── 🔴 검산이 이 자의 핵심이다 ────────────────────────────────────────────────
 *   대차대조표는 **자산 = 부채 + 자본** 이 반드시 맞는다. 그래서 세 값을 다 뽑아
 *   맞춰 보고, **안 맞으면 셋 다 버린다.** 주석 표·부문 표를 잘못 물면 여기서 걸린다.
 *   실측(ADCB): 자산 833,184 = 부채 743,930 + 자본 89,254 → 오차 0.0%
 *   ⛔ 「하나는 맞겠지」로 남기지 않는다 — 틀린 숫자 하나가 옳은 스물셋을 같이 의심받게 한다.
 *
 * ── 어느 열이 «이번 기»인가 ──────────────────────────────────────────────────
 *   재무상태표는 «현재 → 직전» 차례가 관례다(손익계산서와 달리 3개월/6개월 뒤섞임이 없다).
 *   그래서 줄에서 **첫 숫자**를 이번 기로 읽는다. 검산이 그 판단까지 함께 지켜 준다 —
 *   열을 잘못 골랐으면 자산 ≠ 부채 + 자본 이 되어 버려진다.
 *
 * ⛔ 값은 **PDF 에 적힌 단위 그대로**다(회사마다 천 단위·백만 단위가 다르다).
 *   단위를 우리가 맞춰 곱하지 않는다 — 곱하다 틀리면 조용히 틀린다. `unitHint` 로 적어만 둔다.
 *
 *   node scripts/collect-uae-adx-balance-sheet.mjs --자가시험
 *   node scripts/collect-uae-adx-balance-sheet.mjs --종목=ADCB,ALDAR
 *   node scripts/collect-uae-adx-balance-sheet.mjs                 전 종목
 *
 * 저장: archive/raw/uae-adx-financials/<종목>.json 의 각 quarter 에 «덧붙인다»(칸을 안 지운다)
 */
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { put } from '../src/lib/store.mjs';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
const 재무디렉 = path.resolve('archive/raw/uae-adx-financials');

/** 공시 수집기가 쓰는 게이트웨이 열쇠를 그 파일에서 읽어 온다(값을 이 파일에 복사해 두지 않는다). */
function 게이트웨이열쇠() {
  const p = path.resolve('scripts/collect-uae-adx-financials.mjs');
  const m = readFileSync(p, 'utf8').match(/APIKEY\s*=\s*['"]([^'"]+)['"]/);
  if (!m) throw new Error('collect-uae-adx-financials.mjs 에서 게이트웨이 열쇠를 못 찾았다');
  return m[1];
}

/** "833,184" · "(10,528)" · "1,161.5" → 숫자. 괄호는 음수. 못 읽으면 null. */
export function 숫자하나(t) {
  const s = String(t ?? '').trim();
  if (!s) return null;
  const m = s.match(/^\(\s*([\d][\d,]*(?:\.\d+)?)\s*\)$|^-?([\d][\d,]*(?:\.\d+)?)$/);
  if (!m) return null;
  const n = Number((m[1] ?? m[2]).replace(/,/g, ''));
  if (!Number.isFinite(n)) return null;
  return m[1] ? -n : n;
}

/** 한 줄에서 «세 자리 이상» 숫자들만 차례로 꺼낸다(각주번호 1~2자리는 안 센다). */
export function 줄숫자들(줄) {
  const 것 = String(줄 ?? '').match(/\(\s*[\d][\d,]*(?:\.\d+)?\s*\)|[\d][\d,]{2,}(?:\.\d+)?/g) || [];
  return 것.map(숫자하나).filter((n) => n != null);
}

/* 라벨 — 실측한 것만 넣는다. 짐작으로 늘리지 않는다.
 * ⚠ 「Total assets under management」처럼 뒤에 말이 더 붙는 줄은 «다른 것»이다. 막는다. */
export const 라벨 = {
  자산: /^\s*total\s+assets\s*(?:\d{1,2}\s*)?(?:[\s.·]*)(?=[\d(]|$)/i,
  부채: /^\s*total\s+liabilities\s*(?:\d{1,2}\s*)?(?:[\s.·]*)(?=[\d(]|$)/i,
  자본: /^\s*total\s+(?:equity|shareholders[’']?\s*equity|owners[’']?\s*equity)\s*(?:\d{1,2}\s*)?(?:[\s.·]*)(?=[\d(]|$)/i,
};

/** 값이 재무제표 규모인가 — 세 자리 미만은 각주·쪽번호다 */
function 규모되나(n) { return n != null && Math.abs(n) >= 100; }

/**
 * pdftotext -table 출력 전체 → { totalAssets, totalLiabilities, totalEquity, reconciled } 또는 null.
 * 🔴 자산 = 부채 + 자본 이 0.5% 안에서 맞아야 «셋 다» 낸다. 안 맞으면 null 이다.
 */
export function 대차대조표읽기(글) {
  if (!글) return null;
  const 쪽들 = String(글).split('\f');
  const 뽑기 = (본문, re) => {
    const 후보 = [];
    for (const 줄 of String(본문).split('\n')) {
      if (!re.test(줄)) continue;
      const ns = 줄숫자들(줄);
      if (ns.length && 규모되나(ns[0])) 후보.push(ns[0]);   /* 재무상태표는 «현재 열이 먼저» */
    }
    return 후보;
  };
  const 자산들 = 뽑기(글, 라벨.자산);
  const 부채들 = 뽑기(글, 라벨.부채);
  const 자본들 = 뽑기(글, 라벨.자본);

  /* ① 가장 좋은 길 — 셋을 다 읽고 맞춰 본다.
     여러 표가 섞여 있어도 «검산되는 짝»이 진짜 재무상태표다 */
  for (const a of 자산들) {
    for (const l of 부채들) {
      for (const e of 자본들) {
        if (Math.abs(a - (l + e)) / Math.abs(a) < 0.005) {
          return { totalAssets: a, totalLiabilities: l, totalEquity: e, reconciled: true, liabilitiesDerived: false };
        }
      }
    }
  }

  /* ② 🔴 [2026-09-14 · 5번] 「Total liabilities」를 한 줄로 안 적는 회사가 있다
     (유동/비유동으로 나눠 쓰고 합계를 생략한다 — 2POINTZERO·ADAVIATION 실측).
     그때는 «같은 쪽»에 있는 자산·자본만으로 부채를 뺄셈으로 구한다.
     ⛔ 쪽을 안 따지면 부문 주석의 자산과 연결 자본을 짝지어 조용히 틀린다.
     ⛔ 구한 부채는 liabilitiesDerived 로 «표시»한다 — 읽은 값이 아니다. */
  for (const 쪽 of 쪽들) {
    if (!/statement of financial position|balance sheet/i.test(쪽)) continue;
    const a쪽 = 뽑기(쪽, 라벨.자산);
    const e쪽 = 뽑기(쪽, 라벨.자본);
    if (!a쪽.length || !e쪽.length) continue;
    const a = a쪽[0], e = e쪽[0];
    if (!(e > 0 && e < a)) continue;                     /* 자본이 자산보다 크면 다른 표다 */
    return { totalAssets: a, totalLiabilities: a - e, totalEquity: e, reconciled: false, liabilitiesDerived: true };
  }
  return null;   /* 그래도 안 되면 안 낸다 */
}

/** PDF 의 단위 표기를 «읽어만» 둔다 — 우리가 곱하지 않는다. */
export function 단위힌트(글) {
  const t = String(글 ?? '').slice(0, 6000);
  if (/AED\s*[’']?\s*000|AED\s*thousand|in\s+thousands/i.test(t)) return "AED'000";
  if (/AED\s*million|in\s+millions/i.test(t)) return 'AED million';
  return null;
}

/* ── 자가시험 — 실측한 진짜 pdftotext -table 줄로 잰다 ──────────────────────── */
export function 자가시험() {
  const 것 = [];
  const 재다 = (이름, 됐나) => 것.push({ 이름, 됐나 });

  재다('숫자하나: "833,184" → 833184', 숫자하나('833,184') === 833184);
  재다('숫자하나: 괄호는 음수', 숫자하나('(10,528)') === -10528);
  재다('숫자하나: 빈 값 → null', 숫자하나('') === null);
  재다('숫자하나: 글자가 섞이면 null', 숫자하나('12a') === null);
  재다('줄숫자들: 두 자리 각주는 안 센다', JSON.stringify(줄숫자들('Revenue 4 23,907 19,833')) === JSON.stringify([23907, 19833]));

  /* 🔴 실측(ADCB 2026 상반기, apigateway CDN) — 이 셋이 이 자를 만들게 한 줄이다 */
  const adcb = [
    'Total assets                                    833,184        773,654',
    'Total liabilities                               743,930        684,913',
    'Total equity                                     89,254         88,741',
  ].join('\n');
  const r = 대차대조표읽기(adcb);
  재다('🔴 실측(ADCB): 총자산 833,184', r?.totalAssets === 833184);
  재다('🔴 실측(ADCB): 총부채 743,930', r?.totalLiabilities === 743930);
  재다('🔴 실측(ADCB): 총자본 89,254', r?.totalEquity === 89254);
  재다('🔴 실측(ADCB): 검산 통과(833,184 = 743,930 + 89,254)', r?.reconciled === true);

  /* 검산이 이 자의 심장이다 — 안 맞으면 셋 다 버린다 */
  const 어긋남 = ['Total assets      1,000,000   900,000',
                  'Total liabilities   400,000   350,000',
                  'Total equity         50,000    45,000'].join('\n');
  재다('🔴 자산 ≠ 부채+자본 이면 셋 다 버린다', 대차대조표읽기(어긋남) === null);

  /* 여러 표가 섞여 있어도 «맞는 짝»을 고른다 — 부문 주석 표가 먼저 나오는 실제 꼴 */
  const 섞임 = ['Total assets        161,794   31,190   192,985',      // 부문 주석(합계가 셋째)
                'Total liabilities    66,479   17,622    84,101',
                'Total assets        192,985  186,700',                 // 진짜 재무상태표
                'Total liabilities    84,101   79,024',
                'Total equity        108,884  107,676'].join('\n');
  const s = 대차대조표읽기(섞임);
  재다('🔴 주석 표가 먼저 나와도 검산되는 짝을 고른다', s?.totalAssets === 192985 && s?.totalEquity === 108884);

  /* 안 걸려야 하는 줄 */
  재다('「Total assets under management」는 총자산이 아니다',
    대차대조표읽기('Total assets under management   500,000\nTotal liabilities 1,000\nTotal equity 499,000') === null);
  재다('세 줄 중 하나라도 없으면 null', 대차대조표읽기('Total assets 1,000\nTotal liabilities 400') === null);
  재다('두 자리 수는 규모가 아니라 각주다 → null', 대차대조표읽기('Total assets 12\nTotal liabilities 8\nTotal equity 4') === null);
  재다('빈 글 → null', 대차대조표읽기('') === null);

  /* 🔴 실측(2POINTZERO·ADAVIATION): 「Total liabilities」를 한 줄로 안 적는 회사 */
  const 부채없음 = '\fCONSOLIDATED STATEMENT OF FINANCIAL POSITION\n'
    + 'TOTAL ASSETS   133,668,546   43,011,382\nTotal equity    94,644,578   30,425,313';
  const d = 대차대조표읽기(부채없음);
  재다('🔴 실측(2POINTZERO): 부채 줄이 없으면 자산−자본으로 구한다', d?.totalLiabilities === 39023968);
  재다('🔴 그렇게 구한 부채는 derived 로 «표시»한다', d?.liabilitiesDerived === true && d?.reconciled === false);
  재다('🔴 재무상태표 쪽이 아니면 뺄셈으로 구하지 않는다',
    대차대조표읽기('Segment note\nTotal assets 1,000,000\nTotal equity 400,000') === null);
  재다('🔴 자본이 자산보다 크면 다른 표다 — 안 낸다',
    대차대조표읽기('\fSTATEMENT OF FINANCIAL POSITION\nTotal assets 400,000\nTotal equity 900,000') === null);
  재다('셋을 다 읽은 쪽이 뺄셈보다 «먼저»다', 대차대조표읽기(adcb)?.liabilitiesDerived === false);

  재다('단위힌트: AED’000 을 읽는다', 단위힌트("All amounts in AED’000 unless stated") === "AED'000");
  재다('단위힌트: million 을 읽는다', 단위힌트('Figures in AED million') === 'AED million');
  재다('단위힌트: 없으면 null', 단위힌트('아무 말도 없다') === null);

  const 실패 = 것.filter((x) => !x.됐나);
  console.log(`■ 자가시험 ${것.length - 실패.length}/${것.length}`);
  for (const x of 실패) console.log(`  🔴 ${x.이름}`);
  return 실패.length === 0;
}

if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);
if (!자가시험()) { console.log('🔴 자가시험이 깨졌다 — 돌리지 않는다.'); process.exit(1); }

/* ── 실제 수집 ────────────────────────────────────────────────────────────── */
function PDF글(url, 열쇠) {
  const tmp = path.join(os.tmpdir(), `adx-bs-${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`);
  try {
    execFileSync('curl', ['-sS', '-f', '-o', tmp,
      '-A', UA,
      '-H', 'Referer: https://www.adx.ae/',
      '-H', 'Origin: https://www.adx.ae',
      '-H', 'channel-id: OSS WEB',
      '-H', 'x-correlation-id: uuid',
      '-H', 'x-uuid: ',
      '-H', `adx-gateway-apikey: ${열쇠}`,
      url], { maxBuffer: 1024 * 1024 * 80, stdio: ['ignore', 'pipe', 'pipe'] });
    return execFileSync('pdftotext', ['-table', '-enc', 'UTF-8', tmp, '-'],
      { maxBuffer: 1024 * 1024 * 80, stdio: ['ignore', 'pipe', 'ignore'] }).toString('utf8');
  } finally {
    try { unlinkSync(tmp); } catch { /* 임시파일을 못 지워도 넘어간다 */ }
  }
}

async function main() {
  const 열쇠 = 게이트웨이열쇠();
  const 인자 = process.argv.find((a) => a.startsWith('--종목'));
  const 종목들 = 인자
    ? 인자.split('=')[1].split(',').map((s) => s.trim()).filter(Boolean)
    : readdirSync(재무디렉).filter((f) => f.endsWith('.json') && !f.startsWith('_')).map((f) => f.replace(/\.json$/, ''));

  const 셈 = { 종목: 0, 분기: 0, 채움: 0, 검산실패: 0, 스캔: 0, 못받음: 0 };
  for (const 종목 of 종목들) {
    const 파일 = path.join(재무디렉, `${종목}.json`);
    if (!existsSync(파일)) continue;
    const v = JSON.parse(readFileSync(파일, 'utf8'));
    const 분기들 = v.quarters || [];
    if (!분기들.length) continue;
    셈.종목 += 1;
    let 이종목채움 = 0;
    for (const q of 분기들) {
      if (!q.engPdfUrl) continue;
      셈.분기 += 1;
      try {
        const 글 = PDF글(q.engPdfUrl, 열쇠);
        if (글.replace(/\s/g, '').length < 200) { 셈.스캔 += 1; q.balanceSheetReason = 'scanned-image'; continue; }
        const bs = 대차대조표읽기(글);
        if (!bs) { 셈.검산실패 += 1; q.balanceSheetReason = 'no-reconciling-total-assets-liabilities-equity'; continue; }
        q.totalAssets = bs.totalAssets;
        q.totalLiabilities = bs.totalLiabilities;
        q.totalEquity = bs.totalEquity;
        q.balanceSheetReconciled = bs.reconciled;      /* 셋을 다 읽어 검산까지 된 것만 true */
        q.liabilitiesDerived = bs.liabilitiesDerived;  /* true 면 부채는 «자산−자본»으로 구한 값이다 */
        q.unitHint = 단위힌트(글);
        delete q.balanceSheetReason;
        셈.채움 += 1; 이종목채움 += 1;
      } catch (e) {
        셈.못받음 += 1;
        q.balanceSheetReason = 'pdf-fetch-failed';
      }
    }
    v._meta = v._meta || {};
    v._meta.balanceSheet = {
      addedBy: 'collect-uae-adx-balance-sheet.mjs (5번, 2026-09-14)',
      quartersWithBalanceSheet: 이종목채움,
      quartersTotal: 분기들.length,
      rule: 'Preferred path: all three totals are read from the filing and published only when assets = liabilities + equity within 0.5% (balanceSheetReconciled: true). Fallback: some filers print no single "Total liabilities" line, so liabilities are derived as assets minus equity from the same balance-sheet page (liabilitiesDerived: true, balanceSheetReconciled: false). Figures are in the units printed in the filing (see unitHint); we do not rescale them.',
    };
    await put(`raw/uae-adx-financials/${종목}.json`, JSON.stringify(v, null, 1), 'application/json');
    console.log(`  ${이종목채움 ? '✅' : '–'} ${종목}  분기 ${분기들.length} 중 대차대조표 ${이종목채움}건`);
  }
  console.log(`\n합계 종목 ${셈.종목} · 분기 ${셈.분기} · 대차대조표 채움 ${셈.채움}`
    + ` · 검산 못함 ${셈.검산실패} · 스캔이미지 ${셈.스캔} · 못받음 ${셈.못받음}`);
}

if (pathToFileURL(process.argv[1]).href === import.meta.url) await main();
