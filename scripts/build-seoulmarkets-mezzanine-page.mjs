#!/usr/bin/env node
/**
 * build-seoulmarkets-mezzanine-page.mjs — **메자닌(CB·BW·EB) 무료 지면 자료.** (P5)
 *
 *   node scripts/build-seoulmarkets-mezzanine-page.mjs --자가시험
 *   node scripts/build-seoulmarkets-mezzanine-page.mjs
 *
 * ── ⭐ 왜 «상품 파일»에서 세나 (2026-09-09 · 5번) ────────────────
 * 이 자는 원자료(DART)로 다시 안 간다. **2번이 낸 상품 CSV 를 그대로 읽어 센다.**
 *   public/data/korea-mezzanine-book-<날짜>.csv
 *
 * 🔴 까닭 — 무료 지면의 수와 파는 파일의 수가 «어긋날 수 없게» 만든다.
 *   원자료에서 따로 세면 둘이 갈라진다. 갈라지면 손님이 둘 중 하나를 못 믿고,
 *   그러면 둘 다 못 믿는다. 우리가 파는 것은 신뢰다.
 * ⭐ 이 방식을 P5 지면의 규칙으로 삼는다 — **깔때기는 상품 파일에서 센다.**
 *
 * ── ⛔ 이 자가 지키는 것 ───────────────────────────────────────
 * 🔴 CSV 를 «인용을 아는» 파서로 읽는다. 순진하게 줄을 세면 5,084행이 5,564행이 된다
 *   (칸 안에 줄바꿈이 있다. 오늘 실측으로 확인했다)
 * 🔴 **「해당 없음」과 「못 쟀다」를 가른다.** EB 는 리픽싱 하한 칸이 «애초에 없다» —
 *   이미 발행된 주식과 바꾸는 것이라 새로 찍을 주식이 없다. 그것을 0% 라고 쓰면 거짓이다
 * ⛔ 사모 비율이 높은 것을 «나쁘다»고 쓰지 않는다. 있었던 일만 적는다
 * ⛔ 표면이자 0% 를 「투자자가 손해」로 쓰지 않는다 — 전환권이 대가다. 우리가 값을 안 매긴다
 * ⛔ 지면에 한국어를 내지 않는다
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
/* 🔴 [2026-09-12] 6번이 P4 전량 파일을 public/data 에서 src/data/full 로 옮겼다
 * (밸류에이션과 같은 "전량 무료 노출" 실수를 되풀이하지 않으려고 — 표본만 공개 폴더에 남긴다).
 * 이 자는 전량을 읽어 «셈»을 내야 하므로 옮겨 간 자리를 따라간다. */
const 자료방 = path.join(뿌리, 'src/data/full');
const 낼길 = path.join(뿌리, 'src/data/seoulmarkets-mezzanine.json');

/**
 * CSV 를 인용까지 알고 읽는다.
 * 🔴 순진한 `split('\n')` 은 칸 안 줄바꿈에서 무너진다 — 오늘 5,084 을 5,564 로 셌다.
 */
export function 파싱(s) {
  const 줄 = []; let 칸 = []; let 값 = ''; let 인용 = false;
  const 글 = String(s ?? '');
  for (let i = 0; i < 글.length; i += 1) {
    const c = 글[i];
    if (인용) {
      if (c === '"') { if (글[i + 1] === '"') { 값 += '"'; i += 1; } else 인용 = false; } else 값 += c;
    } else if (c === '"') 인용 = true;
    else if (c === ',') { 칸.push(값); 값 = ''; }
    else if (c === '\n') { 칸.push(값); 값 = ''; 줄.push(칸); 칸 = []; }
    else if (c !== '\r') 값 += c;
  }
  if (값 !== '' || 칸.length) { 칸.push(값); 줄.push(칸); }
  /* 🔴 [고침] 처음에 `r.length > 1` 로 걸렀다 — 빈 줄을 버리려던 것인데
   *   «한 칸짜리 진짜 줄»까지 버렸다. 내 자가시험이 그것을 잡았다.
   *   ⇒ 칸 «수»로 거르지 않는다. 「모든 칸이 빈 줄」만 버린다. */
  return 줄.filter((r) => r.some((v) => String(v).trim() !== ''));
}

/** 가장 새 상품 파일 — ⛔ 이름을 손으로 적지 않는다. 날짜가 바뀌면 자가 따라간다 */
export function 최근상품(파일들) {
  const 것 = (파일들 ?? []).filter((f) => /^korea-mezzanine-book-\d{4}-\d{2}-\d{2}\.csv$/.test(f)).sort();
  return 것.at(-1) ?? null;
}

/** 채움률 — ⛔ 빈칸을 0 으로 세지 않는다 */
export function 채움(행들, 자리) {
  if (!행들?.length || !(자리 >= 0)) return { filled: 0, of: 행들?.length ?? 0, pct: null };
  const 찬 = 행들.filter((r) => String(r[자리] ?? '').trim() !== '').length;
  return { filled: 찬, of: 행들.length, pct: Math.round((찬 / 행들.length) * 1000) / 10 };
}

/**
 * 리픽싱 하한이 «없는» 까닭을 가른다.
 * 🔴 EB 는 칸 자체가 해당 없음이다. 그것과 「값이 안 적혔다」를 같은 0 으로 세면 거짓이 된다.
 */
export function 리픽싱갈래(행들, 하한자리, 메모자리) {
  let 있음 = 0; let 해당없음 = 0; let 못쟀다 = 0;
  for (const r of (행들 ?? [])) {
    const 값 = String(r[하한자리] ?? '').trim();
    const 메모 = String(r[메모자리] ?? '').trim();
    if (값 !== '') 있음 += 1;
    else if (메모 !== '') 해당없음 += 1;
    else 못쟀다 += 1;
  }
  return { hasFloor: 있음, notApplicable: 해당없음, notRecorded: 못쟀다 };
}

function 짓기() {
  const f = 최근상품(fs.readdirSync(자료방));
  if (!f) throw new Error('korea-mezzanine-book CSV 가 없다 — 2번의 build-seoulmarkets-mezzanine-book.mjs 를 먼저 돌린다');
  const 글 = fs.readFileSync(path.join(자료방, f), 'utf8');
  /* ⭐ 「순진하게 줄을 세면 몇이 되나」를 함께 낸다 — 지면에서 손으로 적지 않게 */
  const 순진한줄수 = 글.trim().split('\n').length - 1;
  const 표 = 파싱(글);
  const 머리 = 표[0]; const 몸 = 표.slice(1);
  const 자 = (이름) => 머리.indexOf(이름);

  const 갈래목 = ['CB', 'BW', 'EB'];
  const 갈래 = {};
  for (const g of 갈래목) 갈래[g] = 몸.filter((r) => r[자('instrument_type')] === g);

  const 사모 = { private: 0, public: 0, notRecorded: 0 };
  for (const r of 몸) {
    const v = String(r[자('private_placement')] ?? '').trim();
    if (v === 'private') 사모.private += 1;
    else if (v === 'public') 사모.public += 1;
    else 사모.notRecorded += 1;
  }

  const cb = 갈래.CB;
  const 이자자리 = 자('coupon_rate_pct');
  const 이자0 = cb.filter((r) => String(r[이자자리] ?? '').trim() !== '' && Number(r[이자자리]) === 0).length;
  const 이자있는것 = cb.filter((r) => String(r[이자자리] ?? '').trim() !== '').length;

  const 낸것 = {
    builtOn: new Date().toLocaleDateString('sv-SE'),
    /* ⭐ 파는 파일 이름을 그대로 적는다 — 무료 지면과 상품이 같은 수임을 증거로 남긴다 */
    builtFrom: f,
    source: 'DART filings for convertible bonds (CB), bonds with warrants (BW) and exchangeable bonds (EB), collected by us and published as our licensed file. This page counts the same file we sell, so the free figures and the paid figures cannot disagree.',
    rows: 몸.length,
    naiveLineCount: 순진한줄수,
    columns: 머리.length,
    companies: new Set(몸.map((r) => r[자('ticker')]).filter(Boolean)).size,
    byType: Object.fromEntries(갈래목.map((g) => [g, 갈래[g].length])),
    placement: 사모,
    couponZero: {
      count: 이자0,
      ofCbWithACoupon: 이자있는것,
      pct: 이자있는것 ? Math.round((이자0 / 이자있는것) * 1000) / 10 : null,
    },
    refix: Object.fromEntries(갈래목.map((g) => [g,
      리픽싱갈래(갈래[g], 자('refix_floor_price_krw'), 자('refix_floor_note'))])),
    fill: Object.fromEntries(['strike_price_krw', 'strike_ratio_pct', 'total_face_value_krw',
      'coupon_rate_pct', 'maturity_date', 'subscription_date', 'payment_date']
      .map((c) => [c, 채움(몸, 자(c))])),
    whatThisIs: 'Every convertible, warrant and exchangeable bond filing in our window, counted from the same file we license.',
    whatThisIsNot: [
      'Not a judgement. A zero coupon or a private placement is a fact about a filing, not a criticism of the company.',
      'Not a dilution forecast. We publish the terms as filed and never model what a conversion would do.',
      'Not a complete history. The window is what we have collected.',
      'Not a signal. Nothing here is a view on any security.',
    ],
  };
  fs.mkdirSync(path.dirname(낼길), { recursive: true });
  fs.writeFileSync(낼길, `${JSON.stringify(낸것, null, 1)}\n`, 'utf8');
  return 낸것;
}

/* ── 자가시험 ─────────────────────────────────────────────────────────────── */
export function 자가시험() {
  let 통 = 0; const 실 = [];
  const 검 = (n, ok) => { if (ok) 통 += 1; else 실.push(n); };

  검('파싱 — 보통 줄을 읽는다', (() => {
    const r = 파싱('a,b\n1,2\n');
    return r.length === 2 && r[1][1] === '2';
  })());
  검('🔴 파싱 — 칸 안 줄바꿈에서 무너지지 않는다', (() => {
    const r = 파싱('a,b\n"one\ntwo",2\n');
    return r.length === 2 && r[1][0] === 'one\ntwo' && r[1][1] === '2';
  })());
  검('파싱 — 칸 안 쉼표를 칸으로 세지 않는다', (() => {
    const r = 파싱('a,b\n"SAMSUNG CO,.LTD",2\n');
    return r[1].length === 2 && r[1][0] === 'SAMSUNG CO,.LTD';
  })());
  검('파싱 — 두 겹 인용부호를 하나로 읽는다', 파싱('a\n"he said ""hi"""\n')[1][0] === 'he said "hi"');
  검('⛔ 파싱 — 빈 것도 견딘다', 파싱('').length === 0 && 파싱(null).length === 0);
  검('🔴 파싱 — 한 칸짜리 «진짜» 줄을 버리지 않는다 (내 자가시험이 이 결함을 잡았다)',
    파싱('a\nb\n').length === 2);
  검('⛔ 파싱 — 모든 칸이 빈 줄만 버린다', 파싱('a,b\n1,2\n,\n').length === 2);

  검('최근상품 — 날짜가 가장 늦은 것을 고른다',
    최근상품(['korea-mezzanine-book-2026-09-01.csv', 'korea-mezzanine-book-2026-09-09.csv', 'x.csv'])
    === 'korea-mezzanine-book-2026-09-09.csv');
  검('⛔ 최근상품 — 없으면 null', 최근상품(['x.csv']) === null && 최근상품([]) === null && 최근상품(null) === null);

  검('채움 — 빈칸을 세지 않는다', (() => {
    const r = 채움([['a'], [''], ['  '], ['b']], 0);
    return r.filled === 2 && r.of === 4 && r.pct === 50;
  })());
  검('⛔ 채움 — 빈 목록이면 pct 는 null (0% 이 아니다)', 채움([], 0).pct === null);
  검('⛔ 채움 — 없는 칸이면 pct 는 null', 채움([['a']], -1).pct === null);

  /* 🔴 이 편의 알맹이 — 「해당 없음」과 「못 쟀다」를 가르는 자 */
  const 행 = [
    ['1000', ''],                     /* 하한 있음 */
    ['', 'not applicable (EB …)'],    /* 해당 없음 — 메모가 있다 */
    ['', ''],                         /* 못 쟀다 */
  ];
  const r = 리픽싱갈래(행, 0, 1);
  검('🔴 리픽싱갈래 — 하한 있음을 센다', r.hasFloor === 1);
  검('🔴 리픽싱갈래 — 「해당 없음」을 따로 센다 (0% 로 뭉개지 않는다)', r.notApplicable === 1);
  검('🔴 리픽싱갈래 — 「못 쟀다」를 따로 센다', r.notRecorded === 1);
  검('⛔ 리픽싱갈래 — 셋을 합치면 전체다', r.hasFloor + r.notApplicable + r.notRecorded === 3);
  검('⛔ 리픽싱갈래 — 빈 것도 견딘다', (() => {
    const z = 리픽싱갈래(null, 0, 1);
    return z.hasFloor === 0 && z.notApplicable === 0 && z.notRecorded === 0;
  })());

  console.log(`메자닌 지면 자료 — 자가시험 ${통}/${통 + 실.length}`);
  실.forEach((x) => console.log(`   X ${x}`));
  return 실.length;
}

const 나 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (나) {
  const 흠 = 자가시험();
  if (process.argv.includes('--자가시험')) process.exit(흠 ? 1 : 0);
  if (흠) { console.log('🔴 자가시험이 깨졌다 — 멈춘다'); process.exit(1); }

  const d = 짓기();
  console.log(`\n■ 상품 파일에서 셌다 — ${d.builtFrom}`);
  console.log(`  행 ${d.rows.toLocaleString()} · 칸 ${d.columns} · 회사 ${d.companies.toLocaleString()}`);
  console.log(`  갈래 — CB ${d.byType.CB.toLocaleString()} · BW ${d.byType.BW} · EB ${d.byType.EB}`);
  console.log(`\n  🔴 사모 ${d.placement.private.toLocaleString()} · 공모 ${d.placement.public}`
    + ` (사모가 ${(d.placement.private / d.rows * 100).toFixed(1)}%)`);
  console.log(`  🔴 CB 가운데 표면이자 0% — ${d.couponZero.count.toLocaleString()}건`
    + ` / 이자가 적힌 ${d.couponZero.ofCbWithACoupon.toLocaleString()}건의 ${d.couponZero.pct}%`);
  console.log('\n  리픽싱 하한:');
  for (const [g, r] of Object.entries(d.refix)) {
    console.log(`    ${g}  있음 ${String(r.hasFloor).padStart(5)} · 해당 없음 ${String(r.notApplicable).padStart(5)}`
      + ` · 못 쟀다 ${String(r.notRecorded).padStart(5)}`);
  }
  console.log('    ⭐ EB 의 「해당 없음」을 0% 라고 쓰지 않는다 — 칸 자체가 해당 없음이다');
  console.log(`\n냈다 — ${낼길}`);
}
