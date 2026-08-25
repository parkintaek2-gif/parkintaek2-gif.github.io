/**
 * what-rulers-exist.mjs — **새 자를 세우기 «전»에, 이미 있는 자를 먼저 본다.**
 *
 * ── 🔴 왜 이 자가 생겼나 ───────────────────────────────────────
 * 2026-08-25 하루에 **세 번** 같은 잘못을 했다 —
 * ```
 *   ① 학교 지면을 지으려다 `netflix-top-10-korean-drama.astro`·`hometowns.astro` 가
 *      이미 있는 것을 목록을 훑고서야 알았다
 *   ② 「나가는 길」을 재는 자를 새로 만들려다 `measure-page-inlinks.mjs` 가 이미
 *      같은 링크를 훑고 있는 것을 보고 그것을 넓혔다 (이건 다행히 먼저 봤다)
 *   ③ 검색어에서 「길찾기 질의」를 걷어내는 자를 새로 짰는데,
 *      8/24 에 내가 만든 `measure-click-gap.mjs` 의 `남의주소찾기` 가 «자가시험까지 붙여»
 *      바로 그 질의를 거르고 있었다. 한 시간을 다시 쓴 셈이다
 * ```
 * ⭐ 공통점은 하나다 — **「내가 무엇을 갖고 있나」를 안 보고 시작했다.**
 *   자가 200개 가까이 되면 사람 기억으로는 안 된다. 그래서 «자로 만든다».
 *
 * ── ⛔ 이 자가 하지 않는 것 ────────────────────────────────────
 * ⛔ 「이 자를 쓰라」고 고르지 않는다. **목록을 보여 줄 뿐**이고 고르는 것은 사람이 한다.
 *   낱말이 겹친다고 같은 일을 하는 자는 아니다 — 열어 봐야 안다.
 * ⛔ 첫 줄 설명이 없는 자를 «없는 자»로 세지 않는다. 설명이 없다고 적는다.
 *
 * 쓰는 법  node scripts/what-rulers-exist.mjs --자가시험
 *          node scripts/what-rulers-exist.mjs 검색어         (그 말이 든 자를 찾는다)
 *          node scripts/what-rulers-exist.mjs                (갈래별 수만 본다)
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 자방 = path.join(뿌리, 'scripts');

/**
 * 파일 첫머리 주석에서 «한 줄 설명»을 뽑는다.
 * 우리 자들은 `이름.mjs — 설명` 꼴로 첫 줄을 적는 버릇이 있다.
 * ⛔ 없으면 null 이다(빈 글자가 아니다) — 「설명이 없다」와 「설명이 빈칸이다」는 다르다.
 */
export function 한줄설명(원문) {
  const s = String(원문 ?? '');
  const m = s.match(/^\s*\/\*\*?\s*\n\s*\*\s*[\w.-]+\.mjs\s*[—-]\s*(.+)$/m)
    ?? s.match(/^\s*\/\*\*?\s*\n\s*\*\s*(.+)$/m);
  if (!m) return null;
  return m[1].replace(/\*+\//g, '').replace(/\*\*/g, '').trim() || null;
}

/**
 * 이름으로 갈래를 나눈다. 우리 이름 규칙이 그대로 갈래가 된다 —
 * `measure-` 는 재는 것, `check-` 는 검사, `build-` 는 짓는 것, `collect-` 는 캐는 것.
 */
export function 갈래(이름) {
  if (/^measure-/.test(이름)) return '재는 자';
  if (/^check-/.test(이름)) return '검사';
  if (/^build-/.test(이름)) return '짓는 자';
  if (/^collect-/.test(이름)) return '캐는 자';
  if (/^(deploy|ping|submit|broadcast|make|rebuild)-/.test(이름)) return '내보내는 자';
  return '그 밖';
}

/** 찾는 말이 이름이나 설명에 들어 있나 — 대소문자·이음표를 안 가린다 */
export function 걸리나(이름, 설명, 찾는말) {
  if (!찾는말) return true;
  const 고르기 = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9가-힣]+/g, ' ');
  const q = 고르기(찾는말).trim();
  if (!q) return true;
  const 밭 = `${고르기(이름)} ${고르기(설명)}`;
  return q.split(' ').filter(Boolean).some((w) => 밭.includes(w));
}

export function 모으기(방 = 자방, 읽기 = { readdirSync, readFileSync }) {
  let 것들 = [];
  try { 것들 = 읽기.readdirSync(방); } catch { return []; }
  return 것들.filter((f) => f.endsWith('.mjs')).map((f) => {
    let 원문 = '';
    try { 원문 = 읽기.readFileSync(path.join(방, f), 'utf8'); } catch { /* 못 읽으면 설명 없음 */ }
    return { 이름: f, 갈래: 갈래(f), 설명: 한줄설명(원문) };
  });
}

/* ────────────────────────── 자가시험 ────────────────────────── */
function 자가시험() {
  const 시험 = [];
  const T = (이름, 참) => 시험.push([이름, !!참]);

  T('한줄설명 — 우리 버릇대로 적힌 것을 뽑는다',
    한줄설명('/**\n * measure-x.mjs — **재는 자다.**\n */') === '재는 자다.');
  T('한줄설명 — 굵은 표시를 지운다',
    !String(한줄설명('/**\n * a.mjs — **굵게**\n */')).includes('*'));
  T('한줄설명 — 이름이 없어도 첫 줄을 뽑는다',
    한줄설명('/**\n * 그냥 설명\n */') === '그냥 설명');
  /* ⛔ 「설명이 없다」와 「빈칸이다」는 다르다 */
  T('한줄설명 — 주석이 없으면 null(빈 글자가 아니다)', 한줄설명('const a = 1;') === null);
  T('한줄설명 — 빈 값도 null', 한줄설명(undefined) === null);

  T('갈래 — measure 는 재는 자', 갈래('measure-click-gap.mjs') === '재는 자');
  T('갈래 — check 는 검사', 갈래('check-demand-covered.mjs') === '검사');
  T('갈래 — build 는 짓는 자', 갈래('build-kcw-groups.mjs') === '짓는 자');
  T('갈래 — collect 는 캐는 자', 갈래('collect-korean-groups.mjs') === '캐는 자');
  T('갈래 — 규칙 밖은 «그 밖»으로 둔다(억지로 안 넣는다)', 갈래('_kst.mjs') === '그 밖');

  T('걸리나 — 이름에 있으면 걸린다', 걸리나('measure-click-gap.mjs', '', 'click'));
  T('걸리나 — 설명에 있으면 걸린다', 걸리나('a.mjs', '검색어를 잰다', '검색어'));
  T('걸리나 — 대소문자를 안 가린다', 걸리나('Measure-Click.mjs', '', 'click'));
  T('걸리나 — 이음표를 빈칸처럼 본다', 걸리나('measure-click-gap.mjs', '', 'click gap'));
  T('걸리나 — 없으면 안 걸린다', !걸리나('a.mjs', '아무것도', 'zzzz'));
  T('걸리나 — 찾는 말이 없으면 다 통과', 걸리나('a.mjs', '', ''));

  const 가짜 = {
    readdirSync: () => ['measure-a.mjs', 'check-b.mjs', 'notes.md'],
    readFileSync: (p) => (p.includes('measure-a')
      ? '/**\n * measure-a.mjs — **가 재는 것.**\n */'
      : 'const x = 1;'),
  };
  const 모은 = 모으기('/x', 가짜);
  T('모으기 — mjs 만 담는다', 모은.length === 2);
  T('모으기 — 설명을 뽑는다', 모은[0].설명 === '가 재는 것.');
  T('모으기 — 설명 없는 것은 null 로 둔다', 모은[1].설명 === null);
  T('모으기 — 없는 방에 안 터진다', 모으기('/없다', { readdirSync: () => { throw new Error('x'); }, readFileSync: () => '' }).length === 0);

  const 진 = 시험.filter(([, ok]) => !ok);
  for (const [이름] of 진) console.error(`❌ ${이름}`);
  if (진.length) { console.error(`⛔ what-rulers-exist 자가시험 ${진.length}개 실패`); process.exit(1); }
  console.log(`✅ what-rulers-exist 자가시험 통과 (${시험.length})`);
}

/* ────────────────────────── 실행 ────────────────────────── */
if (process.argv.includes('--자가시험')) {
  자가시험();
} else {
  if (!existsSync(자방)) { console.error(`⛔ ${자방} 이 없다`); process.exit(1); }
  const 찾는말 = process.argv.slice(2).filter((a) => !a.startsWith('--')).join(' ');
  const 모두 = 모으기();
  const 걸린것 = 모두.filter((x) => 걸리나(x.이름, x.설명, 찾는말));

  console.log(`■ 자 ${모두.total ?? 모두.length}개`
    + (찾는말 ? ` 중 「${찾는말}」로 걸린 것 ${걸린것.length}개` : ''));
  console.log('');
  const 통 = new Map();
  for (const x of 걸린것) {
    if (!통.has(x.갈래)) 통.set(x.갈래, []);
    통.get(x.갈래).push(x);
  }
  for (const [g, a] of [...통].sort((x, y) => y[1].length - x[1].length)) {
    console.log(`## ${g} — ${a.length}개`);
    if (찾는말) {
      for (const x of a) {
        console.log(`   ${x.이름}`);
        console.log(`      ${x.설명 ?? '⬜ 첫 줄 설명이 없다 — 열어 봐야 안다'}`);
      }
    }
    console.log('');
  }
  if (!찾는말) {
    console.log('⭐ 찾는 말을 주면 그 말이 든 자를 이름·설명까지 보여 준다 —');
    console.log('   node scripts/what-rulers-exist.mjs 검색어');
  }
  console.log('⛔ 낱말이 겹친다고 «같은 일을 하는 자»는 아니다. 걸린 것은 열어 본다.');
  console.log('⛔ 이 목록은 고르지 않는다. 새 자를 세우기 «전»에 여기부터 보는 것이 이 자의 쓸모다.');
}
