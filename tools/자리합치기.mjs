#!/usr/bin/env node
/**
 * 자리 합치기 — 4번의 일을 «1번 자리»로 통째로 옮긴다
 *
 * 사장님 지시 (2026-09-10, 원문)
 *   「1번 자리를 4번이 통째로 받을 수 있는 방법을 찾아봐라. 그런다음 4번이 자기가 한 것을
 *    거기에 합치면 되잖아. 1번 세션은 제일 많이 구독기간이 남아있어서 그래」
 *
 * ── 왜 되는가 (2026-09-10 실측) ────────────────────────────────────
 *   자리마다 설정방이 따로 있다 — C:\Users\USER\.claude-uN
 *   그 안에 구독·로그인이 «파일»로 있다 — .credentials.json · .claude.json
 *   ⇒ 그러니 «1번의 그 두 파일을 건드리지 않고» 4번의 일만 옮기면
 *     1번 구독으로 4번의 일이 이어진다. 자리를 새로 사지 않아도 된다.
 *
 * ── 무엇이 4번의 «일»인가 ─────────────────────────────────────────
 *   projects/<방>/*.jsonl        대화록 (이어열기의 재료)
 *   projects/<방>/memory/*.md    스스로 쌓은 기억
 *   projects/<방>/<id>/subagents 곁일꾼 기록
 *   ⛔ 예약(cron)은 «세션 메모리»에만 있어 파일로 옮겨지지 않는다. 새로 걸어야 한다
 *
 * ── 🔴 절대로 옮기지 않는 것 ──────────────────────────────────────
 *   .credentials.json  로그인. 1번 것을 덮으면 «구독이 4번 것으로 바뀐다» — 지시의 반대다
 *   .claude.json       계정 상태가 함께 들어 있다. 덮으면 1번 로그인이 깨진다
 *   ⛔ 이 자는 그 둘을 «읽지도» 않는다. 열지 않고 이름만 보고 건너뛴다
 *
 * ── 실측한 것 (2026-09-10) ────────────────────────────────────────
 *   u1  대화록 8개 442M · 기억 klifemap 67 + dataeconomics 28
 *   u4  대화록 32개 331M · 기억 36 (모두 C--Users-User-OneDrive-Desktop 방)
 *   두 자리에 다 있는 방은 C--Users-User-OneDrive-Desktop 하나뿐이고,
 *   그 방의 대화록이 u1 에 «0개»라 **겹치는 아이디가 하나도 없다.**
 *   남은 공간 42G. 옮길 것 331M.
 *   ⇒ 덮어쓸 일이 없다. 이것이 지금 옮기기 좋은 까닭이다
 *
 * 쓰는 법
 *   node tools/자리합치기.mjs --자가시험
 *   node tools/자리합치기.mjs --받는자리 1 --주는자리 4            보여만 준다 (기본)
 *   node tools/자리합치기.mjs --받는자리 1 --주는자리 4 --한다      실제로 옮긴다
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const 설정방뿌리 = 'C:/Users/USER';
export const 설정방이름 = (자리) => `.claude-u${자리}`;

/** 🔴 옮기지 않는 것. 로그인·구독이 여기 있다 */
export const 손대지않을것 = [
  '.credentials.json',
  '.claude.json',
  '.last-update-result.json',
  'daemon.lock',
  'daemon.status.json',
  'policy-limits.json',
  'remote-settings.json',
];

/** 옮기는 것 — 「일」에 해당하는 것만 */
export const 옮길것 = ['projects'];

export function 지킬파일인가(이름) {
  return 손대지않을것.includes(String(이름 ?? '').trim());
}

/**
 * 무엇을 옮길지 정한다. 겹치면 «덮지 않고 막는다».
 * @param {{방:string, 파일:string[]}[]} 주는방들
 * @param {{방:string, 파일:string[]}[]} 받는방들
 */
export function 옮길계획(주는방들, 받는방들) {
  const 받는표 = new Map((받는방들 ?? []).map((r) => [r.방, new Set(r.파일 ?? [])]));
  const 새방 = [], 합칠방 = [], 막힌것 = [];
  for (const s of 주는방들 ?? []) {
    const 있는것 = 받는표.get(s.방);
    if (!있는것) { 새방.push({ 방: s.방, 파일수: (s.파일 ?? []).length }); continue; }
    const 겹침 = (s.파일 ?? []).filter((f) => 있는것.has(f));
    const 안겹침 = (s.파일 ?? []).filter((f) => !있는것.has(f));
    if (겹침.length) 막힌것.push({ 방: s.방, 겹친파일: 겹침 });
    if (안겹침.length) 합칠방.push({ 방: s.방, 파일: 안겹침 });
  }
  return { 새방, 합칠방, 막힌것, 옮길수: 새방.reduce((a, b) => a + b.파일수, 0) + 합칠방.reduce((a, b) => a + b.파일.length, 0) };
}

/**
 * 🔴 두 번 나눠 옮길 때 «자란 대화록»을 어떻게 하나 (2026-09-10 판단)
 *
 * 오늘 옮기고 9월 19일에 한 번 더 옮긴다. 그 사이 4번이 계속 일하므로 «같은 이름»의
 * 대화록이 커진다. 그런데 처음 자는 「있는 것은 덮지 않는다」였다 —
 * ⇒ 그러면 두 번째 옮길 때 «자란 부분이 안 온다». 조용히 옛것이 남는다.
 *
 * ⭐ 대화록은 «덧붙기만» 한다(줄이 쌓인다). 그래서 안전한 규칙이 하나 있다 —
 *   **더 새롭고 «동시에» 더 큰 것만 갱신한다.**
 *   작아졌거나 시각만 바뀐 것은 손대지 않는다 — 그것은 덧붙기가 아니라 다른 일이다.
 *
 * @returns {{할까:boolean, 왜:string}}
 */
export function 갱신할까(주는쪽, 받는쪽) {
  if (!받는쪽) return { 할까: true, 왜: '받는 쪽에 없다' };
  if (!주는쪽) return { 할까: false, 왜: '주는 쪽을 못 읽었다' };
  const 더큼 = Number(주는쪽.크기) > Number(받는쪽.크기);
  const 더새것 = Number(주는쪽.고친때) > Number(받는쪽.고친때);
  if (더큼 && 더새것) return { 할까: true, 왜: `자랐다 (${받는쪽.크기} → ${주는쪽.크기})` };
  if (Number(주는쪽.크기) === Number(받는쪽.크기)) return { 할까: false, 왜: '크기가 같다 — 덮지 않는다' };
  if (!더큼) return { 할까: false, 왜: '주는 쪽이 «더 작다» — 덧붙기가 아니다. 손대지 않는다' };
  return { 할까: false, 왜: '더 크지만 «더 오래된» 것이다. 손대지 않는다' };
}

/** 되돌릴 수 있게 먼저 백업 이름을 짓는다 */
export function 백업이름(자리, 날 = new Date()) {
  const 두자 = (n) => String(n).padStart(2, '0');
  return `.claude-u${자리}-백업-${날.getFullYear()}${두자(날.getMonth() + 1)}${두자(날.getDate())}-${두자(날.getHours())}${두자(날.getMinutes())}`;
}

/** 옮긴 뒤에 사람이 «반드시» 해야 하는 것 — 파일로 안 옮겨지는 것들 */
export const 옮긴뒤할것 = [
  '1  🔴 1번 창을 «먼저 닫는다». 한 설정방을 두 창이 같이 쓰면 잠금(daemon.lock)이 부딪힌다',
  '2  4번 자리 입구(.cmd)의 CLAUDE_CONFIG_DIR 를 «.claude-u1» 으로 바꾼다',
  '3  예약(cron)을 다시 건다 — 세션 메모리에만 있어 파일로 옮겨지지 않는다',
  '4  열어서 `--resume` 목록에 4번 대화록이 «보이는지» 눈으로 본다',
  '5  기억(memory) 파일이 새 자리에서 읽히는지 한 줄이라도 확인한다',
  '6  ⛔ 4번 설정방을 «지우지 않는다». 이레는 그대로 둔다 — 되돌릴 자리다',
];

/* ── 자가시험 ───────────────────────────────────────────────────── */

function 자가시험() {
  let 통과 = 0, 실패 = 0;
  const 자가 = (이름, 참인가) => {
    if (참인가) { 통과 += 1; console.log('  ✅ ' + 이름); }
    else { 실패 += 1; console.log('  ⛔ ' + 이름); }
  };
  console.log('자가시험 — tools/자리합치기.mjs');

  자가('설정방 이름이 맞다', 설정방이름(1) === '.claude-u1');

  // 🔴 로그인 파일을 지킨다
  자가('🔴 자격 파일을 지킨다', 지킬파일인가('.credentials.json') === true);
  자가('🔴 계정 상태 파일을 지킨다', 지킬파일인가('.claude.json') === true);
  자가('잠금 파일도 지킨다', 지킬파일인가('daemon.lock') === true);
  자가('대화록은 지키는 목록에 없다', 지킬파일인가('projects') === false);
  자가('빈 이름도 지키는 것이 아니다', 지킬파일인가('') === false);
  자가('null 도 마찬가지', 지킬파일인가(null) === false);
  자가('⛔ 옮길 것에 자격 파일이 없다', !옮길것.some((x) => 지킬파일인가(x)));

  // 계획 — 새 방
  const p1 = 옮길계획([{ 방: 'A', 파일: ['x.jsonl', 'y.jsonl'] }], []);
  자가('받는 쪽에 없는 방은 새 방이다', p1.새방.length === 1);
  자가('새 방의 파일 수를 센다', p1.새방[0].파일수 === 2);
  자가('막힌 것이 없다', p1.막힌것.length === 0);
  자가('옮길 수를 센다', p1.옮길수 === 2);

  // 계획 — 겹치는 방
  const p2 = 옮길계획(
    [{ 방: 'A', 파일: ['x.jsonl', 'y.jsonl'] }],
    [{ 방: 'A', 파일: ['x.jsonl'] }]);
  자가('🔴 겹치는 파일은 «막는다»', p2.막힌것.length === 1);
  자가('무엇이 겹쳤는지 적는다', p2.막힌것[0].겹친파일[0] === 'x.jsonl');
  자가('겹치지 않는 것은 합친다', p2.합칠방[0].파일.length === 1);
  자가('⛔ 겹친 것을 옮길 수에 세지 않는다', p2.옮길수 === 1);
  자가('새 방으로 세지 않는다', p2.새방.length === 0);

  // 계획 — 다 겹치는 방
  const p3 = 옮길계획([{ 방: 'A', 파일: ['x'] }], [{ 방: 'A', 파일: ['x'] }]);
  자가('다 겹치면 옮길 것이 없다', p3.옮길수 === 0);
  자가('그래도 막힌 것으로 알려 준다', p3.막힌것.length === 1);
  자가('⛔ 합칠 방으로 세지 않는다', p3.합칠방.length === 0);

  // 계획 — 빈 것
  자가('빈 주는 쪽은 옮길 것이 없다', 옮길계획([], []).옮길수 === 0);
  자가('null 도 견딘다', 옮길계획(null, null).옮길수 === 0);
  자가('파일 칸이 없어도 견딘다', 옮길계획([{ 방: 'A' }], []).새방[0].파일수 === 0);

  // 백업 이름
  const b = 백업이름(4, new Date(2026, 8, 10, 15, 5));
  자가('백업 이름에 자리와 날이 들어간다', b === '.claude-u4-백업-20260910-1505');
  자가('백업 이름이 원래 방을 덮지 않는다', b !== 설정방이름(4));

  // 옮긴 뒤 할 것
  // 🔴 갱신 규칙 — 두 번 나눠 옮길 때 자란 대화록만 갱신한다
  자가('받는 쪽에 없으면 옮긴다', 갱신할까({크기:10,고친때:2}, null).할까 === true);
  자가('🔴 더 새롭고 더 크면 갱신한다', 갱신할까({크기:20,고친때:5},{크기:10,고친때:2}).할까 === true);
  자가('자란 폭을 적는다', /10 → 20/.test(갱신할까({크기:20,고친때:5},{크기:10,고친때:2}).왜));
  자가('⛔ 크기가 같으면 안 덮는다', 갱신할까({크기:10,고친때:9},{크기:10,고친때:2}).할까 === false);
  자가('⛔ 더 작으면 안 덮는다 (덧붙기가 아니다)', 갱신할까({크기:5,고친때:9},{크기:10,고친때:2}).할까 === false);
  자가('⛔ 더 크지만 더 오래되면 안 덮는다', 갱신할까({크기:20,고친때:1},{크기:10,고친때:2}).할까 === false);
  자가('⛔ 주는 쪽을 못 읽으면 안 덮는다', 갱신할까(null,{크기:10,고친때:2}).할까 === false);
  자가('안 덮는 까닭을 적는다', 갱신할까({크기:5,고친때:9},{크기:10,고친때:2}).왜.length > 5);

  자가('옮긴 뒤 할 일이 적혀 있다', 옮긴뒤할것.length >= 5);
  자가('🔴 창을 먼저 닫으라는 말이 첫 줄이다', /먼저 닫는다/.test(옮긴뒤할것[0]));
  자가('예약을 다시 걸라는 말이 있다', 옮긴뒤할것.some((x) => /예약/.test(x)));
  자가('⛔ 주는 자리를 지우지 말라는 말이 있다', 옮긴뒤할것.some((x) => /지우지 않는다/.test(x)));
  자가('입구를 바꾸라는 말이 있다', 옮긴뒤할것.some((x) => /CLAUDE_CONFIG_DIR/.test(x)));

  console.log(`\n통과 ${통과} · 실패 ${실패}`);
  return 실패 === 0;
}

/* ── 실행 ───────────────────────────────────────────────────────── */

const 내가실행됐다 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
function 인자(이름) { const i = process.argv.indexOf(이름); return i >= 0 ? process.argv[i + 1] : null; }

/**
 * ⚠ 방 안의 «맨 위 파일»만 세면 수가 사람을 속인다 — 기억(memory/)과 곁일꾼(subagents/)은
 *   한 겹 아래에 있다. 복사는 통째로 되므로 «세는 것»을 실물에 맞춘다.
 *   (4번의 기억 36개가 이 수에 안 잡혀서 「파일 7개」로 보였다. 그 수를 그대로 보고하면
 *    옮기는 사람이 「기억은 안 오나」로 읽는다.)
 */
function 방읽기(설정방) {
  const 방뿌리 = path.join(설정방, 'projects');
  if (!fs.existsSync(방뿌리)) return [];
  return fs.readdirSync(방뿌리, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const 안 = path.join(방뿌리, d.name);
      const 파일 = fs.readdirSync(안, { withFileTypes: true })
        .filter((f) => f.isFile()).map((f) => f.name);
      const 기억방 = path.join(안, 'memory');
      const 기억 = fs.existsSync(기억방)
        ? fs.readdirSync(기억방).filter((f) => f.endsWith('.md')).length : 0;
      let 곁일꾼 = 0;
      const 세기 = (곳) => {
        for (const e of fs.readdirSync(곳, { withFileTypes: true })) {
          if (e.isDirectory()) { if (e.name === 'subagents') 곁일꾼 += fs.readdirSync(path.join(곳, e.name)).length; else 세기(path.join(곳, e.name)); }
        }
      };
      try { 세기(안); } catch { /* 못 세면 0 이 아니라 그대로 둔다 */ }
      return { 방: d.name, 파일, 기억, 곁일꾼 };
    });
}

function 통째복사(부터, 까지, 적기 = null) {
  fs.mkdirSync(까지, { recursive: true });
  for (const d of fs.readdirSync(부터, { withFileTypes: true })) {
    const a = path.join(부터, d.name), b = path.join(까지, d.name);
    if (d.isDirectory()) { 통째복사(a, b, 적기); continue; }
    const 주 = (() => { try { const s = fs.statSync(a); return { 크기: s.size, 고친때: s.mtimeMs }; } catch { return null; } })();
    const 받 = fs.existsSync(b) ? (() => { const s = fs.statSync(b); return { 크기: s.size, 고친때: s.mtimeMs }; })() : null;
    const 정 = 갱신할까(주, 받);
    if (정.할까) { fs.copyFileSync(a, b); if (적기 && 받) 적기(`갱신 ${d.name} — ${정.왜}`); }
    else if (적기) 적기(`그대로 둠 ${d.name} — ${정.왜}`);
  }
}

if (내가실행됐다) {
  if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);

  const 받는자리 = 인자('--받는자리'), 주는자리 = 인자('--주는자리');
  if (!받는자리 || !주는자리) {
    console.error('⛔ --받는자리 와 --주는자리 를 적으십시오. 보기: --받는자리 1 --주는자리 4');
    process.exit(1);
  }
  const 받는방 = path.join(설정방뿌리, 설정방이름(받는자리));
  const 주는방 = path.join(설정방뿌리, 설정방이름(주는자리));
  for (const [이름, 길] of [['받는', 받는방], ['주는', 주는방]]) {
    if (!fs.existsSync(길)) { console.error(`⛔ ${이름} 자리 설정방이 없다 — ${길}`); process.exit(1); }
  }

  const 계획 = 옮길계획(방읽기(주는방), 방읽기(받는방));
  const 한다 = process.argv.includes('--한다');

  console.log(`\n■ ${주는자리}번 → ${받는자리}번  (${한다 ? '실제로 옮긴다' : '보여만 준다 — 옮기려면 --한다'})`);
  console.log(`   받는 자리 ${받는방}`);
  console.log(`   주는 자리 ${주는방}\n`);
  console.log('🔴 손대지 않는 것 — 이것이 구독을 지키는 자리다');
  for (const f of 손대지않을것) console.log(`     ⛔ ${f}${fs.existsSync(path.join(받는방, f)) ? '  (받는 자리에 있다 · 그대로 둔다)' : ''}`);

  console.log('\n■ 새로 들어갈 방');
  if (계획.새방.length === 0) console.log('     (없다)');
  for (const r of 계획.새방) console.log(`     + ${r.방}  파일 ${r.파일수}개`);

  console.log('\n■ 합칠 방 (겹치지 않는 것만)');
  if (계획.합칠방.length === 0) console.log('     (없다)');
  for (const r of 계획.합칠방) console.log(`     ~ ${r.방}  파일 ${r.파일.length}개`);

  console.log('\n■ 겹쳐서 막힌 것 — ⛔ 덮지 않는다');
  if (계획.막힌것.length === 0) console.log('     (없다 · 덮어쓸 일이 없다)');
  for (const r of 계획.막힌것) console.log(`     ! ${r.방}  겹침 ${r.겹친파일.length}개 — ${r.겹친파일.slice(0, 3).join(', ')}`);

  // ⚠ 「파일 N개」만 내면 기억이 안 오는 것으로 읽힌다. 함께 센다.
  const 주는방들2 = 방읽기(주는방);
  const 오는방이름 = new Set([...계획.새방.map((r) => r.방), ...계획.합칠방.map((r) => r.방)]);
  const 오는것 = 주는방들2.filter((r) => 오는방이름.has(r.방));
  const 오는기억 = 오는것.reduce((s, r) => s + (r.기억 || 0), 0);
  const 오는곁일꾼 = 오는것.reduce((s, r) => s + (r.곁일꾼 || 0), 0);
  console.log(`\n■ 옮길 것 — 대화록 ${계획.옮길수}개 · 기억(memory/*.md) ${오는기억}개 · 곁일꾼 기록 ${오는곁일꾼}개`);
  console.log(`   ⭐ 기억 ${오는기억}개가 4번이 «스스로 쌓은 것»이다. 대화록보다 이것이 더 값지다.`);

  if (!한다) {
    console.log('\n▶ 실제로 옮기려면 같은 명령에 --한다 를 붙입니다.');
    console.log('\n■ 옮긴 뒤 «사람이» 할 것 — 파일로 안 옮겨지는 것들');
    for (const 줄 of 옮긴뒤할것) console.log('   ' + 줄);
    process.exit(0);
  }

  // 되돌릴 자리를 먼저 만든다 — 받는 자리의 projects 만 백업한다(자격 파일은 손대지 않는다)
  const 백업 = path.join(설정방뿌리, 백업이름(받는자리));
  console.log(`\n· 되돌릴 자리를 만든다 — ${백업}/projects`);
  통째복사(path.join(받는방, 'projects'), path.join(백업, 'projects'));

  let 센것 = 0;
  for (const r of [...계획.새방, ...계획.합칠방]) {
    통째복사(path.join(주는방, 'projects', r.방), path.join(받는방, 'projects', r.방));
    센것 += 1;
    console.log(`  ✅ ${r.방}`);
  }
  console.log(`\n✅ 방 ${센것}개를 옮겼다. 주는 자리는 «그대로 남아 있다» — 되돌릴 자리다.`);
  console.log('\n■ 이제 «사람이» 할 것');
  for (const 줄 of 옮긴뒤할것) console.log('   ' + 줄);
}
