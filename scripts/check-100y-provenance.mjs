#!/usr/bin/env node
/**
 * 밑자료 **출처 대장**이 온전한가 — `src/data/100yearmap/_provenance.json` 을 잰다.
 *
 *   node scripts/check-100y-provenance.mjs
 *   node scripts/check-100y-provenance.mjs --자가시험   자가 시험만 돌린다
 *
 * ## 🔴 왜 만들었나 (2026-08-08 15:0x)
 *
 *   8번이 대장을 세웠고, 나는 **감수**를 맡았다(2번 지시 — 「3번은 감수만 하십시오」).
 *   감수는 눈으로 한 번 보는 것이 아니다. **다음에도 어긋나면 우는 자**를 놓고 가는 것이다.
 *
 *   대장은 이렇게 조용히 썩는다.
 *
 *   ```
 *   ① 새 자료를 받아 놓고 대장에 안 적는다        → 파는 지면에 출처 없는 숫자가 실린다
 *   ② 「파일 안에 출처가 있다」고 적어 두었는데 없다  → 대장만 믿고 확인을 건너뛴다
 *   ③ url 칸이 비어 있다                        → 왜 비었는지 모른다(못 채운 건가, 원래 없는 건가)
 *   ```
 *
 *   ⛔ ②를 **믿지 않고 파일을 연다.** 그게 감수다. 대장의 말을 자료로 확인한다.
 *
 * ## ⚠ url 이 없어도 되는 경우가 있다
 *
 *   `areas.json`·`summary.json` 은 **우리가 센 것**이다. 밖에서 받은 것이 아니라 url 이 없다.
 *   그때는 `url: null` 과 `url이없는까닭` 을 같이 적는다.
 *   ⛔ 칸을 그냥 비워 두지 않는다 — 비어 있으면 「못 채운 것」과 구별이 안 된다.
 */
import fs from 'node:fs';
import path from 'node:path';

const 여기 = path.resolve(
  path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'),
  '..',
);
const 자료방 = path.join(여기, 'src/data/100yearmap');
const 대장길 = path.join(자료방, '_provenance.json');

/** 파일 안에 출처가 적혀 있나. ⚠ 꼴이 여럿이라 **여러 자리를 본다** */
export function 출처가있나(값) {
  if (값 == null) return false;
  if (Array.isArray(값)) return 값.length > 0 && 값.some((x) => 출처가있나(x));
  if (typeof 값 !== 'object') return false;
  for (const 이름 of ['출처', 'source', '기관', '자료출처']) {
    const v = 값[이름];
    if (typeof v === 'string' && v.trim()) return true;
    if (v && typeof v === 'object' && Object.keys(v).length) return true;
  }
  return false;
}

/** 대장 한 칸이 온전한가. 온전하면 `null`, 아니면 까닭을 돌려준다 */
export function 칸을잰다(이름, 칸) {
  if (!칸 || typeof 칸 !== 'object') return `${이름} — 칸이 비었다`;
  if (!칸.무엇) return `${이름} — 「무엇」이 없다`;
  if (!칸.출처) return `${이름} — 「출처」가 없다`;
  if (칸.url === undefined) return `${이름} — url 칸이 아예 없다(없으면 null 과 까닭을 적는다)`;
  if (칸.url === null && !칸.url이없는까닭) return `${이름} — url 이 null 인데 까닭이 없다`;
  if (typeof 칸.url === 'string' && !/^https?:\/\//.test(칸.url)) return `${이름} — url 이 주소 꼴이 아니다`;
  return null;
}

/* ───────────────────────── 자가 시험 ───────────────────────── */
function 자가시험() {
  const 본보기 = [
    ['출처 글자', () => 출처가있나({ 출처: '국가데이터처' }) === true],
    ['출처 빈칸', () => 출처가있나({ 출처: '  ' }) === false],
    ['출처 없음', () => 출처가있나({ 무엇: 'x' }) === false],
    ['출처가 묶음', () => 출처가있나({ 출처: { 임금: 'a' } }) === true],
    ['출처가 빈 묶음', () => 출처가있나({ 출처: {} }) === false],
    ['배열 안에 하나라도', () => 출처가있나([{ a: 1 }, { 출처: 'x' }]) === true],
    ['빈 배열', () => 출처가있나([]) === false],
    ['null', () => 출처가있나(null) === false],
    ['기관으로도 인정', () => 출처가있나({ 기관: '고용노동부' }) === true],
    ['온전한 칸', () => 칸을잰다('a', { 무엇: 'x', 출처: 'y', url: 'https://a.b' }) === null],
    ['url 칸 없음', () => /url 칸이 아예 없다/.test(칸을잰다('a', { 무엇: 'x', 출처: 'y' }))],
    ['url null + 까닭', () => 칸을잰다('a', { 무엇: 'x', 출처: 'y', url: null, url이없는까닭: 'z' }) === null],
    ['url null + 까닭 없음', () => /까닭이 없다/.test(칸을잰다('a', { 무엇: 'x', 출처: 'y', url: null }))],
    ['주소 꼴이 아님', () => /주소 꼴/.test(칸을잰다('a', { 무엇: 'x', 출처: 'y', url: 'kosis.kr' }))],
    ['무엇 없음', () => /「무엇」/.test(칸을잰다('a', { 출처: 'y', url: null, url이없는까닭: 'z' }))],
  ];
  let 진 = 0;
  for (const [이름, 재기] of 본보기) {
    let 됐나 = false;
    try { 됐나 = 재기() === true; } catch { 됐나 = false; }
    if (!됐나) { console.log(`  ⛔ 자가시험 실패 — ${이름}`); 진++; }
  }
  console.log(`자가시험 ${본보기.length}개 · 실패 ${진}개`);
  return 진;
}

if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 1 : 0);

/* ⚠ 2026-08-10 13:1x — **곧바로 부를 때만 아래를 돈다.**
 *   그 전에는 `import` 만 해도 본문이 통째로 돌고 process.exit 까지 했다.
 *   그래서 다른 자가 이 자의 함수를 빌려 쓸 수 없었다(자끼리 견주려다 막혔다).
 *   ⛔ 곧바로 부르는 쪽 동작은 하나도 안 바뀐다. */
const { pathToFileURL: 길을주소로 } = await import('node:url');
if (!!process.argv[1] && import.meta.url === 길을주소로(process.argv[1]).href) {

const 시험실패 = 자가시험();

/* ───────────────────────── 진짜로 잰다 ───────────────────────── */
if (!fs.existsSync(대장길)) {
  console.log('⛔ 대장이 없다 — src/data/100yearmap/_provenance.json');
  process.exit(1);
}
const 대장 = JSON.parse(fs.readFileSync(대장길, 'utf8'));
const 적힌파일 = 대장.파일 ?? {};
const 안에있다함 = 대장.이미_파일_안에_출처가_있는_것 ?? [];

const 자료들 = fs
  .readdirSync(자료방)
  .filter((f) => f.endsWith('.json') && f !== '_provenance.json')
  .sort();

/* 🔴 0장이면 「통과」가 아니라 **못 잰 것**이다 */
if (자료들.length === 0) {
  console.log('⬜ 잰 파일 0개 — **재지 못했다.** 자료방을 확인하십시오');
  process.exit(2);
}

const 운다 = [];

/* ① 대장에 아예 없는 자료 */
const 대장에있는 = new Set([...Object.keys(적힌파일), ...안에있다함]);
for (const f of 자료들) if (!대장에있는.has(f)) 운다.push(`대장에 없다 — ${f}`);

/* ② 대장에는 있는데 파일이 없다 */
const 있는파일 = new Set(자료들);
for (const f of 대장에있는) if (!있는파일.has(f)) 운다.push(`파일이 없다 — ${f}`);

/* ③ 「파일」 칸이 온전한가 */
for (const [이름, 칸] of Object.entries(적힌파일)) {
  const 탈 = 칸을잰다(이름, 칸);
  if (탈) 운다.push(탈);
}

/* ④ 🔴 「파일 안에 출처가 있다」는 말을 **믿지 않고 열어 본다** */
let 열어본것 = 0;
for (const f of 안에있다함) {
  const p = path.join(자료방, f);
  if (!fs.existsSync(p)) continue; // ②에서 이미 울었다
  let 속 = null;
  try { 속 = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { 운다.push(`못 읽었다 — ${f} (${e.message})`); continue; }
  열어본것++;
  if (!출처가있나(속)) 운다.push(`대장은 「안에 출처가 있다」는데 **없다** — ${f}`);
}

console.log(`자료 ${자료들.length}개 · 대장에 적힌 것 ${대장에있는.size}개 · 열어서 확인한 것 ${열어본것}개`);
if (운다.length === 0) {
  console.log('✅ 출처 대장 온전하다 — 빠진 것 0');
  process.exit(시험실패 ? 1 : 0);
}
for (const x of 운다) console.log(`⛔ ${x}`);
console.log(`\n⛔ ${운다.length}건`);
process.exit(1);

} /* ── 곧바로부름 끝 ── */
