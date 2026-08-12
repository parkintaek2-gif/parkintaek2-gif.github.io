#!/usr/bin/env node
/**
 * 나이 축 **옮김 검산** — `src/data/100yearmap/age-axis.json` 의 살림·혼인이
 * KOSIS 원본과 값 하나하나까지 같은가를 잰다.
 *
 *   node scripts/check-100y-age-axis-transfer.mjs            원본을 받아(없으면) 맞춘다
 *   node scripts/check-100y-age-axis-transfer.mjs --자가시험   값을 만지는 함수만 시험한다
 *   node scripts/check-100y-age-axis-transfer.mjs --받기       원본을 다시 받아 아카이브를 갈아 끼운다
 *
 * ## 🔴 왜 만들었나 (8번 · 2026-08-13)
 *
 *   2026-08-10 에 **임금 11칸(33값)** 만 맞춰 놓고 대장에 이렇게 적어 두었다 —
 *   *「⛔ 살림(101/DT_1HDAAA06)은 아직 안 맞췄다」*.
 *   짚어만 두고 안 고치면 그 줄은 파는 지면에 **확인 안 된 수**로 남는다.
 *   혼인(101/DT_1B83A36)도 같은 자리에 있었다 — 아무도 안 맞췄다.
 *
 * ## ⚠ 이 자가 못 보는 것
 *
 *   · **KOSIS 가 맞나**는 못 본다. 「우리 파일이 KOSIS 를 그대로 옮겼나」만 본다
 *   · 원본을 새로 받으면 해가 바뀌어 있을 수 있다. 그건 틀린 것이 아니라 **낡은 것**이다.
 *     그때는 다르다고 찍고 「갱신하라」고 말한다 — 조용히 넘기지 않는다
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const 자료길 = path.join(뿌리, 'src/data/100yearmap/age-axis.json')
const 원본방 = path.join(뿌리, 'archive/raw/kosis')

const 수 = (v) => (v === null || v === undefined || v === '' || v === '-' ? null : Number(v))

/** 두 수가 같은가. ⚠ KOSIS 는 소수를 문자로 준다 — 15자리까지 같으면 같은 것으로 본다 */
export function 같은수인가(a, b) {
  if (a === null || a === undefined || b === null || b === undefined) return a === b
  if (a === b) return true
  return Math.abs(a - b) <= Math.abs(a) * 1e-12
}

/** 나이띠 이름이 서로 겹치나 — 「39세 이하」와 「30~39세」는 겹친다 */
export function 겹치는띠(이름들) {
  const 범위 = (n) => {
    let m
    if ((m = n.match(/^(\d+)\s*세?\s*이하$/))) return [0, Number(m[1])]
    if ((m = n.match(/^(\d+)\s*세?\s*이상$/))) return [Number(m[1]), 200]
    if ((m = n.match(/^(\d+)\s*~\s*(\d+)/))) return [Number(m[1]), Number(m[2])]
    return null
  }
  const 잰것 = 이름들.map((n) => [n, 범위(n)]).filter(([, r]) => r)
  const 겹침 = []
  for (let i = 0; i < 잰것.length; i++) {
    for (let j = i + 1; j < 잰것.length; j++) {
      const [an, a] = 잰것[i]
      const [bn, b] = 잰것[j]
      if (a[0] <= b[1] && b[0] <= a[1]) 겹침.push([an, bn])
    }
  }
  return 겹침
}

if (process.argv.includes('--자가시험')) {
  let 틀림 = 0
  const 본다 = (참인가, 말) => { if (!참인가) { console.error(`⛔ ${말}`); 틀림++ } }
  본다(같은수인가(3873, 3873), '같은 정수를 다르다고 한다')
  본다(같은수인가(4508.6143172183, 4508.6143172183), '같은 소수를 다르다고 한다')
  본다(!같은수인가(3873, 3874), '다른 수를 같다고 한다')
  본다(!같은수인가(null, 0), '⛔ 빈칸과 0 을 같다고 한다 — 이것이 제일 위험하다')
  본다(같은수인가(null, null), '빈칸끼리를 다르다고 한다')
  본다(수('-') === null && 수('') === null, '수() 가 빈칸을 0 으로 만든다')
  본다(수('3988') === 3988, '수() 가 숫자를 못 읽는다')
  본다(겹치는띠(['29세 이하', '30~39세', '40~49세']).length === 0, '안 겹치는 띠를 겹친다고 한다')
  본다(겹치는띠(['30~39세', '39세 이하']).length === 1, '겹치는 띠를 못 잡는다')
  본다(겹치는띠(['60세 이상', '65세 이상']).length === 1, '「이상」끼리 겹치는 것을 못 잡는다')
  본다(겹치는띠(['29세 이하', '39세 이하']).length === 1, '「이하」끼리 겹치는 것을 못 잡는다')
  console.log(틀림 ? `⛔ 자가시험 ${틀림}건 실패` : `✅ 자가시험 11건 통과`)
  process.exit(틀림 ? 1 : 0)
}

// ── 원본을 손에 쥔다 ────────────────────────────────────────────
const 키 = () => {
  const m = fs.readFileSync(path.join(뿌리, '.env'), 'utf8').match(/^KOSIS_API_KEY=(.+)$/m)
  if (!m) throw new Error('.env 에 KOSIS_API_KEY 가 없다')
  return m[1].trim()
}

const 받기 = async (org, tbl, 축수) => {
  const objs = Array.from({ length: 축수 }, (_, i) => `objL${i + 1}=ALL`).join('&')
  const r = await fetch(`https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${키()}` +
    `&orgId=${org}&tblId=${tbl}&itmId=ALL&${objs}&format=json&jsonVD=Y&prdSe=Y&newEstPrdCnt=1`)
  const t = await r.text()
  let j
  try { j = JSON.parse(t) } catch { throw new Error(`${tbl}: 응답이 JSON 이 아니다 — ${t.slice(0, 120)}`) }
  if (!Array.isArray(j)) throw new Error(`${tbl}: ${JSON.stringify(j).slice(0, 160)}`)
  return j
}

const 원본을쥔다 = async (org, tbl, 축수) => {
  const 길 = path.join(원본방, `${tbl}.json`)
  if (!process.argv.includes('--받기') && fs.existsSync(길)) {
    return { 줄: JSON.parse(fs.readFileSync(길, 'utf8')), 어디서: '아카이브' }
  }
  const 줄 = await 받기(org, tbl, 축수)
  fs.mkdirSync(원본방, { recursive: true })
  fs.writeFileSync(길, JSON.stringify(줄) + '\n', 'utf8')
  return { 줄, 어디서: 'KOSIS 에서 새로 받아 아카이브에 굳혔다' }
}

const 자료 = JSON.parse(fs.readFileSync(자료길, 'utf8'))
let 같은칸 = 0
const 다른칸 = []
const 말할것 = []

// ── ① 살림 — 101/DT_1HDAAA06 ────────────────────────────────────
{
  const { 줄, 어디서 } = await 원본을쥔다('101', 'DT_1HDAAA06', 3)
  console.log(`\n── 살림 101/DT_1HDAAA06 — 원본 ${줄.length.toLocaleString()}줄 (${어디서})`)

  const 원본해 = 줄[0]?.PRD_DE
  const 적힌해 = String(자료.출처.살림.해)
  if (String(원본해) !== 적힌해) {
    말할것.push(`⚠ 살림 — 원본은 ${원본해} 인데 우리 파일은 ${적힌해} 다. 틀린 것이 아니라 **낡은 것**이다. 갱신하라`)
  }

  const 항목이름 = { 자산: '자산', 부채: '부채', 순자산: '순자산', '경상소득(전년도)': '경상소득' }
  const 꼬리 = { '전가구 평균': '_전가구평균', '보유가구 중앙값': '_보유가구중앙', '보유가구 비율': '_가진집비율' }
  const 꼬리자 = /_(전가구평균|보유가구중앙|가진집비율)$/

  for (const [띠, 칸] of Object.entries(자료.살림)) {
    for (const [칸이름, 우리값] of Object.entries(칸)) {
      const [뿌리이름, 종류] = [칸이름.replace(꼬리자, ''), 칸이름.match(꼬리자)?.[1]]
      const C3 = Object.keys(항목이름).find((k) => 항목이름[k] === 뿌리이름)
      const ITM = Object.keys(꼬리).find((k) => 꼬리[k] === `_${종류}`)
      const 찾은 = 줄.filter((x) => x.C1_NM === '전체' && x.C2_NM === 띠 && x.C3_NM === C3 && x.ITM_NM === ITM)
      if (찾은.length === 0) { 다른칸.push(`살림 ${띠} ${칸이름} — 원본에 그런 줄이 없다`); continue }
      if (찾은.length > 1) { 다른칸.push(`살림 ${띠} ${칸이름} — 원본에 같은 줄이 ${찾은.length}개다(무엇을 골랐는지 알 수 없다)`); continue }
      const 원값 = 수(찾은[0].DT)
      if (같은수인가(원값, 우리값)) 같은칸++
      else 다른칸.push(`살림 ${띠} ${칸이름} — 우리 ${우리값} · 원본 ${원값}`)
    }
  }

  // ⛔ 우리가 **안 실은 것**도 말한다. 값이 맞는 것만 세면 빠뜨린 것이 안 보인다
  const 원본띠 = [...new Set(줄.filter((x) => x.C1_NM === '전체' && x.C2_NM && x.C2_NM !== '전체').map((x) => x.C2_NM))]
  const 안실은띠 = 원본띠.filter((t) => !(t in 자료.살림))
  if (안실은띠.length) 말할것.push(`⬜ 살림 — 원본에 있는데 우리가 안 실은 띠 ${안실은띠.length}개: ${안실은띠.join(' · ')}`)

  const 원본항목 = [...new Set(줄.filter((x) => x.C1_NM === '전체').map((x) => x.C3_NM))]
  const 안실은항목 = Object.keys(항목이름).filter((k) => 원본항목.includes(k) &&
    !Object.values(자료.살림).some((칸) => Object.keys(칸).some((n) => n.startsWith(항목이름[k]))))
  if (안실은항목.length) 말할것.push(`⬜ 살림 — 받아 놓고 안 실은 항목: ${안실은항목.join(' · ')}`)

  const 겹침 = 겹치는띠(Object.keys(자료.살림))
  if (겹침.length) {
    말할것.push(`🔴 살림 — 나이띠가 서로 **겹친다** ${겹침.length}쌍: ${겹침.map(([a, b]) => `${a}↔${b}`).join(' · ')}` +
      ` → 이 띠들을 **더하면 사람을 두 번 센다.** 지면에서 합계로 쓰면 안 된다`)
  }
}

// ── ② 혼인 — 101/DT_1B83A36 ────────────────────────────────────
{
  const { 줄, 어디서 } = await 원본을쥔다('101', 'DT_1B83A36', 2)
  console.log(`── 혼인 101/DT_1B83A36 — 원본 ${줄.length.toLocaleString()}줄 (${어디서})`)

  const 원본해 = 줄[0]?.PRD_DE
  const 적힌해 = String(자료.출처.혼인.해)
  if (String(원본해) !== 적힌해) {
    말할것.push(`⚠ 혼인 — 원본은 ${원본해} 인데 우리 파일은 ${적힌해} 다. 낡은 것이다. 갱신하라`)
  }

  const 총 = 수(줄.find((x) => x.C1_NM === '계' && x.C2_NM === '계')?.DT)
  if (같은수인가(총, 자료.혼인.총건)) 같은칸++
  else 다른칸.push(`혼인 총건 — 우리 ${자료.혼인.총건} · 원본 ${총}`)

  const 남 = 줄.filter((x) => x.C2_NM === '계' && x.C1_NM !== '계')
  const 여 = 줄.filter((x) => x.C1_NM === '계' && x.C2_NM !== '계')

  for (const [누구, 줄들, 키, 분포] of [['남편', 남, 'C1_NM', 자료.혼인.남편분포], ['아내', 여, 'C2_NM', 자료.혼인.아내분포]]) {
    분포.값.forEach((우리값, i) => {
      const 나이 = `${분포.시작나이 + i}세`
      const 찾은 = 줄들.filter((x) => x[키] === 나이)
      if (찾은.length !== 1) { 다른칸.push(`혼인 ${누구} ${나이} — 원본 줄이 ${찾은.length}개다`); return }
      const 원값 = 수(찾은[0].DT)
      if (같은수인가(원값, 우리값)) 같은칸++
      else 다른칸.push(`혼인 ${누구} ${나이} — 우리 ${우리값} · 원본 ${원값}`)
    })
    // 축의 합이 「계」와 맞나 — 옮기다 한 줄 흘리면 여기서 걸린다
    const 축합 = 줄들.reduce((s, x) => s + (수(x.DT) ?? 0), 0)
    if (같은수인가(축합, 총)) 같은칸++
    else 다른칸.push(`혼인 ${누구} 축 합 ${축합} ≠ 계 ${총}`)
  }

  // 최다 나이 — 우리가 고른 것이 정말 제일 많은 줄인가
  for (const [누구, 줄들, 키] of [['남편', 남, 'C1_NM'], ['아내', 여, 'C2_NM']]) {
    const 제일 = 줄들.filter((x) => x[키] !== '미상').sort((a, b) => 수(b.DT) - 수(a.DT))[0]?.[키]
    if (제일 === 자료.혼인.최다[누구]) 같은칸++
    else 다른칸.push(`혼인 최다 ${누구} — 우리 ${자료.혼인.최다[누구]} · 원본 ${제일}`)
  }

  // 누적 % — 우리가 적은 값을 원본에서 다시 세어 본다
  for (const [나이, 칸] of Object.entries(자료.혼인.누적)) {
    for (const [누구, 우리값] of Object.entries(칸)) {
      const [줄들, 키] = 누구 === '남편' ? [남, 'C1_NM'] : [여, 'C2_NM']
      const 아래 = 줄들.filter((x) => {
        const s = String(x[키])
        if (s.includes('미만')) return true
        const m = s.match(/^(\d+)/)
        return m ? Number(m[1]) <= Number(나이) : false
      })
      const 다시센것 = Number((아래.reduce((s, x) => s + (수(x.DT) ?? 0), 0) / 총 * 100).toFixed(1))
      if (같은수인가(다시센것, 우리값)) 같은칸++
      else 다른칸.push(`혼인 누적 ${나이}세 이하 ${누구} — 우리 ${우리값}% · 다시 센 것 ${다시센것}%`)
    }
  }

  // 아내 분포가 남편보다 짧다 — 왜 짧은지를 파일이 말하고 있나
  if (자료.혼인.아내분포.값.length !== 자료.혼인.남편분포.값.length) {
    말할것.push(`⬜ 혼인 — 남편 ${자료.혼인.남편분포.값.length}살 · 아내 ${자료.혼인.아내분포.값.length}살로 길이가 다르다` +
      ` (한쪽 축이 일찍 묶여 나온다). ⛔ 두 줄을 겹쳐 그리면 아내 쪽이 뚝 끊긴 것처럼 보인다 — 지면이 이 사실을 말해야 한다`)
  }
}

// ── 낸다 ────────────────────────────────────────────────────────
console.log(`\n맞춘 값 ${같은칸}개 · 다른 칸 ${다른칸.length}개`)
for (const d of 다른칸) console.log(`  🔴 ${d}`)
for (const m of 말할것) console.log(`  ${m}`)
if (!다른칸.length) console.log('✅ 옮김 검산 통과 — 살림·혼인이 KOSIS 원본과 값까지 같다')
console.log('⚠ 이 자는 KOSIS 가 맞나를 못 본다. **우리가 그대로 옮겼나**만 본다')
process.exit(다른칸.length ? 1 : 0)
