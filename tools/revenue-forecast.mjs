#!/usr/bin/env node
/**
 * revenue-forecast.mjs — SeoulMarkets + WikiTip 매출 계획을 계산한다.
 * ─────────────────────────────────────────────────────────────────────────
 * [왜 도구로 만드나]
 * 문서에 손으로 적으면 가정이 바뀌는 순간 문서가 조용히 틀려진다.
 * 실제로 그랬다 — `docs/사업전략-데이터제공업.md` §5.5 는 같은 문서 안에서
 * 앞에선 「10개 상품 · 평균 AUM 5천억 · 0.03% → 연 15억」이라 적고,
 * 표에서는 같은 입력으로 「150억」이라 적었다. **10배 차이다.**
 * 사람이 표를 손으로 채우면 이런 게 안 잡힌다. 그래서 계산기로 옮긴다.
 *
 * [무엇이 사실이고 무엇이 가정인가]
 *   사실 = 단가 구조(tools/pricing.json) · 오늘의 아카이브 규모 · 도메인 라이브
 *   가정 = 계약 수 · AUM · 트래픽 · 상품 수  ← 전부 ASSUMPTIONS 한 곳에 있다
 *
 * 가정을 바꾸고 싶으면 ASSUMPTIONS 만 고쳐 다시 돌린다. 문서는 따라온다.
 *
 * 사용
 *   node tools/revenue-forecast.mjs            표만 출력
 *   node tools/revenue-forecast.mjs --json     계산 원본값
 *   node tools/revenue-forecast.mjs --write    계획서에 직접 써 넣는다
 */

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const DOC = path.join(ROOT, 'docs/매출계획-2026-2029.md');
const P = JSON.parse(readFileSync(path.join(HERE, 'pricing.json'), 'utf8'));

const 억 = 1e8;
const 조 = 1e12;

/* ── 가정 — 전부 여기에 있다 ───────────────────────────────────────────
 *
 * 목표: 2029년 500억 (2026-08-02 사장님 지시 「3년 정도 내」)
 *
 * 아래 숫자는 목표에서 역산한 것이지 실측이 아니다. 매출은 오늘 0원이다.
 * 다만 **역산이라는 사실을 감추지 않으면 역산도 쓸모가 있다** —
 * 「45곳」이 어렵다고 느껴지면 그게 곧 이 계획의 난이도다.
 */
const ASSUMPTIONS = {
  2026: {
    라벨: '2026 (8~12월)',
    institutional: 0,
    business: 0,
    dev: 0,
    지수상품수: 0,
    상품평균AUM: 0,
    월PV: 30_000,
    커머스억: 0,
    신디케이션억: 0,
    개월: 5,
    사건: '색인·애드센스·아카이브 착수. **지수 라이선스 법률 검토 완결**',
  },
  2027: {
    라벨: '2027',
    institutional: 2,
    business: 8,
    dev: 100,
    지수상품수: 1,
    상품평균AUM: 0.3 * 조, // 첫 상품. 상장 첫해 3천억이면 성공한 편이다
    월PV: 3_000_000,
    커머스억: 2,
    신디케이션억: 3,
    개월: 12,
    사건: '**첫 ETF 상장.** 기관 첫 계약 2곳. 영업 2명 채용',
  },
  2028: {
    라벨: '2028',
    institutional: 20,
    business: 25,
    dev: 200,
    지수상품수: 5,
    상품평균AUM: 0.6 * 조,
    월PV: 12_000_000,
    커머스억: 15,
    신디케이션억: 12,
    개월: 12,
    사건: '기관 20곳. 상품 5개 · AUM 3조. 영업 8명',
  },
  2029: {
    라벨: '2029',
    institutional: 45,
    business: 40,
    dev: 300,
    지수상품수: 10,
    상품평균AUM: 0.5 * 조, // 합계 5조 — 전략 문서가 든 숫자 그대로
    월PV: 33_000_000,
    커머스억: 40,
    신디케이션억: 30,
    개월: 12,
    사건: '**기관 45곳 · 추종 AUM 5조 · 상품 10개**',
  },
};

const TARGET_2029 = 500 * 억;

/* ── 계산 ────────────────────────────────────────────────────────────── */

function year(a) {
  const inst = a.institutional * P.api.institutional.연요금;
  const biz = a.business * P.api.business.연요금;
  const dev = a.dev * P.api.dev.월요금 * a.개월;
  const api = inst + biz + dev;

  const aum = a.지수상품수 * a.상품평균AUM;
  const index = aum * P.index.요율 * (a.개월 / 12);

  const ads = (a.월PV / 1000) * P.ads.천PV당원 * a.개월;
  const commerce = a.커머스억 * 억;
  const synd = a.신디케이션억 * 억;

  return { api, inst, biz, dev, index, aum, ads, commerce, synd, total: api + index + ads + commerce + synd };
}

const rows = Object.entries(ASSUMPTIONS).map(([y, a]) => ({ y, a, r: year(a) }));
const last = rows.at(-1);
const gap = TARGET_2029 - last.r.total;

const 억표 = (n) => (n / 억).toFixed(n < 억 ? 2 : 1);

/* ── 출력 ────────────────────────────────────────────────────────────── */

function markdown() {
  const L = [];
  L.push(
    `> 이 표는 \`tools/revenue-forecast.mjs\` 가 계산해 써 넣은 것이다. **손으로 고치지 마십시오** —`,
    `> 다음 실행에 덮인다. 숫자를 바꾸려면 그 파일의 \`ASSUMPTIONS\` 를 고쳐 다시 돌린다.`,
    `> 단가는 \`tools/pricing.json\` 한 곳에서만 읽는다.`,
    ``,
    `단위: 억원`,
    ``,
    `| 연도 | 데이터 API | 지수 | 광고 | 커머스 | 신디케이션 | **합계** | 그 해에 일어나야 하는 일 |`,
    `|---|---:|---:|---:|---:|---:|---:|---|`,
  );
  for (const { a, r } of rows) {
    L.push(
      `| **${a.라벨}** | ${억표(r.api)} | ${억표(r.index)} | ${억표(r.ads)} | ${억표(r.commerce)} | ${억표(r.synd)} | **${억표(r.total)}** | ${a.사건} |`,
    );
  }
  L.push(
    ``,
    `### 목표까지 — 감추지 않는다`,
    ``,
    `| | 억원 |`,
    `|---|---:|`,
    `| 2029년 목표 (사장님 지시) | **500.0** |`,
    `| 위 가정으로 계산된 2029년 | **${억표(last.r.total)}** |`,
    `| **차이** | **${억표(gap)}** |`,
    ``,
  );

  // 차액을 메우는 방법을 숫자로 보여준다. 「더 열심히」로 넘기지 않는다.
  const 기관단가 = P.api.institutional.연요금;
  const 추가기관 = Math.ceil(gap / 기관단가);
  const 필요AUM = TARGET_2029 - (last.r.total - last.r.index);
  const 필요AUM조 = 필요AUM / P.index.요율 / 조;
  const 필요요율 = ((필요AUM / (last.r.aum || 1)) * 100).toFixed(3);

  L.push(
    `**이 차이를 메우는 길은 셋뿐이고, 전부 숫자로 확인된다.**`,
    ``,
    `| 길 | 필요한 것 | 지금 가정 | 판단 |`,
    `|---|---|---|---|`,
    `| ① 기관 계약을 더 | **${last.a.institutional + 추가기관}곳** (연 ${억표(기관단가)}억 × ) | ${last.a.institutional}곳 | 영업 1인당 연 5~8곳. **${Math.ceil((last.a.institutional + 추가기관) / 6)}명 이상** 필요 |`,
    `| ② 추종 AUM 을 더 | **${필요AUM조.toFixed(0)}조원** | ${(last.r.aum / 조).toFixed(0)}조원 | 국내 ETF 시장 규모를 생각하면 국내만으로는 어렵다. **해외 상장** 전제 |`,
    `| ③ 요율을 올려 | 연 **${필요요율}%** | ${(P.index.요율 * 100).toFixed(2)}% | 업계 상단이 0.10%. **범위 밖이면 불가** |`,
    ``,
  );
  return L.join('\n');
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ rows: rows.map((x) => ({ 연도: x.y, ...x.r })), 목표: TARGET_2029, 차이: gap }, null, 2));
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
  console.log(`  2029년 계산값 ${억표(last.r.total)}억 · 목표 500억 · 차이 ${억표(gap)}억`);
} else {
  console.log(markdown());
}
