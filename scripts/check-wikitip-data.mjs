/**
 * 되짚을 수 있는 자료인지 검사한다. (npm test)
 *
 * ── 왜 이 검사가 있나 ──────────────────────────────────────────
 * 2026-08-07, K Culture Wire 지면 넷이 틀린 채로 라이브에 있었다.
 * 원인은 계산이 아니라 **자료 파일을 손으로 만들어 둔 것**이었다.
 * 판정 규칙을 고쳤는데 손으로 만든 파일은 다시 만들 방법이 없어 안 따라왔다.
 * 그래서 /staying-power 는 중국 드라마를 「가장 세게 온 한국 작품 2위」로 싣고 있었고
 * 첫 화면은 중국 드라마 둘을 한국 작품으로 싣고 있었다.
 *
 * **자료를 고치는 것보다 「고치면 따라오게」 만드는 것이 값이 크다.** 그래서 검사로 세운다.
 *
 * ── 무엇을 보나 ───────────────────────────────────────────────
 * ① src/data/wikitip-*.json 마다 그것을 쓰는 스크립트가 있나
 * ② 지면(.astro)이 읽는 자료 파일이 실제로 있나
 * ③ 지면이 읽는 칸이 자료에 있나 — 이름이 어긋나면 화면이 **조용히 빈칸**이 된다
 *
 * ⛔ 값이 맞는지는 **안 본다.** 그것은 원자료와 대조해야 하고 이 검사가 할 일이 아니다.
 *    여기서 하는 말은 「다시 만들 수 있나」뿐이다. 할 수 있는 말만 한다.
 *
 * 남의 지면이 걸리면 **고치지 말고 그 자리에 알린다.**
 */
import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = 'src/data';
const PAGE_DIR = 'src/pages/wikitip';
const SCRIPT_DIR = 'scripts';

const 자료 = fs.readdirSync(DATA_DIR).filter((f) => /^wikitip-.*\.json$/.test(f));
const 스크립트 = fs.readdirSync(SCRIPT_DIR).filter((f) => f.endsWith('.mjs'))
  .map((f) => ({ name: f, body: fs.readFileSync(path.join(SCRIPT_DIR, f), 'utf8') }));
const 지면 = fs.readdirSync(PAGE_DIR).filter((f) => f.endsWith('.astro'));

const 문제 = [];

/* ── ① 자료마다 만든 스크립트가 있나 ──
 *
 * 손으로 쓰는 자료가 하나 있다 — 정정 기록이다. 그건 계산이 아니라 **사람의 판단**이라
 * 스크립트로 만들 수 없다. 그래서 예외를 두되 **공짜로 주지 않는다**:
 * 손으로 쓰는 파일은 **검사 스크립트가 지키고 있을 때만** 허용한다.
 * 지키는 검사가 없으면 그건 그냥 손으로 만든 파일이고, 오늘 우리가 고친 바로 그 결함이다.
 */
/**
 * 🔴🔴 2026-08-22 — 이 자가 **거짓 빨강**을 냈다. 다섯 파일을 「만드는 스크립트가 없다」고
 *   불렀는데 다섯 다 만드는 스크립트가 있었다(`build-wikitip-hometowns.mjs` 등).
 *   까닭은 하나다 — 자가 `src/data/파일명` **한 덩어리 문자열만** 찾았고, 그 스크립트들은
 *   `path.join(뿌리, 'src', 'data', 'wikitip-hometowns.json')` 처럼 **토막으로 나눠** 쓴다.
 *   ⭐ 경로를 어떻게 조립했는지는 자가 물을 일이 아니다. **파일 이름으로 찾는다.**
 *   ⚠ 거짓 빨강은 거짓 초록보다 눈에 덜 나쁘게 보이지만, 묶음 자를 첫 실패에서 멈춰
 *     **뒤의 검사 전부를 못 돌게** 만들었다. 그게 이 흠이 값이 큰 까닭이다.
 */
export const 파일을쓰나 = (본문, 파일) => {
  if (!/writeFileSync/.test(본문)) return false;
  /* 파일 이름이 나오는 줄 중에 **읽는 줄이 아닌 것**이 하나라도 있으면 만드는 쪽으로 본다.
     ⛔ 남의 자료를 읽어다 자기 것을 쓰는 스크립트를 만든 이로 잘못 세지 않으려고 읽는 줄을 뺀다 */
  return 본문.split(/\r?\n/).some((줄) => {
    if (!줄.includes(파일)) return false;
    if (/readFileSync|^\s*import\b|require\(/.test(줄)) return false;
    return true;
  });
};

/** 지키는 검사가 있나 — 검사는 읽기만 하니 이름이 나오면 그것으로 족하다 */
export const 검사가지키나 = (이름, 본문, 파일) => /^check-/.test(이름) && 본문.includes(파일);

for (const f of 자료) {
  if (스크립트.some((s) => 파일을쓰나(s.body, f))) continue;
  if (스크립트.some((s) => 검사가지키나(s.name, s.body, f))) continue;
  문제.push(`${f} — 만드는 스크립트도, 지키는 검사도 없다. 고쳐도 안 따라온다`);
}

/* ── ②③ 지면이 읽는 자료와 칸 ── */
for (const p of 지면) {
  const 원문 = fs.readFileSync(path.join(PAGE_DIR, p), 'utf8');
  /* 주석은 지운 뒤에 본다. 주석 안의 「rankings.json 에서 읽는다」가 칸 이름으로 잡힌다. */
  const src = 원문
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/(^|\s)\/\/[^\n]*/g, ' ');
  const imports = [...src.matchAll(/import\s+(\w+)\s+from\s+'[^']*\/data\/([\w.-]+\.json)'/g)];
  for (const [, 별명, 파일] of imports) {
    const full = path.join(DATA_DIR, 파일);
    if (!fs.existsSync(full)) { 문제.push(`${p} — ${파일} 이 없다`); continue; }
    let j;
    try { j = JSON.parse(fs.readFileSync(full, 'utf8')); } catch { 문제.push(`${파일} — JSON 이 깨졌다`); continue; }
    /* 지면이 `별명.칸` 으로 읽는 이름을 모아 자료에 있는지 본다. 최상위 칸만 본다. */
    /* 앞에 글자·슬래시·붙임표·점이 있으면 파일 이름이나 경로 안이다
       (`riot-ladder.json` 안의 `ladder.json`). 지면이 읽는 칸이 아니다. */
    /* 확장자로 끝나는 것은 글 속의 파일 이름이지 칸이 아니다
       — 오류 문구에 적힌 `rankings.json 에 … 칸이 없다` 가 그렇게 잡혔다. */
    const 확장자 = new Set(['json', 'mjs', 'js', 'ts', 'astro', 'md', 'xml', 'txt']);
    const 쓰는칸 = new Set(
      [...src.matchAll(new RegExp(`(?<![\\w/.-])${별명}\\.([a-zA-Z_]\\w*)`, 'g'))]
        .map((m) => m[1])
        .filter((k) => !확장자.has(k)),
    );
    for (const k of 쓰는칸) {
      if (!(k in j)) 문제.push(`${p} — ${파일} 에 '${k}' 칸이 없다. 화면이 조용히 빈칸이 된다`);
    }
  }
}

/* ── 자가시험 ── 검사가 실제로 잡는지 스스로 보인다. 안 잡는 검사는 통과를 못 믿는다. */
if (process.argv.includes('--selftest')) {
  const 시험 = [
    ['칸이 없으면 잡는다', { a: 1 }, 'b', true],
    ['칸이 있으면 안 잡는다', { a: 1 }, 'a', false],
    ['값이 0 이어도 있는 칸이다', { a: 0 }, 'a', false],
    ['값이 null 이어도 있는 칸이다', { a: null }, 'a', false],
    ['빈 객체는 다 잡는다', {}, 'a', true],
  ];
  let 통과 = 0;
  for (const [이름, obj, key, 걸려야하나] of 시험) {
    const 걸림 = !(key in obj);
    if (걸림 === 걸려야하나) 통과++;
    else console.log(`  ❌ 자가시험 실패: ${이름}`);
  }

  /* ⭐ 2026-08-22 에 낸 거짓 빨강을 여기서 막는다. 위의 다섯 칸은 이 흠을 못 봤다 */
  const 경로시험 = [
    ['한 덩어리로 쓴 경로를 본다',
      `const p = 'src/data/wikitip-x.json'; fs.writeFileSync(p, s);`, true],
    ['⭐ 토막으로 나눈 경로도 본다',
      `const 낼곳 = path.join(뿌리, 'src', 'data', 'wikitip-x.json');\nfs.writeFileSync(낼곳, s);`, true],
    ['⛔ 읽기만 하는 스크립트는 만든 이가 아니다',
      `const d = JSON.parse(fs.readFileSync('src/data/wikitip-x.json'));\nfs.writeFileSync(다른곳, s);`, false],
    ['⛔ import 만 한 것도 만든 이가 아니다',
      `import x from '../src/data/wikitip-x.json';\nfs.writeFileSync(다른곳, s);`, false],
    ['⛔ writeFileSync 가 아예 없으면 만든 이가 아니다',
      `const 낼곳 = path.join(뿌리, 'src', 'data', 'wikitip-x.json');\nconsole.log(낼곳);`, false],
    ['다른 파일 이름에는 안 걸린다',
      `fs.writeFileSync(path.join('src', 'data', 'wikitip-y.json'), s);`, false],
  ];
  for (const [이름, 본문, 참] of 경로시험) {
    시험.push([이름]);
    if (파일을쓰나(본문, 'wikitip-x.json') === 참) 통과++;
    else console.log(`  ❌ 자가시험 실패: ${이름}`);
  }

  console.log(`되짚기 검사 — 자가시험 ${시험.length}건 중 ${통과}건 통과`);
  if (통과 !== 시험.length) process.exit(1);
}

console.log(`되짚기 검사 — 자료 ${자료.length}개 · 지면 ${지면.length}장`);
if (문제.length) {
  console.log(`❌ ${문제.length}건`);
  문제.forEach((m) => console.log(`   ${m}`));
  console.log('   남의 지면이면 고치지 말고 그 자리에 알린다.');
  process.exit(1);
}
console.log('✅ 자료 전부 스크립트로 다시 만들 수 있다 · 지면이 읽는 칸 전부 있다');
