#!/usr/bin/env node
/**
 * seat-restart-brief.mjs — **다시 열린 창에게 「리부팅 직전에 무엇을 하고 있었나」를 재서 준다.**
 *
 *   node tools/seat-restart-brief.mjs 3
 *
 * ── 🔴 왜 만드나 (2026-09-10 · 사장님) ───────────────────────────────────
 *
 * 사장님: 「**N번이다. 다시 시작했다. 히스토리를 파악하고 일을 해라. 파악은 지금, 일은 11시부터**
 *        >>>이렇게만 업무지시하면 되나? **추가로 뭘 하라고 해야 리부팅 바로 직전부터
 *        제대로 이어서 할 수 있나?**」
 *
 * ⛔ 「히스토리를 파악하라」만으로는 부족하다. **어디를 볼지**를 안 알려 주기 때문에
 *   창마다 다른 곳을 보고 다른 결론을 낸다. 실제로 그래서 사고가 났다 —
 *   2026-08-09 에 어제 낸 답을 안 읽고 처음부터 다시 세어 «틀린 경영 판단»이 올라갔다.
 *
 * ⛔ 그리고 «사장님이 문장을 길게 쓰시게» 만들면 안 된다. 그것이 사장님 손을 빌리는 것이다.
 *   ⇒ 사장님은 한 줄만 치신다. 무엇을 볼지는 이 자가 «재서» 창에 찍어 준다.
 *
 * ⭐ 이 자가 짐작하지 않는 것 — 전부 디스크에서 잰다.
 * ```
 * 리부팅 시각        wmic os get lastbootuptime (없으면 「못 쟀다」)
 * 그 자리가 마지막에 한 일   git log --author 로 «그 자리 커밋» 꼬리
 * 그 자리에게 온 말      메모에서 「→ N번」·「N번 →」 이 든 마지막 글
 * 못 받은 아카이빙      폴더를 눈으로 (⛔ Riot 은 이 목록에 없다)
 * ```
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

export const 뿌리 = 'C:/Users/User/Documents/GitHub/dataeconomics';
export const 형제 = 'C:/Users/User/Documents/GitHub/klifemap';

/** 자리마다 다른 것 — 이름·사이트·저장소·자기 커밋을 가리는 이름 */
export const 자리표 = {
  1: { 이름: 'KLifeMap',        사이트: 'klifemap.ai',          방: 형제, 커밋무늬: /^\s*(1번|\[1번\])/ },
  2: { 이름: '조율(총괄)',       사이트: '—',                    방: 뿌리, 커밋무늬: /^\s*(2번|\[2번\])/ },
  3: { 이름: '백년지도',         사이트: '100yearmap.com',       방: 뿌리, 커밋무늬: /^\s*(3번|\[3번\])/ },
  4: { 이름: 'KLifeMap 보조',    사이트: 'klifemap.ai',          방: 형제, 커밋무늬: /^\s*(4번|\[4번\])/ },
  5: { 이름: 'K Culture Wire',  사이트: 'www.kculturewire.com', 방: 뿌리, 커밋무늬: /^\s*(5번|\[5번\])/ },
  6: { 이름: 'SeoulMarkets',    사이트: 'seoulmarkets.com',     방: 뿌리, 커밋무늬: /^\s*(6번|\[6번\])/ },
};

/** ⛔ 소급이 안 되는 아카이빙. Riot 은 이 목록에 없다(2026-09-03 지시). */
export const 아카이빙 = [
  { 길: 'archive/raw/broker',                 이름: '증권사 직접수집 (18:40)',  주인: 6 },
  { 길: 'archive/raw/newsdesk-korean-press',  이름: '신문 제목',                주인: 5 },
  { 길: 'archive/raw/hankyung-consensus',     이름: '한경컨센서스 (창 30일)',   주인: 2 },
  { 길: 'archive/raw/community-desk',         이름: '커뮤니티·SNS (하루 두 번)', 주인: 5 },
  { 길: 'archive/raw/stocks',                 이름: 'KRX 시세 (거래일+1)',      주인: 6 },
  { 길: 'archive/raw/trade-snapshots',        이름: '관세청 개정 대장',          주인: 5 },
];

/** 마지막 조각을 뽑는다 — 없으면 null. ⛔ 「없다」를 0 으로 채우지 않는다 */
export function 끝조각(목록) {
  if (!Array.isArray(목록) || !목록.length) return null;
  return 목록[목록.length - 1];
}

/** 폴더의 마지막 이름에서 «날»을 읽는다. 꼴이 여럿이라 셋을 다 본다 */
export function 날읽기(이름) {
  const s = String(이름 ?? '');
  let m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/(\d{4})(\d{2})(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  return null;
}

/** 며칠 지났나. 못 읽으면 null (⛔ 0 이 아니다) */
export function 며칠(날글, 오늘 = new Date()) {
  if (!날글) return null;
  const t = Date.parse(`${날글}T00:00:00+09:00`);
  if (!Number.isFinite(t)) return null;
  const 오늘0 = Date.parse(`${오늘.getFullYear()}-${String(오늘.getMonth() + 1).padStart(2, '0')}-${String(오늘.getDate()).padStart(2, '0')}T00:00:00+09:00`);
  return Math.round((오늘0 - t) / 86400000);
}

/** 메모에서 그 자리 이름이 든 마지막 제목줄들 */
export function 내이야기찾기(글, 자리, 몇개 = 4) {
  const 무늬 = new RegExp(`^## \\[(?:[^\\]]*→\\s*(?:${자리}번|전체)|${자리}번\\s*→[^\\]]*)\\]`);
  const 것 = String(글 ?? '').split(/\r?\n/).filter((줄) => 무늬.test(줄));
  return 것.slice(-몇개);
}

/** 리부팅 시각 — 못 재면 null */
export function 리부팅시각(재기 = null) {
  /* 🔴 [2026-09-10 실측] `wmic` 은 이 PC(Windows 11 26200)에 «없다» —
   *   「'wmic'은(는) 내부 또는 외부 명령…이 아닙니다」가 화면에 새어 나왔다.
   *   ⇒ CIM 으로 잰다. 그리고 두 꼴을 다 읽는다(옛 wmic 꼴도 남겨 둔다). */
  const 잼 = 재기 ?? (() => {
    try {
      return execSync(
        'powershell -NoProfile -Command "(Get-CimInstance Win32_OperatingSystem).LastBootUpTime.ToString(\'yyyy-MM-dd HH:mm:ss\')"',
        { encoding: 'utf8', timeout: 20000, stdio: ['ignore', 'pipe', 'ignore'] },
      );
    } catch { return null; }
  });
  const 글 = String(잼() ?? '');
  let m = 글.match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}:${m[6]}`;
  m = 글.match(/LastBootUpTime=(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}:${m[6]}`;
  return null;
}

/* ── 자가시험 ───────────────────────────────────────────────────────── */
function 자가시험() {
  const 것 = []; const 재다 = (이름, 됐나) => 것.push({ 이름, 됐나 });

  재다('자리가 여섯이다', Object.keys(자리표).length === 6);
  재다('1·4번은 klifemap 저장소다', 자리표[1].방 === 형제 && 자리표[4].방 === 형제);
  재다('2·3·5·6번은 dataeconomics 다',
    [2, 3, 5, 6].every((n) => 자리표[n].방 === 뿌리));
  재다('🔴 아카이빙 목록에 Riot 이 없다 (2026-09-03 지시)',
    !아카이빙.some((a) => /riot/i.test(a.길)));
  재다('아카이빙 주인이 다 적혀 있다', 아카이빙.every((a) => [1, 2, 3, 4, 5, 6].includes(a.주인)));

  재다('끝조각: 마지막을 준다', 끝조각(['a', 'b', 'c']) === 'c');
  재다('⛔ 끝조각: 빈 것은 null — 0 으로 채우지 않는다',
    끝조각([]) === null && 끝조각(null) === null);

  재다('날읽기: 2026-09-10.json', 날읽기('2026-09-10.json') === '2026-09-10');
  재다('날읽기: 20260910.ndjson', 날읽기('20260910.ndjson') === '2026-09-10');
  재다('날읽기: analysts-2026-09-09.json', 날읽기('analysts-2026-09-09.json') === '2026-09-09');
  재다('⛔ 날읽기: 날이 없으면 null', 날읽기('README.md') === null && 날읽기(null) === null);

  const 오늘 = new Date('2026-09-10T07:50:00+09:00');
  재다('며칠: 오늘은 0', 며칠('2026-09-10', 오늘) === 0);
  재다('며칠: 어제는 1', 며칠('2026-09-09', 오늘) === 1);
  재다('⛔ 며칠: 못 읽으면 null — 0 이 아니다',
    며칠(null, 오늘) === null && 며칠('아무거나', 오늘) === null);

  const 메모 = [
    '## [2번 → 5번] 매시 소통',
    '## [5번 → 전체] 07:50 세션입구',
    '## [1번 → 2번] 매시 보고 (07:25)',
    '## [5번 → 3번] 고용24 984행',
    '아무 줄',
  ].join('\n');
  재다('내이야기찾기: 3번은 «→ 3번» 과 «전체» 를 받는다', (() => {
    const r = 내이야기찾기(메모, 3);
    return r.length === 2 && /전체/.test(r[0]) && /→ 3번/.test(r[1]);
  })());
  재다('내이야기찾기: 5번은 자기가 «보낸 것»도 본다 — 직전에 뭘 하고 있었나가 거기 있다', (() => {
    const r = 내이야기찾기(메모, 5);
    return r.length === 3;
  })());
  재다('⛔ 내이야기찾기: 1번 → 2번 은 3번 것이 아니다',
    !내이야기찾기(메모, 3).some((줄) => /1번 → 2번/.test(줄)));
  재다('⛔ 내이야기찾기: 빈 글은 빈 목록', 내이야기찾기('', 3).length === 0);

  재다('리부팅시각: CIM 꼴을 읽는다',
    리부팅시각(() => '2026-09-10 00:06:53\r\n') === '2026-09-10 00:06:53');
  재다('리부팅시각: 옛 wmic 꼴도 읽는다 — 다른 PC 에서 돌 수 있다',
    리부팅시각(() => 'LastBootUpTime=20260910000653.500000+540') === '2026-09-10 00:06:53');
  재다('⛔ 리부팅시각: 못 재면 null',
    리부팅시각(() => null) === null && 리부팅시각(() => '아무 글') === null);

  const 실패 = 것.filter((x) => !x.됐나);
  console.log(`■ 자가시험 ${것.length - 실패.length}/${것.length}`);
  for (const x of 실패) console.log(`  🔴 ${x.이름}`);
  return 실패.length === 0;
}

/* ── 돌리기 ─────────────────────────────────────────────────────────── */
if (process.argv.includes('--자가시험')) {
  process.exit(자가시험() ? 0 : 1);
}

const 자리 = Number(process.argv[2] ?? process.env.CLAUDE_SEAT);
const 칸 = 자리표[자리];
if (!칸) {
  console.log('쓰는 법: node tools/seat-restart-brief.mjs <자리번호>');
  console.log('        (CLAUDE_SEAT 가 심어져 있으면 번호를 생략해도 된다)');
  process.exit(1);
}

const 이제 = new Date();
const 줄 = (s = '') => console.log(s);

줄('');
줄(`═══ ${자리}번 ${칸.이름} — 다시 열렸다. 이어서 할 것 ═══`);
줄(`    지금 ${이제.toLocaleString('ko-KR')} KST · 사이트 ${칸.사이트}`);

const 부팅 = 리부팅시각();
줄('');
줄(`■ 1. 리부팅  ${부팅 ?? '⬜ 못 쟀다 (wmic 이 답을 안 줬다)'}`);
줄('    ⇒ 이 시각 «직전» 커밋이 내가 하던 일이다. 아래에서 본다.');

줄('');
줄('■ 2. 내가 마지막에 한 일 — git log 로 «잰다»');
try {
  const 로그 = execSync(
    'git log --since="36 hours ago" --pretty=format:"%ad|%s" --date=format:"%m-%d %H:%M"',
    { cwd: 칸.방, encoding: 'utf8', timeout: 20000 },
  ).split(/\r?\n/).filter(Boolean);
  const 내것 = 로그.filter((l) => 칸.커밋무늬.test(l.split('|')[1] ?? ''));
  if (!내것.length) {
    줄('    ⬜ 36시간 안에 내 이름이 붙은 커밋이 없다.');
    줄('       ⛔ 「일을 안 했다」로 읽지 않는다 — 커밋 메시지에 번호를 안 붙였을 수 있다.');
    줄('       그러면 저장소 전체 꼬리를 본다:  git log --oneline -30');
  } else {
    for (const l of 내것.slice(-6)) 줄(`    ${l.replace('|', '  ')}`);
  }
} catch (e) {
  줄(`    🔴 못 쟀다 — ${e.message.split('\n')[0]}`);
}

줄('');
줄('■ 3. 나에게 온 말 — 메모에서 내 번호가 든 마지막 글');
for (const [칭, 길] of [['공용', path.join(뿌리, 'docs/세션간-메모.md')], ['klifemap', path.join(형제, 'docs/1번-4번-메모.md')]]) {
  let 글 = null;
  try { 글 = fs.readFileSync(길, 'utf8'); } catch { /* 없으면 아래 */ }
  if (글 === null) { 줄(`    ⬜ ${칭} 메모를 못 읽었다 — ${길}`); continue; }
  const 것 = 내이야기찾기(글, 자리);
  if (!것.length) { 줄(`    ⬜ ${칭} — 내 번호가 든 글이 없다`); continue; }
  줄(`    [${칭}]`);
  for (const l of 것) 줄(`      ${l.replace(/^## /, '')}`);
}

줄('');
줄('■ 4. 소급이 안 되는 아카이빙 — 폴더를 «눈으로» 봤다');
for (const a of 아카이빙) {
  let 마지막 = null;
  try {
    const 것 = fs.readdirSync(path.join(뿌리, a.길)).filter((f) => 날읽기(f)).sort();
    마지막 = 끝조각(것);
  } catch { /* 폴더가 없다 */ }
  const 날 = 날읽기(마지막);
  const d = 며칠(날, 이제);
  const 표 = d === null ? '⬜ 못 쟀다' : d === 0 ? '✅ 오늘' : d === 1 ? '⚠ 어제' : `🔴 ${d}일 지남`;
  const 내것 = a.주인 === 자리 ? '  ⬅ 내 몫이다' : '';
  줄(`    ${표.padEnd(12)} ${a.이름.padEnd(26)} ${날 ?? '—'}${내것}`);
}
줄('    ⛔ Riot 은 이 목록에 없다 — 없는 것을 확인하라고 두면 그 아래 되는 것까지 건너뛴다.');

줄('');
줄('■ 5. 이제 이 순서로 한다');
줄('    (1) CLAUDE.md 를 읽는다 — 지시 색인이 맨 위에 있다');
줄('    (2) docs/인계-현재상태.md');
줄('    (3) CronList — 깨움이 살아 있나 본다. 없으면 «다시 건다».');
줄('        ⛔ 예약은 세션 메모리에만 있다. 세션이 죽으면 같이 죽었다.');
줄('    (4) 위 4번에서 🔴 이고 «내 몫»인 아카이빙을 먼저 받는다 — 소급이 안 된다');
줄('    (5) 오늘 몫을 센다 — 텍스트 6 · 영상 1(음량을 재서) · 카드 1. 셋을 따로 센다');
줄('    (6) 메모에 「## [진행] N번 HH:MM」 한 줄을 적고 커밋·푸시한다');
줄('');
줄('    ⏰ 업무시간은 11:00 ~ 다음날 01:00 이다.');
줄('       11시 전이면 (1)~(4) 까지 «파악»만 하고, 만드는 일은 11시부터 한다.');
줄('');
줄('■ 6. 이 저장소에서 하지 않는 것');
줄('    ⛔ git add -A — 여섯 자리가 같은 작업트리를 쓴다. 경로를 하나씩 적는다');
줄('    ⛔ 남의 유닛 파일을 커밋하거나 git stash 하지 않는다');
줄('    ⛔ ctype 에 -t 를 빼지 않는다 (klifemap.ai 는 매출이 나는 서비스다)');
줄('    ⛔ 입구 .cmd 를 손으로 고치지 않는다 — tools/write-seat-entries.mjs 로 다시 찍는다');
줄('');
