#!/usr/bin/env node
/**
 * put-memo.mjs — 메모를 두 저장소에 붙이고 **제목의 시각을 «붙이는 순간»에 채운다.**
 *
 * 🔴 왜 만들었나 (2026-09-10 23:2x · 5번)
 *   오늘 나는 메모 제목의 시각을 **두 번이나 «미래»로 적었다.**
 *     22:36 에 쓴 글에 22:44 · 23:18 에 쓴 글에 23:38
 *   글을 다 쓰는 데 몇 분이 걸리니, 쓰기 «전»에 본 시각도 틀리고 «어림»으로 적은 것도 틀린다.
 *   그리고 그 반대로 「21:5x」처럼 «안 채운 자리»를 그대로 커밋한 것도 오늘 한 번 있었다.
 *
 * ⭐ 그래서 사람이 시각을 적지 않는다. 원고에는 자리표(`TTTT`)만 두고, 이 자가
 *   **파일을 쓰기 직전에** 시계를 찍어 그 수로 채운다. 어림도, 미래도, 빈 자리도 생기지 않는다.
 *
 * ⛔ 지키는 것
 *   · 파일이 «짧아지는» 쓰기를 거부한다 (2026-08-07 에 2번이 27,784줄을 날린 사고)
 *   · 제목 줄에 `:0x` 같은 안 채운 자리가 남아 있으면 쓰지 않는다
 *   · 본문에 「21:5x → 21:45」처럼 «기록»으로 적는 것은 정상이다 — 제목 줄만 본다
 *
 * 쓰는 법
 *   node scripts/put-memo.mjs <원고파일>
 *   node scripts/put-memo.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const 붙일곳들 = [
  'C:/Users/USER/Documents/GitHub/dataeconomics/docs/세션간-메모.md',
  'C:/Users/USER/Documents/GitHub/klifemap/docs/1번-4번-메모.md',
];

export const 자리표 = 'TTTT';

/** ⚠ 이 PC 는 이미 KST 다. 9시간을 더하지 않고 toISOString 도 쓰지 않는다 */
export function 시각글(d = new Date()) {
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

/** 자리표를 «지금» 시각으로 채운다. 자리표가 없으면 글을 그대로 둔다(있는 시각을 안 건드린다) */
export function 시각채우기(글, 이제 = 시각글()) {
  const s = String(글 ?? '');
  return { 글: s.split(자리표).join(이제), 몇: s.split(자리표).length - 1, 시각: 이제 };
}

/** 제목 줄에 안 채운 자리가 남았나. ⛔ 본문은 안 본다 — 기록으로 적는 것이 정상이다 */
export function 안채운제목들(글) {
  return String(글 ?? '').split(/\r?\n/).filter((l) => /^##\s/.test(l) && /\d:\dx|\d:[0-9]x|:[0-9]x/.test(l));
}

/** 붙인 결과. ⛔ 짧아지면 던진다 — 붙이는 일에서 파일이 짧아지는 경우는 없다 */
export function 붙인결과(원래, 새것) {
  if (typeof 원래 !== 'string') throw new Error('원래 내용을 못 읽었다 — 쓰지 않는다');
  if (typeof 새것 !== 'string' || !새것.trim()) throw new Error('붙일 내용이 비었다 — 쓰지 않는다');
  const 결과 = 원래 + (원래.endsWith('\n') || 원래 === '' ? '' : '\n') + 새것;
  if (결과.length <= 원래.length) throw new Error('짧아진다 — 쓰지 않는다');
  return 결과;
}

/* ── 자가시험 ─────────────────────────────────────────────── */
export function 자가시험() {
  let 통 = 0; const 막 = [];
  const 검 = (n, ok) => { if (ok) 통++; else 막.push(n); };

  검('시각을 두 자리로 낸다', 시각글(new Date(2026, 8, 10, 9, 5)) === '09:05');
  검('밤 시각도 맞다', 시각글(new Date(2026, 8, 10, 23, 18)) === '23:18');
  검('🔴 자리표를 지금 시각으로 채운다',
    시각채우기('## [5번] TTTT 제목', '23:28').글 === '## [5번] 23:28 제목');
  검('자리표가 여러 개면 다 채운다', 시각채우기('TTTT a TTTT', '01:02').몇 === 2);
  검('⛔ 자리표가 없으면 글을 그대로 둔다 — 이미 적힌 시각을 안 건드린다',
    시각채우기('## [5번] 22:36 제목', '23:28').글 === '## [5번] 22:36 제목');
  검('몇 개를 채웠나 알려 준다', 시각채우기('TTTT', '00:00').몇 === 1);
  검('⛔ null 도 견딘다', 시각채우기(null).글 === '');

  검('🔴 제목에 안 채운 자리가 있으면 잡는다',
    안채운제목들('## [5번] 22:3x 제목').length === 1);
  검('⛔ 본문의 «기록»은 잡지 않는다 — 「21:5x → 21:45」는 정상이다',
    안채운제목들('낸 것  21:5x 를 21:45 로 채웠다').length === 0);
  검('제목이 멀쩡하면 빈 목록', 안채운제목들('## [5번] 23:28 제목').length === 0);

  검('붙이면 길어진다', 붙인결과('가나', '다라').length === 5);
  검('줄바꿈을 끼워 준다', 붙인결과('가나', '다라').includes('\n'));
  검('이미 줄바꿈으로 끝나면 안 더한다', 붙인결과('가나\n', '다라') === '가나\n다라');
  let 던졌나 = false;
  try { 붙인결과(null, '가'); } catch { 던졌나 = true; }
  검('⛔ 원래를 못 읽으면 던진다 — 조용히 빈 값을 안 준다', 던졌나);
  던졌나 = false;
  try { 붙인결과('가', '   '); } catch { 던졌나 = true; }
  검('⛔ 붙일 것이 비면 던진다', 던졌나);

  검('붙일 곳이 둘이다 — 한쪽만 붙여 「답 0건」이라 한 적이 있다', 붙일곳들.length === 2);
  검('klifemap 쪽도 들어 있다', 붙일곳들.some((p) => p.includes('klifemap')));

  console.log('자가시험 — put-memo.mjs\n');
  막.forEach((m) => console.log('  MAK ' + m));
  console.log(`\n통과 ${통} · 막힘 ${막.length}`);
  return 막.length === 0;
}

const 나 = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(나)) {
  if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);
  const 원고길 = process.argv.slice(2).find((a) => !a.startsWith('--'));
  if (!원고길) { console.log('⛔ 원고 파일을 준다 — node scripts/put-memo.mjs <파일>'); process.exit(1); }

  const 원고 = fs.readFileSync(원고길, 'utf8');
  const { 글, 몇, 시각 } = 시각채우기(원고);
  console.log('■ 시각을 «붙이는 순간»에 채웠다 — ' + 시각 + ' (자리표 ' + 몇 + '개)');
  const 남은 = 안채운제목들(글);
  if (남은.length) {
    console.error('🔴 제목에 안 채운 자리가 ' + 남은.length + '개 남았다 — 붙이지 않는다');
    남은.forEach((l) => console.error('   ' + l));
    process.exit(1);
  }
  for (const 길 of 붙일곳들) {
    const 옛 = fs.readFileSync(길, 'utf8');
    fs.writeFileSync(길, 붙인결과(옛, 글), 'utf8');
    console.log('  ok ' + path.basename(길) + '  ' + 옛.length + ' → ' + (옛.length + 글.length + 1));
  }
  process.exit(0);
}
