#!/usr/bin/env node
/**
 * 순한글-막는다.mjs — 밖으로 나가는 글에 순한글이 있으면 **0 이 아닌 코드로 끝낸다.**
 *
 * 🔴🔴🔴 왜 만드나 (2026-10-22 09:18)
 *   사장님께 드린 메일에 「지면」이 든 채로 나갔다. 검사는 **빨간불을 냈는데**
 *   그 자가 `process.exit(0)` 으로 끝나는 바람에 `&&` 로 이어 둔 메일이 그대로 나갔다.
 *   ⛔ 같은 날 아침에 `send-mail.mjs` 의 똑같은 결함(실패에 0)을 고쳐 놓고,
 *     급히 만든 임시 자에서 내가 그것을 다시 만들었다.
 *   ⇒ 검사하는 자는 **반드시** 걸린 것이 있으면 1 을 낸다. 그래야 `&&` 가 막는다.
 *
 * 쓰는 법
 *   node scripts/순한글-막는다.mjs <파일> && node scripts/send-mail.mjs …
 *   node scripts/순한글-막는다.mjs <파일> --본문만     기사면 본문 구간만 잰다
 *   node scripts/순한글-막는다.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 여기 = path.dirname(fileURLToPath(import.meta.url));
const { 재기 } = await import('file://' + path.join(여기, '순한글-금지어.mjs').replace(/\\/g, '/'));

/** 기사면 본문 구간만 잘라 낸다 — 데스킹 요약에는 고칠 말을 적어야 하므로 */
export function 잴곳(글, 본문만) {
  if (!본문만) return 글;
  const 시작 = Math.max(글.indexOf('[본문]'), 글.indexOf('[중부매일'), 글.indexOf('BODY'));
  const 끝 = Math.max(글.indexOf('[추천 키워드]'), 글.indexOf('SOURCES'));
  if (시작 < 0) return 글;
  return 글.slice(시작, 끝 > 시작 ? 끝 : undefined);
}

if (process.argv.includes('--자가시험')) {
  let 통 = 0; let 탈 = 0;
  const 참 = (이름, v) => { if (v) { 통++; } else { 탈++; console.log('🔴 ' + 이름); } };
  참('본문만 — 앞의 요약은 빼고 본문부터 잰다',
    잴곳('요약 까닭\n[본문]\n깨끗함', true).includes('까닭') === false);
  참('본문만 — 영문은 BODY 부터', 잴곳('note\nBODY\nclean\nSOURCES\nx', true).startsWith('BODY'));
  참('본문만이 아니면 통째로', 잴곳('까닭', false) === '까닭');
  참('⛔ 머리를 못 찾으면 통째로 잰다 (조용히 건너뛰지 않는다)',
    잴곳('까닭만 있다', true) === '까닭만 있다');
  참('걸릴 글은 실제로 걸린다', 재기('그 까닭을 밝혔다').length > 0);
  참('깨끗한 글은 안 걸린다', 재기('그 이유를 밝혔다').length === 0);
  console.log(탈 ? '🔴 자가시험 ' + 탈 + '건 탈' : '✅ 자가시험 ' + 통 + ' 통과');
  process.exit(탈 ? 1 : 0);
}

const 파일 = process.argv[2];
if (!파일) { console.error('⛔ 쓰는 법: node scripts/순한글-막는다.mjs <파일> [--본문만]'); process.exit(1); }
if (!fs.existsSync(파일)) { console.error('⛔ 그런 파일이 없다 — ' + 파일); process.exit(1); }

const 글 = fs.readFileSync(파일, 'utf8');
const 걸린것 = 재기(잴곳(글, process.argv.includes('--본문만')));

if (!걸린것.length) {
  console.log('✅ 순한글 없다 — ' + path.basename(파일));
  process.exit(0);
}

console.error('\n🔴 순한글이 ' + 걸린것.length + '가지 있다 — **내보내지 않는다.**');
for (const x of 걸린것) {
  console.error('   「' + x.말 + '」→「' + x.대신 + '」  ' + x.수 + '곳');
  console.error('      …' + String(x.보기).trim().slice(0, 76) + '…');
}
console.error('\n⛔ 사장님 2026-10-22 「순한글을 쓰지 말라는데 기사에도 있나?」');
console.error('   고친 뒤 다시 부른다.\n');
process.exit(1);
