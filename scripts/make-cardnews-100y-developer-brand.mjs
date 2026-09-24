/**
 * make-cardnews-100y-developer-brand.mjs — 카드뉴스 「시행사 브랜드평판 vs 부동산 개발업 수명」 5장
 *
 * 소스 지면 — /ranking-developer-brand
 * ⛔ 이 카드의 수는 전부 그 지면에 있는 수다. 새로 재지 않는다.
 *
 * 쓰는 법  node scripts/make-cardnews-100y-developer-brand.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { 그리기 } from './make-cardnews-100y-voc.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const 낼방 = path.join(ROOT, 'public', '100y', 'cardnews');
const 자료 = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/100yearmap/ranking-developer-brand-2026.json'), 'utf8'));

export const 갈곳 = '100yearmap.com/ranking-developer-brand';
export const 바닥 = `${자료.순위출처.이름} · 국민연금 가입 사업장 내역`;

const top5 = 자료.top5;
const 일위 = top5[0];
const 실측 = 자료.실측대조;

export function 짜기() {
  return [
    {
      꼴: '표지',
      큰수: `${실측.수명중앙값_년}년`,
      줄들: ['부동산 개발·공급업 사업장', '생존 기간 중앙값입니다.'],
    },
    {
      머리: '화제성 1위는',
      줄들: [
        `${일위.브랜드}`,
        `브랜드평판지수 ${일위.브랜드평판지수.toLocaleString()}`,
        '',
        '2026년 9월, 한국기업평판연구소',
      ],
    },
    {
      머리: '실측은 다른 자료입니다',
      줄들: [
        `국민연금 가입 사업장 ${실측.닫은곳}곳이`,
        '자격을 잃은 시점 기준',
        '',
        `수명 중앙값 ${실측.수명중앙값_년}년`,
      ],
    },
    {
      머리: '1년·3년 안에',
      줄들: [
        `1년 안 ${실측.일년내_퍼센트}%`,
        `3년 안 ${실측.삼년내_퍼센트}%`,
        '',
        '이 명단에 들었습니다.',
      ],
    },
    {
      꼴: '마무리',
      머리: '화제성 1위와 수명은 다른 이야기입니다',
      줄들: [
        '이것은 통계이지',
        '당신이 아닙니다.',
        '',
        `출처 — ${자료.순위출처.이름}`,
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
  본다('② 표지에 큰 수가 있다', 장들[0].꼴 === '표지' && 장들[0].큰수.includes(String(실측.수명중앙값_년)));
  본다('③ 모든 장에 데려갈 주소가 있다',
    장들.every((장, i) => 그리기(장, i + 1, 장들.length, 바닥, 갈곳).includes(갈곳)));
  본다('④ 남의 카드 주소가 안 섞였다',
    !민글.includes('100yearmap.com/ranking-capital-brand') && !민글.includes('100yearmap.com/ranking-usedcar-brand'));

  const 댈수 = new Set([
    일위.브랜드평판지수, 실측.닫은곳, 실측.수명중앙값_년, 실측.일년내_퍼센트, 실측.삼년내_퍼센트,
    장들.length, 2026, 9,
  ].filter((v) => v != null).map(String));
  const 못댄것 = [...민글.split(갈곳).join(' ').matchAll(/\d[\d,]*\.?\d*/g)]
    .map((m) => m[0].replace(/,/g, '')).filter((s) => !댈수.has(s) && !/^[1-5]$/.test(s));
  본다(`⑤ 화면의 수가 전부 자료에서 온다${못댄것.length ? ` — 못 댄 것: ${[...new Set(못댄것)].slice(0, 6).join(' · ')}` : ''}`,
    못댄것.length === 0);

  console.log(`\n1위 ${일위.브랜드} ${일위.브랜드평판지수} · 수명중앙값 ${실측.수명중앙값_년}년`);
  process.exit();
}

/* 🔴 여기부터가 «부르면 도는 몸»이다 */
const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'make-cardnews-100y-developer-brand.mjs';
if (내가직접불렸나) {
  const sharp = createRequire(path.join(ROOT, 'package.json'))('sharp');
  fs.mkdirSync(낼방, { recursive: true });
  const 장들 = 짜기();
  for (let i = 0; i < 장들.length; i++) {
    const svg = 그리기(장들[i], i + 1, 장들.length, 바닥, 갈곳);
    await sharp(Buffer.from(svg)).png().toFile(path.join(낼방, `시행사부동산개발수명-${i + 1}.png`));
    console.log('✅', `시행사부동산개발수명-${i + 1}.png`);
  }
  console.log('⛔ 주소 없는 카드는 안 만든다 — 모든 장에', 갈곳);
}
