/**
 * make-cardnews-100y-lifelong.mjs — 카드뉴스 「나이대별 평생학습 참여율」 5장
 *
 * 🔴 교육(성인) 분야 첫 카드뉴스(사장님 「0~100세×다섯 분야」 지시, 1단계 로드맵 3번째).
 * ⭐ 이번엔 짐작이 그대로 맞았다 — 나이 들수록 한 번도 안 꺾이고 내려간다. 카드도 그대로 싣는다.
 *
 * 쓰는 법  node scripts/make-cardnews-100y-lifelong.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { 그리기 } from './make-cardnews-100y-voc.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const 낼방 = path.join(ROOT, 'public', '100y', 'cardnews');
const 자료 = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/100yearmap/lifelong.json'), 'utf8'));

export const 갈곳 = '100yearmap.com/lifelong';
export const 바닥 = `${자료.출처.기관} · 평생학습 참여율`;

export const 나이별 = 자료.나이별;
export const 흐름 = 자료['⭐ 나이 들수록 계속 낮아지나'];

export function 짜기() {
  return [
    {
      꼴: '표지',
      큰수: `${흐름.최고값}%`,
      줄들: [`${흐름.최고칸}가 평생학습`, '참여율 가장 높습니다.'],
    },
    {
      머리: '나이대로 봅니다',
      줄들: 나이별.map((r) => `${r.칸}   ${r.참여율}%`),
    },
    {
      머리: '⭐ 한 번도 안 꺾이고 내려갑니다',
      줄들: [
        `${흐름.최고칸} ${흐름.최고값}%에서`,
        `${흐름.최저칸} ${흐름.최저값}%까지`,
        '',
        '중간에 오르는 나이대가',
        '하나도 없습니다.',
      ],
    },
    {
      머리: '대부분 «비형식교육»입니다',
      줄들: [
        '직업훈련·평생교육원 등',
        '학위과정(형식교육)은',
        '어느 나이대든 1% 안팎,',
        '70대는 표본이 없어',
        '못 쟀습니다(X).',
      ],
    },
    {
      꼴: '마무리',
      머리: '더 배워야 한다고 쓰지 않습니다',
      줄들: [
        '이것은 통계이지',
        '당신이 아닙니다.',
        '',
        `출처 — ${자료.출처.기관}`,
        `${자료.최신}년 KOSIS`,
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
  본다('② 표지에 최고값이 있다', 장들[0].꼴 === '표지' && 장들[0].큰수.includes(String(흐름.최고값)));
  본다('③ ⭐ 최저칸·최저값을 실었다', 민글.includes(흐름.최저칸) && 민글.includes(String(흐름.최저값)));
  본다('④ ⭐ 한 번도 안 꺾인다는 것을 한 장 통째로 썼다', 장들[2].머리.includes('안 꺾이고'));
  const 걸린 = ['등수', '순위', '랭킹', '몇 위', '해야 합니다', '들어야 합니다'].filter((w) => 민글.includes(w));
  본다(`⑤ ⛔ 더 배워야 한다고 안 쓴다${걸린.length ? ` — ${걸린.join(' · ')}` : ''}`, 걸린.length === 0);
  본다('⑥ 🔴 모든 장에 데려갈 주소가 있다',
    장들.every((장, i) => 그리기(장, i + 1, 장들.length, 바닥, 갈곳).includes(갈곳)));
  본다('⑦ 🔴 남의 카드 주소가 안 섞였다',
    !민글.includes('100yearmap.com/oneperson') && !민글.includes('100yearmap.com/exercise'));

  const 댈수 = new Set([
    흐름.최고값, 흐름.최저값, Number(자료.최신), 장들.length,
    20, 30, 40, 50, 60, 70,
    ...나이별.map((r) => r.참여율),
  ].filter((v) => v != null).map(String));
  const 못댄것 = [...민글.split(갈곳).join(' ').matchAll(/\d[\d,]*\.?\d*/g)]
    .map((m) => m[0].replace(/,/g, '')).filter((s) => !댈수.has(s) && !/^[1-5]$/.test(s) && s !== '10');
  본다(`⑧ 화면의 수가 전부 자료에서 온다${못댄것.length ? ` — 못 댄 것: ${[...new Set(못댄것)].slice(0, 6).join(' · ')}` : ''}`,
    못댄것.length === 0);

  console.log(`\n최고칸 ${흐름.최고칸} ${흐름.최고값}% · 최저칸 ${흐름.최저칸} ${흐름.최저값}%`);
  process.exit();
}

/* 🔴 여기부터가 «부르면 도는 몸»이다 */
const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'make-cardnews-100y-lifelong.mjs';
if (내가직접불렸나) {
  const sharp = createRequire(path.join(ROOT, 'package.json'))('sharp');
  fs.mkdirSync(낼방, { recursive: true });
  const 장들 = 짜기();
  for (let i = 0; i < 장들.length; i++) {
    const svg = 그리기(장들[i], i + 1, 장들.length, 바닥, 갈곳);
    await sharp(Buffer.from(svg)).png().toFile(path.join(낼방, `평생학습참여율-${i + 1}.png`));
    console.log('✅', `평생학습참여율-${i + 1}.png`);
  }
  console.log('⛔ 주소 없는 카드는 안 만든다 — 모든 장에', 갈곳);
}
