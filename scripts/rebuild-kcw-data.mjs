#!/usr/bin/env node
/**
 * **한국 작품 규칙이 바뀌면 이걸 돌린다.** `korean-netflix-titles.mjs` 를 쓰는 자료 전부를 다시 짓는다.
 *
 * ── 왜 ────────────────────────────────────────────────────────
 *   2026-08-10, 남의 작품 13편을 명단에서 뺐다. 그 규칙을 쓰는 짓는 자가 **26개**다.
 *   하나만 다시 지으면 지면끼리 수가 어긋난다 — 같은 패널을 두 가지로 말하게 된다.
 *   ⛔ 그런데 그때까지 「어느 자를 다시 돌려야 하나」가 **아무 데도 안 적혀 있었다.**
 *      손으로 세어 붙이면 다음 사람이 또 센다. 그래서 **목록을 만들지 않고 찾아낸다.**
 *
 * ── ⚠ 이 자가 지키는 것 ──────────────────────────────────────
 * ⚠ 목록을 손으로 안 적는다. `scripts/build-*.mjs` 중 규칙을 **import 하는 것**을 찾아 돌린다.
 *   자가 새로 생겨도 저절로 들어온다.
 * ⛔ 하나가 죽어도 **멈추지 않는다.** 끝까지 돌리고 죽은 것을 모아서 낸다 —
 *   중간에 서면 자료 절반만 새것이 되어 더 나쁘다.
 * ⛔ 배포하지 않는다. 짓기만 한다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const 규칙 = 'korean-netflix-titles';

/**
 * ⚠ **내 곳간만** 적는다. `archive/raw` 로 넓게 잡으면 6번·3번의 짓는 자까지 같이 돌아
 *   내 보고에 남의 실패가 섞인다. 자기 자리를 넘지 않는다.
 */
const 곳간들 = ['archive/raw/netflix-top10', 'archive/raw/star-pageviews',
  /**
   * 🔴 2026-08-23 저녁 — 세 번째 입력이 생겼다. 방 지면(`/room/<띠>`)에 「이 방 사람의
   *   이름이 제목에 든 기사」로 문을 달았더니 `build-kcw-community.mjs` 가
   *   **기사 앞말을 읽는 자**가 됐다. 그런데 이 목록에 없어서 다시 안 돌았다 —
   *   즉 **다음 기사를 내면 방에 그 문이 안 생긴다.** 아침에 곳간 하나만 따라가
   *   `/actors` 가 옛 창을 싣고 있었던 것과 **같은 흠**이다. 세 시간 뒤에 내가 다시 만들었다.
   * ⭐ 그러니 규칙은 이것이다 — **자에 새 입력을 붙이면 그 입력을 여기 같이 적는다.**
   *   적지 않으면 그 자는 낡은 것을 계속 내보내고, 화면에는 아무 빨강도 안 뜬다.
   */
  'content/kculturewire'];

/**
 * 다시 지어야 할 짓는 자를 **찾아낸다.** 손 목록을 안 만든다.
 *
 * ── 🔴 2026-08-23 · 하나만 따라가고 있었다 ──────────────────────
 *   앞서는 「한국 작품 판정 규칙을 import 하는 것」만 찾았다. 오늘 자료를 새로 캘 때
 *   **바뀐 입력이 둘**이었다 — 판정 규칙이 읽는 작품 목록, 그리고 위키 조회수 곳간.
 *   조회수를 쓰는 자(`build-wikitip-actors` 등)는 규칙을 import 하지 않으므로 안 돌았고,
 *   `/actors` 지면이 옛 창(2026-07-05~08-03)을 그대로 싣고 있었다.
 *   기사와 지면이 서로 다른 날의 자료를 말하는 상태였고, 그것을 다른 자가 잡아 줬다.
 * ⭐ 그래서 **곳간을 읽는 자도 같이 돈다.** 곳간이 바뀌면 그 자의 산출도 낡는다.
 */
/**
 * ⚠ **글자로 찾는 자는 표기 하나에 눈이 먼다.** 2026-08-23 에 `content/kculturewire` 를
 *   이 목록에 넣었는데도 `build-kcw-community.mjs` 가 안 걸렸다 —
 *   그 자는 `path.join(뿌리, 'content', 'kculturewire')` 로 적혀 있었다.
 *   ⭐ 그래서 **두 표기를 다 본다** — 붙여 쓴 길과 path.join 으로 쪼갠 길.
 *   ⛔ 「안 걸렸다」를 「안 쓴다」로 읽으면 낡은 산출이 조용히 계속 나간다.
 */
export function 길이든가(글, 길) {
  if (글.includes(길)) return true;
  const 쪼갠 = 길.split('/').map((x) => `'${x}'`).join(', ');
  return 글.includes(쪼갠);
}

export function 돌릴자들(읽기 = fs, 방 = 'scripts') {
  return 읽기.readdirSync(방)
    .filter((f) => /^build-.*\.mjs$/.test(f))
    .filter((f) => {
      const s = 읽기.readFileSync(path.join(방, f), 'utf8');
      return s.includes(규칙) || 곳간들.some((c) => 길이든가(s, c));
    })
    .sort();
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    if (JSON.stringify(실제) === JSON.stringify(바람)) 통 += 1;
    else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  const 가짜 = {
    readdirSync: () => ['build-a.mjs', 'build-b.mjs', 'check-c.mjs', 'build-z.mjs'],
    readFileSync: (p) => (p.includes('build-a') || p.includes('build-z')
      ? `import x from './lib/${규칙}.mjs'` : 'nothing'),
  };
  재본다('규칙을 쓰는 짓는 자만', 돌릴자들(가짜), ['build-a.mjs', 'build-z.mjs']);
  /* 🔴 곳간을 읽는 자도 잡히나 — 이것이 없어서 /actors 가 옛 자료를 실었다 */
  재본다('곳간을 읽는 자도 잡는다', 돌릴자들({
    readdirSync: () => ['build-p.mjs', 'build-q.mjs'],
    readFileSync: (x) => (String(x).includes('build-p') ? 'reads archive/raw/star-pageviews' : 'nothing'),
  }), ['build-p.mjs']);
  재본다('검사하는 자는 안 돈다', 돌릴자들({
    ...가짜, readFileSync: () => `import x from './lib/${규칙}.mjs'`,
  }).includes('check-c.mjs'), false);
  재본다('없으면 빈 목록', 돌릴자들({ readdirSync: () => [], readFileSync: () => '' }), []);

  /* 🔴 2026-08-23 저녁 — 길을 목록에 넣었는데도 안 걸렸다. 그 자는 path.join 으로
     쪼개 적혀 있었다. **표기 하나에 눈이 먼 자**를 그대로 두면 낡은 산출이 조용히 나간다 */
  재본다('path.join 으로 쪼갠 길도 찾는다',
    길이든가("const 방 = path.join(뿌리, 'content', 'kculturewire');", 'content/kculturewire'), true);
  재본다('붙여 쓴 길도 찾는다', 길이든가("read('content/kculturewire')", 'content/kculturewire'), true);
  재본다('없으면 안 찾는다', 길이든가('nothing here', 'content/kculturewire'), false);
  /* ⛔ 조각이 다 들었어도 **순서가 아니면** 아니다 — 우연히 걸리게 두지 않는다 */
  재본다('조각이 흩어져 있으면 안 찾는다',
    길이든가("f('kculturewire', 'content')", 'content/kculturewire'), false);
  재본다('쪼갠 길을 읽는 자를 돌릴 목록에 넣는다', 돌릴자들({
    readdirSync: () => ['build-r.mjs', 'build-s.mjs'],
    readFileSync: (x) => (String(x).includes('build-r')
      ? "path.join(뿌리, 'content', 'kculturewire')" : 'nothing'),
  }), ['build-r.mjs']);

  console.log(`자료 다시 짓는 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  const 자들 = 돌릴자들();
  console.log(`규칙(${규칙})을 쓰는 짓는 자 ${자들.length}개 — 차례로 돌린다\n`);
  const 죽은것 = [];
  const 시작 = process.hrtime.bigint();
  for (const [i, f] of 자들.entries()) {
    const t = process.hrtime.bigint();
    const r = spawnSync(process.execPath, [`scripts/${f}`], { encoding: 'utf8', maxBuffer: 1e9 });
    const 초 = Number(process.hrtime.bigint() - t) / 1e9;
    if (r.status === 0) {
      console.log(`  ✅ ${String(i + 1).padStart(2)}/${자들.length} ${f.padEnd(38)} ${초.toFixed(0)}초`);
    } else {
      const 끝줄 = String(r.stderr || r.stdout).trim().split('\n').slice(-2).join(' / ');
      console.log(`  ⛔ ${String(i + 1).padStart(2)}/${자들.length} ${f.padEnd(38)} ${초.toFixed(0)}초 — ${끝줄}`);
      죽은것.push({ f, 끝줄 });
    }
  }
  /**
   * 🔴 한 바퀴로는 모자란다 — **자들끼리 서로 본다.**
   *   `build-wikitip-season.mjs` 는 제 달 합계를 `/world-share` 의 수와 대조하는 자물쇠를 갖고 있다.
   *   알파벳 순으로 돌리면 season(20번째)이 world-share(26번째)의 **옛 수**와 대조해 선다.
   *   실제로 그렇게 섰다 — 37,666 ≠ 37,750, 차이가 정확히 내가 뺀 84자리였다.
   * ⭐ 그 자물쇠가 나쁜 게 아니라 **내 순서가 나빴다.** 순서를 손으로 적는 대신 **한 바퀴 더 돈다.**
   *   두 번째에도 서면 그건 진짜 고장이다.
   */
  if (죽은것.length) {
    console.log(`\n⚠ ${죽은것.length}개가 섰다 — 자들끼리 서로 보므로 **한 바퀴 더 돈다**`);
    for (const x of [...죽은것]) {
      const r = spawnSync(process.execPath, [`scripts/${x.f}`], { encoding: 'utf8', maxBuffer: 1e9 });
      if (r.status === 0) {
        console.log(`  ✅ 두 번째에 지었다 — ${x.f}`);
        죽은것.splice(죽은것.indexOf(x), 1);
      } else {
        x.끝줄 = String(r.stderr || r.stdout).trim().split('\n')
          .filter((l) => /Error|⛔|≠/.test(l)).slice(0, 1)[0] ?? x.끝줄;
      }
    }
  }
  const 총초 = Number(process.hrtime.bigint() - 시작) / 1e9;
  console.log(`\n${자들.length}개 중 ${자들.length - 죽은것.length}개 지었다 · ${(총초 / 60).toFixed(1)}분`);
  /*
   * 🔴 2026-08-23 — 「못 쟀다」와 「깨졌다」를 갈라 센다. 곳간을 읽는 자까지 돌리면
   *   이 기계에 없는 원자료를 읽는 자가 같이 걸린다. 그건 자료가 없는 것이지 고장이 아니다.
   * ⛔ 둘을 한 덩어리로 세면 진짜 고장이 여러 줄에 묻힌다.
   * ⚠ 「못 쟀다」는 통과가 아니다 — 그 지면은 옛 자료를 그대로 싣고 있다.
   */
  const 자료없나 = (s) => /ENOENT|없다 — archive|자료가 없다|곳간이 없다|레코드가 0건/.test(String(s));
  const 못잰것 = 죽은것.filter((x) => 자료없나(x.끝줄));
  const 깨진것 = 죽은것.filter((x) => !자료없나(x.끝줄));
  if (못잰것.length) {
    console.log(`⚠ 못 쟀다 ${못잰것.length}개 — 이 기계에 원자료가 없다(곳간은 git 에 없다)`);
    console.log('   ⛔ 이것은 「지었다」가 아니다. 그 지면은 옛 자료를 그대로 싣고 있다.');
    for (const x of 못잰것) console.log(`   ${x.f} — ${x.끝줄}`);
  }
  if (깨진것.length) {
    console.log(`⛔ 깨진 것 ${깨진것.length}개:`);
    for (const x of 깨진것) console.log(`   ${x.f} — ${x.끝줄}`);
    process.exit(1);
  }
  console.log('⛔ 배포하지 않았다. 검사 80개를 돌린 뒤에 사람이 판단한다.');
}
