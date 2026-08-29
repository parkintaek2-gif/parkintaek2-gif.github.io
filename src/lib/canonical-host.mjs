/**
 * canonical-host.mjs — **한 사이트가 «한 호스트»로만 뜨게 한다.**
 *
 * ── 왜 (2026-08-29) ───────────────────────────────────────────
 * 🔴 5번이 재 보니 **네 집 중 셋이 www 와 비www 를 둘 다 200 으로** 내고 있었다.
 * ```
 *   seoulmarkets.com    비www 200 · www 200   canonical → 비www
 *   100yearmap.com      비www 200 · www 200   canonical → 비www
 *   kculturewire.com    비www 200 · www 200   canonical → www
 *   klifemap.ai         비www 200 · www 301   ✅ 이미 제대로 되어 있다
 * ```
 * canonical 태그가 한 쪽만 가리켜 **중복 색인 위험은 막혀 있었다.** 급한 불은 아니었다.
 * ⚠ 그런데 같은 지면을 **두 호스트로 크롤당한다.** 5번 실측에서 색인이 안 되는 까닭의
 *   으뜸이 `Discovered - currently not indexed`(크롤이 못 따라옴)라, 크롤을 반으로
 *   나눠 쓰는 것은 그냥 두기 아깝다.
 *
 * ── 2번 결정 (2026-08-29) ─────────────────────────────────────
 * > 「klifemap처럼 301로 통일하되, **새로 무엇을 정하지 않고 각 사이트가 이미 쓰고 있는
 * >  canonical 태그의 호스트**를 정본으로 삼습니다」
 *
 * ⛔ 그래서 이 표의 값은 **내가 고른 것이 아니다.** 라이브 지면의 `<link rel="canonical">`
 *   을 실제로 열어서 읽은 값 그대로다. 바꾸려면 지면의 canonical 부터 바꿔야 한다.
 *
 * ── ⛔ 이 자가 지키는 것 ──────────────────────────────────────
 * ⛔ **표에 없는 호스트는 건드리지 않는다.** `localhost`·내부 헬스체크·프록시가 넣는
 *   낯선 Host 가 301 로 튕기면 배포가 통째로 죽는다. 모르면 «가만히 둔다».
 * ⛔ **공유 경로는 안 보낸다.** `/v1/subscribe` 는 POST 다 — 301 을 타면 본문이
 *   사라지는 클라이언트가 있다. `/admin`·`/_astro` 도 마찬가지로 그냥 둔다.
 * ⛔ 물음표 뒤(쿼리)를 «잃지 않는다». 잃으면 링크가 조용히 달라진다.
 * ⚠ 이 자는 «어디로 보낼지»만 정한다. 실제로 보내는 것은 부르는 쪽 몫이다.
 */

/**
 * 사이트마다 «정본 호스트».
 * 🔴 열쇠는 `www.` 를 뗀 호스트, 값은 **뜨게 할 호스트 전체**다.
 * ⛔ 값은 라이브 canonical 에서 읽은 것이다. 짐작으로 채우지 않는다.
 */
export const 정본호스트 = {
  'kculturewire.com': 'www.kculturewire.com',   /* 라이브 canonical: https://www.kculturewire.com/… */
  'seoulmarkets.com': 'seoulmarkets.com',       /* 라이브 canonical: https://seoulmarkets.com      */
  '100yearmap.com': '100yearmap.com',           /* 라이브 canonical: https://100yearmap.com/       */
  'klifemap.ai': 'klifemap.ai',                 /* 이미 301 로 되어 있다 — 표에 적어만 둔다        */
};

/** 301 을 태우지 않을 경로. ⛔ POST 가 오는 자리를 절대 넣지 않는다 */
export const 안보내는경로 = /^\/(_astro|_image|_worker|@vite|assets)\/|^\/admin(\/|$)|^\/v1\//;

/**
 * 이 요청을 «어디로 보낼지» 정한다.
 * @returns 보낼 주소(문자열) — 보낼 필요가 없으면 **null**
 * ⛔ null 을 「오류」로 읽지 않는다. 「그냥 두라」는 뜻이다.
 */
export function 보낼곳(날호스트, 길, 표 = 정본호스트) {
  const h = String(날호스트 ?? '').split(':')[0].toLowerCase();
  if (!h) return null;
  const 열쇠 = h.replace(/^www\./, '');
  const 정본 = 표[열쇠];
  if (!정본) return null;              /* ⛔ 모르는 호스트는 가만히 둔다 */
  if (h === 정본) return null;         /* 이미 정본이다 */
  const p = String(길 ?? '/') || '/';
  if (안보내는경로.test(p.split('?')[0])) return null;
  return `https://${정본}${p.startsWith('/') ? p : `/${p}`}`;
}

/* ── 자가시험 ─────────────────────────────────────────────── */
export function 자가시험() {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  검('🔴 KCW 는 비www 를 www 로 보낸다',
    보낼곳('kculturewire.com', '/hit-or-flop') === 'https://www.kculturewire.com/hit-or-flop');
  검('KCW 는 이미 www 면 안 보낸다', 보낼곳('www.kculturewire.com', '/hit-or-flop') === null);
  검('🔴 seoulmarkets 는 «반대로» www 를 비www 로 보낸다',
    보낼곳('www.seoulmarkets.com', '/rates') === 'https://seoulmarkets.com/rates');
  검('seoulmarkets 는 이미 비www 면 안 보낸다', 보낼곳('seoulmarkets.com', '/rates') === null);
  검('100yearmap 도 비www 가 정본이다',
    보낼곳('www.100yearmap.com', '/') === 'https://100yearmap.com/');
  검('klifemap 은 이미 맞아서 안 보낸다', 보낼곳('klifemap.ai', '/') === null);

  검('⛔ 표에 없는 호스트는 «가만히 둔다»', 보낼곳('localhost', '/') === null);
  검('⛔ 내부 헬스체크 호스트도 안 건드린다',
    보낼곳('port-0-web-ms8nmh0n689e433f.sel3.cloudtype.app', '/') === null);
  검('⛔ 옛 도메인(wiki-tip)도 표에 없으니 안 건드린다', 보낼곳('wiki-tip.com', '/') === null);
  검('⛔ 빈 것도 안 터진다', 보낼곳(undefined, '/') === null && 보낼곳('', '/') === null);

  검('포트가 붙어 와도 안다',
    보낼곳('kculturewire.com:8080', '/x') === 'https://www.kculturewire.com/x');
  검('대문자로 와도 안다',
    보낼곳('KCultureWire.com', '/x') === 'https://www.kculturewire.com/x');

  검('⭐ 물음표 뒤를 «잃지 않는다»',
    보낼곳('kculturewire.com', '/titles?page=3') === 'https://www.kculturewire.com/titles?page=3');
  검('길이 비어도 뿌리로 보낸다', 보낼곳('kculturewire.com', '') === 'https://www.kculturewire.com/');

  검('⛔⛔ POST 가 오는 /v1/subscribe 는 «안» 보낸다 — 301 이면 본문이 사라진다',
    보낼곳('kculturewire.com', '/v1/subscribe') === null);
  검('⛔ /admin 도 안 보낸다', 보낼곳('kculturewire.com', '/admin') === null);
  검('⛔ 공유 자산도 안 보낸다', 보낼곳('kculturewire.com', '/_astro/x.css') === null);
  검('⚠ 쿼리가 붙은 공유 경로도 안 보낸다',
    보낼곳('kculturewire.com', '/v1/subscribe?x=1') === null);

  검('⭐ 표를 갈아 끼울 수 있다 — 자가 표를 안 붙들고 있다',
    보낼곳('a.com', '/x', { 'a.com': 'www.a.com' }) === 'https://www.a.com/x');

  return 실패;
}

if (process.argv[1] && process.argv[1].endsWith('canonical-host.mjs')) {
  const 실패 = 자가시험();
  if (실패.length) {
    console.error(`❌ canonical-host 자가시험 실패 ${실패.length}\n${실패.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log('✅ canonical-host 자가시험 통과 (19)');
}
