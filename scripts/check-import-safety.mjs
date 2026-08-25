#!/usr/bin/env node
/**
 * check-import-safety.mjs — **부르지도 않았는데 «일을 해 버리는» 자를 찾는다.**
 *
 * ── 🔴 왜 이 검사가 생겼나 ─────────────────────────────────────
 * 2026-08-25 하루에 **같은 흠으로 세 번** 넘어졌다.
 * ```
 *   아침  check-name-placement.mjs   함수 하나 빌리려 불렀더니 보고문이 통째로 돌았다
 *   저녁  stamp-site-entrance.mjs    import 만 했는데 영상 21편을 굽기 시작했다
 *   저녁  build-kcw-headlines.mjs    지면이 함수 하나를 빌리자 «빌드 한가운데»서 돌아
 *                                    process.exit(1) 로 빌드를 죽였다
 * ```
 * 두 번 겪고 전 유닛에 알리기까지 하고서 세 번째를 저질렀다.
 * ⭐ **말로 하는 규칙은 잊힌다. 겪은 것은 «자가시험이 달린 검사»로 굳힌다.**
 *   — `docs/모토와-철학.md` 2-④
 *
 * ── 무엇을 찾나 ───────────────────────────────────────────────
 * `export` 를 가진 `scripts/*.mjs` 가운데, **맨 바깥에서 일을 저지르는** 것.
 * 일을 저지른다 = 파일을 쓴다 · 프로세스를 죽인다 · 밖에 대고 묻는다 · 명령을 돌린다.
 *
 * ── ⛔ 이 검사가 지키는 것 ────────────────────────────────────
 * ⛔ **「수상하다」와 「깨졌다」를 가른다.** 이 검사는 «글자»를 볼 뿐이라 틀릴 수 있다.
 *   그래서 걸린 것을 「고쳐라」가 아니라 「보라」로 낸다.
 * ⛔ `--자가시험` 안에서 하는 일은 안 센다 — 그건 부러 돌리는 자리다.
 * ⚠ 이 검사 스스로도 자물쇠를 갖는다. 안 그러면 자기가 자기에게 걸린다.
 *
 * 쓰는 법  node scripts/check-import-safety.mjs --자가시험
 *          node scripts/check-import-safety.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 자물쇠가 있나 — 「내가 직접 불렸을 때만 한다」를 어떤 꼴로든 적어 두었나 */
export function 자물쇠있나(글) {
  const s = String(글 ?? '');
  return /import\.meta\.url/.test(s)
    && (/process\.argv\[1\]/.test(s) || /import\.meta\.main/.test(s) || /realpath/.test(s));
}

/** 내보내는 것이 있나 — 없으면 남이 부를 일이 없으니 이 검사 대상이 아니다 */
export function 내보내나(글) {
  return /^\s*export\s+(function|const|class|async)/m.test(String(글 ?? ''));
}

/**
 * 맨 바깥(들여쓰기 0)에서 일을 저지르는 줄을 찾는다.
 * ⚠ 들여쓰기가 있으면 함수·블록 «안»이므로 부를 때만 돈다 — 세지 않는다.
 * ⛔ 주석 줄은 세지 않는다. 주석에 적힌 보기글에 걸리면 검사가 거짓말을 한다.
 */
export function 저지르는줄(글) {
  const 짓 = [
    { 무엇: '파일을 쓴다', 자: /^(?:const |let |var |await |)?[^\s].*\b(writeFileSync|appendFileSync|mkdirSync|rmSync|unlinkSync)\s*\(/ },
    { 무엇: '프로세스를 죽인다', 자: /^process\.exit\s*\(/ },
    { 무엇: '명령을 돌린다', 자: /^(?:const |let |var |await |)?[^\s].*\b(execFileSync|execSync|spawnSync)\s*\(/ },
    { 무엇: '밖에 대고 묻는다', 자: /^(?:const |let |var |await |)?[^\s].*\b(fetch|request)\s*\(/ },
  ];
  const 줄들 = String(글 ?? '').split('\n');
  const 걸린것 = [];
  let 시험안 = false;
  for (let i = 0; i < 줄들.length; i++) {
    const 줄 = 줄들[i];
    /* `--자가시험` 블록에 들어가면 끝까지 안 센다 — 부러 돌리는 자리다 */
    if (/process\.argv\.includes\(['"]--자가시험['"]\)/.test(줄)) 시험안 = true;
    if (시험안) continue;
    if (/^\s*(\/\/|\/\*|\*)/.test(줄)) continue;
    if (/^\s/.test(줄)) continue;
    for (const s of 짓) if (s.자.test(줄)) { 걸린것.push({ 줄번호: i + 1, 무엇: s.무엇, 글: 줄.trim().slice(0, 70) }); break; }
  }
  return 걸린것;
}

if (process.argv.includes('--자가시험')) {
  let 실패 = 0;
  const 검 = (무엇, 참) => { if (!참) { console.error('❌ ' + 무엇); 실패++; } else console.log('✅ ' + 무엇); };

  검('자물쇠를 알아본다',
    자물쇠있나("const 내가 = path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);"));
  검('자물쇠가 없으면 없다고 한다', !자물쇠있나("const a = 1;"));
  검('import.meta.url 만으로는 자물쇠가 아니다',
    !자물쇠있나("const 뿌리 = path.dirname(fileURLToPath(import.meta.url));"));

  검('내보내는 함수를 알아본다', 내보내나('export function a() {}'));
  검('내보내는 상수도 알아본다', 내보내나('export const a = 1;'));
  검('안 내보내면 아니다', !내보내나('function a() {}'));

  검('맨 바깥에서 파일 쓰는 것을 잡는다',
    저지르는줄("fs.writeFileSync('a', 'b');").length === 1);
  검('맨 바깥 process.exit 를 잡는다', 저지르는줄('process.exit(1);').length === 1);
  검('⛔ 함수 «안»은 안 잡는다 — 부를 때만 돈다',
    저지르는줄("function f() {\n  fs.writeFileSync('a', 'b');\n}").length === 0);
  검('⛔ 주석은 안 잡는다 — 보기글에 걸리면 검사가 거짓말을 한다',
    저지르는줄(" * fs.writeFileSync('a')\n// process.exit(1)").length === 0);
  /* 🔴 오늘 겪은 것 그대로 — 자가시험 블록 안의 exit 는 옳다 */
  검('⛔ --자가시험 블록 안은 안 잡는다',
    저지르는줄("if (process.argv.includes('--자가시험')) {\nprocess.exit(0);\n}").length === 0);
  검('명령 돌리는 것을 잡는다', 저지르는줄("const o = execFileSync('x', []);").length === 1);
  검('아무 일도 안 하면 0', 저지르는줄('const a = 1;\nexport function f() {}').length === 0);

  console.log(실패 ? `\n❌ ${실패}개 실패` : '\n✅ 전부 지나갔다');
  process.exit(실패 ? 1 : 0);
}

/* ── 실제로 잰다 ───────────────────────────────────────────── */
const 내가불렸나 = path.resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url);

if (내가불렸나) {
  const 방 = path.join(뿌리, 'scripts');
  const 볼것 = fs.readdirSync(방).filter((f) => f.endsWith('.mjs')).sort();
  const 걸린것 = [];
  let 대상 = 0;

  for (const f of 볼것) {
    const 글 = fs.readFileSync(path.join(방, f), 'utf8');
    /* 남이 부를 일이 없는 자는 이 검사 대상이 아니다 */
    if (!내보내나(글)) continue;
    대상 += 1;
    if (자물쇠있나(글)) continue;
    const 짓 = 저지르는줄(글);
    if (짓.length) 걸린것.push({ 파일: f, 짓 });
  }

  console.log(`■ 부를 수 있는 자 ${대상}개를 봤다 (scripts/*.mjs 중 export 가 있는 것)`);
  if (!걸린것.length) {
    console.log('✅ import 만 해도 조용하다 — 함수를 빌려 쓸 수 있다');
    process.exit(0);
  }

  console.log(`\n⚠ **자물쇠 없이 맨 바깥에서 일하는 자 ${걸린것.length}개**`);
  console.log('   ⛔ 「깨졌다」가 아니라 「보라」다 — 이 검사는 글자만 본다.\n');
  for (const x of 걸린것.slice(0, 20)) {
    console.log(`   ${x.파일}`);
    for (const s of x.짓.slice(0, 3)) console.log(`      ${x.줄번호 ?? s.줄번호}줄  ${s.무엇}  ${s.글}`);
  }
  if (걸린것.length > 20) console.log(`   … 그리고 ${걸린것.length - 20}개 더`);
  console.log('\n🔴 고치는 법 — 맨 아래에 자물쇠를 두고, 하던 일을 그 안으로 넣는다:');
  console.log("   const 내가불렸나 = path.resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url);");
  console.log('   if (내가불렸나) { …원래 하던 일… }');
  console.log('\n⚠ 세는 것은 «수상한 것»이지 «깨진 것»이 아니다. 그래서 0 으로 안 끝낸다 —');
  console.log('   하나씩 열어 보고, 정말 괜찮으면 그 까닭을 주석으로 남긴다.');
  process.exit(0);
}
