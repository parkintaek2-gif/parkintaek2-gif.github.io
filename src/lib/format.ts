import { CATEGORIES, type CategorySlug } from '../consts';

const DATE = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'Asia/Seoul',
});

function stamp(d: Date, timeZone: string) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  }).format(d);
}

/** 발행일 표기. 예: Jul 31, 2026 */
export const formatDate = (d: Date) => DATE.format(d);

/**
 * 데이터 기준시각. 한국 데이터를 미국 독자가 읽으므로 KST/ET를 병기한다.
 * 예: Jul 30, 2026, 3:30 PM KST · Jul 30, 2026, 2:30 AM ET
 */
export const formatAsOf = (d: Date) =>
  `${stamp(d, 'Asia/Seoul')} KST · ${stamp(d, 'America/New_York')} ET`;

/** 기계용 ISO 문자열 */
export const iso = (d: Date) => d.toISOString();

export function categoryLabel(slug: CategorySlug | string) {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}

/**
 * 빌드 시 Astro.url.pathname 은 `/equities.html` 처럼 파일명이 그대로 들어온다.
 * 실제 서비스 URL(`/equities`)과 다르므로 canonical·nav 비교 전에 반드시 정리한다.
 * 여기가 어긋나면 canonical 과 사이트맵이 서로 다른 URL을 가리켜 색인이 갈린다.
 */
export function cleanPath(pathname: string) {
  const p = pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '').replace(/\/$/, '');
  return p === '' ? '/' : p;
}

/** 최신순 정렬 */
export function byNewest<T extends { data: { pubDate: Date } }>(a: T, b: T) {
  return b.data.pubDate.valueOf() - a.data.pubDate.valueOf();
}
