/**
 * make-cardnews-100y-work-family-priority.mjs — 카드뉴스 「일-가정 우선도, 10년」 5장
 *
 * 소스 지면 — /work-family-priority-by-age (DT_1SSLA050R, 일 vs 가정 5단계)
 * ⛔ 이 카드의 수는 전부 그 지면에 있는 수다. 새로 재지 않는다.
 *
 * 쓰는 법  node scripts/make-cardnews-100y-work-family-priority.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { 그리기 } from './make-cardnews-100y-voc.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const 낼방 = path.join(ROOT, 'public', '100y', 'cardnews');
const 자료 = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/100yearmap/work-family-priority-by-age.json'), 'utf8'));

export const 갈곳 = '100yearmap.com/work-family-priority-by-age';
export const 바닥 = `${자료.출처.기관} · 일-가정 우선도 조사`;

const 전체 = 자료.전체;
const 나이띠 = 자료.나이띠별;
const 일우선폭 = (r) => r.일우선_2015 - r.일우선_2025;
const 가정우선폭 = (r) => r.가정우선_2025 - r.가정우선_2015;
const 가장크게바뀜 = 나이띠.reduce((a, b) =>
  (일우선폭(b) + 가정우선폭(b) > 일우선폭(a) + 가정우선폭(a) ? b : a));

const 삼십대 = 나이띠.find((r) => r.띠 === '30~39세');

export function 짜기() {
  return [
    {
      꼴: '표지',
      큰수: `${전체.일우선_2015}%→${전체.일우선_2025}%`,
      줄들: ['「일을 우선시 한다」', '응답, 10년 사이 변화입니다.'],
    },
    {
      머리: '가정 우선도는 반대로 늘었습니다',
      줄들: [
        `일 우선  ${전체.일우선_2015}%→${전체.일우선_2025}%`,
        `가정 우선 ${전체.가정우선_2015}%→${전체.가정우선_2025}%`,
        '',
        '전국, 2015년과 2025년입니다.',
      ],
    },
    {
      머리: `가장 크게 바뀐 나이띠는 ${가장크게바뀜.띠}입니다`,
      줄들: [
        `일 우선  ${가장크게바뀜.일우선_2015}%→${가장크게바뀜.일우선_2025}%`,
        `가정 우선 ${가장크게바뀜.가정우선_2015}%→${가장크게바뀜.가정우선_2025}%`,
      ],
    },
    {
      머리: '30대를 보면',
      줄들: [
        `일 우선  ${삼십대.일우선_2015}%→${삼십대.일우선_2025}%`,
        `가정 우선 ${삼십대.가정우선_2015}%→${삼십대.가정우선_2025}%`,
        '',
        '10년 전엔 일 우선이 더 많았지만',
        '지금은 가정 우선이 크게 늘었습니다.',
      ],
    },
    {
      꼴: '마무리',
      머리: '이 나이면 이래야 한다는 뜻이 아닙니다',
      줄들: [
        '이것은 통계이지',
        '당신이 아닙니다.',
        '',
        `출처 — ${자료.출처.기관}`,
        '일-가정 우선도, 연령별, 2015·2025',
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
  본다('② 표지에 큰 수가 있다', 장들[0].꼴 === '표지' && 장들[0].큰수.includes(String(전체.일우선_2015)));
  본다('③ 모든 장에 데려갈 주소가 있다',
    장들.every((장, i) => 그리기(장, i + 1, 장들.length, 바닥, 갈곳).includes(갈곳)));
  본다('④ 남의 카드 주소가 안 섞였다',
    !민글.includes('100yearmap.com/pediatrics') && !민글.includes('100yearmap.com/usedcar'));

  const 댈수 = new Set([
    전체.일우선_2015, 전체.일우선_2025, 전체.가정우선_2015, 전체.가정우선_2025,
    ...나이띠.flatMap((r) => [r.일우선_2015, r.일우선_2025, r.가정우선_2015, r.가정우선_2025]),
    /* 나이띠 경계값(19·29·30·39·40·49·50·59·60·69·70·79·80) — 자료가 아니라 칸 이름의 일부다 */
    19, 29, 30, 39, 40, 49, 50, 59, 60, 69, 70, 79, 80,
    /* 해(년)·「10년」·쪽수 — 자료값이 아니라 글 속 상수다 */
    2015, 2025, 10,
    장들.length,
  ].filter((v) => v != null).map(String));
  const 못댄것 = [...민글.split(갈곳).join(' ').matchAll(/\d[\d,]*\.?\d*/g)]
    .map((m) => m[0].replace(/,/g, '')).filter((s) => !댈수.has(s) && !/^[1-5]$/.test(s));
  본다(`⑤ 화면의 수가 전부 자료에서 온다${못댄것.length ? ` — 못 댄 것: ${[...new Set(못댄것)].slice(0, 6).join(' · ')}` : ''}`,
    못댄것.length === 0);

  console.log(`\n일 우선 ${전체.일우선_2015}%→${전체.일우선_2025}%`);
  process.exit();
}

/* 🔴 여기부터가 «부르면 도는 몸»이다 */
const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'make-cardnews-100y-work-family-priority.mjs';
if (내가직접불렸나) {
  const sharp = createRequire(path.join(ROOT, 'package.json'))('sharp');
  fs.mkdirSync(낼방, { recursive: true });
  const 장들 = 짜기();
  for (let i = 0; i < 장들.length; i++) {
    const svg = 그리기(장들[i], i + 1, 장들.length, 바닥, 갈곳);
    await sharp(Buffer.from(svg)).png().toFile(path.join(낼방, `일가정우선도-10년-${i + 1}.png`));
    console.log('✅', `일가정우선도-10년-${i + 1}.png`);
  }
  console.log('⛔ 주소 없는 카드는 안 만든다 — 모든 장에', 갈곳);
}
