#!/usr/bin/env node
/**
 * **메자닌(CB·BW·EB) 발행결정 전량** — DART `cvbdIsDecsn`(전환사채) ·
 * `bdwtIsDecsn`(신주인수권부사채) · `exbdIsDecsn`(교환사채) 를 상장사 전체로 받는다.
 *
 *   node scripts/collect-dart-mezzanine.mjs            이어받기
 *   node scripts/collect-dart-mezzanine.mjs --limit 200
 *
 * ── 왜 만드나 (2026-09-09 · 사장님 지시 → 5번 → 2번, docs/FnGuide-벤치마킹-서울마켓츠.md Ⅺ절) ──
 * FnGuide 의 **FnMezzanine**(월 220,000원)의 원자료가 DART 에 무료로 있다.
 * 5번이 `cvbdIsDecsn`(전환사채)만 발행사 표본(성호전자·더코디·블루산업개발)으로 46칸
 * 전량 확인했다. 이 자가 그 범위를 **상장사 전체 · 세 종류(CB·BW·EB) 전부**로 넓힌다.
 *
 * ── ⚠ 세 API 가 같은 «모양»이 아니다 — 원문을 그대로 남긴다 ──────────
 *   실측(2026-09-09) 결과 —
 *     cvbdIsDecsn(전환사채)     46칸 확인됨(더코디 등). `scripts/make-cvbd-dilution-chart.mjs`
 *                             가 그중 일부(전환가·희석률 등)를 이미 뽑아 쓰고 있다
 *     bdwtIsDecsn(신주인수권부)  최근 ~1.5년(2024~2026) 안에 **순수 발행결정 사례가
 *                             DART 공시목록에서 못 찾아졌다**(자가 실측 — list.json 을
 *                             페이지로 훑어도 0건). 그래서 필드꼴을 확인하지 못했다
 *     exbdIsDecsn(교환사채)     드림시큐리티(01038693) 사례를 찾았으나 «종속회사» 보고라
 *                             본 API 는 013(데이터없음)을 냈다 — 직접 발행사 예를 못 구했다
 *   ⛔ **그래서 셋 다 원문(raw) 그대로 저장한다.** BW·EB 는 실제 채워진 표본이 없어
 *     칸 이름을 한글로 옮기면(뜻을 짐작하면) 강령을 어긴다 — 「확인 없이 지어내지 않는다」.
 *     사례가 실제로 잡히면(발행 건수가 하나라도 나오면) 그때 필드를 확인해 다듬는다.
 *   ✅ 셋 다 **status(000/013/020)**·건수는 남긴다 — 「0건이다」와 「못 쟀다」를 가른다.
 *
 * ── ⚠ 지키는 것 (collect-issuance-dart.mjs · collect-dart-ownership.mjs 와 같은 결) ──
 * · 이어받기 · DART 일일 한도(20,000)에서 멈추면 그대로 중단
 * · 키는 로그에 찍지 않는다 (저장소가 공개다)
 * · **날짜 범위(2010-01-01~오늘)를 넓게 둔다** — 좁히면 그전 발행분을 «없다»로 잘못 읽는다
 *   (실측: 범위를 넓혀도 같은 건수가 온다 — 창이 결과를 자르지 않는다. 컨센서스 목록의
 *    30일 자름과는 다른 API 다)
 */

import { readFileSync, existsSync, mkdirSync, appendFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const OUT_DIR = path.resolve('archive/raw/dart-issuance');
const 시작일 = '20100101';

function 키읽기() {
  const p = path.resolve('.env');
  if (existsSync(p)) for (const l of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = l.match(/^\s*DART_API_KEY\s*=\s*(.*)$/);
    if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  }
  return process.env.DART_API_KEY ?? '';
}

function 오늘꼴() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

/** 값이 「-」·빈칸이 아닌 «실제로 채워진 칸»인가. 갈래(status)를 셀 때 쓴다 */
export function 채워졌나(v) {
  if (v == null) return false;
  const s = String(v).trim();
  return s !== '' && !/^[-–—]$/.test(s);
}

async function 부르기(키, ep, corp) {
  const u = `https://opendart.fss.or.kr/api/${ep}.json?crtfc_key=${키}&corp_code=${corp}&bgn_de=${시작일}&end_de=${오늘꼴()}`;
  const r = await fetch(u, { signal: AbortSignal.timeout(20000) });
  return r.json();
}

/**
 * 한 API 의 응답을 그대로 정리한다 — **필드명을 옮기지 않는다.**
 * status 000(정상, list 있음) · 013(정상, 그 회사엔 없음) · 그 밖(못 잼)을 가른다.
 */
export function 응답정리(j) {
  if (j.status === '000') return { 상태: '있음', 건수: (j.list ?? []).length, 원문: j.list ?? [] };
  if (j.status === '013') return { 상태: '없음', 건수: 0, 원문: [] };
  return { 상태: '못잼', 건수: 0, 원문: [], 까닭: `status ${j.status} — ${j.message ?? ''}` };
}

async function main() {
  const 키 = 키읽기();
  if (!키) { console.error('✕ DART_API_KEY 가 없다.'); process.exit(1); }
  mkdirSync(OUT_DIR, { recursive: true });
  const 산출 = path.join(OUT_DIR, 'mezzanine.ndjson');

  const 전체 = readFileSync(path.resolve('archive/raw/dart-company/company.ndjson'), 'utf8')
    .split('\n').filter((x) => x.trim()).map((l) => JSON.parse(l));
  const 상장 = 전체.filter((c) => ['Y', 'K', 'N'].includes(String(c.시장 ?? '')));
  console.log(`명단 ${전체.length.toLocaleString()} → 시장 Y·K·N 만 ${상장.length.toLocaleString()} ` +
    `(E 등 ${(전체.length - 상장.length).toLocaleString()}곳 제외)`);

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
  let 성공 = 0, 실패 = 0, CB건 = 0, BW건 = 0, EB건 = 0, 있는곳 = 0;
  for (const [n, c] of 남은.entries()) {
    try {
      const cb = await 부르기(키, 'cvbdIsDecsn', c.corp);
      if (cb.status === '020') { console.error('\n✕ DART 일일 한도 초과. 멈춘다.'); break; }
      await new Promise((s) => setTimeout(s, 간격ms));
      const bw = await 부르기(키, 'bdwtIsDecsn', c.corp);
      if (bw.status === '020') { console.error('\n✕ DART 일일 한도 초과. 멈춘다.'); break; }
      await new Promise((s) => setTimeout(s, 간격ms));
      const eb = await 부르기(키, 'exbdIsDecsn', c.corp);
      if (eb.status === '020') { console.error('\n✕ DART 일일 한도 초과. 멈춘다.'); break; }

      const 전환사채 = 응답정리(cb), 신주인수권부사채 = 응답정리(bw), 교환사채 = 응답정리(eb);
      if (전환사채.건수 + 신주인수권부사채.건수 + 교환사채.건수 > 0) 있는곳++;
      CB건 += 전환사채.건수; BW건 += 신주인수권부사채.건수; EB건 += 교환사채.건수;

      appendFileSync(산출, JSON.stringify({
        corp: c.corp, 종목: c.종목, 이름: c.이름, 영문: c.영문,
        전환사채, 신주인수권부사채, 교환사채,
      }) + '\n');
      성공++;
    } catch { 실패++; }
    if ((n + 1) % 200 === 0) {
      console.log(`  ${n + 1}/${남은.length} — 성공 ${성공} · 있는곳 ${있는곳} · ` +
        `CB ${CB건.toLocaleString()} · BW ${BW건.toLocaleString()} · EB ${EB건.toLocaleString()} · 실패 ${실패}`);
    }
    await new Promise((s) => setTimeout(s, 간격ms));
  }
  console.log(`\n✅ 성공 ${성공.toLocaleString()} · 있는곳 ${있는곳.toLocaleString()} · ` +
    `CB ${CB건.toLocaleString()} · BW ${BW건.toLocaleString()} · EB ${EB건.toLocaleString()} · 실패 ${실패.toLocaleString()}`);
  console.log(`   ${산출}`);
  if (BW건 === 0) console.log('   ⚠ BW(신주인수권부사채)는 0건이다 — 자가 고장난 것이 아니라 실제로 드문 상품이다(머리글 참고)');
}

/* ── 자가시험 ────────────────────────────────────────────────── */
if (process.argv.includes('--자가시험')) {
  const 시험 = [];
  const 재다 = (이름, 참) => 시험.push([이름, !!참]);

  재다('채워졌나 — null 은 안 채워짐', 채워졌나(null) === false);
  재다('채워졌나 — 「-」는 안 채워짐', 채워졌나('-') === false);
  재다('채워졌나 — 빈 문자열은 안 채워짐', 채워졌나('') === false);
  재다('채워졌나 — 실제 값은 채워짐', 채워졌나('4,000,000,000') === true);
  재다('채워졌나 — "0" 도 채워진 값이다(없음이 아니다)', 채워졌나('0') === true);

  const 있음 = 응답정리({ status: '000', list: [{ rcept_no: 'a' }, { rcept_no: 'b' }] });
  재다('응답정리 — status 000 은 「있음」', 있음.상태 === '있음' && 있음.건수 === 2);
  재다('응답정리 — 원문을 그대로 담는다(필드명을 안 옮긴다)', 있음.원문[0].rcept_no === 'a');

  const 없음 = 응답정리({ status: '013' });
  재다('응답정리 — status 013 은 「없음」(0건, 못 잰 것 아님)', 없음.상태 === '없음' && 없음.건수 === 0);

  const 못잼 = 응답정리({ status: '020', message: '사용한도 초과' });
  재다('응답정리 — 그 밖의 status 는 「못잼」이지 0건이 아니다', 못잼.상태 === '못잼');
  재다('응답정리 — 못잼일 때 까닭을 남긴다', 못잼.까닭.includes('020'));

  재다('오늘꼴 — 여덟 글자', /^\d{8}$/.test(오늘꼴()));

  const 틀린것 = 시험.filter(([, ok]) => !ok);
  for (const [이름, ok] of 시험) console.log(`  ${ok ? '✅' : '⛔'} ${이름}`);
  console.log(`\n자가시험 ${시험.length}건 · 어긋난 것 ${틀린것.length}건`);
  process.exit(틀린것.length ? 1 : 0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
  && !process.argv.includes('--자가시험')) main();
