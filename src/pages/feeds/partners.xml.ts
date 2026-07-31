import type { APIContext } from 'astro';
import { SITE, SITE_URL, PUBLISHER, DISCLAIMER } from '../../consts';
import { publishedArticles } from '../../lib/articles';
import { categoryLabel } from '../../lib/format';

/**
 * 파트너 신디케이션 피드 — MSN Partner Hub · SmartNews · Flipboard 용.
 *
 * `/rss.xml` 과 왜 나눠 두는가
 *   /rss.xml         요약(dek)만 준다. 독자를 우리 사이트로 오게 하는 티저다.
 *   /feeds/partners  **본문 전문**을 준다. MSN 은 「full-length content」 옆에 광고를
 *                    붙이고 그 수익을 나눈다. 요약만 주면 배분 대상이 아니다.
 *
 * 즉 목적이 반대라서 한 피드로 못 겸한다. 잘못 합치면 둘 다 손해다.
 *
 * 담는 것과 이유
 *   content:encoded  본문 전문. MSN 수익배분의 전제
 *   media:content    대표 이미지. SmartNews 가 이미지 없는 항목을 걸러낸다
 *   dc:creator       저자. YMYL 심사에서 저자 표기가 없으면 감점된다
 *   투자자문 아님 고지  본문 끝에 붙인다 — 남의 화면에 실릴 때도 따라가야 한다
 *
 * ⚠ 이 피드는 남의 플랫폼에 그대로 실린다. 한글이 섞이면 그대로 노출된다.
 */

const esc = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** CDATA 안에서 유일하게 위험한 것은 종료 시퀀스뿐이다. 그것만 쪼갠다. */
const cdata = (s: string) => `<![CDATA[${s.replace(/\]\]>/g, ']]]]><![CDATA[>')}]]>`;

/** 본문의 상대경로를 절대 URL 로. 남의 도메인에서 렌더되므로 상대경로는 깨진다. */
function absolutize(html: string, base: string) {
  return html
    .replace(/(<a\b[^>]*\bhref=")\/(?!\/)/g, `$1${base}/`)
    .replace(/(<img\b[^>]*\bsrc=")\/(?!\/)/g, `$1${base}/`);
}

export async function GET(context: APIContext) {
  const base = (context.site?.href ?? SITE_URL).replace(/\/$/, '');
  const articles = await publishedArticles();

  const items = articles
    .map((a) => {
      const url = `${base}/article/${a.id}`;
      // glob 로더는 빌드 때 렌더한 HTML 을 엔트리에 담아 둔다.
      // 없으면(형식 변경 등) 요약으로 떨어뜨린다 — 피드가 깨지는 것보다 낫다.
      const body: string = (a as unknown as { rendered?: { html?: string } }).rendered?.html ?? '';
      const html =
        (body ? absolutize(body, base) : `<p>${esc(a.data.dek)}</p>`) +
        `<p><em>${esc(DISCLAIMER.short)} ${esc(DISCLAIMER.long)}</em></p>`;

      const media = a.data.image
        ? `\n      <media:content url="${esc(base + a.data.image)}" medium="image" />` +
          `\n      <media:thumbnail url="${esc(base + a.data.image)}" />`
        : '';

      return `    <item>
      <title>${esc(a.data.title)}</title>
      <link>${esc(url)}</link>
      <guid isPermaLink="true">${esc(url)}</guid>
      <pubDate>${a.data.pubDate.toUTCString()}</pubDate>
      <dc:creator>${esc(a.data.author)}</dc:creator>
      <category>${esc(categoryLabel(a.data.category))}</category>
      <description>${esc(a.data.dek)}</description>
      <content:encoded>${cdata(html)}</content:encoded>${media}
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:media="http://search.yahoo.com/mrss/"
     xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(SITE.name)}</title>
    <link>${esc(base)}</link>
    <description>${esc(SITE.description)}</description>
    <language>en-us</language>
    <copyright>© ${new Date().getFullYear()} ${esc(PUBLISHER.legalName)}</copyright>
    <managingEditor>${esc(PUBLISHER.email)} (${esc(SITE.name)} Newsroom)</managingEditor>
    <atom:link href="${esc(base)}/feeds/partners.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
