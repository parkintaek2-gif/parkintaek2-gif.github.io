#!/usr/bin/env node
/**
 * check-data-page-counts.mjs — **`/data` 지면이 말하는 행 수가 실제 파일과 같은가.**
 *
 * ── 왜 (F5 · 2026-09-19 · 2번) ──────────────────────────────────────────
 * `src/pages/data/index.astro` 는 표본 곁에 「전량은 2,879개사다」처럼 «숫자로»
 * 약속한다. 재 보니 **people 이 이미 어긋나 있었다**(적힌 2,879 · 실제 2,924 —
 * 2026-09-11 판으로 다시 모은 뒤 지면 글자를 안 고쳤다). 손으로 한 번 맞췄지만,
 * 다음 판이 또 나오면 같은 방식으로 다시 어긋난다 — 그래서 자로 남긴다.
 *
 * ⛔ 이 자가 지키는 것
 * ⛔ 숫자를 다시 세지 않는다 — 파는 CSV(src/data/full)·탭(_meta.rows)에서 **그대로**
 *   읽어 지면 문구와 대조만 한다. 두 번째 계산기를 만들지 않는다.
 * ⛔ 어긋나면 «어디가 얼마나» 어긋났는지 줄로 남긴다 — 「틀렸다」만 적지 않는다.
 *
 *   node scripts/check-data-page-counts.mjs
 *   node scripts/check-data-page-counts.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { csv파일읽기 } from './lib/csv-read.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 지면길 = path.join(뿌리, 'src/pages/data/index.astro');

/**
 * 지면 글에서 「covers all N,NNN <낱말>」을 찾아 숫자만 뽑는다.
 * @param 실마리 그 문장이 어느 파일 얘기인지 가르는 앞부분 문자열(고유해야 한다)
 */
export function 지면에서수뽑기(글, 실마리) {
  const idx = 글.indexOf(실마리);
  if (idx < 0) return null;
  const m = 글.slice(idx, idx + 실마리.length + 400).match(/covers all ([\d,]+)/);
  if (!m) return null;
  return Number(m[1].replace(/,/g, ''));
}

/** 확인할 목록 — {실마리, 무엇, 실제수} */
export function 확인목록(뿌리길 = 뿌리) {
  const csv행수 = (파일이름) => {
    const p = path.join(뿌리길, 'src/data/full', 파일이름);
    if (!fs.existsSync(p)) return null;
    return csv파일읽기(p).줄들.length;
  };
  const 밸류tape = (() => {
    try { return JSON.parse(fs.readFileSync(path.join(뿌리길, 'src/data/korea-valuation-tape.json'), 'utf8'))._meta?.rows ?? null; }
    catch { return null; }
  })();

  return [
    { 실마리: 'Empty means not measured', 무엇: 'Korea Valuation Tape', 실제수: 밸류tape },
    { 실마리: 'Korea People Panel — free sample', 무엇: 'people', 실제수: csv행수('korea-people-panel-2026-09-11.csv') },
    { 실마리: 'free sample, filings', 무엇: 'ownership (filings)', 실제수: csv행수('korea-ownership-ledger-filings-2026-09-11.csv') },
    { 실마리: 'free sample, executives', 무엇: 'ownership (executives)', 실제수: csv행수('korea-ownership-ledger-executives-2026-09-11.csv') },
    { 실마리: 'Korea Mezzanine Book — free sample', 무엇: 'mezzanine', 실제수: csv행수('korea-mezzanine-book-2026-09-11.csv') },
  ];
}

/** 재기 — 지면 글과 확인목록을 받아 «적힌 수 vs 실제 수»를 대조한다 */
export function 재기(글, 목록) {
  const 어긋난것 = []; const 못잰것 = [];
  for (const 항목 of 목록) {
    const 적힌수 = 지면에서수뽑기(글, 항목.실마리);
    if (적힌수 === null) { 못잰것.push(`${항목.무엇} — 지면에서 문구를 못 찾았다(「${항목.실마리}」)`); continue; }
    if (항목.실제수 === null) { 못잰것.push(`${항목.무엇} — 실제 파일을 못 찾았다`); continue; }
    if (적힌수 !== 항목.실제수) 어긋난것.push(`${항목.무엇} — 지면 ${적힌수.toLocaleString('en-US')} vs 실제 ${항목.실제수.toLocaleString('en-US')}`);
  }
  return { 어긋난것, 못잰것, 된다: 어긋난것.length === 0 };
}

/* ── 자가시험 ─────────────────────────────────────────────────────────────── */
function 자가시험() {
  let 통 = 0; const 실 = [];
  const 검 = (n, ok) => { if (ok) 통 += 1; else 실.push(n); };

  const 가짜글 = 'blah blah free sample thing covers all 1,234 companies, more text';
  검('지면에서수뽑기 — 「covers all N,NNN」을 찾는다', 지면에서수뽑기(가짜글, 'free sample thing') === 1234);
  검('지면에서수뽑기 — 실마리가 없으면 null', 지면에서수뽑기(가짜글, '없는실마리') === null);
  검('지면에서수뽑기 — 「covers all」이 없으면 null', 지면에서수뽑기('실마리만 있고 그 뒤엔 아무것도', '실마리만') === null);
  검('🔴 지면에서수뽑기 — 실마리와 숫자 사이가 멀어도(긴 설명문) 자른 숫자를 내지 않는다', (() => {
    const 긴글 = '실마리' + 'x'.repeat(250) + 'covers all 12,345 rows';
    return 지면에서수뽑기(긴글, '실마리') === 12345;
  })());

  const r1 = 재기(가짜글, [{ 실마리: 'free sample thing', 무엇: 'x', 실제수: 1234 }]);
  검('재기 — 수가 같으면 된다', r1.된다 === true && r1.어긋난것.length === 0);

  const r2 = 재기(가짜글, [{ 실마리: 'free sample thing', 무엇: 'x', 실제수: 9999 }]);
  검('🔴 재기 — 수가 다르면 잡는다', r2.된다 === false && /1,234.*9,999/.test(r2.어긋난것[0]));

  const r3 = 재기(가짜글, [{ 실마리: '없는실마리', 무엇: 'y', 실제수: 1 }]);
  검('⬜ 재기 — 못 찾으면 «못 잰 것»으로 (막지 않는다)', r3.못잰것.length === 1 && r3.된다 === true);

  const r4 = 재기(가짜글, [{ 실마리: 'free sample thing', 무엇: 'z', 실제수: null }]);
  검('⬜ 재기 — 실제 파일이 없으면 «못 잰 것»으로', r4.못잰것.length === 1 && r4.된다 === true);

  if (실.length) {
    console.error(`❌ 자가시험 실패 ${실.length}\n${실.map((x) => `   · ${x}`).join('\n')}`);
    process.exit(1);
  }
  console.log(`✅ check-data-page-counts 자가시험 ${통}개 통과`);
}

const 나 = process.argv[1] && new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1') === process.argv[1].replace(/\\/g, '/');
if (나) {
  if (process.argv.includes('--자가시험')) { 자가시험(); process.exit(0); }

  let 글 = '';
  try { 글 = fs.readFileSync(지면길, 'utf8'); }
  catch { console.log(`⬜ 못 쟀다 — ${지면길} 이 없다`); process.exit(0); }

  const r = 재기(글, 확인목록());
  if (r.못잰것.length) {
    console.log(`⚠ 못 잰 것 ${r.못잰것.length}개 (막지 않는다):`);
    for (const s of r.못잰것) console.log('   · ' + s);
  }
  if (!r.된다) {
    console.log(`\n🔴 지면에 적힌 수가 실제와 다르다 ${r.어긋난것.length}개:`);
    for (const s of r.어긋난것) console.log('   · ' + s);
    process.exit(1);
  }
  console.log('\n✅ /data 지면의 행 수 문구 — 실제와 전부 같다');
}
