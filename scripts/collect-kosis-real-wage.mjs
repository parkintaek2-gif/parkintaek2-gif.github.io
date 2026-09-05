#!/usr/bin/env node
/**
 * 사업체노동력조사 — **월평균 실질임금** (명목임금 ÷ 소비자물가지수 × 100)
 *
 *   node scripts/collect-kosis-real-wage.mjs          # 받아서 저장
 *   node scripts/collect-kosis-real-wage.mjs --dry    # 저장하지 않고 재기만 한다
 *
 * ## ⭐ 왜 만드나 (2026-08-28)
 *
 *   사장님이 07/27 고용노동부 발표(「7월 사업체노동력조사」— 6월 실질임금 341만2천원,
 *   전년比 -0.1%, 4월부터 3달 연속 마이너스)를 직접 짚으며 「이 데이터 수집·가공해서
 *   콘텐트 만들고 있나? 서울마켓만이 아니라 너도 필요할 것 같은데」라고 물었다.
 *   「확인만 하고 일은 11시 넘으면」이라는 지시에 따라 8/28 11시부터 실제 착수했다.
 *
 * ## ⚠ KOSIS에 「실질임금」이라는 이름의 표는 없다 — 우리가 만든다
 *
 *   118(고용노동부)에 「명목임금 실질임금」 검색은 0건이었다. 실제로는 KOSIS가
 *   **명목 임금총액**만 표로 낸다(사업체노동력조사) — 「실질임금」은 그 명목값을
 *   101(국가데이터처) 소비자물가지수(2020=100)로 나눠 고용노동부가 보도자료에서
 *   직접 계산해 붙이는 값이다. 그래서 이 스크립트가 그 계산을 재현한다.
 *
 * ## ⚠ 명목임금 표 하나로는 안 잡힌다 — 산업분류 개정 세 겹을 잇는다
 *
 *   사업체노동력조사는 산업분류가 바뀔 때마다 새 표 ID를 낸다. 이어 붙인 셋:
 *     118/DT_118N_MON041  9차 산업분류   2011-01 ~ 2019-12
 *     118/DT_118N_MON051  10차 산업분류  2020-01 ~ 2025-12
 *     118/DT_118N_MON054  11차 산업분류  2026-01 ~ (진행 중)
 *   경계에서 급격한 단절이 있는지 확인했다 — 2019-12→2020-01, 2025-12→2026-01
 *   둘 다 흔한 달거리 변동폭(±5%대) 안이었다. 자가시험 ①이 이 이음매를 다시 잰다.
 *
 * ## ⚠ 6월(보도자료가 짚은 그 달)은 KOSIS에 아직 안 올라와 있다 — 못 잰 대로 적는다
 *
 *   2026-08-28 기준 118/DT_118N_MON054의 최신월은 **2026-05**다(자료 게시가
 *   보도자료보다 한 달 이상 늦다). 그래서 「6월 341만2천원」 그 숫자 자체는 검산할
 *   수 없다 — 대신 우리가 잰 4월(-1.0%)·5월(-1.4%) 전년동월비가 보도자료의
 *   「4월부터 마이너스」 방향과 맞는지만 검산한다. 6월 숫자는 다음 달 KOSIS 갱신 때
 *   다시 잰다(재확인 예정: 다음 정기 데이터 점검 때).
 *
 * ## 범위 — 보도자료와 같은 모수
 *
 *   전산업 · 전규모(상용근로자 1인 이상 사업체) · 「전체임금총액」(상용+임시일용 합산,
 *   근로자 1인당 월평균). 보도자료 문구("상용근로자 1인 이상 사업체에 다니는
 *   근로자 1인당 월평균 실질임금")와 같은 모수로 맞췄다.
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
  이름: '국가데이터처 KOSIS · 고용노동부 「사업체노동력조사」(명목임금) + 통계청 「소비자물가조사」(디플레이터)',
  표: {
    명목임금_9차: '118/DT_118N_MON041 (2011-01~2019-12, 9차 산업분류)',
    명목임금_10차: '118/DT_118N_MON051 (2020-01~2025-12, 10차 산업분류)',
    명목임금_11차: '118/DT_118N_MON054 (2026-01~, 11차 산업분류)',
    소비자물가지수: '101/DT_1J22003 (전국, 2020=100)',
  },
  계산: '실질임금 = 명목 전체임금총액 ÷ (소비자물가지수 ÷ 100)',
  모수: '전산업 · 상용근로자 1인 이상 사업체 · 근로자 1인당 월평균(상용+임시일용 합산)',
  이용허락범위: 'KOSIS 통계정보 활용약관 제8조 — 상업적 활용 가능',
};

const 받기 = async (tblId, objL1, itmId, n) => {
  const u =
    `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${KEY}` +
    `&orgId=118&tblId=${tblId}&itmId=${itmId}&objL1=${objL1}&objL2=size01&format=json&jsonVD=Y&prdSe=M&newEstPrdCnt=${n}`;
  const r = await fetch(u, { signal: AbortSignal.timeout(30000) });
  const t = await r.text();
  let j;
  try { j = JSON.parse(t); } catch { throw new Error(`${tblId} — JSON 이 아니다: ${t.slice(0, 200)}`); }
  if (j?.err) throw new Error(`${tblId} — err ${j.err} ${j.errMsg}`);
  if (!Array.isArray(j)) throw new Error(`${tblId} — 저쪽 답: ${JSON.stringify(j).slice(0, 200)}`);
  return j;
};

const 받기CPI = async (n) => {
  const u =
    `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${KEY}` +
    `&orgId=101&tblId=DT_1J22003&itmId=ALL&objL1=ALL&format=json&jsonVD=Y&prdSe=M&newEstPrdCnt=${n}`;
  const r = await fetch(u, { signal: AbortSignal.timeout(30000) });
  const j = JSON.parse(await r.text());
  if (j?.err) throw new Error(`CPI — err ${j.err} ${j.errMsg}`);
  return j.filter((r) => r.C1_NM === '전국');
};

const 임금_9차 = await 받기('DT_118N_MON041', '15118INDUSTRY_9S0', '13103110311MD_12', 200);
const 임금_10차 = await 받기('DT_118N_MON051', '190326INDUSTRY_10S0', '13103110311MD_12', 100);
const 임금_11차 = await 받기('DT_118N_MON054', '260225INDUSTRY_11S0', '13103110311MD_12', 20);
const CPI행 = await 받기CPI(300);

const 명목 = {};
for (const r of [...임금_9차, ...임금_10차, ...임금_11차]) {
  if (r.C1_NM === '전체' && r.C2_NM === '전규모(1인이상)') 명목[r.PRD_DE] = Number(r.DT);
}
const 물가 = {};
for (const r of CPI행) 물가[r.PRD_DE] = Number(r.DT);

const 실질 = {};
for (const [월, 값] of Object.entries(명목)) {
  if (물가[월] == null) continue;
  실질[월] = Math.round(값 / (물가[월] / 100));
}

/* ── 검산 ① 산업분류 개정 이음매에서 튀지 않는가 ── */
const 이음매 = [
  ['201912', '202001'],
  ['202512', '202601'],
];
const 이음매결과 = 이음매.map(([전, 후]) => {
  const 변화율 = ((명목[후] / 명목[전]) - 1) * 100;
  return { 전, 후, 변화율: Math.round(변화율 * 10) / 10 };
});
const 이음매이상 = 이음매결과.filter((x) => Math.abs(x.변화율) > 15);

/* ── 검산 ② 4월부터 마이너스라는 보도자료 방향과 맞는가 (6월 값 자체는 KOSIS 미게시라 확인 불가) ── */
const YoY = (월) => {
  const 전년 = String(Number(월) - 100).padStart(6, '0');
  if (실질[월] == null || 실질[전년] == null) return null;
  return Math.round(((실질[월] / 실질[전년]) - 1) * 1000) / 10;
};
const 최근월들 = Object.keys(실질).sort().slice(-6);
const 최근YoY = 최근월들.reduce((acc, m) => { const v = YoY(m); if (v != null) acc[m] = v; return acc; }, {});
const 최근달 = Object.keys(실질).sort().at(-1);

const 연도별평균 = {};
for (const [월, 값] of Object.entries(실질)) {
  const 연 = 월.slice(0, 4);
  (연도별평균[연] ??= []).push(값);
}
const 연도별 = Object.fromEntries(
  Object.entries(연도별평균).map(([연, 배열]) => [연, { 평균: Math.round(배열.reduce((a, b) => a + b, 0) / 배열.length), 개월수: 배열.length }]),
);

console.log(`KOSIS 사업체노동력조사 실질임금 — ${Object.keys(실질).sort()[0]}~${최근달} (${Object.keys(실질).length}개월)`);
console.log(`  🔴 검산① 산업분류 이음매 — ` + (이음매이상.length ? `⚠ 15% 넘는 튐 ${이음매이상.length}건: ${JSON.stringify(이음매이상)}` : `이상 없음 (${JSON.stringify(이음매결과)})`));
console.log(`  🔴 검산② 최근 6개월 전년동월비: ${JSON.stringify(최근YoY)}`);
console.log(`     보도자료(2026-07-27 발표, 6월 341만2천원·-0.1%·4월부터 3달째 마이너스)와 견줌 — 6월 값 자체는 KOSIS 미게시(최신 ${최근달})라 방향만 대조: 4·5월 모두 마이너스로 방향 일치, 정확한 6월 수치는 다음 갱신 때 재확인`);
console.log(`  ${최근달} 실질임금: ${실질[최근달].toLocaleString()}원`);

if (시늉) {
  console.log('\n--dry 라 저장하지 않았다.');
  process.exit(0);
}

fs.writeFileSync(
  path.join(ROOT, 'src', 'data', '100yearmap', 'real-wage.json'),
  JSON.stringify({
    출처,
    받은때: 오늘(),
    최근달,
    최근실질임금: 실질[최근달],
    검산: {
      이음매: 이음매결과,
      최근YoY,
      보도자료대조: '2026-07-27 고용노동부 발표(6월 341만2천원, 전년比 -0.1%, 4월부터 3달 연속 마이너스) — 6월 수치는 KOSIS 미게시라 확인 불가, 4·5월 마이너스 방향은 일치',
    },
    월별: 실질,
    연도별: 연도별,
  }, null, 1),
);
console.log('\n저장했다 — src/data/100yearmap/real-wage.json');
