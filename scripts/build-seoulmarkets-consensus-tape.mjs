#!/usr/bin/env node
/**
 * build-seoulmarkets-consensus-tape.mjs — **Korea Consensus Tape** 상품 파일(P4, 주력).
 *
 * ── 명세 (docs/서울마켓츠-상품명세-P1.md Ⅱ-2-3 · 5번이 정한 칸) ──────────────
 * 원자료: archive/raw/hankyung-consensus/consensus-{날짜}.json (한경컨센서스, 오늘분)
 * 우리 몫은 값이 아니라 **target_change(변경 이력)**과 analyst_name 축이다.
 *
 * ⛔ 못박는 것
 *   target_change 를 「매수 신호」로 쓰지 않는다 — 「iM증권이 X일에 Y원으로 바꿨다」는 사실이다
 *   ⬜ 한경컨센서스 «목록 자체»의 재배포 범위는 아직 안 읽었다(P1 문서 Ⅶ) — 값을 받기 전에
 *     확인한다. 그래서 이 파일은 지금은 무료 파일로만 낸다(가격표를 안 붙인다)
 *   목표주가 "0"은 0원이 아니라 안 낸 것이다 — null로 둔다(Number("0")===0 함정)
 *   창은 31일뿐이다(지면이 자른다) — 소급 안 됨, 매일 쌓아야 해자가 된다
 *
 * 쓰는 법
 *   node scripts/build-seoulmarkets-consensus-tape.mjs
 *   node scripts/build-seoulmarkets-consensus-tape.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 원본방 = path.join(뿌리, 'archive/raw/hankyung-consensus');
const 낼방 = path.join(뿌리, 'public/data');

export function 날꼴(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const 날 = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${날}`;
}

/** ⛔ 「0」을 0원으로 읽지 않는다 — 안 낸 것이다(Number("0")===0 함정) */
export function 목표가읽기(v) {
  if (v === null || v === undefined || v === '' || v === '0' || v === 0) return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** 「올림/내림/유지/신규」 — 우리가 계산한다. 둘 다 없으면 못 잰다(null) */
export function 목표가변화(지금, 이전) {
  const now = 목표가읽기(지금);
  const 옛 = 목표가읽기(이전);
  if (now === null) return null; // 이번 리포트에 목표가 자체가 없으면 변화도 못 잰다
  if (옛 === null) return 'new'; // 이전 값이 없으면(안 냈거나 새 커버리지) 신규로 본다
  if (now > 옛) return 'raised';
  if (now < 옛) return 'lowered';
  return 'held';
}

/** 8자리 날짜/이미 YYYY-MM-DD인 것 둘 다 받아 ISO로 */
export function ISO날짜(s) {
  if (!s) return null;
  const t = String(s).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  if (/^\d{8}$/.test(t)) return `${t.slice(0, 4)}-${t.slice(4, 6)}-${t.slice(6, 8)}`;
  return null;
}

export function 줄만들기(r) {
  return {
    report_id: r.보고서번호 != null ? String(r.보고서번호) : null,
    published_on: ISO날짜(r.발표일),
    analyst_name: r.작성자 ?? null,
    broker: r.증권사 ?? null,
    ticker: r.종목코드 ? String(r.종목코드).padStart(6, '0') : null,
    sector: r.업종 ?? null,
    rating: r.의견 ?? null,
    target_price: 목표가읽기(r.목표주가),
    prev_target_price: 목표가읽기(r.이전목표주가),
    target_change: 목표가변화(r.목표주가, r.이전목표주가),
  };
}

function 최근파일() {
  if (!fs.existsSync(원본방)) return null;
  const 후보 = fs.readdirSync(원본방).filter((f) => /^consensus-\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
  return 후보.length ? path.join(원본방, 후보[후보.length - 1]) : null;
}

export function 짓기() {
  const 파일 = 최근파일();
  if (!파일) return { 줄들: [], 못읽음: '원자료 없음(archive/raw/hankyung-consensus)' };
  const 원본 = JSON.parse(fs.readFileSync(파일, 'utf8'));
  const 원줄들 = 원본.줄들 ?? [];
  const 줄들 = 원줄들.map(줄만들기);

  const 변경있음 = 줄들.filter((r) => r.target_change === 'raised' || r.target_change === 'lowered').length;
  const 애널명단 = new Set(줄들.map((r) => r.analyst_name).filter(Boolean));
  const 증권사명단 = new Set(줄들.map((r) => r.broker).filter(Boolean));
  const 종목명단 = new Set(줄들.map((r) => r.ticker).filter(Boolean));

  return {
    줄들, 파일: path.basename(파일), 못받은쪽: 원본.못받은쪽 ?? [],
    총건수: 줄들.length, 변경있음, 애널수: 애널명단.size, 증권사수: 증권사명단.size, 종목수: 종목명단.size,
  };
}

function 칸(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const 머리칸 = ['report_id', 'published_on', 'analyst_name', 'broker', 'ticker', 'sector', 'rating',
  'target_price', 'prev_target_price', 'target_change'];

function 파일로쓰기() {
  const { 줄들, 파일, 못받은쪽, 총건수, 변경있음, 애널수, 증권사수, 종목수, 못읽음 } = 짓기();
  if (못읽음) { console.error(`⛔ ${못읽음}`); process.exitCode = 1; return; }

  fs.mkdirSync(낼방, { recursive: true });
  const 오늘 = 날꼴();

  const csv = [머리칸.join(','), ...줄들.map((r) => 머리칸.map((k) => 칸(r[k])).join(','))].join('\n');
  const csv길 = path.join(낼방, `korea-consensus-tape-${오늘}.csv`);
  fs.writeFileSync(csv길, csv, 'utf8');

  const 사전 = {
    product: 'Korea Consensus Tape',
    version: 오늘,
    publisher: 'SeoulMarkets (KLifeDesign Inc.)',
    disclaimer: 'Not investment advice. target_change records what a broker filed, not a buy/sell recommendation.',
    priceStatus: '⬜ Not priced yet. The redistribution scope of the underlying listing has not been confirmed (see notMeasured) — this file ships free until that is resolved.',
    whatThisIs: `One row per Hankyung Consensus broker report from ${파일} (a rolling ~31-day window the source page itself enforces — this is not our archive's full history). ${총건수} reports · ${변경있음} raised/lowered target prices · ${애널수} named analysts · ${증권사수} brokers · ${종목수} tickers.`,
    whatThisIsNot: [
      'Not a live feed — this is a dated snapshot; it does not update after publication.',
      'Not a buy/sell signal. target_change is a fact about what the broker filed, not a recommendation.',
      'Not backfillable. The source page only ever shows ~31 days; a day not collected on time is gone for good (see check-archive-freshness.mjs, "산업활동동향" 갈래 pattern applied to this collector too).',
    ],
    source: 'Hankyung Consensus (markets.hankyung.com) — collected daily via scripts/collect-seoulmarkets-hankyung-consensus.mjs',
    columns: {
      report_id: 'Source report number — primary key.',
      published_on: 'Report publish date, ISO 8601 (YYYY-MM-DD).',
      analyst_name: 'Named analyst as the source lists it. Null if the source did not attribute one.',
      broker: 'Brokerage house name.',
      ticker: 'KRX 6-digit code. Null for macro/non-ticker reports.',
      sector: 'Sector label as the source lists it (Korean). Null if not a sector-tagged report.',
      rating: 'Analyst rating/opinion as filed (Korean, e.g. 매수/BUY). Not translated — we do not invent an English gloss.',
      target_price: 'Target price in this report. Null, not 0, if the report did not set one — a filed "0" is treated as "not stated," never as a price.',
      prev_target_price: 'The analyst\'s previous target for the same stock, when the source states one. Null if none.',
      target_change: '"raised" | "lowered" | "held" | "new" | null. Computed by us from target_price vs prev_target_price. Null only when this report itself carries no target price.',
    },
    notMeasured: [
      '⬜ Redistribution scope of the Hankyung Consensus listing — we recount the list ourselves (facts: report id, house, analyst, target, rating), but whether the listing itself may be redistributed as a product is not yet confirmed. Do not price this file until that is resolved.',
      못받은쪽문구(못받은쪽),
    ],
  };
  const 사전길 = path.join(낼방, `korea-consensus-tape-dictionary-${오늘}.json`);
  fs.writeFileSync(사전길, JSON.stringify(사전, null, 2), 'utf8');

  console.log(`${총건수}건 · 변경(raised/lowered) ${변경있음}건 · 애널 ${애널수}명 · 증권사 ${증권사수}곳 · 종목 ${종목수}개`);
  console.log(`→ ${csv길}`);
  console.log(`→ ${사전길}`);
}

function 못받은쪽문구(못받은쪽) {
  return (못받은쪽 && 못받은쪽.length)
    ? `Pages not received this run: ${JSON.stringify(못받은쪽)} — treated as missing, not as zero rows.`
    : 'All pages received this run (못받은쪽 empty).';
}

function 자가시험() {
  const 것 = [];
  const 재본다 = (이름, 실제, 기대) => 것.push([이름, JSON.stringify(실제), JSON.stringify(기대)]);

  재본다('목표가읽기 — "0"은 null(0원 아님)', 목표가읽기('0'), null);
  재본다('목표가읽기 — 숫자 0도 null', 목표가읽기(0), null);
  재본다('목표가읽기 — null 그대로', 목표가읽기(null), null);
  재본다('목표가읽기 — 정상값 변환', 목표가읽기('50000'), 50000);

  재본다('목표가변화 — 올림', 목표가변화('60000', '50000'), 'raised');
  재본다('목표가변화 — 내림', 목표가변화('40000', '50000'), 'lowered');
  재본다('목표가변화 — 유지', 목표가변화('50000', '50000'), 'held');
  재본다('목표가변화 — 이전 없으면 신규', 목표가변화('50000', null), 'new');
  재본다('목표가변화 — 이전이 "0"이어도 신규(0원 아니라 안 낸 것)', 목표가변화('50000', '0'), 'new');
  재본다('목표가변화 — 이번 리포트에 목표가 자체가 없으면 못 잰다', 목표가변화(null, '50000'), null);

  재본다('ISO날짜 — 8자리', ISO날짜('20260909'), '2026-09-09');
  재본다('ISO날짜 — 이미 ISO면 그대로', ISO날짜('2026-09-09'), '2026-09-09');
  재본다('ISO날짜 — 못 읽으면 null', ISO날짜('이상함'), null);

  const 표본줄 = 줄만들기({ 보고서번호: 123, 발표일: '20260909', 작성자: '홍길동', 증권사: 'A증권', 종목코드: '5930', 업종: '전자', 의견: '매수', 목표주가: '90000', 이전목표주가: '80000' });
  재본다('줄만들기 — ticker 6자리 패딩', 표본줄.ticker, '005930');
  재본다('줄만들기 — target_change 계산됨', 표본줄.target_change, 'raised');

  const 실 = 것.filter(([, a, b]) => a !== b);
  if (실.length) {
    console.error(`❌ 자가시험 실패 ${실.length}/${것.length}`);
    for (const [이름, a, b] of 실) console.error(`   · ${이름}: 실제=${a} 기대=${b}`);
    process.exitCode = 1;
  } else {
    console.log(`✅ 자가시험 통과 ${것.length}/${것.length}`);
  }
}

if (process.argv[1] && process.argv[1].endsWith('build-seoulmarkets-consensus-tape.mjs')) {
  if (process.argv.includes('--자가시험')) 자가시험();
  else 파일로쓰기();
}
