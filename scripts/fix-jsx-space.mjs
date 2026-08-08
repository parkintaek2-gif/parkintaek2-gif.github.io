#!/usr/bin/env node
/**
 * **굵은 글씨 뒤 붙음**을 자동으로 고친다 — `check-jsx-space.mjs` 가 짚은 줄만.
 *
 *   node scripts/fix-jsx-space.mjs          고친다
 *   node scripts/fix-jsx-space.mjs --보기만  무엇을 고칠지만 보여준다
 *
 * ## 🔴 왜 만들었나 (2026-08-08 14:4x)
 *
 *   오늘 이 병으로 `npm test` 가 **네 번** 막혔고, 그때마다 남의 파일을 대신 고쳤다.
 *
 *   ```
 *   13:3x  6번  data/index.astro · sector-workforce-panel.astro
 *   13:5x  6번  refund.astro · terms.astro
 *   14:3x  5번  wikitip/refund.astro · wikitip/terms.astro
 *   ```
 *
 *   ⛔ **대신 고쳐 주는 것은 답이 아니다.** 남의 파일에 손대는 일이 늘고,
 *     그 자리는 왜 걸렸는지 모른 채 다음에 또 같은 것을 쓴다.
 *   ⭐ 자를 주는 편이 낫다. 검사가 짚으면 **이걸 돌려서 스스로 고친다.**
 *
 * ## ⚠ 무엇을 하나 — **딱 한 가지만**
 *
 *   검사가 짚은 줄의 **끝에 `{' '}` 를 붙인다.** 그게 전부다.
 *   ⛔ 글을 다시 쓰지 않는다. 문장을 옮기지 않는다. **뜻을 안 건드린다.**
 *   ⚠ 이미 붙어 있으면 넘어간다. 두 번 붙이지 않는다.
 *
 * ## ⚠ 왜 안전한가
 *
 *   `{' '}` 는 **화면에 공백 하나**를 넣는 표시다. JSX 가 줄바꿈을 지우는 자리에만 쓴다.
 *   ⛔ 그래도 **고친 뒤 검사를 다시 돌린다.** 자가 0 이라고 해야 끝난 것이다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const 여기 = path.resolve(
  path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'),
  '..',
);
const 보기만 = process.argv.includes('--보기만') || process.argv.includes('--dry');

/** 검사를 돌려 짚은 자리를 받아 온다. ⛔ 여기서 규칙을 다시 적지 않는다 — 검사가 자다 */
function 짚은자리() {
  let out = '';
  try {
    out = execSync('node scripts/check-jsx-space.mjs', { cwd: 여기, encoding: 'utf8' });
  } catch (e) {
    out = (e.stdout || '') + (e.stderr || '');
  }
  if (!out.trim()) {
    console.log('⬜ 검사가 아무 말도 안 했다 — **재지 못했다.** 검사 파일이 있는지 보십시오');
    process.exit(2);
  }
  return [...out.matchAll(/⛔ (\S+\.astro):(\d+)/g)].map((m) => ({
    파일: m[1].replace(/\\/g, '/'),
    줄: Number(m[2]),
  }));
}

const 자리 = 짚은자리();
if (자리.length === 0) {
  console.log('✅ 고칠 것이 없다 — 붙어 나가는 곳 0건');
  process.exit(0);
}

/** 파일마다 **뒤에서부터** 고친다. 앞에서 고치면 줄 번호가 밀린다 */
const 묶음 = new Map();
for (const x of 자리) {
  if (!묶음.has(x.파일)) 묶음.set(x.파일, []);
  묶음.get(x.파일).push(x.줄);
}

let 고친수 = 0;
for (const [파일, 줄들] of 묶음) {
  const p = path.join(여기, 파일);
  if (!fs.existsSync(p)) {
    console.log(`⬜ 없다 — ${파일}`);
    continue;
  }
  const 줄목록 = fs.readFileSync(p, 'utf8').split('\n');
  const 고칠줄 = [...new Set(줄들)].sort((a, b) => b - a);
  for (const n of 고칠줄) {
    const 원 = 줄목록[n - 1];
    if (원 == null) continue;
    if (/\{' '\}\s*$/.test(원)) continue; // 이미 붙어 있다
    if (보기만) {
      console.log(`  ${파일}:${n}\n    ${원.trim().slice(0, 80)}`);
      continue;
    }
    줄목록[n - 1] = 원.replace(/\s*$/, "{' '}");
    고친수++;
  }
  if (!보기만) fs.writeFileSync(p, 줄목록.join('\n'), 'utf8');
  console.log(`${보기만 ? '⬜' : '✅'} ${파일} — ${고칠줄.length}곳`);
}

if (보기만) {
  console.log(`\n⬜ 보기만 했다. 고치려면 --보기만 없이 돌린다`);
  process.exit(0);
}

console.log(`\n고친 줄 ${고친수}개`);
/* 🔴 고쳤다고 끝이 아니다. **자를 다시 돌려** 0 인지 본다 */
try {
  const 다시 = execSync('node scripts/check-jsx-space.mjs', { cwd: 여기, encoding: 'utf8' });
  console.log(다시.trim().split('\n').slice(-2).join('\n'));
} catch (e) {
  console.log('⛔ 고친 뒤에도 검사가 웁니다 — 손으로 봐야 합니다');
  console.log(((e.stdout || '') + (e.stderr || '')).trim().split('\n').slice(-6).join('\n'));
  process.exit(1);
}
