/**
 * make-cardnews-100y-major-name-gap.mjs — 카드뉴스 「학과 이름만으로 취업률을 짐작할 수 있나」 6장
 *
 * 🔴 사장님 상시 지시 — **매일 카드·카드뉴스·숏영상도 낸다. 외부유입용이다.**
 * ⛔ 주소 없는 카드는 안 만든다 — 여섯 장 전부에 100yearmap.com/major-name-gap 를 박는다.
 * ⛔ 순위·등수 낱말을 쓰지 않는다.
 *
 * 쓰는 법  node scripts/make-cardnews-100y-major-name-gap.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { 그리기 } from './make-cardnews-100y-voc.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const 낼방 = path.join(ROOT, 'public', '100y', 'cardnews');
const 자료 = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/100yearmap/major-name-gap.json'), 'utf8'));

export const 갈곳 = '100yearmap.com/major-name-gap';
export const 바닥 = 'KEDI 학과별 졸업 후 상황 · 기존 수집분 재계산';

export const 낮은것 = 자료.낮은것;
export const 높은것 = 자료.높은것;

export function 짜기() {
  return [
    {
      꼴: '표지',
      큰수: `${자료.철학취업률}%`,
      줄들: ['철학과 취업률입니다.', `컴퓨터·소프트웨어 학과 ${자료.컴공학과수}개 중`, `${자료.철학보다낮은수}개보다 높습니다.`],
    },
    {
      머리: '「철학과가 이겼다」는 절반만 맞습니다',
      줄들: [
        `${자료.컴공학과수}개 중 ${자료.철학보다낮은수}개(${자료.철학보다낮은몫}%)만 낮고`,
        `나머지 ${높은것.length}개는 여전히 더 높습니다.`,
      ],
    },
    {
      머리: '철학과보다 낮은 곳',
      줄들: 낮은것.slice(0, 5).map((r) => `${r.학과}  ${r.취업률}%`),
    },
    {
      머리: '철학과보다 높은 곳',
      줄들: 높은것.slice(0, 5).map((r) => `${r.학과}  ${r.취업률}%`),
    },
    {
      머리: '⚠ 같은 이름, 다른 학과입니다',
      줄들: ['「컴퓨터공학과」라는 이름 하나로', '전국 학과를 묶었을 뿐입니다.', '', '학교마다 실제 교육은 다릅니다.'],
    },
    {
      꼴: '마무리',
      머리: '이름만으로 짐작하지 않습니다',
      줄들: ['학과 이름이 아니라', '학과 자체를 봐야 합니다.', '', '출처 — 한국교육개발원(KEDI)', '학과별 졸업 후 상황'],
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
  본다('② 표지에 철학과 취업률이 있다', 장들[0].큰수.includes(String(자료.철학취업률)));
  본다('③ 낮은 곳 다섯이 다 카드에 있다', 낮은것.slice(0, 5).every((r) => 민글.includes(r.학과)));
  본다('④ 높은 곳 다섯이 다 카드에 있다', 높은것.slice(0, 5).every((r) => 민글.includes(r.학과)));
  본다('⑤ 철학과보다 낮은 몫(%)이 카드에 있다', 민글.includes(String(자료.철학보다낮은몫)));
  const 걸린 = ['등수', '순위', '랭킹', '몇 위', '꼴찌'].filter((w) => 민글.includes(w));
  본다(`⑥ ⛔ 줄 세우기 낱말이 없다${걸린.length ? ` — ${걸린.join(' · ')}` : ''}`, 걸린.length === 0);
  본다('⑦ 🔴 모든 장에 데려갈 주소가 있다',
    장들.every((장, i) => 그리기(장, i + 1, 장들.length, 바닥, 갈곳).includes(갈곳)));
  본다('⑧ 🔴 남의 카드 주소가 안 섞였다',
    !민글.includes('100yearmap.com/work-gap') && !민글.includes('100yearmap.com/business-age'));
  본다('⑨ 취업률 값이 전부 자료에서 온다',
    [...낮은것.slice(0, 5), ...높은것.slice(0, 5)].every((r) => 민글.includes(String(r.취업률))));

  console.log(`\n철학과 ${자료.철학취업률}% · 낮은 것 ${자료.철학보다낮은수}개 · 높은 것 ${높은것.length}개`);
  process.exit();
}

/* 🔴 여기부터가 «부르면 도는 몸»이다 */
const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'make-cardnews-100y-major-name-gap.mjs';
if (내가직접불렸나) {
  const sharp = createRequire(path.join(ROOT, 'package.json'))('sharp');
  fs.mkdirSync(낼방, { recursive: true });
  const 장들 = 짜기();
  for (let i = 0; i < 장들.length; i++) {
    const svg = 그리기(장들[i], i + 1, 장들.length, 바닥, 갈곳);
    await sharp(Buffer.from(svg)).png().toFile(path.join(낼방, `학과이름격차-${i + 1}.png`));
    console.log('✅', `학과이름격차-${i + 1}.png`);
  }
  console.log('⛔ 주소 없는 카드는 안 만든다 — 모든 장에', 갈곳);
}
