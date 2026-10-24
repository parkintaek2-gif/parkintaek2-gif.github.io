/**
 * make-cardnews-100y-online-school.mjs — 카드뉴스 「공립 온라인학교 17곳」 5장
 *
 * 소스 지면 — /online-high-school-by-area (NEIS 학교기본정보, 각종학교(고) 가운데 온라인학교)
 * ⛔ 이 카드의 수는 전부 그 지면이 쓰는 같은 거름(이름에 온라인학교·온학교·온세종)으로 센 수다. 새로 재지 않는다.
 * ⛔ 무엇을 가르치는지·누가 다닐 수 있는지는 쓰지 않는다 — NEIS 에 없다.
 *
 * 쓰는 법  node scripts/make-cardnews-100y-online-school.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { 그리기 } from './make-cardnews-100y-voc.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const 낼방 = path.join(ROOT, 'public', '100y', 'cardnews');
const 학교 = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/100yearmap/pages-school.json'), 'utf8'));

export const 갈곳 = '100yearmap.com/online-high-school-by-area';
export const 바닥 = 'NEIS 학교기본정보 · 공립 온라인학교';

const 온라인 = 학교
  .filter((x) => x.종류 === '각종학교(고)' && /온라인학교|온학교|온세종/.test(String(x.title)))
  .sort((a, b) => String(a.설립일).localeCompare(String(b.설립일)) || a.title.localeCompare(b.title, 'ko'));
const 해 = (x) => String(x.설립일).slice(0, 4);
const 달 = (x) => Number(String(x.설립일).slice(4, 6));
const 해별 = {};
for (const x of 온라인) 해별[해(x)] = (해별[해(x)] ?? 0) + 1;
const 첫 = 온라인[0];
const 끝 = 온라인[온라인.length - 1];

export function 짜기() {
  return [
    {
      꼴: '표지',
      큰수: `${온라인.length}곳`,
      줄들: ['시도마다 하나씩 생긴', '공립 온라인학교입니다. (NEIS)'],
    },
    {
      머리: '언제 생겼나',
      줄들: Object.entries(해별).map(([y, n]) => `${y}년  ${n}곳`),
    },
    {
      머리: '처음과 마지막',
      줄들: [
        `처음  ${첫.title}`,
        `      ${해(첫)}년 ${달(첫)}월`,
        '',
        `마지막  ${끝.title}`,
        `      ${해(끝)}년 ${달(끝)}월`,
      ],
    },
    {
      머리: '누가 다닐 수 있나',
      줄들: ['NEIS 에는 없습니다.', '', '학교마다 다르니', '홈페이지에서', '꼭 확인하십시오.'],
    },
    {
      꼴: '마무리',
      머리: '배우는 길이 어디에 생겼나',
      줄들: ['이것은 통계이지', '당신이 아닙니다.', '', '출처 — NEIS 학교기본정보'],
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
  본다('② 표지 큰 수가 온라인학교 수다', 장들[0].큰수 === `${온라인.length}곳`);
  본다('③ 모든 장에 데려갈 주소가 있다',
    장들.every((장, i) => 그리기(장, i + 1, 장들.length, 바닥, 갈곳).includes(갈곳)));
  본다('④ 해별 수를 더하면 전체다', Object.values(해별).reduce((a, b) => a + b, 0) === 온라인.length);

  const 댈수 = new Set([
    온라인.length, ...Object.keys(해별), ...Object.values(해별), 해(첫), 달(첫), 해(끝), 달(끝), 장들.length,
  ].map(String));
  const 못댄것 = [...민글.split(갈곳).join(' ').matchAll(/\d[\d,]*\.?\d*/g)]
    .map((m) => m[0].replace(/,/g, '')).filter((s) => !댈수.has(s) && !/^[1-5]$/.test(s));
  본다(`⑤ 화면의 수가 전부 자료에서 온다${못댄것.length ? ` — 못 댄 것: ${[...new Set(못댄것)].slice(0, 6).join(' · ')}` : ''}`,
    못댄것.length === 0);

  console.log(`\n온라인학교 ${온라인.length}곳 · ${JSON.stringify(해별)}`);
  process.exit();
}

/* 🔴 여기부터가 «부르면 도는 몸»이다 */
const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'make-cardnews-100y-online-school.mjs';
if (내가직접불렸나) {
  const sharp = createRequire(path.join(ROOT, 'package.json'))('sharp');
  fs.mkdirSync(낼방, { recursive: true });
  const 장들 = 짜기();
  for (let i = 0; i < 장들.length; i++) {
    const svg = 그리기(장들[i], i + 1, 장들.length, 바닥, 갈곳);
    await sharp(Buffer.from(svg)).png().toFile(path.join(낼방, `온라인학교-${i + 1}.png`));
    console.log('✅', `온라인학교-${i + 1}.png`);
  }
  console.log('⛔ 주소 없는 카드는 안 만든다 — 모든 장에', 갈곳);
}
