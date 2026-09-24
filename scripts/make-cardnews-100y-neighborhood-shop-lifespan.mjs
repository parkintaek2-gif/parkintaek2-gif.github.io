/**
 * make-cardnews-100y-neighborhood-shop-lifespan.mjs — 카드뉴스 「동네 가게 여섯 업종 사업장 수명」 5장
 *
 * 소스 지면 — /neighborhood-shop-lifespan (국민연금 가입 사업장 내역, 동네 가게 여섯 업종)
 * ⛔ 이 카드의 수는 전부 그 지면에 있는 수다. 새로 재지 않는다.
 *
 * 쓰는 법  node scripts/make-cardnews-100y-neighborhood-shop-lifespan.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { 그리기 } from './make-cardnews-100y-voc.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const 낼방 = path.join(ROOT, 'public', '100y', 'cardnews');
const 자료 = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/100yearmap/neighborhood-shop-lifespan.json'), 'utf8'));

export const 갈곳 = '100yearmap.com/neighborhood-shop-lifespan';
export const 바닥 = `${자료.출처.이름} · 동네 가게 여섯 업종 사업장 수명`;

const 표 = [...자료.자료].sort((a, b) => b.수명중앙값 - a.수명중앙값);
const 가장긺 = 표[0];
const 가장짧음 = 표[표.length - 1];
const 배수 = Math.round((가장긺.수명중앙값 / 가장짧음.수명중앙값) * 10) / 10;
const 표본최대 = 표.reduce((a, b) => (a.닫은곳 > b.닫은곳 ? a : b));

export function 짜기() {
  return [
    {
      꼴: '표지',
      큰수: `${가장긺.수명중앙값}년`,
      줄들: [`${가장긺.업종}`, '사업장 수명 중앙값입니다. (국민연금 자료)'],
    },
    {
      머리: '동네 가게마다 다릅니다',
      줄들: 표.map((r) => `${r.업종}  ${r.수명중앙값}년`),
    },
    {
      머리: `${가장긺.업종}이 가장 깁니다`,
      줄들: [
        `${가장긺.업종}  ${가장긺.수명중앙값}년`,
        `${가장짧음.업종}    ${가장짧음.수명중앙값}년`,
        '',
        `${배수}배 차이입니다.`,
      ],
    },
    {
      머리: '표본이 가장 큰 것은',
      줄들: [
        `${표본최대.업종}`,
        `닫힌 곳 ${표본최대.닫은곳}곳`,
        '',
        `3년 안에 ${표본최대.삼년내}%가`,
        '이 명단에 들었습니다.',
      ],
    },
    {
      꼴: '마무리',
      머리: '어느 업종이 더 좋다는 뜻이 아닙니다',
      줄들: [
        '이것은 통계이지',
        '당신이 아닙니다.',
        '',
        `출처 — ${자료.출처.이름}`,
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
  본다('② 표지에 큰 수가 있다', 장들[0].꼴 === '표지' && 장들[0].큰수.includes(String(가장긺.수명중앙값)));
  본다('③ 모든 장에 데려갈 주소가 있다',
    장들.every((장, i) => 그리기(장, i + 1, 장들.length, 바닥, 갈곳).includes(갈곳)));
  본다('④ 남의 카드 주소가 안 섞였다',
    !민글.includes('100yearmap.com/pediatrics') && !민글.includes('100yearmap.com/academy-lifespan'));

  const 댈수 = new Set([
    배수, 표본최대.닫은곳, 표본최대.삼년내,
    ...표.flatMap((r) => [r.수명중앙값, r.일년내, r.삼년내, r.닫은곳]),
    장들.length, 2026, 6, '06',
  ].filter((v) => v != null).map(String));
  const 못댄것 = [...민글.split(갈곳).join(' ').matchAll(/\d[\d,]*\.?\d*/g)]
    .map((m) => m[0].replace(/,/g, '')).filter((s) => !댈수.has(s) && !/^[1-5]$/.test(s));
  본다(`⑤ 화면의 수가 전부 자료에서 온다${못댄것.length ? ` — 못 댄 것: ${[...new Set(못댄것)].slice(0, 6).join(' · ')}` : ''}`,
    못댄것.length === 0);

  console.log(`\n가장 긺 ${가장긺.업종} ${가장긺.수명중앙값}년 · 가장 짧음 ${가장짧음.업종} ${가장짧음.수명중앙값}년`);
  process.exit();
}

/* 🔴 여기부터가 «부르면 도는 몸»이다 */
const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'make-cardnews-100y-neighborhood-shop-lifespan.mjs';
if (내가직접불렸나) {
  const sharp = createRequire(path.join(ROOT, 'package.json'))('sharp');
  fs.mkdirSync(낼방, { recursive: true });
  const 장들 = 짜기();
  for (let i = 0; i < 장들.length; i++) {
    const svg = 그리기(장들[i], i + 1, 장들.length, 바닥, 갈곳);
    await sharp(Buffer.from(svg)).png().toFile(path.join(낼방, `동네가게수명-${i + 1}.png`));
    console.log('✅', `동네가게수명-${i + 1}.png`);
  }
  console.log('⛔ 주소 없는 카드는 안 만든다 — 모든 장에', 갈곳);
}
