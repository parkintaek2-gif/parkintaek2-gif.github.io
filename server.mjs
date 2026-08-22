/**
 * dist/ 를 그대로 서비스하는 정적 파일 서버. Cloudtype 배포용.
 *
 * 왜 필요한가 — Cloudflare Pages 는 `/equities` 요청에 `equities.html` 을 알아서 내주지만
 * 일반 Node 호스팅은 그렇지 않다. 그 규칙(clean URL)을 여기서 직접 구현한다.
 * 이게 없으면 사이트맵·canonical 이 가리키는 확장자 없는 URL 이 전부 404 다.
 *
 * 의존성 0개. Node 내장 모듈만 쓴다.
 */
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { timingSafeEqual, scryptSync } from 'node:crypto';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderAdmin, renderRaw } from './src/lib/admin.mjs';
import { handleApi } from './src/lib/api.mjs';
import { 경로후보 } from './src/lib/url-path.mjs';
import { 센다, flush할때되면, 유입표, 현황 as 유입현황 } from './src/lib/traffic.mjs';

const ROOT = fileURLToPath(new URL('./dist/', import.meta.url));
const PORT = Number(process.env.PORT) || 3000;

/**
 * 편집국(/admin) 접근 계정.
 *
 * **비밀번호 원문은 여기 없다. scrypt 해시만 있다.**
 * 해시는 공개돼도 안전하다 — 그러라고 만든 것이다. 원문을 되돌릴 수 없고,
 * 12자 무작위 비밀번호라 오프라인 대입도 현실적으로 불가능하다.
 *
 * 이 방식을 쓴 이유: Cloudtype 의 stage secret 이 배포에 자동으로 붙지 않아
 * 환경변수 경로가 막혔다. 해시를 커밋하면 재배포해도 그대로 유지된다.
 *
 * 비밀번호를 바꾸려면:
 *   node -e "const{scryptSync,randomBytes}=require('crypto');const s=randomBytes(16).toString('hex');console.log(s+':'+scryptSync('새비밀번호',s,64).toString('hex'))"
 * 출력값을 아래 ADMIN_HASH 에 넣는다. 환경변수 ADMIN_HASH 로 덮어쓸 수도 있다.
 */
const ADMIN_USER = process.env.ADMIN_USER || 'parkintaek2@gmail.com';
const ADMIN_HASH =
  process.env.ADMIN_HASH ||
  'f4d63bf168afdca3b4d95cf1b5650de3:fcbf925198e0ca1cd1074b40225bea24a916a7c94cecb956009840750dd58b28677a73d655e8d72b91ead5eab40bacfb78cc7d004c50a984bbfaf88a9cc02cb6';
const ADMIN_ENABLED = ADMIN_USER !== '' && ADMIN_HASH.includes(':');

/** 길이 노출 없이 상수시간 비교. 타이밍으로 한 글자씩 알아내는 걸 막는다. */
function safeEqual(a, b) {
  const A = Buffer.from(a);
  const B = Buffer.from(b);
  if (A.length !== B.length) {
    timingSafeEqual(A, A); // 길이가 달라도 같은 시간을 쓴다
    return false;
  }
  return timingSafeEqual(A, B);
}

function checkAuth(req) {
  const h = req.headers.authorization ?? '';
  if (!h.startsWith('Basic ')) return false;
  const [u, ...rest] = Buffer.from(h.slice(6), 'base64').toString('utf8').split(':');
  const p = rest.join(':'); // 비밀번호에 콜론이 있어도 깨지지 않게
  if (!safeEqual(u ?? '', ADMIN_USER)) return false;

  const [salt, want] = ADMIN_HASH.split(':');
  let got;
  try {
    got = scryptSync(p, salt, 64).toString('hex');
  } catch {
    return false;
  }
  return safeEqual(got, want);
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

// public/_headers 와 같은 정책을 여기서도 건다. 호스팅이 바뀌어도 헤더는 유지된다.
const BASE_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'SAMEORIGIN',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
};

function cacheFor(pathname, ext) {
  if (pathname.startsWith('/_astro/')) return 'public, max-age=31536000, immutable';
  if (ext === '.html') return 'public, max-age=0, must-revalidate';
  if (ext === '.xml') return 'public, max-age=3600';
  return 'public, max-age=604800';
}

/** 경로를 실제 파일로 해석한다. 없으면 null.
 *
 * ⚠ 2026-08-04 — `decodeURIComponent` 가 **서버 전체를 죽이고 있었다.**
 *   잘못된 퍼센트 인코딩(`/%`, `/%zz`)이나 UTF-8 이 아닌 바이트가 경로에 들어오면
 *   URIError 를 던지는데, 이 함수는 try/catch 밖에서 불린다 → 프로세스가 내려간다.
 *   세 사이트가 한 프로세스에 있으므로 **서울마켓·위키팁도 같이 죽는다.**
 *   스캐너가 그런 요청 하나만 보내면 끝이라, 원래도 있던 구멍이었다.
 *   백년지도가 한글 주소 3,450장을 얹으면서 터질 확률만 커졌다.
 *   못 읽는 경로는 파일도 없는 경로다 — 죽지 말고 404 로 답한다.
 */
async function resolveFile(pathname) {
  /* ⚠ 후보가 **여럿**일 수 있다. 원시 UTF-8 바이트로 온 한글 주소를 되살린 것이
   *   두 번째 후보로 온다. 어느 쪽이 맞는지는 **파일이 있는지로 판정**한다 —
   *   조건으로 가르려다 한 번 실패했다(`new URL()` 이 퍼센트 인코딩을 넣어 버린다).
   *   순서가 뜻을 갖는다: 원래 해석이 먼저, 되살린 것이 나중. */
  const candidates = [];
  for (const decoded of 경로후보(pathname)) {
    // 디렉터리 탈출 차단
    const clean = normalize(decoded).replace(/^(\.\.[/\\])+/, '');
    if (clean === '/' || clean === '\\') candidates.push('index.html');
    else if (extname(clean)) candidates.push(clean);
    // 확장자가 없으면 clean URL 로 보고 .html 과 디렉터리 index 를 차례로 찾는다
    else candidates.push(`${clean}.html`, join(clean, 'index.html'));
  }

  for (const c of candidates) {
    const full = join(ROOT, c);
    if (!full.startsWith(ROOT)) continue;
    try {
      const s = await stat(full);
      if (s.isFile()) return { full, size: s.size };
    } catch {
      /* 다음 후보로 */
    }
  }
  return null;
}

function send(res, status, full, size, pathname, headOnly = false) {
  const ext = extname(full);
  res.writeHead(status, {
    ...BASE_HEADERS,
    'Content-Type': TYPES[ext] ?? 'application/octet-stream',
    'Content-Length': size,
    'Cache-Control': cacheFor(pathname, ext),
  });
  // HEAD 는 헤더만 보내고 본문을 보내면 안 된다. Node 는 이걸 자동으로 막아주지 않는다.
  // 본문을 딸려 보내면 프로토콜 위반이라 헬스체크·프록시가 응답을 못 끝내고 기다린다.
  if (headOnly) {
    res.end();
    return;
  }
  createReadStream(full).pipe(res);
}

/**
 * 요청 하나가 프로세스를 죽이지 못하게 한다.
 *
 * ⚠ 2026-08-04 — 실제로 죽었다. 잘못된 퍼센트 인코딩 하나에 `decodeURIComponent` 가
 *   URIError 를 던져 서버가 내려갔고, **세 사이트가 한 프로세스**라 서울마켓·위키팁까지
 *   같이 멈췄다. 그 원인은 resolveFile 안에서 따로 막았지만, 원인을 하나씩 막는 방식으로는
 *   다음 것을 놓친다. 여기서 한 번 더 받는다.
 *
 * 500 을 돌려주고 로그를 남긴 뒤 **계속 산다.** 한 사람의 요청이 실패하는 것과
 * 세 사이트가 전부 죽는 것은 완전히 다른 일이다.
 */
const handle = async (req, res) => {
  const parsed = new URL(req.url, 'http://localhost');

  /*
   * 이 서버는 정적 파일 서버라 원래 GET/HEAD 만 받았다.
   * 뉴스레터 접수(`/v1/subscribe`) 하나 때문에 **그 경로에서만** POST 를 연다.
   *
   * ⚠ 전면 개방하지 않는다. 열어 둔 메서드는 곧 공격면이다.
   *   실제로 POST 를 처리하는 곳은 `/v1/subscribe` 하나뿐이고, 다른 `/v1/*` 로 온
   *   POST 는 handleApi 안에서 405 로 떨어진다.
   */
  const POST허용 = req.method === 'POST' && parsed.pathname === '/v1/subscribe';
  if (req.method !== 'GET' && req.method !== 'HEAD' && !POST허용) {
    res.writeHead(405, { ...BASE_HEADERS, Allow: 'GET, HEAD' }).end('Method Not Allowed');
    return;
  }

  let pathname = parsed.pathname;

  /* ── 도메인별 분기 ─────────────────────────────────────────────────
   *
   * 한 인스턴스가 여러 매체를 서비스한다. **메모리 추가가 0이다.**
   * Cloudtype 구독 총량이 1GB 이고 klifemap 과 나눠 쓰는데 여유가 0.25GB 뿐이라,
   * 매체마다 배포를 띄우면 그 자리에서 막힌다.
   *
   *   seoulmarkets.com  →  dist/           (금융)
   *   100yearmap.com    →  dist/100y/      (백년지도 · 교육)
   *   wiki-tip.com      →  dist/wikitip/   (K컬처 · 영문)
   *
   * 내부적으로는 **경로 접두사로 바꿔서** 아래 정적 파일 로직을 그대로 태운다.
   * 빌드 산출물이 이미 그 구조로 나오면 서버가 따로 알 것이 없다.
   *
   * ⚠ Host 헤더는 프록시가 넣어 주는 값이다. 포트가 붙어 올 수 있어 떼고 본다.
   *   그리고 **모르는 호스트는 기본(금융)으로 보낸다** — 새 도메인을 붙였는데
   *   여기 안 적으면 조용히 빈 화면이 나오는 것보다 낫다.
   */
  const host = String(req.headers.host ?? '').split(':')[0].toLowerCase().replace(/^www\./, '');
  /*
   * ⚠ 여기 없는 호스트는 **조용히 금융 사이트로 떨어진다.** 404 도 에러도 안 난다.
   *   그래서 새 도메인을 붙일 때는 **NS 를 바꾸기 전에 이 줄부터 추가하고,
   *   `curl -H "Host: 새도메인" localhost:PORT/` 로 무엇이 뜨는지 눈으로 본다.**
   *   순서를 뒤집으면 잘못 뜨는 화면을 전 세계가 먼저 본다.
   *
   * ⚠ 2026-08-03 KST — wiki-tip.com 을 뺐다가 **같은 날 되살렸다.**
   *   접었던 이유: 「경제·금융 끝나면 그때 한류」.
   *   되살린 이유: PG 승인이 늦어 **결제가 있는 쪽만 멈췄다.**
   *     「무료 사이트는 그냥 진행해야지. 위키팁」 (사장님)
   *   위키팁은 무료 매체라 PG 와 무관하다. 멈출 이유가 없다.
   *   ← 도메인과 Cloudflare 존을 안 지워 둔 덕에 되살리는 데 한 줄로 끝났다.
   */
  /*
   * ⚠ 2026-08-05 KST — **K컬처 매체의 도메인이 `kculturewire.com` 으로 바뀌었다.**
   *   제호도 「케이컬처와이어」(화면 표기 K Culture Wire)다.
   *   옛 이름 「케이컬처인코리아」는 K=Korean 이라 **「Korea in Korea」**가 되는 것을
   *   사장님이 잡으셨다. wiki-tip.com 은 색인 0·트래픽 0 이라 지금이 바꾸기 제일 쌌다.
   *
   *   ⛔ **`wiki-tip.com` 을 지우지 않는다.** 같은 접두사를 계속 가리키게 두고,
   *      나중에 301 을 걸 때까지 두 주소가 다 뜨게 한다. 지우면 옛 주소가 조용히
   *      금융 사이트로 떨어진다(아래 「모르는 호스트」 주석 참조).
   */
  const SITE_PREFIX = {
    '100yearmap.com': '/100y',
    'hundredyearmap.com': '/100y',
    'kculturewire.com': '/wikitip',
    'wiki-tip.com': '/wikitip',   /* 옛 주소. 301 을 걸기 전까지 살려 둔다 */
  };
  /* ⚠⚠ **접두사 밖에 두어야 하는 경로들.** 3번이 잡아 준 사고다 (2026-08-05).
   *
   *   404  100yearmap.com/_astro/HundredYear.css   →  dist/100y/_astro/… **그런 폴더가 없다**
   *   200  seoulmarkets.com/_astro/Base.css        →  dist/_astro/…       접두사가 없어 멀쩡했다
   *
   * `dist/_astro/` **하나에 세 사이트 자산이 다 들어간다.** 빌드 도구가 그렇게 낸다.
   * 그런데 접두사가 붙는 사이트만 못 찾았다.
   *
   * ⚠ **오류가 하나도 안 난다.** 빌드 통과·배포 성공·지면 200. **화면만 민얼굴이다.**
   *   3번이 배포 전에 `<link>` 를 세어 봤기에 걸렸다. 안 셌으면 3,862장이 그대로 나갔다.
   *
   * ⚠ **CSS 만의 문제가 아니다.** 앞으로 이미지·JS·폰트를 자산으로 쓰면 같은 일이 난다.
   *   그래서 파일 하나를 막는 게 아니라 **경로 규칙**으로 막는다.
   *   새 빌드 도구를 붙일 때 그것이 만드는 공유 경로가 있으면 **여기에 더한다.**
   */
  /* ⚠ 2026-08-22 — 5번이 잡은 사고. /admin 도 세 사이트가 «편집국 하나»를 공유해야
   *   하는데(같은 계정, 같은 서버), 접두사가 붙으면 /admin → /wikitip/admin 이 되어
   *   316줄의 /admin 분기에 안 닿는다. seoulmarkets(접두사 없음)만 401(정상)이 뜨고
   *   나머지 둘은 404 였다. /admin(/…) 도 공유 경로에 넣는다. */
  const 공유경로 = /^\/(_astro|_image|_worker|@vite|assets)\/|^\/admin(\/|$)/;

  const prefix = SITE_PREFIX[host] ?? '';
  if (prefix && !공유경로.test(pathname) && !pathname.startsWith(prefix)) {
    // ⚠ Astro 가 `dist/100y.html` 로 낸다(폴더가 아니다). 그래서 `/` 는 접두사 **그대로**
    //   보내야 아래 clean URL 로직이 `100y.html` 을 찾는다. `/100y/` 로 보내면 404 다.
    pathname = pathname === '/' ? prefix : prefix + pathname;
  }

  // ── 데이터 API (/v1) ───────────────────────────────────────────────
  // 정적 파일보다 먼저 가로챈다. 매출의 3분의 2가 나올 자리라 별도 서버를 띄울
  // 법도 하지만, 정적 서버가 실측 47.6MB 밖에 안 쓰고 Cloudtype 여유가 0 이라
  // 여기 붙였다. 인프라 추가 비용 0원이다.
  {
    /*
     * ⚠ 2026-08-03 KST — 헤더와 IP 를 같이 넘긴다.
     *   RapidAPI 유료화 때문이다. 마켓플레이스는 자기를 거친 요청에만 헤더를
     *   붙여 주는데, 그걸 보지 않으면 구매자가 우리 도메인을 직접 불러 버린다.
     *
     *   IP 는 **x-forwarded-for 의 맨 앞**을 쓴다. Cloudtype 프록시 뒤라
     *   socket.remoteAddress 는 전부 프록시 주소로 같게 나온다 —
     *   그걸로 분당 한도를 걸면 전 세계가 한 양동이에 담긴다.
     */
    const 클라이언트IP =
      (req.headers['x-forwarded-for'] ?? '').split(',')[0].trim() ||
      req.socket?.remoteAddress ||
      '';
    /*
     * POST 본문을 읽는다. 뉴스레터 접수(`/v1/subscribe`) 하나 때문이다.
     *
     * ⚠ 크기를 **반드시** 막는다. 안 막으면 누구나 무한정 밀어넣어 메모리를 채운다.
     *   Cloudtype 여유가 0.25GB 라 그 자리에서 klifemap 까지 같이 죽는다.
     *   이메일 한 줄에 16KB 면 충분하고도 남는다.
     */
    let 본문 = null;
    if (req.method === 'POST' && (pathname === '/v1' || pathname.startsWith('/v1/'))) {
      본문 = await new Promise((resolve) => {
        const 조각 = [];
        let 크기 = 0;
        let 끝났다 = false;
        const 마감 = (v) => { if (!끝났다) { 끝났다 = true; resolve(v); } };
        req.on('data', (c) => {
          크기 += c.length;
          if (크기 > 16 * 1024) { req.destroy(); 마감(null); return; }
          조각.push(c);
        });
        req.on('end', () => 마감(Buffer.concat(조각).toString('utf8')));
        req.on('error', () => 마감(null));
      });
    }

    const api = await handleApi(pathname, parsed.searchParams, {
      headers: req.headers,
      ip: 클라이언트IP,
      method: req.method,
      body: 본문,
    });
    if (api) {
      res.writeHead(api.status, { ...BASE_HEADERS, ...api.headers });
      res.end(req.method === 'HEAD' ? undefined : api.body);
      return;
    }
  }

  // ── 편집국 ─────────────────────────────────────────────────────────
  // 정적 파일 처리보다 먼저 가로챈다. dist/ 에 admin 이라는 파일이 생겨도
  // 그쪽으로 새지 않게 하려는 것이다.
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    if (!ADMIN_ENABLED) {
      // 계정 미설정이면 존재 자체를 알리지 않는다.
      res.writeHead(404, { ...BASE_HEADERS, 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }
    if (!checkAuth(req)) {
      res.writeHead(401, {
        ...BASE_HEADERS,
        'WWW-Authenticate': 'Basic realm="SeoulMarkets Newsroom", charset="UTF-8"',
        'Content-Type': 'text/plain; charset=utf-8',
      });
      res.end('Authentication required');
      return;
    }
    const adminHeaders = {
      ...BASE_HEADERS,
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    };

    /* /admin/traffic — 유입 현황 (JSON).
     * ⚠ **인증 안쪽**에 둔다. 우리 유입 분포는 밖에 보일 이유가 없다.
     * 집계만 있고 개인을 식별할 값은 애초에 안 모은다(traffic.mjs). */
    if (pathname === '/admin/traffic') {
      let 몸;
      try { 몸 = JSON.stringify(유입현황(), null, 1); }
      catch (e) { 몸 = JSON.stringify({ error: String(e?.message ?? e) }); }
      res.writeHead(200, { ...adminHeaders, 'Content-Type': 'application/json; charset=utf-8' });
      res.end(req.method === 'HEAD' ? undefined : 몸);
      return;
    }

    // /admin/raw/<slug> — 마크다운 원문 그대로 (복사·수정용)
    const rawMatch = pathname.match(/^\/admin\/raw\/(.+)$/);
    if (rawMatch) {
      const md = await renderRaw(decodeURIComponent(rawMatch[1]));
      if (md == null) {
        res.writeHead(404, { ...adminHeaders, 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not Found');
        return;
      }
      res.writeHead(200, { ...adminHeaders, 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(req.method === 'HEAD' ? undefined : md);
      return;
    }

    // /admin 또는 /admin/<slug>
    const slugMatch = pathname.match(/^\/admin\/(.+)$/);
    const r = await renderAdmin({
      user: ADMIN_USER,
      slug: slugMatch ? decodeURIComponent(slugMatch[1]) : null,
    });
    // 없는 기사면 404 로 돌려준다. 목록에 없는 slug 를 200 으로 주면 안 된다.
    const status = typeof r === 'string' ? 200 : r.status;
    const html = typeof r === 'string' ? r : r.html;
    res.writeHead(status, { ...adminHeaders, 'Content-Type': 'text/html; charset=utf-8' });
    res.end(req.method === 'HEAD' ? undefined : html);
    return;
  }

  // 확장자 없는 URL 을 정본으로 쓴다. /equities/ 나 /equities.html 로 들어오면 한 곳으로 모은다.
  const canonical = pathname
    .replace(/\/index\.html$/, '/')
    .replace(/\.html$/, '')
    .replace(/(.)\/$/, '$1');
  if (canonical !== pathname) {
    /* ⚠⚠ **접두사를 도로 떼고 보낸다.** 3번이 잡아 준 것이다 (2026-08-05).
     *
     *   전   100yearmap.com/school/  →  301  →  「/100y/school」   ← 내부 경로가 샌다
     *   후   100yearmap.com/school/  →  301  →  「/school」
     *
     * ⚠ 위 줄에 `**` 로 강조를 못 쓴다 — `**` 뒤에 `/` 가 오면 블록 주석이 거기서 끝난다.
     *   실제로 이 파일에서 한 번 깨뜨렸다. 강조가 필요하면 「」 를 쓴다.
     *
     * `/100y` 는 **한 인스턴스가 세 사이트를 서비스하려고 안에서만 쓰는 접두사**다.
     * 밖으로 나가면 두 주소가 같은 문서를 가리켜 **검색엔진이 중복으로 색인**한다.
     * 이용자가 그 주소를 공유하면 그것이 퍼진다.
     *
     * 원인은 순서였다 — 접두사를 **붙인 뒤에** 정본을 만들었다. 뗀 값으로 보낸다. */
    let 보낼곳 = canonical;
    if (prefix && 보낼곳.startsWith(prefix)) 보낼곳 = 보낼곳.slice(prefix.length) || '/';
    res.writeHead(301, { ...BASE_HEADERS, Location: 보낼곳 || '/' }).end();
    return;
  }

  const headOnly = req.method === 'HEAD';

  const hit = await resolveFile(pathname);
  if (hit) {
    send(res, 200, hit.full, hit.size, pathname, headOnly);
    return;
  }

  /**
   * ⚠⚠ **404 도 그 사이트 얼굴로 낸다.**
   *
   * 2026-08-05 실측 — `100yearmap.com/없는주소` 가 **「Page not found | SeoulMarkets」**
   * 로 나왔다. 금융 매체 머리말·꼬리말이 교육 사이트 방문자에게 그대로 보였다.
   * `resolveFile('/404')` 가 접두사를 안 붙여 `dist/404.html`(SeoulMarkets) 를 집었다.
   *
   * **404 는 사람이 제일 자주 보는 실패 화면이다.** 오타 하나로 남의 브랜드가 뜨면
   * 「이 회사가 뭐 하는 곳인가」가 흔들린다. 오픈 열흘 앞이라 더 그렇다.
   *
   * 그 사이트 전용 404 가 없으면 **기존대로 공용으로 떨어진다** — 안전한 쪽이다.
   * 5번(wiki-tip)·3번(100yearmap)은 `src/pages/<접두사>/404.astro` 를 만들면 저절로 걸린다.
   */
  const 후보들 = prefix ? [`${prefix}/404`, '/404'] : ['/404'];
  for (const 후보 of 후보들) {
    const notFound = await resolveFile(후보);
    if (notFound) {
      send(res, 404, notFound.full, notFound.size, 후보, headOnly);
      return;
    }
  }
  res.writeHead(404, { ...BASE_HEADERS, 'Content-Type': 'text/plain' }).end('Not Found');
};

const server = createServer((req, res) => {
  /* ── 유입 측정 ────────────────────────────────────────────────────
   * ⚠ **응답이 끝난 뒤에** 센다. 요청 처리 경로를 한 톨도 늦추지 않는다.
   *   그리고 `센다`/`flush할때되면` 은 **던지지 않도록** 만들어져 있다(traffic.mjs).
   *   그래도 여기서 한 번 더 감싼다 — 측정 때문에 세 사이트가 죽는 일은 없어야 한다.
   *
   * 남기는 것: 호스트·경로·유입 도메인·봇 여부·**우리가 붙인 `?from=` 딱지**.
   * 안 남기는 것: **IP·쿠키·UA 원문·검색어·물음표 뒤 나머지 전부**
   */
  res.on('finish', () => {
    try {
      const u = new URL(req.url ?? '/', 'http://localhost');
      센다({
        host: String(req.headers.host ?? '').split(':')[0],
        pathname: u.pathname,
        referer: req.headers.referer ?? req.headers.referrer,
        userAgent: req.headers['user-agent'],
        /* ⭐ 3번이 여섯 번 물은 한 줄 — 「한 장이 몇 번 열리나 · 값 지면까지 %」
         * ⛔ 물음표 뒤를 통째로 안 남긴다. **`from` 하나만** 흰 목록으로 뽑는다 —
         *    거기엔 손님이 친 검색어·이메일이 들어올 수 있다 */
        from: 유입표(u.searchParams),
      });
      flush할때되면();
    } catch { /* 측정은 조용히 실패한다 */ }
  });

  handle(req, res).catch((err) => {
    console.error(`[500] ${req.method} ${req.url} —`, err?.message ?? err);
    if (res.headersSent) {
      res.destroy(); // 이미 보내기 시작했으면 끊는 수밖에 없다
      return;
    }
    res.writeHead(500, { ...BASE_HEADERS, 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Internal Server Error');
  });
});

server.listen(PORT, () => {
  console.log(`serving dist/ on http://0.0.0.0:${PORT}`);
});

/**
 * 🔴🔴 2026-08-22 (5번) — **유입 집계가 오늘 하루 통째로 새고 있었다.**
 *
 * R2 의 그날치 파일을 열어 보니 마지막 갱신이 **오전 10:26** 이었다. 재 본 시각은 19:40 이다.
 * 어제까지는 매일 23:5x 까지 적혀 있었다 —
 *   8/18 23:58 · 8/19 23:55 · 8/20 23:50 · 8/21 23:52 · **8/22 10:26**
 *
 * 까닭: 집계는 메모리에 쌓이고 **10분마다** R2 로 흘려 쓴다(traffic.mjs FLUSH_MS).
 * 그런데 이 서버 하나가 네 집(seoulmarkets·100yearmap·kculturewire·klifemap)을 낸다.
 * 오늘은 여섯 자리가 오후 내내 배포했고, **배포는 컨테이너를 새로 띄운다.**
 * 10분이 차기 전에 프로세스가 죽으면 그때까지 센 것이 **그냥 사라진다.**
 * 종료 신호를 받아 마지막으로 흘려 쓰는 자리가 **없었다.**
 *
 * ⭐ 그래서 여기 둔다. 배포가 잦은 날일수록 이 자리가 하는 일이 크다.
 * ⛔ 여기서 던지지 않는다 — 종료 경로에서 던지면 컨테이너가 이상하게 죽는다.
 * ⚠ 오래 붙들지 않는다. 2초 안에 못 쓰면 포기하고 나간다 — 배포를 늦추는 것이 더 나쁘다.
 * ⚠ 이 파일은 네 집이 같이 쓴다. 그래서 하는 일을 **흘려 쓰기 하나로만** 좁혔다.
 */
let 끝내는중 = false;
async function 끝낼때흘려쓴다(신호) {
  if (끝내는중) return;
  끝내는중 = true;
  try {
    const { flush } = await import('./src/lib/traffic.mjs');
    const 결과 = await Promise.race([
      flush(),
      new Promise((풀기) => { setTimeout(() => 풀기({ timeout: true }), 2000); }),
    ]);
    console.log(`[${신호}] 유입 집계 마지막 흘려쓰기 — ${JSON.stringify(결과)}`);
  } catch (e) {
    console.error(`[${신호}] 흘려쓰기 실패(무시하고 나간다) — ${e?.message ?? e}`);
  }
  process.exit(0);
}
for (const 신호 of ['SIGTERM', 'SIGINT']) process.on(신호, () => { 끝낼때흘려쓴다(신호); });
