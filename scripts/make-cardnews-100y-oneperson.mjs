/**
 * make-cardnews-100y-oneperson.mjs — 카드뉴스 「나이대별 1인가구 비중」 5장
 *
 * 🔴 사회 분야 첫 카드뉴스(사장님 「0~100세×다섯 분야」 지시, 1단계 로드맵 2번째).
 * ⛔ "청년·노년 두 봉우리"라는 첫 짐작이 열 살 단위로 묶자 깨졌다 — 40대가 가장 적고
 *   그 앞뒤(30대·70세 이상)가 높다. 카드도 이 정직한 결과를 그대로 싣는다.
 *
 * 쓰는 법  node scripts/make-cardnews-100y-oneperson.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { 그리기 } from './make-cardnews-100y-voc.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const 낼방 = path.join(ROOT, 'public', '100y', 'cardnews');
const 자료 = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/100yearmap/oneperson.json'), 'utf8'));

export const 갈곳 = '100yearmap.com/oneperson';
export const 바닥 = `${자료.출처.기관} · 성 및 연령별 1인가구`;

export const 나이별 = 자료.나이별.filter((r) => r.칸 !== '20세 미만');
export const 최고칸 = 자료['⭐ 40대가 움푹 꺼진다'].최고칸;
export const 최저칸 = 자료['⭐ 40대가 움푹 꺼진다'].최저칸;
export const 뒤집히는나이 = 자료.남녀뒤집힘.find((r, i) => i > 0 && r.많은쪽 !== 자료.남녀뒤집힘[i - 1].많은쪽);

export function 짜기() {
  return [
    {
      꼴: '표지',
      큰수: `${최고칸.비중}%`,
      줄들: [`${최고칸.칸} 1인가구가`, '전체의 가장 큰 몫입니다.'],
    },
    {
      머리: '나이대로 봅니다',
      줄들: 나이별.map((r) => `${r.칸}   ${r.비중}%`),
    },
    {
      머리: '⛔ "두 봉우리"란 짐작은 틀렸습니다',
      줄들: [
        `${최저칸.칸}이 오히려 가장 적고(${최저칸.비중}%)`,
        `그 앞뒤(30대·${최고칸.칸})가`,
        '더 높습니다.',
      ],
    },
    {
      머리: '⭐ 성비도 나이대마다 뒤집힙니다',
      줄들: [
        '20대~50대는 남자가 많고',
        `${뒤집히는나이?.칸 ?? '60대'}부터는`,
        '여자가 더 많습니다.',
      ],
    },
    {
      꼴: '마무리',
      머리: '혼자 사는 게 좋다 나쁘다 쓰지 않습니다',
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
  본다('② 표지에 최고칸 비중이 있다', 장들[0].꼴 === '표지' && 장들[0].큰수.includes(String(최고칸.비중)));
  본다('③ ⛔ 최저칸(40대)을 실었다', 민글.includes(최저칸.칸) && 민글.includes(String(최저칸.비중)));
  본다('④ ⛔ 두 봉우리 짐작이 틀렸다는 것을 한 장 통째로 썼다', 장들[2].머리.includes('틀렸습니다'));
  const 걸린 = ['등수', '순위', '랭킹', '몇 위', '해야 합니다', '좋습니다', '나쁩니다'].filter((w) => 민글.includes(w));
  본다(`⑤ ⛔ 혼자 사는 게 좋다/나쁘다 안 쓴다${걸린.length ? ` — ${걸린.join(' · ')}` : ''}`, 걸린.length === 0);
  본다('⑥ 🔴 모든 장에 데려갈 주소가 있다',
    장들.every((장, i) => 그리기(장, i + 1, 장들.length, 바닥, 갈곳).includes(갈곳)));
  본다('⑦ 🔴 남의 카드 주소가 안 섞였다',
    !민글.includes('100yearmap.com/exercise') && !민글.includes('100yearmap.com/promotion'));

  const 댈수 = new Set([
    최고칸.비중, 최저칸.비중, Number(자료.최신), 장들.length,
    20, 30, 40, 50, 60, 70,
    ...나이별.map((r) => r.비중),
  ].filter((v) => v != null).map(String));
  const 못댄것 = [...민글.split(갈곳).join(' ').matchAll(/\d[\d,]*\.?\d*/g)]
    .map((m) => m[0].replace(/,/g, '')).filter((s) => !댈수.has(s) && !/^[1-5]$/.test(s) && s !== '10');
  본다(`⑧ 화면의 수가 전부 자료에서 온다${못댄것.length ? ` — 못 댄 것: ${[...new Set(못댄것)].slice(0, 6).join(' · ')}` : ''}`,
    못댄것.length === 0);

  console.log(`\n최고칸 ${최고칸.칸} ${최고칸.비중}% · 최저칸 ${최저칸.칸} ${최저칸.비중}%`);
  process.exit();
}

/* 🔴 여기부터가 «부르면 도는 몸»이다 */
const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'make-cardnews-100y-oneperson.mjs';
if (내가직접불렸나) {
  const sharp = createRequire(path.join(ROOT, 'package.json'))('sharp');
  fs.mkdirSync(낼방, { recursive: true });
  const 장들 = 짜기();
  for (let i = 0; i < 장들.length; i++) {
    const svg = 그리기(장들[i], i + 1, 장들.length, 바닥, 갈곳);
    await sharp(Buffer.from(svg)).png().toFile(path.join(낼방, `1인가구비중-${i + 1}.png`));
    console.log('✅', `1인가구비중-${i + 1}.png`);
  }
  console.log('⛔ 주소 없는 카드는 안 만든다 — 모든 장에', 갈곳);
}
