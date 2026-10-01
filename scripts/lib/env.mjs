/**
 * env.mjs — **`.env` 를 읽어 `process.env` 에 올린다.**
 *
 * ── 🔴 왜 (2026-10-01) ──────────────────────────────────────
 *   같은 열 줄짜리 장치가 **세 곳에 복제**되어 있었다 —
 *   `send-mail.mjs` · `gsc-by-date.mjs` · 그리고 내가 새로 만든 자.
 *   그중 `gsc-by-date.mjs` 는 그것이 «없어서» 한 번도 못 돌고 있었다(9/30 에 잡았다).
 *
 *   ⭐ 회사 규칙 — 「하나를 고치면 인용한 곳까지 따라간다」. 그 앞에 둘 것이 있다면
 *     **애초에 한 곳에만 두는 것**이다. 그래서 여기로 뺀다.
 *
 * ⛔ 이미 들어 있는 값을 «덮지 않는다» — 셸에서 준 값이 파일보다 세다.
 * ⛔ 값을 화면에 찍지 않는다. 시크릿이 그대로 로그에 남는다.
 * ⚠ 정규식으로 줄을 가른다. `=` 가 값 안에 또 있어도 첫 `=` 에서만 가른다.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

/** 한 줄에서 이름과 값을 가른다. 주석·빈 줄이면 null */
export function 줄가르기(줄) {
  const m = String(줄 ?? '').match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
  if (!m) return null;
  return { 이름: m[1], 값: m[2].trim().replace(/^["']|["']$/g, '') };
}

/**
 * `.env` 를 읽어 올린다. 없으면 조용히 넘어간다(없는 것이 정상인 자리도 있다).
 * @returns 올린 이름들 — ⛔ 값은 돌려주지 않는다
 */
export function 환경읽기(길 = '.env') {
  let 본문;
  try { 본문 = readFileSync(path.resolve(길), 'utf8'); } catch { return []; }
  const 올린것 = [];
  for (const 줄 of 본문.split(/\r?\n/)) {
    const 것 = 줄가르기(줄);
    if (!것) continue;
    if (process.env[것.이름] !== undefined) continue;   /* ⛔ 셸 값을 안 덮는다 */
    process.env[것.이름] = 것.값;
    올린것.push(것.이름);
  }
  return 올린것;
}
