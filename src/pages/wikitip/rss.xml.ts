import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

/**
 * K Culture Wire — **피드**. (`/rss.xml`)
 *
 * ── 왜 만드나 (2026-08-07 18:0x, 손님으로 걸어 보고) ────────────
 * 33곳을 걸어 보니 `/rss.xml` 도 `/feed.xml` 도 **404** 였다.
 * 따라 읽을 방법이 하나도 없었다 — 우리 독자는 해외이고,
 * 메일 목록은 이제야 열었고, 그전까지는 **다시 오는 길이 기억뿐**이었다.
 *
 * server.mjs 가 www.kculturewire.com/rss.xml → dist/wikitip/rss.xml 로 보낸다.
 * ⚠ 주소에 내부 접두사 `/wikitip` 을 붙이지 않는다. 사이트맵과 같은 규칙이다.
 *
 * ── ⛔ 본문을 통째로 싣지 않는다 ───────────────────────────────
 * 요약(dek)까지만 싣는다. 본문을 다 실으면 남의 사이트가 우리 글을 그대로 띄우고
 * 우리 지면에는 아무도 안 온다. 우리가 파는 것은 **숫자의 출처**인데
 * 출처·교차검증·제외 항목은 지면에만 있다.
 *
 * ── ⛔ 날짜를 지어내지 않는다 ─────────────────────────────────
 * `pubDate` 만 쓴다. 「지금 시각」을 lastBuildDate 로 넣으면 내용이 안 바뀌어도
 * 매번 새 것처럼 보인다. **가장 최근 기사 날짜**를 쓴다.
 */
const ORIGIN = 'https://www.kculturewire.com';

/** XML 에서 뜻을 갖는 다섯 글자. 안 막으면 제목에 & 하나로 피드가 깨진다. */
const 막기 = (s: string) => s
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

export const GET: APIRoute = async () => {
  const 기사 = (await getCollection('kcwArticles'))
    .filter((e) => !e.data.draft)
    .sort((a, b) => +new Date(b.data.pubDate) - +new Date(a.data.pubDate));

  /* 내용이 안 바뀌면 이 값도 안 바뀐다. 「지금」을 넣지 않는 이유다. */
  const 마지막 = 기사.length ? new Date(기사[0].data.pubDate).toUTCString() : undefined;

  const 항목 = 기사.map((e) => {
    const url = `${ORIGIN}/article/${e.id}`;
    return `  <item>
    <title>${막기(e.data.title)}</title>
    <link>${url}</link>
    <guid isPermaLink="true">${url}</guid>
    <pubDate>${new Date(e.data.pubDate).toUTCString()}</pubDate>
    <category>${막기(e.data.category)}</category>
    <description>${막기(e.data.dek)}</description>
  </item>`;
  }).join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>K Culture Wire</title>
  <link>${ORIGIN}/</link>
  <atom:link href="${ORIGIN}/rss.xml" rel="self" type="application/rss+xml" />
  <description>Korean pop culture, in numbers. We count what public datasets already publish, name every source, and say what we left out.</description>
  <language>en</language>
${마지막 ? `  <lastBuildDate>${마지막}</lastBuildDate>\n` : ''}${항목}
</channel>
</rss>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
