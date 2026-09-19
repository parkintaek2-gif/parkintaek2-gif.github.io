/**
 * build-seoulmarkets-full-parquet.mjs — 파는 «전량» CSV 곁에 같은 표를 Parquet 으로도 낸다.
 *
 * ── 왜 (F5 · 목표 2026-09-23 · 2번) ──────────────────────────────────────
 * F5 관문: 「파일 배달 + 내려받기 지면 — **CSV·Parquet** · 판 번호」.
 * `scripts/lib/parquet-out.mjs`(F5 용으로 이미 있었다)는 «표본»에만 쓰이고 있었다 —
 * 손님이 «돈 내고 받는» 전량 파일에는 CSV 뿐이었다. 그 구멍을 메운다.
 *
 * ⛔ 이 자가 하지 않는 것
 * ⛔ 데이터를 다시 모으지 않는다(네트워크·DART API 를 다시 안 부른다) — 이미 만들어
 *   판 채로 파는 CSV 를 «그대로 읽어» 같은 표를 Parquet 으로도 쓴다. 재수집은
 *   각 빌더(build-seoulmarkets-people-panel.mjs 등)의 몫이고, 다음 판을 만들 때는
 *   그 빌더 안에서 parquet로쓰기() 를 전량에도 걸도록 따로 고친다(오늘은 「지금
 *   팔리는 판」을 급한 대로 메운다).
 * ⛔ CSV 와 다른 값을 만들지 않는다 — 같은 파일에서 읽은 같은 문자열을 그대로 옮긴다.
 *
 *   node scripts/build-seoulmarkets-full-parquet.mjs           전부
 *   node scripts/build-seoulmarkets-full-parquet.mjs --자가시험
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { csv파일읽기 } from './lib/csv-read.mjs';
import { parquet로쓰기 } from './lib/parquet-out.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 전체방 = path.join(뿌리, 'src/data/full');

/** CSV 파일 이름 → 같은 자리에 .parquet. ⛔ 판 번호(파일 이름의 날짜)는 그대로 물려받는다 */
export function parquet경로(csv경로) {
  return csv경로.replace(/\.csv$/i, '.parquet');
}

/**
 * 파일 하나를 옮긴다. 이미 있고 «더 새로운» 판이면 다시 안 쓴다(파는 CSV 를
 * 두 번 열 이유가 없다) — 단, `강제` 를 주면 다시 쓴다.
 */
export function 파일하나(csv경로, { 강제 = false } = {}) {
  if (!fs.existsSync(csv경로)) return { csv경로, 함: '⬜ CSV 없음' };
  const 나갈경로 = parquet경로(csv경로);
  if (!강제 && fs.existsSync(나갈경로)) return { csv경로, 나갈경로, 함: '— 이미 있음' };
  const { 머리칸, 줄들 } = csv파일읽기(csv경로);
  if (!머리칸.length || !줄들.length) return { csv경로, 함: '⬜ 빈 표(머리칸/행 없음) — 쓰지 않는다' };
  const 됨 = parquet로쓰기(줄들, 머리칸, 나갈경로);
  return { csv경로, 나갈경로, 함: 됨 ? `✅ ${줄들.length.toLocaleString('en-US')}행` : '⬜ 못 씀' };
}

/** src/data/full 아래 «전량» CSV 전부(표본이 아니다 — 표본은 public/data 에 있다) */
export function 전량CSV목록(방 = 전체방) {
  let 파일들 = [];
  try { 파일들 = fs.readdirSync(방); } catch { return []; }
  return 파일들.filter((f) => f.endsWith('.csv')).map((f) => path.join(방, f));
}

const 나 = process.argv[1] && new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1') === process.argv[1].replace(/\\/g, '/');

function 자가시험() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sm-parquet-자가시험-'));
  const csv = path.join(tmp, 'x-2026-09-19.csv');
  fs.writeFileSync(csv, '﻿ticker,name\n"005930","Samsung, Inc."\n006860,"Say ""hi"""', 'utf8');

  let 통 = 0; const 실 = [];
  const 검 = (n, ok) => { if (ok) 통 += 1; else 실.push(n); };

  검('parquet경로 — .csv 를 .parquet 로 바꾼다(판 번호는 그대로)', parquet경로('/a/b-2026-09-11.csv') === '/a/b-2026-09-11.parquet');

  const r1 = 파일하나(csv);
  검('파일하나 — 새로 만들면 ✅', /^✅/.test(r1.함));
  검('파일하나 — 실제로 파일이 생긴다', fs.existsSync(r1.나갈경로));

  const r2 = 파일하나(csv);
  검('파일하나 — 이미 있으면 다시 안 만든다(— 이미 있음)', r2.함 === '— 이미 있음');

  const r3 = 파일하나(csv, { 강제: true });
  검('파일하나 — 강제를 주면 다시 만든다', /^✅/.test(r3.함));

  const 빈 = path.join(tmp, 'empty.csv');
  fs.writeFileSync(빈, 'a,b\n', 'utf8');
  const r4 = 파일하나(빈);
  검('⛔ 행이 0개면 안 쓴다(빈 스키마를 지어내지 않는다)', /^⬜/.test(r4.함));

  const r5 = 파일하나(path.join(tmp, '없는파일.csv'));
  검('⬜ 원본 CSV 가 없으면 그렇다고 낸다', r5.함 === '⬜ CSV 없음');

  검('전량CSV목록 — 없는 폴더면 빈 배열(에러로 죽지 않는다)', 전량CSV목록('/이런/폴더/는/없다').length === 0);
  검('전량CSV목록 — 만든 폴더의 csv 를 찾는다', 전량CSV목록(tmp).some((f) => f.endsWith('x-2026-09-19.csv')));

  fs.rmSync(tmp, { recursive: true, force: true });

  if (실.length) {
    console.error(`❌ 자가시험 실패 ${실.length}\n${실.map((x) => `   · ${x}`).join('\n')}`);
    process.exit(1);
  }
  console.log(`✅ build-seoulmarkets-full-parquet 자가시험 ${통}개 통과`);
}

if (나) {
  if (process.argv.includes('--자가시험')) { 자가시험(); }
  else {
    const 목록 = 전량CSV목록();
    if (!목록.length) { console.log(`⬜ ${전체방} 에 csv 가 없다`); process.exit(0); }
    let 됨 = 0; let 못함 = 0;
    for (const csv경로 of 목록) {
      const r = 파일하나(csv경로);
      console.log(`${r.함}  ${path.basename(csv경로)}${r.나갈경로 ? ' → ' + path.basename(r.나갈경로) : ''}`);
      if (/^✅/.test(r.함)) 됨 += 1; else if (r.함 !== '— 이미 있음') 못함 += 1;
    }
    console.log(`\n새로 만든 것 ${됨}개 · 못 만든 것 ${못함}개 (전체 ${목록.length}개)`);
  }
}
