/**
 * make-cardnews-100y-elementary.mjs — 카드뉴스 「우리 학교는 몇 살일까요」 6장
 *
 * 🔴 왜 — 사장님 「왜 자꾸 대입에 머물러있니」.
 *   초등 자료 6,328곳이 만들어져 있는데 어느 지면도 안 쓰고 있었다(3번이 8/16 에 찾았다).
 *   8/16 새벽에 /elementary 한 장을 열었고, **데려올 카드가 없으면 지면은 안 나간 것과 같다.**
 *   ⭐ 우리 이름이 백년지도다. 백 년 넘은 초등학교가 888곳 — 대입에서 가장 먼 자리에서
 *     우리 이름이 가장 잘 맞는 수가 나온다.
 *
 * 자료 — src/data/100yearmap/elementary.json (NEIS 교육정보 개방 포털 · 공식 OpenAPI)
 *
 * ⛔ 자료가 스스로 못박은 「안 쓰는 말」을 그대로 지킨다 —
 *   명문 · 전통 · 순위 · 몇 위 · 좋은 학교 · 나쁜 학교
 *   ⚠ 부정문으로도 안 쓴다. 카드는 넘겨 보는 물건이라 스친 사람은 부정을 못 보고 낱말만 가져간다.
 * ⚠ 설립일은 NEIS 값이라 개교기념일과 다를 수 있다 — 「몇 년째」가 아니라 「몇 년에 문을 열었다」.
 *
 * 쓰는 법  node scripts/make-cardnews-100y-elementary.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { 그리기 } from './make-cardnews-100y-voc.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const 낼방 = path.join(ROOT, 'public', '100y', 'cardnews');
const 자료 = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/100yearmap/elementary.json'), 'utf8'));

/** ⛔ 이 카드가 데려갈 곳 */
export const 갈곳 = '100yearmap.com/elementary';
export const 바닥 = 'NEIS 교육정보 개방 포털 · 등수를 매기지 않습니다';

export const 올해 = 자료.올해;
export const 맨오래 = 자료.가장오래된[0];
export const 백년몫 = Number(((자료.백년넘은곳수 / 자료.낸곳) * 100).toFixed(1));
export const 먼저다섯 = 자료.가장오래된.slice(0, 5);

export function 짜기() {
  return [
    {
      꼴: '표지',
      큰수: `${맨오래.설립연}년`,
      줄들: ['우리나라에서 가장 먼저 문을 연', '초등학교가 문을 연 해입니다.'],
    },
    {
      머리: '먼저 문을 연 다섯 곳',
      줄들: 먼저다섯.map((r) => `${r.설립연}년  ${r.title}`),
    },
    {
      머리: '백 년이 넘은 학교가',
      줄들: [
        `${자료.백년넘은곳수.toLocaleString()}곳입니다.`,
        '',
        `전국 초등학교 ${자료.낸곳.toLocaleString()}곳 가운데`,
        `${백년몫}%입니다.`,
      ],
    },
    {
      머리: '⛔ 오래된 것이 앞선 것은 아닙니다',
      줄들: [
        '오래되었다고 더 낫다는 뜻이',
        '아닙니다. 새로 지었다고',
        '못하다는 뜻도 아닙니다.',
        '',
        '문 연 날과 자리만 적습니다.',
      ],
    },
    {
      머리: '⚠ 여기에 없는 것',
      줄들: [
        '학업성취 · 진학 · 학급규모는',
        '이 자료에 없습니다.',
        '초등학교는 그 공시가 없습니다.',
        '',
        '없는 것을 지어내지 않았습니다.',
      ],
    },
    {
      꼴: '마무리',
      머리: '아이 학교는 몇 살인가요',
      줄들: [
        `${맨오래.title}는`,
        `올해로 ${올해 - 맨오래.설립연}해째 그 자리에 있습니다.`,
        '',
        `전국 ${자료.낸곳.toLocaleString()}곳을 한 장에`,
      ],
    },
  ];
}

/* ── 자가시험 ─────────────────────────────────────────── */
if (process.argv.includes('--selftest')) {
  const 본다 = (말, 참) => { console.log(참 ? '✅' : '🔴', 말); if (!참) process.exitCode = 1; };
  const 장들 = 짜기();
  const 온글 = 장들.map((장, i) => 그리기(장, i + 1, 장들.length, 바닥, 갈곳)).join('\n');
  const 민글 = 온글.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

  본다('① 여섯 장이다', 장들.length === 6);
  // ⛔ 자료가 스스로 적어 둔 「안 쓰는 말」을 그대로 가져와 잰다 — 내가 목록을 새로 지어내지 않는다
  const 금지 = String(자료['⛔ 안 쓰는 말']).split('·').map((s) => s.trim()).filter(Boolean);
  const 걸린 = 금지.filter((w) => 민글.includes(w));
  본다(`② ⛔ 자료가 금한 말을 안 쓴다(${금지.length}개)${걸린.length ? ` — ${걸린.join(' · ')}` : ''}`, 걸린.length === 0);
  // ⚠ 「몇 년째」로 쓰지 말라는 것은 **학교마다**의 나이를 두고 한 말이다.
  //    맨 앞 한 곳의 «올해로 N해째»는 설립연에서 바로 뺀 값이라 쓰되, 낱낱 학교에는 안 붙인다
  본다('③ ⚠ 설립연을 「몇 년에 문을 열었다」로 적는다',
    먼저다섯.every((r) => 민글.includes(`${r.설립연}년`)));
  본다('④ 🔴 없는 것을 밝힌다(학업성취·진학·학급규모)',
    ['학업성취', '진학', '학급규모'].every((w) => 민글.includes(w)));
  본다('⑤ 🔴 모든 장에 데려올 주소가 있다',
    장들.every((장, i) => 그리기(장, i + 1, 장들.length, 바닥, 갈곳).includes(갈곳)));
  본다('⑥ 🔴 남의 카드 주소가 안 섞였다',
    !민글.includes('100yearmap.com/work') && !민글.includes('100yearmap.com/age'));
  본다('⑦ 출처가 있다', 민글.includes('NEIS'));

  // ⑧ 화면의 수가 전부 자료에서 오나
  const 댈수 = new Set([
    ...자료.가장오래된.map((r) => r.설립연),
    자료.낸곳, 자료.전체, 자료.백년넘은곳수, 백년몫, 올해, 올해 - 맨오래.설립연, 장들.length,
  ].filter((v) => v != null).map(String));
  const 수볼글 = 민글.split(갈곳).join(' ');
  const 못댄것 = [...수볼글.matchAll(/\d[\d,]*\.?\d*/g)].map((m) => m[0].replace(/,/g, ''))
    .filter((s) => !댈수.has(s) && !/^[1-6]$/.test(s));
  본다(`⑧ 화면의 수가 전부 자료에서 온다${못댄것.length ? ` — 못 댄 것: ${[...new Set(못댄것)].slice(0, 6).join(' · ')}` : ''}`,
    못댄것.length === 0);

  console.log(`\n백 년 넘은 곳 ${자료.백년넘은곳수.toLocaleString()} / ${자료.낸곳.toLocaleString()} = ${백년몫}%` +
    ` · 맨 먼저 ${맨오래.title} ${맨오래.설립연}년`);
  process.exit();
}

/* 🔴 여기부터가 «부르면 도는 몸»이다 — 남이 불러 화면 글만 얻어 갈 수 있게 감싼다.
   ⚠ import.meta.url 로 견주면 윈도에서 조용히 안 돈다. 파일 이름으로 견딘다 */
const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'make-cardnews-100y-elementary.mjs';
if (내가직접불렸나) {
  const 갖다 = createRequire(path.join(ROOT, 'package.json'));
  const sharp = 갖다('sharp');
  fs.mkdirSync(낼방, { recursive: true });

  const 장들 = 짜기();
  for (let i = 0; i < 장들.length; i++) {
    const svg = 그리기(장들[i], i + 1, 장들.length, 바닥, 갈곳);
    const 이름 = `우리학교는몇살-${i + 1}.png`;
    await sharp(Buffer.from(svg)).png().toFile(path.join(낼방, 이름));
    console.log('✅', 이름);
  }
  console.log(`\n✅ 카드 ${장들.length}장 → public/100y/cardnews/우리학교는몇살-1..${장들.length}.png`);
  console.log('⛔ 주소 없는 카드는 안 만든다 — 모든 장에', 갈곳, '이 들어 있다');
}
