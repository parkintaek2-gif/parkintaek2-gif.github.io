/**
 * make-cardnews-100y-pets.mjs — 카드뉴스 「몇 %가 반려동물을 기르나」 5장
 *
 * 🔴 사장님 상시 지시 — 매일 카드·카드뉴스·숏영상도 낸다. 외부유입용이다.
 * ⛔ 주소 없는 카드는 안 만든다 — 다섯 장 전부에 100yearmap.com/pets 를 박는다.
 * ⛔⛔ 이 카드가 가장 조심할 것 — 「기르는 가구 안에서」와 「전체 가구 중」을 안 섞는다.
 *   양육률(전체 3,000가구 중 29.2%)과 종류 비중(기르는 867가구 중 개 80.5%)은 분모가 다르다.
 *
 * 쓰는 법  node scripts/make-cardnews-100y-pets.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { 그리기 } from './make-cardnews-100y-voc.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const 낼방 = path.join(ROOT, 'public', '100y', 'cardnews');
const 자료 = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/100yearmap/pets.json'), 'utf8'));

export const 갈곳 = '100yearmap.com/pets';
export const 바닥 = `${자료.출처.기관} · 표본조사입니다`;

export const 전체 = 자료.전체;
export const 스물대 = 자료.연령별.find((r) => r.칸 === '20대');
export const 예순이상 = 자료.연령별.find((r) => r.칸 === '60대 이상');

export function 짜기() {
  return [
    {
      꼴: '표지',
      큰수: `${전체.양육몫}%`,
      줄들: ['지금 반려동물을', '기르고 있습니다.'],
    },
    {
      머리: '나이대로 크게 안 갈립니다',
      줄들: [
        `20대   ${자료.연령별.find((r) => r.칸 === '20대').양육몫}%`,
        `30대   ${자료.연령별.find((r) => r.칸 === '30대').양육몫}%`,
        `40대   ${자료.연령별.find((r) => r.칸 === '40대').양육몫}%`,
        `50대   ${자료.연령별.find((r) => r.칸 === '50대').양육몫}%`,
        `60대 이상   ${예순이상.양육몫}%`,
      ],
    },
    {
      머리: '⛔ 그런데 「기르는 가구 안에서는」',
      줄들: [
        '개·고양이 비중이',
        '나이대로 뚜렷이 갈립니다.',
        '',
        `20대   개 ${스물대.개몫}% · 고양이 ${스물대.고양이몫}%`,
        `60대이상 개 ${예순이상.개몫}% · 고양이 ${예순이상.고양이몫}%`,
      ],
    },
    {
      머리: '재는 것이 다릅니다',
      줄들: [
        '양육률은 «전체 가구 중»이고',
        '종류 비중은',
        '«이미 기르는 가구 중»입니다.',
        '',
        '두 수를 같은 분모로',
        '읽으면 안 됩니다.',
      ],
    },
    {
      꼴: '마무리',
      머리: '개나 고양이가 낫다고 쓰지 않습니다',
      줄들: [
        '이것은 통계이지',
        '당신이 아닙니다.',
        '',
        `출처 — ${자료.출처.기관}`,
        `${자료.최신}년 · 표본 ${전체.사례수.toLocaleString()}가구`,
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
  본다('② 표지에 큰 수가 있다', 장들[0].꼴 === '표지' && 장들[0].큰수.includes(String(전체.양육몫)));
  본다('③ ⛔ 종류 비중이 다른 분모임을 한 장 통째로 썼다',
    장들[3].줄들.join(' ').includes('같은 분모로'));
  본다('④ ⛔ 나이대별 개·고양이 비중을 실었다', 민글.includes(String(스물대.개몫)) && 민글.includes(String(예순이상.고양이몫)));
  const 걸린 = ['등수', '순위', '랭킹', '몇 위', '늦었', '나아', '낫습니다'].filter((w) => 민글.includes(w));
  본다(`⑤ ⛔ 줄도 안 세우고 낫다고도 안 한다${걸린.length ? ` — ${걸린.join(' · ')}` : ''}`, 걸린.length === 0);
  본다('⑥ 🔴 모든 장에 데려갈 주소가 있다',
    장들.every((장, i) => 그리기(장, i + 1, 장들.length, 바닥, 갈곳).includes(갈곳)));
  본다('⑦ 🔴 남의 카드 주소가 안 섞였다',
    !민글.includes('100yearmap.com/travel') && !민글.includes('100yearmap.com/marriage-age'));

  const 댈수 = new Set([
    전체.양육몫, 전체.사례수, Number(자료.최신), 장들.length,
    20, 30, 40, 50, 60,
    ...['20대', '30대', '40대', '50대', '60대 이상'].map((c) => 자료.연령별.find((r) => r.칸 === c).양육몫),
    스물대.개몫, 스물대.고양이몫, 예순이상.개몫, 예순이상.고양이몫,
  ].filter((v) => v != null).map(String));
  const 못댄것 = [...민글.split(갈곳).join(' ').matchAll(/\d[\d,]*\.?\d*/g)]
    .map((m) => m[0].replace(/,/g, '')).filter((s) => !댈수.has(s) && !/^[1-5]$/.test(s));
  본다(`⑧ 화면의 수가 전부 자료에서 온다${못댄것.length ? ` — 못 댄 것: ${[...new Set(못댄것)].slice(0, 6).join(' · ')}` : ''}`,
    못댄것.length === 0);

  console.log(`\n양육률 ${전체.양육몫}% · 20대 개${스물대.개몫}%/고양이${스물대.고양이몫}% · ${자료.최신}년`);
  process.exit();
}

/* 🔴 여기부터가 «부르면 도는 몸»이다 */
const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'make-cardnews-100y-pets.mjs';
if (내가직접불렸나) {
  const sharp = createRequire(path.join(ROOT, 'package.json'))('sharp');
  fs.mkdirSync(낼방, { recursive: true });
  const 장들 = 짜기();
  for (let i = 0; i < 장들.length; i++) {
    const svg = 그리기(장들[i], i + 1, 장들.length, 바닥, 갈곳);
    await sharp(Buffer.from(svg)).png().toFile(path.join(낼방, `반려동물기르는비율-${i + 1}.png`));
    console.log('✅', `반려동물기르는비율-${i + 1}.png`);
  }
  console.log('⛔ 주소 없는 카드는 안 만든다 — 모든 장에', 갈곳);
}
