#!/usr/bin/env node
/**
 * **지분공시** — DART `majorstock`(대량보유상황보고, 5%룰) · `elestock`(임원·주요주주
 * 소유상황보고) 를 받는다.
 *
 *   node scripts/collect-dart-ownership.mjs            이어받기
 *   node scripts/collect-dart-ownership.mjs --limit 200
 *
 * ── 왜 만드나 (2026-09-09 · 사장님 지시 → 5번 → 2번, docs/FnGuide-벤치마킹-서울마켓츠.md Ⅺ절) ──
 * FnGuide 의 **FnOwnership**(월 110,000원 — 지분 구조·주주 변동 추적)의 원자료가
 * DART 에 무료로 있고, 우리 열쇠로 이미 열린다(5번이 삼성전자로 실측: majorstock 41행 ·
 * elestock 3,399행). 이 자가 그것을 상장사 전체로 받는다.
 *
 * ── 무엇이 오나 ────────────────────────────────────────────────
 * 두 API 모두 `corp_code` **하나만**으로 그 회사의 **전체 이력**이 온다
 * (재무제표류처럼 `bsns_year`·`reprt_code` 가 없다 — 연도로 자르지 않는다).
 *   majorstock  대량보유(5% 이상) 상황 — 보고자·보유주식수·보유비율의 변동 이력
 *   elestock    임원·주요주주 개인별 소유상황 — 성명·직위·소유수·소유비율의 변동 이력
 *
 * ── ⚠ 지키는 것 (collect-issuance-dart.mjs 와 같은 결) ──────────────
 * · **원문을 같이 저장한다.** 파서를 고쳤을 때 다시 안 받으려고
 * · 이어받기 · DART 일일 한도(20,000)에서 멈추면 그대로 중단
 * · 키는 로그에 찍지 않는다 (저장소가 공개다)
 * · `Number(null)===0` 함정 — 「-」(값 없음)와 「0」을 가른다. 빈 칸을 0 으로 안 채운다
 */

import { readFileSync, existsSync, mkdirSync, appendFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const OUT_DIR = path.resolve('archive/raw/dart-ownership');

function 키읽기() {
  const p = path.resolve('.env');
  if (existsSync(p)) for (const l of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = l.match(/^\s*DART_API_KEY\s*=\s*(.*)$/);
    if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  }
  return process.env.DART_API_KEY ?? '';
}

/** ⚠ 「-」와 빈칸은 **없음**이다. 0 으로 만들지 않는다. 콤마 섞인 수도 읽는다(음수 포함) */
export function 수(v) {
  if (v == null) return null;
  const s = String(v).replace(/,/g, '').trim();
  if (!s || /^[-–—]$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** "2024-10-25" 등 날짜 원문을 그대로 남기되, 8자리 숫자꼴도 함께 준다. 못 읽으면 null */
export function 날짜(v) {
  const s = String(v ?? '').replace(/[^0-9]/g, '');
  return /^\d{8}$/.test(s) ? s : null;
}

/** 대량보유상황보고(majorstock) 한 줄 */
export function 대량보유정리(x) {
  return {
    접수번호: x.rcept_no ?? null,
    접수일: 날짜(x.rcept_dt),
    보고구분: x.report_tp ?? null,           // 신규 · 변동 · 일반 등
    보고자: x.repror ?? null,
    보유주식수: 수(x.stkqy),
    보유주식수증감: 수(x.stkqy_irds),
    보유비율: 수(x.stkrt),
    보유비율증감: 수(x.stkrt_irds),
    특별관계자주식수: 수(x.ctr_stkqy),
    특별관계자비율: 수(x.ctr_stkrt),
    보고사유원문: x.report_resn ?? null,
  };
}

/** 임원·주요주주 소유상황(elestock) 한 줄 */
export function 임원주주정리(x) {
  return {
    접수번호: x.rcept_no ?? null,
    접수일: 날짜(x.rcept_dt),
    성명: x.repror ?? null,
    등기여부: x.isu_exctv_rgist_at ?? null,   // 등기임원 · 미등기임원
    직위: x.isu_exctv_ofcps ?? null,
    관계: x.isu_main_shrholdr ?? null,        // 본인 · 최대주주 등
    소유주식수: 수(x.sp_stock_lmp_cnt),
    소유주식수증감: 수(x.sp_stock_lmp_irds_cnt),
    소유비율: 수(x.sp_stock_lmp_rate),
    소유비율증감: 수(x.sp_stock_lmp_irds_rate),
  };
}

async function 부르기(키, ep, corp) {
  const u = `https://opendart.fss.or.kr/api/${ep}.json?crtfc_key=${키}&corp_code=${corp}`;
  const r = await fetch(u, { signal: AbortSignal.timeout(20000) });
  return r.json();
}

async function main() {
  const 키 = 키읽기();
  if (!키) { console.error('✕ DART_API_KEY 가 없다.'); process.exit(1); }
  mkdirSync(OUT_DIR, { recursive: true });
  const 산출 = path.join(OUT_DIR, 'ownership.ndjson');

  /* ⚠ 시장 코드로 거른다. E(기타)는 대부분 상장폐지·등록취소라 헛부름이 된다 —
     collect-issuance-dart.mjs 와 같은 이유다. */
  const 전체 = readFileSync(path.resolve('archive/raw/dart-company/company.ndjson'), 'utf8')
    .split('\n').filter((x) => x.trim()).map((l) => JSON.parse(l));
  const 상장 = 전체.filter((c) => ['Y', 'K', 'N'].includes(String(c.시장 ?? '')));
  console.log(`명단 ${전체.length.toLocaleString()} → 시장 Y·K·N 만 ${상장.length.toLocaleString()} ` +
    `(E 등 ${(전체.length - 상장.length).toLocaleString()}곳 제외)`);

  /* 이어받기 */
  const 완료 = new Set();
  if (existsSync(산출)) for (const l of readFileSync(산출, 'utf8').split('\n')) {
    if (!l.trim()) continue;
    try { 완료.add(JSON.parse(l).corp); } catch { /* 깨진 줄 */ }
  }
  const i = process.argv.indexOf('--limit');
  const 한도 = i > -1 ? Number(process.argv[i + 1]) : Infinity;
  const 남은 = 상장.filter((c) => !완료.has(c.corp)).slice(0, 한도);
  console.log(`상장사 ${상장.length.toLocaleString()} · 이미 받음 ${완료.size.toLocaleString()} · 이번에 ${남은.length.toLocaleString()}`);

  const 간격ms = 200;
  let 성공 = 0, 없음 = 0, 실패 = 0, 대량보유행 = 0, 임원주주행 = 0;
  for (const [n, c] of 남은.entries()) {
    try {
      const a = await 부르기(키, 'majorstock', c.corp);
      if (a.status === '020') { console.error('\n✕ DART 일일 한도 초과. 멈춘다.'); break; }
      await new Promise((s) => setTimeout(s, 간격ms));
      const b = await 부르기(키, 'elestock', c.corp);
      if (b.status === '020') { console.error('\n✕ DART 일일 한도 초과. 멈춘다.'); break; }

      if (a.status !== '000' && b.status !== '000') { 없음++; }
      else {
        const 대량보유 = (a.list ?? []).map(대량보유정리).filter((x) => x.접수번호);
        const 임원주주 = (b.list ?? []).map(임원주주정리).filter((x) => x.접수번호);
        대량보유행 += 대량보유.length;
        임원주주행 += 임원주주.length;
        appendFileSync(산출, JSON.stringify({
          corp: c.corp, 종목: c.종목, 이름: c.이름, 영문: c.영문,
          대량보유, 임원주주,
        }) + '\n');
        성공++;
      }
    } catch { 실패++; }
    if ((n + 1) % 200 === 0) {
      console.log(`  ${n + 1}/${남은.length} — 성공 ${성공} · 대량보유행 ${대량보유행.toLocaleString()} · ` +
        `임원주주행 ${임원주주행.toLocaleString()} · 미제출 ${없음} · 실패 ${실패}`);
    }
    await new Promise((s) => setTimeout(s, 간격ms));
  }
  console.log(`\n✅ 성공 ${성공.toLocaleString()} · 대량보유행 ${대량보유행.toLocaleString()} · ` +
    `임원주주행 ${임원주주행.toLocaleString()} · 미제출 ${없음.toLocaleString()} · 실패 ${실패.toLocaleString()}`);
  console.log(`   ${산출}`);
}

/* ── 자가시험 ────────────────────────────────────────────────── */
if (process.argv.includes('--자가시험')) {
  const 시험 = [];
  const 재다 = (이름, 참) => 시험.push([이름, !!참]);

  재다('수 — null 은 null', 수(null) === null);
  재다('수 — 「-」는 없음(null)', 수('-') === null);
  재다('수 — 빈 문자열은 null', 수('') === null);
  재다('수 — 콤마 섞인 수를 읽는다', 수('1,198,889,258') === 1198889258);
  재다('수 — 음수도 읽는다', 수('-5,000') === -5000);
  재다('수 — "0.00" 은 진짜 0이다 (없음이 아니다)', 수('0.00') === 0);
  재다('날짜 — 하이픈 있는 날을 8자리로', 날짜('2024-10-25') === '20241025');
  재다('날짜 — 못 읽으면 null', 날짜('') === null);

  const 대량보기 = 대량보유정리({
    rcept_no: '20241025000530', rcept_dt: '2024-10-25', report_tp: '일반', repror: '삼성물산',
    stkqy: '1,198,889,258', stkqy_irds: '6,317', stkrt: '20.08', stkrt_irds: '0.00',
    ctr_stkqy: '97,526,980', ctr_stkrt: '1.63', report_resn: '보유주식수 변동',
  });
  재다('대량보유정리 — 접수일을 8자리로', 대량보기.접수일 === '20241025');
  재다('대량보유정리 — 보유주식수를 숫자로', 대량보기.보유주식수 === 1198889258);
  재다('대량보유정리 — 보유비율증감 "0.00" 은 0(없음 아님)', 대량보기.보유비율증감 === 0);

  const 임원보기 = 임원주주정리({
    rcept_no: '20240910000022', rcept_dt: '2024-09-10', repror: '노태문',
    isu_exctv_rgist_at: '등기임원', isu_exctv_ofcps: '사장', isu_main_shrholdr: '-',
    sp_stock_lmp_cnt: '23,000', sp_stock_lmp_irds_cnt: '5,000',
    sp_stock_lmp_rate: '0.00', sp_stock_lmp_irds_rate: '0.00',
  });
  재다('임원주주정리 — 성명·직위', 임원보기.성명 === '노태문' && 임원보기.직위 === '사장');
  재다('임원주주정리 — 관계 "-" 는 원문 그대로 남긴다', 임원보기.관계 === '-');
  재다('임원주주정리 — 소유주식수를 숫자로', 임원보기.소유주식수 === 23000);

  재다('빈 응답 — 접수번호 없으면 걸러진다', !대량보유정리({}).접수번호);

  const 틀린것 = 시험.filter(([, ok]) => !ok);
  for (const [이름, ok] of 시험) console.log(`  ${ok ? '✅' : '⛔'} ${이름}`);
  console.log(`\n자가시험 ${시험.length}건 · 어긋난 것 ${틀린것.length}건`);
  process.exit(틀린것.length ? 1 : 0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
  && !process.argv.includes('--자가시험')) main();
