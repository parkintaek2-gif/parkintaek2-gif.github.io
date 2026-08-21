/**
 * make-cardnews-100y-home.mjs — 카드뉴스 「집을 가진 가구는 몇 살일까요」 6장
 *
 * 🔴 사장님 상시 지시 — **매일 카드·카드뉴스·숏영상도 낸다. 외부유입용이다.**
 * ⛔ 주소 없는 카드는 안 만든다 — 여섯 장 전부에 100yearmap.com/home 을 박는다.
 *
 * ⛔⛔ 이 카드가 가장 조심할 것 — **소유율로 읽히면 거짓이 된다.**
 *   「50대의 25.2%가 집을 가졌다」가 아니라 「집을 가진 가구의 25.2%가 50대」다.
 *   ⇒ 둘째 장을 통째로 그 갈림에 쓴다. 카드 한 장만 떠돌 때가 제일 위험하다.
 * ⛔ 「40대가 집을 덜 산다」로 못 쓴다 — 구성비라 사람 수가 바뀌어도 몫이 움직인다.
 * ⛔ 「집을 사야 한다」로 안 쓴다.
 *
 * 쓰는 법  node scripts/make-cardnews-100y-home.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { 그리기 } from './make-cardnews-100y-voc.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const 낼방 = path.join(ROOT, 'public', '100y', 'cardnews');
const 자료 = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/100yearmap/home.json'), 'utf8'));

export const 갈곳 = '100yearmap.com/home';
export const 바닥 = '국가데이터처 · 소유율이 아니라 구성비입니다';

export const 칸 = (이름) => 자료.나이별.find((r) => r.칸 === 이름);
export const 맨위 = 자료.가장많은칸;
export const 오른칸 = 자료.가장오른칸;
export const 내린칸 = 자료.가장내린칸;
export const 첫흐름 = 자료.흐름첫, 끝흐름 = 자료.흐름끝;

export function 짜기() {
  return [
    {
      꼴: '표지',
      큰수: `${맨위.몫}%`,
      줄들: ['집을 가진 가구 가운데', `가구주가 ${맨위.칸}인 집입니다.`],
    },
    {
      머리: '⛔ 소유율이 아닙니다',
      줄들: [
        `「${맨위.칸}의 ${맨위.몫}%가`,
        '집을 가졌다」가 아닙니다.',
        '',
        '「집을 가진 가구의',
        `${맨위.몫}%가 ${맨위.칸}」입니다.`,
      ],
    },
    {
      머리: '나이대마다 몇 %인가',
      줄들: 자료.나이별.filter((r) => r.가구 != null).map((r) => `${r.칸}  ${r.몫}%`),
    },
    {
      머리: `${첫흐름.해}년부터 ${끝흐름.해}년까지 자리가 옮겨 갔습니다`,
      줄들: [
        `${내린칸.칸}   ${내린칸.앞}% → ${내린칸.뒤}%   (${내린칸.바뀜}%p)`,
        `${오른칸.칸}   ${오른칸.앞}% → ${오른칸.뒤}%   (+${오른칸.바뀜}%p)`,
      ],
    },
    {
      머리: '⚠ 다만 이렇게 읽으면 안 됩니다',
      줄들: [
        `「${내린칸.칸}가 집을 덜 산다」로는`,
        '못 읽습니다.',
        '',
        '구성비라서 사람 수가 바뀌어도',
        '몫이 움직입니다 —',
        `그 사이 ${내린칸.칸} 인구가 줄었습니다.`,
      ],
    },
    {
      꼴: '마무리',
      머리: '집을 사야 한다고 쓰지 않습니다',
      줄들: [
        '⛔ 나이는 «가구주»의 나이입니다.',
        '그 집에 사는 사람들의',
        '나이가 아닙니다.',
        '',
        `출처 — 국가데이터처 ${자료.최신}년`,
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
  본다('② 표지에 큰 수가 있다', 장들[0].꼴 === '표지' && 장들[0].큰수.includes(String(맨위.몫)));
  본다('③ ⛔ 소유율이 아니라는 것을 둘째 장 통째로 썼다',
    장들[1].머리.includes('소유율이 아닙니다') && 장들[1].줄들.join(' ').includes('가 아닙니다'));
  본다('④ ⛔ 바닥에도 「소유율이 아니라 구성비」를 박았다', 바닥.includes('소유율이 아니라 구성비'));
  본다('⑤ ⛔ 「덜 산다」로 못 읽는다고 한 장을 썼다',
    민글.includes('집을 덜 산다」로는') && 민글.includes('구성비라서'));
  본다('⑥ ⛔ 나이가 «가구주»의 나이라고 적었다', 민글.includes('가구주»의 나이입니다'));
  const 걸린 = ['등수', '순위', '랭킹', '몇 위', '꼴찌', '사야 한다', '늦었'].filter((w) => 민글.includes(w))
    .filter((w) => !(w === '사야 한다' && 민글.includes('사야 한다고 쓰지 않습니다')));
  본다(`⑦ ⛔ 줄도 안 세우고 재촉도 안 한다${걸린.length ? ` — ${걸린.join(' · ')}` : ''}`, 걸린.length === 0);
  본다('⑧ 🔴 모든 장에 데려갈 주소가 있다',
    장들.every((장, i) => 그리기(장, i + 1, 장들.length, 바닥, 갈곳).includes(갈곳)));
  본다('⑨ 🔴 남의 카드 주소가 안 섞였다',
    !민글.includes('100yearmap.com/care') && !민글.includes('100yearmap.com/breakfast'));

  const 댈수 = new Set([
    ...자료.나이별.flatMap((r) => [r.몫, ...(r.칸.match(/\d+/g) || []).map(Number)]),
    맨위.몫, 오른칸.앞, 오른칸.뒤, 오른칸.바뀜, 내린칸.앞, 내린칸.뒤, 내린칸.바뀜,
    Number(첫흐름.해), Number(끝흐름.해), Number(자료.최신), 장들.length,
  ].filter((v) => v != null).map(String));
  const 못댄것 = [...민글.split(갈곳).join(' ').matchAll(/-?\d[\d,]*\.?\d*/g)]
    .map((m) => m[0].replace(/,/g, '')).filter((s) => !댈수.has(s) && !/^[1-6]$/.test(s));
  본다(`⑩ 화면의 수가 전부 자료에서 온다${못댄것.length ? ` — 못 댄 것: ${[...new Set(못댄것)].slice(0, 6).join(' · ')}` : ''}`,
    못댄것.length === 0);

  console.log(`\n집을 가진 가구 ${자료.소유전체.toLocaleString()} · 맨 위 ${맨위.칸} ${맨위.몫}% · ${자료.최신}년`);
  process.exit();
}

/* 🔴 여기부터가 «부르면 도는 몸»이다 */
const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'make-cardnews-100y-home.mjs';
if (내가직접불렸나) {
  const sharp = createRequire(path.join(ROOT, 'package.json'))('sharp');
  fs.mkdirSync(낼방, { recursive: true });
  const 장들 = 짜기();
  for (let i = 0; i < 장들.length; i++) {
    const svg = 그리기(장들[i], i + 1, 장들.length, 바닥, 갈곳);
    await sharp(Buffer.from(svg)).png().toFile(path.join(낼방, `집을가진나이-${i + 1}.png`));
    console.log('✅', `집을가진나이-${i + 1}.png`);
  }
  console.log('⛔ 주소 없는 카드는 안 만든다 — 모든 장에', 갈곳);
}
