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
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('./dist/', import.meta.url));
const PORT = Number(process.env.PORT) || 3000;

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

function send(res, status, full, size, pathname) {
  const ext = extname(full);
  res.writeHead(status, {
    ...BASE_HEADERS,
    'Content-Type': TYPES[ext] ?? 'application/octet-stream',
    'Content-Length': size,
    'Cache-Control': cacheFor(pathname, ext),
  });
  createReadStream(full).pipe(res);
}

const server = createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { ...BASE_HEADERS, Allow: 'GET, HEAD' }).end('Method Not Allowed');
    return;
  }

  const pathname = new URL(req.url, 'http://localhost').pathname;

  // 확장자 없는 URL 을 정본으로 쓴다. /equities/ 나 /equities.html 로 들어오면 한 곳으로 모은다.
  const canonical = pathname
    .replace(/\/index\.html$/, '/')
    .replace(/\.html$/, '')
    .replace(/(.)\/$/, '$1');
  if (canonical !== pathname) {
    res.writeHead(301, { ...BASE_HEADERS, Location: canonical || '/' }).end();
    return;
  }

  const hit = await resolveFile(pathname);
  if (hit) {
    send(res, 200, hit.full, hit.size, pathname);
    return;
  }

  const notFound = await resolveFile('/404');
  if (notFound) {
    send(res, 404, notFound.full, notFound.size, '/404');
    return;
  }
  res.writeHead(404, { ...BASE_HEADERS, 'Content-Type': 'text/plain' }).end('Not Found');
});

server.listen(PORT, () => {
  console.log(`serving dist/ on http://0.0.0.0:${PORT}`);
});
