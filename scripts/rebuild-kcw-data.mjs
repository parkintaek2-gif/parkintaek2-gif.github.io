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

/** 규칙을 쓰는 짓는 자를 찾는다. **손 목록을 안 만든다.** */
export function 돌릴자들(읽기 = fs, 방 = 'scripts') {
  return 읽기.readdirSync(방)
    .filter((f) => /^build-.*\.mjs$/.test(f))
    .filter((f) => 읽기.readFileSync(path.join(방, f), 'utf8').includes(규칙))
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
  재본다('검사하는 자는 안 돈다', 돌릴자들({
    ...가짜, readFileSync: () => `import x from './lib/${규칙}.mjs'`,
  }).includes('check-c.mjs'), false);
  재본다('없으면 빈 목록', 돌릴자들({ readdirSync: () => [], readFileSync: () => '' }), []);
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
  if (죽은것.length) {
    console.log(`⛔ 죽은 것 ${죽은것.length}개:`);
    for (const x of 죽은것) console.log(`   ${x.f} — ${x.끝줄}`);
    process.exit(1);
  }
  console.log('⛔ 배포하지 않았다. 검사 80개를 돌린 뒤에 사람이 판단한다.');
}
