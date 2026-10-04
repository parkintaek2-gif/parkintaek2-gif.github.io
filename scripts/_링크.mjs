/* 🔴 구글이 아는 «밖에서 들어오는 링크»가 몇 개인가 — 그것이 수집 예산을 정한다.
   사장님: 「유입량을 지금의 천배, 만배로」 */
import { 토큰받기, 사이트들 } from './fetch-gsc.mjs';
const { 토큰 } = await 토큰받기();
for (const [이름, 곳] of Object.entries(사이트들)) {
  /* 구글이 그 지면을 어떻게 보는지 — referringUrls 에 밖의 링크가 적힌다 */
  const 볼것 = { klifemap: 'https://klifemap.ai/', kcw: 'https://www.kculturewire.com/',
                 '100y': 'https://100yearmap.com/', seoulmarkets: 'https://seoulmarkets.com/' }[이름];
  const r = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
    method: 'POST', headers: { Authorization: `Bearer ${토큰}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inspectionUrl: 볼것, siteUrl: 곳.속성, languageCode: 'ko' }),
  });
  if (!r.ok) { console.log(`⚠ ${이름} — 못 물었다 HTTP ${r.status}`); continue; }
  const i = (await r.json()).inspectionResult?.indexStatusResult ?? {};
  console.log(`■ ${이름.padEnd(13)} 색인 ${i.coverageState ?? '—'}`);
  console.log(`   마지막 수집 ${(i.lastCrawlTime ?? '— 한 번도 안 왔다').slice(0, 10)}`
    + ` · 구글이 찾아낸 길 ${i.referringUrls ? i.referringUrls.length + '개' : '— 적혀 있지 않다'}`);
  if (i.sitemap?.length) console.log(`   이 지면을 담은 사이트맵 ${i.sitemap.length}개`);
}
