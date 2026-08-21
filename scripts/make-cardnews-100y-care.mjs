/**
 * make-cardnews-100y-care.mjs — 카드뉴스 「몇 살부터 돌봄이 필요해지나」 6장
 *
 * 🔴 사장님 상시 지시 — **매일 카드·카드뉴스·숏영상도 낸다. 외부유입용이다.**
 * ⛔ 주소 없는 카드는 안 만든다 — 여섯 장 전부에 100yearmap.com/care 를 박는다.
 *
 * ⛔⛔ 이 카드가 가장 조심할 것 — **「판정」과 「인정」을 섞으면 수가 부풀어 오른다.**
 *   표의 「계」에는 등급외(신청했지만 인정 안 된 사람)가 들어 있다.
 *   ⇒ 둘째 장을 통째로 그 뺄셈에 쓴다. 표지의 수도 **인정** 기준이다.
 * ⛔ 몫의 밑수가 다른 표에서 온다 — 그것도 카드에 적는다. 안 적으면 카드만 떠돌 때 거짓이 된다.
 * ⛔ 「몇 살이면 이렇게 된다」로 쓰지 않는다. 마지막 장에서 **안 받은 쪽**도 센다.
 *
 * 쓰는 법  node scripts/make-cardnews-100y-care.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { 그리기 } from './make-cardnews-100y-voc.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const 낼방 = path.join(ROOT, 'public', '100y', 'cardnews');
const 자료 = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/100yearmap/care.json'), 'utf8'));

export const 갈곳 = '100yearmap.com/care';
export const 바닥 = '국민건강보험공단 · 등급외를 뺀 수입니다';

export const 전체 = 자료.전체;
export const 넘는칸 = 자료.열에하나넘는첫칸;
/** ⛔ 짐작으로 고르지 않는다 — 칸 이름으로 찾는다 */
export const 칸 = (이름) => 자료.나이별.find((r) => r.칸 === 이름);
export const 몫있는칸 = 자료.나이별.filter((r) => r.몫 != null);
export const 흐름첫 = 자료.흐름[0];
export const 흐름끝 = 자료.흐름[자료.흐름.length - 1];
/** 안 받은 쪽 — ⛔ 「몇 살이면 이렇게 된다」로 안 쓰기 위해 반드시 센다 */
export const 안받은몫 = (칸이름) => Math.round((100 - 칸(칸이름).몫) * 10) / 10;

export function 짜기() {
  return [
    {
      꼴: '표지',
      큰수: `${칸('85세이상').몫}%`,
      줄들: ['85세 이상 가운데', '장기요양 인정을 받은 사람입니다.'],
    },
    {
      머리: '⛔ 먼저 짚습니다',
      줄들: [
        '이 표의 「계」에는',
        '등급외가 들어 있습니다 —',
        '신청했지만 인정 안 된 사람입니다.',
        '',
        `판정 ${전체.판정.toLocaleString()}명`,
        `− 등급외 ${전체.등급외.toLocaleString()}명`,
        `= 인정 ${전체.인정.toLocaleString()}명`,
      ],
    },
    {
      머리: '나이칸마다 세어 보면',
      줄들: 몫있는칸.map((r) => `${r.칸.padEnd(7)}  ${r.몫}%`),
    },
    {
      머리: `열에 하나를 넘는 것은 ${넘는칸.칸}부터입니다`,
      줄들: [
        `${칸('65~69세').칸}   ${칸('65~69세').몫}%`,
        `${넘는칸.칸}   ${넘는칸.몫}%`,
        `${칸('85세이상').칸}   ${칸('85세이상').몫}%`,
        '',
        '같은 「노인」이라도',
        '나이칸마다 아주 다릅니다.',
      ],
    },
    {
      머리: `${흐름첫.해}년부터 ${흐름끝.해}년까지`,
      줄들: [
        `${흐름첫.인정.toLocaleString()}명 → ${흐름끝.인정.toLocaleString()}명`,
        '',
        /* ⛔ 「표에 몇 해가 있나」가 아니라 «내가 몇 해를 냈나»를 쓴다.
           안 그러면 「12해 동안 2014→2024」처럼 카드가 자기와 모순된다 */
        `${자료.흐름해수}해 동안 ${Math.round((흐름끝.인정 / 흐름첫.인정) * 10) / 10}배가 되었습니다.`,
        '',
        '⚠ 몫의 밑수는 다른 표에서 왔습니다 —',
        '「대강 이만큼」으로 봐 주십시오.',
      ],
    },
    {
      꼴: '마무리',
      머리: '몇 살이면 이렇게 된다고 쓰지 않습니다',
      줄들: [
        `${칸('85세이상').칸}에서도`,
        `${안받은몫('85세이상')}%는 인정을 받지 않았습니다.`,
        '',
        '출처 — 국민건강보험공단',
        `${자료.최신}년 · 등급외를 뺀 수`,
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
  본다('② 표지에 큰 수가 있다', 장들[0].꼴 === '표지' && 장들[0].큰수.includes(String(칸('85세이상').몫)));
  본다('③ ⛔ 「판정 − 등급외 = 인정」 뺄셈을 한 장 통째로 썼다',
    장들[1].줄들.join(' ').includes('등급외') && 민글.includes(전체.인정.toLocaleString()));
  본다('④ ⛔ 밑수가 다른 표에서 온다는 것을 적었다', 민글.includes('다른 표에서 왔습니다'));
  본다('⑤ ⛔ 안 받은 쪽도 셌다 — 「몇 살이면 이렇게 된다」로 안 쓴다',
    민글.includes(`${안받은몫('85세이상')}%는 인정을 받지 않았습니다`));
  본다('⑥ ⛔ 바닥에 「등급외를 뺀 수」를 박았다', 바닥.includes('등급외를 뺀 수'));
  /* 🔴 8/21 에 실제로 미끄러진 자리 — 카드가 「12해 동안 2014→2024」라 적었다.
     11해였는데 표의 해수(12)를 쓴 탓이다. 다시는 안 나게 여기서 잡는다 */
  본다('⑥-2 ⛔ 「N해 동안」이 첫해~끝해와 어긋나지 않는다',
    자료.흐름해수 === Number(흐름끝.해) - Number(흐름첫.해) + 1
    && 민글.includes(`${자료.흐름해수}해 동안`));
  const 걸린 = ['등수', '순위', '랭킹', '몇 위', '꼴찌', '최악'].filter((w) => 민글.includes(w));
  본다(`⑦ ⛔ 줄을 세우지 않는다${걸린.length ? ` — ${걸린.join(' · ')}` : ''}`, 걸린.length === 0);
  본다('⑧ 🔴 모든 장에 데려갈 주소가 있다',
    장들.every((장, i) => 그리기(장, i + 1, 장들.length, 바닥, 갈곳).includes(갈곳)));
  본다('⑨ 🔴 남의 카드 주소가 안 섞였다',
    !민글.includes('100yearmap.com/marriage-age') && !민글.includes('100yearmap.com/pediatrics'));

  const 댈수 = new Set([전체.판정, 전체.등급외, 전체.인정, 흐름첫.인정, 흐름끝.인정,
    Number(흐름첫.해), Number(흐름끝.해), Number(자료.최신), 자료.해수, 자료.흐름해수,
    Math.round((흐름끝.인정 / 흐름첫.인정) * 10) / 10, 안받은몫('85세이상'),
    ...몫있는칸.flatMap((r) => [r.몫, ...(r.칸.match(/\d+/g) || []).map(Number)]),
    장들.length].filter((v) => v != null).map(String));
  const 못댄것 = [...민글.split(갈곳).join(' ').matchAll(/\d[\d,]*\.?\d*/g)]
    .map((m) => m[0].replace(/,/g, '')).filter((s) => !댈수.has(s) && !/^[1-6]$/.test(s));
  본다(`⑩ 화면의 수가 전부 자료에서 온다${못댄것.length ? ` — 못 댄 것: ${[...new Set(못댄것)].slice(0, 6).join(' · ')}` : ''}`,
    못댄것.length === 0);

  console.log(`\n인정 ${전체.인정.toLocaleString()}명 · 85세이상 ${칸('85세이상').몫}% · ${자료.최신}년`);
  process.exit();
}

/* 🔴 여기부터가 «부르면 도는 몸»이다 */
const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'make-cardnews-100y-care.mjs';
if (내가직접불렸나) {
  const sharp = createRequire(path.join(ROOT, 'package.json'))('sharp');
  fs.mkdirSync(낼방, { recursive: true });
  const 장들 = 짜기();
  for (let i = 0; i < 장들.length; i++) {
    const svg = 그리기(장들[i], i + 1, 장들.length, 바닥, 갈곳);
    await sharp(Buffer.from(svg)).png().toFile(path.join(낼방, `몇살부터돌봄-${i + 1}.png`));
    console.log('✅', `몇살부터돌봄-${i + 1}.png`);
  }
  console.log('⛔ 주소 없는 카드는 안 만든다 — 모든 장에', 갈곳);
}
