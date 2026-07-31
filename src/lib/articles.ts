import { getCollection } from 'astro:content';
import { byNewest } from './format';

/**
 * 발행된 기사만 최신순으로. draft:true 는 어디에도 노출되지 않는다.
 * (사이트맵·RSS 포함 — 한 군데서만 걸러야 새는 곳이 없다)
 */
export async function publishedArticles(category?: string) {
  const all = await getCollection('articles', ({ data }) => data.draft !== true);
  const list = category ? all.filter((a) => a.data.category === category) : all;
  return list.sort(byNewest);
}
