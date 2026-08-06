#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
//  세션 ID 새로고침 — 여섯 개 cmd 의 `claude --resume <ID>` 를 실물에 맞춘다
//  만든 날 2026-08-06 · 입구 담당
//
//  왜 만들었나
//    ID 가 바뀌면 사장님이 .claude\projects 를 열어 눈으로 찾아 cmd 6개를
//    메모장으로 고치게 돼 있었다. 필수지시 11 「사람을 거치는 계획을 세우지 않는다」.
//
//  어떻게 찾나 — 두 단계다. 파일 이름이나 날짜만 믿지 않는다
//    ① cwd      각 .jsonl 안에 기록된 작업 폴더. 1·2·3번은 이것만으로 갈린다
//    ② 표식      4·5·6번은 cwd 가 셋 다 Desktop 이라 안 갈린다.
//                대화 내용의 고정 문구(「너는 klifemap 4번 세션이다」 등)로 가른다
//
//  ⛔ 표식을 못 찾으면 **그 자리는 손대지 않는다.** 틀린 ID 를 쓰는 것보다 낫다.
//
//  🔴 첫 판에 5번과 6번을 서로 바꿔 놓을 뻔했다 (2026-08-06, 미리보기로 잡음)
//     원인: 대화 **전체**에서 낱말을 찾았다. 6번이 세션간 메모를 읽은 기록에
//           「K Culture Wire」가 들어 있어 6번이 5번으로 잡혔다.
//     고친 것 둘 —
//       ⓐ **사람이 친 말만 본다.** tool_result(= 남의 문서를 읽은 것)를 뺀다.
//          message.content 가 문자열인 것만 쓴다. 배열이면 도구 결과가 섞인 것이다
//       ⓑ **자기 호칭만 표식으로 쓴다.** 「너는 klifemap 4번 세션이다」처럼
//          그 세션에게 **주어진 지시문**에만 나오는 문구여야 한다.
//          사이트 이름(「서울마켓」 「백년지도」)은 아무나 말한다. 표식이 안 된다
//       ⓒ 두 자리에 동시에 걸리면 **아무 자리에도 안 준다**(아래 겹침 검사)
//     사람 발언이 하나도 없는 기록도 뺀다 — 하위 에이전트가 남긴 것이라 자리가 아니다
//
//  쓰는 법
//    node _세션ID-찾기.mjs          고친다
//    node _세션ID-찾기.mjs --dry    보기만 한다 (파일을 안 건드린다)
//    node _세션ID-찾기.mjs --id 6   6번 ID 한 줄만 찍는다. 못 찾으면 아무것도 안 찍고 1 로 끝난다
//                                   ← 각 cmd 가 「못 열렸을 때」 이걸 부른다. 파일을 안 건드린다.
//                                     실행 중인 .cmd 를 고치면 cmd.exe 가 엉뚱한 줄을 읽는다
// ─────────────────────────────────────────────────────────────

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const 여기 = path.dirname(fileURLToPath(import.meta.url))
const 프로젝트함 = path.join(process.env.USERPROFILE || 'C:\\Users\\USER', '.claude', 'projects')
const 미리보기 = process.argv.includes('--dry')
// --id N  →  그 자리 ID 한 줄만 찍고 끝낸다. 파일을 안 건드린다
const 한줄만 = (() => {
  const i = process.argv.indexOf('--id')
  return i >= 0 ? process.argv[i + 1] : null
})()

// 며칠 안에 손댄 것만 본다. 오래된 것은 그 자리의 현역이 아니다
const 유효일 = 14

const 자리들 = [
  {
    번호: '1', 이름: 'KLifeMap', 파일: '1번_KLifeMap.cmd',
    cwd: /[\\/]GitHub[\\/]klifemap$/i, 표식: [],
  },
  {
    번호: '2', 이름: '조율', 파일: '2번_조율.cmd',
    cwd: /[\\/]GitHub[\\/]dataeconomics$/i, 표식: [],
  },
  {
    번호: '3', 이름: '백년지도', 파일: '3번_백년지도.cmd',
    cwd: /[\\/]작업공유$/, 표식: [],
  },
  {
    번호: '4', 이름: 'KLifeMap보조', 파일: '4번_KLifeMap보조.cmd',
    cwd: /[\\/]Desktop$/i,
    // ⛔ 「4번_작업함」(폴더 이름)을 넣었다가 **1번을 통째로 떨어뜨렸다** (4번이 잡음, 2026-08-06)
    //    1번은 4번에게 지시하며 그 폴더 이름을 기록에 적는다 → 1번 기록이 4번 표식에 걸린다
    //    → 「두 자리에 걸리면 어느 쪽에도 안 준다」에 막혀 1번 자리가 4일 전 것으로 내려갔다.
    //    내가 머리에 「자기 호칭만 쓴다」고 적어 놓고 스스로 어겼다. **호칭만 남긴다.**
    표식: [/너는 klifemap 4번 세션이다/i, /\[4번 · 매시간/],
  },
  {
    번호: '5', 이름: '케이컬처와이어', 파일: '5번_케이컬처와이어.cmd',
    cwd: /[\\/]Desktop$/i,
    표식: [/5번\(K Culture Wire ?\/ ?WikiTip\)/i, /5번\(위키팁/, /너는 .{0,10}5번/],
  },
  {
    번호: '6', 이름: '서울마켓', 파일: '6번_서울마켓.cmd',
    cwd: /[\\/]Desktop$/i,
    표식: [/\[6번 매시간/, /6번\(SeoulMarkets\)/i, /너는 .{0,10}6번/],
  },
]

// ── .jsonl 한 개를 읽어 cwd 와 「사람이 친 말」을 뽑는다 ─────────
// 180MB 짜리가 있다. 통째로 읽지 않는다. 앞부분에서 cwd, 뒷부분에서 발언을 본다.
function 읽기(파일경로) {
  const fd = fs.openSync(파일경로, 'r')
  try {
    const 크기 = fs.fstatSync(fd).size

    const 앞크기 = Math.min(크기, 256 * 1024)
    const 앞 = Buffer.alloc(앞크기)
    fs.readSync(fd, 앞, 0, 앞크기, 0)

    const 뒤크기 = Math.min(크기, 3 * 1024 * 1024)
    const 뒤 = Buffer.alloc(뒤크기)
    fs.readSync(fd, 뒤, 0, 뒤크기, 크기 - 뒤크기)

    let cwd = null
    for (const 줄 of 앞.toString('utf8').split('\n')) {
      try { const o = JSON.parse(줄); if (o.cwd) { cwd = o.cwd; break } } catch {}
    }

    // 뒤쪽 첫 줄은 잘려 있을 수 있다. 버린다
    const 말 = []
    for (const 줄 of 뒤.toString('utf8').split('\n').slice(1)) {
      let o
      try { o = JSON.parse(줄) } catch { continue }
      if (o.type !== 'user' || !o.message) continue
      const c = o.message.content
      // ⛔ 배열이면 tool_result 다 — 남의 문서를 읽은 것이지 이 세션이 한 말이 아니다
      if (typeof c !== 'string') continue
      const t = c.trim()
      if (!t || t.startsWith('<')) continue        // 시스템이 끼워 넣은 것도 뺀다
      말.push(t)
    }
    return { cwd, 말: 말.join('\n'), 발언수: 말.length }
  } finally {
    fs.closeSync(fd)
  }
}

// ── 후보를 모은다 ────────────────────────────────────────────
const 자른선 = Date.now() - 유효일 * 86400_000
const 후보 = []

for (const 함 of fs.readdirSync(프로젝트함, { withFileTypes: true })) {
  if (!함.isDirectory()) continue
  const 함경로 = path.join(프로젝트함, 함.name)
  for (const 이름 of fs.readdirSync(함경로)) {
    if (!이름.endsWith('.jsonl')) continue
    const 경로 = path.join(함경로, 이름)
    const st = fs.statSync(경로)
    if (st.mtimeMs < 자른선) continue
    후보.push({ id: 이름.slice(0, -6), 경로, mtime: st.mtimeMs, 크기: st.size })
  }
}
후보.sort((a, b) => b.mtime - a.mtime)   // 최근 것부터

for (const c of 후보) Object.assign(c, 읽기(c.경로))

// 사람이 한 말이 하나도 없으면 자리가 아니다 — 하위 에이전트가 남긴 기록이다
const 살아있는후보 = 후보.filter((c) => c.발언수 > 0)

// ── 겹치는 것을 먼저 버린다 ──────────────────────────────────
// 한 기록이 두 자리 표식에 걸리면 **어느 쪽에도 주지 않는다.**
// 5·6번을 서로 바꿔 놓을 뻔한 것이 이 검사가 없어서였다.
for (const c of 살아있는후보) {
  c.걸린자리 = 자리들
    .filter((자리) => 자리.표식.length && 자리.표식.some((r) => r.test(c.말)))
    .map((자리) => 자리.번호)
}
const 겹침 = 살아있는후보.filter((c) => c.걸린자리.length > 1)

// ── 자리마다 고른다 ──────────────────────────────────────────
// 최근 것부터 훑으며 조건에 맞는 첫 번째를 잡는다.
// 한 세션이 두 자리에 잡히지 않게 잡힌 것은 뺀다.
const 잡힘 = new Set()
const 결과 = []

for (const 자리 of 자리들) {
  let 골랐다 = null
  for (const c of 살아있는후보) {
    if (잡힘.has(c.id)) continue
    if (!c.cwd || !자리.cwd.test(c.cwd)) continue
    if (자리.표식.length) {
      if (c.걸린자리.length !== 1 || c.걸린자리[0] !== 자리.번호) continue
    } else if (c.걸린자리.length) {
      continue    // 1·2·3번 자리에 4·5·6번 표식이 붙은 것이 오면 그것도 아니다
    }
    골랐다 = c
    break
  }
  if (골랐다) 잡힘.add(골랐다.id)
  결과.push({ 자리, 골랐다 })
}

// ── --id N : 한 줄만 찍고 끝 ─────────────────────────────────
if (한줄만) {
  const 찾음 = 결과.find((r) => r.자리.번호 === 한줄만)
  if (!찾음 || !찾음.골랐다) process.exit(1)   // 아무것도 안 찍는다. cmd 가 이걸로 판단한다
  process.stdout.write(찾음.골랐다.id)
  process.exit(0)
}

// ── cmd 를 고친다 ────────────────────────────────────────────
const 줄 = []
let 바뀐수 = 0
let 못찾음 = 0

for (const { 자리, 골랐다 } of 결과) {
  const cmd경로 = path.join(여기, 자리.파일)
  if (!fs.existsSync(cmd경로)) {
    줄.push(`${자리.번호}번 ${자리.이름.padEnd(14)} ⛔ cmd 파일이 없다 — ${자리.파일}`)
    못찾음++
    continue
  }
  const 원본 = fs.readFileSync(cmd경로, 'utf8')
  const 지금 = (원본.match(/claude --resume ([0-9a-f-]{36})/) || [])[1] || null

  if (!골랐다) {
    줄.push(`${자리.번호}번 ${자리.이름.padEnd(14)} ⬜ 못 찾음 — **안 건드렸다**. 지금 값 ${지금 ?? '(없음)'} 유지`)
    못찾음++
    continue
  }
  const 나이 = ((Date.now() - 골랐다.mtime) / 3600_000).toFixed(1)
  if (지금 === 골랐다.id) {
    줄.push(`${자리.번호}번 ${자리.이름.padEnd(14)} ✅ 그대로  ${골랐다.id}  (${나이}시간 전)`)
    continue
  }
  if (!미리보기) {
    fs.writeFileSync(cmd경로, 원본.replace(/claude --resume [0-9a-f-]{36}/, `claude --resume ${골랐다.id}`), 'utf8')
  }
  줄.push(
    `${자리.번호}번 ${자리.이름.padEnd(14)} 🔵 ${미리보기 ? '바꿀 것' : '바꿨다'}  ${지금 ?? '(없음)'}\n` +
    `${' '.repeat(20)}                  → ${골랐다.id}  (${나이}시간 전)`
  )
  바뀐수++
}

console.log('')
console.log('  세션 ID 새로고침' + (미리보기 ? '  — 미리보기(파일 안 건드림)' : ''))
console.log('  ' + '─'.repeat(72))
for (const l of 줄) console.log('  ' + l)
console.log('  ' + '─'.repeat(72))
console.log(
  `  훑은 세션 ${후보.length}개 (최근 ${유효일}일) · 사람 발언 있는 것 ${살아있는후보.length}개` +
  ` · 바뀜 ${바뀐수} · 못 찾음 ${못찾음}`
)
if (겹침.length) {
  console.log('')
  console.log('  ⚠ 두 자리 표식에 동시에 걸려 **버린** 기록 ' + 겹침.length + '개:')
  for (const c of 겹침) console.log(`     ${c.id}  ← ${c.걸린자리.join('·')}번 표식에 동시에 걸림`)
  console.log('     남의 이야기를 옮겨 적은 기록이다. 자리를 주면 안 된다.')
}
if (못찾음) {
  console.log('')
  console.log('  ⬜ 는 그 세션이 최근 ' + 유효일 + '일 안에 안 돌았다는 뜻이다.')
  console.log('     죽었으면 cmd 를 열었을 때 새 대화가 뜨고, 붙여 넣을 한 줄이 안내된다.')
}
console.log('')
process.exit(못찾음 ? 1 : 0)
