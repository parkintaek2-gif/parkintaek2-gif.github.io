/**
 * OpenAPI 3.0.3 명세 — `/v1/openapi.json`
 * (3.1 이 아닌 이유는 아래 openapi 필드의 주석에 있다)
 *
 * ── 왜 필요한가 ────────────────────────────────────────────────
 * RapidAPI·AWS·Snowflake 는 명세를 주면 엔드포인트·파라미터·응답을 **자동으로 읽어**
 * 리스팅과 클라이언트 SDK 를 만들어 준다. 손으로 입력할 것이 없어진다.
 *
 * 그리고 앞뒤가 맞아야 한다 — klifemap 세션에 「B2B API 를 파는데 사려는 사람이
 * 명세를 못 읽는다」고 지적해 놓고 우리가 없으면 같은 말을 우리가 듣는다.
 *
 * ── 왜 파일이 아니라 코드로 만드는가 ───────────────────────────
 * 정적 JSON 파일로 두면 **코드가 바뀔 때 같이 안 바뀐다.** 오늘만 해도
 * `/api` 페이지의 예제가 실제 응답과 어긋난 적이 있고, 없는 npm 패키지를
 * 설치하라고 적은 적이 있다. 문서와 실물이 갈라지는 것이 이 프로젝트의
 * 반복되는 실패 방식이다.
 * 여기서는 사전 통계(DICT_STATS)를 실제 사전에서 읽어 넣는다 — 사전을 늘리면
 * 명세의 설명도 같이 늘어난다.
 */

import { DICT_STATS } from './trade-dict.mjs';
import stats from '../data/research-stats.json' with { type: 'json' };

const ERROR_SCHEMA = {
  type: 'object',
  properties: {
    error: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description:
            'Machine-readable reason. Branch on this, not on message — messages are written for people and may be reworded.',
          examples: ['collection_not_started', 'invalid_hs_code', 'unknown_endpoint'],
        },
        message: { type: 'string' },
        hint: { type: 'string' },
      },
      required: ['code', 'message'],
    },
  },
};

const SOURCE_SCHEMA = {
  type: 'object',
  description: 'Every response names where its facts come from.',
  properties: { agency: { type: 'string' }, system: { type: 'string' } },
};

export function openapi(baseUrl) {
  return {
    /*
     * ⚠ 2026-08-03 KST — **3.1 이 아니라 3.0.3 이다. 일부러 낮췄다.**
     *
     *   RapidAPI 에 이 명세를 올렸더니 임포터가 통째로 실패했다.
     *     [GraphQL error] Path: createApisFromSpecs — "An unknown internal error occured"
     *
     *   원인은 3.1 전용 문법이었다 — `type: ["string","null"]` 과 `info.summary`.
     *   3.1 이 더 정확한 규격이지만, **이 파일이 존재하는 이유는 마켓플레이스가 읽는 것**이다.
     *   읽히지 않는 정확함은 쓸모가 없다. 3.0.3 으로 쓰고 null 은 nullable 로 표현한다.
     *
     *   RapidAPI 가 3.1 을 지원하면 되돌린다. 그전에 올리지 말 것.
     */
    openapi: '3.0.3',
    info: {
      title: 'SeoulMarkets Data API',
      version: '1.0.0',
      description: [
        'Korean official statistics, normalised to English. JSON only.',
        '',
        'Korea publishes monthly trade figures the day after the month ends, and provisional',
        'figures three times a month. Bloomberg counts Korean trade among its twelve key global',
        'economic indicators. The headline number is reported everywhere; the product-level',
        'detail is not, because the official feed returns XML with Korean-language product and',
        'country names and no English classification attached.',
        '',
        'This API is that missing layer.',
        '',
        `The classification endpoints (${DICT_STATS.chapters} HS chapters, ${DICT_STATS.headings} headings,`,
        `${DICT_STATS.countries} countries) are live and free. The trade series open when collection`,
        'begins — until then they return 404 with a machine-readable reason rather than an empty',
        'array, because "not collected yet" and "no trade occurred" are different answers.',
        '',
        'We do not guess. A code outside our dictionary returns null for its description with',
        '`resolved: false`, never a plausible-sounding label.',
      ].join('\n'),
      contact: { name: 'SeoulMarkets', email: 'sibcheongan@gmail.com', url: `${baseUrl}/api` },
      license: {
        name: 'Source data published by Korean agencies under an unrestricted-use licence',
        url: `${baseUrl}/about`,
      },
    },
    servers: [{ url: `${baseUrl}/v1`, description: 'Production' }],
    tags: [
      { name: 'Classification', description: 'Resolve HS codes and country codes to English. Free, no key.' },
      {
        name: 'Reference',
        description:
          'Dictionaries that make the data readable outside Korea. Built while counting 20 years of reports; no public equivalent exists.',
      },
      {
        name: 'Research',
        description:
          `Every target price and rating issued by Korean brokerages, ${stats.first_day.slice(0, 4)}-${stats.latest_day.slice(0, 4)}. ${stats.records.toLocaleString('en-US')} records. This is the only place the series exists in English.`,
      },
      { name: 'Trade', description: "Korea's customs trade series." },
      { name: 'Meta', description: 'Coverage, schema policy and collection status.' },
    ],
    paths: {
      '/hs/{code}': {
        get: {
          tags: ['Classification'],
          operationId: 'getHsCode',
          summary: 'Resolve an HS code to its English description',
          description:
            'Accepts 2, 4, 6 or 10 digits. Chapter names follow the WCO Harmonized System; headings cover the products that dominate Korean trade.',
          parameters: [
            {
              name: 'code',
              in: 'path',
              required: true,
              schema: { type: 'string', pattern: '^[0-9]{2,10}$' },
              examples: {
                semiconductors: { value: '8542', summary: 'Electronic integrated circuits' },
                batteries: { value: '8507', summary: 'Electric accumulators' },
                albums: { value: '8523', summary: 'Discs, tapes and solid-state storage' },
              },
            },
          ],
          responses: {
            200: {
              description: 'Resolved code. Check `resolved` before displaying `label`.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      code: { type: 'string' },
                      digits: { type: 'integer', enum: [2, 4, 6, 10] },
                      chapter: {
                        type: 'object',
                        properties: { code: { type: 'string' }, name: { type: 'string', nullable: true } },
                      },
                      heading: {
                        type: 'object', nullable: true,
                        properties: { code: { type: 'string' }, name: { type: 'string', nullable: true } },
                      },
                      label: {
                        type: 'string', nullable: true,
                        description: 'Null when the code is not in our dictionary. We do not guess.',
                      },
                      resolved: { type: 'boolean' },
                      source: SOURCE_SCHEMA,
                    },
                  },
                  example: {
                    code: '8542',
                    digits: 4,
                    chapter: { code: '85', name: 'Electrical machinery and equipment and parts thereof' },
                    heading: { code: '8542', name: 'Electronic integrated circuits' },
                    label: 'Electronic integrated circuits',
                    resolved: true,
                    source: { agency: 'World Customs Organization', system: 'Harmonized System' },
                  },
                },
              },
            },
            400: { description: 'Malformed code', content: { 'application/json': { schema: ERROR_SCHEMA } } },
          },
        },
      },
      '/hs': {
        get: {
          tags: ['Classification'],
          operationId: 'searchHs',
          summary: 'Search the classification in English',
          description: 'Singular and plural both work — `battery` finds `batteries`.',
          parameters: [
            {
              name: 'q',
              in: 'query',
              required: true,
              schema: { type: 'string', minLength: 2 },
              examples: {
                battery: { value: 'battery' },
                semiconductor: { value: 'semiconductor' },
                cosmetics: { value: 'cosmetic' },
              },
            },
          ],
          responses: {
            200: {
              description: 'Matches, chapters first',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      query: { type: 'string' },
                      count: { type: 'integer' },
                      results: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            code: { type: 'string' },
                            level: { type: 'integer', enum: [2, 4] },
                            name: { type: 'string' },
                          },
                        },
                      },
                      source: SOURCE_SCHEMA,
                    },
                  },
                },
              },
            },
            400: { description: 'Query too short', content: { 'application/json': { schema: ERROR_SCHEMA } } },
          },
        },
      },
      /* ⚠ 2026-08-03 KST — 이게 명세에서 통째로 빠져 있었다.
         66,071건짜리 간판 엔드포인트인데 스펙만 읽는 개발자에게는 **없는 기능**이었다.
         RapidAPI 는 명세로 리스팅을 만든다 — 안 적힌 것은 팔리지 않는다. */
      '/research': {
        get: {
          tags: ['Research'],
          operationId: 'listResearch',
          summary: 'Brokerage target prices and ratings, 2007-2026',
          description: [
            'Every target price and investment rating issued by Korean brokerages that we have',
            `collected: ${stats.records.toLocaleString('en-US')} records across 20 years, normalised to English.`,
            '',
            'Three normalisations matter, and each is exposed as an added field beside the raw one:',
            '',
            '- `brokerEntity` — a stable id per legal entity. Korean brokerages rename often, and one',
            '  firm appears under up to four Korean names in the archive. Group by this, not by `broker`.',
            '- `ratingNormalised` — 22 source spellings (Korean, English, mixed case, one typo, one',
            '  truncation) folded into 8 levels. `Outperform` is deliberately kept below `Buy`;',
            '  in Korea it is one notch down, not a synonym.',
            '- `subjectEn` — official English company name. A company sets its own spelling',
            '  (SK hynix, NCSOFT, AMOREPACIFIC), so this cannot be derived by rule.',
            '',
            'Fields that are unknown are `null`. We never fill a gap with a plausible-looking value.',
            'Report text and PDFs are not collected, so nothing copyrighted is redistributed —',
            'these are facts about what was published, not the publications.',
          ].join('\n'),
          parameters: [
            {
              name: 'broker',
              in: 'query',
              schema: { type: 'string' },
              description:
                'Korean name, English name, or entity id. All three resolve to the same firm, and a match returns every historical name of that entity — querying "Mirae Asset" also returns its Daewoo Securities-era reports.',
              examples: {
                english: { value: 'Mirae Asset' },
                entity: { value: 'mirae-asset' },
                korean: { value: '미래에셋' },
              },
            },
            {
              name: 'subject',
              in: 'query',
              schema: { type: 'string' },
              description: 'Company covered by the report. Korean name as filed.',
            },
            {
              name: 'since',
              in: 'query',
              schema: { type: 'string', format: 'date' },
              description:
                'Earliest report date, YYYY-MM-DD. Note the archive is sparse before 2014 — see GET /meta.',
            },
            {
              name: 'rating',
              in: 'query',
              schema: {
                type: 'string',
                enum: ['buy', 'outperform', 'hold', 'neutral', 'marketperform', 'underperform', 'sell', 'unknown'],
              },
              description: 'Filter on the normalised level, not the broker wording. Unknown values return 400 with the valid list.',
            },
            {
              name: 'stance',
              in: 'query',
              schema: { type: 'string', enum: ['positive', 'neutral', 'negative'] },
              description:
                'Coarser than rating. Useful context: 94.1% of rated reports are positive and 0.16% negative — 89 negative records in 20 years.',
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 50, maximum: 200 },
              description: 'Newest first.',
            },
          ],
          responses: {
            200: {
              description: 'Matching reports. A filter that matches nothing is 200 with count 0 — not an error.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      count: { type: 'integer' },
                      as_of: { type: 'string' },
                      results: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            date: { type: 'string', format: 'date' },
                            broker: { type: 'string', description: 'Korean name exactly as filed.' },
                            brokerEn: { type: 'string', nullable: true },
                            brokerEntity: {
                              type: 'string', nullable: true,
                              description: 'Stable across renames. Group by this.',
                            },
                            brokerType: {
                              type: 'string', nullable: true,
                              enum: ['brokerage', 'credit-rating', 'ir-service'],
                              description:
                                'Explains a null target price: credit-rating and IR bodies publish analysis without one (4,164 records).',
                            },
                            subject: { type: 'string' },
                            subjectEn: { type: 'string', nullable: true, description: 'null when not yet in the dictionary.' },
                            targetPrice: {
                              type: 'integer', nullable: true,
                              description: 'KRW. null means no target was published — not zero.',
                            },
                            rating: { type: 'string', nullable: true, description: 'The broker’s own wording.' },
                            ratingNormalised: {
                              type: 'object',
                              properties: {
                                code: { type: 'string' },
                                label: { type: 'string' },
                                score: {
                                  type: 'integer',
                                  description: 'Our ordering for aggregation. Not a number the broker assigned.',
                                },
                                stance: { type: 'string', enum: ['positive', 'neutral', 'negative'] },
                                raw: { type: 'string', nullable: true },
                              },
                            },
                            analyst: { type: 'string', nullable: true },
                            detailFetched: {
                              type: 'boolean',
                              description: 'false means the target price was never fetched, not that none exists.',
                            },
                            source: SOURCE_SCHEMA,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            400: {
              description: 'Unknown rating or stance. The hint lists the valid values.',
              content: { 'application/json': { schema: ERROR_SCHEMA } },
            },
            404: {
              description: 'Index not available. Distinct from "your filter matched nothing".',
              content: { 'application/json': { schema: ERROR_SCHEMA } },
            },
          },
        },
      },
      '/institutions': {
        get: {
          tags: ['Reference'],
          operationId: 'getInstitutions',
          summary: 'Korean research institutions, in English',
          description:
            'Official English names, rename history and institution type. Korean brokerages rename often and our archive spans 2007-2026, so one firm appears under several names — group by `entity`, which is stable across renames. Not every institution is a brokerage: credit-rating and IR bodies publish company analysis without target prices, which is why some records have a null target price.',
          parameters: [
            {
              name: 'type',
              in: 'query',
              schema: { type: 'string', enum: ['brokerage', 'credit-rating', 'ir-service'] },
              description: 'Filter by institution type',
            },
          ],
          responses: { 200: { description: 'Institution dictionary' } },
        },
      },
      '/countries': {
        get: {
          tags: ['Classification'],
          operationId: 'listCountries',
          summary: 'Partner country codes with English names',
          responses: {
            200: {
              description: 'ISO 3166-1 alpha-2 codes',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      count: { type: 'integer' },
                      results: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: { code: { type: 'string' }, name: { type: 'string' } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/meta': {
        get: {
          tags: ['Meta'],
          operationId: 'getMeta',
          summary: 'Coverage, schema policy and what has actually been collected',
          description:
            'Check `datasets[name].collected` before relying on a series. `contract` states the schema stability promise.',
          responses: { 200: { description: 'Service metadata' } },
        },
      },
      '/trade/flash': {
        get: {
          tags: ['Trade'],
          operationId: 'getTradeFlash',
          summary: "Korea's 10-day provisional trade figures",
          description:
            'Released on the 1st, 11th and 21st at 09:00 KST. Provisional figures are preserved alongside their revisions rather than overwritten.',
          responses: {
            200: { description: 'Provisional trade figures' },
            404: {
              description:
                'Collection has not started. Deliberate — an empty array would be indistinguishable from "no trade occurred".',
              content: { 'application/json': { schema: ERROR_SCHEMA } },
            },
          },
        },
      },
      '/trade/exports': {
        get: {
          tags: ['Trade'],
          operationId: 'getTradeExports',
          summary: 'Exports and imports by HS code and partner country',
          responses: {
            200: { description: 'Trade series' },
            404: { description: 'Collection has not started', content: { 'application/json': { schema: ERROR_SCHEMA } } },
          },
        },
      },
    },
  };
}
