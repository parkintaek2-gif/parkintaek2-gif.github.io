/**
 * make-cardnews-100y-marriage.mjs — 카드뉴스 「서른에 사람들은 결혼했을까」 6장
 *
 * 🔴 사장님 상시 지시 — **매일 카드·카드뉴스·숏영상도 낸다. 외부유입용이다.**
 * ⛔ 주소 없는 카드는 안 만든다 — 여섯 장 전부에 100yearmap.com/marriage-age 를 박는다.
 *
 * ⛔⛔ 이 카드가 가장 조심할 것 — **두 수를 같은 말로 만들면 거짓이 된다.**
 *   「평균 초혼 33.9세」와 「30~34세 미혼 67.4%」는 **재는 것이 다르다.**
 *   평균 초혼은 «그 해 결혼한 사람»끼리 낸 값이라 안 한 사람이 아예 안 들어간다.
 *   ⇒ 표지에 67.4% 를 놓고, **셋째 장을 통째로 그 까닭에 쓴다.**
 * ⛔ 다섯 살 묶음이라 「서른둘」로 못 쓴다. 칸 이름 그대로만 쓴다.
 * ⛔ 몇 살에 해야 한다고 쓰지 않는다. 줄도 세우지 않는다.
 *
 * 쓰는 법  node scripts/make-cardnews-100y-marriage.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { 그리기 } from './make-cardnews-100y-voc.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const 낼방 = path.join(ROOT, 'public', '100y', 'cardnews');
const 자료 = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/100yearmap/marriage-age.json'), 'utf8'));

export const 갈곳 = '100yearmap.com/marriage-age';
export const 바닥 = `${자료.출처.기관} · 다섯 살 묶음입니다`;

export const 서른 = 자료.서른칸;
export const 넘김 = 자료.미혼이절반아래로내려간첫칸;
export const 초혼 = 자료.초혼;
/** ⛔ 짐작으로 고르지 않는다 — 칸 이름으로 찾는다 */
export const 칸 = (이름) => 자료.나이별.find((r) => r.칸 === 이름);
export const 흐름첫 = 자료.흐름[0];
export const 흐름끝 = 자료.흐름[자료.흐름.length - 1];

export function 짜기() {
  return [
    {
      꼴: '표지',
      큰수: `${서른.전체.미혼몫}%`,
      줄들: ['30~34세 가운데', '아직 미혼인 사람입니다.'],
    },
    {
      머리: '나이칸마다 세어 보면',
      줄들: [
        `25~29세   ${칸('25~29세').전체.미혼몫}%`,
        `30~34세   ${서른.전체.미혼몫}%`,
        `35~39세   ${칸('35~39세').전체.미혼몫}%`,
        `40~44세   ${칸('40~44세').전체.미혼몫}%`,
        '',
        `절반 아래로 처음 내려가는 칸은 ${넘김.칸}입니다.`,
      ],
    },
    {
      머리: '⛔ 그런데 평균 초혼은 33.9세입니다',
      줄들: [
        `${초혼.끝.해}년 평균 초혼 연령은`,
        `남편 ${초혼.끝.남편}세 · 아내 ${초혼.끝.아내}세입니다.`,
        '',
        '「서른넷이면 다들 했겠구나」로',
        '읽히기 쉽습니다.',
      ],
    },
    {
      머리: '재는 것이 다릅니다',
      줄들: [
        '평균 초혼에는',
        '**결혼하지 않은 사람이',
        '아예 들어 있지 않습니다.**',
        '',
        '그 해 결혼한 사람들끼리',
        '낸 평균이기 때문입니다.',
      ].map((l) => l.replace(/\*\*/g, '')),
    },
    {
      머리: `${초혼.첫.해}년부터 ${초혼.끝.해}년까지`,
      줄들: [
        `남편  ${초혼.첫.남편}세  →  ${초혼.끝.남편}세`,
        `아내  ${초혼.첫.아내}세  →  ${초혼.끝.아내}세`,
        '',
        `그 사이 30~34세 미혼은`,
        `${흐름첫.해}년 ${흐름첫['30~34세미혼몫']}% → ${흐름끝.해}년 ${흐름끝['30~34세미혼몫']}%.`,
      ],
    },
    {
      꼴: '마무리',
      머리: '몇 살에 해야 한다고 쓰지 않습니다',
      줄들: [
        '이것은 통계이지',
        '당신이 아닙니다.',
        '',
        `출처 — ${자료.출처.기관}`,
        `${자료.최신}년 · 다섯 살 묶음`,
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
  본다('② 표지에 큰 수가 있다', 장들[0].꼴 === '표지' && 장들[0].큰수.includes(String(서른.전체.미혼몫)));
  본다('③ ⛔ 평균 초혼을 함께 실었다 — 하나만 내면 거짓이 된다', 민글.includes(String(초혼.끝.남편)));
  본다('④ ⛔ 재는 것이 다르다는 것을 한 장 통째로 썼다',
    장들[3].줄들.join(' ').includes('들어 있지 않습니다'));
  본다('⑤ ⛔ 「서른둘」로 안 썼다 — 다섯 살 묶음이라고 바닥에 박았다',
    !민글.includes('서른둘') && 바닥.includes('다섯 살 묶음'));
  const 걸린 = ['등수', '순위', '랭킹', '몇 위', '늦었', '서둘'].filter((w) => 민글.includes(w));
  본다(`⑥ ⛔ 줄도 안 세우고 재촉도 안 한다${걸린.length ? ` — ${걸린.join(' · ')}` : ''}`, 걸린.length === 0);
  본다('⑦ 🔴 모든 장에 데려갈 주소가 있다',
    장들.every((장, i) => 그리기(장, i + 1, 장들.length, 바닥, 갈곳).includes(갈곳)));
  본다('⑧ 🔴 남의 카드 주소가 안 섞였다',
    !민글.includes('100yearmap.com/pediatrics') && !민글.includes('100yearmap.com/after'));

  const 댈수 = new Set([서른.전체.미혼몫, 넘김.미혼몫, 초혼.끝.남편, 초혼.끝.아내,
    초혼.첫.남편, 초혼.첫.아내, Number(초혼.첫.해), Number(초혼.끝.해), Number(자료.최신),
    Number(흐름첫.해), Number(흐름끝.해), 흐름첫['30~34세미혼몫'], 흐름끝['30~34세미혼몫'],
    ...['25~29세', '30~34세', '35~39세', '40~44세'].flatMap((c) => [칸(c).전체.미혼몫, 칸(c).시작, 칸(c).시작 + 4]),
    장들.length].filter((v) => v != null).map(String));
  const 못댄것 = [...민글.split(갈곳).join(' ').matchAll(/\d[\d,]*\.?\d*/g)]
    .map((m) => m[0].replace(/,/g, '')).filter((s) => !댈수.has(s) && !/^[1-6]$/.test(s));
  본다(`⑨ 화면의 수가 전부 자료에서 온다${못댄것.length ? ` — 못 댄 것: ${[...new Set(못댄것)].slice(0, 6).join(' · ')}` : ''}`,
    못댄것.length === 0);

  console.log(`\n30~34세 미혼 ${서른.전체.미혼몫}% · 평균 초혼 ${초혼.끝.남편}/${초혼.끝.아내}세 · ${자료.최신}년`);
  process.exit();
}

/* 🔴 여기부터가 «부르면 도는 몸»이다 */
const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'make-cardnews-100y-marriage.mjs';
if (내가직접불렸나) {
  const sharp = createRequire(path.join(ROOT, 'package.json'))('sharp');
  fs.mkdirSync(낼방, { recursive: true });
  const 장들 = 짜기();
  for (let i = 0; i < 장들.length; i++) {
    const svg = 그리기(장들[i], i + 1, 장들.length, 바닥, 갈곳);
    await sharp(Buffer.from(svg)).png().toFile(path.join(낼방, `서른에결혼했을까-${i + 1}.png`));
    console.log('✅', `서른에결혼했을까-${i + 1}.png`);
  }
  console.log('⛔ 주소 없는 카드는 안 만든다 — 모든 장에', 갈곳);
}
