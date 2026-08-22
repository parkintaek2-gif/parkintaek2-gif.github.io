/**
 * make-cardnews-100y-exercise.mjs — 카드뉴스 「몇 %가 규칙적으로 운동하나」 5장
 *
 * 🔴 예체능 분야 첫 카드뉴스(사장님 「0~100세×다섯 분야」 지시).
 * ⭐ 사장님 「동호회는 나이 들수록 더 활발」 가설을 검증했더니 절반만 맞았다 —
 *   50대까지는 오르고 그 뒤로 내려간다. 카드도 그 정직한 결과를 그대로 싣는다.
 *
 * 쓰는 법  node scripts/make-cardnews-100y-exercise.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { 그리기 } from './make-cardnews-100y-voc.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const 낼방 = path.join(ROOT, 'public', '100y', 'cardnews');
const 자료 = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/100yearmap/exercise.json'), 'utf8'));

export const 갈곳 = '100yearmap.com/exercise';
export const 바닥 = `${자료.출처.기관} · 국민생활체육조사`;

export const 운동나이별 = 자료.운동나이별;
export const 동호회나이별 = 자료.동호회나이별;
export const 동호회최고 = 자료.동호회최고;
export const 최고운동칸 = [...운동나이별].sort((a, b) => b.주1회이상 - a.주1회이상)[0];
export const 최저운동칸 = [...운동나이별].sort((a, b) => a.주1회이상 - b.주1회이상)[0];

export function 짜기() {
  return [
    {
      꼴: '표지',
      큰수: `${최고운동칸.주1회이상}%`,
      줄들: [`${최고운동칸.칸}가 주1회 이상`, '운동합니다.'],
    },
    {
      머리: '나이대로 봅니다',
      줄들: 운동나이별.map((r) => `${r.칸}   ${r.주1회이상}%`),
    },
    {
      머리: '⭐ 동호회로 하는 사람은?',
      줄들: [
        `${동호회최고.최고칸}   ${동호회최고.최고값}%(가장 높음)`,
        `10대   ${동호회나이별[0].참여율}%`,
        `70세 이상   ${동호회나이별[동호회나이별.length - 1].참여율}%`,
      ],
    },
    {
      머리: '⛔ "나이 들수록 계속 는다"는 절반만 맞습니다',
      줄들: [
        `10대 → ${동호회최고.최고칸}까지는`,
        '또렷이 오릅니다.',
        '',
        '그런데 그 뒤로는',
        '다시 낮아집니다.',
      ],
    },
    {
      꼴: '마무리',
      머리: '운동해야 한다고 쓰지 않습니다',
      줄들: [
        '이것은 통계이지',
        '당신이 아닙니다.',
        '',
        `출처 — ${자료.출처.기관}`,
        `${자료.최신}년 국민생활체육조사`,
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
  본다('② 표지에 큰 수가 있다', 장들[0].꼴 === '표지' && 장들[0].큰수.includes(String(최고운동칸.주1회이상)));
  본다('③ ⭐ 동호회 최고 나이대를 실었다', 민글.includes(동호회최고.최고칸) && 민글.includes(String(동호회최고.최고값)));
  본다('④ ⛔ 가설이 절반만 맞다는 것을 한 장 통째로 썼다', 장들[3].머리.includes('절반만 맞습니다'));
  const 걸린 = ['등수', '순위', '랭킹', '몇 위', '해야 합니다', '들어야 합니다'].filter((w) => 민글.includes(w));
  본다(`⑤ ⛔ 운동·동호회를 해야 한다고 안 쓴다${걸린.length ? ` — ${걸린.join(' · ')}` : ''}`, 걸린.length === 0);
  본다('⑥ 🔴 모든 장에 데려갈 주소가 있다',
    장들.every((장, i) => 그리기(장, i + 1, 장들.length, 바닥, 갈곳).includes(갈곳)));
  본다('⑦ 🔴 남의 카드 주소가 안 섞였다',
    !민글.includes('100yearmap.com/promotion') && !민글.includes('100yearmap.com/pets'));

  const 댈수 = new Set([
    최고운동칸.주1회이상, 동호회최고.최고값, 동호회나이별[0].참여율,
    동호회나이별[동호회나이별.length - 1].참여율, Number(자료.최신), 장들.length,
    20, 30, 40, 50, 60, 70,
    ...운동나이별.map((r) => r.주1회이상),
  ].filter((v) => v != null).map(String));
  const 못댄것 = [...민글.split(갈곳).join(' ').matchAll(/\d[\d,]*\.?\d*/g)]
    .map((m) => m[0].replace(/,/g, '')).filter((s) => !댈수.has(s) && !/^[1-5]$/.test(s) && s !== '10');
  본다(`⑧ 화면의 수가 전부 자료에서 온다${못댄것.length ? ` — 못 댄 것: ${[...new Set(못댄것)].slice(0, 6).join(' · ')}` : ''}`,
    못댄것.length === 0);

  console.log(`\n최고운동 ${최고운동칸.칸} ${최고운동칸.주1회이상}% · 동호회최고 ${동호회최고.최고칸} ${동호회최고.최고값}%`);
  process.exit();
}

/* 🔴 여기부터가 «부르면 도는 몸»이다 */
const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'make-cardnews-100y-exercise.mjs';
if (내가직접불렸나) {
  const sharp = createRequire(path.join(ROOT, 'package.json'))('sharp');
  fs.mkdirSync(낼방, { recursive: true });
  const 장들 = 짜기();
  for (let i = 0; i < 장들.length; i++) {
    const svg = 그리기(장들[i], i + 1, 장들.length, 바닥, 갈곳);
    await sharp(Buffer.from(svg)).png().toFile(path.join(낼방, `운동참여율-${i + 1}.png`));
    console.log('✅', `운동참여율-${i + 1}.png`);
  }
  console.log('⛔ 주소 없는 카드는 안 만든다 — 모든 장에', 갈곳);
}
