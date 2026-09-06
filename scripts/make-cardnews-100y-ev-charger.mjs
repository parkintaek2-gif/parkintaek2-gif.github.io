/**
 * make-cardnews-100y-ev-charger.mjs — 카드뉴스 「아파트가 오래될수록 전기차 충전기가 부족할까요」 6장
 *
 * 🔴 사장님 상시 지시 — **매일 카드·카드뉴스·숏영상도 낸다. 외부유입용이다.**
 * ⛔ 주소 없는 카드는 안 만든다 — 여섯 장 전부에 100yearmap.com/ev-charger-by-age 를 박는다.
 * ⛔ 순위·등수 낱말을 쓰지 않는다.
 *
 * 쓰는 법  node scripts/make-cardnews-100y-ev-charger.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { 그리기 } from './make-cardnews-100y-voc.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const 낼방 = path.join(ROOT, 'public', '100y', 'cardnews');
const 자료 = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/100yearmap/ev-charger-by-age.json'), 'utf8'));

export const 갈곳 = '100yearmap.com/ev-charger-by-age';
export const 바닥 = 'K-apt 공동주택관리정보시스템 · 2026-09-04 받음';

export const 나이띠별 = 자료.나이띠별;
export const 가장부족 = 나이띠별.reduce((a, b) => (b.전기차당충전기 > a.전기차당충전기 ? b : a));
export const 가장넉넉 = 나이띠별.reduce((a, b) => (b.전기차당충전기 < a.전기차당충전기 ? b : a));
export const 배수 = Math.round((가장부족.전기차당충전기 / 가장넉넉.전기차당충전기) * 10) / 10;

export function 짜기() {
  return [
    {
      꼴: '표지',
      큰수: `${배수}배`,
      줄들: [`${가장부족.띠}년 준공 아파트는`, `${가장넉넉.띠}년 준공보다 전기차 충전기가`, `전기차당 ${배수}배 더 모자랍니다.`],
    },
    {
      머리: '2020년대 준공은 다릅니다',
      줄들: [
        `전기차 ${가장넉넉.전기차당충전기}대당 충전기 1대`,
        '오히려 여유롭습니다.',
      ],
    },
    {
      머리: '준공연도별로 나눠 보면',
      줄들: 나이띠별.map((r) => `${r.띠}  ${r.전기차당충전기}대당 1대`),
    },
    {
      머리: '서울에서',
      줄들: [
        `${자료['EV있는데충전기0대인단지']}개 단지는`,
        '전기차는 있는데',
        '충전기가 0대입니다.',
      ],
    },
    {
      머리: '⚠ 주차공간과 같은 구조입니다',
      줄들: [
        '옛 아파트일수록 세대당 주차도',
        '전기차 충전기도 모자랍니다.',
        '',
        '왜 그런지는 이 자료로 못 가릅니다.',
      ],
    },
    {
      꼴: '마무리',
      머리: '충전기를 늘리라고 쓰지 않습니다',
      줄들: [
        '준공연도별로 전기차 충전 인프라가',
        '어떻게 다른지가 전부입니다.',
        '',
        '출처 — K-apt 공동주택관리정보시스템',
        '웹참조자료(2026-09-04 받음)',
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

  본다('① 여섯 장이다', 장들.length === 6);
  본다('② 표지에 배수가 있다', 장들[0].큰수.includes(String(배수)));
  본다('③ 가장 넉넉한 띠 값이 카드에 있다', 민글.includes(String(가장넉넉.전기차당충전기)));
  본다('④ 나이띠 다섯이 다 카드에 있다', 나이띠별.every((r) => 민글.includes(r.띠)));
  본다('⑤ EV있는데 충전기 0대인 단지 수가 카드에 있다', 민글.includes(String(자료['EV있는데충전기0대인단지'])));
  const 걸린 = ['등수', '순위', '랭킹', '몇 위', '꼴찌'].filter((w) => 민글.includes(w));
  본다(`⑥ ⛔ 줄 세우기 낱말이 없다${걸린.length ? ` — ${걸린.join(' · ')}` : ''}`, 걸린.length === 0);
  본다('⑦ 🔴 모든 장에 데려갈 주소가 있다',
    장들.every((장, i) => 그리기(장, i + 1, 장들.length, 바닥, 갈곳).includes(갈곳)));
  본다('⑧ 🔴 남의 카드 주소가 안 섞였다',
    !민글.includes('100yearmap.com/apt-parking-age') && !민글.includes('100yearmap.com/property-tax'));
  본다('⑨ 준공연도별 비율 값이 전부 자료에서 온다',
    나이띠별.every((r) => 민글.includes(String(r.전기차당충전기))));

  console.log(`\n${가장부족.띠} ${가장부족.전기차당충전기}대당 1대 · ${가장넉넉.띠} ${가장넉넉.전기차당충전기}대당 1대`);
  process.exit();
}

/* 🔴 여기부터가 «부르면 도는 몸»이다 */
const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'make-cardnews-100y-ev-charger.mjs';
if (내가직접불렸나) {
  const sharp = createRequire(path.join(ROOT, 'package.json'))('sharp');
  fs.mkdirSync(낼방, { recursive: true });
  const 장들 = 짜기();
  for (let i = 0; i < 장들.length; i++) {
    const svg = 그리기(장들[i], i + 1, 장들.length, 바닥, 갈곳);
    await sharp(Buffer.from(svg)).png().toFile(path.join(낼방, `전기차충전기나이별-${i + 1}.png`));
    console.log('✅', `전기차충전기나이별-${i + 1}.png`);
  }
  console.log('⛔ 주소 없는 카드는 안 만든다 — 모든 장에', 갈곳);
}
