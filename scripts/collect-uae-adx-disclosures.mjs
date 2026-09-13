#!/usr/bin/env node
/**
 * collect-uae-adx-disclosures.mjs — ADX 상장사 공시 중 **주가에 영향을 줄 만한 것만** 고른다.
 * 한국 DART 쪽 `collect-dart-breaking.mjs`(무게·태그 표)와 같은 자리 — 미국의 Form 8-K
 * "중대사건"(material event)만 신고하게 하는 방식과 같은 생각이다(사장님 지시 2026-09-13:
 * 「공시에선 중요한 게 뭔지부터 조사해」→「거기서 주가에 영향을 주는 걸 찾아」→
 *  「그게 중요한 거야, 그거만 수집하라고, US에서는」).
 *
 *   node scripts/collect-uae-adx-disclosures.mjs --자가시험
 *   node scripts/collect-uae-adx-disclosures.mjs --종목 ALDAR,ADIB,FAB   (없으면 기본 표본)
 *
 * ── 실측으로 찾은 진짜 공시 API (2026-09-13) ────────────────────────────────
 *   apigateway.adx.ae/adx/tradings/1.1/news/category
 *     ?categoryName=cdc&symbol=<종목>&fromDate=MM/DD/YYYY&toDate=MM/DD/YYYY
 *   ⚠ 기간이 365일을 넘으면 거부한다("Date range should not exceed 365 days") — 1년씩 나눠 받는다.
 *   ADX 가 이미 **영문 AI 요약**(aiShortSummaryEn/aiLongSummaryEn)을 붙여 준다 — 번역이 아니라
 *   거래소 공식 공시의 부속 자료라 그대로 인용 가능(사실 재서술, 우리 표현은 따로 짠다).
 *
 * ── 실측한 분류(ALDAR 1년치 78건)와 무게를 매긴 근거 ─────────────────────────
 *   disclosureType 1 "Financial Reports"(실적·실적보도자료·통합보고서)   4+4+2건  ← 늘 중요, 최상위
 *   제목에 "Change in ... Shareholding"                                1건  ← 지분 변동, 한국 대량보유 공시와 같다
 *   disclosureType 5 "Board Meeting" 중 "Results/ Outcome"             5건  ← 이사회 «결과» — 배당·자사주 등이
 *                                                                            섞여 나올 수 있어 중간 이상으로 둔다
 *   제목에 AED 금액(수억~수십억)이 박힌 "General Disclosure"             다수  ← 분양 매출·계약 규모 — 한국의
 *                                                                            단일판매공급계약 공시와 같은 자리
 *   disclosureType 5 의 "Announcement/ Agenda"·"Postpone meeting"       6건  ← 절차 안내, 내용 없음 — 낮음
 *   disclosureType 3 "Assembly Meeting ... Invitation"                 2건  ← 정기총회 초청장 — 낮음
 *   disclosureType 2 "ADX Disclosures / Other"                         8건  ← 거래소 자체 공지. 안에 거래정지·
 *                                                                            정정처럼 큰 것도 섞일 수 있어 확신
 *                                                                            없음 — 중간으로 두고 사람이 읽는다
 *   금액·지분 언급 없는 순수 홍보성 "General Disclosure"(신규 분양 런칭 등)  다수  ← 낮음(잡음에 가깝다)
 *
 * ── 근거 — 짐작이 아니라 «미국 SEC Form 8-K」의 중대사건 33종에 맞춰 봤다 ────────────
 * 사장님 지시(2026-09-13): 「주요 공시라고 분류해 서비스하는 금융 사이트를 찾아봐」→
 * 미국은 «전부 다» 공시하게 하지 않는다 — **8-K 로 정한 33개 사건 유형에 걸릴 때만** 4영업일
 * 안에 신고를 의무화한다(SEC 규정). 그 유형 중 이 회사가 실제로 쓰는 것과 ADX 분류를 맞대 봤다.
 *
 *   ADX 분류(실측)                              가장 가까운 8-K Item          우리 무게
 *   Financial Reports(실적·보도자료·통합보고서)    Item 2.02 실적/재무상태 결과       9
 *   "Change in ... Shareholding"                Item 5.01 지배권 변동            8
 *   Board Meeting "Results/ Outcome"             Item 1.01/5.02 등(내용에 따라 갈림) 6
 *   AED 거액이 박힌 General Disclosure           Item 2.01/7.01(자산처분·자율공시)  5
 *   ADX 자체 공지(disclosureType=2)              대응 항목 불명 — 확신 없음        5
 *   Board Meeting 절차(Agenda·Postpone)          8-K 대상 아님(절차일 뿐)         1
 *   AGM/GAM 초청장                               8-K 대상 아님                    1
 *   금액·지분 없는 순수 홍보(신규 분양 런칭 등)      8-K 대상 아님                    2
 *
 * ⛔ 이 무게는 **8-K 유형에 «맞춰 본»** 규칙이지 ADX 가 스스로 매긴 등급이 아니다 — ADX 는
 *   disclosureType 을 4단계로만 나눌 뿐 "이게 주가에 영향 크다"는 표시를 따로 안 준다.
 *   그래서 실제로 신호는 못 만든다(투자AI 판독지침: 근거·sourceId 없이 신호화 금지). 감지까지만 한다.
 * 🔴 apigateway.adx.ae 는 node fetch 에 403 — curl 로 받는다(CBUAE·board-members 와 같은 벽).
 *
 * 저장: archive/raw/uae-adx-disclosures/<종목>-<시작~끝>.json (멱등 — 다시 돌리면 덮어쓴다)
 */
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { put } from '../src/lib/store.mjs';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36';
const APIKEY = '1863a94c-582b-46f9-b4f0-0d02c0cc5307';
const GATEWAY = 'https://apigateway.adx.ae/adx';
const 기본종목 = ['ALDAR', 'ADIB', 'FAB', 'ADNOCGAS', 'IHC', 'ADCB', 'EAND'];

function 헤더인자() {
  return [
    '-A', UA,
    '-H', 'Accept: application/json',
    '-H', 'Referer: https://www.adx.ae/',
    '-H', 'Origin: https://www.adx.ae',
    '-H', 'channel-id: OSS WEB',
    '-H', 'x-correlation-id: uuid',
    '-H', 'x-uuid: ',
    '-H', `adx-gateway-apikey: ${APIKEY}`,
  ];
}
function curlJson(url) {
  const 글자 = execFileSync('curl', ['-sS', '-f', ...헤더인자(), url], { maxBuffer: 1024 * 1024 * 20 }).toString('utf8');
  return JSON.parse(글자);
}

/** Date → "MM/DD/YYYY" (이 API 가 요구하는 꼴) */
export function 미국식날짜(d) {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}/${dd}/${d.getFullYear()}`;
}

/**
 * 공시 한 건 → «무게»(클수록 주가에 영향 클 가능성) + «태그».
 * DART 쪽 유형표와 같은 생각 — disclosureType·subCategory 먼저 보고, 「General Disclosure」
 * 안에서는 제목의 숫자(AED 금액·지분율)로 다시 가른다(제목만으로 다 못 가르는 것은 인정한다).
 */
export function 공시무게(항목) {
  const sub = String(항목?.engSubCategoryName ?? '');
  const title = String(항목?.title ?? '');
  const dt = String(항목?.disclosureType ?? '');

  if (dt === '1') return { 무게: 9, 태그: 'financial-report' }; // 실적·실적보도자료·통합보고서
  if (/change in .*shareholding|substantial shareholding|major shareholding/i.test(title)) {
    return { 무게: 8, 태그: 'ownership-change' };
  }
  if (dt === '5' && /results|outcome/i.test(sub)) return { 무게: 6, 태그: 'board-outcome' };
  if (dt === '2') return { 무게: 5, 태그: 'exchange-notice' }; // 확신 없음 — 사람이 읽는다(주석 참고)
  if (/AED\s*[\d.,]+\s*(billion|bn|million|mn)/i.test(title)) return { 무게: 5, 태그: 'large-value-announcement' };
  if (dt === '5') return { 무게: 1, 태그: 'board-procedural' }; // Agenda·Postpone
  if (dt === '3') return { 무게: 1, 태그: 'agm-procedural' };
  return { 무게: 2, 태그: 'pr-marketing' }; // 금액·지분 언급 없는 순수 홍보
}

/** 원본 배열 → 무게 매겨 중요한 칸만 남기고 무게순 정렬 */
export function 공시추리기(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map((r) => {
    const { 무게, 태그 } = 공시무게(r);
    return {
      date: r.publishedDate ?? null,
      title: r.title ?? null,
      aiSummary: r.aiShortSummaryEn ?? null,
      subCategory: r.engSubCategoryName ?? null,
      disclosureType: r.disclosureType ?? null,
      무게, 태그,
    };
  }).sort((a, b) => b.무게 - a.무게);
}

/* ── 자가시험 ───────────────────────────────────────────────────────── */
function 자가시험() {
  const 것 = []; const 재다 = (이름, 됐나) => 것.push({ 이름, 됐나 });

  재다('미국식날짜: 2026-09-13', 미국식날짜(new Date(2026, 8, 13)) === '09/13/2026');

  재다('공시무게: 실적(disclosureType=1) → 무게 9', 공시무게({ disclosureType: '1', title: 'x', engSubCategoryName: 'Financial Report' }).무게 === 9);
  재다('공시무게: 대주주지분 변동 제목 → 무게 8', 공시무게({ disclosureType: '4', title: 'Market Disclosure – Change in Major Shareholding' }).태그 === 'ownership-change');
  재다('공시무게: 이사회 결과(Results/Outcome) → 무게 6', 공시무게({ disclosureType: '5', engSubCategoryName: 'Board Meeting | Results/ Outcome', title: 'x' }).무게 === 6);
  재다('공시무게: 이사회 절차(Agenda) → 무게 1(잡음에 가깝다)', 공시무게({ disclosureType: '5', engSubCategoryName: 'Board Meeting | Announcement/ Agenda', title: 'x' }).무게 === 1);
  재다('공시무게: 총회 초청장(disclosureType=3) → 무게 1', 공시무게({ disclosureType: '3', title: 'AGM Invitation' }).무게 === 1);
  재다('공시무게: 제목에 AED 거액 → 무게 5', 공시무게({ disclosureType: '4', title: 'ALDAR GENERATES AED 1.5 BILLION IN SALES' }).태그 === 'large-value-announcement');
  재다('⛔ 공시무게: 금액도 지분도 없는 순수 홍보 → 무게 2(낮게)', 공시무게({ disclosureType: '4', title: 'ALDAR UNVEILS NEW COMMUNITY PARK' }).무게 === 2);
  재다('공시무게: 거래소 자체공지(disclosureType=2) → 무게 5(확신 없어 중간)', 공시무게({ disclosureType: '2', title: 'x' }).무게 === 5);

  const 가짜목록 = [
    { publishedDate: '2026-07-29', title: 'Aldar Financial Results', disclosureType: '1', engSubCategoryName: 'Financial Reports | Financial Report' },
    { publishedDate: '2026-07-21', title: 'ALDAR LAUNCHES THE CANOPIES', disclosureType: '4', engSubCategoryName: 'General Disclosure | Announcements' },
    { publishedDate: '2026-07-23', title: 'Board Meeting Agenda', disclosureType: '5', engSubCategoryName: 'Board Meeting | Announcement/ Agenda' },
  ];
  const 추린것 = 공시추리기(가짜목록);
  재다('공시추리기: 3건 다 남고 무게순 정렬(재무가 먼저)', 추린것.length === 3 && 추린것[0].태그 === 'financial-report');
  재다('공시추리기: 절차성 공시가 맨 뒤로 간다', 추린것[2].태그 === 'board-procedural');

  const 실패 = 것.filter((x) => !x.됐나);
  console.log(`■ 자가시험 ${것.length - 실패.length}/${것.length}`);
  for (const x of 실패) console.log(`  🔴 ${x.이름}`);
  return 실패.length === 0;
}

/* ── 돌리기 ─────────────────────────────────────────────────────────── */
if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);
if (!자가시험()) { console.log('🔴 자가시험이 깨졌다 — 돌리지 않는다.'); process.exit(1); }
console.log('');

const 대기 = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const 인자 = process.argv.find((a) => a.startsWith('--종목'));
  const 종목들 = 인자 ? 인자.split('=')[1].split(',').map((s) => s.trim()).filter(Boolean) : 기본종목;

  const 끝 = new Date();
  const 시작 = new Date(끝); 시작.setDate(시작.getDate() - 364);
  const fromDate = 미국식날짜(시작); const toDate = 미국식날짜(끝);

  let 성공 = 0; let 실패 = 0;
  for (const 종목 of 종목들) {
    try {
      const j = curlJson(`${GATEWAY}/tradings/1.1/news/category?categoryName=cdc&symbol=${종목}&fromDate=${fromDate}&toDate=${toDate}`);
      const rows = j?.response?.results ?? [];
      const 추린것 = 공시추리기(rows);
      const 높은것 = 추린것.filter((x) => x.무게 >= 5);

      const 결과 = await put(`raw/uae-adx-disclosures/${종목}-${fromDate.replace(/\//g, '')}~${toDate.replace(/\//g, '')}.json`, JSON.stringify({
        _meta: {
          product: 'ADX company disclosures — weighted by likely price impact (heuristic, not a signal)',
          symbol: 종목,
          builtAt: new Date().toISOString(),
          source: 'ADX company news/disclosure feed (public, no login)',
          period: { fromDate, toDate },
          total: rows.length,
          highWeight: 높은것.length,
          notThis: [
            'Weight is a hand-set heuristic (see header comment) — not a trading signal.',
            'Not investment advice.',
            'aiSummary 는 ADX 자체 AI 요약(거래소 부속 자료) — 우리가 새로 지어낸 문장이 아니다.',
          ],
        },
        items: 추린것,
      }, null, 1), 'application/json');
      console.log(`  ✅ ${종목}  공시 ${rows.length}건 중 무게≥5 ${높은것.length}건 → ${결과.local}`);
      if (높은것.length) {
        for (const h of 높은것.slice(0, 5)) console.log(`       [${h.무게}] ${h.태그} · ${h.date} · ${h.title}`);
      }
      성공 += 1;
    } catch (e) {
      console.error(`  ✕ ${종목}  ${e.message}`);
      실패 += 1;
    }
    await 대기(300);
  }
  console.log(`\n합계 성공 ${성공} · 실패 ${실패} · archive/raw/uae-adx-disclosures/`);
}

if (pathToFileURL(process.argv[1]).href === import.meta.url) await main();
