#!/usr/bin/env node
/**
 * K팝 기획사 4곳(HYBE·SM·YG·JYP) 회사현황 — 5번↔6번 교차링크 제안용 최소 수집.
 * 전체 상장사를 도는 collect-company.mjs 를 안 건드리고, 이 4곳만 따로 받는다
 * (공용 수집기 상태 파일·일일 한도를 건드리지 않기 위함).
 *
 *   node scripts/collect-kpop-agencies-company.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';

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
];

const OUT_DIR = path.resolve('archive/raw/kpop-agencies');

async function main() {
  const 키 = 키읽기();
  if (!키) { console.error('✕ DART_API_KEY 없음'); process.exit(1); }
  mkdirSync(OUT_DIR, { recursive: true });

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

  writeFileSync(path.join(OUT_DIR, 'company.json'), JSON.stringify({ 잰때: new Date().toISOString(), 회사: 결과 }, null, 2));
  console.log(`\n저장: ${path.join(OUT_DIR, 'company.json')}`);
}

main();
