/**
 * build-seoulmarkets-company-master.mjs — Korea 종목 마스터(P3-A, 사장님 데이터사업 지시 2026-09-09).
 *
 * KRX 상장 2,765종목(코스피943+코스닥1,822) × DART 회사목록(3,925사)을 종목코드로 조인한다.
 * 5번이 이미 갈래를 세어 뒀다(우선주114·스팩30·리츠3·나머지29) — 이 스크립트의 몫은
 * «그 갈래를 어떻게 다룰지 정하는 것»이다(짐작으로 버리지 않는다).
 *
 * ── 처리 규칙 ──────────────────────────────────────────────────────────────
 *   1. 종목코드 직접일치 — 그대로 조인.
 *   2. 우선주(이름 끝 「우」·숫자+우·우B/K 패턴) — 이름에서 우선주 표식을 지운 «본주 이름»으로
 *      DART 회사명과 다시 맞춘다. 맞으면 그 회사의 corp를 쓰고 is_preferred_share=true·
 *      parent_ticker를 남긴다(0으로 채우지 않고, 못 맞으면 dart_status='not_matched'로 둔다).
 *   3. 나머지(스팩·리츠·새 상장) — corp 없이 종목 마스터에 그대로 남기고
 *      dart_status='not_matched'(entity_type 짐작 가능하면 표시, 아니면 null).
 *
 * ⛔ 못 붙는 것을 목록에서 빼지 않는다. 0/추측으로 채우지 않는다.
 *
 * 쓰는 법
 *   node scripts/build-seoulmarkets-company-master.mjs
 *   node scripts/build-seoulmarkets-company-master.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 회사길 = path.join(뿌리, 'archive/raw/dart-company/company.ndjson');
const 시세방 = path.join(뿌리, 'archive/raw/krx');
const 낼방 = path.join(뿌리, 'public/data');
const 업종영문길 = path.join(뿌리, 'src/data/korea-industry-name-english.json');

/** P3-B — 업종명 영문. 짐작 안 함: 사전에 없으면 null(「못 붙였다」로 남긴다), 기계번역 안 함 */
export function 업종영문사전읽기() {
  try { return JSON.parse(fs.readFileSync(업종영문길, 'utf8')).map ?? {}; } catch { return {}; }
}

export function 날꼴(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const 날 = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${날}`;
}

/** 회사 이름을 맞추기 좋게 다듬는다 — 법인 표식·공백·괄호를 지운다. 짐작이 아니라 문자열 정리다 */
export function 이름다듬기(s) {
  if (!s) return '';
  return String(s)
    .replace(/\(주\)|주식회사|\(사\)|\(재\)/g, '')
    .replace(/\s+/g, '')
    .trim();
}

/** 우선주 이름에서 본주 이름을 뽑는다. 우선주가 아니면 null. */
export function 본주이름뽑기(isuNm) {
  if (!isuNm) return null;
  // 「…우」·「…1우」·「…2우B」·「…우(전환)」류 — 끝의 숫자+우+B/K/(전환) 패턴만 지운다
  const m = String(isuNm).match(/^(.*?)(?:\d*우[A-Z]?)(?:\(.*\))?$/);
  if (!m) return null;
  const 본주 = m[1].trim();
  if (!본주 || 본주 === isuNm) return null;
  return 본주;
}

export function 갈래판정(isuNm) {
  if (/스팩|기업인수목적/.test(isuNm)) return 'spac';
  if (/리츠|REIT/i.test(isuNm)) return 'reit';
  if (본주이름뽑기(isuNm)) return 'preferred_share';
  return null;
}

function 최근시세() {
  const 파일들 = fs.readdirSync(시세방);
  const 날들 = [...new Set(파일들.map((f) => (f.match(/_bydd_trd-(\d{8})\.json$/) || [])[1]).filter(Boolean))].sort();
  for (const d of [...날들].reverse()) {
    const 것 = [];
    for (const 앞 of ['stk_bydd_trd', 'ksq_bydd_trd']) {
      const f = `${앞}-${d}.json`;
      if (!파일들.includes(f)) continue;
      const o = JSON.parse(fs.readFileSync(path.join(시세방, f), 'utf8'));
      것.push(...(o.OutBlock_1 ?? Object.values(o).find(Array.isArray) ?? []));
    }
    if (것.length) return { 날: d, 줄: 것 };
  }
  return { 날: null, 줄: [] };
}

export function 짓기() {
  const 회사 = [];
  for (const l of fs.readFileSync(회사길, 'utf8').trim().split('\n')) {
    try { 회사.push(JSON.parse(l)); } catch { /* 깨진 줄은 버리지 않되 이 회사만 없는 것으로 남는다 */ }
  }
  const 종목별회사 = new Map();
  for (const c of 회사) {
    if (c.종목) 종목별회사.set(String(c.종목).padStart(6, '0'), c);
  }

  const { 날: 시세날, 줄: 시세줄 } = 최근시세();

  const 결과 = [];
  const 집계 = { 직접일치: 0, 우선주맞음: 0, 우선주못맞음: 0, 스팩: 0, 리츠: 0, 새상장추정: 0 };

  for (const r of 시세줄) {
    const t = String(r.ISU_CD).trim().padStart(6, '0');
    const c = 종목별회사.get(t);
    let 행 = {
      ticker: t,
      name_ko: r.ISU_NM,
      market: r.MKT_NM,
      dart_corp: c?.corp ?? null,
      name_en: c?.영문 ?? null,
      industry_code: c?.업종코드 ?? null,
      industry_name_ko: c?.업종명 ?? null,
      is_preferred_share: false,
      parent_ticker: null,
      entity_type: null,
      dart_status: c ? 'matched' : 'not_matched',
      match_method: c ? 'ticker' : null,
    };

    if (!c) {
      const 갈래 = 갈래판정(r.ISU_NM);
      행.entity_type = 갈래;
      if (갈래 === 'spac') 집계.스팩 += 1;
      else if (갈래 === 'reit') 집계.리츠 += 1;
      else if (갈래 === 'preferred_share') {
        // 본주 종목코드는 KRX 이름끼리 맞춘다(가장 안전 — 코드 오프셋을 짐작하지 않는다).
        // DART 이름은 KRX 약칭과 다를 수 있다(예: KRX 「현대차」 = DART 「현대자동차(주)」) —
        // 그래서 DART 이름으로 바로 맞추지 않고, KRX-쪽 본주 종목코드를 먼저 구한 뒤
        // 그 코드로 DART(종목별회사, 코드 기준이라 안전)를 찾는다.
        const 본주이름 = 본주이름뽑기(r.ISU_NM);
        const 본주시세 = 시세줄.find((x) => x !== r && 이름다듬기(x.ISU_NM) === 이름다듬기(본주이름));
        const 본주코드 = 본주시세 ? String(본주시세.ISU_CD).trim().padStart(6, '0') : null;
        const 본주회사 = 본주코드 ? 종목별회사.get(본주코드) : null;
        if (본주회사) {
          행.dart_corp = 본주회사.corp;
          행.name_en = 본주회사.영문 ? `${본주회사.영문} (preferred)` : null;
          행.industry_code = 본주회사.업종코드;
          행.industry_name_ko = 본주회사.업종명;
          행.is_preferred_share = true;
          행.parent_ticker = 본주코드;
          행.dart_status = 'matched_via_parent';
          행.match_method = 'preferred_parent_ticker';
          집계.우선주맞음 += 1;
        } else {
          if (본주코드) { 행.is_preferred_share = true; 행.parent_ticker = 본주코드; }
          집계.우선주못맞음 += 1;
        }
      } else {
        집계.새상장추정 += 1;
      }
    } else {
      집계.직접일치 += 1;
    }

    행.close_price_krw = r.TDD_CLSPRC != null ? Number(String(r.TDD_CLSPRC).replace(/,/g, '')) : null;
    행.market_cap_krw = r.MKTCAP != null ? Number(String(r.MKTCAP).replace(/,/g, '')) : null;
    행.price_as_of = 시세날;
    결과.push(행);
  }

  // P3-B — 업종명 영문(짐작·기계번역 안 함, 사전에 없으면 null로 남겨 「못 붙였다」가 보이게 한다)
  const 업종영문 = 업종영문사전읽기();
  let 업종영문못붙음 = new Set();
  for (const 행 of 결과) {
    행.industry_name_en = 행.industry_name_ko ? (업종영문[행.industry_name_ko] ?? null) : null;
    if (행.industry_name_ko && 행.industry_name_en === null) 업종영문못붙음.add(행.industry_name_ko);
  }
  if (업종영문못붙음.size) 집계.업종영문못붙은이름 = [...업종영문못붙음];

  const 매치됨 = 결과.filter((x) => x.dart_status === 'matched' || x.dart_status === 'matched_via_parent').length;
  return { 결과, 집계, 전체: 결과.length, 매치됨, 매치율: 결과.length ? 매치됨 / 결과.length : 0, 시세날 };
}

function 칸(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const 머리칸 = ['ticker', 'name_ko', 'name_en', 'market', 'dart_corp', 'industry_code', 'industry_name_ko', 'industry_name_en',
  'is_preferred_share', 'parent_ticker', 'entity_type', 'dart_status', 'match_method',
  'close_price_krw', 'market_cap_krw', 'price_as_of'];

function 파일로쓰기() {
  const { 결과, 집계, 전체, 매치됨, 매치율, 시세날 } = 짓기();
  fs.mkdirSync(낼방, { recursive: true });
  const 오늘 = 날꼴();

  const csv = [머리칸.join(','), ...결과.map((r) => 머리칸.map((k) => 칸(r[k])).join(','))].join('\n');
  const csv길 = path.join(낼방, `korea-company-master-${오늘}.csv`);
  fs.writeFileSync(csv길, csv, 'utf8');

  const 사전 = {
    whatThisIs: `KRX-listed tickers (KOSPI+KOSDAQ, ${전체} rows as of ${시세날}) joined to DART corporate filings by ticker, with preferred shares re-linked to their common-share parent by name. Not investment advice.`,
    matchRate: `${(매치율 * 100).toFixed(1)}% (${매치됨}/${전체})`,
    breakdown: 집계,
    columns: {
      ticker: 'KRX 6-digit code (or alphanumeric for some preferred classes).',
      name_ko: 'KRX-listed name, Korean.',
      name_en: 'DART-filed English name. Null if not matched. For preferred shares, parent company name + "(preferred)".',
      market: 'KOSPI or KOSDAQ.',
      dart_corp: 'DART corp code (8 digits). Null if not matched to any DART filer.',
      industry_code: 'DART-filed KSIC industry code (Korean govt classification). Fine-grained (630+ codes storewide) — see industry_name_ko/en for the grouped label actually used.',
      industry_name_ko: 'Industry name as DART files it, Korean (60 distinct labels across our matched universe).',
      industry_name_en: 'English label, hand-mapped from KSIC standard nomenclature (src/data/korea-industry-name-english.json) — not machine translation. Null if industry_name_ko has no entry yet in that file (see notMeasured).',
      is_preferred_share: 'true if this ticker is a preferred-share class of another listed company.',
      parent_ticker: 'For preferred shares only: the common-share ticker of the same company.',
      entity_type: 'spac | reit | preferred_share | null. Only set when dart_status is not_matched or matched_via_parent.',
      dart_status: 'matched (direct ticker match) | matched_via_parent (preferred share, linked by name) | not_matched (no DART filing found — see entity_type).',
      match_method: 'ticker | preferred_name_strip | null.',
      close_price_krw: 'KRX closing price, price_as_of date. Null if not available.',
      market_cap_krw: 'KRX market cap, price_as_of date.',
      price_as_of: 'Trading date of the price columns.',
    },
    notMeasured: [
      집계.업종영문못붙은이름?.length
        ? `English industry-name dictionary — ${집계.업종영문못붙은이름.length} label(s) not yet in src/data/korea-industry-name-english.json: ${집계.업종영문못붙은이름.join(', ')}`
        : 'English industry-name dictionary — all industry_name_ko labels in this run are covered.',
      `Preferred shares not linked (${집계.우선주못맞음}) — name-strip did not find a matching common-share row this run.`,
      `SPACs (${집계.스팩}) and REITs (${집계.리츠}) — kept as separate master rows; not linked to any DART corp (most SPACs/REITs do file with DART, this is a name-based miss, not a decision to exclude them).`,
      `Newly-listed/split companies (${집계.새상장추정}) — DART company list dated 2026-08-05, stale. 2번 is refreshing per P2-A; re-run after refresh.`,
    ],
    disclaimer: 'Not investment advice. Market cap reflects capital intensity, not productivity.',
  };
  const 사전길 = path.join(낼방, `korea-company-master-${오늘}.dictionary.json`);
  fs.writeFileSync(사전길, JSON.stringify(사전, null, 2), 'utf8');

  console.log(`전체 ${전체} · 매치 ${매치됨}(${(매치율 * 100).toFixed(1)}%) · 갈래: ${JSON.stringify(집계)}`);
  console.log(`→ ${csv길}`);
  console.log(`→ ${사전길}`);
  return { 전체, 매치됨, 매치율, 집계 };
}

function 자가시험() {
  const 것 = [];
  const 재본다 = (이름, 실제, 기대) => 것.push([이름, JSON.stringify(실제), JSON.stringify(기대)]);

  재본다('본주이름뽑기 — CJ우', 본주이름뽑기('CJ우'), 'CJ');
  재본다('본주이름뽑기 — CJ제일제당 우', 본주이름뽑기('CJ제일제당 우').replace(/\s+$/, ''), 'CJ제일제당');
  재본다('본주이름뽑기 — JW중외제약2우B', 본주이름뽑기('JW중외제약2우B'), 'JW중외제약');
  재본다('본주이름뽑기 — 보통주는 null', 본주이름뽑기('삼성전자'), null);
  재본다('갈래판정 — 스팩', 갈래판정('한투기업인수목적25호스팩'), 'spac');
  재본다('갈래판정 — 리츠', 갈래판정('SK리츠'), 'reit');
  재본다('이름다듬기 — 괄호·공백 제거', 이름다듬기('(주) 삼성 전자'), '삼성전자');
  재본다('업종영문사전 — 전자부품 매핑', 업종영문사전읽기()['전자부품·컴퓨터·통신장비'], 'Electronic Components, Computers, and Communication Equipment');
  재본다('업종영문사전 — 사전에 없는 이름은 undefined', 업종영문사전읽기()['없는업종명123'], undefined);

  const 실 = 것.filter(([, a, b]) => a !== b);
  if (실.length) {
    console.error(`❌ 자가시험 실패 ${실.length}/${것.length}`);
    for (const [이름, a, b] of 실) console.error(`   · ${이름}: 실제=${a} 기대=${b}`);
    process.exitCode = 1;
  } else {
    console.log(`✅ 자가시험 통과 ${것.length}/${것.length}`);
  }
}

if (process.argv[1] && process.argv[1].endsWith('build-seoulmarkets-company-master.mjs')) {
  if (process.argv.includes('--자가시험')) 자가시험();
  else 파일로쓰기();
}
