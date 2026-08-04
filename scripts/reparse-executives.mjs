#!/usr/bin/env node
/**
 * 임원 **재직개월을 다시 계산**한다. **API 를 부르지 않는다.**
 *
 *   node scripts/reparse-executives.mjs           재보기만 한다
 *   node scripts/reparse-executives.mjs --write   파일을 고친다
 *
 * ── 왜 다시 받지 않아도 되나 ──────────────────────────────────
 * 이 파일에는 **`재직원문` 이 그대로 들어 있다.** 그래서 파서만 고치면
 * 그 자리에서 다시 계산할 수 있다 — 35,004행에 API 호출 0번이다.
 *
 * ⚠ 근속(`employment`)은 이렇게 못 했다. 거기엔 **파싱 결과만 있고 원문이 없어서**
 *   2,921곳을 전부 다시 받아야 했다. **원문을 함께 저장해 두면 이 차이가 난다.**
 *   앞으로 자유 서식 칸은 **원문을 반드시 같이 저장한다.**
 *
 * ── ⚠ 안전 ────────────────────────────────────────────────────
 * `--write` 는 `.bak` 을 먼저 만들고 **통째로 한 번에** 쓴다.
 * (append 로 쓰다가 중간에 죽어 파일이 반쪽이 된 적이 있다)
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { 개월 } from './collect-executives.mjs';

const 파일 = path.resolve('archive/raw/dart-executives/executives-2025.ndjson');

function main() {
  if (!existsSync(파일)) { console.error(`✕ ${파일} 이 없다.`); process.exit(1); }
  const 쓰기 = process.argv.includes('--write');
  const 줄 = readFileSync(파일, 'utf8').split('\n').filter((x) => x.trim());

  let 바뀜 = 0, 새로채움 = 0, 사라짐 = 0;
  const 새줄 = 줄.map((l) => {
    const r = JSON.parse(l);
    const 전 = r.재직개월;
    const 후 = 개월(r.재직원문);
    if (전 !== 후) {
      바뀜++;
      if (전 == null && 후 != null) 새로채움++;
      if (전 != null && 후 == null) 사라짐++;
      r.재직개월 = 후;
    }
    return JSON.stringify(r);
  });

  const 대표 = 줄.map((l) => JSON.parse(l)).filter((r) => r.대표);
  const 대표새 = 새줄.map((l) => JSON.parse(l)).filter((r) => r.대표);
  const 채움 = (a) => (a.filter((r) => r.재직개월 != null).length / a.length * 100).toFixed(1) + '%';

  console.log(`행 ${줄.length.toLocaleString()} · 값이 바뀐 것 ${바뀜.toLocaleString()}`);
  console.log(`  새로 채워짐 ${새로채움.toLocaleString()} · 없어짐 ${사라짐.toLocaleString()}`);
  console.log(`\n대표 ${대표.length.toLocaleString()}명 재직개월 채움률`);
  console.log(`  ${채움(대표)}  →  ${채움(대표새)}`);

  /* ⚠ 값이 없어진 것이 있으면 **고치기 전보다 나빠진 것**이다. 그냥 쓰지 않는다 */
  if (사라짐 > 0) console.log(`\n⚠ ${사라짐}건이 있던 값을 잃었다. 파서가 뒷걸음쳤는지 봐야 한다.`);

  if (!쓰기) { console.log('\n(재보기만 했다. 고치려면 --write)'); return; }
  writeFileSync(`${파일}.bak`, readFileSync(파일));
  writeFileSync(파일, 새줄.join('\n') + '\n');
  console.log(`\n✅ 다시 계산해 넣었다. 옛 파일은 ${path.basename(파일)}.bak`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
