/**
 * make-cardnews-100y-promotion.mjs — 카드뉴스 「승진에 만족하는 사람은 몇 %」 5장
 *
 * 🔴 사장님 상시 지시 — 매일 카드·카드뉴스·숏영상도 낸다. 외부유입용이다.
 * ⛔ 주소 없는 카드는 안 만든다 — 다섯 장 전부에 100yearmap.com/promotion 를 박는다.
 * ⛔⛔ 처음 세운 「직급 오를수록 계속 벌어진다」 가설은 틀렸다(차장급은 여성이 더 높다).
 *   그래서 「임원급에서만 제일 크다」로 정직하게 좁혀 냈다 — 카드도 그대로 따른다.
 *
 * 쓰는 법  node scripts/make-cardnews-100y-promotion.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { 그리기 } from './make-cardnews-100y-voc.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const 낼방 = path.join(ROOT, 'public', '100y', 'cardnews');
const 자료 = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/100yearmap/promotion.json'), 'utf8'));

export const 갈곳 = '100yearmap.com/promotion';
export const 바닥 = `${자료.출처.기관} · 여성관리자패널`;

export const 최신흐름 = 자료.최신흐름;
export const 직급별 = 자료.직급별;
export const 맨위차 = 자료.맨위차;
export const 만족계 = (분포) => Math.round((분포['만족하는 편이다'] + 분포['매우 만족한다']) * 10) / 10;
export const 여만족 = 만족계(자료.분포_여);
export const 남만족 = 만족계(자료.분포_남);
export const 임원급 = 직급별[직급별.length - 1];
export const 차장급 = 직급별[1];

export function 짜기() {
  return [
    {
      꼴: '표지',
      큰수: `${여만족}% · ${남만족}%`,
      줄들: ['승진에 만족한다고 답한', '여성과 남성 비율입니다.'],
    },
    {
      머리: '직급이 오를수록 다 같이 오르진 않습니다',
      줄들: 직급별.map((r) => `${r.칸}   여 ${r.여평균} · 남 ${r.남평균}`),
    },
    {
      머리: `⛔ ${차장급.칸}에서는 여성이 더 높습니다`,
      줄들: [
        `${차장급.칸}   여성 ${차장급.여평균}`,
        `${차장급.칸}   남성 ${차장급.남평균}`,
        '',
        '그런데',
      ],
    },
    {
      머리: `${임원급.칸}에서는 다릅니다`,
      줄들: [
        `${임원급.칸}   여성 ${임원급.여평균}`,
        `${임원급.칸}   남성 ${임원급.남평균}`,
        '',
        `차이 ${맨위차.맨위}점 — 다른 직급(최대 ${맨위차.나머지최대}점)보다`,
        '뚜렷이 큽니다.',
      ],
    },
    {
      꼴: '마무리',
      머리: '이 회사가 좋다 나쁘다로 쓰지 않습니다',
      줄들: [
        '이것은 통계이지',
        '당신이 아닙니다.',
        '',
        `출처 — ${자료.출처.기관}`,
        `${최신흐름.해}년 · 여성관리자패널`,
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
  본다('② 표지에 여성·남성 만족률이 있다', 장들[0].꼴 === '표지' && 장들[0].큰수.includes(String(여만족)) && 장들[0].큰수.includes(String(남만족)));
  본다('③ ⛔ 차장급 역전을 한 장 통째로 썼다', 장들[2].머리.includes('여성이 더 높습니다'));
  본다('④ ⭐ 임원급 차이를 실었다', 민글.includes(String(맨위차.맨위)) && 민글.includes(String(맨위차.나머지최대)));
  const 걸린 = ['등수', '순위', '랭킹', '몇 위', '늦었', '좋습니다', '나쁩니다'].filter((w) => 민글.includes(w));
  본다(`⑤ ⛔ 회사 좋다·나쁘다로 안 쓴다${걸린.length ? ` — ${걸린.join(' · ')}` : ''}`, 걸린.length === 0);
  본다('⑥ 🔴 모든 장에 데려갈 주소가 있다',
    장들.every((장, i) => 그리기(장, i + 1, 장들.length, 바닥, 갈곳).includes(갈곳)));
  본다('⑦ 🔴 남의 카드 주소가 안 섞였다',
    !민글.includes('100yearmap.com/pets') && !민글.includes('100yearmap.com/travel'));

  const 댈수 = new Set([
    여만족, 남만족, 맨위차.맨위, 맨위차.나머지최대, Number(최신흐름.해), 장들.length,
    ...직급별.flatMap((r) => [r.여평균, r.남평균]),
  ].filter((v) => v != null).map(String));
  const 못댄것 = [...민글.split(갈곳).join(' ').matchAll(/\d[\d,]*\.?\d*/g)]
    .map((m) => m[0].replace(/,/g, '')).filter((s) => !댈수.has(s) && !/^[1-5]$/.test(s));
  본다(`⑧ 화면의 수가 전부 자료에서 온다${못댄것.length ? ` — 못 댄 것: ${[...new Set(못댄것)].slice(0, 6).join(' · ')}` : ''}`,
    못댄것.length === 0);

  console.log(`\n여 ${여만족}% · 남 ${남만족}% · 임원급 차 ${맨위차.맨위}`);
  process.exit();
}

/* 🔴 여기부터가 «부르면 도는 몸»이다 */
const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'make-cardnews-100y-promotion.mjs';
if (내가직접불렸나) {
  const sharp = createRequire(path.join(ROOT, 'package.json'))('sharp');
  fs.mkdirSync(낼방, { recursive: true });
  const 장들 = 짜기();
  for (let i = 0; i < 장들.length; i++) {
    const svg = 그리기(장들[i], i + 1, 장들.length, 바닥, 갈곳);
    await sharp(Buffer.from(svg)).png().toFile(path.join(낼방, `승진만족도-${i + 1}.png`));
    console.log('✅', `승진만족도-${i + 1}.png`);
  }
  console.log('⛔ 주소 없는 카드는 안 만든다 — 모든 장에', 갈곳);
}
