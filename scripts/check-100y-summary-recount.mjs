#!/usr/bin/env node
/**
 * 요약(summary.json)과 얇은 학과(pages-major-thin.json) **다시 세기**.
 *
 *   node scripts/check-100y-summary-recount.mjs
 *   node scripts/check-100y-summary-recount.mjs --자가시험
 *
 * ## 🔴 왜 만들었나 (8번 · 2026-08-14 05:5x)
 *
 *   대장에서 「⛔ 아직 원본과 값을 안 맞췄다」로 남아 있던 마지막 둘이다.
 *   summary 는 **세어 둔 수만 모아 놓은 파일**이라, 자료가 바뀌면 제일 먼저 낡는다.
 *   ⛔ 낡은 요약은 「아무도 안 보는 수」가 아니라 **회의에서 인용되는 수**다.
 *
 * ⚠ 이 자는 NEIS 가 맞나를 못 본다. 「우리 수가 우리 자료와 아귀가 맞나」만 본다.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const 방 = path.join(뿌리, 'src/data/100yearmap')
const 원본길 = path.join(뿌리, 'archive/raw/neis/school-info.json')

/** 학과마다 개설 학교 수를 세어, 「N개교 이상」이 몇 가지인지 센다 */
export function 문턱별갈래수(개설수들, 문턱) {
  return 개설수들.filter((n) => n >= 문턱).length
}

if (process.argv.includes('--자가시험')) {
  let 틀림 = 0
  const 본다 = (참, 말) => { if (!참) { console.error(`⛔ ${말}`); 틀림++ } }
  본다(문턱별갈래수([1, 2, 3], 2) === 2, '문턱 2를 잘못 센다')
  본다(문턱별갈래수([1, 2, 3], 1) === 3, '문턱 1을 잘못 센다')
  본다(문턱별갈래수([], 1) === 0, '빈 것을 0으로 안 센다')
  본다(문턱별갈래수([10], 10) === 1, '문턱과 같은 수를 안 센다(이상이다)')
  console.log(틀림 ? `⛔ 자가시험 ${틀림}건 실패` : '✅ 자가시험 4건 통과')
  process.exit(틀림 ? 1 : 0)
}

const 읽기 = (f) => JSON.parse(fs.readFileSync(path.join(방, f), 'utf8'))
const 요약 = 읽기('summary.json')
const 학교 = 읽기('pages-school.json')
const 학과 = 읽기('pages-major.json')
const 얇은 = 읽기('pages-major-thin.json')
const 원본줄 = JSON.parse(fs.readFileSync(원본길, 'utf8').replace(/^﻿/, '')).rows

let 같은칸 = 0
const 다른칸 = []
const 말할것 = []

const 학과별 = new Map()
for (const s of 학교) for (const a of s.학과 ?? []) 학과별.set(a.name, (학과별.get(a.name) ?? 0) + 1)
const 개설수들 = [...학과별.values()]

const 대상꼴 = (요약.기준?.TARGET_KINDS ?? []).map((k) => k.replace(/\*$/, ''))
const 대상학교줄 = 원본줄.filter((r) => 대상꼴.some((k) => String(r.SCHUL_KND_SC_NM ?? '').startsWith(k)))

const 잰것 = {
  전체학교: 원본줄.length,
  대상학교: 대상학교줄.length,
  학교페이지: 학교.length,
  학과페이지: 학과.length,
  총페이지: 학교.length + 학과.length,
  학과가_붙은_학교: 학교.filter((s) => (s.학과 ?? []).length > 0).length,
  학과가_없는_학교: 학교.filter((s) => (s.학과 ?? []).length === 0).length,
  독립페이지_안만든_학과: 얇은.length,
}
for (const [이름, 값] of Object.entries(잰것)) {
  if (요약[이름] === undefined) continue
  if (요약[이름] === 값) 같은칸++
  else 다른칸.push(`${이름} — 적힌 것 ${요약[이름]} · 다시 세니 ${값}`)
}

for (const [이름, 값] of Object.entries(요약.기준선별_학과페이지수 ?? {})) {
  const 문턱 = Number(String(이름).match(/(\d+)/)?.[1])
  const 다시 = 문턱별갈래수(개설수들, 문턱)
  if (값 === 다시) 같은칸++
  else 다른칸.push(`기준선별 「${이름}」 — 적힌 것 ${값} · 다시 세니 ${다시}`)
}

// 얇은 학과 — 개설 학교 수가 맞나, 그리고 정말 지면이 없나
let 얇은어긋남 = 0
for (const t of 얇은) {
  const 다시 = 학과별.get(t.title) ?? 0
  if (t.개설교수 === 다시) 같은칸++
  else { 얇은어긋남++; if (얇은어긋남 <= 3) 다른칸.push(`얇은 학과 ${t.title} 개설교수 — 적힌 것 ${t.개설교수} · 다시 세니 ${다시}`) }
  if (!학과.some((m) => m.title === t.title)) 같은칸++
  else 다른칸.push(`얇은 학과 ${t.title} — 얇다고 해 놓고 학과 지면이 서 있다`)
}
if (얇은어긋남 > 3) 다른칸.push(`얇은 학과 개설교수 — 그 밖에 ${얇은어긋남 - 3}가지 더 어긋난다`)

if (요약.대상학교 !== 요약.학교페이지) {
  말할것.push(`⬜ 대상학교 ${요약.대상학교} ≠ 학교페이지 ${요약.학교페이지} — ${요약.대상학교 - 요약.학교페이지}곳 차이는 NEIS 에 학교코드가 겹쳐 온 줄이다(먼저 나온 줄만 실었다)`)
}
if (요약.원천수집시각) 말할것.push(`⬜ 이 요약은 「${요약.원천수집시각}」에 받은 자료로 센 것이다 — 자료를 다시 받으면 여기 수도 다시 세야 한다`)

console.log(`\n── 요약 · 얇은 학과 ${얇은.length.toLocaleString()}가지 다시 세기`)
console.log(`\n맞춘 값 ${같은칸.toLocaleString()}개 · 다른 칸 ${다른칸.length}개`)
for (const d of 다른칸.slice(0, 15)) console.log(`  🔴 ${d}`)
if (다른칸.length > 15) console.log(`  … 그리고 ${다른칸.length - 15}개 더`)
for (const m of 말할것) console.log(`  ${m}`)
if (!다른칸.length) console.log('✅ 다시 세기 통과 — 요약과 얇은 학과가 자료와 아귀가 맞다')
process.exit(다른칸.length ? 1 : 0)
