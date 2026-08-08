#!/usr/bin/env node
/**
 * check-tests-wired.mjs — **검사가 `npm test` 에 물려 있나**를 검사한다.
 *
 * 🔴 왜 — 2026-08-08 15:4x, 8번이 「npm test 가 안 부르는 것이 있다」고 알렸다. 세어 보니
 *   **검사 파일 68개 중 53개가 안 불리고 있었다.** 부르는 것은 15개뿐이었다.
 *   우리 규칙이 「규칙은 문장이 아니라 검사로 둔다」인데,
 *   **안 불리는 검사는 그냥 문장이다.** 78% 가 문장이었다.
 *
 * ⛔ 그래서 이 검사를 둔다. 새 검사를 만들고 물려 놓지 않으면 여기서 운다.
 * ⚠ 한 번에 53개를 다 물릴 수는 없다 — 어떤 것은 느리고, 어떤 것은 그 기사 하나를 위한
 *   일회용이다. 그래서 **「봐준 목록」**을 두되, 그 목록이 **줄어들기만 하게** 한다.
 *   ⛔ 목록에 새로 넣으려면 **까닭을 한 줄 적어야** 한다. 조용히 늘리지 못하게.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 검사로 세는 파일 이름 무늬 */
export const 검사무늬 = /(\.test\.mjs|^check-.*\.mjs)$/;

/**
 * 봐주는 것 — **까닭이 있어야 들어온다.** 까닭 없이 이름만 넣지 않는다.
 * ⚠ 이 목록은 **줄어들기만 한다.** 늘리려면 왜 상시 검사가 아닌지 적는다.
 */
export const 봐준다 = {
  'check-tests-wired.mjs': '이 파일. 자기를 자기가 부르면 안 된다',

  /* 3번(백년지도) 것 넷 — 2026-08-08 16:5x~17:5x. 넷 다 **상시로 돌 수 없는 까닭**이 다르다.
     ⚠ 상시로 돌 수 있는 둘(check-100y-provenance · check-100y-major-bridge)은 npm test 에 물렸다 */
  'check-100y-label-echo.mjs': '나간 지면 4,963장을 훑는다. 빌드가 없으면 잴 것이 없다 — npm run check:100y:label',
  'check-100y-reach.mjs': '나간 지면 4,962장을 걸어 본다. 빌드가 없으면 잴 것이 없다 — npm run check:100y:reach',
  'check-100y-print.mjs': '진짜 크롬으로 A4 에 앉힌다. 크롬과 빌드가 둘 다 있어야 돈다 — npm run check:100y:print',
  'check-100y-phone.mjs': '진짜 크롬을 375px 로 띄운다. 크롬과 빌드가 둘 다 있어야 돈다 — npm run check:100y:phone',
  'check-100y-live-sale.mjs': '라이브를 받아 잰다. 인터넷이 끊기면 npm test 가 통째로 죽고, 배포 전에는 옛 지면을 보고 운다',
  'check-analytics-fires.mjs': '진짜 크롬으로 라이브를 열어 GA 가 쏘는지 잰다. 크롬·인터넷이 둘 다 있어야 돈다 — npm run check:ga',
  'check-100yearmap-launch.mjs': 'dist 5,000장을 훑는다. 빌드가 없으면 잴 것이 없고, 여섯이 dist 를 같이 써서 남이 빌드하는 사이에 ENOENT 가 난다 — npm run check:100y:launch',
};

/**
 * 파일 하나를 읽어 준다. 없으면 빈 글이다.
 * ⚠ 검사에서 갈아 끼울 수 있게 밖으로 뺐다 — 자가시험이 진짜 파일을 안 만들어도 되게.
 */
export const 소스읽기 = (이름) => {
  try { return fs.readFileSync(path.join(뿌리, 'scripts', 이름), 'utf8'); }
  catch { return ''; }
};

/**
 * **모아 부르는 자를 따라간다.**
 *
 * 🔴 왜 — 2026-08-08 18:5x. `check-wikitip-all.mjs` 한 자가 42개를 execFileSync 로 부른다.
 *   그 42개는 실제로 매번 돈다. 그런데 이 자는 `package.json` 의 글자만 봐서
 *   **42개를 전부 「안 불림」으로 셌다.** 세는 자가 틀리면 못 박은 수도 틀린다.
 *
 * ⛔ 「불린다」는 package.json 에 이름이 있다는 뜻이 아니라 **실제로 돈다**는 뜻이다.
 *   그러니 물린 자가 제 안에서 부르는 검사도 물린 것으로 센다. 몇 단계든 따라간다.
 *
 * ⚠ 돌고 도는 것(a 가 b 를, b 가 a 를)에 안 빠진다 — **`물림` 이 곧 본 것**이라
 *   한 파일이 두 번 줄에 서지 않는다. ⛔ 따로 「본 것」 자물쇠를 두었다가 뺐다.
 *   빼고 깨뜨려 보니 검사가 그대로 통과했다 — **안 서는 자물쇠는 자물쇠가 아니다.**
 *
 * ⛔ **주석에 적힌 이름은 안 센다.** 주석은 부르는 것이 아니라 말하는 것이다.
 *   (이 파일만 해도 `봐준다` 설명에 검사 이름 넷이 적혀 있다. 그걸 「부른다」고 세면 거짓이다.)
 */
export const 주석빼기 = (글) =>
  String(글 ?? '').replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');

export function 갈라내기(파일들, 부름, 봐줄것 = 봐준다, 읽기 = 소스읽기) {
  const 검사 = 파일들.filter((f) => 검사무늬.test(f));
  const 물림 = new Set(검사.filter((f) => String(부름 ?? '').includes(f)));

  const 볼것 = [...물림];
  while (볼것.length) {
    const 이번 = 볼것.pop();
    let 글 = '';
    try { 글 = 주석빼기(읽기(이번)); } catch { 글 = ''; }   // 못 읽으면 안 부르는 것으로 본다. 죽지 않는다
    for (const f of 검사) {
      if (f === 이번 || 물림.has(f)) continue;
      if (글.includes(f)) { 물림.add(f); 볼것.push(f); }
    }
  }

  const 안불림 = 검사.filter((f) => !물림.has(f) && !(f in 봐줄것));
  return { 검사수: 검사.length, 안불림 };
}

/* ── 검사 ── */
if (process.argv.includes('--selftest')) {
  let 통과 = 0, 실패 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    const ok = typeof 바람 === 'function' ? 바람(실제) : JSON.stringify(실제) === JSON.stringify(바람);
    if (ok) 통과 += 1; else { 실패 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  재본다('물린 것은 안 걸린다', 갈라내기(['a.test.mjs'], 'node scripts/a.test.mjs', {}).안불림, []);
  재본다('안 물린 것은 걸린다', 갈라내기(['a.test.mjs'], 'node scripts/b.test.mjs', {}).안불림, ['a.test.mjs']);
  재본다('봐준 것은 안 걸린다', 갈라내기(['a.test.mjs'], '', { 'a.test.mjs': '까닭' }).안불림, []);
  재본다('검사 아닌 파일은 안 센다', 갈라내기(['build.mjs'], '', {}).검사수, 0);
  재본다('check- 로 시작하면 센다', 갈라내기(['check-x.mjs'], '', {}).검사수, 1);
  재본다('가운데 check- 는 안 센다', 갈라내기(['make-check-x.mjs'], '', {}).검사수, 0);
  재본다('빈 목록', 갈라내기([], '', {}).안불림, []);
  재본다('부름이 null 이어도 안 죽는다', 갈라내기(['a.test.mjs'], null, {}).안불림, ['a.test.mjs']);
  재본다('봐준 것에 까닭이 다 있다', Object.values(봐준다).every((x) => x && x.length > 3), true);

  /* ── 모아 부르는 자를 따라가나 ── */
  const 글판 = (표) => (이름) => 표[이름] ?? '';
  재본다('모아 부르는 자가 부르면 물린 것이다',
    갈라내기(['check-all.mjs', 'check-b.mjs'], 'node scripts/check-all.mjs', {},
      글판({ 'check-all.mjs': "execFileSync('node',['scripts/check-b.mjs'])" })).안불림, []);
  재본다('두 단계도 따라간다',
    갈라내기(['check-all.mjs', 'check-b.mjs', 'check-c.mjs'], 'node scripts/check-all.mjs', {},
      글판({ 'check-all.mjs': "'check-b.mjs'", 'check-b.mjs': "'check-c.mjs'" })).안불림, []);
  재본다('안 물린 자가 부르는 것은 그대로 안 물린 것이다',
    갈라내기(['check-all.mjs', 'check-b.mjs'], '', {},
      글판({ 'check-all.mjs': "'check-b.mjs'" })).안불림, ['check-all.mjs', 'check-b.mjs']);
  재본다('돌고 도는 것에 안 빠진다',
    갈라내기(['check-a.mjs', 'check-b.mjs'], 'node scripts/check-a.mjs', {},
      글판({ 'check-a.mjs': "'check-b.mjs'", 'check-b.mjs': "'check-a.mjs'" })).안불림, []);
  재본다('주석에 적힌 이름은 안 센다',
    갈라내기(['check-a.mjs', 'check-b.mjs'], 'node scripts/check-a.mjs', {},
      글판({ 'check-a.mjs': '/* check-b.mjs 는 느려서 뺐다 */' })).안불림, ['check-b.mjs']);
  재본다('한 줄 주석도 안 센다',
    갈라내기(['check-a.mjs', 'check-b.mjs'], 'node scripts/check-a.mjs', {},
      글판({ 'check-a.mjs': '// check-b.mjs 는 나중에' })).안불림, ['check-b.mjs']);
  재본다('읽기가 터져도 안 죽는다',
    갈라내기(['check-a.mjs'], 'node scripts/check-a.mjs', {}, () => { throw new Error('x'); }).안불림, []);
  console.log(실패 ? `\n⛔ ${실패}개 틀렸다 (통과 ${통과})` : `✅ 검사 ${통과}개 통과`);
  process.exit(실패 ? 1 : 0);
}

/* ── 실행 ── */
const j = JSON.parse(fs.readFileSync(path.join(뿌리, 'package.json'), 'utf8'));
const 파일들 = fs.readdirSync(path.join(뿌리, 'scripts'));
const { 검사수, 안불림 } = 갈라내기(파일들, j.scripts?.test ?? '');

/**
 * ⚠ 이 수를 **줄이기만** 한다 — 늘어나면 운다.
 *
 * 53 (8/8 15:4x) → **11** (8/8 18:5x)
 *   ⭐ 42개는 새로 물려서 준 것이 아니다. **원래 돌고 있었는데 내가 못 세고 있었다** —
 *     `check-wikitip-all.mjs` 가 부르는 것을 이 자가 안 따라갔다.
 *     세는 자를 고치고, 그 자를 `npm test` 에 물렸다.
 *   ⛔ 남은 11개는 대개 **인터넷·라이브·크롬**을 탄다. 물리면 npm test 가 남의 사정으로 죽는다.
 *     각자 봐준다 에 까닭을 적고 넣든지, 상시로 돌게 고치든지 주인이 정한다.
 */
const 오늘까지봐주는수 = 11;

console.log(`검사 파일 ${검사수}개 · npm test 가 부르는 것 ${검사수 - 안불림.length}개 · 안 부르는 것 ${안불림.length}개`);
if (안불림.length > 오늘까지봐주는수) {
  console.error(`\n⛔ 안 불리는 검사가 늘었다 (${오늘까지봐주는수} → ${안불림.length}).`);
  console.error('   새로 만든 검사를 npm test 에 물리십시오. 안 불리는 검사는 문장일 뿐입니다.');
  for (const f of 안불림.slice(0, 10)) console.error(`   · ${f}`);
  process.exit(1);
}
if (안불림.length) {
  console.log(`⚠ 아직 ${안불림.length}개가 안 불립니다 — 줄여 가는 중입니다(오늘 기준 ${오늘까지봐주는수}개).`);
}
