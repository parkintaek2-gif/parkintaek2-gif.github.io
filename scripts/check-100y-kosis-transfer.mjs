#!/usr/bin/env node
/**
 * KOSIS 를 옮겨 적은 자료 둘이 **원본과 값까지 같은가** — 옮김 검산.
 *
 *   node scripts/check-100y-kosis-transfer.mjs
 *   node scripts/check-100y-kosis-transfer.mjs --자가시험
 *
 *   ① voc-series-outcomes.json ↔ archive/raw/kosis/DT_920024_3N_007.json  (직업계고 계열 10갈래)
 *   ② occupation-names.json    ↔ archive/raw/kosis/DT_118N_PAYM41.json    (직종 191칸)
 *
 * ## 🔴 왜 만들었나 (8번 · 2026-08-13)
 *
 *   두 파일 다 「대조」 칸에 **검산**은 적혀 있었다 —
 *   voc 는 「취업대상자 = 졸업자 − 진학자 − 입대자 − 제외인정자가 맞나」,
 *   occ 는 「칸을 다 더하면 전직종이 되나」. 둘 다 **자기 안에서만 아귀가 맞나**를 본 것이다.
 *   ⛔ 그것은 **옮기다 틀린 것**을 못 잡는다. 원본에서 엉뚱한 줄을 집어 와도 안이 맞으면 통과한다.
 *   그래서 값 하나하나를 원본과 맞추는 자를 따로 둔다. 나이 축은 이미 걸었다
 *   (`check-100y-age-axis-transfer.mjs` · 112값 · 다른 칸 0).
 *
 * ## ⚠ 이 자가 못 보는 것
 *
 *   · **KOSIS 가 맞나**는 못 본다. 「우리가 그대로 옮겼나」만 본다
 *   · 원본이 아카이브에 없으면 **못 잰다**고 말하고 선다. ⛔ 「없으니 통과」로 넘기지 않는다
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const 자료방 = path.join(뿌리, 'src/data/100yearmap')
const 원본방 = path.join(뿌리, 'archive/raw/kosis')

export const 수 = (v) => (v === null || v === undefined || v === '' || v === '-' ? null : Number(v))

/** 두 수가 같은가. ⛔ 빈칸과 0 은 다른 것이다 */
export function 같은수인가(a, b) {
  if (a === null || a === undefined || b === null || b === undefined) return a === b
  if (a === b) return true
  return Math.abs(a - b) <= Math.abs(a) * 1e-12
}

/** KOSIS 응답이 배열로 왔든 꾸러미로 왔든 줄을 꺼낸다 */
export function 줄을꺼낸다(원본) {
  if (Array.isArray(원본)) return 원본
  if (원본 && Array.isArray(원본.rows)) return 원본.rows
  if (원본 && typeof 원본 === 'object') {
    const 배열 = Object.values(원본).find((v) => Array.isArray(v))
    if (배열) return 배열
  }
  return null
}

if (process.argv.includes('--자가시험')) {
  let 틀림 = 0
  const 본다 = (참인가, 말) => { if (!참인가) { console.error(`⛔ ${말}`); 틀림++ } }
  본다(같은수인가(58.1, 58.1), '같은 수를 다르다고 한다')
  본다(!같은수인가(58.1, 58.2), '다른 수를 같다고 한다')
  본다(!같은수인가(null, 0), '⛔ 빈칸과 0 을 같다고 한다')
  본다(같은수인가(null, null), '빈칸끼리를 다르다고 한다')
  본다(수('-') === null && 수('') === null, '수() 가 빈칸을 0 으로 만든다')
  본다(수('27469') === 27469, '수() 가 숫자를 못 읽는다')
  본다(줄을꺼낸다([{ a: 1 }]).length === 1, '배열 응답에서 줄을 못 꺼낸다')
  본다(줄을꺼낸다({ rows: [{ a: 1 }, { a: 2 }] }).length === 2, 'rows 꾸러미에서 줄을 못 꺼낸다')
  본다(줄을꺼낸다({ 표: 'x' }) === null, '줄이 없는데 있다고 한다')
  console.log(틀림 ? `⛔ 자가시험 ${틀림}건 실패` : '✅ 자가시험 9건 통과')
  process.exit(틀림 ? 1 : 0)
}

const 읽기 = (길) => JSON.parse(fs.readFileSync(길, 'utf8'))
const 원본쥐기 = (표) => {
  const 길 = path.join(원본방, `${표}.json`)
  if (!fs.existsSync(길)) return null
  const 줄 = 줄을꺼낸다(읽기(길))
  return 줄 && 줄.length ? 줄 : null
}

let 같은칸 = 0
const 다른칸 = []
const 말할것 = []
const 못잰것 = []

// ── ① 직업계고 계열 — 334/DT_920024_3N_007 ──────────────────────
{
  const 자료 = 읽기(path.join(자료방, 'voc-series-outcomes.json'))
  const 줄 = 원본쥐기('DT_920024_3N_007')
  if (!줄) 못잰것.push('voc-series-outcomes — 원본 DT_920024_3N_007.json 이 아카이브에 없다')
  else {
    const 해 = String(자료.통계.기준연도)
    const 그해 = 줄.filter((x) => String(x.PRD_DE) === 해)
    console.log(`\n── 직업계고 334/DT_920024_3N_007 — 원본 ${줄.length.toLocaleString()}줄 · ${해}년치 ${그해.length}줄`)
    if (!그해.length) 못잰것.push(`voc-series-outcomes — 원본에 ${해}년치가 없다(있는 해: ${[...new Set(줄.map((x) => x.PRD_DE))].join(',')})`)

    const 칸이름 = ['졸업자', '취업률', '취업자', '진학률', '진학자', '입대자', '제외인정자', '미취업자']
    for (const 줄하나 of 자료.자료) {
      for (const 이름 of 칸이름) {
        if (!(이름 in 줄하나)) continue
        const 찾은 = 그해.filter((x) => x.C1_NM === 줄하나.계열 && x.C2_NM === 이름)
        if (찾은.length !== 1) { 다른칸.push(`직업계고 ${줄하나.계열} ${이름} — 원본 줄이 ${찾은.length}개다`); continue }
        const 원값 = 수(찾은[0].DT)
        // ⭐ 일부러 비운 칸 — 옆에 「…못냄」으로 **까닭이 적혀 있으면** 틀린 것이 아니다.
        //    (예: 예술 계열 취업률은 취업 대상이 9명이라 비율이 뜻을 잃는다)
        //    ⛔ 그래도 조용히 넘기지 않고 무엇을 왜 뺐는지 화면에 적는다.
        if (줄하나[이름] === null && 줄하나[`${이름}못냄`]) {
          말할것.push(`⬜ 직업계고 ${줄하나.계열} ${이름} — 일부러 비웠다(원본 ${원값}). 까닭: ${줄하나[`${이름}못냄`]}`)
          continue
        }
        if (같은수인가(원값, 줄하나[이름])) 같은칸++
        else 다른칸.push(`직업계고 ${줄하나.계열} ${이름} — 우리 ${줄하나[이름]} · 원본 ${원값}`)
      }
    }

    // 우리 계열 합이 원본 「총계」와 맞나 — 한 계열을 통째로 흘리면 여기서 걸린다
    const 총계졸업 = 수(그해.find((x) => x.C1_NM === '총계' && x.C2_NM === '졸업자')?.DT)
    const 우리합 = 자료.자료.reduce((s, x) => s + (x.졸업자 ?? 0), 0)
    if (같은수인가(총계졸업, 우리합)) 같은칸++
    else 다른칸.push(`직업계고 졸업자 합 — 우리 ${우리합} · 원본 총계 ${총계졸업}`)

    const 원본계열 = 그해.filter((x) => x.C1_NM !== '총계').map((x) => x.C1_NM)
    const 안실은 = [...new Set(원본계열)].filter((c) => !자료.자료.some((r) => r.계열 === c))
    if (안실은.length) 말할것.push(`⬜ 직업계고 — 원본에 있는데 우리가 안 실은 계열 ${안실은.length}개: ${안실은.join(' · ')}`)
  }
}

// ── ② 직종 191칸 — 118/DT_118N_PAYM41 ──────────────────────────
{
  const 자료 = 읽기(path.join(자료방, 'occupation-names.json'))
  const 줄 = 원본쥐기('DT_118N_PAYM41')
  if (!줄) 못잰것.push('occupation-names — 원본 DT_118N_PAYM41.json 이 아카이브에 없다')
  else {
    console.log(`── 직종 118/DT_118N_PAYM41 — 원본 ${줄.length.toLocaleString()}줄`)
    const 항목 = { 월급여액_천원: '월급여액', 평균근속년수: '평균근속년수', 평균연령: '평균연령', 근로자수: '근로자수' }
    // 🔴 원본의 직업 코드는 `C1 = "210514KSCO7_<코드>"` 에 들어 있다. C1_NM 은 「이름(코드)」꼴이라
    //    이름으로 맞추면 괄호·띄어쓰기에 걸린다. **코드 꼬리**로 맞춘다.
    // ⛔ 성별 축(C2)이 있다. 「전체」줄만 본다 — 안 가리면 남·여까지 걸려 세 줄이 나온다.
    const 코드 = (x) => String(x.C1 ?? '').replace(/^.*KSCO7_/, '')
    let 이름으로 = 0
    for (const 칸 of 자료.자료) {
      for (const [우리이름, ITM] of Object.entries(항목)) {
        if (칸[우리이름] === undefined || 칸[우리이름] === null) continue
        const 전체줄 = 줄.filter((x) => x.ITM_NM === ITM && (x.C2_NM === undefined || x.C2_NM === '전체'))
        let 찾은 = 전체줄.filter((x) => 코드(x) === String(칸.KSCO코드))
        if (찾은.length !== 1) {
          찾은 = 전체줄.filter((x) => String(x.C1_NM).replace(/\s|\(.*\)$/g, '') === String(칸.이름).replace(/\s/g, ''))
          if (찾은.length === 1) 이름으로++
        }
        if (찾은.length !== 1) { 다른칸.push(`직종 ${칸.이름}(${칸.KSCO코드}) ${우리이름} — 원본 줄이 ${찾은.length}개다`); continue }
        const 원값 = 수(찾은[0].DT)
        if (같은수인가(원값, 칸[우리이름])) 같은칸++
        else 다른칸.push(`직종 ${칸.이름}(${칸.KSCO코드}) ${우리이름} — 우리 ${칸[우리이름]} · 원본 ${원값}`)
      }
    }
    if (이름으로) 말할것.push(`⚠ 직종 ${이름으로}칸은 코드로 못 찾아 **이름으로** 맞췄다 — 이름이 바뀌면 조용히 어긋난다`)
  }
}

// ── 낸다 ────────────────────────────────────────────────────────
console.log(`\n맞춘 값 ${같은칸}개 · 다른 칸 ${다른칸.length}개`)
for (const d of 다른칸.slice(0, 30)) console.log(`  🔴 ${d}`)
if (다른칸.length > 30) console.log(`  … 그리고 ${다른칸.length - 30}개 더`)
for (const m of 말할것) console.log(`  ${m}`)
for (const m of 못잰것) console.log(`  ⛔ 못 쟀다 — ${m}`)
if (!다른칸.length && !못잰것.length) console.log('✅ 옮김 검산 통과 — 두 자료가 KOSIS 원본과 값까지 같다')
console.log('⚠ 이 자는 KOSIS 가 맞나를 못 본다. **우리가 그대로 옮겼나**만 본다')
process.exit(다른칸.length || 못잰것.length ? 1 : 0)
