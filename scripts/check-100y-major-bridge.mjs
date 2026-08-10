#!/usr/bin/env node
/**
 * 대학 학과 ↔ 고교 학과 **이름 다리**가 성한가.
 *
 *   node scripts/check-100y-major-bridge.mjs
 *   node scripts/check-100y-major-bridge.mjs --자가시험
 *   node scripts/check-100y-major-bridge.mjs --보기      이어진 것을 눈으로 훑는다
 *
 * ## 🔴 왜 (2026-08-08 17:0x)
 *
 *   2번 지시 — *「/college-major 837장이 막다른 길입니다 … 이름이 맞는 223장부터 길을 냅니다」*.
 *   길을 냈으니 **그 길이 끊기면 우는 자**를 같이 둔다.
 *
 * ## ⛔ 이 자가 **가장 무겁게 보는 것**
 *
 *   ```
 *   ① 이어 놓은 곳의 도착지가 진짜 있나       — 없는 지면으로 보내면 404 다
 *   ② 「이 학과로 가는」이라고 쓰지 않았나     — 우리에게 없는 자료를 있다고 말하는 것이다
 *   ③ 못 이은 지면에 까닭이 적혀 있나         — 조용히 비면 다음 사람이 또 센다
 *   ④ 억지로 이은 것이 없나                  — 줄기가 다르면 이으면 안 된다
 *   ```
 *
 *   ②가 제일 중요하다. 이름이 같은 것과 **거기로 간다**는 것은 전혀 다른 말이고,
 *   그 자료(고교 학과 → 대학 학과)는 **아직 공개돼 있지 않다.**
 */
import fs from 'node:fs';
import path from 'node:path';

const 여기 = path.resolve(
  path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'),
  '..',
);

/** ⚠ 이 자는 `src/lib/major-bridge.ts` 와 **같은 규칙**을 써야 한다. 손으로 다시 적지 않는다 */
const 규칙글 = fs.readFileSync(path.join(여기, 'src/lib/major-bridge.ts'), 'utf8');

/** TS 파일을 그대로 못 부르니 규칙 한 줄만 옮겨 온다. ⚠ 옮겨 왔다는 것을 자가 확인한다 */
export function 줄기(이름) {
  return String(이름 ?? '')
    .replace(/\((?:\d+년제|야간|주간)\)/g, '')
    .replace(/(?:학과|학부|전공|계열|과)$/, '')
    .replace(/\s/g, '');
}

export function 다리찾기(대학학과, 고교학과들) {
  const 이름 = String(대학학과 ?? '');
  if (!이름) return null;
  const 똑같은 = 고교학과들.filter((g) => g === 이름);
  if (똑같은.length) return { 같은꼴: '똑같다', 고교학과: 똑같은 };
  const k = 줄기(이름);
  if (!k) return null;
  const 꼬리만 = 고교학과들.filter((g) => 줄기(g) === k);
  if (꼬리만.length) return { 같은꼴: '꼬리만다르다', 고교학과: [...new Set(꼬리만)] };
  return null;
}

/* ───────────────────────── 자가 시험 ───────────────────────── */
function 자가시험() {
  const 고 = ['간호과', '전기과', '디자인과', '디자인계열', '경영과', 'S/W디자인과'];
  const 본보기 = [
    ['글자까지 같으면 똑같다', () => 다리찾기('전기과', 고).같은꼴 === '똑같다'],
    ['꼬리만 다르면 잇는다', () => 다리찾기('간호학과', 고).고교학과[0] === '간호과'],
    ['학제 괄호는 뜻이 아니다', () => 다리찾기('간호학과(4년제)', 고).고교학과[0] === '간호과'],
    ['🔴 전기과와 전기공학부는 안 잇는다', () => 다리찾기('전기공학부', 고) === null],
    ['줄기가 다르면 안 잇는다', () => 다리찾기('철학과', 고) === null],
    ['후보가 둘이면 둘 다 준다', () => 다리찾기('디자인학과', 고).고교학과.length === 2],
    ['같은 것을 두 번 주지 않는다', () => new Set(다리찾기('디자인학과', 고).고교학과).size === 2],
    ['빈 이름은 null', () => 다리찾기('', 고) === null],
    ['null 이어도 안 죽는다', () => 다리찾기(null, 고) === null],
    ['꼬리만 있는 이름은 null', () => 다리찾기('학과', 고) === null],
    ['맨 뒤 하나만 뗀다', () => 줄기('경영학과') === '경영'],
    /** ⚠ 「전기공학부」는 줄기가 「전기공」이 된다(맨 뒤 `학부` 만 뗀다).
        모양이 곱지는 않은데 **할 일은 한다** — 「전기과」(줄기 「전기」)와 안 만난다.
        ⛔ 여기서 재는 것은 곱냐가 아니라 **엉뚱한 것과 붙지 않느냐**다 */
    ['전기공학부 줄기', () => 줄기('전기공학부') === '전기공'],
    /* 🔴 규칙이 두 곳에 있으면 갈라진다. 갈라졌나를 자가 본다 */
    ['ts 와 같은 규칙인가 — 괄호', () => 규칙글.includes('\\d+년제|야간|주간')],
    ['ts 와 같은 규칙인가 — 꼬리', () => 규칙글.includes('학과|학부|전공|계열|과')],
  ];
  let 진 = 0;
  for (const [이름, 재기] of 본보기) {
    let 됐나 = false;
    try { 됐나 = 재기() === true; } catch { 됐나 = false; }
    if (!됐나) { console.log(`  ⛔ 자가시험 실패 — ${이름}`); 진++; }
  }
  console.log(`자가시험 ${본보기.length}개 · 실패 ${진}개`);
  return 진;
}

if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 1 : 0);

/* ⚠ 2026-08-10 13:1x — **곧바로 부를 때만 아래를 돈다.**
 *   그 전에는 `import` 만 해도 본문이 통째로 돌고 process.exit 까지 했다.
 *   그래서 다른 자가 이 자의 함수를 빌려 쓸 수 없었다(자끼리 견주려다 막혔다).
 *   ⛔ 곧바로 부르는 쪽 동작은 하나도 안 바뀐다. */
const { pathToFileURL: 길을주소로 } = await import('node:url');
if (!!process.argv[1] && import.meta.url === 길을주소로(process.argv[1]).href) {

const 시험실패 = 자가시험();

/* ───────────────────────── 진짜로 잰다 ───────────────────────── */
const 읽기 = (p) => JSON.parse(fs.readFileSync(path.join(여기, p), 'utf8'));
const 성과 = 읽기('src/data/100yearmap/major-outcomes.json');
const 고교 = 읽기('src/data/100yearmap/pages-major.json');

const 대 = 성과.자료.map((x) => x.학과);
const 고이름 = 고교.map((x) => x.title);
const 고주소 = new Map(고교.map((x) => [x.title, x.url]));

if (대.length === 0 || 고이름.length === 0) {
  console.log('⬜ 자료가 비었다 — **재지 못했다**');
  process.exit(2);
}

const 운다 = [];
let 똑같 = 0, 꼬리만 = 0, 못이음 = 0;
const 이은것 = [];

for (const d of 대) {
  const b = 다리찾기(d, 고이름);
  if (!b) { 못이음++; continue; }
  if (b.같은꼴 === '똑같다') 똑같++; else 꼬리만++;
  for (const g of b.고교학과) {
    /* ① 도착지가 진짜 있나 */
    const 주소 = 고주소.get(g);
    if (!주소) 운다.push(`${d} → ${g} — 고교 학과 자료에 주소가 없다`);
    else if (!주소.startsWith('/major/')) 운다.push(`${d} → ${g} — 주소가 이상하다(${주소})`);
    /* ④ 억지로 이은 것 */
    if (줄기(d) !== 줄기(g) && d !== g) 운다.push(`${d} → ${g} — 줄기가 다른데 이었다`);
    이은것.push(`${d}  →  ${g}`);
  }
}

/**
 * ②③ 🔴 **소스가 아니라 나간 지면을 읽는다.**
 *
 *   처음엔 `.astro` 소스를 grep 했다가 헛짚었다 — 소스 주석에 *「⛔ 「이 학과로 가는」이라고
 *   쓰지 않는다」*고 적어 둔 그 글자에 자가 울었다. **안 쓰겠다고 적은 말에 운 것**이다.
 *   ⚠ 우리가 재야 하는 것은 **손님이 읽는 글자**다. 그래서 빌드 산출물을 연다.
 */
const 지면방 = path.join(여기, 'dist/100y/college-major');
let 읽은지면 = 0;
let 길있는지면 = 0;
if (!fs.existsSync(지면방)) {
  console.log('⬜ 빌드가 없어 **나간 글자는 못 쟀다** — `node scripts/build-once.mjs` 뒤에 다시');
} else {
  const 글자만 = (s) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  /**
   * ⚠ 훑는 사이에 지면이 **사라질 수 있다.** 여섯 자리가 `dist` 를 같이 쓰고,
   *   `astro build` 는 시작할 때 dist 를 비운다. 실제로 17:0x 에 여기서 죽었다.
   * ⛔ 죽지 않게 하되 **조용히 넘기지 않는다** — 몇 장이 사라졌는지 말한다.
   */
  let 사라짐 = 0;
  for (const f of fs.readdirSync(지면방).filter((x) => x.endsWith('.html'))) {
    let 원글;
    try { 원글 = fs.readFileSync(path.join(지면방, f), 'utf8'); }
    catch { 사라짐++; continue; }
    const 글 = 글자만(원글);
    읽은지면++;
    if (/이 학과로 가는/.test(글)) 운다.push(`${f} — 「이 학과로 가는」이라 적혀 나갔다. 그 자료는 우리에게 없다`);
    /**
     * 🔴 이어졌나는 **링크로 센다. 글자로 세면 안 된다.**
     *
     *   처음엔 「이름이 같은 고등학교 학과」라는 글자를 찾았다가 **52장이 거짓으로 울었다.**
     *   지면에 원래 있던 문장 *「이름이 같은 고등학교 학과가 **따로 있습니다**」*가
     *   그 글자를 품고 있었다. 안 이어진 지면까지 「이어졌다」로 세어 버렸다.
     *   ⚠ 우리가 세려는 것은 **낱장으로 나가는 길**이고, 그것은 `<a>` 다.
     */
    const 나가는길 = [...원글.matchAll(/href="\/major\/[^"]+"/g)].length;
    const 까닭있나 = /이름이 같은 고등학교 학과가 없습니다/.test(글);
    if (나가는길 === 0 && !까닭있나) 운다.push(`${f} — 나가는 길도 없고, 왜 없는지 적혀 있지도 않다`);
    if (나가는길 > 0 && !/이름이 같다는 뜻일 뿐입니다/.test(글)) 운다.push(`${f} — 이어 놓고 ⚠ 한 줄이 없다`);
    if (나가는길 > 0) 길있는지면++;
  }
  if (사라짐) console.log(`⬜⬜ 훑는 사이에 사라진 지면 ${사라짐}장 — **덜 읽고 낸 값이다.** 남이 빌드하는 중이었다`);
  if (읽은지면 === 0) 운다.push('대학 학과 지면을 한 장도 못 읽었다');
}

if (process.argv.includes('--보기')) {
  console.log(이은것.join('\n'));
  console.log('');
}

console.log(`대학 학과 ${대.length}개 · 고교 학과 ${고이름.length}개`);
console.log(`이은 것 ${똑같 + 꼬리만}개 (글자까지 같음 ${똑같} · 꼬리만 다름 ${꼬리만}) · 못 이음 ${못이음}개`);
console.log(`나간 지면에서 글자를 읽은 것 ${읽은지면}장 · 그중 낱장으로 나가는 길이 있는 것 ${길있는지면}장`);

if (운다.length === 0) {
  console.log('✅ 끊긴 길 0 · 억지로 이은 것 0 · 못 이은 곳에 까닭 있다');
  console.log('⚠ 이 자는 「이름이 같나」만 잰다. 「거기로 가나」는 우리 자료로 못 잰다');
  process.exit(시험실패 ? 1 : 0);
}
for (const x of 운다.slice(0, 20)) console.log(`⛔ ${x}`);
console.log(`\n⛔ ${운다.length}건`);
process.exit(1);

} /* ── 곧바로부름 끝 ── */
