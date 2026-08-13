#!/usr/bin/env node
/**
 * 대학 377곳 **옮김 검산** — `src/data/100yearmap/pages-university.json` 이
 * 대학알리미 원본(archive/raw/alimi/notice-*.json)과 값까지 같은가.
 *
 *   node scripts/check-100y-university-transfer.mjs
 *   node scripts/check-100y-university-transfer.mjs --자가시험
 *
 * ## 🔴 왜 만들었나 (8번 · 2026-08-13)
 *
 *   대학 지면 377장은 **개봉날 손님이 실제로 여는 지면**이다. 그런데 오늘까지
 *   「값이 원본과 같은가」를 아무도 안 맞춰 봤다 — 대장에는 출처만 적혀 있었다.
 *   ⛔ 출처가 적혀 있는 것과 값이 맞는 것은 다른 말이다.
 *
 * ## ⚠ 이 자가 못 보는 것
 *
 *   · **대학알리미가 맞나**는 못 본다. 「우리가 그대로 옮겼나」만 본다
 *   · 「차이」는 우리가 뺀 값이라 원본에 없다 — 그래서 **우리 셈이 맞나**로 따로 잰다
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const 자료길 = path.join(뿌리, 'src/data/100yearmap/pages-university.json')
const 원본방 = path.join(뿌리, 'archive/raw/alimi')

export const 수 = (v) => (v === null || v === undefined || v === '' || v === '-' ? null : Number(String(v).trim()))

export function 같은수인가(a, b) {
  if (a === null || a === undefined || b === null || b === undefined) return a === b
  return a === b || Math.abs(a - b) <= Math.abs(a) * 1e-12
}

/** 차이 = 값 − 전국평균. ⚠ 소수 하나에서 끊는다(0.1 밑은 안 본다) */
export function 차이가맞나(값, 평균, 적힌차이) {
  if (값 === null || 평균 === null || 적힌차이 === null) return 적힌차이 === null
  return Math.abs(Number((값 - 평균).toFixed(1)) - 적힌차이) < 1e-9
}

if (process.argv.includes('--자가시험')) {
  let 틀림 = 0
  const 본다 = (참, 말) => { if (!참) { console.error(`⛔ ${말}`); 틀림++ } }
  본다(수('  83.5') === 83.5, '앞에 빈칸이 붙은 수를 못 읽는다')
  본다(수('') === null && 수('-') === null, '빈칸을 0 으로 만든다')
  본다(!같은수인가(null, 0), '⛔ 빈칸과 0 을 같다고 한다')
  본다(같은수인가(60.1, 60.1), '같은 수를 다르다고 한다')
  본다(차이가맞나(60.1, 62.8, -2.7), '차이 셈을 틀렸다고 한다')
  본다(!차이가맞나(60.1, 62.8, -2.6), '틀린 차이를 맞다고 한다')
  본다(차이가맞나(96.5, 111.4, -14.9), '두 자리 차이를 틀렸다고 한다')
  console.log(틀림 ? `⛔ 자가시험 ${틀림}건 실패` : '✅ 자가시험 7건 통과')
  process.exit(틀림 ? 1 : 0)
}

const 읽기 = (f) => JSON.parse(fs.readFileSync(path.join(원본방, f), 'utf8'))
const 대학 = JSON.parse(fs.readFileSync(자료길, 'utf8'))

// 어느 원본이 어느 칸을 대는가 — 대학알리미가 파일 안에 「뜻」으로 적어 두었다
const 짝 = [
  { 파일: 'notice-employment.json', 비율: '취업률', 낱값: { indctVal1: '졸업자', indctVal2: '취업자', indctVal3: '취업대상자' } },
  { 파일: 'notice-wastage.json', 비율: '중도탈락률', 낱값: { indctVal1: '재적학생', indctVal2: '중도탈락자' } },
  { 파일: 'notice-freshman.json', 비율: '신입생충원율', 낱값: {} },
  { 파일: 'notice-enrolled.json', 비율: '재학생충원율', 낱값: {} },
  { 파일: 'notice-faculty.json', 비율: '전임교원확보율', 낱값: {} },
]

let 같은칸 = 0
const 다른칸 = []
const 말할것 = []
const 빈칸 = {}

console.log(`\n── 대학알리미 — 우리 ${대학.length}곳`)

for (const { 파일, 비율, 낱값 } of 짝) {
  const 원본 = 읽기(파일)
  const 줄 = 원본.rows
  const 찾기 = new Map(줄.map((r) => [String(r.schlId), r.items?.[0] ?? null]))
  console.log(`   ${파일} — ${원본.이름} · ${줄.length}곳`)

  for (const u of 대학) {
    const it = 찾기.get(String(u.schlId))
    if (!it) {
      if (u[비율]) 다른칸.push(`${u.표시명}(${u.schlId}) ${비율} — 원본에 그 학교가 없다`)
      continue
    }
    const 우리 = u[비율]
    if (!우리) { (빈칸[비율] ??= []).push(u.표시명); continue }

    const 원값 = 수(it.indctVal4)
    const 원평균 = 수(it.indctAvg)
    if (같은수인가(원값, 우리.값)) 같은칸++
    else 다른칸.push(`${u.표시명} ${비율} 값 — 우리 ${우리.값} · 원본 ${원값}`)
    if (같은수인가(원평균, 우리.전국평균)) 같은칸++
    else 다른칸.push(`${u.표시명} ${비율} 전국평균 — 우리 ${우리.전국평균} · 원본 ${원평균}`)
    // 「차이」는 원본에 없다. 우리가 뺀 값이라 **셈이 맞나**로 잰다
    if (차이가맞나(원값, 원평균, 우리.차이 ?? null)) 같은칸++
    else 다른칸.push(`${u.표시명} ${비율} 차이 — 적힌 것 ${우리.차이} · 값−평균 ${Number((원값 - 원평균).toFixed(1))}`)

    for (const [키, 우리이름] of Object.entries(낱값)) {
      if (u[우리이름] === undefined) continue
      const 원낱 = 수(it[키])
      if (같은수인가(원낱, u[우리이름])) 같은칸++
      else 다른칸.push(`${u.표시명} ${우리이름} — 우리 ${u[우리이름]} · 원본 ${원낱}`)
    }
  }
}

for (const [비율, 곳] of Object.entries(빈칸)) {
  말할것.push(`⬜ ${비율} — 우리 자료에 아예 없는 곳 ${곳.length}곳${곳.length <= 5 ? `: ${곳.join(' · ')}` : ` (앞 5곳: ${곳.slice(0, 5).join(' · ')})`}`)
}

console.log(`\n맞춘 값 ${같은칸.toLocaleString()}개 · 다른 칸 ${다른칸.length}개`)
for (const d of 다른칸.slice(0, 20)) console.log(`  🔴 ${d}`)
if (다른칸.length > 20) console.log(`  … 그리고 ${다른칸.length - 20}개 더`)
for (const m of 말할것) console.log(`  ${m}`)
if (!다른칸.length) console.log('✅ 옮김 검산 통과 — 대학 지면 값이 대학알리미 원본과 같다')
console.log('⚠ 이 자는 대학알리미가 맞나를 못 본다. **우리가 그대로 옮겼나**만 본다')
process.exit(다른칸.length ? 1 : 0)
