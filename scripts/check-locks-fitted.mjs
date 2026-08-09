#!/usr/bin/env node
/**
 * **자물쇠가 문에 달려 있나** — 만들어만 놓고 안 쓰는 것을 잡는다.
 *
 * 사장님(2026-08-09 20:10): 「자물쇠를 최대로 찾아 **채워라. 모든 세션에**」
 * 2번(20:4x): 「지금 **2번 말고 전부 ☐** 입니다. **만들어만 놓고 아무도 안 씁니다**」
 *
 * 🔴 실제로 그랬다 — `scripts/deploy.mjs` 에 `deploy-key` 라는 글자가 **한 번도 없었고**,
 *    5번은 2026-08-09 하루에 배포를 다섯 번 하면서 열쇠를 **한 번도 안 받았다.**
 *    ⛔ 자물쇠가 없던 게 아니라 **문에 안 달려 있었다.** 그 상태를 재는 자가 이것이다.
 *
 * ⛔ 이 자가 보는 것 — 「있나」가 아니라 **「달려 있나」**다
 *   ① 자물쇠 다섯이 파일로 있나
 *   ② 자가시험이 있나 (⛔ 2번: 「자가시험 없는 자는 자로 안 친다」)
 *   ③ 🔴 **배포하는 자가 열쇠를 부르나** — 이게 요점이다
 *   ④ 🔴 **열쇠 없이 부르면 종료코드가 1 인가** — 소리만 내고 0 으로 끝나면 안 문 것이다
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const 자물쇠들 = [
  'deploy-key', 'check-deploy-ready', 'report-key', 'check-answered', 'find-first',
];

/** 자가시험 스위치를 받나 */
export function 자가시험있나(글) {
  return /--자가시험|--selftest/.test(String(글));
}

/** 배포하는 자가 열쇠를 부르나 */
export function 열쇠를부르나(글) {
  return /deploy-key/.test(String(글)) && /check-deploy-ready/.test(String(글));
}

/**
 * 뒷문이 있나. ⛔ 있으면 자물쇠가 아니라 장식이다.
 * ⚠ 주석에 적힌 「뒷문을 안 만든다」는 뒷문이 아니다 — 주석을 떼고 본다.
 */
export function 뒷문있나(글) {
  const 몸 = String(글)
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/^\s*\/\/.*$/gm, ' ')
    .replace(/^\s*\*.*$/gm, ' ');
  return /--열쇠없이|--no-key|--force-deploy|SKIP_KEY/.test(몸);
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다) {
  let 시험 = 0; let 통과 = 0;
  const 자가 = (이름, 참) => { 시험 += 1; if (참) 통과 += 1; else console.log(`  ⛔ 자가시험 실패 — ${이름}`); };
  자가('자가시험 스위치를 찾는다', 자가시험있나("argv.includes('--자가시험')"));
  자가('영어 스위치도 찾는다', 자가시험있나("argv.includes('--selftest')"));
  자가('없으면 아니다', !자가시험있나('console.log(1)'));
  /* 🔴 둘 다 있어야 「부른다」로 본다 — 하나만 있으면 안내만 하고 안 막을 수 있다 */
  자가('열쇠를 부르는 것을 찾는다', 열쇠를부르나('deploy-key … check-deploy-ready'));
  자가('한쪽만이면 아니다', !열쇠를부르나('deploy-key 만 적혀 있다'));
  자가('뒷문을 찾는다', 뒷문있나('if (argv.includes("--열쇠없이")) return true;'));
  /* ⛔ 주석에 적힌 다짐을 뒷문으로 세지 않는다 */
  자가('주석 속 말은 뒷문이 아니다', !뒷문있나('/* ⛔ --열쇠없이 같은 스위치를 두지 않는다 */'));
  자가('한 줄 주석도 뗀다', !뒷문있나('// --no-key 는 만들지 않는다'));
  console.log(`자물쇠 검사 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  let 틀림 = 0;
  const 본다 = (무엇, ok, 값) => { if (!ok) 틀림 += 1; console.log(`${ok ? '  ' : '❌'} ${String(무엇).padEnd(40)} ${값}`); };

  console.log('\n① 자물쇠가 파일로 있나 · ② 자가시험이 있나');
  for (const 이름 of 자물쇠들) {
    const p = `scripts/${이름}.mjs`;
    if (!fs.existsSync(p)) { 본다(이름, false, '⛔ 파일이 없다'); continue; }
    const 글 = fs.readFileSync(p, 'utf8');
    본다(이름, 자가시험있나(글), 자가시험있나(글) ? '자가시험 있다' : '⛔ 자가시험이 없다 — 자로 안 친다');
  }

  console.log('\n③ 🔴 배포하는 자가 열쇠를 부르나');
  const 배포자 = 'scripts/deploy.mjs';
  if (!fs.existsSync(배포자)) {
    본다('deploy.mjs', false, '⛔ 없다');
  } else {
    const 글 = fs.readFileSync(배포자, 'utf8');
    본다('deploy.mjs 가 열쇠를 부른다', 열쇠를부르나(글),
      열쇠를부르나(글) ? 'deploy-key + check-deploy-ready' : '⛔ 문에 안 달려 있다');
    본다('뒷문이 없다', !뒷문있나(글), 뒷문있나(글) ? '⛔ 뒷문이 있다 — 자물쇠가 아니다' : '없다');
  }

  console.log('\n④ 🔴 열쇠 없이 부르면 실제로 무나 (종료코드)');
  try {
    execFileSync('node', [배포자, '--app', 'seoulmarkets', '--표식', 'lock-probe'],
      { stdio: 'pipe', timeout: 60000 });
    본다('열쇠 없이 부르면 선다', false, '⛔ 0 으로 끝났다 — 소리만 내고 안 물었다');
  } catch (e) {
    const 코드 = e.status ?? null;
    본다('열쇠 없이 부르면 선다', 코드 === 1, `종료코드 ${코드}`);
  }

  console.log(틀림 ? `\n⛔ 안 달린 자물쇠 ${틀림}건` : '\n✅ 자물쇠가 문에 달려 있고 실제로 문다');
  process.exit(틀림 ? 1 : 0);
}
