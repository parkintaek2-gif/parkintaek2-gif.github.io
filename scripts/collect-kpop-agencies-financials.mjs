#!/usr/bin/env node
/**
 * K팝 기획사 7곳 — DART 단일회사 주요계정(fnlttSinglAcnt)에서 매출액·영업이익·당기순이익을 받는다.
 * collect-kpop-agencies-company.mjs 와 같은 7곳(archive/raw/kpop-agencies/company.json 대상).
 * 연결재무제표(CFS) 우선, 없으면 별도재무제표(OFS)로 대체 — 어느 쪽인지 반드시 남긴다.
 *
 *   node scripts/collect-kpop-agencies-financials.mjs [사업연도, 기본 2025]
 */
import { readFileSync, existsSync } from 'node:fs';
import { put } from '../src/lib/store.mjs';

function 키읽기() {
  if (process.env.DART_API_KEY) return process.env.DART_API_KEY;
  const p = '.env';
  if (existsSync(p)) {
    const m = readFileSync(p, 'utf8').match(/^DART_API_KEY=(.+)$/m);
    if (m) return m[1].trim();
  }
  return '';
}

const 대상 = [
  { corp: '01204056', 종목: '352820', 이름: 'HYBE' },
  { corp: '00260930', 종목: '041510', 이름: 'SM Entertainment' },
  { corp: '00613318', 종목: '122870', 이름: 'YG Entertainment' },
  { corp: '00258689', 종목: '035900', 이름: 'JYP Entertainment' },
  { corp: '00838421', 종목: '130960', 이름: 'CJ E&M Corporation' },
  { corp: '00925295', 종목: '173940', 이름: 'FNC Entertainment' },
  { corp: '00985686', 종목: '182360', 이름: 'Cube Entertainment' },
];

const 계정들 = ['매출액', '영업이익', '당기순이익(손실)', '당기순이익'];

async function main() {
  const 키 = 키읽기();
  if (!키) { console.log('⛔ DART_API_KEY 없음 — 못 잰다'); return; }
  const 사업연도 = process.argv[2] || '2025';
  const 결과 = [];

  for (const 대상사 of 대상) {
    const url = `https://opendart.fss.or.kr/api/fnlttSinglAcnt.json?crtfc_key=${키}&corp_code=${대상사.corp}&bsns_year=${사업연도}&reprt_code=11011`;
    let j;
    try { j = await (await fetch(url)).json(); } catch (e) { console.log(`  ⬜ ${대상사.이름} 못 받음 — ${e.message}`); continue; }
    if (j.status !== '000') { console.log(`  ⬜ ${대상사.이름} — ${j.status} ${j.message}`); 결과.push({ ...대상사, 사업연도, 못잼: `${j.status} ${j.message}` }); continue; }

    const 계정찾기 = (구분) => j.list.find((r) => r.fs_div === 구분 && 계정들.includes(r.account_nm));
    let 행 = j.list.filter((r) => r.fs_div === 'CFS' && 계정들.includes(r.account_nm));
    let 구분 = 'CFS(연결)';
    if (!행.length) { 행 = j.list.filter((r) => r.fs_div === 'OFS' && 계정들.includes(r.account_nm)); 구분 = 'OFS(별도)'; }
    if (!행.length) { console.log(`  ⬜ ${대상사.이름} — 계정 못 찾음`); 결과.push({ ...대상사, 사업연도, 못잼: '계정 못 찾음' }); continue; }

    const 뽑기 = (이름들) => {
      const r = 행.find((x) => 이름들.includes(x.account_nm));
      if (!r) return null;
      return { 당기: r.thstrm_amount, 전기: r.frmtrm_amount, 당기기간: r.thstrm_dt, 전기기간: r.frmtrm_dt };
    };
    const 매출액 = 뽑기(['매출액']);
    const 영업이익 = 뽑기(['영업이익']);
    const 당기순이익 = 뽑기(['당기순이익(손실)', '당기순이익']);

    결과.push({ ...대상사, 사업연도, 재무제표구분: 구분, rcept_no: 행[0]?.rcept_no, 매출액, 영업이익, 당기순이익 });
    console.log(`  ✅ ${대상사.이름} (${구분}) 매출 ${매출액?.당기 ?? '?'} · 영업이익 ${영업이익?.당기 ?? '?'} · 순이익 ${당기순이익?.당기 ?? '?'}`);
  }

  const 저장키 = `raw/kpop-agencies/financials-${사업연도}.json`;
  const 저장 = await put(저장키, JSON.stringify({ 사업연도, 잰때: new Date().toISOString(), 출처: 'opendart.fss.or.kr fnlttSinglAcnt.json', 회사들: 결과 }, null, 1), 'application/json');
  console.log(`\n${저장.local ? '✅' : '⬜'} 저장 — local:${!!저장.local} remote:${!!저장.remote}${저장.remoteError ? ' (' + 저장.remoteError + ')' : ''} → ${저장키}`);
}

main();
