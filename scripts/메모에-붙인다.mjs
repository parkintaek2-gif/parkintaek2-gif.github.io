#!/usr/bin/env node
/**
 * 메모에-붙인다.mjs — **세션간 메모에 글을 붙이면서 시각을 «자가» 채운다.**
 *
 * ── 🔴🔴 왜 만들었나 (2026-10-04 · 5번) ─────────────────────────────────
 * 오늘 하루에 같은 흠을 **세 번** 고쳤다 — 메모 제목에 「17:1x」·「18:0x」처럼
 * 끝자리를 비워 두고 올린 것이다. `check-kcw-memo-clock` 이 세 번 다 잡았다.
 *
 * 왜 그랬나 — **글을 쓰는 때와 올리는 때가 다르다.** 글을 길게 쓰는 동안 분이 바뀌니
 * 「x」로 두었고, 그대로 나갔다. 그 줄은 받는 사람에게 아무 뜻이 없다.
 *
 * ⛔ 「다음부터 조심한다」로 두지 않는다. 사람이 기억해서 지키는 구조를 만들지 않는다.
 * ⇒ **붙이는 순간에 자가 시각을 박는다.** 그러면 영영 안 틀린다.
 *
 * ⚠ 시각은 이 PC 시계를 그대로 쓴다 — 이 PC 가 이미 한국시간이다.
 *   `toISOString()` 을 쓰지 않는다(그것은 UTC 로 바꿔 아홉 시간을 당긴다).
 *
 * 쓰는 법
 *   node scripts/메모에-붙인다.mjs --글 <파일> --머리 "[5번 → 1번] {시각} — 무엇무엇"
 *   node scripts/메모에-붙인다.mjs --자가시험
 *
 *   머리글의 `{시각}` 자리에 지금 시각(HH:MM)이 들어간다.
 *   `{시각}` 이 없으면 머리글을 그대로 쓴다 — 억지로 끼워 넣지 않는다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 메모길 = path.join(뿌리, 'docs', '세션간-메모.md');

/** 지금 시각 HH:MM. ⛔ toISOString 을 쓰지 않는다 — 이 PC 가 이미 한국시간이다 */
export function 지금시각(때 = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${p(때.getHours())}:${p(때.getMinutes())}`;
}

/** 머리글의 {시각} 을 채운다. ⛔ 자리가 없으면 그대로 둔다 */
export function 시각채우기(머리, 때 = new Date()) {
  const s = String(머리 ?? '');
  return s.includes('{시각}') ? s.split('{시각}').join(지금시각(때)) : s;
}

/** 끝자리를 비운 시각이 남아 있나 — 「18:0x」·「14:2x」 꼴 */
export function 안채운시각있나(글) {
  const s = String(글 ?? '');
  for (let i = 0; i + 4 < s.length; i += 1) {
    if (s[i + 2] !== ':') continue;
    const 시 = s.slice(i, i + 2);
    const 분앞 = s[i + 3];
    const 분뒤 = s[i + 4];
    if (!/^\d\d$/.test(시) || !/^\d$/.test(분앞)) continue;
    if (분뒤 === 'x' || 분뒤 === 'X') return true;
  }
  return false;
}

/* ── 자가시험 ─────────────────────────────────────────────────────────── */
export function 자가시험() {
  const 결과 = [];
  const 본다 = (이름, 참) => 결과.push({ 이름, 참: !!참 });

  const 때 = new Date(2026, 9, 4, 18, 7);
  본다('시각을 HH:MM 으로 낸다', 지금시각(때) === '18:07');
  본다('한 자리 시각도 두 자리로', 지금시각(new Date(2026, 9, 4, 9, 5)) === '09:05');

  본다('{시각} 을 채운다', 시각채우기('[5번] {시각} — 무엇', 때) === '[5번] 18:07 — 무엇');
  본다('여러 번 나와도 다 채운다',
    시각채우기('{시각} ~ {시각}', 때) === '18:07 ~ 18:07');
  본다('⛔ 자리가 없으면 그대로 둔다 — 억지로 끼우지 않는다',
    시각채우기('[5번] 무엇', 때) === '[5번] 무엇');
  본다('⛔ null 에도 안 터진다', 시각채우기(null, 때) === '');

  본다('🔴 「18:0x」를 잡는다', 안채운시각있나('## [진행] 5번 18:0x — 무엇'));
  본다('🔴 「14:2x」도 잡는다', 안채운시각있나('14:2x'));
  본다('⛔ 제대로 적은 시각은 안 잡는다', !안채운시각있나('## [진행] 5번 18:07 — 무엇'));
  본다('⛔ 그냥 글에는 안 걸린다', !안채운시각있나('무엇무엇 x 를 곱한다'));
  본다('⛔ 빈 글·null 에도 안 터진다', !안채운시각있나('') && !안채운시각있나(null));

  const 빨강 = 결과.filter((r) => !r.참).length;
  console.log('■ 메모에 붙인다 — 자가시험');
  for (const r of 결과) console.log(`  ${r.참 ? '✅' : '🔴'} ${r.이름}`);
  console.log(빨강 ? `🔴 빨강 ${빨강}개` : `✅ ${결과.length}가지 다 통과`);
  return 빨강 === 0;
}

/* ── 혼자 돌 때 ───────────────────────────────────────────────────────── */
const 내가실행됐다 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가실행됐다) {
  if (process.argv.includes('--selftest') || process.argv.includes('--자가시험')) {
    process.exit(자가시험() ? 0 : 1);
  }
  const 값 = (이름, 기본 = null) => {
    const i = process.argv.indexOf(이름);
    return i >= 0 ? process.argv[i + 1] : 기본;
  };
  const 글길 = 값('--글');
  const 머리 = 값('--머리');
  if (!글길 || !머리) {
    console.log('⛔ 쓰는 법: node scripts/메모에-붙인다.mjs --글 <파일> --머리 "[5번 → 1번] {시각} — 무엇"');
    process.exit(1);
  }
  if (!fs.existsSync(글길)) { console.log(`⛔ 글 파일이 없다 — ${글길}`); process.exit(1); }

  const 몸 = fs.readFileSync(글길, 'utf8');
  if (안채운시각있나(몸)) {
    console.log('🔴 글 «본문»에 끝자리를 비운 시각이 있다(「18:0x」 꼴) — 채우고 다시 부른다');
    process.exit(1);
  }
  const 찍은머리 = 시각채우기(머리);
  if (안채운시각있나(찍은머리)) {
    console.log('🔴 머리글에 끝자리를 비운 시각이 있다 — {시각} 을 쓰면 자가 채운다');
    process.exit(1);
  }

  const 붙일것 = `\n## ${찍은머리}\n\n${몸.replace(/^\n+/, '')}`;
  fs.appendFileSync(메모길, 붙일것, 'utf8');
  console.log(`✅ 붙였다 — ## ${찍은머리}`);
  console.log('   ⭐ 커밋·푸시까지 해야 남에게 닿는다');
}
