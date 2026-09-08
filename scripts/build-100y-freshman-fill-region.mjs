/**
 * build-100y-freshman-fill-region.mjs
 *
 * 이슈  2026-09-08 — 커뮤니티 씨앗 「지방국립대 '무상 교육'에 입시판 지각변동…
 *       사립대는 '연쇄 고사' 울분」과 오늘 만든 /csat-applicant-mix(수능 지원자
 *       재학생↓·N수생↑)·/college-age-population(18세 인구 감소)이 가리키는 같은
 *       배경 — 학령인구가 줄면 그 충격이 어디에 먼저 닿는가. 오늘 대학알리미
 *       지표 넷(정원미달·취업률·중도탈락률·전임교원확보율)을 전부 국공립/사립
 *       축으로 다뤘으니, 다섯 번째 지표(신입생충원율)는 **수도권/비수도권** 축으로
 *       바꿔 다룬다 — 「지방대 위기」 논쟁의 실제 축과 더 가깝다.
 *
 * 새 API 호출 없음 — 이미 수집된 src/data/100yearmap/pages-university.json
 * (대학알리미, 377개 대학·캠퍼스)의 지역·신입생충원율 필드를 재계산만 한다.
 * ⛔ university-enrollment-fill.json(재학생충원율)과 다르다 — 이 자는 «신입생충원율»이다.
 *
 * 쓰는 법  node scripts/build-100y-freshman-fill-region.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const 원본길 = path.join(ROOT, 'src/data/100yearmap/pages-university.json');
const 낼길 = path.join(ROOT, 'src/data/100yearmap/freshman-fill-region.json');

const 수도권꼴 = new Set(['서울', '경기', '인천']);

function 중앙값(정렬된수들) {
  const n = 정렬된수들.length;
  if (n === 0) return null;
  return n % 2 ? 정렬된수들[(n - 1) / 2] : (정렬된수들[n / 2 - 1] + 정렬된수들[n / 2]) / 2;
}

export function 정리(대학목록) {
  const 수도권 = 대학목록.filter((x) => 수도권꼴.has(x.지역));
  const 비수도권 = 대학목록.filter((x) => x.지역 && !수도권꼴.has(x.지역));

  const 갈래재기 = (목록) => {
    const 값들 = 목록
      .filter((x) => x.신입생충원율 && typeof x.신입생충원율.값 === 'number')
      .map((x) => x.신입생충원율.값)
      .sort((a, b) => a - b);
    const 낮은곳수 = 값들.filter((v) => v < 90).length;

    return {
      곳수: 목록.length,
      잰곳: 값들.length,
      중앙값: 값들.length ? Math.round(중앙값(값들) * 10) / 10 : null,
      최소: 값들.length ? 값들[0] : null,
      최대: 값들.length ? 값들[값들.length - 1] : null,
      구십퍼센트미만: {
        곳수: 낮은곳수,
        전체: 값들.length,
        몫: 값들.length ? Math.round((낮은곳수 / 값들.length) * 1000) / 10 : null,
      },
    };
  };

  const 수도권재기 = 갈래재기(수도권);
  const 비수도권재기 = 갈래재기(비수도권);

  const 전체값들 = 대학목록
    .filter((x) => x.신입생충원율 && typeof x.신입생충원율.값 === 'number')
    .map((x) => x.신입생충원율.값);
  const 전국평균참고 = 대학목록.find((x) => x.신입생충원율?.전국평균 != null)?.신입생충원율.전국평균 ?? null;

  return {
    출처: {
      이름: '한국대학교육협의회 대학정보공시(대학알리미) — 이미 수집된 pages-university.json 재계산',
      이용허락범위: '제한 없음',
    },
    공시연도: 대학목록[0]?.공시연도 ?? null,
    정의: {
      신입생충원율: '대학알리미 공시 신입생충원율(값) = 신입생 등록자 수 ÷ 신입생 모집정원 × 100. 재학생충원율(전체 재적)과 다르다 — 그해 새로 들어온 학생만 잰다.',
      구십퍼센트미만_몫: '몫 = 신입생충원율이 90% 미만인 곳수 ÷ 그 갈래에서 신입생충원율을 잴 수 있는 곳수 × 100',
    },
    갈래기준: {
      수도권: [...수도권꼴],
      비수도권: '수도권 셋(서울·경기·인천)을 뺀 나머지 지역 전부',
    },
    전체: {
      곳수: 대학목록.length,
      잰곳: 전체값들.length,
      중앙값: 전체값들.length ? Math.round(중앙값([...전체값들].sort((a, b) => a - b)) * 10) / 10 : null,
      전국평균참고: 전국평균참고,
    },
    수도권: 수도권재기,
    비수도권: 비수도권재기,
    덮는범위: [
      '이 표는 2025년 한 시점의 스냅샷이다 — 여러 해의 추세를 이 표 하나로 볼 수 없다.',
      '수도권·비수도권 안에서도 학교마다 편차가 크다 — 갈래 중앙값이 개별 학교를 대표하지 않는다.',
      '신입생충원율이 낮은 원인(학령인구 감소·학과 구조조정·지역 선호 등)은 이 표로 가려낼 수 없다.',
      '신입생충원율 값이 없는 학교는 분모에서 뺐다 — 0으로 채우지 않았다.',
      '세종은 수도권으로 묶지 않았다 — 관행상 충청권으로 분류한다.',
    ],
    대조: '맞다 — 이 표의 모든 값은 pages-university.json에 이미 있던 대학알리미 공시치를 그대로 옮겨 지역별로 다시 묶고 중앙값만 계산했다. 새로 받은 값이 없다.',
  };
}

/* ── 자가시험 ─────────────────────────────────────────── */
if (process.argv.includes('--selftest')) {
  const 본다 = (말, 참) => { console.log(참 ? '✅' : '🔴', 말); if (!참) process.exitCode = 1; };

  const 가짜 = [
    { title: '가짜서울A', 지역: '서울', 공시연도: '2025', 신입생충원율: { 값: 65, 전국평균: 98.9 } },
    { title: '가짜경기B', 지역: '경기', 공시연도: '2025', 신입생충원율: { 값: 100 } },
    { title: '가짜인천C', 지역: '인천', 공시연도: '2025', 신입생충원율: { 값: 95 } },
    { title: '가짜강원A', 지역: '강원', 공시연도: '2025', 신입생충원율: { 값: 55 } },
    { title: '가짜전남B', 지역: '전남', 공시연도: '2025', 신입생충원율: { 값: 95 } },
    { title: '값없는지방', 지역: '경북', 공시연도: '2025' },
  ];
  const 결과 = 정리(가짜);

  본다('① 수도권 3곳', 결과.수도권.곳수 === 3);
  본다('② 비수도권 3곳', 결과.비수도권.곳수 === 3);
  본다('③ 수도권 잰 곳 3곳', 결과.수도권.잰곳 === 3);
  본다('④ 비수도권 잰 곳 2곳(값없는지방 제외)', 결과.비수도권.잰곳 === 2);
  본다('⑤ 수도권 중앙값 95(65·95·100 중앙)', 결과.수도권.중앙값 === 95);
  본다('⑥ 수도권 90%미만 1곳(65)', 결과.수도권.구십퍼센트미만.곳수 === 1);
  본다('⑦ 비수도권 90%미만 1곳(55)', 결과.비수도권.구십퍼센트미만.곳수 === 1);
  본다('⑧ 정의 필드에 몫 기준이 있다(check-100y-basis 대응)', typeof 결과.정의.구십퍼센트미만_몫 === 'string' && /÷/.test(결과.정의.구십퍼센트미만_몫));
  본다('⑨ 출처.이용허락범위가 중첩돼 있다', 결과.출처.이용허락범위 === '제한 없음');
  본다('⑩ 대조 필드가 있다', typeof 결과.대조 === 'string' && 결과.대조.length > 0);
  본다('⑪ 덮는범위가 배열이다', Array.isArray(결과.덮는범위) && 결과.덮는범위.length > 0);
  본다('⑫ 순위·등수 낱말을 안 쓴다', !JSON.stringify(결과).match(/순위|등수|랭킹|몇 위|꼴찌|1위/));

  console.log('\n실제 원자료로도 돌려 본다…');
  const 진짜자료raw = JSON.parse(fs.readFileSync(원본길, 'utf8'));
  const 진짜자료 = Object.values(진짜자료raw);
  const 진짜결과 = 정리(진짜자료);
  console.log(`수도권 ${진짜결과.수도권.곳수}곳(중앙값 ${진짜결과.수도권.중앙값}% · 90%미만 ${진짜결과.수도권.구십퍼센트미만.몫}%) · `
    + `비수도권 ${진짜결과.비수도권.곳수}곳(중앙값 ${진짜결과.비수도권.중앙값}% · 90%미만 ${진짜결과.비수도권.구십퍼센트미만.몫}%)`);
  process.exit();
}

/* 🔴 여기부터가 «부르면 도는 몸»이다 */
const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'build-100y-freshman-fill-region.mjs';
if (내가직접불렸나) {
  const 원자료raw = JSON.parse(fs.readFileSync(원본길, 'utf8'));
  const 원자료 = Object.values(원자료raw);
  const 결과 = 정리(원자료);
  fs.writeFileSync(낼길, JSON.stringify(결과, null, 2) + '\n', 'utf8');
  console.log('✅ 썼다 →', 낼길);
  console.log(`수도권 ${결과.수도권.곳수}곳(중앙값 ${결과.수도권.중앙값}%) · 비수도권 ${결과.비수도권.곳수}곳(중앙값 ${결과.비수도권.중앙값}%)`);
}
