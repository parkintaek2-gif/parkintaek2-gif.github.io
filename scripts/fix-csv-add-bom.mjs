/**
 * fix-csv-add-bom.mjs — 이미 만들어져 있는 CSV 에 BOM 을 «지금» 붙인다.
 *
 * ── 왜 (F5 · 2026-09-19 · 2번) ──────────────────────────────────────────
 * 빌더(build-seoulmarkets-people-panel.mjs 등)는 이제부터 BOM 을 붙여 «새로» 낸다
 * (scripts/lib/csv-out.mjs). 그런데 지금 팔리는 판(2026-09-11 자 등)은 그 전에
 * 만들어진 것이라 BOM 이 없다 — 재수집(네트워크·DART API)을 다시 돌리지 않고
 * «이미 있는 파일»만 고쳐서 지금 당장 파는 판을 바로잡는다.
 *
 * ⛔ 내용은 한 글자도 바꾸지 않는다 — 맨 앞에 BOM 세 바이트(U+FEFF)만 더한다.
 *
 *   node scripts/fix-csv-add-bom.mjs <파일…>
 */
import fs from 'node:fs';
import { BOM, csv쓰기 } from './lib/csv-out.mjs';

export function 이미BOM인가(경로) {
  const fd = fs.openSync(경로, 'r');
  const buf = Buffer.alloc(3);
  fs.readSync(fd, buf, 0, 3, 0);
  fs.closeSync(fd);
  return buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF;
}

export function 고친다(경로들) {
  const 결과 = [];
  for (const 경로 of 경로들) {
    if (!fs.existsSync(경로)) { 결과.push({ 경로, 함: '⬜ 없음' }); continue; }
    if (이미BOM인가(경로)) { 결과.push({ 경로, 함: '— 이미 있음' }); continue; }
    const 원본 = fs.readFileSync(경로, 'utf8');
    csv쓰기(경로, 원본);
    결과.push({ 경로, 함: '✅ 붙임' });
  }
  return 결과;
}

const 나 = process.argv[1] && new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1') === process.argv[1].replace(/\\/g, '/');
if (나) {
  const 파일들 = process.argv.slice(2);
  if (!파일들.length) { console.log('쓰임: node scripts/fix-csv-add-bom.mjs <파일…>'); process.exit(1); }
  for (const r of 고친다(파일들)) console.log(`${r.함}  ${r.경로}`);
}
