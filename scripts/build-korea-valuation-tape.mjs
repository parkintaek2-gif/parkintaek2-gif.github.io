#!/usr/bin/env node
/**
 * build-korea-valuation-tape.mjs — **F2. Korea Valuation Tape.**
 *   시세(시가총액) × 재무제표(순이익·자본총계) → PER · PBR · ROE · 부채비율
 *
 *   node scripts/build-korea-valuation-tape.mjs            무엇이 붙나만 잰다 (안 적는다)
 *   node scripts/build-korea-valuation-tape.mjs --적는다
 *   node scripts/build-korea-valuation-tape.mjs --자가시험
 *
 * ── 🔴 이 상품의 «값»은 숫자가 아니라 «어느 판을 썼나»다 ────────────────
 *
 * FnGuide 를 영문으로 겨루는 자리에서 우리가 다르게 낼 수 있는 것은 이것이다 —
 * 남들은 「오늘의 PER」을 보여 주고 끝난다. 우리는 **그 PER 이 어느 시세 판과
 * 어느 재무 판에서 나왔는지를 칸으로 싣는다.** 그러면 손님이 재현할 수 있다.
 * ```
 * ✅ 줄마다 싣는다   시세판(basDt) · 재무판(해·보고서) · 연결/개별(CFS/OFS)
 * ⛔ 안 싣고 내면    손님이 우리 수를 검산할 수 없다 — 그러면 자료가 아니라 «주장»이다
 * ```
 *
 * ── ⛔ 이 자가 지키는 것 ───────────────────────────────────────────────
 * ```
 * ⛔ 순이익이 0 이하면 PER 은 null 이다 — 음수 PER 을 내지 않는다
 * ⛔ 자본총계가 0 이하면 PBR·ROE 는 null 이다
 * ⛔ 못 붙은 종목을 «버리지» 않는다 — 줄로 남기고 왜 못 붙었는지 칸에 적는다
 * ⛔ 「업종 평균」을 우리가 만들지 않는다 — 평균이 규범이 되면 나침반이 아니다
 * ⛔ CFS 와 OFS 를 섞지 않는다. 연결이 있으면 연결을 쓰고, 그 사실을 칸에 적는다
 * ```
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
export const 재무방 = 'archive/raw/dart-financials';
export const 시세방 = 'archive/raw/stocks';
export const 낼곳 = 'src/data/korea-valuation-tape.json';

/* ── 재는 함수들 ───────────────────────────────────────────────────── */

/**
 * 어느 재무구분을 쓸 것인가. ⛔ 섞지 않는다 — 하나를 골라서 «골랐다고 적는다».
 * 연결(CFS)이 있으면 연결을 쓴다. 지주·금융은 개별만 내는 곳이 있어 OFS 로 떨어진다.
 */
export function 구분고르기(줄) {
  if (줄?.CFS_쟀나) return 'CFS';
  if (줄?.OFS_쟀나) return 'OFS';
  return null;
}

/** 고른 구분에서 값을 꺼낸다. 없으면 null (⛔ 0 이 아니다) */
export function 값꺼내기(줄, 구분, 계정) {
  if (!줄 || !구분) return null;
  const v = 줄[`${구분}_${계정}`];
  return Number.isFinite(v) ? v : null;
}

/**
 * PER·PBR·ROE·부채비율. ⛔ 분모가 0 이하면 null 이다.
 * @returns {{per:number|null, pbr:number|null, roe:number|null, 부채비율:number|null}}
 */
export function 셈({ 시가총액, 당기순이익, 자본총계, 자산총계 }) {
  const 쓸수있나 = (n) => Number.isFinite(n);
  const per = (쓸수있나(시가총액) && 쓸수있나(당기순이익) && 당기순이익 > 0)
    ? 시가총액 / 당기순이익 : null;
  const pbr = (쓸수있나(시가총액) && 쓸수있나(자본총계) && 자본총계 > 0)
    ? 시가총액 / 자본총계 : null;
  const roe = (쓸수있나(당기순이익) && 쓸수있나(자본총계) && 자본총계 > 0)
    ? 당기순이익 / 자본총계 : null;
  /* 부채 = 자산 − 자본. 자본이 0 이하면 비율이 뜻을 잃는다 */
  const 부채비율 = (쓸수있나(자산총계) && 쓸수있나(자본총계) && 자본총계 > 0)
    ? (자산총계 - 자본총계) / 자본총계 : null;
  return { per, pbr, roe, 부채비율 };
}

/**
 * 왜 못 붙었나 — ⛔ 「못 붙었다」로 뭉치지 않는다. 갈래를 적는다.
 * 그래야 다음에 무엇을 고쳐야 하는지 알 수 있다.
 */
export function 못붙은까닭({ 시가총액, 재무줄, 구분 }) {
  if (!재무줄) return '재무제표가 없다';
  if (!구분) return '재무제표가 왔는데 자본총계·순이익이 비어 있다';
  if (!Number.isFinite(시가총액)) return '시가총액이 없다 (시세에 그 종목이 없다)';
  return null;
}

/** 소수 자리를 줄인다 — ⛔ null 을 0 으로 바꾸지 않는다 */
export function 다듬기(n, 자리 = 2) {
  if (!Number.isFinite(n)) return null;
  return Number(n.toFixed(자리));
}

/** 시세 ndjson 을 종목코드 → 시가총액 으로 접는다. 못 읽으면 null */
export function 시세읽기(글) {
  if (글 === null || 글 === undefined) return null;
  const 표 = new Map();
  let 날 = null;
  for (const 줄 of String(글).split(/\r?\n/)) {
    const t = 줄.trim();
    if (!t) continue;
    let x; try { x = JSON.parse(t); } catch { continue; }
    /* 칸 이름은 KRX 것을 그대로 쓴다(포털이 그렇게 준다) */
    const 코드 = String(x.종목코드 ?? x.srtnCd ?? x.단축코드 ?? '').replace(/^A/, '').trim();
    const 시총 = Number(x.시가총액 ?? x.mrktTotAmt);
    if (!/^\d{6}$/.test(코드) || !Number.isFinite(시총)) continue;
    표.set(코드, 시총);
    날 = 날 ?? String(x.일자 ?? x.basDt ?? '').trim() ?? null;
  }
  return { 표, 날 };
}

/**
 * 한 줄을 만든다 — 못 붙어도 «줄은 남긴다».
 * 🔴 이것이 이 자의 핵심 규칙이다. 못 붙은 것을 버리면 분모가 사라져
 *   「2,400종목에 PER 이 있다」처럼 «좋아 보이는» 수만 남는다.
 */
export function 한줄(재무줄, 시가총액, { 시세판 = null } = {}) {
  const 구분 = 구분고르기(재무줄);
  const 당기순이익 = 값꺼내기(재무줄, 구분, '당기순이익');
  const 자본총계 = 값꺼내기(재무줄, 구분, '자본총계');
  const 자산총계 = 값꺼내기(재무줄, 구분, '자산총계');
  const 매출액 = 값꺼내기(재무줄, 구분, '매출액');
  const 영업이익 = 값꺼내기(재무줄, 구분, '영업이익');
  const 시총 = Number.isFinite(시가총액) ? 시가총액 : null;
  const r = 셈({ 시가총액: 시총, 당기순이익, 자본총계, 자산총계 });
  const 까닭 = 못붙은까닭({ 시가총액: 시총, 재무줄, 구분 });

  return {
    ticker: 재무줄?.종목 ?? null,
    name: 재무줄?.이름 ?? null,
    nameEn: 재무줄?.영문이름 ?? null,
    market: 재무줄?.시장 ?? null,
    /* 🔴 어느 판을 썼나 — 이것이 상품이다 */
    priceAsOf: 시세판,
    fiscalYear: 재무줄?.해 ?? null,
    report: 'Annual (11011)',
    basis: 구분 ? (구분 === 'CFS' ? 'Consolidated' : 'Separate') : null,
    marketCap: 시총,
    netIncome: 당기순이익,
    totalEquity: 자본총계,
    totalAssets: 자산총계,
    revenue: 매출액,
    operatingIncome: 영업이익,
    per: 다듬기(r.per),
    pbr: 다듬기(r.pbr),
    roe: 다듬기(r.roe, 4),
    debtToEquity: 다듬기(r.부채비율, 4),
    notMeasured: 까닭,     /* ⛔ null 이면 붙은 것. 글이 있으면 못 붙은 «까닭»이다 */
  };
}

/** 붙은 수를 «분모와 함께» 센다 */
export function 셈보고(줄들) {
  const 전체 = Array.isArray(줄들) ? 줄들.length : 0;
  if (!전체) return { 전체: 0, per: 0, pbr: 0, roe: 0, 못붙음: 0, 비율: null };
  const 세기 = (k) => 줄들.filter((x) => x[k] !== null && x[k] !== undefined).length;
  const 못붙음 = 줄들.filter((x) => x.notMeasured).length;
  return {
    전체,
    per: 세기('per'),
    pbr: 세기('pbr'),
    roe: 세기('roe'),
    못붙음,
    비율: (전체 - 못붙음) / 전체,
  };
}

/** 방에서 가장 최근 파일 이름. 없으면 null */
export function 최근파일(목록, 무늬 = /\.json$/) {
  if (!Array.isArray(목록)) return null;
  const 것 = 목록.filter((f) => 무늬.test(f)).sort();
  return 것.length ? 것[것.length - 1] : null;
}

/* ── 자가시험 ───────────────────────────────────────────────────────── */
function 자가시험() {
  const 것 = []; const 재다 = (이름, 됐나) => 것.push({ 이름, 됐나 });

  재다('구분고르기: 연결이 있으면 연결', 구분고르기({ CFS_쟀나: true, OFS_쟀나: true }) === 'CFS');
  재다('구분고르기: 연결이 없으면 개별', 구분고르기({ CFS_쟀나: false, OFS_쟀나: true }) === 'OFS');
  재다('⛔ 구분고르기: 둘 다 없으면 null', 구분고르기({}) === null && 구분고르기(null) === null);

  재다('값꺼내기: 고른 구분에서 꺼낸다',
    값꺼내기({ CFS_자본총계: 100, OFS_자본총계: 50 }, 'CFS', '자본총계') === 100);
  재다('🔴 값꺼내기: null 은 null 로 남는다 — 0 이 아니다',
    값꺼내기({ CFS_자본총계: null }, 'CFS', '자본총계') === null);
  재다('⛔ 값꺼내기: 구분이 null 이면 null', 값꺼내기({ CFS_자본총계: 100 }, null, '자본총계') === null);

  const s = 셈({ 시가총액: 1000, 당기순이익: 100, 자본총계: 500, 자산총계: 1500 });
  재다('셈: PER 10 · PBR 2 · ROE 0.2 · 부채비율 2',
    s.per === 10 && s.pbr === 2 && s.roe === 0.2 && s.부채비율 === 2);
  재다('🔴 셈: 순이익이 음수면 PER 은 null — 음수 PER 을 내지 않는다',
    셈({ 시가총액: 1000, 당기순이익: -1, 자본총계: 500, 자산총계: 1500 }).per === null);
  재다('🔴 셈: 순이익 0 이면 PER 은 null (무한이 아니다)',
    셈({ 시가총액: 1000, 당기순이익: 0, 자본총계: 500, 자산총계: 1500 }).per === null);
  재다('🔴 셈: 자본이 0 이하면 PBR·ROE·부채비율 다 null', (() => {
    const r = 셈({ 시가총액: 1000, 당기순이익: 100, 자본총계: -5, 자산총계: 1500 });
    return r.pbr === null && r.roe === null && r.부채비율 === null;
  })());
  재다('⛔ 셈: 시총이 null 이면 PER·PBR 은 null, ROE 는 산다', (() => {
    const r = 셈({ 시가총액: null, 당기순이익: 100, 자본총계: 500, 자산총계: 1500 });
    return r.per === null && r.pbr === null && r.roe === 0.2;
  })());
  재다('셈: 자산이 없으면 부채비율만 null',
    셈({ 시가총액: 1000, 당기순이익: 100, 자본총계: 500, 자산총계: null }).부채비율 === null);

  재다('못붙은까닭: 재무제표가 없다', 못붙은까닭({ 재무줄: null }) === '재무제표가 없다');
  재다('못붙은까닭: 왔는데 칸이 비었다',
    /비어 있다/.test(못붙은까닭({ 재무줄: {}, 구분: null, 시가총액: 100 })));
  재다('못붙은까닭: 시총이 없다',
    /시가총액이 없다/.test(못붙은까닭({ 재무줄: {}, 구분: 'CFS', 시가총액: null })));
  재다('🔴 못붙은까닭: 다 있으면 null — 「붙었다」는 까닭이 없는 것이다',
    못붙은까닭({ 재무줄: {}, 구분: 'CFS', 시가총액: 100 }) === null);

  재다('다듬기: 두 자리', 다듬기(3.14159) === 3.14);
  재다('다듬기: 네 자리', 다듬기(0.123456, 4) === 0.1235);
  재다('🔴 다듬기: null 은 null 로 남는다', 다듬기(null) === null && 다듬기(undefined) === null);
  재다('⛔ 다듬기: NaN·Infinity 도 null', 다듬기(NaN) === null && 다듬기(Infinity) === null);

  재다('시세읽기: 종목코드와 시총을 접는다', (() => {
    const r = 시세읽기('{"종목코드":"005930","시가총액":123,"일자":"20260908"}\n');
    return r.표.get('005930') === 123 && r.날 === '20260908';
  })());
  재다('시세읽기: KRX 칸 이름(srtnCd·mrktTotAmt·basDt)도 읽는다', (() => {
    const r = 시세읽기('{"srtnCd":"A000660","mrktTotAmt":999,"basDt":"20260908"}\n');
    return r.표.get('000660') === 999 && r.날 === '20260908';
  })());
  재다('⛔ 시세읽기: 깨진 줄·빈 줄을 건너뛴다', (() => {
    const r = 시세읽기('깨진줄\n\n{"종목코드":"005930","시가총액":1}\n');
    return r.표.size === 1;
  })());
  재다('🔴 시세읽기: 못 읽으면 null — 빈 표가 아니다', 시세읽기(null) === null);

  const 재무 = {
    종목: '005930', 이름: '삼성전자', 영문이름: 'Samsung Electronics', 시장: 'Y', 해: 2025,
    CFS_쟀나: true, CFS_자산총계: 1500, CFS_자본총계: 500,
    CFS_당기순이익: 100, CFS_매출액: 3000, CFS_영업이익: 400,
  };
  재다('한줄: 붙으면 notMeasured 가 null 이고 per 이 있다', (() => {
    const r = 한줄(재무, 1000, { 시세판: '20260908' });
    return r.notMeasured === null && r.per === 10 && r.basis === 'Consolidated'
      && r.priceAsOf === '20260908' && r.fiscalYear === 2025;
  })());
  재다('🔴 한줄: 못 붙어도 «줄은 남는다» — 버리면 분모가 사라진다', (() => {
    const r = 한줄(재무, null, { 시세판: '20260908' });
    return r.ticker === '005930' && r.per === null && /시가총액이 없다/.test(r.notMeasured);
  })());
  재다('🔴 한줄: 어느 판을 썼나가 세 칸으로 실린다 (시세판·회계연도·연결여부)', (() => {
    const r = 한줄(재무, 1000, { 시세판: '20260908' });
    return r.priceAsOf && r.fiscalYear && r.basis && r.report === 'Annual (11011)';
  })());
  재다('한줄: 개별만 있으면 Separate 로 적는다', (() => {
    const r = 한줄({ ...재무, CFS_쟀나: false, OFS_쟀나: true, OFS_자본총계: 200, OFS_당기순이익: 20 },
      400, { 시세판: '20260908' });
    return r.basis === 'Separate' && r.pbr === 2 && r.per === 20;
  })());

  재다('셈보고: 분모와 같이 센다', (() => {
    const r = 셈보고([
      { per: 10, pbr: 1, roe: 0.1, notMeasured: null },
      { per: null, pbr: null, roe: null, notMeasured: '재무제표가 없다' },
    ]);
    return r.전체 === 2 && r.per === 1 && r.못붙음 === 1 && r.비율 === 0.5;
  })());
  재다('⛔ 셈보고: 빈 것은 비율이 null — 0 이 아니다',
    셈보고([]).비율 === null && 셈보고(null).비율 === null);

  재다('최근파일: 이름 순 마지막', 최근파일(['a-1.json', 'a-2.json', 'z.txt']) === 'a-2.json');
  재다('⛔ 최근파일: 없으면 null', 최근파일([]) === null && 최근파일(null) === null);

  const 실패 = 것.filter((x) => !x.됐나);
  console.log(`■ 자가시험 ${것.length - 실패.length}/${것.length}`);
  for (const x of 실패) console.log(`  🔴 ${x.이름}`);
  return 실패.length === 0;
}

/* ── 돌리기 ─────────────────────────────────────────────────────────── */
if (process.argv.includes('--자가시험')) {
  process.exit(자가시험() ? 0 : 1);
}

if (!자가시험()) { console.log('🔴 자가시험이 깨졌다 — 만들지 않는다.'); process.exit(1); }
console.log('');

const 적는다 = process.argv.includes('--적는다');

/* 재무제표 — 가장 최근 판 */
let 재무목록 = null;
try { 재무목록 = fs.readdirSync(path.join(ROOT, 재무방)); } catch { /* 없다 */ }
const 재무파일 = 최근파일(재무목록, /^financials-\d{4}-\d{8}\.json$/);
if (!재무파일) {
  console.log(`🔴 재무제표가 아직 없다 — ${재무방}`);
  console.log('   먼저 돌린다: node scripts/collect-dart-financials.mjs --해 2025 --적는다');
  process.exit(1);
}
const 재무 = JSON.parse(fs.readFileSync(path.join(ROOT, 재무방, 재무파일), 'utf8'));

/* 시세 — 가장 최근 판 */
let 시세목록 = null;
try { 시세목록 = fs.readdirSync(path.join(ROOT, 시세방)); } catch { /* 없다 */ }
const 시세파일 = 최근파일(시세목록, /^\d{8}\.ndjson$/);
const 시세 = 시세파일
  ? 시세읽기(fs.readFileSync(path.join(ROOT, 시세방, 시세파일), 'utf8'))
  : null;

console.log(`■ 재무 ${재무파일} — ${재무.해}년 · 쟀다 ${재무.쟀다}/${재무.전체}`);
console.log(`■ 시세 ${시세파일 ?? '⬜ 없다'} — ${시세 ? `${시세.표.size}종목 · 판 ${시세.날}` : '못 읽었다'}`);

const 줄들 = (재무.줄들 ?? []).map((x) => 한줄(x, 시세?.표.get(String(x.종목)) ?? null,
  { 시세판: 시세?.날 ?? null }));
const 보고 = 셈보고(줄들);

console.log('');
console.log(`■ Korea Valuation Tape — ${보고.전체}줄`);
console.log(`   PER  ${보고.per} / ${보고.전체}`);
console.log(`   PBR  ${보고.pbr} / ${보고.전체}`);
console.log(`   ROE  ${보고.roe} / ${보고.전체}`);
console.log(`   못 붙은 줄 ${보고.못붙음} — 줄은 남겼다(까닭이 칸에 있다)`);

/* 못 붙은 까닭을 갈래로 센다 — 「못 붙었다」로 뭉치지 않는다 */
const 까닭셈 = new Map();
for (const x of 줄들) if (x.notMeasured) 까닭셈.set(x.notMeasured, (까닭셈.get(x.notMeasured) ?? 0) + 1);
for (const [k, v] of [...까닭셈].sort((a, b) => b[1] - a[1])) console.log(`     ${v}줄  ${k}`);

if (!적는다) { console.log('\n⭐ 아직 안 적었다. --적는다 를 붙인다.'); process.exit(0); }

const 오늘 = new Date();
const 낼것 = {
  _meta: {
    product: 'Korea Valuation Tape',
    builtAt: 오늘.toLocaleString('ko-KR'),
    priceAsOf: 시세?.날 ?? null,
    fiscalYear: 재무.해,
    report: 'Annual (11011)',
    rows: 보고.전체,
    withPer: 보고.per,
    withPbr: 보고.pbr,
    withRoe: 보고.roe,
    notMeasured: 보고.못붙음,
    note: 'PER is null when net income is not positive. PBR and ROE are null when total '
      + 'equity is not positive. Consolidated (CFS) is used when available, otherwise '
      + 'separate (OFS); the basis column says which. No sector averages are computed.',
  },
  rows: 줄들,
};
fs.writeFileSync(path.join(ROOT, 낼곳), JSON.stringify(낼것, null, 1), 'utf8');
console.log(`\n📁 적었다 — ${낼곳}`);
