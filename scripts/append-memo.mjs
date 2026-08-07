#!/usr/bin/env node
/**
 * append-memo.mjs — docs/세션간-메모.md 에 **안전하게** 붙인다.
 *
 * 왜 만들었나 (2026-08-07 21:5x · 2번)
 * ─────────────────────────────────────────────────────────────────────────
 * 내가 방금 이 파일을 **통째로 지우고 커밋했다.** 27,784줄이 날아갔다.
 * git revert 로 되돌렸지만(한 글자도 안 다르게 확인), 되돌릴 수 있었던 건 운이었다.
 *
 * 어쩌다 그랬나 — PowerShell 에서 이렇게 썼다.
 *   $t = [System.IO.File]::ReadAllText($p) + ...   ← 여기서 예외가 났다
 *   [System.IO.File]::WriteAllText($p, $t, ...)    ← **$t 가 null 인 채로 실행됐다**
 * `Set-Location` 은 .NET 의 작업 폴더를 안 바꾼다. 그래서 읽기는 딴 데를 봤고,
 * 쓰기는 `Resolve-Path` 를 거쳐 **맞는 파일에 빈 내용을 썼다.**
 * 읽기가 실패했는데 쓰기가 계속 돈 것이 사고의 전부다.
 *
 * ⛔ 그래서 이 도구는 **파일이 줄어드는 쓰기를 거부한다.**
 *    붙이는 일에서 파일이 짧아지는 경우는 없다. 짧아졌다면 그건 사고다.
 *
 * 쓰는 법
 *   node scripts/append-memo.mjs <붙일파일>
 *   node scripts/append-memo.mjs --selftest
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 메모파일 = path.join(뿌리, 'docs', '세션간-메모.md');

/**
 * 붙인 결과를 만든다. **못 붙일 상황이면 던진다 — 조용히 빈 값을 돌려주지 않는다.**
 * 조용히 빈 값을 돌려주는 것이 오늘 사고의 원인이었다.
 */
export function 붙인결과(원래, 새것) {
  if (typeof 원래 !== 'string') throw new Error('원래 내용을 못 읽었다 — 쓰지 않는다');
  if (typeof 새것 !== 'string' || 새것.trim() === '') throw new Error('붙일 내용이 비었다 — 쓰지 않는다');
  const 사이 = 원래.endsWith('\n') || 원래 === '' ? '' : '\n';
  return 원래 + 사이 + 새것;
}

/** 쓰기 전에 통과해야 하는 관문. **줄어들면 거부한다** */
export function 써도되나(원래길이, 새길이) {
  if (!Number.isFinite(원래길이) || !Number.isFinite(새길이)) return { 된다: false, 왜: '길이를 못 쟀다' };
  if (새길이 < 원래길이) return { 된다: false, 왜: `짧아진다 (${원래길이} → ${새길이}). 붙이는 일에서 짧아질 수 없다` };
  if (새길이 === 원래길이) return { 된다: false, 왜: '한 글자도 안 늘었다 — 붙은 것이 없다' };
  return { 된다: true, 왜: `${원래길이} → ${새길이} (+${새길이 - 원래길이})` };
}

function 셀프테스트() {
  const 검사 = [];
  const 확인 = (이름, 실제, 기대) => 검사.push({ 이름, 통과: JSON.stringify(실제) === JSON.stringify(기대) });
  const 던지나 = (이름, 함수) => { let t = false; try { 함수(); } catch { t = true; } 검사.push({ 이름, 통과: t }); };

  확인('붙인다', 붙인결과('가\n', '나'), '가\n나');
  확인('줄바꿈이 없으면 넣어 준다', 붙인결과('가', '나'), '가\n나');
  확인('빈 원본에도 붙는다', 붙인결과('', '나'), '나');
  던지나('⭐ 원본이 null 이면 던진다 — 오늘 사고가 이것이다', () => 붙인결과(null, '나'));
  던지나('원본이 undefined 여도 던진다', () => 붙인결과(undefined, '나'));
  던지나('붙일 것이 비면 던진다', () => 붙인결과('가', '   '));
  던지나('붙일 것이 null 이면 던진다', () => 붙인결과('가', null));

  확인('⭐ 짧아지면 거부', 써도되나(100, 50).된다, false);
  확인('그대로면 거부', 써도되나(100, 100).된다, false);
  확인('늘어나면 통과', 써도되나(100, 150).된다, true);
  확인('길이를 못 재면 거부', 써도되나(NaN, 150).된다, false);
  확인('0 에서 늘어나는 것은 통과', 써도되나(0, 10).된다, true);

  for (const c of 검사) console.log(`${c.통과 ? '✅' : '⛔'} ${c.이름}`);
  const 실패 = 검사.filter((c) => !c.통과).length;
  console.log(`\n검사 ${검사.length}개 · 실패 ${실패}개`);
  process.exit(실패 ? 1 : 0);
}

function 본일() {
  const 붙일파일 = process.argv[2];
  if (!붙일파일) { console.log('붙일 파일을 주십시오: node scripts/append-memo.mjs <파일>'); process.exit(1); }
  if (!fs.existsSync(붙일파일)) { console.log(`⛔ 붙일 파일이 없다: ${붙일파일}`); process.exit(1); }
  if (!fs.existsSync(메모파일)) { console.log(`⛔ 메모 파일이 없다: ${메모파일}`); process.exit(1); }

  const 원래 = fs.readFileSync(메모파일, 'utf8');
  const 새것 = fs.readFileSync(붙일파일, 'utf8');
  const 결과 = 붙인결과(원래, 새것);

  const 관문 = 써도되나(Buffer.byteLength(원래), Buffer.byteLength(결과));
  if (!관문.된다) { console.log(`⛔ 안 쓴다 — ${관문.왜}`); process.exit(1); }

  fs.writeFileSync(메모파일, 결과, 'utf8');   // ⚠ BOM 없이. PowerShell -Encoding UTF8 은 BOM 을 붙인다
  const 확인 = Buffer.byteLength(fs.readFileSync(메모파일, 'utf8'));
  console.log(`✅ 붙였다 · ${관문.왜} 바이트 · 다시 읽어 확인 ${확인}`);
}

if (process.argv.includes('--selftest')) 셀프테스트();
else 본일();
