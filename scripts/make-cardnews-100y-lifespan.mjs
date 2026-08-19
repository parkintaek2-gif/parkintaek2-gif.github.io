/**
 * make-cardnews-100y-lifespan.mjs — 카드뉴스 「직원을 두고 몇 해를 갔나」 6장
 *
 * 🔴 8/20 예약분(docs/3번-콘텐트-예약-0817~0820.md). 자료는 손에 있는 business-lifespan.json.
 * ⛔ 자료가 못박은 「쓰면 안 되는 말」을 그대로 지킨다 —
 *   생존율 · 폐업률 · 「장사가 몇 년 갔나」. 셋 다 이 자료로는 못 낸다.
 * ⛔ 이 표에는 **닫힌 곳만** 있다. 오래 갈 곳은 아직 안 닫혀서 여기 없다.
 *
 * 쓰는 법  node scripts/make-cardnews-100y-lifespan.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { 그리기 } from './make-cardnews-100y-voc.mjs';
import { 사람말달 } from './lib/사람말달.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const 낼방 = path.join(ROOT, 'public', '100y', 'cardnews');
const 자료 = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/100yearmap/business-lifespan.json'), 'utf8'));

export const 갈곳 = '100yearmap.com/age';
export const 사람말기준월 = 사람말달(자료.출처.기준월);
export const 바닥 = `${사람말기준월} · ${자료.출처.이름} · 업종을 줄세우지 않습니다`;
export const 전체 = 자료.전체;
/** ⛔ 업종을 줄세우지 않는다. 짧은 쪽·긴 쪽을 각각 셋씩만 보인다 */
export const 짧은셋 = [...자료.자료].sort((a, b) => a.수명중앙값 - b.수명중앙값).slice(0, 3);
export const 긴셋 = [...자료.자료].sort((a, b) => b.수명중앙값 - a.수명중앙값).slice(0, 3);

export function 짜기() {
  return [
    {
      꼴: '표지',
      큰수: `${전체.수명중앙값}년`,
      줄들: ['직원을 두고 있던 기간의', '한가운데입니다.'],
    },
    {
      머리: '한 해 안에 닫힌 곳이',
      줄들: [
        `${전체.일년내}%입니다.`,
        `세 해 안은 ${전체.삼년내}%입니다.`,
        '',
        `한 달 동안 자격이 없어진 ${전체.닫은곳.toLocaleString()}곳을`,
        '세었습니다.',
      ],
    },
    {
      머리: '짧은 쪽 세 업종',
      줄들: 짧은셋.map((r) => `${r.업종}  ${r.수명중앙값}년`),
    },
    {
      머리: '긴 쪽 세 업종',
      줄들: 긴셋.map((r) => `${r.업종}  ${r.수명중앙값}년`),
    },
    {
      머리: '⛔ 이 수를 읽는 법',
      줄들: [
        '이 표에는 닫힌 곳만 있습니다.',
        '오래 갈 곳은 아직 안 닫혀서',
        '여기 들어 있지 않습니다.',
        '',
        '그래서 「보통 이만큼 간다」로',
        '읽으시면 안 됩니다.',
      ],
    },
    {
      꼴: '마무리',
      머리: '문을 닫은 것이 아닙니다',
      줄들: [
        '직원을 내보내고 혼자 계속하는 곳도',
        '이 수에 들어옵니다.',
        '',
        `출처 — ${자료.출처.이름}`,
        `${사람말기준월} · ${자료.출처.이용허락범위}`,
      ],
    },
  ];
}

if (process.argv.includes('--selftest')) {
  const 본다 = (말, 참) => { console.log(참 ? '✅' : '🔴', 말); if (!참) process.exitCode = 1; };
  const 장들 = 짜기();
  const 민글 = 장들.map((장, i) => 그리기(장, i + 1, 장들.length, 바닥, 갈곳)).join('\n')
    .replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

  본다('① 여섯 장이다', 장들.length === 6);
  // ⛔ 자료가 스스로 적어 둔 「쓰면 안 되는 말」을 그대로 가져와 잰다
  const 금지 = ['생존율', '폐업률', '장사가'];
  const 걸린 = 금지.filter((w) => 민글.includes(w));
  본다(`② ⛔ 자료가 금한 말을 안 쓴다${걸린.length ? ` — ${걸린.join(' · ')}` : ''}`, 걸린.length === 0);
  본다('③ ⛔ 등수·순위를 쓰지 않는다',
    !['등수', '순위', '몇 위', '랭킹'].some((w) => 민글.includes(w)));
  본다('④ 🔴 「닫힌 곳만 있다」를 밝힌다', 민글.includes('닫힌 곳만 있습니다'));
  본다('⑤ 🔴 「보통 이만큼 간다」로 읽지 말라고 적는다', 민글.includes('읽으시면 안 됩니다'));
  본다('⑥ 🔴 문 닫은 것이 아님을 밝힌다', 민글.includes('혼자 계속하는 곳도'));
  본다('⑦ 🔴 모든 장에 데려올 주소가 있다',
    장들.every((장, i) => 그리기(장, i + 1, 장들.length, 바닥, 갈곳).includes(갈곳)));

  const 댈수 = new Set([
    ...자료.자료.flatMap((r) => [r.수명중앙값, r.닫은곳, r.일년내, r.삼년내]),
    전체.수명중앙값, 전체.일년내, 전체.삼년내, 전체.닫은곳, 장들.length,
    ...String(자료.출처.기준월).match(/\d+/g).map(Number),
  ].filter((v) => v != null).map(String));
  const 못댄것 = [...민글.split(갈곳).join(' ').matchAll(/\d[\d,]*\.?\d*/g)]
    .map((m) => m[0].replace(/,/g, '')).filter((s) => !댈수.has(s) && !/^[1-6]$/.test(s));
  본다(`⑧ 화면의 수가 전부 자료에서 온다${못댄것.length ? ` — 못 댄 것: ${[...new Set(못댄것)].slice(0, 6).join(' · ')}` : ''}`,
    못댄것.length === 0);

  console.log(`\n한가운데 ${전체.수명중앙값}년 · 한 해 안 ${전체.일년내}% · 닫은 곳 ${전체.닫은곳.toLocaleString()}`);
  process.exit();
}

/* 🔴 여기부터가 «부르면 도는 몸»이다 — 남이 불러 글만 얻어 갈 수 있게 감싼다(8/16 규칙) */
const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'make-cardnews-100y-lifespan.mjs';
if (내가직접불렸나) {
  const sharp = createRequire(path.join(ROOT, 'package.json'))('sharp');
  fs.mkdirSync(낼방, { recursive: true });
  const 장들 = 짜기();
  for (let i = 0; i < 장들.length; i++) {
    await sharp(Buffer.from(그리기(장들[i], i + 1, 장들.length, 바닥, 갈곳)))
      .png().toFile(path.join(낼방, `직원을둔기간-${i + 1}.png`));
    console.log('✅', `직원을둔기간-${i + 1}.png`);
  }
}
