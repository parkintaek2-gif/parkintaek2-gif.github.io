/**
 * make-cardnews-100y-housework-spectrum.mjs — 카드뉴스 「가사분담 공평응답, 10년」 5장
 *
 * 소스 지면 — /housework-spectrum-by-age (DT_1SSFA112R, 아내~남편 5단계)
 * ⛔ 이 카드의 수는 전부 그 지면에 있는 수다. 새로 재지 않는다.
 *
 * 쓰는 법  node scripts/make-cardnews-100y-housework-spectrum.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { 그리기 } from './make-cardnews-100y-voc.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const 낼방 = path.join(ROOT, 'public', '100y', 'cardnews');
const 자료 = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/100yearmap/housework-spectrum-by-age.json'), 'utf8'));

export const 갈곳 = '100yearmap.com/housework-spectrum-by-age';
export const 바닥 = `${자료.출처.기관} · 아내~남편 5단계 조사`;

const 전체 = 자료.전체;
const 나이띠 = 자료.나이띠별;
const 증가폭 = (r) => r.공평_2024 - r.공평_2014;
const 가장많이늘음 = 나이띠.reduce((a, b) => (증가폭(b) > 증가폭(a) ? b : a));
const 가장적게늘음 = 나이띠.reduce((a, b) => (증가폭(b) < 증가폭(a) ? b : a));

export function 짜기() {
  return [
    {
      꼴: '표지',
      큰수: `${전체.공평_2014}%→${전체.공평_2024}%`,
      줄들: ['「부부가 공평하게 분담」', '응답, 10년 사이 변화입니다.'],
    },
    {
      머리: '나이띠마다 늘어난 폭이 다릅니다',
      줄들: [
        `13~19세   +${증가폭(나이띠[0]).toFixed(1)}%p`,
        `30~39세   +${증가폭(나이띠[2]).toFixed(1)}%p`,
        `50~59세   +${증가폭(나이띠[4]).toFixed(1)}%p`,
        `60세 이상  +${증가폭(나이띠[5]).toFixed(1)}%p`,
        '',
        `가장 많이 는 것은 ${가장많이늘음.띠}입니다.`,
      ],
    },
    {
      머리: `2024년에도 나이가 많을수록 낮습니다`,
      줄들: [
        `13~19세  ${나이띠[0].공평_2024}%`,
        `30~39세  ${나이띠[2].공평_2024}%`,
        `50~59세  ${나이띠[4].공평_2024}%`,
        `60세 이상 ${나이띠[5].공평_2024}%`,
      ],
    },
    {
      머리: '반대편은 「남편」이 아니라 「아내」입니다',
      줄들: [
        `「아내가 주로 한다」는`,
        `${전체.아내주로_2014}%(2014) → ${전체.아내주로_2024}%(2024).`,
        '',
        '「남편이 주로/전적」은',
        '모든 나이띠에서 4% 아래입니다.',
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
        '가사분담(아내~남편 5단계), 2014·2024',
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
  본다('② 표지에 큰 수가 있다', 장들[0].꼴 === '표지' && 장들[0].큰수.includes(String(전체.공평_2014)));
  본다('③ 모든 장에 데려갈 주소가 있다',
    장들.every((장, i) => 그리기(장, i + 1, 장들.length, 바닥, 갈곳).includes(갈곳)));
  본다('④ 남의 카드 주소가 안 섞였다',
    !민글.includes('100yearmap.com/pediatrics') && !민글.includes('100yearmap.com/usedcar'));

  const 댈수 = new Set([
    전체.공평_2014, 전체.공평_2024, 전체.아내주로_2014, 전체.아내주로_2024,
    ...나이띠.flatMap((r) => [r.공평_2014, r.공평_2024, 증가폭(r).toFixed(1)]),
    /* 나이띠 경계값(13·19·30·39·50·59·60) — 자료가 아니라 칸 이름의 일부다 */
    13, 19, 20, 29, 30, 39, 40, 49, 50, 59, 60,
    /* 해(년)·「10년」·쪽수 — 자료값이 아니라 글 속 상수다 */
    2014, 2024, 10,
    장들.length,
  ].filter((v) => v != null).map(String));
  const 못댄것 = [...민글.split(갈곳).join(' ').matchAll(/\d[\d,]*\.?\d*/g)]
    .map((m) => m[0].replace(/,/g, '')).filter((s) => !댈수.has(s) && !/^[1-5]$/.test(s));
  본다(`⑤ 화면의 수가 전부 자료에서 온다${못댄것.length ? ` — 못 댄 것: ${[...new Set(못댄것)].slice(0, 6).join(' · ')}` : ''}`,
    못댄것.length === 0);

  console.log(`\n공평 ${전체.공평_2014}%→${전체.공평_2024}%`);
  process.exit();
}

/* 🔴 여기부터가 «부르면 도는 몸»이다 */
const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'make-cardnews-100y-housework-spectrum.mjs';
if (내가직접불렸나) {
  const sharp = createRequire(path.join(ROOT, 'package.json'))('sharp');
  fs.mkdirSync(낼방, { recursive: true });
  const 장들 = 짜기();
  for (let i = 0; i < 장들.length; i++) {
    const svg = 그리기(장들[i], i + 1, 장들.length, 바닥, 갈곳);
    await sharp(Buffer.from(svg)).png().toFile(path.join(낼방, `가사분담-공평응답-10년-${i + 1}.png`));
    console.log('✅', `가사분담-공평응답-10년-${i + 1}.png`);
  }
  console.log('⛔ 주소 없는 카드는 안 만든다 — 모든 장에', 갈곳);
}
