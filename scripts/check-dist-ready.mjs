#!/usr/bin/env node
/**
 * check-dist-ready.mjs — **dist 를 재는 자들이 「빌드 중」을 못 알아채는 것을 찾아낸다.**
 *
 * ── 결함에 이름을 붙인다 ──────────────────────────────────────
 * **덜 지어진 dist 재기** — 빌드가 도는 동안 dist 는 «비워졌다 다시 채워진다».
 * 그 사이에 재면 자가 거짓말을 한다.
 * ```
 *   빌드 «중»에 재면   거짓 빨강 — 「사이트맵에 없는 지면 1,300장」(사이트맵이 아직 안 써졌다)
 *   빌드 «전»에 재면   거짓 초록 — 옛 dist 가 남아 있어 새 결함이 안 보인다
 * ```
 * 🔴 [2026-08-29] 하루에 세 번 이 자리에 빠졌다. 한 번은 「가장 큰 검색 수요에 답하는 지면이
 *   사이트맵에 빠졌다」는 틀린 발견을 사장님께 올릴 뻔했다 — 소스에는 있었다.
 *
 * ⛔ 사람이 기억해서 지키는 구조를 안 만든다. 자가 스스로 알아채게 한다.
 *
 * 쓰는 법
 *   node scripts/check-dist-ready.mjs --자가시험
 *   node scripts/check-dist-ready.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dist상태, 최소지면 } from './lib/dist-ready.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** dist 를 읽는 자인가 */
export function dist읽나(글) {
  return /dist\/wikitip|dist\\\\wikitip|'dist'|"dist"/.test(String(글 ?? ''));
}

/** 덜 지어진 것을 스스로 알아채나 */
export function 알아채나(글) {
  return /dist-ready|dist상태|못재면멈춘다|빌드중인가/.test(String(글 ?? ''));
}

if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  검('dist 를 읽는 자를 잡는다', dist읽나("readFileSync('dist/wikitip/x.html')"));
  검('안 읽으면 안 잡는다', !dist읽나("readFileSync('src/data/x.json')"));
  검('⛔ 빈 것도 안 터진다', !dist읽나(undefined) && !알아채나(null));
  검('알아채는 자를 안다', 알아채나("import { 못재면멈춘다 } from './lib/dist-ready.mjs'"));
  검('예전 방식(빌드중인가)도 알아챈 것으로 센다', 알아채나('if (빌드중인가(깨진수, 지면수))'));
  검('아무것도 없으면 못 알아채는 것', !알아채나('const x = 1;'));

  /* dist상태 자체 — 가짜 파일자를 넣어 «못 쟀다»가 나오나 본다 */
  const 없는자 = { existsSync: () => false, readdirSync: () => [] };
  const a = dist상태('/뿌리', 없는자);
  검('⛔ dist 가 없으면 못 잰다', a.잴수있나 === false && /dist 가 없다/.test(a.까닭));

  const 얇은자 = {
    existsSync: () => true,
    readdirSync: () => [{ name: 'a.html', isDirectory: () => false }],
  };
  const b = dist상태('/뿌리', 얇은자);
  검('⛔ 지면이 얇으면 못 잰다', b.잴수있나 === false && b.지면수 === 1);
  검('까닭에 수를 적는다', /1장뿐/.test(b.까닭));

  const 두꺼운자 = {
    existsSync: () => true,
    readdirSync: () => Array.from({ length: 최소지면 + 1 },
      (_, i) => ({ name: `p${i}.html`, isDirectory: () => false })),
  };
  const c = dist상태('/뿌리', 두꺼운자);
  검('✅ 온전하면 잴 수 있다', c.잴수있나 === true && c.까닭 === null);
  검('지면 수를 알려 준다', c.지면수 === 최소지면 + 1);

  if (실패.length) {
    console.error(`❌ 자가시험 실패 ${실패.length}\n${실패.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log('✅ check-dist-ready 자가시험 통과 (11)');
  process.exit(0);
}

/* ── 지금 상태부터 ── */
const s = dist상태(뿌리);
console.log('■ 지금 dist 를 재도 되나\n');
console.log(s.잴수있나
  ? `   ✅ 재도 된다 — dist/wikitip 지면 ${s.지면수.toLocaleString()}장`
  : `   ⬜ 재면 안 된다 — ${s.까닭}`);

/* ── 자들을 훑는다 ── */
const 방 = path.join(뿌리, 'scripts');
const 나 = path.basename(fileURLToPath(import.meta.url));
const 못알아채는것 = [];
let 알아채는수 = 0;
for (const f of fs.readdirSync(방).filter((x) => x.endsWith('.mjs') && x !== 나)) {
  const 글 = fs.readFileSync(path.join(방, f), 'utf8');
  if (!dist읽나(글)) continue;
  if (알아채나(글)) 알아채는수 += 1;
  else 못알아채는것.push(f);
}

console.log(`\n   dist 를 읽는 자 ${알아채는수 + 못알아채는것.length}개`
  + ` · ✅ 덜 지어진 것을 알아채는 것 ${알아채는수}개`
  + ` · ⛔ 못 알아채는 것 ${못알아채는것.length}개`);

if (못알아채는것.length) {
  console.log('\n■ ⛔ 빌드 도중에 재면 «거짓 빨강»이나 «거짓 초록»을 내는 자들');
  for (const f of 못알아채는것) console.log(`   · ${f}`);
  console.log('\n   고치는 법 — 맨 위에 한 줄:');
  console.log("     import { 못재면멈춘다 } from './lib/dist-ready.mjs';");
  console.log("     못재면멈춘다(뿌리, '자 이름');");
}

console.log('\n⛔ 「못 쟀다」는 «통과»도 «실패»도 아니다. 셋째 칸으로 적는다.');
process.exit(0);
