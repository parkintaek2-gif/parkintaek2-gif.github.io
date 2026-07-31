/**
 * 새 기사 URL을 IndexNow로 통보한다. Bing·Yandex·Naver·Seznam이 이 프로토콜을 받는다.
 * (구글은 IndexNow를 쓰지 않는다 — 구글은 사이트맵 + Search Console로 간다)
 *
 *   node scripts/ping-indexnow.mjs                      # 사이트맵 전체 URL 통보
 *   node scripts/ping-indexnow.mjs /article/foo /macro  # 지정한 경로만 통보
 *
 * 발행 후 한 번 돌리면 된다. 하루 수백 건씩 남발하지 말 것.
 */
import { readFile, readdir } from 'node:fs/promises';

const KEY = (await readFile(new URL('./.indexnow-key', import.meta.url), 'utf8')).trim();
const HOST = 'seoulmarkets.com';
const ORIGIN = `https://${HOST}`;

async function urlsFromBuild() {
  // dist 의 사이트맵들에서 <loc> 를 긁는다. 빌드 후에 돌리는 것을 전제로 한다.
  const dir = new URL('../dist/', import.meta.url);
  const files = (await readdir(dir)).filter((f) => /^sitemap-.*\.xml$/.test(f));
  const out = [];
  for (const f of files) {
    const xml = await readFile(new URL(f, dir), 'utf8');
    for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) out.push(m[1]);
  }
  return out;
}

const args = process.argv.slice(2);
const urlList = args.length ? args.map((p) => new URL(p, ORIGIN).href) : await urlsFromBuild();

if (urlList.length === 0) {
  console.error('통보할 URL이 없다. 먼저 npm run build 를 돌렸는지 확인할 것.');
  process.exit(1);
}

const res = await fetch('https://api.indexnow.org/IndexNow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({
    host: HOST,
    key: KEY,
    keyLocation: `${ORIGIN}/${KEY}.txt`,
    urlList,
  }),
});

console.log(`IndexNow ${res.status} ${res.statusText} — ${urlList.length} URL(s)`);
if (!res.ok) console.log(await res.text());
