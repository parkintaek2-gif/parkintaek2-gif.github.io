#!/usr/bin/env node
/**
 * **출처를 적었으면 「언제 자료인가」도 적는다** — 백년지도 지면을 훑어 잰다.
 *
 *   node scripts/check-100y-asof.mjs
 *   node scripts/check-100y-asof.mjs --자가시험
 *
 * ## 🔴 왜 만들었나 (8번 · 2026-08-14 12:0x)
 *
 *   파는 지면(114벌)에 출처는 적혀 있는데 **받은 날이 없다.** 20갈래를 다 훑어도
 *   화면에 찍히는 날짜가 하나도 없었다(잡히는 「2026-08-…」은 전부 주석이다).
 *   ⛔ 낡은 수를 낡은 줄 모르고 읽는 것이 제일 위험하다 — 아침퀴즈 3번이 그것이다.
 *
 * ## ⚠ 이 자가 보는 것
 *
 *   · 지면 파일에 「출처」라고 화면에 찍는 자리가 있으면 → 같은 지면에 **날짜를 찍는 자리**가 있어야 한다
 *   · 주석(`//`, `/* *​/`)과 프런트매터 위쪽 설명은 **안 본다** — 거기 날짜가 있어도 손님은 못 본다
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const 지면방 = path.join(뿌리, 'src/pages/100y')

/** 주석을 걷어 낸다 — 손님이 보는 글자만 남긴다 */
export function 주석걷기(글) {
  return String(글)
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/^\s*\/\/.*$/gm, ' ')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
}

/** 날짜를 화면에 찍고 있나 — 글자든 값이든 */
export function 날짜를찍나(글) {
  if (/\d{4}-\d{2}-\d{2}/.test(글)) return true
  if (/\d{4}년\s*\d{1,2}월/.test(글)) return true
  return /기준일|기준시각|받은\s*날|수집시각|원천수집시각|공시연도|만든날|기준연도|해\b/.test(글)
}

export const 출처를찍나 = (글) => /출처/.test(글)

if (process.argv.includes('--자가시험')) {
  let 틀림 = 0
  const 본다 = (참, 말) => { if (!참) { console.error(`⛔ ${말}`); 틀림++ } }
  본다(주석걷기('/* 2026-08-04 */ 출처 — NEIS').includes('출처'), '주석만 걷어야 하는데 본문까지 지운다')
  본다(!날짜를찍나(주석걷기('/* 2026-08-04 */ 출처 — NEIS')), '⛔ 주석 안 날짜를 화면 날짜로 센다')
  본다(!날짜를찍나(주석걷기('// 2026-08-04 넣었다\n출처 — NEIS')), '⛔ 한 줄 주석 안 날짜를 센다')
  본다(날짜를찍나('출처 — NEIS (2026-08-04 기준)'), '진짜 날짜를 못 본다')
  본다(날짜를찍나('{자료.기준일}'), '값으로 찍는 기준일을 못 본다')
  본다(출처를찍나('출처 — NEIS') && !출처를찍나('그냥 글'), '출처 있는 지면을 못 가린다')
  console.log(틀림 ? `⛔ 자가시험 ${틀림}건 실패` : '✅ 자가시험 6건 통과')
  process.exit(틀림 ? 1 : 0)
}

const 지면들 = []
const 훑기 = (방) => {
  for (const f of fs.readdirSync(방)) {
    const 길 = path.join(방, f)
    if (fs.statSync(길).isDirectory()) 훑기(길)
    else if (/\.astro$/.test(f)) 지면들.push(길)
  }
}
훑기(지면방)

const 운다 = []
let 봤다 = 0
for (const 길 of 지면들) {
  const 본문 = 주석걷기(fs.readFileSync(길, 'utf8'))
  if (!출처를찍나(본문)) continue
  봤다++
  if (!날짜를찍나(본문)) 운다.push(path.relative(뿌리, 길))
}

console.log(`\n── 백년지도 지면 ${지면들.length}장 중 **출처를 찍는 지면 ${봤다}장**`)
console.log(`\n출처는 있는데 「언제 자료인가」가 없는 지면 ${운다.length}장`)
for (const f of 운다) console.log(`  🔴 ${f}`)
if (!운다.length) console.log('✅ 통과 — 출처를 적은 지면은 받은 날도 적고 있다')
console.log('⚠ 이 자는 **날짜가 맞나**를 못 본다. 「적고 있나」만 본다')
process.exit(운다.length ? 1 : 0)
