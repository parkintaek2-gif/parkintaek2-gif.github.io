#!/usr/bin/env node
/**
 * 카드 굽기 — **밖으로 나갈 것은 글자만으로는 안 된다.**
 *
 * 사장님 지시(2026-08-07): 「외부유입 콘텐트에 텍스트만 있으면 안 되겠지?
 *   콘텐트를 다양화해서 서비스를 해. **스레드, 인스타, 유튜브, X** 등 유의미한 사이트에
 *   콘텐트를 생산, 배포해」
 *
 * ── 무엇을 굽나 ────────────────────────────────────────────────
 *   1080×1350  인스타그램·스레드 (세로 4:5 — 타임라인에서 가장 크게 잡힌다)
 *   1080×1920  쇼츠·릴스 표지 (9:16)
 *   1200×675   X·카카오톡 (16:9)
 * 한 사실당 세 벌을 굽는다. 손으로 다시 만들지 않는다.
 *
 * ── 무엇을 담나 ────────────────────────────────────────────────
 * ⛔ 예쁜 그림이 아니다. **숫자 하나와 그 숫자가 선 자리**다.
 * ✅ 분포를 그린다 — 우리 강령이 「평균이 아니라 분포」다. 카드에서도 지킨다
 * ✅ 출처를 카드 안에 넣는다. 밖으로 나간 그림은 우리 지면을 떠나서도 혼자 서 있어야 한다
 * ✅ 주소를 넣는다. 그림만 퍼지고 사람이 안 오면 유입이 아니다
 *
 * 쓰는 법
 *   node scripts/make-cards.mjs            archive/cards/ 에 굽는다
 *   node scripts/make-cards.mjs --selftest 글자·숫자 규칙을 검산한다
 */
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 낼곳 = path.join(뿌리, 'archive/cards');

/** 글자를 SVG 에 그대로 넣으면 &·< 가 XML 을 깬다 */
export function 안전글(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** 숫자를 사람이 읽는 말로. 카드에는 자릿점을 찍는다 */
export function 쉼표(n) {
  return Number(n).toLocaleString('ko-KR');
}

/** 분포 막대 — 값이 있는 데까지만 그린다. 빈칸을 0 으로 채우면 거짓 그래프가 된다 */
export function 막대들(값, { 폭, 높이, 강조칸 }) {
  const 최대 = Math.max(...값);
  const 칸 = 폭 / 값.length;
  return 값
    .map((v, i) => {
      const h = Math.round((v / 최대) * 높이);
      const 색 = i === 강조칸 ? '#c9a84c' : '#2e3545';
      return `<rect x="${(i * 칸).toFixed(1)}" y="${높이 - h}" width="${(칸 - 3).toFixed(1)}" height="${h}" rx="3" fill="${색}"/>`;
    })
    .join('');
}

if (process.argv.includes('--selftest')) {
  const 틀림 = [];
  if (안전글('a&b<c') !== 'a&amp;b&lt;c') 틀림.push('안전글이 XML 을 안 지킨다');
  if (쉼표(20630) !== '20,630') 틀림.push('쉼표가 안 찍힌다');
  const m = 막대들([1, 2, 3], { 폭: 300, 높이: 100, 강조칸: 2 });
  if ((m.match(/<rect/g) || []).length !== 3) 틀림.push('막대 개수가 다르다');
  if (!m.includes('#c9a84c')) 틀림.push('강조 칸이 금색이 아니다');
  if (막대들([5, 5], { 폭: 100, 높이: 50, 강조칸: -1 }).includes('#c9a84c')) 틀림.push('강조가 없는데 금색이 나온다');
  console.log(틀림.length ? `⛔ 자가시험 실패\n  ${틀림.join('\n  ')}` : '✅ 카드 굽기 자가시험 5건 통과');
  process.exit(틀림.length ? 1 : 0);
}

/* ── 카드 한 장 ─────────────────────────────────────────────── */
const 판 = {
  세로: { w: 1080, h: 1350, 이름: '4x5' },   // 인스타·스레드
  긴세로: { w: 1080, h: 1920, 이름: '9x16' }, // 쇼츠·릴스 표지
  가로: { w: 1200, h: 675, 이름: '16x9' },    // X·카카오톡
};

function svg({ w, h }, { 위, 큰, 밑, 분포, 강조칸, 출처, 주소 }) {
  const 여백 = Math.round(w * 0.08);
  const 안폭 = w - 여백 * 2;
  const 큰크기 = Math.round(w * (큰.length > 12 ? 0.072 : 0.095));
  const 그래프높이 = Math.round(h * 0.12);
  const 그래프y = Math.round(h * 0.56);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="#0b0d12"/>
  <rect x="0" y="0" width="${w}" height="8" fill="#c9a84c"/>
  <text x="${여백}" y="${Math.round(h * 0.13)}" font-family="Malgun Gothic, sans-serif" font-size="${Math.round(w * 0.032)}" fill="#9aa0ac">${안전글(위)}</text>
  <text x="${여백}" y="${Math.round(h * 0.30)}" font-family="Batang, Malgun Gothic, serif" font-weight="900" font-size="${큰크기}" fill="#e9e9ee">${안전글(큰)}</text>
  <text x="${여백}" y="${Math.round(h * 0.40)}" font-family="Malgun Gothic, sans-serif" font-size="${Math.round(w * 0.038)}" fill="#bf9d45">${안전글(밑)}</text>
  ${분포 ? `<g transform="translate(${여백}, ${그래프y})">${막대들(분포, { 폭: 안폭, 높이: 그래프높이, 강조칸 })}</g>` : ''}
  ${분포 ? `<text x="${여백}" y="${그래프y + 그래프높이 + Math.round(h * 0.035)}" font-family="Malgun Gothic, sans-serif" font-size="${Math.round(w * 0.026)}" fill="#8e95a1">스무 살에서 마흔넷까지 · 금색이 그 나이입니다</text>` : ''}
  <text x="${여백}" y="${h - 여백 - Math.round(h * 0.05)}" font-family="Malgun Gothic, sans-serif" font-size="${Math.round(w * 0.024)}" fill="#8e95a1">${안전글(출처)}</text>
  <text x="${여백}" y="${h - 여백}" font-family="Batang, Malgun Gothic, serif" font-weight="700" font-size="${Math.round(w * 0.030)}" fill="#c9a84c">${안전글(주소)}</text>
</svg>`;
}

/* ── 오늘 구울 사실들 — 전부 우리가 잰 실측이다 ─────────────── */
const 자료길 = path.join(뿌리, 'src/data/100yearmap/age-axis.json');
if (!existsSync(자료길)) { console.error('⛔ age-axis.json 이 없다. node scripts/collect-age-axis.mjs 를 먼저 돌린다'); process.exit(1); }
const 나이 = JSON.parse(readFileSync(자료길, 'utf8'));

const 사실들 = [
  {
    이름: 'age32-marriage',
    위: '2025년에 처음 결혼한 남자 가운데',
    큰: '서른둘이 가장 많았습니다',
    밑: `${쉼표(나이.혼인.남편분포.값[12])}명 · 초혼 ${쉼표(나이.혼인.총건)}건 가운데`,
    분포: 나이.혼인.남편분포.값,
    강조칸: 12,
    출처: '국가데이터처 「초혼부부의 연령별 혼인」 2025',
    주소: '100yearmap.com/age/32',
  },
  {
    이름: 'wage-returns',
    위: '월급은 오르기만 하지 않습니다',
    큰: '예순에 스물다섯으로 돌아옵니다',
    밑: `예순 넘어 318만 8천원 · 스물다섯에서 스물아홉 318만 5천원`,
    출처: '고용노동부 「규모·학력·연령계층·성별 임금 및 근로조건」 2025',
    주소: '100yearmap.com/age/68',
  },
  {
    이름: 'childcare-leave',
    위: '아이가 태어난 해에',
    큰: '엄마 72.2% · 아빠 10.2%',
    밑: '아빠 쪽은 회사 크기로 갈립니다 — 300명 이상 12.5%',
    출처: '국가데이터처 「출생아 부모의 육아휴직 사용률」 2024',
    주소: '100yearmap.com/age/32',
  },
];

await mkdir(낼곳, { recursive: true });
let 센것 = 0;
for (const 사실 of 사실들) {
  for (const [key, 판형] of Object.entries(판)) {
    const 파일 = path.join(낼곳, `${사실.이름}-${판형.이름}.png`);
    await sharp(Buffer.from(svg(판형, 사실))).png().toFile(파일);
    센것++;
  }
}
console.log(`✅ 카드 ${센것}장 — ${path.relative(뿌리, 낼곳)}`);
console.log('   사실 ' + 사실들.length + '개 × 판 3종(인스타·쇼츠·X)');
console.log('⚠ 한글이 네모로 나오면 글꼴을 못 찾은 것이다. **눈으로 보고** 내보낸다.');
