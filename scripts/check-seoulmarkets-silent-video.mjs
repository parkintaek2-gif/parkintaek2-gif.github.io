#!/usr/bin/env node
/**
 * check-seoulmarkets-silent-video.mjs — **public/video 에 «무성» 영상이 서 있나.**
 *
 * ── 왜 (2026-08-29 사장님) ─────────────────────────────────────────
 * 「무성 콘텐트 다신 만들지 말 것 · 무음 영상 하루 1개씩 소리 입혀 올려」. 규칙을 메모가
 * 아니라 «검사»로 둔다(5번 check-kcw-silent-video 의 SeoulMarkets 판). 진척(몇/몇 편이
 * 소리가 붙었나)을 숫자로 본다. ⛔ 못 잰 것은 무음으로도 소리로도 안 센다 — 셋째 칸.
 *
 * 무음 판정: 오디오 스트림이 없거나 평균 소리크기 < -80dB(anullsrc 같은 빈 소리).
 *
 * 쓰는 법  node scripts/check-seoulmarkets-silent-video.mjs [--자세히]
 *          node scripts/check-seoulmarkets-silent-video.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const 뿌리 = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');

/** ffmpeg -i 출력에 오디오 스트림 줄이 있나 */
export function 오디오있나(stderr) { return /Stream #\d+:\d+.*: Audio:/.test(String(stderr)); }
/** volumedetect mean_volume(dB). 없으면 null */
export function 평균dB읽기(stderr) { const m = String(stderr).match(/mean_volume:\s*(-?\d+(?:\.\d+)?)\s*dB/); return m ? parseFloat(m[1]) : null; }
/**
 * 한 편 판정: '무음' | '소리' | '못잼'. ⛔ 짐작으로 채우지 않는다.
 * 오디오 스트림 없음 = 무음. 있으면 dB 로 가른다(<-80 무음). dB 못 읽으면 못잼.
 */
export function 판정(오디오, dB, 문턱 = -80) {
  if (!오디오) return '무음';
  if (dB == null) return '못잼';
  return dB < 문턱 ? '무음' : '소리';
}

if (process.argv.includes('--자가시험') || process.argv.includes('--selftest')) {
  let 셈 = 0; const 본다 = (m, ok) => { 셈++; console.log(ok ? '✅' : '🔴', m); if (!ok) process.exitCode = 1; };
  본다('① 오디오 스트림 인식', 오디오있나('Stream #0:1[0x2]: Audio: aac (LC)') === true);
  본다('② 비디오만이면 오디오 없음', 오디오있나('Stream #0:0: Video: h264') === false);
  본다('③ mean_volume 파싱', 평균dB읽기('mean_volume: -24.3 dB') === -24.3);
  본다('④ dB 없으면 null', 평균dB읽기('nope') === null);
  본다('⑤ 오디오 없으면 무음', 판정(false, null) === '무음');
  본다('⑥ 빈소리(-91)면 무음', 판정(true, -91) === '무음');
  본다('⑦ 실제 소리(-24)면 소리', 판정(true, -24) === '소리');
  본다('⑧ ⛔ 오디오는 있는데 dB 못읽으면 못잼(0으로 안 채움)', 판정(true, null) === '못잼');
  console.log(`\n${process.exitCode ? '❌' : '✅'} check-seoulmarkets-silent-video 자가시험 (${셈})`);
  process.exit();
}

const ffmpeg = require('ffmpeg-static');
const 방 = path.join(뿌리, 'public', 'video');
if (!fs.existsSync(방)) { console.log('⬜ public/video 가 없다 — 못 쟀다'); process.exit(0); }
const 자세히 = process.argv.includes('--자세히');
// SeoulMarkets 영상 = korea-*.mp4 (기사 슬러그). 다른 유닛 영상 섞이면 제외.
const 영상들 = fs.readdirSync(방).filter((f) => f.endsWith('.mp4') && f.startsWith('korea-')).sort();

let 무음 = [], 소리 = 0, 못잼 = [];
for (const f of 영상들) {
  const p = path.join(방, f);
  const info = spawnSync(ffmpeg, ['-i', p], { encoding: 'utf8' }).stderr || '';
  const 오디오 = 오디오있나(info);
  let dB = null;
  if (오디오) dB = 평균dB읽기(spawnSync(ffmpeg, ['-i', p, '-af', 'volumedetect', '-f', 'null', '-'], { encoding: 'utf8' }).stderr || '');
  const r = 판정(오디오, dB);
  if (r === '무음') 무음.push(f); else if (r === '소리') 소리 += 1; else 못잼.push(f);
}

console.log('\nSeoulMarkets — public/video 무성 검사\n');
console.log(`  영상 ${영상들.length}편 · ✅ 소리 ${소리} · 🔴 무음 ${무음.length}` + (못잼.length ? ` · ⬜ 못잼 ${못잼.length}` : ''));
console.log(`  진척: ${소리}/${영상들.length} 편에 소리가 붙었다 (하루 1편씩 make-seoulmarkets-video-sound.mjs)`);
if (무음.length && 자세히) { console.log('\n  🔴 아직 무음:'); for (const f of 무음.slice(0, 60)) console.log('     ' + f); }
if (못잼.length) { console.log('\n  ⬜ 못 잰 것(오디오는 있으나 dB 못 읽음):'); for (const f of 못잼) console.log('     ' + f); }
process.exitCode = 무음.length ? 1 : 0;
