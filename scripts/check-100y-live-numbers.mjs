#!/usr/bin/env node
/**
 * **라이브에 찍힌 수가 자료와 같은가** — 100yearmap.com 을 실제로 받아서 잰다.
 *
 *   node scripts/check-100y-live-numbers.mjs            뽑아서 잰다(기본 30장)
 *   node scripts/check-100y-live-numbers.mjs --몇장 60   장수를 정한다
 *   node scripts/check-100y-live-numbers.mjs --자가시험
 *
 * ## 🔴 왜 만들었나 (8번 · 2026-08-14 17:0x)
 *
 *   오늘까지 잰 것은 전부 **저장소 안의 값**이다 — 자료끼리, 자료와 원본이 같은가.
 *   ⛔ 그런데 손님은 자료를 안 본다. **라이브 지면에 찍힌 글자**를 본다.
 *   배포가 밀리거나 빌드가 옛것이면 자료는 맞고 지면만 틀린다. 그 자리를 아무도 안 재고 있었다.
 *
 * ## ⚠ 이 자가 못 보는 것
 *
 *   · 눈으로 보는 것을 대신하지 못한다(자리·글자 크기·잘림은 못 본다)
 *   · 뽑아서 잰다 — 전수가 아니다. 몇 장을 쟀는지 화면에 적는다
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const 방 = path.join(뿌리, 'src/data/100yearmap')
const 밑동 = 'https://100yearmap.com'

/** 태그를 걷어 내고 글자만 남긴다 */
export const 글자만 = (html) => String(html).replace(/<script[\s\S]*?<\/script>/g, ' ')
  .replace(/<style[\s\S]*?<\/style>/g, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/\s+/g, ' ')

/** 「같은 지역 고등학교 119곳」에서 119 를 꺼낸다 */
export function 수뽑기(글, 앞말, 뒷말 = '곳|개') {
  // ⚠ 지면마다 세는 말이 다르다 — 학교는 「119곳」, 학과는 「17 개 고등학교에 있습니다」.
  //    「곳」만 찾다가 멀쩡한 학과 지면 10장을 빨강으로 세웠다(2026-08-14 17:5x).
  const 자 = new RegExp(`${앞말}\\s*([0-9,]+)\\s*(?:${뒷말})`)
  const m = String(글).match(자)
  return m ? Number(m[1].replace(/,/g, '')) : null
}

if (process.argv.includes('--자가시험')) {
  let 틀림 = 0
  const 본다 = (참, 말) => { if (!참) { console.error(`⛔ ${말}`); 틀림++ } }
  본다(글자만('<p>가 <b>나</b></p>') === ' 가 나 ', '태그를 못 걷어 낸다')
  본다(글자만('<script>var a=1</script>나') === ' 나', '스크립트 안 글자를 남긴다')
  본다(수뽑기('같은 지역 고등학교 119곳', '같은 지역 고등학교') === 119, '수를 못 뽑는다')
  본다(수뽑기('전국 1,234곳', '전국') === 1234, '쉼표 있는 수를 못 뽑는다')
  본다(수뽑기('전국 17 개 고등학교에 있습니다', '전국') === 17, '「N 개」 꼴을 못 뽑는다')
  본다(수뽑기('아무 글', '전국') === null, '없는 수를 있다고 한다')
  console.log(틀림 ? `⛔ 자가시험 ${틀림}건 실패` : '✅ 자가시험 5건 통과')
  process.exit(틀림 ? 1 : 0)
}

const 몇장 = Number(process.argv[process.argv.indexOf('--몇장') + 1]) || 30
const 읽기 = (f) => JSON.parse(fs.readFileSync(path.join(방, f), 'utf8'))
const 학교 = 읽기('pages-school.json')
const 학과 = 읽기('pages-major.json')

/** 고르게 뽑는다 — 앞에서만 뽑으면 「가」로 시작하는 것만 본다 */
const 골라내기 = (배열, 수) => {
  const 걸음 = Math.max(1, Math.floor(배열.length / 수))
  return 배열.filter((_, i) => i % 걸음 === 0).slice(0, 수)
}

const 볼것 = [
  ...골라내기(학교, Math.ceil(몇장 / 2)).map((s) => ({
    길: `/school/${s.code}`, 이름: s.title,
    잴것: [{ 앞말: '같은 지역 고등학교', 있어야: s.같은지역_고교수 }],
  })),
  // ⚠ 주소는 **자료에 적힌 url** 을 쓴다. 이름으로 만들면 안 된다 —
  //    「전자과(2・1)」은 지면 주소가 `/major/전자과2-1` 이라 이름으로 만들면 404 가 난다.
  ...골라내기(학과, Math.floor(몇장 / 2)).map((m) => ({
    길: m.url ?? `/major/${encodeURIComponent(m.title)}`, 이름: m.title,
    잴것: [{ 앞말: '전국', 있어야: m.전국개설교수 }],
  })),
]

let 잰장 = 0
let 같은칸 = 0
const 다른칸 = []
const 못받음 = []

for (const 것 of 볼것) {
  let 글
  try {
    const r = await fetch(밑동 + 것.길, { redirect: 'follow' })
    if (!r.ok) { 못받음.push(`${것.길} — ${r.status}`); continue }
    글 = 글자만(await r.text())
  } catch (e) { 못받음.push(`${것.길} — ${e.message}`); continue }
  잰장++
  for (const { 앞말, 있어야 } of 것.잴것) {
    const 찍힌 = 수뽑기(글, 앞말)
    if (찍힌 === null) { 다른칸.push(`${것.길} — 「${앞말} N곳」이 지면에 없다`); continue }
    if (찍힌 === 있어야) 같은칸++
    else 다른칸.push(`${것.길} ${앞말} — 라이브 ${찍힌} · 자료 ${있어야}`)
  }
}

console.log(`\n── 라이브 ${밑동} — ${잰장}장을 받아 잼(고르게 뽑았다)`)
console.log(`\n맞은 수 ${같은칸}개 · 다른 칸 ${다른칸.length}개 · 못 받은 지면 ${못받음.length}장`)
for (const d of 다른칸.slice(0, 15)) console.log(`  🔴 ${d}`)
for (const m of 못받음.slice(0, 10)) console.log(`  ⛔ ${m}`)
if (!다른칸.length && !못받음.length) console.log('✅ 통과 — 라이브에 찍힌 수가 자료와 같다')
console.log('⚠ 뽑아서 잰 것이다. 전수가 아니다. ⛔ 눈으로 보는 것을 대신하지 못한다')
process.exit(다른칸.length || 못받음.length ? 1 : 0)
