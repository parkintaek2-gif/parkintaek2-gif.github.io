/**
 * 검색엔진이 우리 지면을 **실제로 가져가고 있는지** 잰다.
 *
 * ⛔ 「색인 몇 건」은 검색엔진 관리도구(로그인)에서만 정확히 보인다. 여기서는 **로그인 없이 되는 것**만 잰다.
 *   ① 사이트맵이 살아 있고 몇 장을 알리고 있나
 *   ② robots.txt 가 막고 있지 않나 · 사이트맵을 가리키고 있나
 *   ③ 지면에 noindex 가 남아 있지 않나
 *   ④ 서버 기록에 검색 크롤러가 실제로 왔나 (있으면)
 *
 * 왜 — 8/5 에 재 보니 **네 사이트 사이 링크가 0개**였고 크롤러가 24시간 동안 **0건**이었다.
 *   사이트맵을 냈다고 가져가는 것이 아니다. **왔는지를 봐야 안다.**
 *
 * 쓰는 법
 *   node scripts/check-indexing.mjs
 *   node scripts/check-indexing.mjs --selftest
 */
export const 사이트들 = [
  { 이름: 'SeoulMarkets', 뿌리: 'https://seoulmarkets.com' },
  { 이름: 'K Culture Wire', 뿌리: 'https://www.kculturewire.com' },
  { 이름: '100 Year Map', 뿌리: 'https://100yearmap.com' },
  { 이름: 'KLifeMap', 뿌리: 'https://klifemap.ai' },
];

/** robots.txt 가 통째로 막고 있는가. `Disallow: /` 가 `User-agent: *` 아래 있으면 막힌 것이다. */
export function 통째로막았나(robots) {
  const 줄 = String(robots).split('\n').map((s) => s.trim());
  let 모두에게 = false;
  for (const s of 줄) {
    const m = s.match(/^user-agent:\s*(.+)$/i);
    if (m) { 모두에게 = m[1].trim() === '*'; continue; }
    if (모두에게 && /^disallow:\s*\/\s*$/i.test(s)) return true;
  }
  return false;
}

export function 사이트맵줄(robots) {
  return String(robots)
    .split('\n')
    .map((s) => s.trim().match(/^sitemap:\s*(\S+)$/i))
    .filter(Boolean)
    .map((m) => m[1]);
}

/** 사이트맵 XML 에서 <loc> 개수를 센다. 색인 사이트맵이면 그 안의 사이트맵 수를 센다. */
export function 지면수(xml) {
  const 색인 = /<sitemapindex/i.test(xml);
  const n = (xml.match(/<loc>/g) || []).length;
  return { 색인, 수: n };
}

export function noindex있나(html) {
  return /<meta[^>]+name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html);
}

async function 받기(u) {
  try {
    const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; klifedesign-check/1.0)' } });
    return { 상태: r.status, 글: r.ok ? await r.text() : '' };
  } catch (e) {
    return { 상태: 0, 글: '', 오류: e.message };
  }
}

if (process.argv.includes('--selftest')) {
  const 잰다 = [];
  const 봄 = (이름, 본것, 바란것) => {
    const 같다 = JSON.stringify(본것) === JSON.stringify(바란것);
    잰다.push(같다);
    console.log(`${같다 ? '✅' : '❌'} ${이름}${같다 ? '' : `\n   본 것 ${JSON.stringify(본것)}\n   바란 것 ${JSON.stringify(바란것)}`}`);
  };
  봄('모두에게 막은 것을 잡는다', 통째로막았나('User-agent: *\nDisallow: /'), true);
  봄('일부만 막은 것은 통째가 아니다', 통째로막았나('User-agent: *\nDisallow: /admin/'), false);
  봄('⚠ 특정 봇만 막은 것은 통째가 아니다', 통째로막았나('User-agent: GPTBot\nDisallow: /'), false);
  봄('사이트맵 줄을 뽑는다', 사이트맵줄('Sitemap: https://a.com/sitemap.xml'), ['https://a.com/sitemap.xml']);
  봄('사이트맵이 없으면 빈 배열', 사이트맵줄('User-agent: *'), []);
  봄('loc 를 센다', 지면수('<urlset><loc>a</loc><loc>b</loc></urlset>'), { 색인: false, 수: 2 });
  봄('색인 사이트맵을 가린다', 지면수('<sitemapindex><loc>a</loc></sitemapindex>'), { 색인: true, 수: 1 });
  봄('noindex 를 잡는다', noindex있나('<meta name="robots" content="noindex, follow">'), true);
  봄('index 는 안 잡는다', noindex있나('<meta name="robots" content="index, follow">'), false);
  const 틀린것 = 잰다.filter((x) => !x).length;
  console.log(틀린것 ? `\n❌ ${틀린것}개 어긋났다` : `\n✅ ${잰다.length}개 다 맞다`);
  process.exit(틀린것 ? 1 : 0);
}

console.log('검색엔진이 가져갈 수 있는 상태인가 — 실측\n');
let 탈난곳 = 0;
for (const s of 사이트들) {
  console.log(`■ ${s.이름}  ${s.뿌리}`);
  const 뿌리 = await 받기(s.뿌리 + '/');
  console.log(`   첫 화면   ${뿌리.상태}${noindex있나(뿌리.글) ? '  ⛔ noindex 가 걸려 있다' : ''}`);
  if (noindex있나(뿌리.글)) 탈난곳++;

  const rb = await 받기(s.뿌리 + '/robots.txt');
  if (rb.상태 !== 200) {
    console.log(`   robots    ⛔ ${rb.상태} — 없다`);
    탈난곳++;
  } else {
    const 막힘 = 통째로막았나(rb.글);
    const 맵 = 사이트맵줄(rb.글);
    console.log(`   robots    200${막힘 ? '  ⛔ 통째로 막혀 있다' : ''}${맵.length ? '' : '  ⛔ 사이트맵 줄이 없다'}`);
    if (막힘 || !맵.length) 탈난곳++;
    for (const u of 맵) {
      const m = await 받기(u);
      if (m.상태 !== 200) { console.log(`   사이트맵  ⛔ ${m.상태}  ${u}`); 탈난곳++; continue; }
      const { 색인, 수 } = 지면수(m.글);
      console.log(`   사이트맵  200  ${색인 ? `색인 ${수}개` : `지면 ${수}장`}  ${u}`);
    }
  }
  console.log('');
}
console.log(탈난곳 ? `⛔ 막히거나 빠진 곳 ${탈난곳}개` : '✅ 네 사이트 다 가져갈 수 있는 상태다');
console.log('\n⚠ 「가져갈 수 있다」와 「가져갔다」는 다르다. 실제 색인 수는 검색엔진 관리도구에서만 보인다.');
