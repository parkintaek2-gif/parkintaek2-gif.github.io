#!/usr/bin/env node
/**
 * collect-dart-breaking.mjs — 영어 금융 속보의 **감지 배관** (사장님 지시 2026-08-14)
 *
 *   *「자동 감지·발행 배관 … 토큰 많이 안 쓰면 슬슬 해」*
 *
 * ## 무엇을 하나
 *   그날 DART 에 올라온 공시 목록을 받아 **시장이 움직일 만한 것만** 골라
 *   속보 후보로 세운다. 숫자가 구조화 API 로 나오는 유형은 그 수까지 붙인다.
 *   ⭐ 이것은 **감지**까지다. 영어 기사로 쓰는 **발행**은 사람(Claude)이 한다 —
 *      정확성 때문이다. 감지는 매일 싸게 돌고, 발행만 손이 든다.
 *
 * ## ⛔ 지킴선 (6번이 스스로 그은 것)
 *   · **1차 공시(DART)만.** 네이버 가공물 금지.
 *   · 투자자문 아님 — 후보는 사실이지 매수의견이 아니다.
 *   · 키는 로그에 찍지 않는다 (저장소가 공개다).
 *
 * 실행:  node scripts/collect-dart-breaking.mjs [YYYYMMDD]   (없으면 오늘)
 * 출력:  archive/raw/dart-breaking/<날짜>.json  +  콘솔 요약(상위 후보)
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');

function 키읽기() {
  const p = path.join(ROOT, '.env');
  if (existsSync(p)) for (const l of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = l.match(/^\s*DART_API_KEY\s*=\s*(.*)$/);
    if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  }
  return process.env.DART_API_KEY ?? '';
}
const K = 키읽기();
if (!K) { console.error('⛔ DART_API_KEY 가 없다. .env 를 본다.'); process.exit(1); }

/** 오늘 날짜(KST) YYYYMMDD — 인자로 덮어쓸 수 있다 */
function 오늘KST() {
  const now = new Date(Date.now() + 9 * 3600 * 1000);
  return now.toISOString().slice(0, 10).replace(/-/g, '');
}
const 날짜 = (process.argv[2] && /^\d{8}$/.test(process.argv[2])) ? process.argv[2] : 오늘KST();

/**
 * 속보로 값어치 있는 공시 유형과, 그 유형을 읽는 구조화 API·무게.
 * 무게가 클수록 시장 영향이 크다고 보고 위로 세운다.
 */
const 유형 = [
  { re: /매출액또는손익구조/, 무게: 9, 태그: 'earnings-swing', api: null },
  { re: /단일판매ㆍ?공급계약/, 무게: 8, 태그: 'supply-contract', api: null },
  { re: /자기주식취득결정/, 무게: 7, 태그: 'buyback', api: 'tsstkAqDecsn' },
  { re: /자기주식소각결정/, 무게: 8, 태그: 'cancellation', api: null },
  { re: /유상증자결정/, 무게: 7, 태그: 'rights-issue', api: 'piicDecsn' },
  { re: /무상증자결정/, 무게: 6, 태그: 'bonus-issue', api: 'fricDecsn' },
  { re: /타법인주식및출자증권취득결정/, 무게: 6, 태그: 'acquisition', api: null },
  { re: /전환사채권발행결정/, 무게: 6, 태그: 'convertible-bond', api: null },
  { re: /투자판단관련주요경영사항/, 무게: 5, 태그: 'material-event', api: null },
  { re: /주요사항보고서/, 무게: 4, 태그: 'major-report', api: null },
];

async function 젠(url) {
  const r = await fetch(url);
  return r.json();
}

/** 그날 공시 목록 전부 (페이지 넘김) */
async function 목록(de) {
  const all = [];
  for (let p = 1; p <= 25; p++) {
    const u = `https://opendart.fss.or.kr/api/list.json?crtfc_key=${K}&bgn_de=${de}&end_de=${de}&page_no=${p}&page_count=100`;
    const j = await 젠(u);
    if (j.status !== '000' || !j.list) break;
    all.push(...j.list);
    if (j.list.length < 100) break;
  }
  return all;
}

/** 자기주식 취득 결정의 수 (금액·주식수·소각여부) */
async function 자사주(cc, de) {
  const u = `https://opendart.fss.or.kr/api/tsstkAqDecsn.json?crtfc_key=${K}&corp_code=${cc}&bgn_de=${de}&end_de=${de}`;
  const j = await 젠(u);
  const r = (j.list || [])[0];
  if (!r) return null;
  return {
    주식: r.aqpln_stk_ostk, 금액원: r.aqpln_prc_ostk,
    방법: r.aq_mth, 목적: r.aq_pp,
    소각: /소각/.test(r.aq_pp || ''),
  };
}

const 목록전체 = await 목록(날짜);
console.log(`DART ${날짜} 총 공시 ${목록전체.length}건`);

// 후보 추리기 — 정정([기재정정] 등)은 원 유형으로 인식하되 표시
const 후보 = [];
for (const it of 목록전체) {
  const nm = it.report_nm;
  const t = 유형.find((x) => x.re.test(nm));
  if (!t) continue;
  후보.push({
    corp: it.corp_name, cls: it.corp_cls, code: it.stock_code, corp_code: it.corp_code,
    report: nm, rcept: it.rcept_no, flr: it.flr_nm,
    태그: t.태그, 무게: t.무게, 정정: /정정/.test(nm), api: t.api,
  });
}

// 자기주식은 수까지 붙인다 (구조화 API 가 있는 유형)
for (const c of 후보) {
  if (c.api === 'tsstkAqDecsn') {
    try { c.수 = await 자사주(c.corp_code, 날짜); } catch { c.수 = null; }
  }
}

후보.sort((a, b) => b.무게 - a.무게);

// 저장 (archive = gitignore, R2/사설 규약)
const 낼방 = path.join(ROOT, 'archive', 'raw', 'dart-breaking');
mkdirSync(낼방, { recursive: true });
const 파일 = path.join(낼방, `${날짜}.json`);
writeFileSync(파일, JSON.stringify({ 날짜, 총: 목록전체.length, 후보 }, null, 1));

// 콘솔 요약 — 상위 12
console.log(`\n속보 후보 ${후보.length}건 (무게순 상위 12):`);
for (const c of 후보.slice(0, 12)) {
  const 수 = c.수 ? ` · ${c.수.금액원}원${c.수.소각 ? ' [소각]' : ''}` : '';
  console.log(`  [${c.무게}] ${c.태그} · ${c.corp}(${c.cls}${c.code ? ' ' + c.code : ''})${c.정정 ? ' ⟳정정' : ''} · rcp=${c.rcept}${수}`);
}
console.log(`\n→ 전체: ${path.relative(ROOT, 파일)}`);
console.log('⭐ 감지까지다. 영어 속보로 쓸 한 건은 사람이 고르고 검산해 쓴다.');
