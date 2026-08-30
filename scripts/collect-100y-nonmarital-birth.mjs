#!/usr/bin/env node
/**
 * 인구동향조사 — «혼인외의 자»(법률혼 밖에서 태어난 아이) 전국 연도별
 *
 *   node scripts/collect-100y-nonmarital-birth.mjs        # 받아서 저장
 *   node scripts/collect-100y-nonmarital-birth.mjs --dry  # 저장하지 않고 재기만 한다
 *
 * ## ⭐ 왜 만드나 (2026-08-31)
 *
 *   사장님이 뉴스 헤드라인 "혼인 외 출생아 통계 작성 이래 최대(단위: 명, 자료: 국가데이터처)"
 *   를 공유했다. KOSIS 원자료(101/DT_1B81A16, 시도/법적혼인상태별 출생)로 직접 검증했다.
 *
 * ## 검증 결과
 *
 *   전국(00) · 항목 T3(혼인외의 자) · 1996~2025년 연간 시계열을 직접 받으니
 *   **2025년 14,023명이 1996년(시계열 시작) 이후 최댓값** — 뉴스의 "역대 최대" 주장과 일치.
 *
 *   ⚠⚠ 함정 — **숫자(명)와 비율(%)이 다른 말을 한다.** 총출생아 대비 비율을 같이 재면
 *   2020년 2.52% → 2024년 5.80%(비율 최고) → 2025년 5.51%(소폭 하락)이다. 2025년에
 *   총출생아 수 자체가 늘어서(2024년 238,317명 → 2025년 254,341명) 비율은 오히려 내렸다.
 *   ⛔ "역대 최대"는 **숫자**에만 해당한다. 비율까지 계속 오른다고 쓰면 거짓이 된다.
 *   ⚠ 비율은 이 자가 2020년부터만 낸다 — 그 이전 연도의 「총계」도 이 표에서 받을 수 있지만
 *   지면에서 비율을 오래된 연도까지 그리려면 이 스크립트를 늘려야 한다(지금은 숫자만
 *   전 구간, 비율은 최근 6개년만).
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
  이름: '국가데이터처 KOSIS · 인구동향조사',
  표: '101/DT_1B81A16 (시도/법적혼인상태별 출생)',
  기준: '전국 · 혼인외의 자(법률혼 밖 출생) · 연간',
  이용허락범위: 'KOSIS 통계정보 활용약관 제8조 — 상업적 활용 가능',
};

const 받기 = async (n) => {
  const u =
    `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${KEY}` +
    `&orgId=101&tblId=DT_1B81A16&objL1=00&itmId=ALL&format=json&jsonVD=Y&prdSe=Y&newEstPrdCnt=${n}`;
  const r = await fetch(u, { signal: AbortSignal.timeout(30000) });
  const t = await r.text();
  let j;
  try { j = JSON.parse(t); } catch { throw new Error(`JSON 이 아니다: ${t.slice(0, 200)}`); }
  if (j?.err) throw new Error(`err ${j.err} ${j.errMsg}`);
  return j;
};

/* 전 구간(1996~) 숫자 */
const 전체행 = await 받기(30);
const 혼인외행 = 전체행.filter((r) => r.ITM_NM === '혼인외의 자');
const 연도들 = [...new Set(혼인외행.map((r) => r.PRD_DE))].sort();

const 연도별 = {};
for (const 연도 of 연도들) {
  const 행 = 혼인외행.find((r) => r.PRD_DE === 연도);
  if (!행) continue;
  연도별[연도] = { 혼인외_명: Math.round(Number(행.DT)) };
}

/* 최근 6개년 — 총계까지 받아 비율을 낸다 */
const 최근행 = await 받기(6);
for (const 연도 of [...new Set(최근행.map((r) => r.PRD_DE))]) {
  const 계 = 최근행.find((r) => r.PRD_DE === 연도 && r.ITM_NM === '총계');
  const 외 = 최근행.find((r) => r.PRD_DE === 연도 && r.ITM_NM === '혼인외의 자');
  if (!계 || !외 || !연도별[연도]) continue;
  const 총계값 = Number(계.DT);
  const 외값 = Number(외.DT);
  연도별[연도].총계_명 = Math.round(총계값);
  연도별[연도].비율 = Math.round((100 * 외값 / 총계값) * 100) / 100;
}

const 기준연도 = 연도들.at(-1);
const 최고연도_숫자 = 연도들.reduce((a, b) => (연도별[b].혼인외_명 > 연도별[a].혼인외_명 ? b : a));
const 비율있는연도들 = 연도들.filter((y) => 연도별[y].비율 != null);
const 최고연도_비율 = 비율있는연도들.length
  ? 비율있는연도들.reduce((a, b) => (연도별[b].비율 > 연도별[a].비율 ? b : a))
  : null;

/* ── 검산 — 뉴스 "역대 최대"(숫자 기준) 주장과 맞는가 ── */
const 역대최대_검산 = 최고연도_숫자 === 기준연도;

console.log(`KOSIS 인구동향조사 혼인외 출생아 — ${연도들[0]}~${기준연도} (${연도들.length}개년)`);
console.log(`  🔴 검산 — ${기준연도}년 ${연도별[기준연도].혼인외_명.toLocaleString()}명이 전 구간 중 최대인가: ${역대최대_검산 ? '일치(역대 최대 맞음)' : `어긋남(최대는 ${최고연도_숫자}년)`}`);
console.log(`  ⚠⚠ 함정 — 숫자 최고 연도는 ${최고연도_숫자}년, 비율 최고 연도는 ${최고연도_비율}년으로 다르다`);
for (const y of 비율있는연도들) console.log(`    ${y}년 — ${연도별[y].혼인외_명.toLocaleString()}명 · 총출생 ${연도별[y].총계_명.toLocaleString()}명 · 비율 ${연도별[y].비율}%`);

if (시늉) {
  console.log('\n--dry 라 저장하지 않았다.');
  process.exit(0);
}

fs.writeFileSync(
  path.join(ROOT, 'src', 'data', '100yearmap', 'nonmarital-birth.json'),
  JSON.stringify({
    출처,
    받은때: new Date().toISOString().slice(0, 10),
    기준연도,
    최고연도_숫자,
    최고연도_비율,
    보도자료대조: {
      인용문: '뉴스 헤드라인(2026-08-30 전후) — "혼인 외 출생아 통계 작성 이래 최대"',
      [`${기준연도}년_검산`]: 역대최대_검산 ? '일치' : '어긋남',
    },
    비율_있는_연도: 비율있는연도들,
    연도별,
  }, null, 1),
);
console.log('\n저장했다 — src/data/100yearmap/nonmarital-birth.json');
