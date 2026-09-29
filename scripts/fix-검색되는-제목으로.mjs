#!/usr/bin/env node
/**
 * fix-검색되는-제목으로.mjs — **찾아올 길이 없는 제목을 «사람이 부르는 이름»으로 바꾼다.**
 *
 * ── 🔴 왜 (2026-09-29 · 5번) ─────────────────────────────────────────
 * 사장님 최우선 지시(검색·AI 유입)에 따라 재 보니, GSC 에서 1페이지에 선 질의를
 * «세 지면»이 다 가져갔고 그중 하나가 여덟이었다. 그 이기는 지면의 제목은 이랬다 —
 *   「Korea's 10 **largest listed companies** — and why most rankings double-count Samsung」
 * **사람이 실제로 검색하는 보통명사가 앞에 있고, 뒤에 우리만 아는 결론이 붙는다.**
 *
 * 그런데 우리 데이터 지면 31개 가운데 23개는 제목이 이런 꼴이었다 —
 *   「Where analyst attention piles up」 · 「The sector workforce panel」
 * 뜻은 맞지만 **아무도 그렇게 검색하지 않는다.** 찾아올 길이 없다.
 *
 * ⚠ 이 축들은 아직 질의가 «하나도» 없다. 그러니 GSC 를 잣대로 삼을 수 없다 —
 *   대신 **그것을 처음 찾는 사람이 쓸 보통명사**를 앞에 놓는다.
 *   ⛔ 「좋은 제목처럼 보인다」로 정하지 않는다. 이기는 지면의 «꼴»을 따른다.
 *
 * 쓰는 법
 *   node scripts/fix-검색되는-제목으로.mjs            무엇이 바뀌는지만 본다
 *   node scripts/fix-검색되는-제목으로.mjs --적는다   실제로 고친다
 *   node scripts/fix-검색되는-제목으로.mjs --자가시험
 *
 * ⛔ 두 번 돌려도 안전하다 — 이미 새 제목이면 건드리지 않는다.
 * ⛔ 옛 제목을 «못 찾으면» 그 지면은 건드리지 않고 빨강으로 적는다. 짐작으로 안 고친다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** [지면, 옛 제목, 새 제목] — 새 제목은 «보통명사 먼저, 우리 결론 뒤» */
export const 바꿀것 = [
  ['analyst-attention',
    'Where analyst attention piles up',
    'Korean analyst coverage by company — where attention piles up'],
  ['broker-candour',
    'The Sell rating that vanished',
    'Korean broker stock ratings — the Sell rating that vanished'],
  ['consensus',
    'The Korean analyst list nobody keeps',
    'Korean analyst consensus and earnings estimates — the list nobody keeps'],
  ['target-changes',
    'Who moved a Korean target price',
    'Korean target price changes — who moved a target price, and when'],
  ['target-price-accuracy',
    'Which brokers hit their target prices',
    'Korean broker target price accuracy — which brokers hit theirs'],
  ['sector-leaders',
    'In every sector, the biggest companies pay more',
    'Korean companies by sector — in every sector the biggest pay more'],
  ['board-composition',
    'Who sits on Korean boards',
    'Korean company boards of directors — who sits on them'],
  ['pension-wage-panel',
    'The National Pension wage panel',
    'Korean company wages by employer — the National Pension panel'],
  ['sector-workforce-panel',
    'The sector workforce panel',
    'Korean employment by sector — the workforce panel'],
  ['ownership',
    'A quarter of Korean ownership filings report no change — and 631 hide one',
    'Korean shareholder ownership filings — a quarter report no change, 631 hide one'],
];

/**
 * 한 지면의 글을 고친다.
 * ⚠ 제목은 `const TITLE = '...'` 에도 있고 `<h1>...</h1>` 에도 있다(둘 다 리터럴인 지면이 있다).
 *   **둘 다 갈아야 한다** — 하나만 고치면 화면과 탭이 서로 다른 말을 한다.
 * @returns {{글:string, 바뀌었나:boolean, 곳:number, 까닭?:string}}
 */
export function 고치기(원글, 옛제목, 새제목) {
  const 글0 = String(원글 ?? '');
  if (!글0) return { 글: 글0, 바뀌었나: false, 곳: 0, 까닭: '빈 글이다' };
  if (글0.includes(새제목)) return { 글: 글0, 바뀌었나: false, 곳: 0, 까닭: '이미 새 제목이다' };
  if (!글0.includes(옛제목)) return { 글: 글0, 바뀌었나: false, 곳: 0, 까닭: `못 찾았다 — ${옛제목}` };
  const 곳 = 글0.split(옛제목).length - 1;
  return { 글: 글0.split(옛제목).join(새제목), 바뀌었나: true, 곳 };
}

/* ── 자가시험 ─────────────────────────────────────────────────────── */
export function 자가시험() {
  const 것 = [];
  const 본다 = (이름, 참, 덧 = '') => 것.push({ 이름, 참: !!참, 덧 });

  const 글 = "const TITLE = 'The sector workforce panel';\n<h1>The sector workforce panel</h1>";
  const r = 고치기(글, 'The sector workforce panel', 'Korean employment by sector — the workforce panel');
  본다('🔴 TITLE 과 h1 을 «둘 다» 간다', r.바뀌었나 && r.곳 === 2, `${r.곳}곳`);
  본다('⛔ 옛 제목이 남지 않는다', !r.글.includes("'The sector workforce panel'"));

  const r2 = 고치기(r.글, 'The sector workforce panel', 'Korean employment by sector — the workforce panel');
  본다('⛔ 두 번 돌려도 안전하다', !r2.바뀌었나 && r2.까닭 === '이미 새 제목이다');

  const r3 = 고치기('아무 글', '없는 제목', '새것');
  본다('🔴 못 찾으면 «고치지 않고» 까닭을 적는다', !r3.바뀌었나 && /못 찾았다/.test(r3.까닭));
  본다('⛔ 빈 것에 안 터진다', 고치기(null, 'a', 'b').바뀌었나 === false);

  /* 🔴 새 제목마다 «사람이 찾을 보통명사»가 앞쪽에 있어야 한다 — 이 자의 존재 이유다 */
  const 보통명사 = /^(Korean|Korea|South Korea|Japan|Asia)/;
  본다('🔴 새 제목은 모두 보통명사로 시작한다',
    바꿀것.every(([, , 새]) => 보통명사.test(새)),
    바꿀것.filter(([, , 새]) => !보통명사.test(새)).map((x) => x[0]).join(',') || '없음');
  본다('⛔ 옛 제목과 새 제목이 같은 것은 없다', 바꿀것.every(([, 옛, 새]) => 옛 !== 새));
  본다('⛔ 지면 이름이 겹치지 않는다', new Set(바꿀것.map((x) => x[0])).size === 바꿀것.length);

  const 빨강 = 것.filter((x) => !x.참);
  console.log(`■ fix-검색되는-제목으로 자가시험 ${것.length - 빨강.length}/${것.length}`);
  for (const x of 것) console.log(`  ${x.참 ? '✅' : '🔴'} ${x.이름}${x.덧 ? `  (${x.덧})` : ''}`);
  return 빨강.length === 0;
}

/* ── 진입점 ───────────────────────────────────────────────────────── */
const 내가진입점 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가진입점) {
  if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);
  const 적는다 = process.argv.includes('--적는다');

  let 고침 = 0; let 그대로 = 0; let 탈 = 0;
  for (const [이름, 옛, 새] of 바꿀것) {
    const 데 = path.join(뿌리, 'src', 'pages', 'data', `${이름}.astro`);
    if (!fs.existsSync(데)) { console.log(`🔴 ${이름.padEnd(24)} 파일이 없다`); 탈++; continue; }
    const r = 고치기(fs.readFileSync(데, 'utf8'), 옛, 새);
    if (!r.바뀌었나) {
      const 빨강 = /못 찾았다/.test(r.까닭 ?? '');
      console.log(`${빨강 ? '🔴' : '⬜'} ${이름.padEnd(24)} ${r.까닭}`);
      빨강 ? 탈++ : 그대로++;
      continue;
    }
    if (적는다) fs.writeFileSync(데, r.글, 'utf8');
    console.log(`✅ ${이름.padEnd(24)} ${r.곳}곳${적는다 ? '' : ' (안 썼다)'}`);
    console.log(`     옛  ${옛}`);
    console.log(`     새  ${새}`);
    고침++;
  }
  console.log(`\n■ 고칠 것 ${고침} · 그대로 ${그대로} · 탈 ${탈}${적는다 ? '' : '   ⬜ --적는다 를 붙여야 실제로 쓴다'}`);
  process.exit(탈 ? 1 : 0);
}
