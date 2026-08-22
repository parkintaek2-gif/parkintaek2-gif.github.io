#!/usr/bin/env node
/**
 * fix-kcw-body-doors.mjs — **기사 본문에 나가는 문이 하나도 없는 편에 문을 낸다.**
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * `check-visitor-walk.mjs` 가 이렇게 적어 두었다 —
 *   「꼬리말·이웃기사까지 세면 늘 통과했다. 재는 자리가 틀렸다.
 *    검색으로 온 사람은 첫 화면을 안 거치고 **기사 한 장에 곧장 떨어진다.**」
 * 2026-08-22 실측으로 **111편 중 17편**이 본문에 링크가 0개였다. 그 편에 떨어진 손님은
 * 꼬리말까지 내려가지 않으면 나갈 길이 없다.
 *
 * ── 어떻게 고르나 (⛔ 손으로 안 고른다) ───────────────────────
 * 그 기사의 앞말 `pages:` 에 적힌 **자기 자료 지면**으로 보낸다. 기사가 그 지면의 표로
 * 쓴 것이니 가장 가까운 문이고, 편마다 다르게 나온다.
 * ⛔ 「관련 지면」을 사람이 고르지 않는다 — 다음 기사에서 또 빠진다.
 * ⛔ `pages` 가 빈 기사는 **건드리지 않고 이름을 남긴다.** 없는 문을 지어내지 않는다.
 * ⚠ 이미 본문에 링크가 있는 편은 손대지 않는다(다시 돌려도 같다).
 *
 * 쓰는 법  node scripts/fix-kcw-body-doors.mjs --자가시험
 *          node scripts/fix-kcw-body-doors.mjs --본다      무엇이 바뀔지만 보여 준다
 *          node scripts/fix-kcw-body-doors.mjs --고친다
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CD = path.join(뿌리, 'content/kculturewire');

/** 앞말의 pages 목록. CRLF 로 저장된 편이 섞여 있어 `\s` 를 안 쓴다(8/8 에 한 편을 놓쳤다) */
export const pages읽기 = (원본) => {
  const m = 원본.match(/^pages:[^\S\r\n]*\r?\n((?:[^\S\r\n]+-[^\S\r\n]+.*\r?\n)+)/m);
  if (!m) return [];
  return [...m[1].matchAll(/-[^\S\r\n]+"?([^"\r\n]+?)"?[^\S\r\n]*\r?$/gm)].map((x) => x[1].trim());
};

export const 본문떼기 = (원본) => 원본.replace(/^---[\s\S]*?\r?\n---/, '');
export const 본문에링크있나 = (원본) => [...본문떼기(원본).matchAll(/\]\((\/[^)]*)\)/g)].length > 0;

/** 낼 한 줄. 지면이 둘이면 둘 다 건다 — 하나만 걸면 나머지가 또 문 없는 지면이 된다 */
export function 문장만들기(지면들) {
  const 걸이 = 지면들.map((p) => `[kculturewire.com${p}](${p})`);
  if (!걸이.length) return null;
  if (걸이.length === 1) return `The table behind this is at ${걸이[0]}.`;
  const 마지막 = 걸이.pop();
  return `The tables behind this are at ${걸이.join(', ')} and ${마지막}.`;
}

/** 한 편을 고친 결과를 돌려준다. ⛔ 파일을 쓰지 않는다 — 쓰는 것은 부르는 쪽이다 */
export function 한편고치기(원본) {
  if (본문에링크있나(원본)) return { 꼴: '그대로', 새것: 원본 };
  const 지면 = pages읽기(원본);
  const 문장 = 문장만들기(지면);
  if (!문장) return { 꼴: '못한다', 새것: 원본, 말: 'pages 가 비었다 — 없는 문을 지어내지 않는다' };
  const 끝 = /\r\n/.test(원본) ? '\r\n' : '\n';
  const 몸 = 원본.replace(/[\r\n]+$/, '');
  return { 꼴: '고쳤다', 새것: `${몸}${끝}${끝}${문장}${끝}`, 문장 };
}

if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };
  const 앞말 = (지면) => `---\ntitle: "x"\npages:\n${지면.map((p) => `  - "${p}"`).join('\n')}\n---\n\nBody text.\n`;

  검('지면 하나면 한 줄', 문장만들기(['/places']) === 'The table behind this is at [kculturewire.com/places](/places).');
  검('지면 둘이면 둘 다 건다', 문장만들기(['/a', '/b']).includes('](/a)') && 문장만들기(['/a', '/b']).includes('](/b)'));
  검('빈 지면은 문장을 안 만든다', 문장만들기([]) === null);

  const r = 한편고치기(앞말(['/places']));
  검('본문 끝에 붙인다', r.꼴 === '고쳤다' && r.새것.trim().endsWith('](/places).'));
  검('앞말을 안 건드린다', r.새것.startsWith('---\ntitle: "x"'));
  검('고친 뒤에는 본문에 링크가 있다', 본문에링크있나(r.새것) === true);
  검('두 번 돌려도 한 번만 붙는다', 한편고치기(r.새것).꼴 === '그대로');
  검('pages 가 비면 안 고치고 이름을 남긴다', 한편고치기('---\ntitle: "x"\n---\n\nBody.\n').꼴 === '못한다');
  /* ⚠ CRLF 로 저장된 편이 섞여 있다 — 줄끝을 지켜야 한 파일이 통째로 바뀐 것처럼 보이지 않는다 */
  검('CRLF 파일은 CRLF 로 붙인다', 한편고치기(앞말(['/x']).replace(/\n/g, '\r\n')).새것.endsWith('\r\n'));
  검('앞말 안의 링크를 본문 링크로 안 센다', 본문에링크있나('---\nx: "[a](/b)"\n---\n\nplain\n') === false);

  if (실패.length) { console.error('❌ 자가시험 실패\n' + 실패.map((s) => `   · ${s}`).join('\n')); process.exit(1); }
  console.log('✅ fix-kcw-body-doors 자가시험 통과 (10)');
  process.exit(0);
}

const 고친다 = process.argv.includes('--고친다');
if (!고친다 && !process.argv.includes('--본다')) {
  console.error('⛔ --본다 나 --고친다 를 준다. 그냥 돌리지 않는다(글을 건드리는 자다)');
  process.exit(1);
}

const 고침 = [];
const 못함 = [];
for (const f of fs.readdirSync(CD).filter((x) => x.endsWith('.md'))) {
  const 길 = path.join(CD, f);
  const 원본 = fs.readFileSync(길, 'utf8');
  if (/^draft:[^\S\r\n]*true/m.test(원본)) continue;
  const r = 한편고치기(원본);
  if (r.꼴 === '그대로') continue;
  if (r.꼴 === '못한다') { 못함.push(`${f} — ${r.말}`); continue; }
  고침.push(`${f} — ${r.문장}`);
  if (고친다) fs.writeFileSync(길, r.새것);
}

console.log(`${고친다 ? '고쳤다' : '고칠 것'} ${고침.length}편`);
for (const s of 고침) console.log(`   · ${s}`);
if (못함.length) {
  console.log(`\n⚠ 못 고친 것 ${못함.length}편 — pages 가 비어 있다. 지면을 정하는 것은 사람 몫이다`);
  for (const s of 못함) console.log(`   · ${s}`);
}
if (!고친다) console.log('\n⚠ 아직 아무 파일도 안 바꿨다. 바꾸려면 --고친다');
