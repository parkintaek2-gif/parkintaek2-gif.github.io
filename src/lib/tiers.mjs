/**
 * 이용 등급과 한도 — **RapidAPI 유료화를 위한 최소 장치.**
 *
 * ── 왜 필요한가 ─────────────────────────────────────────────────
 * 사장님 결정(2026-08-03 KST): 「RapidAPI 유료화/등록 해」
 *
 * 그런데 지금 구조로는 **아무도 돈을 낼 이유가 없다.**
 *   ① seoulmarkets.com/v1 이 무제한 무료로 열려 있다
 *   ② RapidAPI 에 올려도 구매자는 우리 도메인을 직접 부르면 그만이다
 *
 * 마켓플레이스는 **자기를 거친 요청에만 헤더를 하나 붙여 준다.**
 * 그 헤더를 확인하는 것이 유료화의 전부다. 확인하지 않으면 리스팅은 장식이다.
 *
 * ── 무엇을 팔고 무엇을 계속 무료로 두는가 ───────────────────────
 * **분류 사전(HS·국가·기관)은 영원히 무료다.** `/api` 페이지에 그렇게 적어 뒀고,
 * 말을 바꾸면 그것이 첫 번째 신뢰 훼손이 된다.
 *
 * 파는 것은 **양(量)**이다. 리서치 66,093건을 통째로 가져가려면
 * 무료 한도(1회 200건)로는 331번을 불러야 한다. 그 지점이 값을 매길 자리다.
 *
 *   무료      1회 200건 · 분당 60회      개발자가 붙여 보고 판단하기에 충분하다
 *   유료      1회 1,000건 · IP 제한 없음  분당 한도는 RapidAPI 가 요금제로 건다
 *
 * ── ⚠ 시행일을 뒤로 둔 이유 ─────────────────────────────────────
 * 오늘 `/api` 페이지에 이렇게 써서 내보냈다.
 *
 *   "When rate limits arrive they will be published before they are enforced,
 *    and existing integrations will not break on the day they land."
 *
 * **같은 날 공지하고 같은 날 조이면 그 문장이 거짓이 된다.**
 * 그래서 오늘은 공지만 하고 시행은 2주 뒤다. 응답 헤더로 미리 알려 준다.
 * 이 날짜를 앞당기지 말 것 — 앞당기는 순간 우리가 한 말이 지켜지지 않은 게 된다.
 */

/** 한도 시행 개시일 (KST). 이날 00:00 부터 429 를 돌려준다. */
export const ENFORCE_FROM = '2026-08-17';

export const LIMITS = {
  free: {
    /** 1회 응답 최대 레코드 */
    maxPageSize: 200,
    /** IP 당 분당 요청 수 */
    perMinute: 60,
  },
  pro: {
    maxPageSize: 1000,
    /** RapidAPI 요금제가 분당·월간 쿼터를 건다. 우리 쪽에서 또 조이면 이중 제한이 된다 */
    perMinute: null,
  },
};

/**
 * 이 요청이 어느 등급인가.
 *
 * RapidAPI 는 자기를 거친 요청에만 `X-RapidAPI-Proxy-Secret` 을 붙인다.
 * **이 값은 저장소에 두지 않는다** — 공개 저장소다. 환경변수로만 받는다.
 *
 * ⚠ 비밀값이 설정돼 있지 않으면 **아무도 pro 가 되지 않는다.**
 *   반대로 하면(설정 안 됐을 때 전부 통과) 유료화가 그냥 뚫린다.
 *   기본값은 언제나 **닫힘**이어야 한다.
 */
export function tierOf(headers) {
  const 비밀 = process.env.RAPIDAPI_PROXY_SECRET;
  if (!비밀) return 'free';
  const 받은값 = headers?.['x-rapidapi-proxy-secret'] ?? headers?.['X-RapidAPI-Proxy-Secret'];
  return 받은값 && 받은값 === 비밀 ? 'pro' : 'free';
}

/* ── 분당 한도 ───────────────────────────────────────────────────
   ⚠ Cloudtype 메모리가 0.25GB 다. 무한히 자라는 Map 을 두면 그것으로 죽는다.
     그래서 **분이 바뀌면 통째로 버린다.** 정확한 슬라이딩 윈도가 아니라
     고정 창(fixed window)이고, 그 사실을 문서에 그대로 적는다.
     정밀도보다 **죽지 않는 것**이 먼저다.
   ⚠ 인스턴스가 하나라서 이 방식이 성립한다. 여러 대가 되면 공유 저장소가 필요하다.
     그때 이 주석을 보고 고칠 것. ────────────────────────────── */

let 창 = '';
let 계수 = new Map();
/** 한 창에 담을 최대 IP 수. 넘으면 더 세지 않는다(막지도 않는다) — 메모리가 먼저다. */
const MAX_KEYS = 20000;

/** KST 기준 분 단위 창 이름. toISOString 은 UTC 라 안 쓴다. */
function 지금창(now = new Date()) {
  return now.toLocaleString('sv-SE').slice(0, 16); // "2026-08-03 13:45"
}

/**
 * 요청 하나를 센다. `{ allowed, remaining, limit, retryAfter }`.
 *
 * `ENFORCE_FROM` 이전에는 **세기만 하고 막지 않는다.** 그래야 공지 기간에
 * 이용자가 자기 사용량을 헤더로 미리 확인하고 대비할 수 있다.
 */
export function rateCheck(ip, tier, now = new Date()) {
  const limit = LIMITS[tier]?.perMinute ?? null;
  const 시행중 = 오늘(now) >= ENFORCE_FROM;
  if (limit === null) return { allowed: true, remaining: null, limit: null, enforced: 시행중 };

  const c = 지금창(now);
  if (c !== 창) {
    창 = c;
    계수 = new Map(); // 창이 바뀌면 통째로 버린다
  }
  const key = ip || 'unknown';
  const n = (계수.get(key) ?? 0) + 1;
  if (계수.size < MAX_KEYS || 계수.has(key)) 계수.set(key, n);

  const 남음 = Math.max(0, limit - n);
  return {
    allowed: !시행중 || n <= limit,
    remaining: 남음,
    limit,
    enforced: 시행중,
    /** 고정 창이라 다음 분까지 기다리면 풀린다 */
    retryAfter: 60 - now.getSeconds(),
  };
}

/** KST 날짜. **이 PC 도 서버도 KST 다. toISOString 을 쓰면 새벽에 하루가 어긋난다.** */
function 오늘(now) {
  return now.toLocaleString('sv-SE').slice(0, 10);
}

/** `/v1/meta` 와 `/api` 페이지가 함께 읽는다. 두 곳이 어긋나지 않게 여기 하나만 둔다. */
export const TIER_NOTE = {
  free: `${LIMITS.free.maxPageSize} records per request, ${LIMITS.free.perMinute} requests per minute per IP.`,
  pro: `${LIMITS.pro.maxPageSize} records per request. Quotas are set by your marketplace plan.`,
  enforced_from: ENFORCE_FROM,
  policy:
    'Limits are published before they are enforced. Until the date above, requests over the limit are counted and reported in the response headers but never rejected, so you can size your integration before anything breaks.',
};
