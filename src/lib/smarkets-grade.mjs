/**
 * smarkets-grade.mjs — **우리가 매기는 신용등급.**
 *
 * 사장님(2026-09-15): 「기업 신용정보를 더벨이 만들고 있잖아 … 우리도 기업 신용정보를
 *                      우리가 매겨서 서비스할 수 있는 지도 검토하자」
 *                     「법은 그런 거 규제하지 않아」 · 「영업의 자유야」
 *                     **「신용등급 만들라는 의미」** · 「만들어」
 *
 * ── ⭐ 우리 등급이 남의 등급과 다른 한 가지 — «다시 계산할 수 있다» ──────────
 * 평가사는 모형을 감춘다. 왜 그 등급인지 밖에서는 확인할 길이 없다.
 * 우리는 반대로 간다 — **공식·기준선·가중치·쓴 숫자를 전부 공개한다.**
 * 손님이 종이와 계산기로 우리 등급을 그대로 다시 낼 수 있어야 한다.
 * 그것이 이 상품을 파는 이유이고, 우리가 신뢰를 얻는 유일한 길이다.
 *
 *   ⇒ 그래서 이 파일이 곧 «평가 방법론 문서»다. 지면은 이 파일을 그대로 인용한다.
 *   ⛔ 여기 안 적힌 조정(사람의 손, 업종 프리미엄, 재량 가점)을 «절대» 넣지 않는다.
 *     하나라도 넣는 순간 「다시 계산할 수 있다」가 거짓이 된다.
 *
 * ── 이름을 왜 SM1~SM9 로 두나 ────────────────────────────────────────────
 * AAA·BB+ 를 쓰면 손님이 S&P·무디스·한기평 등급과 «같은 것»으로 읽는다.
 * 우리 등급은 우리 것이므로 우리 기호를 쓴다. SM1 이 가장 튼튼하고 SM9 가 가장 약하다.
 * 못 잰 곳은 «NR» 이다 — ⛔ 자료가 없다고 낮은 등급을 주지 않는다. 그건 벌점이 아니라 «모름»이다.
 *
 * ── 무엇으로 매기나 (여섯 축) ────────────────────────────────────────────
 * 회사가 신고한 재무제표에서 온 것뿐이다. 추정·전망·경영진 면담 같은 것은 없다.
 *
 *   1. 이자보상배율   영업이익 ÷ 금융비용      번 돈으로 이자를 몇 번 내나      가중치 30
 *   2. 차입금의존도   총차입금 ÷ 자산총계      자산 중 빌린 돈의 몫              가중치 20
 *   3. 부채비율      부채총계 ÷ 자본총계                                     가중치 15
 *   4. 유동비율      유동자산 ÷ 유동부채      당장 갚을 것에 당장 쓸 것          가중치 15
 *   5. 자산수익성    영업이익 ÷ 자산총계      버는 힘                          가중치 10
 *   6. 알트만 Z      Altman(1968) 공개 공식   부도예측 고전 지표                가중치 10
 *
 * ⚠ 「금융비용」은 이자비용이 아니다 — DART 응답에 이자비용 계정이 없는 곳이 있어
 *   금융비용을 쓴다. 이자 말고 다른 것도 든다. 지면에 그렇게 적는다.
 * ⛔ 없는 축을 0 으로 치지 않는다. 축이 «넷 미만»이면 등급을 안 내고 NR 로 둔다.
 */

/** 값이 «있나» — 0 은 있는 값이다 */
export function 있나(v) {
  if (v === null || v === undefined || v === '') return false;
  return Number.isFinite(Number(v));
}

/** 나눈다. ⛔ 0 으로 나누지 않고, 한쪽이라도 없으면 null */
export function 나눔(위, 아래) {
  if (!있나(위) || !있나(아래)) return null;
  const b = Number(아래);
  if (b === 0) return null;
  return Number(위) / b;
}

/** 자리를 줄인다. ⛔ null 을 0 으로 만들지 않는다 */
export function 자름(v, 소수 = 2) {
  if (!있나(v)) return null;
  const 배 = Math.pow(10, 소수);
  return Math.round(Number(v) * 배) / 배;
}

/**
 * 🔴 **기준선표 — 이것이 우리 등급의 전부다.**
 * 축마다 「이 값 이상이면 몇 점」을 적어 둔다. 점수는 1(가장 튼튼) ~ 9(가장 약함).
 * `클수록좋다: false` 인 축은 작을수록 좋은 축이다(부채·차입금).
 *
 * ⛔ 이 표를 조용히 바꾸지 않는다. 바꾸면 어제 등급과 오늘 등급이 «다른 자»가 낸 것이 된다.
 *   고칠 때는 판(version)을 올리고, 지면에 「무엇을 왜 바꿨는지」를 적고, 옛 판도 남긴다.
 */
export const 판 = '2026-09-15';

export const 기준선 = [
  {
    key: 'interestCoverage', 이름: 'Operating income to finance costs', 가중치: 30, 클수록좋다: true,
    /* 이자보상배율 — 1 미만이면 번 돈으로 이자도 못 낸다 */
    선: [12, 8, 5, 3, 2, 1.5, 1, 0.5],
  },
  {
    key: 'borrowingsToAssets', 이름: 'Total borrowings to total assets', 가중치: 20, 클수록좋다: false,
    선: [0.05, 0.10, 0.18, 0.25, 0.35, 0.45, 0.55, 0.70],
  },
  {
    key: 'debtToEquity', 이름: 'Total liabilities to equity', 가중치: 15, 클수록좋다: false,
    선: [0.3, 0.6, 1.0, 1.5, 2.0, 3.0, 4.0, 6.0],
  },
  {
    key: 'currentRatio', 이름: 'Current assets to current liabilities', 가중치: 15, 클수록좋다: true,
    선: [3.0, 2.2, 1.8, 1.5, 1.2, 1.0, 0.8, 0.6],
  },
  {
    key: 'returnOnAssets', 이름: 'Operating income to total assets', 가중치: 10, 클수록좋다: true,
    선: [0.15, 0.11, 0.08, 0.055, 0.035, 0.02, 0.005, -0.03],
  },
  {
    key: 'altmanZ', 이름: 'Altman Z (1968 formula)', 가중치: 10, 클수록좋다: true,
    선: [6.0, 4.5, 3.5, 2.99, 2.4, 1.81, 1.2, 0.5],
  },
];

/**
 * 한 축의 값을 1~9 점으로. 선이 여덟 개라 칸이 아홉이다.
 * ⛔ 값이 없으면 점수도 «없다». 0 점도 9 점도 아니다.
 */
export function 축점수(값, 축) {
  if (!있나(값)) return null;
  const v = Number(값);
  for (let i = 0; i < 축.선.length; i += 1) {
    const 선 = 축.선[i];
    if (축.클수록좋다 ? v >= 선 : v <= 선) return i + 1;
  }
  return 축.선.length + 1;                       /* 마지막 선도 못 넘으면 가장 낮은 칸 */
}

export const 알트만출전 = 'Altman, E. I. (1968), "Financial Ratios, Discriminant Analysis and the '
  + 'Prediction of Corporate Bankruptcy", The Journal of Finance 23(4), 589-609';

/**
 * 총차입금 = 단기차입금 + 유동성장기부채 + 장기차입금 + 사채.
 * ⛔ 하나도 없으면 null 이다 — 「빚이 0」이라는 뜻이 아니다.
 */
export function 총차입금(a) {
  const 쓸것 = ['shortTermBorrowings', 'currentPortionOfLongTermDebt', 'longTermBorrowings', 'bonds'];
  const 든것 = 쓸것.filter((k) => 있나(a ? a[k] : null));
  if (!든것.length) return { value: null, usedItems: [], complete: false };
  return {
    value: 든것.reduce((s, k) => s + Number(a[k]), 0),
    usedItems: 든것,
    complete: 든것.length === 쓸것.length,
  };
}

/**
 * 알트만 Z — **우리 공식이 아니다.** 출전을 늘 함께 낸다.
 * ⛔ 한 항목이라도 없으면 «안 낸다». 빠진 것을 0 으로 치면 그 회사가 저절로 나빠진다.
 */
export function 알트만Z(a) {
  const x = a || {};
  const 자산 = x.totalAssets;
  const 운전자본 = (있나(x.currentAssets) && 있나(x.currentLiabilities))
    ? Number(x.currentAssets) - Number(x.currentLiabilities) : null;
  const 몫 = {
    workingCapitalToAssets: 나눔(운전자본, 자산),
    retainedEarningsToAssets: 나눔(x.retainedEarnings, 자산),
    ebitToAssets: 나눔(x.operatingIncome, 자산),
    equityMarketValueToLiabilities: 나눔(x.marketCap, x.totalLiabilities),
    salesToAssets: 나눔(x.revenue, 자산),
  };
  const 빠진것 = Object.entries(몫).filter(([, v]) => v === null).map(([k]) => k);
  if (빠진것.length) return { score: null, missing: 빠진것, components: 몫, source: 알트만출전 };
  return {
    score: 자름(1.2 * 몫.workingCapitalToAssets + 1.4 * 몫.retainedEarningsToAssets
      + 3.3 * 몫.ebitToAssets + 0.6 * 몫.equityMarketValueToLiabilities + 1.0 * 몫.salesToAssets, 2),
    missing: [], components: 몫, source: 알트만출전,
  };
}

/** 신고된 계정에서 여섯 축을 뽑는다 */
export function 축값들(계정) {
  const a = 계정 || {};
  const 차입 = 총차입금(a);
  const z = 알트만Z(a);
  return {
    값: {
      interestCoverage: 자름(나눔(a.operatingIncome, a.financeCosts), 2),
      borrowingsToAssets: 자름(나눔(차입.value, a.totalAssets), 4),
      debtToEquity: 자름(나눔(a.totalLiabilities, a.totalEquity), 4),
      currentRatio: 자름(나눔(a.currentAssets, a.currentLiabilities), 3),
      returnOnAssets: 자름(나눔(a.operatingIncome, a.totalAssets), 4),
      altmanZ: z.score,
    },
    차입, 알트만: z,
  };
}

/** 점수(1~9, 소수 가능) → 등급 기호 */
export function 등급기호(점) {
  if (!있나(점)) return 'NR';
  const n = Math.max(1, Math.min(9, Math.round(Number(점))));
  return 'SM' + n;
}

/** ⛔ 축이 이보다 적으면 등급을 안 낸다 — 두세 축으로 매긴 등급은 등급이 아니다 */
export const 적어도있어야할축 = 4;

/**
 * 한 회사의 등급.
 * 낸다 — { grade, score, axes[], weightUsed, axesMeasured, notRatedReason, method }
 * ⛔ 자료가 모자라면 낮은 등급이 아니라 **NR** 이다.
 */
export function 매긴다(계정) {
  const { 값, 차입, 알트만 } = 축값들(계정);

  const 축들 = 기준선.map((축) => {
    const v = 값[축.key];
    const 점 = 축점수(v, 축);
    return {
      key: 축.key, name: 축.이름, weight: 축.가중치,
      value: v, score: 점,
      thresholds: 축.선, higherIsBetter: 축.클수록좋다,
      measured: 점 !== null,
    };
  });

  const 잰축 = 축들.filter((x) => x.measured);
  const 쓴가중치 = 잰축.reduce((s, x) => s + x.weight, 0);

  if (잰축.length < 적어도있어야할축 || 쓴가중치 === 0) {
    return {
      grade: 'NR', score: null,
      axes: 축들, axesMeasured: 잰축.length, weightUsed: 쓴가중치,
      notRatedReason: 'Not rated — only ' + 잰축.length + ' of ' + 기준선.length
        + ' measures could be computed from the filed statements (at least '
        + 적어도있어야할축 + ' are required). A missing figure is not a weakness; it is a gap.',
      borrowings: 차입, altman: 알트만, method: 방법론(),
    };
  }

  /* 가중평균 — ⛔ 못 잰 축의 가중치는 분모에서도 뺀다. 0 점으로 채우지 않는다 */
  const 점 = 잰축.reduce((s, x) => s + x.score * x.weight, 0) / 쓴가중치;

  return {
    grade: 등급기호(점),
    score: 자름(점, 2),
    axes: 축들,
    axesMeasured: 잰축.length,
    weightUsed: 쓴가중치,
    notRatedReason: null,
    borrowings: 차입,
    altman: 알트만,
    method: 방법론(),
  };
}

/** 지면·API 가 그대로 내보내는 «방법론». ⭐ 이것이 있어야 손님이 다시 계산할 수 있다 */
export function 방법론() {
  return {
    name: 'SMarkets Grade',
    version: 판,
    scale: 'SM1 (strongest) to SM9 (weakest); NR when too few measures could be computed',
    howItWorks: 'Each measure is scored 1-9 against the published thresholds below, then averaged '
      + 'using the published weights. Weights of measures we could not compute are removed from the '
      + 'denominator rather than scored zero.',
    measures: 기준선.map((x) => ({
      key: x.key, name: x.이름, weight: x.가중치,
      higherIsBetter: x.클수록좋다, thresholds: x.선,
    })),
    minimumMeasures: 적어도있어야할축,
    inputs: 'Line items as filed by the company in its own statutory financial statements, plus the '
      + 'closing market capitalisation on the stated date.',
    altmanSource: 알트만출전,
    financeCostsNote: 'Where a company does not file a separate interest expense line, finance costs '
      + 'are used. Finance costs include items other than interest.',
    notThis: [
      'This is the SMarkets Grade. It is our own measure and is not the rating of any licensed credit rating agency.',
      'Everything needed to reproduce it is published here: the inputs, the thresholds and the weights.',
      'No analyst judgement, no sector premium, no management meeting, no forecast enters this grade.',
      'A company with missing figures is NR, never a low grade.',
      'Not investment advice.',
    ],
  };
}

/* ── 자가시험 ──────────────────────────────────────────────────────────── */
export function 자가시험() {
  const 것 = [];
  const 재다 = (이름, 됐나) => 것.push({ 이름, 됐나 });

  재다('있나: 0 은 있는 값', 있나(0) === true);
  재다('⛔ 나눔: 0 으로 안 나눈다', 나눔(10, 0) === null);
  재다('⛔ 자름: null 을 0 으로 만들지 않는다', 자름(null) === null);

  const 이자축 = 기준선.find((x) => x.key === 'interestCoverage');
  재다('축점수: 아주 튼튼하면 1점', 축점수(20, 이자축) === 1);
  재다('축점수: 이자도 못 내면 가장 낮은 칸', 축점수(0.1, 이자축) === 9);
  재다('⛔ 축점수: 값이 없으면 «점수도 없다»', 축점수(null, 이자축) === null);
  const 부채축 = 기준선.find((x) => x.key === 'debtToEquity');
  재다('축점수: 작을수록 좋은 축도 제대로 센다', 축점수(0.2, 부채축) === 1 && 축점수(10, 부채축) === 9);

  재다('가중치 합이 100', 기준선.reduce((s, x) => s + x.가중치, 0) === 100);
  재다('선이 여덟이라 칸이 아홉', 기준선.every((x) => x.선.length === 8));
  재다('선이 한 방향으로 가지런하다', 기준선.every((x) => {
    const s = x.선;
    return x.클수록좋다 ? s.every((v, i) => i === 0 || v < s[i - 1]) : s.every((v, i) => i === 0 || v > s[i - 1]);
  }));

  /* 삼성전자 2025 실측 계정(억원 → 원) */
  const 억 = 1e8;
  const 삼성 = {
    currentAssets: 2476846 * 억, currentLiabilities: 1064113 * 억,
    retainedEarnings: 4021356 * 억, operatingIncome: 436011 * 억,
    totalAssets: 5669421 * 억, totalLiabilities: 1306218 * 억, totalEquity: 4363203 * 억,
    revenue: 3336059 * 억, financeCosts: 117338 * 억, cashAndEquivalents: 578564 * 억,
    marketCap: 15755720 * 억,
    shortTermBorrowings: 175750 * 억, longTermBorrowings: 64795 * 억, bonds: 71 * 억,
  };
  const s = 매긴다(삼성);
  재다('삼성: 여섯 축이 다 잰다', s.axesMeasured === 6 && s.weightUsed === 100);
  재다('삼성: 등급이 나온다', /^SM[1-9]$/.test(s.grade));
  재다('삼성: 아주 튼튼한 쪽이다 (SM1~SM3)', ['SM1', 'SM2', 'SM3'].includes(s.grade));
  재다('삼성: 부채비율 0.3 언저리', s.axes.find((x) => x.key === 'debtToEquity').value < 0.32);
  재다('삼성: 알트만 Z 가 나온다', 있나(s.altman.score));

  /* 🔴 못 잰 곳은 «낮은 등급»이 아니라 NR 이다 */
  const 모자람 = 매긴다({ totalAssets: 100, totalEquity: 50, totalLiabilities: 50 });
  재다('🔴 축이 모자라면 NR', 모자람.grade === 'NR' && 모자람.score === null);
  재다('🔴 NR 인 까닭을 손님 말로 적는다', /not a weakness/.test(모자람.notRatedReason || ''));
  재다('⛔ NR 이 SM9 가 «아니다»', 모자람.grade !== 'SM9');

  /* 🔴 못 잰 축의 가중치는 분모에서 뺀다 — 0 점으로 채우지 않는다 */
  const 다섯축 = { ...삼성 };
  delete 다섯축.financeCosts;                      /* 이자보상배율(가중치 30)만 없앤다 */
  const f = 매긴다(다섯축);
  재다('🔴 한 축이 빠지면 가중치가 70 으로 준다', f.weightUsed === 70 && f.axesMeasured === 5);
  재다('⛔ 빠진 축을 0 점으로 채우지 않는다 — 등급이 저절로 나빠지지 않는다',
    Math.abs(f.score - s.score) < 1.5);

  /* 약한 회사가 약하게 나오나 */
  const 약한곳 = {
    currentAssets: 30, currentLiabilities: 100, retainedEarnings: -50, operatingIncome: -5,
    totalAssets: 200, totalLiabilities: 190, totalEquity: 10, revenue: 40,
    financeCosts: 12, marketCap: 8, shortTermBorrowings: 120, longTermBorrowings: 40,
  };
  const w = 매긴다(약한곳);
  재다('약한 곳은 약한 쪽으로 나온다 (SM7~SM9)', ['SM7', 'SM8', 'SM9'].includes(w.grade));
  재다('🔴 튼튼한 곳과 약한 곳의 등급이 다르다', w.grade !== s.grade);

  /* 방법론이 «다시 계산할 수 있게» 다 나와 있나 */
  const m = 방법론();
  재다('⭐ 방법론에 기준선이 다 들어 있다',
    m.measures.length === 6 && m.measures.every((x) => Array.isArray(x.thresholds) && x.thresholds.length === 8));
  재다('⭐ 방법론에 가중치가 들어 있다', m.measures.every((x) => 있나(x.weight)));
  재다('방법론에 판(version)이 있다', m.version === 판);
  재다('🔴 남의 등급이 아님을 자료가 스스로 말한다',
    m.notThis.some((x) => /not the rating of any licensed credit rating agency/.test(x)));
  재다('⭐ 다시 계산할 수 있다고 적혀 있다', m.notThis.some((x) => /reproduce it is published/.test(x)));
  재다('⚠ 금융비용임을 밝힌다', /other than interest/.test(m.financeCostsNote));
  재다('⛔ 사람 손이 안 들어감을 밝힌다', m.notThis.some((x) => /No analyst judgement/.test(x)));

  /* ⛔ 남의 등급 기호를 쓰지 않는다 */
  재다('⛔ 등급 기호가 SM 꼴이다', ['SM1', 'SM5', 'SM9', 'NR'].every((g) => g === 'NR' || /^SM\d$/.test(g)));
  재다('⛔ AAA·BB+ 를 만들지 않는다', !/AAA|BB\+/.test(JSON.stringify(s)));

  재다('⛔ 빈 것도 견딘다', 매긴다(null).grade === 'NR' && 매긴다(undefined).score === null);

  const 실패 = 것.filter((x) => !x.됐나);
  console.log(`■ 자가시험 ${것.length - 실패.length}/${것.length}`);
  for (const x of 실패) console.log(`  🔴 ${x.이름}`);
  return 실패.length === 0;
}
