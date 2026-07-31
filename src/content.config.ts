import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * 기사 frontmatter 스키마.
 * 기사 생성 스킬은 이 필드들을 채워서 /content/articles/{slug}.md 로 저장하면 된다.
 * 필드가 빠지면 빌드가 실패한다 — 의도한 것이다. 출처 없는 기사를 막는 장치다.
 */
const source = z.object({
  /** 데이터를 발표한 기관. 예: 'Financial Services Commission (Korea)' */
  org: z.string(),
  /** 구체적 데이터셋/API 이름. 예: 'Stock Price Information Open API' */
  api: z.string(),
  /** 출처 URL (선택) */
  url: z.string().url().optional(),
});

const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/articles' }),
  schema: z.object({
    title: z.string().max(120),
    /** 카드·기사 상단에 한 줄로 붙는 부제 */
    dek: z.string().max(240),
    category: z.enum(['equities', 'commodities', 'macro']),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    /**
     * 데이터 기준시각. 공공데이터포털 시세는 T+1이므로
     * 발행일과 다른 것이 정상이다. ISO8601 + 타임존 표기를 권장.
     */
    dataAsOf: z.coerce.date(),
    /** 최소 1건 — 출처 없는 기사는 발행하지 않는다 */
    sources: z.array(source).min(1),
    /** 교차검증한 항목 */
    crossChecks: z.array(z.string()).default([]),
    /** 확인이 안 돼 기사에서 뺀 수치 */
    excluded: z.array(z.string()).default([]),
    /** 언급 종목 코드 (선택) */
    tickers: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    author: z.string().default('Newsroom'),
    /** OG 이미지 경로 (/public 기준). 없으면 자동 생성 카드 사용 */
    image: z.string().optional(),
    /** true 면 빌드에서 제외 */
    draft: z.boolean().default(false),
  }),
});

export const collections = { articles };
