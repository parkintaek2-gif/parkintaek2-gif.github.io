#!/usr/bin/env node
/**
 * collect-korea-markets-research.mjs — **한국시장을 다룬 논문**을 모은다.
 *
 *   node scripts/collect-korea-markets-research.mjs             받아서 쌓는다
 *   node scripts/collect-korea-markets-research.mjs --자가시험    자가시험만
 *   node scripts/collect-korea-markets-research.mjs --안받는다     쌓인 것으로 대장만 다시 만든다
 *
 * ── 🔴 왜 만드나 (2026-09-09 사장님) ─────────────────────────────────────
 *
 * 사장님: 「투자관련 논문을 찾아서 서비스하는 것도 검토해봐. 비즈니스화하면 과연 잘 팔릴지를」
 * 내가 재서 올린 것 — 「한국시장 논문이 적습니다(KOSPI 2,727편 vs 중국시장 7,561편).
 *   자료가 영문으로 포장돼 있지 않아서입니다」
 * 사장님: 「**이것도 좋네. 검색하면 한국시장 논문을 보여주는 거니까**」
 *
 * ⭐ 그래서 이것은 «상품»이 아니라 **깔때기**다 — QUICK 이 「Japan Markets View」를
 *   상품 사이트와 «따로» 둔 그 자리다. 무료 영문 지면으로 검색 손님을 받고,
 *   유료 상품(영어판 FnGuide)으로 잇는다.
 *
 * ⛔ 논문 자체를 파는 것이 아니다. OpenAlex·SSRN 에 공짜로 있다 — 모아 주는 것에는 값이 안 붙는다.
 *   우리가 파는 것은 «한국시장에 복제한 결과»이고, 논문은 그 출처로 단다.
 *
 * ── 라이선스 (실측 2026-09-09) ───────────────────────────────────────────
 * OpenAlex 데이터는 **CC0** 다 — help.openalex.org/access/pricing/ 원문:
 *   「the data is a public good, released under a CC0 public-domain license
 *    with no "personal use only" carve-out and no permission to ask」
 *   ⇒ 출처표시 의무도 없고 상업적 이용도 된다. (그래도 예의로 출처를 적는다)
 * ⚠ API «사용»은 유료가 됐다 — 열쇠 없이 $0.10/일 · 무료 열쇠 $1/일.
 *   ⇒ 그래서 이 자는 «여덟 번»만 부른다. 덩어리 내려받기(무료·AWS 계정 불필요)는
 *     규모가 필요해질 때 쓴다: aws s3 sync s3://openalex/data/jsonl … --no-sign-request
 *
 * ⛔ 그리고 «논문 본문»을 싣지 않는다. 제목·해·저자·실은곳·인용수는 사실이지만
 *   초록과 본문은 저마다 라이선스가 다르다. OpenAlex 가 사본별 라이선스 칸을 주므로
 *   나중에 본문을 쓸 때는 cc-by·cc0 인 것만 골라 쓴다.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { put, remoteEnabled } from '../src/lib/store.mjs';

export const 쌓는방 = 'archive/raw/openalex-korea-markets';
export const 대장길 = 'src/data/korea-markets-research.json';
const UA = 'seoulmarkets.com research index (contact: parkintaek2@gmail.com)';
const 메일 = 'parkintaek2@gmail.com';

/**
 * 물음 넷 — 한국시장을 가리키는 «구절»이다.
 * ⛔ 따옴표를 씌운다. 안 씌우면 「Korean」이 넓게 잡혀 29만 편이 나온다(2026-09-09에 겪었다).
 */
export const 물음들 = [
  { 키: 'kospi', 구절: '"KOSPI"', 이름: 'KOSPI' },
  { 키: 'kosdaq', 구절: '"KOSDAQ"', 이름: 'KOSDAQ' },
  { 키: 'korean-stock-market', 구절: '"Korean stock market"', 이름: 'Korean stock market' },
  { 키: 'korean-won', 구절: '"Korean won"', 이름: 'Korean won (FX)' },
];

/* ── 줄 다듬기 ───────────────────────────────────────────────────────── */
/** DOI 에서 앞머리를 뗀다 — 화면에 넣을 때 짧게 */
export function doi다듬기(u) {
  const s = String(u ?? '').trim();
  if (!s) return null;
  return s.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '') || null;
}

/** 저자 이름을 «셋까지»와 「외 N명」으로 — 스무 명을 다 적으면 지면이 읽히지 않는다 */
export function 저자글(authorships, 최대 = 3) {
  const 것 = (authorships ?? []).map((a) => String(a?.author?.display_name ?? '').trim()).filter(Boolean);
  if (!것.length) return null;
  if (것.length <= 최대) return 것.join(', ');
  return `${것.slice(0, 최대).join(', ')} and ${것.length - 최대} more`;
}

/**
 * 한 줄을 지면이 쓸 꼴로.
 * ⛔ 없는 것을 0 이나 빈 글자로 채우지 않는다 — null 로 둔다.
 */
export function 한줄다듬기(w) {
  if (!w || typeof w !== 'object') return null;
  const 제목 = String(w.title ?? '').trim();
  if (!제목) return null;                                  /* 제목 없는 것은 지면에 못 쓴다 */
  const 해 = Number.isInteger(w.publication_year) ? w.publication_year : null;
  const 곳 = w.primary_location?.source?.display_name ?? null;
  return {
    id: String(w.id ?? '').replace(/^https?:\/\/openalex\.org\//, '') || null,
    제목,
    해,
    인용: Number.isInteger(w.cited_by_count) ? w.cited_by_count : null,
    저자: 저자글(w.authorships),
    저자수: Array.isArray(w.authorships) ? w.authorships.length : null,
    실은곳: 곳 ? String(곳).trim() : null,
    doi: doi다듬기(w.doi),
    oa: w.open_access?.oa_status ?? null,
    /* ⭐ 사본별 라이선스 — 본문을 쓸 수 있나를 나중에 이 칸으로 가른다 */
    라이선스: w.primary_location?.license ?? null,
    주제: (w.topics ?? []).slice(0, 2).map((t) => String(t?.display_name ?? '').trim()).filter(Boolean),
    갈래: w.type ?? null,
  };
}

/** 같은 논문이 여러 물음에 걸린다 — id 로 겹침을 없앤다. ⛔ 제목으로 하지 않는다 */
export function 겹침없애기(줄들) {
  const m = new Map();
  for (const r of 줄들 ?? []) {
    if (!r?.id) continue;
    const 옛 = m.get(r.id);
    if (!옛) { m.set(r.id, r); continue; }
    /* 같은 것이 두 번 오면 «인용수가 있는» 쪽을 남긴다 */
    if ((r.인용 ?? -1) > (옛.인용 ?? -1)) m.set(r.id, r);
  }
  return [...m.values()];
}

/** 해별로 센다 — 지면에 「연구가 어느 해에 몰렸나」를 낸다 */
export function 해별로세기(줄들) {
  const m = new Map();
  let 해없음 = 0;
  for (const r of 줄들 ?? []) {
    if (!Number.isInteger(r?.해)) { 해없음 += 1; continue; }
    m.set(r.해, (m.get(r.해) ?? 0) + 1);
  }
  return {
    해별: [...m.entries()].map(([해, 수]) => ({ 해, 수 })).sort((a, b) => a.해 - b.해),
    해없음,
  };
}

/** 주제별로 센다 — 롱테일 지면의 씨앗이다 */
export function 주제별로세기(줄들, 최소 = 3) {
  const m = new Map();
  for (const r of 줄들 ?? []) {
    for (const t of r?.주제 ?? []) m.set(t, (m.get(t) ?? 0) + 1);
  }
  return [...m.entries()]
    .filter(([, 수]) => 수 >= 최소)
    .map(([주제, 수]) => ({ 주제, 수 }))
    .sort((a, b) => b.수 - a.수 || a.주제.localeCompare(b.주제));
}

/**
 * 본문을 쓸 수 있는 것이 몇 편인가.
 * ⛔ 「오픈액세스」와 「본문을 써도 되나」는 다른 말이다 — 라이선스 칸을 본다.
 */
export function 본문쓸수있나세기(줄들) {
  let 쓸수있음 = 0; let 안됨 = 0; let 못쟀다 = 0;
  for (const r of 줄들 ?? []) {
    const l = String(r?.라이선스 ?? '').toLowerCase();
    if (!l) { 못쟀다 += 1; continue; }
    if (/^(cc0|cc-by|cc-by-sa|public-domain)$/.test(l)) 쓸수있음 += 1;
    else 안됨 += 1;
  }
  return { 쓸수있음, 안됨, 못쟀다 };
}

/* ── 자가시험 ───────────────────────────────────────────────────────── */
function 자가시험() {
  const 것 = []; const 재다 = (이름, 됐나) => 것.push({ 이름, 됐나 });
  const 원 = (덧 = {}) => ({
    id: 'https://openalex.org/W1', title: '  A paper  ', publication_year: 2020,
    cited_by_count: 7, type: 'article',
    authorships: [{ author: { display_name: 'Kim' } }, { author: { display_name: 'Lee' } }],
    primary_location: { license: 'cc-by', source: { display_name: 'Journal X' } },
    open_access: { oa_status: 'gold' },
    doi: 'https://doi.org/10.1/abc',
    topics: [{ display_name: 'Volatility' }, { display_name: 'FX' }, { display_name: '셋째' }],
    ...덧,
  });

  재다('물음이 넷이다', 물음들.length === 4);
  재다('🔴 물음마다 따옴표가 씌워져 있다 — 안 씌우면 「Korean」이 넓게 잡힌다',
    물음들.every((q) => q.구절.startsWith('"') && q.구절.endsWith('"')));

  재다('doi다듬기: 앞머리를 뗀다', doi다듬기('https://doi.org/10.1/abc') === '10.1/abc');
  재다('doi다듬기: dx 도 뗀다', doi다듬기('http://dx.doi.org/10.1/abc') === '10.1/abc');
  재다('⛔ doi다듬기: 없으면 null', doi다듬기('') === null && doi다듬기(null) === null);

  재다('저자글: 둘은 그대로', 저자글([{ author: { display_name: 'A' } }, { author: { display_name: 'B' } }]) === 'A, B');
  재다('저자글: 넷이면 셋 + 외 1명',
    저자글(['A', 'B', 'C', 'D'].map((n) => ({ author: { display_name: n } }))) === 'A, B, C and 1 more');
  재다('⛔ 저자글: 비면 null (빈 글자로 안 만든다)', 저자글([]) === null && 저자글(null) === null);
  재다('저자글: 이름 없는 저자를 버린다', 저자글([{ author: {} }, { author: { display_name: 'A' } }]) === 'A');

  const r = 한줄다듬기(원());
  재다('한줄: 제목 앞뒤 빈칸을 뗀다', r.제목 === 'A paper');
  재다('한줄: id 에서 앞머리를 뗀다', r.id === 'W1');
  재다('한줄: 실은곳을 읽는다', r.실은곳 === 'Journal X');
  재다('한줄: 라이선스를 읽는다', r.라이선스 === 'cc-by');
  재다('한줄: 주제를 둘까지만', r.주제.length === 2);
  재다('⛔ 한줄: 제목이 없으면 버린다 (지면에 못 쓴다)', 한줄다듬기(원({ title: '  ' })) === null);
  재다('⛔ 한줄: 해가 수가 아니면 null (0 으로 안 만든다)', 한줄다듬기(원({ publication_year: null })).해 === null);
  재다('⛔ 한줄: 인용수가 없으면 null', 한줄다듬기(원({ cited_by_count: null })).인용 === null);
  재다('⛔ 한줄: 실은곳이 없으면 null', 한줄다듬기(원({ primary_location: null })).실은곳 === null);
  재다('한줄: 인용 0 은 0 이다 (null 이 아니다)', 한줄다듬기(원({ cited_by_count: 0 })).인용 === 0);
  재다('한줄: null 도 안 죽는다', 한줄다듬기(null) === null);

  const 겹 = 겹침없애기([{ id: 'W1', 인용: 3 }, { id: 'W1', 인용: 9 }, { id: 'W2', 인용: 1 }, { 인용: 5 }]);
  재다('겹침: 둘로 줄어든다', 겹.length === 2);
  재다('겹침: 인용수가 있는 쪽을 남긴다', 겹.find((x) => x.id === 'W1').인용 === 9);
  재다('⛔ 겹침: id 없는 줄은 버린다 — 제목으로 묶지 않는다', !겹.some((x) => !x.id));
  재다('겹침: 빈 것도 안 죽는다', 겹침없애기([]).length === 0 && 겹침없애기(null).length === 0);

  const 해 = 해별로세기([{ 해: 2020 }, { 해: 2020 }, { 해: 2019 }, { 해: null }]);
  재다('해별: 오래된 해가 먼저', 해.해별[0].해 === 2019);
  재다('해별: 센다', 해.해별.find((x) => x.해 === 2020).수 === 2);
  재다('⛔ 해별: 해 없는 것을 따로 센다 (0년으로 안 만든다)', 해.해없음 === 1);

  const 주 = 주제별로세기([{ 주제: ['a', 'b'] }, { 주제: ['a'] }, { 주제: ['a'] }, { 주제: ['b'] }], 2);
  재다('주제별: 최소치 미만을 버린다', 주.length === 2);
  재다('주제별: 많은 것이 먼저', 주[0].주제 === 'a' && 주[0].수 === 3);
  재다('주제별: 빈 것도 안 죽는다', 주제별로세기(null).length === 0);

  const 본 = 본문쓸수있나세기([{ 라이선스: 'cc-by' }, { 라이선스: 'CC0' }, { 라이선스: 'cc-by-nc-nd' }, { 라이선스: null }]);
  재다('본문: cc-by·cc0 를 쓸 수 있다고 센다', 본.쓸수있음 === 2);
  재다('⛔ 본문: nc·nd 는 안 된다로 센다', 본.안됨 === 1);
  재다('⛔ 본문: 라이선스가 없으면 «못 쟀다» — 「된다」로 만들지 않는다', 본.못쟀다 === 1);
  재다('⛔ 본문: 「오픈액세스」와 「본문을 써도 되나」를 섞지 않는다 (라이선스 칸으로만 본다)',
    본문쓸수있나세기([{ oa: 'gold', 라이선스: null }]).못쟀다 === 1);

  const 실패 = 것.filter((x) => !x.됐나);
  console.log(`\n■ 자가시험 ${것.length - 실패.length}/${것.length}`);
  for (const x of 실패) console.log(`  🔴 ${x.이름}`);
  return 실패.length === 0;
}

/* ── 돌리기 ─────────────────────────────────────────────────────────── */
const 여기 = path.dirname(fileURLToPath(import.meta.url));
const 뿌리 = path.resolve(여기, '..');

if (!자가시험()) process.exit(1);
if (process.argv.includes('--자가시험')) process.exit(0);

const 고른칸 = 'id,doi,title,publication_year,cited_by_count,open_access,primary_location,authorships,topics,type';
const 부르기 = async (구절, 차례) => {
  const u = 'https://api.openalex.org/works'
    + `?filter=title_and_abstract.search:${encodeURIComponent(구절)}`
    + `&sort=${차례}&per-page=200&select=${고른칸}&mailto=${메일}`;
  const r = await fetch(u, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(60000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const j = await r.json();
  return { 전체: j?.meta?.count ?? null, 줄들: (j?.results ?? []).map(한줄다듬기).filter(Boolean) };
};

/**
 * 🔴 [2026-09-10 06:2x] 해별 «진짜» 분포를 따로 받는다 — group_by.
 *
 * 왜: 지면 그림을 그려서 «눈으로 보고» 잘못을 찾았다. 내가 쌓은 1,406편은
 *   「많이 인용된 200 + 최신 200」을 물음마다 뽑은 것이라 **최근 해가 구조적으로 부풀어 있다.**
 *   그 표본으로 해별 막대를 그리니 「2026년 252편 — 역대 최대」로 보였다.
 *   ⇒ 재 보니 KOSPI 의 진짜 분포는 «거의 평평»하다(2015~2026 연 102~172편).
 *   ⛔ 표본으로 만든 분포를 모집단 분포처럼 내면 거짓 이야기를 하는 것이다.
 *   ⇒ 그래서 물음마다 group_by=publication_year 를 한 번 더 부른다(넷 = 네 번).
 */
const 해별받기 = async (구절) => {
  const u = 'https://api.openalex.org/works'
    + `?filter=title_and_abstract.search:${encodeURIComponent(구절)}`
    + `&group_by=publication_year&mailto=${메일}`;
  const r = await fetch(u, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(60000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const j = await r.json();
  return (j?.group_by ?? [])
    .map((x) => ({ 해: Number(x.key), 수: Number(x.count) }))
    .filter((x) => Number.isFinite(x.해) && Number.isFinite(x.수))
    .sort((a, b) => a.해 - b.해);
};

const 오늘 = (() => {
  const d = new Date();      /* ⚠ 이 PC 가 이미 KST 다 */
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
})();

const 방 = path.join(뿌리, 쌓는방);
fs.mkdirSync(방, { recursive: true });
const 쌓인길 = path.join(방, `${오늘}.json`);

let 모은것 = null;
if (!process.argv.includes('--안받는다')) {
  const 담을것 = { 잰때: new Date().toLocaleString('ko-KR', { hour12: false }), 물음별: {}, 줄들: [] };
  let 실패 = 0;
  console.log('\n■ OpenAlex — 물음 넷 × 차례 둘 = 여덟 번만 부른다 (무료 몫 안에서)');
  for (const q of 물음들) {
    for (const 차례 of ['cited_by_count:desc', 'publication_date:desc']) {
      try {
        const { 전체, 줄들 } = await 부르기(q.구절, 차례);
        담을것.물음별[q.키] ??= { 이름: q.이름, 구절: q.구절, 전체: 전체 };
        담을것.줄들.push(...줄들);
        console.log(`   ✅ ${q.이름.padEnd(22)} ${차례.split(':')[0].padEnd(18)} ${줄들.length}편 (전체 ${전체?.toLocaleString() ?? '못 쟀다'})`);
      } catch (e) {
        실패 += 1;
        console.log(`   🔴 ${q.이름} ${차례} — ${e.message}`);
      }
      await new Promise((r) => setTimeout(r, 400));   /* 예의 */
    }
  }
  /* 🔴 해별 «진짜» 곡선 — 내 표본이 아니라 OpenAlex 가 센 것 */
  담을것.해별진짜 = {};
  for (const q of 물음들) {
    try {
      const g = await 해별받기(q.구절);
      const 합 = g.reduce((s2, x) => s2 + x.수, 0);
      담을것.해별진짜[q.키] = { 이름: q.이름, 해별: g, 합 };
      console.log(`   ✅ ${q.이름.padEnd(22)} 해별 «진짜» 곡선 ${g.length}해 · 합 ${합.toLocaleString()}`);
    } catch (e) {
      console.log(`   🔴 ${q.이름} 해별 곡선 — ${e.message} (⛔ 못 쟀다로 남긴다. 표본으로 대신하지 않는다)`);
    }
    await new Promise((r) => setTimeout(r, 400));
  }

  if (!담을것.줄들.length) {
    console.log('\n🔴 한 편도 못 받았다 — 쌓지 않는다. 「받았다」로 적지 않는다.');
    process.exit(1);
  }
  담을것.줄들 = 겹침없애기(담을것.줄들);
  const res = await put(`raw/openalex-korea-markets/${오늘}.json`, JSON.stringify(담을것), 'application/json');
  console.log(`\n   쌓았다 ${오늘}.json · ${담을것.줄들.length}편 (겹침 없앤 뒤) · 실패 ${실패}`);
  console.log(`   로컬 ${res.local ? '✅' : '🔴'} · R2 ${remoteEnabled ? (res.remote ? '✅' : '🔴') : '⬜ 꺼져 있다'}`);
  모은것 = 담을것;
} else {
  try { 모은것 = JSON.parse(fs.readFileSync(쌓인길, 'utf8')); }
  catch { console.log(`\n🔴 ${오늘}.json 이 없다 — 먼저 받아야 한다`); process.exit(1); }
}

const 줄들 = 겹침없애기(모은것.줄들);
const 해 = 해별로세기(줄들);
const 주제 = 주제별로세기(줄들);
const 본문 = 본문쓸수있나세기(줄들);

const 대장 = {
  왜: 'Korea is under-researched in English-language finance literature. This index counts what exists, so people looking for it can find it — and find us.',
  출처: {
    이름: 'OpenAlex',
    라이선스: 'CC0 — public domain, no attribution required and no permission to ask (help.openalex.org/access/pricing/, measured 2026-09-09)',
    주의: 'Titles and metadata only. Paper full text carries its own per-copy licence; we record it in the 라이선스 field and will only reuse cc-by / cc0 text.',
  },
  잰때: 모은것.잰때,
  물음별: 모은것.물음별,
  편수: 줄들.length,
  /* ⚠ 이름을 바꿨다 — 이것은 «내 표본»의 분포다. 모집단 분포가 아니다 */
  표본해별: 해.해별,
  표본해없음: 해.해없음,
  표본이왜치우쳤나: 'Sampled as top-200 cited + newest-200 per phrase, so recent years are over-represented by construction. Do not read this as a trend.',
  해별진짜: 모은것.해별진짜 ?? null,
  주제: 주제,
  본문쓸수있나: 본문,
  줄들: [...줄들].sort((a, b) => (b.인용 ?? -1) - (a.인용 ?? -1)),
};
fs.writeFileSync(path.join(뿌리, 대장길), JSON.stringify(대장, null, 2), 'utf8');

console.log(`\n■ 대장 — ${대장길}`);
console.log(`   편수 ${줄들.length.toLocaleString()} · 주제 ${주제.length}가지 · 해 ${해.해별.length}가지 (해 없음 ${해.해없음})`);
console.log(`   본문 쓸 수 있는 것 ${본문.쓸수있음} · 안 되는 것 ${본문.안됨} · 못 쟀다 ${본문.못쟀다}`);
console.log('   ⛔ 「오픈액세스」와 「본문을 써도 되나」는 다른 말이다 — 라이선스 칸으로만 갈랐다');
for (const q of Object.values(모은것.물음별)) {
  console.log(`   ${q.이름.padEnd(22)} 전체 ${q.전체?.toLocaleString() ?? '못 쟀다'}편`);
}
console.log('\n⭐ 다음 — 이 대장으로 무료 영문 지면을 짓는다(깔때기). 상품은 영어판 FnGuide 쪽이다.');
