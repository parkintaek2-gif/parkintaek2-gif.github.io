#!/usr/bin/env node
/**
 * build-seoulmarkets-ownership.mjs — **대량보유(5%룰) 신고를 센다.** (P5 무료 지면 자료)
 *
 *   node scripts/build-seoulmarkets-ownership.mjs --자가시험
 *   node scripts/build-seoulmarkets-ownership.mjs
 *
 * ── 왜 이 자료인가 (2026-09-09 · P5) ──────────────────────────────
 * Korea Ownership Ledger 상품의 «무료 깔때기»다. QUICK 이 일본판(EDINET 대량보유)을 판다.
 *
 * ── ⭐ 이야기 한 줄 — 오늘 세면서 나온 것 ────────────────────────
 * 신고 21,774건 가운데 **6,008건이 「지분율 변화 0」**이다. 그런데 그 안에
 * **631건은 «주식 수»가 실제로 움직였다** — 회사가 주식을 병합했기 때문이다.
 * 어떤 보고자는 주식 2,155만 주가 줄었는데 지분율은 한 칸도 안 움직였다.
 *
 * 🔴 **이것이 「행을 파는」 까닭이다.** 지분율 변화만 보는 자는 그 631건을 못 본다.
 *
 * ── ⛔ 이 자가 지키는 것 ───────────────────────────────────────
 * ⛔ **「변화 0」을 「아무 일도 없었다」로 쓰지 않는다.** 631건이 반례다
 * ⛔ 보고자 이름을 내지 않는다 — 개인 이름이 섞여 있다. 우리가 셀 것은 «건수»다
 * ⛔ 회사명은 «영문»만 쓴다. 원자료에 영문명이 2,541곳 다 있다(오늘 확인)
 * ⛔ 「누가 사고 누가 팔았다」를 매수·매도 신호로 쓰지 않는다. 있었던 일만 적는다
 * ⛔ 지면에 한국어를 내지 않는다
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 원본 = path.join(뿌리, 'archive/raw/dart-ownership/ownership.ndjson');
const 낼길 = path.join(뿌리, 'src/data/seoulmarkets-ownership.json');

/** ⛔ 수가 아니면 null. 0 과 「없다」를 섞지 않는다 */
export function 수(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * 한 신고가 무엇인가 — 다섯 갈래.
 *
 * 🔴 «지분율은 그대로인데 주식 수가 움직인 것»을 따로 센다. 이것이 이 지면의 알맹이다.
 *   주식병합·분할처럼 회사 쪽 사정으로 주식 수가 바뀌면 지분율은 안 움직인다.
 * ⛔ 그것을 「변화 없음」에 넣으면 우리 자료가 실제보다 조용해 보인다.
 */
export function 갈래(신고) {
  const 율 = 수(신고?.보유비율증감);
  const 주 = 수(신고?.보유주식수증감);
  if (율 === null) return 'unmeasured';
  if (율 > 0) return 'stakeUp';
  if (율 < 0) return 'stakeDown';
  /* 율 === 0 */
  if (주 !== null && 주 !== 0) return 'sharesMovedStakeFlat';
  return 'noChange';
}

/** 회사별 건수 — ⛔ 영문명이 없거나 한글이 섞인 회사는 세되 «이름을 내지 않는다» */
export function 회사별(신고들) {
  const 통 = new Map();
  for (const s of 신고들) {
    const 이름 = String(s?.회사 ?? '');
    if (!이름) continue;
    const 영문인가 = !/[ㄱ-ㆎ가-힣]/.test(이름);
    const 열쇠 = s.종목 || 이름;
    if (!통.has(열쇠)) 통.set(열쇠, { ticker: s.종목 ?? null, name: 영문인가 ? 이름 : null, filings: 0 });
    통.get(열쇠).filings += 1;
  }
  return [...통.values()].sort((a, b) => b.filings - a.filings);
}

/** 중앙값 — ⛔ 평균만 내지 않는다. 한 회사가 91건이면 평균이 끌려간다 */
export function 중앙값(수들) {
  const 것 = [...(수들 ?? [])].filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  if (!것.length) return null;
  const 반 = Math.floor(것.length / 2);
  return 것.length % 2 ? 것[반] : (것[반 - 1] + 것[반]) / 2;
}

function 짓기() {
  if (!fs.existsSync(원본)) throw new Error('ownership.ndjson 이 없다 — collect-dart-ownership.mjs 를 먼저 돌린다');
  const 회사줄 = fs.readFileSync(원본, 'utf8').trim().split('\n')
    .map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);

  const 신고 = [];
  for (const o of 회사줄) {
    for (const x of (o.대량보유 ?? [])) 신고.push({ ...x, 회사: o.영문, 종목: o.종목 });
  }

  const 셈 = { stakeUp: 0, stakeDown: 0, sharesMovedStakeFlat: 0, noChange: 0, unmeasured: 0 };
  const 꼴 = {};
  const 해별 = {};
  for (const s of 신고) {
    셈[갈래(s)] += 1;
    const k = String(s.보고구분 ?? '').trim() || '(blank)';
    꼴[k] = (꼴[k] ?? 0) + 1;
    const y = String(s.접수일 ?? '').slice(0, 4);
    if (/^\d{4}$/.test(y)) 해별[y] = (해별[y] ?? 0) + 1;
  }

  const 회사들 = 회사별(신고);
  const 날 = 신고.map((s) => String(s.접수일 ?? '')).filter((s) => /^\d{8}$/.test(s)).sort();
  const 날꼴 = (s) => (s ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}` : null);

  /* 🔴 지분율은 그대로인데 주식 수가 움직인 것 — «까닭»까지 함께 낸다.
     ⚠ 사유는 원문이 한국어다. 지면에 그대로 내지 않고 «갈래»만 영문으로 센다. */
  const 병합류 = 신고.filter((s) => 갈래(s) === 'sharesMovedStakeFlat');
  const 사유갈래 = { consolidationOrSplit: 0, relatedParty: 0, other: 0 };
  for (const s of 병합류) {
    const 글 = String(s.보고사유원문 ?? '');
    if (/병합|분할/.test(글)) 사유갈래.consolidationOrSplit += 1;
    else if (/특별관계자/.test(글)) 사유갈래.relatedParty += 1;
    else 사유갈래.other += 1;
  }
  /* ⛔ 가장 큰 한 건을 «수만» 내지 않는다 — 지면이 그 이야기를 쓰려면 남은 주식 수와
     지분율까지 있어야 한다. 그것을 지면에서 손으로 적으면 자료와 어긋난다. */
  const 가장큰건 = [...병합류].sort((a, b) => Math.abs(수(b.보유주식수증감) ?? 0) - Math.abs(수(a.보유주식수증감) ?? 0))[0] ?? null;
  const 가장큰주식변동 = 가장큰건 ? Math.abs(수(가장큰건.보유주식수증감) ?? 0) : null;

  const 낸것 = {
    builtOn: new Date().toLocaleDateString('sv-SE'),
    source: 'DART large-holding reports (the Korean 5% rule) and officer/major-shareholder reports, collected by us through the official open API.',
    windowFirstDay: 날꼴(날[0]),
    windowLastDay: 날꼴(날.at(-1)),
    filingDays: new Set(날).size,
    companiesScanned: 회사줄.length,
    companiesThatFiled: 회사들.length,
    filings: 신고.length,
    officerFilings: 회사줄.reduce((a, o) => a + (o.임원주주?.length ?? 0), 0),
    counts: 셈,
    byForm: 꼴,
    byYear: 해별,
    filingsPerCompany: {
      mean: 회사들.length ? Math.round((신고.length / 회사들.length) * 10) / 10 : null,
      median: 중앙값(회사들.map((c) => c.filings)),
      max: 회사들[0]?.filings ?? null,
    },
    busiest: 회사들.filter((c) => c.name).slice(0, 15),
    /* ⭐ 이 지면의 알맹이 */
    sharesMovedStakeFlat: {
      count: 셈.sharesMovedStakeFlat,
      shareOfAll: 신고.length ? Math.round((셈.sharesMovedStakeFlat / 신고.length) * 1000) / 10 : null,
      reasons: 사유갈래,
      largestShareChange: 가장큰주식변동,
      /* ⛔ 회사 이름을 내지 않는다 — 한 회사를 지목하는 지면이 아니다. 수만 낸다 */
      largestExample: 가장큰건 ? {
        sharesBefore: (수(가장큰건.보유주식수) ?? 0) + Math.abs(수(가장큰건.보유주식수증감) ?? 0),
        sharesAfter: 수(가장큰건.보유주식수),
        sharesChange: 수(가장큰건.보유주식수증감),
        stakePct: 수(가장큰건.보유비율),
        stakeChangePct: 수(가장큰건.보유비율증감),
        reasonKind: /병합|분할/.test(String(가장큰건.보고사유원문 ?? '')) ? 'consolidationOrSplit' : 'other',
      } : null,
    },
    whatThisIs: 'Every large-holding report filed for a Korean listed company in this window, sorted by what it did to the holder\'s stake.',
    whatThisIsNot: [
      'Not a list of who owns what today. These are filings — events — not a snapshot of the register.',
      'Not a buy or sell signal. A holder raising a stake is a fact about a filing, not a view of ours.',
      'Not holder names. Individuals appear in these filings, so we count events and never publish the person.',
      'Not complete history. The window is what we have collected, and it starts when we started.',
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

  검('수 — 0 은 수다', 수(0) === 0);
  검('⛔ 수 — 빈 것은 null (0 으로 바꾸지 않는다)', 수('') === null && 수(null) === null && 수(undefined) === null);
  검('수 — 문자로 온 수도 읽는다', 수('-1234') === -1234);

  검('갈래 — 지분을 늘렸다', 갈래({ 보유비율증감: 1.2, 보유주식수증감: 100 }) === 'stakeUp');
  검('갈래 — 지분을 줄였다', 갈래({ 보유비율증감: -0.5, 보유주식수증감: -100 }) === 'stakeDown');
  검('🔴 갈래 — 지분율은 그대로인데 주식 수가 움직인 것을 «따로» 센다',
    갈래({ 보유비율증감: 0, 보유주식수증감: -21554830 }) === 'sharesMovedStakeFlat');
  검('갈래 — 둘 다 0 이면 변화 없음', 갈래({ 보유비율증감: 0, 보유주식수증감: 0 }) === 'noChange');
  검('⛔ 갈래 — 지분율을 못 쟀으면 「변화 없음」이 아니다',
    갈래({ 보유비율증감: '', 보유주식수증감: 5 }) === 'unmeasured');
  검('⛔ 갈래 — 빈 것도 견딘다', 갈래(null) === 'unmeasured' && 갈래({}) === 'unmeasured');

  검('회사별 — 건수를 센다', (() => {
    const r = 회사별([{ 회사: 'A Co', 종목: '001' }, { 회사: 'A Co', 종목: '001' }, { 회사: 'B Co', 종목: '002' }]);
    return r.length === 2 && r[0].filings === 2 && r[0].name === 'A Co';
  })());
  검('⛔ 회사별 — 한글 이름은 세되 «이름을 내지 않는다»', (() => {
    const r = 회사별([{ 회사: '한글회사', 종목: '003' }]);
    return r[0].filings === 1 && r[0].name === null && r[0].ticker === '003';
  })());
  검('회사별 — 종목코드로 묶는다 (이름 표기가 달라도 한 회사)', (() => {
    const r = 회사별([{ 회사: 'A Co', 종목: '001' }, { 회사: 'A Co.,Ltd', 종목: '001' }]);
    return r.length === 1 && r[0].filings === 2;
  })());
  검('⛔ 회사별 — 빈 것도 견딘다', 회사별([]).length === 0 && 회사별([{}]).length === 0);

  검('중앙값 — 홀수', 중앙값([1, 5, 3]) === 3);
  검('중앙값 — 짝수는 가운데 둘의 평균', 중앙값([1, 2, 3, 4]) === 2.5);
  검('⛔ 중앙값 — 빈 것은 null', 중앙값([]) === null && 중앙값(null) === null);
  검('⛔ 중앙값 — 수 아닌 것은 뺀다', 중앙값([1, 'x', 3]) === 2);

  console.log(`대량보유 자료 — 자가시험 ${통}/${통 + 실.length}`);
  실.forEach((x) => console.log(`   X ${x}`));
  return 실.length;
}

const 나 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (나) {
  const 흠 = 자가시험();
  if (process.argv.includes('--자가시험')) process.exit(흠 ? 1 : 0);
  if (흠) { console.log('🔴 자가시험이 깨졌다 — 멈춘다'); process.exit(1); }

  const d = 짓기();
  const c = d.counts;
  console.log(`\n■ 창 ${d.windowFirstDay} ~ ${d.windowLastDay} · 신고가 있던 날 ${d.filingDays}일`);
  console.log(`  대량보유 신고 ${d.filings.toLocaleString()}건 · 신고한 회사 ${d.companiesThatFiled.toLocaleString()}`
    + ` / 훑은 회사 ${d.companiesScanned.toLocaleString()}`);
  console.log(`  임원·주요주주 신고 ${d.officerFilings.toLocaleString()}건`);
  console.log(`  지분 늘림 ${c.stakeUp.toLocaleString()} · 줄임 ${c.stakeDown.toLocaleString()}`
    + ` · 변화 없음 ${c.noChange.toLocaleString()} · 못 쟀다 ${c.unmeasured}`);
  console.log(`\n  🔴 지분율은 그대로인데 주식 수가 움직인 것 ${c.sharesMovedStakeFlat.toLocaleString()}건`
    + ` (${d.sharesMovedStakeFlat.shareOfAll}%)`);
  console.log(`     까닭 — 병합·분할 ${d.sharesMovedStakeFlat.reasons.consolidationOrSplit}`
    + ` · 특별관계자 ${d.sharesMovedStakeFlat.reasons.relatedParty}`
    + ` · 그 밖 ${d.sharesMovedStakeFlat.reasons.other}`);
  console.log(`     가장 큰 주식 수 변동 ${d.sharesMovedStakeFlat.largestShareChange?.toLocaleString()}주 — 지분율은 한 칸도 안 움직였다`);
  console.log(`     ⛔ 이 건들을 「변화 없음」에 넣으면 우리 자료가 실제보다 조용해 보인다`);
  console.log(`\n  회사당 신고 — 중앙값 ${d.filingsPerCompany.median} · 평균 ${d.filingsPerCompany.mean} · 최대 ${d.filingsPerCompany.max}`);
  console.log(`  보고 꼴 — ${Object.entries(d.byForm).map(([k, v]) => `${k} ${v.toLocaleString()}`).join(' · ')}`);
  console.log(`\n냈다 — ${낼길}`);
}
