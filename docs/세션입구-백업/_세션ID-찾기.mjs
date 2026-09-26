#!/usr/bin/env node
/**
 * _세션ID-찾기.mjs — **단추가 못 열었을 때 그 자리의 세션을 찾아 준다.** (마지막 수단)
 *
 * ── 🔴 2026-09-27 에 통째로 다시 썼다. 왜인가 ────────────────────
 * 옛 판은 자리를 «작업 폴더(cwd)와 말투 표식»으로 «추측»했다. 그것이 틀렸다.
 *
 *   1번 = GitHub/klifemap · 2번 = GitHub/dataeconomics · 5번 = Desktop + 말투
 *
 * 그런데 지금 2번과 5번이 «같은» dataeconomics 에서 일한다. 그래서 실측하니 —
 *
 *   --id 1 →  2번의 ID 를 주었다
 *   --id 2 →  5번의 ID 를 주었다
 *   --id 5 →  아무것도 안 주었다
 *
 * ⛔ 단추가 그 답을 받아 열었으면 **사장님이 남의 세션을 여셨을 것이다.**
 *   사장님이 「제대로 작동하는지 꼭 테스트해봐」라고 하셔서 돌려 보고 잡았다.
 *
 * ── ⭐ 이제는 추측하지 않는다 ────────────────────────────────────
 * 자리마다 설정폴더가 다르다 — `.claude-u1` · `.claude-u2` · `.claude-u5`.
 * **그 폴더가 곧 자리다.** `.claude-u5/projects` 안에 있으면 5번 것이다. 확실하다.
 * 말투나 폴더 이름으로 맞혀 볼 까닭이 없어졌다.
 *
 * ⚠ 이 파일은 바탕화면에서 돈다. 저장소가 없어도 혼자 돌아야 하므로 자리 목록을
 *   여기에 «짧게» 박는다. 정본은 저장소의 scripts/lib/seats.mjs 이고,
 *   자리가 바뀌면 `node scripts/build-session-entry.mjs --짓는다` 가 이 파일도 다시 깐다.
 *
 * 쓰는 법
 *   node _세션ID-찾기.mjs --id 5      그 자리 ID 한 줄만 찍는다 (단추가 이렇게 부른다)
 *   node _세션ID-찾기.mjs             자리마다 무엇을 찾았는지 다 보여 준다
 *   node _세션ID-찾기.mjs --자가시험
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const 집 = process.env.USERPROFILE || 'C:\\Users\\USER'

/** 지금 도는 자리. 정본은 저장소 scripts/lib/seats.mjs 다 */
export const 자리번호 = [1, 2, 5]

/** 그 자리의 대화록 뿌리 — **이 폴더가 곧 자리다** */
export function 뿌리(번호) {
  return path.join(집, `.claude-u${번호}`, 'projects')
}

/** 며칠 안에 손댄 것만 본다. 오래된 것은 그 자리의 현역이 아니다 */
export const 유효일 = 14

/**
 * 그 자리의 대화록을 다 모아 «가장 최근에 손댄 것»을 고른다.
 * ⛔ 못 찾으면 «아무것도 주지 않는다.** 틀린 ID 를 주는 것보다 낫다 —
 *   틀린 ID 로 열면 사장님이 남의 세션에 지시하시게 된다.
 */
export function 자리세션(번호, { 지금 = Date.now(), 유효 = 유효일 } = {}) {
  const 방 = 뿌리(번호)
  if (!fs.existsSync(방)) return null
  const 자른선 = 지금 - 유효 * 86400_000
  const 것들 = []
  for (const 함 of fs.readdirSync(방, { withFileTypes: true })) {
    if (!함.isDirectory()) continue
    const 함경로 = path.join(방, 함.name)
    let 이름들 = []
    try { 이름들 = fs.readdirSync(함경로) } catch { continue }
    for (const 이름 of 이름들) {
      if (!이름.endsWith('.jsonl')) continue
      const 경로 = path.join(함경로, 이름)
      let st
      try { st = fs.statSync(경로) } catch { continue }
      if (st.mtimeMs < 자른선) continue
      /* ⚠ 아주 작은 것은 자리가 아니다 — 하위 에이전트가 남긴 부스러기다 */
      if (st.size < 4096) continue
      것들.push({ id: 이름.slice(0, -6), 경로, mtime: st.mtimeMs, 크기: st.size })
    }
  }
  if (!것들.length) return null
  것들.sort((a, b) => b.mtime - a.mtime)
  return 것들[0]
}

/* ── 자가시험 ─────────────────────────────────────────────────────── */
function 자가시험() {
  let 통과 = 0; const 실패 = []
  const 본다 = (이름, 참) => { if (참) { 통과 += 1; console.log('✅ ' + 이름) } else { 실패.push(이름); console.log('❌ ' + 이름) } }

  본다('자리 뿌리가 그 자리 폴더를 가리킨다', 뿌리(5).includes('.claude-u5'))
  본다('⛔ 자리마다 다른 폴더다', 뿌리(1) !== 뿌리(2))
  본다('⛔ 없는 폴더에도 안 터진다', 자리세션(99) === null)
  본다('⛔ 오래된 것만 있으면 안 준다 — 유효일을 0 으로', 자리세션(5, { 유효: 0 }) === null)

  /* 🔴 실측 — 세 자리가 «서로 다른» ID 를 내야 한다. 옛 판은 여기서 어긋났다 */
  const 낸것 = 자리번호.map((n) => [n, 자리세션(n)])
  for (const [n, s] of 낸것) 본다(`${n}번 세션을 찾았다`, !!s && /^[0-9a-f-]{36}$/.test(s.id))
  const ids = 낸것.map(([, s]) => s && s.id).filter(Boolean)
  본다('🔴 세 자리가 서로 다른 세션을 낸다 — 남의 것을 주면 안 된다',
    ids.length === new Set(ids).size)
  /* 그 ID 가 정말 그 폴더 «안»에 있나 */
  for (const [n, s] of 낸것) {
    본다(`${n}번이 낸 것이 .claude-u${n} 안에 있다`, !!s && s.경로.includes(`.claude-u${n}`))
  }

  console.log(`\n${실패.length ? '❌' : '✅'} 자가시험 ${통과}${실패.length ? ' · 실패 ' + 실패.length : ' 통과'}`)
  return !실패.length
}

/* ── 진입점 ───────────────────────────────────────────────────────── */
const 내가진입점 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
if (내가진입점 && (process.argv.includes('--자가시험') || process.argv.includes('--selftest'))) {
  process.exit(자가시험() ? 0 : 1)
} else if (내가진입점) {
  const i = process.argv.indexOf('--id')
  const 한줄만 = i >= 0 ? process.argv[i + 1] : null

  if (한줄만) {
    /* 🔴 단추가 이 출력을 그대로 받아 `claude --resume` 에 넣는다.
       ⛔ 못 찾으면 «아무것도 찍지 않는다». 찍으면 그것으로 열려 든다. */
    const s = 자리세션(Number(한줄만))
    if (s) process.stdout.write(s.id)
    process.exit(0)
  }

  console.log(`■ 자리별 세션 — 최근 ${유효일}일`)
  for (const n of 자리번호) {
    const s = 자리세션(n)
    if (!s) { console.log(`  ${n}번  🔴 못 찾았다 (${뿌리(n)})`); continue }
    const 때 = new Date(s.mtime).toLocaleString('ko-KR')
    console.log(`  ${n}번  ${s.id}  ${때}  ${(s.크기 / 1048576).toFixed(1)}MB`)
  }
}
