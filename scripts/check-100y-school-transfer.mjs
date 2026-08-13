#!/usr/bin/env node
/**
 * 고교 2,525곳 **옮김 검산** — `src/data/100yearmap/pages-school.json` 이
 * NEIS 원본(archive/raw/neis/school-info.json · school-major.json)과 같은가.
 *
 *   node scripts/check-100y-school-transfer.mjs
 *   node scripts/check-100y-school-transfer.mjs --자가시험
 *
 * ## 🔴 왜 만들었나 (8번 · 2026-08-13)
 *
 *   학교 지면 2,525장은 백년지도에서 **제일 많은 지면**이다. 그런데 값이 원본과 같은지
 *   아무도 안 맞춰 봤다. 대학 377곳을 맞추고(6,580값 · 다른 칸 0) 이어서 여기를 잰다.
 *
 * ⚠ 이 자는 **NEIS 가 맞나**를 못 본다. 「우리가 그대로 옮겼나」와
 *   「우리가 센 것(같은지역_고교수·학과수)이 다시 세어도 같나」만 본다.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const 자료길 = path.join(뿌리, 'src/data/100yearmap/pages-school.json')
const 원본방 = path.join(뿌리, 'archive/raw/neis')

/** ⚠ NEIS 는 값 끝에 빈칸을 붙여 준다. 칸 안의 빈칸 두 개도 하나로 본다. 빈 문자열은 null 이다 */
export const 다듬 = (v) => {
  if (v === null || v === undefined) return null
  const s = String(v).replace(/\s+/g, ' ').trim()
  return s === '' ? null : s
}

export function 같은글자인가(a, b) {
  return 다듬(a) === 다듬(b)
}

if (process.argv.includes('--자가시험')) {
  let 틀림 = 0
  const 본다 = (참, 말) => { if (!참) { console.error(`⛔ ${말}`); 틀림++ } }
  본다(다듬('05678 ') === '05678', '끝의 빈칸을 안 떼어 낸다')
  본다(다듬('') === null && 다듬(null) === null, '빈 것을 null 로 안 본다')
  본다(같은글자인가('일반고', '일반고 '), '빈칸 하나로 다르다고 한다')
  본다(!같은글자인가('일반고', '자율고'), '다른 글자를 같다고 한다')
  본다(같은글자인가(null, ''), '빈칸과 없는 것을 다르다고 한다')
  본다(!같은글자인가('0', null), '⛔ 「0」과 없는 것을 같다고 한다')
  console.log(틀림 ? `⛔ 자가시험 ${틀림}건 실패` : '✅ 자가시험 6건 통과')
  process.exit(틀림 ? 1 : 0)
}

const 읽기 = (f) => JSON.parse(fs.readFileSync(path.join(원본방, f), 'utf8').replace(/^﻿/, ''))
const 학교 = JSON.parse(fs.readFileSync(자료길, 'utf8'))
const 정보 = 읽기('school-info.json')
const 학과원본 = 읽기('school-major.json')

const 원본줄 = 정보.rows
// 🔴 원본에 **같은 학교코드가 두 번 나오는 줄**이 있다. 뒤엣것으로 덮으면 우리 파일과 어긋난다 —
//    우리 수집기는 먼저 나온 줄을 쓴다. 자도 같은 규칙으로 맞춘다.
const 찾기 = new Map()
const 겹친코드 = []
let 코드없는줄 = 0
for (const r of 원본줄) {
  const 코드 = String(r.SD_SCHUL_CODE ?? '').trim()
  if (!코드) { 코드없는줄++; continue }
  if (찾기.has(코드)) { 겹친코드.push(`${코드} ${r.SCHUL_NM}`); continue }
  찾기.set(코드, r)
}

let 같은칸 = 0
const 다른칸 = []
const 말할것 = []

console.log(`\n── NEIS — 우리 ${학교.length.toLocaleString()}곳 · 원본 ${원본줄.length.toLocaleString()}곳(초·중·고 전부)`)

const 짝 = {
  title: 'SCHUL_NM', titleEn: 'ENG_SCHUL_NM', 종류: 'SCHUL_KND_SC_NM', 고교유형: 'HS_SC_NM',
  // ⚠ 교육청은 원본에 **두 칸**이 있다 — JU_ORG_NM(직속 기관)과 ATPT_OFCDC_SC_NM(관할 시도교육청).
  //    우리 파일은 뒤엣것을 쓴다(국립대 부설고는 JU 가 「교육부」라 지역 지면에 안 맞는다).
  //    앞엣것과 맞추면 243곳이 「다르다」로 나온다 — 자가 틀린 것이다.
  지역: 'LCTN_SC_NM', 교육청: 'ATPT_OFCDC_SC_NM', 설립: 'FOND_SC_NM', 공학: 'COEDU_SC_NM',
  홈페이지: 'HMPG_ADRES', 설립일: 'FOND_YMD',
}

// ⚠ 주소는 원본이 **두 칸으로 나뉘어** 온다 — 도로명(ORG_RDNMA) + 상세(ORG_RDNDA).
//    우리 파일은 둘을 붙여 놓았다. 한 칸만 보고 맞추면 2,525곳이 전부 「다르다」로 나온다.
export const 주소붙이기 = (r) => [r.ORG_RDNMA, r.ORG_RDNDA].map((v) => (v ?? '').trim()).filter(Boolean).join(' ').trim()

for (const s of 학교) {
  const r = 찾기.get(String(s.code))
  if (!r) { 다른칸.push(`${s.title}(${s.code}) — 원본에 그 학교가 없다`); continue }
  if (같은글자인가(s.주소, 주소붙이기(r))) 같은칸++
  else 다른칸.push(`${s.title} 주소 — 우리 ${JSON.stringify(s.주소)} · 원본 ${JSON.stringify(주소붙이기(r))}`)
  for (const [우리, 원] of Object.entries(짝)) {
    if (같은글자인가(s[우리], r[원])) 같은칸++
    else 다른칸.push(`${s.title} ${우리} — 우리 ${JSON.stringify(s[우리])} · 원본 ${JSON.stringify(다듬(r[원]))}`)
  }
}

// 우리가 **센 것**은 다시 센다 — 옮긴 것이 아니라 만든 값이라 검산이 다르다
{
  const 지역별 = {}
  for (const s of 학교) 지역별[s.지역] = (지역별[s.지역] ?? 0) + 1
  let 어긋남 = 0
  for (const s of 학교) {
    if (s.같은지역_고교수 === 지역별[s.지역]) 같은칸++
    else { 어긋남++; if (어긋남 <= 3) 다른칸.push(`${s.title} 같은지역_고교수 — 적힌 것 ${s.같은지역_고교수} · 다시 세니 ${지역별[s.지역]}`) }
  }
  if (어긋남 > 3) 다른칸.push(`같은지역_고교수 — 그 밖에 ${어긋남 - 3}곳 더 어긋난다`)

  const 학과줄 = 학과원본.rows ?? []
  const 학교별학과 = new Map()
  for (const m of 학과줄) {
    const 코드 = String(m.SD_SCHUL_CODE ?? m.SCHUL_CODE ?? '')
    if (!코드) continue
    if (!학교별학과.has(코드)) 학교별학과.set(코드, new Set())
    학교별학과.get(코드).add(다듬(m.DDDEP_NM ?? m.MAJOR_NM ?? m.ORD_SC_NM))
  }
  // ⚠ 우리는 원본 학과 이름 중 **일반과정 이름들을 일부러 뺀다**(공통과정·인문사회과정·일반학과 …).
  //    그래서 「수가 같나」로는 못 잰다. 대신 두 가지를 본다 —
  //      ① 우리가 적은 학과 이름이 **원본에 다 있나**(없으면 우리가 지어낸 것이다)
  //      ② 우리가 뺀 이름이 무엇무엇인가 — 세어서 화면에 적는다(숨기지 않는다)
  const 뺀이름 = new Map()
  let 지어낸것 = 0
  for (const s of 학교) {
    const 원 = 학교별학과.get(String(s.code)) ?? new Set()
    for (const a of s.학과 ?? []) {
      if (원.has(다듬(a.name))) 같은칸++
      else { 지어낸것++; if (지어낸것 <= 3) 다른칸.push(`${s.title} 학과 「${a.name}」 — 원본에 없는 이름이다`) }
    }
    if (s.학과수 !== (s.학과 ?? []).length) 다른칸.push(`${s.title} 학과수 ${s.학과수} — 실제 실린 학과는 ${(s.학과 ?? []).length}개다`)
    for (const n of 원) if (!(s.학과 ?? []).some((a) => 다듬(a.name) === n)) 뺀이름.set(n, (뺀이름.get(n) ?? 0) + 1)
  }
  if (지어낸것 > 3) 다른칸.push(`학과 이름 — 그 밖에 ${지어낸것 - 3}개가 원본에 없다`)
  if (뺀이름.size) {
    const 큰것 = [...뺀이름.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([n, c]) => `${n} ${c.toLocaleString()}곳`)
    말할것.push(`⬜ 원본에 있는데 우리가 안 실은 학과 이름 ${뺀이름.size}가지 — 많은 것부터: ${큰것.join(' · ')}`)
  }
}

if (겹친코드.length) 말할것.push(`⬜ 원본에 학교코드가 겹치는 줄 ${겹친코드.length}개 — 먼저 나온 줄을 썼다: ${겹친코드.join(' · ')}`)
if (코드없는줄) 말할것.push(`⬜ 원본에 학교코드가 빈 줄 ${코드없는줄}개 — 어느 학교인지 못 가려 뺐다`)

// 기준시각 — 비어 있으면 「언제 받은 자료인가」를 아무도 모른다
const 기준없음 = 학교.filter((s) => !s.기준시각).length
if (기준없음) 말할것.push(`🔴 기준시각이 비어 있는 곳 ${기준없음.toLocaleString()}곳 — 원본 수집시각은 「${정보.수집시각}」이다. 파일이 그것을 안 말하고 있다`)

console.log(`\n맞춘 값 ${같은칸.toLocaleString()}개 · 다른 칸 ${다른칸.length}개`)
for (const d of 다른칸.slice(0, Number(process.env.보일수 ?? 15))) console.log(`  🔴 ${d}`)
if (다른칸.length > 15) console.log(`  … 그리고 ${다른칸.length - 15}개 더`)
for (const m of 말할것) console.log(`  ${m}`)
if (!다른칸.length) console.log('✅ 옮김 검산 통과 — 고교 지면 값이 NEIS 원본과 같다')
console.log('⚠ 이 자는 NEIS 가 맞나를 못 본다. **우리가 그대로 옮겼나**만 본다')
process.exit(다른칸.length ? 1 : 0)
