/**
 * financial-account-en.mjs — **F3 영문 계정 사전**을 찾아 준다 (docs/서울마켓츠-실행계획-영문FnGuide-재편.md F3).
 *
 * ── 무엇인가 ──────────────────────────────────────────────────────────────
 * DART fnlttSinglAcntAll(재무제표)의 account_nm(계정명)·sj_nm(재무제표명)은 한국어다.
 * 6번의 F1 수집기가 이 표를 받으면, 손님에게 낼 칸 이름은 영문이어야 한다(손님이 영어권).
 * 사전 원본: src/data/korea-financial-account-english.json
 *
 * ⛔ 이 자가 지키는 것 — src/data/korea-industry-name-english.json 과 같은 규율
 * ```
 * ⛔ 기계번역이 아니다. IFRS·K-IFRS 표준 영문 용어로 손으로 맞춘다
 * ⛔ 없는 계정명을 지어내지 않는다 — 사전에 없으면 unmapped:<원문> 을 돌려준다
 * ⚠ 이 사전은 9개사 표본(677개 중 핵심 반복 항목)이다. 6번의 F1(2,765사 전량)이
 *   돌면 그때 «실제 빈도»로 넓힌다 — 지금 짐작으로 채우지 않는다
 * ```
 *
 * 쓰는 법
 *   import { 계정명영문, 재무제표명영문 } from './lib/financial-account-en.mjs';
 *   node scripts/lib/financial-account-en.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const 사전길 = path.join(뿌리, 'src/data/korea-financial-account-english.json');
const 사전 = JSON.parse(fs.readFileSync(사전길, 'utf8'));

/** 계정명(account_nm) → 영문. 없으면 unmapped:<원문> (지어내지 않는다) */
export function 계정명영문(원문) {
  const s = String(원문 ?? '').trim();
  if (!s) return null;
  return Object.prototype.hasOwnProperty.call(사전.accountNames, s)
    ? 사전.accountNames[s]
    : `unmapped:${s}`;
}

/** 재무제표명(sj_nm) → 영문. 없으면 unmapped:<원문> */
export function 재무제표명영문(원문) {
  const s = String(원문 ?? '').trim();
  if (!s) return null;
  return Object.prototype.hasOwnProperty.call(사전.statementNames, s)
    ? 사전.statementNames[s]
    : `unmapped:${s}`;
}

/** 표본 파일(계정명 목록)을 이 사전에 대 붙어서 얼마나 맞나 잰다. 지어내지 않고 세기만 한다 */
export function 맞은비율(계정명들) {
  let 맞음 = 0;
  const 못맞은것 = [];
  for (const 이름 of 계정명들) {
    if (Object.prototype.hasOwnProperty.call(사전.accountNames, 이름)) 맞음 += 1;
    else 못맞은것.push(이름);
  }
  return { 전체: 계정명들.length, 맞음, 못맞은것 };
}

const 나 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (나 && process.argv.includes('--자가시험')) {
  let 통 = 0; const 실 = [];
  const 검 = (n, ok) => { if (ok) 통 += 1; else 실.push(n); };

  검('계정명영문 — 자산총계', 계정명영문('자산총계') === 'Total assets');
  검('계정명영문 — 매출액', 계정명영문('매출액') === 'Revenue');
  검('계정명영문 — 당기순이익', 계정명영문('당기순이익') === 'Net income');
  검('계정명영문 — 자본총계', 계정명영문('자본총계') === 'Total equity');
  검('계정명영문 — 영업이익', 계정명영문('영업이익') === 'Operating profit');
  검('⛔ 계정명영문 — 모르는 값은 지어내지 않고 unmapped 로 표시', 계정명영문('처음보는계정') === 'unmapped:처음보는계정');
  검('계정명영문 — 없으면 null', 계정명영문(null) === null);
  검('계정명영문 — 빈 글도 null', 계정명영문('') === null);

  검('재무제표명영문 — 재무상태표', 재무제표명영문('재무상태표') === 'Statement of Financial Position');
  검('재무제표명영문 — 손익계산서', 재무제표명영문('손익계산서') === 'Income Statement');
  검('재무제표명영문 — 현금흐름표', 재무제표명영문('현금흐름표') === 'Statement of Cash Flows');
  검('⛔ 재무제표명영문 — 모르는 값도 unmapped', 재무제표명영문('처음보는표') === 'unmapped:처음보는표');

  검('맞은비율 — 다 맞으면 못맞은것 0', 맞은비율(['자산총계', '매출액']).못맞은것.length === 0);
  검('맞은비율 — 못 맞은 것을 이름으로 남긴다(0으로 감추지 않는다)',
    맞은비율(['자산총계', '없는계정']).못맞은것[0] === '없는계정');
  검('맞은비율 — 전체·맞음 수를 낸다', 맞은비율(['자산총계', '없는계정']).전체 === 2
    && 맞은비율(['자산총계', '없는계정']).맞음 === 1);

  검('사전 — 핵심 밸류에이션 계정 다섯이 다 있다(PER·PBR·ROE 에 쓰인다)',
    ['자산총계', '자본총계', '부채총계', '매출액', '당기순이익'].every((k) => k in 사전.accountNames));
  검('사전 — 재무제표명 다섯이 다 있다', Object.keys(사전.statementNames).length === 5);
  검('🔴 「지어내지 않는다」가 코드에 살아 있다', fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').includes('지어내지 않는다'));

  if (실.length) {
    console.error(`❌ 자가시험 실패 ${실.length}\n${실.map((x) => `   · ${x}`).join('\n')}`);
    process.exit(1);
  }
  console.log(`✅ financial-account-en 짓는 자 — 자가시험 ${통}개 통과 (계정 ${Object.keys(사전.accountNames).length}개 · 재무제표명 ${Object.keys(사전.statementNames).length}개)`);
  process.exit(0);
}
