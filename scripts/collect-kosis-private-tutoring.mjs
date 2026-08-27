#!/usr/bin/env node
/**
 * 초중고 사교육비조사 — **사교육 참여율**(DT_1PE301) · **사교육비**(DT_1PE201) 수집
 *
 *   node scripts/collect-kosis-private-tutoring.mjs            # 받아서 저장
 *   node scripts/collect-kosis-private-tutoring.mjs --dry      # 저장하지 않고 재기만 한다
 *
 * ## ⭐ 왜 만드나 (2026-08-27)
 *
 *   사장님 지시 — 「끊임없이 데이터를 보강해야지」. `docs/새데이터-KOSIS-후보.md`(2번,
 *   2026-08-06)에 적혀 있던 후보(학교급별 사교육 참여율)가 3주째 손도 안 대고 있었다.
 *   🔴 **우리 강령과 정면으로 닿는 자리다** — 「학원을 팔지 않는다. 그래서 안 다녀도 된다고
 *   말할 수 있다」. 「고등학생 63%가 사교육을 받는다」는 뒤집으면 **37%는 안 받는다**는
 *   뜻이고, 그 37%를 못 잰 것으로 지우지 않고 그대로 적을 수 있는 자리가 여기다.
 *
 * ## ⚠ 그 문서의 표 ID(DT_1PE301/302)를 그대로 믿지 않았다
 *
 *   DT_1PE302는 실제로 없었다(err 21) — kosis.kr/openapi/statisticsSearch.do 로 다시
 *   검색해 **실제 존재하는** 표를 확인했다: DT_1PE301(참여율)·DT_1PE201(사교육비 · 학교급별)·
 *   DT_1PE202(지역별)·DT_1PE209(소득별). 짐작으로 옮기지 않았다.
 *
 * ## 이용허락범위
 *
 *   KOSIS 통계정보 활용약관 제8조 — 상업적 활용 가능. 제7조 출처표시 의무.
 *   ⛔ 키 값을 출력하거나 커밋하지 않는다. `.env` 는 gitignore.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(
  path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'),
  '..',
);
const 시늉 = process.argv.includes('--dry');

const KEY = fs.readFileSync(path.join(ROOT, '.env'), 'utf8').match(/^KOSIS_API_KEY=(.+)$/m)?.[1]?.trim();
if (!KEY) throw new Error('.env 에 KOSIS_API_KEY 가 없다');

const 출처 = {
  이름: '국가데이터처 KOSIS · 통계청 「초중고사교육비조사」',
  표: {
    참여율: '101/DT_1PE301 (학교급별 사교육 참여율)',
    사교육비: '101/DT_1PE201 (학교급별 학생 1인당 월평균 사교육비)',
  },
  단위: { 참여율: '%', 사교육비: '만원(월평균)' },
  대상: '전국 초·중·고 학생(일반고 포함) — 표본조사(가구 대상)',
  이용허락범위: 'KOSIS 통계정보 활용약관 제8조 — 상업적 활용 가능',
};

const 받기 = async (tblId) => {
  const u =
    `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${KEY}` +
    `&orgId=101&tblId=${tblId}&itmId=ALL&objL1=ALL&format=json&jsonVD=Y&prdSe=Y&newEstPrdCnt=20`;
  const r = await fetch(u, { signal: AbortSignal.timeout(30000) });
  const t = await r.text();
  let j;
  try { j = JSON.parse(t); } catch { throw new Error(`${tblId} — JSON 이 아니다: ${t.slice(0, 200)}`); }
  if (!Array.isArray(j)) throw new Error(`${tblId} — 저쪽 답: ${JSON.stringify(j).slice(0, 200)}`);
  return j;
};

const 수 = (v) => {
  if (v == null) return null;
  const s = String(v).trim();
  if (s === '' || s === '-') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

/** 학교급 넷만 쓴다. 「일반고」는 「고등학교」의 하위값이라 헷갈리므로 뺀다 — 평균·초·중·고만 */
const 급들 = ['평  균', '초등학교', '중학교', '고등학교'];
const 급이름 = { '평  균': '전체', 초등학교: '초등학교', 중학교: '중학교', 고등학교: '고등학교' };

/** 한 표에서 (연도 × 학교급) 표를 뽑는다 */
function 뽑기(행, C1_NM기대) {
  const 표 = {};
  for (const r of 행) {
    if (r.C1_NM !== C1_NM기대 || !급들.includes(r.ITM_NM)) continue;
    const 연도 = r.PRD_DE;
    (표[연도] ??= {})[급이름[r.ITM_NM]] = 수(r.DT);
  }
  return 표;
}

const 참여율행 = await 받기('DT_1PE301');
const 사교육비행 = await 받기('DT_1PE201');

const 참여율 = 뽑기(참여율행, '사교육 참여');
const 사교육비 = 뽑기(사교육비행, '사교육비');

/* ── 검산 — 두 표의 연도 목록이 같은가, 값이 채워졌는가 ── */
const 참여율연도 = Object.keys(참여율).sort();
const 사교육비연도 = Object.keys(사교육비).sort();
const 안맞음 = [];
if (참여율연도.join(',') !== 사교육비연도.join(',')) {
  안맞음.push(`연도 목록이 다르다 — 참여율 ${참여율연도.length}개 · 사교육비 ${사교육비연도.length}개`);
}
for (const 연도 of 참여율연도) {
  for (const 급 of Object.values(급이름)) {
    if (참여율[연도]?.[급] == null) 안맞음.push(`참여율 ${연도} ${급} 빔`);
    if (사교육비[연도]?.[급] == null) 안맞음.push(`사교육비 ${연도} ${급} 빔`);
  }
}

const 기준연도 = 참여율연도.at(-1);
const 최근 = { 참여율: 참여율[기준연도], 사교육비: 사교육비[기준연도] };

console.log(`KOSIS 초중고사교육비조사 — ${참여율연도[0]}~${참여율연도.at(-1)} (${참여율연도.length}개년)`);
console.log(`  🔴 검산 — 안 맞는 자리 ${안맞음.length}개` + (안맞음.length ? ` → ${안맞음.slice(0, 5).join(' / ')}` : ' (전부 맞는다)'));
console.log(`  ${기준연도}년 기준 — 참여율: 전체 ${최근.참여율.전체}% · 초 ${최근.참여율.초등학교}% · 중 ${최근.참여율.중학교}% · 고 ${최근.참여율.고등학교}%`);
console.log(`             사교육비: 전체 ${최근.사교육비.전체}만원 · 초 ${최근.사교육비.초등학교}만원 · 중 ${최근.사교육비.중학교}만원 · 고 ${최근.사교육비.고등학교}만원`);

if (시늉) {
  console.log('\n--dry 라 저장하지 않았다.');
  process.exit(0);
}

fs.writeFileSync(
  path.join(ROOT, 'src', 'data', '100yearmap', 'private-tutoring.json'),
  JSON.stringify({
    출처,
    받은때: new Date().toISOString().slice(0, 10),
    기준연도,
    검산안맞음: 안맞음.length,
    연도별: 참여율연도.reduce((acc, 연도) => {
      acc[연도] = { 참여율: 참여율[연도], 사교육비: 사교육비[연도] };
      return acc;
    }, {}),
  }, null, 1),
);
console.log('\n저장했다 — src/data/100yearmap/private-tutoring.json');
