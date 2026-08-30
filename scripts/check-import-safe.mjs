#!/usr/bin/env node
/**
 * check-import-safe.mjs — **남이 들여오는 자가, 들여오기만 해도 «도는가».**
 *
 * ── 🔴 왜 만드나 (2026-08-30 · 5번) ──────────────────────────
 * 오늘 두 번 같은 자리에 걸렸다.
 *   ① `make-kcw-sound.mjs` — 대본 열일곱 편의 길이를 재려고 `말길이초` 를 들여왔더니
 *      `⛔ --set <영상이름> 을 준다` 하고 **즉시 죽었다.** 길이를 재는 자가 재게 해 주지 않았다.
 *   ② `measure-keyword-demand.mjs` — 자동완성 함수 하나를 들여왔더니 **본체가 다 돌아
 *      `src/data/wikitip-keyword-demand.json` 을 새로 써 버렸다.** 나는 그걸 시키지 않았다.
 *
 * ⛔ 이것이 조용한 결함인 까닭 — **들여온 쪽이 아니라 «들여와진 쪽»이 부작용을 낸다.**
 *   부르는 자는 함수 하나를 빌리려 했을 뿐인데 남의 자료가 바뀐다.
 * ⭐ 형제 자들(make-video-kcw-*.mjs)은 이미 빗장을 걸고 있다 — 「직접 실행됐을 때만 돈다」.
 *   그 빗장이 어디에 없는지를 **말이 아니라 검사로** 안다.
 *
 * ── 어떻게 재나 ─────────────────────────────────────────────
 * 괄호 깊이를 세어 **깊이 0(함수 밖)에서 도는 문장**만 본다.
 * ⛔ 함수 «안»의 process.exit 은 안 센다 — 그건 불러야 도는 것이다.
 * ⚠ 이것은 글자 세기지 문법 나무가 아니다. 문자열·주석 안의 괄호를 지운 뒤에 센다.
 *   ⇒ 그래서 **「위험 없음」을 장담하지 않는다.** 걸린 것만 말한다.
 *
 * 쓰는 법
 *   node scripts/check-import-safe.mjs --자가시험
 *   node scripts/check-import-safe.mjs            (남이 들여오는 자만)
 *   node scripts/check-import-safe.mjs --모두      (scripts/ 전부)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 자방 = path.join(뿌리, 'scripts');

/** 부작용으로 보는 것 — 남의 자료를 바꾸거나 부르는 자를 죽이는 것 */
export const 부작용말 = ['process.exit(', 'fs.writeFileSync(', 'fs.mkdirSync(',
  'fs.appendFileSync(', 'execFileSync(', 'execSync(', 'fetch('];

/** 문자열·주석을 지운다. ⛔ 그 안의 괄호를 세면 깊이가 틀어진다 */
export function 껍질벗기기(글) {
  let s = String(글 ?? '');
  s = s.replace(/\/\*[\s\S]*?\*\//g, ' ');            /* 여러 줄 주석 */
  s = s.replace(/(^|[^:])\/\/[^\n]*/g, '$1');         /* 한 줄 주석 — http:// 는 살린다 */
  s = s.replace(/`(?:\\.|[^`\\])*`/g, '``');          /* 백틱 글 */
  s = s.replace(/'(?:\\.|[^'\\\n])*'/g, "''");
  s = s.replace(/"(?:\\.|[^"\\\n])*"/g, '""');
  return s;
}

/** 깊이 0 에서 도는 줄만 골라 준다 */
export function 깊이0줄(글) {
  const 벗긴 = 껍질벗기기(글).split('\n');
  const 낼것 = [];
  let 깊이 = 0;
  for (let i = 0; i < 벗긴.length; i += 1) {
    const 줄 = 벗긴[i];
    if (깊이 === 0) 낼것.push({ 줄번호: i + 1, 글: 줄 });
    for (const c of 줄) {
      if (c === '{' || c === '(' || c === '[') 깊이 += 1;
      else if (c === '}' || c === ')' || c === ']') 깊이 = Math.max(0, 깊이 - 1);
    }
  }
  return 낼것;
}

/** 빗장이 걸려 있나 */
export function 빗장있나(글) {
  return /내가실행됐다|import\.meta\.main/.test(String(글 ?? ''));
}

/** 들여오면 도는 부작용 줄들. ⛔ 빗장이 있으면 빈 배열 */
export function 위험한줄(글) {
  if (빗장있나(글)) return [];
  return 깊이0줄(글).filter((x) => 부작용말.some((w) => x.글.includes(w)));
}

/**
 * 누가 누구를 들여오나.
 * 🔴 [2026-08-30] 처음엔 글 아무 데서나 찾았더니 **이 자가 «자기 자가시험 문구»를
 *   진짜 들여오기로 읽었다** — 없는 `b.mjs` 를 「못 봤다」로 올렸다.
 *   ⛔ 자가 스스로를 오독하면, 남을 재는 수도 못 믿는다.
 * ⇒ **줄 첫머리의 `import`** 만 센다. 문자열 안에 든 예시 문구는 줄 첫머리가 아니다.
 */
export function 들여오는곳(글) {
  return [...String(글 ?? '').matchAll(/^\s*(?:import|export)\b[^\n]*?from\s+['"]\.\/([A-Za-z0-9._-]+\.mjs)['"]/gm)]
    .map((m) => m[1]);
}

/* ── 자가시험 ───────────────────────────────────────────────── */
export function 자가시험() {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  검('함수 «밖»의 process.exit 을 잡는다',
    위험한줄('export function a(){}\nif (!set) process.exit(1);').length === 1);
  검('⛔ 함수 «안»의 process.exit 은 안 잡는다 — 불러야 돈다',
    위험한줄('export function a(){\n  process.exit(1);\n}\n').length === 0);
  검('빗장이 있으면 통과',
    위험한줄('const 내가실행됐다 = true;\nif (!set) process.exit(1);').length === 0);
  검('import.meta.main 도 빗장으로 본다',
    위험한줄('if (import.meta.main) { process.exit(1); }').length === 0);
  검('파일 쓰기도 부작용이다',
    위험한줄("fs.writeFileSync('a', 'b');").length === 1);
  검('여러 줄짜리 함수 뒤의 깊이가 안 새어 나온다',
    위험한줄('function a() {\n  if (x) {\n    y();\n  }\n}\nprocess.exit(1);').length === 1);

  검('⚠ 문자열 안의 괄호는 깊이를 안 바꾼다',
    위험한줄('const s = "{{{";\nprocess.exit(1);').length === 1);
  검('⚠ 주석 안의 괄호도 안 센다',
    위험한줄('/* { { { */\nprocess.exit(1);').length === 1);
  검('⚠ 백틱 글 안의 괄호도 안 센다',
    위험한줄('const s = `x{{`;\nprocess.exit(1);').length === 1);
  검('⛔ http:// 를 한 줄 주석으로 안 본다',
    껍질벗기기("const u = 'http://x';").includes('const u') === true);

  검('들여오는 곳을 뽑는다',
    JSON.stringify(들여오는곳("import { a } from './b.mjs';")) === JSON.stringify(['b.mjs']));
  검('⛔ 바깥 꾸러미는 안 센다', 들여오는곳("import fs from 'node:fs';").length === 0);
  검('⛔ 줄 «가운데» 든 예시 문구는 안 센다 — 자가 자기 시험을 오독하던 자리다',
    들여오는곳('  검(\'x\', 들여오는곳("import { a } from \'./b.mjs\';").length === 1);').length === 0);
  검('여러 줄에서 여러 개를 센다',
    들여오는곳("import a from './x.mjs';\nimport b from './y.mjs';").length === 2);
  검('export … from 도 센다', 들여오는곳("export { a } from './z.mjs';").length === 1);
  검('⛔ 빈 글은 빈 배열', 들여오는곳(null).length === 0 && 위험한줄(null).length === 0);

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
  console.log('✅ 들여와도 안전한가 — 자가시험 16 통과');
  process.exit(0);
}

if (내가실행됐다) {
  const 모두 = process.argv.includes('--모두');
  const 자들 = fs.readdirSync(자방).filter((f) => f.endsWith('.mjs'));
  const 글 = new Map(자들.map((f) => [f, fs.readFileSync(path.join(자방, f), 'utf8')]));

  const 들여와짐 = new Map();
  for (const [f, s] of 글) {
    for (const 대상 of 들여오는곳(s)) {
      if (대상 === f) continue;                      /* 자기 자신은 안 센다 */
      if (!들여와짐.has(대상)) 들여와짐.set(대상, []);
      들여와짐.get(대상).push(f);
    }
  }

  const 볼것 = 모두 ? 자들 : [...들여와짐.keys()];
  const 걸린것 = [];
  const 못본것 = [];
  for (const f of 볼것) {
    if (!글.has(f)) { 못본것.push(f); continue; }
    const 줄들 = 위험한줄(글.get(f));
    if (줄들.length) 걸린것.push({ f, 줄들, 쓰는이: 들여와짐.get(f) ?? [] });
  }

  console.log(`■ ${모두 ? 'scripts/ 전부' : '남이 들여오는 자'} ${볼것.length}개를 본다`);
  if (못본것.length) {
    console.log(`\n⬜ **못 봤다 ${못본것.length}개** — 파일이 없다. 통과로 «안» 친다`);
    for (const f of 못본것) console.log(`     ${f}`);
  }
  if (!걸린것.length) {
    console.log('\n✅ 걸린 것 없음.');
    console.log('⚠ 이것은 글자 세기지 문법 나무가 아니다 — 「위험 없음」을 장담하지 않는다.');
    process.exit(0);
  }
  /* 남이 실제로 들여오는 자가 먼저다 — 거기서만 «오늘» 사고가 난다 */
  걸린것.sort((a, b) => b.쓰는이.length - a.쓰는이.length);
  console.log(`\n🔴 **들여오면 도는 자 ${걸린것.length}개**`);
  console.log('   ⭐ 고치는 법: 본체를 `if (내가실행됐다) { … }` 안으로 넣는다');
  for (const x of 걸린것) {
    const 누구 = x.쓰는이.length
      ? `← ${x.쓰는이.slice(0, 3).join(', ')}${x.쓰는이.length > 3 ? ` 외 ${x.쓰는이.length - 3}` : ''}`
      : '(아직 아무도 안 들여온다)';
    console.log(`\n  ${x.f}  ${누구}`);
    for (const 줄 of x.줄들.slice(0, 3)) {
      console.log(`      ${String(줄.줄번호).padStart(4)}: ${줄.글.trim().slice(0, 84)}`);
    }
    if (x.줄들.length > 3) console.log(`      … 그 밖 ${x.줄들.length - 3}줄`);
  }
  process.exit(1);
}
