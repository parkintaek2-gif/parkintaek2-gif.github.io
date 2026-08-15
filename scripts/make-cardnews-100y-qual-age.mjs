/**
 * make-cardnews-100y-qual-age.mjs — 카드뉴스 「예순에도 땁니다」 6장
 *
 * 🔴 왜 — 사장님 「왜 자꾸 대입에 머물러있니」. 8/15 에 재 보니 지면 4,970장 중
 *   4,927장(99.1%)이 대입 쪽이었다. 이 카드는 **위쪽 나이를 밖으로 데려온다.**
 *   ⭐ 「몇 살에 뭘 해야 한다」를 말하지 않는다. **몇 살에도 하고 있다**만 적는다.
 *
 * 자료 — src/data/100yearmap/qual-age.json (build-100y-qual-age.mjs 가 만든다)
 *   공공데이터포털 15037521 · 2023년 · 이용허락범위 제한 없음
 *
 * ⛔ 지켜야 할 말 —
 *   · 합격률을 나이끼리 견주지 않는다 — 나이마다 보는 등급이 다르다. 그래서 **건수**로만 쓴다
 *   · 「늦지 않았다」·「지금이라도」를 쓰지 않는다. 그건 우리가 할 말이 아니라 훈수다
 *   · 응시 건수는 사람 수가 아니다. 그것을 카드에 적는다
 *
 * 쓰는 법  node scripts/make-cardnews-100y-qual-age.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { 그리기 } from './make-cardnews-100y-voc.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const 낼방 = path.join(ROOT, 'public', '100y', 'cardnews');
const 자료 = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/100yearmap/qual-age.json'), 'utf8'));

/** ⛔ 이 카드가 데려갈 곳 — /work 가 아니다 */
export const 갈곳 = '100yearmap.com/age';
export const 바닥 = `${자료.출처.기준연도}년 · 국가자격 취득자 관련 통계 · 나이를 줄세우지 않습니다`;

/** ⛔ 「미상」과 분모 미달은 뺀다. 뺐다는 것을 카드에 적는다 */
export const 낼띠 = 자료.나이.filter((r) => r.나이 !== '미상' && r.비율을_낼_수_있나);
export const 뺀줄 = 자료.나이.filter((r) => r.나이 === '미상' || !r.비율을_낼_수_있나);

export const 예순위 = 낼띠.filter((r) => /^(6\d|65세)/.test(r.나이));
export const 예순위응시 = 예순위.reduce((a, r) => a + r.응시, 0);
export const 예순위합격 = 예순위.reduce((a, r) => a + r.합격, 0);
export const 온응시 = 낼띠.reduce((a, r) => a + r.응시, 0);
/** 쉰 넘어 본 몫 — 「위쪽 나이가 얼마나 되나」를 한 수로 */
export const 쉰위 = 낼띠.filter((r) => /^(5\d|6\d|65세)/.test(r.나이));
export const 쉰위몫 = Number(((쉰위.reduce((a, r) => a + r.응시, 0) / 온응시) * 100).toFixed(1));
const 맨위 = 낼띠[낼띠.length - 1];

export function 짜기() {
  return [
    {
      꼴: '표지',
      큰수: `${예순위합격.toLocaleString()}건`,
      줄들: ['예순을 넘겨 국가기술자격에', '붙은 횟수입니다. 한 해 동안요.'],
    },
    {
      머리: '몇 살에 보고 있나',
      줄들: 낼띠.slice(-5).map((r) => `${r.나이}  ${r.응시.toLocaleString()}건`),
    },
    {
      머리: '가장 위 칸도 비어 있지 않습니다',
      줄들: [
        `${맨위.나이}`,
        `응시 ${맨위.응시.toLocaleString()}건 · 합격 ${맨위.합격.toLocaleString()}건`,
        '',
        '자격시험에 나이 제한은',
        '이 표 어디에도 없습니다.',
      ],
    },
    {
      머리: '쉰 넘어 본 것이',
      줄들: [
        `전체 응시의 ${쉰위몫}%입니다.`,
        '',
        '적은 수가 아닙니다.',
        '다만 이것은 사람 수가 아니라',
        '시험을 본 횟수입니다.',
      ],
    },
    {
      머리: '⛔ 나이끼리 견주지 마세요',
      줄들: [
        '나이마다 보는 등급이 다릅니다.',
        `${낼띠.find((r) => r.가장많이본등급 !== 낼띠[0].가장많이본등급)?.나이 ?? ''}는 다른 등급을 가장 많이 봅니다.`,
        '',
        '그래서 이 카드에는',
        '합격률을 넣지 않았습니다.',
      ],
    },
    {
      꼴: '마무리',
      머리: '늦고 이르다는 말은 안 합니다',
      줄들: [
        '몇 살에 무엇을 해야 한다고',
        '말하지 않습니다.',
        '',
        `출처 — ${자료.출처.이름}`,
        `${자료.출처.기준연도}년 · ${자료.출처.이용허락범위}`,
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
  const 등수말 = ['등수', '순위', '랭킹', '몇 위', '상위권', '하위권'].filter((w) => 민글.includes(w));
  본다(`② ⛔ 등수·순위를 쓰지 않는다${등수말.length ? ` — ${등수말.join(' · ')}` : ''}`, 등수말.length === 0);
  // ⛔ 훈수를 두지 않는다. 「늦지 않았다」도 훈수다 — 늦고 이름을 우리가 정하는 말이기 때문이다
  const 훈수 = ['늦지 않았', '지금이라도', '도전하세요', '해야 합니다', '하십시오. 나이는'].filter((w) => 민글.includes(w));
  본다(`③ 🔴 훈수를 두지 않는다${훈수.length ? ` — ${훈수.join(' · ')}` : ''}`, 훈수.length === 0);
  본다('④ 🔴 합격률(%)을 나이끼리 늘어놓지 않는다',
    !낼띠.some((r) => r.합격률 != null && 민글.includes(`${r.나이}  ${r.합격률}%`)));
  본다('⑤ 「사람이 아니라 횟수」를 밝힌다', 민글.includes('시험을 본 횟수입니다'));
  본다('⑥ 나이마다 등급이 다르다는 것을 적는다', 민글.includes('보는 등급이 다릅니다'));
  본다('⑦ 🔴 모든 장에 데려올 주소가 있다',
    장들.every((장, i) => 그리기(장, i + 1, 장들.length, 바닥, 갈곳).includes(갈곳)));
  본다('⑧ 🔴 남의 카드 주소(/work)가 안 섞였다', !민글.includes('100yearmap.com/work'));
  본다('⑨ 출처와 이용허락이 있다',
    민글.includes(자료.출처.이름) && 민글.includes(자료.출처.이용허락범위));

  // ⚠ 「45~49세」 같은 **나이띠 이름 속의 수**도 자료에서 온 것이다.
  //    처음에 안 넣었더니 45·49·50·54·55·59 가 「지어낸 수」로 잡혔다 — 자가 거짓말을 했다
  const 띠속수 = 자료.나이.flatMap((r) => (String(r.나이).match(/\d+/g) || []).map(Number));
  const 댈수 = new Set([
    ...띠속수,
    ...자료.나이.flatMap((r) => [r.응시, r.합격, r.합격률, r.종목수, r.가장많이본등급_응시]),
    예순위응시, 예순위합격, 쉰위몫, 온응시, 장들.length, Number(자료.출처.기준연도),
  ].filter((v) => v != null).map(String));
  const 수볼글 = 민글.split(갈곳).join(' ');
  const 못댄것 = [...수볼글.matchAll(/\d[\d,]*\.?\d*/g)].map((m) => m[0].replace(/,/g, ''))
    .filter((s) => !댈수.has(s) && !/^[1-6]$/.test(s));
  본다(`⑩ 화면의 수가 전부 자료에서 온다${못댄것.length ? ` — 못 댄 것: ${[...new Set(못댄것)].slice(0, 6).join(' · ')}` : ''}`,
    못댄것.length === 0);

  console.log(`\n낼 띠 ${낼띠.length} · 뺀 줄 ${뺀줄.map((r) => r.나이).join(',') || '없음'}` +
    ` · 예순위 응시 ${예순위응시.toLocaleString()}·합격 ${예순위합격.toLocaleString()} · 쉰위 몫 ${쉰위몫}%`);
  process.exit();
}

/* 🔴 2026-08-16 — 여기부터가 «부르면 도는 몸»이다. 근거를 대 보려고 import 했다가
   이 자가 곧바로 카드를 다시 그렸다. 영상 자에서 겪은 것과 같은 병이다.
   ⇒ **내가 직접 불렸을 때만** 돈다. 남이 불러 화면 글만 얻어 갈 수 있게 한다.
   ⚠ import.meta.url 로 견주면 윈도에서 조용히 안 돈다. 파일 이름으로 견딘다 */
const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'make-cardnews-100y-qual-age.mjs';
if (내가직접불렸나) {
  /* ── 그리기 ─────────────────────────────────────────── */
  const 갖다 = createRequire(path.join(ROOT, 'package.json'));
  const sharp = 갖다('sharp');
  fs.mkdirSync(낼방, { recursive: true });

  const 장들 = 짜기();
  for (let i = 0; i < 장들.length; i++) {
    const svg = 그리기(장들[i], i + 1, 장들.length, 바닥, 갈곳);   // ⛔ 바닥·갈곳을 안 넘기면 남의 것이 찍힌다
    const 이름 = `예순에도딴다-${i + 1}.png`;
    await sharp(Buffer.from(svg)).png().toFile(path.join(낼방, 이름));
    console.log('✅', 이름);
  }
  console.log(`\n✅ 카드 ${장들.length}장 → public/100y/cardnews/예순에도딴다-1..${장들.length}.png`);
  console.log('⛔ 주소 없는 카드는 안 만든다 — 모든 장에', 갈곳, '이 들어 있다');

}
