/**
 * KDI Open API 클라이언트.
 *
 * 신청 완료 2026-08-03 20:05 KST — 「등록 되었습니다」 확인.
 * **인증키는 승인 뒤 메일로 온다.** 오면 `KDI_API_KEY` 에 넣기만 하면 이 파일이 돈다.
 *
 * ── 왜 KDI 인가 ────────────────────────────────────────────────
 * 우리가 가진 가격·수급 데이터는 라이선스상 전부 T+1 이다.
 * KDI 가 주는 것은 **해석**이다 — 경기 진단, 성장률 전망. **해석에는 T+1 이 없다.**
 *
 * 그리고 결정적인 것: **KDI 가 영문 요약을 직접 준다.**
 * `PUB_NM_ENG`(영문 제목) · `SUMM_ENG`(영문 요약)가 응답에 들어 있다.
 * 영문 매체가 한국 기관 자료를 다룰 때 가장 큰 비용이 번역인데, 그게 없다.
 *
 * ── ⚠ 무엇을 하고 무엇을 안 하나 ──────────────────────────────
 * 신청서에 이렇게 적어 냈다. **그 약속을 코드로 지킨다.**
 *
 *   「보고서 원문(PDF)이나 본문 전문은 수집·전재·재배포하지 않으며,
 *    기사에는 KDI 를 출처로 명시하고 원문 페이지 링크를 함께 표기합니다」
 *
 *   받는다   서지정보 — 제목(국·영문) · 저자 · 발행일 · 요약 · 키워드 · 연구분야 · 원문 링크
 *   안 받는다 ✗ PDF 원문   ✗ 보고서 본문
 *
 * ⚠ `SUMM_ENG`(영문 요약)는 **받되 그대로 싣지 않는다.** 그건 KDI 의 표현이다.
 *   기사에는 숫자·판정 같은 **사실**을 우리 문장으로 다시 쓰고, 원문 링크를 건다.
 *   요약문은 우리가 읽고 이해하는 데 쓰는 것이지 옮겨 붙이는 것이 아니다.
 */

const BASE = 'https://www.kdi.re.kr/KDIOpenAPI';
const UA = 'Mozilla/5.0 (compatible; SeoulMarketsBot/0.1; +https://seoulmarkets.com/about)';

/** 구분 코드. 신청서에 적은 것은 A(기본연구보고서)다 — 나머지는 승인 범위를 보고 켠다. */
export const KDI_CODES = {
  A: { ko: '기본연구보고서', en: 'Research Monographs', 주기: '수시' },
  B: { ko: '현안자료', en: 'Policy Studies', 주기: '수시' },
  C: { ko: 'KDI 경제전망', en: 'Economic Outlook', 주기: '연 2회 (5·11월)' },
  D: { ko: 'KDI 경제동향', en: 'Economic Trends', 주기: '매월 초순' },
  E: { ko: '학술지 (JEP)', en: 'Journal of Economic Policy', 주기: '분기' },
  F: { ko: '영상보고서', en: 'Video Reports', 주기: '수시' },
};

/** 키가 있는가. **없다고 던지지 않는다** — 승인 전까지는 없는 게 정상이다. */
export function kdiReady() {
  return Boolean(process.env.KDI_API_KEY);
}

/**
 * 한 구분을 통째로 받는다.
 *
 * ⚠ 이 API 에는 페이지 파라미터가 없다. `TOTAL_COUNT` 와 `ARCHIVE` 배열이 한 번에 온다.
 *   그래서 **자주 부를 이유가 없다.** 하루 한 번이면 충분하고, 그 이상은 남의 서버 낭비다.
 *
 * @param {'A'|'B'|'C'|'D'|'E'|'F'} cd
 * @param {{srhKey?:'ALL'|'TITLE'|'NAME'|'CONTENT', srhValue?:string}} [opt]
 */
export async function fetchKdi(cd, opt = {}) {
  const key = process.env.KDI_API_KEY;
  if (!key) throw new Error('KDI_API_KEY 가 없다. 승인 메일의 인증키를 넣어야 한다.');
  if (!KDI_CODES[cd]) throw new Error(`모르는 구분 코드: ${cd}`);

  const u = new URL(BASE);
  u.searchParams.set('type', 'json');
  u.searchParams.set('apiKey', key);
  u.searchParams.set('cd', cd);
  if (opt.srhKey) u.searchParams.set('srhKey', opt.srhKey);
  if (opt.srhValue) u.searchParams.set('srhValue', opt.srhValue);

  const res = await fetch(u, {
    headers: { 'user-agent': UA, accept: 'application/json' },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const text = await res.text();
  /*
   * ⚠ 키가 틀리면 본문이 `null` 로 온다. 200 이다.
   *   실측했다(2026-08-03, 키 없이 호출). **상태코드만 보면 성공으로 오해한다.**
   */
  if (!text || text.trim() === 'null') {
    throw new Error('응답이 null 이다 — 인증키가 없거나 승인되지 않았다.');
  }

  let j;
  try {
    j = JSON.parse(text);
  } catch {
    throw new Error(`JSON 이 아니다: ${text.slice(0, 120)}`);
  }

  const 목록 = Array.isArray(j.ARCHIVE) ? j.ARCHIVE : j.ARCHIVE ? [j.ARCHIVE] : [];
  return { total: Number(j.TOTAL_COUNT ?? 목록.length), items: 목록.map((r) => 정규화(r, cd)) };
}

/**
 * 응답을 우리 어휘로 편다.
 *
 * ⚠ **빈 문자열을 값으로 남기지 않는다.** KDI 는 없는 필드를 `''` 로 준다.
 *   그대로 두면 「영문 제목이 있다」고 세어져 커버리지가 부풀고, 화면에 빈칸이 뜬다.
 *   없으면 `null` 이다.
 */
function 정규화(r, cd) {
  const v = (x) => {
    const s = typeof x === 'string' ? x.trim() : x;
    return s === '' || s === undefined ? null : s;
  };
  const 저자 = [v(r.MAIN_AUT_NM), v(r.SUB_AUT_NM), v(r.CO_AUT_NM)].filter(Boolean);

  return {
    source: 'KDI',
    cd,
    category: KDI_CODES[cd].en,
    categoryKo: KDI_CODES[cd].ko,
    date: 날짜정규화(v(r.ISSU_DT)),
    titleKo: v(r.PUB_NM_KORN),
    /** ⭐ KDI 가 직접 쓴 영문 제목. 우리가 번역하지 않는다 */
    titleEn: v(r.PUB_NM_ENG),
    authors: 저자,
    /** 읽고 이해하는 용도다. **그대로 싣지 않는다** — KDI 의 표현이다 */
    summaryKo: v(r.SUMM_KORN),
    summaryEn: v(r.SUMM_ENG),
    keywords: v(r.PUB_KEYWORD),
    topics: v(r.TOPIC_ARR),
    /** 언어 K=국문 E=영문 A=둘 다 */
    lang: v(r.PUB_LANG),
    publisher: v(r.ISSU_OFFICE_ENG) ?? v(r.ISSU_OFFICE_KORN),
    /** 출처 표기에 그대로 쓴다. 신청서에 「원문 링크를 함께 표기」라고 적어 냈다 */
    url: v(r.DETAIL_PAGE),
    /* ✗ PDF·본문은 애초에 응답에 없고, 있어도 받지 않는다 */
  };
}

/** `20260710` · `2026-07-10` · `2026.07.10` 이 섞여 온다. 하나로 편다. */
function 날짜정규화(s) {
  if (!s) return null;
  const t = String(s).trim();
  let m = t.match(/^(20\d\d)[-./]?(\d{2})[-./]?(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = t.match(/^(20\d\d)[-./]?(\d{2})$/);
  if (m) return `${m[1]}-${m[2]}`;      // 월까지만 있는 것도 있다. 지어내서 01일로 만들지 않는다
  return t;
}
