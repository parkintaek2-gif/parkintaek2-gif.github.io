#!/usr/bin/env node
/**
 * 찾는다-안쓴자료.mjs — **쥐고 있는데 한 번도 글로 안 쓴 자료**를 찾는다. (5번 2026-10-09)
 *
 * ── 🔴🔴 왜 만드나 ─────────────────────────────────────────────────────────
 * 오늘 쟀더니 기사 한 장이 회사 지면 일곱~열 장 몫을 했다
 * (`/article/` 장당 한 달 노출 1.97 · `/japan/` 0.27 · `/company/` 0.20).
 * 그런데 기사는 **2026-09-29 이후 열흘째 0편**이다.
 *
 * 글이 안 나오는 까닭이 「쓸 거리가 없다」일 수 있다. 그것은 **풀 수 있는 것**이다 —
 * 우리는 `archive/raw` 에 자료를 수십 갈래 쥐고 있고, 그중 **한 번도 글로 안 쓴 것**이 있다.
 * ⭐ 강령: 「**쥔 자료의 안 쓰던 축부터 찾아 낸다**」
 *
 * ── ⛔ 이 자가 지키는 것 ───────────────────────────────────────────────────
 * ⛔ 「글감을 고른다」가 아니다. **「안 쓴 것이 무엇인가」만 센다.** 고르는 것은 사람이 한다.
 * ⛔ 「안 썼다」를 「쓸 값이 있다」로 읽지 않는다 — 안 쓴 까닭이 있을 수 있다.
 * ⛔ 자료 폴더를 못 읽으면 「없다」가 아니라 **「못 쟀다」**로 적는다.
 * ⚠ 글에 그 이름이 «적혀 있나»만 본다. 이름을 안 적고 쓴 글은 못 잡는다. 그 한계를 같이 말한다.
 *
 * 쓰는 법
 *   node scripts/찾는다-안쓴자료.mjs --자가시험
 *   node scripts/찾는다-안쓴자료.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const 뿌리 = path.resolve(import.meta.dirname, '..');
export const 자료방 = path.join(뿌리, 'archive', 'raw');
export const 글방들 = [
  path.join(뿌리, 'content', 'articles'),
  path.join(뿌리, 'content', 'kculturewire'),
];

/**
 * 폴더 이름에서 «글에 나올 만한 말»을 뽑는다.
 * `uae-adx-disclosures` → ['uae','adx','disclosures']
 * ⛔ 너무 짧거나 흔한 토막은 버린다 — 아무 글에나 걸려 「썼다」로 잘못 센다.
 */
export const 흔한토막 = new Set(['raw', 'data', 'kr', 'ko', 'en', 'the', 'and', 'of', 'new', 'old', 'all']);

export function 토막내기(이름) {
  return String(이름 ?? '')
    .toLowerCase()
    .split(/[^a-z0-9가-힣]+/)
    .filter((w) => w.length >= 3 && !흔한토막.has(w));
}

/**
 * 그 자료가 글에 쓰였나.
 * ⚠ **토막이 «다»** 글 하나에 들어 있어야 쓴 것으로 센다 — 하나만 걸리면 우연이다.
 * @returns {boolean|null} 글을 못 읽었으면 null (⛔ false 가 아니다)
 */
export function 글에쓰였나(토막들, 글들) {
  if (!Array.isArray(글들)) return null;
  if (!Array.isArray(토막들) || !토막들.length) return null;
  return 글들.some((g) => {
    const t = String(g ?? '').toLowerCase();
    return 토막들.every((w) => t.includes(w));
  });
}

/** 폴더 안 파일 수와 가장 새 파일의 날 — 「살아 있는 자료인가」를 보려고 */
export function 방살피기(길) {
  try {
    const 것 = fs.readdirSync(길, { withFileTypes: true }).filter((e) => e.isFile());
    if (!것.length) return { 수: 0, 마지막: null };
    let 가장 = 0;
    for (const e of 것) {
      const s = fs.statSync(path.join(길, e.name));
      if (s.mtimeMs > 가장) 가장 = s.mtimeMs;
    }
    const d = new Date(가장);
    const p = (n) => String(n).padStart(2, '0');
    return { 수: 것.length, 마지막: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}` };
  } catch { return null; }   /* ⬜ 못 읽었다 — 0 으로 메우지 않는다 */
}

/* ── 자가시험 ───────────────────────────────────────────────────────────── */
if (process.argv.includes('--자가시험')) {
  const 것 = []; const 다 = (이름, 참) => 것.push({ 이름, 참: !!참 });

  다('이름을 토막낸다', 토막내기('uae-adx-disclosures').join(',') === 'uae,adx,disclosures');
  다('짧은 토막은 버린다', !토막내기('kr-bond-x').includes('x'));
  다('흔한 토막은 버린다', !토막내기('raw-stocks').includes('raw'));
  다('한글 이름도 토막낸다', 토막내기('국민연금-사업장').length === 2);

  const 글들 = ['Korea adx uae disclosures were counted', '아무 상관 없는 글'];
  다('🔴 토막이 다 들어 있어야 「썼다」', 글에쓰였나(['uae', 'adx', 'disclosures'], 글들) === true);
  다('⛔ 하나만 걸리면 「썼다」가 아니다', 글에쓰였나(['uae', 'adx', 'nothinglikethis'], 글들) === false);
  다('⛔ 글을 못 읽었으면 null — false 가 아니다', 글에쓰였나(['a'], null) === null);
  다('⛔ 토막이 없으면 null', 글에쓰였나([], 글들) === null);

  다('⬜ 없는 방은 null — 0 이 아니다', 방살피기(path.join(뿌리, '없는방-xyz')) === null);
  다('있는 방은 수를 센다', (방살피기(path.join(뿌리, 'scripts'))?.수 ?? 0) > 10);

  const 진 = 것.filter((x) => !x.참);
  console.log(`안 쓴 자료 찾기 — 자체 점검 ${것.length - 진.length}/${것.length}`);
  for (const x of 진) console.log('   🔴 ' + x.이름);
  process.exit(진.length ? 1 : 0);
}

/* ── 실제로 찾는다 ─────────────────────────────────────────────────────── */

/** 글을 다 읽어 한 덩어리씩 */
function 글읽기() {
  const 낸다 = [];
  for (const 방 of 글방들) {
    if (!fs.existsSync(방)) continue;
    for (const n of fs.readdirSync(방)) {
      if (!n.endsWith('.md')) continue;
      try { 낸다.push(fs.readFileSync(path.join(방, n), 'utf8')); } catch { /* 한 장을 못 읽어도 멈추지 않는다 */ }
    }
  }
  return 낸다;
}

if (!fs.existsSync(자료방)) {
  console.log('⬜ archive/raw 를 못 읽었다 — 못 쟀다. 「안 쓴 자료가 없다」가 아니다');
  process.exit(0);
}

const 글들 = 글읽기();
if (!글들.length) {
  console.log('⬜ 글을 한 편도 못 읽었다 — 못 쟀다');
  process.exit(0);
}

const 방들 = fs.readdirSync(자료방, { withFileTypes: true }).filter((e) => e.isDirectory());
const 안쓴것 = []; const 쓴것 = []; const 못잰것 = [];
for (const e of 방들) {
  const 토막 = 토막내기(e.name);
  const 살핌 = 방살피기(path.join(자료방, e.name));
  const 썼나 = 글에쓰였나(토막, 글들);
  const 줄 = { 이름: e.name, ...(살핌 ?? { 수: null, 마지막: null }) };
  if (살핌 === null || 썼나 === null) 못잰것.push(줄);
  else if (썼나) 쓴것.push(줄);
  else 안쓴것.push(줄);
}

console.log('■ 쥐고 있는데 한 번도 글로 «이름이 안 나온» 자료');
console.log(`   글 ${글들.length}편 · 자료 갈래 ${방들.length}개를 맞댔다`);
console.log('   ⚠ 「이름이 글에 적혀 있나」만 본다 — 이름을 안 적고 쓴 글은 못 잡는다');
console.log('   ⛔ 「안 썼다」를 「쓸 값이 있다」로 읽지 않는다. 고르는 것은 사람이 한다\n');

안쓴것.sort((a, b) => (b.수 ?? 0) - (a.수 ?? 0));
console.log(`🔴 이름이 안 나온 갈래 ${안쓴것.length}개 (쌓인 파일이 많은 것부터)`);
for (const x of 안쓴것.slice(0, 25)) {
  console.log(`   ${String(x.수 ?? '?').padStart(6)}개  ${String(x.마지막 ?? '못 쟀다').padEnd(12)} ${x.이름}`);
}
if (안쓴것.length > 25) console.log(`   … ${안쓴것.length - 25}개 더`);

console.log(`\n✅ 이름이 글에 나온 갈래 ${쓴것.length}개`);
if (못잰것.length) {
  console.log(`⬜ 못 잰 갈래 ${못잰것.length}개 — ${못잰것.slice(0, 5).map((x) => x.이름).join(' · ')}`);
  console.log('   「안 썼다」로 세지 않았다');
}
