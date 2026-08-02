/**
 * 데이터 API — `/v1/*`.
 *
 * ── 왜 여기 있는가 ──────────────────────────────────────────────
 * 매출 목표 300억의 3분의 2가 데이터에서 나온다(docs/사업전략-데이터제공업.md §6).
 * 그러면 API 는 「2단계」가 아니라 본체다. 미디어가 API 의 마케팅이지 그 반대가 아니다.
 *
 * 별도 서버를 띄우지 않고 `server.mjs` 에 붙였다. Cloudtype 메모리가 0.25GB 로
 * 묶여 있고 여유가 0 인데, 정적 서버는 실측 47.6MB 밖에 안 쓴다. **인프라 추가 0원.**
 *
 * ── 설계 원칙 ──────────────────────────────────────────────────
 * 1. **모든 응답에 `as_of` 와 `source` 를 넣는다.** 미디어에서 지키던 규칙 그대로다.
 *    출처 없는 숫자를 내보내지 않는 것이 이 회사의 유일한 자산이다.
 * 2. **모르는 것을 지어내지 않는다.** 사전에 없는 HS 코드는 `null` 로 둔다.
 *    그럴듯한 이름으로 채우는 순간 데이터 상품으로서 끝난다.
 * 3. **아직 없는 데이터는 사실대로 말한다.** 빈 배열을 200 으로 주면
 *    이용자는 「데이터가 없다」와 「우리가 아직 안 받았다」를 구분할 수 없다.
 *
 *    ⚠ 2026-08-02 KST 정정 — 이 원칙은 원래 **503** 으로 구현돼 있었는데,
 *      **운영에서 정반대로 작동하고 있었다.** Cloudtype 프록시가 5xx 응답의 본문을
 *      통째로 자기 에러 페이지(HTML)로 갈아치운다. 실측:
 *
 *        /v1/nosuchthing  404 → 우리 JSON 도착 ✅
 *        /v1/hs/zzz       400 → 우리 JSON 도착 ✅
 *        /v1/research     503 → files.cloudtype.io 회색 화면 ✕
 *
 *      즉 이유를 담아 보낸 503 이 개발자에게는 **이유 없는 회색 화면**으로 갔다.
 *      「정직하게 말한다」는 말이 도착해야 성립한다. 그래서 **404** 로 바꿨다 —
 *      「아직 존재하지 않는 자원」이라는 뜻이 맞고, 무엇보다 **본문이 실제로 간다.**
 *      (조용한 실패의 변종이다. 옆 세션에도 알렸다 — docs/세션간-메모.md)
 *
 *    그리고 **「질의에 안 걸림」과 「아직 안 모음」을 가른다.** 모은 데이터에
 *    조건을 걸어 0건인 것은 정상 응답이므로 200·count 0 이다. 이걸 404 로 주면
 *    이용자가 우리 수집이 멈춘 줄 안다.
 * 4. JSON only. XML 안 준다. 공공데이터포털이 XML 을 주는 게 바로 그들의 문제다.
 * ──────────────────────────────────────────────────────────────
 */

import { readdir } from 'node:fs/promises';
import { gunzip } from 'node:zlib';
import { promisify } from 'node:util';
import path from 'node:path';
import {
  HS_CHAPTERS,
  HS_HEADINGS,
  COUNTRIES,
  describeHs,
  describeCountry,
  DICT_STATS,
} from './trade-dict.mjs';
import { storeStatus, get as storeGet } from './store.mjs';
import { openapi } from './openapi.mjs';

const gunzipAsync = promisify(gunzip);

/** 명세에 박히는 공개 주소. 환경변수로 덮을 수 있게 둔다(스테이징 대비). */
const PUBLIC_BASE = process.env.PUBLIC_BASE_URL ?? 'https://seoulmarkets.com';

const ARCHIVE = path.resolve(process.env.ARCHIVE_DIR ?? 'archive');

/** 수집기가 쓰는 데이터셋 id 와 사람이 읽을 설명. collect.mjs 의 등록부와 짝이다. */
const DATASETS = {
  nitemtrade: {
    label: 'Exports and imports by HS code and partner country',
    agency: 'Korea Customs Service',
    licence: 'Unrestricted (Korea Public Data Portal)',
  },
  'import-flash-item': {
    label: 'Imports by major product, 10-day provisional',
    agency: 'Korea Customs Service',
    licence: 'Unrestricted (Korea Public Data Portal)',
  },
  'export-flash-item': {
    label: 'Exports by major product, 10-day provisional',
    agency: 'Korea Customs Service',
    licence: 'Unrestricted (Korea Public Data Portal)',
  },
};

const json = (status, body, extra = {}) => ({
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    // 개발자가 브라우저에서 바로 찔러볼 수 있어야 채택된다. 공개 데이터라 위험이 없다.
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=300',
    ...extra,
  },
  body: JSON.stringify(body, null, 2),
});

const err = (status, code, message, hint) =>
  json(status, { error: { code, message, ...(hint ? { hint } : {}) } }, { 'Cache-Control': 'no-store' });

/** 아카이브에 실제로 뭐가 들어와 있는지 센다. 없으면 0 을 돌려준다(던지지 않는다). */
async function archiveStatus(id) {
  const dir = path.join(ARCHIVE, 'raw', id);
  try {
    const days = await readdir(dir);
    let files = 0;
    let latest = null;
    for (const d of days) {
      let names = [];
      try {
        names = await readdir(path.join(dir, d));
      } catch {
        continue;
      }
      files += names.length;
      if (!latest || d > latest) latest = d;
    }
    return { collected: files > 0, files, days: days.length, latest_day: latest };
  } catch {
    return { collected: false, files: 0, days: 0, latest_day: null };
  }
}

/* ── 증권사 리포트 ───────────────────────────────────────────────
   `/v1` 에서 **처음으로 실제 데이터가 나가는 곳**이다. 분류 사전은 참조표이고,
   여기부터가 「우리가 모았기 때문에 존재하는 것」이다.

   파는 것은 리포트가 아니라 사실이다 — 어느 증권사가 언제 얼마를 제시했는가.
   본문·PDF 는 수집하지도 않았으므로 나갈 것도 없다.
   ──────────────────────────────────────────────────────────── */

/* ── 리서치 인덱스 ───────────────────────────────────────────────
   ⚠ 2026-08-02 KST — 여기가 `/v1/research` 가 503 이던 원인이었다.

   원래는 요청마다 `archive/raw/research/{날짜}/` 를 직접 훑었다. 이 PC 에서는 됐지만
   **Cloudtype 컨테이너에는 `archive/` 가 아예 없다** — `.gitignore` 라 이미지에 안 들어가고,
   영구 디스크도 없어서 재배포마다 비워진다. 그래서 운영에서는 늘 0건이었다.

   R2 에는 원본이 다 있지만 거기서 직접 훑는 것도 답이 아니다 —
   **ListObjectsV2 는 1회 1,000키라 66,071건이면 왕복 66회**다. 요청 하나에 못 시킨다.

   그래서 `scripts/build-research-index.mjs` 가 **읽기용 인덱스 한 개**를 만든다.
   66,071건이 gzip 0.6MB 다. 프로세스가 뜬 뒤 **한 번만** 받아서 메모리에 든다.

     원본   archive/raw/research/{날짜}/{id}.json   183MB   ← 해자. 그대로 둔다
     인덱스 index/research.ndjson.gz               0.6MB   ← 이게 API 가 읽는 것

   인덱스는 파생물이라 잃어도 원본에서 다시 만든다. 잃으면 안 되는 것은 원본이다.
   ──────────────────────────────────────────────────────────── */

const INDEX_KEY = 'index/research.ndjson.gz';

/** 로드된 인덱스. `null` = 아직 안 읽음, `[]` = 읽었는데 없음(둘은 다르다). */
let 인덱스캐시 = null;
let 인덱스메타 = null;
let 인덱스로딩 = null;

async function 인덱스읽기() {
  const buf = await storeGet(INDEX_KEY);
  if (!buf) return { rows: [], meta: null };

  const 본문 = (await gunzipAsync(buf)).toString('utf8');
  const rows = [];
  for (const 줄 of 본문.split('\n')) {
    if (!줄) continue;
    try {
      rows.push(JSON.parse(줄));
    } catch {
      /* 한 줄이 깨져도 나머지는 쓴다. 인덱스는 다시 만들 수 있는 것이다 */
    }
  }
  let meta = null;
  try {
    const m = await storeGet('index/research.meta.json');
    if (m) meta = JSON.parse(m.toString('utf8'));
  } catch { /* 통계가 없어도 데이터는 나간다 */ }
  return { rows, meta };
}

/**
 * 인덱스를 가져온다. **한 번만 읽고 메모리에 든다.**
 *
 * ⚠ 동시에 들어온 요청이 각자 R2 를 때리지 않게 로딩 프라미스를 공유한다.
 *   콜드스타트 직후에 요청이 몰리면 그것만으로 R2 요금과 지연이 배로 든다.
 */
async function 인덱스() {
  if (인덱스캐시) return 인덱스캐시;
  if (!인덱스로딩) {
    인덱스로딩 = 인덱스읽기()
      .then(({ rows, meta }) => {
        인덱스캐시 = rows;
        인덱스메타 = meta;
        return rows;
      })
      .catch((e) => {
        // 실패는 캐시하지 않는다. R2 가 잠깐 죽은 것뿐일 수 있다.
        인덱스로딩 = null;
        throw e;
      });
  }
  return 인덱스로딩;
}

/** `/v1/meta` 가 쓴다. 아직 안 읽었으면 null — 읽으려고 R2 를 때리지는 않는다. */
export function researchIndexMeta() {
  return 인덱스메타;
}

/**
 * 인덱스에서 리포트를 고른다. 인덱스는 **최신순으로 미리 정렬돼 있어서** 앞에서 끊으면 된다.
 *
 * 돌려주는 것은 `{ rows, collected }` 다.
 * `collected:false` 는 「인덱스 자체가 없다」 — 「조건에 안 걸렸다」와 구분해야 한다.
 */
async function readResearch({ limit = 50, house, stock, since } = {}) {
  const all = await 인덱스();
  if (all.length === 0) return { rows: [], collected: false };

  const out = [];
  for (const r of all) {
    if (since && (r.d ?? '') < since) break; // 최신순이라 여기서 끊어도 된다
    if (house && !r.h?.includes(house)) continue;
    if (stock && !r.s?.includes(stock)) continue;
    out.push(r);
    if (out.length >= limit) break;
  }
  return { rows: out, collected: true };
}

/**
 * 외부 계약. 내부 필드 이름을 그대로 내보내지 않는다.
 * `nid` 는 네이버 내부 식별자라 우리 계약에 넣지 않는다 — 그쪽이 바꾸면 우리가 깨진다.
 */
/** 인덱스의 짧은 키(용량 때문에 줄였다)를 외부 계약 이름으로 편다. */
function researchContract(r) {
  return {
    date: r.d,
    broker: r.h,
    subject: r.s,
    /** 목표주가. **제시하지 않은 리포트가 실제로 있다.** 0 이나 추정으로 채우지 않는다. */
    targetPrice: r.p ?? null,
    rating: r.o ?? null,
    analyst: r.a ?? null,
    /** 상세를 아직 안 받은 항목은 목표주가가 null 이다. 그 구분을 밝힌다. */
    detailFetched: Boolean(r.f),
    source: { agency: 'Naver Finance (aggregator)', note: 'Facts only. Report text and PDF are not collected.' },
  };
}

async function research(params) {
  const limit = Math.min(Number(params.get('limit')) || 50, 200);
  const { rows, collected } = await readResearch({
    limit,
    house: params.get('broker') ?? undefined,
    stock: params.get('subject') ?? undefined,
    since: params.get('since') ?? undefined,
  });

  /* 「아직 안 모았다」만 오류다. 모은 것에 조건을 걸어 0건인 것은 정상 응답이다.
     ⚠ 503 이 아니라 404 인 이유는 파일 머리 설계원칙 3 을 볼 것 —
       Cloudtype 프록시가 5xx 본문을 자기 에러 페이지로 갈아치운다. */
  if (!collected) {
    return err(
      404,
      'collection_not_started',
      'No brokerage reports have been collected yet.',
      'Collection runs twice daily. /v1/meta shows what the archive holds.',
    );
  }

  const meta = researchIndexMeta();
  return json(200, {
    count: rows.length,
    results: rows.map(researchContract),
    coverage: {
      /* 「이 응답이 얼마 중 얼마인가」를 밝힌다. 개발자가 채택을 결정하는 숫자다 */
      ...(meta
        ? {
            total_records: meta.records,
            first_day: meta.first_day,
            latest_day: meta.latest_day,
            brokers: meta.brokers,
            subjects: meta.subjects,
            as_of: meta.generated_at_kst ? `${meta.generated_at_kst} KST` : null,
          }
        : {}),
      note: 'Target price and rating are facts stated by the broker. We do not collect or redistribute report text, PDFs or charts.',
    },
  });
}

/* ── 라우트 ─────────────────────────────────────────────────── */

/** GET /v1 — 무엇이 있는지. 개발자가 처음 여는 문이다. */
async function root() {
  return json(200, {
    service: 'SeoulMarkets Data API',
    version: 'v1',
    description:
      'Korean official statistics, normalised to English. JSON only. Every response names its source.',
    docs: 'https://seoulmarkets.com/about',
    endpoints: {
      'GET /v1/openapi.json': 'OpenAPI 3.1 specification — import this into your client generator',
      'GET /v1/meta': 'Coverage, dictionary size and what has actually been collected',
      'GET /v1/hs/{code}': 'Resolve an HS code (2, 4, 6 or 10 digits) to its English description',
      'GET /v1/hs?q=': 'Search HS chapters and headings by English keyword',
      'GET /v1/countries': 'Partner country codes and English names',
      'GET /v1/research': 'Brokerage target prices and ratings — facts only, no report text',
      'GET /v1/trade/flash': "Korea's 10-day provisional trade figures (1st, 11th, 21st, 09:00 KST)",
      'GET /v1/trade/exports': 'Exports and imports by HS code and partner country',
    },
    licence: 'Source data published by Korean agencies under an unrestricted-use licence.',
    contact: 'sibcheongan@gmail.com',
  });
}

/** GET /v1/meta — 커버리지와 수집 현황을 정직하게 드러낸다. */
async function meta() {
  const datasets = {};
  for (const [id, d] of Object.entries(DATASETS)) {
    datasets[id] = { ...d, ...(await archiveStatus(id)) };
  }

  /* 리서치는 파일 개수가 아니라 인덱스에서 센다 — 66,071 파일을 매 요청 세지 않는다.
     ⚠ 인덱스를 **여기서 읽는다.** /v1/meta 가 첫 요청이면 이 호출이 R2 를 한 번 때리고,
       그 뒤로는 /v1/research 도 같은 캐시를 쓴다. 어느 쪽이 먼저 오든 한 번뿐이다. */
  try {
    await 인덱스();
    const m = researchIndexMeta();
    datasets.research = {
      label: 'Brokerage target prices and ratings',
      agency: 'Naver Finance (aggregator)',
      licence: 'Facts only — no report text, PDF or chart is collected or redistributed.',
      collected: (인덱스캐시?.length ?? 0) > 0,
      ...(m
        ? {
            records: m.records,
            detail_fetched: m.detail_fetched,
            with_target_price: m.with_target_price,
            brokers: m.brokers,
            subjects: m.subjects,
            first_day: m.first_day,
            latest_day: m.latest_day,
            index_built_kst: m.generated_at_kst,
          }
        : {}),
    };
  } catch (e) {
    /* 인덱스를 못 읽는 것은 사고다. **숨기지 않는다** — /v1/meta 는 「무엇이 되고 있나」를
       보는 창이고, 여기서 조용히 빠지면 며칠 뒤에나 안다. */
    datasets.research = {
      label: 'Brokerage target prices and ratings',
      collected: false,
      error: 'Index could not be read.',
    };
  }
  return json(200, {
    dictionary: {
      hs_chapters: DICT_STATS.chapters,
      hs_headings: DICT_STATS.headings,
      countries: DICT_STATS.countries,
      note:
        'HS chapter names follow the WCO Harmonized System. Headings cover the products that dominate Korean trade; codes outside that set resolve to their chapter and return null for the heading rather than a guess.',
    },
    datasets,
    /**
     * 스키마 안정성 약속. 이걸 명시해야 남의 서비스가 우리를 물 수 있다.
     * (klifemap 세션의 응답 계약 원칙에서 가져왔다)
     */
    contract: {
      policy:
        'Fields may be added within v1. Fields are never removed or renamed within v1 — a breaking change ships as /v2.',
      determinism:
        'The same query returns the same value. Provisional figures are preserved alongside their revisions rather than overwritten.',
    },
    /**
     * 아카이브 저장 상태.
     *
     * 이걸 밖으로 내는 이유 — Cloudtype 컨테이너에는 영구 디스크가 없다.
     * 원격 저장이 꺼진 채로 수집이 돌면 **재배포 한 번에 아카이브가 사라진다.**
     * 그리고 관세청 10일 잠정치는 확정치로 덮인 뒤 다시 못 받는다.
     * 몇 달 뒤에 알게 되면 이미 늦으므로, 켜져 있는지를 **밖에서 늘 보이게** 둔다.
     * ⚠ 자격증명 값은 담지 않는다 — 존재 여부만 나간다(store.mjs 참조).
     */
    archive: storeStatus(),
    usage_since_restart: usageSnapshot(),
    generated_at: new Date().toISOString(),
  });
}

/* ── 응답 계약 ──────────────────────────────────────────────────
   klifemap 세션의 apiBusiness.js 에서 가져온 원칙이다.

   > 「엔진 필드 이름은 우리 내부 사정이다 … 밖으로 나가는 이름을 따로 정해 고정한다.
   >  필드를 더하는 것은 되고, 빼거나 이름을 바꾸는 것은 안 된다」

   describeHs() 의 출력을 그대로 내보내면 두 가지가 동시에 터진다.
     ① 우리가 내부를 못 고친다 — 필드명 하나 바꾸면 남의 서비스가 죽는다
     ② 내부에만 있어야 할 것이 조용히 새어 나간다
   그래서 밖으로 나가는 모양을 여기서 **명시적으로** 짓는다.
   바꿔야 하면 필드를 빼지 말고 /v2 를 새로 낸다.
   ────────────────────────────────────────────────────────────── */
const HS_SOURCE = { agency: 'World Customs Organization', system: 'Harmonized System' };

function hsContract(d) {
  return {
    code: d.code,
    /** 2(chapter) · 4(heading) · 6(subheading) · 10(national line) */
    digits: d.level,
    chapter: { code: d.chapter, name: d.chapterName },
    heading: d.heading ? { code: d.heading, name: d.headingName } : null,
    /** 화면·리포트에 그대로 쓸 대표 명칭. heading 이 있으면 그것, 없으면 chapter. */
    label: d.label,
    /** 우리 사전이 이 코드를 아는가. 모르면 label 이 null 이고 이 값이 false 다. */
    resolved: d.label != null,
    source: HS_SOURCE,
  };
}

/** GET /v1/hs/{code} */
async function hsLookup(code) {
  const d = describeHs(code);
  if (!d) return err(400, 'invalid_hs_code', 'Provide an HS code of 2, 4, 6 or 10 digits.');
  const body = hsContract(d);
  return json(200, {
    ...body,
    ...(body.resolved
      ? {}
      : {
          note: 'This code is not in our dictionary yet. We return null rather than guessing a description.',
        }),
  });
}

/**
 * 아주 작은 어간 처리.
 *
 * 사전 표제어는 복수형이 많다(batteries, vehicles, preparations).
 * 이용자는 단수로 친다(battery, vehicle). 단순 부분일치로는 「battery」가
 * 「batteries」를 못 찾는다 — 실제로 못 찾았다. 검색이 첫 관문인데 거기서
 * 빈손이면 개발자는 두 번 안 온다.
 *
 * 형태소 분석기를 넣을 일은 아니다. 영어 복수 규칙 세 개면 충분하다.
 */
function stem(w) {
  if (w.length > 4 && w.endsWith('ies')) return `${w.slice(0, -3)}y`;
  if (w.length > 3 && (w.endsWith('es') || w.endsWith('ss'))) {
    return w.endsWith('ss') ? w : w.slice(0, -2);
  }
  if (w.length > 3 && w.endsWith('s')) return w.slice(0, -1);
  return w;
}

/** 표제어를 검색용 어간 토큰으로 쪼갠다. */
function tokens(name) {
  return name
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map(stem);
}

/** GET /v1/hs?q= — 영어 키워드 검색. 코드를 모르는 사람이 쓰는 입구다. */
async function hsSearch(q) {
  const raw = q.trim().toLowerCase();
  if (raw.length < 2)
    return err(400, 'query_too_short', 'Use at least two characters, e.g. ?q=semiconductor');

  const needles = raw.split(/[^a-z0-9]+/).filter(Boolean).map(stem);
  if (!needles.length)
    return err(400, 'query_too_short', 'Use at least two letters, e.g. ?q=semiconductor');

  // 모든 검색어가 표제어 안에 있어야 맞춘 것으로 본다(AND). 두 단어를 치면 좁혀져야 한다.
  const match = (name) => {
    const toks = tokens(name);
    return needles.every((n) => toks.some((t) => t.startsWith(n) || n.startsWith(t)));
  };

  const hits = [];
  for (const [code, name] of Object.entries(HS_HEADINGS)) {
    if (match(name)) hits.push({ code, level: 4, name });
  }
  for (const [code, name] of Object.entries(HS_CHAPTERS)) {
    if (match(name)) hits.push({ code, level: 2, name });
  }
  hits.sort((a, b) => a.level - b.level || a.code.localeCompare(b.code));
  return json(200, {
    query: q,
    count: hits.length,
    results: hits.slice(0, 100),
    source: { agency: 'World Customs Organization', system: 'Harmonized System' },
    ...(hits.length === 0
      ? {
          note: 'No match. Our heading dictionary covers the products that dominate Korean trade; try a broader word, or /v1/hs/{code} if you already have the code.',
        }
      : {}),
  });
}

/** GET /v1/countries */
async function countries() {
  return json(200, {
    count: Object.keys(COUNTRIES).length,
    results: Object.entries(COUNTRIES).map(([code, name]) => ({ code, name })),
    source: { standard: 'ISO 3166-1 alpha-2' },
    note: 'Codes not in this list are returned as-is with a null name.',
  });
}

/**
 * GET /v1/trade/* — 아카이브가 필요한 엔드포인트.
 *
 * 인증키가 아직 없어 수집이 시작되지 않았다. 그때 빈 배열을 200 으로 주면
 * 이용자는 「교역이 없었다」와 「우리가 안 받았다」를 구분하지 못한다.
 * **사실대로 말한다.**
 *
 * ⚠ 2026-08-02 KST — 여기도 503·501 이었다. 둘 다 5xx 라 **본문이 도착하지 않았다**
 *   (Cloudtype 프록시가 갈아치운다. 설계원칙 3 참조). 뜻이 같으면서 본문이 가는
 *   4xx 로 내린다 — 404「아직 없는 자원」· 409「모았지만 조회층이 없음」.
 */
async function tradeNotReady(id) {
  const st = await archiveStatus(id);
  if (st.collected) {
    // 수집이 시작되면 여기서 실제 조회로 넘어간다. (다음 작업)
    return err(
      409,
      'not_implemented',
      'Data has been collected but the query layer for this endpoint is not built yet.',
      `Archive holds ${st.files} file(s) across ${st.days} day(s); latest ${st.latest_day}.`,
    );
  }
  return err(
    404,
    'collection_not_started',
    'This endpoint has no data yet. Collection begins once the Public Data Portal API key is issued.',
    'Meanwhile /v1/hs, /v1/hs?q= and /v1/countries are fully available.',
  );
}

/* ── 호출 계량 ──────────────────────────────────────────────────
   유료 티어를 만들려면 「누가 얼마나 썼나」가 있어야 한다. 지금은 무료·무인증이라
   과금은 없지만, **지금부터 세어 두지 않으면 나중에 과거를 못 만든다.**
   아카이브를 오늘부터 받는 것과 같은 이유다.

   klifemap 의 api_usage 원칙을 따른다 — **개인정보를 저장하지 않는다.**
   남기는 것은 「몇 번 불렸나」뿐이다. IP·UA·쿼리 원문을 담지 않는다.
   프로세스 메모리에만 둔다(재시작하면 0). 영속화는 저장소를 정한 뒤에 한다.
   ────────────────────────────────────────────────────────────── */
const usage = new Map();
function meter(route) {
  usage.set(route, (usage.get(route) ?? 0) + 1);
}

/** 계량 결과. /v1/meta 에서 우리 스스로도 무엇이 쓰이는지 본다. */
export function usageSnapshot() {
  return Object.fromEntries([...usage.entries()].sort((a, b) => b[1] - a[1]));
}

/**
 * 라우터. server.mjs 에서 부른다.
 * 처리 대상이 아니면 **null 을 돌려준다** — 그래야 정적 파일 처리로 넘어간다.
 */
export async function handleApi(pathname, searchParams) {
  if (pathname !== '/v1' && !pathname.startsWith('/v1/')) return null;

  if (pathname === '/v1' || pathname === '/v1/') {
    meter('root');
    return root();
  }
  if (pathname === '/v1/meta') {
    meter('meta');
    return meta();
  }
  // 마켓플레이스(RapidAPI·AWS·Snowflake)가 이걸 읽어 리스팅을 자동 생성한다.
  if (pathname === '/v1/openapi.json' || pathname === '/v1/openapi') {
    meter('openapi');
    return json(200, openapi(PUBLIC_BASE));
  }
  if (pathname === '/v1/countries') {
    meter('countries');
    return countries();
  }

  if (pathname === '/v1/hs') {
    const q = searchParams.get('q');
    if (!q) return err(400, 'missing_query', 'Use /v1/hs?q=<keyword> or /v1/hs/<code>.');
    meter('hs.search');
    return hsSearch(q);
  }
  const hsMatch = pathname.match(/^\/v1\/hs\/([^/]+)$/);
  if (hsMatch) {
    meter('hs.lookup');
    return hsLookup(hsMatch[1]);
  }

  if (pathname === '/v1/research') {
    meter('research');
    return research(searchParams);
  }
  if (pathname === '/v1/trade/flash') {
    meter('trade.flash');
    return tradeNotReady('export-flash-item');
  }
  if (pathname === '/v1/trade/exports') {
    meter('trade.exports');
    return tradeNotReady('nitemtrade');
  }

  return err(404, 'unknown_endpoint', `No such endpoint: ${pathname}`, 'See GET /v1');
}
