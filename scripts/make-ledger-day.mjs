#!/usr/bin/env node
/**
 * make-ledger-day.mjs — 세션 기록에서 **사장님이 하신 말**을 하루치 뽑아 대장 꼴로 찍는다.
 *
 * 왜 만들었나 (2026-08-07 23:2x · 2번)
 * ─────────────────────────────────────────────────────────────────────────
 * `docs/사장님-지시-대장.md` 가 **8/6 에서 끊겨 있었다.** 8/7 이 한 줄도 없다.
 * 그 대장은 내보낸 대화 뭉치에서 손으로 만든 것이라, 아무도 안 내보내면 그날이 통째로 빈다.
 *
 * 그 사이에 **Riot 키가 없어졌다.** 사장님은 「낮에 줌」이라 하시는데
 * 자리 여섯 곳 어디에도 없다. 받아 적는 자리가 안 돌면 이렇게 샌다.
 *
 * ⛔ 시각을 지어내지 않는다. **기록에 찍힌 시각만** 쓴다.
 * ⛔ 세션 기록을 통째로 옮기지 않는다. **사장님이 하신 말만** 고른다.
 *    도구가 넣은 알림·크론·시스템 글은 사장님 말이 아니다.
 *
 * 쓰는 법
 *   node scripts/make-ledger-day.mjs <세션파일> 2026-08-07
 *   node scripts/make-ledger-day.mjs --selftest
 */

import fs from 'node:fs';

/** 이 줄이 **사람이 친 말**인가. 도구가 넣은 것은 아니다 */
export function 사람말인가(줄) {
  if (!줄 || 줄.type !== 'user') return false;
  const c = 줄.message?.content;
  const 글 = typeof c === 'string' ? c : Array.isArray(c) ? c.filter((x) => x?.type === 'text').map((x) => x.text).join('\n') : '';
  if (!글.trim()) return false;
  /* 도구 결과·시스템이 끼워 넣은 것들 */
  if (Array.isArray(c) && c.some((x) => x?.type === 'tool_result')) return false;
  if (/^\s*<(command-name|local-command|system-reminder|task-notification)/.test(글)) return false;
  if (/^\[SYSTEM NOTIFICATION/.test(글)) return false;
  if (/^\[2번 · /.test(글)) return false;        // 내가 나에게 건 크론
  if (/^Caveat: The messages below/.test(글)) return false;
  /* ⚠ 되살린 요약은 **사장님 말이 아니다.** 처음엔 이걸 담아서 대장에 만 자짜리 한 줄이 들어갔다.
   *   길다고 자르지 않고 **아예 뺀다** — 사장님이 하신 말이 아니기 때문이다. */
  if (/^This session is being continued from a previous conversation/.test(글.trim())) return false;
  return true;
}

/** 사진만 있는 말은 글자가 없다. 자리는 남기되 **없는 말을 지어내지 않는다** */
export function 사진접기(글) {
  return String(글 ?? '')
    .replace(/@?"?[A-Za-z]:\\[^"\s]*uploads\\[^"\s]*"?/g, '(사진)')
    .replace(/\[Image: original[^\]]*\]/g, '(사진)')
    .trim();
}

/**
 * ⭐ **일하는 중에 끼어든 말**은 `queue-operation` 이라는 딴 꼴로 저장된다.
 *   처음 만들었을 때 이걸 통째로 버렸고, 그래서 「가격」·「공통판매 검토해」 같은
 *   **사장님이 급히 던지신 말이 대장에서 빠졌다.** 하필 그런 말이 제일 잘 샌다.
 *   ⚠ `enqueue` 만 담는다. `remove` 는 그 말이 쓰였다는 표시라 담으면 두 번 실린다.
 */
export function 끼어든말인가(줄) {
  if (!줄 || 줄.type !== 'queue-operation' || 줄.operation !== 'enqueue') return false;
  const c = 줄.content;
  if (typeof c !== 'string' || c.trim() === '') return false;
  if (/^\[2번 · /.test(c)) return false;                       // 내가 나에게 건 크론
  /* ⚠ 도구가 넣은 알림도 이 길로 들어온다. 처음엔 이것까지 담아서
   *   대장에 <task-notification> 이 실렸다. **사장님 말이 아니다.** */
  if (/^\s*<(task-notification|system-reminder|command-name|local-command)/.test(c)) return false;
  if (/^\[SYSTEM NOTIFICATION/.test(c)) return false;
  return true;
}

/** 줄에서 글만 꺼낸다 */
export function 글꺼내기(줄) {
  if (줄?.type === 'queue-operation') return typeof 줄.content === 'string' ? 줄.content : '';
  const c = 줄?.message?.content;
  if (typeof c === 'string') return c;
  if (Array.isArray(c)) return c.filter((x) => x?.type === 'text').map((x) => x.text).join('\n');
  return '';
}

/** 대장 한 줄로. ⚠ 줄바꿈은 ⏎ 로 접는다 — 대장이 한 마디 한 줄이라 */
export function 대장줄(시각, 자리, 글) {
  const 한줄 = String(글 ?? '').replace(/\r?\n+/g, ' ⏎ ').replace(/\s+/g, ' ').trim();
  return `- **${시각}** \`${자리}\` ${한줄}`;
}

/** ISO 를 KST 시:분 으로. 못 읽으면 null — 짐작하지 않는다 */
export function 한국시분(iso) {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  const d = new Date(t + 9 * 3600 * 1000);
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

/** ISO 를 KST 날짜로 */
export function 한국날짜(iso) {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return new Date(t + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

function 셀프테스트() {
  const 검사 = [];
  const 확인 = (이름, 실제, 기대) => 검사.push({ 이름, 통과: JSON.stringify(실제) === JSON.stringify(기대), 실제 });

  확인('사람 말이다', 사람말인가({ type: 'user', message: { content: '가격' } }), true);
  확인('빈 말은 아니다', 사람말인가({ type: 'user', message: { content: '  ' } }), false);
  확인('내 답은 아니다', 사람말인가({ type: 'assistant', message: { content: '가격' } }), false);
  확인('⭐ 도구 결과는 아니다', 사람말인가({ type: 'user', message: { content: [{ type: 'tool_result', content: 'x' }] } }), false);
  확인('⭐ 내가 나에게 건 크론은 아니다', 사람말인가({ type: 'user', message: { content: '[2번 · 매시 :05 — 걷는다] …' } }), false);
  확인('시스템 알림은 아니다', 사람말인가({ type: 'user', message: { content: '[SYSTEM NOTIFICATION - NOT USER INPUT]' } }), false);
  확인('되살린 안내는 아니다', 사람말인가({ type: 'user', message: { content: 'Caveat: The messages below were generated…' } }), false);
  확인('⭐ 되살린 요약은 사장님 말이 아니다', 사람말인가({ type: 'user', message: { content: 'This session is being continued from a previous conversation. …' } }), false);
  확인('⭐ 끼어든 말을 담는다 — 이게 제일 잘 샌다', 끼어든말인가({ type: 'queue-operation', operation: 'enqueue', content: '가격' }), true);
  확인('⭐ remove 는 안 담는다 — 담으면 두 번 실린다', 끼어든말인가({ type: 'queue-operation', operation: 'remove', content: '가격' }), false);
  확인('끼어든 빈 말은 안 담는다', 끼어든말인가({ type: 'queue-operation', operation: 'enqueue', content: '  ' }), false);
  확인('⭐ 도구 알림은 안 담는다', 끼어든말인가({ type: 'queue-operation', operation: 'enqueue', content: '<task-notification>\n<task-id>x</task-id>' }), false);
  확인('내 크론은 안 담는다', 끼어든말인가({ type: 'queue-operation', operation: 'enqueue', content: '[2번 · 매시 :05 — 걷는다]' }), false);
  확인('끼어든 것에서 글을 꺼낸다', 글꺼내기({ type: 'queue-operation', content: '가격' }), '가격');
  확인('사진 자리를 접는다', 사진접기('[Image: original 800x3752, displayed at 426x2000.] 이거 봐라'), '(사진) 이거 봐라');
  확인('올린 파일 경로도 접는다', 사진접기('@"C:\\Users\\USER\\.claude\\uploads\\a\\b.jpeg" 이거'), '(사진) 이거');
  확인('토막글에서 글을 꺼낸다', 글꺼내기({ message: { content: [{ type: 'text', text: '가' }, { type: 'text', text: '나' }] } }), '가\n나');

  확인('대장 줄', 대장줄('09:36', '2번 조율', '키를 준다'), '- **09:36** `2번 조율` 키를 준다');
  확인('⭐ 줄바꿈은 접는다', 대장줄('09:36', '2번', '가\n나'), '- **09:36** `2번` 가 ⏎ 나');
  확인('KST 로 옮긴다', 한국시분('2026-08-07T00:36:00Z'), '09:36');
  확인('날짜도 KST', 한국날짜('2026-08-07T15:30:00Z'), '2026-08-08');
  확인('⭐ 못 읽으면 null — 짐작하지 않는다', 한국시분('아무말'), null);

  for (const c of 검사) console.log(`${c.통과 ? '✅' : '⛔'} ${c.이름}${c.통과 ? '' : `\n     받은 것 ${JSON.stringify(c.실제)}`}`);
  const 실패 = 검사.filter((c) => !c.통과).length;
  console.log(`\n검사 ${검사.length}개 · 실패 ${실패}개`);
  process.exit(실패 ? 1 : 0);
}

function 본일() {
  const [파일, 날짜, 자리 = '2번 조율'] = process.argv.slice(2);
  if (!파일 || !날짜) { console.log('쓰는 법: node scripts/make-ledger-day.mjs <세션파일> <YYYY-MM-DD> [자리이름]'); process.exit(1); }
  if (!fs.existsSync(파일)) { console.log(`⛔ 세션 파일이 없다: ${파일}`); process.exit(1); }

  const 줄들 = fs.readFileSync(파일, 'utf8').split(/\r?\n/).filter(Boolean);
  const 모은것 = [];
  for (const l of 줄들) {
    let j;
    try { j = JSON.parse(l); } catch { continue; }
    if (!사람말인가(j) && !끼어든말인가(j)) continue;
    if (한국날짜(j.timestamp) !== 날짜) continue;
    const 시각 = 한국시분(j.timestamp);
    if (!시각) continue;                       // 시각을 못 읽으면 버린다. 지어내지 않는다
    const 글 = 사진접기(글꺼내기(j));
    if (!글) continue;
    모은것.push(대장줄(시각, 자리, 글));
  }

  /* 같은 말이 두 번 실리지 않게 (되살린 대화가 앞부분을 다시 싣는다) */
  const 본것 = new Set();
  const 마지막 = 모은것.filter((s) => (본것.has(s) ? false : (본것.add(s), true)));

  console.log(`## ${날짜.slice(5)}\n`);
  마지막.forEach((s) => console.log(s));
  console.error(`\n(사장님 말 ${마지막.length}마디 · ${날짜} · ${자리})`);
}

if (process.argv.includes('--selftest')) 셀프테스트();
else 본일();
