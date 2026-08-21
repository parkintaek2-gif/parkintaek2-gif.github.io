#!/usr/bin/env node
/**
 * 파이프라인 A(이직·연봉·회사) — **자료 세 벌 + 경고문 한 벌을 한 곳에 모은다.**
 *
 *   node scripts/build-100y-pipeline-a-bundle.mjs
 *   node scripts/build-100y-pipeline-a-bundle.mjs --자가시험
 *
 * ## 왜 만들었나 (2번 지시 2026-08-22 · `docs/파이프라인-기획.md` A · 「2번 순서표: 8/22~ 켠다」)
 *
 *   ⛔ 지면을 새로 만드는 것이 아니다. **자료는 이미 있다** — 새로 모으지 않는다.
 *   할 일은 딱 둘 —
 *     ① 파이프라인 A 가 쓸 자료 세 벌이 **지금도 그 경로에 그 모양으로 있나**를 잰다
 *     ② 세 벌에 흩어진 경고문 + 이미 정정된 배수 셋을 **한 자리에 모은다**
 *       (다음에 지면을 만드는 사람이 같은 실수(1.56배·1.21배·2.34배)를 또 안 하도록)
 *
 * ⛔ 이 자는 원자료를 베끼지 않는다. **가리키기만** 한다(부품장부 원칙 — 다시 만들지 않는다).
 */
import fs from 'node:fs';
import path from 'node:path';

const 여기 = path.resolve(
  path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'),
  '..',
);
const 자료방 = path.join(여기, 'src', 'data');

/** 파이프라인 A 가 쓸 자료 세 벌 — 경로와 기대치(변하면 이 자가 운다) */
export const 자료세벌 = [
  {
    이름: '업종 × 시도 — 국민연금 가입 사업장',
    경로: '100yearmap/industry-region-cells.json',
    맡은이: '3번/8번',
    잰다: (j) => j.낸칸 === 1491 && j.전체칸 === 13723,
    기대: '낸칸 1,491 · 전체칸 13,723',
  },
  {
    이름: '학과별 졸업 후 상황 — KEDI 고등교육기관',
    경로: '100yearmap/major-outcomes.json',
    맡은이: '3번/8번',
    잰다: (j) => Array.isArray(j.자료) && j.자료.length === 837 && j.자료.every((r) => '공표기준_건보취업률' in r),
    기대: '학과 837개 · 전부 공표기준_건보취업률 칸을 가짐',
  },
  {
    이름: '회사 축 — 상장사 근속·연봉·인원 (SeoulMarkets)',
    경로: '../data/rankings.json',
    맡은이: '6번',
    잰다: (j) => j.rows.length === 2862 && Array.isArray(j.axes) && j.axes.every((a) => 'note' in a),
    기대: '회사 2,862곳 · 축마다 note 칸(비어도 있음)을 가짐',
  },
];

/**
 * 경고문 한 벌 — 흩어져 있던 것을 모은다. 출처를 남긴다(어디서 왜 나왔는지).
 * ⛔ 여기 새로 안 쓴다. `3번-할일-전체.md` A7·A8, `인계-현재상태.md` 8/7 마감분에서 그대로 가져온다.
 */
export const 경고문한벌 = [
  {
    제목: '순위가 아니라 분포다',
    글: '「몇 위」·「좋은 업종」·「나쁜 업종」이라고 쓰지 않는다. 개인은 분포의 한 점이다.',
    출처: '회사 강령(홍익인간) · industry-region-cells.json 의 「⛔ 안 쓰는 말」',
  },
  {
    제목: '지역 임금은 두 줄로 낸다',
    글: '「어디가 임금이 높나」(날값·울산 1위)와 「같은 일을 하면 어디가 높나」(업종보정·서울 1위)는 다른 물음이다. 하나만 쓰면 읽는 사람이 다른 물음의 답으로 가져간다.',
    출처: '3번-할일-전체.md A7 (8번 실측 2026-08-09)',
  },
  {
    제목: '취업률은 공표기준 쪽을 쓴다',
    글: '건보취업률(교내취업자를 뺀 좁은 값)을 쓰면 학과마다 공표보다 낮게 나간다. 공표와 견주는 자리에서는 공표기준_건보취업률(건보+교내)을 쓴다.',
    출처: '3번-할일-전체.md A8 (8번 2026-08-08 11:35) · major-outcomes.json 필드 자체 설명',
  },
  {
    제목: '기준 없이 적힌 배수 셋 — 이미 한 번 틀렸던 값',
    글: [
      '1.56배(1,000명+ ÷ 2~4명) — 공표와 같은 기준(5~9명)이면 1.49. 이 값은 **하한**이다.',
      '1.21배(서울÷제주로 잘못 읽음) — 전국 대비로 바르게 재면 1.048배. 서울은 1등이 아니라 2등(울산이 위)이다.',
      '2.34배(최고÷최저, 양 끝이 각 8~15만명뿐) — 분포로 재면 p90/p10 = 1.79.',
    ].join(' '),
    출처: '인계-현재상태.md 2026-08-07 마감 점검 · 8번 2026-08-09 정정 · scripts/check-100y-basis.mjs 가 이런 배수를 자동으로 막는다',
  },
  {
    제목: '가입자 수는 사람 수가 아니다',
    글: '업종×시도 자료는 사업장에 등록된 가입자 수다. 한 사람이 여러 곳에 걸치면 여러 번 세어진다.',
    출처: 'industry-region-cells.json 의 「⚠ 세는 단위」',
  },
  {
    제목: '회사 축 지표는 신고값·정의가 회사마다 다를 수 있다',
    글: '근속·연봉은 회사가 신고한 값이고 보너스·옵션 처리가 회사마다 다르다. mktCapPerHead 는 상장사만 있고(비상장은 null, 0 아님), ticker 로 조인한다.',
    출처: 'rankings.json axes[].note (tenure · pay · mktCapPerHead)',
  },
  {
    제목: '딱지 규격 — 지면을 만들 때 이 규칙을 지킨다',
    글: '?from=100y&at=job (백년지도에서) · ?from=smk&at=job (서울마켓에서). 한 주에 한 번 /admin JSON 에서 딱지별 방문·전환을 잰다. 「많이 왔다」가 아니라 「돈을 낸 사람 수」로 판단한다.',
    출처: '파이프라인-기획.md § A · § 재는 법',
  },
];

function 자가시험() {
  const 본보기 = [
    ['자료 세 벌 경로가 다 다르다', () => new Set(자료세벌.map((x) => x.경로)).size === 자료세벌.length],
    ['경고문이 다 출처를 가진다', () => 경고문한벌.every((x) => typeof x.출처 === 'string' && x.출처.length > 0)],
    ['경고문이 다 글을 가진다', () => 경고문한벌.every((x) => (Array.isArray(x.글) ? x.글.length > 0 : typeof x.글 === 'string' && x.글.length > 0))],
  ];
  let 진 = 0;
  for (const [이름, 재기] of 본보기) {
    let 됐나 = false, 까닭 = null;
    try { 됐나 = 재기() === true; } catch (e) { 됐나 = false; 까닭 = e?.message ?? String(e); }
    if (!됐나) { console.log(`  ⛔ 자가시험 실패 — ${이름}${까닭 ? ` (터졌다: ${까닭})` : ''}`); 진++; }
  }
  console.log(`자가시험 ${본보기.length}개 · 실패 ${진}개`);
  return 진;
}

if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 1 : 0);

const { pathToFileURL: 길을주소로 } = await import('node:url');
if (!!process.argv[1] && import.meta.url === 길을주소로(process.argv[1]).href) {

const 시험실패 = 자가시험();
const 안맞음 = [];
const 확인 = [];

for (const 자 of 자료세벌) {
  const 전체경로 = path.join(자료방, 자.경로);
  if (!fs.existsSync(전체경로)) { 안맞음.push(`${자.이름} — 파일이 없다: ${자.경로}`); continue; }
  let j;
  try { j = JSON.parse(fs.readFileSync(전체경로, 'utf8')); } catch (e) { 안맞음.push(`${자.이름} — 못 읽는다: ${e.message}`); continue; }
  if (!자.잰다(j)) { 안맞음.push(`${자.이름} — 기대와 다르다(${자.기대})`); continue; }
  확인.push(`✅ ${자.이름} (${자.맡은이}) — ${자.기대}`);
}

console.log(`자료 세 벌 중 확인됨 ${확인.length}개 · 안 맞음 ${안맞음.length}개`);
확인.forEach((x) => console.log(`  ${x}`));
안맞음.forEach((x) => console.log(`  ⛔ ${x}`));

const 나가는곳 = path.join(자료방, '100yearmap', 'pipeline-a-bundle.json');
const 산출 = {
  이름: '파이프라인 A(이직·연봉·회사) — 쓸 자료 + 경고문',
  안내: '⛔ 지면 새로 만들기 아님. 지면을 만들 때 이 파일을 먼저 본다.',
  잰때: new Date().toISOString().slice(0, 10),
  자료세벌: 자료세벌.map(({ 이름, 경로, 맡은이, 기대 }) => ({ 이름, 경로: `src/data/${경로}`, 맡은이, 기대 })),
  경고문한벌,
  확인결과: { 확인: 확인.length, 안맞음: 안맞음.length, 안맞음목록: 안맞음 },
};
fs.writeFileSync(나가는곳, JSON.stringify(산출, null, 2) + '\n');
console.log(`→ ${path.relative(여기, 나가는곳)} 씀`);

const 근거경로 = path.join(자료방, '100yearmap', 'pipeline-a-bundle.근거.json');
const 근거 = [
  { 수: 1491, 뜻: '업종×시도 낸칸(국민연금 가입자 1,000명 이상)', 지면: 'docs/파이프라인-기획.md#A' },
  { 수: 837, 뜻: '학과별 졸업 후 상황에 실린 학과 수(취업대상자 100명 이상)', 지면: 'docs/파이프라인-기획.md#A' },
  { 수: 2862, 뜻: '회사 축(rankings.json)에 실린 상장사 수', 지면: 'docs/파이프라인-기획.md#A' },
  { 수: 1.048, 뜻: '서울 임금 프리미엄(전국 대비, 정정값) — 서울은 1등이 아니라 2등', 지면: 'docs/인계-현재상태.md#2026-08-07' },
  { 수: 1.79, 뜻: '규모별 임금격차(p90/p10, 정정값)', 지면: 'docs/인계-현재상태.md#2026-08-07' },
];
fs.writeFileSync(근거경로, JSON.stringify(근거, null, 2) + '\n');
console.log(`→ ${path.relative(여기, 근거경로)} 씀`);

if (안맞음.length === 0) {
  console.log('✅ 파이프라인 A 자료 세 벌 전부 확인 · 경고문 한 벌 정리 완료');
  process.exit(시험실패 ? 1 : 0);
}
process.exit(1);

}
