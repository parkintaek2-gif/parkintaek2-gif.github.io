#!/usr/bin/env node
/**
 * kosis-probe.mjs — **KOSIS 표를 쓰기 전에, "이 표는 objL 몇 단계인가"를 짐작하지 않고 잰다.**
 *
 * ── 사고 (2026-09-01) ─────────────────────────────────────────
 * 3번이 `orgId=101&tblId=DT_1OH0510`을 objL **세** 단계(다른 표의 관행 그대로)로 조회해
 * `{"err":"21","errMsg":"잘못된 요청 변수를 호출 하였습니다."}`를 받고, 이것을
 * **"표가 존재하지 않는다·숫자가 지어낸 것"**으로 잘못 읽었다. 실제로는 그 표가 objL
 * **두** 단계였을 뿐이고, 두 단계로 다시 받으니 이미 커밋된 정확한 숫자와 한 자리도
 * 안 틀리고 맞았다. 다른 세션이 API 재조회로 먼저 잡아 주지 않았다면, 검증된 KOSIS
 * 1차 자료를 언론 인용 2차 자료로 통째로 갈아엎을 뻔했다.
 *
 * ⭐ 5번(2번 대행) 지시(2026-09-01 18:5x) — 「규칙은 문장이 아니라 검사로 둔다」.
 *   `docs/3번-업무매뉴얼.md`에 이미 prose 경고("objL2=ALL은 1,000행에서 조용히 잘릴 수
 *   있다")가 있었지만, 이번 사고는 그것과 **다른** 함정(개수 자체가 틀림)이었다.
 *   경고를 하나 더 적는 대신, **실제로 옳은 개수를 찾아 주는 함수**를 둔다.
 *
 * ⛔ err21 을 "표가 없다"로 읽지 않는다. **"objL 개수가 이 표와 안 맞다"를 먼저 의심한다.**
 * ⛔ 표가 진짜 없는지는 `statisticsSearch.do?searchNm=<통계명>`으로 목록에서 찾되,
 *   그 검색이 잘려(응답이 길면 일부만 옴) 특정 tblId가 안 보일 수 있다 — "목록에 없다"만으로
 *   존재 안 한다고 단정하지 않는다. 이 자가 직접 데이터를 받아 보는 편이 더 정확하다.
 *
 * 쓰는 법
 *   import { objL단계찾기 } from './lib/kosis-probe.mjs';
 *   const { 단계, 표본 } = await objL단계찾기(키, '101', 'DT_1OH0510');
 *   node scripts/lib/kosis-probe.mjs --selftest
 *   node scripts/lib/kosis-probe.mjs 101 DT_1OH0510   ← 실제로 재 본다(API 호출, 키 필요)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/** .env 에서 키를 읽는다. 없으면 던진다 — 짐작으로 빈 키를 넣지 않는다 */
export function 키읽기() {
  const env = fs.readFileSync(path.join(뿌리, '.env'), 'utf8');
  const m = env.match(/^KOSIS_API_KEY\s*=\s*(.+)$/m);
  if (!m) throw new Error('.env 에 KOSIS_API_KEY 가 없다');
  return m[1].trim();
}

/**
 * ⛔ 이 함수가 하는 일은 딱 하나 — **objL 1~5단계를 순서대로 넣어 보고, 처음으로
 *   배열(진짜 데이터)이 오는 단계를 답한다.** err20("필수변수 누락")·err21("잘못된 변수")은
 *   "표가 없다"가 아니라 "이 단계 수가 아니다"로 읽고 다음 단계로 넘어간다.
 *
 * @returns {Promise<{단계: number, 표본: object} | {단계: null, 마지막오류: string}>}
 *   단계가 null 이면 1~5 어느 것도 안 먹혔다는 뜻이다 — 이때만 "표 ID를 의심"한다.
 */
export async function objL단계찾기(키, orgId, tblId, { 최대단계 = 5 } = {}) {
  let 마지막오류 = '';
  for (let n = 1; n <= 최대단계; n++) {
    const objs = Array.from({ length: n }, (_, i) => `&objL${i + 1}=ALL`).join('');
    const u =
      `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${키}` +
      `&itmId=ALL${objs}&format=json&jsonVD=Y&orgId=${orgId}&tblId=${tblId}&prdSe=Y&newEstPrdCnt=1`;
    let j;
    try {
      j = await (await fetch(u)).json();
    } catch (e) {
      마지막오류 = `단계${n}: fetch/JSON 실패 — ${e.message}`;
      continue;
    }
    if (Array.isArray(j) && j.length > 0) {
      return { 단계: n, 표본: j[0] };
    }
    마지막오류 = `단계${n}: ${j?.errMsg ?? JSON.stringify(j).slice(0, 120)}`;
  }
  return { 단계: null, 마지막오류 };
}

/* ── 자가시험 ─────────────────────────────────────────── */
if (process.argv[1] && path.basename(process.argv[1]) === 'kosis-probe.mjs') {
  if (process.argv.includes('--selftest')) {
    const 본다 = (말, 참) => {
      console.log(참 ? '✅' : '🔴', 말);
      if (!참) process.exitCode = 1;
    };
    // 실제 API 를 부르지 않는, 함수 존재·형태만 확인하는 자가시험
    본다('① 키읽기가 함수다', typeof 키읽기 === 'function');
    본다('② objL단계찾기가 함수다', typeof objL단계찾기 === 'function');
    본다('③ objL단계찾기는 프라미스를 반환한다', objL단계찾기('x', '101', 'DT_없음', { 최대단계: 0 }) instanceof Promise);
    process.exit();
  }

  const [orgId, tblId] = process.argv.slice(2);
  if (!orgId || !tblId) {
    console.log('쓰는 법: node scripts/lib/kosis-probe.mjs <orgId> <tblId>   (또는 --selftest)');
    process.exit(1);
  }
  const 키 = 키읽기();
  const 결과 = await objL단계찾기(키, orgId, tblId);
  if (결과.단계 == null) {
    console.log(`🔴 objL 1~5 단계 전부 실패 — 이 tblId(${orgId}/${tblId})를 의심할 근거가 됐다.`);
    console.log(`   마지막 오류: ${결과.마지막오류}`);
    process.exitCode = 1;
  } else {
    console.log(`✅ ${orgId}/${tblId} 는 objL ${결과.단계}단계다.`);
    console.log(`   표본 — TBL_NM="${결과.표본.TBL_NM}" · C1_NM="${결과.표본.C1_NM ?? ''}" · PRD_DE=${결과.표본.PRD_DE}`);
  }
}
