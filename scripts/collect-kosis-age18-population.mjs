#!/usr/bin/env node
/**
 * 장래인구추계 — 대학 입학 나이(18세) 인구, 2015~2035
 *
 *   node scripts/collect-kosis-age18-population.mjs        # 받아서 저장
 *   node scripts/collect-kosis-age18-population.mjs --dry  # 저장하지 않고 재기만 한다
 *
 * ## ⭐ 왜 만드나 (2026-09-07)
 *
 *   오늘(9/7) 커뮤니티 우물 씨앗에 「'80% 선발' 수시 원서접수 시작」이 여러 번 걸렸다.
 *   대학들이 정원을 채우려 수시 비중을 키우는 배경에는 「대학에 갈 나이 인구 자체가
 *   준다」는 이야기가 흔히 따라붙는다 — 그 이야기를 짐작으로 옮기지 않고 통계청
 *   장래인구추계(101/DT_1BPA001)로 직접 재 봤다.
 *
 * ## 실측 결과 — 단조 감소가 아니다
 *
 *   18세 인구는 2015년 663,843명에서 2024년 437,706명까지 줄었다(−34.1%)가,
 *   2025~2026년은 오히려 늘고(456,675→484,688명), 2027년부터 다시 줄어든다.
 *   ⛔ 「해마다 줄고 있다」로 뭉뚱그리면 이 요철을 지운다 — 재 본 대로 적는다.
 *
 * ## ⛔ 이 자료로 말할 수 없는 것
 *
 *   ⛔ 이 표는 «장래인구추계»다 — 2015~2023년 값도 확정 통계(주민등록인구 등)가
 *     아니라 2022년 기준으로 다시 맞춘 모델값일 수 있다. 이 스크립트는 어느 해까지가
 *     «실측 기반»이고 어디부터 «가정 기반»인지 KOSIS 메타에서 구분해 내지 못했다 —
 *     못 가른 것은 못 갈랐다고 적는다.
 *   ⛔ 「수시 비중이 커진 원인이 인구 감소다」라고 이 자료가 증명하지 않는다 — 같은
 *     시기에 일어난 두 가지를 나란히 놓았을 뿐, 인과를 재지 않았다.
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
  이름: '국가데이터처 KOSIS · 통계청 「장래인구추계」(2022년 기준)',
  표: '101/DT_1BPA001 (성 및 연령별 추계인구, 1세별)',
  기준: '연도별 · 18세 · 전체(남녀 계) · 중위 추계(가정별 코드 1)',
  이용허락범위: 'KOSIS 통계정보 활용약관 제8조 — 상업적 활용 가능',
};

async function 받기() {
  const u =
    `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${KEY}` +
    '&orgId=101&tblId=DT_1BPA001&itmId=T10&objL1=1&objL2=0&objL3=1004' +
    '&format=json&jsonVD=Y&prdSe=Y&startPrdDe=2015&endPrdDe=2035';
  const r = await fetch(u, { signal: AbortSignal.timeout(30000) });
  const t = await r.text();
  let j;
  try { j = JSON.parse(t); } catch { throw new Error(`JSON 이 아니다: ${t.slice(0, 200)}`); }
  if (j?.err) throw new Error(`err ${j.err} ${j.errMsg}`);
  return j;
}

/** KOSIS 응답을 {년: 값} 으로 정리한다 */
export function 정리(행) {
  const 나옴 = {};
  for (const r of 행) 나옴[r.PRD_DE] = Number(r.DT);
  return 나옴;
}

/** 연도순 배열로 만들고, 전년대비 증감을 같이 낸다 */
export function 시계열만들기(년별) {
  const 년들 = Object.keys(년별).sort();
  return 년들.map((년, i) => {
    const 앞해 = 년들[i - 1];
    const 증감 = i === 0 ? null : Math.round((년별[년] - 년별[앞해]) * 10) / 10;
    return { 년, 값: 년별[년], 전년대비: 증감 };
  });
}

/** 최신 연도에서 거꾸로 몇 년째 전년대비 감소인지 센다 */
export function 최근연속감소(시계열) {
  let n = 0;
  for (let i = 시계열.length - 1; i >= 0; i -= 1) {
    if (시계열[i].전년대비 == null) break;
    if (시계열[i].전년대비 < 0) n += 1; else break;
  }
  return n;
}

if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  검('정리 — PRD_DE를 키로 DT를 숫자로', JSON.stringify(정리([{ PRD_DE: '2020', DT: '100' }])) === JSON.stringify({ 2020: 100 }));

  const 시계열표본 = 시계열만들기({ 2020: 100, 2021: 90, 2022: 95 });
  검('시계열만들기 — 첫 해는 전년대비 null', 시계열표본[0].전년대비 === null);
  검('시계열만들기 — 2021 전년대비 -10', 시계열표본[1].전년대비 === -10);
  검('시계열만들기 — 2022 전년대비 +5', 시계열표본[2].전년대비 === 5);

  검('최근연속감소 — 끝에서부터 셈', 최근연속감소(시계열만들기({ 2020: 100, 2021: 90, 2022: 80 })) === 2);
  검('최근연속감소 — 최신 해가 증가면 0', 최근연속감소(시계열만들기({ 2020: 100, 2021: 110 })) === 0);
  검('최근연속감소 — 요철이 있으면 최근 연속분만 센다',
    최근연속감소(시계열만들기({ 2020: 100, 2021: 120, 2022: 110, 2023: 90 })) === 2);

  console.log(실패.length ? `⛔ ${실패.length}개 실패 — ${실패.join(' · ')}` : '✅ collect-kosis-age18-population 자가시험 통과 (7)');
  process.exit(실패.length ? 1 : 0);
}

const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'collect-kosis-age18-population.mjs';
if (내가직접불렸나 && !process.argv.includes('--자가시험')) {
  const 행 = await 받기();
  const 년별 = 정리(행);
  const 시계열 = 시계열만들기(년별);
  const 연속감소 = 최근연속감소(시계열);

  const 최신 = 시계열.at(-1);
  const 최고 = 시계열.reduce((a, b) => (b.값 > a.값 ? b : a));
  const 최저 = 시계열.reduce((a, b) => (b.값 < a.값 ? b : a));

  console.log(`KOSIS 장래인구추계 18세 인구 — ${시계열[0].년}~${최신.년} (${시계열.length}개년)`);
  console.log(`  최고 ${최고.년}년 ${최고.값.toLocaleString()}명 · 최저 ${최저.년}년 ${최저.값.toLocaleString()}명`);
  console.log(`  최신(${최신.년}) 전년대비 ${최신.전년대비}명 · 최근 연속 감소 ${연속감소}년`);

  if (시늉) {
    console.log('\n--dry 라 저장하지 않았다.');
    process.exit(0);
  }

  fs.writeFileSync(
    path.join(ROOT, 'src', 'data', '100yearmap', 'age18-population.json'),
    JSON.stringify({
      무엇: '대학 입학 나이(18세) 인구, 2015~2035 — 장래인구추계',
      만든날: 오늘(),
      출처,
      최근연속감소년수: 연속감소,
      시계열,
      덮는범위: '이 표는 장래인구추계다 — 2015~2023년 값도 확정 통계가 아니라 2022년 기준으로 다시 맞춘 모델값일 수 있다. 어느 해까지가 실측 기반이고 어디부터 가정 기반인지 KOSIS 메타에서 구분해 내지 못했다.',
      대조: '못 맞췄다 — 통계청이 별도로 발표한 학령인구·대입정원 관련 보도자료와 이 표를 대조해 본 적이 없다.',
    }, null, 1),
  );
  console.log('\n저장했다 — src/data/100yearmap/age18-population.json');
}
