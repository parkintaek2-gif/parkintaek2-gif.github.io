#!/usr/bin/env node
/**
 * check-kcw-object-leak.mjs — **손님 화면에 「[object Object]」 같은 것이 나가나**를 본다.
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 2026-08-22. 자료의 `method`·`limitation` 을 지면 열다섯 장에 붙인 직후,
 * `/wave-and-floor` 화면에 **「[object Object]」** 가 나갔다. 두 파일이 `method` 를
 * **객체**로 들고 있었는데 나는 전부 문자열이라 짐작하고 `String(...)` 을 씌웠다.
 *
 * ⭐ `check-visitor-walk` 가 그 한 장을 잡아 줬다. 그런데 그 자는 **한 무늬만** 본다.
 *   같은 병은 `undefined`·`NaN`·`[object Object]`·`Invalid Date` 로도 나온다.
 *   ⛔ 사람이 눈으로 찾는 구조를 남기지 않는다 — 무늬를 다 세는 자를 둔다.
 *
 * ── 무엇을 보나 ───────────────────────────────────────────────
 * 나간 지면(`dist/wikitip/**.html`)에서 **화면에 보이는 글자**만 본다.
 * ⛔ `<script>`·`<style>`·주석 안은 안 본다 — 거기 있는 `undefined` 는 코드다.
 * ⚠ 빌드가 도는 중이면 파일이 없거나 반쪽이다. 그때는 **「못 쟀다」**로 넘어간다(exit 0).
 *
 * 쓰는 법  node scripts/check-kcw-object-leak.mjs --자가시험
 *          node scripts/check-kcw-object-leak.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 볼방 = path.join(뿌리, 'dist/wikitip');
const 첫화면 = path.join(뿌리, 'dist/wikitip.html');

/** 화면에 보이는 글자만 남긴다 */
export function 보이는글자(html) {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    /* ⚠ 딱지(속성) 안의 값은 화면 글자가 아니다. 태그를 통째로 지운다 */
    .replace(/<[^>]+>/g, ' ');
}

/**
 * 새면 안 되는 무늬. ⭐ 하나만 보면 나머지가 조용히 나간다 — 겪은 것을 다 넣는다.
 * ⚠ `undefined` 는 영어 본문에 쓸 수 있는 낱말이 아니다(우리 글에서 쓴 적 없다).
 *   그래도 낱말 경계를 둔다 — `undefinedX` 같은 남의 낱말에 안 걸리게.
 */
export const 무늬들 = [
  { 이름: '[object Object]', 자: /\[object Object\]/g },
  { 이름: 'undefined', 자: /(^|[^A-Za-z])undefined([^A-Za-z]|$)/g },
  { 이름: 'NaN', 자: /(^|[^A-Za-z])NaN([^A-Za-z]|$)/g },
  { 이름: 'Invalid Date', 자: /Invalid Date/g },
  /**
   * 🔴🔴 `null` 을 무늬에 넣었더니 **거짓 빨강 5건**이 나왔다. 걸린 문장은 이랬다 —
   *   「The cell in our data file is **null**, not 0, because those are different facts.」
   *   그건 새어 나온 값이 아니라 **우리가 일부러 쓴 글**이다. 「0 으로 안 채운다」는 우리 규칙을
   *   손님에게 설명하는 자리고, 그 자리에서 `null` 은 낱말로 쓰인다.
   * ⭐ 그래서 `null` 은 세지 않는다. 자가 옳은 글을 빨갛게 만들면, 다음 사람이 그 글을 지운다 —
   *   자가 우리 글을 나쁘게 만드는 쪽으로 힘을 쓰게 되는 것이 가장 나쁜 결과다.
   * ⚠ 그러니 이 자는 **`null` 이 새는 것은 못 잡는다.** 못 잡는다고 여기 적어 둔다.
   */
];

/** 한 장에서 새는 무늬를 센다 */
export function 한장검사(html) {
  const 글 = 보이는글자(html);
  const 걸림 = [];
  for (const m of 무늬들) {
    const n = (글.match(m.자) ?? []).length;
    if (n > 0) 걸림.push({ 이름: m.이름, 수: n });
  }
  return 걸림;
}

if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  검('객체가 새면 잡는다', 한장검사('<p>[object Object]</p>').some((x) => x.이름 === '[object Object]'));
  검('undefined 가 새면 잡는다', 한장검사('<p>who: undefined</p>').some((x) => x.이름 === 'undefined'));
  검('NaN 이 새면 잡는다', 한장검사('<td>NaN</td>').some((x) => x.이름 === 'NaN'));
  검('Invalid Date 를 잡는다', 한장검사('<p>Invalid Date</p>').some((x) => x.이름 === 'Invalid Date'));
  /* 🔴 이 칸이 뒤집혔다 — 우리 글이 «null, not 0» 을 일부러 쓴다. 그 글을 빨갛게 만들면 안 된다 */
  검('⭐⭐ 일부러 쓴 «null, not 0» 문장을 안 잡는다',
    한장검사('<p>The cell in our data file is null, not 0, because those are different facts.</p>').length === 0);
  검('멀쩡한 지면은 안 잡는다', 한장검사('<h1>Korean titles</h1><p>Nine of thirteen.</p>').length === 0);
  /* ⛔ 코드 안의 것은 화면 글자가 아니다. 그것까지 잡으면 자가 못 쓰게 된다 */
  검('⛔ script 안의 undefined 는 안 잡는다',
    한장검사('<script>let a = undefined;</script><p>ok</p>').length === 0);
  검('⛔ style 안의 것도 안 잡는다', 한장검사('<style>.a{color:null}</style><p>ok</p>').length === 0);
  검('⛔ 주석 안의 것도 안 잡는다', 한장검사('<!-- undefined -->\n<p>ok</p>').length === 0);
  검('⛔ 속성 안의 것도 안 잡는다', 한장검사('<a href="/x?v=undefined">ok</a>').length === 0);
  /* ⚠ 남의 낱말에 안 걸려야 한다 — 「nullify」·「undefinedness」는 영어 낱말이다 */
  검('⛔ nullify 도 안 잡는다(null 은 세지 않는다)', 한장검사('<p>we nullify nothing</p>').length === 0);
  검('여러 무늬를 한 번에 센다', 한장검사('<p>[object Object] and NaN</p>').length === 2);
  검('같은 무늬가 두 번이면 두 번 센다',
    한장검사('<p>NaN</p><p>NaN</p>').find((x) => x.이름 === 'NaN').수 === 2);

  if (실패.length) { console.error('❌ 자가시험 실패\n' + 실패.map((s) => `   · ${s}`).join('\n')); process.exit(1); }
  console.log('✅ check-kcw-object-leak 자가시험 통과 (13)');
  process.exit(0);
}

if (!fs.existsSync(볼방)) {
  console.log('⚠ 못 쟀다 — dist/wikitip 이 없다. 먼저 빌드한다');
  process.exit(0);
}

/** 방을 훑는다 */
function 훑기(방) {
  const 낱 = [];
  for (const e of fs.readdirSync(방, { withFileTypes: true })) {
    const 길 = path.join(방, e.name);
    if (e.isDirectory()) 낱.push(...훑기(길));
    else if (e.name.endsWith('.html')) 낱.push(길);
  }
  return 낱;
}

const 장들 = 훑기(볼방);
if (fs.existsSync(첫화면)) 장들.push(첫화면);

const 걸린것 = [];
let 사라진수 = 0;
for (const 길 of 장들) {
  let html;
  try { html = fs.readFileSync(길, 'utf8'); } catch { 사라진수++; continue; }
  const 걸림 = 한장검사(html);
  if (걸림.length) 걸린것.push({ 길: path.relative(뿌리, 길), 걸림 });
}

/* ⚠ 여섯 자리가 같은 dist 를 쓴다. 빌드가 도는 중이면 파일이 사라진다 —
   그때 「깨끗하다」고 말하면 거짓 초록이 된다 */
if (사라진수 > 0 && 사라진수 > 장들.length * 0.05) {
  console.log(`⚠ 못 쟀다 — 읽는 중에 ${사라진수}장이 사라졌다(다른 자리가 빌드 중이다)`);
  process.exit(0);
}

console.log(`새는 값 검사 — 나간 지면 ${장들.length}장${사라진수 ? ` (읽다 사라진 것 ${사라진수}장)` : ''}`);
if (걸린것.length) {
  console.log(`❌ ${걸린것.length}장에 화면으로 나가면 안 되는 값이 나간다`);
  for (const x of 걸린것.slice(0, 20)) {
    console.log(`   · ${x.길} — ${x.걸림.map((g) => `${g.이름} ${g.수}번`).join(' · ')}`);
  }
  if (걸린것.length > 20) console.log(`   … 그리고 ${걸린것.length - 20}장 더`);
  console.log('   ⭐ 자료의 꼴을 짐작하지 말고, 못 읽는 꼴이면 아예 안 낸다.');
  process.exit(1);
}
console.log('✅ 화면에 [object Object]·undefined·NaN·Invalid Date 가 나가지 않는다');
