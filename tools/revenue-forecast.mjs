#!/usr/bin/env node
/**
 * revenue-forecast.mjs — 세 사업의 매출 계획을 계산한다.
 * ─────────────────────────────────────────────────────────────────────────
 * SeoulMarkets(금융) · WikiTip(한류) · 교육 라이프맵
 *
 * [왜 도구로 만드나]
 * 문서에 손으로 적으면 가정이 바뀌는 순간 조용히 틀려진다. 실제로 그랬다 —
 * 사업전략 §5.5 가 같은 문서 안에서 「15억」과 「150억」을 동시에 적었다(10배 오류).
 *
 * [2026-08-02 3차 개정]
 * 사장님 지시: 「위키팁과 교육비즈니스를 포함한 비즈니스 계획. **실제로 현실화할 수
 * 있는 수준으로.** 반드시 매출이 들어간다. **비용은 거의 없으니 반영하지 않는다.**
 * 이 세 개를 통틀어 연매출 500억을 3년 안에 만드는 게 가능한지 검토 후,
 * 가능하면 로드맵, 어려우면 이유와 보강 대안을 제시.」
 *
 * → 비용 계산을 뺐다. 대신 **시나리오를 둘로 나눴다.**
 *   기본(현실)  각 항목을 「신생 1인 회사가 3년에 실제로 닿는 값」으로 잡는다
 *   500억 역산  같은 구조에서 500억이 되려면 무엇이 얼마여야 하는지
 *
 * [무엇이 사실이고 무엇이 가정인가]
 *   사실 = 단가 구조(pricing.json) · 인력 1명 · 자금 0원 · 오늘 매출 0원
 *   가정 = 그 밖 전부. ASSUMPTIONS 한 곳에 모았다
 *
 * 사용
 *   node tools/revenue-forecast.mjs           표 출력
 *   node tools/revenue-forecast.mjs --json    원본값
 *   node tools/revenue-forecast.mjs --write   계획서에 써 넣는다
 */

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DOC = path.join(HERE, '..', 'docs/매출계획-2026-2029.md');
const P = JSON.parse(readFileSync(path.join(HERE, 'pricing.json'), 'utf8'));

const 억 = 1e8;
const 조 = 1e12;

/** 광고 단가는 매체 성격에 따라 다르다. 뭉치면 어느 쪽 트래픽인지 알 수 없게 된다. */
const RPM = {
  금융: 25_000, // 영문 금융 · 미국 독자. 금융은 광고 단가가 높다
  한류: 6_000, // 동남아. 규모는 크고 단가는 낮다 (디스플레이 4,000 / 직접 15,000 혼합)
};

/* ── 기본 시나리오 — 「실제로 닿는 값」 ────────────────────────────────
 *
 * 앞 판은 2029년 AUM 12조를 가정했다. **그건 현실이 아니다.**
 * 국내 신생 운용사가 1조를 넘기는 데 보통 5년 이상 걸린다. 1인·무자본이면 더 걸린다.
 * 사장님이 「실제로 현실화할 수 있는 수준으로」라고 하셨으므로 전부 내려 잡았다.
 */
const ASSUMPTIONS = {
  2026: {
    라벨: '2026 (8~12월)', 개월: 5,
    sm: { 운용AUM: 0, 지수AUM: 0, 리셀러: 0, 리셀러당억: 0, devA: 0, bizA: 0, 월PV: 30_000, 매매수익억: 0 },
    wt: { 월PV: 0, 커머스억: 0 },
    edu: { 유료구독자: 0, 리포트건_월: 0 },
    사건: '아카이브 · 색인 · 애드센스 · **모의매매 개시** · WikiTip 영문 발행 착수',
  },
  2027: {
    라벨: '2027', 개월: 12,
    sm: { 운용AUM: 0, 지수AUM: 0.15 * 조, 리셀러: 1, 리셀러당억: 1, devA: 100, bizA: 3, 월PV: 400_000, 매매수익억: 0.3 },
    wt: { 월PV: 2_500_000, 커머스억: 1 },
    edu: { 유료구독자: 800, 리포트건_월: 150 },
    사건: '**지수 공개 · 첫 ETF 상장** · 자기자금 소액 실거래 · **교육 무료도구 공개**',
  },
  2028: {
    라벨: '2028', 개월: 12,
    sm: { 운용AUM: 0.1 * 조, 지수AUM: 0.5 * 조, 리셀러: 2, 리셀러당억: 2.5, devA: 250, bizA: 10, 월PV: 900_000, 매매수익억: 1.5 },
    wt: { 월PV: 7_000_000, 커머스억: 4 },
    edu: { 유료구독자: 4_000, 리포트건_월: 800 },
    사건: '**일본 適格投資家向け 등록 · 직접 운용 개시(AUM 1,000억)** · 교육 유료화',
  },
  2029: {
    라벨: '2029', 개월: 12,
    sm: { 운용AUM: 0.5 * 조, 지수AUM: 1.5 * 조, 리셀러: 3, 리셀러당억: 4, devA: 500, bizA: 20, 월PV: 1_800_000, 매매수익억: 4 },
    wt: { 월PV: 14_000_000, 커머스억: 10 },
    edu: { 유료구독자: 12_000, 리포트건_월: 2_500 },
    사건: '**직접 운용 AUM 5,000억** · 지수 추종 1.5조 · WikiTip 4개 언어 · 교육 유료 1.2만',
  },
};

const TARGET = 500 * 억;

/* ── 계산 ────────────────────────────────────────────────────────────── */

function year(a) {
  const { sm, wt, edu, 개월 } = a;
  const m = 개월 / 12;

  // SeoulMarkets — 금융
  const 운용보수 = sm.운용AUM * P.fund.총보수 * m;
  const 지수료 = sm.지수AUM * P.index.요율 * m;
  const 재판매 = sm.리셀러 * sm.리셀러당억 * 억;
  const 셀프서브 = sm.devA * P.api.dev.월요금 * 개월 + sm.bizA * P.api.business.연요금;
  const sm광고 = (sm.월PV / 1000) * RPM.금융 * 개월;
  const 매매 = sm.매매수익억 * 억;
  const SM = 운용보수 + 지수료 + 재판매 + 셀프서브 + sm광고 + 매매;

  // WikiTip — 한류
  const wt광고 = (wt.월PV / 1000) * RPM.한류 * 개월;
  const 커머스 = wt.커머스억 * 억;
  const WT = wt광고 + 커머스;

  // 교육 라이프맵
  const 구독 = edu.유료구독자 * P.edu.구독월 * 개월;
  const 리포트 = edu.리포트건_월 * P.edu.리포트단건 * 개월;
  const EDU = 구독 + 리포트;

  return { 운용보수, 지수료, 재판매, 셀프서브, sm광고, 매매, SM, wt광고, 커머스, WT, 구독, 리포트, EDU, total: SM + WT + EDU };
}

const rows = Object.entries(ASSUMPTIONS).map(([y, a]) => ({ y, a, r: year(a) }));
const last = rows.at(-1);
const gap = TARGET - last.r.total;
const 억표 = (n) => (n / 억).toFixed(Math.abs(n) < 억 ? 2 : 1);

/* ── 500억 역산 — 같은 구조에서 무엇이 얼마여야 하나 ─────────────────── */
function 역산() {
  const 비운용 = last.r.total - last.r.운용보수; // 운용 말고 나머지가 그대로라면
  const 필요운용매출 = TARGET - 비운용;
  const 필요AUM = 필요운용매출 / P.fund.총보수;
  return { 비운용, 필요운용매출, 필요AUM };
}
const R = 역산();

/* ── 출력 ────────────────────────────────────────────────────────────── */

function markdown() {
  const L = [];
  L.push(
    '> 이 표는 `tools/revenue-forecast.mjs` 가 계산해 써 넣은 것이다. **손으로 고치지 마십시오** —',
    '> 다음 실행에 덮인다. 숫자를 바꾸려면 그 파일의 `ASSUMPTIONS` 를 고쳐 다시 돌린다.',
    '',
    '**전제: 인력 1명 · 자금 0원 · 채용 없음.** 사장님 지시로 **비용은 계산하지 않는다**(거의 없다).',
    '',
    '### 세 사업이 하는 일이 다르다',
    '',
    '| | SeoulMarkets | WikiTip | 교육 라이프맵 |',
    '|---|---|---|---|',
    '| 파는 것 | 지수·운용·데이터 | 광고·커머스 | 구독·리포트 |',
    '| 사는 사람 | 기관 | 광고주 | 학부모 |',
    `| 광고 단가(1,000PV) | ${RPM.금융.toLocaleString()}원 | ${RPM.한류.toLocaleString()}원 | — |`,
    '| 성장 동력 | **AUM** | 트래픽·언어 | 무료 사용자 → 전환 |',
    '',
    '단위: 억원',
    '',
    '| 연도 | 운용보수 | 지수료 | 재판매 | 셀프서브 | SM광고 | 매매 | **SM** | WT광고 | 커머스 | **WT** | 구독 | 리포트 | **교육** | **합계** |',
    '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|',
  );
  for (const { a, r } of rows) {
    L.push(
      `| **${a.라벨}** | ${억표(r.운용보수)} | ${억표(r.지수료)} | ${억표(r.재판매)} | ${억표(r.셀프서브)} | ${억표(r.sm광고)} | ${억표(r.매매)} | **${억표(r.SM)}** | ${억표(r.wt광고)} | ${억표(r.커머스)} | **${억표(r.WT)}** | ${억표(r.구독)} | ${억표(r.리포트)} | **${억표(r.EDU)}** | **${억표(r.total)}** |`,
    );
  }
  L.push(
    '',
    '| 연도 | 그 해에 일어나야 하는 일 |',
    '|---|---|',
    ...rows.map(({ a }) => `| ${a.라벨} | ${a.사건} |`),
    '',
    '### 사업별 몫 (2029년)',
    '',
    '| | 억원 | 비중 |',
    '|---|---:|---:|',
    `| SeoulMarkets | ${억표(last.r.SM)} | ${((last.r.SM / last.r.total) * 100).toFixed(0)}% |`,
    `| WikiTip | ${억표(last.r.WT)} | ${((last.r.WT / last.r.total) * 100).toFixed(0)}% |`,
    `| 교육 라이프맵 | ${억표(last.r.EDU)} | ${((last.r.EDU / last.r.total) * 100).toFixed(0)}% |`,
    `| **합계** | **${억표(last.r.total)}** | |`,
    '',
    '---',
    '',
    '## 500억은 3년에 되는가 — **안 된다**',
    '',
    '| | 억원 |',
    '|---|---:|',
    '| 목표 (2029년) | **500.0** |',
    `| 현실적 가정으로 계산된 값 | **${억표(last.r.total)}** |`,
    `| **부족** | **${억표(gap)}** |`,
    '',
    `**${(TARGET / last.r.total).toFixed(1)}배가 모자란다.** 항목을 조금 올려서 메울 수 있는 차이가 아니다.`,
    '',
    '### 왜 안 되는가 — 병목은 하나다',
    '',
    '광고·커머스·구독은 **단가가 정해져 있어 규모로만 는다.** 3년에 몇 배는 가능해도',
    '수십 배는 안 된다. 반면 **운용보수는 AUM 에 비례해 상한이 없다.**',
    '그래서 500억의 경로는 운용 하나뿐인데, **거기가 막힌다.**',
    '',
    '| | 억원 |',
    '|---|---:|',
    `| 운용 말고 나머지 (2029년) | ${억표(R.비운용)} |`,
    `| 500억이 되려면 운용에서 | **${억표(R.필요운용매출)}** |`,
    `| 그 매출에 필요한 AUM (총보수 ${(P.fund.총보수 * 100).toFixed(2)}%) | **${(R.필요AUM / 조).toFixed(1)}조원** |`,
    `| 현실적 가정의 2029년 AUM | ${(last.a.sm.운용AUM / 조).toFixed(2)}조원 |`,
    '',
    `**3년 만에 AUM ${(R.필요AUM / 조).toFixed(1)}조는 신생 1인 운용사가 도달할 수 있는 숫자가 아니다.**`,
    '국내 신생 운용사가 1조를 넘기는 데 보통 5년 이상 걸린다.',
    '그리고 일본 適格投資家向け 는 **운용재산 200억엔(약 1,900억원) 상한**이 있어',
    '그 위로 가려면 통상 投資運用業 으로 다시 등록해야 한다. 그 자체가 1~2년이다.',
    '',
  );
  return L.join('\n');
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ rows: rows.map((x) => ({ 연도: x.y, ...x.r })), 목표: TARGET, 부족: gap, 역산: R }, null, 2));
} else if (process.argv.includes('--write')) {
  const doc = readFileSync(DOC, 'utf8');
  const A = '<!-- FORECAST:START -->';
  const B = '<!-- FORECAST:END -->';
  const i = doc.indexOf(A);
  const j = doc.indexOf(B);
  if (i < 0 || j < 0) {
    console.error(`계획서에 ${A} / ${B} 표시가 없습니다.`);
    process.exit(1);
  }
  writeFileSync(DOC, doc.slice(0, i + A.length) + '\n' + markdown() + doc.slice(j));
  console.log(`써 넣었습니다 → ${DOC}`);
  console.log(`  2029년 SM ${억표(last.r.SM)} + WT ${억표(last.r.WT)} + 교육 ${억표(last.r.EDU)} = ${억표(last.r.total)}억`);
  console.log(`  목표 500억까지 ${억표(gap)}억 부족 · 필요 AUM ${(R.필요AUM / 조).toFixed(1)}조`);
} else {
  console.log(markdown());
}
