/* 🔴 사이트맵이 구글에 «제출돼 있나» — 안 냈으면 구글은 오지 않는다.
   ⛔ 짐작하지 않는다. Search Console 에 직접 묻는다. */
import { 토큰받기, 사이트들 } from './fetch-gsc.mjs';
const { 토큰 } = await 토큰받기();
for (const [이름, 곳] of Object.entries(사이트들)) {
  const u = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(곳.속성)}/sitemaps`;
  const r = await fetch(u, { headers: { Authorization: `Bearer ${토큰}` } });
  if (!r.ok) { console.log(`⚠ ${이름} — 못 물었다 HTTP ${r.status}`); continue; }
  const j = await r.json();
  const 것들 = j.sitemap ?? [];
  console.log(`\n■ ${이름} — 낸 사이트맵 ${것들.length}개`);
  if (!것들.length) { console.log('   🔴 **하나도 안 냈다.** 구글이 올 길이 없다'); continue; }
  for (const s of 것들) {
    const 쪽 = (s.contents ?? []).reduce((a, c) => a + Number(c.submitted ?? 0), 0);
    const 색인 = (s.contents ?? []).reduce((a, c) => a + Number(c.indexed ?? 0), 0);
    console.log(`   ${s.path.replace(/^https?:\/\/[^/]+/, '')}`);
    console.log(`     낸 장수 ${쪽} · 구글이 적은 색인 ${색인} · 마지막으로 읽어간 날 ${(s.lastDownloaded ?? '— 한 번도 안 읽어갔다').slice(0, 10)}`);
    if (s.errors || s.warnings) console.log(`     ⚠ 오류 ${s.errors ?? 0} · 경고 ${s.warnings ?? 0}`);
  }
}
