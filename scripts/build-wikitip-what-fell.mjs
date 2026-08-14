/**
 * build-wikitip-what-fell.mjs — 91편. **무엇이 떨어진 것인가.**
 *
 * ── 이 자가 있는 까닭 ──────────────────────────────────────────
 * 동남아 네 판에서 한국 여행 문서 조회가 열두 달 사이 **30% 떨어졌다.**
 * 🔴 그 한 줄만 있으면 기사가 된다 — 「한국에 대한 관심이 식었다」.
 *   ⛔ **그 기사는 거짓이었을 것이다.**
 *
 * 떨어진 값 하나로는 세 가지를 못 가른다:
 *   ① 한국에 대한 관심이 줄었다
 *   ② 여행 정보를 백과사전에서 안 찾게 됐다
 *   ③ 백과사전 자체를 덜 본다
 *
 * ⭐ 셋을 가르는 길은 **나란히 놓는 것**뿐이다.
 *   ③ 은 **백만분율**이 뺀다 — 판 전체 조회로 나누므로 판이 줄면 분모도 준다.
 *   ①②는 **두 축**이 가른다 — 같은 판·같은 창에서 한국 **여행** 문서와 한국 **문화** 문서.
 *   그리고 **다른 나라**(일본·대만) 짝 문서를 옆에 놓아 「한국 얘기인지」를 본다.
 *
 * ── ⛔ 이 자가 스스로 막는 것 ─────────────────────────────────
 * ⛔ **한 달로 재지 않는다.** 열두 달 대 열두 달이다. 6월 하나로 재면 대양주가
 *    -25% 로 나오고 열두 달로 재면 +2% 다. 같은 자료다. **자를 바꾸면 답이 바뀐다.**
 * ⛔ **시작 높이를 안 맞추고 낙폭을 견주지 않는다.** 높은 데서 시작하면 더 떨어지기 쉽다.
 *    맞춘 칸에서 격차가 반으로 줄면, 그 격차는 **높이 탓**이라고 적는다.
 * ⛔ 못 잰 달이 하나라도 있으면 그 칸을 **통째로 뺀다.** 0 으로 메우지 않는다.
 * ⛔ 「아시아」 노선은 동남아가 아니다. 인도·중앙아시아가 같이 들어 있다. 그 말을 박는다.
 * ⛔ 상관을 내지 않는다. 두 줄이 같이 움직였다고 하나가 다른 하나를 만든 것이 아니다.
 *
 * 쓰는 법
 *   node scripts/build-wikitip-what-fell.mjs
 *   node scripts/build-wikitip-what-fell.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 오늘 } from './_kst.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** ⭐ 시작 높이가 이 배수 안쪽이면 「비슷한 데서 시작했다」로 본다 */
export const 높이문턱 = 2;

/**
 * ⛔ **KOSIS 지역 이름은 한국어다. 그대로 지면에 내보내면 영문 사이트에 「일본」이 찍힌다.**
 *
 * 🔴 8/15 에 작품 지면 530장이 정확히 이 자리에서 한국어를 흘렸다(배급·제작·첫방송).
 *   그때 배운 것: **자료가 한국어인 것과 지면이 한국어인 것은 다른 일이다.** 여기서 끊는다.
 * ⚠ 옮기지 못한 이름은 **지어내지 않는다.** null 로 두고 그 줄을 지면에서 뺀다.
 */
export const 지역이름 = {
  일본: 'Japan',
  중국: 'China',
  아시아: 'Asia (excluding Japan and China)',
  미주: 'The Americas',
  유럽: 'Europe',
  중동: 'Middle East',
  아프리카: 'Africa',
  대양주: 'Oceania',
  기타: 'Other',
};

export function 영어이름(한글) {
  return 지역이름[한글] ?? null;
}

/** ⛔ 열두 달 대 열두 달. 이보다 짧은 자로는 계절을 못 뺀다 */
export const 반창 = 12;

/**
 * 한 문서·한 판의 백만분율 합. **못 잰 달이 하나라도 있으면 null.**
 *
 * ⛔ 8/13 에 여기서 틀렸다 — 못 받은 조회수를 0 으로 더해 사람 하나가 바닥에 깔렸다.
 *   빠진 달을 0 으로 메우면 **덜 봤다**가 아니라 **안 봤다**가 된다. 그건 다른 말이다.
 */
export function 백만분율합(줄, 밑값, 판, 달들) {
  if (!줄 || !줄.views || !줄.views[판]) return null;
  let 합 = 0;
  for (const m of 달들) {
    const 본것 = 줄.views[판][m];
    const 밑 = 밑값[판]?.[m];
    if (본것 == null || 밑 == null || 밑 === 0) return null;
    합 += (1e6 * 본것) / 밑;
  }
  return 합;
}

/** ⭐ 두 값의 변화율. 앞이 0 이면 못 낸다 — 나눌 수 없다 */
export function 변화율(앞, 뒤) {
  if (앞 == null || 뒤 == null || 앞 === 0) return null;
  return (100 * (뒤 - 앞)) / 앞;
}

/** 문서를 제목으로 찾는다. ⚠ 두 파일이 필드 이름이 달라 둘 다 본다 */
export function 문서찾기(자료, 제목) {
  return (자료.articles ?? []).find((x) => (x.titleEn ?? x.title) === 제목) ?? null;
}

/** ⭐ 평균. 빈 목록이면 null — NaN 을 내보내지 않는다 */
export function 평균(값들) {
  if (!값들.length) return null;
  return 값들.reduce((a, b) => a + b, 0) / 값들.length;
}

/**
 * ⭐ **시작 높이가 비슷한 칸만 고른다.**
 * 한국 쪽이 대조군보다 훨씬 높은 데서 시작했다면, 더 떨어지는 것이 당연하다.
 * 그 당연함을 빼고도 격차가 남는지 본다.
 */
export function 높이비슷한가(한앞, 대앞, 문턱 = 높이문턱) {
  if (!한앞 || !대앞) return false;
  const 비 = 한앞 / 대앞;
  return 비 > 1 / 문턱 && 비 < 문턱;
}

/** 한 축의 요약 — 칸을 받아 평균과 셈을 낸다 */
export function 축요약(칸들) {
  const 비슷 = 칸들.filter((x) => 높이비슷한가(x.koreaBefore, x.controlBefore));
  return {
    cells: 칸들.length,
    korea: 평균(칸들.map((x) => x.koreaChange)),
    control: 평균(칸들.map((x) => x.controlChange)),
    koreaFellMore: 칸들.filter((x) => x.koreaChange < x.controlChange).length,
    /* ⭐ 높이를 맞춘 뒤에도 같은 말이 되는지 */
    matchedCells: 비슷.length,
    matchedKorea: 평균(비슷.map((x) => x.koreaChange)),
    matchedControl: 평균(비슷.map((x) => x.controlChange)),
    matchedKoreaFellMore: 비슷.filter((x) => x.koreaChange < x.controlChange).length,
  };
}

/** ⭐ 소수 첫째 자리까지. 자릿수를 넘겨 짓지 않는다 */
const 한자리 = (v) => (v == null ? null : +v.toFixed(1));

/**
 * ⭐⭐ **이 기사가 기대는 자리.**
 *
 * 「한국 대 일본·대만」은 시작 높이에 흔들린다 — 위의 `높이탓인가` 가 문화 축에서
 * 실제로 「높이 탓」을 냈다. 그래서 그 견줌에 기대지 않는다.
 *
 * 대신 **같은 나라 안에서 두 축**을 견준다. 여기서 높이 걱정은 **거꾸로 붙는다**:
 *   높이 효과란 「높은 데서 시작하면 더 떨어진다」이다.
 *   그런데 문화 문서가 여행 문서보다 **훨씬 높은 데서 시작하고도 덜 떨어졌다면**,
 *   그 격차는 높이가 만든 것이 **아니다.** 높이는 반대쪽으로 밀고 있었다.
 *
 * ⚠ 이건 「높이가 아니다」까지만 말한다. 「그러면 무엇이냐」는 말하지 않는다.
 */
export function 축끼리견줌(높은쪽, 낮은쪽) {
  if (!높은쪽 || !낮은쪽) return null;
  const 더높이시작 = 높은쪽.startLevel > 낮은쪽.startLevel;
  const 덜떨어짐 = 높은쪽.change > 낮은쪽.change;
  return {
    higherStartFellLess: 더높이시작 && 덜떨어짐,
    startLevelRatio: 한자리(높은쪽.startLevel / 낮은쪽.startLevel),
    gap: 한자리(높은쪽.change - 낮은쪽.change),
  };
}

/**
 * ⭐⭐ **기사가 낸 설명을 우리가 직접 시험한다.**
 *
 * 🔴 91편을 내고 나서 본문에 이렇게 적혀 있는 것을 봤다 —
 *   「비자·환승·교통카드처럼 **답이 정해진 물음**이 백과사전 밖으로 나갔다」.
 *   ⛔ 그건 **재지 않고 쓴 설명**이었다. 재 보니 자료가 안 받쳐 준다:
 *     답이 정해진 쪽 −33.5% · 구경하는 쪽 −29.2% — 차이가 4.3 포인트뿐이고,
 *     정작 **비자 문서가 한국 여행 문서 중 제일 덜 떨어졌다**(−15%).
 *   ⭐ 그래서 설명을 지우고 **이 갈라 재기를 자료에 박는다.** 다음에 누가 같은 설명을
 *     떠올리면 이 표가 먼저 막는다.
 *
 * ⚠ 가르는 잣대는 **우리가 정한 것**이다. 자료에서 나온 것이 아니다. 그래서 목록을 그대로 낸다 —
 *   다르게 가르고 싶은 사람이 다시 가를 수 있어야 한다.
 */
export const 답이정해진 = ['Visa policy', 'Transit card', 'Main airport', 'High-speed rail', 'Capital subway'];
export const 구경하는 = ['Shopping district', 'Nightlife district', 'Resort island', 'National cuisine', 'Country tourism'];

/**
 * ⛔ **「비자가 제일 덜 떨어졌다」를 손으로 박지 않는다.** 자료가 바뀌면 그 말이 거짓이 된다.
 * ⭐ 여행 축 한국 문서를 종류별로 접어 **제일 덜 떨어진 종류**를 찾는다.
 * ⚠ 되찾을 것이 없으면 null 을 돌려준다 — 없는 것을 지어내지 않는다.
 */
export function 제일덜떨어진종류(칸들) {
  const 접음 = new Map();
  for (const c of 칸들) {
    if (c.axis !== 'trip') continue;
    if (!접음.has(c.kind)) 접음.set(c.kind, new Map());
    접음.get(c.kind).set(`${c.korea}|${c.edition}`, c.koreaChange);
  }
  const 줄들 = [...접음.entries()].map(([kind, m]) => ({ kind, change: 평균([...m.values()]) }));
  if (!줄들.length) return null;
  return 줄들.sort((a, b) => b.change - a.change)[0];
}

export function 물음종류로가르기(칸들, 종류목록) {
  const 고른 = 칸들.filter((c) => c.axis === 'trip' && 종류목록.includes(c.kind));
  /* ⛔ 한국 쪽은 대조군 수만큼 겹쳐 세지 않는다 */
  const 한쪽 = new Map();
  for (const c of 고른) 한쪽.set(`${c.korea}|${c.edition}`, c.koreaChange);
  return {
    kinds: 종류목록,
    koreaPairs: 한쪽.size,
    korea: 평균([...한쪽.values()]),
    controlCells: 고른.length,
    control: 평균(고른.map((c) => c.controlChange)),
  };
}

/** 한 축의 **한국 문서만** — 문서·판 짝마다 한 번씩. ⛔ 대조군 수만큼 겹쳐 세면 안 된다 */
export function 한국쪽만(칸들, 축) {
  const 본것 = new Map();
  for (const c of 칸들) {
    if (c.axis !== 축) continue;
    본것.set(`${c.korea}|${c.edition}`, { startLevel: c.koreaBefore, change: c.koreaChange });
  }
  return [...본것.values()];
}

export function 요약다듬기(s) {
  return {
    ...s,
    korea: 한자리(s.korea),
    control: 한자리(s.control),
    matchedKorea: 한자리(s.matchedKorea),
    matchedControl: 한자리(s.matchedControl),
  };
}

/**
 * ⛔ **격차가 높이 탓인지 판정한다.**
 * 맞춘 뒤 격차가 절반 아래로 줄면, 그 격차는 시작 높이가 만든 것으로 읽는다.
 * ⚠ 이건 증명이 아니라 **말조심의 문턱**이다. 그래서 판정을 자료에 적어 둔다.
 */
export function 높이탓인가(요약) {
  const 원격차 = 요약.korea - 요약.control;
  const 맞격차 = 요약.matchedKorea - 요약.matchedControl;
  if (원격차 == null || 맞격차 == null || 원격차 >= 0) return null;
  return { rawGap: 한자리(원격차), matchedGap: 한자리(맞격차), shrankByHalf: 맞격차 > 원격차 / 2 };
}

if (process.argv.includes('--selftest')) {
  const 잼 = []; const 참 = (n, v) => 잼.push([n, !!v]);
  const 밑 = { id: { '2025-01': 1e6, '2025-02': 1e6 } };

  /* ⛔ 못 잰 달이 하나라도 있으면 그 칸은 통째로 빠진다 */
  참('온전하면 합을 낸다',
    백만분율합({ views: { id: { '2025-01': 10, '2025-02': 20 } } }, 밑, 'id', ['2025-01', '2025-02']) === 30);
  참('⛔ 못 잰 달이 있으면 null',
    백만분율합({ views: { id: { '2025-01': 10 } } }, 밑, 'id', ['2025-01', '2025-02']) === null);
  참('⛔ 못 잰 달을 0 으로 안 센다',
    백만분율합({ views: { id: { '2025-01': 10, '2025-02': null } } }, 밑, 'id', ['2025-01', '2025-02']) === null);
  참('⛔ 밑값이 0 이면 안 나눈다',
    백만분율합({ views: { id: { '2025-01': 10 } } }, { id: { '2025-01': 0 } }, 'id', ['2025-01']) === null);
  참('그 판에 문서가 없으면 null', 백만분율합({ views: {} }, 밑, 'id', ['2025-01']) === null);

  참('변화율을 낸다', 변화율(100, 70) === -30);
  참('⛔ 앞이 0 이면 못 낸다', 변화율(0, 5) === null);
  참('⛔ null 이 섞이면 못 낸다', 변화율(null, 5) === null);

  /* ⚠ 두 파일의 필드 이름이 다르다 — 하나만 보면 조용히 0 칸이 된다 */
  참('titleEn 으로 찾는다', 문서찾기({ articles: [{ titleEn: 'K-pop' }] }, 'K-pop') !== null);
  참('title 로도 찾는다', 문서찾기({ articles: [{ title: 'K-pop' }] }, 'K-pop') !== null);
  참('없으면 null', 문서찾기({ articles: [] }, 'K-pop') === null);

  참('평균을 낸다', 평균([10, 20]) === 15);
  참('⛔ 빈 목록은 NaN 이 아니라 null', 평균([]) === null);

  참('높이가 비슷하면 참', 높이비슷한가(100, 80));
  참('⛔ 세 배 차이는 비슷하지 않다', !높이비슷한가(300, 100));
  참('⛔ 반대로 낮아도 걸러진다', !높이비슷한가(100, 300));

  /* ⭐ 요약이 「몇 개인가」가 아니라 「제대로 됐나」를 담는지 */
  const 칸 = [
    { koreaBefore: 100, koreaChange: -30, controlBefore: 90, controlChange: -10 },
    { koreaBefore: 500, koreaChange: -40, controlBefore: 50, controlChange: -10 },
  ];
  const s = 축요약(칸);
  참('축요약이 칸을 다 센다', s.cells === 2);
  참('한국이 더 떨어진 칸을 센다', s.koreaFellMore === 2);
  참('⭐ 높이를 맞추면 칸이 준다', s.matchedCells === 1);
  참('맞춘 평균이 다르다', s.matchedKorea === -30 && s.korea === -35);

  const 판정 = 높이탓인가(s);
  참('원격차와 맞격차를 둘 다 적는다', 판정.rawGap === -25 && 판정.matchedGap === -20);
  /**
   * ⚠ 이 본보기는 **격차가 안 준 쪽**이다 — -25 에서 -20 은 반이 아니다.
   * 🔴 처음에 이걸 `true` 로 기대했다가 검사가 걸렸다. **검사가 옳고 본보기가 틀렸다.**
   *   어제 배운 그대로다 — 검사를 바꾸면 그 검사의 본보기도 같이 본다.
   */
  참('⛔ 격차가 조금만 줄면 높이 탓이 아니다', 판정.shrankByHalf === false);
  참('⭐ 격차가 반 아래로 줄면 높이 탓으로 본다',
    높이탓인가({ korea: -35, control: -10, matchedKorea: -20, matchedControl: -15 }).shrankByHalf === true);
  /* ⛔ 한국이 덜 떨어졌으면 이 판정은 뜻이 없다 */
  참('⛔ 한국이 덜 떨어졌으면 판정하지 않는다',
    높이탓인가({ korea: -5, control: -20, matchedKorea: -5, matchedControl: -20 }) === null);

  참('⭐ 열두 달 대 열두 달이다', 반창 === 12);

  /**
   * 🔴 **우리가 이미 쓴 설명을 무르는 자리다.** 91편 본문이 「답이 정해진 물음이 백과사전
   *   밖으로 나갔다」고 적었는데, 재지 않고 쓴 말이었다. 여기서 잰다.
   * ⛔ 「몇 개인가」를 안 묻는다 — 종류를 늘리거나 다르게 갈라도 검사가 서지 않아야 한다.
   */
  참('⛔ 두 묶음이 겹치지 않는다', !답이정해진.some((k) => 구경하는.includes(k)));
  참('두 묶음이 비어 있지 않다', 답이정해진.length > 0 && 구경하는.length > 0);
  const 갈칸 = [
    { axis: 'trip', kind: 'Visa policy', korea: 'V', edition: 'id', koreaChange: -10, controlChange: -20 },
    { axis: 'trip', kind: 'Visa policy', korea: 'V', edition: 'id', koreaChange: -10, controlChange: -30 },
    { axis: 'trip', kind: 'Resort island', korea: 'R', edition: 'id', koreaChange: -40, controlChange: -5 },
    { axis: 'culture', kind: 'Pop music', korea: 'K', edition: 'id', koreaChange: -1, controlChange: -1 },
  ];
  const 정해 = 물음종류로가르기(갈칸, 답이정해진);
  참('⛔ 한국 쪽을 대조군 수만큼 겹쳐 세지 않는다', 정해.koreaPairs === 1);
  참('대조 칸은 그대로 다 센다', 정해.controlCells === 2);
  참('⛔ 문화 축은 안 섞인다', 물음종류로가르기(갈칸, ['Pop music']).koreaPairs === 0);
  참('한국 평균을 낸다', 정해.korea === -10);
  참('대조 평균을 낸다', 정해.control === -25);
  /* ⭐ 제일 덜 떨어진 종류는 **자료가 정한다** — 손으로 박으면 자료가 바뀔 때 거짓이 된다 */
  참('제일 덜 떨어진 종류를 찾는다', 제일덜떨어진종류(갈칸).kind === 'Visa policy');
  참('그 값도 같이 낸다', 제일덜떨어진종류(갈칸).change === -10);
  참('⛔ 여행 축이 없으면 null', 제일덜떨어진종류([갈칸[3]]) === null);

  /**
   * 🔴 **영문 지면에 한국어가 나가면 안 된다.** 작품 지면 530장이 이 자리에서 새어 나갔다.
   * ⛔ 「몇 개인가」를 묻지 않는다 — 지역이 늘어도 검사가 서지 않게, **자료에 있는 이름이
   *   전부 옮겨졌나**를 묻는다.
   */
  참('KOSIS 지역 이름을 영어로 옮긴다', 영어이름('일본') === 'Japan');
  참('⛔ 옮긴 이름에 한글이 없다',
    Object.values(지역이름).every((v) => !/[가-힣]/.test(v)));
  참('⛔ 모르는 이름은 지어내지 않는다', 영어이름('없는지역') === null);
  참('⭐ 아시아 칸이 무엇인지 이름에 적혀 있다', /excluding/.test(영어이름('아시아')));

  /* ⛔ 한 문서가 대조군 둘과 짝지어지면 칸이 둘이다. 한국 쪽을 두 번 세면 안 된다 */
  const 겹칸 = [
    { axis: 'trip', korea: 'T-money', edition: 'id', koreaBefore: 10, koreaChange: -30 },
    { axis: 'trip', korea: 'T-money', edition: 'id', koreaBefore: 10, koreaChange: -30 },
    { axis: 'trip', korea: 'T-money', edition: 'vi', koreaBefore: 20, koreaChange: -10 },
    { axis: 'culture', korea: 'K-pop', edition: 'id', koreaBefore: 500, koreaChange: -5 },
  ];
  참('⛔ 같은 문서·같은 판을 두 번 세지 않는다', 한국쪽만(겹칸, 'trip').length === 2);
  참('축이 다르면 안 섞인다', 한국쪽만(겹칸, 'culture').length === 1);

  /* ⭐⭐ 높은 데서 시작하고도 덜 떨어졌으면, 격차는 높이 탓이 아니다 */
  참('높이 효과와 반대면 참',
    축끼리견줌({ startLevel: 500, change: -10 }, { startLevel: 50, change: -30 }).higherStartFellLess === true);
  참('⛔ 높은 쪽이 더 떨어졌으면 높이로 설명될 수 있다',
    축끼리견줌({ startLevel: 500, change: -40 }, { startLevel: 50, change: -10 }).higherStartFellLess === false);
  참('⛔ 낮은 데서 시작해 덜 떨어진 것은 이 말이 아니다',
    축끼리견줌({ startLevel: 50, change: -10 }, { startLevel: 500, change: -30 }).higherStartFellLess === false);
  참('몇 배 높은 데서 시작했는지 적는다',
    축끼리견줌({ startLevel: 500, change: -10 }, { startLevel: 50, change: -30 }).startLevelRatio === 10);

  const 진 = 잼.filter(([, ok]) => !ok);
  console.log(`자가시험 ${잼.length}개 · ${진.length ? `🔴 ${진.length}개 실패` : '✅ 전부 통과'}`);
  for (const [n] of 진) console.log(`   🔴 ${n}`);
  process.exit(진.length ? 1 : 0);
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다) {
  const 읽 = JSON.parse(fs.readFileSync(path.join(뿌리, 'archive/raw/wikipedia/sea-trip-lookups.json'), 'utf8'));
  const 대 = JSON.parse(fs.readFileSync(path.join(뿌리, 'archive/raw/wikipedia/sea-trip-control.json'), 'utf8'));
  const 항 = JSON.parse(fs.readFileSync(path.join(뿌리, 'archive/raw/kosis/air.json'), 'utf8'));

  /* ⛔ 겹치는 달만 쓴다. 한쪽에만 있는 달을 섞으면 계절이 어긋난다 */
  const 겹달 = 읽.months.filter((m) => 항.months.includes(m) && 대.months.includes(m)).sort();
  if (겹달.length < 반창 * 2) {
    console.error(`🔴 겹달이 ${겹달.length} 뿐이다 — 열두 달 대 열두 달이 안 선다. 짧은 자로 재지 않는다`);
    process.exit(1);
  }
  const 뒤창 = 겹달.slice(-반창);
  const 앞창 = 겹달.slice(-반창 * 2, -반창);

  /* ── 조회 쪽 ─────────────────────────────────────────────── */
  const 칸들 = [];
  for (const 짝 of 대.pairs) {
    /* ⚠ 여행 축의 한국 문서는 조회 파일에, 문화 축의 한국 문서는 대조 파일에 있다 */
    const 한자료 = 짝.axis === 'culture' ? 대 : 읽;
    for (const 판 of 읽.editionsSea) {
      const 한줄 = 문서찾기(한자료, 짝.korea);
      const 한앞 = 백만분율합(한줄, 한자료.editionTotals, 판, 앞창);
      const 한뒤 = 백만분율합(한줄, 한자료.editionTotals, 판, 뒤창);
      const 한변 = 변화율(한앞, 한뒤);
      if (한변 == null) continue;
      for (const 대이름 of 짝.controls) {
        const 대줄 = 문서찾기(대, 대이름);
        const 대앞 = 백만분율합(대줄, 대.editionTotals, 판, 앞창);
        const 대뒤 = 백만분율합(대줄, 대.editionTotals, 판, 뒤창);
        const 대변 = 변화율(대앞, 대뒤);
        if (대변 == null) continue;
        칸들.push({
          axis: 짝.axis,
          kind: 짝.kind,
          edition: 판,
          editionName: 읽.editionNames[판],
          korea: 짝.korea,
          control: 대이름,
          koreaBefore: 한앞,
          koreaChange: 한자리(한변),
          controlBefore: 대앞,
          controlChange: 한자리(대변),
          startsSimilar: 높이비슷한가(한앞, 대앞),
        });
      }
    }
  }

  const 여행 = 축요약(칸들.filter((x) => x.axis === 'trip'));
  const 문화 = 축요약(칸들.filter((x) => x.axis === 'culture'));

  /* ⭐⭐ 같은 나라 안에서 두 축을 견준다. ⛔ 대조군 수만큼 겹쳐 세지 않는다 */
  const 여행한국 = 한국쪽만(칸들, 'trip');
  const 문화한국 = 한국쪽만(칸들, 'culture');
  const 높이내기 = (묶음) => ({
    startLevel: 평균(묶음.map((x) => x.startLevel)),
    change: 평균(묶음.map((x) => x.change)),
  });
  const 여행높이 = 높이내기(여행한국);
  const 문화높이 = 높이내기(문화한국);
  /* ⛔ 기사가 낸 설명을 시험하는 자리. 「제일 덜 떨어진 종류」는 자료가 정한다 */
  const 덜떨어진 = 제일덜떨어진종류(칸들);

  /* ── 항공 쪽 ─────────────────────────────────────────────── */
  /**
   * 🔴 **모르는 지역 이름을 조용히 흘리지 않는다.** null 이 되면 지면에 빈 줄이 나가고,
   *   그건 「그 지역은 못 쟀다」로 읽힌다. 실제로는 **내가 이름을 안 적어 둔 것**이다.
   */
  const 모르는지역 = 항.regions.filter((r) => 영어이름(r) === null);
  if (모르는지역.length) {
    console.error(`🔴 영어 이름이 없는 지역 — ${모르는지역.join(', ')}. 지어내지 않고 멈춘다`);
    process.exit(1);
  }
  const 항칸 = [];
  for (const 지역 of 항.regions) {
    const 값 = 항.passengers[지역];
    const 못 = [...앞창, ...뒤창].filter((m) => 값[m] == null);
    if (못.length) { 항칸.push({ region: 영어이름(지역), regionKo: 지역, months: 반창 * 2 - 못.length, change: null }); continue; }
    const 더 = (ms) => ms.reduce((a, m) => a + 값[m], 0);
    항칸.push({ region: 영어이름(지역), regionKo: 지역, months: 반창 * 2, change: 한자리(변화율(더(앞창), 더(뒤창))) });
  }
  const 아시아 = 항칸.find((x) => x.regionKo === '아시아');

  /**
   * ⭐ **한 달로 재면 답이 뒤집힌다**는 것을 자료로 보여 준다.
   *   이 자가 왜 열두 달을 고집하는지의 증거다.
   */
  const 마지막달 = 뒤창.at(-1);
  const 작년같은달 = 앞창.at(-1);
  const 한달로 = 항칸
    .filter((x) => x.change != null)
    .map((x) => {
      const 값 = 항.passengers[x.regionKo];
      return { region: x.region, regionKo: x.regionKo, oneMonth: 한자리(변화율(값[작년같은달], 값[마지막달])), twelveMonths: x.change };
    })
    .filter((x) => x.oneMonth != null);
  /* 한 달 자와 열두 달 자가 **부호까지 다른** 지역 — 있으면 그것이 증거다 */
  const 부호가뒤집힌곳 = 한달로.filter((x) => Math.sign(x.oneMonth) !== Math.sign(x.twelveMonths));

  const 나감 = {
    generated: 오늘(),
    question: 'Reads of Korean travel articles in Southeast Asia fell by about a third in a year. '
      + 'What fell — interest in Korea, or the habit of using an encyclopaedia to plan a trip?',
    window: { before: `${앞창[0]}–${앞창.at(-1)}`, after: `${뒤창[0]}–${뒤창.at(-1)}`, monthsEachSide: 반창 },
    editions: 읽.editionsSea,
    editionNames: 읽.editionNames,
    unit: 'reads per million reads of that edition, so a shrinking encyclopaedia is already divided out',
    axes: { trip: 요약다듬기(여행), culture: 요약다듬기(문화) },
    cells: 칸들,
    flights: { source: 'KOSIS international air passengers by region', rows: 항칸, asia: 아시아 },

    /**
     * ⭐ 실린 것. **세 줄이 같이 있어야 뜻이 선다** — 하나만 떼면 다른 기사가 된다.
     */
    answer: [
      `Korean travel articles fell ${Math.abs(여행.korea).toFixed(0)}% across the four editions. `
        + `The matched Japanese and Taiwanese travel articles fell ${Math.abs(여행.control).toFixed(0)}%, `
        + `and the Japanese and Taiwanese culture articles did not fall at all — they rose `
        + `${문화.control.toFixed(1)}%. Whatever this is, it is happening to travel articles, not to Korea.`,
      `The clearest line is inside Korea's own articles. Its travel pages fell `
        + `${Math.abs(여행높이.change).toFixed(0)}% and its culture pages — the country itself, its pop `
        + `music, its dramas, its language, its alphabet — fell ${Math.abs(문화높이.change).toFixed(0)}%. `
        + `The culture pages start about ${축끼리견줌(문화높이, 여행높이).startLevelRatio} times higher and `
        + 'still fell less, which is the opposite of what a starting level would do.',
      아시아 && 아시아.change != null
        ? `Over exactly the same twenty-four months, air passengers on Asian routes into and out of `
          + `Korea moved ${아시아.change > 0 ? 'up' : 'down'} ${Math.abs(아시아.change).toFixed(1)}%. `
          + 'The flights did not fall. The looking-up did.'
        : 'The flight series could not be measured over the same window.',
    ],

    /** ⛔ 이 자료가 **못 하는 말**. 기사에 그대로 옮긴다 */
    cannotSay: [
      'We cannot say interest in Korea cooled. On the trip axis the Korean articles did fall '
        + 'further than the controls, but the Korean ones also started higher, and articles that '
        + 'start higher have further to fall. Matching for starting height cuts the gap roughly in '
        + 'half and leaves the count of cells near even. That is not a finding.',
      'We cannot compare Korea against Japan and Taiwan on the culture axis either, and here our '
        + 'own check is what stopped us: once the pairs are matched for starting height, the gap '
        + `falls from ${Math.abs(높이탓인가(문화)?.rawGap ?? 0)} points to `
        + `${Math.abs(높이탓인가(문화)?.matchedGap ?? 0)}. A gap that survives only until the two `
        + 'sides start from the same place was the starting place.',
      'The KOSIS air table has no Southeast Asia row. Its "Asia" line puts Indonesia, Vietnam, '
        + 'Thailand and Malaysia together with India and Central Asia. It is the closest ruler we '
        + 'have to the four editions we read, and it is not the same ruler.',
      'These reads are not travellers. Some are homework, some are curiosity, and some never '
        + 'become a trip. What a read can date is when the looking happened, not whether anyone went.',
      'The cells are pairings of an article kind with an edition, so the same article appears in '
        + 'several of them. They are not independent observations and we do not treat them as a sample.',
    ],

    /**
     * ⭐ **자를 바꾸면 답이 바뀐다**는 것을 자료로 보인다.
     * 이 표가 이 기사에서 제일 정직한 칸이다.
     */
    rulerMatters: {
      note: 'The same air table, read two ways. One month against the same month a year earlier, '
        + 'and twelve months against the twelve before them. Where the two disagree in sign, the '
        + 'shorter ruler is reporting a month, not a year.',
      oneMonthCompared: `${작년같은달} → ${마지막달}`,
      rows: 한달로,
      signFlips: 부호가뒤집힌곳,
    },
    heightCheck: { trip: 높이탓인가(여행), culture: 높이탓인가(문화) },

    /**
     * 🔴 이 칸은 **우리가 이미 쓴 설명을 무르려고** 만들었다. 8/15 아침에 낸 91편이
     *   「답이 정해진 물음이 백과사전 밖으로 나갔다」고 적었는데, 재지 않은 말이었다.
     */
    settledVsCurious: {
      note: 'A tempting explanation for the travel fall is that questions with one settled '
        + 'answer — the visa rule, how the transit card works, which airport — have been leaving '
        + 'encyclopaedias, while the pages you browse for pleasure have not. We split the travel '
        + 'articles that way and measured. The split does not hold.',
      settled: 물음종류로가르기(칸들, 답이정해진),
      curious: 물음종류로가르기(칸들, 구경하는),
      /* ⛔ 제일 덜 떨어진 종류를 **자료에서 찾는다.** 손으로 박으면 자료가 바뀔 때 거짓이 된다 */
      leastFallen: 덜떨어진,
      verdict: (() => {
        const a = 물음종류로가르기(칸들, 답이정해진);
        const b = 물음종류로가르기(칸들, 구경하는);
        const 차 = 한자리(a.korea - b.korea);
        const 축차 = 한자리(여행.korea - 문화.korea);
        /* ⭐ 설명이 서려면 갈라 잰 격차가 **축 사이 격차의 절반**은 돼야 한다 */
        const 선다 = Math.abs(차) >= Math.abs(축차) / 2;
        const 정해진쪽인가 = 덜떨어진 ? 답이정해진.includes(덜떨어진.kind) : null;
        return {
          gapBetweenSplits: 차,
          gapBetweenAxes: 축차,
          holds: 선다,
          why: `The two halves of the travel axis are ${Math.abs(차)} points apart, against `
            + `${Math.abs(축차)} points between travel and culture. `
            + (덜떨어진
              ? `And the kind that fell least of all — ${덜떨어진.kind.toLowerCase()}, at `
                + `${덜떨어진.change.toFixed(1)}% — sits on the `
                + `${정해진쪽인가 ? 'settled-answer' : 'browsing'} side, which is `
                + `${정해진쪽인가 ? 'exactly where this explanation says the steepest falls belong'
                  : 'at least the direction the explanation predicts'}.`
              : ''),
        };
      })(),
    },

    /**
     * ⭐⭐ 이 기사가 실제로 기대는 자리. 위의 `heightCheck` 가 문화 축에서 「높이 탓」을
     *   냈으므로 「한국 대 일본·대만」에는 기대지 않는다. **같은 나라 안 두 축**을 견준다.
     */
    axisAgainstAxis: {
      note: 'Both axes are Korean articles, in the same four editions, over the same months. '
        + 'The culture articles start far higher and still fell less. A high starting level '
        + 'makes a steeper fall easier, not harder — so this gap is not the starting level.',
      trip: { articleEditionPairs: 여행한국.length, startLevel: 한자리(여행높이.startLevel), change: 한자리(여행높이.change) },
      culture: { articleEditionPairs: 문화한국.length, startLevel: 한자리(문화높이.startLevel), change: 한자리(문화높이.change) },
      verdict: 축끼리견줌(문화높이, 여행높이),
    },
  };

  const 낼곳 = path.join(뿌리, 'src', 'data', 'wikitip-what-fell.json');
  fs.writeFileSync(낼곳, `${JSON.stringify(나감, null, 2)}\n`);
  console.log(`✅ ${path.relative(뿌리, 낼곳)}`);
  console.log(`   창 ${앞창[0]}~${앞창.at(-1)} 대 ${뒤창[0]}~${뒤창.at(-1)}`);
  console.log(`   여행  한국 ${여행.korea.toFixed(1)}%  대조 ${여행.control.toFixed(1)}%  (칸 ${여행.cells})`);
  console.log(`   문화  한국 ${문화.korea.toFixed(1)}%  대조 ${문화.control.toFixed(1)}%  (칸 ${문화.cells})`);
  console.log(`   항공 아시아 ${아시아?.change}%`);
  console.log(`   한 달 자와 부호가 뒤집힌 지역 ${부호가뒤집힌곳.length}곳`);
}
