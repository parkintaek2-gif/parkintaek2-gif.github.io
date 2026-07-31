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
import { timingSafeEqual } from 'node:crypto';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderAdmin } from './src/lib/admin.mjs';

const ROOT = fileURLToPath(new URL('./dist/', import.meta.url));
const PORT = Number(process.env.PORT) || 3000;

/**
 * 편집국(/admin) 접근 계정. **환경변수로만 넣는다. 코드에 적지 않는다.**
 * (이 저장소는 공개다 — 적으면 전 세계가 본다)
 *
 *   Cloudtype 콘솔 → 환경변수
 *     ADMIN_USER = parkintaek2@gmail.com
 *     ADMIN_PASS = <직접 정한 비밀번호>
 *
 * 둘 중 하나라도 비어 있으면 /admin 은 아예 없는 페이지로 취급한다(404).
 * 기본 비밀번호를 두는 것보다 안전하다 — 설정을 잊어도 뚫리지 않는다.
 */
const ADMIN_USER = process.env.ADMIN_USER ?? '';
const ADMIN_PASS = process.env.ADMIN_PASS ?? '';
const ADMIN_ENABLED = ADMIN_USER !== '' && ADMIN_PASS !== '';

/** 길이 노출 없이 상수시간 비교. 타이밍 공격으로 비밀번호를 한 글자씩 알아내는 걸 막는다. */
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
  return safeEqual(u ?? '', ADMIN_USER) & safeEqual(p, ADMIN_PASS) ? true : false;
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

/** 경로를 실제 파일로 해석한다. 없으면 null. */
async function resolveFile(pathname) {
  // 디렉터리 탈출 차단
  const clean = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '');
  const candidates =
    clean === '/' || clean === '\\'
      ? ['index.html']
      : extname(clean)
        ? [clean]
        : // 확장자가 없으면 clean URL 로 보고 .html 과 디렉터리 index 를 차례로 찾는다
          [`${clean}.html`, join(clean, 'index.html')];

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

const server = createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { ...BASE_HEADERS, Allow: 'GET, HEAD' }).end('Method Not Allowed');
    return;
  }

  const pathname = new URL(req.url, 'http://localhost').pathname;

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
    const html = await renderAdmin({ user: ADMIN_USER });
    res.writeHead(200, {
      ...BASE_HEADERS,
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    });
    res.end(req.method === 'HEAD' ? undefined : html);
    return;
  }

  // 확장자 없는 URL 을 정본으로 쓴다. /equities/ 나 /equities.html 로 들어오면 한 곳으로 모은다.
  const canonical = pathname
    .replace(/\/index\.html$/, '/')
    .replace(/\.html$/, '')
    .replace(/(.)\/$/, '$1');
  if (canonical !== pathname) {
    res.writeHead(301, { ...BASE_HEADERS, Location: canonical || '/' }).end();
    return;
  }

  const headOnly = req.method === 'HEAD';

  const hit = await resolveFile(pathname);
  if (hit) {
    send(res, 200, hit.full, hit.size, pathname, headOnly);
    return;
  }

  const notFound = await resolveFile('/404');
  if (notFound) {
    send(res, 404, notFound.full, notFound.size, '/404', headOnly);
    return;
  }
  res.writeHead(404, { ...BASE_HEADERS, 'Content-Type': 'text/plain' }).end('Not Found');
});

server.listen(PORT, () => {
  console.log(`serving dist/ on http://0.0.0.0:${PORT}`);
});
