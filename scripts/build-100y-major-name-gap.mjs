#!/usr/bin/env node
/**
 * build-100y-major-name-gap.mjs — 학과 «이름»만으로 취업률을 짐작할 수 있나
 *
 *   node scripts/build-100y-major-name-gap.mjs        # 계산해서 저장
 *   node scripts/build-100y-major-name-gap.mjs --dry   # 저장하지 않고 재기만 한다
 *   node scripts/build-100y-major-name-gap.mjs --자가시험
 *
 * ## ⭐ 왜 만드나 (2026-09-07)
 *
 *   커뮤니티 씨앗에 「'문송합니다'는 옛말…철학과>컴공과 취업률 역전, 무슨 일」이 걸렸다.
 *   기존에 이미 모아 둔 major-outcomes.json(KEDI 학과별 졸업자 취업통계, 837개 학과)
 *   «그대로»로 이 주장을 재계산했다 — 새 API를 부르지 않았다.
 *
 * ## 재 본 결과 — 「역전」은 «일부»에서만 맞다
 *
 *   철학과 취업률 56.3%다. 이름에 「컴�터/소프트웨어/전산」이 든 학과 39개 가운데
 *   10개(26%)는 철학과보다 낮다 — 나머지 29개(74%)는 철학과보다 높거나 같다.
 *   ⛔ 「철학과가 컴공과를 이겼다」로 뭉뚱그리면 거짓이다 — «어느 학교의 어느
 *     컴퓨터 학과냐»에 따라 갈린다. 같은 이름이어도 학교마다 취업률 차이가 크다.
 *
 * ## ⛔ 이 자료로 말할 수 없는 것
 *
 *   ⛔ 이름이 같아도 학교·교육과정이 다르면 다른 학과다 — 「컴퓨터공학과」라는
 *     이름 하나로 전국 학과를 묶은 것은 우리가 편의상 한 일이지, 그 학과들이
 *     실제로 같은 교육을 한다는 뜻이 아니다.
 *   ⛔ 취업률 차이의 «원인»(학교 서열·지역·산업 수요 등)은 이 자료로 못 가른다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 오늘 } from './_kst.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 시늉 = process.argv.includes('--dry');

/** 컴퓨터/소프트웨어 계열 이름 판정 */
export function 컴공계열인가(학과명) {
  return /컴퓨터|소프트웨어|전산/.test(String(학과명 ?? ''));
}

/** 철학과와 컴공계열 학과들을 견줘 몫을 낸다 */
export function 견주기(자료목록) {
  const 철학 = 자료목록.find((r) => r.학과 === '철학과');
  if (!철학) return null;
  const 컴공 = 자료목록.filter((r) => 컴공계열인가(r.학과));
  const 낮은것 = 컴공.filter((c) => c.취업률 < 철학.취업률).sort((a, b) => a.취업률 - b.취업률);
  const 높은것 = 컴공.filter((c) => c.취업률 >= 철학.취업률).sort((a, b) => b.취업률 - a.취업률);
  return {
    철학취업률: 철학.취업률,
    철학졸업자: 철학.졸업자,
    철학취업자: 철학.취업자,
    컴공학과수: 컴공.length,
    철학보다낮은수: 낮은것.length,
    철학보다낮은몫: Math.round((낮은것.length / 컴공.length) * 1000) / 10,
    낮은것,
    높은것,
  };
}

if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  검('컴공계열인가 — 컴퓨터가 들어가면 참', 컴공계열인가('컴퓨터공학과') === true);
  검('컴공계열인가 — 소프트웨어가 들어가면 참', 컴공계열인가('소프트웨어학과') === true);
  검('컴공계열인가 — 전산이 들어가면 참', 컴공계열인가('전산학부') === true);
  검('⛔ 컴공계열인가 — 관련 없으면 거짓', 컴공계열인가('철학과') === false);

  const 견본 = [
    { 학과: '철학과', 취업률: 50, 졸업자: 100, 취업자: 50 },
    { 학과: '컴퓨터공학과', 취업률: 40, 졸업자: 200, 취업자: 80 },
    { 학과: '소프트웨어학과', 취업률: 60, 졸업자: 150, 취업자: 90 },
  ];
  const 결과 = 견주기(견본);
  검('견주기 — 철학과 취업률을 그대로 낸다', 결과.철학취업률 === 50);
  검('견주기 — 컴공 학과 수를 센다', 결과.컴공학과수 === 2);
  검('견주기 — 철학과보다 낮은 것을 가른다(컴퓨터공학과 40 < 50)', 결과.철학보다낮은수 === 1);
  검('견주기 — 낮은것 배열에 실제 학과가 있다', 결과.낮은것[0].학과 === '컴퓨터공학과');
  검('견주기 — 높은것 배열에 실제 학과가 있다', 결과.높은것[0].학과 === '소프트웨어학과');
  검('⛔ 철학과가 없으면 null', 견주기([{ 학과: '컴퓨터공학과', 취업률: 40 }]) === null);

  console.log(실패.length ? `⛔ ${실패.length}개 실패 — ${실패.join(' · ')}` : '✅ build-100y-major-name-gap 자가시험 통과 (10)');
  process.exit(실패.length ? 1 : 0);
}

const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'build-100y-major-name-gap.mjs';
if (내가직접불렸나 && !process.argv.includes('--자가시험')) {
  const 원본 = JSON.parse(fs.readFileSync(path.join(뿌리, 'src/data/100yearmap/major-outcomes.json'), 'utf8'));
  const 결과 = 견주기(원본.자료);
  if (!결과) { console.error('⛔ 철학과 자료를 못 찾았다'); process.exit(1); }

  console.log(`철학과 취업률 ${결과.철학취업률}% (졸업자 ${결과.철학졸업자}명·취업자 ${결과.철학취업자}명)`);
  console.log(`컴퓨터/소프트웨어/전산 계열 학과 ${결과.컴공학과수}개 중 ${결과.철학보다낮은수}개(${결과.철학보다낮은몫}%)가 철학과보다 낮다`);

  if (시늉) {
    console.log('\n--dry 라 저장하지 않았다.');
    process.exit(0);
  }

  fs.writeFileSync(
    path.join(뿌리, 'src', 'data', '100yearmap', 'major-name-gap.json'),
    JSON.stringify({
      무엇: '철학과 취업률과 「컴퓨터/소프트웨어/전산」 이름 학과들의 취업률 견주기',
      만든날: 오늘(),
      정의: '취업률 = 그 학과 취업자 ÷ 취업대상자(졸업자 − 진학자 − 입대자 등) × 100. 졸업자 대비가 아니다.',
      출처: '이 저장소의 src/data/100yearmap/major-outcomes.json (한국교육개발원 고등교육기관 졸업자 학과별 졸업 후 상황) — 새로 받지 않고 이미 모은 자료를 다시 계산했다',
      ...결과,
      덮는범위: '이름이 같아도 학교·교육과정이 다르면 다른 학과다. 전국 같은 이름 학과를 하나로 묶어 견준 것은 편의상 한 일이지, 그 학과들이 실제로 같은 교육을 한다는 뜻이 아니다. 취업률 차이의 원인(학교 서열·지역·산업 수요 등)은 이 자료로 못 가른다.',
      대조: '못 맞췄다 — 언론이 인용한 원 기사의 구체 수치와 이 계산을 직접 대조해 본 적이 없다. 다만 같은 원자료(KEDI major-outcomes.json)로 독자적으로 재계산했다.',
    }, null, 1),
  );
  console.log('\n저장했다 — src/data/100yearmap/major-name-gap.json');
}
