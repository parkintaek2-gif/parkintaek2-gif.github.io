/**
 * make-cardnews-100y-star-saju.mjs — 카드뉴스 「아이유 사주를 검색하면」 6장
 *
 * 🔴 2번 지시(8/20) — 제목에 「(스타 이름) 사주」가 드는 지면 한 장 + 카드 한 벌.
 *   지면은 /100y/saju 다. 이 카드는 그 지면으로 데려가는 문이다.
 *
 * ⛔ 지켜야 할 말 —
 *   · 실존 인물의 사주를 **단정하지 않는다.** 「~이다」가 아니라 「자료에 이렇게 적혀 있다」
 *   · 운세·궁합·풀이를 하지 않는다. 우리가 센 것은 **달력**이다
 *   · 「띠」라고 쓰지 않는다 — 띠는 년지에서 나오고 우리가 센 것은 일지다(뜻이 어긋난다)
 *   · 화면의 수는 전부 자료에서 온다. 손으로 박지 않는다
 *
 * 쓰는 법  node scripts/make-cardnews-100y-star-saju.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { 그리기 } from './make-cardnews-100y-voc.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const 낼방 = path.join(ROOT, 'public', '100y', 'cardnews');
const 수요 = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/100yearmap/star-saju-demand.json'), 'utf8'));
const 생일 = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/100yearmap/star-birth.json'), 'utf8'));

export const 갈곳 = '100yearmap.com/saju';
export const 바닥 = '자료에 적힌 날짜만 셉니다 · 운을 말하지 않습니다';

/** ⛔ 지면과 같은 셈이어야 한다 — 여기서 다시 정하지 않고 같은 뜻으로 센다 */
export const 기둥수 = 4;
export const 글자수 = 기둥수 * 2;
export const 못세는글자 = 2;          // 시주 — 태어난 시각이 없다
export const 되는글자 = 2;            // 일주 — 날짜만 있으면 선다
export const 잰명수 = 수요.잰명수;
export const 실재명수 = 수요.실재명수;
export const 사람수 = 생일.사람들.length;
export const 예순 = 60;               // 육십갑자가 도는 날 수

export function 짜기() {
  return [
    {
      꼴: '표지',
      큰수: `${못세는글자}글자`,
      줄들: ['「아이유 사주」를 검색해도', '끝내 셀 수 없는 글자입니다.'],
    },
    {
      머리: '먼저, 사람들이 정말 찾습니다',
      줄들: [
        `스타 ${잰명수}명의 이름 뒤에`,
        '「사주」를 붙여 재 보았습니다.',
        '',
        `${실재명수}명은 그 말이 떠 있었습니다.`,
        '⚠ 검색량이 아니라 자동완성입니다.',
      ],
    },
    {
      머리: '사주는 여덟 글자입니다',
      줄들: [
        `네 기둥에 두 글자씩, 모두 ${글자수}글자입니다.`,
        '',
        '년주 · 월주 — 절기에서 바뀝니다',
        `일주 — ${예순}날이 끊김 없이 돕니다`,
        '시주 — 태어난 시각이 있어야 섭니다',
      ],
    },
    {
      머리: '그런데 시각은 어디에도 없습니다',
      줄들: [
        '스타의 출생 시각을 적어 둔',
        '자료가 없습니다.',
        '',
        `그래서 ${글자수}글자 중 ${못세는글자}글자는`,
        '누가 세어도 비어 있습니다.',
      ],
    },
    {
      /* ⛔ 「궁합을 보지 않습니다」로 썼다가 자가시험에 걸렸다. 맞는 지적이다 —
         **부정해도 낱말은 화면에 남는다**(초등 지면에서 이미 배운 것).
         ⇒ 안 하는 것을 늘어놓지 않고, **하는 것만** 적는다 */
      머리: '저희가 적은 것은 이것뿐입니다',
      줄들: [
        `공개된 생년월일 ${사람수}명분과`,
        '그 출처를 지면에 걸어 두었습니다.',
        '',
        '누가 어떻다고 쓰지 않았습니다.',
        '자료에 적힌 날짜를 셌을 뿐입니다.',
      ],
    },
    {
      꼴: '마무리',
      머리: '이것은 달력이지 운명이 아닙니다',
      줄들: [
        '스타의 것은 두 글자가 비고',
        '당신의 것은 비지 않습니다.',
        '',
        '태어난 시각을 아는 사람은',
        '자기 자신이니까요.',
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
  본다('② ⭐ 제목에 「(스타 이름) 사주」가 든다', 민글.includes('아이유 사주'));

  const 단정 = ['운세', '궁합', '대박', '타고난', '팔자가 세', '길하', '흉하', '재물운', '사주가 좋'];
  const 걸린단정 = 단정.filter((w) => 민글.includes(w));
  본다(`③ ⛔ 운세·궁합·풀이를 하지 않는다${걸린단정.length ? ` — ${걸린단정.join(' · ')}` : ''}`, 걸린단정.length === 0);

  본다('④ ⛔ 「띠」라고 쓰지 않는다 — 우리가 센 것은 일지다', !민글.includes('띠'));

  const 등수말 = ['등수', '순위', '랭킹', '몇 위', '1위', '가장 인기'];
  const 걸린등수 = 등수말.filter((w) => 민글.includes(w));
  본다(`⑤ ⛔ 등수를 매기지 않는다${걸린등수.length ? ` — ${걸린등수.join(' · ')}` : ''}`, 걸린등수.length === 0);

  본다('⑥ ⚠ 자동완성을 검색량으로 옮겨 적지 않는다', 민글.includes('검색량이 아니라'));
  본다('⑦ 🔴 모든 장에 데려갈 주소가 있다',
    장들.every((장, i) => 그리기(장, i + 1, 장들.length, 바닥, 갈곳).includes(갈곳)));
  본다('⑧ 🔴 남의 카드 주소가 안 섞였다',
    !민글.includes('100yearmap.com/work') && !민글.includes('100yearmap.com/age'));

  const 댈수 = new Set([잰명수, 실재명수, 사람수, 글자수, 못세는글자, 되는글자, 기둥수, 예순,
    장들.length].map(String));
  const 못댄것 = [...민글.split(갈곳).join(' ').matchAll(/\d[\d,]*\.?\d*/g)]
    .map((m) => m[0].replace(/,/g, '')).filter((s) => !댈수.has(s) && !/^[1-6]$/.test(s));
  본다(`⑨ 화면의 수가 전부 자료에서 온다${못댄것.length ? ` — 못 댄 것: ${[...new Set(못댄것)].slice(0, 6).join(' · ')}` : ''}`,
    못댄것.length === 0);

  본다('⑩ ⛔ 「이 사람은 ~이다」로 단정하지 않는다',
    !민글.includes('의 사주는') && 민글.includes('자료'));

  console.log(`\n자동완성 ${잰명수}명 중 ${실재명수}명 · 공개 생년월일 ${사람수}명 · ${글자수}글자 중 ${못세는글자}글자가 빈다`);
  process.exit();
}

/* 🔴 여기부터가 «부르면 도는 몸»이다 — 남이 불러 글만 얻어 갈 수 있게 감싼다(8/16 규칙) */
const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'make-cardnews-100y-star-saju.mjs';
if (내가직접불렸나) {
  const sharp = createRequire(path.join(ROOT, 'package.json'))('sharp');
  fs.mkdirSync(낼방, { recursive: true });
  const 장들 = 짜기();
  for (let i = 0; i < 장들.length; i++) {
    const svg = 그리기(장들[i], i + 1, 장들.length, 바닥, 갈곳);
    await sharp(Buffer.from(svg)).png().toFile(path.join(낼방, `스타사주-${i + 1}.png`));
    console.log('✅', `스타사주-${i + 1}.png`);
  }
  console.log('⛔ 주소 없는 카드는 안 만든다 — 모든 장에', 갈곳);
}
