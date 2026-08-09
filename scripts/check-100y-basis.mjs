#!/usr/bin/env node
/**
 * 🔒 **기준 자물쇠** — 「무엇에 대한 수인지」가 안 적힌 배수·비율을 막는다.
 *
 *   node scripts/check-100y-basis.mjs
 *   node scripts/check-100y-basis.mjs --자가시험
 *
 * ## 🔴 왜 만들었나 (2026-08-09 · 사장님 「자물쇠를 만드는 게 제일 중요」)
 *
 *   하루에 내 잘못이 다섯 났는데 **넷이 같은 병**이었다.
 *   숫자를 잘못 센 것이 하나도 없다. 전부 **「무엇에 대한 수인지」가 빠져** 있었다.
 *
 *   ```
 *   55.5%     분모가 달랐다 (졸업−진학−입대 ↔ 취업대상자)      → 진짜는 59.3%
 *   1.56배    기준이 없었다 (2~4명 대비인지 5~9명 대비인지)     → 공표와 견주면 1.49
 *   1.21배    기준이 잘못 읽혔다 (서울÷제주를 「전국 대비」로)    → 전국 대비는 1.048
 *   건보취업률 정의가 달랐다 (공표는 교내취업자를 포함한다)        → 학과마다 몇 %p
 *   ```
 *
 *   ⛔ 이 넷을 **사람이 네 번 잡았다.** 사람이 잡는 것은 다음에 또 놓친다.
 *   ✅ 그래서 자물쇠로 옮긴다 — **배수·비율에 기준이 없으면 아예 못 나가게** 한다.
 *
 * ## 무엇을 막나
 *
 *   ① 값이 숫자인데 이름이 「배수·프리미엄·몫·격차」 꼴 → **그 자리에 기준이 있어야** 한다
 *      (기준 = 「A ÷ B」·「A 대비」 처럼 **두 쪽을 다 말한 글**)
 *   ② 파일에 「…률/…율」 칸이 있으면 → 그 파일 어딘가에 **분모를 말한 글**이 있어야 한다
 *
 * ⚠ 넓게 잡으면 소음이 된다(오늘 그러다 「1~3등 업종 맞춤」에 울었다).
 *   그래서 ①은 **그 객체 안**만 보고, ②는 **파일당 한 번**만 본다.
 *
 * ⛔ 이 자는 숫자가 맞나를 못 본다. **기준이 적혀 있나**만 본다.
 */
import fs from 'node:fs';
import path from 'node:path';

/* ⚠ const 는 끌어올려지지 않는다. 자가시험보다 **위**에 둔다 —
   오늘 이걸 어겨서 여섯 자리의 npm test 를 몇 시간 빨갛게 했다 */

/** 기준이 반드시 있어야 하는 이름 꼴 */
export const 기준필요꼴 = /배수|프리미엄|몫$|격차/;

/** 분모를 말했다고 볼 수 있는 글인가 — 두 쪽을 다 말해야 한다 */
export function 기준을말했나(글) {
  if (typeof 글 !== 'string') return false;
  const s = 글.replace(/\s+/g, '');
  if (s.length < 4) return false;
  return /÷|나눈|대비|기준|당|\/(?!\/)/.test(s) && /[가-힣A-Za-z0-9]/.test(s);
}

/**
 * 이 객체(또는 파일 맨 위)에 그 이름의 기준이 적혀 있나.
 *
 * 🔴 처음엔 **그 객체 안만** 봤다. 그래서 `자료[]` 줄 안의 「서울배수」를 보면서
 *    파일 맨 위에 적어 둔 **「서울배수 기준」을 못 봤다** (2026-08-09 만들자마자 걸렸다).
 *    ⚠ 오늘 내가 두 번 겪은 「자가 딴 데를 본다」와 같은 자리다. 뿌리도 같이 본다.
 */
export function 기준이있나(객체, 이름, 뿌리) {
  const 한칸씩 = (o) => {
    if (!o || typeof o !== 'object') return false;
    for (const [k, v] of Object.entries(o)) {
      if (k === 이름) continue;
      const 이름칸 = k.includes(이름) || k.includes('기준') || k.includes('정의') || k.includes('읽는법');
      if (이름칸 && 기준을말했나(v)) return true;
      if (typeof v === 'string' && v.includes(이름) && 기준을말했나(v)) return true;
      /* 뿌리에서는 한 겹 더 들어간다 — 기준을 묶음 안에 적어 두는 일이 많다 */
      if (o === 뿌리 && v && typeof v === 'object' && !Array.isArray(v)) {
        for (const [k2, v2] of Object.entries(v)) {
          if (k2.includes(이름) && 기준을말했나(v2)) return true;
          if (typeof v2 === 'string' && v2.includes(이름) && 기준을말했나(v2)) return true;
        }
      }
    }
    return false;
  };
  return 한칸씩(객체) || (뿌리 && 뿌리 !== 객체 ? 한칸씩(뿌리) : false);
}

/**
 * 이 파일을 볼 것인가.
 * ⛔ `pages-*` 는 **지면 밑자료**(남의 원자료를 그대로 담은 것)라 안 본다 —
 *    「임금·임금격차」 같은 **연구 주제 이름**에 헛울었다(값 20 은 논문 수였다).
 */
export const 볼파일인가 = (이름) => !/^pages-/.test(이름);

/**
 * 「…률/…율」 칸 이름인가.
 * ⛔ 「비율」·「율」 한 낱말은 **무엇의 비율인지 자체가 없어** 여기서 안 본다 — ①이 잡을 자리다.
 */
export const 비율꼴 = (이름) =>
  typeof 이름 === 'string' && /[가-힣A-Za-z][률율]$/.test(이름) && !/^(비율|율|률)$/.test(이름);

/** 파일 전체에서 분모를 말한 글이 하나라도 있나 */
export function 파일이분모를말했나(자료) {
  let 있다 = false;
  const 훑기 = (o) => {
    if (있다) return;
    if (Array.isArray(o)) return o.forEach(훑기);
    if (!o || typeof o !== 'object') return;
    for (const [k, v] of Object.entries(o)) {
      if (typeof v === 'string' && /분모|÷|대비|나눈|취업대상자|가입자 ÷|정의/.test(v)) { 있다 = true; return; }
      if (/정의|분모/.test(k)) { 있다 = true; return; }
      훑기(v);
    }
  };
  훑기(자료);
  return 있다;
}

function 자가시험() {
  const 본보기 = [
    ['「배수」는 기준이 필요하다', () => 기준필요꼴.test('규모프리미엄') && 기준필요꼴.test('서울배수')],
    ['「인원」은 안 본다', () => 기준필요꼴.test('인원') === false],
    ['⭐ 「1~3등 업종 맞춤」에 안 운다', () => 기준필요꼴.test('1~3등 업종 맞춤') === false],
    ['「A ÷ B」는 기준이다', () => 기준을말했나('1000명+ ÷ 2~9명') === true],
    ['「전국 대비」도 기준이다', () => 기준을말했나('서울 ÷ 전국(사람가중)') === true],
    ['빈 글은 기준이 아니다', () => 기준을말했나('') === false],
    ['짧은 글은 기준이 아니다', () => 기준을말했나('배수') === false],
    ['글이 아니면 안 죽는다', () => 기준을말했나(null) === false],
    ['같은 객체에 기준이 있으면 통과', () =>
      기준이있나({ 서울배수: 1.17, '서울배수 기준': '서울 ÷ 그밖' }, '서울배수') === true],
    ['기준이 없으면 운다', () => 기준이있나({ 서울배수: 1.17 }, '서울배수') === false],
    ['이름만 있고 두 쪽을 안 말하면 운다', () =>
      기준이있나({ 서울배수: 1.17, '서울배수 기준': '큼' }, '서울배수') === false],
    ['「취업률」은 비율 꼴', () => 비율꼴('취업률') === true],
    ['⛔ 「비율」 한 낱말은 안 본다', () => 비율꼴('비율') === false],
    ['⭐ 같은 이름은 한 번만 운다', () => { const s = new Set(); s.add('a|b'); return s.has('a|b') }],
    ['⭐ 파일 맨 위 기준도 본다', () =>
      기준이있나({ 서울배수: 1.1 }, '서울배수', { '서울배수 기준': '서울 ÷ 그밖' }) === true],
    ['⛔ pages- 는 안 본다', () => 볼파일인가('pages-research.json') === false],
    ['우리 자료는 본다', () => 볼파일인가('work-map.json') === true],
    ['파일이 분모를 말했으면 통과', () =>
      파일이분모를말했나({ 정의: { 취업대상자: '졸업자 − 다섯 갈래' } }) === true],
    ['아무 데도 안 말했으면 운다', () => 파일이분모를말했나({ 자료: [{ 취업률: 70 }] }) === false],
  ];
  let 진 = 0;
  for (const [이름, 재기] of 본보기) {
    let 됐나 = false;
    let 까닭 = null;
    /* ⚠ 삼키지 않는다 — 터진 것과 틀린 것이 같아 보이면 남이 몇 시간을 헤맨다(오늘 겪었다) */
    try { 됐나 = 재기() === true; } catch (e) { 됐나 = false; 까닭 = e?.message ?? String(e); }
    if (!됐나) { console.log(`  ⛔ 자가시험 실패 — ${이름}${까닭 ? ` (터졌다: ${까닭})` : ''}`); 진++; }
  }
  console.log(`자가시험 ${본보기.length}개 · 실패 ${진}개`);
  return 진;
}

if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 1 : 0);
const 시험실패 = 자가시험();

/* ───────────────────── 자료를 훑는다 ───────────────────── */

const 여기 = path.resolve(
  path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'),
  '..',
);
const 자료방 = path.join(여기, 'src', 'data', '100yearmap');

const 운다 = [];
/* ⚠ 같은 이름이 여러 줄에 있으면 **한 번만** 운다. 96번 울면 아무도 안 읽는다(오늘 배웠다) */
const 이미운것 = new Set();
let 본파일 = 0;
let 본배수 = 0;

for (const f of fs.readdirSync(자료방).filter((x) => x.endsWith('.json') && 볼파일인가(x))) {
  let j;
  try { j = JSON.parse(fs.readFileSync(path.join(자료방, f), 'utf8')); } catch { continue; }
  본파일++;

  /* ① 배수·프리미엄·몫·격차 — 그 자리에 기준이 있어야 한다 */
  const 훑기 = (o) => {
    if (Array.isArray(o)) return o.forEach(훑기);
    if (!o || typeof o !== 'object') return;
    for (const [k, v] of Object.entries(o)) {
      if (typeof v === 'number' && 기준필요꼴.test(k)) {
        본배수++;
        const 열쇠 = `${f}|${k}`;
        if (!기준이있나(o, k, j) && !이미운것.has(열쇠)) {
          이미운것.add(열쇠);
          운다.push(`${f} — 「${k}」(보기 ${v}) 에 **기준이 없다**. 무엇 ÷ 무엇인지 적어라`);
        }
      } else 훑기(v);
    }
  };
  훑기(j);

  /* ② 「…률/…율」 칸이 있으면 파일 어딘가에 분모가 적혀 있어야 한다 */
  let 비율있나 = false;
  const 훑기2 = (o) => {
    if (비율있나) return;
    if (Array.isArray(o)) return o.forEach(훑기2);
    if (!o || typeof o !== 'object') return;
    for (const [k, v] of Object.entries(o)) {
      if (typeof v === 'number' && 비율꼴(k)) { 비율있나 = true; return; }
      훑기2(v);
    }
  };
  훑기2(j);
  if (비율있나 && !파일이분모를말했나(j)) {
    운다.push(`${f} — 「…률」 칸이 있는데 **분모를 말한 글이 하나도 없다**`);
  }
}

console.log(`자료 ${본파일}개 · 기준이 필요한 수 ${본배수}개를 봤다`);
if (운다.length === 0) {
  console.log('✅ 기준 없는 배수 0 · 분모 안 밝힌 파일 0');
  console.log('⚠ 이 자는 숫자가 맞나를 못 본다. **기준이 적혀 있나**만 본다');
  process.exit(시험실패 ? 1 : 0);
}
for (const x of 운다) console.log(`⛔ ${x}`);
console.log(`\n⛔ ${운다.length}건`);
process.exit(1);
