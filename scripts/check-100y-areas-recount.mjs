#!/usr/bin/env node
/**
 * 파는 단위(시·군·구) **다시 세기** — `areas.json` 은 우리가 센 것이라 원본이 없다.
 *
 *   node scripts/check-100y-areas-recount.mjs
 *   node scripts/check-100y-areas-recount.mjs --자가시험
 *
 * ## 🔴 왜 만들었나 (8번 · 2026-08-13)
 *
 *   `areas.json` 은 **파는 단위**다 — 114벌이 여기서 나온다. 값이 틀리면 파는 물건이 틀린다.
 *   ⛔ 그런데 이 파일은 밖에서 받은 것이 아니라 우리가 센 것이라 **맞춰 볼 원본이 없다.**
 *   그래서 학교 지면에서 **다시 센다.**
 *
 * ## ⚠ 다시 셀 때 반드시 지킬 것 — 자를 새로 만들지 않는다
 *
 *   가르는 규칙은 `src/lib/school-area.ts` **한 곳**에 있다. 자가 그 함수를 **그대로 불러 쓴다.**
 *   내가 규칙을 흉내 내어 다시 짜면 자가 틀리고, 멀쩡한 자료가 빨강으로 뜬다.
 *   🔴 오늘 그 잘못을 세 번 했다(주소 두 칸 · 교육청 칸 · 학과 세는 법). 여기서는 아예 불러 쓴다.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const 방 = path.join(뿌리, 'src/data/100yearmap')
const { 지역가르기, 열쇠만들기, 한벌로팔만한가, 한벌최소 } = await import(
  new URL('../src/lib/school-area.ts', import.meta.url).href
)

if (process.argv.includes('--자가시험')) {
  let 틀림 = 0
  const 본다 = (참, 말) => { if (!참) { console.error(`⛔ ${말}`); 틀림++ } }
  본다(지역가르기('서울특별시 노원구 상계로 1') !== null, '멀쩡한 주소를 못 가른다')
  본다(지역가르기('') === null && 지역가르기(null) === null, '빈 주소를 가른다고 한다')
  본다(열쇠만들기('서울특별시', '노원구') === '서울특별시 노원구', '열쇠를 잘못 만든다')
  본다(한벌로팔만한가(한벌최소) === true, `${한벌최소}곳이면 한 벌인데 아니라고 한다`)
  본다(한벌로팔만한가(한벌최소 - 1) === false, `${한벌최소 - 1}곳인데 한 벌이라고 한다`)
  본다(한벌로팔만한가(NaN) === false, '알 수 없는 수를 한 벌이라고 한다')
  console.log(틀림 ? `⛔ 자가시험 ${틀림}건 실패` : '✅ 자가시험 6건 통과')
  process.exit(틀림 ? 1 : 0)
}

const 읽기 = (f) => JSON.parse(fs.readFileSync(path.join(방, f), 'utf8'))
const 학교 = 읽기('pages-school.json')
const 자료 = 읽기('areas.json')

const 셈 = new Map()
let 못가른학교 = 0
for (const s of 학교) {
  const g = 지역가르기(s.주소)
  if (!g) { 못가른학교++; continue }
  const 열쇠 = 열쇠만들기(g.시도, g.이름)
  셈.set(열쇠, (셈.get(열쇠) ?? 0) + 1)
}

let 같은칸 = 0
const 다른칸 = []
const 적힘 = new Map(자료.단위.map((u) => [u.열쇠, u]))

for (const [열쇠, 곳] of 셈) {
  const u = 적힘.get(열쇠)
  if (!u) { 다른칸.push(`${열쇠} — 학교를 ${곳}곳 가졌는데 단위 목록에 없다`); continue }
  if (u.곳 === 곳) 같은칸++
  else 다른칸.push(`${열쇠} 곳 — 적힌 것 ${u.곳} · 다시 세니 ${곳}`)
  if (u.한벌로팔만한가 === 한벌로팔만한가(곳)) 같은칸++
  else 다른칸.push(`${열쇠} 한벌로팔만한가 — 적힌 것 ${u.한벌로팔만한가} · ${곳}곳이면 ${한벌로팔만한가(곳)}`)
}
for (const 열쇠 of 적힘.keys()) if (!셈.has(열쇠)) 다른칸.push(`${열쇠} — 목록에 있는데 학교 지면에서 다시 세니 0곳이다`)

const 잰것 = { 단위: 셈.size, 한벌: [...셈.values()].filter((n) => 한벌로팔만한가(n)).length, 못가른학교, 학교: 학교.length }
for (const [이름, 값] of Object.entries(잰것)) {
  if (자료.전체[이름] === 값) 같은칸++
  else 다른칸.push(`전체.${이름} — 적힌 것 ${자료.전체[이름]} · 다시 세니 ${값}`)
}
const 무료 = 셈.size - 잰것.한벌
if (자료.전체.무료 === undefined || 자료.전체.무료 === 무료) 같은칸++
else 다른칸.push(`전체.무료 — 적힌 것 ${자료.전체.무료} · 단위 ${셈.size} − 한벌 ${잰것.한벌} = ${무료}`)

console.log(`\n── 파는 단위 — 학교 ${학교.length.toLocaleString()}곳에서 다시 셈 · 단위 ${셈.size} · 한 벌 ${잰것.한벌} · 못 가른 학교 ${못가른학교}`)
console.log(`\n맞춘 값 ${같은칸.toLocaleString()}개 · 다른 칸 ${다른칸.length}개`)
for (const d of 다른칸.slice(0, 15)) console.log(`  🔴 ${d}`)
if (다른칸.length > 15) console.log(`  … 그리고 ${다른칸.length - 15}개 더`)
if (!다른칸.length) console.log('✅ 다시 세기 통과 — 파는 단위가 학교 지면과 아귀가 맞다')
console.log('⚠ 이 자는 「몇 곳인가」만 본다. 그 단위가 **팔릴 만한가**는 못 본다')
process.exit(다른칸.length ? 1 : 0)
