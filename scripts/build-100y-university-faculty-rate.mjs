/**
 * build-100y-university-faculty-rate.mjs
 *
 * 이슈  2026-09-08 — 커뮤니티 씨앗 「지방국립대 '무상 교육'에 입시판 지각변동…
 *       사립대는 '연쇄 고사' 울분」. 등록금 무상화 논쟁의 배경에는 국공립·사립의
 *       교육 여건 차이가 있다 — 그 중 하나가 대학알리미가 공시하는 «전임교원확보율»
 *       (전임교원 수가 필요 정원 대비 얼마나 채워졌나)이다.
 *
 * 새 API 호출 없음 — 이미 수집된 src/data/100yearmap/pages-university.json
 * (대학알리미, 377개 대학·캠퍼스)의 설립·전임교원확보율 필드를 재계산만 한다.
 * ⛔ university-founding-gap.json(재학생충원율)·university-dropout-rate.json(중도탈락률)과
 *   다르다 — 이 자는 «전임교원확보율»이다.
 *
 * 쓰는 법  node scripts/build-100y-university-faculty-rate.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const 원본길 = path.join(ROOT, 'src/data/100yearmap/pages-university.json');
const 낼길 = path.join(ROOT, 'src/data/100yearmap/university-faculty-rate.json');

const 국공립꼴 = new Set(['국립', '공립', '국립대법인', '특별법국립']);

function 중앙값(정렬된수들) {
  const n = 정렬된수들.length;
  if (n === 0) return null;
  return n % 2 ? 정렬된수들[(n - 1) / 2] : (정렬된수들[n / 2 - 1] + 정렬된수들[n / 2]) / 2;
}

export function 정리(대학목록) {
  const 국공립 = 대학목록.filter((x) => 국공립꼴.has(x.설립));
  const 사립 = 대학목록.filter((x) => x.설립 === '사립');

  const 갈래재기 = (목록) => {
    const 값들 = 목록
      .filter((x) => x.전임교원확보율 && typeof x.전임교원확보율.값 === 'number')
      .map((x) => x.전임교원확보율.값)
      .sort((a, b) => a - b);
    const 낮은곳수 = 값들.filter((v) => v < 70).length;

    return {
      곳수: 목록.length,
      잰곳: 값들.length,
      중앙값: 값들.length ? Math.round(중앙값(값들) * 10) / 10 : null,
      최소: 값들.length ? 값들[0] : null,
      최대: 값들.length ? 값들[값들.length - 1] : null,
      칠십퍼센트미만: {
        곳수: 낮은곳수,
        전체: 값들.length,
        몫: 값들.length ? Math.round((낮은곳수 / 값들.length) * 1000) / 10 : null,
      },
    };
  };

  const 국공립재기 = 갈래재기(국공립);
  const 사립재기 = 갈래재기(사립);

  const 전체값들 = 대학목록
    .filter((x) => x.전임교원확보율 && typeof x.전임교원확보율.값 === 'number')
    .map((x) => x.전임교원확보율.값);
  const 전국평균참고 = 대학목록.find((x) => x.전임교원확보율?.전국평균 != null)?.전임교원확보율.전국평균 ?? null;

  return {
    출처: {
      이름: '한국대학교육협의회 대학정보공시(대학알리미) — 이미 수집된 pages-university.json 재계산',
      이용허락범위: '제한 없음',
    },
    공시연도: 대학목록[0]?.공시연도 ?? null,
    정의: {
      전임교원확보율: '대학알리미 공시 전임교원확보율(값) = 전임교원 확보 수 ÷ 편제정원 기준 필요 전임교원 수 × 100. 100%면 필요 인원을 다 채운 것이다.',
      칠십퍼센트미만_몫: '몫 = 전임교원확보율이 70% 미만인 곳수 ÷ 그 갈래에서 전임교원확보율을 잴 수 있는 곳수 × 100',
    },
    전체: {
      곳수: 대학목록.length,
      잰곳: 전체값들.length,
      중앙값: 전체값들.length ? Math.round(중앙값([...전체값들].sort((a, b) => a - b)) * 10) / 10 : null,
      전국평균참고: 전국평균참고,
    },
    국공립: { ...국공립재기, 설립꼴: [...국공립꼴] },
    사립: 사립재기,
    덮는범위: [
      '이 표는 2025년 한 시점의 스냅샷이다 — 등록금 정책 변화 전후를 이 표 하나로 비교할 수 없다.',
      '국공립·사립 안에서도 학교마다 편차가 크다 — 갈래 중앙값이 개별 학교를 대표하지 않는다.',
      '전임교원확보율은 「교원 수」를 재는 것이지 강의·연구의 질을 직접 재지 않는다.',
      '전임교원확보율 값이 없는 학교는 분모에서 뺐다 — 0으로 채우지 않았다.',
      '「국공립」에는 국립·공립·국립대법인·특별법국립을 모두 묶었다 — 세부 설립 형태별 차이는 이 표로 못 가른다.',
    ],
    대조: '맞다 — 이 표의 모든 값은 pages-university.json에 이미 있던 대학알리미 공시치를 그대로 옮겨 설립별로 다시 묶고 중앙값만 계산했다. 새로 받은 값이 없다.',
  };
}

/* ── 자가시험 ─────────────────────────────────────────── */
if (process.argv.includes('--selftest')) {
  const 본다 = (말, 참) => { console.log(참 ? '✅' : '🔴', 말); if (!참) process.exitCode = 1; };

  const 가짜 = [
    { title: '가짜국립A', 설립: '국립', 공시연도: '2025', 전임교원확보율: { 값: 65, 전국평균: 89.6 } },
    { title: '가짜국립B', 설립: '공립', 공시연도: '2025', 전임교원확보율: { 값: 92 } },
    { title: '가짜국립C', 설립: '특별법국립', 공시연도: '2025', 전임교원확보율: { 값: 88 } },
    { title: '가짜사립A', 설립: '사립', 공시연도: '2025', 전임교원확보율: { 값: 55 } },
    { title: '가짜사립B', 설립: '사립', 공시연도: '2025', 전임교원확보율: { 값: 95 } },
    { title: '값없는사립', 설립: '사립', 공시연도: '2025' },
  ];
  const 결과 = 정리(가짜);

  본다('① 국공립 3곳', 결과.국공립.곳수 === 3);
  본다('② 사립 3곳', 결과.사립.곳수 === 3);
  본다('③ 국공립 잰 곳 3곳', 결과.국공립.잰곳 === 3);
  본다('④ 사립 잰 곳 2곳(값없는사립 제외)', 결과.사립.잰곳 === 2);
  본다('⑤ 국공립 중앙값 88(65·88·92 중앙)', 결과.국공립.중앙값 === 88);
  본다('⑥ 국공립 70%미만 1곳(65)', 결과.국공립.칠십퍼센트미만.곳수 === 1);
  본다('⑦ 사립 70%미만 1곳(55)', 결과.사립.칠십퍼센트미만.곳수 === 1);
  본다('⑧ 정의 필드에 몫 기준이 있다(check-100y-basis 대응)', typeof 결과.정의.칠십퍼센트미만_몫 === 'string' && /÷/.test(결과.정의.칠십퍼센트미만_몫));
  본다('⑨ 출처.이용허락범위가 중첩돼 있다', 결과.출처.이용허락범위 === '제한 없음');
  본다('⑩ 대조 필드가 있다', typeof 결과.대조 === 'string' && 결과.대조.length > 0);
  본다('⑪ 덮는범위가 배열이다', Array.isArray(결과.덮는범위) && 결과.덮는범위.length > 0);
  본다('⑫ 순위·등수 낱말을 안 쓴다', !JSON.stringify(결과).match(/순위|등수|랭킹|몇 위|꼴찌|1위/));

  console.log('\n실제 원자료로도 돌려 본다…');
  const 진짜자료raw = JSON.parse(fs.readFileSync(원본길, 'utf8'));
  const 진짜자료 = Object.values(진짜자료raw);
  const 진짜결과 = 정리(진짜자료);
  console.log(`국공립 ${진짜결과.국공립.곳수}곳(중앙값 ${진짜결과.국공립.중앙값}% · 70%미만 ${진짜결과.국공립.칠십퍼센트미만.몫}%) · `
    + `사립 ${진짜결과.사립.곳수}곳(중앙값 ${진짜결과.사립.중앙값}% · 70%미만 ${진짜결과.사립.칠십퍼센트미만.몫}%)`);
  process.exit();
}

/* 🔴 여기부터가 «부르면 도는 몸»이다 */
const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'build-100y-university-faculty-rate.mjs';
if (내가직접불렸나) {
  const 원자료raw = JSON.parse(fs.readFileSync(원본길, 'utf8'));
  const 원자료 = Object.values(원자료raw);
  const 결과 = 정리(원자료);
  fs.writeFileSync(낼길, JSON.stringify(결과, null, 2) + '\n', 'utf8');
  console.log('✅ 썼다 →', 낼길);
  console.log(`국공립 ${결과.국공립.곳수}곳(중앙값 ${결과.국공립.중앙값}%) · 사립 ${결과.사립.곳수}곳(중앙값 ${결과.사립.중앙값}%)`);
}
