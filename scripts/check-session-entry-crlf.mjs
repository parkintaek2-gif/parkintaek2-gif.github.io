#!/usr/bin/env node
/**
 * check-session-entry-crlf.mjs — **세션입구 `.cmd` 가 클릭해도 안 열리는 것을 막는다.**
 *
 * ── 무슨 일이 있었나 (2026-09-01) ──────────────────────────────────
 * 사장님이 이렇게 이르셨습니다 — 「**세션입구에서 클릭해도 못 열어서**」.
 * 열어 보니 배치 파일이 실행 중에 `exit 1` 로 죽고 있었습니다. 까닭은 줄바꿈이었습니다.
 * ```
 *   0_ID새로고침.cmd        CRLF 27줄 · LF 0줄     ← 멀쩡한 것
 *   5번_케이컬처와이어.cmd    CRLF 15줄 · LF 58줄    ← 섞여서 죽던 것
 * ```
 * **`cmd.exe` 는 배치 파일을 바이트 위치로 읽습니다.** LF 만 있는 줄이 섞이면 다음 줄을
 * 엉뚱한 자리에서 시작하고, `if`/`goto` 블록이 통째로 어긋납니다. 열여덟 개 파일 중
 * **열여섯 개**가 그 상태였습니다.
 *
 * ── ⭐ 왜 이렇게 됐나 — 우리가 만들었습니다 ────────────────────────
 * Bash 의 히어독(`cat > file <<EOF`)과 Node 의 `fs.writeFileSync` 는 **LF 로 씁니다.**
 * 우리가 배치 파일을 그렇게 고칠 때마다 그 파일이 조금씩 죽어 갔습니다.
 * ⚠ 눈에는 안 보입니다. 편집기는 둘을 똑같이 보여 줍니다.
 * ⛔ 그래서 「조심하자」로는 안 됩니다 — 재는 자가 있어야 합니다 (강령 ④).
 *
 * ── 무엇을 재나 ────────────────────────────────────────────────
 * 세션입구 폴더의 `.cmd` 를 모두 열어 **LF 만 있는 줄이 하나라도 있으면 잡습니다.**
 * ⛔ 「몇 줄이면 괜찮다」는 없습니다. 한 줄만 있어도 그 아래가 어긋날 수 있습니다.
 *
 * ── 고치는 법 ──────────────────────────────────────────────────
 *   node scripts/check-session-entry-crlf.mjs --고쳐라
 * ⚠ 고치기 전에 `_옛것` 에 사본을 남깁니다. ⛔ 내용은 한 글자도 안 바꿉니다 — 줄바꿈만입니다.
 *
 * 쓰는 법
 *   node scripts/check-session-entry-crlf.mjs
 *   node scripts/check-session-entry-crlf.mjs --자가시험
 *   node scripts/check-session-entry-crlf.mjs --고쳐라
 */
import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);

/** ⚠ 세션입구는 저장소 «밖»(원드라이브)에 있습니다. 없으면 못 쟀다로 끝냅니다 */
export const 입구방 = 'C:/Users/User/OneDrive/Desktop/00_세션입구';

/**
 * LF 만 있는 줄이 몇인지 셉니다.
 * ⛔ 문자열을 줄로 쪼개 세지 않습니다 — 쪼개는 순간 어느 쪽이 CRLF 였는지 잃습니다.
 */
export function 줄바꿈세기(글) {
  if (typeof 글 !== 'string') return null;   /* ⬜ 못 쟀습니다 */
  let crlf = 0;
  let lf = 0;
  for (let i = 0; i < 글.length; i += 1) {
    if (글[i] === '\n') {
      if (i > 0 && 글[i - 1] === '\r') crlf += 1;
      else lf += 1;
    }
  }
  return { crlf, lf };
}

/** ⛔ 내용은 안 건드리고 줄바꿈만 CRLF 로 맞춥니다 */
export function 줄바꿈고치기(글) {
  if (typeof 글 !== 'string') return null;
  return 글.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
}

function 자가시험() {
  let 통과 = 0;
  let 실패 = 0;
  const 검 = (무엇, 참인가) => {
    if (참인가) { 통과 += 1; } else { 실패 += 1; console.log(`  ❌ ${무엇}`); }
  };

  검('CRLF 만 있는 글', JSON.stringify(줄바꿈세기('a\r\nb\r\n')) === '{"crlf":2,"lf":0}');
  검('LF 만 있는 글', JSON.stringify(줄바꿈세기('a\nb\n')) === '{"crlf":0,"lf":2}');
  검('섞인 글을 «갈라» 센다', JSON.stringify(줄바꿈세기('a\r\nb\nc\r\n')) === '{"crlf":2,"lf":1}');
  검('줄바꿈이 없으면 둘 다 0', JSON.stringify(줄바꿈세기('abc')) === '{"crlf":0,"lf":0}');
  검('빈 글도 센다', JSON.stringify(줄바꿈세기('')) === '{"crlf":0,"lf":0}');
  검('⛔ 글이 아니면 못 쟀다(null)', 줄바꿈세기(null) === null && 줄바꿈세기(7) === null);
  검('맨 앞 \\n 은 LF 로 센다', JSON.stringify(줄바꿈세기('\nabc')) === '{"crlf":0,"lf":1}');

  검('LF 를 CRLF 로 고친다', 줄바꿈고치기('a\nb\n') === 'a\r\nb\r\n');
  검('이미 CRLF 면 그대로', 줄바꿈고치기('a\r\nb\r\n') === 'a\r\nb\r\n');
  검('섞인 것도 고친다', 줄바꿈고치기('a\r\nb\nc') === 'a\r\nb\r\nc');
  검('⛔ 고친 뒤에는 LF 만 있는 줄이 0 이다', 줄바꿈세기(줄바꿈고치기('a\nb\r\nc\n')).lf === 0);
  검('⛔ 글자를 안 바꾼다', 줄바꿈고치기('가나다\nABC').replace(/\r/g, '') === '가나다\nABC');
  검('\\r 이 홀로 있어도 안 늘린다', 줄바꿈고치기('a\r\nb') === 'a\r\nb');

  console.log(실패 === 0
    ? `✅ check-session-entry-crlf 자가시험 — 통과 ${통과} · 실패 0`
    : `❌ 자가시험 — 통과 ${통과} · 실패 ${실패}`);
  return 실패 === 0;
}

function main() {
  if (argv.includes('--자가시험') || argv.includes('--selftest')) {
    process.exit(자가시험() ? 0 : 1);
  }
  const 고칠까 = argv.includes('--고쳐라');

  console.log('■ 세션입구 배치 파일이 클릭하면 열리나 — 줄바꿈을 본다\n');

  if (!fs.existsSync(입구방)) {
    console.log(`⬜ **못 쟀다** — 세션입구 폴더가 없다: ${입구방}`);
    console.log('   ⚠ 원드라이브가 안 붙었거나 자리가 옮겨졌다. ⛔ 「통과」로 적지 않는다.');
    return;
  }

  const 파일들 = fs.readdirSync(입구방).filter((n) => n.toLowerCase().endsWith('.cmd')).sort();
  if (!파일들.length) {
    console.log('⬜ **못 쟀다** — .cmd 가 한 개도 없다. 자리가 맞는지 본다.');
    return;
  }

  const 걸린것 = [];
  for (const 이름 of 파일들) {
    const 길 = path.join(입구방, 이름);
    let 글;
    try {
      글 = fs.readFileSync(길, 'utf8');
    } catch {
      console.log(`   ⬜ ${이름} — 못 읽었다`);
      continue;
    }
    const r = 줄바꿈세기(글);
    if (r.lf > 0) 걸린것.push({ 이름, 길, r, 글 });
  }

  console.log(`   ${파일들.length}개 중 LF 가 섞인 것 ${걸린것.length}개\n`);

  if (!걸린것.length) {
    console.log('✅ 세션입구 배치 파일이 모두 CRLF 다 — 클릭하면 열린다.');
    console.log('⚠ 앞으로도 이 파일들을 Bash 히어독이나 fs.writeFileSync 로 고치지 않는다. LF 로 저장된다.');
    return;
  }

  for (const c of 걸린것) {
    console.log(`   🔴 ${c.이름}  CRLF ${c.r.crlf}줄 · **LF만 ${c.r.lf}줄**`);
  }
  console.log('\n⚠ LF 가 섞인 배치 파일은 cmd.exe 가 읽다 어긋나 «클릭해도 안 열립니다».');

  if (!고칠까) {
    console.log('\n   고치려면 — node scripts/check-session-entry-crlf.mjs --고쳐라');
    console.log('   ⛔ 내용은 한 글자도 안 바꿉니다. 줄바꿈만 CRLF 로 맞춥니다.');
    process.exitCode = 1;
    return;
  }

  const 옛것방 = path.join(입구방, '_옛것');
  fs.mkdirSync(옛것방, { recursive: true });
  const 오늘 = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  let 고친수 = 0;
  for (const c of 걸린것) {
    fs.copyFileSync(c.길, path.join(옛것방, `${c.이름}.LF섞임-${오늘}`));
    fs.writeFileSync(c.길, 줄바꿈고치기(c.글), 'utf8');
    const 다시 = 줄바꿈세기(fs.readFileSync(c.길, 'utf8'));
    if (다시.lf === 0) {
      고친수 += 1;
      console.log(`   ✅ ${c.이름} — CRLF ${다시.crlf}줄 · LF만 0`);
    } else {
      console.log(`   ❌ ${c.이름} — 고쳤는데 아직 LF 가 ${다시.lf}줄 남았다`);
    }
  }
  console.log(`\n✅ ${고친수}개를 고쳤다. 사본은 ${옛것방} 에 남겼다.`);
  console.log('⚠ 고친 뒤에는 «실제로 눌러서» 열리는지 한 번 봅니다 — 검사가 통과해도 실물을 봅니다.');
}

main();
