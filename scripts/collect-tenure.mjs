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

/**
 * **평균 근속연수**를 읽는다. ⚠ `수()` 로 읽으면 안 된다.
 *
 * ── 2026-08-04 에 잡은 것 ──────────────────────────────────────
 * 순위표에서 근속 채움률이 **63.5%** 였다. 「회사들이 공시를 덜 했나 보다」로
 * 넘길 뻔했는데, **같은 표의 급여는 96~98%** 였다. 같은 공시 같은 행에서
 * 하나만 빠질 리 없다. DART 원문을 직접 열어 보니 이랬다.
 *
 *   " 5년 8월"   "7년6월"   "7년8개월"   "04년 04개월"   "12년 10개월"
 *
 * **회사들은 다 공시했다. `Number("5년 8월")` 이 NaN 이라 내가 버리고 있었다.**
 * 근속만 null 인 1,067곳 중 **959곳이 급여는 갖고 있었다** — 전부 이 경우다.
 *
 * ⚠ 여기서 「월」은 **개월**이다. 8월(August)이 아니다.
 * ⚠ 이런 자유 서식은 **회사가 손으로 적는 칸**이라 표기가 제각각이다.
 *   못 읽는 꼴을 만나면 **0 으로 만들지 말고 null 로 둔다** — 없는 걸 0 으로 하면
 *   「근속 0년 회사」가 순위 맨 아래에 줄줄이 생긴다.
 */
export function 근속연수(v) {
  if (v == null) return null;
  const s = String(v).replace(/,/g, '').replace(/\s+/g, ' ').trim();
  if (!s || /^[-–—]$/.test(s) || /해당|없음|미공시/.test(s)) return null;

  /* "N년 M개월" · "N년M월" · "N년" — 앞의 0 이 붙어 와도 된다("04년 04개월") */
  const m = s.match(/(\d+(?:\.\d+)?)\s*년(?:\s*(\d+(?:\.\d+)?)\s*(?:개월|월))?/);
  if (m) {
    const 년 = Number(m[1]);
    const 월 = m[2] == null ? 0 : Number(m[2]);
    if (Number.isFinite(년) && Number.isFinite(월)) return +(년 + 월 / 12).toFixed(2);
  }
  /* "N개월" 만 온 경우 */
  const m2 = s.match(/^(\d+(?:\.\d+)?)\s*(?:개월|월)$/);
  if (m2) { const 월 = Number(m2[1]); if (Number.isFinite(월)) return +(월 / 12).toFixed(2); }

  /* 그냥 숫자로 적은 회사도 있다 ("10.5") */
  return 수(s);
}

/**
 * ⭐ **합계 행을 골라낸다.** 회사는 세 가지 꼴 중 하나로 신고한다.
 *
 * ```
 * ① 부문 없이 성별 두 줄        SK하이닉스 — 반도체 남 / 여        그냥 쓴다
 * ② 부문별 + 합계 줄            삼성전자 — DX·DS + **성별합계**    합계만 쓴다
 * ③ 부문별만 (합계 없음)        여러 중소형사                       **전부 더한다**
 * ```
 *
 * ⚠ **② 를 놓치면 큰 회사가 통째로 틀린다.** 삼성전자가 그랬다 —
 *   DX 부문만 세어 **50,817 명**으로 나갔다. 실제 신고는 **128,881 명**이다.
 *   순위표에서 삼성전자가 SK하이닉스보다 작아 보였다. 오류는 하나도 안 났다.
 *
 * ⚠ **낱말 하나로 판정하지 않는다.** 예전 정규식은 `/계$/` 를 썼는데
 *   **「기계」 사업부문이 합계로 잡힌다.** 그래서 **통째로 맞을 때만** 합계로 본다.
 *   못 알아보면 ③ 으로 떨어져 **전부 더하므로 결과는 여전히 맞다** — 안전한 쪽으로 틀린다.
 */
/**
 * ⚠⚠ **못 알아본 합계는 두 배가 된다.** 못 알아본 부문은 그냥 버려지는 게 아니다 —
 *   합계 행이 **부문 행과 같이 더해진다.**
 *
 * 처음엔 「성별합계」만 넣었다. 실제 자료에는 이런 것들이 더 있었다(2026-08-05 실측).
 * ```
 * 성별 총계  삼성전기 · 대주전자재료 · 한솔테크닉스 · 솔루엠   → **인원이 정확히 2배**
 * 성별계     3billion                                    → 2배
 * 회사 계    현대해상                                     → (부문 행이 없어 무사했다)
 * ```
 * 삼성전기가 **24,346 으로 나가 있었다. 실제는 12,173 이다.**
 * 국민연금 가입자수가 12,528 이라 ×0.51 로 보였는데 **연금이 맞았다.**
 *
 * 그래서 **접두사 + 합계말** 꼴을 통째로 받는다. 낱말 조각으로 맞추지 않는다 —
 * `/계$/` 로 하면 **기계·농기계·건설기계·설계·반도체설계·광주신세계**가 합계가 된다(실측 12종).
 */
export const 합계행인가 = (x) => {
  const s = String(x?.fo_bbm ?? '').replace(/[\s()]/g, '');
  return !s || /^(전사|전체|합계|총계|소계|계|(전사|전체|회사|성별)(합계|총계|소계|계))$/.test(s);
};

/**
 * 성별 줄을 하나로 합친다 — 가중평균이어야 한다. 단순평균은 틀린다.
 *
 * ⚠⚠ **행 고르기가 이 함수 안에 있어야 한다.**
 *   원래는 `main()` 안에만 있었다. 그래서 `refetch-tenure.mjs` 가 `j.list` 를
 *   **그대로 넘겼고**, 필터를 건너뛴 채 2,921 개사를 다시 받았다.
 *   호출자가 어길 수 있는 규칙은 **언젠가 어겨진다.** 불변식은 안으로 넣는다.
 */
export function 합치기(행들) {
  const 목록 = Array.isArray(행들) ? 행들 : [];
  const 합계 = 목록.filter(합계행인가);
  const 쓸것 = 합계.length ? 합계 : 목록;

  /* ⚠ `.find()` 를 쓰면 **첫 줄만** 쓰고 나머지를 조용히 버린다. 성별로 **전부 더한다** */
  const 성별 = (표시) => 쓸것.filter((x) => 표시.test(String(x.sexdstn ?? '')));
  const 남들 = 성별(/남/), 여들 = 성별(/여/);
  /* ⚠ `??` 와 `||` 는 괄호 없이 못 섞는다 (문법 오류다). 뜻도 다르니 명시적으로 쓴다 */
  const 인원 = (x) => {
    const 합 = 수(x?.sm);
    if (합 != null) return 합;
    const 정 = 수(x?.rgllbr_co) ?? 0;
    const 기 = 수(x?.cnttk_co) ?? 0;
    return 정 + 기 > 0 ? 정 + 기 : null;
  };

  /** 인원 합. 한 명도 못 읽으면 null 이다 — **0 으로 만들지 않는다** */
  const 인원합 = (행) => {
    const v = 행.map(인원).filter((x) => x != null);
    return v.length ? v.reduce((a, b) => a + b, 0) : null;
  };
  /**
   * 값을 **인원으로 가중평균**한다. 부문마다 사람 수가 다르니 단순평균은 틀린다.
   * ⚠ 인원을 못 읽은 줄은 **빼고** 센다. 0 으로 치면 그 줄이 평균을 끌어내린다.
   */
  const 가중 = (행, 뽑기) => {
    let 합 = 0, 무게 = 0;
    for (const x of 행) {
      const v = 뽑기(x), w = 인원(x);
      if (v == null || !w) continue;
      합 += v * w; 무게 += w;
    }
    if (무게) return +(합 / 무게).toFixed(2);
    /* 인원이 하나도 없으면 값만이라도 평균낸다 (한 줄짜리 회사가 여기 온다) */
    const v = 행.map(뽑기).filter((x) => x != null);
    return v.length ? +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(2) : null;
  };

  const 남수 = 인원합(남들), 여수 = 인원합(여들);
  /* ⚠ `수()` 가 아니라 `근속연수()` 다. 「5년 8월」 같은 한글 표기가 온다 */
  const 남근 = 가중(남들, (x) => 근속연수(x?.avrg_cnwk_sdytrn));
  const 여근 = 가중(여들, (x) => 근속연수(x?.avrg_cnwk_sdytrn));
  let 전체근속 = null;
  if (남근 != null && 여근 != null && 남수 && 여수) 전체근속 = +(((남근 * 남수) + (여근 * 여수)) / (남수 + 여수)).toFixed(2);
  else 전체근속 = 남근 ?? 여근;
  return {
    남: 남수, 여: 여수, 인원: (남수 ?? 0) + (여수 ?? 0) || null,
    근속: 전체근속, 근속남: 남근, 근속여: 여근,
    /* 급여는 회사가 「원」 단위로 신고한다. 그대로 둔다 — 단위 변환은 표시할 때 한다 */
    급여남: 가중(남들, (x) => 수(x?.jan_salary_am)),
    급여여: 가중(여들, (x) => 수(x?.jan_salary_am)),
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

  /* 이어받기 — 이미 받은 건 다시 안 부른다.
   *
   * ⚠ `--refetch` 는 그 이어받기를 **끄고 전부 다시 받는다.**
   *   파싱 규칙을 고쳤을 때 필요하다 — 저장된 파일에는 **파싱 결과만** 있고
   *   원문이 없으므로, 규칙만 고치고 다시 돌리면 아무것도 안 바뀐다.
   *   2026-08-04 에 근속 파서를 고치고 그냥 돌렸다가 **0곳 변경**을 보고 알았다. */
  const 완료 = new Set();
  /* ⚠ 이 파일은 **append** 로 쓴다. `--refetch` 면 먼저 비워야 중복이 안 쌓인다.
   *   비우기 전에 `.bak` 으로 옮겨 둔다 — 재수집이 중간에 죽어도 옛것이 남게. */
  if (existsSync(산출) && process.argv.includes('--refetch')) {
    writeFileSync(`${산출}.bak`, readFileSync(산출));
    writeFileSync(산출, '');
    console.log(`↻ 전부 다시 받는다. 옛 파일은 ${path.basename(산출)}.bak 에 뒀다`);
  }
  if (existsSync(산출) && !process.argv.includes('--refetch')) {
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
        /* ⚠ 행 고르기는 `합치기` 안에 있다. **여기서 미리 걸러내지 않는다** —
           예전엔 여기 있었고, 다른 스크립트가 그걸 건너뛰어 삼성전자가 틀렸다 */
        const v = 합치기(j.list);
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
