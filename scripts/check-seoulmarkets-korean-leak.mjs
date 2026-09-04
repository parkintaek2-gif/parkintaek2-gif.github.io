/**
 * **SeoulMarkets(영어 지면)에 한국어가 뜻 없이 나가는 것을 막는다.**
 *
 * 🔴 2026-09-04 · 5번이 K Culture Wire에서 이 결함을 두 번 겪었다(누출 + «전부 빨강»으로
 *   꺼진 검사) — 그리고 전 유닛에 "6번의 증권사 자료도 위험하다"고 콕 짚었다.
 * ⭐ SeoulMarkets엔 이 검사 자체가 없었다. 판정 로직은 검증된 것을 그대로 가져다 쓴다
 *   (scripts/check-kcw-korean-leak.mjs — 뜻이있나·맨몸한국어·손님지면인가) — 새로 안 만든다.
 *   같은 로직을 두 벌 두면 한쪽만 고치고 잊는 사고가 난다.
 *
 * ⛔ 한국어를 금지하는 검사가 아니다 — 뜻(영문 대응)이 괄호·줄표로 바로 옆에 있으면 정당하다:
 *     ✅ 신용융자_코스닥 (KOSDAQ margin loan balance)   원문이 앞, 뜻이 괄호
 *     ✅ Mail-order licence 2026-세종-0591 (Sejong)      법정 등록번호, 숫자 사이 낀 관청명
 *     🔴 (본문에 그대로 남은 우리끼리 쓰는 한국어 메모)   뜻이 어디에도 없다 ← 이것만 잡는다
 *
 *   node scripts/check-seoulmarkets-korean-leak.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 맨몸한국어 as 원본맨몸한국어, 손님지면인가 } from './check-kcw-korean-leak.mjs';
import { 못재면멈춘다 } from './lib/dist-ready.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * ⭐ SeoulMarkets 몫의 실측 차이 — KCW에는 없던 무늬다.
 *   `신용융자_코스닥 (KOSDAQ margin loan balance)` 처럼 원문 필드명을 **밑줄로 이은 것**이
 *   6번 기사에 실제로 있다(오늘 낸 margin-debt 기사). 원본 판정(뜻이있나)은 한글 조각을
 *   공백·괄호 기준으로만 가르므로, 밑줄 뒤에 이어지는 한글까지가 «한 낱말」로 안 보여
 *   `신용융자` 만 따로 뽑혀 뜻(괄호)을 못 찾고 빨강으로 잡힌다(실측 — 자가시험 통과 전 확인).
 *   ⛔ 원본 파일(check-kcw-korean-leak.mjs)은 5번 소유·자가시험 22개로 막 고친 것이라
 *     여기서 규칙을 넓히지 않는다 — 밑줄만 공백으로 미리 펴서 넘긴다(내 몫 안에서 처리).
 */
function 맨몸한국어(글) {
  return 원본맨몸한국어(String(글).replace(/_/g, ' '));
}

if (!process.argv.includes('--자가시험')) 못재면멈춘다(뿌리, 'check-seoulmarkets-korean-leak');

/**
 * 면제 — **무엇이 왜 한국어라도 되는가**를 같이 적는다. 파일 하나·낱말 하나 단위로 좁게 둔다.
 * ⛔ 지면을 통째로 면제하지 않는다 — 그 지면의 다른 새 누출은 계속 잡혀야 한다.
 */
export const 면제 = [
  {
    파일: 'api.html', 낱말: ['미래에셋증권', '해성디에스', '매수'],
    잰다: '`/v1/research` 실제 응답을 그대로 뜬 코드 샘플이다(주석: "손으로 예쁘게 고치지 않는다"). '
      + '두 줄 아래 brokerEn "Mirae Asset Securities"·subjectEn "Haesung DS"·ratingNormalised.code "buy" 가 '
      + '같은 JSON 블록 안에 이미 있다 — 판정기의 26자 앞뒤 창이 줄 바꿈 너머까지 안 볼 뿐이다',
  },
];

/** SeoulMarkets 몫만 본다 — 같은 dist 아래 100yearmap·K Culture Wire 지면은 뺀다(각자 제 검사가 있다/생긴다) */
export function 내지면인가(상대경로) {
  const p = 상대경로.replace(/\\/g, '/');
  /* dist 뿌리 자체에 다른 두 사이트의 홈이 파일로 하나씩 있다(100y.html·wikitip.html) — 폴더뿐 아니라 이 둘도 뺀다 */
  if (p.startsWith('wikitip/') || p === 'wikitip.html') return false;
  if (p.startsWith('100y/') || p === '100y.html') return false;
  return true;
}

const 직접불렸나 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (process.argv.includes('--자가시험')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    if (JSON.stringify(실제) === JSON.stringify(바람)) 통 += 1;
    else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}\n     바란 것: ${JSON.stringify(바람)}`); }
  };
  재본다('KCW 지면은 안 본다', 내지면인가('wikitip/article/x.html'), false);
  재본다('100yearmap 지면은 안 본다', 내지면인가('100y/college-major/x.html'), false);
  재본다('SeoulMarkets 지면은 본다', 내지면인가('article/korea-margin-debt-record-moved-to-kospi.html'), true);
  재본다('루트 지면도 본다', 내지면인가('index.html'), true);
  재본다('100yearmap 홈(파일) 은 안 본다', 내지면인가('100y.html'), false);
  재본다('KCW 홈(파일) 은 안 본다', 내지면인가('wikitip.html'), false);
  /* 판정 로직 자체는 check-kcw-korean-leak.mjs 가 이미 22개로 잰다 — 여기서 또 재지 않는다(중복 시험 금지) */
  재본다('맨몸한국어 — 뜻 있는 한국어(오늘 낸 기사 실제 문구)는 안 잡는다',
    맨몸한국어('<p>KOSDAQ share = 신용융자_코스닥 (KOSDAQ margin loan balance)</p>'), []);
  재본다('맨몸한국어 — 등록번호 옆 관청명은 안 잡는다',
    맨몸한국어('<p>Mail-order licence 2026-세종-0591 (Sejong)</p>'), []);
  재본다('맨몸한국어 — 뜻 없이 흘린 한국어는 잡는다',
    맨몸한국어('<p>왜 튀었나 — 사건이 이 자료에 없다</p>'), ['왜 튀었나', '사건이 이 자료에 없다']);
  재본다('면제표에 까닭이 다 있다', 면제.every((x) => x.잰다 && x.잰다.length > 10), true);
  console.log(`자가시험 ${통}/${통 + 실}`);
  process.exit(실 ? 1 : 0);
}

if (직접불렸나) {
  const 방 = path.join(뿌리, 'dist');
  if (!fs.existsSync(방)) { console.log('⚠ dist 가 없다. 먼저 짓는다'); process.exit(0); }

  const 지면들 = [];
  (function 걷기(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) 걷기(p);
      else if (e.name.endsWith('.html') && 내지면인가(path.relative(방, p))) 지면들.push(p);
    }
  }(방));

  const 빨강 = [];
  let 건너뛴것 = 0;
  for (const f of 지면들) {
    const 글 = fs.readFileSync(f, 'utf8');
    if (!손님지면인가(글)) { 건너뛴것 += 1; continue; }
    const 상대 = path.relative(방, f).replace(/\\/g, '/');
    const 이면제 = 면제.find((x) => x.파일 === 상대);
    let 맨몸 = 맨몸한국어(글);
    if (이면제) 맨몸 = 맨몸.filter((w) => !이면제.낱말.includes(w));
    if (맨몸.length) 빨강.push([path.relative(방, f), 맨몸]);
  }

  console.log(`SeoulMarkets 지면 ${지면들.length}장에서 **뜻 없는 한국어**를 찾는다`);
  if (건너뛴것) {
    console.log(`⬜ 안 본 것 ${건너뛴것}장 — noindex 를 단 «내부» 지면이다(손님이 받지 않는다).`);
    console.log('   ⚠ 이것을 「깨끗하다」로 읽지 않는다. 안 본 것은 안 본 것이다.');
  }
  if (지면들.length < 50) {
    console.log(`🔴 지면이 ${지면들.length}장뿐이다 — 빌드가 덜 됐다. **아무것도 안 보고 통과시키지 않는다**`);
    process.exit(1);
  }
  if (!빨강.length) { console.log('✅ 빨강 0건'); process.exit(0); }
  console.log(`🔴 빨강 ${빨강.length}장`);
  for (const [f, 낱] of 빨강.slice(0, 25)) console.log(`   ${f.padEnd(46)} ${낱.slice(0, 4).join(' / ')}`);
  if (빨강.length > 25) console.log(`   … 그리고 ${빨강.length - 25}장 더`);
  process.exit(1);
}
