#!/usr/bin/env node
/**
 * collect-100y-breakfast.mjs — **아침을 거르는 사람** : 열 살에서 열여덟 살이 가장 많이 거른다
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 사장님 「대입에 몰입하지 마. 한 점에 불과해」 · 「왜 자꾸 대입에 머물러있니」.
 * 그런데 10대 문이 아직 **`/major`(학과 찾기) 하나뿐**이다 — 그 나이의 «대입 아닌 자리»가 없다.
 * 2번 16시 지시 「다음 나이 문 하나 — 지면 + 카드 + 숏영상을 한 덩어리로」.
 *
 * ── 표 ─────────────────────────────────────────────────────────
 *   177/DT_11702_N033  국민건강영양조사 「아침식사 결식률 추이」  1998~2024 (27해)
 *
 * ⛔ **표를 하나만 쓴다.** 「왜 거르나」가 있는 아동종합실태조사(117/DT_117074_2023_A020)를
 *   같이 실으려 했는데 파라미터가 안 맞아 **못 받았다.** 못 받은 것을 있는 척하지 않는다 —
 *   ⇒ 「까닭은 저희가 아직 못 받았습니다」를 지면에 적는다. 억지로 다른 조사를 붙이지 않는다.
 *
 * ── ⚠ 이 자료가 못 가르는 것 ───────────────────────────────────
 * · 「결식」은 **조사 전날 아침을 안 먹은 것**이다. 늘 거르는 사람의 몫이 아니다
 * · 왜 걸렀는지는 이 표에 없다
 * · 나이칸과 소득수준은 **다른 축**이라 「가난한 10대」처럼 겹쳐 볼 수 없다
 * · 1998~2024 사이에 조사 방식이 바뀐 해가 있을 수 있다 — 우리는 그것을 못 잰다
 *
 * 쓰는 법  node scripts/collect-100y-breakfast.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ORG = '177';
export const TBL = 'DT_11702_N033';
/** C1 = 성별 · C2 = 갈래(나이·지역·소득이 **한 축에 섞여** 있다) */
export const 성별코드 = { 전체: '1', 남자: '2', 여자: '3' };
/** ⛔ 나이칸만 고른다. 「1세이상」 같은 합계 칸을 섞으면 두 배가 된다 */
export const 나이코드 = [
  { 코드: '201', 칸: '1~9세' },
  { 코드: '202', 칸: '10~18세' },
  { 코드: '203', 칸: '19~29세' },
  { 코드: '204', 칸: '30~39세' },
  { 코드: '205', 칸: '40~49세' },
  { 코드: '206', 칸: '50~59세' },
  { 코드: '207', 칸: '60~69세' },
  { 코드: '208', 칸: '70세이상' },
];
export const 소득코드 = [
  { 코드: '401', 칸: '하' }, { 코드: '402', 칸: '중하' }, { 코드: '403', 칸: '중' },
  { 코드: '404', 칸: '중상' }, { 코드: '405', 칸: '상' },
];
export const 열대칸 = '10~18세';

export function 수로(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(/,/g, '').trim();
  if (!s || s === '-' || s === 'X') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
export const 한자리 = (v) => (v == null ? null : Math.round(v * 10) / 10);
/** 가장 많이 거르는 나이칸 — ⛔ 「몇 살」로 못 쓴다. 칸 이름으로만 */
export function 가장많이(줄들) {
  const 산것 = 줄들.filter((r) => r.몫 != null);
  if (!산것.length) return null;
  return 산것.reduce((a, b) => (b.몫 > a.몫 ? b : a));
}
/** ⛔ 「몇 배」는 밑이 0 이면 못 낸다 */
export function 배(위, 아래) {
  if (위 == null || !아래) return null;
  return Math.round((위 / 아래) * 10) / 10;
}

/* ── 자가시험 ─────────────────────────────────────────── */
if (process.argv.includes('--selftest')) {
  const 본다 = (말, 참) => { console.log(참 ? '✅' : '🔴', 말); if (!참) process.exitCode = 1; };
  본다('① 빈칸을 0 으로 만들지 않는다', 수로('-') === null && 수로('') === null);
  본다('② 나이칸이 여덟이다 — 합계 칸을 안 섞었다', 나이코드.length === 8
    && !나이코드.some((r) => r.칸.includes('이상') && r.칸.startsWith('1세')));
  본다('③ 가장 많이 거르는 칸을 찾는다',
    가장많이([{ 칸: 'a', 몫: 10 }, { 칸: 'b', 몫: 35.5 }, { 칸: 'c', 몫: null }]).칸 === 'b');
  본다('④ 다 비었으면 없다고 답한다', 가장많이([{ 칸: 'a', 몫: null }]) === null);
  본다('⑤ 밑이 0 이면 몇 배를 안 낸다', 배(35.5, 0) === null && 배(null, 10) === null);
  본다('⑥ 몇 배를 소수 한 자리로', 배(35.5, 10) === 3.6);
  process.exit();
}

const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'collect-100y-breakfast.mjs';
if (내가직접불렸나) {
  const KEY = fs.readFileSync(path.join(뿌리, '.env'), 'utf8').match(/KOSIS_API_KEY\s*=\s*(.+)/)[1].trim();
  const 받기 = async (꼬리) => {
    const j = await (await fetch(
      `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${KEY}`
      + `&format=json&jsonVD=Y&orgId=${ORG}&tblId=${TBL}&itmId=RATIO&${꼬리}`)).json();
    if (!Array.isArray(j)) throw new Error(JSON.stringify(j).slice(0, 160));
    return j;
  };

  /* ⛔ 한 번에 다 받는다 — 「세 해만 받고 흐름을 못 봤다」를 두 번 겪었다 */
  const 모든칸 = [...나이코드, ...소득코드].map((r) => r.코드).join('+');
  const 날 = await 받기(`objL1=1+2+3&objL2=${모든칸}&prdSe=Y&newEstPrdCnt=40`);

  const 해들 = [...new Set(날.map((x) => x.PRD_DE))].sort();
  const 최신 = 해들[해들.length - 1];
  const 값 = (해, 칸코드, 성 = '1') => 한자리(수로(날.find(
    (x) => x.PRD_DE === 해 && x.C2 === 칸코드 && x.C1 === 성)?.DT));

  const 나이별 = 나이코드.map((r) => ({
    칸: r.칸,
    몫: 값(최신, r.코드),
    남자: 값(최신, r.코드, 성별코드.남자),
    여자: 값(최신, r.코드, 성별코드.여자),
  }));
  const 소득별 = 소득코드.map((r) => ({ 칸: r.칸, 몫: 값(최신, r.코드) }))
    .filter((r) => r.몫 != null);

  const 열대 = 나이별.find((r) => r.칸 === 열대칸);
  const 맨위 = 가장많이(나이별);
  const 맨아래 = 나이별.filter((r) => r.몫 != null).reduce((a, b) => (b.몫 < a.몫 ? b : a));

  /* 27해 흐름 — 10~18세와 전 나이를 나란히 */
  const 흐름 = 해들.map((해) => ({
    해,
    '10~18세': 값(해, '202'),
    '1~9세': 값(해, '201'),
    '40~49세': 값(해, '205'),
  })).filter((r) => r['10~18세'] != null);
  const 흐름첫 = 흐름[0], 흐름끝 = 흐름[흐름.length - 1];
  /* 🔴 못 낸 해가 있으면 「없다」가 아니라 «몇 해를 못 냈나»로 적는다 */
  const 못낸해 = 해들.filter((해) => !흐름.some((r) => r.해 === 해));

  const 낸다 = {
    무엇: '아침을 거르는 사람 — 나이칸별 아침식사 결식률과 27해 흐름',
    만든날: new Date().toISOString().slice(0, 10),
    최신, 해들, 해수: 해들.length, 흐름해수: 흐름.length, 못낸해,
    출처: {
      기관: '질병관리청',
      표: '국민건강영양조사 「아침식사 결식률 추이」',
      창구: 'KOSIS', orgId: ORG, tblId: TBL,
    },
    '⛔ 「결식」이 무슨 뜻인가':
      '조사 바로 전날 아침을 먹지 않은 사람의 몫입니다. 「늘 거른다」는 뜻이 아닙니다 — '
      + '그날 하루를 물은 값이라 「한 번이라도 거른 적 있는 사람」보다 작고, 「매일 거르는 사람」보다 큽니다.',
    '⛔ 까닭은 아직 못 받았습니다':
      '「왜 거르나」가 실린 표(아동종합실태조사)를 같이 실으려 했는데 저희가 아직 못 받았습니다. '
      + '못 받은 것을 다른 조사로 메우지 않았습니다 — 받는 대로 붙이겠습니다.',
    '⚠ 이 자료가 못 가르는 것': [
      '「결식」은 조사 전날 하루를 물은 값입니다. 늘 거르는 사람의 몫이 아닙니다.',
      '왜 걸렀는지는 이 표에 없습니다.',
      '나이칸과 소득수준은 다른 축이라 「소득이 낮은 10대」처럼 겹쳐 볼 수 없습니다.',
      `${해들[0]}~${최신} 사이에 조사 방식이 바뀐 해가 있을 수 있습니다 — 저희는 그것을 못 잽니다.`,
    ],
    나이별, 소득별, 열대, 가장많이거르는칸: 맨위, 가장적게거르는칸: 맨아래,
    열대가1_9세의몇배: 배(열대.몫, 나이별.find((r) => r.칸 === '1~9세').몫),
    흐름, 흐름첫, 흐름끝,
  };
  const 낼곳 = path.join(뿌리, 'src/data/100yearmap/breakfast.json');
  fs.writeFileSync(낼곳, JSON.stringify(낸다, null, 1), 'utf8');

  console.log(`✅ ${path.relative(뿌리, 낼곳)} — ${해들[0]}~${최신} (표에 ${해들.length}해 · 낸 것 ${흐름.length}해)`);
  for (const r of 나이별) console.log(`   ${r.칸.padEnd(9)} ${r.몫 == null ? '—' : r.몫 + '%'}  (남 ${r.남자} · 여 ${r.여자})`);
  console.log(`   가장 많이 거르는 칸: ${맨위.칸} ${맨위.몫}% · 가장 적은 칸: ${맨아래.칸} ${맨아래.몫}%`);
  console.log(`   ${열대칸}는 1~9세의 ${낸다.열대가1_9세의몇배}배`);
  console.log(`   흐름 ${흐름첫.해} ${흐름첫['10~18세']}% → ${흐름끝.해} ${흐름끝['10~18세']}%`
    + (못낸해.length ? ` · 🔴 못 낸 해 ${못낸해.join('·')}` : ' · 표의 해를 하나도 안 빠뜨렸다'));
  console.log(`   소득별(전 나이): ${소득별.map((r) => r.칸 + ' ' + r.몫 + '%').join(' · ')}`);
}
