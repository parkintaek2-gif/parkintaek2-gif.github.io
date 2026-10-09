#!/usr/bin/env node
/**
 * check-가져오면-도는자.mjs — **내보낼 것이 있는데 가져오면 돌아 버리는 자**를 잡는다.
 * (5번 2026-10-09)
 *
 * ── 🔴🔴 왜 만드나 — 하루에 «세 번» 같은 흠을 냈다 ──────────────────────────
 *   ① 06시  `check-indexnow-보냈나.mjs`   — `ping-indexnow` 가 가져오자 검사 보고가
 *            통보 결과 대신 찍혔다. 그 자리에서 고쳤다.
 *   ② 11시  `찾는다-배포표식.mjs`         — 몇 시간 뒤 **또 같은 꼴로 지었다.** 또 고쳤다.
 *   ③ 13시  `잰다-자료속이-비었나.mjs`    — **또 그랬다.**
 *
 * ⛔ 세 번 다 고쳐 놓고 몇 시간 뒤 똑같이 지었다. **기억해서 안 틀리는 구조가 아니다.**
 * ⭐ 강령 — 「규칙은 문장이 아니라 **검사**로 둔다 · 사람이 기억해서 지키는 구조를 만들지 않는다」
 *
 * ── 무엇을 잡나 ────────────────────────────────────────────────────────────
 * `export` 가 있는 `.mjs` 인데 **맨 바닥에서 돌아가는 일**(`console.log`·`fetch`·
 * 파일 훑기 따위)이 «관문 없이» 놓여 있는 자.
 *   관문이란 — `import.meta.url === pathToFileURL(process.argv[1]).href` 로 가른 것.
 *
 * ── ⛔ 이 자가 지키는 것 ───────────────────────────────────────────────────
 * ⛔ `export` 가 없는 자는 안 본다 — 그냥 돌라고 지은 자다(수집기·빌더).
 * ⛔ `--자가시험` 안쪽은 관문으로 친다. 그 블록은 인자가 있어야 돈다.
 * ⚠ 글자만 본다. 「진짜로 도는가」는 못 잰다 — 관문 글귀가 있나만 본다. 그 한계를 말한다.
 *
 * 쓰는 법
 *   node scripts/check-가져오면-도는자.mjs --자가시험
 *   node scripts/check-가져오면-도는자.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const 뿌리 = path.resolve(import.meta.dirname, '..');
export const 볼방 = path.join(뿌리, 'scripts');

/**
 * 못 박은 수 — 이보다 늘면 운다.
 *
 * 🔴 [2026-10-09] 처음에 **0 으로 적었다.** 「내가 세 번 틀렸을 뿐 다른 자들은 멀쩡하겠지」라는
 *   짐작이었다. 돌려 보니 `scripts/*.mjs` 1,326개 가운데 **249개**가 같은 꼴이었다.
 *   ⛔ 오늘만 벌써 여섯 번째 짐작이다. **못 박는 수도 재서 적는다 — 어림으로 적지 않는다.**
 * ⚠ 249 는 「괜찮다」가 아니라 **「오늘의 바닥」**이다. 줄이면 이 수도 같이 줄인다.
 * ⛔ 249 개를 지금 다 고치라는 자가 아니다 — **새로 짓는 자가 또 그러는 것**을 막는 자다.
 */
export const 못박은_흠수 = 249;

/** 관문 글귀 — 이 가운데 하나가 있으면 막아 둔 것으로 본다 */
export const 관문무늬 = [
  /import\.meta\.url\s*===\s*pathToFileURL\(/,
  /pathToFileURL\(process\.argv\[1\]\)\.href\s*===\s*import\.meta\.url/,
  /require\.main\s*===\s*module/,
];

/** 맨 바닥에서 «도는» 일로 볼 글귀 — 들여쓰기 없이 줄 맨 앞에 있는 것만 */
export const 도는일무늬 = [
  /^console\.(log|error|warn)\(/,
  /^await\s+fetch\(/,
  /^for\s*\(/,
  /^fs\.(readdirSync|readFileSync|writeFileSync)\(/,
  /^process\.exit\(/,
];

/**
 * 한 파일이 「내보낼 것이 있는데 관문 없이 도는 자」인가.
 * @returns {{흠:boolean, 까닭:string}|null} 글이 아니면 null
 */
export function 도나(글) {
  if (typeof 글 !== 'string') return null;
  if (!/^export\s/m.test(글)) return { 흠: false, 까닭: '내보내는 것이 없다 — 그냥 돌라고 지은 자다' };
  if (관문무늬.some((r) => r.test(글))) return { 흠: false, 까닭: '관문이 있다' };
  /* 자가시험 블록 바깥에서 맨 바닥에 도는 일이 있나 */
  const 줄들 = 글.split(/\r?\n/);
  let 시험안 = 0;
  for (const l of 줄들) {
    if (/^if\s*\(process\.argv\.includes\('--자가시험'\)/.test(l)) { 시험안 = 1; continue; }
    if (시험안 && /^\}/.test(l)) { 시험안 = 0; continue; }
    if (시험안) continue;
    if (도는일무늬.some((r) => r.test(l))) return { 흠: true, 까닭: `관문 없이 도는 줄: ${l.slice(0, 50)}` };
  }
  return { 흠: false, 까닭: '맨 바닥에서 도는 일이 안 보인다' };
}

/* ── 자가시험 ───────────────────────────────────────────────────────────── */
if (process.argv.includes('--자가시험')) {
  const 것 = []; const 다 = (이름, 참) => 것.push({ 이름, 참: !!참 });

  다('🔴 내보내는데 관문 없이 돌면 흠',
    도나("export const a = 1;\nconsole.log('돈다');").흠 === true);
  다('관문이 있으면 흠이 아니다',
    도나("export const a = 1;\nif (import.meta.url === pathToFileURL(process.argv[1]).href) {\nconsole.log('x');\n}").흠 === false);
  다('⛔ 내보내는 것이 없으면 안 본다',
    도나("console.log('수집기다');").흠 === false);
  다('자가시험 블록 안은 관문으로 친다',
    도나("export const a = 1;\nif (process.argv.includes('--자가시험')) {\nconsole.log('x');\n}").흠 === false);
  다('require.main 꼴도 관문으로 본다',
    도나("export const a=1;\nif (require.main === module) { }\nconsole.log('x');").흠 === false);
  다('들여쓴 줄은 맨 바닥이 아니다',
    도나("export const a = 1;\nfunction f() {\n  console.log('x');\n}").흠 === false);
  다('🔴 맨 바닥 fetch 도 잡는다',
    도나('export const a = 1;\nawait fetch("https://x");').흠 === true);
  다('⛔ 글이 아니면 null', 도나(null) === null);

  const 진 = 것.filter((x) => !x.참);
  console.log(`가져오면 도는 자 — 자체 점검 ${것.length - 진.length}/${것.length}`);
  for (const x of 진) console.log('   🔴 ' + x.이름);
  process.exit(진.length ? 1 : 0);
}

const { pathToFileURL } = await import('node:url');
const 직접불렸나 = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (!직접불렸나) {
  /* 가져다 쓰는 쪽이다 — 이 자부터 제 규칙을 지킨다 */
} else {

console.log('■ 내보낼 것이 있는데 «가져오면 돌아 버리는» 자가 있나');
console.log('   ⭐ 하루에 세 번 같은 흠을 내서 만들었다 — 기억에 맡기지 않는다');
console.log('   ⚠ 글자만 본다. 「진짜로 도는가」는 못 잰다 — 관문 글귀가 있나만 본다\n');

const 흠난것 = [];
let 본것 = 0;
for (const n of fs.readdirSync(볼방).filter((x) => x.endsWith('.mjs'))) {
  let 글;
  try { 글 = fs.readFileSync(path.join(볼방, n), 'utf8'); } catch { continue; }
  const 판 = 도나(글);
  if (판 == null) continue;
  본것 += 1;
  if (판.흠) 흠난것.push({ 이름: n, 까닭: 판.까닭 });
}

console.log(`  본 자 ${본것}개 · 흠 ${흠난것.length}개 (못 박은 수 ${못박은_흠수})`);
for (const x of 흠난것) console.log(`   🔴 ${x.이름}\n        ${x.까닭}`);

console.log('');
if (흠난것.length > 못박은_흠수) {
  console.log(`🔴 흠이 ${못박은_흠수} → ${흠난것.length} 로 늘었다 — 배포하지 않는다`);
  console.log('   ✅ 고치는 법 — 내보내는 것은 위에 두고, 도는 일은 아래 관문 안으로 넣는다');
  console.log("      const 직접불렸나 = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;");
  process.exit(1);
}
console.log(`✅ 늘지 않았다 (${흠난것.length} ≤ ${못박은_흠수})`);
}
