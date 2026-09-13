#!/usr/bin/env node
/**
 * 경제활동인구조사 — 20대(20~29세) 취업자, 1~8월 누적 월평균 전년동기대비
 *
 *   node scripts/collect-kosis-20s-jan-aug-employment.mjs        # 받아서 저장
 *   node scripts/collect-kosis-20s-jan-aug-employment.mjs --dry  # 저장하지 않고 재기만 한다
 *
 * ## ⭐ 왜 만드나 (2026-09-13 · U2 가 전한 사장님 인용문)
 *
 *   사장님 원문: 「13일 국가통계포털(KOSIS)에 따르면 올해 1∼8월 20대 취업자는
 *   월 평균 327만9천명으로 지난해 같은 기간(347만2천명)보다 19만3천명 감소했다.」
 *
 *   ⛔ 우리가 이미 가진 축(collect-kosis-youth-employment-streak.mjs)은
 *      «15~29세 · 매달 전년동월대비 · 연속 감소 개월수»라 나이 구간도 계산 방식도 다르다.
 *      그대로 갖다 쓰면 안 된다(6번이 2026-09-13 14:1x 에 이미 지적했다).
 *   ⇒ 그래서 «20~29세 · 1~8월 누적 월평균 · 전년동기대비»를 처음부터 다시 잰다.
 *
 * ## 검증 결과 — 재계산치가 인용과 사실상 일치
 *
 *   101/DT_1DA7024S(성/연령별 취업자)에서 20-29세(C2=20, "20 - 29세" 그대로 있다 —
 *   따로 20~24·25~29 를 합칠 필요가 없었다) · 계(C1=0) · 취업자(ITM_ID=T30) 의
 *   2025-01~2026-08 월별 값을 받아, 1~8월 여덟 달을 각 해에서 평균 냈다.
 *
 *   ```
 *   2026년 1~8월 평균   327.9만명   (인용 "327만9천명" 과 일치)
 *   2025년 1~8월 평균   347.1만명   (인용 "347만2천명" 과 0.1만 차 — 반올림 자릿수 차)
 *   감소                 19.3만명   (인용 "19만3천명" 과 일치)
 *   ```
 *
 * ## ⛔ 이 계산이 못 하는 것
 *
 *   ⛔ 15~29세 스트릭 표(같은 폴더 옆 파일)와 «다른 나이 구간·다른 계산법»이다 — 둘을
 *      섞어 같은 표인 것처럼 인용하지 않는다.
 *   ⛔ 감소의 원인(20대 인구 자체 감소 vs 고용 악화)은 이 표로 못 가른다.
 *   ⛔ 9월 이후 값은 아직 공표되지 않았다 — 다음 공표 때 「1~9월 누적」으로 다시 재야 한다.
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
  이름: '국가데이터처 KOSIS · 통계청 「경제활동인구조사」',
  표: '101/DT_1DA7024S (성/연령별 취업자)',
  기준: '월별 · 20~29세(C2=20) · 취업자 수(천명)',
  이용허락범위: 'KOSIS 통계정보 활용약관 제8조 — 상업적 활용 가능',
};

async function 받기(objL2, startPrdDe, endPrdDe) {
  const u =
    `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${KEY}` +
    `&orgId=101&tblId=DT_1DA7024S&itmId=T30&objL1=0&objL2=${objL2}` +
    `&format=json&jsonVD=Y&prdSe=M&startPrdDe=${startPrdDe}&endPrdDe=${endPrdDe}`;
  const r = await fetch(u, { signal: AbortSignal.timeout(30000) });
  const t = await r.text();
  let j;
  try { j = JSON.parse(t); } catch { throw new Error(`JSON 이 아니다: ${t.slice(0, 200)}`); }
  if (j?.err) throw new Error(`err ${j.err} ${j.errMsg}`);
  return j;
}

/** 시계열을 {월: 값(천명)} 으로 정리한다 */
export function 정리(행) {
  const 나옴 = {};
  for (const r of 행) 나옴[r.PRD_DE] = Number(r.DT);
  return 나옴;
}

/** 어느 해의 1~8월 값만 골라 평균 낸다. 여덟 달이 다 있어야 낸다 — 못 채우면 null */
export function 일월팔월평균(월별, 연도) {
  const 여덟달 = [];
  for (let m = 1; m <= 8; m += 1) {
    const 월키 = `${연도}${String(m).padStart(2, '0')}`;
    if (월별[월키] == null) return null;
    여덟달.push(월별[월키]);
  }
  const 합 = 여덟달.reduce((a, b) => a + b, 0);
  return { 평균: Math.round((합 / 8) * 10) / 10, 여덟달 };
}

if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  검('정리 — PRD_DE를 키로 DT를 숫자로', JSON.stringify(정리([{ PRD_DE: '202601', DT: '100.5' }])) === JSON.stringify({ 202601: 100.5 }));

  const 표본월별 = {
    202501: 100, 202502: 110, 202503: 90, 202504: 100,
    202505: 100, 202506: 100, 202507: 100, 202508: 100,
  };
  const 평균표본 = 일월팔월평균(표본월별, 2025);
  검('일월팔월평균 — 여덟 달 평균 (100+110+90+100*5)/8=100', 평균표본.평균 === 100);
  검('일월팔월평균 — 여덟달 배열 길이 8', 평균표본.여덟달.length === 8);
  검('일월팔월평균 — 한 달이 비면 null', 일월팔월평균({ 202501: 100 }, 2025) === null);

  console.log(실패.length ? `⛔ ${실패.length}개 실패 — ${실패.join(' · ')}` : `✅ collect-kosis-20s-jan-aug-employment 자가시험 통과 (5)`);
  process.exit(실패.length ? 1 : 0);
}

const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'collect-kosis-20s-jan-aug-employment.mjs';
if (내가직접불렸나 && !process.argv.includes('--자가시험')) {
  const 행 = await 받기('20', '202501', '202612');
  const 월별 = 정리(행);

  const 최신년 = new Date().getFullYear();
  const 올해평균 = 일월팔월평균(월별, 최신년);
  const 작년평균 = 일월팔월평균(월별, 최신년 - 1);
  if (!올해평균 || !작년평균) throw new Error(`1~8월 여덟 달이 아직 다 안 모였다 — ${최신년}·${최신년 - 1} 둘 다 필요`);

  const 감소_만명 = Math.round((작년평균.평균 - 올해평균.평균) / 10 * 10) / 10;

  console.log(`KOSIS 20~29세 취업자, 1~8월 누적 월평균 — ${최신년}년 ${(올해평균.평균 / 10).toFixed(1)}만명 vs ${최신년 - 1}년 ${(작년평균.평균 / 10).toFixed(1)}만명`);
  console.log(`  감소 ${감소_만명}만명 (사장님 인용 "19만3천명"과 대조)`);

  if (시늉) {
    console.log('\n--dry 라 저장하지 않았다.');
    process.exit(0);
  }

  fs.writeFileSync(
    path.join(ROOT, 'src', 'data', '100yearmap', '20s-jan-aug-employment.json'),
    JSON.stringify({
      무엇: '20대(20~29세) 취업자, 1~8월 누적 월평균 전년동기대비',
      만든날: 오늘(),
      최신년: 최신년,
      출처,
      보도대조: {
        인용문: '2026-09-13 발표 기사 — "올해 1∼8월 20대 취업자는 월 평균 327만9천명으로 지난해 같은 기간(347만2천명)보다 19만3천명 감소했다"',
        인용_올해_만명: 327.9,
        인용_작년_만명: 347.2,
        인용_감소_만명: 19.3,
        재계산_올해_만명: Math.round(올해평균.평균) / 10,
        재계산_작년_만명: Math.round(작년평균.평균) / 10,
        재계산_감소_만명: 감소_만명,
      },
      올해_1_8월_평균_천명: 올해평균.평균,
      올해_1_8월_각월_천명: 올해평균.여덟달,
      작년_1_8월_평균_천명: 작년평균.평균,
      작년_1_8월_각월_천명: 작년평균.여덟달,
      덮는범위: '20~29세 취업자 «수»의 1~8월 누적 평균만 비교했다 — 옆 파일(youth-employment-streak.json, 15~29세·매달 YoY·연속개월수)과 나이 구간·계산법이 다르니 섞어 인용하지 않는다. 감소의 원인(인구 자체 감소 vs 고용 악화)은 이 표로 못 가른다.',
    }, null, 1),
  );
  console.log('\n저장했다 — src/data/100yearmap/20s-jan-aug-employment.json');
}
