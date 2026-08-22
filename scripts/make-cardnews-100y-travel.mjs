/**
 * make-cardnews-100y-travel.mjs — 카드뉴스 「1년에 국내여행 며칠이나 갈까」 5장
 *
 * 🔴 사장님 상시 지시 — 매일 카드·카드뉴스·숏영상도 낸다. 외부유입용이다.
 * ⛔ 주소 없는 카드는 안 만든다 — 다섯 장 전부에 100yearmap.com/travel 를 박는다.
 * ⛔ 2020~2021년은 코로나 시기다 — 「평소」로 안 읽는다. 셋째 장에 그대로 밝힌다.
 *
 * 쓰는 법  node scripts/make-cardnews-100y-travel.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { 그리기 } from './make-cardnews-100y-voc.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const 낼방 = path.join(ROOT, 'public', '100y', 'cardnews');
const 자료 = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/100yearmap/travel.json'), 'utf8'));

export const 갈곳 = '100yearmap.com/travel';
export const 바닥 = `${자료.출처.기관} · 국민여행조사`;

export const 최신칸 = 자료.최신칸;
export const 가장많은연령 = 자료.가장많은연령;
export const 가장적은연령 = 자료.가장적은연령;
export const 회복 = 자료.회복;

export function 짜기() {
  return [
    {
      꼴: '표지',
      큰수: `${최신칸.국내전체}일`,
      줄들: ['1인 평균', `${자료.최신}년 국내여행 일수입니다.`],
    },
    {
      머리: '나이대로 갈립니다',
      줄들: [
        `${가장많은연령.칸}   ${가장많은연령.국내전체}일`,
        `${가장적은연령.칸}   ${가장적은연령.국내전체}일`,
        '',
        `차이는 ${Math.round((가장많은연령.국내전체 - 가장적은연령.국내전체) * 10) / 10}일입니다.`,
      ],
    },
    {
      머리: '⛔ 2020~2021년은 코로나 시기입니다',
      줄들: [
        `${자료.흐름[0].해}년   ${자료.흐름[0].국내전체}일`,
        '2020년   7.65일',
        '2021년   7.99일',
        `${자료.최신}년   ${최신칸.국내전체}일`,
        '',
        '그 두 해를 «평소»로',
        '읽으면 안 됩니다.',
      ],
    },
    {
      머리: '코로나 전으로 돌아왔을까요',
      줄들: [
        `코로나 전(2018~2019) 평균 ${회복.코로나전평균}일`,
        `${자료.최신}년 ${회복.최근}일`,
        '',
        회복.회복 ? '넘었습니다.' : '아직 못 미칩니다.',
      ],
    },
    {
      꼴: '마무리',
      머리: '더 가야 한다고 쓰지 않습니다',
      줄들: [
        '이것은 통계이지',
        '당신이 아닙니다.',
        '',
        `출처 — ${자료.출처.기관}`,
        `${자료.해들[0]}~${자료.최신}년`,
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
  본다('② 표지에 큰 수가 있다', 장들[0].꼴 === '표지' && 장들[0].큰수.includes(String(최신칸.국내전체)));
  본다('③ ⛔ 코로나 두 해를 밝혔다', 민글.includes('7.65') && 민글.includes('7.99'));
  본다('④ ⚠ 회복 여부를 정직하게 실었다', 민글.includes(회복.회복 ? '넘었습니다' : '아직 못 미칩니다'));
  const 걸린 = ['등수', '순위', '랭킹', '몇 위', '늦었', '가야 합니다', '가야합니다'].filter((w) => 민글.includes(w));
  본다(`⑤ ⛔ 줄도 안 세우고 재촉도 안 한다${걸린.length ? ` — ${걸린.join(' · ')}` : ''}`, 걸린.length === 0);
  본다('⑥ 🔴 모든 장에 데려갈 주소가 있다',
    장들.every((장, i) => 그리기(장, i + 1, 장들.length, 바닥, 갈곳).includes(갈곳)));
  본다('⑦ 🔴 남의 카드 주소가 안 섞였다',
    !민글.includes('100yearmap.com/pets') && !민글.includes('100yearmap.com/promotion'));

  const 댈수 = new Set([
    최신칸.국내전체, 가장많은연령.국내전체, 가장적은연령.국내전체,
    Math.round((가장많은연령.국내전체 - 가장적은연령.국내전체) * 10) / 10,
    자료.흐름[0].국내전체, 7.65, 7.99, 회복.코로나전평균, 회복.최근,
    Number(자료.흐름[0].해), Number(자료.최신), 2020, 2021, 2018, 2019, 자료.해들.length, 장들.length,
    30, 70,
  ].filter((v) => v != null).map(String));
  const 못댄것 = [...민글.split(갈곳).join(' ').matchAll(/\d[\d,]*\.?\d*/g)]
    .map((m) => m[0].replace(/,/g, '')).filter((s) => !댈수.has(s) && !/^[1-5]$/.test(s));
  본다(`⑧ 화면의 수가 전부 자료에서 온다${못댄것.length ? ` — 못 댄 것: ${[...new Set(못댄것)].slice(0, 6).join(' · ')}` : ''}`,
    못댄것.length === 0);

  console.log(`\n${자료.최신}년 ${최신칸.국내전체}일 · ${가장많은연령.칸} 최다 · 회복 ${회복.회복}`);
  process.exit();
}

/* 🔴 여기부터가 «부르면 도는 몸»이다 */
const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'make-cardnews-100y-travel.mjs';
if (내가직접불렸나) {
  const sharp = createRequire(path.join(ROOT, 'package.json'))('sharp');
  fs.mkdirSync(낼방, { recursive: true });
  const 장들 = 짜기();
  for (let i = 0; i < 장들.length; i++) {
    const svg = 그리기(장들[i], i + 1, 장들.length, 바닥, 갈곳);
    await sharp(Buffer.from(svg)).png().toFile(path.join(낼방, `국내여행일수-${i + 1}.png`));
    console.log('✅', `국내여행일수-${i + 1}.png`);
  }
  console.log('⛔ 주소 없는 카드는 안 만든다 — 모든 장에', 갈곳);
}
