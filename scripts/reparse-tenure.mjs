#!/usr/bin/env node
/**
 * 저장해 둔 **원본 행**으로 직원 현황을 다시 계산한다 — **API 호출 0번.**
 *
 *   node scripts/reparse-tenure.mjs           바뀌는 것만 보여 준다
 *   node scripts/reparse-tenure.mjs --write   실제로 고친다
 *
 * ── 왜 이게 되는가 ──────────────────────────────────────────────
 * 2026-08-05 오전에 `refetch-tenure.mjs` 가 **원행**(원본 응답의 우리가 쓰는 칸들)을
 * 같이 저장하게 고쳤다. 그 덕에 파서를 고쳐도 **다시 안 받아도 된다.**
 *
 * 같은 날 오전엔 원행이 없어서 파서 한 줄 고치자고 **2,921번을 다시 불렀다.**
 * 임원 재직기간은 `재직원문` 이 있어서 35,004건을 **0번**으로 고쳤다. 그 차이다.
 *
 * ── ⚠ 믿고 넘기지 않는다 ────────────────────────────────────────
 * · **없어짐**을 센다. 채움률만 보면 사라진 값이 안 보인다
 * · 바뀐 것을 **크기순으로 보여 준다.** 「몇 건 바뀜」만으로는 옳은지 모른다
 * · `--write` 없이는 아무것도 안 고친다
 */
import { readFileSync, writeFileSync, existsSync, renameSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { 합치기 } from './collect-tenure.mjs';

const 본 = path.resolve('archive/raw/dart-employment/employment-2025.ndjson');

/** 저장한 원행을 DART 응답 모양으로 되돌린다 — `합치기` 는 그 모양을 받는다 */
const 되돌리기 = (원행) => (원행 ?? []).map((x) => ({
  fo_bbm: x.부문, sexdstn: x.성별, sm: x.합,
  rgllbr_co: x.정규, cnttk_co: x.기간제,
  avrg_cnwk_sdytrn: x.근속원문, jan_salary_am: x.급여,
}));

function main() {
  if (!existsSync(본)) { console.error(`✕ ${본} 이 없다.`); process.exit(1); }
  const 쓰기 = process.argv.includes('--write');
  const 줄 = readFileSync(본, 'utf8').split('\n').filter((x) => x.trim());
  const 행 = 줄.map((l) => JSON.parse(l));

  const 원행있음 = 행.filter((r) => Array.isArray(r.원행)).length;
  console.log(`${행.length.toLocaleString()}개사 · 원행 있는 것 ${원행있음.toLocaleString()}`);
  if (원행있음 < 행.length) {
    console.log(`⚠ ${(행.length - 원행있음).toLocaleString()}개사는 원행이 없어 **손댈 수 없다.** 그대로 둔다.`);
  }

  let 바뀜 = 0, 없어짐 = 0, 새로 = 0, 그대로 = 0;
  const 변화 = [];
  const 새줄 = 행.map((r) => {
    if (!Array.isArray(r.원행)) return r;
    const v = 합치기(되돌리기(r.원행));
    const 전 = r.인원 ?? null, 후 = v.인원 ?? null;
    if (전 == null && 후 != null) 새로++;
    else if (전 != null && 후 == null) 없어짐++;
    else if (전 !== 후) { 바뀜++; 변화.push({ 이름: r.영문 ?? r.이름, 전, 후, 차: 후 - 전 }); }
    else 그대로++;
    return { ...r, ...v };
  });

  console.log(`\n■ 인원  그대로 ${그대로.toLocaleString()} · 바뀜 ${바뀜.toLocaleString()} · 새로 ${새로} · **없어짐 ${없어짐}**`);
  변화.sort((a, b) => Math.abs(b.차) - Math.abs(a.차));
  if (변화.length) {
    console.log('■ 바뀐 것 (큰 순)');
    for (const x of 변화.slice(0, 20)) {
      console.log(`   ${String(x.이름).slice(0, 30).padEnd(32)} ${String(x.전).padStart(8)} → ${String(x.후).padStart(8)}  (${x.차 > 0 ? '+' : ''}${x.차.toLocaleString()})`);
    }
  }
  if (없어짐) console.log(`\n⚠ **${없어짐}곳이 값을 잃었다.** 왜인지 보기 전에는 쓰지 않는다.`);

  if (!쓰기) { console.log('\n(고치지 않았다. 실제로 고치려면 --write)'); return; }
  if (없어짐) { console.error('✕ 값을 잃은 곳이 있어 쓰지 않는다.'); process.exit(1); }
  /* ⚠ 원본을 먼저 옆에 둔다. 되돌릴 길이 없으면 고치지 않는다 */
  renameSync(본, 본 + '.before-reparse');
  writeFileSync(본, 새줄.map((r) => JSON.stringify(r)).join('\n') + '\n');
  console.log(`\n✅ 고쳤다. 옛 파일은 ${path.basename(본)}.before-reparse`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
