#!/usr/bin/env node
/**
 * 아카이빙-되받기.mjs — 출처가 «늦게» 낸 날을 자동으로 주워 온다
 * ─────────────────────────────────────────────────────────────────────────────
 * [왜 만들었나 · 2026-09-20 실측]
 *   빠짐검사가 09-18 자 다섯 갈래(주식·채권·일반상품·파생·지수)를 구멍으로 잡고 있었다.
 *   우물을 직접 두드려 갈랐다 —
 *
 *     주식시세  09-16 totalCount 2871 · 09-17 2870 · 09-18 **0** · 09-19 0
 *     지수시세  09-16 171 · 09-17 171 · 09-18 **0** · 09-19 0
 *
 *   그런데 같은 09-18 이 broker·dart-breaking·dart-financials·hankyung-consensus
 *   폴더에는 «있다». 곧 그날 장은 섰고, **공공데이터포털이 아직 안 낸 것**이다.
 *   ⇒ 우리 코드 문제가 아니다. 그리고 우리가 더 할 것도 없다 — «나중에 다시 묻는 것»만 빼고.
 *
 * [무엇이 문제였나] 날마다 도는 수집기는 «어제 하루»만 받는다. 어제치가 그날 안 와 있으면
 *   그 날짜는 영영 안 물어본다. 출처가 이틀 뒤에 내놓아도 우리는 모른다.
 *   ⇒ 이 자가 «지난 며칠»을 통째로 다시 묻는다. 이미 있는 날은 수집기가 스스로 건너뛴다
 *     (실측: 09-17 을 다시 부르니 「빈 날 0」으로 지나갔다). 그래서 날마다 돌려도 싸다.
 *
 * ⛔ 이것으로 「소급이 된다」고 읽지 말 것. 목표주가·신문 제목처럼 창이 닫히는 자료는
 *   여전히 그날 안 받으면 끝이다. 이 자가 건지는 것은 «출처가 늦게 내는» 것뿐이다.
 *
 * 쓰는 법
 *   node scripts/아카이빙-되받기.mjs              지난 7일을 다시 묻는다
 *   node scripts/아카이빙-되받기.mjs --날수 14
 *   node scripts/아카이빙-되받기.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const 여기 = path.dirname(fileURLToPath(import.meta.url));
const 뿌리 = path.join(여기, '..');

/** --from/--to 를 받는 자들만 넣는다. 안 받는 자를 넣으면 «어제»만 또 받는다 */
export const 되받을자 = [
  'collect-stock-prices.mjs',
  'collect-bonds.mjs',
  'collect-indices.mjs',
  'collect-derivatives.mjs',
  'collect-commodities.mjs',
];

/** ⛔ toISOString() 을 쓰지 않는다 — 이 PC 는 이미 KST 다. UTC 면 새벽에 하루가 어긋난다 */
export function 날짜숫자(d) {
  const p = (n) => String(n).padStart(2, '0');
  return String(d.getFullYear()) + p(d.getMonth() + 1) + p(d.getDate());
}

/** 오늘은 뺀다 — 장이 아직 안 끝났을 수 있고, 어차피 날마다 도는 자가 받는다 */
export function 창(날수, 이제 = new Date()) {
  const 끝 = new Date(이제.getFullYear(), 이제.getMonth(), 이제.getDate() - 1);
  const 첫 = new Date(이제.getFullYear(), 이제.getMonth(), 이제.getDate() - 날수);
  return { 첫: 날짜숫자(첫), 끝: 날짜숫자(끝) };
}

export function 날수읽기(인자) {
  const i = 인자.indexOf('--날수');
  const n = i > -1 ? Number(인자[i + 1]) : 7;
  if (!Number.isInteger(n) || n < 1 || n > 60) return 7;   // 터무니없는 값은 안 받는다
  return n;
}

function 돌린다(날수) {
  const { 첫, 끝 } = 창(날수);
  console.log('■ 아카이빙 되받기 — ' + 첫 + ' ~ ' + 끝 + ' (지난 ' + 날수 + '일)');
  console.log('   ⭐ 이미 있는 날은 수집기가 스스로 건너뛴다. 출처가 «늦게» 낸 날만 주워 온다\n');
  let 흠 = 0;
  for (const 자 of 되받을자) {
    const 길 = path.join(여기, 자);
    if (!fs.existsSync(길)) { console.log('   ⬜ ' + 자 + ' — 자가 없다'); continue; }
    const r = spawnSync(process.execPath, [길, '--from', 첫, '--to', 끝],
      { cwd: 뿌리, encoding: 'utf8', timeout: 900000 });
    const 글 = String(r.stdout ?? '') + String(r.stderr ?? '');
    const 합 = (글.match(/합계[^\n]*/) || ['(합계 줄을 못 찾았다)'])[0].trim();
    if (r.status !== 0) 흠 += 1;
    console.log('   ' + (r.status === 0 ? '✅' : '🔴') + ' ' + 자.padEnd(26) + 합.slice(0, 80));
  }
  console.log('\n   ⛔ 「되받기가 돈다」를 「소급이 된다」로 읽지 않는다 —'
    + ' 목표주가·신문 제목은 그날 안 받으면 끝이다');
  return 흠 ? 1 : 0;
}

/* ── 자가시험 ─────────────────────────────────────────────────────── */
function 자가시험() {
  let 산 = 0; let 죽 = 0;
  const 재다 = (말, 참) => { if (참) { 산 += 1; } else { 죽 += 1; console.log('   ✕ ' + 말); } };

  재다('날짜를 YYYYMMDD 여덟 자로 만든다', 날짜숫자(new Date(2026, 8, 5)) === '20260905');
  재다('새벽 1시도 그날이다 (toISOString 이면 전날이 된다)',
    날짜숫자(new Date(2026, 8, 20, 1, 5)) === '20260920');

  const c = 창(7, new Date(2026, 8, 20));
  재다('창의 끝은 «어제»다 — 오늘은 안 받는다', c.끝 === '20260919');
  재다('창의 첫날은 7일 전이다', c.첫 === '20260913');
  재다('달을 넘어도 맞는다', 창(5, new Date(2026, 9, 2)).첫 === '20260927');
  재다('해를 넘어도 맞는다', 창(3, new Date(2026, 0, 2)).첫 === '20251230');

  재다('날수를 안 주면 7일', 날수읽기([]) === 7);
  재다('날수를 주면 그만큼', 날수읽기(['--날수', '14']) === 14);
  재다('터무니없는 날수는 7로 되돌린다', 날수읽기(['--날수', '999']) === 7);
  재다('숫자가 아니면 7로 되돌린다', 날수읽기(['--날수', '어제']) === 7);

  재다('되받을 자가 다 있다',
    되받을자.every((f) => fs.existsSync(path.join(여기, f))));
  재다('되받을 자가 다 --from 을 받는다 — 안 받으면 «어제»만 또 받는다',
    되받을자.every((f) => /'--from'|"--from"/.test(fs.readFileSync(path.join(여기, f), 'utf8'))));
  재다('되받을 자가 겹치지 않는다', new Set(되받을자).size === 되받을자.length);
  재다('⛔ 멈춰 세운 자는 넣지 않는다',
    되받을자.every((f) => !/멈춰 세운 수집기/.test(fs.readFileSync(path.join(여기, f), 'utf8'))));

  console.log('   자가시험 ' + 산 + '개 통과' + (죽 ? ' · ' + 죽 + '개 실패' : ''));
  return 죽 === 0;
}

const 인자 = process.argv.slice(2);
if (인자.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);
else process.exit(돌린다(날수읽기(인자)));
