#!/usr/bin/env node
/**
 * collect-dubai-dfm-disclosures.mjs — DFM(두바이) 상장사 공시 중 **주가에 영향을 줄 만한
 * 것만** 고른다. ADX·DART·CNINFO 수집기와 같은 방식 — 미국 SEC Form 8-K "중대사건만
 * 신고" 기준으로 무게를 매긴다.
 *
 *   node scripts/collect-dubai-dfm-disclosures.mjs --자가시험
 *   node scripts/collect-dubai-dfm-disclosures.mjs                전 종목(131개사)
 *   node scripts/collect-dubai-dfm-disclosures.mjs --종목 EMAAR,DIB
 *
 * ── 실측 (2026-09-14) — Efsah(공시 포털)가 curl 로 그대로 된다 ────────────────────
 *   GET api2.dfm.ae/efsah/v1/prototype_efsah?symbol=<종목>&take=<N>&skip=0
 *   ⚠ 응답 맨 앞에 BOM(﻿)이 붙어 JSON.parse 가 그냥은 깨진다 — 지우고 파싱한다.
 *   ⚠ `labels=` 파라미터로 유형이 안 걸러진다 — 실측해 보니 전부 announcement_type
 *     "Disclosure" 한 종류로 온다. **제목(headline) 문자열로 직접 가른다.**
 *   인증·API키 필요 없음 — ADX보다도 열려 있다(referer 헤더도 안 봤다).
 *
 * ── 무게표 근거 — 실측한 진짜 headline 2종목(EMAAR·DIB) 표본을 8-K 에 맞대 봤다 ────
 *   Financial statements for … / Press release … financial results   Item 2.02   9 / 8
 *   Management Discussion and Analysis Report                         Item 2.02   7
 *   Results of BOD Meeting                                            내용부전     5
 *   Nominees for Board of Directors membership                        Item 5.02   8 (ceo-change)
 *   Resolutions of General Assembly                                   내용부전     4
 *   Integrated report for the year                                   Item 9.01   4
 *   BOD meeting(안건만)·AGM 초청/의사록·날짜 공지                       절차          1
 *   Earnings Call류(안내·결과)                                         절차형 IR    3
 *   Notification from the company·일반 Press release·마케팅성 제목     낮음         2
 *
 * ── 🔴 [2026-09-14 지침] ceo-change·control-change 태그를 처음부터 넣는다 ─────────
 * 사장님: 「회사 주인이 바뀌거나 CEO/회장이 바뀌는 경우에나 사람이 중요한 거 아닌가」.
 * 한국(collect-dart-breaking.mjs)에는 이미 있고 ADX에는 빠져 있었다(오늘 같이 채운다).
 * 새 나라를 열 때마다 이 두 태그를 넣는다(CLAUDE.md 「주력과 서비스」).
 *
 * ⛔ 이 무게는 8-K 유형에 맞춰 본 사람 규칙이다 — 신호로 안 쓴다(투자AI 판독지침).
 *
 * 🔴 [2026-09-14 · 5번 항목3 대응] "Nominees for Board of Directors membership"을
 * ceo-change 로 합쳤다 — ADX 쪽 규칙(collect-uae-adx-disclosures.mjs)이 이미
 * "list of candidates to board of directors"·"opening of nomination for membership
 * of the board" 를 ceo-change 로 잡고 있는데, DFM 은 같은 내용을 별도 태그
 * (director-nomination)로 갈라 놨었다 — 같은 실질을 거래소마다 다르게 재는 것은
 * 일관성이 아니다. 인위적으로 기준을 낮춘 것이 아니라 두 나라 규칙을 «맞춘» 것이다.
 *
 * 저장: archive/raw/dubai-dfm-breaking/<종목>.json (종목마다 한 파일, 멱등)
 */
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { put } from '../src/lib/store.mjs';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
const WIDGET_URL = 'https://api2.dfm.ae/web/widgets/v1/data';

/** 제목(영문) → {무게, 태그}. 순서가 뜻을 갖는다 — 위에 있는 것이 먼저 매치된다. */
export const 유형 = [
  { re: /^financial statements? for/i, 무게: 9, 태그: 'financial-report' },
  { re: /change of (the )?(chief executive|ceo|chairman|managing director)|resignation of (the )?(ceo|chairman|chief executive|managing director)|appointment of (a |the )?(new )?(ceo|chairman|chief executive|managing director)/i, 무게: 8, 태그: 'ceo-change' },
  { re: /change (of|in) (the )?(major|controlling) shareholder|acquisition .* (resulting in|leading to) .*change of control/i, 무게: 8, 태그: 'control-change' },
  { re: /^press release.*financial results|regarding financial results/i, 무게: 8, 태그: 'earnings-press' },
  { re: /management discussion and analysis/i, 무게: 7, 태그: 'md-and-a' },
  { re: /nominees for board of directors/i, 무게: 8, 태그: 'ceo-change' },
  { re: /results of bod meeting|board of directors.*(resolution|decision)/i, 무게: 5, 태그: 'board-outcome' },
  { re: /resolutions of general assembly/i, 무게: 4, 태그: 'agm-resolution' },
  { re: /integrated report for/i, 무게: 4, 태그: 'integrated-report' },
  { re: /earnings call/i, 무게: 3, 태그: 'earnings-call-event' },
  { re: /^bod meeting$|invitation to the annual general meeting|minutes of the annual general assembly|notice regarding the date/i, 무게: 1, 태그: 'procedural' },
];

/** 제목(영문) → 걸린 유형 하나(가장 위에서 매치된 것) 또는 null. */
export function 유형찾기(제목) {
  const t = String(제목 ?? '').trim();
  if (!t) return null;
  return 유형.find((x) => x.re.test(t)) ?? null;
}

/* ── 자가시험 — 실측한 진짜 headline 문자열로 잰다 ───────────────────────── */
function 자가시험() {
  const 것 = []; const 재다 = (이름, 됐나) => 것.push({ 이름, 됐나 });

  재다('Financial statements for the 2nd QTR → financial-report 무게9',
    유형찾기('Financial statements for the 2nd QTR of 2026')?.태그 === 'financial-report');
  재다('Press release regarding financial results → earnings-press',
    유형찾기('Press release regarding financial results for the 1st QTR of 2026')?.태그 === 'earnings-press');
  재다('DIB Management Discussion and Analysis Report → md-and-a',
    유형찾기('DIB Management Discussion and Analysis Report for the Period Ended June 30, 2026')?.태그 === 'md-and-a');
  재다('🔴 Nominees for Board of Directors membership → ceo-change(ADX와 통일)',
    유형찾기('Nominees for Board of Directors membership')?.태그 === 'ceo-change');
  재다('Results of BOD Meeting → board-outcome', 유형찾기('Results of BOD Meeting')?.태그 === 'board-outcome');
  재다('Resolutions of General Assembly → agm-resolution', 유형찾기('Resolutions of General Assembly')?.태그 === 'agm-resolution');
  재다('Integrated report for the year 2025 → integrated-report', 유형찾기('Integrated report for the year 2025')?.태그 === 'integrated-report');
  재다('Earnings Call → earnings-call-event(낮음)', 유형찾기('Earnings Call')?.무게 === 3);
  재다('Analysts\' Earnings Call → earnings-call-event', 유형찾기("Analysts' Earnings Call")?.태그 === 'earnings-call-event');
  재다('BOD meeting(그냥) → procedural(낮음)', 유형찾기('BOD meeting')?.무게 === 1);
  재다('Invitation to the Annual General Meeting → procedural', 유형찾기('Invitation to the Annual General Meeting and clarifying disclosure regarding approval of proxies')?.태그 === 'procedural');
  재다('🔴 Resignation of the CEO → ceo-change 무게8', 유형찾기('Resignation of the CEO')?.태그 === 'ceo-change');
  재다('🔴 Change of the Chairman → ceo-change', 유형찾기('Change of the Chairman of the Board')?.태그 === 'ceo-change');
  재다('🔴 Change in the major shareholder → control-change', 유형찾기('Change in the major shareholder of the Company')?.태그 === 'control-change');
  재다('⛔ 관계 없는 마케팅성 제목은 null(잡음)', 유형찾기('Emaar Prepares to Unveil Its Most Ambitious Masterplan Ever') === null);
  재다('⛔ 빈 제목은 null', 유형찾기('') === null);
  재다('financial-report이 procedural보다 위(둘 다 매치되면 먼저 잡힘)',
    유형.findIndex((x) => x.태그 === 'financial-report') < 유형.findIndex((x) => x.태그 === 'procedural'));

  const 실패 = 것.filter((x) => !x.됐나);
  console.log(`■ 자가시험 ${것.length - 실패.length}/${것.length}`);
  for (const x of 실패) console.log(`  🔴 ${x.이름}`);
  return 실패.length === 0;
}

if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);
if (!자가시험()) { console.log('🔴 자가시험이 깨졌다 — 돌리지 않는다.'); process.exit(1); }
console.log('');

const 대기 = (ms) => new Promise((r) => setTimeout(r, ms));

async function 종목목록받기() {
  const body = new URLSearchParams({ Command: 'LiteSecuritiesLists', Language: 'en', lang: 'en', securitytype: 'equities' });
  const r = await fetch(WIDGET_URL, { method: 'POST', headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() });
  const rows = await r.json();
  if (!Array.isArray(rows) || !rows.length) throw new Error('LiteSecuritiesLists 가 빈 배열');
  return rows.map((x) => x.SecuritySymbol).filter(Boolean);
}

async function 공시가져오기(종목) {
  const r = await fetch(
    `https://api2.dfm.ae/efsah/v1/prototype_efsah?lang=en&h7_datetime_format=MMM+dd%2C+yyyy+HH%3Amm%3Ass&take=40&skip=0&symbol=${encodeURIComponent(종목)}&cms_resources=true`,
    { headers: { 'User-Agent': UA } },
  );
  const 글자 = (await r.text()).replace(/^﻿/, '');
  const j = JSON.parse(글자);
  return Array.isArray(j.root) ? j.root : [];
}

async function main() {
  const 인자i = process.argv.indexOf('--종목');
  const 종목들 = 인자i !== -1
    ? (process.argv[인자i + 1] ?? '').split(',').map((s) => s.trim()).filter(Boolean)
    : await 종목목록받기();
  if (인자i === -1) console.log(`${종목들.length}개 종목 (DFM 상장 전체)`);

  let 성공 = 0; let 실패 = 0; let 합계높은것 = 0;
  /* 🔴 [2026-09-14 · 항목1] rows.length===0 이 "그 종목엔 공시 자체가 없어서"인지
   * "efsah 를 못 받아서"인지 구분한다 — 못 받으면 여기서 catch 로 빠져 파일이 아예
   * 안 남으므로(아래), 파일이 있는데 total:0 이면 «진짜로 없다»는 뜻임을 명시한다. */
  const 커버리지 = { attempted: 0, withData: 0, empty: 0, emptyReason: {} };
  for (const 종목 of 종목들) {
    커버리지.attempted += 1;
    try {
      const rows = await 공시가져오기(종목);
      const 후보 = rows.map((r) => {
        const t = 유형찾기(r.headline);
        if (!t) return null;
        return { date: r.publication_date, title: r.headline, 무게: t.무게, 태그: t.태그 };
      }).filter(Boolean).sort((a, b) => b.무게 - a.무게);
      const 높은것 = 후보.filter((x) => x.무게 >= 6);
      합계높은것 += 높은것.length;
      const 이유 = rows.length ? null : 'no-disclosures-in-efsah-feed';
      if (rows.length) 커버리지.withData += 1;
      else { 커버리지.empty += 1; 커버리지.emptyReason[이유] = (커버리지.emptyReason[이유] ?? 0) + 1; }

      await put(`raw/dubai-dfm-breaking/${종목}.json`, JSON.stringify({
        _meta: {
          product: 'DFM company disclosures — weighted by likely price impact (heuristic, not a signal)',
          symbol: 종목,
          builtAt: new Date().toISOString(),
          source: 'Dubai Financial Market (DFM) Efsah disclosure feed (api2.dfm.ae) — public, no login',
          total: rows.length,
          highWeight: 높은것.length,
          coverage: { attempted: true, withData: rows.length > 0, empty: rows.length === 0, emptyReason: 이유 },
          notThis: ['Weight is a hand-set heuristic mapped to US SEC Form 8-K — not a trading signal.', 'Not investment advice.'],
        },
        items: 후보,
      }, null, 1), 'application/json');
      console.log(`  ✅ ${종목}  공시 ${rows.length}건 중 무게≥6 ${높은것.length}건`);
      성공 += 1;
      await 대기(150);
    } catch (e) {
      console.error(`  ✕ ${종목}  ${e.message}`);
      실패 += 1;
      커버리지.empty += 1;
      커버리지.emptyReason[`fetch-failed: ${e.message}`] = (커버리지.emptyReason[`fetch-failed: ${e.message}`] ?? 0) + 1;
    }
  }
  await put('raw/dubai-dfm-breaking/_coverage.json', JSON.stringify({
    _meta: { product: 'DFM disclosures collector run coverage — attempted/withData/empty + why', builtAt: new Date().toISOString() },
    ...커버리지,
  }, null, 1), 'application/json');
  console.log(`\n합계 성공 ${성공} · 실패 ${실패} · 무게≥6 합계 ${합계높은것}건 · archive/raw/dubai-dfm-breaking/`);
}

if (pathToFileURL(process.argv[1]).href === import.meta.url) await main();
