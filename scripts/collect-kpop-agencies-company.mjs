#!/usr/bin/env node
/**
 * K팝 기획사 7곳 회사현황 — 5번↔6번 교차링크(archive/raw/wikidata/kpop-label-owners.json,
 * scripts/fetch-kcw-label-owners.mjs 산출)에서 «자기 티커를 가진 상장 주체» 규칙으로 추린 것.
 * 전체 상장사를 도는 collect-company.mjs 를 안 건드리고, 이 7곳만 따로 받는다
 * (공용 수집기 상태 파일·일일 한도를 건드리지 않기 위함).
 *
 * ⚠ 130960(CJ E&M Corporation, 대표 김성수)은 DART엔 살아 있는 법인이지만, 현재 시장에서
 *   흔히 부르는 「CJ ENM」(035760)과 같은 티커인지는 확인 못 했다 — 5번이 위키데이터에서
 *   그대로 넘긴 값이고, 6번이 재검증하지 않았다. 기사화 전 대조 필요(못 쟀다로 남김).
 *
 *   node scripts/collect-kpop-agencies-company.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { put } from '../src/lib/store.mjs';

function 키읽기() {
  if (process.env.DART_API_KEY) return process.env.DART_API_KEY;
  const p = path.resolve('.env');
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

const 저장키 = 'raw/kpop-agencies/company.json';

async function main() {
  const 키 = 키읽기();
  if (!키) { console.error('✕ DART_API_KEY 없음'); process.exit(1); }

  const 결과 = [];
  for (const c of 대상) {
    const r = await fetch(`https://opendart.fss.or.kr/api/company.json?crtfc_key=${키}&corp_code=${c.corp}`, { signal: AbortSignal.timeout(20000) });
    const j = await r.json();
    if (j.status !== '000') {
      console.error(`✕ ${c.이름} (${c.corp}) status=${j.status} ${j.message ?? ''}`);
      결과.push({ ...c, 상태: j.status, 오류: j.message ?? null });
      continue;
    }
    console.log(`✓ ${c.이름}: ${j.corp_name} / ${j.corp_name_eng} / 대표 ${j.ceo_nm} / 설립 ${j.est_dt} / 주소 ${j.adres}`);
    결과.push({ ...c, corp_name: j.corp_name, corp_name_eng: j.corp_name_eng, ceo_nm: j.ceo_nm, est_dt: j.est_dt, adres: j.adres, induty_code: j.induty_code, jurir_no: j.jurir_no, bizr_no: j.bizr_no });
    await new Promise((res) => setTimeout(res, 300));
  }

  const 저장 = await put(저장키, JSON.stringify({ 잰때: new Date().toISOString(), 회사: 결과 }, null, 2), 'application/json');
  console.log(`\n저장: 로컬 ${저장.local}${저장.remote ? ' · R2 저장 완료' : (저장.remoteError ? ` · R2 실패: ${저장.remoteError}` : ' · R2 비활성')}`);
}

main();
