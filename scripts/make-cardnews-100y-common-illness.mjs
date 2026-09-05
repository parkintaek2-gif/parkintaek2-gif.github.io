/**
 * make-cardnews-100y-common-illness.mjs — 카드뉴스 「나이 들면 무슨 병으로 병원에 갈까요」 6장
 *
 * 🔴 사장님 상시 지시 — **매일 카드·카드뉴스·숏영상도 낸다. 외부유입용이다.**
 * ⛔ 주소 없는 카드는 안 만든다 — 여섯 장 전부에 100yearmap.com/common-illness 를 박는다.
 *
 * ⛔ 「가장 흔하다」를 「가장 위험하다」로 안 읽히게 한다 — 잇몸병·감기는 흔해서 위에 온다.
 * ⛔ 순위·등수 낱말을 쓰지 않는다(check-100y-banned-words.mjs 「순위」 회피 — 1위/2위/3위는
 *   병 이름의 차례로만 쓴다).
 *
 * 쓰는 법  node scripts/make-cardnews-100y-common-illness.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { 그리기 } from './make-cardnews-100y-voc.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const 낼방 = path.join(ROOT, 'public', '100y', 'cardnews');
const 자료 = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/100yearmap/medical-cost-top-diseases.json'), 'utf8'));

export const 갈곳 = '100yearmap.com/common-illness';
export const 바닥 = 'HIRA 빅데이터개방포털 · 2025년 외래(양방) 기준';

export const 나이대별 = 자료.나이대별;
export const 칸 = (이름) => 나이대별.find((r) => r.칸 === 이름);
export const 스물 = 칸('20~29세');
export const 여든 = 칸('80세이상');
export const 열아홉이하 = 칸('10~19세');

export function 짜기() {
  return [
    {
      꼴: '표지',
      큰수: 스물.상위[0].이름,
      줄들: ['20대부터 70대까지', '가장 흔한 외래 이유입니다.'],
    },
    {
      머리: '⛔ 그런데 80세부터는 바뀝니다',
      줄들: [
        `${여든.상위[0].이름}`,
        '이 처음으로 앞섭니다.',
      ],
    },
    {
      머리: '나이 칸마다 가장 흔했던 병',
      줄들: 나이대별.map((r) => `${r.칸}  ${r.상위[0].이름}`),
    },
    {
      머리: '0~19세는 다릅니다',
      줄들: [
        `${열아홉이하.상위[0].이름}`,
        '(감기 계열)이 가장 흔합니다.',
        '',
        '20대부터 잇몸병으로 바뀝니다.',
      ],
    },
    {
      머리: '⚠ 흔하다 ≠ 위험하다',
      줄들: [
        '잇몸병과 감기는 흔해서',
        '이 표 위쪽에 옵니다.',
        '',
        '드물지만 위험한 병은',
        '여기 안 보입니다.',
      ],
    },
    {
      꼴: '마무리',
      머리: '병원에 가야 한다고 쓰지 않습니다',
      줄들: [
        '나이대마다 외래 진료 이유가',
        '어떻게 갈리는지가 전부입니다.',
        '',
        '출처 — 건강보험심사평가원(HIRA)',
        `다빈도질병 통계 ${자료.최신}년`,
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
  본다('② 표지에 20대 1위 병 이름이 있다', 장들[0].큰수 === 스물.상위[0].이름);
  본다('③ ⛔ 80세부터 바뀐다는 것을 둘째 장에 박았다', 민글.includes(여든.상위[0].이름));
  본다('④ 나이 칸 아홉이 다 카드에 있다', 나이대별.every((r) => 민글.includes(r.칸)));
  본다('⑤ ⛔ 「흔하다≠위험하다」 캐치프레이즈가 있다', 민글.includes('흔하다') && 민글.includes('위험하다'));
  const 걸린 = ['등수', '순위', '랭킹', '몇 위', '꼴찌'].filter((w) => 민글.includes(w));
  본다(`⑥ ⛔ 재촉도 줄 세우기도 없다${걸린.length ? ` — ${걸린.join(' · ')}` : ''}`, 걸린.length === 0);
  본다('⑦ 🔴 모든 장에 데려갈 주소가 있다',
    장들.every((장, i) => 그리기(장, i + 1, 장들.length, 바닥, 갈곳).includes(갈곳)));
  본다('⑧ 🔴 남의 카드 주소가 안 섞였다',
    !민글.includes('100yearmap.com/breakfast') && !민글.includes('100yearmap.com/medical-cost'));
  본다('⑨ 카드에 실은 병 이름(각 나이칸 1위)이 전부 자료에서 온다',
    나이대별.every((r) => 민글.includes(r.상위[0].이름)));

  console.log(`\n20대 1위 ${스물.상위[0].이름} · 80세이상 1위 ${여든.상위[0].이름} · ${자료.최신}년`);
  process.exit();
}

/* 🔴 여기부터가 «부르면 도는 몸»이다 */
const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'make-cardnews-100y-common-illness.mjs';
if (내가직접불렸나) {
  const sharp = createRequire(path.join(ROOT, 'package.json'))('sharp');
  fs.mkdirSync(낼방, { recursive: true });
  const 장들 = 짜기();
  for (let i = 0; i < 장들.length; i++) {
    const svg = 그리기(장들[i], i + 1, 장들.length, 바닥, 갈곳);
    await sharp(Buffer.from(svg)).png().toFile(path.join(낼방, `나이대별가장흔한병-${i + 1}.png`));
    console.log('✅', `나이대별가장흔한병-${i + 1}.png`);
  }
  console.log('⛔ 주소 없는 카드는 안 만든다 — 모든 장에', 갈곳);
}
