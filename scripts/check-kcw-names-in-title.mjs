#!/usr/bin/env node
/**
 * check-kcw-names-in-title.mjs — **지면 제목에 «스타 이름·작품명»이 들어 있나.**
 *
 * ── 🔴 왜 만드나 (2026-08-31 · 5번) ──────────────────────────
 * 사장님 지시다. 원문 그대로 —
 * > 「**스타 이름이 이렇게 제목에 나와야해**」  (2026-08-31)
 * > 「스타의 이름을 넣는다. **사람들은 이름을 검색한다**」 (2026-08-16)
 *
 * 오늘 그 값이 실제로 드러났다. 같은 물음을 받는 우리 지면이 둘이었는데 —
 * ```
 * /article/bts-is-not-a-seoul-band  「BTS hometowns: Daegu, Busan, and not one from Seoul」
 *                                   ⇒ 도시 이름뿐. «누구»가 없다
 * /bts-hometowns                    「Which BTS member is from Busan? Jimin and Jungkook — …」
 *                                   ⇒ 물음과 답, 그리고 «이름»이 있다
 * ```
 * ⛔ 말로 된 규칙은 다음 주에 또 잊힌다. 우리 규칙이 「규칙은 문장이 아니라 검사로 둔다」다.
 *
 * ── 어떻게 재나 ─────────────────────────────────────────────
 * 우리가 «쥔» 이름표(사람·작품)와 제목을 맞춰 본다. ⛔ 이름을 짐작하지 않는다 —
 * `wikitip-people.json`·`wikitip-title-pages.json` 에 적힌 것만 이름으로 친다.
 * ⚠ 모든 지면에 이름이 들어갈 수는 없다. 「나라별」·「방법」 같은 지면은 이름이 없는 게 맞다.
 *   ⇒ 그래서 **못박지 않고 «세어서 보여 준다».** 판단은 사람이 한다.
 * ⛔ 「이름이 없다」를 흠으로 «단정»하지 않는다 — 흠은 「이름을 넣을 수 있는데 안 넣은 것」이다.
 *   그것을 가리려고, **그 지면이 실제로 어떤 검색어로 뜨는지**를 같이 붙인다.
 *
 * 쓰는 법
 *   node scripts/check-kcw-names-in-title.mjs --자가시험
 *   node scripts/check-kcw-names-in-title.mjs            (뜨고 있는 지면부터)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 이름 하나가 제목 안에 «낱말로» 들어 있나. ⛔ 글자 겹침으로 세지 않는다 */
export function 이름들었나(제목, 이름) {
  const t = String(제목 ?? '');
  const n = String(이름 ?? '').trim();
  if (!t || n.length < 2) return false;
  /*
   * ⚠ 「IU」가 「built」 안에 들어 있다고 세면 안 된다. 앞뒤가 글자·숫자가 아니어야 한다.
   * ⛔ 정규식 특수문자를 그대로 넣으면 터진다 — 이름에 `.`·`&`·`(`가 실제로 있다
   *   (`12.12: The Day` · `Dali & Cocky Prince`).
   */
  const 안전 = n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^A-Za-z0-9])${안전}([^A-Za-z0-9]|$)`, 'i').test(t);
}

/** 제목에 든 이름들. ⛔ 없으면 빈 배열 — null 이 아니다(못 잰 것과 다르다) */
export function 제목속이름(제목, 이름들) {
  if (제목 == null) return null;                 /* ⛔ 제목을 못 읽은 것은 «못 쟀다» */
  return (이름들 ?? []).filter((n) => 이름들었나(제목, n));
}

/**
 * 이름이 «들어갈 수 있었나»를 본다 — 그 지면이 뜨는 검색어에 이름이 있으면 그렇다.
 * ⭐ 이것이 이 자의 알맹이다. 「이름 없음」이 아니라 **「손님은 이름으로 찾는데 우리 제목엔 없음」**.
 */
export function 넣을수있었나(검색어들, 이름들) {
  const 말 = (검색어들 ?? []).join(' ');
  return (이름들 ?? []).filter((n) => 이름들었나(말, n));
}

/* ── 자가시험 ───────────────────────────────────────────────── */
export function 자가시험() {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  검('제목에 든 이름을 찾는다', 이름들었나('Which BTS member is from Busan? Jimin and Jungkook', 'Jimin') === true);
  검('대소문자를 가리지 않는다', 이름들었나('jimin and jungkook', 'Jimin') === true);
  검('⛔ 낱말 안에 묻힌 것은 안 센다 — IU 가 built 안에 있다고 세면 안 된다',
    이름들었나('The site we built', 'IU') === false);
  검('⭐ 낱말로 서 있으면 센다', 이름들었나('IU started at 15', 'IU') === true);
  검('물음표·쉼표 옆도 낱말이다', 이름들었나('Who is Jimin, really?', 'Jimin') === true);
  검('⛔ 이름에 든 정규식 글자가 터지지 않는다',
    이름들었나('12.12: The Day charted', '12.12: The Day') === true);
  검('⛔ 그 글자가 «아무 글자»로 읽히지 않는다',
    이름들었나('12X12: The Day', '12.12: The Day') === false);
  검('& 가 든 이름도 찾는다', 이름들었나('Dali & Cocky Prince on Netflix', 'Dali & Cocky Prince') === true);
  검('⛔ 한 글자 이름은 안 센다 — 아무 데나 걸린다', 이름들었나('A big year', 'A') === false);
  검('⛔ 빈 값은 false', 이름들었나(null, 'Jimin') === false && 이름들었나('x', null) === false);

  검('제목 속 이름을 모아 준다',
    JSON.stringify(제목속이름('Jimin and Jungkook', ['Jimin', 'Jungkook', 'Suga'])) === JSON.stringify(['Jimin', 'Jungkook']));
  검('⛔ 하나도 없으면 «빈 배열»이지 null 이 아니다', JSON.stringify(제목속이름('Netflix by country', ['Jimin'])) === JSON.stringify([]));
  검('⛔ 제목을 못 읽으면 null — 「없다」와 다르다', 제목속이름(null, ['Jimin']) === null);

  검('⭐ 손님이 이름으로 찾은 것을 알아본다',
    JSON.stringify(넣을수있었나(['which bts member is from busan', 'jimin busan'], ['Jimin', 'RM'])) === JSON.stringify(['Jimin']));
  검('⛔ 검색어가 없으면 빈 배열', 넣을수있었나(null, ['Jimin']).length === 0);

  return 실패;
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--자가시험')) {
  const 실패 = 자가시험();
  if (실패.length) {
    console.error(`❌ 자가시험 실패 ${실패.length}\n${실패.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log('✅ 제목에 이름이 있나 — 자가시험 15 통과');
  process.exit(0);
}

if (내가실행됐다) {
  /* ① 우리가 «쥔» 이름표 — ⛔ 짐작하지 않는다 */
  const 읽기 = (p) => { try { return JSON.parse(fs.readFileSync(path.join(뿌리, p), 'utf8')); } catch { return null; } };
  const 사람 = 읽기('src/data/wikitip-people.json');
  const 작품 = 읽기('src/data/wikitip-title-pages.json');
  const 이름들 = [
    ...((사람?.people ?? 사람?.사람 ?? []).map((x) => x.name ?? x.이름)),
    ...((작품?.titles ?? []).map((x) => x.title)),
  ].filter((n) => n && String(n).length > 2);
  if (!이름들.length) { console.log('⬜ **못 쟀다** — 이름표를 못 읽었다'); process.exit(0); }

  /* ② 실제로 뜨고 있는 지면과 그 검색어 */
  const 틈 = 읽기('src/data/kcw-demand-gaps.json');
  if (!틈?.손댈것) { console.log('⬜ **못 쟀다** — 수요 자료가 없다. find-kcw-demand-gaps.mjs 를 먼저 돌린다'); process.exit(0); }

  console.log(`■ 쥔 이름 ${이름들.length.toLocaleString('en-US')}개로 «뜨고 있는 지면»의 제목을 본다`);
  console.log(`  수요 자료 ${틈.시작} ~ ${틈.끝}\n`);

  /* 검색어를 지면별로 모은다. ⚠ 짝이 없는 줄은 «못 쟀다»로 따로 센다 */
  const 지면별 = new Map();
  let 짝없음 = 0;
  for (const r of 틈.손댈것) {
    const p = r.지면 ?? r.page ?? null;
    if (!p) { 짝없음 += 1; continue; }
    if (!지면별.has(p)) 지면별.set(p, { 말: [], 노출: 0, 순위: [] });
    const o = 지면별.get(p);
    o.말.push(r.말); o.노출 += r.impressions ?? 0; o.순위.push(r.position ?? 99);
  }
  if (!지면별.size) {
    console.log(`⬜ **못 쟀다** — 수요 자료에 «어느 지면이 받았는지»가 없다(${짝없음}줄).`);
    console.log('   ⭐ `node scripts/find-kcw-demand-gaps.mjs --짝 <말>` 이 짝을 내 준다.');
    process.exit(0);
  }

  const 흠 = [];
  for (const [주소, o] of 지면별) {
    const 파일 = path.join(뿌리, 'dist/wikitip', `${주소.replace(/^\//, '')}.html`);
    let 제목 = null;
    try { 제목 = (fs.readFileSync(파일, 'utf8').match(/<title>([^<]*)</) ?? [])[1] ?? null; } catch { /* 못 읽었다 */ }
    const 든것 = 제목속이름(제목, 이름들);
    const 손님이쓴이름 = 넣을수있었나(o.말, 이름들);
    /* ⭐ 흠은 「이름이 없다」가 아니라 **「손님은 이름으로 찾는데 제목엔 없다」**이다 */
    if (제목 !== null && 든것.length === 0 && 손님이쓴이름.length > 0) {
      흠.push({ 주소, 제목, 노출: o.노출, 순위: o.순위.sort((a, b) => a - b)[Math.floor(o.순위.length / 2)], 이름: 손님이쓴이름 });
    }
  }

  if (짝없음) console.log(`⚠ 짝을 못 지은 검색어 ${짝없음}개 — 「없다」로 안 친다\n`);
  if (!흠.length) {
    console.log('✅ 손님이 이름으로 찾은 지면은 모두 제목에 그 이름이 있다.');
    process.exit(0);
  }
  흠.sort((a, b) => b.노출 - a.노출);
  console.log(`🔴 **손님은 «이름»으로 찾는데 우리 제목엔 그 이름이 없는 지면 ${흠.length}장**`);
  console.log('   ⭐ 사장님: 「스타 이름이 이렇게 제목에 나와야해」 · 「사람들은 이름을 검색한다」\n');
  for (const x of 흠.slice(0, 15)) {
    console.log(`  노출 ${String(x.노출).padStart(4)} · ${x.순위.toFixed(1)}위   ${x.주소}`);
    console.log(`     지금 제목  ${x.제목.slice(0, 88)}`);
    console.log(`     손님이 친 이름  ${[...new Set(x.이름)].slice(0, 6).join(', ')}`);
  }
  console.log('\n⚠ 이 자는 고치지 않는다. ⛔ 낚시로 이름을 «붙이지» 않는다 —');
  console.log('   그 지면이 정말 그 사람에 대해 말할 때만 제목에 넣는다.');
  process.exit(1);
}
