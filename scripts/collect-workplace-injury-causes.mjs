#!/usr/bin/env node
/**
 * collect-workplace-injury-causes.mjs — 산업재해, «무엇이 얼마나」가 아니라 «왜 다치나」.
 *
 * 사장님 지시(2026-09-03): 「어떤 데이터가 있으면 왜 그렇게 나왔는가를 살펴...
 *   낙상사고가 많으면 왜 그럴까...꼬리에 꼬리를 무는 궁금증을 채워라」
 * 「경제부처만 보지 말고 국책 연구기관 자료도 찾아봐라」
 *
 * KOSIS DT_11806_N011(고용노동부·산업안전보건공단 산업재해현황, 발생형태별) — 경제지표가
 * 아니라 산업안전 통계다. 2020~2024년 5년치를 직접 당겨, 어느 «원인»이 가장 많고
 * 어느 원인이 늘고 있는지를 우리가 잰다.
 * 출처: KOSIS(국가데이터처), 시세 아님 — FSC 9/9 무관.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');

function 키읽기() {
  const env = fs.readFileSync(path.join(ROOT, '.env'), 'utf8');
  const m = env.match(/^KOSIS_API_KEY\s*=\s*(.+)$/m);
  if (!m) throw new Error('.env 에 KOSIS_API_KEY 가 없다');
  return m[1].trim();
}

export function 증가율(이전, 이번) {
  if (이전 == null || 이번 == null || 이전 === 0) return null;
  return +(((이번 - 이전) / 이전) * 100).toFixed(1);
}

if (process.argv.includes('--자가시험')) {
  let 실패 = 0;
  const 검 = (m, ok) => { if (!ok) { 실패++; console.log('  ❌', m); } };
  검('증가율 계산', 증가율(100, 137) === 37);
  검('이전값 0이면 null', 증가율(0, 10) === null);
  검('값 없으면 null', 증가율(null, 10) === null);
  검('⛔ 실제사례 — 넘어짐 5년 증가율(20659→28244)', 증가율(20659, 28244) === 36.7);
  검('⛔ 실제사례 — 떨어짐은 거의 안 늘었다(14406→14655)', 증가율(14406, 14655) < 5);
  console.log(실패 === 0 ? '✅ 자가시험 — 통과' : `❌ 자가시험 — 실패 ${실패}`);
  process.exit(실패 === 0 ? 0 : 1);
} else {
  const 키 = 키읽기();
  const url = `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${키}&itmId=ALL&objL1=ALL&objL2=ALL&format=json&jsonVD=Y&prdSe=Y&startPrdDe=2020&endPrdDe=2024&orgId=118&tblId=DT_11806_N011`;
  const j = await (await fetch(url)).json();
  if (!Array.isArray(j)) throw new Error(`KOSIS 응답 이상 — ${JSON.stringify(j).slice(0, 200)}`);
  const 총계행 = j.filter((x) => x.C1_NM === '총계');

  const 연도들 = ['2020', '2021', '2022', '2023', '2024'];
  const 원인별 = {};
  for (const x of 총계행) {
    if (!원인별[x.C2_NM]) 원인별[x.C2_NM] = {};
    원인별[x.C2_NM][x.PRD_DE] = Number(x.DT);
  }

  const 전체 = 연도들.map((y) => 원인별['계']?.[y] ?? null);
  const 순위2024 = Object.entries(원인별)
    .filter(([k]) => k !== '계')
    .map(([원인, 연도값]) => ({ 원인, ...연도값, 증가율_5년: 증가율(연도값['2020'], 연도값['2024']) }))
    .filter((r) => r['2024'] != null)
    .sort((a, b) => b['2024'] - a['2024']);

  console.log(`✅ 2024년 전체 재해자 ${전체[4].toLocaleString()}명(2020년 ${전체[0].toLocaleString()}명, +${증가율(전체[0], 전체[4])}%)`);
  console.log('   원인별 순위(2024, 상위 5) — 5년 증가율 포함:');
  for (const r of 순위2024.slice(0, 5)) console.log(`   ${r.원인}: ${r['2024'].toLocaleString()}명 (2020년 ${r['2020'].toLocaleString()}명, ${r.증가율_5년 > 0 ? '+' : ''}${r.증가율_5년}%)`);

  fs.writeFileSync(path.join(ROOT, 'src/data/workplace-injury-causes.json'), JSON.stringify({
    출처: 'KOSIS(국가데이터처) DT_11806_N011 — 고용노동부/한국산업안전보건공단 산업재해현황, 발생형태별, 전산업 총계',
    기간: { 시작: '2020', 끝: '2024' },
    전체재해자: Object.fromEntries(연도들.map((y, i) => [y, 전체[i]])),
    원인별순위_2024: 순위2024,
  }, null, 1));
}
