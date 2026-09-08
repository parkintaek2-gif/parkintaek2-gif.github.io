/**
 * make-cardnews-100y-trendy-major-outcomes.mjs — 카드뉴스 「신산업 낱말 학과 24개, 취업률은 갈립니다」 6장
 *
 * 🔴 사장님 상시 지시 — **매일 카드·카드뉴스·숏영상도 낸다. 외부유입용이다.**
 * ⛔ 주소 없는 카드는 안 만든다 — 여섯 장 전부에 100yearmap.com/trendy-major-outcomes 를 박는다.
 * ⛔ 순위·등수 낱말을 쓰지 않는다.
 *
 * 쓰는 법  node scripts/make-cardnews-100y-trendy-major-outcomes.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { 그리기 } from './make-cardnews-100y-voc.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const 낼방 = path.join(ROOT, 'public', '100y', 'cardnews');
const 자료 = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/100yearmap/trendy-major-outcomes.json'), 'utf8'));

export const 갈곳 = '100yearmap.com/trendy-major-outcomes';
export const 바닥 = 'KEDI 학과별 졸업 후 상황 · 기존 수집분 재계산';

export const 낮은다섯 = 자료.전체목록.slice(0, 5);
export const 높은다섯 = 자료.전체목록.slice(-5).reverse();
export const 격차 = Math.round((자료.최고.취업률 - 자료.최저.취업률) * 10) / 10;

export function 짜기() {
  return [
    {
      꼴: '표지',
      큰수: `${격차}%p`,
      줄들: ['신산업 낱말 든 학과 24개', `취업률 최저·최고 차이입니다.`, `${자료.최저.취업률}%~${자료.최고.취업률}%로 갈립니다.`],
    },
    {
      머리: '「신산업이면 잘 된다」는 절반만 맞습니다',
      줄들: [
        `평균은 ${자료.신산업평균취업률}%로 전체 평균(${자료.전체평균취업률}%)보다 높지만`,
        `학과마다 ${자료.최저.취업률}%부터 ${자료.최고.취업률}%까지 갈립니다.`,
      ],
    },
    {
      머리: '취업률이 낮은 쪽 다섯',
      줄들: 낮은다섯.map((r) => `${r.학과}  ${r.취업률}%`),
    },
    {
      머리: '취업률이 높은 쪽 다섯',
      줄들: 높은다섯.map((r) => `${r.학과}  ${r.취업률}%`),
    },
    {
      머리: '⚠ 같은 낱말, 다른 학과입니다',
      줄들: ['「디지털」·「인공지능」이라는 낱말 하나로', '전국 학과를 묶었을 뿐입니다.', '', '학교마다 교육과정은 다릅니다.'],
    },
    {
      꼴: '마무리',
      머리: '낱말만으로 짐작하지 않습니다',
      줄들: ['학과 이름의 유행어가 아니라', '학과 자체를 봐야 합니다.', '', '출처 — 한국교육개발원(KEDI)', '학과별 졸업 후 상황'],
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
  본다('② 표지에 격차·최저·최고 취업률이 있다',
    민글.includes(String(격차)) && 민글.includes(String(자료.최저.취업률)) && 민글.includes(String(자료.최고.취업률)));
  본다('③ 낮은 쪽 다섯이 다 카드에 있다', 낮은다섯.every((r) => 민글.includes(r.학과)));
  본다('④ 높은 쪽 다섯이 다 카드에 있다', 높은다섯.every((r) => 민글.includes(r.학과)));
  본다('⑤ 신산업 평균·전체 평균이 카드에 있다',
    민글.includes(String(자료.신산업평균취업률)) && 민글.includes(String(자료.전체평균취업률)));
  const 걸린 = ['등수', '순위', '랭킹', '몇 위', '꼴찌'].filter((w) => 민글.includes(w));
  본다(`⑥ ⛔ 줄 세우기 낱말이 없다${걸린.length ? ` — ${걸린.join(' · ')}` : ''}`, 걸린.length === 0);
  본다('⑦ 🔴 모든 장에 데려갈 주소가 있다',
    장들.every((장, i) => 그리기(장, i + 1, 장들.length, 바닥, 갈곳).includes(갈곳)));
  본다('⑧ 🔴 남의 카드 주소가 안 섞였다',
    !민글.includes('100yearmap.com/major-name-gap') && !민글.includes('100yearmap.com/university-founding-gap'));
  본다('⑨ 취업률 값이 전부 자료에서 온다',
    [...낮은다섯, ...높은다섯].every((r) => 민글.includes(String(r.취업률))));

  console.log(`\n최저 ${자료.최저.취업률}% · 최고 ${자료.최고.취업률}% · 신산업학과수 ${자료.신산업학과수}개`);
  process.exit();
}

/* 🔴 여기부터가 «부르면 도는 몸»이다 */
const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'make-cardnews-100y-trendy-major-outcomes.mjs';
if (내가직접불렸나) {
  const sharp = createRequire(path.join(ROOT, 'package.json'))('sharp');
  fs.mkdirSync(낼방, { recursive: true });
  const 장들 = 짜기();
  for (let i = 0; i < 장들.length; i++) {
    const svg = 그리기(장들[i], i + 1, 장들.length, 바닥, 갈곳);
    await sharp(Buffer.from(svg)).png().toFile(path.join(낼방, `신산업학과취업률-${i + 1}.png`));
    console.log('✅', `신산업학과취업률-${i + 1}.png`);
  }
  console.log('⛔ 주소 없는 카드는 안 만든다 — 모든 장에', 갈곳);
}
