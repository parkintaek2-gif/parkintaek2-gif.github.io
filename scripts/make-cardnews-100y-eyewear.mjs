/**
 * make-cardnews-100y-eyewear.mjs — 카드뉴스 「안경 브랜드평판 1위, 안경원은 오래 갑니다」 5장
 *
 * 🔴 사장님 상시 지시 — 매일 카드·카드뉴스·숏영상도 낸다. 외부유입용이다.
 * ⛔ 주소 없는 카드는 안 만든다 — 다섯 장 전부에 100yearmap.com/ranking-eyewear-brand 를 박는다.
 * ⛔ 순위·등수 표현을 안 쓴다(그리기 자가 이미 지킨다). 이 카드는 «브랜드평판»과
 *   «업종 생존»이 다른 자료라는 것과, 이 시리즈에서 안경원이 유독 오래 간다는 대비를 낸다.
 *
 * ⛔ 화면의 수는 전부 src/data/100yearmap/ranking-*-brand-2026.json 에서 온다. 손으로 안 박는다.
 *
 * 쓰는 법  node scripts/make-cardnews-100y-eyewear.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { 그리기 } from './make-cardnews-100y-voc.mjs';
import { 다짐줄지우기 } from './lib/재기-공통.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const 낼방 = path.join(ROOT, 'public', '100y', 'cardnews');
const 자료방 = path.join(ROOT, 'src', 'data', '100yearmap');

const 안경 = JSON.parse(fs.readFileSync(path.join(자료방, 'ranking-eyewear-brand-2026.json'), 'utf8'));
const 읽기 = (f) => JSON.parse(fs.readFileSync(path.join(자료방, f), 'utf8'));
const 치킨 = 읽기('ranking-chicken-brand-2026.json');
const 커피 = 읽기('ranking-coffee-brand-2026.json');
const 미용실 = 읽기('ranking-hairsalon-brand-2026.json');
const 반려동물 = 읽기('ranking-petsupply-brand-2026.json');

export const 갈곳 = '100yearmap.com/ranking-eyewear-brand';
export const 바닥 = `국민연금공단 국민연금 가입 사업장 내역 · 등수를 매기지 않습니다`;

export const 일위 = 안경.top5[0];
export const 실측 = 안경.실측대조;

export function 짜기() {
  return [
    {
      꼴: '표지',
      큰수: `${실측.수명중앙값_년}년`,
      줄들: ['안경 및 렌즈 소매업', '사업장 수명 중앙값입니다.'],
    },
    {
      머리: '브랜드평판 1위는 따로 있습니다',
      줄들: [
        `${안경.순위출처.이름.replace('한국기업평판연구소 ', '')}`,
        `1위 — ${일위.브랜드}`,
        '',
        '이 순위는 화제성 지수입니다.',
        '가게 생존 기간을 재지 않습니다.',
      ],
    },
    {
      머리: '⛔ 그런데 이번엔 다릅니다',
      줄들: [
        `안경원은 ${실측.일년내_퍼센트}%만 1년 안에,`,
        `${실측.삼년내_퍼센트}%가 3년 안에`,
        '문을 닫았습니다.',
        '',
        `국민연금 가입 사업장 ${실측.닫은곳}곳 기준입니다.`,
      ],
    },
    {
      머리: '같은 시리즈, 다른 업종과 견주면',
      줄들: [
        `치킨전문점   ${치킨.실측대조.수명중앙값_년}년`,
        `커피전문점   ${커피.실측대조.수명중앙값_년}년`,
        `미용실       ${미용실.실측대조.수명중앙값_년}년`,
        `반려동물용품 ${반려동물.실측대조.수명중앙값_년}년`,
        `안경원       ${실측.수명중앙값_년}년`,
      ],
    },
    {
      꼴: '마무리',
      머리: '브랜드가 오래가는 것과 업종이 오래가는 것은 다릅니다',
      줄들: [
        '이것은 통계이지',
        '당신이 아닙니다.',
        '',
        '출처 — 한국기업평판연구소 · 국민연금공단',
        '2026년 9월',
      ],
    },
  ];
}

/* ── 자가시험 ─────────────────────────────────────────── */
if (process.argv.includes('--selftest')) {
  const 본다 = (말, 참) => { console.log(참 ? '✅' : '🔴', 말); if (!참) process.exitCode = 1; };
  const 장들 = 짜기();
  const 민글 = 장들.map((장, i) => 그리기(장, i + 1, 장들.length, 바닥, 갈곳)).join('\n')
    .replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

  본다('① 다섯 장이다', 장들.length === 5);
  본다('② 표지에 큰 수(수명 중앙값)가 있다', 장들[0].꼴 === '표지' && 장들[0].큰수.includes(String(실측.수명중앙값_년)));
  본다('③ 브랜드평판 1위 이름이 실린다', 민글.includes(일위.브랜드));
  본다('④ ⛔ 브랜드평판과 업종 생존이 다른 자료임을 한 장 통째로 썼다',
    민글.includes('화제성 지수') && 민글.includes('생존 기간을 재지 않습니다'));
  본다('⑤ 이 시리즈 다른 네 업종과 비교한 장이 있다',
    [치킨, 커피, 미용실, 반려동물].every((d) => 민글.includes(String(d.실측대조.수명중앙값_년) + '년')));
  본다('⑥ 🔴 모든 장에 데려갈 주소가 있다',
    장들.every((장, i) => 그리기(장, i + 1, 장들.length, 바닥, 갈곳).includes(갈곳)));
  본다('⑦ 🔴 남의 카드 주소가 안 섞였다',
    !민글.includes('100yearmap.com/pets') && !민글.includes('100yearmap.com/work'));

  const 등수뺀글 = 다짐줄지우기(민글);
  const 걸린 = ['등수', '랭킹', '몇 위', '늦었', '나아', '낫습니다', '불리하다', '유리하다'].filter((w) => 등수뺀글.includes(w));
  본다(`⑧ ⛔ 줄도 안 세우고 낫다고도 안 한다${걸린.length ? ` — ${걸린.join(' · ')}` : ''}`, 걸린.length === 0);

  const 댈수 = new Set([
    실측.수명중앙값_년, 실측.일년내_퍼센트, 실측.삼년내_퍼센트, 실측.닫은곳, 장들.length,
    치킨.실측대조.수명중앙값_년, 커피.실측대조.수명중앙값_년, 미용실.실측대조.수명중앙값_년, 반려동물.실측대조.수명중앙값_년,
    2026, 9, 1, 2, 3, 4, 5,
  ].filter((v) => v != null).map(String));
  const 못댄것 = [...민글.split(갈곳).join(' ').matchAll(/\d[\d,]*\.?\d*/g)]
    .map((m) => m[0].replace(/,/g, '')).filter((s) => !댈수.has(s) && !/^[1-5]$/.test(s));
  본다(`⑨ 화면의 수가 전부 자료에서 온다${못댄것.length ? ` — 못 댄 것: ${[...new Set(못댄것)].slice(0, 8).join(' · ')}` : ''}`,
    못댄것.length === 0);

  console.log(`\n안경원 수명중앙값 ${실측.수명중앙값_년}년 · 1위 ${일위.브랜드}`);
  process.exit();
}

/* 🔴 여기부터가 «부르면 도는 몸»이다 */
const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'make-cardnews-100y-eyewear.mjs';
if (내가직접불렸나) {
  const sharp = createRequire(path.join(ROOT, 'package.json'))('sharp');
  fs.mkdirSync(낼방, { recursive: true });
  const 장들 = 짜기();
  for (let i = 0; i < 장들.length; i++) {
    const svg = 그리기(장들[i], i + 1, 장들.length, 바닥, 갈곳);
    await sharp(Buffer.from(svg)).png().toFile(path.join(낼방, `안경원업종수명-${i + 1}.png`));
    console.log('✅', `안경원업종수명-${i + 1}.png`);
  }
  console.log('⛔ 주소 없는 카드는 안 만든다 — 모든 장에', 갈곳);
}
