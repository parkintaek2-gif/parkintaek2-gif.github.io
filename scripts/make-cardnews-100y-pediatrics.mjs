/**
 * make-cardnews-100y-pediatrics.mjs — 카드뉴스 「밤에 아이가 열이 나면」 6장
 *
 * 🔴 사장님 상시 지시 — **매일 카드·카드뉴스·숏영상도 낸다. 외부유입용이다.**
 *   8/21 밤에 지면을 여덟 장 냈는데 **카드가 0장이었다.** 그것부터 채운다.
 * ⛔ 주소 없는 카드는 안 만든다 — 여섯 장 전부에 100yearmap.com/pediatrics 를 박는다.
 *
 * ⛔ 이 카드가 가장 조심할 말 — 지면과 **같은 자리**를 지킨다.
 *   이 표는 **「의원」만** 센다. 「소아과가 아예 없다」로 쓰면 거짓이다.
 *   ⇒ 카드 첫 장부터 「의원」을 붙이고, 병원급까지 센 수(16곳)를 함께 낸다.
 * ⛔ 등수를 매기지 않는다. 시·도는 «어디에 몰렸나»로만 늘어놓는다.
 *
 * 쓰는 법  node scripts/make-cardnews-100y-pediatrics.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { 그리기 } from './make-cardnews-100y-voc.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const 낼방 = path.join(ROOT, 'public', '100y', 'cardnews');
const 자료 = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/100yearmap/pediatrics.json'), 'utf8'));

export const 갈곳 = '100yearmap.com/pediatrics';
export const 바닥 = `${자료.출처.기관} · 「의원」만 센 값입니다`;

/** 「202602」 → 「2026년 2분기」 */
export const 때말 = (s) => (/^\d{6}$/.test(String(s)) ? `${String(s).slice(0, 4)}년 ${Number(String(s).slice(4))}분기` : String(s));
export const 몰린곳 = Object.entries(자료.없는시도).sort((a, b) => b[1] - a[1]).slice(0, 5);
export const 흐름첫 = 자료.흐름[0];
export const 흐름끝 = 자료.흐름[자료.흐름.length - 1];
export const 가장적은 = 자료.흐름.reduce((a, b) => (b.없는곳 < a.없는곳 ? b : a));

export function 짜기() {
  return [
    {
      꼴: '표지',
      큰수: `${자료.없는곳수}곳`,
      줄들: ['소아청소년과 «의원»이', '한 곳도 없는 시·군·구입니다.'],
    },
    {
      머리: '⛔ 먼저 짚습니다',
      줄들: [
        '「소아과가 아예 없다」는 뜻이',
        '아닙니다. 이 표가 세는 것은',
        '«의원»뿐입니다 —',
        '병원 안 소아청소년과는',
        '이 표에 들어 있지 않습니다.',
      ],
    },
    {
      머리: '그럼 병원은 있나',
      줄들: [
        `그 ${자료.없는곳수}곳 가운데`,
        `${자료.병원급.아예없는곳}곳은 병원급도 없습니다.`,
        '',
        '거기는 병원 안 소아과도',
        '있을 수 없습니다.',
      ],
    },
    {
      머리: '어디에 몰려 있나',
      줄들: 몰린곳.map(([시도, 수]) => `${시도}  ${수}곳`),
    },
    {
      머리: `${흐름첫.해}년부터 거의 그대로입니다`,
      줄들: [
        `${가장적은.해}년 ${가장적은.없는곳}곳 → ${흐름끝.해}년 ${흐름끝.없는곳}곳`,
        '',
        '그 사이 전국 의원 수는',
        '오르내렸습니다.',
        '동네는 안 움직였습니다.',
      ],
    },
    {
      꼴: '마무리',
      머리: '지형을 그릴 뿐입니다',
      줄들: [
        '어디가 낫고 못하다고',
        '쓰지 않습니다.',
        '',
        `출처 — ${자료.출처.기관}`,
        `${때말(자료.때)} 기준`,
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
  본다('② ⛔ 첫 장부터 «의원»을 붙인다', 장들[0].줄들.join(' ').includes('의원'));
  본다('③ ⛔ 「소아과가 아예 없다」는 뜻이 아니라고 둘째 장에 박는다',
    장들[1].줄들.join(' ').includes('아예 없다'));
  본다('④ 병원급까지 센 수가 있다', 민글.includes(`${자료.병원급.아예없는곳}곳은 병원급도 없습니다`));
  const 등수말 = ['등수', '순위', '랭킹', '몇 위', '최악', '꼴찌'];
  const 걸린 = 등수말.filter((w) => 민글.includes(w));
  본다(`⑤ ⛔ 줄을 세우지 않는다${걸린.length ? ` — ${걸린.join(' · ')}` : ''}`, 걸린.length === 0);
  본다('⑥ 🔴 모든 장에 데려갈 주소가 있다',
    장들.every((장, i) => 그리기(장, i + 1, 장들.length, 바닥, 갈곳).includes(갈곳)));
  본다('⑦ 🔴 남의 카드 주소가 안 섞였다',
    !민글.includes('100yearmap.com/work') && !민글.includes('100yearmap.com/age'));

  const 시도수 = 몰린곳.map(([, v]) => v);
  const 댈수 = new Set([자료.없는곳수, 자료.병원급.아예없는곳, 자료.시군구수, 자료.전체곳,
    ...시도수, Number(흐름첫.해), Number(흐름끝.해), Number(가장적은.해),
    가장적은.없는곳, 흐름끝.없는곳, 장들.length].filter((v) => v != null).map(String));
  const 못댄것 = [...민글.split(갈곳).join(' ').matchAll(/\d[\d,]*\.?\d*/g)]
    .map((m) => m[0].replace(/,/g, '')).filter((s) => !댈수.has(s) && !/^[1-6]$/.test(s));
  본다(`⑧ 화면의 수가 전부 자료에서 온다${못댄것.length ? ` — 못 댄 것: ${[...new Set(못댄것)].slice(0, 6).join(' · ')}` : ''}`,
    못댄것.length === 0);

  console.log(`\n${자료.없는곳수}곳 · 그중 병원급도 없는 곳 ${자료.병원급.아예없는곳}곳 · ${때말(자료.때)}`);
  process.exit();
}

/* 🔴 여기부터가 «부르면 도는 몸»이다 — 남이 불러 글만 얻어 갈 수 있게 감싼다(8/16 규칙) */
const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'make-cardnews-100y-pediatrics.mjs';
if (내가직접불렸나) {
  const sharp = createRequire(path.join(ROOT, 'package.json'))('sharp');
  fs.mkdirSync(낼방, { recursive: true });
  const 장들 = 짜기();
  for (let i = 0; i < 장들.length; i++) {
    const svg = 그리기(장들[i], i + 1, 장들.length, 바닥, 갈곳);
    await sharp(Buffer.from(svg)).png().toFile(path.join(낼방, `소아과없는곳-${i + 1}.png`));
    console.log('✅', `소아과없는곳-${i + 1}.png`);
  }
  console.log('⛔ 주소 없는 카드는 안 만든다 — 모든 장에', 갈곳);
}
