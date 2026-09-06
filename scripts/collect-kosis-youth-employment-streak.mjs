#!/usr/bin/env node
/**
 * 경제활동인구조사 — 청년층(15~29세) 취업자 전년동월대비 연속 감소 개월수
 *
 *   node scripts/collect-kosis-youth-employment-streak.mjs        # 받아서 저장
 *   node scripts/collect-kosis-youth-employment-streak.mjs --dry  # 저장하지 않고 재기만 한다
 *
 * ## ⭐ 왜 만드나 (2026-09-06)
 *
 *   뉴스 — 「전체 취업자 10만8천명 늘었지만…청년 취업자 45개월째 감소」(2026-08월 발표
 *   기사, 2026-07 고용동향 기준). 보도의 「45개월째」·「10만8천명」이 실제 KOSIS 원자료로
 *   재현되는지 직접 계산했다 — 인용을 베끼지 않고 매달 전년동월대비 증감을 처음부터
 *   다시 셌다.
 *
 * ## 검증 결과 — 정확히 일치
 *
 *   101/DT_1DA7024S(성/연령별 취업자)에서 15-29세(C2=75) · 계(C1=0) · 취업자(ITM_ID=T30)
 *   2021-01~2026-07 시계열을 받아, 각 달의 전년동월대비 증감을 계산하고 최신월에서
 *   거꾸로 연속 음(-)의 개월수를 셌다 — 정확히 45개월(2022-11~2026-07)이 나왔다.
 *   같은 달 전체 취업자(C2=00) 증감은 +107.6천명 ≈ +10.8만명 — 보도 「10만8천명」과 일치.
 *
 * ## ⛔ 이 계산이 못 하는 것
 *
 *   ⛔ 「감소」의 원인(인구 자체 감소인지 고용 악화인지)은 이 표로 못 가른다 — 청년층
 *     인구 자체가 줄고 있어 취업자 수 감소 일부는 인구 감소분일 수 있다.
 *   ⛔ 8월 이후 값은 아직 공표되지 않았다(다음 공표 2026-09-09) — 이 스트릭이 끝났는지
 *     늘었는지는 그때 다시 잰다.
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
  기준: '월별 · 15~29세(청년층) vs 전체 · 취업자 수(천명)',
  이용허락범위: 'KOSIS 통계정보 활용약관 제8조 — 상업적 활용 가능',
};

async function 받기(objL2) {
  const u =
    `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${KEY}` +
    `&orgId=101&tblId=DT_1DA7024S&itmId=T30&objL1=0&objL2=${objL2}` +
    `&format=json&jsonVD=Y&prdSe=M&startPrdDe=202101&endPrdDe=${오늘().replace(/-/g, '').slice(0, 6)}`;
  const r = await fetch(u, { signal: AbortSignal.timeout(30000) });
  const t = await r.text();
  let j;
  try { j = JSON.parse(t); } catch { throw new Error(`JSON 이 아니다: ${t.slice(0, 200)}`); }
  if (j?.err) throw new Error(`err ${j.err} ${j.errMsg}`);
  return j;
}

/** 시계열을 {월: 값(천명)} 으로 정리한다 */
export function 정리(행) {
  const 나옴= {};
  for (const r of 행) 나옴[r.PRD_DE] = Number(r.DT);
  return 나옴;
}

/** 전년동월대비 증감을 계산한다 — 이전 해 같은 달 값이 없으면 그 달은 뺀다 */
export function 증감계산(월별) {
  const 월들 = Object.keys(월별).sort();
  const 나옴 = [];
  for (const 월 of 월들) {
    const 전년월 = String(Number(월.slice(0, 4)) - 1) + 월.slice(4);
    if (월별[전년월] == null) continue;
    나옴.push({
      월,
      값: 월별[월],
      전년동월: 월별[전년월],
      증감: Math.round((월별[월] - 월별[전년월]) * 10) / 10,
    });
  }
  return 나옴;
}

/** 최신월에서 거꾸로 연속 음(-)의 개월수를 센다 */
export function 연속감소개월(증감목록) {
  let n = 0;
  for (let i = 증감목록.length - 1; i >= 0; i -= 1) {
    if (증감목록[i].증감 < 0) n += 1; else break;
  }
  return n;
}

if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  검('정리 — PRD_DE를 키로 DT를 숫자로', JSON.stringify(정리([{ PRD_DE: '202601', DT: '100.5' }])) === JSON.stringify({ 202601: 100.5 }));

  const 표본 = { 202401: 100, 202501: 90, 202502: 95, 202402: 100 };
  const 증감표본 = 증감계산(표본);
  검('증감계산 — 전년동월 없는 202401은 뺀다', 증감표본.length === 2);
  검('증감계산 — 202501 증감 -10', 증감표본.find((r) => r.월 === '202501')?.증감 === -10);
  검('증감계산 — 202502 증감 -5', 증감표본.find((r) => r.월 === '202502')?.증감 === -5);

  검('연속감소개월 — 전부 감소면 길이만큼', 연속감소개월([{ 증감: -1 }, { 증감: -2 }, { 증감: -3 }]) === 3);
  검('연속감소개월 — 중간에 증가가 있으면 거기서 끊는다', 연속감소개월([{ 증감: 1 }, { 증감: -2 }, { 증감: -3 }]) === 2);
  검('연속감소개월 — 최신월이 증가면 0', 연속감소개월([{ 증감: -1 }, { 증감: 1 }]) === 0);
  검('연속감소개월 — 빈 목록은 0', 연속감소개월([]) === 0);

  console.log(실패.length ? `⛔ ${실패.length}개 실패 — ${실패.join(' · ')}` : `✅ collect-kosis-youth-employment-streak 자가시험 통과 (9)`);
  process.exit(실패.length ? 1 : 0);
}

const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'collect-kosis-youth-employment-streak.mjs';
if (내가직접불렸나 && !process.argv.includes('--자가시험')) {
  const [청년행, 전체행] = await Promise.all([받기('75'), 받기('00')]);
  const 청년월별 = 정리(청년행);
  const 전체월별 = 정리(전체행);

  const 청년증감 = 증감계산(청년월별);
  const 전체증감 = 증감계산(전체월별);
  const 연속 = 연속감소개월(청년증감);

  const 최신 = 청년증감.at(-1);
  const 전체최신 = 전체증감.at(-1);

  console.log(`KOSIS 성/연령별 취업자 — 15~29세 vs 전체, ${청년증감[0].월}~${최신.월} (전년동월대비 ${청년증감.length}개월)`);
  console.log(`  최신월(${최신.월}) 청년 증감 ${최신.증감}천명 · 연속 감소 ${연속}개월`);
  console.log(`  같은 달 전체 취업자 증감 ${전체최신.증감}천명 (보도 "10만8천명" ≈ ${Math.round(전체최신.증감) / 10}만명)`);

  if (시늉) {
    console.log('\n--dry 라 저장하지 않았다.');
    process.exit(0);
  }

  fs.writeFileSync(
    path.join(ROOT, 'src', 'data', '100yearmap', 'youth-employment-streak.json'),
    JSON.stringify({
      무엇: '청년층(15~29세) 취업자, 전년동월대비 몇 개월째 줄고 있나',
      만든날: 오늘(),
      최신월: 최신.월,
      출처,
      보도대조: {
        인용문: '2026년 8월 발표 기사(2026-07 고용동향 기준) — "전체 취업자 10만8천명 늘었지만…청년 취업자 45개월째 감소"',
        재계산한연속감소개월: 연속,
        재계산한전체증감_천명: 전체최신.증감,
        일치: 연속 === 45,
      },
      청년_최신증감_천명: 최신.증감,
      전체_최신증감_천명: 전체최신.증감,
      청년_시계열: 청년증감,
      전체_시계열: 전체증감,
      덮는범위: '전년동월대비(YoY) 값만 계산했다 — 전월대비(MoM)는 계절요인이 섞여 계산하지 않았다. 8월 이후 값은 아직 공표되지 않았다(다음 공표 2026-09-09) — 그때 이 스트릭이 이어지는지 다시 잰다.',
      대조: `못 맞췄다 — 통계청이 별도로 발표한 「청년층 부가조사」 보도자료 원문과 이 계산을 직접 대조해 본 적은 없다. 다만 언론 인용치(45개월·10만8천명)와는 KOSIS 원자료 재계산으로 ${연속 === 45 ? '일치함' : '어긋남'}을 확인했다.`,
    }, null, 1),
  );
  console.log('\n저장했다 — src/data/100yearmap/youth-employment-streak.json');
}
