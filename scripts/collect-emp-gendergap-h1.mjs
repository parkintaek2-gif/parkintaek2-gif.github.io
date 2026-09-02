#!/usr/bin/env node
/**
 * collect-emp-gendergap-h1.mjs — 성별 급여격차, 상위 10곳이 아니라 «상장사 전체».
 *
 * make-top-pay-gender-gap-chart.mjs 는 CEOScore 9/2 보도의 상위 10곳만 재현했다.
 * 여기서는 같은 재료(DART empSttus, 반기보고서 2026, reprt_code=11012)를 **상장사
 * 전체**에 돌려 「상위 몇 곳」이 아니라 「전체 분포에서 몇 %가 어느 쪽으로 기우나」를 잰다.
 * collect-tenure.mjs 의 상장사목록()·합치기() 를 그대로 재사용한다 — 판정 규칙 중복 금지.
 *
 *   node scripts/collect-emp-gendergap-h1.mjs         이어받기
 *   node scripts/collect-emp-gendergap-h1.mjs --자가시험
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from 'node:fs';
import path from 'node:path';
import { 상장사목록, 합치기 } from './collect-tenure.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');
const XML = path.join(ROOT, 'archive/raw/dart-corpcode/CORPCODE.xml');
const OUT = path.join(ROOT, 'archive/raw/dart-employment/gendergap-h1-2026.ndjson');
const 간격ms = 180;

function 키읽기() {
  const p = path.join(ROOT, '.env');
  if (existsSync(p)) {
    for (const l of readFileSync(p, 'utf8').split(/\r?\n/)) {
      const m = l.match(/^\s*DART_API_KEY\s*=\s*(.*)$/);
      if (m) return m[1].trim().replace(/^["']|["']$/g, '');
    }
  }
  return process.env.DART_API_KEY ?? '';
}

export function 격차판정(합) {
  if (합.급여남 == null || 합.급여여 == null || !합.남 || !합.여) return null;
  return +(합.급여남 / 합.급여여).toFixed(3);
}

if (process.argv.includes('--자가시험')) {
  let 실패 = 0;
  const 검 = (m, ok) => { if (!ok) { 실패++; console.log('  ❌', m); } };
  검('배수 계산', 격차판정({ 급여남: 100, 급여여: 50, 남: 10, 여: 10 }) === 2);
  검('여 급여 없으면 null', 격차판정({ 급여남: 100, 급여여: null, 남: 10, 여: 10 }) === null);
  검('여 인원 0이면 null(1인 표본 배제)', 격차판정({ 급여남: 100, 급여여: 90, 남: 10, 여: 0 }) === null);
  검('반올림 3자리', 격차판정({ 급여남: 80.52, 급여여: 102.05, 남: 5, 여: 5 }) === +(80.52 / 102.05).toFixed(3));
  console.log(실패 === 0 ? '✅ 자가시험 — 통과' : `❌ 자가시험 — 실패 ${실패}`);
  process.exit(실패 === 0 ? 0 : 1);
}

async function main() {
  const 키 = 키읽기();
  if (!키) { console.error('✕ DART_API_KEY 가 없다.'); process.exit(1); }
  if (!existsSync(XML)) { console.error(`✕ ${XML} 이 없다.`); process.exit(1); }
  mkdirSync(path.dirname(OUT), { recursive: true });

  const 완료 = new Set();
  if (existsSync(OUT)) {
    for (const l of readFileSync(OUT, 'utf8').split('\n')) {
      if (!l) continue;
      try { 완료.add(JSON.parse(l).corp); } catch { /* 깨진 줄 skip */ }
    }
  }

  const 목록 = 상장사목록(readFileSync(XML, 'utf8'));
  const 남은 = 목록.filter((x) => !완료.has(x.corp));
  console.log(`상장사 ${목록.length.toLocaleString()} · 이미 받음 ${완료.size.toLocaleString()} · 받을 것 ${남은.length.toLocaleString()} (2026년 반기보고서 11012)`);

  let 성공 = 0, 없음 = 0, 실패 = 0;
  for (const [i, c] of 남은.entries()) {
    const u = `https://opendart.fss.or.kr/api/empSttus.json?crtfc_key=${키}&corp_code=${c.corp}&bsns_year=2026&reprt_code=11012`;
    try {
      const r = await fetch(u);
      const j = await r.json();
      if (j.status === '000' && Array.isArray(j.list) && j.list.length) {
        const 합 = 합치기(j.list);
        appendFileSync(OUT, JSON.stringify({ corp: c.corp, 종목: c.종목, 이름: c.이름, 영문: c.영문, ...합 }) + '\n');
        성공++;
      } else { 없음++; }
    } catch { 실패++; }
    if ((i + 1) % 200 === 0) console.log(`  ${i + 1}/${남은.length} — 성공 ${성공} · 미제출 ${없음} · 실패 ${실패}`);
    await new Promise((res) => setTimeout(res, 간격ms));
  }
  console.log(`\n✅ 2026 반기 — 성공 ${성공.toLocaleString()} · 미제출 ${없음.toLocaleString()} · 실패 ${실패.toLocaleString()}`);
  console.log(`   ${OUT}`);
}
main();
