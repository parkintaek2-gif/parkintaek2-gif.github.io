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

/* ── ① 자료마다 만든 스크립트가 있나 ── */
for (const f of 자료) {
  const 만드는곳 = 스크립트.filter((s) => s.body.includes(`${DATA_DIR}/${f}`) && /writeFileSync/.test(s.body));
  if (!만드는곳.length) 문제.push(`${f} — 이 자료를 만드는 스크립트가 없다. 고쳐도 안 따라온다`);
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
