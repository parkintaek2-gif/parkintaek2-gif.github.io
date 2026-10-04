/* 🔴 구글이 «실제로» 어떤 상태라고 말하는가 — 짐작하지 않고 URL 검사 API 에 묻는다.
   사장님: 「유입량을 지금의 천배, 만배로」 — 1,686장이 왜 0장인지부터 안다. */
import { 토큰받기, 사이트들 } from './fetch-gsc.mjs';
const { 토큰 } = await 토큰받기();
const 볼것 = [
  ['klifemap', 'https://klifemap.ai/content/star-q56505060-saju'],
  ['klifemap', 'https://klifemap.ai/content/star-q56505060-saju-en'],
  ['klifemap', 'https://klifemap.ai/content/star-q56505060-saju-zh'],
  ['klifemap', 'https://klifemap.ai/content/star-q56505060-saju-ja'],
  ['klifemap', 'https://klifemap.ai/stars'],
];
for (const [딱지, 주소] of 볼것) {
  const 속성 = 사이트들[딱지].속성;
  const r = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
    method: 'POST',
    headers: { Authorization: `Bearer ${토큰}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inspectionUrl: 주소, siteUrl: 속성, languageCode: 'ko' }),
  });
  if (!r.ok) { console.log(`⚠ 못 물었다 HTTP ${r.status} — ${주소.replace('https://klifemap.ai','')}`); continue; }
  const j = await r.json();
  const i = j.inspectionResult?.indexStatusResult ?? {};
  console.log(`\n■ ${주소.replace('https://klifemap.ai', '')}`);
  console.log(`   판정 ${i.verdict ?? '—'} · 색인 ${i.coverageState ?? '—'}`);
  console.log(`   로봇 ${i.robotsTxtState ?? '—'} · 수집 ${i.pageFetchState ?? '—'} · 색인허용 ${i.indexingState ?? '—'}`);
  console.log(`   마지막 수집 ${(i.lastCrawlTime ?? '— 한 번도 안 왔다').slice(0, 10)}`);
  if (i.googleCanonical && i.googleCanonical !== 주소) console.log(`   🔴 구글이 고른 대표 주소가 다르다 — ${i.googleCanonical.replace('https://klifemap.ai','')}`);
  if (i.referringUrls?.length) console.log(`   들어오는 링크 ${i.referringUrls.length}개`);
}
