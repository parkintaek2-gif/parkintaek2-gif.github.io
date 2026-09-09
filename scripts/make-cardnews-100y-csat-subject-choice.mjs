/**
 * make-cardnews-100y-csat-subject-choice.mjs — 카드뉴스 「수능 탐구, 사탐 쪽으로 얼마나 쏠렸나」 6장
 *
 * 🔴 사장님 상시 지시 — **매일 카드·카드뉴스·숏영상도 낸다. 외부유입용이다.**
 * ⛔ 주소 없는 카드는 안 만든다 — 여섯 장 전부에 100yearmap.com/csat-subject-choice 를 박는다.
 * ⛔ 순위·등수 낱말을 쓰지 않는다.
 *
 * 쓰는 법  node scripts/make-cardnews-100y-csat-subject-choice.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { 그리기 } from './make-cardnews-100y-voc.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const 낼방 = path.join(ROOT, 'public', '100y', 'cardnews');
const 자료 = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/100yearmap/csat-subject-choice.json'), 'utf8'));

export const 갈곳 = '100yearmap.com/csat-subject-choice';
export const 바닥 = 'KICE 응시원서 접수 결과 보도자료(언론 인용, 다수 매체 교차확인)';

export const 해26 = 자료.학년도2026;
export const 해27 = 자료.학년도2027;

export function 짜기() {
  return [
    {
      꼴: '표지',
      큰수: `${해27.사탐과탐배수}배`,
      줄들: ['사탐만 고른 사람이', '과탐만 고른 사람의', `몇 배인지입니다(작년 ${해26.사탐과탐배수}배).`],
    },
    {
      머리: '「사탐런」, 숫자로 보면',
      줄들: [
        `사탐만 ${해26.사탐만.비율}% → ${해27.사탐만.비율}%`,
        `과탐만 ${해26.과탐만.비율}% → ${해27.과탐만.비율}%`,
      ],
    },
    {
      머리: '2026학년도 — 전체 지원자 안에서',
      줄들: [
        `사탐만  ${해26.사탐만.인원.toLocaleString()}명(${해26.사탐만.비율}%)`,
        `과탐만  ${해26.과탐만.인원.toLocaleString()}명(${해26.과탐만.비율}%)`,
        `교차    ${해26.교차.인원.toLocaleString()}명(${해26.교차.비율}%)`,
      ],
    },
    {
      머리: '2027학년도 — 전체 지원자 안에서',
      줄들: [
        `사탐만  ${해27.사탐만.인원.toLocaleString()}명(${해27.사탐만.비율}%)`,
        `과탐만  ${해27.과탐만.인원.toLocaleString()}명(${해27.과탐만.비율}%)`,
        `교차    ${해27.교차.인원.toLocaleString()}명(${해27.교차.비율}%)`,
      ],
    },
    {
      머리: '⚠ 이 자료로 말할 수 없는 것',
      줄들: ['시도별 갈래는 못 쟀습니다.', '왜 사탐이 느는지도 이 자료는', '답하지 않습니다 — 원인은 안 잽니다.'],
    },
    {
      꼴: '마무리',
      머리: '숫자만 보여드립니다',
      줄들: ['어느 과목이 유리한지는', '이 자료가 답할 수 없습니다.', '', '출처 — KICE 응시원서 접수 결과', '보도자료(언론 인용)'],
    },
  ];
}

/* ── 자가시험 ─────────────────────────────────────────── */
if (process.argv.includes('--selftest')) {
  const 본다 = (말, 참) => { console.log(참 ? '✅' : '🔴', 말); if (!참) process.exitCode = 1; };
  const 장들 = 짜기();
  const 민글 = 장들.map((장, i) => 그리기(장, i + 1, 장들.length, 바닥, 갈곳)).join('\n')
    .replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

  본다('① 여섯 장이다', 장들.length === 6);
  본다('② 표지에 올해·작년 배수가 있다',
    민글.includes(String(해27.사탐과탐배수)) && 민글.includes(String(해26.사탐과탐배수)));
  본다('③ 2026학년도 세 갈래 인원·비율이 다 있다',
    [해26.사탐만, 해26.과탐만, 해26.교차].every((x) => 민글.includes(x.인원.toLocaleString()) && 민글.includes(String(x.비율))));
  본다('④ 2027학년도 세 갈래 인원·비율이 다 있다',
    [해27.사탐만, 해27.과탐만, 해27.교차].every((x) => 민글.includes(x.인원.toLocaleString()) && 민글.includes(String(x.비율))));
  본다('⑤ 「말할 수 없는 것」이 카드에 있다', 민글.includes('시도별') && 민글.includes('원인은 안 잽니다'));
  const 걸린 = ['등수', '순위', '랭킹', '몇 위', '꼴찌'].filter((w) => 민글.includes(w));
  본다(`⑥ ⛔ 줄 세우기 낱말이 없다${걸린.length ? ` — ${걸린.join(' · ')}` : ''}`, 걸린.length === 0);
  본다('⑦ 🔴 모든 장에 데려갈 주소가 있다',
    장들.every((장, i) => 그리기(장, i + 1, 장들.length, 바닥, 갈곳).includes(갈곳)));
  본다('⑧ 🔴 남의 카드 주소가 안 섞였다',
    !민글.includes('100yearmap.com/csat-applicant-mix') && !민글.includes('100yearmap.com/trendy-major-outcomes'));

  console.log(`\n올해 배수 ${해27.사탐과탐배수} · 작년 배수 ${해26.사탐과탐배수}`);
  process.exit();
}

/* 🔴 여기부터가 «부르면 도는 몸»이다 */
const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'make-cardnews-100y-csat-subject-choice.mjs';
if (내가직접불렸나) {
  const sharp = createRequire(path.join(ROOT, 'package.json'))('sharp');
  fs.mkdirSync(낼방, { recursive: true });
  const 장들 = 짜기();
  for (let i = 0; i < 장들.length; i++) {
    const svg = 그리기(장들[i], i + 1, 장들.length, 바닥, 갈곳);
    await sharp(Buffer.from(svg)).png().toFile(path.join(낼방, `사탐런-${i + 1}.png`));
    console.log('✅', `사탐런-${i + 1}.png`);
  }
  console.log('⛔ 주소 없는 카드는 안 만든다 — 모든 장에', 갈곳);
}
