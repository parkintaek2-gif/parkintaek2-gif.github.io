#!/usr/bin/env node
// 백년지도 「나이로 보기」 축 — 나이대별 값을 KOSIS 에서 받아 src/data 로 굳힌다.
//
// 왜 이 파일이 있나
//   사장님: 「대학 이후~ 백년지도」 · 「데이터로 남들은 어떻게 하는지 보여주는 게 현실적이겠지?」
//   지면은 조언하지 않는다. 「N명 중 M명이 그렇게 했다」만 적는다.
//
// 규칙
//   · 어림하지 않는다. 받은 숫자를 그대로 적는다. 못 받으면 그 칸은 비운다.
//   · 평균만 싣지 않는다. 분포를 함께 굳힌다 — 평균이 규범이 되면 나침반이 아니라 압박이다.
//
// 쓰는 법  node scripts/collect-age-axis.mjs [--selftest]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const 낼곳 = path.join(뿌리, 'src/data/100yearmap/age-axis.json')

const 키 = () => {
  const m = fs.readFileSync(path.join(뿌리, '.env'), 'utf8').match(/^KOSIS_API_KEY=(.+)$/m)
  if (!m) throw new Error('.env 에 KOSIS_API_KEY 가 없다')
  return m[1].trim()
}

const 받기 = async (KEY, org, tbl, 축수) => {
  const objs = Array.from({ length: 축수 }, (_, i) => `objL${i + 1}=ALL`).join('&')
  const r = await fetch(`https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${KEY}` +
    `&orgId=${org}&tblId=${tbl}&itmId=ALL&${objs}&format=json&jsonVD=Y&prdSe=Y&newEstPrdCnt=1`)
  const t = await r.text()
  let j
  try { j = JSON.parse(t) } catch { throw new Error(`${tbl}: 응답이 JSON 이 아니다 — ${t.slice(0, 100)}`) }
  if (!Array.isArray(j)) throw new Error(`${tbl}: ${JSON.stringify(j).slice(0, 140)}`)
  return j
}

const 수 = (v) => (v === null || v === undefined || v === '' || v === '-' ? null : Number(v))

// ── 자가시험: 값을 만지는 함수는 전부 여기서 검산한다 ──────────────
export function 나이띠(나이) {
  if (나이 < 20) return '~ 19세'
  if (나이 >= 60) return '60세 ~'
  const 아래 = Math.floor(나이 / 5) * 5
  return 아래 === 20 || 아래 === 25 ? `${아래} ~ ${아래 + 4}` : `${아래} ~ ${아래 + 4}`
}

// 🔴 만든날은 **한국 시각**으로 찍는다 (8번 2026-08-13).
//    toISOString() 은 UTC 라 아침 9시 전에 돌리면 **하루 이른 날짜**가 박힌다.
//    2026-08-13 07:5x 에 돌렸더니 실제로 「2026-08-12」가 박혔다.
//    5번 기사 45편이 같은 병으로 자료 기준일이 하루 일찍 나간 적이 있다(2026-08-08).
export const 오늘한국 = (때 = new Date()) =>
  new Date(때.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)

if (process.argv.includes('--selftest')) {
  const 시험 = [[19, '~ 19세'], [25, '25 ~ 29'], [32, '30 ~ 34'], [40, '40 ~ 44'], [55, '55 ~ 59'], [68, '60세 ~']]
  let 틀림 = 0
  for (const [나이, 답] of 시험) {
    const 낸것 = 나이띠(나이)
    if (낸것 !== 답) { console.error(`⛔ ${나이}세 → ${낸것} (${답} 이라야 한다)`); 틀림++ }
  }
  if (수('-') !== null || 수('3988') !== 3988) { console.error('⛔ 수() 가 빈칸을 0 으로 만든다'); 틀림++ }
  // 한국 아침(UTC 로는 어제)에 돌려도 오늘 날짜가 나와야 한다
  if (오늘한국(new Date('2026-08-13T07:55:00+09:00')) !== '2026-08-13') {
    console.error('⛔ 만든날이 UTC 로 찍힌다 — 한국 아침에 돌리면 하루 이르다'); 틀림++
  }
  if (오늘한국(new Date('2026-08-13T23:30:00+09:00')) !== '2026-08-13') {
    console.error('⛔ 만든날이 한국 밤에 하루 늦게 찍힌다'); 틀림++
  }
  console.log(틀림 ? `⛔ 자가시험 ${틀림}건 실패` : `✅ 나이 축 자가시험 ${시험.length + 3}건 통과`)
  process.exit(틀림 ? 1 : 0)
}

const KEY = 키()
const 낸다 = { 만든날: 오늘한국(), 출처: {}, 임금: {}, 살림: {}, 혼인: {} }

// ① 나이대별 월급여 — 고용노동부 고용형태별근로실태조사
{
  const j = await 받기(KEY, '118', 'DT_118N_PAY0004', 4)
  낸다.출처.임금 = { 기관: '고용노동부', 표: '규모·학력·연령계층·성별 임금 및 근로조건', id: '118/DT_118N_PAY0004', 해: j[0].PRD_DE,
                   조건: '전규모(5인 이상) · 전학력 · 남녀 계' }
  for (const x of j) {
    if (!x.C1_NM?.startsWith('전규모') || x.C2_NM !== '전학력' || x.C3_NM !== '전체') continue
    if (!['월급여액', '평균근속년수', '근로자수'].includes(x.ITM_NM)) continue
    const 칸 = (낸다.임금[x.C4_NM] ??= {})
    칸[{ 월급여액: '월급여천원', 평균근속년수: '근속년', 근로자수: '사람' }[x.ITM_NM]] = 수(x.DT)
  }
}

// ② 가구주 나이대별 살림 — 국가데이터처 가계금융복지조사
{
  const j = await 받기(KEY, '101', 'DT_1HDAAA06', 3)
  낸다.출처.살림 = { 기관: '국가데이터처', 표: '가구주 연령계층별(10세) 자산·부채·소득', id: '101/DT_1HDAAA06', 해: j[0].PRD_DE,
                   단위: '만원', 조건: '전체 가구(부채 보유 여부를 가리지 않음)' }
  const 볼항목 = { 자산: '자산', 부채: '부채', 순자산: '순자산', '경상소득(전년도)': '경상소득', 가구주연령: null }
  for (const x of j) {
    if (x.C1_NM !== '전체' || !x.C2_NM || x.C2_NM === '전체') continue
    const 이름 = 볼항목[x.C3_NM]
    if (!이름) continue
    const 칸 = (낸다.살림[x.C2_NM] ??= {})
    // ⚠ 「전가구 평균」과 「보유가구 중앙값」은 모수가 다르다.
    //    부채 중앙값은 **부채가 있는 가구만** 놓고 잰 값이라 평균보다 클 수 있다.
    //    이름에 그 사실을 박아 다음 사람이 섞어 쓰지 못하게 한다.
    if (x.ITM_NM === '전가구 평균') 칸[`${이름}_전가구평균`] = 수(x.DT)
    if (x.ITM_NM === '보유가구 중앙값') 칸[`${이름}_보유가구중앙`] = 수(x.DT)
    // 🔴 **보유가구 비율**을 같이 굳힌다 (8번 2026-08-13).
    //    이 수가 없으면 중앙값을 읽을 수가 없다 — 29세 이하는 **절반(50.2%)만 부채가 있다.**
    //    그런데도 「부채 가운데값 7,000만원」이라고만 적으면 나머지 절반(빚 0)이 사라진다.
    //    ⛔ 중앙값을 지면에 싣는 곳은 이 비율을 **반드시 같이 적는다.**
    if (x.ITM_NM === '보유가구 비율') 칸[`${이름}_가진집비율`] = 수(x.DT)
  }
}

// ③ 초혼 나이 분포 — 국가데이터처 인구동향조사
//    표는 교차표다. 축1 = 남편 나이, 축2 = 아내 나이.
//    남편 분포는 「아내 = 계」인 줄, 아내 분포는 「남편 = 계」인 줄이다.
{
  const j = await 받기(KEY, '101', 'DT_1B83A36', 2)
  낸다.출처.혼인 = { 기관: '국가데이터처', 표: '초혼부부의 연령별 혼인', id: '101/DT_1B83A36', 해: j[0].PRD_DE,
                   주의: '남편·아내를 교차한 표다. 한쪽 분포는 반대쪽이 「계」인 줄을 본다' }
  const 남 = j.filter(x => x.C2_NM === '계' && x.C1_NM !== '계')
  const 여 = j.filter(x => x.C1_NM === '계' && x.C2_NM !== '계')
  const 합 = (a) => a.reduce((s, x) => s + (수(x.DT) ?? 0), 0)
  const 총 = 수(j.find(x => x.C1_NM === '계' && x.C2_NM === '계').DT)
  if (합(남) !== 총 || 합(여) !== 총) throw new Error(`혼인: 축 합이 계와 다르다 (남 ${합(남)} · 여 ${합(여)} · 계 ${총})`)

  const 낱나이 = Array.from({ length: 25 }, (_, i) => `${20 + i}세`)   // 20~44세는 한 살씩 나온다
  // 한쪽 축은 마흔부터 다섯 살씩 묶여 나온다. 없는 나이는 비운 채로 두고
  // 지면은 값이 있는 데까지만 그린다. 빈칸을 0 으로 채우면 거짓 그래프가 된다.
  const 값을 = (a, 키) => {
    const 줄 = 낱나이.map(n => 수(a.find(x => x[키] === n)?.DT))
    const 끝 = 줄.findIndex(v => v === null || v === undefined)
    return 끝 === -1 ? 줄 : 줄.slice(0, 끝)
  }
  const 이하 = (a, 키, 나이) => {
    const 아래 = a.filter(x => {
      const m = String(x[키]).match(/^(\d+)/)
      if (String(x[키]).includes('미만')) return true
      if (!m) return false
      return Number(m[1]) <= 나이
    })
    return Number((합(아래) / 총 * 100).toFixed(1))
  }

  낸다.혼인 = {
    총건: 총,
    남편분포: { 시작나이: 20, 값: 값을(남, 'C1_NM') },
    아내분포: { 시작나이: 20, 값: 값을(여, 'C2_NM') },
    최다: { 남편: 남.filter(x => x.C1_NM !== '미상').sort((a, b) => 수(b.DT) - 수(a.DT))[0].C1_NM,
            아내: 여.filter(x => x.C2_NM !== '미상').sort((a, b) => 수(b.DT) - 수(a.DT))[0].C2_NM },
    누적: Object.fromEntries([25, 32, 40].map(나이 =>
      [나이, { 남편: 이하(남, 'C1_NM', 나이), 아내: 이하(여, 'C2_NM', 나이) }])),
  }
}

fs.mkdirSync(path.dirname(낼곳), { recursive: true })
fs.writeFileSync(낼곳, JSON.stringify(낸다, null, 2) + '\n', 'utf8')

const 나이수 = Object.keys(낸다.임금).length, 살림수 = Object.keys(낸다.살림).length
console.log(`✅ ${path.relative(뿌리, 낼곳)}  임금 ${나이수}띠 · 살림 ${살림수}띠`)
if (나이수 < 10 || 살림수 < 5) { console.error('⛔ 띠가 모자란다 — 축 이름이 바뀌었을 수 있다. 지면에 쓰기 전에 눈으로 본다'); process.exit(1) }
