#!/usr/bin/env node
/**
 * 잰다-자료속이-비었나.mjs — **자료 모양을 짐작하지 않고 비었나를 잰다.** (5번 2026-10-09)
 *
 * ── 🔴🔴 왜 만드나 ─────────────────────────────────────────────────────────
 * 오늘 「48갈래 중 실제로 빈 것이 몇인가」를 급히 세다가 **두 번 틀렸다.**
 *   ④ 한경컨센서스 — 첫 배열 칸 `못받은쪽: 0` 을 속으로 집어 「23개가 비었다」고 했다.
 *      실제로는 `줄들` 에 하루 523~624줄이 들어 있었다.
 *   ⑤ kcw-star-ranking — 자료가 **배열이 아니라 칸**(`카테고리` 10개)에 들어 있었다.
 *      배열만 찾는 잣대가 「다 비었다」고 했다.
 * ⭐ 그날 붙인 이름 — **「급히 만든 잣대는 자료 모양을 짐작한다」**
 *   자를 새로 지을 때 가장 먼저 틀리는 곳은 판정이 아니라 **「속이 어디 들었나」**다.
 *
 * ── ⭐ 그래서 이 자는 다르게 만든다 ───────────────────────────────────────
 * ⛔ **모양을 짐작해서 하나로 뭉개지 않는다.** 모양을 «알아본 때»만 비었나를 말하고,
 *   못 알아보면 **「모양을 모르겠다」**로 따로 센다. 세는 칸을 셋으로 둔다.
 * ⛔ 「가장 긴 배열이 속이다」 같은 어림을 쓰지 않는다 — 그것이 ④를 틀리게 했다.
 * ⚠ 「비었다」가 「탈이다」가 아니다. 공시가 없는 날은 비는 것이 맞다.
 *   이 자는 **세기만 한다.** 까닭은 `_meta.coverage` 가 있는 자료만 말할 수 있다.
 *
 * 쓰는 법
 *   node scripts/잰다-자료속이-비었나.mjs --자가시험
 *   node scripts/잰다-자료속이-비었나.mjs
 *   node scripts/잰다-자료속이-비었나.mjs --보인다
 */
import fs from 'node:fs';
import path from 'node:path';

const 뿌리 = path.resolve(import.meta.dirname, '..');
export const 자료방 = path.join(뿌리, 'archive', 'raw');

/** 속이 아닌 것이 뻔한 칸 — 머리글·셈값이다 */
export const 속아닌칸 = new Set([
  '_meta', '_메모', 'meta', 'coverage', '커버리지',
  '출처', '받은날', '지은때', '주의', '한계', '받은법', '화면창', '쪽수',
  '못받은쪽', '못찾음', '목록총건수', 'builtAt', 'asOf', 'source', 'product', 'symbol', 'notThis',
]);

/**
 * 자료 덩이의 «속»을 알아본다. **못 알아보면 null** — 짐작하지 않는다.
 * @returns {{꼴:'배열'|'칸묶음', 수:number}|null}
 */
export function 속알아보기(덩이) {
  if (Array.isArray(덩이)) return { 꼴: '배열', 수: 덩이.length };
  if (덩이 == null || typeof 덩이 !== 'object') return null;

  const 쓸것 = Object.keys(덩이).filter((k) => !속아닌칸.has(k));
  const 배열칸 = 쓸것.filter((k) => Array.isArray(덩이[k]));
  const 묶음칸 = 쓸것.filter((k) => 덩이[k] && typeof 덩이[k] === 'object' && !Array.isArray(덩이[k]));

  /* ⭐ 속으로 삼을 칸이 «딱 하나»일 때만 말한다. 둘 이상이면 어느 것인지 모른다 */
  if (배열칸.length === 1 && 묶음칸.length === 0) return { 꼴: '배열', 수: 덩이[배열칸[0]].length };
  if (묶음칸.length === 1 && 배열칸.length === 0) return { 꼴: '칸묶음', 수: Object.keys(덩이[묶음칸[0]]).length };
  return null;   /* ⛔ 둘 이상이거나 하나도 없으면 «모르겠다» */
}

/* ── 자가시험 ───────────────────────────────────────────────────────────── */
if (process.argv.includes('--자가시험')) {
  const 것 = []; const 다 = (이름, 참) => 것.push({ 이름, 참: !!참 });

  다('뿌리가 배열이면 그대로 센다', 속알아보기([1, 2, 3])?.수 === 3);
  다('빈 배열도 0 으로 센다', 속알아보기([])?.수 === 0);

  /* 🔴 ④ 한경컨센서스 — 머리글 칸과 셈값 칸이 섞여 있었다 */
  const 한경 = { 지은때: 'x', 출처: 'y', 못받은쪽: [], 줄들: new Array(624).fill(0) };
  다('🔴 「못받은쪽」을 속으로 안 집는다 — 그것이 ④를 틀리게 했다', 속알아보기(한경)?.수 === 624);

  /* 🔴 ⑤ kcw-star-ranking — 자료가 배열이 아니라 칸에 있었다 */
  const 스타 = { 출처: 'x', 받은날: 'y', 못찾음: [], 카테고리: { a: 1, b: 2, c: 3 } };
  다('🔴 칸묶음도 알아본다 — 그것이 ⑤를 틀리게 했다', 속알아보기(스타)?.꼴 === '칸묶음');
  다('칸묶음 수를 센다', 속알아보기(스타)?.수 === 3);

  /* ⛔ 모르겠으면 모르겠다고 한다 */
  다('⛔ 쓸 배열이 둘이면 모르겠다', 속알아보기({ a: [1], b: [2, 3] }) === null);
  다('⛔ 배열과 묶음이 섞이면 모르겠다', 속알아보기({ a: [1], b: { x: 1 } }) === null);
  다('⛔ 속으로 삼을 칸이 없으면 모르겠다', 속알아보기({ 출처: 'x', 받은날: 'y' }) === null);
  다('⛔ 덩이가 아니면 null', 속알아보기('글') === null);
  다('⛔ null 도 null', 속알아보기(null) === null);

  /* 🔴 두바이 주주 — 머리글 하나 + 배열 하나 */
  const 두바이 = { _meta: { coverage: {} }, substantialShareholders: [] };
  다('🔴 머리글을 빼고 배열 하나를 속으로 본다', 속알아보기(두바이)?.수 === 0);

  const 진 = 것.filter((x) => !x.참);
  console.log(`자료 속 재기 — 자체 점검 ${것.length - 진.length}/${것.length}`);
  for (const x of 진) console.log('   🔴 ' + x.이름);
  process.exit(진.length ? 1 : 0);
}

/* ── 실제로 잰다 ───────────────────────────────────────────────────────── */
const 보인다 = process.argv.includes('--보인다');

console.log('■ 자료 속이 비었나 — 모양을 «알아본 때»만 말한다');
console.log('   ⛔ 「비었다」가 「탈이다」가 아니다. 공시가 없는 날은 비는 것이 맞다');
console.log('   ⛔ 모양을 못 알아보면 「모르겠다」로 센다. 짐작해서 뭉개지 않는다\n');

if (!fs.existsSync(자료방)) { console.log('⬜ archive/raw 를 못 읽었다 — 못 쟀다'); process.exit(0); }

const 줄들 = [];
for (const e of fs.readdirSync(자료방, { withFileTypes: true }).filter((x) => x.isDirectory())) {
  const d = path.join(자료방, e.name);
  let ns = [];
  try { ns = fs.readdirSync(d).filter((n) => n.endsWith('.json')); } catch { continue; }
  if (!ns.length) continue;
  let 빔 = 0; let 참 = 0; let 모름 = 0; let 못읽음 = 0; let 가름 = false;
  for (const n of ns.slice(0, 300)) {
    let j;
    try { j = JSON.parse(fs.readFileSync(path.join(d, n), 'utf8')); } catch { 못읽음 += 1; continue; }
    const m = (j && typeof j === 'object' && !Array.isArray(j)) ? (j._meta ?? j._메모 ?? {}) : {};
    if (m && typeof m === 'object' && m.coverage && typeof m.coverage === 'object') 가름 = true;
    const 속 = 속알아보기(j);
    if (속 == null) 모름 += 1;
    else if (속.수 === 0) 빔 += 1;
    else 참 += 1;
  }
  줄들.push({ 이름: e.name, 빔, 참, 모름, 못읽음, 가름, 전체: ns.length });
}

const 빈것있음 = 줄들.filter((x) => x.빔 > 0);
const 모르는것 = 줄들.filter((x) => x.모름 > 0);

console.log(`  잰 갈래 ${줄들.length}개 (.json 으로 쌓는 것만)`);
console.log(`  🔴 빈 파일이 있는 갈래 ${빈것있음.length}개`);
console.log(`  ⬜ 모양을 못 알아본 파일이 있는 갈래 ${모르는것.length}개\n`);

빈것있음.sort((a, b) => b.빔 - a.빔);
console.log('🔴 빈 파일이 있는 갈래 — 「까닭을 말할 수 있나」와 함께');
for (const x of 빈것있음.slice(0, 보인다 ? 999 : 14)) {
  const 말 = x.가름 ? '✅ coverage 가 있어 까닭을 말할 수 있다' : '🔴 coverage 가 없어 «없음/못잼»을 못 가른다';
  console.log(`   빔 ${String(x.빔).padStart(4)} · 참 ${String(x.참).padStart(4)} · 모름 ${String(x.모름).padStart(3)}   ${x.이름.padEnd(30)} ${말}`);
}

if (모르는것.length) {
  console.log(`\n⬜ 모양을 못 알아본 갈래 ${모르는것.length}개 — 「비었다」로 세지 «않았다»`);
  if (보인다) for (const x of 모르는것) console.log(`   모름 ${String(x.모름).padStart(4)}/${x.전체}   ${x.이름}`);
  else console.log('   ' + 모르는것.slice(0, 10).map((x) => x.이름).join(' · ') + (모르는것.length > 10 ? ' …' : ''));
}

const 못가르는빈것 = 빈것있음.filter((x) => !x.가름);
console.log('');
console.log(`⇒ 빈 파일이 있으면서 «까닭을 못 말하는» 갈래 ${못가르는빈것.length}개`);
console.log('   ⭐ 거기를 고치면 다음 사람이 빈 칸을 보고 짐작하지 않는다');
