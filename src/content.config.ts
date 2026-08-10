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

/**
 * K Culture Wire 기사. (`content/kculturewire/` · 지면 `/article/<slug>`)
 *
 * ── 왜 위 `articles` 를 같이 안 쓰나 ───────────────────────────
 * `articles` 는 **SeoulMarkets 전용**이다 — category enum 이 금융 축(equities·fx·
 * rates·commodities·funds·macro)이고, 라우트가 `Base.astro`(금융 머리말)에
 * `SITE_URL`(seoulmarkets.com)로 붙는다. K컬처 기사를 거기 넣으면 카테고리가 안 맞고
 * **금융 매체 얼굴로 나간다.** `WikiTip.astro` 를 따로 뗀 것과 같은 이유다.
 *
 * ── 왜 기사가 필요한가 (사장님 지시 2026-08-05 11:30) ──────────
 * 「네가 할 일은 **영어뉴스+데이터가공**이다」 — 지면 7장은 데이터 지면이지 기사가 아니다.
 * 2026-08-06 에 세어 보니 K Culture Wire 기사가 **0편**이었다. 앞 절반을 안 하고 있었다.
 *
 * ── 스키마는 위 `articles` 와 일부러 같은 뼈대다 ────────────────
 * sources·crossChecks·excluded·corrections 를 그대로 가져왔다. **출처 없는 기사를
 * 막는 장치**이고, 두 매체가 같은 규율을 쓰는 편이 낫다. category 만 K컬처 축이다.
 */
const kcwArticles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/kculturewire' }),
  schema: z.object({
    title: z.string().max(120),
    dek: z.string().max(240),
    /**
     * K컬처 1층 갈래. 금융 축과 섞지 않는다.
     * 🔴 2026-08-10 사장님 — 「기존 카테고리는 촌스럽다. **스타·작품·전통문화·산업**으로 하라」
     *   `screen`·`people` 은 **우리끼리 쓰던 말**이었다. 손님이 찾을 때 쓰는 말로 바꾼다.
     * ⛔ `tradition` 은 **하위가 없다**(사장님 못 박으심). 아래 `genre` 를 붙이지 않는다.
     */
    category: z.enum(['stars', 'titles', 'industry', 'tradition']),
    /**
     * 2층 — 대중문화 갈래. **없어도 된다.**
     * ⚠ 우리 넷플릭스 기사 서른 편은 **영화와 드라마를 같이 잰다.** 한쪽에 넣으면 거짓이 된다.
     *   그런 편은 2층 없이 1층에만 선다. 억지로 채우지 않는다.
     */
    genre: z.enum(['music', 'drama', 'film', 'esports']).optional(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    dataAsOf: z.coerce.date(),
    sources: z.array(source).min(1),
    crossChecks: z.array(z.string()).default([]),
    excluded: z.array(z.string()).default([]),
    corrections: z.array(z.object({
      date: z.coerce.date(),
      note: z.string(),
    })).default([]),
    tags: z.array(z.string()).default([]),
    /**
     * 이 기사가 쓴 **지면 주소**들. 지면이 이걸 보고 스스로 기사를 건다.
     *
     * ⚠ 관계를 **지면이 아니라 기사에** 둔다. 지면에 손으로 걸면 다음 기사를 쓸 때 빠진다 —
     *   2026-08-07 에 실제로 12편 중 7편이 아무 지면에도 안 걸려 있었다.
     *   기사를 쓰는 사람은 자기가 어느 자료를 썼는지 알고, 지면은 그걸 읽기만 하면 된다.
     *   그러면 기사를 내는 순간 지면에 저절로 걸린다.
     *
     * ⛔ 빈 배열도 뜻이 있다 — 「어느 지면 자료도 안 썼다」다. 억지로 채우지 않는다.
     */
    pages: z.array(z.string()).default([]),
    author: z.string().default('Newsroom'),
    draft: z.boolean().default(false),
  }),
});

export const collections = { articles, kcwArticles };
