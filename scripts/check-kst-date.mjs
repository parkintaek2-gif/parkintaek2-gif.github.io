#!/usr/bin/env node
/**
 * check-kst-date.mjs — **UTC 로 «날짜»를 만드는 자리가 늘었나.**
 * ────────────────────────────────────────────────────────────────────────────
 * [🔴 왜 만드나 — 🔴 지시를 어긴 자리가 86곳이었다 (2026-09-03 실측)]
 *
 *   CLAUDE.md 🔴: 「시각은 한국시간(KST)이다. 이 PC 가 이미 KST 다.
 *   9시간을 더하지 않고 **`toISOString()` 도 쓰지 않는다** — UTC 다.
 *   날짜를 만들면 **새벽에 하루가 어긋난다**」
 *
 *   오늘 `collect-news-desk.mjs` 에서 그 어긋남을 «눈으로» 봤다 —
 *   ```
 *   파일 이름   20260903.json                    ← KST 로 지었다
 *   그 안의 잰때 "2026-09-02T15:54:24.950Z"      ← UTC 라서 09-02 로 적혔다
 *   ```
 *   **같은 파일 안에서 날짜가 갈렸다.** 그 자는 «새벽»에 도는 자라 거의 항상 어긋난다.
 *
 * [⛔ 왜 「toISOString 을 쓰면 빨간불」로 만들지 않았나 — 그러면 208곳이 걸린다]
 *   `toISOString()` 자체는 죄가 아니다. 스키마의 `datePublished` 처럼 «시각 전체»를
 *   ISO 로 적어야 하는 자리에서는 그것이 맞다. 208곳을 다 잡으면 **자가 꺼진다.**
 *
 *   ⭐ 어긋나는 자리는 정확히 하나다 — **오프셋을 안 더하고 «날짜로 잘라 쓰는» 것.**
 *   ```
 *   ✅ 맞다   오늘()  in scripts/_kst.mjs  — `new Date(때 + KST밀리).toISOString().slice(0,10)`
 *            9시간을 «먼저 더하고» 자르므로 KST 날짜가 나온다
 *   🔴 틀리다 `new Date().toISOString().slice(0, 10)`
 *            오프셋 없이 자른다 → 00~09시 KST 에 «어제»가 적힌다
 *   ```
 *   그 좁은 꼴만 센다. 2026-09-03 실측 **86곳**이었고, 5번이 자기 몫 20곳을 고쳐 **66곳** 남았다.
 *
 * [⛔ 헛경보를 막으려고 둔 것 — 「기준선」 방식]
 *   86곳을 하루에 다 고칠 수는 없다. 파일이 세 유닛에 걸쳐 있다(100y=3번 · kcw=5번 · korea=6번).
 *   ⛔ 86개를 빨간불로 내면 아무도 안 고치고 자를 끈다. 실제로 이 저장소에서 겪은 일이다 —
 *      `check-tests-wired.mjs` 가 66개를 열 줄만 찍어서 아무도 못 고쳤다.
 *   ✅ 그래서 **늘어나면** 빨간불이다. 줄이는 것은 각 유닛이 자기 파일에서 한다.
 *   ✅ 그리고 걸린 것을 **다 찍는다.** 잘라 놓으면 고칠 수 없는 경고가 된다.
 *
 * [쓰는 법]
 *   node scripts/check-kst-date.mjs
 *   node scripts/check-kst-date.mjs --자가시험
 *   node scripts/check-kst-date.mjs --다찍기     걸린 자리를 다 본다
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * 🔴 오프셋을 안 더하고 «날짜로 잘라 쓰는» 꼴.
 * ⚠ `new Date(...)` 안에 무엇이 들었는지가 갈림길이다 —
 *   비었거나(`new Date()`) 밀리초 하나만 든 것은 오프셋이 없다.
 *   `+ KST밀리` 처럼 더한 것이 있으면 옳은 것이므로 잡지 않는다.
 */
export function 어긋난자리찾기(글) {
  const 걸린 = [];
  const 줄들 = String(글 ?? '').split(/\r?\n/);
  for (let i = 0; i < 줄들.length; i += 1) {
    const 줄 = 줄들[i];
    /* 주석은 세지 않는다 — 규칙을 «인용»한 줄까지 잡으면 자기 머리글에 걸린다 */
    const 벗은줄 = 줄.trim();
    if (벗은줄.startsWith('*') ||벗은줄.startsWith('//') || 벗은줄.startsWith('/*')) continue;
    /*
     * ⛔ 자가시험·단정 줄은 세지 않는다 — 일부러 «결함을 재현»하는 줄이 있다.
     *   실제로 `collect-dart.mjs:68` 이 그렇다: 「UTC 로 그대로 찍으면 전날이 나왔을 것(결함 재현)」.
     *   그 줄은 파일에 날짜를 쓰지 않는다. 잡으면 헛경보다.
     */
    if (/(?:^|[^가-힣])(?:검|본다|봐)\s*\(/.test(줄) || /assert/i.test(줄)) continue;

    /*
     * `new Date(<속>)` .toISOString() . slice|split
     * ⛔ 「지금」에서 만든 것만 센다 — `new Date()` 또는 `new Date(Date.now())`.
     *   `new Date(<이미 아는 날짜>)` 는 «다른 일»이다. `new Date('2026-09-03')` 은
     *   UTC 자정으로 파싱돼 잘라도 같은 날이 나온다 — 어긋나지 않는다.
     *   실제로 `sitemap.xml.ts` 가 그 꼴이라 첫판이 헛으로 잡았다.
     */
    /* ⚠ 속에 괄호가 한 겹 들어갈 수 있다 — `new Date(Date.now())`.
       `[^)]*` 로 잡으면 `Date.now(` 까지만 물어서 「지금이 아니다」로 새어 나간다. */
    const 재 = /new Date\(((?:[^()]|\([^()]*\))*)\)\s*\.toISOString\(\)\s*\.\s*(?:slice|substring|substr|split)\s*\(/g;
    let m;
    while ((m = 재.exec(줄)) !== null) {
      const 속 = m[1].trim();
      /* 오프셋을 더했으면 옳다 */
      if (/\+/.test(속)) continue;
      /* 「지금」이 아니면 세지 않는다 */
      if (속 !== '' && !/^Date\.now\(\)$/.test(속)) continue;
      걸린.push({ 줄번호: i + 1, 글: 줄.trim().slice(0, 150) });
    }
  }
  return 걸린;
}

function 파일훑기(방, 모음 = []) {
  for (const d of fs.readdirSync(방, { withFileTypes: true })) {
    if (d.name === 'node_modules' || d.name === 'dist' || d.name.startsWith('.')) continue;
    const p = path.join(방, d.name);
    if (d.isDirectory()) { 파일훑기(p, 모음); continue; }
    if (!/\.(mjs|js|ts|astro)$/.test(d.name)) continue;
    모음.push(p);
  }
  return 모음;
}

function 자가시험() {
  let 흠 = 0; let 잰수 = 0;
  const 본다 = (이름, 참) => { 잰수 += 1; if (참) console.log(`  ✅ ${이름}`); else { console.log(`  🔴 ${이름}`); 흠 += 1; } };

  본다('🔴 오프셋 없이 날짜로 자르면 잡는다',
    어긋난자리찾기('const d = new Date().toISOString().slice(0, 10);').length === 1);
  본다('split(\'T\')[0] 꼴도 잡는다',
    어긋난자리찾기("const d = new Date().toISOString().split('T')[0];").length === 1);
  /* ⭐ 이것이 이 자의 심장 — 옳은 것을 잡으면 자가 꺼진다 */
  본다('⭐ 오프셋을 «먼저 더한» 것은 잡지 않는다 (_kst.mjs 의 오늘())',
    어긋난자리찾기('return new Date(때 + KST밀리).toISOString().slice(0, 10);').length === 0);
  본다('⭐ 시각 «전체»를 ISO 로 적는 것은 잡지 않는다 (스키마가 그것을 원한다)',
    어긋난자리찾기('datePublished: new Date().toISOString(),').length === 0);
  본다('slice(0,16) 도 날짜를 만드는 것이라 잡는다',
    어긋난자리찾기("const t = new Date().toISOString().slice(0, 16).replace('T', ' ');").length === 1);
  /* ⛔ 주석에 규칙을 인용한 줄까지 잡으면 이 파일 자신이 걸린다 */
  본다('⛔ 주석 줄은 세지 않는다',
    어긋난자리찾기(' *   🔴 틀리다 new Date().toISOString().slice(0, 10)').length === 0);
  본다('// 주석도 세지 않는다',
    어긋난자리찾기('// new Date().toISOString().slice(0,10) 는 쓰지 않는다').length === 0);
  본다('한 줄에 둘이면 둘 다 센다',
    어긋난자리찾기('a=new Date().toISOString().slice(0,10);b=new Date().toISOString().slice(0,10);').length === 2);
  본다('아무것도 없으면 빈 것', 어긋난자리찾기('const d = 오늘();').length === 0);
  본다('빈 글도 견딘다', 어긋난자리찾기('').length === 0 && 어긋난자리찾기(null).length === 0);

  /* 🔴 첫판이 헛으로 잡은 둘 — 실제로 저장소에 있는 줄이다 */
  본다('⛔ 이미 아는 날짜를 옮기는 것은 세지 않는다 (sitemap.xml.ts)',
    어긋난자리찾기('    lastmod: new Date(날).toISOString().slice(0, 10),').length === 0);
  본다('Date.now() 로 만든 것은 «지금»이라 센다',
    어긋난자리찾기('const d = new Date(Date.now()).toISOString().slice(0, 10);').length === 1);

  /*
   * ⬜ **이 자가 «못 잡는» 것을 적어 둔다.** 다 잡는 자로 오해하면 그것이 더 위험하다.
   *   오늘 실제로 찾은 흠이 바로 이 꼴이었다 —
   *   ```
   *   const 오늘 = new Date();      ← 한 줄
   *   ...
   *   잰때: 오늘.toISOString(),      ← 여섯 줄 뒤. 자르지도 않았다
   *   ```
   *   변수에 담아 두면 이 자는 못 본다. 자르지 않은 «온 시각»도 안 센다.
   *   ⛔ 그러니 이 자가 초록이어도 「KST 를 다 지켰다」는 뜻이 아니다.
   */
  본다('⬜ 변수에 담은 것은 «못 잡는다» — 이 한계를 시험으로 못박아 둔다',
    어긋난자리찾기('const 오늘 = new Date();\n잰때: 오늘.toISOString().slice(0,10),').length === 0);

  console.log(흠 ? `\n🔴 자가시험 ${잰수}가지 중 ${흠}가지 틀렸다` : `\n✅ 자가시험 ${잰수}가지 다 맞다`);
  return 흠;
}

/**
 * 🔴 [기준선] 2026-09-03 에 «재서» 얻은 수다. 짐작이 아니다.
 * ⛔ 이 수를 «올리지» 않는다. 줄이면 이 줄도 같이 내린다.
 *   올려서 통과시키는 것은 자를 끄는 것과 같다.
 */
const 오늘까지봐주는수 = 66;
/*
 * ⚠ 처음에 77 로 적었다. 그것은 내가 «grep 으로» 센 수였고, 이 자가 세는 수는 86 이다
 *   (grep 은 `new Date()` 가 한 줄에 붙어 있는 꼴만 봤다).
 *   ⛔ **기준선은 「자가 세는 수」여야 한다.** 딴 도구로 센 수를 적으면 첫날부터 빨간불이고,
 *      그러면 사람이 자를 끈다. 자와 기준선이 같은 자로 세어야 한다.
 */

function main() {
  const 인자 = process.argv.slice(2);
  console.log('# UTC 로 «날짜»를 만드는 자리가 늘었나\n');
  const 흠 = 자가시험();
  if (인자.includes('--자가시험')) process.exit(흠 ? 1 : 0);
  if (흠) { console.log('\n⛔ 자가시험이 틀렸다. 재지 않는다.'); process.exit(1); }

  const 걸린것 = [];
  for (const 방 of ['scripts', 'src']) {
    const 자리 = path.join(뿌리, 방);
    if (!fs.existsSync(자리)) continue;
    for (const f of 파일훑기(자리)) {
      /* ⛔ 이 자 자신과 KST 도우미는 뺀다 — 규칙을 인용·구현하는 자리다 */
      const 이름 = path.basename(f);
      if (이름 === 'check-kst-date.mjs' || 이름 === '_kst.mjs') continue;
      const 것 = 어긋난자리찾기(fs.readFileSync(f, 'utf8'));
      for (const x of 것) 걸린것.push({ 파일: path.relative(뿌리, f).split(path.sep).join('/'), ...x });
    }
  }
  const 서버 = path.join(뿌리, 'server.mjs');
  if (fs.existsSync(서버)) {
    for (const x of 어긋난자리찾기(fs.readFileSync(서버, 'utf8'))) 걸린것.push({ 파일: 'server.mjs', ...x });
  }

  console.log(`\nUTC 로 날짜를 만드는 자리 **${걸린것.length}곳** (기준선 ${오늘까지봐주는수}곳)`);
  console.log('⚠ 이것은 `toISOString()` 전체가 아니다 — «오프셋 없이 날짜로 자르는» 좁은 꼴만 센다.');
  console.log('✅ 고치는 법: `import { 오늘, 지금 } from \'./_kst.mjs\'` 를 쓴다. 9시간을 손으로 더하지 않는다.');

  /* 유닛별로 갈라 보여 준다 — 누가 고칠 몫인지 바로 보이게 */
  const 갈래 = new Map();
  for (const x of 걸린것) {
    const k = /100y|100yearmap/.test(x.파일) ? '3번(백년지도)'
      : /kcw|wikitip/.test(x.파일) ? '5번(KCW)'
        : /klifemap/.test(x.파일) ? '1번·4번(klifemap)'
          : '6번·공용';
    갈래.set(k, (갈래.get(k) ?? 0) + 1);
  }
  console.log('\n■ 누가 고칠 몫인가');
  for (const [k, n] of [...갈래.entries()].sort((a, b) => b[1] - a[1])) console.log(`     ${String(n).padStart(3)}곳  ${k}`);

  if (인자.includes('--다찍기')) {
    console.log('\n■ 걸린 자리 전부');
    for (const x of 걸린것) console.log(`     ${x.파일}:${x.줄번호}`);
  } else {
    console.log(`\n   (자리를 다 보려면 --다찍기)`);
  }

  if (걸린것.length > 오늘까지봐주는수) {
    console.error(`\n⛔ **늘었다** (${오늘까지봐주는수} → ${걸린것.length}). 새로 만든 자리를 KST 로 고치십시오.`);
    console.error('   ⚠ 기준선 수를 올려서 통과시키지 마십시오 — 그것은 자를 끄는 것입니다.');
    process.exit(1);
  }
  if (걸린것.length < 오늘까지봐주는수) {
    console.log(`\n✅ **줄었다** (${오늘까지봐주는수} → ${걸린것.length}). 기준선을 ${걸린것.length} 로 내리십시오.`);
    process.exit(0);
  }
  console.log('\n✅ 늘지 않았다 (줄이는 것은 각 유닛이 자기 파일에서 한다)');
  process.exit(0);
}

if (process.argv[1] && process.argv[1].endsWith('check-kst-date.mjs')) main();
