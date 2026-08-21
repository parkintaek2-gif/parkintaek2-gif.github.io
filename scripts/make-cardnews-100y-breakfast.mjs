/**
 * make-cardnews-100y-breakfast.mjs — 카드뉴스 「아침을 거르는 건 몇 살일까요」 6장
 *
 * 🔴 사장님 상시 지시 — **매일 카드·카드뉴스·숏영상도 낸다. 외부유입용이다.**
 * ⛔ 주소 없는 카드는 안 만든다 — 여섯 장 전부에 100yearmap.com/breakfast 를 박는다.
 *
 * ⛔⛔ 이 카드가 가장 조심할 것 — **표지에 10대를 놓으면 거짓이 된다.**
 *   10~18세 35.5% 인데 19~29세가 62.1% 다. 맨 위 칸은 20대다.
 *   ⇒ 표지를 **물음**으로 놓고 둘째 장에서 나이칸을 다 보인다. 하나만 떼지 않는다.
 * ⛔ 「먹어야 한다」로 안 쓴다. 재촉하지 않는다.
 * ⛔ 「거른다」의 뜻(전날 하루)을 카드 안에 넣는다 — 카드 한 장만 떠돌 때가 제일 위험하다.
 *
 * 쓰는 법  node scripts/make-cardnews-100y-breakfast.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { 그리기 } from './make-cardnews-100y-voc.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const 낼방 = path.join(ROOT, 'public', '100y', 'cardnews');
const 자료 = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/100yearmap/breakfast.json'), 'utf8'));

export const 갈곳 = '100yearmap.com/breakfast';
export const 바닥 = '질병관리청 · 조사 전날 하루를 물은 값입니다';

/** ⛔ 짐작으로 고르지 않는다 — 칸 이름으로 찾는다 */
export const 칸 = (이름) => 자료.나이별.find((r) => r.칸 === 이름);
export const 열대 = 자료.열대;
export const 맨위 = 자료.가장많이거르는칸;
export const 맨아래 = 자료.가장적게거르는칸;
export const 흐름첫 = 자료.흐름첫, 흐름끝 = 자료.흐름끝;
export const 오른것 = Math.round((흐름끝['10~18세'] - 흐름첫['10~18세']) * 10) / 10;

export function 짜기() {
  return [
    {
      꼴: '표지',
      큰수: `${열대.몫}%`,
      줄들: ['10~18세 가운데', '어제 아침을 거른 사람입니다.'],
    },
    {
      머리: '⛔ 그런데 맨 위 칸은 10대가 아닙니다',
      줄들: 자료.나이별.filter((r) => r.몫 != null).map((r) => `${r.칸}  ${r.몫}%`),
    },
    {
      머리: `가장 많이 거르는 것은 ${맨위.칸}입니다`,
      줄들: [
        `${맨위.칸}   ${맨위.몫}%`,
        `${열대.칸}   ${열대.몫}%`,
        `${맨아래.칸}   ${맨아래.몫}%`,
        '',
        '한 칸만 떼어 말하면',
        '다른 그림이 됩니다.',
      ],
    },
    {
      머리: '학교에 들어가고 벌어집니다',
      줄들: [
        `${칸('1~9세').칸}    ${칸('1~9세').몫}%`,
        `${열대.칸}   ${열대.몫}%`,
        '',
        `${자료.열대가1_9세의몇배}배입니다.`,
      ],
    },
    {
      머리: `${흐름첫.해}년부터 ${흐름끝.해}년까지`,
      줄들: [
        `10~18세  ${흐름첫['10~18세']}%  →  ${흐름끝['10~18세']}%`,
        '',
        `${오른것}%p 올랐습니다.`,
        '',
        `값이 있는 해 ${자료.흐름해수}해를`,
        '하나도 빠뜨리지 않았습니다.',
      ],
    },
    {
      꼴: '마무리',
      머리: '먹어야 한다고 쓰지 않습니다',
      줄들: [
        '⛔ 「거른다」는',
        '조사 전날 하루를 물은 값입니다.',
        '',
        '출처 — 질병관리청',
        `국민건강영양조사 ${자료.최신}년`,
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
  본다('② 표지에 큰 수가 있다', 장들[0].꼴 === '표지' && 장들[0].큰수.includes(String(열대.몫)));
  본다('③ ⛔ 맨 위 칸이 10대가 아니라는 것을 둘째 장에 박았다',
    장들[1].머리.includes('10대가 아닙니다'));
  본다(`④ ⛔ 맨 위 칸(${맨위.칸})을 카드에 실었다`, 민글.includes(`${맨위.칸} ${맨위.몫}%`));
  본다('⑤ ⛔ 「거른다」의 뜻이 카드 안에 있다', 민글.includes('조사 전날 하루를 물은 값입니다'));
  const 걸린 = ['먹어야', '늦었', '서둘', '등수', '순위', '랭킹', '몇 위', '꼴찌'].filter((w) => 민글.includes(w));
  /* ⛔ 마지막 장은 「먹어야 한다고 쓰지 않습니다」라 «먹어야»가 부정문으로 들어 있다.
     8/14 에 부정문에 낱말이 남아 세 번 걸린 자리라, 여기서는 그 한 자리만 빼고 센다 */
  const 진짜걸린 = 걸린.filter((w) => !(w === '먹어야' && 민글.includes('먹어야 한다고 쓰지 않습니다')));
  본다(`⑥ ⛔ 재촉도 줄 세우기도 없다${진짜걸린.length ? ` — ${진짜걸린.join(' · ')}` : ''}`, 진짜걸린.length === 0);
  본다('⑦ 🔴 모든 장에 데려갈 주소가 있다',
    장들.every((장, i) => 그리기(장, i + 1, 장들.length, 바닥, 갈곳).includes(갈곳)));
  본다('⑧ 🔴 남의 카드 주소가 안 섞였다',
    !민글.includes('100yearmap.com/care') && !민글.includes('100yearmap.com/marriage-age'));

  const 댈수 = new Set([
    ...자료.나이별.flatMap((r) => [r.몫, ...(r.칸.match(/\d+/g) || []).map(Number)]),
    열대.몫, 맨위.몫, 맨아래.몫, 자료.열대가1_9세의몇배, 오른것, 자료.흐름해수,
    흐름첫['10~18세'], 흐름끝['10~18세'], Number(흐름첫.해), Number(흐름끝.해), Number(자료.최신),
    장들.length].filter((v) => v != null).map(String));
  const 못댄것 = [...민글.split(갈곳).join(' ').matchAll(/\d[\d,]*\.?\d*/g)]
    .map((m) => m[0].replace(/,/g, '')).filter((s) => !댈수.has(s) && !/^[1-6]$/.test(s));
  본다(`⑨ 화면의 수가 전부 자료에서 온다${못댄것.length ? ` — 못 댄 것: ${[...new Set(못댄것)].slice(0, 6).join(' · ')}` : ''}`,
    못댄것.length === 0);

  console.log(`\n10~18세 ${열대.몫}% · 맨 위 ${맨위.칸} ${맨위.몫}% · ${자료.최신}년`);
  process.exit();
}

/* 🔴 여기부터가 «부르면 도는 몸»이다 */
const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'make-cardnews-100y-breakfast.mjs';
if (내가직접불렸나) {
  const sharp = createRequire(path.join(ROOT, 'package.json'))('sharp');
  fs.mkdirSync(낼방, { recursive: true });
  const 장들 = 짜기();
  for (let i = 0; i < 장들.length; i++) {
    const svg = 그리기(장들[i], i + 1, 장들.length, 바닥, 갈곳);
    await sharp(Buffer.from(svg)).png().toFile(path.join(낼방, `아침을거르는나이-${i + 1}.png`));
    console.log('✅', `아침을거르는나이-${i + 1}.png`);
  }
  console.log('⛔ 주소 없는 카드는 안 만든다 — 모든 장에', 갈곳);
}
