#!/usr/bin/env node
/**
 * 국책연구(KDI) 90편 **옮김 검산** — `pages-research.json` 이 아카이브 낱장과 값까지 같은가.
 *
 *   node scripts/check-100y-research-transfer.mjs
 *   node scripts/check-100y-research-transfer.mjs --자가시험
 *
 * ## 🔴 왜 만들었나 (8번 · 2026-08-14 00:5x)
 *
 *   이 파일은 「대조」 칸에 *「맞춰 볼 바깥 공표치가 없다」*고만 적혀 있었다. 맞는 말이지만
 *   **원본과 맞춰 보는 일**은 그것과 다른 일이다. 아카이브에 KDI 낱장 1,381개가 있다.
 *
 * ## ⚠ 아카이브에 **같은 주소가 두 판**으로 있다 — 옛 판을 집으면 자가 거짓말을 한다
 *
 *   2026-08-05 에 영상보고서 제목이 안 들어오던 때 받아 둔 판(제목 null)이 그대로 남아 있고,
 *   매핑을 고친 뒤 받은 판이 따로 있다. `build-100yearmap-research.mjs` 는 **더 채워진 쪽**을 고른다.
 *   ⛔ 자도 같은 규칙을 쓴다. 처음에 그냥 마지막 판을 집었더니 22편이 거짓 빨강으로 떴다.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const 자료길 = path.join(뿌리, 'src/data/100yearmap/pages-research.json')
const 원본방 = path.join(뿌리, 'archive/raw/kdi')

/** 얼마나 채워진 판인가 — build-100yearmap-research.mjs 의 「더나은」과 같은 잣대다 */
export const 채움점수 = (j) =>
  [j?.titleKo, j?.date, j?.topics, (j?.authors ?? []).length ? 1 : null].filter(Boolean).length

export const 글자같나 = (a, b) => String(a ?? '').trim() === String(b ?? '').trim()

if (process.argv.includes('--자가시험')) {
  let 틀림 = 0
  const 본다 = (참, 말) => { if (!참) { console.error(`⛔ ${말}`); 틀림++ } }
  본다(채움점수({ titleKo: 'ㄱ', date: '2026-01-01', topics: 'x', authors: ['ㄴ'] }) === 4, '다 찬 판을 4로 안 센다')
  본다(채움점수({ titleKo: null, date: null, topics: null, authors: [] }) === 0, '빈 판을 0으로 안 센다')
  본다(채움점수({ titleKo: 'ㄱ' }) > 채움점수({}), '더 채워진 판을 못 고른다')
  본다(글자같나(' ㄱ ', 'ㄱ'), '앞뒤 빈칸으로 다르다고 한다')
  본다(!글자같나('ㄱ', null), '값과 빈 것을 같다고 한다')
  본다(글자같나(null, ''), '빈 것끼리를 다르다고 한다')
  console.log(틀림 ? `⛔ 자가시험 ${틀림}건 실패` : '✅ 자가시험 6건 통과')
  process.exit(틀림 ? 1 : 0)
}

if (!fs.existsSync(원본방)) {
  console.log(`⛔ 못 쟀다 — ${path.relative(뿌리, 원본방)} 이 없다. 이 PC 에만 있는 아카이브다`)
  process.exit(1)
}

// 주소마다 **제일 채워진 판**을 고른다
const 색인 = new Map()
let 낱장 = 0
for (const 날 of fs.readdirSync(원본방)) {
  const 방 = path.join(원본방, 날)
  if (!fs.statSync(방).isDirectory()) continue
  for (const f of fs.readdirSync(방)) {
    const j = JSON.parse(fs.readFileSync(path.join(방, f), 'utf8'))
    낱장++
    if (!j.url) continue
    const 열쇠 = String(j.url).trim()
    const 전 = 색인.get(열쇠)
    if (!전 || 채움점수(j) > 채움점수(전)) 색인.set(열쇠, j)
  }
}

const 자료 = JSON.parse(fs.readFileSync(자료길, 'utf8'))
let 같은칸 = 0
const 다른칸 = []

console.log(`\n── KDI — 우리 ${자료.자료.length}편 · 아카이브 낱장 ${낱장.toLocaleString()}개(주소 ${색인.size.toLocaleString()}가지)`)

for (const r of 자료.자료) {
  const o = 색인.get(String(r.url).trim())
  if (!o) { 다른칸.push(`${r.제목} — 아카이브에 그 주소가 없다`); continue }
  const 잰다 = (우리, 원본, 이름) => {
    if (글자같나(우리, 원본)) 같은칸++
    else 다른칸.push(`${r.제목} ${이름} — 우리 ${JSON.stringify(우리)} · 원본 ${JSON.stringify(원본)}`)
  }
  잰다(r.제목, o.titleKo, '제목')
  잰다(r.발행일, o.date, '발행일')
  잰다((r.저자 ?? []).join(','), (o.authors ?? []).join(','), '저자')
}

// 세어 둔 수도 다시 센다
const 셈 = {}
for (const r of 자료.자료) for (const c of r.분류 ?? []) 셈[c] = (셈[c] ?? 0) + 1
for (const [갈래, 수] of Object.entries(자료.분류별 ?? {})) {
  if (셈[갈래] === 수) 같은칸++
  else 다른칸.push(`분류별 ${갈래} — 적힌 것 ${수} · 다시 세니 ${셈[갈래] ?? 0}`)
}
if (자료.담김 === 자료.자료.length) 같은칸++
else 다른칸.push(`담김 — 적힌 것 ${자료.담김} · 실린 줄 ${자료.자료.length}`)

console.log(`\n맞춘 값 ${같은칸.toLocaleString()}개 · 다른 칸 ${다른칸.length}개`)
for (const d of 다른칸.slice(0, 15)) console.log(`  🔴 ${d}`)
if (다른칸.length > 15) console.log(`  … 그리고 ${다른칸.length - 15}개 더`)
if (!다른칸.length) console.log('✅ 옮김 검산 통과 — 국책연구 지면이 아카이브 낱장과 같다')
console.log('⚠ 이 자는 KDI 가 맞나를 못 본다. **우리가 그대로 옮겼나**만 본다')
process.exit(다른칸.length ? 1 : 0)
