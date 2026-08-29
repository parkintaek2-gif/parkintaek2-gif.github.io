#!/usr/bin/env node
/**
 * check-kcw-silent-video.mjs — **무성 영상을 찾아낸다.**
 *
 * ── 사장님 지시 (2026-08-29) ──────────────────────────────────
 * > 「**무성 콘텐트 다신 만들지 말 것**」
 * > 「영상은 퀄러티 있게해야지...음성도 있어야지....자연스러운 목소리와 음성, 또는
 * >  배경음악을 너희들이 직접 만들어서 사용하고+추가 설명 목소리」
 *
 * ── 결함에 이름을 붙인다 ──────────────────────────────────────
 * **무음 트랙** — 우리 영상 생성기들은 `anullsrc`(빈 소리)를 «일부러» 붙이고 있었다.
 * ```
 *   execFileSync(ff, [..., '-f', 'lavfi', '-i', 'anullsrc=...', ...])
 * ```
 * 그래서 파일에는 소리 «트랙»이 있고 재생기도 소리가 있다고 말하는데, 실제 음량은 −91 dB —
 * 사람 귀에는 완전한 무음이다.
 * ⛔ 「소리 트랙이 있나」로 검사하면 **전부 통과한다.** 음량을 «재야» 드러난다.
 *
 * 🔴 [2026-08-29] 이 자를 세우고서야 «실제 수»를 알았다.
 * ```
 *   소리 있음 10편   −14~−17 dB · 2026-08-21 에 만든 것들
 *   무음      16편   −91 dB
 * ```
 * ⛔ 나는 그 전에 「우리 스물다섯 편이 «전부» 무성」이라고 전 유닛에 알렸다. **틀렸다.**
 *   재 보지 않고 「전부」라고 적었다. 세어 보기 전에 크게 말하지 않는다.
 *
 * ── ⛔ 이 자가 지키는 것 ──────────────────────────────────────
 * ⛔ 트랙 «있음»으로 통과시키지 않는다. 평균 음량을 재서 판정한다.
 * ⛔ 못 잰 것을 「무음」으로도 「소리 있음」으로도 적지 않는다 — 셋째 칸이다.
 * ⚠ 이 자는 「소리가 «좋은가»」를 못 잰다. 「소리가 «있나»」만 잰다.
 *
 * 쓰는 법
 *   node scripts/check-kcw-silent-video.mjs --자가시험
 *   node scripts/check-kcw-silent-video.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import ffmpeg경로 from 'ffmpeg-static';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 영상방 = path.join(뿌리, 'public/wikitip/video');

/**
 * 이 아래면 사람 귀에 «없는» 소리다.
 * ⚠ 우리 소리판 실측이 평균 −23 dB 였고, anullsrc 무음판은 −91 dB 였다.
 *   그 사이를 넉넉히 갈라 −60 으로 둔다. 아주 여린 음악도 −60 은 넘는다.
 */
export const 무음선 = -60;

/** ffmpeg 이 낸 글에서 평균 음량. ⛔ 못 읽으면 null — 0 이 아니다 */
export function 평균음량(글) {
  const m = String(글 ?? '').match(/mean_volume:\s*(-?[\d.]+)\s*dB/);
  return m ? Number(m[1]) : null;
}

/** 소리 트랙이 «있다»고 적혀 있나 — ⛔ 이것만으로 통과시키지 않는다 */
export function 소리트랙있나(글) {
  return /Stream #\d+:\d+[^\n]*Audio:/.test(String(글 ?? ''));
}

/**
 * 한 편을 판정한다.
 * @returns 'ㅁ무음' | '소리있음' | '트랙없음' | '못쟀다'
 */
export function 판정(글, 선 = 무음선) {
  if (!소리트랙있나(글)) return '트랙없음';
  const v = 평균음량(글);
  if (v == null) return '못쟀다';
  return v <= 선 ? '무음' : '소리있음';
}

if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  const 소리 = 'Stream #0:1[0x2](und): Audio: aac (LC)\nmean_volume: -23.3 dB';
  const 무음 = 'Stream #0:1[0x2](und): Audio: aac (LC)\nmean_volume: -91.0 dB';
  const 트랙없음 = 'Stream #0:0[0x1](und): Video: h264';

  검('평균 음량을 읽는다', 평균음량(소리) === -23.3);
  검('음수를 읽는다', 평균음량(무음) === -91);
  검('⛔ 못 읽으면 null — 0 이 아니다', 평균음량('아무것도 없다') === null && 평균음량(undefined) === null);

  검('소리 트랙을 알아본다', 소리트랙있나(소리) === true);
  검('없으면 없다고 한다', 소리트랙있나(트랙없음) === false);

  검('🔴 트랙은 있는데 −91 dB 면 «무음»이다', 판정(무음) === '무음');
  검('✅ −23 dB 면 소리가 있다', 판정(소리) === '소리있음');
  검('트랙이 아예 없으면 그렇게 적는다', 판정(트랙없음) === '트랙없음');
  검('⛔ 음량을 못 읽으면 «못쟀다» — 무음으로 단정하지 않는다',
    판정('Stream #0:1: Audio: aac') === '못쟀다');
  검('선을 넘기면 소리있음', 판정('Audio: aac\nmean_volume: -59.9 dB'.replace('Audio', 'Stream #0:1: Audio')) === '소리있음');
  검('선에 딱 걸리면 무음 쪽', 판정('Stream #0:1: Audio: x\nmean_volume: -60.0 dB') === '무음');
  검('⛔ 빈 것도 안 터진다', 판정(undefined) === '트랙없음');

  if (실패.length) {
    console.error(`❌ 자가시험 실패 ${실패.length}\n${실패.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log('✅ check-kcw-silent-video 자가시험 통과 (12)');
  process.exit(0);
}

/* ── 실제로 잰다 ── */
if (!fs.existsSync(영상방)) {
  console.log(`⬜ 못 쟀다 — ${영상방} 이 없다`);
  process.exit(0);
}
const 것들 = fs.readdirSync(영상방).filter((f) => f.endsWith('.mp4')).sort();
if (!것들.length) {
  console.log('⬜ 못 쟀다 — 영상이 하나도 없다');
  process.exit(0);
}

const 셈 = { 무음: [], 소리있음: [], 트랙없음: [], 못쟀다: [] };
for (const f of 것들) {
  const r = spawnSync(ffmpeg경로, ['-i', path.join(영상방, f), '-af', 'volumedetect', '-f', 'null', '-'],
    { encoding: 'utf8' });
  const 글 = String(r.stderr ?? '');
  const p = 판정(글);
  셈[p].push({ f, dB: 평균음량(글) });
}

console.log('■ 무성 영상 검사 — 「소리 트랙이 있나」가 아니라 「소리가 «나나»」를 잰다\n');
console.log(`   영상 ${것들.length}편`
  + ` · ✅ 소리 있음 ${셈.소리있음.length}편`
  + ` · 🔴 무음 ${셈.무음.length}편`
  + ` · ⛔ 트랙 없음 ${셈.트랙없음.length}편`
  + ` · ⬜ 못 쟀다 ${셈.못쟀다.length}편`);

if (셈.소리있음.length) {
  console.log('\n■ ✅ 소리가 나는 것');
  for (const x of 셈.소리있음) console.log(`   ${String(x.dB).padStart(7)} dB  ${x.f}`);
}
if (셈.무음.length) {
  console.log('\n■ 🔴 무음 — 사장님 「무성 콘텐트 다신 만들지 말 것」에 걸린다');
  for (const x of 셈.무음) console.log(`   ${String(x.dB).padStart(7)} dB  ${x.f}`);
  console.log('\n   ⛔ 이 편들을 «지우지 않는다» — 사장님 「삭제하지 말고 소리만 입혀서 추가로 배포해」.');
  console.log('   ✅ 하루 한 편씩 소리를 입혀 새 제목으로 낸다:');
  console.log('     node scripts/make-kcw-sound.mjs --set <이름> --목소리 en-US-AndrewNeural');
  console.log('   ⚠ 먼저 src/data/kcw-narration.json 에 그 편의 «대본»을 적는다. 자가 지어내지 않는다.');
}
if (셈.못쟀다.length) {
  console.log('\n■ ⬜ 못 쟀다 — 눈으로 봐야 한다');
  for (const x of 셈.못쟀다) console.log(`   ${x.f}`);
}

console.log('\n⛔ 「소리 트랙이 있나」로 검사하면 전부 통과한다 — 생성기가 anullsrc(빈 소리)를 붙이기 때문이다.');
console.log('   음량을 «재야» 드러난다. 무음판 −91 dB · 우리 소리판 −23 dB.');
process.exit(0);
