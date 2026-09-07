#!/usr/bin/env node
/**
 * /100y/closed-universities — 문 닫은 대학, 2000년 이후 몇 곳인가
 *
 * ⭐ 왜 만드나 (2026-09-07)
 *   오늘 커뮤니티 씨앗에 「'80% 선발' 수시 원서접수」·「지방 국립대 등록금 0원」 등
 *   대입 정원·지역대학 위기 관련 기사가 여럿 걸렸다. 이미 8번이 모아 둔
 *   closed-universities.json(한국사학진흥재단, 22곳, 2026-08-10 실측)을 새로
 *   받지 않고 연대·지역·법인상태로만 다시 묶었다 — 오늘치 원자료 수집 없음.
 *
 * ⛔ 이 표는 "폐교 원인"을 재지 않는다 — 언제·어디서 닫혔는지만 보여준다.
 *   인구 감소(→/college-age-population)와 나란히 놓을 수는 있어도, 그것이
 *   폐교의 원인이라고 이 자료가 증명하지 않는다.
 *
 *   node scripts/build-100y-closed-universities.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 오늘 } from './_kst.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const 원본 = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'src/data/100yearmap/closed-universities.json'), 'utf8'),
);

export function 연대(년) {
  const 십 = Math.floor(년 / 10) * 10;
  return `${십}년대`;
}

export function 시도만(지역) {
  return 지역.split(' ')[0];
}

export function 묶기(자료) {
  const 연대별 = {};
  const 시도별 = {};
  const 법인상태별 = {};
  const 구분별 = {};
  for (const r of 자료) {
    const 연 = 연대(r.폐교년도);
    연대별[연] = (연대별[연] || 0) + 1;
    const 시 = 시도만(r.지역);
    시도별[시] = (시도별[시] || 0) + 1;
    법인상태별[r.법인상태] = (법인상태별[r.법인상태] || 0) + 1;
    구분별[r.구분] = (구분별[r.구분] || 0) + 1;
  }
  return { 연대별, 시도별, 법인상태별, 구분별 };
}

if (process.argv.includes('--selftest')) {
  const 본다 = (말, 참) => { console.log(참 ? '✅' : '🔴', 말); if (!참) process.exitCode = 1; };

  본다('① 연대 — 2012는 2010년대', 연대(2012) === '2010년대');
  본다('② 연대 — 2000은 2000년대', 연대(2000) === '2000년대');
  본다('③ 시도만 — "전남 나주"는 "전남"', 시도만('전남 나주') === '전남');
  본다('④ 시도만 — 광역시만 있어도 그대로("대구")', 시도만('대구') === '대구');

  const 묶음표본 = 묶기(원본.자료);
  const 합 = (o) => Object.values(o).reduce((a, b) => a + b, 0);
  본다('⑤ 연대별 합이 전체와 같다', 합(묶음표본.연대별) === 원본.전체);
  본다('⑥ 시도별 합이 전체와 같다', 합(묶음표본.시도별) === 원본.전체);
  본다('⑦ 법인상태별 합이 전체와 같다', 합(묶음표본.법인상태별) === 원본.전체);
  본다('⑧ 구분별 합이 전체와 같다', 합(묶음표본.구분별) === 원본.전체);
  본다('⑨ 전체가 22곳이다(원본 그대로)', 원본.전체 === 22);
  본다('⑩ 자료 배열 길이가 전체와 같다', 원본.자료.length === 원본.전체);

  console.log(`\n연대별 ${JSON.stringify(묶음표본.연대별)}`);
  process.exit();
}

const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'build-100y-closed-universities.mjs';
if (내가직접불렸나) {
  const 묶음 = 묶기(원본.자료);
  fs.writeFileSync(
    path.join(ROOT, 'src/data/100yearmap/closed-universities-view.json'),
    JSON.stringify({
      무엇: '문 닫은 대학·전문대학 — 2000년 이후, 연대·지역·법인상태별로 묶음',
      만든날: 오늘(),
      출처: 원본.출처,
      전체: 원본.전체,
      ...묶음,
      자료: 원본.자료,
      대조: 원본.대조,
      덮는범위: `${원본.덮는범위} ⛔ 이 표는 "폐교 원인"을 재지 않는다 — 언제·어디서 닫혔는지만 보여준다. 대학 입학 나이 인구 감소(/college-age-population)와 시기가 겹칠 뿐, 그것이 폐교의 원인이라고 이 자료가 증명하지 않는다.`,
    }, null, 1),
  );
  console.log('저장했다 — src/data/100yearmap/closed-universities-view.json');
  console.log(JSON.stringify(묶음, null, 1));
}
