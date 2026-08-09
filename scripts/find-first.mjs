#!/usr/bin/env node
// 처음 자물쇠 — ⛔ 사장님이 **처음 말씀하신 시각**을 찾아 준다.
//
// 사장님 지시(2026-08-09):
//   「몇시에 대화를 시작했는지 먼저 찾으면 쉽잖아」
//   「히스토리 똑바로 챙겨. **처음 지시/묻는 시간부터** 챙기게 자물쇠 만들어」
//
// 왜 — 2026-08-09 에 나는 「무엇을 했나」를 알아내려고 메모를 몇 번이나 훑었다.
//      ⛔ **처음 시각 한 줄**이면 될 것을. 그리고 「몇 번째 말씀이신지」를 몰라
//      같은 것을 사장님이 두 번 세 번 말씀하시게 했다.
//
// 쓰기:  node scripts/find-first.mjs "대표 메일"      처음 말씀하신 때와 그 뒤 몇 번
//        node scripts/find-first.mjs --시작           이 창이 언제 열렸나
//        node scripts/find-first.mjs --자가시험

import fs from 'node:fs';
import readline from 'node:readline';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const 기록방 = 'C:/Users/USER/.claude/projects/C--Users-USER-Desktop-00-----';

/** UTC 시각을 KST 로. ⛔ 9시간 더하지 않고 나라 시간대로 바꾼다. */
export function 한국시각(utc) {
  const d = new Date(String(utc ?? ''));
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }).replace('T', ' ');
}

/** 크론이 넣은 말인가. ⛔ 크론을 사장님 말씀으로 세면 시각이 틀어진다. */
export function 크론인가(글) {
  return /^\s*\[\d+번\s*·/.test(String(글 ?? ''));
}

/** 훅·시스템이 넣은 것인가 */
export function 시스템인가(글) {
  const g = String(글 ?? '');
  return g.includes('<system-reminder>') || g.includes('<command-name>') || g.startsWith('Caveat:');
}

/** 사장님이 하신 말인가 — 크론·시스템을 뺀 것 */
export function 사장님말인가(줄객체) {
  if (줄객체?.type !== 'user') return false;
  if (줄객체?.origin?.kind !== 'human') return false;
  const 글 = 글뽑기(줄객체);
  if (!글) return false;
  return !크론인가(글) && !시스템인가(글);
}

/** message.content 가 글일 수도 배열일 수도 있다 */
export function 글뽑기(줄객체) {
  const c = 줄객체?.message?.content;
  if (typeof c === 'string') return c;
  if (Array.isArray(c)) {
    return c.filter((p) => p?.type === 'text').map((p) => p.text).join(' ');
  }
  return '';
}

/** 찾은 것들에서 처음·끝·횟수를 낸다 */
export function 간추리기(찾은것들) {
  if (!찾은것들.length) return null;
  const 순 = [...찾은것들].sort((a, b) => String(a.때).localeCompare(String(b.때)));
  return { 처음: 순[0], 마지막: 순[순.length - 1], 횟수: 순.length, 모두: 순 };
}

export function 판정글(낱말, 간추린것) {
  if (!간추린것) return `⛔ 「${낱말}」— 사장님 말씀에서 못 찾았습니다.\n   ⚠ 「없다」가 아니라 **이 창에서 못 찾았다**입니다. 딴 창일 수 있습니다.`;
  const 줄 = [];
  줄.push(`# 「${낱말}」 — 사장님이 **${간추린것.횟수}번** 말씀하셨습니다`);
  줄.push('');
  줄.push(`🔴 **처음**   ${간추린것.처음.때}`);
  줄.push(`   ${간추린것.처음.글.slice(0, 160).replace(/\n/g, ' ')}`);
  if (간추린것.횟수 > 1) {
    줄.push('');
    줄.push(`⚠ **마지막** ${간추린것.마지막.때}`);
    줄.push(`   ${간추린것.마지막.글.slice(0, 160).replace(/\n/g, ' ')}`);
    줄.push('');
    줄.push(`⛔ **${간추린것.횟수}번 말씀하셨다는 것은 ${간추린것.횟수 - 1}번은 제가 못 알아들었다는 뜻입니다.**`);
  }
  return 줄.join('\n');
}

// ── 자가시험 ────────────────────────────────────────────────────────────────
const 내가실행됐다 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--자가시험')) {
  let 통과 = 0, 실패 = 0;
  const 자가 = (이름, 참인가) => { if (참인가) 통과++; else { 실패++; console.error(`  ✗ ${이름}`); } };

  자가('UTC 를 KST 로 바꾼다', 한국시각('2026-08-06T06:16:10.692Z') === '2026-08-06 15:16:10');
  자가('⛔ 9시간을 손으로 더하지 않는다', 한국시각('2026-08-09T15:00:00.000Z') === '2026-08-10 00:00:00');
  자가('못 읽으면 null', 한국시각('아무거나') === null);

  자가('크론을 가른다', 크론인가('[2번 · 매시 :05 — 걷는다] 3·5·6번이') === true);
  자가('앞에 빈칸이 있어도 가른다', 크론인가('  [3번 · 하루] x') === true);
  자가('사장님 말은 크론이 아니다', 크론인가('대표 메일을 만들자') === false);
  자가('꺾쇠만 있는 것은 크론이 아니다', 크론인가('[중요] 이것') === false);

  자가('시스템 알림을 가른다', 시스템인가('<system-reminder>x</system-reminder>') === true);
  자가('명령 이름을 가른다', 시스템인가('<command-name>/loop</command-name>') === true);
  자가('보통 말은 아니다', 시스템인가('일하자') === false);

  자가('글이 문자열이면 그대로', 글뽑기({ message: { content: '일하자' } }) === '일하자');
  자가('배열이면 text 만 모은다',
       글뽑기({ message: { content: [{ type: 'text', text: 'ㄱ' }, { type: 'image' }, { type: 'text', text: 'ㄴ' }] } }) === 'ㄱ ㄴ');
  자가('없으면 빈 글', 글뽑기({}) === '');

  const 사람 = { type: 'user', origin: { kind: 'human' }, message: { content: '대표 메일' } };
  자가('사장님 말을 고른다', 사장님말인가(사람) === true);
  자가('⛔ 크론은 안 고른다',
       사장님말인가({ ...사람, message: { content: '[2번 · 매시] x' } }) === false);
  자가('⛔ 사람이 아니면 안 고른다', 사장님말인가({ ...사람, origin: { kind: 'cron' } }) === false);
  자가('⛔ 도구 결과는 안 고른다', 사장님말인가({ type: 'assistant', origin: { kind: 'human' } }) === false);
  자가('⛔ 빈 글은 안 고른다', 사장님말인가({ ...사람, message: { content: '' } }) === false);

  const 것들 = [
    { 때: '2026-08-09 17:00:00', 글: '나중' },
    { 때: '2026-08-06 15:16:10', 글: '처음' },
    { 때: '2026-08-08 09:00:00', 글: '가운데' },
  ];
  const 간 = 간추리기(것들);
  자가('처음을 고른다', 간.처음.글 === '처음');
  자가('마지막을 고른다', 간.마지막.글 === '나중');
  자가('횟수를 센다', 간.횟수 === 3);
  자가('없으면 null', 간추리기([]) === null);

  자가('판정에 처음 시각이 있다', 판정글('x', 간).includes('2026-08-06 15:16:10'));
  자가('🔴 여러 번이면 못 알아들었다고 적는다', 판정글('x', 간).includes('2번은 제가 못 알아들었다'));
  자가('한 번이면 그 말은 안 적는다',
       !판정글('x', 간추리기([것들[0]])).includes('못 알아들었다'));
  자가('⛔ 못 찾으면 「없다」가 아니라 「못 찾았다」', 판정글('x', null).includes('못 찾았다'));

  console.log(실패 === 0 ? `✅ 자가시험 ${통과}개 통과` : `❌ ${실패}개 실패 (통과 ${통과})`);
  process.exit(실패 === 0 ? 0 : 1);
}

if (내가실행됐다 && !process.argv.includes('--자가시험')) {
  const 낱말 = process.argv.slice(2).filter((a) => !a.startsWith('--'))[0];
  const 시작만 = process.argv.includes('--시작');
  if (!낱말 && !시작만) {
    console.log('쓰기: node scripts/find-first.mjs "낱말"   또는   --시작');
    process.exit(1);
  }

  const 기록들 = fs.readdirSync(기록방).filter((n) => n.endsWith('.jsonl'))
    .map((n) => ({ 이름: n, 길: path.join(기록방, n), 때: fs.statSync(path.join(기록방, n)).mtimeMs }))
    .sort((a, b) => b.때 - a.때);
  if (!기록들.length) { console.log('⛔ 기록을 못 찾았습니다.'); process.exit(1); }

  const 찾은것 = [];
  let 첫말 = null;
  for (const 기록 of 기록들.slice(0, 3)) {
    const rl = readline.createInterface({ input: fs.createReadStream(기록.길), crlfDelay: Infinity });
    for await (const 줄 of rl) {
      if (!줄.startsWith('{')) continue;
      let o; try { o = JSON.parse(줄); } catch { continue; }
      if (!사장님말인가(o)) continue;
      const 때 = 한국시각(o.timestamp);
      if (!때) continue;
      const 글 = 글뽑기(o).trim();
      if (!첫말 || 때 < 첫말.때) 첫말 = { 때, 글, 창: 기록.이름.slice(0, 8) };
      if (낱말 && 글.includes(낱말)) 찾은것.push({ 때, 글, 창: 기록.이름.slice(0, 8) });
    }
  }

  if (시작만 || !낱말) {
    console.log(`# 이 창이 열린 때\n\n🔴 **${첫말?.때 ?? '못 찾음'}**  — 사장님 첫 말씀: 「${(첫말?.글 ?? '').slice(0, 60)}」`);
    console.log(`\n지금  ${new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }).replace('T', ' ')}`);
    process.exit(0);
  }
  console.log(판정글(낱말, 간추리기(찾은것)));
}
