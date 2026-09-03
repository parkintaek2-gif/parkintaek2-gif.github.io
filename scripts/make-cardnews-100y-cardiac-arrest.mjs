/**
 * make-cardnews-100y-cardiac-arrest.mjs — 카드뉴스 「급성심장정지, 몇 살부터 늘어나는가」 5장
 *
 * 사장님이 전달한 언론 보도의 원 숫자(질병관리청·소방청 「급성심장정지조사」)를 KOSIS로
 * 직접 확인한 /cardiac-arrest 지면의 카드뉴스판. 「분율」과 「발생률」의 분모가 다르다는
 * 이 지면의 핵심 경고를 카드에도 그대로 싣는다 — 숫자를 섞지 않는다.
 *
 * 쓰는 법  node scripts/make-cardnews-100y-cardiac-arrest.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { 그리기 } from './make-cardnews-100y-voc.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const 낼방 = path.join(ROOT, 'public', '100y', 'cardnews');
const 자료 = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/100yearmap/cardiac-arrest.json'), 'utf8'));

export const 갈곳 = '100yearmap.com/cardiac-arrest';
export const 바닥 = `${자료.출처.이름} · KOSIS`;

export const 연령별 = 자료.연령별;
const 삼십대 = 연령별.find((r) => r.칸 === '30-39세');
const 사십대 = 연령별.find((r) => r.칸 === '40-49세');
export const 삼사십대분율합 = Math.round((삼십대.분율 + 사십대.분율) * 10) / 10;
export const 성별 = 자료.성별;

export function 짜기() {
  return [
    {
      꼴: '표지',
      큰수: `${자료.전체_건수.toLocaleString()}명`,
      줄들: [`${자료.최신연도}년 급성심장정지로`, '119구급대에 실려간 사람입니다.'],
    },
    {
      머리: '나이대로 보면(환자 중 몫)',
      줄들: 연령별.map((r) => `${r.칸}   ${r.분율}%`),
    },
    {
      머리: '⛔ "30대는 3.5%뿐"이 맞을까요',
      줄들: [
        `30대는 전체의 ${삼십대.분율}%지만,`,
        `40대까지 합치면 ${삼사십대분율합}%로`,
        '10%를 넘습니다.',
        '',
        `50세 미만만 하루 ${자료['50세미만_하루평균']}명꼴입니다.`,
      ],
    },
    {
      머리: '⭐ "몫"과 "위험"은 다릅니다',
      줄들: [
        '분율은 환자 중 그 나이의 몫,',
        '발생률은 그 나이 인구가',
        '걸릴 위험(10만 명당)입니다.',
        '',
        `남자 ${성별.find((r) => r.칸 === '남자').발생률}명 · 여자 ${성별.find((r) => r.칸 === '여자').발생률}명`,
      ],
    },
    {
      꼴: '마무리',
      머리: '몇 살부터 조심해야 한다고 쓰지 않습니다',
      줄들: [
        '이것은 통계이지',
        '당신이 아닙니다.',
        '',
        '출처 — 질병관리청·소방청',
        `${자료.최신연도}년 KOSIS`,
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
  본다('② 표지에 전체 건수가 있다', 장들[0].꼴 === '표지' && 장들[0].큰수.replace(/,/g, '').includes(String(자료.전체_건수)));
  본다('③ 분율과 발생률을 한 장에 섞지 않는다(30대 카드엔 발생률 없음)',
    !JSON.stringify(장들[2]).includes('발생률'));
  본다('④ 분율·발생률이 다르다는 것을 명시한 장이 있다', 민글.includes('몫') && 민글.includes('위험'));
  const 걸린 = ['등수', '순위', '랭킹', '몇 위', '해야 합니다', '조심하세요', '주의하세요'].filter((w) => 민글.includes(w));
  본다(`⑤ ⛔ 판정하는 말을 안 쓴다${걸린.length ? ` — ${걸린.join(' · ')}` : ''}`, 걸린.length === 0);
  본다('⑥ 🔴 모든 장에 데려갈 주소가 있다',
    장들.every((장, i) => 그리기(장, i + 1, 장들.length, 바닥, 갈곳).includes(갈곳)));
  본다('⑦ 🔴 남의 카드 주소가 안 섞였다', !민글.includes('100yearmap.com/fall-injury'));

  const 나이경계 = 연령별.flatMap((r) => (r.칸.match(/\d+/g) ?? []));
  const 댈수 = new Set([
    자료.전체_건수, Number(자료.최신연도), 장들.length,
    삼십대.분율, 사십대.분율, 삼사십대분율합, 자료['50세미만_하루평균'],
    성별.find((r) => r.칸 === '남자').발생률, 성별.find((r) => r.칸 === '여자').발생률,
    ...연령별.map((r) => r.분율),
    ...나이경계,
    '2011030',
  ].filter((v) => v != null).map(String).map((s) => s.replace(/,/g, '')));
  const 못댄것 = [...민글.split(갈곳).join(' ').matchAll(/\d[\d,]*\.?\d*/g)]
    .map((m) => m[0].replace(/,/g, '')).filter((s) => !댈수.has(s) && !/^[1-5]$/.test(s) && s !== '10' && s !== '100' && s !== '119');
  본다(`⑧ 화면의 수가 전부 자료에서 온다${못댄것.length ? ` — 못 댄 것: ${[...new Set(못댄것)].slice(0, 6).join(' · ')}` : ''}`,
    못댄것.length === 0);

  process.exit();
}

/* 🔴 여기부터가 «부르면 도는 몸»이다 */
const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'make-cardnews-100y-cardiac-arrest.mjs';
if (내가직접불렸나) {
  const sharp = createRequire(path.join(ROOT, 'package.json'))('sharp');
  fs.mkdirSync(낼방, { recursive: true });
  const 장들 = 짜기();
  for (let i = 0; i < 장들.length; i++) {
    const svg = 그리기(장들[i], i + 1, 장들.length, 바닥, 갈곳);
    await sharp(Buffer.from(svg)).png().toFile(path.join(낼방, `급성심장정지-${i + 1}.png`));
    console.log('✅', `급성심장정지-${i + 1}.png`);
  }
  console.log('⛔ 주소 없는 카드는 안 만든다 — 모든 장에', 갈곳);
}
