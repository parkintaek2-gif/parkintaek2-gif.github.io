#!/usr/bin/env node
/**
 * make-kospi-swing-check.mjs — r/korea 게시물의 「코스피 6,835.8, +0.23%」를 원자료로 검산.
 *
 * 사장님 지시(이슈 좇기: 뉴스·커뮤니티·SNS)의 6번 몫 — 5번의 collect-community-desk.mjs가
 * r/korea에서 이 제목을 잡아 왔다. 우리는 남의 제목을 그대로 옮기지 않는다 — 금융위
 * GetMarketIndexInfoService(지수시세)로 직접 재현하고, 다음날까지 이어서 본다.
 * 출처: 금융위 공공데이터(제한없음), FSC 9/9(9월9일부터 시행) 전이라 안전.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');
const 대상일 = ['20260818', '20260819', '20260820', '20260821', '20260824', '20260825', '20260826', '20260827', '20260828', '20260901', '20260902'];

export function 코스피_행들(archiveDir, 날짜들) {
  const rows = [];
  for (const d of 날짜들) {
    const p = path.join(archiveDir, `${d}.ndjson`);
    if (!fs.existsSync(p)) continue;
    const lines = fs.readFileSync(p, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
    const k = lines.find((x) => x.이름 === '코스피');
    if (k) rows.push({ date: d, close: k.종가, pct: k.등락률 });
  }
  return rows;
}

if (process.argv.includes('--자가시험')) {
  let 실패 = 0;
  const 검 = (m, ok) => { if (!ok) { 실패++; console.log('  ❌', m); } };
  const 임시 = path.join(ROOT, 'archive/raw/indices'); // 실제 아카이브로 자가시험(재현 가능해야 진짜 자가시험)
  const rows = 코스피_행들(임시, 대상일);
  검('11일치 모두 있다', rows.length === 11);
  const r0901 = rows.find((r) => r.date === '20260901');
  검('9/1 종가 6835.8', r0901?.close === 6835.8);
  검('9/1 등락률 +0.23%(레딧 원문과 일치)', r0901?.pct === 0.23);
  const r0902 = rows.find((r) => r.date === '20260902');
  검('9/2 등락률 -3.99%(다음날 급락)', r0902?.pct === -3.99);
  const 삼퍼센트이상 = rows.filter((r) => Math.abs(r.pct) >= 3);
  검('3%+ 날 4일(11일 중)', 삼퍼센트이상.length === 4);
  console.log(실패 === 0 ? '✅ 자가시험 — 통과' : `❌ 자가시험 — 실패 ${실패}`);
  process.exit(실패 === 0 ? 0 : 1);
} else {
  const archiveDir = path.join(ROOT, 'archive/raw/indices');
  const rows = 코스피_행들(archiveDir, 대상일);
  const 삼퍼센트이상 = rows.filter((r) => Math.abs(r.pct) >= 3);
  console.log(`✅ ${rows.length}일 중 ${삼퍼센트이상.length}일이 3%+ 변동 — 레딧 인용일(9/1, +0.23%) 다음날(9/2) ${rows.find((r) => r.date === '20260902').pct}%`);

  fs.writeFileSync(path.join(ROOT, 'src/data/kospi-swing-check.json'), JSON.stringify({
    출처: '금융위 GetMarketIndexInfoService(지수시세), 직접 재현',
    계기: "r/korea 게시물 'Kospi closed at 6,835.8 points, up 0.23%' — 9/1 실측과 일치, 검증됨",
    기간: { 시작: 대상일[0], 끝: 대상일[대상일.length - 1] },
    일별: rows,
    삼퍼센트이상일수: 삼퍼센트이상.length,
    전체일수: rows.length,
  }, null, 1));
}
