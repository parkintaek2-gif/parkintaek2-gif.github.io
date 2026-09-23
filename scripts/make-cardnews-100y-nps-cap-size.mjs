/**
 * make-cardnews-100y-nps-cap-size.mjs — 카드뉴스 「국민연금 상한, 회사 규모」 5장
 *
 * 소스 지면 — /nps-cap-size (국민연금 가입 사업장 내역, 규모별)
 * ⛔ 이 카드의 수는 전부 그 지면에 있는 수다. 새로 재지 않는다.
 *
 * 쓰는 법  node scripts/make-cardnews-100y-nps-cap-size.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { 그리기 } from './make-cardnews-100y-voc.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const 낼방 = path.join(ROOT, 'public', '100y', 'cardnews');
const 자료 = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/100yearmap/nps-cap-share.json'), 'utf8'));

export const 갈곳 = '100yearmap.com/nps-cap-size';
export const 바닥 = `${자료.출처.이름} · 국민연금 상한 눌린 비율`;

const 전체 = 자료.전체;
const 규모 = [...자료.규모].sort((a, b) => b.상한걸린비율 - a.상한걸린비율);
const 일위 = 규모[0];
const 꼴찌 = 규모[규모.length - 1];
const 배수 = Math.round(일위.상한걸린비율 / 꼴찌.상한걸린비율);

export function 짜기() {
  return [
    {
      꼴: '표지',
      큰수: `${일위.상한걸린비율}%`,
      줄들: [`${일위.규모} 회사 가입자 중`, '국민연금 상한에 눌린 사람 비율입니다.'],
    },
    {
      머리: '회사가 작을수록 낮습니다',
      줄들: [
        `${일위.규모}  ${일위.상한걸린비율}%`,
        `${꼴찌.규모}    ${꼴찌.상한걸린비율}%`,
        '',
        `${배수}배 차이입니다.`,
      ],
    },
    {
      머리: '일곱 구간, 순서대로 오릅니다',
      줄들: 규모.slice().reverse().map((r) => `${r.규모}  ${r.상한걸린비율}%`),
    },
    {
      머리: '전국 평균은',
      줄들: [
        `${전체.상한걸린비율}%`,
        '',
        `가입자 ${전체.사람.toLocaleString()}명 중`,
        `${전체.눌린사람.toLocaleString()}명입니다.`,
      ],
    },
    {
      꼴: '마무리',
      머리: '큰 회사가 더 좋다는 뜻이 아닙니다',
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
  본다('② 표지에 큰 수가 있다', 장들[0].꼴 === '표지' && 장들[0].큰수.includes(String(일위.상한걸린비율)));
  본다('③ 모든 장에 데려갈 주소가 있다',
    장들.every((장, i) => 그리기(장, i + 1, 장들.length, 바닥, 갈곳).includes(갈곳)));
  본다('④ 남의 카드 주소가 안 섞였다',
    !민글.includes('100yearmap.com/pediatrics') && !민글.includes('100yearmap.com/usedcar'));

  const 댈수 = new Set([
    전체.상한걸린비율, 전체.사람, 전체.눌린사람, 배수,
    ...규모.flatMap((r) => [r.규모.match(/\d+/g), r.상한걸린비율].flat()),
    장들.length, 573300, 2026, 6, '06',
  ].filter((v) => v != null).map(String));
  const 못댄것 = [...민글.split(갈곳).join(' ').matchAll(/\d[\d,]*\.?\d*/g)]
    .map((m) => m[0].replace(/,/g, '')).filter((s) => !댈수.has(s) && !/^[1-5]$/.test(s));
  본다(`⑤ 화면의 수가 전부 자료에서 온다${못댄것.length ? ` — 못 댄 것: ${[...new Set(못댄것)].slice(0, 6).join(' · ')}` : ''}`,
    못댄것.length === 0);

  console.log(`\n1위 ${일위.규모} ${일위.상한걸린비율}% · 꼴찌 ${꼴찌.규모} ${꼴찌.상한걸린비율}%`);
  process.exit();
}

/* 🔴 여기부터가 «부르면 도는 몸»이다 */
const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'make-cardnews-100y-nps-cap-size.mjs';
if (내가직접불렸나) {
  const sharp = createRequire(path.join(ROOT, 'package.json'))('sharp');
  fs.mkdirSync(낼방, { recursive: true });
  const 장들 = 짜기();
  for (let i = 0; i < 장들.length; i++) {
    const svg = 그리기(장들[i], i + 1, 장들.length, 바닥, 갈곳);
    await sharp(Buffer.from(svg)).png().toFile(path.join(낼방, `국민연금상한-회사규모-${i + 1}.png`));
    console.log('✅', `국민연금상한-회사규모-${i + 1}.png`);
  }
  console.log('⛔ 주소 없는 카드는 안 만든다 — 모든 장에', 갈곳);
}
