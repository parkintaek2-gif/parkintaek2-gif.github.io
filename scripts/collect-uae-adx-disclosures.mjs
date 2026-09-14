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
 *   🔴 [2026-09-14 추가] CEO·회장 변경/사임/선임    Item 5.02 임원 변경              8
 *   🔴 [2026-09-14 추가] 지배권 변경(인수 등)      Item 5.01 지배권 변동            8
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
 * 저장: archive/raw/uae-adx-disclosures/<종목>.json (종목마다 «한 파일» — 다시 돌리면 덮어쓴다)
 * ⚠ 예전엔 파일 이름에 365일 창의 시작~끝 날짜가 들어 있었다 — 하루만 지나도 이름이 바뀌어
 *   «새 파일»이 되고 어제 파일이 안 지워졌다(2026-09-14 실측, 5번이 잡음). 지금은 종목 이름만.
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
  /*
   * 🔴 [2026-09-14 지침] ceo-change·control-change — 사람 축은 「서비스」로 내렸지만
   * (CLAUDE.md 「주력과 서비스」), 「회사 주인·CEO/회장이 바뀌는 경우」는 예외다.
   * 실측(2026-09-13)으로 이 태그가 없어 이·임원 변경이 board-procedural(무게1)·
   * pr-marketing(2) 로 흘러 들어갔을 수 있었다 — 한국(collect-dart-breaking.mjs)에는
   * 이미 있던 것을 여기 채운다.
   */
  /*
   * 🔴 [2026-09-14 · 5번 실측] 처음 쓴 규칙(정확한 문구만)은 실전 제목과 안 맞아 96개사
   * 4,841건 중 ceo-change·control-change 가 합쳐 6건만 잡혔다 — 진짜 이·임원 변경 공시
   * 수백 건이 board-procedural·pr-marketing 잡음에 묻혀 있었다(실제 제목 표본으로 확인:
   * "Resignation and Appointment"·"Board of Directors Appoints … as Chairman"·
   * "List of Candidates to Board of Directors Membership" 등). 제목을 직접 읽고 다시 짰다.
   * ⚠ 넓힌 만큼 오탐도 는다(예: 감사인 사임도 「resignation」에 걸릴 수 있다) — 감지 단계라
   * 받아들인다(투자AI 신호로는 안 쓴다).
   */
  if (/\bresignations?\b|board of directors appoints|appoint(s|ment|ing)?\s+(of\s+)?(a\s+|the\s+)?(new\s+)?(chairman|chief executive|\bceo\b|managing director|director\b)|(list|names?) of (candidates|nominees)\b|nomination(s)?\s+(for|to|closed|period)|opening of (the )?nomination|board of directors.*election|reconstitution of the executive committee|elections?\s*\(board members\)|change of (the )?(chief executive|ceo|chairman|managing director)|appoints?\s+[\w.\s'-]{0,60}\bas\s+(ceo|chairman|chief executive|managing director)\b|\bceo\s+appointment\b|nomination of (an?\s+)?(independent\s+)?board member|appointment of (an?\s+)?independent member|key leadership appointments?\b|appointment of .{0,40}\bto\b.{0,15}\bboard of directors\b/i.test(title)) {
    return { 무게: 8, 태그: 'ceo-change' };
  }
  /*
   * 🔴 [2026-09-14 3차 · 5번 항목3 대응] "acquisition of a majority stake"(명사형)만
   * 잡았더니 실제로 더 흔한 동사형("Acquires Majority Stake in…"·"to Acquire Majority
   * Stake in…"·"signs agreement to acquire a majority stake") 수십 건이 pr-marketing
   * 잡음(무게2)에 그대로 묻혀 있었다(IHC·Multiply Group·Emirates Driving 등 실측).
   * ⛔ 단순 지분 매각/소수지분 인수("Sells 9.77% Stake"·"acquisition of a stake in")는
   * 지배권 변경이 아니므로 여전히 제외 — "majority" 가 있어야 잡는다.
   * 🔴 [2026-09-14 4차] "completes majority acquisition"·"completes the full acquisition"처럼
   * completes 와 acquisition 사이에 낱말이 낀 경우, "100% stake"·"majority acquisition of",
   * 그리고 실제 상장사간 대형 합병("merger of"·"combination of … and …")도 지배권 변경이다.
   */
  if (/acqui(?:re|res|ring|sition)[^.]{0,40}majority stake|majority stak(?:e|eholder)s? in|majority acquisition of|completes?[^.]{0,25}acquisition|full acquisition of|acquire\s+100%|100%\s*stake|increases? (its\s+)?ownership.*to\s*100|change of control of the company|merger of|combination of .+ and /i.test(title)) {
    return { 무게: 8, 태그: 'control-change' };
  }
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
  재다('🔴 공시무게: CEO 사임 → ceo-change 무게8', 공시무게({ disclosureType: '4', title: 'Resignation of the CEO' }).태그 === 'ceo-change');
  재다('🔴 공시무게: 신임 회장 선임 → ceo-change', 공시무게({ disclosureType: '4', title: 'Appointment of a New Chairman' }).태그 === 'ceo-change');
  재다('🔴 공시무게: 지배권 변경 인수 → control-change 무게8', 공시무게({ disclosureType: '4', title: 'Acquisition resulting in change of control of the Company' }).태그 === 'control-change');

  /* 🔴 [2026-09-14] 실제 ADX 제목 표본으로 넓힌 규칙을 검증한다 */
  재다('실측: "Resignation and Appointment" → ceo-change', 공시무게({ disclosureType: '4', title: 'Abu Dhabi National Insurance Company - Resignation and Appointment' }).태그 === 'ceo-change');
  재다('실측: "Board of Directors Appoints … as Chairman" → ceo-change', 공시무게({ disclosureType: '4', title: 'Abu Dhabi Aviation Board of Directors Appoints H.E. Mansour AlMulla as Chairman' }).태그 === 'ceo-change');
  재다('실측: "List of Candidates to Board of Directors Membership" → ceo-change', 공시무게({ disclosureType: '4', title: 'List of Candidates to Board of Directors Membership' }).태그 === 'ceo-change');
  재다('실측: "Opening of Nomination for Membership of the Board" → ceo-change', 공시무게({ disclosureType: '4', title: 'Abu Dhabi Aviation PJSC: Announcement on the Opening of Nomination for Membership of the Board of Directors' }).태그 === 'ceo-change');
  재다('실측: "Reconstitution of The Executive Committee" → ceo-change', 공시무게({ disclosureType: '4', title: 'Reconstitution of The Executive Committee of the Board of Directors of ADNOC Drilling Company PJSC' }).태그 === 'ceo-change');
  재다('실측: "TWO POINT ZERO GROUP - Elections (Board Members)" → ceo-change', 공시무게({ disclosureType: '4', title: 'TWO POINT ZERO GROUP - P.J.S.C Elections (Board Members)' }).태그 === 'ceo-change');
  재다('실측: "completes the acquisition of Traverse Midstream" → control-change', 공시무게({ disclosureType: '4', title: '2PointZero’s ePointZero Enters U.S. Market, Completes Acquisition of Traverse Midstream Partners for USD 2.25 Billion' }).태그 === 'control-change');
  재다('실측: "acquisition of a majority stake in ISEM Packaging" → control-change', 공시무게({ disclosureType: '4', title: 'Notification on acquisition of a majority stake in ISEM Packaging Group.' }).태그 === 'control-change');
  재다('⛔ 오탐 방지: 유동성공급자 선임은 ceo-change 가 아니다', 공시무게({ disclosureType: '4', title: 'Extension of the Appointment of Al Ramz Capital LLC as Liquidity Provider for ADNOC Distribution' }).태그 !== 'ceo-change');

  /* 🔴 [2026-09-14 2차] "resignation" 복수형·이사 후보 공시류를 더 넓혔다 */
  재다('실측: "resignations of two members" (복수형) → ceo-change', 공시무게({ disclosureType: '4', title: 'ESHRAQ INVESTMENTS - Receipt of a letter from Abu Dhabi Financial Group and the resignations of two members of the Board of Directors.' }).태그 === 'ceo-change');
  재다('실측: "List of Nominees for the Board" → ceo-change', 공시무게({ disclosureType: '4', title: 'Agthia Group PJSC - List of Nominees for the Board' }).태그 === 'ceo-change');
  재다('실측: "Nomination Closed for the board members" → ceo-change', 공시무게({ disclosureType: '4', title: 'Agthia Group PJSC Nomination Closed for the board members' }).태그 === 'ceo-change');
  재다('실측: "Names of Candidates for Board of Directors Membership" → ceo-change', 공시무게({ disclosureType: '4', title: 'Disclosure – Names of Candidates for Board of Directors Membership of Eshraq Investments PJSC' }).태그 === 'ceo-change');
  재다('실측: "Appointment of a Director" → ceo-change', 공시무게({ disclosureType: '4', title: 'Appointment of a Director' }).태그 === 'ceo-change');
  재다('⛔ 오탐 방지: 「Board of Directors Report for the Period Ended…」(정기보고)은 ceo-change 가 아니다', 공시무게({ disclosureType: '4', title: 'DANA GAS PJSC Board of Directors Report for the Period Ended June 30,2026' }).태그 !== 'ceo-change');
  재다('⛔ 오탐 방지: 「Results of Board of Directors’ Resolution by Circulation」(정기결의)은 ceo-change 가 아니다', 공시무게({ disclosureType: '4', title: 'ESHRAQ INVESTMENTS P.J.S.C Results of Board of Directors’ Resolution by Circulation on 01/04/2026' }).태그 !== 'ceo-change');

  /* 🔴 [2026-09-14 3차] 지배권변경 — 동사형("Acquires/to Acquire Majority Stake") 실측 보강 */
  재다('실측: "Multiply Group … signs agreement to acquire a majority stake in ISEM" → control-change', 공시무게({ disclosureType: '4', title: 'Multiply Group PJSC signs agreement to acquire a majority stake in ISEM Packaging Group' }).태그 === 'control-change');
  재다('실측: "IHC Acquires Majority Stake in First Women Bank Limited" → control-change', 공시무게({ disclosureType: '4', title: 'IHC Acquires Majority Stake in First Women Bank Limited, Strengthening UAE–Pakistan Economic Partnership' }).태그 === 'control-change');
  재다('실측: "Emirates Driving Announces Intent to Acquire a Majority Stake in Performise Labs" → control-change', 공시무게({ disclosureType: '4', title: 'Emirates Driving Announces Intent to Acquire a Majority Stake in Performise Labs' }).태그 === 'control-change');
  재다('실측: "L’imad Holding … acquires shares of majority stakeholders in Modon Holding" → control-change', 공시무게({ disclosureType: '4', title: 'L’imad Holding Company, acquires shares of majority stakeholders in Modon Holding' }).태그 === 'control-change');
  재다('⛔ 오탐 방지: 소수지분 매각("Sells 9.77% Stake")은 control-change 가 아니다', 공시무게({ disclosureType: '4', title: 'AD Ports Group Sells 9.77% Stake in NMDC for AED 1.6 Billion' }).태그 !== 'control-change');
  재다('⛔ 오탐 방지: "acquisition of a stake in"(과반 언급 없음)은 control-change 가 아니다', 공시무게({ disclosureType: '4', title: 'Notification on acquisition of a stake in Whoop, Inc.' }).태그 !== 'control-change');

  /* 🔴 [2026-09-14 4차] 순서 바뀐 CEO 선임·이사회 멤버 임명·대형 합병 실측 보강 */
  재다('실측: "Board-Approved CEO Appointment"(순서 반대) → ceo-change', 공시무게({ disclosureType: '4', title: 'Burjeel Holdings Announces Board-Approved CEO Appointment' }).태그 === 'ceo-change');
  재다('실측: "Appoints … as CEO" → ceo-change', 공시무게({ disclosureType: '4', title: 'Ooredoo Announces Formation of New International Connectivity Infrastructure Entity and Appoints Khalid Hassan Al-Hamadi as CEO' }).태그 === 'ceo-change');
  재다('실측: "Appointment of [사람] to Board of Directors" → ceo-change', 공시무게({ disclosureType: '4', title: 'Space42 Announces Appointment of Bashar Alrosan to Board of Directors' }).태그 === 'ceo-change');
  재다('실측: "nomination of an independent board member" → ceo-change', 공시무게({ disclosureType: '4', title: 'The Central Bank of the UAE has no objection to the nomination of an independent board member.' }).태그 === 'ceo-change');
  재다('실측: "Appointment of Independent Member"(이사회결의) → ceo-change', 공시무게({ disclosureType: '4', title: 'Board Resolution by Circulation – Appointment of Independent Member' }).태그 === 'ceo-change');
  재다('실측: "Key Leadership Appointments" → ceo-change', 공시무게({ disclosureType: '4', title: '2PointZero Group Announces Key Leadership Appointments to Lead Its Next Phase of Strategic Growth' }).태그 === 'ceo-change');
  재다('⛔ 오탐 방지: 유동성공급자 선임("Appoints QMM as Liquidity Provider")은 ceo-change 가 아니다', 공시무게({ disclosureType: '4', title: 'Abu Dhabi National Company for Building Materials PJSC Appoints QMM as Liquidity Provider on ADX' }).태그 !== 'ceo-change');
  재다('⛔ 오탐 방지: "Appointment of … as Liquidity Provider"도 ceo-change 가 아니다', 공시무게({ disclosureType: '4', title: 'Appointment of BHM Capital Financial Services as Liquidity Provider for ANAN' }).태그 !== 'ceo-change');
  재다('⛔ 오탐 방지: "Appoints … as Liquidity Provider"(as 뒤가 CEO/Chairman 아님)도 제외', 공시무게({ disclosureType: '4', title: 'Investcorp S.A. Appoints Al Ramz Capital LLC as Liquidity Provider for Investcorp Capital plc Shares' }).태그 !== 'ceo-change');

  재다('실측: "completes majority acquisition in ISEM"(사이 낱말 낌) → control-change', 공시무게({ disclosureType: '4', title: '2PointZero Group completes majority acquisition in Italy-based ISEM Packaging Group' }).태그 === 'control-change');
  재다('실측: "completes the full acquisition of"(사이 낱말 낌) → control-change', 공시무게({ disclosureType: '4', title: 'PTCL Group completes the full acquisition of Telenor Pakistan' }).태그 === 'control-change');
  재다('실측: "acquire 100% stake of"→ control-change', 공시무게({ disclosureType: '4', title: 'O2 Slovakia signs an agreement to acquire 100% stake of UPC Slovakia from Liberty Global' }).태그 === 'control-change');
  재다('실측: "Majority Acquisition of"(명사구 반대순서) → control-change', 공시무게({ disclosureType: '4', title: 'IHC Strengthens Digital Services Portfolio with Majority Acquisition of Peko Holdings' }).태그 === 'control-change');
  재다('실측: "combination of Borouge … and Borealis …"(합병) → control-change', 공시무게({ disclosureType: '4', title: 'Statement on completion of the combination of Borouge PLC (Borouge) and Borealis GmbH (Borealis)' }).태그 === 'control-change');
  재다('실측: "Merger of 2PointZero, Multiply Group, and Ghitha Holding" → control-change', 공시무게({ disclosureType: '4', title: 'IHC Plans Strategic AED 120 Billion Merger of 2PointZero, Multiply Group, and Ghitha Holding to Create a Next Generation Listed Investment Powerhouse' }).태그 === 'control-change');
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

/** 🔴 [2026-09-14] 표본 7개사 → ADX 상장 «전부»로 넓힌다(collect-uae-adx-people.mjs 와 같은 우물). */
async function 종목목록받기() {
  const j = curlJson(`${GATEWAY}/marketwatch-delayed/1.1/scrollingTicker`);
  const rows = j?.response?.results;
  if (!Array.isArray(rows) || !rows.length) throw new Error('scrollingTicker 가 빈 배열');
  return rows.map((r) => r.companySymbol).filter(Boolean);
}

async function main() {
  const 인자 = process.argv.find((a) => a.startsWith('--종목'));
  let 종목들;
  if (인자) {
    종목들 = 인자.split('=')[1].split(',').map((s) => s.trim()).filter(Boolean);
  } else if (process.argv.includes('--표본')) {
    종목들 = 기본종목;
  } else {
    console.log('종목 목록을 받는다 — scrollingTicker');
    종목들 = await 종목목록받기();
    console.log(`${종목들.length}개 종목 (ADX 메인마켓 전부 — 채권·ETF 섞여 있다)`);
  }

  const 끝 = new Date();
  const 시작 = new Date(끝); 시작.setDate(시작.getDate() - 364);
  const fromDate = 미국식날짜(시작); const toDate = 미국식날짜(끝);

  let 성공 = 0; let 실패 = 0;
  const 커버리지 = { attempted: 0, withData: 0, empty: 0, emptyReason: {} };
  for (const 종목 of 종목들) {
    커버리지.attempted += 1;
    try {
      const j = curlJson(`${GATEWAY}/tradings/1.1/news/category?categoryName=cdc&symbol=${종목}&fromDate=${fromDate}&toDate=${toDate}`);
      const rows = j?.response?.results ?? [];
      const 추린것 = 공시추리기(rows);
      const 높은것 = 추린것.filter((x) => x.무게 >= 5);

      /*
       * 🔴🔴 [2026-09-14 · 5번 감수로 발견] 파일 이름에 «오늘 기준 365일 창»의 시작~끝 날짜를
       * 넣었더니, 하루만 지나도 창이 하루씩 밀려 «새 파일»이 된다 — 어제 파일이 안 지워지고
       * 그대로 남는다. 그래서 ALDAR 하나에만 어제 것 + 오늘 것 두 파일이 쌓여 있었고, 그걸
       * 세는 쪽(digest 빌더 등)이 «같은 공시를 두 번» 세고 있었다(5번이 잡은 5,139 vs 5,778
       * 불일치의 진짜 원인 중 하나). ⇒ 파일 이름에서 날짜를 뺀다 — 종목 하나에 «파일 하나»,
       * 다시 돌리면 진짜로 덮어쓴다(ADX 사람 수집기 collect-uae-adx-people.mjs 와 같은 규칙).
       */
      const 결과 = await put(`raw/uae-adx-disclosures/${종목}.json`, JSON.stringify({
        _meta: {
          product: 'ADX company disclosures — weighted by likely price impact (heuristic, not a signal)',
          symbol: 종목,
          builtAt: new Date().toISOString(),
          source: 'ADX company news/disclosure feed (public, no login)',
          period: { fromDate, toDate },
          total: rows.length,
          highWeight: 높은것.length,
          /* 🔴 [2026-09-14 · 항목1] DFM 수집기와 같은 꼴 — attempted 는 항상 true(curl 이 던지면
           * catch 로 빠져 파일 자체가 안 남는다 = "못 받았다"). empty 는 rows.length===0 일 때뿐 —
           * ADX 는 실측(2026-09-14, 5번) 96개사 전부 내용이 있어 거의 없다. */
          coverage: { attempted: true, withData: rows.length > 0, empty: rows.length === 0, emptyReason: rows.length ? null : 'no-disclosures-in-feed-window' },
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
      if (rows.length) 커버리지.withData += 1;
      else { 커버리지.empty += 1; 커버리지.emptyReason['no-disclosures-in-feed-window'] = (커버리지.emptyReason['no-disclosures-in-feed-window'] ?? 0) + 1; }
    } catch (e) {
      console.error(`  ✕ ${종목}  ${e.message}`);
      실패 += 1;
      커버리지.empty += 1;
      커버리지.emptyReason[`fetch-failed: ${e.message}`] = (커버리지.emptyReason[`fetch-failed: ${e.message}`] ?? 0) + 1;
    }
    await 대기(300);
  }
  await put('raw/uae-adx-disclosures/_coverage.json', JSON.stringify({
    _meta: { product: 'ADX disclosures collector run coverage — attempted/withData/empty + why', builtAt: new Date().toISOString() },
    ...커버리지,
  }, null, 1), 'application/json');
  console.log(`\n합계 성공 ${성공} · 실패 ${실패} · 커버리지: 시도 ${커버리지.attempted} · 데이터있음 ${커버리지.withData} · 빔 ${커버리지.empty} · archive/raw/uae-adx-disclosures/`);
}

if (pathToFileURL(process.argv[1]).href === import.meta.url) await main();
