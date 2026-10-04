#!/usr/bin/env node
/**
 * 배포-한줄로.mjs — **열쇠 받기 → 관문 → 배포**를 한 번에.
 *
 * ── 🔴🔴 왜 만들었나 (2026-10-04 · 5번) ─────────────────────────────────
 * 오늘 배포를 다섯 번 돌렸는데 그중 **두 번이 「열쇠가 없다」로 헛돌았다.**
 * 까닭은 늘 같다 — 셸 한 줄에 `deploy-key` 와 `deploy` 를 이어 붙였는데,
 * 그 사이에 옆 자리가 커밋하거나 날이 바뀌면 **열쇠가 죽는다.** 그러면
 * `deploy` 가 빈 열쇠를 받고, 배경에서 조용히 멈춘 채 몇 분을 버린다.
 *
 * ⛔ 뒷문을 만드는 자가 아니다. `deploy-key` 의 물음에 **실제로 답해야** 열쇠가 나온다 —
 *   그 답은 `docs/되돌아간것.tsv` 를 «읽어야» 나오고, 이 자는 그 파일을 읽어 답한다.
 *   히스토리를 안 읽고 넘어가는 길은 여전히 없다. 사람 손이 하던 «옮겨 적기»만 없앤다.
 * ⭐ 그리고 열쇠를 받은 **그 자리에서 바로** 관문과 배포를 돌린다. 틈이 없으면 안 죽는다.
 *
 * ⚠ 이 자는 관문이 🔴 이면 **배포하지 않는다.** 관문을 건너뛰는 길은 없다.
 *
 * 쓰는 법
 *   node scripts/배포-한줄로.mjs
 *   node scripts/배포-한줄로.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 대장길 = path.join(뿌리, 'docs', '되돌아간것.tsv');

/** 「N번째 줄」을 집는다. ⛔ 못 집으면 null — 아무 줄이나 고르지 않는다 */
export function 몇째줄인가(글) {
  const m = /(\d+)\s*번째\s*줄/.exec(String(글 ?? ''));
  return m ? Number(m[1]) : null;
}

/**
 * 대장에서 N번째 줄(주석·빈 줄 뺀 것)의 «세 번째 칸»을 읽는다.
 * ⛔ 범위를 벗어나면 null. 빈 칸도 null — 빈 답을 보내면 열쇠가 안 나온다.
 */
export function 답찾기(대장글, 몇째) {
  if (!Number.isFinite(몇째) || 몇째 < 1) return null;
  const 줄 = String(대장글 ?? '').split(/\r?\n/)
    .filter((l) => l.trim() && !l.trim().startsWith('#'));
  const 그줄 = 줄[몇째 - 1];
  if (!그줄) return null;
  const 칸 = 그줄.split('\t');
  const 답 = (칸[2] ?? '').trim();
  return 답 || null;
}

/** 열쇠를 집는다. ⛔ 못 집으면 null */
export function 열쇠집기(글) {
  const m = /열쇠\s*—\s*([0-9a-f]{6,})/i.exec(String(글 ?? ''));
  return m ? m[1] : null;
}

export function 관문통과했나(글) {
  const s = String(글 ?? '');
  return s.includes('배포해도 된다') && !s.includes('배포하지 않는다');
}

/* ── 자가시험 ─────────────────────────────────────────────────────────── */
export function 자가시험() {
  const 결과 = [];
  const 본다 = (이름, 참) => 결과.push({ 이름, 참: !!참 });

  본다('「9번째 줄」을 집는다', 몇째줄인가('되돌아간것.tsv 의 **9번째 줄**에서') === 9);
  본다('⛔ 숫자가 없으면 null', 몇째줄인가('줄을 고르십시오') === null);
  본다('⛔ null 에도 안 터진다', 몇째줄인가(null) === null);

  const 대장 = ['# 머리말', '', '날\t누가\t첫째 답\t덧', '날\t누가\t둘째 답\t덧',
    '# 가운데 주석', '날\t누가\t셋째 답\t덧', '날\t누가\t\t빈 칸'].join('\n');
  본다('주석과 빈 줄을 세지 않는다', 답찾기(대장, 1) === '첫째 답');
  본다('가운데 주석도 건너뛴다', 답찾기(대장, 3) === '셋째 답');
  본다('⛔ 칸이 비면 null — 빈 답을 보내지 않는다', 답찾기(대장, 4) === null);
  본다('⛔ 범위를 넘으면 null', 답찾기(대장, 99) === null);
  본다('⛔ 0 이나 음수도 null', 답찾기(대장, 0) === null && 답찾기(대장, -1) === null);

  본다('열쇠를 집는다', 열쇠집기('✅ 열쇠 — 7bbcd52d5b') === '7bbcd52d5b');
  본다('⛔ 열쇠가 없으면 null', 열쇠집기('🔴 열쇠가 없다') === null);

  본다('관문이 열리면 참', 관문통과했나('✅ 배포해도 된다'));
  본다('🔴 막히면 거짓', !관문통과했나('🔴 최신이 아니다\n⛔ **배포하지 않는다.**'));
  본다('⛔ 둘 다 있으면 거짓 — 막힌 쪽을 믿는다',
    !관문통과했나('✅ 배포해도 된다\n⛔ 배포하지 않는다'));

  const 빨강 = 결과.filter((r) => !r.참).length;
  console.log('■ 배포 한 줄로 — 자가시험');
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
  const 돌려 = (자, ...인자) =>
    execFileSync('node', [path.join(뿌리, 'scripts', 자), ...인자], { encoding: 'utf8', cwd: 뿌리 });

  console.log('■ ① 히스토리를 읽고 물음을 받는다');
  let 물음 = '';
  try { 물음 = 돌려('deploy-key.mjs'); } catch (e) { 물음 = String(e.stdout ?? ''); }
  const 몇째 = 몇째줄인가(물음);
  if (몇째 === null) { console.log('🔴 물음에서 줄 번호를 못 집었다 — 손으로 한다'); process.exit(1); }
  console.log(`   되돌아간것.tsv 의 ${몇째}번째 줄`);

  const 답 = 답찾기(fs.readFileSync(대장길, 'utf8'), 몇째);
  if (!답) { console.log(`🔴 ${몇째}번째 줄의 「무엇이」 칸이 비었다 — 손으로 한다`); process.exit(1); }
  console.log(`   답 — ${답}`);

  console.log('\n■ ② 열쇠를 받는다');
  let 열쇠글 = '';
  try { 열쇠글 = 돌려('deploy-key.mjs', '--답', 답); } catch (e) { 열쇠글 = String(e.stdout ?? ''); }
  const 열쇠 = 열쇠집기(열쇠글);
  if (!열쇠) { console.log('🔴 열쇠를 못 받았다 — 답이 틀렸을 수 있다'); console.log(열쇠글.slice(0, 400)); process.exit(1); }
  console.log(`   열쇠 ${열쇠}`);

  console.log('\n■ ③ 관문');
  let 관문 = '';
  try { 관문 = 돌려('check-deploy-ready.mjs', '--열쇠', 열쇠); } catch (e) { 관문 = String(e.stdout ?? ''); }
  for (const l of 관문.split('\n')) if (/배포해도|🔴|⛔|⚠/.test(l)) console.log('   ' + l.trim());
  if (!관문통과했나(관문)) { console.log('\n⛔ 관문이 막았다 — 배포하지 않는다'); process.exit(1); }

  console.log('\n■ ④ 배포 — 7~13분 걸린다');
  try {
    const 낸것 = 돌려('deploy.mjs', '--열쇠', 열쇠);
    console.log(낸것.split('\n').slice(-12).join('\n'));
  } catch (e) {
    console.log(String(e.stdout ?? '').split('\n').slice(-12).join('\n'));
    process.exit(1);
  }
}
