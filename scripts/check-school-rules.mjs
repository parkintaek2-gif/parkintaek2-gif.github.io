#!/usr/bin/env node
/**
 * 백년지도 **학교 자료 규칙을 안 부르는 스크립트**를 잡는다.
 *
 *   node scripts/check-school-rules.mjs
 *
 * ## 🔴 왜 만드나 (2026-08-07 · 5번이 겪은 것 · 2번 지시)
 *
 *   5번: *「규칙을 한 곳에 둬도 **다음 스크립트가 안 부를 수** 있다」*
 *
 *   규칙을 `src/lib/school-rules.ts` 한 곳에 모았다. 그런데 **그것만으로는 안 끝난다** —
 *   내일 새 수집기를 만들면서 `const 최소분모 = 30` 을 또 손으로 적으면 아무도 모른다.
 *   오류가 안 뜨고 숫자도 그럴듯하다. **오늘 내가 세 번 그렇게 했다.**
 *
 *   그래서 **한 곳에 두는 것으로 끝내지 않고, 안 부르면 잡히게** 한다.
 *
 * ## 무엇을 잡나
 *
 *   ① 학교 수집기·검사가 `school-rules` 를 **안 부르면** 잡는다
 *   ② 규칙 값(30)을 **손으로 다시 적으면** 잡는다 — `= 30` 꼴
 *   ③ 방송통신·특수학교 거르기를 **정규식으로 다시 적으면** 잡는다
 *
 * ⛔ 이 검사가 **스스로 헛도는지**도 잡는다 — 아래 `자가시험` 이 일부러 어긴 코드를 넣어 본다.
 *   안 잡히면 검사 자체가 실패로 끝난다. 오늘 다른 검사에서 그걸로 한 번 속았다.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(
  path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'),
  '..',
);

/** 이 규칙을 따라야 하는 파일 — 학교 자료를 만들거나 재는 것 */
const 봐야할것 = [
  'scripts/collect-alimi-dropout.mjs',
  'scripts/collect-alimi-career.mjs',
  'scripts/collect-alimi-class-size.mjs',
  'scripts/collect-kosis-voc-series.mjs',
  'scripts/check-100yearmap-launch.mjs',
];

/** 주석은 뺀다 — 주석에 적힌 「30」은 설명이지 코드가 아니다 */
const 코드만 = (t) =>
  t.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');

const 규칙 = [
  {
    이름: 'school-rules 를 부르나',
    잡기: (코드) => !/from '\.\.\/src\/lib\/school-rules\.ts'/.test(코드),
    말: 'src/lib/school-rules.ts 를 import 하지 않는다',
  },
  {
    이름: '분모 30 을 손으로 적었나',
    잡기: (코드) => /(최소|작은)[가-힣]*\s*=\s*30\b/.test(코드),
    말: '`= 30` 을 직접 적었다. `최소분모` 를 불러 쓴다',
  },
  {
    이름: '방송통신을 정규식으로 다시 적었나',
    잡기: (코드) => /\/방송통신\/\s*\.test/.test(코드),
    말: '`방송통신인가()` 를 불러 쓴다',
  },
];

/* ── 자가시험 — 이 검사가 헛돌지 않는지 먼저 본다 ─────────── */
const 나쁜코드 = `
  import fs from 'node:fs';
  const 최소재학생 = 30;
  if (/방송통신/.test(r.SCHUL_NM)) continue;
`;
const 좋은코드 = `
  import { 최소분모, 방송통신인가 } from '../src/lib/school-rules.ts';
  const 최소재학생 = 최소분모;
  if (방송통신인가(r.SCHUL_NM)) continue;
`;
const 자가 = [];
for (const r of 규칙) {
  if (!r.잡기(코드만(나쁜코드))) 자가.push(`「${r.이름}」이 **나쁜 코드를 못 잡는다**`);
  if (r.잡기(코드만(좋은코드))) 자가.push(`「${r.이름}」이 **좋은 코드를 헛잡는다**`);
}
if (자가.length) {
  console.log('⛔ 검사 자체가 고장났다 — 고치기 전에는 이 결과를 믿으면 안 된다');
  자가.forEach((x) => console.log('   ' + x));
  process.exit(1);
}

/* ── 실제로 잰다 ──────────────────────────────────────────── */
const 걸림 = [];
let 본것 = 0;
for (const 상대 of 봐야할것) {
  const p = path.join(ROOT, 상대);
  if (!fs.existsSync(p)) {
    걸림.push(`${상대} — 파일이 없다(이름이 바뀌었으면 이 검사 목록도 고친다)`);
    continue;
  }
  본것++;
  const 코드 = 코드만(fs.readFileSync(p, 'utf8'));
  for (const r of 규칙) if (r.잡기(코드)) 걸림.push(`${상대} — ${r.말}`);
}

console.log(`학교 자료 규칙 검사 — 파일 ${본것}개 (자가시험 ${규칙.length * 2}건 통과)`);
if (걸림.length) {
  console.log(`⛔ ${걸림.length}건`);
  걸림.forEach((x) => console.log('   ' + x));
  process.exit(1);
}
console.log('✅ 규칙을 손으로 다시 적은 곳 0건 · 전부 한 곳을 부른다');
