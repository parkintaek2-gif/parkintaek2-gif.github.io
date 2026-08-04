/**
 * map-major-to-track.mjs — 고교 학과(NEIS) → 직업계고 계열(KOSIS) 매핑
 *
 * 왜 필요한가 —
 *   NEIS 학과 925개에는 취업률이 없다. KOSIS 취업통계는 **계열 11개 단위**로만 나온다.
 *   둘을 이어야 학과 페이지에 「이 길로 간 사람들은 실제로 어떻게 됐나」를 쓸 수 있다.
 *
 * ⚠ 이 매핑은 **우리가 만든 것**이지 원자료에 있는 것이 아니다.
 *   그래서 화면에 「학과명으로 계열을 추정했다」고 밝히고, 못 정한 것은 '미분류'로 남긴다.
 *   ⛔ 추측으로 아무 계열에나 넣지 않는다 — 1위가 쓰레기면 표 전체를 못 믿게 된다.
 *
 * KOSIS 계열 11개(DT_920024_3N_007 C1_NM 원문):
 *   총계 · 공업 · 상업 · 농림업 · 가사 · 수산 · 실업 · 해양 · 일반 · 예술 · 종합
 */

import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PAGES = join(ROOT, 'archive', '100yearmap');

/** 계열 판정 규칙 — 위에서부터 먼저 맞는 것을 쓴다. 순서가 중요하다.
 *  ⚠ 「정보처리과」는 공업이다(전산). 「경영정보과」는 상업이다 — 「정보」만 보면 갈린다.
 *     그래서 상업 계열 단어를 공업보다 먼저 본다. */
const RULES = [
  ['수산', /수산|어업|양식|해양생물/],
  ['해양', /해양|항해|기관사|해기|조선.*항해|승선/],
  ['농림업', /농업|원예|축산|임업|산림|조경|동물|화훼|식물|바이오농|자영농|영농|농생명/],
  ['가사', /조리|외식|제과|제빵|미용|헤어|뷰티|피부|메이크업|패션|의상|복지|보육|아동|간호|보건|치위생|호텔|관광|바리스타|커피|식품|영양|유아교육|베이커리|카페|반려|서비스/],
  ['예술', /예술|디자인|음악|미술|무용|연극|영상|만화|웹툰|사진|공예|실용음악|방송연예|모델|체육|예체능|연예|엔터|애니메이션|콘텐츠|미디어|출판|편집|메타버스/],
  ['상업', /상업|경영|회계|세무|금융|유통|물류|마케팅|사무|비서|무역|부동산|창업|전자상거래|국제통상|비즈니스|비지니스|e-?비즈|쇼핑몰|광고|홍보|보험|증권|은행/i],
  ['공업', /공업|기계|전기|전자|건축|토목|화공|화학|자동차|항공|철도|반도체|로봇|메카|자동화|용접|금형|설비|에너지|환경|섬유|인쇄|세라믹|재료|금속|정보처리|컴퓨터|소프트|정보통신|네트워크|보안|게임|스마트|IT|드론|3D|CAD|측량|배관|플랜트|산업|인터넷|멀티미디어|건설|전산|시스템|제어|통신|나노|바이오공|의공|전자기계|응용|기술|제조|가공|생산|공정|계측/i],
  // ⚠ 여기까지 안 걸린 「○○정보과」는 공업(전산)으로 본다. 상업 단어는 위에서 이미 걸렀다.
  ['공업', /정보/],
  ['일반', /인문|자연|과학|보통|일반|공통|영어|중국어|일본어|독일어|프랑스어|스페인어|러시아어|베트남어|외국어|어학|국제/],
];

const trackOf = (name) => {
  for (const [track, re] of RULES) if (re.test(name)) return track;
  return '미분류';
};

const readJson = async (p) => {
  const t = await readFile(p, 'utf8');
  return JSON.parse(t.charCodeAt(0) === 0xfeff ? t.slice(1) : t);
};

async function main() {
  const majors = await readJson(join(PAGES, 'pages-major.json'));
  const thin = await readJson(join(PAGES, 'pages-major-thin.json'));

  const tally = {};
  const mapped = majors.map((m) => {
    const 계열 = trackOf(m.title);
    tally[계열] = (tally[계열] || 0) + 1;
    return { ...m, 계열, 계열추정: true };
  });

  // thin 쪽도 같이 매긴다 — 나중에 살릴 때 다시 안 돌리려고
  const thinTally = {};
  const thinMapped = thin.map((t) => {
    const 계열 = trackOf(t.title);
    thinTally[계열] = (thinTally[계열] || 0) + 1;
    return { ...t, 계열, 계열추정: true };
  });

  await writeFile(join(PAGES, 'pages-major.json'), JSON.stringify(mapped), 'utf8');
  await writeFile(join(PAGES, 'pages-major-thin.json'), JSON.stringify(thinMapped), 'utf8');

  const line = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · ');
  console.log(`학과 페이지 ${mapped.length} → ${line(tally)}`);
  console.log(`thin ${thinMapped.length} → ${line(thinTally)}`);

  const 미분류 = mapped.filter((m) => m.계열 === '미분류');
  console.log(`\n⚠ 미분류 ${미분류.length}개 (예시): ${미분류.slice(0, 12).map((m) => m.title).join(' · ')}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
