/**
 * 넷플릭스 표와 위키데이터가 **같은 작품을 다르게 적을 때** 우리 자가 무엇을 잡고
 * 무엇을 못 잡는지 잰다.
 *
 * ── 🔴 왜 만드나 (2026-08-23) ──────────────────────────────────
 * 새 자료(2026-08-16까지)를 넣자 어제까지 지면이 있던 한국 작품 **44편이 사라졌다.**
 * 자료가 없어진 것이 아니었다. 철자가 달랐다 —
 * ```
 *   표: 'Escape From Mogadishu'   위키데이터: 'Escape from Mogadishu'
 *   표: 'Bad And Crazy'           위키데이터: 'Bad and Crazy'
 *   표: 'FENGSHUI'                위키데이터: 'Fengshui'
 * ```
 * 「사라졌다」로 읽고 지면을 내렸으면 진짜 한국 작품 수십 편을 조용히 잃었을 것이다.
 * ⭐ 「자료는 늘었는데 수가 줄면 자를 먼저 의심한다」가 이것을 잡았다.
 *
 * ── ⛔ 자를 어디까지 늦출 것인가 ────────────────────────────────
 * 처음에는 문장부호·빈칸까지 지워서 맞추려 했다. **그러면 자가 망가진다.**
 * 라틴 글자가 아닌 제목은 다 지우면 빈 문자열이 되어 서로 같아진다 —
 * `'비상선언'` 하나가 다른 175편과 같은 작품이 된다. 라틴 글자에서도 남을 끌어온다:
 * `'Re/Member'`(일본)→`'Remember'`(한국) · `'The Out-Laws'`(미국)→`'The Outlaws'`(한국).
 * 그래서 **대소문자까지만** 지운다. 그 선을 넘으면 얻는 것보다 잃는 것이 크다.
 *
 * ── 무엇을 찍나 ────────────────────────────────────────────────
 * ① 대소문자만 달라 되찾은 제목 — 실제로 몇 편인가
 * ② 한 열쇠에 후보가 둘 이상 걸린 것 — 있으면 🔴 (자가 사람을 뒤섞고 있다는 뜻)
 * ③ ⚠ 빈칸·문장부호만 다른 것 — 이 자가 **못 잡는다.** 못 잡는 것이지 없는 것이 아니다
 *
 * 쓰는 법
 *   node scripts/check-title-spelling-match.mjs
 *   node scripts/check-title-spelling-match.mjs --자가시험
 */
import fs from 'node:fs';
import {
  맞춤열쇠, 글자모양만다른가, 대소문자안가리는집합, 가장최근글로벌,
} from './lib/korean-netflix-titles.mjs';

const L = String.fromCharCode(10);
const 이름파일 = 'archive/raw/netflix-top10/korean-titles.json';

/** ⚠ 여기까지 늦추면 안 되는 자. 「무엇을 잃는가」를 보이려고만 만든다 — 판정에 쓰지 않는다. */
export const 다지운열쇠 = (제목) => String(제목 ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '');

function 자가시험() {
  let 실패 = 0;
  const 검 = (말, 참) => { if (!참) { console.log(`  ⛔ 자가시험 실패 — ${말}`); 실패 += 1; } };

  검('대소문자만 다르면 같은 열쇠', 맞춤열쇠('Bad And Crazy') === 맞춤열쇠('Bad and Crazy'));
  검('빈칸이 다르면 다른 열쇠 — 여기서 멈춘다', 맞춤열쇠('Hitman') !== 맞춤열쇠('Hit Man'));
  검('문장부호가 다르면 다른 열쇠', 맞춤열쇠('Re/Member') !== 맞춤열쇠('Remember'));

  검('글자모양만다른가 — 실제로 겪은 줄', 글자모양만다른가('Escape From Mogadishu', 'Escape from Mogadishu'));
  검('⛔ 똑같은 글자는 「다르다」가 아니다', !글자모양만다른가('Squid Game', 'Squid Game'));
  검('⛔ 뜻이 다른 두 편을 같다고 하지 않는다', !글자모양만다른가('Remember', 'Re/Member'));

  /* 🔴 다 지우는 자가 왜 안 되는지 **검사로 못박는다.** 말로 적으면 다음 사람이 또 지운다. */
  검('🔴 다 지우면 한글 제목이 서로 같아진다', 다지운열쇠('비상선언') === 다지운열쇠('올드보이'));
  검('⭐ 우리 자는 한글 제목을 서로 다르게 본다', 맞춤열쇠('비상선언') !== 맞춤열쇠('올드보이'));

  const 감 = 대소문자안가리는집합(new Set(['Escape from Mogadishu', 'Fengshui']));
  검('집합 — 대소문자 안 가리고 찾는다', 감.has('ESCAPE FROM MOGADISHU'));
  검('집합 — 없는 것은 없다고 한다', !감.has('Squid Game'));
  검('집합 — 적힌 철자를 돌려준다', 감.찾기('FENGSHUI') === 'Fengshui');
  검('집합 — 없으면 null', 감.찾기('Squid Game') === null);
  검('집합 — 빈 제목이 아무거나 맞추지 않는다', !감.has(''));

  console.log(`제목 철자 맞추기 — 자가시험 13건 중 ${13 - 실패}건 통과`);
  return 실패;
}

if (자가시험() > 0) process.exit(1);
if (process.argv.includes('--자가시험') || process.argv.includes('--selftest')) process.exit(0);

/* ── 실제 자료로 잰다 ─────────────────────────────────────────── */
if (!fs.existsSync(이름파일)) {
  console.log(`⚠ 못 쟀다 — ${이름파일} 이 없다. \`npm run collect:korean-titles\` 뒤에 다시 부른다.`);
  process.exit(0);
}
const 후보이름 = JSON.parse(fs.readFileSync(이름파일, 'utf8')).제목 ?? [];
const 있다 = new Set(후보이름);
const 열쇠 = new Map();
for (const n of 후보이름) {
  const k = 맞춤열쇠(n);
  if (!k) continue;
  if (!열쇠.has(k)) 열쇠.set(k, []);
  열쇠.get(k).push(n);
}
const 느슨 = new Map();
for (const n of 후보이름) {
  const k = 다지운열쇠(n);
  if (!k) continue;
  if (!느슨.has(k)) 느슨.set(k, []);
  느슨.get(k).push(n);
}

const 글로벌 = 가장최근글로벌();
const 줄 = fs.readFileSync(글로벌, 'utf8').trim().split(/\r?\n/);
const 머리 = 줄[0].split('\t');
const iT = 머리.indexOf('show_title');
const 차트 = [...new Set(줄.slice(1).map((l) => l.split('\t')[iT]).filter(Boolean))];

const 되찾음 = [];
const 못잡음 = [];
const 뒤섞임 = [];
for (const t of 차트) {
  if (있다.has(t)) continue;
  const c = 열쇠.get(맞춤열쇠(t));
  if (c) { 되찾음.push(`${t}  ←  ${c[0]}`); if (c.length > 1) 뒤섞임.push(`${t} → ${c.join(' | ')}`); continue; }
  const 느 = 느슨.get(다지운열쇠(t));
  if (느 && 느.length === 1) 못잡음.push(`${t}  ←?  ${느[0]}`);
}

console.log(`${L}자료: ${글로벌.split(/[\/]/).pop()} · 차트 제목 ${차트.length}개 · 위키데이터 후보 ${후보이름.length}개`);
console.log(`⭐ 대소문자만 달라 되찾은 것 ${되찾음.length}편`);
console.log(되찾음.map((s) => `   ${s}`).join(L));
console.log(`${L}⚠ 빈칸·문장부호만 다른 것 ${못잡음.length}편 — 이 자는 **못 잡는다**(없는 것이 아니다)`);
console.log(못잡음.map((s) => `   ${s}`).join(L));

if (뒤섞임.length) {
  console.log(`${L}🔴 한 열쇠에 후보가 둘 이상 ${뒤섞임.length}건 — 자가 서로 다른 작품을 뒤섞고 있다`);
  console.log(뒤섞임.map((s) => `   ${s}`).join(L));
  process.exit(1);
}
console.log(`${L}✅ 한 열쇠에 후보가 둘 이상인 것은 없다 — 되찾은 것들이 서로 뒤섞이지 않았다`);
