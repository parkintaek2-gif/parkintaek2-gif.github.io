import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { SITE, SITE_URL } from '../consts';
import { publishedArticles } from '../lib/articles';
import { categoryLabel } from '../lib/format';

/**
 * 신디케이션 네트워크(Benzinga·IBN 등)가 물어가는 통로.
 * 본문 전문은 넣지 않는다 — 원문 트래픽을 우리 사이트로 돌린다.
 */
export async function GET(context: APIContext) {
  const articles = await publishedArticles();

  return rss({
    title: SITE.name,
    description: SITE.description,
    site: context.site ?? SITE_URL,
    trailingSlash: false,
    items: articles.map((a) => ({
      title: a.data.title,
      description: a.data.dek,
      pubDate: a.data.pubDate,
      link: `/article/${a.id}`,
      categories: [categoryLabel(a.data.category), ...a.data.tags],
      customData: `<source-asof>${a.data.dataAsOf.toISOString()}</source-asof>`,
    })),
    customData: `<language>en-us</language><copyright>© ${new Date().getFullYear()} ${SITE.name}</copyright>`,
  });
}
