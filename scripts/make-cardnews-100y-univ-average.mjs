/**
 * make-cardnews-100y-univ-average.mjs — 카드뉴스 「전국 평균이 두 개입니다」 6장
 *
 * 🔴 왜 — 2026-08-16 에 대학 자료를 재다 찾은 것이다.
 *   대학정보공시의 「전국 평균」은 **구분마다 따로**인데, 우리 지면도 남의 지면도
 *   그냥 「전국 평균」이라고만 적는다. 그래서 전문대 학생이 72.1% 와 견주고 있으면서
 *   옆의 62.8% 를 같은 「전국 평균」으로 읽고 **없는 격차를 본다.**
 *   ⭐ 이 카드는 «수를 자랑하는 카드»가 아니라 **오독을 막는 카드**다. 그래서 낼 값이 있다.
 *
 * 자료 — src/data/100yearmap/pages-university.json (377곳)
 *   전국평균은 우리가 낸 값이 아니라 대학정보공시가 발표한 값이다.
 *   ⭐ 그 평균이 «사람 기준 가중평균»인 것은 3번이 2026-08-16 에 재서 확인했다
 *     (취업자 합 ÷ 취업대상자 합 → 62.8 · 72.1 이 소수점까지 맞는다. 단순평균은 60.4 · 72.6)
 *
 * ⛔ 지켜야 할 말 —
 *   · 등수·순위를 쓰지 않는다. 「어느 쪽이 낫다」를 쓰지 않는다
 *   · 무리 이름은 **자료에서 잰 것**만 — 구분 「대학」에 든 종류는 대학교·교육대학뿐이다.
 *     넘겨짚어 「4년제」라고 쓰지 않는다
 *   · 화면의 수는 전부 자료에서 온다. 손으로 안 박는다
 *
 * 쓰는 법  node scripts/make-cardnews-100y-univ-average.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { 그리기 } from './make-cardnews-100y-voc.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const 낼방 = path.join(ROOT, 'public', '100y', 'cardnews');
const 자료 = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/100yearmap/pages-university.json'), 'utf8'));

/** ⛔ 이 카드가 데려갈 곳. 자격 카드의 /work 가 아니다 */
export const 갈곳 = '100yearmap.com/university';
export const 공시연도 = [...new Set(자료.map((x) => x.공시연도).filter(Boolean))].sort().pop();
export const 바닥 = `${공시연도}년 대학정보공시 · 등급을 매기지 않습니다`;

/** 구분마다 그 지표의 전국평균을 자료에서 캔다 — 손으로 안 박는다 */
export function 평균캐기(지표) {
  const 뭉치 = {};
  for (const x of 자료) {
    const d = x[지표];
    if (!d || d.전국평균 == null) continue;
    (뭉치[x.구분] ??= new Set()).add(d.전국평균);
  }
  const 낸다 = {};
  for (const [구분, 값들] of Object.entries(뭉치)) {
    // ⛔ 한 구분에 평균이 둘 이상이면 우리가 잘못 안 것이다. 지어내지 말고 멈춘다
    if (값들.size !== 1) throw new Error(`${지표} · ${구분} 의 전국평균이 ${값들.size} 개다 — 카드를 못 만든다`);
    낸다[구분] = [...값들][0];
  }
  return 낸다;
}

/** 구분마다 든 «종류»를 세어 무리 이름을 만든다. ⛔ 넘겨짚지 않는다 */
export function 무리이름(구분) {
  const 종류들 = [...new Set(자료.filter((x) => x.구분 === 구분).map((x) => x.종류))];
  return 종류들.join('·');
}

export const 지표들 = ['취업률', '중도탈락률', '전임교원확보율'];
export const 표 = 지표들.map((k) => ({ 이름: k, 평균: 평균캐기(k) }));
export const 대학무리 = 무리이름('대학');
export const 전문무리 = 무리이름('전문대학');
const 취 = 표[0].평균, 교원 = 표[2].평균;
/** 제일 크게 벌어지는 칸 — 표지에 쓸 수 */
export const 벌어짐 = Math.round((교원['대학'] - 교원['전문대학']) * 10) / 10;
export const 학교수 = { 대학: 자료.filter((x) => x.구분 === '대학').length, 전문대학: 자료.filter((x) => x.구분 === '전문대학').length };

export function 짜기() {
  return [
    {
      꼴: '표지',
      큰수: '2개',
      줄들: ['대학 지면에서 보는 「전국 평균」은', '하나가 아닙니다.'],
    },
    {
      머리: '같은 이름, 다른 수',
      줄들: [
        '취업률의 전국 평균',
        '',
        `${대학무리}  ${취['대학']}%`,
        `${전문무리}  ${취['전문대학']}%`,
        '',
        '둘 다 「전국 평균」이라 불립니다.',
      ],
    },
    {
      머리: '크게 벌어지는 칸도 있습니다',
      줄들: [
        '전임교원확보율의 전국 평균',
        '',
        `${대학무리}  ${교원['대학']}%`,
        `${전문무리}  ${교원['전문대학']}%`,
        '',
        `${벌어짐}%p 차이입니다.`,
      ],
    },
    {
      머리: '⚠ 그래서 생기는 오해',
      줄들: [
        '전문대에 다니는 학생이',
        `${취['전문대학']}%와 견주고 있는데,`,
        `옆 학교 지면의 ${취['대학']}%를`,
        '같은 「전국 평균」으로 읽으면',
        '',
        '없는 격차가 보입니다.',
      ],
    },
    {
      머리: '⛔ 이것은 등급이 아닙니다',
      줄들: [
        '평균이 다른 것은',
        '학제가 다르기 때문입니다.',
        '',
        '어느 쪽이 낫다는 뜻이 아닙니다.',
        '견줄 자리가 다를 뿐입니다.',
      ],
    },
    {
      꼴: '마무리',
      머리: '어느 평균인지 보고 읽으세요',
      줄들: [
        '백년지도는 학교마다',
        '어느 무리의 평균인지 적어 둡니다.',
        '',
        `${학교수.대학 + 학교수.전문대학}곳 · ${공시연도}년 대학정보공시`,
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
  // ⚠ `\b` 를 쓰지 않는다 — 한글은 \w 가 아니라 경계가 안 생긴다
  const 등수말 = ['등수', '순위', '랭킹', '몇 위', '상위권', '하위권', '좋은 학교', '나쁜 학교']
    .filter((w) => 민글.includes(w));
  본다(`② ⛔ 등수·순위를 쓰지 않는다${등수말.length ? ` — ${등수말.join(' · ')}` : ''}`, 등수말.length === 0);
  본다('③ 🔴 「어느 쪽이 낫다」를 안 쓴다', 민글.includes('어느 쪽이 낫다는 뜻이 아닙니다'));
  본다('④ 🔴 무리 이름을 넘겨짚지 않는다 — 「4년제」를 안 쓴다', !민글.includes('4년제'));
  본다('⑤ 두 무리 이름이 자료에서 온 것이다',
    민글.includes(대학무리) && 민글.includes(전문무리) && 대학무리.includes('교육대학'));
  본다('⑥ 오해가 무엇인지 카드에 적는다', 민글.includes('없는 격차가 보입니다'));
  본다(`⑦ 🔴 데려올 주소가 /university 다 — 모든 장에`,
    장들.every((장, i) => 그리기(장, i + 1, 장들.length, 바닥, 갈곳).includes(갈곳)));
  본다('⑧ 🔴 남의 카드 주소(/work)가 안 섞였다', !민글.includes('100yearmap.com/work'));
  본다('⑨ 바닥이 이 카드의 출처다', 민글.includes('대학정보공시'));

  // ⑩ 화면의 수가 전부 자료에서 오나 — ⚠ 주소의 «100» 을 먼저 뺀다(8/16 에 그것에 걸렸다)
  const 댈수 = new Set([
    ...지표들.flatMap((k) => Object.values(평균캐기(k))),
    벌어짐, 학교수.대학, 학교수.전문대학, 학교수.대학 + 학교수.전문대학,
    Number(공시연도), 장들.length,
  ].filter((v) => v != null).map(String));
  const 수볼글 = 민글.split(갈곳).join(' ');
  const 못댄것 = [...수볼글.matchAll(/\d[\d,]*\.?\d*/g)].map((m) => m[0].replace(/,/g, ''))
    .filter((s) => !댈수.has(s) && !/^[1-6]$/.test(s));
  본다(`⑩ 화면의 수가 전부 자료에서 온다${못댄것.length ? ` — 못 댄 것: ${[...new Set(못댄것)].slice(0, 6).join(' · ')}` : ''}`,
    못댄것.length === 0);

  console.log(`\n${대학무리} ${학교수.대학}곳 · ${전문무리} ${학교수.전문대학}곳` +
    ` · 취업률 ${취['대학']}/${취['전문대학']} · 전임교원 ${교원['대학']}/${교원['전문대학']} (${벌어짐}%p)`);
  process.exit();
}

/* ── 그리기 ─────────────────────────────────────────── */
const 갖다 = createRequire(path.join(ROOT, 'package.json'));
const sharp = 갖다('sharp');
fs.mkdirSync(낼방, { recursive: true });

const 장들 = 짜기();
for (let i = 0; i < 장들.length; i++) {
  const svg = 그리기(장들[i], i + 1, 장들.length, 바닥, 갈곳);   // ⛔ 바닥·갈곳을 안 넘기면 남의 것이 찍힌다
  const 이름 = `전국평균두개-${i + 1}.png`;
  await sharp(Buffer.from(svg)).png().toFile(path.join(낼방, 이름));
  console.log('✅', 이름);
}
console.log(`\n✅ 카드 ${장들.length}장 → public/100y/cardnews/전국평균두개-1..${장들.length}.png`);
console.log('⛔ 주소 없는 카드는 안 만든다 — 모든 장에', 갈곳, '이 들어 있다');
