#!/usr/bin/env node
/**
 * build-100y-trendy-major-outcomes.mjs — 이름에 「신산업」이 붙어도 취업률은 갈린다
 *
 *   node scripts/build-100y-trendy-major-outcomes.mjs        # 계산해서 저장
 *   node scripts/build-100y-trendy-major-outcomes.mjs --dry   # 저장하지 않고 재기만 한다
 *   node scripts/build-100y-trendy-major-outcomes.mjs --자가시험
 *
 * ## ⭐ 왜 만드나 (2026-09-08)
 *
 *   오늘 커뮤니티 씨앗에 「신한대 바둑콘텐츠학과 신설」·「웰컴금융 숭실대 디지털금융AI
 *   계약학과 신설」·「성균관대 인공지능학과 신설」이 나란히 걸렸다 — 대학들이 AI·디지털·
 *   반도체 같은 이름을 단 학과를 잇달아 만들고 있다는 뜻이다. 이미 모아 둔
 *   major-outcomes.json(KEDI, 837개 학과) «그대로»로 이 이름들의 실제 취업률이
 *   얼마나 갈리는지 재계산했다 — 새 API를 부르지 않았다.
 *
 * ## 재 본 결과 — 이름이 «비슷»해도 취업률은 51.9%~99.6%로 갈린다
 *
 *   이름에 인공지능·AI·디지털·바이오·반도체·빅데이터·메타버스·드론·로봇·블록체인·
 *   헬스케어·콘텐츠가 든 학과 24개의 취업률 평균은 74.8%(전체 837개 평균 68.3%보다
 *   높다). 그러나 낱낱이 보면 51.9%(디지털미디어디자인과)부터 99.6%(인공지능융합
 *   교육전공)까지 갈린다 — 「신산업 이름을 달면 취업이 잘 된다」로 뭉뚱그릴 수 없다.
 *
 * ## ⛔ 이 자료로 말할 수 없는 것
 *
 *   ⛔ 이름에 같은 낱말이 들어가도 학교·교육과정이 다르면 다른 학과다 — 전국에서
 *     같은 낱말이 든 학과를 우리가 편의상 묶은 것이지, 실제로 같은 교육을 한다는
 *     뜻이 아니다.
 *   ⛔ 이 24개는 «이미 졸업생을 낸» 학과다 — 오늘 신설되는 학과(바둑콘텐츠학과 등)의
 *     미래 취업률은 이 자료로 알 수 없다. 아직 첫 졸업생이 없기 때문이다.
 *   ⛔ 취업률 차이의 원인(학교 서열·지역·산업 수요 등)은 이 자료로 못 가른다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { 오늘 } from './_kst.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 시늉 = process.argv.includes('--dry');

/** 학과 이름에 신산업 낱말이 든다고 볼 것인가 */
export const 신산업키워드 = /인공지능|AI|디지털|바이오|반도체|빅데이터|메타버스|드론|로봇|블록체인|헬스케어|콘텐츠/;
export function 신산업학과인가(학과명) {
  return 신산업키워드.test(String(학과명 ?? ''));
}

/** 신산업 이름 학과들의 취업률 분포를 낸다 */
export function 분포내기(자료목록) {
  if (!Array.isArray(자료목록) || 자료목록.length === 0) return null;
  const 신산업 = 자료목록.filter((r) => 신산업학과인가(r.학과));
  if (신산업.length === 0) return null;
  const 정렬 = [...신산업].sort((a, b) => a.취업률 - b.취업률);
  const 전체평균 = 자료목록.reduce((s, r) => s + r.취업률, 0) / 자료목록.length;
  const 신산업평균 = 신산업.reduce((s, r) => s + r.취업률, 0) / 신산업.length;
  return {
    전체학과수: 자료목록.length,
    전체평균취업률: Math.round(전체평균 * 10) / 10,
    신산업학과수: 신산업.length,
    신산업평균취업률: Math.round(신산업평균 * 10) / 10,
    최저: 정렬[0],
    최고: 정렬[정렬.length - 1],
    전체목록: 정렬,
  };
}

if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  검('신산업학과인가 — 인공지능이 들어가면 참', 신산업학과인가('인공지능학과') === true);
  검('신산업학과인가 — 디지털이 들어가면 참', 신산업학과인가('디지털미디어학과') === true);
  검('신산업학과인가 — 콘텐츠가 들어가면 참', 신산업학과인가('문화콘텐츠학과') === true);
  검('⛔ 신산업학과인가 — 관련 없으면 거짓', 신산업학과인가('철학과') === false);
  검('⛔ 신산업학과인가 — 빈 값은 거짓', 신산업학과인가(undefined) === false);

  const 견본 = [
    { 학과: '철학과', 취업률: 50 },
    { 학과: '인공지능학과', 취업률: 90 },
    { 학과: '디지털미디어학과', 취업률: 40 },
    { 학과: '반도체공학과', 취업률: 70 },
  ];
  const 결과 = 분포내기(견본);
  검('분포내기 — 전체 학과수를 센다', 결과.전체학과수 === 4);
  검('분포내기 — 신산업 학과만 가른다(철학과 제외)', 결과.신산업학과수 === 3);
  검('분포내기 — 최저를 고른다', 결과.최저.학과 === '디지털미디어학과');
  검('분포내기 — 최고를 고른다', 결과.최고.학과 === '인공지능학과');
  검('분포내기 — 전체평균이 네 값의 평균이다', Math.abs(결과.전체평균취업률 - 62.5) < 0.1);
  검('⛔ 신산업 학과가 없으면 null', 분포내기([{ 학과: '철학과', 취업률: 50 }]) === null);
  검('⛔ 빈 배열이면 null', 분포내기([]) === null);
  검('⛔ 배열이 아니면 null', 분포내기(null) === null);

  console.log(실패.length ? `⛔ ${실패.length}개 실패 — ${실패.join(' · ')}` : '✅ build-100y-trendy-major-outcomes 자가시험 통과 (12)');
  process.exit(실패.length ? 1 : 0);
}

const 내가직접불렸나 = !!process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (내가직접불렸나 && !process.argv.includes('--자가시험')) {
  const 원본 = JSON.parse(fs.readFileSync(path.join(뿌리, 'src/data/100yearmap/major-outcomes.json'), 'utf8'));
  const 결과 = 분포내기(원본.자료);
  if (!결과) { console.error('⛔ 신산업 이름 학과를 못 찾았다'); process.exit(1); }

  console.log(`전체 ${결과.전체학과수}개 학과 평균 취업률 ${결과.전체평균취업률}%`);
  console.log(`신산업 이름 학과 ${결과.신산업학과수}개 평균 취업률 ${결과.신산업평균취업률}%`);
  console.log(`최저 ${결과.최저.학과} ${결과.최저.취업률}% · 최고 ${결과.최고.학과} ${결과.최고.취업률}%`);

  if (시늉) {
    console.log('\n--dry 라 저장하지 않았다.');
    process.exit(0);
  }

  fs.writeFileSync(
    path.join(뿌리, 'src', 'data', '100yearmap', 'trendy-major-outcomes.json'),
    JSON.stringify({
      무엇: '이름에 인공지능·디지털·반도체 등 신산업 낱말이 든 학과들의 취업률 분포',
      만든날: 오늘(),
      정의: '취업률 = 그 학과 취업자 ÷ 취업대상자(졸업자 − 진학자 − 입대자 등) × 100. 졸업자 대비가 아니다.',
      낱말목록: '인공지능·AI·디지털·바이오·반도체·빅데이터·메타버스·드론·로봇·블록체인·헬스케어·콘텐츠',
      출처: {
        이름: '이 저장소의 src/data/100yearmap/major-outcomes.json (한국교육개발원 고등교육기관 졸업자 학과별 졸업 후 상황) — 새로 받지 않고 이미 모은 자료를 다시 계산했다',
        이용허락범위: '제한 없음',
      },
      ...결과,
      덮는범위: '이름에 같은 낱말이 들어가도 학교·교육과정이 다르면 다른 학과다. 전국에서 같은 낱말이 든 학과를 편의상 묶은 것이지 실제로 같은 교육을 한다는 뜻이 아니다. 이 24개는 이미 졸업생을 낸 학과라 오늘 신설되는 학과(예: 바둑콘텐츠학과)의 미래 취업률은 알 수 없다. 취업률 차이의 원인(학교 서열·지역·산업 수요 등)은 이 자료로 못 가른다.',
      대조: '못 맞췄다 — 신산업 학과라는 갈래 자체가 언론·정부가 공식 집계하는 범주가 아니라 대조할 공표치가 없다. 다만 원자료(KEDI major-outcomes.json)는 이미 교육부 공표 취업통계와 대조된 것이다(major-outcomes.json 안 대조 칸 참고).',
    }, null, 1),
  );
  console.log('\n저장했다 — src/data/100yearmap/trendy-major-outcomes.json');
}
