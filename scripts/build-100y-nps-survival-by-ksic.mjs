#!/usr/bin/env node
/**
 * build-100y-nps-survival-by-ksic.mjs — 국민연금 사업장 생존기간을 KSIC 업종명으로 잰다
 *
 * [왜] 「브랜드평판 vs 실측 생존통계」 시리즈(안경·화장품·보험대리점 등)가 매번 같은 계산을
 *   손으로 다시 했다 — 화장품 편 provenance 에 "재현 스크립트 미보관"으로 적혀 있었다.
 *   같은 계산을 또 손으로 하지 않는다(강령④ — 규칙은 검사로 둔다).
 *
 * [검증] 화장품 편 실측값(n=43, 중앙값 2.5년, 1년내 37%, 3년내 53%)을 재현해 자가시험으로 고정했다.
 *
 * 쓰는 법 — node scripts/build-100y-nps-survival-by-ksic.mjs "<정확한 KSIC 업종명>"
 */
import fs from 'node:fs';

const 원본경로 = 'archive/raw/nps/workplaces-latest.csv';
const 열 = { 업종명: 14, 적용: 15, 탈퇴: 17, 상태: 3 };

function 날짜(s) {
  if (!s || s.length < 8) return null;
  const y = +s.slice(0, 4), m = +s.slice(5, 7), d = +s.slice(8, 10);
  if (!y) return null;
  return new Date(y, m - 1, d);
}

export function 계산(csv텍스트, 업종명) {
  const 줄들 = csv텍스트.split(/\r?\n/);
  const 생존년 = [];
  for (let i = 1; i < 줄들.length; i++) {
    const 칸 = 줄들[i].split(',');
    if (칸[열.업종명] === 업종명 && 칸[열.상태] === '2') {
      const a = 날짜(칸[열.적용]);
      const b = 날짜(칸[열.탈퇴]);
      if (a && b && b > a) 생존년.push((b - a) / (1000 * 3600 * 24 * 365.25));
    }
  }
  생존년.sort((a, b) => a - b);
  const n = 생존년.length;
  if (!n) return { n: 0, 중앙값: null, 일년내: null, 삼년내: null };
  const 중앙값 = n % 2 ? 생존년[(n - 1) / 2] : (생존년[n / 2 - 1] + 생존년[n / 2]) / 2;
  return {
    n,
    중앙값: Number(중앙값.toFixed(2)),
    일년내: Math.round(생존년.filter((x) => x <= 1).length / n * 100),
    삼년내: Math.round(생존년.filter((x) => x <= 3).length / n * 100),
  };
}

function 자가시험() {
  const 것 = [];
  const 자가 = (이름, 됐나) => 것.push({ 이름, 됐나 });

  /* 실물 헤더와 같은 자리에 값이 오도록 22칸짜리 행을 만든다(열.상태=3·업종명=14·적용=15·탈퇴=17) */
  const 행짓기 = (상태, 업종, 적용, 탈퇴) => {
    const 칸 = new Array(22).fill('');
    칸[열.상태] = 상태; 칸[열.업종명] = 업종; 칸[열.적용] = 적용; 칸[열.탈퇴] = 탈퇴;
    return 칸.join(',');
  };
  const 가짜 = [
    '헤더',
    행짓기('2', 'X업종', '2020-01-01', '2020-07-01'), // ~0.5년 — 1년·3년 둘 다 안
    행짓기('2', 'X업종', '2020-01-01', '2024-01-01'), // ~4.0년 — 1년·3년 둘 다 밖
    행짓기('1', 'X업종', '2020-01-01', ''),             // 상태1 — 안 셈
    행짓기('2', 'Y업종', '2020-01-01', '2022-01-01'),  // 다른 업종 — 안 섞임
  ].join('\n');
  const r = 계산(가짜, 'X업종');
  자가('X업종만 두 건 잡는다(Y업종·탈퇴안한것 제외)', r.n === 2);
  자가('중앙값 2.25년쯤((0.5+4.0)/2)', r.중앙값 !== null && Math.abs(r.중앙값 - 2.25) < 0.1);
  자가('1년내 50%(한 건만 1년 안)', r.일년내 === 50);
  자가('3년내 50%(한 건만 3년 안)', r.삼년내 === 50);
  자가('없는 업종명은 n=0', 계산(가짜, '없는업종').n === 0);

  console.log(`■ 자가시험 ${것.filter((x) => x.됐나).length}/${것.length}`);
  for (const x of 것.filter((x) => !x.됐나)) console.log(`  🔴 ${x.이름}`);
  return 것.every((x) => x.됐나);
}

const 내가직접불렸나 = process.argv[1] && process.argv[1].endsWith('build-100y-nps-survival-by-ksic.mjs');
if (내가직접불렸나) {
  if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);
  if (!자가시험()) { console.log('🔴 자가시험이 깨졌다 — 돌리지 않는다.'); process.exit(1); }

  const 업종명 = process.argv[2];
  if (!업종명) { console.error('⛔ 업종명을 인자로 준다. 예: node scripts/build-100y-nps-survival-by-ksic.mjs "보험 대리 및 중개업"'); process.exit(1); }

  const buf = fs.readFileSync(원본경로);
  const text = new TextDecoder('euc-kr', { fatal: false }).decode(buf);

  // 검증 — 화장품 편 실측값 재현
  const 화장품검증 = 계산(text, '화장품  비누 및 방향제 소매업');
  const 화장품기대 = { n: 43, 중앙값: 2.49, 일년내: 37, 삼년내: 53 };
  const 재현됨 = 화장품검증.n === 화장품기대.n && Math.abs(화장품검증.중앙값 - 화장품기대.중앙값) < 0.02
    && 화장품검증.일년내 === 화장품기대.일년내 && 화장품검증.삼년내 === 화장품기대.삼년내;
  console.log(`화장품 재현 검증: ${재현됨 ? '✅ 일치' : '🔴 불일치'} — ${JSON.stringify(화장품검증)} (기대 ${JSON.stringify(화장품기대)})`);
  if (!재현됨) { console.log('🔴 재현이 어긋난다 — 방식이 바뀐 것이다. 새 업종 계산을 믿지 않는다.'); process.exit(1); }

  console.log(`${업종명}: ${JSON.stringify(계산(text, 업종명))}`);
}
