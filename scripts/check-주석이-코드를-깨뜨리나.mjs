#!/usr/bin/env node
/**
 * 🔴🔴 **주석 안에 「별표+빗금」을 만들어 주석을 조기에 닫는 흠을 잡는다.**
 *
 * [2026-10-06 16:2x · 5번] 사장님: 「**같은 실수를 왜 반복하나**」
 *
 * 오늘 한 시간 안에 **두 번** 밟았다 —
 *   klifemap/server.js      주석에 「별표별표/all」 이라 썼다 → 주석이 거기서 닫혔다
 *   klifemap/staticNav.js   같은 글을 또 썼다 → 또 깨졌다
 *
 * 까닭은 간단하다. 여러 줄 주석 안에서 굵게 쓰려고 별표 둘을 쓰는데,
 * 바로 뒤에 빗금으로 시작하는 주소를 적으면 **별표+빗금**이 되어 주석이 끝난다.
 * 우리는 주석에 주소를 «아주 많이» 적는다. 그러니 또 밟는다.
 *
 * ⛔ 「조심한다」로는 안 끝난다. 오늘 조심하겠다고 적고 10분 뒤에 또 밟았다.
 * ⇒ 검사로 둔다. 자는 안 잊는다.
 *
 * ⚠ 문법 검사(`node --check`)가 결국 잡기는 한다. 그러나 —
 *   ① 깨진 뒤에 잡는다. 이 자는 «무엇을 어떻게 고치는지»까지 말해 준다
 *   ② 주석이 닫혀도 «우연히 문법이 맞는» 자리가 있다. 그때는 조용히 뜻만 틀어진다
 *
 * 쓰기 —
 *   node scripts/check-주석이-코드를-깨뜨리나.mjs <폴더...>
 *   node scripts/check-주석이-코드를-깨뜨리나.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 한 줄에서 «주석을 닫을 뜻이 없는데 닫히는» 자리를 찾는다.
 *
 * 🔴 [2026-10-06 16:3x · 5번] **처음에 별표 둘 뒤 빗금만 봤다. 좁았다.**
 *   이 자를 짓자마자 내가 또 밟았는데, 자가 못 잡았다 —
 *   주석 안에 「줄 끝에 제대로 닫는 것」을 «글자로» 적었더니 그 자리에서 주석이 닫혔다.
 *   별표가 하나뿐이라 그때 자는 그냥 지나갔다.
 *   ⇒ 별표 몇 개인지를 묻지 않는다. **닫는 기호가 나오고 뒤에 글이 남으면 흠이다.**
 *   ⛔ 닫는 기호를 주석 안에 «글자로» 적지 않는다. 적어야 하면 홑낫표로 감싸고 띄운다.
 */
export function 깨진자리(줄) {
  const s = String(줄 ?? '');
  const 것 = [];
  const 재 = /\*+\//g;
  let m;
  while ((m = 재.exec(s)) !== null) 것.push({ 자리: m.index, 글: m[0] });
  return 것;
}

/** 그 줄이 여러 줄 주석 «안»인가를 세며 간다 */
export function 파일훑기(글) {
  const 줄들 = String(글 ?? '').split(/\r?\n/);
  const 흠 = [];
  let 주석안 = false;
  for (let i = 0; i < 줄들.length; i += 1) {
    const 줄 = 줄들[i];
    if (주석안) {
      for (const x of 깨진자리(줄)) {
        /* 🔴 [2026-10-06 16:3x · 5번] 처음엔 「뒤에 무엇이든 남으면 흠」으로 봤다. 507개가 울었다.
           대부분 Astro·JSX 의 정상적인 주석 끝(닫는 기호 뒤에 중괄호 하나)이었다.
           ⛔ 거짓으로 우는 자물쇠는 결국 꺼진다 — 그러면 자물쇠가 없는 것과 같다.
           ⇒ 뒤에 «읽을 글»(글자·숫자·한글)이 남을 때만 흠으로 본다.
             닫는 기호만 남는 것은 제대로 닫은 것이다.
           ⚠ 이 주석에 닫는 기호를 «글자로» 적지 않는다 — 오늘 그것으로 세 번 깨뜨렸다. */
        const 뒤 = 줄.slice(x.자리 + x.글.length).trim();
        if (/[A-Za-z0-9가-힣]/.test(뒤)) {
          흠.push({ 줄번호: i + 1, 글: 줄.trim().slice(0, 100), 걸린것: x.글 });
        }
      }
    }
    /* 주석 열고 닫기를 센다 — 한 줄에 열고 닫은 것은 셈이 맞아 저절로 빠진다 */
    const 연것 = (줄.match(/\/\*/g) ?? []).length;
    const 닫은것 = (줄.match(/\*\//g) ?? []).length;
    if (연것 > 닫은것) 주석안 = true;
    else if (닫은것 > 연것) 주석안 = false;
  }
  return 흠;
}

export function 훑을파일들(뿌리) {
  const 것 = [];
  const 걷기 = (d) => {
    let 목록;
    try { 목록 = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of 목록) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) {
        if (['node_modules', '.git', 'dist', 'archive', 'tmp'].includes(e.name)) continue;
        걷기(p); continue;
      }
      if (/\.(mjs|js|ts|astro)$/.test(e.name)) 것.push(p);
    }
  };
  걷기(뿌리);
  return 것;
}

function 주다(뿌리들) {
  let 흠수 = 0; let 센파일 = 0;
  console.log('\n■ 주석이 코드를 깨뜨리나 — 「별표둘+빗금」이 주석을 조기에 닫는다');
  for (const 뿌리 of 뿌리들) {
    for (const f of 훑을파일들(뿌리)) {
      let 글;
      try { 글 = fs.readFileSync(f, 'utf8'); } catch { continue; }
      센파일 += 1;
      const 흠 = 파일훑기(글);
      if (!흠.length) continue;
      console.log(`\n   🔴 ${f}`);
      for (const h of 흠) {
        console.log(`      ${h.줄번호}줄  「${h.걸린것}」  ${h.글}`);
        흠수 += 1;
      }
    }
  }
  console.log(`\n   훑은 파일 ${센파일}개 · 흠 ${흠수}개`);
  if (흠수) {
    console.log('   ✅ 고치는 법 — 굵게 쓰려던 별표를 떼고 「주소」처럼 홑낫표로 감싼다');
    console.log('   ⛔ 주석 안에서 별표 둘 바로 뒤에 빗금을 두지 않는다');
    return 1;
  }
  console.log('   ✅ 깨뜨리는 주석 없다');
  return 0;
}

/* ── 자가시험 ───────────────────────────────────────────── */
function 자가시험() {
  let 통 = 0; let 탈 = 0;
  const 본다 = (말, 참) => { if (참) { 통 += 1; console.log('✅ ' + 말); } else { 탈 += 1; console.log('🔴 ' + 말); } };

  본다('🔴 별표 둘 뒤 빗금을 잡는다', 깨진자리('굵게 **/all 이라 썼다').length === 1);
  본다('별표 셋도 잡는다', 깨진자리('***/x').length === 1);
  본다('⛔ 홑별표는 흠이 아니다 — 보통 주석 줄머리다', 깨진자리(' * /all 은 괜찮다').length === 0);
  본다('⛔ 별표만 있고 빗금이 없으면 흠이 아니다', 깨진자리('**굵게**').length === 0);

  const 깨진것 = ['/**', ' * 굵게 **/all 이라 썼다 — 여기서 주석이 닫힌다', ' */', 'const a = 1;'].join('\n');
  본다('🔴 여러 줄 주석 «안»의 것을 잡는다', 파일훑기(깨진것).length === 1);
  본다('줄 번호를 말해 준다', 파일훑기(깨진것)[0].줄번호 === 2);

  const 멀쩡 = ['/**', ' * 「/all」 이라 쓰면 안 깨진다', ' */', 'const a = 1;'].join('\n');
  본다('⭐ 홑낫표로 감싸면 흠이 아니다', 파일훑기(멀쩡).length === 0);

  본다('⛔ 주석 «밖»의 것은 안 잡는다 — 나눗셈일 수 있다',
    파일훑기('const x = a ** b / c;').length === 0);
  본다('⛔ 제대로 닫는 줄은 흠이 아니다',
    파일훑기(['/**', ' * 글', ' **/', 'const a = 1;'].join('\n')).length === 0);
  본다('⛔ 닫는 기호만 남으면 흠이 아니다 — Astro 주석이 그렇게 끝난다',
    파일훑기(['/**', ' * 글', ' */}', 'const a = 1;'].join('\n')).length === 0);
  본다('🔴 뒤에 읽을 글이 남으면 흠이다 — 내가 오늘 밟은 그것이다',
    파일훑기(['/**', ' * 닫는 기호(*' + '/)를 글자로 적었다 — 여기서 닫힌다', ' */', 'const a = 1;'].join('\n')).length === 1);
  본다('⛔ 빈 것에 안 터진다', 파일훑기(null).length === 0 && 파일훑기('').length === 0);

  console.log(탈 ? `\n🔴 자가시험 ${탈}건 탈` : `\n✅ 자가시험 ${통} 통과`);
  return 탈 ? 1 : 0;
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가실행됐다) {
  if (process.argv.includes('--자가시험')) process.exit(자가시험());
  const 뿌리들 = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  process.exit(주다(뿌리들.length ? 뿌리들 : ['scripts', 'src']));
}
