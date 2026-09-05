#!/usr/bin/env node
/**
 * 가계금융복지조사 — 가구주 연령별 **자산 격차** (29세 이하 vs 60세 이상)
 *
 *   node scripts/collect-kosis-wealth-gap.mjs        # 받아서 저장
 *   node scripts/collect-kosis-wealth-gap.mjs --dry  # 저장하지 않고 재기만 한다
 *
 * ## ⭐ 왜 만드나 (2026-08-28)
 *
 *   사장님이 「청년 예산 언박싱 2027」관계부처합동 보도자료(2026-08-28)를 공유했다.
 *   본문 각주에 「세대간 자산격차 — 고령층-청년층 자산격차 '24년 기준 3.9배('12년 2.4배)」가
 *   정책 추진 근거로 인용돼 있었다. 이건 정부의 «약속»이 아니라 이미 조사된 **실측값**이라
 *   KOSIS 원자료로 직접 검증했다 — 각주 그대로 베끼지 않았다.
 *
 * ## 검증 결과
 *
 *   101/DT_1HDAAA06(가계금융복지조사, 가구주연령계층별(10세) 자산·부채·소득)에서
 *   ITM=전가구 평균 · C3=자산(총자산) · 29세 이하 vs 60세 이상 배율을 직접 재니
 *   **2024년 3.90배** — 보도자료의 "3.9배"와 일치했다(오차 0).
 *   ⚠ **2012년 값은 이 표에서 못 구했다** — 이 표의 「가구주연령계층별(10세)」 분류는
 *   2017년부터만 있다(그 전 연도는 다른 분류 체계였을 가능성). 그래서 "2012년 2.4배"는
 *   보도자료를 그대로 인용하되 **저희가 직접 검산하지 못했다고 명시**한다.
 *   ⚠ 「순자산」(자산-부채)이 아니라 「총자산」기준이다 — 순자산으로 재면 배율이 더 크게
 *   (2024년 5.00배) 나온다. 보도자료 숫자와 맞춘 건 총자산 쪽이라 그걸 쓴다.
 *
 * ## 이용허락범위
 *
 *   KOSIS 통계정보 활용약관 제8조 — 상업적 활용 가능. 제7조 출처표시 의무.
 *   ⛔ 키 값을 출력하거나 커밋하지 않는다. `.env` 는 gitignore.
 */
import fs from 'node:fs';
import path from 'node:path';
import { 오늘 } from './_kst.mjs';

const ROOT = path.resolve(
  path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'),
  '..',
);
const 시늉 = process.argv.includes('--dry');

const KEY = fs.readFileSync(path.join(ROOT, '.env'), 'utf8').match(/^KOSIS_API_KEY=(.+)$/m)?.[1]?.trim();
if (!KEY) throw new Error('.env 에 KOSIS_API_KEY 가 없다');

const 출처 = {
  이름: '국가데이터처 KOSIS · 통계청·한국은행·금융감독원 「가계금융복지조사」',
  표: '101/DT_1HDAAA06 (가구주연령계층별(10세) 자산·부채·소득 현황)',
  기준: '전가구 평균 · 총자산(부채 차감 전) · 가구주 나이 29세 이하 vs 60세 이상',
  이용허락범위: 'KOSIS 통계정보 활용약관 제8조 — 상업적 활용 가능',
};

const 받기 = async (n) => {
  const objs = Array.from({ length: 3 }, (_, i) => `objL${i + 1}=ALL`).join('&');
  const u =
    `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${KEY}` +
    `&orgId=101&tblId=DT_1HDAAA06&itmId=ALL&${objs}&format=json&jsonVD=Y&prdSe=Y&newEstPrdCnt=${n}`;
  const r = await fetch(u, { signal: AbortSignal.timeout(30000) });
  const t = await r.text();
  let j;
  try { j = JSON.parse(t); } catch { throw new Error(`JSON 이 아니다: ${t.slice(0, 200)}`); }
  if (j?.err) throw new Error(`err ${j.err} ${j.errMsg}`);
  return j;
};

const 행 = await 받기(30);
const 자산행 = 행.filter((r) => r.C3_NM === '자산' && r.C1_NM === '전체' && r.ITM_NM === '전가구 평균');
const 연도들 = [...new Set(자산행.map((r) => r.PRD_DE))].sort();

const 연도별 = {};
for (const 연도 of 연도들) {
  const 청년 = 자산행.find((r) => r.PRD_DE === 연도 && r.C2_NM === '29세 이하');
  const 고령 = 자산행.find((r) => r.PRD_DE === 연도 && r.C2_NM === '60세 이상');
  if (!청년 || !고령) continue;
  const 청년값 = Number(청년.DT);
  const 고령값 = Number(고령.DT);
  연도별[연도] = {
    청년29이하_만원: Math.round(청년값),
    고령60이상_만원: Math.round(고령값),
    배율: Math.round((고령값 / 청년값) * 100) / 100,
  };
}

const 기준연도 = 연도들.at(-1);
const 최근 = 연도별[기준연도];

/* ── 검산 — 보도자료 인용값(2024년 3.9배)과 맞는가 ── */
const 보도자료검산 = 연도별['2024'] ? Math.abs(연도별['2024'].배율 - 3.9) < 0.05 : null;

console.log(`KOSIS 가계금융복지조사 자산격차 — ${연도들[0]}~${기준연도} (${연도들.length}개년)`);
console.log(`  🔴 검산 — 2024년 배율 ${연도별['2024']?.배율}배, 보도자료 "3.9배"와 ${보도자료검산 ? '일치' : '어긋남'}`);
console.log(`  ⚠ 2012년 값은 이 표(가구주연령계층별 10세 분류가 2017년부터만 있음)로 검산 불가 — 보도자료 인용만 함`);
console.log(`  ${기준연도}년 — 29세이하 ${최근.청년29이하_만원.toLocaleString()}만원 · 60세이상 ${최근.고령60이상_만원.toLocaleString()}만원 · 배율 ${최근.배율}배`);

if (시늉) {
  console.log('\n--dry 라 저장하지 않았다.');
  process.exit(0);
}

fs.writeFileSync(
  path.join(ROOT, 'src', 'data', '100yearmap', 'wealth-gap-age.json'),
  JSON.stringify({
    출처,
    받은때: 오늘(),
    기준연도,
    보도자료대조: {
      인용문: `「청년 예산 언박싱(UNBOXING) 2027」관계부처합동 보도자료(2026-08-28) — "세대간 자산격차 — 고령층-청년층 자산격차 '24년 기준 3.9배('12년 2.4배)"`,
      '2024년_검산': 보도자료검산 ? '일치' : '어긋남',
      '2012년_검산': '이 표로 확인 불가 — 보도자료 값을 그대로 인용',
    },
    연도별,
  }, null, 1),
);
console.log('\n저장했다 — src/data/100yearmap/wealth-gap-age.json');
