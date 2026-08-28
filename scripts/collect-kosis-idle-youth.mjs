#!/usr/bin/env node
/**
 * 경제활동인구조사 — 20·30대 **「쉬었음」 인구** (비경제활동인구 중 구직도 안 하고 쉬는 사람)
 *
 *   node scripts/collect-kosis-idle-youth.mjs        # 받아서 저장
 *   node scripts/collect-kosis-idle-youth.mjs --dry  # 저장하지 않고 재기만 한다
 *
 * ## ⭐ 왜 만드나 (2026-08-28)
 *
 *   「청년 예산 언박싱 2027」관계부처합동 보도자료(2026-08-28) 각주 — 「(2030세대 쉬었음
 *   인구) '26.7월 기준 65.1만명('16.7월 대비 +24만명 증가)」를 KOSIS 원자료로 직접
 *   검증했다. 정부 «약속»이 아니라 이미 조사된 실측값이라 각주를 베끼지 않고 재현했다.
 *
 * ## 검증 결과 — 정확히 일치
 *
 *   101/DT_1DA7147S(연령/활동상태별(쉬었음) 비경제활동인구)에서 20~29세+30~39세를
 *   더하면 2026-07 650.5천명(=65.05만명≈65.1만명), 2016-07 411.1천명 —
 *   차이 239.4천명≈23.9만명(반올림 시 +24만명)으로 보도자료와 **정확히 일치**했다.
 *
 * ## 이용허락범위
 *
 *   KOSIS 통계정보 활용약관 제8조 — 상업적 활용 가능. 제7조 출처표시 의무.
 *   ⛔ 키 값을 출력하거나 커밋하지 않는다. `.env` 는 gitignore.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(
  path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'),
  '..',
);
const 시늉 = process.argv.includes('--dry');

const KEY = fs.readFileSync(path.join(ROOT, '.env'), 'utf8').match(/^KOSIS_API_KEY=(.+)$/m)?.[1]?.trim();
if (!KEY) throw new Error('.env 에 KOSIS_API_KEY 가 없다');

const 출처 = {
  이름: '국가데이터처 KOSIS · 통계청 「경제활동인구조사」',
  표: '101/DT_1DA7147S (연령/활동상태별(쉬었음) 비경제활동인구)',
  기준: '월별 · 비경제활동인구 중 「쉬었음」(구직활동도 하지 않고 쉬는 인구) · 20~29세+30~39세 합',
  이용허락범위: 'KOSIS 통계정보 활용약관 제8조 — 상업적 활용 가능',
};

const 받기 = async (n) => {
  const u =
    `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${KEY}` +
    `&orgId=101&tblId=DT_1DA7147S&itmId=ALL&objL1=ALL&objL2=ALL&format=json&jsonVD=Y&prdSe=M&newEstPrdCnt=${n}`;
  const r = await fetch(u, { signal: AbortSignal.timeout(30000) });
  const t = await r.text();
  let j;
  try { j = JSON.parse(t); } catch { throw new Error(`JSON 이 아니다: ${t.slice(0, 200)}`); }
  if (j?.err) throw new Error(`err ${j.err} ${j.errMsg}`);
  return j;
};

const 행 = await 받기(132);
const 쉬었음 = 행.filter((r) => r.C2_NM === '쉬었음');

const 월들 = [...new Set(쉬었음.map((r) => r.PRD_DE))].sort();
const 월별 = {};
for (const 월 of 월들) {
  const 이십대 = 쉬었음.find((r) => r.PRD_DE === 월 && r.C1_NM === '20 - 29세');
  const 삼십대 = 쉬었음.find((r) => r.PRD_DE === 월 && r.C1_NM === '30 - 39세');
  if (!이십대 || !삼십대) continue;
  월별[월] = {
    '20대_천명': Number(이십대.DT),
    '30대_천명': Number(삼십대.DT),
    '2030_천명': Math.round((Number(이십대.DT) + Number(삼십대.DT)) * 10) / 10,
  };
}

const 최근달 = Object.keys(월별).sort().at(-1);
const 십년전달 = String(Number(최근달) - 1000).padStart(6, '0');

/* ── 검산 — 보도자료 인용값(26.7월 65.1만명, 16.7월 대비 +24만명)과 맞는가 ── */
const 최근값 = 월별['202607'];
const 십년전값 = 월별['201607'];
const 최근만명 = 최근값 ? Math.round(최근값['2030_천명']) / 10 : null;
const 증가만명 = (최근값 && 십년전값) ? Math.round(최근값['2030_천명'] - 십년전값['2030_천명']) / 10 : null;

console.log(`KOSIS 경제활동인구조사 「쉬었음」(20-30대) — ${월들[0]}~${최근달} (${월들.length}개월)`);
console.log(`  🔴 검산 — 2026-07 ${최근만명}만명(보도자료 "65.1만명"), 2016-07 대비 +${증가만명}만명(보도자료 "+24만명") — ${Math.abs(최근만명 - 65.1) < 0.2 && Math.abs(증가만명 - 24) < 0.5 ? '일치' : '어긋남'}`);
console.log(`  최신(${최근달}) — 20대 ${월별[최근달]['20대_천명']}천명 · 30대 ${월별[최근달]['30대_천명']}천명 · 합 ${월별[최근달]['2030_천명']}천명`);

if (시늉) {
  console.log('\n--dry 라 저장하지 않았다.');
  process.exit(0);
}

fs.writeFileSync(
  path.join(ROOT, 'src', 'data', '100yearmap', 'idle-youth.json'),
  JSON.stringify({
    출처,
    받은때: new Date().toISOString().slice(0, 10),
    최근달,
    보도자료대조: {
      인용문: `「청년 예산 언박싱(UNBOXING) 2027」관계부처합동 보도자료(2026-08-28) — "(2030세대 쉬었음 인구) '26.7월 기준 65.1만명('16.7월 대비 +24만명 증가)"`,
      검산: (Math.abs(최근만명 - 65.1) < 0.2 && Math.abs(증가만명 - 24) < 0.5) ? '일치' : '어긋남',
    },
    월별,
  }, null, 1),
);
console.log('\n저장했다 — src/data/100yearmap/idle-youth.json');
