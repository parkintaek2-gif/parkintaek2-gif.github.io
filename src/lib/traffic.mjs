/**
 * 유입 측정 — **집계만 남긴다. 쿠키도 IP 도 안 쓴다.**
 *
 * ── 왜 만드나 ────────────────────────────────────────────────────
 * 2026-08-05 「우리가 일하는 법」 최종본의 결론이 이것이었다.
 *
 *   *「우리는 유입 수치를 한 번도 안 봤다. 어느 기사가 무엇을 데려오는지 모른다.
 *     **모르면 자원을 어디에 몰지 못 정한다.**」*
 *
 * 실제로 확인해 보니 **측정이 하나도 없었다.** 기사를 14편 냈는데 무엇이 읽히는지
 * 아무도 모르는 상태다. 그래서 제일 먼저 이걸 넣는다.
 *
 * ── 무엇을 남기고 무엇을 안 남기나 ───────────────────────────────
 * ```
 * 남긴다   호스트 · 경로 · 날짜 · 시각(시간 단위) · **유입 도메인** · 봇 여부
 * 안 남긴다 **IP · 쿠키 · 세션 · User-Agent 원문 · 전체 리퍼러 URL**
 * ```
 * 개인을 식별할 값을 아예 안 만든다. 뉴스레터에서 IP 를 안 남기기로 한 것과 같은 기준이다.
 * 「나중에 필요할지 모르니 일단 남긴다」를 하지 않는다 — 남기면 지켜야 할 것이 생긴다.
 *
 * ── ⚠ 이건 **운영 서버 안에서 돈다.** 절대 지켜야 할 셋 ──────────
 * ```
 * ① **던지지 않는다.**  측정 하나 때문에 세 사이트가 죽으면 안 된다. 전부 try/catch
 * ② **기다리지 않는다.** 요청 경로에서 await 하지 않는다. 메모리에 세고 나중에 flush
 * ③ **무한히 안 는다.**  서로 다른 경로 수에 상한을 둔다 (스캐너가 임의 URL 을 때린다)
 * ```
 *
 * ── 저장 ─────────────────────────────────────────────────────────
 * 컨테이너 디스크는 재배포마다 사라진다. 그래서 **R2 로 flush** 한다(`store.mjs`).
 * R2 가 설정 안 돼 있으면 메모리에만 있다 — 그때도 `/admin` 으로 볼 수는 있다.
 */

import { put, get, remoteEnabled } from './store.mjs';

/**
 * 하루치가 모이는 **예측 가능한 키**. `raw/traffic/20260805.json`
 *
 * ⚠ 왜 파일을 매번 새로 안 만들고 한 키에 합치나 —
 *   `store.mjs` 에 목록 조회(list)가 없다. 만들려면 SigV4 의 쿼리 서명을 건드려야 하는데,
 *   **이건 운영 서버 코드다.** 읽는 쪽 편하자고 서명 로직을 손댈 이유가 없다.
 *   키를 하나로 정해 두면 목록 조회가 아예 필요 없다.
 */
export const 일별키 = (날) => `raw/traffic/${날}.json`;

/** 서로 다른 경로 상한. 넘으면 새 경로는 `기타` 로 합친다 */
const 경로상한 = 3000;
/** flush 간격 */
const FLUSH_MS = 10 * 60 * 1000;

/** `호스트\t경로\t유입\t봇` → 수 */
let 통 = new Map();
let 시작 = Date.now();
let 마지막flush = Date.now();
let flush중 = false;

/** ⚠ 봇 판별은 **참고용**이다. 정확할 수 없다 — 그래서 거르지 않고 **따로 센다.** */
const 봇패턴 = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|headless|curl|wget|python-requests|node-fetch|axios|go-http|monitor|uptime|pingdom/i;

/**
 * ⚠ **스캐너는 브라우저 UA 를 흉내 낸다.** UA 만 보면 사람으로 세어진다.
 *
 * 2026-08-05 첫 측정에서 실제로 그랬다 — 「사람 64」 중 상당수가 이것들이었다.
 * ```
 * /wp-admin/install.php · /phpinfo.php · /.env/.env.bak · /.aws/credentials
 * /test.php · /_profiler/phpinfo · /index.php
 * ```
 * (전부 404 다. 우리 사이트에 그런 파일이 없다 — 확인했다)
 *
 * **누가 뭐라고 주장하든 `/.aws/credentials` 를 요청하는 건 사람이 아니다.**
 * 그래서 **UA 가 아니라 「무엇을 요청했는가」로** 가른다. 이쪽이 속이기 어렵다.
 *
 * ⚠ 이걸 안 고치면 「검색 유입 0%」 같은 숫자를 **부풀려진 분모**로 말하게 된다.
 *   우리는 「모든 비율에 분모를 적는다」고 써 놓은 회사다.
 */
/** ⚠ 보고 스크립트가 **읽을 때 다시 판정**하려고 내보낸다.
 *  판별을 고치면 이미 쌓인 것도 같이 고쳐져야 어제와 오늘을 비교할 수 있다. */
export const 스캐너인가 = (경로) => 스캐너경로.test(String(경로 ?? ''));

/**
 * 봇의 **종류**만 남긴다. UA 원문은 안 남긴다.
 *
 * ⚠ 왜 필요한가 — 2026-08-05 첫 측정이 **검색 유입 0%** 였다.
 *   그런데 「구글이 우리를 크롤링은 했는가」를 알 수가 없었다. UA 를 안 남겼기 때문이다.
 *   **크롤링도 안 됐다**와 **크롤링은 됐는데 순위가 없다**는 할 일이 완전히 다르다.
 *
 * 봇은 사람이 아니므로 종류를 남겨도 개인정보 문제가 없다. **사람 쪽은 그대로 안 남긴다.**
 */
export function 봇종류(userAgent) {
  const u = String(userAgent ?? '');
  if (/googlebot|google-inspectiontool|storebot-google/i.test(u)) return 'google';
  if (/bingbot|adidxbot|bingpreview/i.test(u)) return 'bing';
  if (/naver|yeti/i.test(u)) return 'naver';
  if (/daum|daumoa/i.test(u)) return 'daum';
  if (/duckduck/i.test(u)) return 'duckduckgo';
  if (/yandex/i.test(u)) return 'yandex';
  if (/baidu/i.test(u)) return 'baidu';
  if (/gptbot|oai-searchbot|chatgpt|claudebot|anthropic|perplexity|ccbot/i.test(u)) return 'ai';
  if (/facebookexternalhit|twitterbot|slackbot|linkedinbot|discordbot|telegram/i.test(u)) return 'sns미리보기';
  if (/uptime|pingdom|monitor|newrelic|datadog/i.test(u)) return '감시';
  return '기타';
}

const 스캐너경로 = new RegExp(
  '(^|/)(wp-admin|wp-includes|wp-content|wp-login|xmlrpc\\.php|phpinfo|phpmyadmin|_profiler'
  + '|\\.env|\\.git|\\.aws|\\.ssh|\\.vscode|\\.DS_Store|config\\.json|credentials'
  + '|vendor/phpunit|autodiscover|owa|ecp/|actuator|solr|jenkins|struts|cgi-bin)'
  + '|\\.(php|asp|aspx|jsp|cgi|sql|bak|old|swp)$',
  'i',
);

/** 리퍼러에서 **도메인만** 뽑는다. 전체 URL 은 남기지 않는다(검색어가 붙어 올 수 있다) */
export function 유입도메인(referer, 우리호스트) {
  if (!referer) return '(직접)';
  let h;
  try { h = new URL(referer).hostname.toLowerCase().replace(/^www\./, ''); } catch { return '(알수없음)'; }
  if (!h) return '(알수없음)';
  if (우리호스트 && h === String(우리호스트).toLowerCase().replace(/^www\./, '')) return '(내부)';
  /* 우리 사이트끼리의 유입은 따로 본다 — 「사이트 간 유입」이 우리 마케팅의 절반이다 */
  if (/^(seoulmarkets\.com|100yearmap\.com|wiki-tip\.com|klifemap\.(ai|com))$/.test(h)) return `우리:${h}`;
  return h;
}

/** 세는 대상인가. 정적 자원과 잡음은 안 센다 */
export function 셀것인가(pathname) {
  if (!pathname || pathname === '/favicon.ico') return false;
  if (pathname.startsWith('/_astro/')) return false;
  if (/\.(css|js|png|jpg|jpeg|svg|webp|ico|woff2?|xml|txt|map)$/i.test(pathname)) return false;
  if (pathname.startsWith('/admin')) return false;   /* 우리가 보는 것은 안 센다 */
  return true;
}

/**
 * 한 건 센다. **동기이고 절대 던지지 않는다.**
 * 요청 처리 경로에서 불리므로 여기서 무거운 것을 하지 않는다.
 */
export function 센다(입력) {
  try {
    /* ⚠ **구조분해를 기본값에 맡기지 않는다.** `센다(null)` 이면 기본값이 안 걸려 던진다.
     *   시험에서 실제로 잡혔다 — 운영 서버에서 이게 던지면 세 사이트가 같이 죽는다. */
    const { host, pathname, referer, userAgent } = 입력 ?? {};
    if (!셀것인가(pathname)) return;
    /* ⚠ **경로를 먼저 본다.** UA 는 속일 수 있고 경로는 의도 그 자체다 */
    const 스캐너 = 스캐너경로.test(String(pathname));
    const UA봇 = 봇패턴.test(String(userAgent ?? ''));
    const 봇 = (스캐너 || UA봇) ? '1' : '0';
    /* 봇이면 **종류만** 남긴다(google/bing/naver…). 사람이면 빈칸이다 */
    const 종류 = 봇 === '0' ? '' : (스캐너 && !UA봇 ? '스캐너' : 봇종류(userAgent));
    const 경로 = 통.size >= 경로상한 ? '(기타)' : String(pathname).slice(0, 200);
    const k = `${String(host ?? '').slice(0, 80)}\t${경로}\t${유입도메인(referer, host)}\t${봇}\t${종류}`;
    통.set(k, (통.get(k) ?? 0) + 1);
  } catch {
    /* ⚠ 측정이 서비스를 죽이지 않는다. 조용히 넘긴다 */
  }
}

/** 지금 모인 것을 표로. `/admin` 이 쓴다 */
export function 현황() {
  const 행 = [];
  for (const [k, n] of 통) {
    const [host, 경로, 유입, 봇, 종류] = k.split('\t');
    행.push({ host, 경로, 유입, 봇: 봇 === '1', 종류: 종류 || null, 수: n });
  }
  행.sort((a, b) => b.수 - a.수);
  const 사람 = 행.filter((x) => !x.봇).reduce((s, x) => s + x.수, 0);
  const 봇수 = 행.filter((x) => x.봇).reduce((s, x) => s + x.수, 0);
  /* ⭐ 어느 검색엔진이 왔는가 — 「검색 유입 0」의 원인을 가르는 데 이게 필요하다 */
  const 봇별 = {};
  for (const x of 행) if (x.봇 && x.종류) 봇별[x.종류] = (봇별[x.종류] ?? 0) + x.수;
  return {
    모은시각: new Date(시작).toLocaleString('ko-KR'),
    지금: new Date().toLocaleString('ko-KR'),
    사람, 봇: 봇수, 봇별, 서로다른키: 통.size,
    R2: remoteEnabled,
    행,
  };
}

/**
 * R2 로 내보낸다. **비어 있으면 아무것도 안 한다.**
 * ⚠ 성공했을 때만 비운다 — 실패했는데 비우면 그만큼이 영영 사라진다.
 */
export async function flush(지금 = new Date()) {
  if (flush중 || 통.size === 0) return { skipped: true };
  flush중 = true;
  const 보낼것 = 통;
  try {
    /* ⚠ 이 서버는 KST 로 돈다. `toISOString()` 을 쓰면 새벽에 하루가 어긋난다 */
    const 날 = `${지금.getFullYear()}${String(지금.getMonth() + 1).padStart(2, '0')}${String(지금.getDate()).padStart(2, '0')}`;
    const key = 일별키(날);

    /* 읽어서 → 합치고 → 쓴다.
     * ⚠ 프로세스가 재시작되면 메모리 집계가 0 이 된다. 그래서 **쌓인 것을 먼저 읽는다** —
     *   안 그러면 재배포할 때마다 그날치가 날아간다. */
    let 누적 = {};
    try {
      const 옛 = await get(key);
      if (옛) 누적 = JSON.parse(String(옛))?.집계 ?? {};
    } catch { /* 없거나 깨졌으면 새로 시작한다. 없는 게 정상이다 */ }

    let 건수 = 0;
    for (const [k, n] of 보낼것) { 누적[k] = (누적[k] ?? 0) + n; 건수++; }

    const 몸 = JSON.stringify({
      날짜: 날,
      갱신: 지금.toLocaleString('ko-KR'),
      설명: '키 = 호스트\\t경로\\t유입도메인\\t봇(1/0)\\t봇종류. 개인 식별값은 모으지 않는다',
      집계: 누적,
    });
    if (remoteEnabled) await put(key, 몸, 'application/json');

    /* 성공했을 때만 비운다 */
    통 = new Map();
    시작 = Date.now();
    마지막flush = Date.now();
    return { ok: true, 건수, key: remoteEnabled ? key : null };
  } catch (e) {
    /* ⚠ 실패해도 통을 안 비운다. 다음 번에 같이 나간다 */
    return { ok: false, error: String(e?.message ?? e) };
  } finally {
    flush중 = false;
  }
}

/** 요청 처리 뒤에 부른다. 시간이 됐을 때만 실제로 flush 한다 */
export function flush할때되면() {
  try {
    if (Date.now() - 마지막flush < FLUSH_MS) return;
    마지막flush = Date.now();          /* 먼저 갱신해 중복 호출을 막는다 */
    flush().catch(() => { /* 조용히 */ });
  } catch { /* 조용히 */ }
}
