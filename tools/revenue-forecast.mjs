#!/usr/bin/env node
/**
 * revenue-forecast.mjs — 매출 계획을 계산한다.
 * ─────────────────────────────────────────────────────────────────────────
 * [왜 도구로 만드나]
 * 문서에 손으로 적으면 가정이 바뀌는 순간 조용히 틀려진다. 실제로 그랬다 —
 * 사업전략 §5.5 가 같은 문서 안에서 「15억」과 「150억」을 동시에 적었다(10배 오류).
 *
 * [2026-08-02 2차 개정 — 매체를 갈랐다]
 * 앞 판은 광고·커머스를 한 줄로 뭉쳐서 **어느 매체가 얼마를 버는지가 안 보였다.**
 * 사장님 지적: 「사업계획에 위키팁이 빠졌네」 「서울마켓츠가 혼자서 못해 500억 달성」
 * 맞다. 둘은 성질이 완전히 다른 매체다.
 *
 *   SeoulMarkets  영문 금융 데이터. **독자는 적고 단가가 높다.** 기관이 산다
 *   WikiTip       동남아 한류. **독자는 많고 단가가 낮다.** 광고·커머스로 번다
 *
 * 뭉쳐 놓으면 「트래픽 3,300만 PV」가 어느 쪽 것인지 알 수 없다.
 * 금융 사이트가 그 트래픽을 낼 리 없고, 한류 매체가 기관에 데이터를 팔 리 없다.
 *
 * [무엇이 사실이고 무엇이 가정인가]
 *   사실 = 단가 구조(pricing.json) · 인력 1명 · 자금 0원 · 오늘 매출 0원
 *   가정 = 그 밖 전부.  ASSUMPTIONS 한 곳에 모았다
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

/* ── 가정 ──────────────────────────────────────────────────────────────
 *
 * 목표: 2029년 500억 (사장님 지시)
 * 제약: 인력 1명 · 자금 0원 · 채용 없음
 *
 * 광고 단가를 매체별로 다르게 둔다. 이게 앞 판의 가장 큰 잘못이었다.
 *   금융(영문·미국 독자)  1,000PV 당 25,000원  — 금융은 광고 단가가 높다
 *   한류(동남아)          1,000PV 당  6,000원  — 규모는 크고 단가는 낮다
 * 근거: docs/신규사업/한류매체-동남아-시장조사.md (동남아 디스플레이 약 4,000원,
 *       직접광고 약 15,000원. 혼합으로 6,000원을 잡는다)
 */
const RPM = { 금융: 25_000, 한류: 6_000 };

const ASSUMPTIONS = {
  2026: {
    라벨: '2026 (8~12월)', 개월: 5,
    sm: { 지수상품수: 0, 상품평균AUM: 0, 리셀러파트너: 0, 파트너당배분억: 0, devA: 0, bizA: 0, 월PV: 30_000 },
    wt: { 월PV: 0, 커머스억: 0 },
    사건: '아카이브 · 색인 · 애드센스. **WikiTip 영문 발행 착수**',
  },
  2027: {
    라벨: '2027', 개월: 12,
    sm: { 지수상품수: 1, 상품평균AUM: 0.3 * 조, 리셀러파트너: 1, 파트너당배분억: 2, devA: 150, bizA: 5, 월PV: 600_000 },
    wt: { 월PV: 5_000_000, 커머스억: 2 },
    사건: '**첫 ETF 상장** · 벤더 재판매 1곳 · **WikiTip 인도네시아어 추가**',
  },
  2028: {
    라벨: '2028', 개월: 12,
    sm: { 지수상품수: 5, 상품평균AUM: 0.8 * 조, 리셀러파트너: 3, 파트너당배분억: 8, devA: 400, bizA: 20, 월PV: 1_500_000 },
    wt: { 월PV: 18_000_000, 커머스억: 12 },
    사건: '상품 5개 · AUM 4조 · 재판매 3곳 · **WikiTip 이 allkpop 급 트래픽**',
  },
  2029: {
    라벨: '2029', 개월: 12,
    sm: { 지수상품수: 12, 상품평균AUM: 1.0 * 조, 리셀러파트너: 5, 파트너당배분억: 15, devA: 800, bizA: 40, 월PV: 3_000_000 },
    wt: { 월PV: 35_000_000, 커머스억: 25 },
    사건: '**AUM 12조 · 재판매 5곳 · WikiTip 4개 언어**',
  },
};

const COST = {
  2026: 0.01, 2027: 0.8, 2028: 6, 2029: 18,   // 억원. 지수 거버넌스 비용은 미확인 가정
};

const TARGET_2029 = 500 * 억;
/** 우리가 직접 운용할 때의 ETF 총보수. 지수 라이선스(0.03%)와 비교하려고 둔다. */
const 운용총보수 = 0.0025;

/* ── 계산 ────────────────────────────────────────────────────────────── */

function year(a) {
  const { sm, wt, 개월 } = a;

  const aum = sm.지수상품수 * sm.상품평균AUM;
  const 지수 = aum * P.index.요율 * (개월 / 12);
  const 재판매 = sm.리셀러파트너 * sm.파트너당배분억 * 억;
  const 셀프서브 = sm.devA * P.api.dev.월요금 * 개월 + sm.bizA * P.api.business.연요금;
  const sm광고 = (sm.월PV / 1000) * RPM.금융 * 개월;
  const SM = 지수 + 재판매 + 셀프서브 + sm광고;

  const wt광고 = (wt.월PV / 1000) * RPM.한류 * 개월;
  const 커머스 = wt.커머스억 * 억;
  const WT = wt광고 + 커머스;

  // 직접 운용 시나리오 — 같은 AUM 에서 지수 라이선스 대신 총보수를 받는다
  const 직접운용 = aum * 운용총보수 * (개월 / 12);

  return { aum, 지수, 재판매, 셀프서브, sm광고, SM, wt광고, 커머스, WT, total: SM + WT, 직접운용 };
}

const rows = Object.entries(ASSUMPTIONS).map(([y, a]) => ({ y, a, r: year(a) }));
const last = rows.at(-1);
const 억표 = (n) => (n / 억).toFixed(Math.abs(n) < 억 ? 2 : 1);

/* ── 출력 ────────────────────────────────────────────────────────────── */

function markdown() {
  const L = [];
  L.push(
    '> 이 표는 `tools/revenue-forecast.mjs` 가 계산해 써 넣은 것이다. **손으로 고치지 마십시오** —',
    '> 다음 실행에 덮인다. 숫자를 바꾸려면 그 파일의 `ASSUMPTIONS` 를 고쳐 다시 돌린다.',
    '',
    '**전제: 인력 1명 · 자금 0원 · 채용 없음.** 채용을 전제한 매출원은 이 표에 없다.',
    '',
    '### 매체별 — 둘은 성질이 다르다',
    '',
    '| | SeoulMarkets | WikiTip |',
    '|---|---|---|',
    '| 무엇 | 영문 금융 데이터 | 동남아 한류 |',
    '| 독자 | **적다** | **많다** |',
    `| 광고 단가(1,000PV) | **${RPM.금융.toLocaleString()}원** | ${RPM.한류.toLocaleString()}원 |`,
    '| 버는 방식 | 기관이 데이터를 산다 | 트래픽으로 광고·커머스 |',
    '',
    '단위: 억원',
    '',
    '| 연도 | 지수 | 재판매 | 셀프서브 | SM광고 | **SM 소계** | WT광고 | 커머스 | **WT 소계** | **합계** |',
    '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|',
  );
  for (const { a, r } of rows) {
    L.push(
      `| **${a.라벨}** | ${억표(r.지수)} | ${억표(r.재판매)} | ${억표(r.셀프서브)} | ${억표(r.sm광고)} | **${억표(r.SM)}** | ${억표(r.wt광고)} | ${억표(r.커머스)} | **${억표(r.WT)}** | **${억표(r.total)}** |`,
    );
  }

  const smShare = (last.r.SM / last.r.total) * 100;
  L.push(
    '',
    '| 연도 | 그 해에 일어나야 하는 일 |',
    '|---|---|',
    ...rows.map(({ a }) => `| ${a.라벨} | ${a.사건} |`),
    '',
    '### 위키팁이 없으면 안 되는 이유 — 숫자로',
    '',
    `2029년 ${억표(last.r.total)}억 중 SeoulMarkets 가 **${억표(last.r.SM)}억(${smShare.toFixed(0)}%)**,`,
    `WikiTip 이 **${억표(last.r.WT)}억(${(100 - smShare).toFixed(0)}%)** 이다.`,
    '',
    '**서울마켓츠 혼자로는 500억이 안 된다.** 영문 금융 데이터 매체는 독자가 적다 —',
    `2029년 가정이 월 ${(last.a.sm.월PV / 10_000).toFixed(0)}만 페이지뷰인데, 그게 이 분야에서 작은 수가 아니다.`,
    `대신 광고 단가가 ${(RPM.금융 / RPM.한류).toFixed(1)}배다.`,
    '',
    `WikiTip 은 반대다 — 2029년 월 ${(last.a.wt.월PV / 10_000).toFixed(0)}만 페이지뷰를 가정한다.`,
    'allkpop 실측이 월 1,450만이니 그 2.4배다. **가장 낙관적인 가정이 여기 있다.**',
    '',
    '> ⚠ **이 표에 KLifeMap 유입은 안 들어 있다.** WikiTip 의 진짜 값은 광고가 아니라',
    '> KLifeMap 으로 보내는 것인데(같은 트래픽에서 광고보다 낫다는 계산이 있다),',
    '> 그건 KLifeMap 매출로 잡힌다. **즉 WikiTip 의 기여는 위 표보다 크다.**',
    '',
    '### 자금 — 벌면서 쓴다 (선투자 0원)',
    '',
    '| 연도 | 매출 | 비용 | **누적** |',
    '|---|---:|---:|---:|',
  );
  let 누적 = 0;
  for (const { y, r } of rows) {
    누적 += r.total - COST[y] * 억;
    L.push(`| ${y} | ${억표(r.total)} | ${억표(COST[y] * 억)} | **${억표(누적)}** |`);
  }

  const gap = TARGET_2029 - last.r.total;
  const 운용차익 = last.r.직접운용 - last.r.지수;
  const 운용후 = last.r.total + 운용차익;

  L.push(
    '',
    '**누적이 한 해도 음수로 안 내려간다.** 고정비가 연 몇 만원대다 —',
    '아카이브 250MB 는 R2 무료 구간 안이고, 원천은 공공데이터포털 무료,',
    '호스팅은 최소 단위 0.25GB 로 충분하다(실행 실측 47.6MB).',
    '⚠ 지수 산출의 거버넌스 비용만 미확인이고, 위 표의 그 몫은 가정이다.',
    '',
    '### 목표까지 — 그리고 그 답이 왜 「운용사」인가',
    '',
    '| | 억원 |',
    '|---|---:|',
    '| 2029년 목표 (사장님 지시) | **500.0** |',
    `| 지금 가정으로 계산된 값 | **${억표(last.r.total)}** |`,
    `| **차이** | **${억표(gap)}** |`,
    '',
    '**이 차이를 한 번에 메우는 것이 하나 있다 — 지수를 남에게 빌려주지 않고 직접 굴리는 것이다.**',
    '',
    '| | AUM | 요율/보수 | 매출 |',
    '|---|---:|---:|---:|',
    `| 지금 계획 (지수 라이선스) | ${(last.r.aum / 조).toFixed(0)}조 | ${(P.index.요율 * 100).toFixed(2)}% | **${억표(last.r.지수)}억** |`,
    `| **우리가 직접 운용** | ${(last.r.aum / 조).toFixed(0)}조 | ${(운용총보수 * 100).toFixed(2)}% | **${억표(last.r.직접운용)}억** |`,
    `| 차이 | | ${(운용총보수 / P.index.요율).toFixed(1)}배 | **+${억표(운용차익)}억** |`,
    '',
    `**같은 AUM 에서 ${(운용총보수 / P.index.요율).toFixed(1)}배다.** 직접 운용하면 2029년 합계가`,
    `**${억표(운용후)}억**이 되어 목표를 ${운용후 >= TARGET_2029 ? '넘는다' : `${억표(TARGET_2029 - 운용후)}억 남기고 따라붙는다`}.`,
    '',
    '**그래서 운용사가 「하고 싶은 것」이 아니라 「500억의 유일한 경로」다.**',
    '자세한 것은 `docs/연구-AI운용사와-관할권.md`.',
    '',
  );
  return L.join('\n');
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ 인력: 1, rows: rows.map((x) => ({ 연도: x.y, ...x.r })), 목표: TARGET_2029 }, null, 2));
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
  console.log(`  2029년 SM ${억표(last.r.SM)}억 + WT ${억표(last.r.WT)}억 = ${억표(last.r.total)}억`);
  console.log(`  직접 운용 시 ${억표(last.r.total + last.r.직접운용 - last.r.지수)}억`);
} else {
  console.log(markdown());
}
