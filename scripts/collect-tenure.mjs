#!/usr/bin/env node
/**
 * **상장사 평균 근속연수·급여** 를 DART 에서 전부 받는다.
 *
 *   npm run collect:tenure           이어받기 (이미 받은 건 건너뛴다)
 *   npm run collect:tenure -- --year 2024
 *
 * ── 왜 이걸 만드나 ─────────────────────────────────────────────
 * 사장님 지시(2026-08-04):
 *   「**이직이 많은 직종과 회사 순위 / 근속연수가 긴 직종과 회사 순위 /
 *     직업수명이 긴 직종 순위** 등도 수집, 서비스, **언론에 홍보 자료로 제공**」
 *
 * 그리고 이건 백년지도의 모토 —「**대학 이후**」— 에 정확히 붙는다.
 * 「이 회사 가면 몇 년이나 다니나」는 학과 선택보다 뒤에 오는 질문이고,
 * 그 답이 지금까지 **감으로만** 오갔다. 숫자가 이미 공시돼 있는데도 그랬다.
 *
 * ── 왜 DART 인가 ───────────────────────────────────────────────
 * 사업보고서 「직원 등의 현황」은 **법정 공시항목**이다. 회사가 직접 신고한다.
 * 잡플래닛·크레딧잡 같은 민간 추정이 아니라 **원본**이다.
 *   평균 근속연수 · 1인평균급여 · 정규/기간제 · **성별 구분**까지 한 번에 온다.
 *
 * ⚠ 성별이 따로 오는 게 중요하다. 「이 회사 근속 14년」이 아니라
 *   「남 14.0 / 여 13.0」이다. **격차 자체가 기사다.**
 *
 * ── ⚠ 지키는 것 ───────────────────────────────────────────────
 * · DART 일일 한도 20,000건. 상장사가 2,600 안팎이라 여유가 있지만 **간격을 둔다**
 * · 중간에 끊겨도 **이어받는다** — 이미 받은 corp_code 는 다시 부르지 않는다
 * · 키는 절대 로그에 찍지 않는다 (저장소가 공개다)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const XML = path.resolve('archive/raw/dart-corpcode/CORPCODE.xml');
const OUT_DIR = path.resolve('archive/raw/dart-employment');
const 간격ms = 220;

function 키읽기() {
  const p = path.resolve('.env');
  if (existsSync(p)) {
    for (const l of readFileSync(p, 'utf8').split(/\r?\n/)) {
      const m = l.match(/^\s*DART_API_KEY\s*=\s*(.*)$/);
      if (m) return m[1].trim().replace(/^["']|["']$/g, '');
    }
  }
  return process.env.DART_API_KEY ?? '';
}

/** `<list>` 한 덩이에서 태그 값. ⚠ 엔티티를 푼다 — 회사명에 `&` 가 흔하다 */
function 값(덩이, 태그) {
  const m = 덩이.match(new RegExp(`<${태그}>([\\s\\S]*?)</${태그}>`));
  if (!m) return '';
  return m[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/\s+/g, ' ').trim();
}

/** 상장사만 뽑는다. 비상장 11만 개를 부를 이유가 없다 */
export function 상장사목록(xml) {
  const 표 = [];
  for (const m of xml.matchAll(/<list>([\s\S]*?)<\/list>/g)) {
    const 덩이 = m[1];
    const 종목 = 값(덩이, 'stock_code');
    if (!종목) continue;
    표.push({ corp: 값(덩이, 'corp_code'), 종목, 이름: 값(덩이, 'corp_name'), 영문: 값(덩이, 'corp_eng_name') });
  }
  return 표;
}

/**
 * 숫자 정리. DART 는 `93,800` 처럼 쉼표를 넣어 보내고,
 * 없으면 `-` 나 빈 문자열이나 `해당사항없음` 을 보낸다.
 * ⚠ **0 과 없음을 구분한다.** 없는 걸 0 으로 만들면 순위가 통째로 틀린다.
 */
export function 수(v) {
  if (v == null) return null;
  const s = String(v).replace(/,/g, '').trim();
  if (!s || /^[-–—]$/.test(s) || /해당|없음/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** 성별 두 줄을 하나로 합친다 — 가중평균이어야 한다. 단순평균은 틀린다 */
export function 합치기(행들) {
  const 남 = 행들.find((x) => /남/.test(x.sexdstn ?? ''));
  const 여 = 행들.find((x) => /여/.test(x.sexdstn ?? ''));
  /* ⚠ `??` 와 `||` 는 괄호 없이 못 섞는다 (문법 오류다). 뜻도 다르니 명시적으로 쓴다 */
  const 인원 = (x) => {
    const 합 = 수(x?.sm);
    if (합 != null) return 합;
    const 정 = 수(x?.rgllbr_co) ?? 0;
    const 기 = 수(x?.cnttk_co) ?? 0;
    return 정 + 기 > 0 ? 정 + 기 : null;
  };
  const 남수 = 인원(남), 여수 = 인원(여);
  const 남근 = 수(남?.avrg_cnwk_sdytrn), 여근 = 수(여?.avrg_cnwk_sdytrn);
  let 전체근속 = null;
  if (남근 != null && 여근 != null && 남수 && 여수) 전체근속 = +(((남근 * 남수) + (여근 * 여수)) / (남수 + 여수)).toFixed(2);
  else 전체근속 = 남근 ?? 여근;
  return {
    남: 남수, 여: 여수, 인원: (남수 ?? 0) + (여수 ?? 0) || null,
    근속: 전체근속, 근속남: 남근, 근속여: 여근,
    /* 급여는 회사가 「원」 단위로 신고한다. 그대로 둔다 — 단위 변환은 표시할 때 한다 */
    급여남: 수(남?.jan_salary_am), 급여여: 수(여?.jan_salary_am),
  };
}

async function main() {
  const 연도인덱스 = process.argv.indexOf('--year');
  const 연도 = 연도인덱스 > -1 ? process.argv[연도인덱스 + 1] : '2025';
  const 키 = 키읽기();
  if (!키) { console.error('✕ DART_API_KEY 가 없다. .env 를 확인한다.'); process.exit(1); }
  if (!existsSync(XML)) { console.error(`✕ ${XML} 이 없다. npm run collect:dart:corpcode 를 먼저.`); process.exit(1); }

  mkdirSync(OUT_DIR, { recursive: true });
  const 산출 = path.join(OUT_DIR, `employment-${연도}.ndjson`);

  /* 이어받기 — 이미 받은 건 다시 안 부른다 */
  const 완료 = new Set();
  if (existsSync(산출)) {
    for (const l of readFileSync(산출, 'utf8').split('\n')) {
      if (!l) continue;
      try { 완료.add(JSON.parse(l).corp); } catch { /* 깨진 줄은 그냥 넘긴다 */ }
    }
  }

  const 목록 = 상장사목록(readFileSync(XML, 'utf8'));
  const 남은 = 목록.filter((x) => !완료.has(x.corp));
  console.log(`상장사 ${목록.length.toLocaleString()} · 이미 받음 ${완료.size.toLocaleString()} · 받을 것 ${남은.length.toLocaleString()} (${연도}년 사업보고서)`);

  let 성공 = 0, 없음 = 0, 실패 = 0;
  for (const [i, c] of 남은.entries()) {
    const u = `https://opendart.fss.or.kr/api/empSttus.json?crtfc_key=${키}&corp_code=${c.corp}&bsns_year=${연도}&reprt_code=11011`;
    try {
      const r = await fetch(u, { signal: AbortSignal.timeout(20000) });
      const j = await r.json();
      if (j.status === '013') { 없음++; }
      else if (j.status !== '000') {
        실패++;
        /* ⚠ 한도 초과(020)면 **멈춘다.** 계속 두드리면 내일까지 막힌다 */
        if (j.status === '020') { console.error(`\n✕ DART 일일 한도 초과. 여기서 멈춘다. 내일 같은 명령으로 이어받는다.`); break; }
      } else {
        /* 「전사」 또는 성별합계 행을 쓴다. 사업부문별로 쪼개 신고한 회사는 합계 행만 본다 */
        const 전체 = j.list.filter((x) => !x.fo_bbm || /전사|합\s*계|계$/.test(x.fo_bbm));
        const 쓸행 = 전체.length ? 전체 : j.list;
        const v = 합치기(쓸행);
        appendFileSync(산출, JSON.stringify({
          corp: c.corp, 종목: c.종목, 이름: c.이름, 영문: c.영문, 연도, ...v,
        }) + '\n');
        성공++;
      }
    } catch { 실패++; }
    if ((i + 1) % 200 === 0) console.log(`  ${i + 1}/${남은.length} — 성공 ${성공} · 미제출 ${없음} · 실패 ${실패}`);
    await new Promise((x) => setTimeout(x, 간격ms));
  }
  console.log(`\n✅ ${연도}년 — 성공 ${성공.toLocaleString()} · 미제출 ${없음.toLocaleString()} · 실패 ${실패.toLocaleString()}`);
  console.log(`   ${산출}`);
}

/* ⚠ argv[1] 이 없을 때(node -e 로 불러들일 때)를 막는다 — 시험이 여기서 죽었다 */
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
