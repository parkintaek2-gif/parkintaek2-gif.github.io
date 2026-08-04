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
    category: z.enum(['equities', 'fx', 'rates', 'commodities', 'funds', 'macro']),
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
    /**
     * ⭐ **정정 기록.** 낸 뒤에 숫자가 바뀌면 **조용히 고치지 않는다.**
     *
     * 우리가 파는 것은 숫자의 신뢰다. 신뢰는 「틀린 적 없다」로 생기지 않는다 —
     * 아무도 그걸 안 믿는다. **틀렸을 때 어떻게 하는지**로 생긴다.
     * 고친 자국이 남아 있는 표가, 자국이 없는 표보다 믿을 만하다.
     *
     * 2026-08-05 에 처음 필요해졌다 — 직원 수 집계 버그로 이미 낸 기사 셋의
     * 숫자가 바뀌었다. 그때 **적을 자리가 없다는 걸 알았다.**
     */
    corrections: z.array(z.object({
      date: z.coerce.date(),
      /** 무엇이 어떻게 바뀌었나. 「수정함」 같은 말로 때우지 않는다 */
      note: z.string(),
    })).default([]),
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
