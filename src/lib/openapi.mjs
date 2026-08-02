/**
 * OpenAPI 3.1 명세 — `/v1/openapi.json`
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
    openapi: '3.1.0',
    info: {
      title: 'SeoulMarkets Data API',
      version: '1.0.0',
      summary: 'Korean official statistics, normalised to English. JSON only.',
      description: [
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
                        properties: { code: { type: 'string' }, name: { type: ['string', 'null'] } },
                      },
                      heading: {
                        type: ['object', 'null'],
                        properties: { code: { type: 'string' }, name: { type: ['string', 'null'] } },
                      },
                      label: {
                        type: ['string', 'null'],
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
