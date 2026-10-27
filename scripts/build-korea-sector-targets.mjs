#!/usr/bin/env node
/**
 * build-korea-sector-targets.mjs — 업종별 목표주가 지면(/data/korea-<업종>-target-prices)의 자료.
 *
 * ── 왜 (2026-10-27 · 1번) ────────────────────────────────────────────────
 * 반도체 한 화면(scripts/build-korea-semiconductor-targets.mjs · 41a3db0b5)을 조선·방산·2차전지·
 * 제약바이오로 넓힌다. 네 벌을 베끼지 않고 이 빌더 하나가 src/lib/sector-targets.mjs 의 «업종 표»를 돈다.
 * 반도체 빌더는 이제 이 파일의 만들기('semiconductor') 를 부르는 얇은 껍데기다.
 *
 * ⛔ 자료를 새로 모으지 않는다 — 이미 있는 셋만 읽는다.
 *   업종     archive/raw/dart-company/company.ndjson 의 «업종코드»(DART 기업개황 · KSIC)
 *   리서치   src/data/company-research.json (scripts/build-company-research.mjs)
 *   종가     archive/raw/stocks/YYYYMMDD.ndjson 가운데 가장 최근 날 (공공데이터포털 15094808)
 * ⛔ 없는 값은 null. 종가와 목표 중앙값이 «둘 다» 잰 것일 때만 차이를 셈한다.
 * ⛔ 이름 박은 예외가 규칙에도 들면 멈춘다(예외 표가 낡은 것). 놓친 예가 규칙에 들어도 멈춘다.
 * ⛔ 한글을 싣지 않는다 — 끝에서 재서 멈춘다.
 *
 * 산출  src/data/korea-<key>-targets.json  (커밋한다 — archive/ 는 빌드 컨테이너에 없다)
 * 실행  node scripts/build-korea-sector-targets.mjs              다섯 업종 모두
 *       node scripts/build-korea-sector-targets.mjs shipbuilding 하나만
 *       node scripts/build-korea-sector-targets.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 업종표, 업종, 규칙에드나 } from '../src/lib/sector-targets.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 중앙 목표 ÷ 종가 − 1. ⛔ 한쪽이라도 못 쟀으면 null */
export function 차이(중앙, 종가) {
  if (!Number.isFinite(중앙) || !Number.isFinite(종가) || 종가 <= 0 || 중앙 <= 0) return null;
  return 중앙 / 종가 - 1;
}

/** 줄 세우기 — 목표를 낸 증권사 수가 많은 곳부터, 다음은 리포트 수, 다음은 종목코드 */
export function 줄세우기(a, b) {
  return (b.targets.firms - a.targets.firms) || (b.reports - a.reports) || a.code.localeCompare(b.code);
}

export const 날짜꼴 = (s) => (/^\d{8}$/.test(String(s)) ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}` : null);

/** 세 자료를 한 번 읽는다. archive 가 없으면 null(빌드 컨테이너) */
export function 읽기() {
  const 회사길 = path.join(뿌리, 'archive/raw/dart-company/company.ndjson');
  const 시세방 = path.join(뿌리, 'archive/raw/stocks');
  if (!fs.existsSync(회사길) || !fs.existsSync(시세방)) return null;
  const 회사들 = fs.readFileSync(회사길, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
  const 리서치 = JSON.parse(fs.readFileSync(path.join(뿌리, 'src/data/company-research.json'), 'utf8'));
  const fin = JSON.parse(fs.readFileSync(path.join(뿌리, 'src/data/korea-financials-tape.json'), 'utf8'));
  const 재무영문 = new Map();
  for (const r of fin.rows) if (r.name_en && !재무영문.has(String(r.code))) 재무영문.set(String(r.code), String(r.name_en).trim());

  const 시세파일 = fs.readdirSync(시세방).filter((f) => /^\d{8}\.ndjson$/.test(f)).sort().at(-1);
  if (!시세파일) throw new Error('시세 파일이 없다');
  const 시세 = new Map();
  for (const 줄 of fs.readFileSync(path.join(시세방, 시세파일), 'utf8').split(/\r?\n/)) {
    if (!줄.trim()) continue;
    let x; try { x = JSON.parse(줄); } catch { continue; }
    if (!/^\d{6}$/.test(String(x.코드 ?? ''))) continue;
    시세.set(String(x.코드), {
      close: Number.isFinite(x.종가) && x.종가 > 0 ? x.종가 : null,
      date: 날짜꼴(x.일자),
      noTrade: x.거래없음 === true,
      market: ['KOSPI', 'KOSDAQ', 'KONEX'].includes(x.시장) ? x.시장 : null,
    });
  }
  if (시세.size < 1000) throw new Error(`시세가 ${시세.size}종목뿐이다 — 칸 이름이 바뀌었는지 본다`);
  return { 회사들, 리서치, 재무영문, 시세파일, 시세 };
}

/** 한 업종의 결과 객체를 만든다(쓰지는 않는다) */
export function 만들기(s, { 회사들, 리서치, 재무영문, 시세파일, 시세 }) {
  const 고른것 = [];
  const 연구없음 = [];
  const 본코드 = new Set();
  for (const o of 회사들) {
    const code = String(o.종목 ?? '').trim();
    if (!/^\d{6}$/.test(code) || 본코드.has(code)) continue;
    const 규칙 = 규칙에드나(s, o.업종코드);
    const 예외 = s.named[code];
    if (!규칙 && !예외) continue;
    if (규칙 && 예외) throw new Error(`[${s.key}] 이름 박은 ${code} 가 규칙에도 든다 — 예외 표를 고친다`);
    본코드.add(code);
    const k = String(o.업종코드 ?? '').trim();
    const r = 리서치.byCode[code] ?? null;
    const sx = 시세.get(code) ?? null;
    const 영문 = r?.nameEn || 재무영문.get(code) || (o.영문 && !/[가-힣]/.test(o.영문) ? String(o.영문).trim() : null);
    const 머리 = {
      code,
      nameEn: 영문,
      ksic: k,
      ksicEn: s.ksicEn[k] ?? null,
      includedBy: 규칙 ? 'ksic' : 'named',
      ...(예외 && !규칙 ? { reason: 예외.reason } : {}),
      market: sx?.market ?? null,
    };
    if (!r) { 연구없음.push(머리); continue; }
    const 중앙 = r.latestTargets.median;
    const 종가 = sx?.close ?? null;
    고른것.push({
      ...머리,
      reports: r.reports,
      brokerReports: r.brokerReports,
      firms: r.firms,
      first: r.first,
      last: r.last,
      targets: {
        firms: r.latestTargets.firms,
        min: r.latestTargets.min,
        max: r.latestTargets.max,
        median: 중앙,
        oldest: r.latestTargets.oldest ?? null,
        newest: r.latestTargets.newest ?? null,
      },
      latestRating: r.latest.find((x) => x.rating)?.rating ?? null,
      close: 종가,
      closeDate: 종가 != null ? sx.date : null,
      closeNoTrade: 종가 != null ? sx.noTrade : null,
      medianVsClose: 차이(중앙, 종가),
    });
  }
  for (const code of Object.keys(s.named)) {
    if (!본코드.has(code)) throw new Error(`[${s.key}] 이름 박은 ${code} 가 기업개황에 없다`);
  }
  고른것.sort(줄세우기);
  const 회사표 = new Map(회사들.map((o) => [String(o.종목 ?? ''), o]));
  const 놓친것 = s.misses.map((code) => {
    const o = 회사표.get(code);
    const k = String(o?.업종코드 ?? '').trim();
    if (규칙에드나(s, k)) throw new Error(`[${s.key}] 놓친예 ${code} 가 규칙에 든다 — 목록을 고친다`);
    return {
      code,
      nameEn: 리서치.byCode[code]?.nameEn || 재무영문.get(code) || null,
      ksic: k || null,
      ksicEn: s.missKsicEn[k] ?? null,
      reports: 리서치.byCode[code]?.reports ?? null,
    };
  });
  연구없음.sort((a, b) => String(a.nameEn ?? a.code).localeCompare(String(b.nameEn ?? b.code), 'en'));

  return {
    _meta: {
      what: s.what,
      rule: s.ruleText,
      namedAdditions: Object.entries(s.named).map(([code, v]) => ({ code, reason: v.reason })),
      researchSource: 리서치._meta.source,
      researchFirstDay: 리서치._meta.firstDay,
      researchLastDay: 리서치._meta.lastDay,
      priceSource: 'Financial Services Commission stock price data (data.go.kr 15094808), daily close.',
      priceFile: 시세파일,
      priceDate: 날짜꼴(시세파일.slice(0, 8)),
      industrySource: 'DART company register (Financial Supervisory Service), industry code field.',
      matched: 고른것.length + 연구없음.length,
      withResearch: 고른것.length,
      withTarget: 고른것.filter((x) => x.targets.firms > 0).length,
      withGap: 고른것.filter((x) => x.medianVsClose != null).length,
      order: 'Most firms with a stated target first; then most reports; then ticker.',
      builtBy: s.builtBy,
    },
    rows: 고른것,
    noResearch: 연구없음,
    ruleMisses: 놓친것,
  };
}

/** 한 업종을 만들어 쓴다 */
export function 쓰기(s, 자료) {
  const 결과 = 만들기(s, 자료);
  const 글 = JSON.stringify(결과);
  if (/[가-힣]/.test(글)) {
    const 자리 = 글.search(/[가-힣]/);
    throw new Error(`[${s.key}] 출력에 한글이 섞였다: …${글.slice(Math.max(0, 자리 - 60), 자리 + 20)}…`);
  }
  /* 지면 제목에 박은 두 이름이 실제 줄에 있어야 한다 — 없는 회사를 제목에 걸지 않는다 */
  for (const n of s.titleNames) {
    if (!결과.rows.some((r) => String(r.nameEn ?? '').toLowerCase().startsWith(n.toLowerCase()))) {
      throw new Error(`[${s.key}] 제목 이름 「${n}」이 표에 없다`);
    }
  }
  fs.writeFileSync(path.join(뿌리, s.dataFile), JSON.stringify(결과, null, 1) + '\n');
  const m = 결과._meta;
  console.log(`${s.key} ${m.matched}곳 · 리서치 있음 ${m.withResearch} · 목표 있음 ${m.withTarget} · 차이 셈 ${m.withGap} · 예외 ${m.namedAdditions.length} · 종가 ${m.priceDate}`);
  const 이름없음 = [...결과.rows, ...결과.noResearch].filter((x) => !x.nameEn).map((x) => x.code);
  if (이름없음.length) console.log(`  ⚠ 영문 이름 없음: ${이름없음.join(', ')}`);
  return 결과;
}

export function 자가시험() {
  const 잰다 = [];
  const 본다 = (이름, v) => 잰다.push([이름, !!v]);
  const 반 = 업종('semiconductor'), 조 = 업종('shipbuilding'), 방 = 업종('defense'), 전 = 업종('battery'), 바 = 업종('biotech');
  /* 반도체 — 41a3db0b5 와 같은 규칙 */
  본다('261 은 반도체', 규칙에드나(반, '261'));
  본다('2612 는 반도체', 규칙에드나(반, '2612'));
  본다('26112 는 반도체', 규칙에드나(반, '26112'));
  본다('29271 은 반도체 장비', 규칙에드나(반, '29271'));
  본다('29272(디스플레이 장비)는 아니다', !규칙에드나(반, '29272'));
  본다('2927 는 안 넣는다', !규칙에드나(반, '2927'));
  본다('262(전자부품)는 아니다', !규칙에드나(반, '262'));
  본다('26 만 적힌 것은 안 넣는다', !규칙에드나(반, '26'));
  본다('빈 것은 아니다', !규칙에드나(반, null) && !규칙에드나(반, ''));
  /* 조선 */
  본다('3111 은 조선', 규칙에드나(조, '3111'));
  본다('31113·31114 는 조선', 규칙에드나(조, '31113') && 규칙에드나(조, '31114'));
  본다('31 만 적힌 것은 안 넣는다', !규칙에드나(조, '31'));
  본다('313(항공)은 조선이 아니다', !규칙에드나(조, '31311'));
  본다('29111(엔진)은 조선이 아니다 — 놓친 예로만', !규칙에드나(조, '29111'));
  /* 방산 */
  본다('25200 은 방산', 규칙에드나(방, '25200'));
  본다('31311·31321·31322 는 항공우주', 규칙에드나(방, '31311') && 규칙에드나(방, '31321') && 규칙에드나(방, '31322'));
  본다('31910(철도)은 규칙 밖 — 현대로템은 이름으로', !규칙에드나(방, '31910') && !!방.named['064350']);
  본다('259(기타 금속가공)는 방산이 아니다', !규칙에드나(방, '259'));
  /* 2차전지 */
  본다('28202 는 전지', 규칙에드나(전, '28202'));
  본다('282 도 전지', 규칙에드나(전, '282'));
  본다('281(전동기·발전기)은 아니다', !규칙에드나(전, '281') && !규칙에드나(전, '28121'));
  본다('283(전선)은 아니다', !규칙에드나(전, '28302'));
  /* 제약바이오 */
  본다('211·212·213·21100·21212 는 제약', ['211', '212', '213', '21100', '21212'].every((k) => 규칙에드나(바, k)));
  본다('70113 은 의약 연구개발', 규칙에드나(바, '70113'));
  본다('7011·701 은 규칙 밖', !규칙에드나(바, '7011') && !규칙에드나(바, '701'));
  본다('20423(화장품)은 아니다', !규칙에드나(바, '20423'));
  /* 표 자체 */
  본다('다섯 업종 · 주소 겹침 없음', 업종표.length === 5 && new Set(업종표.map((s) => s.path)).size === 5);
  본다('모든 주소가 /data/korea-…-target-prices', 업종표.every((s) => /^\/data\/korea-[a-z]+-target-prices$/.test(s.path)));
  본다('예외마다 까닭이 있다', 업종표.every((s) => Object.values(s.named).every((v) => v && v.reason && v.reason.length > 40)));
  본다('⛔ 지면 문구에 한글 없음', !/[가-힣]/.test(JSON.stringify(업종표.map(({ rule, ...x }) => x))));
  본다('예외는 규칙 밖 코드여야(반도체 005930=264)', !규칙에드나(반, '264'));
  /* 공통 셈 */
  본다('차이 셈', Math.abs(차이(150, 100) - 0.5) < 1e-12);
  본다('종가가 없으면 null', 차이(150, null) === null);
  본다('목표가 없으면 null — 0 이 아니다', 차이(null, 100) === null);
  본다('종가 0 이면 null', 차이(150, 0) === null);
  const xs = [
    { code: '2', reports: 1, targets: { firms: 1 } },
    { code: '1', reports: 5, targets: { firms: 0 } },
    { code: '3', reports: 2, targets: { firms: 1 } },
  ].sort(줄세우기);
  본다('목표 낸 곳 많은 순 → 리포트 수 순', xs.map((x) => x.code).join(',') === '3,2,1');
  본다('날짜꼴', 날짜꼴('20261023') === '2026-10-23' && 날짜꼴('x') === null);
  /* 만들기 — 작은 가짜 자료로 */
  const 가짜 = {
    회사들: [
      { 종목: '000001', 업종코드: '3111' },
      { 종목: '000002', 업종코드: '64992' },
      { 종목: '009540', 업종코드: '64992' },
      { 종목: '000003', 업종코드: '31114' },
      { 종목: '082740', 업종코드: '29111' }, { 종목: '071970', 업종코드: '29119' },
      { 종목: '443060', 업종코드: '7212' }, { 종목: '033500', 업종코드: '201' },
    ],
    리서치: {
      _meta: { source: 'x', firstDay: '2026-06-29', lastDay: '2026-10-26' },
      byCode: {
        '000001': { nameEn: 'A Ships', reports: 3, brokerReports: 3, firms: 2, first: 'a', last: 'b', latestTargets: { firms: 2, min: 10, max: 20, median: 15 }, latest: [] },
        '009540': { nameEn: 'B Holdings', reports: 1, brokerReports: 1, firms: 1, first: 'a', last: 'b', latestTargets: { firms: 0, min: null, max: null, median: null }, latest: [] },
      },
    },
    재무영문: new Map(),
    시세파일: '20261023.ndjson',
    시세: new Map([['000001', { close: 10, date: '2026-10-23', noTrade: false, market: 'KOSPI' }]]),
  };
  const 결 = 만들기(조, 가짜);
  본다('규칙 + 이름 박은 예외가 든다, 지주사 000002 는 안 든다', 결.rows.map((r) => r.code).join(',') === '000001,009540');
  본다('예외 줄은 includedBy=named · 까닭이 붙는다', 결.rows[1].includedBy === 'named' && !!결.rows[1].reason);
  본다('목표 없는 예외 — 차이는 null(0 아님)', 결.rows[1].medianVsClose === null);
  본다('차이 셈 +50%', Math.abs(결.rows[0].medianVsClose - 0.5) < 1e-12);
  본다('종가 없는 회사는 종가 null', 결.rows[1].close === null && 결.rows[1].closeDate === null);
  본다('리서치 없는 규칙 회사는 noResearch', 결.noResearch.length === 1 && 결.noResearch[0].code === '000003');
  본다('matched = 표 + 없음', 결._meta.matched === 3);
  let 멈췄나 = false;
  try { 만들기({ ...조, named: { '000001': { reason: 'x'.repeat(50) } } }, 가짜); } catch { 멈췄나 = true; }
  본다('⛔ 예외가 규칙에도 들면 멈춘다', 멈췄나);
  멈췄나 = false;
  try { 만들기({ ...조, misses: ['000001'] }, 가짜); } catch { 멈췄나 = true; }
  본다('⛔ 놓친 예가 규칙에 들면 멈춘다', 멈췄나);

  const 실패 = 잰다.filter(([, ok]) => !ok);
  for (const [이름, ok] of 잰다) console.log(`${ok ? 'PASS' : 'FAIL'}  ${이름}`);
  if (실패.length) { console.error(`자가시험 실패 ${실패.length}건`); process.exit(1); }
  console.log(`자가시험 ${잰다.length}건 통과`);
}

function main() {
  const 고른 = process.argv.slice(2).filter((a) => !a.startsWith('-'));
  const 할것 = 고른.length ? 고른.map((k) => { const s = 업종(k); if (!s) throw new Error(`모르는 업종 ${k}`); return s; }) : 업종표;
  const 자료 = 읽기();
  if (!자료) { console.log('⚠ archive 가 없다 — 기존 출력 그대로 둔다'); process.exit(0); }
  for (const s of 할것) 쓰기(s, 자료);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--자가시험')) 자가시험();
  else main();
}
