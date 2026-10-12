/* 「안 쓴 축」을 하나 골랐을 때 — **우리가 이미 그 축으로 낸 것이 있나**
 *
 * ── 왜 이 자인가 (2026-10-12 16:1x · 5번) ─────────────────────────
 *   오늘 `/data/ceo-tenure` 를 다 짓고 빌드한 **뒤에야**
 *   우리 기사 `/article/korea-ceo-tenure-eleven-year-median` 이 이미 있는 것을 봤다.
 *   카드뉴스까지 있고 서치콘솔에 9위로 찍혀 있었다.
 *
 *   ⛔ `check-쥔자료에-안쓴축이-있나.mjs` 는 **`src/pages/data` 만 센다.**
 *     기사는 저장소에 소스가 없고 빌드 산출물(`dist/article`)에만 있다.
 *     그래서 **이미 쓴 축을 「안 쓴 축」이라고 내놓았다.**
 *
 *   ⭐ 더 나빴던 것 — 그 기사는 **설립일보다 긴 재임 148건을 이미 걸러냈는데**
 *     내 첫 자는 안 걸렀다. 그래서 지면 맨 앞 수가 「가장 긴 것 58년」이었다.
 *     **기사가 이미 의심스럽다고 밝힌 바로 그 줄**을 지면이 자랑할 뻔했다.
 *
 * ── 어떻게 찾나 ───────────────────────────────────────────────────
 *   자료 **이름**으로는 못 잇는다 — `korea-executives` 와 `ceo-tenure` 는 안 겹친다.
 *   ⇒ **자료 «속»의 열쇠 이름**을 쓴다. 이 자료의 열쇠에 `tenure` 가 있고
 *     기사 주소에도 `tenure` 가 있다. 그래서 잡힌다.
 *
 * ── ⛔ 이 자가 하지 않는 것 ───────────────────────────────────────
 * ⛔ 「이미 있으니 내지 마라」가 아니다. **「먼저 읽어라」**다.
 *   같은 자료로 다른 축을 내는 것은 좋다 — 다만 수가 어긋나면 안 된다.
 * ⛔ dist 가 없으면 0 으로 채우지 않는다. **「못 쟀다」**고 적는다.
 * ⛔ 영문 기사와 한글 메타는 안 맞는다. 로마자 열쇠만 쓴다.
 *
 * 돌리기   node scripts/check-이축으로-이미낸게있나.mjs korea-executives
 *          node scripts/check-이축으로-이미낸게있나.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 여기 = path.dirname(fileURLToPath(import.meta.url));
const 뿌리 = path.resolve(여기, '..');

/* ── 재는 규칙 ──────────────────────────────────────────────────── */

/** 너무 흔해서 아무 기사에나 걸리는 낱말 — 이것으로는 안 찾는다 */
export const 흔한낱말 = new Set([
  'korea', 'korean', 'kr', 'data', 'name', 'names', 'code', 'codes', 'id', 'ids',
  'date', 'dates', 'year', 'years', 'value', 'values', 'type', 'types', 'row', 'rows',
  'meta', 'total', 'count', 'tape', 'list', 'index', 'en', 'english', 'full', 'raw',
  'item', 'items', 'key', 'keys', 'new', 'old', 'all', 'one', 'two', 'num', 'number',
]);

/** 찾을 만한 낱말인가 — 세 글자 넘고, 로마자이고, 흔하지 않은 것 */
export function 찾을만한낱말인가(낱말) {
  const w = String(낱말 ?? '').toLowerCase().trim();
  if (w.length < 4) return false;
  if (!/^[a-z][a-z0-9]*$/.test(w)) return false;
  return !흔한낱말.has(w);
}

/** 열쇠 이름을 낱말로 가른다 — camelCase · snake_case · kebab-case 를 다 읽는다 */
export function 낱말로가르기(열쇠) {
  return String(열쇠 ?? '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[^A-Za-z0-9]+/)
    .map((w) => w.toLowerCase())
    .filter(Boolean);
}

/** 한 덩이(객체·배열)에서 열쇠 이름을 모은다 — 깊이는 제한한다 */
export function 열쇠모으기(덩이, 깊이 = 0, 모은것 = new Set()) {
  if (깊이 > 3 || 모은것.size > 400 || 덩이 == null) return 모은것;
  if (Array.isArray(덩이)) {
    for (const x of 덩이.slice(0, 3)) 열쇠모으기(x, 깊이 + 1, 모은것);
    return 모은것;
  }
  if (typeof 덩이 !== 'object') return 모은것;
  for (const [k, v] of Object.entries(덩이).slice(0, 120)) {
    모은것.add(k);
    열쇠모으기(v, 깊이 + 1, 모은것);
  }
  return 모은것;
}

/** 주소(또는 파일 이름)가 이 낱말을 품었나 — 낱말 경계로 본다 */
export function 주소가품었나(주소, 낱말) {
  const s = String(주소 ?? '').toLowerCase();
  const w = String(낱말 ?? '').toLowerCase();
  if (!w) return false;
  const 조각 = s.split(/[^a-z0-9]+/).filter(Boolean);
  return 조각.includes(w);
}

/* ── 자가시험 ───────────────────────────────────────────────────── */
function 자가시험() {
  let 통과 = 0; let 실패 = 0;
  const 같나 = (무엇, 잰것, 바라는것) => {
    const a = JSON.stringify(잰것); const b = JSON.stringify(바라는것);
    if (a === b) { 통과 += 1; return; }
    실패 += 1;
    console.log('  🔴 ' + 무엇 + '  잰것 ' + a + ' / 바란것 ' + b);
  };

  같나('camelCase 를 가른다', 낱말로가르기('boardType'), ['board', 'type']);
  같나('snake_case 를 가른다', 낱말로가르기('founded_on'), ['founded', 'on']);
  같나('kebab-case 를 가른다', 낱말로가르기('ceo-tenure'), ['ceo', 'tenure']);
  같나('한 낱말은 그대로', 낱말로가르기('tenure'), ['tenure']);
  같나('빈 것은 빈 배열', 낱말로가르기(''), []);

  같나('tenure 는 찾을 만하다', 찾을만한낱말인가('tenure'), true);
  같나('korea 는 너무 흔하다', 찾을만한낱말인가('korea'), false);
  같나('세 글자는 짧다', 찾을만한낱말인가('ceo'), false);
  같나('한글은 안 쓴다 — 영문 기사와 안 맞는다', 찾을만한낱말인가('임원'), false);
  같나('숫자로 시작하면 안 쓴다', 찾을만한낱말인가('2026year'), false);

  같나('주소에 든 낱말을 찾는다',
    주소가품었나('korea-ceo-tenure-eleven-year-median', 'tenure'), true);
  같나('낱말 조각만 겹치면 안 찾는다 — ten 은 tenure 가 아니다',
    주소가품었나('korea-ceo-tenure-eleven-year-median', 'ten'), false);
  같나('없는 낱말', 주소가품었나('korea-gold-bar-premium', 'tenure'), false);
  같나('빈 낱말은 거짓', 주소가품었나('korea-ceo-tenure', ''), false);

  const 열쇠 = 열쇠모으기({ _meta: { 회사수: 1 }, byTicker: { '000010': [{ tenure: '3 years', boardType: 'x' }] } });
  같나('속까지 들어가 열쇠를 모은다', 열쇠.has('tenure'), true);
  같나('가운데 열쇠도 모은다', 열쇠.has('byTicker'), true);
  같나('null 은 그냥 넘긴다', 열쇠모으기(null).size, 0);

  /* 🔴 오늘 겪은 바로 그 짝이 잡히나 — 이 자가 헛돌지 않는다는 증거다 */
  const 오늘낱말 = [...열쇠모으기({ byTicker: { x: [{ tenure: '3 years' }] } })]
    .flatMap(낱말로가르기).filter(찾을만한낱말인가);
  같나('🔴 오늘 겪은 것 — tenure 로 그 기사를 잡는다',
    오늘낱말.some((w) => 주소가품었나('/article/korea-ceo-tenure-eleven-year-median', w)), true);

  console.log('\n자가시험 ' + (통과 + 실패) + '개 · 통과 ' + 통과 + ' · 실패 ' + 실패);
  return 실패 === 0;
}

/* ── 본체 ───────────────────────────────────────────────────────── */
function 이미낸것(축) {
  /* ① 자료를 읽어 열쇠 낱말을 뽑는다 */
  const 자료길 = path.join(뿌리, 'src', 'data', 축.endsWith('.json') ? 축 : 축 + '.json');
  let 낱말;
  if (fs.existsSync(자료길)) {
    const 덩이 = JSON.parse(fs.readFileSync(자료길, 'utf8'));
    낱말 = [...new Set([...열쇠모으기(덩이)].flatMap(낱말로가르기).filter(찾을만한낱말인가))];
  } else {
    낱말 = [];
  }
  /* 자료 이름 자체의 낱말도 넣는다 */
  for (const w of 낱말로가르기(축).filter(찾을만한낱말인가)) {
    if (!낱말.includes(w)) 낱말.push(w);
  }

  /* ② 이미 낸 것을 모은다 — 지면은 소스에서, 기사는 빌드 산출물에서 */
  const 지면방 = path.join(뿌리, 'src', 'pages', 'data');
  const 기사방 = path.join(뿌리, 'dist', 'article');
  const 지면 = fs.existsSync(지면방) ? fs.readdirSync(지면방) : null;
  const 기사 = fs.existsSync(기사방) ? fs.readdirSync(기사방) : null;

  const 맞은것 = [];
  for (const [어디, 목록] of [['지면', 지면], ['기사', 기사]]) {
    if (!목록) continue;
    for (const f of 목록) {
      const 맞은낱말 = 낱말.filter((w) => 주소가품었나(f, w));
      if (맞은낱말.length) 맞은것.push({ 어디, 이름: f, 낱말: 맞은낱말 });
    }
  }
  /* 많이 겹친 것부터 */
  맞은것.sort((a, b) => b.낱말.length - a.낱말.length);

  return {
    축,
    자료있나: fs.existsSync(자료길),
    낱말,
    지면쟀나: 지면 !== null,
    기사쟀나: 기사 !== null,
    기사수: 기사 ? 기사.length : null,
    맞은것,
  };
}

/* ── 들머리 ─────────────────────────────────────────────────────── */
if (process.argv.includes('--자가시험')) {
  process.exit(자가시험() ? 0 : 1);
}

const 축 = process.argv.slice(2).find((a) => !a.startsWith('--'));
if (!축) {
  console.log('■ 「이 축으로 이미 낸 게 있나」');
  console.log('   쓰기  node scripts/check-이축으로-이미낸게있나.mjs <자료이름>');
  console.log('   보기  node scripts/check-이축으로-이미낸게있나.mjs korea-executives');
  process.exit(0);
}

const r = 이미낸것(축);
console.log('■ ' + r.축 + ' — 우리가 이미 이 축으로 낸 것이 있나');
if (!r.자료있나) {
  console.log('   ⬜ src/data/' + r.축 + '.json 을 못 찾았다 — 이름만으로 찾는다');
}
console.log('   찾는 낱말 ' + r.낱말.length + '개: ' + r.낱말.slice(0, 14).join(' · ')
  + (r.낱말.length > 14 ? ' …' : ''));
if (!r.기사쟀나) {
  console.log('   ⬜ dist/article 이 없다 — **기사는 못 쟀다.** 0 으로 채우지 않는다.');
  console.log('      먼저 npx astro build 를 돌린 뒤 이 자를 다시 돌린다.');
} else {
  console.log('   기사 ' + r.기사수 + '장 · 데이터 지면 ' + (r.지면쟀나 ? '쟀다' : '⬜ 못 쟀다'));
}
console.log('');

if (!r.맞은것.length) {
  console.log('✅ 걸리는 것이 없다 — 이 축으로 낸 것이 없어 보인다');
  console.log('   ⚠ 낱말로만 찾았다. 이름이 아주 다르면 못 잡는다 — 「없다」가 아니라 「못 찾았다」다');
  process.exit(0);
}

console.log('🔴 이미 낸 것이 ' + r.맞은것.length + '개 걸렸다 — **짓기 전에 읽는다**');
for (const m of r.맞은것.slice(0, 12)) {
  console.log('   [' + m.어디 + '] ' + m.이름);
  console.log('        맞은 낱말: ' + m.낱말.join(' · '));
}
if (r.맞은것.length > 12) console.log('   … 그 밖 ' + (r.맞은것.length - 12) + '개');
console.log('');
console.log('   ⛔ 「이미 있으니 내지 마라」가 아니다 — **먼저 읽어라**다.');
console.log('      같은 자료로 다른 축을 내는 것은 좋다. 다만 **수가 어긋나면 안 된다.**');
console.log('   ⭐ 2026-10-12 — 기사가 이미 거른 148건을 내 지면이 안 걸러,');
console.log('      기사가 「의심스럽다」고 밝힌 줄을 지면 맨 앞에 낼 뻔했다.');
