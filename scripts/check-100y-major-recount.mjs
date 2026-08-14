#!/usr/bin/env node
/**
 * 고교 학과 925개 **다시 세기** — `pages-major.json` 은 밖에서 받은 것이 아니라
 * `pages-school.json` 에서 **우리가 만든 것**이다. 그래서 옮김 검산이 아니라 **다시 세기**로 잰다.
 *
 *   node scripts/check-100y-major-recount.mjs
 *   node scripts/check-100y-major-recount.mjs --자가시험
 *
 * ## 🔴 왜 만들었나 (8번 · 2026-08-13)
 *
 *   오늘 고교 쪽에서 **세어 둔 수가 지면 수와 어긋난 것**을 봤다(경기 521 ↔ 지면 520).
 *   만든 값은 원본이 없으니 아무도 못 잡는다 — **다시 세는 수밖에 없다.**
 *   학과 지면 925장은 「전국 N곳」·「몇 위」를 그대로 싣는다. 틀리면 파는 지면이 틀린다.
 *
 * ⚠ 이 자는 NEIS 가 맞나를 못 본다. 「우리 학과 지면이 우리 학교 지면과 아귀가 맞나」만 본다.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const 방 = path.join(뿌리, 'src/data/100yearmap')

/** 많은 것부터 매긴 등수. ⚠ 같은 수는 **같은 등수**다(1,2,2,4 꼴) */
export function 등수매기기(수들) {
  const 내림 = [...수들].sort((a, b) => b - a)
  const 표 = new Map()
  내림.forEach((n, i) => { if (!표.has(n)) 표.set(n, i + 1) })
  return 표
}

if (process.argv.includes('--자가시험')) {
  let 틀림 = 0
  const 본다 = (참, 말) => { if (!참) { console.error(`⛔ ${말}`); 틀림++ } }
  const 표 = 등수매기기([10, 5, 5, 1])
  본다(표.get(10) === 1, '제일 많은 것이 1등이 아니다')
  본다(표.get(5) === 2, '같은 수가 같은 등수가 아니다')
  본다(표.get(1) === 4, '같은 등수 뒤가 밀리지 않는다(1,2,2,4 라야 한다)')
  본다(등수매기기([3]).get(3) === 1, '하나뿐일 때 1등이 아니다')
  console.log(틀림 ? `⛔ 자가시험 ${틀림}건 실패` : '✅ 자가시험 4건 통과')
  process.exit(틀림 ? 1 : 0)
}

const 읽기 = (f) => JSON.parse(fs.readFileSync(path.join(방, f), 'utf8'))
const 학교 = 읽기('pages-school.json')
const 학과 = 읽기('pages-major.json')

let 같은칸 = 0
const 다른칸 = []
const 말할것 = []

// 학교 지면에서 학과를 다시 모은다 — 이것이 「참」이다
const 학과별학교 = new Map()
for (const s of 학교) {
  for (const a of s.학과 ?? []) {
    if (!학과별학교.has(a.name)) 학과별학교.set(a.name, [])
    학과별학교.get(a.name).push(s)
  }
}
const 등수표 = 등수매기기([...학과별학교.values()].map((v) => v.length))

console.log(`\n── 학과 지면 ${학과.length}장 · 학교 지면에서 다시 모으니 학과 ${학과별학교.size}가지`)

for (const m of 학과) {
  // ⚠ 학교 지면이 하나도 없는 학과가 있다 — 「전공과」는 특수학교 7곳뿐이고 특수학교는 지면을 안 만든다.
  //    ⛔ 그것을 「지면만 서 있다」로 울리지 않는다. 학과 자체는 NEIS 에 실재한다.
  const 곳 = 학과별학교.get(m.title) ?? []
  if (!곳.length) 말할것.push(`⬜ ${m.title} — 이 학과를 단 학교가 ${(m.학교 ?? []).length}곳인데 **다 우리 지면이 없는 학교**다(특수학교 등). 이름만 나온다`)

  // 🔴 2026-08-14 정정 — 「전국 N곳」은 **NEIS 에 있는 학교 수**다. 우리 지면 수가 아니다.
  //    방송통신고처럼 지면을 안 만든 학교도 진짜 학교라 이 수에 든다.
  //    지면(major/[slug].astro)은 그런 학교를 **링크 없이 글자로만** 내므로 죽은 링크가 안 생긴다.
  //    ⛔ 그래서 「지면 수와 다르다」를 흠으로 울리지 않는다 — 그렇게 울렸다가 43장을 거짓 빨강으로 만들었다.
  //    대신 **지면에 실린 수(학교 목록 길이)와 적힌 수가 같은가**를 본다. 이것이 손님이 보는 것이다.
  const 실린수 = (m.학교 ?? []).length
  if (m.전국개설교수 === 실린수) 같은칸++
  else 다른칸.push(`${m.title} 전국개설교수 ${m.전국개설교수} — 지면에 늘어놓은 학교는 ${실린수}곳이다`)

  const 지면없는곳 = (m.학교 ?? []).filter((x) => !곳.some((s) => s.title === x.name)).length
  if (지면없는곳) 말할것.push(`⬜ ${m.title} — ${m.전국개설교수}곳 중 ${지면없는곳}곳은 우리 지면이 없는 학교다(글자로만 나온다)`)

  // 지역분포 합이 전국 수와 맞나 — 여기서 어긋나면 지면의 막대가 거짓이다
  // ⚠ 지역분포도 **적힌 전국 수**와 맞춰야 한다. 지면 수와 맞추면 방송통신고만큼 어긋난다(102장이 그렇게 떴다)
  const 분포합 = (m.지역분포 ?? []).reduce((s, x) => s + x.수, 0)
  if (분포합 === m.전국개설교수) 같은칸++
  else 다른칸.push(`${m.title} 지역분포 합 ${분포합} ≠ 적힌 전국 ${m.전국개설교수}`)

  // 최다지역이 정말 제일 많은 지역인가
  const 제일 = [...(m.지역분포 ?? [])].sort((a, b) => b.수 - a.수)[0]?.지역
  if (제일 === undefined || 제일 === m.최다지역) 같은칸++
  else 다른칸.push(`${m.title} 최다지역 — 적힌 것 ${m.최다지역} · 제일 많은 곳 ${제일}`)
}

const 지면없는학과 = [...학과별학교.keys()].filter((n) => !학과.some((m) => m.title === n))
if (지면없는학과.length) 말할것.push(`⬜ 학교는 달았는데 **지면이 없는 학과** ${지면없는학과.length}가지: ${지면없는학과.slice(0, 6).join(' · ')}${지면없는학과.length > 6 ? ' …' : ''}`)

console.log(`\n맞춘 값 ${같은칸.toLocaleString()}개 · 다른 칸 ${다른칸.length}개`)
for (const d of 다른칸.slice(0, Number(process.env.보일수 ?? 15))) console.log(`  🔴 ${d}`)
if (다른칸.length > 15) console.log(`  … 그리고 ${다른칸.length - 15}개 더`)
for (const m of 말할것) console.log(`  ${m}`)
if (!다른칸.length) console.log('✅ 다시 세기 통과 — 학과 지면이 학교 지면과 아귀가 맞다')
console.log('⚠ 이 자는 NEIS 가 맞나를 못 본다. **우리 안에서 아귀가 맞나**만 본다')
process.exit(다른칸.length ? 1 : 0)
