/**
 * 검색엔진 색인 점검 — **구글·네이버·빙을 매일 잰다.**
 *
 *   npm run check:index              전 사이트
 *   npm run check:index -- --host 100yearmap.com
 *
 * ── 왜 만드나 ────────────────────────────────────────────────
 * 사장님 지시(2026-08-06): **「그 검색엔진들 매일 챙겨. 구글도 그렇고 네이버도 그렇고
 *   **특히 한글사이트는 네이버 꼭** 챙기고」**
 *
 * 그날 실측 — **한글 사이트가 네이버에 하나도 안 올라가 있었다.**
 * ```
 * 100yearmap.com    네이버 색인 **0건**   (소유확인 태그는 라이브에 있었다)
 * seoulmarkets.com  네이버 색인 **0건**
 * klifemap.ai       홈 1건만
 * ```
 *
 * 🔴 **구글과 네이버는 다르다.**
 *   구글은 `robots.txt` 의 `Sitemap:` 줄을 보고 **스스로 찾아온다.**
 *   네이버는 **서치어드바이저에 사이트맵을 제출해야** 수집이 시작된다.
 *   그래서 robots.txt 만 맞춰 놓고 「됐다」고 하면 네이버에서는 영원히 0 이다.
 *
 * ⚠ **검색 유입이 우리의 유일한 마케팅 채널이다.** 색인이 0 이면 발행은 없는 것과 같다.
 *   8/6 실측에서 사람 방문 277명 중 **검색 유입 0%** 였다.
 *
 * ── 재는 방법 ────────────────────────────────────────────────
 * `site:` 검색으로 **바깥에서** 잰다. 콘솔 로그인 없이 매일 돌릴 수 있어야 하기 때문이다.
 * ⚠ 이 숫자는 **하한**이다. 검색엔진이 보여 주는 만큼만 세므로 실제 색인 수보다 적을 수 있다.
 *   추세를 보는 용도다 — 0 → 1 이 되는 순간을 잡는 것이 목적이지 정확한 총수가 아니다.
 */

const 사이트들 = [
  { host: '100yearmap.com', 이름: '백년지도', 한글: true, 담당: '3번' },
  { host: 'seoulmarkets.com', 이름: '서울마켓', 한글: false, 담당: '6번' },
  { host: 'www.kculturewire.com', 이름: 'K Culture Wire', 한글: false, 담당: '5번' },
  { host: 'klifemap.ai', 이름: 'KLifeMap', 한글: true, 담당: '1번' },
];

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

/** 한 번 가져온다. 실패해도 전체를 멈추지 않는다 — 하나가 막혀도 나머지는 재야 한다 */
async function 가져오기(url) {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
    return await r.text();
  } catch (e) {
    return null;
  }
}

async function 네이버(host) {
  const html = await 가져오기(
    `https://search.naver.com/search.naver?query=${encodeURIComponent('site:' + host)}`,
  );
  if (html == null) return { 수: null, 메모: '요청 실패' };
  if (/검색결과가 없습니다|검색결과 없음/.test(html)) return { 수: 0, 메모: '' };
  const 링크 = new Set(
    (html.match(new RegExp(`https?://[a-z0-9.-]*${host.replace(/\./g, '\\.')}[^"'<> ]*`, 'gi')) ?? [])
      .map((u) => u.replace(/[),.]+$/, '')),
  );
  return { 수: 링크.size, 메모: '' };
}

async function 빙(host) {
  const html = await 가져오기(`https://www.bing.com/search?q=${encodeURIComponent('site:' + host)}`);
  if (html == null) return { 수: null, 메모: '요청 실패' };
  const 링크 = new Set(
    (html.match(new RegExp(`https?://[a-z0-9.-]*${host.replace(/\./g, '\\.')}[^"'<> ]*`, 'gi')) ?? [])
      .map((u) => u.replace(/[),.]+$/, '')),
  );
  return { 수: 링크.size, 메모: '' };
}

/**
 * 🔴 **구글은 `site:` 로 못 잰다.** 0 으로 세지 않는다.
 *
 * 2026-08-06 실측 — 응답이 90KB 나 오는데 본문이 `enablejs` 다.
 * **차단이 아니라 JS 없이는 결과를 렌더하지 않는 것**이다. 그래서 링크가 0개로 잡힌다.
 * 이걸 「색인 0」으로 적으면 **멀쩡한 사이트를 문제로 보고**하게 된다.
 * 실제로 seoulmarkets 에는 8/5 에 구글 크롤러가 451건 왔다 — 0 일 리가 없다.
 *
 * **구글 색인 수는 Search Console 「페이지」 화면에서 본다.** 여기서는 「못 잼」으로 남긴다.
 */
async function 구글(host) {
  const html = await 가져오기(`https://www.google.com/search?q=${encodeURIComponent('site:' + host)}`);
  if (html == null) return { 수: null, 메모: '요청 실패' };
  if (/unusual traffic|자동화된 쿼리|captcha/i.test(html)) return { 수: null, 메모: '막힘' };
  if (/enablejs|Please click here if you are not redirected/i.test(html))
    return { 수: null, 메모: 'JS필요' };
  const 링크 = new Set(
    (html.match(new RegExp(`https?://[a-z0-9.-]*${host.replace(/\./g, '\\.')}[^"'<> ]*`, 'gi')) ?? [])
      .map((u) => u.replace(/[),.]+$/, '')),
  );
  /* 링크가 0 이면 「없다」가 아니라 「못 읽었다」로 본다 — 위 사유 그대로다 */
  return 링크.size === 0 ? { 수: null, 메모: '못잼' } : { 수: 링크.size, 메모: '' };
}

/** 사이트맵이 실제로 열리는가 · 몇 장인가. 색인이 0 일 때 원인을 여기서 가른다 */
async function 사이트맵(host) {
  const xml = await 가져오기(`https://${host}/sitemap.xml`);
  if (xml == null) return { 장수: null, 메모: '요청 실패' };
  if (/<html/i.test(xml)) return { 장수: 0, 메모: '404(HTML 이 왔다)' };
  const loc = (xml.match(/<loc>/g) ?? []).length;
  const 색인파일 = /<sitemapindex/i.test(xml);
  return { 장수: loc, 메모: 색인파일 ? '색인파일(하위 있음)' : '' };
}

async function robots(host) {
  const t = await 가져오기(`https://${host}/robots.txt`);
  if (t == null) return { 사이트맵줄: null };
  return { 사이트맵줄: /^\s*Sitemap:/im.test(t) };
}

const 칸 = (v, w) => String(v ?? '—').padStart(w);

const 고른호스트 = (() => {
  const i = process.argv.indexOf('--host');
  return i > 0 ? process.argv[i + 1] : null;
})();

const 돌릴것 = 고른호스트 ? 사이트들.filter((s) => s.host === 고른호스트) : 사이트들;
if (!돌릴것.length) {
  console.error(`모르는 호스트: ${고른호스트}`);
  console.error(`아는 것 — ${사이트들.map((s) => s.host).join(' · ')}`);
  process.exit(1);
}

console.log(`\n검색엔진 색인 점검 — ${new Date().toLocaleString('ko-KR')}\n`);
console.log('  사이트              한글  사이트맵   robots  네이버   빙    구글   담당');
console.log('  ' + '─'.repeat(74));

const 문제 = [];

for (const s of 돌릴것) {
  const [sm, rb, nv, bg, gg] = await Promise.all([
    사이트맵(s.host),
    robots(s.host),
    네이버(s.host),
    빙(s.host),
    구글(s.host),
  ]);

  console.log(
    `  ${s.이름.padEnd(16)}${s.한글 ? ' 🇰🇷 ' : '    '}${칸(sm.장수, 7)}${칸(
      rb.사이트맵줄 === true ? '있음' : rb.사이트맵줄 === false ? '없음' : null,
      8,
    )}${칸(nv.수, 8)}${칸(bg.수, 6)}${칸(gg.수 ?? gg.메모, 7)}   ${s.담당}`,
  );

  /* ⚠ **0 과 「못 쟀다」를 섞지 않는다.** 구글이 막으면 null 이지 0 이 아니다 */
  if (sm.장수 === 0) 문제.push(`${s.이름} — 사이트맵이 없다 (${sm.메모})`);
  if (rb.사이트맵줄 === false) 문제.push(`${s.이름} — robots.txt 에 Sitemap 줄이 없다`);
  if (nv.수 === 0) {
    문제.push(
      `${s.이름} — **네이버 색인 0건**` +
        (s.한글 ? ' 🔴 한글 사이트라 특히 급하다' : '') +
        ' → 서치어드바이저에 사이트맵 제출이 필요하다',
    );
  }
  if (bg.수 === 0) 문제.push(`${s.이름} — 빙 색인 0건 → IndexNow 통보를 확인한다`);
}

console.log();

if (문제.length) {
  console.log('🔴 문제\n');
  문제.forEach((m) => console.log('  · ' + m));
  console.log(`
  ── 네이버는 구글과 다르다 ──────────────────────────────
  구글   robots.txt 의 Sitemap: 줄을 보고 **스스로 찾아온다**
  네이버 **서치어드바이저에 사이트맵을 제출해야** 수집이 시작된다
         https://searchadvisor.naver.com/  → 사이트 선택 → 요청 → 사이트맵 제출
         그다음 「웹페이지 수집」으로 대표 주소를 한 번 밀어 넣는다
`);
} else {
  console.log('✅ 문제 없음 — 전 사이트가 색인돼 있다\n');
}

console.log(
  `  ⚠ 이 숫자는 **하한**이다. 검색엔진이 보여 주는 만큼만 센다.\n` +
    `    추세를 보는 용도다 — 0 → 1 이 되는 순간을 잡는 것이 목적이다.\n`,
);
