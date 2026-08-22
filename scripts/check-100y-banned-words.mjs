/**
 * check-100y-banned-words.mjs — **안 쓰기로 한 낱말이 화면에 남아 있나**
 *
 * 🔴 왜 만드나 — 2026-08-21 하루에 **세 번** 같은 실수를 했다.
 * ```
 *   ① 카드에 「궁합을 보지 않습니다」        → 자가시험이 «궁합»을 잡았다
 *   ② /saju 에 「등수를 매기지 않았습니다」   → 지면을 열어 보고 «등수»를 찾았다
 *   ③ /nursery 에 「이것은 등수가 아닙니다」  → 또 «등수»가 남았다
 * ```
 * ⭐ 셋 다 **부정문**이었다. 나는 「안 한다」고 썼는데, 손님 눈에도 검색엔진에도
 *   그 낱말은 **그냥 화면에 있는 낱말**이다. 부정해도 낱말은 남는다.
 *   초등 지면 주석에 이미 「부정해도 낱말은 화면에 남는다」고 적혀 있었는데 또 어겼다.
 *   ⇒ 말로 지키는 것은 세 번 실패했다. **자로 박는다.**
 *
 * ⚠ 이 자는 «소스»가 아니라 **빌드된 지면**을 본다. 주석은 화면에 안 나가기 때문이다
 *   (그 구분을 못 해서 8/20 에 헛경보를 한 번 냈다).
 * ⚠ dist 가 없으면 「없다」가 아니라 **「못 쟀다」**로 끝낸다.
 *
 * 쓰는 법  node scripts/check-100y-banned-words.mjs [--자세히]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 방 = path.join(뿌리, 'dist/100y');

/**
 * 우리가 안 쓰기로 한 낱말 — 까닭을 함께 적는다. ⛔ 까닭 없는 금지어를 늘리지 않는다
 *
 * 🔴 첫 판이 **3,190장을 잡았다. 자가 거짓말을 했다.** 두 가지를 틀렸다 —
 *   ① 「초**등수**학교육과」의 «등수»를 셌다. 한글에는 낱말 경계(\b)가 없다
 *   ② /about 의 「순위 매기지 않습니다」까지 셌다. 그건 **우리가 하는 약속**이다
 *   ⇒ ①은 앞글자를 막아서, ②는 허락 대장으로 가른다. 자가 우는 늑대가 되면 아무도 안 본다.
 */
export const 금지말 = [
  { 말: '등수', 자: /(?<![초중고])등수/, 까닭: '우리는 줄을 세우지 않는다' },
  { 말: '순위', 자: /순위/, 까닭: '우리는 줄을 세우지 않는다' },
  { 말: '랭킹', 자: /랭킹/, 까닭: '우리는 줄을 세우지 않는다' },
  { 말: '몇 위', 자: /몇\s*위/, 까닭: '화면에 「몇 위」를 쓰지 않는다(우리 규칙)' },
  { 말: '궁합', 자: /궁합/, 까닭: '우리가 하는 일이 아니다' },
  { 말: '운세', 자: /운세/, 까닭: '우리가 하는 일이 아니다' },
  { 말: '명문', 자: /명문(?!화)/, 까닭: '학교를 좋고 나쁨으로 가르지 않는다' },
];

/**
 * 🔴🔴 두 번째로 자가 거짓말했다 — 허락 대장을 두 장 넣고도 **3,186장**이 남았다.
 *
 * 열어 보니 내 잘못이 아니었다. 우리 지면은 **온 사이트가** 이렇게 쓴다 —
 * ```
 *   /elementary  「등수를 매기지 않습니다」        /price   「등수 — 매기지 않습니다」
 *   /data        「순위 등수 열은 넣지 않았습니다」  /region  「이 숫자는 등수가 아닙니다」(258장)
 * ```
 * ⭐ 이건 실수가 아니라 **우리가 손님께 하는 약속**이다. 몇 달 동안 그렇게 써 왔고 사장님이 보셨다.
 *   내가 오늘 세 번 걸린 것은 «카드»의 자가시험이었다 — 카드는 글자 자리가 좁아 규칙이 더 엄하다.
 *
 * ⛔ 그러니 이 자가 3,186장을 빨강으로 만들면 **내 판단으로 우리 말투를 뒤집는 것**이다. 안 한다.
 * ⇒ 자를 바꾼다. 「이 낱말이 있나」가 아니라 **「어제 없던 자리에 새로 생겼나」**를 본다.
 *   대장은 docs/금지말-대장.json. 처음 돌리면 대장을 만들고 아무것도 빨강으로 만들지 않는다.
 */
export const 대장길 = 'docs/금지말-대장.json';

/** 화면에 실제로 나가는 글자만 남긴다 — 스타일·스크립트·주석·태그를 걷는다 */
export function 민글(h) {
  return String(h)
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ');
}

/** 그 낱말이 든 앞뒤를 잘라 보여 준다 — 어디를 고칠지 바로 알게 */
export function 둘레(글, 말, 폭 = 34) {
  const i = 글.indexOf(말);
  if (i < 0) return '';
  return '…' + 글.slice(Math.max(0, i - 폭), i + 말.length + 폭).trim() + '…';
}

export function 지면들(방) {
  const 낸다 = [];
  const 훑기 = (곳) => {
    /* ⚠ 다른 세션이 빌드 중이면 이 갈래가 훑는 순간 사라질 수 있다 — 그러면 «없다»가 아니라
       **이번 판에서 못 훑었다**로 조용히 건너뛴다(check-100y-banned-words.mjs 참고 사례) */
    let 목록;
    try { 목록 = fs.readdirSync(곳, { withFileTypes: true }); } catch { return; }
    for (const f of 목록) {
      const p = path.join(곳, f.name);
      if (f.isDirectory()) 훑기(p);
      else if (f.name.endsWith('.html')) 낸다.push(p);
    }
  };
  훑기(방);
  return 낸다;
}

/* ── 자가시험 ─────────────────────────────────────────── */
if (process.argv.includes('--selftest')) {
  const 본다 = (말, 참) => { console.log(참 ? '✅' : '🔴', 말); if (!참) process.exitCode = 1; };
  본다('① 주석 속 낱말은 화면 글이 아니다', !민글('<!-- 등수 --><p>가</p>').includes('등수'));
  본다('② 스타일 속 낱말도 아니다', !민글('<style>.등수{}</style><p>가</p>').includes('등수'));
  본다('③ 화면에 있는 낱말은 잡는다', 금지말[0].자.test(민글('<p>이것은 등수가 아닙니다</p>')));
  본다('⑤ 🔴 「초등수학교육과」의 등수를 잡지 않는다', !금지말[0].자.test('초등수학교육과'));
  본다('⑥ 낱말마다 까닭이 적혀 있다 — 까닭 없는 금지어를 늘리지 않는다',
    금지말.every((w) => w.까닭 && w.자 instanceof RegExp));
  본다('④ 둘레를 보여 준다', 둘레('앞 이것은 등수가 아닙니다 뒤', '등수').includes('등수'));
  본다('⑦ 🔴 없는 갈래를 훑어도 안 죽는다(동시 빌드 방어)', 지면들(path.join(뿌리, '없는-갈래-xyz')).length === 0);
  process.exit();
}

/* ── 몸 ───────────────────────────────────────────────── */
if (!fs.existsSync(방)) {
  console.log('⬜ dist/100y 가 없다 — **못 쟀다.** build-once 를 먼저 돌린다');
  process.exit(0);
}

const 자세히 = process.argv.includes('--자세히');
const 지면 = 지면들(방);
const 이제 = {};
const 글모음 = {};
let 못읽은것 = 0;
for (const p of 지면) {
  /* ⚠ 다른 세션이 같은 dist 를 동시에 빌드하면, astro 가 지우고 다시 쓰는 그 짧은 순간에
     여기서 목록엔 있었는데 읽으려는 순간 파일이 없을 수 있다(2026-08-22 실제로 겪음).
     그 지면이 "죽었다"가 아니라 **이번 판에서 못 읽었다**로 조용히 건너뛴다 */
  let 원문;
  try { 원문 = fs.readFileSync(p, 'utf8'); } catch { 못읽은것++; continue; }
  const 글 = 민글(원문);
  /* ⚠ 윈도는 길을 역슬래시로 준다. 대장은 빗금으로 적어 두어 맞춰 준다.
     정규식을 셸로 옮기면 역슬래시가 먹혀 오늘만 두 번 죽었다 — 셈 없이 나눠 잇는다 */
  const 이름 = path.relative(방, p).split(path.sep).join('/');
  const 든것 = 금지말.filter((w) => w.자.test(글)).map((w) => w.말);
  if (든것.length) { 이제[이름] = 든것; 글모음[이름] = 글; }
}

const 대장절대길 = path.join(뿌리, 대장길);
console.log('\n백년지도 — 어제 없던 자리에 «안 쓰기로 한 낱말»이 새로 생겼나\n');

if (!fs.existsSync(대장절대길)) {
  fs.mkdirSync(path.dirname(대장절대길), { recursive: true });
  fs.writeFileSync(대장절대길, JSON.stringify({
    무엇: '지면마다 화면에 있는 «안 쓰기로 한 낱말» — 이 대장이 기준선이다',
    '⛔': '대장에 있는 것은 잘못이 아니다. 우리 지면은 「등수를 매기지 않습니다」처럼 약속으로 쓴다. 새로 생긴 것만 본다',
    만든날: new Date().toISOString().slice(0, 10),
    지면수: 지면.length, 든지면수: Object.keys(이제).length, 지면별: 이제,
  }, null, 1), 'utf8');
  console.log(`  ⬜ 대장이 없어 지금 상태로 **기준선을 만들었다** — ${대장길}`);
  console.log(`     지면 ${지면.length}장 중 ${Object.keys(이제).length}장에 그 낱말이 있다(잘못이 아니다).`);
  console.log('     다음부터 **여기서 늘어난 것만** 빨강이 된다.');
  process.exit(0);
}

const 대장 = JSON.parse(fs.readFileSync(대장절대길, 'utf8'));
const 전 = 대장.지면별 || {};
const 새로 = [];
for (const [이름, 든것] of Object.entries(이제)) {
  const 늘어난 = 든것.filter((w) => !(전[이름] || []).includes(w));
  if (늘어난.length) 새로.push({ 이름, 늘어난 });
}

console.log(`  지면 ${지면.length}장 · 낱말 ${금지말.length}개 · 기준선 ${대장.만든날}`);
if (못읽은것) console.log(`  ⬜ 동시 빌드로 못 읽은 지면 ${못읽은것}개 — 이번 판에서 못 쟀다(잘못이 아니다)`);
console.log(`  🔴 새로 생긴 지면 ${새로.length}장\n`);
for (const r of 새로.slice(0, 자세히 ? 999 : 20)) {
  for (const 말 of r.늘어난) {
    const w = 금지말.find((x) => x.말 === 말);
    console.log(`  🔴 ${r.이름}  「${말}」 — ${w.까닭}`);
    console.log(`       ${둘레(글모음[r.이름], (글모음[r.이름].match(w.자) || [말])[0])}`);
  }
}
if (!새로.length) console.log('  ✅ 새로 생긴 곳이 없다');
const 걸린지면 = 새로.length;

console.log('\n⭐ 부정문도 걸린다. 「등수가 아닙니다」라고 써도 «등수»는 화면에 남는다.');
console.log('   안 하는 것을 늘어놓지 말고, 하는 것만 적는다.');
process.exitCode = 걸린지면 ? 1 : 0;
