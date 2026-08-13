#!/usr/bin/env node
/**
 * 초등학교 6,328곳 **옮김 검산 + 다시 세기** — `elementary.json` ↔ NEIS `school-info.json`.
 *
 *   node scripts/check-100y-elementary-transfer.mjs
 *   node scripts/check-100y-elementary-transfer.mjs --자가시험
 *
 * ## 🔴 왜 만들었나 (8번 · 2026-08-14 04:5x)
 *
 *   대장에 「⛔ 아직 원본과 값을 안 맞췄다」로 남아 있던 넷 중 하나다.
 *   이 파일은 사장님 0시 지시(0세~100세)로 생긴 축의 밑자료라 **지면이 여기서 난다.**
 *
 * ⚠ 가르는 규칙(`src/lib/school-area.ts`)과 한 벌 기준은 **불러 쓴다.** 흉내 내지 않는다.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const 방 = path.join(뿌리, 'src/data/100yearmap')
const 원본길 = path.join(뿌리, 'archive/raw/neis/school-info.json')
const { 지역가르기, 열쇠만들기, 한벌로팔만한가 } = await import(new URL('../src/lib/school-area.ts', import.meta.url).href)

export const 다듬 = (v) => {
  if (v === null || v === undefined) return null
  const s = String(v).replace(/\s+/g, ' ').trim()
  return s === '' ? null : s
}
export const 같은글자인가 = (a, b) => 다듬(a) === 다듬(b)
/** 설립연 = 설립일(YYYYMMDD) 앞 네 자리 */
export const 설립연뽑기 = (ymd) => {
  const m = String(ymd ?? '').match(/^(\d{4})/)
  return m ? Number(m[1]) : null
}

if (process.argv.includes('--자가시험')) {
  let 틀림 = 0
  const 본다 = (참, 말) => { if (!참) { console.error(`⛔ ${말}`); 틀림++ } }
  본다(설립연뽑기('18820101') === 1882, '설립연을 못 뽑는다')
  본다(설립연뽑기('') === null && 설립연뽑기(null) === null, '빈 설립일을 0 으로 만든다')
  본다(같은글자인가('가  나', '가 나'), '빈칸 두 개로 다르다고 한다')
  본다(!같은글자인가('가', null), '값과 빈 것을 같다고 한다')
  본다(한벌로팔만한가(10) && !한벌로팔만한가(9), '한 벌 기준을 잘못 쓴다')
  console.log(틀림 ? `⛔ 자가시험 ${틀림}건 실패` : '✅ 자가시험 5건 통과')
  process.exit(틀림 ? 1 : 0)
}

const 자료 = JSON.parse(fs.readFileSync(path.join(방, 'elementary.json'), 'utf8'))
const 원본줄 = JSON.parse(fs.readFileSync(원본길, 'utf8').replace(/^﻿/, '')).rows
const 찾기 = new Map()
for (const r of 원본줄) {
  const 코드 = String(r.SD_SCHUL_CODE ?? '').trim()
  if (코드 && !찾기.has(코드)) 찾기.set(코드, r)
}

let 같은칸 = 0
const 다른칸 = []
const 말할것 = []
// ⚠ 시도는 원본 칸(LCTN_SC_NM)을 그대로 쓰지 않는다 — 「전남광주통합특별시(광주)」처럼 꼬리가 붙어 온다.
//    우리 파일은 **주소를 가른 뒤의 시도**를 쓴다. 그래서 아래에서 지역가르기로 견준다.
const 짝 = { title: 'SCHUL_NM', titleEn: 'ENG_SCHUL_NM', 설립: 'FOND_SC_NM', 공학: 'COEDU_SC_NM', 홈페이지: 'HMPG_ADRES' }
// ⚠ 고교 파일(pages-school)은 도로명+상세를 붙여 두었지만 **초등 파일은 도로명만** 담는다.
//    파일마다 담는 법이 다르다 — 자를 하나로 돌려 쓰면 6,700칸이 거짓 빨강으로 뜬다(그렇게 떴다).
const 주소붙이기 = (r) => String(r.ORG_RDNMA ?? '').trim()

console.log(`\n── 초등 — 우리 ${자료.자료.length.toLocaleString()}곳 · NEIS 원본 ${원본줄.length.toLocaleString()}곳(초·중·고 전부)`)

for (const s of 자료.자료) {
  const r = 찾기.get(String(s.code))
  if (!r) { 다른칸.push(`${s.title}(${s.code}) — 원본에 없다`); continue }
  for (const [우리, 원] of Object.entries(짝)) {
    if (같은글자인가(s[우리], r[원])) 같은칸++
    else 다른칸.push(`${s.title} ${우리} — 우리 ${JSON.stringify(s[우리])} · 원본 ${JSON.stringify(다듬(r[원]))}`)
  }
  if (같은글자인가(s.주소, 주소붙이기(r))) 같은칸++
  else 다른칸.push(`${s.title} 주소 — 우리 ${JSON.stringify(s.주소)} · 원본 ${JSON.stringify(주소붙이기(r))}`)
  if (s.설립연 === 설립연뽑기(r.FOND_YMD)) 같은칸++
  else 다른칸.push(`${s.title} 설립연 — 우리 ${s.설립연} · 원본 ${설립연뽑기(r.FOND_YMD)}`)
  const g = 지역가르기(s.주소)
  const 열쇠 = g ? 열쇠만들기(g.시도, g.이름) : null
  if (s.열쇠 === 열쇠) 같은칸++
  else 다른칸.push(`${s.title} 열쇠 — 적힌 것 ${s.열쇠} · 다시 가르니 ${열쇠}`)
  if (String(r.SCHUL_KND_SC_NM).trim() === '초등학교') 같은칸++
  else 다른칸.push(`${s.title} — 원본에서는 초등학교가 아니다(${r.SCHUL_KND_SC_NM})`)
}

// 세어 둔 수를 다시 센다
// ⚠ 「전체」는 **행 수**다. 학교 수가 아니다 — NEIS 초등 행 6,341개 중 **학교코드가 빈 행이 8개** 있어
//    학교로는 6,333곳이다. 둘 다 맞는 수인데 이름이 「전체」뿐이라 헷갈린다. 차이는 아래에서 화면에 적는다.
const 원본초등행 = 원본줄.filter((r) => String(r.SCHUL_KND_SC_NM).trim() === '초등학교')
const 원본초등 = 원본초등행.filter((r) => String(r.SD_SCHUL_CODE ?? '').trim())
const 잰것 = {
  전체: 원본초등행.length,
  낸곳: 자료.자료.length,
  지역수: new Set(자료.자료.map((s) => s.열쇠)).size,
  백년넘은곳수: 자료.자료.filter((s) => s.설립연 && 자료.올해 - s.설립연 >= 100).length,
}
const 지역곳 = new Map()
for (const s of 자료.자료) 지역곳.set(s.열쇠, (지역곳.get(s.열쇠) ?? 0) + 1)
잰것.한벌될곳수 = [...지역곳.values()].filter((n) => 한벌로팔만한가(n)).length

for (const [이름, 값] of Object.entries(잰것)) {
  if (자료[이름] === 값) 같은칸++
  else 다른칸.push(`${이름} — 적힌 것 ${자료[이름]} · 다시 세니 ${값}`)
}
for (const u of 자료.지역 ?? []) {
  const 다시 = 지역곳.get(u.열쇠) ?? 0
  if (u.곳 === 다시) 같은칸++
  else 다른칸.push(`지역 ${u.열쇠} 곳 — 적힌 것 ${u.곳} · 다시 세니 ${다시}`)
}
const 가장 = [...자료.자료].filter((s) => s.설립연).sort((a, b) => a.설립연 - b.설립연)[0]
if (자료.가장오래된?.[0]?.title === 가장?.title) 같은칸++
else 다른칸.push(`가장오래된 — 적힌 것 ${자료.가장오래된?.[0]?.title} · 다시 고르니 ${가장?.title}`)

if (원본초등행.length !== 원본초등.length) {
  말할것.push(`⬜ 「전체 ${원본초등행.length}」는 **행 수**다 — 학교코드가 빈 행 ${원본초등행.length - 원본초등.length}개가 들어 있어 **학교로는 ${원본초등.length}곳**이다. 파일이 어느 쪽인지 안 밝히고 있다`)
}

const 안엶 = (자료['⛔ 아직 문 안 연 곳']?.곳 ?? []).length
if (안엶) 말할것.push(`⬜ 아직 문 안 연 곳 ${안엶}곳은 일부러 뺐다 — 지면을 만들면 「(가칭)…초등학교」가 생긴다`)

console.log(`\n맞춘 값 ${같은칸.toLocaleString()}개 · 다른 칸 ${다른칸.length}개`)
for (const d of 다른칸.slice(0, 15)) console.log(`  🔴 ${d}`)
if (다른칸.length > 15) console.log(`  … 그리고 ${다른칸.length - 15}개 더`)
for (const m of 말할것) console.log(`  ${m}`)
if (!다른칸.length) console.log('✅ 통과 — 초등 자료가 NEIS 원본과 같고, 세어 둔 수도 다시 세어 같다')
console.log('⚠ 이 자는 NEIS 가 맞나를 못 본다. **우리가 그대로 옮겼나**만 본다')
process.exit(다른칸.length ? 1 : 0)
