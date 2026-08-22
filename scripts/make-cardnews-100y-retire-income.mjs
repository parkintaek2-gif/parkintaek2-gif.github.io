/**
 * make-cardnews-100y-retire-income.mjs — 카드뉴스 「나이대별 가구 소득」 5장
 *
 * 🔴 경제(노후) 분야 첫 카드뉴스(사장님 「0~100세×다섯 분야」 지시, 1단계 로드맵 4번째).
 * ⭐ 소득은 절벽처럼 줄지만(50대→60세 이상 -38.8%) 자산은 그렇지 않다(-9.2%) — 이 대비를 그대로 싣는다.
 *
 * 쓰는 법  node scripts/make-cardnews-100y-retire-income.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { 그리기 } from './make-cardnews-100y-voc.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const 낼방 = path.join(ROOT, 'public', '100y', 'cardnews');
const 자료 = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/100yearmap/retire-income.json'), 'utf8'));

export const 갈곳 = '100yearmap.com/retire-income';
export const 바닥 = `${자료.출처.기관} · 가계금융복지조사`;

export const 나이별 = 자료.나이별;
export const 소득낙차 = 자료['⭐ 소득이 가장 크게 떨어지는 구간'];
export const 자산낙차 = 자료['⭐ 자산이 떨어지는 구간(비교용)'];
const 만원 = (n) => n.toLocaleString();

export function 짜기() {
  const 전 = 나이별.find((r) => r.칸 === 소득낙차.전칸);
  const 후 = 나이별.find((r) => r.칸 === 소득낙차.후칸);
  return [
    {
      꼴: '표지',
      큰수: `${소득낙차.변화율}%`,
      줄들: [`${소득낙차.전칸}→${소득낙차.후칸}`, '소득이 이만큼 줄어듭니다.'],
    },
    {
      머리: '나이대로 봅니다(경상소득)',
      줄들: 나이별.map((r) => `${r.칸}   ${만원(r.경상소득)}만원`),
    },
    {
      머리: '⭐ 그런데 자산은 다릅니다',
      줄들: [
        `소득 ${소득낙차.변화율}% 줄 때`,
        `자산은 ${자산낙차.변화율}%만`,
        '줄어듭니다.',
      ],
    },
    {
      머리: `${전.칸} → ${후.칸}`,
      줄들: [
        `소득  ${만원(전.경상소득)} → ${만원(후.경상소득)}만원`,
        `자산  ${만원(전.자산)} → ${만원(후.자산)}만원`,
      ],
    },
    {
      꼴: '마무리',
      머리: '노후를 어떻게 준비하라고 쓰지 않습니다',
      줄들: [
        '이것은 통계이지',
        '당신이 아닙니다.',
        '',
        `출처 — ${자료.출처.기관}`,
        `${자료.최신}년 가계금융복지조사`,
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
  본다('② 표지에 소득낙차 변화율이 있다', 장들[0].꼴 === '표지' && 장들[0].큰수.includes(String(소득낙차.변화율)));
  본다('③ ⭐ 자산낙차 변화율을 실었다', 민글.includes(String(자산낙차.변화율)));
  본다('④ ⭐ 소득·자산 대비를 한 장 통째로 썼다', 장들[2].머리.includes('그런데 자산은'));
  const 걸린 = ['등수', '순위', '랭킹', '몇 위', '해야 합니다', '준비하십시오'].filter((w) => 민글.includes(w));
  본다(`⑤ ⛔ 노후 준비를 해야 한다고 안 쓴다${걸린.length ? ` — ${걸린.join(' · ')}` : ''}`, 걸린.length === 0);
  본다('⑥ 🔴 모든 장에 데려갈 주소가 있다',
    장들.every((장, i) => 그리기(장, i + 1, 장들.length, 바닥, 갈곳).includes(갈곳)));
  본다('⑦ 🔴 남의 카드 주소가 안 섞였다',
    !민글.includes('100yearmap.com/lifelong') && !민글.includes('100yearmap.com/oneperson'));

  const 댈수 = new Set([
    소득낙차.변화율, Math.abs(소득낙차.변화율), 자산낙차.변화율, Math.abs(자산낙차.변화율),
    Number(자료.최신), 장들.length,
    29, 30, 39, 40, 49, 50, 59, 60,
    ...나이별.map((r) => r.경상소득), ...나이별.map((r) => r.자산),
  ].filter((v) => v != null).map(String));
  const 못댄것 = [...민글.split(갈곳).join(' ').matchAll(/\d[\d,]*\.?\d*/g)]
    .map((m) => m[0].replace(/,/g, '')).filter((s) => !댈수.has(s) && !/^[1-5]$/.test(s));
  본다(`⑧ 화면의 수가 전부 자료에서 온다${못댄것.length ? ` — 못 댄 것: ${[...new Set(못댄것)].slice(0, 6).join(' · ')}` : ''}`,
    못댄것.length === 0);

  console.log(`\n소득낙차 ${소득낙차.전칸}→${소득낙차.후칸} ${소득낙차.변화율}% · 자산낙차 ${자산낙차.변화율}%`);
  process.exit();
}

/* 🔴 여기부터가 «부르면 도는 몸»이다 */
const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'make-cardnews-100y-retire-income.mjs';
if (내가직접불렸나) {
  const sharp = createRequire(path.join(ROOT, 'package.json'))('sharp');
  fs.mkdirSync(낼방, { recursive: true });
  const 장들 = 짜기();
  for (let i = 0; i < 장들.length; i++) {
    const svg = 그리기(장들[i], i + 1, 장들.length, 바닥, 갈곳);
    await sharp(Buffer.from(svg)).png().toFile(path.join(낼방, `은퇴후소득-${i + 1}.png`));
    console.log('✅', `은퇴후소득-${i + 1}.png`);
  }
  console.log('⛔ 주소 없는 카드는 안 만든다 — 모든 장에', 갈곳);
}
