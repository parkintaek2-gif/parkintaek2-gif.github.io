#!/usr/bin/env node
/**
 * 압축 지킴이 — **압축이 일어나도 하던 일을 잃지 않게 한다.**
 *
 * ── 왜 만드는가 ─────────────────────────────────────────────────
 * 사장님 지시(2026-08-07): 「내가 안 하고 **너희들 스스로 할 수 있는 방법**을 찾아서 실행해」
 *
 * 자동 압축은 이미 켜져 있다(`autoCompactEnabled: true`). 사장님이 `/compact` 를 치실 일은 없다.
 * 남은 위험은 **압축될 때 무엇이 남느냐**다. 요약이 「지금 하던 일」을 흘리면
 * 그 창은 다음 턴에 엉뚱한 것을 붙잡는다. 그때 사장님이 다시 설명하게 된다 — 그걸 막는다.
 *
 * ── 어떻게 하나 ────────────────────────────────────────────────
 *   PreCompact   압축 **직전에** 대화록에서 「사장님이 시킨 것 · 내가 하던 것」을 추려
 *                자리별 파일로 굳힌다. 요약이 무엇을 흘리든 이 파일은 남는다.
 *   SessionStart 그 파일을 브리핑에 다시 넣는다(session-brief.mjs 가 읽는다).
 *
 * ⛔ 대화록 전체를 베끼지 않는다. 그러면 다음 창이 그걸 읽느라 또 자리를 먹는다.
 *   **사장님 말씀은 다 남기고**, 내가 한 말은 마지막 것만 남긴다.
 *
 * 시험
 *   echo '{"session_id":"x","transcript_path":"...","trigger":"auto"}' | CLAUDE_SEAT=2 node scripts/compact-guard.mjs
 *   node scripts/compact-guard.mjs --selftest
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';

const 적을곳 = 'C:/Users/USER/Desktop/00_세션입구/_현재';

/** 대화록(jsonl)에서 남길 것만 추린다. 여기만 시험하면 이 도구는 시험된 것이다. */
export function 추리기(줄들, { 사장님최대 = 40, 내말최대 = 3 } = {}) {
  const 사장님 = [];
  const 내말 = [];
  for (const 줄 of 줄들) {
    let j;
    try { j = JSON.parse(줄); } catch { continue; }
    const 역할 = j?.message?.role ?? j?.role;
    const 속 = j?.message?.content ?? j?.content;
    if (!역할 || !속) continue;

    const 글 = (Array.isArray(속) ? 속 : [속])
      .map((c) => (typeof c === 'string' ? c : c?.type === 'text' ? c.text : ''))
      .filter(Boolean)
      .join('\n')
      .trim();
    if (!글) continue;

    // 훅·도구가 넣은 것은 사장님 말씀이 아니다. 걸러 낸다
    if (/^<(system-reminder|command-name|local-command)/.test(글)) continue;
    if (/^\[\d번 · 매시/.test(글)) continue;              // 예약으로 도는 지시
    if (/^Caveat:|^This session is being continued/.test(글)) continue;
    // ⚠ 뒷일 끝났다는 알림은 **사장님 말씀이 아니다.** 이걸 안 거르면 굳힌 메모가
    //   기계 알림으로 채워져 정작 지시가 밀려난다(2026-08-07 시험에서 실제로 그랬다).
    if (/^<task-notification|^\[SYSTEM NOTIFICATION/.test(글)) continue;
    if (/^\[Request interrupted/.test(글)) continue;
    if (/^\[Image[: ]/.test(글)) continue;                 // 그림 좌표 안내. 말씀이 아니다

    if (역할 === 'user') 사장님.push(글);
    else if (역할 === 'assistant') 내말.push(글);
  }
  return {
    사장님: 사장님.slice(-사장님최대),
    내말: 내말.slice(-내말최대),
  };
}

if (process.argv.includes('--selftest')) {
  const 시험 = [
    JSON.stringify({ message: { role: 'user', content: '일하자' } }),
    JSON.stringify({ message: { role: 'user', content: '<system-reminder>무시할 것</system-reminder>' } }),
    JSON.stringify({ message: { role: 'user', content: '[2번 · 매시 :05 — 걷는다] 어쩌고' } }),
    JSON.stringify({ message: { role: 'assistant', content: [{ type: 'text', text: '했습니다' }] } }),
    '깨진 줄',
    JSON.stringify({ message: { role: 'user', content: [{ type: 'text', text: '두 번째 지시' }] } }),
    JSON.stringify({ message: { role: 'user', content: '<task-notification>\n<task-id>x</task-id>\n</task-notification>' } }),
    JSON.stringify({ message: { role: 'user', content: '[SYSTEM NOTIFICATION - NOT USER INPUT]\n어쩌고' } }),
  ];
  const r = 추리기(시험);
  const 틀림 = [];
  if (r.사장님.length !== 2) 틀림.push(`사장님 말씀 ${r.사장님.length}개 (2개라야 한다 — 훅·예약지시·기계알림은 빠진다)`);
  if (r.사장님[0] !== '일하자') 틀림.push('첫 말씀이 「일하자」가 아니다');
  if (r.내말.length !== 1) 틀림.push('내 말이 1개가 아니다');
  if (추리기([]).사장님.length !== 0) 틀림.push('빈 대화록에서 터진다');
  console.log(틀림.length ? `⛔ 자가시험 실패\n  ${틀림.join('\n  ')}` : '✅ 압축 지킴이 자가시험 4건 통과');
  process.exit(틀림.length ? 1 : 0);
}

/* ── 실제 실행 ─────────────────────────────────────────────── */
let 들어온것 = {};
try { 들어온것 = JSON.parse(readFileSync(0, 'utf8') || '{}'); } catch { /* 없으면 없는 대로 */ }

const 자리 = (process.env.CLAUDE_SEAT ?? '').trim();
const 대화록 = 들어온것.transcript_path;

try {
  if (/^[1-6]$/.test(자리) && 대화록 && existsSync(대화록)) {
    const { 사장님, 내말 } = 추리기(readFileSync(대화록, 'utf8').split('\n').filter(Boolean));
    const 때 = new Date().toLocaleString('sv-SE');
    const 글 = [
      `# ${자리}번 — 압축 직전에 굳힌 것 (${때} KST · ${들어온것.trigger ?? '?'})`,
      '',
      '⚠ 요약이 흘렸을 수 있는 것을 여기 남긴다. **사장님이 다시 설명하지 않으시게 하는 것이 목적이다.**',
      '',
      '## 사장님이 시키신 것 (최근 것부터 거꾸로 읽지 말고 순서대로 읽는다)',
      '',
      ...사장님.map((s) => `${s.length > 600 ? `${s.slice(0, 600)}…` : s}\n`).map((s) => `> ${s.replace(/\n/g, '\n> ')}`),
      '',
      '## 내가 마지막으로 한 말',
      '',
      '```',
      ...내말.map((s) => (s.length > 800 ? `${s.slice(0, 800)}…` : s)),
      '```',
      '',
      `— 압축 지킴이(scripts/compact-guard.mjs)가 적었다. 다음 창이 시작할 때 브리핑에 다시 들어간다.`,
    ].join('\n');

    mkdirSync(적을곳, { recursive: true });
    writeFileSync(path.join(적을곳, `${자리}.압축메모.md`), 글, 'utf8');
  }
} catch { /* 실패해도 압축은 그대로 진행돼야 한다 */ }

/* PreCompact 훅은 출력이 필요 없다. 조용히 끝낸다. */
process.stdout.write(JSON.stringify({ suppressOutput: true }));
