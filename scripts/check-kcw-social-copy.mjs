#!/usr/bin/env node
/**
 * check-kcw-social-copy.mjs — **기사와 채널 문안이 한 벌로 맞나.**
 *
 *   node scripts/check-kcw-social-copy.mjs            검사
 *   node scripts/check-kcw-social-copy.mjs --자가시험   자가시험만
 *
 * ── 🔴 왜 만드나 (2026-09-09 19:1x · 5번) ──────────────────────────────────
 * 오늘 재 보니 기사 189편 가운데 **66편에 채널 문안이 없었다.** 밖으로 나갈 길이
 * 없는 기사다. 사장님이 5번에게 못박으신 것이 방문자 늘리기이므로 이것이 바로 걸린다.
 *
 * ⛔ 그런데 내가 그것을 **「하루 10편씩 09-16 까지」라는 손일 계획으로 잡아 두고 있었다.**
 *   실제로는 `node scripts/make-kcw-social.mjs` 한 번이 3초에 189편을 다 냈다.
 *   ⇒ **3초짜리 명령을 이레짜리 손일로 계획한 것이다.**
 *   ⇒ 사장님 필수지시 「사람을 거치는 계획을 세우지 않는다 — 도구·자동화로 푼다」에
 *     정면으로 걸린다. 자가 이미 있는데 자를 안 돌리고 사람 일정을 세웠다.
 *
 * ⭐ 그래서 이 자를 만든다. 다시는 «조용히 밀리지» 않게 `npm test` 가 매번 센다.
 *   빠지면 초록이 안 되고, 고치는 법(한 줄)을 함께 적어 준다.
 *
 * ── 반대쪽도 잰다 — 고아 문안 ─────────────────────────────────────────────
 * 같은 검사에서 **기사가 없는 문안 5편**이 나왔다. 전부 걷어낸 Riot 랭크 사다리 것이었고
 * 본문에 League of Legends LP 수치가 그대로 남아 있었다.
 *   ⚠ 그 주소는 죽지 않았다 — `/esports-games` 로 넘겨진다(사장님이 e스포츠 축은 살리셨다).
 *   ⛔ 그래서 더 위험하다. 올리면 «없는 자료»를 인용하고, 그 수가 없는 지면으로 사람을 보낸다.
 *   ⛔ 「404 가 아니니 괜찮다」로 넘기지 않는다. 넘겨지는 것과 맞는 것은 다르다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 기사방 = 'content/kculturewire';
export const 문안방 = 'docs/소셜-문안-5번';

/** 폴더에서 슬러그만 뽑는다. ⛔ `_` 로 시작하는 것은 사람이 둔 메모라 안 센다 */
export function 슬러그들(이름들) {
  return (이름들 ?? [])
    .filter((f) => typeof f === 'string' && f.endsWith('.md') && !f.startsWith('_'))
    .map((f) => f.replace(/\.md$/, ''))
    .sort();
}

/**
 * 한 벌로 맞나 — 양쪽을 다 낸다.
 * ⛔ 「기사에 문안이 없다」와 「문안에 기사가 없다」는 **다른 사고**다. 합치지 않는다.
 */
export function 짝맞추기(기사슬러그, 문안슬러그) {
  const 문안 = new Set(문안슬러그 ?? []);
  const 기사 = new Set(기사슬러그 ?? []);
  return {
    문안없는기사: (기사슬러그 ?? []).filter((s) => !문안.has(s)),
    기사없는문안: (문안슬러그 ?? []).filter((s) => !기사.has(s)),
  };
}

/* ── 자가시험 ─────────────────────────────────────────────────────────────── */
function 자가시험() {
  let 흠 = 0;
  const 검 = (말, 참) => { if (!참) { 흠 += 1; console.log('  🔴 ' + 말); } else console.log('  ✅ ' + 말); };

  검('.md 만 센다', 슬러그들(['a.md', 'b.txt', 'c.md']).length === 2);
  검('확장자를 뗀다', 슬러그들(['a.md'])[0] === 'a');
  검('⛔ _ 로 시작하는 사람 메모는 안 센다', 슬러그들(['_읽어보기.md', 'a.md']).length === 1);
  검('⛔ 빈 것도 견딘다', 슬러그들(null).length === 0 && 슬러그들([]).length === 0);
  검('이름순으로 낸다', JSON.stringify(슬러그들(['b.md', 'a.md'])) === '["a","b"]');

  /* 🔴 오늘의 사고 둘을 그대로 시험으로 둔다 */
  const r = 짝맞추기(['a', 'b', 'c'], ['a']);
  검('🔴 문안 없는 기사를 잡는다 (오늘 66편이었다)', r.문안없는기사.length === 2);
  검('🔴 기사 없는 문안도 잡는다 (오늘 5편 — 걷어낸 Riot 것)',
    짝맞추기(['a'], ['a', 'zombie']).기사없는문안[0] === 'zombie');
  검('⛔ 두 사고를 «따로» 낸다 — 합치면 무엇을 고칠지 모른다', (() => {
    const x = 짝맞추기(['a', 'b'], ['b', 'z']);
    return x.문안없는기사.length === 1 && x.기사없는문안.length === 1;
  })());
  검('한 벌로 맞으면 둘 다 빈다', (() => {
    const x = 짝맞추기(['a', 'b'], ['a', 'b']);
    return x.문안없는기사.length === 0 && x.기사없는문안.length === 0;
  })());
  검('⛔ 빈 것도 견딘다 (짝맞추기)', (() => {
    const x = 짝맞추기(null, null);
    return x.문안없는기사.length === 0 && x.기사없는문안.length === 0;
  })());

  console.log(`\n기사·채널문안 한 벌 검사 — 자가시험 ${흠 ? '🔴 흠 ' + 흠 + '개' : '전부 통과'}`);
  return 흠;
}

if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 1 : 0);
if (자가시험()) { console.log('🔴 자가시험이 깨졌다 — 멈춘다'); process.exit(1); }

const 읽기 = (p) => (fs.existsSync(path.join(뿌리, p)) ? fs.readdirSync(path.join(뿌리, p)) : null);
const 기사것 = 읽기(기사방);
const 문안것 = 읽기(문안방);

/* ⛔ 폴더가 없으면 「못 쟀다」로 적고 통과시킨다 — 못 잰 하나가 나머지를 가리지 않게 */
if (!기사것 || !문안것) {
  console.log(`\n⬜ 못 쟀다 — ${!기사것 ? 기사방 : 문안방} 폴더가 없다`);
  process.exit(0);
}

const 기사 = 슬러그들(기사것);
const 문안 = 슬러그들(문안것);
const { 문안없는기사, 기사없는문안 } = 짝맞추기(기사, 문안);

console.log(`\n■ 기사와 채널 문안이 한 벌인가 — 기사 ${기사.length}편 · 문안 ${문안.length}편\n`);

if (문안없는기사.length) {
  console.log(`🔴 문안 없는 기사 ${문안없는기사.length}편 — 밖으로 나갈 길이 없다`);
  for (const s of 문안없는기사.slice(0, 8)) console.log(`   · ${s}`);
  if (문안없는기사.length > 8) console.log(`   … 그리고 ${문안없는기사.length - 8}편 더`);
  console.log('   ✅ 고치는 법은 한 줄이다 — node scripts/make-kcw-social.mjs');
  console.log('   ⛔ 「하루 몇 편씩」 손일 계획을 세우지 않는다. 자가 3초에 다 낸다');
}
if (기사없는문안.length) {
  console.log(`\n🔴 기사 없는 문안 ${기사없는문안.length}편 — 올리면 없는 자료를 인용한다`);
  for (const s of 기사없는문안) console.log(`   · ${s}`);
  console.log('   ⚠ 주소가 404 가 아니어도 흠이다 — 넘겨지는 것과 «맞는» 것은 다르다');
  console.log('   ✅ 지운다(git 이력에 남는다) 또는 살아 있는 지면에 맞게 다시 쓴다');
}

if (!문안없는기사.length && !기사없는문안.length) {
  console.log('✅ 한 벌로 맞다 — 문안 없는 기사 0편 · 기사 없는 문안 0편');
  process.exit(0);
}
process.exit(1);
